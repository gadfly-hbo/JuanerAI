import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const SOURCE_CONTROL = path.join(REPO_ROOT, '.juanerai', 'project-control');
const BOARD_MODULES = path.join(REPO_ROOT, 'tools', 'harness', 'project-board');
const EVENT_WARNING = '{"level":"warning","code":"PROJECT_BOARD_EVENT_APPEND_FAILED"}\n';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'juanerai-pbsa-'));
  const control = path.join(root, '.juanerai', 'project-control');
  const sourceStatus = path.join(SOURCE_CONTROL, 'status.json');
  const sourceBrief = path.join(SOURCE_CONTROL, 'decision-briefs', 'INPUT-001.json');
  const liveStatusBefore = await readFile(sourceStatus, 'utf8');
  const liveBriefBefore = await readFile(sourceBrief, 'utf8');
  await mkdir(path.join(root, 'tools', 'harness', 'project-board'), { recursive: true });
  await cp(path.join(BOARD_MODULES, 'status-cli.mjs'), path.join(root, 'tools', 'harness', 'project-board', 'status-cli.mjs'));
  await cp(path.join(BOARD_MODULES, 'project-control.mjs'), path.join(root, 'tools', 'harness', 'project-board', 'project-control.mjs'));
  await mkdir(path.join(control, 'events'), { recursive: true });
  await mkdir(path.join(control, 'decision-briefs'), { recursive: true });
  await writeFile(path.join(control, 'status.json'), liveStatusBefore, 'utf8');
  await writeFile(path.join(control, 'decision-briefs', 'INPUT-001.json'), liveBriefBefore, 'utf8');
  t.after(async () => {
    assert.equal(await readFile(sourceStatus, 'utf8'), liveStatusBefore, 'fixture CLI must not write the live status record');
    assert.equal(await readFile(sourceBrief, 'utf8'), liveBriefBefore, 'fixture CLI must not write the live brief record');
    await rm(root, { recursive: true, force: true });
  });
  return {
    root,
    control,
    cli: path.join(root, 'tools', 'harness', 'project-board', 'status-cli.mjs'),
    status: path.join(control, 'status.json'),
    events: path.join(control, 'events'),
    brief: path.join(control, 'decision-briefs', 'INPUT-001.json')
  };
}

function runCli(f, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [f.cli, ...args], { cwd: f.root });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({
      code,
      signal,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stderr).toString('utf8')
    }));
  });
}

async function recordBytes(f) {
  const names = (await readdir(f.events)).sort();
  return {
    status: await readFile(f.status, 'utf8'),
    brief: await readFile(f.brief, 'utf8'),
    events: await Promise.all(names.map(async (name) => [name, await readFile(path.join(f.events, name), 'utf8')]))
  };
}

async function assertWriteBlocked(directory) {
  const probe = path.join(directory, `.pbsa-permission-probe-${process.pid}-${Date.now()}`);
  try {
    await writeFile(probe, 'blocked\n', { flag: 'wx' });
  } catch (error) {
    assert.ok(['EACCES', 'EPERM'].includes(error?.code), `permission probe must fail from directory write denial, received ${error?.code || 'unknown error'}`);
    return;
  }
  await rm(probe, { force: true });
  assert.fail(`Fixture permissions do not block writes in ${directory}; PBSA filesystem evidence is BLOCKED`);
}

async function readOnly(directory, operation) {
  const originalMode = (await stat(directory)).mode & 0o777;
  await chmod(directory, 0o555);
  try {
    await assertWriteBlocked(directory);
    return await operation();
  } finally {
    await chmod(directory, originalMode);
  }
}

test('PBSA-TEST-002: replace publishes one complete v1 status snapshot', async (t) => {
  const f = await fixture(t);
  const candidate = JSON.parse(await readFile(f.status, 'utf8'));
  candidate.summary = 'PBSA fixture replace publication';
  candidate.health = 'validating';
  const input = path.join(f.root, 'next-status.json');
  await writeFile(input, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');

  const result = await runCli(f, ['replace', '--input', input, '--event-summary', 'fixture replace', '--session', 'pbsa-test']);
  const published = await readFile(f.status, 'utf8');
  const shown = await runCli(f, ['show']);

  assert.equal(result.code, 0);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout, '');
  assert.ok(published.endsWith('\n'));
  assert.equal(JSON.parse(published).summary, candidate.summary);
  assert.equal(JSON.parse(published).health, candidate.health);
  assert.equal(shown.code, 0);
  assert.equal(JSON.parse(shown.stdout).status.summary, candidate.summary);
});

test('PBSA-TEST-002: failed status publication preserves prior status and issues no event warning', async (t) => {
  const f = await fixture(t);
  const before = await recordBytes(f);
  const result = await readOnly(f.control, () => runCli(f, [
    'set', '--summary', 'must not publish', '--event-summary', 'fixture status publication failure', '--session', 'pbsa-test'
  ]));
  const after = await recordBytes(f);

  assert.notEqual(result.code, 0);
  assert.equal(result.stderr.includes('PROJECT_BOARD_EVENT_APPEND_FAILED'), false);
  assert.deepEqual(after, before);
});

test('PBSA-TEST-003: invalid status candidates reject before any record write', async (t) => {
  const f = await fixture(t);
  const invalidInput = path.join(f.root, 'invalid-status.json');
  await writeFile(invalidInput, '{"schema_version":"nope"}\n', 'utf8');
  const before = await recordBytes(f);
  const replace = await runCli(f, ['replace', '--input', invalidInput, '--event-summary', 'invalid replace']);
  const set = await runCli(f, ['set', '--health', 'not-a-health-value', '--event-summary', 'invalid set']);
  const after = await recordBytes(f);

  assert.notEqual(replace.code, 0);
  assert.notEqual(set.code, 0);
  assert.equal(replace.stderr.includes('PROJECT_BOARD_EVENT_APPEND_FAILED'), false);
  assert.equal(set.stderr.includes('PROJECT_BOARD_EVENT_APPEND_FAILED'), false);
  assert.deepEqual(after, before);
});

test('PBSA-TEST-004: invalid events reject before a status mutation is published', async (t) => {
  const f = await fixture(t);
  const eventOnlyBefore = await recordBytes(f);
  const eventOnly = await runCli(f, ['event', '--type', 'not-a-real-event', '--summary', 'invalid event-only']);
  const eventOnlyAfter = await recordBytes(f);
  const before = await recordBytes(f);
  const statusMutation = await runCli(f, [
    'set', '--health', 'waiting_user', '--event-type', 'not-a-real-event', '--event-summary', 'invalid status event', '--session', 'pbsa-test'
  ]);
  const after = await recordBytes(f);

  assert.notEqual(eventOnly.code, 0);
  assert.equal(eventOnly.stderr.includes('PROJECT_BOARD_EVENT_APPEND_FAILED'), false);
  assert.deepEqual(eventOnlyAfter, eventOnlyBefore);
  assert.notEqual(statusMutation.code, 0);
  assert.equal(statusMutation.stderr.includes('PROJECT_BOARD_EVENT_APPEND_FAILED'), false);
  assert.deepEqual(after, before);
});

test('PBSA-TEST-005: invalid brief candidate rejects before brief, status, or event write', async (t) => {
  const f = await fixture(t);
  const before = await recordBytes(f);
  const result = await runCli(f, ['brief', '--id', 'INPUT-001', '--status', 'not-a-brief-status', '--event-summary', 'invalid brief']);
  const after = await recordBytes(f);

  assert.notEqual(result.code, 0);
  assert.equal(result.stderr.includes('PROJECT_BOARD_EVENT_APPEND_FAILED'), false);
  assert.deepEqual(after, before);
});

test('PBSA-TEST-006: a real post-publication set event failure is warning-only and leaves status current', async (t) => {
  const f = await fixture(t);
  const before = await recordBytes(f);
  const result = await readOnly(f.events, () => runCli(f, [
    'set', '--summary', 'status survives missing history', '--event-summary', 'fixture event failure', '--session', 'pbsa-test'
  ]));
  const after = await recordBytes(f);
  const shown = await runCli(f, ['show']);

  assert.notEqual(after.status, before.status, 'the real append failure fixture must occur after status publication');
  assert.deepEqual(after.events, []);
  assert.equal(shown.code, 0);
  assert.equal(JSON.parse(shown.stdout).status.summary, 'status survives missing history');
  assert.deepEqual(JSON.parse(shown.stdout).events, []);
  assert.equal(result.code, 0);
  assert.equal(result.stderr, EVENT_WARNING);
  assert.equal(result.stdout, '');
});

test('PBSA-TEST-007: a real post-publication brief event failure is warning-only', async (t) => {
  const f = await fixture(t);
  const before = await recordBytes(f);
  const result = await readOnly(f.events, () => runCli(f, [
    'brief', '--id', 'INPUT-001', '--status', 'cancelled', '--resolution', 'fixture resolution', '--event-summary', 'fixture brief event failure', '--session', 'pbsa-test'
  ]));
  const after = await recordBytes(f);

  assert.equal(after.status, before.status);
  assert.notEqual(after.brief, before.brief, 'the real append failure fixture must occur after brief publication');
  assert.equal(JSON.parse(after.brief).status, 'cancelled');
  assert.deepEqual(after.events, []);
  assert.equal(result.code, 0);
  assert.equal(result.stderr, EVENT_WARNING);
  assert.equal(result.stdout, '');
});

test('PBSA-TEST-008: a real event-only append failure is warning-only and changes no authoritative record', async (t) => {
  const f = await fixture(t);
  const before = await recordBytes(f);
  const result = await readOnly(f.events, () => runCli(f, [
    'event', '--type', 'status_updated', '--summary', 'fixture event-only failure', '--session', 'pbsa-test'
  ]));
  const after = await recordBytes(f);

  assert.deepEqual(after, before);
  assert.equal(result.code, 0);
  assert.equal(result.stderr, EVENT_WARNING);
  assert.equal(result.stdout, '');
});

test('PBSA-TEST-009: show obtains current state from status rather than event history', async (t) => {
  const f = await fixture(t);
  const status = JSON.parse(await readFile(f.status, 'utf8'));
  const historicalStatusAfter = status.health === 'complete' ? 'active' : 'complete';
  const historicalEvent = {
    schema_version: '1.0',
    event_id: 'EVT-PBSA-FIXTURE-DIFFERENT-STATUS',
    event_type: 'status_updated',
    occurred_at: '2026-08-21T00:00:00.000Z',
    actor: { role: 'controller', session: 'pbsa-test' },
    summary: 'history intentionally differs from current state',
    status_after: historicalStatusAfter,
    evidence_refs: []
  };
  await writeFile(path.join(f.events, '20260821000000000-EVT-PBSA-FIXTURE-DIFFERENT-STATUS.json'), `${JSON.stringify(historicalEvent, null, 2)}\n`, 'utf8');

  const result = await runCli(f, ['show']);
  const shown = JSON.parse(result.stdout);

  assert.equal(result.code, 0);
  assert.equal(shown.status.health, status.health);
  assert.notEqual(shown.status.health, historicalEvent.status_after);
  assert.equal(shown.events.length, 1);
  assert.equal(shown.events[0].event_id, historicalEvent.event_id);
  assert.equal(shown.events[0].status_after, historicalEvent.status_after);
});
