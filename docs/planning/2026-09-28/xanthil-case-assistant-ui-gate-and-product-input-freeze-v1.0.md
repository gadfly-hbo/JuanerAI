# Xanthil Case Assistant UI Gate 与产品输入冻结记录 v1.0

## 决定与身份

- Change：`xanthil-desktop-case-assistant-decision-record`
- 日期：2026-09-29
- 决定来源：本规划会话中用户明确回复 `UI Gate PASS`，并说明“这版 UI 明显好于第一个 change，不仅通过，未来将作为 JuanerAI 的 UI 标准”。
- Product Plan Development-Readiness：第六轮独立只读审查 `PASS`；第一至第五轮 `NEEDS_CLARIFICATION` 历史保留。
- UI Gate：`PASS`，适用于本 Change 的增量 UI Contract v1.0 及其可点击附件。
- Product Input Freeze：MacBook Product Manager 根据上述批准冻结本 Change 的产品目标、范围、边界、可见行为、验收标准、禁止项与 UI Contract；工程内部类型、路径、Schema 和实现步骤未预先冻结。

## UI 标准决定的适用方式

用户批准将本版 UI 作为后续 JuanerAI 界面的视觉与交互标准参考。后续产品/UI 工作应以本版的品牌呈现、信息层级、状态区分和交互质量为基准，并在各自适用的 UI Contract 中说明复用或偏离之处。Case Assistant 专属业务流程、授权和决策规则只约束本 Change；跨产品可复用的组件、设计参数及适配规则尚未抽取为独立的版本化设计系统，不能凭本记录推定其他产品的 UI Gate 已通过。

## 冻结附件

| 附件 | SHA-256 |
| --- | --- |
| `xanthil-case-assistant-ui-contract-v1.0.md`（UI Gate 时的正文；仅文档控制状态和本记录引用在 Gate 后更新） | `511915d24c51e82ce673ac02389aafd1596b2649e8d5e6e850faa2a6b1ac0158` |
| `clickable-ui-contract-case-assistant-v1.0/dist/index.html` | `1466e3eed5c1ddde5fec73b02e9d08229e4295c520b7f684303e891c8b7c52b5` |
| `clickable-ui-contract-case-assistant-v1.0/dist/styles.css` | `bfa62c9431ac8a1e7fe0b52cfd6322273158a4d38e9ac6c3eabceabd83032ead` |
| `clickable-ui-contract-case-assistant-v1.0/dist/app.js` | `af8a148b3ced732c99a6fa93ff10a724cace5728529dd6b7d84f558b04f3e480` |
| `clickable-ui-contract-case-assistant-v1.0/dist/assets/juanerai-logo-slogan.png` | `56bdb1196e9f1bbaef64c973c4108d12294246de6e941fa00821a2769e3e0e21` |

Gate 后可交接的产品计划 SHA-256 为 `930f564593547df5a16bd1be44173e581be0d1f876ed5b281ca3527ac3f110c2`；增量 UI Contract 状态更新后的 SHA-256 为 `09275e1dc115d5f18e6e629e5adefd878421eadfc401cd79b9c9436820ad7747`。

产品计划、可点击附件 README、留存截图及六轮就绪审查与上述合同共同构成本 Change 的产品输入包。正文的 Gate 后状态更新不改变已批准的行为合同。

## 交接停止线

截至本记录写入时，产品输入仍仅位于 MacBook 的 `work/macbook/xanthil-case-assistant-product-plan` 工作树；尚未提交、推送、合并或由 Mac mini 接收。用户本次回复批准 UI，并询问后续交接方式，未指令自动发送 Mac mini 或启动工程执行。

Git 发布、Mac mini 固定版本读取与 Engineering Intake 是后续独立动作。Mac mini 在确认收到冻结产品输入并取得用户明确推进指令后，才可按仓库规则开始 OpenSpec、工程设计、RED 测试和实现。真实 Provider/Model、数据及费用仍须按本 Change 的专用边界另行授权。
