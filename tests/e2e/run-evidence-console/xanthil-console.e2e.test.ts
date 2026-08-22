import assert from 'node:assert/strict';
import test from 'node:test';

import { startConsole, stopConsole } from '../../fixtures/run-evidence-console/console-harness.ts';
import { createExactRun, hostileText, workspaceSnapshot, writeHostileMarkdown } from '../../fixtures/run-evidence-console/run-evidence-fixtures.ts';

test('TEST-REC-009 [AC-REC-001-01..04, AC-REC-005-04, AC-REC-007-01..02] serves one escaped loopback-only Run and shuts down on Ctrl+C', async () => {
  const fixture = await createExactRun();
  await writeHostileMarkdown(fixture.run);
  const before = await workspaceSnapshot(fixture.root);
  const console = await startConsole(fixture.run);
  try {
    assert.match(console.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    const page = await fetch(console.url);
    assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /verified_succeeded/);
    for (const label of ['SQL', 'Python', 'JSON', 'Markdown']) assert.match(html, new RegExp(`<pre[^>]*>[^<]*${label}`, 'i'), `${label} display is labelled in pre`);
    assert.doesNotMatch(html, /\[\s*\d+(?:\s*,\s*\d+){3,}\s*\]/, 'assets are not rendered as numeric byte arrays');
    assert.doesNotMatch(html, new RegExp(hostileText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, /&lt;(?:img|script)/i);
    assert.doesNotMatch(html, /<script|<form|<a\s|onerror=/i);
    const missing = await fetch(new URL('/scan', console.url));
    assert.equal(missing.status, 404);
    const post = await fetch(console.url, { method: 'POST' });
    assert.equal(post.status, 404);
  } finally {
    await stopConsole(console.child);
  }
  assert.deepEqual(await workspaceSnapshot(fixture.root), before, 'Ctrl+C closes only the listener');
});

test('TEST-REC-009 rejects missing, duplicate, and unknown arguments before host startup', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const args of [[], ['--run', '/tmp/a', '--run', '/tmp/b'], ['--unknown']]) {
    const result = spawnSync(process.execPath, ['apps/console/xanthil-console.ts', ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /http:\/\/127\.0\.0\.1:/);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /Cannot find module/);
  }
});
