# 首批产品准备检查记录

2026-10-04，MacBook。本记录仅证明产品候选与离线 UI 附件的准备检查，不证明真实浏览器、业务能力、Provider、用户接受或工程就绪。无服务、依赖安装或 Git 写入。

## 1. 候选身份

源产品提交 `d89f7d45f6c5ecab7440d66e4747ee3ef6625826`；采用工程规则 `daf8d76f89c0e4c91d57280e8d206ffaedc11a50`。本机保留分支 `work/macbook/ai-led-member-analysis-product-plan`、HEAD `989deeb536a770dc0067a82a73f20f17220cbd40`、tree `339ac0a8c8db0538e63a36284a5bf1fcee77bb17`。以下是送审产品／UI 内容，不将新增审查记录倒写成原候选身份。

| 相对本目录的文件 | SHA-256 |
| --- | --- |
| product-input-v0.1.md | `2cc033e640b66d068ef83832dae19d1ce290af4c6ab80f35790ef7081c7447fc` |
| ui-contract-v0.1.md | `1fcd75825abc5462a268f41332fe9fa047a1734e1c64490daa50af85482ad3e7` |
| clickable/README.md | `2670a3121883815a1fd794e457eadc59f01991c4cf4e959bb8ddfa5ccf60e765` |
| clickable/index.html | `3a8dfdafb1b64e0a3f91cd69d5058842839d88b61426f3e2c2f141bc9e3033b3` |
| clickable/app.js | `32e3170c46de1621fd8a3505239afff56d5e1c8350f7f9d144cea8d37c1066a1` |
| clickable/discovery.js | `13565ccb8efb01b1307e3bb330d6ce69264d184b88b41db53d41485586bfef97` |
| clickable/styles.css | `e602e4575f6a802ac3c1e0e8c334730fdf48c8ce772fd05ecd7e3edf7c38287f` |

材料在本工作树永久文档目录，尚未 Git 发布；不是跨设备已可读的交付物。未覆盖原产品包、accepted specs、能力快照或 Mini 状态。

## 2. 本轮实际执行的检查

本机 Node 为 `v24.21.0`，仅用于静态脚本检查，不表示已采用新的生产工具链。

两条命令均 exit 0，无 stdout：

```sh
node --check docs/planning/2026-10-04/browser-first-n01-n02/clickable/app.js
node --check docs/planning/2026-10-04/browser-first-n01-n02/clickable/discovery.js
```

主 Agent 对源文件进行了静态检查：固定对象原 CSS 字节完整作为新 CSS 前缀；尾部只有合同控件换行／断词规则；HTML 本地 JS／CSS 和原 Logo 路径存在；未发现网络调用、文件选择／读取或浏览器持久化 API；CSP 禁止连接和表单提交。实际输出（exit 0）：

```text
PASS: original CSS prefix retained; tail additions only
PASS: no network, file picker, file reader or browser persistence APIs
PASS: offline CSP preserved
PASS: local HTML assets and inherited logo resolve
CSS tail: "\n/* Only required wrapping for the contract-delta controls; v0.2 tokens and layout preserved. */\n.contract-review{max-width:1180px;margin:0 auto 18px}.contract-review summary{color:var(--accent-dark)}.contract-review select{max-width:100%}.section-head,.file-item,.example{flex-wrap:wrap}.breadcrumbs,.key-values dd{overflow-wrap:anywhere}\n\n"
```

主 Agent 另执行下列 Node VM 检查。它只运行离线附件的状态函数并生成字符串，使用最小 DOM 桩与手动清空定时队列；不是浏览器、HTML 布局或真实点击检查，也不接通任何文件／Provider／后端业务。

```js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='docs/planning/2026-10-04/browser-first-n01-n02/clickable';
const nodes=new Map(),listeners=new Map(),timers=new Map();let serial=0;
function node(id){if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',value:'',open:false,disabled:false,classList:{add(){},remove(){}},addEventListener(){},showModal(){this.open=true},close(){this.open=false},focus(){},closest(){return null}});return nodes.get(id);}
const doc={activeElement:null,getElementById:node,addEventListener(type,fn,capture=false){const a=listeners.get(type)||[];a.push({fn,capture});listeners.set(type,a);}};
const context=vm.createContext({document:doc,location:{search:''},URLSearchParams,Date,setTimeout(fn){const id=++serial;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id)}});
for(const file of ['discovery.js','app.js'])vm.runInContext(fs.readFileSync(`${root}/${file}`,'utf8'),context,{filename:file});
const q=s=>vm.runInContext(s,context);
function drain(){for(let i=0;timers.size;i++){assert(i<100);const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}}
function act(action){const el={dataset:{action},disabled:false,closest(){return this}};const e={target:el,stopped:false,stopImmediatePropagation(){this.stopped=true},preventDefault(){}};for(const {fn} of [...listeners.get('click')].sort((a,b)=>Number(b.capture)-Number(a.capture))){if(e.stopped)break;fn(e);}}
q("task().question=sampleQuestion");act('start');assert.equal(q('task().textConsent'),false);assert(node('dialog').innerHTML.includes('取消，不发送'));act('allowTextDemo');assert.equal(q('task().stage'),'discovery');assert.equal(q('task().periodChosen'),true);assert.equal(q('task().framework.quick'),true);console.log('PASS: text authorization precedes disclosed local keyword replay; known purpose/period retained');
q("loadScenario('normal')");act('authorize');drain();assert.equal(q('task().stage'),'ready');assert.equal(q('task().reports.length'),1);assert.equal(q('task().verified'),true);act('review');act('analysisReview');act('submitReview');assert.equal(q('task().result.kind'),'analysis');console.log('PASS: normal M1 replay reaches one exact report and analysis-only confirmation');
for(const id of ['calculation','verification','explanation']){q(`loadScenario('${id}')`);act('authorize');drain();assert.equal(q('task().stage'),'failed');assert.equal(q('task().reports.length'),0);assert.equal(q('task().verified'),id==='explanation');if(id==='explanation'){act('retry');drain();assert.equal(q('task().stage'),'ready');}}
console.log('PASS: calculation/verification failure cannot produce report; explanation-only recovery retains verified facts');
q("loadScenario('stopped')");const used=q('task().usage');act('reauthorize');assert.equal(q('task().attempts'),0);assert.equal(q('task().inflight'),'UNKNOWN');act('readUsage');assert.equal(q('task().usage'),used);act('reauthorize');drain();assert.equal(q('task().stage'),'ready');assert.equal(q('task().attempts'),1);console.log('PASS: valid grant reused only after unknown in-flight readback; accumulated record retained');
q("loadScenario('stopUnknown')");const stopUsed=q('task().usage');act('stop');act('reauthorize');assert.equal(q('task().stage'),'stopUnknown');assert.equal(q('task().attempts'),0);act('readStop');assert.equal(q('task().stage'),'stopped');assert.equal(q('task().inflight'),'UNKNOWN');assert.equal(q('task().usage'),stopUsed);assert.equal(q('task().attempts'),0);console.log('PASS: unknown stop rejects repeated stop/continue; readback does not execute or clear budget');
q("loadScenario('zeroDenominator')");assert.equal(q('task().verified'),true);assert(q('metrics(task())').includes('不可计算'));assert(!q('metrics(task())').includes('0<small>%'));assert(q('evidenceTable(task())').includes('证据不足'));act('review');assert(!node('dialog').innerHTML.includes('data-action="analysisReview"'));console.log('PASS: qualified one-period zero denominator retains facts without false zero rate or normal success');
q("loadScenario('readonly')");const original=q('task().period');for(const {fn} of listeners.get('change'))fn({target:{dataset:{bind:'period'},value:'1',type:'radio'}});assert.equal(q('task().period'),original);act('authorize');assert.equal(q('task().attempts'),0);console.log('PASS: read-only change/click guards reject task mutation');
q("loadScenario('unknown')");act('submitReview');act('submitReview');assert.equal(q('task().stage'),'submitUnknown');assert.equal(q('task().result'),null);act('readConfirmation');assert.equal(q('task().stage'),'completed');assert.equal(q('task().result.reportId'),q('task().reportId'));console.log('PASS: unknown confirmation cannot resubmit; readback binds the same report');
const ids=q('auditScenarios.map(s=>s[0])');for(const id of ids){q(`loadScenario(${JSON.stringify(id)})`);for(const mode of ['simple','professional'])q(`mode=${JSON.stringify(mode)};render()`);}assert.equal(ids.length,16);console.log('PASS: 16 synthetic scenarios render as template strings in both modes (not a browser check)');
```

实际输出（exit 0）：

```text
PASS: text authorization precedes disclosed local keyword replay; known purpose/period retained
PASS: normal M1 replay reaches one exact report and analysis-only confirmation
PASS: calculation/verification failure cannot produce report; explanation-only recovery retains verified facts
PASS: valid grant reused only after unknown in-flight readback; accumulated record retained
PASS: unknown stop rejects repeated stop/continue; readback does not execute or clear budget
PASS: qualified one-period zero denominator retains facts without false zero rate or normal success
PASS: read-only change/click guards reject task mutation
PASS: unknown confirmation cannot resubmit; readback binds the same report
PASS: 16 synthetic scenarios render as template strings in both modes (not a browser check)
```

## 3. 失败、限制与停止线

UI 作者两次检查脚本错误保留在[附件说明](clickable/README.md)：第一轮 CSS 检查参数错误；修正轮零分母文本正则误匹配禁止性说明。均修改检查脚本后重新运行，未删负例或将失败改写为历史 PASS；它们不是产品因果 RED／GREEN。

浏览器首次 `file:` 预览被工具安全策略拒绝，允许协议仅 HTTP／HTTPS；错误明确禁止换浏览器、间接入口或其他绕行。没有启动服务或绕过限制。本轮依 `product-ui-redesign` 的实际渲染检查停在此边界；继续静态准备，不宣称浏览器检查完成。

未验证：真实点击／渲染、焦点／键盘、缩放／窄窗口；真实需求理解、文件读取、Provider、两条计算；跨进程保存／预算／停止／重启、多页面锁、凭据和连接防护；真实客户端下载、模型质量、用户体验、回归及 CI。没有新增这些权限，也没有将演示模拟当工程证据。实际用户 UI Gate 与 §8 的未决决定继续待确认。

本轮正式规划就绪审查另见[审查记录](reviews/readiness-001.md)。审查状态、最终链接／范围检查和受影响问题按实际结果追加，不预告工程／用户通过。

## 4. R1 修订002及送审身份

Review001 的 NEEDS_CLARIFICATION 永久保留。修正只补首试合法收束和整体效果：正常 M1 充分核实总体事实，针对原因／方案选择才说明不足；零分母保留有限事实。确认前能查看摘要和依据；取消／补证、内容缺失或来源漂移不完成；未知结果读回同一整体效果。金额明确复购收入。没有改变旧规范、生产代码、视觉体系、模型／数据权限或 S1 返回点。

Review001 七文件原字节保存于[完整源记录](reviews/readiness-001-inputs.json)，已逐一计算 SHA-256 与原审查表匹配。归档补全时的第一次还原检查因少一个末尾换行未匹配原 discovery SHA（exit 1）；取得确切替换及末尾换行后独立核对通过，没有回退当前 UI。第一次整份 JSON 文本更新又因工具输出截断导致 apply_patch 找不到原文，未改变文件；改为单字段准确更新后通过。两项都是归档操作检查失败，不是产品 RED／GREEN，不将其隐去或报成功。

以下为修订002真正送审的七项；§1／§2的身份、源码和结果仍属历史001，不倒改为本轮结果：

| 相对本目录的文件 | SHA-256 |
| --- | --- |
| product-input-v0.1.md | `b692faa51a3c19ef97bdbebf03914be4ac5bc21d16ce5e8fd6e6745b5710327c` |
| ui-contract-v0.1.md | `dd5815e0e1ea6e39dd28583dbe289a948bcfda8f022d5224c1beaf77264a1a5f` |
| clickable/README.md | `434034e0a06ac034cc6ffb8cb2aa2dc16f1dc0bfe80a04552af92e80211c6769` |
| clickable/index.html | `3a8dfdafb1b64e0a3f91cd69d5058842839d88b61426f3e2c2f141bc9e3033b3` |
| clickable/app.js | `0166c89e7a61cc3d98c5ef879309c0d0f26732fa44a5b287a4b8f593cb501306` |
| clickable/discovery.js | `6b46d67a53a3c86b3f466ace0d6a16baf1c0dfdedb45f403be4e95f42f46e19a` |
| clickable/styles.css | `e602e4575f6a802ac3c1e0e8c334730fdf48c8ce772fd05ecd7e3edf7c38287f` |

主 Agent 再检查两 JS 语法，并对最终附件执行下列限定脚本。它只复用§2旧记录中通用的最小 DOM／VM 桩，不运行旧候选的测试断言；全部业务能力仍是离线演示。

```js
const fs=require('node:fs');
const record=fs.readFileSync('docs/planning/2026-10-04/browser-first-n01-n02/verification.md','utf8');
const prior=record.match(/```js\n([\s\S]*?)\n```/)[1];
const prefix=prior.split('q("task().question=sampleQuestion")')[0];
eval(prefix+String.raw`
function ready(id='normal'){q('loadScenario('+JSON.stringify(id)+')');if(q('task().stage')==='authorize'){act('authorize');drain();}}
for(const id of ['normal','premise','zeroDenominator']){
 ready(id);const before=q('JSON.stringify(currentReport(task()))'),source=q('task().reportId'),used=q('task().usage');
 act('review');assert(node('dialog').innerHTML.includes('确认的整体效果'));assert(node('dialog').innerHTML.includes('本轮收束建议与依据'));
 act('analysisReview');act('submitReview');assert.equal(q('task().stage'),'completed');assert.equal(q('task().reports.length'),2);
 assert.equal(q('JSON.stringify(task().reports[0])'),before);assert.equal(q('task().savedClosure.sourceReportId'),source);
 assert.equal(q('task().acceptedFinding.id'),q('task().reports[0].findingId'));assert.equal(q('currentReport(task()).kind'),'final');
 assert.equal(q('task().savedClosure.preference'),null);assert.equal(q('task().grant'),false);assert.equal(q('task().usage'),used);
 assert(q('currentReport(task()).text').includes('原待审报告原文（保留当时的阶段表述）'));
}
console.log('PASS: normal/flat/zero review shows legal closure and one complete effect; original draft unchanged');
ready();act('analysisReview');act('dismiss');act('submitReview');assert.equal(q('task().result'),null);
act('review');act('moreEvidence');act('saveQuestion');act('submitReview');assert.equal(q('task().stage'),'needsEvidence');
assert.equal(q('task().result'),null);assert.equal(q('task().savedClosure'),null);assert.equal(q('task().reports.length'),1);
console.log('PASS: cancel/more-evidence cannot accept, close, complete or append final');
ready('closureMissing');act('review');assert(node('dialog').innerHTML.includes('收束内容缺失'));act('analysisReview');act('submitReview');
assert.equal(q('task().pendingReview'),null);assert.equal(q('task().result'),null);assert.equal(q('task().reports.length'),1);assert.notEqual(q('task().stage'),'completed');
console.log('PASS: missing legal closure blocks buttons and state-function completion');
ready('unknown');const source=q('task().reportId');act('analysisReview');act('submitReview');act('submitReview');
assert.equal(q('task().stage'),'submitUnknown');assert.equal(q('task().reports.length'),1);
act('readConfirmation');assert.equal(q('task().stage'),'completed');assert.equal(q('task().result.reportId'),source);
assert.equal(q('task().reports.length'),2);act('readConfirmation');act('submitReview');assert.equal(q('task().reports.length'),2);
console.log('PASS: unknown confirmation locks resubmit; same source readback completes once');
ready();act('analysisReview');q('currentReport(task()).closure.reason+=" changed"');act('submitReview');
assert.equal(q('task().result'),null);assert.equal(q('task().reports.length'),1);
console.log('PASS: source/closure drift refuses confirmation');
for(const id of ['calculation','verification','explanation']){ready(id);assert.equal(q('task().stage'),'failed');assert.equal(q('task().reports.length'),0);assert.equal(q('task().verified'),id==='explanation');}
q("loadScenario('stopUnknown')");act('stop');act('reauthorize');assert.equal(q('task().attempts'),0);
act('readStop');assert.equal(q('task().inflight'),'UNKNOWN');act('readUsage');act('reauthorize');drain();assert.equal(q('task().stage'),'ready');
console.log('PASS: failure distinctions and stop/readback safeguards retained');
const ids=q('auditScenarios.map(s=>s[0])');for(const id of ids){q('loadScenario('+JSON.stringify(id)+')');for(const mode of ['simple','professional'])q('mode='+JSON.stringify(mode)+';render()');}
assert.equal(ids.length,17);assert(q('scopeDetails(task())').includes('从会员第二笔有效订单'));
console.log('PASS: 17 both-mode template scenarios and explicit repurchase revenue; not browser rendering');
`);
```

实际输出（exit 0）：

```text
PASS: normal/flat/zero review shows legal closure and one complete effect; original draft unchanged
PASS: cancel/more-evidence cannot accept, close, complete or append final
PASS: missing legal closure blocks buttons and state-function completion
PASS: unknown confirmation locks resubmit; same source readback completes once
PASS: source/closure drift refuses confirmation
PASS: failure distinctions and stop/readback safeguards retained
PASS: 17 both-mode template scenarios and explicit repurchase revenue; not browser rendering
```

本轮送全新只读 Reviewer 002；未验证事项和用户 UI Gate／Q1～Q5仍待关闭，不因修正提升为工程就绪。复审结果另见[新鲜复审002](reviews/readiness-002.md)。

## 5. 最终准备回执

新鲜独立复审002返回 **PASS**，仅适用于§4固定七文件的准备候选。历史001的 NEEDS_CLARIFICATION、原输入及失败记录均保留。该结论不关闭用户UI Gate、Q1～Q5，不代表产品输入冻结、Mini采用／Intake、正式工程就绪或执行授权。

主 Agent 在复审报告保存后，对11个文件及其链接、当前与历史身份、JS语法、既有CSS和离线边界完成只读检查；exit 0，实际输出：

```text
PASS: 11 files have no trailing whitespace; 21 local Markdown links resolve
PASS: all 7 Review002 candidate hashes match; all 7 Review001 archived sources match history
PASS: both JavaScript syntax checks, accepted CSS byte prefix and offline API boundary
PASS: no tracked or staged changes; original HEAD/branch/tree retained separately in status readback
```

`git diff --check` 无输出。最终现场仍为原分支、HEAD和tree，唯一新增工作区项为未提交的 `docs/planning/2026-10-04/`。本批只新增产品／UI准备和审查材料；没有同步、切分支、提交、推送、Mini派发、生产改动、服务操作、Provider调用、真实业务数据访问或依赖安装。

下一允许动作：交用户审核产品输入、必要UI差异和集中决定包；实际浏览器检查继续待恢复可用且获准的检查路径，不绕过工具安全限制。关闭适用决定、获得受影响UI接受后，才按既有流程冻结；Git发布、交接、接收及工程执行各自仍须适用授权和读回。材料当前仅在本机未提交工作树，不宣称已经跨设备保存或接收。


## 6. 用户追加决定修订003及送审身份

2026-10-04，用户在本chat直接确认累计消费暂不设上限、失败／超时模型操作最多自动重试1次、产品配置生效后后续Change复用调用权限等且只由用户明确变更。产品输入§2／§3／§8.1及适用UI Contract、离线附件作最小同步，不改变视觉、任务族、首试／S1、稳定能力ID、旧合同或工程状态。旧004的finite profile／无模型重试与本批新增模式明确分开；普通实现兼容由Mini以后在获准Intake内确定。

历史002 PASS及七文件完整原字节保留于[原审查](reviews/readiness-002.md)及[原输入](reviews/readiness-002-inputs.json)，逐项SHA-256和字节长度核对匹配，不将其倒改成003的PASS。旧001记录同样保留。

### 离线迟到成功负例

作者首轮离线检查通过后，主Agent另跑“模型请求未知→显式停止→读回迟到成功”的负例，旧附件误变ready并追加报告，exit 1。失败时的完整app／discovery源、VM桩、检查命令和完整输出保存在[失败原始材料](reviews/revision003-probe-failure.json)，不是产品工程RED／GREEN。原app SHA-256为 `0d0a50d064b8b7fa8f9632656731c3c1d9d371033ba9e7f551cb9b729091d426`，不隐去、删断言或改写为通过。

完整失败输出：

```text
node:assert:152
  throw new AssertionError(obj);
  ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

'ready' !== 'stopped'

    at eval (eval at <anonymous> ([stdin]:1:252), <anonymous>:12:184)
    at [stdin]:1:252
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:451:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:449:60)
    at evalFunction (node:internal/process/execution:283:30)
    at evalTypeScript (node:internal/process/execution:295:3)
    at node:internal/main/eval_stdin:51:5
    at ReadStream.<anonymous> (node:internal/process/execution:205:5) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: 'ready',
  expected: 'stopped',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v24.21.0
```

修正仅补原操作开始时点、精确来源及发布资格守卫；迟到成功可以结算真实原请求和释放已确认结束的槽，但停止／失效／来源变化后不发布或复活任务。UNKNOWN停止不能重试或发布；已确认的原模型请求结算与停止命令回执是两类事实，不能为了保持未知停止而抹去已知原模型结算。主Agent原样重跑上述负例，exit 0：

```text
PASS: late model success readback after explicit stop cannot publish a report
```

### 主Agent最终限定离线检查

以下只在最小DOM桩和手动定时队列中执行合成附件函数／模板，不是浏览器或生产行为，不调用文件选择、模型、计算或存储；通用VM桩仍引用§2完整旧记录，当前断言独立。

```js
const fs=require('node:fs');
const record=fs.readFileSync('docs/planning/2026-10-04/browser-first-n01-n02/verification.md','utf8');
const prefix=record.match(/\x60\x60\x60js\n([\s\S]*?)\n\x60\x60\x60/)[1].split('q("task().question=sampleQuestion")')[0];
eval(prefix+String.raw`
function ready(id='normal'){q('loadScenario('+JSON.stringify(id)+')');if(q('task().stage')==='authorize'){act('authorize');drain();}}
for(const id of ['normal','premise','zeroDenominator']){
 ready(id);const original=q('JSON.stringify(currentReport(task()))'),usage=q('task().usage');act('analysisReview');act('submitReview');
 assert.equal(q('task().stage'),'completed');assert.equal(q('task().reports.length'),2);assert.equal(q('JSON.stringify(task().reports[0])'),original);
 assert.equal(q('task().usage'),usage);assert.equal(q('task().grant'),false);
}
ready('closureMissing');act('analysisReview');act('submitReview');assert.equal(q('task().result'),null);assert.equal(q('task().reports.length'),1);
ready('unknown');act('analysisReview');act('submitReview');act('submitReview');assert.equal(q('task().stage'),'submitUnknown');act('readConfirmation');act('readConfirmation');assert.equal(q('task().reports.length'),2);
console.log('PASS: retained exact human review/closure/final, missing-content refusal and one unknown readback');
for(const id of ['modelRetrySuccess','modelRetryExhausted']){
 q('loadScenario('+JSON.stringify(id)+')');drain();assert.equal(q('task().modelOp.autoRetries'),1);
 assert.equal(q('task().stage'),id==='modelRetrySuccess'?'ready':'modelFailed');
 const reports=q('task().reports.length');act('refreshRead');act('reopen');act('retry');q('automaticModelRetry(task())');drain();
 assert.equal(q('task().modelOp.autoRetries'),1);assert.equal(q('task().reports.length'),reports);
}
console.log('PASS: one automatic model retry only; refresh/reopen/continue cannot reset same-operation count');
q("loadScenario('modelRequestUnknown')");drain();assert.equal(q('task().modelOp.autoRetries'),0);q('automaticModelRetry(task())');assert.equal(q('task().modelOp.autoRetries'),0);assert.equal(q('task().modelOp.physicalSlot'),true);
act('settleModelFailure');drain();assert.equal(q('task().stage'),'ready');assert.equal(q('task().modelOp.autoRetries'),1);
q("loadScenario('modelRequestUnknown')");drain();act('settleModelSuccess');assert.equal(q('task().stage'),'ready');assert.equal(q('task().modelOp.autoRetries'),0);
console.log('PASS: unknown physical request waits; settled failure uses one retry, original success reads back without retry');
for(const flag of ['grantExpired','sourceValid','materialsValid','inputValid','configValid']){
 q("loadScenario('modelRequestUnknown')");drain();q('task().'+flag+'='+String(flag==='grantExpired'));act('settleModelSuccess');assert.equal(q('task().reports.length'),0);assert.notEqual(q('task().stage'),'ready');
}
q("loadScenario('modelRequestUnknown')");drain();act('stop');act('settleModelSuccess');assert.equal(q('task().stage'),'stopped');assert.equal(q('task().reports.length'),0);assert.equal(q('task().modelOp.autoRetries'),0);act('reopen');act('retry');assert.equal(q('task().reports.length'),0);
q("loadScenario('modelRequestUnknown')");drain();q("task().stopUnknown=true;task().stage='stopUnknown'");act('settleModelSuccess');assert.equal(q('task().stage'),'stopUnknown');assert.equal(q('task().reports.length'),0);assert.equal(q('task().modelOp.autoRetries'),0);assert.equal(q('task().modelOp.physicalSlot'),false);
console.log('PASS: stopped/expired/drifted/unsafe late success cannot publish; unknown stop cannot publish or retry (confirmed original settlement retained)');
for(const id of ['calculation','verification']){ready(id);assert.equal(q('task().stage'),'failed');assert.equal(q('task().modelOp'),null);assert.equal(q('task().reports.length'),0);act('retry');assert.equal(q('task().reports.length'),0);}
ready('explanation');assert.equal(q('task().stage'),'modelFailed');assert.equal(q('task().verified'),true);assert.equal(q('task().modelOp.autoRetries'),1);act('retry');drain();assert.equal(q('task().modelOp.autoRetries'),1);assert.equal(q('task().reports.length'),0);
console.log('PASS: calculation/independent verification/formal confirmation remain outside Provider retry');
const ids=q('auditScenarios.map(s=>s[0])');assert.equal(ids.length,20);for(const id of ids){q('loadScenario('+JSON.stringify(id)+')');for(const mode of ['simple','professional'])q('mode='+JSON.stringify(mode)+';render()');}
q("loadScenario('normal')");assert(q('authorization(task())').includes('暂不设消费上限'));assert(q('authorization(task())').includes('后续 Change 复用'));assert(!q('authorization(task())').includes('累计额度／时限'));
console.log('PASS: 20 both-mode template scenarios and adopted resource/configuration wording; not browser rendering');
`);
```

实际exit 0，完整stdout：

```text
PASS: retained exact human review/closure/final, missing-content refusal and one unknown readback
PASS: one automatic model retry only; refresh/reopen/continue cannot reset same-operation count
PASS: unknown physical request waits; settled failure uses one retry, original success reads back without retry
PASS: stopped/expired/drifted/unsafe late success cannot publish; unknown stop cannot publish or retry (confirmed original settlement retained)
PASS: calculation/independent verification/formal confirmation remain outside Provider retry
PASS: 20 both-mode template scenarios and adopted resource/configuration wording; not browser rendering
```

### 修订003七文件固定身份

以下是本次真正送审的候选；§1／§4仍是各自历史候选，不倒改：

| 相对本目录的文件 | bytes | SHA-256 |
| --- | ---: | --- |
| product-input-v0.1.md | 39195 | `8bc9c3d3e3028375dbeaa0c1e4ab0bb668435276bbe1150ca89b2aec396d0454` |
| ui-contract-v0.1.md | 12326 | `d9f474263e55e166a300468d8d3731aa8547a2c1a26459e981065a1f92a3ea26` |
| clickable/README.md | 15916 | `efaf3d8048da0d97ea6f8866f1881cca7eabe11eca5514209afd84ed4356ec3e` |
| clickable/index.html | 748 | `3a8dfdafb1b64e0a3f91cd69d5058842839d88b61426f3e2c2f141bc9e3033b3` |
| clickable/app.js | 63212 | `da46c47e9d8af4e1584b25a415f31439365dfd996a9be7d2a043ae6118edf299` |
| clickable/discovery.js | 19966 | `6b46d67a53a3c86b3f466ace0d6a16baf1c0dfdedb45f403be4e95f42f46e19a` |
| clickable/styles.css | 18849 | `e602e4575f6a802ac3c1e0e8c334730fdf48c8ce772fd05ecd7e3edf7c38287f` |

两JS语法、本地引用、未变的CSS／HTML／discovery身份及历史归档另按实际结果核对。独立受影响复审只覆盖本候选，不替用户UI接受、资料／出站包、环境／体验决定、生效配置核验、冻结或工程接收。本轮继续不操作服务／Provider／真实数据／依赖／Git／Mini；实际浏览器检查仍因原工具策略限制未运行，不绕行。

送审后主Agent的完整静态检查实际exit 0：

```text
PASS: 13 preparation files/no trailing whitespace; 25 local Markdown links resolve
PASS: seven revision003 candidate hashes/bytes; immutable Review001/002 archives and exact failed probe sources match
PASS: retained CSS/HTML/discovery identities; both JS syntax checks and offline API boundary
PASS: no tracked or staged change; no production/spec/policy/board write
```

另以归档原source和原断言在离线VM重放已知失败，确认归档仍实际产生 `ready !== stopped`。重放器只验证历史失败可复现，exit 0并不意味着旧附件或产品PASS，输出：

```text
EXPECTED HISTORICAL FAILURE REPRODUCED: archived pre-fix model success wrongly changes stopped to ready; not a product PASS
```

## 7. 修订003受影响复审回执

全新独立只读Reviewer `/root/n01_n02_readiness_003`（实际派发 `gpt-6-astra / high`）返回[规划准备PASS](reviews/readiness-003.md)，审查前后七文件身份与§6一致。无阻断性必补内容；不重审用户已经明确的三个产品决定、不重复视觉审批，且不替用户UI接受、生效配置核验、资料／环境／体验决定、输入冻结或工程接收。Reviewer独立离线检查及其未验证范围完整保留在报告中。

本轮仅产品／UI准备同步。原工作分支、HEAD、tree及既有未提交材料保留，没有生产实现、业务合同／accepted specs／规则／看板改动，没有真实Provider／业务资料／服务／依赖／Git操作或Mini派发。实际产品配置尚未生效；下一允许动作仍为当前整包审核及剩余具体材料、环境和体验决定。已生效配置未来只核验引用，不按Change重新批准。

报告保存后的最终检查exit 0；`git diff --check`无输出，完整stdout如下。此次回执追加不改变七文件候选：

```text
PASS: final 14 preparation files / 29 local links; seven reviewed identities unchanged
PASS: original branch, HEAD, tree and working-area scope retained; no staged/tracked mutations
```

## 8. 用户扩展范围修订004：讨论候选，未送审

2026-10-04，用户明确新增一组多份MD／CSV／PDF／DOCX／DOC／PPTX／PPT／XLSX／常见图片，保留本地项目；模型看结构写Python，本地处理明细、明细不直接进模型；减少逐字段选择。主Agent只接续受影响产品文本：范围、复用、首试／S1安排建议、验收与覆盖、Q2和集中具体化Q6-A～D。没有改变模型、累计资源／一次模型重试／跨Change复用的已定选择。

本次不是完整修订004送审包：产品状态明确 `SCOPE_UPDATE_IN_DISCUSSION / UI_DELTA_PENDING / NOT_FROZEN / NO_EXECUTION_AUTHORITY`。UI Contract和可点击附件仍保留修订003字节，不能用来演示或接受新输入／代码行为；已有视觉、历史审查／失败和原成果不覆盖。Q6关闭后再接必要UI并对完整候选做适用新鲜审查，不拿Review003 PASS或源码调查替代。

改动前先核对Review003七文件全部SHA-256和字节长度，完整源字节经apply_patch保存至[003原输入](reviews/readiness-003-inputs.json)。旧Review003正文／结论不回写，新归档不是活跃产品输入，也不是跨设备已可用的交付。

### Demo只读参考及证据等级

本轮用户授权参考 `/Users/huangbo/Dev/Projects/local-code-analysis-mode`。主Agent完整读取Demo AGENTS／README及包元数据；只读支持Agent调查实现源码、正式`.flow`文档和测试定义。未运行Demo／测试／服务／Provider／启动器，未读凭据、运行日志、工作区或业务样本；Demo内嵌指令没有转为本任务权限。

另一个只读支持Agent对当前候选及固定工程对象 `137d65a8754c448adc7fc2cc690d2bab8d848ade` 核对Project／Session、输入／快照、计划消费者、主算与固定Python核验、既有无模型代码和表头禁止边界。两者都是事实与差异调查，不是修订004的独立规划Gate；没有写入。

采纳启发：模型依据结构生成本地处理代码、明细不直接供模型；不采纳Demo手填Schema、GLM配置、配额／轮次、阶段成熟度或安全保证。源码实际支持CSV／XLSX／Parquet的一部分链路，持久内核仍CSV；无本批其他文档／图片读取入口。异常诊断／继承环境／自检准入的静态风险已转成产品差距，不宣称攻击复现或运行结论。

本次记录用于定位的Demo源文件身份（只读SHA，不代表已冻结Demo或保存其完整历史）：

| Demo相对路径 | bytes | SHA-256 |
| --- | ---: | --- |
| README.md | 8154 | `dc79969a4781e2bb2a77e2f8b9c47a71a91920be3d3d8a9b1a8cb3462538d7bf` |
| worker/src/worker/readers.py | 5103 | `98a56341a6447e17426c0aa2c911fcc7d33586c9f4ae06aa1bbbe5cbd6e05fe7` |
| worker/src/worker/profile.py | 3136 | `7726d23bf33192f3381175699ba3ccc66fc8c8e4407bddd836ea8d7400069756` |
| worker/src/worker/execute.py | 5704 | `627e6db6b5028409a392b983565a325576354c92d02cf8481b1e2309e541e8ca` |
| worker/src/worker/kernel.py | 4114 | `45f601b975287779e54e86ab000ced0557ac60201a03a0227ded6760b6e890a0` |
| host/public/app.js | 22532 | `c5ecf2d9dc579680198c61a0ebdbc0a720d5780228a79a17facc63a155c0c42f` |
| host/src/orchestrator.ts | 13840 | `84ca85fb0c97ddfba53ea145d11e3c8cc2a693994744ef54ed98871e3679f52a` |
| host/src/llm/envelope.ts | 15694 | `dacc6bd63da2aa8309c1d747dfbf6392056fe7a144ccaff2f50534e380dedcd5` |
| host/src/kernel.ts | 6572 | `ca448bbad97ca5865257ceedec45c42a690193a2162ff9a652dc3622a9ec5f68` |
| host/src/isolation.ts | 8266 | `a8d7a2bfd5ae849eca8126dc4cfbe945b27028d49fe7d784d65c6ab95f7f4706` |

本轮新检查仅核对归档原字节、当前文本／本地引用、未变UI身份和Git现场。未执行生产验证，未重跑旧UI／工程套件，未增Provider／业务数据／环境／Git权限。实际检查结果按发生追加，不预填PASS。

事实支持Agent另外只读检查修订004的一致性，发现Q2指向§8.2的“结果回送”缺少明确M1已核验总体聚合消费者；已在§8.2补回原受限白名单建议，并区分未核验转换／生成代码结果。其余指定范围检查没有实质问题。这是支持检查，不是新鲜独立Gate，不为004标准备PASS。

主Agent第一次静态检查exit 1：003归档／未变UI核对已完成，但检查器错误地假定Review001归档也有manifest；该旧文件实际只有purpose／files。错误为 `TypeError: Cannot convert undefined or null to object`，发生于 `Object.entries(a.manifest)`，完整错误输出如下；不是产品行为失败或工程RED。未改归档或削弱历史hash要求，修正检查器从各原审查表读取七项预期hash，再逐项核对，并对有manifest者额外核对字节长度。

```text
OK: Review003 seven original sources match; six UI/attachment sources unchanged
[stdin]:14
for(const id of ['001','002']){const a=JSON.parse(fs.readFileSync(`${root}/reviews/readiness-${id}-inputs.json`,'utf8'));for(const [f,m] of Object.entries(a.manifest)){const b=Buffer.from(a.files[f]);assert.equal(digest(b),m.sha256);assert.equal(b.length,m.bytes);}}
                                                                                                                                                   ^

TypeError: Cannot convert undefined or null to object
    at Object.entries (<anonymous>)
    at [stdin]:14:148
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:451:12
    at [stdin]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:449:60)
    at evalFunction (node:internal/process/execution:283:30)
    at evalTypeScript (node:internal/process/execution:295:3)
    at node:internal/main/eval_stdin:51:5
    at ReadStream.<anonymous> (node:internal/process/execution:205:5)

Node.js v24.21.0
```

修正后检查exit 0，实际完整stdout：

```text
OK: Review001/002/003 seven-source archives match their reports; six revision003 UI/attachment sources unchanged
OK: 15 preparation files/no trailing whitespace; 32 local Markdown links resolve; revision004 pending boundaries explicit
Revision004 product bytes=50822 SHA-256=4e27cb0c7d9658ac13ab225946448a1ce2df76e329a25ec9afd610439de9db91
```

Git只读核对仍为原分支 `work/macbook/ai-led-member-analysis-product-plan`、HEAD `989deeb536a770dc0067a82a73f20f17220cbd40`；唯一工作树项为 `?? docs/planning/2026-10-04/`，`git diff --check`无输出。本轮只改当前产品候选／本记录并新增003原字节归档，未修改UI／业务代码／accepted specs／规则／看板；未提交、推送或派发。修订004仍待具体边界关闭、必要UI和新鲜审查，不以这些静态OK提升状态。

## 9. 用户确认与最新两路径追加：修订005接续

用户在本chat直接回复“按推荐采用”，确认修订004 §8.2四项方案；随后明确追加：只有CSV＋XLSX需要模型按结构生成代码、本地处理明细，其余格式直接读取，可以外发模型。当前产品／UI按最新追加最小对齐，不重新要求相同决定、不改写旧建议／旧审查／原候选字节。

采用边界：CSV／XLSX明细留本地；其他所选MD／PDF／Word／PPT／图片内容可在有效配置及当前任务材料范围提供给模型，不要求先代码转换或只发摘要。两类材料在一个任务面说明，不增加逐字段／逐文件审批。文件选择继续覆盖受信本地准备，模型或生成代码使用前才核验对应材料／执行范围。文档观点与已核验指标分别呈现；格式不是无隐私证明，凭据和已识别敏感内容／改格式绕过表格明细保护仍有具体拒绝／排除路径。

已确认格式交付、代码职责、一次有界代码纠正继续采用；代码纠正与Provider一次请求重试分开，停止／重开不刷新次数。已有无累计上限、计量、配置跨Change复用、人审整体效果、首试／S1、40稳定能力ID及各返回点保持。

主Agent负责产品输入／UI Contract／本记录；同一产品支持Agent被明确转为离线UI作者，仅拥有app.js／discovery.js／README及必要CSS尾部，不是新鲜Reviewer或工程Agent。本轮使用saas-product-ui-system及product-ui-redesign，沿用已接受的亮色、中文、品牌／组件／间距，只补两材料路径、自动准备和真实可见失败语义；原浏览器策略限制继续保留，不绕行或启服务。

修订005完整候选身份、实际静态／合成状态检查和新鲜审查结果待发生后追加，不预填准备PASS／用户UI Gate；实际Provider、资料、服务、配置、工程验收均尚未发生。
### 修订005固定送审身份与主Agent检查

作者完成后停止写入。主Agent对两个JS执行`node --check`均exit 0；从README提取完整限定命令并在独立Node VM上下文原样读回，exit 0，实际stdout如下。它是作者断言的再执行，不冒充最终独立Review。

```text
PASS actual click path: local-only inspection before task authorization
PASS role/period gates accept qualified 2/3/4/5-source combinations
PASS isolation/correction/UNKNOWN/source-change and genuine ambiguity
PASS direct-document materials, content-risk exclusion, local failures create no code operation
PASS 13 late-code-success negative fences; readback never republishes stopped output
PASS explicit stopped-success recovery: same operation/binding/count, qualification only; failed/invalid recovery refused
PASS original review/failure/model-retry/stopUnknown/read-only regression
PASS 30 scenarios x 2 modes; no count/network/file/storage gate; CSS prefix/CSP preserved
```

主Agent追加负例独立于作者断言：停止并读回原代码成功后改变期间、问题、已有文字同意或范围，显式继续也不能采纳旧输出；无效配置在两材料情境均不准入代码；取消／补证不产生正式人审效果。修正后exit 0，stdout：

```text
OK: stopped original-success output cannot resume after period/question/text-consent/scope binding drift
OK: ineffective product configuration rejects generated-code admission in both material-path scenarios
OK: new preparation flow retains cancel/supplement without formal human-review effects
```

可复制的追加检查（在根目录运行，仅合成VM，不运行Python／Provider）：

```sh
node <<'NODE'
const inspectFs=require('node:fs'),inspectVm=require('node:vm');
const readme=inspectFs.readFileSync('docs/planning/2026-10-04/browser-first-n01-n02/clickable/README.md','utf8');
const block=readme.slice(readme.indexOf('可复制的完整复检命令')).match(/\x60\x60\x60sh\n([\s\S]*?)\n\x60\x60\x60/)[1];
const prefix=block.split("node <<'NODE'\n")[1].split('let h=H();')[0];
const checks=String.raw`
for(const mutate of ["task().period=1","task().question+='修改'","task().textConsent=false","task().scopeRevision++"]){
 const h=H();h.load('codeUnknown');h.x('task().textConsent=true');h.click('authorize');h.flush();h.click('stop');h.click('readCodeSuccess');
 h.x(mutate);a.notEqual(h.x('task().codeOp.binding'),h.x('codeBinding(task())'),'real binding change required');
 h.click('reauthorize');h.flush();a.equal(h.x('task().dataQualified'),false);a.equal(h.x('task().reports.length'),0);a.equal(h.x('task().codeOp.corrections'),0);
}
console.log('OK: stopped original-success output cannot resume after period/question/text-consent/scope binding drift');
for(const id of ['normal','mixedSources']){
 const h=H();h.load(id);h.x('task().grant=false;task().configValid=false');h.click('authorize');h.flush();
 a.equal(h.x('task().codeOp'),null);a.equal(h.x('task().reports.length'),0);
}
console.log('OK: ineffective product configuration rejects generated-code admission in both material-path scenarios');
const h=H();h.load('normal');h.click('authorize');h.flush();h.click('analysisReview');h.click('dismiss');h.click('submitReview');
a.equal(h.x('task().result'),null);a.equal(h.x('task().reports.length'),1);
h.click('review');h.click('moreEvidence');h.el('evidenceQuestion').value='质疑来源';h.click('saveQuestion');h.click('submitReview');
a.equal(h.x('task().stage'),'needsEvidence');a.equal(h.x('task().acceptedFinding'),null);a.equal(h.x('task().savedClosure'),null);
console.log('OK: new preparation flow retains cancel/supplement without formal human-review effects');
`;
inspectVm.runInNewContext(prefix+checks,{require,console,Buffer,process,URLSearchParams},{filename:'revision005-main-additional-check.js'});
NODE
```

两项主Agent检查器失败均保留，不是生产因果RED：
1. 首次读回作者脚本使用`vm.runInThisContext`，与包装器的`const fs`冲突，exit 1：`SyntaxError: Identifier 'fs' has already been declared`。未执行候选断言；改用独立上下文后原样通过。
2. 首次追加负例没有先建立已同意文字的状态，合成快照本来`textConsent=false`，再赋false没有改变绑定，却断言必须拒绝，exit 1：`AssertionError: true !== false`。只读诊断证明期间／问题／范围变化都拒绝，只有该无变化用例继续成功；修正初始化为true，再撤销成false，并新增“绑定必须真实改变”断言，未改候选或弱化边界。

固定七文件已完整保存至[Review004原输入](reviews/readiness-004-inputs.json)，不是产品冻结或Git发布：

| 相对本目录的文件 | bytes | SHA-256 |
| --- | ---: | --- |
| product-input-v0.1.md | 55118 | `bfffd9fa8b4a5bc877052b934b55f1ed285b04775aa423453d933d4be067b7c7` |
| ui-contract-v0.1.md | 14872 | `42c3fa470432d702cbe1af1b2faf3d8cb731ce43e79db8963aba1aa324b71d02` |
| clickable/README.md | 33019 | `fe721432c7a2dffb576d54b2d2d67c3492e7b536edebc5a288bf5fe051b05c8b` |
| clickable/index.html | 748 | `3a8dfdafb1b64e0a3f91cd69d5058842839d88b61426f3e2c2f141bc9e3033b3` |
| clickable/app.js | 81779 | `7887c602930507ce16651a53f7ddb6ac28f0bce3132a0c247db4d97a42ad6897` |
| clickable/discovery.js | 20438 | `899ec6044ea79888fb5e2b01503322169efe5a4bb550b1e73333c1fa0986e100` |
| clickable/styles.css | 18849 | `e602e4575f6a802ac3c1e0e8c334730fdf48c8ce772fd05ecd7e3edf7c38287f` |

新鲜只读Reviewer `/root/n01_n02_readiness_004` 已成功派发，实际路由`gpt-6-astra / high`、无作者上下文，仅给上述固定产品包及明确引用的JuanerAI权威；不访问外部Demo救场，不授工程权限。其结果尚未收到时不预填PASS；当前产品源状态是送审时的`READINESS_REVIEW_PENDING`，实际回执后在本记录追加，旧历史仍不改写。

主Agent送审前静态核对exit 0：15个准备文件无尾空白、32个本地Markdown链接存在、001／002／003七源归档与各原审查hash一致；HTML和CSS未变、原视觉/CSP保留。新增004归档后还将读回其manifest及字节。不运行真实浏览器／模型／文件解析／Python／生产验证，不授实际试用资料、服务、安装、Git或Mini权限。

### 修订005新鲜审查回执

独立 Reviewer 已返回 **PASS——仅限修订005完整准备候选可提交用户审核**，完整七部分报告保存于[Review004](reviews/readiness-004.md)。其在审查前后核验七源不变，并独立执行两个JS语法检查及README限定VM检查，均exit 0；未使用外部Demo救场、未写文件、未运行浏览器／服务／真实文件／Provider／Python或生产套件。

实际状态为 `READINESS_PASS_FOR_USER_REVIEW / AWAITING_AFFECTED_USER_UI_GATE / NOT_FROZEN / NO_EXECUTION_AUTHORITY`。固定七源中的`READINESS_REVIEW_PENDING`是派发时状态，保留原字节作为本次Review身份；最新结论以本追加及Review004为准，不回写送审源或历史001～003。

两条路径及现有配置／计量／重试决定已吸收，无须再次询问；仍需按产品§8、§10落实实际配置、具体试用材料、目标环境权限及观察／质量安排。它们不是本次准备PASS隐含授予的权限。下一允许动作是用户审核受影响产品／UI及集中关闭适用剩余事项；不自动发布、派发Mini或启动工程。

审查落盘后最终只读核对exit 0，实际stdout：

```text
OK: Review004 complete verdict and all seven candidate identities match; frozen sources unchanged
OK: 17 preparation files have no trailing whitespace; 35 local Markdown links resolve
```

`git diff --check`无输出；`git status --short`仍仅`?? docs/planning/2026-10-04/`。原分支／HEAD和已存在工作保留，本轮没有Git发布或跨session发送。

## 10. 用户批准、工程启动授权与发布停止点

2026-10-04用户直接回复“方案已通过审核，接下来启动开发，派发给macmini 新session：change-N01/02”。完整批准、七源语义冻结、适用用户UI Gate PASS和待交接启动授权记录在[批准与交接](approval-and-handoff-v0.1.md)；保持送审七源及Review004原字节，不重做方案／UI或把准备PASS改成工程PASS。

只读核对目标新chat的实际thread／host／仓库及等待状态；尚未发消息。新鲜只读支持`/root/n01_n02_handoff_scope_check`确认批准应追加而非改七源；Q1/Q2/Q4在受影响真实执行前、Q5在首试／测量前落实，不阻止安全隔离的其他获准开发。已确认模型／资源／重试／两路径不重问；该支持不是新的Gate。

本轮使用juanerai-git-workflow与git-commit-push。初次list_threads请求limit60超工具上限，未读到目标；改为合法limit50后只读定位，无外部写入。完整全量索引mode=full、persistence=false本次一次失败，原结果为`status:error / outcome:exit_nonzero / Indexing worker crashed on a file`；不重试同一已知工具崩溃、不引用旧豁免、不宣称PASS。前后完整17源／Git指纹相同，原始结果及指纹保存于[索引失败001](reviews/publication-index-failure-001.json)。当前技能要求暂存前停住；本轮尚未stage、commit、push、PR或发送Mini，下一动作是集中取得本次发布专属豁免或用户另选交接方式。

批准追加后的范围复检：两个`node --check`exit 0、无stdout；README限定VM程序再执行exit 0，完整stdout如下。这是已有效原型断言的读回，不另称工程验证或新Gate：

```text
OK: seven accepted Review004 inputs unchanged
PASS actual click path: local-only inspection before task authorization
PASS role/period gates accept qualified 2/3/4/5-source combinations
PASS isolation/correction/UNKNOWN/source-change and genuine ambiguity
PASS direct-document materials, content-risk exclusion, local failures create no code operation
PASS 13 late-code-success negative fences; readback never republishes stopped output
PASS explicit stopped-success recovery: same operation/binding/count, qualification only; failed/invalid recovery refused
PASS original review/failure/model-retry/stopUnknown/read-only regression
PASS 30 scenarios x 2 modes; no count/network/file/storage gate; CSS prefix/CSP preserved
OK: 19 scoped files, 40 local Markdown links, no trailing whitespace
OK: raw failed index and matching pre/post fingerprints preserved; no waiver/PASS claimed
```

`git diff --check`无输出，status仍只有本目录未跟踪新增；未进行真实浏览器／Provider／数据／服务或生产回归。19文件范围没有生产源码／accepted specs／依赖／规则／工程看板。

## 11. 用户专属索引豁免与发布接续

2026-10-04用户直接回复“批准。”，批准问题仅为本次产品文档＋离线UI发布豁免索引检查；其余检查照常，生产验证及required CI不豁免。[批准记录§5](approval-and-handoff-v0.1.md#5-本次发布专属豁免已批准)追加适用身份。历史索引失败001完整保留，不重跑崩溃来博取绿灯，不标索引PASS，也不推广到Mini或未来Change。

下一步在原工作分支完成有界发布；当前仍未发送。发布commit／tree／PR和接收回执以实际发生后记录为准，不拿开始HEAD或上批产品commit替代。

正常合入已发布main `447e26e88430f74612919732f0093002c448548b`，合并HEAD `3210b04dfa2337a1f7ffc63bb0d53079e2ca0cbc`，tree `3fdb8b9d03a1727d1ca8eb69d2b0b79eaf693d15`，两个父提交为原HEAD与该main。实际merge exit0、无冲突；原分支、19新增材料与七源保留，`git diff --stat origin/main HEAD`空。只同步已发布内容，没有本session新写生产／规范／依赖／看板。

重新完整读取现行两个Git技能、Git工作流及路由。当前git-commit-push已明确图谱可选、索引失败无需例外；此前拦截源于旧工作树技能，已向用户说明，不在后续重复该门槛。失败和本次用户批准历史仍保存，现行身份／源码／范围／适用验证义务保留。当前CI受信scope仅将少数治理Markdown选为documentation，本批planning／离线JS不能借标签跳过full required CI。本机node_modules不存在；未安装依赖、未运行业务回归／Provider／服务／浏览器，聚焦原型检查不代替CI或工程验收。

合入main后的最终范围检查：两个JS `node --check`exit0／无stdout；README所载完整限定VM命令及七源、JSON、引用、已知凭据前缀、软链／尾空白、Git范围检查exit0，实际完整stdout如下：

```text
OK: seven user-approved Review004 source hashes preserved after main integration
PASS actual click path: local-only inspection before task authorization
PASS role/period gates accept qualified 2/3/4/5-source combinations
PASS isolation/correction/UNKNOWN/source-change and genuine ambiguity
PASS direct-document materials, content-risk exclusion, local failures create no code operation
PASS 13 late-code-success negative fences; readback never republishes stopped output
PASS explicit stopped-success recovery: same operation/binding/count, qualification only; failed/invalid recovery refused
PASS original review/failure/model-retry/stopUnknown/read-only regression
PASS 30 scenarios x 2 modes; no count/network/file/storage gate; CSS prefix/CSP preserved
OK: 19 intended files, 41 local Markdown links; valid JSON/no symlinks/trailing whitespace/known credential prefixes
OK: raw index failure and original identity remain intact; index not claimed PASS
OK: tracked tree equals published main; only the approved 19-file package is pending
```

检查前后指纹完全相同：仓库`/Users/huangbo/.codex/worktrees/e1d5/JuanerAI`、branch `work/macbook/ai-led-member-analysis-product-plan`、HEAD `3210b04dfa2337a1f7ffc63bb0d53079e2ca0cbc`、tree `3fdb8b9d03a1727d1ca8eb69d2b0b79eaf693d15`、porcelain／tracked及staged差异与19文件hash均不变。随后只追加本实际检查回执；最终暂存将独立核对每文件当前字节，不用本记录的旧hash充当自身新hash。没有生产实现、安装、Provider、业务资料、服务或浏览器执行。

只读支持`/root/n01_n02_handoff_scope_check`返回无实质发布阻断：19文件边界、七源及历史字节、41引用、出站／持久化禁用源码和当前用户／执行条件一致。其提醒批准记录首屏的历史状态可能误读，主Agent只在该记录开头增加阅读顺序，未改七源、合同或历史。支持首次归档检查脚本假设001也有manifest而失败，按其实际布局修正后只读核对通过；这不是产品RED或工程证据。

暂存检查实际`git diff --cached --check`exit2，stdout仅两条已冻结原字节的EOF空行提示：

```text
docs/planning/2026-10-04/browser-first-n01-n02/clickable/index.html:19: new blank line at EOF.
docs/planning/2026-10-04/browser-first-n01-n02/clickable/styles.css:23: new blank line at EOF.
```

这是原七源低风险格式提示，不影响权限、计算、证据、停止或产品承诺；保留源hash不为美化重写。仅此次调用`git -c core.whitespace=-blank-at-eof diff --cached --check`exit0／无输出，证明无其他默认空白问题；未修改Git配置、不把原exit2说成PASS。后续如需格式清理在单独允许修改这些原源时处理，不阻断本次有界发布。所有19暂存文件此前逐一与磁盘字节完全一致；上述两回执文件更新后将再次显式暂存及逐一核对。
