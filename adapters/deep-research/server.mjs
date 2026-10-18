import {configuredResearchFactory} from './runtime.mjs';
import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,mkdirSync,writeFileSync,unlinkSync,openSync,fsyncSync,closeSync,lstatSync,realpathSync} from 'node:fs';
import {join,isAbsolute,sep} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const flush=path=>{const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}};
const fail=(status,code)=>Object.assign(Error(code),{status,code});
const equal=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const redact=value=>Array.isArray(value)?value.map(redact):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!keyish.test(key)).map(([key,v])=>[key,redact(v)])):value;
const keyish=/key|secret|token|password|credential|authorization/i;
function containsCredential(value){return value&&typeof value==='object'&&Object.entries(value).some(([k,v])=>keyish.test(k)||containsCredential(v));}
function directory(path){if(!isAbsolute(path)||realpathSync(path)!==path||!lstatSync(path).isDirectory())throw Error('DR_DIRECTORY_INVALID');}

/** Fixed plugin domain handlers, assembled behind one listener before it can accept traffic.
 * makeAdapters is a trusted composition dependency; never selected by an HTTP field.
 */
export async function createResearchServer({programRoot,dataRoot,ownerToken,authorize,makeAdapters,hostOrigin,pythonExecutable,authorizedAttachments=[]}) {
  if(!/^[a-f0-9]{64}$/.test(ownerToken)||typeof authorize!=='function')throw Error('DR_AUTHORITY_REQUIRED');
  directory(programRoot);mkdirSync(dataRoot,{recursive:true,mode:0o700});directory(dataRoot);
  if(dataRoot===programRoot||dataRoot.startsWith(programRoot+sep))throw Error('DR_DATA_ROOT_INVALID');
  const load=path=>import(pathToFileURL(join(programRoot,'dist',path)).href);
  const [{FsProjectStore},{FsLibraryStore},{RunRegistry},{handleProjectsRoutes},{handleLibraryRoutes},{handleSettingsRoutes}]=await Promise.all([
    load('stores/fsStore.js'),load('library/fsLibraryStore.js'),load('server/runRegistry.js'),load('server/routes/projectsRuns.js'),load('server/routes/library.js'),load('server/routes/settings.js'),
  ]);
  let writes=Promise.resolve();
  let origin='',closing=false,activeRequests=0,activeEffects=0;
  const inFlight=new Set(),sessions=new Map(),bootstraps=new Map();
  const unknownPath=join(dataRoot,'host-unknown.json');let unknown=existsSync(unknownPath);
  const registry=new RunRegistry();
  const acquire=registry.acquire.bind(registry),release=registry.release.bind(registry);
  registry.acquire=id=>{inFlight.add(id);return acquire(id);};
  registry.release=id=>{release(id);inFlight.delete(id);};
  const projectDir=id=>{if(!/^p-[a-z0-9-]+$/.test(id))throw fail(400,'DR_PROJECT_INVALID');return join(dataRoot,'projects',id);};
  const stores=()=>existsSync(join(dataRoot,'projects'))?readdirSync(join(dataRoot,'projects')).filter(id=>/^p-[a-z0-9-]+$/.test(id)).map(id=>FsProjectStore.open(projectDir(id))):[];
  const runs=async()=>{const result=[];for(const store of stores())result.push(...await store.listRuns());return result;};
  const markUnknown=()=>{unknown=true;writeFileSync(unknownPath,JSON.stringify({state:'unknown',at:new Date().toISOString(),reason:'Previous work has not been reconciled'}),{mode:0o600});};
  if((await runs()).some(r=>r.status==='running')||stores().some(store=>existsSync(join(projectDir(store.meta().id),'host-publish-pending.json'))))markUnknown();
  const library=FsLibraryStore.openOrCreate(join(dataRoot,'library'));
  const leftovers=await library.recoverStaging();if(leftovers.length)library.audit('staging-leftover',{count:leftovers.length,note:'未进入可用清单'});
  const check=async(effect,detail)=>{if(closing||unknown||!await authorize({effect,detail})||closing||unknown)throw fail(403,unknown?'DR_STATE_UNKNOWN':'DR_AUTHORITY_REQUIRED');return true;};
  // All injected external calls are checked at call time, including tool calls after a run starts.
  const wrap=(object,kind)=>Object.fromEntries(Object.entries(object).map(([name,value])=>[name,typeof value!=='function'?value:async(...args)=>{
    await check(kind,{operation:name});activeEffects++;
    try{return await value.apply(object,args);}finally{activeEffects--;}
  }]));
  const ctx={dataDir:dataRoot,configPath:join(dataRoot,'config.json'),registry,library,projectDir,storeFor:id=>FsProjectStore.open(projectDir(id)),
    // Original routes expect a synchronous adapter factory. Resolve it before listen.
    makeAdapters:undefined,
    parsePdf:async bytes=>{try{const {extractText}=await import(pathToFileURL(createRequire(join(programRoot,'package.json')).resolve('unpdf')).href);const {text}=await extractText(bytes);const bodyText=Array.isArray(text)?text.join('\n'):String(text??'');return {bodyText,parseStatus:bodyText.trim()?'ok':'failed'};}catch{return {bodyText:'',parseStatus:'failed'};}},
  };
  const injected=makeAdapters?await makeAdapters({authorize:check,dataRoot}):null;
  const factory=injected?()=>injected:await configuredResearchFactory({programRoot,dataRoot,authorize:check,pythonExecutable});
  ctx.makeAdapters=()=>{const adapters=factory();return {model:wrap(adapters.model,'model'),search:wrap(adapters.search,'search'),page:wrap(adapters.page,'page'),parser:wrap(adapters.parser,'parse')};};
  const cookieName='dr_'+randomBytes(8).toString('hex');
  const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  async function bodyOf(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>(req.url==='/api/library/assets'?70:16)*1024*1024)throw fail(413,'DR_BODY_LIMIT');chunks.push(chunk);}const bytes=Buffer.concat(chunks);if(!bytes.length)return {};if(req.headers['content-type']!=='application/json')throw fail(415,'DR_JSON_REQUIRED');try{return JSON.parse(bytes);}catch{throw fail(400,'DR_JSON_INVALID');}}
  const server=createServer({maxHeaderSize:16384,requestTimeout:15000,headersTimeout:15000},(req,res)=>{
    activeRequests++;res.once('close',()=>{activeRequests--;});
    res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');
    const handling=req.method==='GET'?handle(req,res):(writes=writes.catch(()=>{}).then(()=>handle(req,res)));
    void handling.catch(error=>{if(res.headersSent){res.destroy();return;}json(res,error.status??500,{error:error.code??'DR_REQUEST_FAILED'});});
  });
  for(const event of ['upgrade','connect'])server.on(event,(_req,socket)=>socket.destroy());
  for(const event of ['checkContinue','checkExpectation'])server.on(event,(_req,res)=>{res.writeHead(417);res.end();});
  async function handle(req,res){
    const headers=req.rawHeaders.filter((_,i)=>i%2===0).map(h=>h.toLowerCase());
    if(['host','origin','cookie','x-research-owner','content-length','content-type','transfer-encoding','x-research-view'].some(h=>headers.filter(v=>v===h).length>1)
      ||req.socket.remoteAddress!=='127.0.0.1'||req.headers.host!==origin.slice(7)||req.headers['sec-fetch-site']==='cross-site'
      ||req.headers.origin!==undefined&&req.headers.origin!==origin||req.headers['content-encoding']!==undefined)throw fail(403,'DR_INGRESS_DENIED');
    if(!['GET','POST','PATCH','PUT','DELETE'].includes(req.method))throw fail(405,'DR_METHOD_DENIED');
    const raw=req.url??'';const rawPath=raw.split('?')[0];
    if(!raw.startsWith('/')||raw.startsWith('//')||/[\\\x00-\x20]/.test(raw)||/%(?:2f|5c|2e|00)/i.test(rawPath)||rawPath.split('/').some(s=>s==='.'||s==='..'))throw fail(400,'DR_PATH_INVALID');
    const url=new URL(raw,origin),path=url.pathname;
    for(const key of new Set(url.searchParams.keys()))if(url.searchParams.getAll(key).length!==1)throw fail(400,'DR_QUERY_INVALID');
    const owner=equal(req.headers['x-research-owner'],ownerToken)&&req.headers.origin===undefined&&req.headers.cookie===undefined&&req.headers['sec-fetch-site']===undefined;
    const cookies=(req.headers.cookie??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(cookieName+'='));
    const browser=cookies.length===1&&sessions.has(cookies[0].slice(cookieName.length+1));
    if(path==='/bridge/session'&&req.method==='POST'){
      if(req.headers.origin!==origin)throw fail(403,'DR_ORIGIN_REQUIRED');
      const body=await bodyOf(req);if(typeof body.token!=='string'||(bootstraps.get(body.token)??0)<Date.now())throw fail(403,'DR_BOOTSTRAP_INVALID');
      bootstraps.delete(body.token);if(sessions.size>=32)throw fail(429,'DR_SESSION_LIMIT');
      const value=randomBytes(32).toString('hex');const view=randomBytes(32).toString('hex');sessions.set(value,view);res.setHeader('set-cookie',`${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/`);json(res,200,{ready:true,view});return;
    }
    if(path==='/'||path==='/bridge-bootstrap.mjs'){
      if(req.method!=='GET')throw fail(405,'DR_METHOD_DENIED');
      res.setHeader('content-security-policy',`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors ${hostOrigin??"'none'"}; object-src 'none'; base-uri 'none'`);
      if(path==='/bridge-bootstrap.mjs'){res.writeHead(200,{'content-type':'text/javascript'});res.end("const token=location.hash.slice(1);if(/^[a-f0-9]{64}$/.test(token)){history.replaceState(null,'',location.pathname);const r=await fetch('/bridge/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});if(!r.ok)throw Error('研究入口已失效，请从原任务重新打开');const {view}=await r.json();const originalFetch=globalThis.fetch.bind(globalThis);globalThis.fetch=(input,init={})=>{const target=new URL(input instanceof Request?input.url:input,location.href);if(target.origin===location.origin&&target.pathname.startsWith('/api/')){const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init.headers).forEach((v,k)=>headers.set(k,v));headers.set('x-research-view',view);return originalFetch(input,{...init,headers});}return originalFetch(input,init);};}for(const href of ['/plugin.css','/integration.css']){const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}await import('/plugin.js');");return;}
      res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><div id="root"></div><script type="module" src="/bridge-bootstrap.mjs"></script></html>');return;
    }
    if(!owner&&!browser)throw fail(403,'DR_SESSION_REQUIRED');
    const assertView=()=>{if(!owner&&req.method!=='GET'&&(req.headers.origin!==origin||!equal(req.headers['x-research-view'],sessions.get(cookies[0]?.slice(cookieName.length+1))??'')))throw fail(403,'DR_ORIGIN_REQUIRED');};
    assertView();
    if(closing)throw fail(503,'DR_CLOSING');
    if(!path.startsWith('/api/')){
      if(req.method!=='GET'||!/^\/(plugin\.(?:js|css)|integration\.css|assets\/[\w.-]+)$/.test(path))throw fail(404,'DR_NOT_FOUND');
      const file=join(programRoot,'ui-dist',path.slice(1));if(!existsSync(file)||!lstatSync(file).isFile()||realpathSync(file)!==file)throw fail(404,'DR_NOT_FOUND');
      res.writeHead(200,{'content-type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'image/png'});res.end(readFileSync(file));return;
    }
    if(/followup|sessionDigest|sessionCandidate/i.test(path))throw fail(403,'DR_FOLLOWUP_DISABLED');
    const body=req.method==='GET'?{}:await bodyOf(req);
    assertView();
    if(!body||typeof body!=='object'||Array.isArray(body))throw fail(400,'DR_BODY_INVALID');
    for(const id of [body.request?.id,body.requestId])if(id!==undefined&&(typeof id!=='string'||! /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,199}$/.test(id)))throw fail(400,'DR_REQUEST_ID_INVALID');
    if(Object.hasOwn(body,'plan')||body.request&&Object.hasOwn(body.request,'outline'))throw fail(400,'DR_CONFIRMATION_REQUIRED');
    if(body.request?.id&&/^\/api\/projects\/p-[a-z0-9-]+\/runs$/.test(path)&&(await runs()).some(run=>run.requestId===body.request.id))throw fail(409,'DR_REQUEST_ID_CONFLICT');
    if(body.request?.incrementalOf)throw fail(403,'DR_FOLLOWUP_DISABLED');
    if(body.request?.attachments?.length){
      if(!Array.isArray(body.request.attachments))throw fail(400,'DR_ATTACHMENT_INVALID');
      const frozen=[];for(const source of body.request.attachments){
        const grant=authorizedAttachments.find(g=>g.sourcePath===source);if(!grant||!isAbsolute(source)||!Number.isSafeInteger(grant.bytes)||grant.bytes<0||grant.bytes>16*1024*1024||!/^([a-f0-9]{64})$/.test(grant.sha256))throw fail(403,'DR_ATTACHMENT_AUTHORITY_REQUIRED');
        await check('attachment',{path:source,bytes:grant.bytes,sha256:grant.sha256});
        assertView();
        if(!lstatSync(source).isFile()||realpathSync(source)!==source||lstatSync(source).size!==grant.bytes)throw fail(409,'DR_ATTACHMENT_CHANGED');const bytes=readFileSync(source);if(createHash('sha256').update(bytes).digest('hex')!==grant.sha256)throw fail(409,'DR_ATTACHMENT_CHANGED');
        const root=join(dataRoot,'attachments');mkdirSync(root,{recursive:true,mode:0o700});directory(root);const target=join(root,grant.sha256+(source.toLowerCase().endsWith('.pdf')?'.pdf':'.txt'));
        if(!existsSync(target)){writeFileSync(target,bytes,{flag:'wx',mode:0o400});writeFileSync(target+'.source.json',JSON.stringify({sourcePath:source,sha256:grant.sha256,bytes:grant.bytes}),{flag:'wx',mode:0o600});}
        if(realpathSync(target)!==target||createHash('sha256').update(readFileSync(target)).digest('hex')!==grant.sha256)throw fail(409,'DR_ATTACHMENT_CHANGED');frozen.push(target);
      }body.request={...body.request,attachments:frozen};
    }
    if(req.method!=='GET'){await check('http',{method:req.method,path});assertView();}
    if(path==='/api/settings'&&req.method==='GET'){
      const {DEFAULT_BUDGET}=await load('core/runResearch.js');const raw=existsSync(ctx.configPath)?JSON.parse(readFileSync(ctx.configPath,'utf8')):{};json(res,200,{config:redact(raw),budgetDefaults:DEFAULT_BUDGET});return;
    }
    if(path==='/api/settings'&&req.method!=='GET'){
      if(containsCredential(body))throw fail(400,'DR_CREDENTIAL_FIELD_DENIED');
      if(inFlight.size||(await runs()).some(r=>['running','awaiting-confirmation'].includes(r.status)))throw fail(409,'DR_ACTIVE_CONFIGURATION');
    }
    if(path.endsWith('/gate/confirm')){
      const p=body.payload;
      if(!p||p.questions&&(!p.questions.length||p.questions.some(q=>!q.question?.trim()))||Object.hasOwn(p,'title')&&!p.title?.trim())throw fail(400,'DR_GATE_EMPTY');
    }
    const rerun=/^\/api\/projects\/(p-[a-z0-9-]+)\/runs\/rerun$/.exec(path);
    if(rerun&&req.method==='POST'){
      const store=ctx.storeFor(rerun[1]),prior=await store.findRunByRequestId(body.requestId),request=await store.readRequest(body.requestId);
      if(!prior||prior.gate||!request?.outline)throw fail(409,'DR_CONFIRMATION_REQUIRED');
    }
    const cancel=/^\/api\/projects\/(p-[a-z0-9-]+)\/runs\/cancel$/.exec(path);
    if(cancel&&req.method==='POST'&&!await ctx.storeFor(cancel[1]).findRunByRequestId(body.requestId))throw fail(404,'DR_RUN_NOT_FOUND');
    const resume=/^\/api\/projects\/(p-[a-z0-9-]+)\/runs\/resume$/.exec(path);
    if(resume&&req.method==='POST'){
      const store=ctx.storeFor(resume[1]);const prior=await store.findRunByRequestId(body.requestId);
      // The original resume route has no gates option. A cancelled pending gate is
      // restored to its durable checkpoint instead of silently continuing research.
      if(prior?.status==='cancelled'&&prior.gate){
        await registry.withGateLock(prior.id,async()=>{
          const current=await store.findRunByRequestId(body.requestId);
          if(current?.status!=='cancelled'||!current.gate)throw fail(409,'DR_GATE_CHANGED');
          if((await store.listRuns()).some(r=>r.id!==current.id&&['running','awaiting-confirmation'].includes(r.status)))throw fail(409,'DR_PROJECT_BUSY');
          assertView();
          await store.saveRun({...current,status:'awaiting-confirmation'});
          json(res,200,{resumed:true,requestId:current.requestId,runId:current.id});
        });return;
      }
    }
    const pm=/^\/api\/projects\/(p-[a-z0-9-]+)\/publish$/.exec(path);
    if(pm&&req.method==='POST'){
      // Original publish is immutable but not idempotent. Serialize and read back by run.
      await registry.withProjectLock(pm[1],async()=>{
        const store=ctx.storeFor(pm[1]);const publishPending=join(projectDir(pm[1]),'host-publish-pending.json');const existing=store.meta().versions.find(v=>v.runId===body.runId);
        if(existing){json(res,200,{version:existing.version,diffSummary:existing.diffSummary});return;}
        if(existsSync(publishPending))throw fail(409,'DR_PUBLISH_UNKNOWN');
        const run=(await store.listRuns()).find(r=>r.id===body.runId);
        if(!run||!['published','limited'].includes(run.status))throw fail(409,'DR_RUN_NOT_DELIVERABLE');
        assertView();
        writeFileSync(publishPending,JSON.stringify({runId:body.runId}),{flag:'wx',mode:0o600});flush(publishPending);flush(projectDir(pm[1]));
        try{await handleProjectsRoutes(ctx,req,res,url,body);if(!ctx.storeFor(pm[1]).meta().versions.some(v=>v.runId===body.runId))throw Error('DR_PUBLISH_UNKNOWN');unlinkSync(publishPending);}catch(error){markUnknown();throw error;}
      });return;
    }
    for(const handler of [handleProjectsRoutes,handleLibraryRoutes,handleSettingsRoutes]){assertView();if(await handler(ctx,req,res,url,body))return;}
    throw fail(404,'DR_NOT_FOUND');
  }
  await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});origin=`http://127.0.0.1:${server.address().port}`;
  return {origin,
    launch(){sessions.clear();bootstraps.clear();for(const [key,until]of bootstraps)if(until<Date.now())bootstraps.delete(key);if(bootstraps.size>=32)throw Error('DR_BOOTSTRAP_LIMIT');const token=randomBytes(32).toString('hex');bootstraps.set(token,Date.now()+60000);return origin+'/#'+token;},
    state(){return {unknown,active:inFlight.size,requests:activeRequests,effects:activeEffects};},
    async close(){if(inFlight.size||activeEffects||activeRequests||unknown)throw Error('DR_WORK_UNSETTLED');closing=true;await factory.close?.();sessions.clear();bootstraps.clear();await new Promise((yes,no)=>{server.close(e=>e?no(e):yes());server.closeIdleConnections();});},
  };
}
