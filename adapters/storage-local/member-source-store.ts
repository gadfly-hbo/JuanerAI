import {readMemberClarifications,readGrantClarifications} from './member-clarification.ts';
import {randomUUID} from 'node:crypto';
import {closeSync,constants,fsyncSync,fstatSync,lstatSync,mkdirSync,openSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {DatabaseSync} from 'node:sqlite';
import {membershipBytesHash,membershipRecord,membershipUuid,membershipHash,validateMembershipPlan} from '../../packages/product-core/member-analysis.ts';
import {selectedSourceDescriptors,selectedSourceFiles,validateSelectedSources} from '../../packages/product-core/member-source-set.ts';
import {encodeTask,taskHash,fail} from '../../packages/product-core/member-task.ts';
import {preparedConfirmationContext,bindQualifiedPreparation,preparationAttempt,preparationReceipt,normalizedMemberData,assertPreparationCandidate,qualifiedMemberPreparation,type QualifiedMemberPreparation} from '../../packages/product-core/member-preparation.ts';
import {memberSourceBindings,qualifyExtractedMemberSources} from '../../packages/product-core/member-source-qualification.ts';
import {reserveMemberOperation,issueMemberOperation,settleMemberOperation} from './member-operation.ts';
import type {MemberPreparationStore,PreparationAttempt} from '../../packages/ports/member-preparation.ts';
import type {MemberSourceStore} from '../../packages/ports/member-source-store.ts';

export const memberSourceSchema=`
CREATE TABLE membership_source_sets (
 source_set_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, command_id TEXT NOT NULL UNIQUE,
 input_sha256 TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id), UNIQUE(task_id,source_set_id)
 );
CREATE TABLE membership_preparation_attempts (
 execution_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, source_set_id TEXT NOT NULL,
 body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 FOREIGN KEY(execution_id) REFERENCES membership_operation_usage(execution_id),
 FOREIGN KEY(task_id,source_set_id) REFERENCES membership_source_sets(task_id,source_set_id)
 );
CREATE TABLE membership_preparations (
 preparation_id TEXT NOT NULL PRIMARY KEY, execution_id TEXT NOT NULL UNIQUE,
 task_id TEXT NOT NULL, source_set_id TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 FOREIGN KEY(execution_id) REFERENCES membership_preparation_attempts(execution_id),
 FOREIGN KEY(task_id,source_set_id) REFERENCES membership_source_sets(task_id,source_set_id),
 UNIQUE(task_id,preparation_id)
 );
CREATE TABLE membership_confirmation_preparations (
 confirmation_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, preparation_id TEXT NOT NULL,
 context_json TEXT NOT NULL, context_sha256 TEXT NOT NULL,
 FOREIGN KEY(confirmation_id) REFERENCES input_confirmations(confirmation_id),
 FOREIGN KEY(task_id,preparation_id) REFERENCES membership_preparations(task_id,preparation_id)
);
CREATE TABLE membership_plan_preparations (
 plan_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, preparation_id TEXT NOT NULL,
 FOREIGN KEY(plan_id) REFERENCES membership_plans(plan_id),
 FOREIGN KEY(task_id,preparation_id) REFERENCES membership_preparations(task_id,preparation_id)
);
`;

export function assertMemberSourceSets(db:DatabaseSync) {
  for (const row of db.prepare('SELECT * FROM membership_source_sets').all()) {
    const body=validateSelectedSources(JSON.parse(String(row.body_json)));
    const owner=db.prepare('SELECT project_id,session_id,case_id FROM membership_tasks WHERE task_id=?').get(body.task_id);
    const revision=db.prepare('SELECT case_id FROM case_revisions WHERE revision_id=?').get(body.owner.revision_id);
    if (body.id!==row.source_set_id || body.task_id!==row.task_id || taskHash(body)!==row.body_sha256 || !membershipUuid(row.command_id) || !/^[a-f0-9]{64}$/.test(String(row.input_sha256)) || !owner || Object.entries(owner).some(([k,v])=>body.owner[k as keyof typeof body.owner]!==v) || revision?.case_id!==body.owner.case_id) fail('INTEGRITY_BLOCKED');
  }
  for(const row of db.prepare('SELECT * FROM membership_preparation_attempts').all()) {
    const a=preparationAttempt(JSON.parse(String(row.body_json))),u=db.prepare('SELECT * FROM membership_operation_usage WHERE execution_id=?').get(String(row.execution_id));
    if(taskHash(a)!==row.body_sha256||a.context.task_id!==row.task_id||a.source_set_id!==row.source_set_id||!u||a.context.execution_id!==u.execution_id||a.context.operation_id!==u.operation_id||a.context.epoch!==u.epoch||a.context.task_id!==u.task_id)fail('INTEGRITY_BLOCKED');
  }
  for(const row of db.prepare('SELECT * FROM membership_preparations').all()) {
    const p=qualifiedMemberPreparation(JSON.parse(String(row.body_json))),a=db.prepare('SELECT body_json FROM membership_preparation_attempts WHERE execution_id=?').get(String(row.execution_id)),u=db.prepare('SELECT phase,outcome FROM membership_operation_usage WHERE execution_id=?').get(String(row.execution_id));
    if(taskHash(p)!==row.body_sha256||p.id!==row.preparation_id||p.context.task_id!==row.task_id||p.context.execution_id!==row.execution_id||p.source_set_id!==row.source_set_id||!a||preparationAttempt(JSON.parse(String(a.body_json))).status!=='qualified'||u?.phase!=='settled'||u.outcome!=='succeeded')fail('INTEGRITY_BLOCKED');
  }
  for(const row of db.prepare('SELECT * FROM membership_confirmation_preparations').all()) {
    const context=preparedConfirmationContext(JSON.parse(String(row.context_json))),p=db.prepare('SELECT body_json FROM membership_preparations WHERE preparation_id=? AND task_id=?').get(String(row.preparation_id),String(row.task_id)),c=db.prepare('SELECT * FROM input_confirmations WHERE confirmation_id=?').get(String(row.confirmation_id));
    if(taskHash(context)!==row.context_sha256||context.authority.task_id!==row.task_id||context.preparation.id!==row.preparation_id||!p||!c||taskHash(bindQualifiedPreparation(qualifiedMemberPreparation(JSON.parse(String(p.body_json)))))!==taskHash(context.preparation)||Object.entries(context.preparation.owner).some(([k,v])=>c[k]!==v))fail('INTEGRITY_BLOCKED');
  }
}

type Access=<T>(write:boolean,work:(db:DatabaseSync)=>T)=>T;
export function memberSourceReaders(projectRoot:string) {
  const base=join(projectRoot,'.xanthil','desktop','member-sources');
  const directory=(path:string)=>{const s=lstatSync(path);if(!s.isDirectory()||s.isSymbolicLink())fail('INTEGRITY_BLOCKED');};
  const sync=(path:string)=>{const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{fsyncSync(fd);}finally{closeSync(fd);}};
  function parents(create:boolean) {
    directory(projectRoot);directory(join(projectRoot,'.xanthil'));directory(join(projectRoot,'.xanthil','desktop'));
    try {directory(base);} catch(error) {if(!create||(error as NodeJS.ErrnoException).code!=='ENOENT')throw error;mkdirSync(base,{mode:0o700});sync(join(projectRoot,'.xanthil','desktop'));}
  }
  function read(db:DatabaseSync,task_id:string,id:string) {
    const row=db.prepare('SELECT body_json,body_sha256 FROM membership_source_sets WHERE task_id=? AND source_set_id=?').get(task_id,id);
    if(!row)fail('NOT_FOUND');
    const source_set=validateSelectedSources(JSON.parse(String(row.body_json)));
    if(taskHash(source_set)!==row.body_sha256)fail('INTEGRITY_BLOCKED');
    try {
      parents(false);const root=join(base,id);directory(root);
      const sources=source_set.sources.map(s=>{
        const fd=openSync(join(root,s.source_id+'.'+s.format),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
        try {
          const before=fstatSync(fd);
          if(!before.isFile()||before.nlink!==1||before.size!==Number(s.byte_length))fail('INTEGRITY_BLOCKED');
          const bytes=readFileSync(fd),after=fstatSync(fd);
          if(bytes.length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||membershipBytesHash(bytes)!==s.sha256)fail('INTEGRITY_BLOCKED');
          return {source_id:s.source_id,display_name:s.display_name,format:s.format,bytes};
        } finally {closeSync(fd);}
      });
      return {source_set,sources};
    } catch {fail('INTEGRITY_BLOCKED');}
  }
  function attempt(db:DatabaseSync,task_id:string,execution_id:string):PreparationAttempt {
    const row=db.prepare('SELECT body_json,body_sha256 FROM membership_preparation_attempts WHERE task_id=? AND execution_id=?').get(task_id,execution_id);
    if(!row)fail('NOT_FOUND');
    const body=preparationAttempt(JSON.parse(String(row.body_json)));
    if(taskHash(body)!==row.body_sha256||body.version!=='1.0'||body.context.task_id!==task_id||body.context.execution_id!==execution_id)fail('INTEGRITY_BLOCKED');
    return body;
  }
  function saveAttempt(db:DatabaseSync,body:PreparationAttempt) {
    db.prepare('UPDATE membership_preparation_attempts SET body_json=?,body_sha256=? WHERE execution_id=?').run(encodeTask(body),taskHash(body),body.context.execution_id);
  }
  function file(path:string,length:number,sha256:string) {
    try {
      const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
      try{const s=fstatSync(fd);if(!s.isFile()||s.nlink!==1||s.size!==length)fail('INTEGRITY_BLOCKED');const bytes=readFileSync(fd),after=fstatSync(fd);if(bytes.length!==length||after.size!==s.size||after.mtimeMs!==s.mtimeMs||membershipBytesHash(bytes)!==sha256)fail('INTEGRITY_BLOCKED');return bytes;}finally{closeSync(fd);}
    }catch{fail('INTEGRITY_BLOCKED');}
  }
  function executionFiles(p:QualifiedMemberPreparation) {
    const runs=join(projectRoot,'.xanthil','desktop','preparation-runs'),root=join(runs,p.context.execution_id);directory(runs);directory(root);
    for(const [name,digest] of [['request.json',p.receipt.request_sha256],['policy.sb',p.receipt.policy_sha256],['outcome.json',p.receipt.outcome_sha256],['payload.py',p.code_sha256]]) {
      const path=join(root,name),size=lstatSync(path).size;if(size>1048576)fail('INTEGRITY_BLOCKED');file(path,size,digest);
    }
  }
  function qualified(db:DatabaseSync,task_id:string,execution_id:string) {
    const row=db.prepare('SELECT body_json,body_sha256 FROM membership_preparations WHERE task_id=? AND execution_id=?').get(task_id,execution_id);if(!row)fail('NOT_FOUND');
    const preparation=qualifiedMemberPreparation(JSON.parse(String(row.body_json)));if(taskHash(preparation)!==row.body_sha256)fail('INTEGRITY_BLOCKED');
    const selected=read(db,task_id,preparation.source_set_id);if(taskHash(selected.source_set)!==preparation.source_set_sha256||taskHash(selected.source_set.owner)!==taskHash(preparation.owner))fail('INTEGRITY_BLOCKED');
    const normalized=join(projectRoot,'.xanthil','desktop','member-preparations'),root=join(normalized,preparation.id);directory(normalized);directory(root);
    const candidate=normalizedMemberData({members_bytes:file(join(root,'members.csv'),preparation.receipt.outputs.members.byte_length,preparation.receipt.outputs.members.sha256),orders_bytes:file(join(root,'orders.csv'),preparation.receipt.outputs.orders.byte_length,preparation.receipt.outputs.orders.sha256)});
    if(taskHash(qualifyExtractedMemberSources(selected.source_set.inspection,preparation.qualification.bindings,candidate))!==taskHash(preparation.qualification))fail('INTEGRITY_BLOCKED');
    executionFiles(preparation);return {preparation,candidate};
  }
  return {base,directory,sync,parents,read,attempt,saveAttempt,file,executionFiles,qualified};
}
export function resolveMemberPlanPreparation(db:DatabaseSync,projectRoot:string,input:unknown,requireActive:boolean,owningRunId?:string) {
  const context=preparedConfirmationContext(input),p=context.preparation,a=context.authority;
  if(db.prepare('PRAGMA user_version').get()?.user_version!==120)fail('SCHEMA_UNSUPPORTED');
  const saved=memberSourceReaders(projectRoot).qualified(db,a.task_id,p.execution_id);
  if(taskHash(bindQualifiedPreparation(saved.preparation))!==taskHash(p))fail('SOURCE_CHANGED');
  const task=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(a.task_id),grant=db.prepare('SELECT * FROM membership_operation_grants WHERE task_id=? AND grant_id=?').get(a.task_id,a.grant_id);
  if(!task||!grant||String(grant.epoch)!==a.epoch||grant.scope_sha256!==p.source_set_sha256||['project_id','session_id','case_id'].some(k=>task[k]!==p.owner[k as keyof typeof p.owner]))fail('AUTHORITY_REQUIRED');
  const revision=db.prepare('SELECT question_text,hypothesis_display_title FROM case_revisions WHERE revision_id=?').get(p.owner.revision_id);if(!revision||context.intent.question_sha256!==membershipBytesHash(Buffer.from(String(revision.question_text)))||context.intent.user_hypothesis!==(String(revision.hypothesis_display_title).trim()?String(revision.hypothesis_display_title):null))fail('SOURCE_CHANGED');
  const materialRow=db.prepare('SELECT body_json FROM membership_model_grants WHERE grant_id=?').get(a.grant_id),material=materialRow?JSON.parse(String(materialRow.body_json)):null;
  if(a.resume_preparation_sha256!==undefined){if(!material||material.reuse?.preparation_execution_id!==p.execution_id||a.resume_preparation_sha256!==p.sha256)fail('AUTHORITY_REQUIRED');readGrantClarifications(db,material);}
  const clarifications=context.intent.version==='2.0'?(material?readGrantClarifications(db,material):null):undefined;
  if(context.intent.version==='2.0'&&clarifications?.at(-1)?.sha256!==context.intent.clarification_sha256)fail('SOURCE_CHANGED');
  if(requireActive){const material=db.prepare('SELECT body_json FROM membership_model_grants WHERE grant_id=?').get(a.grant_id),clarification=material?JSON.parse(String(material.body_json)).clarification_sha256:undefined;if(clarification!==context.intent.clarification_sha256)fail('SOURCE_CHANGED');}
  if(requireActive){
    if(grant.revoked!==0||Date.now()>=Date.parse(String(grant.expires_at))||String(task.epoch)!==a.epoch||task.current_revision_id!==p.owner.revision_id||['stopped','interrupted','closed'].includes(String(task.status)))fail('AUTHORITY_REQUIRED');
    if(db.prepare('SELECT source_set_id FROM membership_source_sets WHERE task_id=? ORDER BY rowid DESC LIMIT 1').get(a.task_id)?.source_set_id!==p.source_set_id)fail('SOURCE_CHANGED');
    const pending=db.prepare("SELECT * FROM membership_operation_usage WHERE phase IN ('reserved','issued','unresolved')").get();
    if(pending){
      const link=owningRunId&&db.prepare('SELECT l.*,r.status,r.run_contract_version,p.body_json,p.body_sha256 FROM membership_analysis_operations l JOIN analysis_runs r ON r.run_id=l.run_id JOIN membership_run_plans rp ON rp.run_id=r.run_id JOIN membership_plans p ON p.plan_id=rp.plan_id WHERE l.run_id=?').get(owningRunId);
      if(!link||pending.phase!=='issued'||link.execution_id!==pending.execution_id||link.status!=='Running'||link.run_contract_version!=='5.0'||pending.task_id!==a.task_id||pending.grant_id!==a.grant_id||String(pending.epoch)!==a.epoch)fail('PHYSICAL_PENDING');
      const plan=validateMembershipPlan(JSON.parse(String(link.body_json)));if(plan.version!=='2.0'||membershipHash(plan)!==link.plan_sha256||link.body_sha256!==link.plan_sha256||taskHash({version:'2.0',preparation:plan.preparation,authority:plan.authority,intent:plan.intent})!==taskHash(context))fail('PHYSICAL_PENDING');
      const operation=db.prepare('SELECT kind,stage FROM membership_operations WHERE operation_id=?').get(String(pending.operation_id));if(operation?.kind!=='analysis'||operation.stage!=='calculate')fail('PHYSICAL_PENDING');
    }
  }
  return {...saved,context,...(clarifications?{clarifications}:{})};
}
export function memberSourceMethods(projectRoot:string,access:Access,fault?:(point:string,db:DatabaseSync)=>void):MemberSourceStore&MemberPreparationStore {
  const {base,directory,sync,parents,read,attempt,saveAttempt,file,executionFiles,qualified}=memberSourceReaders(projectRoot);
  return {
    async readPlanPreparation(input) {return access(false,db=>resolveMemberPlanPreparation(db,projectRoot,input,true));},
    async beginPreparation(input) {
      const x=membershipRecord(input,['version','task_id','source_set_id','grant_id','bindings','code_sha256']);
      if(x.version!=='1.0'||!membershipUuid(x.task_id)||!membershipUuid(x.source_set_id)||!membershipUuid(x.grant_id)||typeof x.code_sha256!=='string'||!/^[a-f0-9]{64}$/.test(x.code_sha256))fail();
      const task_id=x.task_id,source_set_id=x.source_set_id,grant_id=x.grant_id,code_sha256=x.code_sha256,bindings=memberSourceBindings(x.bindings);
      return access(true,db=>{
        const selected=read(db,task_id,source_set_id),source_set_sha256=taskHash(selected.source_set);
        const latest=db.prepare('SELECT source_set_id FROM membership_source_sets WHERE task_id=? ORDER BY rowid DESC LIMIT 1').get(task_id);
        if(latest?.source_set_id!==source_set_id)fail('SOURCE_CHANGED');
        const grant=db.prepare('SELECT scope_sha256 FROM membership_operation_grants WHERE task_id=? AND grant_id=?').get(task_id,grant_id);
        if(grant?.scope_sha256!==source_set_sha256)fail('AUTHORITY_REQUIRED');
        const priorRow=db.prepare('SELECT a.body_json,o.input_sha256,u.execution_index,u.outcome FROM membership_preparation_attempts a JOIN membership_operation_usage u ON u.execution_id=a.execution_id JOIN membership_operations o ON o.operation_id=u.operation_id WHERE a.task_id=? AND a.source_set_id=? ORDER BY a.rowid DESC LIMIT 1').get(task_id,source_set_id);
        const prior=priorRow?preparationAttempt(JSON.parse(String(priorRow.body_json))):null;
        if(prior?.status==='qualified'&&(prior.code_sha256!==code_sha256||taskHash(prior.bindings)!==taskHash(bindings)))fail('SOURCE_CHANGED');
        if(prior?.status==='failed'&&priorRow!.execution_index===0&&priorRow!.outcome==='conversion_failure'&&prior.code_sha256===code_sha256&&taskHash(prior.bindings)===taskHash(bindings))fail(prior.failure_code!);
        const reserved=reserveMemberOperation(db,{task_id,grant_id,kind:'preparation',stage:'prepare',input_sha256:priorRow?String(priorRow.input_sha256):taskHash({source_set_sha256,bindings})});
        if(reserved.phase==='settled'&&reserved.outcome==='succeeded'){if(reserved.grant_id!==grant_id){const row=db.prepare('SELECT body_json FROM membership_model_grants WHERE task_id=? AND grant_id=?').get(task_id,grant_id),g=row?JSON.parse(String(row.body_json)):null;if(!g||g.reuse?.preparation_execution_id!==reserved.execution_id)fail('AUTHORITY_REQUIRED');readGrantClarifications(db,g);}const saved=qualified(db,task_id,reserved.execution_id);return {attempt:attempt(db,task_id,reserved.execution_id),execution:reserved,...selected,run_directory:join(projectRoot,'.xanthil','desktop','preparation-runs',reserved.execution_id),prepared:saved.preparation};}
        if(reserved.phase!=='reserved')fail('COMMAND_CONFLICT');
        const execution=issueMemberOperation(db,{task_id,execution_id:reserved.execution_id});
        const context={task_id,execution_id:execution.execution_id,operation_id:execution.operation_id,epoch:execution.epoch};
        const previous=db.prepare('SELECT execution_id FROM membership_operation_usage WHERE operation_id=? AND execution_index<? ORDER BY execution_index DESC LIMIT 1').get(execution.operation_id,execution.execution_index);
        const body:PreparationAttempt={version:'1.0',context,source_set_id,source_set_sha256,previous_execution_id:previous?String(previous.execution_id):null,bindings,code_sha256,status:'issued',failure_code:null,physical_status:'unknown'};
        const runs=join(projectRoot,'.xanthil','desktop','preparation-runs');
        parents(false);try{directory(runs);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;mkdirSync(runs,{mode:0o700});sync(join(projectRoot,'.xanthil','desktop'));}
        db.prepare('INSERT INTO membership_preparation_attempts VALUES(?,?,?,?,?)').run(execution.execution_id,task_id,source_set_id,encodeTask(body),taskHash(body));
        return {attempt:body,execution,...selected,run_directory:join(runs,execution.execution_id)};
      });
    },
    async failPreparation(input) {
      const x=membershipRecord(input,['task_id','execution_id','failure','code']);
      if(!membershipUuid(x.task_id)||!membershipUuid(x.execution_id)||typeof x.code!=='string'||!/^[A-Z0-9_]{1,80}$/.test(x.code))fail();
      const task_id=x.task_id,execution_id=x.execution_id,code=x.code;
      return access(true,db=>{
        const prior=attempt(db,task_id,execution_id);
        if(!['issued','unknown'].includes(prior.status))fail('COMMAND_CONFLICT');
        const evidence=input.failure;
        const physical_status=evidence&&taskHash(evidence.operation_context)===taskHash(prior.context)&&['not_started','settled'].includes(evidence.physical_status)?evidence.physical_status:'unknown';
        const zero={kind:'known' as const,value:'0'},unknown={kind:'unknown' as const,reason:'preparation-duration-unavailable'};
        const settled=settleMemberOperation(db,{task_id,execution_id,physical:physical_status==='unknown'?'unresolved':'settled',outcome:['CONVERSION_UNQUALIFIED','PREPARATION_OUTPUT_INVALID'].includes(code)?'conversion_failure':'permanent_failure',usage:{input_tokens:zero,output_tokens:zero,active_ms:physical_status==='not_started'?zero:unknown,wait_ms:unknown}});
        const body:PreparationAttempt={...prior,status:settled.outcome==='stopped'?'stopped':physical_status==='unknown'?'unknown':'failed',failure_code:code,physical_status};
        saveAttempt(db,body);return body;
      });
    },
    async completePreparation(input) {
      const x=membershipRecord(input,['task_id','execution_id','receipt','candidate','qualification']);if(!membershipUuid(x.task_id)||!membershipUuid(x.execution_id))fail();
      const task_id=x.task_id,execution_id=x.execution_id,receipt=preparationReceipt(x.receipt),candidate=normalizedMemberData(x.candidate);assertPreparationCandidate(receipt,candidate);
      return access(true,db=>{
        const prior=attempt(db,task_id,execution_id);if(prior.status!=='issued')fail('COMMAND_CONFLICT');
        if(taskHash(receipt.operation_context)!==taskHash(prior.context)||receipt.code_sha256!==prior.code_sha256)fail('PREPARATION_PROVENANCE_INVALID');
        const selected=read(db,task_id,prior.source_set_id),source_set=selected.source_set;
        if(taskHash(source_set)!==prior.source_set_sha256||taskHash(receipt.sources)!==taskHash(source_set.sources.map(s=>({source_id:s.source_id,sha256:s.sha256,byte_length:Number(s.byte_length)}))))fail('SOURCE_CHANGED');
        const current=db.prepare('SELECT source_set_id FROM membership_source_sets WHERE task_id=? ORDER BY rowid DESC LIMIT 1').get(task_id);if(current?.source_set_id!==prior.source_set_id)fail('SOURCE_CHANGED');
        const qualification=qualifyExtractedMemberSources(source_set.inspection,prior.bindings,candidate);if(taskHash(qualification)!==taskHash(x.qualification))fail('CONVERSION_UNQUALIFIED');
        const zero={kind:'known' as const,value:'0'},unknown={kind:'unknown' as const,reason:'preparation-duration-unavailable'};
        const settled=settleMemberOperation(db,{task_id,execution_id,physical:'settled',outcome:'succeeded',usage:{input_tokens:zero,output_tokens:zero,active_ms:unknown,wait_ms:unknown}});
        if(settled.outcome==='stopped'){saveAttempt(db,{...prior,status:'stopped',physical_status:'settled',failure_code:'CANCELLED'});return null;}
        fault?.('preparation_after_settle',db);
        const body={version:'1.0' as const,id:randomUUID(),status:'qualified' as const,owner:source_set.owner,context:prior.context,source_set_id:prior.source_set_id,source_set_sha256:prior.source_set_sha256,previous_execution_id:prior.previous_execution_id,bindings_sha256:taskHash(prior.bindings),code_sha256:prior.code_sha256,extraction_version:'1.0' as const,receipt,receipt_sha256:taskHash(receipt),qualification,lineage_sha256:taskHash(qualification.lineage),stages:{extraction:'verified' as const,execution:'settled' as const,conversion:'qualified' as const}};
        const preparation=qualifiedMemberPreparation({...body,sha256:taskHash(body)});
        executionFiles(preparation);
        const normalized=join(projectRoot,'.xanthil','desktop','member-preparations');try{directory(normalized);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;mkdirSync(normalized,{mode:0o700});sync(join(projectRoot,'.xanthil','desktop'));}
        const root=join(normalized,preparation.id);mkdirSync(root,{mode:0o700});
        for(const role of ['members','orders'] as const){const fd=openSync(join(root,role+'.csv'),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o400);try{writeFileSync(fd,candidate[`${role}_bytes`]);fsyncSync(fd);}finally{closeSync(fd);}}sync(root);sync(normalized);
        db.prepare('INSERT INTO membership_preparations VALUES(?,?,?,?,?,?)').run(preparation.id,execution_id,task_id,prior.source_set_id,encodeTask(preparation),taskHash(preparation));
        fault?.('preparation_after_qualified_insert',db);
        saveAttempt(db,{...prior,status:'qualified',physical_status:'settled',failure_code:null});
        return qualified(db,task_id,execution_id).preparation;
      });
    },
    async readQualifiedPreparation(input) {
      const x=membershipRecord(input,['task_id','execution_id']);if(!membershipUuid(x.task_id)||!membershipUuid(x.execution_id))fail();const task_id=x.task_id,execution_id=x.execution_id;return access(false,db=>qualified(db,task_id,execution_id));
    },
    async readPreparationAttempt(input) {
      const x=membershipRecord(input,['task_id','execution_id']);if(!membershipUuid(x.task_id)||!membershipUuid(x.execution_id))fail();
      const task_id=x.task_id,execution_id=x.execution_id;return access(false,db=>attempt(db,task_id,execution_id));
    },
    async saveSourceSet(input) {
      const x=membershipRecord(input,['version','task_id','command_id','expected_row_version','sources','inspection','cancellation_signal']);
      if(x.version!=='1.0'||!membershipUuid(x.task_id)||!membershipUuid(x.command_id)||!Number.isSafeInteger(x.expected_row_version)||Number(x.expected_row_version)<1||!(x.cancellation_signal instanceof AbortSignal))fail();
      const sources=selectedSourceFiles(x.sources),descriptors=selectedSourceDescriptors(sources);
      const task_id=x.task_id,command_id=x.command_id,signal=x.cancellation_signal;
      const fingerprint=taskHash({version:x.version,task_id,expected_row_version:x.expected_row_version,sources:descriptors});
      if(signal.aborted)fail('CANCELLED');
      return access(true,db=>{
        const task=db.prepare('SELECT * FROM membership_tasks WHERE task_id=?').get(task_id);if(!task)fail('NOT_FOUND');
        const prior=db.prepare('SELECT * FROM membership_source_sets WHERE command_id=?').get(command_id);
        if(prior){if(prior.task_id!==task_id||prior.input_sha256!==fingerprint)fail('COMMAND_CONFLICT');return read(db,task_id,String(prior.source_set_id)).source_set;}
        if(db.prepare('SELECT command_id FROM membership_receipts WHERE command_id=?').get(command_id)||db.prepare('SELECT command_id FROM membership_browser_receipts WHERE command_id=?').get(command_id))fail('COMMAND_CONFLICT');
        if(task.row_version!==x.expected_row_version)fail('STALE_REVISION');
        if(task.status!=='idle')fail('AUTHORITY_REQUIRED');
        if(db.prepare("SELECT execution_id FROM membership_operation_usage WHERE task_id=? AND phase IN ('reserved','issued','unresolved')").get(task_id))fail('PHYSICAL_PENDING');
        const revision=db.prepare('SELECT state FROM case_revisions WHERE revision_id=?').get(String(task.current_revision_id));
        if(revision?.state!=='Draft')fail('SOURCE_CHANGED');
        const id=randomUUID(),body=validateSelectedSources({version:'1.0',id,task_id,owner:{project_id:task.project_id,session_id:task.session_id,case_id:task.case_id,revision_id:task.current_revision_id},selected_at:new Date().toISOString(),sources:descriptors,inspection:x.inspection,inspection_sha256:taskHash(x.inspection)});
        parents(true);const root=join(base,id);mkdirSync(root,{mode:0o700});
        for(const source of sources){const fd=openSync(join(root,source.source_id+'.'+source.format),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o400);try{writeFileSync(fd,source.bytes);fsyncSync(fd);}finally{closeSync(fd);}}
        sync(root);sync(base);
        if(signal.aborted)fail('CANCELLED');
        db.prepare('INSERT INTO membership_source_sets VALUES(?,?,?,?,?,?)').run(id,task_id,command_id,fingerprint,encodeTask(body),taskHash(body));
        db.prepare('UPDATE membership_tasks SET row_version=row_version+1 WHERE task_id=?').run(task_id);
        return read(db,task_id,id).source_set;
      });
    },
    async readSourceSet(input) {
      const x=membershipRecord(input,['task_id','source_set_id']);
      if(!membershipUuid(x.task_id)||!membershipUuid(x.source_set_id))fail();
      const {task_id,source_set_id}=x;
      return access(false,db=>read(db,task_id,source_set_id));
    },
  };
}
