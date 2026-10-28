import {nativeReport} from '../../tests/fixtures/xanthil-desktop/native-report.ts';
// Focused actual supplier integration; invoke with explicit isolated compiled source.
// No credentials, model request, installed-app activation, or external user data.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {taskHash} from '../../packages/product-core/member-task.ts';

const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;
assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1','explicit isolated source and built-in mode required before any import');
for(const key of ['MINIMAX_CN_API_KEY','MINIMAX_API_KEY','XIAOMI_TOKEN_PLAN_CN_API_KEY'])assert(!process.env[key],'test must not receive model credentials');
const {startBuiltinStudio}=await import(pathToFileURL(join(root,'dist/juanerai/server.js')).href);
const owner='a'.repeat(64),id=n=>`${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`;
async function preserveClosedService(data,name){
    const evidence=process.env.JUANERAI_REPORT_STUDIO_SERVICE_EVIDENCE;
    if(evidence){const {cp,readdir,readFile,writeFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto');await mkdir(evidence,{recursive:true});const output=join(evidence,name.replace(/[^A-Za-z0-9_-]/g,'_'));await cp(data,output,{recursive:true,errorOnExist:true,force:false});const files=[];
      async function verify(path=''){for(const entry of await readdir(join(data,path),{withFileTypes:true})){const relative=join(path,entry.name);if(entry.isDirectory())await verify(relative);else{assert(entry.isFile());const original=await readFile(join(data,relative)),copied=await readFile(join(output,relative));assert.deepEqual(copied,original);files.push({path:relative,bytes:copied.length,sha256:createHash('sha256').update(copied).digest('hex')});}}}await verify();await writeFile(join(output,'evidence-manifest.json'),JSON.stringify({synthetic_only:true,device:'Mac mini',source:data,files},null,2));
    }
}
async function fixture(t,options={}){
  const data=await mkdtemp(join(tmpdir(),'studio-real-service-'));await mkdir(join(data,'projects'));
  if(options.configured){const {realpath}=await import('node:fs/promises'),{assertStudioDataVersion}=await import(pathToFileURL(join(root,'dist/juanerai/version.js')).href);await assertStudioDataVersion(await realpath(join(data,'projects')),'0.1.0-synthetic-builtin');}
  if(options.configured){const {realpath}=await import('node:fs/promises'),{createStudioConfiguration}=await import(pathToFileURL(join(root,'dist/juanerai/configuration.js')).href);const keys=new Map();await createStudioConfiguration({dataRoot:await realpath(join(data,'projects')),newId:()=>id(80),canChange:async()=>true,credentials:{async read(p){return keys.get(p)??null;},async save(p,k){keys.set(p,k);},async remove(p){keys.delete(p);}}}).save('minimax-cn','synthetic-not-a-provider-key',0);}

  const service=await startBuiltinStudio({dataRoot:join(data,'projects'),webDist:join(root,'web-dist'),ownerToken:owner,pluginVersion:'0.1.0-synthetic-builtin'},options.dependencies);
  t.after(async()=>{
    try{await service.close();}catch{await service.ownerLost();}
    await preserveClosedService(data,t.name);await rm(data,{recursive:true,force:true});
  });
  const call=(path,method='GET',body,headers={})=>fetch(service.origin+path,{method,redirect:'error',headers:{'x-studio-owner':owner,...(body?{'content-type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  const source={project_id:id(1),task_id:id(2),revision:'1',outcome_id:id(3),outcome_sha256:'a'.repeat(64),scope_sha256:'b'.repeat(64)};
  const value={schema_version:'1',title:'合成分析',source,materials:[{material_id:'conclusion',label:'合成结论',text:'只有合成结论，无原始明细',classification:'MODEL_EXPLANATION',source,verification:'not_performed',limitations:['未经新增分析核验']}]};
  const association={association_id:id(4),studio_project_id:'proj_'+id(4).replaceAll('-',''),created_at:'2026-10-16T00:00:00Z',state:'pending',snapshot:{...value,snapshot_sha256:taskHash(value)}};
  return {service,data,call,association};
}
test('RS-SUPPLIER-01 actual Studio API rejects unauthenticated data reads',async t=>{
  const f=await fixture(t);const response=await fetch(f.service.origin+'/api/projects');assert.equal(response.status,403);
});
test('RS-SUPPLIER-01 owner binds exact source once, persists real Studio project/materials, then browser can reopen',async t=>{
  const f=await fixture(t),path='/api/builtin/bridge/associations/'+f.association.association_id;
  let response=await f.call(path,'POST',f.association);assert.equal(response.status,200,await response.clone().text());const original=await response.json();
  response=await f.call(path,'POST',f.association);assert.equal(response.status,200);assert.deepEqual(await response.json(),original);
  assert.equal(original.project_id,f.association.studio_project_id);assert.equal(original.snapshot_sha256,f.association.snapshot.snapshot_sha256);
  const {WorkspaceStore}=await import(pathToFileURL(join(root,'dist/storage/workspace.js')).href);const store=new WorkspaceStore(join(f.data,'projects'));
  assert.equal((await store.listProjects()).length,1);const assets=await store.listSourceAssets(original.project_id);assert.equal(assets.length,1);
  const content=(await store.readSourceContent(original.project_id,assets[0].source_id)).toString();assert.match(content,/只有合成结论/);assert.match(content,/未经新增分析核验/);
  const bootstrap=await (await f.call('/api/builtin/bridge/bootstrap','POST',{})).json();
  response=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token:bootstrap.token})});assert.equal(response.status,200);const cookie=response.headers.get('set-cookie').split(';')[0];
  response=await fetch(f.service.origin+'/api/projects',{headers:{cookie}});assert.equal(response.status,200);assert.equal((await response.json()).projects.length,1);
  await store.deleteProject(original.project_id);response=await f.call(path,'POST',f.association);assert.equal(response.status,409,'deleted ready project must never be recreated');
});

test('RS-GATEWAY-01 actual Studio → HTTP Adapter → Application → SQLite preserves delivered copy',async t=>{
  const f=await fixture(t);
  const {writeFile,readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');
  const {createReportStudioGateway}=await import('../../adapters/report-studio/gateway.ts');
  const {createReportStudioStore}=await import('../../adapters/report-studio/store.ts');
  const {createReportStudioWorkspace}=await import('../../packages/application/report-studio.ts');
  const {realpath}=await import('node:fs/promises');
  const hostRoot=join(f.data,'host');await mkdir(hostRoot);
  const store=createReportStudioStore({projectRoot:await realpath(hostRoot),projectId:id(1)});
  const actual=await nativeReport({root:hostRoot,projectId:id(1),text:'合成结论'}),task=actual.task,taskId=actual.identity.task_id;
  let n=10;
  const workspace=createReportStudioWorkspace({projectId:id(1),readTask:()=>task,store,studio:createReportStudioGateway({origin:f.service.origin,ownerToken:owner,pluginVersion:'0.1.0-synthetic-builtin',sourceCommit:'74ebb609fd73cf263614ffc9301dafaafcec4230'}),newId:()=>id(n++),now:()=> '2026-10-16T00:00:00Z'});
  const association=await workspace.open(taskId,'1',['conclusion']);assert.equal(association.state,'ready');
  assert.deepEqual(await workspace.continueProject(association.association_id),association);
  const exportId='exp_synthetic',directory=join(f.data,'projects',association.studio_project_id,'exports');await mkdir(directory,{recursive:true});
  const content=Buffer.from('<!doctype html><html><body>合成导出，非模型制作</body></html>');
  const record={export_id:exportId,format:'html',created_at:'2026-10-16T00:00:00Z',artifact_path:`exports/${exportId}.html`,artifact_hash:createHash('sha256').update(content).digest('hex'),checks:{ok:false,message:'合成质检提示',items:[{status:'flag',detail:'需要人工检查排版'}]}};
  await writeFile(join(directory,exportId+'.html'),content);await writeFile(join(directory,exportId+'.json'),JSON.stringify(record));
  const saved=await workspace.deliver(association.association_id,exportId);assert.equal(saved.classification,'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED');assert.deepEqual(saved.warnings,['合成质检提示','需要人工检查排版']);
  assert.deepEqual(await workspace.deliver(association.association_id,exportId),saved);assert.deepEqual(Buffer.from(workspace.copy(saved.delivery_id).content),content);
  await writeFile(join(directory,exportId+'.html'),'corrupt');
  assert.deepEqual(Buffer.from(workspace.copy(saved.delivery_id).content),content,'plugin edits cannot mutate saved copy');
  const gateway=createReportStudioGateway({origin:f.service.origin,ownerToken:owner,pluginVersion:'0.1.0-synthetic-builtin',sourceCommit:'74ebb609fd73cf263614ffc9301dafaafcec4230'});
  await assert.rejects(()=>gateway.savedExport(association.studio_project_id,exportId));
});

test('RS-SUPPLIER-01 concurrent conflicting source cannot reuse another creation reply',async t=>{
  const f=await fixture(t),path='/api/builtin/bridge/associations/'+f.association.association_id;
  const changed=structuredClone(f.association);changed.snapshot.title='不同输入';
  const results=await Promise.all([f.call(path,'POST',f.association),f.call(path,'POST',changed)]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
});

test('RS-PROCESS-01 real built-in supplier runs in its owned separate process and stops',async t=>{
  const {createReportStudioProcess}=await import('../../adapters/report-studio/process.ts');
  const {realpath}=await import('node:fs/promises');const data=await realpath(await mkdtemp(join(tmpdir(),'studio-real-child-')));
  const instance=createReportStudioProcess({node:process.execPath,entry:join(root,'dist/juanerai/entry.js'),programRoot:root,dataRoot:data,webDist:join(root,'web-dist'),pluginVersion:'0.1.0-synthetic-builtin',sourceCommit:'74ebb609fd73cf263614ffc9301dafaafcec4230',startupMs:5000,stopMs:1000});
  t.after(async()=>{await instance.close();await rm(data,{recursive:true,force:true});});
  const service=await instance.start();assert.equal(await service.gateway.project('proj_missing'),null);
  const nonce=await service.gateway.bootstrap();assert.match(nonce,/^[a-f0-9]{64}$/);
  await instance.close();await assert.rejects(()=>fetch(service.origin));
});

test('RS-BUILTIN-01 generated deck Node receives no model or owner credentials',async t=>{
 const {writeFile,readFile,realpath}=await import('node:fs/promises');const data=await realpath(await mkdtemp(join(tmpdir(),'studio-deck-env-')));await mkdir(join(data,'deck'));
 t.after(()=>rm(data,{recursive:true,force:true}));
 await writeFile(join(data,'deck','deck.mjs'),`import {writeFileSync} from 'node:fs';writeFileSync('observed.json',JSON.stringify(['MINIMAX_CN_API_KEY','STUDIO_CONTROL_TOKEN','UNRELATED_SECRET'].filter(k=>process.env[k])));`);
 const keys=['MINIMAX_CN_API_KEY','STUDIO_CONTROL_TOKEN','UNRELATED_SECRET'],prior=keys.map(k=>process.env[k]);for(const key of keys)process.env[key]='synthetic-never-real';
 try{const {renderDeckTool}=await import(pathToFileURL(join(root,'dist/agent/tools/render-deck-tool.js')).href);await renderDeckTool(data).execute({},new AbortController().signal,{});assert.deepEqual(JSON.parse(await readFile(join(data,'observed.json'),'utf8')),[]);}
 finally{keys.forEach((key,i)=>{if(prior[i]===undefined)delete process.env[key];else process.env[key]=prior[i];});}
});

test('RS-BUILTIN-01 actual local preview blocks remote resource requests and still renders',async t=>{
 const {createServer}=await import('node:http');let requests=0;const observed=[];
 const remote=createServer((req,res)=>{requests++;observed.push(req.url);res.end('synthetic remote resource');});await new Promise(r=>remote.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>remote.close(r)));
 remote.on('upgrade',(req,socket)=>{requests++;observed.push('upgrade:'+req.url);socket.destroy();});
 const {shootHtml}=await import(pathToFileURL(join(root,'dist/agent/deck-preview.js')).href);
 const bytes=await shootHtml(`<html><body>合成本地预览<img src="http://127.0.0.1:${remote.address().port}/private.png"><script>new WebSocket('ws://127.0.0.1:${remote.address().port}/private-ws');window.open('http://127.0.0.1:${remote.address().port}/private-popup');navigator.sendBeacon('http://127.0.0.1:${remote.address().port}/private-beacon','synthetic');</script></body></html>`);
 assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(requests,0,'preview must not send undeclared external requests: '+JSON.stringify(observed));
});

test('RS-BUILTIN-01 local rendering cannot send WebRTC STUN packets outside its denied resource routes',async t=>{
 const {createSocket}=await import('node:dgram');let packets=0;const socket=createSocket('udp4');socket.on('message',()=>{packets++;});await new Promise(r=>socket.bind(0,'127.0.0.1',r));t.after(()=>new Promise(r=>socket.close(r)));
 const {shootHtml}=await import(pathToFileURL(join(root,'dist/agent/deck-preview.js')).href);await shootHtml(`<html><body>仅合成网络负例<script>const c=new RTCPeerConnection({iceServers:[{urls:'stun:127.0.0.1:${socket.address().port}'}]});c.createDataChannel('synthetic');c.createOffer().then(s=>c.setLocalDescription(s));</script></body></html>`);assert.equal(packets,0,'local rendering has no implicit WebRTC network grant');
});

test('RS-CONFIG-01 builtin browser exposes own empty configuration and versioned local-mode decision without Provider effects',async t=>{
 const f=await fixture(t),bootstrap=await(await f.call('/api/builtin/bridge/bootstrap','POST',{})).json();
 const admitted=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token:bootstrap.token})}),cookie=admitted.headers.get('set-cookie').split(';')[0];
 const browserCall=(path,method='GET',body)=>fetch(f.service.origin+path,{method,headers:{cookie,...(body?{origin:f.service.origin,'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 let r=await browserCall('/api/builtin/browser/configuration');assert.equal(r.status,200);assert.deepEqual(await r.json(),{revision:0,state:'not_configured',providers:[],provider_verification:'not_performed'});
 r=await browserCall('/api/builtin/browser/mode');assert.equal(r.status,200);assert.deepEqual(await r.json(),{accepted:false,revision:0});
 r=await browserCall('/api/builtin/browser/mode','POST',{revision:0,accepted:true});assert.equal(r.status,200);assert.deepEqual(await r.json(),{accepted:true,revision:1});
 r=await browserCall('/api/builtin/browser/mode','POST',{revision:0,accepted:false});assert.equal(r.status,409);assert.deepEqual(await(await browserCall('/api/builtin/browser/mode')).json(),{accepted:true,revision:1});
 const project=await(await browserCall('/api/projects','POST',{title:'合成独立项目'})).json();const id=project.project_id??project.project?.project_id;assert(id);
 r=await browserCall('/api/builtin/browser/projects/'+id+'/permissions');assert.equal(r.status,200);const value=await r.json();assert.equal(value.configuration.state,'not_configured');assert.equal(value.permission.allowed,false);assert.deepEqual(value.materials,[]);assert.deepEqual(value.recipients,[]);
 r=await browserCall('/api/builtin/browser/projects/'+id+'/permissions','POST',{revision:0,recipients_sha256:'f'.repeat(64),materials:[],allow_prompt:true,allow_screenshots:false,allow_network:false});assert.equal(r.status,409,'client must not invent recipients');
});

test('RS-POLICY-01 real browser permission binds actual selected bytes, shows only new material gap and never enables a model implicitly',async t=>{
 const f=await fixture(t,{configured:true});assert.equal((await f.call('/api/builtin/bridge/associations/'+f.association.association_id,'POST',f.association)).status,200);
 const bootstrap=await(await f.call('/api/builtin/bridge/bootstrap','POST',{})).json(),admitted=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token:bootstrap.token})}),cookie=admitted.headers.get('set-cookie').split(';')[0];
 const call=(path,body,method=body?'POST':'GET')=>fetch(f.service.origin+path,{method,headers:{cookie,...(body?{origin:f.service.origin,'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const prefix='/api/builtin/browser/projects/'+f.association.studio_project_id+'/permissions';let current=await(await call(prefix)).json();assert.equal(current.materials.length,1);assert(current.material_labels[current.materials[0].source_id].includes('conclusion'));assert.equal(current.recipients[0].provider,'minimax-cn');assert.deepEqual(current.recipients[0].purposes,['ppt-build','image-understand']);
 await call('/api/builtin/browser/mode',{revision:0,accepted:true});const response=await call(prefix,{revision:0,recipients_sha256:current.boundary.recipients_sha256,materials:current.materials,allow_prompt:true,allow_screenshots:false,allow_network:false});assert.equal(response.status,200,await response.clone().text());
 current=await(await call(prefix)).json();assert.equal(current.permission.allowed,true);assert.equal(current.permission.allow_network,false);assert.equal(current.permission.allow_screenshots,false);
 const uploaded=await call('/api/projects/'+f.association.studio_project_id+'/sources',{filename:'新增合成说明.md',kind:'markdown',content_base64:Buffer.from('仅合成新增材料').toString('base64'),media_type:'text/markdown'});assert.equal(uploaded.status,200,await uploaded.clone().text());
 current=await(await call(prefix)).json();assert.equal(current.materials.length,2);assert.equal(current.permission.missing.length,1);assert.equal(current.permission.allowed,false);assert.equal(current.permission.recipients_changed,false);
 assert.notEqual((await call('/api/projects/'+f.association.studio_project_id+'/chat',{text:'不得发出模型请求'})).status,200,'metadata and permission do not substitute for the missing own credential helper/key');
});

test('RS-LIFECYCLE-01 one Studio data root has one actual service owner; ordinary close releases ownership',async t=>{
 const f=await fixture(t);let second;
 t.after(async()=>{await second?.close();});
 await assert.rejects(async()=>{second=await startBuiltinStudio({dataRoot:join(f.data,'projects'),webDist:join(root,'web-dist'),ownerToken:'b'.repeat(64),pluginVersion:'0.1.0-synthetic-builtin'});},/RS_OWNER_UNAVAILABLE/);
 await f.service.close();second=await startBuiltinStudio({dataRoot:join(f.data,'projects'),webDist:join(root,'web-dist'),ownerToken:'b'.repeat(64),pluginVersion:'0.1.0-synthetic-builtin'});assert.match(second.origin,/127\.0\.0\.1/);await second.close();
});

test('RS-LIFECYCLE-01 direct close preserves service and ownership while persisted operation is active or UNKNOWN',async t=>{
 const f=await fixture(t),{realpath}=await import('node:fs/promises'),{createReportStudioPolicy}=await import(pathToFileURL(join(root,'dist/juanerai/policy.js')).href),policy=createReportStudioPolicy({dataRoot:await realpath(join(f.data,'projects')),now:()=>new Date().toISOString()});
 policy.setMode(0,true);policy.begin('proj_synthetic',id(90),'export',{recipients_sha256:'a'.repeat(64),materials:[]});
 await assert.rejects(()=>f.service.close(),/RS_PROJECT_PENDING/);assert.equal((await f.call('/api/builtin/bridge/status')).status,200);
 policy.finish(id(90),{outcome:'failed',physical_settled:false,usage_known:false,sdk_run_id:null});await assert.rejects(()=>f.service.close(),/RS_PROJECT_PENDING/);assert.equal((await f.call('/api/builtin/bridge/status')).status,200);
 policy.finish(id(90),{outcome:'failed',physical_settled:true,usage_known:false,sdk_run_id:null});policy.reconcile(id(90));await f.service.close();await assert.rejects(()=>fetch(f.service.origin));
});

test('RS-LIFECYCLE-01 owner loss closes the real HTTP service, releases only its lease and retains unresolved history on restart',async t=>{
 const f=await fixture(t),{realpath}=await import('node:fs/promises'),{createReportStudioPolicy}=await import(pathToFileURL(join(root,'dist/juanerai/policy.js')).href),dataRoot=await realpath(join(f.data,'projects')),policy=createReportStudioPolicy({dataRoot,now:()=>new Date().toISOString()});
 policy.setMode(0,true);policy.begin('proj_synthetic',id(91),'export',{recipients_sha256:'a'.repeat(64),materials:[]});
 assert.equal(typeof f.service.ownerLost,'function');await Promise.all([f.service.ownerLost(),f.service.ownerLost()]);await assert.rejects(()=>fetch(f.service.origin));
 assert.equal(policy.operation(id(91)).state,'running','owner loss cannot invent a physical receipt for an operation outside its owned Hosts');
 const next=await startBuiltinStudio({dataRoot,webDist:join(root,'web-dist'),ownerToken:owner,pluginVersion:'0.1.0-synthetic-builtin'});
 try{const op=policy.operation(id(91));assert.equal(op.state,'unknown');assert.equal(op.physical_settled,false);await assert.rejects(()=>next.close(),/RS_PROJECT_PENDING/);}finally{await next.ownerLost();}
});

test('RS-LIFECYCLE-01 actual private child observes IPC owner disconnect and releases its owned listener',async t=>{
 const {fork}=await import('node:child_process'),{realpath}=await import('node:fs/promises');
 const data=await realpath(await mkdtemp(join(tmpdir(),'studio-owner-disconnect-'))),child=fork(join(root,'dist/juanerai/entry.js'),[],{execPath:process.execPath,execArgv:[],env:{PATH:process.env.PATH,HOME:process.env.HOME,REPORT_STUDIO_BUILTIN:'1'},stdio:['ignore','ignore','pipe','ipc']});
 let exited=false,stderr='';child.stderr.on('data',b=>{stderr+=b.toString();});const exit=new Promise(r=>child.once('exit',(code,signal)=>{exited=true;r({code,signal});}));
 t.after(async()=>{if(!exited){child.kill('SIGTERM');await exit;}await rm(data,{recursive:true,force:true});});
 const ready=new Promise((resolve,reject)=>{child.once('message',resolve);child.once('error',reject);child.once('exit',()=>reject(Error('child exited before ready: '+stderr)));});
 child.send({dataRoot:data,webDist:join(root,'web-dist'),ownerToken:owner,pluginVersion:'0.1.0-synthetic-builtin'});const message=await ready;assert.equal(message.type,'ready');
 assert.equal((await fetch(message.origin+'/api/builtin/bridge/status',{headers:{'x-studio-owner':owner}})).status,200);
 child.disconnect();const timer=setTimeout(()=>child.kill('SIGTERM'),5000);const result=await exit;clearTimeout(timer);assert.deepEqual(result,{code:0,signal:null});await assert.rejects(()=>fetch(message.origin));
 const next=await startBuiltinStudio({dataRoot:data,webDist:join(root,'web-dist'),ownerToken:owner,pluginVersion:'0.1.0-synthetic-builtin'});await next.close();
});

test('RS-RUN-01 real HTTP admission/configuration/permission, actual SDK stop and explicit reconciliation share one durable task',async t=>{
 const {createBuiltinAgentHosts}=await import(pathToFileURL(join(root,'dist/agent/builtin-hosts.js')).href),keys=new Map();let calls=0,admit,release;const ready=new Promise(r=>{admit=r;}),gate=new Promise(r=>{release=r;}),watchdog=setTimeout(()=>release(),4000);t.after(()=>{release();clearTimeout(watchdog);});
 const reply={content:[{kind:'text',text:'仅离线合成制作回复'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}},dependencies={credentials:{async read(p){return keys.get(p)??null;},async save(p,key){keys.set(p,key);},async remove(p){keys.delete(p);}},createHosts:config=>createBuiltinAgentHosts({...config,makeTransport:()=>async()=>{calls++;if(calls===2){admit();await gate;}return reply;}})};
 const f=await fixture(t,{dependencies}),bootstrap=await(await f.call('/api/builtin/bridge/bootstrap','POST',{})).json(),session=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token:bootstrap.token})}),cookie=session.headers.get('set-cookie').split(';')[0];
 const browser=(path,body,method=body===undefined?'GET':'POST')=>fetch(f.service.origin+path,{method,headers:{cookie,origin:f.service.origin,...(body!==undefined?{'content-type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const created=await(await browser('/api/projects',{title:'仅合成真实制作链'})).json(),pid=created.project.project_id,path='/api/projects/'+pid+'/agent/';
 assert.notEqual((await browser('/api/projects/'+pid+'/chat',{text:'未授权不得制作'})).status,200);assert.equal(calls,0);
 assert.equal((await browser('/api/builtin/browser/mode',{revision:0,accepted:true})).status,200);
 let response=await browser('/api/builtin/browser/configuration',{revision:0,provider:'minimax-cn',key:'synthetic-private-key'});assert.equal(response.status,200,await response.clone().text());assert.equal(calls,0,'saving own fake credentials never probes a Provider');
 const grantPath='/api/builtin/browser/projects/'+pid+'/permissions',scope=await(await browser(grantPath)).json();response=await browser(grantPath,{revision:0,recipients_sha256:scope.boundary.recipients_sha256,materials:[],allow_prompt:true,allow_screenshots:false,allow_network:false});assert.equal(response.status,200);
 response=await browser('/api/projects/'+pid+'/chat',{text:'第一轮合成制作'});assert.equal(response.status,200,await response.clone().text());
 async function settled(){for(let i=0;i<100;i++){const state=await(await browser(path+'result')).json();if(!state.active)return state;await new Promise(r=>setTimeout(r,10));}assert.fail('owned synthetic request did not settle');}
 assert.equal((await settled()).status,'succeeded');assert.equal(calls,1);
 assert.equal((await browser('/api/projects/'+pid+'/chat',{text:'第二轮合成制作，等待停止'})).status,200);await ready;assert.equal((await(await browser(path+'result')).json()).active,true);
 assert.equal((await f.call('/api/builtin/bridge/close-intent','POST',{})).status,200);assert.equal((await(await f.call('/api/builtin/bridge/close-intent','POST',{})).json()).state,'pending');
 assert.notEqual((await browser('/api/builtin/browser/configuration',{revision:1,provider:'xiaomi-token-plan-cn',key:'synthetic-private-key'})).status,200);assert.equal(calls,2);
 assert.equal((await browser(path+'stop',{})).status,200);let state=await(await browser(path+'result')).json();assert.equal(state.status,'stopping');assert.equal(state.active,true);
 assert.notEqual((await browser('/api/projects/'+pid,undefined,'DELETE')).status,200,'active report data cannot be deleted');release();state=await settled();assert.equal(state.status,'unknown');assert.equal(state.canReconcile,true);
 assert.notEqual((await browser('/api/projects/'+pid+'/chat',{text:'未知不能重试'})).status,200);assert.equal(calls,2);
 const before=(await(await browser(path+'usage')).json()).usage;assert(before.reservedOutputTokens>0);
 assert.equal((await browser(path+'recover',{})).status,200);assert.equal(calls,2);const reconciled=(await(await browser(path+'usage')).json()).usage;for(const field of ['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'])assert.equal(reconciled[field],before[field],'reconciliation cannot refund '+field);assert(reconciled.activeMs>=before.activeMs,'native control time may accumulate, never be refunded');
 assert.equal((await browser('/api/projects/'+pid+'/chat',{text:'核对后明确新制作'})).status,200);assert.equal((await settled()).status,'succeeded');assert.equal(calls,3);const after=(await(await browser(path+'usage')).json()).usage;assert.equal(after.reservedOutputTokens,before.reservedOutputTokens);assert.equal(after.modelCalls,3);
});

test('RS-IMAGE-01 upload remains local pending; explicit authorized understanding uses the same actual SDK task ledger',async t=>{
 const {createBuiltinAgentHosts}=await import(pathToFileURL(join(root,'dist/agent/builtin-hosts.js')).href),keys=new Map();let calls=0,imageReads=0,fetchCalls=0;const bindings=[],guarded=[];const {createPiTransport}=await import(pathToFileURL(join(root,'node_modules/pi-agent-runtime/dist/index.js')).href);
 const dependencies={credentials:{async read(p){return keys.get(p)??null;},async save(p,key){keys.set(p,key);},async remove(p){keys.delete(p);}},createHosts:config=>createBuiltinAgentHosts({...config,makeTransport:(model,key)=>{bindings.push(model);const strict=createPiTransport({model,apiKey:key,fetch:async()=>{fetchCalls++;throw Error('NETWORK_DISABLED_FOR_IMAGE_IDENTITY_TEST');}});return async request=>{guarded.push({strict,request});await assert.rejects(()=>strict({...request,signal:AbortSignal.abort()}),{message:'CANCELLED'},'RS-IMAGE-02 real transport must accept the exact bound purpose model before cancellation');
  calls++;const image=request.messages.some(message=>message.images?.length);if(image)imageReads++;
  return {content:request.maxOutputTokens===2048&&!image?[{kind:'tool',id:'synthetic-read-image',name:'read_authorized_image',arguments:{}}]:[{kind:'text',text:image?'合成图片说明，模型生成并非原文':'合成主会话'}],stop:request.maxOutputTokens===2048&&!image?'tools':'complete',usage:{inputTokens:2,outputTokens:3}};
 };}})};
 const f=await fixture(t,{dependencies}),token=(await(await f.call('/api/builtin/bridge/bootstrap','POST',{})).json()).token,session=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token})}),cookie=session.headers.get('set-cookie').split(';')[0];
 const call=(path,body)=>fetch(f.service.origin+path,{method:body===undefined?'GET':'POST',headers:{cookie,origin:f.service.origin,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const project=(await(await call('/api/projects',{title:'仅合成图片理解'})).json()).project,pid=project.project_id;await call('/api/builtin/browser/mode',{revision:0,accepted:true});assert.equal((await call('/api/builtin/browser/configuration',{revision:0,provider:'minimax-cn',key:'synthetic-private-key'})).status,200);
 const uploaded=await(await call('/api/projects/'+pid+'/sources',{filename:'synthetic.png',kind:'image',content_base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=',media_type:'image/png'})).json();assert.equal(uploaded.material.status,'pending');assert.equal(calls,0);
 const path='/api/builtin/browser/projects/'+pid+'/images/'+uploaded.source.source_id+'/understand';assert.notEqual((await call(path,{})).status,200);assert.equal(calls,0);
 const grantPath='/api/builtin/browser/projects/'+pid+'/permissions',scope=await(await call(grantPath)).json();assert.equal(scope.materials[0].kind,'image');assert.equal((await call(grantPath,{revision:0,recipients_sha256:scope.boundary.recipients_sha256,materials:scope.materials,allow_prompt:true,allow_screenshots:false,allow_network:false})).status,200);
 const response=await call(path,{});assert.equal(response.status,200,await response.clone().text());const understood=await response.json();assert.equal(understood.material.status,'ready');assert.equal(calls,1);assert.equal(imageReads,1);
 const {readFile}=await import('node:fs/promises'),text=await readFile(join(f.data,'projects',pid,understood.material.extract_file),'utf8');assert.match(text,/模型生成，非原文/);assert.match(text,/合成图片说明/);
 assert.equal((await call('/api/projects/'+pid+'/chat',{text:'图片理解后的明确合成主会话'})).status,200);for(let i=0;i<100;i++){const r=await(await call('/api/projects/'+pid+'/agent/result')).json();if(!r.active)break;await new Promise(r=>setTimeout(r,10));}
 assert.equal(calls,2);const usage=(await(await call('/api/projects/'+pid+'/agent/usage')).json()).usage;assert.equal(usage.modelCalls,2);assert.equal(usage.reservedOutputTokens,0);assert.deepEqual(bindings.map(m=>m.maxOutputTokens),[2048,32768]);assert.equal(fetchCalls,0);await assert.rejects(()=>guarded[0].strict({...guarded[0].request,model:{...guarded[0].request.model,endpoint:'https://unapproved.invalid'}}),{message:'CONFIGURATION_CHANGED'});assert.equal(fetchCalls,0);
});

test('RS-LOCAL-01 actual three-format exports and preview require local mode, no model config; native QA warnings survive bridge readback',async t=>{
 const f=await fixture(t);assert.equal((await f.call('/api/builtin/bridge/associations/'+f.association.association_id,'POST',f.association)).status,200);
 const token=(await(await f.call('/api/builtin/bridge/bootstrap','POST',{})).json()).token,session=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token})}),cookie=session.headers.get('set-cookie').split(';')[0];
 const call=(path,body)=>fetch(f.service.origin+path,{method:body===undefined?'GET':'POST',headers:{cookie,origin:f.service.origin,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const pid=f.association.studio_project_id,project=join(f.data,'projects',pid),{writeFile}=await import('node:fs/promises'),{createRequire}=await import('node:module'),Pptx=createRequire(join(root,'package.json'))('pptxgenjs');await mkdir(join(project,'deck','pages'),{recursive:true});
 const deck=new Pptx();deck.addSlide().addText('离线合成导出',{x:1,y:1,w:8,h:1});await deck.writeFile({fileName:join(project,'deck','deck.pptx')});await writeFile(join(project,'deck','pages','page_01.mjs'),'export function buildSlide(p){p.addSlide()}');await writeFile(join(project,'deck','pages','page_01.html'),'<html><body><h1>离线合成导出</h1></body></html>');
 assert.notEqual((await call('/api/projects/'+pid+'/export',{formats:['pptx','html','pdf']})).status,200);assert.equal((await call('/api/builtin/browser/mode',{revision:0,accepted:true})).status,200);
 const response=await call('/api/projects/'+pid+'/export',{formats:['pptx','html','pdf']});assert.equal(response.status,200,await response.clone().text());const saved=await response.json();assert.equal(saved.exports.length,3);
 const expected=saved.qa.items.filter(item=>item.status==='flag').map(item=>item.detail);if(!saved.qa.ok&&saved.qa.message)expected.unshift(saved.qa.message);
 for(const artifact of saved.exports){const read=await f.call('/api/builtin/bridge/projects/'+pid+'/exports/'+artifact.export_id);assert.equal(read.status,200,await read.clone().text());const record=await read.json(),bytes=Buffer.from(record.content_base64,'base64');assert.equal(record.format,artifact.format);assert.deepEqual(record.warnings,expected);assert(bytes.length>100);if(artifact.format==='pdf')assert.equal(bytes.subarray(0,5).toString(),'%PDF-');if(artifact.format==='pptx')assert.equal(bytes.subarray(0,2).toString(),'PK');}
 const previews=await Promise.all([call('/api/projects/'+pid+'/deck/preview/page_01'),call('/api/projects/'+pid+'/deck/preview/page_01?cache=synthetic')]);for(const preview of previews){assert.equal(preview.status,200);assert.equal(Buffer.from(await preview.arrayBuffer()).subarray(1,4).toString(),'PNG');}assert.equal((await(await call('/api/builtin/browser/configuration')).json()).state,'not_configured');
 const operations=(await(await call('/api/builtin/browser/projects/'+pid+'/permissions')).json()).operations;assert.equal(operations[0].kind,'export');assert(operations.slice(1).every(op=>op.kind==='preview'));assert(operations.every(op=>op.state==='succeeded'&&op.physical_settled&&op.usage_known&&op.sdk_run_id===null));
 await writeFile(join(project,'deck','pages','page_01.html'),'<html><body>仅合成延迟预览<script>const until=Date.now()+500;while(Date.now()<until){}</script></body></html>');
 const pending=call('/api/projects/'+pid+'/deck/preview/page_01');let state;for(let i=0;i<100;i++){state=await(await call('/api/projects/'+pid+'/agent/result')).json();if(state.active)break;await new Promise(r=>setTimeout(r,5));}assert.equal(state.operation_kind,'preview');assert.equal((await call('/api/projects/'+pid+'/agent/stop',{})).status,200);
 state=await(await call('/api/projects/'+pid+'/agent/result')).json();assert.equal(state.status,'stopping');assert.equal(state.active,true);assert.equal((await(await f.call('/api/builtin/bridge/close-intent','POST',{})).json()).state,'pending');const ended=await pending;assert.equal(ended.status,200);await ended.arrayBuffer();
 state=await(await call('/api/projects/'+pid+'/agent/result')).json();assert.equal(state.status,'stopped');const last=(await(await call('/api/builtin/browser/projects/'+pid+'/permissions')).json()).operations.at(-1);assert.equal(last.physical_settled,true);assert.equal(last.usage_known,true);assert.equal(last.sdk_run_id,null);
});

test('RS-PPTX-COMPAT-01 actual supplier native chart export has valid workbook table ranges without changing source or standalone bytes',async t=>{
 const {createRequire}=await import('node:module'),require=createRequire(join(root,'package.json')),Pptx=require('pptxgenjs'),JSZip=require('jszip');
 const {readFile,writeFile}=await import('node:fs/promises'),{buildDeckExports}=await import(pathToFileURL(join(root,'dist/agent/export-deck.js')).href);
 const data=await mkdtemp(join(tmpdir(),'studio-pptx-compat-'));t.after(()=>rm(data,{recursive:true,force:true}));await mkdir(join(data,'deck'));
 const deck=new Pptx(),slide=deck.addSlide();slide.addText('中文原生图表验收',{x:1,y:0.2,w:8,h:1});slide.addTable([['季度','值'],['一季度','100']],{x:0.2,y:2,w:3,h:2});slide.addChart(deck.ChartType.bar,[{name:'合成值',labels:['一季度','二季度','三季度'],values:[100,120,135]}],{x:4,y:1,w:5,h:4});
 const path=join(data,'deck','deck.pptx');await deck.writeFile({fileName:path});const original=await readFile(path),exported=(await buildDeckExports(data,['pptx']))[0].artifact;
 const sourceZip=await JSZip.loadAsync(original),zip=await JSZip.loadAsync(exported);assert.deepEqual(Object.keys(zip.files).sort(),Object.keys(sourceZip.files).sort(),'no PPTX parts removed');
 const sheetName='ppt/embeddings/Microsoft_Excel_Worksheet1.xlsx',sheet=await JSZip.loadAsync(await zip.file(sheetName).async('nodebuffer')),sourceSheet=await JSZip.loadAsync(await sourceZip.file(sheetName).async('nodebuffer'));
 assert.match(await sourceSheet.file('xl/tables/table1.xml').async('string'),/ref="A1:B4'"/,'fixed supplier defect is actually exercised');
 assert.match(await sheet.file('xl/tables/table1.xml').async('string'),/ref="A1:B4"/,'native chart workbook has a valid cell range');
 for(const name of Object.keys(sourceZip.files))if(!sourceZip.files[name].dir&&name!==sheetName)assert.deepEqual(await zip.file(name).async('nodebuffer'),await sourceZip.file(name).async('nodebuffer'),name);
 for(const name of Object.keys(sourceSheet.files))if(!sourceSheet.files[name].dir&&name!=='xl/tables/table1.xml')assert.deepEqual(await sheet.file(name).async('nodebuffer'),await sourceSheet.file(name).async('nodebuffer'),name);
 assert.deepEqual(await readFile(path),original,'working deck remains untouched');
 delete process.env.REPORT_STUDIO_BUILTIN;try{assert.deepEqual((await buildDeckExports(data,['pptx']))[0].artifact,original,'standalone branch retains exact original bytes');}finally{process.env.REPORT_STUDIO_BUILTIN='1';}
 await writeFile(path,exported);assert.deepEqual((await buildDeckExports(data,['pptx']))[0].artifact,exported,'already valid export stays byte-identical');
 const textOnly=new Pptx();textOnly.addSlide().addText('无图表',{x:1,y:1,w:5,h:1});await textOnly.writeFile({fileName:path});assert.deepEqual((await buildDeckExports(data,['pptx']))[0].artifact,await readFile(path),'no-chart export stays byte-identical');
});

test('RS-OWNER-01 actual owned child IPC returns exact source, rejects independent association and recovers lost delivery acknowledgement',async t=>{
 const {realpath,writeFile}=await import('node:fs/promises'),{createReportStudioProcess}=await import('../../adapters/report-studio/process.ts'),{createPersonalReportStudioWorkspace,createPersonalReportStudioOwner}=await import('../../profiles/personal/report-studio.ts'),{createHash}=await import('node:crypto');
 const data=await realpath(await mkdtemp(join(tmpdir(),'studio-owner-actual-')));await mkdir(join(data,'host'));let handleOwner,lose=true,requests=0;
 const instance=createReportStudioProcess({node:process.execPath,entry:join(root,'dist/juanerai/entry.js'),programRoot:root,dataRoot:join(data,'studio'),webDist:join(root,'web-dist'),pluginVersion:'0.1.0-synthetic-builtin',sourceCommit:'74ebb609fd73cf263614ffc9301dafaafcec4230',startupMs:5000,stopMs:1000,ownerRequest:async request=>{requests++;const value=await handleOwner(request);if(request.operation==='deliver'&&lose){lose=false;throw Object.assign(Error('RS_OWNER_REPLY_UNKNOWN'),{code:'RS_OWNER_REPLY_UNKNOWN'});}return value;}});
 t.after(async()=>{await instance.close();await preserveClosedService(data,t.name);await rm(data,{recursive:true,force:true});});const session=await instance.start();
 const actual=await nativeReport({root:join(data,'host'),projectId:id(1),text:'真实IPC合成结论'}),taskId=actual.identity.task_id;let current=actual.task;
 const runtime={start:async()=>session,launch:async()=>'',status:async()=>({state:'ready'})},workspace=createPersonalReportStudioWorkspace({projectRoot:join(data,'host'),projectId:id(1),readTask:()=>current,runtime}),association=(await workspace.open(taskId,'1',['conclusion'])).association;
 handleOwner=createPersonalReportStudioOwner({origin:()=> 'http://127.0.0.1:12345',project:projectId=>{assert.equal(projectId,id(1));return workspace;}});
 const bootstrap=await session.gateway.bootstrap(),admitted=await fetch(session.origin+'/api/builtin/session',{method:'POST',headers:{origin:session.origin,'content-type':'application/json'},body:JSON.stringify({token:bootstrap})}),cookie=admitted.headers.get('set-cookie').split(';')[0];
 const call=(path,body)=>fetch(session.origin+path,{method:body===undefined?'GET':'POST',headers:{cookie,origin:session.origin,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})}),contextPath='/api/builtin/browser/projects/'+association.studio_project_id+'/context';
 const context=await(await call(contextPath)).json();assert.equal(context.kind,'associated');assert.equal(context.context.state,'available');assert.deepEqual(context.source,association.snapshot.source);assert.match(context.context.return_url,/report-studio-revision=1$/);
 const independent=(await(await call('/api/projects',{title:'仅合成独立项目'})).json()).project;const before=requests;assert.deepEqual(await(await call('/api/builtin/browser/projects/'+independent.project_id+'/context')).json(),{kind:'independent',source:null,context:null});assert.notEqual((await call('/api/builtin/browser/projects/'+independent.project_id+'/deliveries/exp_other',{})).status,200);assert.equal(requests,before,'independent project never reaches host association capability');
 const content=Buffer.from('<html><body>真实IPC合成已保存产物</body></html>'),{WorkspaceStore}=await import(pathToFileURL(join(root,'dist/storage/workspace.js')).href),studioStore=new WorkspaceStore(join(data,'studio')),savedExport=await studioStore.saveExport(association.studio_project_id,{revision_id:'deck',format:'html',artifact:content,checks:{qa:{ok:false,message:'合成警告',items:[]}},is_draft:false}),exportId=savedExport.export_id;
 const deliveryPath='/api/builtin/browser/projects/'+association.studio_project_id+'/deliveries/'+exportId;assert.notEqual((await call(deliveryPath,{project_id:id(77)})).status,200);assert.notEqual((await call(deliveryPath,{})).status,200,'lost acknowledgement must not be shown as success');
 const receipt=await(await call(deliveryPath)).json();assert.equal(receipt.state,'saved');assert.deepEqual(Buffer.from(workspace.copy(receipt.delivery.delivery_id).content),content);const repeated=await(await call(deliveryPath,{})).json();assert.equal(repeated.delivery.delivery_id,receipt.delivery.delivery_id);assert.equal(workspace.deliveries(taskId).length,1);
 current=null;const unavailable=await(await call(contextPath)).json();assert.equal(unavailable.context.state,'unavailable');assert.equal(unavailable.context.return_url,null);assert.equal((await(await call(deliveryPath)).json()).delivery.delivery_id,receipt.delivery.delivery_id);assert.equal((await call('/api/projects/'+association.studio_project_id+'/exports')).status,200);
});

test('RS-EXIT-01 wait closes new admission, cancel restores it; UNKNOWN never becomes ready or auto-reconciles',async t=>{
 const f=await fixture(t),path='/api/builtin/bridge/',read=async()=>{const r=await f.call(path+'lifecycle');assert.equal(r.status,200,await r.clone().text());return r.json();};
 assert.deepEqual(await read(),{intent:'none',pending:false,request_count:0,configuration_unknown:false,operations:[]});
 let r=await f.call(path+'exit-intent','POST',{intent:'wait'});assert.equal(r.status,200);assert.equal((await r.json()).intent,'wait');
 const boot=await(await f.call(path+'bootstrap','POST',{})).json(),session=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token:boot.token})});
 // Bootstrap remains available, but no new writable work may enter while exiting.
 assert.equal(session.status,200);const cookie=session.headers.get('set-cookie').split(';')[0];
 const create=()=>fetch(f.service.origin+'/api/projects',{method:'POST',headers:{cookie,origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({title:'退出期间不得创建'})});
 assert.equal((await create()).status,409);
 r=await f.call(path+'exit-intent','POST',{intent:'cancel'});assert.equal(r.status,200);assert.equal((await r.json()).intent,'none');assert.equal((await create()).status,200);
 const {createReportStudioPolicy}=await import('../../adapters/report-studio/policy.ts'),policy=createReportStudioPolicy({dataRoot:await (await import('node:fs/promises')).realpath(join(f.data,'projects')),now:()=>new Date().toISOString()});policy.setMode(0,true);
 const op=policy.begin('proj_synthetic',id(97),'export',{recipients_sha256:'0'.repeat(64),materials:[]});policy.finish(op.operation_id,{outcome:'failed',physical_settled:true,usage_known:false,sdk_run_id:null});
 r=await f.call(path+'exit-intent','POST',{intent:'stop'});assert.equal(r.status,200);let state=await r.json();assert.equal(state.pending,true);assert.equal(state.intent,'stop');assert.equal(state.operations[0].state,'unknown');assert.equal(state.operations[0].usage_known,false);assert.equal((await read()).pending,true);await assert.rejects(()=>f.service.close(),/RS_PROJECT_PENDING/);
 assert.equal((await f.call(path+'exit-intent','POST',{intent:'cancel',force:true})).status,400);assert.equal((await read()).intent,'stop');
 await f.call(path+'exit-intent','POST',{intent:'cancel'});assert.equal((await read()).intent,'none');assert.equal(policy.operation(op.operation_id).state,'unknown');policy.reconcile(op.operation_id);assert.equal((await read()).pending,false);
});

test('RS-LIFECYCLE-02 disconnected HTTP readers stop blocking only after their real handler finishes',async t=>{
 const {createBuiltinAgentHosts}=await import(pathToFileURL(join(root,'dist/agent/builtin-hosts.js')).href),{request}=await import('node:http');let admit,release;const ready=new Promise(r=>{admit=r;}),gate=new Promise(r=>{release=r;});t.after(()=>release());
 const dependencies={createHosts:config=>{const hosts=createBuiltinAgentHosts(config),get=hosts.get;return {...hosts,async get(id){const host=await get(id);return new Proxy(host,{get(target,key){if(key==='history')return async()=>{admit();await gate;return target.history();};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});}};}};
 const f=await fixture(t,{dependencies});await f.call('/api/builtin/bridge/associations/'+f.association.association_id,'POST',f.association);const boot=await(await f.call('/api/builtin/bridge/bootstrap','POST',{})).json(),session=await fetch(f.service.origin+'/api/builtin/session',{method:'POST',headers:{origin:f.service.origin,'content-type':'application/json'},body:JSON.stringify({token:boot.token})}),cookie=session.headers.get('set-cookie').split(';')[0];
 const pending=request(f.service.origin+'/api/projects/'+f.association.studio_project_id+'/agent/history',{headers:{cookie}},res=>res.resume());pending.on('error',()=>{});pending.end();await ready;pending.destroy();await new Promise(r=>setTimeout(r,10));let status=await(await f.call('/api/builtin/bridge/lifecycle')).json();assert.equal(status.pending,true);assert.equal(status.request_count,1);await assert.rejects(()=>f.service.close(),/RS_PROJECT_PENDING/);
 release();for(let i=0;i<100;i++){status=await(await f.call('/api/builtin/bridge/lifecycle')).json();if(!status.pending)break;await new Promise(r=>setTimeout(r,5));}assert.equal(status.request_count,0,'a disconnected but completed handler cannot remain in the shutdown barrier');assert.equal(status.pending,false);await f.service.close();await assert.rejects(()=>fetch(f.service.origin));
});
