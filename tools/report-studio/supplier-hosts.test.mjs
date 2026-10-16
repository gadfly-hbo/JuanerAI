// Actual fixed SDK and supplier SessionHost; synthetic credentials/transport only.
import {test} from 'node:test';import {createHash,randomUUID} from 'node:crypto';import assert from 'node:assert/strict';import {mkdtemp,mkdir,realpath,rm,cp,readdir,readFile,writeFile,readlink} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const load=path=>import(pathToFileURL(join(root,path)).href),{createBuiltinAgentHosts}=await load('dist/agent/builtin-hosts.js'),{createReportStudioPolicy}=await load('dist/juanerai/policy.js'),{createStudioConfiguration}=await load('dist/juanerai/configuration.js');
const id='proj_synthetic',hash='a'.repeat(64);const uuid=n=>`${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`;
async function fixture(t,transport,admissionAllowed,materials=[]){const data=await realpath(await mkdtemp(join(tmpdir(),'studio-hosts-')));await mkdir(join(data,id));const policy=createReportStudioPolicy({dataRoot:data,now:()=>new Date().toISOString()}),keys=new Map();let hosts;
 const configuration=createStudioConfiguration({dataRoot:data,newId:()=>uuid(1),canChange:async()=>!policy.activeOperations().length&&(!hosts||await hosts.isIdle()),credentials:{async read(p){return keys.get(p)??null;},async save(p,key){keys.set(p,key);},async remove(p){keys.delete(p);}}});
 const boundary=async()=>({recipients_sha256:createHash('sha256').update(JSON.stringify((await configuration.status()).providers)).digest('hex'),materials});hosts=createBuiltinAgentHosts({dataRoot:data,skillsDir:join(root,'assets/skills/ppt'),policy,configuration,boundary,admissionAllowed,projectExists:async p=>p===id,makeTransport:(_model,key)=>{assert.equal(key,'synthetic-key');return transport;}});t.after(async()=>{
 for(const pending of hosts.hosts.values()){const host=await pending.catch(()=>null);await host?.waitForIdle();}await new Promise(resolve=>setTimeout(resolve,0));
 const evidence=process.env.JUANERAI_REPORT_STUDIO_HOSTS_EVIDENCE;
 if(evidence){
  await mkdir(evidence,{recursive:true});const output=join(evidence,t.name.replace(/[^a-zA-Z0-9_-]/g,'_')+'-'+randomUUID());await cp(data,output,{recursive:true,errorOnExist:true,force:false,verbatimSymlinks:true});const files=[];
  async function verify(relative=''){for(const entry of await readdir(join(data,relative),{withFileTypes:true})){const path=join(relative,entry.name);if(entry.isDirectory())await verify(path);else if(entry.isSymbolicLink()){const target=await readlink(join(data,path));assert.equal(await readlink(join(output,path)),target);files.push({path,symlink:target});}else {assert(entry.isFile());const original=await readFile(join(data,path)),copied=await readFile(join(output,path));assert.deepEqual(copied,original);files.push({path,bytes:copied.length,sha256:createHash('sha256').update(copied).digest('hex')});}}}
  await verify();await writeFile(join(output,'evidence-manifest.json'),JSON.stringify({synthetic_only:true,device:'Mac mini',source:data,files},null,2));
 }
 await hosts.close();await rm(data,{recursive:true,force:true});
});return {data,hosts,policy,configuration,boundary};}
const reply={content:[{kind:'text',text:'synthetic host reply'}],stop:'complete',usage:{inputTokens:2,outputTokens:3}};
test('RS-POLICY-01 real host history loads without key discovery, execution needs separate mode/config/grant and settles persistently',async t=>{
 let calls=0;const f=await fixture(t,async()=>{calls++;return reply;}),host=await f.hosts.get(id);assert.equal(calls,0);assert(Array.isArray(await host.history()));await assert.rejects(()=>host.send('未授权'));assert.equal(calls,0);
 await f.configuration.save('minimax-cn','synthetic-key',0);f.policy.setMode(0,true);f.policy.grant(id,0,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:false},await f.boundary());
 await host.send('已授权合成任务');await host.currentResult();await host.waitForIdle();await new Promise(r=>setTimeout(r,0));assert.equal(calls,1);assert.equal(f.policy.projectOperations(id).at(-1).state,'succeeded');assert.equal(await f.hosts.isIdle(),true);
});

async function authorize(f,provider='minimax-cn'){await f.configuration.save(provider,'synthetic-key',0);f.policy.setMode(0,true);f.policy.grant(id,0,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:false},await f.boundary());}
async function finish(host){const result=await host.currentResult();await host.waitForIdle();await new Promise(r=>setTimeout(r,0));return result;}
test('RS-POLICY-01 unresolved usage blocks retry/config/close; explicit reconciliation preserves old reservation while new settled operation is known',async t=>{
 let calls=0,failed=true;const f=await fixture(t,async()=>{calls++;if(failed)throw Error('synthetic lost usage');return reply;});await authorize(f);const host=await f.hosts.get(id);await host.send('合成未知消费');await finish(host);
 const first=f.policy.projectOperations(id).at(-1);assert.equal(first.state,'unknown');assert.equal(first.physical_settled,true);assert.equal(first.usage_known,false);assert.equal(await f.hosts.isIdle(),false);
 await assert.rejects(()=>host.send('不能绕过未知'));const priorCalls=calls;await assert.rejects(()=>f.configuration.save('xiaomi-token-plan-cn','synthetic-key',1),/RS_PROJECT_PENDING/);await assert.rejects(()=>f.hosts.reset(),/RS_PROJECT_PENDING/);assert.equal(calls,priorCalls);
 await f.hosts.reconcile(id);failed=false;await host.send('显式核对后的合成继续');assert.equal((await finish(host)).status,'succeeded');assert.equal(calls,priorCalls+1);const next=f.policy.projectOperations(id).at(-1);assert.equal(next.state,'succeeded');assert.equal(next.usage_known,true);assert.equal(f.policy.operation(first.operation_id).usage_known,false);
 const {FileBudgetStore}=await load('dist/agent/budget-store.js');const usage=new FileBudgetStore(join(f.data,id,'agent-budget.json')).usageOf(host.taskId);assert(usage.reservedOutputTokens>0);assert.equal(usage.modelCalls,calls);
});

test('RS-POLICY-01 stop is project operation stopping until physical settlement; no automatic retry or refund',async t=>{
 let admitted,release;const ready=new Promise(r=>{admitted=r;}),gate=new Promise(r=>{release=r;});const watchdog=setTimeout(()=>release(),2500);t.after(()=>{release();clearTimeout(watchdog);});
 const f=await fixture(t,async()=>{admitted();await gate;return reply;});await authorize(f);const host=await f.hosts.get(id);await host.send('合成在途停止');await ready;const logical=host.currentResult();await host.control({kind:'abort'});assert.equal(f.policy.projectOperations(id).at(-1).state,'stopping');assert.equal(await f.hosts.isIdle(),false);release();await logical;await host.waitForIdle();await new Promise(r=>setTimeout(r,0));
 const op=f.policy.projectOperations(id).at(-1);assert.equal(op.state,'unknown');assert.equal(op.physical_settled,true);assert.equal(op.usage_known,false);await f.hosts.reconcile(id);assert.equal(await f.hosts.isIdle(),true);await host.send('停止核对后的显式继续');assert.equal((await finish(host)).status,'succeeded');
});

test('RS-CONFIG-01 MiMo configuration alone cannot bypass missing image material permission',async t=>{
 let calls=0;const f=await fixture(t,async()=>{calls++;return reply;});await authorize(f,'xiaomi-token-plan-cn');const host=await f.hosts.get(id);
 await assert.rejects(()=>host.describeImage({data:'aW1hZ2U=',mimeType:'image/png'},new AbortController().signal),/RS_IMAGE_PERMISSION_REQUIRED/);assert.equal(calls,0);const op=f.policy.projectOperations(id).at(-1);assert.equal(op.state,'failed');assert.equal(op.usage_known,true);assert.equal(op.sdk_run_id,null);
});

test('RS-CONFIG-01 explicit configuration changes keep the same native session and fixed task ledger; new recipients require new grant',async t=>{
 const used=[];const f=await fixture(t,async request=>{used.push(request.model.id);return reply;});await authorize(f);const host=await f.hosts.get(id);await host.send('首轮合成');await finish(host);const session=host.sessionId;
 await f.configuration.save('xiaomi-token-plan-cn','synthetic-key',1);f.hosts.clearIdleCredentials();assert.equal(used.length,1);assert.equal(await f.hosts.get(id),host);await assert.rejects(()=>host.send('接收方变化未授权'),/RS_PERMISSION_REQUIRED/);assert.equal(used.length,1);
 f.policy.grant(id,1,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:false},await f.boundary());await host.send('明确新接收方后的合成');assert.equal((await finish(host)).status,'succeeded');
 await f.configuration.remove('minimax-cn',2);f.hosts.clearIdleCredentials();await assert.rejects(()=>host.send('移除主模型后先核对范围'),/RS_PERMISSION_REQUIRED/);
 f.policy.grant(id,2,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:false},await f.boundary());await host.send('仅备模型的合成');assert.equal((await finish(host)).status,'succeeded');assert.equal(host.sessionId,session);assert.deepEqual(used,['MiniMax-M3','MiniMax-M3','mimo-v2.6-flash']);
 const {FileBudgetStore}=await load('dist/agent/budget-store.js');assert.equal(new FileBudgetStore(join(f.data,id,'agent-budget.json')).usageOf(host.taskId).modelCalls,3);
});

test('RS-POLICY-01 existing unreadable or linked ledger is never silently treated as a new zero budget',async t=>{
 const {FileBudgetStore}=await load('dist/agent/budget-store.js'),{symlink,writeFile}=await import('node:fs/promises'),dir=await mkdtemp(join(tmpdir(),'studio-ledger-invalid-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await mkdir(join(dir,'directory.json'));assert.throws(()=>new FileBudgetStore(join(dir,'directory.json')),/STATE_FAILED/);
 const target=join(dir,'retained.json');await writeFile(target,'{"version":1,"tasks":{}}');await symlink(target,join(dir,'linked.json'));assert.throws(()=>new FileBudgetStore(join(dir,'linked.json')),/STATE_FAILED/);assert.equal(await readFile(target,'utf8'),'{"version":1,"tasks":{}}');
});

test('RS-POLICY-01 a missing previously used budget blocks cached and rebuilt Hosts without replay or native history edits',async t=>{
 let calls=0;const f=await fixture(t,async()=>{calls++;return reply;});await authorize(f);const host=await f.hosts.get(id);await host.send('合成已有账本');await finish(host);const {unlink}=await import('node:fs/promises'),sessionRoot=join(f.data,id,'session'),files=await readdir(sessionRoot,{recursive:true,withFileTypes:true}),snapshots=[];
 for(const entry of files)if(entry.isFile()){const path=join(entry.parentPath,entry.name);snapshots.push([path,await readFile(path)]);}assert(snapshots.length>0);
 await unlink(join(f.data,id,'agent-budget.json'));await assert.rejects(()=>host.send('缺账本不能继续'),/RS_USAGE_UNAVAILABLE/);assert.equal(calls,1);await f.hosts.reset();await assert.rejects(()=>f.hosts.get(id),/RS_USAGE_UNAVAILABLE/);assert.equal(calls,1);
 for(const [path,bytes]of snapshots)assert.deepEqual(await readFile(path),bytes);
});

test('RS-POLICY-01 a failed ledger settlement write cannot turn cached known usage into a durable known receipt',async t=>{
 let f,calls=0;f=await fixture(t,async()=>{if(calls++===0)await mkdir(join(f.data,id,'agent-budget.json.tmp'));return reply;});await authorize(f);const host=await f.hosts.get(id);await host.send('合成账本写入故障');await finish(host);
 const op=f.policy.projectOperations(id).at(-1);assert.equal(op.state,'unknown','durable unresolved reservation must override cached zero reservation');assert.equal(op.physical_settled,true);assert.equal(op.usage_known,false);
 const {FileBudgetStore}=await load('dist/agent/budget-store.js');assert.equal(new FileBudgetStore(join(f.data,id,'agent-budget.json')).usageOf(host.taskId).reservedOutputTokens,32768);
 await rm(join(f.data,id,'agent-budget.json.tmp'),{recursive:true});await f.hosts.reconcile(id);assert.equal(await f.hosts.get(id),host);await host.send('核对后明确继续');assert.equal((await finish(host)).status,'succeeded');const usage=new FileBudgetStore(join(f.data,id,'agent-budget.json')).usageOf(host.taskId);assert.equal(calls,2);assert.equal(usage.modelCalls,2);assert.equal(usage.reservedOutputTokens,32768);assert.equal(usage.outputTokens,32771);assert.equal(f.policy.operation(op.operation_id).usage_known,false);
});

test('RS-POLICY-01 corrupt native acknowledgement history is rejected without replacing it or issuing a model request',async t=>{
 let calls=0;const f=await fixture(t,async()=>{calls++;return reply;});await authorize(f);const host=await f.hosts.get(id);await host.send('合成原生绑定');await finish(host);
 const file=join(f.data,id,'work','agent-operations.json'),bad='{"version":2,"operations":{}}';await writeFile(file,bad);await host.send('绑定损坏不得重建');const result=await finish(host);assert.equal(result.status,'failed');assert.equal(result.reason,'STATE_FAILED');assert.equal(calls,1);assert.equal(await readFile(file,'utf8'),bad);
});

test('RS-LIFECYCLE-01 owner loss closes new admission, aborts owned work, waits physical settlement and preserves UNKNOWN',async t=>{
 let admit,release,calls=0;const ready=new Promise(r=>{admit=r;}),gate=new Promise(r=>{release=r;}),watchdog=setTimeout(()=>release(),2500);t.after(()=>{release();clearTimeout(watchdog);});
 const f=await fixture(t,async()=>{calls++;admit();await gate;return reply;});assert.equal(typeof f.hosts.ownerLost,'function');await authorize(f);const host=await f.hosts.get(id);await host.send('合成宿主断开');await ready;
 let ended=false;const loss=f.hosts.ownerLost().then(()=>{ended=true;});await new Promise(r=>setTimeout(r,30));assert.equal(ended,false);assert.equal(f.policy.projectOperations(id).at(-1).state,'stopping');await assert.rejects(()=>f.hosts.get(id),/RS_STUDIO_UNAVAILABLE/);release();await loss;
 const op=f.policy.projectOperations(id).at(-1);assert.equal(op.state,'unknown');assert.equal(op.physical_settled,true);assert.equal(op.usage_known,false);assert.equal(calls,1);assert.equal((await f.configuration.status()).state,'ready');
 const restarted=createBuiltinAgentHosts({dataRoot:f.data,skillsDir:join(root,'assets/skills/ppt'),policy:f.policy,configuration:f.configuration,boundary:f.boundary,projectExists:async p=>p===id,makeTransport:()=>async()=>{calls++;return reply;}});
 try{const next=await restarted.get(id);assert.equal(calls,1);assert((await next.history()).length>0);await assert.rejects(()=>next.send('重启不能隐式核对'),/RS_PROJECT_PENDING/);assert.equal(calls,1);await restarted.reconcile(id);assert.equal(calls,1);await next.send('核对后明确新制作');assert.equal((await finish(next)).status,'succeeded');assert.equal(calls,2);assert.equal(f.policy.operation(op.operation_id).usage_known,false);}finally{await restarted.close();}
});

test('RS-LIFECYCLE-01 actual SDK Bash stop waits owned native child settlement before business receipt',async t=>{
 let calls=0;const f=await fixture(t,async()=>++calls===1?{...reply,content:[{kind:'tool',id:'synthetic-bash',name:'bash',arguments:{command:'node child.mjs & wait'}}],stop:'tools'}:reply);await authorize(f);f.policy.grant(id,1,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:true},await f.boundary());
 await writeFile(join(f.data,id,'child.mjs'),"import {writeFileSync} from 'node:fs';process.on('SIGTERM',()=>{});writeFileSync('ready','synthetic');setTimeout(()=>{writeFileSync('late-write','unexpected after stop');process.exit(0);},400);");
 const host=await f.hosts.get(id);await host.send('仅执行合成Bash测试');const {access}=await import('node:fs/promises');for(let i=0;i<100;i++){try{await access(join(f.data,id,'ready'));break;}catch{await new Promise(r=>setTimeout(r,5));}}await access(join(f.data,id,'ready'));await host.control({kind:'abort'});await finish(host);const op=f.policy.projectOperations(id).at(-1);assert.equal(op.physical_settled,true);assert.equal(host.isBusy(),false);await new Promise(r=>setTimeout(r,450));await assert.rejects(()=>readFile(join(f.data,id,'late-write')),{code:'ENOENT'});assert.equal(calls,1);
});


test('RS-EXIT-01 waiting blocks the next run without cutting off the admitted run tool and model continuation',async t=>{
 let allowed=true,calls=0,admit,release;const ready=new Promise(r=>{admit=r;}),gate=new Promise(r=>{release=r;}),watchdog=setTimeout(()=>release(),4000);t.after(()=>{release();clearTimeout(watchdog);});
 const f=await fixture(t,async()=>{calls++;if(calls===1){admit();await gate;return {...reply,content:[{kind:'tool',id:'wait-tool',name:'bash',arguments:{command:'echo synthetic-wait-continuation'}}],stop:'tools'};}return reply;},()=>allowed);
 await authorize(f);f.policy.grant(id,1,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:true},await f.boundary());
 const host=await f.hosts.get(id);await host.send('合成等待退出');await ready;allowed=false;release();assert.equal((await finish(host)).status,'succeeded');assert.equal(calls,2);assert.equal(f.policy.projectOperations(id).at(-1).physical_settled,true);await assert.rejects(()=>host.send('退出等待不能开始新制作'),/RS_STUDIO_UNAVAILABLE/);assert.equal(calls,2);allowed=true;await host.send('取消退出后的明确新制作');assert.equal((await finish(host)).status,'succeeded');assert.equal(calls,3);
});

test('RS-EXIT-01 stop-owned acknowledges stopping but waits for the real receipt; it never clears UNKNOWN',async t=>{
 let calls=0,admit,release;const ready=new Promise(r=>{admit=r;}),gate=new Promise(r=>{release=r;}),watchdog=setTimeout(()=>release(),4000);t.after(()=>{release();clearTimeout(watchdog);});
 const f=await fixture(t,async()=>{calls++;admit();await gate;return reply;});assert.equal(typeof f.hosts.stopOwned,'function');await authorize(f);const host=await f.hosts.get(id);await host.send('合成停止后等待退出');await ready;await f.hosts.stopOwned();assert.equal(f.policy.projectOperations(id).at(-1).state,'stopping');assert.equal(host.isBusy(),true);assert.equal(await f.hosts.isIdle(),false);release();await finish(host);const op=f.policy.projectOperations(id).at(-1);assert.equal(op.state,'unknown');assert.equal(op.physical_settled,true);assert.equal(op.usage_known,false);await f.hosts.stopOwned();assert.equal(f.policy.operation(op.operation_id).state,'unknown');assert.equal(calls,1);await f.hosts.reconcile(id);
});


test('RS-IMAGE-04 new project MiMo-only image is metered; reopen/config selection preserves one plan',async t=>{
 const content=Buffer.from('synthetic image'),material={source_id:'source_image',kind:'image',sha256:createHash('sha256').update(content).digest('hex')},used=[];
 const f=await fixture(t,async request=>{used.push(request.model);assert.deepEqual(request.messages.flatMap(m=>m.images??[]),[{data:content.toString('base64'),mimeType:'image/png'}]);return {...reply,content:[{kind:'text',text:'合成MiMo图像100/120/135'}]};},undefined,[material]);await authorize(f,'xiaomi-token-plan-cn');
 assert.equal(await f.hosts.describeImage(id,material.source_id,content,'image/png'),'合成MiMo图像100/120/135');
 const plan=await readFile(join(f.data,id,'.agent-model-plan.json'),'utf8');assert.equal(JSON.parse(plan).image_plan,'dual-v3');const before=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8'));
 await f.hosts.reset();assert.equal(await f.hosts.describeImage(id,material.source_id,content,'image/png'),'合成MiMo图像100/120/135');const after=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8'));assert.equal(after.tasks['task_'+id].configuration,before.tasks['task_'+id].configuration);assert.equal(after.tasks['task_'+id].usage.modelCalls,2);assert.equal(await readFile(join(f.data,id,'.agent-model-plan.json'),'utf8'),plan);
 assert(used.every(m=>m.provider==='xiaomi-token-plan-cn'&&m.input.includes('image')&&m.maxOutputTokens===2048));await assert.rejects(()=>f.hosts.describeImage(id,'wrong',content,'image/png'),/RS_IMAGE_PERMISSION_REQUIRED/);assert.equal(used.length,2);
});

test('RS-COMPAT-02 legacy task remains byte-identical in config and retains UNKNOWN reservation; MiMo image does not migrate it',async t=>{
 const f=await fixture(t,async()=>reply),{SessionHost}=await load('dist/agent/session-host.js'),{MINIMAX_M3,MIMO_FLASH}=await load('dist/agent/model.js');
 const transport=async()=>reply,primary={model:MINIMAX_M3,transport},fallback={model:MIMO_FLASH,transport},imageModel={...MINIMAX_M3,maxOutputTokens:2048};
 const legacy=await SessionHost.create({projectRoot:join(f.data,id),skillsDir:join(root,'assets/skills/ppt'),...primary,fallbacks:[fallback],builtin:{chain:{primary,fallback,selection:'primary'},image:{model:imageModel,transport:async()=>{throw Error('synthetic lost usage');}},authorize:async()=>true}});
 const result=await legacy.describeImage({data:'aW1hZ2U=',mimeType:'image/png'},new AbortController().signal);assert.equal(result.result.status,'failed');await legacy.waitForIdle();await legacy.close();const before=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8')).tasks['task_'+id];assert.equal(before.usage.reservedOutputTokens,2048);
 await authorize(f);const host=await f.hosts.get(id);await host.send('保留旧配置的合成继续');assert.equal((await finish(host)).status,'succeeded');const after=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8')).tasks['task_'+id];assert.equal(after.configuration,before.configuration);assert.equal(after.usage.reservedOutputTokens,2048);assert.equal(after.usage.modelCalls,before.usage.modelCalls+1);assert.equal(JSON.parse(await readFile(join(f.data,id,'.agent-model-plan.json'),'utf8')).image_plan,'minimax-v1');
 await f.configuration.save('xiaomi-token-plan-cn','synthetic-key',1);await f.configuration.remove('minimax-cn',2);f.policy.grant(id,1,{...await f.boundary(),allow_prompt:true,allow_screenshots:false,allow_network:false},await f.boundary());await assert.rejects(()=>host.describeImage({data:'aW1hZ2U=',mimeType:'image/png'},new AbortController().signal),/RS_IMAGE_PLAN_LEGACY/);assert.equal(JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8')).tasks['task_'+id].usage.reservedOutputTokens,2048);
});

test('RS-COMPAT-02 malformed or linked plan marker fails closed without overwriting or calling provider',async t=>{
 const {symlink}=await import('node:fs/promises');for(const linked of [false,true]){let calls=0;const f=await fixture(t,async()=>{calls++;return reply;});const path=join(f.data,id,'.agent-model-plan.json'),bytes='{"schema_version":"99","image_plan":"dual-v2"}';if(linked){await writeFile(join(f.data,'retained'),bytes);await symlink(join(f.data,'retained'),path);}else await writeFile(path,bytes);await assert.rejects(()=>f.hosts.get(id),/RS_MODEL_PLAN_INVALID/);assert.equal(await readFile(path,'utf8'),bytes);assert.equal(calls,0);}
});

test('RS-IMAGE-05 actual MiMo-only main receives authorized look_page image after reopen without changing its ledger',async t=>{
 let calls=0;const f=await fixture(t,async request=>{calls++;assert.equal(request.model.provider,'xiaomi-token-plan-cn');if(calls%2===1)return {...reply,content:[{kind:'tool',id:'synthetic-look-'+calls,name:'look_page',arguments:{page:'page_01'}}],stop:'tools'};const images=request.messages.flatMap(m=>m.images??[]);assert.equal(images.length,calls/2);assert(images.every(image=>image.mimeType==='image/jpeg'));assert(Buffer.from(images[0].data,'base64').length>0);assert(request.model.input.includes('image'));return reply;});
 await mkdir(join(f.data,id,'deck','pages'),{recursive:true});await writeFile(join(f.data,id,'deck','pages','page_01.mjs'),'// synthetic, not executed');await writeFile(join(f.data,id,'deck','pages','page_01.html'),'<html><body>合成页面100/120/135</body></html>');
 await authorize(f,'xiaomi-token-plan-cn');f.policy.grant(id,1,{...await f.boundary(),allow_prompt:true,allow_screenshots:true,allow_network:false},await f.boundary());
 let configuration;for(let index=0;index<2;index++){const host=await f.hosts.get(id);await host.send('只检查合成页面');const result=await finish(host);assert.equal(result.status,'succeeded',JSON.stringify(result));const ledger=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8')).tasks['task_'+id];configuration??=ledger.configuration;assert.equal(ledger.configuration,configuration);assert.equal(ledger.usage.reservedOutputTokens,0);await f.hosts.reset();}assert.equal(calls,4);
});


test('RS-COMPAT-02 already-used dual-v2 remains fixed text-main/image-MiMo and is not silently upgraded',async t=>{
 const f=await fixture(t,async request=>{assert.deepEqual(request.model.input,['text']);return reply;}),{SessionHost}=await load('dist/agent/session-host.js'),{MINIMAX_M3,MIMO_FLASH}=await load('dist/agent/model.js'),transport=async()=>reply;
 const primary={model:MINIMAX_M3,transport},fallback={model:MIMO_FLASH,transport},image={model:{...MINIMAX_M3,maxOutputTokens:2048},transport},imageFallback={model:{...MIMO_FLASH,input:['text','image'],maxOutputTokens:2048},transport};
 const prior=await SessionHost.create({projectRoot:join(f.data,id),skillsDir:join(root,'assets/skills/ppt'),...primary,fallbacks:[fallback],builtin:{chain:{primary,fallback,selection:'primary'},image,imageFallback,authorize:async()=>true}});assert.equal((await prior.describeImage({data:'aW1hZ2U=',mimeType:'image/png'},new AbortController().signal)).result.status,'succeeded');await prior.waitForIdle();await prior.close();
 const before=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8')).tasks['task_'+id];await writeFile(join(f.data,id,'.agent-model-plan.json'),JSON.stringify({schema_version:'1',image_plan:'dual-v2'}));await authorize(f,'xiaomi-token-plan-cn');const host=await f.hosts.get(id);await host.send('旧v2的合成文字');assert.equal((await finish(host)).status,'succeeded');const after=JSON.parse(await readFile(join(f.data,id,'agent-budget.json'),'utf8')).tasks['task_'+id];assert.equal(after.configuration,before.configuration);assert.equal(after.usage.modelCalls,before.usage.modelCalls+1);assert.equal(JSON.parse(await readFile(join(f.data,id,'.agent-model-plan.json'),'utf8')).image_plan,'dual-v2');
});
