import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const classifier = fileURLToPath(new URL('./ci-scope.mjs', import.meta.url));
const configPath = '.codex/agents/juaner_validator.toml';
const configBefore = 'name = "juaner_validator"\nmodel = "gpt-6.1-sol"\nmodel_reasoning_effort = "medium"\nsandbox_mode = "read-only"\ndeveloper_instructions = "preserve authority"\n';
const gitEnv = { ...process.env, GIT_AUTHOR_NAME: 'Scope Test', GIT_AUTHOR_EMAIL: 'scope@example.invalid', GIT_COMMITTER_NAME: 'Scope Test', GIT_COMMITTER_EMAIL: 'scope@example.invalid' };
async function repository(t, trustedClassifier = null) {
  const root = await mkdtemp(path.join(tmpdir(), 'juanerai-ci-scope-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args], { cwd: root, env: gitEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const put = async (file, text = 'documentation\n') => { await mkdir(path.dirname(path.join(root, file)), { recursive: true }); await writeFile(path.join(root, file), text); };
  git('init');
  await put('README.md');
  await put('docs/governance/example.md');
  await put('packages/example.ts', 'export const value = 1;\n');
  await put(configPath, configBefore);
  await put('.codex/config.toml', 'model = "gpt-6-astra"\nmodel_reasoning_effort = "high"\nsandbox_mode = "workspace-write"\n[agents]\nenabled = true\nmax_concurrent_threads_per_session = 3\ndefault_subagent_model = "gpt-6-astra"\ndefault_subagent_reasoning_effort = "medium"\n');
  if (trustedClassifier !== null) {
    await put('tools/harness/validation/ci-scope.mjs', trustedClassifier);
    await put('tools/harness/validation/check-agent-config.py', await readFile(new URL('./check-agent-config.py', import.meta.url), 'utf8'));
  }
  git('add', '.'); git('commit', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  return { root, git, put, base, commit: () => { git('add', '-A'); git('commit', '-m', 'change'); } };
}

test('CI-TIER-001: parsed model/effort-only edits take affected, other config semantics stay full', async t => {
  for (const [name, content, expected] of [
    ['effort', configBefore.replace('"medium"', '"high"'), 'affected'],
    ['comments and equivalent spelling', configBefore.replace('"medium"', "'high' # approved"), 'affected'],
    ['equivalent multiline instructions', configBefore.replace('"medium"', '"high"').replace('"preserve authority"', '\'\'\'preserve authority\'\'\''), 'affected'],
    ['hidden instructions', configBefore.replace('"medium"', '"high"').replace('preserve authority', 'new authority'), 'full'],
    ['sandbox', configBefore.replace('"medium"', '"high"').replace('read-only', 'danger-full-access'), 'full'],
    ['malformed', 'model = [', 'full'],
    ['duplicate key', configBefore + 'model = "gpt-6.1-sol"\n', 'full'],
    ['wrong model', configBefore.replace('gpt-6.1-sol', 'other'), 'full'],
    ['wrong effort', configBefore.replace('"medium"', '"low"'), 'full'],
    ['extra field', configBefore.replace('"medium"', '"high"') + 'permission = true\n', 'full'],
  ]) await t.test(name, async child => {
    const f = await repository(child);
    await f.put(configPath, content); await f.put('README.md', 'updated\n'); f.commit();
    const result = classify(f);
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, `${expected}\n`);
    assert.equal(classify(f, f.base, ['--check-affected']).status === 0, expected === 'affected');
  });
});
function classify(f, base = f.base, flags = []) {
  const env = { ...process.env, JUANERAI_CI_SCOPE: 'focused', JUANERAI_VALIDATION_SCOPE: 'documentation' };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, [classifier, ...flags, base], { cwd: f.root, env, encoding: 'utf8' });
}

test('CI-TIER-006: two-role v0.9 pins Validator to Sol/high without changing MacBook defaults', async t => {
  for (const kind of ['valid', 'old-astra-role', 'sol-primary', 'sol-default-support']) await t.test(kind, async child => {
    const f = await repository(child, await readFile(classifier, 'utf8'));
    await f.put(configPath, configBefore.replace('"medium"', '"high"'));
    if (kind === 'old-astra-role') await f.put(configPath, configBefore.replace('"medium"', '"high"').replace('gpt-6.1-sol', 'gpt-6-astra'));
    if (kind === 'sol-primary' || kind === 'sol-default-support') {
      const current = await readFile(path.join(f.root, '.codex/config.toml'), 'utf8');
      await f.put('.codex/config.toml', current.replace(kind === 'sol-primary' ? 'model = "gpt-6-astra"' : 'default_subagent_model = "gpt-6-astra"', kind === 'sol-primary' ? 'model = "gpt-6.1-sol"' : 'default_subagent_model = "gpt-6.1-sol"'));
    }
    f.commit();
    const full = spawnSync('python3', ['tools/harness/validation/check-agent-config.py', '--check'], { cwd: f.root, env: process.env, encoding: 'utf8' });
    assert.equal(full.status === 0, kind === 'valid', full.stderr);
    assert.equal(classify(f).stdout, kind === 'valid' ? 'affected\n' : 'full\n');
  });
});

test('CI-TIER-007: retired and renamed engineering roles cannot pass configuration validation', async t => {
  for (const [file, name] of [
    ['juaner_worker.toml', 'juaner_worker'], ['juaner_spec.toml', 'juaner_spec'],
    ['juaner_test.toml', 'juaner_test'], ['renamed.toml', 'juaner_worker'],
    ['duplicate.toml', 'juaner_validator'],
  ]) await t.test(file, async child => {
    const f = await repository(child, await readFile(classifier, 'utf8'));
    await f.put(configPath, configBefore.replace('"medium"', '"high"'));
    await f.put(`.codex/agents/${file}`, configBefore.replace('juaner_validator', name));
    f.commit();
    const checked = spawnSync('python3', ['tools/harness/validation/check-agent-config.py', '--check'], { cwd: f.root, env: process.env, encoding: 'utf8' });
    assert.notEqual(checked.status, 0, checked.stderr);
    assert.equal(classify(f).stdout, 'full\n');
  });
});

test('CI-SCOPE-002: only explicit non-runtime documentation qualifies, including safe spaces in paths', async t => {
  const f = await repository(t);
  for (const file of ['README.md', 'AGENTS.md', 'CONTEXT.md', 'Orchestration.md', 'docs/governance/example.md', 'docs/governance/review notes.md', 'docs/templates/HANDOFF.md', 'docs/architecture/boundaries.md', 'docs/planning/2026-10-04/plan.md', '.ai-coding/policies/testing.md']) await f.put(file, `updated documentation ${file}\n`);
  f.commit();
  const result = classify(f);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'documentation\n');
  assert.equal(classify(f, f.base, ['--check-docs']).status, 0);
});

test('CI-SCOPE-002: unknown, mixed, runtime, schema, dependencies and executable changes require full', async t => {
  for (const file of ['packages/example.ts', 'package.json', 'package-lock.json', '.github/workflows/ci.yml', 'tools/harness/validation/run', 'tools/harness/validation/check-agent-config.py', 'tests/fixtures/example.md', 'openspec/specs/example/spec.md', 'docs/planning/ui.html', 'docs/planning/data.json', 'docs/unknown.md', 'docs/governance/multiline\nname.md', '.codex/agents/worker.toml']) await t.test(file, async child => {
    const f = await repository(child);
    await f.put('README.md', 'updated\n'); await f.put(file, 'changed\n'); f.commit();
    const result = classify(f);
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, 'full\n');
    assert.notEqual(classify(f, f.base, ['--check-docs']).status, 0);
  });
});

test('CI-SCOPE-002: renames, deletions, symlinks and executable mode changes cannot take focused lane', async t => {
  for (const kind of ['rename', 'delete', 'symlink', 'executable']) await t.test(kind, async child => {
    const f = await repository(child), source = path.join(f.root, 'docs/governance/example.md');
    if (kind === 'rename') await rename(source, path.join(f.root, 'docs/governance/renamed.md'));
    if (kind === 'delete') await rm(source);
    if (kind === 'symlink') { await rm(source); await symlink('../../README.md', source); }
    if (kind === 'executable') { await chmod(source, 0o755); f.git('update-index', '--chmod=+x', 'docs/governance/example.md'); }
    f.commit(); const result = classify(f);
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, 'full\n');
  });
});

test('CI-SCOPE-002: missing base, malformed invocation and Git failures fail instead of granting a lane', async t => {
  const f = await repository(t);
  for (const base of ['0'.repeat(40), 'HEAD', '--help', '']) {
    const result = classify(f, base);
    assert.notEqual(result.status, 0); assert.equal(result.stdout, '');
  }
  const absentRepo = spawnSync(process.execPath, [classifier, f.base], { cwd: tmpdir(), encoding: 'utf8' });
  assert.notEqual(absentRepo.status, 0); assert.equal(absentRepo.stdout, '');
  assert.equal(classify(f).stdout, 'full\n', 'empty change is not documentation proof');
});

test('CI-SCOPE-002: focused documentation check rejects whitespace defects', async t => {
  const f = await repository(t); await f.put('README.md', 'bad trailing whitespace  \n'); f.commit();
  assert.equal(classify(f).stdout, 'documentation\n');
  assert.notEqual(classify(f, f.base, ['--check-docs']).status, 0);
});

test('CI-SCOPE-002 correction: every control-character class requires full while ordinary Unicode remains focused', async t => {
  const characters = [
    ['C0 start', '\u0001'], ['tab', '\t'], ['escape', '\u001b'], ['C0 end', '\u001f'],
    ['DEL', '\u007f'], ['C1 start', '\u0080'], ['C1 next line', '\u0085'], ['C1 end', '\u009f'],
  ];
  for (const [name, character] of characters) await t.test(name, async child => {
    const f = await repository(child);
    await f.put(`docs/governance/control${character}name.md`, 'unique new document\n');
    f.commit();
    const result = classify(f);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'full\n', `${name} must not grant documentation scope`);
    assert.notEqual(classify(f, f.base, ['--check-docs']).status, 0);
  });
  await t.test('ordinary Unicode and spaces', async child => {
    const f = await repository(child);
    await f.put('docs/governance/开发 说明-é.md', 'unique Unicode document\n');
    f.commit();
    assert.equal(classify(f).stdout, 'documentation\n');
    assert.equal(classify(f, f.base, ['--check-docs']).status, 0);
  });
});

test('CI-SCOPE-002 correction: copies from modified and unchanged sources require full', async t => {
  for (const changedSource of [true, false]) await t.test(changedSource ? 'modified source' : 'unchanged source', async child => {
    const f = await repository(child);
    await f.put('docs/governance/copied.md', await readFile(path.join(f.root, 'docs/governance/example.md'), 'utf8'));
    if (changedSource) await f.put('docs/governance/example.md', 'modified source documentation\n');
    f.commit();
    const raw = f.git('diff', '--raw', '--find-copies', '--find-copies-harder', f.base, 'HEAD', '--');
    assert.match(raw, /C100\s/, 'fixture must contain a real Git-detectable exact copy');
    const result = classify(f);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'full\n', 'a copy cannot receive documentation scope');
    assert.notEqual(classify(f, f.base, ['--check-docs']).status, 0);
  });
});

test('CI-SCOPE-002: actual workflow selects trusted base, ignores PR replacement and fails closed', async t => {
  const source = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const shell = source.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const selection = shell.slice(shell.indexOf('test "${#PR_BASE_SHA}"'), shell.indexOf('run_logged agent-config'));
  assert.ok(selection.startsWith('test "${#PR_BASE_SHA}"'), 'actual workflow must check immutable base before selection');
  const actual = await readFile(classifier, 'utf8');
  for (const kind of ['docs', 'config', 'hostile-pr', 'initial-introduction', 'missing-base', 'broken-classifier', 'unknown-result']) await t.test(kind, async child => {
    const trusted = kind === 'initial-introduction' ? null : kind === 'broken-classifier' ? 'process.exit(19);\n' : kind === 'unknown-result' ? "console.log('skip');\n" : actual;
    const f = await repository(child, trusted);
    await f.put('README.md', 'new documentation\n');
    if (kind === 'config') await f.put(configPath, configBefore.replace('"medium"', '"high"'));
    if (kind === 'hostile-pr') await f.put('tools/harness/validation/ci-scope.mjs', "console.log('documentation');\n");
    f.commit();
    const temp = path.join(f.root, 'runner-temp'); await mkdir(temp);
    const result = spawnSync('/bin/bash', ['-c', `set -e\nrun_logged() { label="$1"; shift; printf 'CHECK %s\\n' "$label"; "$@"; }\n${selection}\nprintf 'CONTINUE_FULL\\n'`], {
      cwd: f.root, env: { ...process.env, PR_BASE_SHA: kind === 'missing-base' ? '0'.repeat(40) : f.base, RUNNER_TEMP: temp, JUANERAI_CI_SCOPE: 'documentation', validation_scope: 'documentation' }, encoding: 'utf8',
    });
    if (['missing-base', 'broken-classifier', 'unknown-result'].includes(kind)) {
      assert.notEqual(result.status, 0); assert.doesNotMatch(result.stdout, /CONTINUE_FULL|CHECK scope-contracts/);
    } else {
      assert.equal(result.status, 0, result.stderr);
      if (kind === 'docs' || kind === 'config') { assert.match(result.stdout, new RegExp(`CHECK ${kind === 'docs' ? 'documentation' : 'affected'}`)); assert.doesNotMatch(result.stdout, /CONTINUE_FULL|CHECK scope-contracts/); }
      else { assert.match(result.stdout, /CONTINUE_FULL/); assert.doesNotMatch(result.stdout, /CHECK documentation/); }
    }
  });
});

test('CI-TIER-002: affected validates every candidate role and full workflow executes the same config contract', async t => {
  const source = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const command = source.match(/^\s+run_logged agent-config (.+)$/m)?.[1];
  assert.ok(command, 'full lane must execute agent config validation');
  for (const kind of ['valid', 'invalid-unmodified-primary', 'missing-role', 'role-link', 'parent-link']) await t.test(kind, async child => {
    const f = await repository(child, await readFile(classifier, 'utf8'));
    await f.put(configPath, configBefore.replace('"medium"', '"high"')); f.commit();
    assert.equal(classify(f).stdout, 'affected\n');
    const target = path.join(f.root, '.codex/agents/juaner_validator.toml');
    if (kind === 'invalid-unmodified-primary') await f.put('.codex/config.toml', 'model = [');
    if (kind === 'missing-role' || kind === 'role-link') await rm(target);
    if (kind === 'role-link') await symlink('../../README.md', target);
    if (kind === 'parent-link') { await rename(path.join(f.root, '.codex/agents'), path.join(f.root, '.codex/moved')); await symlink('moved', path.join(f.root, '.codex/agents')); }
    const affected = classify(f, f.base, ['--check-affected']);
    const full = spawnSync('/bin/bash', ['-ec', command], { cwd: f.root, env: process.env, encoding: 'utf8' });
    assert.equal(affected.status === 0, kind === 'valid', affected.stderr);
    assert.equal(full.status === 0, kind === 'valid', full.stderr);
  });
});

test('CI-TIER-004: primary/default routing is parsed and hidden nested permission edits stay full', async t => {
  for (const extra of ['', '\n[sandbox_workspace_write]\nnetwork_access = false\n']) await t.test(extra ? 'hidden permission' : 'support effort', async child => {
    const f = await repository(child);
    await f.put(configPath, configBefore.replace('"medium"', '"high"'));
    const current = await readFile(path.join(f.root, '.codex/config.toml'), 'utf8');
    await f.put('.codex/config.toml', current.replace('default_subagent_reasoning_effort = "medium"', 'default_subagent_reasoning_effort = "high"'));
    f.commit(); const base = f.git('rev-parse', 'HEAD');
    await f.put('.codex/config.toml', current + extra); f.commit();
    const result = classify(f, base);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, extra ? 'full\n' : 'affected\n');
    assert.equal(classify(f, base, ['--check-affected']).status === 0, !extra);
  });
});

test('CI-TIER-005: unavailable TOML runtime cannot grant affected or pass full config validation', async t => {
  const f = await repository(t, await readFile(classifier, 'utf8'));
  await f.put(configPath, configBefore.replace('"medium"', '"high"')); f.commit();
  const bin = path.join(f.root, 'no-tomllib'); await mkdir(bin);
  await writeFile(path.join(bin, 'python3'), '#!/bin/sh\nprintf "tomllib unavailable\\n" >&2\nexit 17\n', { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}` };
  const result = spawnSync(process.execPath, [classifier, f.base], { cwd: f.root, env, encoding: 'utf8' });
  assert.equal(result.status, 0); assert.equal(result.stdout, 'full\n');
  const full = spawnSync('python3', ['tools/harness/validation/check-agent-config.py', '--check'], { cwd: f.root, env, encoding: 'utf8' });
  assert.equal(full.status, 17); assert.match(full.stderr, /tomllib unavailable/);
});

test('CI-TIER-003 correction: parsed non-routing comparison preserves TOML scalar types recursively', async t => {
  const workflow = await readFile(new URL('../../../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const shell = workflow.split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const selection = shell.slice(shell.indexOf('test "${#PR_BASE_SHA}"'), shell.indexOf('run_logged agent-config'));
  const fullCommand = workflow.match(/^\s+run_logged agent-config (.+)$/m)?.[1];
  assert.ok(fullCommand);
  for (const [name, beforeExtra, afterExtra] of [
    ['network boolean to integer', '[sandbox_workspace_write]\nnetwork_access = true\n', '[sandbox_workspace_write]\nnetwork_access = 1\n'],
    ['list boolean to integer', '[fixture]\nvalues = [true]\n', '[fixture]\nvalues = [1]\n'],
    ['list integer to float', '[fixture]\nvalues = [3]\n', '[fixture]\nvalues = [3.0]\n'],
    ['nested dictionary boolean to integer', '[fixture]\nvalues = [{nested = {value = true}}]\n', '[fixture]\nvalues = [{nested = {value = 1}}]\n'],
    ['nested dictionary integer to float', '[fixture]\nvalues = [{nested = {value = 3}}]\n', '[fixture]\nvalues = [{nested = {value = 3.0}}]\n'],
  ]) await t.test(name, async child => {
    const f = await repository(child, await readFile(classifier, 'utf8'));
    await f.put(configPath, configBefore.replace('"medium"', '"high"'));
    const current = await readFile(path.join(f.root, '.codex/config.toml'), 'utf8');
    await f.put('.codex/config.toml', current.replace('default_subagent_reasoning_effort = "medium"', 'default_subagent_reasoning_effort = "high"') + beforeExtra);
    f.commit(); const base = f.git('rev-parse', 'HEAD');
    await f.put('.codex/config.toml', current + afterExtra); f.commit();
    const direct = classify(f, base);
    const temp = path.join(f.root, 'runner-temp'); await mkdir(temp);
    const result = spawnSync('/bin/bash', ['-ec', `run_logged() { shift; "$@"; }\n${selection}\nprintf 'CONTINUE_FULL\\n'`], { cwd: f.root, env: { ...process.env, PR_BASE_SHA: base, RUNNER_TEMP: temp }, encoding: 'utf8' });
    assert.equal(direct.status, 0, direct.stderr);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual([direct.stdout, result.stdout], ['full\n', 'CONTINUE_FULL\n']);
    assert.notEqual(classify(f, base, ['--check-affected']).status, 0);
  });
  await t.test('concurrency integer to float fails actual full config step', async child => {
    const f = await repository(child, await readFile(classifier, 'utf8'));
    await f.put(configPath, configBefore.replace('"medium"', '"high"'));
    const current = await readFile(path.join(f.root, '.codex/config.toml'), 'utf8');
    await f.put('.codex/config.toml', current.replace('max_concurrent_threads_per_session = 3', 'max_concurrent_threads_per_session = 3.0')); f.commit();
    const direct = classify(f);
    const full = spawnSync('/bin/bash', ['-ec', fullCommand], { cwd: f.root, env: process.env, encoding: 'utf8' });
    assert.deepEqual([direct.stdout, full.status === 0], ['full\n', false], full.stderr);
  });
});
