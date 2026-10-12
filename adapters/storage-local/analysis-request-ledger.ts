import {DatabaseSync} from 'node:sqlite';
import {existsSync,lstatSync,mkdirSync,realpathSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {taskHash,encodeTask} from '../../packages/product-core/member-task.ts';
import {operationDigest,operationUsage,reconcileOperationUsage,type OperationUsage} from '../../packages/product-core/member-operation.ts';
import type {AnalysisRequest,AnalysisRequestIdentity,AnalysisRequestLedger} from '../../packages/ports/analysis-request-ledger.ts';
import {analysisRequestReasons,type AnalysisRequestReason} from '../../packages/ports/analysis-request-ledger.ts';

function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
const identityKeys=['task_id','revision','run_id','attempt_id','operation_id','grant_id','scope_sha256','config_sha256','input_sha256','provider','model'];
const blank:OperationUsage={input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'},active_ms:{kind:'known',value:'0'},wait_ms:{kind:'known',value:'0'}};
const pending:OperationUsage={input_tokens:{kind:'unknown',reason:'issued'},output_tokens:{kind:'unknown',reason:'issued'},active_ms:{kind:'unknown',reason:'issued'},wait_ms:{kind:'unknown',reason:'issued'}};
const schema=`CREATE TABLE controls(task_id TEXT PRIMARY KEY,epoch INTEGER NOT NULL CHECK(epoch>=0),stopped INTEGER NOT NULL CHECK(stopped IN(0,1)));
CREATE TABLE requests(request_id TEXT PRIMARY KEY,task_id TEXT NOT NULL REFERENCES controls(task_id),operation_id TEXT NOT NULL,sequence INTEGER NOT NULL CHECK(sequence IN(1,2)),body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL,UNIQUE(task_id,operation_id,sequence));`;
function schemaIdentity(db:DatabaseSync){return JSON.stringify(db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all());}
const memory=new DatabaseSync(':memory:');memory.exec(schema);const expectedSchema=schemaIdentity(memory);memory.close();
function identity(raw:unknown):AnalysisRequestIdentity{
 const x=closed(raw,identityKeys);
 if(!['task_id','run_id','attempt_id','operation_id','grant_id'].every(k=>membershipUuid(x[k]))||typeof x.revision!=='string'||! /^[1-9]\d*$/.test(x.revision)&&!membershipUuid(x.revision)||!['scope_sha256','config_sha256','input_sha256'].every(k=>operationDigest(x[k]))||!((x.provider==='minimax-cn'&&x.model==='MiniMax-M3')||(x.provider==='xiaomi-token-plan-cn'&&['mimo-v2.6-flash','mimo-v2.6-pro'].includes(String(x.model)))))fail('AUTHORITY_REQUIRED');
 return structuredClone(raw) as AnalysisRequestIdentity;
}
function decode(row:Record<string,unknown>|undefined):AnalysisRequest{
 if(!row)fail('NOT_FOUND');let value:unknown;
 try{value=JSON.parse(String(row.body_json));}catch{fail('INTEGRITY_BLOCKED');}
 const version=(value as Record<string,unknown>)?.version;
 const x=closed(value,[...identityKeys,'version','request_id','sequence','epoch','calls','status','started_at','ended_at','usage','publishable',...(version==='1.1'?['reason']:[])]);
 identity(Object.fromEntries(identityKeys.map(k=>[k,x[k]])));operationUsage(x.usage);
 if(taskHash(value)!==row.body_sha256||!['1.0','1.1'].includes(String(x.version))||x.version==='1.1'&&!analysisRequestReasons.includes(x.reason as AnalysisRequestReason)||x.request_id!==row.request_id||x.task_id!==row.task_id||x.operation_id!==row.operation_id||x.sequence!==row.sequence||!membershipUuid(x.request_id)||![1,2].includes(Number(x.sequence))||!Number.isSafeInteger(x.epoch)||Number(x.epoch)<0||![0,1].includes(Number(x.calls))||!['reserved','issued','succeeded','temporary_failure','failed','cancelled','unknown'].includes(String(x.status))||typeof x.publishable!=='boolean')fail('INTEGRITY_BLOCKED');
 for(const t of [x.started_at,x.ended_at])if(t!==null&&(typeof t!=='string'||!Number.isFinite(Date.parse(t))))fail('INTEGRITY_BLOCKED');
 return value as AnalysisRequest;
}
/** Project-local operational Adapter; no task authority, model execution or automatic recovery. */
export function createLocalAnalysisRequestLedger(config:{projectRoot:string}):AnalysisRequestLedger{
 const root=realpathSync(config.projectRoot),file=join(root,'.xanthil','desktop','analysis-requests.sqlite');
 function safe(path:string){let current=path;while(current!==root){if(!current.startsWith(root+'/'))fail('INTEGRITY_BLOCKED');if(existsSync(current)&&lstatSync(current).isSymbolicLink())fail('INTEGRITY_BLOCKED');current=dirname(current);}}
 function access<T>(write:boolean,work:(db:DatabaseSync)=>T,missing:()=>T):T{
  for(const suffix of ['','-journal','-wal','-shm'])safe(file+suffix);
  if(!existsSync(file)&&!write)return missing();
  if(write)mkdirSync(dirname(file),{recursive:true});
  const existed=existsSync(file),db=new DatabaseSync(file,{readOnly:!write});
  try{
   if(write)db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=0; PRAGMA synchronous=FULL;');
   if(!existed){db.exec('BEGIN IMMEDIATE');try{db.exec(schema);db.exec('PRAGMA application_id=1480802642; PRAGMA user_version=1;');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
   if(schemaIdentity(db)!==expectedSchema||db.prepare('PRAGMA user_version').get()?.user_version!==1||db.prepare('PRAGMA application_id').get()?.application_id!==1480802642)fail('SCHEMA_UNSUPPORTED');
   for(const row of db.prepare('SELECT * FROM requests').all())decode(row);
   if(!write)return work(db);
   db.exec('BEGIN IMMEDIATE');try{const result=work(db);db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}
  }finally{db.close();}
 }
 const lookup=(db:DatabaseSync,id:string)=>{if(!membershipUuid(id))fail('AUTHORITY_REQUIRED');return decode(db.prepare('SELECT * FROM requests WHERE request_id=?').get(id));};
 const save=(db:DatabaseSync,value:AnalysisRequest)=>{db.prepare('UPDATE requests SET body_json=?,body_sha256=? WHERE request_id=?').run(encodeTask(value),taskHash(value),value.request_id);return value;};
 const control=(db:DatabaseSync,id:string)=>db.prepare('SELECT * FROM controls WHERE task_id=?').get(id)!;
 return {
  pending(){return access(false,db=>db.prepare('SELECT * FROM requests ORDER BY rowid').all().map(decode).filter(r=>['reserved','issued','unknown'].includes(r.status)),()=>[]);},
  read(task_id){if(!membershipUuid(task_id))fail('AUTHORITY_REQUIRED');return access(false,db=>db.prepare('SELECT * FROM requests WHERE task_id=? ORDER BY rowid').all(task_id).map(decode),()=>[]);},
  reserve(raw){const x=identity(raw);return access(true,db=>{
   db.prepare('INSERT OR IGNORE INTO controls VALUES(?,0,0)').run(x.task_id);const c=control(db,x.task_id);if(c.stopped===1)fail('STOPPED');
   const requests=db.prepare('SELECT * FROM requests WHERE task_id=? ORDER BY rowid').all(x.task_id).map(decode),previous=requests.filter(r=>r.operation_id===x.operation_id).at(-1);
   if(previous&&(['revision','scope_sha256','config_sha256','input_sha256'] as const).some(k=>previous[k]!==x[k]))fail('OPERATION_CONFLICT');
   if(db.prepare('SELECT * FROM requests').all().map(decode).some(r=>['reserved','issued','unknown'].includes(r.status)))fail('PHYSICAL_PENDING');
   if(previous?.status==='succeeded')fail('OPERATION_COMPLETE');
   if(previous&&previous.sequence===2)fail('RETRY_EXHAUSTED');
   if(previous&&previous.status!=='temporary_failure'&&!(previous.status==='cancelled'&&Number(c.epoch)>previous.epoch))fail('RETRY_FORBIDDEN');
   const result:AnalysisRequest={...x,version:'1.1',reason:'REQUEST_RESERVED',request_id:randomUUID(),sequence:previous?2:1,epoch:Number(c.epoch),calls:0,status:'reserved',started_at:null,ended_at:null,usage:structuredClone(blank),publishable:false};
   db.prepare('INSERT INTO requests VALUES(?,?,?,?,?,?)').run(result.request_id,x.task_id,x.operation_id,result.sequence,encodeTask(result),taskHash(result));return result;
  },()=>fail('NOT_FOUND'));},
  issue(request_id){return access(true,db=>{const r=lookup(db,request_id),c=control(db,r.task_id);if(c.stopped===1||c.epoch!==r.epoch)fail('STOPPED');if(r.status!=='reserved')fail('COMMAND_CONFLICT');return save(db,{...r,version:'1.1',reason:'REQUEST_ISSUED',status:'issued',calls:1,started_at:new Date().toISOString(),usage:structuredClone(pending)});},()=>fail('NOT_FOUND'));},
  settle(request_id,input){const result=closed(input,['status','usage',...(Object.hasOwn(input,'reason')?['reason']:[])]);if(!['succeeded','temporary_failure','failed','cancelled','unknown'].includes(String(result.status))||result.reason!==undefined&&!analysisRequestReasons.includes(result.reason as AnalysisRequestReason))fail('AUTHORITY_REQUIRED');const usage=operationUsage(result.usage);return access(true,db=>{
   const r=lookup(db,request_id);if(!['issued','unknown'].includes(r.status))fail('COMMAND_CONFLICT');const c=control(db,r.task_id),fenced=c.stopped===1||c.epoch!==r.epoch;
   const status=result.status==='unknown'?'unknown':fenced?'cancelled':result.status as AnalysisRequest['status'];
   const reason:AnalysisRequestReason=fenced&&status!=='unknown'?'STOPPED':result.reason as AnalysisRequestReason??(status==='succeeded'?'REQUEST_SUCCEEDED':status==='unknown'?'REQUEST_UNCONFIRMED':status==='cancelled'?'REQUEST_CANCELLED':'REQUEST_FAILED');
   return save(db,{...r,version:'1.1',reason,status,ended_at:status==='unknown'?null:new Date().toISOString(),usage:reconcileOperationUsage(r.usage,usage),publishable:status==='succeeded'&&!fenced});
  },()=>fail('NOT_FOUND'));},
  stop(task_id){if(!membershipUuid(task_id))fail('AUTHORITY_REQUIRED');access(true,db=>{
   db.prepare('INSERT OR IGNORE INTO controls VALUES(?,0,0)').run(task_id);db.prepare('UPDATE controls SET stopped=1,epoch=epoch+1 WHERE task_id=? AND stopped=0').run(task_id);
   for(const row of db.prepare('SELECT * FROM requests WHERE task_id=?').all(task_id)){const r=decode(row);if(r.status==='reserved')save(db,{...r,version:'1.1',reason:'STOPPED',status:'cancelled',ended_at:new Date().toISOString()});}
  },()=>fail('NOT_FOUND'));},
  resume(task_id){if(!membershipUuid(task_id))fail('AUTHORITY_REQUIRED');access(true,db=>{db.prepare('INSERT OR IGNORE INTO controls VALUES(?,0,0)').run(task_id);if(db.prepare('SELECT * FROM requests WHERE task_id=?').all(task_id).map(decode).some(r=>['reserved','issued','unknown'].includes(r.status)))fail('PHYSICAL_PENDING');db.prepare('UPDATE controls SET stopped=0 WHERE task_id=?').run(task_id);},()=>fail('NOT_FOUND'));},
 };
}
