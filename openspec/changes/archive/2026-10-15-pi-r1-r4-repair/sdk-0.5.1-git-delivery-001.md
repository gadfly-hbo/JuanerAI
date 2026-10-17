> 当前：PR84技术采用已合并，Mini已同步；MacBook超时，最终main UNKNOWN，整体PARTIAL。详见文末实际回读及最终原生回执。以下执行计划与先前停止线按历史时点阅读。

# 正式 SDK 0.5.1 受控采用 Git 交付001

2026-10-15用户直接授权仅本任务提交推送、PR、适用审查／必需CI，通过后squash合并与安全同步main；沿用 work/mac-mini/pi-r1-r4-repair 与当前工作树/WIP，不重启功能开发。

## 受交付身份与复审适用性

技术冻结：HEAD cadeca0e75e5cbeac3fbc65fc58cce947283fa08＋受审2931文件WIP aggregate e5e2b3ae7622810ea7b4c7f0c1470d9b9a33577719d2eca3f8dac223129890dc。正式包148236bytes/SHA256 3af3f895a2466b7947b9b9b0025231f856e3a5c4773782c9dabd460e924bfad9，实际安装53文件。新独立Sol/high/read-only CLI限定正式PASS与Engineering Acceptance见 [工程接收003](engineering-acceptance.md#正式-sdk-051-工程接收003--2026-10-15当前)。本轮技术字节未变，仅接收和交付记录增量；复用匹配作者700／旧独立120／新独立55，不发起第二次CLI例外或扩展旧具名豁免。

本轮fetch时origin/main=07f6ec36bd1efc275e89322384adef94440cdd03，其tree与当前分支原HEAD完全相同。现分支保留原提交，不重建／reset／rebase；提交当前WIP后按项目规则merge origin/main历史，再以当前完整PR diff核验。正式采用相对main仅固定包／根锁与固定输入oracle所需更新，以及已批准的收口记录，无新产品逻辑。

## Git验收与证据

显式暂存核对后的任务路径，不含node_modules、缓存、凭据、业务数据或其他项目。先核验完整diff／固定包与安装、匹配独立证据、记录层8项变化及2项新记录；当前固定CI安装工具检查与类型按实际命令读回。PR托管完整canonical工作流适用，不将本地受影响检查称为完整CI；只在精确最终PR head检查成功后squash，保留全部失败与UNKNOWN。传统branch protection接口返回404；随后核验main-protection ruleset 21155736为active、无bypass，要求PR／线性历史／禁止删除和强推，审批数量为0。仍须通过项目既有Canonical validation工作流；最终再读原生PR／检查／合并身份。

Git提交、PR、最终head CI、squash与逐目标main同步在实际发生后，以原生GitHub及本机持久回执为准，不在本文预填成功。最终机器可读回执固定为：

`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/sdk-0.5.1-adoption-001/git-delivery-001/FINAL-PUBLICATION-READBACK-001.json`

命令／stdout／stderr／退出码、实际包与WIP身份／完整diff及未能安全同步的目标均在同目录。已发材料保留原件。Git发布不改变原工程接收范围，不代签新的用户Product Acceptance、生产激活或运行中服务采用。

## 停止线与历史

原生Validator BLOCKED F-ROLE-01及旧FAIL／UNKNOWN原件保留；新的只读CLI限定PASS单独记录，旧豁免不延伸。生产overhead／margin／image仍UNKNOWN；512/8192合成值及961743bytes观察值不放行。Provider、凭据／业务数据、生产／服务／其他项目停止；不触碰原PID8407，不自动迁移／恢复／重放历史Task，不清账／退款UNKNOWN。仅按既有sync-main保护规则同步main；活跃工作树不切换／覆盖，不能安全同步的目标跳过并据实报告。


## 正式SDK0.5.1实际Git交付回读 · 2026-10-15

本任务 [PR #84](https://github.com/gadfly-hbo/JuanerAI/pull/84) 已于2026-10-15T08:50:06Z squash合并，技术采用提交 `1375d5992f57efdffc71ba329bc971444bfc93af`，tree `0ca9dbfcb2c727f51ff57834e15087cedd19454d`，与受交付文件树一致。精确PR head `668b7834bab853425d4978d9cca8c5c2f2d50c16` 的 [Canonical validation](https://github.com/gadfly-hbo/JuanerAI/actions/runs/38706548191) SUCCESS，portable15组 **4590 PASS／0 FAIL／21 SKIP**，exit0；完整stdout／stderr及原生job日志保存在本目录指定证据根。`gh run view --log`展示缺少尾部统计，另下载原生job日志核实，不从缺失片段补造总数。

21项SKIP按原名完整列入 `CI-PORTABLE-SUMMARY-001.json`：1真实Pi／Provider入口未授权；3浏览器检查未配置验收可执行入口；13宿主／生成代码检查缺少显式host opt-in；4本机PDF／旧Office／OCR能力未配置相应可执行入口。本轮不将SKIP称PASS，不改变工作流／断言以减少SKIP；匹配的旧原件与本任务本机适用证据分别保留，不把SDK或托管PASS等同真实Provider／生产验收。

Mini `main`／`origin/main`已安全ref-only快进到 `1375d5992f57efdffc71ba329bc971444bfc93af`，活动分支／文件未切换。MacBook配置目标 `macbook:/Users/huangbo/JuanerAI` 在实际同步时连接100.79.77.14超时；**最终main UNKNOWN，整体同步为PARTIAL**。此前预检07f6ec36只是历史，不推断最终仍旧或已更新。`safe-main-sync-001` exit1、stdout／stderr原样保留；不重试刷写／强制切换／覆盖活跃工作树。准确返回点：目标重新可达后，核验该仓库与活跃／main占用状态，再按现有sync-main规则安全快进；已有本任务授权不被重问，无可核验安全更新时继续跳过。

本段及项目板／能力图仅保存已发生的采用交付事实与受允许的peer跳过结果，不新增产品功能、Git豁免、Provider／生产／服务权限；原始BLOCKED／FAIL／UNKNOWN不改写，旧F-ROLE-01豁免不扩展。后续纯记录保存的PR／CI／最终main身份继续进入同目录 `FINAL-PUBLICATION-READBACK-001.json`，其版本不改变本段技术采用来源。
