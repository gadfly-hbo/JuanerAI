import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {RuntimeFault,ModelFailure,type ModelAttempt,type ModelAttemptFact,type AuditEvent} from 'pi-agent-runtime';
import {isDeepStrictEqual} from 'node:util';
import type {AnalysisBusinessWork,OpenAnalysisRun} from '../../packages/ports/open-analysis-runtime.ts';

type Binding=Readonly<{task_id:string;operation_id:string;scope_sha256:string;config_sha256:string;grant_id:string}>;
type Attempt={ref:Readonly<ModelAttempt>;run_id:string;allowed:boolean;phase:'authorized'|'finished'|'not-sent'|'unknown'|'conflict';fact?:Readonly<ModelAttemptFact>};
type Work={version:'1'|'2';binding:Binding;created_at:number;deadline_at:number|null;runs:string[];blocked:boolean;attempts:Record<string,Attempt>;recovery:{physical_id:string;state:'reserved'|'spent'}|null;code_draft?:{text:string;sha256:string;version:number}};
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const fault=():never=>{throw new RuntimeFault('STATE_FAILED');};
/** Product command authority in the existing operational transaction; no model loop. */
export function createBusinessWorkState(access:<T>(write:boolean,operation:(db:DatabaseSync)=>T)=>T,policy?:'unified-v1'){
 if(policy!==undefined&&policy!=='unified-v1')throw new RuntimeFault('INVALID_REQUEST');
 const table=(db:DatabaseSync)=>!!db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name='business_work_v1'").get();
 function read(db:DatabaseSync,id:string):Work|undefined{
  if(!table(db))return;
  const row=db.prepare('SELECT body,digest FROM business_work_v1 WHERE work_id=?').get(id);if(!row)return;
  if(typeof row.body!=='string'||digest(row.body)!==row.digest)throw new RuntimeFault('STATE_FAILED');
  const value=JSON.parse(row.body) as Work;
  if(!['1','2'].includes(value.version)||!value.binding||!Array.isArray(value.runs)||typeof value.blocked!=='boolean'||!value.attempts||typeof value.attempts!=='object'||Array.isArray(value.attempts)||!Number.isSafeInteger(value.created_at)||(value.version==='1'?value.deadline_at!==value.created_at+300000:value.deadline_at!==null))fault();
  return value;
 }
 function save(db:DatabaseSync,id:string,work:Work){const body=JSON.stringify(work);db.prepare('INSERT INTO business_work_v1 VALUES(?,?,?,?) ON CONFLICT(work_id) DO UPDATE SET body=excluded.body,digest=excluded.digest').run(id,work.binding.task_id,body,digest(body));}
 function existing(db:DatabaseSync,id:string):Work{return read(db,id)??fault();}
 function open(work:Work){return !work.blocked&&(work.deadline_at===null||Date.now()<work.deadline_at)&&!Object.values(work.attempts).some(a=>['authorized','unknown','conflict'].includes(a.phase));}
 function unconfirmed(db:DatabaseSync,task:string,except?:string){if(!table(db))return false;return db.prepare('SELECT work_id FROM business_work_v1 WHERE task_id=?').all(task).some(row=>{const id=String(row.work_id);if(id===except)return false;const work=existing(db,id);return work.blocked||Object.values(work.attempts).some(a=>['authorized','unknown','conflict'].includes(a.phase));});}
 function validRef(ref:Readonly<ModelAttempt>){
  const fields=(o:object,keys:string[])=>Object.keys(o).sort().join(',')===keys.sort().join(',');
  if(!ref||ref.version!=='1'||!/^[a-f0-9]{64}$/.test(ref.logicalRequestId)||!/^[a-f0-9-]{36}$/.test(ref.physicalAttemptId)||!['assistant','compaction','branch_summary'].includes(ref.source)||!['initial','recovery'].includes(ref.kind))fault();
  if(ref.kind==='initial'){if(!fields(ref,['version','logicalRequestId','physicalAttemptId','source','kind']))fault();}
  else if(!fields(ref,['version','logicalRequestId','physicalAttemptId','source','kind','recovery'])||!ref.recovery||!fields(ref.recovery,['logicalRequestId','physicalAttemptId','reason'])||!/^[a-f0-9]{64}$/.test(ref.recovery.logicalRequestId)||!/^[a-f0-9-]{36}$/.test(ref.recovery.physicalAttemptId)||!['same-model','fallback','native-retry','overflow','overflow-summary'].includes(ref.recovery.reason))fault();
 }
 return {
  read(id:string){return access(false,db=>structuredClone(existing(db,id)));},
  hasUnconfirmed(task:string){return access(false,db=>unconfirmed(db,task));},
  codeDraft(id:string){return access(false,db=>{const value=existing(db,id).code_draft;if(!value)return; if(typeof value.text!=='string'||Buffer.byteLength(value.text)>65536||digest(value.text)!==value.sha256||!Number.isSafeInteger(value.version)||value.version<1)fault();return Buffer.from(value.text,'utf8');});},
  writeCodeDraft(id:string,bytes:Uint8Array){return access(true,db=>{const work=existing(db,id);if(!open(work)||unconfirmed(db,work.binding.task_id,id))throw new RuntimeFault('AUTHORITY_REQUIRED');if(bytes.byteLength>65536)fault();const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);work.code_draft={text,sha256:digest(text),version:(work.code_draft?.version??0)+1};save(db,id,work);});},
  findRun(task:string,run:string){return access(false,db=>{if(!table(db))return;for(const row of db.prepare('SELECT work_id FROM business_work_v1 WHERE task_id=?').all(task)){const id=String(row.work_id),work=existing(db,id);if(work.runs.includes(run))return id;}});},
  allowed(id:string){return access(false,db=>{const work=existing(db,id);return open(work)&&!unconfirmed(db,work.binding.task_id,id);});},
  authorize(id:string,task:string,run:string,ref:Readonly<ModelAttempt>){validRef(ref);return access(true,db=>{
   const work=existing(db,id);if(work.binding.task_id!==task||!work.runs.includes(run))return false;
   const key=ref.physicalAttemptId,prior=work.attempts[key];
   if(prior){if(!isDeepStrictEqual(prior.ref,ref)||prior.run_id!==run){work.blocked=true;prior.phase='conflict';save(db,id,work);return false;}return !work.blocked&&(work.deadline_at===null||Date.now()<work.deadline_at)&&prior.allowed&&prior.phase==='authorized';}
   if(!open(work)||unconfirmed(db,task,id))return false;
   if(ref.kind==='recovery'){const parent=work.attempts[ref.recovery.physicalAttemptId];if(work.recovery||!parent||!parent.allowed||!['finished','not-sent'].includes(parent.phase)||parent.ref.logicalRequestId!==ref.recovery.logicalRequestId)return false;work.recovery={physical_id:key,state:'reserved'};}
   work.attempts[key]={ref:structuredClone(ref),run_id:run,allowed:true,phase:'authorized'};save(db,id,work);return true;
  });},
  record(db:DatabaseSync,id:string,event:Readonly<AuditEvent>){
   const work=existing(db,id);if(work.binding.task_id!==event.taskId)fault();
   if(!work.runs.includes(event.runId))work.runs.push(event.runId);
   if(event.modelAttempt)validRef(event.modelAttempt);
   const fact=event.modelAttemptFact;
   if(fact){
    const keys=Object.keys(fact);if(keys.some(k=>!['version','attempt','outcome','terminal','late','reason'].includes(k))||fact.version!=='1'||typeof fact.terminal!=='boolean'||typeof fact.late!=='boolean'||!fact.attempt||!fact.outcome||!isDeepStrictEqual(event.modelAttempt,fact.attempt)||!isDeepStrictEqual(event.modelOutcome,fact.outcome))fault();
    validRef(fact.attempt);new ModelFailure(fact.outcome);
    const key=fact.attempt.physicalAttemptId,prior=work.attempts[key];
    if(prior&&(!isDeepStrictEqual(prior.ref,fact.attempt)||prior.run_id!==event.runId)){work.blocked=true;prior.phase='conflict';save(db,id,work);return;}
    const row=prior??(work.attempts[key]={ref:structuredClone(fact.attempt),run_id:event.runId,allowed:false,phase:'authorized'});
    if(fact.terminal){
     if(row.fact&&isDeepStrictEqual(row.fact,fact)){save(db,id,work);return;}
     const o=fact.outcome,zero=o.usageFinal&&o.usage.inputTokens.kind==='known'&&o.usage.inputTokens.value===0&&o.usage.outputTokens.kind==='known'&&o.usage.outputTokens.value===0;
     if(row.fact&&['finished','not-sent','conflict'].includes(row.phase)){row.phase='conflict';work.blocked=true;}
     else if(o.physicalStatus==='not-sent'&&zero&&!fact.late){row.phase='not-sent';if(work.recovery?.physical_id===key&&work.recovery.state==='reserved')work.recovery=null;}
     else if(o.physicalStatus==='response-received'&&!fact.late){row.phase='finished';if(work.recovery?.physical_id===key)work.recovery.state='spent';}
     else{row.phase='unknown';work.blocked=true;}
     row.fact=structuredClone(fact);
    }
   }
   save(db,id,work);
  },
  begin(input:Readonly<{identity:OpenAnalysisRun['identity'];business_operation_id?:string}>):AnalysisBusinessWork{
   const binding:Binding={task_id:input.identity.task_id,operation_id:input.business_operation_id??input.identity.operation_id,scope_sha256:input.identity.scope_sha256,config_sha256:input.identity.config_sha256,grant_id:input.identity.grant_id};
   if(!Object.values(binding).every(v=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,256}$/.test(v)))fault();
   const id=digest(JSON.stringify([binding.task_id,binding.operation_id]));
   return access(true,db=>{
    const previous=read(db,id);
    if(previous){if(JSON.stringify(previous.binding)!==JSON.stringify(binding))fault();if(previous.version!==(policy?'2':'1'))throw new RuntimeFault('CONFIGURATION_CHANGED');return previous.version==='1'?{version:'1',id,deadline_at:previous.deadline_at!}:{version:'2',id,deadline_at:null};}
    const selected=table(db)?db.prepare('SELECT body,digest FROM business_work_v1 WHERE task_id=?').all(binding.task_id):[];
    if(!selected.length&&(db.prepare('SELECT task_id FROM budgets WHERE task_id=?').get(binding.task_id)||db.prepare('SELECT task_id FROM native_sessions WHERE task_id=?').get(binding.task_id)))throw new RuntimeFault('CONFIGURATION_CHANGED');
    for(const row of selected){if(typeof row.body!=='string'||digest(row.body)!==row.digest||JSON.parse(row.body).binding.config_sha256!==binding.config_sha256)fault();}
    if(!table(db))db.exec('CREATE TABLE business_work_v1(work_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL)');
    const created_at=Date.now(),work:Work={version:policy?'2':'1',binding,created_at,deadline_at:policy?null:created_at+300000,runs:[],blocked:false,attempts:{},recovery:null};save(db,id,work);return work.version==='1'?{version:'1',id,deadline_at:work.deadline_at!}:{version:'2',id,deadline_at:null};
   });
  },
 };
}
