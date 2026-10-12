# Git正式发布收口规则 · 独立一致性审查001

2026-10-05 · MacBook · **PASS，仅限本次治理文档的一致性**。

## 用户要求与范围

用户明确要求：“合并。我认为你的流程里面就应该规定提交并合并。咋每次还要我来问，然后你建议。标准工作流必须要有。”

PR #72已经按该明确指令squash合并至 `506a92c0445bcc637a673ff6e07ab58d18abe73f`，tree `55c4018b28dc3f36824dfd3283e32193a2542e93`，与原固定产品提交的tree完全一致。MacBook与配置的Mini目标main已仅引用快进到该提交；原工作分支及在研现场没有被同步改写。本条不是Mini当前工程状态或采用新规则的声明。

本次独立分支 `work/macbook/publication-merge-completion` 从该main开始，只补标准Git发布收口规则与AGENTS入口，不修改生产、CI选择器、产品／UI合同、权限配置或工程状态。此审查记录是现有治理发布证据，不是新增产品／工程Gate。

## 固定审查身份

| 文件 | SHA-256 |
| --- | --- |
| AGENTS.md | 7745d6ea53278c4e732c7d79ac230bbb94e0467cd6bca4f16e8f64daa56dad2c |
| docs/governance/git-development-workflow.md | f01becde72a807a211fc96e6cefdf19757ba9c6366f123ff58ce2be23d0d8e09 |

独立支持Agent `publication_completion_consistency_001`，新鲜只读上下文，按现行MacBook支持路由执行。审查前后两文件SHA完全一致；只读实际diff、上述规则及必要唯一执行政策／两项Git技能，没有访问Mini或修改文件／Git。

## 实际返回

**PASS。未发现承重一致性问题，无需修正。**

- 明确限于已批准、范围明确且获得正式发布授权的交付，默认完成commit → push → PR → 适用审查和required CI → squash merge → 安全同步main；不再重复例行merge询问。
- 产品／UI批准、状态查询不构成Git授权；仅提交、checkpoint、保留PR、既有stop、缺失验收和真实权限冲突均保留。
- Mini日常checkpoint／本地试用节奏不变；在研任务不强制换基线；部分同步不会被报告为完整完成。
- 与唯一执行政策及两项仓库Git技能一致。发布完成没有替代工程验收、产品验收或archive。
- 实际规则diff仅两文件、40行新增，没有产品实现、自动化、远端任务或其他范围扩张。`git diff --check`通过。

## 发布验证边界

新增本文仅保存实际审查及既有用户要求。规则文件6个本地引用已核对可达，路径／完整diff及暂存字节需匹配已验证候选，required CI以实际PR结果为准；纯文档不伪造产品RED/GREEN或运行验收。规则发布亦按正式发布收口执行，不能停在提交／推送后宣称完成。
