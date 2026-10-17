// Documentation-only, prewritten synthetic scenarios. NOT a production qualifier or renderer.
// No file reads, Provider, calculation, storage, download, persistence or network.
(function () {
  'use strict';
  const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const baseB = {
    title:'分别汇总，再核对归属', kind:'B', ready:true, phase:'done',
    observation:'所选订单与退款在各自文件范围内分别汇总，各项独立算术核验一致。',
    facts:['订单：已付240元、未付25元，合计265元。','退款：已完成18元、待处理4元，合计22元。'],
    explanation:'两份文件的分别汇总，没有证明退款与订单一一匹配，也没有提供跨表净额、利润或促销原因的证据。因此先核对归属、取得匹配记录，才能判断这些资料还支持什么结论。',
    suggestion:'可选择由品类A运营负责人核对所选退款与订单归属，以收集可追溯的匹配证据。',
    conditions:'用户在本合成任务给定核对职责和权限，可在未来3天安排2小时，费用上限为200元。这些是用户提供的条件，不是独立事实认证。',
    cost:'沿用已给条件（≤200 元）',
    safeguards:'主要风险是把分别汇总误当成净额、利润或原因；若无法匹配，或需要新增资料／权限，停止并补证。3天窗口内观察核对是否完成、是否取得可追溯匹配记录。不承诺收益。',
    alternative:'也可先补证、仅保留当前分析并暂缓，或不行动。核对建议不等于已执行，不自动排班、签署或扩大业务动作。',
    original:'可选择核对所选退款与订单归属，收集可追溯匹配证据；备选是仅保留分析并暂缓。用户给定未来3天2小时，成本沿用已给条件（≤200 元）。风险是把分别汇总误当净额或利润；无法匹配或需要新增材料则停止并补证。',
    gap:null
  };
  const scenarios = {
    complete:{...baseB, note:'正确事实、解释和完整建议均在正式成果中；支持标记不覆盖原稿全文。'},
    extra:{...baseB, original:baseB.original+'立即扩大促销。', note:'正式成果仍是完整核对建议。形成原稿另有额外文字，不能随主行动进入本次正式采纳内容。'},
    gap:{...baseB, ready:false, explanation:null, safeguards:null,
      gap:'缺少“为什么不能直接认定净额／利润”的正式解释，以及无法匹配／新增资料时的停止安排。',
      note:'尚未完整交付。即使来源原稿里存在这些内容，也不能用来源查看代替正式成果。'},
    conditional:{...baseB, ready:false, answer:'unknown', answeredUnknown:false,
      conditions:'核对职责、权限和200元费用范围已给定；负责人能否在未来3天投入2小时仍未知。',
      note:'保留具体核对选项与完整说明，仅负责人时间待确认。只问这一项，不重复已知条件。'},
    material:{...baseB, ready:false, phase:'no-current-data',
      facts:[], observation:'用户表示新期间尚未导入资料，也没有本期新计算。旧期间结果只供历史参考，不能认证新期间。',
      explanation:'缺少当前期间资料，无法据旧期间数字判断本期净额、利润或原因。当前资料限制应直接出现在正式说明中。',
      suggestion:null, original:'该期间资料已经导入。',
      note:'当前期间没有新数值／可采用建议。原稿的相反肯定句不改变资料状态。'},
    cost:{...baseB, note:'本合成任务费用上限用途不变。已有等义表达不应使正确完整建议被撤回。'},
    sales:{...baseB, title:'净销售变化与下一步', kind:'A',
      facts:['本独立合成两期：净销售160元 → 150元，减少10元。','品类A：100元 → 80元；品类B：60元 → 70元。'],
      observation:'同口径下净销售减少10元，变化集中在品类A；品类B增加，不能说所有品类都下降。',
      explanation:'品类变化说明调查重点，不证明退货、促销或其它因素是原因。先取得可追溯的原因资料，再决定是否有依据改变策略。',
      suggestion:'可选择由品类A运营负责人在未来3天投入2小时核查退货原因，费用不超过200元；核查前不扩大促销。',
      safeguards:'观察3天内核查是否完成、原因资料是否可追溯，以及口径／品类差额是否需要修订。超费用、资料错配或越权就停止；差额修订仍走原计算和独立核验。未取得原因资料则如实报告不足。',
      original:'品类A减少20元、品类B增加10元。建议先核查品类A退货原因；用户已确认核查职责、费用范围以及未来3天2小时可用。保留风险、暂缓备选和核查观察安排。',
      note:'A情境沿原独立合成样例；不是把006两个真实任务改造成一次两期比较。条件已确认并完成重审仅为合成预演。'},
    failed:{...baseB, ready:false, phase:'failed', note:'本版审查无法完成。已核对事实可先读；解释／建议未取得本版正式资格，不把失败改成证据不足。'},
    stale:{...baseB, ready:false, phase:'stale', note:'建议内容已改变，受影响项需重新审查。数值仍可读；旧资格不认证新内容，不触发自动执行。'}
  };
  function scenario(name) {
    if (!Object.hasOwn(scenarios,name)) throw new Error('Unknown synthetic scenario');
    return structuredClone(scenarios[name]);
  }
  function reportText(s) {
    const lines=['本页正式成果预演（合成，非后台记录）', ...s.facts, s.observation];
    if (s.gap) lines.push('尚未完整交付：'+s.gap);
    if (['failed','stale','stopped'].includes(s.phase)) {
      lines.push(s.note, '当前解释／建议没有本版正式资格。');
      return lines.join('\n\n');
    }
    if (s.explanation) lines.push(s.explanation);
    if (s.suggestion && !s.gap) {
      lines.push(s.ready?'当前可选择的具体建议':s.answer==='no'?'存在冲突，当前安排不可推荐':'待条件／待审选项，不是当前可采用推荐',s.suggestion,s.conditions,'费用说明：'+s.cost,s.safeguards,s.alternative);
    }
    return lines.filter(Boolean).join('\n\n');
  }
  // Pure sample projection is exposed only for prototype QA. It proves no production guarantee.
  const api = {scenario,reportText,escapeText,names:Object.keys(scenarios)};
  globalThis.change007DeliveryPreview=api;
})();
