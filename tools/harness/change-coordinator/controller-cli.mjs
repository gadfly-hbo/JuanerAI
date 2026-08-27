#!/usr/bin/env node
import { createPrivateKey, sign } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTROLLER_SIGNER_ROOT = '/Users/huangbo/Library/Application Support/JuanerAI/controller';
export const CONTROLLER_SIGNER_CONFIG_PATH = `${CONTROLLER_SIGNER_ROOT}/signer.json`;
const MAX_COMMAND_BYTES = 1024 * 1024;

const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const closed = (value, keys) => value !== null && typeof value === 'object'
  && !Array.isArray(value) && Object.keys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key));
const mode = stat => stat.mode & 0o777;

function parseCanonical(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || bytes.length > MAX_COMMAND_BYTES) throw new Error('INPUT_INVALID');
  const raw = Buffer.from(bytes).toString('utf8');
  const value = JSON.parse(raw);
  if (canonical(value) !== raw) throw new Error('INPUT_INVALID');
  return value;
}

export function signCanonicalControllerCommand({ command_body_bytes, private_key_bytes, key_id }) {
  const body = parseCanonical(command_body_bytes);
  if (typeof key_id !== 'string' || key_id.length === 0 || body.key_id !== key_id) throw new Error('INPUT_INVALID');
  const privateKey = createPrivateKey(private_key_bytes);
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('PRIVATE_KEY_INVALID');
  const signatureBytes = sign(null, Buffer.from(command_body_bytes), privateKey);
  return Object.freeze({
    command_body_base64: Buffer.from(command_body_bytes).toString('base64'),
    signature_base64: signatureBytes.toString('base64'),
  });
}

export function createControllerSigner(osBoundary = {
  readFile,
  lstat,
  realpath,
  uid: () => process.getuid(),
}) {
  if (!closed(osBoundary, ['readFile', 'lstat', 'realpath', 'uid'])
    || ['readFile', 'lstat', 'realpath', 'uid'].some(name => typeof osBoundary[name] !== 'function')) throw new Error('INPUT_INVALID');
  return Object.freeze({
    async signCommand(command_body_bytes) {
      const configStat = await osBoundary.lstat(CONTROLLER_SIGNER_CONFIG_PATH);
      if (!configStat.isFile() || mode(configStat) !== 0o600 || configStat.uid !== osBoundary.uid()) throw new Error('SIGNER_CONFIG_AUTHORITY_INVALID');
      const configBytes = await osBoundary.readFile(CONTROLLER_SIGNER_CONFIG_PATH);
      const config = parseCanonical(configBytes);
      if (!closed(config, ['schema_version', 'key_id', 'private_key_path'])
        || config.schema_version !== '1.0' || typeof config.key_id !== 'string'
        || !path.isAbsolute(config.private_key_path)
        || path.dirname(config.private_key_path) !== CONTROLLER_SIGNER_ROOT) throw new Error('SIGNER_CONFIG_INVALID');
      const resolvedRoot = await osBoundary.realpath(CONTROLLER_SIGNER_ROOT);
      const resolvedKey = await osBoundary.realpath(config.private_key_path);
      if (path.dirname(resolvedKey) !== resolvedRoot) throw new Error('PRIVATE_KEY_PATH_INVALID');
      const keyStat = await osBoundary.lstat(resolvedKey);
      if (!keyStat.isFile() || keyStat.isSymbolicLink?.() || mode(keyStat) !== 0o600 || keyStat.uid !== osBoundary.uid()) throw new Error('PRIVATE_KEY_AUTHORITY_INVALID');
      return signCanonicalControllerCommand({
        command_body_bytes,
        private_key_bytes: await osBoundary.readFile(resolvedKey),
        key_id: config.key_id,
      });
    },
  });
}

async function readStdin() {
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > MAX_COMMAND_BYTES) throw new Error('INPUT_INVALID');
    chunks.push(Buffer.from(chunk));
  }
  const bytes = Buffer.concat(chunks);
  return bytes.at(-1) === 0x0a ? bytes.subarray(0, -1) : bytes;
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== 'sign' || Object.keys(process.env).some(key => /^JUANERAI_/.test(key))) throw new Error('INPUT_INVALID');
  const signed = await createControllerSigner().signCommand(await readStdin());
  process.stdout.write(`${canonical(signed)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${canonical({ schema_version: '1.0', outcome: 'REJECTED', error_code: String(error?.message ?? 'SIGNER_FAILED').replace(/[^A-Z0-9_]/g, '_') })}\n`);
    process.exitCode = 2;
  }
}
