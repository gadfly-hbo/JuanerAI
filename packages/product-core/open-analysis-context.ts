import {validateOpenSemanticAssessment,type OpenSemanticAssessment} from './open-analysis-semantics.ts';
import {membershipRecord} from './member-analysis.ts';
import {hashFiniteJson} from './member-task.ts';
import type {MemberSourceInspection,MemberSourceCell,SourceDocumentObservation} from '../ports/member-source.ts';
export type OpenBusinessScope=readonly Readonly<{source_id:string;sheet_id:string}>[];
export type OpenBusinessProposal=Readonly<{execution_scope?:OpenBusinessScope;classification:'MODEL_PROPOSAL';purpose:string;object:string;scope:string;deliverables:readonly string[];hypotheses:readonly Readonly<{classification:'MODEL_HYPOTHESIS';text:string}>[];unknowns:readonly string[]}>;
export type OpenAnalysisContext=Readonly<{version:'1.0'|'1.1'|'1.2';semantics?:OpenSemanticAssessment;question:Readonly<{classification:'USER_SAID';text:string}>;inspection_sha256:string;source_facts:readonly Readonly<{classification:'SOURCE_FACT';source_id:string;sheet_id:string;display_name:string;source_sha256:string;headers:readonly MemberSourceCell[];data_rows:number;document?:SourceDocumentObservation}>[];business?:OpenBusinessProposal;unknowns:readonly string[]}>;
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
export function compileOpenBusinessProposal(raw:unknown):OpenBusinessProposal{
 const x=membershipRecord(raw,['purpose','object','scope','deliverables','hypotheses','unknowns',...(raw&&typeof raw==='object'&&Object.hasOwn(raw,'execution_scope')?['execution_scope']:[])]);
 const text=(value:unknown)=>{if(typeof value!=='string'||!value.trim()||value.length>2000)fail('PLAN_INVALID');return value;},list=(value:unknown)=>{if(!Array.isArray(value)||value.length>16)fail('PLAN_INVALID');return value.map(text);};
 if(x.execution_scope!==undefined&&(!Array.isArray(x.execution_scope)||!x.execution_scope.length||x.execution_scope.length>32))fail('PLAN_INVALID');
 if(Array.isArray(x.execution_scope)){
  const seen=new Set<string>();
  for(const raw of x.execution_scope){
   const scope=membershipRecord(raw,['source_id','sheet_id']);
   if(typeof scope.source_id!=='string'||typeof scope.sheet_id!=='string'||!scope.source_id||!scope.sheet_id||scope.sheet_id.length>200)fail('PLAN_INVALID');
   const key=JSON.stringify([scope.source_id,scope.sheet_id]);if(seen.has(key))fail('PLAN_INVALID');seen.add(key);
  }
 }

 return {...(x.execution_scope?{execution_scope:structuredClone(x.execution_scope) as OpenBusinessScope}:{}),classification:'MODEL_PROPOSAL',purpose:text(x.purpose),object:text(x.object),scope:text(x.scope),deliverables:list(x.deliverables),hypotheses:list(x.hypotheses).map(text=>({classification:'MODEL_HYPOTHESIS',text})),unknowns:list(x.unknowns)};
}
function businessInput(value:OpenBusinessProposal){return {purpose:value.purpose,object:value.object,scope:value.scope,deliverables:value.deliverables,hypotheses:value.hypotheses.map(x=>x.text),unknowns:value.unknowns,...(value.execution_scope?{execution_scope:value.execution_scope}:{})};}

/** Construct business context. Observed headers are facts
 * about the selected file, not an assertion of currency, meaning or causation. */
export function compileOpenAnalysisContext(question:string,inspection:MemberSourceInspection,business?:OpenBusinessProposal,semantics?:OpenSemanticAssessment):OpenAnalysisContext{
 if(typeof question!=='string'||!question.trim()||question.length>12000)fail('PLAN_INVALID');
 const seen=new Set<string>();
 const source_facts:OpenAnalysisContext['source_facts'][number][]=[];
 const refs=business?.execution_scope??inspection.sources.flatMap(source=>source.sheets.filter(sheet=>sheet.state==='visible').map(sheet=>({source_id:source.source_id,sheet_id:sheet.sheet_id})));
 if(inspection.version!=='1.0'||inspection.sources.length>32)fail('SOURCE_UNQUALIFIED');
 for(const raw of refs){if(!raw||typeof raw!=='object')fail('PLAN_INVALID');const {source_id,sheet_id}=raw as Record<string,unknown>,key=String(source_id)+'/'+String(sheet_id);if(seen.has(key))fail('BINDING_NOT_FOUND');seen.add(key);const sources=inspection.sources.filter(s=>s.source_id===source_id),source=sources[0],sheets=source?.sheets.filter(s=>s.sheet_id===sheet_id),sheet=sheets?.[0];if(sources.length!==1||sheets?.length!==1||!source||!sheet||sheet.state!=='visible'||!sheet.rows.length)fail('BINDING_NOT_FOUND');source_facts.push({classification:'SOURCE_FACT',source_id:source.source_id,sheet_id:sheet.sheet_id,display_name:source.display_name,source_sha256:source.sha256,headers:structuredClone(sheet.rows[0]!.cells),data_rows:sheet.rows.length-1,...(source.document?{document:structuredClone(source.document)}:{})});}
 const normalized=business?compileOpenBusinessProposal(businessInput(business)):undefined;

 return {version:semantics&&['1.1','1.2'].includes(semantics.version)?'1.2':semantics?'1.1':'1.0',...(semantics?{semantics:structuredClone(semantics)}:{}),...(normalized?{business:normalized}:{}),question:{classification:'USER_SAID',text:question},inspection_sha256:hashFiniteJson(inspection),source_facts,unknowns:['模型提出的单位、方法和业务解释不因字段同名而成为权威业务事实；未明确的语义或原因仍需资料与必要澄清。',...source_facts.flatMap(f=>f.document?.limitations??[]),...(normalized?.unknowns??[])]};
}
export function validateOpenAnalysisContext(context:OpenAnalysisContext,inspection:MemberSourceInspection,questions:readonly string[],task_id?:string){
 if(!context||!questions.includes(context.question?.text))fail('CONTEXT_CHANGED');const expected=compileOpenAnalysisContext(context.question.text,inspection,context.business,context.semantics?validateOpenSemanticAssessment(context.semantics,questions,task_id,inspection):undefined);if(hashFiniteJson(context)!==hashFiniteJson(expected))fail('CONTEXT_CHANGED');return expected;
}
export {openAnalysisFindings} from '../contracts/open-analysis-findings.mjs';
export {openAnalysisRevisionImpact} from './open-analysis-impact.ts';

export {compileOpenSemanticAssessment,validateOpenSemanticAssessment} from './open-analysis-semantics.ts';

/** Exact visible original-source projection for this immutable business context.
 * It selects actual source/sheet identities only, never methods or row-filter operators. */
export function materializeOpenAnalysisSource(context:OpenAnalysisContext,inspection:MemberSourceInspection,task_id?:string):MemberSourceInspection{
 // Projection proves exact source geometry only; semantic authority is checked with actual Task questions by Application/Store.
 if(hashFiniteJson(context)!==hashFiniteJson(compileOpenAnalysisContext(context.question.text,inspection,context.business,context.semantics)))fail('CONTEXT_CHANGED');
 void task_id;
 const refs=context.source_facts.map(f=>({source_id:f.source_id,sheet_id:f.sheet_id})),sources:MemberSourceInspection['sources'][number][]=[];
 for(const ref of refs){const original=inspection.sources.find(s=>s.source_id===ref.source_id)!,sheet=original.sheets.find(s=>s.sheet_id===ref.sheet_id&&s.state==='visible');if(!sheet)fail('BINDING_NOT_FOUND');
  const existing=sources.find(s=>s.source_id===ref.source_id);if(existing)(existing.sheets as typeof sheet[]).push(structuredClone(sheet));else sources.push({...structuredClone(original),sheets:[structuredClone(sheet)]});
 }
 return {version:'1.0',sources};
}

/** Thin analysis/report IR: bind actual SCR sources and qualification, never an
 * algorithm catalogue, a second model plan or a claim of completed calculation. */
export type OpenModelReportContract=Readonly<{
 version:'1.1';mode:'model_unverified';context:OpenAnalysisContext;
 requirements?:Readonly<{revision:number;text:string;confirmed:true}>;
 inputs:readonly Readonly<{source_id:string;source_sha256:string;sheet_id:string;table_path:string}>[];
 resources:Readonly<{source_catalog:string;metric_asset_catalog:string}>;
 execution:Readonly<{owner:'Pi';independent_verification:'not_performed'}>;
 output:Readonly<{kind:'MODEL_ANALYSIS_REPORT';verification:'not_performed';human_judgment:'not_recorded'}>;
}>;
/** Filesystem-safe identity component; display names and business IDs stay in
 * the file metadata. In particular, dot IDs and long Unicode sheet IDs must
 * not become traversal or exceed the local filename limit. */
export function sourcePathComponent(value:string){const encoded=encodeURIComponent(value);return encoded==='.'||encoded==='..'||encoded.length>200?hashFiniteJson(value):encoded;}
export function compileOpenModelReportContract(context:OpenAnalysisContext,directory:string,requirements?:OpenModelReportContract['requirements']):OpenModelReportContract{
 return {version:'1.1',mode:'model_unverified',context:structuredClone(context),...(requirements?{requirements:structuredClone(requirements)}:{}),resources:{source_catalog:directory+'/020_clean/source/catalog.txt',metric_asset_catalog:directory+'/020_clean/metric-asset/catalog.txt'},inputs:context.source_facts.map(f=>({source_id:f.source_id,source_sha256:f.source_sha256,sheet_id:f.sheet_id,table_path:`${directory}/020_clean/source/${f.source_id}/${f.source_sha256}/sheet/${sourcePathComponent(f.sheet_id)}/table.txt`})),execution:{owner:'Pi',independent_verification:'not_performed'},output:{kind:'MODEL_ANALYSIS_REPORT',verification:'not_performed',human_judgment:'not_recorded'}};
}

/** Readable business context only. Opaque resource paths are copied from the
 * actual authorized catalog; no tool plan, state envelope or identity fields. */
export function readableOpenModelContext(contract:OpenModelReportContract,userStatements:readonly string[]=[]){
 const rows=contract.context.source_facts.map((source,index)=>{const input=contract.inputs[index]!;return source.display_name+' / '+source.sheet_id+'（'+source.data_rows+'行）\n字段：'+source.headers.map(h=>h.value).join('、')+'\n原生read路径：'+input.table_path;});
 return ['用户需求：',contract.context.question.text,'',...(userStatements.length?['用户在本次讨论中明确提供的原话（模型理解不能覆盖这些条件）：',...[...new Set(userStatements)],'']:[]),...(contract.requirements?['用户确认的本次分析需求三核心（正文是分析依据，不是固定执行步骤）：',contract.requirements.text,'']:[]),'获准资料目录（原生read，实际绝对路径）：',contract.resources.source_catalog,'企业指标与方法目录（按需read）：',contract.resources.metric_asset_catalog,'当前获准资料目录（完整内容按需read；资料不足只限制受影响判断）：',...rows,'','项目企业指标/方法通过已声明的只读能力按需读取；缺批准资产时明确缺口，不编造企业定义。'].join('\n');
}
