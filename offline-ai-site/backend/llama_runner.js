// Simple wrapper to call local llama.cpp binary or other runner binaries
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getHardwareInfo, pickModelForHardware } = require('./model_manager');

const BIN_DIR = path.join(__dirname, '..', 'bin');

function findBinary(name){
  const p = path.join(BIN_DIR, name);
  if (fs.existsSync(p)) return p;
  return null;
}

async function runLlama(prompt, modelKey = null){
  return new Promise(async (resolve, reject) => {
    try {
      const hw = await getHardwareInfo();
      const chosen = pickModelForHardware(hw);
      const modelPath = chosen.path;
  if (!fs.existsSync(modelPath)) return reject(new Error(`Model not found: ${modelPath}. Run setup script to download models.`));
      // find binary: prefer "llama" then "llama.cpp" or "ggml-chat" etc.
      const llamaBin = findBinary('llama') || findBinary('main') || findBinary('llama.cpp') || findBinary('ggml-chat');
      if (!llamaBin) return reject(new Error('llama binary not found in bin/. Build llama.cpp and place executable as bin/llama or bin/main'));

      // Build args - adaptable to common llama.cpp builds
      // NOTE: you may need to edit flags depending on your build
      const args = ['-m', modelPath, '-p', prompt, '-n', '256', '--repeat_penalty', '1.1'];
      // If GPU present, pass gpu flag (some builds accept -ngl or --gpu)
      if (hw.has_nvidia) args.push('-ngl', '1'); // example; adjust if your build uses different flags
      const proc = spawn(llamaBin, args, { stdio: ['ignore','pipe','pipe'] });

      let out = '';
      let err = '';
      proc.stdout.on('data', d => out += d.toString());
      proc.stderr.on('data', d => err += d.toString());
      proc.on('close', code => {
  if (code !== 0 && !out) return reject(new Error(`llama exit ${code}: ${err}`));
        // try to extract reply after "Assistant:" marker or return tail
        const marker = 'Assistant:';
        const idx = out.lastIndexOf(marker);
        const reply = idx >= 0 ? out.slice(idx + marker.length).trim() : out.trim();
        resolve(reply);
      });
    } catch (e) { reject(e); }
  });
}

module.exports = { runLlama };
