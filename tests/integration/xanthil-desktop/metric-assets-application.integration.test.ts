import {compileOpenAnalysisContext} from '../../../packages/product-core/open-analysis-context.ts';
import {compileOpenAnalysisIR} from '../../../packages/product-core/open-analysis-ir.ts';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,realpathSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import {createOpenAnalysisApplication} from '../../../packages/application/open-analysis.ts';
import {createProjectMetricAssetStore} from '../../../adapters/storage-local/metric-assets.ts';
import {verifyOpenAnalysisIntegerSum} from '../../../adapters/analytics-duckdb/open-analysis-verification.ts';import {taskHash} from '../../../packages/product-core/member-task.ts';
import {assetProposal,syntheticAssetInspection} from '../../fixtures/metric-assets.ts';import type {OpenAnalysisRun} from '../../../packages/ports/open-analysis-runtime.ts';
const releases=new URL('../../../docs/planning/2026-10-12/change006-metric-assets/attachments/metric-factory-1.1/releases/',import.meta.url);
for(const boundary of ['success','revoked','disclosure','stopped','save_failure','source_changed'] as const)test('MF-03/04/07/09: normal Application consumes host-approved six definitions and fences '+boundary,async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'c006-app-')));try{
 const assets=createProjectMetricAssetStore({projectRoot:root,projectId:'synthetic'}),proposal=assetProposal(),source=syntheticAssetInspection(),saved:any[]=[];
 assets.importCandidate(readFileSync(new URL('net-sales-instance/1.1.0.sap.yaml',releases)),readFileSync(new URL('index.yaml',releases)));assets.approve({command_id:randomUUID(),id:proposal.asset.id,version:proposal.asset.version,owner:'synthetic-maintainer',use_for_new_tasks:true});
 const taskStore=createLocalOpenAnalysisStore({projectRoot:root});
 const identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};
 taskStore.create({identity,question:proposal.goal,source});const lease=taskStore.begin(identity.task_id);
 const app=createOpenAnalysisApplication({metricAssets:assets,metricAssetDisclosureAllowed:boundary!=='disclosure',runtime:{run:async(i:OpenAnalysisRun)=>{
 const call=(name:string,args:any={})=>{const t=i.tools.find(t=>t.name===name);assert.ok(t,'approved asset must enter existing Application tools');return t.execute(args,i.signal) as Promise<any>;};
 const catalog=await call('read_project_metric_asset');if(boundary==='disclosure'){assert.equal(catalog.status,'disclosure_required');assert.equal(JSON.stringify(catalog).includes('caliber_switches'),false);return {text:'尚缺口径外发许可',tools:[]};}
 assert.equal(catalog.metrics.length,6);assert.equal(catalog.unselected_metrics,50);await call('set_metric_asset_framework',{goal:proposal.goal,unit:proposal.unit,bindings:proposal.bindings,parameters:proposal.parameters});
 const result=await call('calculate_and_verify');assert.equal(result.calculation.value,'150');assert.equal(JSON.stringify(result).includes('commission_revenue'),false);assert.equal(JSON.stringify(result).includes('"name":"uv"'),false);
 if(boundary==='stopped')taskStore.stop(identity.task_id);if(boundary==='source_changed')Reflect.set(source.sources[0].sheets[0].rows[1].cells[2],'value','110');
 if(boundary==='revoked')assets.revoke({command_id:randomUUID(),id:proposal.asset.id,version:proposal.asset.version,owner:'synthetic-maintainer'});
 return {text:'销售和退款差额仅作描述性解释。',tools:[]};}},loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async v=>taskStore.saveFramework(lease,v),verify:verifyOpenAnalysisIntegerSum,saveOutcome:async v=>{if(boundary==='save_failure')throw Object.assign(new Error('SAVE_UNCONFIRMED'),{code:'SAVE_UNCONFIRMED'});const receipt=taskStore.saveOutcome(lease,v);saved.push(v);return receipt;}});
 if(boundary==='disclosure')await assert.rejects(()=>app.run({identity,question:proposal.goal,signal:new AbortController().signal}),{code:'ANALYSIS_INCOMPLETE'});else if(boundary==='revoked')await assert.rejects(()=>app.run({identity,question:proposal.goal,signal:new AbortController().signal}),{code:'ASSET_APPROVAL_REVOKED'});else if(['stopped','save_failure','source_changed'].includes(boundary))await assert.rejects(()=>app.run({identity,question:proposal.goal,signal:new AbortController().signal}),{code:boundary==='stopped'?'LEASE_EXPIRED':boundary==='save_failure'?'SAVE_UNCONFIRMED':'SOURCE_CHANGED'});else await app.run({identity,question:proposal.goal,signal:new AbortController().signal});assert.equal(saved.length,boundary==='success'?1:0);const reopened=createLocalOpenAnalysisStore({projectRoot:root}).read(identity.task_id)!;assert.equal(!!reopened.outcome,boundary==='success');if(boundary==='success'){assert.deepEqual(reopened.outcome,saved[0]);assert.equal(reopened.outcome!.asset_adoption!.receipt.adopted_metrics.length,6);}
 }finally{rmSync(root,{recursive:true,force:true});}
});


test('MF-03/07 restored asset framework cannot disclose via Runtime without current permission',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'c006-restored-')));try{
  const assets=createProjectMetricAssetStore({projectRoot:root,projectId:'synthetic'}),proposal=assetProposal(),source=syntheticAssetInspection();
  assets.importCandidate(readFileSync(new URL('net-sales-instance/1.1.0.sap.yaml',releases)),readFileSync(new URL('index.yaml',releases)));assets.approve({command_id:randomUUID(),id:proposal.asset.id,version:proposal.asset.version,owner:'synthetic-maintainer',use_for_new_tasks:true});
  const approved=assets.approved()!.approval;proposal.asset_approval={command_id:approved.command_id,owner:approved.owner,project_id:approved.project_id,definition_sha256:approved.definition_sha256};
  const context=compileOpenAnalysisContext(proposal,proposal.goal,source),plan=compileOpenAnalysisIR(context.proposal.plan,source),identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:taskHash(source),config_sha256:'c'.repeat(64)};let calls=0,saves=0;
  const app=createOpenAnalysisApplication({metricAssets:assets,metricAssetDisclosureAllowed:false,framework:{version:'1.0',identity,origin:'MODEL_PROPOSAL',plan,context},runtime:{run:async()=>{calls++;return {text:'unexpected',tools:[]};}},loadSelectedSource:async()=>source,isAuthorized:()=>true,saveFramework:async()=>{throw Error('unexpected');},verify:verifyOpenAnalysisIntegerSum,saveOutcome:async()=>{saves++;throw Error('unexpected');}});
  await assert.rejects(()=>app.run({identity,question:proposal.goal,signal:new AbortController().signal}),{code:'ASSET_DISCLOSURE_REQUIRED'});assert.equal(calls,0);assert.equal(saves,0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
