import { spawn } from 'node:child_process';

/** Adapter-private native process boundary; no shell, retries or environment inheritance. */
export function runAnalysisProcess(command: string, args: readonly string[], signal: AbortSignal, seconds: number, input?: string): Promise<string> {
  const error = (code: string) => Object.assign(new Error(code), { code, stack: code });
  if (signal.aborted) return Promise.reject(error('CANCELLED'));
  if (seconds <= 0) return Promise.reject(error('TIMEOUT'));
  return new Promise((resolve, reject) => {
    let output = '', failure: string | undefined;
    const child = spawn(command, args, { stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'ignore'], env: { PATH: process.env.PATH ?? '' } });
    let forceTimer: ReturnType<typeof setTimeout> | undefined;
    const abort = () => { failure ??= 'CANCELLED'; child.kill('SIGTERM'); forceTimer ??= setTimeout(() => child.kill('SIGKILL'), 100); };
    const timer = setTimeout(() => { failure ??= 'TIMEOUT'; child.kill('SIGKILL'); }, seconds * 1000);
    const clear = () => { clearTimeout(timer); if (forceTimer) clearTimeout(forceTimer); signal.removeEventListener('abort', abort); };
    signal.addEventListener('abort', abort, { once: true });
    child.stdout!.on('data', chunk => { output += String(chunk); });
    child.on('error', () => { clear(); reject(error('ANALYSIS_EXECUTION_FAILED')); });
    child.on('close', code => { clear(); if (failure) reject(error(failure)); else if (code !== 0) reject(error('ANALYSIS_EXECUTION_FAILED')); else resolve(output); });
    if (input !== undefined) { child.stdin!.on('error', () => {}); child.stdin!.end(input); }
    if (signal.aborted) abort();
  });
}
