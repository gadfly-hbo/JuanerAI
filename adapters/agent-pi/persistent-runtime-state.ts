import {DatabaseSync} from 'node:sqlite';
import {existsSync,lstatSync,mkdirSync,realpathSync,openSync,closeSync,writeSync,fstatSync,unlinkSync,readFileSync,constants} from 'node:fs';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {RuntimeFault,type AuditEvent,type AuditSink,type BudgetStore,type Limits,type Usage,type ConversationCheckpoint,type SessionBinding,type SessionStorage,type UncappedLimits,type UncappedBudgetLease,type UncappedUsage} from 'pi-agent-runtime';

export const approvedUncappedAnalysisLimits:Readonly<UncappedLimits>=Object.freeze({cumulative:'unlimited',maxOutputTokens:4096,modelTimeoutMs:30000,toolTimeoutMs:60000,controlTimeoutMs:10000});
export const approvedAnalysisLimits:Readonly<Limits>=Object.freeze({modelCalls:1000,toolCalls:5000,outputTokens:4000000,wallTimeMs:18000000});
type ConfigurationMigration={from:string;to:string;approval:string;reconciliation:string;accounting:string};
type WriterReceipt={pid:number;created_at:string;ino:number;dev:number;body:string};
type InterruptedStop={businessIdentity:string;owner:string;controlOwner:string;approval:string;reconciliation:string;accounting:string;lock:WriterReceipt;activeTime:{status:'unknown';earliest_started_at:string;observed_dead_at:string};outcome:'pending'|'stopped';terminal:string|null};
type State={configuration:string;limits:Limits|UncappedLimits;owner:string|null;usage:Usage;reservations:{owner:string;tokens:number}[];historicalFingerprint?:string;configurationHistory?:ConfigurationMigration[];interruptedStops?:InterruptedStop[]};
type HistoricalUsage={fingerprint:string;reconciled:boolean;usage:Usage};
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const schema='CREATE TABLE budgets(task_id TEXT PRIMARY KEY,body TEXT NOT NULL,digest TEXT NOT NULL)';
const integer=(n:unknown,min=0):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min;
function limitsValid(v:Limits){return v&&integer(v.modelCalls,1)&&integer(v.toolCalls)&&integer(v.outputTokens,1)&&integer(v.wallTimeMs,1)&&v.wallTimeMs<=2147483647&&(v.resourceUnits===undefined||integer(v.resourceUnits));}
function isUncapped(v:Limits|UncappedLimits):v is UncappedLimits{return 'cumulative' in v&&v.cumulative==='unlimited';}
function uncappedValid(v:UncappedLimits){return v&&Object.keys(v).length===5&&v.cumulative==='unlimited'&&['maxOutputTokens','modelTimeoutMs','toolTimeoutMs','controlTimeoutMs'].every(k=>integer(Reflect.get(v,k),1)&&Reflect.get(v,k)<=2147483647);}
function fault(reason:ConstructorParameters<typeof RuntimeFault>[0]):never{throw new RuntimeFault(reason);}

/** Atomic project-local SDK accounting. Active leases never expire or auto-resume. */
export function createPersistentRuntimeState(config:{projectRoot:string;historicalUsage?:(task:string)=>HistoricalUsage}){
 const root=realpathSync(config.projectRoot),file=join(root,'.xanthil','desktop','pi-runtime.sqlite');
 function safe(){for(const suffix of ['','-journal','-wal','-shm']){let p=file+suffix;while(p!==root){if(!p.startsWith(root+'/')||existsSync(p)&&lstatSync(p).isSymbolicLink())fault('STATE_FAILED');p=dirname(p);}}}
 function access<T>(write:boolean,action:(db:DatabaseSync)=>T):T{
  safe();mkdirSync(dirname(file),{recursive:true});safe();const db=new DatabaseSync(file);
  try{
   db.exec('PRAGMA synchronous=FULL; PRAGMA busy_timeout=1000;');
   db.exec('BEGIN IMMEDIATE');
   try{
    const version=Number(db.prepare('PRAGMA user_version').get()?.user_version);
    if(version===0){if(db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all().length)fault('STATE_FAILED');db.exec(schema);db.exec('PRAGMA user_version=1; PRAGMA application_id=1480802643;');}
    if(Number(db.prepare('PRAGMA application_id').get()?.application_id)!==1480802643)fault('STATE_FAILED');
    if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===1){db.exec('CREATE TABLE audit(task_id TEXT NOT NULL,run_id TEXT NOT NULL,sequence INTEGER NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(run_id,sequence))');db.exec('PRAGMA user_version=2;');}
    if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===2){db.exec('CREATE TABLE checkpoints(operation_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL)');db.exec('PRAGMA user_version=3;');}
    if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===3){db.exec('CREATE TABLE IF NOT EXISTS native_sessions(task_id TEXT NOT NULL,purpose TEXT NOT NULL,session_id TEXT NOT NULL UNIQUE,PRIMARY KEY(task_id,purpose)); CREATE TABLE IF NOT EXISTS native_operations(operation_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,body TEXT NOT NULL,digest TEXT NOT NULL); PRAGMA user_version=4;');}
    if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===4){db.exec('CREATE TABLE IF NOT EXISTS native_forks(session_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,purpose TEXT NOT NULL); CREATE TABLE IF NOT EXISTS native_selection(task_id TEXT NOT NULL,purpose TEXT NOT NULL,session_id TEXT NOT NULL,PRIMARY KEY(task_id,purpose)); PRAGMA user_version=5;');}
    if(Number(db.prepare('PRAGMA user_version').get()?.user_version)!==5)fault('STATE_FAILED');
    const result=action(db);db.exec('COMMIT');return result;
   }catch(e){db.exec('ROLLBACK');throw e;}
  }finally{db.close();}
 }
 function read(db:DatabaseSync,task:string):State|null{
  const row=db.prepare('SELECT body,digest FROM budgets WHERE task_id=?').get(task);if(!row)return null;
  if(typeof row.body!=='string'||digest(row.body)!==row.digest)fault('STATE_FAILED');
  let v:State;try{v=JSON.parse(row.body);}catch{fault('STATE_FAILED');}
  if(!v||!(isUncapped(v.limits)?uncappedValid(v.limits):limitsValid(v.limits))||typeof v.configuration!=='string'||!(v.owner===null||typeof v.owner==='string')||v.historicalFingerprint!==undefined&&!/^[a-f0-9]{64}$/.test(v.historicalFingerprint)||!v.usage||!['modelCalls','toolCalls','outputTokens','resourceUnits','activeMs'].every(k=>integer(v.usage[k as keyof Usage]))||(isUncapped(v.limits)&&(!integer(v.usage.inputTokens)||!integer(v.usage.reservedOutputTokens)))||!Array.isArray(v.reservations)||v.reservations.some(r=>typeof r.owner!=='string'||!integer(r.tokens,1)))fault('STATE_FAILED');
  if(v.configurationHistory!==undefined&&(!Array.isArray(v.configurationHistory)||v.configurationHistory.some(m=>!m||Object.keys(m).length!==5||Object.values(m).some(value=>typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))||m.from===m.to)||v.configurationHistory.some((m,i)=>i>0&&v.configurationHistory![i-1]!.to!==m.from)||v.configurationHistory.at(-1)?.to!==v.configuration))fault('STATE_FAILED');
  if(v.interruptedStops!==undefined&&(!Array.isArray(v.interruptedStops)||v.interruptedStops.some((r,i)=>!r||!safeLabel(r.owner)||!safeLabel(r.controlOwner)||[r.businessIdentity,r.approval,r.reconciliation,r.accounting].some(x=>!/^[a-f0-9]{64}$/.test(x))||!r.lock||!integer(r.lock.pid,1)||!integer(r.lock.ino)||!integer(r.lock.dev)||!Number.isFinite(Date.parse(r.lock.created_at))||typeof r.lock.body!=='string'||!r.activeTime||r.activeTime.status!=='unknown'||r.activeTime.earliest_started_at!==r.lock.created_at||!Number.isFinite(Date.parse(r.activeTime.observed_dead_at))||Date.parse(r.activeTime.observed_dead_at)<Date.parse(r.lock.created_at)||!['pending','stopped'].includes(r.outcome)||(r.outcome==='pending'?(r.terminal!==null||i!==v.interruptedStops!.length-1):typeof r.terminal!=='string'||!/^[a-f0-9]{64}$/.test(r.terminal)))))fault('STATE_FAILED');
  return v;
 }
 const save=(db:DatabaseSync,task:string,v:State)=>{if(Object.values(v.usage).some(n=>!integer(n)))fault('STATE_FAILED');const body=JSON.stringify(v);db.prepare('INSERT INTO budgets VALUES(?,?,?) ON CONFLICT(task_id) DO UPDATE SET body=excluded.body,digest=excluded.digest').run(task,body,digest(body));};
 const safeLabel=(v:unknown)=>typeof v==='string'&&/^[A-Za-z0-9_.:/-]{1,256}$/.test(v);
 const audit:AuditSink={async append(event,signal){
  if(signal.aborted)fault('CANCELLED');
  const keys=['version','taskId','runId','sequence','kind','at','provider','model','contextVersions','digest','toolName','reason','attempt','failureCategory','session','invocation','toolFailed'];
  if(Object.keys(event).some(k=>!keys.includes(k))||event.version!=='1.0'||![event.taskId,event.runId,event.provider,event.model].every(safeLabel)||!integer(event.sequence,1)||!['run.started','model.admitted','model.finished','tool.admitted','tool.finished','run.finished','session.control'].includes(event.kind)||!Number.isFinite(Date.parse(event.at))||!event.contextVersions||Object.entries(event.contextVersions).some(([k,v])=>!safeLabel(k)||!(/^[a-f0-9]{64}$/.test(v)||/^\d+(?:\.\d+)*$/.test(v)||/^[a-f0-9-]{36}$/.test(v)))||event.digest!==undefined&&!/^[a-f0-9]{64}$/.test(event.digest)||event.toolName!==undefined&&!safeLabel(event.toolName)||event.reason!==undefined&&!/^[A-Z_]+$/.test(event.reason)||event.attempt!==undefined&&!integer(event.attempt)||event.failureCategory!==undefined&&!['quota','rate-limit','unavailable','network'].includes(event.failureCategory))fault('AUDIT_FAILED');
  const identityValid=(v:unknown,invocation=false)=>{if(!v||typeof v!=='object'||Array.isArray(v))return false;const keys=invocation?['sessionId','branch','operationId','invocationId','toolCallId']:['sessionId','branch','operationId'];return Object.keys(v).length===keys.length&&keys.every(k=>safeLabel(Reflect.get(v,k)));};
  if(event.session!==undefined&&!identityValid(event.session)||event.invocation!==undefined&&(!identityValid(event.invocation,true)||!event.session||['sessionId','branch','operationId'].some(k=>Reflect.get(event.invocation!,k)!==Reflect.get(event.session!,k)))||event.toolFailed!==undefined&&typeof event.toolFailed!=='boolean')fault('AUDIT_FAILED');
  const body=JSON.stringify(event);access(true,db=>{if(signal.aborted)fault('CANCELLED');db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(event.taskId,event.runId,event.sequence,body,digest(body));});
 }};
 const checkpointBody=(checkpoint:Readonly<ConversationCheckpoint>):string=>{
  if(!checkpoint||checkpoint.version!=='1.0'||!safeLabel(checkpoint.taskId)||!['ready','waiting','completed','tool-admitted'].includes(checkpoint.state)||!Array.isArray(checkpoint.messages))fault('STATE_FAILED');
  let body:string;try{body=JSON.stringify(checkpoint,(_key,value)=>{if(typeof value==='number'&&!Number.isFinite(value)||typeof value==='function'||typeof value==='symbol'||typeof value==='bigint')fault('STATE_FAILED');return value;});}catch{fault('STATE_FAILED');}
  if(Buffer.byteLength(body)>2*1024*1024)fault('STATE_FAILED');return body;
 };
 const writerPath=()=>join(dirname(file),'pi-sessions','.writer-lock');
 function readWriterLock():WriterReceipt|null{
  safe();const path=writerPath();if(!existsSync(path))return null;const st=lstatSync(path);
  if(!st.isFile()||st.isSymbolicLink()||st.size>1024||realpathSync(dirname(path))!==dirname(path))fault('STATE_FAILED');
  const body=readFileSync(path,'utf8');let value:any;try{value=JSON.parse(body);}catch{fault('STATE_FAILED');}
  if(Object.keys(value).length!==2||!integer(value.pid,1)||typeof value.created_at!=='string'||!Number.isFinite(Date.parse(value.created_at))||Date.parse(value.created_at)>Date.now())fault('STATE_FAILED');
  return {pid:value.pid,created_at:value.created_at,ino:st.ino,dev:st.dev,body};
 }
 function dead(lock:WriterReceipt){try{process.kill(lock.pid,0);}catch(e){if((e as NodeJS.ErrnoException).code==='ESRCH')return;fault('TASK_BUSY');}fault('TASK_BUSY');}
 type InterruptedInput={businessIdentity:string;task:string;expectedOwner:string;expectedAccounting:string;expectedLock:string;approval:string;reconciliation:string;signal:AbortSignal;authorize:()=>boolean};
 let interruptedPermit:InterruptedInput|undefined;
 const api={audit,readWriterLock,
 /** Trusted abort-only Adapter seam; no expiry, automatic release or tool replay. */
 interruptedAbortLease(input:InterruptedInput){
  if(!safeLabel(input.task)||!safeLabel(input.expectedOwner)||[input.businessIdentity,input.expectedAccounting,input.expectedLock,input.approval,input.reconciliation].some(v=>!/^[a-f0-9]{64}$/.test(v)))fault('INVALID_REQUEST');
  const check=()=>{if(input.signal.aborted||!input.authorize())fault('AUTHORITY_REQUIRED');const lock=readWriterLock();if(!lock||digest(JSON.stringify(lock))!==input.expectedLock)fault('STATE_FAILED');dead(lock);return lock;};
  const lock=check(),before=api.readAccounting(input.task);if(!before||before.owner!==input.expectedOwner||digest(JSON.stringify(before))!==input.expectedAccounting||!isUncapped(before.limits)||before.interruptedStops?.at(-1)?.outcome==='pending')fault('STATE_FAILED');
  let claimed=false,writerHeld=false,writerReleased=false,writerAcquisitions=0,controlOwner:string|undefined;
  return {budgets:{...api.budgets,async claimUncapped(task:string,owner:string,configuration:string,limits:UncappedLimits){
   check();if(claimed||task!==input.task||configuration!==before.configuration||JSON.stringify(limits)!==JSON.stringify(before.limits))fault('STATE_FAILED');
   interruptedPermit=input;try{const lease=await api.budgets.claimUncapped(task,owner,configuration,limits);claimed=true;controlOwner=owner;return lease;}finally{interruptedPermit=undefined;}
  }},storage:{...api.sessionStorage(async()=>!input.signal.aborted&&input.authorize()),async acquireWriter(signal:AbortSignal){
   check();if(signal.aborted||writerHeld)fault('STATE_FAILED');const accounting=api.readAccounting(input.task);if(!claimed?digest(JSON.stringify(accounting))!==input.expectedAccounting:accounting?.interruptedStops?.at(-1)?.controlOwner!==controlOwner)fault('STATE_FAILED');
   const fd=openSync(writerPath(),constants.O_RDONLY|constants.O_NOFOLLOW),st=fstatSync(fd);
   if(st.ino!==lock.ino||st.dev!==lock.dev){closeSync(fd);fault('STATE_FAILED');}writerHeld=true;writerAcquisitions++;writerReleased=false;let released=false;
   return {async release(){if(released)return;closeSync(fd);released=true;writerHeld=false;writerReleased=true;}};
  }},finish(terminal:string){
   check();if(!claimed||writerHeld||!writerReleased||!writerAcquisitions||!/^[a-f0-9]{64}$/.test(terminal))fault('STATE_FAILED');
   access(true,db=>{const v=read(db,input.task),record=v?.interruptedStops?.at(-1);if(!v||v.owner!==null||!record||record.owner!==input.expectedOwner||record.controlOwner!==controlOwner||record.outcome!=='pending'||digest(JSON.stringify(v.reservations))!==digest(JSON.stringify(before.reservations))||Object.entries(before.usage).some(([k,n])=>k==='activeMs'?v.usage.activeMs<n:v.usage[k as keyof Usage]!==n))fault('STATE_FAILED');record.outcome='stopped';record.terminal=terminal;save(db,input.task,v);});
   // The original bytes/inode remain until a verified native aborted receipt.
   check();unlinkSync(writerPath());
  }};
 },
 readAccounting(task:string){if(!safeLabel(task))fault('STATE_FAILED');return access(false,db=>structuredClone(read(db,task)));},
 /** Trusted Adapter only: external effects/native queues must be reconciled under the project writer lock first. */
 migrateConfiguration(input:{task:string;from:string;to:string;expectedAccounting:string;approval:string;reconciliation:string}){
  if(!safeLabel(input.task)||Object.keys(input).length!==6||[input.from,input.to,input.expectedAccounting,input.approval,input.reconciliation].some(v=>!/^[a-f0-9]{64}$/.test(v))||input.from===input.to)fault('INVALID_REQUEST');
  return access(true,db=>{const v=read(db,input.task);if(!v||!isUncapped(v.limits)||v.configuration!==input.from||digest(JSON.stringify(v))!==input.expectedAccounting)fault('CONFIGURATION_CHANGED');if(v.owner!==null||v.interruptedStops?.at(-1)?.outcome==='pending')fault('TASK_BUSY');
   const receipt={from:input.from,to:input.to,approval:input.approval,reconciliation:input.reconciliation,accounting:input.expectedAccounting};
   v.configurationHistory=[...(v.configurationHistory??[]),receipt];v.configuration=input.to;save(db,input.task,v);return structuredClone(receipt);
  });
 },
 readNativeBindings(task:string){if(!safeLabel(task))fault('STATE_FAILED');return access(false,db=>db.prepare('SELECT body,digest FROM native_operations WHERE task_id=? ORDER BY rowid').all(task).map(row=>{if(typeof row.body!=='string'||digest(row.body)!==row.digest)fault('STATE_FAILED');return JSON.parse(row.body) as SessionBinding&{taskId:string;purpose?:string};}));},
 hasUnsettledModel(task:string){if(!safeLabel(task))fault('STATE_FAILED');return access(false,db=>(read(db,task)?.reservations.length??0)>0);},
 sessionStorage(authorize:SessionStorage['authorize']):SessionStorage{
  safe();const directory=join(dirname(file),'pi-sessions');mkdirSync(directory,{recursive:true,mode:0o700});
  const check=()=>{safe();const st=lstatSync(directory);if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077)!==0||realpathSync(directory)!==directory)fault('STATE_FAILED');};check();
  return {directory,cwd:root,policyVersion:'juanerai-native-session-v1-private-retained',authorize,
   async acquireWriter(signal){
    if(signal.aborted)fault('CANCELLED');check();const lock=join(directory,'.writer-lock');let fd:number;
    try{fd=openSync(lock,'wx',0o600);}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')fault('TASK_BUSY');fault('STATE_FAILED');}
    const held=fstatSync(fd);try{writeSync(fd,JSON.stringify({pid:process.pid,created_at:new Date().toISOString()}));}catch{closeSync(fd);unlinkSync(lock);fault('STATE_FAILED');}
    let released=false;return {async release(){if(released)return;check();const current=lstatSync(lock);if(current.ino!==held.ino||current.dev!==held.dev||!current.isFile()||current.isSymbolicLink())fault('STATE_FAILED');unlinkSync(lock);closeSync(fd);released=true;}};
   },
  };
 },
 selectSession(task:string,purpose:string,session:string){
  if(![task,purpose,session].every(safeLabel))fault('INVALID_REQUEST');
  access(true,db=>{const old=db.prepare('SELECT session_id FROM native_sessions WHERE task_id=? AND purpose=?').get(task,purpose),owner=db.prepare('SELECT task_id,purpose FROM native_sessions WHERE session_id=?').get(session);if(old&&old.session_id!==session||owner&&(owner.task_id!==task||owner.purpose!==purpose))fault('STATE_FAILED');db.prepare('INSERT OR IGNORE INTO native_sessions VALUES(?,?,?)').run(task,purpose,session);});
 },
 hasNativeSession(task:string){if(!safeLabel(task))fault('INVALID_REQUEST');return access(false,db=>!!db.prepare('SELECT session_id FROM native_sessions WHERE task_id=? LIMIT 1').get(task));},
 readSession(task:string,purpose:string){if(![task,purpose].every(safeLabel))fault('INVALID_REQUEST');return access(false,db=>db.prepare('SELECT session_id FROM native_sessions WHERE task_id=? AND purpose=?').get(task,purpose)?.session_id as string|undefined);},
 ownsSession(task:string,purpose:string,session:string){if(![task,purpose,session].every(safeLabel))fault('STATE_FAILED');return access(false,db=>!!db.prepare('SELECT session_id FROM native_sessions WHERE task_id=? AND purpose=? AND session_id=? UNION ALL SELECT session_id FROM native_forks WHERE task_id=? AND purpose=? AND session_id=?').get(task,purpose,session,task,purpose,session));},
 readSelectedSession(task:string,purpose:string){if(![task,purpose].every(safeLabel))fault('STATE_FAILED');return access(false,db=>(db.prepare('SELECT session_id FROM native_selection WHERE task_id=? AND purpose=?').get(task,purpose)??db.prepare('SELECT session_id FROM native_sessions WHERE task_id=? AND purpose=?').get(task,purpose))?.session_id as string|undefined);},
 registerFork(task:string,purpose:string,source:string,fork:string){if(![task,purpose,source,fork].every(safeLabel))fault('STATE_FAILED');access(true,db=>{const owner=db.prepare('SELECT task_id,purpose FROM native_sessions WHERE session_id=? UNION ALL SELECT task_id,purpose FROM native_forks WHERE session_id=?').get(source,source);if(!owner||owner.task_id!==task||owner.purpose!==purpose)fault('STATE_FAILED');const old=db.prepare('SELECT task_id,purpose FROM native_sessions WHERE session_id=? UNION ALL SELECT task_id,purpose FROM native_forks WHERE session_id=?').get(fork,fork);if(old&&(old.task_id!==task||old.purpose!==purpose))fault('STATE_FAILED');db.prepare('INSERT OR IGNORE INTO native_forks VALUES(?,?,?)').run(fork,task,purpose);db.prepare('INSERT INTO native_selection VALUES(?,?,?) ON CONFLICT(task_id,purpose) DO UPDATE SET session_id=excluded.session_id').run(task,purpose,fork);});},
 async bindOperation(input:SessionBinding&{taskId:string;purpose?:string},signal:AbortSignal){
  if(signal.aborted)fault('CANCELLED');if(Object.keys(input).some(k=>!['sessionId','branch','operationId','taskId','purpose'].includes(k))||![input.sessionId,input.branch,input.operationId,input.taskId].every(safeLabel)||input.purpose!==undefined&&!safeLabel(input.purpose))fault('STATE_FAILED');
  const body=JSON.stringify(input);access(true,db=>{if(signal.aborted)fault('CANCELLED');const owner=db.prepare('SELECT task_id,purpose FROM native_sessions WHERE session_id=? UNION ALL SELECT task_id,purpose FROM native_forks WHERE session_id=?').get(input.sessionId,input.sessionId);if(!owner||owner.task_id!==input.taskId||owner.purpose!==(input.purpose??'analysis'))fault('STATE_FAILED');const old=db.prepare('SELECT body,digest FROM native_operations WHERE operation_id=?').get(input.operationId);if(old&&(old.body!==body||old.digest!==digest(body)))fault('STATE_FAILED');db.prepare('INSERT OR IGNORE INTO native_operations VALUES(?,?,?,?)').run(input.operationId,input.taskId,body,digest(body));});
 },
 readLatestPurpose(task:string){if(!safeLabel(task))fault('STATE_FAILED');return access(false,db=>{const rows=db.prepare('SELECT body,digest FROM native_operations WHERE task_id=? ORDER BY rowid DESC').all(task);for(const row of rows){if(typeof row.body!=='string'||digest(row.body)!==row.digest)fault('STATE_FAILED');const binding=JSON.parse(row.body) as SessionBinding&{taskId:string;purpose?:string};const purpose=binding.purpose??'analysis';if(binding.taskId!==task||!['analysis','analysis_native','analysis_objects','proposal_objects','proposal_prepare','report_edit','retained_case'].includes(purpose)&&!/^(retained_case|analysis|analysis_native|analysis_objects):[a-f0-9-]{36}$/.test(purpose))fault('STATE_FAILED');if(!purpose.includes(':'))return purpose==='analysis_native'||purpose==='analysis_objects'?'analysis':purpose==='proposal_objects'?'proposal_prepare':purpose;}return undefined;});},
 readBinding(operation:string){if(!safeLabel(operation))fault('STATE_FAILED');return access(false,db=>{const row=db.prepare('SELECT body,digest FROM native_operations WHERE operation_id=?').get(operation);if(!row)return undefined;if(typeof row.body!=='string'||digest(row.body)!==row.digest)fault('STATE_FAILED');return JSON.parse(row.body) as SessionBinding&{taskId:string;purpose?:string};});},
 async saveCheckpoint(operation:string,checkpoint:Readonly<ConversationCheckpoint>,signal:AbortSignal){
  if(signal.aborted)fault('CANCELLED');if(!safeLabel(operation))fault('STATE_FAILED');const body=checkpointBody(checkpoint);
  access(true,db=>{if(signal.aborted)fault('CANCELLED');const previous=db.prepare('SELECT task_id FROM checkpoints WHERE operation_id=?').get(operation);if(previous&&previous.task_id!==checkpoint.taskId)fault('STATE_FAILED');db.prepare('INSERT INTO checkpoints VALUES(?,?,?,?) ON CONFLICT(operation_id) DO UPDATE SET body=excluded.body,digest=excluded.digest').run(operation,checkpoint.taskId,body,digest(body));});
 },
 readCheckpoint(operation:string,task:string){
  if(!safeLabel(operation)||!safeLabel(task))fault('STATE_FAILED');return access(false,db=>{const row=db.prepare('SELECT task_id,body,digest FROM checkpoints WHERE operation_id=?').get(operation);if(!row)return undefined;if(row.task_id!==task||typeof row.body!=='string'||digest(row.body)!==row.digest)fault('STATE_FAILED');let checkpoint:ConversationCheckpoint;try{checkpoint=JSON.parse(row.body);}catch{fault('STATE_FAILED');}if(checkpoint.taskId!==task||checkpointBody(checkpoint)!==row.body)fault('STATE_FAILED');return checkpoint;});
 },
 readAudit(task:string){return access(false,db=>db.prepare('SELECT body,digest FROM audit WHERE task_id=? ORDER BY rowid').all(task).map(row=>{if(typeof row.body!=='string'||digest(row.body)!==row.digest)fault('STATE_FAILED');return JSON.parse(row.body) as AuditEvent;}));},budgets:{async claimUncapped(task:string,owner:string,configuration:string,limits:UncappedLimits):Promise<UncappedBudgetLease>{
  if(![task,owner,configuration].every(safeLabel)||!uncappedValid(limits))fault('INVALID_REQUEST');
  const fixed=structuredClone(limits),began=performance.now();let released=false;let acknowledged:UncappedUsage;
  access(true,db=>{let v=read(db,task);if(!v){
   let historical:HistoricalUsage|undefined;try{historical=config.historicalUsage?.(task);}catch{fault('STATE_FAILED');}
   if(config.historicalUsage&&(!historical||!historical.reconciled||!/^[a-f0-9]{64}$/.test(historical.fingerprint)||!historical.usage||Object.values(historical.usage).some(n=>!integer(n))))fault('STATE_FAILED');
   // Only a genuinely unused task can enter new policy without an explicit migration.
   if(historical&&Object.values(historical.usage).some(n=>n!==0))fault('CONFIGURATION_CHANGED');
   v={configuration,limits:fixed,owner:null,usage:{modelCalls:0,toolCalls:0,outputTokens:0,resourceUnits:0,activeMs:0,inputTokens:0,reservedOutputTokens:0},reservations:[],...(historical?{historicalFingerprint:historical.fingerprint}:{})};
  }
  if(!isUncapped(v.limits)||v.configuration!==configuration||JSON.stringify(v.limits)!==JSON.stringify(fixed))fault('CONFIGURATION_CHANGED');
  if(v.interruptedStops?.at(-1)?.outcome==='pending')fault('STATE_FAILED');
  if(v.owner!==null){
   const permit=interruptedPermit,lock=readWriterLock();if(!permit||permit.signal.aborted||!permit.authorize()||permit.task!==task||permit.expectedOwner!==v.owner||digest(JSON.stringify(v))!==permit.expectedAccounting||!lock||digest(JSON.stringify(lock))!==permit.expectedLock)fault('TASK_BUSY');dead(lock);
   // The dead process never released its measured elapsed time. Retain that
   // uncertainty separately; wall time until recovery includes offline time.
   v.interruptedStops=[...(v.interruptedStops??[]),{businessIdentity:permit.businessIdentity,owner:v.owner,controlOwner:owner,approval:permit.approval,reconciliation:permit.reconciliation,accounting:permit.expectedAccounting,lock,activeTime:{status:'unknown',earliest_started_at:lock.created_at,observed_dead_at:new Date().toISOString()},outcome:'pending',terminal:null}];
  }
  v.owner=owner;save(db,task,v);acknowledged=structuredClone(v.usage) as UncappedUsage;});
  const mutate=<T>(action:(v:State&{usage:UncappedUsage})=>T):T=>{let updated:UncappedUsage;const result=access(true,db=>{const v=read(db,task);if(!v||released||v.owner!==owner||!isUncapped(v.limits))fault('TASK_BUSY');const result=action(v as State&{usage:UncappedUsage});save(db,task,v);updated=structuredClone(v.usage) as UncappedUsage;return result;});acknowledged=updated!;return result;};
  return {snapshot(){return structuredClone(acknowledged);},async reserveModel(){fault('INVALID_REQUEST');},
   async reserveModelUpTo(maximum){return mutate(v=>{if(!integer(maximum,1))fault('INVALID_REQUEST');v.usage.modelCalls++;v.usage.resourceUnits++;v.usage.outputTokens+=maximum;v.usage.reservedOutputTokens+=maximum;v.reservations.push({owner,tokens:maximum});return maximum;});},
   async settleModel(){fault('INVALID_REQUEST');},
   async settleModelUsage(reserved,usage){mutate(v=>{if(!integer(reserved,1)||!integer(usage.inputTokens)||!integer(usage.outputTokens))fault('INVALID_REQUEST');const i=v.reservations.findIndex(r=>r.owner===owner&&r.tokens===reserved);if(i<0)fault('STATE_FAILED');v.reservations.splice(i,1);v.usage.inputTokens+=usage.inputTokens;v.usage.outputTokens+=usage.outputTokens-reserved;v.usage.reservedOutputTokens-=reserved;});},
   async reserveTool(units){mutate(v=>{if(!integer(units))fault('INVALID_REQUEST');v.usage.toolCalls++;v.usage.resourceUnits+=units;});},
   async release(activeMs){if(!integer(activeMs))fault('INVALID_REQUEST');mutate(v=>{v.usage.activeMs+=Math.max(activeMs,Math.floor(performance.now()-began));v.owner=null;});released=true;},
  };
 },async claim(task:string,owner:string,configuration:string,limits:Limits){
  if(![task,owner,configuration].every(v=>typeof v==='string'&&v.length>0&&v.length<=256&&!/[\r\n\0]/.test(v))||!limitsValid(limits))fault('INVALID_REQUEST');
  const fixed=structuredClone(limits),began=performance.now();let released=false;let acknowledged:Usage;
  access(true,db=>{
   let v=read(db,task);
   if(!v){
    let historical:HistoricalUsage|undefined;
    try{historical=config.historicalUsage?.(task);}catch{fault('STATE_FAILED');}
    if(config.historicalUsage&&(!historical||historical.reconciled!==true||! /^[a-f0-9]{64}$/.test(historical.fingerprint)||!historical.usage||!['modelCalls','toolCalls','outputTokens','resourceUnits','activeMs'].every(k=>integer(historical!.usage[k as keyof Usage]))))fault('STATE_FAILED');
    v={configuration,limits:fixed,owner:null,usage:historical?structuredClone(historical.usage):{modelCalls:0,toolCalls:0,outputTokens:0,resourceUnits:0,activeMs:0},reservations:[],...(historical?{historicalFingerprint:historical.fingerprint}:{})};
   }
   if(v.configuration!==configuration||JSON.stringify(v.limits)!==JSON.stringify(fixed))fault('CONFIGURATION_CHANGED');
   if(isUncapped(v.limits))fault('CONFIGURATION_CHANGED');if(v.owner!==null)fault('TASK_BUSY');if(v.usage.activeMs>=fixed.wallTimeMs)fault('BUDGET_EXHAUSTED');
   v.owner=owner;save(db,task,v);acknowledged=structuredClone(v.usage);
  });
  const mutate=<T>(work:(v:State)=>T):T=>{let updated:Usage|undefined;const result=access(true,db=>{const v=read(db,task);if(!v||released||v.owner!==owner)fault('TASK_BUSY');const result=work(v);save(db,task,v);updated=structuredClone(v.usage);return result;});acknowledged=updated!;return result;};
  const open=(v:State)=>{if(isUncapped(v.limits))fault('CONFIGURATION_CHANGED');if(v.usage.activeMs+Math.floor(performance.now()-began)>=v.limits.wallTimeMs)fault('BUDGET_EXHAUSTED');};
  const reserve=(maximum:number)=>mutate(v=>{
   open(v);if(isUncapped(v.limits))fault('CONFIGURATION_CHANGED');if(!integer(maximum,1))fault('INVALID_REQUEST');const tokens=Math.min(maximum,v.limits.outputTokens-v.usage.outputTokens);
   if(v.usage.modelCalls>=v.limits.modelCalls||tokens<=0||v.limits.resourceUnits!==undefined&&v.usage.resourceUnits>=v.limits.resourceUnits)fault('BUDGET_EXHAUSTED');
   v.usage.modelCalls++;v.usage.resourceUnits++;v.usage.outputTokens+=tokens;v.reservations.push({owner,tokens});return tokens;
  });
  return {
   snapshot(){return structuredClone(acknowledged);},
   async reserveModel(){return reserve(fixed.outputTokens);},
   async reserveModelUpTo(maximum:number){return reserve(maximum);},
   async settleModel(reserved:number,actual:number){mutate(v=>{if(!integer(reserved,1)||!integer(actual)||actual>reserved)fault('INVALID_REQUEST');const index=v.reservations.findIndex(r=>r.owner===owner&&r.tokens===reserved);if(index<0)fault('STATE_FAILED');v.reservations.splice(index,1);v.usage.outputTokens-=reserved-actual;});},
   async reserveTool(units:number){mutate(v=>{open(v);if(isUncapped(v.limits))fault('CONFIGURATION_CHANGED');if(!integer(units))fault('INVALID_REQUEST');if(v.usage.toolCalls>=v.limits.toolCalls||v.limits.resourceUnits!==undefined&&v.usage.resourceUnits+units>v.limits.resourceUnits)fault('BUDGET_EXHAUSTED');v.usage.toolCalls++;v.usage.resourceUnits+=units;});},
   async release(activeMs:number){if(!integer(activeMs))fault('INVALID_REQUEST');mutate(v=>{const elapsed=Math.max(activeMs,Math.floor(performance.now()-began));if(!integer(v.usage.activeMs+elapsed))fault('STATE_FAILED');v.usage.activeMs+=elapsed;v.owner=null;});released=true;},
  };
 }}};
 return api;
}
