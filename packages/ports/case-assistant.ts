import type {ChildRelation,ChildPreview,ChildResult,ChildResultValue,ResultTarget,ChildDelivery,ChildReview,ParentCollaboration,CollaborationLifecycle} from '../contracts/case-collaboration.ts';
import type { AssistantSource, AssistantSession, AssistantAttempt, AssistantEvent, AssistantDraft, FormalDecision, AssistantReport, AssistantTurn, AssistantTurnResult } from '../contracts/case-assistant.ts';
import type { OwnerRef } from '../contracts/xanthil-desktop-ipc.ts';
export type AssistantHistory = Readonly<{
    session: AssistantSession;
    attempts: readonly AssistantAttempt[];
    events: readonly AssistantEvent[];
    drafts: readonly AssistantDraft[];
}>;
export interface CaseAssistantStore {
    readLifecycle(id:string):Promise<CollaborationLifecycle>;
    closeFamily(id:string,at:string,explicitClose?:boolean):Promise<readonly string[]>;
    reopenSession(id:string,epoch:number):Promise<CollaborationLifecycle>;
    readParentCollaboration(id:string):Promise<ParentCollaboration>;
    returnChild(id:string,target:ResultTarget,commandId:string,at:string,source:AssistantSource,signal:AbortSignal):Promise<ChildDelivery>;
    failChildReturn(id:string,target:ResultTarget,signal:AbortSignal):Promise<void>;
    reviewChild(id:string,target:ResultTarget,commandId:string,disposition:'adopted'|'declined',reason:string,at:string,source:AssistantSource,signal:AbortSignal):Promise<ChildReview>;
    childResults(id:string):Promise<readonly ChildResult[]>;
    finishChild(attempt:AssistantAttempt,value:ChildResultValue,signal:AbortSignal):Promise<ChildResult>;
    readChild(id:string):Promise<ChildRelation|null>;
    createChild(commandId:string,session:AssistantSession,preview:ChildPreview,signal:AbortSignal,assertAdmission?:()=>void):Promise<ChildRelation>;
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
