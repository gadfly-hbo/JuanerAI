// Synthetic owned writer/readback process. No runtime, credential or network adapter.
import {readFileSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
const spec=JSON.parse(readFileSync(process.argv[2],'utf8')),mode=process.argv[3],store=createLocalCaseAssistantStore({projectRoot:spec.project});
const signal=new AbortController().signal;
async function action(){if(spec.operation==='create')return store.createChild(spec.command,spec.session,spec.preview,signal,()=>{});if(spec.operation==='finish')return store.finishChild(spec.attempt,spec.value,signal);return store.reviewChild(spec.parent,spec.target,spec.command,'adopted','人工核对合成意见',spec.at,spec.source,signal);}
function query(){const db=new DatabaseSync(join(spec.project,'.xanthil/desktop/case-assistant.sqlite'));try{const tables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all().map(r=>r.name);return {version:Number(db.prepare('PRAGMA user_version').get().user_version),tables,rows:Object.fromEntries(['sessions','attempts','receipts','collaboration_children','collaboration_results','collaboration_returns','collaboration_reviews'].filter(t=>tables.includes(t)).map(t=>[t,db.prepare('SELECT * FROM '+t+' ORDER BY 1').all()]))};}finally{db.close();}}
if(mode==='writer'){
 const exec=DatabaseSync.prototype.exec;DatabaseSync.prototype.exec=function(sql){if(sql==='COMMIT'){
  if(spec.point==='after')exec.call(this,sql);
  const hit={pid:process.pid,operation:spec.operation,point:spec.point,sql};writeFileSync(spec.hit,JSON.stringify(hit),{flag:'wx'});process.stdout.write(JSON.stringify(hit)+'\n');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);throw Error('UNREACHABLE');
 }return exec.call(this,sql);};await action();throw Error('COMMIT_NOT_REACHED');
}else{
 const before={...query(),parent:await store.readParentCollaboration(spec.parent)},app=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()});await app.reopen();const recovered={...query(),parent:await store.readParentCollaboration(spec.parent)};let first,second,error;
 try{first=await action();second=await action();}catch(e){error=e.code??e.message;}
 const after={...query(),parent:await store.readParentCollaboration(spec.parent)};writeFileSync(spec.readback,JSON.stringify({pid:process.pid,before,recovered,first,second,error,after,model_calls:0,automatic_delivery:false},null,2),{flag:'wx'});
}
