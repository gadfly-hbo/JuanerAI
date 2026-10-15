// Offline coverage of already-frozen synthetic source fixtures through the actual product.
import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const source=process.env.SDK_CONSUMER_ROOT,evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR,fixtures=process.env.R1_FIXTURE_ROOT,bin=process.env.JUANERAI_TOOLCHAIN_BIN;
assert.ok(source&&evidence&&fixtures&&bin);
await mkdir(evidence,{recursive:true});
const load=p=>import(pathToFileURL(resolve(source,p)).href);
const {createOpenAnalysisWorkspace}=await load('packages/application/open-analysis-workspace.ts');
const {createLocalOpenAnalysisStore}=await load('adapters/storage-local/open-analysis.ts');
const {createLocalAnalysisRequestLedger}=await load('adapters/storage-local/analysis-request-ledger.ts');
const {createMemberSourcePreparation}=await load('adapters/analytics-duckdb/member-source-inspection.ts');
const {verifyOpenAnalysisIntegerSum}=await load('adapters/analytics-duckdb/open-analysis-verification.ts');
const {createPiSessionOpenAnalysisRuntime}=await load('adapters/agent-pi/native-open-analysis.ts');
const {createPersistentRuntimeState}=await load('adapters/agent-pi/persistent-runtime-state.ts');
const {createApprovedProviderCredentials}=await load('adapters/agent-pi/provider-credentials.ts');
const {taskHash}=await load('packages/product-core/member-task.ts');
const python=join(bin,'python3'),pythonVersion=execFileSync(python,['--version'],{encoding:'utf8'}).trim().replace('Python ','');
const inspect=createMemberSourcePreparation({pythonExecutable:python,pythonVersion}).inspectSources;
globalThis.fetch=async()=>{throw Error('OFFLINE_NETWORK_FORBIDDEN');};
const checks=[];
for(const kind of ['cells-100000','bytes-32MiB','sheets-2048'])for(const candidate of ['MiniMax-M3','mimo-v2.6-flash']){
 const directory=kind==='sheets-2048'?'large-fixtures-002':'capacity-fixtures-001',manifest=JSON.parse(await readFile(join(fixtures,directory,'manifest.json'),'utf8'));
 const files=manifest.files.filter(f=>kind==='sheets-2048'?f.format==='xlsx':f.batch===kind);
 const uploads=[];
 for(const file of files){const bytes=await readFile(join(fixtures,directory,file.path));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);uploads.push({source_id:randomUUID(),display_name:file.path,format:file.format,bytes});}
 const root=await mkdtemp(join(evidence,kind+'-'+candidate+'-')),id=randomUUID(),store=createLocalOpenAnalysisStore({projectRoot:root}),ledger=createLocalAnalysisRequestLedger({projectRoot:root});
 let selected,calls=0,calculations=0;const requests=[];
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:root,ledger,nativeObjectArguments:true,analysisModel:candidate,credentials:createApprovedProviderCredentials({environment:{}}),r1r4:{contextAdmission:{policyVersion:'synthetic-large-joint-v1',protocolOverheadTokens:512,safetyMarginTokens:8192}},modelTransport:async request=>{
  calls++;assert.ok(calls<=6);assert.ok(Object.isFrozen(request));requests.push({model:request.model,messages:request.messages,maxOutputTokens:request.maxOutputTokens});
  const last=request.messages.filter(m=>m.role==='tool').at(-1)?.text??'',item=selected.sources.at(-1),sheet=item.sheets.filter(s=>s.state==='visible').at(-1);
  const base=`source/${item.source_id}/${item.sha256}/sheet/${encodeURIComponent(sheet.sheet_id)}`;
  if(calls===2){const catalog=JSON.parse(last);assert.equal(catalog.sources.length,files.length);assert.ok(Buffer.byteLength(last)<32768);assert.equal(catalog.sources.at(-1).sheet_count,kind==='sheets-2048'?64:1);}
  if(calls===3){assert.ok(last.includes(sheet.sheet_id));assert.equal(calculations,0);}
  if(calls===4){assert.ok(last.includes('header_cell_path'));assert.ok(!last.includes('bash'));}
  const inputs=selected.sources.map(s=>({source_id:s.source_id,sheet_id:s.sheets[0].sheet_id,column:'A',group_mode:'none',filters:[]}));
  const framework=kind==='bytes-32MiB'?{name:'set_multisource_framework',arguments:{goal:'合成四来源完整数据行计数',combination:'union_all',numeric_mode:'integer',operation:'count',unit:'行',inputs}}:{name:'set_framework',arguments:{goal:'合成选定工作表完整数据行计数',source_id:item.source_id,sheet_id:sheet.sheet_id,operation:'count',column:'A',unit:'行',group_mode:'none'}};
  const content=calls===1?[{kind:'tool',id:'catalog',name:'inspect_selected',arguments:{}}]:calls===2?[{kind:'tool',id:'last-sheet',name:'read',arguments:{path:`source/${item.source_id}/${item.sha256}/sheets.txt`,offset:kind==='sheets-2048'?64:1,limit:1}}]:calls===3?[{kind:'tool',id:'last-column',name:'read',arguments:{path:base+'/columns.txt',offset:kind==='cells-100000'?100:1,limit:1}}]:calls===4?[{kind:'tool',id:'framework',...framework}]:calls===5?[{kind:'tool',id:'calculate',name:'calculate_and_verify',arguments:{}}]:[{kind:'text',text:'已按指定工作表或四来源完整行范围实际计数；未推断原因。'}],stop=calls<=5?'tools':'complete';
  return {content,stop,usage:{inputTokens:7,outputTokens:3},outcome:{model:{provider:request.model.provider,id:request.model.id,protocol:request.model.protocol},stop,physicalStatus:'response-received',usageFinal:true,usage:{inputTokens:{kind:'known',value:7},outputTokens:{kind:'known',value:3}},diagnostic:'COMPLETE'}};
 }});
 const app=createOpenAnalysisWorkspace({store,ledger,runtime,inspect:async input=>{selected=await inspect(input);return selected;},verify:async(p,v,s)=>{calculations++;return verifyOpenAnalysisIntegerSum(p,v,s);},authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)})});
 try{
  await app.submit({version:'1.0',command_id:id,question:'离线合成完整行计数 '+kind,confirmed:true,sources:uploads});await app.collect();const task=app.read(id),state=createPersistentRuntimeState({projectRoot:root});
  await writeFile(join(root,'joint-result.json'),JSON.stringify({kind,candidate,task,requests,ledger:ledger.read(id),accounting:state.readAccounting(id),audit:state.readAudit(id),calls,calculations,note:kind==='sheets-2048'?'All 2048 sheets retained and last sheet reached; Outcome counts only explicitly selected last sheet, not all sheets.':'Count uses full original selected data, not read previews.'}));
  assert.equal(task.state,'saved');assert.equal(calls,6);assert.equal(calculations,1);assert.equal(task.outcome.calculation.value,kind==='sheets-2048'?'1':kind==='bytes-32MiB'?'3996':'999');assert.equal(task.outcome.verification.grade,'independent_arithmetic');assert.equal(taskHash(task.outcome),taskHash(createLocalOpenAnalysisStore({projectRoot:root}).read(id).outcome));assert.equal(ledger.pending().length,0);assert.equal(state.readAccounting(id).usage.reservedOutputTokens,0);
  const cells=task.source.sources.reduce((n,s)=>n+s.sheets.reduce((m,t)=>m+t.rows.reduce((a,row)=>a+row.cells.length,0),0),0),sheets=task.source.sources.reduce((n,s)=>n+s.sheets.length,0);
  if(kind==='cells-100000')assert.equal(cells,100000);if(kind==='sheets-2048')assert.equal(sheets,2048);if(kind==='bytes-32MiB')assert.equal(uploads.reduce((n,s)=>n+s.bytes.length,0),33554432);
  checks.push({kind,candidate,status:'PASS',root,files:files.length,sheets,cells,calls,calculations,value:task.outcome.calculation.value});
 }catch(error){checks.push({kind,candidate,status:'FAIL',root,error:{name:error.name,code:error.code,message:error.message}});throw error;}
 finally{await writeFile(join(evidence,'checks.json'),JSON.stringify(checks,null,2));await app.close();}
}
console.log(JSON.stringify(checks));
