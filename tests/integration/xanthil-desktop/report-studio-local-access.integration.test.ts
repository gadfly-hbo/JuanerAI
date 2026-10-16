import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request} from 'node:http';
import {createReportStudioLocalAccess} from '../../../adapters/report-studio/local-access.ts';

async function fixture(t:{after(fn:()=>Promise<void>):void}) {
  let origin='',time=0;
  const access=createReportStudioLocalAccess({origin:()=>origin,ownerToken:'a'.repeat(64),now:()=>time});
  const server=createServer((req,res)=>{try{const kind=access.authorize(req);res.writeHead(200);res.end(kind);}catch{res.writeHead(403);res.end('rejected');}});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert(address&&typeof address==='object');origin=`http://127.0.0.1:${address.port}`;
  t.after(async()=>{access.close();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));});
  function call(path:string,headers:Record<string,string|string[]>={},method='GET') {
    return new Promise<{status:number;body:string}>((resolve,reject)=>{const req=request(origin+path,{method,headers},res=>{const chunks:Buffer[]=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode!,body:Buffer.concat(chunks).toString()}));});req.on('error',reject);req.end();});
  }
  return {access,origin,call,set time(v:number){time=v;}};
}
test('RS-LOCAL-01 real loopback protects API and owner endpoints but permits static shell',async t=>{
  const f=await fixture(t);assert.equal((await f.call('/')).status,200);assert.equal((await f.call('/assets/index-synthetic.js')).status,200);
  assert.equal((await f.call('/api/projects')).status,403);
  assert.equal((await f.call('/api/builtin/bridge/status')).status,403);
  assert.equal((await f.call('/api/builtin/bridge/status',{'x-studio-owner':'a'.repeat(64)})).body,'owner');
  assert.equal((await f.call('/api/builtin/bridge/status',{'x-studio-owner':'a'.repeat(64),origin:f.origin})).status,403);
});
test('RS-LOCAL-01 bootstrap is unpredictable, single-use, expiring and closed on shutdown',async t=>{
  const f=await fixture(t),token=f.access.issueBootstrap();assert.match(token,/^[a-f0-9]{64}$/);
  const cookie=f.access.acceptBootstrap(token);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
  assert.throws(()=>f.access.acceptBootstrap(token));
  const session=cookie.split(';')[0];assert.equal((await f.call('/api/projects',{cookie:session})).body,'browser');
  const expired=f.access.issueBootstrap();f.time=60001;assert.throws(()=>f.access.acceptBootstrap(expired));
  f.access.close();assert.equal((await f.call('/api/projects',{cookie:session})).status,403);
});
test('RS-LOCAL-01 browser mutation requires its exact origin, JSON and own session',async t=>{
  const f=await fixture(t),cookie=f.access.acceptBootstrap(f.access.issueBootstrap()).split(';')[0];
  assert.equal((await f.call('/api/projects',{cookie},'POST')).status,403);
  assert.equal((await f.call('/api/projects',{cookie,origin:f.origin,'content-type':'application/json'},'POST')).body,'browser');
  assert.equal((await f.call('/api/projects',{cookie,origin:'https://other.invalid','content-type':'application/json'},'POST')).status,403);
  assert.equal((await f.call('/api/projects',{cookie,'sec-fetch-site':'cross-site'})).status,403);
  assert.equal((await f.call('/api/builtin/bridge/status',{cookie})).status,403);
});
test('RS-LOCAL-01 rejects Host/repeated-header/path traversal before static or API reads',async t=>{
  const f=await fixture(t),cookie=f.access.acceptBootstrap(f.access.issueBootstrap()).split(';')[0];
  assert.equal((await f.call('/',{host:'evil.invalid'})).status,403);
  assert.equal((await f.call('/api/projects',{cookie,origin:[f.origin,f.origin]})).status,403);
  for(const path of ['/assets/..%2Fmanifest.json','/assets/%2e%2e%2fsecret.js','/api/projects/proj_%2F..%2Fsecret'])assert.equal((await f.call(path,{cookie})).status,403,path);
});
