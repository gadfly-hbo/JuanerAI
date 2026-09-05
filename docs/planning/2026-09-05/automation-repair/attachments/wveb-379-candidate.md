# Historical input: wveb-379-candidate.md

This is a preserved review attachment, not execution authority. Its old stop and approval statements describe its original turn; the current master plan records current authority. Repository links have been made relative; the audit and 379-leaf content is otherwise retained.

合同方案可在**唯一Test文件及现有两个production文件内闭合**，无需第三生产路径、fixture、seam、依赖或运行时authority。

本方案完整组成为 **379叶：279 retain + 100 add，零replace/delete**。这是待Spec clarification编码、再经用户批准的adoption方案，不是本轮Test结果或Readiness PASS。

WVEB保持`MANUAL_CONTROLLER_STOP`。本轮全部只读，未运行focused/canonical、未派发Agent、未写文件或项目板。

## 1. 精确合同文字

### A. L1/L2统一普通数组规则

以下六处caller-owned数组统一适用：

| 层 | 输入数组 |
|---|---|
| L1 | `subject.allowed_paths` |
| L1 | `subject.forbidden_paths` |
| L1 | `observation.entries` |
| L2 | `definition.argv` |
| L2 | `subject.allowed_paths` |
| L2 | `subject.forbidden_paths` |

建议规范文字：

> 输入必须满足`Array.isArray(value) === true`，且`Object.getPrototypeOf(value) === Array.prototype`，其中`Array.prototype`为执行该模块的当前realm内置对象。
>
> own keys必须精确为dense索引`"0".."length-1"`及内置`length`；每个索引必须是自身、enumerable、data property，不得有hole、symbol、额外字符串属性、getter或setter。`length`必须保留内置non-enumerable data-property形式。
>
> 不要求索引或length可写，不要求索引可配置；合法frozen和readonly数组继续允许。各数组原有item、数量、scope、顺序和字节限制不变。
>
> prototype和descriptor资格检查必须先于该输入数组的方法读取、迭代、item消费及序列化。不接受自定义prototype，不复制、转换或规范化输入以绕过拒绝。
>
> L1无效数组返回精确`{kind:'REJECTED',reason:'INPUT_INVALID'}`；L2拒绝为稳定`INPUT_INVALID`，无receipt，并发生在identity、realpath、Git、snapshot及child之前。两层均不得调用输入提供的转换、迭代或方法回调。

这不增加跨realm兼容、realm隔离、Proxy处理、全局prototype防篡改机制。`Uint8Array`字节字段不是本次普通数组规则的对象，不改变其合同。

### B. cwd/head_sha类型

> `definition.cwd`必须是primitive string，在调用path API前检查类型。继续使用原绝对路径及realpath containment规则，不为cwd新增root的lexical-normal规则或额外长度限制。
>
> `subject.head_sha`必须是primitive string，在正则或任何其他消费前检查类型，再验证精确40字符小写十六进制ASCII形式。
>
> 非法类型必须返回`INPUT_INVALID`、无receipt、零转换回调；不得依赖path API、正则转换或serializer偶然拒绝。

### C. 三个root的词法与真实身份

> `repository_root`、`worktree_root`、`common_git_dir`沿用现有L1词法规则：primitive string、1..4096 UTF-8字节、绝对路径、无NUL；除单独的`/`外不得有尾斜杠；不得有重复斜杠、`.`或`..`路径段。
>
> 字符串不符合这些规则时，L1/L2均在input admission返回`INPUT_INVALID`。不得normalize后接受。
>
> 词法合法后，真实filesystem realpath／identity不匹配才属于`SUBJECT_MISMATCH`。因此“不规范输入字符串”与“真实身份冲突”不再混用。

## 2. L1所有相关数组及消费者

源码依据：[snapshot模块](../../../../../tools/harness/change-coordinator/worktree-snapshot-contract.mjs:30)。

| Caller数组 | 资格检查 | 后续消费者 |
|---|---|---|
| allowed_paths | `validScope → closedArray`，66行 | `every`、iterator；81行`map`；139行`some`；canonical中的`map` |
| forbidden_paths | 同上 | `every`、iterator；82/140行`some`；canonical中的`map` |
| observation.entries | 170行`closedArray` | 171行`every(validEntry)`；183行iterator；length关联检查 |

其余`keys`、`Reflect.ownKeys()`结果、parsed status和records数组由模块自身创建，不是caller-owned数组入口。

L2对应消费点位于[production.mjs](../../../../../tools/harness/change-coordinator/production.mjs:347)：

- argv：`every`、definition canonical序列化、之后的`slice`；
- 两个scope数组：iterator、scope canonical序列化。

还确认了一项现有差异：**L1的`closedArray`没有检查索引enumerable标志，L2已有该检查。** 本次统一必须补齐L1，不能只增加prototype比较。

只读探针已实际观察：

- L1三个数组的自定义prototype、继承方法、继承getter及隐藏data index目前均可到达`OK`；
- 继承方法／getter确实被调用；
- L1 null-prototype目前返回`INPUT_INVALID`，不能强制算RED；
- L2隐藏data index已经正确拒绝；
- 两层合法frozen／readonly数组均能通过本轮对应的准入探针。

## 3. 最小文件范围

### 必要Spec clarification：六个现有文件

在[当前Change目录](../../../../../openspec/changes/archive/2026-09-05-change-coordinator-worktree-validation-execution-boundary)内：

| 文件 | 必要修改 |
|---|---|
| `design.md` | 六个数组统一资格；标量guard顺序；root两阶段分类 |
| delta `specs/dual-device-transition-foundation/spec.md` | 同步规范性输入规则，不改变REQ/AC ID、receipt字段或算法 |
| `test-plan.md` | 下述完整379叶adoption及独立oracle/副作用规则 |
| `tasks.md` | Test补证和后续双文件Worker范围；不得复用旧单文件放行权 |
| `traceability.md` | L1/L2新增证据映射，区分新规则与既有正确拒绝 |
| `verification.md` | 本轮clarification的pre-review读模型及待执行Gate |

`proposal.md`、Requirement、六条AC、角色权限及路径边界不变。历史结果保留，不为同步措辞覆盖历史。

### 后续生产最小范围

| 文件 | 仅需处理 |
|---|---|
| [worktree-snapshot-contract.mjs](../../../../../tools/harness/change-coordinator/worktree-snapshot-contract.mjs) | 私有`closedArray`的prototype及完整data-index资格；覆盖其三个既有消费者 |
| [production.mjs](../../../../../tools/harness/change-coordinator/production.mjs) | WVEB私有array资格；cwd/head类型guard；三个root的词法admission |

不修改共享`closed()`、其他gateway、timeout实现、hash算法或receipt合同。snapshot模块**当前仍未解锁**；未来必须由新的Test证据及明确双文件Worker授权释放。

## 4. 完整leaf组成与顺序

### 原279叶：全部retain

逐项映射保持：

```text
C001..C166 → 同一C ID、同一正文、同一证据目的
N001..N113 → 同一N ID、同一正文、同一证据目的
```

已再次AST展开核对279个唯一ID。现有注册顺序保留，包括原本不按数字排列的N叶；新增部分统一追加为`N114..N213`。

原279叶及其共享helper不需要修改。历史双RED、C148/N085、bigint、environment、receipt、snapshot及AST inventory全部保留。

### A. 28个标量叶：N114..N141

全部属于`TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-002,003,005`。

| 唯一值mutation | cwd ID | head_sha ID |
|---|---:|---:|
| null | N114 | N127 |
| undefined，字段存在 | N115 | N128 |
| Number 7 | N116 | N129 |
| boolean true | N117 | N130 |
| bigint 1n | N118 | N131 |
| Symbol | N119 | N132 |
| boxed合法字符串 | N120 | N133 |
| 普通空对象 | N121 | N134 |
| 单元素数组，元素为合法字符串 | N122 | N135 |
| 普通function值 | N123 | N136 |
| toString返回合法字符串 | N124 | N137 |
| toString返回对象，valueOf返回合法字符串 | N125 | N138 |
| Symbol.toPrimitive返回合法字符串 | N126 | N139 |
| 40位十进制bigint | — | N140 |
| toString返回非法Head字符串 | — | N141 |

全部最终要求精确`INPUT_INVALID`、无receipt、callback零调用、无child。

当前已有正确拒绝的Head案例保留为PASS证据；N141即使错误码正确，只要callback执行仍必须FAIL。

### B. 42个数组叶：N142..N183

每格是一个独立stable ID。

| 唯一mutation／正向场景 | L1 allowed | L1 forbidden | L1 entries | L2 argv | L2 allowed | L2 forbidden |
|---|---:|---:|---:|---:|---:|---:|
| null prototype | N142 | N149 | N156 | N163 | N170 | N177 |
| 无hook的自定义prototype | N143 | N150 | N157 | N164 | N171 | N178 |
| prototype上的data-method hook | N144 | N151 | N158 | N165 | N172 | N179 |
| prototype上的getter-method hook | N145 | N152 | N159 | N166 | N173 | N180 |
| 已有索引0仅变为non-enumerable | N146 | N153 | N160 | N167 | N174 | N181 |
| 合法frozen数组 | N147 | N154 | N161 | N168 | N175 | N182 |
| 合法readonly、非frozen数组 | N148 | N155 | N162 | N169 | N176 | N183 |

精确定义：

- 前四行只改变目标数组prototype，own keys、全部索引value和descriptor不变。
- method hook：L1三个面及L2 argv选择`every`；L2 scope选择`Symbol.iterator`。
- getter hook分别记录getter和返回方法的调用，两个计数都必须为零。
- 隐藏index只改变`enumerable:true→false`，value严格同一，其他descriptor及prototype不变。
- frozen/readonly是资格正向场景，不是任意非法mutation；不得因不可写而拒绝。

映射与最终oracle：

- L1：`TEST-WVEB-002 / AC-WVEB-001,005`。负向精确`REJECTED/INPUT_INVALID`；正向精确匹配独立snapshot oracle。
- L2：`TEST-WVEB-003 / AC-WVEB-002,003,005`。负向精确拒绝、无receipt和child；正向在真实临时Git中完成一次child及完整24字段`COMPLETED/PASS/null` receipt。

本轮L2正向只做了准入探针；后续Test必须补足上述真实执行证据，不能把本轮mismatch-trap结果充当成功execution证据。

### C. 30个root叶：N184..N213

| 层／唯一目标字段 | `.`段 | `..`段 | 重复斜杠 | 尾斜杠 | 合法单独`/` |
|---|---:|---:|---:|---:|---:|
| L1 repository_root | N184 | N185 | N186 | N187 | N188 |
| L1 worktree_root | N189 | N190 | N191 | N192 | N193 |
| L1 common_git_dir | N194 | N195 | N196 | N197 | N198 |
| L2 repository_root | N199 | N200 | N201 | N202 | N203 |
| L2 worktree_root | N204 | N205 | N206 | N207 | N208 |
| L2 common_git_dir | N209 | N210 | N211 | N212 | N213 |

负向字符串构造须保持规范化后的目标不变，但**生产不能通过normalize接受它**。每叶只改变一个subject root字段。

- L1负向：精确`REJECTED/INPUT_INVALID`，不是后续identity mismatch。
- L2负向：精确`INPUT_INVALID`、无receipt、无child；另一个合法绝对root承载ordering trap。
- L1 `/`正向：使用匹配identity的空observation，比较独立空snapshot。
- L2 `/`正向：证明该词法形式通过admission，再由另一个root的ordering trap产生完整pre-snapshot mismatch receipt；**不宣称成功执行validation**。

映射：

- L1：`TEST-WVEB-002 / REQ-WVEB-001 / AC-WVEB-001,005`。
- L2：`TEST-WVEB-003 / REQ-WVEB-001 / AC-WVEB-003,004,005`。

### 数量恒等式

```text
279 retain
+ 28 scalar add
+ 42 array add
+ 30 root add
= 379

replace = 0
delete = 0
原ID重编号／合并 = 0
最终集合 = C001..C166 ∪ N001..N213
```

注册顺序：**当前279叶原顺序 → N114..N141 → N142..N183 → N184..N213**。

## 5. 构造、自检及证据边界

后续只允许在[唯一Test文件](../../../../../tools/harness/change-coordinator/worktree-validation-execution-boundary.test.mjs)追加这些独立叶及其局部构造／自检，不修改全局`entry`、`validL1`、`changedL1`或原279叶helper。

必须：

1. 先证明未变异control合法，再构造唯一mutation。
2. 使用descriptor和严格value identity核对差分；不读取getter复制对象。
3. expected在安装非法prototype/hook前从Test-owned正常值计算。
4. 不对已变异数组调用spread、`Array.from`、`map/every`或serializer来生成expected，以免Test自己先执行hook。
5. 公共调用前后检查所有callback计数；错误码正确不能抵消callback执行。
6. L2负向检查无receipt、sentinel不存在及临时worktree HEAD/index/status不变。
7. Ledger、State、STAGE、Candidate、publication等仍由现有权限／源码证据和禁止路径检查承担；不伪称公共返回值直接测量了内部syscall次数。
8. 保留C148/N085真实child证据；不新增watchdog接口或用AST替代动态证据。
9. 只清理后续Test自己创建的临时Git、child和sentinel，保留既有依赖/cache/日志。

本轮内存探针进一步确认：

- L1四种root词法错误已经正确拒绝，应允许相应新增叶直接PASS。
- L2同类错误目前进入mismatch receipt，是准入frontier缺陷。
- `/`在两层当前准入路径均被接受。
- L1 null-prototype及L2隐藏index已有正确拒绝，不强制归为RED。

因此**不预设新Test整体PASS/FAIL数**。

## 6. 下一Gate与连续性

建议下一轮仅授权上述六文件Spec clarification。顺序保持：

```text
Spec clarification
→ 完整七文件审查、ponytail-review、Spec Gate
→ 用户确认379叶adoption并单独授权Test补证
→ Controller独立RED／Readiness／Retirement
→ 用户绑定新Test身份重新发布TDD_READY
→ 明确释放现有两个production文件的bounded Worker revision
```

本轮前后50路径及逐文件身份完全一致，inventory仍为：

```text
67fdaf37c303cd704f9a607458e5560609cece2209f8cc2a39a4bb363a8d9125
```

branch、HEAD、空index、registry、依赖及334/333/331 retention均未漂移。

**不需要新Change或第三路径；但当前没有Spec/Test/Worker执行放行。379叶方案也不能复用旧TDD_READY或旧单文件Worker授权。**
