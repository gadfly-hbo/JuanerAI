import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
/** Test-only composition; synthetic codec exclusively, never discovers credentials. */
export async function buildSyntheticDecisionRuntime({source,receiptPath,run,host,dependencies,esbuildPath}){
const receipt=JSON.parse(readFileSync(receiptPath)),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(receipt.commit,'c11f8da8d8db3b2d5ae2424941a24307471ad972');assert.equal(receipt.files.length,72);
for(const f of receipt.files)assert.equal(sha(readFileSync(join(source,f.path))),f.sha256);
mkdirSync(run);const program=join(run,'program');mkdirSync(program);symlinkSync(dependencies,join(program,'node_modules'));
const model={provider:'synthetic-primary',id:'synthetic-primary',protocol:'openai-completions',endpoint:'https://example.invalid/v1',contextWindow:128000,maxOutputTokens:8192};const fallback={...model,provider:'synthetic-fallback',id:'synthetic-fallback'};
writeFileSync(join(program,'plugin.ts'),`export {listProjects} from '${source}/server/db.ts';export {buildBoardView} from '${source}/server/board.ts';export {startServer} from '${source}/server/index.ts';export {composeAgent} from '${source}/server/agent/compose.ts';export {loadCalibrationContext} from '${source}/server/reports.ts';export {createPiTransport} from 'pi-agent-runtime';`);
writeFileSync(join(program,'history.ts'),`export {buildBoardView} from '${source}/server/board.ts';export {listProjects} from '${source}/server/db.ts';export {loadCalibrationContext} from '${source}/server/reports.ts';`);
writeFileSync(join(program,'fixture.ts'),`import {listProjects,buildBoardView,startServer,composeAgent,loadCalibrationContext,createPiTransport} from './plugin.mjs';
import {join} from 'node:path';import {appendFileSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {runDecisionPlatformChild} from '${host}/adapters/decision-platform/child.ts';import {createDecisionExtractionScope} from '${host}/adapters/decision-platform/extraction-scope.ts';
globalThis.fetch=async()=>{throw Error('NETWORK FORBIDDEN')};let scope,ownedRoot;
const model=${JSON.stringify(model)},fallback=${JSON.stringify(fallback)};
function sse(text){return new Response('data: '+JSON.stringify({id:'v',object:'chat.completion.chunk',created:1,model:'synthetic',choices:[{index:0,delta:{role:'assistant',content:text},finish_reason:null}]})+'\\n\\ndata: '+JSON.stringify({id:'v',object:'chat.completion.chunk',created:1,model:'synthetic',choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}})+'\\n\\ndata: [DONE]\\n\\n',{headers:{'content-type':'text/event-stream'}});}
runDecisionPlatformChild({sourceCommit:'${receipt.commit}',runtimeState:project=>scope.state(project),readProjects:()=>{const db=new DatabaseSync(join(ownedRoot,'board.db'),{readOnly:true});try{return listProjects(db)}finally{db.close()}},readBoard:project=>{const db=new DatabaseSync(join(ownedRoot,'board.db'),{readOnly:true});try{return {...buildBoardView(db,project,{notifyConfigured:false,imConfigured:false}),hostCalibration:loadCalibrationContext(db,project)??null}}finally{db.close()}},canClose:()=>{const s=scope.state();return !s.active&&!s.unknown},start(dataRoot,track,authorize){
 ownedRoot=dataRoot;scope=createDecisionExtractionScope({dataRoot,authorize,calibration:project=>{const db=new DatabaseSync(join(dataRoot,'board.db'),{readOnly:true});try{return loadCalibrationContext(db,project)}finally{db.close()}}});
 const counts=new Map();const transport=m=>createPiTransport({model:m,apiKey:'synthetic-only',fetch:async(_url,init)=>{
 const body=JSON.parse(init.body);const prompt=JSON.stringify(body.messages);const match=/CASE_(normal|repair|fallbackbad|bothfail|revoked|denied)/.exec(prompt);const mode=match?.[1]??'normal';const n=(counts.get(mode)??0)+1;counts.set(mode,n);appendFileSync(join(dataRoot,'synthetic-calls.jsonl'),JSON.stringify({mode,n,model:m.id})+'\\n');await new Promise(r=>setTimeout(r,100));
 if(mode==='bothfail'||mode==='fallbackbad'&&n===1)return new Response('{"error":{"message":"synthetic unavailable"}}',{status:503,headers:{'content-type':'application/json'}});
 return sse(mode==='fallbackbad'||mode==='repair'&&n===1?'[{invalid':JSON.stringify([{title:'合成建议',rationale:'合成报告',expectedImpact:'待验证',priority:'low',effort:'low',evidence:{facts:[],level:'经验假设',reasoning:'无真实数据'}}]));
 }});
 const agent=composeAgent(dataRoot,[{model,transport:transport(model)},{model:fallback,transport:transport(fallback)}],scope.authorize);
 return startServer(0,'127.0.0.1',{dbPath:join(dataRoot,'board.db'),projectsDir:join(dataRoot,'projects'),distDir:join(dataRoot,'no-ui'),notifyFile:join(dataRoot,'no-notify'),notifyStateFile:join(dataRoot,'notify-state'),agentAuditPath:agent.auditPath,agentLedger:agent.store,agentRunner:{runExtraction:input=>track(()=>scope.run(input,()=>agent.runner.runExtraction(input)))}});
}});`);
const require=createRequire(import.meta.url),esbuild=require(esbuildPath);
await esbuild.build({entryPoints:[join(program,'plugin.ts')],outfile:join(program,'plugin.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'warning'});
await esbuild.build({entryPoints:[join(program,'history.ts')],outfile:join(program,'history.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'warning'});
await esbuild.build({entryPoints:[join(program,'fixture.ts')],outfile:join(program,'entry.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',external:['./plugin.mjs'],logLevel:'warning'});
return {program,entry:join(program,'entry.mjs'),sourceCommit:receipt.commit,models:[model,fallback]};
}
