// Express backend: чат, ASR, TTS, health
const express = require('express');
const cors = require('cors');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');
const { pickModelForHardware, getHardwareInfo } = require('./model_manager');
const { runLlama } = require('./llama_runner');
const { runWhisper } = require('./asr_runner');
const { generateMockReply } = require('./mock_reply');
const { spawn } = require('child_process');

const uploadDir = path.join(__dirname, '..', 'tmp_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Health & hardware info
app.get('/api/health', async (req, res) => {
  try {
    const hw = await getHardwareInfo();
    const chosen = pickModelForHardware(hw);
    res.json({ ok: true, hardware: hw, chosenModel: chosen });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

// runTTS: wrapper that calls the Python tts_runner.py and returns path to generated wav
async function runTTS(text){
  return new Promise((resolve, reject) => {
    const py = spawn(process.env.PYTHON || 'python', [path.join(__dirname, 'tts_runner.py'), text], { stdio: ['ignore','pipe','pipe'] });
    let out = '';
    let err = '';
    py.stdout.on('data', d => out += d.toString());
    py.stderr.on('data', d => err += d.toString());
    py.on('close', code => {
      if (code !== 0) return reject(new Error(`tts exit ${code}: ${err}`));
      const outPath = out.trim();
      if (!outPath) return reject(new Error('tts produced no output'));
      resolve(outPath);
    });
  });
}

// Developer stub helpers
function createSilentWav(){
  try{
    const outDir = uploadDir;
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filename = `tts_silence_${Date.now()}.wav`;
    const outPath = path.join(outDir, filename);
    // 1 second of silence, 16-bit PCM, mono, 22050 Hz
    const sampleRate = 22050;
    const seconds = 1;
    const numSamples = sampleRate * seconds;
    const byteRate = sampleRate * 2; // 16-bit mono
    const dataSize = numSamples * 2;
    const header = Buffer.alloc(44);
    header.write('RIFF',0); header.writeUInt32LE(36 + dataSize,4); header.write('WAVE',8);
    header.write('fmt ',12); header.writeUInt32LE(16,16); header.writeUInt16LE(1,20); // PCM
    header.writeUInt16LE(1,22); header.writeUInt32LE(sampleRate,24); header.writeUInt32LE(byteRate,28);
    header.writeUInt16LE(2,32); header.writeUInt16LE(16,34);
    header.write('data',36); header.writeUInt32LE(dataSize,40);
    const data = Buffer.alloc(dataSize, 0);
    const outBuf = Buffer.concat([header, data]);
    fs.writeFileSync(outPath, outBuf);
    return outPath;
  }catch(e){
    return null;
  }
}

// generateMockReply moved to mock_reply.js for reuse and testing

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], modelKey } = req.body;
    // DEV stub mode: quick canned reply without calling binaries
    if (process.env.DEV_STUB === 'true'){
      const reply = generateMockReply(message, history);
      return res.json({ ok: true, reply });
    }

    // Build prompt
    let prompt = '';
    history.forEach(h => { prompt += `User: ${h.user}\nAssistant: ${h.assistant}\n`; });
    prompt += `User: ${message}\nAssistant:`;
    const reply = await runLlama(prompt, modelKey);
    res.json({ ok: true, reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: String(e) });
  }
});

// Dev-only quick mock endpoint for testing generateMockReply without llama
if (process.env.DEV_STUB === 'true'){
  app.post('/api/dev/mock', (req, res) => {
    try{
      const { message, history = [] } = req.body || {};
      const reply = generateMockReply(message, history);
      console.log('[DEV_MOCK] message:', message, 'reply:', reply);
      res.json({ ok: true, reply });
    }catch(e){
      console.error('[DEV_MOCK] error', e);
      res.status(500).json({ ok:false, error: String(e) });
    }
  });
}

// ASR - upload audio
app.post('/api/asr', upload.single('audio'), async (req, res) => {
  try {
    // DEV stub mode
    if (process.env.DEV_STUB === 'true'){
      if (req.file){ try{ fs.unlinkSync(req.file.path);}catch(e){} }
      return res.json({ ok:true, text: 'тестовая расшифровка (DEV_STUB)'});
    }

    const file = req.file;
    if (!file) return res.status(400).json({ ok:false, error: 'no file' });
    const transcript = await runWhisper(file.path);
    fs.unlinkSync(file.path);
    res.json({ ok: true, text: transcript });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: String(e) });
  }
});

// TTS - returns generated WAV
app.post('/api/tts', async (req, res) => {
  try {
    const text = req.body.text || '';
    if (!text) return res.status(400).json({ ok:false, error: 'empty text' });
    // DEV stub mode returns a short silent WAV
    if (process.env.DEV_STUB === 'true'){
      const p = createSilentWav();
      if (!p) return res.status(500).json({ ok:false, error: 'tts stub failed' });
      return res.sendFile(p, err => { if (!err) setTimeout(()=>{ try{ fs.unlinkSync(p); }catch(e){} }, 20000); });
    }

    const outPath = await runTTS(text);
    res.sendFile(outPath, err => {
      if (!err) setTimeout(()=>{ try{ fs.unlinkSync(outPath); }catch(e){} }, 20000);
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Offline AI backend listening at http://localhost:${PORT}`));
