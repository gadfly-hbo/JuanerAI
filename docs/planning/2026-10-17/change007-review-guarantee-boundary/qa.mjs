// Documentation-only checks. No browser, Provider, service, production tests, or writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../../..');
const previous = path.resolve(here, '../change007-authoritative-delivery');
const fixed = 'abeb6e97e45fb499f2ca8e358e0481d0c29423d9';
const results = [];
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
function check(name, fn) { fn(); results.push(name); }
const ctx = vm.createContext({ structuredClone, console });
const load = f => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
for (const f of [
  'reference/accepted-workbench/clickable/model.js',
  'clickable-v0.2/samples.js', 'clickable-v0.2/delivery.js'
]) load(path.join(previous, f));
const originals = Object.fromEntries(ctx.change007DeliveryPreview.names.map(n => [n, JSON.parse(JSON.stringify(ctx.change007DeliveryPreview.scenario(n)))]));
load(path.join(here, 'clickable/boundary.js'));
const D = ctx.Change007Alignment, M = ctx.ContractModel, P = ctx.change007DeliveryPreview;
const button = (act, text, cls = '', extra = '') => '<button type="button" class="' + cls + '" data-action="' + act + '" ' + extra + '>' + text + '</button>';
const set = new Set();
const act = (x, name, ds = {}) => D.action(x, name, ds, M, set);
const hasNote = html => assert.ok(html.includes(ctx.Change007BoundaryPreview.note));
const task = name => D.createTask(M, name);
check('9个旧情境业务内容不变；extra仅改说明，不伪造检测', () => {
  assert.equal(P.names.length, 9);
  for (const n of P.names) {
    const after = JSON.parse(JSON.stringify(P.scenario(n)));
    if (n === 'extra') { assert.match(after.note, /预写合成/); after.note = originals[n].note; }
    assert.deepEqual(after, originals[n]);
  }
});
check('原布局与全部原始交互API保留；未换壳层', () => {
  for (const k of Object.keys(ctx.Change007BoundaryPreview.inherited)) assert.equal(typeof D[k], 'function');
  const html = fs.readFileSync(path.join(here, 'clickable/index.html'), 'utf8');
  for (const f of ['style.css', 'alignment.css', 'model.js', 'samples.js', 'delivery.js', 'workbench.js']) assert.ok(html.includes(f));
  assert.ok(html.indexOf('boundary.js') < html.indexOf('workbench.js'));
  assert.match(html, /connect-src 'none'/);
});
check('新增说明入口及合成成功情境命名不暗示共同误判保底', () => {
  const html = D.toolbar(button);
  for (const action of ['boundary-scope', 'boundary-f107', 'boundary-name']) assert.ok(html.includes(action));
  assert.match(html, /附加动作被审查识别（合成）/);
  assert.match(html, /ui-addendum-v0.3.md/);
});
check('完整内容仍有资格；缺项、失败、过期、缺本期资料均不得选择', () => {
  for (const n of ['complete', 'extra', 'cost', 'sales']) assert.equal(D.canChoose(task(n), M), true, n);
  for (const n of ['gap', 'failed', 'stale', 'material', 'conditional']) assert.equal(D.canChoose(task(n), M), false, n);
});
check('运行、停止和UNKNOWN仍不得选择', () => {
  for (const s of ['running', 'stopping', 'stopped', 'unknown', 'failed']) {
    const x = task('complete'); x.status = s;
    assert.equal(D.canChoose(x, M), false, s);
    assert.equal(D.current(x).ready, false, s);
  }
});
check('完整报告、对话、依据、检查器、人审及导出同含有限判断说明', () => {
  const x = task('complete');
  for (const html of [
    D.report(x, button, M), D.chat(x, button, ''), D.evidence(x, button),
    D.inspector(x, 'evidence', button), D.human(x, button, M),
    act(x, 'review-export').html, act(x, 'review-human').html
  ]) hasNote(html);
  const report = D.report(x, button, M);
  for (const phrase of ['核对所选退款与订单归属', '未来3天安排2小时', '200', '若无法匹配', '不承诺收益']) assert.ok(report.includes(phrase), phrase);
  assert.ok(D.formal(x).startsWith(P.reportText(x.review.s)));
});
check('专业六阶段仍消费既有交互，必要说明不新增流程', () => {
  const x = task('complete');
  const parts = {framework: () => '原方案', composer: () => '', controls: () => '原停止控制', artifact: () => D.report(x, button, M)};
  for (const s of ['new', 'prepare', 'process', 'analysis', 'report', 'feedback']) hasNote(D.professional(x, s, button, parts, M, set));
});
check('历史F107与名称说明无采用入口；明确FAIL及原始对象区别', () => {
  const x = task('complete');
  for (const id of ['boundary-f107', 'boundary-name']) {
    const dialog = act(x, id);
    assert.match(dialog.html, /FAIL/); assert.ok(!dialog.html.includes('data-action="review-choose"'));
  }
  assert.match(act(x, 'boundary-f107').html, /1702/);
  assert.match(act(x, 'boundary-f107').html, /语义质量失败/);
  assert.match(act(x, 'boundary-name').html, /没有名称清洗算法/);
});
check('合成条件回答先失效、再重审；已答未知不重复追问', () => {
  const x = task('conditional');
  act(x, 'review-answer', { answer: 'yes' }); assert.equal(D.canChoose(x, M), false);
  assert.equal(x.review.s.phase, 'reviewing');
  act(x, 'review-recheck'); assert.equal(D.canChoose(x, M), true);
  const y = task('conditional');
  act(y, 'review-answer', { answer: 'unknown' });
  assert.equal(D.canChoose(y, M), false);
  assert.match(D.body(y, button), /不重复追问同一项/);
  assert.ok(!D.body(y, button).includes('data-action="review-answer"'));
});
check('编辑保存后旧审查失效；保存失败和未知不冒成功', () => {
  const x = task('complete'); M.confirm(x);
  x.draft += '\n新表达'; M.save(x); D.sync(x);
  assert.equal(D.canChoose(x, M), false); assert.ok(x.confirmations[0].invalid);
  const y = task('complete'); y.draft += '\n待保存'; y.failNext = true; const old = y.doc.text;
  assert.match(M.save(y), /失败/); assert.equal(y.doc.text, old);
  y.status = 'unknown'; assert.match(M.save(y), /未知/); assert.equal(y.doc.text, old);
});
check('2份Mini来源副本字节与固定SHA完全相同', () => {
  for (const [name, bytes, digest] of [
    ['mechanism-interface-assessment108-001.md', 35247, '9d7d7351ac94f99a095857cabf41935a7fc62e3a3dfc75b384e60ee301018920'],
    ['prototype108-result.md', 14982, '63e766eebee0b7cd11f13180c88edfb87cbdb86e000ca284c5f472c8e34e00d5']
  ]) { const b = fs.readFileSync(path.join(here, 'attachments', name)); assert.equal(b.length, bytes); assert.equal(sha(b), digest); }
});
for (const [name, dir, manifest, count] of [
  ['前包49项冻结身份', previous, 'frozen-inputs-2026-10-17.json', 49],
  ['原007的33项冻结身份', path.resolve(here, '../../2026-10-13/change007-conclusion-strategy-review'), 'frozen-inputs-2026-10-13.json', 33]
]) check(name + '在工作区及固定发布对象均未改变', () => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, manifest), 'utf8')); assert.equal(data.files.length, count);
  for (const item of data.files) {
    const local = fs.readFileSync(path.join(dir, item.path));
    assert.equal(local.length, item.bytes); assert.equal(sha(local), item.sha256);
    const rel = path.relative(repo, path.join(dir, item.path));
    const git = execFileSync('git', ['show', fixed + ':' + rel], { cwd: repo, maxBuffer: 10 * 1024 * 1024 });
    assert.equal(git.length, item.bytes); assert.equal(sha(git), item.sha256);
  }
});
check('新HTML加载引用及四份产品说明本地链接均可解析', () => {
  const index = path.join(here, 'clickable/index.html');
  const refs = [...fs.readFileSync(index, 'utf8').matchAll(/(?:src|href)="([^"]+)"/g)].map(x => x[1]);
  for (const ref of refs) if (!/^(#|data:|https?:)/.test(ref)) assert.ok(fs.existsSync(path.resolve(path.dirname(index), ref)), ref);
  for (const name of ['README.md', 'product-addendum-v0.1.md', 'acceptance-delta-v0.1.md', 'ui-addendum-v0.3.md']) {
    const text = fs.readFileSync(path.join(here, name), 'utf8');
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (target && !/^(https?:|mailto:)/.test(target)) assert.ok(fs.existsSync(path.resolve(here, target)), name + ':' + target);
    }
  }
});
console.log(JSON.stringify({kind: 'documentation_static_and_memory_synthetic_only', result: 'PASS', count: results.length, checks: results,
  not_run: ['browser layout/click/keyboard/responsive', 'production/backend/integration', 'Provider/original real-quality cases/QS04', 'engineering Validator/required CI']}, null, 2));
