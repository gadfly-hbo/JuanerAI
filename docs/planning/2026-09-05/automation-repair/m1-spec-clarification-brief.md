# M1 / B0：WVEB 六文件 Spec clarification 派发 brief

## 目的与释放条件

主计划： [MASTER_PLAN.md](MASTER_PLAN.md)，当前返回点：M1 的六文件 Spec clarification。

2026-09-05 当前用户明确批准“本次使用临时 sol/high Spec 实例完成这六文件澄清”。M0 已通过独立计划审查；当前派发采用该次新批准，不复用历史 substitute 批准。R2 触发是 caller-owned 输入准入、进程执行、跨模块合同边界；原 juaner_spec 固定 sol/medium，故本次使用下述临时替代，任务、路径、角色权限与主计划不改变。

本次已批准临时替代限六文件 Spec clarification 一个角色任务：default support agent，model gpt-5.6-sol，reasoning high，fork_turns none，明确 Spec-only 职责，继承受限工作区，无 Test/生产/项目板/Git/外部动作授权。完成后停止；其他角色不由此获得替代授权。若原 R2 角色恢复，回到配置角色；本次不改配置、模型治理或全局文件。

实际派发记录：2026-09-05，`/root/wveb_spec_admission_379`，default / gpt-5.6-sol / high / fork_turns none；工具接受该路由并返回实例，实例状态 readback 为 running。S01 原验收点“六文件 Spec 派发”已通过，返回 M1；这不是 B0 关闭或 Spec Gate PASS。

## 冻结输入

- [主计划](MASTER_PLAN.md)、[动作卡](NEXT_ACTION.md)、[字段审计](attachments/wveb-field-audit.md)、[379 完整候选](attachments/wveb-379-candidate.md)。两附件是事实和候选，不重放其历史批准语句。
- 当前完整七文件 WVEB package：openspec/changes/change-coordinator-worktree-validation-execution-boundary/。
- AGENTS.md、CONTEXT.md、docs/governance/agent-model-routing.md、docs/governance/change-complexity-control.md、docs/governance/product-change-execution-policy.md，以及 package 明确依赖的 architecture/security 规范。
- 必要源码只读：snapshot module、production.mjs、唯一 WVEB Test。复用现有审计和 379，不泛化重扫其他输入或下游 L3。
- 基线 HEAD：33f04a35d13abe64f4394d54eec166b58cb44716；branch work/macbook/change-coordinator-worktree-validation-execution-boundary；index 空。
- Test SHA256：19941a032cbe4645055401123aa316df4fbdc13d1cfab9ec536becbaefea442a。
- snapshot SHA256：43e72532f3e68069fdc6be8198dcc706c9961ba33457d5c1fde61cd53a4563b0。
- production SHA256：757591c734ac997d65d941893910e413fc6c64535753170ffd45c12abd1033fc。

## 唯一写范围

在现有 Change 目录内仅：design.md、specs/dual-device-transition-foundation/spec.md、test-plan.md、tasks.md、traceability.md、verification.md。

proposal.md 保持字节不变；REQ-WVEB-001 与 AC-WVEB-001..006 保留。Test/两个生产文件、所有其他现存路径和任何新路径只读。不得写 project-control，Controller 单独记录 Gate。你不独占工作树，不回退用户/其他角色改动；若输入身份改变，返回阻塞。

## 必须编码的最小 delta

1. 六个 caller-owned 数组统一当前 realm Array.prototype、dense own enumerable data indices、内置 length；允许 frozen/readonly；资格检查早于输入方法、迭代、消费或序列化。
2. cwd/head_sha 必须 primitive string，在 path API/regex 前检查；cwd 不增加 root lexical-normal 规则或新长度限制。
3. repository_root/worktree_root/common_git_dir 非 lexical-normal 字符串为 INPUT_INVALID；合法词法之后的真实身份错误为 SUBJECT_MISMATCH；单独 / 合法。
4. 精确 adoption：279 retain，28 scalar + 42 array + 30 root add；最终 C001..C166 和 N001..N213，共 379；原顺序与正文/helper 保留，新 N114..N213 按附件追加，零 replace/delete。已有正确案例可直接 PASS，不预测总 RED 数。
5. 各 mutation 必须证明 control 合法、唯一字段变化、expected 由正常 Test-owned 值先生成、回调零调用；L2 frozen/readonly 正向必须真实 child + 24 字段 receipt；root / 正向只证明 admission 后 mismatch，不冒充 validation 成功。
6. 后续 Worker 仍只两个既有生产文件的私有 guards；不动共享 closed、其他 gateways、timeout、receipt、hash、环境或 L3。
7. 同步六文件当前 read model：明确已有 Worker Revision 002 局部 GREEN 和本次输入缺陷并存；历史 Correction 007/旧 FAIL/PASS 标注历史；不能保留其为当前 release result，也不能抹去原记录。
8. verification 只返回 SPEC_READY / PENDING_CONTROLLER_SPEC_GATE，不代替 Controller Spec Gate、Test adoption、Readiness、TDD_READY、Validator、Acceptance、集成或 successor 释放。

## 返回与后续 Gate

返回六文件实际 diff、逐文件 SHA/字节/行数、相对输入的改变、七文件一致性检查和全部 remaining decisions；证明 proposal/Test/生产/forbidden paths 保持不变。

Controller 随后对完整七文件及本次 delta 做 correctness review 和 ponytail-review，再决定 Spec Gate；它们通过后仍要按当前主计划和具体权限释放 Test、重新绑定 TDD_READY、Worker、新 Validator。第二次同类问题回 root-cause，不扩大本任务。
