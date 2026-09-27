/* PX-2026-006 静态 Demo · Mock 数据（全部为合成数据） */
window.DEMO_DATA = {
  user: '林岚',
  project: '会员运营',
  rawFiles: {
    'orders_90d_synthetic.csv':  { id: 'L-01', meta: '38,214 行 · 4.1 MB' },
    'members_tier_synthetic.csv': { id: 'L-02', meta: '6,832 行 · 0.6 MB' }
  },
  aggArtifact: {
    id: 'A-01',
    name: 'weekly_repurchase_by_tier.agg',
    meta: '12 行 · 按周×会员层 · 不含行级原始数据',
    preview: [
      ['week', 'tier', 'members', 'repurchase_rate', 'wow_delta'],
      ['2026-W23', '高价值', '1,842', '31.2%', '-0.8pp'],
      ['2026-W24', '高价值', '1,855', '29.6%', '-1.6pp'],
      ['2026-W25', '高价值', '1,861', '27.9%', '-1.7pp']
    ]
  },
  skills: [
    { id: 'retail-diag', name: '零售诊断', version: 'v0.3', scope: '门店会员分析；假设—证据—证伪三段式', current: true },
    { id: 'weekly-sum', name: '周报汇总', version: 'v1.0', scope: '本期未启用', current: false }
  ],
  prompts: [
    { id: 'evidence', name: '循证分析模板', version: 'v1.2', scope: '结论必须绑定证据编号；无证据输出「未证实」', current: true },
    { id: 'explore', name: '开放探索模板', version: 'v0.9', scope: '发散提问，需人工复核', current: false }
  ],
  analysis: {
    visibleChip: '可见数据：A-01（已批准聚合）',
    text: '已收到 1 个已批准聚合产物（原始数据 010_draw 不可见）。按「假设 → 证据 → 证伪」推进：',
    hypotheses: [
      { id: 'H1', text: '畅销 SKU 缺码导致复购下滑', status: 'run', label: '验证中', evi: 'E-101 · 缺码门店复购 -4.2pp（来源 A-01）' },
      { id: 'H2', text: '会员权益到期未续费的窗口期集中', status: 'ok', label: '已支持', evi: 'E-201 · 到期未续会员复购 18.4% vs 在续 31.5%（来源 A-01）' },
      { id: 'H3', text: '持续高温抑制到店频次', status: 'insuf', label: '证据不足 · 未证实', evi: '当前聚合产物不含天气与到店维度，不进入报告结论' }
    ]
  },
  subagent: {
    forkName: 'Fork F-01 · 替代假设「促销节奏变化」',
    taskName: 'Subagent S-01 · 促销节奏证据核验',
    taskDesc: '有界任务：只在继承的已批准聚合子集（A-01）上核验促销周与非促销周复购差异，返回证据摘要。',
    resultEvi: 'E-301 · 促销周复购 +1.9pp，非促销周 -2.6pp（来源：Fork F-01 / Subagent S-01，基于 A-01 子集）',
    resultText: '促销节奏变化对整体下滑有缓冲作用，但不足以解释主趋势；主 Session 的 H2 结论不受影响。'
  },
  /* v0.2：Fork 与 Subagent 为两类独立子对话，各自有独立结果 */
  forkResult: {
    eviId: 'E-301',
    eviText: '促销周复购 +1.9pp，非促销周 -2.6pp（基于 A-01 子集）',
    conclusion: '促销节奏变化对整体下滑有缓冲作用，但不足以解释主趋势；主 Session 的 H2 结论不受影响。'
  },
  subagentResult: {
    eviId: 'E-302',
    eviText: '到期未续会员 90 天复购率 18.4%，对照在续会员 31.5%（基于 A-01 子集复核）',
    conclusion: '独立复核支持主 Session 的 H2「权益到期窗口」结论。'
  },
  report: {
    title: '会员复购变化诊断报告',
    meta: '生成时间（演示）：2026-08-28 · 数据范围：2026-05-30 至 2026-08-27 · 基于已批准聚合产物 A-01；原始数据未进入模型。'
  },
  proSession: { id: 'pro-001', name: '会员复购变化诊断（专业）' }
};
