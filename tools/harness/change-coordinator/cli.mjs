#!/usr/bin/env node
import net from 'node:net';

const SOCKET_PATH = '/private/var/run/juanerai/change-coordinator.sock';
const MAX_FRAME_BYTES = 1024 * 1024;
const FORBIDDEN_ENV = /^JUANERAI_/;

const canonical = value => Array.isArray(value)
  ? `[${value.map(canonical).join(',')}]`
  : value && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
const closed = (value, keys) => value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key));
const rejected = operation => ({
  schema_version: '1.0',
  operation,
  outcome: 'REJECTED',
  error_code: 'INPUT_INVALID',
  change_id: null,
});
const processFailure = operation => ({
  schema_version: '1.0',
  operation,
  outcome: 'PROCESS_FAILURE',
  error_code: 'INGRESS_UNAVAILABLE',
  change_id: null,
});
const emit = (message, code) => {
  process.stdout.write(`${canonical(message)}\n`);
  process.exitCode = code;
};

async function readFrame() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let timer = setTimeout(() => finish(resolve, Buffer.concat(chunks)), 100);
    const finish = (callback, value) => {
      clearTimeout(timer);
      process.stdin.removeAllListeners();
      process.stdin.pause();
      process.stdin.unref?.();
      callback(value);
    };
    process.stdin.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_FRAME_BYTES) return finish(reject, new Error('FRAME_TOO_LARGE'));
      chunks.push(Buffer.from(chunk));
      clearTimeout(timer);
      timer = setTimeout(() => finish(resolve, Buffer.concat(chunks)), 100);
    });
    process.stdin.once('end', () => finish(resolve, Buffer.concat(chunks)));
    process.stdin.once('error', error => finish(reject, error));
    process.stdin.resume();
  });
}

function canonicalBase64(value) {
  if (typeof value !== 'string' || value.length === 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) return null;
  const bytes = Buffer.from(value, 'base64');
  return bytes.toString('base64') === value ? bytes : null;
}

function parseSubmitFrame(bytes) {
  if (bytes.length < 2 || bytes.at(-1) !== 0x0a || bytes.subarray(0, -1).includes(0x0a)) throw new Error('FRAME_INVALID');
  const raw = bytes.subarray(0, -1).toString('utf8');
  const envelope = JSON.parse(raw);
  if (canonical(envelope) !== raw || !closed(envelope, ['command_body_base64', 'signature_base64'])) throw new Error('FRAME_INVALID');
  const commandBody = canonicalBase64(envelope.command_body_base64);
  const signature = canonicalBase64(envelope.signature_base64);
  if (!commandBody || !signature) throw new Error('FRAME_INVALID');
  const bodyText = commandBody.toString('utf8');
  if (canonical(JSON.parse(bodyText)) !== bodyText) throw new Error('FRAME_INVALID');
  return Buffer.from(`${raw}\n`);
}

async function exchange(frame) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ path: SOCKET_PATH });
    const chunks = [];
    let size = 0;
    let settled = false;
    const done = (callback, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      callback(value);
    };
    socket.setTimeout(30_000, () => done(reject, new Error('SOCKET_TIMEOUT')));
    socket.once('error', error => done(reject, error));
    socket.once('connect', () => socket.end(frame));
    socket.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_FRAME_BYTES) return done(reject, new Error('RESPONSE_TOO_LARGE'));
      chunks.push(Buffer.from(chunk));
    });
    socket.once('end', () => done(resolve, Buffer.concat(chunks)));
  });
}

function parseResponse(bytes) {
  if (bytes.length < 2 || bytes.at(-1) !== 0x0a || bytes.subarray(0, -1).includes(0x0a)) throw new Error('RESPONSE_INVALID');
  const raw = bytes.subarray(0, -1).toString('utf8');
  const value = JSON.parse(raw);
  if (canonical(value) !== raw || !value || value.schema_version !== '1.0' || typeof value.operation !== 'string' || typeof value.outcome !== 'string') throw new Error('RESPONSE_INVALID');
  return value;
}

const args = process.argv.slice(2);
const command = args.length === 1 ? args[0] : null;
const operation = command === 'status' ? 'status' : 'applyControllerCommand';
const injected = Object.keys(process.env).some(key => FORBIDDEN_ENV.test(key));

if (!['submit', 'status'].includes(command) || injected) {
  emit(rejected(operation), 2);
} else {
  try {
    const input = await readFrame();
    let request;
    if (command === 'submit') request = parseSubmitFrame(input);
    else {
      if (input.length !== 0) throw new Error('STATUS_BODY_FORBIDDEN');
      request = Buffer.from('{"operation":"status"}\n');
    }
    try {
      const response = parseResponse(await exchange(request));
      emit(response, response.outcome === 'REJECTED' ? 2 : response.outcome === 'BLOCKED' ? 3 : 0);
    } catch {
      emit(processFailure(operation), 70);
    }
  } catch {
    emit(rejected(operation), 2);
  }
}
