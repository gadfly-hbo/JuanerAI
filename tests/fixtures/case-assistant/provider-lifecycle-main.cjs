// Host-only synthetic boundary: load the exact packaged Main unchanged. No Keychain/network.
const {app,ipcMain,BrowserWindow,dialog}=require('electron');
const {EventEmitter}=require('node:events'),{PassThrough,Writable}=require('node:stream');
const {join}=require('node:path'),{pathToFileURL}=require('node:url');
const {readFileSync}=require('node:fs'),{createHash}=require('node:crypto');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const packageRoot=process.env.JUANERAI_LIFECYCLE_ASAR;
if(!packageRoot||!packageRoot.endsWith('/Contents/Resources/app.asar'))throw Error('FROZEN_PACKAGE_REQUIRED');
if(process.defaultApp!==true||process.versions.electron!=='44.4.3')throw Error('INSTALLED_DEFAULT_ELECTRON_REQUIRED');
const mainPath=join(packageRoot,'.vite/build/main.cjs');
const asarSha=sha(require('original-fs').readFileSync(packageRoot)),mainBytes=readFileSync(mainPath),mainSha=sha(mainBytes);
if(asarSha!==process.env.JUANERAI_LIFECYCLE_ASAR_SHA256||mainSha!==process.env.JUANERAI_LIFECYCLE_MAIN_SHA256)throw Error('PACKAGED_MAIN_IDENTITY_MISMATCH');
let bootstrapPhase='installing-offline-seams',mainLoaded=false;
app.setAppPath(packageRoot);
// Record the actual runtime baseline before host subscription and product Main.
const entryAllClosedListeners=app.rawListeners('window-all-closed');
let beforeMainListeners=[],afterMainListeners=[];
const listenerFingerprints=list=>list.map(listener=>{const source=Function.prototype.toString.call(listener);return {name:listener.name,sourceBytes:Buffer.byteLength(source),sourceSha256:sha(source)};});
const sameListeners=(a,b)=>a.length===b.length&&a.every((listener,index)=>listener===b[index]);
const nonHostListeners=()=>app.rawListeners('window-all-closed').filter(listener=>listener!==keepSyntheticHost);
function listenerBaseline(){const current=nonHostListeners();return {entry:listenerFingerprints(entryAllClosedListeners),beforeMain:listenerFingerprints(beforeMainListeners),afterMain:listenerFingerprints(afterMainListeners),current:listenerFingerprints(current),mainPreserved:sameListeners(beforeMainListeners,afterMainListeners),currentPreserved:sameListeners(afterMainListeners,current)};}

// Passive native lifecycle trace; IDs only, no renderer content or credential data.
const windowEvents=[];let windowSequence=0,allClosedEvents=0,beforeQuitEvents=0;
// Test host only: Electron otherwise quits when its last window closes. Keep
// the process for later-window races; do not cancel native close or explicit Quit.
const keepSyntheticHost=()=>{allClosedEvents++;recordWindow('window-all-closed');};
app.on('window-all-closed',keepSyntheticHost);
app.on('before-quit',()=>{beforeQuitEvents++;recordWindow('before-quit');});
const nativeWindows=()=>BrowserWindow.getAllWindows().map(window=>({id:window.id,webContentsId:window.webContents.id}));
function recordWindow(event,id,webContentsId){windowEvents.push({sequence:++windowSequence,event,id,webContentsId});if(windowEvents.length>512)windowEvents.shift();}
app.on('browser-window-created',(_,window)=>{
 const id=window.id,webContentsId=window.webContents.id;recordWindow('created',id,webContentsId);
 window.on('close',()=>recordWindow('close',id,webContentsId));
 window.on('closed',()=>recordWindow('closed',id,webContentsId));
 window.webContents.on('destroyed',()=>recordWindow('webContents-destroyed',id,webContentsId));
 window.webContents.on('render-process-gone',(_,details)=>windowEvents.push({sequence:++windowSequence,event:'render-process-gone',id,webContentsId,...details}));
});
app.on('activate',()=>{windowEvents.push({sequence:++windowSequence,event:'activate',windows:nativeWindows()});if(windowEvents.length>512)windowEvents.shift();});

let key='synthetic-lifecycle-old',mode='',held='',release=()=>{},requests=0,saves=0,reads=0,project='',fault='',fetches=0,sockets=0;
let childOutput='question';const childPayloads=[];
const deliveryFault=require('./collaboration-delivery-fault.cjs').installDeliveryWriteFault();
const handlers=new Map(),tasks=new Map();
const wait=async boundary=>{if(mode!==boundary)return;mode='';held=boundary;await new Promise(r=>release=()=>{held='';r();});};
const cp=require('node:child_process');cp.spawn=(file,args,options)=>{
 if(file!==join(require('node:path').dirname(process.execPath),'xanthil-keychain')||args.length)throw Error('UNEXPECTED_CHILD');
 const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>true;
 child.stdin=new Writable({write(b,encoding,done){const r=JSON.parse(String(b));(async()=>{
  let value;if(r.operation==='read'){reads++;await wait('read');value=fault==='keychain'?{status:'unavailable'}:key?{status:'found',key}:{status:'absent'};}
  else if(r.operation==='save'){saves++;key=r.key;value={status:'ok'};}else if(r.operation==='delete'){key=null;value={status:'ok'};}else throw Error('UNEXPECTED_KEYCHAIN_OPERATION');
  child.stdout.end(JSON.stringify(value));child.emit('close',0);done();
 })().catch(error=>{child.emit('error',error);done();});}});return child;
};
globalThis.fetch=()=>{fetches++;throw Error('NETWORK_FORBIDDEN');};require('node:net').Socket.prototype.connect=function(){sockets++;throw Error('SOCKET_FORBIDDEN');};
const handle=ipcMain.handle.bind(ipcMain);ipcMain.handle=(channel,handler)=>{handlers.set(channel,handler);return handle(channel,handler);};
dialog.showOpenDialog=async()=>({canceled:false,filePaths:[project]});
async function invoke({channel,request}){const window=BrowserWindow.getAllWindows()[0];if(!window)throw Error('WINDOW_REQUIRED');return handlers.get(channel)({sender:window.webContents,senderFrame:window.webContents.mainFrame},request);}
globalThis.lifecycle={windowState(){return {windows:nativeWindows(),events:[...windowEvents],allClosedEvents,beforeQuitEvents};},health(){return {syntheticKeepalive:app.listeners('window-all-closed').includes(keepSyntheticHost),listenerBaseline:listenerBaseline(),fixture:__filename,phase:bootstrapPhase,mainLoaded,mainPath,mainBytes:mainBytes.length,mainSha,asarSha,mainCached:!!require.cache[mainPath],appPath:app.getAppPath(),executable:process.execPath,electron:process.versions.electron,defaultApp:process.defaultApp===true,isPackaged:app.isPackaged,handlersInstalled:['xanthil-provider-settings:v1','xanthil-case-assistant:v1','xanthil-desktop:v1:startAssistance'].every(channel=>handlers.has(channel))};},fault(value){fault=value;},arm(value){mode=value;},release(){release();},project(value){project=value;},invoke,
 begin({id,...input}){tasks.set(id,invoke(input));},result(id){return tasks.get(id);},
 deliveryFaultArm(child){deliveryFault.arm(join(project,'.xanthil/desktop/case-assistant.sqlite'),child);return deliveryFault.read();},deliveryFaultRead(){return deliveryFault.read();},
 childOutput(value){if(!['question','result','advice','failure'].includes(value))throw Error('INVALID_FIXTURE_MODE');childOutput=value;},childPayloads(){return [...childPayloads];},
 stats(){return {held,requests,saves,reads,fetches,sockets,keyIsOld:key==='synthetic-lifecycle-old',windows:BrowserWindow.getAllWindows().length};}};
(async()=>{
 bootstrapPhase='installed-sdk';
 const sdk=await import(pathToFileURL(join(packageRoot,'node_modules/@earendil-works/pi-coding-agent/dist/index.js')).href);
 const ai=await import(pathToFileURL(join(sdk.getPackageDir(),'node_modules/@earendil-works/pi-ai/dist/index.js')).href);
 const create=sdk.ModelRuntime.create;sdk.ModelRuntime.create=async function(...args){await wait('preflight');return create.apply(this,args);};
 sdk.ModelRuntime.prototype.streamSimple=function(model,context,options){
  if(++requests>30||model.provider!=='xiaomi-token-plan-cn'||model.id!=='mimo-v2.6-pro'||options.maxRetries!==0||context.tools.length)throw Error('SYNTHETIC_REQUEST_BOUNDARY');
  if(['CREDENTIAL_INVALID','NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED'].includes(fault))throw Object.assign(Error({CREDENTIAL_INVALID:'401 synthetic',NETWORK_UNAVAILABLE:'fetch failed synthetic',CONNECTION_TIMEOUT:'request timeout synthetic',QUOTA_EXCEEDED:'429 synthetic'}[fault]),{code:fault});
  const text=context.messages[0].content,stream=ai.createAssistantMessageEventStream();
  let output='OK.';
  if(text!=='Reply with OK.'){
   const input=JSON.parse(text),action=input.action_kind;
   output=JSON.stringify(action==='organize_question'?{draft_kind:'question_fields',draft_content:{question_text:'Synthetic question',hypothesis_display_title:'Synthetic hypothesis',business_context:'Synthetic',alternative_explanations:[]}}:action==='explain_evidence'?{draft_kind:'evidence_explanation',draft_content:{evidence_explanation_text:'Synthetic evidence'}}:action==='draft_candidates'?{draft_kind:'candidates',draft_content:{candidates:[]}}:{kind:'question',text:'Synthetic question'});
   if(input.authorized_context?.contract_version==='1.1'){
    childPayloads.push(input);const context=input.authorized_context;
    if(childOutput==='failure')throw Error('synthetic child transport failure');
    output=JSON.stringify(childOutput==='result'?{kind:'result',summary:context.selected_results.length?'R2 复核所选 R1；依据不足。':context.business_projection?.candidates?.length?'R1 检查完成；'+context.task:'R1 检查完成；依据不足。',references:context.selected_results.length?[context.allowed_references.find(r=>r.kind==='result')]:context.business_projection?.candidates?.length?context.allowed_references.filter(r=>['candidate','aggregate','report','history'].includes(r.kind)):[context.allowed_references[0]],limitations:['仅依据明确选择的材料。'],unknowns:['没有独立因果证据。']}:childOutput==='advice'?{kind:'advice',text:'不完整意见'}:{kind:'question',text:'是否只检查所选证据边界？'});
   }
  }
  (async()=>{await wait('runtime');stream.push({type:'done',reason:'stop',message:{role:'assistant',content:[{type:'text',text:output}],api:model.api,provider:model.provider,model:model.id,usage:{input:10,cacheRead:0,cacheWrite:0,output:100,totalTokens:110,cost:{total:0}},stopReason:'stop',timestamp:Date.now()}});})();return stream;
 };
 bootstrapPhase='exact-packaged-main';beforeMainListeners=nonHostListeners();require(mainPath);afterMainListeners=nonHostListeners();mainLoaded=true;bootstrapPhase='ready';
})().catch(()=>{process.stderr.write('SYNTHETIC_BOOTSTRAP_FAILED '+bootstrapPhase+'\n');app.exit(1);});
