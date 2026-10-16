import {DatabaseSync} from 'node:sqlite';
import {existsSync,lstatSync,realpathSync,chmodSync} from 'node:fs';
import {join,resolve} from 'node:path';
const schema='CREATE TABLE owner_guard(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL CHECK(version=1))';
function unavailable():never{throw Object.assign(new Error('RS_OWNER_UNAVAILABLE'),{code:'RS_OWNER_UNAVAILABLE',statusCode:409});}
/** Cooperating local instances only. OS releases this SQLite lock on process death; no PID stealing. */
export function acquireBuiltinStudioOwner(dataRoot:string){
 if(realpathSync(dataRoot)!==resolve(dataRoot)||!lstatSync(dataRoot).isDirectory())unavailable();
 const file=join(dataRoot,'.juanerai-owner.sqlite'),existed=existsSync(file);
 if(existed){const stat=lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)unavailable();}
 const db=new DatabaseSync(file);let closed=false;
 try{
  db.exec('PRAGMA busy_timeout=0');
  if(!existed){db.exec('BEGIN IMMEDIATE');db.exec(`PRAGMA application_id=1381191473;PRAGMA user_version=1;${schema};INSERT INTO owner_guard VALUES(1,1);COMMIT`);chmodSync(file,0o600);}
  db.exec('BEGIN EXCLUSIVE');
  const application=db.prepare('PRAGMA application_id').get(),version=db.prepare('PRAGMA user_version').get(),rows=db.prepare('SELECT id,version FROM owner_guard').all(),tables=db.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'").all();
  if(application?.application_id!==1381191473||version?.user_version!==1||JSON.stringify(rows)!=='[{"id":1,"version":1}]'||tables.length!==1||tables[0].sql!==schema)unavailable();
 }catch{try{db.exec('ROLLBACK');}catch{}db.close();unavailable();}
 return {close(){if(closed)return;closed=true;try{db.exec('ROLLBACK');}finally{db.close();}}};
}
