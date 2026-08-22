import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';

import { expectedArtifactRun } from '../xanthil-local-analysis/port-contracts.ts';

export const runId = '0198d943-8b71-7a11-9abc-0000000000c1';

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export type ObservedFile = Readonly<{ path: string; bytes: Uint8Array; byte_size: number; sha256: string }>;
export type RunEvidenceObservation = Readonly<{ run_directory_name: string; files: Readonly<Record<string, ObservedFile>> }>;

function observedFile(path: string, bytes: Uint8Array): ObservedFile {
  return Object.freeze({ path, bytes: Buffer.from(bytes), byte_size: bytes.byteLength, sha256: sha256(bytes) });
}

/** A test-only byte observation: Product Core never opens the filesystem itself. */
export async function observeRun(run: string): Promise<RunEvidenceObservation> {
  const manifest = JSON.parse(await readFile(join(run, 'run.json'), 'utf8')) as { status?: string; artifacts?: { path?: string }[] };
  const paths = ['run.json', 'analysis-contract.json'];
  if (manifest.status === 'succeeded') {
    paths.push('evidence.json');
    for (const artifact of manifest.artifacts ?? []) if (typeof artifact.path === 'string') paths.push(artifact.path);
  }
  const files: Record<string, ObservedFile> = {};
  for (const path of paths) files[path] = observedFile(path, await readFile(join(run, path)));
  return Object.freeze({ run_directory_name: basename(run), files: Object.freeze(files) });
}

export function replaceObservedJson(observation: RunEvidenceObservation, path: string, mutate: (value: Record<string, unknown>) => void): RunEvidenceObservation {
  const original = observation.files[path];
  if (!original) throw new Error(`missing observed file: ${path}`);
  const value = JSON.parse(Buffer.from(original.bytes).toString('utf8')) as Record<string, unknown>;
  mutate(value);
  const bytes = Buffer.from(JSON.stringify(value), 'utf8');
  return Object.freeze({ ...observation, files: Object.freeze({ ...observation.files, [path]: observedFile(path, bytes) }) });
}

export function replaceObservedBytes(observation: RunEvidenceObservation, path: string, bytes: Uint8Array): RunEvidenceObservation {
  if (!observation.files[path]) throw new Error(`missing observed file: ${path}`);
  return Object.freeze({ ...observation, files: Object.freeze({ ...observation.files, [path]: observedFile(path, bytes) }) });
}

export function duplicateJsonMember(bytes: Uint8Array, memberPrefix: string): Uint8Array {
  const text = Buffer.from(bytes).toString('utf8');
  const index = text.indexOf(memberPrefix);
  if (index < 0) throw new Error(`member prefix not found: ${memberPrefix}`);
  const colon = text.indexOf(':', index);
  if (colon < 0) throw new Error(`member value not found: ${memberPrefix}`);
  const valueEnd = jsonValueEnd(text, colon + 1);
  return Buffer.from(`${text.slice(0, valueEnd)},${text.slice(index, valueEnd)}${text.slice(valueEnd)}`, 'utf8');
}

function jsonValueEnd(text: string, start: number): number {
  let cursor = start;
  while (/\s/.test(text[cursor] ?? '')) cursor += 1;
  const opener = text[cursor];
  if (opener !== '{' && opener !== '[' && opener !== '"') {
    while (cursor < text.length && !',}]'.includes(text[cursor]!)) cursor += 1;
    return cursor;
  }

  let depth = 0;
  let quoted = false;
  for (; cursor < text.length; cursor += 1) {
    const character = text[cursor]!;
    if (quoted) {
      if (character === '\\') cursor += 1;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '{' || character === '[') depth += 1;
    else if (character === '}' || character === ']') {
      depth -= 1;
      if (depth === 0) return cursor + 1;
    }
  }
  throw new Error('unterminated JSON member value');
}

export function replaceObservedMetadata(observation: RunEvidenceObservation, path: string, metadata: Partial<Pick<ObservedFile, 'byte_size' | 'sha256'>>): RunEvidenceObservation {
  const original = observation.files[path];
  if (!original) throw new Error(`missing observed file: ${path}`);
  return Object.freeze({ ...observation, files: Object.freeze({ ...observation.files, [path]: Object.freeze({ ...original, ...metadata }) }) });
}

export function synchronizeManifestDescriptor(observation: RunEvidenceObservation, path: 'analysis-contract.json' | 'evidence.json' | string): RunEvidenceObservation {
  const target = observation.files[path];
  if (!target) throw new Error(`missing observed file: ${path}`);
  return replaceObservedJson(observation, 'run.json', (manifest) => {
    if (path === 'analysis-contract.json') (manifest.contract as Record<string, unknown>).sha256 = target.sha256;
    else if (path === 'evidence.json') (manifest.evidence as Record<string, unknown>).sha256 = target.sha256;
    else {
      const artifact = (manifest.artifacts as Record<string, unknown>[]).find((entry) => entry.path === path);
      if (!artifact) throw new Error(`missing manifest asset: ${path}`);
      artifact.byte_size = target.byte_size;
      artifact.sha256 = target.sha256;
    }
  });
}

export async function createExactRun(status: 'succeeded' | 'failed' | 'cancelled' | 'in_progress' = 'succeeded') {
  const root = await mkdtemp(join(tmpdir(), 'xanthil-run-evidence-'));
  const run = join(root, runId);
  const artifact = expectedArtifactRun(runId);
  const manifest = status === 'succeeded' ? artifact.succeededManifest
    : status === 'in_progress' ? artifact.initialManifest
      : status === 'failed' ? artifact.failedManifest : artifact.cancelledManifest;
  await mkdir(run, { recursive: true });
  await writeJson(join(run, 'run.json'), manifest);
  await writeJson(join(run, 'analysis-contract.json'), artifact.contract);
  if (status === 'succeeded') {
    await writeJson(join(run, 'evidence.json'), artifact.evidence);
    for (const asset of Object.values(artifact.persistedAssetById)) {
      const path = join(run, asset.path);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, asset.bytes);
    }
  }
  return { root, run, artifact };
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value));
}

export async function workspaceSnapshot(root: string): Promise<ReadonlyMap<string, string>> {
  const result = new Map<string, string>();
  const walk = async (path: string, relative = ''): Promise<void> => {
    const entries = await (await import('node:fs/promises')).readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = join(path, entry.name);
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(child, name);
      else {
        const metadata = await lstat(child);
        try {
          result.set(name, `${metadata.mode}:${sha256(await readFile(child))}`);
        } catch (error: unknown) {
          if ((error as NodeJS.ErrnoException).code !== 'EACCES') throw error;
          result.set(name, `${metadata.mode}:unreadable`);
        }
      }
    }
  };
  await walk(root);
  return result;
}

export async function makeDeclaredSourceUnreadable(run: string): Promise<string> {
  const path = join(run, 'member-orders-v1.csv');
  await lstat(path).then(() => { throw new Error('declared source fixture must not exist'); }, () => undefined);
  return path;
}

export async function writeHostileMarkdown(run: string): Promise<void> {
  const manifest = JSON.parse(await readFile(join(run, 'run.json'), 'utf8')) as { artifacts: Record<string, unknown>[] };
  const bytes = Buffer.from(hostileText, 'utf8');
  await writeFile(join(run, 'summary.md'), bytes);
  const descriptor = manifest.artifacts.find((artifact) => artifact.path === 'summary.md');
  if (!descriptor) throw new Error('summary descriptor missing');
  descriptor.byte_size = bytes.byteLength;
  descriptor.sha256 = sha256(bytes);
  await writeJson(join(run, 'run.json'), manifest);
}

export const hostileText = '<img src=x onerror=globalThis.__xanthil_pwned=1><script>globalThis.__xanthil_pwned=1</script>';
