import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from 'vite';
import config from '../../vite.renderer.config.mjs';
import {request} from 'node:http';
const get=(path,headers={})=>new Promise((resolve,reject)=>{
 const req=request({host:'127.0.0.1',port:5173,path,headers},res=>{let body='';res.on('data',b=>body+=b);res.on('end',()=>{console.log('HTTP',path,res.statusCode);resolve({status:res.statusCode,body});});});req.on('error',reject);req.end();
});
test('DEV-03 real Vite serves renderer only, rejects wrong Host/Origin and private files',async t=>{
 console.log('VITE_CREATE_START');
 const watchdog=setTimeout(()=>{console.error('VITE_HEALTH_TIMEOUT');process.exit(1);},20000);
 const server=await createServer({...config,configFile:false});console.log('VITE_CREATE_OK');await server.listen();console.log('VITE_LISTEN_OK');t.after(async()=>{console.log('VITE_CLOSE_START');await server.close();clearTimeout(watchdog);});
 assert.equal(server.httpServer.address().address,'127.0.0.1');
 console.log('ADDRESS',server.httpServer.address());const html=await get('/');assert.equal(html.status,200);assert.match(html.body,/开发版/);assert.match(html.body,/ws:\/\/127.0.0.1:5173/);
 for(const [path,headers]of [['/',{Host:'evil.example'}],['/',{Origin:'https://evil.example'}],['/main.ts',{}],['/../../package.json',{}],['/@fs/etc/passwd',{}],['/@fs'+process.cwd()+'/package.json',{}],['/.env',{}],['/preload.ts',{}]])assert.equal((await get(path,headers)).status,403,path);
 assert.equal((await get('/renderer.tsx')).status,200);
 assert.equal((await get('/desktop-work.ts')).status,200);
 assert.equal((await get('/@vite/client')).status,200);
 assert.equal((await get('/@fs'+process.cwd()+'/packages/product-core/case-assistant.ts')).status,200);
});
