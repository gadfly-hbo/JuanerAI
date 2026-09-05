# M1 六文件澄清：Controller Spec Gate 001

- 日期：2026-09-05；主计划 M1 / B0。
- Controller 决定：`SPEC_GATE_PASS / TEST_AUTHORIZATION_PENDING / MANUAL_CONTROLLER_STOP`。
- PASS 仅覆盖本次 Spec 澄清；B0–B5 本轮均未关闭。Test Correction 010、TDD_READY、Worker Revision 003、Validator 和集成均未放行。
- 用户明确批准的临时 Spec：`/root/wveb_spec_admission_379`，`gpt-5.6-sol/high`；返回后已停止写入。本次替代不延伸到其他角色。
- 输入：[六文件 brief](../m1-spec-clarification-brief.md)、既有字段审计及 379 附件。未重新进行泛化调查。
- [六文件角色返回 diff](m1-spec-clarification-001.diff) 保存角色修改前后对比；下列身份是 **Spec 返回 / Controller Gate 输入**，不包含 Controller 后续状态标注。

## 正确性与范围审查

Controller 完整读取七文件，对实际六文件 delta 与完整包作一致性审查。

| 检查 | 结论 |
|---|---|
| cwd/head primitive string | 在 path、regex、转换和序列化前拒绝非 primitive string |
| 六个 caller-owned 数组 | 当前 realm Array.prototype、dense own enumerable data indices、内建 length；frozen/readonly 接受 |
| 输入执行边界 | 输入方法、迭代及回调之前完成 admission；拒绝路径 callbacks=0 |
| root taxonomy | 非 lexical-normal 为 INPUT_INVALID；词法合法后的身份冲突为 SUBJECT_MISMATCH；根目录 / 合法 |
| 精确 Test adoption | 279 retain + 28 scalar + 42 array + 30 root = 379；N114..N213 映射到正式附件 |
| 原测试保护 | 原 279 IDs/order/bodies/helpers/purposes 不变；零 replace/delete/renumber/merge |
| Requirement/AC | 原 Requirement 与六个 AC 文本逐项相同 |
| 受保护合同 | receipt/hash/timeout/env/public surface 不变；无 L3 解锁 |
| 历史证据 | Validator 001 FAIL 保留为最新已完成独立 verdict；Worker Revision 002 为历史局部 GREEN，不暗示新输入已验证 |
| 实际范围 | 角色只改六个指定 Spec 文件；proposal、Test、两个生产文件、审计及候选附件字节不变 |

同一澄清内修正了两处一致性问题，没有另开支线：

1. Test 首次写入的前置条件为 Spec Gate PASS、具体 Test 授权、冻结 append-only manifest；新 Test identity、RED、Readiness、Retirement 与再次确认是后续 TDD_READY 条件，避免把 Test 写入锁在自身产物之后。
2. 旧 Validator 缺陷描述限定于旧 frozen stage，不把其每项发现当作当前代码仍未修复的事实。

既有 `RETRO-WVEB-VALIDATOR-CLOSED-INPUT-TIMEOUT-001` 不被本 Gate 豁免。新 Validator 前必须读回该回顾已完成的证据；若缺失则完成既有要求。当前未找到完成证据，归属原 B0 后续放行条件，不新增修复范围，也不重复已完成工作。

## Ponytail / complexity

对完整七文件包运行 Controller ponytail-review：`Lean already. Ship.`

该结论仅表示无需删除额外设计机制，不是软件交付或 Acceptance。澄清沿用既有 admission 与唯一 Test 路径，没有新 parser 层、注册表、重试、持久化状态、公共接口或运行权限；379 明细复用现有附件。

## 实际检查

只读文档检查结果：Requirement/AC 一致、精确六 AC、proposal 不变、Design hashing/execution/receipt/effects 原块不变、代码围栏配对、无尾随空白、相对链接可解析，全部 PASS。`git diff --check` PASS。

未运行 focused、regression、canonical 或真实 child/model/provider；未安装依赖。未发现可用 openspec CLI，未宣称运行 openspec validate；本次 Gate 依据完整文档审查与上述实际检查。索引为空，HEAD 与分支不变。

| Spec 返回文件 | 行数 | 字节 | SHA-256 |
|---|---:|---:|---|
| `proposal.md` | 86 | 6115 | `f90295495e3cc2cc0107923c2841b2277b187fa89fa2641edb208d0b66b2742a` |
| `design.md` | 322 | 26907 | `e50a9088ff01b9369661834fd12daae4c7c987344a1c950b78c989464dd54fba` |
| `specs/dual-device-transition-foundation/spec.md` | 120 | 17001 | `e8abb2cbab0bb4c374529ff71f76cf8d4b3aba96c53f70793ba3441782562796` |
| `test-plan.md` | 206 | 36222 | `ff304308827cd3cac77f714d7661b7dcc0cf6b8c0958ffcf457a4ec2989d3eb9` |
| `tasks.md` | 101 | 14787 | `a50038abb8659b2784a3083bdc714880fb8f68247a6b4f369f2a28a42211a176` |
| `traceability.md` | 52 | 7767 | `b3e0ed58fc150eebcfd5d289be714d672e2755efb5d5f39bd1f877bd6e80943d` |
| `verification.md` | 99 | 12011 | `ce963393264abada1d661ab61d50a24c5040802098b8a04cf459513b1ecf9456` |

## 不变输入身份

- Test：`19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a`
- snapshot：`43e72532f3e68069fdc6be8198dcc706c9961ba33457d5c1fde61cd53a4563b0`
- production：`757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc`
- 字段审计：`8fe9a828b533b2c53cc9ac6a93c83fa4248b8382cc1554f21ed69e7c1b2602b9`
- 379 附件：`e32c7157b147aa890f29bc106c59654b74c3128c9363b0959bcce7ec45021da2`
- HEAD：`33f04a35d13abe64f4394d54eec166b58cb44716`
- branch：`work/macbook/change-coordinator-worktree-validation-execution-boundary`

## 下一验收点与恢复

下一点是独立授权后的唯一 Test 文件 379 adoption 与因果 RED/Readiness；不是 Worker。当前用户批准仅限临时 Spec，不能重放为 Test Correction 010 或其他角色替代授权。通过 Test 阶段后仍须遵守新 Test identity 与后续 TDD_READY Gate。

恢复位置及四点回执统一见 [NEXT_ACTION R003](../NEXT_ACTION.md#progress-receipt-r003)。M0 不重开；S01 已返回原 Spec 派发验收点，无开放支线；B0 未关闭。

## Controller 状态标注后身份与最终读回

Controller 在角色停止后仅增加 Gate 状态标注，并同步 verification / traceability 的当前 verdict；规范行为未变。下表为上述元数据写回后的当前七文件身份，与前表角色返回身份区分，不冒充 Spec Agent 产物。

| 当前文件 | SHA-256 |
|---|---|
| `proposal.md` | `f90295495e3cc2cc0107923c2841b2277b187fa89fa2641edb208d0b66b2742a` |
| `design.md` | `3798f22f42fa15f48c0f270040903d4aa4c495d23d70f38690275d455ce67023` |
| `specs/dual-device-transition-foundation/spec.md` | `3dfd314053bb7d1f22c52cc519b7f5f4fbe76b21ea12dc218972f71c04f2bc46` |
| `test-plan.md` | `23fe4bd49cfc074f73d8c430f714001b1a04b599898d834686beedc7895f6ab3` |
| `tasks.md` | `9ea1f2fda4a9ab5f5582de571abe617a067c9daa53c29766a70686c240b715a2` |
| `traceability.md` | `1bf6f27cb1abba81da9db3c19c7bd75eb17516a8474a9b7fb4fd1770b55c9050` |
| `verification.md` | `bf9f6bfd7d133d660acf2ef013e9e6786f8ac6ba101f74556a18c0dba26ca9c4` |

最终读回：proposal、唯一 Test、两个生产文件均与本轮入口 SHA-256 完全相同；全部所查文档相对链接可解析；项目板 waiting_user / Spec complete / R003 与动作卡一致。既有其他脏文件及候选附件保持不变。

本轮只读核对脚本首次因命令行换行转义失败，未运行检查；修正调用方式后 exit 0，上述结论取自成功结果。此工具调用问题不构成产品缺陷或新支线。

