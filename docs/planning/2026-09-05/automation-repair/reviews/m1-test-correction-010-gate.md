# M1 / B0 — Test Correction 010 Controller Gate

## Decision

2026-09-05: `EXPECTED_RED_ACCEPTED / TEST_ASSET_READINESS_PASS / PRE_WORKER_TEST_ASSET_RETIREMENT_PASS / AWAITING_USER_TDD_READY`.

这是当前 Test 补证阶段的 Controller 接受，不是生产 GREEN、最终 post-GREEN Retirement、Validator PASS 或 B0 关闭。B0–B5 本轮均未关闭。S02 已修正并重过原 379 Test adoption / 因果 RED / Readiness 验收点，返回 M1 主线。下一步只有用户绑定下列 Test 身份重新确认 TDD_READY 后，才可释放既有两生产路径的最小 Worker Revision 003。

授权：[Test brief](../m1-test-correction-010-brief.md)；用户本轮“批准”仅涵盖 Test010 和临时 terra/high，不覆盖 Worker。实际角色 `/root/wveb_test_correction_010` 已完成并停止写入；Controller 独立重跑后作本决定。

## Frozen identity and scope

| 项 | 当前身份 |
|---|---|
| 唯一 Test | tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs |
| Test SHA-256 | `4dafee2331a10a53c370d75fc217914352d089267d0b9354b1d5b7596e890f98` |
| Test 大小 | 132605 bytes / 1593 lines |
| 原前缀 | 111031 bytes / 1326 lines；SHA-256 `19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a`；逐字节相同 |
| 新增 | 267 lines；N114..N213；379 unique leaves；原顺序保留，追加顺序精确；零 replace/delete |
| snapshot | `43e72532f3e68069fdc6be8198dcc706c9961ba33457d5c1fde61cd53a4563b0`；12512 bytes；本轮未改 |
| production | `757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc`；49283 bytes；本轮未改 |
| HEAD | `33f04a35d13abe64f4394d54eec166b58cb44716` |
| branch / index | work/macbook/change-coordinator-worktree-validation-execution-boundary / 空 |

Controller 比较了本轮入口 1199 个文件的 SHA：除唯一 Test 与 Controller 所有的 NEXT_ACTION、verification、traceability、project-control 状态外，其余已有文件无变化。新增仓库路径仅 Controller brief、Gate 证据和状态事件；没有第二 Test、fixture、helper、依赖或生产路径。

## Executable results

| 执行者 / 命令 | 结果 | 证据 |
|---|---|---|
| Test role，显式 TAP focused | 379 tests；322 PASS / 57 FAIL；exit 1；skip/todo 0 | [final3 stdout](/private/tmp/juanerai-test010-testrole-20260905/focused-final3.stdout.tap) |
| Controller，独立显式 TAP focused | 同一 SHA；379 tests；322 PASS / 57 FAIL；exit 1；cancel/skip/todo 0；stderr 空 | [完整输出](/private/tmp/juanerai-test010-controller.vDM28Y/controller-focused.stdout.tap)、[结果](/private/tmp/juanerai-test010-controller.vDM28Y/controller-focused.result.json)、[完整 inventory](/private/tmp/juanerai-test010-controller.vDM28Y/controller-focused.inventory.json) |
| Controller，三个指定 related 文件 | 302/302 PASS；exit 0；stderr 空 | [完整输出](/private/tmp/juanerai-test010-controller.vDM28Y/controller-related.stdout.tap)、[命令及结果](/private/tmp/juanerai-test010-controller.vDM28Y/controller-related.result.json) |
| Test built-in 环境探针 | 1/1 PASS；exit 0 | [健康探针输出](/private/tmp/juanerai-test010-testrole-20260905/environment-health.stdout.tap) |
| Controller toolchain / diff | Node v26.0.0、Git 2.54.0、TypeScript 5.9.3；git diff --check PASS | 本轮实际读回；command-local toolchain，与 brief 相符 |

focused 命令：

```text
PATH=/Users/huangbo/Dev/Env/homebrew/bin:/usr/bin:/bin
unset XANTHIL_REAL_PI_ACCEPTANCE
/Users/huangbo/Dev/Env/homebrew/bin/node --test --test-reporter=tap tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs
```

三个 related 文件为 coordinator.test.mjs、project-board/project-control.test.mjs、project-board/status-cli.test.mjs。这是明确命令子集，不宣称已重跑历史完整 Coordinator 358/358。canonical 未运行，保留到生产修复后；无真实 provider/model、产品 DISPATCH、远端 Git/PR/Handoff。

## Exact causal frontier

Controller 读取全部运行结果，并逐失败核对 error 与 stack；没有将 TypeError、缺失拒绝或 callback 调用混称为同一种实现细节，也没有把 helper failure 当作缺失产品行为。

| 原阻塞内缺陷 | 因果 RED IDs | 数量 | 实际失败 frontier |
|---|---|---:|---|
| L2 cwd primitive guard | N114..N126 | 13 | production validateDefinition 先进入 path.isAbsolute，抛 ERR_INVALID_ARG_TYPE 而非 INPUT_INVALID |
| L2 head primitive / callback guard | N132,N133,N135,N137..N141 | 8 | Symbol regex TypeError；boxed/array/转换对象缺失拒绝；bigint 进入 JSON serialization；N141 错误码虽正确但转换 callback 已调用 |
| L1 array qualification | N143..N146,N150..N153,N157..N160 | 12 | 自定义 prototype/隐藏 index 到 OK；继承 method/getter 被调用 |
| L2 array qualification | N163..N166,N170..N173,N177..N180 | 12 | null prototype 在 every/iterator 产生 TypeError；其他 prototype 缺失准入拒绝 |
| L2 lexical roots | N199..N202,N204..N207,N209..N212 | 12 | 未在 INPUT_INVALID frontier 拒绝，进入身份处理 |
| 合计 | 精确以上集合 | 57 | 全属 B0 既有五类准入问题 |

原 279 叶全部 PASS；新增 43 PASS 不伪造成 RED：7 个已正确 scalar 拒绝、18 个数组正向或已正确拒绝、18 个 root 场景。六个 L1 frozen/readonly 正向使用独立 snapshot oracle；六个 L2 正向每次 execute 使用真实 child 与完整 24 字段 receipt。L1 三个 / 叶仅变目标 root 及对应观察身份；L2 三个 / 叶是合法词法加另一 root 的 mismatch trap，不声称 validation 成功。

RED 后尚未运行到的 no-child/state/callback 后续断言必须在 Worker GREEN 时实际全部通过；本次接受的是可执行约束与因果 frontier，绝不声称 57 个失败叶已证明所有后置条件成立。

## Readiness and S02 return

Controller 审查了完整追加段、原 retained helpers/公共调用及有限生产准入点。预期值来自既有 Test-owned independent oracle，未导入生产 canonical/hash helper。原 279 段逐字节保留，确保 helper/正文/注册顺序不迁移。

S02 原因：新增草稿的 scalar conversion 对象、root control/trap、单 mutation、expected-before-mutation 和 descriptor 自检没有完整实现已批准 manifest；其中一次实际运行的六个 hidden-index 叶在自检阶段失败。Controller 按复杂度规则归类为 invalid/incomplete Test，生产冻结，留在同一获批 Test 追加段修正，不改变 R2、角色、接口、范围或主路线。

关闭证据：

- 同一对象的 toString/valueOf 路径已正确构造；target scalar descriptor 与邻居严格 value identity 自检已在生产调用前执行。
- root control 先设置另一字段为 trap，确认完整 mismatch receipt，随后只变目标字段；路径 normalized target 用 Test-owned path.resolve 核对，不要求生产 normalize。
- prototype-only / hidden-index / readonly / frozen 的 keys、value、相应 descriptor 和 callback-before 检查完成；L2 positive 完整 expected receipt 在 mutation 前生成。
- 六个 hidden-index 自检不再失败：N167/N174/N181 PASS；N146/N153/N160 失败于生产返回 OK，与本来应为 INPUT_INVALID 的合同对比，而非 helper。
- 独立 focused 与角色最终结果相同，所有控制/前置构造检查通过；无 unrelated baseline failure。恒定零且无 callback 消费者的 root 计数已移除。
- 返回点就是原 M1/B0 379 adoption / 因果 RED / Readiness；本 Gate 接受后 S02 标记 CLOSED_RETURNED，不计 B0 关闭。

中间日志保留在 Test 临时证据目录，文件名 focused-final 并不等于 Gate 接受；其中 319/60 含自检失败，不是接受身份。只有本报告冻结的 SHA 和 Controller 重跑是当前 Test Gate 输入。

## Test asset lifecycle and retirement

| 资产 | Class / evidence owner | distinct purpose / retained consumer | disposition |
|---|---|---|---|
| 原 C001..C166、N001..N113 及其 helpers | permanent regression；REQ-WVEB-001 / AC-WVEB-001..006 | 历史因果、bigint、环境、receipt、真实 child、AST/sole-consumer 与封闭合同 | retain；整段字节不变 |
| N114..N141 + scalarHostile/assertScalarAdmissionInvalid/scalarCases | permanent regression；AC-002,003,005 | 两个字段的 28 个独立非法值/转换路径 | retain；未来 GREEN 后仍保留 |
| N142..N162 + L1 array support | permanent regression；AC-001,005 | 三个 L1 数组的 7 类 prototype/descriptor/readonly 资格 | retain |
| N163..N183 + L2 array support | permanent regression；AC-002,003,005 | 三个 L2 数组的 7 类资格与真实 child/完整 receipt | retain |
| N184..N198 + L1 root support | permanent regression；AC-001,005 | 三字段 × 五词法场景及独立空 snapshot | retain |
| N199..N213 + L2 root support | permanent regression；AC-003,004,005 | 三字段 × 五场景的 admission/identity 分界 | retain |
| 临时环境探针、独立执行包装器、Test subjects/children | temporary evidence；无生产权威 | 仅环境健康或命令输出捕获；不注册到正式379 | 仅 /private/tmp；测试自行清理其 subjects/children；保留日志作证据 |
| retirement candidate | none | 没有被替换的正式消费者或 unowned repo helper | 无删除 |

Controller 对完整 Test 资产及本次 delta 执行 ponytail-review：`Lean already. Ship.`。这仅表示没有需要新机制或额外路径的复杂度问题，不是软件交付。构造重复按两层不同 oracle/side-effect 边界保留，100 叶各有正式 manifest 中的不同目标与 mutation。对 skip/todo/only、temporary/scratch/correction 标记检查：正式运行 skip/todo 0，无 Test 调度跳过开关；历史 Correction 注释用于溯源，临时 Git/child 是正常受控 fixture 生命周期，不是应删除的正式覆盖。

当前 Test-only 生命周期与退休审查 PASS；Worker 后仍必须在 GREEN/受影响完整 regression 后重做正式 Retirement Gate，才可 freeze 给新 Validator。既有 RETRO-WVEB-VALIDATOR-CLOSED-INPUT-TIMEOUT-001 的完成读回也仍是新 Validator 前条件。

原 productionAst/C164 代码及消费者 inventory 叶完整保留并实际 PASS。其动态单读/版本/UTF-8/AST 查询断言继续拥有原证据；本报告记录的生产 SHA 是外部阶段身份，不声称 TAP 打印了内部完整 AST 对象，不把该 SHA 写进 Test 常量。

## Evidence fingerprints

原始详细日志保存在上述两个临时证据目录；下列摘要便于续接校验。临时证据若被系统清理，按冻结 Test/production 身份重跑同一检查，不重新研究或改变路线。

| Controller artifact | SHA-256 |
|---|---|
| controller-focused.stdout.tap | `62d7762aab61a6f6b6575bcdb38e9be61ea8f8ab273491fc12ca672f677f886a` |
| controller-focused.stderr.log | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| controller-focused.result.json | `a65672ed065692491a11cbb612e548f58bf8275e2015e59900261fa82b7c7eba` |
| controller-focused.inventory.json | `24d8d41cb4d01dd2be3c69c7eb35a17405245455feb59c96f5baf5087f5b966b` |
| controller-related.stdout.tap | `be286cfed9b66ef57ad34b0077ebab3397a0aa75b171468607a047188a7ceebe` |
| controller-related.stderr.log | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| controller-related.result.json | `60c92fd61716dafe58e621037d11a974d6ada2359cd43afea2a378d9f7560636` |

## Exact registration inventory

以下是 Controller 实际 TAP 的 379 个 ID 顺序，不是按 ID 排序后拼出的预期值。逐叶名称、pass/fail 与序号见完整 inventory JSON。

```text
C001 C002 C003 C004 C005 C006 C007 C008 C009 C010 C011 C012 C013 C014 C015 C016 C017 C018 C019 C020
C021 C022 C023 C024 C025 C026 C027 C028 C029 C030 C031 C032 C033 C034 C035 C036 C037 C038 C039 C040
C041 C042 C043 C044 C045 C046 C047 C048 C049 C050 C051 C052 C053 C054 C055 C056 C057 C058 C059 C060
C061 C062 C063 C064 C065 C066 C067 C068 C069 C070 C071 C072 C073 C074 C075 C076 C077 C078 C079 C080
C081 C082 C083 C084 C085 C086 C087 C088 C089 C090 C091 C092 C093 C094 C095 C096 C097 C098 C099 C100
C101 C102 C103 C104 C105 C106 C107 C108 C109 C110 C111 C112 C113 C114 C115 C116 C117 C118 C119 C120
C121 C122 C123 C124 C125 C126 C127 C128 C129 C130 C131 C132 C133 C134 C135 C136 C137 C138 C139 C140
C141 C142 C143 C144 C145 C146 C147 C148 C149 C150 C151 C152 C153 C154 C155 C156 C157 C158 C159 C160
C161 C162 C163 C164 C165 C166 N001 N002 N003 N004 N005 N006 N007 N008 N009 N010 N011 N012 N103 N104
N013 N014 N015 N016 N017 N018 N019 N105 N106 N020 N021 N022 N023 N024 N025 N107 N108 N026 N027 N028
N029 N030 N031 N032 N109 N110 N033 N034 N035 N036 N037 N111 N038 N039 N040 N041 N042 N043 N044 N045
N046 N047 N048 N049 N050 N051 N052 N053 N054 N055 N056 N057 N058 N059 N060 N061 N062 N063 N064 N065
N066 N067 N068 N069 N070 N071 N072 N073 N074 N075 N076 N077 N078 N079 N080 N081 N082 N083 N084 N085
N086 N087 N088 N089 N090 N091 N092 N093 N094 N095 N096 N097 N098 N099 N100 N101 N102 N112 N113 N114
N115 N116 N117 N118 N119 N120 N121 N122 N123 N124 N125 N126 N127 N128 N129 N130 N131 N132 N133 N134
N135 N136 N137 N138 N139 N140 N141 N142 N143 N144 N145 N146 N147 N148 N149 N150 N151 N152 N153 N154
N155 N156 N157 N158 N159 N160 N161 N162 N163 N164 N165 N166 N167 N168 N169 N170 N171 N172 N173 N174
N175 N176 N177 N178 N179 N180 N181 N182 N183 N184 N185 N186 N187 N188 N189 N190 N191 N192 N193 N194
N195 N196 N197 N198 N199 N200 N201 N202 N203 N204 N205 N206 N207 N208 N209 N210 N211 N212 N213
```

## Next Gate

返回主计划 M1/B0：请求用户以 Test SHA `4dafee2331a10a53c370d75fc217914352d089267d0b9354b1d5b7596e890f98` 确认新的 TDD_READY，并明确释放已有两个生产路径的最小 Worker Revision 003。临时 terra/high Test 授权已经结束，不能自动复用为 Worker 角色替代授权。正式 Worker 路由和 brief 必须单独记录；在这之前不改生产。

恢复及固定四点回执见 [NEXT_ACTION R004](../NEXT_ACTION.md#progress-receipt-r004)。M2/B1–B5、M3 与 M4 顺序和终点均不变。
