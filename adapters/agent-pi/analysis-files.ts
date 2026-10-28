import { createHash } from 'node:crypto';
import { relative,resolve,dirname } from 'node:path';
import { createExecutionTools,createLocalExecutionEnvironment,RuntimeFault,type ExecutionFile } from 'pi-agent-runtime';
import type { AnalysisExecutionFact } from '../../packages/ports/analysis-agent.ts';

type FileConfig={compute?:boolean;commandSoftTimeoutMs?:number;runtimeDirectories?:readonly string[];cwd:string;reportPath:string;signal:AbortSignal;authorize:()=>boolean;materials?:readonly Readonly<{path:string;content:string}>[];authorizeResources?:(signal:AbortSignal,path?:string)=>Promise<void>;skillFiles?:readonly ExecutionFile[];onRead?:(path:string,bytes:Uint8Array)=>void;verificationInputs?:readonly Readonly<{path:string;content:string;sha256:string}>[];onExecution?:(fact:Omit<AnalysisExecutionFact,'invocation_id'>)=>void};

/** Business grants and execution provenance only. The SDK owns files, directory
 * identity, links, native preconditions and the matching process sandbox. */
export async function createAnalysisFiles(config:FileConfig){
 const cwd=resolve(config.cwd),compute=config.compute===true||config.verificationInputs!==undefined;
 function check(signal?:AbortSignal){if(config.signal.aborted||signal?.aborted)throw new RuntimeFault('CANCELLED');if(!config.authorize())throw new RuntimeFault('AUTHORITY_REQUIRED');}
 async function resourceDecision(signal:AbortSignal,path?:string){
  check(signal);
  try{await config.authorizeResources?.(signal,path);}catch(error){if(['AUTHORITY_REQUIRED','SOURCE_CHANGED','ASSET_APPROVAL_REVOKED','ASSET_DISCLOSURE_REQUIRED'].includes(String(Reflect.get(error as object,'code'))))throw new RuntimeFault('AUTHORITY_REQUIRED');throw error;}
  check(signal);return true;
 }
 check();await resourceDecision(config.signal);
 const verification=config.verificationInputs??[];
 // This is the independent-input business contract, not an OS path guard.
 if(verification.some(input=>!/^input\/source-[0-9]+\.csv$/.test(relative(cwd,input.path)))||new Set(verification.map(input=>input.path)).size!==verification.length)throw new RuntimeFault('AUTHORITY_REQUIRED');
 const materialFiles=(config.materials??[]).map(file=>({path:file.path,content:Buffer.from(file.content,'utf8'),refresh:file.path.endsWith('/catalog.txt')}));
 const inputs=config.verificationInputs?verification.map(({path,sha256})=>({path,sha256})):(config.materials??[]).map(file=>({path:file.path,sha256:createHash('sha256').update(file.content,'utf8').digest('hex')}));
 const fileScope={deniedPaths:[resolve(cwd,'010_draw')],excludedPaths:[resolve(cwd,'020_clean/source'),resolve(cwd,'020_clean/metric-asset'),resolve(cwd,'020_clean/independent')],
  missingReadDirectories:[...new Set((config.materials??[]).filter(file=>{const path=relative(cwd,file.path);return path.startsWith('020_clean/source/')&&path.split('/').length>3;}).map(file=>dirname(file.path)))],
  files:[...materialFiles,...verification.map(input=>({path:input.path,sha256:input.sha256,content:Buffer.from(input.content,'utf8')})),...(config.skillFiles??[])]};
 const accessDescription='\n不可读写区域：\n'+fileScope.deniedPaths.join('\n')+'\n受保护区域（不属于通用读写空间）：\n'+fileScope.excludedPaths.join('\n')+'\n受保护目录仅可读取当前资料视图明确列出的获准文件，不可创建、覆盖或改写；已提供的来源、资产、独立输入和Skill文件保持只读。上述范围按列明的完整绝对路径生效。当前角色具备写入工具时，程序、交叉检查和过程笔记可放在本工作区内其他合法位置，不写入上述受保护区域；作者在作者上下文自写另一份程序不产生独立核验资格。隔离子Agent使用本上下文列出的自身工作区，不写入父级、其他角色或其他Task。';
 const environment=await createLocalExecutionEnvironment({root:cwd,policyVersion:'juanerai-sdk-file-scope-v1',exclusiveWorkspace:true,signal:config.signal,
  maxFileBytes:Math.max(1_048_576,...materialFiles.map(file=>file.content.byteLength)),maxOutputBytes:1_048_576,timeoutMs:300000,processes:compute,
  ...(config.commandSoftTimeoutMs?{commandSoftTimeoutMs:config.commandSoftTimeoutMs}:{}),...(config.runtimeDirectories?{runtimeDirectories:config.runtimeDirectories}:{}),
  authorize:async(signal)=>{check(signal);return true;},
  fileScope,
 });
 async function resolveBusinessPath(path:string,signal:AbortSignal=config.signal){await resourceDecision(signal);const canonical=await environment.resolvePath(path);check(signal);return canonical;}
 async function withResources<T>(path:string,signal:AbortSignal,operation:()=>Promise<T>):Promise<T>{const canonical=await resolveBusinessPath(path,signal);await resourceDecision(signal,canonical);const value=await operation();await resourceDecision(signal,canonical);return value;}
 const tools=createExecutionTools({...environment,resolvePath:resolveBusinessPath,
  read:async(path,signal)=>{const bytes=await withResources(path,signal,()=>environment.read(path,signal));config.onRead?.(path,bytes);return bytes;},
  write:(path,bytes,signal)=>withResources(path,signal,()=>environment.write(path,bytes,signal)),
  stat:(path,signal)=>withResources(path,signal,()=>environment.stat(path,signal)),
  exec:async(command,signal)=>{
   check(signal);await resourceDecision(signal);
   const artifacts=(await environment.snapshot(signal)).map(({path,sha256,bytes})=>{let content:string|null;try{content=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{content=null;}return {path,sha256,content};});
   const result=await environment.exec(command,signal);check(signal);await resourceDecision(signal);
   const before=new Map(artifacts.map(file=>[file.path,file.sha256]));
   const outputs=(await environment.snapshot(signal)).filter(file=>before.get(file.path)!==file.sha256).map(({path,sha256,bytes})=>{let content:string|null;try{content=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{content=null;}return {path,sha256,content};});
   check(signal);await resourceDecision(signal);
   config.onExecution?.({command,output:result.output,exit_code:result.exitCode,inputs,artifacts,outputs});return result;
  },
 },compute?['read','write','edit','bash']:['read','write','edit']);
 return Object.freeze({tools:Object.freeze(tools),accessDescription,report:async()=>{
  const value=await withResources(config.reportPath,config.signal,()=>environment.read(config.reportPath,config.signal));check();let text:string;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(value);}catch{throw new RuntimeFault('INVALID_REQUEST');}
  if(!text.trim())throw new RuntimeFault('INVALID_REQUEST');return {text,sha256:createHash('sha256').update(value).digest('hex')};
 }});
}
