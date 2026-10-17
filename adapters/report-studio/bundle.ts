import {constants} from 'node:fs';
import {lstat, open, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute, join} from 'node:path';
import type {ReportStudioBundleCheck, ReportStudioBundleIdentity, ReportStudioBundleManifest} from '../../packages/contracts/report-studio.ts';

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const sha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === [...fields].sort().join(',');
}
function safePath(value: unknown): value is string {
  return nonempty(value) && value.normalize('NFC') === value && !isAbsolute(value)
    && !/[\\\u0000-\u001f\u007f]/.test(value) && value.toLowerCase() !== 'manifest.json'
    && value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');
}
function manifest(value: unknown): value is ReportStudioBundleManifest {
  if (!exact(value, ['schema_version', 'module', 'version', 'source_commit', 'protocol_version', 'files'])
    || value.schema_version !== '1' || value.module !== 'reports-factory' || value.protocol_version !== '1'
    || !nonempty(value.version) || typeof value.source_commit !== 'string' || !/^[a-f0-9]{40}$/.test(value.source_commit)
    || !Array.isArray(value.files)) return false;
  const paths = new Set<string>(), roles = new Map<string, number>();
  const allowed = new Set(['server', 'web', 'skills', 'node', 'browser', 'dependencies', 'licenses', 'resource']);
  for (const file of value.files) {
    if (!exact(file, ['path', 'bytes', 'sha256', 'role']) || !safePath(file.path)
      || !Number.isSafeInteger(file.bytes) || Number(file.bytes) < 0 || !sha(file.sha256)
      || typeof file.role !== 'string' || !allowed.has(file.role)) return false;
    const key = file.path.toLowerCase();
    if (paths.has(key)) return false;
    paths.add(key); roles.set(file.role, (roles.get(file.role) ?? 0) + 1);
  }
  if(value.version==='0.1.0-juanerai.1'&&!value.files.some(file=>file.path==='bin/report-studio-keychain'&&file.role==='resource'&&file.bytes>0))return false;
  return ['server', 'web', 'skills', 'node', 'browser', 'dependencies', 'licenses'].every(role => roles.has(role))
    && roles.get('server') === 1 && roles.get('node') === 1;
}

/** Only a trusted, immutable installation tree is eligible. This is not authentication or a sandbox. */
export async function verifyReportStudioBundle(root: string, expected: ReportStudioBundleIdentity): Promise<ReportStudioBundleCheck> {
  const unavailable = (reason: 'missing' | 'invalid' | 'incompatible' | 'corrupt'): ReportStudioBundleCheck => ({state: 'unavailable', reason});
  if (!expected || !nonempty(expected.version) || !/^[a-f0-9]{40}$/.test(expected.source_commit)
    || expected.protocol_version !== '1' || !sha(expected.manifest_sha256)) return unavailable('incompatible');
  try {
    const stat = await lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return unavailable('invalid');
  } catch (error) { return unavailable((error as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'corrupt'); }

  let bytes: Buffer;
  try {
    const file = await open(join(root, 'manifest.json'), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const before = await file.stat();
      // Private parsing limit, not a product-material limit or a generated default.
      if (!before.isFile() || before.size > 16 * 1024 * 1024) return unavailable('invalid');
      bytes = await file.readFile();
      const after = await file.stat();
      if (bytes.length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) return unavailable('corrupt');
    } finally { await file.close(); }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return unavailable(code === 'ENOENT' ? 'missing' : code === 'ELOOP' ? 'invalid' : 'corrupt');
  }
  if (digest(bytes) !== expected.manifest_sha256) return unavailable('incompatible');
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); } catch { return unavailable('invalid'); }
  if (!manifest(value)) return unavailable('invalid');
  if (value.version !== expected.version || value.source_commit !== expected.source_commit || value.protocol_version !== expected.protocol_version) return unavailable('incompatible');

  const inventory = new Set(value.files.map(file => file.path));
  async function checkDirectory(relative: string): Promise<boolean> {
    for (const entry of await readdir(join(root, relative), {withFileTypes: true})) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      const stat = await lstat(join(root, path));
      if (stat.isSymbolicLink()) return false;
      if (stat.isDirectory()) { if (!await checkDirectory(path)) return false; }
      else if (!stat.isFile() || path !== 'manifest.json' && !inventory.delete(path)) return false;
    }
    return true;
  }
  try {
    if (!await checkDirectory('') || inventory.size) return unavailable('corrupt');
    for (const resource of value.files) {
      const file = await open(join(root, resource.path), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      try {
        const before = await file.stat();
        if (!before.isFile() || before.size !== resource.bytes) return unavailable('corrupt');
        const hash = createHash('sha256'), buffer = Buffer.alloc(64 * 1024);
        let total = 0;
        while (true) {
          const {bytesRead} = await file.read(buffer, 0, buffer.length, null);
          if (!bytesRead) break;
          total += bytesRead;
          if (total > resource.bytes) return unavailable('corrupt');
          hash.update(buffer.subarray(0, bytesRead));
        }
        const after = await file.stat();
        if (total !== resource.bytes || hash.digest('hex') !== resource.sha256 || before.size !== after.size
          || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) return unavailable('corrupt');
      } finally { await file.close(); }
    }
  } catch { return unavailable('corrupt'); }
  return {state: 'ready', manifest: value};
}
