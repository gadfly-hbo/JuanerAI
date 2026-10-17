import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, realpathSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createDecisionPlatformProcess } from '../../../adapters/decision-platform/process.ts';

const digest=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const source='c11f8da8d8db3b2d5ae2424941a24307471ad972';
const childSource=`
import {createServer} from 'node:http';
process.once('message',m=>{
 const s=createServer((req,res)=>{if(req.headers['x-decision-owner']!==m.ownerToken){res.writeHead(403);res.end('{}');return;}
 res.end(JSON.stringify({ok:true,secretPresent:Boolean(process.env.DP_TEST_SECRET),nodeOptions:process.env.NODE_OPTIONS,home:process.env.HOME}));});
 s.listen(0,'127.0.0.1',()=>process.send({type:'ready',nonce:m.nonce,pid:process.pid,sourceCommit:m.sourceCommit,origin:'http://127.0.0.1:'+s.address().port}));
 process.on('message',q=>{if(q.type==='quiesce') {s.close(()=>process.send({type:'quiesced',nonce:m.nonce}));} if(q.type==='shutdown'){process.disconnect();}});
});`;
function fixture(code=childSource) {
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-process-'))); const program=join(root,'program');mkdirSync(program);
 const entry=join(program,'entry.mjs');writeFileSync(entry,code);
 const node=realpathSync(process.execPath);let mayStop=true;
 const config={node:{path:node,sha256:digest(node)},entry:{path:entry,sha256:digest(entry)},programRoot:program,dataRoot:join(root,'data'),sourceCommit:source,canStop:async()=>mayStop,startupMs:2000,stopMs:1000};
 return {root,config,setStop:(value:boolean)=>{mayStop=value;},cleanup:()=>rmSync(root,{recursive:true,force:true})};
}

test('DP-LIFE-01/04: one owned process, authenticated HTTP, isolated environment and same-root reopen',async()=>{
 const f=fixture();const p=createDecisionPlatformProcess(f.config);const previous=process.env.DP_TEST_SECRET;process.env.DP_TEST_SECRET='synthetic-not-a-real-secret';
 try{
  const [a,b]=await Promise.all([p.start(),p.start()]);assert.equal(a.pid,b.pid);assert.notEqual(a.pid,process.pid);assert.equal(p.state(),'ready');
  const value=await a.request('/api/health') as {ok:boolean;secretPresent:boolean;home:string;nodeOptions?:string};
  assert.equal(value.ok,true);assert.equal(value.secretPresent,false);assert.equal(value.nodeOptions,undefined);assert.equal(value.home,join(f.config.dataRoot,'.home'));
  assert.equal(JSON.stringify(a).includes('ownerToken'),false);
  await assert.rejects(a.request('http://example.invalid/api/health'));
  await p.close();assert.equal(p.state(),'idle');assert.equal(existsSync(join(f.config.dataRoot,'.host-lock')),false);
  const again=await p.start();assert.notEqual(again.pid,a.pid);await p.close();
 }finally{if(previous===undefined)delete process.env.DP_TEST_SECRET;else process.env.DP_TEST_SECRET=previous;await p.close();f.cleanup();}
});

test('DP-LIFE-02: unknown old root is rejected before spawn without changing old DB',async()=>{
 const f=fixture();mkdirSync(f.config.dataRoot);const db=join(f.config.dataRoot,'board.db');writeFileSync(db,'old-db-must-survive');
 try{await assert.rejects(createDecisionPlatformProcess(f.config).start(),/DP_DATA_ROOT/);assert.equal(readFileSync(db,'utf8'),'old-db-must-survive');assert.equal(existsSync(join(f.config.dataRoot,'.host-lock')),false);}finally{f.cleanup();}
});

test('DP-LIFE-01/02: corrupt entry, symlink root, program data and wrong source rejected',async()=>{
 const f=fixture();
 try{
  await assert.rejects(createDecisionPlatformProcess({...f.config,entry:{...f.config.entry,sha256:'0'.repeat(64)}}).start(),/DP_FIXED_IDENTITY/);
  assert.equal(existsSync(f.config.dataRoot),false);
  await assert.rejects(createDecisionPlatformProcess({...f.config,dataRoot:join(f.config.programRoot,'data')}).start(),/DP_DATA_ROOT/);
  const target=join(f.root,'target');mkdirSync(target);symlinkSync(target,f.config.dataRoot);await assert.rejects(createDecisionPlatformProcess(f.config).start(),/DP_DATA_ROOT/);
  rmSync(f.config.dataRoot);const p=createDecisionPlatformProcess(f.config);await p.start();await p.close();
  await assert.rejects(createDecisionPlatformProcess({...f.config,sourceCommit:'f'.repeat(40)}).start(),/DP_DATA_ROOT/);
 }finally{f.cleanup();}
});

test('DP-LIFE-02/03: concurrent owner and busy/UNKNOWN close refused while original remains usable',async()=>{
 const f=fixture();const p=createDecisionPlatformProcess(f.config);
 try{
  const s=await p.start();await assert.rejects(createDecisionPlatformProcess(f.config).start(),/DP_DATA_BUSY/);
  f.setStop(false);await assert.rejects(p.close(),/DP_BUSY_OR_UNKNOWN/);assert.equal(p.state(),'ready');assert.equal((await s.request('/api/health') as {ok:boolean}).ok,true);
  f.setStop(true);await p.close();
 }finally{f.setStop(true);await p.close();f.cleanup();}
});

test('DP-LIFE-01: fake ready and startup timeout retain recovery lock and expose no session',async()=>{
 for(const code of ["process.once('message',m=>process.send({type:'ready',nonce:'wrong',pid:process.pid,sourceCommit:m.sourceCommit,origin:'http://127.0.0.1:1'}));","process.on('message',()=>{});"]){
  const f=fixture(code);const p=createDecisionPlatformProcess({...f.config,startupMs:150});
  try{await assert.rejects(p.start(),/DP_START_FAILED/);assert.equal(p.state(),'unknown');assert.equal(existsSync(join(f.config.dataRoot,'.host-lock')),true);await assert.rejects(createDecisionPlatformProcess(f.config).start(),/DP_DATA_BUSY/);}finally{f.cleanup();}
 }
});

test('DP-LIFE-02: marked root with replaced legacy DB refuses destructive plugin migration',async()=>{
 const f=fixture();const p=createDecisionPlatformProcess(f.config);
 try{
  await p.start();await p.close();writeFileSync(join(f.config.dataRoot,'board.db'),'legacy-data');
  await assert.rejects(p.start(),/DP_DATA_ROOT/);
  assert.equal(readFileSync(join(f.config.dataRoot,'board.db'),'utf8'),'legacy-data');
  assert.equal(p.state(),'unknown');
 }finally{f.cleanup();}
});
