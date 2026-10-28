import type {ChildRelation,ChildPreview,ChildResult,ResultTarget,ChildDelivery,ChildReview,ParentCollaboration,CollaborationLifecycle} from '../contracts/case-collaboration.ts';
import type { AssistantSource, AssistantSession, AssistantEvent, AssistantDraft, FormalDecision, AssistantReport, Authorization,DecisionFields } from '../contracts/case-assistant.ts';
import type {OpenTaskIdentity} from './open-analysis-store.ts';
import type {AnalysisAgent} from './analysis-agent.ts';
import type { OwnerRef } from '../contracts/xanthil-desktop-ipc.ts';
export type AssistantHistory = Readonly<{
    session: AssistantSession;
    events: readonly AssistantEvent[];
    drafts: readonly AssistantDraft[];
}>;
/** Immutable business permission/provenance. Runtime progress is never stored here. */
export type CaseBusinessAuthorization=Readonly<{version:'1.0';session_id:string;authorization:Authorization;identity:OpenTaskIdentity;work_id:string;epoch:number}>;
export interface CaseAssistantStore {
    authorizeBusiness(input:{session_id:string;authorization:Authorization;configuration_sha256:string}):Promise<CaseBusinessAuthorization>;
    readBusinessAuthorization(session_id:string,id?:string):Promise<CaseBusinessAuthorization|null>;
    isBusinessAuthorized(id:string):boolean;
    authorizesWork(work_id:string,phase:'bind'|'advance'|'record'|'read'):boolean;
    publishModel(input:{authorization_id:string;result:Awaited<ReturnType<AnalysisAgent['advance']>>;at:string;decision?:DecisionFields;child?:import('../contracts/case-collaboration.ts').ChildResultValue},signal:AbortSignal):Promise<void>;
    readLifecycle(id:string):Promise<CollaborationLifecycle>;
    closeFamily(id:string,at:string,explicitClose?:boolean):Promise<readonly string[]>;
    reopenSession(id:string,epoch:number):Promise<CollaborationLifecycle>;
    readParentCollaboration(id:string):Promise<ParentCollaboration>;
    returnChild(id:string,target:ResultTarget,commandId:string,at:string,source:AssistantSource,signal:AbortSignal):Promise<ChildDelivery>;
    failChildReturn(id:string,target:ResultTarget,signal:AbortSignal):Promise<void>;
    reviewChild(id:string,target:ResultTarget,commandId:string,disposition:'adopted'|'declined',reason:string,at:string,source:AssistantSource,signal:AbortSignal):Promise<ChildReview>;
    childResults(id:string):Promise<readonly ChildResult[]>;
    readChild(id:string):Promise<ChildRelation|null>;
    createChild(commandId:string,session:AssistantSession,preview:ChildPreview,signal:AbortSignal,assertAdmission?:()=>void):Promise<ChildRelation>;
    readSource(owner: OwnerRef): Promise<AssistantSource>;
    listSessions(projectId: string): Promise<readonly AssistantSession[]>;
    createSession(commandId: string, session: AssistantSession, source: AssistantSource, signal?:AbortSignal, assertAdmission?:()=>void): Promise<AssistantSession>;
    /** Read an existing matching link receipt only; never issues/retries a creation or exposes a conflicting intent. */
    readLinkedSession(commandId:string,owner:OwnerRef,title:string):Promise<AssistantSession|null>;
    readSession(id: string): Promise<AssistantHistory>;
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
}
