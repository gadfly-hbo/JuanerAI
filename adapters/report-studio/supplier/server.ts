// Compiled as src/juanerai/server.ts inside the independently pinned supplier.
// This initial service is view/local-material only; model execution admission is a later increment.
import {constants} from 'node:fs';
import {lstat,mkdir,open,readFile,writeFile,rename,realpath} from 'node:fs/promises';
import {isAbsolute,join,resolve,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createReportStudioPolicy} from './policy.js';
import {acquireBuiltinStudioOwner} from './owner.js';
import {assertStudioDataVersion} from './version.js';
import {createStudioCredentialStore} from './credentials.js';
import {createStudioConfiguration} from './configuration.js';
import {builtinModelTargets} from '../agent/builtin-model-targets.js';
import {createBuiltinAgentHosts} from '../agent/builtin-hosts.js';
import {z} from 'zod';
import {createReportStudioLocalAccess} from './local-access.js';
import {parseReportStudioOwnerValue,type ReportStudioOwnerRequest,type ReportStudioOwnerValue,type ReportStudioAssociation,type ReportStudioProjectIdentity} from './contract.js';

const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const uuid=z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
const hash=z.string().regex(/^[a-f0-9]{64}$/),token=z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const sourceSchema=z.object({project_id:uuid,task_id:uuid,revision:z.string().regex(/^[1-9][0-9]*$/),outcome_id:uuid,outcome_sha256:hash,scope_sha256:hash}).strict();
const materialSchema=z.object({material_id:z.enum(['conclusion','table']),label:z.string().min(1),text:z.string().min(1),classification:z.enum(['MODEL_EXPLANATION','ANALYSIS_CALCULATION']),source:sourceSchema,verification:z.enum(['not_performed','independent_arithmetic','source_attribution']),limitations:z.array(z.string().min(1)).min(1)}).strict();
const associationSchema=z.object({association_id:uuid,studio_project_id:token,created_at:z.string().datetime(),state:z.literal('pending'),snapshot:z.object({schema_version:z.literal('1'),title:z.string().min(1),source:sourceSchema,materials:z.array(materialSchema).min(1),snapshot_sha256:hash}).strict()}).strict();
type Receipt={version:1;input_sha256:string;association:ReportStudioAssociation;state:'creating'|'ready'};
function fail(code:string,statusCode=409):never {throw Object.assign(new Error(code),{code,statusCode});}
async function safeDirectory(path:string) {const s=await lstat(path);if(!s.isDirectory()||s.isSymbolicLink())fail('RS_STORE_UNSAFE');}
async function boundedFile(path:string,maximum:number) {
  const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try {
    const before=await file.stat();if(!before.isFile()||before.nlink!==1||before.size>maximum)fail('RS_FILE_INVALID');
    const chunks:Buffer[]=[];let length=0;
    while(true) {const buffer=Buffer.alloc(Math.min(65536,maximum-length+1));const {bytesRead}=await file.read(buffer,0,buffer.length,null);if(!bytesRead)break;length+=bytesRead;if(length>maximum)fail('RS_FILE_INVALID');chunks.push(buffer.subarray(0,bytesRead));}
    const after=await file.stat();if(length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)fail('RS_FILE_INVALID');
    return Buffer.concat(chunks);
  }finally{await file.close();}
}

type Dependencies={credentials?:ReturnType<typeof createStudioCredentialStore>;createHosts?:typeof createBuiltinAgentHosts;requestOwner?(request:ReportStudioOwnerRequest):Promise<ReportStudioOwnerValue>};
// In-process composition seam only; the child IPC configuration is separately
// closed and never accepts implementations, credentials or transport overrides.
export async function startBuiltinStudio(config:{dataRoot:string;webDist:string;ownerToken:string;pluginVersion:string},dependencies:Dependencies={}) {
  if(process.env['REPORT_STUDIO_BUILTIN']!=='1')fail('RS_BUILTIN_REQUIRED');
  // No implicit environment configuration in this view-only increment.
  if(['MINIMAX_CN_API_KEY','MINIMAX_API_KEY','XIAOMI_TOKEN_PLAN_CN_API_KEY'].some(key=>!!process.env[key]))fail('RS_EXPLICIT_CONFIGURATION_REQUIRED');
  if(!isAbsolute(config.dataRoot)||!isAbsolute(config.webDist)||!config.pluginVersion.trim())fail('RS_CONFIGURATION_INVALID');
  const program=resolve(config.webDist,'..');
  if(resolve(config.dataRoot)===program||resolve(config.dataRoot).startsWith(program+sep))fail('RS_DATA_ROOT_INVALID');
  await mkdir(config.dataRoot,{recursive:true,mode:0o700});await safeDirectory(config.dataRoot);
  const dataRoot=await realpath(config.dataRoot),receipts=join(dataRoot,'.juanerai-associations');
  const owner=acquireBuiltinStudioOwner(dataRoot);
  try {
  await assertStudioDataVersion(dataRoot,config.pluginVersion);
  await mkdir(receipts,{recursive:true,mode:0o700});await safeDirectory(receipts);
  const {WorkspaceStore}=await import('../storage/workspace.js');
  const {buildServer}=await import('../server/app.js');
  const {ingestAndSave}=await import('../ingest/persist.js');
  const {indexMaterial}=await import('../agent/materials.js');
  const store=new WorkspaceStore(dataRoot),creating=new Map<string,{fingerprint:string;work:Promise<ReportStudioProjectIdentity>}>();
  const policy=createReportStudioPolicy({dataRoot,now:()=>new Date().toISOString()});
  let agents:ReturnType<typeof createBuiltinAgentHosts>|null=null;
  if(policy.activeOperations().length)policy.recover();
  const configuration=createStudioConfiguration({dataRoot,credentials:dependencies.credentials??createStudioCredentialStore(fileURLToPath(new URL('../../../bin/report-studio-keychain',import.meta.url))),canChange:async()=>!policy.activeOperations().length&&!creating.size&&(!agents||await agents.isIdle()),newId:randomUUID});
  async function permissionBoundary(id:string){
    token.parse(id);await safeDirectory(join(dataRoot,id));if(!await store.getProject(id))fail('RS_NOT_FOUND',404);
    const state=await configuration.status(),recipients=builtinModelTargets(state.providers);
    const materials=[],material_labels:Record<string,string>={};
    for(const asset of await store.listSourceAssets(id)){
      token.parse(asset.source_id);hash.parse(asset.file_hash);material_labels[asset.source_id]=asset.filename;
      const bytes=await store.readSourceContent(id,asset.source_id);if(sha(bytes)!==asset.file_hash)fail('RS_MATERIAL_CHANGED');
      materials.push({source_id:asset.source_id,sha256:asset.file_hash,kind:asset.kind==='image'?'image' as const:'text' as const});
    }
    return {configuration:state,recipients,materials,material_labels,boundary:{recipients_sha256:sha(JSON.stringify(recipients)),materials}};
  }

  let origin='',closing=false,exitIntent:'none'|'wait'|'stop'='none',stopped=false,ownerConnected=true,ownerLoss:Promise<void>|null=null;const mutations=new Set<string>(),projectWrites=new Map<string,string>(),localOperations=new Map<string,{id:string;projectId:string;kind:'export'|'preview'}>(),localFailures=new Set<string>();const access=createReportStudioLocalAccess({origin:()=>origin,ownerToken:config.ownerToken});
  const builtinAgents=agents=(dependencies.createHosts??createBuiltinAgentHosts)({dataRoot,skillsDir:join(program,'assets/skills/ppt'),policy,configuration,boundary:async id=>(await permissionBoundary(id)).boundary,projectExists:async id=>!!await store.getProject(id),admissionAllowed:()=>!closing&&!stopped&&exitIntent==='none'});
  const receiptPath=(id:string)=>join(receipts,uuid.parse(id)+'.json');
  async function readReceipt(id:string):Promise<Receipt|null> {
    await safeDirectory(receipts);
    try {
      const value=JSON.parse((await boundedFile(receiptPath(id),8*1024*1024)).toString('utf8')) as Receipt;
      const a=associationSchema.parse(value.association);
      if(value.version!==1||!['creating','ready'].includes(value.state)||a.association_id!==id||sha(JSON.stringify(a))!==value.input_sha256)fail('RS_BRIDGE_INTEGRITY');
      return {...value,association:a};
    }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}
  }
  async function replaceReceipt(value:Receipt) {
    const path=receiptPath(value.association.association_id),temporary=path+'.'+randomUUID()+'.tmp';
    await writeFile(temporary,JSON.stringify(value),{flag:'wx',mode:0o600});await rename(temporary,path);
  }
  async function ensureProject(raw:unknown,id:string):Promise<ReportStudioProjectIdentity> {
    const a=associationSchema.parse(raw);
    if(a.association_id!==id||new Set(a.snapshot.materials.map(m=>m.material_id)).size!==a.snapshot.materials.length
      ||a.snapshot.materials.some(m=>JSON.stringify(m.source)!==JSON.stringify(a.snapshot.source)))fail('RS_ASSOCIATION_INVALID',400);
    const fingerprint=sha(JSON.stringify(a)),prior=await readReceipt(id);
    if(prior&&prior.input_sha256!==fingerprint)fail('RS_ASSOCIATION_CONFLICT');
    try{await safeDirectory(join(dataRoot,a.studio_project_id));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
    let project=await store.getProject(a.studio_project_id);
    if(prior?.state==='ready'&&!project)fail('RS_STUDIO_PROJECT_UNAVAILABLE');
    if(prior?.state==='ready')return {project_id:a.studio_project_id,association_id:id,snapshot_sha256:a.snapshot.snapshot_sha256};
    if(!prior) {
      if(project)fail('RS_ASSOCIATION_CONFLICT');
      await writeFile(receiptPath(id),JSON.stringify({version:1,input_sha256:fingerprint,association:a,state:'creating'}),{flag:'wx',mode:0o600});
    }
    if(!project)project=await store.createProject({project_id:a.studio_project_id,title:a.snapshot.title,purpose:'JuanerAI 关联报告；内容可编辑，新增内容未经原分析核验。'});
    await safeDirectory(join(dataRoot,project.project_id));
    for(const material of a.snapshot.materials) {
      const content=Buffer.from(`# ${material.label}\n\n${material.text}\n\n## 来源及核验范围\n${JSON.stringify(material.source)}\n核验：${material.verification}\n分类：${material.classification}\n\n${material.limitations.join('\n')}\n`);
      const asset=await ingestAndSave(store,project.project_id,{filename:`JuanerAI-${material.material_id}.md`,content,kind:'markdown',media_type:'text/markdown'});
      if(!asset.ok)fail('RS_MATERIAL_SAVE_FAILED');
      await indexMaterial({projectRoot:join(dataRoot,project.project_id),asset,content,mediaType:'text/markdown'});
    }
    const receipt:Receipt={version:1,input_sha256:fingerprint,association:a,state:'ready'};await replaceReceipt(receipt);
    return {project_id:project.project_id,association_id:id,snapshot_sha256:a.snapshot.snapshot_sha256};
  }
  async function projectIdentity(id:string):Promise<ReportStudioProjectIdentity|null> {
    token.parse(id);
    try{await safeDirectory(join(dataRoot,id));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}
    const project=await store.getProject(id);if(!project)return null;
    // Only owned binding receipts qualify; independent projects never acquire an association.
    const {readdir}=await import('node:fs/promises');
    for(const file of await readdir(receipts))if(/^[a-f0-9-]{36}\.json$/.test(file)) {
      const receipt=await readReceipt(file.slice(0,-5));
      if(receipt?.state==='ready'&&receipt.association.studio_project_id===id)return {project_id:id,association_id:receipt.association.association_id,snapshot_sha256:receipt.association.snapshot.snapshot_sha256};
    }
    return null;
  }
  async function prepareClose(){
    if(stopped)return true;closing=true;
    try{if(mutations.size||creating.size||policy.activeOperations().length||!await builtinAgents.isIdle()||(await configuration.status()).state==='unknown'){closing=false;return false;}return true;}
    catch(error){closing=false;throw error;}
  }
  async function lifecycle(){
    const operations=await Promise.all(policy.activeOperations().map(async op=>({project_id:op.project_id,title:(await store.getProject(op.project_id))?.title??'项目暂不可读',kind:op.kind,state:op.state,physical_settled:op.physical_settled,usage_known:op.usage_known})));
    const configurationUnknown=(await configuration.status()).state==='unknown';
    return {intent:exitIntent,pending:!!(mutations.size||creating.size||operations.length||!await builtinAgents.isIdle()||configurationUnknown),request_count:mutations.size+creating.size,configuration_unknown:configurationUnknown,operations};
  }
  async function requestExit(intent:'wait'|'stop'|'cancel'){
    if(stopped||!ownerConnected)fail('RS_STUDIO_UNAVAILABLE');exitIntent=intent==='cancel'?'none':intent;
    if(intent==='stop'){
      for(const op of localOperations.values())policy.stop(op.id);
      await builtinAgents.stopOwned();
    }
    return lifecycle();
  }
  async function ownerRequest(id:string,operation:ReportStudioOwnerRequest['operation'],exportId:string|null=null){
    const identity=await projectIdentity(id);if(!identity)fail('RS_INDEPENDENT_PROJECT');const receipt=await readReceipt(identity.association_id);if(!receipt||receipt.state!=='ready')fail('RS_NOT_FOUND',404);
    const request:ReportStudioOwnerRequest={type:'owner_request',version:'1',request_id:randomUUID(),operation,identity,source:receipt.association.snapshot.source,export_id:exportId};
    if(!dependencies.requestOwner)fail('RS_OWNER_UNAVAILABLE');return parseReportStudioOwnerValue(await dependencies.requestOwner(request),request);
  }
  type RequestObservation={inHook:boolean;handler:boolean;done:boolean;closed:boolean;failed:boolean;settled:boolean};
  const requestStates=new WeakMap<object,RequestObservation>();
  function finishRequest(id:string,state:RequestObservation,status:number,responded=false){
    if(state.settled||state.inHook||state.handler||!responded&&!state.closed)return;state.settled=true;
    try{const op=localOperations.get(id);if(op){if(state.failed||status<200||status>=300||!state.done)localFailures.add(op.id);localOperations.delete(id);if(![...localOperations.values()].some(value=>value.id===op.id)){policy.finish(op.id,{outcome:localFailures.has(op.id)?'failed':'succeeded',physical_settled:true,usage_known:true,sdk_run_id:null});localFailures.delete(op.id);}}}
    finally{mutations.delete(id);projectWrites.delete(id);}
  }
  const app=buildServer(store,config.webDist,app=>{
    app.addHook('onRoute',route=>{
      const handler=route.handler;
      route.handler=async function(req,reply){
        const state=requestStates.get(req);if(state?.closed)fail('RS_REQUEST_ABORTED');if(state)state.handler=true;
        try{return await handler.call(this,req,reply);}catch(error){if(state)state.failed=true;throw error;}
        finally{if(state){state.handler=false;state.done=true;finishRequest(req.id,state,reply.statusCode);}}
      };
    });
    app.addHook('onRequest',async(req,reply)=>{
      let observation:RequestObservation|undefined;
      try{
      access.authorize(req.raw);
      if(!ownerConnected)fail('RS_STUDIO_UNAVAILABLE');
      const path=new URL(req.url,'http://127.0.0.1').pathname,closeIntent=path==='/api/builtin/bridge/close-intent',exitControl=['/api/builtin/bridge/lifecycle','/api/builtin/bridge/exit-intent'].includes(path),sessionControl=['/api/builtin/session','/api/builtin/bridge/bootstrap'].includes(path),recovery=/^\/api\/projects\/[^/]+\/agent\/(?:stop|recover)$/.test(path);
      const execution=/^\/api\/projects\/[^/]+\/(?:chat$|export$|outline\/confirm$|agent\/recover$|deck\/preview\/)/.test(path);
      if((closing||exitIntent!=='none')&&(req.method!=='GET'||execution)&&!closeIntent&&!exitControl&&!sessionControl&&!recovery)fail('RS_MODULE_CLOSING');
      if(req.url.startsWith('/api/')&&!closeIntent&&!exitControl&&!/\/agent\/events$/.test(req.url)){
        observation={inHook:true,handler:false,done:false,closed:false,failed:false,settled:false};const state=observation;requestStates.set(req,state);mutations.add(req.id);
        reply.raw.once('close',()=>{state.closed=true;try{finishRequest(req.id,state,reply.statusCode);}catch{/* Persistent policy failure remains a close barrier. */}});
      }
      const projectWrite=path.match(/^\/api\/(?:builtin\/browser\/)?projects\/([A-Za-z0-9_-]{1,128})(?:\/|$)/);if(req.method!=='GET'&&projectWrite)projectWrites.set(req.id,projectWrite[1]);
      // Main requests now use the fixed Factory's mode/config/grant admission.
      const local=path.match(/^\/api\/projects\/([A-Za-z0-9_-]{1,128})\/(export|deck\/preview\/[A-Za-z0-9_-]{1,128})$/);
      if(local&&(local[2]==='export'?req.method==='POST':req.method==='GET')){
        const id=local[1];await safeDirectory(join(dataRoot,id));if(!await store.getProject(id))fail('RS_NOT_FOUND',404);
        if(!policy.mode().accepted)fail('RS_LOCAL_MODE_REQUIRED');
        if(closing||stopped||exitIntent!=='none')fail('RS_MODULE_CLOSING');const kind=local[2]==='export'?'export':'preview';
        // A deck view requests several thumbnails concurrently. They share only
        // this owned local preview observation; no model/export work joins it.
        const preview=kind==='preview'?[...localOperations.values()].find(value=>value.projectId===id&&value.kind==='preview'&&policy.operation(value.id)?.state==='running'):null;
        if(observation?.closed)fail('RS_REQUEST_ABORTED');
        const operationId=preview?.id??policy.begin(id,randomUUID(),kind,{recipients_sha256:'0'.repeat(64),materials:[]}).operation_id;localOperations.set(req.id,{id:operationId,projectId:id,kind});
      }else if(execution&&!/^\/api\/projects\/[A-Za-z0-9_-]{1,128}\/(?:chat|outline\/confirm|agent\/recover)$/.test(path))fail('RS_EXECUTION_NOT_CONFIGURED',403);
      const stop=path.match(/^\/api\/projects\/([A-Za-z0-9_-]{1,128})\/agent\/stop$/);
      if(stop&&req.method==='POST')for(const op of localOperations.values())if(op.projectId===stop[1])policy.stop(op.id);
      }catch(error){if(observation)observation.failed=true;throw error;}
      finally{if(observation){observation.inHook=false;finishRequest(req.id,observation,reply.statusCode);}}
    });
    app.addHook('onResponse',async(req,reply)=>{const state=requestStates.get(req);if(state)finishRequest(req.id,state,reply.statusCode,true);});
    app.addHook('onSend',async(_req,reply,payload)=>{
      reply.header('cache-control','no-store').header('referrer-policy','no-referrer').header('x-content-type-options','nosniff');
      reply.header('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");return payload;
    });
    app.post('/api/builtin/session',async(req,reply)=>{const value=z.object({token:z.string()}).strict().parse(req.body);reply.header('set-cookie',access.acceptBootstrap(value.token));return {ready:true};});
    app.get('/api/builtin/browser/status',async()=>({ready:true,exit_intent:exitIntent}));
    // Closed browser routes: owner control tokens never authorize product decisions.
    const browserRoute=<T>(work:()=>Promise<T>|T,reply:{code(n:number):unknown})=>Promise.resolve().then(work).catch(error=>{
      const code=typeof error?.code==='string'&&/^RS_[A-Z0-9_]+$/.test(error.code)?error.code:'RS_REQUEST_INVALID';
      reply.code(error?.statusCode===404?404:code==='RS_REQUEST_INVALID'?400:409);return {error:code};
    });
    app.get('/api/builtin/browser/projects/:id/context',async(req,reply)=>browserRoute(async()=>{
      const id=token.parse((req.params as {id:string}).id);if(!await store.getProject(id))fail('RS_NOT_FOUND',404);const identity=await projectIdentity(id);
      if(!identity)return {kind:'independent',source:null,context:null};const receipt=await readReceipt(identity.association_id);if(!receipt)fail('RS_NOT_FOUND',404);
      let context:ReportStudioOwnerValue|null=null;try{context=await ownerRequest(id,'context');}catch{/* A failed read is not proof that the original target was deleted. */}
      return {kind:'associated',title:receipt.association.snapshot.title,source:receipt.association.snapshot.source,context};
    },reply));
    app.post('/api/builtin/browser/projects/:id/deliveries/:export_id',async(req,reply)=>browserRoute(async()=>{
      z.object({}).strict().parse(req.body);const {id,export_id}=req.params as {id:string;export_id:string};return ownerRequest(token.parse(id),'deliver',token.parse(export_id));
    },reply));
    app.get('/api/builtin/browser/projects/:id/deliveries/:export_id',async(req,reply)=>browserRoute(async()=>{
      const {id,export_id}=req.params as {id:string;export_id:string};return ownerRequest(token.parse(id),'receipt',token.parse(export_id));
    },reply));
    app.get('/api/builtin/browser/configuration',async(_req,reply)=>browserRoute(()=>configuration.status(),reply));
    app.post('/api/builtin/browser/configuration',{bodyLimit:16384},async(req,reply)=>browserRoute(async()=>{
      const body=z.object({revision:z.number().int().nonnegative(),provider:z.enum(['minimax-cn','xiaomi-token-plan-cn']),key:z.string().min(1).max(4096)}).strict().parse(req.body);
      try{return await configuration.save(body.provider,body.key,body.revision);}finally{builtinAgents.clearIdleCredentials();}
    },reply));
    app.delete('/api/builtin/browser/configuration',async(req,reply)=>browserRoute(async()=>{
      const body=z.object({revision:z.number().int().nonnegative(),provider:z.enum(['minimax-cn','xiaomi-token-plan-cn'])}).strict().parse(req.body);try{return await configuration.remove(body.provider,body.revision);}finally{builtinAgents.clearIdleCredentials();}
    },reply));
    app.get('/api/builtin/browser/mode',async(_req,reply)=>browserRoute(()=>policy.mode(),reply));
    app.post('/api/builtin/browser/projects/:id/images/:sid/understand',async(req,reply)=>browserRoute(async()=>{
      z.object({}).strict().parse(req.body);const {id,sid}=req.params as {id:string;sid:string};token.parse(id);token.parse(sid);await permissionBoundary(id);
      const asset=(await store.listSourceAssets(id)).find(asset=>asset.source_id===sid);if(!asset||asset.kind!=='image')fail('RS_NOT_FOUND',404);
      const content=await store.readSourceContent(id,sid);if(sha(content)!==asset.file_hash)fail('RS_MATERIAL_CHANGED');
      const extension=asset.filename.split('.').at(-1)?.toLowerCase(),mime=extension==='jpg'||extension==='jpeg'?'image/jpeg':extension==='webp'?'image/webp':extension==='gif'?'image/gif':extension==='png'?'image/png':null;if(!mime)fail('RS_IMAGE_INVALID');
      const description=await builtinAgents.describeImage(id,sid,content,mime);
      const current=(await store.listSourceAssets(id)).find(asset=>asset.source_id===sid);if(!current||current.file_hash!==asset.file_hash||sha(await store.readSourceContent(id,sid))!==asset.file_hash)fail('RS_MATERIAL_CHANGED');
      return {material:await indexMaterial({projectRoot:join(dataRoot,id),asset,content,mediaType:mime,imageDescription:description})};
    },reply));
    app.post('/api/builtin/browser/mode',async(req,reply)=>browserRoute(()=>{
      const body=z.object({revision:z.number().int().nonnegative(),accepted:z.boolean()}).strict().parse(req.body);return policy.setMode(body.revision,body.accepted);
    },reply));
    app.get('/api/builtin/browser/projects/:id/permissions',async(req,reply)=>browserRoute(async()=>{
      const id=token.parse((req.params as {id:string}).id),current=await permissionBoundary(id);
      return {...current,permission:policy.permissions(id,current.boundary),operations:policy.projectOperations(id)};
    },reply));
    app.post('/api/builtin/browser/projects/:id/permissions',async(req,reply)=>browserRoute(async()=>{
      const id=token.parse((req.params as {id:string}).id),body=z.object({revision:z.number().int().nonnegative(),recipients_sha256:hash,materials:z.array(z.object({source_id:token,sha256:hash,kind:z.enum(['text','image'])}).strict()).max(1000),allow_prompt:z.boolean(),allow_screenshots:z.boolean(),allow_network:z.boolean()}).strict().parse(req.body),current=await permissionBoundary(id);
      if(current.configuration.state!=='ready')fail('RS_CONFIGURATION_UNAVAILABLE');
      const {revision,...grant}=body;return policy.grant(id,revision,grant,current.boundary);
    },reply));
    app.delete('/api/builtin/browser/projects/:id/permissions',async(req,reply)=>browserRoute(async()=>{
      const id=token.parse((req.params as {id:string}).id);await permissionBoundary(id);const body=z.object({revision:z.number().int().nonnegative()}).strict().parse(req.body);return policy.revoke(id,body.revision);
    },reply));

    app.get('/api/builtin/bridge/status',async()=>({protocol_version:'1',plugin_version:config.pluginVersion,source_commit:'74ebb609fd73cf263614ffc9301dafaafcec4230',execution:(await configuration.status()).state==='ready'?'configured':'not_configured'}));
    app.get('/api/builtin/bridge/lifecycle',async()=>lifecycle());
    app.post('/api/builtin/bridge/exit-intent',async(req,reply)=>browserRoute(async()=>{const body=z.object({intent:z.enum(['wait','stop','cancel'])}).strict().parse(req.body);return requestExit(body.intent);},reply));
    app.post('/api/builtin/bridge/close-intent',async req=>{z.object({}).strict().parse(req.body);return {state:await prepareClose()?'ready':'pending'};});
    app.post('/api/builtin/bridge/bootstrap',async req=>{z.object({}).strict().parse(req.body);return {token:access.issueBootstrap()};});
    app.post('/api/builtin/bridge/associations/:id',{bodyLimit:8*1024*1024},async req=>{
      const id=uuid.parse((req.params as {id:string}).id),input=associationSchema.parse(req.body),fingerprint=sha(JSON.stringify(input)),pending=creating.get(id);
      if(pending){if(pending.fingerprint!==fingerprint)fail('RS_ASSOCIATION_CONFLICT');return pending.work;}
      const work=ensureProject(input,id).finally(()=>creating.delete(id));creating.set(id,{fingerprint,work});return work;
    });
    app.get('/api/builtin/bridge/projects/:id',async req=>{const p=await projectIdentity((req.params as {id:string}).id);if(!p)fail('RS_NOT_FOUND',404);return p;});
    app.get('/api/builtin/bridge/projects/:id/exports/:export_id',async req=>{
      const {id,export_id}=req.params as {id:string;export_id:string};token.parse(id);token.parse(export_id);
      if(!await projectIdentity(id))fail('RS_NOT_FOUND',404);
      const directory=join(dataRoot,id,'exports');await safeDirectory(join(dataRoot,id));await safeDirectory(directory);
      type Checks={items?:{status:string;detail:string}[];message?:string;ok?:boolean};
      const record=JSON.parse((await boundedFile(join(directory,export_id+'.json'),1024*1024)).toString('utf8')) as {export_id:string;format:string;artifact_path:string;artifact_hash:string;created_at:string;checks?:Checks&{qa?:Checks}};
      if(record.export_id!==export_id||!['pptx','html','pdf'].includes(record.format)||record.artifact_path!==`exports/${export_id}.${record.format}`)fail('RS_EXPORT_INVALID');
      const content=await boundedFile(join(directory,`${export_id}.${record.format}`),32*1024*1024);
      if(!content.length||sha(content)!==record.artifact_hash)fail('RS_EXPORT_INVALID');
      const checks=record.checks?.qa??record.checks,warnings=(checks?.items??[]).filter(item=>item.status==='flag').map(item=>item.detail);
      if(checks?.ok===false&&checks.message)warnings.unshift(checks.message);
      return {project_id:id,export_id,format:record.format,created_at:record.created_at,artifact_sha256:record.artifact_hash,content_base64:content.toString('base64'),warnings};
    });
  },{...builtinAgents,remove:async id=>{token.parse(id);if(creating.size||[...projectWrites.values()].filter(value=>value===id).length>1)fail('RS_PROJECT_PENDING');await builtinAgents.remove(id,()=>store.deleteProject(id));},operation:id=>{token.parse(id);return policy.projectOperations(id).at(-1)??null;},recover:async id=>{
    token.parse(id);await permissionBoundary(id);await builtinAgents.reconcile(id);return {ok:true};
  }});
  try {await app.listen({port:0,host:'127.0.0.1'});}catch(error){access.close();await app.close();throw error;}
  const address=app.server.address();if(!address||typeof address==='string'){await app.close();fail('RS_LOOPBACK_UNAVAILABLE');}
  origin=`http://127.0.0.1:${address.port}`;
  return {origin,async ownerLost(){
    if(ownerLoss)return ownerLoss;if(stopped)return;ownerConnected=false;closing=true;
    ownerLoss=(async()=>{
      for(const op of localOperations.values())policy.stop(op.id);
      await builtinAgents.ownerLost();
      // Configuration/material/bridge writes already admitted keep the ownership
      // lease until their handlers and readbacks finish. Never infer completion
      // from a disconnected HTTP client or aborting the socket.
      while(mutations.size||creating.size)await new Promise(resolve=>setTimeout(resolve,5));
      access.close();await app.close();stopped=true;owner.close();
    })();return ownerLoss;
  },async close(){
    if(ownerLoss)return ownerLoss;
    if(stopped)return;if(!await prepareClose())fail('RS_PROJECT_PENDING');
    await builtinAgents.close();access.close();await app.close();stopped=true;owner.close();
  }};
  } catch(error){owner.close();throw error;}
}
