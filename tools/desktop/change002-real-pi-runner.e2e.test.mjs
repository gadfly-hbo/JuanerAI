// Host-only, offline regression of the exact review function used by the real
// runner. Never check confirmation or click Start; use a disposable fixture copy.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { _electron } from 'playwright-core';
import { reviewRealAuthorization } from './change002-real-pi.mjs';

const root = '/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record';
const planPath = process.env.JUANERAI_RUNNER_PLAN;
const directory = process.env.JUANERAI_RUNNER_EVIDENCE;
assert.ok(planPath && directory);
assert.ok(resolve(planPath).startsWith(root + '/') && resolve(directory).startsWith(root + '/'));
assert.equal(process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY, undefined);
assert.equal(process.env.JUANERAI_CASE_ASSISTANT_ACTIVATION, undefined);

test('RUNNER-005 / AC-04 native: real runner expands exact review, rejects mismatch, cancellation admits zero Attempts', async t => {
  const bytes = await readFile(planPath), plan = JSON.parse(bytes);
  await mkdir(directory);
  const project = join(directory, 'Project');
  await cp(plan.project, project, { recursive: true, force: false, errorOnExist: true });
  await mkdir(join(directory, 'empty-cwd'));
  const policy = { ...plan.policy, project_root: project, expires_at: new Date(Date.now() + 600000).toISOString() };
  const app = await _electron.launch({
    executablePath: join(plan.app, 'Contents/MacOS/Xanthil'),
    cwd: join(directory, 'empty-cwd'),
    args: ['--user-data-dir=' + join(directory, 'user-data')],
    env: { PATH: '/usr/bin:/bin', LANG: 'en_US.UTF-8', JUANERAI_CASE_ASSISTANT_ACTIVATION: JSON.stringify(policy), XIAOMI_TOKEN_PLAN_CN_API_KEY: 'offline-preview-placeholder' },
    timeout: 30000,
  });
  const child = app.process();
  // Register immediately and retain ChildProcess after Playwright disposes app.
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      let timer;
      try { await Promise.race([app.close(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('OWNED_CLOSE_TIMEOUT')), 5000); })]); }
      catch { child.kill('SIGTERM'); }
      finally { clearTimeout(timer); }
    }
    await writeFile(join(directory, 'process-exit.json'), JSON.stringify({ pid: child.pid, exit: child.exitCode, signal: child.signalCode, cleanup_is_not_recovery_proof: true }), { flag: 'wx' });
  });
  assert.equal(await app.evaluate(() => !!process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY || !!process.env.JUANERAI_CASE_ASSISTANT_ACTIVATION), false);
  await app.evaluate(({ dialog }, projectRoot) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [projectRoot] }); }, project);
  const page = await app.firstWindow();
  page.setDefaultTimeout(10000);
  await page.getByRole('button', { name: '选择项目', exact: true }).click();
  await page.locator('.ca-rail li button').first().click();
  const read = () => page.evaluate(async id => {
    const result = await window.xanthilCaseAssistantApi.request({ version: '1.0', operation: 'read', session_id: id });
    if (!result.ok) throw new Error('READ_REFUSED');
    return result.value;
  }, plan.session_id);
  const before = await read();
  for (const key of ['attempts', 'events', 'drafts', 'decisions', 'reports']) assert.equal(before[key].length, 0);
  async function openReview() {
    await page.getByLabel('Case Assistant 任务文本').fill(plan.task);
    await page.getByRole('button', { name: '继续此工作', exact: true }).click();
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.locator('details').evaluate(element => element.open), false);
    return dialog;
  }
  const dialog = await openReview();
  await reviewRealAuthorization(dialog, plan.policy.authorized_contexts[0]);
  assert.equal(await dialog.locator('details').evaluate(element => element.open), true);
  assert.equal(await dialog.locator('details pre').innerText(), plan.policy.authorized_contexts[0]);
  assert.equal(await dialog.getByRole('checkbox').first().isChecked(), false);
  await page.screenshot({ path: join(directory, 'expanded-review.png') });
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  assert.deepEqual(await read(), before);
  const mismatch = await openReview();
  await assert.rejects(reviewRealAuthorization(mismatch, plan.policy.authorized_contexts[0] + ' mismatch'), error => {
    assert.deepEqual(error.diagnostic, { check: 'exact-reviewed-payload', kind: 'CHECK_FAILED' });
    return true;
  });
  assert.equal(await mismatch.getByRole('checkbox').first().isChecked(), false);
  await mismatch.getByRole('button', { name: '取消', exact: true }).click();
  assert.deepEqual(await read(), before);
  await app.close();
  assert.equal(child.exitCode, 0);
  assert.equal(child.signalCode, null);
  await writeFile(join(directory, 'result.json'), JSON.stringify({ pass: true, plan_sha256: createHash('sha256').update(bytes).digest('hex'), expanded_exact_review: true, mismatch_refused: true, attempts: 0, events: 0, provider_requests: 0, raw_errors_recorded: false }), { flag: 'wx' });
});
