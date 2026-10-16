// Fixed-byte local diagnostic only. No network inspector, scope inspection or SDK edits.
import {Session} from 'node:inspector';
import {readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export const SDK_SHA256='193a457e960d0596ff40df70d2b4de7b8ade980580db1e72c255ebaff0dd3248';
const branches=[[206,'duplicate_call_id'],[209,'undeclared_tool_name'],[214,'arguments_schema']];
let active=false;
export async function watchToolAdmission({sdkRoot}) {
  if(active)throw Error('RS_DIAG_PROBE_BUSY');
  const file=await realpath(join(sdkRoot,'dist/pi-adapter.js')),bytes=await readFile(file);
  if(createHash('sha256').update(bytes).digest('hex')!==SDK_SHA256)throw Error('RS_DIAG_SDK_MISMATCH');
  active=true;
  const session=new Session(),events=[],points=new Map();let closed=false;
  const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(error,result)=>error?reject(error):resolve(result)));
  async function close(){if(closed)return;closed=true;try{await post('Debugger.disable');}finally{session.disconnect();active=false;}}
  try{
    session.connect();
    // Read only our breakpoint IDs. Never request scopes, values, source text or frames.
    session.on('Debugger.paused',({params})=>{
      for(const id of params.hitBreakpoints??[]){const point=points.get(id);if(point)events.push({schema_version:'1',branch:point.branch,line:point.line,sdk_sha256:SDK_SHA256});}
      session.post('Debugger.resume');
    });
    await post('Debugger.enable');
    for(const [line,branch]of branches){
      const {breakpointId,locations}=await post('Debugger.setBreakpointByUrl',{url:pathToFileURL(file).href,lineNumber:line-1});
      if(locations.some(location=>location.lineNumber!==line-1))throw Error('RS_DIAG_BREAKPOINT_MISMATCH');
      points.set(breakpointId,{line,branch});
    }
    return {events,close};
  }catch(error){await close();throw error;}
}
