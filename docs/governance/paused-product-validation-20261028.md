# 暂停快照交付检查

本记录只支撑用户授权的未完成产品保存，不构成工程或产品验收。
范围见根目录 `PAUSED.md`；产品源码不因本次交付而继续修复。

## 来源一致性

源候选 `Mini-report-evidence-recheck-local001 / attempt3` 的 2322 文件在复制前
逐项 SHA256 一致。发布树从 main `72570c730067895f01704d620d839e98573de9ed`
建立，对源 HEAD 的完整源码 WIP 使用三方应用并复制新增源码，零冲突。
产品源码与源候选一致；差异为 main 已有规划／治理增量，以及本次暂停说明、
README 和当前看板。旧未发布看板事件、运行数据库、日志与凭据不加入本次提交。

## 本次检查

|检查|结果|限制|
|---|---|---|
|`tools/harness/validation/run --portable`|FAIL，exit 1|首个 validation-contracts 组：581 PASS、3 FAIL（含父测试）、2 SKIP；后续组未由该次命令执行|
|`node node_modules/typescript/bin/tsc --noEmit`|PASS，exit 0|使用候选精确 SDK 安装树|
|`node --test tests/contract/xanthil-desktop/new-architecture-build.contract.test.ts`|PASS，1 项|首次因命令缺少临时根环境变量失败；补齐既有测试环境后通过，源码未改|
|`node --test tools/harness/project-board/project-control.test.mjs tools/harness/project-board/status-cli.test.mjs`|PASS，12 项|只证明看板合同|
|`python3 tools/harness/validation/check-agent-config.py --check`|PASS|采用既有批准工具链 Python；系统 Python 缺 tomllib 的初次调用不计 PASS|
|改动文本的常见密钥格式扫描|未命中|不宣称穷尽所有秘密；未读取凭据库|
|`git diff --check`|有既存空白告警|保留固定候选字节；未借暂停交付做代码整理|
|GitHub CI run `40639483269`，head `d581c20`|FAIL，exit 1|desktop-unit 为 163 PASS／14 FAIL；后续组未执行。失败夹具使用未设置的 `JUANERAI_NEWARCH_SHORT_ROOT`，`path.join` 收到 undefined|

首次完整离线失败的最窄接点：`tools/harness/validation/run.test.mjs` 中
`CI-HARNESS-001` 的两个原生执行准入探针使用了默认 `/tmp` 根；本机该路径是
`/private/tmp` 的符号链接，固定 SDK 的祖先路径校验返回 `AUTHORITY_REQUIRED`，
早于探针期望的 `CAPABILITY_UNAVAILABLE`。独立合成对照已确认真实目录正常、
符号链接目录拒绝；不是缺少 authorize 输入。此前“缺少授权输入”的归因已撤回。
采用既有真实短根环境后，独立专项为 3 PASS。原失败日志仍保留，完整命令另行
检查。不删除／跳过测试，不更改产品、CI 或 SDK 来获得绿色结果。

本轮使用 Node 26.0.0、npm 11.12.1 及既有本地依赖，仅合成离线检查；没有
Provider 调用或真实业务 Task。完整本地复查、最终提交的托管 CI 及独立保存范围
复核结果以本次 PR 为准。已知 CI 失败意味着常规交付条件未满足，需用户针对
暂停保存明确处置，不冒充 PASS，也不借归档继续修复产品或 CI。

独立复核的目标是确认暂停快照内容、来源、固定依赖、已知失败和权限描述准确，
不是要求把未完成产品评为通过。源码及历史失败的删除保留决定以本次用户指令为准。
