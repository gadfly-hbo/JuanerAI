import {offlineCredentials,offlineResponse} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
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
 const config={projectRoot:join(parent,'project'),originDirectory,display_name:'Synthetic independent project',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}}};
 const first=await assemble(config);
 assert.equal('origin' in first,false);assert.equal('bootstrap' in first,false);assert.deepEqual(await first.workspace.list(),{tasks:[]});
 const id=first.project_id;assert.deepEqual(await first.close(),{unresolved:0});
 const reopened=await assemble({...config,mode:'reopen'});try{assert.equal(reopened.project_id,id);assert.deepEqual(await reopened.workspace.list(),{tasks:[]});}finally{await reopened.close();}
});

test('OA-S01/Q11-07: normal independent browser project binds its selected document reader to the actual project and preserves passive readback',async()=>{
 const parent=mkdtempSync(join(browserEvidenceRoot,'independent-documents-')),originDirectory=join(parent,'origins');mkdirSync(originDirectory);const bin=process.env.JUANERAI_TOOLCHAIN_BIN!,{randomUUID}=await import('node:crypto');let calls=0;
 const app=await profile.createPersonalBrowserMembershipWorkspace({projectRoot:join(parent,'project'),originDirectory,display_name:'Synthetic documents',toolchain:{pythonExecutable:join(bin,'python3'),pythonVersion:'3.14.4',duckdbExecutable:join(bin,'duckdb'),duckdbVersion:'1.5.2'},model:{access:createLocalModelAccess(false),policy:{async read(){return approvedMembershipPolicy;}}},openModel:{analysisModel:'mimo-v2.6-flash',documentReader:{pythonExecutable:join(bin,'python3')},credentials:offlineCredentials,fetch:async(_url,init)=>{calls++;const dto=JSON.parse(String(init!.body));if(calls===1)return offlineResponse(calls,[{name:'read',args:{path:JSON.stringify(JSON.parse(String(init!.body)).messages).match(/\/[^"\\\s]+\/020_clean\/source\/catalog\.txt/)![0]}}]);if(calls===2){assert.match(JSON.stringify(dto.messages),/原文观察/);return offlineResponse(calls,[],'# 有限报告\n请补充金额表，当前不作数量判断。');}return offlineResponse(calls);}}});const id=randomUUID();try{assert.ok(app.open);await app.open.submit({version:'1.0',command_id:id,question:'比较说明',confirmed:true,sources:[{source_id:randomUUID(),display_name:'说明.md',format:'md',bytes:Buffer.from('业务说明\n金额表尚未提供')}]});await app.open.start(id);await app.open.waitForIdle();assert.equal(app.open.read(id).state,'saved');assert.equal(app.open.read(id).source.sources[0]!.format,'md');assert.equal(calls,3);}finally{await app.close();}assert.equal(Object.hasOwn(app,'formalMember'),false);
});



