import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const root=process.env.SDK_CONSUMER_ROOT,evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR;
assert.ok(root&&evidence);await mkdir(evidence,{recursive:true});
const load=path=>import(pathToFileURL(resolve(root,path)).href);
const {createOpenAnalysisApplication}=await load('packages/application/open-analysis.ts');
const {createPiSessionOpenAnalysisRuntime}=await load('adapters/agent-pi/native-open-analysis.ts');
const {createApprovedProviderCredentials}=await load('adapters/agent-pi/provider-credentials.ts');
const {createLocalAnalysisRequestLedger}=await load('adapters/storage-local/analysis-request-ledger.ts');
const {taskHash}=await load('packages/product-core/member-task.ts');
globalThis.fetch=async()=>{throw new Error('OFFLINE_NETWORK_FORBIDDEN');};

test('J01 two synthetic 2985-row CSVs through Application / Adapter / installed native session (V02 partial)',async()=>{
 const dir=await mkdtemp(join(evidence,'juanerai-'));
 const sources=[];
 for(let n=0;n<2;n++){
  const data=Array.from({length:2985},(_,i)=>[`item-${i}`,String(i+1),'合成标签界'.repeat(20),n?'南':'北']);
  const values=[['编号','数量','标签','区域'],...data];const csv=values.map(row=>row.join(',')).join('\n');await writeFile(join(dir,`synthetic-${n}.csv`),csv);
  sources.push({source_id:randomUUID(),display_name:`synthetic-${n}.csv`,format:'csv',sha256:(await import('node:crypto')).createHash('sha256').update(csv).digest('hex'),byte_length:String(Buffer.byteLength(csv)),sheets:[{sheet_id:'csv',name:'CSV',state:'visible',rows:values.map((cells,i)=>({row:i+1,cells:cells.map((value,j)=>({column:String.fromCharCode(65+j),type:'string',value}))}))}]});
 }
 const source={version:'1.0',sources},ledger=createLocalAnalysisRequestLedger({projectRoot:dir});let calls=0,projected;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:dir,ledger,nativeObjectArguments:true,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  calls++;await writeFile(join(dir,`final-projected-request-${calls}.json`),JSON.stringify(request,null,2));
  if(calls===1)return {content:[{kind:'tool',id:'inspect-synthetic',name:'inspect_selected',arguments:{}}],stop:'tools',usage:{inputTokens:4,outputTokens:2}};
  projected=JSON.parse(request.messages.filter(m=>m.role==='tool').at(-1).text);
  return {content:[{kind:'text',text:'合成测试仅检查实际资料投影，未完成分析。'}],stop:'complete',usage:{inputTokens:4,outputTokens:2}};
 }});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};
 const app=createOpenAnalysisApplication({runtime,loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async()=>assert.fail('no framework'),verify:async()=>assert.fail('no proof'),saveOutcome:async()=>assert.fail('no outcome')});
 await assert.rejects(()=>app.run({identity,question:'检查两份合成CSV',signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});
 assert.equal(calls,2);assert.deepEqual(projected.sources.map(s=>s.sheets[0].full_data_rows),[2985,2985]);assert.equal(ledger.pending().length,0);
 await writeFile(join(dir,'measurement.json'),JSON.stringify({sourceBytes:Buffer.byteLength(JSON.stringify(source)),projectedBytes:Buffer.byteLength(JSON.stringify(projected)),physicalRequests:ledger.read(identity.task_id),note:'Synthetic requests captured after actual Adapter projection. Byte measurement is NOT a token count or actual Provider refusal. No local computation or saved Outcome in this probe.'},null,2));
 assert.ok(Buffer.byteLength(JSON.stringify(projected))<=50*1024,'model-facing inspection still exceeds native read-size target; this is old-package/product baseline evidence, not full V02');
});
