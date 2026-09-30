import type { LocalModelAccess } from '../ports/provider-settings.ts';
import { randomUUID } from 'node:crypto';
import type { CaseAssistantStore, CaseAssistantRuntime } from '../ports/case-assistant.ts';
import { ASSISTANT_TOOLS, type AssistantConfig, type AssistantProjection, type AssistantAttempt, type AssistantEvent, type AssistantDraft, type AssistantStatus, type Authorization, type DecisionFields } from '../contracts/case-assistant.ts';
import type { OwnerRef } from '../contracts/xanthil-desktop-ipc.ts';
import { assistantFailure, assistantRecord, assistantText, validateAssistantDecision } from '../product-core/case-assistant.ts';
export function createCaseAssistantApplication(input: {
    store: CaseAssistantStore;
    runtime: CaseAssistantRuntime | null;
    config: AssistantConfig | null;
    clock: () => Date;
    modelAccess?: LocalModelAccess;
}) {
    const { store, runtime, clock } = input, config = structuredClone(input.config), previews = new Map<string, {
        generation?: number;
        session: string;
        authorization: Authorization;
    }>();
    type Live = {
        attempt: AssistantAttempt;
        abort: AbortController;
        timer: ReturnType<typeof setTimeout> | null;
        busy: boolean;
        release?: () => void;
    };
    const live = new Map<string, Live>();
    const pendingStarts = new Map<string, AbortController>();
    let closed = false;
    const sessionEpochs=new Map<string,number>();
    const now = () => clock().toISOString();
    function guards() { if (closed)
        assistantFailure('INTERRUPTED'); }
    async function read(id: string): Promise<AssistantProjection> { const h = await store.readSession(id), source = await store.readSource(h.session.source), f = await store.formalHistory(h.session.source); return { version: '1.0', ...h, source, ...f, current_decision_id: f.decisions.at(-1)?.id ?? null }; }
    async function link(owner: OwnerRef, title: string, commandId: string) { guards(); const source = await store.readSource(owner); if (!source.eligible)
        assistantFailure('SOURCE_INELIGIBLE'); const session = await store.createSession(commandId, { id: randomUUID(), title, source: owner, created_at: now(), archived: false }, source); return read(session.id); }
    async function list(projectId: string) { return store.listSessions(projectId); }
    async function prepare(id: string, text: string, historyIds: readonly string[] = [], reportIds: readonly string[] = [], rebase = false): Promise<Authorization> {
        guards();
        const epoch=sessionEpochs.get(id)??0;
        const p = await read(id), previous = p.attempts.at(-1), current = p.decisions.at(-1);
        const selected = p.events.filter(e => historyIds.includes(e.id));
        if (new Set(historyIds).size !== historyIds.length || selected.length !== historyIds.length || selected.some(e => !['user', 'advice', 'question', 'tool'].includes(e.kind) || e.source_revision !== p.source.owner.revision_id))
            assistantFailure('FORBIDDEN');
        if (rebase && selected.some(e => e.kind !== 'user'))
            assistantFailure('FORBIDDEN');
        const available = [{ id: p.source.report.report_id, summary: p.source.report.summary }, ...p.reports.map(r => ({ id: r.id, summary: JSON.stringify(p.decisions.find(d => d.id === r.decision_id)) }))];
        const chosen = reportIds.length ? available.filter(r => reportIds.includes(r.id)) : [available.at(-1)!];
        if (reportIds.length && chosen.length !== new Set(reportIds).size)
            assistantFailure('FORBIDDEN');
        const blockers = [...p.source.missing];
        if (!assistantText(text))
            blockers.push('请填写初始任务文本');
        if (!config?.authorized || !runtime)
            blockers.push('模型未配置');
        const accessSnapshot=input.modelAccess?.snapshot();
        if(accessSnapshot&&!accessSnapshot.available)blockers.push('请检查模型接入配置');
        if (!config || !assistantText(config.provider) || !assistantText(config.model) || !assistantText(config.limits.currency) || !['turns', 'execution_ms', 'waiting_ms', 'cost_microunits', 'turn_cost_microunits'].every(k => Number.isSafeInteger(config.limits[k as keyof typeof config.limits]) && Number(config.limits[k as keyof typeof config.limits]) > 0) || config.limits.turn_cost_microunits > config.limits.cost_microunits)
            blockers.push('缺少确切执行、等待或费用硬上限');
        const baseline = rebase || !previous ? current?.id ?? null : previous.authorization.baseline_decision_id;
        if (baseline !== (current?.id ?? null))
            blockers.push('当前决定已变化，请基于当前版本重新开始');
        const context = { source: { owner: p.source.owner, finding_id: p.source.finding_id, evidence_refs: p.source.evidence_refs, limitations: p.source.limitations, closure_id: p.source.closure_id }, aggregate: p.source.aggregate, formal_baseline: baseline ? current : null, initial_text: text, selected_history: selected, selected_reports: chosen, tools: ASSISTANT_TOOLS, skill: 'Case 决策与预期 v1.0', prompt_version: '1.0' };
        const authorization: Authorization = { id: randomUUID(), source: p.source, baseline_decision_id: baseline, config, initial_text: text, selected_history: selected, selected_reports: chosen, tools: ASSISTANT_TOOLS, categories: ['user_authored_text', 'verified_case', 'accepted_evidence_finding', 'approved_020_clean_subset', 'selected_report_summary', 'selected_history'], skill_version: '1.0', prompt_version: '1.0', created_at: now(), payload: JSON.stringify(context), blockers };
        guards();if(epoch!==(sessionEpochs.get(id)??0))assistantFailure('INTERRUPTED');
        previews.set(authorization.id, { session: id, authorization, generation: accessSnapshot?.generation });
        return structuredClone(authorization);
    }
    async function event(control: Live, kind: AssistantEvent['kind'], text: string, status = 'completed', tool: AssistantEvent['tool'] = null) { await store.appendEvent(control.attempt.session_id, { id: randomUUID(), attempt_id: control.attempt.id, at: now(), kind, text, tool, status, source_revision: control.attempt.authorization.source.owner.revision_id }, kind === 'status' ? undefined : control.abort.signal); }
    async function settle(control: Live, status: AssistantStatus, reason: string | null) { if (control.timer)
        clearTimeout(control.timer); control.timer = null; control.abort.abort(); if (!['Running', 'Waiting'].includes(control.attempt.status))
        return; control.attempt = { ...control.attempt, status, reason, ended_at: now(), waiting_deadline: null }; try { await store.saveAttempt(control.attempt); await event(control, 'status', reason ?? status, status); } finally { control.release?.(); control.release=undefined; } }
    async function start(id: string, previewId: string, freeTextConfirmed: boolean) {
        guards();
        if (!freeTextConfirmed)
            assistantFailure('AUTHORITY_REQUIRED');
        const preview = previews.get(previewId);
        if (!preview || preview.session !== id)
            assistantFailure('AUTHORITY_REQUIRED');
        const a = preview.authorization;
        if (a.blockers.length || !a.config?.authorized || !runtime)
            assistantFailure('AUTHORITY_REQUIRED');
        if(pendingStarts.has(id))assistantFailure('BUSY');
        const pending=new AbortController();pendingStarts.set(id,pending);
        let lease:{release():void}|undefined,transferred=false;
        try {
        if(input.modelAccess)lease=await input.modelAccess.acquire(preview.generation!);
        if(pending.signal.aborted||closed)return read(id);
        const p = await read(id);
        if(pending.signal.aborted||closed)return p;
        if (JSON.stringify(p.source) !== JSON.stringify(a.source) || p.current_decision_id !== a.baseline_decision_id || JSON.stringify(config) !== JSON.stringify(a.config))
            assistantFailure('AUTHORIZATION_STALE');
        if (live.has(id) && ['Running', 'Waiting'].includes(live.get(id)!.attempt.status))
            assistantFailure('BUSY');
        const attempt: AssistantAttempt = { id: randomUUID(), session_id: id, authorization: a, status: 'Running', started_at: now(), ended_at: null, waiting_deadline: null, turns: 0, execution_ms: 0, cost_microunits: 0, reason: null };
        previews.delete(previewId);
        const control: Live = { release: lease?.release, attempt, abort: new AbortController(), timer: null, busy: true };
        live.set(id, control);
        transferred=true;
        let saved = false;
        try {
            await store.saveAttempt(attempt);
            saved = true;
            if (control.abort.signal.aborted)
                return read(id);
            await event(control, 'user', a.initial_text);
            if (control.abort.signal.aborted)
                return read(id);
        }
        catch (error) {
            if (control.abort.signal.aborted)
                return read(id);
            if (saved)
                await settle(control, 'Failed', String((error as { code?: string }).code ?? 'storage_failed'));
            else
                { live.delete(id);control.release?.();control.release=undefined; }
            control.busy = false;
            throw error;
        }
        void execute(control, a.initial_text);
        return read(id);
        } finally { pendingStarts.delete(id); if(!transferred)lease?.release(); }
    }
    async function execute(control: Live, text: string) {
        let toolResult: unknown = null;
        try {
            while (!control.abort.signal.aborted) {
                const a = control.attempt.authorization, c = a.config!, limits = c.limits;
                const p = await read(control.attempt.session_id);
                if (control.abort.signal.aborted)
                    return;
                if (!p.source.eligible || JSON.stringify(p.source) !== JSON.stringify(a.source) || p.current_decision_id !== a.baseline_decision_id) {
                    await settle(control, 'Failed', 'source_or_decision_changed');
                    return;
                }
                if (control.attempt.turns >= limits.turns || control.attempt.cost_microunits + limits.turn_cost_microunits > limits.cost_microunits) {
                    await settle(control, 'BudgetExhausted', 'budget_exhausted');
                    return;
                }
                if (control.attempt.execution_ms >= limits.execution_ms) {
                    await settle(control, 'TimedOut', 'execution_timeout');
                    return;
                }
                control.attempt = { ...control.attempt, status: 'Running', waiting_deadline: null, turns: control.attempt.turns + 1 };
                await store.saveAttempt(control.attempt);
                if (control.abort.signal.aborted)
                    return;
                const payload = JSON.stringify({ authorized_context: JSON.parse(a.payload), current_attempt_history: p.events.filter(e => e.attempt_id === control.attempt.id && ['user', 'question', 'advice', 'tool'].includes(e.kind)), visible_message: text, authorized_tool_result: toolResult });
                await event(control, 'payload', payload, 'issued');
                if (control.abort.signal.aborted)
                    return;
                const began = clock().getTime(), remaining = limits.execution_ms - control.attempt.execution_ms;
                const timeout = new Promise<never>((_, reject) => { control.timer = setTimeout(() => { reject(Object.assign(new Error('EXECUTION_TIMEOUT'), { code: 'EXECUTION_TIMEOUT' })); control.abort.abort(); }, remaining); });
                const aborted = new Promise<never>((_, reject) => { control.abort.signal.addEventListener('abort', () => reject(Object.assign(new Error('INTERRUPTED'), { code: 'INTERRUPTED' })), { once: true }); });
                const output = await Promise.race([runtime!.turn({ payload, provider: c.provider, model: c.model, signal: control.abort.signal, cost_reservation_microunits: limits.turn_cost_microunits }), timeout, aborted]);
                if (control.timer)
                    clearTimeout(control.timer);
                control.timer = null;
                if (control.abort.signal.aborted)
                    return;
                assistantRecord(output, ['provider', 'model', 'cost_microunits', 'output']);
                const elapsed = Math.max(0, clock().getTime() - began);
                if (output.provider !== c.provider || output.model !== c.model || !Number.isSafeInteger(output.cost_microunits) || output.cost_microunits < 0 || output.cost_microunits > limits.turn_cost_microunits)
                    assistantFailure('PROVIDER_USAGE_INVALID');
                control.attempt = { ...control.attempt, execution_ms: control.attempt.execution_ms + elapsed, cost_microunits: control.attempt.cost_microunits + output.cost_microunits };
                await store.saveAttempt(control.attempt);
                if (control.abort.signal.aborted)
                    return;
                if (control.attempt.execution_ms >= limits.execution_ms) {
                    await settle(control, 'TimedOut', 'execution_timeout');
                    return;
                }
                const o = output.output;
                if (!o || typeof o !== 'object')
                    assistantFailure();
                assistantRecord(o, o.kind === 'tool' ? ['kind', 'tool', 'revision_id'] : o.kind === 'draft' ? ['kind', 'fields'] : ['kind', 'text']);
                if (o.kind === 'tool') {
                    if (!a.tools.includes(o.tool) || o.revision_id !== a.source.owner.revision_id) {
                        await event(control, 'tool', '已拒绝：超出任务授权', 'rejected', null);
                        await settle(control, 'Failed', 'tool_outside_authorization');
                        return;
                    }
                    const latest = await read(control.attempt.session_id);
                    if (control.abort.signal.aborted)
                        return;
                    if (JSON.stringify(latest.source) !== JSON.stringify(a.source))
                        assistantFailure('STALE_REVISION');
                    const s = a.source;
                    toolResult = o.tool === 'read_case' ? { owner: s.owner, case_name: s.case_name, limitations: s.limitations } : o.tool === 'read_evidence' ? { finding_id: s.finding_id, evidence_refs: s.evidence_refs, summary: s.finding_summary } : o.tool === 'read_candidates' ? s.candidates : o.tool === 'read_aggregate' ? s.aggregate : a.selected_reports;
                    await event(control, 'tool', JSON.stringify({ source: s.owner, result: toolResult }), 'completed', o.tool);
                    text = '';
                    continue;
                }
                if (o.kind === 'question') {
                    if (!assistantText(o.text))
                        assistantFailure();
                    await event(control, 'question', o.text);
                    if (control.abort.signal.aborted)
                        return;
                    const deadline = new Date(clock().getTime() + limits.waiting_ms).toISOString();
                    control.attempt = { ...control.attempt, status: 'Waiting', waiting_deadline: deadline };
                    await store.saveAttempt(control.attempt);
                    if (control.abort.signal.aborted)
                        return;
                    control.busy = false;
                    control.timer = setTimeout(() => void settle(control, 'WaitExpired', 'waiting_timeout'), limits.waiting_ms);
                    return;
                }
                if (o.kind === 'draft') {
                    const fields = validateAssistantDecision(o.fields, a.source);
                    if (control.abort.signal.aborted)
                        return;
                    const draft: AssistantDraft = { id: randomUUID(), version: 1, session_id: control.attempt.session_id, attempt_id: control.attempt.id, source_revision: a.source.owner.revision_id, baseline_decision_id: a.baseline_decision_id, fields, status: 'pending', edited: false, created_at: now(), decided_at: null, reason: null };
                    await store.saveDraft(draft, control.abort.signal);
                    if (control.abort.signal.aborted)
                        return;
                    await settle(control, 'Succeeded', null);
                    return;
                }
                if (o.kind === 'advice' && assistantText(o.text)) {
                    await event(control, 'advice', o.text);
                    await settle(control, 'Succeeded', null);
                    return;
                }
                assistantFailure();
            }
        }
        catch (error) {
            const code = String((error as {
                code?: string;
            }).code ?? 'provider_failed');
            if (['Running', 'Waiting'].includes(control.attempt.status))
                await settle(control, code === 'EXECUTION_TIMEOUT' ? 'TimedOut' : 'Failed', code).catch(() => undefined);
        }
        finally {
            control.busy = false;
        }
    }
    async function send(id: string, text: string) { guards(); if (!assistantText(text))
        assistantFailure(); const control = live.get(id); if (!control || control.busy || control.attempt.status !== 'Waiting' || control.abort.signal.aborted)
        assistantFailure('FORBIDDEN'); if (clock().getTime() >= Date.parse(control.attempt.waiting_deadline!)) {
        await settle(control, 'WaitExpired', 'waiting_timeout');
        assistantFailure('WAIT_EXPIRED');
    } control.busy = true; try {
        const p = await read(id);
        if (control.abort.signal.aborted)
            assistantFailure('INTERRUPTED');
        if (JSON.stringify(p.source) !== JSON.stringify(control.attempt.authorization.source) || p.current_decision_id !== control.attempt.authorization.baseline_decision_id)
            assistantFailure('AUTHORIZATION_STALE');
        // Waiting still owns the deadline until the reply is durably appended.
        await event(control, 'user', text);
        if (control.abort.signal.aborted)
            return read(id);
        if (clock().getTime() >= Date.parse(control.attempt.waiting_deadline!)) {
            await settle(control, 'WaitExpired', 'waiting_timeout');
            return read(id);
        }
    }
    catch (error) {
        control.busy = false;
        if (control.abort.signal.aborted)
            return read(id);
        await settle(control, 'Failed', String((error as { code?: string }).code ?? 'storage_failed'));
        throw error;
    } if (control.timer)
        clearTimeout(control.timer); control.timer = null; void execute(control, text); return read(id); }
    async function stop(id: string) { pendingStarts.get(id)?.abort(); const c = live.get(id); if (c)
        await settle(c, 'Stopped', 'user_stopped'); return read(id); }
    async function edit(id: string, draftId: string, version: number, fields: DecisionFields) { guards(); const p = await read(id), draft = p.drafts.filter(d => d.id === draftId).at(-1); if (!draft || draft.version !== version || draft.status !== 'pending' || draft.baseline_decision_id !== p.current_decision_id || !p.source.eligible)
        assistantFailure('STALE_DRAFT'); await store.saveDraft({ ...draft, version: version + 1, fields: validateAssistantDecision(fields, p.source), edited: true, created_at: now() }); return read(id); }
    async function revise(id: string, decisionId: string) {
        guards();
        const p = await read(id), formal = p.decisions.at(-1);
        if (!p.source.eligible || !formal || formal.id !== decisionId)
            assistantFailure('STALE_DECISION');
        // Authority follows the committed formal record, including cross-Session origins.
        const origin = p.drafts.find(d => d.id === formal.draft_id && d.version === formal.draft_version) ?? (await store.findFormalDraft(formal.id, p.source.owner));
        const draft: AssistantDraft = { id: randomUUID(), version: 1, session_id: id, attempt_id: origin.attempt_id, manual_base_id: formal.id, source_revision: p.source.owner.revision_id, baseline_decision_id: formal.id, fields: structuredClone(formal.fields), status: 'pending', edited: true, created_at: now(), decided_at: null, reason: 'manual_revision' };
        await store.saveDraft(draft);
        return read(id);
    }
    async function cancelRevision(id: string, draftId: string, version: number) { guards(); const p = await read(id), draft = p.drafts.filter(d => d.id === draftId).at(-1); if (!draft?.manual_base_id || draft.status !== 'pending' || draft.version !== version)
        assistantFailure('STALE_DRAFT'); await store.saveDraft({ ...draft, status: 'rejected', decided_at: now(), reason: 'cancelled_manual_revision' }); return read(id); }
    async function reject(id: string, draftId: string, version: number, confirmed: boolean, reason: string) { guards(); if (!confirmed)
        assistantFailure('AUTHORITY_REQUIRED'); const p = await read(id), draft = p.drafts.filter(d => d.id === draftId).at(-1); if (!draft || draft.version !== version || draft.status !== 'pending')
        assistantFailure('STALE_DRAFT'); await store.saveDraft({ ...draft, status: 'rejected', decided_at: now(), reason }); return read(id); }
    async function adopt(id: string, draftId: string, version: number, actor: string, commandId: string) { guards(); const p = await read(id); await store.adopt({ command_id: commandId, draft_id: draftId, draft_version: version, session_id: id, actor, at: now(), source: p.source }); return read(id); }
    async function closeSession(id: string) { sessionEpochs.set(id,(sessionEpochs.get(id)??0)+1);for(const [key,preview]of previews)if(preview.session===id)previews.delete(key);pendingStarts.get(id)?.abort(); const c = live.get(id); if (c)
        await settle(c, 'Interrupted', 'session_closed'); }
    async function close() { closed = true;previews.clear();for(const pending of pendingStarts.values())pending.abort(); await Promise.all([...live.values()].map(c => settle(c, 'Interrupted', 'application_closed'))); }
    async function reopen() { await store.interruptAll(now()); }
    return { source: store.readSource, read, link, list, prepare, start, send, stop, edit, revise, cancelRevision, reject, adopt, closeSession, close, reopen };
}
