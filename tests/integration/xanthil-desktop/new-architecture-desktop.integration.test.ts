import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {openConfirmedDesktopRevision} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import {createLocalDesktopDecisionCaseStore} from '../../../adapters/storage-local/desktop-state.ts';
import {createXanthilDesktopDecisionCaseApplication} from '../../../packages/application/xanthil-desktop-decision-case.ts';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';

for(const wrongScope of [false,true])test('MA/D07 Desktop disclosure -> same SDK -> '+(wrongScope?'wrong scope refuses publication':'qualified pending draft -> explicit human adoption and exact reopen'),{timeout:30000},async()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'d-')),setup=await openConfirmedDesktopRevision(root);
 let calls=0;const content={question_text:'合成问题的候选表达',hypothesis_display_title:'待核对',business_context:'仅本次合成资料',alternative_explanations:['可能仅为资料差异']};
 const store=createLocalDesktopDecisionCaseStore({projectRoot:root,assertCompleted:(...args:Parameters<typeof agent.assertCompleted>)=>agent.assertCompleted(...args)});
 const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',authorizeWork:(id,phase)=>store.authorizesProfessionalWork(id,phase),credentials:{withCredential:async(_p,run)=>run({key:'synthetic',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash'})},fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));calls++;assert.equal(dto.model,'mimo-v2.6-flash');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);
  const delta=calls===1?{role:'assistant',tool_calls:[{index:0,id:'draft',type:'function',function:{name:'propose_professional_draft',arguments:JSON.stringify(content)}}]}:{role:'assistant',content:'MODEL草稿，等待人工采纳。'};
  return new Response('data: '+JSON.stringify({id:'synthetic-desktop',object:'chat.completion.chunk',choices:[{index:0,delta,finish_reason:calls===1?'tool_calls':'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 const selected=wrongScope?{...agent,advance:(turn:Parameters<typeof agent.advance>[0])=>agent.advance({...turn,identity:{...turn.identity,scope_sha256:'c'.repeat(64)}})}:agent;
 const app=createXanthilDesktopDecisionCaseApplication({store,agent:selected,analysisExecution:setup.analysisExecution,runEvidenceStore:setup.runEvidenceStore,clock:()=>new Date(),deadlineScheduler:setup.deadlines.scheduler});
 assert.equal(typeof app.startAssistance,'function','Desktop must retain its explicit professional draft entry through the new executor');
 let projection=await store.readProjection(setup.owner);const command=()=>({contract_version:'1.0',command_id:randomUUID(),...setup.owner,expected_row_version:String(projection.revision!.row_version)});
 try{
  await app.openProject({contract_version:'1.0',command_id:randomUUID(),proposed_project_id:setup.owner.project_id,display_name:'Synthetic Project'});
  const {command_id:unused,...guard}=command();void unused;const preview=await app.prepareAssistanceDisclosure({...guard,action_kind:'organize_question',requested_provider:'xiaomi-token-plan-cn',requested_model:'mimo-v2.6-flash'});
  projection=await app.decideAssistanceDisclosure({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});assert.equal(calls,0);
  const request={...command(),disclosure_id:projection.disclosures.at(-1)!.disclosure_id};
  let failure:unknown;try{await app.startAssistance(request);await app.waitForIdle();}catch(error){failure=error;}projection=await app.readProjection(setup.owner);
  if(wrongScope){
   const {createPiBusinessPersistence}=await import('../../../adapters/agent-pi/persistent-runtime-state.ts'),state=createPiBusinessPersistence({projectRoot:root,isAuthorized:()=>true}),audit=state.readWorkAudit(setup.owner.case_id);
   assert.equal((failure as {code?:string})?.code,'EFFECT_UNCONFIRMED');assert.equal(calls,2);assert.equal(projection.assistance_drafts.length,0);assert.notEqual(projection.revision!.question_text,content.question_text);
   assert.equal(audit.find(e=>e.kind==='run.finished')!.contextVersions.scope,'c'.repeat(64));writeFileSync(join(root,'F01-DESKTOP-REFUSAL.json'),JSON.stringify({code:(failure as {code?:string})?.code,audit,projection},null,2));return;
  }
  assert.equal(failure,undefined);
  assert.equal(calls,2);assert.equal(projection.assistance_drafts.length,1);const draft=projection.assistance_drafts[0]!;assert.deepEqual(draft.generated_content,content);assert.equal(draft.disposition,'pending');assert.notEqual(projection.revision!.question_text,content.question_text);
  await app.startAssistance(request);assert.equal(calls,2,'same explicit command is a receipt read, never a new native operation');
  projection=await app.disposeAssistanceDraft({...command(),draft_id:draft.draft_id,disposition:'adopted',edited_content:null});assert.equal(projection.revision!.question_text,content.question_text);
  const reopened=createLocalDesktopDecisionCaseStore({projectRoot:root});assert.deepEqual((await reopened.readProjection(setup.owner)).assistance_drafts,projection.assistance_drafts);assert.equal(calls,2);
 }finally{await app.close();await agent.waitForIdle();}
});
