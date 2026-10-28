import {metricFactoryHttp} from "./metric-factory-http.ts";
import {deepResearchHttp,type ResearchHttpServices} from './deep-research-http.ts';
import {decisionPlatformHttp,type DecisionHttpServices} from './decision-platform-http.ts';
import {reportStudioHttp,type ReportStudioHttpServices} from './report-studio-http.ts';
import {projectReportContent} from '../../packages/product-core/browser-report-content.ts';
import {readFileSync} from 'node:fs';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import {randomBytes, timingSafeEqual,createHash} from 'node:crypto';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {createBrowserMembershipReadbackApplication} from '../../packages/application/browser-membership.ts';
import type {OpenStoredTask} from '../../packages/ports/open-analysis-store.ts';
import type {BrowserMembershipReadback, BrowserWorkspaceCommands} from '../../packages/ports/browser-membership.ts';

const secret = () => randomBytes(32).toString('hex');
const equal = (value: unknown, expected: string) => typeof value === 'string' && Buffer.byteLength(value) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
class HttpFailure extends Error {
  readonly status: number;
  constructor(status: number) { super('Local request rejected'); this.status = status; }
}
function decodeOpenSource(entry:unknown) {
  if(!entry||typeof entry!=='object'||Object.keys(entry).sort().join()!=='base64,display_name,format,source_id')throw new HttpFailure(400);
  const b=Reflect.get(entry,'base64');if(typeof b!=='string'||b.length>Math.ceil(8*1024*1024/3)*4)throw new HttpFailure(400);
  const bytes=Buffer.from(b,'base64');if(bytes.toString('base64')!==b)throw new HttpFailure(400);
  const {base64,...rest}=entry as Record<string,unknown>;void base64;return {...rest,bytes};
}
async function json(req: IncomingMessage,maximum=4096): Promise<unknown> {
  if (req.headers['content-type'] !== 'application/json' || req.headers['content-encoding']) throw new HttpFailure(400);
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) {
    const b = Buffer.from(chunk); size += b.length;
    if (size > maximum) throw new HttpFailure(413);
    chunks.push(b);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new HttpFailure(400); }
}
function reply(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  });
  res.end(JSON.stringify(value));
}

/** Presentation only; storage, Runtime and calculation retain the full snapshot. */
function browserOpenTask(task: Omit<OpenStoredTask,'history'> & {history?:OpenStoredTask['history']},operationActive?:boolean): unknown {
 return {...task,...(operationActive!==undefined?{operation_active:operationActive}:{}),browser_report:projectReportContent(task as OpenStoredTask),browser_view:'1.0',source:{...task.source,sources:task.source.sources.map(source=>({...source,sheets:source.sheets.map(sheet=>({...sheet,full_data_rows:Math.max(0,sheet.rows.length-1),rows:sheet.rows.slice(0,11)}))}))},
 ...(task.history?{history:task.history.map(t=>browserOpenTask(t))}:{})};
}

export type BrowserServiceCommands={credential:string;check?():void;stop():Promise<void>;projects():Promise<unknown>;receipt?(id:string):Promise<unknown>;select(input:unknown):Promise<unknown>;settings(input:unknown):Promise<unknown>};

/** Task-owned loopback composition. No provider, credentials, file selection or service activation. */
export async function startBrowserMembershipServer(deps: {store: BrowserMembershipReadback;metricFactory?:import("../../packages/ports/metric-factory.ts").MetricWorkspace;deepResearch?:ResearchHttpServices;reportStudio?:ReportStudioHttpServices;decisionPlatform?:DecisionHttpServices;workspace?:BrowserWorkspaceCommands;service?:BrowserServiceCommands;open?:ReturnType<typeof import('../../profiles/personal/open-analysis.ts').createPersonalOpenAnalysisWorkspace>}) {
  const app = createBrowserMembershipReadbackApplication(deps.store);
  const workbenchVersion={contract:'BUI-20261015-004',started_at:new Date().toISOString(),pid:process.pid,node:process.version,source_sha256:Object.fromEntries(['apps/browser/local-server.ts','apps/browser/quick-analysis-client.mjs','apps/browser/quick-analysis-workbench.mjs','apps/browser/browser-workbench.css','apps/browser/agent-activity.css','packages/application/open-analysis-workspace.ts','packages/product-core/browser-report-content.ts','adapters/storage-local/open-analysis.ts'].map(path=>[path,createHash('sha256').update(readFileSync(new URL('../../'+path,import.meta.url))).digest('hex')]))};
  const bootstrap = secret(), session = secret();
  let control=secret(),generation=0,owned=!deps.service,selecting=false;
  const bootstraps=new Map<string,number>(),sessions=new Set<string>();
  if(deps.service)bootstraps.set(bootstrap,Date.now()+60000);
  const cookieName = 'xanthil_' + randomBytes(8).toString('hex');
  let consumed = false, closing = false, origin = '';let closePromise:Promise<void>|null=null;
  const server = createServer({maxHeaderSize: 16384, requestTimeout: 5000, headersTimeout: 5000}, (req, res) => {
    void handle(req, res).catch(error => {
      if (res.headersSent) {res.destroy(); return;}
      const code = error instanceof HttpFailure ? null : (error as {code?: unknown})?.code;
      const status = error instanceof HttpFailure ? error.status : code === 'NOT_FOUND' ? 404 : code === 'COMMAND_CONFLICT' ? 409 : 400;
      const sourceReasons:Record<string,string>={MATERIAL_REQUIRED:'还没有分析资料。方案已保存，添加资料后再开始。',FRAMEWORK_REVIEW_REQUIRED:'方案或资料已调整，请再确认一下方案后开始。',ALREADY_STARTED:'这个版本已经开始分析，请先查看结果；停止后可以选择继续。',DRAFT_UNCONFIRMED:'正在确认这次回复是否已保存，请先查看保存结果。',CONFIG_CHANGED:'AI 连接设置与这次任务不一致。方案已保存，请检查连接设置。',SOURCE_LEGACY_READER_UNAVAILABLE:'暂时无法读取旧版 Word/PPT，请导出为 DOCX/PPTX 后添加，原文件不变。',SOURCE_LEGACY_CONVERSION_FAILED:'这份旧版 Word/PPT 没有读取成功，请导出为 DOCX/PPTX 后添加，原文件不变。',SOURCE_IMAGE_READER_UNAVAILABLE:'本机图片识别尚未就绪，可先提供文字版资料。',SOURCE_IMAGE_READER_FAILED:'本机图片识别未完成，原资料保留。请提供清晰图片或文字版。',SOURCE_IMAGE_INVALID:'图片无法可靠解码或超过读取范围，请导出标准PNG/JPEG后重试。',SOURCE_IMAGE_TEXT_EMPTY:'图片中未识别到可读文字，请提供清晰图片或对应文字资料。',SOURCE_PDF_OCR_REQUIRED:'此PDF含扫描页或没有可读取的文字层。请提供文字版PDF，或清晰图片并核对识别结果；原资料保留。',SOURCE_PDF_READER_UNAVAILABLE:'本机PDF文字读取器尚未就绪。可先提供文字版Markdown或Excel资料，原PDF保留。',SOURCE_READER_UNAVAILABLE:'此资料格式的本机读取器尚未就绪。请提供对应文字版或CSV/Excel资料；原资料保留。',SOURCE_UNREADABLE:'这份资料暂时无法可靠解析。请检查文件是否完整，或导出标准文字版/CSV/Excel后再试。',SOURCE_ENCRYPTED:'这份资料已加密，尚未读取。请在本机导出可读取的副本后添加，原件不会改动。',SOURCE_CONTENT_UNSUPPORTED:'资料包含宏、嵌入程序或不支持的内容，未执行。请导出不含这些内容的资料副本。',SOURCE_ARCHIVE_INVALID:'文档内部结构不符合安全读取条件，未继续。请重新导出标准文件。',SOURCE_CAPACITY:'这次资料量超过读取上限，尚未发送给模型。请减少本次资料。'};
      const assetReasons:Record<string,string>={SAP_YAML_INVALID:'发布文件格式无效，候选未保存；请换正确文件。',SAP_YAML_UNSAFE:'发布文件含重复、别名或不支持的标签，未导入。',SAP_ENCODING:'发布文件不是有效UTF-8，未导入。',SAP_FILE_SIZE:'发布文件超出安全读取范围，未导入。',SAP_STRUCTURE:'发布包结构不符合冻结合同，未导入。',SAP_UNKNOWN_FIELD:'发布包含未知字段，未导入；请提供符合合同的版本。',SAP_VERSION:'发布包版本不受支持，未导入。',SAP_RUNTIME_STATE:'发布包不是支持的设计态实例，未导入。',SAP_FINGERPRINT_MISMATCH:'发布包指纹不符，未导入；原配置保留。',SAP_REGISTRY_MISMATCH:'发布登记与包身份不一致，未导入。',SAP_UNREVIEWED:'发布包审核要求未满足，未导入。',SAP_DUPLICATE_IDENTITY:'发布包含重复身份，未导入。',SAP_DANGLING_REFERENCE:'发布包引用不完整，未导入。',SAP_SCENARIO_CYCLE:'发布场景存在循环，未导入。',ASSET_IDENTITY_COLLISION:'同一精确版本的字节不同，未覆盖原候选。',ASSET_RELEASE_UNVERIFIED:'候选发布登记尚未核对，不能批准；请添加匹配登记。',ASSET_UNCOMPUTABLE:'此候选不支持所选复盘，不能批准；请查看具体缺口。',ASSET_OWNER_REQUIRED:'维护者不符或未明确，项目配置未改变。',ASSET_APPROVAL_REVOKED:'本任务口径批准已失效，尚未形成新的成功结果；历史报告保留。',ASSET_DISCLOSURE_REQUIRED:'本次口径材料尚未获得模型外发许可，任务未继续。'};const reason=typeof code==='string'?sourceReasons[code]??assetReasons[code]:undefined;reply(res, status, {error: 'REQUEST_REJECTED',...(reason?{reason}:{})});
    });
  });
  async function handle(req: IncomingMessage, res: ServerResponse) {
    if (closing) throw new HttpFailure(503);deps.service?.check?.();
    const names = req.rawHeaders.filter((_, index) => index % 2 === 0).map(name => name.toLowerCase());
    if (['host', 'origin', 'cookie', 'x-xanthil-control','x-xanthil-service'].some(name => names.filter(n => n === name).length > 1)) throw new HttpFailure(403);
    if (req.socket.remoteAddress !== '127.0.0.1' || req.headers.host !== origin.slice(7)
      || req.headers.origin !== undefined && req.headers.origin !== origin
      || req.headers['sec-fetch-site'] === 'cross-site') throw new HttpFailure(403);
    const rawPath=req.url??'';
    // Public shell only: exact non-secret source identity, not a query credential
    // or a general route/query relaxation. Browser code still authenticates.
    const uuid='[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
    const sourceReturn=new RegExp('^/\\?report-studio-project='+uuid+'&report-studio-task='+uuid+'&report-studio-revision=[1-9][0-9]{0,63}$').test(rawPath);
    const path = sourceReturn?'/':rawPath;
    if(deps.service&&path.startsWith('/v1/service/')){
      if(req.method!=='POST'||req.headers.origin!==undefined||req.headers.cookie!==undefined||req.headers['sec-fetch-site']!==undefined||!equal(req.headers['x-xanthil-service'],deps.service.credential))throw new HttpFailure(403);
      const body=await json(req);if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length)throw new HttpFailure(400);
      if(path==='/v1/service/open'){
        for(const [token,until]of bootstraps)if(until<Date.now())bootstraps.delete(token);
        if(bootstraps.size>=32)throw new HttpFailure(429);
        const token=secret();bootstraps.set(token,Date.now()+60000);reply(res,200,{token});return;
      }
      if(path==='/v1/service/status'){reply(res,200,{running:true});return;}
      if(path==='/v1/service/stop'){reply(res,200,{stopping:true});setImmediate(()=>{void deps.service!.stop();});return;}
      throw new HttpFailure(404);
    }
    const assets:Record<string,[string,string]>={'/browser-workbench.css':['browser-workbench.css','text/css'],'/agent-activity.css':['agent-activity.css','text/css'],'/':['index.html','text/html'],'/bootstrap.mjs':['bootstrap.mjs','text/javascript'],'/workspace.mjs':['workspace.mjs','text/javascript'],'/client.mjs':['client.mjs','text/javascript'],'/read-json.mjs':['read-json.mjs','text/javascript'],'/styles.css':['styles.css','text/css'],'/report-studio-client.mjs':['report-studio-client.mjs','text/javascript'],'/quick-analysis-workbench.mjs':['quick-analysis-workbench.mjs','text/javascript'],'/quick-analysis-client.mjs':['quick-analysis-client.mjs','text/javascript'],'/packages/contracts/open-analysis-findings.mjs':['../../packages/contracts/open-analysis-findings.mjs','text/javascript'],'/quick-analysis-workbench.css':['quick-analysis-workbench.css','text/css'],'/assets/logo.png':['../desktop/assets/juanerai-logo-slogan.png','image/png']};
    assets['/deep-research-client.mjs']=['deep-research-client.mjs','text/javascript'];
    assets['/deep-research.css']=['deep-research.css','text/css'];
    assets['/decision-platform-client.mjs']=['decision-platform-client.mjs','text/javascript'];
    for(const name of ['board.js','reference/styles/tokens.css','reference/index.css','reference/App.css','integration.css','host-theme.css'])assets['/decision-platform/'+name]=['decision-platform/'+name,name.endsWith('.js')?'text/javascript':'text/css'];
    const asset=deps.workspace?assets[path]:undefined;
    if (!asset&&!/^\/v1\/[a-z0-9/-]+$/.test(path)&&!/^\/v1\/report-studio\/[A-Za-z0-9_/-]+$/.test(path)) throw new HttpFailure(404);
    if (req.method !== 'GET' && req.method !== 'POST') throw new HttpFailure(405);
    if (req.method === 'POST' && req.headers.origin !== origin) throw new HttpFailure(403);
    const serve=()=>{res.writeHead(200,{'content-type':asset![1],'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src http://127.0.0.1:*; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});res.end(readFileSync(new URL(asset![0],import.meta.url)));};
    if(asset&&(path==='/'||path==='/bootstrap.mjs')){if(req.method!=='GET')throw new HttpFailure(405);serve();return;}
    if (path === '/v1/bootstrap' && req.method === 'POST') {
      const body = await json(req);
      if ((!deps.service&&consumed) || body === null || typeof body !== 'object' || Object.keys(body).join() !== 'token' || !(deps.service?typeof Reflect.get(body,'token')==='string'&&(bootstraps.get(Reflect.get(body,'token'))??0)>=Date.now():equal(Reflect.get(body, 'token'), bootstrap))) throw new HttpFailure(401);
      consumed = true;
      if(deps.service){bootstraps.delete(Reflect.get(body,'token'));if(sessions.size>=64)throw new HttpFailure(429);}
      const value=deps.service?secret():session;if(deps.service)sessions.add(value);
      res.setHeader('set-cookie', `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/`);
      reply(res, 200, {control:deps.service?null:control,...(deps.service?{service:true}:{})}); return;
    }
    const cookies = (req.headers.cookie ?? '').split(';').map(s => s.trim()).filter(s => s.startsWith(cookieName + '='));
    if (!consumed || cookies.length !== 1 || !(deps.service?sessions.has(cookies[0].slice(cookieName.length+1)):equal(cookies[0].slice(cookieName.length + 1), session))) throw new HttpFailure(401);
    if(asset){if(req.method!=='GET')throw new HttpFailure(405);serve();return;}
    if(path==='/v1/session'&&req.method==='GET'){reply(res,200,{authenticated:true,generation,...(deps.service?{service:true,owned}:{})});return;}
    if(path==='/v1/workbench-version'&&req.method==='GET'){reply(res,200,workbenchVersion);return;}
    if(path==='/v1/control'&&req.method==='POST'){
      const body=await json(req);
      if(!body||typeof body!=='object'||Object.keys(body).sort().join()!=='command_id,confirmed,generation,version'||Reflect.get(body,'version')!=='1.0'||Reflect.get(body,'confirmed')!==true||!membershipUuid(Reflect.get(body,'command_id'))||!Number.isSafeInteger(Reflect.get(body,'generation')))throw new HttpFailure(400);
      if(Reflect.get(body,'generation')!==generation)throw new HttpFailure(409);
      control=secret();owned=true;generation++;reply(res,200,{control,generation});return;
    }
    if(path.startsWith('/v1/metric-factory/')){const grant=req.headers['x-xanthil-control'];await metricFactoryHttp(req,res,{workspace:deps.metricFactory,check(){if(!owned||!equal(grant,control))throw new HttpFailure(403);},json,reply,reject(status):never{throw new HttpFailure(status);}});return;}
    if(path.startsWith('/v1/deep-research/')){const grant=req.headers['x-xanthil-control'];await deepResearchHttp(req,res,{services:deps.deepResearch,checkControl(){if(!owned||!equal(grant,control))throw new HttpFailure(403);},canWrite:owned&&equal(req.headers['x-xanthil-control'],control),json,reply,reject(status):never{throw new HttpFailure(status);}});return;}
    if(path.startsWith('/v1/decision-platform/')){await decisionPlatformHttp(req,res,{services:deps.decisionPlatform,canWrite:owned&&equal(req.headers['x-xanthil-control'],control),json,reply,reject(status):never{throw new HttpFailure(status);}});return;}
    if(path.startsWith('/v1/report-studio/')){await reportStudioHttp(req,res,{services:deps.reportStudio,canWrite:owned&&equal(req.headers['x-xanthil-control'],control),json,reply,reject(status):never{throw new HttpFailure(status);}});return;}
    if(deps.service){
      const projectReceipt=/^\/v1\/projects\/commands\/([a-f0-9-]{36})$/.exec(path);if(projectReceipt&&req.method==='GET'){reply(res,200,await deps.service.receipt?.(projectReceipt[1])??null);return;}
      if(path==='/v1/projects'&&req.method==='GET'){reply(res,200,await deps.service.projects());return;}
      if(path==='/v1/settings'&&req.method==='GET'){reply(res,200,await deps.service.settings({operation:'read'}));return;}
      if(path==='/v1/settings'&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.service.settings(await json(req,8192)));return;}
      if(path==='/v1/projects/select'&&req.method==='POST'){
        if(selecting||owned&&!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);
        const admittedGeneration=generation;
        selecting=true;try{
          const body=await json(req);if(generation!==admittedGeneration)throw new HttpFailure(403);
          const project=await deps.service.select(body);
          if(generation!==admittedGeneration)throw new HttpFailure(403);
          if(!owned){owned=true;control=secret();generation++;}
          reply(res,200,{project,control,generation});
        }finally{selecting=false;}return;
      }
    }
    if(deps.open&&path.startsWith('/v1/open-analysis')){
      const present=(task:OpenStoredTask)=>req.headers['x-xanthil-view']==='browser-v1'?browserOpenTask(task,deps.open!.operationActive(task.identity.task_id)):task;
      const content=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(report-content|report-content-receipts\/[a-f0-9-]{36}|resolve-references)$/.exec(path);
      if(content){const id=content[1]!,kind=content[2]!;
       if(req.method==='GET'&&kind==='report-content'){reply(res,200,deps.open.reportContent(id));return;}
       if(req.method==='GET'&&kind.startsWith('report-content-receipts/')){reply(res,200,deps.open.reportContentReceipt(id,kind.slice('report-content-receipts/'.length)));return;}
       if(req.method!=='POST'||!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);
       const body=await json(req,512*1024);reply(res,200,kind==='resolve-references'?deps.open.resolveReferences(id,body):await deps.open.reportContentCommand(id,body));return;
      }
      const assetReceipt=/^\/v1\/open-analysis\/metric-assets\/commands\/([a-f0-9-]{36})$/.exec(path);if(assetReceipt&&req.method==='GET'){reply(res,200,deps.open.metricAssetCommandReceipt(assetReceipt[1]));return;}
      if(path==='/v1/open-analysis/metric-assets'){
        if(req.method==='GET'){reply(res,200,deps.open.metricAssets());return;}
        if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);
        const raw=await json(req,6*1024*1024);if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new HttpFailure(400);
        if(Reflect.get(raw,'action')==='import'){
          if(Object.keys(raw).sort().join()!==['action','package_base64',...(Object.hasOwn(raw,'registry_base64')?['registry_base64']:[])].sort().join())throw new HttpFailure(400);
          const decode=(key:string)=>{const value=Reflect.get(raw,key);if(typeof value!=='string'||!value.length)throw new HttpFailure(400);const bytes=Buffer.from(value,'base64');if(bytes.length>2*1024*1024||bytes.toString('base64')!==value)throw new HttpFailure(400);return bytes;};
          reply(res,200,deps.open.metricAssetCommand({action:'import',bytes:decode('package_base64'),...(Object.hasOwn(raw,'registry_base64')?{registry:decode('registry_base64')}:{})}));return;
        }
        reply(res,200,deps.open.metricAssetCommand(raw));return;
      }
      const assetAction=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(metric-asset|metric-asset-execute)$/.exec(path);
      if(assetAction&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);reply(res,200,present(await (assetAction[2]==='metric-asset'?deps.open.selectMetricAsset(assetAction[1],body):deps.open.executeMetricAssetRevision(assetAction[1],body))));return;}
      if(path==='/v1/open-analysis/methods'&&req.method==='GET'){reply(res,200,deps.open.methods());return;}
      if(path==='/v1/open-analysis'&&req.method==='GET'){reply(res,200,deps.open.list().map(present));return;}
      if(path==='/v1/open-analysis'&&req.method==='POST'){
        if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);
        const raw=await json(req,45*1024*1024);if(!raw||typeof raw!=='object'||!Array.isArray(Reflect.get(raw,'sources')))throw new HttpFailure(400);
        const sources=Reflect.get(raw,'sources').map(decodeOpenSource);
        const task=await deps.open.submit({...raw,sources});
        // The explicit product submission owns initial admission. Passive reads
        // and requirement drafts never start or resume an Agent operation.
        reply(res,200,present(task.state==='ready'&&task.entry_mode!=='requirements'?await deps.open.start(task.identity.task_id):task));return;
      }
      const submission=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(submission|stop-initial)$/.exec(path);
      if(submission&&req.method==='GET'&&submission[2]==='submission'){const receipt=deps.open.submission(submission[1]);if(!receipt)throw new HttpFailure(404);reply(res,200,receipt);return;}
      if(submission&&req.method==='POST'&&submission[2]==='stop-initial'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);if(!body||typeof body!=='object'||Object.keys(body).length)throw new HttpFailure(400);const receipt=deps.open.submission(submission[1]);if(!receipt)throw new HttpFailure(404);if(receipt.state==='accepted'){const task=await deps.open.stop(submission[1]);reply(res,200,{...receipt,task_state:task.state});}else reply(res,200,deps.open.stopInitial(submission[1]));return;}
      const discussionReceipt=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-discussion-receipts\/([a-f0-9-]{36})$/.exec(path);
      if(discussionReceipt&&req.method==='GET'){reply(res,200,await deps.open.requirementDiscussionReceipt(discussionReceipt[1],discussionReceipt[2]));return;}
      const nativeSession=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/session-control$/.exec(path);
      if(nativeSession&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.open.sessionControl(nativeSession[1],await json(req,64*1024)));return;}
      const requirementDraft=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-draft$/.exec(path);if(requirementDraft&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,present(deps.open.saveRequirementDraft(requirementDraft[1],await json(req,128*1024))));return;}
      const requirementMaterials=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-materials$/.exec(path);if(requirementMaterials&&req.method==='POST'){
       if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const raw=await json(req,45*1024*1024),selected=raw&&typeof raw==='object'?Reflect.get(raw,'sources'):null;if(!Array.isArray(selected))throw new HttpFailure(400);
       const sources=selected.map(decodeOpenSource);reply(res,200,present(await deps.open.addRequirementMaterials(requirementMaterials[1],{...(raw as Record<string,unknown>),sources})));return;
      }
      const requirementAction=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-start$/.exec(path);if(requirementAction&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req,16*1024);reply(res,200,present(await deps.open.startRequirement(requirementAction[1],body)));return;}
      const requirementDiscussion=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-discussion$/.exec(path);if(requirementDiscussion&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req,64*1024) as {command_id:string;expected_sequence:number},task=await deps.open.discussRequirement(requirementDiscussion[1],body),saved=task.requirement_draft?.conversation?.some(c=>c.command_id===body.command_id);reply(res,saved?200:202,Object.assign({},present(task),...(!saved?[{requirement_request:{command_id:body.command_id,expected_sequence:body.expected_sequence,accepted:true}}]:[])));return;}
      const versionChoice=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/select-version$/.exec(path);if(versionChoice&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,present(deps.open.selectVersion(versionChoice[1],await json(req,64*1024))));return;}
      const reportCopy=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/reports\/([1-9][0-9]*)\/([a-f0-9-]{36})\/copy$/.exec(path);
      if(reportCopy&&req.method==='GET'){const value=deps.open.reportCopy(reportCopy[1],reportCopy[2],reportCopy[3]);res.writeHead(200,{'content-type':value.media_type,'content-disposition':`attachment; filename="${value.suggested_file_name}"`,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"});res.end(value.bytes);return;}

      const receipt=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/judgments\/([a-f0-9-]{36})$/.exec(path);if(receipt&&req.method==='GET'){reply(res,200,deps.open.judgmentReceipt(receipt[1],receipt[2]));return;}
      const judgment=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(judgment-target|acknowledge)$/.exec(path);if(judgment&&req.method==='GET'&&judgment[2]==='judgment-target'){reply(res,200,deps.open.judgmentTarget(judgment[1]));return;}if(judgment&&req.method==='POST'&&judgment[2]==='acknowledge'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,deps.open.acknowledge(judgment[1],await json(req,64*1024)));return;}
      const match=/^\/v1\/open-analysis\/([a-f0-9-]{36})(?:\/(stop|resume|revise|diagnostics))?$/.exec(path);
      if(match&&req.method==='GET'&&!match[2]){reply(res,200,present(deps.open.read(match[1])));return;}
      if(match&&req.method==='GET'&&match[2]==='diagnostics'){reply(res,200,await deps.open.diagnostics(match[1]));return;}
      if(match&&req.method==='POST'&&match[2]==='stop'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);if(!body||typeof body!=='object'||Object.keys(body).length)throw new HttpFailure(400);reply(res,200,present(await deps.open.stop(match[1])));return;}
      if(match&&req.method==='POST'&&match[2]==='resume'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);if(!body||typeof body!=='object'||Object.keys(body).length)throw new HttpFailure(400);reply(res,200,present(await deps.open.resume(match[1])));return;}
      if(match&&req.method==='POST'&&match[2]==='revise'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const raw=await json(req,45*1024*1024);if(raw&&typeof raw==='object'&&Object.hasOwn(raw,'sources')){const selected=Reflect.get(raw,'sources');if(!Array.isArray(selected))throw new HttpFailure(400);const sources=selected.map(decodeOpenSource);reply(res,200,present(await deps.open.revise(match[1],{...raw,sources})));}else reply(res,200,present(await deps.open.revise(match[1],raw)));return;}
      throw new HttpFailure(404);
    }
    const copy=/^\/v1\/tasks\/([a-f0-9-]{36})\/reports\/([a-f0-9-]{36})\/copy$/.exec(path);if(copy&&req.method==='GET'){const value=await deps.store.readBrowserReportCopy({task_id:copy[1],report_id:copy[2]});res.writeHead(200,{'content-type':value.media_type,'content-disposition':`attachment; filename="${value.suggested_file_name}"`,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"});res.end(value.bytes);return;}
    if(deps.workspace){
      if(path==='/v1/model-policy'&&req.method==='GET'){reply(res,200,await deps.workspace.modelPolicy());return;}
      const clarification=/^\/v1\/tasks\/([a-f0-9-]{36})\/clarification$/.exec(path);if(clarification&&req.method==='POST'){if(!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.workspace.answer(clarification[1],await json(req,64*1024)));return;}
      const authorization=/^\/v1\/tasks\/([a-f0-9-]{36})\/model-authorization$/.exec(path);if(authorization&&req.method==='POST'){if(!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.workspace.authorizeModel(authorization[1],await json(req)));return;}
      if(path==='/v1/tasks'&&req.method==='GET'){reply(res,200,await deps.workspace.list());return;}
      const command=/^\/v1\/commands\/([a-f0-9-]{36})$/.exec(path);if(command&&req.method==='GET'){reply(res,200,await deps.workspace.command(command[1]));return;}
      const review=/^\/v1\/tasks\/([a-f0-9-]{36})\/review\/(open|save|submit)$/.exec(path);
      if(review&&req.method==='POST'){if(!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.workspace.review(review[1],review[2] as 'open'|'save'|'submit',await json(req,64*1024)));return;}
      const selection=/^\/v1\/tasks\/([a-f0-9-]{36})\/sources$/.exec(path);
      if(req.method==='POST'&&(path==='/v1/tasks'||selection)){
        if(!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);
        if(path==='/v1/tasks'){reply(res,200,await deps.workspace.create(await json(req)));return;}
        const body=await json(req,45*1024*1024);if(!body||typeof body!=='object'||!Array.isArray(Reflect.get(body,'sources')))throw new HttpFailure(400);
        const sources=Reflect.get(body,'sources').map((source:unknown)=>{if(!source||typeof source!=='object'||Object.keys(source).sort().join()!=='base64,display_name,format,source_id')throw new HttpFailure(400);const value=Reflect.get(source,'base64');if(typeof value!=='string'||value.length>Math.ceil(8*1024*1024/3)*4||!value.length||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new HttpFailure(400);const bytes=Buffer.from(value,'base64');if(bytes.toString('base64')!==value)throw new HttpFailure(400);const {base64,...rest}=source as Record<string,unknown>;void base64;return {...rest,bytes};});
        reply(res,200,await deps.workspace.select(selection![1],{...body,sources}));return;
      }
    }
    const match = /^\/v1\/tasks\/([a-f0-9-]{36})(?:\/(stop|receipts)(?:\/([a-f0-9-]{36}))?)?$/.exec(path);
    if (!match) throw new HttpFailure(404);
    const [, taskId, operation, commandId] = match;
    if (req.method === 'GET' && !operation) {reply(res, 200, await app.read(taskId)); return;}
    if (req.method === 'GET' && operation === 'receipts' && commandId) {reply(res, 200, await app.receipt(taskId, commandId)); return;}
    if (req.method === 'POST' && operation === 'stop' && !commandId) {
      if (!equal(req.headers['x-xanthil-control'], control)) throw new HttpFailure(403);
      const receipt=await app.stop(taskId,await json(req));deps.workspace?.stopWork?.(taskId);reply(res,200,receipt);return;
    }
    throw new HttpFailure(405);
  }
  await new Promise<void>((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
  const address = server.address();
  if (!address || typeof address === 'string') {server.close(); throw new Error('LOOPBACK_UNAVAILABLE');}
  origin = `http://127.0.0.1:${address.port}`;
  return {
    origin, bootstrap,
    close() {
      if(closePromise)return closePromise;closing=true;closePromise=(async()=>{try{await deps.workspace?.closeWork?.();}finally{await new Promise<void>((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();});}})();return closePromise;
    },
  };
}
