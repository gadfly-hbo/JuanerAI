import {createPersonalBrowserMembershipProfile} from '../../../profiles/personal/browser-membership.ts';
import assert from 'node:assert/strict';import test from 'node:test';import {mkdtempSync,mkdirSync,cpSync,renameSync,readFileSync,readdirSync,lstatSync} from 'node:fs';import {join} from 'node:path';import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';
import {DatabaseSync} from 'node:sqlite';
import {reopenBrowserProject} from '../../../adapters/storage-local/browser-project-origin.ts';
import {createLocalModelAccess} from '../../../packages/application/provider-settings.ts';import {approvedMembershipPolicy} from '../../../packages/product-core/member-model-policy.ts';
test('BF-R01/08 E06-d: fresh browser profile exposes actual workspace and owns explicit service exit',async()=>{
 const root=join(mkdtempSync(join(browserEvidenceRoot,'companion-')),'project'),bin=process.env.JUANERAI_TOOLCHAIN_BIN!,profile=await createPersonalBrowserMembershipProfile({projectRoot:root,display_name:'Synthetic companion',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('no model');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}});
 try{const boot=await fetch(profile.origin+'/v1/bootstrap',{method:'POST',headers:{origin:profile.origin,'content-type':'application/json'},body:JSON.stringify({token:profile.bootstrap})});assert.equal(boot.status,200);const cookie=boot.headers.get('set-cookie')!.split(';')[0];const response=await fetch(profile.origin+'/v1/tasks',{headers:{cookie}});assert.equal(response.status,200);assert.deepEqual(await response.json(),{tasks:[]});assert.equal((await fetch(profile.origin+'/workspace.mjs',{headers:{cookie}})).status,200);}finally{await profile.close();}await assert.rejects(()=>fetch(profile.origin+'/v1/tasks'));
});

test('BF-R08 D5 E06-f: explicitly reopens this entry own fresh project without dispatch',async()=>{
 const parent=mkdtempSync(join(browserEvidenceRoot,'companion-reopen-')),projectRoot=join(parent,'project'),originDirectory=join(parent,'origins');mkdirSync(originDirectory);const bin=process.env.JUANERAI_TOOLCHAIN_BIN!;
 const config={projectRoot,originDirectory,display_name:'Saved companion',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('reopen never dispatches');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}};
 const first=await createPersonalBrowserMembershipProfile(config);const id=first.project_id;await first.close();
 const reopened=await createPersonalBrowserMembershipProfile({...config,mode:'reopen'});try{assert.equal(reopened.project_id,id);const boot=await fetch(reopened.origin+'/v1/bootstrap',{method:'POST',headers:{origin:reopened.origin,'content-type':'application/json'},body:JSON.stringify({token:reopened.bootstrap})});assert.equal(boot.status,200);}finally{await reopened.close();}
});

test('BF-R08 D5 E06-f: copied/replaced/unregistered origins and concurrent native leases reject',async()=>{
 const parent=mkdtempSync(join(browserEvidenceRoot,'companion-origins-')),projectRoot=join(parent,'project'),originDirectory=join(parent,'origins');mkdirSync(originDirectory);const bin=process.env.JUANERAI_TOOLCHAIN_BIN!;
 const config={projectRoot,originDirectory,display_name:'Origin bound',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail();}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}};
 const live=await createPersonalBrowserMembershipProfile(config);
 try{await assert.rejects(()=>createPersonalBrowserMembershipProfile({...config,mode:'reopen'}),{code:'PROJECT_BUSY'});const other=new DatabaseSync(join(projectRoot,'.xanthil/browser-companion.lock.sqlite'));try{assert.throws(()=>other.exec('BEGIN EXCLUSIVE'),/locked/);}finally{other.close();}assert.equal(lstatSync(join(originDirectory,readdirSync(originDirectory)[0])).mode&0o777,0o600);}finally{await live.close();}
 const copied=join(parent,'copy');cpSync(projectRoot,copied,{recursive:true});const before=readFileSync(join(copied,'.xanthil/desktop/state.sqlite'));await assert.rejects(()=>createPersonalBrowserMembershipProfile({...config,projectRoot:copied,mode:'reopen'}),{code:'EXISTING_PROJECT_ACTIVATION_CLOSED'});assert.deepEqual(readFileSync(join(copied,'.xanthil/desktop/state.sqlite')),before);
 renameSync(projectRoot,join(parent,'original'));cpSync(copied,projectRoot,{recursive:true});assert.throws(()=>reopenBrowserProject(originDirectory,projectRoot),{code:'EXISTING_PROJECT_ACTIVATION_CLOSED'});
});

test('BF-R01/08 E06-e: native browser launch opens only a ready service and cancellation creates no project',async()=>{
 const modulePath='../../../apps/browser/companion-main.ts',module=await import(modulePath),parent=mkdtempSync(join(browserEvidenceRoot,'native-launch-')),bin=process.env.JUANERAI_TOOLCHAIN_BIN!,model={runtime:{async turn(){assert.fail('no model');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}},toolchain={pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'};let opened=0;
 const cancelled=await module.launchBrowserCompanion({toolchain,model,native:{async selectProject(){return null;},async openBrowser(){assert.fail('cancelled selection must not open');}}});assert.equal(cancelled,null);
 const live=await module.launchBrowserCompanion({toolchain,model,native:{async selectProject(){return {projectRoot:join(parent,'project'),display_name:'Synthetic native browser'};},async openBrowser(url:string){opened++;const u=new URL(url);assert.match(u.hash,/^#[a-f0-9]{64}$/);assert.equal((await fetch(u.origin+'/')).status,200);}}});assert.equal(opened,1);await live.close();
});

test('BF-R08 D5 E06-g: native selected reopen consumes the same origin capability',async()=>{
 const {launchBrowserCompanion}=await import('../../../apps/browser/companion-main.ts'),parent=mkdtempSync(join(browserEvidenceRoot,'native-reopen-')),originDirectory=join(parent,'origins');mkdirSync(originDirectory);const bin=process.env.JUANERAI_TOOLCHAIN_BIN!;
 const common={originDirectory,toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('no automatic dispatch');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}};
 const selected={projectRoot:join(parent,'project'),display_name:'Native saved'},first=await launchBrowserCompanion({...common,native:{async selectProject(){return {...selected,mode:'create' as const};},async openBrowser(){}}});assert.ok(first);const id=first.project_id;await first.close();
 const next=await launchBrowserCompanion({...common,native:{async selectProject(){return {...selected,mode:'reopen' as const};},async openBrowser(){}}});assert.ok(next);try{assert.equal(next.project_id,id);}finally{await next.close();}
});
