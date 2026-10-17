# Report Studio 最小接入方案批准记录

最新状态见文末“完整产品输入冻结”；以下批准时点、审查历史及停止线保留。

2026-10-15，用户在本任务明确确认：[Report Studio 最小接入方案审核稿](proposal-v0.1.md)“审核通过”。

## 批准对象与范围

批准方案 v0.1 的固定内容，SHA-256 为 `2d5cab2afb95b26d06d63371d9f80a4df5e0d8c12e4afb8c41d7c253005c99ec`。受审正文保持原字节，其“待用户审核”是批准前状态；本记录说明后续批准，不改写历史审查或未决项。

采用关联模块方式，Report Studio 独立维护、固定版本随 JuanerAI 交付、按需后台启动，保留自由制作能力。方案中的用户路径、10 项必须改动、保留能力、暂缓项、版本和数据管理及 14 条验收标准已获得文本方案批准。

## 当前状态与保留边界

- **方案文本：用户审核通过。**
- **产品就绪：[独立审查 001](reviews/development-readiness-001.md)仍为 NEEDS_CLARIFICATION。**首版 Mac 芯片、macOS 和 PPT 编辑器支持/验收范围尚待具体决定。本次批准不代填这些选项，也不把该缺口变成豁免。审查文件 SHA-256 保持 `9be44fbaf1568d1af65661c4084c41e73dafd159b30ffe908c44aabf18091607`。
- **新增 UI：尚无适用增量 UI Contract 和用户 UI Gate PASS。**已有效的工作台设计和用户决定继续复用。
- **工程：未冻结完整产品输入，未确认 Engineering Intake，暂不开发。**不因文本批准而创建 OpenSpec、编写业务代码/测试、安装依赖、调用 Provider、使用真实数据或打包部署。
- **Git：本地记录，未提交/推送/PR/合并。**本次产品批准不新增 Git 发布权限。

Mini 已在本任务只读采用 PR #88 的固定规则提交 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`，按唯一执行政策的 Mini-led Plugin Integration 全程牵头；不以 MacBook 编制、冻结或技术审批作为必经节点。规则采用未切换代码基线或复制规则文件。

记录时分支为 `work/mac-mini/report-studio-minimal-integration-plan`，HEAD 为 `187c356625260d84ca58bc1f5741e081e89662cd`。原方案、审查、WIP、证据、失败/UNKNOWN、资源与停止线保留，不新增审批或工程角色。

## 下一允许动作

在本任务直接向用户明确首版目标 Mac/macOS 与 PPT 编辑器范围，按批准方案准备后续产品/UI 材料；具体内容仍须取得适用用户决定。仅因本次批准不重跑仍有效的独立审查；负载缺口关闭或发生实质修订后，对相应固定候选完成必要就绪审查。

后续开发须具备适用产品/UI批准、就绪条件、同任务产品输入冻结与工程接收，以及明确实施授权。安装、Provider、真实数据、主机、部署和 Git 等效果继续按各自实际授权处理；本记录不补授任何此类权限。

## 2026-10-15 · v0.2 候选准备完成

用户授权只读核对现有 Mini／MacBook 的 macOS 与 PPT 编辑环境、提出最小兼容范围并准备新增 UI 合同，仍明确“暂不开发”；另确认 MacBook 的独立 Report Studio 已能正常使用，可以只读参考。已完成两机元数据与选定源码核对，没有运行应用／模型或读取业务演示文件。

- [兼容补充](compatibility-v0.2.md)：建议限定 M4 Mini／26.3.1(a)、M5 MacBook／26.5.2，Keynote 14.4 为 PPTX 编辑验收工具；对应 Chrome／Preview 作为网页和 PDF 验收环境。**用户范围决定仍待审核。**
- [新增 UI Contract](ui-contract-v0.2.md)及[离线可点击附件](clickable/index.html)已准备。复用原工作台与插件制作布局，包含首次可信本地启用、材料／配置、来源／版本、显式回传、失败／未知与停止／退出。**用户新增 UI Gate 仍待审核。**
- [独立审查 004](reviews/development-readiness-004.md)：**PASS，仅固定候选的产品规划就绪静态复核**。审查 001–003 及旧候选、失败与 NOT_RUN 保留。兼容内容已具体化，不代表用户已批准或实机验收已完成。
- 当前候选清单 SHA-256：`cfc6b254d2066305b5b5ea3ea5d81d6b62ec80ec877a5adee35f1cbb21678193`；清单绑定8文件。原方案 v0.1 和原审查 001 哈希未变。
- 浏览器工具拒绝本地 file://，未绕过；视觉、点击、键盘、响应式及所有真实产品／编辑器验收保持 **NOT_RUN**。静态语法、资源路径和候选哈希检查通过。
- 同一分支 `work/mac-mini/report-studio-minimal-integration-plan`，HEAD `187c356625260d84ca58bc1f5741e081e89662cd`。仅规划目录 WIP；未提交、推送、创建 PR 或改动生产代码／依赖。

继续采用固定规则 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d` 的 Mini-led Plugin Integration：Mini 本任务准备输入、直接接收用户决定；无 MacBook 必经审批，复用有效决定，保留既有 Change/SDD/TDD、独立最终工程验证、required CI与实际权限。未 checkout/pull/merge 或复制规则文件，未改变代码基线。

**下一允许动作：用户审核两机兼容矩阵与新增 UI，或提出修订；仍不开始开发。**本轮文稿、原型和规划 PASS 不构成完整 Product Input Freeze、Engineering Intake、实施、安装、Provider、部署或 Git 发布授权。

## 2026-10-15 · 完整产品输入冻结

用户明确回复：“两机兼容范围和新增 UI 合同审核通过，把完整接入方案整理冻结，暂不开发。”

本次 [兼容范围](compatibility-v0.2.md) 用户批准、[新增 UI 合同](ui-contract-v0.2.md)及绑定可点击附件的用户 UI Gate PASS 已成立。结合先前 v0.1 文本批准和固定候选审查 004 PASS，**完整 Product Input Freeze 已成立**。不重跑有效审查，不新增产品要求或工程角色。

完整阅读入口：[冻结版 v1.0](frozen-plan-v1.0.md)；批准效力与边界：[冻结记录](freeze-v1.0.md)；文件身份：[冻结清单](frozen-inputs-v1.0.json)。原 v0.1、兼容／UI v0.2、候选清单、可点击附件及审查 001–004 保持原字节。

**仍暂不开发。**Engineering Intake、工程实施及真实验收未开始；不因冻结增加安装、Provider、真实数据、主机、部署或 Git 发布权限。浏览器实际检查及真实产品／编辑器验收的 NOT_RUN 不变。本地产品内容已冻结，仍为未提交 WIP；原分支与 HEAD 不变，未声称完成 Git 集成保存。

下一允许动作：按用户指示维护冻结材料或回答问题，等待明确后续工作指令；不自行开始工程或发布。
