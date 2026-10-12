import {openAnalysisProposal} from '../../../packages/product-core/open-analysis-ir.ts';
import type {OpenAnalysisRuntime} from '../../../packages/ports/open-analysis-runtime.ts';
/** Legacy behavior fixtures model the new editing response separately from their analysis counters.
 * This double does NOT establish free-text semantic accuracy; B1 tests and real Provider evidence do. */
export function withReportEdit(runtime:OpenAnalysisRuntime):OpenAnalysisRuntime{
 const drafts=new Map<string,string>();
 return {...runtime,run:async i=>{
  if(i.purpose!=='report_edit'){
   // This analysis double models the approved Agent's explicit required-IR binding.
   // Direct Application tests separately exercise the missing-declaration boundary.
   const read=i.tools.find(t=>t.name==='read_analysis_evidence');
   const tools=i.tools.map(tool=>!read||!['set_framework','set_multisource_framework','set_joined_framework','set_membership_framework','set_document_framework','set_analysis_steps','calculate_and_verify'].includes(tool.name)?tool:{...tool,execute:async(args:Readonly<Record<string,unknown>>,signal:AbortSignal)=>{
    if(tool.name==='calculate_and_verify'){const evidence=await read.execute({},signal) as any;if(!evidence.required_calculations.length){const selected=args.plan??evidence.current_plan;if(selected)await read.execute({required_plans:[selected]},signal);}}
    let result=await tool.execute(args,signal) as any;if(result?.status==='needs_business_scope'){const observe=i.tools.find(t=>t.name==='inspect_selected')!,describe=i.tools.find(t=>t.name==='describe_business')!;const observation=await observe.execute({},signal) as any;const sources=observation.sources??observation.inspection?.sources;if(!Array.isArray(sources))throw Error('fixture inspection has no actual sources');await describe.execute({purpose:'当前任务计算回归',object:'当前选定字段',scope:'回归任务获准资料',deliverables:['实际数值与证据'],hypotheses:[],unknowns:[],execution_scope:sources.flatMap((source:any)=>source.sheets.map((sheet:any)=>({source_id:source.source_id,sheet_id:sheet.sheet_id,filters:[]})))},signal);result=await tool.execute(args,signal);}if(result?.binding)await read.execute({required_plans:[openAnalysisProposal(result.binding)]},signal);return result;
   }});
   const result=await runtime.run({...i,tools});drafts.set(JSON.stringify(i.identity),result.text);return result;
  }
  if(i.signal.aborted||!i.authorize())throw Object.assign(Error('CANCELLED'),{code:'CANCELLED'});
  const data=JSON.parse(i.prompt.slice('JuanerAI.report-edit.v1\n'.length));
  const draft=drafts.get(JSON.stringify(i.identity))??'需结合业务背景理解结果。';
  // Protocol double: numbers are now references to actual facts, not an authored result.
  let numericDraft=draft;for(const fact of [...(data.numeric_facts??[])].sort((a:any,b:any)=>String(b.value).length-String(a.value).length)){if(/^-?\d+(?:\.\d+)?$/.test(fact.value))numericDraft=numericDraft.split(fact.value+fact.unit).join('{{'+fact.reference_id+'}}').split(fact.value).join('{{'+fact.reference_id+'}}');}
  const text=JSON.stringify(data.output_contract==='1.5'?{version:'1.5',status:'ready',interpretations:[{fact_refs:(data.numeric_facts??[]).map((f:any)=>f.reference_id),interpretation:numericDraft.replace(/\{\{[^{}]+\}\}/g,'对应保存结果')}]}:data.output_contract==='1.4'?{version:'1.4',status:'ready',interpretations:[{interpretation:numericDraft}]}:data.output_contract==='1.3'?{version:'1.3',status:'ready',derivations:[],interpretations:[{references:(data.numeric_facts??[]).map((f:any)=>f.reference_id),interpretation:numericDraft}]}:data.output_contract==='1.2'?{version:'1.2',status:'ready',interpretations:[{references:data.grounded_facts.map((f:any)=>f.reference_id),interpretation:drafts.get(JSON.stringify(i.identity))??'需结合业务背景理解结果。'}],comparisons:[]}:{version:'1.0',status:'ready',text:drafts.get(JSON.stringify(i.identity))??data.draft??'已按实际计算凭证整理。',claims:data.evidence.verified_calculations.map((f:any)=>({plan_sha256:f.plan_sha256,group_key:null,value:f.calculation.value,grade:f.verification.grade}))});
  await i.saveContinuation?.({version:'1.0',turn:1,messages:[{speaker:'user',text:i.prompt},{speaker:'assistant',text,calls:[]}]});return {text,tools:[]};
 }};
}
