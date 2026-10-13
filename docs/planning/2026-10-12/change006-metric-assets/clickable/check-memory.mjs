// Review-only Node probe. Minimal element stubs are NOT a browser/layout/a11y test.
// It drives only this Demo's memory handlers; no production, files, or Provider effects.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('./assets.js', import.meta.url), 'utf8');
const ids = new Map(), nodes = [], documentEvents = new Map();
let activeElement;
class Element {
  constructor(attrs = '', owner = null) {
    this.attrs = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    this.id = this.attrs.id || ''; this.owner = owner; this.isConnected = true;
    this.dataset = {}; for (const [k, v] of Object.entries(this.attrs)) if (k.startsWith('data-')) this.dataset[k.slice(5)] = v;
    this.disabled = /(?:^|\s)disabled(?:\s|$)/.test(attrs); this.hidden = /(?:^|\s)hidden(?:\s|$)/.test(attrs);
    this.value = ''; this.textContent = ''; this.open = false; this.handlers = new Map();
    this.classList = { add() {}, remove() {}, toggle() {} };
    nodes.push(this); if (this.id) ids.set(this.id, this);
  }
  set innerHTML(value) {
    this.html = value;
    for (const node of nodes.filter(n => n.owner === this && n.isConnected)) {
      node.isConnected = false; if (node.id && ids.get(node.id) === node) ids.delete(node.id);
    }
    parse(value, this);
  }
  get innerHTML() { return this.html || ''; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, f) { if (!this.handlers.has(k)) this.handlers.set(k, []); this.handlers.get(k).push(f); }
  focus() { if (this.isConnected) activeElement = this; }
  showModal() { this.open = true; } close() { this.open = false; }
  closest(selector) { return selector === '[data-action]' && this.dataset.action ? this : null; }
}
function parse(source, owner = null) { for (const m of source.matchAll(/<[a-z][\w-]*\b([^>]*)>/gi)) new Element(m[1], owner); }
parse(html);
const query = selector => nodes.filter(n => n.isConnected && (selector === '[data-tab]' ? n.dataset.tab : n.dataset.action === selector.match(/data-action="([^"]+)"/)?.[1]));
const doc = { getElementById: id => ids.get(id), querySelectorAll: query, querySelector: s => query(s)[0], addEventListener: (k, f) => { if (!documentEvents.has(k)) documentEvents.set(k, []); documentEvents.get(k).push(f); } };
const context = vm.createContext({ document: doc, console });
assert(script.includes("state=initial('normal');render();"));
vm.runInContext(script.replace("state=initial('normal');render();", "state=initial('normal');render();globalThis.probe={get state(){return state;}};"), context);
const state = () => context.probe.state;
const el = id => { assert(ids.get(id), 'missing element ' + id); return ids.get(id); };
const fire = (node, kind, extra = {}) => { const e = { target: node, currentTarget: node, preventDefault() {}, ...extra }; for (const f of node.handlers.get(kind) || []) f(e); for (const f of documentEvents.get(kind) || []) f(e); };
const click = id => fire(el(id), 'click');
const action = key => { const n = query('[data-action="' + key + '"]')[0]; assert(n && !n.disabled, 'action unavailable: ' + key); fire(n, 'click'); };
const scene = key => { el('scene').value = key; fire(el('scene'), 'change'); };
const text = () => el('workspace-body').innerHTML;
const checks = [];
function check(name, body) { body(); checks.push(name); }

check('正常：候选≠批准，一次批准后合成推进至保存', () => {
  click('manage'); action('check'); assert(!state().approved); action('approve'); click('back');
  click('advance'); assert.equal(state().phase, 'running'); click('advance'); assert.equal(state().phase, 'checking'); click('advance'); assert.equal(state().phase, 'saved');
  action('report'); assert(text().includes('P1净额70元，P2净额80元'));
});
check('第二任务：保留项目批准，重新待开始，不复制结果', () => {
  click('back'); action('second'); assert.equal(state().taskNumber, 2); assert(state().approved); assert.equal(state().phase, 'idle');
});
for (const key of ['original', 'tamper', 'collision']) check(key + '：不可批准，无部分生效', () => {
  scene(key); action('check'); assert(!state().approved); assert(query('[data-action="approve"]')[0].disabled);
});
check('采用配置保存失败：候选保留但未生效', () => { scene('savefail'); action('check'); action('approve'); assert(state().saveFailed); assert(!state().approved); });
check('缺资料／歧义：合成推进不得跳过', () => { for (const key of ['missing', 'ambiguity']) { scene(key); click('advance'); assert.equal(state().phase, key); } action('chooseCompletion'); assert.equal(state().phase, 'idle'); assert.equal(state().version, 'completion'); });
check('仅启用项目新版：当前报告仍是支付归属', () => { scene('version'); action('report'); action('version'); click('activate-version'); assert.equal(state().projectVersion, 'completion'); assert.equal(state().version, 'payment'); assert(text().includes('P1净额70元，P2净额80元')); assert(!el('version-dialog').open); });
check('当前换版：未重算不展示新版数字或下载新回执', () => {
  scene('version'); action('report');
  action('version'); click('adopt-version'); assert.equal(state().phase, 'idle'); assert(text().includes('P1净额70元，P2净额80元')); assert(!text().includes('P1净额100元，P2净额50元')); assert(query('[data-action="receipt"]')[0].disabled); assert(activeElement.isConnected);
  click('back'); click('advance'); click('advance'); click('advance'); action('report'); assert(text().includes('P1净额100元，P2净额50元'));
  click('history'); assert(text().includes('P1净额70元，P2净额80元'));
});
check('仅当前换版：项目默认不变，下一任务仍原版', () => { assert.equal(state().projectVersion, 'payment'); click('new'); assert.equal(state().version, 'payment'); assert.equal(state().phase, 'idle'); });
check('合格零分母：受限报告不误报零率／全部护栏通过', () => { scene('zerodenom'); click('advance'); assert.equal(state().phase, 'limited'); action('report'); assert(text().includes('P2净额−30元')); assert(text().includes('不足，不是0%')); assert(text().includes('若目标要求可用风险护栏')); action('receipt'); assert.equal(state().phase, 'limited'); });
check('失败仍可看旧报告，不标当前成功', () => { scene('calcfail'); click('advance'); assert.equal(state().phase, 'failed'); action('history'); assert(text().includes('历史报告')); assert(text().includes('P1净额70元，P2净额80元')); });
check('停止／读历史／返回不执行，显式恢复仍待开始', () => { scene('stopped'); click('history'); click('back'); click('advance'); assert.equal(state().phase, 'stopped'); action('resume'); assert.equal(state().phase, 'idle'); });
check('下载失败后只重试下载，执行状态不变', () => { scene('downloadfail'); action('report'); action('receipt'); assert(state().download.includes('失败')); assert.equal(state().phase, 'saved'); action('receipt'); assert(state().download.includes('未生成真实文件')); assert.equal(state().phase, 'saved'); });
check('任意输入转义，不注入HTML或伪装已执行', () => { scene('missing'); el('message').value = '<img src=x onerror=alert(1)>'; fire(el('composer'), 'submit'); assert(el('thread').innerHTML.includes('&lt;img')); assert.equal(state().phase, 'missing'); });
check('抽屉键盘分类与关闭，专业参考能切换', () => { click('details'); fire(el('tab-meaning'), 'keydown', { key: 'End' }); assert.equal(state().tab, 'execution'); click('close'); assert(el('drawer').hidden); click('professional'); assert(!el('professional-view').hidden); click('quick'); assert(el('professional-view').hidden); });
console.log(JSON.stringify({ kind: 'MINIMAL_ELEMENT_STUB_ONLY', passed: checks.length, checks, not_run: ['browser', 'layout', 'actual keyboard/focus accessibility', 'real file parsing in UI', 'Provider', 'computation', 'storage', 'download'] }, null, 2));
