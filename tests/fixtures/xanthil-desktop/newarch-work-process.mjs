import {writeFileSync,existsSync,appendFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createRuntime,createPiTransport} from 'pi-agent-runtime';
import {createPiBusinessPersistence} from '../../../adapters/agent-pi/persistent-runtime-state.ts';
const [root,work,task,other]=process.argv.slice(2);
if(!root||!root.startsWith(resolve(process.env.JUANERAI_NEWARCH_SHORT_ROOT)+'/'))throw Error('OWNED_SYNTHETIC_ROOT_REQUIRED');
const state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true});state.bindBusinessWork({work_id:work,command_id:task,task_id:task,config_sha256:'a'.repeat(64),purposes:['analysis'],recovery_limit:1});
const model={provider:'synthetic',id:'process-work',protocol:'openai-completions',endpoint:'https://synthetic.invalid/v1',contextWindow:200000,maxOutputTokens:32768};let calls=0;
const transport=createPiTransport({model,apiKey:'synthetic',fetch:async()=>{calls++;if(calls===1){writeFileSync(join(root,'main-'+task),'sent',{flag:'wx',mode:0o600});for(let n=0;!existsSync(join(root,'main-'+other));n++){if(n>=500)throw Error('OTHER_SYNTHETIC_PROCESS_MISSING');await new Promise(r=>setTimeout(r,10));}return new Response('{"error":{"code":"unavailable"},"usage":{"prompt_tokens":0,"completion_tokens":0}}',{status:503,headers:{'content-type':'application/json'}});}writeFileSync(join(root,'extra-'+task),'sent',{flag:'wx',mode:0o600});return new Response('data: '+JSON.stringify({id:'process',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'synthetic'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});}});
// Observe only this new synthetic process's public calls; do not retry, alter,
// classify or consume a failed result. The actual durable Adapter remains used.
const errors=join(root,'public-errors-'+task+'.jsonl');
const observe=(phase,operation)=>(...args)=>{const failed=error=>{appendFileSync(errors,JSON.stringify({phase,pid:process.pid,at:Date.now(),name:error?.name,reason:error?.reason,code:error?.code,message:error?.message,stack:error?.stack})+'\n',{mode:0o600});throw error;};try{const value=operation(...args);return value instanceof Promise?value.catch(failed):value;}catch(error){return failed(error);}};
const budgets={...state.budgets,work:{read:observe('work.read',state.budgets.work.read),atomic:observe('work.atomic',state.budgets.work.atomic)},claimUncapped:observe('budget.claim',async(...args)=>{const lease=await state.budgets.claimUncapped(...args);return new Proxy(lease,{get(target,key){const value=Reflect.get(target,key);return typeof value==='function'?observe('budget.'+String(key),value):value;}});})};
// This process owns only this synthetic SQLite root. Observe native SQLite
// exceptions without substituting values, delaying, retrying or changing SQL.
const {DatabaseSync,StatementSync}=await import('node:sqlite');
for(const [prototype,names] of [[DatabaseSync.prototype,['exec','prepare']],[StatementSync.prototype,['get','all','run']]])for(const name of names){const original=prototype[name];prototype[name]=function(...args){try{return Reflect.apply(original,this,args);}catch(error){appendFileSync(errors,JSON.stringify({phase:'native.sqlite.'+name,pid:process.pid,at:Date.now(),name:error?.name,code:error?.code,errcode:error?.errcode,message:error?.message,stack:error?.stack})+'\n',{mode:0o600});throw error;}};}
const runtime=createRuntime({model,transport,budgets,audit:{append:observe('audit.append',state.audit.append)},authorize:async()=>true,contextAdmission:{policyVersion:'d-process',protocolOverheadTokens:4096,safetyMarginTokens:8192}});
const result=await runtime.runText({taskId:task,work:{ref:work,chain:task,limit:1},prompt:'synthetic',limits:{cumulative:'unlimited',maxOutputTokens:32768,modelTimeoutMs:600000,toolTimeoutMs:300000,controlTimeoutMs:30000},modelRecovery:{extraAttempts:1}});await runtime.waitForIdle(task);
writeFileSync(join(root,'result-'+task+'.json'),JSON.stringify({pid:process.pid,calls,result,account:state.readAccounting(task)}),{flag:'wx',mode:0o600});
