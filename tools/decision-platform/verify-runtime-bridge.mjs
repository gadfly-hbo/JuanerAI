import {fileURLToPath} from 'node:url';
import {loadDecisionResourceBundle} from '../../adapters/decision-platform/materials.ts';
import {buildSyntheticDecisionRuntime} from './build-synthetic-runtime.mjs';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,realpathSync,symlinkSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createDecisionEffects} from '../../packages/application/decision-effects.ts';
import {createDecisionEffectsGateway} from '../../adapters/decision-platform/effects-gateway.ts';
import {DatabaseSync} from 'node:sqlite';
import {createDecisionPlatformProcess} from '../../adapters/decision-platform/process.ts';
import {createDecisionGateway} from '../../adapters/decision-platform/gateway.ts';
import {createDecisionStore} from '../../adapters/decision-platform/store.ts';
import {createDecisionWorkspace} from '../../packages/application/decision-platform.ts';
import {createDecisionMaterialPolicy} from '../../adapters/decision-platform/material-policy.ts';
import {createDecisionRuntimeAuthorization} from '../../adapters/decision-platform/runtime-authorization.ts';
import {modelRecipient,calibrationDigest} from '../../adapters/decision-platform/extraction-scope.ts';
const [E,esbuildPath,runName,resourceRoot,resourceHash]=process.argv.slice(2);if(!E||!esbuildPath||!runName||!/^[a-z0-9-]+$/.test(runName))throw Error('usage: verify-runtime-bridge.mjs evidence-root esbuild-path run-name');const host=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,''),run=join(E,runName);
const resource=resourceRoot?await loadDecisionResourceBundle(resourceRoot,resourceHash):null;
if(resource)mkdirSync(run);
const built=resource?{...resource,program:resource.programRoot,entry:resource.entry.path,models:JSON.parse(readFileSync(join(resourceRoot,'provenance/models.json')))}:await buildSyntheticDecisionRuntime({source:join(E,'upstream-recovery-source-001'),receiptPath:join(E,'runtime-material-receipt-c11f8da.json'),run,host,dependencies:join(E,'runtime-synthetic-source-001/node_modules'),esbuildPath});
const program=built.program,receipt={commit:built.sourceCommit},[model,fallback]=built.models,sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hostRoot=join(run,'host');mkdirSync(hostRoot);const projectId=randomUUID(),store=createDecisionStore({projectRoot:hostRoot,projectId}),authority=createDecisionRuntimeAuthorization(store);const modes=new Map(),requests=[];
const node=resource?.node.path??realpathSync(process.execPath);const p=createDecisionPlatformProcess({node:{path:node,sha256:sha(readFileSync(node))},entry:{path:join(program,'entry.mjs'),sha256:sha(readFileSync(join(program,'entry.mjs')))},programRoot:program,dataRoot:join(run,'data'),sourceCommit:receipt.commit,canStop:async()=>true,authorize:async r=>{requests.push(r);const mode=modes.get(r.physicalName);return mode!=='denied'&&!(mode==='revoked'&&r.kind==='publish')&&authority.authorize(r)}});
const session=await p.start();writeFileSync(join(run,'owned-pid.json'),JSON.stringify({pid:session.pid,node,entry:built.entry,resourceRoot:resourceRoot??null,resourceHash:resourceHash??null}));const gateway=createDecisionGateway({dataRoot:join(run,'data'),board:project=>session.readBoard(project),request:(...args)=>session.request(...args)});
const workspace=createDecisionWorkspace({projectId,store,gateway,newId:randomUUID,now:()=>new Date().toISOString(),authorize:async()=>{},prepareExtraction:async link=>{const scope={report:link.source,teachSha256:calibrationDigest(undefined),recipients:[modelRecipient(model),modelRecipient(fallback)]};modes.set(link.physicalName,link.source.revision);authority.permit(link.id,createDecisionMaterialPolicy().grant({...scope,expiresAt:Date.now()+120000}));}});
const checks=[];const sources=[];
for(const mode of ['normal','repair','denied','revoked','fallbackbad','bothfail']){
 const content=Buffer.from('# CASE_'+mode+'\n纯合成指标'),source={projectId,taskId:randomUUID(),sourceId:randomUUID(),revision:mode,format:'md',filename:'report.md',sha256:sha(content),bytes:content.length},input={operationId:randomUUID(),source,content,title:'合成 '+mode};
 const link=await workspace.send(input),plugin=store.binding(source.taskId).pluginProjectId;
 if(mode==='normal'){const active=await session.runtimeState(plugin);assert.equal(active.active,true);assert.equal(active.unknown,false);await assert.rejects(p.close(),/DP_BUSY_OR_UNKNOWN/);}
 let report;for(let i=0;i<100;i++){report=await gateway.report(plugin,link.physicalName);if(['done','failed'].includes(report.status))break;await new Promise(r=>setTimeout(r,20));}
 assert.equal(report.status,['normal','repair'].includes(mode)?'done':'failed',mode);
 const ledger=JSON.parse(readFileSync(join(run,'data/agent-ledger.json'))).tasks['extract:'+plugin+':'+link.physicalName.slice(0,-3)];
 assert.equal(ledger.usage.modelCalls,{normal:1,repair:2,denied:0,revoked:1,fallbackbad:2,bothfail:2}[mode],mode);
 assert.equal(ledger.usage.reservedOutputTokens,{fallbackbad:8192,bothfail:16384}[mode]??0);
 assert.deepEqual(await workspace.send(input),link);assert.equal((await session.request('/api/projects/'+plugin+'/board')).reports.length,1);
 const state=await session.runtimeState(plugin);assert.equal(state.unknown,['fallbackbad','bothfail'].includes(mode));
 sources.push({mode,plugin,link,input,ledger});checks.push({mode,status:'PASS',modelCalls:ledger.usage.modelCalls,reserved:ledger.usage.reservedOutputTokens});
}
// Host-owned command intents against the actual fixed plugin DB.
const normalCase=sources[0],taskId=normalCase.input.source.taskId,plugin=normalCase.plugin;
let loseNext=false,posts=0;
const effectGateway=createDecisionEffectsGateway({store,board:p=>session.readBoard(p),state:p=>session.runtimeState(p),request:async(...args)=>{posts++;const result=await session.request(...args);if(loseNext){loseNext=false;throw Error('synthetic lost reply')}return result;}});
const effects=createDecisionEffects({store,gateway:effectGateway,authorize:async()=>{},now:()=>new Date().toISOString()});
let board=await session.readBoard(plugin);const action=board.actionItems[0];const fields={title:'合成任务',owner:'合成角色',dueDate:'2026-10-20',status:'todo',priority:'medium',note:''};
await assert.rejects(effects.write(randomUUID(),taskId,{type:'task-create',actionId:action.id,fields}),/DP_ADOPTION_REQUIRED/);
await assert.rejects(effects.write(randomUUID(),taskId,{type:'action',id:randomUUID(),status:'adopted'}),/DP_ACTION_NOT_ALLOWED/);
await effects.write(randomUUID(),taskId,{type:'action',id:action.id,status:'adopted'});
const operation=randomUUID(),command={type:'task-create',actionId:action.id,fields};loseNext=true;
await assert.rejects(effects.write(operation,taskId,command),/DP_EFFECT_UNKNOWN/);const afterLost=posts;
await assert.rejects(effects.write(operation,taskId,command),/DP_EFFECT_UNKNOWN/);await assert.rejects(effects.write(randomUUID(),taskId,command),/DP_BUSY_OR_UNKNOWN/);assert.equal(posts,afterLost);
const task=await effects.reconcile(operation);assert.equal(task.title,fields.title);assert.equal(posts,afterLost);
await effects.write(randomUUID(),taskId,{type:'task-update',id:task.id,fields:{...fields,status:'done'}});
const feedbackId=randomUUID(),feedback={type:'feedback',id:task.id,adopted:true,outcome:'仅合成反馈',metricDelta:'',review:'人工记录',score:4};
await effects.write(feedbackId,taskId,feedback);await effects.write(feedbackId,taskId,feedback);
await effects.write(randomUUID(),taskId,{type:'manual',title:'人工补充',rationale:'仅合成关注点',expectedImpact:'待验证',priority:'medium',effort:'low',reportId:Number(normalCase.link.pluginReportId)});
board=await session.readBoard(plugin);assert.equal(board.actionItems.find(a=>a.id===action.id).tasks[0].feedback.score,4);assert.equal(board.actionItems.filter(a=>a.sourceKind==='manual').length,1);
await assert.rejects(effects.write(randomUUID(),sources[4].input.source.taskId,{type:'manual',title:'blocked',rationale:'blocked',expectedImpact:'blocked',priority:'medium',effort:'low',reportId:null}),/DP_BUSY_OR_UNKNOWN/);
checks.push({mode:'host adoption/manual/task/update/feedback and lost-reply readback without duplicate POST',status:'PASS'});
assert.equal(existsSync(join(program,'data')),false);
// A real GET scans disk, inserts a pending report and recovers stale extracting rows.
const normal=sources[0],db=new DatabaseSync(join(run,'data/board.db'));const reportDir=join(run,'data/projects',normal.plugin,'reports');
writeFileSync(join(reportDir,'scan-only.md'),'synthetic scan');db.prepare("UPDATE reports SET status='extracting' WHERE id=?").run(Number(normal.link.pluginReportId));
const before=db.prepare('SELECT count(*) n FROM reports WHERE project_id=?').get(normal.plugin).n;
const snapshot=await session.readBoard(normal.plugin);assert.equal(snapshot.reports.find(r=>r.id===Number(normal.link.pluginReportId)).status,'extracting');assert.equal(db.prepare('SELECT count(*) n FROM reports WHERE project_id=?').get(normal.plugin).n,before);
await session.request('/api/projects/'+normal.plugin+'/board');const after=db.prepare('SELECT count(*) n FROM reports WHERE project_id=?').get(normal.plugin).n;
assert.equal(after,before+1);assert.equal(db.prepare('SELECT status FROM reports WHERE id=?').get(Number(normal.link.pluginReportId)).status,'failed');db.close();checks.push({mode:'GET mutates scan and stale state',status:'PASS'});
await assert.rejects(p.close(),/DP_BUSY_OR_UNKNOWN/);assert.equal(p.state(),'ready');
// This fixture intentionally retains UNKNOWN. Stop only its known child for test teardown; lock and ledger remain.
process.kill(session.pid,'SIGTERM');for(let i=0;i<100&&p.state()!=='unknown';i++)await new Promise(r=>setTimeout(r,10));assert.equal(p.state(),'unknown');
writeFileSync(join(run,'result.json'),JSON.stringify({status:'PASS',commit:receipt.commit,checks,requests,unknownPreserved:true,providerCalls:false,browser:'NOT_RUN'},null,2));console.log(JSON.stringify({status:'PASS',checks}));
