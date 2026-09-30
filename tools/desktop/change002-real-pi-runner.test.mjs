import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewRealAuthorization } from './change002-real-pi.mjs';

// Model the browser boundary observed in host009: collapsed details have no
// visible innerText. The native companion exercises the same runner on Electron.
function reviewDialog({ payload = 'exact synthetic payload', text = 'Token Plan Credits 49152000 共享最多 8 次请求' } = {}) {
  let expanded = false;
  return {
    innerText: async () => text,
    locator: selector => {
      if (selector === 'details summary') return { click: async () => { expanded = !expanded; } };
      assert.equal(selector, 'details pre');
      return { innerText: async () => expanded ? payload : '' };
    },
    expanded: () => expanded,
  };
}

test('RUNNER-002 / AC-04: expand review before exact visible payload assertion', async () => {
  const dialog = reviewDialog();
  await reviewRealAuthorization(dialog, 'exact synthetic payload');
  assert.equal(dialog.expanded(), true);
});

test('RUNNER-003 / AC-04: mismatched reviewed payload and each budget disclosure remain refused', async () => {
  await assert.rejects(reviewRealAuthorization(reviewDialog(), 'different payload'));
  for (const text of ['49152000 共享最多 8 次请求', 'Token Plan Credits 共享最多 8 次请求', 'Token Plan Credits 49152000']) {
    await assert.rejects(reviewRealAuthorization(reviewDialog({ text }), 'exact synthetic payload'));
  }
});

test('RUNNER-004: startup diagnostics contain only a fixed check identifier, never raw errors', async () => {
  const secretLikeText = 'synthetic-secret-do-not-record';
  const dialog = reviewDialog();
  dialog.innerText = async () => { throw new Error(secretLikeText); };
  await assert.rejects(reviewRealAuthorization(dialog, 'exact synthetic payload'), error => {
    assert.deepEqual(error.diagnostic, { check: 'read-authorization', kind: 'CHECK_FAILED' });
    assert.equal(error.message, 'REAL_PI_REVIEW_FAILED');
    assert.equal(error.cause, undefined);
    assert.equal(JSON.stringify(error).includes(secretLikeText), false);
    assert.equal(error.stack.includes(secretLikeText), false);
    return true;
  });
});
