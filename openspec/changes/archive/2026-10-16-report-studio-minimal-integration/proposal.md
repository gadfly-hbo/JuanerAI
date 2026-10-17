# Report Studio 最小接入

2026-10-16 · Mini Engineering Controller · ENGINEERING_INTAKE_CONFIRMED

## 已批准结果

用户在本任务授权按已冻结并合并方案正式开发，由 Mini 全程牵头；后续确认已切换 Sol/medium，并授权一次管理员只读核对 WIP。复用 [完整方案](../../../../docs/planning/2026-10-15/report-studio-minimal-integration/frozen-plan-v1.0.md)、用户产品/UI 批准及独立就绪审查 004。材料清单 SHA-256 `c9e0bc202cf26233cd8915eecc59e654e1aa79239bcd2502a1e0e60e37471d97`；PR89 合并基线 `1446276011917ec46b369eadaed40c059db46b34`。冻结原件不回写。

完整结果仍是：从确定的分析版本选择材料，打开随 JuanerAI 交付的独立 Studio，自由制作和修改，导出并显式关联稳定副本，再重开/下载。涵盖 M01–M10、AC01–14、RUI-01–10 和两机范围，不以内部增量完成替代整包验收。

## 实际接收

- 原任务/工作树保持；已合并规划分支保留为 `work/mac-mini/report-studio-minimal-integration-plan`，HEAD `922ba1b`。
- 干净工作树从上述合并基线建立 `work/mac-mini/report-studio-integration`。无 reset、stash、其他工作树覆盖或服务变更。
- 原生 turn_context 核实当前主会话 `gpt-6.1-sol / medium`，父会话 `danger-full-access / never`。正式最终验证仍须独立 `juaner_validator` Sol/high、只读；旧候选豁免不扩展。
- 经用户一次管理员授权，`osascript` 仅执行 `/bin/cat /private/var/db/juanerai/change-coordinator/active-change.json`，退出 0，返回 `{"active_change_id":null,"schema_version":"1.0"}`。不改指针、权限、State、pause 或 Host Loop。
- Mini 原持久证据根继续 `JuanerAI-artifacts/reports-factory-assessment-20261015/`，本轮 `engineering-intake-20261016/`。首次普通读取 PermissionError 与角色不符检查仍保留，不改为过去成功。
- 已核实可用工具链 `/Users/bendandebaba/Dev/Env/juanerai-toolchain/bin`：Node 26.0.0、npm 11.12.1。此工作树无 node_modules；安装尚未授权。

## 复用、增量与路线

用户故事 ↔ C5-09/N11；关联 C3-01、A-04/A-05、B-01/B-02。属于用户明确授权的 N11 必要交付范围，不重排其余 Change，不宣称 S1/S4 完成。保留当前能力清单已接受子范围；本包目标仍待工程和实际用户验收。

复用宿主 `apps/browser/local-server.ts` 的 loopback、Origin/session/control 防护，`profiles/personal/open-analysis.ts` 与 OpenStoredTask/历史分析版本权威，既有报告副本/来源规则和 Personal 装配；不重造分析核心。Studio 复用固定只读源 `74ebb609fd73cf263614ffc9301dafaafcec4230` 的项目、对话、框架、逐页修改/锁定、快照和三格式导出；供应端仍独立维护，不修改 MacBook main/WIP。实际供应包/锁文件/资源与许可需后续核实，不把源码副本当可运行交付。

采用既有 PX004/006 工作台及已批准新增 UI，不重画。参考研究索引与 Blueprint v4.2 §2–11；不采用 Demo 的固定点击编排、凭据/运行假设或生产通过标签。直接读取共享 AGENT-RUNTIME.md；不升级宿主 SDK，不复制运行层，插件不同固定 SDK 版本保留在独立进程。

本包是边界敏感集成：材料外发、版本/来源、持久交付、受信本地工具、后台生命周期与随包资源。按每个真实可验证行为闭合规格→因果 RED→GREEN→受影响回归，不新增工程角色。

## 路径与效果边界

- 允许：本 Change；本任务新增 `packages/{contracts,ports,application,product-core}/report-studio*`；`adapters/report-studio/`；针对性 `tests/{unit,contract,integration}/report-studio/` 或既有 xanthil-desktop 测试目录中的 report-studio 命名文件（复用 canonical 的实际发现入口）；原持久证据根；当前工作树项目板（仅既有 CLI）。
- 条件：宿主 browser/desktop、Personal 装配、部署打包工具（含 tools/report-studio 的固定供应兼容补丁）及各自测试、tsconfig/验证清单、能力覆盖记录，仅为本集成已批准行为的必要接线；供应包固定资源须来源/版本/许可核实；安装或执行供应代码先取得对应权限。
- 禁止：其他任务/WIP/历史接受记录、规则文件、共享 SDK 源码、独立版数据/认证、用户业务文件、Host Loop、真实凭据、LAN/远程服务、自动更新和通用插件框架。
- 本轮准许源代码、测试及必要设计/本地离线合成检查；安装、Provider、真实数据、部署及目标机实际安装环境另行确认。规划包的 Git 授权不自动作为实现候选的正式发布授权。

## 第一行为及后续整体路径

先落实固定内置资源校验（RS-BUNDLE-01，M06/M09，AC01/10/11）：真实文件字节、完整清单、受支持协议、宿主固定身份及必要资源角色。此增量尚无真实供应包，不启动任何进程。

随后接入材料快照/精确项目关联与幂等稳定交付，再接宿主正常入口、独立 Studio UI、显式配置与权限、生命周期、供应构建/封装。每一步先补对应规格、测试和设计；部署、真实模型、干净两机/Keynote 与用户实际接受继续是有界后续验收，不降级为模拟通过。
