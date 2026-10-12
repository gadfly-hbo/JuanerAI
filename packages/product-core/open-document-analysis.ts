import {membershipRecord as closed,membershipUuid} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';
import type {OpenAnalysisIR,OpenAnalysisValue} from './open-analysis-ir.ts';
import type {OpenAnalysisVerification} from '../ports/open-analysis-verifier.ts';
export type OpenDocumentReference=Readonly<{source_id:string;sheet_id:string;row:number;column:string;source_sha256:string}>;
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
function observed(reference:Pick<OpenDocumentReference,'source_id'|'sheet_id'|'row'|'column'>,inspection:MemberSourceInspection){
 const sources=inspection.sources.filter(s=>s.source_id===reference.source_id),source=sources[0],sheets=source?.sheets.filter(s=>s.sheet_id===reference.sheet_id),sheet=sheets?.[0];
 if(sources.length!==1||sheets?.length!==1||!source||!sheet||sheet.state!=='visible')fail('BINDING_NOT_FOUND');
 if(!source.document||source.document.status!=='text_observed'||!/^[a-f0-9]{64}$/.test(source.document.reader_sha256)||!/^[a-f0-9]{64}$/.test(source.sha256))fail('SOURCE_UNQUALIFIED');
 const rows=sheet.rows.filter(r=>r.row===reference.row),row=rows[0],cells=row?.cells.filter(c=>c.column===reference.column),cell=cells?.[0];
 if(rows.length!==1||cells?.length!==1||!cell||reference.row<=sheet.rows[0]!.row)fail('BINDING_NOT_FOUND');
 if(cell.type!=='string'||!cell.value.trim()||cell.value.length>12000||cell.value.includes('\0'))fail('SOURCE_UNQUALIFIED');
 const positions=row!.cells.filter(c=>c.column==='A');if(reference.column!=='B'||positions.length!==1||positions[0]!.type!=='string')fail('SOURCE_UNQUALIFIED');
 return {source,position:positions[0]!.value,text:cell.value};
}
export function compileOpenDocumentIR(raw:unknown,inspection:MemberSourceInspection):OpenAnalysisIR{
 const p=closed(raw,['version','goal','operation','references']);
 if(p.version!=='1.6'||p.operation!=='source_quotes'||typeof p.goal!=='string'||!p.goal.trim()||p.goal.length>2000||!Array.isArray(p.references)||!p.references.length||p.references.length>32||inspection.version!=='1.0')fail('PLAN_INVALID');
 const seen=new Set<string>(),references=p.references.map(raw=>{const r=closed(raw,['source_id','sheet_id','row','column']);if(!membershipUuid(r.source_id)||typeof r.sheet_id!=='string'||!r.sheet_id||!Number.isSafeInteger(r.row)||Number(r.row)<2||typeof r.column!=='string')fail('PLAN_INVALID');const ref={source_id:r.source_id,sheet_id:r.sheet_id,row:Number(r.row),column:r.column},key=taskHash(ref);if(seen.has(key))fail('PLAN_INVALID');seen.add(key);return {...ref,source_sha256:observed(ref,inspection).source.sha256};});
 const first=references[0]!;
 return {version:'1.6',goal:p.goal,operation:'source_quotes',references,source_id:first.source_id,sheet_id:first.sheet_id,column:first.column,unit:'source quotation',source_sha256:taskHash(references.map(r=>r.source_sha256)),inspection_sha256:taskHash(inspection),binding_sha256:taskHash(references)};
}
export function openDocumentProposal(plan:OpenAnalysisIR){return {version:'1.6',goal:plan.goal,operation:'source_quotes',references:plan.references?.map(({source_sha256,...r})=>{void source_sha256;return r;})};}
export function executeOpenDocumentIR(plan:OpenAnalysisIR,inspection:MemberSourceInspection):OpenAnalysisValue{
 const {context_sha256,...bare}=plan;void context_sha256;if(taskHash(compileOpenDocumentIR(openDocumentProposal(plan),inspection))!==taskHash(bare))fail('SOURCE_CHANGED');
 const quotes=plan.references!.map(r=>{const q=observed(r,inspection);return {classification:'SOURCE_QUOTATION',source_id:r.source_id,source_name:q.source.display_name,source_sha256:r.source_sha256,sheet_id:r.sheet_id,row:r.row,position:q.position,text:q.text};});
 return {version:'1.0',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),source_sha256:plan.source_sha256,value:JSON.stringify(quotes),unit:plan.unit,rows:quotes.length,method:'checked_source_quotes'};
}
/** Independent lookup of every claimed quotation from the newly read snapshot.
 * Does not call the primary quotation compiler/extractor/calculator. Attribution
 * of observed text is not truth validation or an arithmetic qualification. */
export function verifyOpenDocumentIR(plan:OpenAnalysisIR,result:OpenAnalysisValue,inspection:MemberSourceInspection):OpenAnalysisVerification{
 if(plan.version!=='1.6'||plan.operation!=='source_quotes'||result.method!=='checked_source_quotes'||result.version!=='1.0'||result.plan_sha256!==taskHash(plan)||result.inspection_sha256!==taskHash(inspection)||plan.inspection_sha256!==taskHash(inspection)||result.source_sha256!==plan.source_sha256||result.unit!==plan.unit||!Array.isArray(plan.references)||!plan.references.length||result.rows!==plan.references.length||Object.hasOwn(result,'groups')||Object.hasOwn(result,'derivation'))fail('VERIFICATION_FAILED');
 const quotes:Array<unknown>=new Array(plan.references.length),seen=new Set<string>();
 for(let i=plan.references.length-1;i>=0;i--){const r=plan.references[i]!,key=taskHash(r);if(seen.has(key))fail('VERIFICATION_FAILED');seen.add(key);const source=inspection.sources.filter(s=>s.source_id===r.source_id);if(source.length!==1||source[0]!.sha256!==r.source_sha256||source[0]!.document?.status!=='text_observed')fail('VERIFICATION_FAILED');const sheet=source[0]!.sheets.filter(s=>s.sheet_id===r.sheet_id);if(sheet.length!==1||sheet[0]!.state!=='visible')fail('VERIFICATION_FAILED');const rows=sheet[0]!.rows.filter(row=>row.row===r.row);if(rows.length!==1||r.row<=sheet[0]!.rows[0]!.row||r.column!=='B')fail('VERIFICATION_FAILED');const texts=rows[0]!.cells.filter(c=>c.column===r.column),positions=rows[0]!.cells.filter(c=>c.column==='A');if(texts.length!==1||positions.length!==1||texts[0]!.type!=='string'||positions[0]!.type!=='string')fail('VERIFICATION_FAILED');quotes[i]={classification:'SOURCE_QUOTATION',source_id:r.source_id,source_name:source[0]!.display_name,source_sha256:r.source_sha256,sheet_id:r.sheet_id,row:r.row,position:positions[0]!.value,text:texts[0]!.value};}
 const value=JSON.stringify(quotes);if(value!==result.value||plan.binding_sha256!==taskHash(plan.references)||plan.source_sha256!==taskHash(plan.references.map(r=>r.source_sha256)))fail('VERIFICATION_FAILED');
 return {version:'1.0',grade:'source_attribution',method:'source_quote_recheck',plan_sha256:taskHash(plan),inspection_sha256:taskHash(inspection),result_sha256:taskHash(result),value,rows:quotes.length};
}
