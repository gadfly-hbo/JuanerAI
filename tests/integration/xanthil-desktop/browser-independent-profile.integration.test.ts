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
