import {createHash} from 'node:crypto';
import {mkdirSync,lstatSync,realpathSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync,readdirSync} from 'node:fs';
import {isAbsolute,join} from 'node:path';
import type {MetricCopies,MetricPublication,MetricReceipt} from '../../packages/ports/metric-factory.ts';
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const identity=(id:string,version?:string)=>{if(!/^[a-z][a-z0-9-]*$/.test(id)||version!==undefined&&!/^\d+\.\d+\.\d+$/.test(version))throw Error('MF_COPY_ID_INVALID');};
export function createMetricCopies(root:string,sourceSnapshot:string):MetricCopies {
 if(!isAbsolute(root)||!/^[a-f0-9]{64}$/.test(sourceSnapshot))throw Error('MF_COPY_ROOT_INVALID');
 const checked=(path:string)=>{const s=lstatSync(path);if(!s.isFile()||s.nlink!==1||realpathSync(path)!==path||s.size>32*1024*1024)throw Error('MF_COPY_INVALID');return readFileSync(path);};
 const prepare=(id:string)=>{mkdirSync(root,{recursive:true,mode:0o700});if(realpathSync(root)!==root)throw Error('MF_COPY_ROOT_INVALID');const dir=join(root,id);mkdirSync(dir,{recursive:true,mode:0o700});if(realpathSync(dir)!==dir)throw Error('MF_COPY_ROOT_INVALID');return dir;};
 const put=(path:string,bytes:Uint8Array)=>{try{const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;if(!checked(path).equals(Buffer.from(bytes)))throw Error('MF_COPY_CONFLICT');}};
 const read=(id:string,version?:string)=>{
  identity(id,version);const dir=join(root,id);
  if(realpathSync(root)!==root||realpathSync(dir)!==dir)throw Error('MF_COPY_ROOT_INVALID');
  if(version===undefined){const versions=readdirSync(dir).filter(n=>/^\d+\.\d+\.\d+\.json$/.test(n)).map(n=>n.slice(0,-5));versions.sort((a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return x[0]-y[0]||x[1]-y[1]||x[2]-y[2];});version=versions.at(-1);if(!version)throw Error('MF_COPY_NOT_FOUND');}
  const receipt=JSON.parse(checked(join(dir,version+'.json')).toString('utf8')) as MetricReceipt;
  const bytes=checked(join(dir,version+'.sap.yaml'));
  if(receipt.packageId!==id||receipt.version!==version||receipt.sourceSnapshot!==sourceSnapshot||receipt.sha256!==hash(bytes)||receipt.bytes!==bytes.length||!/^sha256:[a-f0-9]{64}$/.test(receipt.contentFingerprint)||!/^sha256:[a-f0-9]{64}$/.test(receipt.packageFingerprint)||!Number.isFinite(Date.parse(receipt.savedAt)))throw Error('MF_COPY_CORRUPT');
  return {receipt,bytes};
 };
 return {read,save(value:MetricPublication){
  identity(value.packageId,value.version);
  if(!/^[a-f0-9]{64}$/.test(value.sha256)||!/^sha256:[a-f0-9]{64}$/.test(value.contentFingerprint)||!/^sha256:[a-f0-9]{64}$/.test(value.packageFingerprint)||value.bytes.length>32*1024*1024||hash(value.bytes)!==value.sha256)throw Error('MF_PUBLICATION_INVALID');
  const dir=prepare(value.packageId),file=join(dir,value.version);
  try{const old=read(value.packageId,value.version);if(old.receipt.sha256!==value.sha256||old.receipt.contentFingerprint!==value.contentFingerprint||old.receipt.packageFingerprint!==value.packageFingerprint)throw Error('MF_COPY_CONFLICT');return old.receipt;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  put(file+'.sap.yaml',value.bytes);
  const receipt:MetricReceipt={packageId:value.packageId,version:value.version,contentFingerprint:value.contentFingerprint,packageFingerprint:value.packageFingerprint,sha256:value.sha256,bytes:value.bytes.length,sourceSnapshot,savedAt:new Date().toISOString()};
  put(file+'.json',Buffer.from(JSON.stringify(receipt)+'\n'));
  const fd=openSync(dir,'r');try{fsyncSync(fd);}finally{closeSync(fd);}
  return read(value.packageId,value.version).receipt;
 }};
}
