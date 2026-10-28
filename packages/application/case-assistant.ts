import {sameAutomaticDelegationWork,assertAutomaticDelegationSubset,automaticDelegationProjection,automaticDelegationAggregate} from '../product-core/open-analysis-delegation-instruction.ts';
import {createRetainedMembershipAccess,type RetainedMembershipDependencies} from './member-retained.ts';
import {createLocalModelAccess} from './provider-settings.ts';
import {isDeepStrictEqual} from 'node:util';
import {validateChildResult,childResultParameters,sourceUserQuestion} from '../product-core/case-collaboration.ts';
import type {ChildPreview,ChildKind,CollaborationProjection,CollaborationReference,ResultTarget,ParentCollaborationProjection} from '../contracts/case-collaboration.ts';
import type { LocalModelAccess } from '../ports/provider-settings.ts';
import {taskHash} from '../product-core/member-task.ts';
import { randomUUID } from 'node:crypto';
import type { CaseAssistantStore } from '../ports/case-assistant.ts';
import { ASSISTANT_TOOLS, type AssistantConfig, type AssistantProjection, type AssistantEvent, type AssistantDraft, type Authorization, type DecisionFields } from '../contracts/case-assistant.ts';
import type { OwnerRef } from '../contracts/xanthil-desktop-ipc.ts';
import { assistantFailure, assistantRecord, assistantText, validateAssistantDecision,assistantDecisionParameters } from '../product-core/case-assistant.ts';
import type {AnalysisAgent} from '../ports/analysis-agent.ts';
import type {AnalysisTool} from '../ports/open-analysis-runtime.ts';
export function createCaseAssistantApplication(input: {
    store: CaseAssistantStore;
    config: AssistantConfig | null;
    clock: () => Date;
    modelAccess?: LocalModelAccess;
    membership?:RetainedMembershipDependencies;
    collaborationPolicy?:'open_analysis_v13';
    agent?:AnalysisAgent;
}) {
    const { store, clock } = input, config = structuredClone(input.config), previews = new Map<string, {
        generation?: number;
        session: string;
        authorization: Authorization;
    }>();
    const membership=input.membership?createRetainedMembershipAccess(input.membership,clock,{isAuthorized:id=>store.isBusinessAuthorized(id),revoke:async a=>{if(a.membership)await closeSession(a.membership.session_id,true);}}):null;
    const access=input.modelAccess??createLocalModelAccess(!!config?.authorized);
    let closed = false, closeComplete = false;
    let closing:Promise<void>|undefined;
    // Issued business creations only, not native Session/runtime state. Retain
    // their settlement until close, including an unconfirmed creation ACK.
    const links=new Set<{abort:AbortController;done:Promise<AssistantProjection>}>();
    const sessionEpochs=new Map<string,number>(),closedSessions=new Set<string>(),usedSessions=new Set<string>();
    const now = () => clock().toISOString();
    function guards() { if (closed)
        assistantFailure('INTERRUPTED'); }
    async function read(id: string): Promise<AssistantProjection> { usedSessions.add(id);const h = await store.readSession(id),source = await store.readSource(h.session.source), f = await store.formalHistory(h.session.source),binding=await store.readBusinessAuthorization(id);return { version: '1.0', ...h,events:[...sourceUserQuestion(source,h.session.created_at),...h.events].filter((e,i,all)=>all.findIndex(v=>v.id===e.id)===i),source,...f,current_decision_id:f.decisions.at(-1)?.id??null,last_request:binding?{id:binding.authorization.id,text:binding.authorization.initial_text,at:binding.authorization.created_at}:null,...(binding&&input.agent?{execution:await input.agent.diagnostics(binding.identity,'retained_case')}:{})}; }
    async function link(owner: OwnerRef, title: string, commandId: string) {
        guards();const abort=new AbortController(),done=(async()=>{
            const source=await store.readSource(owner);guards();if(!source.eligible)assistantFailure('SOURCE_INELIGIBLE');
            let session;
            try{session=await store.createSession(commandId,{id:randomUUID(),title,source:owner,created_at:now(),archived:false},source,abort.signal,guards);}
            catch(error){
                // A failed ACK is not proof of no effect. Qualify the existing
                // business receipt without sending another creation command.
                try{const committed=await store.readLinkedSession(commandId,owner,title);if(committed)usedSessions.add(committed.id);}
                catch(readback){throw Object.assign(new Error('RESULT_PENDING'),{code:'RESULT_PENDING',cause:error,readback,link:{commandId,owner,title}});}
                throw error;
            }
            usedSessions.add(session.id);guards();return read(session.id);
        })();
        links.add({abort,done});void done.catch(()=>undefined);return done;
    }
    async function list(projectId: string) { return store.listSessions(projectId); }
    const childPreviews=new Map<string,ChildPreview>();
    const childCreates=new Map<string,{parent:string;abort:AbortController}>();
    async function readCollaboration(id:string):Promise<CollaborationProjection>{
        const relation=await store.readChild(id);if(!relation)assistantFailure('NOT_FOUND');
        const results=await store.childResults(id);const h=await store.readSession(id),current=await read(id),lifecycle=await store.readLifecycle(id),parent_lifecycle=await store.readLifecycle(relation.parent_session_id);return {version:'1.1',lifecycle,parent_lifecycle,current_source:current.source,current_decision_id:current.current_decision_id,occupant:access.occupant?.()??null,deliveries:(await store.readParentCollaboration(relation.parent_session_id)).deliveries.filter(d=>results.some(r=>r.id===d.result_id)),valid:current.source.eligible&&isDeepStrictEqual(current.source,relation.source)&&current.current_decision_id===relation.baseline_decision_id,session:h.session,relation,events:current.events,results,last_request:current.last_request,...(current.execution?{execution:current.execution}:{})};
    }
    function collaborationIdle(queuedAncestors?:ReadonlySet<string>){
        guards();const occupant=access.occupant?.();if(occupant&&(!queuedAncestors||!occupant.session_id||!queuedAncestors.has(occupant.session_id)))assistantFailure('MODEL_BUSY');
    }
    async function prepareChild(id:string,kind:ChildKind,task:string,cutoffId:string|null,historyIds:readonly string[],reportIds:readonly string[],includeAggregate:boolean,creationCommandId?:string,queuedAncestors?:ReadonlySet<string>,automaticInstruction?:import('../contracts/case-collaboration.ts').AutomaticDelegationInstruction):Promise<ChildPreview>{
        collaborationIdle(queuedAncestors);const epoch=sessionEpochs.get(id)??0;if(closedSessions.has(id))assistantFailure('SESSION_CLOSED');const life=await store.readLifecycle(id);if(!life.open)assistantFailure('SESSION_CLOSED');
        const parentRelation=await store.readChild(id);
        assertAutomaticDelegationSubset(parentRelation?.automatic_instruction,automaticInstruction);
        const p=await read(id);if(!p.source.eligible)assistantFailure('SOURCE_INELIGIBLE');
        if(parentRelation&&(input.collaborationPolicy!=='open_analysis_v13'||!p.source.open_origin))assistantFailure('FORBIDDEN');
        if(parentRelation){const visited=new Set<string>();let ancestor:string|null=id;while(ancestor){if(visited.has(ancestor))assistantFailure('INTEGRITY_BLOCKED');visited.add(ancestor);if(!(await store.readLifecycle(ancestor)).open)assistantFailure('PARENT_CLOSED');const relation=await store.readChild(ancestor);if(sameAutomaticDelegationWork(relation?.automatic_instruction,automaticInstruction)||relation&&relation.task.trim().replace(/\s+/g,' ')===task.trim().replace(/\s+/g,' '))assistantFailure('REPEATED_DELEGATION');ancestor=relation?.parent_session_id??null;}}
        if(!assistantText(task)||!['fork','subagent'].includes(kind))assistantFailure('INVALID_REQUEST');
        const created_at=now(),automatic=automaticInstruction?automaticDelegationProjection(automaticInstruction,p.source,created_at):null;
        if(automatic&&task!==automatic.task)assistantFailure('DELEGATION_INSTRUCTION_INVALID');
        const visible=automatic?[automatic.history]:[...(parentRelation?.selected_history??[]),...p.events.filter(e=>['user','advice','question','tool'].includes(e.kind))].filter((e,i,all)=>all.findIndex(v=>v.id===e.id)===i);
        const cutoff=cutoffId===null?-1:visible.findIndex(e=>e.id===cutoffId);
        if(kind==='fork'&&cutoff<0||cutoffId!==null&&cutoff<0)assistantFailure('INVALID_CUTOFF');
        const allowed=cutoffId===null?visible:visible.slice(0,cutoff+1);
        const selected=allowed.filter(e=>historyIds.includes(e.id));
        if(new Set(historyIds).size!==historyIds.length||selected.length!==historyIds.length||selected.some(e=>e.source_revision!==p.source.owner.revision_id))assistantFailure('FORBIDDEN');
        const available=parentRelation?parentRelation.selected_reports:[{id:p.source.report.report_id,summary:p.source.report.summary},...p.reports.map(r=>({id:r.id,summary:JSON.stringify(p.decisions.find(d=>d.id===r.decision_id))}))];
        const reports=available.filter((r,i)=>reportIds.includes(r.id)&&(!p.source.membership_origin||available.findIndex(v=>v.id===r.id)===i));
        if(new Set(reportIds).size!==reportIds.length||reports.length!==reportIds.length)assistantFailure('FORBIDDEN');
        if(includeAggregate&&parentRelation&&!parentRelation.aggregate)assistantFailure('FORBIDDEN');
        collaborationIdle(queuedAncestors);if(epoch!==(sessionEpochs.get(id)??0))assistantFailure('INTERRUPTED');
        const preview:ChildPreview={...(automatic?{automatic_instruction:automatic.instruction}:{}),...(creationCommandId?{creation_command_id:creationCommandId}:{}),id:randomUUID(),parent_session_id:id,kind,task,cutoff_id:cutoffId,source:p.source,baseline_decision_id:p.current_decision_id,selected_history:selected,selected_reports:reports,aggregate:includeAggregate?(parentRelation?.aggregate??p.source.aggregate):null,parent_epoch:life.epoch,created_at};
        childPreviews.set(preview.id,preview);return structuredClone(preview);
    }
    async function createChild(id:string,previewId:string,commandId:string,confirmed:boolean,queuedAncestors?:ReadonlySet<string>){
        collaborationIdle(queuedAncestors);if(!confirmed)assistantFailure('AUTHORITY_REQUIRED');
        const preview=childPreviews.get(previewId);if(!preview||preview.parent_session_id!==id||preview.creation_command_id&&preview.creation_command_id!==commandId)assistantFailure('AUTHORITY_REQUIRED');
        if(closedSessions.has(id))assistantFailure('INTERRUPTED');const life=await store.readLifecycle(id);if(!life.open||preview.parent_epoch!==life.epoch)assistantFailure('INTERRUPTED');
        const p=await read(id);
        if(JSON.stringify(p.source)!==JSON.stringify(preview.source)||p.current_decision_id!==preview.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        collaborationIdle(queuedAncestors);const abort=new AbortController();if(closedSessions.has(id))assistantFailure('INTERRUPTED');childCreates.set(commandId,{parent:id,abort});
        try{const relation=await store.createChild(commandId,{id:randomUUID(),title:preview.task,source:preview.source.owner,created_at:now(),archived:false},preview,abort.signal,()=>collaborationIdle(queuedAncestors));return readCollaboration(relation.child_session_id);}
        finally{childCreates.delete(commandId);}
    }
    async function queueChild(id:string,kind:ChildKind,task:string,historyIds:readonly string[],reportIds:readonly string[],includeAggregate:boolean,commandId:string,automaticInstruction?:import('../contracts/case-collaboration.ts').AutomaticDelegationInstruction){
        guards();if(input.collaborationPolicy!=='open_analysis_v13')assistantFailure('FORBIDDEN');
        const ancestors=new Set<string>();let cursor=id;
        for(;;){if(ancestors.has(cursor))assistantFailure('INTEGRITY_BLOCKED');ancestors.add(cursor);const p=await read(cursor);if(!p.source.open_origin||!p.source.eligible||!(await store.readLifecycle(cursor)).open)assistantFailure('AUTHORIZATION_STALE');const relation=await store.readChild(cursor);if(!relation)break;cursor=relation.parent_session_id;}
        if(automaticInstruction){const projection=automaticDelegationProjection(automaticInstruction,(await read(id)).source,now());task=projection.task;historyIds=kind==='fork'?[projection.history.id]:[];}
        const cutoff=kind==='fork'?historyIds.at(-1)??null:null;
        const preview=await prepareChild(id,kind,task,cutoff,historyIds,reportIds,includeAggregate,commandId,ancestors,automaticInstruction);
        return createChild(id,preview.id,commandId,true,ancestors);
    }
    async function prepare(id: string, text: string, historyIds: readonly string[] = [], reportIds: readonly string[] = [], rebase = false): Promise<Authorization> {
        guards();
        if(closedSessions.has(id))assistantFailure('SESSION_CLOSED');
        const epoch=sessionEpochs.get(id)??0;
        if(!(await store.readLifecycle(id)).open)assistantFailure('SESSION_CLOSED');
        const p = await read(id), current = p.decisions.at(-1);
        const previous=await store.readBusinessAuthorization(id),baseline=rebase?(current?.id??null):(previous?previous.authorization.baseline_decision_id:current?.id??null);
        const selectedConfig=config;
        const selected = p.events.filter(e => historyIds.includes(e.id));
        if (new Set(historyIds).size !== historyIds.length || selected.length !== historyIds.length || selected.some(e => !['user', 'advice', 'question', 'tool'].includes(e.kind) || e.source_revision !== p.source.owner.revision_id))
            assistantFailure('FORBIDDEN');
        if (rebase && selected.some(e => e.kind !== 'user'))
            assistantFailure('FORBIDDEN');
        const available = [{ id: p.source.report.report_id, summary: p.source.report.summary }, ...p.reports.map(r => ({ id: r.id, summary: JSON.stringify(p.decisions.find(d => d.id === r.decision_id)) }))];
        const chosen = reportIds.length ? available.filter((r,i) => reportIds.includes(r.id)&&(!p.source.membership_origin||available.findIndex(v=>v.id===r.id)===i)) : [available.at(-1)!];
        if (reportIds.length && chosen.length !== new Set(reportIds).size)
            assistantFailure('FORBIDDEN');
        const blockers = [...p.source.missing];
        if(p.source.membership_origin&&!membership)blockers.push('P1 来源需要单独配置材料范围与原任务累计资源');
        if (!assistantText(text))
            blockers.push('请填写初始任务文本');
        if (!selectedConfig?.authorized)
            blockers.push('模型未配置');
        const accessSnapshot=access.snapshot();
        if(accessSnapshot&&!accessSnapshot.available)blockers.push('请检查模型接入配置');
        if (baseline !== (current?.id ?? null))
            blockers.push('当前决定已变化，请基于当前版本重新开始');
        const context = { source: { owner: p.source.owner, finding_id: p.source.finding_id, evidence_refs: p.source.evidence_refs, limitations: p.source.limitations, closure_id: p.source.closure_id }, aggregate: p.source.aggregate, formal_baseline: baseline ? current : null, initial_text: text, selected_history: selected, selected_reports: chosen, tools: ASSISTANT_TOOLS, skill: 'Case 决策与预期 v1.0', prompt_version: '1.0' };
        let authorization: Authorization = { id: randomUUID(), source: p.source, baseline_decision_id: baseline, config:selectedConfig, initial_text: text, selected_history: selected, selected_reports: chosen, tools: ASSISTANT_TOOLS, categories: ['user_authored_text', 'verified_case', 'accepted_evidence_finding', 'approved_020_clean_subset', 'selected_report_summary', 'selected_history'], skill_version: '1.0', prompt_version: '1.0', created_at: now(), payload: JSON.stringify(context), blockers };
        if(p.source.membership_origin&&!membership)assistantFailure('CAPABILITY_UNAVAILABLE');if(p.source.membership_origin&&membership){try{authorization=await membership.restrict(authorization,id);}catch(error){if((error as {code?:string}).code!=='AUTHORITY_REQUIRED')throw error;authorization={...authorization,blockers:[...authorization.blockers,'尚未配置获准的 P1 材料与累计资源']};}}
        guards();if(epoch!==(sessionEpochs.get(id)??0))assistantFailure('INTERRUPTED');
        previews.set(authorization.id, { session: id, authorization, generation: accessSnapshot?.generation });
        return structuredClone(authorization);
    }
    const localPublications=new Map<AbortController,readonly string[]>();
    async function returnedResults(id:string){
        guards();const p=await readParent(id);if(input.collaborationPolicy!=='open_analysis_v13'||!p.source.open_origin)assistantFailure('FORBIDDEN');
        if(!p.lifecycle.open||!p.source.eligible)assistantFailure('AUTHORIZATION_STALE');
        const materials=[];
        for(const result of p.results){
            if(!p.deliveries.some(d=>d.result_id===result.id&&d.status==='returned'))continue;
            if(!isDeepStrictEqual(result.source,p.source)||result.baseline_decision_id!==p.current_decision_id)continue;
            const life=await store.readLifecycle(result.child_session_id);
            const authorizedEpoch=(await store.readBusinessAuthorization(result.child_session_id,result.authorization_id))?.epoch;
            // A completed delivery is MODEL context, independent of execution being open.
            // Closing once fences new work; it does not erase an opinion returned beforehand.
            if(authorizedEpoch===undefined||life.epoch!==authorizedEpoch+(life.open?0:1))continue;
            materials.push({classification:'MODEL' as const,result});
        }
        return materials;
    }
    async function readParent(id:string):Promise<ParentCollaborationProjection>{const p=await read(id),state=await store.readParentCollaboration(id);const activity=await Promise.all(state.children.map(async child=>({session_id:child.child_session_id,open:(await store.readLifecycle(child.child_session_id)).open})));return {...state,activity,occupant:access.occupant?.()??null,lifecycle:await store.readLifecycle(id),source:p.source,current_decision_id:p.current_decision_id};}
    async function returnResult(id:string,target:ResultTarget,commandId:string){return deliverResult(id,target,commandId);}
    async function deliverResult(id:string,target:ResultTarget,commandId:string,continuation?:AbortSignal){
        guards();const epochs=new Map(sessionEpochs),c=new AbortController();localPublications.set(c,[id]);
        const cancel=()=>c.abort();continuation?.addEventListener('abort',cancel,{once:true});if(continuation?.aborted)c.abort();
        try{const relation=await store.readChild(id);if(!relation)assistantFailure('FORBIDDEN');localPublications.set(c,[id,relation.parent_session_id]);if((epochs.get(id)??0)!==(sessionEpochs.get(id)??0)||(epochs.get(relation.parent_session_id)??0)!==(sessionEpochs.get(relation.parent_session_id)??0))c.abort();
            const p=await read(id);if(!isDeepStrictEqual(p.source,relation.source)||p.current_decision_id!==relation.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
            if(p.source.membership_origin){if(!membership)assistantFailure('AUTHORITY_REQUIRED');const result=(await store.childResults(id)).find(r=>r.id===target.result_id&&r.version===target.result_version&&r.sha256===target.result_sha256);if(!result)assistantFailure('NOT_FOUND');await membership.safeValue(p.source,result.value);}
            try{return await store.returnChild(id,target,commandId,now(),p.source,c.signal);}
            catch(error){if(!c.signal.aborted)await store.failChildReturn(id,target,c.signal);throw error;}
        }finally{continuation?.removeEventListener('abort',cancel);localPublications.delete(c);}
    }
    async function reviewResult(id:string,target:ResultTarget,commandId:string,disposition:'adopted'|'declined',reason:string,confirmed:boolean){
        guards();if(!confirmed)assistantFailure('AUTHORITY_REQUIRED');const c=new AbortController();localPublications.set(c,[id]);
        try{const p=await read(id);if(p.source.membership_origin){if(!membership)assistantFailure('AUTHORITY_REQUIRED');const result=(await store.readParentCollaboration(id)).results.find(r=>r.id===target.result_id&&r.version===target.result_version&&r.sha256===target.result_sha256);if(!result)assistantFailure('NOT_FOUND');await membership.safeValue(p.source,result.value);}return await store.reviewChild(id,target,commandId,disposition,reason,now(),p.source,c.signal);}finally{localPublications.delete(c);}
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
        let authorization:Authorization={...a,payload:JSON.stringify({...JSON.parse(a.payload),selected_materials:materials}),categories:[...a.categories,...(materials.length?['selected_MODEL_user_adopted_material']:[])]};
        if(a.source.membership_origin&&membership)authorization=await membership.restrict(authorization,id);
        previews.set(a.id,{...preview,authorization});return structuredClone(authorization);
    }
    async function prepareCollaboration(id:string,text:string,historyIds:readonly string[],resultIds:readonly string[],userAuthored=false):Promise<Authorization>{
        const epoch=sessionEpochs.get(id)??0;
        const relation=await store.readChild(id);if(!relation)assistantFailure('FORBIDDEN');
        if(relation.automatic_instruction&&!userAuthored){text=relation.task;historyIds=[];}
        const parentEpoch=sessionEpochs.get(relation.parent_session_id)??0;
        const parentLife=await store.readLifecycle(relation.parent_session_id),childLife=await store.readLifecycle(id);if(!parentLife.open||!childLife.open||closedSessions.has(id)||closedSessions.has(relation.parent_session_id))assistantFailure('SESSION_CLOSED');
        const p=await read(id);if(!p.source.eligible||!isDeepStrictEqual(p.source,relation.source)||p.current_decision_id!==relation.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        const saved=await store.childResults(id),selectedResults=saved.filter(r=>resultIds.includes(r.id));
        if(new Set(resultIds).size!==resultIds.length||selectedResults.length!==resultIds.length)assistantFailure('FORBIDDEN');
        const a=await prepare(id,text,historyIds,[],false),snapshot=previews.get(a.id)!;
        const refs:CollaborationReference[]=[];
        const ref=(kind:CollaborationReference['kind'],id:string,version:number|null=null,sha256:string|null=null)=>refs.push({kind,id,revision_id:p.source.owner.revision_id,version,sha256});
        ref('case',p.source.owner.case_id);
        const projectedAggregate=relation.automatic_instruction?automaticDelegationAggregate(p.source,relation.automatic_instruction):relation.aggregate;
        const evidenceIds=p.source.evidence_refs;
        if(relation.aggregate){for(const id of evidenceIds)ref('evidence',id);if(p.source.finding_id)ref('finding',p.source.finding_id);for(const c of p.source.candidates)ref('candidate',c.candidate_id);ref('aggregate',relation.aggregate.artifact_id,null,projectedAggregate!.sha256);}
        for(const r of relation.selected_reports){const formal=p.reports.find(v=>v.id===r.id);ref('report',r.id,formal?.sequence??p.source.report.version,formal?.markdown_sha256??p.source.report.sha256);}
        for(const e of [...relation.selected_history,...a.selected_history])ref('history',e.id);
        for(const r of selectedResults)ref('result',r.id,r.version,r.sha256);
        const returned=input.collaborationPolicy==='open_analysis_v13'&&p.source.open_origin?await returnedResults(id):[];
        for(const material of returned)ref('result',material.result.id,material.result.version,material.result.sha256);
        const tools=ASSISTANT_TOOLS.filter(t=>t==='read_case'||t==='read_report'&&relation.selected_reports.length>0||relation.aggregate!==null&&['read_evidence','read_candidates','read_aggregate'].includes(t));
        const collaboration={kind:relation.kind,child_session_id:id,parent_session_id:relation.parent_session_id,parent_epoch:parentLife.epoch,child_epoch:childLife.epoch,allowed_references:refs,selected_results:selectedResults};
        const context={contract_version:'1.1',...(relation.automatic_instruction?.business_question?{business_question:relation.automatic_instruction.business_question}:{}),task:relation.task,source:{owner:p.source.owner,case_name:relation.automatic_instruction?'所选核验材料':p.source.case_name},...(relation.automatic_instruction?{instruction:{action:relation.automatic_instruction.action,reference_paths:relation.automatic_instruction.reference_paths,completion_reference_paths:relation.automatic_instruction.completion_reference_paths}}:{}),formal_baseline_id:relation.baseline_decision_id,inherited_history:relation.selected_history,selected_history:a.selected_history,selected_results:selectedResults.map(r=>({id:r.id,version:r.version,sha256:r.sha256,attempt_id:r.attempt_id,value:r.value})),...(input.collaborationPolicy==='open_analysis_v13'?{returned_model_results:relation.automatic_instruction?returned.map(m=>({...m,result:{...m.result,source:{owner:m.result.source.owner}}})):returned}:{}),selected_reports:relation.automatic_instruction?relation.selected_reports.map(r=>({id:r.id,summary:'选定核验材料摘要'})):relation.selected_reports,aggregate:projectedAggregate,business_projection:relation.aggregate&&!relation.automatic_instruction?{finding_id:p.source.finding_id,evidence_refs:p.source.evidence_refs,finding_summary:p.source.finding_summary,candidates:p.source.candidates,limitations:p.source.limitations}:null,initial_text:text,allowed_references:refs,tools,skill:'有界子对话 v1.1',prompt_version:'1.1'};
        let authorization:Authorization={...a,baseline_decision_id:relation.baseline_decision_id,collaboration,selected_reports:relation.selected_reports,tools,skill_version:'1.1',prompt_version:'1.1',payload:JSON.stringify(context),categories:[relation.automatic_instruction&&!userAuthored?'structured_delegation':'user_authored_text','selected_parent_history','selected_own_history','selected_own_results',...(relation.aggregate?['approved_020_clean_subset','accepted_evidence_finding']:[]),...(relation.selected_reports.length?['selected_report_summary']:[])]};
        const latestParent=await store.readLifecycle(relation.parent_session_id),latestChild=await store.readLifecycle(id);
        guards();
        if(epoch!==(sessionEpochs.get(id)??0)||parentEpoch!==(sessionEpochs.get(relation.parent_session_id)??0)||closedSessions.has(id)||closedSessions.has(relation.parent_session_id)||!latestParent.open||!latestChild.open||latestParent.epoch!==parentLife.epoch||latestChild.epoch!==childLife.epoch){previews.delete(a.id);assistantFailure('INTERRUPTED');}
        if(!isDeepStrictEqual(a.source,p.source)||a.baseline_decision_id!==p.current_decision_id){previews.delete(a.id);assistantFailure('AUTHORIZATION_STALE');}
        if(a.source.membership_origin&&membership)authorization=await membership.restrict(authorization,id);
        previews.set(a.id,{...snapshot,authorization});return structuredClone(authorization);
    }
    // Live cancellation handles for business commands only. SDK owns execution,
    // Session, queue, physical settlement, accounting and recovery admission.
    const operations=new Map<string,{abort:AbortController;done:Promise<void>}>();
    const completions=new Map<Promise<void>,string>();
    async function start(id:string,authorizationId:string,freeTextConfirmed:boolean){
        guards();if(!input.agent)assistantFailure('RUNTIME_UNAVAILABLE');if(operations.has(id))assistantFailure('MODEL_BUSY');
        const preview=previews.get(authorizationId);if(!preview||preview.session!==id||!freeTextConfirmed)assistantFailure('AUTHORITY_REQUIRED');
        const a=preview.authorization;if(a.source.membership_origin&&!a.membership)assistantFailure('AUTHORITY_REQUIRED');if(a.blockers.length||!a.config?.authorized||closedSessions.has(id))assistantFailure('AUTHORITY_REQUIRED');
        const generation=preview.generation;if(generation===undefined||access.snapshot().generation!==generation)assistantFailure('CONFIGURATION_CHANGED');
        const credential=await access.acquire(generation,{session_id:id,label:'Case 专业用途'});let handedOff=false;
        try{guards();if(closedSessions.has(id))assistantFailure('AUTHORITY_REQUIRED');
        const current=await read(id);if(!isDeepStrictEqual(current.source,a.source)||current.current_decision_id!==a.baseline_decision_id)assistantFailure('AUTHORIZATION_STALE');
        const binding=await store.authorizeBusiness({session_id:id,authorization:a,configuration_sha256:await input.agent.configuration()}),abort=new AbortController();
        const authorized=()=>!closed&&!abort.signal.aborted&&!closedSessions.has(id)&&access.snapshot().available&&access.snapshot().generation===generation&&store.isBusinessAuthorized(a.id);
        await store.appendEvent(id,{id:randomUUID(),attempt_id:a.id,at:now(),kind:'user',text:a.initial_text,tool:null,status:'authorized',source_revision:a.source.owner.revision_id},abort.signal);
        const done=Promise.resolve().then(async()=>{
            let proposed:DecisionFields|undefined,child:import('../contracts/case-collaboration.ts').ChildResultValue|undefined;
            const check=()=>{if(!authorized())assistantFailure('INTERRUPTED');};
            const tools:AnalysisTool[]=a.tools.map(name=>({name,effect:'read',description:'Read the currently authorized '+name+' business projection; no unselected material or independent computation.',parameters:{type:'object',properties:{},additionalProperties:false},execute:async(raw,signal)=>{
                assistantRecord(raw,[]);check();if(signal.aborted)assistantFailure('INTERRUPTED');
                const fresh=await store.readSource(a.source.owner);if(!isDeepStrictEqual(fresh,a.source))assistantFailure('AUTHORIZATION_STALE');check();
                if(membership&&a.membership)return membership.tool(a);
                if(name==='read_case')return {owner:a.source.owner,name:a.source.case_name,finding:a.source.finding_summary,limitations:a.source.limitations};
                if(name==='read_evidence')return {evidence_refs:a.source.evidence_refs,finding_id:a.source.finding_id,limitations:a.source.limitations};
                if(name==='read_candidates')return a.source.candidates;
                if(name==='read_aggregate')return a.source.aggregate;
                return a.selected_reports;
            }}));
            if(a.collaboration)tools.push({name:'propose_child_result',effect:'write',description:'Propose a MODEL opinion within the exact selected references. It is saved only after this native operation has settled; not independent evidence or a formal decision.',parameters:childResultParameters,execute:async(raw,signal)=>{check();if(signal.aborted)assistantFailure('INTERRUPTED');child=validateChildResult(raw,a.collaboration!.allowed_references);return {accepted:true,saved:false,classification:'MODEL'};}});
            else if(!a.source.open_origin)tools.push({name:'propose_decision',effect:'write',description:'Propose a pending Decision/Expected Outcome draft against existing verified evidence. Human adoption remains required; no business action executes.',parameters:assistantDecisionParameters,execute:async(raw,signal)=>{check();if(signal.aborted)assistantFailure('INTERRUPTED');proposed=validateAssistantDecision(raw,a.source);return {accepted:true,saved:false,classification:'MODEL_PROPOSAL'};}});
            const result=await input.agent!.advance({identity:binding.identity,work_id:binding.work_id,command_id:a.id,purpose:'retained_case',prompt:a.payload,system:'自主使用当前获准的 Case 专业工具。模型意见与草稿不是独立核验、人工采纳或已执行业务行动；保留来源、条件、限制和 UNKNOWN。',capabilities:async()=>tools,authorize:authorized,signal:abort.signal});
            check();await store.publishModel({authorization_id:a.id,result,at:now(),...(proposed?{decision:proposed}:{}),...(child?{child}:{})},abort.signal);
        }).finally(async()=>{await input.agent!.waitForIdle({...binding.identity,purpose:'retained_case'});credential.release();operations.delete(id);});
        // The returned promise is retained and observed, never a silent recovery
        // loop. waitForIdle/close exposes its rejection and preserves all facts.
        operations.set(id,{abort,done});completions.set(done,id);handedOff=true;void done.catch(()=>undefined);return await read(id);
        }catch(error){if(!handedOff)credential.release();throw error;}
    }
    async function waitForIdle(id?:string){const observed=[...completions].filter(([,session])=>id===undefined||session===id).map(([done])=>done),results=await Promise.allSettled(observed);if(id===undefined)await input.agent?.waitForIdle();for(const value of observed)completions.delete(value);const failed=results.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason;}
    async function send(id:string,text:string){
        guards();if(!assistantText(text)||text.length>12000)assistantFailure('INVALID_REQUEST');if(!input.agent)assistantFailure('RUNTIME_UNAVAILABLE');
        if(!operations.has(id)){const a=await store.readChild(id)?await prepareCollaboration(id,text,[],[],true):await prepare(id,text);return start(id,a.id,true);}
        const g=await store.readBusinessAuthorization(id);if(!g||!store.isBusinessAuthorized(g.authorization.id))assistantFailure('AUTHORITY_REQUIRED');
        if(g.authorization.membership){if(!membership)assistantFailure('AUTHORITY_REQUIRED');(await membership.check(g.authorization)).text(text);}
        const signal=operations.get(id)!.abort.signal;
        await store.appendEvent(id,{id:randomUUID(),attempt_id:g.authorization.id,at:now(),kind:'user',text,tool:null,status:'FOLLOW_UP_REQUESTED',source_revision:g.authorization.source.owner.revision_id},signal);
        await input.agent.conversation({identity:g.identity,work_id:g.work_id,purpose:'retained_case',command:{kind:'follow_up',text},authorize:()=>!closed&&!signal.aborted&&store.isBusinessAuthorized(g.authorization.id),signal});
        return read(id);
    }
    async function stop(id:string){await closeSession(id,true);operations.get(id)?.abort.abort();return read(id);}
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
        const ids=new Set([id,...[...previews.values()].filter(p=>p.authorization.collaboration?.parent_session_id===id).map(p=>p.session)]),at=now();
        for(const sessionId of ids){closedSessions.add(sessionId);sessionEpochs.set(sessionId,(sessionEpochs.get(sessionId)??0)+1);}
        for(const [key,preview]of previews)if(ids.has(preview.session)||preview.authorization.collaboration?.parent_session_id===id)previews.delete(key);
        for(const [key,preview]of childPreviews)if(ids.has(preview.parent_session_id))childPreviews.delete(key);
        for(const c of childCreates.values())if(ids.has(c.parent))c.abort.abort();
        for(const [c,owners]of localPublications)if(owners.some(owner=>ids.has(owner)))c.abort();
        const saved=await store.closeFamily(id,at,true);for(const sessionId of saved){operations.get(sessionId)?.abort.abort();if(!ids.has(sessionId)){ids.add(sessionId);sessionEpochs.set(sessionId,(sessionEpochs.get(sessionId)??0)+1);}closedSessions.add(sessionId);
        }for(const [key,preview]of previews)if(ids.has(preview.session)||preview.authorization.collaboration&&ids.has(preview.authorization.collaboration.parent_session_id))previews.delete(key);for(const [key,preview]of childPreviews)if(ids.has(preview.parent_session_id))childPreviews.delete(key);for(const c of childCreates.values())if(ids.has(c.parent))c.abort.abort();for(const [c,owners]of localPublications)if(owners.some(owner=>ids.has(owner)))c.abort();
    }
    async function reopenSession(id:string,epoch:number){guards();const state=await store.reopenSession(id,epoch);closedSessions.delete(id);sessionEpochs.set(id,(sessionEpochs.get(id)??0)+1);return state;}
    async function close(){
        if(closeComplete)return;if(closing)return closing;
        closed=true;previews.clear();childPreviews.clear();for(const c of childCreates.values())c.abort.abort();for(const c of localPublications.keys())c.abort();for(const operation of operations.values())operation.abort.abort();for(const link of links)link.abort.abort();
        closing=(async()=>{
            const creations=await Promise.allSettled([...links].map(link=>link.done));
            // An explicit close may read an unresolved business receipt; it
            // never reissues the creation or relabels its original failure.
            for(const result of creations)if(result.status==='rejected'&&result.reason?.code==='RESULT_PENDING'&&result.reason?.readback){
                const {commandId,owner,title}=result.reason.link;
                try{const committed=await store.readLinkedSession(commandId,owner,title);if(committed)usedSessions.add(committed.id);}
                catch{throw result.reason;}
            }
            for(const id of usedSessions)await closeSession(id);
            await Promise.allSettled([...completions.keys()]);await input.agent?.waitForIdle();
            completions.clear();links.clear();closeComplete=true;
        })().finally(()=>{closing=undefined;});return closing;
    }
    return { start,stop,send,waitForIdle,queueChild,returnedResults,occupant:()=>access.occupant?.()??null,lifecycle:store.readLifecycle,reopenSession,prepareParent,readParent,returnResult,reviewResult,prepareCollaboration,isChild:async(id:string)=>!!await store.readChild(id),prepareChild,createChild,readCollaboration,source: store.readSource, read, link, list, prepare, edit, revise, cancelRevision, reject, adopt, closeSession, close };
}
