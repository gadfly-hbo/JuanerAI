import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, realpathSync} from 'node:fs';
import {rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import type {ReportStudioMaterialSnapshot} from '../../../packages/contracts/report-studio.ts';
import type {ReportStudioDeliveryInput} from '../../../packages/ports/report-studio.ts';
import {createReportStudioStore} from '../../../adapters/report-studio/store.ts';

const id = (n: number) => `${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`;
const projectId=id(1), task=id(2), sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
function snapshot(revision='1'):ReportStudioMaterialSnapshot {
  const source={project_id:projectId,task_id:task,revision,outcome_id:id(3),outcome_sha256:'a'.repeat(64),scope_sha256:'b'.repeat(64)};
  const body={schema_version:'1' as const,title:'合成分析',source,materials:[{material_id:'conclusion' as const,label:'结论',text:'合成材料',classification:'MODEL_EXPLANATION' as const,source,verification:'not_performed' as const,limitations:['未经新增分析核验']}]};
  return {...body,snapshot_sha256:taskHash(body)};
}
function fixture(t:{after(fn:()=>Promise<void>):void}) {
  const root=realpathSync(mkdtempSync(join(tmpdir(),'report-studio-store-')));t.after(()=>rm(root,{recursive:true,force:true}));
  const store=createReportStudioStore({projectRoot:root,projectId});
  const association={association_id:id(4),studio_project_id:'proj_12345678',created_at:'2026-10-16T00:00:00Z',snapshot:snapshot()};
  const content=Buffer.from('<!doctype html><html><body>合成已保存导出</body></html>');
  const delivery:ReportStudioDeliveryInput={delivery_id:id(5),association_id:id(4),export_id:'exp_12345678',format:'html',created_at:'2026-10-16T00:01:00Z',artifact_sha256:sha(content),bytes:content.length,warnings:['合成质检警告']};
  return {root,store,association,content,delivery};
}

test('RS-ASSOCIATION-01 reserve/ready are persistent and repeated opening reuses exact binding',async t=>{
  const f=fixture(t);assert.equal(f.store.association(id(4)),null);
  const first=f.store.prepare(f.association);assert.equal(first.state,'pending');
  assert.deepEqual(f.store.prepare({...f.association,association_id:id(9),studio_project_id:'proj_87654321'}),first);
  assert.equal(f.store.ready(id(4)).state,'ready');
  const reopened=createReportStudioStore({projectRoot:f.root,projectId});
  assert.deepEqual(reopened.sourceAssociation(task,'1'),f.store.association(id(4)));
  assert.deepEqual(reopened.ready(id(4)),f.store.ready(id(4)));
});
test('RS-ASSOCIATION-01 source versions coexist and conflicting snapshots never overwrite',t=>{
  const f=fixture(t);f.store.prepare(f.association);
  const second={...f.association,association_id:id(6),studio_project_id:'proj_87654321',snapshot:snapshot('2')};f.store.prepare(second);
  assert.equal(f.store.sourceAssociation(task,'1')!.association_id,id(4));assert.equal(f.store.sourceAssociation(task,'2')!.association_id,id(6));
  const changed={...f.association,snapshot:{...f.association.snapshot,title:'changed'}};
  assert.throws(()=>f.store.prepare(changed),{code:'RS_SNAPSHOT_INVALID'});
  const body={...f.association.snapshot,title:'changed'};const {snapshot_sha256,...rest}=body;void snapshot_sha256;
  assert.throws(()=>f.store.prepare({...f.association,snapshot:{...rest,snapshot_sha256:taskHash(rest)}}),{code:'RS_ASSOCIATION_CONFLICT'});
});
test('RS-DELIVERY-01 immutable copy and warnings survive reopen, repeated export and later versions',t=>{
  const f=fixture(t);f.store.prepare(f.association);f.store.ready(id(4));const first=f.store.deliver(f.delivery,f.content);
  assert.equal(first.sequence,1);assert.deepEqual(first.warnings,f.delivery.warnings);assert.equal(first.classification,'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED');
  assert.deepEqual(f.store.deliver({...f.delivery,delivery_id:id(9)},f.content),first);
  const next=f.store.deliver({...f.delivery,delivery_id:id(6),export_id:'exp_87654321'},f.content);assert.equal(next.sequence,2);
  const reopened=createReportStudioStore({projectRoot:f.root,projectId});
  assert.deepEqual(Buffer.from(reopened.copy(id(5)).content),f.content);assert.deepEqual(reopened.delivery(id(4),'exp_12345678'),first);assert.equal(reopened.deliveries(task).length,2);
  f.content.fill(0);assert.notEqual(sha(reopened.copy(id(5)).content),sha(f.content),'copy cannot alias plugin/mutable caller bytes');
});
test('RS-DELIVERY-01 pending, corrupt and mutated export identities never commit',t=>{
  const f=fixture(t);f.store.prepare(f.association);
  assert.throws(()=>f.store.deliver(f.delivery,f.content),{code:'RS_PROJECT_NOT_READY'});f.store.ready(id(4));
  assert.throws(()=>f.store.deliver({...f.delivery,artifact_sha256:'0'.repeat(64)},f.content),{code:'RS_EXPORT_INVALID'});
  assert.equal(f.store.delivery(id(4),f.delivery.export_id),null);f.store.deliver(f.delivery,f.content);
  assert.throws(()=>f.store.deliver({...f.delivery,warnings:[]},f.content),{code:'RS_EXPORT_CONFLICT'});
});
test('RS-DELIVERY-01 commit failure rolls back; lost post-commit reply reads back same receipt',t=>{
  const f=fixture(t);f.store.prepare(f.association);f.store.ready(id(4));
  const failing=createReportStudioStore({projectRoot:f.root,projectId,beforeCommit:()=>{throw Error('synthetic commit failure');}});
  assert.throws(()=>failing.deliver(f.delivery,f.content),/synthetic commit failure/);assert.equal(f.store.delivery(id(4),f.delivery.export_id),null);
  const lost=createReportStudioStore({projectRoot:f.root,projectId,afterCommit:()=>{throw Error('synthetic lost reply');}});
  assert.throws(()=>lost.deliver(f.delivery,f.content),/synthetic lost reply/);const saved=f.store.delivery(id(4),f.delivery.export_id);assert(saved);assert.deepEqual(f.store.deliver(f.delivery,f.content),saved);
});
test('RS store rejects another host project and tampered delivered byte copy',t=>{
  const f=fixture(t);f.store.prepare(f.association);f.store.ready(id(4));f.store.deliver(f.delivery,f.content);
  const other=createReportStudioStore({projectRoot:f.root,projectId:id(7)});assert.throws(()=>other.association(id(4)),{code:'RS_STORE_PROJECT_CONFLICT'});
  const db=new DatabaseSync(join(f.root,'.xanthil/report-studio.sqlite'));db.prepare('UPDATE deliveries SET content=? WHERE delivery_id=?').run(Buffer.from('corrupt'),id(5));db.close();
  assert.throws(()=>f.store.copy(id(5)),{code:'RS_STORE_INTEGRITY'});
});
