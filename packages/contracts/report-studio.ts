/** Private v1 seam for the one approved bundled Studio consumer; no SDK types. */
export type ReportStudioResourceRole = 'server' | 'web' | 'skills' | 'node' | 'browser' | 'dependencies' | 'licenses' | 'resource';
export type ReportStudioBundleManifest = {
  schema_version: '1';
  module: 'reports-factory';
  version: string;
  source_commit: string;
  protocol_version: '1';
  files: Array<{path: string; bytes: number; sha256: string; role: ReportStudioResourceRole}>;
};
/** Supplied by trusted host composition, never taken from the package itself. */
export type ReportStudioBundleIdentity = {
  version: string;
  source_commit: string;
  protocol_version: '1';
  manifest_sha256: string;
};
export type ReportStudioBundleCheck =
  | {state: 'ready'; manifest: ReportStudioBundleManifest}
  | {state: 'unavailable'; reason: 'missing' | 'invalid' | 'incompatible' | 'corrupt'};

export type ReportStudioSource = Readonly<{
  project_id: string; task_id: string; revision: string;
  outcome_id: string; outcome_sha256: string; scope_sha256: string;
}>;
export type ReportStudioMaterial = Readonly<{
  material_id: 'conclusion' | 'table'; label: string; text: string;
  classification: 'MODEL_EXPLANATION' | 'ANALYSIS_CALCULATION';
  source: ReportStudioSource;
  verification: 'not_performed' | 'independent_arithmetic' | 'source_attribution';
  limitations: readonly string[];
}>;
export type ReportStudioMaterialCatalog = Readonly<{
  schema_version: '1'; title: string; source: ReportStudioSource; materials: readonly ReportStudioMaterial[];
}>;
export type ReportStudioMaterialSnapshot = ReportStudioMaterialCatalog & Readonly<{snapshot_sha256: string}>;

export type ReportStudioAssociation = Readonly<{
  association_id: string; studio_project_id: string; created_at: string;
  snapshot: ReportStudioMaterialSnapshot; state: 'pending' | 'ready';
}>;
export type ReportStudioProjectIdentity = Readonly<{project_id: string; association_id: string; snapshot_sha256: string}>;
export type ReportStudioSavedExport = Readonly<{
  project_id: string; export_id: string; format: 'pptx' | 'html' | 'pdf';
  created_at: string; artifact_sha256: string; content: Uint8Array; warnings: readonly string[];
}>;

/** Private owned-child v1 channel. No control token, file path, credential or SDK object. */
export type ReportStudioOwnerRequest={type:'owner_request';version:'1';request_id:string;operation:'context'|'deliver'|'receipt';identity:ReportStudioProjectIdentity;source:ReportStudioSource;export_id:string|null};
export type ReportStudioOwnerDelivery={delivery_id:string;association_id:string;export_id:string;format:'pptx'|'html'|'pdf';created_at:string;artifact_sha256:string;bytes:number;warnings:readonly string[];sequence:number;source:ReportStudioSource;classification:'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED'};
export type ReportStudioOwnerValue={operation:'context';state:'available'|'updated'|'unavailable';current_revision:string|null;return_url:string|null}|{operation:'deliver'|'receipt';state:'saved'|'not_found'|'pending';delivery:ReportStudioOwnerDelivery|null};
export type ReportStudioOwnerReply={type:'owner_reply';version:'1';request_id:string;ok:true;value:ReportStudioOwnerValue}|{type:'owner_reply';version:'1';request_id:string;ok:false;error:string};
function ownerFailure():never{throw Object.assign(Error('RS_OWNER_CONTRACT_INVALID'),{code:'RS_OWNER_CONTRACT_INVALID'});}
function ownerObject(value:unknown,keys:readonly string[]):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))ownerFailure();return value as Record<string,unknown>;
}
const ownerUuid=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const ownerToken=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const ownerHash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const ownerRevision=(value:unknown):value is string=>typeof value==='string'&&/^[1-9][0-9]{0,63}$/.test(value);
const ownerSourceKeys=['project_id','task_id','revision','outcome_id','outcome_sha256','scope_sha256'] as const;
function ownerSource(value:unknown):ReportStudioSource{
  const v=ownerObject(value,ownerSourceKeys);if(!ownerUuid(v.project_id)||!ownerUuid(v.task_id)||!ownerUuid(v.outcome_id)||!ownerRevision(v.revision)||!ownerHash(v.outcome_sha256)||!ownerHash(v.scope_sha256))ownerFailure();return v as ReportStudioSource;
}
function ownerIdentity(value:unknown):ReportStudioProjectIdentity{
  const v=ownerObject(value,['project_id','association_id','snapshot_sha256']);if(!ownerToken(v.project_id)||!ownerUuid(v.association_id)||!ownerHash(v.snapshot_sha256))ownerFailure();return v as ReportStudioProjectIdentity;
}
function ownerSize(value:unknown,limit:number){try{if(new TextEncoder().encode(JSON.stringify(value)).length>limit)ownerFailure();}catch{ownerFailure();}}
export function parseReportStudioOwnerRequest(value:unknown):ReportStudioOwnerRequest{
  const v=ownerObject(value,['type','version','request_id','operation','identity','source','export_id']);ownerSize(value,8192);
  if(v.type!=='owner_request'||v.version!=='1'||!ownerUuid(v.request_id)||!['context','deliver','receipt'].includes(String(v.operation))||(v.operation==='context'?v.export_id!==null:!ownerToken(v.export_id)))ownerFailure();ownerIdentity(v.identity);ownerSource(v.source);return structuredClone(value) as ReportStudioOwnerRequest;
}
export function parseReportStudioOwnerValue(value:unknown,request:ReportStudioOwnerRequest):ReportStudioOwnerValue{
  parseReportStudioOwnerRequest(request);ownerSize(value,4*1024*1024);
  if(request.operation==='context'){
    const v=ownerObject(value,['operation','state','current_revision','return_url']);
    if(v.operation!=='context'||!['available','updated','unavailable'].includes(String(v.state)))ownerFailure();
    if(v.state==='unavailable'){if(v.current_revision!==null||v.return_url!==null)ownerFailure();}
    else{
      if(!ownerRevision(v.current_revision)||(v.state==='available')!==(v.current_revision===request.source.revision)||typeof v.return_url!=='string')ownerFailure();
      try{
        const url=new URL(v.return_url),keys=[...url.searchParams.keys()].sort();
        if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port||url.username||url.password||url.pathname!=='/'||url.hash||url.href!==v.return_url||keys.join(',')!=='report-studio-project,report-studio-revision,report-studio-task'||url.searchParams.get('report-studio-project')!==request.source.project_id||url.searchParams.get('report-studio-task')!==request.source.task_id||url.searchParams.get('report-studio-revision')!==request.source.revision)ownerFailure();
      }catch{ownerFailure();}
    }
  }else{
    const v=ownerObject(value,['operation','state','delivery']);if(v.operation!==request.operation||!['saved','not_found','pending'].includes(String(v.state)))ownerFailure();
    if(v.delivery===null){if(request.operation!=='receipt'||v.state==='saved')ownerFailure();}
    else{
      if(v.state!=='saved')ownerFailure();
      const d=ownerObject(v.delivery,['delivery_id','association_id','export_id','format','created_at','artifact_sha256','bytes','warnings','sequence','source','classification']),source=ownerSource(d.source);
      if(!ownerUuid(d.delivery_id)||d.association_id!==request.identity.association_id||d.export_id!==request.export_id||!['pptx','html','pdf'].includes(String(d.format))||!ownerHash(d.artifact_sha256)||!Number.isSafeInteger(d.bytes)||Number(d.bytes)<1||Number(d.bytes)>32*1024*1024||!Number.isSafeInteger(d.sequence)||Number(d.sequence)<1||typeof d.created_at!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(d.created_at)||!Number.isFinite(Date.parse(d.created_at))||d.classification!=='EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED'||!Array.isArray(d.warnings)||d.warnings.length>1000||d.warnings.some(w=>typeof w!=='string'||w.length>2000)||ownerSourceKeys.some(key=>source[key]!==request.source[key]))ownerFailure();
    }
  }
  return structuredClone(value) as ReportStudioOwnerValue;
}
