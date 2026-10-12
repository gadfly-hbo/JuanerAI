import {reportUserHistory} from '../../packages/product-core/open-analysis-report-review.ts';
import {readFileSync} from 'node:fs';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import {randomBytes, timingSafeEqual} from 'node:crypto';
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
function browserOpenTask(task: Omit<OpenStoredTask,'history'> & {history?:OpenStoredTask['history']}): unknown {
 return {...task,browser_view:'1.0',revision_preview_supported:true,plan_reuse_supported:true,source:{...task.source,sources:task.source.sources.map(source=>({...source,sheets:source.sheets.map(sheet=>({...sheet,full_data_rows:Math.max(0,sheet.rows.length-1),rows:sheet.rows.slice(0,11)}))}))},
 checkpoint:task.checkpoint?{...task.checkpoint,messages:reportUserHistory(task.checkpoint.messages,task.identity.task_id).map(message=>{
 if(message.speaker==='tool'){const {result,...visible}=message;void result;return visible;}
 if(message.speaker==='assistant'){const {calls,...visible}=message;void calls;return visible;}
 return message;})}:task.checkpoint,...(task.history?{history:task.history.map(browserOpenTask)}:{})};
}

export type BrowserServiceCommands={credential:string;check?():void;stop():Promise<void>;projects():Promise<unknown>;receipt?(id:string):Promise<unknown>;select(input:unknown):Promise<unknown>;settings(input:unknown):Promise<unknown>};

/** Task-owned loopback composition. No provider, credentials, file selection or service activation. */
export async function startBrowserMembershipServer(deps: {store: BrowserMembershipReadback;workspace?:BrowserWorkspaceCommands;service?:BrowserServiceCommands;formalMember?:ReturnType<typeof import('../../packages/application/browser-membership.ts').createOpenMemberCaseAdmission>;open?:ReturnType<typeof import('../../profiles/personal/open-analysis.ts').createPersonalOpenAnalysisWorkspace>}) {
  const app = createBrowserMembershipReadbackApplication(deps.store);
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
      const reason=typeof code==='string'?sourceReasons[code]:undefined;reply(res, status, {error: 'REQUEST_REJECTED',...(reason?{reason}:{})});
    });
  });
  async function handle(req: IncomingMessage, res: ServerResponse) {
    if (closing) throw new HttpFailure(503);deps.service?.check?.();
    const names = req.rawHeaders.filter((_, index) => index % 2 === 0).map(name => name.toLowerCase());
    if (['host', 'origin', 'cookie', 'x-xanthil-control','x-xanthil-service'].some(name => names.filter(n => n === name).length > 1)) throw new HttpFailure(403);
    if (req.socket.remoteAddress !== '127.0.0.1' || req.headers.host !== origin.slice(7)
      || req.headers.origin !== undefined && req.headers.origin !== origin
      || req.headers['sec-fetch-site'] === 'cross-site') throw new HttpFailure(403);
    const path = req.url ?? '';
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
    const assets:Record<string,[string,string]>={'/':['index.html','text/html'],'/bootstrap.mjs':['bootstrap.mjs','text/javascript'],'/workspace.mjs':['workspace.mjs','text/javascript'],'/client.mjs':['client.mjs','text/javascript'],'/styles.css':['styles.css','text/css'],'/quick-analysis-workbench.mjs':['quick-analysis-workbench.mjs','text/javascript'],'/quick-analysis-client.mjs':['quick-analysis-client.mjs','text/javascript'],'/packages/contracts/open-analysis-findings.mjs':['../../packages/contracts/open-analysis-findings.mjs','text/javascript'],'/packages/contracts/open-analysis-recovery.mjs':['../../packages/contracts/open-analysis-recovery.mjs','text/javascript'],'/quick-analysis-workbench.css':['quick-analysis-workbench.css','text/css'],'/assets/logo.png':['../desktop/assets/juanerai-logo-slogan.png','image/png']};
    const asset=deps.workspace?assets[path]:undefined;
    if (!asset&&!/^\/v1\/[a-z0-9/-]+$/.test(path)) throw new HttpFailure(404);
    if (req.method !== 'GET' && req.method !== 'POST') throw new HttpFailure(405);
    if (req.method === 'POST' && req.headers.origin !== origin) throw new HttpFailure(403);
    const serve=()=>{res.writeHead(200,{'content-type':asset![1],'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});res.end(readFileSync(new URL(asset![0],import.meta.url)));};
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
    if(path==='/v1/control'&&req.method==='POST'){
      const body=await json(req);
      if(!body||typeof body!=='object'||Object.keys(body).sort().join()!=='command_id,confirmed,generation,version'||Reflect.get(body,'version')!=='1.0'||Reflect.get(body,'confirmed')!==true||!membershipUuid(Reflect.get(body,'command_id'))||!Number.isSafeInteger(Reflect.get(body,'generation')))throw new HttpFailure(400);
      if(Reflect.get(body,'generation')!==generation)throw new HttpFailure(409);
      control=secret();owned=true;generation++;reply(res,200,{control,generation});return;
    }
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
    const nativeCopy=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/formal-reports\/([a-f0-9-]{36})\/copy$/.exec(path);if(deps.formalMember&&nativeCopy&&req.method==='GET'){const value=await deps.formalMember.reportCopy(nativeCopy[1],nativeCopy[2]);res.writeHead(200,{'content-type':value.media_type,'content-disposition':`attachment; filename="${value.suggested_file_name}"`,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"});res.end(value.bytes);return;}
    const nativeTarget=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/formal-review-target$/.exec(path);if(deps.formalMember&&nativeTarget&&req.method==='GET'){reply(res,200,deps.formalMember.reviewTarget(nativeTarget[1]));return;}
    const nativeReview=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/formal-review(?:\/(save-receipts|submission-receipts)\/([a-f0-9-]{36}))?$/.exec(path);
    if(deps.formalMember&&nativeReview){
      const id=nativeReview[1];if(req.method==='GET'){reply(res,200,nativeReview[2]==='save-receipts'?deps.formalMember.reviewReceipt(id,nativeReview[3]):nativeReview[2]==='submission-receipts'?deps.formalMember.submissionReceipt(id,nativeReview[3]):deps.formalMember.readReview(id));return;}
      if(nativeReview[2])throw new HttpFailure(405);if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const raw=await json(req,128*1024);if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new HttpFailure(400);const {operation,...body}=raw as Record<string,unknown>;
      if(operation==='prepare'){reply(res,200,await deps.formalMember.prepareReview(id,body));return;}if(operation==='amend'){reply(res,200,await deps.formalMember.amendReview(id,body));return;}if(operation==='save'){reply(res,200,await deps.formalMember.saveReview(id,body));return;}if(operation==='submit'){reply(res,200,await deps.formalMember.submitReview(id,body));return;}throw new HttpFailure(400);
    }
    if(deps.open&&path.startsWith('/v1/open-analysis')){
      const present=(task:OpenStoredTask)=>req.headers['x-xanthil-view']==='browser-v1'?browserOpenTask(task):task;
      if(path==='/v1/open-analysis/methods'&&req.method==='GET'){reply(res,200,deps.open.methods());return;}
      if(path==='/v1/open-analysis'&&req.method==='GET'){reply(res,200,deps.open.list().map(present));return;}
      if(path==='/v1/open-analysis'&&req.method==='POST'){
        if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);
        const raw=await json(req,45*1024*1024);if(!raw||typeof raw!=='object'||!Array.isArray(Reflect.get(raw,'sources')))throw new HttpFailure(400);
        const sources=Reflect.get(raw,'sources').map((entry:unknown)=>{
          if(!entry||typeof entry!=='object'||Object.keys(entry).sort().join()!=='base64,display_name,format,source_id')throw new HttpFailure(400);
          const b=Reflect.get(entry,'base64');if(typeof b!=='string'||b.length>Math.ceil(8*1024*1024/3)*4)throw new HttpFailure(400);
          const bytes=Buffer.from(b,'base64');if(bytes.toString('base64')!==b)throw new HttpFailure(400);
          const {base64,...rest}=entry as Record<string,unknown>;void base64;return {...rest,bytes};
        });
        reply(res,200,present(await deps.open.submit({...raw,sources})));return;
      }
      const reusable=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/reusable-plan\/([1-9][0-9]*)$/.exec(path);if(reusable&&req.method==='GET'){reply(res,200,deps.open.reusablePlan(reusable[1],reusable[2]));return;}
      const submission=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(submission|stop-initial)$/.exec(path);
      if(submission&&req.method==='GET'&&submission[2]==='submission'){const receipt=deps.open.submission(submission[1]);if(!receipt)throw new HttpFailure(404);reply(res,200,receipt);return;}
      if(submission&&req.method==='POST'&&submission[2]==='stop-initial'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);if(!body||typeof body!=='object'||Object.keys(body).length)throw new HttpFailure(400);const receipt=deps.open.submission(submission[1]);if(!receipt)throw new HttpFailure(404);if(receipt.state==='accepted'){const task=deps.open.stop(submission[1]);reply(res,200,{...receipt,task_state:task.state});}else reply(res,200,deps.open.stopInitial(submission[1]));return;}
      const collaborationReceipt=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/collaboration-receipts\/([a-f0-9-]{36})$/.exec(path);if(collaborationReceipt&&req.method==='GET'){reply(res,200,await deps.open.collaborationReceipt(collaborationReceipt[1],collaborationReceipt[2]));return;}
      const nativeSession=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/session-control$/.exec(path);
      if(nativeSession&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.open.sessionControl(nativeSession[1],await json(req,64*1024)));return;}
      const collaborationSource=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/collaboration-source$/.exec(path);if(collaborationSource&&req.method==='GET'){reply(res,200,deps.open.collaborationSource(collaborationSource[1]));return;}
      const collaboration=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/collaboration(?:\/(create|start|stop|send|return|review))?$/.exec(path);
      if(collaboration&&req.method==='GET'&&!collaboration[2]){reply(res,200,await deps.open.collaboration(collaboration[1]));return;}
      if(collaboration&&req.method==='POST'&&collaboration[2]){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,await deps.open.collaborationCommand(collaboration[1],collaboration[2],await json(req,128*1024)));return;}
      const previewAction=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(preview|adopt)$/.exec(path);if(previewAction&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const raw=await json(req,64*1024);reply(res,200,present(await (previewAction[2]==='preview'?deps.open.previewRevision(previewAction[1],raw):deps.open.adoptRevision(previewAction[1],raw))));return;}
      const requirementDraft=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-draft$/.exec(path);if(requirementDraft&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,present(deps.open.saveRequirementDraft(requirementDraft[1],await json(req,128*1024))));return;}
      const requirementMaterials=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-materials$/.exec(path);if(requirementMaterials&&req.method==='POST'){
       if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const raw=await json(req,45*1024*1024),selected=raw&&typeof raw==='object'?Reflect.get(raw,'sources'):null;if(!Array.isArray(selected))throw new HttpFailure(400);
       const sources=selected.map((entry:unknown)=>{if(!entry||typeof entry!=='object'||Object.keys(entry).sort().join()!=='base64,display_name,format,source_id')throw new HttpFailure(400);const b=Reflect.get(entry,'base64');if(typeof b!=='string'||b.length>Math.ceil(8*1024*1024/3)*4)throw new HttpFailure(400);const bytes=Buffer.from(b,'base64');if(bytes.toString('base64')!==b)throw new HttpFailure(400);const {base64,...rest}=entry as Record<string,unknown>;void base64;return {...rest,bytes};});reply(res,200,present(await deps.open.addRequirementMaterials(requirementMaterials[1],{...(raw as Record<string,unknown>),sources})));return;
      }
      const requirementAction=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-(review|start)$/.exec(path);if(requirementAction&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req,16*1024);reply(res,200,present(requirementAction[2]==='review'?deps.open.reviewRequirement(requirementAction[1],body):await deps.open.startRequirement(requirementAction[1],body)));return;}
      const requirementDiscussion=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/requirement-discussion$/.exec(path);if(requirementDiscussion&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,present(await deps.open.discussRequirement(requirementDiscussion[1],await json(req,64*1024))));return;}
      const cancelStep=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/cancel-step$/.exec(path);if(cancelStep&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,present(await deps.open.cancelStep(cancelStep[1],await json(req,64*1024))));return;}
      const versionChoice=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/select-version$/.exec(path);if(versionChoice&&req.method==='POST'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,present(deps.open.selectVersion(versionChoice[1],await json(req,64*1024))));return;}
      const reportCopy=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/reports\/([1-9][0-9]*)\/([a-f0-9-]{36})\/copy$/.exec(path);
      if(reportCopy&&req.method==='GET'){const value=deps.open.reportCopy(reportCopy[1],reportCopy[2],reportCopy[3]);res.writeHead(200,{'content-type':value.media_type,'content-disposition':`attachment; filename="${value.suggested_file_name}"`,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"});res.end(value.bytes);return;}
      const reportEdit=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(report-edit-target|report-edit|report-edits\/[a-f0-9-]{36})$/.exec(path);
      if(reportEdit&&req.method==='GET'&&reportEdit[2]==='report-edit-target'){reply(res,200,deps.open.reportEditTarget(reportEdit[1]));return;}
      if(reportEdit&&req.method==='GET'&&reportEdit[2].startsWith('report-edits/')){reply(res,200,deps.open.reportEditReceipt(reportEdit[1],reportEdit[2].slice('report-edits/'.length)));return;}
      if(reportEdit&&req.method==='POST'&&reportEdit[2]==='report-edit'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,deps.open.editReport(reportEdit[1],await json(req,512*1024)));return;}
      const receipt=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/judgments\/([a-f0-9-]{36})$/.exec(path);if(receipt&&req.method==='GET'){reply(res,200,deps.open.judgmentReceipt(receipt[1],receipt[2]));return;}
      const judgment=/^\/v1\/open-analysis\/([a-f0-9-]{36})\/(judgment-target|acknowledge)$/.exec(path);if(judgment&&req.method==='GET'&&judgment[2]==='judgment-target'){reply(res,200,deps.open.judgmentTarget(judgment[1]));return;}if(judgment&&req.method==='POST'&&judgment[2]==='acknowledge'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);reply(res,200,deps.open.acknowledge(judgment[1],await json(req,64*1024)));return;}
      const match=/^\/v1\/open-analysis\/([a-f0-9-]{36})(?:\/(stop|resume|revise|requests))?$/.exec(path);
      if(match&&req.method==='GET'&&!match[2]){reply(res,200,present(deps.open.read(match[1])));return;}
      if(match&&req.method==='GET'&&match[2]==='requests'){deps.open.read(match[1]);reply(res,200,deps.open.requests(match[1]));return;}
      if(match&&req.method==='POST'&&match[2]==='stop'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);if(!body||typeof body!=='object'||Object.keys(body).length)throw new HttpFailure(400);reply(res,200,present(deps.open.stop(match[1])));return;}
      if(match&&req.method==='POST'&&match[2]==='resume'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const body=await json(req);if(!body||typeof body!=='object'||Object.keys(body).length)throw new HttpFailure(400);reply(res,200,present(await deps.open.resume(match[1])));return;}
      if(match&&req.method==='POST'&&match[2]==='revise'){if(!owned||!equal(req.headers['x-xanthil-control'],control))throw new HttpFailure(403);const raw=await json(req,45*1024*1024);if(raw&&typeof raw==='object'&&Object.hasOwn(raw,'sources')){const selected=Reflect.get(raw,'sources');if(!Array.isArray(selected))throw new HttpFailure(400);const sources=selected.map((entry:unknown)=>{if(!entry||typeof entry!=='object'||Object.keys(entry).sort().join()!=='base64,display_name,format,source_id')throw new HttpFailure(400);const b=Reflect.get(entry,'base64');if(typeof b!=='string'||b.length>Math.ceil(8*1024*1024/3)*4)throw new HttpFailure(400);const bytes=Buffer.from(b,'base64');if(bytes.toString('base64')!==b)throw new HttpFailure(400);const {base64,...rest}=entry as Record<string,unknown>;void base64;return {...rest,bytes};});reply(res,200,present(await deps.open.revise(match[1],{...raw,sources})));}else reply(res,200,present(await deps.open.revise(match[1],raw)));return;}
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
