# DR-002 工程接收 003

2026-10-18，Mac mini，同一工程主 Agent。用户已明确“DR-002 UI 通过，按这份合同继续工程接线和验证”。原计划／框架确认保留；sessionDigests / followup 首期关闭；固定源码为 3a3f8c3a910460423a8b7a2638655a100a2aa8e6。产品就绪 PASS 见 readiness-review.md，批准面为 ui-contract.md R01–R10 与原可点击稿。003 仅更新批准记录，不改写原产品行为。

## 具名 WIP 例外

普通读取旧 /private/var/db/juanerai/change-coordinator/active-change.json 失败 Permission denied。随后仅一次获准 sudo -n cat 失败，exit 1，sudo: a password is required。WIP 仍为 UNKNOWN，不能从旧看板推定空闲。

用户明确：“保留 WIP UNKNOWN，允许 deep-research 本任务作为具名例外继续工程接线和离线验证；不要再提权，也不要修改旧指针或启动 Host Loop。按已批准的 DR-002 合同推进，仍禁止真实 Provider。” 本任务依此接收；不将 UNKNOWN 改为 PASS，不再提权、不改旧指针、不启动 Host Loop，不扩大到其他 Change。

## 范围与执行

允许本 Change 工程规格、adapters/deep-research、packages/ports/deep-research、packages/application/deep-research、profiles/personal/deep-research、apps/browser 相应接缝、tools/deep-research 固定构建及相关测试／工具链清单，和当前项目看板的任务状态。保留其他插件行为。条件路径为固定包分发资源入口、能力登记与本 Change 完成所需回归清单，仅在实际影响成立时修改。

禁止共享 SDK／其他插件原业务改写、独立版资料与秘密读取、真实 Provider／搜索／网页采集、外部发布、安装／生产采用、peer 修改、旧 WIP 指针与 Host Loop。测试只用明确合成材料，网络请求只允许本任务拥有的 loopback 服务与依赖获取；依赖安装使用固定 lock 且忽略生命周期脚本，原源保留。

工程接受仍需当前规格、失败可触发的行为检查、受影响回归、完整固定候选独立 Validator。产品接受、Git 发布、安装分发与真实研究质量分别保留，不从 UI PASS 推定。

证据根：/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/engineering-003-20261018。原002候选及本次前态已保留；本机存储不等于跨设备备份。

003 工程影响补充：实际随包资源构建需要 tools/desktop/runtime-resources.mjs、forge.config.cjs、vite.main.config.mjs 的固定资源／浏览器入口选择；对应 tools/desktop/development-build.test.mjs、tools/report-studio/host-resource-build.test.mjs 保留旧断言并增加两个研究资源。固定 tsconfig 根清单与冻结审核稿 TypeScript 的语法检查影响 tools/harness/validation/run(.test.mjs)、tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts；原宿主 DOM 测试夹具 tests/unit/xanthil-desktop/open-analysis-client.unit.test.mjs 增加可选研究入口所需 querySelector 空节点，不删旧行为断言。以上为本任务必要条件路径，不改变其他插件业务或另启产品 Change。
