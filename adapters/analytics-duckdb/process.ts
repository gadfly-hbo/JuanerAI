import { spawn } from 'node:child_process';

type ProcessObservation={physical_status:'not_started'|'settled'|'unknown';active_ms:number};
const processFailures=new WeakMap<Error,ProcessObservation>();
export function describeAnalysisProcessFailure(value:unknown):ProcessObservation|null{return value instanceof Error&&processFailures.has(value)?{...processFailures.get(value)!}:null;}
export async function runObservedAnalysisProcess(command:string,args:readonly string[],signal:AbortSignal,seconds:number,input?:string){const observation:ProcessObservation={physical_status:'not_started',active_ms:0};try{const output=await execute(command,args,signal,seconds,input,observation);return {output,...observation};}catch(error){if(error instanceof Error)processFailures.set(error,{...observation});throw error;}}

/** Adapter-private native process boundary; no shell, retries or environment inheritance. */
export function runAnalysisProcess(command: string, args: readonly string[], signal: AbortSignal, seconds: number, input?: string): Promise<string> {
  return execute(command,args,signal,seconds,input);
}
function execute(command:string,args:readonly string[],signal:AbortSignal,seconds:number,input?:string,observation?:ProcessObservation):Promise<string>{
  const started=performance.now();
  const observe=(physical_status:ProcessObservation['physical_status'])=>{if(observation){observation.physical_status=physical_status;observation.active_ms=physical_status==='not_started'?0:Math.max(0,Math.floor(performance.now()-started));}};
  const error = (code: string) => Object.assign(new Error(code), { code, stack: code });
  if (signal.aborted) return Promise.reject(error('CANCELLED'));
  if (seconds <= 0) return Promise.reject(error('TIMEOUT'));
  return new Promise((resolve, reject) => {
    let output = '', failure: string | undefined;
    const child = spawn(command, args, { stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'ignore'], env: { PATH: process.env.PATH ?? '' } });
    observe(child.pid===undefined?'not_started':'unknown');
    let forceTimer: ReturnType<typeof setTimeout> | undefined;
    const abort = () => { failure ??= 'CANCELLED'; child.kill('SIGTERM'); forceTimer ??= setTimeout(() => child.kill('SIGKILL'), 100); };
    const timer = setTimeout(() => { failure ??= 'TIMEOUT'; child.kill('SIGKILL'); }, seconds * 1000);
    const clear = () => { clearTimeout(timer); if (forceTimer) clearTimeout(forceTimer); signal.removeEventListener('abort', abort); };
    signal.addEventListener('abort', abort, { once: true });
    child.stdout!.on('data', chunk => { output += String(chunk); });
    child.on('error', () => { observe(child.pid===undefined?'not_started':'unknown');clear(); reject(error('ANALYSIS_EXECUTION_FAILED')); });
    child.on('close', code => { observe(child.pid===undefined?'not_started':'settled');clear(); if (failure) reject(error(failure)); else if (code !== 0) reject(error('ANALYSIS_EXECUTION_FAILED')); else resolve(output); });
    if (input !== undefined) { child.stdin!.on('error', () => {}); child.stdin!.end(input); }
    if (signal.aborted) abort();
  });
}
