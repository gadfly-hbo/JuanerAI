// Optional loopback-only preview of this NEW authored contract. No product access.
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const files={'/':['index.html','text/html;charset=utf-8'],'/index.html':['index.html','text/html;charset=utf-8'],'/style.css':['style.css','text/css;charset=utf-8'],'/model.js':['model.js','text/javascript;charset=utf-8'],'/prototype.js':['prototype.js','text/javascript;charset=utf-8']};
for(const file of ['proposal-v0.1.md','ui-contract-v0.1.md','baseline-and-coverage.md'])files[`/${file}`]=[`../${file}`,'text/plain;charset=utf-8'];
const port=Number(process.env.BUI_PREVIEW_PORT||0);
const server=http.createServer((req,res)=>{const host=req.headers.host;if(host!==`127.0.0.1:${server.address().port}`){res.writeHead(403);res.end('Loopback host required');return;}if(req.method!=='GET'||!files[req.url]){res.writeHead(404);res.end('Not found');return;}const [file,type]=files[req.url];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Referrer-Policy':'no-referrer'});res.end(readFileSync(resolve(here,file)));});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({task:'BUI-20261015',url:`http://127.0.0.1:${server.address().port}/`,pid:process.pid,root:here,scope:'synthetic-new-contract-only'})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
