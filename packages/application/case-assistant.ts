import {createLocalModelAccess} from './provider-settings.ts';
import {isDeepStrictEqual} from 'node:util';
import {validateChildResult} from '../product-core/case-collaboration.ts';
import type {ChildPreview,ChildKind,CollaborationProjection,CollaborationReference,ResultTarget,ParentCollaborationProjection} from '../contracts/case-collaboration.ts';
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
    const access=input.modelAccess??createLocalModelAccess(!!config?.authorized);
    type Live = {
        attempt: AssistantAttempt;
        abort: AbortController;
        timer: ReturnType<typeof setTimeout> | null;
        busy: boolean;
        release?: () => void;
    };
    const live = new Map<string, Live>();
    const pendingStarts = new Map<string, AbortController>();
    let closed = false, closeComplete = false;
    const sessionEpochs=new Map<string,number>(),closedSessions=new Set<string>(),usedSessions=new Set<string>();
    const now = () => clock().toISOString();
    function guards() { if (closed)
        assistantFailure('INTERRUPTED'); }
    async function read(id: string): Promise<AssistantProjection> { usedSessions.add(id);const h = await store.readSession(id), source = await store.readSource(h.session.source), f = await store.formalHistory(h.session.source); return { version: '1.0', ...h, source, ...f, current_decision_id: f.decisions.at(-1)?.id ?? null }; }
    async function link(owner: OwnerRef, title: string, commandId: string) { guards(); const source = await store.readSource(owner); if (!source.eligible)
        assistantFailure('SOURCE_INELIGIBLE'); const session = await store.createSession(commandId, { id: randomUUID(), title, source: owner, created_at: now(), archived: false }, source); return read(session.id); }
    async function list(projectId: string) { return store.listSessions(projectId); }
    const childPreviews=new Map<string,ChildPreview>();
    const childCreates=new Map<string,{parent:string;abort:AbortController}>();
    async function readCollaboration(id:string):Promise<CollaborationProjection>{
        const relation=await store.readChild(id);if(!relation)assistantFailure('NOT_FOUND');
        const results=await store.childResults(id);const h=await store.readSession(id),current=await read(id),lifecycle=await store.readLifecycle(id),parent_lifecycle=await store.readLifecycle(relation.parent_session_id);return {version:'1.1',lifecycle,parent_lifecycle,current_source:current.source,current_decision_id:current.current_decision_id,occupant:access.occupant?.()??null,deliveries:(await store.readParentCollaboration(relation.parent_session_id)).deliveries.filter(d=>results.some(r=>r.id===d.result_id)),valid:current.source.eligible&&isDeepStrictEqual(current.source,relation.source)&&current.current_decision_id===relation.baseline_decision_id,session:h.session,relation,attempts:h.attempts,events:h.events,results};
    }
    function collaborationIdle(){
        guards();if(access.occupant?.())assistantFailure('MODEL_BUSY');if(pendingStarts.size||[...live.values()].some(c=>['Running','Waiting'].includes(c.attempt.status)))assistantFailure('BUSY');
    }
    async function prepareChild(id:string,kind:ChildKind,task:string,cutoffId:string|null,historyIds:readonly string[],reportIds:readonly string[],includeAggregate:boolean):Promise<ChildPreview>{
        collaborationIdle();const epoch=sessionEpochs.get(id)??0;if(closedSessions.has(id))assistantFailure('SESSION_CLOSED');const life=await store.readLifecycle(id);if(!life.open)assistantFailure('SESSION_CLOSED');
        if(await store.readChild(id))assistantFailure('FORBIDDEN');
        const p=await read(id);if(!p.source.eligible)assistantFailure('SOURCE_INELIGIBLE');
        if(!assistantText(task)||!['fork','subagent'].includes(kind))assistantFailure('INVALID_REQUEST');
        const visible=p.events.filter(e=>['user','advice','question','tool'].includes(e.kind));
        const cutoff=cutoffId===null?-1:visible.findIndex(e=>e.id===cutoffId);
        if(kind==='fork'&&cutoff<0||cutoffId!==null&&cutoff<0)assistantFailure('INVALID_CUTOFF');
        const allowed=cutoffId===null?visible:visible.slice(0,cutoff+1);
        const selected=allowed.filter(e=>historyIds.includes(e.id));
        if(new Set(historyIds).size!==historyIds.length||selected.length!==historyIds.length||selected.some(e=>e.source_revision!==p.source.owner.revision_id))assistantFailure('FORBIDDEN');
        const available=[{id:p.source.report.report_id,summary:p.source.report.summary},...p.reports.map(r=>({id:r.id,summary:JSON.stringify(p.decisions.find(d=>d.id===r.decision_id))}))];
        const reports=available.filter(r=>reportIds.includes(r.id));
        if(new Set(reportIds).size!==reportIds.length||reports.length!==reportIds.length)assistantFailure('FORBIDDEN');
        collaborationIdle();if(epoch!==(sessionEpochs.get(id)??0))assistantFailure('INTERRUPTED');
        const preview:ChildPreview={id:randomUUID(),parent_session_id:id,kind,task,cutoff_id:cutoffId,source:p.source,baseline_decision_id:p.current_decision_id,selected_history:selected,selected_reports:reports,aggregate:includeAggregate?p.source.aggregate:null,parent_epoch:life.epoch,created_at:now()};
        childPreviews.set(preview.id,preview);return structuredClone(preview);
    }
    async function createChild(id:string,previewId:string,commandId:string,confirmed:boolean){
        collaborationIdle();if(!confirmed)assistantFailure('AUTHORITY_REQUIRED');
        const preview=childPreviews.get(previewId);if(!preview||preview.parent_session_id!==id)assistantFailure('AUTHORITY_REQUIRED');
        if(closedSessions.has(id))assistantFailure('INTERRUPTED');const life=await store.readLifecycle(id);if(!life.open||preview.parent_epoch!==life.epoch)assistantFailure('INTERRUPTED');
        const p=await read(id);
        if(JSON.stringify(p.source)!==JSON.stringify(preview.source)||p.current_decision_id!==preview.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        collaborationIdle();const abort=new AbortController();if(closedSessions.has(id))assistantFailure('INTERRUPTED');childCreates.set(commandId,{parent:id,abort});
        try{const relation=await store.createChild(commandId,{id:randomUUID(),title:preview.task,source:preview.source.owner,created_at:now(),archived:false},preview,abort.signal,collaborationIdle);return readCollaboration(relation.child_session_id);}
        finally{childCreates.delete(commandId);}
    }
    async function prepare(id: string, text: string, historyIds: readonly string[] = [], reportIds: readonly string[] = [], rebase = false): Promise<Authorization> {
        guards();
        if(closedSessions.has(id))assistantFailure('SESSION_CLOSED');
        const epoch=sessionEpochs.get(id)??0;
        if(!(await store.readLifecycle(id)).open)assistantFailure('SESSION_CLOSED');
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
        const accessSnapshot=access.snapshot();
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
    const localPublications=new Map<AbortController,readonly string[]>();
    async function readParent(id:string):Promise<ParentCollaborationProjection>{const p=await read(id),state=await store.readParentCollaboration(id);const activity=await Promise.all(state.children.map(async child=>({session_id:child.child_session_id,status:(await store.readSession(child.child_session_id)).attempts.at(-1)?.status??null,open:(await store.readLifecycle(child.child_session_id)).open})));return {...state,activity,occupant:access.occupant?.()??null,lifecycle:await store.readLifecycle(id),source:p.source,current_decision_id:p.current_decision_id};}
    async function returnResult(id:string,target:ResultTarget,commandId:string){return deliverResult(id,target,commandId);}
    async function deliverResult(id:string,target:ResultTarget,commandId:string,continuation?:AbortSignal){
        guards();const epochs=new Map(sessionEpochs),c=new AbortController();localPublications.set(c,[id]);
        const cancel=()=>c.abort();continuation?.addEventListener('abort',cancel,{once:true});if(continuation?.aborted)c.abort();
        try{const relation=await store.readChild(id);if(!relation)assistantFailure('FORBIDDEN');localPublications.set(c,[id,relation.parent_session_id]);if((epochs.get(id)??0)!==(sessionEpochs.get(id)??0)||(epochs.get(relation.parent_session_id)??0)!==(sessionEpochs.get(relation.parent_session_id)??0))c.abort();
            const p=await read(id);if(!isDeepStrictEqual(p.source,relation.source)||p.current_decision_id!==relation.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
            try{return await store.returnChild(id,target,commandId,now(),p.source,c.signal);}
            catch(error){if(!c.signal.aborted)await store.failChildReturn(id,target,c.signal);throw error;}
        }finally{continuation?.removeEventListener('abort',cancel);localPublications.delete(c);}
    }
    async function reviewResult(id:string,target:ResultTarget,commandId:string,disposition:'adopted'|'declined',reason:string,confirmed:boolean){
        guards();if(!confirmed)assistantFailure('AUTHORITY_REQUIRED');const c=new AbortController();localPublications.set(c,[id]);
        try{const p=await read(id);return await store.reviewChild(id,target,commandId,disposition,reason,now(),p.source,c.signal);}finally{localPublications.delete(c);}
    }
    async function prepareParent(id:string,text:string,historyIds:readonly string[],reportIds:readonly string[],materialIds:readonly string[],rebase:boolean){
        guards();const epoch=sessionEpochs.get(id)??0;
        if(await store.readChild(id))assistantFailure('FORBIDDEN');
        const state=await readParent(id),selected=state.materials.filter(m=>materialIds.includes(m.id));
        if(new Set(materialIds).size!==materialIds.length||selected.length!==materialIds.length)assistantFailure('FORBIDDEN');
        for(const material of selected)if(!isDeepStrictEqual(material.result.source,state.source)||material.result.baseline_decision_id!==state.current_decision_id)assistantFailure('AUTHORIZATION_STALE');
        if(epoch!==(sessionEpochs.get(id)??0))assistantFailure('INTERRUPTED');
        const a=await prepare(id,text,historyIds,reportIds,rebase);
        if(epoch!==(sessionEpochs.get(id)??0)){previews.delete(a.id);assistantFailure('INTERRUPTED');}
        const preview=previews.get(a.id)!;
        if(!isDeepStrictEqual(a.source,state.source)||a.baseline_decision_id!==state.current_decision_id)assistantFailure('AUTHORIZATION_STALE');
        const materials=selected.map(m=>({id:m.id,classification:m.classification,review:m.review,result:{id:m.result.id,child_session_id:m.result.child_session_id,attempt_id:m.result.attempt_id,version:m.result.version,sha256:m.result.sha256,source:m.result.source.owner,value:m.result.value}}));
        const authorization:Authorization={...a,payload:JSON.stringify({...JSON.parse(a.payload),selected_materials:materials}),categories:[...a.categories,...(materials.length?['selected_MODEL_user_adopted_material']:[])]};
        previews.set(a.id,{...preview,authorization});return structuredClone(authorization);
    }
    async function prepareCollaboration(id:string,text:string,historyIds:readonly string[],resultIds:readonly string[]):Promise<Authorization>{
        const epoch=sessionEpochs.get(id)??0;
        const relation=await store.readChild(id);if(!relation)assistantFailure('FORBIDDEN');
        const parentEpoch=sessionEpochs.get(relation.parent_session_id)??0;
        const parentLife=await store.readLifecycle(relation.parent_session_id),childLife=await store.readLifecycle(id);if(!parentLife.open||!childLife.open||closedSessions.has(id)||closedSessions.has(relation.parent_session_id))assistantFailure('SESSION_CLOSED');
        const p=await read(id);if(!p.source.eligible||!isDeepStrictEqual(p.source,relation.source)||p.current_decision_id!==relation.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        const saved=await store.childResults(id),selectedResults=saved.filter(r=>resultIds.includes(r.id));
        if(new Set(resultIds).size!==resultIds.length||selectedResults.length!==resultIds.length)assistantFailure('FORBIDDEN');
        const a=await prepare(id,text,historyIds,[],false),snapshot=previews.get(a.id)!;
        const refs:CollaborationReference[]=[];
        const ref=(kind:CollaborationReference['kind'],id:string,version:number|null=null,sha256:string|null=null)=>refs.push({kind,id,revision_id:p.source.owner.revision_id,version,sha256});
        ref('case',p.source.owner.case_id);
        if(relation.aggregate){for(const id of p.source.evidence_refs)ref('evidence',id);ref('finding',p.source.finding_id);for(const c of p.source.candidates)ref('candidate',c.candidate_id);ref('aggregate',relation.aggregate.artifact_id,null,relation.aggregate.sha256);}
        for(const r of relation.selected_reports){const formal=p.reports.find(v=>v.id===r.id);ref('report',r.id,formal?.sequence??p.source.report.version,formal?.markdown_sha256??p.source.report.sha256);}
        for(const e of [...relation.selected_history,...a.selected_history])ref('history',e.id);
        for(const r of selectedResults)ref('result',r.id,r.version,r.sha256);
        const tools=ASSISTANT_TOOLS.filter(t=>t==='read_case'||t==='read_report'&&relation.selected_reports.length>0||relation.aggregate!==null&&['read_evidence','read_candidates','read_aggregate'].includes(t));
        const collaboration={kind:relation.kind,child_session_id:id,parent_session_id:relation.parent_session_id,parent_epoch:parentLife.epoch,child_epoch:childLife.epoch,allowed_references:refs,selected_results:selectedResults};
        const context={contract_version:'1.1',task:relation.task,source:{owner:p.source.owner,case_name:p.source.case_name},formal_baseline_id:relation.baseline_decision_id,inherited_history:relation.selected_history,selected_history:a.selected_history,selected_results:selectedResults.map(r=>({id:r.id,version:r.version,sha256:r.sha256,attempt_id:r.attempt_id,value:r.value})),selected_reports:relation.selected_reports,aggregate:relation.aggregate,business_projection:relation.aggregate?{finding_id:p.source.finding_id,evidence_refs:p.source.evidence_refs,finding_summary:p.source.finding_summary,candidates:p.source.candidates,limitations:p.source.limitations}:null,initial_text:text,allowed_references:refs,tools,skill:'有界子对话 v1.1',prompt_version:'1.1'};
        const authorization:Authorization={...a,baseline_decision_id:relation.baseline_decision_id,collaboration,selected_reports:relation.selected_reports,tools,skill_version:'1.1',prompt_version:'1.1',payload:JSON.stringify(context),categories:['user_authored_text','selected_parent_history','selected_own_history','selected_own_results',...(relation.aggregate?['approved_020_clean_subset','accepted_evidence_finding']:[]),...(relation.selected_reports.length?['selected_report_summary']:[])]};
        const latestParent=await store.readLifecycle(relation.parent_session_id),latestChild=await store.readLifecycle(id);
        guards();
        if(epoch!==(sessionEpochs.get(id)??0)||parentEpoch!==(sessionEpochs.get(relation.parent_session_id)??0)||closedSessions.has(id)||closedSessions.has(relation.parent_session_id)||!latestParent.open||!latestChild.open||latestParent.epoch!==parentLife.epoch||latestChild.epoch!==childLife.epoch){previews.delete(a.id);assistantFailure('INTERRUPTED');}
        if(!isDeepStrictEqual(a.source,p.source)||a.baseline_decision_id!==p.current_decision_id){previews.delete(a.id);assistantFailure('AUTHORIZATION_STALE');}
        previews.set(a.id,{...snapshot,authorization});return structuredClone(authorization);
    }
    async function event(control: Live, kind: AssistantEvent['kind'], text: string, status = 'completed', tool: AssistantEvent['tool'] = null) { await store.appendEvent(control.attempt.session_id, { id: randomUUID(), attempt_id: control.attempt.id, at: now(), kind, text, tool, status, source_revision: control.attempt.authorization.source.owner.revision_id }, kind === 'status' ? undefined : control.abort.signal); }
    async function settle(control: Live, status: AssistantStatus, reason: string | null) { if (control.timer)
        clearTimeout(control.timer); control.timer = null; control.abort.abort(); if (!['Running', 'Waiting'].includes(control.attempt.status))
        return; control.attempt = { ...control.attempt, status, reason, ended_at: now(), waiting_deadline: null }; try {
            try{await store.saveAttempt(control.attempt);}catch(error){
                if(!control.attempt.authorization.collaboration)throw error;
                const saved=(await store.readSession(control.attempt.session_id)).attempts.find(a=>a.id===control.attempt.id);
                const result=(await store.childResults(control.attempt.session_id)).find(r=>r.attempt_id===control.attempt.id);
                if(saved?.status!=='Succeeded'||!result)throw error;
                control.attempt=saved;return;
            }
            await event(control, 'status', reason ?? status, status);
        } finally { control.release?.(); control.release=undefined; } }
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
        lease=await access.acquire(preview.generation!,{session_id:id,label:a.collaboration?(a.collaboration.kind==='fork'?'Fork':'Subagent'):'Case Assistant'});
        if(pending.signal.aborted||closed)return read(id);
        const p = await read(id);
        if(!(await store.readLifecycle(id)).open)assistantFailure('SESSION_CLOSED');
        if(a.collaboration){const parentLife=await store.readLifecycle(a.collaboration.parent_session_id),childLife=await store.readLifecycle(id);if(!parentLife.open||!childLife.open||parentLife.epoch!==a.collaboration.parent_epoch||childLife.epoch!==a.collaboration.child_epoch)assistantFailure('AUTHORIZATION_STALE');}
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
                const output = await Promise.race([runtime!.turn({ payload, provider: c.provider, model: c.model, signal: control.abort.signal, cost_reservation_microunits: limits.turn_cost_microunits,...(a.collaboration?{collaboration:{contract_version:'1.1' as const,purpose:a.collaboration.kind}}:{}) }), timeout, aborted]);
                if (control.timer)
                    clearTimeout(control.timer);
                control.timer = null;
                if (control.abort.signal.aborted)
                    return;
                if(a.collaboration){
                    const latest=await read(control.attempt.session_id);
                    if(control.abort.signal.aborted)return;
                    if(!latest.source.eligible||!isDeepStrictEqual(latest.source,a.source)||latest.current_decision_id!==a.baseline_decision_id){
                        await settle(control,'Failed','source_or_decision_changed');return;
                    }
                }
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
                if(a.collaboration&&o.kind!=='question'&&o.kind!=='tool'&&o.kind!=='result')assistantFailure('CHILD_PROTOCOL_INVALID');
                if(o.kind==='result'){
                    if(!a.collaboration)assistantFailure('CHILD_RESULT_INVALID');
                    const value=validateChildResult(o,a.collaboration.allowed_references);
                    const ended:AssistantAttempt={...control.attempt,status:'Succeeded',reason:null,ended_at:now(),waiting_deadline:null};
                    const result=await store.finishChild(ended,value,control.abort.signal);
                    control.attempt=ended;control.release?.();control.release=undefined;
                    try{
                        await event(control,'status','Succeeded','Succeeded');
                        if(a.collaboration.kind==='subagent'&&!control.abort.signal.aborted)await deliverResult(control.attempt.session_id,{result_id:result.id,result_version:result.version,result_sha256:result.sha256},randomUUID(),control.abort.signal);
                    }finally{control.abort.abort();}
                    return;
                }
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
                    toolResult = o.tool === 'read_case' ? { owner: s.owner, case_name: s.case_name,...(!a.collaboration||a.tools.includes('read_evidence')?{limitations:s.limitations}:{}) } : o.tool === 'read_evidence' ? { finding_id: s.finding_id, evidence_refs: s.evidence_refs, summary: s.finding_summary } : o.tool === 'read_candidates' ? s.candidates : o.tool === 'read_aggregate' ? s.aggregate : a.selected_reports;
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
    async function closeSession(id:string,explicitClose=false){
        const ids=new Set([id,...[...previews.values()].filter(p=>p.authorization.collaboration?.parent_session_id===id).map(p=>p.session),...[...live.values()].filter(c=>c.attempt.authorization.collaboration?.parent_session_id===id).map(c=>c.attempt.session_id)]),at=now();
        for(const sessionId of ids){closedSessions.add(sessionId);sessionEpochs.set(sessionId,(sessionEpochs.get(sessionId)??0)+1);pendingStarts.get(sessionId)?.abort();const c=live.get(sessionId);if(c){if(['Running','Waiting'].includes(c.attempt.status))c.attempt={...c.attempt,status:'Interrupted',ended_at:at,waiting_deadline:null,reason:'session_closed'};c.abort.abort();if(c.timer)clearTimeout(c.timer);c.timer=null;}}
        for(const [key,preview]of previews)if(ids.has(preview.session)||preview.authorization.collaboration?.parent_session_id===id)previews.delete(key);
        for(const [key,preview]of childPreviews)if(ids.has(preview.parent_session_id))childPreviews.delete(key);
        for(const c of childCreates.values())if(ids.has(c.parent))c.abort.abort();
        for(const [c,owners]of localPublications)if(owners.some(owner=>ids.has(owner)))c.abort();
        try{const saved=await store.closeFamily(id,at,explicitClose);for(const sessionId of saved){closedSessions.add(sessionId);const c=live.get(sessionId);if(c&&['Running','Waiting'].includes(c.attempt.status))c.attempt={...c.attempt,status:'Interrupted',ended_at:at,waiting_deadline:null,reason:'session_closed'};
            // Legacy sessions have no durable close state. Keep their fresh-prepare
            // behavior while the incremented process epoch invalidates old grants.
            if((await store.readLifecycle(sessionId)).open)closedSessions.delete(sessionId);
        }}
        finally{for(const sessionId of ids){const c=live.get(sessionId);c?.release?.();if(c)c.release=undefined;}}
    }
    async function reopenSession(id:string,epoch:number){guards();const state=await store.reopenSession(id,epoch);closedSessions.delete(id);sessionEpochs.set(id,(sessionEpochs.get(id)??0)+1);return state;}
    async function close(){if(closeComplete)return;closed=true;previews.clear();childPreviews.clear();for(const pending of pendingStarts.values())pending.abort();for(const c of childCreates.values())c.abort.abort();for(const c of localPublications.keys())c.abort();for(const id of usedSessions)await closeSession(id);closeComplete=true;}
    async function reopen() { await store.interruptAll(now()); }
    return { occupant:()=>access.occupant?.()??null,lifecycle:store.readLifecycle,reopenSession,prepareParent,readParent,returnResult,reviewResult,prepareCollaboration,isChild:async(id:string)=>!!await store.readChild(id),hasWork:(id?:string)=>id?pendingStarts.has(id)||!!live.get(id)&&['Running','Waiting'].includes(live.get(id)!.attempt.status):pendingStarts.size>0||[...live.values()].some(c=>['Running','Waiting'].includes(c.attempt.status)),prepareChild,createChild,readCollaboration,source: store.readSource, read, link, list, prepare, start, send, stop, edit, revise, cancelRevision, reject, adopt, closeSession, close, reopen };
}
