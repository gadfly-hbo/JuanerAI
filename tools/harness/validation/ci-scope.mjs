// This CLI is copied from the trusted PR base by CI, never selected by a PR flag.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const configCheck = fileURLToPath(new URL('./check-agent-config.py', import.meta.url));
const configPaths = ['.codex/config.toml', '.codex/agents/juaner_validator.toml'];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
try {
  const args = process.argv.slice(2);
  const check = ['--check-docs', '--check-affected'].includes(args[0]) ? args[0] : null;
  if (check) args.shift();
  assert.equal(args.length, 1, 'one explicit base commit is required');
  const [base] = args;
  assert.match(base, /^[a-f0-9]{40}$/, 'base must be an immutable commit identity');
  git('cat-file', '-e', `${base}^{commit}`);
  git('merge-base', '--is-ancestor', base, 'HEAD');
  const raw = git('diff', '--raw', '-z', '--no-abbrev', '--find-renames', '--find-copies', '--find-copies-harder', base, 'HEAD', '--');
  const fields = raw.split('\0');
  assert.equal(fields.pop(), '', 'diff must be NUL terminated');
  let documentation = fields.length > 0;
  let affected = fields.length > 0;
  let configChanged = false;
  for (let i = 0; i < fields.length;) {
    const metadata = /^:([0-7]{6}) ([0-7]{6}) [a-f0-9]{40} [a-f0-9]{40} ([A-Z])\d*$/.exec(fields[i++]);
    assert.ok(metadata, 'invalid Git diff metadata');
    const [, before, after, status] = metadata;
    const file = fields[i++];
    assert.ok(file, 'missing diff path');
    if (status === 'R' || status === 'C') assert.ok(fields[i++], 'missing rename/copy path');
    const allowed = !/[\u0000-\u001f\u007f-\u009f]/.test(file) && (
      ['README.md', 'AGENTS.md', 'CONTEXT.md', 'Orchestration.md'].includes(file) ||
      /^(?:docs\/governance|docs\/planning|\.ai-coding)\/(?:[^/]+\/)*[^/]+\.md$/.test(file) ||
      /^docs\/(?:templates|architecture)\/[^/]+\.md$/.test(file)
    );
    const regular = after === '100644' &&
      ((status === 'A' && before === '000000') || (status === 'M' && before === '100644'));
    documentation &&= allowed && regular;
    let configOnly = false;
    if (configPaths.includes(file) && regular && status === 'M') {
      const result = spawnSync('python3', [configCheck, '--compare'], { encoding: 'utf8', input: JSON.stringify({ path: file, before: git('show', `${base}:${file}`), after: git('show', `HEAD:${file}`) }) });
      assert.ifError(result.error);
      configOnly = result.status === 0;
      configChanged ||= configOnly;
    }
    affected &&= regular && (allowed || configOnly);
  }
  const scope = documentation ? 'documentation' : affected && configChanged ? 'affected' : 'full';
  if (check) {
    assert.equal(scope, check === '--check-docs' ? 'documentation' : 'affected', 'focused check requires proven scope');
    git('diff', '--check', base, 'HEAD', '--');
    if (scope === 'affected') execFileSync('python3', [configCheck, '--check'], { stdio: ['ignore', 'inherit', 'inherit'] });
  }
  process.stdout.write(`${scope}\n`);
} catch (error) {
  process.stderr.write(`CI scope failed: ${error.message}\n`);
  process.exitCode = 1;
}
