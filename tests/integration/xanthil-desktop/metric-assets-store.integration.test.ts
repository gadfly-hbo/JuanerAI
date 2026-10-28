import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,realpathSync,symlinkSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import {createProjectMetricAssetStore} from '../../../adapters/storage-local/metric-assets.ts';
const root=new URL('../../../docs/planning/2026-10-12/change006-metric-assets/attachments/metric-factory-1.1/releases/',import.meta.url);
const file=(v:string)=>readFileSync(new URL(`net-sales-instance/${v}.sap.yaml`,root)),registry=readFileSync(new URL('index.yaml',root));
test('MF-02/03: import is only a candidate; one exact project approval survives reopen and next tasks reuse that version',()=>{
 const p=realpathSync(mkdtempSync(join(tmpdir(),'c006-assets-')));try{const store=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic-project'});
 assert.equal(store.importCandidate(file('1.1.0'),registry).approved,false);assert.equal(store.approved(),null);
 const command={command_id:randomUUID(),id:'net-sales-instance',version:'1.1.0',owner:'synthetic-maintainer',use_for_new_tasks:true};const a=store.approve(command);assert.equal(a.asset_version,'1.1.0');assert.equal(a.metrics.length,56);assert.equal(new Set(a.metrics).size,56);
 assert.deepEqual(store.approve(command),a);const reopened=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic-project'});assert.equal(reopened.approved()!.asset.version,'1.1.0');assert.equal(reopened.approved()!.approval.owner,'synthetic-maintainer');
 }finally{rmSync(p,{recursive:true});}
});
test('MF-03/09: another approved version without future-default activation keeps default; revocation fences new adoption and preserves candidate history',()=>{
 const p=realpathSync(mkdtempSync(join(tmpdir(),'c006-versions-')));try{const s=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic'});
 for(const v of ['1.1.0','1.1.1']){s.importCandidate(file(v),registry);s.approve({command_id:randomUUID(),id:'net-sales-instance',version:v,owner:'maintainer',use_for_new_tasks:v==='1.1.0'});}
 assert.equal(s.approved()!.asset.version,'1.1.0');assert.equal(s.approved('net-sales-instance','1.1.1')!.asset.version,'1.1.1');
 s.revoke({command_id:randomUUID(),id:'net-sales-instance',version:'1.1.0',owner:'maintainer'});assert.equal(s.approved(),null);assert.equal(s.list().length,2);assert.equal(s.list().find(c=>c.asset.version==='1.1.0')!.approved,false);
 assert.throws(()=>createProjectMetricAssetStore({projectRoot:p,projectId:'other'}).list(),{code:'ASSET_PROJECT_CONFLICT'});
 }finally{rmSync(p,{recursive:true});}
});
test('MF-08/MFC-01: approval write failure retains old default; failed import has no candidate; replay with different input is rejected',()=>{
 const p=realpathSync(mkdtempSync(join(tmpdir(),'c006-atomic-')));try{const normal=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic'});normal.importCandidate(file('1.1.0'),registry);const input={command_id:randomUUID(),id:'net-sales-instance',version:'1.1.0',owner:'maintainer',use_for_new_tasks:true};normal.approve(input);normal.importCandidate(file('1.1.1'),registry);
 const broken=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic',beforeCommit(){throw new Error('injected save failure');}});
 assert.throws(()=>broken.approve({...input,command_id:randomUUID(),version:'1.1.1'}));assert.equal(normal.approved()!.asset.version,'1.1.0');
 assert.throws(()=>normal.approve({...input,owner:'another'}),{code:'ASSET_COMMAND_CONFLICT'});
 const p2=realpathSync(mkdtempSync(join(tmpdir(),'c006-failimport-')));try{const b=createProjectMetricAssetStore({projectRoot:p2,projectId:'synthetic',beforeCommit(){throw new Error('injected');}});assert.throws(()=>b.importCandidate(file('1.1.0'),registry));assert.deepEqual(b.list(),[]);}finally{rmSync(p2,{recursive:true});}
 }finally{rmSync(p,{recursive:true});}
});
test('MF-08: a symlink project state directory cannot redirect asset writes',()=>{
 const p=realpathSync(mkdtempSync(join(tmpdir(),'c006-link-'))),target=realpathSync(mkdtempSync(join(tmpdir(),'c006-target-')));try{symlinkSync(target,join(p,'.xanthil'));const s=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic'});assert.throws(()=>s.importCandidate(file('1.1.0'),registry),{code:'ASSET_STORE_UNSAFE'});}finally{rmSync(p,{recursive:true});rmSync(target,{recursive:true});}
});
test('MF-03/09: changing future default retains the exact approval of current tasks and owner; candidate-only source can gain verified registration',()=>{const p=realpathSync(mkdtempSync(join(tmpdir(),'c006-default-')));try{const s=createProjectMetricAssetStore({projectRoot:p,projectId:'synthetic'});assert.equal(s.importCandidate(file('1.1.0')).release_verified,false);assert.throws(()=>s.approve({command_id:randomUUID(),id:'net-sales-instance',version:'1.1.0',owner:'maintainer',use_for_new_tasks:true}),{code:'ASSET_RELEASE_UNVERIFIED'});s.importCandidate(file('1.1.0'),registry);const first=s.approve({command_id:randomUUID(),id:'net-sales-instance',version:'1.1.0',owner:'maintainer',use_for_new_tasks:false}),command_id=randomUUID();s.approve({command_id,id:'net-sales-instance',version:'1.1.0',owner:'maintainer',use_for_new_tasks:true});assert.deepEqual(s.approved()!.approval,first);assert.ok(s.receipt(command_id));assert.throws(()=>s.approve({command_id:randomUUID(),id:'net-sales-instance',version:'1.1.0',owner:'different',use_for_new_tasks:true}),{code:'ASSET_OWNER_REQUIRED'});}finally{rmSync(p,{recursive:true});}});
