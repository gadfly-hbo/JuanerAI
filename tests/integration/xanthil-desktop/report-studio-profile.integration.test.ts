import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,mkdir,writeFile,readFile,copyFile,chmod,rm,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createPersonalReportStudioRuntime,createPersonalReportStudioOwner,createPersonalReportStudioWorkspace,readPersonalReportStudioDeployment} from '../../../profiles/personal/report-studio.ts';
import type {ReportStudioOwnerRequest} from '../../../packages/contracts/report-studio.ts';
import type {OpenStoredTask} from '../../../packages/ports/open-analysis-store.ts';
const digest=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex');
test('RS-PROFILE-01 verifies fixed complete resources before owned lazy launch; corrupted input never starts',async t=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'studio-profile-')));t.after(()=>rm(root,{recursive:true,force:true}));
 const bundle=join(root,'bundle'),data=join(root,'data');
 for(const dir of ['studio/dist/juanerai','studio/web-dist','studio/assets','studio/node_modules','bin','browser','licenses'])await mkdir(join(bundle,dir),{recursive:true});
 const source='a'.repeat(40),entry=`import {createServer} from 'node:http';process.once('message',c=>{const s=createServer((req,res)=>{res.setHeader('content-type','application/json');if(req.url==='/api/builtin/bridge/close-intent'){res.end(JSON.stringify({state:'ready'}));return;}res.end(JSON.stringify({protocol_version:'1',plugin_version:'fixed',source_commit:'${source}',execution:'not_configured'}));});s.listen(0,'127.0.0.1',()=>process.send({type:'ready',origin:'http://127.0.0.1:'+s.address().port,protocol_version:'1',plugin_version:'fixed',source_commit:'${source}'}));process.on('SIGTERM',()=>s.close(()=>process.exit(0)));});`;
 const inputs=[['studio/dist/juanerai/entry.js',entry,'server'],['studio/package.json','{"type":"module"}','resource'],['studio/web-dist/index.html','synthetic','web'],['studio/assets/SKILL.md','synthetic','skills'],['studio/node_modules/fixture','synthetic','dependencies'],['browser/fixture','synthetic','browser'],['licenses/fixture','synthetic','licenses']] as const;
 const files=[];
 for(const [path,bytes,role]of inputs){await writeFile(join(bundle,path),bytes);files.push({path,bytes:Buffer.byteLength(bytes),sha256:digest(bytes),role});}
 await copyFile(process.execPath,join(bundle,'bin/node'),constants.COPYFILE_FICLONE);await chmod(join(bundle,'bin/node'),0o755);const node=await readFile(join(bundle,'bin/node'));files.push({path:'bin/node',bytes:node.length,sha256:digest(node),role:'node'});
 const manifest=JSON.stringify({schema_version:'1',module:'reports-factory',version:'fixed',source_commit:source,protocol_version:'1',files});await writeFile(join(bundle,'manifest.json'),manifest);
 const runtime=createPersonalReportStudioRuntime({bundleRoot:bundle,identity:{version:'fixed',source_commit:source,protocol_version:'1',manifest_sha256:digest(manifest)},dataRoot:data});t.after(()=>runtime.close());
 assert.equal(await runtime.observeProject('proj_synthetic'),undefined,'report viewing must not wake Studio');
 assert.equal((await runtime.status()).state,'ready');await assert.rejects(()=>stat(data),{code:'ENOENT'});
 const [a,b]=await Promise.all([runtime.start(),runtime.start()]);assert.equal(a,b);await runtime.close();await assert.rejects(()=>fetch(a.origin));
 await writeFile(join(bundle,'studio/assets/SKILL.md'),'corrupt');assert.equal((await runtime.status()).state,'unavailable');await assert.rejects(()=>runtime.start());
});


test('RS-DEPLOYMENT-01 fixed relative descriptor composes without starting and rejects absolute/unknown identity',async t=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'studio-deployment-')));t.after(()=>rm(root,{recursive:true,force:true}));const config={resourcesRoot:root,userData:join(root,'user-data')};
 assert.deepEqual(await readPersonalReportStudioDeployment(config),{state:'not_bundled'});
 const descriptor={schema_version:'1',module:'reports-factory',bundle_relative_path:'report-studio',version:'0.1.0-juanerai.1',source_commit:'74ebb609fd73cf263614ffc9301dafaafcec4230',protocol_version:'1',manifest_sha256:'a'.repeat(64)};
 await writeFile(join(root,'report-studio-deployment.json'),JSON.stringify(descriptor));const loaded=await readPersonalReportStudioDeployment(config);assert.equal(loaded.state,'configured');await assert.rejects(()=>stat(config.userData),{code:'ENOENT'});
 if(loaded.state==='configured'){assert.equal((await loaded.runtime.status()).state,'unavailable');await assert.rejects(()=>loaded.runtime.start());}
 for(const bad of [{...descriptor,bundle_relative_path:'/developer/repo'},{...descriptor,bundle_relative_path:'../independent'},{...descriptor,source_commit:'b'.repeat(40)},{...descriptor,unknown:true}]){await writeFile(join(root,'report-studio-deployment.json'),JSON.stringify(bad));assert.deepEqual(await readPersonalReportStudioDeployment(config),{state:'invalid'});}
});

test('RS-PROFILE-01 normal browser manager keeps Report Studio scoped to the selected registered project',async t=>{
 const {createPersonalBrowserServiceWorkspace}=await import('../../../profiles/personal/browser-membership.ts');
 const {createLocalModelAccess}=await import('../../../packages/application/provider-settings.ts');
 const {approvedMembershipPolicy}=await import('../../../packages/product-core/member-model-policy.ts');
 const {randomUUID}=await import('node:crypto');
 const root=await realpath(await mkdtemp(join(tmpdir(),'studio-manager-')));
 const originDirectory=join(root,'origins'),projectsRoot=join(root,'projects');await mkdir(originDirectory);await mkdir(projectsRoot);
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN;assert(bin,'explicit canonical toolchain required for normal project composition');
 const runtime=createPersonalReportStudioRuntime({bundleRoot:join(root,'missing'),dataRoot:join(root,'studio'),identity:{version:'fixed',source_commit:'a'.repeat(40),protocol_version:'1',manifest_sha256:'b'.repeat(64)}});
 const manager=await createPersonalBrowserServiceWorkspace({originDirectory,projectsRoot,toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('no model');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}},openModel:{createRuntime:()=>({async run(){assert.fail('no model');}}),authorizeConfiguration:async()=>({config_sha256:'c'.repeat(64)})},reportStudio:runtime} as Parameters<typeof createPersonalBrowserServiceWorkspace>[0]);
 t.after(async()=>{await manager.close();await rm(root,{recursive:true,force:true});});const resolve=Reflect.get(manager,'reportStudioProject');assert.equal(typeof resolve,'function');
 const firstCommand=randomUUID(),one=await manager.select({version:'1.0',command_id:firstCommand,name:'合成项目一'});assert.equal(resolve(one.project_id).projectId,one.project_id);
 const old=resolve(one.project_id);const two=await manager.select({version:'1.0',command_id:randomUUID(),name:'合成项目二'});assert.notEqual(two.project_id,one.project_id);assert.throws(()=>resolve(one.project_id));assert.notEqual(resolve(two.project_id),old);
 const original=Reflect.get(manager,'reportStudioOriginal');assert.equal(typeof original,'function');const background=original(one.project_id);assert.equal(background.projectId,one.project_id);assert.equal(background.currentRevision(randomUUID()),null);assert.equal((await manager.projects()).current,two.project_id,'owner readback never changes selected host project');assert.throws(()=>resolve(one.project_id));
 await rm(join(projectsRoot,firstCommand),{recursive:true});assert.throws(()=>background.currentRevision(randomUUID()),{code:'RS_TARGET_UNAVAILABLE'});assert.throws(()=>original(one.project_id),{code:'RS_TARGET_UNAVAILABLE'});assert.equal((await manager.projects()).current,two.project_id);
});

test('RS-LIFECYCLE-01 host shutdown refuses before touching host resources and remains retryable',async()=>{
 const module=await import('../../../apps/browser/service-main.ts'),create=Reflect.get(module,'createReportStudioAwareShutdown');assert.equal(typeof create,'function');const events:string[]=[];let pending=true;
 const close=create({studio:async()=>{events.push('studio');if(pending)throw Object.assign(Error('RS_PROJECT_PENDING'),{code:'RS_PROJECT_PENDING'});},server:async()=>{events.push('server');},workspace:async()=>{events.push('workspace');},release:()=>{events.push('release');}});
 await assert.rejects(()=>close(),{code:'RS_PROJECT_PENDING'});assert.deepEqual(events,['studio']);pending=false;const one=close(),two=close();assert.equal(one,two);await one;assert.deepEqual(events,['studio','studio','server','workspace','release']);
});

test('RS-OWNER-01 source stays exact across updates; pending delivery is read as pending and a lost reply recovers the same stable copy',async t=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'studio-owner-profile-')));t.after(()=>rm(root,{recursive:true,force:true}));const id=(n:number)=>`${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`;
 const original={version:'1.4',identity:{task_id:id(2),revision:'1',scope_sha256:'a'.repeat(64)},question:'仅合成原分析',state:'saved',outcome:null,conversation_outcome:{outcome_id:id(3),text:'仅合成保存回复'},history:[]} as unknown as OpenStoredTask;let current:OpenStoredTask|null=original,artifactReads=0,release!:()=>void,admit!:()=>void;const gate=new Promise<void>(r=>{release=r;}),ready=new Promise<void>(r=>{admit=r;}),content=Buffer.from('only synthetic delivered HTML');
 const runtime={status:async()=>({state:'ready'}),launch:async()=>'',start:async()=>({gateway:{ensureProject:async(a:{studio_project_id:string;association_id:string;snapshot:{snapshot_sha256:string}})=>({project_id:a.studio_project_id,association_id:a.association_id,snapshot_sha256:a.snapshot.snapshot_sha256}),project:async()=>({project_id:association.studio_project_id,association_id:association.association_id,snapshot_sha256:association.snapshot.snapshot_sha256}),savedExport:async(project_id:string,export_id:string)=>{artifactReads++;admit();await gate;return {project_id,export_id,format:'html',created_at:'2026-10-16T00:00:00Z',artifact_sha256:digest(content),content,warnings:['合成质检提示']};}}})} as unknown as ReturnType<typeof createPersonalReportStudioRuntime>;
 const workspace=createPersonalReportStudioWorkspace({projectRoot:root,projectId:id(1),readTask:()=>current,runtime}),association=await workspace.open(id(2),'1',['conclusion']).then(result=>result.association),owner=createPersonalReportStudioOwner({origin:()=> 'http://127.0.0.1:12345',project:pid=>{assert.equal(pid,id(1));return workspace;}});
 const request:ReportStudioOwnerRequest={type:'owner_request',version:'1',request_id:id(10),operation:'context',identity:{project_id:association.studio_project_id,association_id:association.association_id,snapshot_sha256:association.snapshot.snapshot_sha256},source:association.snapshot.source,export_id:null};
 const context=await owner(request);assert.equal(context.operation,'context');if(context.operation==='context'){assert.equal(context.state,'available');assert.match(context.return_url!,/report-studio-revision=1$/);}
 current={...original,identity:{...original.identity,revision:'2'},conversation_outcome:{...original.conversation_outcome!,outcome_id:id(4)},history:[original]} as unknown as OpenStoredTask;
 const updated=await owner({...request,request_id:id(11)});assert.equal(updated.operation,'context');if(updated.operation==='context'){assert.equal(updated.state,'updated');assert.equal(updated.current_revision,'2');assert.match(updated.return_url!,/report-studio-revision=1$/);}
 const deliver={...request,request_id:id(12),operation:'deliver' as const,export_id:'exp_synthetic'},pending=owner(deliver);await ready;const receipt={...deliver,request_id:id(13),operation:'receipt' as const};assert.deepEqual(await owner(receipt),{operation:'receipt',state:'pending',delivery:null});const duplicate=owner({...deliver,request_id:id(14)});assert.equal(artifactReads,1);release();const saved=await pending;assert.deepEqual(await duplicate,saved);assert.equal(artifactReads,1);
 current=null;const recovered=await owner(receipt);assert.equal(recovered.operation,'receipt');if(recovered.operation==='receipt'&&saved.operation==='deliver')assert.deepEqual(recovered.delivery,saved.delivery);assert.deepEqual(await owner(request),{operation:'context',state:'unavailable',current_revision:null,return_url:null});
 await assert.rejects(()=>owner({...request,identity:{...request.identity,project_id:'proj_other'}}),{code:'RS_TARGET_CHANGED'});
});

test('RS-EXIT-01 native quit adapter keeps host resources until explicit choice and observed settlement',async()=>{
 const module=await import('../../../apps/browser/service-main.ts'),exit=Reflect.get(module,'runReportStudioExit');assert.equal(typeof exit,'function');
 const events:string[]=[],pending={intent:'none',pending:true,request_count:0,configuration_unknown:false,operations:[]};let ready=false,choice:'wait'|'stop'|'cancel'='cancel',progress:'ready'|'cancel'='cancel';
 const parts:Parameters<typeof module.runReportStudioExit>[0]={lifecycle:async()=>({...pending,intent:'none',pending:!ready}),exitIntent:async(intent:string)=>{events.push(intent);return {...pending,intent};},close:async()=>{events.push('close');},choose:async()=>choice,observe:async(read:()=>Promise<unknown>)=>{events.push('observe');if(progress==='ready'){ready=true;await read();}return progress;}};
 assert.equal(await exit(parts),false);assert.deepEqual(events,['cancel']);events.length=0;choice='wait';assert.equal(await exit(parts),false);assert.deepEqual(events,['wait','observe','cancel']);events.length=0;choice='stop';progress='ready';assert.equal(await exit(parts),true);assert.deepEqual(events,['stop','observe','close']);
 events.length=0;assert.equal(await exit(parts),true);assert.deepEqual(events,['close']);
 ready=false;choice='wait';parts.observe=async()=>{throw Error('synthetic unreadable state');};events.length=0;await assert.rejects(()=>exit(parts),/synthetic unreadable state/);assert.deepEqual(events,['wait','cancel']);
});
