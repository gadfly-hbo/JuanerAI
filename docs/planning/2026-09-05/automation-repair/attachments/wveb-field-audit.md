# Historical input: wveb-field-audit.md

This is a preserved review attachment, not execution authority. Its old stop and approval statements describe its original turn; the current master plan records current authority. Repository links have been made relative; the audit and 379-leaf content is otherwise retained.

只读disposition已完成。结论为：

**`ADMISSION_VALUE_TYPE_CONFIRMED / CONTRACT_CLARIFICATION_REQUIRED`**

`cwd`与`head_sha`的类型缺口属于既有合同内缺陷；但全字段审计另外发现了**数组原型／继承方法的未冻结规则**，因此现在不能诚实冻结最终Test adoption或批准Correction 010。

本轮未修改文件、项目板或依赖，未恢复Agent，未运行focused/canonical。原63项RED→GREEN仍仅保留为局部实现证据。

## 1. 冻结现场读回

前后读回完全一致：

- Test：`19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a`
- production：`757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc`
- 50路径inventory：`67fdaf37c303cd704f9a607458e5560609cece2209f8cc2a39a4bb363a8d9125`
- 七文件OpenSpec、snapshot、项目板及其余路径字节未变。
- branch、HEAD、空index、registry、334/333/331 retention及两个混合文件均匹配。

## 2. L2字段逐项审计

依据[Design的subject规则](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/design.md:55)、[factory/request合同](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/design.md:189)和[统一拒绝规则](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/design.md:216)。

下列行号均指当前[production.mjs](../../../../../tools/harness/change-coordinator/production.mjs:338)。

| 字段 | 冻结类型／范围 | 当前guard、首次使用 | 结论 |
|---|---|---|---|
| factory.nodeExecutable | primitive string、绝对路径 | 544：先`typeof`，再`path.isAbsolute`；545取值 | 类型消费顺序正确 |
| request.definition | 精确八字段plain closed data object | 548检查request descriptor；549取引用；397检查definition descriptor | 不因读取字段而调用accessor |
| request.subject | 精确WorktreeSubjectV1 | 548取引用并调用389的closed检查 | 对象层顺序正确 |
| subject.kind | 精确`WORKTREE` | 390严格相等 | 不发生隐式转换 |
| subject.repository_root | 绝对、lexical-normal、无NUL、1..4096 UTF-8字节字符串 | 387先类型，再path/字节检查；502首次realpath | 类型安全；lexical-normal未在admission检查 |
| subject.worktree_root | 同上 | 同上 | 同上 |
| subject.common_git_dir | 同上 | 同上 | 同上 |
| subject.branch | 1..255字节字符串、冻结Mac-mini语法 | 391先类型/长度，392正则 | 类型消费顺序正确 |
| subject.head_sha | 40个小写十六进制ASCII字符 | 393直接正则；514/515复制到receipt；521序列化 | **缺少类型guard，可能转换、调用回调或泄漏异常** |
| subject.allowed_paths | dense closed string array、完整grammar/唯一性/交叉冲突/合计1MiB | 369检查own shape；371迭代；383序列化 | item类型先于字节操作；**继承的iterator/map仍可执行** |
| subject.forbidden_paths | 同上 | 369、377、383 | 同上 |
| definition.id | 两个固定字符串之一 | 397字面数组`includes` | 不进行字符串转换 |
| definition.validation_kind | 精确`REGRESSION` | 398严格不等 | 类型安全 |
| definition.validation_scope | 与id绑定的固定字符串 | 399–400严格比较 | 类型安全 |
| definition.subject | 精确`WORKTREE` | 398严格不等 | 类型安全 |
| definition.argv | 非空closed string array；首项精确Node | 401检查shape，再调用输入数组的`.every`；402首项比较；562`.slice` | **继承方法可能在item检查或消费时执行** |
| definition.cwd | 绝对路径字符串；realpath后contained | 402直接`path.isAbsolute`；505 realpath | **非字符串先泄漏原生TypeError** |
| definition.environment | plain closed、零own字段`{}` | 402调用descriptor-based检查 | 不读取caller环境值；类型安全 |
| definition.timeout_ms | 正safe integer Number | 403先`Number.isSafeInteger`，再数值比较；530用于timer | 不发生隐式转换 |

序列化入口也已对账：

- scope：383、385；
- definition：513；
- receipt：521及外层envelope hash。

**不能仅凭外层closed object成立，推断所有嵌套值都可安全序列化。** 40位数字的primitive bigint `head_sha`就能穿过正则，随后在receipt序列化处失败。

## 3. cwd/head_sha最小类型矩阵

已用固定Node `26.0.0`、真实公开factory和不存在的合法绝对root进行内存探针。未变异control返回：

```text
OK → START_FAILED / null / SUBJECT_MISMATCH
```

它用于区分admission拒绝和错误进入identity路径，不代表内部syscall计数。

### 共同的拟新增叶合同

下面每一行均为一个独立叶、仅改变所列字段：

- 映射：`TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-003,005`；回调隔离同时映射AC-WVEB-002。
- 保留request、subject、definition其余字段、descriptor、own keys和prototype；用strict identity确认未改变其他值。
- expected为Test侧固定合同：**拒绝，错误消息精确`INPUT_INVALID`，无resolved receipt**，不得接受“任意throw”。
- callback计数在构造后、公共调用前后均为零；不得通过字符串化或序列化变异对象生成expected。
- validation-child sentinel不存在；临时worktree的HEAD/index/status不变。
- ordering trap必须先由未变异control证明可区分；内部realpath/Git次数仍由结构审查承担。
- 复用已有临时worktree设施并finally清理；不新增seam、fixture文件或框架。

以下ID仅作为**标量部分候选adoption**，尚不是完整最终manifest。

### cwd：13个独立候选叶

| 新ID | 唯一值mutation | 当前实际frontier |
|---|---|---|
| N114 | `null` | 402：`TypeError / ERR_INVALID_ARG_TYPE` |
| N115 | `undefined`，字段仍存在 | 同上 |
| N116 | Number `7` | 同上 |
| N117 | boolean `true` | 同上 |
| N118 | bigint `1n` | 同上 |
| N119 | Symbol | 同上 |
| N120 | boxed String，内部是合法绝对cwd | 同上 |
| N121 | 普通空对象 | 同上 |
| N122 | `[合法cwd]` | 同上 |
| N123 | function值 | 同上 |
| N124 | 对象`toString`可返回合法cwd | 同上；回调当前为零 |
| N125 | 对象`toString`返回非primitive，`valueOf`可返回合法cwd | 同上；两个回调当前均为零 |
| N126 | 对象`Symbol.toPrimitive`可返回合法cwd | 同上；回调当前为零 |

这些输入目前没有发生自定义转换回调，但**错误类型／结果不符合合同**。不需要再增加“大bigint cwd”叶：它与N118同属相同path类型拒绝路径。

### head_sha：15个独立候选叶

`H`为Test侧固定合法40字符Head。

| 新ID | 唯一值mutation | 当前实际结果／frontier |
|---|---|---|
| N127 | `null` | 已正确返回`INPUT_INVALID` |
| N128 | `undefined`，字段仍存在 | 已正确返回`INPUT_INVALID` |
| N129 | Number `7` | 已正确返回`INPUT_INVALID` |
| N130 | boolean `true` | 已正确返回`INPUT_INVALID` |
| N131 | bigint `1n` | 已正确返回`INPUT_INVALID` |
| N132 | Symbol | 393：`TypeError: Cannot convert a Symbol value to a string` |
| N133 | `Object(H)` boxed String | 进入mismatch receipt；Head仍为原object |
| N134 | 普通空对象 | 已正确返回`INPUT_INVALID` |
| N135 | `[H]` | 进入mismatch receipt；Head仍为原array |
| N136 | 普通function值 | 已正确返回`INPUT_INVALID` |
| N137 | `toString()`返回H | 回调一次；进入mismatch receipt |
| N138 | `toString()`返回对象，`valueOf()`返回H | 两个回调依次执行；进入mismatch receipt |
| N139 | `Symbol.toPrimitive`返回H | 回调一次，hint为`string`；进入mismatch receipt |
| N140 | 40位十进制primitive bigint | 正则通过；521序列化抛`Do not know how to serialize a BigInt` |
| N141 | `toString()`返回非法Head字符串 | 最终虽为`INPUT_INVALID`，但回调已执行一次，**仍不合规** |

这明确区分了四种情况：

1. 原生TypeError泄漏；
2. 隐式转换／callback执行；
3. 非法值进入receipt；
4. 已有正确拒绝。

N127–N131、N134、N136可以直接PASS，绝不能强制计为新production RED。N141则证明“错误码正确”不等于authority隔离正确。

## 4. 阻止最终adoption冻结的额外发现

### A. 数组原型规则未闭合

[Design的closed-array定义](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary/design.md:64)精确限定own keys，但没有限定数组prototype。

本轮仅在输入数组上设置自定义prototype，未修改全局prototype、未使用Proxy。数组仍满足当前冻结的own-key描述，公开执行却得到：

| 输入 | 已观察到的回调 |
|---|---|
| argv继承自定义`every` | `every`一次 |
| allowed_paths继承自定义iterator | iterator一次 |
| forbidden_paths继承自定义iterator | iterator一次 |
| allowed_paths继承自定义`map` | `map`两次 |

四例均进入ordering-trap mismatch receipt。

**需要用户决定：**

- 是否将L2这三个数组限定为prototype精确`Array.prototype`，其他prototype直接`INPUT_INVALID`；
- 或继续允许这些数组，但要求生产完全不调用输入提供／继承的方法。

前者是较窄的实现方向，但会收紧当前输入集合，不能由Test或Worker自行添加。上述四例暂不能被擅自冻结成“必须INPUT_INVALID”的正式RED。

### B. 三个root的lexical-normal检查未在admission执行

对三个root分别只插入`/./`，保持规范化后的目标不变，均得到：

```text
OK → START_FAILED / null / SUBJECT_MISMATCH
```

当前387–388没有lexical-normal检查；检查推迟到realpath/identity阶段。

Design §2.2要求输入已是lexical-normal，§4.1要求无效subject早期`INPUT_INVALID`；§3又将“noncanonical identity”归入mismatch。需明确区分：

- **输入字符串本身非lexical-normal**；
- **语法合法，但真实filesystem identity不匹配**。

建议前者归admission `INPUT_INVALID`，后者保留`SUBJECT_MISMATCH`。不能只补两个`typeof`便宣称完整L2范围审计闭合。

## 5. Adoption、根因及停止结论

已用AST展开当前279项，逐项验证唯一ID、当前正文和注册位置。保留映射精确定义为：

```text
对每个 C001..C166：retain，同ID，当前正文不变
对每个 N001..N113：retain，同ID，当前正文不变
replace = 0
delete = 0
```

上述逐项记录包含`id/disposition/target/line/bodySha256`，有序记录SHA-256：

```text
cd8a5eec29f14224709b22bf56a5f8f6c919fa0480a1556461510a2e08c54393
```

标量部分候选为28个新增叶，因此**仅标量部分**是：

```text
279 retain + 0 replace + 28 add − 0 delete = 307
```

**307不是最终总数，也不是本轮冻结的完整adoption。** 数组规则和root分类未闭合前，不能把它作为Correction 010批准依据。

此前漏检的根因是：

- closed-object矩阵主要变异容器shape、descriptor及代表字段`kind/id`；
- cwd既有叶覆盖relative/outside/symlink，未覆盖非字符串；
- Head主要覆盖格式或identity mismatch，未覆盖正则之前的primitive类型；
- Review验证了descriptor回调，却未追踪嵌套值经过正则、path API、数组方法及serializer时的消费顺序；
- 最终错误码和279/279不能代替上述逐字段分析。

流程改进仅建议：增加“字段值 → guard → 首次消费 → serializer”的审查表，以及“返回正确错误但callback非零”的判别叶。本轮未修改任何规则或retrospective。

### 下一步批准语句

当前不应批准Test修订。建议先确认以下窄合同决定：

> 批准闭合WVEB L2 admission的剩余合同边界：明确argv、allowed_paths、forbidden_paths是否要求prototype精确为Array.prototype；明确非lexical-normal root属于admission INPUT_INVALID，合法词法形式的真实identity不匹配才属于SUBJECT_MISMATCH。
>
> Controller据此返回必要的Spec clarification范围及完整Test adoption；保留现有279叶全部证据目的。不得自行扩展L1、其他gateway、共享工具或路径。
>
> WVEB继续MANUAL_CONTROLLER_STOP。本次不授权Test Correction 010、Worker Revision 003、角色派发或任何写入。

合同决定闭合后，再按 **Spec必要修订 → Test补证 → 独立RED/Readiness → 用户绑定新Test重发TDD_READY → bounded Worker revision** 执行。当前停止于合同决定之前。
