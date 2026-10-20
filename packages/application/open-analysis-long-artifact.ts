import {createHash,randomUUID} from 'node:crypto';
import type {OpenAnalysisRuntime,OpenAnalysisRun,AnalysisTool} from '../ports/open-analysis-runtime.ts';
import type {AnalysisDraftStore,DraftBinding,DraftRef,DraftCommand} from '../ports/open-analysis-draft.ts';
import {taskHash} from '../product-core/member-task.ts';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
const object=(s:string)=>{try{const x:unknown=JSON.parse(s);if(x&&typeof x==='object'&&!Array.isArray(x))return x as Record<string,unknown>;}catch{}return fail('ARTIFACT_COMPLETION_INVALID');};
export const artifactToolParameters={type:'object',properties:{action:{type:'string',enum:['read','append','patch','seal']},command_id:{type:'string'},base_version:{type:'integer',minimum:0},text:{type:'string'},before:{type:'string'},after:{type:'string'},offset:{type:'integer',minimum:0}},required:['action'],additionalProperties:false} as const;
function chunk(text:string,offset:number){let result='';for(const c of text.slice(offset)){if(Buffer.byteLength(result+c)>2048)break;result+=c;}return result;}
/** Explicit Application composition. Delegates every model turn to the one existing Runtime. */
export function withLongAnalysisArtifacts(config:{runtime:OpenAnalysisRuntime;store:AnalysisDraftStore;enabled:(task:string)=>boolean;reportMs:(task:string)=>60000|120000}):OpenAnalysisRuntime{
 const machineDeadlines=new Map<string,number>();
 return {...config.runtime,...(config.runtime.sessionControl?{async sessionControl(input:Parameters<NonNullable<OpenAnalysisRuntime['sessionControl']>>[0]){
  if(!config.enabled(input.identity.task_id)||input.command.kind!=='navigate'||!input.command.summarize)return config.runtime.sessionControl!(input);
  if(input.signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');
  const persisted=await config.runtime.openBusinessWork?.(input),start=Date.now(),deadline=persisted?.version==='2'?null:persisted?.deadline_at??start+300000;if(deadline!==null&&start>=deadline)fail('ARTIFACT_STAGE_DEADLINE');
  const b:DraftBinding={task_id:input.identity.task_id,operation_id:randomUUID(),scope_sha256:input.identity.scope_sha256,config_sha256:input.identity.config_sha256,kind:'review'},ref=config.store.begin(b,deadline===null?{max_bytes:262144,timing:'unlimited'}:{max_bytes:262144,usual_ms:300000,recovery_ms:300000,full_deadline:deadline});
  const controller=new AbortController(),timer=deadline===null?undefined:setTimeout(()=>controller.abort(),Math.max(1,deadline-start)),signal=AbortSignal.any([input.signal,controller.signal]);
  try{const value=await config.runtime.sessionControl!({...input,signal,artifactWork:{id:ref.id,admit:x=>{if(signal.aborted||!input.authorize())return false;config.store.check(b,ref.id,x.recovery);return config.store.admit(b,ref.id,x);}}});config.store.check(b,ref.id);if(signal.aborted||!input.authorize())fail('AUTHORITY_REQUIRED');config.store.close(b,ref.id,'completed');return value;}
  catch(error){config.store.close(b,ref.id,input.signal.aborted?'stopped':'failed');throw error;}finally{clearTimeout(timer);}
 }}:{}),async run(input){
  if(!config.enabled(input.identity.task_id)||input.purpose==='retained_case')return config.runtime.run(input);
  if(input.signal.aborted)fail('CANCELLED');
  if(!input.authorize())fail('AUTHORITY_REQUIRED');
  if(input.artifactWork)fail('ARTIFACT_NESTED_SCOPE');
  if(input.business_operation_id!==undefined&&!/^[a-f0-9-]{36}$/.test(input.business_operation_id))fail('ARTIFACT_OPERATION_INVALID');
  const persisted=await config.runtime.openBusinessWork?.(input),start=Date.now(),machineKey=taskHash({task_id:input.identity.task_id,operation:input.business_operation_id??input.identity.operation_id}),fullDeadline=persisted?.version==='2'?null:persisted?.deadline_at??machineDeadlines.get(machineKey)??start+300000;if(!persisted&&fullDeadline!==null)machineDeadlines.set(machineKey,fullDeadline);if(fullDeadline!==null&&start>=fullDeadline)fail('ARTIFACT_STAGE_DEADLINE');
  const purpose=input.purpose??'analysis',review=purpose==='conclusion_strategy_review',report=purpose==='report_edit';
  const usual=report?config.reportMs(input.identity.task_id):review?60000:300000;
  const binding:DraftBinding={task_id:input.identity.task_id,operation_id:hash(JSON.stringify({identity:input.identity,operation:input.business_operation_id??input.identity.operation_id,purpose,prompt:input.prompt,system:input.system})),scope_sha256:input.identity.scope_sha256,config_sha256:input.identity.config_sha256,kind:report?(input.prompt.startsWith('JuanerAI.review-revision.v1')?'revision':'report'):'review'};
  const plan:import('../ports/open-analysis-draft.ts').DraftPlan=fullDeadline===null?{max_bytes:262144,timing:'unlimited'}:{max_bytes:262144,usual_ms:usual,recovery_ms:review||report?usual*2:300000,full_deadline:fullDeadline};
  const parent=config.store.begin(binding,plan),controller=new AbortController(),timer='timing' in plan?undefined:setTimeout(()=>controller.abort(),Math.max(1,Math.min(plan.recovery_ms,plan.full_deadline-start))),signal=AbortSignal.any([input.signal,controller.signal]);
  const check=()=>{if(input.signal.aborted)fail('CANCELLED');if(controller.signal.aborted)fail('ARTIFACT_STAGE_DEADLINE');if(!input.authorize())fail('AUTHORITY_REQUIRED');config.store.check(binding,parent.id);};
  const work={id:parent.id,admit:(x:Readonly<{logicalId:string;recovery:boolean}>)=>{if(signal.aborted||!input.authorize())return false;config.store.check(binding,parent.id,x.recovery);return config.store.admit(binding,parent.id,x);}};
  const run=(next:OpenAnalysisRun)=>config.runtime.run({...next,artifactWork:work,signal});
  const construct=(b:DraftBinding,ref:DraftRef):AnalysisTool=>({name:'build_artifact',description:'只在当前获准草稿中构建完整成果；不是任意文件系统。完整工具信封，每块最多2048 UTF8字节，追加/精确修改须command_id和base_version。read返回当前确认及有限范围原文；seal冻结全文。保存不代表校验/执行/审查成功。',parameters:artifactToolParameters,execute:async(args,s)=>{
   check();if(s.aborted)fail('CANCELLED');if(args.action==='read'){if(Object.keys(args).some(k=>!['action','offset'].includes(k))||args.offset!==undefined&&(!Number.isSafeInteger(args.offset)||Number(args.offset)<0))fail('DRAFT_COMMAND_INVALID');const r=config.store.read(b,ref.id),offset=Number(args.offset??0);if(offset>r.text.length||offset>0&&/[\uD800-\uDBFF]/u.test(r.text[offset-1]??''))fail('DRAFT_RANGE_INVALID');const text=chunk(r.text,offset);return {ref:r.ref,offset,text,next_offset:offset+text.length};}
   return config.store.command(b,ref.id,args as DraftCommand);
  }});
  try{
   let result:Awaited<ReturnType<OpenAnalysisRuntime['run']>>;
   if(report&&config.runtime.artifactFiles==='v1'){
    let completed:DraftRef|undefined;
    const file={path:'draft/report.json' as const,read:async(s:AbortSignal)=>{check();if(s.aborted)fail('CANCELLED');return Buffer.from(config.store.read(binding,parent.id).text,'utf8');},write:async(bytes:Uint8Array,s:AbortSignal)=>{check();if(s.aborted||completed)fail('DRAFT_NOT_OPEN');let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('DRAFT_COMMAND_INVALID');}config.store.write(binding,parent.id,text!);check();}};
    const complete:AnalysisTool={name:'complete_artifact',description:'Seal the complete current draft/report.json. The host binds the current version and digest; incomplete, empty or already sealed output is refused. Does not grant numerical or review qualification.',parameters:{type:'object',properties:{},required:[],additionalProperties:false},execute:async(args,s)=>{check();if(s.aborted||Object.keys(args).length||completed)fail('ARTIFACT_COMPLETION_INVALID');const r=config.store.read(binding,parent.id);if(!r.text.trim()||r.ref.sealed)fail('ARTIFACT_COMPLETION_INVALID');completed=config.store.command(binding,parent.id,{action:'seal',command_id:randomUUID(),base_version:r.ref.version});return {status:'complete',sealed:true,bytes:completed.bytes};}};
    result=await run({...input,artifactFile:file,tools:[complete],system:input.system.replaceAll('无工具','仅有受限文件工具')+'\n使用原生write/edit/read在draft/report.json形成原请求合同要求的完整报告；每次写改只是草稿，不执行、不审查。完整后调用complete_artifact({})提交，系统绑定版本和身份；最后简短说明完成，不重吐正文、UUID、哈希或版本手续。'});
    check();const r=config.store.read(binding,parent.id);if(!completed||!r.ref.sealed||r.ref.version!==completed.version||r.ref.sha256!==completed.sha256)fail('ARTIFACT_COMPLETION_INVALID');result={...result,text:r.text,assembled_artifact:{version:'1.0',kind:binding.kind as 'report'|'revision',ref:r.ref}};
   }else if(report){
    const originalSystem=input.system.replaceAll('无工具','仅有受限草稿工具');
    result=await run({...input,tools:[construct(binding,parent)],system:originalSystem+'\n本轮传输方式为受限草稿：原请求的完整输出合同是最终组装内容，不是末条回复。通过build_artifact读取确认、分块追加原文或精确patch、seal完整成果；不补写宿主事实。每块最多2048 UTF8字节，完整信封须留输出余量；不得把截断当续写。最终只返回JSON {"version":"artifact-completion/1.0","id":"实际草稿id","draft_version":实际冻结版本,"sha256":"实际冻结摘要"}，不再重吐全文。初始草稿id='+parent.id});
    check();const done=object(result.text),r=config.store.read(binding,parent.id);
    if(Object.keys(done).sort().join(',')!=='draft_version,id,sha256,version'||done.version!=='artifact-completion/1.0'||done.id!==r.ref.id||done.draft_version!==r.ref.version||done.sha256!==r.ref.sha256||!r.ref.sealed)fail('ARTIFACT_COMPLETION_INVALID');
    result={...result,text:r.text,assembled_artifact:{version:'1.0',kind:binding.kind as 'report'|'revision',ref:r.ref}};
   }else if(review&&input.prompt.startsWith('JuanerAI.conclusion-strategy-review.v1\n')&&'current_proposal' in object(input.prompt.slice(input.prompt.indexOf('\n')+1))){
    result=await pagedReview(input,run,check);
   }else if(config.runtime.codeDraft!=='v1'&&input.tools.some(t=>t.name==='explore_with_python')){
    let codeIndex=0,childBinding:DraftBinding={...binding,kind:'python',operation_id:binding.operation_id+':python:'+codeIndex},child=config.store.begin(childBinding,{...plan,max_bytes:65536});
    const builder:AnalysisTool={...construct(childBinding,child),execute:async(a,s)=>construct(childBinding,child).execute(a,s)};
    const augment=(t:AnalysisTool):AnalysisTool=>!['explore_with_python','correct_exploration_code'].includes(t.name)?t:{...t,description:t.description+' 新能力允许以draft_ref:{id,version,sha256}代替code/code_lines；其它业务参数不变。只能提交当前已seal完整Python，不能半稿执行。',parameters:draftParameters(t),execute:async(a:Readonly<Record<string,unknown>>,s:AbortSignal)=>{
     if(!Object.hasOwn(a,'draft_ref'))return t.execute(a,s);check();if(Object.hasOwn(a,'code')||Object.hasOwn(a,'code_lines'))fail('DRAFT_COMMAND_INVALID');const r=config.store.read(childBinding,child.id),ref=a.draft_ref as DraftRef;
     if(!r.ref.sealed||!ref||Object.keys(ref).sort().join(',')!=='id,sha256,version'||ref.id!==r.ref.id||ref.version!==r.ref.version||ref.sha256!==r.ref.sha256)fail('DRAFT_VERSION_CONFLICT');
     const {draft_ref,...body}=a;void draft_ref;const value=await t.execute({...body,code:r.text},s);check();config.store.close(childBinding,child.id,'completed');codeIndex++;childBinding={...binding,kind:'python',operation_id:binding.operation_id+':python:'+codeIndex};child=config.store.begin(childBinding,{...plan,max_bytes:65536});return value;
    }};
    const tools=input.tools.map(augment),capabilityTools=input.capabilityTools?.map(augment);
    result=await run({...input,...(capabilityTools?{capabilityTools:[...capabilityTools,builder]}:{}),tools:[...tools,builder],system:input.system+'\n长Python可经build_artifact完整分块形成并seal，再通过原explore_with_python/correct_exploration_code传draft_ref。工具保存不执行代码；原执行/纠正/独立核验规则不变。不要在末尾重吐整段代码。'});check();
   }else{result=await run(input);check();}
   check();config.store.close(binding,parent.id,'completed');return result;
  }catch(error){config.store.close(binding,parent.id,input.signal.aborted?'stopped':config.runtime.hasUnconfirmedEffects?.(input.identity.task_id)?'unknown':'failed');if(controller.signal.aborted&&!input.signal.aborted)throw Object.assign(new Error('ARTIFACT_STAGE_DEADLINE'),{code:'ARTIFACT_STAGE_DEADLINE',provider_reason:(error as {code?:string}).code??null});throw error;}finally{clearTimeout(timer);}
 }};
}

/** All pages see the full immutable input; no page alone grants qualification. */
async function pagedReview(input:OpenAnalysisRun,run:(r:OpenAnalysisRun)=>ReturnType<OpenAnalysisRuntime['run']>,check:()=>void){
 const marker='JuanerAI.conclusion-strategy-review.v1\n',body=object(input.prompt.slice(marker.length)),snapshot=body.snapshot as {claims?:{id:string}[]},ids=snapshot?.claims?.map(c=>c.id);
 if(!ids?.length||ids.length>32||new Set(ids).size!==ids.length||typeof body.snapshot_sha256!=='string')fail('REVIEW_PAGE_PLAN_INVALID');
 const ask=async(page:unknown)=>{check();const result=await run({...input,tools:[],prompt:marker+JSON.stringify({...Object.fromEntries(Object.entries(body).filter(([k])=>k!=='output_contract')),output_contract:page}),system:input.system+'\n本轮只返回output_contract指定的完整JSON页。所有原文/证据/当前条件和候选全集仍须实际审阅；不要返回其它页或重吐原合同。没有工具。'});check();return {...result,page:object(result.text)};};
 const whole=await ask({version:'review-page/1.0',page:'whole',snapshot_sha256:body.snapshot_sha256,required_keys:['version','page','snapshot_sha256','completeness','requirement_coverage','global_issues'],completeness:{verdict:'complete|incomplete',reason:'本完整正文的需求覆盖及交互审查理由'},requirement_coverage:[{requirement_id:'每个requirements.id恰好一项',claim_ids:'该需求实际对应的完整当前ID数组',verdict:'fulfilled|incomplete'}],global_issues:'数组，每项仅claim_id,reason；只列全篇交互/冲突导致不支持的实际当前ID，无则空数组。不能把来源稿当已交付内容。'});
 const w=whole.page;if(Object.keys(w).sort().join(',')!=='completeness,global_issues,page,requirement_coverage,snapshot_sha256,version'||w.version!=='review-page/1.0'||w.page!=='whole'||w.snapshot_sha256!==body.snapshot_sha256||!Array.isArray(w.global_issues)||w.global_issues.length>32)fail('REVIEW_PAGE_INVALID');
 const issueIds=new Set<string>();for(const issue of w.global_issues){if(!issue||Object.keys(issue).sort().join(',')!=='claim_id,reason'||!ids.includes(issue.claim_id)||issueIds.has(issue.claim_id)||typeof issue.reason!=='string'||!issue.reason.trim())fail('REVIEW_PAGE_INVALID');issueIds.add(issue.claim_id);}
 const claims:unknown[]=[];const history=[...(whole.history??[])],tools=[...whole.tools];
 for(const id of ids){const r=await ask({version:'review-page/1.0',page:id,snapshot_sha256:body.snapshot_sha256,required_keys:['version','page','snapshot_sha256','claims'],target_ids:[id],global_review:w,claims:'数组，只含本页目标ID恰好一行。真实审阅全篇，global_issues对应目标须给insufficient/conflict。每项严格为claim_id,kind(conclusion|strategy),level(observation|hypothesis),verdict(supported|conditional|insufficient|conflict),evidence_refs(该单元实际fact_refs/source_refs子集，包含所有必要fact_refs),counterevidence(字符串数组),reason(具体理由),limitations(字符串数组),conditions(当前宿主见证id/text/source_quote/state数组),strategy(逐字等于该单元对象或null)。单元有content.actor_links时另给actor_correspondence数组，逐premise_id给same/different/unknown语义判断，不能靠标签认证。'});const p=r.page;
  if(Object.keys(p).sort().join(',')!=='claims,page,snapshot_sha256,version'||p.version!=='review-page/1.0'||p.page!==id||p.snapshot_sha256!==body.snapshot_sha256||!Array.isArray(p.claims)||p.claims.length!==1||p.claims[0]?.claim_id!==id||issueIds.has(id)&&!['insufficient','conflict'].includes(p.claims[0]?.verdict))fail('JUDGMENT_IDENTITY_CONFLICT');claims.push(p.claims[0]);history.push(...r.history??[]);tools.push(...r.tools);
 }
 return {...whole,text:JSON.stringify({version:'1.2',snapshot_sha256:body.snapshot_sha256,completeness:w.completeness,requirement_coverage:w.requirement_coverage,claims}),history,tools};
}

function draftParameters(t:AnalysisTool){
 const {anyOf,oneOf,required,properties,...base}=t.parameters as Record<string,unknown>;
 const conditions={...(required!==undefined?{required}:{}),...(anyOf!==undefined?{anyOf}:{}),...(oneOf!==undefined?{oneOf}:{})};
 // Reuse one declaration of every field. The alternatives change only the
 // complete-program carrier, preserving the original business requirements.
 const replace=(v:unknown):unknown=>Array.isArray(v)?v.map(replace):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='required'&&Array.isArray(x)?[...new Set(x.map(n=>['code','code_lines'].includes(n)?'draft_ref':n))]:replace(x)])):v;
 return {...base,properties:{...(properties as object??{}),draft_ref:{type:'object',properties:{id:{type:'string'},version:{type:'integer'},sha256:{type:'string'}},required:['id','version','sha256'],additionalProperties:false}},anyOf:[{...conditions,not:{required:['draft_ref']}},{...replace(conditions) as object,allOf:[{required:['draft_ref']},{not:{anyOf:[{required:['code']},{required:['code_lines']}]}}]}]};
}
