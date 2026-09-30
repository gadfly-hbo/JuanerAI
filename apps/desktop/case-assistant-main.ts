import { validateCaseAssistantRequest, type CaseAssistantResult } from '../../packages/contracts/case-assistant.ts';
import type { createCaseAssistantApplication } from '../../packages/application/case-assistant.ts';
type Application = ReturnType<typeof createCaseAssistantApplication>;
export function createCaseAssistantHandler(dependencies: {
    senderPolicy(sender: unknown): boolean;
    getApplication(): Application | null;
    exportReport(application: Application, sessionId: string, reportId: string, commandId: string): Promise<unknown>;
}) {
    return async (sender: unknown, input: unknown): Promise<CaseAssistantResult<unknown>> => {
        try {
            if (!dependencies.senderPolicy(sender))
                throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN' });
            const r = validateCaseAssistantRequest(input), app = dependencies.getApplication();
            if (!app)
                throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
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
