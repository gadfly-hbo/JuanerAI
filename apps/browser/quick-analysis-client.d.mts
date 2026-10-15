import type {OpenStoredTask} from '../../packages/ports/open-analysis-store.ts';
import type {QuickAnalysisTaskView} from './quick-analysis-workbench.mjs';
/** Read-only projection of an acknowledged task; never dispatches a run. */
export function openTaskView(task:OpenStoredTask,requests?:readonly import('../../packages/ports/analysis-request-ledger.ts').AnalysisRequest[],diagnostics?:import('../../packages/ports/open-analysis-runtime.ts').AnalysisRuntimeDiagnostics|null):QuickAnalysisTaskView;

/** Projects actual descendants and root ledger receipts without dispatching. */
export function collaborationCards(groups:readonly Readonly<{parent_session_id:string;parent:import("../../packages/contracts/case-collaboration.ts").ParentCollaborationProjection;children:readonly import("../../packages/contracts/case-collaboration.ts").CollaborationProjection[];requests:readonly import("../../packages/ports/analysis-request-ledger.ts").AnalysisRequest[]}>[]):NonNullable<QuickAnalysisTaskView["collaboration"]>;

export function createQuickAnalysisClient(options?:{request?:typeof globalThis.fetch;storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>|null;control?:string|null}): {
 read:(id:string)=>Promise<OpenStoredTask>;
 diagnostics:(id:string)=>Promise<import('../../packages/ports/open-analysis-runtime.ts').AnalysisRuntimeDiagnostics>;
 reportContent:(id:string)=>Promise<ReturnType<typeof import('../../packages/product-core/browser-report-content.ts').projectReportContent>>;
 contentCommand:(id:string,sha256:string,action:import('../../packages/product-core/browser-report-content.ts').ReportContentCommand['action'],fields?:Readonly<Record<string,unknown>>)=>Promise<import('../../packages/product-core/browser-report-content.ts').ReportContentEvent>;
 resolveReferences:(id:string,references:readonly unknown[])=>Promise<readonly {id:string;quote:string;scope:string;revision:string}[]>;
 canWrite:()=>boolean;pending:()=>Readonly<{task_id:string;command_id?:string;kind:string}>|null;recover:()=>Promise<OpenStoredTask|null>;
};
