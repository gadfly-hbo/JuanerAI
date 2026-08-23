import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';

import { defineRunEvidenceReader } from '../../packages/ports/run-evidence-reader.ts';
import { createLocalAnalysisDomain } from '../../packages/product-core/local-analysis.ts';

const checksum = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const unsafe = () => Object.assign(new Error('RUN_READ_FAILED'), { code: 'RUN_READ_FAILED' });
const checksumMismatch = () => Object.assign(new Error('RUN_CHECKSUM_MISMATCH'), { code: 'RUN_CHECKSUM_MISMATCH' });
const contained = (root: string, candidate: string) => {
  const value = relative(root, candidate);
  return value !== '' && !value.startsWith(`..${sep}`) && value !== '..' && !isAbsolute(value);
};
const validAssetPath = (value: unknown) => typeof value === 'string' && value.length > 0 && !isAbsolute(value) && !value.split('/').includes('..') && !value.split('\\').includes('..');

function manifestVersionFailure(value: unknown): 'RUN_CONTRACT_UNSUPPORTED' | undefined {
  if (value !== null && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value, 'schema_version') && typeof (value as Record<string, unknown>).schema_version === 'string' && (value as Record<string, unknown>).schema_version !== '1.0') return 'RUN_CONTRACT_UNSUPPORTED';
  return undefined;
}

function strictJson(bytes: Uint8Array): unknown {
  const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  let cursor = 0;
  const whitespace = () => { while (/\s/.test(source[cursor] ?? '')) cursor += 1; };
  const string = (): string => {
    const start = cursor;
    if (source[cursor] !== '"') throw unsafe();
    cursor += 1;
    while (cursor < source.length) {
      if (source[cursor] === '\\') { cursor += 2; continue; }
      if (source[cursor++] === '"') return JSON.parse(source.slice(start, cursor)) as string;
    }
    throw unsafe();
  };
  const value = (): void => {
    whitespace();
    if (source[cursor] === '{') {
      cursor += 1; const names = new Set<string>(); whitespace();
      if (source[cursor] === '}') { cursor += 1; return; }
      while (true) {
        whitespace(); const name = string(); if (names.has(name)) throw unsafe(); names.add(name);
        whitespace(); if (source[cursor++] !== ':') throw unsafe(); value(); whitespace();
        if (source[cursor] === '}') { cursor += 1; return; }
        if (source[cursor++] !== ',') throw unsafe();
      }
    }
    if (source[cursor] === '[') {
      cursor += 1; whitespace(); if (source[cursor] === ']') { cursor += 1; return; }
      while (true) { value(); whitespace(); if (source[cursor] === ']') { cursor += 1; return; } if (source[cursor++] !== ',') throw unsafe(); }
    }
    if (source[cursor] === '"') { string(); return; }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(cursor));
    if (!match) throw unsafe();
    cursor += match[0].length;
  };
  value(); whitespace(); if (cursor !== source.length) throw unsafe();
  return JSON.parse(source);
}

export function createLocalRunEvidenceReader() {
  return defineRunEvidenceReader({
    async readSelectedRun(input: Readonly<{ run_directory: string }>) {
      try {
        if (!input || typeof input.run_directory !== 'string' || !input.run_directory || !isAbsolute(input.run_directory) || input.run_directory.includes('\0')) throw unsafe();
        const configured = resolve(input.run_directory);
        const directoryStat = await lstat(configured);
        if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) throw unsafe();
        const root = await realpath(configured);
        const files: Record<string, { path: string; bytes: Uint8Array; byte_size: number; sha256: string }> = {};
        const regular = async (path: string, optional = false, expectedByteSize?: number) => {
          if (!validAssetPath(path)) throw unsafe();
          const candidate = resolve(root, path);
          if (!contained(root, candidate)) throw unsafe();
          let physical: string;
          try { physical = await realpath(candidate); } catch (error) {
            if (optional && (error as { code?: string }).code === 'ENOENT') return;
            throw error;
          }
          if (physical !== candidate || !contained(root, physical)) throw unsafe();
          const before = await lstat(candidate);
          if (before.isSymbolicLink() || !before.isFile()) throw unsafe();
          if (expectedByteSize !== undefined && before.size !== expectedByteSize) throw checksumMismatch();
          const bytes = await readFile(candidate);
          const after = await lstat(candidate);
          if (after.isSymbolicLink() || !after.isFile() || after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs || bytes.byteLength !== after.size || await realpath(candidate) !== candidate) throw unsafe();
          files[path] = Object.freeze({ path, bytes, byte_size: bytes.byteLength, sha256: checksum(bytes) });
          return bytes;
        };
        const manifestBytes = await regular('run.json');
        if (!manifestBytes) throw unsafe();
        let manifest: Record<string, unknown>;
        let decodedManifest: unknown;
        try { decodedManifest = strictJson(manifestBytes); }
        catch { throw unsafe(); }
        const versionFailure = manifestVersionFailure(decodedManifest);
        if (versionFailure) throw Object.assign(new Error(versionFailure), { code: versionFailure });
        try { manifest = createLocalAnalysisDomain().validateReadableTerminalRunManifest(decodedManifest) as Record<string, unknown>; }
        catch { throw unsafe(); }
        if (manifest.run_id !== basename(root)) throw unsafe();
        if (manifest.status === 'succeeded') {
          await regular('analysis-contract.json');
          await regular('evidence.json');
          for (const entry of manifest.artifacts as unknown[]) {
            if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw unsafe();
            await regular((entry as Record<string, unknown>).path as string, false, (entry as Record<string, unknown>).byte_size as number);
          }
        } else {
          await regular('analysis-contract.json', true);
          for (const entry of manifest.artifacts as unknown[]) {
            if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw unsafe();
            await regular((entry as Record<string, unknown>).path as string, false, (entry as Record<string, unknown>).byte_size as number);
          }
        }
        return Object.freeze({ run_directory_name: basename(root), files: Object.freeze(files) });
      } catch (error) {
        if ((error as { code?: string }).code === 'RUN_READ_FAILED' || (error as { code?: string }).code === 'RUN_CONTRACT_UNSUPPORTED' || (error as { code?: string }).code === 'RUN_CHECKSUM_MISMATCH') throw error;
        throw unsafe();
      }
    },
  });
}
