// Test-only, one-shot persistence fault. Does not change schema or replace a Store.
const {DatabaseSync}=require('node:sqlite');
const {realpathSync}=require('node:fs');
const {isAbsolute}=require('node:path');
exports.installDeliveryWriteFault=function(){
 const original=DatabaseSync.prototype.prepare;let armed=null;const hits=[];
 function prepare(sql,...options){
  const statement=original.call(this,sql,...options);
  if(sql!=='UPDATE collaboration_returns SET body=?,sha256=? WHERE id=?')return statement;
  const db=this,run=statement.run;
  statement.run=function(...args){
   if(armed&&JSON.parse(String(args[0])).status==='returned'){
    const file=original.call(db,'PRAGMA database_list').all().find(row=>row.name==='main')?.file;
    if(file===armed.path){
     const row=original.call(db,'SELECT body FROM collaboration_results WHERE id=? AND child_id=?').get(args[2],armed.child);
     if(row){
      const result=JSON.parse(row.body),attempt=JSON.parse(original.call(db,'SELECT body FROM attempts WHERE id=?').get(result.attempt_id).body);
      if(attempt.status!=='Succeeded')throw Error('FIXTURE_RESULT_NOT_COMMITTED');
      hits.push({child:armed.child,result_id:result.id,version:result.version,sha256:result.sha256,attempt_id:attempt.id,attempt_status:attempt.status,boundary:'before-return-update'});
      armed=null;throw Error('synthetic delivery unavailable');
     }
    }
   }
   return run.apply(this,args);
  };
  return statement;
 }
 DatabaseSync.prototype.prepare=prepare;
 return {
  arm(path,child){if(armed||!isAbsolute(path)||!child)throw Error('INVALID_FIXTURE_TARGET');armed={path:realpathSync(path),child};},
  read(){return {armed:armed?{...armed}:null,hits:hits.map(hit=>({...hit}))};},
  restore(){if(DatabaseSync.prototype.prepare!==prepare)throw Error('FIXTURE_OWNER_CHANGED');DatabaseSync.prototype.prepare=original;},
 };
};
