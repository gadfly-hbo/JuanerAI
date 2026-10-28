// Presentation of Store-qualified claims. No execution or qualification authority.
export function openAnalysisFindings(task){
 const out=task.outcome;
 if(!out){
  const same=record=>['task_id','revision','run_id','attempt_id','operation_id','grant_id','scope_sha256','config_sha256'].every(k=>typeof task.identity?.[k]==='string'&&record.identity?.[k]===task.identity[k]);
  const pointer=(value,path)=>{let v=value;if(path)for(const encoded of path.slice(1).split('/')){const key=encoded.replaceAll('~1','/').replaceAll('~0','~');if(!v||typeof v!=='object'||!Object.hasOwn(v,key))return null;v=v[key];}return typeof v==='number'&&Number.isFinite(v)?String(v):typeof v==='string'&&v.length<=200?v:null;};
  return (task.computation_records??[]).filter(record=>same(record)&&record.classification==='MODEL_COMPUTATION'&&record.verification==='not_performed'&&record.source_sha256===task.identity.scope_sha256&&record.receipt?.status==='unqualified').flatMap(record=>(record.claims??[]).map(claim=>({id:record.execution_id+':'+claim.path,claim:claim.label,value:pointer(record.value,claim.path),unit:claim.unit,group:null,rows:(record.context.source_facts??[]).reduce((n,f)=>n+f.data_rows,0),status:'not_performed',evidence:{task_id:task.identity.task_id,revision:task.identity.revision,run_id:record.identity.run_id,outcome_id:null,scope_sha256:task.identity.scope_sha256,reference_id:claim.path,result_sha256:record.receipt.outputs?.result?.sha256??null,proof_sha256:null,executions:[]},support:{status:'not_checked',description:'已保存本次实际程序产物，尚未独立核验；行数只表示实际输入资料行数，不表示主张核验覆盖。单位及方法仍是模型提出的说明。'},counterevidence:{status:'not_checked',description:'尚未完成原始来源独立取证、方法适用性或反证检查。'},unknowns:['独立核验资格、方法与单位、业务解释及未提供条件仍待确认。'],limitations:['这是MODEL_COMPUTATION/not_performed部分观察，不是正式Outcome、独立核验数字、人的业务决定或行动。',...claim.conditions]})));
 }
 if(!['task_id','revision','scope_sha256','config_sha256'].every(k=>out?.identity?.[k]===task.identity?.[k])||!out?.identity?.run_id||!out.outcome_id||!Array.isArray(out.computations)||!out.computations.length)return [];
 const qualified=out.computations,values=out.numeric_report?.values??[];
 if(qualified.some(f=>!['independent_arithmetic','source_attribution'].includes(f.verification?.grade)||f.verification.inspection_sha256!==task.identity.scope_sha256||!f.verification.result_sha256||f.verification.discrepancies?.length))return [];
 const original=new Map();let ordinal=0;for(const fact of qualified)for(const claim of fact.calculation.claims)original.set('F'+(++ordinal),{fact,claim});
 function support(id,seen=new Set()){
  if(seen.has(id))return [];const next=new Set(seen);next.add(id);const value=values.find(v=>v.id===id);if(!value)return [];
  if(value.grade==='derived_formula')return value.references.flatMap(ref=>support(ref,next));
  const actual=original.get(id);return actual&&value.proof_sha256? [actual]:[];
 }
 const source={task_id:task.identity.task_id,revision:task.identity.revision,run_id:out.identity.run_id,outcome_id:out.outcome_id,scope_sha256:task.identity.scope_sha256};
 return values.filter(v=>v.status==='verified'&&v.source_sha256===task.identity.scope_sha256).flatMap(v=>{
  const proofs=support(v.id),byExecution=new Map();if(!proofs.length)return [];
  for(const {fact,claim} of proofs){const paths=byExecution.get(fact.calculation.execution_id)?.paths??new Set();paths.add(claim.path);byExecution.set(fact.calculation.execution_id,{fact,paths});}
  const executions=[...byExecution.values()].map(({fact:f,paths})=>({execution_id:f.calculation.execution_id,source_sha256:f.verification.inspection_sha256,result_sha256:f.verification.result_sha256,independent_execution_id:f.verification.independent.execution_id,claim_paths:[...paths],coverage:f.verification.coverage.filter(w=>paths.has(w.claim_path)),method:{primary:f.verification.method.primary,independent:f.verification.method.independent,rationale:f.verification.method.rationale,assessment:f.verification.method.assessment,claims:f.verification.method.review.claims.filter(c=>paths.has(c.path)).map(({path,applicability,independence,coverage,limitations})=>({path,applicability,independence,coverage,limitations}))}}));
  const rows=new Set(executions.flatMap(e=>e.coverage.flatMap(w=>w.rows.map(row=>w.source_id+'/'+w.sheet_id+'/'+row)))).size;
  return [{id:out.outcome_id+':'+v.id,claim:v.label,value:v.value,unit:v.unit,group:null,rows,status:v.grade,evidence:{...source,reference_id:v.id,result_sha256:v.result_sha256,proof_sha256:v.proof_sha256,executions},support:{status:'checked',description:v.grade==='source_attribution'?'同版获准原文、具体位置和文字对应已核对；所引观点真实性、总体及因果未核验。':v.grade==='derived_formula'?'同版已核验操作数的公式、单位及显示关系已检查；不新增独立原始来源。':'同版原始来源独立重算、逐主张覆盖与方法审查均有实际凭证。'},counterevidence:{status:'not_checked',description:'算术/来源核验不替代针对原因解释的适用反证。'},unknowns:['业务原因、替代解释及外部总体仍须相应证据。'],limitations:[...v.limitations]}];
 });
}
