import {test} from 'node:test';
import {parse as parseYaml} from 'yaml';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,realpathSync,readFileSync,mkdirSync,writeFileSync,renameSync,unlinkSync,existsSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPersonalMetricWorkspace} from '../../../profiles/personal/metric-factory.ts';
import {metricHash,verifyMetricBundle} from '../../../adapters/metric-factory/bundle.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
import type {BrowserMembershipReadback} from '../../../packages/ports/browser-membership.ts';
import {createProviderSettings} from '../../../packages/application/provider-settings.ts';
import {createPersonalMetricModel,readPersonalMetricTrialGrant,metricFactoryTrialGrant} from '../../../profiles/personal/metric-factory-model.ts';
const BLUEPRINT = JSON.stringify({
  blueprint: {
    title: "门店扩张选择分析体系",
    intent: "设计具体分析方案",
    purpose: "评估是否继续扩店，比较候选道路的收益与代价。",
    decision: "下一阶段是否继续扩店？",
    boundary: "不承诺资源投入；选址执行归运营。",
    deliverable: "候选道路比较与试点建议。",
    contexts: ["战略选择"],
    organizations: ["假设先行"],
    questions: [{ id: "q1", title: "现有店型是否值得复制？", detail: "看单店回收。", metric_refs: [] }],
    hypotheses: [
      { id: "h1", statement: "现有店型可回收。", support: "单店模型。", counter: "样本期太短。", change_condition: "回收期超阈值则放弃。" }
    ],
    evidence_plan: [
      { id: "e1", name: "单店回收模型", kind: "测算模型", source: "财务与运营记录", check: "复核假设参数", insufficiency: "缺失时只输出定性比较" }
    ],
    options: [
      { id: "expand", name: "选择性继续扩店", tradeoff: "占用资本；需证明店型可复制。" },
      { id: "hold", name: "暂停扩店优化存量", tradeoff: "放弃增长窗口。" }
    ]
  },
  added_metrics: [],
  added_scenarios: []
});

const bundle=process.env.MF_TEST_BUNDLE,sha=process.env.MF_TEST_MANIFEST;
function hostModelFixture(){
 const directory=realpathSync(mkdtempSync(join(tmpdir(),'mf-model-')));let reads=0,authorized=true;
 const settings=createProviderSettings({store:{async read(){reads++;return {status:'found',key:'synthetic-host-key'};},async save(){throw Error('unused');},async delete(){throw Error('unused');}},probe:async()=>{throw Error('no model probe permitted');}});
 const make=()=>createPersonalMetricModel({settings,directory,authorized:()=>authorized});
 return {directory,settings,make,get reads(){return reads;},revoke(){authorized=false;}};
}
const trialTask=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const trialRequest=(taskId:string)=>({taskId,kind:'model',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash',endpoint:'https://token-plan-cn.xiaomimimo.com/v1'});
test('MF-03 production model composition: passive zero credential reads, explicit route, shared slot and revocation',async()=>{
 const f=hostModelFixture(),access=f.make(),id=trialTask(1);
 assert.equal(access.configured(),true);assert.equal(f.reads,0);
 const config=await access.configuration(id) as {apiKey:string;model:{id:string};caps:{maxCalls:number};limits:{maxOutputTokens:number}};
 assert.equal((config as typeof config&{historyRequired:boolean}).historyRequired,false);assert.equal(config.apiKey,'synthetic-host-key');assert.equal(config.model.id,'mimo-v2.6-flash');assert.equal(config.caps.maxCalls,8);assert.equal(config.limits.maxOutputTokens,16384);
 assert.equal(f.settings.status().busy,true);assert.equal((await f.settings.request({operation:'refresh'})).ok,false);
 assert.equal(await access.authorize({...trialRequest(id),endpoint:'https://other.invalid/v1'}),false);
 assert.equal(await access.authorize({...trialRequest(id),model:'mimo-v2.6-pro'}),false);
 assert.equal(await access.authorize({...trialRequest(id),kind:'tool'}),false);
 assert.equal(await access.authorize(trialRequest(id)),true);f.revoke();
 assert.equal(await access.authorize(trialRequest(id)),false);assert.equal(await access.authorize({taskId:id,kind:'publish'}),false);
 await access.settled(id,true);assert.equal(f.settings.status().busy,false);
 assert.ok(!readFileSync(join(f.directory,'model-admission/state.json'),'utf8').includes('synthetic-host-key'));
});
test('MF-03 trial limits persist across new task IDs and reconstruction, including retries',async()=>{
 const f=hostModelFixture();
 for(let n=1;n<=4;n++){const access=f.make(),id=trialTask(n);await access.configuration(id);for(let j=0;j<2;j++)assert.equal(await access.authorize(trialRequest(id)),true);await access.settled(id,true);}
 await assert.rejects(()=>f.make().configuration(trialTask(5)),/BUDGET_EXHAUSTED/);
 const state=JSON.parse(readFileSync(join(f.directory,'model-admission/state.json'),'utf8'));assert.equal(Object.keys(state.tasks).length,4);assert.equal(Object.values(state.tasks).reduce((n:number,t:any)=>n+t.requests,0),8);
 const g=hostModelFixture(),access=g.make(),id=trialTask(1);await access.configuration(id);
 for(let n=0;n<8;n++)assert.equal(await access.authorize(trialRequest(id)),true);
 assert.equal(await access.authorize(trialRequest(id)),false);await access.settled(id,true);await assert.rejects(()=>g.make().configuration(trialTask(2)),/BUDGET_EXHAUSTED/);
});
test('MF-03 approved six-task extension preserves original four-task history and still rejects seventh',async()=>{
 const f=hostModelFixture();
 for(let n=1;n<=4;n++){const a=f.make(),id=trialTask(n);await a.configuration(id);assert.equal(await a.authorize(trialRequest(id)),true);await a.settled(id,true);}
 const file=join(f.directory,'model-admission/state.json'),before=JSON.parse(readFileSync(file,'utf8'));
 assert.equal(before.authorizationReference,'user-2026-10-19-mimo-flash-4-tasks-8-requests');
 for(let n=5;n<=6;n++){const a=f.make(),id=trialTask(n);await a.configuration(id);assert.equal(await a.authorize(trialRequest(id)),true);await a.settled(id,true);}
 const after=JSON.parse(readFileSync(file,'utf8'));assert.equal(after.authorizationReference,before.authorizationReference);
 for(const [id,value] of Object.entries(before.tasks))assert.deepEqual(after.tasks[id],value);
 assert.equal(Object.keys(after.tasks).length,6);assert.equal(Object.values(after.tasks).reduce((n:number,t:any)=>n+t.requests,0),6);
 await assert.rejects(()=>f.make().configuration(trialTask(7)),/BUDGET_EXHAUSTED/);
 const grant=join(f.directory,'old-grant.json');writeFileSync(grant,JSON.stringify({version:1,scope:'synthetic-integration-validation',authorizationReference:before.authorizationReference,enabled:true}));
 assert.equal(readPersonalMetricTrialGrant(grant),false);
});
test('MF-03 unknown and interrupted admissions block restart; missing history never resets the trial',async()=>{
 for(const unknown of [true,false]){const f=hostModelFixture(),access=f.make(),id=trialTask(1);await access.configuration(id);assert.equal(await access.authorize(trialRequest(id)),true);
  if(unknown){await access.settled(id,false);await assert.rejects(()=>access.settled(id,true),/UNSETTLED/);}
  assert.equal(f.settings.status().busy,true);await assert.rejects(()=>f.make().configuration(trialTask(2)),/UNSETTLED/);
  renameSync(join(f.directory,'model-admission/state.json'),join(f.directory,'preserved-state.json'));
  await assert.rejects(()=>f.make().configuration(trialTask(2)));assert.ok(!existsSync(join(f.directory,'model-admission/state.json')));
  f.settings.close();
 }
});
test('MF-03/09 missing entire host admission directory never resets existing runtime history',async()=>{
 for(const unknown of [false,true])for(const history of ['tasks.json','model-budget.json','audit.jsonl']){
  const f=hostModelFixture();
  for(let n=1;n<=4;n++){const a=f.make(),id=trialTask(n);await a.configuration(id);assert.equal(await a.authorize(trialRequest(id)),true);await a.settled(id,!(unknown&&n===4));}
  mkdirSync(join(f.directory,'runtime'));writeFileSync(join(f.directory,'runtime',history),'preserved synthetic model history');
  const before=readFileSync(join(f.directory,'model-admission/state.json'));renameSync(join(f.directory,'model-admission'),join(f.directory,'preserved-admission'));const reads=f.reads;
  await assert.rejects(()=>f.make().configuration(trialTask(5)),/HISTORY_INVALID/);
  assert.equal(f.reads,reads);assert.ok(!existsSync(join(f.directory,'model-admission/state.json')));
  assert.deepEqual(readFileSync(join(f.directory,'preserved-admission/state.json')),before);
  assert.equal(readFileSync(join(f.directory,'runtime',history),'utf8'),'preserved synthetic model history');f.settings.close();
 }
});
test('MF-03 missing, disabled, modified and linked grant cannot read credentials or enable models',async()=>{
 const f=hostModelFixture(),path=join(f.directory,'grant.json');assert.equal(readPersonalMetricTrialGrant(path),false);
 for(const extra of [{enabled:false},{enabled:true,scope:'real-data'},{enabled:true,other:true}]){writeFileSync(path,JSON.stringify({...metricFactoryTrialGrant,...extra}));assert.equal(readPersonalMetricTrialGrant(path),false);}
 writeFileSync(path,JSON.stringify({...metricFactoryTrialGrant,enabled:true}));assert.equal(readPersonalMetricTrialGrant(path),true);
 symlinkSync(path,join(f.directory,'linked-grant.json'));assert.equal(readPersonalMetricTrialGrant(join(f.directory,'linked-grant.json')),false);
 f.revoke();const access=f.make();assert.equal(access.configured(),false);await assert.rejects(()=>access.configuration(trialTask(1)),/AUTHORITY_REQUIRED/);assert.equal(f.reads,0);
});
test('MF-01/02/04/05 actual fixed child: UI, ingress, full strategy publication, host copy, repeat and close',{skip:!bundle||!sha,timeout:90000},async()=>{
 let calls=0,admissions=0;
 const model=createServer(async(req,res)=>{
  let request='';for await(const part of req)request+=part;assert.equal(req.url,'/v1/chat/completions');assert.equal(req.headers.authorization,'Bearer synthetic-key');assert.ok(JSON.parse(request).messages.length>0);calls++;
  res.writeHead(200,{'content-type':'text/event-stream'});
  for(const payload of [
   {id:'offline',object:'chat.completion.chunk',model:'fixture',choices:[{index:0,delta:{role:'assistant',content:BLUEPRINT},finish_reason:null}]},
   {id:'offline',object:'chat.completion.chunk',model:'fixture',choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:8,completion_tokens:100,total_tokens:108}}
  ])res.write('data: '+JSON.stringify(payload)+'\n\n');res.end('data: [DONE]\n\n');
 });
 await new Promise<void>(r=>model.listen(0,'127.0.0.1',r));const endpoint=`http://127.0.0.1:${(model.address() as {port:number}).port}/v1`;
 const root=realpathSync(mkdtempSync(join(tmpdir(),'mf-owned-')));let writable=true;
 const workspace=createPersonalMetricWorkspace({programRoot:bundle!,manifestSha256:sha!,dataRoot:join(root,'data'),copiesRoot:join(root,'copies'),reviewer:'synthetic-reviewer',model:{configured:()=>true,configuration:async()=>({historyRequired:false,model:{provider:'offline',id:'fixture',protocol:'openai-completions',endpoint,contextWindow:32768,maxOutputTokens:8192},apiKey:'synthetic-key',limits:{cumulative:'unlimited',maxOutputTokens:8192,modelTimeoutMs:10000,toolTimeoutMs:1000,controlTimeoutMs:1000}}),authorize:async request=>{if(request.kind==='model'){assert.equal(request.endpoint,endpoint);admissions++;}return writable;},settled:async()=>{}}});
 try{
  verifyMetricBundle(bundle!,sha!);assert.deepEqual(await workspace.status(),{available:true});
  const check=()=>{if(!writable)throw Error('REVOKED');};const [one,two]=await Promise.all([workspace.open(check),workspace.open(check)]);assert.equal(new URL(one.url).origin,new URL(two.url).origin);assert.equal(calls,0);
  const boot=await fetch(one.url,{redirect:'manual'});assert.equal(boot.status,303);const cookie=boot.headers.get('set-cookie')!.split(';')[0],origin=new URL(one.url).origin;
  const api=(path:string,body?:unknown,extra={})=>fetch(origin+path,{headers:{cookie,...(body===undefined?{}:{origin,'content-type':'application/json'}),...extra},...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});
  assert.equal((await fetch(one.url,{redirect:'manual'})).status,403);assert.equal((await fetch(origin+'/api/workspace')).status,403);
  assert.equal((await api('/api/templates/user',{name:'denied',rows:[]},{origin:'https://evil.invalid'})).status,403);
  assert.equal((await api('/settings')).status,404);assert.equal((await api('/api/instances/'+encodeURIComponent('../../outside/instance.yaml'))).status,400);
  for(const name of ['index.html','style.css']){const response=await api(name==='index.html'?'/':'/style.css');assert.equal(response.status,200);assert.equal(metricHash(new Uint8Array(await response.arrayBuffer())),metricHash(readFileSync(join(bundle!,'dist',name))));}
  const create=await api('/api/instances/create-job',{need:'合成战略问题，比较扩店与优化存量。'});assert.equal(create.status,202);const {jobId}=await create.json() as {jobId:string};let job:any;
  for(let i=0;i<200;i++){job=await(await api('/api/jobs/'+jobId)).json();if(job.cancellation!=='requested')break;await new Promise(r=>setTimeout(r,20));}
  assert.equal(job.status,'done',JSON.stringify(job));assert.equal(job.cancellation,'completed');assert.equal(calls,1);assert.equal(admissions,1);
  const path='/api/instances/'+encodeURIComponent(job.instanceId);
  assert.equal((await api(path+'/deliver',{})).status,422);const confirmed=await api(path+'/confirm-review',{});assert.equal(confirmed.status,200,await confirmed.clone().text());
  const delivered=await api(path+'/deliver',{});assert.equal(delivered.status,201,await delivered.clone().text());const result=await delivered.json() as {packageId:string;version:string};
  const saved=readFileSync(join(root,'copies',result.packageId,result.version+'.sap.yaml'));
  assert.deepEqual(Buffer.from(await(await api(path+'/export/sap')).arrayBuffer()),saved);
  assert.equal((await api(path+'/deliver',{})).status,422);assert.equal(calls,1);
  writable=false;assert.equal((await api('/api/templates/user',{name:'denied',rows:[{name:'x'}]})).status,403);writable=true;
  await workspace.close();
 }finally{await workspace.close();await new Promise<void>(r=>model.close(()=>r()));}
});

test('MF-02/09 unknown owner and incompatible data identity are preserved, never adopted',{skip:!bundle||!sha},async()=>{
 for(const mismatch of [false,true]){
  const root=realpathSync(mkdtempSync(join(tmpdir(),'mf-owner-'))),dataRoot=join(root,'data');mkdirSync(dataRoot);
  if(mismatch)writeFileSync(join(dataRoot,'identity.json'),'{"version":999}');
  else{mkdirSync(join(dataRoot,'.owner'));writeFileSync(join(dataRoot,'.owner/token'),'unknown-owner');}
  const workspace=createPersonalMetricWorkspace({programRoot:bundle!,manifestSha256:sha!,dataRoot,copiesRoot:join(root,'copies')});
  await assert.rejects(()=>workspace.open(()=>{}));
  assert.equal(readFileSync(join(dataRoot,mismatch?'identity.json':'.owner/token'),'utf8'),mismatch?'{"version":999}':'unknown-owner');
 }
});

test('MF-03 host session, same origin and control precede opening; invalid payload and missing resources fail closed',async t=>{
 let opens=0;const server=await startBrowserMembershipServer({store:{} as BrowserMembershipReadback,metricFactory:{status:async()=>({available:true}),open:async check=>{check();opens++;return {url:'http://127.0.0.1:1/?host-launch=synthetic'};},state:async()=>({active:false,unknown:false,requests:0}),close:async()=>{}}});t.after(()=>server.close());
 const post=(path:string,body:unknown,headers:Record<string,string>={})=>fetch(server.origin+path,{method:'POST',headers:{origin:server.origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await fetch(server.origin+'/v1/metric-factory/status')).status,401);
 const boot=await post('/v1/bootstrap',{token:server.bootstrap}),cookie=boot.headers.get('set-cookie')!.split(';')[0],control=(await boot.json()).control;
 assert.equal((await post('/v1/metric-factory/open',{}, {cookie})).status,403);
 assert.equal((await post('/v1/metric-factory/open',{}, {cookie,origin:'https://evil.invalid','x-xanthil-control':control})).status,403);
 assert.equal((await post('/v1/metric-factory/open',{case:'forbidden'}, {cookie,'x-xanthil-control':control})).status,400);assert.equal(opens,0);
 assert.equal((await post('/v1/metric-factory/open',{}, {cookie,'x-xanthil-control':control})).status,200);assert.equal(opens,1);
 assert.equal((await post('/v1/metric-factory/proxy',{}, {cookie,'x-xanthil-control':control})).status,404);
});

// Validator F-MF-01/02: exercise the real bundled UI routes, IPC and immutable host store.
async function deliveryFixture(broken=false) {
 const root=realpathSync(mkdtempSync(join(tmpdir(),'mf-delivery-'))),copies=join(root,'copies');
 if(broken)writeFileSync(copies,'synthetic unavailable storage');
 const create=()=>createPersonalMetricWorkspace({programRoot:bundle!,manifestSha256:sha!,dataRoot:join(root,'data'),copiesRoot:copies,reviewer:'synthetic-reviewer'});let workspace=create();
 const open=async()=>{const {url}=await workspace.open(()=>{}),boot=await fetch(url,{redirect:'manual'}),cookie=boot.headers.get('set-cookie')!.split(';')[0],origin=new URL(url).origin;
 return (path:string,body?:unknown,method=body===undefined?'GET':'POST')=>fetch(origin+path,{method,headers:{cookie,...(body===undefined?{}:{origin,'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});};
 let api=await open();
 return {root,copies,get workspace(){return workspace;},get api(){return api;},async reopen(){await workspace.close();workspace=create();api=await open();}};
}
test('MF-05 F-MF-01: separate systems retain exact identities and bytes after reopen; absent exact version never falls back',{skip:!bundle||!sha,timeout:90000},async()=>{
 const f=await deliveryFixture();try{
 const rows:Array<{id:string;path:string;packageId:string;version:string;bytes:Buffer}>=[];
 for(const templateId of ['apparel-brand-retail','cloud-cost']){
  const created=await(await f.api('/api/templates/use',{templateId})).json();const path='/api/instances/'+encodeURIComponent(created.instanceId);
  assert.equal(created.system.delivered,null);assert.equal((await(await f.api(path)).json()).delivered,null);
  const response=await f.api(path+'/deliver',{});assert.equal(response.status,201,await response.clone().text());const result=await response.json();
  assert.equal(result.version,'1.0.0');assert.equal(result.system.delivered.version,result.version);
  rows.push({id:created.instanceId,path,...result,bytes:readFileSync(join(f.copies,result.packageId,result.version+'.sap.yaml'))});
 }
 assert.notEqual(rows[0].packageId,rows[1].packageId);assert.notDeepEqual(rows[0].bytes,rows[1].bytes);
 await f.reopen();
 for(const row of rows){assert.equal((await(await f.api(row.path)).json()).delivered.version,row.version);assert.deepEqual(Buffer.from(await(await f.api(row.path+'/export/sap')).arrayBuffer()),row.bytes);}
 // Draft deletion does not erase the independently saved published artifact.
 unlinkSync(join(f.root,'data/workspace',rows[0].id));
 assert.deepEqual(Buffer.from(await(await f.api(rows[0].path+'/export/sap')).arrayBuffer()),rows[0].bytes);
 // Missing the exact receipt cannot silently select another available package/version.
 renameSync(join(f.copies,rows[0].packageId,'1.0.0.json'),join(f.root,'missing-receipt-preserved.json'));
 assert.notEqual((await f.api(rows[0].path+'/export/sap')).status,200);
 assert.deepEqual(Buffer.from(await(await f.api(rows[1].path+'/export/sap')).arrayBuffer()),rows[1].bytes);
 }finally{await f.workspace.close();}
});
test('MF-05 F-MF-02: failed host save stays undelivered after reopen; same-version retry returns UI success',{skip:!bundle||!sha,timeout:90000},async()=>{
 const f=await deliveryFixture(true);try{
 const created=await(await f.api('/api/templates/use',{templateId:'cloud-cost'})).json(),path='/api/instances/'+encodeURIComponent(created.instanceId);
 assert.equal((await f.api(path+'/deliver',{})).status,500);
 const indexPath=join(f.root,'data/workspace/releases/index.yaml'),before=readFileSync(indexPath);
 await f.reopen();assert.equal((await(await f.api(path)).json()).delivered,null);
 assert.equal((await(await f.api('/api/workspace')).json()).systems.find((x:any)=>x.id===created.instanceId).delivered,null);
 renameSync(f.copies,join(f.root,'failed-storage-preserved'));
 const retry=await f.api(path+'/deliver',{});assert.equal(retry.status,201,await retry.clone().text());const result=await retry.json();
 assert.equal(result.version,'1.0.0');assert.equal(result.system.delivered.version,result.version);
 assert.ok(existsSync(join(f.copies,result.packageId,'1.0.0.json')));assert.deepEqual(readFileSync(indexPath),before);
 assert.equal((await f.api(path+'/deliver',{})).status,422);assert.deepEqual(readFileSync(indexPath),before);
 assert.deepEqual(Buffer.from(await(await f.api(path+'/export/sap')).arrayBuffer()),readFileSync(join(f.copies,result.packageId,'1.0.0.sap.yaml')));
 }finally{await f.workspace.close();}
});

test('MF-05 F-MF-03: missing/empty index and interrupted orphan cannot overwrite any immutable snapshot',{skip:!bundle||!sha,timeout:90000},async()=>{
 for(const fault of ['missing-index','empty-index','orphan']){
  const f=await deliveryFixture();try{
   const created=await(await f.api('/api/templates/use',{templateId:'cloud-cost'})).json(),path='/api/instances/'+encodeURIComponent(created.instanceId);
   const first=await(await f.api(path+'/deliver',{})).json(),id=first.packageId;
   const releases=join(f.root,'data/workspace/releases'),index=join(releases,'index.yaml'),snapshot=join(releases,id,'1.0.0.sap.yaml'),before=readFileSync(snapshot),indexBefore=readFileSync(index);
   assert.equal((await f.api(path+'/metrics/'+created.system.metrics[0].id,{description:'合成修改；发布索引异常不能覆盖历史'},'PATCH')).status,200);
   let protectedPath=snapshot,protectedBytes=before;
   if(fault==='orphan'){protectedPath=join(releases,id,'1.0.1.sap.yaml');protectedBytes=Buffer.from('synthetic interrupted publication');writeFileSync(protectedPath,protectedBytes);}
   else{renameSync(index,join(f.root,'original-index-preserved.yaml'));if(fault==='empty-index')writeFileSync(index,'releases: []\n');}
   const failed=await f.api(path+'/deliver',{});assert.ok(failed.status>=400,fault+' must fail closed');
   assert.deepEqual(readFileSync(protectedPath),protectedBytes,fault+' must not overwrite immutable bytes');assert.deepEqual(readFileSync(snapshot),before);
   assert.deepEqual(readFileSync(join(f.copies,id,'1.0.0.sap.yaml')),before);assert.ok(!existsSync(join(f.copies,id,'1.0.1.json')));
   if(fault==='missing-index')assert.ok(!existsSync(index));
   else assert.deepEqual(readFileSync(index),fault==='empty-index'?Buffer.from('releases: []\n'):indexBefore);
   // Explicit fixture restoration preserves faulty material; product does not auto-rebuild an index.
   if(fault==='orphan')renameSync(protectedPath,join(f.root,'orphan-preserved.sap.yaml'));
   else{if(existsSync(index))renameSync(index,join(f.root,'empty-index-preserved.yaml'));renameSync(join(f.root,'original-index-preserved.yaml'),index);}
   const next=await f.api(path+'/deliver',{});assert.equal(next.status,201,await next.clone().text());assert.equal((await next.json()).version,'1.0.1');assert.deepEqual(readFileSync(snapshot),before);
  }finally{await f.workspace.close();}
 }
});

for(const fault of ['empty','partial'])test('MF-05 F-MF-03: cross-system '+fault+' history refuses publication before any write',{skip:!bundle||!sha,timeout:90000},async()=>{
 const f=await deliveryFixture();try{
  const make=async(templateId:string)=>{const r=await f.api('/api/templates/use',{templateId});assert.equal(r.status,201);return '/api/instances/'+encodeURIComponent((await r.json()).instanceId);};
  const a=await make('cloud-cost'),firstResponse=await f.api(a+'/deliver',{});assert.equal(firstResponse.status,201);const first=await firstResponse.json();
  if(fault==='partial'){const c=await make('saas-subscription');assert.equal((await f.api(c+'/deliver',{})).status,201);}
  const b=await make('apparel-brand-retail'),dir=join(f.root,'data/workspace/releases'),index=join(dir,'index.yaml'),original=readFileSync(index),history=parseYaml(original.toString());
  const snapshot=join(dir,first.packageId,'1.0.0.sap.yaml'),bytes=readFileSync(snapshot),damaged=Buffer.from(JSON.stringify({releases:history.releases.slice(1)}));
  renameSync(index,join(f.root,'complete-index-preserved.yaml'));writeFileSync(index,damaged);
  const response=await f.api(b+'/deliver',{});assert.ok(response.status>=400,fault+' history must not permit another system to publish');
  assert.deepEqual(readFileSync(index),damaged);assert.deepEqual(readFileSync(snapshot),bytes);assert.deepEqual(readFileSync(join(f.copies,first.packageId,'1.0.0.sap.yaml')),bytes);
  // Restoring the original register is explicit fixture work, never automatic product recovery.
  renameSync(index,join(f.root,'damaged-index-preserved.yaml'));renameSync(join(f.root,'complete-index-preserved.yaml'),index);
  assert.deepEqual(Buffer.from(await(await f.api(a+'/export/sap')).arrayBuffer()),bytes);
  assert.equal((await f.api(b+'/deliver',{})).status,201);assert.deepEqual(readFileSync(snapshot),bytes);
 }finally{await f.workspace.close();}
});
