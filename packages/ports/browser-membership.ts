import type {DesktopProjection} from '../contracts/xanthil-desktop-ipc.ts';
import type {OperationExecution} from '../product-core/member-operation.ts';
import type {TaskState} from '../product-core/member-task.ts';

export type BrowserStopReceipt = Readonly<{
  version: '1.0'; kind: 'browser_stop'; command_id: string; task_id: string;
  epoch: number; status: 'stopped' | 'closed'; at: string;
}>;
export type BrowserSourceSummary={id:string;sources:readonly {source_id:string;display_name:string;format:string;sha256:string;byte_length:string;sheets:readonly {name:string;row_count:number}[]}[]};
export type BrowserOperationReadback={operations:readonly unknown[];usage:readonly OperationExecution[];totals:{calls:string;local_runs:string;unresolved:number;input_tokens:{known:string;unknown:number};output_tokens:{known:string;unknown:number};active_ms:{known:string;unknown:number};wait_ms:{known:string;unknown:number}}};
export interface BrowserMembershipReadback {
  readBrowserReportCopy(input:{task_id:string;report_id:string}):Promise<{suggested_file_name:string;bytes:Uint8Array;media_type:string;sha256:string;byte_length:string}>;
  readBrowserTask(input: {task_id: string}): Promise<{task:TaskState;question:string;preparation?:{status:string;failure_code:string|null;current:boolean;execution_id:string}|null;case:DesktopProjection;source_summary:BrowserSourceSummary|null;clarifications:readonly {reply:string;sha256:string}[];model:{answerable:boolean;execution_id:string;stage:string;status:string;question:string|null;failure_code:string|null;current:boolean}|null;material_grant:{grant_id:string;source_set_id:string|null;policy_sha256:string;disclose_verified_result:boolean;active:boolean}|null;operations:BrowserOperationReadback}>;
  readBrowserReceipt(input: {task_id: string; command_id: string}): Promise<BrowserStopReceipt | null>;
  stopBrowserTask(input: {task_id: string; command_id: string}): Promise<BrowserStopReceipt>;
}

export type BrowserReviewReceipt={version:'1.0';kind:'browser_review_opened'|'browser_review_saved';command_id:string;task_id:string;input_sha256:string;review_id:string;review_version:number;review_sha256:string};
export type BrowserCommandReceipt=BrowserStopReceipt|{version:'1.0';kind:'clarification_saved';command_id:string;task_id:string;grant_id:string;clarification_sha256:string}|{version:'1.0';kind:'model_authorized';command_id:string;task_id:string;grant_id:string;epoch:number}|BrowserReviewReceipt|{version:'1.0';kind:'review_submitted';command_id:string;task_id:string;receipt:import('../product-core/member-review.ts').ReviewReceipt}|{version:'1.0';kind:'task_creation_pending';command_id:string}|{version:'1.0';kind:'task_created';command_id:string;task_id:string}|{version:'1.0';kind:'sources_selected';command_id:string;task_id:string;source_set_id:string};
export interface BrowserWorkspaceReadback extends BrowserMembershipReadback {
 listBrowserTasks(projectId:string):Promise<readonly {task_id:string;question:string;status:string;row_version:number;epoch:number}[]>;
 readBrowserCommand(commandId:string):Promise<BrowserCommandReceipt|null>;
}
export interface BrowserWorkspaceCommands {
 stopWork?(taskId:string):void;
 closeWork?():Promise<void>;
 modelPolicy():Promise<Awaited<ReturnType<ReturnType<typeof import('../application/provider-settings.ts').createMembershipPolicyAccess>['read']>>>;
 answer(taskId:string,input:unknown):Promise<BrowserCommandReceipt>;
 authorizeModel(taskId:string,input:unknown):Promise<BrowserCommandReceipt>;
 list():Promise<{tasks:readonly {task_id:string;question:string;status:string;row_version:number;epoch:number}[]}>;
 command(commandId:string):Promise<BrowserCommandReceipt|null>;
 create(input:unknown):Promise<{task_id:string}>;
 select(taskId:string,input:unknown):Promise<unknown>;
 review(taskId:string,operation:'open'|'save'|'submit',input:unknown):Promise<BrowserCommandReceipt>;
}
