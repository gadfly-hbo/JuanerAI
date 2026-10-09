import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createBrowserMembershipWorkspaceApplication} from '../../../packages/application/browser-membership.ts';
import {startBrowserMembershipServer} from '../../../apps/browser/local-server.ts';
/** Retained actual HTTP→Application→SQLite review regression, using an already qualified synthetic Run5. */
export async function verifyBrowserReview({store,tasks,project_id,projectRoot,task}) {
 const dbpath=join(projectRoot,'.xanthil/desktop/state.sqlite'),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const workspace=createBrowserMembershipWorkspaceApplication({store,tasks,project_id,sources:{async select(){throw new Error('unexpected upload');}}});const server=await startBrowserMembershipServer({store,workspace});
let auth;async function call(path,body,headers=auth){const response=await fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json',origin:server.origin}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,body:await response.json(),headers:response.headers};}
try{const boot=await call('/v1/bootstrap',{token:server.bootstrap},{});auth={cookie:boot.headers.get('set-cookie').split(';')[0],'x-xanthil-control':boot.body.control};const base='/v1/tasks/'+task.task_id+'/review',input={version:'1.0',command_id:randomUUID(),task_id:task.task_id,epoch:task.epoch};
 const opened=await call(base+'/open',input);assert.equal(opened.status,200,'E06-b browser review open must return durable receipt');assert.equal(opened.body.kind,'browser_review_opened');assert.deepEqual((await call('/v1/commands/'+input.command_id)).body,opened.body);assert.deepEqual((await call(base+'/open',input)).body,opened.body);
  assert.equal((await call(base+'/open',input,{cookie:auth.cookie})).status,403);
 let state=(await call('/v1/tasks/'+task.task_id)).body;let review=state.task.reviews.at(-1);assert.equal(state.case.findings.at(-1).facts.verification_status,'verified');assert.equal(state.case.findings.at(-1).facts.comparison_direction,'equal');assert.match(state.case.reports.at(-1).review_content.markdown_text,/本轮总体复购率变化：持平/);assert.doesNotMatch(state.case.reports.at(-1).review_content.markdown_text,/H1：当前期复购率低于对比期/);assert.match(review.fields.closure.insufficient_reason,/总体复购率持平/);assert.equal(review.fields.actor,'');assert.equal(review.fields.closure.route,'insufficient_evidence');
 const save={...input,command_id:randomUUID(),review_id:review.id,review_version:review.sequence,review_sha256:review.sha256,fields:{...review.fields,actor:'合成人审',closure:{...review.fields.closure,disposition:'saved'}}};
 const saved=await call(base+'/save',save);assert.equal(saved.status,200);assert.equal(saved.body.kind,'browser_review_saved');assert.deepEqual((await call(base+'/save',save)).body,saved.body);assert.deepEqual((await call('/v1/commands/'+save.command_id)).body,saved.body);const before=hash(dbpath);assert.equal((await call(base+'/save',{...save,fields:{...save.fields,actor:'different'}})).status,409);assert.equal(hash(dbpath),before);
 state=(await call('/v1/tasks/'+task.task_id)).body;review=state.task.reviews.at(-1);assert.equal(review.sequence,2);
 const submit={version:'1.0',command_id:review.intent_id,task_id:task.task_id,epoch:task.epoch,review_id:review.id,review_version:review.sequence,review_sha256:review.sha256,outcome:'analysis',confirmed:true};
 const beforeChoice=hash(dbpath);await assert.rejects(()=>tasks.submitReview(task.task_id,{review_id:review.id,review_version:review.sequence,review_sha256:review.sha256,intent_id:review.intent_id,outcome:'choice',confirmed:true}),{code:'FORBIDDEN'});assert.equal(hash(dbpath),beforeChoice);assert.equal((await call(base+'/submit',{...submit,outcome:'choice'})).status,400);assert.equal(hash(dbpath),beforeChoice);
 const done=await call(base+'/submit',submit);assert.equal(done.status,200);assert.equal(done.body.kind,'review_submitted');assert.deepEqual((await call('/v1/commands/'+submit.command_id)).body,done.body);assert.deepEqual((await call(base+'/submit',submit)).body,done.body);state=(await call('/v1/tasks/'+task.task_id)).body;assert.equal(state.case.revision.state,'Completed');assert.equal(state.task.review_receipts.length,1);assert.equal(state.task.review_receipts[0].decision_id,null);assert.equal(state.task.review_receipts[0].expected_id,null);return state;
}finally{await server.close();}
}
