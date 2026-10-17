import {DatabaseSync} from 'node:sqlite';
import {existsSync,lstatSync,mkdirSync,realpathSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifySavedDecisionReport} from './material-policy.ts';
import type {DecisionBinding,DecisionReportLink,DecisionWriteIntent,DecisionStore} from '../../packages/ports/decision-platform.ts';
const fail=()=>{throw Error('DP_STORE_INVALID');};
const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(x);
const sha=(x:string|Uint8Array)=>createHash('sha256').update(x).digest('hex');
const sourceKey=(s:DecisionReportLink['source'])=>sha(JSON.stringify([s.projectId,s.taskId,s.sourceId,s.revision,s.format,s.filename,s.sha256,s.bytes]));
const envelope=(x:unknown)=>{const body=JSON.stringify(x);return [body,sha(body)] as const;};
function decode<T>(row:Record<string,unknown>|undefined):T|null{
 if(!row)return null;if(typeof row.body!=='string'||row.sha!==sha(row.body))fail();
 try{return JSON.parse(row.body as string) as T;}catch{return fail();}
}
/** Host associations and write intents only. Plugin business data stays in its DB. */
export function createDecisionStore(config:{projectRoot:string;projectId:string;afterCommit?:()=>void}):DecisionStore{
 if(!uuid(config.projectId))fail();const root=realpathSync(config.projectRoot);if(root!==resolve(config.projectRoot))fail();
 const dir=join(root,'.xanthil'),file=join(dir,'decision-platform.sqlite'),applicationId=0x4a445031;
 function safe(path:string,directory=false){if(!existsSync(path))return;const s=lstatSync(path);if(s.isSymbolicLink()||(directory?!s.isDirectory():!s.isFile()||s.nlink!==1))fail();}
 function dbCall<T>(write:boolean,absent:T,fn:(db:DatabaseSync)=>T):T{
  safe(dir,true);for(const p of [file,file+'-wal',file+'-shm'])safe(p);
  if(!existsSync(file)&&!write)return absent;
  let fresh=false;
  if(!existsSync(file)){mkdirSync(dir,{recursive:true,mode:0o700});safe(dir,true);writeFileSync(file,'',{flag:'wx',mode:0o600});fresh=true;}
  const db=new DatabaseSync(file,{readOnly:!write});
  try{
   db.exec('PRAGMA foreign_keys=ON;');
   if(fresh){
    db.exec(`BEGIN IMMEDIATE; PRAGMA application_id=${applicationId}; PRAGMA user_version=1;
     CREATE TABLE meta(project_id TEXT NOT NULL);
     CREATE TABLE task_bindings(id TEXT PRIMARY KEY, task_id TEXT UNIQUE NOT NULL, plugin_id TEXT UNIQUE, body TEXT NOT NULL, sha TEXT NOT NULL);
     CREATE TABLE report_links(id TEXT PRIMARY KEY,binding_id TEXT NOT NULL REFERENCES task_bindings(id),source_key TEXT UNIQUE NOT NULL,physical_name TEXT UNIQUE NOT NULL,plugin_report_id TEXT UNIQUE,body TEXT NOT NULL,sha TEXT NOT NULL,content BLOB NOT NULL);
     CREATE TABLE write_intents(id TEXT PRIMARY KEY,task_id TEXT NOT NULL,body TEXT NOT NULL,sha TEXT NOT NULL);
     CREATE INDEX intent_task ON write_intents(task_id);`);
    db.prepare('INSERT INTO meta VALUES (?)').run(config.projectId);db.exec('COMMIT;');
   }
   if(db.prepare('PRAGMA application_id').get()?.application_id!==applicationId||db.prepare('PRAGMA user_version').get()?.user_version!==1||db.prepare('SELECT project_id FROM meta').get()?.project_id!==config.projectId)fail();
   if(write)db.exec('BEGIN IMMEDIATE;');
   const value=fn(db);
   if(write){db.exec('COMMIT;');config.afterCommit?.();}
   return value;
  }catch(error){if(write){try{db.exec('ROLLBACK;');}catch{}}throw error;}finally{db.close();}
 }
 const readBinding=(db:DatabaseSync,taskId:string)=>{
  const row=db.prepare('SELECT * FROM task_bindings WHERE task_id=?').get(taskId),value=decode<DecisionBinding>(row);
  if(value&&(!uuid(value.id)||!uuid(value.taskId)||!uuid(value.marker)||value.pluginProjectId!==null&&!uuid(value.pluginProjectId)||value.id!==row!.id||value.taskId!==row!.task_id||value.pluginProjectId!==row!.plugin_id))fail();return value;
 };
 const readIntent=(db:DatabaseSync,id:string)=>{
  const row=db.prepare('SELECT * FROM write_intents WHERE id=?').get(id),value=decode<DecisionWriteIntent>(row);
  if(value&&(value.id!==row!.id||value.taskId!==row!.task_id||!validIntent(value)))fail();return value;
 };
 function validIntent(v:DecisionWriteIntent){return uuid(v.id)&&uuid(v.taskId)&&['project','upload','extract','action','task','feedback'].includes(v.kind)&&typeof v.target==='string'&&v.target.length>0&&v.target.length<1024&&/^[a-f0-9]{64}$/.test(v.requestSha256)&&typeof v.startedAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v.startedAt)&&Number.isFinite(Date.parse(v.startedAt))&&['pending','confirmed','unknown'].includes(v.state);}
 function pending(db:DatabaseSync,taskId:string){return db.prepare('SELECT id FROM write_intents WHERE task_id=?').all(taskId).map(row=>readIntent(db,String(row.id))!).filter(v=>v.state!=='confirmed');}
 function readReport(db:DatabaseSync,id:string){
  const row=db.prepare('SELECT * FROM report_links WHERE id=?').get(id),link=decode<DecisionReportLink>(row);if(!link)return null;
  const content=row!.content;if(!(content instanceof Uint8Array)||link.id!==row!.id||link.bindingId!==row!.binding_id||link.physicalName!==row!.physical_name||link.pluginReportId!==row!.plugin_report_id||link.pluginReportId!==null&&! /^[1-9][0-9]*$/.test(link.pluginReportId))fail();
  verifySavedDecisionReport(link.source,content as Uint8Array);
  if(link.source.projectId!==config.projectId||sourceKey(link.source)!==row!.source_key||readBinding(db,link.source.taskId)?.id!==link.bindingId)fail();
  return {link,content:new Uint8Array(content as Uint8Array)};
 }
 return {
  bindings():DecisionBinding[]{return dbCall(false,[],db=>db.prepare('SELECT task_id FROM task_bindings').all().map(row=>readBinding(db,String(row.task_id))!));},
  binding(taskId:string):DecisionBinding|null{return dbCall(false,null,db=>readBinding(db,taskId));},
  prepareBinding(value:DecisionBinding):DecisionBinding{
   if(!uuid(value.id)||!uuid(value.taskId)||!uuid(value.marker)||value.pluginProjectId!==null)fail();
   return dbCall(true,value,db=>{const existing=readBinding(db,value.taskId);if(existing){if(existing.id!==value.id||existing.marker!==value.marker)fail();return existing;}
    const [body,hash]=envelope(value);db.prepare('INSERT INTO task_bindings VALUES (?,?,NULL,?,?)').run(value.id,value.taskId,body,hash);return value;});
  },
  bindProject(taskId:string,pluginProjectId:string):void{
   if(!uuid(pluginProjectId))fail();dbCall(true,undefined,db=>{const b=readBinding(db,taskId);if(!b||b.pluginProjectId&&b.pluginProjectId!==pluginProjectId)fail();const [body,hash]=envelope({...b,pluginProjectId});db.prepare('UPDATE task_bindings SET plugin_id=?,body=?,sha=? WHERE task_id=?').run(pluginProjectId,body,hash,taskId);});
  },
  report(id:string){return dbCall(false,null,db=>readReport(db,id));},
  reports(taskId:string):DecisionReportLink[]{return dbCall(false,[],db=>db.prepare('SELECT r.id FROM report_links r JOIN task_bindings b ON r.binding_id=b.id WHERE b.task_id=?').all(taskId).map(row=>readReport(db,String(row.id))!.link));},
  saveReport(link:DecisionReportLink,content:Uint8Array):void{
   verifySavedDecisionReport(link.source,content);
   if(!uuid(link.id)||!uuid(link.bindingId)||link.source.projectId!==config.projectId||! /^[A-Za-z0-9_-]+\.(md|pdf|pptx)$/.test(link.physicalName)||!link.physicalName.endsWith('.'+link.source.format)||link.pluginReportId!==null)fail();
   dbCall(true,undefined,db=>{if(readBinding(db,link.source.taskId)?.id!==link.bindingId)fail();const existing=readReport(db,link.id);if(existing){if(JSON.stringify({...existing.link,pluginReportId:null})!==JSON.stringify(link))fail();return;}
    const [body,hash]=envelope(link);db.prepare('INSERT INTO report_links VALUES (?,?,?,?,NULL,?,?,?)').run(link.id,link.bindingId,sourceKey(link.source),link.physicalName,body,hash,content);});
  },
  linkReport(id:string,pluginReportId:string):void{
   if(! /^[1-9][0-9]*$/.test(pluginReportId))fail();dbCall(true,undefined,db=>{const value=readReport(db,id);if(!value||value.link.pluginReportId&&value.link.pluginReportId!==pluginReportId)fail();const [body,hash]=envelope({...value!.link,pluginReportId});db.prepare('UPDATE report_links SET plugin_report_id=?,body=?,sha=? WHERE id=?').run(pluginReportId,body,hash,id);});
  },
  begin(intent:DecisionWriteIntent):{created:boolean;intent:DecisionWriteIntent}{
   if(!validIntent(intent)||intent.state!=='pending'||intent.result!==null)fail();
   return dbCall(true,{created:false,intent},db=>{const prior=readIntent(db,intent.id);if(prior){if(JSON.stringify({...prior,state:'pending',result:null})!==JSON.stringify(intent))fail();return {created:false,intent:prior};}
    if(!readBinding(db,intent.taskId)||pending(db,intent.taskId).length)throw Error('DP_BUSY_OR_UNKNOWN');
    const [body,hash]=envelope(intent);db.prepare('INSERT INTO write_intents VALUES (?,?,?,?)').run(intent.id,intent.taskId,body,hash);return {created:true,intent};});
  },
  intent(id:string):DecisionWriteIntent|null{return dbCall(false,null,db=>readIntent(db,id));},
  settle(id:string,state:'confirmed'|'unknown',result:unknown):void{
   if(!['confirmed','unknown'].includes(state))fail();dbCall(true,undefined,db=>{const prior=readIntent(db,id);if(!prior||prior.state==='confirmed'&&(state!=='confirmed'||JSON.stringify(prior.result)!==JSON.stringify(result)))fail();const [body,hash]=envelope({...prior,state,result});db.prepare('UPDATE write_intents SET body=?,sha=? WHERE id=?').run(body,hash,id);});
  },
  pending(taskId:string):DecisionWriteIntent[]{return dbCall(false,[],db=>pending(db,taskId));},
 };
}
