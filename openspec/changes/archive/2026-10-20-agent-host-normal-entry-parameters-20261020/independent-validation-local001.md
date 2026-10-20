# 独立 Validator：normal-entry-parameters-local001

结论：**PASS（仅本次获准的固定本地离线候选）**。无阻断发现；不是 Engineering Acceptance、用户 Product Acceptance、真实模型质量、QS04、当前托管 CI、Git 或发布结论。

## 独立性、角色与读取顺序

本上下文没有参与候选 spec、测试或实现作者工作。先读 APPROVED-INPUT.txt、固定薄 spec、AGENTS/CONTEXT、唯一政策 v0.9、路由、testing/definition-of-done/test-asset-retirement 和固定 .5 的完整 AGENT-RUNTIME 标准，形成 NE01–NE07 正向、拒绝与故障预期后，才读作者 verification/request-admission、实现、测试及解释。历史归档 design 用于旧 GB 参数、300秒期限和兼容来源，repair001 完整读回用于保存探索保证。未全面重审八类接缝或启动历史业务任务。

初始子上下文不能直接查询模型元数据，已披露。随后核对父级从本次原生会话提取的 ../NATIVE-VALIDATOR-ACTUAL-SETTINGS.json 及 ../NATIVE-VALIDATOR-LOADED-INSTRUCTIONS.txt：session 01a156af-0031-7610-ab68-aa38d221292b，原生 juaner_validator，gpt-6.1-sol/high，danger-full-access/never。实际加载正文4103字符，SHA256 c5dfb74e6a0dcf828884f41582c53d530ca7c86279e92fea6b7a82d67451859c；未称当前TOML后加的解释段已加载。实际正文与现行唯一政策、本次简报的只读行为和scratch边界一致。继承权限不是OS只读隔离；未调整模型/effort/权限或使用CLI角色替代。

## 固定候选与证据身份

- 工作树 /Users/bendandebaba/.codex/worktrees/agent-host-simplification/JuanerAI，branch work/mac-mini/agent-host-simplification。
- 来源HEAD e83ba62d183eb21178af7b3849475f885c184493，tree 7cf6e7cebed8d3b80b73e472e1850879ed3c3be8；整合参考4dafbe232996b39d3033e22d74c1db498510f83f。
- 新未提交候选，3891文件、29 changed paths，包含相关committed/unstaged/added/WIP；暂存区为空；不是原样4dafbe2。
- 归档 ../candidates/local001/normal-entry-parameters-local001.tar.gz：45993186 bytes，SHA256 4e0352812673b32864e19fbc4705e02e705a8aa09c7cf505e1fd7d9dd46ec4e8。
- MANIFEST SHA256 f8ccab00dd6ba2317e8895d1b84d90822f81d76ca84ad8d4a0db4a0e63765c09；EVIDENCE-MANIFEST SHA256 70f670b9e1ba57a5de260965b5e40a23c42b7f95e4b2b4564716a419ff291c31。
- 复核前后全部文件字节/摘要一致；后检查覆盖模式及NUL分隔Git完整清单，无额外/缺失路径；HEAD/tree/branch/status/index与前检查完全一致。见 identity-before.json、identity-after-v2.json。
- 固定SDK0.5.3-harness.5，175327 bytes，SHA256 5b98a720a6bc1981662ef5254328bf15d6a79984ed7b0dcb0b673c65c31088fd；57安装文件和3本地组件逐项匹配，独立ESM解析到本树node_modules/pi-agent-runtime/dist/index.js。见 sdk-components.json、esm-resolution/。
- 122项冻结证据文件全匹配。原3项WIP保全副本全匹配，2个旧事件原样保留；status本轮授权投影与旧WIP分别归属，没有整文件排除。见 evidence-identity.json、pre-existing-readback.json。

## 验收判断

| 要求 | 独立结果 |
|---|---|
| NE01 正常入口/首请求 | 实际entry.mjs→service.mjs→service-main→Profile/Workspace→Pi Adapter→固定SDK/codec。产品HTTP客户端创建新UUID，首DTO M3/32768。review回调读取已持久Task的review_policy，在SDK配置claim前选定用途。真实child service在缺失、未知策略、错根配置下退出1，无服务identity/Provider记录；未知模型、凭据、权限、Task ID字段拒绝。环境保持allowlist。 |
| NE02 用途参数 | analysis/proposal/report/review经过实际Adapter/SDK，主32768/备16384按候选角色。GB保持M3、Pro-off报告、Flash-off审查，无新增fallback。实际codec包括报告/审查和Flash主→M3备；独立补测retained_case Pro codec为32768。native压缩主动较小输出保留。 |
| NE03 期限 | 同work已结算请求累计320000ms、新wrapper301000ms和完整长成果350000ms成功。新v2不安装stage60/120或work300秒累计计时器；各用途单次600001ms拒绝。工具299999成功/300001失败；control30001拒绝且0发送。现存受限Python监督与大小约束保持，未把命令soft保护改成hard-kill。 |
| NE04 安全/恢复 | 取消、撤权、明确授权到期拒绝迟到发布；未结算、UNKNOWN/晚到事实挡新发送。共享恢复跨用途和重开最多一次；overflow-summary合法一次，后续重发not-sent且无admitted。原Outcome保留，被动重开0模型；无清账、退款、续期、换Task逃逸或native retry开启。 |
| NE05 R1 | M3主窗口不足在物理预留/发送前拒绝；Flash主获准后，小窗口M3备在第二发送前拒绝。32768/16384预留及原200000/1048576窗口参与实际准入。4096协议开销/8192安全余量明确是工程guard-band，不冒称Provider实测或普遍估算保证；未照搬fixture零值、抬窗口或关准入。 |
| NE06 探索/长成果 | 实际Workspace新策略监督Python一次，保存400点，合法停止/关闭/被动重开/显式续接后完整分页读回原路径。400点/Unicode标签完整，MODEL_EXPLORATION/not_performed保持，未冒充正式计算/核验；Python不重跑。旧身份hash/跨Task/修订/范围/配置/撤权/未结算/UNKNOWN反例保持，形成/修订/逐页审查350秒及一次恢复通过。 |
| NE07 历史兼容 | work v1保持created_at+300000；v2/null显式不限。draft1.0/1.1有限plan与1.2/unlimited分辨。旧记录字节不改、policy rebind拒绝、未知/混合plan拒绝；无表重建、迁移、历史执行或极大有限总截止。 |

配置身份包含用途组合、资源、期限、R1和资料披露选择；独立探针确认被冻结R1及工厂捕获配置不因传入options后改而变化。额外修改限既有Pi策略/work持久化、长成果Application/Port/Store兼容、受影响测试/验证输入与结果投影，无第二Runtime、动态路由、SDK/依赖/锁/模型/接收方/thinking/工具权限扩张；业务Port增加的是JuanerAI期限联合类型，无Pi类型泄漏。

前端源码未改，正常入口取得的workspace.mjs与候选原件相等；未声称GUI或完整可读界面体验通过。40稳定ID快照逐节与register一致，仅链接重定位；register/latest/evidence保留原全文，目标/状态类/完整能力/阶段接受增量0。

## 独立检查与证据复用

全部执行使用已有Node26，HOME/TMPDIR/测试资料位于本目录各run下；工具链置PATH首位、JUANERAI_OPEN_CODE_HOST_TEST=1，NODE_OPTIONS加载../offline-network.mjs阻断外部Provider。正常启动使用候选normal-entry-offline.mjs，仅替换凭据IO与响应传输，真实entry/service/Profile/产品装配不替换。完整argv/环境/日志/退出码/SHA位于各run；run-check.py为scratch记录器。

| Run | 结果 |
|---|---|
| key-paths | 23 PASS/0 FAIL/0 SKIP，exit0，含正常启动、SDK/codec、时间/R1/安全/兼容 |
| recovery-readback | 20 PASS/0 FAIL/0 SKIP，exit0，10个WR路径、摘要恢复、LA38和完整长成果三阶段新旧策略 |
| independent-probes-v2 | 3 PASS/0 FAIL/0 SKIP，exit0，本Validator自写负向探针 |
| retained-codec | 1 PASS/0 FAIL/0 SKIP，exit0，本Validator自写辅助用途codec/超时探针 |
| current-typecheck | tsc --noEmit，exit0 |
| esm-resolution | 安装SDK入口解析，exit0 |

最终47项检查通过，包括重跑作者关键测试和4个自写探针；不代表47个新增能力。independent-probes初跑2PASS/1FAIL：对冻结R1对象直接赋值抛TypeError，是探针预期表达错误；原源/日志保留，v2改为断言写保护后全绿，候选未修。identity-after.json初次非NUL Git输出quote了Unicode路径，出现伪extra/missing；诊断保留，identity-after-v2.json使用git ls-files -z准确比较后无差异。文件字节/模式检查始终无差异。

复用作者证据且不加总重叠测试：affected025 397PASS/2旧Chromium SKIP；browser-runtime028/029其余114项与修正browser-entry032 13项；validation-inputs027 428项；auxiliary033、final-focused030、final-typecheck034。早于资料披露hash和unified摘要变体的affected025由030/033和本次关键/恢复检查补足，不声称旧批次是完全同源新跑。

因果RED001的4096≠32768、003累计320秒截止、006 wrapper301秒截止、008 child locator缺失，原命令与失败日志保留。001源码manifest匹配；003/006当时源快照存在；008变更前loader可从固定HEAD读回。见 historical-projection-checks.json及原runs；未用后来GREEN倒写RED。作者环境/fixture/typing/清单FAIL继续保留，不冒充产品RED或抹成PASS。

测试资产：无测试/负例删除或新增skip；旧WR九种边界保留，新增unified正例。legacy断言条件分支只针对新增变体，旧abort/pending路径仍执行。长成果summary/恢复保留旧策略并扩展新策略。browser-node-entry为真实服务补合法配置位置，没有去掉credential拒绝、生命周期或cross-site断言。run.test/tsconfig只加入必要新永久测试，原遗漏/替换/重复/重排/失败传播断言保留。没有需要另设退休Gate/ledger的材料缺口。

## 发现、限制与复核条件

**阻断发现：无。** 建议 A-R1-CALIBRATION：4096/8192仍缺真实DTO/Provider usage校准，当前合同已披露，非本次合成收口阻断；在另行获准真实F-B01时核对估算/实际usage及质量，不能将合成PASS升级为该结论，不新增PM技术签字。

未调用真实Provider、Keychain或业务数据，未触碰现存服务，未改系统时钟/等待600秒/启动试用验收/Git写入或fetch/联系其它session。自有正常入口服务PID73688已退出，见identity-after-v2.json；本轮离线进程均已结束。只写本目录，源、测试、规范、合同、交接、看板与冻结证据均未改。

当前CI/Git/正式archive为NOT_RUN：本轮明确止于固定本地候选，不是正式Git/Change交付。以后正式交付须对实际新候选做适用full portable/required CI，旧CI不得替代。真实GUI/QS04/模型质量/完整成果/用户Product Acceptance/F-B01执行授权仍开放；32次建议不是许可或新限流。

PASS只绑定上述归档、manifest与环境。后续候选改变后，按影响重检entry/UUID配置、用途/codec、work/draft兼容、R1、安全/恢复及验证输入和旁路风险，不能沿用失效PASS，不要求无关阶段重来。旧Change007/119和试用修复-2继续停止。报告完成后停止。

