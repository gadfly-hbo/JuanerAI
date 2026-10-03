import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const classifier = fileURLToPath(new URL('./ci-scope.mjs', import.meta.url));
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
  if (trustedClassifier !== null) await put('tools/harness/validation/ci-scope.mjs', trustedClassifier);
  git('add', '.'); git('commit', '-m', 'base');
  const base = git('rev-parse', 'HEAD');
  return { root, git, put, base, commit: () => { git('add', '-A'); git('commit', '-m', 'change'); } };
}
function classify(f, base = f.base, flags = []) {
  return spawnSync(process.execPath, [classifier, ...flags, base], { cwd: f.root, env: { ...process.env, JUANERAI_CI_SCOPE: 'focused', JUANERAI_VALIDATION_SCOPE: 'documentation' }, encoding: 'utf8' });
}

test('CI-SCOPE-002: only explicit non-runtime documentation qualifies, including safe spaces in paths', async t => {
  const f = await repository(t);
  for (const file of ['README.md', 'AGENTS.md', 'CONTEXT.md', 'Orchestration.md', 'docs/governance/example.md', 'docs/governance/review notes.md', '.ai-coding/policies/testing.md']) await f.put(file, 'updated documentation\n');
  f.commit();
  const result = classify(f);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'documentation\n');
  assert.equal(classify(f, f.base, ['--check-docs']).status, 0);
});

test('CI-SCOPE-002: unknown, mixed, runtime, schema, dependencies and executable changes require full', async t => {
  for (const file of ['packages/example.ts', 'package.json', 'package-lock.json', '.github/workflows/ci.yml', 'tools/harness/validation/run', 'tests/fixtures/example.md', 'openspec/specs/example/spec.md', 'docs/planning/ui.html', 'docs/planning/data.json', 'docs/planning/frozen-contract.md', 'docs/unknown.md', 'docs/governance/multiline\nname.md', '.codex/agents/worker.toml']) await t.test(file, async child => {
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
  const selection = shell.slice(shell.indexOf('test "${#PR_BASE_SHA}"'), shell.indexOf('export NPM_CONFIG_USERCONFIG'));
  assert.ok(selection.startsWith('test "${#PR_BASE_SHA}"'), 'actual workflow must check immutable base before selection');
  const actual = await readFile(classifier, 'utf8');
  for (const kind of ['docs', 'hostile-pr', 'initial-introduction', 'missing-base', 'broken-classifier', 'unknown-result']) await t.test(kind, async child => {
    const trusted = kind === 'initial-introduction' ? null : kind === 'broken-classifier' ? 'process.exit(19);\n' : kind === 'unknown-result' ? "console.log('skip');\n" : actual;
    const f = await repository(child, trusted);
    await f.put('README.md', 'new documentation\n');
    if (kind === 'hostile-pr') await f.put('tools/harness/validation/ci-scope.mjs', "console.log('documentation');\n");
    f.commit();
    const temp = path.join(f.root, 'runner-temp'); await mkdir(temp);
    const result = spawnSync('/bin/bash', ['-c', `set -e\nrun_logged() { label="$1"; shift; printf 'CHECK %s\\n' "$label"; if [ "$label" = documentation ]; then "$@"; fi; }\n${selection}\nprintf 'CONTINUE_FULL\\n'`], {
      cwd: f.root, env: { ...process.env, PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, PR_BASE_SHA: kind === 'missing-base' ? '0'.repeat(40) : f.base, RUNNER_TEMP: temp, JUANERAI_CI_SCOPE: 'documentation', validation_scope: 'documentation' }, encoding: 'utf8',
    });
    if (['missing-base', 'broken-classifier', 'unknown-result'].includes(kind)) {
      assert.notEqual(result.status, 0); assert.doesNotMatch(result.stdout, /CONTINUE_FULL|CHECK scope-contracts/);
    } else {
      assert.equal(result.status, 0, result.stderr);
      if (kind === 'docs') { assert.match(result.stdout, /CHECK documentation/); assert.match(result.stdout, /CHECK scope-contracts/); assert.doesNotMatch(result.stdout, /CONTINUE_FULL/); }
      else { assert.match(result.stdout, /CONTINUE_FULL/); assert.doesNotMatch(result.stdout, /CHECK documentation/); }
    }
  });
});
