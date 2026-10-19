import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createExecutionTools,RuntimeFault} from 'pi-agent-runtime';

/** One authorized run-local virtual file. Pi owns write/edit/read algorithms;
 * this host owns only path, authorization, encoding and complete-program size.
 * Nothing here executes Python or writes a business artifact. */
export function createAnalysisCodeDraft(config:{cwd:string;signal:AbortSignal|(()=>AbortSignal);authorize:()=>boolean;authorizeWrite?:()=>boolean;storage?:{read:()=>Uint8Array|undefined;write:(bytes:Uint8Array)=>void};resolveReadPath?:(path:string)=>void;readMaterial?:(path:string,signal:AbortSignal)=>Promise<Uint8Array>}) {
  const path=resolve(config.cwd,'draft/analysis.py');
  let bytes:Buffer|undefined;
  function check(signal?:AbortSignal){
    if((typeof config.signal==='function'?config.signal():config.signal).aborted||signal?.aborted)throw new RuntimeFault('CANCELLED');
    if(!config.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');
  }
  function read(target:string,signal?:AbortSignal){
    check(signal);
    if(target!==path)throw new RuntimeFault('AUTHORITY_REQUIRED');
    const value=config.storage?config.storage.read():bytes;
    if(!value)throw Object.assign(new Error('Draft unavailable'),{code:'ENOENT'});
    return Buffer.from(value);
  }
  const tools=createExecutionTools({cwd:config.cwd,policyVersion:'juanerai-run-code-draft-v1',
    resolvePath:async location=>{
      check();const target=resolve(config.cwd,location);
      if(target!==path){if(!config.resolveReadPath)throw new RuntimeFault('AUTHORITY_REQUIRED');config.resolveReadPath(target);}
      return target;
    },
    read:async(target,signal)=>{check(signal);return target===path?read(target,signal):config.readMaterial?config.readMaterial(target,signal):read(target,signal);},
    stat:async(target,signal)=>{check(signal);const value=target===path?read(target,signal):config.readMaterial?await config.readMaterial(target,signal):read(target,signal);return {path:target,name:target.split('/').at(-1)!,kind:'file',size:value.byteLength,modifiedAt:0};},
    write:async(target,value,signal)=>{
      check(signal);
      if(config.authorizeWrite&&!config.authorizeWrite())throw new RuntimeFault('AUTHORITY_REQUIRED');
      if(target!==path)throw new RuntimeFault('AUTHORITY_REQUIRED');
      if(value.byteLength>65536)throw new RuntimeFault('BUDGET_EXHAUSTED');
      try{new TextDecoder('utf-8',{fatal:true}).decode(value);}catch{throw new RuntimeFault('INVALID_REQUEST');}
      // Native preparation can await host IO; recheck at the actual mutation.
      check(signal);if(config.authorizeWrite&&!config.authorizeWrite())throw new RuntimeFault('AUTHORITY_REQUIRED');if(config.storage)config.storage.write(value);else bytes=Buffer.from(value);
    },
    exec:async()=>{throw new RuntimeFault('CAPABILITY_UNAVAILABLE');},
  },['read','write','edit']);
  return Object.freeze({tools:Object.freeze(tools),clear(){bytes=undefined;},readProgram(){
    const value=read(path);if(!value.length)throw new RuntimeFault('INVALID_REQUEST');
    const code=value.toString('utf8');if(!code.trim())throw new RuntimeFault('INVALID_REQUEST');
    return Object.freeze({code,code_sha256:createHash('sha256').update(value).digest('hex')});
  }});
}
