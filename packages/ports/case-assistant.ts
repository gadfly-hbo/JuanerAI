import type { AssistantSource, AssistantSession, AssistantAttempt, AssistantEvent, AssistantDraft, FormalDecision, AssistantReport, AssistantTurn, AssistantTurnResult } from '../contracts/case-assistant.ts';
import type { OwnerRef } from '../contracts/xanthil-desktop-ipc.ts';
export type AssistantHistory = Readonly<{
    session: AssistantSession;
    attempts: readonly AssistantAttempt[];
    events: readonly AssistantEvent[];
    drafts: readonly AssistantDraft[];
}>;
export interface CaseAssistantStore {
    readSource(owner: OwnerRef): Promise<AssistantSource>;
    listSessions(projectId: string): Promise<readonly AssistantSession[]>;
    createSession(commandId: string, session: AssistantSession, source: AssistantSource): Promise<AssistantSession>;
    readSession(id: string): Promise<AssistantHistory>;
    saveAttempt(attempt: AssistantAttempt): Promise<void>;
    appendEvent(sessionId: string, event: AssistantEvent, signal?: AbortSignal): Promise<void>;
    saveDraft(draft: AssistantDraft, signal?: AbortSignal): Promise<void>;
    findFormalDraft(decisionId: string, owner: OwnerRef): Promise<AssistantDraft>;
    formalHistory(source: OwnerRef): Promise<Readonly<{
        decisions: readonly FormalDecision[];
        reports: readonly AssistantReport[];
    }>>;
    adopt(input: Readonly<{
        command_id: string;
        draft_id: string;
        draft_version: number;
        session_id: string;
        actor: string;
        at: string;
        source: AssistantSource;
    }>): Promise<FormalDecision>;
    interruptAll(at: string): Promise<void>;
}
export interface CaseAssistantRuntime {
    turn(input: AssistantTurn): Promise<AssistantTurnResult>;
}
