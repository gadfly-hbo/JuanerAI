import { once } from 'node:events';
import { spawn } from 'node:child_process';

export async function startConsole(run: string) {
  const child = spawn(process.execPath, ['apps/console/xanthil-console.ts', '--run', run], {
    cwd: new URL('../../../', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => { stderr += chunk; });
  const url = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`console did not listen: ${stderr}`)), 2_000);
    child.stdout.on('data', () => {
      const found = stdout.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
      if (found) { clearTimeout(timeout); resolve(found); }
    });
    child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`console exited ${code}: ${stderr}`)); });
  });
  return { child, url };
}

export async function stopConsole(child: ReturnType<typeof spawn>): Promise<void> {
  child.kill('SIGINT');
  await once(child, 'exit');
}
