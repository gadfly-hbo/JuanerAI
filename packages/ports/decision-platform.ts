/** Business identities only; concrete plugin/SDK types stay in adapters. */
export type SavedDecisionReport = Readonly<{
 projectId:string;taskId:string;sourceId:string;revision:string;
 format:'md'|'pdf'|'pptx';filename:string;sha256:string;bytes:number;
}>;
export type DecisionRecipient = Readonly<{provider:string;model:string;configurationSha256:string}>;
export type DecisionMaterialScope = Readonly<{
 report:SavedDecisionReport;teachSha256:string;recipients:readonly DecisionRecipient[];
}>;
export type DecisionMaterialGrant = DecisionMaterialScope & Readonly<{expiresAt:number}>;
export type DecisionBinding = Readonly<{id:string;taskId:string;marker:string;pluginProjectId:string|null}>;
export type DecisionReportLink = Readonly<{id:string;bindingId:string;source:SavedDecisionReport;physicalName:string;pluginReportId:string|null}>;
export type DecisionWriteIntent = Readonly<{
 id:string;taskId:string;kind:'project'|'upload'|'extract'|'action'|'task'|'feedback';target:string;
 effect?:DecisionEffect;requestSha256:string;startedAt:string;state:'pending'|'confirmed'|'unknown';result:unknown|null;
}>;
export interface DecisionStore {
 bindings():DecisionBinding[];
 binding(taskId:string):DecisionBinding|null;
 prepareBinding(value:DecisionBinding):DecisionBinding;
 bindProject(taskId:string,pluginProjectId:string):void;
 report(id:string):{link:DecisionReportLink;content:Uint8Array}|null;
 reports(taskId:string):DecisionReportLink[];
 saveReport(link:DecisionReportLink,content:Uint8Array):void;
 linkReport(id:string,pluginReportId:string):void;
 begin(intent:DecisionWriteIntent):{created:boolean;intent:DecisionWriteIntent};
 intent(id:string):DecisionWriteIntent|null;
 settle(id:string,state:'confirmed'|'unknown',result:unknown):void;
 pending(taskId:string):DecisionWriteIntent[];
}
export type DecisionReportReceipt=Readonly<{projectId:string;reportId:string;physicalName:string;sha256:string;bytes:number;status:'pending'|'extracting'|'done'|'failed'}>;
export interface DecisionPlatformGateway {
 findProject?(marker:string):Promise<{id:string;marker:string}|null>;
 createProject(title:string,marker:string):Promise<{id:string;marker:string}>;
 project(id:string):Promise<{id:string;marker:string}|null>;
 uploadReport(projectId:string,physicalName:string,content:Uint8Array):Promise<void>;
 report(projectId:string,physicalName:string):Promise<DecisionReportReceipt|null>;
}

export type DecisionTaskFields={title:string;owner:string;dueDate:string;status:'todo'|'doing'|'done';priority:'high'|'medium'|'low';note:string};
export type DecisionCommand=
 |{type:'action';id:string;status:'adopted'|'dismissed';dismissedReason?:string}
 |{type:'manual';title:string;rationale:string;expectedImpact:string;priority:'high'|'medium'|'low';effort:'high'|'medium'|'low';reportId:number|null;scene?:string;lifecycle?:string}
 |{type:'task-create';actionId:string;fields:DecisionTaskFields}
 |{type:'task-update';id:string;fields:DecisionTaskFields}
 |{type:'feedback';id:string;adopted:boolean;outcome:string;metricDelta:string;review:string;score:number}
 |{type:'extract';reportLinkId:string};
export type DecisionEffect={command:DecisionCommand;beforeIds:readonly string[]};
export interface DecisionEffectsGateway {
 prepare(projectId:string,command:DecisionCommand):Promise<DecisionEffect>;
 execute(projectId:string,effect:DecisionEffect):Promise<void>;
 confirm(projectId:string,effect:DecisionEffect):Promise<unknown|null>;
 state(projectId:string):Promise<{active:boolean;unknown:boolean}>;
}
