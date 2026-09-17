# JuanerAI 自动化修复最终关闭记录

2026-09-18，MacBook Controller。R382 接受已批准修复范围，R383 将关闭结论最小化归档到 Git。**M0–M4 适用范围完成，BLK-D1A-008 在既有 S09/A2 豁免边界内 CLOSED；可以进入 Desktop 启动决策，尚未授权 Desktop 实施或 DISPATCH。**

本记录只保存可跨设备恢复的结论与证据身份，不发布原始主机日志、凭证、临时执行包或整个恢复目录。当前状态入口仍为 [MASTER_PLAN](../MASTER_PLAN.md)／[NEXT_ACTION](../NEXT_ACTION.md)，不另建状态系统。

## 已验收身份及范围

- 最终修复/规范基线 commit：`7afc4ec7f775fc43a9c3f48c3494e6bd09feb0d6`；tree：`63536f8c687aef71db48206a9b84596a499d7ffe`。
- [PR31](https://github.com/gadfly-hbo/JuanerAI/pull/31) 的启动目录修复已合并为 `ebb93de91db083b8f46f8e5a15baeaea65bbb20a`；[PR32](https://github.com/gadfly-hbo/JuanerAI/pull/32) 完成获准规范归档，合并为上述最终基线。
- R350 的 F1/F2 因果 RED、最小实现、必要 GREEN/回归、Retirement及新鲜独立Validator已接受；R378纯文档归档再次独立审查通过，生产/Test/工具字节未变。
- 当前已归档[启动目录验证记录](../../../../../openspec/changes/archive/2026-09-17-change-coordinator-startup-directory-preparation/verification.md)保存对应范围与证据边界；[M1关闭记录](m1-closure-001.md)保存B0验收。
- 本R383提交仅含MASTER_PLAN、NEXT_ACTION和本记录。代码基线与随后纯文档集成SHA不同，不把新文档SHA宣称为重新执行全部行为验证；以逐字节无影响证据复用原验收。

## 原阻塞的闭合依据

| 项 | 原验收与当前结论 |
|---|---|
| B0 | WVEB独立验收、PR28及归档完成，保持CLOSED；M1既有索引工具例外和替代证据不冒充索引PASS |
| B1/B2 | R242本地M2接受：实际post-Worker文件修改、两次Regression定义/回执、精确STAGE、Candidate commit/tree和readback闭合 |
| B3/B4 | Candidate绑定Final Validation、精确Validator head、持久失败/一次有界修复及第二次失败停止证据已接受；B4保留A2限制 |
| B5 | 受控公共链的PR幂等、diff/Handoff、恢复与失败边界已接受；不等于真实产品外部PR/Handoff已运行 |
| BLK-D1A-008 | 原五项解除条件已由R382联审：可执行Regression/Retirement、真实Worker subject、持久fail-closed、精确头独立验证/集成/部署/EMPTY、最终D1来源和三方/WIP读回闭合 |

R240/R242证明适用最终质量、Retirement及独立本地接受；R350补充最小启动目录修复。R363替换/R364接受、R367/R371人工维护启动及R368/R372接受、R374/R376完整环境/基线观察、R381最终POST和R382接受形成真实主机后缀。helper、启动和最终基线接续均回到原D1验收点，无开放修复支线；没有用一次exit0代替全链证据。

## 双端与 Host Loop 基线

R381完整POST于 **2026-09-17 23:59:44.384984—23:59:47.535390 +0800** 完成；MacBook于 **2026-09-18 00:12:53.983407 +0800** 联审。以下四个角色均精确匹配上述commit/tree、local main及cached origin/main；POST的真实LIVE_ORIGIN也匹配。

| 角色 | 验收状态 |
|---|---|
| MacBook明示独立验收工作树 | main、clean、device=macbook；旧工作目录与修复目录保留，不充当干净验收入口 |
| Mac mini用户库 | main、clean、device=mac-mini |
| Host Loop canonical | bare，clean不适用，device=mac-mini |
| Host Loop main worktree | main、clean、device=mac-mini；与canonical为同库，非额外独立仓库 |

两库各八文档对象、两个工作树各八checkout文档、两次ff-only和原完整POST均接受，原PRE/fetch未重跑。完整前后环境、传输六字段归属、严格STATUS/EMPTY、新鲜WIP和保护集合通过。17份D1来源及7个部署对象与最终Git对象绑定。

观察窗口不是持续在线承诺。将来产品签名/派发前仍按原要求刷新适用基线与WIP，不因经过时间自动清零K1/K2/hour。本次仅文档合并后的新SHA及双端同步须以实际Git读回确认；不预填未来合并号、不为自引提交号反复更新本文件。

## 保留证据身份

完整证据由Controller本地保留于修复证据集合，需审计时按下列身份索取，不要求新session先读全部历史。

| 证据 | 长度 / SHA256 |
|---|---|
| R381完整主机报告 `juanerai-macmini-manual-deploy-r274-host-report.md` | 43,860,997 bytes / `1e4136d860e68e7bc467f1585ae9bbd835cab038070de0f73c0abb8f40d105b7` |
| R382 Controller接受 `R382_D1_M4_ACCEPTANCE.md` | 11,142 bytes / `3a3e8ac27e0d8c7bcc9f95b22c061da3cce82d74e2eefbcff369c08bf71a68a4` |
| R382来源与审查 `final-evidence.json` | 26,347 bytes / `c985b5f1c4664ae9b0021b3b4cb4a5f05aaadba503d1e03bb3a9f97ef8b7cf57` |
| 已部署host-loop | 114,685 bytes / `c0f23d7462fa3ae8e94d98f2c530c13d680fadc711628e81c41f7077592bff7a` |

原主机报告42,254,650-byte前缀SHA256为 `0a5971b4df2f9abb70dd004382eb4cb0d3ba296a8392a0e95c374b692caa1469`，历史失败及STOP未覆盖。上述JSON为未签名来源包，`source_package_signed=false`、`dispatch_authorized=false`、`desktop_authorized=false`。

## 豁免、未验证与终点

- **真实通过：** 适用本地受控Worker→Regression/Retirement→STAGE/Candidate/readback→Final Validation→Validator→PR/Handoff，以及真实修复集成/归档、主机替换、人工维护启动、helper离线验收和最终D1观察。
- **用户豁免：** S09/A2持续为 `USER_WAIVED / NOT_VERIFIED`。相关虚拟机、真实特权隔离/Host proof/K2正向证据没有随其他PASS转换为已验证；不恢复为新的修复阻塞。
- **尚未验证：** 首次实际产品自动DISPATCH及真实Agent/provider/Evidence Ref/branch/PR/Handoff正向完整运行；实际reboot后的新代码启动、自动残留socket恢复、旧安装器/回滚及恢复可用性。人工维护成功不是这些机制的证明。
- **本任务终点：** 修复范围无剩余开发或验收项。用户另行决定Desktop启动阶段；新session、工作分支或本关闭记录都不授予产品实施、安装、真实外部调用或signed DISPATCH权限。

Desktop建议采用新session，先从干净集成入口恢复已批准产品计划/必要Gate。MacBook新分支只用于获准的Controller intake/计划/文档准备；正式产品实现仍由signed DISPATCH绑定Mac mini精确执行Worktree/branch，不绕过唯一执行政策。原修复分支、历史工作树及原始证据保留；不清理、不重放旧临时批准，也不重开已完成修复。
