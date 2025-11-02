import http from 'http';
import { execSync } from 'child_process';

const checks = [
  { name: 'backend', url: 'http://localhost:3010/api/health', port: 3010 },
  { name: 'backend-alt', url: 'http://localhost:3011/api/health', port: 3011 },
  { name: 'next-3044', url: 'http://localhost:3044/', port: 3044 },
  { name: 'next-3045', url: 'http://localhost:3045/', port: 3045 },
  { name: 'next-3003', url: 'http://localhost:3003/', port: 3003 },
  { name: 'legacy', url: 'http://localhost:3002/', port: 3002 },
];

function httpGet(url, timeout = 3000){
  return new Promise((res)=>{
    const req = http.get(url, (r)=>{
      const { statusCode } = r;
      r.resume();
      r.on('end', ()=> res({ ok: true, statusCode }));
    });
    req.on('error', ()=> res({ ok: false }));
    req.setTimeout(timeout, ()=>{ req.destroy(); res({ ok: false }) });
  })
}

(async ()=>{
  console.log('Probing common dev endpoints...');
  const results = {};
  for(const c of checks){
    try{
      const r = await httpGet(c.url, 2000);
      results[c.name] = r.ok ? `UP ${r.statusCode||''}` : 'DOWN';
      console.log(`${c.name} ${c.url} => ${results[c.name]}`);
    }catch(e){
      results[c.name] = 'DOWN';
      console.log(`${c.name} ${c.url} => ERROR`);
    }
  }

  // prefer Next on 3045, then 3044, then 3003
  const prefer = ['next-3045','next-3044','next-3003'];
  const good = prefer.find(p=> results[p] && results[p].startsWith('UP'));
  if(good){
    const port = good.split('-')[1];
    const url = `http://localhost:${port}/`;
    console.log('\nPRIMARY_HOST:' + url);
    process.exit(0);
  }

  console.log('\nNo Next dev server found on preferred ports. Attempting to start backend/next/legacy in background...');

  try{
    // start backend if port 3010 is free
    try{ execSync('cmd /c "netstat -ano | findstr ":3010""',{stdio:'ignore'}); }
    catch(e){
      console.log('Starting backend on 3010...');
      execSync('cmd /c "cd /d F:\\MRAZOTA\\offline-ai-site\\backend && start /B cmd /c \"set PORT=3010 && node runner_dev4.js\""');
    }

    // start Next dev on 3045
    try{ execSync('cmd /c "netstat -ano | findstr ":3045""',{stdio:'ignore'}); }
    catch(e){
      console.log('Starting Next dev on 3045...');
      execSync('cmd /c "cd /d F:\\MRAZOTA\\mrazota-site && start /B cmd /c \"set PORT=3045 && npm run dev\""');
    }

    // start legacy on 3002
    try{ execSync('cmd /c "netstat -ano | findstr ":3002""',{stdio:'ignore'}); }
    catch(e){
      console.log('Starting legacy http-server on 3002...');
      execSync('cmd /c "cd /d F:\\MRAZOTA\\mrazota-site\\public && start /B cmd /c \"npx http-server -p 3002 -a 127.0.0.1\""');
    }
  }catch(e){
    console.error('Failed to start background services:', e.message);
  }

  // wait a bit then re-probe
  await new Promise(r=>setTimeout(r,4000));
  console.log('\nRe-probing after start...');
  for(const c of checks){
    try{
      const r = await httpGet(c.url, 3000);
      results[c.name] = r.ok ? `UP ${r.statusCode||''}` : 'DOWN';
      console.log(`${c.name} ${c.url} => ${results[c.name]}`);
    }catch(e){
      results[c.name] = 'DOWN';
      console.log(`${c.name} ${c.url} => ERROR`);
    }
  }
  const good2 = prefer.find(p=> results[p] && results[p].startsWith('UP'));
  if(good2){
    const port = good2.split('-')[1];
    const url = `http://localhost:${port}/`;
    console.log('\nPRIMARY_HOST:' + url);
    process.exit(0);
  }

  console.log('\nNo host available. Displaying summary and ports:');
  console.log(results);
  process.exit(2);

})()
.catch(e=>{ console.error(e); process.exit(3) });
