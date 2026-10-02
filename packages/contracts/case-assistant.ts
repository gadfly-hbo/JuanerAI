import type {CollaborationRequest,ChildAuthorization,ChildResultValue} from './case-collaboration.ts';
import type { OwnerRef, DecisionCandidateInput } from './xanthil-desktop-ipc.ts';
export type MembershipOrigin = Readonly<{version:'1.0';task_id:string;prepared_sha256:string}>;
export type AssistantSource = Readonly<{
    membership_origin?: MembershipOrigin;
    owner: OwnerRef;
    case_name: string;
    current_revision_id: string;
    eligible: boolean;
    missing: readonly string[];
    row_version: string;
    finding_id: string;
    acceptance_id: string;
    closure_id: string;
    evidence_refs: readonly string[];
    limitations: readonly string[];
    candidates: readonly DecisionCandidateInput[];
    finding_summary: string;
    aggregate: Readonly<{
        artifact_id: string;
        sha256: string;
        fields: readonly string[];
        scope: string;
        content: string;
    }>;
    report: Readonly<{
        report_id: string;
        version: number;
        sha256: string;
        summary: string;
    }>;
}>;
export type OutcomeFields = Readonly<{
    applicable: boolean;
    baseline: string;
    baseline_source: string;
    observation_object: string;
    metric: string;
    expectation: string;
    observation_window: string;
    guardrails: string;
    result_source: string;
    result_owner: string;
    assessment: string;
    assessment_owner: string;
    not_applicable_reason: string;
    reassess_trigger: string;
    reassess_owner: string;
}>;
export type DecisionFields = Readonly<{
    choice: 'candidate' | 'no_action' | 'defer';
    candidate_id: string | null;
    rationale: string;
    owner: string;
    confirmed_at: string;
    evidence_refs: readonly string[];
    finding_refs: readonly string[];
    alternatives: string;
    limitations: string;
    defer_trigger: string;
    defer_owner: string;
    outcome: OutcomeFields;
}>;
export type AssistantLimits = Readonly<{
    turns: number;
    execution_ms: number;
    waiting_ms: number;
    cost_microunits: number;
    turn_cost_microunits: number;
    currency: string;
}>;
export type AssistantConfig = Readonly<{
    provider: string;
    model: string;
    authorized: boolean;
    limits: AssistantLimits;
    runtime_id: string;
    runtime_version: string;
    adapter_version: string;
}>;
export const ASSISTANT_TOOLS = ['read_case', 'read_evidence', 'read_candidates', 'read_aggregate', 'read_report'] as const;
export type AssistantTool = typeof ASSISTANT_TOOLS[number];
export type AssistantStatus = 'Running' | 'Waiting' | 'Succeeded' | 'Stopped' | 'Interrupted' | 'WaitExpired' | 'TimedOut' | 'BudgetExhausted' | 'Failed';
export type AssistantEvent = Readonly<{
    id: string;
    attempt_id: string;
    at: string;
    kind: 'user' | 'advice' | 'question' | 'tool' | 'payload' | 'status';
    text: string;
    tool: AssistantTool | null;
    status: string;
    source_revision: string;
}>;
export type MembershipAuthorization={version:'1.0';task_id:string;source_sha256:string;profile:import('../product-core/member-task.ts').TaskResourceProfile;purpose:'assistant'|'fork'|'subagent';session_id:string;created_at:string;expires_at:string;usage:{calls:number;output_tokens:number;active_ms:number;wait_ms:number;local_runs:number;unresolved:number}};
export type Authorization = Readonly<{
    membership?: MembershipAuthorization;
    collaboration?:ChildAuthorization;
    id: string;
    source: AssistantSource;
    baseline_decision_id: string | null;
    config: AssistantConfig | null;
    initial_text: string;
    selected_history: readonly AssistantEvent[];
    selected_reports: readonly Readonly<{
        id: string;
        summary: string;
    }>[];
    tools: readonly AssistantTool[];
    categories: readonly string[];
    skill_version: '1.0'|'1.1';
    prompt_version: '1.0'|'1.1';
    created_at: string;
    payload: string;
    blockers: readonly string[];
}>;
export type AssistantAttempt = Readonly<{
    id: string;
    session_id: string;
    authorization: Authorization;
    status: AssistantStatus;
    started_at: string;
    ended_at: string | null;
    waiting_deadline: string | null;
    turns: number;
    execution_ms: number;
    cost_microunits: number;
    reason: string | null;
}>;
export type AssistantDraft = Readonly<{
    manual_base_id?: string;
    id: string;
    version: number;
    session_id: string;
    attempt_id: string;
    source_revision: string;
    baseline_decision_id: string | null;
    fields: DecisionFields;
    status: 'pending' | 'rejected' | 'adopted';
    edited: boolean;
    created_at: string;
    decided_at: string | null;
    reason: string | null;
}>;
export type MembershipDecisionFields = Omit<DecisionFields,'outcome'> & {outcome:OutcomeFields & {dependencies:string;guardrail_applicable:boolean;guardrail_not_applicable_reason:string}};
export type FormalDecision = Readonly<{
    id: string;
    outcome_id: string;
    report_id: string;
    sequence: number;
    source: OwnerRef;
    source_report_id: string;
    previous_id: string | null;
    fields: DecisionFields;
    actor: string;
    adopted_at: string;
}> & ({draft_id:string;draft_version:number;origin?:never}|{draft_id?:never;draft_version?:never;origin:{kind:'membership_review';task_id:string;review_id:string;review_version:number;intent_id:string}});
export type AssistantReport = Readonly<{
    id: string;
    decision_id: string;
    source_revision: string;
    sequence: number;
    original_report_id: string;
    markdown: string;
    html: string;
    markdown_sha256: string;
    html_sha256: string;
    created_at: string;
}>;
export type AssistantSession = Readonly<{
    id: string;
    title: string;
    source: OwnerRef;
    created_at: string;
    archived: boolean;
}>;
export type AssistantProjection = Readonly<{
    version: '1.0';
    session: AssistantSession;
    source: AssistantSource;
    attempts: readonly AssistantAttempt[];
    events: readonly AssistantEvent[];
    drafts: readonly AssistantDraft[];
    decisions: readonly FormalDecision[];
    reports: readonly AssistantReport[];
    current_decision_id: string | null;
}>;
export type AssistantTurn = Readonly<{
    retained_membership?:{version:'1.0'};
    membership?:Readonly<{version:'1.0';purpose?:'comment'}>;
    collaboration?:Readonly<{contract_version:'1.1';purpose:'fork'|'subagent'}>;
    payload: string;
    provider: string;
    model: string;
    signal: AbortSignal;
    cost_reservation_microunits: number;
}>;
export type AssistantTurnResult = Readonly<{membership_usage?:Readonly<{output_tokens:number}>;
    provider: string;
    model: string;
    cost_microunits: number;
    output: ChildResultValue | Readonly<{
        kind: 'advice' | 'question';
        text: string;
    }> | Readonly<{
        kind: 'tool';
        tool: AssistantTool;
        revision_id: string;
    }> | Readonly<{
        kind: 'draft';
        fields: DecisionFields;
    }>;
}>;
export type CaseAssistantRequest = Readonly<{
    version: '1.0';
}> & (Readonly<{
    operation: 'list';
    project_id: string;
}> | Readonly<{
    operation: 'source';
    owner: OwnerRef;
}> | Readonly<{
    operation: 'link';
    owner: OwnerRef;
    title: string;
    command_id: string;
}> | Readonly<{
    operation: 'read' | 'stop' | 'close';
    session_id: string;
}> | Readonly<{
    operation: 'prepare';
    session_id: string;
    text: string;
    history_ids: readonly string[];
    report_ids: readonly string[];
    rebase: boolean;
}> | Readonly<{
    operation: 'start';
    session_id: string;
    authorization_id: string;
    free_text_confirmed: boolean;
}> | Readonly<{
    operation: 'send';
    session_id: string;
    text: string;
}> | Readonly<{
    operation: 'revise';
    session_id: string;
    decision_id: string;
}> | Readonly<{
    operation: 'cancel_revision';
    session_id: string;
    draft_id: string;
    draft_version: number;
}> | Readonly<{
    operation: 'edit';
    session_id: string;
    draft_id: string;
    draft_version: number;
    fields: DecisionFields;
}> | Readonly<{
    operation: 'reject';
    session_id: string;
    draft_id: string;
    draft_version: number;
    confirmed: boolean;
    reason: string;
}> | Readonly<{
    operation: 'adopt';
    session_id: string;
    draft_id: string;
    draft_version: number;
    actor: string;
    command_id: string;
}> | Readonly<{
    operation: 'export';
    session_id: string;
    report_id: string;
    command_id: string;
}>);
export type CaseAssistantResult<T> = Readonly<{
    ok: true;
    value: T;
}> | Readonly<{
    ok: false;
    error: {
        code: string;
        message: string;
    };
}>;
export interface CaseAssistantApi {
    request<T>(input: CaseAssistantRequest|CollaborationRequest): Promise<CaseAssistantResult<T>>;
}
export function validateCaseAssistantRequest(input: unknown): CaseAssistantRequest {
    const fail = (): never => { throw Object.assign(new Error('INVALID_REQUEST'), { code: 'INVALID_REQUEST' }); };
    if (!input || typeof input !== 'object' || Array.isArray(input))
        fail();
    const r = input as Record<string, unknown>;
    const keys: Record<string, string[]> = { list: ['project_id'], source: ['owner'], link: ['owner', 'title', 'command_id'], read: ['session_id'], stop: ['session_id'], close: ['session_id'], prepare: ['session_id', 'text', 'history_ids', 'report_ids', 'rebase'], start: ['session_id', 'authorization_id', 'free_text_confirmed'], send: ['session_id', 'text'], revise: ['session_id', 'decision_id'], cancel_revision: ['session_id', 'draft_id', 'draft_version'], edit: ['session_id', 'draft_id', 'draft_version', 'fields'], reject: ['session_id', 'draft_id', 'draft_version', 'confirmed', 'reason'], adopt: ['session_id', 'draft_id', 'draft_version', 'actor', 'command_id'], export: ['session_id', 'report_id', 'command_id'] };
    const fields = keys[String(r.operation)];
    if (r.version !== '1.0' || !fields || Object.keys(r).sort().join('|') !== ['version', 'operation', ...fields].sort().join('|'))
        fail();
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (const key of fields) {
        const value = r[key];
        if (key.endsWith('_id') && (typeof value !== 'string' || !uuid.test(value)))
            fail();
        if (['title', 'text', 'reason', 'actor'].includes(key) && typeof value !== 'string')
            fail();
        if (['rebase', 'free_text_confirmed', 'confirmed'].includes(key) && typeof value !== 'boolean')
            fail();
        if (key === 'draft_version' && (!Number.isSafeInteger(value) || Number(value) < 1))
            fail();
        if (key.endsWith('_ids') && (!Array.isArray(value) || value.some(v => typeof v !== 'string' || !uuid.test(v))))
            fail();
    }
    if ('owner' in r) {
        const o = r.owner;
        if (!o || typeof o !== 'object' || Array.isArray(o) || Object.keys(o).sort().join('|') !== 'case_id|project_id|revision_id|session_id' || Object.values(o).some(v => typeof v !== 'string' || !uuid.test(v)))
            fail();
    }
    return structuredClone(input) as CaseAssistantRequest;
}
