// One-scene acceptance control. Never imported by the product or bundled supplier.
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
const allowed=new Set(['read','write','edit','bash','render_deck','qa_deck','export_deck','look_page']);
const formats=new Set(['pptx','html','pdf']);
const tags=new Set([...allowed,'propose_outline']);
const declarations=host=>JSON.stringify(host.defaultTools().map(({execute,...definition})=>definition));
const imageHash=image=>createHash('sha256').update(Buffer.from(image.data,'base64')).digest('hex');
function failed(value){
 if(!value||typeof value!=='object')return false;
 if(value.ok===false||value.isError===true)return true;
 if(['exitCode','exit_code'].some(key=>typeof value[key]==='number'&&value[key]!==0))return true;
 if(Array.isArray(value))return value.some(failed);
 if(value.kind==='text'&&typeof value.text==='string'){try{return failed(JSON.parse(value.text));}catch{return false;}}
 return Object.entries(value).some(([key,v])=>key!=='text'&&failed(v));
}
export function createTrialControl({stopFault,now=Date.now,modelLimit=32,toolLimit=96,deadlineMs=1800000,requireLooks=true,correction=null,timers={set:setTimeout,clear:clearTimeout}}){
 let forwarded=0,planned=0,executed=0,started=null,timer=null,stopped=false,firstStop=null,modelComplete=false,structureChecked=false,modelExports=0,attached=null,definitions=null,imagesDelivered=false,finished=false,mainAdmissions=0,permit=null;
 const controller=new AbortController(),looks=new Map(),plannedLooks=new Set(),listeners=[],localExports=new Set(),exportOperations=new Map(),qaFlags=new Set();
 function trip(reason,phase,tool=null){if(stopped)return;stopped=true;firstStop={reason,phase,dispatch:forwarded,tool:tags.has(tool)?tool:null};controller.abort();for(const listener of listeners){try{listener();}catch{}}}
 function deny(reason,phase,tool=null){trip(reason,phase,tool);throw stopFault();}
 function check(phase){if(stopped||finished)throw stopFault();if(started!==null&&now()-started>=deadlineMs)deny('deadline',phase);}
 const revision=correction?createRevisionChecks(correction,(reason,tool)=>deny(reason,'revision',tool),()=>{structureChecked=false;imagesDelivered=false;looks.clear();plannedLooks.clear();}):null;
 function scope(name,args,phase){
  if(!allowed.has(name))deny('tool_outside_scope',phase,name);
  if(!revision&&looks.size&&['write','edit','bash','render_deck'].includes(name))deny('post_check_write',phase,name);
  if(!revision&&name==='look_page'&&(!['page_01','page_02'].includes(args?.page)||looks.has(args.page)))deny('look_outside_scope',phase,name);
  if(name==='export_deck'){
   if(modelExports>=1||requireLooks&&!imagesDelivered)deny('export_outside_scope',phase,name);
   if(args?.formats!==undefined&&(!Array.isArray(args.formats)||!args.formats.length||new Set(args.formats).size!==args.formats.length||args.formats.some(f=>!formats.has(f))))deny('export_format',phase,name);
  }
 }
 function inspectQa(value,name){
  if(!value||typeof value!=='object')return;
  if(name==='qa_deck'||name==='render_deck'||name==='export_deck'){
   const q=name==='export_deck'?value.qa:value;
   if(q?.ok===true){if(q.slides!==2)deny('page_count','tool',name);structureChecked=true;}
   for(const item of q?.items??[])if(item.status==='flag')qaFlags.add(['digit_guard','headline_check','source_note','material_coverage','sensitive_sources','slide_structure','zip_integrity'].includes(item.item)?item.item:'other');
  }
 }
 const api={
  observer:{
   async before({name,args,signal}){check('tool');if(signal.aborted)deny('cancelled','tool',name);scope(name,args,'tool');if(revision)await revision.before(name,args);if(executed>=toolLimit)deny('tool_limit','tool',name);executed++;},
   async after({name,args,outcome,signal,stop}){
    if(outcome.kind==='threw'){trip('tool_failed','tool',name);stop();return;}
    if(signal.aborted&&!stopped)trip('cancelled','tool',name);
    if(failed(outcome.value))trip('tool_failed','tool',name);
    if(stopped){stop();return;}
    check('tool_result');inspectQa(outcome.value,name);
    if(revision)await revision.after(name,args,outcome.value);
    if(name==='look_page'){
     const images=outcome.value?.content?.filter(c=>c.kind==='image'&&c.mimeType==='image/jpeg'&&typeof c.data==='string')??[];
     if(images.length!==1||!Buffer.from(images[0].data,'base64').length)deny('look_image_missing','tool',name);
     looks.set(args.page,{page:args.page,source:['agent-html','fallback'].includes(outcome.value.details?.source)?outcome.value.details.source:'other',image_sha256:imageHash(images[0])});
     revision?.recordLook(args.page,looks.get(args.page));
    }
    if(name==='export_deck')modelExports++;
   },
  },
  attach(host){if(attached)throw Error('CONTROL_ALREADY_ATTACHED');attached=host;definitions=declarations(host);listeners.push(()=>{void host.control({kind:'abort'}).catch(()=>{});});},
  onStop(listener){listeners.push(listener);},
  stop(reason='controller_stop'){trip(reason,'controller');},
  observeResult(result){if(result.status!=='succeeded'||result.usageKnown!==true)trip(result.usageKnown===false?'unknown_usage':'run_failed','result');},
  checkLocal(){check('local');},
  summary:()=>({forwarded,planned_tools:planned,executed_tools:executed,model_complete:modelComplete,structure_checked:structureChecked,look_pages:[...looks.keys()].sort(),look_results:[...looks.values()].map(x=>({...x})),images_delivered:imagesDelivered,model_exports:modelExports,local_exports:[...localExports].sort(),qa_flags:[...qaFlags].sort(),main_admissions:mainAdmissions,finished,stopped,stop:firstStop?{...firstStop}:null,declarations_unchanged:attached?definitions===declarations(attached):null,...(revision?{revision:revision.summary()}: {})}),
  async approveVisualReview(checks){check('visual_review');if(!revision||!modelComplete)deny('visual_review_not_ready','local');await revision.approve(checks);},
  dispose(){if(timer!==null)timers.clear(timer);},
  bindPolicy(policy,projectId){
   const begin=policy.begin,finish=policy.finish;
   policy.begin=function(id,operation,kind,boundary){
    check('admission');if(id!==projectId)deny('project_outside_scope','admission');
    if(kind==='image')deny('image_purpose_outside_scope','admission');
    if(kind==='main'&&mainAdmissions)deny('additional_scene','admission');
    if(kind==='export'&&(!permit||permit.claimed))deny('local_export_not_permitted','admission');
    let value;try{value=begin.call(policy,id,operation,kind,boundary);}catch(error){trip('operation_admission_failed','admission');throw error;}
    if(kind==='main')mainAdmissions++;
    if(kind==='export'){permit.claimed=true;exportOperations.set(operation,permit);}
    return value;
   };
   policy.finish=function(operation,value){
    const result=finish.call(policy,operation,value),local=exportOperations.get(operation);
    if(local){local.settled=true;local.success=value.outcome==='succeeded'&&value.physical_settled===true&&value.usage_known===true;}
    if(value.outcome!=='succeeded'||!value.physical_settled||value.usage_known!==true)trip(value.usage_known!==true?'unknown_usage':'operation_failed','settlement');
    return result;
   };
  },
  async localExport(format,work){
   check('local_export');if(!formats.has(format)||localExports.has(format)||permit||!modelComplete||requireLooks&&(!imagesDelivered||looks.size!==2||!structureChecked))deny('local_export_outside_scope','local_export');
   if(revision)await revision.forExport();
   const current=permit={format,claimed:false,settled:false,success:false},startedAt=Date.now();
   try{const result=await work();check('local_export_result');if(!current.claimed||!current.settled||!current.success)deny('local_export_unknown','local_export_result');if(revision){await revision.afterLocalExport(format,startedAt,Date.now());await revision.forExport();}localExports.add(format);return result;}
   catch(error){trip('local_export_failed','local_export');throw error;}
   finally{permit=null;}
  },
  finishScene(){check('finish');if(!modelComplete||requireLooks&&(!imagesDelivered||looks.size!==2||!structureChecked)||localExports.size!==3)deny('required_checks_missing','finish');finished=true;api.dispose();},
  wrap:transport=>async request=>{
   check('request');if(modelComplete)deny('additional_model_request','request');if(request.signal.aborted)deny('cancelled','request');
   if(revision)await revision.request(request);
   const m=request.model;if(m.provider!=='xiaomi-token-plan-cn'||m.id!=='mimo-v2.6-flash'||m.protocol!=='openai-completions'||m.endpoint!=='https://token-plan-cn.xiaomimimo.com/v1'||m.maxOutputTokens!==16384)deny('model_outside_scope','request');
   if(forwarded>=modelLimit)deny('dispatch_limit','request');
   if(started===null){started=now();timer=timers.set(()=>trip('deadline','timer'),deadlineMs);timer?.unref?.();}
   const images=(request.messages??[]).flatMap(message=>message.images??[]),counts=new Map();for(const image of images){const hash=imageHash(image);counts.set(hash,(counts.get(hash)??0)+1);}
   if(revision)imagesDelivered=revision.delivered();
   else if(looks.size===2){const required=new Map();for(const look of looks.values())required.set(look.image_sha256,(required.get(look.image_sha256)??0)+1);if([...required].every(([hash,count])=>(counts.get(hash)??0)>=count))imagesDelivered=true;}
   forwarded++;let reply;
   try{reply=await transport({...request,signal:AbortSignal.any([request.signal,controller.signal])});}
   catch(error){trip(request.signal.aborted?'cancelled':'transport_failure','reply');throw error;}
   check('reply');const calls=(reply.content??[]).filter(c=>c.kind==='tool');
   if(planned+calls.length>toolLimit)deny('tool_limit','reply');
   const declared=new Set((request.messages??[]).flatMap(message=>(message.tools??[]).map(t=>t.name))),pending=new Set(plannedLooks);let exports=modelExports;
   revision?.project(calls.filter(call=>declared.has(call.name)),request.messages??[]);
   for(const call of calls){
    if(!declared.has(call.name))continue; // Original SDK remains the name/schema/ID authority.
    scope(call.name,call.arguments,'reply');
    if(!revision&&call.name==='look_page'){if(pending.has(call.arguments?.page))deny('look_outside_scope','reply',call.name);pending.add(call.arguments.page);}
    if(call.name==='export_deck'&&exports++>=1)deny('export_outside_scope','reply',call.name);
   }
   planned+=calls.length;for(const page of pending)plannedLooks.add(page);
   if(!calls.length&&reply.stop==='complete'){if(requireLooks&&(!imagesDelivered||looks.size!==2||!structureChecked))deny('required_checks_missing','reply');if(revision)await revision.finalChecks();modelComplete=true;}
   return reply;
  },
 };
 return api;
}

// Private 021 opt-in: default 018 mode and product execution remain unchanged.
function createRevisionChecks(options,deny,invalidate){
 const root=realpathSync(options.projectRoot),pageFiles=['page_01.mjs','page_01.html','page_02.mjs','page_02.html'].map(n=>'deck/pages/'+n),locked=[...new Set(['deck/deck.mjs',...(options.lockedPaths??[])])];
 const normal=s=>s.replace(/\s+/g,''),htmlText=s=>normal(s.replace(/<!--[\s\S]*?-->/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,''));
 const digest=b=>createHash('sha256').update(b).digest('hex'),bindings=new Map(),lookHistory=[],versions=[],metadataExports=[];
 let baseline=null,expected=null,projectMetadata=null,qaPass=false,approved=false,wasExported=false,initialising=null;
 let state={cycle:1,phase:'editing',writes:0,renders:0,qas:0,pages:[]};
 function bytes(path){
  if(typeof path!=='string'||isAbsolute(path)||path.split('/').includes('..'))deny('revision_path');
  const file=resolve(root,path);if(!lstatSync(file).isFile()||realpathSync(file)!==file)deny('revision_path');return readFileSync(file);
 }
 const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
 function readProject(){let value;try{value=JSON.parse(bytes('project.json').toString());}catch{deny('revision_project_metadata');}if(!value||typeof value!=='object'||Array.isArray(value)||!iso(value.updated_at))deny('revision_project_time');return value;}
 function snapshot(){return Object.fromEntries([...pageFiles,'deck/deck.pptx',...locked].map(p=>[p,digest(bytes(p))]));}
 async function slideTexts(){
  const JSZip=(await import(pathToFileURL(join(options.program,'node_modules/jszip/lib/index.js')).href)).default,zip=await JSZip.loadAsync(bytes('deck/deck.pptx'));
  return Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0])).map(async n=>normal(((await zip.files[n].async('string')).match(/<a:t>([^<]*)<\/a:t>/g)??[]).map(t=>t.replace(/<[^>]+>/g,'')).join(' ')));
 }
 async function init(){
  if(baseline)return;if(!initialising)initialising=(async()=>{baseline={files:snapshot(),text:await Promise.all(await slideTexts()),html:pageFiles.filter(p=>p.endsWith('.html')).map(p=>htmlText(bytes(p).toString()))};if(baseline.text.length!==2)deny('revision_page_count');expected=baseline.files;if(locked.includes('project.json'))projectMetadata=readProject();})();await initialising;
 }
 function stable(){if(JSON.stringify(snapshot())!==JSON.stringify(expected))deny('revision_artifact_changed');}
 function advance(current,name,args){
  const next={...current,pages:[...current.pages]};
  if(['write','edit','render_deck'].includes(name)&&next.phase==='reviewed'){
   if(next.cycle>=2)deny('revision_cycle_limit',name);next.cycle++;next.phase='editing';next.writes=0;next.pages=[];
  }
  if(name==='bash')deny('revision_bash',name);
  if(name==='write'||name==='edit'){
   if(!pageFiles.includes(args?.path))deny('revision_path',name);
   if(next.phase!=='editing'||wasExported)deny('revision_phase',name);
   if(next.writes>=8)deny('revision_write_limit',name);next.writes++;
  }else if(name==='render_deck'){
   if(next.phase!=='editing'||wasExported)deny('revision_phase',name);
   if(next.renders>=2)deny('revision_render_limit',name);next.renders++;next.phase='rendered';
  }else if(name==='qa_deck'){
   if(next.phase!=='rendered'||next.qas>=2)deny('revision_qa_phase',name);next.qas++;next.phase='qa';
  }else if(name==='look_page'){
   if(!['qa','looking'].includes(next.phase)||!['page_01','page_02'].includes(args?.page)||next.pages.includes(args.page))deny('revision_look_phase',name);
   next.pages.push(args.page);next.phase=next.pages.length===2?'looked':'looking';
  }else if(name==='export_deck'&&next.phase!=='reviewed')deny('revision_stale_export',name);
  return next;
 }
 const api={
  async before(name,args){await init();stable();if(name==='export_deck')await api.finalChecks();const next=advance(state,name,args);if(next.cycle!==state.cycle){invalidate();qaPass=false;approved=false;}state=next;},
  async after(name,args,value){
   const next=snapshot();
   for(const p of Object.keys(expected))if(!(name==='render_deck'&&p==='deck/deck.pptx')&&!(['write','edit'].includes(name)&&p===args.path)&&next[p]!==expected[p])deny('revision_artifact_changed',name);
   for(let i=0;i<2;i++){const p='deck/pages/page_0'+(i+1)+'.html',html=bytes(p).toString();if(/<script\b/i.test(html)||htmlText(html)!==baseline.html[i])deny('revision_content_changed',name);}
   if(name==='render_deck'){
    const text=await Promise.all(await slideTexts());if(JSON.stringify(text)!==JSON.stringify(baseline.text))deny('revision_content_changed',name);
    versions.push({cycle:state.cycle,files:{...next}});
   }
   expected=next;
   if(name==='qa_deck')qaPass=value?.ok===true&&value.slides===2&&value.items?.some(i=>i.item==='headline_check'&&i.status==='pass');
   if(name==='export_deck')wasExported=true;
  },
  project(calls,messages){
   let projected={...state,pages:[...state.pages]};
   for(const call of calls){projected=advance(projected,call.name,call.arguments);if(call.name==='look_page')bindings.set(projected.cycle+':'+call.arguments.page,{id:call.id,prior:messages.filter(m=>m.role==='tool'&&m.toolId===call.id).length});}
  },
  recordLook(page,look){lookHistory.push({...look,cycle:state.cycle});},
  async request(request){
   await init();stable();
   if(state.phase==='looked'){
    for(const page of state.pages){
     const binding=bindings.get(state.cycle+':'+page),look=lookHistory.findLast(x=>x.cycle===state.cycle&&x.page===page);
     if(!binding||!look)deny('revision_image_unknown');
     const messages=(request.messages??[]).filter(m=>m.role==='tool'&&m.toolId===binding.id).slice(binding.prior);
     if(!messages.some(m=>m.toolName==='look_page'&&(m.images??[]).some(i=>imageHash(i)===look.image_sha256)))deny('revision_images_not_delivered');
    }
    state.phase='reviewed';
   }
  },
  delivered:()=>state.phase==='reviewed',
  async finalChecks(){await init();stable();if(state.phase!=='reviewed'||!qaPass)deny('revision_final_checks');},
  async approve(checks){await api.finalChecks();for(const page of ['page_01','page_02'])for(const item of ['content','overlap','alignment','readability'])if(checks?.[page]?.[item]!==true)deny('revision_visual_review_missing');approved=true;},
  async forExport(){await api.finalChecks();if(!approved)deny('revision_visual_review_missing');},
  async afterLocalExport(format,startedAt,completedAt){
   await init();const next=snapshot();
   for(const path of Object.keys(expected))if(path!=='project.json'&&next[path]!==expected[path])deny('revision_artifact_changed');
   if(projectMetadata!==null){
    const value=readProject(),withoutTime=v=>Object.fromEntries(Object.entries(v).filter(([key])=>key!=='updated_at'));
    if(!isDeepStrictEqual(withoutTime(value),withoutTime(projectMetadata)))deny('revision_project_changed');
    if(!iso(value.updated_at)||!iso(projectMetadata.updated_at)||Date.parse(value.updated_at)<Date.parse(projectMetadata.updated_at))deny('revision_project_time');
    if(value.updated_at!==projectMetadata.updated_at&&(Date.parse(value.updated_at)<startedAt||Date.parse(value.updated_at)>completedAt))deny('revision_project_time');
    metadataExports.push({format,before_sha256:expected['project.json'],after_sha256:next['project.json']});
    projectMetadata=value;expected={...expected,'project.json':next['project.json']};
   }
  },
  summary:()=>({...state,qa_pass:qaPass,visual_review_approved:approved,look_history:lookHistory.map(x=>({...x})),artifact_versions:versions.map(x=>({...x,files:{...x.files}})),metadata_exports:metadataExports.map(x=>({...x}))})
 };
 return api;
}

/** Further restrict the original normal reconciliation. Never rewrites any budget. */
export function bindTrialReconciliation(policy,{operation,readBudget,stopFault,onDeny=()=>{},maxActiveMsDelta=0}){
 const originalReconcile=policy.reconcile,originalBegin=policy.begin,baseline=structuredClone(readBudget());let used=false,settled=false,activeMsDelta=null,failed=false;
 function deny(reason){failed=true;onDeny(reason);throw stopFault();}
 if(!Number.isSafeInteger(maxActiveMsDelta)||maxActiveMsDelta<0||maxActiveMsDelta>60000||operation.state!=='unknown'||operation.physical_settled!==true||operation.usage_known!==false||operation.kind!=='main')deny('reconciliation_scope');
 function compare(value){
  const counters=b=>['modelCalls','toolCalls','inputTokens','outputTokens','reservedOutputTokens','resourceUnits'].map(k=>b.usage?.[k]);
  if(!isDeepStrictEqual(value.configuration,baseline.configuration)||!isDeepStrictEqual(value.limits,baseline.limits)||!isDeepStrictEqual(counters(value),counters(baseline)))deny('reconciliation_meters_changed');
  activeMsDelta=value.usage.activeMs-baseline.usage.activeMs;
  if(!Number.isSafeInteger(activeMsDelta)||activeMsDelta<0||activeMsDelta>maxActiveMsDelta)deny('reconciliation_active_ms');
 }
 policy.reconcile=function(id){
  if(failed||used||id!==operation.operation_id||!isDeepStrictEqual(policy.operation(id),operation))deny('reconciliation_scope');used=true;
  compare(readBudget());const result=originalReconcile.call(policy,id);
  if(result.state!=='stopped'||result.physical_settled!==true||result.usage_known!==false)deny('reconciliation_result_unknown');
  const after=readBudget();compare(after);settled=true;return result;
 };
 policy.begin=function(id,...args){if(failed||!settled)deny('reconciliation_required');return originalBegin.call(policy,id,...args);};
 return {
  wrap:transport=>request=>{if(failed||!settled)deny('reconciliation_transport_forbidden');return transport(request);},
  summary:()=>({attempted:used,reconciled:settled,active_ms_delta:activeMsDelta,max_active_ms_delta:maxActiveMsDelta,usage_known:false})
 };
}
