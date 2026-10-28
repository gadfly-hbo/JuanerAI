import {validateMetricAssetEvidence,metricDefinitionResource} from './metric-asset-adoption.ts';
import type {OpenMetricEvidenceContext} from '../ports/metric-assets.ts';
import {semanticDimensions,validateOpenSemanticAssessment,type OpenSemanticAssessment} from './open-analysis-semantics.ts';
import {validateComputationUnits} from './open-computation-units.ts';
import {materializeOpenAnalysisSource,validateOpenAnalysisContext} from './open-analysis-context.ts';
import {createHash} from 'node:crypto';
import {hashFiniteJson} from './member-task.ts';
import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import type {OpenComputationArtifact,OpenComputationClaim,OpenSourceCoverage} from '../ports/open-analysis-code.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
import type {OpenAnalysisVerification,OpenComputationMethodReview} from '../ports/open-analysis-verifier.ts';
import type {OpenTaskIdentity} from '../ports/open-analysis-store.ts';
function fail(code='INDEPENDENT_EVIDENCE_REQUIRED'):never{throw Object.assign(new Error(code),{code});}
const text=(v:unknown,max=2000)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function computationClaims(raw:unknown):readonly OpenComputationClaim[]{
 if(!Array.isArray(raw)||raw.length>32)fail('CLAIM_INVALID');const seen=new Set<string>();
 return raw.map(item=>{const x=closed(item,['path','label','question','unit','conditions',...(item&&typeof item==='object'&&Object.hasOwn(item,'qualification')?['qualification']:[]),...(item&&typeof item==='object'&&Object.hasOwn(item,'required_semantics')?['required_semantics']:[])]);
  if(typeof x.path!=='string'||x.path.length>1000||x.path!==''&&!/^(?:\/(?:[^~\/]|~[01])*)+$/.test(x.path)||seen.has(x.path)||!text(x.label,200)||!text(x.question)||!text(x.unit,100)||!Array.isArray(x.conditions)||x.conditions.length>32||x.conditions.some(v=>!text(v)))fail('CLAIM_INVALID');
  if(x.qualification!==undefined&&!['arithmetic','source_attribution'].includes(String(x.qualification)))fail('CLAIM_INVALID');
  if(x.required_semantics!==undefined&&(!Array.isArray(x.required_semantics)||x.required_semantics.length>semanticDimensions.length||new Set(x.required_semantics).size!==x.required_semantics.length||x.required_semantics.some(d=>!semanticDimensions.includes(d))))fail('CLAIM_INVALID');
  seen.add(x.path);return structuredClone(x) as OpenComputationClaim;
 });
}
/** Business prerequisite check, not a method/operator registry or an information-complete start gate. */
export function assertComputationPrerequisites(primary:OpenComputationArtifact,semantics:OpenSemanticAssessment|null){
 for(const claim of primary.claims)for(const dimension of claim.required_semantics??[]){
  if(dimension==='unit')continue; // separately grounded per actual claim, not by its label
  const definition=semantics?.definitions.find(d=>d.dimension===dimension);
  if(!definition||definition.classification==='MODEL_CANDIDATE'||definition.interpretation?.status==='ambiguous'||semantics?.conflicts.some(c=>c.dimension===dimension&&c.state==='unresolved'))fail('CLAIM_PREREQUISITE_REQUIRED');
 }
}
/** Exact bounded numeric representation; no tolerance or permissible-method registry. */
function decimal(value:string){
 const m=/^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(value);if(!m)fail('CLAIM_RESULT_INVALID');const exponent=Number(m[4]??0);if(!Number.isSafeInteger(exponent)||Math.abs(exponent)>2000)fail('CLAIM_RESULT_INVALID');
 const digits=m[2]!+(m[3]??''),point=m[2]!.length+exponent;let text=point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point);
 let [whole,tail='']=text.split('.');whole=whole!.replace(/^0+(?=\d)/,'');tail=tail.replace(/0+$/,'');text=(m[1]&&/[1-9]/.test(whole+tail)?'-':'')+whole+(tail?'.'+tail:'');if(text.length>2000)fail('CLAIM_RESULT_INVALID');return text;
}
function fraction(value:string){const parts=value.split('/');if(parts.length>2||parts[1]!==undefined&&!/^[1-9]\d*$/.test(parts[1]))fail('CLAIM_RESULT_INVALID');const a=decimal(parts[0]!),[whole,tail='']=a.split('.'),d=10n**BigInt(tail.length);let n=BigInt(whole!)*d+(a.startsWith('-')?-1n:1n)*BigInt(tail||'0'),denominator=d*BigInt(parts[1]??'1'),x=n<0n?-n:n,y=denominator;while(y){const r=x%y;x=y;y=r;}n/=x;denominator/=x;return {n,d:denominator};}
/** Own JSON members only; original program JSON and types remain in its physical artifact. */
export function computationClaimValue(value:unknown,path:string):unknown{
 let current=value;if(path)for(const token of path.slice(1).split('/').map(v=>v.replace(/~1/g,'/').replace(/~0/g,'~'))){if(!current||typeof current!=='object'||!Object.hasOwn(current,token))fail('CLAIM_RESULT_MISSING');current=Reflect.get(current,token);}
 return current;
}
export function computationNumber(value:unknown,path:string):string{
 const current=computationClaimValue(value,path);
 if(typeof current==='number'){if(!Number.isFinite(current)||Number.isInteger(current)&&!Number.isSafeInteger(current))fail('CLAIM_RESULT_INVALID');return decimal(String(current));}
 if(typeof current!=='string'||current.length>2000)fail('CLAIM_RESULT_INVALID');const q=fraction(current);return current.includes('/')?q.d===1n?String(q.n):q.n+'/'+q.d:decimal(current);
}
/** Exact approved source correspondence only. The quoted opinion is not certified. */
export function computationSourceAttribution(primary:OpenComputationArtifact,claim:OpenComputationClaim,coverage:readonly OpenSourceCoverage[],source:MemberSourceInspection){
 const value=computationClaimValue(primary.value,claim.path);if(typeof value!=='string'||!value.trim()||value.length>4000)fail('SOURCE_ATTRIBUTION_INVALID');
 const matches=new Map<string,{text:string;source_name:string;position:string}>();
 for(const w of coverage.filter(w=>w.claim_path===claim.path)){const s=source.sources.find(s=>s.source_id===w.source_id),sheet=s?.sheets.find(sh=>sh.sheet_id===w.sheet_id&&sh.state==='visible');if(!s||!sheet||s.document&&s.document.status!=='text_observed')fail('SOURCE_ATTRIBUTION_UNCONFIRMED');
  for(const row of sheet.rows.filter(r=>w.rows.includes(r.row)))for(const c of row.cells.filter(c=>w.columns.includes(c.column))){if(c.value.includes(value)){const position=(s.document?row.cells.find(c=>c.column==='A')?.value+' · ':'')+sheet.name+' · row '+row.row+' · '+c.column;matches.set(s.source_id+'/'+sheet.sheet_id+'/'+row.row+'/'+c.column,{text:value,source_name:s.display_name,position});}}
 }
 if(matches.size!==1)fail(matches.size?'SOURCE_ATTRIBUTION_AMBIGUOUS':'SOURCE_ATTRIBUTION_NOT_FOUND');return [...matches.values()][0]!;
}
export function sameComputationNumber(a:string,b:string){const x=fraction(a),y=fraction(b);return x.n*y.d===y.n*x.d;}

export function validateComputationArtifact(a:OpenComputationArtifact,identity:OpenTaskIdentity){
 closed(a,['version','execution_id','identity','code_sha256','source_sha256','input_sha256','work_id','context','value','receipt','classification','verification','claims','method']);
 if(a.version!=='1.0'||!membershipUuid(a.execution_id)||hashFiniteJson(a.identity)!==hashFiniteJson(identity)||a.source_sha256!==identity.scope_sha256||! /^[a-f0-9]{64}$/.test(a.input_sha256)||typeof a.work_id!=='string'||!a.work_id||a.context?.inspection_sha256!==identity.scope_sha256||! /^[a-f0-9]{64}$/.test(a.code_sha256)||a.classification!=='MODEL_COMPUTATION'||a.verification!=='not_performed'||a.receipt.execution_id!==a.execution_id||a.receipt.code_sha256!==a.code_sha256||typeof a.method!=='string'||a.method.length>4000)fail();
 if(hashFiniteJson(computationClaims(a.claims))!==hashFiniteJson(a.claims))fail();
}
export function independentCoverage(raw:unknown,claims:readonly OpenComputationClaim[],source:MemberSourceInspection):readonly OpenSourceCoverage[]{
 if(!Array.isArray(raw)||!raw.length||raw.length>128)fail();const seen=new Set<string>();
 const coverage=raw.map(item=>{const x=closed(item,['claim_path','source_id','sheet_id','columns','rows']);
  if(!claims.some(c=>c.path===x.claim_path)||typeof x.source_id!=='string'||typeof x.sheet_id!=='string'||!Array.isArray(x.columns)||!x.columns.length||x.columns.length>512||new Set(x.columns).size!==x.columns.length||x.columns.some(v=>typeof v!=='string')||!Array.isArray(x.rows)||!x.rows.length||x.rows.length>100000||new Set(x.rows).size!==x.rows.length||x.rows.some(v=>!Number.isSafeInteger(v)||v<2))fail();
  const matches=source.sources.filter(s=>s.source_id===x.source_id),sheet=matches.length===1?matches[0]!.sheets.find(s=>s.sheet_id===x.sheet_id&&s.state==='visible'):null;
  if(!sheet||x.rows.some(row=>{const columns=x.columns as string[],r=sheet.rows.find(r=>r.row===row);return !r||columns.some(column=>!r.cells.some(c=>c.column===column));}))fail('SOURCE_CHANGED');
  const key=hashFiniteJson(x);if(seen.has(key))fail();seen.add(key);return structuredClone(x) as OpenSourceCoverage;
 });
 if(claims.some(c=>!coverage.some(w=>w.claim_path===c.path)))fail('VERIFICATION_COVERAGE_INCOMPLETE');return coverage;
}
export function computationReviewSubject(primary:OpenComputationArtifact,independent:OpenComputationArtifact,coverage:readonly OpenSourceCoverage[],units:{asset_context:OpenMetricEvidenceContext|null;semantic_context:OpenSemanticAssessment|null;unit_bindings:readonly import('../ports/open-analysis-code.ts').OpenComputationUnitBinding[];unit_questions:readonly string[]}){return hashFiniteJson({identity:primary.identity,work_id:primary.work_id,context:primary.context,input_sha256:primary.input_sha256,primary:primary.execution_id,independent:independent.execution_id,primary_code:primary.code_sha256,independent_code:independent.code_sha256,source:primary.source_sha256,claims:primary.claims,method:primary.method,independent_method:independent.method,coverage,asset_context:units.asset_context,semantic_context:units.semantic_context,unit_bindings:units.unit_bindings,unit_questions:units.unit_questions});}
export function compileComputationMethodReview(raw:string,input:{primary:OpenComputationArtifact;independent:OpenComputationArtifact;coverage:readonly OpenSourceCoverage[];asset_context:OpenMetricEvidenceContext|null;semantic_context:OpenSemanticAssessment|null;unit_bindings:readonly import('../ports/open-analysis-code.ts').OpenComputationUnitBinding[];unit_questions:readonly string[];primary_code:string;independent_code:string;reads:readonly import('../ports/analysis-agent.ts').AnalysisResourceRead[];reviewer:OpenComputationMethodReview['reviewer']}):OpenComputationMethodReview{
 for(const [artifact,code]of [[input.primary,input.primary_code],[input.independent,input.independent_code]] as const){
  const path=`computation/${artifact.execution_id}/program.py`,sha256=createHash('sha256').update(code).digest('hex'),count=code.split('\n').length-(code.endsWith('\n')?1:0),covered=new Set<number>();
  if(sha256!==artifact.code_sha256)fail('VERIFICATION_METHOD_READ_REQUIRED');
  for(const r of input.reads)if(r.path===path&&r.sha256===sha256)for(let line=r.first_line;line<=r.last_line;line++)covered.add(line);
  for(let line=1;line<=count;line++)if(!covered.has(line))fail('VERIFICATION_METHOD_READ_REQUIRED');
 }
 if(input.asset_context){const resource=metricDefinitionResource(input.asset_context),covered=new Set<number>();for(const r of input.reads)if(r.path===resource.path&&r.sha256===resource.sha256)for(let line=r.first_line;line<=r.last_line;line++)covered.add(line);for(let line=1;line<=resource.lines;line++)if(!covered.has(line))fail('VERIFICATION_ASSET_READ_REQUIRED');}
 let value:unknown;try{value=JSON.parse(raw);}catch{fail('VERIFICATION_METHOD_INVALID');}const x=closed(value,['version','subject_sha256','claims']);
 if(x.version!=='1.0'||x.subject_sha256!==computationReviewSubject(input.primary,input.independent,input.coverage,input)||!Array.isArray(x.claims)||x.claims.length!==input.primary.claims.length)fail('VERIFICATION_METHOD_INVALID');
 const seen=new Set<string>();
 for(const raw of x.claims){const c=closed(raw,['path','applicability','independence','coverage','primary_code_lines','independent_code_lines','limitations',...(raw&&typeof raw==='object'&&input.asset_context?.claims.some(a=>a.claim_path===Reflect.get(raw,'path'))?['asset_conformance']:[])]);
  if(typeof c.path!=='string'||seen.has(c.path)||!input.primary.claims.some(v=>v.path===c.path)||!Array.isArray(c.limitations)||c.limitations.some(v=>!text(v,4000)))fail('VERIFICATION_METHOD_INVALID');seen.add(c.path);
  for(const key of ['applicability','independence','coverage',...(input.asset_context?.claims.some(a=>a.claim_path===c.path)?['asset_conformance']:[])]){const r=closed(c[key],['verdict','reason']);if(!['supported','insufficient','conflict'].includes(String(r.verdict))||!text(r.reason,4000))fail('VERIFICATION_METHOD_INVALID');}
  for(const [key,code]of [['primary_code_lines',input.primary_code],['independent_code_lines',input.independent_code]] as const){const lines=c[key];if(!Array.isArray(lines)||!lines.length||new Set(lines).size!==lines.length||lines.some(v=>!Number.isSafeInteger(v)||v<1||v>code.split('\n').length))fail('VERIFICATION_METHOD_INVALID');}
 }
 if(input.reviewer.role!=='method_review'||input.reviewer.computation_id!==input.primary.execution_id||!text(input.reviewer.completion_id)||!text(input.reviewer.provider)||!text(input.reviewer.model))fail('VERIFICATION_METHOD_INVALID');
 return {...structuredClone(x),reads:structuredClone(input.reads),reviewer:input.reviewer} as OpenComputationMethodReview;
}
function assertMethodReview(review:OpenComputationMethodReview,primary:OpenComputationArtifact,independent:OpenComputationArtifact,coverage:readonly OpenSourceCoverage[],units:{asset_context:OpenMetricEvidenceContext|null;semantic_context:OpenSemanticAssessment|null;unit_bindings:readonly import('../ports/open-analysis-code.ts').OpenComputationUnitBinding[];unit_questions:readonly string[]}){
 if(!review||review.version!=='1.0'||review.subject_sha256!==computationReviewSubject(primary,independent,coverage,units)||review.reviewer?.role!=='method_review'||review.reviewer.computation_id!==primary.execution_id||!review.reviewer.completion_id||!Array.isArray(review.reads)||!review.reads.length||review.claims.length!==primary.claims.length||new Set(review.claims.map(c=>c.path)).size!==primary.claims.length||primary.claims.some(c=>!review.claims.some(v=>v.path===c.path)))fail('VERIFICATION_METHOD_REQUIRED');
 for(const c of review.claims)for(const r of [c.applicability,c.independence,c.coverage,...(units.asset_context?.claims.some(a=>a.claim_path===c.path)?[c.asset_conformance]:[])])if(r?.verdict!=='supported'||!text(r.reason,4000))fail('VERIFICATION_METHOD_UNSUPPORTED');
}
/** Recomputing from the same originals is necessary, but equality is not its proof.
 * The caller additionally binds source-only Agent completion and actual executor seals.
 * This pure check never grants qualification to an arbitrary JSON/hash/grade object. */
export function qualifyIndependentComputation(input:{primary:OpenComputationArtifact;independent:OpenComputationArtifact;source:MemberSourceInspection;method:string;rationale:string;coverage:readonly OpenSourceCoverage[];method_review:OpenComputationMethodReview;asset_context:OpenMetricEvidenceContext|null;semantic_context:OpenSemanticAssessment|null;unit_bindings:readonly import('../ports/open-analysis-code.ts').OpenComputationUnitBinding[];unit_questions:readonly string[]}):OpenAnalysisVerification{
 const {primary,independent,source}=input;validateComputationArtifact(primary,primary.identity);validateComputationArtifact(independent,primary.identity);
 if(!primary.claims.length||!text(primary.method,4000)||!text(input.method,4000)||!text(input.rationale,4000)||primary.execution_id===independent.execution_id||primary.code_sha256===independent.code_sha256||primary.source_sha256!==hashFiniteJson(source)||hashFiniteJson(primary.claims)!==hashFiniteJson(independent.claims)||independent.method!==input.method)fail('VERIFICATION_INDEPENDENCE_REQUIRED');
 if(input.semantic_context)validateOpenSemanticAssessment(input.semantic_context,input.unit_questions,primary.identity.task_id,source);assertComputationPrerequisites(primary,input.semantic_context);
 validateMetricAssetEvidence(primary,input.asset_context,source);
 validateComputationUnits(primary,input.unit_bindings,source,input.unit_questions);
 const selected=materializeOpenAnalysisSource(primary.context,source,primary.identity.task_id);if(hashFiniteJson(primary.context)!==hashFiniteJson(independent.context)||primary.work_id!==independent.work_id||primary.input_sha256!==hashFiniteJson(selected)||independent.input_sha256!==primary.input_sha256)fail('VERIFICATION_BINDING_CHANGED');
 const coverage=independentCoverage(input.coverage,primary.claims,selected);
 if(coverage.some(w=>selected.sources.find(s=>s.source_id===w.source_id)?.document?.status==='ocr_unconfirmed'))fail('SOURCE_UNQUALIFIED');
 let numeric=0,attributions=0;
 const discrepancies=primary.claims.flatMap(c=>{const left=computationClaimValue(primary.value,c.path),right=computationClaimValue(independent.value,c.path);if(c.qualification==='source_attribution'){if(left!==right)fail('VERIFICATION_DISCREPANCY');computationSourceAttribution(primary,c,coverage,selected);attributions++;return [];}if(left===null&&right===null)return [];if(left===null||right===null)fail('VERIFICATION_DISCREPANCY');const a=computationNumber(primary.value,c.path),b=computationNumber(independent.value,c.path);numeric++;return sameComputationNumber(a,b)?[]:[{path:c.path,primary:a,independent:b}];});
 if(!numeric&&!attributions)fail('INDEPENDENT_NUMERIC_EVIDENCE_REQUIRED');
 if(discrepancies.length)fail('VERIFICATION_DISCREPANCY');assertMethodReview(input.method_review,primary,independent,coverage,input);
 return {version:'1.0',grade:numeric?'independent_arithmetic':'source_attribution',asset_context:structuredClone(input.asset_context),semantic_context:structuredClone(input.semantic_context),unit_bindings:structuredClone(input.unit_bindings),unit_questions:structuredClone(input.unit_questions),inspection_sha256:hashFiniteJson(source),result_sha256:hashFiniteJson(primary),independent:structuredClone(independent),coverage,method:{primary:primary.method,independent:input.method,rationale:input.rationale,assessment:'NON_AUTHOR_METHOD_REVIEW',review:structuredClone(input.method_review)},discrepancies,limits:['资格按逐主张区分：数值仅在实际独立重算成立时为independent_arithmetic；原文只作source_attribution，观点真实性及因果未核验；空值不授算术资格。','仅覆盖所列原始资料、主张路径、单位和条件下的独立重算／原文对应；不证明资料完整性、企业口径、方法的普遍适用性或因果。','方法适用理由属于独立上下文的MODEL判断；缺少独立原始取证或覆盖时不得仅因数值相等通过。']};
}
export function validateIndependentComputation(primary:OpenComputationArtifact,v:OpenAnalysisVerification,source:MemberSourceInspection){
 const expected=qualifyIndependentComputation({primary,independent:v.independent,source,method:v.method?.independent,rationale:v.method?.rationale,coverage:v.coverage,method_review:v.method?.review,asset_context:v.asset_context,semantic_context:v.semantic_context,unit_bindings:v.unit_bindings,unit_questions:v.unit_questions});
 if(hashFiniteJson(v)!==hashFiniteJson(expected))fail('VERIFICATION_CHANGED');return expected;
}
