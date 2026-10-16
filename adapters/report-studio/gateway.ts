import {createHash} from 'node:crypto';
import type {ReportStudioGateway,ReportStudioProjectIdentity,ReportStudioSavedExport} from '../../packages/ports/report-studio.ts';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';

const MAXIMUM=44*1024*1024,ARTIFACT_MAXIMUM=32*1024*1024;
const hash=(value:unknown):value is string=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const token=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
function fail():never{throw Object.assign(new Error('RS_STUDIO_PROTOCOL_UNAVAILABLE'),{code:'RS_STUDIO_PROTOCOL_UNAVAILABLE'});}
function object(value:unknown,keys:readonly string[]):Record<string,unknown> {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))fail();
  return value as Record<string,unknown>;
}
function project(value:unknown,id:string):ReportStudioProjectIdentity {
  const p=object(value,['project_id','association_id','snapshot_sha256']);
  if(p.project_id!==id||!token(p.project_id)||typeof p.association_id!=='string'||!membershipUuid(p.association_id)||!hash(p.snapshot_sha256))fail();
  return {project_id:p.project_id,association_id:p.association_id,snapshot_sha256:p.snapshot_sha256};
}
export type ReportStudioLifecycle=Readonly<{intent:'none'|'wait'|'stop';pending:boolean;request_count:number;configuration_unknown:boolean;operations:readonly Readonly<{project_id:string;title:string;kind:'main'|'image'|'export'|'preview';state:'running'|'stopping'|'unknown';physical_settled:boolean;usage_known:boolean|null}>[]}>;
function lifecycle(raw:unknown):ReportStudioLifecycle{
 const v=object(raw,['intent','pending','request_count','configuration_unknown','operations']);
 if(!['none','wait','stop'].includes(String(v.intent))||typeof v.pending!=='boolean'||!Number.isSafeInteger(v.request_count)||Number(v.request_count)<0||typeof v.configuration_unknown!=='boolean'||!Array.isArray(v.operations)||v.operations.length>10000)fail();
 for(const raw of v.operations){const op=object(raw,['project_id','title','kind','state','physical_settled','usage_known']);if(!token(op.project_id)||typeof op.title!=='string'||!op.title.length||op.title.length>4096||!['main','image','export','preview'].includes(String(op.kind))||!['running','stopping','unknown'].includes(String(op.state))||typeof op.physical_settled!=='boolean'||op.usage_known!==null&&typeof op.usage_known!=='boolean')fail();}
 if(!v.pending&&(v.request_count!==0||v.configuration_unknown||v.operations.length))fail();
 return v as unknown as ReportStudioLifecycle;
}
/** One explicitly composed local instance. No discovery, credentials lookup or retry. */
export type ReportStudioConnection=ReportStudioGateway & {verify():Promise<void>;bootstrap():Promise<string>;prepareClose():Promise<boolean>;lifecycle():Promise<ReportStudioLifecycle>;exitIntent(intent:'wait'|'stop'|'cancel'):Promise<ReportStudioLifecycle>};
export function createReportStudioGateway(config:{origin:string;ownerToken:string;pluginVersion:string;sourceCommit:string;timeoutMs?:number}):ReportStudioConnection {
  const url=new URL(config.origin);
  if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port||config.origin!==url.origin||!/^[a-f0-9]{64}$/.test(config.ownerToken)||!config.pluginVersion.trim()||!/^[a-f0-9]{40}$/.test(config.sourceCommit))fail();
  const timeout=config.timeoutMs??15000;
  if(!Number.isSafeInteger(timeout)||timeout<1||timeout>60000)fail();
  async function request(path:string,body?:unknown,missing=false):Promise<unknown> {
    try {
      const response=await fetch(config.origin+'/api/builtin/bridge'+path,{method:body===undefined?'GET':'POST',redirect:'error',signal:AbortSignal.timeout(timeout),headers:{'x-studio-owner':config.ownerToken,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
      if(missing&&response.status===404){await response.body?.cancel();return null;}
      if(!response.ok||!/^application\/json(?:;|$)/i.test(response.headers.get('content-type')??'')){await response.body?.cancel();fail();}
      const length=response.headers.get('content-length');if(length!==null&&(!/^[0-9]+$/.test(length)||Number(length)>MAXIMUM)){await response.body?.cancel();fail();}
      if(!response.body)fail();const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
      try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>MAXIMUM){await reader.cancel();fail();}chunks.push(part.value);}}finally{reader.releaseLock();}
      return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    }catch{fail();}
  }
  async function handshake() {
    const value=object(await request('/status'),['protocol_version','plugin_version','source_commit','execution']);
    if(value.protocol_version!=='1'||value.plugin_version!==config.pluginVersion||value.source_commit!==config.sourceCommit||!['not_configured','configured'].includes(String(value.execution)))fail();
  }
  return {
    verify:handshake,
    async lifecycle(){await handshake();return lifecycle(await request('/lifecycle'));},
    async exitIntent(intent){if(!['wait','stop','cancel'].includes(intent))fail();await handshake();return lifecycle(await request('/exit-intent',{intent}));},
    async prepareClose(){await handshake();const value=object(await request('/close-intent',{}),['state']);if(!['ready','pending'].includes(String(value.state)))fail();return value.state==='ready';},
    async bootstrap(){await handshake();const value=object(await request('/bootstrap',{}),['token']);if(!hash(value.token))fail();return value.token;},
    async ensureProject(a) {
      if(!membershipUuid(a.association_id)||!token(a.studio_project_id))fail();await handshake();
      const p=project(await request('/associations/'+a.association_id,a),a.studio_project_id);
      if(p.association_id!==a.association_id||p.snapshot_sha256!==a.snapshot.snapshot_sha256)fail();return p;
    },
    async project(id) {if(!token(id))fail();await handshake();const value=await request('/projects/'+id,undefined,true);return value===null?null:project(value,id);},
    async savedExport(id,exportId):Promise<ReportStudioSavedExport|null> {
      if(!token(id)||!token(exportId))fail();await handshake();const raw=await request('/projects/'+id+'/exports/'+exportId,undefined,true);if(raw===null)return null;
      const value=object(raw,['project_id','export_id','format','created_at','artifact_sha256','content_base64','warnings']);
      if(value.project_id!==id||value.export_id!==exportId||!['pptx','html','pdf'].includes(String(value.format))||typeof value.created_at!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value.created_at)||!Number.isFinite(Date.parse(value.created_at))||!hash(value.artifact_sha256)||typeof value.content_base64!=='string'||!Array.isArray(value.warnings)||value.warnings.some(w=>typeof w!=='string'||!w.length))fail();
      const content=Buffer.from(value.content_base64,'base64');
      if(!content.length||content.length>ARTIFACT_MAXIMUM||content.toString('base64')!==value.content_base64||createHash('sha256').update(content).digest('hex')!==value.artifact_sha256)fail();
      return {project_id:id,export_id:exportId,format:value.format as 'pptx'|'html'|'pdf',created_at:value.created_at,artifact_sha256:value.artifact_sha256,content,warnings:value.warnings as string[]};
    }
  };
}
