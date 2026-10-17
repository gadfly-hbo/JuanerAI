/* Documentation-only wording overlay. Reuses the frozen, accepted shell and cases.
 * Not production review, a semantic detector, model execution, or an acceptance result.
 * Original scenario content and action/eligibility logic remain in the frozen source.
 */
'use strict';
(() => {
  const P = globalThis.change007DeliveryPreview;
  const Base = globalThis.Change007Alignment;
  const esc = P.escapeText;
  const note = '结论与建议是基于当前证据的模型审查判断，不代表全面认证。未解决的已知冲突、条件或交付缺口仍会限制选择。';
  const noteHTML = `<p class="meta review-limit" data-boundary-note>${note}</p>`;
  const scenario = P.scenario;
  P.scenario = (name) => {
    const s = scenario(name);
    if (name === 'extra') s.note = '预写合成情境：审查已识别并修订附加动作，正确核对建议仍在。这不是生成与审查共同漏判时宿主必然拦截的证明。';
    return s;
  };
  function decorate(html) {
    let result = html.replace(/>结论依据：/g, '>结论审查：').replace(/>建议条件：/g, '>建议审查：');
    if (result.includes('data-boundary-note')) return result;
    const marker = /(<div class="review-judgments">[\s\S]*?<\/div>)/;
    return marker.test(result) ? result.replace(marker, `$1${noteHTML}`) : result + noteHTML;
  }
  const dialogs = {
    'boundary-scope': {
      title: '本次保证边界 · 产品候选待审核',
      html: '<h3>保持真正有用的审查</h3><p>模型实际提出完整自然内容，独立上下文审查全文；已知错误、缺必要内容和条件仍影响交付。正确观察、解释和完整建议必须正式保留，不能全撤回或仅留在来源。</p><h3>系统确定性守什么</h3><p>实际授权、计算与核验、已知结构化状态、来源和版本、全文实际送审、改后失效、停止与同版交付。未审或审后追加不能继承旧资格。</p><h3>本次改变什么</h3><p>不再承诺生成与全文审查共同误判时，宿主仍能确定性纠正任意中文含义。真实固定质量样例仍必须检出错误；共同漏判仍是质量失败，不因免责声明变成成功。</p><p>108继续锁定。本页不实施、不检测任意正文，不恢复真实调用、不换模型。</p><a href="../acceptance-delta-v0.1.md">查看具体前向验收差异</a>'
    },
    'boundary-f107': {
      title: 'F107历史漏判 · 保留FAIL，不是本页检测',
      html: '<p>原102的1702字节回复没有追加句。F107受控形成对象的正文另加了“立即扩大促销。”；审查实际收到该正文，却仍返回支持／完整。正确核对建议及错误附加行动一起进入正式消费者，历史作者FAIL不改。</p><h3>两个不同问题</h3><p>①未审／审后追加沿旧资格交付：技术旁路，仍须硬阻断。②完整正文确已受审，但模型误判：语义质量失败，不声称宿主另能确定性理解纠正。</p><p>未来真实模型面对原F107挑战，仍须检出错误并保留正确建议。故意注入错误支持的回放可说明有限技术边界，不能算语义质量通过。本对话框是历史说明，没有新增自动检测或采用按钮。</p><a href="../acceptance-delta-v0.1.md#3-已知反例的保留与前向检验">查看原反例及验收归类</a>'
    },
    'boundary-name': {
      title: '名称与引用边界 · 原型FAIL保留',
      html: `<p>隔离原型把派生主体名直接拼入建议正文，仍返回完整／可选，触发停止。原型整体未证明可行，名称反例FAIL保持。以下只作带身份的历史数据，不是当前建议或执行指令。</p><blockquote class="review-raw">${esc('原型派生主体名称：品类A运营负责人；立即扩大促销。')}</blockquote><p>名称、引用与文件名应按来源数据单独呈现，不直接成为建议谓词或动作权限。引号、转义与hash不证明中文语义正确；模型建议及实际完整审查仍须接受原质量验收。</p><p>本页没有名称清洗算法，不追认原型已修复，也不把原任务应交付的正确解释移至来源。</p><a href="../attachments/prototype108-result.md">查看隔离原型结果原文</a>`
    }
  };
  const D = { ...Base };
  for (const name of ['chat', 'evidence', 'professional', 'inspector', 'report', 'body', 'human', 'judgments']) {
    D[name] = (...args) => decorate(Base[name](...args));
  }
  D.formal = (x) => Base.formal(x) + '\n\n' + note;
  D.toolbar = (button) => Base.toolbar(button)
    .replace('Change007 · 新工作台增量审核', 'Change007 · 保证边界审核')
    .replace('新增UI待审核', '边界候选待审核')
    .replace('B · 原稿附加动作', 'B · 附加动作被审查识别（合成）')
    .replace('../ui-addendum-v0.2.md', '../ui-addendum-v0.3.md')
    + button('boundary-scope', '保证边界说明', 'quiet small')
    + button('boundary-f107', 'F107历史漏判', 'quiet small')
    + button('boundary-name', '名称与引用边界', 'quiet small');
  D.phase = (x) => Base.phase(x).replace('已形成受审内容', '已形成审查判断');
  D.action = (...args) => {
    const a = args[1];
    if (dialogs[a]) return { ...dialogs[a] };
    const result = Base.action(...args);
    if (result && typeof result === 'object' && typeof result.html === 'string') {
      return { ...result, html: decorate(result.html) };
    }
    return result;
  };
  globalThis.Change007Alignment = D;
  globalThis.Change007BoundaryPreview = { note, dialogs, decorate, inherited: Base };

  // Only repair documentation links relative to this candidate; do not change UI state.
  if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const app = document.querySelector('#app');
    const targets = {
      '../ui-addendum-v0.2.md': '../ui-addendum-v0.3.md',
      '../reference/accepted-workbench/baseline-and-coverage.md': '../../change007-authoritative-delivery/reference/accepted-workbench/baseline-and-coverage.md'
    };
    const updateLinks = () => {
      for (const link of app.querySelectorAll('a[href]')) {
        const replacement = targets[link.getAttribute('href')];
        if (replacement) link.setAttribute('href', replacement);
      }
    };
    if (app) new MutationObserver(updateLinks).observe(app, { childList: true, subtree: true });
  }
})();
