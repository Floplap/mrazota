const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const ROOT = path.resolve(__dirname, '..', 'public');
const port = process.env.STATIC_PORT || process.env.PORT || 3002;

function contentType(file){
  if(file.endsWith('.js')) return 'application/javascript';
  if(file.endsWith('.css')) return 'text/css';
  if(file.endsWith('.html')) return 'text/html';
  if(file.endsWith('.json')) return 'application/json';
  if(file.endsWith('.png')) return 'image/png';
  if(file.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

const server = http.createServer((req, res)=>{
  try{
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname);
    if(pathname === '/') pathname = '/index.html';
    const filePath = path.join(ROOT, pathname);
    if(!filePath.startsWith(ROOT)){
      res.statusCode = 403; res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err, stats)=>{
      if(err){ res.statusCode = 404; res.end('Not Found'); return; }
      if(stats.isDirectory()){
        const idx = path.join(filePath, 'index.html');
        fs.stat(idx, (e) => { if(e) { res.statusCode=404; res.end('Not Found'); } else { fs.createReadStream(idx).pipe(res); } });
        return;
      }
      res.setHeader('Content-Type', contentType(filePath));
      fs.createReadStream(filePath).pipe(res);
    });
  }catch(e){ res.statusCode = 500; res.end('Server error'); }
});

server.listen(port, '127.0.0.1', ()=>{
  console.log('Static server listening on', port, 'serving', ROOT);
});

// stop on SIGTERM
process.on('SIGTERM', ()=>{ server.close(()=>process.exit(0)); });
