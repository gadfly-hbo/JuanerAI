import type {OpenStoredTask} from '../../packages/ports/open-analysis-store.ts';
import type {QuickAnalysisTaskView} from './quick-analysis-workbench.mjs';
/** Read-only projection of an acknowledged task; never dispatches a run. */
export function openTaskView(task:OpenStoredTask & {operation_active?:boolean;browser_report?:ReturnType<typeof import('../../packages/product-core/browser-report-content.ts').projectReportContent>},diagnostics?:import('../../packages/ports/open-analysis-runtime.ts').AnalysisRuntimeDiagnostics|null):QuickAnalysisTaskView;


export function createQuickAnalysisClient(options?:{request?:typeof globalThis.fetch;storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>|null;control?:string|null}): {
 list:()=>Promise<OpenStoredTask[]>;
 lastDiscussionFailure:()=>Readonly<{task_id:string;command_id:string;state:'failed';settled:true;code?:string}>|null;
 discussRequirement:(id:string,expected_sequence:number,message:string)=>Promise<OpenStoredTask>;
 startRequirement:(id:string,revision:number,binding:Readonly<{expected_analysis_revision:string;scope_sha256:string}>)=>Promise<OpenStoredTask>;
 submit:(question:string,sources:readonly unknown[],preferences?:import('../../packages/product-core/open-analysis-methods.ts').OpenAnalysisPreferences,entry_mode?:'requirements')=>Promise<OpenStoredTask>;
 read:(id:string)=>Promise<OpenStoredTask>;
 diagnostics:(id:string)=>Promise<import('../../packages/ports/open-analysis-runtime.ts').AnalysisRuntimeDiagnostics>;
 sessionControl:(id:string,revision:string,command:Readonly<Record<string,unknown>>)=>Promise<import('../../packages/ports/analysis-agent.ts').AnalysisConversationView>;
 reportContent:(id:string)=>Promise<ReturnType<typeof import('../../packages/product-core/browser-report-content.ts').projectReportContent>>;
 contentCommand:(id:string,sha256:string,action:import('../../packages/product-core/browser-report-content.ts').ReportContentCommand['action'],fields?:Readonly<Record<string,unknown>>)=>Promise<import('../../packages/product-core/browser-report-content.ts').ReportContentEvent>;
 resolveReferences:(id:string,references:readonly unknown[])=>Promise<readonly {id:string;quote:string;scope:string;revision:string}[]>;
 canWrite:()=>boolean;pending:()=>Readonly<{task_id:string;command_id?:string;kind:string}>|null;recover:()=>Promise<OpenStoredTask|null>;
};

