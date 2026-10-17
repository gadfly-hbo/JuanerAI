import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import type { OutgoingHttpHeaders } from 'node:http';
import { connect } from 'node:net';
import { once } from 'node:events';
import { protectDecisionPlatformIngress } from '../../../adapters/decision-platform/ingress.ts';

const owner = 'a'.repeat(64); // synthetic token only

async function fixture() {
  const calls: string[] = [];
  const server = createServer((req, res) => {
    calls.push(`${req.method} ${req.url}`);
    req.resume();
    res.end('synthetic business response');
  });
  server.listen(0, '127.0.0.1');
  const access = protectDecisionPlatformIngress(server, owner);
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  async function send(method = 'GET', path = '/api/health', headers: OutgoingHttpHeaders = {}) {
    return new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, method, path,
        headers: { 'x-decision-owner': owner, ...headers } }, res => {
        let body = '';
        res.setEncoding('utf8').on('data', part => { body += part; });
        res.on('end', () => resolve({ status: res.statusCode!, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }
  async function raw(lines: string[]) {
    const socket = connect(port, '127.0.0.1');
    socket.setTimeout(2000, () => socket.destroy(new Error('synthetic request timed out')));
    let output = '';
    socket.setEncoding('utf8').on('data', chunk => { output += chunk; });
    const end = once(socket, 'close');
    await once(socket, 'connect');
    socket.write(lines.join('\r\n') + '\r\n\r\n');
    await end;
    return output;
  }
  async function close() {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
  return { server, access, calls, port, send, raw, close };
}

test('DP-INGRESS-01 native listener admits owned GET/POST/PATCH exactly once', async () => {
  const f = await fixture();
  try {
    for (const method of ['GET', 'POST', 'PATCH']) {
      const result = await f.send(method, '/api/actions/action-1', method === 'GET' ? {} : { 'content-type': 'application/json' });
      assert.equal(result.status, 200);
      assert.equal(result.body, 'synthetic business response');
    }
    assert.deepEqual(f.calls, ['GET /api/actions/action-1', 'POST /api/actions/action-1', 'PATCH /api/actions/action-1']);
  } finally { await f.close(); }
});

test('DP-INGRESS-01/02 unauthorized native requests have zero business effects', async () => {
  const f = await fixture();
  try {
    const cases: [string, string, OutgoingHttpHeaders][] = [
      ['GET', '/api/health', { 'x-decision-owner': '' }],
      ['GET', '/api/health', { 'x-decision-owner': 'b'.repeat(64) }],
      ['GET', '/api/health', { host: `localhost:${f.port}` }],
      ['GET', '/api/health', { host: 'attacker.invalid' }],
      ['GET', '/api/health', { origin: `http://127.0.0.1:${f.port}` }],
      ['GET', '/api/health', { origin: 'https://attacker.invalid' }],
      ['GET', '/api/health', { cookie: 'session=synthetic' }],
      ['GET', '/api/health', { 'sec-fetch-site': 'same-origin' }],
      ['GET', '/api/health', { 'sec-fetch-mode': 'cors' }],
      ['GET', '/api/health', { 'sec-fetch-dest': 'empty' }],
      ['GET', '//api/health', {}],
      ['GET', '/api/../health', {}],
      ['GET', '/api/%68ealth', {}],
      ['GET', 'http://127.0.0.1/api/health', {}],
      ['DELETE', '/api/projects/p1', {}],
      ['POST', '/api/projects', { 'content-type': 'text/plain' }],
      ['PATCH', '/api/actions/a1', { 'content-type': 'application/json', 'content-encoding': 'gzip' }],
    ];
    for (const [method, path, headers] of cases) {
      const result = await f.send(method, path, headers);
      assert.equal(result.status, 403, `${method} ${path} ${Object.keys(headers).join(',')}`);
      assert.ok(!result.body.includes(owner));
    }
    assert.deepEqual(f.calls, []);
  } finally { await f.close(); }
});

test('DP-INGRESS-02 duplicate headers and alternative HTTP events cannot bypass the guard', async () => {
  const f = await fixture();
  try {
    const base = [`Host: 127.0.0.1:${f.port}`, `X-Decision-Owner: ${owner}`, 'Connection: close'];
    for (const extra of [`X-Decision-Owner: ${owner}`, `Host: 127.0.0.1:${f.port}`]) {
      assert.match(await f.raw(['GET /api/health HTTP/1.1', ...base, extra]), /^HTTP\/1\.1 403/);
    }
    for (const expect of ['100-continue', 'custom-expectation']) {
      const result = await f.raw(['POST /api/projects HTTP/1.1', ...base, 'Content-Type: application/json', 'Content-Length: 0', `Expect: ${expect}`]);
      assert.match(result, /^HTTP\/1\.1 403/);
      assert.ok(!result.includes('100 Continue'));
    }
    assert.match(await f.raw(['GET /api/health HTTP/1.1', `Host: 127.0.0.1:${f.port}`, `X-Decision-Owner: ${owner}`, 'Connection: Upgrade', 'Upgrade: websocket']), /^HTTP\/1\.1 403/);
    assert.match(await f.raw(['CONNECT localhost:80 HTTP/1.1', ...base]), /^HTTP\/1\.1 403/);
    assert.deepEqual(f.calls, []);
  } finally { await f.close(); }
});

test('DP-INGRESS-03 revocation closes new admission without claiming physical cancellation', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.send()).status, 200);
    f.access.revoke();
    f.access.revoke();
    assert.equal((await f.send()).status, 403);
    assert.equal(f.calls.length, 1);
    assert.equal(f.server.listening, true);
  } finally { await f.close(); }
});

test('DP-INGRESS-03 unknown handler layouts and invalid owner identities fail closed', async () => {
  for (const kind of ['none', 'multiple', 'checkContinue', 'checkExpectation', 'upgrade', 'connect', 'bad-token']) {
    const server = createServer();
    if (kind !== 'none') server.on('request', (_req, res) => res.end());
    if (kind === 'multiple') server.on('request', (_req, res) => res.end());
    if (['checkContinue', 'checkExpectation', 'upgrade', 'connect'].includes(kind)) server.on(kind, () => {});
    const original = server.listeners('request');
    assert.throws(() => protectDecisionPlatformIngress(server, kind === 'bad-token' ? 'invalid' : owner), /unsupported ingress/);
    assert.deepEqual(server.listeners('request'), original);
  }
  const server = createServer((_req, res) => res.end());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { assert.throws(() => protectDecisionPlatformIngress(server, owner), /unsupported ingress/); }
  finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
