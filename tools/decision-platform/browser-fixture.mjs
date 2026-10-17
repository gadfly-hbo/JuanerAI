// Explicit, test-only real-host composition for supported Chrome acceptance.
// Faults are injected at host admission or the fixed child HTTP boundary, never into product code.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline';
const [sourceRoot,resourceRoot,resourceHash,run]=process.argv.slice(2).map(v=>v);
const runtimeCase=process.argv[6]??'normal';
assert(['normal','missing','startfail'].includes(runtimeCase));
assert(sourceRoot&&resourceRoot&&resourceHash&&run,'explicit fixed inputs and new evidence run required');
assert(!existsSync(run),'never reuse an old data root');mkdirSync(run);
const load=p=>import(pathToFileURL(join(sourceRoot,p)).href);
const {createPersonalOpenAnalysisWorkspace}=await load('profiles/personal/open-analysis.ts');
const {createPersonalDecisionRuntime,createPersonalDecisionWorkspace}=await load('profiles/personal/decision-platform.ts');
const {createDecisionHistoryReader}=await load('adapters/decision-platform/history.ts');
const {modelRecipient}=await load('adapters/decision-platform/extraction-scope.ts');
const {loadDecisionResourceBundle}=await load('adapters/decision-platform/materials.ts');
const {startBrowserMembershipServer}=await load('apps/browser/local-server.ts');
const resource=await loadDecisionResourceBundle(resourceRoot,resourceHash),projectRoot=join(run,'host-project'),dataRoot=join(run,'plugin-data');mkdirSync(projectRoot);
const projectId=randomUUID();let syntheticCalls=0,replyCase='normal',nextFault=null,release=null,sourceMissing=null;
const counters={hostWrites:0,pluginWrites:0,droppedReplies:0,deniedWrites:0};
const log=(type,data={})=>appendFileSync(join(run,'fixture-events.jsonl'),JSON.stringify({at:new Date().toISOString(),type,...data})+'\n');
const open=createPersonalOpenAnalysisWorkspace({projectRoot,project_id:projectId,inspect:async()=>assert.fail('no source inspection'),authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),runtime:{async run(){syntheticCalls++;return {text:JSON.stringify({kind:'answer',text:'CASE_'+replyCase+' 合成报告，仅用于接入验收；未核验真实业务事实。'}),tools:[]};}}});
async function newTask(name,mode='normal'){replyCase=mode;const id=randomUUID();await open.submit({version:'1.0',command_id:id,question:name,confirmed:true,sources:[]});await open.collect();assert.equal(open.read(id).state,'saved');return {id,title:name};}
const tasks=[await newTask('销售合成验收021'),await newTask('另一任务合成验收021')];
const history=await import(pathToFileURL(join(resource.programRoot,'history.mjs')).href);
const owned=createPersonalDecisionRuntime({node:resource.node,entry:resource.entry,programRoot:resource.programRoot,dataRoot,sourceCommit:resource.sourceCommit,recipients:JSON.parse(readFileSync(join(resourceRoot,'provenance/models.json'))).map(modelRecipient),verifyMaterials:resource.verifyMaterials,history:createDecisionHistoryReader({dataRoot,sourceCommit:resource.sourceCommit,board:(db,id)=>({...history.buildBoardView(db,id,{notifyConfigured:false,imConfigured:false}),hostCalibration:history.loadCalibrationContext(db,id)??null}),projects:history.listProjects})});
const runtime={...owned,async start(){if(runtimeCase==='startfail')throw Error('DP_START_FAILED');const live=await owned.start();writeFileSync(join(run,'owned-child.json'),JSON.stringify({pid:live.pid,node:resource.node.path,entry:resource.entry.path,parent:process.pid}));return {...live,async request(path,method,body){
 const mutation=method==='POST'||method==='PATCH';if(mutation)counters.pluginWrites++;
 const fault=mutation?nextFault:null;if(fault==='hold'||fault==='drop')nextFault=null;
 if(fault==='hold'){log('held',{path,method});await new Promise(r=>{release=r;});log('released',{path,method});}
 const result=await live.request(path,method,body);log('plugin-response',{path,method});
 if(fault==='drop'){counters.droppedReplies++;log('dropped-response',{path,method});throw Error('SYNTHETIC_REPLY_LOST');}
 return result;
 }};}};
const actual=createPersonalDecisionWorkspace({projectRoot,projectId,runtime,check:()=>{},readTask:id=>{if(id===sourceMissing)return null;try{return open.read(id);}catch{return null;}},reportCopy:open.reportCopy});
const workspace={...actual,async write(taskId,operationId,command){counters.hostWrites++;log('host-write',{operationId,commandType:command.type});if(nextFault==='fail'){nextFault=null;counters.deniedWrites++;log('denied-before-intent',{operationId});throw Error('DP_SOURCE_MISSING');}return actual.write(taskId,operationId,command);}};
const deps={store:{},workspace:{},open,decisionPlatform:{project:id=>{assert.equal(id,projectId);return workspace;}}};
if(runtimeCase==='missing')delete deps.decisionPlatform;
const host=await startBrowserMembershipServer(deps);const connection={origin:host.origin,bootstrap:host.bootstrap,projectId,tasks,hostPid:process.pid,actualProviderCalls:0};writeFileSync(join(run,'connection-private.json'),JSON.stringify(connection,null,2));console.log(JSON.stringify({ready:true,...connection}));
let closing=false;
async function close(){if(closing)return;if(release)throw Error('release pending test gate before teardown');closing=true;await host.close();await open.close();try{await owned.close();}catch(e){log('teardown-unknown',{message:e.message});}writeFileSync(join(run,'closed.json'),JSON.stringify({state:owned.state(),syntheticCalls,counters,at:new Date().toISOString()}));process.exit(0);}
setTimeout(()=>void close().catch(e=>console.error(e.message)),25*60*1000);
createInterface({input:process.stdin}).on('line',line=>{void(async()=>{const [command,value]=line.trim().split(' ');
 if(command==='fault'){assert(['hold','drop','fail','none'].includes(value));nextFault=value==='none'?null:value;log('fault-armed',{fault:nextFault});console.log(JSON.stringify({armed:nextFault}));}
 else if(command==='release'){assert(release);const r=release;release=null;r();console.log('released');}
 else if(command==='source'){sourceMissing=value==='restore'?null:tasks[0].id;console.log(JSON.stringify({sourceMissing}));}
 else if(command==='revise'){replyCase='normal';const id=tasks[0].id,old=open.read(id);await open.revise(id,{version:'1.0',command_id:randomUUID(),expected_revision:old.identity.revision,question:'销售合成验收021新版'});await open.collect();console.log(JSON.stringify({revision:open.read(id).identity.revision}));}
 else if(command==='new'){const t=await newTask('合成恢复场景 '+value,value);tasks.push(t);writeFileSync(join(run,'tasks.json'),JSON.stringify(tasks));console.log(JSON.stringify(t));}
 else if(command==='snapshot'){const snapshots={};for(const t of tasks)snapshots[t.id]=await actual.board(t.id);const state={snapshots,counters,syntheticCalls};writeFileSync(join(run,'latest-backend.json'),JSON.stringify(state,null,2));console.log(JSON.stringify({snapshotWritten:true,counters,syntheticCalls}));}
 else if(command==='close')await close();else throw Error('unknown fixture command');
})().catch(e=>{log('fixture-command-failure',{message:e.message});console.log(JSON.stringify({fixtureError:e.message}));});});
