import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,existsSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {request} from 'node:http';
import {createResearchServer} from '../../../adapters/deep-research/server.mjs';
import {createResearchProcess} from '../../../adapters/deep-research/process.mjs';
import {createPersonalResearchRuntime} from '../../../profiles/personal/deep-research.ts';
const programRoot=process.env.DR_PROGRAM_ROOT,bundle=process.env.DR_BUNDLE_ROOT;

test('DR R10/C04 F004-01: invalidated views cannot finish body or authority waits',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR||tmpdir(),'dr-view-wait-'))),ownerToken=randomBytes(32).toString('hex');let held,entered;
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async()=>{if(held){entered();await held;}return true;}});t.after(()=>server.close());
 const session=async()=>{const token=new URL(server.launch()).hash.slice(1),r=await fetch(server.origin+'/bridge/session',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token})});assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],'x-research-view':(await r.json()).view};};
 const read=async()=>{const r=await fetch(server.origin+'/api/projects',{headers:{'x-research-owner':ownerToken}});return (await r.json()).projects;};
 for(const route of ['/api/projects','/api/settings'])for(const timing of ['body','authority']){
  const headers=await session(),body=JSON.stringify(route==='/api/projects'?{module:'industry',goal:'stale',scope:{summary:'s',queries:[]}}:{research:{synthetic:true}});let release,arrived;
  if(timing==='authority'){held=new Promise(r=>{release=r;});arrived=new Promise(r=>{entered=r;});}
  let req;const response=new Promise((resolve,reject)=>{req=request(server.origin+route,{method:'POST',headers:{...headers,origin:server.origin,'content-type':'application/json','content-length':Buffer.byteLength(body)}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);if(timing==='body')req.write(body.slice(0,4));else req.end(body);});
  if(timing==='authority')await arrived;else{for(let i=0;i<100&&!server.state().requests;i++)await new Promise(r=>setTimeout(r,5));assert.equal(server.state().requests,1);await new Promise(r=>setImmediate(r));}
  server.launch();if(timing==='authority')release();else req.end(body.slice(4));assert.equal(await response,403,route+' '+timing);held=undefined;
  assert.deepEqual(await read(),[]);assert.equal(existsSync(join(root,'config.json')),false);
 }
 const headers=await session();const r=await fetch(server.origin+'/api/projects',{method:'POST',headers:{...headers,origin:server.origin,'content-type':'application/json'},body:JSON.stringify({module:'industry',goal:'current',scope:{summary:'s',queries:[]}})});assert.equal(r.status,200);assert.equal((await read()).length,1);
});

test('DR R06/C03 F004-02: proven pre-spawn rejection does not block idle or close',{skip:!bundle},async()=>{
 const root=realpathSync(mkdtempSync(join(process.env.JUANERAI_TEST_EVIDENCE_DIR||tmpdir(),'dr-start-fail-'))),dataRoot=join(root,'not-created');
 const runtime=createResearchProcess({programRoot:bundle,manifestSha256:'0'.repeat(64),dataRoot});await assert.rejects(runtime.launch(),/MANIFEST_MISMATCH/);assert.equal(existsSync(dataRoot),false);
 const state=await runtime.state();assert.equal(state.started,false);assert.equal(state.unknown,false);assert.equal(state.active,0);await runtime.close();await runtime.close();await assert.rejects(runtime.launch(),/UNAVAILABLE/);
 const profile=createPersonalResearchRuntime({programRoot:bundle,manifestSha256:'0'.repeat(64),hostOrigin:()=> 'http://127.0.0.1:12345'});
 const task=profile.task({root,projectId:randomUUID(),taskId:randomUUID(),check(){},checkControl(){}});await assert.rejects(task.open(),/MANIFEST_MISMATCH/);await profile.assertIdle();await profile.close();
});
