// Hardware detection + model selection logic
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

function safeExec(cmd){
  try { return execSync(cmd, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).toString().trim(); }
  catch(e){ return ''; }
}

function getHardwareInfo(){
  // Returns object with cpu_cores, ram_gb, has_nvidia, has_amd, has_mps, gpus: []
  const cpu_cores = os.cpus().length;
  const totalMemGB = Math.round(os.totalmem() / (1024 ** 3));
  let has_nvidia = false, has_amd = false, has_mps = false;
  let gpus = [];

  // nvidia-smi
  const nvidia = safeExec('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits');
  if (nvidia) {
    has_nvidia = true;
    nvidia.split('\n').forEach(l=>{
      const [name, mem] = l.split(',');
      gpus.push({ vendor: 'nvidia', name: name && name.trim(), vram_gb: Math.round(Number(mem)/1024) });
    });
  }
  // rocm-smi (AMD)
  const rocm = safeExec('rocm-smi -i | grep "GPU" || true');
  if (rocm) has_amd = true;

  // mac MPS detect
  const darwin = os.platform() === 'darwin';
  if (darwin) {
    // crude test for Apple Silicon
    const model = safeExec('sysctl -n machdep.cpu.brand_string || true');
    if (model && /Apple/.test(model)) has_mps = true;
  }

  return { cpu_cores, ram_gb: totalMemGB, has_nvidia, has_amd, has_mps, gpus };
}

// Model selection: choose best local candidate based on hardware
function pickModelForHardware(hw){
  // List of candidates (keys -> relative path under models/, comment)
  const candidates = [
    { key:'llama-70b', path: path.join(__dirname,'..','models','llama-70b-ggml.bin'), minRam: 120, preferGPU:true },
    { key:'falcon-40b', path: path.join(__dirname,'..','models','falcon-40b-ggml.bin'), minRam: 80, preferGPU:true },
    { key:'mistral-7b', path: path.join(__dirname,'..','models','mistral-7b-ggml.bin'), minRam: 16, preferGPU:false },
    { key:'llama-13b', path: path.join(__dirname,'..','models','llama-13b-ggml.bin'), minRam: 24, preferGPU:false },
    { key:'gpt4all', path: path.join(__dirname,'..','models','gpt4all.bin'), minRam: 8, preferGPU:false },
  ];
  // try to pick the largest that fits
  for (let c of candidates){
    if (hw.has_nvidia || hw.has_amd || hw.has_mps) {
      // if we have GPU, prefer gpu-friendly larger models (no further checks here)
      if (hw.ram_gb >= c.minRam) return c;
    } else {
      // CPU-only: pick candidate with minRam <= ram
      if (hw.ram_gb >= c.minRam) return c;
    }
  }
  // fallback
  return { key:'small-cpu', path: path.join(__dirname,'..','models','small-ggml.bin'), minRam: 2, preferGPU:false };
}

module.exports = { getHardwareInfo, pickModelForHardware };
