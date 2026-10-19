import {judgmentClauseView,judgmentDataStatement,judgmentMaterialSubjectKey,recordAttributionAction,passiveJudgmentGoal} from '../../../packages/product-core/open-analysis-judgment-conditions.ts';
import {reviewedCostCeiling} from '../../../packages/product-core/open-analysis-reviewed-content.ts';

/** Controlled OFFLINE producer, not a semantic oracle or Provider. It consumes
 * the actual received draft/source catalog. Adversarial tests override the
 * correspondences and assert independent, manually specified outcomes. */
export function contentModelUnits(packet:any,units:any[]){
 if(!['reviewable-document/1.1','reviewable-document/1.3','reviewable-document/1.4'].includes(packet.output_contract))return units;
 const {premises,source_ids,scope_sha256}=packet.content_sources;
 return units.map(u=>{
  const materials=judgmentClauseView(u.text).flatMap(statement=>{const actual=judgmentDataStatement(statement),p=actual&&premises.find((p:any)=>p.kind==='data'&&judgmentMaterialSubjectKey(p.subject)===judgmentMaterialSubjectKey(actual.subject));return p?[{statement,premise_id:p.id,source_id:p.source_id,subject:p.subject,state:actual!.state,scope_sha256,role:'statement'}]:[];});
  const operation=u.strategy?(recordAttributionAction(u.strategy.goal)?'attribution':passiveJudgmentGoal.test(u.strategy.goal)?'passive':'analysis'):null;
  const proposal=u.strategy?{statement:u.strategy.goal,operation,owner:u.strategy.owner,objects:source_ids,result:operation==='attribution'?'matching_evidence':operation==='passive'?'retained_analysis':'analysis',role:'primary',premise_ids:operation==='passive'?[]:premises.filter((p:any)=>['authority','time','cost'].includes(p.kind)).map((p:any)=>p.id)}:null;
  const amount=u.strategy&&reviewedCostCeiling(u.strategy.cost),cost=premises.find((p:any)=>p.kind==='cost');
  const quantities=amount&&cost?[{field:'cost',statement:u.strategy.cost,use:amount.use,value:amount.value,unit:amount.unit,owner:u.strategy.owner,premise_id:cost.id,source_id:cost.cost_source_id,scope_sha256}]:[];
  return {...u,content:{materials,proposal,quantities}};
 });
}
export function contentModelRevision(packet:any,changes:any[]){
 if(packet.output_contract!=='reviewable-revision/1.1')return {version:'1.0',snapshot_sha256:packet.snapshot_sha256,changes};
 return {version:'1.1',snapshot_sha256:packet.snapshot_sha256,changes:changes.map(c=>{const {id,...unit}=packet.current_proposal.units.find((u:any)=>u.id===c.claim_id);void id;return {claim_id:c.claim_id,unit:{...unit,text:c.text}};})};
}

/** Test-only migration of pre-GB controlled Provider templates. This is not a
 * production response repair or a semantic oracle. Current natural fixtures
 * bypass it; raw malformed fields/IDs remain malformed. All emitted business
 * words still come from the explicitly supplied old fixture reply. */
export function withNaturalProviderFixture(runtime:any,fixture?:{strategy:any;text:string}){return {...runtime,run:async(i:any)=>{
 const fixtureStrategy=fixture?.strategy;
 let p:any;try{p=JSON.parse(i.prompt.slice(i.prompt.indexOf('\n')+1));}catch{return runtime.run(i);}
 const natural=p.output_contract==='reviewable-document/1.4'||p.current_proposal&&p.output_contract?.version==='1.2';
 if(!natural)return runtime.run(i);
 let input=i;
 if(i.purpose==='report_edit'){const facade={...p,numeric_facts:p.baseline_evidence.report.values.map((n:any)=>({...n,reference_id:n.id})),question_history:p.current_user_input.question_history,evidence:p.baseline_evidence.evidence};input={...i,prompt:i.prompt.slice(0,i.prompt.indexOf('\n')+1)+JSON.stringify(facade)};}

 if(i.purpose==='conclusion_strategy_review'){
  const facade={...p,snapshot:{...p.snapshot,version:'1.14',question:p.current_user_input.question,followup_question:p.current_user_input.current_followup,condition_inputs:p.current_user_input.answers,condition_source_catalog:p.current_user_input.condition_source_catalog??[]},current_user_input:{...p.current_user_input,current_question:p.current_user_input.question},historical_model_context:{entries:[]}};
  input={...i,prompt:i.prompt.slice(0,i.prompt.indexOf('\n')+1)+JSON.stringify(facade)};
 }
 const result=await runtime.run(input);let b:any;try{b=JSON.parse(result.text);}catch{return result;}
 if(i.purpose==='report_edit'&&(b.version==='1.5'||b.version==='1.4'&&fixtureStrategy)){
  let units=(b.version==='1.4'?b.units:b.interpretations.map((v:any)=>({text:v.interpretation,fact_refs:v.fact_refs}))).map((v:any)=>({kind:fixtureStrategy?'strategy':'observation',text:fixture?.text??v.text,fact_refs:v.fact_refs,source_refs:fixtureStrategy?['Q']:[],method:fixtureStrategy?'attribution':null,strategy:fixtureStrategy??null,content:{materials:[],proposal:null,quantities:[]}}));
  if(fixtureStrategy){units=contentModelUnits({...p,output_contract:'reviewable-document/1.1'},units);for(const u of units){const source=p.current_user_input.condition_source_catalog.find((s:any)=>s.text.includes(fixtureStrategy.owner));u.content.actor_links=p.content_sources.premises.filter((w:any)=>['authority','time'].includes(w.kind)).map((w:any)=>({premise_id:w.id,premise_source_id:w.source_id,premise_owner:w.owner,actor_source_id:source.id,actor_quote:fixtureStrategy.owner,scope_sha256:p.content_sources.scope_sha256,revision:p.content_sources.revision}));}}
  return {...result,text:JSON.stringify({version:'1.4',source_sha256:p.source_sha256,units})};
 }
 if(i.purpose==='conclusion_strategy_review'&&['1.0','1.1'].includes(b.version)&&Array.isArray(b.claims)){
  return {...result,text:JSON.stringify({...b,version:'1.2',completeness:b.completeness??{verdict:'complete',reason:'Controlled fixture reviews the complete actual units.'},requirement_coverage:p.requirements.map((r:any)=>({requirement_id:r.id,claim_ids:p.current_proposal.units.map((u:any)=>u.id),verdict:'fulfilled'})),claims:b.claims.map((c:any)=>{const u=p.current_proposal.units.find((u:any)=>u.id===c.claim_id);if(!u)return c;return {...c,kind:u.kind==='strategy'?'strategy':'conclusion',level:u.kind==='strategy'?'hypothesis':'observation',strategy:u.strategy,conditions:c.conditions.map((v:any)=>{const w=p.condition_witnesses.find((w:any)=>w.id===v.id);return w&&v.source_quote===w.source_id?{...v,source_quote:w.source_quote}:v;}),...(u.content?.actor_links?{actor_correspondence:u.content.actor_links.map((a:any)=>({premise_id:a.premise_id,verdict:'same'}))}:{})};})})};
 }
 return result;
}};}
