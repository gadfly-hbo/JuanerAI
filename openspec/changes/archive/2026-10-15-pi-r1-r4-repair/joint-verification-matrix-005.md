# 当前固定包产品联合验证矩阵（v15，2026-10-15读回）

任务/分支/工作树保持原身份：`pi-r1-r4-repair`、`work/mac-mini/pi-r1-r4-repair`、`/Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI`。HEAD `8265a3920ee1205faec7dede8b0c84e648105d9d` 只是基线；修复仍为WIP。证据根 `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/sdk-0.5.1-r1r4.2-001/`，以下locator均相对此根。所有样本合成，实际SDK安装/生产Adapter/存储可执行，transport/fetch离线；没有真实Provider或生产采用。

固定SDK `0.5.1-r1r4.2`，142876bytes/SHA256 `d2ba42634e98e356f1d82f5a4fe39fe451d8284e44a64e74c42102bf52922998`；51安装文件逐字节核验见product-installation-recheck-002.json。SDK内部253+2/50/6/7等结论不代替此表。

| 场景 | 产品实际证据 | 范围与仍待验证 |
|---|---|---|
| V01 小CSV/MD | r2-http-client-renderer-001新旧7×2、v01-md-joint-001；真实source→native read→IR→独立核验或source_attribution→Store→HTTP/client/renderer | MD只证明原文引用与位置，SOURCE_QUOTATION不证明业务口径；renderer/HTTP证据与真实Chrome诊断证据分别记录 |
| V02 两份2985行CSV | r2-http-client-renderer-001新旧故障/sum/mean14项及HTTP读回 | sum/mean真实差异、完整本地资料/Outcome；002早期J01请求捕获不替代这些结论 |
| V03 8/32MiB、100000cells | capacity-joint-001六项；实际inspector/guard/native read/IR/独立核验/Outcome重开 | 单8MiB100000cells count999、四源32MiB count3996；保留既有容量否决，非全量资料进入模型 |
| V04 64/2048sheet | capacity-joint-001两候选读取完整catalog至末表 | 32×64全部sheet保留；明确末表count1，不是全2048表全局计算；无自造分页引擎 |
| V05 10000列/32767cell/长行 | r1-wide-framework-green-003、wide-stop-regression-005及r1-read-boundaries-003 | 原生offset/limit+512Unicode窄行；完整本地原值/IR/Outcome；不开放bash取得长行 |
| V06 200k/1M候选 | capacity-joint-001、r1-read-boundaries-003、r4-purpose-boundaries-002；metric-approved-joint-001/002 | 长cell200k拒绝、1M读取；六指标200k已完成计算但下一guard拒绝，1M四物理完成net150/六指标/Outcome。各候选独立结论，512/8192为合成参数 |
| V07 native历史/压缩 | r2-native-recovery-002、r2-codec-context-003、r2-report-length-green-001及当前native相关canonical | 实际JSONL/摘要/保留tail、每次摘要和恢复请求guard/计量；未保存唯一大正文仍有返回边界，不宣称所有累计输出已关闭 |
| V08 codec错误/length | r2-codec-physical-001、r2-codec-context-003、r4-codec-001 | actual Pi SSE/fetch 400context、402、429、503、401/network/length；known0/partial/UNKNOWN分开，非凭自定义异常伪装codec |
| V09 purpose主备 | r4-purpose-boundaries-002六项、r4-codec-001 | analysis/proposal/report实际用途、同Task/统一extraAttempts、工具完成不重放；撤权/小window否决；retained原单候选保留 |
| V10 Tool成功后失败 | r3-effect-green-001、r2-http-client-renderer-001十四项、r2-diagnostics-green-001、r3-unsaved-boundary-004 | completed/unknown/交付失败/原消费保存；未保存大SOURCE解释工具完成后guard拒绝，无伪Outcome，无新保存机制 |
| V11 native/ledger/audit/业务保存故障 | r2-http-client-renderer-001十四项、R2持久原子callback回归、当前native故障canonical | proof/Outcome/save-ack-lost、ledger/audit失败及迟到另记；未知消费不退款/不自动replay。仅各注入返回点，不声称无限故障空间 |
| V12 Store→HTTP→UI | r2-http-client-renderer-001、r2-browser-diagnostics-green-002、v01-md-joint-001 | Chrome1440/1366两诊断场景、中文状态/读失败恢复否决、刷新零RPC；精确read FileError原因尚未通过Session到UI，见read载体复现 |
| V13 cancel/revoke/timeout/late/queue | 当前canonical008原native/共享持久/协作边界、r2-adapter-late-green-001、r4-purpose-boundaries-002 | 实际signal/授权/slot/late事实/UNKNOWN；不授权原生产失败Task重放 |
| V14 旧Task/skills/fork | consumer-kit-002旧Task脚本、r1-r2-compat-001及canonical008全部旧协议/native resource/fork/queue回归 | 旧配置不自动采用v1；旧SDK/历史账本/UNKNOWN不删除。HOST重构与Native restart区别；新v1状态回滚/迁移未授权 |
| V15 27业务工具输出 | dynamic-inventory-005；已保存semantics、exploration、MODEL意见/child Context、24目录、80映射IR、24图/recipes、64facts及现代analysis_tool桥接逐片RED/GREEN | **PARTIAL**。枚举27/20phase不是全部max分支PASS。未保存唯一语义/业务范围、proposalOnly binding/steps/candidates、finish_result及required.execution_plan历史恢复字段仍原样；不能删字段/加通用仓库。正式六指标已补实际1M正文+IR/Outcome，未扩大专业资产 |
| V16 事实/观点/因果/范围 | M1/M2 proof→Source→child、group fact及MODEL返回/条件/limits、v01-MD、metric-approved-joint-002、canonical008 | 原独立算术、source attribution、MODEL探索/意见与未完成目标保持等级；不把守恒/数字核验当因果/整报告或真实Provider质量PASS |
| V17 read/资源权限 | r1-read-boundaries-003、child Context及材料目录/结果current/stale/outside/revoked、固定包consumer-kit公共read边界、canonical008资源隔离 | native material仅现scope namespace，不读任意FS；SDK factory的symlink/hardlink边界与产品虚拟资料边界不同。grep/find/ls及subprocess搜索在R5延期，不以旧SDK公共层PASS冒充新产品搜索能力 |

## 当前质量与证据级别

canonical-portable-008.sh完整命令及log/exit可读：17组exit0、4553总计/4552PASS/1真实ProviderSKIP/0FAIL；desktop integration1559约256秒。typecheck-native-022补充原172manifest未覆盖的native/collaboration测试类型exit0。dynamic-inventory-005 exit0，legacy+r1r4八根phase×2、两childphase×2共20个实际阶段、27个真实名称；仅只读Application级，不产生计算/授权外发。

原19项跳过逐项原因及补验返回点仍由skipped-19-followup.md维护：18项本机资源补验，1真实Provider未运行；旧19跳过/失败原记录未覆盖。当前全量只剩同一真实Provider停止线。

没有完整固定候选/独立Validator/工程验收/用户Product Acceptance。production context overhead/margin/image参数仍UNKNOWN；961743bytes、65547bytes以及512/8192均不是生产token安全或批准。

## 依赖分类及精确接续

1. 当前合同内可推进：适用回归/类型/动态枚举、正式六指标资产正文及实例、read错误最小复现和矩阵，本次已推进并留原始输出。已保存业务原件的具名读取/投影已逐片实现；后续具体新增样本若不改变合同，可继续在原任务执行，不默认暂停R1～R4。
2. 当前剩余合同点：read factory安全类别进入Session/RunResult/audit到产品诊断的正式载体；以及未保存唯一业务内容/旧恢复字段的所有权和重开生命周期。前者有九组public-only和产品持久Session复现；后者保留当前失败关闭、原SOURCE/Native历史，不补假saved或通用输出仓库。Controller尚未接受任何新持久结构/恢复合同。
3. 固定新包：当前051已采用，无全局待新包。仅read载体确认若确实需要SDK改实现，须SDK新精确版本/不可变包/完整来源锁安装回执，再独立核验安装，仅补该接缝。

NEXT_ACTION：由SDK明确安全read失败载体（现有API可用则给精确接口/示例；需修复则新版本）；Controller对未保存正文/旧checkpoint/finish_result原件形成最小具体生命周期决定并核对既有权威，不猜SDK恢复格式。任何需要新增持久业务结构或兼容/权限上界的方案在依赖实现前按既有合同变更规则处理。当前包/历史/UNKNOWN保留，真实Provider/生产/Git停止线不变。
