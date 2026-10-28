// F01: real SQLite journal lifecycle for a public Adapter regression.
// Only this new synthetic root is owned; no SDK/work transition is implemented here.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,existsSync,realpathSync,lstatSync,symlinkSync,linkSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
const [root,mode]=process.argv.slice(2);
if(!root||realpathSync(root)!==root||!root.startsWith(resolve(process.env.JUANERAI_NEWARCH_SHORT_ROOT)+'/')||!['absent','regular','symlink','hardlink','directory','twice'].includes(mode))throw Error('OWNED_F01_ROOT_REQUIRED');
const file=join(root,'.juanerai/pi-v060/state.sqlite'),journal=file+'-journal',facts={pid:process.pid,root,mode,cycles:[]};
const db=new DatabaseSync(file);let open=false,closed=false;
const begin=()=>{db.exec("BEGIN EXCLUSIVE; INSERT INTO records VALUES('F01_schedule','ephemeral','{}','44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a'); DELETE FROM records WHERE kind='F01_schedule'");open=true;const s=lstatSync(journal);if(!s.isFile()||s.nlink!==1)throw Error('REAL_SINGLE_LINK_SQLITE_JOURNAL_REQUIRED');return {ino:s.ino,nlink:s.nlink,mode:s.mode};};
const release=async i=>{const until=Date.now()+3000;while(!existsSync(join(root,'F01-ALLOW-COMMIT-'+i))){if(Date.now()>until)throw Error('OWNED_F01_RELEASE_MISSING');await new Promise(r=>setTimeout(r,2));}db.exec('COMMIT');open=false;if(existsSync(journal))throw Error('SQLITE_COMMIT_DID_NOT_UNLINK');};
try{
 const first=begin();process.send?.({kind:'locked',pid:process.pid,journal,first});await release(0);facts.cycles.push(first);
 if(mode==='regular'||mode==='twice'){
  const second=begin();facts.cycles.push(second);writeFileSync(join(root,'F01-COMMITTED-0'),JSON.stringify({pid:process.pid,first,second}),{flag:'wx',mode:0o600});
  if(mode==='twice'){await release(1);db.close();closed=true;writeFileSync(join(root,'F01-COMMITTED-1'),'committed',{flag:'wx',mode:0o600});}
  else{await new Promise(r=>setTimeout(r,300));db.exec('COMMIT');open=false;db.close();closed=true;}
 }else{
  db.close();closed=true;
  const canary=join(root,'F01-UNAPPROVED-CANARY.txt');
  if(mode==='symlink')symlinkSync(canary,journal);else if(mode==='hardlink')linkSync(canary,journal);else if(mode==='directory')mkdirSync(journal,{mode:0o700});
  writeFileSync(join(root,'F01-COMMITTED-0'),JSON.stringify({pid:process.pid,first}),{flag:'wx',mode:0o600});
 }
 writeFileSync(join(root,'F01-DETACH-WRITER.json'),JSON.stringify({...facts,closed:true},null,2)+'\n',{flag:'wx',mode:0o600});
}finally{if(open)try{db.exec('ROLLBACK');}catch{}if(!closed)db.close();process.disconnect?.();}
