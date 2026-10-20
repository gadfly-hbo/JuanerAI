import {createHash} from 'node:crypto';
import {constants,openSync,closeSync,fstatSync,lstatSync,mkdirSync,readFileSync,writeFileSync,fsyncSync,renameSync,unlinkSync} from 'node:fs';
import {resolve,join,parse} from 'node:path';
import type {AnalysisDraftStore,DraftBinding,DraftCommand,DraftRef,DraftPlan} from '../../packages/ports/open-analysis-draft.ts';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
const validId=(s:string)=>/^[a-f0-9]{64}$/.test(s);
const bytes=(s:string)=>Buffer.byteLength(s,'utf8');
const validText=(s:unknown):s is string=>typeof s==='string'&&!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(s);
type Record_={version:'1.0'|'1.1'|'1.2';binding:DraftBinding;plan:DraftPlan;created:number;state:'open'|'completed'|'failed'|'stopped'|'unknown';text:string;ref:DraftRef;commands:Record<string,{digest:string;ref:DraftRef}>;normal:string[];recovery:string|null};
/** Dedicated local private drafts; synchronous CAS transactions never release an uncertain writer lock. */
export function createLocalAnalysisDraftStore(config:{root:string;now?:()=>number}):AnalysisDraftStore{
 const root=resolve(config.root),now=config.now??Date.now;
 function directories(){let p=parse(root).root;for(const part of root.slice(p.length).split('/').filter(Boolean)){p=join(p,part);try{mkdirSync(p,{mode:0o700});}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}const st=lstatSync(p);if(st.isSymbolicLink()||!st.isDirectory())fail('DRAFT_PATH_INVALID');}}
 directories();const rootIdentity=lstatSync(root);
 function safeRoot(){const s=lstatSync(root);if(s.isSymbolicLink()||s.ino!==rootIdentity.ino||s.dev!==rootIdentity.dev)fail('DRAFT_PATH_INVALID');let p=parse(root).root;for(const v of root.slice(p.length).split('/').filter(Boolean)){p=join(p,v);if(lstatSync(p).isSymbolicLink())fail('DRAFT_PATH_INVALID');}}
 const canonicalBinding=(b:DraftBinding)=>({task_id:b.task_id,operation_id:b.operation_id,scope_sha256:b.scope_sha256,config_sha256:b.config_sha256,kind:b.kind});
 const idOf=(b:DraftBinding)=>hash(JSON.stringify(canonicalBinding(b)));
 function assertBinding(b:DraftBinding){if(!b||Object.keys(b).sort().join(',')!=='config_sha256,kind,operation_id,scope_sha256,task_id'||!['python','report','revision','review'].includes(b.kind)||['task_id','operation_id','scope_sha256','config_sha256'].some(k=>typeof Reflect.get(b,k)!=='string'||!Reflect.get(b,k)||Reflect.get(b,k).length>256)||!validId(b.scope_sha256)||!validId(b.config_sha256))fail('DRAFT_BINDING_INVALID');}
 function path(b:DraftBinding,id:string){assertBinding(b);if(!validId(id)||id!==idOf(b))fail('DRAFT_BINDING_INVALID');safeRoot();return join(root,id+'.json');}
 function read(b:DraftBinding,id:string):Record_{
  const p=path(b,id),fd=openSync(p,constants.O_RDONLY|constants.O_NOFOLLOW);let raw:string;
  try{const st=fstatSync(fd);if(!st.isFile()||st.nlink!==1||st.size>1_048_576)fail('DRAFT_STATE_INVALID');raw=readFileSync(fd,'utf8');}finally{closeSync(fd);}
  const r=JSON.parse(raw!) as Record_;if(!['1.0','1.1','1.2'].includes(r.version)||('timing' in r.plan)!==(r.version==='1.2')||!validPlan(r.binding,r.plan)||JSON.stringify(canonicalBinding(r.binding))!==JSON.stringify(canonicalBinding(b))||r.ref.id!==id||r.ref.bytes!==bytes(r.text)||r.ref.sha256!==hash(r.text)||!validText(r.text)||!Number.isSafeInteger(r.ref.version)||r.ref.version<0||!Array.isArray(r.normal)||r.normal.length>256||r.ref.bytes>r.plan.max_bytes)fail('DRAFT_STATE_INVALID');return r;
 }
 function transaction<T>(b:DraftBinding,id:string,operation:()=>{value:T;record?:Record_}):T{
  const p=path(b,id),lock=join(root,id+'.lock');const fd=openSync(lock,'wx',0o600);closeSync(fd);let uncertain=false;
  try{const out=operation();if(out.record){const tmp=p+'.pending';const f=openSync(tmp,'wx',0o600);try{writeFileSync(f,JSON.stringify(out.record));fsyncSync(f);}catch(e){uncertain=true;throw e;}finally{closeSync(f);}uncertain=true;safeRoot();renameSync(tmp,p);const d=openSync(root,constants.O_RDONLY);try{fsyncSync(d);}finally{closeSync(d);}uncertain=false;}return out.value;}
  finally{if(!uncertain)unlinkSync(lock);}
 }
 function validPlan(b:DraftBinding,p:DraftPlan){return !!p&&Number.isSafeInteger(p.max_bytes)&&p.max_bytes>=1&&p.max_bytes<=(b.kind==='python'?65536:262144)&&('timing' in p?p.timing==='unlimited'&&Object.keys(p).sort().join(',')==='max_bytes,timing':[p.usual_ms,p.recovery_ms,p.full_deadline].every(Number.isSafeInteger)&&p.usual_ms>=1&&p.recovery_ms>=p.usual_ms);}
 function active(r:Record_,recovery=false){const elapsed=now()-r.created;return r.state==='open'&&elapsed>=0&&('timing' in r.plan?r.plan.timing==='unlimited':now()<=r.plan.full_deadline&&elapsed<=(r.recovery===null&&!recovery?r.plan.usual_ms:r.plan.recovery_ms));}
 return {
  begin(b,plan){assertBinding(b);if(!validPlan(b,plan))fail('DRAFT_PLAN_INVALID');const id=idOf(b);return transaction(b,id,()=>{try{read(b,id);fail('DRAFT_ALREADY_EXISTS');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}const ref={id,version:0,sha256:hash(''),bytes:0,sealed:false};return {value:ref,record:{version:'timing' in plan?'1.2':'1.1',binding:structuredClone(b),plan:{...plan},created:now(),state:'open',text:'',ref,commands:{},normal:[],recovery:null}};});},
  read(b,id){const r=read(b,id);return {ref:r.ref,text:r.text};},
  write(b,id,text){return transaction(b,id,()=>{const r=read(b,id);if(!active(r)||r.ref.sealed)fail('DRAFT_NOT_OPEN');if(!validText(text)||bytes(text)>r.plan.max_bytes)fail('DRAFT_SIZE_INVALID');r.text=text;r.ref={...r.ref,version:r.ref.version+1,sha256:hash(text),bytes:bytes(text)};return {value:structuredClone(r.ref),record:r};});},
  command(b,id,c){return transaction(b,id,()=>{const r=read(b,id);if(!/^[a-zA-Z0-9_-]{1,128}$/.test(c.command_id)||!Number.isSafeInteger(c.base_version))fail('DRAFT_COMMAND_INVALID');const digest=hash(JSON.stringify(r.version==='1.0'?c:Object.keys(c).sort().map(k=>[k,Reflect.get(c,k)]))),prior=r.commands[c.command_id];if(prior){if(prior.digest!==digest)fail('DRAFT_COMMAND_CONFLICT');return {value:prior.ref};}
   if(!active(r))fail('DRAFT_NOT_ACTIVE');if(r.ref.sealed||c.base_version!==r.ref.version)fail('DRAFT_VERSION_CONFLICT');if(Object.keys(r.commands).length>=256)fail('DRAFT_PLAN_EXHAUSTED');
   let text=r.text;
   if(c.action==='append'){if(!validText(c.text)||!bytes(c.text)||bytes(c.text)>2048||Object.keys(c).length!==4)fail('DRAFT_CHUNK_INVALID');text+=c.text;}
   else if(c.action==='patch'){if(!validText(c.before)||!validText(c.after)||!c.before||bytes(c.before)>2048||bytes(c.after)>2048||c.before===c.after||text.indexOf(c.before)<0||text.indexOf(c.before)!==text.lastIndexOf(c.before)||Object.keys(c).length!==5)fail('DRAFT_PATCH_INVALID');text=text.replace(c.before,()=>c.after);}
   else if(c.action!=='seal'||!text||Object.keys(c).length!==3)fail('DRAFT_COMMAND_INVALID');
   if(bytes(text)>r.plan.max_bytes)fail('DRAFT_SIZE_LIMIT');const ref={id,version:r.ref.version+1,sha256:hash(text),bytes:bytes(text),sealed:c.action==='seal'};r.text=text;r.ref=ref;r.commands[c.command_id]={digest,ref};return {value:ref,record:r};});},
  admit(b,id,input){return transaction(b,id,()=>{const r=read(b,id);if(!active(r,input.recovery)||typeof input.logicalId!=='string'||!input.logicalId||input.logicalId.length>256)return {value:false};if(input.recovery){if(r.recovery!==null||!r.normal.includes(input.logicalId))return {value:false};r.recovery=input.logicalId;}else{if(r.normal.length>=256||r.normal.includes(input.logicalId))return {value:false};r.normal.push(input.logicalId);}return {value:true,record:r};});},
  check(b,id,recovery=false){if(!active(read(b,id),recovery))fail('ARTIFACT_STAGE_DEADLINE');},
  close(b,id,status){transaction(b,id,()=>{const r=read(b,id);if(r.state!=='open'&&r.state!==status)fail('DRAFT_TERMINAL_CONFLICT');r.state=status;return {value:undefined,record:r};});},
 };
}
