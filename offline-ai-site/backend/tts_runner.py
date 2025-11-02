#!/usr/bin/env python3
"""Simple TTS wrapper: tries Coqui TTS CLI, falls back to espeak."""
import sys
import subprocess
import os
import time
import shlex

TEXT = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else ""
OUT = os.path.join(os.path.dirname(__file__), '..', 'tmp_uploads', f"tts_out{int(time.time()*1000)}.wav")


def try_coqui(text, out):
    cmd = f'tts --text {shlex.quote(text)} --out_path {shlex.quote(out)}'
    r = subprocess.run(cmd, shell=True)
    return r.returncode == 0


def try_espeak(text, out):
    # espeak -w out.wav "text"
    cmd = f'espeak -w {shlex.quote(out)} {shlex.quote(text)}'
    r = subprocess.run(cmd, shell=True)
    return r.returncode == 0


if __name__ == "__main__":
    if not TEXT:
        print("ERROR: empty", file=sys.stderr)
        sys.exit(1)

    ok = False
    if try_coqui(TEXT, OUT):
        ok = True
    else:
        if try_espeak(TEXT, OUT):
            ok = True

    if not ok:
        print("ERROR: no tts available", file=sys.stderr)
        sys.exit(2)

    print(OUT)
