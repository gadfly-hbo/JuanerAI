# `JUANERAI_PUBLIC_RELEASE_GATE` Development-Readiness Review 001

> Review ID: `D05-XD-PRG-REVIEW-001`
> Date: 2026-08-28
> Reviewer: fresh material-isolated read-only support Agent
> Write authority: none
> Verdict: `PASS`

## 1. What I Would Build

不在当前 D1-A 或后续开发期构建公开发布能力。后续各 Xanthil Change 仍须以已批准的行为、负例、因果 RED/GREEN、回归、macOS 打包验收、跨平台契约/路径/流程测试，以及适用的 Windows hosted CI 构建与自动 smoke 为完成证据；CI 只能称为 Windows CI 证据，不能称实机验收。`DA_REQUIRED_COMPLETE` 是五项能力完成后的内部开发验收，不是公开发布完成。见 `xanthil-desktop-public-release-gate-amendment.md` §2、`xanthil-desktop-required-capabilities.md` §1、§9。

只有用户明确授权准备 JuanerAI 正式公开发布时，才启动 `JUANERAI_PUBLIC_RELEASE_GATE`。届时对同一冻结 Release Candidate 完成：macOS 签名、公证及安装回放；Windows Authenticode 签名、受控真实 Windows 11 x64 安装回放；校验和/溯源读回；对应分发渠道的更新、卸载、数据保留、回滚、失败与恢复验证；随后由 Controller 审查并取得用户公开发布决定。任何改变二进制、身份、版本、合同、锁文件、运行时/Pack 或平台补丁的变更都会产生新 RC，并使另一端既有 RC 验收失效。见 `xanthil-desktop-public-release-gate-amendment.md` §3–4。

Model Pack 仍不因本修订自动开始：仅在 `DA_REQUIRED_COMPLETE` 后，且获得单独明确用户授权时才可启动。见 `xanthil-desktop-public-release-gate-amendment.md` §2、`xanthil-desktop-required-capabilities.md` §9。

## 2. Required Guessing

无承重猜测。

开发期证据、D1-A 阻塞项、`DA_REQUIRED_COMPLETE` 的含义、Model Pack 前置条件、Public Release Gate 的显式触发条件、同一 RC 约束和公开分发/发布就绪声明禁令均已明确。D0.5 §12 中旧有 “real macOS and Windows 11 host evidence” 表述，由修订案明确的 supersede 条款及 D0.5 §10 的后续矩阵所限定，不构成当前执行冲突。见 `xanthil-desktop-public-release-gate-amendment.md` §1、§5；`xanthil-desktop-d05-productization-decision-package.md` §10。

## 3. External Study Required

无。材料已自行给出产品语义、Gate 触发、开发期与公开发布期的证据分层及失败关闭边界；不需要外部仓库、历史 review 或真实 Windows/签名资源来补足计划。

## 4. Untestable Requirements

无不可测试的承重要求。

开发期验收可通过 macOS 打包回放、Windows hosted CI build/smoke 和确定性跨平台套件证明；真实 Windows、签名、公证、同 RC 溯源、安装/回滚等则是被明确延后、且在用户启动 Public Release Gate 后可执行验证的验收项。见 `xanthil-desktop-public-release-gate-amendment.md` §2–3。

## 5. Correctly Deferred

- 真实 Windows 11 x64 受控主机/VM、macOS Developer ID 与公证凭据、Windows 签名凭据：均为 Public Release Gate 资源，非 D1-A 或开发派发阻塞项。
- 公开分发渠道、证书具体身份、签名/公证命令、安装器和更新机制的可执行合同：应在未来明确启动 Public Release Gate 时冻结。
- Release Candidate 的具体序列化、工件命名、校验和格式与实施路径：可在该 Gate 的后续 OpenSpec/设计中冻结，不影响现有开发边界。
- Model Pack 的产品 Change、合同、Provider/Consumer 和激活：正确保留到 `DA_REQUIRED_COMPLETE` 后的单独用户授权。

## 6. Required Plan Additions

无。

## 7. Verdict: PASS
