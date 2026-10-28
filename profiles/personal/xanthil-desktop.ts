import { createHash, randomUUID } from 'node:crypto';
import { access, lstat, readFile, readdir, readlink, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';


function failure(code: string): never {
  const error = Object.assign(new Error(code), { code });
  error.stack = code;
  throw error;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!record(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) failure('VALIDATION_FAILED');
  return value;
}

/** Deployment inventory is package-local identity, not business data or user configuration. */
async function bundledExecutables(descriptor: Record<string, unknown>, descriptorPath: string) {
  const root = await realpath(dirname(descriptorPath));
  function contained(path: string) {
    const rel = relative(root, path);
    if (rel === '' || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) failure('TOOLCHAIN_UNAVAILABLE');
  }
  function resource(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('toolchain/') || value.includes('\\') || value.split('/').some(x => !x || x === '.' || x === '..')) failure('TOOLCHAIN_UNAVAILABLE');
    const path = resolve(root, value); contained(path); return path;
  }
  if (!Array.isArray(descriptor.inventory) || descriptor.inventory.length === 0) failure('TOOLCHAIN_UNAVAILABLE');
  const expected = new Map<string, Record<string, unknown>>();
  for (const raw of descriptor.inventory) {
    if (!record(raw)) failure('TOOLCHAIN_UNAVAILABLE');
    resource(raw.path);
    if (typeof raw.path !== 'string' || expected.has(raw.path)) failure('TOOLCHAIN_UNAVAILABLE');
    expected.set(raw.path, raw);
  }
  const seen = new Set<string>();
  async function inspect(path: string): Promise<void> {
    contained(await realpath(path));
    const stat = await lstat(path), key = relative(root, path).split(sep).join('/');
    if (stat.isDirectory()) {
      for (const name of await readdir(path)) await inspect(join(path, name));
      return;
    }
    const entry = expected.get(key); if (!entry) failure('TOOLCHAIN_UNAVAILABLE');
    seen.add(key);
    if (stat.isSymbolicLink()) {
      exactRecord(entry, ['path','kind','target']);
      if (entry.kind !== 'symlink' || typeof entry.target !== 'string' || isAbsolute(entry.target) || await readlink(path) !== entry.target) failure('TOOLCHAIN_UNAVAILABLE');
    } else {
      exactRecord(entry, ['path','kind','bytes','sha256','mode']);
      if (!stat.isFile() || entry.kind !== 'file' || entry.bytes !== stat.size || entry.mode !== (stat.mode & 0o777) || createHash('sha256').update(await readFile(path)).digest('hex') !== entry.sha256) failure('TOOLCHAIN_UNAVAILABLE');
    }
  }
  await inspect(join(root, 'toolchain'));
  if (seen.size !== expected.size) failure('TOOLCHAIN_UNAVAILABLE');
  const duckdb = exactRecord(descriptor.duckdb, ['executable_path','version']), python = exactRecord(descriptor.python, ['executable_path','version']);
  for (const tool of [duckdb, python]) {
    const path = resource(tool.executable_path);
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) failure('TOOLCHAIN_UNAVAILABLE');
  }
  return { duckdb: { ...duckdb, executable_path: resource(duckdb.executable_path) }, python: { ...python, executable_path: resource(python.executable_path) } };
}

export async function readPersonalDesktopToolchain(descriptorPath:string){
    try{
      const stat=await lstat(descriptorPath);if(!stat.isFile()||stat.isSymbolicLink())failure('TOOLCHAIN_UNAVAILABLE');
      const raw=JSON.parse(await readFile(descriptorPath,'utf8'));
      if(!record(raw))failure('TOOLCHAIN_UNAVAILABLE');
      const bundled=raw.schema_version==='2.0';
      const descriptor=exactRecord(raw,bundled?['schema_version','duckdb','python','inventory']:['schema_version','duckdb','python']);
      if(!bundled&&descriptor.schema_version!=='1.0')failure('TOOLCHAIN_UNAVAILABLE');
      const tools=bundled?await bundledExecutables(descriptor,descriptorPath):descriptor;
      const duckdb=exactRecord(tools.duckdb,['executable_path','version']),python=exactRecord(tools.python,['executable_path','version']);
      if(typeof duckdb.executable_path!=='string'||!isAbsolute(duckdb.executable_path)||typeof python.executable_path!=='string'||!isAbsolute(python.executable_path)||duckdb.version!=='1.5.2'||typeof python.version!=='string'||!/^3\.(?:9|[1-9][0-9]+)\.[0-9]+$/.test(python.version))failure('TOOLCHAIN_UNAVAILABLE');
      for(const path of [duckdb.executable_path,python.executable_path])await access(path,constants.X_OK);
      const execute=promisify(execFile),options={timeout:30000,maxBuffer:4096,env:{PATH:''},encoding:'utf8' as const};
      const duck=await execute(duckdb.executable_path,['--version'],options),py=await execute(python.executable_path,['--version'],options);
      if(/^v?(\d+\.\d+\.\d+)(?:\s|$)/.exec(duck.stdout.trim())?.[1]!==duckdb.version||/^Python (\d+\.\d+\.\d+)(?:\s|$)/.exec(py.stdout.trim())?.[1]!==python.version)failure('TOOLCHAIN_UNAVAILABLE');
      return {duckdbExecutable:duckdb.executable_path,duckdbVersion:duckdb.version,pythonExecutable:python.executable_path,pythonVersion:python.version};
    }catch{failure('TOOLCHAIN_UNAVAILABLE');}
  }

/** The deployment capability is Main-owned, never an IPC/Renderer path. */
