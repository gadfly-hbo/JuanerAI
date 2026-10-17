# 固定模块／插件接入资产

2026-10-17 · 仓库内三项接入资产的单一维护入口。资产按仓库工作流正式交付；发布是否完成以实际Git结果为准，真实身份与结果见[交付005](../../../openspec/changes/plugin-integration-consolidation/git-delivery-005.md)。本入口不改变各任务批准合同或全局权限。现行权威仍为[工程执行政策](../../governance/product-change-execution-policy.md)、[架构](../../architecture/ports-and-adapters.md)和各任务已批准合同。

同一业务实现在插件原仓维护，既可独立运行、发布，也可通过不同入口／装配随JuanerAI固定打包交付。集成用户安装JuanerAI即可取得获批插件形态及所需运行依赖，不要求另装独立版、外部源码仓库或全局开发环境。仓库、进程、版本可以独立；这不等于独立部署，也不要求同进程、同库或合仓。

按需读取三项资产：

1. 新接入准备或更新已有固定模块时，读[接入标准](standard.md)：必要信息、职责、五步接线及受控升级。
2. 需要真实实现和合成用法时，读[Report Studio参考Adapter](report-studio-reference-adapter.md)：已发布链路、文件／测试、固定身份及可复用范围。
3. 定义本插件验证时，使用[通用验收清单](acceptance-checklist.md)：选择适用正负例，填写预期、身份、证据和未执行原因。

先用现有业务Port、Adapter和composition root；只有第二个已获准实际调用点显示共同需要时，才在其范围内决定必要提取。本文不提供通用插件平台、市场或第二插件实现。

本次任务、原发布前置、真实证据根与未完成项统一见[本地验证及接续](../../../openspec/changes/plugin-integration-consolidation/verification.md)。资产状态以该记录为准；已发布参考不等于这些新文档已发布。
