import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import * as profile from '../../../profiles/personal/browser-membership.ts';
import {createLocalModelAccess} from '../../../packages/application/provider-settings.ts';
import {approvedMembershipPolicy} from '../../../packages/product-core/member-model-policy.ts';
import {browserEvidenceRoot} from '../../fixtures/xanthil-desktop/browser-evidence.ts';

test('BF-R01/08/11: independent project assembly has durable consumers without starting an Electron or HTTP host',async()=>{
 const assemble=Reflect.get(profile,'createPersonalBrowserMembershipWorkspace');
 assert.equal(typeof assemble,'function','project assembly must be independent of its listener');
 const parent=mkdtempSync(join(browserEvidenceRoot,'independent-profile-')),originDirectory=join(parent,'origins');mkdirSync(originDirectory);
 const bin=process.env.JUANERAI_TOOLCHAIN_BIN!;
 const config={projectRoot:join(parent,'project'),originDirectory,display_name:'Synthetic independent project',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('assembly/readback never dispatches');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}};
 const first=await assemble(config);
 assert.equal('origin' in first,false);assert.equal('bootstrap' in first,false);assert.deepEqual(await first.workspace.list(),{tasks:[]});
 const id=first.project_id;assert.deepEqual(await first.close(),{unresolved:0});
 const reopened=await assemble({...config,mode:'reopen'});try{assert.equal(reopened.project_id,id);assert.deepEqual(await reopened.workspace.list(),{tasks:[]});}finally{await reopened.close();}
});

test('OA-S01/Q11-07: normal independent browser project binds its selected document reader to the actual project and preserves passive readback',async()=>{
 const parent=mkdtempSync(join(browserEvidenceRoot,'independent-documents-')),originDirectory=join(parent,'origins');mkdirSync(originDirectory);const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,{randomUUID}=await import('node:crypto');let calls=0;
 const app=await profile.createPersonalBrowserMembershipWorkspace({projectRoot:join(parent,'project'),originDirectory,display_name:'Synthetic documents',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('legacy runtime is not selected');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}},openModel:{documentReader:{pythonExecutable:join(bin,'python3')},authorizeConfiguration:async()=>({config_sha256:'b'.repeat(64)}),createRuntime:()=>({run:async input=>{calls++;const result=await input.tools.find(t=>t.name==='inspect_selected')!.execute({},input.signal);assert.ok(JSON.stringify(result).includes('原文观察'));await input.tools.find(t=>t.name==='ask_user')!.execute({text:'请补充金额表。'},input.signal);return {text:'请补充金额表。',tools:[]};}})}});const id=randomUUID();try{assert.ok(app.open);await app.open.submit({version:'1.0',command_id:id,question:'比较说明',confirmed:true,sources:[{source_id:randomUUID(),display_name:'说明.md',format:'md',bytes:Buffer.from('业务说明\n金额表尚未提供')}]});await app.open.collect();assert.equal(app.open.read(id).state,'waiting');assert.equal(app.open.read(id).source.sources[0]!.format,'md');assert.equal(calls,1);}finally{await app.close();}assert.throws(()=>app.formalMember!.reviewReceipt(randomUUID(),randomUUID()),{code:'PROJECT_CLOSED'},'closed profile must not expose native review operations');
});


test('OA-RT04/C03: closed standalone composition without project lease rejects native receipt handles',async()=>{
 const parent=mkdtempSync(join(browserEvidenceRoot,'unleased-native-close-')),bin=process.env.JUANERAI_TOOLCHAIN_BIN!,{randomUUID}=await import('node:crypto');
 const app=await profile.createPersonalBrowserMembershipWorkspace({projectRoot:join(parent,'project'),display_name:'Synthetic isolated composition',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{runtime:{async turn(){assert.fail('no dispatch');}},access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}},openModel:{authorizeConfiguration:async()=>{assert.fail('no credential read');},createRuntime:()=>({run:async()=>{assert.fail('no dispatch');}})}});
 assert.equal(app.formalMember!.reviewReceipt(randomUUID(),randomUUID()),null);await app.close();assert.throws(()=>app.formalMember!.reviewReceipt(randomUUID(),randomUUID()),{code:'SERVICE_CLOSED'});
});
