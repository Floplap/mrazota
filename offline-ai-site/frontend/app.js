const log = document.getElementById('chat');
const textIn = document.getElementById('text');
const sendBtn = document.getElementById('send');
const recordBtn = document.getElementById('record');
const fileInput = document.getElementById('file');
let history = [];

function addMsg(cls, txt){
  const d = document.createElement('div');
  d.className = 'msg ' + cls;
  d.textContent = txt;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

async function sendText(msg){
  addMsg('user', msg);
  try {
    const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ message: msg, history })});
    const j = await r.json();
    if (!j.ok) { addMsg('bot', 'Ошибка: '+(j.error||'unknown')); return; }
    const reply = j.reply || '[пустой ответ]';
    addMsg('bot', reply);
    history.push({ user: msg, assistant: reply });
    // TTS
    try {
      const t = await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ text: reply })});
      if (t.ok){
        const blob = await t.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.play();
      }
    } catch(e){ console.log('tts failed', e); }
  } catch(e){ addMsg('bot','network error: '+e.message); }
}

sendBtn.onclick = ()=>{ if (textIn.value.trim()) { sendText(textIn.value.trim()); textIn.value=''; } }

recordBtn.onclick = async ()=>{
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    const mr = new MediaRecorder(stream);
    let chunks = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = async ()=>{
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const fd = new FormData();
      fd.append('audio', blob, 'rec.webm');
      const resp = await fetch('/api/asr',{method:'POST', body: fd});
      const j = await resp.json();
      if (j.ok) { textIn.value = j.text; sendText(j.text); }
      else addMsg('bot', 'ASR error: ' + j.error);
      stream.getTracks().forEach(t=>t.stop());
      recordBtn.textContent = 'Запись';
    };
    mr.start();
    recordBtn.textContent = 'Запись... (стоп через 8с)';
    setTimeout(()=>{ if (mr.state !== 'inactive') mr.stop(); }, 8000);
  } catch(e){ addMsg('bot','microphone error: '+e.message); }
};

fileInput.onchange = async (e)=>{
  const f = e.target.files[0]; if (!f) return;
  const fd = new FormData(); fd.append('audio', f);
  const resp = await fetch('/api/asr',{method:'POST', body: fd});
  const j = await resp.json();
  if (j.ok) { textIn.value = j.text; sendText(j.text); }
  else addMsg('bot', 'ASR error: ' + j.error);
};
