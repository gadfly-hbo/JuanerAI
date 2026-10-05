import {DatabaseSync} from 'node:sqlite';
import {constants,openSync,closeSync,fstatSync,lstatSync,realpathSync,readFileSync,writeFileSync,fsyncSync,readdirSync,existsSync,renameSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {desktopRuleFailure as fail} from '../../packages/product-core/xanthil-desktop-decision-case.ts';

type Identity={dev:string;ino:string};
type Origin={version:'1.0';root:string;project_id:string;root_identity:Identity;database_identity:Identity};
export type BrowserProjectLease={readonly project_id:string;close():void;check():void};
const leases=new WeakMap<object,{root:string;check:()=>void}>();
const active=new Map<string,()=>void>();
const dbPath=(root:string)=>join(root,'.xanthil','desktop','state.sqlite');
function identity(path:string,directory=false):Identity{const s=lstatSync(path);if(s.isSymbolicLink()||(directory?!s.isDirectory():!s.isFile())||!directory&&s.nlink!==1)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');return {dev:String(s.dev),ino:String(s.ino)};}
const same=(a:Identity,b:Identity)=>a.dev===b.dev&&a.ino===b.ino;
function catalog(directory:string,root:string){if(resolve(directory)!==directory||realpathSync(directory)!==directory)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');identity(directory,true);return join(directory,'browser-origin-'+createHash('sha256').update(root).digest('hex')+'.json');}
function project(root:string,project_id?:string):Origin{
 if(resolve(root)!==root||realpathSync(root)!==root)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');const root_identity=identity(root,true),database_identity=identity(dbPath(root));const db=new DatabaseSync(dbPath(root),{readOnly:true});
 try{if(db.prepare('PRAGMA user_version').get()?.user_version!==120)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');const rows=db.prepare('SELECT project_id FROM projects').all();if(rows.length!==1||typeof rows[0].project_id!=='string'||project_id!==undefined&&rows[0].project_id!==project_id)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');return {version:'1.0',root,project_id:String(rows[0].project_id),root_identity,database_identity};}finally{db.close();}
}
function acquire(origin:Origin):BrowserProjectLease{
 const root=origin.root;if(active.has(root))fail('PROJECT_BUSY');const lock=join(root,'.xanthil','browser-companion.lock.sqlite');let fd:number|undefined;try{fd=openSync(lock,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink!==1)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');}finally{if(fd!==undefined)closeSync(fd);}
 const lockIdentity=identity(lock),db=new DatabaseSync(lock);try{db.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE');}catch{db.close();fail('PROJECT_BUSY');}
 let closed=false;const check=()=>{if(closed)fail('PROJECT_CLOSED');if(realpathSync(root)!==root||!same(identity(root,true),origin.root_identity)||!same(identity(dbPath(root)),origin.database_identity)||!same(identity(lock),lockIdentity))fail('EXISTING_PROJECT_ACTIVATION_CLOSED');};
 const lease={project_id:origin.project_id,check,close(){if(closed)return;closed=true;active.delete(root);try{db.exec('ROLLBACK');}finally{db.close();}}};leases.set(lease,{root,check});active.set(root,check);try{check();return lease;}catch(error){lease.close();throw error;}
}
/** Called only after this entry successfully initialized its exclusive newly created directory. */
export function registerCreatedBrowserProject(directory:string,root:string,project_id:string):BrowserProjectLease{
 const origin=project(root,project_id),path=catalog(directory,root),lease=acquire(origin);let fd:number|undefined;
 try{fd=openSync(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);writeFileSync(fd,JSON.stringify(origin));fsyncSync(fd);closeSync(fd);fd=undefined;const dir=openSync(directory,constants.O_RDONLY|constants.O_NOFOLLOW);try{fsyncSync(dir);}finally{closeSync(dir);}return lease;}catch(error){lease.close();throw error;}finally{if(fd!==undefined)closeSync(fd);}
}
export function reopenBrowserProject(directory:string,root:string):BrowserProjectLease{
 const path=catalog(directory,root);let fd:number|undefined;
 try{fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink!==1||stat.size>4096)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');const origin=JSON.parse(readFileSync(fd,'utf8')) as Origin;if(JSON.stringify(Object.keys(origin).sort())!==JSON.stringify(['version','root','project_id','root_identity','database_identity'].sort())||origin.version!=='1.0'||origin.root!==root)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');const current=project(root,origin.project_id);if(!same(current.root_identity,origin.root_identity)||!same(current.database_identity,origin.database_identity))fail('EXISTING_PROJECT_ACTIVATION_CLOSED');return acquire(origin);}catch(error){if((error as {code?:string}).code==='PROJECT_BUSY')throw error;return fail('EXISTING_PROJECT_ACTIVATION_CLOSED');}finally{if(fd!==undefined)closeSync(fd);}
}
export function browserProjectRoot(lease:BrowserProjectLease):string{const value=leases.get(lease);if(!value)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');value.check();return value.root;}
/** Recheck native path identity before every operational database open. */
export function guardBrowserProjectDatabase(path:string):void{for(const [root,check]of active)if(path===dbPath(root))check();}

/** Private profile catalog: enumerates registrations, never discovers projects by scanning user directories. */
export function listBrowserProjects(directory:string):Array<{project_id:string;display_name:string;root:string}>{
 if(resolve(directory)!==directory||realpathSync(directory)!==directory)fail('EXISTING_PROJECT_ACTIVATION_CLOSED');identity(directory,true);
 const result:Array<{project_id:string;display_name:string;root:string}>=[];
 for(const name of readdirSync(directory)){
  if(!/^browser-origin-[a-f0-9]{64}\.json$/.test(name))continue;
  const path=join(directory,name);let fd:number|undefined;
  try{fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);const stat=fstatSync(fd);if(!stat.isFile()||stat.nlink!==1||stat.size>4096)continue;
   const origin=JSON.parse(readFileSync(fd,'utf8')) as Origin;
   if(Object.keys(origin).sort().join()!=='database_identity,project_id,root,root_identity,version'||origin.version!=='1.0'||typeof origin.root!=='string'||catalog(directory,origin.root)!==path)continue;
   const current=project(origin.root,origin.project_id);if(!same(current.root_identity,origin.root_identity)||!same(current.database_identity,origin.database_identity))continue;
   const db=new DatabaseSync(dbPath(origin.root),{readOnly:true});try{const row=db.prepare('SELECT display_name FROM projects WHERE project_id=?').get(origin.project_id);if(typeof row?.display_name!=='string')continue;result.push({project_id:origin.project_id,display_name:row.display_name,root:origin.root});}finally{db.close();}
  }catch{/* Unavailable or replaced registrations never gain authority by discovery. */}finally{if(fd!==undefined)closeSync(fd);}
 }
 const ids=new Set<string>();for(const row of result){if(ids.has(row.project_id))fail('EXISTING_PROJECT_ACTIVATION_CLOSED');ids.add(row.project_id);}
 return result;
}

function privateFile(path:string,directory=false){
 const stat=lstatSync(path);if(stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==(directory?0o700:0o600)||(directory?!stat.isDirectory():!stat.isFile()||stat.nlink!==1))fail('SERVICE_IDENTITY_INVALID');
 return {dev:String(stat.dev),ino:String(stat.ino)};
}
function privateDirectory(directory:string){if(resolve(directory)!==directory||realpathSync(directory)!==directory)fail('SERVICE_IDENTITY_INVALID');return privateFile(directory,true);}
export function readBrowserServiceIdentity(directory:string):{version:'1.0';instance:string;origin:string;credential:string}{
 privateDirectory(directory);const path=join(directory,'service.json');privateFile(path);const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const stat=fstatSync(fd);if(stat.size>2048)fail('SERVICE_IDENTITY_INVALID');const r=JSON.parse(readFileSync(fd,'utf8'));if(Object.keys(r).sort().join()!=='credential,instance,origin,version'||r.version!=='1.0'||typeof r.instance!=='string'||!/^[a-f0-9-]{36}$/.test(r.instance)||typeof r.credential!=='string'||!/^[a-f0-9]{64}$/.test(r.credential)||typeof r.origin!=='string'||!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(r.origin)||new URL(r.origin).port==='')fail('SERVICE_IDENTITY_INVALID');return r;}finally{closeSync(fd);}
}
/** Held OS/SQLite exclusion, independent of launcher lifetime or PID guesses. */
export function acquireBrowserServiceIdentity(directory:string){
 const rootIdentity=privateDirectory(directory),lockPath=join(directory,'service-lock.sqlite'),fd=openSync(lockPath,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);closeSync(fd);const lockIdentity=privateFile(lockPath);
 const db=new DatabaseSync(lockPath);try{db.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE');}catch{db.close();fail('SERVICE_BUSY');}
 const credential=randomBytes(32).toString('hex'),instance=randomUUID(),path=join(directory,'service.json');let recordIdentity:Identity|undefined,closed=false;
 const check=()=>{if(closed||!same(rootIdentity,privateDirectory(directory))||!same(lockIdentity,privateFile(lockPath))||recordIdentity&&!same(recordIdentity,privateFile(path)))fail('SERVICE_IDENTITY_INVALID');if(recordIdentity){const r=readBrowserServiceIdentity(directory);if(r.instance!==instance||r.credential!==credential)fail('SERVICE_IDENTITY_INVALID');}};
 return {credential,instance,check,publish(origin:string){check();if(recordIdentity||!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(origin))fail('SERVICE_IDENTITY_INVALID');if(existsSync(path)){privateFile(path);renameSync(path,join(directory,'previous-'+randomUUID()+'.json'));}
 const out=openSync(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{writeFileSync(out,JSON.stringify({version:'1.0',instance,origin,credential}));fsyncSync(out);}finally{closeSync(out);}recordIdentity=privateFile(path);check();},close(){if(closed)return;closed=true;try{db.exec('ROLLBACK');}finally{db.close();}}};
}
