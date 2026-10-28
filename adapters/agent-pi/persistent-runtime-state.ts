import {DatabaseSync} from 'node:sqlite';
import {existsSync,lstatSync,mkdirSync,realpathSync,openSync,closeSync,writeSync,fstatSync,unlinkSync,chmodSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {RuntimeFault,ModelFailure,ToolOutputFailure,type AuditEvent,type BudgetStore,type UncappedUsage,type UncappedLimits,type SessionStorage,type SessionBinding,type WorkBinding,type JsonObject} from 'pi-agent-runtime';

/** Trusted business authorization; it contains no recovery balance. */
export type PiBusinessWork=Readonly<{work_id:string;command_id:string;task_id:string;config_sha256:string;purposes:readonly string[];recovery_limit:number;valid_until?:string}>;
type Grant=PiBusinessWork&{sdk_configuration?:string;operation?:SessionBinding};
type Account={configuration:string;limits:UncappedLimits;owner:string|null;usage:UncappedUsage;reservations:{owner:string;tokens:number;input:number;output:number;charged:number}[]};
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
const integer=(n:unknown,min=0):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min;
const label=(s:unknown):s is string=>typeof s==='string'&&/^[A-Za-z0-9_.:/-]{1,256}$/.test(s);
function fail(reason:ConstructorParameters<typeof RuntimeFault>[0]):never{throw new RuntimeFault(reason);}

/** New-contract bytes, usage and business associations. SDK alone owns work transitions. */
export function createPiBusinessPersistence(config:{projectRoot:string;isAuthorized:(grant:PiBusinessWork,phase:'bind'|'advance'|'record'|'read')=>boolean}){
 const root=resolve(config.projectRoot);
 if(realpathSync(root)!==root||typeof config.isAuthorized!=='function')fail('AUTHORITY_REQUIRED');
 const directory=join(root,'.juanerai','pi-v060'),file=join(directory,'state.sqlite');
 function safe(){
  for(const target of [file,file+'-journal',file+'-wal',file+'-shm']){
   for(let p=target;;p=dirname(p)){
    let s=lstatSync(p,{throwIfNoEntry:false});
    // COMMIT can unlink a sidecar after native lookup but before metadata returns.
    // Re-observe that pathname once; fresh unsafe/indeterminate metadata still
    // fails the same checks. Never apply this to the main database or ancestors.
    if(p===target&&target!==file&&s?.isFile()&&s.nlink===0)s=lstatSync(p,{throwIfNoEntry:false});
    if(s){if(s.isSymbolicLink()||p===root&&!s.isDirectory()||p===target&&(!s.isFile()||s.nlink!==1))fail('STATE_FAILED');}
    if(p===root)break;
   }
  }
 }
 function access<T>(write:boolean,action:(db:DatabaseSync)=>T):T{
  safe();if(write)mkdirSync(directory,{recursive:true,mode:0o700});safe();
  const db=new DatabaseSync(file,{readOnly:!write});
  try{
   db.exec('PRAGMA busy_timeout=1000;');
   if(write){db.exec('PRAGMA synchronous=FULL;');chmodSync(file,0o600);}
   db.exec(write?'BEGIN IMMEDIATE':'BEGIN');
   if(write)db.exec('CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(kind,id))');
   const result=action(db);db.exec('COMMIT');return result;
  }catch(error){try{db.exec('ROLLBACK');}catch{/* No uncommitted grant escapes. */}if(error instanceof RuntimeFault)throw error;fail('STATE_FAILED');}
  finally{db.close();}
 }
 function get<T>(db:DatabaseSync,kind:string,id:string):T|undefined{
  const row=db.prepare('SELECT body,digest FROM records WHERE kind=? AND id=?').get(kind,id);
  if(!row)return undefined;if(typeof row.body!=='string'||digest(row.body)!==row.digest)fail('STATE_FAILED');
  try{return JSON.parse(row.body) as T;}catch{fail('STATE_FAILED');}
 }
 function put(db:DatabaseSync,kind:string,id:string,value:unknown){
  const body=JSON.stringify(value);if(typeof body!=='string')fail('STATE_FAILED');
  db.prepare('INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body,digest=excluded.digest').run(kind,id,body,digest(body));
 }
 function all<T>(db:DatabaseSync,kind:string):T[]{return db.prepare('SELECT id FROM records WHERE kind=? ORDER BY id').all(kind).map(row=>get<T>(db,kind,String(row.id))!);}
 const key=(task:string,chain:string)=>JSON.stringify([task,chain]);
 function check(grant:Grant,phase:'bind'|'advance'|'record'|'read'){
  if(!config.isAuthorized(grant,phase))fail('AUTHORITY_REQUIRED');
  if((phase==='bind'||phase==='advance')&&grant.valid_until!==undefined&&Date.now()>=Date.parse(grant.valid_until))fail('AUTHORITY_REQUIRED');
 }
 function binding(db:DatabaseSync,b:Readonly<WorkBinding>){
  const g=get<Grant>(db,'grant',key(b.taskId,b.work.chain));
  if(!g||g.work_id!==b.work.ref||g.recovery_limit!==b.work.limit||b.purpose!==undefined&&!g.purposes.includes(b.purpose))fail('AUTHORITY_REQUIRED');
  check(g,b.action==='settle'||b.action==='stop'?'record':'advance');
  if(g.sdk_configuration!==undefined&&g.sdk_configuration!==b.configuration)fail('CONFIGURATION_CHANGED');
  const pinned=get<{work:string;configuration:string}>(db,'task',b.taskId);
  if(pinned&&(pinned.work!==b.work.ref||pinned.configuration!==b.configuration))fail('CONFIGURATION_CHANGED');
  if(b.session){
   // An immutable business command admits one native operation. This is an
   // identity/permission binding, never a model-attempt or recovery counter.
   // Pi's normal turns and auxiliary requests remain inside that operation.
   const operation={sessionId:b.session.sessionId,branch:b.session.branch,operationId:b.session.operationId};
   if(g.operation&&JSON.stringify(g.operation)!==JSON.stringify(operation))fail('AUTHORITY_REQUIRED');
   g.operation=operation;put(db,'grant',key(b.taskId,b.work.chain),g);
   const id=JSON.stringify([b.session.sessionId,b.session.operationId]),old=get<unknown>(db,'operation',id),next={taskId:b.taskId,purpose:b.purpose??null,work:b.work,configurationId:b.configuration};
   if(old&&JSON.stringify(old)!==JSON.stringify(next))fail('STATE_FAILED');put(db,'operation',id,next);
  }
  return g;
 }
 function authorizeWork(db:DatabaseSync,work:{ref:string;chain:string;limit:number}){
  const grants=all<Grant>(db,'grant').filter(g=>g.work_id===work.ref&&g.command_id===work.chain&&g.recovery_limit===work.limit);
  if(!grants.length)fail('AUTHORITY_REQUIRED');for(const g of grants)check(g,'read');
 }
 const budgets:BudgetStore={
  claim:async()=>fail('CAPABILITY_UNAVAILABLE'),
  work:{
   async read(work,signal){if(signal.aborted)fail('CANCELLED');if(!existsSync(file))fail('AUTHORITY_REQUIRED');return access(false,db=>{authorizeWork(db,work);return structuredClone(get<JsonObject>(db,'work',work.ref));});},
   async atomic(b,transition,signal){
    if(signal.aborted&&b.action!=='settle'&&b.action!=='stop')fail('CANCELLED');
    return access(true,db=>{
     const g=binding(db,b),next=transition(structuredClone(get<JsonObject>(db,'work',b.work.ref)));
     if(!next||!next.record||typeof next.record!=='object'||Array.isArray(next.record)||next instanceof Promise)fail('STATE_FAILED');
     put(db,'work',b.work.ref,next.record);put(db,'grant',key(b.taskId,b.work.chain),{...g,sdk_configuration:b.configuration});put(db,'task',b.taskId,{work:b.work.ref,configuration:b.configuration});
     return structuredClone(next.value);
    });
   },
  },
  async claimUncapped(taskId,runId,configuration,limits){
   if(!label(taskId)||!label(runId)||!label(configuration)||limits.cumulative!=='unlimited'||![limits.maxOutputTokens,limits.modelTimeoutMs,limits.toolTimeoutMs,limits.controlTimeoutMs].every(n=>integer(n,1)))fail('INVALID_REQUEST');
   access(true,db=>{
    const grants=all<Grant>(db,'grant').filter(g=>g.task_id===taskId);if(!grants.length)fail('AUTHORITY_REQUIRED');for(const g of grants)check(g,'advance');
    const old=get<Account>(db,'budget',taskId);
    if(old&&(old.configuration!==configuration||JSON.stringify(old.limits)!==JSON.stringify(limits)))fail('CONFIGURATION_CHANGED');
    if(old&&(old.owner!==null||old.reservations.length))fail('TASK_BUSY');
    put(db,'budget',taskId,{...(old??{configuration,limits,usage:{modelCalls:0,toolCalls:0,inputTokens:0,outputTokens:0,reservedOutputTokens:0,resourceUnits:0,activeMs:0},reservations:[]}),owner:runId});
   });
   let released=false;
   const update=<T>(f:(a:Account)=>T)=>access(true,db=>{if(released)fail('STATE_FAILED');const a=get<Account>(db,'budget',taskId);if(!a||a.owner!==runId)fail('STATE_FAILED');const v=f(a);if(Object.values(a.usage).some(n=>!integer(n)))fail('STATE_FAILED');put(db,'budget',taskId,a);return v;});
   const settle=(reserved:number,u:{inputTokens?:number;outputTokens?:number;final:boolean})=>update(a=>{
    if(!integer(reserved,1)||typeof u.final!=='boolean'||u.inputTokens!==undefined&&!integer(u.inputTokens)||u.outputTokens!==undefined&&!integer(u.outputTokens))fail('INVALID_REQUEST');
    const index=a.reservations.findIndex(r=>r.owner===runId&&r.tokens===reserved);if(index<0)fail('STATE_FAILED');const r=a.reservations[index]!;
    if(u.inputTokens!==undefined){if(u.inputTokens<r.input)fail('STATE_FAILED');a.usage.inputTokens+=u.inputTokens-r.input;r.input=u.inputTokens;}
    if(u.outputTokens!==undefined){if(u.outputTokens<r.output)fail('STATE_FAILED');r.output=u.outputTokens;}
    const final=u.final&&u.outputTokens!==undefined,next=final?r.output:Math.max(r.tokens,r.output);a.usage.outputTokens+=next-r.charged;r.charged=next;
    if(final){a.usage.reservedOutputTokens-=r.tokens;a.reservations.splice(index,1);}
   });
   return {
    snapshot:()=>access(false,db=>structuredClone(get<Account>(db,'budget',taskId)!.usage)),
    reserveModel:async()=>fail('INVALID_REQUEST'),
    async reserveModelUpTo(tokens){return update(a=>{if(!integer(tokens,1)||tokens>limits.maxOutputTokens)fail('INVALID_REQUEST');a.reservations.push({owner:runId,tokens,input:0,output:0,charged:tokens});a.usage.modelCalls++;a.usage.resourceUnits++;a.usage.outputTokens+=tokens;a.usage.reservedOutputTokens+=tokens;return tokens;});},
    async recordModelUsage(n,u){settle(n,u);},
    async settleModel(n,out){settle(n,{outputTokens:out,final:true});},
    async settleModelUsage(n,u){settle(n,{...u,final:true});},
    async reserveTool(units){update(a=>{if(!integer(units))fail('INVALID_REQUEST');a.usage.toolCalls++;a.usage.resourceUnits+=units;});},
    async release(activeMs){update(a=>{if(!integer(activeMs))fail('STATE_FAILED');a.usage.activeMs+=activeMs;a.owner=null;});released=true;},
   };
  },
 };
 const audit={async append(event:Readonly<AuditEvent>,signal:AbortSignal){
  const terminal=event.kind==='model.finished'&&event.modelAttemptFact?.terminal===true||event.kind==='tool.finished'&&event.toolOutcome!==undefined;
  if(signal.aborted&&!terminal)fail('CANCELLED');
  const fields=(v:unknown,required:readonly string[],optional:readonly string[]=[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
  const identity=(v:unknown,invocation=false)=>fields(v,invocation?['sessionId','branch','operationId','invocationId','toolCallId']:['sessionId','branch','operationId'])&&Object.values(v as object).every(label);
  const work=(v:unknown)=>fields(v,['ref','chain','limit'])&&label(Reflect.get(v as object,'ref'))&&label(Reflect.get(v as object,'chain'))&&integer(Reflect.get(v as object,'limit'))&&Reflect.get(v as object,'limit')<=3;
  const reason=(v:unknown)=>v===undefined||typeof v==='string'&&/^[A-Z_]{1,80}$/.test(v);
  const attempt=(v:unknown)=>{
   if(!fields(v,['version','work','logicalRequestId','physicalAttemptId','source','kind'],['recovery']))return false;
   const x=v as Record<string,unknown>;return x.version==='1'&&work(x.work)&&label(x.logicalRequestId)&&label(x.physicalAttemptId)&&['assistant','compaction','branch_summary'].includes(String(x.source))&&
    (x.kind==='initial'&&x.recovery===undefined||x.kind==='recovery'&&fields(x.recovery,['logicalRequestId','physicalAttemptId','reason'])&&label(Reflect.get(x.recovery as object,'logicalRequestId'))&&label(Reflect.get(x.recovery as object,'physicalAttemptId'))&&['same-model','fallback','native-retry','overflow','overflow-summary'].includes(Reflect.get(x.recovery as object,'reason')));
  };
  if(!fields(event,['version','taskId','runId','sequence','kind','at','provider','model','contextVersions'],['work','digest','toolName','toolFailed','reason','attempt','failureCategory','modelOutcome','modelAttempt','modelAttemptFact','toolOutcome','toolAdmission','session','invocation'])||event.version!=='1.0'||![event.taskId,event.runId,event.provider,event.model].every(label)||!integer(event.sequence,1)||!Number.isFinite(Date.parse(event.at))||!['run.started','model.admitted','model.finished','tool.admitted','tool.finished','run.finished','session.control','tool.prepared'].includes(event.kind)||!reason(event.reason))fail('AUDIT_FAILED');
  if(!event.contextVersions||Object.entries(event.contextVersions).some(([k,v])=>!label(k)||!(/^[a-f0-9]{64}$/.test(v)||/^\d+(?:\.\d+)*$/.test(v)||/^[a-f0-9-]{36}$/.test(v)))||event.digest!==undefined&&!/^[a-f0-9]{64}$/.test(event.digest)||event.toolName!==undefined&&!label(event.toolName)||event.toolFailed!==undefined&&typeof event.toolFailed!=='boolean'||event.attempt!==undefined&&!integer(event.attempt)||event.failureCategory!==undefined&&!['quota','rate-limit','unavailable','network'].includes(event.failureCategory)||event.work!==undefined&&!work(event.work)||event.session!==undefined&&!identity(event.session)||event.invocation!==undefined&&(!identity(event.invocation,true)||!event.session||['sessionId','branch','operationId'].some(k=>Reflect.get(event.invocation!,k)!==Reflect.get(event.session!,k)))||event.modelAttempt!==undefined&&!attempt(event.modelAttempt))fail('AUDIT_FAILED');
  try{
   if(event.modelOutcome){const o=event.modelOutcome;if(!fields(o,['model','stop','physicalStatus','usageFinal','usage','diagnostic'],['responseModel','category','httpStatus'])||!fields(o.model,['provider','id','protocol'])||!fields(o.usage,['inputTokens','outputTokens'])||o.model.provider!==event.provider||o.model.id!==event.model)fail('AUDIT_FAILED');for(const n of [o.usage.inputTokens,o.usage.outputTokens])if(!(n.kind==='known'?fields(n,['kind','value']):n.kind==='unknown'&&fields(n,['kind'],['reported'])))fail('AUDIT_FAILED');new ModelFailure(o);}
   if(event.modelAttemptFact){const f=event.modelAttemptFact;if(!fields(f,['version','attempt','outcome','terminal','late'],['reason'])||f.version!=='1'||!attempt(f.attempt)||!reason(f.reason)||typeof f.terminal!=='boolean'||typeof f.late!=='boolean'||JSON.stringify(f.outcome)!==JSON.stringify(event.modelOutcome))fail('AUDIT_FAILED');}
   if(event.toolOutcome){const o=event.toolOutcome;if(!fields(o,['name','effect','status','modelOutput','resourceUnits'],['receiptId','invocation','reason','failureCategory','refusal'])||o.name!==event.toolName||!label(o.name)||!reason(o.reason)||o.invocation!==undefined&&(!identity(o.invocation,true)||JSON.stringify(o.invocation)!==JSON.stringify(event.invocation))||o.refusal!==undefined&&(!fields(o.refusal,['code','phase','source'],['exitCode'])||!/^[A-Z][A-Z0-9_.-]{0,63}$/.test(o.refusal.code)||!['host','sdk-native'].includes(o.refusal.source)||(o.refusal.phase==='pre-effect'?o.status!=='not-started'||o.refusal.exitCode!==undefined:o.refusal.phase!=='post-effect'||o.status!=='completed'||o.refusal.source!=='sdk-native'||!Number.isSafeInteger(o.refusal.exitCode)||o.refusal.exitCode===0)))fail('AUDIT_FAILED');new ToolOutputFailure(o);}
   if(event.toolAdmission){const f=event.toolAdmission;if(event.kind!=='tool.prepared'||!fields(f,['version','taskId','runId','callId','name','policyVersion','viewVersion','viewDigest','rawArgumentsDigest','disposition','correctionsUsed','terminal'],['purpose','session','code'])||f.version!=='1'||f.taskId!==event.taskId||f.runId!==event.runId||f.name!==event.toolName||![f.callId,f.name,f.policyVersion,f.viewVersion].every(label)||f.purpose!==undefined&&!label(f.purpose)||![f.viewDigest,f.rawArgumentsDigest].every(v=>/^[a-f0-9]{64}$/.test(v))||!integer(f.correctionsUsed)||typeof f.terminal!=='boolean'||!['ready','rejected','deferred'].includes(f.disposition)||!reason(f.code)||f.session!==undefined&&!identity(f.session))fail('AUDIT_FAILED');}
  }catch{fail('AUDIT_FAILED');}
  access(true,db=>{
   const grants=all<Grant>(db,'grant').filter(g=>g.task_id===event.taskId);if(!grants.length)fail('AUDIT_FAILED');for(const g of grants)check(g,'record');
   const id=JSON.stringify([event.runId,event.sequence]),old=get<AuditEvent>(db,'audit',id);
   if(old&&JSON.stringify(old)!==JSON.stringify(event))fail('AUDIT_FAILED');if(!old)put(db,'audit',id,event);
  });
 }};
 function storage(authorize:SessionStorage['authorize'],owner:string):SessionStorage{
  if(!label(owner))fail('INVALID_REQUEST');
  const sessions=join(directory,'sessions',owner);
  return {cwd:root,directory:sessions,policyVersion:'juanerai-pi-v060',authorize,async acquireWriter(signal){
   if(signal.aborted)fail('CANCELLED');safe();mkdirSync(directory,{recursive:true,mode:0o700});
   const lock=join(directory,owner+'.writer.lock');let fd:number;
   try{fd=openSync(lock,'wx',0o600);}catch{fail('TASK_BUSY');}
   const held=fstatSync(fd);writeSync(fd,JSON.stringify({pid:process.pid}));let released=false;
   return {async release(){if(released)return;safe();const actual=lstatSync(lock);if(actual.isSymbolicLink()||actual.ino!==held.ino||actual.dev!==held.dev)fail('STATE_FAILED');unlinkSync(lock);closeSync(fd);released=true;}};
  }};
 }
 return Object.freeze({budgets,audit,sessionStorage:storage,
  bindBusinessWork(g:PiBusinessWork){
   if(![g.work_id,g.command_id,g.task_id].every(label)||!/^[a-f0-9]{64}$/.test(g.config_sha256)||(!integer(g.recovery_limit)||g.recovery_limit>3)||!Array.isArray(g.purposes)||!g.purposes.length||new Set(g.purposes).size!==g.purposes.length||g.purposes.some(p=>!label(p))||g.valid_until!==undefined&&!Number.isFinite(Date.parse(g.valid_until)))fail('INVALID_REQUEST');check(g,'bind');
   access(true,db=>{const id=key(g.task_id,g.command_id),old=get<Grant>(db,'grant',id);if(old){const {sdk_configuration,operation,...original}=old;void sdk_configuration;void operation;if(JSON.stringify(original)!==JSON.stringify(g))fail('CONFIGURATION_CHANGED');return;}if(all<Grant>(db,'grant').some(x=>x.task_id===g.task_id&&(x.work_id!==g.work_id||x.config_sha256!==g.config_sha256)||x.work_id===g.work_id&&x.recovery_limit!==g.recovery_limit))fail('CONFIGURATION_CHANGED');put(db,'grant',id,g);});
  },
  async bindOperation(input:SessionBinding&{taskId:string;purpose?:string;work:{ref:string;chain:string;limit:number};configurationId:string},signal:AbortSignal){
   if(signal.aborted)fail('CANCELLED');access(true,db=>{binding(db,{work:input.work,taskId:input.taskId,purpose:input.purpose,runId:'native-binding',configuration:input.configurationId,session:input,action:'bind'});});
  },
  selectSession(task:string,purpose:string,session:string,previous?:string){if(![task,purpose,session,...(previous?[previous]:[])].every(label))fail('INVALID_REQUEST');access(true,db=>{if(!all<Grant>(db,'grant').some(g=>g.task_id===task&&g.purposes.includes(purpose)))fail('AUTHORITY_REQUIRED');const id=key(task,purpose),old=get<string>(db,'selection',id);if(previous?old!==previous:old&&old!==session)fail('CONFIGURATION_CHANGED');put(db,'selection',id,session);});},
  readWorkTasks:(work:string)=>existsSync(file)?access(false,db=>{const grants=all<Grant>(db,'grant').filter(g=>g.work_id===work);for(const grant of grants)check(grant,'read');return [...new Set(grants.map(g=>g.task_id))].map(task_id=>({task_id,purposes:[...new Set(grants.filter(g=>g.task_id===task_id).flatMap(g=>g.purposes))]}));}):[],
  readSession:(task:string,purpose:string)=>existsSync(file)?access(false,db=>get<string>(db,'selection',key(task,purpose))):undefined,
  readAccounting:(task:string)=>existsSync(file)?access(false,db=>structuredClone(get<Account>(db,'budget',task))):undefined,
  readAudit:(task:string)=>existsSync(file)?access(false,db=>all<AuditEvent>(db,'audit').filter(e=>e.taskId===task)):[],
  readWorkAccounting:(work:string)=>existsSync(file)?access(false,db=>{const grants=all<Grant>(db,'grant').filter(g=>g.work_id===work);if(!grants.length)fail('AUTHORITY_REQUIRED');for(const grant of grants)check(grant,'read');return [...new Set(grants.map(g=>g.task_id))].flatMap(task=>{const account=get<Account>(db,'budget',task);return account?[structuredClone(account)]:[];});}):[],
  readWorkAudit:(work:string)=>existsSync(file)?access(false,db=>{const grants=all<Grant>(db,'grant').filter(g=>g.work_id===work);if(!grants.length)fail('AUTHORITY_REQUIRED');for(const grant of grants)check(grant,'read');const tasks=new Set(grants.map(g=>g.task_id));return all<AuditEvent>(db,'audit').filter(event=>tasks.has(event.taskId));}):[],
 });
}
