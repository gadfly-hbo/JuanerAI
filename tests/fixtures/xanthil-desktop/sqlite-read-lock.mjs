// A real, separately owned SQLite writer; no product/SDK/model implementation.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,realpathSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
const [root,holdText,tag]=process.argv.slice(2),hold=Number(holdText);
if(!root||realpathSync(root)!==root||!root.startsWith(resolve(process.env.JUANERAI_NEWARCH_SHORT_ROOT)+'/')||![300,1400].includes(hold)||!tag||!/^[a-z-]+$/.test(tag))throw Error('OWNED_SYNTHETIC_LOCK_REQUIRED');
const db=new DatabaseSync(join(root,'.juanerai/pi-v060/state.sqlite'));
let open=false;const facts={pid:process.pid,hold_ms:hold,root};
try{
 db.exec('PRAGMA busy_timeout=1000; '+(tag==='journal-race'?"BEGIN IMMEDIATE; INSERT INTO records VALUES('f03-fixture','journal','{}','synthetic')":'BEGIN EXCLUSIVE'));open=true;
 if(tag==='journal-race'&&!existsSync(join(root,'.juanerai/pi-v060/state.sqlite-journal')))throw Error('REAL_SQLITE_JOURNAL_REQUIRED');
 facts.locked_at=Date.now();process.send?.({kind:'locked',...facts});
 if(tag==='journal-race'){
  for(let n=0;!existsSync(join(root,'JOURNAL-ALLOW-COMMIT'));n++){if(n>=200)throw Error('JOURNAL_RELEASE_MISSING');await new Promise(resolve=>setTimeout(resolve,10));}
 }else await new Promise(resolve=>setTimeout(resolve,hold));
 if(tag==='journal-race')db.exec("DELETE FROM records WHERE kind='f03-fixture' AND id='journal'");
 facts.before_commit_at=Date.now();db.exec('COMMIT');open=false;facts.released_at=Date.now();
 if(tag==='journal-race'){if(existsSync(join(root,'.juanerai/pi-v060/state.sqlite-journal')))throw Error('SQLITE_COMMIT_MUST_REMOVE_JOURNAL');writeFileSync(join(root,'JOURNAL-COMMITTED'),'committed',{flag:'wx',mode:0o600});}
 writeFileSync(join(root,'LOCK-WRITER-'+tag+'.json'),JSON.stringify(facts,null,2)+'\n',{flag:'wx',mode:0o600});process.send?.({kind:'released',...facts});
}finally{if(open)try{db.exec('ROLLBACK');}catch{}db.close();process.disconnect?.();}
