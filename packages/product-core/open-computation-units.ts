import {compileOpenSemanticInterpretation,validateOpenSemanticAssessment,type OpenSemanticAssessment} from './open-analysis-semantics.ts';
import {materializeOpenAnalysisSource} from './open-analysis-context.ts';
import type {OpenComputationArtifact,OpenComputationUnitBinding} from '../ports/open-analysis-code.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
function fail(code='CLAIM_UNIT_BASIS_INVALID'):never{throw Object.assign(new Error(code),{code});}
/** Reuses actual task/user/source interpretation, not an algorithm or a unit registry. */
export function bindComputationUnits(primary:OpenComputationArtifact,raw:unknown,input:{source:MemberSourceInspection;messages:readonly {message_id:string;text:string}[];semantics?:OpenSemanticAssessment}):readonly OpenComputationUnitBinding[]{
 if(raw!==undefined&&(!Array.isArray(raw)||raw.length>32))fail();const entries=(raw??[]) as Record<string,unknown>[];
 const seen=new Set<string>(),selected=materializeOpenAnalysisSource(primary.context,input.source,primary.identity.task_id);
 const bindings=primary.claims.map(claim=>{
  const found=entries.filter(x=>x.path===claim.path||x.path===undefined&&primary.claims.length===1);if(found.length>1)fail();const supplied=found[0];let basis:OpenSemanticAssessment|undefined;
  if(supplied){if(!supplied||typeof supplied!=='object'||Object.keys(supplied).some(k=>!['path','evidence'].includes(k))||!Array.isArray(supplied.evidence)||!supplied.evidence.length)fail();seen.add(String(supplied.path??claim.path));
   basis=compileOpenSemanticInterpretation({interpretations:[{dimension:'unit',value:claim.unit,status:'clear',evidence:supplied.evidence}],conflicts:[]},{task_id:primary.identity.task_id,messages:input.messages,inspection:selected});
  }else if(input.semantics){
   const definition=input.semantics.definitions.find(d=>d.dimension==='unit'),i=definition?.interpretation;
   if(definition&&definition.classification!=='MODEL_CANDIDATE'&&(i?.unit?.output_label===claim.unit||i?.unscaled_unit?.output_label===claim.unit||definition.value===claim.unit))basis={...input.semantics,definitions:[definition],conflicts:input.semantics.conflicts.filter(c=>c.dimension==='unit')};
  }
  if(!basis)fail('CLAIM_UNIT_BASIS_REQUIRED');return {claim_path:claim.path,unit:claim.unit,basis};
 });
 if(entries.length!==seen.size)fail();validateComputationUnits(primary,bindings,input.source,input.messages.map(m=>m.text));return bindings;
}
/** A literal witness is necessary, never sufficient to prove unit/method semantics.
 * Actual independent programs, applicable method and claim coverage are still required.
 * Store separately checks these USER sources against the actual owning Task. */
export function validateComputationUnits(primary:OpenComputationArtifact,bindings:readonly OpenComputationUnitBinding[],source:MemberSourceInspection,questions:readonly string[]){
 if(!Array.isArray(bindings)||bindings.length!==primary.claims.length||new Set(bindings.map(b=>b.claim_path)).size!==bindings.length)fail('CLAIM_UNIT_BASIS_REQUIRED');
 const selected=materializeOpenAnalysisSource(primary.context,source,primary.identity.task_id);
 for(const claim of primary.claims){const bound=bindings.find(b=>b.claim_path===claim.path);if(!bound||bound.unit!==claim.unit)fail();const basis=validateOpenSemanticAssessment(bound.basis,questions,primary.identity.task_id,selected),definition=basis.definitions.find(d=>d.dimension==='unit');
  if(basis.definitions.length!==1||!definition||definition.classification==='MODEL_CANDIDATE'||basis.conflicts.some(c=>c.state==='unresolved'))fail('CLAIM_UNIT_CONFLICT');
  const i=definition.interpretation,quotes=i?.evidence.map(e=>e.quote)??(definition.user_quote?[definition.user_quote]:[]);
  if(i&&i.status!=='clear'||!quotes.some(q=>q.includes(claim.unit))||i?.unit&&i.unit.output_label!==claim.unit||i?.unscaled_unit&&i.unscaled_unit.output_label!==claim.unit)fail();
 }
 return bindings;
}
