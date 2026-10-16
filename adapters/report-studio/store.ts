import {DatabaseSync} from 'node:sqlite';
import {existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {taskHash} from '../../packages/product-core/member-task.ts';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';
import type {ReportStudioMaterialSnapshot} from '../../packages/contracts/report-studio.ts';
import type {ReportStudioStore, ReportStudioAssociation, ReportStudioDelivery, ReportStudioDeliveryInput} from '../../packages/ports/report-studio.ts';

type Row = Record<string, string | number | bigint | Uint8Array | null>;
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const sha = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const token = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const exact = (v: unknown, keys: string[]) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).sort().join(',') === [...keys].sort().join(',');
function fail(code: string): never {throw Object.assign(new Error(code), {code});}
function validSnapshot(s: ReportStudioMaterialSnapshot, projectId: string): boolean {
  if (!exact(s,['schema_version','title','source','materials','snapshot_sha256']) || s.schema_version !== '1' || !text(s.title)
    || !exact(s.source,['project_id','task_id','revision','outcome_id','outcome_sha256','scope_sha256'])
    || s.source.project_id !== projectId || !membershipUuid(s.source.task_id) || !membershipUuid(s.source.outcome_id)
    || !/^[1-9][0-9]*$/.test(s.source.revision) || !sha(s.source.outcome_sha256) || !sha(s.source.scope_sha256)
    || !Array.isArray(s.materials) || !s.materials.length || !sha(s.snapshot_sha256)) return false;
  const {snapshot_sha256,...body}=s;
  if (taskHash(body)!==snapshot_sha256 || new Set(s.materials.map(m=>m.material_id)).size!==s.materials.length) return false;
  return s.materials.every(m=>exact(m,['material_id','label','text','classification','source','verification','limitations'])
    && ['conclusion','table'].includes(m.material_id) && text(m.label) && text(m.text) && taskHash(m.source)===taskHash(s.source)
    && (m.material_id==='conclusion' ? m.classification==='MODEL_EXPLANATION' && m.verification==='not_performed'
      : m.classification==='ANALYSIS_CALCULATION' && ['independent_arithmetic','source_attribution'].includes(m.verification))
    && Array.isArray(m.limitations) && m.limitations.length>0 && m.limitations.every(text));
}

/** Project-local operational state plus immutable byte copies; no plugin/analysis DB writes. */
export function createReportStudioStore(config: {projectRoot: string; projectId: string; beforeCommit?: () => void; afterCommit?: () => void}): ReportStudioStore {
  if (!membershipUuid(config.projectId)) fail('RS_STORE_PROJECT_CONFLICT');
  const root=realpathSync(config.projectRoot);
  if(root!==resolve(config.projectRoot))fail('RS_STORE_UNSAFE');
  const dir=join(root,'.xanthil'),file=join(dir,'report-studio.sqlite'),applicationId=0x4a525331;
  function safe() {
    for(const path of [dir,file])if(existsSync(path)) {
      const s=lstatSync(path);
      if(s.isSymbolicLink() || (path===dir ? !s.isDirectory() : !s.isFile() || s.nlink!==1))fail('RS_STORE_UNSAFE');
    }
  }
  function withDb<T>(write:boolean, absent:()=>T, fn:(db:DatabaseSync)=>T):T {
    safe();const existing=existsSync(file);
    if(!existing&&!write)return absent();
    if(!existing) {mkdirSync(dir,{recursive:true,mode:0o700});writeFileSync(file,'',{flag:'wx',mode:0o600});}
    const db=new DatabaseSync(file,{readOnly:!write});
    try {
      if(!existing) {
        db.exec(`BEGIN IMMEDIATE; PRAGMA application_id=${applicationId}; PRAGMA user_version=1;
          CREATE TABLE meta (singleton INTEGER PRIMARY KEY CHECK(singleton=1),project_id TEXT NOT NULL);
          CREATE TABLE associations (association_id TEXT PRIMARY KEY,studio_project_id TEXT NOT NULL UNIQUE,task_id TEXT NOT NULL,revision TEXT NOT NULL,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL,UNIQUE(task_id,revision));
          CREATE TABLE deliveries (delivery_id TEXT PRIMARY KEY,association_id TEXT NOT NULL,export_id TEXT NOT NULL,sequence INTEGER NOT NULL,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL,content BLOB NOT NULL,UNIQUE(association_id,export_id),UNIQUE(association_id,sequence));`);
        db.prepare('INSERT INTO meta VALUES(1,?)').run(config.projectId);db.exec('COMMIT');
      }
      if(db.prepare('PRAGMA user_version').get()?.user_version!==1 || db.prepare('PRAGMA application_id').get()?.application_id!==applicationId)fail('RS_STORE_INTEGRITY');
      if(db.prepare('SELECT project_id FROM meta WHERE singleton=1').get()?.project_id!==config.projectId)fail('RS_STORE_PROJECT_CONFLICT');
      if(write)db.exec('BEGIN IMMEDIATE');
      let result:T;
      try {result=fn(db);if(write){config.beforeCommit?.();db.exec('COMMIT');}}
      catch(error){if(write)db.exec('ROLLBACK');throw error;}
      if(write)config.afterCommit?.();
      return result;
    } finally {db.close();}
  }
  function decode<T>(row:Row):T {
    if(typeof row.body_json!=='string'||typeof row.body_sha256!=='string')fail('RS_STORE_INTEGRITY');
    let body:unknown;try{body=JSON.parse(row.body_json);}catch{fail('RS_STORE_INTEGRITY');}
    if(taskHash(body)!==row.body_sha256)fail('RS_STORE_INTEGRITY');return body as T;
  }
  function association(db:DatabaseSync,id:string):ReportStudioAssociation|null {
    const row=db.prepare('SELECT * FROM associations WHERE association_id=?').get(id);
    if(!row)return null;
    const a=decode<ReportStudioAssociation>(row);
    if(a.association_id!==row.association_id || a.studio_project_id!==row.studio_project_id || a.snapshot.source.task_id!==row.task_id
      || a.snapshot.source.revision!==row.revision || !validSnapshot(a.snapshot,config.projectId) || !['pending','ready'].includes(a.state))fail('RS_STORE_INTEGRITY');
    return a;
  }
  function delivery(row:Row):ReportStudioDelivery {
    const d=decode<ReportStudioDelivery>(row);
    if(d.delivery_id!==row.delivery_id || d.association_id!==row.association_id || d.export_id!==row.export_id || d.sequence!==row.sequence
      || d.source.project_id!==config.projectId || d.classification!=='EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED'
      || !(row.content instanceof Uint8Array) || row.content.byteLength!==d.bytes || digest(row.content)!==d.artifact_sha256)fail('RS_STORE_INTEGRITY');
    return d;
  }
  const missing=():never=>fail('RS_NOT_FOUND');
  return {
    prepare(input) {
      if(!exact(input,['association_id','studio_project_id','created_at','snapshot'])||!membershipUuid(input.association_id)||!token(input.studio_project_id)||!date(input.created_at))fail('RS_ASSOCIATION_INVALID');
      if(!validSnapshot(input.snapshot,config.projectId))fail('RS_SNAPSHOT_INVALID');
      return withDb(true,missing,db=>{
        const source=input.snapshot.source, prior=db.prepare('SELECT association_id FROM associations WHERE task_id=? AND revision=?').get(source.task_id,source.revision);
        if(prior) {const a=association(db,String(prior.association_id))!;if(a.snapshot.snapshot_sha256!==input.snapshot.snapshot_sha256)fail('RS_ASSOCIATION_CONFLICT');return a;}
        if(db.prepare('SELECT 1 FROM associations WHERE association_id=? OR studio_project_id=?').get(input.association_id,input.studio_project_id))fail('RS_ASSOCIATION_CONFLICT');
        const value:ReportStudioAssociation={...structuredClone(input),state:'pending'};
        db.prepare('INSERT INTO associations VALUES (?,?,?,?,?,?)').run(value.association_id,value.studio_project_id,source.task_id,source.revision,JSON.stringify(value),taskHash(value));
        return association(db,value.association_id)!;
      });
    },
    ready(id) {return withDb(true,missing,db=>{
      const a=association(db,id);if(!a)fail('RS_NOT_FOUND');
      const next={...a,state:'ready' as const};db.prepare('UPDATE associations SET body_json=?,body_sha256=? WHERE association_id=?').run(JSON.stringify(next),taskHash(next),id);
      return association(db,id)!;
    });},
    association(id){return withDb(false,()=>null,db=>association(db,id));},
    sourceAssociation(task_id,revision){return withDb(false,()=>null,db=>{const row=db.prepare('SELECT association_id FROM associations WHERE task_id=? AND revision=?').get(task_id,revision);return row?association(db,String(row.association_id)):null;});},
    deliver(input,content) {
      if(!exact(input,['delivery_id','association_id','export_id','format','created_at','artifact_sha256','bytes','warnings'])
        || !membershipUuid(input.delivery_id)||!membershipUuid(input.association_id)||!token(input.export_id)||!date(input.created_at)
        || !['pptx','html','pdf'].includes(input.format)||!sha(input.artifact_sha256)||!Number.isSafeInteger(input.bytes)||input.bytes<=0
        || !(content instanceof Uint8Array)||content.byteLength!==input.bytes||digest(content)!==input.artifact_sha256
        || !Array.isArray(input.warnings)||!input.warnings.every(text))fail('RS_EXPORT_INVALID');
      const saved=withDb(true,missing,db=>{
        const a=association(db,input.association_id);if(!a||a.state!=='ready')fail('RS_PROJECT_NOT_READY');
        const row=db.prepare('SELECT * FROM deliveries WHERE association_id=? AND export_id=?').get(input.association_id,input.export_id);
        if(row) {
          const prior=delivery(row),{delivery_id:oldId,sequence,source,classification,...old}=prior;void oldId;void sequence;void source;void classification;
          const {delivery_id,...current}=input;void delivery_id;
          if(taskHash(old)!==taskHash(current))fail('RS_EXPORT_CONFLICT');return prior;
        }
        if(db.prepare('SELECT 1 FROM deliveries WHERE delivery_id=?').get(input.delivery_id))fail('RS_EXPORT_CONFLICT');
        const sequence=Number(db.prepare('SELECT COALESCE(MAX(sequence),0)+1 AS value FROM deliveries WHERE association_id=?').get(input.association_id)!.value);
        const value:ReportStudioDelivery={...structuredClone(input),sequence,source:a.snapshot.source,classification:'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED'};
        db.prepare('INSERT INTO deliveries VALUES(?,?,?,?,?,?,?)').run(value.delivery_id,value.association_id,value.export_id,value.sequence,JSON.stringify(value),taskHash(value),content);
        return delivery(db.prepare('SELECT * FROM deliveries WHERE delivery_id=?').get(value.delivery_id)!);
      });
      // A separately opened read validates both committed association and byte copy.
      return withDb(false,missing,db=>{
        if(!association(db,saved.association_id))fail('RS_STORE_INTEGRITY');
        const row=db.prepare('SELECT * FROM deliveries WHERE delivery_id=?').get(saved.delivery_id);
        if(!row)fail('RS_STORE_INTEGRITY');return delivery(row);
      });
    },
    delivery(id,export_id){return withDb(false,()=>null,db=>{const row=db.prepare('SELECT * FROM deliveries WHERE association_id=? AND export_id=?').get(id,export_id);return row?delivery(row):null;});},
    deliveries(task_id){return withDb(false,()=>[],db=>db.prepare('SELECT deliveries.* FROM deliveries JOIN associations USING(association_id) WHERE associations.task_id=? ORDER BY deliveries.rowid').all(task_id).map(delivery));},
    copy(id){return withDb(false,missing,db=>{const row=db.prepare('SELECT * FROM deliveries WHERE delivery_id=?').get(id);if(!row)fail('RS_NOT_FOUND');const record=delivery(row);return {record,content:new Uint8Array(row.content as Uint8Array)};});},
  };
}
