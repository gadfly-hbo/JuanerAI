import {spawn} from 'node:child_process';
import {isAbsolute} from 'node:path';
import type {LocalCredentialStore} from '../../packages/ports/provider-settings.ts';
const unavailable=()=>Object.assign(new Error('KEYCHAIN_UNAVAILABLE'),{code:'KEYCHAIN_UNAVAILABLE',stack:'KEYCHAIN_UNAVAILABLE'});
/** Fixed compiled helper, no shell/argv credential or inherited environment. */
export function createMacOsCredentialStore(helperPath:string):LocalCredentialStore{
 if(!isAbsolute(helperPath))throw unavailable();
 function call(operation:'read'|'save'|'delete',key?:string):Promise<Record<string,unknown>>{
  return new Promise((resolve,reject)=>{
   const child=spawn(helperPath,[],{stdio:['pipe','pipe','pipe'],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'}});
   let output='',failed=false;const timer=setTimeout(()=>{failed=true;child.kill('SIGTERM');reject(unavailable());},30000);
   child.stdout.on('data',chunk=>{output+=String(chunk);if(Buffer.byteLength(output)>16384){failed=true;child.kill('SIGTERM');}});
   // Consume and discard: raw OS diagnostics must not enter application logs.
   child.stderr.resume();child.stdin.on('error',()=>{failed=true;});
   child.on('error',()=>{clearTimeout(timer);reject(unavailable());});
   child.on('close',code=>{clearTimeout(timer);try{if(failed||code!==0)throw unavailable();const result=JSON.parse(output);output='';if(!result||typeof result!=='object'||Array.isArray(result))throw unavailable();resolve(result);}catch{reject(unavailable());}});
   child.stdin.end(JSON.stringify({operation,interactive:true,...(key===undefined?{}:{key})}));
  });
 }
 return {
  async read(){const r=await call('read');if(r.status==='absent'&&Object.keys(r).length===1)return {status:'absent'};if(r.status==='found'&&typeof r.key==='string'&&Object.keys(r).length===2)return {status:'found',key:r.key};throw unavailable();},
  async save(key){const r=await call('save',key);if(r.status!=='ok'||Object.keys(r).length!==1)throw unavailable();},
  async delete(){const r=await call('delete');if(!['ok','absent'].includes(String(r.status))||Object.keys(r).length!==1)throw unavailable();},
 };
}
