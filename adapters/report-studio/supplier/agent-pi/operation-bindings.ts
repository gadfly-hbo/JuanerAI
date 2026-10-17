import {constants} from 'node:fs';
import {open,lstat,readFile,writeFile,rename,realpath} from 'node:fs/promises';
import {basename,dirname,isAbsolute,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {RuntimeFault} from 'pi-agent-runtime';

type Bindings={version:1;operations:Record<string,{taskId:string;purpose?:string;business_operation_id?:string}>};
function fail():never{throw new RuntimeFault('STATE_FAILED');}
const token=(value:unknown,maximum=128):value is string=>typeof value==='string'&&value.length<=maximum&&/^[A-Za-z0-9_-]+$/.test(value);
const exact=(value:unknown,keys:string[])=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
function validate(value:unknown):Bindings {
 if(!exact(value,['version','operations']))fail();const result=value as Bindings;
 if(result.version!==1||!result.operations||typeof result.operations!=='object'||Array.isArray(result.operations))fail();
 for(const [id,row]of Object.entries(result.operations)){
  if(!token(id)||!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(key=>!['taskId','purpose','business_operation_id'].includes(key))||!token(row.taskId,256)||row.purpose!==undefined&&!token(row.purpose)||row.business_operation_id!==undefined&&!token(row.business_operation_id))fail();
 }
 return result;
}
async function parent(file:string){
 if(!isAbsolute(file)||basename(file)!=='agent-operations.json')fail();const directory=dirname(file),project=await realpath(dirname(directory)),stat=await lstat(directory);
 if(!stat.isDirectory()||stat.isSymbolicLink()||await realpath(directory)!==join(project,'work'))fail();
}
export async function readBuiltinOperationBindings(file:string):Promise<Bindings>{
 try{
  await parent(file);let handle;
  try{handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {version:1,operations:{}};throw error;}
  try{
   const stat=await handle.stat(),maximum=16*1024*1024;if(!stat.isFile()||stat.nlink!==1||stat.size>maximum)fail();
   const chunks:Buffer[]=[];let length=0;
   while(true){const buffer=Buffer.alloc(Math.min(65536,maximum-length+1)),part=await handle.read(buffer,0,buffer.length,null);if(!part.bytesRead)break;length+=part.bytesRead;if(length>maximum)fail();chunks.push(buffer.subarray(0,part.bytesRead));}
   const after=await handle.stat();if(length!==stat.size||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs||after.nlink!==1)fail();
   return validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))));
  }finally{await handle.close();}
 }catch{fail();}
}
export async function writeBuiltinOperationBindings(file:string,bindings:Bindings):Promise<void>{
 try{
  await parent(file);validate(bindings);
  try{const stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)fail();}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const bytes=Buffer.from(JSON.stringify(bindings,null,1)),temporary=file+'.'+randomUUID()+'.tmp';if(bytes.length>16*1024*1024)fail();
  await writeFile(temporary,bytes,{flag:'wx',mode:0o600});if(!(await readFile(temporary)).equals(bytes))fail();await rename(temporary,file);
 }catch{fail();}
}
