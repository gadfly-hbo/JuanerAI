import {createHash} from 'node:crypto';
import {hashFiniteJson} from './member-task.ts';
import {membershipRecord as closed} from './member-analysis.ts';
import type {OpenStoredTask} from '../ports/open-analysis-store.ts';
import type {ReportPostprocessing,ReportPostEdition,ReportNumberInventory,ReportNumberClaim,ReportNumberResult,ReportNumberProof,ReportTextReview,ReportReviewEvidence} from '../ports/report-postprocessing.ts';
import type {AnalysisCompletion,AnalysisResourceRead,AnalysisExecutionFact} from '../ports/analysis-agent.ts';

export const reportTextHash=(text:string)=>createHash('sha256').update(text,'utf8').digest('hex');
export const reportPostActive=(state:string)=>['checking','reviewing','revising','rechecking'].includes(state);
/** Product feedback from the sealed public tool results. A completed validation
 * call is not necessarily an accepted evidence record. No text is re-parsed. */
export function reportEvidenceFeedback(completion:AnalysisCompletion){
 return (completion.recorded_values??[]).flatMap(r=>{const v=r.value as Record<string,unknown>;return ['record_method','record_review','record_reviewed'].includes(r.tool_name)&&v?.accepted===false&&v.saved===false&&v.staged===false&&typeof v.code==='string'&&typeof v.reason==='string'?[v.code+'：'+v.reason]:[];});
}
export function reportPostFailure(code='POST_REPORT_INVALID'):never{throw Object.assign(new Error(code),{code});}
/** Formal report content is Markdown, never a metadata envelope. Keep the exact
 * authored bytes; do not extract a guessed body or rewrite the author's prose. */
export function requireReportMarkdown(value:string):string{
 const body=value.trim(),lines=body.split(/\r\n?|\n/),fence=/^(`{3,}|~{3,})(.*)$/.exec(lines[0]);
 let content=body;
 if(fence&&(fence[1][0]==='~'||!fence[2].includes('`'))){
  // A whole fenced block also ends at EOF. Language labels do not change
  // whether its actual content is metadata; prose after a closed block does.
  const close=new RegExp('^ {0,3}'+fence[1][0]+'{'+fence[1].length+',}[ \\t]*$'),end=lines.findIndex((line,index)=>index>0&&close.test(line));
  if(end<0)content=lines.slice(1).join('\n');
  else if(lines.slice(end+1).every(line=>!line.trim()))content=lines.slice(1,end).join('\n');
 }
 let envelope=false;try{const parsed=JSON.parse(content);envelope=parsed!==null&&typeof parsed==='object';}catch{}
 if(!body||envelope)reportPostFailure('REPORT_MARKDOWN_REQUIRED');return value;
}
/** Actual user words only; assistant proposals are context, never condition evidence. */
export function reportUserQuestion(task:OpenStoredTask){return [...new Set([task.question,...(task.requirement_execution?.user_statements??[])])].join('\n');}

export function reportEdition(text:string,version=0):ReportPostEdition{return {version,text,sha256:reportTextHash(text),inventory:null,numbers:[],numeric_proof:null,reused_number_ids:[],review:null};}
const same=(a:unknown,b:unknown)=>hashFiniteJson(a)===hashFiniteJson(b);
const text=(value:unknown,max=12000):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=max;
const strings=(value:unknown,max=1000):value is readonly string[]=>Array.isArray(value)&&value.length<=max&&value.every(v=>text(v));
function json(raw:string,exactNumbers=false){
 const value=raw.trim(),fence=/^```(?:json)?[ \t]*\r?\n([\s\S]*)\r?\n```$/.exec(value);
 try{return JSON.parse(fence?fence[1]:value,(_key:string,item:unknown,context?:{source?:string})=>exactNumbers&&typeof item==='number'?context?.source??String(item):item);}catch{return reportPostFailure();}
}
/** Occurrence coverage, not a universal natural-language numeric recognizer. */
export function reportNumberOccurrences(value:string){
 // Locate whole numeric text; never evaluate or silently normalise it. Unicode
 // compatibility is used only for token boundaries, not for the compared value.
 const numeric=/\p{N}/u,context=/[A-Za-z\p{N}\p{Dash}\p{Math}\p{Pc}\p{M}\p{Cf}.,:/：]|\p{Zs}/u;
 // These are the existing passive renderer's inline delimiters, not numeric
 // syntax. Preserve source offsets and the complete literal inside them.
 const formatting=new Set<number>();
 for(const m of value.matchAll(/`([^`\n]+)`|\*\*([^*\n]+)\*\*/g)){
  const width=m[1]===undefined?2:1;
  for(let i=0;i<width;i++){formatting.add(m.index+i);formatting.add(m.index+m[0].length-width+i);}
 }
 const numbers:{start:number;end:number;text:string}[]=[];let begin=-1,hasNumber=false;
 // Native grapheme boundaries keep selectors/combining marks attached, also
 // beyond the BMP. They never turn a non-decimal spelling into a decimal.
 const segments=new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value);
 function flush(end:number){
  if(begin<0||!hasNumber)return;
  let start=begin;
  while(start<end&&[':', '：'].includes(value[start]!))start++;
  while(end>start&&['.',',',':','：'].includes(value[end-1]!))end--;
  let before=start,prior=before>0?segments.containing(before-1):undefined;
  while(prior&&(/^[\p{M}\p{Cf} \t]+$/u.test(prior.segment)||formatting.has(prior.index))){before=prior.index;prior=before>0?segments.containing(before-1):undefined;}
  const sign=prior?.segment;
  if(before<start&&prior&&sign&&sign!=='|'&&/[\p{Dash}\p{Math}]/u.test(sign)){
   const listMarker=['-','+','*'].includes(sign)&&!value.slice(value.lastIndexOf('\n',prior.index-1)+1,prior.index).trim();
   if(!listMarker)start=prior.index;
  }
  if(start<end)numbers.push({start,end,text:value.slice(start,end)});
 }
 for(const {segment:char,index:offset} of segments){
  const part=!formatting.has(offset)&&char!==' '&&char.normalize('NFKC')!=='|'&&(context.test(char)||context.test(char.normalize('NFKC')));
  if(part){if(begin<0){begin=offset;hasNumber=false;}hasNumber ||= numeric.test(char);}
  else{flush(offset);begin=-1;hasNumber=false;}
 }
 flush(value.length);
 // A symbol/spacing-only gap is no proof of separate quantities. Keep the
 // complete compound without interpreting an operator. Real text, sentence,
 // line and table-cell boundaries still separate occurrences.
 const grouped:typeof numbers=[];
 for(const n of numbers){const previous=grouped.at(-1),gap=previous?value.slice(previous.end,n.start):'';
  if(previous&&/^[\p{P}\p{S}\p{M}\p{Cf}\p{Zs}\t]+$/u.test(gap)&&!/[|\r\n;；，、。!?！？]/u.test(gap)){previous.end=n.end;previous.text=value.slice(previous.start,n.end);}else grouped.push({...n});
 }
 let cursor=0;
 for(const bracket of value.matchAll(/[（(][^()（）\r\n|]*[)）]/gu)){
  const start=bracket.index,end=start+bracket[0].length;
  while(cursor<grouped.length&&grouped[cursor]!.end<=start)cursor++;
  const first=cursor;while(cursor<grouped.length&&grouped[cursor]!.start<end)cursor++;
  if(cursor===first+1){const n=grouped[first]!;n.start=Math.min(start,n.start);n.end=Math.max(end,n.end);n.text=value.slice(n.start,n.end);}
  cursor=first;
 }
 return grouped;
}
function reportParagraphSpans(value:string){let cursor=0;return value.split(/\n\s*\n/).map((content,index)=>{const start=value.indexOf(content,cursor);cursor=start+content.length;return {id:'p'+index,text:content,sha256:reportTextHash(content),start,end:cursor};});}
export function reportParagraphs(value:string){return reportParagraphSpans(value).map(({start,end,...paragraph})=>paragraph);}
/** Selection references are supplied before inference; character counting stays local. */
export function reportNumberCandidates(value:string){return reportNumberOccurrences(value).map((n,index)=>({ref:'n'+index,text:n.text,comparison:decimal(n.text)?'exact_decimal':'unverified_representation',context:value.slice(Math.max(0,n.start-48),Math.min(value.length,n.end+48))}));}
export function reportNumberInventory(claims:readonly unknown[],edition:ReportPostEdition,paths:readonly string[],limitations:readonly string[]=[]):ReportNumberInventory{
 const x={claims,limitations};
 if(!Array.isArray(x.claims)||x.claims.length>2000)reportPostFailure('POST_REPORT_INVENTORY_INVALID');
 const occurrences=reportNumberOccurrences(edition.text);
 const selected=x.claims.map(rawClaim=>{const c=closed(rawClaim,['number_ref','kind','definition','unit','scope','source_paths','prerequisites',...(rawClaim&&typeof rawClaim==='object'&&Object.hasOwn(rawClaim,'format_quote')?['format_quote']:[])]);
  const index=typeof c.number_ref==='string'&&/^n(?:0|[1-9][0-9]*)$/.test(c.number_ref)?Number(c.number_ref.slice(1)):-1,n=occurrences[index];
  if(!n)reportPostFailure('POST_REPORT_INVENTORY_INVALID');const {number_ref,...meaning}=c;void number_ref;return {...meaning,start:n.start,end:n.end};});
 return inventoryFromClaims({report_sha256:edition.sha256,claims:selected,limitations:x.limitations},edition,paths);
}
function inventoryFromClaims(raw:unknown,edition:ReportPostEdition,paths:readonly string[]):ReportNumberInventory{
 const x=closed(raw,['report_sha256','claims','limitations']);
 if(x.report_sha256!==edition.sha256||!Array.isArray(x.claims)||x.claims.length>2000||!strings(x.limitations))reportPostFailure('POST_REPORT_INVENTORY_INVALID');
 const occurrences=new Set(reportNumberOccurrences(edition.text).map(n=>n.start+':'+n.end));
 const spans=new Set<string>(),candidates:Omit<ReportNumberClaim,'id'>[]=[];
 for(const rawClaim of x.claims){const c=closed(rawClaim,['start','end','kind','definition','unit','scope','source_paths','prerequisites',...(Object.hasOwn(rawClaim,'format_quote')?['format_quote']:[])]);
  if(!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||!occurrences.has(c.start+':'+c.end)||!['source','derived','assumption','context'].includes(String(c.kind))||!text(c.definition)||!text(c.unit,100)||!text(c.scope)||!strings(c.source_paths,32)||c.source_paths.some(p=>!paths.includes(p))||!strings(c.prerequisites,64)||spans.has(c.start+':'+c.end))reportPostFailure('POST_REPORT_INVENTORY_INVALID');
  if(c.format_quote!==undefined&&c.format_quote!==null&&(!text(c.format_quote)||!edition.text.includes(c.format_quote)))reportPostFailure('POST_REPORT_INVENTORY_INVALID');
  spans.add(c.start+':'+c.end);candidates.push({...structuredClone(c),format_quote:c.format_quote??null} as Omit<ReportNumberClaim,'id'>);
 }
 // Stable opaque business-quantity correlation. No reported value, position or
 // model-supplied identifier participates; unrelated moves cannot reset it.
 const seen=new Map<string,number>();
 const claims=candidates.sort((a,b)=>a.start-b.start||a.end-b.end).map(c=>{const {start,end,...meaning}=c,key=hashFiniteJson(meaning),occurrence=seen.get(key)??0;seen.set(key,occurrence+1);return {id:'number-'+hashFiniteJson({key,occurrence}).slice(0,32),...c};});
 const uncovered=reportNumberOccurrences(edition.text).filter(n=>!claims.some(c=>c.start<=n.start&&c.end>=n.end));
 return {report_sha256:edition.sha256,claims,limitations:structuredClone(x.limitations),uncovered};
}
type Decimal={n:bigint;scale:number};
function decimal(raw:string):Decimal|null{
 if(!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(raw))return null;
 const clean=raw.replaceAll(',',''),m=/^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(clean);
 if(!m||clean.length>200||Math.abs(Number(m[4]??0))>100)return null;
 const scale=(m[3]?.length??0)-Number(m[4]??0),n=BigInt((m[1]==='-'?'-':'')+m[2]+(m[3]??''));
 return scale<0?{n:n*10n**BigInt(-scale),scale:0}:{n,scale};
}
function decimalText(n:bigint,scale:number){const sign=n<0n?'-':'';let s=(n<0n?-n:n).toString().padStart(scale+1,'0');if(scale)s=s.slice(0,-scale)+'.'+s.slice(-scale);return sign+s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');}
export function compareReportNumber(reported:string,recomputed:string){
 const a=decimal(reported),b=decimal(recomputed);if(!a||!b)return null;
 const scale=Math.max(a.scale,b.scale),delta=b.n*10n**BigInt(scale-b.scale)-a.n*10n**BigInt(scale-a.scale);
 return {consistent:delta===0n,delta:decimalText(delta,scale),rounding:'按实际数值精确比较，不注入容差或自动舍入'};
}
/** User-provided numeric context only; never an input filter for computation. */
const numericValueHints=(value:string)=>[...value.normalize('NFKC').matchAll(/[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:[eE][+-]?\d+)?/g)].map(m=>m[0]);
export type ReportCheckSource=Readonly<{path:string;file:string;task_directory:string;content:string;resource_content:string;sha256:string;source_id:string;source_sha256:string;sheet_id:string;qualification:'observed'|'unconfirmed';limitations:readonly string[];rows:readonly number[];columns:readonly string[];cells:readonly Readonly<{row:number;column:string;value:string}>[]}>;
/** Materialization only. Every cell comes from the saved authorized inspection, not a calculation DSL. */
export function reportCheckSources(t:OpenStoredTask,task_directory:string):readonly ReportCheckSource[]{
 if(!t.model_report||t.model_report.contract.resources.source_catalog!==task_directory+'/020_clean/source/catalog.txt')reportPostFailure();
 return t.model_report.contract.inputs.map((input,index)=>{
  const source=t.source.sources.find(s=>s.source_id===input.source_id&&s.sha256===input.source_sha256),sheet=source?.sheets.find(s=>s.sheet_id===input.sheet_id&&s.state==='visible');if(!source||!sheet)reportPostFailure('POST_REPORT_SOURCE_INVALID');
  const columns=[...new Set(sheet.rows.flatMap(r=>r.cells.map(c=>c.column)))],quote=(v:string)=>'"'+v.replaceAll('"','""')+'"';
  const cells=sheet.rows.flatMap(r=>r.cells.map(c=>({row:r.row,column:c.column,value:String(c.value??'')})));
  const content=sheet.rows.map(r=>columns.map(column=>quote(String(r.cells.find(c=>c.column===column)?.value??''))).join(',')).join('\n')+'\n';
  const resource_content=[JSON.stringify({kind:'authorized_source_table',source_id:source.source_id,source_sha256:source.sha256,sheet_id:sheet.sheet_id,classification:'SOURCE_FACT',verification:'not_performed'}),...sheet.rows.map(r=>JSON.stringify(r))].join('\n');
  return {task_directory,path:input.table_path,file:'input/source-'+index+'.csv',content,resource_content,sha256:reportTextHash(content),source_id:source.source_id,source_sha256:source.sha256,sheet_id:sheet.sheet_id,qualification:source.document?.status==='ocr_unconfirmed'?'unconfirmed' as const:'observed' as const,limitations:source.document?.limitations??[],rows:sheet.rows.map(r=>r.row),columns,cells};
 });
}
/** Same saved Task/source; positions may move, but no numeric meaning or value may change. */
export function reusableReportNumbers(previous:ReportPostEdition|undefined,current:ReportPostEdition){
 if(!previous?.inventory||!current.inventory)return [];
 const basis=(c:ReportNumberClaim,e:ReportPostEdition)=>{const {start,end,...meaning}=c;return {...meaning,reported:e.text.slice(start,end)};};
 return current.inventory.claims.filter(c=>previous.numbers.some(n=>n.claim_id===c.id)&&previous.inventory!.claims.some(p=>p.id===c.id&&same(basis(p,previous),basis(c,current)))).map(c=>c.id);
}
function hasWholeRead(reads:readonly AnalysisResourceRead[],path:string,content:string){
 const lines=content.split('\n').length,sha=reportTextHash(content),ranges=reads.filter(r=>r.path===path&&r.sha256===sha).sort((a,b)=>a.first_line-b.first_line);let next=1;
 for(const r of ranges){if(r.first_line>next)break;next=Math.max(next,r.last_line+1);}return next>lines;
}
/** Physical per-computation files; no virtual read route or author workspace. */
function reportVerificationDirectory(source:Pick<ReportCheckSource,'task_directory'>,subject:string,role:'independent_source'|'method_review'){
 if(typeof source.task_directory!=='string'||!source.task_directory.startsWith('/')||source.task_directory.split('/').includes('..')||!/^[a-f0-9-]{36}$/.test(subject)||!['independent_source','method_review'].includes(role))reportPostFailure('POST_REPORT_SOURCE_INVALID');
 return source.task_directory+'/020_clean/independent/'+subject+'/'+role;
}
export function reportVerificationFile(source:Pick<ReportCheckSource,'task_directory'|'file'>,subject:string,role:'independent_source'|'method_review'){
 if(!/^input\/source-[0-9]+\.csv$/.test(source.file))reportPostFailure('POST_REPORT_SOURCE_INVALID');
 return reportVerificationDirectory(source,subject,role)+'/'+source.file;
}
export function reportExecutionMaterials(subject:string,executions:readonly AnalysisExecutionFact[],sources:readonly Pick<ReportCheckSource,'task_directory'|'file'|'content'>[]){
 if(!sources.length)reportPostFailure('POST_REPORT_SOURCE_INVALID');
 const files=new Map<string,string>(),base=reportVerificationDirectory(sources[0]!,subject,'method_review');
 const manifest=executions.map((execution,index)=>{
  if(!Array.isArray(execution.artifacts))reportPostFailure('POST_REPORT_PROGRAM_EVIDENCE_INVALID');
  const seen=new Set<string>();for(const file of execution.artifacts){
   closed(file,['path','sha256','content']);if(!text(file.path)||file.path.startsWith('/')||file.path.split('/').includes('..')||seen.has(file.path)||!/^[a-f0-9]{64}$/.test(file.sha256)||file.content!==null&&typeof file.content!=='string'||file.content!==null&&reportTextHash(file.content)!==file.sha256)reportPostFailure('POST_REPORT_PROGRAM_EVIDENCE_INVALID');seen.add(file.path);
   if(file.content!==null)files.set(base+'/postcheck/execution-'+index+'/files/'+file.path,file.content);
  }
  const outputsSeen=new Set<string>();for(const file of execution.outputs??[]){
   closed(file,['path','sha256','content']);if(!text(file.path)||file.path.startsWith('/')||file.path.split('/').includes('..')||outputsSeen.has(file.path)||!/^[a-f0-9]{64}$/.test(file.sha256)||file.content!==null&&(typeof file.content!=='string'||reportTextHash(file.content)!==file.sha256))reportPostFailure('POST_REPORT_PROGRAM_EVIDENCE_INVALID');outputsSeen.add(file.path);
   if(file.content!==null)files.set(base+'/postcheck/execution-'+index+'/outputs/'+file.path,file.content);
  }
  return {...execution,artifacts:execution.artifacts.map(({content,...file})=>({...file,readable:content!==null})),...(execution.outputs?{outputs:execution.outputs.map(({content,...file})=>({...file,readable:content!==null}))}:{})};
 });
 return new Map<string,string>([[base+'/postcheck/execution.json',JSON.stringify(manifest,null,2)],...sources.map(s=>[reportVerificationFile(s,subject,'method_review'),s.content] as [string,string]),...files]);
}
export function reportMethodReview(raw:Readonly<{claims:readonly unknown[];limitations:readonly string[]}>,subject:string,targets:readonly {id:string}[],completion:AnalysisCompletion,materials:ReadonlyMap<string,string>):ReportNumberProof['method_review']{
 const x=closed(raw,['claims','limitations']);
 if(!/^[a-f0-9]{64}$/.test(subject)||!Array.isArray(x.claims)||x.claims.length>targets.length||!strings(x.limitations)||!completion.computation_context||completion.computation_context.role!=='method_review')reportPostFailure('POST_REPORT_METHOD_INVALID');
 const unread=reportUnreadMethodEvidence(materials,completion.resource_reads??[]);
 const seen=new Set<string>();for(const c of x.claims){closed(c,['id','applicability','independence','coverage','reason']);if(!targets.some(t=>t.id===c.id)||seen.has(c.id)||!['applicability','independence','coverage'].every(k=>['supported','insufficient','conflict'].includes(String(c[k])))||!text(c.reason))reportPostFailure('POST_REPORT_METHOD_INVALID');seen.add(c.id);}
 return {subject_sha256:subject,claims:x.claims.map(c=>({...structuredClone(c),...(unread.length?{coverage:'insufficient',reason:'未完整读取实际执行证据；'+c.reason}: {})})),limitations:[...x.limitations,...(unread.length?['未完整读取：'+unread.join('、')]:[])]} as ReportNumberProof['method_review'];
}
/** Same business proof at candidate acceptance and final qualification. */
export function reportUnreadMethodEvidence(materials:ReadonlyMap<string,string>,reads:readonly AnalysisResourceRead[]){return [...materials].filter(([path,content])=>!hasWholeRead(reads,path,content)).map(([path])=>path);}
export type ReportExecutedResult=Readonly<{ref:string;result_id:string;definition?:string;scope?:string;value:string;unit:string;unrounded_value?:string;rounding_quote?:string;sources:readonly Readonly<{path:string;rows:readonly number[];columns:readonly string[]}>[];evidence?:Readonly<{execution:number;path:string;sha256:string;pointer:string}>}>;
/** Decode sealed program evidence, not a model inventory. An invalid result
 * cannot invalidate unrelated well-formed results or erase the actual process. */
export function reportExecutedResults(completion:AnalysisCompletion,subject:string,authorizedSources:readonly ReportCheckSource[]){
 const executions=completion.executions??[],results:ReportExecutedResult[]=[],limitations:string[]=[];
 if(!executions.some(e=>e.exit_code===0))return {results,limitations:['没有成功结算的真实程序执行结果。']};
 const sources=authorizedSources.map(s=>({...s,file:reportVerificationFile(s,subject,'independent_source')}));
 for(const [executionIndex,execution]of executions.entries()){
  if(execution.exit_code!==0)continue;
  const bodies=[{path:'stdout',content:execution.output,sha256:reportTextHash(execution.output),prefix:executionIndex?'e'+executionIndex:''},...(execution.outputs??[]).map((file,index)=>({...file,prefix:'e'+executionIndex+'f'+index}))];
  for(const body of bodies){
   if(body.content===null)continue;
   if(reportTextHash(body.content)!==body.sha256)reportPostFailure('POST_REPORT_PROGRAM_EVIDENCE_INVALID');
   let output:unknown,exact:unknown;try{output=json(body.content.trim());exact=json(body.content.trim(),true);}catch{limitations.push('实际程序输出（执行'+executionIndex+'，'+body.path+'）未提供可定位的JSON数值；真实字节保留，相关项未核验。');continue;}
   const actualInputs=sources.filter(s=>execution.inputs.some(i=>i.path===s.file&&i.sha256===s.sha256));
   const decoded:ReportExecutedResult[]=[],seen=new Set<string>(),duplicates=new Set<string>();
   const visit=(raw:unknown,value:unknown,pointer:string,depth:number)=>{
    if(depth>64||results.length+decoded.length>=2000)return;
    // Explicit per-result identity/source declarations have the same contract
    // at every depth. Never walk their rejected metadata as ordinary numbers.
    if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&(Object.hasOwn(raw,'claim_id')||Object.hasOwn(raw,'sources'))){
     try{
      const v=closed(raw,['claim_id','value','unit','sources',...(['definition','scope','unrounded_value','rounding_quote'].filter(k=>Object.hasOwn(raw,k)))]);
      if(!text(v.claim_id,100)||!text(v.value,200)||!decimal(v.value)||!text(v.unit,100)||!Array.isArray(v.sources)||!v.sources.length||v.unrounded_value!==undefined&&(!text(v.unrounded_value,200)||!decimal(v.unrounded_value))||v.rounding_quote!==undefined&&!text(v.rounding_quote)||v.definition!==undefined&&!text(v.definition)||v.scope!==undefined&&!text(v.scope))reportPostFailure();
      if(seen.has(v.claim_id))duplicates.add(v.claim_id);seen.add(v.claim_id);
      for(const rawSource of v.sources){const ref=closed(rawSource,['path','rows','columns']),source=sources.find(s=>s.file===ref.path);if(!source||!Array.isArray(ref.rows)||!ref.rows.length||ref.rows.some((row:unknown)=>!Number.isSafeInteger(row)||!source.rows.includes(Number(row)))||!strings(ref.columns,10000)||!ref.columns.length||ref.columns.some((col:string)=>!source.columns.includes(col)||(ref.rows as number[]).some((row:number)=>!source.cells.some(c=>c.row===row&&c.column===col)))||!execution.inputs.some(i=>i.path===source.file&&i.sha256===source.sha256))reportPostFailure();}
      const declaredIndex=/^\/values\/([0-9]+)$/.exec(pointer),ref=declaredIndex?body.prefix+'r'+declaredIndex[1]:(body.prefix||'e0')+'d'+pointer;
      const {claim_id,...declared}=v;decoded.push({ref,result_id:claim_id,...structuredClone(declared)} as ReportExecutedResult);
     }catch{limitations.push('实际程序结果 '+(pointer||'/')+' 缺少有效数值、单位或真实输入/行列依据；仅本项不授资格。');}
     return;
    }
    if(text(value,200)&&decimal(value))decoded.push({ref:(body.prefix||'e0')+'j'+pointer,result_id:body.path+'#'+pointer,definition:'封存结果 '+body.path+'#'+pointer,scope:'实际执行输入快照；具体纳入排除由独立方法审查判断',value,unit:'未声明',sources:actualInputs.map(s=>({path:s.file,rows:s.rows,columns:s.columns})),evidence:{execution:executionIndex,path:body.path,sha256:body.sha256,pointer}});
    else if(raw&&typeof raw==='object'&&value&&typeof value==='object')for(const [key,child]of Object.entries(raw))visit(child,Reflect.get(value,key),pointer+'/'+key.replaceAll('~','~0').replaceAll('/','~1'),depth+1);
   };
   visit(output,exact,'',0);
   results.push(...decoded.filter(r=>r.evidence||!duplicates.has(r.result_id)));
   if(duplicates.size)limitations.push('执行'+executionIndex+'中重复结果身份不授资格：'+[...duplicates].join('、'));
  }
 }
 return {results,limitations};
}
/** Post-execution comparison only. Pi selects actual report/result references;
 * the system supplies position, source and stable identity. Report units are
 * judged independently of execution units; omission never grants qualification. */
export function reportComparisonRecords(proposals:readonly unknown[],edition:ReportPostEdition,question:string,sources:readonly ReportCheckSource[],results:readonly ReportExecutedResult[]){
 const choices=proposals.map(raw=>{const x=closed(raw,['number_ref','reason',...(['result_ref','reported_unit','computed_unit','applicability','independence','coverage','kind'].filter(k=>Object.hasOwn((raw??{}) as object,k)))]),p:Record<string,unknown>={...x,result_ref:x.result_ref??null,applicability:x.applicability??'insufficient',independence:x.independence??'insufficient',coverage:x.coverage??'insufficient'},result=p.result_ref===null?undefined:results.find(r=>r.ref===p.result_ref);
  if(p.computed_unit!==undefined&&(!text(p.computed_unit,100)||!result?.evidence)||p.result_ref!==null&&!result||!['applicability','independence','coverage'].every(k=>['supported','insufficient','conflict'].includes(String(p[k])))||!text(p.reason)||p.reported_unit!==undefined&&!text(p.reported_unit,100)||p.kind!==undefined&&!['derived','source','context','assumption'].includes(String(p.kind)))reportPostFailure('POST_REPORT_COMPARISON_INVALID');
  const kind=p.kind??'derived';if(result&&['context','assumption'].includes(String(kind)))reportPostFailure('POST_REPORT_COMPARISON_INVALID');
  const missing=['applicability','independence','coverage'].filter(key=>!Object.hasOwn(x,key));
  if(missing.length)p.reason='未明确给出'+missing.join('/')+'判断，相关资格不足；'+p.reason;
  return {proposal:p,result,claim:{number_ref:p.number_ref,kind,definition:result?.definition??result?.result_id??(kind==='context'?'用户条件数字':'尚无独立结果的报告数字'),unit:p.reported_unit??'未确认',scope:result?.scope??'本次用户确认需求与获准来源范围',source_paths:[] as string[],prerequisites:!result&&kind!=='context'&&kind!=='assumption'?[p.reason]:[],format_quote:result?.rounding_quote&&edition.text.includes(result.rounding_quote)?result.rounding_quote:null}};
 });
 // Native input paths are bound by their source ordinal, not guessed from an
 // arbitrary label or rewritten into another task's path.
 for(const choice of choices)if(choice.result)choice.claim.source_paths=[...new Set(choice.result.sources.map(r=>{const index=Number(/\/input\/source-([0-9]+)\.csv$/.exec(r.path)?.[1]);const source=sources.find(s=>s.file==='input/source-'+index+'.csv');if(!source)reportPostFailure('POST_REPORT_SOURCE_INVALID');return source.path;}))];
 const selected=reportNumberInventory(choices.map(c=>c.claim),edition,sources.map(s=>s.path));
 const combined=inventoryFromClaims({report_sha256:edition.sha256,claims:[...(edition.inventory?.claims??[]),...selected.claims].map(({id,...claim})=>claim),limitations:edition.inventory?.limitations??[]},edition,sources.map(s=>s.path));
 const methods:ReportNumberProof['method_review']['claims'][number][]=[],bindings:ReportNumberProof['bindings'][number][]=[];
 for(const choice of choices){
  const c=selected.claims.find(c=>c.start===reportNumberOccurrences(edition.text)[Number(String(choice.proposal.number_ref).slice(1))]?.start)!;const found=combined.claims.find(item=>item.start===c.start&&item.end===c.end)!;
  methods.push({id:found.id,applicability:choice.proposal.applicability,independence:choice.proposal.independence,coverage:choice.proposal.coverage,reason:choice.proposal.reason} as ReportNumberProof['method_review']['claims'][number]);
  if(choice.result)bindings.push({claim_id:found.id,result_ref:choice.result.ref,...(choice.result.evidence&&choice.proposal.computed_unit?{computed_unit:String(choice.proposal.computed_unit)}:{})});
 }
 return {inventory:combined,methods,bindings};
}
/** Relocate only an unchanged, uniquely occurring full paragraph. No number or
 * business meaning is guessed from a bare numeric match. */
export function carryReportComparisons(previous:ReportPostEdition,current:ReportPostEdition,sources:readonly ReportCheckSource[]):ReportPostEdition{
 const oldParagraphs=reportParagraphSpans(previous.text),now=reportParagraphSpans(current.text),claims:Omit<ReportNumberClaim,'id'>[]=[];
 for(const {id,...claim}of previous.inventory?.claims??[]){
  const paragraph=oldParagraphs.find(p=>p.start<=claim.start&&p.end>=claim.end),matches=paragraph?now.filter(p=>p.text===paragraph.text):[];
  if(matches.length!==1)continue;claims.push({...claim,start:matches[0]!.start+claim.start-paragraph!.start,end:matches[0]!.start+claim.end-paragraph!.start});void id;
 }
 const inventory=inventoryFromClaims({report_sha256:current.sha256,claims,limitations:[]},current,sources.map(s=>s.path)),e={...current,inventory};
 const next={...e,reused_number_ids:reusableReportNumbers(previous,e)};return {...next,numbers:qualifyReportNumbers(next,null,sources,previous)};
}
export function qualifyReportNumbers(edition:ReportPostEdition,proof:ReportNumberProof|null,authorizedSources:readonly ReportCheckSource[],previous?:ReportPostEdition):readonly ReportNumberResult[]{
 const sources=proof?authorizedSources.map(s=>({...s,file:reportVerificationFile(s,proof.subject,'independent_source')})):authorizedSources;
 if(!same(edition.reused_number_ids,reusableReportNumbers(previous,edition)))reportPostFailure('POST_REPORT_REUSE_INVALID');
 const executed=proof?.completion.executions?.some(e=>e.exit_code===0),decoded=proof?reportExecutedResults(proof.completion,proof.subject,authorizedSources):{results:[],limitations:[]};
 const values=new Map(decoded.results.map(v=>[v.ref,v]));
 if(proof&&(!Array.isArray(proof.bindings)||new Set(proof.bindings.map(b=>b.claim_id)).size!==proof.bindings.length||proof.bindings.some(b=>!edition.inventory?.claims.some(c=>c.id===b.claim_id)||!values.has(b.result_ref)||b.computed_unit!==undefined&&(!text(b.computed_unit,100)||!values.get(b.result_ref)?.evidence))))reportPostFailure('POST_REPORT_BINDING_INVALID');
 return (edition.inventory?.claims??[]).map(c=>{
  if(edition.reused_number_ids.includes(c.id))return structuredClone(previous!.numbers.find(n=>n.claim_id===c.id)!);
  const reported=edition.text.slice(c.start,c.end),binding=proof?.bindings.find(b=>b.claim_id===c.id),candidate=binding?values.get(binding.result_ref):undefined,v=candidate?{...candidate,unit:candidate.evidence?binding?.computed_unit??'未确认':candidate.unit}:undefined,m=proof?.method_review.claims.find(m=>m.id===c.id),comparison=v?compareReportNumber(reported,v.value):null;
  const bound=v&&c.source_paths.length&&v.sources.every(r=>c.source_paths.includes(sources.find(s=>s.file===r.path)!.path)&&sources.find(s=>s.file===r.path)?.qualification==='observed')&&c.source_paths.every(path=>v.sources.some(r=>sources.find(s=>s.file===r.path)?.path===path));
  const formatBound=c.format_quote?!!v?.unrounded_value&&v.rounding_quote===c.format_quote:!v?.rounding_quote&&(!v?.unrounded_value||compareReportNumber(v.value,v.unrounded_value)?.consistent===true);
  const programsReadable=proof?.completion.executions?.every(fact=>fact.artifacts?.every(file=>file.content!==null)===true)===true;
  const eligible=!!(proof&&executed&&programsReadable&&bound&&comparison&&formatBound&&m&&m.applicability==='supported'&&m.independence==='supported'&&m.coverage==='supported'&&!c.prerequisites.length&&['source','derived'].includes(c.kind)&&v?.unit===c.unit);
  const unavailable=c.source_paths.map(path=>sources.find(s=>s.path===path)).find(s=>!s||s.qualification==='unconfirmed'||Buffer.byteLength(s.content)>1_048_576);
  return {claim_id:c.id,status:eligible?(comparison!.consistent?'independent_consistent':'difference'):'unverified',reported,recomputed:v?.value??null,unrounded:v?.unrounded_value??null,unit:c.unit,delta:v?.unit===c.unit?comparison?.delta??null:null,reason:!decimal(reported)?'报告数字表示尚不支持精确比较；保留完整原文和未核验，不截取正数或猜财务记法':eligible?(c.format_quote?'按原文声明格式独立执行后精确比较；未舍入值另保留。'+c.format_quote:comparison!.rounding):c.kind==='context'?'日期/编号等语境数字，不当作实测值或计算核验结果':c.kind==='assumption'?'假设/情景输入，非已观察事实；不标独立复算':c.prerequisites.length?'缺少本项必要条件：'+c.prerequisites.join('；'):unavailable?(unavailable.qualification==='unconfirmed'?'本项来源读取／OCR尚未确认；不能提升数字资格':'本项全表副本超过固定原生文件1MiB限制；未执行该项重算'):decoded.limitations.length&&!v?decoded.limitations.join('；'):v&&v.unit!==c.unit?'报告单位未确认或与真实复算单位不一致，不作跨单位一致性比较':executed&&!programsReadable?'执行目录存在尚不可审阅的工作文件；不提升数字资格':m?.reason??'没有完整的独立执行、来源、格式和方法覆盖证据；不提升资格'};
 });
}
function validateReviewEvidence(raw:unknown,edition:ReportPostEdition,question:string,sources:readonly ReportCheckSource[],reads:readonly AnalysisResourceRead[]):ReportReviewEvidence{
 const kind=Reflect.get((raw??{}) as object,'kind');
 if(kind==='number'){const x=closed(raw,['kind','id']);if(!edition.numbers.some(n=>n.claim_id===x.id))reportPostFailure('POST_REPORT_REFERENCE_INVALID');return x as ReportReviewEvidence;}
 if(kind==='condition'){const x=closed(raw,['kind','quote']);if(!text(x.quote)||!question.includes(x.quote))reportPostFailure('POST_REPORT_REFERENCE_INVALID');return x as ReportReviewEvidence;}
 const x=closed(raw,['kind','path','row','column']),s=sources.find(s=>s.path===x.path);
 if(kind!=='source'||!s||!Number.isSafeInteger(x.row)||typeof x.column!=='string'||!s.cells.some(c=>c.row===x.row&&c.column===x.column)||!hasWholeRead(reads,s.path,s.resource_content))reportPostFailure('POST_REPORT_REFERENCE_INVALID');return x as ReportReviewEvidence;
}
function buildReportTextReview(raw:Readonly<{reviewed_paragraphs:readonly string[];claims:readonly unknown[];uncovered:readonly string[];limitations:readonly string[]}>,edition:ReportPostEdition,phase:'initial'|'recheck',question:string,sources:readonly ReportCheckSource[],reads:readonly AnalysisResourceRead[]){
 const x=closed(raw,['reviewed_paragraphs','claims','uncovered','limitations']),paragraphs=reportParagraphSpans(edition.text);
 if(!strings(x.reviewed_paragraphs)||new Set(x.reviewed_paragraphs).size!==x.reviewed_paragraphs.length||x.reviewed_paragraphs.some(id=>!paragraphs.some(p=>p.id===id))||!Array.isArray(x.claims)||x.claims.length>2000)reportPostFailure('POST_REPORT_REVIEW_INVALID');
 if(!strings(x.uncovered)||!strings(x.limitations))reportPostFailure('POST_REPORT_REVIEW_INVALID');
 const reviewedParagraphs=x.reviewed_paragraphs,uncovered=x.uncovered;
 const claims=x.claims.map(rawClaim=>{const provided=closed(rawClaim,['kind','paragraph_ref','quote','verdict','reason',...(['evidence','conditions','limitations'].filter(k=>Object.hasOwn((rawClaim??{}) as object,k)))]),c:Record<string,unknown>={...provided,evidence:provided.evidence??[],conditions:provided.conditions??[{text:'审查者未明确提供适用条件说明',status:'unknown',evidence:[]}],limitations:provided.limitations??[]};const paragraph=paragraphs.find(p=>p.id===c.paragraph_ref);
  if(!paragraph||!text(c.quote)||paragraph.text.indexOf(c.quote)<0||paragraph.text.indexOf(c.quote)!==paragraph.text.lastIndexOf(c.quote))reportPostFailure('POST_REPORT_REVIEW_INVALID');
  const {paragraph_ref,quote,...judgment}=c,start=paragraph.start+paragraph.text.indexOf(String(quote));
  return {...judgment,id:'review-'+hashFiniteJson({paragraph_ref,quote,kind:c.kind}).slice(0,32),start,end:start+String(quote).length};});
 return reviewFromClaims({report_sha256:edition.sha256,numeric_sha256:hashFiniteJson(edition.numbers),phase,reviewed_paragraphs:paragraphs.filter(p=>reviewedParagraphs.includes(p.id)).map(({id,sha256})=>({id,sha256})),claims,uncovered:[...new Set([...uncovered,...paragraphs.filter(p=>!reviewedParagraphs.includes(p.id)).map(p=>'尚未覆盖段落 '+p.id)])],limitations:x.limitations},edition,phase,question,sources,reads);
}
export function reportTextReview(raw:Parameters<typeof buildReportTextReview>[0],edition:ReportPostEdition,phase:'initial'|'recheck',question:string,sources:readonly ReportCheckSource[],completion:AnalysisCompletion):ReportTextReview{
 if(completion.purpose!=='conclusion_strategy_review')reportPostFailure('POST_REPORT_REVIEW_INVALID');
 return {...buildReportTextReview(raw,edition,phase,question,sources,completion.resource_reads??[]),completion:structuredClone(completion)};
}
/** Re-evaluate only deterministic eligibility after new numeric facts. Keep
 * the original model judgments/conditions and completion; no hidden re-review. */
export function refreshReportTextReview(edition:ReportPostEdition,question:string,sources:readonly ReportCheckSource[]):ReportTextReview|null{
 if(!edition.review)return null;const {completion,claims,...review}=edition.review;
 return {...reviewFromClaims({...review,numeric_sha256:hashFiniteJson(edition.numbers),claims:claims.map(({eligible,...claim})=>({...claim,conditions:claim.conditions.map(({proposed_status,status,...condition})=>({...condition,status:proposed_status}))}))},edition,review.phase,question,sources,completion.resource_reads??[]),completion};
}
export function validateReportReviewInput(raw:unknown,edition:ReportPostEdition,phase:'initial'|'recheck',question:string,sources:readonly ReportCheckSource[],reads:readonly AnalysisResourceRead[]){
 return buildReportTextReview({claims:[raw],reviewed_paragraphs:[],uncovered:[],limitations:[]},edition,phase,question,sources,reads);
}
function reviewFromClaims(raw:unknown,edition:ReportPostEdition,phase:'initial'|'recheck',question:string,sources:readonly ReportCheckSource[],reads:readonly AnalysisResourceRead[]):Omit<ReportTextReview,'completion'>{
 const x=closed(raw,['report_sha256','numeric_sha256','phase','reviewed_paragraphs','claims','uncovered','limitations']);
 const given=new Set(numericValueHints(question));
 const knownContext=(id:string)=>{const c=edition.inventory?.claims.find(c=>c.id===id),n=edition.numbers.find(n=>n.claim_id===id);return !!(c?.kind==='context'&&!c.source_paths.length&&!c.prerequisites.length&&n&&given.has(n.reported));};
 const expected=reportParagraphs(edition.text).map(({id,sha256})=>({id,sha256}));
 if(x.report_sha256!==edition.sha256||x.numeric_sha256!==hashFiniteJson(edition.numbers)||x.phase!==phase||!Array.isArray(x.reviewed_paragraphs)||x.reviewed_paragraphs.some(p=>!expected.some(e=>same(e,p)))||new Set(x.reviewed_paragraphs.map(p=>p.id)).size!==x.reviewed_paragraphs.length||!Array.isArray(x.claims)||x.claims.length>2000||!strings(x.uncovered)||!strings(x.limitations))reportPostFailure('POST_REPORT_REVIEW_INVALID');
 const seen=new Set<string>(),claims:ReportTextReview['claims'][number][]=[];
 for(const rawClaim of x.claims){const c=closed(rawClaim,['id','kind','start','end','verdict','reason','evidence','conditions','limitations']);
  if(!text(c.id,100)||seen.has(c.id)||!['conclusion','strategy'].includes(String(c.kind))||!Number.isSafeInteger(c.start)||!Number.isSafeInteger(c.end)||Number(c.start)<0||Number(c.end)<=Number(c.start)||Number(c.end)>edition.text.length||!['supported','conditional','insufficient','conflict'].includes(String(c.verdict))||!text(c.reason)||!Array.isArray(c.evidence)||!Array.isArray(c.conditions)||c.conditions.length>64||!strings(c.limitations))reportPostFailure('POST_REPORT_REVIEW_INVALID');seen.add(c.id);
  const evidence=c.evidence.map(e=>validateReviewEvidence(e,edition,question,sources,reads));
  const conditions=c.conditions.map(rawCondition=>{const q=closed(rawCondition,['text','status','evidence']);if(!text(q.text)||!['met','unmet','unknown'].includes(String(q.status))||!Array.isArray(q.evidence))reportPostFailure('POST_REPORT_REVIEW_INVALID');const e=q.evidence.map(r=>validateReviewEvidence(r,edition,question,sources,reads));if(q.status==='met'&&!e.length)reportPostFailure('POST_REPORT_REVIEW_INVALID');const blocked=e.some(r=>r.kind==='number'&&edition.numbers.some(n=>n.claim_id===r.id&&n.status!=='independent_consistent'&&!knownContext(n.claim_id)));return {text:q.text,proposed_status:q.status as 'met'|'unmet'|'unknown',status:blocked?'unknown' as const:q.status as 'met'|'unmet'|'unknown',evidence:e};});
  const referenced=new Set([...evidence,...conditions.flatMap(q=>q.evidence)].filter(e=>e.kind==='number').map(e=>e.id));
  for(const n of edition.inventory?.claims??[])if(n.start<Number(c.end)&&n.end>Number(c.start))referenced.add(n.id);
  const badNumber=edition.numbers.some(n=>referenced.has(n.claim_id)&&n.status!=='independent_consistent'&&!knownContext(n.claim_id));
  const uncoveredNumber=edition.inventory?.uncovered.some(n=>n.start<Number(c.end)&&n.end>Number(c.start))===true;
  const eligible=['supported','conditional'].includes(String(c.verdict))&&evidence.length>0&&!badNumber&&!uncoveredNumber&&conditions.every(q=>q.status==='met');
  claims.push({id:String(c.id),kind:c.kind as 'conclusion'|'strategy',start:Number(c.start),end:Number(c.end),verdict:c.verdict as ReportTextReview['claims'][number]['verdict'],reason:String(c.reason),limitations:c.limitations as readonly string[],evidence,conditions,eligible});
 }
 return {report_sha256:String(x.report_sha256),numeric_sha256:String(x.numeric_sha256),phase,reviewed_paragraphs:x.reviewed_paragraphs,claims,uncovered:x.uncovered as readonly string[],limitations:x.limitations as readonly string[]};
}
export function validateReportPostprocessing(raw:ReportPostprocessing,t:OpenStoredTask,task_directory:string){
 closed(raw,['version','identity','outcome_id','basis_sha256','state','revision_attempted','editions','failure_code','notes']);
 if(!t.model_report||raw.version!=='1.0'||hashFiniteJson(raw.identity)!==hashFiniteJson(t.identity)||raw.outcome_id!==t.model_report.outcome_id||raw.basis_sha256!==hashFiniteJson(t.model_report)||!['checking','reviewing','revising','rechecking','completed','failed','stopped','unknown'].includes(raw.state)||typeof raw.revision_attempted!=='boolean'||raw.failure_code!==null&&!/^[A-Z_0-9]{1,100}$/.test(raw.failure_code)||!Array.isArray(raw.editions)||raw.editions.length<1||raw.editions.length>2||raw.editions.length===2&&!raw.revision_attempted)reportPostFailure();
 if(!Array.isArray(raw.notes)||raw.notes.some(n=>!['coordinator','source','method','review','revision'].includes(n.role)||typeof n.text!=='string'||n.text.length>100000||!n.completion))reportPostFailure();
 const sources=reportCheckSources(t,task_directory),paths=sources.map(s=>s.path);
 for(const [i,edition]of (raw.editions as readonly ReportPostEdition[]).entries()){
  closed(edition,['version','text','sha256','inventory','numbers','numeric_proof','reused_number_ids','review']);
  if(!strings(edition.reused_number_ids)||new Set(edition.reused_number_ids).size!==edition.reused_number_ids.length||i===0&&edition.reused_number_ids.length)reportPostFailure();
  if(edition.version!==i||typeof edition.text!=='string'||!edition.text.trim()||edition.text.length>100000||edition.sha256!==reportTextHash(edition.text)||!Array.isArray(edition.numbers))reportPostFailure();
  if(edition.inventory){const {uncovered,...provided}=edition.inventory;const parsed=inventoryFromClaims({...provided,claims:provided.claims.map(({id,...claim})=>claim)},edition,paths);if(!same(parsed,edition.inventory)||new Set(edition.numbers.map(n=>n.claim_id)).size!==edition.numbers.length||edition.numbers.some(n=>!parsed.claims.some(c=>c.id===n.claim_id)))reportPostFailure();void uncovered;
   if(!same(edition.reused_number_ids,reusableReportNumbers(raw.editions[i-1],edition)))reportPostFailure('POST_REPORT_REUSE_INVALID');
   if(edition.numbers.length){
    const proof=edition.numeric_proof;
    if(!same(qualifyReportNumbers(edition,proof,sources,raw.editions[i-1]),edition.numbers))reportPostFailure('POST_REPORT_PROOF_INVALID');
   }
   if(edition.review){
    const {completion,claims,...rawReview}=edition.review;
    const reviewed={...reviewFromClaims({...rawReview,claims:claims.map(({eligible,...claim})=>({...claim,conditions:claim.conditions.map(({proposed_status,status,...condition})=>({...condition,status:proposed_status}))}))},edition,i===0?'initial':'recheck',reportUserQuestion(t),sources,completion.resource_reads??[]),completion};
    if(!same(reviewed,edition.review)||edition.numbers.length!==edition.inventory.claims.length)reportPostFailure();
   }
  }
  else if(edition.numbers.length||edition.numeric_proof||edition.reused_number_ids.length||edition.review)reportPostFailure();
 }
 if(raw.editions[0]!.text!==t.model_report.text)reportPostFailure();
 if(raw.state==='completed'&&raw.failure_code!==null||['failed','stopped','unknown'].includes(raw.state)&&raw.failure_code===null||reportPostActive(raw.state)&&raw.failure_code!==null)reportPostFailure();
 return raw;
}

function reportNumberSourceSummary(t:OpenStoredTask,edition:ReportPostEdition,claimId:string){
 try{
  const origin=edition.reused_number_ids.includes(claimId)?t.report_postprocessing!.editions[0]:edition,proof=origin.numeric_proof;
  if(!proof||!t.model_report)return [];
  const suffix='/020_clean/source/catalog.txt',catalog=t.model_report.contract.resources.source_catalog;
  if(!catalog.endsWith(suffix))return [];
  const sources=reportCheckSources(t,catalog.slice(0,-suffix.length)),ref=proof.bindings.find(b=>b.claim_id===claimId)?.result_ref;
  const matched=reportExecutedResults(proof.completion,proof.subject,sources).results.find(r=>r.ref===ref);
  return (matched?.sources??[]).map(ref=>{
   const input=sources.find(s=>reportVerificationFile(s,proof.subject,'independent_source')===ref.path),source=t.source.sources.find(s=>s.source_id===input?.source_id),sheet=source?.sheets.find(s=>s.sheet_id===input?.sheet_id);
   return source&&sheet?source.display_name+' / '+sheet.name+' · 行 '+ref.rows.join('、')+' · 列 '+ref.columns.map(c=>c+'（'+(sheet.rows[0]?.cells.find(cell=>cell.column===c)?.value??c)+'）').join('、'):ref.path;
  });
 }catch{return [];}
}
export function reportPostView(t:OpenStoredTask,currentText:string){
 const post=t.report_postprocessing;if(!post)return null;
 const edition=post.editions.at(-1)!,stale=edition.sha256!==reportTextHash(currentText),settled=post.state==='completed'&&!stale;
 return {state:stale?'stale':post.state,report_version:edition.version,report_sha256:edition.sha256,source_sha256:t.identity.scope_sha256,review_sha256:hashFiniteJson(post),failure_code:post.failure_code,
  numbers:edition.numbers.map(n=>{const origin=edition.reused_number_ids.includes(n.claim_id)?post.editions[0]:edition;return {...n,status:stale?'unverified':n.status,kind:edition.inventory?.claims.find(c=>c.id===n.claim_id)?.kind??null,definition:edition.inventory?.claims.find(c=>c.id===n.claim_id)?.definition??'',source_paths:edition.inventory?.claims.find(c=>c.id===n.claim_id)?.source_paths??[],source_summary:reportNumberSourceSummary(t,edition,n.claim_id),method_reason:origin.numeric_proof?.method_review.claims.find(c=>c.id===n.claim_id)?.reason??null,execution_id:origin.numeric_proof?.completion.id??null};}),
  uncovered:edition.inventory?.uncovered??reportNumberOccurrences(edition.text),numeric_limitations:edition.inventory?.limitations??['尚未登记数字核验范围'],notes:post.notes.map(({role,text})=>({role,text})),
  review:edition.review?{claims:edition.review.claims.map(c=>({...c,text:edition.text.slice(c.start,c.end),eligible:settled&&c.eligible})),uncovered:edition.review.uncovered,limitations:edition.review.limitations,phase:edition.review.phase}:null,
  revision_attempted:post.revision_attempted,versions:post.editions.map(e=>({version:e.version,sha256:e.sha256,text:e.text})),
  notice:'数字仅按所列来源、范围与方法覆盖核验；结论和建议是基于当前证据的模型审查判断，不是全面认证、收益保证或业务行动授权。'};
}
export function reportPostCopy(view:ReturnType<typeof reportPostView>){
 if(!view)return '尚未进行报告后核验与审查。';
 const labels:Record<string,string>={checking:'数字核验进行中',reviewing:'全文审查进行中',revising:'合并修订进行中',rechecking:'全文重审进行中',completed:'本轮后处理已完成（逐项资格见下）',failed:'后处理失败，已保存报告保留',stopped:'后处理已停止',unknown:'后处理效果或用量尚未结算',stale:'内容已变化，旧核验与审查不适用于本版'};
 const numberLabels:Record<string,string>={independent_consistent:'独立复算一致',difference:'发现差异',unverified:'未核验／证据不足'};
 const verdicts:Record<string,string>={supported:'有支持',conditional:'有条件支持',insufficient:'证据不足',conflict:'存在冲突'};
 return ['## 数字后核验／结论与策略审查',labels[view.state]??view.state,`报告后处理版本 ${view.report_version} · ${view.report_sha256}`,view.notice,...view.notes.map(n=>n.role+'：'+n.text),...view.numbers.map(n=>`${n.definition}：${numberLabels[n.status]??n.status}；原文 ${n.reported} ${n.unit}；复算 ${n.recomputed??'未取得'}；差异 ${n.delta??'未知'}。${n.reason}${n.method_reason?'；方法审查：'+n.method_reason:''}。来源：${n.source_summary.join('；')}（身份路径 ${n.source_paths.join('；')}）`),...view.uncovered.map(n=>`未覆盖数字：${n.text}（${n.start}–${n.end}）`),...view.numeric_limitations,...(!view.review?['尚无完成的全文审查判断；不能视为证据不足或审查通过。']:[]),...(view.review?.claims??[]).map(c=>`${c.kind==='strategy'?'策略':'结论'}「${c.text}」：${verdicts[c.verdict]}；${c.reason}。${c.eligible?'可供人在既有权限内选择，尚未执行':'受影响选择暂不可采纳'}。${c.conditions.map(q=>q.text+'：'+q.status).join('；')} ${c.limitations.join('；')}`),...(view.review?.uncovered??[]),...(view.review?.limitations??[]),...(view.failure_code?[`停止／失败原因：${view.failure_code}`]:[])].join('\n\n');
}
