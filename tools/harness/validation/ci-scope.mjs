// This CLI is copied from the trusted PR base by CI, never selected by a PR flag.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
try {
  const args = process.argv.slice(2);
  const check = args[0] === '--check-docs';
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
  for (let i = 0; i < fields.length;) {
    const metadata = /^:([0-7]{6}) ([0-7]{6}) [a-f0-9]{40} [a-f0-9]{40} ([A-Z])\d*$/.exec(fields[i++]);
    assert.ok(metadata, 'invalid Git diff metadata');
    const [, before, after, status] = metadata;
    const file = fields[i++];
    assert.ok(file, 'missing diff path');
    if (status === 'R' || status === 'C') assert.ok(fields[i++], 'missing rename/copy path');
    const allowed = !/[\u0000-\u001f\u007f-\u009f]/.test(file) && (
      ['README.md', 'AGENTS.md', 'CONTEXT.md', 'Orchestration.md'].includes(file) ||
      /^(?:docs\/governance|\.ai-coding)\/(?:[^/]+\/)*[^/]+\.md$/.test(file)
    );
    documentation &&= allowed && after === '100644' &&
      ((status === 'A' && before === '000000') || (status === 'M' && before === '100644'));
  }
  if (check) {
    assert.ok(documentation, 'focused check requires proven documentation scope');
    git('diff', '--check', base, 'HEAD', '--');
  }
  process.stdout.write(documentation ? 'documentation\n' : 'full\n');
} catch (error) {
  process.stderr.write(`CI scope failed: ${error.message}\n`);
  process.exitCode = 1;
}
