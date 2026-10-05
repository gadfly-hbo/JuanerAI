import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('./engineering-turn-check.mjs', import.meta.url));
function state(overrides = {}) {
  return { schema_version: '1.0', project: { id: 'synthetic', name: 'test', product: 'Xanthil' },
    phase: { id: 'IMPLEMENTATION', label: 'implementation', ordinal: 1, total: 3 },
    health: 'active', summary: 'synthetic', current_objective: 'test', next_action: 'next approved behavior',
    blockers: [], milestones: [], agents: [], metrics: [], risks: [],
    evidence: [ ['SDD_INPUT', 'proposal.md'], ['SDD_SPEC', 'specs/workflow/spec.md'],
      ['SDD_TASKS', 'tasks.md'], ['SDD_VERIFICATION', 'verification.md'] ].map(([id, file]) =>
      ({ id, label: id, path: `openspec/changes/synthetic/${file}`, status: 'present' })),
    updated_at: new Date().toISOString(), updated_by: { role: 'controller', session: 'mini-engineering:session-a:turn-a' },
    ...overrides };
}
async function fixture(t, s = state()) {
  const root = await mkdtemp(path.join(tmpdir(), 'juanerai-turn-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const put = async (file, text) => { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), text); };
  const snapshot = '.juanerai/project-control/status.json';
  await put(snapshot, JSON.stringify(s));
  for (const e of s.evidence) await put(e.path, '# Synthetic material\n');
  execFileSync('git', ['init', '-q', root]);
  return { root, snapshot, put, s };
}
function check(f, hook = null) {
  const p = spawnSync(process.execPath, [command, ...(hook ? ['--hook'] : ['--check', f.root])], {
    encoding: 'utf8', input: hook ? JSON.stringify({ hook_event_name: 'Stop', cwd: f.root,
      session_id: 'session-a', turn_id: 'turn-a', model: 'gpt-6.1-sol', stop_hook_active: false, last_assistant_message: 'A milestone completed.', ...hook }) : '', timeout: 5000 });
  assert.equal(p.status, 0, p.stderr);
  return JSON.parse(p.stdout);
}
test('FLOW-03: manual check reports active progress and missing SDD materials without writes', async t => {
  const f = await fixture(t), before = await readFile(path.join(f.root, f.snapshot));
  assert.equal(check(f).status, 'CONTINUE');
  await rm(path.join(f.root, f.s.evidence[1].path));
  assert.deepEqual(check(f).missing, ['SDD_SPEC']);
  assert.deepEqual(await readFile(path.join(f.root, f.snapshot)), before);
});
test('FLOW-04: bound active turn gets one continuation, never raw private content', async t => {
  const f = await fixture(t, state({ next_action: 'PRIVATE_SENTINEL $(touch forbidden)' }));
  assert.equal(check(f, {}).decision, 'block');
  assert.doesNotMatch(JSON.stringify(check(f, {})), /PRIVATE_SENTINEL|touch forbidden/);
  assert.equal(check(f, { stop_hook_active: true }).decision, undefined);
});
test('FLOW-04: real stops, blockers, unrelated turns, Interrupt and unknown phases do not resume', async t => {
  for (const s of [state({ health: 'waiting_user' }), state({ health: 'blocked' }), state({ health: 'complete' }),
    state({ phase: { id: 'PRODUCT_ACCEPT', label: 'acceptance', ordinal: 2, total: 3 } }),
    state({ blockers: [{ id: 'permission', label: 'permission', detail: 'missing authority', owner: 'user' }] }),
    state({ updated_by: { role: 'controller', session: 'mini-engineering:session-a:old-turn' } })]) {
    const f = await fixture(t, s); assert.equal(check(f, {}).decision, undefined);
  }
  const f = await fixture(t);
  for (const event of [{ turn_id: 'other' }, { session_id: 'other' }, { hook_event_name: 'Interrupt' }, { turn_id: null },
    { last_assistant_message: null }, { last_assistant_message: 'JUANERAI_STOP: USER_PAUSED' }]) {
    assert.equal(check(f, event).decision, undefined);
  }
});

test('FLOW-05: oversized and missing state and symlinked parents remain non-activating', async t => {
  const f = await fixture(t);
  await f.put(f.snapshot, ' '.repeat(256 * 1024 + 1));
  assert.equal(check(f).status, 'UNKNOWN'); assert.equal(check(f, {}).decision, undefined);
  await rm(path.join(f.root, f.snapshot));
  assert.equal(check(f).status, 'UNKNOWN'); assert.equal(check(f, {}).decision, undefined);
  await mkdir(path.join(f.root, 'foreign'), { recursive: true });
  await writeFile(path.join(f.root, 'foreign/status.json'), JSON.stringify(state()));
  await rm(path.join(f.root, '.juanerai/project-control'), { recursive: true });
  await symlink('../foreign', path.join(f.root, '.juanerai/project-control'));
  assert.equal(check(f).status, 'UNKNOWN'); assert.equal(check(f, {}).decision, undefined);
});

test('FLOW-06: delivered hooks.json executes the actual command and preserves source/status', async t => {
  const f = await fixture(t), hookConfig = JSON.parse(await readFile(new URL('../../../.codex/hooks.json', import.meta.url), 'utf8'));
  await f.put('tools/harness/validation/engineering-turn-check.mjs', await readFile(command, 'utf8'));
  await f.put('tools/harness/project-board/project-control.mjs', await readFile(new URL('../project-board/project-control.mjs', import.meta.url), 'utf8'));
  const before = await readFile(path.join(f.root, f.snapshot));
  const handler = hookConfig.hooks.Stop[0].hooks[0];
  assert.equal(handler.type, 'command'); assert.equal(handler.timeout, 5);
  const p = spawnSync('/bin/bash', ['-c', handler.command], { cwd: f.root,
    env: { ...process.env, PATH: `${path.dirname(process.execPath)}:${process.env.PATH}` }, timeout: 5000, encoding: 'utf8',
    input: JSON.stringify({ hook_event_name: 'Stop', cwd: f.root, model: 'gpt-6.1-sol', session_id: 'session-a', turn_id: 'turn-a',
      stop_hook_active: false, last_assistant_message: 'A milestone completed.' }) });
  assert.equal(p.status, 0, p.stderr); assert.equal(JSON.parse(p.stdout).decision, 'block');
  assert.deepEqual(await readFile(path.join(f.root, f.snapshot)), before);
});

test('FLOW-07: prompt hook exposes host binding only, never starts work or writes state', async t => {
  const f = await fixture(t), before = await readFile(path.join(f.root, f.snapshot));
  const context = check(f, { hook_event_name: 'UserPromptSubmit' });
  assert.equal(context.hookSpecificOutput?.hookEventName, 'UserPromptSubmit');
  assert.match(context.hookSpecificOutput.additionalContext, /mini-engineering:session-a:turn-a/);
  assert.equal(context.decision, undefined);
  assert.deepEqual(await readFile(path.join(f.root, f.snapshot)), before);
  assert.deepEqual(check(f, { hook_event_name: 'UserPromptSubmit', model: 'gpt-6-astra' }), {});
  assert.deepEqual(check(f, { hook_event_name: 'UserPromptSubmit', turn_id: 'bad\nids' }), {});
});
test('FLOW-05: malformed or symlinked state is UNKNOWN and cannot resume', async t => {
  const f = await fixture(t);
  await f.put(f.snapshot, '{'); assert.equal(check(f).status, 'UNKNOWN'); assert.equal(check(f, {}).decision, undefined);
  await rm(path.join(f.root, f.snapshot)); await f.put('outside.json', JSON.stringify(state()));
  await symlink('../../outside.json', path.join(f.root, f.snapshot));
  assert.equal(check(f).status, 'UNKNOWN'); assert.equal(check(f, {}).decision, undefined);
});
test('FLOW-05: symlinked, escaped and empty materials are missing, not proof of acceptance', async t => {
  const f = await fixture(t), spec = path.join(f.root, f.s.evidence[1].path);
  await rm(spec); await symlink(path.join(f.root, f.snapshot), spec);
  assert.deepEqual(check(f).missing, ['SDD_SPEC']);
  await rm(spec); await f.put(f.s.evidence[1].path, '  \n');
  assert.deepEqual(check(f).missing, ['SDD_SPEC']);
  f.s.evidence[1].path = '../outside.md'; await f.put(f.snapshot, JSON.stringify(f.s));
  assert.deepEqual(check(f).missing, ['SDD_SPEC']);
});
test('FLOW-05: parent checkout resolves only one bound registered worktree', async t => {
  const f = await fixture(t), other = path.join(f.root, 'other-worktree');
  execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', '-C', f.root,
    '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'synthetic']);
  execFileSync('git', ['-C', f.root, 'worktree', 'add', '-q', '-b', 'synthetic-work', other]);
  await mkdir(path.join(other, '.juanerai/project-control'), { recursive: true });
  await writeFile(path.join(other, f.snapshot), JSON.stringify(state()));
  assert.equal(check(f, {}).decision, undefined, 'ambiguous matching state must not resume');
  await f.put(f.snapshot, JSON.stringify(state({ updated_by: { role: 'controller', session: 'other' } })));
  assert.equal(check(f, {}).decision, 'block');
});
