import {validateCollaborationRequest} from '../../packages/contracts/case-collaboration.ts';
import { validateCaseAssistantRequest, type CaseAssistantResult } from '../../packages/contracts/case-assistant.ts';
import type { createCaseAssistantApplication } from '../../packages/application/case-assistant.ts';
type Application = ReturnType<typeof createCaseAssistantApplication>;
export function createCaseAssistantHandler(dependencies: {
    senderPolicy(sender: unknown,request?:unknown): boolean;
    openChildWindow?(sessionId:string):Promise<unknown>;
    focusParent?(parentSessionId:string):Promise<unknown>;
    getApplication(): Application | null;
    exportReport(application: Application, sessionId: string, reportId: string, commandId: string): Promise<unknown>;
}) {
    return async (sender: unknown, input: unknown): Promise<CaseAssistantResult<unknown>> => {
        try {
            if (!dependencies.senderPolicy(sender,input))
                throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN' });
            if(input&&typeof input==='object'&&'version' in input&&input.version==='1.1'){
                const r=validateCollaborationRequest(input),app=dependencies.getApplication();
                if(!app)throw Object.assign(new Error('NOT_FOUND'),{code:'NOT_FOUND'});
                if(r.operation==='focus_parent'){const p=await app.readCollaboration(r.session_id);if(!dependencies.focusParent)throw Object.assign(new Error('WINDOW_UNAVAILABLE'),{code:'WINDOW_UNAVAILABLE'});return {ok:true,value:await dependencies.focusParent(p.relation.parent_session_id)};}
                if(r.operation==='open_child_window'){await app.readCollaboration(r.session_id);if(!dependencies.openChildWindow)throw Object.assign(new Error('WINDOW_UNAVAILABLE'),{code:'WINDOW_UNAVAILABLE'});return {ok:true,value:await dependencies.openChildWindow(r.session_id)};}
                let value:unknown;
                switch(r.operation){
                  case 'reopen':value=await app.reopenSession(r.session_id,r.expected_epoch);break;
                  case 'close':if(!r.confirmed)throw Object.assign(new Error('AUTHORITY_REQUIRED'),{code:'AUTHORITY_REQUIRED'});if((await app.lifecycle(r.session_id)).epoch!==r.expected_epoch)throw Object.assign(new Error('LIFECYCLE_STALE'),{code:'LIFECYCLE_STALE'});await app.closeSession(r.session_id,true);value=await app.lifecycle(r.session_id);break;
                  case 'prepare_parent':value=await app.prepareParent(r.session_id,r.text,r.history_ids,r.report_ids,r.material_ids,r.rebase);break;
                  case 'read_parent':value=await app.readParent(r.session_id);break;
                  case 'return_result':value=await app.returnResult(r.session_id,{result_id:r.result_id,result_version:r.result_version,result_sha256:r.result_sha256},r.command_id);break;
                  case 'review_result':value=await app.reviewResult(r.session_id,{result_id:r.result_id,result_version:r.result_version,result_sha256:r.result_sha256},r.command_id,r.disposition,r.reason,r.confirmed);break;
                  case 'prepare_child':value=await app.prepareChild(r.session_id,r.kind,r.task,r.cutoff_id,r.history_ids,r.report_ids,r.include_aggregate);break;
                  case 'create_child':value=await app.createChild(r.session_id,r.preview_id,r.command_id,r.confirmed);break;
                  case 'prepare':value=await app.prepareCollaboration(r.session_id,r.text,r.history_ids,r.result_ids);break;
                  case 'start':await app.start(r.session_id,r.authorization_id,r.free_text_confirmed);value=await app.readCollaboration(r.session_id);break;
                  case 'send':await app.send(r.session_id,r.text);value=await app.readCollaboration(r.session_id);break;
                  case 'stop':await app.stop(r.session_id);value=await app.readCollaboration(r.session_id);break;
                  case 'read_collaboration':value=await app.readCollaboration(r.session_id);break;
                }
                return {ok:true,value};
            }
            const r = validateCaseAssistantRequest(input), app = dependencies.getApplication();
            if (!app)
                throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
            if('session_id' in r&&await app.isChild(r.session_id))throw Object.assign(new Error('FORBIDDEN'),{code:'FORBIDDEN'});
            let value: unknown;
            switch (r.operation) {
                case 'list':
                    value = await app.list(r.project_id);
                    break;
                case 'source':
                    value = await app.source(r.owner);
                    break;
                case 'link':
                    value = await app.link(r.owner, r.title, r.command_id);
                    break;
                case 'read':
                    value = await app.read(r.session_id);
                    break;
                case 'prepare':
                    value = await app.prepare(r.session_id, r.text, r.history_ids, r.report_ids, r.rebase);
                    break;
                case 'start':
                    value = await app.start(r.session_id, r.authorization_id, r.free_text_confirmed);
                    break;
                case 'send':
                    value = await app.send(r.session_id, r.text);
                    break;
                case 'stop':
                    value = await app.stop(r.session_id);
                    break;
                case 'close':
                    value = await app.closeSession(r.session_id);
                    break;
                case 'revise':
                    value = await app.revise(r.session_id, r.decision_id);
                    break;
                case 'cancel_revision':
                    value = await app.cancelRevision(r.session_id, r.draft_id, r.draft_version);
                    break;
                case 'edit':
                    value = await app.edit(r.session_id, r.draft_id, r.draft_version, r.fields);
                    break;
                case 'reject':
                    value = await app.reject(r.session_id, r.draft_id, r.draft_version, r.confirmed, r.reason);
                    break;
                case 'adopt':
                    value = await app.adopt(r.session_id, r.draft_id, r.draft_version, r.actor, r.command_id);
                    break;
                case 'export':
                    value = await dependencies.exportReport(app, r.session_id, r.report_id, r.command_id);
                    break;
            }
            return { ok: true, value };
        }
        catch (error) {
            const code = String((error as {
                code?: string;
            }).code ?? 'OPERATION_FAILED');
            return { ok: false, error: { code, message: code === 'RESULT_PENDING' ? '结果待核对：请重新打开项目；不要重复提交或覆盖导出文件。' : `未完成：${code}。来源分析 Case 保持不变；请核对来源、授权和字段后重试。` } };
        }
    };
}
