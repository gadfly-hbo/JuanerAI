import {withReportEdit} from '../../fixtures/xanthil-desktop/report-edit-runtime.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createWorkspaceClient} from '../../../apps/browser/client.mjs';
type ReportProfileFactory=typeof import('../../../profiles/personal/open-analysis.ts').createPersonalOpenAnalysisWorkspace;
const profileWithReportEdit=(factory:ReportProfileFactory,config:Parameters<ReportProfileFactory>[0])=>factory({...config,runtime:config.runtime?withReportEdit(config.runtime):undefined,createRuntime:config.createRuntime?(ledger,context)=>withReportEdit(config.createRuntime!(ledger,context)):undefined});

test('BF-R07/08 E01-d: uncertain mutation survives refresh without persisting control or resending',async()=>{
 const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};let writes=0,settled=false;
 const request=async(_path:string,options?:RequestInit)=>{if(options?.method==='POST'){writes++;throw new Error('connection lost after dispatch');}return new Response(JSON.stringify(settled?{kind:'task_created',task_id:'saved-task'}:null),{status:200});};
 const client=createWorkspaceClient({request,storage,control:'private-memory-controller'});await assert.rejects(()=>client.create('问题'));assert.equal(writes,1);assert.ok(client.pending());assert.equal([...values.values()].join().includes('private-memory-controller'),false);
 const refreshed=createWorkspaceClient({request,storage});assert.equal(refreshed.canWrite(),false);assert.ok(refreshed.pending());assert.equal((await refreshed.recover()).status,'unknown');assert.ok(refreshed.pending());await assert.rejects(()=>refreshed.create('不得重发'));assert.equal(writes,1);
 settled=true;assert.equal((await refreshed.recover()).status,'recorded');assert.equal(refreshed.pending(),null);assert.equal(writes,1);
});

import {bootstrapWorkspace} from '../../../apps/browser/bootstrap.mjs';
test('BF-R01 E01-d: fragment is cleared before exchange; invalid and rejected links load no workspace',async()=>{
 const events:string[]=[],token='a'.repeat(64);let loaded=0;
 const common={history:{replaceState(_data:unknown,_unused:string,url?:string|URL|null){events.push('clear:'+url);}},status(_text:string){},load:async()=>({async startWorkspace(input:{control:string|null}){loaded++;assert.equal(input.control,'memory-only');}})};
 assert.equal(await bootstrapWorkspace({...common,location:{hash:'#'+token,pathname:'/'},request:async(path,options)=>{assert.deepEqual(events,['clear:/']);assert.equal(path,'/v1/bootstrap');assert.equal(path.includes(token),false);assert.deepEqual(JSON.parse(String(options!.body)),{token});return new Response(JSON.stringify({control:'memory-only'}),{status:200});}}),true);assert.equal(loaded,1);
 for(const hash of ['#invalid','#'+token,'']){events.length=0;loaded=0;assert.equal(await bootstrapWorkspace({...common,location:{hash,pathname:'/'},request:async()=>new Response('{}',{status:401})}),false);assert.equal(loaded,0);assert.deepEqual(events,['clear:/']);}
});


test('BF-R01/07 E01-e: takeover is explicit and uncertain response never restores or persists control',async()=>{
 let posts=0,lost=true;const values=new Map<string,string>();const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
 const client=createWorkspaceClient({storage,request:async(path,options)=>{if(options?.method==='POST'){posts++;assert.equal(path,'/v1/control');assert.deepEqual(Object.keys(JSON.parse(String(options.body))).sort(),['command_id','confirmed','generation','version']);if(lost)throw new Error('response lost');return new Response(JSON.stringify({control:'fresh-secret',generation:2}));}assert.equal(path,'/v1/session');return new Response(JSON.stringify({authenticated:true,generation:1}));}});
 assert.equal(client.canWrite(),false);assert.equal(posts,0);await assert.rejects(()=>client.takeControl());assert.equal(client.canWrite(),false);assert.equal(posts,1);assert.equal(client.pending(),null);assert.equal((await client.session()).generation,1);assert.equal(posts,1,'GET never resends takeover');
 lost=false;await client.takeControl();assert.equal(client.canWrite(),true);assert.equal(posts,2);assert.equal([...values.values()].join().includes('fresh-secret'),false);assert.equal(createWorkspaceClient({storage}).canWrite(),false);
});


test('BF-R08/10 E06-b: uncertain human confirmation is recovered by its existing intent without another POST',async()=>{
 let writes=0;const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)},intent=crypto.randomUUID(),task=crypto.randomUUID();
 const request=async(path:string,options?:RequestInit)=>{if(options?.method==='POST'){writes++;assert.equal(path,'/v1/tasks/'+task+'/review/submit');assert.equal(JSON.parse(String(options.body)).command_id,intent);throw new Error('lost formal response');}assert.equal(path,'/v1/commands/'+intent);return new Response(JSON.stringify({kind:'review_submitted',command_id:intent,task_id:task}));};
 const client=createWorkspaceClient({request,storage,control:'memory'});await assert.rejects(()=>client.review({task_id:task,epoch:0},'submit',{command_id:intent,review_id:crypto.randomUUID(),review_version:2,review_sha256:'a'.repeat(64),outcome:'analysis',confirmed:true}));assert.equal(writes,1);assert.equal(client.pending()?.kind,'review_submit');
 const refresh=createWorkspaceClient({request,storage});assert.equal((await refresh.recover()).status,'recorded');assert.equal(writes,1);assert.equal(refresh.canWrite(),false);
});

test('BF-R03/08 E05-e: material authorization is bound to visible policy and unknown outcome is read back',async()=>{
 let body:Record<string,unknown>|null=null,writes=0;const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
 const client=createWorkspaceClient({control:'memory',storage,request:async(_path,options)=>{if(options?.method==='POST'){writes++;body=JSON.parse(String(options.body));throw new Error('lost');}return new Response('null');}});
 await assert.rejects(()=>client.authorizeModel({task_id:crypto.randomUUID(),epoch:3,row_version:4},crypto.randomUUID(),'a'.repeat(64),false));assert.equal(writes,1);assert.ok(body);assert.equal(Reflect.get(body,'policy_sha256'),'a'.repeat(64));assert.equal(Reflect.get(body,'disclose_question'),false);assert.equal(Reflect.get(body,'confirmed'),true);assert.equal(Reflect.has(body,'policy'),false);assert.equal(client.pending()?.kind,'model_authorization');assert.equal((await client.recover()).status,'unknown');assert.equal(writes,1);
});


test('BF-R01/03 E05-h: browser first text consent has no implicit structure scope',async()=>{
 let calls=0;const client=createWorkspaceClient({control:'memory',request:async(_path,options)=>{calls++;const body=JSON.parse(String(options?.body));assert.equal(body.source_set_id,null);assert.equal(body.disclose_question,true);assert.equal(body.disclose_structure,false);return new Response(JSON.stringify({kind:'model_authorized'}));}});
 await client.authorizeModel({task_id:crypto.randomUUID(),epoch:0,row_version:1},null,'a'.repeat(64),true);assert.equal(calls,1);
});


test('BF-R06 E05-m: browser submits verified aggregate consent only as explicitly selected',async()=>{
 const bodies:Record<string,unknown>[]=[];const client=createWorkspaceClient({storage:null,control:'memory',request:async(_path,options)=>{bodies.push(JSON.parse(String(options?.body)));return new Response('{}');}}),authorize=Reflect.get(client,'authorizeModel');
 const task={task_id:crypto.randomUUID(),row_version:1,epoch:0};await authorize(task,crypto.randomUUID(),'a'.repeat(64),true,true);await authorize(task,crypto.randomUUID(),'a'.repeat(64),true);
 assert.equal(bodies[0].disclose_verified_result,true);assert.notEqual(bodies[1].disclose_verified_result,true);
});

test('BF-R01/06 E05-q: selected clarification uses one explicit command and uncertain response is read back',async()=>{
 let writes=0;const values=new Map<string,string>(),storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)};
 const client=createWorkspaceClient({control:'memory',storage,request:async(path:string,options?:RequestInit)=>{if(options?.method==='POST'){writes++;assert.equal(path,'/v1/tasks/task/clarification');assert.equal(JSON.parse(String(options.body)).reply,'paid表示已支付');throw new Error('response lost');}return new Response(JSON.stringify({kind:'clarification_saved',task_id:'task'}));}}),answer=Reflect.get(client,'answer');assert.equal(typeof answer,'function');await assert.rejects(()=>answer({task_id:'task',row_version:3,epoch:0},'question-execution','policy','paid表示已支付'));assert.equal(writes,1);assert.equal(client.pending()?.kind,'clarification');const refreshed=createWorkspaceClient({storage,request:async()=>new Response(JSON.stringify({kind:'clarification_saved',task_id:'task'}))});assert.equal((await refreshed.recover()).status,'recorded');assert.equal(writes,1);assert.equal(refreshed.canWrite(),false);
});

test('BF-R10 E08-a: report copy failure preserves readable state and never claims a saved file',async()=>{
 let fail=true;const client=createWorkspaceClient({request:async(path,options)=>{assert.equal(path,'/v1/tasks/task/reports/report/copy');assert.notEqual(options?.method,'POST');return fail?new Response('{}',{status:503}):new Response('<html>saved report</html>',{headers:{'content-type':'text/html;charset=utf-8'}});}}),copy=Reflect.get(client,'copy');assert.equal(typeof copy,'function');await assert.rejects(()=>copy('task','report'));assert.equal(client.pending(),null);fail=false;const value=await copy('task','report');assert.equal(await value.text(),'<html>saved report</html>');assert.equal(client.pending(),null);assert.equal(client.canWrite(),false);
});

test('BF-R08 E06: definite rejection requires same-command readback before Stop, without resend',async()=>{
 const writes:string[]=[],reads:string[]=[],task_id=crypto.randomUUID();let command='';
 const client=createWorkspaceClient({control:'memory',request:async(path:string,options?:RequestInit)=>{if(options?.method==='POST'){writes.push(path);if(path.endsWith('/model-authorization')){command=JSON.parse(String(options.body)).command_id;return new Response(JSON.stringify({error:'REQUEST_REJECTED'}),{status:400});}assert.equal(path,`/v1/tasks/${task_id}/stop`);return new Response(JSON.stringify({status:'stopped'}));}reads.push(path);assert.equal(path,'/v1/commands/'+command);return new Response('null');}});
 await assert.rejects(()=>client.authorizeModel({task_id,epoch:1,row_version:2},null,'a'.repeat(64),true));assert.equal(client.pending()?.definite,true);assert.equal(client.hasControl(),true);assert.equal(client.canWrite(),false);await assert.rejects(()=>client.stop(task_id));assert.equal(writes.length,1);assert.deepEqual(await client.recover(),{status:'rejected'});assert.equal(client.canWrite(),true);await client.stop(task_id);assert.deepEqual(writes,[`/v1/tasks/${task_id}/model-authorization`,`/v1/tasks/${task_id}/stop`]);assert.deepEqual(reads,['/v1/commands/'+command]);
});

test('BF-R11: a browser-reused page consumes a newly opened fragment after a readable bare-URL rejection',async()=>{
 const module=await import('../../../apps/browser/bootstrap.mjs'),watch=Reflect.get(module,'watchWorkspaceBootstrap');assert.equal(typeof watch,'function');
 const location={hash:'',pathname:'/'},token='b'.repeat(64),requests:string[]=[],messages:string[]=[],loaded:unknown[]=[];let changed:()=>void=()=>{};
 await watch({location,history:{replaceState(){location.hash='';}},request:async(path:string,options?:RequestInit)=>{requests.push(path);if(path==='/v1/session')return new Response('{}',{status:401});assert.equal(location.hash,'','fragment clears before exchange');assert.deepEqual(JSON.parse(String(options?.body)),{token});return new Response(JSON.stringify({control:null,service:true}));},load:async()=>({async startWorkspace(value:unknown){loaded.push(value);}}),status:(value:string)=>messages.push(value)},(callback:()=>void)=>{changed=callback;});
 assert.equal(loaded.length,0);assert.match(messages.at(-1)!,/暂时无法连接本机服务/);location.hash='#'+token;changed();await new Promise(setImmediate);await new Promise(setImmediate);
 assert.deepEqual(requests,['/v1/session','/v1/bootstrap']);assert.deepEqual(loaded,[{control:null,service:true}]);assert.equal(location.hash,'');changed();await new Promise(setImmediate);assert.equal(requests.length,2);
});

test('Q11-07: selected document format and bytes reach open task unchanged rather than being blocked as a table-only trial',async()=>{
 const {browserSourceFiles}=await import('../../../apps/browser/client.mjs');const file=new File(['# 合成业务说明'],'说明.md',{type:'text/markdown'}),selected=await browserSourceFiles([file]);assert.equal(selected[0].format,'md');assert.equal(Buffer.from(selected[0].base64,'base64').toString(),'# 合成业务说明');
});

// Host browser evidence uses an explicitly selected existing executable. Offline
// CI skips this host-specific case; it never downloads a browser or calls a model.
test('OA-RT04/Q11-01: actual first browser submit dispatches once, can Stop during source read, and saves a later explicit task', {skip:!process.env.JUANERAI_BROWSER_ACCEPTANCE_EXECUTABLE,timeout:45000},async()=>{
 const {mkdtempSync,writeFileSync}=await import('node:fs'),{join}=await import('node:path'),{browserEvidenceRoot}=await import('../../fixtures/xanthil-desktop/browser-evidence.ts');
 const {createPersonalOpenAnalysisWorkspace}=await import('../../../profiles/personal/open-analysis.ts'),{startBrowserMembershipServer}=await import('../../../apps/browser/local-server.ts'),{createMemberSourceInspector}=await import('../../../adapters/analytics-duckdb/member-source-inspection.ts');
 const library=join(process.cwd(),'node_modules','playwright-core','index.mjs'),{chromium}=await import(library);
 const root=mkdtempSync(join(browserEvidenceRoot,'first-browser-')),file=join(root,'synthetic.csv');writeFileSync(file,'数量\n7\n3\n');let ready!:()=>void,release!:()=>void,signal:AbortSignal|undefined,inspections=0,runs=0,configs=0;
 const entered=new Promise<void>(r=>ready=r),wait=new Promise<void>(r=>release=r),inspect=createMemberSourceInspector(process.env.JUANERAI_TOOLCHAIN_BIN+'/python3');
 const open=profileWithReportEdit(createPersonalOpenAnalysisWorkspace,{projectRoot:root,inspect:async i=>{inspections++;if(inspections===1){signal=i.cancellation_signal;ready();await wait;}return inspect(i);},authorizeConfiguration:async()=>{configs++;return {config_sha256:'b'.repeat(64)};},runtime:{run:async i=>{runs++;const data=await i.tools.find(t=>t.name==='inspect_selected')!.execute({},i.signal) as import('../../../packages/ports/member-source.ts').MemberSourceInspection;await i.tools.find(t=>t.name==='set_framework')!.execute({goal:'核实数量',source_id:data.sources[0]!.source_id,sheet_id:data.sources[0]!.sheets[0]!.sheet_id,column:'数量',operation:'sum',unit:'件',group_mode:'none'},i.signal);await i.tools.find(t=>t.name==='calculate_and_verify')!.execute({},i.signal);return {text:'合计10件，原因尚未验证。',tools:[]};}}});
 let server:Awaited<ReturnType<typeof startBrowserMembershipServer>>|undefined,browser:any;
 try{server=await startBrowserMembershipServer({store:{} as any,workspace:{} as any,open});browser=await chromium.launch({executablePath:process.env.JUANERAI_BROWSER_ACCEPTANCE_EXECUTABLE,headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors:string[]=[];page.on('pageerror',(e:Error)=>errors.push(e.message));await page.goto(server.origin+'/#'+server.bootstrap);await page.getByRole('textbox',{name:'分析需求或追问'}).waitFor();const chooser=page.waitForEvent('filechooser');void chooser.catch(()=>{});await page.getByRole('button',{name:'＋ 资料',exact:true}).click();await (await chooser).setFiles(file);await page.getByText('已选定 synthetic.csv',{exact:true}).waitFor();await page.getByRole('textbox',{name:'分析需求或追问'}).fill('核对合成数量');await page.getByRole('button',{name:'发送',exact:true}).click();await page.getByRole('button',{name:'同意并开始分析',exact:true}).click();await Promise.race([entered,new Promise((_,reject)=>setTimeout(()=>reject(Error('inspector not reached')),5000))]);
 const pending=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('juanerai.open.pending.v1')!));assert.equal(open.submission(pending.task_id)!.state,'reading');assert.equal(await page.getByRole('button',{name:'停止',exact:true}).isEnabled(),true);await page.getByRole('button',{name:'停止',exact:true}).click();await page.getByText('已请求停止资料读取，请查看保存结果确认。',{exact:false}).waitFor();assert.equal(signal?.aborted,true);assert.equal(open.submission(pending.task_id)!.state,'unknown');release();await page.waitForFunction(()=>sessionStorage.getItem('juanerai.open.pending.v1')===null);assert.equal(open.submission(pending.task_id)!.state,'stopped');assert.equal(configs,0);assert.equal(runs,0);
 // A later user submission is explicit, not an automatic retry of the stopped command.
 await page.getByRole('textbox',{name:'分析需求或追问'}).fill('重新核对合成数量');await page.getByRole('button',{name:'发送',exact:true}).click();await page.getByRole('button',{name:'同意并开始分析',exact:true}).click();await page.getByRole('button',{name:'展开报告',exact:true}).waitFor();await open.collect();const saved=open.list()[0]!;assert.equal(saved.state,'saved');assert.equal(saved.outcome!.calculation.value,'10');assert.notEqual(saved.identity.task_id,pending.task_id);assert.equal(runs,1);assert.equal(configs,1);assert.equal(inspections,2);assert.deepEqual(errors,[]);await page.screenshot({path:join(root,'actual-first-submit.png'),fullPage:true});
 }finally{release();await browser?.close();await server?.close();await open.close();}
});
