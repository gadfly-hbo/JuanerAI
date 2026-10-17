// Explicitly authorized, synthetic runtime probe; never the product start entry.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { request } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { protectDecisionPlatformIngress } from '../../adapters/decision-platform/ingress.ts';

const [sourceArg, receiptArg, runArg] = process.argv.slice(2);
assert.equal(process.env.DP_SYNTHETIC_AUTHORIZED, '1', 'requires the recorded user runtime authorization');
assert.ok([sourceArg, receiptArg, runArg].every(value => value && isAbsolute(value)), 'absolute source/receipt/new-run paths required');
for (const name of Object.keys(process.env)) {
  assert.ok(!/(API_KEY|AUTH_TOKEN|ACCESS_TOKEN|NODE_OPTIONS|PROXY)/i.test(name), 'unexpected credential or runtime environment');
}
const source = realpathSync(sourceArg);
const receipt = JSON.parse(readFileSync(receiptArg, 'utf8'));
const fixedCandidates = {
  '8ae652ce53fc27d3be92098517643a419f9b73eb': 70,
  'c11f8da8d8db3b2d5ae2424941a24307471ad972': 72,
};
assert.ok(Object.hasOwn(fixedCandidates, receipt.commit), 'unapproved fixed source');
assert.equal(receipt.files.length, fixedCandidates[receipt.commit]);
assert.equal(new Set(receipt.files.map(file => file.path)).size, receipt.files.length);
for (const file of receipt.files) {
  const path = resolve(source, file.path);
  assert.ok(path.startsWith(source + '/'));
  assert.ok(lstatSync(path).isFile() && realpathSync(path) === path, 'no symlink source');
  const bytes = readFileSync(path);
  assert.equal(bytes.length, file.bytes, file.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
}
// mkdir without recursive: existing/unknown roots fail before importing plugin code.
mkdirSync(runArg, { mode: 0o700 });
const run = realpathSync(runArg);
const home = join(run, 'home'), temp = join(run, 'tmp'), data = join(run, 'data');
for (const path of [home, temp, data]) mkdirSync(path, { mode: 0o700 });
process.env.HOME = home;
process.env.TMPDIR = temp;
process.env.DATA_ROOT = data;
process.chdir(run);
const checks = [];
let server;
let access;
let base;
const owner = randomBytes(32).toString('hex');
const extractionInputs = [];
const report = '# 合成验收报告\n纯测试数据：指标从 10 降至 8。\n';
const draft = {
  title: '合成建议：检查测试指标', rationale: '纯测试数据变化', expectedImpact: '待验证',
  priority: 'medium', effort: 'low', confidence: 0.8,
  evidence: { facts: [{ text: '测试指标下降', quote: '指标从 10 降至 8' }], level: '数据支撑', reasoning: '仅验证接缝，不代表模型质量' },
};
const runner = { async runExtraction(input) { extractionInputs.push(input); return [draft]; } };
const fetchLocal = globalThis.fetch;
globalThis.fetch = () => { throw new Error('synthetic probe disallows fetch; owner requests use native HTTP'); };
async function api(path, method = 'GET', body, includeOwner = true) {
  const url = new URL(base + path);
  assert.equal(url.origin, base);
  return new Promise((resolveRequest, reject) => {
    const req = request(url, { method,
      headers: { ...(includeOwner ? { 'x-decision-owner': owner } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      signal: AbortSignal.timeout(5000) }, response => {
      let text = '';
      response.setEncoding('utf8').on('data', chunk => { text += chunk; });
      response.on('error', reject);
      response.on('end', () => {
        try { resolveRequest({ status: response.statusCode, body: JSON.parse(text) }); }
        catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    req.end(body === undefined ? undefined : JSON.stringify(body));
  });
}
async function stop() {
  if (!server) return;
  access.revoke();
  server.closeAllConnections();
  await new Promise((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()));
  server = undefined;
}
try {
  const { startServer } = await import(pathToFileURL(join(source, 'server/index.ts')).href);
  async function start() {
    server = startServer(0, '127.0.0.1', {
      dbPath: join(data, 'board.db'), projectsDir: join(data, 'projects'),
      notifyFile: join(data, 'disabled-notify.json'), notifyStateFile: join(data, 'notify-state.json'),
      agentAuditPath: join(data, 'agent-audit.jsonl'), distDir: join(run, 'no-frontend'), agentRunner: runner,
    });
    access = protectDecisionPlatformIngress(server, owner);
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
  }
  await start();
  assert.equal((await api('/api/health')).status, 200);
  assert.equal((await api('/api/projects', 'POST', { title: 'must not persist' }, false)).status, 403);
  assert.deepEqual((await api('/api/projects')).body.projects, []);
  checks.push('real fixed startServer ingress rejects unauthorized mutation before database effects');
  const created = await api('/api/projects', 'POST', { title: '合成测试项目', purpose: '仅本次接缝验证' });
  assert.equal(created.status, 201);
  const projectId = created.body.id;
  const uploadPath = `/api/projects/${projectId}/reports`;
  const invalid = await api(uploadPath, 'POST', { files: [{ filename: '../escape.md', contentBase64: Buffer.from(report).toString('base64') }] });
  assert.equal(invalid.body.results[0].ok, false);
  assert.equal(extractionInputs.length, 0);
  const uploaded = await api(uploadPath, 'POST', { files: [{ filename: 'synthetic-v1.md', contentBase64: Buffer.from(report).toString('base64') }] });
  assert.equal(uploaded.body.results[0].status, 'accepted');
  let board;
  for (let attempt = 0; attempt < 100; attempt++) {
    board = (await api(`/api/projects/${projectId}/board`)).body;
    if (board.reports[0]?.status === 'done') break;
    await new Promise(resolveWait => setTimeout(resolveWait, 20));
  }
  assert.equal(board.reports[0].status, 'done');
  assert.equal(board.actionItems.length, 1);
  assert.equal(extractionInputs.length, 1);
  assert.equal(readFileSync(join(data, 'projects', projectId, 'reports', 'synthetic-v1.md'), 'utf8'), report);
  assert.equal(board.notify.configured, false);
  checks.push('real upload byte readback, invalid path rejection, injected extraction completion and no notification configuration');
  const itemId = board.actionItems[0].id;
  assert.equal((await api(`/api/actions/${itemId}`, 'PATCH', { status: 'dismissed', via: 'board' })).status, 400);
  assert.equal((await api(`/api/actions/${itemId}`, 'PATCH', { status: 'adopted', via: 'board' })).status, 200);
  const task = await api(`/api/actions/${itemId}/tasks`, 'POST', { title: '合成核查任务', owner: '测试角色', dueDate: '2026-10-20' });
  assert.equal(task.status, 200);
  const taskId = task.body.id;
  const feedbackPath = `/api/tasks/${taskId}/feedback`;
  assert.equal((await api(feedbackPath, 'POST', { adopted: true, outcome: '合成执行结果', review: '只用于接缝验证', score: 4 })).status, 200);
  assert.equal((await api(feedbackPath)).body.score, 4);
  checks.push('real adopt/task/feedback flow with required dismissal reason rejection');
  await stop();
  await start(); // same freshly created root only; no external/old database is opened
  board = (await api(`/api/projects/${projectId}/board`)).body;
  assert.equal(board.actionItems[0].id, itemId);
  assert.equal(board.actionItems[0].status, 'adopted');
  assert.equal(board.actionItems[0].tasks[0].id, taskId);
  assert.equal((await api(feedbackPath)).body.score, 4);
  assert.equal(extractionInputs.length, 1, 'restart must not re-extract completed report');
  checks.push('same-instance-source restart retains project/report/adoption/task/feedback without repeating extraction');
  await stop();
  writeFileSync(join(run, 'result.json'), JSON.stringify({ status: 'PASS', sourceCommit: receipt.commit, checks,
    limitations: ['synthetic runner, not SDK/provider validation', 'no UI/browser or installed-artifact acceptance', 'not host provenance/policy/lifecycle completion', 'no OS network sandbox claim'] }, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'PASS', checks, result: join(run, 'result.json') }));
} catch (error) {
  writeFileSync(join(run, 'result.json'), JSON.stringify({ status: 'FAIL', checks, error: String(error) }, null, 2) + '\n');
  throw error;
} finally {
  await stop();
  globalThis.fetch = fetchLocal;
}
