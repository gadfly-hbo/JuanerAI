import {readFileSync,writeFileSync,mkdirSync,readdirSync,renameSync,lstatSync,realpathSync,existsSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
import {sha256,SOURCE_COMMIT} from './bundle.mjs';
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value);
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const read=(root,path)=>{const file=join(root,path);if(!lstatSync(file).isFile()||realpathSync(file)!==file)throw Error('DR_COPY_UNSAFE');return readFileSync(file);};
const flush=path=>{const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}};
export function createResearchCopies({root,taskId}){
 if(!uuid(taskId)||!isAbsolute(root))throw Error('DR_COPY_IDENTITY');mkdirSync(root,{recursive:true,mode:0o700});if(realpathSync(root)!==root)throw Error('DR_COPY_UNSAFE');
 const readCopy=id=>{if(!hash(id))throw Error('DR_COPY_IDENTITY');const receipt=JSON.parse(read(root,id+'/receipt.json'));const bytes=read(root,id+'/research.zip');if(receipt.id!==id||!hash(receipt.contentSha256)||sha256(JSON.stringify([taskId,receipt.projectId,receipt.runId,receipt.version,receipt.contentSha256]))!==id||!Array.isArray(receipt.limitations)||!receipt.limitations.every(v=>typeof v==='string')||!Array.isArray(receipt.unresolved)||!receipt.unresolved.every(v=>typeof v==='string')||typeof receipt.copiedAt!=='string'||receipt.taskId!==taskId||receipt.sourceCommit!==SOURCE_COMMIT||receipt.bytes!==bytes.length||receipt.sha256!==sha256(bytes))throw Error('DR_COPY_CORRUPTED');return {receipt,bytes};};
 const list=()=>readdirSync(root).filter(hash).map(id=>readCopy(id).receipt).sort((a,b)=>a.copiedAt.localeCompare(b.copiedAt)||a.id.localeCompare(b.id));
 const same=(a,b)=>a.projectId===b.projectId&&a.runId===b.runId&&a.version===b.version;
 const commandPath=id=>{if(!uuid(id))throw Error('DR_COMMAND_INVALID');return 'command-'+id+'.json';};
 const command=id=>{const path=commandPath(id);return existsSync(join(root,path))?JSON.parse(read(root,path)):null;};
 const writeCommand=(id,value)=>{const temp=join(root,'.command-'+randomUUID());writeFileSync(temp,JSON.stringify(value),{flag:'wx',mode:0o600});flush(temp);renameSync(temp,join(root,commandPath(id)));flush(root);};
 const receipt=commandId=>{
  const value=command(commandId);if(!value?.id)return null;
  if(!hash(value.id))throw Error('DR_COPY_CORRUPTED');
  if(!existsSync(join(root,value.id))){
   if(typeof value.stage!=='string'||!/^\.pending-[a-f0-9-]{36}$/.test(value.stage))throw Error('DR_SAVE_UNKNOWN');
   const data=read(root,value.stage+'/research.zip'),record=JSON.parse(read(root,value.stage+'/receipt.json'));
   if(record.id!==value.id||record.taskId!==taskId||record.sha256!==sha256(data)||record.bytes!==data.length)throw Error('DR_SAVE_UNKNOWN');
   renameSync(join(root,value.stage),join(root,value.id));flush(root);
  }
  return readCopy(value.id).receipt;
 };
 const reserve=(id,version)=>{const prior=command(id);if(prior){if(prior.version&&!same(prior.version,version))throw Error('DR_COMMAND_CONFLICT');return receipt(id);}writeCommand(id,{version});return null;};
 return {list,read:readCopy,receipt,reserve,
  save(commandId,version,output){
   if(!uuid(commandId)||!/^p-[a-z0-9-]+$/.test(version.projectId)||typeof version.runId!=='string'||!Number.isSafeInteger(version.version)||version.version<1||!hash(output.contentSha256))throw Error('DR_COPY_IDENTITY');
   const old=reserve(commandId,version);if(old){if(old.projectId!==version.projectId||old.runId!==version.runId||old.version!==version.version)throw Error('DR_COMMAND_CONFLICT');return old;}
   const id=sha256(JSON.stringify([taskId,version.projectId,version.runId,version.version,output.contentSha256]));
   if(!existsSync(join(root,id))){
    const stage=join(root,'.pending-'+randomUUID());mkdirSync(stage,{mode:0o700});
    const value={...version,id,taskId,sourceCommit:SOURCE_COMMIT,copiedAt:new Date().toISOString(),sha256:sha256(output.bytes),bytes:output.bytes.length,contentSha256:output.contentSha256,limitations:output.limitations,unresolved:output.unresolved};
    writeFileSync(join(stage,'research.zip'),output.bytes,{flag:'wx',mode:0o600});writeFileSync(join(stage,'receipt.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
    flush(join(stage,'research.zip'));flush(join(stage,'receipt.json'));flush(stage);writeCommand(commandId,{version,id,stage:stage.slice(root.length+1)});renameSync(stage,join(root,id));flush(root);
   }
   const result=readCopy(id).receipt;writeCommand(commandId,{version,id});return result;
  },
 };
}
