import {hashFiniteJson} from './member-task.ts';
import {qualifiedReportValues} from './open-analysis-numeric-report.ts';
/** Current authorized receipts only; no Store history or private instruction crosses this seam. */
export function reportCollaborationOpinions(receipts:readonly unknown[]){
 return receipts.map((raw:any)=>{
  if(!raw||raw.classification!=='MODEL')fail();
  if(raw.result){
   const result=raw.result,value=result.value;
   if(typeof result.id!=='string'||typeof result.child_session_id!=='string'||value?.kind!=='result'||typeof value.summary!=='string'||!Array.isArray(value.limitations)||!Array.isArray(value.unknowns)||[...value.limitations,...value.unknowns].some(v=>typeof v!=='string'))fail();
   return {classification:'MODEL',verification:'not_performed',state:'returned',child_id:result.child_session_id,result_id:result.id,summary:value.summary,limitations:value.limitations,unknowns:value.unknowns};
  }
  if(typeof raw.child_id!=='string'||!['Running','Waiting','Failed','Stopped','Interrupted','Unknown'].includes(raw.state)||(raw.reason!==null&&typeof raw.reason!=='string'))fail();
  return {classification:'MODEL',verification:'not_performed',state:raw.state,child_id:raw.child_id,reason:raw.reason};
 });
}
export const reportEditMarker='JuanerAI.report-edit.v1\n';
/** Audit checkpoint keeps the draft; the model receives only current grounded material. */
export function reportEditModelPrompt(auditPrompt:string){
 if(!auditPrompt.startsWith(reportEditMarker))fail();let body;try{body=JSON.parse(auditPrompt.slice(reportEditMarker.length));}catch{fail();}
 const {draft,...material}=body;
 if(typeof draft!=='string')fail();
 if(['1.3','1.4','1.5'].includes(material.output_contract)){
  const facts=qualifiedReportValues(body.evidence,{identity:body.identity,sources:body.sources});
  return reportEditMarker+JSON.stringify({version:material.version,output_contract:material.output_contract,...(material.output_contract==='1.5'?{fact_fragments:facts.map(f=>({reference_id:f.id,label:f.label,value:f.value,display:f.display,unit:f.unit,grade:f.grade,status:f.status,limitations:f.limitations}))}:{}),execution_status:facts.length?'has_verified_calculations':'no_verified_calculations',report_action:'explain_current_results',question:material.question,...(Array.isArray(material.question_history)?{question_history:material.question_history}:{}),numeric_facts:facts.map(f=>({reference_id:f.id,scope:f.scope,value:f.value,unit:f.unit,currency:f.currency,grade:f.grade,limitations:f.limitations,...(f.calculation_trace?{calculation_trace:f.calculation_trace}:{})})),source_summary:body.sources.sources.map((s:any)=>({name:s.display_name,sheets:s.sheets.map((t:any)=>({name:t.name,fields:(t.rows.find((r:any)=>r.row===1)?.cells??[]).map((c:any)=>({column:c.column,name:c.value}))}))})),explorations:(body.explorations??[]).map((e:any)=>({classification:'MODEL_EXPLORATION',verification:'not_performed',full_exploration:{path:`exploration/${e.exploration_id}/${hashFiniteJson(e.value)}/result.txt`},summary_preview:[...e.value.summary].slice(0,800).join(''),summary_truncated:[...e.value.summary].length>800,...(e.total_check?{total_check:{kind:e.total_check.kind,chart_title:e.total_check.chart_title,claim_path:e.total_check.claim_path,total:e.total_check.total,status:e.total_check.status,grade:e.total_check.grade,limitation:e.total_check.limitation}}:{}),charts:e.value.charts.map((c:any)=>({title:c.title,type:c.type,unit:c.unit,points:c.points.length})),instruction:'原生read按本次真实路径完整读取保存探索；不重跑Python。探索和整图仍未独立核验。'})),unavailable_calculations:body.unavailable_calculations??[],collaboration:(body.collaboration??[]).map(({child_id,result_id,...opinion}:any)=>opinion)});
 }
 fail();
}
function fail():never{throw Object.assign(new Error('REPORT_EVIDENCE_INVALID'),{code:'REPORT_EVIDENCE_INVALID'});}
/** Quantitative references are checked; expression editing never grants independent qualification. */
