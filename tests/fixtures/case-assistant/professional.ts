import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createPiProfessionalAgent} from '../../../adapters/agent-pi/professional-agent.ts';
import {offlineResponse,offlineCredentials} from '../xanthil-desktop/offline-professional-provider.ts';
import {completedCase} from './completed-case.ts';
import {decision,config} from './fixtures.ts';
/** Current product composition. Only the external Provider response is synthetic;
 * this helper never creates a completion, grant, draft, receipt or effect itself. */
export async function professionalCase(root:string){
 const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root,assertCompleted:(...args)=>agent.assertCompleted(...args)}),source=await store.readSource(baseline.owner);
 const fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id],outcome:{...decision.outcome,applicable:false,not_applicable_reason:'无因果证据',reassess_trigger:'新证据',reassess_owner:'合成人'}};
 let calls=0;const agent=createPiProfessionalAgent({projectRoot:root,analysisModel:'mimo-v2.6-flash',credentials:offlineCredentials,authorizeWork:(id,phase)=>store.authorizesWork(id,phase),fetch:async(_url,init)=>{
  const dto=JSON.parse(String(init!.body));assert.equal(dto.model,'mimo-v2.6-pro');calls++;return calls%2?offlineResponse(calls,[{name:'propose_decision',args:fields}]):offlineResponse(calls,[],'仅已核验范围的 MODEL 草稿；等待人工审阅。');
 }}),app=createCaseAssistantApplication({store,config,clock:()=>new Date(),agent}),linked=await app.link(source.owner,'合成当前 Case',randomUUID()),session=linked.session;
 async function generate(){const auth=await app.prepare(session.id,'仅当前证据的无行动草稿');assert.deepEqual(auth.blockers,[]);await app.start(session.id,auth.id,true);await app.waitForIdle();const p=await app.read(session.id);assert.ok(p.drafts.length);return p.drafts.at(-1)!;}
 const draft=await generate();return {baseline,store,source,fields,agent,app,session,draft,generate,calls:()=>calls,close:async()=>{await app.close();await agent.waitForIdle();}};
}
