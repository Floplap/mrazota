// Calls whisper.cpp (or any compatible binary). Expects bin/whisper or bin/main-whisper etc.
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BIN_DIR = path.join(__dirname, '..', 'bin');

function findBin(names){
  for (let n of names){
    const p = path.join(BIN_DIR, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function runWhisper(filePath){
  return new Promise((resolve, reject) => {
    const whisperBin = findBin(['whisper', 'main', 'whisper.cpp']);
    if (!whisperBin) return reject(new Error('whisper binary not found in bin/ - build whisper.cpp and place executable as bin/whisper'));

    // Common whisper.cpp invocation (adjust to your build)
    // Some builds accept: ./main -m model.bin -f audio.wav -otxt
    const modelPath = path.join(__dirname, '..', 'models', 'whisper-ggml.bin');
  if (!fs.existsSync(modelPath)) return reject(new Error(`whisper model not found: ${modelPath}`));

    const args = ['-m', modelPath, '-f', filePath];
    const proc = spawn(whisperBin, args, { stdio: ['ignore','pipe','pipe'] });

    let out = '';
    let err = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => {
  if (code !== 0 && !out) return reject(new Error(`whisper exit ${code}: ${err}`));
      // Many builds print the transcription to stdout; otherwise you may need to read .txt file
      resolve(out.trim());
    });
  });
}

module.exports = { runWhisper };
