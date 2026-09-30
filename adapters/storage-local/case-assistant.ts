import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import type { CaseAssistantStore, AssistantHistory } from '../../packages/ports/case-assistant.ts';
import type { AssistantSource, AssistantSession, AssistantAttempt, AssistantEvent, AssistantDraft, FormalDecision, AssistantReport } from '../../packages/contracts/case-assistant.ts';
import type { OwnerRef } from '../../packages/contracts/xanthil-desktop-ipc.ts';
import { createLocalDesktopDecisionCaseStore } from './xanthil-desktop-decision-case.ts';
import { assistantFailure, assistantText, validateAssistantDecision, formalDecisionSections } from '../../packages/product-core/case-assistant.ts';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const encode = (value: unknown): string => JSON.stringify(value, function (_key, item) {
    if (typeof item === 'number' && !Number.isSafeInteger(item) || item === undefined)
        assistantFailure();
    return item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item;
});
const tables = ['sessions', 'attempts', 'events', 'drafts', 'decisions', 'reports'] as const;
type Table = typeof tables[number];
const schema = `CREATE TABLE metadata(project_id TEXT PRIMARY KEY,version TEXT NOT NULL CHECK(version='1.0'));
CREATE TABLE sessions(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE attempts(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE events(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE drafts(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE decisions(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE reports(id TEXT PRIMARY KEY,parent TEXT NOT NULL,body TEXT NOT NULL,sha256 TEXT NOT NULL);
CREATE TABLE heads(source TEXT PRIMARY KEY,decision_id TEXT NOT NULL);
CREATE TABLE receipts(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,result TEXT NOT NULL);
CREATE INDEX attempts_parent ON attempts(parent); CREATE INDEX events_parent ON events(parent);
CREATE INDEX drafts_parent ON drafts(parent); CREATE INDEX decisions_parent ON decisions(parent); CREATE INDEX reports_parent ON reports(parent);`;
const schemaIdentity = (() => { const db = new DatabaseSync(':memory:'); try {
    db.exec(schema);
    return encode(db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all());
}
finally {
    db.close();
} })();
const sourceKey = (owner: OwnerRef) => encode(owner);
const same = (a: unknown, b: unknown) => encode(a) === encode(b);
const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function createLocalCaseAssistantStore(config: {
    projectRoot: string;
}): CaseAssistantStore {
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
            const identity = db.prepare('SELECT * FROM metadata').all();
            if (identity.length !== 1 || identity[0].version !== '1.0' || projectId && identity[0].project_id !== projectId || Number(db.prepare('PRAGMA application_id').get()?.application_id) !== 1480802625 || Number(db.prepare('PRAGMA user_version').get()?.user_version) !== 100)
                assistantFailure('SCHEMA_UNSUPPORTED');
            if (encode(db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all()) !== schemaIdentity)
                assistantFailure('SCHEMA_UNSUPPORTED');
            for (const table of tables)
                for (const row of db.prepare(`SELECT * FROM ${table}`).all()) {
                    const value = decode(row);
                    if ((table === 'drafts' ? `${value.id}:${value.version}` : value.id) !== row.id)
                        assistantFailure('INTEGRITY_BLOCKED');
                }
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
            if (source) {
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
        const o = source.owner;
        const s = db.prepare('SELECT * FROM original.product_sessions WHERE session_id=? AND project_id=? AND case_id=?').get(o.session_id, o.project_id, o.case_id);
        const r = db.prepare('SELECT * FROM original.case_revisions WHERE revision_id=? AND project_id=? AND session_id=? AND case_id=?').get(o.revision_id, o.project_id, o.session_id, o.case_id);
        if (!s || s.current_revision_id !== o.revision_id || !r || r.state !== 'Completed' || r.integrity_state !== 'ok' || String(r.row_version) !== source.row_version || r.current_finding_id !== source.finding_id || r.current_acceptance_id !== source.acceptance_id || r.current_closure_id !== source.closure_id || r.current_report_id !== source.report.report_id)
            assistantFailure('STALE_REVISION');
    }
    async function readSource(owner: OwnerRef): Promise<AssistantSource> {
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
        try {
            if (f)
                aggregate = db.prepare('SELECT * FROM aggregate_artifacts WHERE artifact_id=? AND revision_id=?').get(f.aggregate_id, owner.revision_id);
        }
        finally {
            db.close();
        }
        if (f && !aggregate)
            missing.push('缺少已验证聚合');
        return { owner: structuredClone(owner), case_name: r?.case_name ?? '', current_revision_id: p.session?.current_revision_id ?? '', eligible: missing.length === 0, missing, row_version: r?.row_version ?? '', finding_id: f?.finding_id ?? '', acceptance_id: a?.acceptance_id ?? '', closure_id: c?.closure_id ?? '', evidence_refs: f?.evidence_refs ?? [], limitations: f?.limitations ?? [], candidates: form?.candidates ?? [], finding_summary: f ? encode({ judgment: f.judgment, supporting_evidence: f.supporting_evidence, refutation: f.refutation, limitations: f.limitations }) : '', aggregate: { artifact_id: f?.aggregate_id ?? '', sha256: String(aggregate?.sha256 ?? ''), fields: aggregate ? JSON.parse(String(aggregate.columns_json)) : [], scope: encode({ comparison: p.confirmation?.comparison_period ?? null, current: p.confirmation?.current_period ?? null, grain: 'verified comparison/current aggregate metrics; no individual rows' }), content: f?.metrics ?? '' }, report: { report_id: report?.report_id ?? '', version: Number(report?.version_sequence ?? 0), sha256: report?.markdown_sha256 ?? '', summary: encode({ report_id: report?.report_id ?? null, finding_id: f?.finding_id ?? null, judgment: f?.judgment ?? null, limitations: f?.limitations ?? [], closure_route: c?.route ?? null }) } };
    }
    async function createSession(commandId: string, session: AssistantSession, source: AssistantSource) {
        const fresh = await readSource(source.owner);
        if (!same(fresh, source) || !source.eligible)
            assistantFailure('SOURCE_INELIGIBLE');
        if (!assistantText(session.title) || !same(session.source, source.owner))
            assistantFailure();
        connect(true, source.owner.project_id)!.close();
        const fingerprint = hash(encode({ kind: 'link', title: session.title, owner: session.source }));
        return transaction(db => { const prior = db.prepare('SELECT * FROM receipts WHERE id=?').get(commandId); if (prior) {
            if (prior.fingerprint !== fingerprint)
                assistantFailure('COMMAND_CONFLICT');
            return get<AssistantSession>(db, 'sessions', String(prior.result));
        } write(db, 'sessions', session.id, source.owner.project_id, session); db.prepare('INSERT INTO receipts VALUES(?,?,?)').run(commandId, fingerprint, session.id); return structuredClone(session); }, source);
    }
    async function listSessions(projectId: string) { const db = connect(false, projectId); if (!db)
        return []; try {
        return rows<AssistantSession>(db, 'sessions', projectId);
    }
    finally {
        db.close();
    } }
    async function readSession(id: string): Promise<AssistantHistory> { const db = connect(); if (!db)
        assistantFailure('NOT_FOUND'); try {
        return { session: get<AssistantSession>(db, 'sessions', id), attempts: rows<AssistantAttempt>(db, 'attempts', id), events: rows<AssistantEvent>(db, 'events', id), drafts: rows<AssistantDraft>(db, 'drafts', id) };
    }
    finally {
        db.close();
    } }
    async function saveAttempt(attempt: AssistantAttempt) { transaction(db => { const session = get<AssistantSession>(db, 'sessions', attempt.session_id); if (!same(session.source, attempt.authorization.source.owner))
        assistantFailure('FORBIDDEN'); const old = db.prepare('SELECT * FROM attempts WHERE id=?').get(attempt.id); if (old) {
        const prior = decode<AssistantAttempt>(old);
        if (!same(prior.authorization, attempt.authorization) || !['Running', 'Waiting'].includes(prior.status) && !same(prior, attempt))
            assistantFailure('FORBIDDEN');
    }
    else if (rows<AssistantAttempt>(db, 'attempts', session.id).some(a => ['Running', 'Waiting'].includes(a.status)))
        assistantFailure('BUSY'); write(db, 'attempts', attempt.id, session.id, attempt, true); }); }
    async function appendEvent(sessionId: string, event: AssistantEvent, signal?: AbortSignal) { transaction(db => { if (signal?.aborted)
        assistantFailure('INTERRUPTED'); const attempt = get<AssistantAttempt>(db, 'attempts', event.attempt_id); if (event.kind !== 'status' && !['Running', 'Waiting'].includes(attempt.status) || attempt.session_id !== sessionId || event.source_revision !== attempt.authorization.source.owner.revision_id)
        assistantFailure('FORBIDDEN'); write(db, 'events', event.id, sessionId, event); }); }
    async function saveDraft(draft: AssistantDraft, signal?: AbortSignal) { transaction(db => { if (signal?.aborted)
        assistantFailure('INTERRUPTED'); const attempt = get<AssistantAttempt>(db, 'attempts', draft.attempt_id); if (draft.manual_base_id) {
        const formal = get<FormalDecision>(db, 'decisions', draft.manual_base_id), session = get<AssistantSession>(db, 'sessions', draft.session_id), origin = get<AssistantDraft>(db, 'drafts', `${formal.draft_id}:${formal.draft_version}`);
        if (!same(session.source, formal.source) || origin.attempt_id !== draft.attempt_id || draft.baseline_decision_id !== formal.id || draft.source_revision !== formal.source.revision_id)
            assistantFailure('FORBIDDEN');
    }
    else if (attempt.session_id !== draft.session_id || draft.source_revision !== attempt.authorization.source.owner.revision_id || draft.baseline_decision_id !== attempt.authorization.baseline_decision_id)
        assistantFailure('FORBIDDEN'); validateAssistantDecision(draft.fields, attempt.authorization.source); const old = rows<AssistantDraft>(db, 'drafts', draft.session_id).filter(d => d.id === draft.id).at(-1); if (old) {
        if (old.status !== 'pending' || draft.version < old.version || draft.version > old.version + 1 || old.session_id !== draft.session_id || old.attempt_id !== draft.attempt_id)
            assistantFailure('FORBIDDEN');
        if (draft.version === old.version && !same(old.fields, draft.fields))
            assistantFailure('FORBIDDEN');
    } write(db, 'drafts', `${draft.id}:${draft.version}`, draft.session_id, draft, true); }); }
    async function findFormalDraft(decisionId: string, owner: OwnerRef) { const db = connect(false, owner.project_id); if (!db)
        assistantFailure('NOT_FOUND'); try {
        const formal = get<FormalDecision>(db, 'decisions', decisionId);
        if (!same(formal.source, owner))
            assistantFailure('FORBIDDEN');
        return get<AssistantDraft>(db, 'drafts', `${formal.draft_id}:${formal.draft_version}`);
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
                const draft = get<AssistantDraft>(db, 'drafts', `${input.draft_id}:${input.draft_version}`), attempt = get<AssistantAttempt>(db, 'attempts', draft.attempt_id), session = get<AssistantSession>(db, 'sessions', input.session_id);
                if (rows<AssistantDraft>(db, 'drafts', session.id).filter(d => d.id === draft.id).at(-1)?.version !== input.draft_version)
                    assistantFailure('STALE_DRAFT');
                if (draft.session_id !== session.id || draft.version !== input.draft_version || draft.status !== 'pending' || draft.source_revision !== source.owner.revision_id || !same(session.source, source.owner))
                    assistantFailure('FORBIDDEN');
                if (!attempt.authorization.config?.authorized || attempt.authorization.blockers.length || !same(attempt.authorization.source, source))
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
    async function interruptAll(at: string) { if (!existsSync(path))
        return; transaction(db => { for (const attempt of rows<AssistantAttempt>(db, 'attempts'))
        if (['Running', 'Waiting'].includes(attempt.status))
            write(db, 'attempts', attempt.id, attempt.session_id, { ...attempt, status: 'Interrupted', ended_at: at, waiting_deadline: null, reason: 'application_closed' }, true); }); }
    return { readSource, listSessions, createSession, readSession, saveAttempt, appendEvent, saveDraft, findFormalDraft, formalHistory, adopt, interruptAll };
}
