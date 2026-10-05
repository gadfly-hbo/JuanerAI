// 产品审核附件检查：不是业务测试、浏览器验收或工程完成证据。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root = path.dirname(fileURLToPath(import.meta.url));
const ui = path.join(root, 'clickable/v1.1');
const html = fs.readFileSync(path.join(ui, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(ui, 'workspace-review.js'), 'utf8');
const css = fs.readFileSync(path.join(ui, 'workspace.css'), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({name, passed, ...(detail ? {detail} : {})});
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
check('unique-html-ids', ids.length === new Set(ids).size);
const literalIds = [...js.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]);
check('literal-js-dom-targets-exist', literalIds.every((id) => ids.includes(id)));
const resources = [...html.matchAll(/<(?:link|script|img|iframe)\b[^>]*(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith('data:'));
check('local-resources-exist', resources.every((s) => !/^https?:/.test(s) && fs.existsSync(path.resolve(ui, s.split('?')[0]))), resources);
const syntax = spawnSync(process.execPath, ['--check', path.join(ui, 'workspace-review.js')], {encoding:'utf8'});
check('review-javascript-syntax', syntax.status === 0, syntax.stderr || undefined);
check('no-network-persistence-or-credentials', !/(?:fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|\bapiKey\b|\bBearer\b)/.test(js));
check('no-timed-fake-progress-or-execution', !/(?:setTimeout|setInterval|eval\s*\(|new\s+Function|Worker\s*\()/g.test(js));
check('no-real-file-selection-or-download', !/(?:type="file"|\bdownload=|showOpenFilePicker|FileReader|createObjectURL|new\s+Blob)/.test(html + js));
check('free-input-inserted-as-text-not-html', js.includes('node.textContent = value') && js.includes('不理解任意文本'));
check('synthetic-banner-always-in-shell', html.includes('合成审核样例 · 无后台') && html.includes('不读取文件、不调用模型、不计算或保存业务成果'));
check('no-logo-image', !/<img\b/.test(html) && !html.includes('juanerai-logo.png'));
check('approved-source-layout-and-green-brand-reused', html.includes('../px006/styles.css') && html.includes('../brand.css') && html.includes('持续做出更好的决策'));
check('professional-full-reference-not-placeholder', html.includes('../px004/index.html?preview=demo') && html.includes('不共享后台'));
for (const scenario of ['normal','empty','missing','premise','running','failed','stopped','reopen','unknown','change']) {
  check(`scenario-declared:${scenario}`, html.includes(`value="${scenario}"`) && new RegExp(`\\b${scenario}:`).test(js));
}
check('blocked-current-evidence-and-report', js.includes("['empty','missing','failed','unknown','running'].includes(state.scenario)") && js.includes('尚无当前有效报告') && js.includes('当前没有新的有效证据'));
check('version-diff-and-no-op-expression-distinguished', js.includes('原v1') && js.includes('候选v2') && js.includes('仅表达修订 · 事实不重算'));
check('collaboration-reflow-and-boundary-present', ['MODEL意见', '独立核验', 'child-accept', 'child-reject', 'child-resume', '单层'].every((s) => js.includes(s)));
check('budget-and-retry-not-reset', js.includes('不设累计额度上限') && js.includes('最多自动重试一次') && js.includes('不清零'));
check('drawer-and-mode-keyboard-navigation', js.includes("document.querySelector('.detail-tabs').addEventListener('keydown'") && js.includes("document.querySelector('.mode-switch').addEventListener('keydown'"));
check('dialog-native-escape-focus-return', html.includes('<dialog') && js.includes('showModal()') && js.includes('focusReturn?.isConnected'));
check('responsive-flex-overflow-and-narrow-drawer', css.includes('min-height: 0') && css.includes('overflow-y: auto') && css.includes('@media (max-width: 950px)') && css.includes('@media (max-width: 700px)'));
// 最小DOM替身只检查脚本状态分支，不模拟浏览器布局/焦点/HTML解析。
class ReviewNode {
  constructor(id = '') { this.id = id; this.innerHTML = ''; this.textContent = ''; this.value = ''; this.hidden = false; this.open = false; this.dataset = {}; this.events = {}; this.children = []; this.isConnected = true; this.attributes = {}; this.classList = {toggle() {}}; }
  addEventListener(name, fn) { this.events[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(node) { this.children.push(node); }
  focus() { documentStub.activeElement = this; }
  scrollIntoView() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.events.close?.(); }
}
const nodes = new Map(ids.map((id) => [id, new ReviewNode(id)]));
const tabs = ['context','plan','files','evidence','execution'].map((key) => {const node = nodes.get(`tab-${key}`); node.dataset.detail = key; return node;});
const selectors = new Map(['.mode-switch','.detail-tabs'].map((key) => [key, new ReviewNode(key)]));
const documentStub = {activeElement:new ReviewNode('initial-focus'), body:{dataset:{}}, events:{}, getElementById:(id) => nodes.get(id), querySelector:(key) => selectors.get(key), querySelectorAll:(key) => key === '[data-detail]' ? tabs : [], createElement:() => new ReviewNode(), addEventListener(name, fn) {this.events[name] = fn;}};
vm.runInNewContext(js, {document:documentStub, window:{matchMedia:() => ({matches:false})}}, {timeout:1000});
const choose = (scenario) => {nodes.get('scenario').value = scenario; nodes.get('scenario').events.change();};
const click = (name) => documentStub.events.click({target:{closest:() => ({dataset:{action:name}})}});
check('script-state-default-normal', nodes.get('thread').innerHTML.includes('销售下降') && nodes.get('progress-summary').innerHTML.includes('成果待检查'));
for (const scenario of ['missing','failed','running','unknown']) {
  choose(scenario); click('report');
  check(`script-blocks-report:${scenario}`, nodes.get('dialog-title').textContent === '尚无当前有效报告');
  nodes.get('review-dialog').close(); click('evidence');
  check(`script-blocks-evidence:${scenario}`, nodes.get('dialog-title').textContent === '当前没有新的有效证据');
  nodes.get('review-dialog').close();
}
choose('normal'); click('plan');
check('script-workspace-preserves-conversation', nodes.get('thread').hidden && !nodes.get('workspace').hidden && nodes.get('workspace-body').innerHTML.includes('可检查的分析方案'));
click('diff'); click('apply-change');
check('script-scope-change-preserves-old-version-reference', nodes.get('scenario').value === 'change' && nodes.get('thread').innerHTML.includes('80→76') && nodes.get('thread').innerHTML.includes('旧报告保留'));
click('skill'); click('skill-quality');
check('script-skill-selection-affects-visible-plan', nodes.get('skill-name').textContent === '数据质量检查' && nodes.get('workspace-body').innerHTML.includes('数据质量检查'));
click('subagent'); click('child-open'); click('child-accept');
check('script-collaboration-adoption-does-not-change-decision', nodes.get('workspace-body').innerHTML.includes('已关联采纳') && nodes.get('workspace-body').innerHTML.includes('正式Finding／Decision没有变化'));
choose('unknown'); click('subagent');
check('script-unknown-blocks-collaboration', nodes.get('dialog-title').textContent === '当前不具备协作启动条件');
nodes.get('review-dialog').close(); choose('normal'); nodes.get('stop').events.click();
check('script-stop-no-automatic-resume', nodes.get('scenario').value === 'stopped' && nodes.get('stop').disabled);
choose('reopen'); click('resume');
check('script-reopen-explicit-authorization-reuse', nodes.get('dialog-body').innerHTML.includes('复用有效数据／模型／工具许可') && nodes.get('dialog-body').innerHTML.includes('不清零'));
nodes.get('review-dialog').close(); choose('normal'); nodes.get('message').value = '<img src=x onerror=alert(1)>';
nodes.get('composer').events.submit({preventDefault() {}});
check('script-free-input-remains-text', nodes.get('thread').children.some((node) => node.textContent === '<img src=x onerror=alert(1)>' && node.innerHTML === ''));
click('judgment');
check('script-member-review-preserves-three-exits', nodes.get('dialog-body').innerHTML.includes('仅确认分析／要求补证／记录决定'));
click('judgment-unknown');
check('script-judgment-unknown-not-success', nodes.get('dialog-title').textContent.includes('UNKNOWN') && nodes.get('dialog-body').innerHTML.includes('不显示认可成功、不重发'));
click('judgment-failure');
check('script-judgment-save-failure-separate-from-result', nodes.get('dialog-body').innerHTML.includes('不代表判断保存成功'));
nodes.get('review-dialog').close(); choose('empty'); click('plan');
check('script-empty-has-no-fabricated-plan', nodes.get('dialog-title').textContent === '尚未建立当前分析');
nodes.get('review-dialog').close(); choose('running'); click('execution');
check('script-running-record-not-verified-success', nodes.get('workspace-body').innerHTML.includes('核验与报告尚未开始'));
for (const file of ['product-input-v1.1.md', 'ui-contract-v1.1.md']) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const links = [...content.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).filter((s) => !/^(?:https?:|#)/.test(s));
  check(`product-package-local-links:${file}`, links.every((s) => fs.existsSync(path.resolve(root, s.split('#')[0]))));
}
const legacy = spawnSync(process.execPath, [path.join(root, 'verify-static.mjs')], {encoding: 'utf8'});
check('prior-attachment-and-eight-source-identities-retained', legacy.status === 0, legacy.status === 0 ? '旧附件27项通过；不用于证明新版行为' : legacy.stderr);
const files = ['product-input-v1.1.md','ui-contract-v1.1.md','clickable/v1.1/index.html','clickable/v1.1/workspace.css','clickable/v1.1/workspace-review.js'];
const result = {scope:'STATIC_ATTACHMENT_AND_SCRIPT_STATES_ONLY', device:'MacBook', checks, total:checks.length, passed:checks.filter((c) => c.passed).length, identities:files.map((file) => ({file, sha256:hash(path.join(root,file))})), not_run:['真实浏览器视觉/点击/尺寸检查：尚未获本机静态预览许可；DOM替身不证明浏览器行为', '真实Provider、业务资料、生产执行、后台保存、安全隔离及工程验收', '用户产品与UI Gate']};
console.log(JSON.stringify(result, null, 2));
process.exitCode = checks.every((c) => c.passed) ? 0 : 1;
