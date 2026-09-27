import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import test, { type TestContext } from 'node:test';

import { frozenProductionPackageAggregateSha256, launchFrozenProductionApp, readFrozenProductionPackageIdentity, saveScreenshotExclusive } from '../../fixtures/xanthil-desktop/desktop-e2e-harness.ts';
import { assertDesktopFixtureHealth, createTemporaryDesktopProject } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
import { createOfflineAssistanceRuntimeDouble, createRealDesktopApplication, desktopOwnerFromProjection, openConfirmedDesktopRevision, requiredExport, requiredRecord, revisionCommand } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { createSessionCommand, desktopTestIds } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';
import { randomUUID } from 'node:crypto';

async function launchedProfessionalCase(t: TestContext) {
  await assertDesktopFixtureHealth();
  const project = await createTemporaryDesktopProject();
  const attachment = {
    project_directory: project.projectRoot,
    members_file: fileURLToPath(new URL('../../fixtures/xanthil-desktop/members.csv', import.meta.url)),
    orders_file: fileURLToPath(new URL('../../fixtures/xanthil-desktop/orders.csv', import.meta.url)),
    export_file: join(project.projectRoot, 'exported-decision.html'),
  };
  const app = await launchFrozenProductionApp(attachment);
  let closed = false;
  const close = async () => { if (!closed) { closed = true; await app.close(); } };
  t.after(async () => { await close(); await project.dispose(); });
  return { app, attachment, close };
}

test('Screenshot evidence health: exclusive creation rejects an existing synthetic image without changing its bytes',async t=>{
  const save=saveScreenshotExclusive;
  const directory=process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY;assert.ok(directory,'the actual consumed evidence directory must be explicit');
  const {app}=await launchedProfessionalCase(t),page=await app.firstWindow(),path=join(directory,'exclusive-screenshot-control.png');
  await save(page,path);const original=await readFile(path);assert.deepEqual(original.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
  await assert.rejects(()=>save(page,path),{code:'EEXIST'});assert.deepEqual(await readFile(path),original,'collision must not truncate or replace the existing bytes');
});

test('F2 GUI unsupported Project explains format and a safe recovery without modifying its bytes [AC-XDESK-008-07]',async t=>{
  const project=await createTemporaryDesktopProject();t.after(()=>project.dispose());
  const directory=join(project.projectRoot,'.xanthil','desktop');await mkdir(directory,{recursive:true});const db=join(directory,'state.sqlite'),original=Buffer.from('Synthetic unrecognized database, preserve these bytes');await writeFile(db,original,{flag:'wx'});
  const app=await launchFrozenProductionApp({project_directory:project.projectRoot,members_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/members.csv',import.meta.url)),orders_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/orders.csv',import.meta.url)),export_file:join(project.projectRoot,'unused.html')});t.after(()=>app.close());
  const page=await app.firstWindow();page.setDefaultTimeout(5000);await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();const alert=page.getByRole('alert');await alert.waitFor();const text=await alert.innerText();
  await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY!,'f2-unsupported-project.png'));
  assert.deepEqual(await readFile(db),original);assert.match(text,/格式|版本/);assert.match(text,/支持.*项目|空目录/);assert.match(text,/未.*覆盖|不会.*覆盖/);assert.doesNotMatch(text,/\/Users\/|stack|SQLITE_NOTADB/);
});

test('F2 GUI durable Assistance terminal reasons give truthful preservation and manual recovery [AC-XDESK-008-07, AC-XDESK-006-08]',async t=>{
  type Method=(input:Record<string,unknown>)=>Promise<Record<string,unknown>>;
  for(const [code,reason,label]of [['PROVIDER_UNAVAILABLE','provider_failed','模型请求失败'],['CANCELLED','user_cancelled','已取消'],['DEADLINE_EXCEEDED','deadline_exceeded','时间上限'],['INTERRUPTED','interrupted','中断']] as const)await t.test(reason,async t=>{
    const project=await createTemporaryDesktopProject();t.after(()=>project.dispose());const base=createOfflineAssistanceRuntimeDouble(),runtime={...base,runtime:{...base.runtime,async executeAssistance(){throw Object.assign(new Error('synthetic private Runtime detail'),{code});}}},real=await createRealDesktopApplication(project.projectRoot,runtime),app=real.application;
    await requiredExport<Method>(app,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});let projection=await requiredExport<Method>(app,'createSession')(createSessionCommand());const owner=desktopOwnerFromProjection(projection),command=()=>revisionCommand(owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version));
    const preview=await requiredExport<Method>(app,'prepareAssistanceDisclosure')({contract_version:'1.0',...owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,action_kind:'organize_question',requested_provider:'offline-test',requested_model:'deterministic'});
    projection=await requiredExport<Method>(app,'decideAssistanceDisclosure')({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});projection=await requiredExport<Method>(app,'startAssistance')({...command(),disclosure_id:(projection.disclosures as Record<string,unknown>[])[0].disclosure_id});
    for(let n=0;n<100&&(projection.attempts as Record<string,unknown>[]).some(a=>a.status==='Running');n++){await new Promise(r=>setTimeout(r,10));projection=await requiredExport<Method>(app,'readProjection')(owner);}assert.equal((projection.attempts as Record<string,unknown>[])[0].terminal_reason,reason);assert.deepEqual(projection.assistance_drafts,[]);
    const launched=await launchFrozenProductionApp({project_directory:project.projectRoot,members_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/members.csv',import.meta.url)),orders_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/orders.csv',import.meta.url)),export_file:join(project.projectRoot,'unused.html')});t.after(()=>launched.close());const page=await launched.firstWindow();page.setDefaultTimeout(5000);
    await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.getByRole('button',{name:String(requiredRecord(projection.session,'session').display_name),exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();const history=page.getByRole('list',{name:'辅助请求历史'});await history.scrollIntoViewIfNeeded();const text=await history.innerText();await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY!,`f2-assistance-${reason}.png`));
    assert.ok(text.includes(label));for(const section of ['原因：','未发生：','保留：','下一步：'])assert.ok(text.includes(section));assert.match(text,/不能撤回/);assert.match(text,/手工/);assert.doesNotMatch(text,/synthetic private|未发送|未创建 Attempt/);assert.equal(await page.getByRole('button',{name:'保存案例字段',exact:true}).isEnabled(),true);
  });
});

test('F2 GUI real cancelled and deadline Run terminals explain failed work without a false Finding [AC-XDESK-008-07]',async t=>{
  type Method=(input:Record<string,unknown>)=>Promise<Record<string,unknown>>;
  for(const [reason,label]of [['user_cancelled','已取消'],['deadline_exceeded','时间上限']] as const)await t.test(reason,async t=>{
    const project=await createTemporaryDesktopProject();t.after(()=>project.dispose());const setup=await openConfirmedDesktopRevision(project.projectRoot),app=setup.application,owner=setup.owner;let projection=await requiredExport<Method>(app,'startAnalysis')({...revisionCommand(owner,randomUUID(),String(requiredRecord(setup.projection.revision,'revision').row_version)),confirmation_id:setup.confirmationId});const run=(projection.runs as Record<string,unknown>[]).at(-1)!;
    if(reason==='user_cancelled')await requiredExport<Method>(app,'cancelAnalysis')({...revisionCommand(owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version)),run_id:run.run_id});else setup.deadlines.runDue(Date.parse(String(run.deadline_at)));
    for(let n=0;n<300&&(projection.runs as Record<string,unknown>[]).some(r=>r.status==='Running');n++){await new Promise(r=>setTimeout(r,20));projection=await requiredExport<Method>(app,'readProjection')(owner);}assert.equal((projection.runs as Record<string,unknown>[]).at(-1)!.terminal_reason,reason);assert.deepEqual(projection.findings,[]);assert.deepEqual(projection.acceptances,[]);
    const launched=await launchFrozenProductionApp({project_directory:project.projectRoot,members_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/members.csv',import.meta.url)),orders_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/orders.csv',import.meta.url)),export_file:join(project.projectRoot,'unused.html')});t.after(()=>launched.close());const page=await launched.firstWindow();page.setDefaultTimeout(5000);
    await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.getByRole('button',{name:String(requiredRecord(projection.session,'session').display_name),exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/本地处理/}).click();const history=page.getByRole('region',{name:'确定性本地分析',exact:true}).getByRole('list');await history.scrollIntoViewIfNeeded();const text=await history.innerText();await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY!,`f2-run-${reason}.png`));assert.ok(text.includes(label));for(const section of ['原因：','未发生：','保留：','下一步：'])assert.ok(text.includes(section));assert.match(text,/Finding/);assert.match(text,/不会自动重试/);assert.match(text,/确认快照/);
  });
});

test('U4 GUI exact disclosure refusal and unavailable model preserve manual editing in the production app [AC-XDESK-006-01, AC-XDESK-006-04, AC-XDESK-006-05, AC-XDESK-010-06]',async t=>{
  const {app,attachment}=await launchedProfessionalCase(t),page=await app.firstWindow();page.setDefaultTimeout(5000);
  await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();
  const longContext='Synthetic context only. '.repeat(80);
  await page.getByLabel('分析案例名称',{exact:true}).fill('Synthetic Assistance case');await page.getByLabel('复购问题',{exact:true}).fill('  Preserve exact user question  ');await page.getByLabel('业务背景',{exact:true}).fill(longContext);await page.getByLabel('假设显示名称',{exact:true}).fill('Reviewed hypothesis');await page.getByRole('button',{name:'创建分析',exact:true}).click();await page.getByText('会话已创建',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'整理问题（辅助草稿）',exact:true}).count(),1,'healthy saved Session must expose its optional disclosed Assistance action');
  const readCounts=()=>{const db=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{return{disclosures:db.prepare('SELECT count(*) n FROM model_disclosures').get()?.n,attempts:db.prepare('SELECT count(*) n FROM assistance_attempts').get()?.n,drafts:db.prepare('SELECT count(*) n FROM assistance_drafts').get()?.n};}finally{db.close();}};
  await page.getByLabel('请求的提供方',{exact:true}).fill('offline-test');await page.getByLabel('请求的模型',{exact:true}).fill('deterministic');
  const before=readCounts();await page.getByRole('button',{name:'整理问题（辅助草稿）',exact:true}).click();const dialog=page.getByRole('dialog',{name:'逐次模型披露',exact:true});await dialog.waitFor();
  const payload=await dialog.getByLabel('精确发送载荷',{exact:true}).textContent();assert.equal(JSON.parse(payload!).question_text,'  Preserve exact user question  ');assert.equal(JSON.parse(payload!).business_context,longContext);assert.equal(await dialog.getByLabel('载荷 SHA-256',{exact:true}).textContent(),createHash('sha256').update(payload!).digest('hex'));assert.deepEqual(readCounts(),before);
  assert.equal(await dialog.getByRole('button',{name:'确认此次披露',exact:true}).isEnabled(),false);
  for(const viewport of [{width:1440,height:900},{width:1366,height:768}]){await page.setViewportSize(viewport);const refuse=dialog.getByRole('button',{name:'拒绝此次发送',exact:true});await refuse.scrollIntoViewIfNeeded();const rect=await refuse.boundingBox();assert.ok(rect&&rect.y>=0&&rect.y+rect.height<=viewport.height,'long disclosure remains scrollable to its actual refusal control');assert.equal(await dialog.getByLabel('精确发送载荷',{exact:true}).textContent(),payload);await refuse.focus();await page.keyboard.press('Tab');assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,`u4-disclosure-${viewport.width}.png`));}
  await dialog.getByRole('button',{name:'拒绝此次发送',exact:true}).click();await page.getByText('已拒绝；未创建 Attempt，继续手工编辑。',{exact:true}).waitFor();assert.deepEqual(readCounts(),{disclosures:1,attempts:0,drafts:0});assert.equal(await page.getByRole('button',{name:'整理问题（辅助草稿）',exact:true}).evaluate(el=>el===document.activeElement),true);
  await page.getByRole('button',{name:'整理问题（辅助草稿）',exact:true}).click();await dialog.getByLabel('我已检查自由文本，不含不应发送的敏感内容',{exact:true}).check();await dialog.getByRole('button',{name:'确认此次披露',exact:true}).click();await page.getByText('已记录披露；尚未发送。',{exact:true}).waitFor();await page.getByRole('button',{name:'发送本次已确认请求',exact:true}).click();await page.getByRole('alert').filter({hasText:/不可用|未配置/}).first().waitFor();assert.deepEqual(readCounts(),{disclosures:2,attempts:0,drafts:0});assert.equal(await page.getByRole('button',{name:'保存案例字段',exact:true}).isEnabled(),true);
});

test('U4 GUI persisted untrusted question evidence and candidate Drafts require visible edit adopt or reject and survive reopen [AC-XDESK-006-07, AC-XDESK-012-04]',async t=>{
  type Method=(input:Record<string,unknown>)=>Promise<Record<string,unknown>>;
  for(const action of ['organize_question','explain_evidence','draft_candidates'])await t.test(action,async t=>{
    const project=await createTemporaryDesktopProject();t.after(()=>project.dispose());
    let app:Record<string,unknown>,projection:Record<string,unknown>,owner:Record<string,unknown>;
    if(action==='organize_question'){
      const setup=await createRealDesktopApplication(project.projectRoot);app=setup.application;await requiredExport<Method>(app,'openProject')({contract_version:'1.0',command_id:desktopTestIds.openProjectCommand,proposed_project_id:desktopTestIds.project,display_name:'Synthetic Project'});projection=await requiredExport<Method>(app,'createSession')(createSessionCommand());owner=desktopOwnerFromProjection(projection);
    }else{
      const setup=await openConfirmedDesktopRevision(project.projectRoot);app=setup.application;owner=setup.owner;projection=await requiredExport<Method>(app,'startAnalysis')({...revisionCommand(owner,randomUUID(),String(requiredRecord(setup.projection.revision,'revision').row_version)),confirmation_id:setup.confirmationId});
      for(let n=0;n<300&&(projection.runs as Record<string,unknown>[]).some(r=>r.status==='Running');n++){await new Promise(r=>setTimeout(r,20));projection=await requiredExport<Method>(app,'readProjection')(owner);}assert.equal(requiredRecord(projection.revision,'revision').state,'Review');
      if(action==='draft_candidates')projection=await requiredExport<Method>(app,'acceptFinding')({...revisionCommand(owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version)),finding_id:(projection.findings as Record<string,unknown>[])[0].finding_id});
    }
    const command=()=>revisionCommand(owner,randomUUID(),String(requiredRecord(projection.revision,'revision').row_version));
    for(let i=0;i<2;i++){
      const preview=await requiredExport<Method>(app,'prepareAssistanceDisclosure')({contract_version:'1.0',...owner,expected_row_version:requiredRecord(projection.revision,'revision').row_version,action_kind:action,requested_provider:'offline-test',requested_model:'deterministic'});
      projection=await requiredExport<Method>(app,'decideAssistanceDisclosure')({...command(),preview_token:preview.preview_token,payload_sha256:preview.payload_sha256,decision:'accepted',free_text_confirmed:true});
      projection=await requiredExport<Method>(app,'startAssistance')({...command(),disclosure_id:(projection.disclosures as Record<string,unknown>[]).at(-1)!.disclosure_id});
      for(let n=0;n<100&&(projection.attempts as Record<string,unknown>[]).some(a=>a.status==='Running');n++){await new Promise(r=>setTimeout(r,10));projection=await requiredExport<Method>(app,'readProjection')(owner);}
    }
    assert.equal((projection.assistance_drafts as unknown[]).length,2);assert.equal((projection.attempts as Record<string,unknown>[]).every(a=>a.status==='Succeeded'),true);
    // Each real Store operation closes its SQLite connection; all Runtime work has settled before launch.
    const attachment={project_directory:project.projectRoot,members_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/members.csv',import.meta.url)),orders_file:fileURLToPath(new URL('../../fixtures/xanthil-desktop/orders.csv',import.meta.url)),export_file:join(project.projectRoot,'export.html')};
    const launched=await launchFrozenProductionApp(attachment);let page=await launched.firstWindow();page.setDefaultTimeout(5000);
    const stage=action==='organize_question'?'新建分析':action==='explain_evidence'?'循证分析':'执行反馈',title=action==='organize_question'?'问题草稿':action==='explain_evidence'?'证据解释草稿':'候选草稿';
    const open=async()=>{await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.getByRole('button',{name:String(requiredRecord(projection.session,'session').display_name),exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:new RegExp(stage)}).click();};
    try{
      await open();assert.equal(await page.getByRole('region',{name:new RegExp(`^${title} · 待审`)}).count(),2,'real pending Drafts need visible editable consumers, not direct IPC adoption');
      assert.equal(await page.getByRole('contentinfo',{name:'Status',exact:true}).getByText('模型可见边界：按逐次披露记录',{exact:true}).count(),1,'persisted model disclosures cannot be summarized as no model-visible data');
      await page.getByRole('button',{name:'辅助抽屉',exact:true}).click();
      assert.equal(await page.getByRole('complementary',{name:'辅助抽屉内容',exact:true}).getByText(/2 项逐次披露/).count(),1,'global inspector identifies the actual persisted disclosure count, not an empty boundary');
      await page.getByRole('button',{name:'关闭辅助抽屉',exact:true}).click();
      const drafts=page.getByRole('region',{name:new RegExp(`^${title} · 待审`)}),first=drafts.nth(0);
      console.log('U4 pending Draft accessible labels:',JSON.stringify(await first.locator('label').allTextContents()));
      if(action==='organize_question')await first.getByLabel('草稿复购问题',{exact:true}).fill('  GUI edited question  ');
      else if(action==='explain_evidence')await first.getByLabel('草稿证据解释',{exact:true}).fill('GUI edited evidence, not causal proof');
      else await first.getByRole('group',{name:'草稿候选 1',exact:true}).getByLabel('草稿候选标题',{exact:true}).fill('GUI edited candidate');
      await first.getByRole('button',{name:'采用此草稿',exact:true}).click();await page.getByText('草稿已采用；没有接受 Finding 或完成案例。',{exact:true}).waitFor();
      await page.getByRole('region',{name:new RegExp(`^${title} · 待审`)}).getByRole('button',{name:'拒绝此草稿',exact:true}).click();await page.getByText('草稿已拒绝；手工字段保持不变。',{exact:true}).waitFor();
      for(const viewport of [{width:1440,height:900},{width:1366,height:768}]){await page.setViewportSize(viewport);if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,`u4-${action}-${viewport.width}.png`));}
    }finally{await launched.close();}
    const reopened=await launchFrozenProductionApp(attachment);page=await reopened.firstWindow();page.setDefaultTimeout(5000);
    try{await open();assert.equal(await page.getByRole('region',{name:new RegExp(`^${title} · 已采用`)}).count(),1);assert.equal(await page.getByRole('region',{name:new RegExp(`^${title} · 已拒绝`)}).count(),1);if(action==='organize_question')assert.equal(await page.getByLabel('复购问题',{exact:true}).inputValue(),'  GUI edited question  ');if(action==='explain_evidence')assert.equal(await page.getByLabel('手工证据解释（不改变计算结果）',{exact:true}).inputValue(),'GUI edited evidence, not causal proof');if(action==='draft_candidates')assert.equal(await page.getByRole('group',{name:'候选 1',exact:true}).getByLabel('候选标题',{exact:true}).inputValue(),'GUI edited candidate');}finally{await reopened.close();}
  });
});

async function completeProfessionalJourney(page: Awaited<ReturnType<Awaited<ReturnType<typeof launchFrozenProductionApp>>['firstWindow']>>,route:'candidate_comparison'|'insufficient_evidence'='candidate_comparison',stopAtReview=false) {
  page.setDefaultTimeout(5000);
  await page.getByRole('button', { name: '专业模式' }).click();
  const professionalStages = page.getByRole('navigation', { name: '专业模式阶段', exact: true });
  for (const [index, stage] of ['新建分析', '数据准备', '本地处理', '循证分析', '报告', '执行反馈'].entries()) await professionalStages.getByRole('button', { name: new RegExp(`^${index + 1}\\s*${stage}$`, 'u') }).waitFor();
  await page.getByRole('button',{name:'选择项目',exact:true}).click();
  await page.getByLabel('分析案例名称').fill('Synthetic repurchase decision');
  await page.getByLabel('复购问题').fill('Why did repurchase decline?');
  await page.getByLabel('假设显示名称',{exact:true}).fill('Current repurchase rate is lower');
  await page.getByRole('button', { name: /创建分析|开始分析/ }).click();
  await page.getByText('会话已创建',{exact:true}).waitFor();await professionalStages.getByRole('button',{name:/数据准备/}).click();
  await page.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).click();await page.getByText('请显式选择映射、期间与有效状态。',{exact:true}).waitFor();
  for(const [label,value] of [['成员 ID 列','member_id'],['成员分组列','member_group'],['订单 ID 列','order_id'],['订单成员 ID 列','order_member_id'],['支付时间列','paid_at'],['金额列','amount'],['订单状态列','status'],['币种列','currency']])await page.getByLabel(label,{exact:true}).selectOption(value);
  for(const [label,value] of [['对比期开始','2026-01-01'],['对比期结束（不含）','2026-01-29'],['当前期开始','2026-02-01'],['当前期结束（不含）','2026-03-01'],['有效状态（每行一个精确值）','paid']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByRole('button',{name:'核对数据范围',exact:true}).click();await page.getByText('数据范围已核对，请逐项确认。',{exact:true}).waitFor();
  const treatments=page.locator('.issue-treatment select');for(let index=0;index<await treatments.count();index++)await treatments.nth(index).selectOption({index:1});
  for(const label of ['我有权将这两份本地数据用于本次分析','我已核对每项数据问题的数量与处理方式','我确认映射、期间、有效状态与分析定义'])await page.getByLabel(label,{exact:true}).check();
  await page.getByRole('button',{name:'确认数据快照',exact:true}).click();try{await page.getByText('不可变数据快照已确认',{exact:true}).waitFor();}catch(error){console.log('U3 confirmation actual state:',await page.locator('body').innerText());throw error;}
  await professionalStages.getByRole('button',{name:/本地处理/}).click();
  await page.getByRole('button', { name: /开始本地处理|开始计算/ }).click();
  await page.getByText('独立复核完成 · Review',{exact:true}).waitFor({timeout:30000});await professionalStages.getByRole('button',{name:/循证分析/}).click();await page.getByRole('table',{name:'两期复购指标',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'接受本次分析结果',exact:true}).count(),1,'healthy committed Finding needs the explicit U3 acceptance action');
  if(stopAtReview)return;
  await page.getByRole('button', { name: '接受本次分析结果',exact:true }).click();await page.getByText('此 Finding 已有显式接受记录',{exact:true}).waitFor();
  assert.equal(await page.getByText('结果尚未接受 · 没有决策闭环或外部行动。',{exact:true}).count(),0,'accepted Finding must not retain a contradictory constant unaccepted label');
  await page.getByLabel('手工证据解释（不改变计算结果）',{exact:true}).fill('Manual comparison; association is not a causal claim.');await page.getByRole('button',{name:'保存证据解释',exact:true}).click();
  await page.getByText('表单已保存；保存不等于接受或完成。',{exact:true}).waitFor();
  await professionalStages.getByRole('button',{name:/执行反馈/}).click();assert.equal(await page.getByRole('button',{name:'完成分析案例',exact:true}).isEnabled(),false);
  await page.getByLabel('闭环路线',{exact:true}).selectOption(route);
  if(route==='candidate_comparison'){
    await page.getByRole('button',{name:'新增候选',exact:true}).click();const first=page.getByRole('group',{name:'候选 1',exact:true});
    for(const [label,value]of [['候选标题','Investigate mechanism'],['证据依据','Measured repeat-rate comparison'],['风险或反证','Association is not causation'],['适用条件','Confirmed synthetic periods'],['后续验证指标','Independent repeat-rate replication']])await first.getByLabel(label,{exact:true}).fill(value);
    assert.equal(await page.getByRole('button',{name:'保存闭环路线',exact:true}).isEnabled(),false);
    await page.getByRole('button',{name:'复制候选 1',exact:true}).click();await page.getByRole('group',{name:'候选 2',exact:true}).getByLabel('候选标题',{exact:true}).fill('Retain present interpretation');
    await page.getByLabel('首选候选（可不选）',{exact:true}).selectOption({index:1});assert.equal(await page.getByRole('button',{name:'保存闭环路线',exact:true}).isEnabled(),false);await page.getByLabel('首选理由',{exact:true}).fill('A testable comparison is available.');
  }else await page.getByLabel('证据不足原因',{exact:true}).fill('No controlled causal counterfactual is available.');
  await page.getByRole('button',{name:'保存闭环路线',exact:true}).click();await page.getByRole('button',{name:'完成分析案例',exact:true}).waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='完成分析案例'&&!b.disabled));
  await page.getByRole('button', { name: '完成分析案例' }).click();
  await page.getByText('分析案例已完成，已生成不可变最终报告；未执行外部行动。',{exact:true}).waitFor();await professionalStages.getByRole('button',{name:/报告/}).click();
}

test('U2 GUI: real double CSV review confirmation and local analysis publish one unaccepted Finding [AC-XDESK-001-04, AC-XDESK-004-05, AC-XDESK-005-07]', async t => {
  const {app,attachment,close}=await launchedProfessionalCase(t);const page=await app.firstWindow();page.setDefaultTimeout(5000);
  assert.deepEqual(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.getContentSize()),[1366,768],'normal Main, not a test resize, supplies the approved initial content viewport');
  assert.deepEqual(await page.evaluate(()=>({width:innerWidth,height:innerHeight})),{width:1366,height:768});
  await page.getByRole('button',{name:'专业模式',exact:false}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();
  await page.getByLabel('分析案例名称',{exact:true}).fill('Synthetic U2 decision');await page.getByLabel('复购问题',{exact:true}).fill('Is current repurchase lower?');await page.getByLabel('假设显示名称',{exact:true}).fill('Current repurchase rate is lower');await page.getByRole('button',{name:'创建分析',exact:true}).click();await page.getByText('会话已创建',{exact:true}).waitFor();
  await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/数据准备/}).click();
  assert.equal(await page.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).count(),1,'healthy U1 Session must expose the approved import action for U2');
  await page.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).click();await page.getByText('请显式选择映射、期间与有效状态。',{exact:true}).waitFor();
  console.log('U2 import accessible labels:',JSON.stringify(await page.locator('label').allTextContents()));
  for(const [label,value] of [['成员 ID 列','member_id'],['成员分组列','member_group'],['订单 ID 列','order_id'],['订单成员 ID 列','order_member_id'],['支付时间列','paid_at'],['金额列','amount'],['订单状态列','status'],['币种列','currency']])await page.getByLabel(label,{exact:true}).selectOption(value);
  for(const [label,value] of [['对比期开始','2026-01-01'],['对比期结束（不含）','2026-01-29'],['当前期开始','2026-02-01'],['当前期结束（不含）','2026-03-01'],['有效状态（每行一个精确值）','paid']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByRole('button',{name:'核对数据范围',exact:true}).click();await page.getByText('数据范围已核对，请逐项确认。',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'确认数据快照',exact:true}).isEnabled(),false);
  const treatments=page.locator('.issue-treatment select');for(let index=0;index<await treatments.count();index++)await treatments.nth(index).selectOption({index:1});
  await page.getByLabel('我有权将这两份本地数据用于本次分析',{exact:true}).check();await page.getByLabel('我已核对每项数据问题的数量与处理方式',{exact:true}).check();await page.getByLabel('我确认映射、期间、有效状态与分析定义',{exact:true}).check();
  try{await page.getByLabel('有效状态（每行一个精确值）',{exact:true}).fill('paid\nother');}catch(error){console.log('U2 consent-change state:',await page.locator('body').innerText());throw error;}
  assert.equal(await page.getByRole('button',{name:'确认数据快照',exact:true}).isEnabled(),false,'changing configuration invalidates the evaluated preview, rather than silently retaining consent');
  await page.getByLabel('有效状态（每行一个精确值）',{exact:true}).fill('paid');
  await page.getByRole('button',{name:'核对数据范围',exact:true}).click();await page.getByText('数据范围已核对，请逐项确认。',{exact:true}).waitFor();
  for(const label of ['我有权将这两份本地数据用于本次分析','我已核对每项数据问题的数量与处理方式','我确认映射、期间、有效状态与分析定义'])assert.equal(await page.getByLabel(label,{exact:true}).isChecked(),false);
  for(let index=0;index<await treatments.count();index++)await treatments.nth(index).selectOption({index:1});
  for(const label of ['我有权将这两份本地数据用于本次分析','我已核对每项数据问题的数量与处理方式','我确认映射、期间、有效状态与分析定义'])await page.getByLabel(label,{exact:true}).check();
  await page.getByRole('button',{name:'确认数据快照',exact:true}).click();try{await page.getByText('不可变数据快照已确认',{exact:true}).waitFor();}catch(error){console.log('U2 confirmation visible state:',await page.locator('body').innerText());throw error;}
  await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/本地处理/}).click();await page.getByRole('button',{name:'开始本地处理',exact:true}).click();
  const status=page.getByRole('contentinfo',{name:'Status',exact:true});
  await status.getByText('运行状态：本地处理中',{exact:true}).waitFor();
  const activeDb=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});
  let activeRun:unknown;try{const row=activeDb.prepare('SELECT run_id,status FROM analysis_runs').get();assert.equal(row?.status,'Running');activeRun=row?.run_id;}finally{activeDb.close();}
  await page.getByRole('button',{name:'快速模式',exact:true}).click();
  await page.getByRole('button',{name:'辅助抽屉',exact:true}).click();
  await page.getByRole('button',{name:'关闭辅助抽屉',exact:true}).click();
  const observedDb=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{const observed=observedDb.prepare('SELECT run_id,status FROM analysis_runs').get();console.log('AC001-04 after mode/drawer:',JSON.stringify({run:observed,status:await status.innerText()}));assert.equal(observed?.run_id,activeRun);assert.ok(['Running','Succeeded'].includes(String(observed?.status)));}finally{observedDb.close();}
  const returnToWork=page.getByRole('button',{name:'返回后台工作 · 本地处理',exact:true});
  assert.equal(await returnToWork.isEnabled(),true,'same-Session work keeps its navigation point even if it completes between observation and click');
  await returnToWork.click();
  console.log('AC001-04 after return click:',JSON.stringify({body:await page.locator('body').innerText(),pressed:await page.getByRole('button',{name:'专业模式',exact:true}).getAttribute('aria-pressed'),navigationCount:await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).count()}));
  if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,'u4-return-after-click.png'));
  await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/本地处理/}).waitFor();
  await page.getByText('独立复核完成 · Review',{exact:true}).waitFor({timeout:30000});
  const completedDb=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.deepEqual(completedDb.prepare('SELECT run_id,status FROM analysis_runs').all().map(x=>({...x})),[{run_id:activeRun,status:'Succeeded'}]);assert.equal(completedDb.prepare('SELECT mode FROM product_sessions').get()?.mode,'professional');}finally{completedDb.close();}
  await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/循证分析/}).click();await page.getByText('Rejected',{exact:true}).waitFor();
  await page.getByRole('table',{name:'两期复购指标',exact:true}).waitFor();
  assert.match(await page.getByRole('table',{name:'两期复购指标',exact:true}).innerText(),/活跃成员数.*复购成员数.*复购率.*复购收入/su);
  assert.match(await page.getByRole('table',{name:'两期复购指标',exact:true}).innerText(),/分母|活跃成员/u);
  await page.getByRole('table',{name:'指标变化',exact:true}).waitFor();
  await page.getByRole('heading',{name:'分组贡献（M2）',exact:true}).waitFor();
  await page.getByText('当前期复购率未低于对比期；本次证据不支持 H1。',{exact:true}).first().waitFor();
  assert.equal(await page.getByRole('button',{name:'接受本次分析结果',exact:true}).count(),1,'U3 activation exposes an explicit action, but U2 computation still never accepts automatically');
  const db=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.equal(db.prepare('SELECT COUNT(*) n FROM findings').get()?.n,1);assert.equal(db.prepare('SELECT COUNT(*) n FROM finding_acceptances').get()?.n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM assistance_attempts').get()?.n,0);}finally{db.close();}
  const visible=await page.locator('body').innerText();assert.doesNotMatch(visible,/cmp-001|cur-001|North|South|\/Users\//);
  assert.equal(await page.getByText('没有本地处理记录',{exact:true}).count(),0,'committed real Run must appear in the persistent run rail rather than a stale empty claim');
  for(const viewport of [{width:1440,height:900},{width:1366,height:768}]){
    await page.setViewportSize(viewport);await page.getByRole('table',{name:'两期复购指标',exact:true}).scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'business evidence does not force whole-window horizontal scrolling');
    if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,`u2-finding-${viewport.width}.png`));
  }
  if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,'u2-review-finding.png'),true);
  await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/报告/}).click();
  const reportBody=page.getByRole('region',{name:'报告草稿正文',exact:true});await reportBody.waitFor();
  const reportText=await reportBody.textContent()??'';
  for(const [role,path] of [['members',attachment.members_file],['orders',attachment.orders_file]])assert.ok(reportText.includes(`${role} SHA-256: ${createHash('sha256').update(await readFile(path)).digest('hex')}`));
  assert.match(reportText,/未接受/u);
  assert.equal(await reportBody.locator('details[open]').count(),0,'technical source/metric blocks are secondary without removing their original text');
  for(const viewport of [{width:1440,height:900},{width:1366,height:768}]){
    await page.setViewportSize(viewport);await reportBody.scrollIntoViewIfNeeded();
    if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,`u2-report-${viewport.width}.png`));
  }
  const evidenceLinks=page.getByRole('navigation',{name:'报告证据回链',exact:true}).getByRole('link');
  assert.equal(await evidenceLinks.count(),4);
  const href=await evidenceLinks.first().getAttribute('href');assert.match(href??'',/^#evidence-[a-f0-9-]+-duckdb-result$/u);
  await evidenceLinks.first().focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator(href!).count(),1);assert.equal(await page.locator(href!).evaluate(element=>element===document.activeElement),true,'local evidence link moves keyboard focus to the actual read-only evidence target');
  assert.equal(await page.locator('iframe,object,embed').count(),0,'report content never executes HTML');
  if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,'u2-report-evidence.png'),true);
  await close();
  let restarted=await launchFrozenProductionApp(attachment);
  try{
    let reopened=await restarted.firstWindow();reopened.setDefaultTimeout(5000);
    await reopened.getByRole('button',{name:'专业模式',exact:false}).click();await reopened.getByRole('button',{name:'选择项目',exact:true}).click();await reopened.getByRole('button',{name:'Synthetic U2 decision',exact:true}).click();await reopened.getByText('会话已打开',{exact:true}).waitFor();
    assert.equal(await reopened.getByRole('button',{name:'保存案例字段',exact:true}).isEnabled(),false);
    await reopened.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/循证分析/}).click();await reopened.getByText('Rejected',{exact:true}).waitFor();
    // After a proven clean reopen, damage only a referenced synthetic report while the owned app is closed.
    await restarted.close();
    const reportDb=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});
    let reportPath:string;try{reportPath=join(attachment.project_directory,String(reportDb.prepare('SELECT markdown_locator FROM report_versions').get()?.markdown_locator));}finally{reportDb.close();}
    const damagedBytes=Buffer.from('synthetic corrupt report: <script>window.__untrustedReport=true</script>');await writeFile(reportPath,damagedBytes);
    restarted=await launchFrozenProductionApp(attachment);reopened=await restarted.firstWindow();reopened.setDefaultTimeout(5000);
    await reopened.getByRole('button',{name:'专业模式',exact:false}).click();await reopened.getByRole('button',{name:'选择项目',exact:true}).click();await reopened.getByRole('button',{name:'Synthetic U2 decision',exact:true}).click();await reopened.getByText('会话已打开',{exact:true}).waitFor();
    await reopened.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/报告/}).click();
    await reopened.getByText('报告或引用证据损坏，正文不可用；原始字节保留，不使用未经核验的内容。',{exact:true}).waitFor();
    assert.equal(await reopened.evaluate(()=>Reflect.get(window,'__untrustedReport')),undefined);
    assert.equal(await reopened.getByRole('region',{name:'报告草稿正文',exact:true}).count(),0);
    await reopened.getByRole('button',{name:'创建新 Draft 修订',exact:true}).click();await reopened.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).waitFor();
    assert.equal(await reopened.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).isEnabled(),true);assert.equal(await reopened.getByText('不可变数据快照已确认',{exact:true}).count(),0);
    await reopened.getByRole('button',{name:'查看上一修订',exact:true}).click();await reopened.getByRole('navigation',{name:'案例修订历史',exact:true}).getByText(/^历史修订 · 只读 · 修订 1 · Review$/u).waitFor();
    await reopened.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/循证分析/}).click();await reopened.getByRole('table',{name:'两期复购指标',exact:true}).waitFor();
    assert.equal(await reopened.getByRole('button',{name:'创建新 Draft 修订',exact:true}).isEnabled(),false);
    await reopened.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/数据准备/}).click();
    assert.equal(await reopened.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).count(),0,'the historical confirmed snapshot has no editable import action');
    if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(reopened,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,'u2-historical-revision.png'),true);
    await reopened.getByRole('button',{name:'返回当前修订',exact:true}).click();assert.equal(await reopened.getByRole('button',{name:'选择成员与订单 CSV',exact:true}).isEnabled(),true);
    assert.deepEqual(await readFile(reportPath),damagedBytes,'clean Draft and historical navigation preserve damaged original report bytes');
    const db=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.deepEqual(db.prepare('SELECT state FROM case_revisions ORDER BY revision_sequence').all().map(row=>row.state),['Review','Draft']);assert.equal(db.prepare('SELECT count(*) n FROM findings').get()?.n,1);assert.equal(db.prepare('SELECT count(*) n FROM analysis_runs').get()?.n,1);}finally{db.close();}
  }finally{await restarted.close();}
});

test('U1 Session: packaged professional workspace creates saves and reopens the real committed Session [AC-XDESK-002-01, AC-XDESK-002-06]', async (t) => {
  const { app, attachment, close } = await launchedProfessionalCase(t);
  const page = await app.firstWindow(); page.setDefaultTimeout(5000);
  page.on('pageerror', error => console.error('U1 Session renderer error:', error.message));
  await page.getByRole('button', { name: '专业模式', exact: false }).click();
  assert.equal(await page.getByRole('button', { name: '选择项目', exact: true }).count(), 1, 'healthy package must expose the actual Project chooser entry');
  await page.getByRole('button', { name: '选择项目', exact: true }).click();
  await page.getByLabel('分析案例名称', { exact: true }).fill('Synthetic repurchase decision');
  await page.getByLabel('复购问题', { exact: true }).fill('Why did repurchase decline?');
  await page.getByRole('button', { name: '创建分析', exact: true }).click();
  await page.getByText('会话已创建', { exact: true }).waitFor();
  assert.equal(await page.getByText('本地案例可用', { exact: true }).count(), 1, 'the active Session stage must not falsely remain labelled inactive');
  assert.equal(await page.getByLabel('复购问题', { exact: true }).count(), 1, await page.locator('body').innerText());
  await page.getByLabel('复购问题', { exact: true }).fill('Edited synthetic question');
  await page.getByRole('button', { name: '保存案例字段', exact: true }).click();
  await page.getByText('案例字段已保存', { exact: true }).waitFor();
  await page.getByRole('button', { name: '快速模式', exact: false }).click();
  await page.getByRole('button', { name: '专业模式', exact: false }).click();
  assert.equal(await page.getByLabel('复购问题', { exact: true }).inputValue(), 'Edited synthetic question');
  await page.getByRole('button', { name: '重新打开项目', exact: true }).click();
  await page.getByRole('button', { name: 'Synthetic repurchase decision', exact: true }).click();
  await page.getByText('会话已打开', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('复购问题', { exact: true }).inputValue(), 'Edited synthetic question');
  const db = new DatabaseSync(join(attachment.project_directory, '.xanthil', 'desktop', 'state.sqlite'), { readOnly: true });
  try { assert.equal(db.prepare('SELECT COUNT(*) AS n FROM product_sessions').get()?.n, 1); assert.equal(db.prepare('SELECT COUNT(*) AS n FROM analysis_runs').get()?.n, 0); assert.equal(db.prepare('SELECT COUNT(*) AS n FROM assistance_attempts').get()?.n, 0); }
  finally { db.close(); }
  await close();
  const restarted = await launchFrozenProductionApp(attachment);
  try {
    const reopened = await restarted.firstWindow(); reopened.setDefaultTimeout(5000);
    await reopened.getByRole('button', { name: '专业模式', exact: false }).click();
    await reopened.getByRole('button', { name: '选择项目', exact: true }).click();
    await reopened.getByRole('button', { name: 'Synthetic repurchase decision', exact: true }).click();
    await reopened.getByText('会话已打开', { exact: true }).waitFor();
    assert.equal(await reopened.getByLabel('复购问题', { exact: true }).inputValue(), 'Edited synthetic question');
    assert.equal(await reopened.getByRole('button', { name: '保存案例字段', exact: true }).isEnabled(), true);
    if (process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY) {
      const evidence = process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY;
      await saveScreenshotExclusive(reopened,join(evidence, 'session-reopened.png'),true);
      console.log('U1 Session reopened DOM:', await reopened.locator('body').innerText());
    }
  } finally { await restarted.close(); }
});

test('U1 Session alternatives: real multiline input rejects blank items without silently filtering or writing [AC-XDESK-003-01]', async t => {
  const { app, attachment } = await launchedProfessionalCase(t);
  const page = await app.firstWindow(); page.setDefaultTimeout(5000);
  await page.getByRole('button', { name: '专业模式', exact: false }).click();
  await page.getByRole('button', { name: '选择项目', exact: true }).click();
  await page.getByLabel('分析案例名称', { exact: true }).fill('Alternative validation');
  const input = page.getByLabel('替代解释（每行一项）', { exact: true });
  const database = join(attachment.project_directory, '.xanthil', 'desktop', 'state.sqlite');
  const rejectWithoutWrite = async (label: string, value: string) => {
    const before = await readFile(database);
    await input.fill(value);
    const button = page.getByRole('button', { name: label, exact: true });
    if (await button.isEnabled()) {
      await button.click();
      await page.waitForFunction(() => document.querySelector('form.case-form')?.getAttribute('aria-busy') === 'false');
    }
    assert.deepEqual(await readFile(database), before, 'invalid multiline text must not change database rows/version/receipts');
    assert.equal(await input.inputValue(), value, 'invalid text remains editable; no silent trim/filter');
    assert.equal(await input.getAttribute('aria-invalid'), 'true');
  };
  for (const value of ['Valid explanation\n', '\u0085', '\u00a0\u2028\u2029']) await rejectWithoutWrite('创建分析', value);
  await input.fill(''); // [] is a valid collection, not an empty member.
  await page.getByRole('button', { name: '创建分析', exact: true }).click();
  await page.getByText('会话已创建', { exact: true }).waitFor();
  for (const value of ['Valid explanation\n', '\u0085', '\u00a0\u2028\u2029']) await rejectWithoutWrite('保存案例字段', value);
  const meaningful = '\u0085 B \u00a0\n A ';
  await input.fill(meaningful);
  await page.getByRole('button', { name: '保存案例字段', exact: true }).click();
  await page.getByText('案例字段已保存', { exact: true }).waitFor();
  await page.getByRole('button', { name: '重新打开项目', exact: true }).click();
  await page.getByRole('button', { name: 'Alternative validation', exact: true }).click();
  await page.getByText('会话已打开', { exact: true }).waitFor();
  assert.equal(await input.inputValue(), meaningful);
  const db = new DatabaseSync(database, { readOnly: true });
  try { const row = db.prepare('SELECT alternative_explanations_json,row_version FROM case_revisions').get(); assert.deepEqual(JSON.parse(String(row?.alternative_explanations_json)), ['\u0085 B \u00a0', ' A ']); assert.equal(row?.row_version, 2); }
  finally { db.close(); }
});

test('U1 Session pending: actual lost COMMIT disables resend, then explicit Project reopen recovers the single committed Session [AC-XDESK-002-05]', async t => {
  const { app, attachment } = await launchedProfessionalCase(t);
  const page = await app.firstWindow(); page.setDefaultTimeout(5000);
  await page.getByRole('button', { name: '专业模式', exact: false }).click();
  await page.getByRole('button', { name: '选择项目', exact: true }).click();
  await page.getByLabel('分析案例名称', { exact: true }).fill('Pending synthetic Session');
  await page.getByLabel('复购问题', { exact: true }).fill('Preserve this question');
  await app.evaluate(async () => {
    const { DatabaseSync } = process.getBuiltinModule('node:sqlite');
    const exec = DatabaseSync.prototype.exec, prepare = DatabaseSync.prototype.prepare;
    let committed = false, commits = 0;
    DatabaseSync.prototype.exec = function(sql: string) { const result = exec.call(this, sql); if (sql === 'COMMIT') { committed = true; commits++; throw new Error('synthetic-real-COMMIT-response-loss'); } return result; };
    DatabaseSync.prototype.prepare = function(sql: string) { if (committed && /command_receipts/.test(sql)) throw new Error('synthetic-readback-unavailable'); return prepare.call(this, sql); };
    Reflect.set(globalThis, '__u1RestoreSqliteFault', () => { DatabaseSync.prototype.exec = exec; DatabaseSync.prototype.prepare = prepare; return commits; });
  });
  try {
    await page.getByRole('button', { name: '创建分析', exact: true }).click();
    await page.getByText('结果待核对，创建与保存已停用；请重新打开项目，不要重复发送。', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '创建分析', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: '＋ 新建专业会话', exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel('复购问题', { exact: true }).inputValue(), 'Preserve this question');
  } finally {
    const commits = await app.evaluate(() => { const restore = Reflect.get(globalThis, '__u1RestoreSqliteFault') as () => number; const count = restore(); Reflect.deleteProperty(globalThis, '__u1RestoreSqliteFault'); return count; });
    assert.equal(commits, 1, 'no background resend or second commit occurs');
  }
  await page.getByRole('button', { name: '重新打开项目', exact: true }).click();
  await page.getByRole('button', { name: 'Pending synthetic Session', exact: true }).click();
  await page.getByText('会话已打开', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('复购问题', { exact: true }).inputValue(), 'Preserve this question');
  const db = new DatabaseSync(join(attachment.project_directory, '.xanthil', 'desktop', 'state.sqlite'), { readOnly: true });
  try { assert.equal(db.prepare('SELECT COUNT(*) AS n FROM product_sessions').get()?.n, 1); assert.equal(db.prepare("SELECT COUNT(*) AS n FROM command_receipts WHERE operation_kind='create_session'").get()?.n, 1); } finally { db.close(); }
});

test('U1.1 AC-XDESK-001-01: launches the packaged arm64 shell with the persistent Xanthil frame', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await page.getByText('Xanthil', { exact: false }).waitFor();
  assert.notEqual(await page.title(), '');
});

test('U1.1 AC-XDESK-001-02: shows the six professional stages with their Chinese acceptance labels', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await page.getByRole('button', { name: '专业模式' }).click();
  const professionalStages = page.getByRole('navigation', { name: '专业模式阶段', exact: true });
  for (const [index, stage] of ['新建分析', '数据准备', '本地处理', '循证分析', '报告', '执行反馈'].entries()) await professionalStages.getByRole('button', { name: new RegExp(`^${index + 1}\\s*${stage}$`, 'u') }).waitFor();
  await expectNoPrototypeSimulation(page);
});

test('U1.1 AC-XDESK-001-03: keeps Quick, Fork, Subagent, Skill, and Prompt visible as effect-free Preview', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await page.getByRole('button', { name: '快速模式' }).click();
  const initialUrl = page.url();
  for (const capability of ['Skill', 'Prompt', 'Fork', 'Subagent']) {
    const preview = page.getByRole('button', { name: new RegExp(`^${capability} · Preview$`, 'u') });
    await preview.waitFor();
    await preview.click();
    assert.equal(page.url(), initialUrl, `${capability} Preview does not navigate to an active capability`);
    if (capability === 'Fork' || capability === 'Subagent') {
      await page.getByText('缺少：先创建 Session', { exact: false }).waitFor();
    } else {
      const picker = page.getByRole('dialog', { name: new RegExp(`^${capability} · Preview$`, 'u') });
      await picker.waitFor();
      await picker.getByText('Preview · 模拟', { exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await picker.waitFor({ state: 'hidden' });
    }
    assert.doesNotMatch(await page.locator('body').innerText(), /(?:Session\s+(?:已创建|created)|已创建.*Session|分析(?:已启动|运行中)|Analysis\s+(?:started|running)|报告(?:已生成|已导出))/i, `${capability} may show its honest prompt but cannot create a Session, start analysis, or produce a report`);
  }
  await page.getByText('执行反馈', { exact: true }).waitFor({ state: 'hidden' });
});

test('U1.1 AC-XDESK-001-04: proves only the U1.1 shell mode/search surface closes without creating a Session; later Session and background-work continuity remains a later consumer', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await page.getByRole('button', { name: '专业模式' }).click();
  await page.getByRole('button', { name: '快速模式' }).click();
  const search = page.getByRole('button', { name: /全局搜索/ });
  await search.focus();
  await search.click();
  const palette = page.getByRole('dialog', { name: /全局搜索/ });
  await palette.waitFor();
  await page.keyboard.press('Escape');
  await palette.waitFor({ state: 'hidden' });
  assert.equal(await search.evaluate((element) => document.activeElement === element), true, 'closing global search restores its visible trigger rather than altering business state');
  const after = await page.locator('body').innerText();
  assert.doesNotMatch(after, /(?:Session\s+(?:已创建|created)|已创建.*Session|分析(?:已启动|运行中)|Analysis\s+(?:started|running))/i, 'M1.1 shell controls do not create a Session or begin background work');
});

test('U1.1 AC-XDESK-001-05: keeps keyboard focus, modal trapping, drawer recovery, and both approved viewport layouts usable', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }]) {
    await page.setViewportSize(viewport);
    const drawer = page.getByRole('button', { name: '辅助抽屉', exact: true });
    await drawer.focus();
    assert.equal(await drawer.evaluate((element) => document.activeElement === element), true, 'the trigger receives keyboard focus before opening the drawer');
    await drawer.click();
    assert.equal(await drawer.getAttribute('aria-expanded'), 'true', 'the non-modal auxiliary drawer reports its visible state');
    await page.getByRole('button', { name: '关闭辅助抽屉' }).click();
    assert.equal(await drawer.getAttribute('aria-expanded'), 'false', 'closing the auxiliary drawer restores its closed state without assuming a modal trap');
    assert.equal(await drawer.evaluate((element) => document.activeElement === element), true, 'closing the auxiliary drawer restores focus to its usable trigger');

    await page.getByRole('button', { name: '快速模式' }).click();
    const skill = page.getByRole('button', { name: /Skill/ });
    await skill.focus();
    await skill.click();
    const picker = page.getByRole('dialog', { name: /Skill/ });
    await picker.waitFor();
    await page.keyboard.press('Tab');
    assert.equal(await picker.evaluate((element) => element.contains(document.activeElement)), true, 'Tab focus is contained in the approved modal capability dialog');
    await page.keyboard.press('Escape');
    await picker.waitFor({ state: 'hidden' });
    assert.equal(await skill.evaluate((element) => document.activeElement === element), true, 'closing the capability dialog restores focus to its usable trigger');
  }
});

test('U3 GUI non-closure actions persist their distinct object without acceptance final report or completion [AC-XDESK-007-02, AC-XDESK-007-03, AC-XDESK-007-04]',async t=>{
  const {app,attachment}=await launchedProfessionalCase(t),page=await app.firstWindow();await completeProfessionalJourney(page,'candidate_comparison',true);await page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/执行反馈/}).click();
  await page.getByRole('button',{name:'新增候选',exact:true}).click();await page.getByRole('group',{name:'候选 1',exact:true}).getByLabel('候选标题',{exact:true}).fill('Unresolved candidate');
  assert.equal(await page.getByRole('button',{name:'保存闭环路线',exact:true}).isEnabled(),false);
  for(const [button,disposition]of [['保存草稿','draft'],['不采纳此候选方案','not_adopted'],['暂缓决策','deferred'],['需要补证','more_evidence']]){
    if(disposition==='deferred')await page.getByLabel('暂缓到（可不填）',{exact:true}).fill('2026-10-01');
    await page.getByRole('button',{name:button,exact:true}).click();await page.getByText('表单已保存；保存不等于接受或完成。',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('[aria-label="决策闭环表单"]')?.getAttribute('aria-busy')==='false');
    const db=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{const row=db.prepare('SELECT disposition,defer_until FROM decision_forms ORDER BY form_sequence DESC LIMIT 1').get();assert.equal(row?.disposition,disposition);if(disposition==='deferred')assert.equal(row?.defer_until,'2026-10-01');assert.equal(db.prepare('SELECT state FROM case_revisions').get()?.state,'Review');for(const table of ['finding_acceptances','decision_closures'])assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get()?.n,0);assert.equal(db.prepare("SELECT count(*) n FROM report_versions WHERE state='final'").get()?.n,0);}finally{db.close();}
    assert.equal(await page.getByRole('button',{name:'完成分析案例',exact:true}).isEnabled(),false);
  }
});

test('U3 GUI deferred decision survives remount reopen repeated save and explicit date clearing [AC-XDESK-007-02, AC-XDESK-007-03, AC-XDESK-007-06]',async t=>{
  const {app,attachment,close}=await launchedProfessionalCase(t);let page=await app.firstWindow();await completeProfessionalJourney(page,'candidate_comparison',true);
  const stage=async()=>page.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/执行反馈/}).click();await stage();
  const save=async()=>{await page.getByRole('button',{name:'暂缓决策',exact:true}).click();await page.getByText('表单已保存；保存不等于接受或完成。',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('[aria-label="决策闭环表单"]')?.getAttribute('aria-busy')==='false');};
  await page.getByLabel('暂缓到（可不填）',{exact:true}).fill('2026-10-01');await save();
  assert.equal(await page.getByLabel('暂缓到（可不填）',{exact:true}).inputValue(),'2026-10-01','successful save/remount keeps its persisted date visible');
  await page.getByRole('list',{name:'决策表单处置历史',exact:true}).getByText(/暂缓决策.*2026-10-01/u).waitFor();
  await close();const reopened=await launchFrozenProductionApp(attachment);t.after(()=>reopened.close());page=await reopened.firstWindow();
  await page.getByRole('button',{name:'专业模式',exact:true}).click();await page.getByRole('button',{name:'选择项目',exact:true}).click();await page.getByRole('button',{name:'Synthetic repurchase decision',exact:true}).click();await page.getByText('会话已打开',{exact:true}).waitFor();await stage();
  assert.equal(await page.getByLabel('暂缓到（可不填）',{exact:true}).inputValue(),'2026-10-01');
  const readForms=()=>{const db=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{assert.equal(db.prepare('SELECT state FROM case_revisions').get()?.state,'Review');assert.equal(db.prepare('SELECT count(*) n FROM decision_closures').get()?.n,0);assert.equal(db.prepare('SELECT count(*) n FROM finding_acceptances').get()?.n,0);return db.prepare('SELECT form_id,disposition,defer_until FROM decision_forms ORDER BY form_sequence').all().map(x=>({...x}));}finally{db.close();}};
  const first=readForms()[0];await save();let rows=readForms();assert.equal(rows.length,2);assert.deepEqual(rows[0],first);assert.equal(rows[1].defer_until,'2026-10-01');
  await page.getByLabel('暂缓到（可不填）',{exact:true}).fill('2026-10-08');await save();assert.equal(readForms().at(-1)?.defer_until,'2026-10-08');
  await page.getByLabel('暂缓到（可不填）',{exact:true}).fill('');await save();rows=readForms();assert.equal(rows.at(-1)?.defer_until,null);assert.deepEqual(rows[0],first);assert.equal(await page.getByLabel('暂缓到（可不填）',{exact:true}).inputValue(),'');
  const history=page.getByRole('list',{name:'决策表单处置历史',exact:true});assert.equal(await history.getByRole('listitem').count(),4);assert.match(await history.innerText(),/2026-10-01/u);assert.match(await history.innerText(),/2026-10-08/u);assert.match(await history.innerText(),/未指定日期/u);
  for(const viewport of [{width:1440,height:900},{width:1366,height:768}]){await page.setViewportSize(viewport);await history.scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,`u3-deferred-history-${viewport.width}.png`));}
});

test('AC-XDESK-007-05: completes only one accepted Finding plus valid saved route into Closure final report and Completed', async (t) => {
  const { app,attachment,close } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await completeProfessionalJourney(page);
  await page.getByRole('heading',{name:'修订报告 2 · 当前最终报告',exact:true}).waitFor();
  const evidenceTargets=await page.locator('[id^="evidence-"]').evaluateAll(elements=>elements.map(element=>element.id));assert.equal(new Set(evidenceTargets).size,evidenceTargets.length,'one visible report has unique actual evidence fragment targets; history must not create ambiguous duplicate IDs');
  assert.equal(evidenceTargets.length,4);const history=page.getByLabel('报告版本历史',{exact:true}),current=await history.inputValue();const sqlitePath=join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),beforeHistory=await readFile(sqlitePath);
  for(const index of [0,1]){await history.selectOption({index});await page.getByRole('heading',{name:index===0?'修订报告 1 · 分析草稿':'修订报告 2 · 当前最终报告',exact:true}).waitFor();const links=page.getByRole('navigation',{name:'报告证据回链',exact:true}).getByRole('link');assert.equal(await links.count(),4);for(let i=0;i<4;i++){const link=links.nth(i),target=await link.getAttribute('href');assert.ok(target?.startsWith('#evidence-'));await link.focus();await page.keyboard.press('Enter');assert.equal(await page.locator(target!).count(),1);assert.equal(await page.locator(target!).evaluate(element=>document.activeElement===element),true);assert.equal(await page.locator(target!).locator('details').getAttribute('open'),'');}}
  assert.equal(await history.inputValue(),current);assert.deepEqual(await readFile(sqlitePath),beforeHistory,'selecting report history and following verified evidence links never writes business state');
  const db=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});let ids:string[];
  try{assert.equal(db.prepare('SELECT state FROM case_revisions').get()?.state,'Completed');assert.equal(db.prepare('SELECT count(*) n FROM decision_closures').get()?.n,1);const row=db.prepare('SELECT candidates_json FROM decision_forms ORDER BY form_sequence DESC LIMIT 1').get();const candidates=JSON.parse(String(row?.candidates_json));ids=candidates.map((c:{candidate_id:string})=>c.candidate_id);assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1]);assert.equal(db.prepare('SELECT count(*) n FROM report_versions').get()?.n,2);assert.equal(db.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='export_report'").get()?.n,0);}finally{db.close();}
  for(const viewport of [{width:1440,height:900},{width:1366,height:768}]){await page.setViewportSize(viewport);await page.getByRole('heading',{name:'修订报告 2 · 当前最终报告',exact:true}).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY)await saveScreenshotExclusive(page,join(process.env.JUANERAI_GUI_EVIDENCE_DIRECTORY,`u3-final-${viewport.width}.png`));}
  await close();const reopened=await launchFrozenProductionApp(attachment);try{const view=await reopened.firstWindow();await view.getByRole('button',{name:'专业模式',exact:true}).click();await view.getByRole('button',{name:'选择项目',exact:true}).click();await view.getByRole('button',{name:'Synthetic repurchase decision',exact:true}).click();await view.getByText('会话已打开',{exact:true}).waitFor();await view.getByRole('navigation',{name:'专业模式阶段',exact:true}).getByRole('button',{name:/报告/}).click();await view.getByRole('heading',{name:'修订报告 2 · 当前最终报告',exact:true}).waitFor();await view.getByLabel('报告版本历史',{exact:true}).selectOption({index:0});await view.getByRole('heading',{name:'修订报告 1 · 分析草稿',exact:true}).waitFor();assert.equal(await view.locator('[id^="evidence-"]').count(),4);}finally{await reopened.close();}
});

test('AC-XDESK-007-07: exports marked UTF-8 Markdown/HTML provenance without creating a business conclusion', async (t) => {
  const { app, attachment } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await completeProfessionalJourney(page,'insufficient_evidence');
  await page.getByRole('button',{name:'导出报告 2（Markdown / HTML）',exact:true}).click();await page.getByText(/^已写入并独立读回 exported-decision.html/u).waitFor();
  const html = await readFile(attachment.export_file);
  assert.equal(attachment.export_file.endsWith('.html'), true);
  assert.ok(html.byteLength > 0, 'the native export target must contain actual bytes after Main write/readback');
  assert.match(new TextDecoder('utf-8', { fatal: true }).decode(html), /关联不等于因果|association_not_causation/);
  assert.match(createHash('sha256').update(html).digest('hex'), /^[a-f0-9]{64}$/);
  const db = new DatabaseSync(join(attachment.project_directory, '.xanthil', 'desktop', 'state.sqlite'));
  try {
    const report = db.prepare('SELECT report_id, html_sha256, html_byte_length FROM report_versions ORDER BY created_at DESC LIMIT 1').get() as { report_id: string; html_sha256: string; html_byte_length: string };
    assert.match(report.report_id, /^[0-9a-f-]{36}$/i);
    assert.equal(report.html_sha256, createHash('sha256').update(html).digest('hex'), 'exported bytes retain the immutable committed report identity');
    assert.equal(String(report.html_byte_length), String(html.byteLength));
  } finally { db.close(); }
  const markdownTarget=join(attachment.project_directory,'exported-decision.md');await app.evaluate(({dialog},target)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:target});},markdownTarget);
  await page.getByRole('button',{name:'导出报告 2（Markdown / HTML）',exact:true}).click();await page.getByText(/^已写入并独立读回 exported-decision.md/u).waitFor();
  const markdown=await readFile(markdownTarget),check=new DatabaseSync(join(attachment.project_directory,'.xanthil','desktop','state.sqlite'),{readOnly:true});try{const report=check.prepare("SELECT markdown_sha256,markdown_byte_length FROM report_versions WHERE state='final'").get();assert.equal(report?.markdown_sha256,createHash('sha256').update(markdown).digest('hex'));assert.equal(String(report?.markdown_byte_length),String(markdown.length));assert.equal(check.prepare("SELECT count(*) n FROM command_receipts WHERE operation_kind='export_report'").get()?.n,2);assert.equal(check.prepare('SELECT count(*) n FROM decision_closures').get()?.n,1);}finally{check.close();}
});

test('AC-XDESK-012-04: drives the same production app with chromiumSandbox true and no CSP or provider bypass', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await expectNoPrototypeSimulation(page);
  assert.equal(await page.evaluate(() => Object.hasOwn(globalThis, 'require') ? typeof Reflect.get(globalThis, 'require') : 'undefined'), 'undefined');
  assert.equal(await page.evaluate(() => Object.hasOwn(globalThis, 'process') ? typeof Reflect.get(globalThis, 'process') : 'undefined'), 'undefined');
});

test('U1.1 H-GUI-CONTROL: launches the frozen package and rejects a wrong executable identity before behavior', async (t) => {
  await assertDesktopFixtureHealth();
  const project = await createTemporaryDesktopProject();
  t.after(() => project.dispose());
  const attachment = {
    project_directory: project.projectRoot,
    members_file: fileURLToPath(new URL('../../fixtures/xanthil-desktop/members.csv', import.meta.url)),
    orders_file: fileURLToPath(new URL('../../fixtures/xanthil-desktop/orders.csv', import.meta.url)),
    export_file: join(project.projectRoot, 'exported-decision.html'),
  };
  const expectedIdentity = await readFrozenProductionPackageIdentity();
  const wrongExecutableManifest = Object.freeze(expectedIdentity.manifest.map((entry) => entry.relativePath === 'Contents/MacOS/Xanthil'
    ? Object.freeze({ ...entry, sha256: '0'.repeat(64) })
    : entry));
  const wrongIdentity = Object.freeze({
    ...expectedIdentity,
    manifest: wrongExecutableManifest,
    aggregateSha256: frozenProductionPackageAggregateSha256(wrongExecutableManifest),
  });
  await assert.rejects(
    () => launchFrozenProductionApp(attachment, wrongIdentity),
    /frozen package Contents\/MacOS\/Xanthil digest/,
    'a deliberately wrong immutable executable identity is rejected by the shared launch preflight before importing Playwright or launching Electron',
  );
  const app = await launchFrozenProductionApp(attachment);
  t.after(() => app.close());
  assert.equal(app.windows().length, 1, 'the frozen package opens exactly one first window');
  const page = await app.firstWindow();
  await page.locator('#root').waitFor();
  assert.match(page.url(), /^file:/, 'the first window is the packaged local Renderer rather than an external page');
});

test('U1.1 GUI-RUNTIME-SAFETY [AC-XDESK-009-01..04, AC-XDESK-012-04]: packaged runtime preserves isolation closed bridge inactive refusal and native denials', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  const expectedMethods = [
    'acceptFinding', 'cancelAnalysis', 'cancelAssistance', 'completeCase', 'confirmRevision',
    'createDraftRevision', 'createSession', 'decideAssistanceDisclosure', 'disposeAssistanceDraft',
    'exportReport', 'listSessions', 'openSession', 'prepareAssistanceDisclosure', 'readProjection',
    'saveForm', 'selectImportFiles', 'selectProject', 'startAnalysis', 'startAssistance', 'waitForProjection',
  ].sort();
  const bridge = await page.evaluate(async () => {
    const api = Reflect.get(globalThis, 'xanthilDesktopApi') as Record<string, (request: unknown) => Promise<unknown>>;
    const validInactive = await api.acceptFinding({
      contract_version: '1.0',
      command_id: '22222222-2222-4222-8222-222222222222',
      project_id: '11111111-1111-4111-8111-111111111111',
      session_id: '33333333-3333-4333-8333-333333333333',
      case_id: '44444444-4444-4444-8444-444444444444',
      revision_id: '55555555-5555-4555-8555-555555555555',
      expected_row_version: '1', finding_id: '66666666-6666-4666-8666-666666666666',
    });
    const malformed = await api.selectProject({ contract_version: '1.0' });
    const child = document.createElement('iframe');
    const childLoaded = new Promise<void>((resolve) => child.addEventListener('load', () => resolve(), { once: true }));
    child.src = 'about:blank';
    document.body.append(child);
    await childLoaded;
    const childWindow = child.contentWindow;
    const childBridgeType = childWindow === null ? 'missing-frame' : typeof Reflect.get(childWindow, 'xanthilDesktopApi');
    child.remove();
    return {
      keys: Object.keys(api).sort(),
      functionTypes: Object.values(api).map((value) => typeof value),
      forbiddenTypes: Object.fromEntries(['ipcRenderer', 'invoke', 'send', 'electron', 'process', 'require'].map((key) => [key, typeof Reflect.get(globalThis, key)])),
      validInactive,
      malformed,
      childBridgeType,
    };
  });
  assert.deepEqual(bridge.keys, expectedMethods, 'the top frame exposes only the final twenty named business methods');
  assert.deepEqual(bridge.functionTypes, Array.from({ length: 20 }, () => 'function'));
  assert.deepEqual(bridge.forbiddenTypes, {
    ipcRenderer: 'undefined', invoke: 'undefined', send: 'undefined', electron: 'undefined', process: 'undefined', require: 'undefined',
  });
  assert.deepEqual(bridge.validInactive, {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: '未找到属于当前项目的会话或记录。',
      what_did_not_happen: '本次没有返回成功确认，不会自动重试；失败不表示先前读取或写入从未发生。',
      preserved_authority: '已提交记录及原始证据以持久存储为准；保留已有材料，不自动清理或回滚。',
      recovery_action: '重新选择项目并打开已有会话，核对当前记录。',
    },
  }, 'a valid top-frame inactive request is a sanitized no-effect refusal');
  assert.deepEqual(bridge.malformed, {
    ok: false,
    error: {
      code: 'INVALID_REQUEST',
      message: '请求格式或字段不符合当前接口。',
      what_did_not_happen: '本次没有返回成功确认，不会自动重试；失败不表示先前读取或写入从未发生。',
      preserved_authority: '已提交记录及原始证据以持久存储为准；保留已有材料，不自动清理或回滚。',
      recovery_action: '检查输入，返回当前页面重新发起明确操作。',
    },
  }, 'a malformed command envelope is rejected before any business route');
  assert.equal(bridge.childBridgeType, 'undefined', 'an isolated child frame has no Desktop bridge');

  const initialUrl = page.url();
  const initialWindowCount = app.windows().length;
  const externalRequests: string[] = [];
  const observeExternalRequest = (request: { url(): string }) => {
    if (request.url().startsWith('https://example.invalid/')) externalRequests.push(request.url());
  };
  page.on('request', observeExternalRequest);
  await page.evaluate(() => {
    window.open('https://example.invalid/new-window');
    const link = document.createElement('a');
    link.href = 'https://example.invalid/navigation';
    document.body.append(link);
    link.click();
    link.remove();
  });
  await page.waitForTimeout(100);
  const geolocation = await page.evaluate(() => new Promise<number>((resolve) => {
    navigator.geolocation.getCurrentPosition(() => resolve(0), (error) => resolve(error.code), { timeout: 1000 });
  }));
  const fetchResult = await page.evaluate(async () => {
    try {
      await fetch('https://example.invalid/csp');
      return 'resolved';
    } catch (error) {
      return error instanceof Error ? error.name : String(error);
    }
  });
  page.off('request', observeExternalRequest);
  assert.equal(app.windows().length, initialWindowCount, 'window.open cannot create another packaged window');
  assert.equal(page.url(), initialUrl, 'external renderer navigation leaves the current local page in place');
  assert.equal(geolocation, 1, 'the packaged permission handler denies geolocation');
  assert.notEqual(fetchResult, 'resolved', 'connect-src none rejects an external Renderer fetch');
  assert.deepEqual(externalRequests, [], 'CSP and native denials permit no observed external request');
});

test('AC-XDESK-012-01: retains the exact P4 package and lock identity as historical non-RED evidence', async () => {
  const packageJson = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
  const packageLock = await readFile(new URL('../../../package-lock.json', import.meta.url));
  assert.equal(packageLock.byteLength,319836);
  assert.equal(createHash('sha256').update(packageLock).digest('hex'),'861326061cd570b0e81584f149012b13228aec3da6528d82536f89cbb5d535c0');
  const p4=JSON.parse(packageJson);delete p4.main;delete p4.config;
  for(const key of ['desktop:start','desktop:package','desktop:test'])delete p4.scripts[key];
  const p4Bytes=Buffer.from(JSON.stringify(p4,null,2)+'\n');
  assert.equal(p4Bytes.byteLength,808);
  assert.equal(createHash('sha256').update(p4Bytes).digest('hex'),'5a5e225cab86826b78afb2b94eb18a4064ab75c1115aa27dfb1342a927ed264a','only the separately checked approved P5 additions differ from the exact retained P4 object');
});

test('AC-XDESK-012-02: adds only frozen P5 desktop paths scripts configs and validation phases after TDD_READY', async () => {
  const packageJson = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
  const manifest=JSON.parse(packageJson);
  assert.equal(manifest.main,'.vite/build/main.cjs');
  assert.deepEqual(manifest.config,{forge:'./forge.config.cjs'});
  assert.deepEqual(manifest.scripts,{
    typecheck:'tsc -p tsconfig.json --noEmit',test:'tools/harness/validation/run',
    'desktop:start':'node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge start',
    'desktop:package':'node tools/desktop/prepare-toolchain-deployment.mjs && electron-forge package --platform=darwin --arch=arm64',
    'desktop:test':'npm run desktop:package && node --test tests/unit/xanthil-desktop/*.test.ts tests/contract/xanthil-desktop/*.test.ts tests/integration/xanthil-desktop/*.test.ts tests/e2e/xanthil-desktop/*.test.ts',
  });
  // Exact 68-root/compiler/config-inventory equality and mixed-tuple negatives
  // are independently asserted by TEST-XCLI-021-CF-RESTORATION, not inferred here.
});

test('AC-XDESK-012-03: packages only the approved local arm64 application and contained toolchain descriptor', async (t) => {
  const { app } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await page.getByText('Xanthil', { exact: false }).waitFor();
  assert.equal(process.arch, 'arm64');
  const identity=await readFrozenProductionPackageIdentity();
  const runtime=await app.evaluate(async({app})=>{
    const fs=process.getBuiltinModule('node:fs').promises;
    return{packaged:app.isPackaged,name:app.getName(),version:app.getVersion(),arch:process.arch,electron:process.versions.electron,appPath:app.getAppPath(),descriptor:JSON.parse(await fs.readFile(app.getAppPath()+'/package.json','utf8')),toolchain:JSON.parse(await fs.readFile(process.resourcesPath+'/toolchain-deployment.json','utf8'))};
  });
  assert.equal(runtime.packaged,true);assert.equal(runtime.name,'Xanthil');assert.equal(runtime.version,'0.1.0');assert.equal(runtime.arch,'arm64');assert.equal(runtime.electron,'44.4.3');assert.equal(runtime.appPath,join(identity.packageRoot,'Contents/Resources/app.asar'));
  assert.equal(runtime.descriptor.main,'.vite/build/main.cjs');assert.equal(runtime.descriptor.type,'module');
  assert.deepEqual(runtime.toolchain,JSON.parse(await readFile(join(identity.packageRoot,'Contents/Resources/toolchain-deployment.json'),'utf8')));
});

test('AC-XDESK-012-06: keeps CLI baseline suites provider gate and compatibility results green without replay or external call', async () => {
  const pageSource = await import('node:fs/promises').then(({ readFile }) => readFile(new URL('../../fixtures/xanthil-desktop/desktop-e2e-harness.ts', import.meta.url), 'utf8'));
  assert.doesNotMatch(pageSource, /XANTHIL_REAL_PI_ACCEPTANCE|no-sandbox|provider/);
  const canonical=await readFile(new URL('../../../tools/harness/validation/run',import.meta.url),'utf8');
  assert.match(canonical,/^unset XANTHIL_REAL_PI_ACCEPTANCE$/m);
  const consolePhases=['unit/run-evidence-console/run-evidence.unit.test.ts','contract/run-evidence-console/run-evidence-reader.contract.test.ts','integration/run-evidence-console/run-evidence-reader.integration.test.ts','e2e/run-evidence-console/xanthil-console.e2e.test.ts'];
  let previous=-1;for(const path of consolePhases){const line='node --test tests/'+path;assert.equal(canonical.split('\n').filter(value=>value===line).length,1);const at=canonical.indexOf(line);assert.ok(at>previous);previous=at;}
  assert.ok(canonical.indexOf('node --test tests/unit/xanthil-desktop/*.test.ts')>previous);
  // A source check cannot claim suite GREEN; final CF command results are required separately.
});

test('AC-XDESK-012-07: activates only the personal macOS arm64 professional path with rollback evidence and no release claim', async (t) => {
  const { app, attachment, close } = await launchedProfessionalCase(t);
  const page = await app.firstWindow();
  await completeProfessionalJourney(page);
  await close();
  const reopenedApp = await launchFrozenProductionApp(attachment);
  t.after(() => reopenedApp.close());
  const reopened = await reopenedApp.firstWindow();
  reopened.setDefaultTimeout(5000);
  await reopened.getByRole('button', { name: '专业模式' }).click();
  await reopened.getByRole('button',{name:'选择项目',exact:true}).click();
  await reopened.getByRole('button',{name:'Synthetic repurchase decision',exact:true}).click();
  await reopened.getByText('会话已打开',{exact:true}).waitFor();
  assert.match(await reopened.locator('body').innerText(),/Completed/);
  await expectNoPrototypeSimulation(reopened);
});

async function expectNoPrototypeSimulation(page: Awaited<ReturnType<Awaited<ReturnType<typeof launchFrozenProductionApp>>['firstWindow']>>) {
  await assert.rejects(() => page.getByText(/UI Contract\s*\/\s*模拟|合成数据\s*\/\s*UI Contract\s*\/\s*模拟执行/).waitFor({ timeout: 250 }));
}

// TEST-XDESK-012 normal no-debug native chooser acceptance remains a separate
// post-GREEN witnessed activity. The attachment above is an explicitly labeled
// automated Main-only chooser substitution, never a Renderer/IPC capability.
// AC-XDESK-012-05: records the separate same-build normal no-debug native-chooser
// acceptance. It is intentionally manual-post-green and NOT RUN in node:test.
