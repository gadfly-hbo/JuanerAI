import {test} from 'node:test';
import assert from 'node:assert/strict';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import type {OpenStoredTask} from '../../../packages/ports/open-analysis-store.ts';
import {reportStudioMaterialCatalog, selectReportStudioMaterials} from '../../../packages/application/report-studio-source.ts';

const id = '11111111-1111-4111-a111-111111111111';
const project = '22222222-2222-4222-a222-222222222222';
function fixture(revision: string, text = 'SYNTHETIC conclusion'): OpenStoredTask {
  // Deliberately includes private surplus fields to detect whole-record copying.
  return {version:'1.4',identity:{task_id:id,revision,scope_sha256:'a'.repeat(64)},question:`SYNTHETIC v${revision}`,state:'saved',
    source:{private:'RAW_SECRET',sources:[]},checkpoint:{private:'CONVERSATION_SECRET'},credential:'AUTH_SECRET',
    outcome:{version:'1.0',outcome_id:id,explanation:{kind:'MODEL_EXPLANATION',text},calculation:{value:'123',unit:'元',rows:2,groups:[{key:'合成组',value:'123',rows:2}],private:'RAW_SECRET'},verification:{grade:'independent_arithmetic'}},history:[]
  } as unknown as OpenStoredTask;
}

test('RS-SOURCE-01 historical revision stays exact when current revision changes', () => {
  const old = fixture('1'), current = {...fixture('2','FUTURE_SUMMARY'),history:[old]};
  const before = taskHash(current), catalog = reportStudioMaterialCatalog(project,current,'1');
  assert.equal(catalog.source.revision,'1');
  assert.equal(catalog.source.outcome_sha256,taskHash(old.outcome));
  assert.equal(catalog.materials.find(m=>m.material_id==='conclusion')?.text,'SYNTHETIC conclusion');
  assert.equal(taskHash(current),before);
  const serialized=JSON.stringify(catalog);
  for(const secret of ['RAW_SECRET','AUTH_SECRET','CONVERSATION_SECRET','FUTURE_SUMMARY'])assert(!serialized.includes(secret),secret);
});

test('RS-SOURCE-01 selected copies retain source, limits and actual verification scope', () => {
  const task=fixture('1'), catalog=reportStudioMaterialCatalog(project,task,'1');
  const selected=selectReportStudioMaterials(catalog,['table']);
  assert.equal(selected.materials.length,1);
  const table=selected.materials[0];assert.equal(table.classification,'ANALYSIS_CALCULATION');assert.equal(table.verification,'independent_arithmetic');
  assert.deepEqual(table.source,selected.source);assert(table.limitations.length>0);assert.match(table.text,/123/);
  assert.equal(selected.snapshot_sha256,taskHash({schema_version:selected.schema_version,title:selected.title,source:selected.source,materials:selected.materials}));
  const model=selectReportStudioMaterials(catalog,['conclusion']).materials[0];assert.equal(model.verification,'not_performed');assert.equal(model.classification,'MODEL_EXPLANATION');
  assert.notEqual(selectReportStudioMaterials(catalog,['conclusion']).snapshot_sha256,selected.snapshot_sha256);
});

for(const revision of ['0','3','../1','01'])test(`RS-SOURCE-01 no missing-version fallback: ${revision}`,()=>{
  assert.throws(()=>reportStudioMaterialCatalog(project,fixture('1'),revision),{code:'RS_SOURCE_UNAVAILABLE'});
});
for(const selection of [[],['unknown'],['table','table']])test(`RS-SOURCE-01 rejects selection ${JSON.stringify(selection)}`,()=>{
  const catalog=reportStudioMaterialCatalog(project,fixture('1'),'1');
  assert.throws(()=>selectReportStudioMaterials(catalog,selection),{code:'RS_SELECTION_INVALID'});
});

test('RS-SOURCE-01 no saved result and ambiguous revision are unavailable',()=>{
  assert.throws(()=>reportStudioMaterialCatalog(project,{...fixture('1'),state:'running'},'1'),{code:'RS_SOURCE_UNAVAILABLE'});
  assert.throws(()=>reportStudioMaterialCatalog(project,{...fixture('1'),outcome:null},'1'),{code:'RS_SOURCE_UNAVAILABLE'});
  const duplicate=fixture('1');assert.throws(()=>reportStudioMaterialCatalog(project,{...duplicate,history:[duplicate]},'1'),{code:'RS_SOURCE_UNAVAILABLE'});
});

test('RS-SOURCE-01 source-attribution/conversation outputs never gain arithmetic verification',()=>{
  const task=fixture('1');const sourceAttributed={...task,outcome:{...task.outcome!,verification:{...task.outcome!.verification,grade:'source_attribution' as const}}};
  assert.equal(reportStudioMaterialCatalog(project,sourceAttributed,'1').materials.find(m=>m.material_id==='table')?.verification,'source_attribution');
  const conversation={...task,outcome:null,conversation_outcome:{version:'1.0' as const,outcome_id:id,identity:task.identity,kind:'MODEL_CONVERSATION' as const,text:'合成对话结果',verification:'not_performed' as const,human_judgment:'not_recorded' as const}};
  const catalog=reportStudioMaterialCatalog(project,conversation,'1');assert.equal(catalog.materials.length,1);assert.equal(catalog.materials[0].verification,'not_performed');
});
