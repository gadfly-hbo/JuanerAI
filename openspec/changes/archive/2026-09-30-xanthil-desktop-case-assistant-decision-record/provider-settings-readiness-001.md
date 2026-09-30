## 1. What I Would Build

在同一 Change002 中增加一个简洁的全局“模型接入”面板：

- 快速模式、专业模式及无 Project 时均可进入；固定 Xiaomi Token Plan 中国区与 MiMo 2.6 Pro。
- 用户输入 Key，明确点击测试；一次测试只发送固定文本 `Reply with OK.`。测试通过后，由用户另行保存启用。
- Key 仅保存在当前用户、当前 Mac 的系统钥匙串。普通安装、Finder/LaunchServices 启动与重开均可使用，不依赖临时注入，不自动测试或开始任务。
- 更换失败保留旧 Key；取消和迟到结果不启用新配置；活动任务与配置变更互斥；保存或删除使尚未开始任务的旧授权失效。
- Case Assistant 与三类单次辅助共用接入配置，各自保留原有数据披露、授权和生命周期。配置成功不授予业务数据外发权。

依据：[提案 §2–4，第15–54行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-product-input-v1.md:15)。

独立验收终点是：**新编号 DMG 在目标 MacBook 正常安装启动，用户完成配置，重开后可使用授权模型路径**；本机工程验证、独立 Validator 与用户产品验收分别成立。依据：[PS-03、PS-06、PS-08及流程，第60–71行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-product-input-v1.md:60)。

## 2. Required Guessing

**实质缺口：未发现。**

以下关键语义已有明确约束，无需工程自行作产品决定：

| 检查项 | 已关闭的产品语义 |
|---|---|
| 当前输入与已存 Key | 修改输入使测试证明失效；只保存本次测试输入；替换成功前旧 Key 保留。 |
| 保存失败与不确定结果 | 不宣称新配置可用；不确定结果须读回核对；钥匙串不可访问时禁止新模型任务。 |
| 异步取消与迟到响应 | 取消、关闭和退出终止后续处理；迟到成功不保存；已发请求可能消耗额度。 |
| 活动任务竞态 | 包含启动、发送、等待回答及配置测试；竞态重新检查，拒绝冲突变更。 |
| 配置与任务授权 | 配置不外发业务数据；各任务继续精确披露并确认；换 Key 不沿用未开始任务的旧授权。 |
| 单次辅助兼容 | 三个原入口、各自 payload、自由文本确认、单次调用和失败回手动均保留。 |

依据：[提案第17、26–30、38–54行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-product-input-v1.md:26)。单次辅助与[原 UI Contract §7](/Users/bendandebaba/JuanerAI/docs/planning/2026-09-18/xanthil-desktop-ui-contract-v1.0.md:273)、[原 Session/Runtime §5](/Users/bendandebaba/JuanerAI/docs/planning/2026-09-18/xanthil-desktop-session-runtime-boundary-v1.0.md:117)一致。

**建议项：**附件有两处展示/交互应对齐正文，见第6节；它们不需要新增产品选择。

## 3. External Study Required

**无。**给定提案、正式附件及明确引用的产品权威足以理解本增量。无需读取当前实现、作者会话、外部仓库或查询 Provider 来补齐产品语义。

固定包七个文件的字节数和 SHA-256 均与 manifest 相符。本次结论基于文件静态审阅，未执行浏览器交互、真实模型调用或钥匙串操作。

## 4. Untestable Requirements

**未发现因产品语义缺失而不可验收的要求。**

PS-01–08 已提供正向、拒绝、失败、竞态和真实安装场景。普通启动、机器隔离、真实存储故障及实际请求内容需要后续工程与目标设备证据；原型没有这些能力，且[README第7行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-ui-v1/README.md:7)明确说明了证据限制。

未来 UI Gate 尚待用户执行，这是流程中的后续步骤，不构成本次 readiness 缺口。

## 5. Correctly Deferred

以下可以由工程在既定边界内细化：

- 系统钥匙串具体 API、凭据 Adapter、业务 Port 和私有类型。
- 锁、配置版本、提交点、读回核对及迟到响应隔离机制。
- 错误映射、测试输出与时间的具体有限上限。
- 测试夹具、证据目录、构建及专用验证命令。

依据：[提案第28、52、69行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-product-input-v1.md:69)。这些留白不授权 Provider registry、备用路由、企业身份体系或额外 Runtime。

## 6. Required Plan Additions

**解除实质阻塞所必需的补充：无。**

建议在受影响 UI Gate 前对齐两处原型行为：

1. **取消测试后清空输入。**正文第26行要求取消时清空输入；[panel.js第52行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-ui-v1/panel.js:52)只取消测试并更新提示，输入仍保留。最小调整是让该演示遵循正文的清空规则，无需增加产品前提。

2. **最近一次测试失败后的提示保持准确。**已有配置重测发生网络、额度或超时失败后，[panel.js第31行](/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/provider-settings-input-001/source/provider-settings-ui-v1/panel.js:31)仍显示“上次测试通过”。最小调整是区分“已保存配置”和“最近一次测试结果”，既保留配置，也准确显示本次失败原因。

两项均是已有明确语义与合成附件的一致性问题，不要求工程猜测新的业务规则。

## 7. Verdict

**PASS — Product Plan Development-Readiness。**

产品范围、凭据与数据权限、失败和竞态语义、兼容边界及独立验收终点已闭合。

本结论不代表新面板 UI Gate、产品输入冻结、工程接收、真实接入验证或最终产品批准已经完成。