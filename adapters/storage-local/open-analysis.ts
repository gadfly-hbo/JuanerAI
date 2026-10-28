import { validateReportPostprocessing, reportPostActive, reportCheckSources, reportMethodReview, reportTextReview, reportExecutionMaterials, reportUserQuestion, reportExecutedResults,reportEvidenceFeedback, reportComparisonRecords, reportEdition, reportNumberInventory, carryReportComparisons, requireReportMarkdown, refreshReportTextReview } from '../../packages/product-core/report-postprocessing.ts';




import { projectReportContent, nextReportContentEvent, validateReportContentEvents } from '../../packages/product-core/browser-report-content.ts';

import { requirementInputUnconfirmed, requirementUserStatements, validateRequirementRecords, unconfiguredRequirementHash, requirementDraftCommand, validateRequirementDraft, type RequirementDraft } from '../../packages/product-core/open-requirement-framework.ts';

import { randomUUID, createHash } from 'node:crypto';




import { validateOpenAnalysisContext, compileOpenAnalysisContext, compileOpenModelReportContract } from '../../packages/product-core/open-analysis-context.ts';

import { openAnalysisPreferences } from '../../packages/product-core/open-analysis-methods.ts';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, lstatSync, mkdirSync, realpathSync, readFileSync, writeFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { membershipRecord as closed, membershipUuid } from '../../packages/product-core/member-analysis.ts';
import { hashFiniteJson, encodeFiniteJson } from '../../packages/product-core/member-task.ts';

import type { OpenAnalysisStore, OpenStoredTask, OpenTaskIdentity, OpenTaskLease, OpenAnalysisJudgmentCommand, OpenAnalysisJudgment, OpenSubmissionReceipt } from '../../packages/ports/open-analysis-store.ts';
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
const keys=['task_id','revision','run_id','attempt_id','operation_id','grant_id','scope_sha256','config_sha256'];
function identity(raw:unknown):OpenTaskIdentity{
 const x=closed(raw,keys);
 if(!['task_id','run_id','attempt_id','operation_id','grant_id'].every(k=>membershipUuid(x[k]))||typeof x.revision!=='string'||! /^[1-9]\d*$/.test(x.revision)||!['scope_sha256','config_sha256'].every(k=>typeof x[k]==='string'&&/^[a-f0-9]{64}$/.test(String(x[k]))))fail('AUTHORITY_REQUIRED');
 return structuredClone(raw) as OpenTaskIdentity;
}
function same(a:unknown,b:unknown){return hashFiniteJson(a)===hashFiniteJson(b);}
function taskQuestions(t:OpenStoredTask){return [...new Set([t.question,...(t.history??[]).map(h=>h.question),...[t,...(t.history??[])].flatMap(h=>h.requirement_execution?.user_statements??[])])];}
function currentContext(t:OpenStoredTask){return {context:compileOpenAnalysisContext(t.question,t.source),binding:null};}
function modelReport(value:import('../../packages/ports/open-analysis-store.ts').OpenModelAnalysisReport,t:OpenStoredTask,root:string){
 closed(value,['version','outcome_id','identity','kind','text','verification','human_judgment','contract']);
 if(value.version!=='1.1'||!membershipUuid(value.outcome_id)||!same(identity(value.identity),t.identity)||value.kind!=='MODEL_ANALYSIS_REPORT'||value.verification!=='not_performed'||value.human_judgment!=='not_recorded'||typeof value.text!=='string'||!value.text.trim()||value.text.length>100000||t.outcome||t.conversation_outcome)fail('IDENTITY_CONFLICT');
 validateOpenAnalysisContext(value.contract.context,t.source,taskQuestions(t),t.identity.task_id);
 if(!same(value.contract,compileOpenModelReportContract(currentContext(t).context,join(root,'analyses',t.identity.task_id),t.requirement_execution?{revision:t.requirement_execution.revision,text:t.requirement_execution.content.text,confirmed:true}:undefined)))fail('CONTEXT_CHANGED');
}
function result(t:OpenStoredTask){return t.outcome??t.model_report??t.conversation_outcome??null;}
const schema='CREATE TABLE tasks(task_id TEXT PRIMARY KEY,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL);';
function schemaIdentity(db:DatabaseSync){return JSON.stringify(db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all());}
const submissionSchema='CREATE TABLE submissions(command_id TEXT PRIMARY KEY,body_json TEXT NOT NULL,body_sha256 TEXT NOT NULL);';
const memory=new DatabaseSync(':memory:');memory.exec(schema);memory.exec(submissionSchema);const expectedSchema2=schemaIdentity(memory);memory.close();
function submissionDecode(row:Record<string,unknown>):OpenSubmissionReceipt{
 const raw=JSON.parse(String(row.body_json)),x=closed(raw,['version','command_id','input_sha256','epoch','state']);
 if(x.version!=='1.0'||!membershipUuid(x.command_id)||x.command_id!==row.command_id||typeof x.input_sha256!=='string'||! /^[a-f0-9]{64}$/.test(x.input_sha256)||!Number.isSafeInteger(x.epoch)||Number(x.epoch)<0||!['reading','unknown','stopped','failed','accepted'].includes(String(x.state))||hashFiniteJson(raw)!==row.body_sha256)fail('INTEGRITY_BLOCKED');return structuredClone(raw);
}
function judgmentCommand(raw:unknown):OpenAnalysisJudgmentCommand{
 const version=Reflect.get((raw??{}) as object,'version'),x=closed(raw,['version','command_id','expected_revision','outcome_id','outcome_sha256','value','comment',...(version==='1.1'?['content_sha256','review_sha256']:[])]);
 if(!['1.0','1.1'].includes(String(x.version))||x.version==='1.1'&&(!['content_sha256','review_sha256'].every(k=>typeof x[k]==='string'&&/^[a-f0-9]{64}$/.test(String(x[k]))))||!membershipUuid(x.command_id)||!membershipUuid(x.outcome_id)||typeof x.expected_revision!=='string'||! /^[1-9]\d*$/.test(x.expected_revision)||typeof x.outcome_sha256!=='string'||! /^[a-f0-9]{64}$/.test(x.outcome_sha256)||x.value!=='acknowledged'||typeof x.comment!=='string'||x.comment.length>12000)fail('VALIDATION_FAILED');return structuredClone(raw) as OpenAnalysisJudgmentCommand;
}

function versionChoice(raw:unknown):import('../../packages/ports/open-analysis-store.ts').OpenVersionChoice{const x=closed(raw,['version','command_id','expected_revision','target_revision']);if(x.version!=='1.0'||!membershipUuid(x.command_id)||![x.expected_revision,x.target_revision].every(v=>typeof v==='string'&&/^[1-9]\d*$/.test(v)))fail('VALIDATION_FAILED');return structuredClone(raw) as import('../../packages/ports/open-analysis-store.ts').OpenVersionChoice;}


function findJudgment(t:OpenStoredTask,command_id:string){return [...(t.judgments??[]),...(t.history??[]).flatMap(h=>h.judgments??[])].find(j=>j.command_id===command_id)??null;}
function decode(row:Record<string,unknown>,root:string):OpenStoredTask{
 let raw:unknown;try{raw=JSON.parse(String(row.body_json));}catch{fail('INTEGRITY_BLOCKED');}
 const optional=['report_postprocessing','model_report','report_content_events','history','revision_command_id','revision_commands','metric_asset_choice','entry_mode','requirement_inputs','requirement_draft','requirement_reviews','requirement_execution','requirement_materials','display_revision','version_choices','preferences','judgments'];
 const x=closed(raw,['identity','question','source','state','epoch','pending_stop_epoch','outcome','conversation_outcome','computation_records',...optional.filter(k=>Object.hasOwn(raw as object,k))]);
 const t=raw as OpenStoredTask;identity(t.identity);
 if(t.entry_mode!==undefined&&t.entry_mode!=='requirements')fail('INTEGRITY_BLOCKED');
 if(t.requirement_draft)validateRequirementDraft(t.requirement_draft);validateRequirementRecords(t);
 if(t.preferences)openAnalysisPreferences(t.preferences);
 if(x.metric_asset_choice){const choice=closed(x.metric_asset_choice,['id','version']);if(typeof choice.id!=='string'||! /^[a-z][a-z0-9-]*$/.test(choice.id)||typeof choice.version!=='string'||! /^\d+\.\d+\.\d+$/.test(choice.version))fail('INTEGRITY_BLOCKED');}
 if(hashFiniteJson(raw)!==row.body_sha256||t.identity.task_id!==row.task_id||typeof t.question!=='string'||!t.question.trim()||t.question.length>12000||!['ready','running','unknown','stopped','failed','saved'].includes(t.state)||!Number.isSafeInteger(t.epoch)||t.epoch<0||t.pending_stop_epoch!==null&&(!Number.isSafeInteger(t.pending_stop_epoch)||t.pending_stop_epoch<0)||hashFiniteJson(t.source)!==t.identity.scope_sha256)fail('INTEGRITY_BLOCKED');
 // New records never manufacture the retired pre-report evidence kinds. Old
 // roots are preserved, not translated or executed by this forward candidate.
 if(t.outcome!==null||t.conversation_outcome!==null||!Array.isArray(t.computation_records)||t.computation_records.length)fail('INTEGRITY_BLOCKED');
 if(t.requirement_materials){if(!Array.isArray(t.requirement_materials)||t.requirement_materials.length>1000)fail('INTEGRITY_BLOCKED');const seen=new Set<string>();for(const r of t.requirement_materials){closed(r,['command_id','input_sha256','analysis_revision','scope_sha256']);if(!membershipUuid(r.command_id)||seen.has(r.command_id)||! /^[a-f0-9]{64}$/.test(r.input_sha256)||! /^[a-f0-9]{64}$/.test(r.scope_sha256)||! /^[1-9]\d*$/.test(r.analysis_revision)||Number(r.analysis_revision)>Number(t.identity.revision))fail('INTEGRITY_BLOCKED');seen.add(r.command_id);}}
 if(Object.hasOwn(t,'history')){if(!membershipUuid(t.revision_command_id)||!Array.isArray(t.history)||!t.history.length||!Array.isArray(t.revision_commands)||t.revision_commands.length!==t.history.length||!t.revision_commands.every(membershipUuid)||String(t.history.length+1)!==t.identity.revision)fail('INTEGRITY_BLOCKED');const seen=new Set<string>();for(const [i,old]of t.history.entries()){if(Object.hasOwn(old,'history'))fail('INTEGRITY_BLOCKED');decode({task_id:old.identity.task_id,body_json:encodeFiniteJson(old),body_sha256:hashFiniteJson(old)},root);if(old.identity.task_id!==t.identity.task_id||old.identity.revision!==String(i+1)||seen.has(t.revision_commands![i]!))fail('INTEGRITY_BLOCKED');seen.add(t.revision_commands![i]!);}if(seen.has(t.revision_command_id!))fail('INTEGRITY_BLOCKED');}
 if(t.display_revision!==undefined){if(! /^[1-9]\d*$/.test(t.display_revision)||Number(t.display_revision)>Number(t.identity.revision)||!Array.isArray(t.version_choices)||!t.version_choices.length)fail('INTEGRITY_BLOCKED');const target=[t,...(t.history??[])].find(v=>v.identity.revision===t.display_revision);if(!target||t.display_revision!==t.identity.revision&&!result(target))fail('INTEGRITY_BLOCKED');}
 if(t.version_choices){if(!Array.isArray(t.version_choices)||t.version_choices.length>1000)fail('INTEGRITY_BLOCKED');const seen=new Set<string>();for(const choice of t.version_choices){versionChoice(choice);if(Number(choice.expected_revision)>Number(t.identity.revision)||seen.has(choice.command_id))fail('INTEGRITY_BLOCKED');seen.add(choice.command_id);}if(t.display_revision!==t.identity.revision&&t.display_revision!==t.version_choices.at(-1)?.target_revision)fail('INTEGRITY_BLOCKED');}
 if(t.model_report)modelReport(t.model_report,t,root);

 if(t.judgments){if(!Array.isArray(t.judgments))fail('INTEGRITY_BLOCKED');const seen=new Set<string>();for(const j of t.judgments){const {saved,task_id,...command}=j;judgmentCommand(command);if(saved!==true||task_id!==t.identity.task_id||!result(t)||j.expected_revision!==t.identity.revision||j.outcome_id!==result(t)!.outcome_id||j.outcome_sha256!==hashFiniteJson(result(t))||seen.has(j.command_id))fail('INTEGRITY_BLOCKED');seen.add(j.command_id);}}
 if(t.report_postprocessing)validateReportPostprocessing(t.report_postprocessing,t,join(root,'analyses',t.identity.task_id));
 validateReportContentEvents(t);if((t.state==='saved')!==(result(t)!==null))fail('INTEGRITY_BLOCKED');return structuredClone(t);
}
/** Local authorized task persistence. No Provider, grant discovery or automatic execution. */
export function createLocalOpenAnalysisStore(config:{projectRoot:string;metricAssets?:import('../../packages/ports/metric-assets.ts').ProjectMetricAssets}):OpenAnalysisStore{
 const root=realpathSync(config.projectRoot),file=join(root,'.xanthil','desktop','open-analysis.sqlite');
 function safe(path:string){let current=path;while(current!==root){if(!current.startsWith(root+'/'))fail('INTEGRITY_BLOCKED');if(existsSync(current)&&lstatSync(current).isSymbolicLink())fail('INTEGRITY_BLOCKED');current=dirname(current);}}
 function access<T>(write:boolean,work:(db:DatabaseSync)=>T,missing:()=>T,onRollback?:()=>void):T{
  for(const suffix of ['','-journal','-wal','-shm'])safe(file+suffix);
  if(!existsSync(file)&&!write)return missing();if(write)mkdirSync(dirname(file),{recursive:true});
  const existed=existsSync(file),db=new DatabaseSync(file,{readOnly:!write});
  try{
   if(write)db.exec('PRAGMA busy_timeout=0; PRAGMA synchronous=FULL;');
   if(!existed){db.exec('BEGIN IMMEDIATE');try{db.exec(schema+submissionSchema);db.exec('PRAGMA application_id=1480802643; PRAGMA user_version=2;');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
   if(db.prepare('PRAGMA application_id').get()?.application_id!==1480802643||schemaIdentity(db)!==(expectedSchema2))fail('SCHEMA_UNSUPPORTED');
   if(!write)return work(db);db.exec('BEGIN IMMEDIATE');try{const result=work(db);db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');onRollback?.();throw e;}
  }finally{db.close();}
 }
 // Two exact, fully validated rows may be reused for the two active consumers. Every access still reads
 // disk under the existing path/schema checks; changed bytes or digest revalidate.
 const validatedReads=new Map<string,{body:unknown;digest:unknown;value:OpenStoredTask}>();
 type OwnedPath={path:string;dev:number;ino:number;directory:boolean;sha256?:string};
 function own(path:string,journal:OwnedPath[]){const st=lstatSync(path);journal.push({path,dev:st.dev,ino:st.ino,directory:st.isDirectory(),...st.isFile()?{sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}:{}});}
 function mkdirOwned(path:string,journal:OwnedPath[]){safe(path);if(existsSync(path)){if(!lstatSync(path).isDirectory())fail('INTEGRITY_BLOCKED');return;}mkdirOwned(dirname(path),journal);mkdirSync(path,{mode:0o700});own(path,journal);}
 function rollbackOwned(journal:OwnedPath[]){for(const item of [...journal].reverse()){safe(item.path);const now=lstatSync(item.path);if(now.dev!==item.dev||now.ino!==item.ino||now.isDirectory()!==item.directory||!item.directory&&(!now.isFile()||createHash('sha256').update(readFileSync(item.path)).digest('hex')!==item.sha256))fail('INTEGRITY_BLOCKED');if(item.directory)rmdirSync(item.path);else unlinkSync(item.path);}}
 function originals(directory:string,files:readonly import('../../packages/ports/member-source.ts').MemberSourceFile[]|undefined,source:import('../../packages/ports/member-source.ts').MemberSourceInspection,journal:OwnedPath[]){
  for(const file of files??[]){
   const selected=source.sources.find(s=>s.source_id===file.source_id);if(!membershipUuid(file.source_id)||!selected||selected.sha256!==createHash('sha256').update(file.bytes).digest('hex')||selected.format!==file.format||Number(selected.byte_length)!==file.bytes.length||!/^[a-z0-9]+$/.test(file.format))fail('SOURCE_CHANGED');
   const parent=join(directory,'010_draw',selected.source_id,selected.sha256),target=join(parent,'original.'+file.format);safe(target);mkdirOwned(parent,journal);safe(target);
   if(existsSync(target)){if(!lstatSync(target).isFile()||!readFileSync(target).equals(Buffer.from(file.bytes)))fail('INTEGRITY_BLOCKED');}
   else {writeFileSync(target,file.bytes,{flag:'wx',mode:0o600});own(target,journal);}
  }
 }
 function get(db:DatabaseSync,id:string){
  if(!membershipUuid(id))fail('AUTHORITY_REQUIRED');const r=db.prepare('SELECT * FROM tasks WHERE task_id=?').get(id);
  if(!r){validatedReads.delete(id);return null;}
  const value=readRow(r);remember(id,r.body_json,r.body_sha256,structuredClone(value));return value;
 }
 function readRow(r:Record<string,unknown>){const cached=validatedReads.get(String(r.task_id));const value=cached&&r.body_json===cached.body&&r.body_sha256===cached.digest?structuredClone(cached.value):decode(r,root);if(!cached||r.body_json!==cached.body||r.body_sha256!==cached.digest)assertPostReportEvidence(value);return value;}
 function remember(id:string,body:unknown,digest:unknown,value:OpenStoredTask){validatedReads.delete(id);validatedReads.set(id,{body,digest,value});if(validatedReads.size>2)validatedReads.delete(validatedReads.keys().next().value!);}
 function required(db:DatabaseSync,id:string){const t=get(db,id);if(!t)fail('NOT_FOUND');return t;}
 function save(db:DatabaseSync,t:OpenStoredTask){
  const body=encodeFiniteJson(t),digest=hashFiniteJson(t),value=decode({task_id:t.identity.task_id,body_json:body,body_sha256:digest},root);
  assertPostReportEvidence(value);
  db.prepare('UPDATE tasks SET body_json=?,body_sha256=? WHERE task_id=?').run(body,digest,t.identity.task_id);
  // get() still reads disk: a rollback or external edit cannot match this row.
  remember(t.identity.task_id,body,digest,value);return structuredClone(t);
 }
 function assertPostReportEvidence(t:OpenStoredTask){
  const post=t.report_postprocessing;if(!post)return;
  const sources=reportCheckSources(t,join(root,'analyses',t.identity.task_id)),catalog=sources.map(({content,resource_content,cells,file,task_directory,...source})=>source);
  function seal(completion:import('../../packages/ports/analysis-agent.ts').AnalysisCompletion){
   const path=join(root,'.juanerai/post-report-executions',hashFiniteJson(completion.id)+'.json');safe(path);let record:any;try{record=JSON.parse(readFileSync(path,'utf8'));}catch{fail('POST_REPORT_PROOF_INVALID');}
   if(!same(record.identity,t.identity)||!same(record.completion,completion)||completion.work_id!==t.identity.task_id||typeof record.text!=='string')fail('POST_REPORT_PROOF_INVALID');return record;
  }
  const records=(sealed:any,name:string)=>(sealed.completion.recorded_values??[]).filter((r:any)=>r.tool_name===name&&r.value?.accepted===true&&r.value?.staged===true&&r.value.record).map((r:any)=>r.value.record);
  for(const note of post.notes)seal(note.completion);
  if(post.editions.length===2){const revised=post.notes.filter(n=>n.role==='revision');if(revised.length!==1||revised[0]!.completion.purpose!=='report_revision'||seal(revised[0]!.completion).text!==post.editions[1]!.text)fail('POST_REPORT_PROOF_INVALID');}
  for(const [index,edition]of post.editions.entries()){
   const proof=edition.numeric_proof;
   if(proof){
    const question=reportUserQuestion(t),used=sources.filter(s=>s.qualification==='observed'&&Buffer.byteLength(s.content)<=1_048_576),executed=seal(proof.completion),reviewed=seal(proof.method_completion);
    if(proof.completion.purpose!=='analysis'||proof.completion.computation_context?.computation_id!==proof.subject||proof.completion.computation_context.role!=='independent_source'||proof.method_completion.computation_context?.computation_id!==proof.subject)fail('POST_REPORT_PROOF_INVALID');
    const materials=reportExecutionMaterials(proof.subject,executed.completion.executions!,used);
    const decoded=reportExecutedResults(executed.completion,proof.subject,sources),empty=reportEdition(edition.text,edition.version),base=index?carryReportComparisons(post.editions[index-1]!,empty,sources):{...empty,inventory:reportNumberInventory([],empty,sources.map(s=>s.path))};
    const bound=reportComparisonRecords(records(reviewed,'record_method'),base,question,sources,decoded.results);
    if(!same(bound.inventory,edition.inventory)||!same(bound.bindings,proof.bindings))fail('POST_REPORT_PROOF_INVALID');
    const expected=reportMethodReview({claims:bound.methods,limitations:[...decoded.limitations,...(reviewed.text.trim()?[reviewed.text]:[])]},hashFiniteJson({identity:t.identity,question,sources:catalog}),bound.inventory.claims,proof.method_completion,materials);if(!same(expected,proof.method_review))fail('POST_REPORT_PROOF_INVALID');
   }
   if(edition.review){const sealed=seal(edition.review.completion),expected=reportTextReview({claims:records(sealed,'record_review'),reviewed_paragraphs:[...new Set<string>(records(sealed,'record_reviewed').map((r:any)=>r.paragraph_ref))],uncovered:[],limitations:[...(sealed.text.trim()?[sealed.text]:[]),...reportEvidenceFeedback(sealed.completion)]},edition,edition.version===0?'initial':'recheck',reportUserQuestion(t),sources,edition.review.completion);if(!same(expected,edition.review))fail('POST_REPORT_PROOF_INVALID');}
  }
 }
 function current(db:DatabaseSync,lease:OpenTaskLease){const t=required(db,lease.task_id);if(t.state!=='running'||t.epoch!==lease.epoch||!same(identity(lease.identity),t.identity))fail('LEASE_EXPIRED');return t;}
 function submission(db:DatabaseSync,id:string){if(!membershipUuid(id))fail('VALIDATION_FAILED');const row=db.prepare('SELECT * FROM submissions WHERE command_id=?').get(id);return row?submissionDecode(row):null;}
 function saveSubmission(db:DatabaseSync,r:OpenSubmissionReceipt){submissionDecode({command_id:r.command_id,body_json:encodeFiniteJson(r),body_sha256:hashFiniteJson(r)});db.prepare('INSERT OR REPLACE INTO submissions VALUES(?,?,?)').run(r.command_id,encodeFiniteJson(r),hashFiniteJson(r));return structuredClone(r);}
 return {

  addRequirementMaterials(id,input){const journal:OwnedPath[]=[];closed(input,['command_id','input_sha256','expected_identity','source',...(input.originals?['originals']:[])]);if(!membershipUuid(input.command_id)||! /^[a-f0-9]{64}$/.test(input.input_sha256))fail('VALIDATION_FAILED');return access(true,db=>{
   const t=required(db,id),prior=t.requirement_materials?.find(r=>r.command_id===input.command_id);if(prior){if(prior.input_sha256!==input.input_sha256)fail('COMMAND_CONFLICT');return t;}
   if(!same(t.identity,identity(input.expected_identity)))fail('REVISION_CONFLICT');if(t.entry_mode!=='requirements')fail('VALIDATION_FAILED');if(requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(['running','unknown'].includes(t.state)||t.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');if((t.requirement_materials?.length??0)>=1000)fail('DRAFT_HISTORY_LIMIT');
   if(input.source.sources.length<=t.source.sources.length||input.source.sources.length>32||!same(input.source.sources.slice(0,t.source.sources.length),t.source.sources))fail('SOURCE_CHANGED');
   originals(join(root,'analyses',id),input.originals,input.source,journal);
   const next={...t.identity,revision:String(Number(t.identity.revision)+1),scope_sha256:hashFiniteJson(input.source),grant_id:randomUUID(),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()};
   const {history,revision_commands,revision_command_id,display_revision,version_choices,...snapshot}=t;void display_revision;void version_choices;
   return save(db,{conversation_outcome:null,computation_records:[],...(t.metric_asset_choice?{metric_asset_choice:structuredClone(t.metric_asset_choice)}:{}),identity:next,question:t.question,source:structuredClone(input.source),state:t.state==='stopped'?'stopped':'ready',epoch:t.epoch+1,pending_stop_epoch:null,outcome:null,entry_mode:'requirements',preferences:openAnalysisPreferences(t.preferences),...(t.requirement_inputs?{requirement_inputs:structuredClone(t.requirement_inputs)}:{}),...(t.requirement_draft?{requirement_draft:t.requirement_draft}:{}),...(t.requirement_reviews?{requirement_reviews:t.requirement_reviews}:{}),requirement_materials:[...(t.requirement_materials??[]),{command_id:input.command_id,input_sha256:input.input_sha256,analysis_revision:next.revision,scope_sha256:next.scope_sha256}],history:[...(history??[]),{...snapshot,}],revision_commands:[...(revision_commands??[]),revision_command_id??id],revision_command_id:input.command_id});
  },()=>fail('NOT_FOUND'),()=>rollbackOwned(journal));},
  startRequirement(id,raw){if(!raw||typeof raw!=='object'||Reflect.get(raw,'version')!=='2.0')fail('AUTHORITY_REQUIRED');const x=closed(raw,['version','command_id','expected_revision','expected_analysis_revision','scope_sha256','confirmed']);if(!membershipUuid(x.command_id)||x.confirmed!==true)fail('AUTHORITY_REQUIRED');return access(true,db=>{
   const t=required(db,id),d=t.requirement_draft;if(requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(t.requirement_execution&&t.requirement_execution.command_id===x.command_id){if(t.requirement_execution.request_sha256!==hashFiniteJson(x))fail('COMMAND_CONFLICT');return t;}if(t.identity.revision!==x.expected_analysis_revision||t.identity.scope_sha256!==x.scope_sha256)fail('REVISION_CONFLICT');if(!d||d.revision!==x.expected_revision)fail('REVISION_CONFLICT');if(['running','stopped','unknown'].includes(t.state)||t.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');if(t.identity.config_sha256===unconfiguredRequirementHash)fail('CONFIG_CHANGED');
   if(t.requirement_execution?.revision===d.revision&&t.requirement_execution.scope_sha256===t.identity.scope_sha256)fail('ALREADY_STARTED');
   const nextIdentity=t.requirement_execution?{...t.identity,revision:String(Number(t.identity.revision)+1),run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID()}:t.identity;
   const review={version:'1.0' as const,command_id:String(x.command_id),revision:d.revision,content_sha256:hashFiniteJson(d.content),scope_sha256:t.identity.scope_sha256,confirmed:true as const};
   if((t.requirement_reviews?.length??0)>=1000)fail('DRAFT_HISTORY_LIMIT');const reviews=[...(t.requirement_reviews??[]),review];
   const execution={version:'1.0' as const,command_id:String(x.command_id),request_sha256:hashFiniteJson(x),review_command_id:review.command_id,revision:d.revision,content:d.content,scope_sha256:t.identity.scope_sha256,analysis_revision:nextIdentity.revision,user_statements:requirementUserStatements(d,undefined,t.requirement_inputs)};
   if(!t.requirement_execution)return save(db,{...t,requirement_reviews:reviews,requirement_execution:execution,state:'ready'});
   const {history,revision_commands,revision_command_id,display_revision,version_choices,...snapshot}=t;void revision_command_id;void display_revision;void version_choices;
   return save(db,{conversation_outcome:null,computation_records:[],...(t.metric_asset_choice?{metric_asset_choice:structuredClone(t.metric_asset_choice)}:{}),identity:nextIdentity,question:t.question,source:t.source,state:'ready',epoch:t.epoch+1,pending_stop_epoch:null,outcome:null,...(t.entry_mode?{entry_mode:t.entry_mode}:{}),preferences:openAnalysisPreferences(t.preferences),requirement_draft:d,...(t.requirement_inputs?{requirement_inputs:structuredClone(t.requirement_inputs)}:{}),requirement_reviews:reviews,requirement_execution:execution,...(t.requirement_materials?{requirement_materials:t.requirement_materials}:{}),history:[...(history??[]),{...snapshot,}],revision_commands:[...(revision_commands??[]),revision_command_id??t.identity.task_id],revision_command_id:String(x.command_id)});
  },()=>fail('NOT_FOUND'));},
  configureRequirement(id,expected,config_sha256){return access(true,db=>{const t=required(db,id);if(!same(t.identity,expected)||t.identity.config_sha256!==unconfiguredRequirementHash||t.entry_mode!=='requirements'||t.state!=='ready'||t.pending_stop_epoch!==null||! /^[a-f0-9]{64}$/.test(config_sha256))fail('CONFIG_CHANGED');return save(db,{...t,identity:{...t.identity,config_sha256,grant_id:randomUUID()}});},()=>fail('NOT_FOUND'));},
  recordRequirementInputs(id,input){return access(true,db=>{
   closed(input,['command_id','request_sha256','expected_identity','complete','statements']);if(typeof input.complete!=='boolean')fail('VALIDATION_FAILED');const t=required(db,id);if(t.entry_mode!=='requirements'||!same(t.identity,identity(input.expected_identity)))fail('REVISION_CONFLICT');
   const prior=t.requirement_inputs?.find(r=>r.command_id===input.command_id);if(prior&&prior.request_sha256!==input.request_sha256)fail('COMMAND_CONFLICT');if(!input.complete){if(requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(prior)return t;}else if(!prior)fail('AUTHORITY_REQUIRED');
   const record={command_id:input.command_id,request_sha256:input.request_sha256,analysis_revision:prior?.analysis_revision??t.identity.revision,classification:'USER_SAID' as const,capture_complete:input.complete,statements:[...new Set([...(prior?.statements??[]),...input.statements])]},requirement_inputs=prior?t.requirement_inputs!.map(r=>r.command_id===input.command_id?record:r):[...(t.requirement_inputs??[]),record];
   validateRequirementRecords({...t,requirement_inputs});return save(db,{...t,requirement_inputs});
  },()=>fail('NOT_FOUND'));},
  saveRequirementDraft(id,raw){const command=requirementDraftCommand(raw);return access(true,db=>{const t=required(db,id),old=t.requirement_draft,prior=old?.receipts.find(r=>r.command_id===command.command_id);if(prior){if(prior.command_sha256!==hashFiniteJson(command))fail('COMMAND_CONFLICT');return t;}
   if(['running','unknown'].includes(t.state)||t.pending_stop_epoch!==null)fail('TASK_UNCONFIRMED');
   if(requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(command.expected_sequence!==(old?.sequence??0))fail('REVISION_CONFLICT');if((old?.sequence??0)>=1000)fail('DRAFT_HISTORY_LIMIT');
   const changed=!old||!same(old.content,command.content),revision=(old?.revision??0)+(changed?1:0),sequence=(old?.sequence??0)+1;
   const draft:RequirementDraft={version:'1.0',revision,sequence,content:command.content,receipts:[...(old?.receipts??[]),{command_id:command.command_id,command_sha256:hashFiniteJson(command),sequence,revision,message:command.message}],history:[...(old?.history??[]),...(old&&changed?[{revision:old.revision,content:old.content}]:[])],...((old?.conversation||command.discussion)?{conversation:[...(old?.conversation??[]),...(command.discussion?[{command_id:command.command_id,request_sha256:command.discussion.request_sha256,sequence,revision,user:{classification:'USER_SAID' as const,text:command.message},assistant:{classification:'MODEL_PROPOSAL' as const,text:command.discussion.reply}}]:[])]}:{})};
   return save(db,{...t,requirement_draft:validateRequirementDraft(draft)});
  },()=>fail('NOT_FOUND'));},
  selectVersion(id,raw){const command=versionChoice(raw);return access(true,db=>{const t=required(db,id),prior=t.version_choices?.find(c=>c.command_id===command.command_id);if(prior){if(!same(prior,command))fail('COMMAND_CONFLICT');return t;}if(t.identity.revision!==command.expected_revision)fail('REVISION_CONFLICT');const target=[t,...(t.history??[])].find(v=>v.identity.revision===command.target_revision);if(!target||target.identity.revision!==t.identity.revision&&!result(target)&&!target.computation_records.length&&!target.explorations?.length)fail('NOT_FOUND');if((t.version_choices?.length??0)>=1000)fail('VALIDATION_FAILED');return save(db,{...t,display_revision:command.target_revision,version_choices:[...(t.version_choices??[]),command]});},()=>fail('NOT_FOUND'));},
  reserveSubmission(id,hash){if(!membershipUuid(id)||! /^[a-f0-9]{64}$/.test(hash))fail('VALIDATION_FAILED');return access(true,db=>{const old=submission(db,id);if(old){if(old.input_sha256!==hash)fail('COMMAND_CONFLICT');return old;}return saveSubmission(db,{version:'1.0',command_id:id,input_sha256:hash,epoch:0,state:'reading'});},()=>fail('NOT_FOUND'));},
  submission(id){return access(false,db=>submission(db,id),()=>null);},
  stopSubmission(id){return access(true,db=>{const r=submission(db,id);if(!r)fail('NOT_FOUND');return r.state==='reading'?saveSubmission(db,{...r,state:'unknown'}):r;},()=>fail('NOT_FOUND'));},
  finishSubmission(id,epoch,state){if(!['stopped','failed'].includes(state))fail('VALIDATION_FAILED');return access(true,db=>{const r=submission(db,id);if(!r||r.epoch!==epoch)fail('LEASE_EXPIRED');if(r.state==='accepted'||['stopped','failed'].includes(r.state))return r;return saveSubmission(db,{...r,state:r.state==='unknown'?'stopped':state});},()=>fail('NOT_FOUND'));},
  recoverSubmissions(){const pending=access(false,db=>db.prepare('SELECT * FROM submissions').all().map(submissionDecode).filter(r=>['reading','unknown'].includes(r.state)),()=>[]);if(pending.length)access(true,db=>{for(const old of pending){const r=submission(db,old.command_id);if(r&&r.epoch===old.epoch&&['reading','unknown'].includes(r.state))saveSubmission(db,{...r,epoch:r.epoch+1,state:'unknown'});}},()=>undefined);},
  reportContent(id){return access(false,db=>projectReportContent(required(db,id)),()=>fail('NOT_FOUND'));},
  reportContentReceipt(id,command_id){if(!membershipUuid(command_id))fail('VALIDATION_FAILED');return access(false,db=>{const t=required(db,id);return [t,...(t.history??[])].flatMap(h=>h.report_content_events??[]).find(e=>e.command_id===command_id)??null;},()=>fail('NOT_FOUND'));},
  reportContentCommand(id,raw){return access(true,db=>{const t=required(db,id),e=nextReportContentEvent(t,raw);if(!t.report_content_events?.some(p=>p.command_id===e.command_id))save(db,{...t,report_content_events:[...(t.report_content_events??[]),e]});return e;},()=>fail('NOT_FOUND'));},
  
  
  judgmentReceipt(id,command_id){if(!membershipUuid(command_id))fail('VALIDATION_FAILED');return access(false,db=>findJudgment(required(db,id),command_id),()=>fail('NOT_FOUND'));},
  acknowledge(id,raw){const command=judgmentCommand(raw);return access(true,db=>{const t=required(db,id),prior=findJudgment(t,command.command_id);if(prior){const {saved,task_id,...old}=prior;void saved;void task_id;if(!same(old,command))fail('COMMAND_CONFLICT');return structuredClone(prior);}if(t.state!=='saved'||t.identity.revision!==command.expected_revision||!result(t)||result(t)!.outcome_id!==command.outcome_id||hashFiniteJson(result(t))!==command.outcome_sha256)fail('REVISION_CONFLICT');if(t.model_report&&t.report_postprocessing){const content=projectReportContent(t);if(command.version!=='1.1'||command.content_sha256!==content?.sha256||command.review_sha256!==hashFiniteJson(t.report_postprocessing)||t.pending_stop_epoch!==null)fail('REVISION_CONFLICT');}else if(command.version!=='1.0')fail('REVISION_CONFLICT');const record:OpenAnalysisJudgment={...command,saved:true,task_id:id};save(db,{...t,judgments:[...(t.judgments??[]),record]});return record;},()=>fail('NOT_FOUND'));},
  list(){return access(false,db=>{const rows=db.prepare('SELECT * FROM tasks ORDER BY rowid').all(),values=rows.map(readRow);for(let i=Math.max(0,rows.length-2);i<rows.length;i++){const row=rows[i]!;remember(String(row.task_id),row.body_json,row.body_sha256,structuredClone(values[i]!));}return values;},()=>[]);},
  directory(id){if(!membershipUuid(id))fail('AUTHORITY_REQUIRED');const directory=join(root,'analyses',id);safe(directory);if(!existsSync(directory)||!lstatSync(directory).isDirectory())fail('NOT_FOUND');return directory;},
  read(id){if(!membershipUuid(id))fail('AUTHORITY_REQUIRED');return access(false,db=>get(db,id),()=>null);},
  create(input){const journal:OwnedPath[]=[];let createdDirectory:{path:string;dev:number;ino:number;marker?:{dev:number;ino:number;sha256:string}}|undefined;const id=identity(input.identity);if(hashFiniteJson(input.source)!==id.scope_sha256)fail('SOURCE_CHANGED');const t:OpenStoredTask={conversation_outcome:null,computation_records:[],...(input.metric_asset_choice?{metric_asset_choice:structuredClone(input.metric_asset_choice)}:{}),...(input.entry_mode?{entry_mode:input.entry_mode}:{}),...(input.preferences?{preferences:openAnalysisPreferences(input.preferences)}:{}),identity:id,question:input.question,source:structuredClone(input.source),state:'ready',epoch:0,pending_stop_epoch:null,outcome:null};decode({task_id:id.task_id,body_json:encodeFiniteJson(t),body_sha256:hashFiniteJson(t)},root);return access(true,db=>{const receipt=submission(db,id.task_id);if(receipt&&receipt.state!=='reading')fail('CANCELLED');if(get(db,id.task_id))fail('TASK_EXISTS');
   const parent=join(root,'analyses'),directory=join(parent,id.task_id);safe(directory);mkdirSync(parent,{recursive:true});safe(directory);
   if(existsSync(directory))fail('ANALYSIS_DIRECTORY_CONFLICT');
   mkdirSync(directory);const own=lstatSync(directory);createdDirectory={path:directory,dev:own.dev,ino:own.ino};const marker=join(directory,'README.md');
   for(const name of ['010_draw','020_clean','060_reports'])mkdirOwned(join(directory,name),journal);
   originals(directory,input.originals,input.source,journal);
   try{writeFileSync(marker,'# JuanerAI 分析任务\n\n任务 ID：'+id.task_id+'\n\n原始资料在 `010_draw`、派生可读视图在 `020_clean`、报告副本在 `060_reports`。历史版本、资格、效果及报告权威记录保存于本项目 `.xanthil/desktop/open-analysis.sqlite`，以任务 ID 读回。此目录不是独立数据权威；同一任务修订沿用此目录，下载的报告副本由浏览器选择保存位置。\n',{encoding:'utf8',flag:'wx'});const written=lstatSync(marker);createdDirectory.marker={dev:written.dev,ino:written.ino,sha256:createHash('sha256').update(readFileSync(marker)).digest('hex')};}catch(error){throw error;}
   db.prepare('INSERT INTO tasks VALUES(?,?,?)').run(id.task_id,encodeFiniteJson(t),hashFiniteJson(t));if(receipt)saveSubmission(db,{...receipt,state:'accepted'});return structuredClone(t);},()=>fail('NOT_FOUND'),()=>{
   if(!createdDirectory)return;const d=createdDirectory;safe(d.path);const now=lstatSync(d.path);if(now.dev!==d.dev||now.ino!==d.ino||!now.isDirectory())fail('INTEGRITY_BLOCKED');
   const marker=join(d.path,'README.md');safe(marker);if(existsSync(marker)){const now=lstatSync(marker);if(!d.marker||now.dev!==d.marker.dev||now.ino!==d.marker.ino||createHash('sha256').update(readFileSync(marker)).digest('hex')!==d.marker.sha256)fail('INTEGRITY_BLOCKED');unlinkSync(marker);}
   rollbackOwned(journal);rmdirSync(d.path);
  });},
  begin(id){return access(true,db=>{const t=required(db,id);if(t.state==='unknown'||requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(t.state!=='ready')fail('TASK_BUSY');const next=save(db,{...t,state:'running',epoch:t.epoch+1});return {task_id:id,epoch:next.epoch,identity:structuredClone(next.identity)};},()=>fail('NOT_FOUND'));},
  revise(id,input){const journal:OwnedPath[]=[];closed(input,['command_id','expected_revision','expected_epoch','question','identity','preferences',...(input.originals?['originals']:[]),...(input.source?['source']:[]),...(input.metric_asset_choice?['metric_asset_choice']:[])]);if(!membershipUuid(input.command_id)||!Number.isSafeInteger(input.expected_epoch)||input.expected_epoch<0||typeof input.question!=='string'||!input.question.trim()||input.question.length>12000)fail('VALIDATION_FAILED');return access(true,db=>{
   const t=required(db,id),previousCommands=t.revision_commands??[];
   if(t.revision_command_id===input.command_id){if(t.question!==input.question||input.metric_asset_choice&&(!t.metric_asset_choice||!same(t.metric_asset_choice,input.metric_asset_choice)))fail('COMMAND_CONFLICT');return t;}
   const index=previousCommands.indexOf(input.command_id);if(index>=0){if(t.history![index]!.question!==input.question)fail('COMMAND_CONFLICT');return t;}
   if(t.identity.revision!==input.expected_revision)fail('REVISION_CONFLICT');if(!input.metric_asset_choice&&!input.source&&t.question===input.question&&same(openAnalysisPreferences(t.preferences),openAnalysisPreferences(input.preferences)))return t;
   if(t.epoch!==input.expected_epoch||t.state==='unknown'||t.pending_stop_epoch!==null||requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(!['saved','failed','stopped'].includes(t.state)&&!(t.state==='ready'&&input.metric_asset_choice))fail('TASK_BUSY');
   const next=identity(input.identity);if(next.task_id!==id||next.revision!==String(Number(t.identity.revision)+1)||['config_sha256',...(input.source?[]:['grant_id','scope_sha256'])].some(k=>Reflect.get(next,k)!==Reflect.get(t.identity,k)))fail('IDENTITY_CONFLICT');
   if(input.source&&(hashFiniteJson(input.source)!==next.scope_sha256||next.scope_sha256===t.identity.scope_sha256||next.grant_id===t.identity.grant_id))fail('IDENTITY_CONFLICT');
   originals(join(root,'analyses',id),input.originals,input.source??t.source,journal);
   const {history,revision_command_id,revision_commands,display_revision,version_choices,...snapshot}=t;const {requirement_execution,model_report,report_postprocessing,...body}=snapshot;void display_revision;void version_choices;void requirement_execution;void model_report;void report_postprocessing;
   return save(db,{...body,history:[...(history??[]),snapshot],judgments:[],...(t.report_content_events?{report_content_events:[]}:{}),revision_commands:[...previousCommands,revision_command_id??id],revision_command_id:input.command_id,identity:next,...(input.metric_asset_choice?{metric_asset_choice:structuredClone(input.metric_asset_choice)}:{}),...(input.source?{source:structuredClone(input.source)}:{}),preferences:openAnalysisPreferences(input.preferences),question:input.question,state:'ready',epoch:t.epoch+1,pending_stop_epoch:null});
  },()=>fail('NOT_FOUND'),()=>rollbackOwned(journal));},

  resume(id){return access(true,db=>{const t=required(db,id);if(t.state==='unknown'||t.pending_stop_epoch!==null||requirementInputUnconfirmed(t))fail('TASK_UNCONFIRMED');if(t.state!=='stopped')fail('TASK_BUSY');return save(db,{...t,state:'ready',epoch:t.epoch+1});},()=>fail('NOT_FOUND'));},
  stop(id){return access(true,db=>{const t=required(db,id);if(t.state==='saved'&&t.report_postprocessing&&reportPostActive(t.report_postprocessing.state))return save(db,{...t,report_postprocessing:{...t.report_postprocessing,state:'unknown',failure_code:'STOP_REQUESTED'},epoch:t.epoch+1,pending_stop_epoch:t.epoch});if(t.state==='running')return save(db,{...t,state:'unknown',epoch:t.epoch+1,pending_stop_epoch:t.epoch});if(t.state==='ready')return save(db,{...t,state:'stopped',epoch:t.epoch+1});if(['saved','failed','stopped'].includes(t.state)&&t.pending_stop_epoch===null&&t.report_postprocessing?.state!=='unknown')return save(db,{...t,epoch:t.epoch+1});return t;},()=>fail('NOT_FOUND'));},
  recover(id){return access(true,db=>{const t=required(db,id);if(t.state==='saved'&&t.report_postprocessing&&(reportPostActive(t.report_postprocessing.state)||t.pending_stop_epoch!==null))return save(db,{...t,report_postprocessing:{...t.report_postprocessing,state:'unknown',failure_code:'RECOVERY_REQUIRED'},epoch:t.epoch+1,pending_stop_epoch:null});if(t.state==='running'||t.pending_stop_epoch!==null)return save(db,{...t,state:'unknown',epoch:t.epoch+1,pending_stop_epoch:null});return t;},()=>fail('NOT_FOUND'));},
  finish(lease,state){if(!['stopped','failed'].includes(state))fail('VALIDATION_FAILED');return access(true,db=>{const t=required(db,lease.task_id);if(!same(identity(lease.identity),t.identity))fail('LEASE_EXPIRED');if(t.state==='unknown'&&t.pending_stop_epoch===lease.epoch)return save(db,{...t,state:'stopped',pending_stop_epoch:null});current(db,lease);return save(db,{...t,state,epoch:t.epoch+1});},()=>fail('NOT_FOUND'));},
  saveReportPostprocessing(lease,value){const journal:OwnedPath[]=[];return access(true,db=>{const t=required(db,lease.task_id);if(t.state!=='saved'||!same(t.identity,lease.identity))fail('LEASE_EXPIRED');
   if(t.epoch!==lease.epoch||t.pending_stop_epoch!==null){if(t.pending_stop_epoch===lease.epoch&&t.report_postprocessing&&['stopped','unknown'].includes(value.state))return save(db,{...t,report_postprocessing:{...t.report_postprocessing,state:value.state,failure_code:value.failure_code},pending_stop_epoch:value.state==='stopped'?null:t.pending_stop_epoch});fail('LEASE_EXPIRED');}
   validateReportPostprocessing(value,t,join(root,'analyses',t.identity.task_id));const old=t.report_postprocessing;if(old){if(same(old,value))return t;if(!reportPostActive(old.state)||old.revision_attempted&&!value.revision_attempted||value.editions.length<old.editions.length||old.notes.some((n,i)=>!same(n,value.notes[i]))||old.editions.some((e,i)=>{const next=value.editions[i];return !next||e.text!==next.text||e.inventory?.claims.some(c=>!next.inventory?.claims.some(n=>same(c,n)))||e.numeric_proof&&(!same(e.numbers,next.numbers)||!same(e.numeric_proof,next.numeric_proof))||e.review&&!same(refreshReportTextReview({...next,review:e.review},reportUserQuestion(t),reportCheckSources(t,join(root,'analyses',t.identity.task_id))),next.review);}))fail('POST_REPORT_INVALID');
   // Activity labels report Pi's current work; they do not prescribe its order.
   // Revision count, immutable history, real sealed completion and leases still
   // guard publication independently of whether review happened first.
   }else if(value.state!=='checking'||value.revision_attempted||value.editions.length!==1)fail('POST_REPORT_INVALID');
   for(const edition of value.editions){const target=join(root,'analyses',t.identity.task_id,'060_reports',value.outcome_id+(edition.version?'.R'+edition.version:'')+'.md');safe(target);if(existsSync(target)){if(readFileSync(target,'utf8')!==edition.text)fail('INTEGRITY_BLOCKED');}else {writeFileSync(target,edition.text,{encoding:'utf8',flag:'wx',mode:0o600});own(target,journal);}}
   return save(db,{...t,report_postprocessing:structuredClone(value)});
  },()=>fail('NOT_FOUND'),()=>rollbackOwned(journal));},
  saveModelReport(lease,value){const journal:OwnedPath[]=[];return access(true,db=>{const t=current(db,lease);requireReportMarkdown(value.text);modelReport(value,t,root);const target=join(root,'analyses',t.identity.task_id,'060_reports',value.outcome_id+'.md');safe(target);if(existsSync(target)){if(readFileSync(target,'utf8')!==value.text)fail('INTEGRITY_BLOCKED');}else {writeFileSync(target,value.text,{encoding:'utf8',flag:'wx',mode:0o600});own(target,journal);}save(db,{...t,model_report:structuredClone(value),state:'saved',epoch:t.epoch+1});return {saved:true,outcome_id:value.outcome_id,...t.identity};},()=>fail('NOT_FOUND'),()=>rollbackOwned(journal));},
 };
}


