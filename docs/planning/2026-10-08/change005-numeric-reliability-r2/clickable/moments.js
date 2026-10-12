'use strict';
// 固定合成审核状态，无网络、模型、文件访问、计算执行或产品存储。
const $ = id => document.getElementById(id);
let state = 'verified', focusBack = null, selected = 'total', reportOpen = false;
const number = (key, text, meaning) => `<button class="num" type="button" data-number="${key}" aria-label="查看${meaning}${text}的依据">${text}</button>`;
const link = (text, tab) => `<button class="btn btn-sm" type="button" data-tab="${tab}">${text}</button>`;
const values = {
 total: ['两期净销售额 · 1050 元', '<p><strong>独立核算一致 · 合成示例</strong></p><p>订单 1100 元 − 关联退款 50 元 = 1050 元。</p><p>范围：2026 年 1 月与 2 月，全部地区／商品，退款按原订单号关联。</p><p>来源：选定订单.csv、退款.csv 和指标说明；来源行、关联与金额实际检查应来自真实回执。</p><p>只证明记录范围内金额及关联检查一致，不证明退款原因。</p>'],
 jan: ['1 月净销售额 · 430 元', '<p><strong>独立核算一致 · 合成示例</strong></p><p>1 月订单 450 元 − 关联退款 20 元 = 430 元。</p><p>范围：2026-01，全部地区／商品。订单 O1／O2／O3；退款 R1 按原订单号关联 O1。</p><p>另一计算路径须重读绑定资料，检查金额、单位、来源及行覆盖；附件没有执行这个核验。</p>'],
 feb: ['2 月净销售额 · 620 元', '<p><strong>独立核算一致 · 合成示例</strong></p><p>2 月订单 650 元 − 关联退款 30 元 = 620 元。</p><p>范围：2026-02，全部地区／商品。订单 O4／O5／O6；退款 R2 按原订单号关联 O4。</p><p>来源：订单.csv／退款.csv；实际表、金额与原订单号字段应可展开检查。当前版本：1（合成）。</p><p>核验范围：金额与记录的关联检查一致，不证明增长原因。</p>'],
 delta: ['净销售额差额 · 190 元', '<p><strong>派生公式已核验 · 合成示例</strong></p><p>2 月净额减 1 月净额：620 − 430 = 190 元。</p><h3>输入依据</h3><p>' + number('feb','620 元','2 月净销售额') + ' − ' + number('jan','430 元','1 月净销售额') + '</p><p>输入单位和当前版本一致。这是派生计算检查，不是新增独立订单重算。</p>'],
 growth: ['净销售额增长率 · 44.19%', '<p><strong>派生公式已核验 · 合成示例</strong></p><p>（620 − 430）÷ 430 × 100%</p><p>显示百分比保留两位小数；中间结果不先舍入。</p><h3>输入依据</h3><p>1 月 ' + number('jan','430 元','1 月净销售额') + '；2 月 ' + number('feb','620 元','2 月净销售额') + '。</p><p>输入分别已独立核算；公式、引用和单位一致不证明经营增长原因。</p>'],
 partial: ['分配与预测的检查范围', '<p><strong>分配合计一致，逐项分配尚未独立核验</strong></p><p>合成分配示例：分配前总额 100 元；分配后 60 元和 40 元。总额守恒，但没有适用的逐项独立重算。</p><p>合计正确不证明每个权重或业务分配正确。不能写成“成本分摊全部已核验”。</p><h3>探索结果</h3><p>预测 700 元为合成探索示例，没有独立预测核验，不进入已核验数字清单。本增量不新增预测算法。</p>'],
 zero: ['增长率不适用', '<p>合成场景基期净额为 0 元，本期为 620 元。</p><p>差额可以计算；增长率分母为零，不显示 0% 或无穷为有效增长率。</p><p>不把本场景的 0 元与原场景 430 元混用。</p>'],
 changed: ['范围修改与结果失效', '<p>版本 1：全部商品；版本 2：仅 Coffee。</p><p>总体净额、期间净额、差额、增长率及相关报告段落均待重新计算和核验。</p><p>旧版 1050／430／620 元和 44.19% 保留为历史，不作为当前 Coffee 结果。此附件没有计算 Coffee 的新值。</p>'],
 failed: ['报告数字依据不匹配', '<p><strong>报告中的增长率不能采用</strong></p><p>合成检查发现该主张引用另一期间的凭证，不能证明当前增长率。</p><p>有效的当前净销售额 1050 元保留。冲突记录保留；不能替换证据或冒称全报告通过。</p>']
};
const statuses = {verified:'本轮成果已保存 · 合成状态',partial:'部分检查通过；探索结果未独立核验 · 合成状态',zero:'基期为零，增长率不适用 · 合成状态',changed:'范围已更新，受影响成果待重算 · 合成状态',failed:'报告数字依据不匹配；有效金额保留 · 合成状态'};
function body() {
 if(state==='partial') return '<p>净销售金额的基础核对可以保留。分配示例目前只通过总额一致检查；预测为探索结果，尚未独立核验。</p><p>这些检查不能证明每项分配正确或预测可靠。</p>'+link('查看检查范围','evidence');
 if(state==='zero') return '<p class="answer">基期为 0 元，本期净销售额 620 元。<strong>增长率不适用</strong>。</p><p>可以比较增加金额；不会把零分母算成 0% 增长。</p>'+link('查看依据','evidence');
 if(state==='changed') return '<p>已改为只看 Coffee。总体净额、期间差额、增长率及相关报告结论已失效，待按新范围重新计算和核验。</p><p>旧成果仍可查看，但不能用于当前范围。</p>'+link('查看版本影响','evidence');
 if(state==='failed') return '<p class="answer">两期净销售额 '+number('total','1050 元','两期净销售额')+' 的金额核验仍有效。</p><p>报告中的增长率引用了错误期间，当前不能采用。这个问题不影响已有效的金额结果。</p>'+link('查看冲突','evidence');
 return '<p class="answer">两期净销售额合计 '+number('total','1050 元','两期净销售额')+'。1 月 '+number('jan','430 元','1 月净销售额')+'，2 月 '+number('feb','620 元','2 月净销售额')+'，增加 '+number('delta','190 元','净销售额差额')+'，增长 '+number('growth','44.19%','净销售额增长率')+'。</p><p>订单金额 1100 元，扣除关联退款 50 元。数字已按当前口径核对；现有资料不能证明退款原因。</p><div class="secondary-links">'+link('查看数字依据','evidence')+'<button class="btn btn-sm" type="button" data-report="true">展开报告</button></div>';
}
function render() {
 $('progress').textContent=statuses[state];
 $('thread').innerHTML='<article class="message message-user"><div class="message-label">你</div><p>销售额扣除退款后是多少？两期变化怎样？</p></article><article class="message"><div class="message-label">JuanerAI</div>'+body()+'</article>';
 if(reportOpen && state==='verified') $('thread').insertAdjacentHTML('beforeend','<article class="message"><h2>净销售额报告 · 合成审核</h2><table class="report-table"><thead><tr><th>期间</th><th>净销售额</th></tr></thead><tbody><tr><td>2026-01</td><td>'+number('jan','430 元','1 月净销售额')+'</td></tr><tr><td>2026-02</td><td>'+number('feb','620 元','2 月净销售额')+'</td></tr></tbody></table><p>差额 '+number('delta','190 元','净销售额差额')+'；增长率 '+number('growth','44.19%','净销售额增长率')+'。</p><p>这是数值变化，不是原因证明。没有退款原因字段，无法回答退货原因。</p></article>');
}
function close() { $('drawer').hidden=true; if(focusBack?.isConnected) focusBack.focus(); }
function open(tab, key, trigger, moveFocus=true) {
 if(trigger && !trigger.closest('.drawer')) focusBack=trigger;
 selected=key || (state==='verified'?'total':state==='partial'?'partial':state);
 let title='数字依据', content='';
 if(tab==='evidence') { [title,content]=values[selected]; if(state==='verified' && ['jan','feb'].includes(selected)) content+='<p><button class="btn btn-sm" type="button" data-number="growth">返回增长率依据</button></p>'; }
 else if(tab==='meaning') {title='当前口径';content='<p>净销售额＝订单金额−有效关联退款。人民币元；退款归属原订单期间。当前指标说明为合成来源。</p><p>自然语言由 Agent 理解；三核心核对依据。没有真实冲突不重复要求用户确认。</p>';}
 else if(tab==='plan') {title='分析方案';content='<p>Semantic Context 确定业务含义；Binding 对接字段；IR 描述可执行关联、分组、筛选与单位。</p><p>主程序本地计算，适用独立路径核算；派生公式检查后，报告引用检查。附件不执行任何程序。</p>';}
 else if(tab==='files') {title='选定资料';content='<p>合成：订单.csv、退款.csv、指标说明.csv。附件不访问文件；生产应展示真实选定来源与工作表。</p>';}
 else {title='执行与核验';content='<p>当前为静态审核附件，没有模型调用、执行回执或实际核验凭证。</p><p>真实产品需保存来源、方法、结果与范围身份；UNKNOWN 和停止沿用原边界。</p>';}
 $('detail-title').textContent=title; $('detail').innerHTML=content; $('drawer').hidden=false;
 document.querySelectorAll('[data-tab]').forEach(b=>{if(b.closest('.detail-tabs')) b.setAttribute('aria-pressed',String(b.dataset.tab===tab));});
 $('announcement').textContent='已打开'+title;
 if(moveFocus) $('close').focus();
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button'); if(!b) return;
 if(b.dataset.number) open('evidence',b.dataset.number,b);
 else if(b.dataset.tab) { const inside=b.closest('.drawer'); open(b.dataset.tab,null,inside?null:b,!inside); }
 else if(b.dataset.report) {reportOpen=true;render();$('announcement').textContent='已展开合成报告';}
});
$('scenario').addEventListener('change',()=>{close();state=$('scenario').value;reportOpen=false;render();});
$('close').addEventListener('click',close);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('drawer').hidden)close();});
$('report').addEventListener('click',()=>{reportOpen=true;render();$('announcement').textContent=state==='verified'?'已展开合成报告':'当前审核状态没有完整已核验报告';});
for(const id of ['new','current']) $(id).addEventListener('click',()=>{$('announcement').textContent='审核附件不创建或切换真实任务';});
$('composer').addEventListener('submit',event=>{event.preventDefault();$('announcement').textContent='审核附件不会发送、分析或保存；请切换上方合成审核状态。';});
render();
