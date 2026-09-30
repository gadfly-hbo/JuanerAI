// Retain the accepted real CSV / SQLite / DuckDB / Python / relocation journey.
import './internal-install.e2e.test.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { _electron } from 'playwright-core';

const evidence = process.env.JUANERAI_INSTALL_E2E;
const installed = process.env.JUANERAI_INSTALL_APP;
assert.ok(evidence && installed);

test('INSTALL-CA-001 / AC-01/09: installed default composition links a real completed Case, refuses unconfigured Provider and reopens unchanged history', async t => {
  const project = join(evidence, 'Project');
  const directory = join(evidence, 'case-assistant');
  await mkdir(directory);
  const save = (name, value) => writeFile(join(directory, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  async function launch(label) {
    const userData = join(directory, label + '-user-data');
    await mkdir(userData);
    const options = { executablePath: join(installed, 'Contents/MacOS/Xanthil'), cwd: join(evidence, 'empty-cwd'), args: ['--user-data-dir=' + userData], env: { PATH: '/usr/bin:/bin', LANG: 'en_US.UTF-8', TMPDIR: join(evidence, 'tmp') }, chromiumSandbox: true };
    await save(label + '-launch.json', options);
    const app = await _electron.launch(options);
    const child = app.process();
    // Register ownership before any window or assertion; retain handle after close.
    t.after(async () => { if (child.exitCode === null && child.signalCode === null) await app.close(); });
    await app.evaluate(({ dialog }, root) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [root] }); }, project);
    const page = await app.firstWindow();
    page.setDefaultTimeout(10000);
    const observed = await app.evaluate(({ app }) => ({ cwd: process.cwd(), path: process.env.PATH, resources: process.resourcesPath, userData: app.getPath('userData') }));
    assert.equal(observed.cwd, options.cwd);
    assert.equal(observed.path, '/usr/bin:/bin');
    assert.equal(observed.resources, join(installed, 'Contents/Resources'));
    assert.equal(observed.userData, userData);
    await save(label + '-observed.json', observed);
    await page.getByRole('button', { name: '选择项目', exact: true }).click();
    return { app, child, page };
  }
  const first = await launch('first');
  await first.page.getByRole('button', { name: '专业模式', exact: true }).click();
  await first.page.getByRole('button', { name: 'Internal install synthetic', exact: true }).click();
  const stages = first.page.getByRole('navigation', { name: '专业模式阶段', exact: true });
  await stages.getByRole('button', { name: /循证分析/ }).click();
  await first.page.getByRole('button', { name: '接受本次分析结果', exact: true }).click();
  await first.page.getByText('本次结果已显式接受', { exact: true }).waitFor();
  await stages.getByRole('button', { name: /执行反馈/ }).click();
  await first.page.getByLabel('闭环路线', { exact: true }).selectOption('insufficient_evidence');
  await first.page.getByLabel('证据不足原因', { exact: true }).fill('Synthetic installation evidence does not establish a causal business effect.');
  await first.page.getByRole('button', { name: '保存闭环路线', exact: true }).click();
  await first.page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === '完成分析案例' && !b.disabled));
  await first.page.getByRole('button', { name: '完成分析案例', exact: true }).click();
  await first.page.getByText('分析案例已完成，已生成不可变最终报告；未执行外部行动。', { exact: true }).waitFor();
  const original = await readFile(join(project, '.xanthil/desktop/state.sqlite'));
  await first.page.getByRole('button', { name: '快速模式', exact: true }).click();
  await first.page.getByRole('button', { name: '关联一个 Case', exact: true }).first().click();
  await first.page.getByRole('dialog').getByRole('button', { name: 'Internal install synthetic', exact: true }).click();
  await first.page.getByRole('button', { name: '关联此 Case', exact: true }).click();
  await first.page.getByLabel('Case Assistant 任务文本').fill('Synthetic installed-app verification only.');
  await first.page.getByRole('button', { name: '发送', exact: true }).click();
  assert.match(await first.page.getByRole('dialog').innerText(), /模型未配置|请检查模型接入配置/);
  assert.equal(await first.page.getByRole('button', { name: '确认并开始', exact: true }).isEnabled(), false);
  await first.page.keyboard.press('Escape');
  await first.page.screenshot({ path: join(directory, 'linked-unconfigured.png') });
  const state = () => {
    const db = new DatabaseSync(join(project, '.xanthil/desktop/case-assistant.sqlite'), { readOnly: true });
    try { return Object.fromEntries(['sessions', 'attempts', 'events', 'drafts', 'decisions', 'reports'].map(table => [table, db.prepare('SELECT body FROM ' + table + ' ORDER BY id').all().map(row => JSON.parse(row.body))])); }
    finally { db.close(); }
  };
  const before = state();
  assert.equal(before.sessions.length, 1);
  for (const table of ['attempts', 'events', 'drafts', 'decisions', 'reports']) assert.equal(before[table].length, 0);
  await save('before-reopen.json', before);
  await first.app.close();
  const reopened = await launch('reopened');
  await reopened.page.locator('.ca-rail li button').first().click();
  await reopened.page.getByRole('button', { name: '专业模式', exact: true }).click();
  await reopened.page.locator('.ca-stage-six').waitFor();
  assert.match(await reopened.page.locator('.professional-stages [aria-current=step]').innerText(), /执行反馈/);
  assert.deepEqual(state(), before);
  assert.deepEqual(await readFile(join(project, '.xanthil/desktop/state.sqlite')), original);
  await reopened.page.screenshot({ path: join(directory, 'reopened-source.png') });
  await reopened.app.close();
  await save('after-reopen.json', state());
  await save('process-exits.json', [first, reopened].map(({ child }) => ({ pid: child.pid, code: child.exitCode, signal: child.signalCode })));
});

test('ACTIVATE-001/003 installed Main explicit synthetic activation shows Credits and exact payload; cancellation creates no Attempt',async t=>{
 const {createLocalCaseAssistantStore}=await import('../../adapters/storage-local/case-assistant.ts');const {createCaseAssistantApplication}=await import('../../packages/application/case-assistant.ts');const {randomUUID}=await import('node:crypto');const {realpath}=await import('node:fs/promises');
 const project=await realpath(join(evidence,'Project')),directory=join(evidence,'activation');await mkdir(directory);
 const db=new DatabaseSync(join(project,'.xanthil/desktop/case-assistant.sqlite'),{readOnly:true});const session=JSON.parse(db.prepare('SELECT body FROM sessions LIMIT 1').get().body);db.close();
 const store=createLocalCaseAssistantStore({projectRoot:project}),application=createCaseAssistantApplication({store,runtime:null,config:null,clock:()=>new Date()}),authorization=await application.prepare(session.id,'Synthetic activation preview only');await application.close();
 const policy={version:'1.0',provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',project_root:project,run_id:randomUUID(),expires_at:new Date(Date.now()+600000).toISOString(),authorized_contexts:[authorization.payload],user_messages:['Synthetic activation preview only'],tool_results:[null],source_revision:session.source.revision_id,requests:8};
 const app=await _electron.launch({executablePath:join(installed,'Contents/MacOS/Xanthil'),cwd:join(evidence,'empty-cwd'),args:['--user-data-dir='+join(directory,'user-data')],env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8',JUANERAI_CASE_ASSISTANT_ACTIVATION:JSON.stringify(policy),XIAOMI_TOKEN_PLAN_CN_API_KEY:'offline-preview-placeholder'},chromiumSandbox:true});
 const child=app.process();t.after(async()=>{if(child.exitCode===null&&child.signalCode===null)await app.close();});
 assert.equal(await app.evaluate(()=>!!process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY||!!process.env.JUANERAI_CASE_ASSISTANT_ACTIVATION),false,'Main removes capability/credential from child environment');
 await app.evaluate(({dialog},root)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[root]});},project);const page=await app.firstWindow();page.setDefaultTimeout(10000);await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.locator('.ca-rail li button').first().click();await page.getByLabel('Case Assistant 任务文本').fill('Synthetic activation preview only');await page.getByRole('button',{name:'发送',exact:true}).click();
 const dialog=page.getByRole('dialog'),text=await dialog.innerText();for(const visible of ['xiaomi-token-plan-cn / mimo-v2.6-pro','Token Plan Credits','保守上界，非账单','49152000','共享最多 8 次请求','12000','16384','2048','600 秒'])assert.ok(text.includes(visible),visible);await dialog.locator('details').last().locator('summary').click();assert.equal(await dialog.locator('details pre').innerText(),authorization.payload);await page.screenshot({path:join(directory,'authorization.png')});
 // No checkbox or Start interaction: this host check makes zero model requests.
 await dialog.getByRole('button',{name:'取消',exact:true}).click();const state=await store.readSession(session.id);assert.equal(state.attempts.length,0);assert.equal(state.events.length,0);await app.close();await writeFile(join(directory,'result.json'),JSON.stringify({pass:true,provider_calls:0,attempts:0,main_env_removed:true,exit:child.exitCode,signal:child.signalCode},null,2),{flag:'wx'});
});
