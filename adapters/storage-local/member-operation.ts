import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {encodeTask,taskHash} from '../../packages/product-core/member-task.ts';
import {desktopRuleFailure as fail} from '../../packages/product-core/xanthil-desktop-decision-case.ts';
import {operationPolicy,operationUsage,operationDigest,reconcileOperationUsage,type OperationUsage,type OperationExecution} from '../../packages/product-core/member-operation.ts';

type Row=Record<string,string|number|bigint|Uint8Array|null>;
type Access=<T>(write:boolean,work:(db:DatabaseSync)=>T)=>T;
const blank:OperationUsage={input_tokens:{kind:'known',value:'0'},output_tokens:{kind:'known',value:'0'},active_ms:{kind:'known',value:'0'},wait_ms:{kind:'known',value:'0'}};
/** A reservation has not escaped the process. Issued/unresolved work remains occupied. */
export function fenceMemberOperations(db:DatabaseSync,taskId:string){
 if(db.prepare('PRAGMA user_version').get()?.user_version!==120)return;
 db.prepare('UPDATE membership_operation_grants SET revoked=1 WHERE task_id=?').run(taskId);
 db.prepare("UPDATE membership_operation_usage SET phase='settled',outcome='stopped' WHERE task_id=? AND phase='reserved'").run(taskId);
}
function task(db:DatabaseSync,id:unknown){if(!membershipUuid(id))fail();const row=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(id);if(!row)fail('NOT_FOUND');return row;}
function grant(db:DatabaseSync,taskId:string,grantId:unknown){if(!membershipUuid(grantId))fail();const row=db.prepare('SELECT * FROM membership_operation_grants WHERE task_id=? AND grant_id=?').get(taskId,grantId);if(!row)fail('AUTHORITY_REQUIRED');return row;}
function active(db:DatabaseSync,t:Row,g:Row){if(g.revoked!==0||g.epoch!==t.epoch||['stopped','interrupted','closed'].includes(String(t.status))||Date.now()>=Date.parse(String(g.expires_at)))fail('AUTHORITY_REQUIRED');if(taskHash(operationPolicy(JSON.parse(String(g.policy_json))))!==g.policy_sha256)fail('INTEGRITY_BLOCKED');}
function execution(db:DatabaseSync,t:Row,id:unknown){if(!membershipUuid(id))fail();const row=db.prepare('SELECT * FROM membership_operation_usage WHERE task_id=? AND execution_id=?').get(String(t.task_id),id);if(!row)fail('NOT_FOUND');return row;}
function token<const T extends string>(value:unknown,allowed:readonly T[]):T{if(typeof value!=='string'||!allowed.includes(value as T))fail('INTEGRITY_BLOCKED');return value as T;}
function projection(r:Row):OperationExecution{
 for(const key of ['execution_id','task_id','operation_id','grant_id'])if(!membershipUuid(r[key]))fail('INTEGRITY_BLOCKED');
 return {execution_id:String(r.execution_id),task_id:String(r.task_id),operation_id:String(r.operation_id),execution_index:Number(r.execution_index),grant_id:String(r.grant_id),epoch:Number(r.epoch),phase:token(r.phase,['reserved','issued','unresolved','settled']),outcome:r.outcome===null?null:token(r.outcome,['succeeded','temporary_failure','conversion_failure','permanent_failure','stopped']),calls:Number(r.calls),local_runs:Number(r.local_runs),usage:operationUsage(JSON.parse(String(r.usage_json)))};
}

export function assertMemberOperations(db:DatabaseSync){
 for(const row of db.prepare('SELECT * FROM membership_browser_receipts').all()){
  const value=JSON.parse(String(row.body_json));
  if(['browser_review_opened','browser_review_saved'].includes(value?.kind)){
   const r=closed(value,['version','kind','command_id','task_id','input_sha256','review_id','review_version','review_sha256']);
   const review=db.prepare('SELECT body_json FROM membership_reviews WHERE task_id=? AND review_id=? AND version=?').get(String(row.task_id),String(r.review_id),Number(r.review_version));
   if(r.version!=='1.0'||!membershipUuid(r.command_id)||r.command_id!==row.command_id||r.task_id!==row.task_id||!membershipUuid(r.review_id)||!Number.isSafeInteger(r.review_version)||Number(r.review_version)<1||!operationDigest(r.input_sha256)||!operationDigest(r.review_sha256)||!review||JSON.parse(String(review.body_json)).sha256!==r.review_sha256||taskHash(r)!==row.body_sha256)fail('INTEGRITY_BLOCKED');continue;
  }
  const r=closed(value,['version','kind','command_id','task_id','epoch','status','at']);
  const owner=db.prepare('SELECT epoch FROM membership_tasks WHERE task_id=?').get(String(row.task_id));
  if(r.version!=='1.0'||r.kind!=='browser_stop'||!membershipUuid(r.command_id)||r.command_id!==row.command_id||r.task_id!==row.task_id||!Number.isSafeInteger(r.epoch)||Number(r.epoch)<1||!owner||Number(r.epoch)>Number(owner.epoch)||!['stopped','closed'].includes(String(r.status))||!Number.isFinite(Date.parse(String(r.at)))||taskHash(r)!==row.body_sha256)fail('INTEGRITY_BLOCKED');
 }
 for(const g of db.prepare('SELECT * FROM membership_operation_grants').all())if(taskHash(operationPolicy(JSON.parse(String(g.policy_json))))!==g.policy_sha256||!operationDigest(g.scope_sha256)||!Number.isFinite(Date.parse(String(g.expires_at))))fail('INTEGRITY_BLOCKED');
 for(const op of db.prepare('SELECT * FROM membership_operations').all())if(op.logical_key!==taskHash({kind:op.kind,stage:op.stage,input_sha256:op.input_sha256,scope_sha256:op.scope_sha256})||!operationDigest(op.input_sha256)||!operationDigest(op.scope_sha256))fail('INTEGRITY_BLOCKED');
 for(const u of db.prepare('SELECT * FROM membership_operation_usage').all())if(taskHash(operationUsage(JSON.parse(String(u.usage_json))))!==u.usage_sha256)fail('INTEGRITY_BLOCKED');
 for(const run of db.prepare("SELECT r.*,l.execution_id,l.plan_sha256 FROM analysis_runs r LEFT JOIN membership_analysis_operations l ON l.run_id=r.run_id WHERE r.run_contract_version='5.0'").all()){
  const stored=db.prepare('SELECT p.body_json,p.body_sha256 FROM membership_run_plans l JOIN membership_plans p ON p.plan_id=l.plan_id WHERE l.run_id=?').get(String(run.run_id)),usage=db.prepare('SELECT u.*,o.kind,o.stage,o.input_sha256 FROM membership_operation_usage u JOIN membership_operations o ON o.operation_id=u.operation_id WHERE u.execution_id=?').get(String(run.execution_id));
  if(!stored||!usage||stored.body_sha256!==run.plan_sha256||usage.kind!=='analysis'||usage.stage!=='calculate')fail('INTEGRITY_BLOCKED');const plan=JSON.parse(String(stored.body_json));
  if(plan.version!=='2.0'||usage.task_id!==plan.authority.task_id||usage.grant_id!==plan.authority.grant_id||String(usage.epoch)!==plan.authority.epoch||usage.calls!==0||usage.local_runs!==1||usage.input_sha256!==taskHash({preparation_sha256:plan.preparation.sha256,contract_sha256:plan.contract_sha256,intent:plan.intent,methods:plan.methods,code_identity:run.code_identity}))fail('INTEGRITY_BLOCKED');
 }
 if(db.prepare('PRAGMA foreign_key_check').all().length)fail('INTEGRITY_BLOCKED');
}

export function reserveMemberOperation(db:DatabaseSync,input:unknown){const x=closed(input,['task_id','grant_id','kind','stage','input_sha256']);
  if(!['model','preparation','analysis'].includes(String(x.kind))||typeof x.stage!=='string'||!(x.kind==='model'?['clarify','generate_preparation','correct_preparation','explain']:x.kind==='preparation'?['prepare']:['calculate']).includes(x.stage)||!operationDigest(x.input_sha256))fail();
  const t=task(db,x.task_id),g=grant(db,String(t.task_id),x.grant_id);active(db,t,g);
   const key={kind:x.kind,stage:x.stage,input_sha256:x.input_sha256,scope_sha256:g.scope_sha256},logical=taskHash(key);
   const old=db.prepare('SELECT * FROM membership_operations WHERE task_id=? AND logical_key=?').get(String(t.task_id),logical);
   const latest=old&&db.prepare('SELECT * FROM membership_operation_usage WHERE operation_id=? ORDER BY execution_index DESC LIMIT 1').get(String(old.operation_id));
   if(latest?.phase==='settled'&&latest.outcome==='succeeded')return projection(latest);
   if(db.prepare("SELECT execution_id FROM membership_operation_usage WHERE phase IN ('reserved','issued','unresolved')").get())fail('PHYSICAL_PENDING');
   if(latest&&(x.kind==='analysis'||latest.execution_index===1||latest.outcome!==(x.kind==='model'?'temporary_failure':'conversion_failure')))fail('RETRY_EXHAUSTED');
   const operation_id=old?String(old.operation_id):randomUUID(),execution_id=randomUUID(),index=latest?1:0;
   if(!old)db.prepare('INSERT INTO membership_operations VALUES(?,?,?,?,?,?,?)').run(operation_id,String(t.task_id),logical,String(x.kind),String(x.stage),String(x.input_sha256),String(g.scope_sha256));
   db.prepare("INSERT INTO membership_operation_usage VALUES(?,?,?,?,?,?,'reserved',NULL,0,0,?,?)").run(execution_id,String(t.task_id),operation_id,index,String(g.grant_id),Number(t.epoch),encodeTask(blank),taskHash(blank));
   return projection(execution(db,t,execution_id));
}

export function issueMemberOperation(db:DatabaseSync,input:unknown){const x=closed(input,['task_id','execution_id']);const t=task(db,x.task_id),u=execution(db,t,x.execution_id),g=grant(db,String(t.task_id),u.grant_id);active(db,t,g);if(u.phase!=='reserved'||u.epoch!==t.epoch)fail('PHYSICAL_PENDING');
  const op=db.prepare('SELECT kind FROM membership_operations WHERE operation_id=?').get(String(u.operation_id))!;
  const pending:OperationUsage={input_tokens:{kind:'unknown',reason:'issued'},output_tokens:{kind:'unknown',reason:'issued'},active_ms:{kind:'unknown',reason:'issued'},wait_ms:{kind:'unknown',reason:'issued'}};
  db.prepare("UPDATE membership_operation_usage SET phase='issued',calls=?,local_runs=?,usage_json=?,usage_sha256=? WHERE execution_id=?").run(op.kind==='model'?1:0,op.kind==='preparation'||op.kind==='analysis'?1:0,encodeTask(pending),taskHash(pending),String(u.execution_id));return projection(execution(db,t,u.execution_id));
}

export function settleMemberOperation(db:DatabaseSync,input:unknown){const x=closed(input,['task_id','execution_id','physical','outcome','usage']),usage=operationUsage(x.usage);
  if(!['settled','unresolved'].includes(String(x.physical))||!['succeeded','temporary_failure','conversion_failure','permanent_failure','stopped'].includes(String(x.outcome)))fail();
  const t=task(db,x.task_id),u=execution(db,t,x.execution_id),g=grant(db,String(t.task_id),u.grant_id);if(!['issued','unresolved'].includes(String(u.phase)))fail('COMMAND_CONFLICT');
   const fenced=t.epoch!==u.epoch||g.revoked!==0||['stopped','interrupted','closed'].includes(String(t.status))||Date.now()>=Date.parse(String(g.expires_at));
   const outcome=fenced?'stopped':String(x.outcome);
   const reconciled=reconcileOperationUsage(operationUsage(JSON.parse(String(u.usage_json))),usage);
   db.prepare('UPDATE membership_operation_usage SET phase=?,outcome=?,usage_json=?,usage_sha256=? WHERE execution_id=?').run(String(x.physical),outcome,encodeTask(reconciled),taskHash(reconciled),String(u.execution_id));return projection(execution(db,t,u.execution_id));
}

/** Actual same-database admission/settlement. No model or Python execution here. */
export function memberOperationMethods(access:Access){return {
 async authorizeOperations(input:unknown){const x=closed(input,['task_id','policy','scope_sha256','expires_at']),policy=operationPolicy(x.policy);
  if(!operationDigest(x.scope_sha256)||typeof x.expires_at!=='string'||!Number.isFinite(Date.parse(x.expires_at))||Date.parse(x.expires_at)<=Date.now())fail('AUTHORITY_REQUIRED');
  return access(true,db=>{const t=task(db,x.task_id);if(t.status==='closed')fail('AUTHORITY_REQUIRED');
   const grant_id=randomUUID();db.prepare('UPDATE membership_operation_grants SET revoked=1 WHERE task_id=?').run(String(t.task_id));
   db.prepare('INSERT INTO membership_operation_grants VALUES(?,?,?,?,?,?,?,0)').run(grant_id,String(t.task_id),Number(t.epoch),String(x.scope_sha256),encodeTask(policy),taskHash(policy),String(x.expires_at));
   db.prepare("UPDATE membership_tasks SET status='idle',row_version=row_version+1 WHERE task_id=?").run(String(t.task_id));
   return {grant_id,task_id:String(t.task_id),epoch:Number(t.epoch),scope_sha256:x.scope_sha256,policy,expires_at:x.expires_at};});
 },
 async reserveOperation(input:unknown){return access(true,db=>reserveMemberOperation(db,input));},
 async issueOperation(input:unknown){return access(true,db=>issueMemberOperation(db,input));},
 async settleOperation(input:unknown){return access(true,db=>settleMemberOperation(db,input));},
 async readOperations(input:unknown){const x=closed(input,['task_id']);return access(false,db=>{const t=task(db,x.task_id),operations=db.prepare('SELECT * FROM membership_operations WHERE task_id=? ORDER BY rowid').all(String(t.task_id)),usage=db.prepare('SELECT * FROM membership_operation_usage WHERE task_id=? ORDER BY rowid').all(String(t.task_id)).map(projection);
  const totals={calls:'0',local_runs:'0',unresolved:0,input_tokens:{known:'0',unknown:0},output_tokens:{known:'0',unknown:0},active_ms:{known:'0',unknown:0},wait_ms:{known:'0',unknown:0}};
  for(const u of usage){totals.calls=String(BigInt(totals.calls)+BigInt(String(u.calls)));totals.local_runs=String(BigInt(totals.local_runs)+BigInt(String(u.local_runs)));if(u.phase!=='settled')totals.unresolved++;for(const key of ['input_tokens','output_tokens','active_ms','wait_ms'] as const){const m=u.usage[key];if(m.kind==='unknown')totals[key].unknown++;totals[key].known=String(BigInt(totals[key].known)+BigInt(m.kind==='known'?m.value:m.known_lower_bound??'0'));}}
  return {operations,usage,totals};});}
};}
