**FAIL — OFFLINE ENGINEERING ONLY。完整固定候选存在两项阻断：审查记录的 Store 校验遗漏，以及长成果合法恢复窗口被提前截断。**

本次由同一作者独立的 JuanerAI Validator CLI 上下文完成，未参与候选编写。直接核对原生 session 记录后确认：session `01a1526f-d0f3-7742-9a7b-e1f7660a365e`，实际 `gpt-6-astra / max`、`read-only`、`approval never`。完整 developer 消息摘要与[设置读回记录](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/validator-cli-001/ACTUAL-SETTINGS-READBACK.json)一致。`session_meta.agent_role` 为 `null`；独立 Validator 职责由实际加载的完整角色指令确定。没有切换模型、派生 Agent 或申请沙箱例外。

**候选身份已独立核实。**

审查目标为 [fixed-candidate-001](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/fixed-candidate-001/README.md)，包括新增内容，未以 tracked diff 代替完整候选。

| 项目 | 核对结果 |
|---|---|
| Base HEAD / tree | `41e6c1f167cea578960a2d0c75e86e5f31a9190e` / `adfee55bfd25b24f4cff06b5589aab0db9e470ed` |
| Archive | 58,326,951 bytes；SHA-256 `7977506e0d1f45e7ef56ccaafc411b3b33b1d5f433bc3e0130a8c4b8f506dc5c` |
| MANIFEST.json | 575,049 bytes；SHA-256 `05064f680ec9f0c0497eae10dafdcbf4e5d964387f403e06900e37ab333e08a2` |
| 完整文件检查 | 2,470 个清单条目的大小、摘要、权限匹配；无缺失或额外文件；归档内容匹配 |
| 执行树对应关系 | 2,349 个冻结源码文件全部匹配 W；结束前再次核对通过 |
| 来源归属 | 67 个变更／新增路径分别与 main、固定119及候选核对，归属摘要无差异 |
| 依赖 | 固定 `.5` 安装的 57 个文件与包逐字节匹配；lock 仅根 SDK 引用和 SDK 条目改变 |

清单记录的 source manifest SHA 为 `8e8a09a62443f5cd8fc0b3d0b61621106255679c1c613445e688a0d232a2180f`；behavioral SHA 为 `f254b66c765fff957e5010f9340e4a7bceac4e5b131d748d1dc0e4094d4e6fa6`。最终证据的前后行为文件集合相同，并逐文件匹配当前固定候选。

**验收依据先于作者材料读取。**

先读取批准的 README、MINI-START-PROMPT、正式附件及必要合同，再检查候选 spec/design、实现、测试和证据。我的验收理解如下：

| 判据 | 必须成立的行为 |
|---|---|
| C1 | Pi 实际持有正常多轮控制；宿主提供业务能力和边界。 |
| C2 | 合法替代路线能够完成任务，必要业务前提继续有效。 |
| C3 | 语义和来源真实绑定；IR 改变真实计算；独立核验、证据及正式成果保存读回成立。 |
| C4 | 声明、实际参数、执行及错误事实一致，不静默改业务含义。 |
| C5 | 越权和不合格成果被拒绝；明确未执行、失败、UNKNOWN 分开处理。 |
| C6 | 系统维护已知身份和登记；Pi 运行态与业务成果各守权威，计量和未知效果不丢失。 |

三项职责约束是：一条正常运行控制链；三核心保留专业能力；业务系统约束动作和成果。八类接缝均纳入审查：参数合同、发现／暴露、确定性手续、错误推进、资源策略、文件／长成果、活动入口及兼容、状态／恢复。实际入口范围包括普通 Browser、first-loop/shared-work、Personal Profile、各 purpose、委派／Fork、retained 及合法旧兼容路径。

**阻断 F-STORE-01：持久 Store 漏掉审查记录的完整校验。**

要求涉及 C3/C4/C6、H 技术保障和同版正式成果边界。

候选 [Store `decode()`](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/fixed-candidate-001/source/adapters/storage-local/open-analysis.ts:165)接受 `review_policy`、`review_checkpoint`、`review_updates` 字段，却遗漏了固定119原有的三处检查：

- `review_policy` 合法值检查；
- `reviewRecord(review_checkpoint, validationTask)`；
- `validateReviewUpdates(t)`。

实际 `get/readRow` 和 `save` 共用这个 decoder，因此遗漏同时影响持久读回和保存边界。

独立反例使用**内存转译的原候选模块，仅增加 decoder 导出以便调用**，没有修改源码或数据库。有效 saved/ready 基线均通过；随后以下非法对象也被接受：

| 反例 | 实际结果 |
|---|---|
| 未识别的 `review_policy` | decoder 接受 |
| 没有对应业务基础的 completed checkpoint | decoder 接受 |
| 无效 command ID、错误前序 hash、没有合法基础审查的 completed update | decoder 接受 |

对最后一个对象直接调用现有 `validateReviewUpdates`，正确返回 `JUDGMENT_REVIEW_INVALID`；但 decoder 返回值进入实际 `openTaskView()` 后，`judgmentReview.delivery` 仍暴露了插入的 `VALIDATOR_PROBE_UNREVIEWED_CONTENT`。

影响是完整 Store 边界不再保证审查记录有效，重新计算行摘要不能补上这项保障。这是技术校验遗漏，与任意语言语义质量无关。

**复查条件：**恢复完整读写边界校验，验证重新计算摘要的非法记录仍被拒绝；覆盖 checkpoint、更新链、同版身份、修订正文与 claims 配对、retry 次数，以及旧版本与 main preparation 合同兼容。单独调用核心校验函数的测试不足以关闭此项。

**阻断 F-RECOVERY-01：实际长成果路径未把合法恢复传递给草稿 Store。**

批准的[资源合同](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/verified-materials-8262153b4b77/MINI-AGENT-HOST-SIMPLIFICATION-START-v0.1-20261019/inputs/change007/payload/contracts/engineering/history/resource-wait-113.md:3)保留 Pro 120/240 秒、Flash 60/120 秒及完整工作300秒边界。

[长成果包装层](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/fixed-candidate-001/source/packages/application/open-analysis-long-artifact.ts:29)创建 `artifactWork.admit`；[草稿 Store](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/fixed-candidate-001/source/adapters/storage-local/open-analysis-draft.ts:31)只有登记恢复后才采用 `recovery_ms`。但是[实际 Native 授权入口](/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/fixed-candidate-001/source/adapters/agent-pi/native-open-analysis.ts:309)仅更新 business-work，未调用该回调；生产代码中没有其他调用方。

独立探针使用实际包装层和实际 DraftStore、纯内存文件系统及模拟时钟，runtime 边界为合成替身：

| 场景 | 经过时间 | 结果 |
|---|---:|---|
| 按实际缺失回调路径，恢复后写入完整报告 | 130秒 | `ARTIFACT_STAGE_DEADLINE` |
| 对照：登记同一 logical request 的正常尝试及一次恢复 | 130秒 | 完成并封存 |

130秒仍处于批准的240秒恢复窗口及300秒总期限内。当前实现会提前拒绝这种合法结果；60秒形成／审查路径有相同接线问题。现有 LA38 验证底层恢复额度，但绕过 Profile 的长成果包装层，不能排除此缺陷。

**复查条件：**通过实际 Browser/Profile 长成果组合，覆盖跨越首次窗口但仍在恢复窗口内的形成、修订和逐页审查；同时保留一次恢复、300秒绝对截止、撤权、取消、迟到及 UNKNOWN 反例。

**实际完成的检查与证据范围。**

- 独立运行18项允许的定向测试，全部通过：包含 schema 等价、真实 IR/独立算术、陈旧身份与撤权、缺少持久准入、取消、缺失工作、H全文／成本／主体对应、受控 R 和 UI 结构。
- 独立执行 `tsc --noEmit`，通过。
- 独立执行上述两个内存反例，确认两项阻断。
- 仅以只读方式查询本任务的三个 LA09 合成数据库；行摘要、封存 JSON 与实际记录一致。正常链保存 exploration=49、独立核验=7；语法和沙箱拒绝链无 Outcome，三处 canary 均为 `UNCHANGED`。
- 原正常 Python 程序33,414 bytes，与固定119原程序逐字节相同。使用指定 Python 3.14.4 只编译、不执行：正常／沙箱程序语法有效，语法反例在第1001行拒绝。
- 重算89个实际 codec DTO 的组件字节数及峰值，全部匹配。它们是 UTF-8 JSON 字节，不能当作 Provider token；64KiB程序上限、200k窗口和4096输出预留保留。
- 审计并复用身份绑定的 Canonical058：19组 exit0，5,089 tests／5,081 PASS／0 FAIL／8 SKIP，362.356秒。另核对 native-host059 的两项实际 Mac host 检查。
- 检查长报告全文／32页原子性、缺页／重复／错版本、条件回答／修订／retry、同版消费者、被动重开、取消／迟到／UNKNOWN、R1–R4、purpose/fallback、委派及兼容路径的实现和最终证据。

8项跳过明确保留：3项云端归档／成员证明、1项真实 Pi 验收、4项安装环境相关 PDF／Office／OCR 检查。

测试资产审查确认，删除额外 `GOAL_COMPLETION_REVIEW` 调度断言后，同轮真实工作和缺失工作拒绝断言仍保留；schema 与 CI 输入清单的闭合反例也保留。受控共同误判仍明确为 **Q_FAIL**。现有测试未覆盖上述 Store 接线遗漏及跨首次期限的合法恢复，这是两项阻断对应的覆盖缺口。

无另外的非阻断建议。

执行受限于只读沙箱：未重跑需要写盘、服务器或原生 OS 例外的完整套件，相关部分采用已核实身份的最终证据。图谱工具被当前审批策略拒绝后，使用 brief 允许的有界源码读取。未执行真实 Provider、业务数据访问、依赖变更、Git 操作或项目状态写入。

历史边界保持：old119 为 `AUTHOR_OFFLINE119_FAIL_RETURN_INTERFACE_ASSESSMENT`，无120，下一次被拒 DTO 为 UNKNOWN；4任务／376物理记录／33组 token UNKNOWN／cost UNKNOWN 仍为回执事实。repair2 live12 的精确 invalid arguments 根因 UNKNOWN，27仅属于该轮，全线累计 UNKNOWN。A/B、QS04、Desktop/Supplier、真实Q及用户产品接受均未关闭；40能力六加二全图 delta=0。

本候选不能取得离线工程 PASS。修复后应冻结新候选，独立复查上述受影响路径及关联回归。本报告不构成 Engineering Acceptance、Product Acceptance、Git／发布授权或真实Q成功。本次独立审查至此停止。

