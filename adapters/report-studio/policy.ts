import {DatabaseSync} from 'node:sqlite';
import {existsSync,lstatSync,realpathSync,chmodSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';

export type StudioPermissionMaterial={source_id:string;sha256:string;kind:'text'|'image'};
export type StudioPermissionInput={recipients_sha256:string;materials:readonly StudioPermissionMaterial[];allow_prompt:boolean;allow_screenshots:boolean;allow_network:boolean};
export type StudioPermissionBoundary={recipients_sha256:string;materials:readonly StudioPermissionMaterial[]};
export type StudioOperation={operation_id:string;project_id:string;kind:'main'|'image'|'export'|'preview';state:'running'|'stopping'|'succeeded'|'failed'|'stopped'|'unknown';physical_settled:boolean;usage_known:boolean|null;sdk_run_id:string|null;outcome:'succeeded'|'failed'|'cancelled'|null;started_at:string;updated_at:string};
type Row=Record<string,string|number|bigint|Uint8Array|null>;
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const token=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v);
const exact=(v:unknown,keys:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
function fail(code='RS_POLICY_INVALID'):never{throw Object.assign(new Error(code),{code});}
function materials(value:unknown):readonly StudioPermissionMaterial[]{
 if(!Array.isArray(value)||value.length>1000)fail();const seen=new Set<string>();
 for(const m of value){if(!exact(m,['source_id','sha256','kind'])||!token(m.source_id)||!hash(m.sha256)||!['text','image'].includes(m.kind)||seen.has(m.source_id.toLowerCase()))fail();seen.add(m.source_id.toLowerCase());}
 return structuredClone(value).sort((a,b)=>a.source_id.localeCompare(b.source_id,'en'));
}
function boundary(value:StudioPermissionBoundary):StudioPermissionBoundary{
 if(!exact(value,['recipients_sha256','materials'])||!hash(value.recipients_sha256))fail();return {recipients_sha256:value.recipients_sha256,materials:materials(value.materials)};
}
function permission(value:unknown):StudioPermissionInput{
 if(!exact(value,['recipients_sha256','materials','allow_prompt','allow_screenshots','allow_network']))fail();const v=value as StudioPermissionInput;
 if(![v.allow_prompt,v.allow_screenshots,v.allow_network].every(x=>typeof x==='boolean'))fail();return {...boundary({recipients_sha256:v.recipients_sha256,materials:v.materials}),allow_prompt:v.allow_prompt,allow_screenshots:v.allow_screenshots,allow_network:v.allow_network};
}
const schema=[
 'CREATE TABLE mode_history(revision INTEGER PRIMARY KEY,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL,at TEXT NOT NULL)',
 'CREATE TABLE grant_history(project_id TEXT NOT NULL,revision INTEGER NOT NULL,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL,at TEXT NOT NULL,PRIMARY KEY(project_id,revision))',
 'CREATE TABLE operations(operation_id TEXT PRIMARY KEY,project_id TEXT NOT NULL,state TEXT NOT NULL,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL)',
 "CREATE UNIQUE INDEX one_active_project ON operations(project_id) WHERE state IN ('running','stopping','unknown')",
 'CREATE TABLE operation_events(operation_id TEXT NOT NULL,sequence INTEGER NOT NULL,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL,PRIMARY KEY(operation_id,sequence))',
];
const active=(state:StudioOperation['state'])=>['running','stopping','unknown'].includes(state);
/** Single owned personal Studio writer. No credential, raw content, or budget is stored here. */
export function createReportStudioPolicy(config:{dataRoot:string;now():string}){
 const root=realpathSync(config.dataRoot),file=join(root,'.juanerai-policy.sqlite'),application=0x52535031;
 if(root!==resolve(config.dataRoot)||!lstatSync(root).isDirectory())fail('RS_POLICY_UNSAFE');
 function safe(){if(existsSync(file)){const s=lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1)fail('RS_POLICY_UNSAFE');}}
 function at(){const now=config.now();if(typeof now!=='string'||!Number.isFinite(Date.parse(now)))fail();return now;}
 function access<T>(write:boolean,empty:()=>T,work:(db:DatabaseSync)=>T):T{
   safe();const existed=existsSync(file);if(!existed&&!write)return empty();const db=new DatabaseSync(file,{readOnly:!write});
   try{
     db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=1000');
     // Persist a valid empty schema even when the first legitimate request is denied.
     if(!existed){db.exec('BEGIN IMMEDIATE');db.exec(`PRAGMA application_id=${application}; PRAGMA user_version=1;`+schema.join(';'));db.exec('COMMIT');chmodSync(file,0o600);}
     if(write)db.exec('BEGIN IMMEDIATE');
     if(Number((db.prepare('PRAGMA application_id').get() as Row).application_id)!==application||Number((db.prepare('PRAGMA user_version').get() as Row).user_version)!==1)fail();
     const actual=(db.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Row[]).map(r=>String(r.sql)).sort();
     if(JSON.stringify(actual)!==JSON.stringify([...schema].sort()))fail();
     const value=work(db);if(write)db.exec('COMMIT');return value;
   }catch(error){if(write){try{db.exec('ROLLBACK');}catch{}}throw error;}finally{db.close();}
 }
 function revision(value:Row[string]){const n=Number(value);if(!Number.isSafeInteger(n)||n<1)fail();return n;}
 function decoded(row:Row):unknown{if(typeof row.body_json!=='string'||sha(row.body_json)!==row.body_sha256)fail();try{return JSON.parse(row.body_json);}catch{fail();}}
 function modeIn(db:DatabaseSync){const row=db.prepare('SELECT * FROM mode_history ORDER BY revision DESC LIMIT 1').get() as Row|undefined;if(!row)return {accepted:false,revision:0};const value=decoded(row) as {accepted:boolean;mode_version:string};if(!exact(value,['accepted','mode_version'])||typeof value.accepted!=='boolean'||value.mode_version!=='trusted-local-v1')fail();return {accepted:value.accepted,revision:revision(row.revision)};}
 function grantIn(db:DatabaseSync,project:string){const row=db.prepare('SELECT * FROM grant_history WHERE project_id=? ORDER BY revision DESC LIMIT 1').get(project) as Row|undefined;return row?{revision:revision(row.revision),grant:permission(decoded(row))}:{revision:0,grant:null};}
 function permissionsIn(db:DatabaseSync,project:string,current:StudioPermissionBoundary){const saved=grantIn(db,project),mode=modeIn(db),g=saved.grant,missing=current.materials.filter(m=>!g?.materials.some(v=>v.source_id===m.source_id&&v.sha256===m.sha256&&v.kind===m.kind)),recipients_changed=!g||g.recipients_sha256!==current.recipients_sha256,allowed=mode.accepted&&g?.allow_prompt===true&&!missing.length&&!recipients_changed;return {allowed,revision:saved.revision,missing,recipients_changed,allow_screenshots:allowed&&g?.allow_screenshots===true,allow_network:allowed&&g?.allow_network===true,grant:g};}
 function saveGrant(db:DatabaseSync,project:string,revision:number,value:StudioPermissionInput){const text=JSON.stringify(value);db.prepare('INSERT INTO grant_history VALUES(?,?,?,?,?)').run(project,revision,text,sha(text),at());return {revision,grant:value};}
 function readOperation(db:DatabaseSync,id:string):StudioOperation|null{
   const row=db.prepare('SELECT * FROM operations WHERE operation_id=?').get(id) as Row|undefined;if(!row)return null;const op=decoded(row) as StudioOperation;
   if(!exact(op,['operation_id','project_id','kind','state','physical_settled','usage_known','sdk_run_id','outcome','started_at','updated_at'])||op.operation_id!==id||op.project_id!==row.project_id||op.state!==row.state||!uuid(op.operation_id)||!token(op.project_id)||!['main','image','export','preview'].includes(op.kind)||!['running','stopping','succeeded','failed','stopped','unknown'].includes(op.state)||typeof op.physical_settled!=='boolean'||![true,false,null].includes(op.usage_known)||op.sdk_run_id!==null&&!token(op.sdk_run_id)||op.outcome!==null&&!['succeeded','failed','cancelled'].includes(op.outcome)||!Number.isFinite(Date.parse(op.started_at))||!Number.isFinite(Date.parse(op.updated_at)))fail();return op;
 }
 function required(db:DatabaseSync,id:string){if(!uuid(id))fail();return readOperation(db,id)??fail('RS_OPERATION_NOT_FOUND');}
 function saveOperation(db:DatabaseSync,value:StudioOperation){const text=JSON.stringify(value),digest=sha(text);db.prepare('INSERT INTO operations VALUES(?,?,?,?,?) ON CONFLICT(operation_id) DO UPDATE SET state=excluded.state,body_json=excluded.body_json,body_sha256=excluded.body_sha256').run(value.operation_id,value.project_id,value.state,text,digest);const seq=Number((db.prepare('SELECT COALESCE(MAX(sequence),0)+1 AS n FROM operation_events WHERE operation_id=?').get(value.operation_id) as Row).n);db.prepare('INSERT INTO operation_events VALUES(?,?,?,?)').run(value.operation_id,seq,text,digest);return value;}
 function mode(){return access(false,()=>({accepted:false,revision:0}),modeIn);}
 function setMode(expected:number,accepted:boolean){if(!Number.isSafeInteger(expected)||expected<0||typeof accepted!=='boolean')fail();return access(true,()=>fail(),db=>{const old=modeIn(db);if(old.revision!==expected)fail('RS_POLICY_CHANGED');const text=JSON.stringify({accepted,mode_version:'trusted-local-v1'});db.prepare('INSERT INTO mode_history VALUES(?,?,?,?)').run(expected+1,text,sha(text),at());return {accepted,revision:expected+1};});}
 function permissions(project:string,input:StudioPermissionBoundary){if(!token(project))fail();const current=boundary(input);return access<ReturnType<typeof permissionsIn>>(false,()=>({allowed:false,revision:0,missing:[...current.materials],recipients_changed:true,allow_screenshots:false,allow_network:false,grant:null}),db=>permissionsIn(db,project,current));}
 function grant(project:string,expected:number,input:StudioPermissionInput,currentInput:StudioPermissionBoundary){if(!token(project)||!Number.isSafeInteger(expected)||expected<0)fail();const value=permission(input),current=boundary(currentInput);if(value.recipients_sha256!==current.recipients_sha256||value.materials.some(m=>!current.materials.some(v=>v.source_id===m.source_id&&v.sha256===m.sha256&&v.kind===m.kind)))fail('RS_PERMISSION_SCOPE_CHANGED');return access(true,()=>fail(),db=>{if(grantIn(db,project).revision!==expected)fail('RS_POLICY_CHANGED');return saveGrant(db,project,expected+1,value);});}
 function revoke(project:string,expected:number){if(!token(project)||!Number.isSafeInteger(expected)||expected<0)fail();return access(true,()=>fail(),db=>{const old=grantIn(db,project);if(old.revision!==expected)fail('RS_POLICY_CHANGED');if(!old.grant)return old;return saveGrant(db,project,expected+1,{...old.grant,allow_prompt:false,allow_screenshots:false,allow_network:false});});}
 function begin(project:string,id:string,kind:StudioOperation['kind'],input:StudioPermissionBoundary):StudioOperation{if(!token(project)||!uuid(id)||!['main','image','export','preview'].includes(kind))fail();const current=boundary(input);return access(true,()=>fail(),db=>{if(kind==='export'||kind==='preview'){if(!modeIn(db).accepted)fail('RS_LOCAL_MODE_REQUIRED');}else if(!permissionsIn(db,project,current).allowed)fail('RS_PERMISSION_REQUIRED');if(readOperation(db,id))fail('RS_OPERATION_CONFLICT');if((db.prepare("SELECT operation_id FROM operations WHERE project_id=? AND state IN ('running','stopping','unknown')").get(project)))fail('RS_PROJECT_PENDING');const now=at();return saveOperation(db,{operation_id:id,project_id:project,kind,state:'running',physical_settled:false,usage_known:null,sdk_run_id:null,outcome:null,started_at:now,updated_at:now});});}
 function stop(id:string){return access(true,()=>fail(),db=>{const op=required(db,id);return op.state==='running'?saveOperation(db,{...op,state:'stopping',updated_at:at()}):op;});}
 function finish(id:string,value:{outcome:'succeeded'|'failed'|'cancelled';physical_settled:boolean;usage_known:boolean;sdk_run_id:string|null}):StudioOperation{
   if(!exact(value,['outcome','physical_settled','usage_known','sdk_run_id'])||!['succeeded','failed','cancelled'].includes(value.outcome)||typeof value.physical_settled!=='boolean'||typeof value.usage_known!=='boolean'||value.sdk_run_id!==null&&!token(value.sdk_run_id))fail();
   return access(true,()=>fail(),db=>{const op=required(db,id);if(!active(op.state))fail('RS_OPERATION_CONFLICT');const physical=op.physical_settled||value.physical_settled,known=op.usage_known===false?false:value.usage_known,state=op.state==='unknown'||!physical||!known?'unknown':op.state==='stopping'||value.outcome==='cancelled'?'stopped':value.outcome;return saveOperation(db,{...op,state,physical_settled:physical,usage_known:known,sdk_run_id:value.sdk_run_id,outcome:value.outcome,updated_at:at()});});
 }
 function reconcile(id:string){return access(true,()=>fail(),db=>{const op=required(db,id);if(op.state==='stopped')return op;if(op.state!=='unknown'||!op.physical_settled)fail('RS_RECONCILIATION_REQUIRED');return saveOperation(db,{...op,state:'stopped',updated_at:at()});});}
 function operation(id:string){if(!uuid(id))fail();return access(false,()=>null,db=>readOperation(db,id));}
 function projectOperations(project:string){if(!token(project))fail();return access(false,()=>[] as StudioOperation[],db=>(db.prepare('SELECT operation_id FROM operations WHERE project_id=? ORDER BY rowid').all(project) as Row[]).map(r=>required(db,String(r.operation_id))));}
 function activeOperations(){return access(false,()=>[] as StudioOperation[],db=>(db.prepare("SELECT operation_id FROM operations WHERE state IN ('running','stopping','unknown') ORDER BY rowid").all() as Row[]).map(r=>required(db,String(r.operation_id))));}
 function recover(){return access(true,()=>fail(),db=>{for(const row of db.prepare("SELECT operation_id FROM operations WHERE state IN ('running','stopping')").all() as Row[]){const op=required(db,String(row.operation_id));saveOperation(db,{...op,state:'unknown',physical_settled:false,updated_at:at()});}});}
 return {mode,setMode,permissions,grant,revoke,begin,stop,finish,reconcile,operation,projectOperations,activeOperations,recover};
}

/** The SDK snapshot flag does not certify Provider settlement. Never refund its reservations. */
export function reportStudioConsumptionStatus(beforeReserved:number|null,usage:unknown,snapshotKnown:boolean):{operation_usage_known:boolean;cumulative_usage_known:boolean;reserved_output_tokens:number|null} {
 const value=usage!==null&&typeof usage==='object'&&!Array.isArray(usage)?(usage as {reservedOutputTokens?:unknown}).reservedOutputTokens:null;
 const reserved=typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:null;
 const baseline=typeof beforeReserved==='number'&&Number.isSafeInteger(beforeReserved)&&beforeReserved>=0?beforeReserved:null;
 return {operation_usage_known:snapshotKnown===true&&baseline!==null&&reserved!==null&&reserved===baseline,cumulative_usage_known:snapshotKnown===true&&reserved===0,reserved_output_tokens:reserved};
}
