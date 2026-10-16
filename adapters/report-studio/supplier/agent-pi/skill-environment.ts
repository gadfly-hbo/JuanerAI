import {constants} from 'node:fs';
import {open,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute,join,resolve} from 'node:path';
import type {ExecutionEnvironment} from 'pi-agent-runtime';

const SIZE=9688;
const SHA256='b62a10aeaa8cc58090f63d27c2b5ae04538d95c966eb958c2ce273989cf9ef39';
/** The trusted composition root supplies one immutable bundled skill, not a model path.
 * Mutable file tools retain the original project environment and its closures.
 */
export function withBuiltinSkillRead(project:ExecutionEnvironment,skillsDir:string):ExecutionEnvironment {
 if(!isAbsolute(skillsDir))throw Error('RS_SKILL_UNAVAILABLE');
 const directory=resolve(skillsDir),path=join(directory,'SKILL.md');
 const cancelled=(signal:AbortSignal)=>{if(signal.aborted)throw Error('RS_SKILL_CANCELLED');};
 async function resource(signal:AbortSignal){
  cancelled(signal);
  try{
   if(await realpath(directory)!==directory)throw Error();
   const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{
    const before=await file.stat();
    if(!before.isFile()||before.nlink!==1||before.size!==SIZE)throw Error();
    const bytes=Buffer.alloc(SIZE+1);let length=0;
    while(length<bytes.length){cancelled(signal);const {bytesRead}=await file.read(bytes,length,bytes.length-length,length);if(!bytesRead)break;length+=bytesRead;}
    const after=await file.stat();
    if(length!==SIZE||before.dev!==after.dev||before.ino!==after.ino||after.nlink!==1||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||await realpath(path)!==path||createHash('sha256').update(bytes.subarray(0,length)).digest('hex')!==SHA256)throw Error();
    cancelled(signal);return {bytes:bytes.subarray(0,length),modifiedAt:after.mtimeMs};
   }finally{await file.close();}
  }catch{cancelled(signal);throw Error('RS_SKILL_UNAVAILABLE');}
 }
 return {
  ...project,
  resolvePath:async input=>input===path?path:project.resolvePath(input),
  read:async(input,signal)=>input===path?(await resource(signal)).bytes:project.read(input,signal),
  stat:async(input,signal)=>input===path?{path,name:'SKILL.md',kind:'file',size:SIZE,modifiedAt:(await resource(signal)).modifiedAt}:project.stat(input,signal),
 };
}
