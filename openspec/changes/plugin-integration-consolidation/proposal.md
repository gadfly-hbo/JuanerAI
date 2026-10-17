# 插件接入沉淀：本地可审资产

2026-10-17；R0资料／参考整理，不改变产品行为。用户在当前session启动，本次唯一执行输入为Mini已核验Prompt v0.3（11948 bytes，d67607dd3ae7ee53d48d0268b61b973b341ba70d19c1136c3cb6971ff8378f66）及方案v0.3（20511 bytes，2b3a69afb82f96166c5d7906c611f7e362ee3fb13f350e281fca329829d5c63a）。原文件位置及副本可用性见本机持久证据intake-identity.json。

## 前置与目标

原Report Studio按036获准范围正式收口：PR91实际于2026-10-17 00:41:21 Asia/Shanghai squash为3deeaae7b352b49afb46d4811fbd17689d2c277a；最终head37648b56bb4e9f5c1674f0300b6a212860cfa82d Canonical validation成功。正式工程、用户接受及原发布回执已读，融合源码已归档；Mini035A现装仍034包。历史UNKNOWN、干净机风险接受及MacBook免测不新增启动条件，源发布与应用安装分别陈述。

PIC-A：一个维护入口的插件接入标准，涵盖双交付、职责、必要信息、五步流程、权限／状态／未知效果和受控升级。
PIC-B：精确绑定已发布Report Studio的参考Adapter导览、实际文件／正负例／最小可运行用法；以已有实现为参考，不抽新共享包。
PIC-C：按适用性选择的通用验收清单，含预期与证据，区分N/A、未授权未执行、旧证据复用、新检查、用户接受未实测。
PIC-D：只读记录两项中立业务修复回流、来源／宿主目标包含性及UNKNOWN；不联系其他session或机器，不执行回流／换包，不以回流作新增前置。
PIC-E：本地完整可读身份、检查、独立只读复核及接续；不提交／推送／PR／合并／发布、真实Provider、安装升级、真实用户数据／凭据／服务或其他产品升级。

## 范围与方法

允许：docs/engineering/plugin-integration/三资产及入口；本Change的proposal/tasks/verification与必要独立报告；本工作树project-control；能力登记／全图中的无业务增量说明和不可变快照。已有获准Node26工具链中的合成离线检查。
条件：仅现有合成用例不足时加最小示例或检查胶水，先说明适用效果；当前优先直接运行既有用例，不新增执行器。
禁止：apps、packages、adapters、profiles、tools、vendor、依赖／锁、AGENTS／全局／Pi标准、旧Change／旧证据／安装／数据／预算的任何修改；不恢复旧任务、不建立平台或新Runtime／存储／Session／协议。

范围内主工程连续完成资料／验证，使用原生juaner_validator作相称独立只读复核。没有新产品行为或UI，产品计划就绪及UI Gate不适用；不伪造行为RED。使用codebase-design梳理实际Interface、writing-for-agents组织单入口和完成条件，二者不授予新权限。旧031 CLI例外仅原Change有效，本任务不沿用。

现行权威为基线3deeaae7中的AGENTS、CONTEXT、唯一执行政策v0.9、Git／复杂度／架构／测试规则；Pi唯一标准已从Mini现有仓库完整读取，标准不触发迁移。主会话实际Sol/high/danger-full-access/never，沿当前session用户已直接认可的设置；独立角色须另读回Sol/high/read-only。

能力关联C5-09：只沉淀既有最小接入方法，不新增业务覆盖；40稳定ID类别变化0，不升级C5-09、S1/S4或第二插件。
