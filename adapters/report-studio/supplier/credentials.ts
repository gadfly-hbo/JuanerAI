import {spawn} from 'node:child_process';
import {lstat} from 'node:fs/promises';
import {isAbsolute} from 'node:path';

export type StudioProvider='minimax-cn'|'xiaomi-token-plan-cn';
const provider=(value:unknown):value is StudioProvider=>value==='minimax-cn'||value==='xiaomi-token-plan-cn';
const validKey=(value:unknown):value is string=>typeof value==='string'&&value.length>0&&value.trim()===value&&Buffer.byteLength(value)<=4096&&!/[\r\n\0]/.test(value);
const failure=(code:string)=>Object.assign(new Error(code),{code,stack:code});
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).sort().join(',')===keys.sort().join(',');

/** Fixed own-namespace helper. No secret in argv, environment, errors, or application metadata. */
export function createStudioCredentialStore(helper:string) {
 if(!isAbsolute(helper))throw failure('RS_CREDENTIAL_INVALID');
 async function call(operation:'read'|'save'|'delete',selected:StudioProvider,key?:string):Promise<Record<string,unknown>> {
  if(!provider(selected)||key!==undefined&&!validKey(key))throw failure('RS_CREDENTIAL_INVALID');
  const uncertain=operation==='read'?'RS_CREDENTIAL_UNAVAILABLE':'RS_CREDENTIAL_WRITE_UNKNOWN';
  try {const stat=await lstat(helper);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||(stat.mode&0o111)===0)throw Error();}
  catch {throw failure('RS_CREDENTIAL_UNAVAILABLE');}
  return new Promise((accept,reject)=>{
   const child=spawn(helper,[],{stdio:['pipe','pipe','pipe'],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'}});
   let output:Buffer[]=[],length=0,invalid=false;
   const timer=setTimeout(()=>{invalid=true;child.kill('SIGKILL');},30000);
   child.stdout.on('data',(chunk:Buffer)=>{length+=chunk.length;if(length>16384){invalid=true;output=[];child.kill('SIGKILL');}else if(!invalid)output.push(chunk);});
   child.stderr.resume();child.stdin.on('error',()=>{invalid=true;});
   child.once('error',()=>{clearTimeout(timer);output=[];reject(failure('RS_CREDENTIAL_UNAVAILABLE'));});
   child.once('close',code=>{
    clearTimeout(timer);
    try {
     if(invalid||code!==0)throw Error();
     const value:unknown=JSON.parse(Buffer.concat(output).toString('utf8'));output=[];
     if(!value||typeof value!=='object'||Array.isArray(value))throw Error();
     accept(value as Record<string,unknown>);
    }catch{output=[];reject(failure(uncertain));}
   });
   child.stdin.end(JSON.stringify({operation,provider:selected,interactive:operation!=='read',...(key===undefined?{}:{key})}));
  });
 }
 return {
  async read(selected:StudioProvider):Promise<string|null> {
   const value=await call('read',selected);
   if(value.status==='absent'&&exact(value,['status']))return null;
   if(value.status==='found'&&exact(value,['status','key'])&&validKey(value.key))return value.key;
   throw failure('RS_CREDENTIAL_UNAVAILABLE');
  },
  async save(selected:StudioProvider,key:string):Promise<void> {
   if(!validKey(key))throw failure('RS_CREDENTIAL_INVALID');const value=await call('save',selected,key);
   if(value.status!=='ok'||!exact(value,['status']))throw failure('RS_CREDENTIAL_WRITE_UNKNOWN');
  },
  async remove(selected:StudioProvider):Promise<void> {
   const value=await call('delete',selected);
   if(!['ok','absent'].includes(String(value.status))||!exact(value,['status']))throw failure('RS_CREDENTIAL_WRITE_UNKNOWN');
  },
 };
}
