import {readFileSync} from 'node:fs';
import {createServer, type IncomingMessage, type ServerResponse} from 'node:http';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {createBrowserMembershipReadbackApplication} from '../../packages/application/browser-membership.ts';
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

export type BrowserServiceCommands={credential:string;check?():void;stop():Promise<void>;projects():Promise<unknown>;receipt?(id:string):Promise<unknown>;select(input:unknown):Promise<unknown>;settings(input:unknown):Promise<unknown>};

/** Task-owned loopback composition. No provider, credentials, file selection or service activation. */
export async function startBrowserMembershipServer(deps: {store: BrowserMembershipReadback;workspace?:BrowserWorkspaceCommands;service?:BrowserServiceCommands}) {
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
      reply(res, status, {error: 'REQUEST_REJECTED'});
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
    const assets:Record<string,[string,string]>={'/':['index.html','text/html'],'/bootstrap.mjs':['bootstrap.mjs','text/javascript'],'/workspace.mjs':['workspace.mjs','text/javascript'],'/client.mjs':['client.mjs','text/javascript'],'/styles.css':['styles.css','text/css'],'/assets/logo.png':['../desktop/assets/juanerai-logo-slogan.png','image/png']};
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
