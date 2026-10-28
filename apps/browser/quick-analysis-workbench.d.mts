export type QuickAnalysisTaskView=Readonly<{
 content?:ReturnType<typeof import('../../packages/product-core/browser-report-content.ts').projectReportContent>;
 metricAsset?:Readonly<{id:string;version:string}>|null;assetRevisionReady?:boolean;
 requirementDraft?:Readonly<Pick<import('../../packages/product-core/open-requirement-framework.ts').RequirementDraft,'revision'|'sequence'|'content'|'history'|'conversation'>&{reviewed?:boolean;executed?:boolean;staleResult?:boolean}>|null;
 resumable?:boolean;resumeLabel?:string;historical?:boolean;latestRevision?:string;displayRevision?:string;
 taskState?:'waiting'|'ready'|'running'|'unknown'|'stopped'|'failed'|'saved';
 id:string;title:string;status:string;
 stopping?:boolean;effectUnconfirmed?:boolean;operationActive?:boolean;
 versions?:readonly RevisionImpact[];
 messages:readonly Readonly<{role:'user'|'assistant';text:string}>[];
 context?:Readonly<{summary:string;userText?:string;sources?:readonly Readonly<{name:string;headers:readonly string[];rows:number}>[];unknowns:readonly string[]}>|null;
 framework:Readonly<{goal:string;method:string;binding:string;revision:string;scope?:readonly Readonly<{label:string;value:string}>[]}>|null;
 report:Readonly<{modelReport?:boolean;verification?:'not_performed';text:string;state:'saved';revision?:string;acknowledged?:boolean}>|null;
 materials:readonly Readonly<{id?:string;name:string;summary:string;disclosure:string}>[];
 events:readonly Readonly<{summary:string}>[];
}>;
export type QuickAnalysisWorkbenchState=Readonly<{
 viewMode?:'conversation'|'results'|'evidence';resultMode?:'overview'|'data'|'report';reportDraft?:string|null;reportBaseSha?:string|null;reportParagraphId?:string|null;
 references?:readonly Readonly<{kind:'finding'|'paragraph';id:string;quote:string;label:string;task_id:string;revision:string;scope_sha256:string;content_sha256:string;at:string}>[];
 pendingRequirementMaterials?:number;entryMode?:'analysis'|'requirements';mode?:'quick'|'pro';stage?:'home'|'prepare'|'analysis'|'report'|'feedback';
 project:string;tasks:readonly Readonly<{id:string;title:string;busy?:boolean}>[];current:QuickAnalysisTaskView|null;
 pendingOperation?:Readonly<{task_id:string;kind?:string}>|null;
 detail:'context'|'plan'|'files'|'evidence'|'execution'|'more';drawer:boolean;
 metricAssets?:Readonly<{project_id?:string;candidates:readonly import('../../packages/ports/metric-assets.ts').MetricAssetCandidate[];current:Readonly<{asset:import('../../packages/product-core/metric-assets.ts').MetricAsset;approval:import('../../packages/ports/metric-assets.ts').MetricAssetApproval}>|null}>|null;
 expanded?:'metric-assets'|'report'|'plan'|'context'|'requirement'|null;readonly?:boolean;pending?:boolean;stoppable?:boolean;notice?:string;
 connection?:string;prompt?:string;draft?:string;
}>;
export function renderQuickAnalysisWorkbench(state:QuickAnalysisWorkbenchState):string;

export type RevisionImpact=Readonly<{hasContent?:boolean;revision:string;nextRevision:string;question:string;text:string;changes:readonly Readonly<{label:string;before:string;after:string}>[];impacts:readonly string[];status:string}>;
export function renderRevisionImpact(version?:RevisionImpact):string;
