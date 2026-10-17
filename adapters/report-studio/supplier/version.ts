import {constants} from 'node:fs';
import {lstat,open,readdir,realpath} from 'node:fs/promises';
import {join,resolve} from 'node:path';
function incompatible():never{throw Object.assign(new Error('RS_DATA_VERSION_INCOMPATIBLE'),{code:'RS_DATA_VERSION_INCOMPATIBLE',statusCode:409});}
/** Called only while holding this data root's exclusive owner lease.
 * First release has no predecessor migration or declared downgrade compatibility.
 * Refuse unknown existing state; never stamp a new version over used data.
 */
export async function assertStudioDataVersion(dataRoot:string,pluginVersion:string):Promise<void>{
 if(!/^[A-Za-z0-9][A-Za-z0-9.+_-]{0,127}$/.test(pluginVersion)||await realpath(dataRoot)!==resolve(dataRoot))incompatible();
 const stat=await lstat(dataRoot);if(!stat.isDirectory()||stat.isSymbolicLink())incompatible();
 const file=join(dataRoot,'.juanerai-version.json'),expected={schema_version:'1',data_schema:'1',protocol_version:'1',plugin_version:pluginVersion,source_commit:'74ebb609fd73cf263614ffc9301dafaafcec4230'};
 async function read():Promise<Buffer|null>{
  let handle;
  try{handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);}
  catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;incompatible();}
  try{
   const before=await handle.stat();if(!before.isFile()||before.nlink!==1||before.size>4096)incompatible();
   const bytes=Buffer.alloc(4097);let length=0;
   while(length<bytes.length){const result=await handle.read(bytes,length,bytes.length-length,null);if(!result.bytesRead)break;length+=result.bytesRead;}
   const after=await handle.stat();if(length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)incompatible();return bytes.subarray(0,length);
  }finally{await handle.close();}
 }
 try{
  let bytes=await read();
  if(bytes===null){
   for(const name of await readdir(dataRoot)){
    if(name==='.juanerai-owner.sqlite')continue;
    // The fixed parent launcher creates empty HOME/TMPDIR before spawning us.
    // Nothing else, including used caches or reports, may be silently adopted.
    if(name!=='.home'&&name!=='.tmp')incompatible();
    const directory=join(dataRoot,name),entry=await lstat(directory);
    if(!entry.isDirectory()||entry.isSymbolicLink()||(await readdir(directory)).length)incompatible();
   }
   const written=Buffer.from(JSON.stringify(expected)),handle=await open(file,'wx',0o600);
   try{await handle.writeFile(written);await handle.sync();}finally{await handle.close();}
   bytes=await read();if(!bytes?.equals(written))incompatible();
  }
  const value=JSON.parse(bytes.toString('utf8'));
  if(value===null||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==Object.keys(expected).sort().join(',')||Object.entries(expected).some(([key,wanted])=>value[key]!==wanted))incompatible();
 }catch{incompatible();}
}
