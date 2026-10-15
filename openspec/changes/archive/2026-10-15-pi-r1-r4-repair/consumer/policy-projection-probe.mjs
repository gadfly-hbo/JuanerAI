// Diagnostic through actual product Adapter, installed SDK and real offline codec.
// No admission shim, credentials read, Provider, production configuration or effects.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.SDK_CONSUMER_ROOT,evidence=process.env.SDK_CONSUMER_EVIDENCE_DIR,inputs=process.env.R1_INSPECTION_ROOT;
assert.ok(root&&evidence&&inputs);await mkdir(evidence,{recursive:true});
const load=p=>import(pathToFileURL(resolve(root,p)).href);
const {createOpenAnalysisApplication}=await load('packages/application/open-analysis.ts');
const {createPiSessionOpenAnalysisRuntime}=await load('adapters/agent-pi/native-open-analysis.ts');
const {createApprovedProviderCredentials}=await load('adapters/agent-pi/provider-credentials.ts');
const {createLocalAnalysisRequestLedger}=await load('adapters/storage-local/analysis-request-ledger.ts');
const {taskHash}=await load('packages/product-core/member-task.ts');
const entry=createRequire(resolve(root,'package.json')).resolve('pi-agent-runtime'),sdk=await import(pathToFileURL(entry).href);
globalThis.fetch=async()=>{throw Error('OFFLINE_NETWORK_FORBIDDEN');};
const byteLength=value=>Buffer.byteLength(JSON.stringify(value));
function stream(protocol,model,first){
 if(protocol==='openai-completions'){
  const delta=first?{role:'assistant',tool_calls:[{index:0,id:'synthetic-inspect',type:'function',function:{name:'inspect_selected',arguments:'{}'}}]}:{role:'assistant',content:'合成只读测量完成，尚未计算或核验。'};
  const chunk={id:'synthetic',object:'chat.completion.chunk',created:1,model,choices:[{index:0,delta,finish_reason:first?'tool_calls':'stop'}],usage:{prompt_tokens:5,completion_tokens:3,total_tokens:8}};
  return 'data: '+JSON.stringify(chunk)+'\n\ndata: [DONE]\n\n';
 }
 const events=[['message_start',{type:'message_start',message:{id:'synthetic',type:'message',role:'assistant',model,content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:5,output_tokens:0}}}],
  ['content_block_start',{type:'content_block_start',index:0,content_block:first?{type:'tool_use',id:'synthetic-inspect',name:'inspect_selected',input:{}}:{type:'text',text:''}}],
  ['content_block_delta',{type:'content_block_delta',index:0,delta:first?{type:'input_json_delta',partial_json:'{}'}:{type:'text_delta',text:'合成只读测量完成，尚未计算或核验。'}}],
  ['content_block_stop',{type:'content_block_stop',index:0}],['message_delta',{type:'message_delta',delta:{stop_reason:first?'tool_use':'end_turn',stop_sequence:null},usage:{output_tokens:3}}],['message_stop',{type:'message_stop'}]];
 return events.map(([event,data])=>'event: '+event+'\ndata: '+JSON.stringify(data)+'\n\n').join('');
}
const variants=[['primary',{}],['flash',{analysisModel:'mimo-v2.6-flash'}],['flash-thinking-off',{analysisModel:'mimo-v2.6-flash',mimoThinking:'off'}]],cases=[['wide','fixture-inspection-003/wide-fixture-inspection.json'],['many','fixture-inspection-003/many-fixture-inspection.json'],['cells','capacity-inspection-001/cells-100000-inspection.json']],results=[];
for(const [caseName,file] of cases)for(const [variant,config] of variants){
 const source=JSON.parse(await readFile(join(inputs,file),'utf8')),dir=await mkdtemp(join(evidence,caseName+'-'+variant+'-')),ledger=createLocalAnalysisRequestLedger({projectRoot:dir}),requests=[],identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'d'.repeat(64)};
 let codecs=0;
 const runtime=createPiSessionOpenAnalysisRuntime({projectRoot:dir,ledger,nativeObjectArguments:true,...config,credentials:createApprovedProviderCredentials({environment:{}}),modelTransport:async request=>{
  if(requests.length>=8)throw new sdk.RuntimeFault('BUDGET_EXHAUSTED');
  const sequence=requests.length+1,measurement={sequence,model:request.model.id,provider:request.model.provider,protocol:request.model.protocol,contextWindow:request.model.contextWindow,maxOutputTokens:request.maxOutputTokens,thinkingLevel:request.thinkingLevel??null,messageRoles:request.messages.map(m=>m.role),messageEnvelopeBytes:byteLength(request.messages),toolDeclarationBytes:request.messages.reduce((n,m)=>n+(m.tools?byteLength(m.tools):0),0),sourceIdentity:identity.scope_sha256};requests.push(measurement);
  await writeFile(join(dir,'request-'+sequence+'.json'),JSON.stringify(request),{flag:'wx'});
  return sdk.createPiTransport({model:request.model,apiKey:'synthetic-not-a-real-credential',fetch:async(_url,init)=>{
   codecs++;const body=JSON.parse(init.body);measurement.httpBodyBytes=Buffer.byteLength(init.body);measurement.httpBodySha256=createHash('sha256').update(init.body).digest('hex');measurement.httpBodyKeys=Object.keys(body);measurement.encodedToolNames=(body.tools??[]).map(t=>t.name??t.function?.name);measurement.httpMinusMessagesBytes=measurement.httpBodyBytes-measurement.messageEnvelopeBytes;
   await writeFile(join(dir,'http-'+sequence+'.json'),init.body,{flag:'wx'});
   return new Response(stream(request.model.protocol,request.model.id,sequence===1),{status:200,headers:{'content-type':'text/event-stream'}});
  }})(request);
 }});
 const app=createOpenAnalysisApplication({runtime,loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async()=>assert.fail('diagnostic must not bind'),verify:async()=>assert.fail('diagnostic must not compute'),saveOutcome:async()=>assert.fail('diagnostic must not publish')});
 let terminal='unexpected-success';try{await app.run({identity,question:'仅测量本任务合成获准资料投影；没有真实分析成果。',signal:new AbortController().signal});}catch(error){terminal=error.code??error.reason??'unknown';}
 assert.ok(requests.length>0,'actual product Adapter did not reach its transport');
 assert.equal(ledger.pending().length,0,'offline codec must settle each entered physical ledger call');
 const result={caseName,variant,directory:dir,inspectionBytes:byteLength(source),sourceCount:source.sources.length,sheetCount:source.sources.reduce((n,s)=>n+s.sheets.length,0),sourceHash:identity.scope_sha256,terminal,requests,codecCalls:codecs,ledger:ledger.read(identity.task_id),scope:'Actual Application/Adapter/old installed SDK/real codec with synthetic offline SSE; no new guard or provider token evidence'};
 await writeFile(join(dir,'result.json'),JSON.stringify(result,null,2),{flag:'wx'});results.push(result);
 console.log(JSON.stringify({caseName,variant,terminal,codecCalls:codecs,requests:requests.map(r=>({messages:r.messageEnvelopeBytes,http:r.httpBodyBytes,delta:r.httpMinusMessagesBytes}))}));
}
await writeFile(join(evidence,'policy-projection-results.json'),JSON.stringify({entry,productionPolicy:'UNKNOWN; bytes are not token overhead or safety margin',results},null,2),{flag:'wx'});
