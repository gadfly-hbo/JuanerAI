/* Xanthil Desktop 数分助手 · UI Contract · 模拟执行合成数据
   全部为合成 / Mock 数据；不读取真实本地文件，不调用模型、Python 或网络。 */

window.XANTHIL_DEMO_DATA = {
  scenario: "华东区高价值会员近 90 天复购率下滑诊断（合成数据）",
  evidence: {
    "E-101": {
      title: "缺码门店复购 -4.2pp",
      source: "聚合产物 A-01 · weekly_repurchase_by_tier.agg",
      detail: "存在畅销 SKU 缺码的 11 家门店，高价值会员 90 天复购率环比下降 4.2 个百分点。（合成数据）",
      hypothesis: "H1"
    },
    "E-103": {
      title: "对照门店（尺码齐全）复购 -3.9pp",
      source: "聚合产物 A-01 · weekly_repurchase_by_tier.agg",
      detail: "尺码齐全的 9 家对照门店同期复购率同样下降 3.9 个百分点，与缺码门店无显著差异。该反例使 H1 被证伪。（合成数据）",
      hypothesis: "H1（反例）"
    },
    "E-201": {
      title: "到期未续会员复购 18.4% vs 在续会员 31.5%",
      source: "聚合产物 A-02 · benefit_expiry_distribution.agg",
      detail: "权益到期且未续费的高价值会员（合成样本 412 人）90 天复购率 18.4%，显著低于权益在续会员的 31.5%。（合成数据）",
      hypothesis: "H2"
    },
    "E-202": {
      title: "复购下滑周与权益到期高峰周对齐（W24–W27）",
      source: "聚合产物 A-02 · benefit_expiry_distribution.agg",
      detail: "权益到期高峰集中在 W24–W27，与复购率连续下滑周完全对齐。（合成数据）",
      hypothesis: "H2"
    }
  },
  stageNames: {
    home: "新建分析",
    prepare: "数据准备",
    process: "本地处理",
    analysis: "循证分析",
    report: "报告",
    feedback: "执行反馈"
  },
  commands: [
    { id: "go-home",     label: "前往：新建分析", hint: "阶段 1", stage: "home" },
    { id: "go-prepare",  label: "前往：数据准备", hint: "阶段 2", stage: "prepare" },
    { id: "go-process",  label: "前往：本地数据处理", hint: "阶段 3", stage: "process" },
    { id: "go-analysis", label: "前往：循证分析主工作台", hint: "阶段 4", stage: "analysis" },
    { id: "go-report",   label: "前往：报告", hint: "阶段 5", stage: "report" },
    { id: "go-feedback", label: "前往：执行反馈", hint: "阶段 6", stage: "feedback" },
    { id: "new",         label: "新建分析", hint: "回到阶段 1", stage: "home" },
    { id: "guide",       label: "打开演示导览", hint: "演示流与失败路径", action: "guide" },
    { id: "chrome-mac",  label: "窗口语境：macOS", hint: "仅演示", action: "chrome-mac" },
    { id: "chrome-win",  label: "窗口语境：Windows", hint: "仅演示", action: "chrome-win" },
    { id: "toggle-sb",   label: "收起 / 展开侧边栏", hint: "⌘B", action: "toggle-sb" },
    { id: "toggle-insp", label: "开关 Inspector", hint: "⌘I", action: "toggle-insp" },
    { id: "fail-1",      label: "演示失败路径 1：本地处理失败", hint: "fail closed", stage: "process", auto: "fail-process" },
    { id: "fail-2",      label: "演示失败路径 2：证据不足不得写成结论", hint: "fail closed", stage: "analysis", auto: "fail-conclude" },
    { id: "fail-3",      label: "演示失败路径 3：子任务失败 / 取消", hint: "fail closed", stage: "analysis", auto: "fail-subagent" },
    { id: "reset",       label: "重置演示状态", hint: "清空全部演示进度", action: "reset" }
  ]
};
