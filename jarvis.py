"""
Jarvis Ultra Voice Assistant — single-file (Vosk preferred + fallback)
---------------------------------------------------------------
Copy this file to your project as `jarvis.py` and run: python jarvis.py

Features:
- Low-latency wake-word detection with fuzzy matching (SequenceMatcher).
- Prefers Vosk offline recognizer (fast, low-latency). Falls back to speech_recognition (Google) if Vosk unavailable.
- Plays greeting sound (greet.wav) on activation and random confirmation sound (ok1/ok2/ok3.wav) after commands.
- Loads commands from commands.json (auto-creates example if missing).
- Auto-attempts pip install of missing Python packages (best-effort). Prints guidance for manual steps if needed.
- Cross-platform: Windows/macOS/Linux support for opening URLs/paths and shell commands.
- Graceful error handling (won't crash on silence or recognition errors).

Notes:
- Some packages (PyAudio, portaudio) may require OS-level installers. See printed hints if auto-install fails.
- For lowest latency, Vosk offline model is recommended. The script can attempt to download a small Vosk model automatically.

Author: Floo Meer (adapted)
"""

import os
import sys
import time
import json
import random
import threading
import subprocess
import zipfile
import urllib.request
from pathlib import Path
from difflib import SequenceMatcher

# Allow a test mode toggle via env var or --test CLI flag
if os.environ.get('JARVIS_TEST_MODE') == '1' or '--test' in sys.argv:
    globals()['__JARVIS_TEST_MODE__'] = True
    # optional canned text via env
    globals()['__JARVIS_TEST_TEXT__'] = os.environ.get('JARVIS_TEST_TEXT', 'automated test transcript')

# --------------------------- CONFIG (tweakable) ---------------------------
PROJECT_DIR = Path(__file__).parent
SOUNDS_DIR = PROJECT_DIR / "sounds"
COMMANDS_FILE = PROJECT_DIR / "commands.json"
MODELS_DIR = PROJECT_DIR / "models"
VOSK_MODEL_NAME = "vosk-model-small-en-us-0.15"
VOSK_MODEL_DIR = MODELS_DIR / VOSK_MODEL_NAME
VOSK_ZIP_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
VOSK_ZIP_NAME = "vosk-model-small-en-us-0.15.zip"

# Wake / response settings (aggressive for low-latency)
WAKE_WORDS = ["jarvis", "hey jarvis", "jervis", "hey jervis"]
WAKE_THRESHOLD = 0.58         # fuzzy threshold (lower -> more permissive)
DEBOUNCE_SEC = 0.5            # minimal time between activations
RESPONSE_DELAY = 0.12         # short pause after wake before listening command
COMMAND_MAX_SECONDS = 4.0     # how long to capture the command after wake
SAMPLE_RATE = 16000

# Sound files
GREETING_SOUND = SOUNDS_DIR / "greet.wav"
OK_SOUNDS = [SOUNDS_DIR / "ok1.wav", SOUNDS_DIR / "ok2.wav", SOUNDS_DIR / "ok3.wav"]

# Auto-install packages list (names for pip)
PIP_PACKAGES = [
    "vosk",           # offline ASR
    "sounddevice",    # audio capture for Vosk
    "numpy",
    "simpleaudio",    # audio playback
    "playsound==1.2.2", # fallback playback
    "SpeechRecognition",
    "webrtcvad"       # optional VAD
]

# --------------------------- Helper: auto-install -------------------------

def pip_install(packages):
    """Try to pip install packages (best-effort)."""
    try:
        for pkg in packages:
            print(f"[installer] Installing {pkg} ...")
            cmd = [sys.executable, "-m", "pip", "install", pkg]
            subprocess.check_call(cmd)
        return True
    except Exception as e:
        print(f"[installer] pip install failed: {e}")
        return False

# Try imports and auto-install missing (best-effort)
_missing = []
try:
    import vosk
except Exception:
    _missing.append("vosk")
try:
    import sounddevice as sd
except Exception:
    _missing.append("sounddevice")
try:
    import numpy as _np
except Exception:
    _missing.append("numpy")
try:
    import simpleaudio as sa  # type: ignore
except Exception:
    sa = None
    _missing.append("simpleaudio")
# for fallback
try:
    import speech_recognition as sr  # type: ignore
except Exception:
    sr = None
    _missing.append("SpeechRecognition")
# playsound fallback
try:
    from playsound import playsound  # type: ignore
except Exception:
    playsound = None
# webrtcvad optional
try:
    import webrtcvad  # type: ignore
except Exception:
    webrtcvad = None
    _missing.append("webrtcvad")

if _missing:
    uniq = []
    for m in _missing:
        nm = m
        if nm not in uniq:
            uniq.append(nm)
    print("[installer] Missing packages detected:", uniq)
    pip_ok = pip_install(uniq)
    if pip_ok:
        # try to re-import what we can
        try:
            import vosk
            import sounddevice as sd
            import numpy as _np
        except Exception:
            pass
        try:
            import simpleaudio as sa  # type: ignore
        except Exception:
            sa = None
        try:
            import speech_recognition as sr  # type: ignore
        except Exception:
            sr = None
        try:
            from playsound import playsound  # type: ignore
        except Exception:
            playsound = None
        try:
            import webrtcvad  # type: ignore
        except Exception:
            webrtcvad = None

# --------------------------- Utilities: sound, commands -------------------------

def play_sound(path: Path, blocking=False):
    if not path.exists():
        return
    try:
        if 'sa' in globals() and sa:
            w = sa.WaveObject.from_wave_file(str(path))
            p = w.play()
            if blocking:
                p.wait_done()
        elif playsound:
            # playsound is blocking; run it in thread to mimic non-blocking
            threading.Thread(target=playsound, args=(str(path),), daemon=True).start()
        else:
            print(f"[sound] No playback backend. Put simpleaudio or playsound installed.")
    except Exception as e:
        print(f"[sound] Playback error: {e}")


def load_or_create_commands():
    if not COMMANDS_FILE.exists():
        example = {
            "open browser": {"type": "builtin", "action": "open_browser"},
            "open google": {"type": "builtin", "action": "open_url", "args": ["https://www.google.com"]},
            "open youtube": {"type": "builtin", "action": "open_url", "args": ["https://www.youtube.com"]},
            "launch steam": {"type": "shell", "action": "start steam"},
            "open discord": {"type": "shell", "action": "start discord"}
        }
        COMMANDS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(COMMANDS_FILE, "w", encoding="utf-8") as f:
            json.dump(example, f, indent=4, ensure_ascii=False)
        print(f"[jarvis] Created example commands.json at {COMMANDS_FILE}")
    with open(COMMANDS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            print("[jarvis] commands.json malformed — recreating example")
            COMMANDS_FILE.unlink(missing_ok=True)
            return load_or_create_commands()

commands = load_or_create_commands()


def fuzzy_ratio(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def match_command(text):
    t = text.lower()
    # direct containment
    for trig, entry in commands.items():
        if trig.lower() in t:
            return entry, trig
    # fuzzy best
    best = (0.0, None, None)
    for trig, entry in commands.items():
        r = fuzzy_ratio(t, trig.lower())
        if r > best[0]:
            best = (r, entry, trig)
    if best[0] >= 0.45:
        return best[1], best[2]
    return None, None


def execute_entry(entry):
    ctype = entry.get("type", "shell")
    action = entry.get("action", "")
    args = entry.get("args", [])
    print(f"[jarvis] Execute: {ctype} -> {action} {args}")
    try:
        if ctype == "builtin":
            if action == "open_browser":
                import webbrowser
                webbrowser.open("https://www.google.com")
            elif action == "open_url":
                import webbrowser
                url = args[0] if args else "https://www.google.com"
                webbrowser.open(url)
            elif action == "open_path":
                path = args[0] if args else None
                if path:
                    if sys.platform.startswith("win"):
                        os.startfile(path)
                    elif sys.platform.startswith("darwin"):
                        subprocess.Popen(["open", path])
                    else:
                        subprocess.Popen(["xdg-open", path])
            else:
                print(f"[jarvis] Unknown builtin action: {action}")
        else:
            if sys.platform.startswith("win"):
                subprocess.Popen(action, shell=True)
            else:
                subprocess.Popen(action, shell=True, executable="/bin/bash")
    except Exception as e:
        print(f"[jarvis] Execution error: {e}")

# --------------------------- Vosk model download helper -------------------------

def ensure_vosk_model():
    # if model folder exists and has model files, return True
    if Path(VOSK_MODEL_DIR).exists():
        if any(Path(VOSK_MODEL_DIR).glob("**/*")):
            return True
    # try to download automatically
    print(f"[vosk] Vosk model not found at {VOSK_MODEL_DIR}. Attempting automatic download (this may be large).")
    models_dir = Path(VOSK_MODEL_DIR).parent
    models_dir.mkdir(parents=True, exist_ok=True)
    zip_path = models_dir / VOSK_ZIP_NAME
    try:
        print(f"[vosk] Downloading model from {VOSK_ZIP_URL} ...")
        urllib.request.urlretrieve(VOSK_ZIP_URL, str(zip_path))
        print(f"[vosk] Extracting {zip_path} ...")
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(models_dir)
        try:
            os.remove(zip_path)
        except:
            pass
        if Path(VOSK_MODEL_DIR).exists():
            print("[vosk] Model downloaded and ready.")
            return True
    except Exception as e:
        print(f"[vosk] Model download/extract failed: {e}")
    print("[vosk] Could not prepare model automatically. Please download model manually and place in:", VOSK_MODEL_DIR)
    return False

# --------------------------- Recognizer selection -------------------------
use_vosk = False
use_sr = False

try:
    import vosk
    import sounddevice as sd
    import numpy as np
    if ensure_vosk_model():
        model = vosk.Model(str(VOSK_MODEL_DIR))
        use_vosk = True
    else:
        use_vosk = False
except Exception as e:
    print(f"[vosk] Vosk not usable or not installed: {e}")
    use_vosk = False

if not use_vosk:
    try:
        import speech_recognition as sr  # type: ignore
        sr_recognizer = sr.Recognizer()
        sr_mic = sr.Microphone()
        use_sr = True
        print("[fallback] Using speech_recognition (Google) fallback.")
    except Exception as e:
        print(f"[fallback] speech_recognition not available: {e}")
        use_sr = False

if not use_vosk and not use_sr:
    print("[fatal] Neither Vosk nor SpeechRecognition available. Please install dependencies and rerun.")
    sys.exit(1)

# Shared state
_last_activation = 0.0
_lock = threading.Lock()

# --------------------------- WebSocket bridge (local) -------------------------
try:
    import asyncio
    import websockets
except Exception:
    websockets = None

WS_PORT = 8765
_ws_clients = set()
_ws_loop = None

def send_ws_message(obj):
    """Schedule a coroutine to send JSON to all connected WS clients."""
    if websockets is None or _ws_loop is None:
        return
    try:
        coro = _send_ws_message_coro(obj)
        asyncio.run_coroutine_threadsafe(coro, _ws_loop)
    except Exception as e:
        print(f"[jarvis/ws] Failed to schedule send: {e}")

async def _send_ws_message_coro(obj):
    data = json.dumps(obj)
    to_remove = []
    for ws in list(_ws_clients):
        try:
            await ws.send(data)
        except Exception:
            to_remove.append(ws)
    for r in to_remove:
        try:
            _ws_clients.remove(r)
        except Exception:
            pass

async def _ws_handler(websocket, path):
    # register
    _ws_clients.add(websocket)
    try:
        async for message in websocket:
            try:
                obj = json.loads(message)
            except Exception:
                continue
            cmd = obj.get('type')
            if cmd == 'start_listen':
                # trigger a manual listen in background
                threading.Thread(target=manual_listen_and_transcribe, daemon=True).start()
            elif cmd == 'stop_listen':
                # not implemented: stop current recording
                pass
            else:
                # unknown command - ignore
                pass
    finally:
        try:
            _ws_clients.remove(websocket)
        except Exception:
            pass

def start_ws_server():
    global _ws_loop
    if websockets is None:
        print("[jarvis/ws] websockets package not available — WS bridge disabled.")
        return
    async def _run():
        server = await websockets.serve(_ws_handler, '127.0.0.1', WS_PORT)
        print(f"[jarvis/ws] WebSocket server listening on ws://127.0.0.1:{WS_PORT}")
        await server.wait_closed()

    loop = asyncio.new_event_loop()
    _ws_loop = loop
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run())
    except Exception as e:
        print(f"[jarvis/ws] WS server error: {e}")

def ensure_ws_started():
    # run server in background thread
    if websockets is None:
        return
    t = threading.Thread(target=start_ws_server, daemon=True)
    t.start()

def manual_listen_and_transcribe():
    """Synchronous helper used when WS client requests an explicit listen.
    It records a short segment and returns text (also sends message to clients).
    """
    try:
        # If running in test mode, immediately return a canned transcript to allow end-to-end tests
        if globals().get('__JARVIS_TEST_MODE__', False):
            test_text = globals().get('__JARVIS_TEST_TEXT__', 'test command')
            try:
                send_ws_message({'type':'transcript','text': test_text})
            except Exception:
                pass
            handle_command_sequence(test_text)
            return
        if use_vosk:
            # record with sounddevice similar to on_wake_vosk
            try:
                sd.stop()
            except Exception:
                pass
            try:
                data = sd.rec(int(COMMAND_MAX_SECONDS * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
                sd.wait()
                r2 = vosk.KaldiRecognizer(model, SAMPLE_RATE)
                b = data.tobytes()
                if r2.AcceptWaveform(b):
                    out = r2.Result()
                else:
                    out = r2.FinalResult()
                j = json.loads(out)
                cmd_text = j.get('text', '')
            except Exception as e:
                print(f"[jarvis/ws] manual Vosk listen failed: {e}")
                cmd_text = ''
        elif use_sr:
            try:
                import speech_recognition as _sr  # type: ignore
                r = _sr.Recognizer()
                with _sr.Microphone() as source:
                    r.adjust_for_ambient_noise(source, duration=0.2)
                    audio = r.listen(source, timeout=3, phrase_time_limit=COMMAND_MAX_SECONDS)
                    cmd_text = r.recognize_google(audio)
            except Exception as e:
                print(f"[jarvis/ws] manual SR listen failed: {e}")
                cmd_text = ''
        else:
            cmd_text = ''

        if cmd_text:
            send_ws_message({'type':'transcript','text':cmd_text})
            # also process as a command
            handle_command_sequence(cmd_text)
        else:
            send_ws_message({'type':'transcript','text':''})
    except Exception as e:
        print(f"[jarvis/ws] manual_listen error: {e}")

# start WS bridge early so frontend can connect
ensure_ws_started()


def is_wake_text(text):
    if not text:
        return False
    t = text.lower()
    for w in WAKE_WORDS:
        if w in t:
            return True
    words = t.split()
    for w in WAKE_WORDS:
        for word in words:
            if fuzzy_ratio(word, w) >= WAKE_THRESHOLD:
                return True
    for w in WAKE_WORDS:
        if fuzzy_ratio(t, w) >= WAKE_THRESHOLD:
            return True
    return False


def handle_command_sequence(command_text):
    print(f"[jarvis] Command captured: '{command_text}'")
    entry, trig = match_command(command_text)
    if entry:
        print(f"[jarvis] Matched command '{trig}'. Executing...")
        execute_entry(entry)
        # play random OK sound
        random_ok = random.choice(OK_SOUNDS)
        play_sound(Path(random_ok))
    else:
        print("[jarvis] No matching command found.")

# --------------------------- Vosk streaming logic -------------------------
if use_vosk:
    sample_rate = SAMPLE_RATE
    try:
        rec = vosk.KaldiRecognizer(model, sample_rate)
    except Exception as e:
        print(f"[vosk] Could not create recognizer: {e}")
        use_vosk = False

if use_vosk:
    print("[vosk] Starting low-latency Vosk stream (press Ctrl+C to quit).")

    def vosk_callback(indata, frames, time_info, status):
        # indata is numpy array of float32; convert to int16 bytes
        global _last_activation
        try:
            if status:
                pass
            try:
                data16 = (indata * 32767).astype('int16')
                b = data16.tobytes()
            except Exception:
                b = indata.tobytes()
            if rec.AcceptWaveform(b):
                res = rec.Result()
                try:
                    j = json.loads(res)
                    text = j.get('text', '')
                except Exception:
                    text = ''
                if text:
                    if is_wake_text(text):
                        with _lock:
                            now = time.time()
                            if now - _last_activation > DEBOUNCE_SEC:
                                _last_activation = now
                                print(f"[vosk] Wake detected (final): '{text}'")
                                threading.Thread(target=on_wake_vosk, args=(), daemon=True).start()
            else:
                pres = rec.PartialResult()
                try:
                    pj = json.loads(pres)
                    part = pj.get('partial', '')
                except Exception:
                    part = ''
                if part:
                    if is_wake_text(part):
                        with _lock:
                            now = time.time()
                            if now - _last_activation > DEBOUNCE_SEC:
                                _last_activation = now
                                print(f"[vosk] Wake detected (partial): '{part}'")
                                threading.Thread(target=on_wake_vosk, args=(), daemon=True).start()
        except Exception:
            pass

    def on_wake_vosk():
        try:
            print("[jarvis] Activated. Playing greeting.")
            play_sound(GREETING_SOUND)
            time.sleep(RESPONSE_DELAY)
            print("[jarvis] Recording command (short)...")
            try:
                sd.stop()
            except:
                pass
            try:
                rec_buf = sd.rec(int(COMMAND_MAX_SECONDS * sample_rate), samplerate=sample_rate, channels=1, dtype='int16')
                sd.wait()
                r2 = vosk.KaldiRecognizer(model, sample_rate)
                b = rec_buf.tobytes()
                if r2.AcceptWaveform(b):
                    out = r2.Result()
                else:
                    out = r2.FinalResult()
                j = json.loads(out)
                cmd_text = j.get('text', '')
                if cmd_text:
                    # send transcript to any connected websocket clients
                    try:
                        send_ws_message({'type': 'transcript', 'text': cmd_text})
                    except Exception:
                        pass
                    handle_command_sequence(cmd_text)
                else:
                    print("[jarvis] No command recognized (empty).")
            except Exception as e:
                print("[jarvis] Error during command recording:", e)
        except Exception as e:
            print("[jarvis] on_wake_vosk error:", e)

    try:
        # RawInputStream with small blocksize for low latency
        with sd.RawInputStream(samplerate=sample_rate, blocksize=8000, dtype='int16', channels=1, callback=vosk_callback):
            print("[vosk] Listening (Vosk) — say wake word.")
            while True:
                time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n[jarvis] Shutting down (user interrupt).")
        sys.exit(0)
    except Exception as e:
        print(f"[vosk] Stream error: {e}")
        print("[vosk] Falling back to speech_recognition if available.")
        # fall through to SR fallback

# --------------------------- Fallback: SpeechRecognition listen_in_background -------------------------
if not use_vosk and use_sr:
    print("[fallback] Starting speech_recognition background listener.")
    import speech_recognition as sr  # type: ignore
    r = sr.Recognizer()
    m = sr.Microphone()

    def background_callback(recognizer_local, audio):
        global _last_activation
        try:
            text = recognizer_local.recognize_google(audio)
        except sr.UnknownValueError:
            return
        except Exception:
            return
        if is_wake_text(text):
            with _lock:
                now = time.time()
                if now - _last_activation > DEBOUNCE_SEC:
                    _last_activation = now
                    print(f"[fallback] Wake detected in background: '{text}'")
                    threading.Thread(target=on_wake_sr, args=(), daemon=True).start()

    def on_wake_sr():
        print("[jarvis] Activated (fallback). Playing greeting.")
        play_sound(GREETING_SOUND)
        time.sleep(RESPONSE_DELAY)
        print("[jarvis] Listening for command (fallback)...")
        with m as source:
            r.adjust_for_ambient_noise(source, duration=0.2)
            try:
                audio = r.listen(source, timeout=3, phrase_time_limit=COMMAND_MAX_SECONDS)
                cmd_text = r.recognize_google(audio)
                try:
                    send_ws_message({'type':'transcript','text': cmd_text})
                except Exception:
                    pass
                handle_command_sequence(cmd_text)
            except sr.WaitTimeoutError:
                print("[jarvis] No command (timeout).")
            except sr.UnknownValueError:
                print("[jarvis] Could not understand command.")
            except Exception as e:
                print(f"[jarvis] Fallback error: {e}")

    stop = r.listen_in_background(m, background_callback, phrase_time_limit=1.0)
    print("[fallback] Jarvis is online (fallback). Say wake word.")
    try:
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        stop(wait_for_stop=False)
        print("\n[jarvis] Goodbye.")
        sys.exit(0)

# --------------------------- Prepare filesystem (sounds) -------------------------
if not SOUNDS_DIR.exists():
    try:
        SOUNDS_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[jarvis] Created sounds folder: {SOUNDS_DIR}")
    except Exception:
        pass
    print("[jarvis] Add your greet.wav, ok1.wav, ok2.wav, ok3.wav files to the sounds folder for feedback.")

# --------------------------- End of file ---------------------------

if __name__ == "__main__":
    # file primarily runs as soon as imported/started — initialization done above.
    pass
