import {approvedMembershipPolicy} from '../../packages/product-core/member-model-policy.ts';
import {validateMembershipPlan,membershipHash} from '../../packages/product-core/member-analysis.ts';
import {sameAutomaticDelegationWork,assertAutomaticDelegationSubset,automaticDelegationProjection} from '../../packages/product-core/open-analysis-delegation-instruction.ts';
import {validateNativeMemberReview} from '../../packages/product-core/open-member-review.ts';
import {validateReviewDecision,type MembershipReview} from '../../packages/product-core/member-review.ts';
import {assistantRecord} from '../../packages/product-core/case-assistant.ts';
import {validateChildResult,sourceUserQuestion} from '../../packages/product-core/case-collaboration.ts';
import type {ChildRelation,ChildPreview,ChildResult,ChildResultValue,ResultTarget,ChildDelivery,ChildReview,ParentCollaboration,CollaborationLifecycle} from '../../packages/contracts/case-collaboration.ts';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import type { CaseAssistantStore, AssistantHistory,CaseBusinessAuthorization } from '../../packages/ports/case-assistant.ts';
import type {AnalysisAgent} from '../../packages/ports/analysis-agent.ts';
import type { AssistantSource, AssistantSession, AssistantEvent, AssistantDraft, FormalDecision, AssistantReport } from '../../packages/contracts/case-assistant.ts';
import type { OwnerRef } from '../../packages/contracts/xanthil-desktop-ipc.ts';
import { createLocalDesktopDecisionCaseStore } from './xanthil-desktop-decision-case.ts';
import { assistantFailure, assistantText, validateAssistantDecision, formalDecisionSections } from '../../packages/product-core/case-assistant.ts';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const encode = (value: unknown): string => JSON.stringify(value, function (_key, item) {
    if (typeof item === 'number' && !Number.isSafeInteger(item) || item === undefined)
        assistantFailure();
    return item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item;
});
const tables = ['sessions', 'events', 'drafts', 'decisions', 'reports'] as const;
type Table = typeof tables[number];
const schema = `CREATE TABLE metadata(project_id TEXT PRIMARY KEY,version TEXT NOT NULL CHECK(version='1.0'));
CREATE TABLE sessions(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE events(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE drafts(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE decisions(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE reports(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE heads(source TEXT PRIMARY KEY,decision_id TEXT NOT NULL);
CREATE TABLE receipts(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,result TEXT NOT NULL);
CREATE INDEX events_parent ON events(parent);
CREATE INDEX drafts_parent ON drafts(parent); CREATE INDEX decisions_parent ON decisions(parent); CREATE INDEX reports_parent ON reports(parent);`;
const collaborationSchema = `CREATE TABLE collaboration_children(id TEXT PRIMARY KEY REFERENCES sessions(id),parent TEXT NOT NULL REFERENCES sessions(id),body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE collaboration_lifecycle(id TEXT PRIMARY KEY REFERENCES sessions(id),body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE collaboration_results(id TEXT PRIMARY KEY,child_id TEXT NOT NULL REFERENCES collaboration_children(id),attempt_id TEXT NOT NULL UNIQUE,version INTEGER NOT NULL CHECK(version>0),body TEXT NOT NULL,sha256 TEXT NOT NULL,UNIQUE(child_id,version));
CREATE TABLE collaboration_returns(id TEXT PRIMARY KEY REFERENCES collaboration_results(id),parent TEXT NOT NULL REFERENCES sessions(id),body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE collaboration_reviews(id TEXT PRIMARY KEY REFERENCES collaboration_results(id),parent TEXT NOT NULL REFERENCES sessions(id),body TEXT NOT NULL,sha256 TEXT NOT NULL);`;
function identity(db:DatabaseSync){return encode(db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all());}
const schemaIdentities=([100,101,102,103] as const).map(version=>{const db=new DatabaseSync(':memory:');try{
 db.exec(version===100?schema:schema.replace("version='1.0'",version===101?"version='1.1'":version===102?"version='1.2'":"version='1.3'"));
 if(version>=101)db.exec(collaborationSchema);return identity(db);
}finally{db.close();}});
const sourceKey = (owner: OwnerRef) => encode(owner);
const same = (a: unknown, b: unknown) => encode(a) === encode(b);
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
type OpenBrowserCommand=Readonly<{project_id:string;command_id:string;task_id:string;action:string;body:unknown}>;
type OpenCommandReceipt=Readonly<{version:'1.0';command_id:string;task_id:string;action:string;status:'unknown'|'accepted'}>;
export function createLocalCaseAssistantStore(config: {
    projectRoot: string;
    openSource?:(owner:OwnerRef)=>AssistantSource|null;
    collaborationPolicy?:'open_analysis_v13';
    assertCompleted?:AnalysisAgent['assertCompleted'];
}): CaseAssistantStore & {reserveOpenCommand(command:OpenBrowserCommand):Promise<'new'|'accepted'>;finishOpenCommand(command:OpenBrowserCommand):Promise<void>;readOpenCommand(task_id:string,command_id:string):Promise<OpenCommandReceipt|null>} {
    const root = realpathSync(config.projectRoot), base = join(root, '.xanthil', 'desktop', 'state.sqlite'), path = join(dirname(base), 'case-assistant.sqlite');
    const original = createLocalDesktopDecisionCaseStore({ projectRoot: root });
    let pending = false;
    function safe(file: string) {
        let current = resolve(file);
        while (current !== root) {
            if (!current.startsWith(root + '/'))
                assistantFailure('INTEGRITY_BLOCKED');
            if (existsSync(current) && lstatSync(current).isSymbolicLink())
                assistantFailure('INTEGRITY_BLOCKED');
            current = dirname(current);
        }
    }
    function connect(initialize = false, projectId?: string): DatabaseSync | null {
        safe(base);
        safe(path);
        for (const suffix of ['-journal', '-wal', '-shm'])
            safe(path + suffix);
        if (!existsSync(path) && !initialize)
            return null;
        const existed = existsSync(path), db = new DatabaseSync(path);
        try {
            db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=0; PRAGMA synchronous=FULL;');
            if (!existed) {
                db.exec('BEGIN IMMEDIATE');
                try {
                    db.exec(schema);
                    db.exec('PRAGMA application_id=1480802625; PRAGMA user_version=100');
                    db.prepare("INSERT INTO metadata VALUES (?,'1.0')").run(projectId!);
                    db.exec('COMMIT');
                }
                catch (e) {
                    db.exec('ROLLBACK');
                    throw e;
                }
            }
            const metadata = db.prepare('SELECT * FROM metadata').all(), version=Number(db.prepare('PRAGMA user_version').get()?.user_version);
            if (metadata.length !== 1 || ![100,101,102,103].includes(version) || metadata[0].version !== (version===100?'1.0':version===101?'1.1':version===102?'1.2':'1.3') || projectId && metadata[0].project_id !== projectId || Number(db.prepare('PRAGMA application_id').get()?.application_id) !== 1480802625)
                assistantFailure('SCHEMA_UNSUPPORTED');
            if (identity(db) !== schemaIdentities[version-100])
                assistantFailure('SCHEMA_UNSUPPORTED');
            for (const table of tables)
                for (const row of db.prepare(`SELECT * FROM ${table}`).all()) {
                    const value = decode(row);
                    if(table==='decisions'&&value.origin!==undefined){if(![102,103].includes(version))assistantFailure('SCHEMA_UNSUPPORTED');validateMembershipFormal(value);const state=new DatabaseSync(base,{readOnly:true});try{
                     const origin=value.origin as NonNullable<FormalDecision['origin']>,native=origin.kind==='native_member_review';if(native&&version!==103)assistantFailure('SCHEMA_UNSUPPORTED');
                     const receipt=native?state.prepare('SELECT result_json FROM native_member_review_submissions WHERE review_id=?').get(origin.review_id):state.prepare('SELECT result_json FROM membership_receipts WHERE command_id=?').get(origin.intent_id),r=native?state.prepare('SELECT body_json,body_sha256 FROM native_member_reviews WHERE review_id=? AND sequence=?').get(origin.review_id,origin.review_version):state.prepare('SELECT body_json,body_sha256 FROM membership_reviews WHERE review_id=? AND version=?').get(origin.review_id,origin.review_version);
                     if(!receipt||!r||hash(String(r.body_json))!==r.body_sha256)assistantFailure('INTEGRITY_BLOCKED');const result=JSON.parse(String(receipt.result_json)),review=native?validateNativeMemberReview(JSON.parse(String(r.body_json))):JSON.parse(String(r.body_json)) as MembershipReview,finding=state.prepare('SELECT evidence_refs_json FROM findings WHERE finding_id=?').get(review.source.finding_id);
                     if(!finding||result.decision_id!==value.id||result.expected_id!==value.outcome_id||result.report_id!==value.report_id||result.review_sha256!==review.sha256||result.task_id!==origin.task_id||result.intent_id!==origin.intent_id||result.outcome!=='choice'||!same(value.source,review.source.owner)||value.source_report_id!==review.source.report_id||value.actor!==review.fields.actor||value.adopted_at!==result.at||!same(value.fields,validateReviewDecision(review.fields.decision,{evidence_refs:JSON.parse(String(finding.evidence_refs_json)),finding_id:review.source.finding_id,candidates:review.fields.closure.candidates})))assistantFailure('INTEGRITY_BLOCKED');
                    }finally{state.close();}}
                    if ((table === 'drafts' ? `${value.id}:${value.version}` : value.id) !== row.id)
                        assistantFailure('INTEGRITY_BLOCKED');
                }
            if(version>=101)for(const table of ['collaboration_children','collaboration_lifecycle','collaboration_results','collaboration_returns','collaboration_reviews'])
                for(const row of db.prepare(`SELECT * FROM ${table}`).all())decode(row);
            return db;
        }
        catch (e) {
            db.close();
            throw e;
        }
    }
    function decode<T = Record<string, unknown>>(row: Record<string, unknown> | undefined): T {
        if (!row || typeof row.body !== 'string' || row.sha256 !== hash(row.body))
            assistantFailure('INTEGRITY_BLOCKED');
        try {
            return JSON.parse(row.body) as T;
        }
        catch {
            assistantFailure('INTEGRITY_BLOCKED');
        }
    }
    function rows<T>(db: DatabaseSync, table: Table, parent?: string): T[] { return (parent === undefined ? db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() : db.prepare(`SELECT * FROM ${table} WHERE parent=? ORDER BY rowid`).all(parent)).map(r => decode<T>(r)); }
    function get<T>(db: DatabaseSync, table: Table, id: string): T { const row = db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id); if (!row)
        assistantFailure('NOT_FOUND'); return decode<T>(row); }
    function write(db: DatabaseSync, table: Table, id: string, parent: string, value: unknown, replace = false) { const body = encode(value); db.prepare(`${replace ? 'INSERT OR REPLACE' : 'INSERT'} INTO ${table} VALUES (?,?,?,?)`).run(id, parent, body, hash(body)); }
    function transaction<T>(work: (db: DatabaseSync) => T, source?: AssistantSource): T {
        if (pending)
            assistantFailure('RESULT_PENDING');
        const db = connect();
        if (!db)
            assistantFailure('NOT_FOUND');
        try {
            if (source&&!source.open_origin) {
                safe(base);
                db.prepare('ATTACH DATABASE ? AS original').run(base);
            }
            db.exec('BEGIN IMMEDIATE');
            try {
                if (source)
                    checkSource(db, source);
                const result = work(db);
                db.exec('COMMIT');
                return result;
            }
            catch (error) {
                try {
                    db.exec('ROLLBACK');
                }
                catch { /* Original failure retained. */ }
                throw error;
            }
        }
        finally {
            db.close();
        }
    }
    function checkSource(db: DatabaseSync, source: AssistantSource) {
        if (!source.eligible)
            assistantFailure('SOURCE_INELIGIBLE');
        if(source.open_origin){const current=config.openSource?.(source.owner);if(!current||!current.eligible||!same(current,source)||source.finding_id||source.acceptance_id||source.closure_id||source.candidates.length)assistantFailure('STALE_REVISION');return;}
        const o = source.owner;
        const s = db.prepare('SELECT * FROM original.product_sessions WHERE session_id=? AND project_id=? AND case_id=?').get(o.session_id, o.project_id, o.case_id);
        const r = db.prepare('SELECT * FROM original.case_revisions WHERE revision_id=? AND project_id=? AND session_id=? AND case_id=?').get(o.revision_id, o.project_id, o.session_id, o.case_id);
        if (!s || s.current_revision_id !== o.revision_id || !r || r.state !== 'Completed' || r.integrity_state !== 'ok' || String(r.row_version) !== source.row_version || r.current_finding_id !== source.finding_id || r.current_acceptance_id !== source.acceptance_id || r.current_closure_id !== source.closure_id || r.current_report_id !== source.report.report_id)
            assistantFailure('STALE_REVISION');
        const aggregate=db.prepare('SELECT sha256,columns_json FROM original.aggregate_artifacts WHERE artifact_id=? AND revision_id=?').get(source.aggregate.artifact_id,o.revision_id);
        const report=db.prepare('SELECT markdown_sha256,version_sequence,state FROM original.report_versions WHERE report_id=? AND revision_id=?').get(source.report.report_id,o.revision_id);
        if(!aggregate||aggregate.sha256!==source.aggregate.sha256||!same(JSON.parse(String(aggregate.columns_json)),source.aggregate.fields)||!report||report.state!=='final'||report.markdown_sha256!==source.report.sha256||Number(report.version_sequence)!==source.report.version)assistantFailure('STALE_REVISION');
    }
    async function readSource(owner: OwnerRef): Promise<AssistantSource> {
        const open=config.openSource?.(owner);if(open?.open_origin)return structuredClone(open);
        const p = await original.readProjection(owner), r = p.revision, f = p.findings.find(f => f.finding_id === r?.current_finding_id), a = p.acceptances.find(a => a.acceptance_id === r?.current_acceptance_id), c = p.closures.find(c => c.closure_id === r?.current_closure_id), report = p.reports.find(x => x.report_id === r?.current_report_id), form = p.forms.find(x => x.form_id === c?.form_id);
        const missing = [];
        if (p.session?.current_revision_id !== owner.revision_id)
            missing.push('来源 revision 已变化');
        if (r?.state !== 'Completed')
            missing.push('尚未 Completed');
        if (!f || !a || a.finding_id !== f.finding_id)
            missing.push('缺少已接受 Finding');
        if (!c || c.acceptance_id !== a?.acceptance_id || !form)
            missing.push('缺少有效 Decision Closure');
        if (!report || report.state !== 'final' || !report.review_content)
            missing.push('缺少完整 final report');
        if (r?.integrity_state !== 'ok')
            missing.push('来源完整性未通过');
        safe(base);
        const db = new DatabaseSync(base, { readOnly: true });
        let aggregate: Record<string, unknown> | undefined;
        let membership_origin: AssistantSource['membership_origin'];
        try {
            if (f)
                aggregate = db.prepare('SELECT * FROM aggregate_artifacts WHERE artifact_id=? AND revision_id=?').get(f.aggregate_id, owner.revision_id);
            const run=f?db.prepare('SELECT run_contract_version FROM analysis_runs WHERE run_id=?').get(f.run_id):null;
            if(run&&['4.0','5.0'].includes(String(run.run_contract_version))){
                const task=db.prepare('SELECT task_id FROM membership_tasks WHERE project_id=? AND session_id=? AND case_id=? AND current_revision_id=?').get(owner.project_id,owner.session_id,owner.case_id,owner.revision_id);
                if(!task)assistantFailure('INTEGRITY_BLOCKED');
                const receipt=db.prepare("SELECT result_json FROM membership_receipts WHERE task_id=? AND json_extract(result_json,'$.kind')='prepared' ORDER BY rowid DESC LIMIT 1").get(task.task_id);
                let prepared_sha256:string;if(run.run_contract_version==='5.0'){const row=db.prepare('SELECT p.body_json,p.body_sha256 FROM membership_run_plans r JOIN membership_plans p ON p.plan_id=r.plan_id WHERE r.run_id=?').get(f!.run_id);if(!row)assistantFailure('INTEGRITY_BLOCKED');const plan=validateMembershipPlan(JSON.parse(String(row.body_json)));if(plan.version!=='2.0'||membershipHash(plan)!==row.body_sha256||!same(plan.owner,owner)||plan.authority.task_id!==task.task_id)assistantFailure('INTEGRITY_BLOCKED');prepared_sha256=plan.preparation.sha256;}else{if(!receipt)assistantFailure('INTEGRITY_BLOCKED');prepared_sha256=JSON.parse(String(receipt.result_json)).prepared.fingerprint;}
                membership_origin={version:'2.0',task_id:String(task.task_id),prepared_sha256};
            }

        }
        finally {
            db.close();
        }
        if (f && !aggregate)
            missing.push('缺少已验证聚合');
        return { ...(membership_origin?{membership_origin}:{}),owner: structuredClone(owner), case_name: r?.case_name ?? '', current_revision_id: p.session?.current_revision_id ?? '', eligible: missing.length === 0, missing, row_version: r?.row_version ?? '', finding_id: f?.finding_id ?? '', acceptance_id: a?.acceptance_id ?? '', closure_id: c?.closure_id ?? '', evidence_refs: f?.evidence_refs ?? [], limitations: f?.limitations ?? [], candidates: form?.candidates ?? [], finding_summary: f ? encode({ judgment: f.judgment, supporting_evidence: f.supporting_evidence, refutation: f.refutation, limitations: f.limitations }) : '', aggregate: { artifact_id: f?.aggregate_id ?? '', sha256: String(aggregate?.sha256 ?? ''), fields: aggregate ? JSON.parse(String(aggregate.columns_json)) : [], scope: encode({ comparison: p.confirmation?.comparison_period ?? null, current: p.confirmation?.current_period ?? null, grain: 'verified comparison/current aggregate metrics; no individual rows' }), content: f?.metrics ?? '' }, report: { report_id: report?.report_id ?? '', version: Number(report?.version_sequence ?? 0), sha256: report?.markdown_sha256 ?? '', summary: encode({ report_id: report?.report_id ?? null, finding_id: f?.finding_id ?? null, judgment: f?.judgment ?? null, limitations: f?.limitations ?? [], closure_route: c?.route ?? null }) } };
    }
    function child(db:DatabaseSync,id:string):ChildRelation|null{
        if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===100)return null;
        const row=db.prepare('SELECT * FROM collaboration_children WHERE id=?').get(id);
        return row?decode<ChildRelation>(row):null;
    }
    async function readChild(id:string){const db=connect();if(!db)return null;try{return child(db,id);}finally{db.close();}}
    const businessKey=(id:string)=>'business-authorization:'+id;
    function business(db:DatabaseSync,id:string):CaseBusinessAuthorization{
        const row=db.prepare('SELECT * FROM receipts WHERE id=?').get(businessKey(id));if(!row)assistantFailure('AUTHORITY_REQUIRED');
        const value=JSON.parse(String(row.result)) as CaseBusinessAuthorization;
        const a=value.authorization,i=value.identity,work=a.source.open_origin?.task_id??a.source.membership_origin?.task_id??a.source.owner.case_id;
        if(hash(encode(value))!==row.fingerprint||value.version!=='1.0'||a.id!==id||i.grant_id!==id||i.task_id!==value.session_id||i.run_id!==id||i.attempt_id!==id||i.operation_id!==id||i.revision!==a.source.owner.revision_id||i.scope_sha256!==hash(encode(a.source))||! /^[a-f0-9]{64}$/.test(i.config_sha256)||value.work_id!==work||!Number.isSafeInteger(value.epoch)||value.epoch<0)assistantFailure('INTEGRITY_BLOCKED');return value;
    }
    function currentBusiness(db:DatabaseSync,g:CaseBusinessAuthorization){
        const a=g.authorization,session=get<AssistantSession>(db,'sessions',g.session_id),life=lifecycle(db,g.session_id);
        if(!same(session.source,a.source.owner)||!life.open||life.epoch!==g.epoch||!a.config?.authorized||a.blockers.length||a.membership?.expires_at&&Date.now()>=Date.parse(a.membership.expires_at))assistantFailure('AUTHORITY_REQUIRED');
        if(a.source.membership_origin){const m=a.membership,t=db.prepare('SELECT * FROM original.membership_tasks WHERE task_id=?').get(a.source.membership_origin.task_id);if(!m||m.version!=='2.0'||m.task_id!==a.source.membership_origin.task_id||m.source_sha256!==hash(encode(a.source))||m.session_id!==g.session_id||!t||t.epoch!==m.epoch||t.current_revision_id!==a.source.owner.revision_id||t.status!=='closed'||m.policy_sha256!==hash(encode(approvedMembershipPolicy))||a.config?.provider!==approvedMembershipPolicy.provider||a.config.model!==approvedMembershipPolicy.model)assistantFailure('AUTHORITY_REQUIRED');}
        if((db.prepare('SELECT decision_id FROM heads WHERE source=?').get(sourceKey(a.source.owner))?.decision_id??null)!==a.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        if(a.collaboration){const relation=child(db,g.session_id);if(!relation||relation.parent_session_id!==a.collaboration.parent_session_id||!same(relation.source,a.source))assistantFailure('AUTHORIZATION_STALE');const parent=lifecycle(db,relation.parent_session_id);if(!parent.open||parent.epoch!==a.collaboration.parent_epoch)assistantFailure('INTERRUPTED');}
    }
    async function readBusinessAuthorization(session_id:string,id?:string){const db=connect();if(!db)return null;try{
        if(id){const g=business(db,id);if(g.session_id!==session_id)assistantFailure('FORBIDDEN');return g;}
        const rows=db.prepare("SELECT * FROM receipts WHERE id LIKE 'business-authorization:%' ORDER BY rowid DESC").all();for(const row of rows){const g=business(db,String(row.id).slice('business-authorization:'.length));if(g.session_id===session_id)return g;}return null;
    }finally{db.close();}}
    function isBusinessAuthorized(id:string){const db=connect();if(!db)return false;try{
        const g=business(db,id);if(!g.authorization.source.open_origin){safe(base);db.prepare('ATTACH DATABASE ? AS original').run(base);}
        db.exec('BEGIN');currentBusiness(db,g);checkSource(db,g.authorization.source);return true;
    }finally{try{db.exec('ROLLBACK');}catch{}db.close();}}
    function authorizesWork(work_id:string,phase:'bind'|'advance'|'record'|'read'){
        const db=connect();if(!db)return false;let ids:string[];try{ids=db.prepare("SELECT id FROM receipts WHERE id LIKE 'business-authorization:%'").all().map(row=>String(row.id).slice('business-authorization:'.length)).filter(id=>business(db,id).work_id===work_id);}finally{db.close();}
        if(phase==='record'||phase==='read')return ids.length>0;
        return ids.some(id=>{try{return isBusinessAuthorized(id);}catch(error){if(['AUTHORITY_REQUIRED','AUTHORIZATION_STALE','INTERRUPTED','STALE_REVISION'].includes(String((error as {code?:string}).code)))return false;throw error;}});
    }
    async function authorizeBusiness(input:Parameters<CaseAssistantStore['authorizeBusiness']>[0]){
        const a=input.authorization,source=await readSource(a.source.owner);if(!same(source,a.source)||! /^[a-f0-9]{64}$/.test(input.configuration_sha256))assistantFailure('AUTHORIZATION_STALE');
        return transaction(db=>{
            migrate(db);const life=lifecycle(db,input.session_id),work_id=source.open_origin?.task_id??source.membership_origin?.task_id??source.owner.case_id;
            const value:CaseBusinessAuthorization={version:'1.0',session_id:input.session_id,authorization:structuredClone(a),work_id,epoch:life.epoch,identity:{task_id:input.session_id,revision:source.owner.revision_id,run_id:a.id,attempt_id:a.id,operation_id:a.id,grant_id:a.id,scope_sha256:hash(encode(source)),config_sha256:input.configuration_sha256}};
            currentBusiness(db,value);const key=businessKey(a.id),prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(key);
            if(prior){const old=business(db,a.id);if(!same(old,value))assistantFailure('COMMAND_CONFLICT');return old;}
            db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(key,hash(encode(value)),encode(value));return value;
        },source);
    }
    async function publishModel(input:Parameters<CaseAssistantStore['publishModel']>[0],signal:AbortSignal){
        const probe=connect();if(!probe)assistantFailure('NOT_FOUND');let g:CaseBusinessAuthorization;try{g=business(probe,input.authorization_id);}finally{probe.close();}
        const a=g.authorization,completion=input.result.completion;
        if(!config.assertCompleted||completion.command_id!==a.id||completion.work_id!==g.work_id||completion.purpose!=='retained_case'||!Number.isFinite(Date.parse(input.at)))assistantFailure('EFFECT_UNCONFIRMED');
        await config.assertCompleted(g.identity,completion);
        if(![a.config,...(a.config?.authorized_recipients??[])].some(c=>c?.provider===input.result.provider&&c.model===input.result.model))assistantFailure('FORBIDDEN');
        if(input.child){if(input.decision)assistantFailure('FORBIDDEN');await finishChild(g,input.child,input.at,signal);return;}
        transaction(db=>{
            if(signal.aborted)assistantFailure('INTERRUPTED');currentBusiness(db,g);
            if(child(db,g.session_id)||a.source.open_origin)assistantFailure('FORBIDDEN');
            const key='model-publication:'+a.id,body=encode({result:input.result,decision:input.decision??null}),prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(key);
            if(prior){if(prior.fingerprint!==hash(body))assistantFailure('COMMAND_CONFLICT');return;}
            if(input.decision){const fields=validateAssistantDecision(input.decision,a.source),draft:AssistantDraft={id:randomUUID(),version:1,session_id:g.session_id,attempt_id:a.id,source_revision:a.source.owner.revision_id,baseline_decision_id:a.baseline_decision_id,fields,status:'pending',edited:false,created_at:input.at,decided_at:null,reason:null};write(db,'drafts',draft.id+':1',g.session_id,draft);}
            const event:AssistantEvent={id:randomUUID(),attempt_id:a.id,at:input.at,kind:'advice',text:input.result.text,tool:null,status:'MODEL',source_revision:a.source.owner.revision_id};write(db,'events',event.id,g.session_id,event);
            db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(key,hash(body),body);
        },a.source);
    }
    function lifecycle(db:DatabaseSync,id:string):CollaborationLifecycle{
        if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===100)return {open:true,epoch:0};
        const row=db.prepare('SELECT * FROM collaboration_lifecycle WHERE id=?').get(id);return row?decode<CollaborationLifecycle>(row):{open:true,epoch:0};
    }
    async function readLifecycle(id:string){const db=connect();if(!db)assistantFailure('NOT_FOUND');try{get(db,'sessions',id);return lifecycle(db,id);}finally{db.close();}}
    async function closeFamily(id:string,at:string,explicitClose=false){
        let expected:ReadonlyArray<{id:string;state:CollaborationLifecycle}>|undefined;
        try{return transaction(db=>{
            get(db,'sessions',id);
            if(explicitClose)migrate(db);
            const modern=Number(db.prepare('PRAGMA user_version').get()?.user_version)>=101;
            const ids=[id],visited=new Set(ids);
            if(modern)for(let i=0;i<ids.length;i++)for(const row of db.prepare('SELECT * FROM collaboration_children WHERE parent=?').all(ids[i]!)){
                const relation=decode<ChildRelation>(row),childId=String(row.id);
                if(relation.parent_session_id!==ids[i]||relation.child_session_id!==childId||visited.has(childId))assistantFailure('INTEGRITY_BLOCKED');
                visited.add(childId);ids.push(childId);
            }
            for(const sessionId of ids){
                if(modern){const old=lifecycle(db,sessionId);if(old.open){const body=encode({open:false,epoch:old.epoch+1});db.prepare('INSERT INTO collaboration_lifecycle VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,sha256=excluded.sha256').run(sessionId,body,hash(body));}}
            }
            if(modern)expected=ids.map(id=>({id,state:lifecycle(db,id)}));
            return ids;
        });}catch(error){
            if(!expected)throw error;
            // Unreadable state leaves Application fences set.
            let committed=false;
            try{const db=connect();if(!db)throw error;try{
                committed=Number(db.prepare('PRAGMA user_version').get()?.user_version)>=101&&expected.every(item=>same(lifecycle(db,item.id),item.state));
            }finally{db.close();}}catch{assistantFailure('RESULT_PENDING');}
            if(committed)return expected.map(item=>item.id);
            throw error;
        }
    }
    async function reopenSession(id:string,epoch:number){return transaction(db=>{
        get(db,'sessions',id);const old=lifecycle(db,id);if(old.epoch!==epoch)assistantFailure('LIFECYCLE_STALE');const relation=child(db,id);if(relation)parentOpen(db,relation.parent_session_id);if(old.open)return old;
        const state={open:true,epoch:epoch+1},body=encode(state);db.prepare('UPDATE collaboration_lifecycle SET body=?,sha256=? WHERE id=?').run(body,hash(body),id);return state;
    });}
    async function readParentCollaboration(id:string):Promise<ParentCollaboration>{
        const db=connect();if(!db)assistantFailure('NOT_FOUND');try{
            get<AssistantSession>(db,'sessions',id);const relation=child(db,id);if(relation&&(config.collaborationPolicy!=='open_analysis_v13'||!relation.source.open_origin))assistantFailure('FORBIDDEN');
            if(Number(db.prepare('PRAGMA user_version').get()?.user_version)===100)return {children:[],results:[],deliveries:[],reviews:[],materials:[]};
            const children=db.prepare('SELECT * FROM collaboration_children WHERE parent=? ORDER BY rowid').all(id).map(r=>decode<ChildRelation>(r));
            const results=db.prepare('SELECT r.* FROM collaboration_results r JOIN collaboration_children c ON r.child_id=c.id WHERE c.parent=? ORDER BY r.rowid').all(id).map(r=>decode<ChildResult>(r));
            const deliveries=db.prepare('SELECT * FROM collaboration_returns WHERE parent=? ORDER BY rowid').all(id).map(r=>decode<ChildDelivery>(r));
            const reviews=db.prepare('SELECT * FROM collaboration_reviews WHERE parent=? ORDER BY rowid').all(id).map(r=>decode<ChildReview>(r));
            const materials=reviews.filter(r=>r.disposition==='adopted').map(review=>{const result=results.find(r=>r.id===review.result_id);if(!result||!review.material_id||result.version!==review.result_version||result.sha256!==review.result_sha256)assistantFailure('INTEGRITY_BLOCKED');return {id:review.material_id,classification:'MODEL' as const,result,review};});
            return {children,results,deliveries,reviews,materials};
        }finally{db.close();}
    }
    function targetResult(db:DatabaseSync,target:ResultTarget):ChildResult{
        const row=db.prepare('SELECT * FROM collaboration_results WHERE id=?').get(target.result_id);if(!row)assistantFailure('NOT_FOUND');const result=decode<ChildResult>(row);
        if(result.version!==target.result_version||result.sha256!==target.result_sha256)assistantFailure('STALE_RESULT');return result;
    }
    function parentOpen(db:DatabaseSync,id:string){const visited=new Set<string>();let ancestor:string|null=id;while(ancestor){if(visited.has(ancestor))assistantFailure('INTEGRITY_BLOCKED');visited.add(ancestor);if(!lifecycle(db,ancestor).open)assistantFailure('PARENT_CLOSED');ancestor=child(db,ancestor)?.parent_session_id??null;}}
    function checkResultSource(db:DatabaseSync,result:ChildResult,source:AssistantSource){
        if(!same(result.source,source)||(db.prepare('SELECT decision_id FROM heads WHERE source=?').get(sourceKey(source.owner))?.decision_id??null)!==result.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        parentOpen(db,result.parent_session_id);
    }
    function collaborationCommit<T>(commandId:string,fingerprint:string,source:AssistantSource,work:(db:DatabaseSync)=>T):T{
        let proposed:T|undefined;
        try{return transaction(db=>{
            const prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId);
            if(prior){if(prior.fingerprint!==fingerprint)assistantFailure('COMMAND_CONFLICT');return JSON.parse(String(prior.result)) as T;}
            proposed=work(db);db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(commandId,fingerprint,encode(proposed));return proposed;
        },source);}catch(error){
            if(proposed===undefined)throw error;
            try{const db=connect();if(!db)throw error;try{const receipt=db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId);if(receipt){if(receipt.fingerprint!==fingerprint)assistantFailure('COMMAND_CONFLICT');return JSON.parse(String(receipt.result)) as T;}}finally{db.close();}}catch{pending=true;assistantFailure('RESULT_PENDING');}
            throw error;
        }
    }
    function openCommandKey(id:string){return hash(encode({purpose:'open-browser-command',id}));}
    function openCommandFingerprint(command:OpenBrowserCommand){return hash(encode(command));}
    function decodeOpenReceipt(row:Record<string,unknown>,task_id:string,command_id:string):OpenCommandReceipt{
        const value=JSON.parse(String(row.result)) as OpenCommandReceipt;
        if(value.version!=='1.0'||value.task_id!==task_id||value.command_id!==command_id||!['unknown','accepted'].includes(value.status))assistantFailure('INTEGRITY_BLOCKED');return value;
    }
    async function reserveOpenCommand(command:OpenBrowserCommand):Promise<'new'|'accepted'>{
        if(![command.project_id,command.task_id,command.command_id].every(v=>/^[a-f0-9-]{36}$/.test(v))||!['create','start','stop','send','return','review'].includes(command.action))assistantFailure('INVALID_REQUEST');
        connect(true,command.project_id)!.close();return transaction(db=>{
            const key=openCommandKey(command.command_id),fingerprint=openCommandFingerprint(command),prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(key);
            if(prior){if(prior.fingerprint!==fingerprint)assistantFailure('COMMAND_CONFLICT');if(decodeOpenReceipt(prior,command.task_id,command.command_id).status!=='accepted')assistantFailure('RESULT_PENDING');return 'accepted';}
            const receipt:OpenCommandReceipt={version:'1.0',task_id:command.task_id,command_id:command.command_id,action:command.action,status:'unknown'};db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(key,fingerprint,encode(receipt));return 'new';
        });
    }
    async function finishOpenCommand(command:OpenBrowserCommand){transaction(db=>{
        const key=openCommandKey(command.command_id),prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(key);if(!prior||prior.fingerprint!==openCommandFingerprint(command))assistantFailure('COMMAND_CONFLICT');const receipt=decodeOpenReceipt(prior,command.task_id,command.command_id);db.prepare('UPDATE receipts SET result=? WHERE id=?').run(encode({...receipt,status:'accepted'}),key);
    });}
    async function readOpenCommand(task_id:string,command_id:string):Promise<OpenCommandReceipt|null>{const db=connect();if(!db)return null;try{const prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(openCommandKey(command_id));if(!prior)return null;const value=JSON.parse(String(prior.result));if(value.task_id!==task_id)return null;return decodeOpenReceipt(prior,task_id,command_id);}finally{db.close();}}
    async function returnChild(id:string,target:ResultTarget,commandId:string,at:string,source:AssistantSource,signal:AbortSignal):Promise<ChildDelivery>{
        const fresh=await readSource(source.owner);if(!same(fresh,source))assistantFailure('AUTHORIZATION_STALE');
        return collaborationCommit(commandId,hash(encode({kind:'return_result',id,target})),source,db=>{
            if(signal.aborted)assistantFailure('INTERRUPTED');const result=targetResult(db,target);
            if(result.child_session_id!==id)assistantFailure('FORBIDDEN');checkResultSource(db,result,source);
            const previous=decode<ChildDelivery>(db.prepare('SELECT * FROM collaboration_returns WHERE id=?').get(result.id));
            if(previous.status==='returned')return previous;
            const delivery:ChildDelivery={...previous,status:'returned',returned_at:at,error:null},body=encode(delivery);
            db.prepare('UPDATE collaboration_returns SET body=?,sha256=? WHERE id=?').run(body,hash(body),result.id);return delivery;
        });
    }
    async function reviewChild(id:string,target:ResultTarget,commandId:string,disposition:'adopted'|'declined',reason:string,at:string,source:AssistantSource,signal:AbortSignal):Promise<ChildReview>{
        const fresh=await readSource(source.owner);if(!same(fresh,source))assistantFailure('AUTHORIZATION_STALE');
        return collaborationCommit(commandId,hash(encode({kind:'review_result',id,target,disposition,reason})),source,db=>{
            if(signal.aborted)assistantFailure('INTERRUPTED');const result=targetResult(db,target);
            if(result.parent_session_id!==id||child(db,id))assistantFailure('FORBIDDEN');checkResultSource(db,result,source);
            const delivery=decode<ChildDelivery>(db.prepare('SELECT * FROM collaboration_returns WHERE id=?').get(result.id));if(delivery.status!=='returned')assistantFailure('NOT_RETURNED');
            const previous=db.prepare('SELECT * FROM collaboration_reviews WHERE id=?').get(result.id);
            if(previous){const review=decode<ChildReview>(previous);if(review.disposition!==disposition||review.reason!==reason)assistantFailure('REVIEW_FINAL');return review;}
            const review:ChildReview={...target,parent_session_id:id,disposition,reason,at,material_id:disposition==='adopted'?randomUUID():null},body=encode(review);
            db.prepare('INSERT INTO collaboration_reviews VALUES(?,?,?,?)').run(result.id,id,body,hash(body));return review;
        });
    }
    async function failChildReturn(id:string,target:ResultTarget,signal:AbortSignal):Promise<void>{
        transaction(db=>{
            if(signal.aborted)assistantFailure('INTERRUPTED');
            const result=targetResult(db,target);if(result.child_session_id!==id)assistantFailure('FORBIDDEN');
            const previous=decode<ChildDelivery>(db.prepare('SELECT * FROM collaboration_returns WHERE id=?').get(result.id));
            if(previous.status==='returned')return;
            const body=encode({...previous,status:'failed',error:'local_return_failed'});
            db.prepare('UPDATE collaboration_returns SET body=?,sha256=? WHERE id=?').run(body,hash(body),result.id);
        });
    }
    async function childResults(id:string):Promise<readonly ChildResult[]>{const db=connect();if(!db)return [];try{
        if(!child(db,id))return [];return db.prepare('SELECT * FROM collaboration_results WHERE child_id=? ORDER BY version').all(id).map(r=>decode<ChildResult>(r));
    }finally{db.close();}}
    async function finishChild(binding:CaseBusinessAuthorization,value:ChildResultValue,endedAt:string,signal:AbortSignal):Promise<ChildResult>{
        const a=binding.authorization,id=a.id,session_id=binding.session_id,grant=a.collaboration;
        if(!grant)assistantFailure('FORBIDDEN');
        const fresh=await readSource(a.source.owner);if(!same(fresh,a.source))assistantFailure('AUTHORIZATION_STALE');
        validateChildResult(value,grant.allowed_references);
        let proposed:ChildResult|undefined;
        try{return transaction(db=>{
            if(signal.aborted)assistantFailure('INTERRUPTED');
            currentBusiness(db,binding);
            const relation=child(db,session_id);if(!relation||grant.child_session_id!==relation.child_session_id||grant.parent_session_id!==relation.parent_session_id||!same(a.source,relation.source))assistantFailure('FORBIDDEN');
            if((db.prepare('SELECT decision_id FROM heads WHERE source=?').get(sourceKey(a.source.owner))?.decision_id??null)!==a.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
            for(const [id,epoch]of [[relation.parent_session_id,grant.parent_epoch],[session_id,grant.child_epoch]] as const){const row=db.prepare('SELECT * FROM collaboration_lifecycle WHERE id=?').get(id);if(row){const state=decode<{epoch:number;open:boolean}>(row);if(!state.open||state.epoch!==epoch)assistantFailure('INTERRUPTED');}else if(epoch!==0)assistantFailure('INTERRUPTED');}
            const committed=db.prepare('SELECT * FROM collaboration_results WHERE attempt_id=?').get(id);
            if(committed){const result=decode<ChildResult>(committed);if(!same(result.value,value))assistantFailure('COMMAND_CONFLICT');return result;}
            const version=Number(db.prepare('SELECT COALESCE(MAX(version),0)+1 AS version FROM collaboration_results WHERE child_id=?').get(session_id)!.version);
            const body={id:randomUUID(),child_session_id:session_id,parent_session_id:relation.parent_session_id,attempt_id:id,authorization_id:a.id,version,source:a.source,baseline_decision_id:a.baseline_decision_id,value,created_at:endedAt};
            const result:ChildResult={...body,sha256:hash(encode(body))};proposed=result;const encoded=encode(result);
            db.prepare('INSERT INTO collaboration_results VALUES(?,?,?,?,?,?)').run(body.id,body.child_session_id,id,version,encoded,hash(encoded));
            const delivery=encode({result_id:body.id,parent_session_id:relation.parent_session_id,status:'unreturned',returned_at:null,error:null});
            db.prepare('INSERT INTO collaboration_returns VALUES(?,?,?,?)').run(body.id,relation.parent_session_id,delivery,hash(delivery));
            return result;
        },a.source);}catch(error){
            if(!proposed)throw error;
            try{const db=connect();if(!db)throw error;try{const committed=db.prepare('SELECT * FROM collaboration_results WHERE attempt_id=?').get(id);if(committed)return decode<ChildResult>(committed);}finally{db.close();}}catch{pending=true;assistantFailure('RESULT_PENDING');}
            throw error;
        }
    }
    function migrate(db:DatabaseSync){
        if(Number(db.prepare('PRAGMA user_version').get()?.user_version)>=101)return;
        const project=db.prepare('SELECT project_id FROM metadata').get()!.project_id;
        db.exec("DROP TABLE metadata; CREATE TABLE metadata(project_id TEXT PRIMARY KEY,version TEXT NOT NULL CHECK(version='1.1'));");
        db.prepare("INSERT INTO metadata VALUES (?,'1.1')").run(project);
        db.exec(collaborationSchema);db.exec('PRAGMA user_version=101');
    }
    async function createChild(commandId:string,session:AssistantSession,preview:ChildPreview,signal:AbortSignal,assertAdmission:()=>void=()=>{}){
        const fingerprint=hash(encode({kind:'create_child',preview}));
        const fresh=await readSource(preview.source.owner);
        if(!same(fresh,preview.source))assistantFailure('AUTHORIZATION_STALE');
        let proposed:ChildRelation|undefined;
        try{return transaction(db=>{
            if(signal.aborted)assistantFailure('INTERRUPTED');
            assertAdmission(); // Synchronous through COMMIT: shared settings/helper/model admission cannot interleave.
            const prior=db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId);
            if(prior){if(prior.fingerprint!==fingerprint)assistantFailure('COMMAND_CONFLICT');const found=child(db,String(prior.result));if(!found)assistantFailure('INTEGRITY_BLOCKED');return found;}
            const parent=get<AssistantSession>(db,'sessions',preview.parent_session_id);
            const parentRelation=child(db,parent.id);
            assertAutomaticDelegationSubset(parentRelation?.automatic_instruction,preview.automatic_instruction);
            if(parentRelation&&(config.collaborationPolicy!=='open_analysis_v13'||!fresh.open_origin)||!same(parent.source,session.source)||!same(session.source,preview.source.owner))assistantFailure('FORBIDDEN');
            parentOpen(db,parent.id);
            if(parentRelation){
                if(preview.aggregate&&(!parentRelation.aggregate||!same(preview.aggregate,parentRelation.aggregate))||preview.selected_reports.some(report=>!parentRelation.selected_reports.some(selected=>same(selected,report))))assistantFailure('FORBIDDEN');
                const visited=new Set<string>();let ancestor:ChildRelation|null=parentRelation;while(ancestor){if(visited.has(ancestor.child_session_id))assistantFailure('INTEGRITY_BLOCKED');visited.add(ancestor.child_session_id);if(sameAutomaticDelegationWork(ancestor.automatic_instruction,preview.automatic_instruction)||ancestor.task.trim().replace(/\s+/g,' ')===preview.task.trim().replace(/\s+/g,' '))assistantFailure('REPEATED_DELEGATION');ancestor=child(db,ancestor.parent_session_id);}
            }else if(config.collaborationPolicy==='open_analysis_v13'&&fresh.open_origin){
                const reports=[{id:fresh.report.report_id,summary:fresh.report.summary},...rows<AssistantReport>(db,'reports',parent.id).map(r=>({id:r.id,summary:JSON.stringify(rows<FormalDecision>(db,'decisions',parent.id).find(d=>d.id===r.decision_id))}))];
                if(preview.aggregate&&!same(preview.aggregate,fresh.aggregate)||preview.selected_reports.some(report=>!reports.some(selected=>same(selected,report))))assistantFailure('FORBIDDEN');
            }
            const automatic=preview.automatic_instruction?automaticDelegationProjection(preview.automatic_instruction,fresh,preview.created_at):null;
            if(automatic&&(preview.task!==automatic.task||!same(preview.selected_history,preview.kind==='fork'?[automatic.history]:[])))assistantFailure('FORBIDDEN');
            const visible=automatic?[automatic.history]:[...(parentRelation?.selected_history??[]),...sourceUserQuestion(fresh,parent.created_at),...rows<AssistantEvent>(db,'events',parent.id).filter(e=>['user','advice','question','tool'].includes(e.kind)&&e.source_revision===preview.source.owner.revision_id)].filter((e,i,all)=>all.findIndex(v=>v.id===e.id)===i);
            const cutoff=visible.findIndex(e=>e.id===preview.cutoff_id);
            if((preview.kind==='fork'||preview.cutoff_id!==null)&&cutoff<0)assistantFailure('INVALID_CUTOFF');
            const available=preview.cutoff_id===null?visible:visible.slice(0,cutoff+1);
            if(new Set(preview.selected_history.map(e=>e.id)).size!==preview.selected_history.length||preview.selected_history.some(e=>!available.some(saved=>same(saved,e))))assistantFailure('INVALID_SELECTION');
            const head=db.prepare('SELECT decision_id FROM heads WHERE source=?').get(sourceKey(session.source));
            if((head?.decision_id??null)!==preview.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
            migrate(db);
            const life=db.prepare('SELECT * FROM collaboration_lifecycle WHERE id=?').get(parent.id);
            if(life){const state=decode<{epoch:number;open:boolean}>(life);if(!state.open||state.epoch!==preview.parent_epoch)assistantFailure('INTERRUPTED');}
            else if(preview.parent_epoch!==0)assistantFailure('INTERRUPTED');
            proposed={...preview,child_session_id:session.id};
            write(db,'sessions',session.id,session.source.project_id,session);
            const body=encode(proposed);db.prepare('INSERT INTO collaboration_children VALUES(?,?,?,?)').run(session.id,parent.id,body,hash(body));
            db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(commandId,fingerprint,session.id);
            return proposed;
        },preview.source);}catch(error){
            if(!proposed)throw error;
            try{const db=connect();if(!db)throw error;try{const receipt=db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId);if(receipt){if(receipt.fingerprint!==fingerprint)assistantFailure('COMMAND_CONFLICT');const found=child(db,String(receipt.result));if(!found)assistantFailure('INTEGRITY_BLOCKED');return found;}}finally{db.close();}}
            catch{pending=true;assistantFailure('RESULT_PENDING');}
            throw error;
        }
    }
    async function readLinkedSession(commandId:string,owner:OwnerRef,title:string){
        const db=connect(false,owner.project_id);if(!db)return null;
        try{const receipt=db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId);if(!receipt)return null;
            if(receipt.fingerprint!==hash(encode({kind:'link',title,owner})))return null;
            return get<AssistantSession>(db,'sessions',String(receipt.result));
        }finally{db.close();}
    }
    async function createSession(commandId: string, session: AssistantSession, source: AssistantSource, signal?:AbortSignal,assertAdmission:()=>void=()=>{}) {
        const fresh = await readSource(source.owner);
        if (!same(fresh, source) || !source.eligible)
            assistantFailure('SOURCE_INELIGIBLE');
        if (!assistantText(session.title) || !same(session.source, source.owner))
            assistantFailure();
        connect(true, source.owner.project_id)!.close();
        const fingerprint = hash(encode({ kind: 'link', title: session.title, owner: session.source }));
        return transaction(db => { if(signal?.aborted)assistantFailure('INTERRUPTED');assertAdmission();if(source.membership_origin)migrateMembershipSidecar(db,source.owner.project_id,'main');const prior = db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId); if (prior) {
            if (prior.fingerprint !== fingerprint)
                assistantFailure('COMMAND_CONFLICT');
            return get<AssistantSession>(db, 'sessions', String(prior.result));
        } write(db, 'sessions', session.id, source.owner.project_id, session); db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(commandId, fingerprint, session.id); return structuredClone(session); }, source);
    }
    async function listSessions(projectId: string) { const db = connect(false, projectId); if (!db)
        return []; try {
        return rows<AssistantSession>(db, 'sessions', projectId).filter(s=>!child(db,s.id));
    }
    finally {
        db.close();
    } }
    async function readSession(id: string): Promise<AssistantHistory> { const db = connect(); if (!db)
        assistantFailure('NOT_FOUND'); try {
        return { session: get<AssistantSession>(db, 'sessions', id), events: rows<AssistantEvent>(db, 'events', id), drafts: rows<AssistantDraft>(db, 'drafts', id) };
    }
    finally {
        db.close();
    } }
    async function appendEvent(sessionId: string, event: AssistantEvent, signal?: AbortSignal) { const probe=await readBusinessAuthorization(sessionId,event.attempt_id);if(!probe)assistantFailure('AUTHORITY_REQUIRED');transaction(db => { const grant=business(db,event.attempt_id),authorization=grant.authorization;if (signal?.aborted)
        assistantFailure('INTERRUPTED');currentBusiness(db,grant); if (grant.session_id !== sessionId || event.source_revision !== authorization.source.owner.revision_id)
        assistantFailure('FORBIDDEN'); write(db, 'events', event.id, sessionId, event); },probe.authorization.source); }
    async function saveDraft(draft: AssistantDraft, signal?: AbortSignal) {const probe=connect();if(!probe)assistantFailure('NOT_FOUND');let source:AssistantSource;try{source=business(probe,draft.attempt_id).authorization.source;}finally{probe.close();}transaction(db => { const grant=business(db,draft.attempt_id),authorization=grant.authorization;if (signal?.aborted)
        assistantFailure('INTERRUPTED'); if(child(db,draft.session_id))assistantFailure('FORBIDDEN');if(authorization.source.open_origin)assistantFailure('FORBIDDEN'); if (draft.manual_base_id) {
        const formal = get<FormalDecision>(db, 'decisions', draft.manual_base_id);if(formal.origin)assistantFailure('FORBIDDEN');const session = get<AssistantSession>(db, 'sessions', draft.session_id), origin = get<AssistantDraft>(db, 'drafts', `${formal.draft_id}:${formal.draft_version}`);
        if (!lifecycle(db,draft.session_id).open||(db.prepare('SELECT decision_id FROM heads WHERE source=?').get(sourceKey(formal.source))?.decision_id??null)!==formal.id||!same(session.source, formal.source) || origin.attempt_id !== draft.attempt_id || draft.baseline_decision_id !== formal.id || draft.source_revision !== formal.source.revision_id)
            assistantFailure('FORBIDDEN');
    }
    else {currentBusiness(db,grant);if (grant.session_id !== draft.session_id || draft.source_revision !== authorization.source.owner.revision_id || draft.baseline_decision_id !== authorization.baseline_decision_id)
        assistantFailure('FORBIDDEN');} validateAssistantDecision(draft.fields, authorization.source); const old = rows<AssistantDraft>(db, 'drafts', draft.session_id).filter(d => d.id === draft.id).at(-1); if (old) {
        if (old.status !== 'pending' || draft.version < old.version || draft.version > old.version + 1 || old.session_id !== draft.session_id || old.attempt_id !== draft.attempt_id)
            assistantFailure('FORBIDDEN');
        if (draft.version === old.version && !same(old.fields, draft.fields))
            assistantFailure('FORBIDDEN');
    }else if(!draft.manual_base_id)assistantFailure('EFFECT_UNCONFIRMED'); write(db, 'drafts', `${draft.id}:${draft.version}`, draft.session_id, draft, true); },source); }
    async function findFormalDraft(decisionId: string, owner: OwnerRef) { const db = connect(false, owner.project_id); if (!db)
        assistantFailure('NOT_FOUND'); try {
        const formal = get<FormalDecision>(db, 'decisions', decisionId);
        if (!same(formal.source, owner))
            assistantFailure('FORBIDDEN');
        if(formal.origin)assistantFailure('FORBIDDEN');return get<AssistantDraft>(db, 'drafts', `${formal.draft_id}:${formal.draft_version}`);
    }
    finally {
        db.close();
    } }
    async function formalHistory(owner: OwnerRef) { const db = connect(false, owner.project_id); if (!db)
        return { decisions: [], reports: [] }; try {
        return { decisions: rows<FormalDecision>(db, 'decisions', sourceKey(owner)), reports: rows<AssistantReport>(db, 'reports', sourceKey(owner)) };
    }
    finally {
        db.close();
    } }
    async function adopt(input: Parameters<CaseAssistantStore['adopt']>[0]): Promise<FormalDecision> {
        if(input.source.open_origin)assistantFailure('FORBIDDEN');
        const fingerprint = hash(encode({ kind: 'adopt', command_id: input.command_id, draft_id: input.draft_id, draft_version: input.draft_version, session_id: input.session_id, actor: input.actor, owner: input.source.owner }));
        const probe = connect();
        if (!probe)
            assistantFailure('NOT_FOUND');
        try {
            const prior = probe.prepare('SELECT * FROM receipts WHERE id=?').get(input.command_id);
            if (prior) {
                if (prior.fingerprint !== fingerprint)
                    assistantFailure('COMMAND_CONFLICT');
                return get<FormalDecision>(probe, 'decisions', String(prior.result));
            }
        }
        finally {
            probe.close();
        }
        const source = await readSource(input.source.owner);
        if (!same(source, input.source))
            assistantFailure('STALE_REVISION');
        let result: FormalDecision | undefined;
        try {
            return transaction(db => {
                const draft = get<AssistantDraft>(db, 'drafts', `${input.draft_id}:${input.draft_version}`), session = get<AssistantSession>(db, 'sessions', input.session_id);
                if (rows<AssistantDraft>(db, 'drafts', session.id).filter(d => d.id === draft.id).at(-1)?.version !== input.draft_version)
                    assistantFailure('STALE_DRAFT');
                if (draft.session_id !== session.id || draft.version !== input.draft_version || draft.status !== 'pending' || draft.source_revision !== source.owner.revision_id || !same(session.source, source.owner))
                    assistantFailure('FORBIDDEN');
                const authorization=business(db,draft.attempt_id).authorization;
                if (!authorization.config?.authorized || authorization.blockers.length || !same(authorization.source, source))
                    assistantFailure('AUTHORITY_REQUIRED');
                const key = sourceKey(source.owner), head = db.prepare('SELECT decision_id FROM heads WHERE source=?').get(key)?.decision_id ?? null;
                if (head !== draft.baseline_decision_id)
                    assistantFailure('STALE_DECISION');
                if (!assistantText(input.actor) || !Number.isFinite(Date.parse(input.at)))
                    assistantFailure();
                const fields = validateAssistantDecision(draft.fields, source), previous = head ? get<FormalDecision>(db, 'decisions', String(head)) : null;
                result = { id: randomUUID(), outcome_id: randomUUID(), report_id: randomUUID(), sequence: (previous?.sequence ?? 0) + 1, source: source.owner, source_report_id: source.report.report_id, previous_id: head as string | null, fields, actor: input.actor, adopted_at: input.at, draft_id: draft.id, draft_version: draft.version };
                const sections = formalDecisionSections(result);
                const markdownText = (text:string) => escape(text).replace(/[\\`*_{}\[\]()#+!|>~]/gu, '\\$&');
                const markdown = '# 正式 Decision Record / Expected Outcome\n\n' + sections.map(section => '## '+section.title+'\n\n'+section.rows.map(([label,value])=>'**'+label+'**：'+markdownText(value||'未填写')+'\n').join('\n')).join('\n');
                const html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>正式决策报告</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#252931;background:#faf8f5;max-width:960px;margin:32px auto;padding:0 24px}section{background:white;border:1px solid #ded9d1;border-radius:12px;padding:24px;margin:20px 0}dl>div{display:grid;grid-template-columns:minmax(140px,1fr) 3fr;gap:16px;border-top:1px solid #eee;padding:10px 0}dt{font-weight:600}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:26px}h2{font-size:20px}@media(max-width:600px){dl>div{display:block}dd{margin-top:6px}}</style></head><body><h1>正式 Decision Record / Expected Outcome</h1>' + sections.map(section=>'<section><h2>'+escape(section.title)+'</h2><dl>'+section.rows.map(([label,value])=>'<div><dt>'+escape(label)+'</dt><dd>'+escape(value||'未填写')+'</dd></div>').join('')+'</dl></section>').join('')+'</body></html>';

                const report: AssistantReport = { id: result.report_id, decision_id: result.id, source_revision: source.owner.revision_id, sequence: source.report.version + result.sequence, original_report_id: source.report.report_id, markdown, html, markdown_sha256: hash(markdown), html_sha256: hash(html), created_at: input.at };
                write(db, 'decisions', result.id, key, result);
                write(db, 'reports', report.id, key, report);
                db.prepare('INSERT OR REPLACE INTO heads VALUES(?,?)').run(key, result.id);
                write(db, 'drafts', `${draft.id}:${draft.version}`, draft.session_id, { ...draft, status: 'adopted', decided_at: input.at }, true);
                db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(input.command_id, fingerprint, result.id);
                return result;
            }, source);
        }
        catch (error) {
            if (!result)
                throw error;
            try {
                const db = connect();
                if (!db)
                    assistantFailure('RESULT_PENDING');
                try {
                    const receipt = db.prepare('SELECT * FROM receipts WHERE id=?').get(input.command_id);
                    if (receipt?.fingerprint === fingerprint)
                        return get<FormalDecision>(db, 'decisions', String(receipt.result));
                }
                finally {
                    db.close();
                }
            }
            catch {
                pending = true;
                assistantFailure('RESULT_PENDING');
            }
            throw error;
        }
    }
    return { authorizeBusiness,readBusinessAuthorization,isBusinessAuthorized,authorizesWork,publishModel,reserveOpenCommand,finishOpenCommand,readOpenCommand,readLifecycle,closeFamily,reopenSession,readParentCollaboration,returnChild,failChildReturn,reviewChild,childResults,readChild,createChild,readSource, listSessions, createSession, readLinkedSession, readSession, appendEvent, saveDraft, findFormalDraft, formalHistory, adopt };
}

/** Only the explicit P1 formal submission calls this local sidecar activation. */
export function prepareMembershipSidecar(projectRoot:string,projectId:string):string{
 const root=realpathSync(projectRoot),path=join(root,'.xanthil','desktop','case-assistant.sqlite');
 for(const file of [join(root,'.xanthil'),dirname(path),path,...['-journal','-wal','-shm'].map(s=>path+s)])if(existsSync(file)&&lstatSync(file).isSymbolicLink())assistantFailure('INTEGRITY_BLOCKED');
 const existed=existsSync(path),db=new DatabaseSync(path);let locked=false;try{
 // Cold creators cannot inspect each other's uncommitted schema. This wait is
 // connection-local and bounded; formal effect transactions remain fail-fast.
 db.exec('PRAGMA busy_timeout=1000; PRAGMA synchronous=FULL; BEGIN EXCLUSIVE');locked=true;
 const empty=Number(db.prepare('PRAGMA user_version').get()?.user_version)===0&&db.prepare('SELECT count(*) n FROM sqlite_schema').get()?.n===0;
 if(!existed&&empty){db.exec(schema);db.exec('PRAGMA application_id=1480802625;PRAGMA user_version=100');db.prepare("INSERT INTO metadata VALUES(?,'1.0')").run(projectId);}
 assertMembershipSidecar(db,projectId,'main');db.exec('COMMIT');locked=false;db.exec('PRAGMA busy_timeout=0');
 }catch(error){if(locked)try{db.exec('ROLLBACK');}catch{}throw error;}finally{db.close();}return path;
}
export function assertMembershipSidecar(db:DatabaseSync,projectId:string,name:'main'|'assistant'){
 const version=Number(db.prepare(`PRAGMA ${name}.user_version`).get()?.user_version),metadata=db.prepare(`SELECT * FROM ${name}.metadata`).all();
 const actual=encode(db.prepare(`SELECT type,name,tbl_name,sql FROM ${name}.sqlite_schema ORDER BY type,name`).all());
 if(![100,101,102,103].includes(version)||Number(db.prepare(`PRAGMA ${name}.application_id`).get()?.application_id)!==1480802625||metadata.length!==1||metadata[0].project_id!==projectId||metadata[0].version!==({100:'1.0',101:'1.1',102:'1.2',103:'1.3'} as Record<number,string>)[version]||actual!==schemaIdentities[version-100])assistantFailure('SCHEMA_UNSUPPORTED');
 if(db.prepare(`PRAGMA ${name}.journal_mode`).get()?.journal_mode!=='delete'||Number(db.prepare(`PRAGMA ${name}.synchronous`).get()?.synchronous)!==2||JSON.stringify(db.prepare(`PRAGMA ${name}.integrity_check`).all())!=='[{"integrity_check":"ok"}]'||db.prepare(`PRAGMA ${name}.foreign_key_check`).all().length)assistantFailure('INTEGRITY_BLOCKED');
 for(const table of [...tables,...(version>=101?['collaboration_children','collaboration_lifecycle','collaboration_results','collaboration_returns','collaboration_reviews']:[])])for(const row of db.prepare(`SELECT * FROM ${name}.${table}`).all())if(typeof row.body!=='string'||hash(row.body)!==row.sha256)assistantFailure('INTEGRITY_BLOCKED');
 return version;
}
export function migrateMembershipSidecar(db:DatabaseSync,projectId:string,name:'assistant'|'main'='assistant'){
 const version=assertMembershipSidecar(db,projectId,name);if(version>=102)return;
 db.exec(`DROP TABLE ${name}.metadata;CREATE TABLE ${name}.metadata(project_id TEXT PRIMARY KEY,version TEXT NOT NULL CHECK(version='1.2'));`);db.prepare(`INSERT INTO ${name}.metadata VALUES(?,'1.2')`).run(projectId);
 if(version===100)db.exec(collaborationSchema.replaceAll('CREATE TABLE ',`CREATE TABLE ${name}.`));
 db.exec(`PRAGMA ${name}.user_version=102`);assertMembershipSidecar(db,projectId,name);
}

function validateMembershipFormal(value:unknown){
 const f=assistantRecord(value,['id','outcome_id','report_id','sequence','source','source_report_id','previous_id','fields','actor','adopted_at','origin']),o=assistantRecord(f.origin,['kind','task_id','review_id','review_version','intent_id']),owner=assistantRecord(f.source,['project_id','session_id','case_id','revision_id']);
 const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
 if(!['membership_review','native_member_review'].includes(String(o.kind))||![f.id,f.outcome_id,f.report_id,f.source_report_id,o.task_id,o.review_id,o.intent_id,...Object.values(owner)].every(uuid)||f.previous_id!==null&&!uuid(f.previous_id)||!Number.isSafeInteger(f.sequence)||Number(f.sequence)<1||!Number.isSafeInteger(o.review_version)||Number(o.review_version)<1||!assistantText(f.actor)||typeof f.adopted_at!=='string'||!Number.isFinite(Date.parse(f.adopted_at)))assistantFailure('INTEGRITY_BLOCKED');
}

/** Explicit native-source semantic successor, same authority and atomic attached transaction. */
export function migrateNativeMemberSidecar(db:DatabaseSync,projectId:string){
 const v=assertMembershipSidecar(db,projectId,'assistant');if(v===103)return;migrateMembershipSidecar(db,projectId);db.exec("DROP TABLE assistant.metadata; CREATE TABLE assistant.metadata(project_id TEXT PRIMARY KEY,version TEXT NOT NULL CHECK(version='1.3'));");db.prepare("INSERT INTO assistant.metadata VALUES(?,'1.3')").run(projectId);db.exec('PRAGMA assistant.user_version=103');assertMembershipSidecar(db,projectId,'assistant');
}
