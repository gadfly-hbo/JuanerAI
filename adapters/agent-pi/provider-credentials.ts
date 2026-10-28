import {open} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import type {LocalCredentialStore} from '../../packages/ports/provider-settings.ts';

const defaultRecipients={
 'minimax-cn':{model:'MiniMax-M3',endpoint:'https://api.minimaxi.com/anthropic'},
 'xiaomi-token-plan-cn':{model:'mimo-v2.6-flash',endpoint:'https://token-plan-cn.xiaomimimo.com/v1'},
 'deepseek':{model:'deepseek-flash',endpoint:'https://api.deepseek.com'},
} as const;
type Provider=keyof typeof defaultRecipients;
type State='missing'|'invalid'|'unreadable'|'conflict'|'configured';
type Credential={provider:Provider;model:string;endpoint:string;key:string};
type Source={state:'missing'|'invalid'|'unreadable'|'loaded';data:Record<string,unknown>};
async function readBounded(path:string):Promise<string>{
 const file=await open(path,'r');
 try{
  const stat=await file.stat();if(!stat.isFile()||stat.size>262144)fail('CREDENTIAL_SOURCE_INVALID');
  const bytes=Buffer.alloc(262145);let length=0;
  while(length<bytes.length){const chunk=await file.read(bytes,length,bytes.length-length,length);if(chunk.bytesRead===0)break;length+=chunk.bytesRead;}
  if(length>262144)fail('CREDENTIAL_SOURCE_INVALID');return bytes.subarray(0,length).toString('utf8');
 }
 finally{await file.close();}
}
const record=(v:unknown):Record<string,unknown>|null=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
const validKey=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&Buffer.byteLength(v)<=4096&&!/[\r\n\0]/.test(v);
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}

/** Private backend snapshot. Neither status/readback nor a model request scans files. */
export function createApprovedProviderCredentials(options:{homeDirectory?:string;environment?:Readonly<Record<string,string|undefined>>;readText?:(path:string)=>Promise<string>;legacyZcode?:boolean;backupStore?:Pick<LocalCredentialStore,'read'>}={}) {
 const recipients=defaultRecipients;
 const home=options.homeDirectory??homedir(),env=options.environment??process.env,readText=options.readText??readBounded;
 let authorized=false,busy=false,revision=0;
 let states:Record<Provider,State>={'minimax-cn':'missing','xiaomi-token-plan-cn':'missing','deepseek':'missing'};
 let snapshot=new Map<Provider,Credential>();
 async function source(path:string):Promise<Source>{
  try{const text=await readText(path);if(Buffer.byteLength(text)>262144)return {state:'invalid',data:{}};const data=record(JSON.parse(text));return data?{state:'loaded',data}:{state:'invalid',data:{}};}
  catch(error){const code=record(error)?.code;return {state:code==='ENOENT'?'missing':code==='EACCES'||code==='EPERM'?'unreadable':'invalid',data:{}};}
 }
 function candidates(src:Source,provider:Provider):{state:State;credential?:Credential}{
  if(src.state!=='loaded')return {state:src.state};
  const providers=record(src.data.provider);
  if(src.data.provider!==undefined&&!providers)return {state:'invalid'};
  const matching=Object.values(providers??{}).map(p=>record(record(p)?.options)).filter(p=>p?.baseURL===recipients[provider].endpoint||provider==='minimax-cn'&&p?.baseURL==='https://api.minimax.cn/anthropic');
  if(matching.length>1)return {state:'conflict'};
  if(!matching.length)return {state:'missing'};
  const key=matching[0]!.apiKey;
  if(!validKey(key))return {state:key===undefined||key===''?'missing':'invalid'};
  return {state:'configured',credential:{provider,...recipients[provider],key:key.trim()}};
 }
 function status(){return {
  primary:{provider:'minimax-cn',host:'api.minimaxi.com',state:states['minimax-cn']},
  backup:{provider:'xiaomi-token-plan-cn',host:'token-plan-cn.xiaomimimo.com',state:states['xiaomi-token-plan-cn']},
  deepseek:{provider:'deepseek',host:'api.deepseek.com',state:states.deepseek},
 };}
 async function refresh(permission:boolean){
  if(!permission){revision++;authorized=false;snapshot.clear();states={'minimax-cn':'missing','xiaomi-token-plan-cn':'missing','deepseek':'missing'};fail('CREDENTIAL_READ_NOT_AUTHORIZED');}
  if(busy)fail('CREDENTIAL_REFRESH_BUSY');
  busy=true;authorized=false;snapshot.clear();const current=++revision;
  const assertCurrent=()=>{if(current!==revision)fail('CREDENTIAL_REFRESH_REVOKED');};
  const next=new Map<Provider,Credential>(),nextStates:Record<Provider,State>={'minimax-cn':'missing','xiaomi-token-plan-cn':'missing','deepseek':'missing'};
  try{
   const key=env.LLM_API_KEY,endpoint=env.LLM_BASE_URL,model=env.LLM_MODEL;
   if(key||endpoint||model){
    const provider=(Object.keys(recipients) as Provider[]).find(p=>p!=='deepseek'&&(recipients[p].endpoint===endpoint||p==='minimax-cn'&&endpoint==='https://api.minimax.cn/anthropic')&&recipients[p].model===model);
    if(!provider||!validKey(key)){states={'minimax-cn':'conflict','xiaomi-token-plan-cn':'conflict','deepseek':'conflict'};authorized=true;return status();}
    next.set(provider,{provider,...recipients[provider],key:key.trim()});nextStates[provider]='configured';
   }
   // One directed private key; endpoint/model cannot be overridden by environment.
   if(env.DEEPSEEK_API_KEY!==undefined){
    const key=env.DEEPSEEK_API_KEY;
    if(validKey(key)){next.set('deepseek',{provider:'deepseek',...recipients.deepseek,key:key.trim()});nextStates.deepseek='configured';}
    else nextStates.deepseek='invalid';
   }
   if(options.legacyZcode===true){
    const zcode=await source(join(home,'.zcode','v2','config.json'));
    assertCurrent();
    for(const provider of Object.keys(recipients) as Provider[]){
     if(provider==='deepseek')continue;
     if(next.has(provider))continue;
     const found=candidates(zcode,provider);nextStates[provider]=found.state;
     if(found.credential)next.set(provider,found.credential);
    }
   }
   if(!next.has('xiaomi-token-plan-cn')&&nextStates['xiaomi-token-plan-cn']==='missing'&&options.backupStore){
    let saved:Awaited<ReturnType<LocalCredentialStore['read']>>|undefined;
    try{saved=await options.backupStore.read();}catch{nextStates['xiaomi-token-plan-cn']='unreadable';}
    assertCurrent();
    if(saved?.status==='found'){
     if(validKey(saved.key)){next.set('xiaomi-token-plan-cn',{provider:'xiaomi-token-plan-cn',...recipients['xiaomi-token-plan-cn'],key:saved.key.trim()});nextStates['xiaomi-token-plan-cn']='configured';}
     else nextStates['xiaomi-token-plan-cn']='invalid';
    }
   }
   if(!next.has('minimax-cn')&&nextStates['minimax-cn']!=='conflict'){
    const pi=await source(join(home,'.pi','agent','auth.json'));
    assertCurrent();
    const entries=['minimax-cn','minimax'].filter(p=>pi.data[p]!==undefined).map(p=>record(pi.data[p]));
    const keys=entries.map(p=>p?.key).filter(validKey);
    if(entries.length>1)nextStates['minimax-cn']='conflict';
    else if(keys.length===1){next.set('minimax-cn',{provider:'minimax-cn',...recipients['minimax-cn'],key:keys[0]!.trim()});nextStates['minimax-cn']='configured';}
    else if(entries.length)nextStates['minimax-cn']='invalid';
    else if(nextStates['minimax-cn']==='missing'&&pi.state!=='loaded')nextStates['minimax-cn']=pi.state;
   }
   snapshot=next;states=nextStates;authorized=true;return status();
  }finally{busy=false;}
 }
 async function withCredential<T>(provider:string,run:(credential:Readonly<Credential>)=>Promise<T>|T):Promise<T>{
  if(!authorized||busy||!Object.hasOwn(recipients,provider))fail('CREDENTIAL_UNAVAILABLE');
  const credential=snapshot.get(provider as Provider);if(!credential)fail('CREDENTIAL_UNAVAILABLE');
  return run({...credential});
 }
 return {refresh,status,withCredential};
}
