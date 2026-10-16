import {constants} from 'node:fs';
import {lstat,open,realpath,rename,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import type {StudioProvider,createStudioCredentialStore} from './credentials.js';

type State={schema_version:'1';revision:number;state:'ready'|'saving'|'unknown';providers:StudioProvider[];operation:{id:string;provider:StudioProvider;kind:'save'|'delete'}|null};
const providers:StudioProvider[]=['minimax-cn','xiaomi-token-plan-cn'];
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
function fail(code='RS_CONFIGURATION_INVALID'):never{throw Object.assign(new Error(code),{code,stack:code});}
const exact=(v:unknown,keys:string[])=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v);
const blank=():State=>({schema_version:'1',revision:0,state:'ready',providers:[],operation:null});
const publicState=(v:State)=>({revision:v.revision,state:v.state==='saving'?'unknown':v.state==='ready'&&!v.providers.length?'not_configured':v.state,providers:[...v.providers],...(v.operation?{pending_provider:v.operation.provider,pending_kind:v.operation.kind}:{}),provider_verification:'not_performed' as const});

/** One owned writer. OS-keychain effects are never automatically replayed or called by status(). */
export function createStudioConfiguration(config:{dataRoot:string;credentials:ReturnType<typeof createStudioCredentialStore>;canChange():Promise<boolean>;newId():string}) {
 const file=join(config.dataRoot,'.juanerai-configuration.json');let writing=false;
 async function safeRoot(){const path=await realpath(config.dataRoot),stat=await lstat(config.dataRoot);if(path!==resolve(config.dataRoot)||!stat.isDirectory()||stat.isSymbolicLink())fail('RS_CONFIGURATION_UNSAFE');}
 async function read():Promise<State> {
  await safeRoot();let handle;
  try {handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}
  catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return blank();fail('RS_CONFIGURATION_UNSAFE');}
  try {
   const stat=await handle.stat();if(!stat.isFile()||stat.nlink!==1||stat.size>32768)fail();
   const buffer=Buffer.alloc(32769);let length=0;
   while(length<buffer.length){const {bytesRead}=await handle.read(buffer,length,buffer.length-length,null);if(!bytesRead)break;length+=bytesRead;}
   const after=await handle.stat();if(length!==stat.size||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs)fail();
   const envelope=JSON.parse(buffer.subarray(0,length).toString('utf8'));
   if(!exact(envelope,['body','sha256'])||typeof envelope.body!=='string'||digest(envelope.body)!==envelope.sha256)fail();const v=JSON.parse(envelope.body) as State;
   if(!exact(v,['schema_version','revision','state','providers','operation'])||v.schema_version!=='1'||!Number.isSafeInteger(v.revision)||v.revision<1||!['ready','saving','unknown'].includes(v.state)||!Array.isArray(v.providers)||v.providers.some(p=>!providers.includes(p))||JSON.stringify(v.providers)!==JSON.stringify(providers.filter(p=>v.providers.includes(p))))fail();
   if(v.state==='ready'){if(v.operation!==null)fail();}
   else if(!exact(v.operation,['id','provider','kind'])||!uuid(v.operation?.id)||!providers.includes(v.operation!.provider)||!['save','delete'].includes(v.operation!.kind))fail();
   return v;
  }catch(error){if((error as {code?:string}).code?.startsWith('RS_'))throw error;fail();}finally{await handle.close();}
 }
 async function persist(value:State){
  await safeRoot();try{const stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)fail('RS_CONFIGURATION_UNSAFE');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const id=config.newId();if(!uuid(id))fail();const temporary=file+'.'+id+'.tmp',body=JSON.stringify(value),handle=await open(temporary,'wx',0o600);
  try{await handle.writeFile(JSON.stringify({body,sha256:digest(body)}));await handle.sync();}finally{await handle.close();}
  try{await rename(temporary,file);}catch(error){await unlink(temporary).catch(()=>{});throw error;}
 }
 async function change(selected:StudioProvider,key:string|undefined,expected:number){
  if(!providers.includes(selected)||!Number.isSafeInteger(expected)||expected<0||key!==undefined&&(typeof key!=='string'||!key.length||key.trim()!==key||Buffer.byteLength(key)>4096||/[\r\n\0]/.test(key)))fail('RS_CREDENTIAL_INVALID');
  if(writing)fail('RS_CONFIGURATION_PENDING');writing=true;
  try{
   const previous=await read();if(previous.revision!==expected)fail('RS_CONFIGURATION_CHANGED');
   if(previous.state!=='ready'&&previous.operation?.provider!==selected)fail('RS_CONFIGURATION_RECONCILIATION_REQUIRED');
   if(!await config.canChange())fail('RS_PROJECT_PENDING');
   const id=config.newId();if(!uuid(id))fail();const intent:State={...previous,revision:expected+1,state:'saving',operation:{id,provider:selected,kind:key===undefined?'delete':'save'}};
   await persist(intent);
   try{
    if(key===undefined)await config.credentials.remove(selected);else await config.credentials.save(selected,key);
    const saved=await config.credentials.read(selected);if(saved!==(key??null))fail('RS_CREDENTIAL_WRITE_UNKNOWN');
    const enabled=new Set(previous.providers);if(key===undefined)enabled.delete(selected);else enabled.add(selected);
    const settled:State={...intent,state:'ready',providers:providers.filter(p=>enabled.has(p)),operation:null};await persist(settled);
    const readback=await read();if(JSON.stringify(readback)!==JSON.stringify(settled))fail('RS_CREDENTIAL_WRITE_UNKNOWN');return publicState(readback);
   }catch{
    // Preserve uncertainty even if the helper or the final file reply was lost. No retry.
    await persist({...intent,state:'unknown'}).catch(()=>{});fail('RS_CREDENTIAL_WRITE_UNKNOWN');
   }
  }finally{writing=false;}
 }
 return {
  async status(){return publicState(await read());},
  async save(selected:StudioProvider,key:string,revision:number){if(typeof key!=='string')fail('RS_CREDENTIAL_INVALID');return change(selected,key,revision);},
  remove:(selected:StudioProvider,revision:number)=>change(selected,undefined,revision),
  async load():Promise<Map<StudioProvider,string>> {
   if(writing)fail('RS_CONFIGURATION_UNAVAILABLE');const value=await read();if(value.state!=='ready'||!value.providers.length)fail('RS_CONFIGURATION_UNAVAILABLE');
   const result=new Map<StudioProvider,string>();
   try{for(const p of value.providers){const key=await config.credentials.read(p);if(!key)fail('RS_CONFIGURATION_UNAVAILABLE');result.set(p,key);}}
   catch{result.clear();fail('RS_CONFIGURATION_UNAVAILABLE');}
   if(writing||JSON.stringify(await read())!==JSON.stringify(value)){result.clear();fail('RS_CONFIGURATION_CHANGED');}return result;
  },
 };
}
