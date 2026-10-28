# 本轮接口收敛：验证与固定记录

来源HEAD：50c2f3e7bc167cd645b6abf6e4d1a92d1d0ec3d1；tree：b6964411275ff8ec2383be419eab1cebe959dac3。
活动源码从fb01-model-selection-local002的2431文件WIP继续；不是原样PR110。原M3.1/MiMo选择、账本模型枚举、正常参数测试及旧薄记录均保留；本轮与native-open-analysis.ts、service-main.ts的重叠逐段归属。证据根：
/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/skill-reference-refusal-convergence-001

## 同类接口核销

| 接口 | 原行为→当前处理／保留 | 反馈接点／消费者 | 可执行证据／限制 |
|---|---|---|---|
| loadHarnessResources／原生Skill目录 | SDK仍唯一加载/解析；只批准实际加载的general与group-summary两份文件；不隐式批准任何依赖文件或目录 | 新Adapter私有文件读取能力，真实路径/原文件hash/dev/ino固定；无依赖递归/新文件服务 | SRR-01 Workspace实际提示路径→read；资源替换/同字节新inode/符号链接/未批准依赖/撤权/取消及原生分页 |
| 业务资料原生read | 既有source/evidence/meaning/exploration等虚拟合同保留，Skill清单先识别后走同一工厂；资料不变成文件系统权限 | Native Adapter readMaterial及Application readSelectedMaterial | 同一Workspace读两份Skill及合成来源；原R3全量读/身份反例和repair001 WR回归 |
| 代码草稿read/write/edit | 原createAnalysisCodeDraft的read回调消费同一受控Skill能力；write/edit仍只写draft/analysis.py | 固定.5 createExecutionTools；原Python监督器/执行与核验不变 | SRR-01真实Workspace（codeDraft路径）、FL-A09/A10、原代码/越界/取消回归 |
| 报告文件read及无业务工具用途 | reportFile.read允许相同批准Skill；write/edit仅draft/report.json；审查/retained/普通形成仅新增只读Skill工具，不获业务材料、计算或保存权限 | 同一Session Runtime既有purpose及SDK read工厂；业务审查/模型/期限不变 | SRR-01六用途含report_file；LA07/23/32完整形成/审查/同版读回；合成响应不证明真实质量 |
| set_framework／set_joined_framework | 唯一当前身份允许goal/changes省略plan_ref；显式旧/未发/跨Context/hash不符仍拒绝，不静默换订单→退款 | 实际persistReferencedFramework，当前Task/source/meaning验证和原编译保存 | SRR-02/03 Workspace真实保存链；V13-REFERENCE-BIND、CURRENT-CHOICES及schema反例 |
| read_analysis_evidence.required_current_plan／required_variants | 当前计划内部绑定；同方法变体可省略唯一base_plan_ref；显式引用仍验证当前身份 | 原声明/IR/requiredCalculationEvidence；不计算、不变更当前框架 | SRR-02 variant；V13-PLAN-VARIANT／R1及旧当前方案纠正回归 |
| candidate_refs／set_analysis_steps | 候选/版本表达业务选择，plan_ref保留显式；已有step_id生成和唯一完整title依赖解析保留 | 当前候选Map、context/hash和现有步骤编译器；没有新注册中心 | V13-PREPARE-REF、STALE-CANDIDATE、FOCUSED/CURRENT-CHOICES；混用完整plan与ref仍硬拒绝 |
| execute_step／calculate_and_verify | step_id和非当前calculation_ref是明确选择；当前calculate{}内部绑定原样保留。缺失/不在本次声明的引用产生受信拒绝，依赖、来源、语义和执行资格继续校验 | 真实业务守卫；未调用保存/计算才可产生预效果反馈 | SRR-03 step；V13步骤/真实IR核验、未结算/UNKNOWN/授权负例 |
| 资产身份、其它方法构造器、complete_artifact、correct_exploration_code | 已知资产/草稿/唯一待纠正探索由现有能力绑定；来源、方法、候选和业务参数仍由Agent明确选择；不新增按文字猜测 | 既有Store、资产批准与原有工具模块，未新建第二状态权威 | 复用正常参数、LA与repair001；不重跑真实模型或旧业务Task |
| 同类引用拒绝 | 只有私有OpenAnalysisReferenceRejection由效果前守卫产生；safeTool统一形成具体code/reason、当前获准状态/引用、accepted:false及未保存/未计算事实 | Application→现有AnalysisTool结果→Adapter→固定.5→Pi；Adapter延后同批后续业务调用等下一模型回合 | SRR-03真实反馈显式纠正、重复停止、同批延后；没有按模型或工具名+异常文字加特例，无宿主换参重试 |
| 其他业务拒绝／真实效果故障 | 既有语义/范围等结构化业务回执保留。任意code/safe_details异常不被当作受信预效果事实；安全/取消/账本/审计/已执行交付失败/UNKNOWN仍停止 | 原安全与原生错误通道；终止时Application业务码与SDK保守效果状态分别保留 | SRR-04伪装异常、真实Store先保存后抛出、真实保存后投影失败；原R2/R3/R4、AC137及参数负例 |
| 当前Session构造／旧Task | 本轮新增Skill兼容开关及重复加载分支已删除，全部当前Session构造共享同一受控能力；旧配置Task只能拒绝，不能重新解释 | 既有不可变SDK配置及账本/Session恢复边界 | native-session和first-loop共11用途检查；旧版本真实生产实现创建的合成记录经新实现发送前CONFIGURATION_CHANGED，0新请求，配置/用量/预留/Session不变 |

精简保留依据：Case/Decision在profiles/personal/xanthil-desktop.ts及apps/desktop/browser-native.ts仍有实际消费者；它们使用同一Session实现，Skill读取不再另留旧分支。旧createPiOpenAnalysisRuntime的当前图谱/仓内引用仅测试及xiaomi-local转出；测试依赖不能证明长期保留必要。本轮三类接口已收敛，不宣称该旧引擎已退役或整个精简已经完成。取消报告收尾仅适配同一批准read声明，原无工具事件、物理关闭、无队列、授权和账本一致的拒绝条件保留。

## 命令、RED与验证口径

完整argv、非密环境、cwd、时间、退出码、完整日志和hash在commands/<name>/{command.json,result.json,output.log}。通过command.py固定既有Node26/npm11.12.1及工具链；preload拒绝外部fetch，只允许本轮离线loopback；Provider codec测试由合成fetch返回。临时数据根/本轮进程由测试拥有，finally关闭服务。没有真实Provider/Keychain/业务数据。

- reference-red004：效果前旧引用无法被原Pi循环消费、goal-only无法绑定当前框架的有效RED；更早引用夹具缺业务scope/逻辑轮次错误保留，不算产品RED。
- causal-red-final*：将同一最终Workspace测试及断言用于接收时保存的未修复生产源码，Skill原路径与引用两个入口均RED；固定测试hash/旧源码manifest随记录保留。早期Skill夹具把system字段、原生read结果载体弄错的失败保留，不冒称有效RED。
- feedback-batch-red001→feedback-batch-green001：同批后续业务调用不应在消费拒绝前执行，实际Workspace前后对照。
- skill-single-policy-red001→skill-single-policy-green001：同一新增普通Session五用途断言由缺少可用read而RED，统一受控资源后与首循环共11用途GREEN；开关前源码与测试保存在single-policy-before/。
- skill-cancel-reconciliation-red001→skill-cancel-reconciliation-green002：取消报告适配同一只读声明，19正反例PASS；green001中间FAIL保留。
- old-config-before001→old-config-after001：接收时旧生产实现创建合成Task，新实现CONFIGURATION_CHANGED，0发送；账本/配置/预留/Session身份完全不变，未接触历史业务Task。
- affected-single-policy001：195 PASS/0 FAIL/0 SKIP，覆盖本轮接口、原生首循环、引用/数字报告及正常参数。
- native-recovery-long004：433 PASS/0 FAIL/2 SKIP；终版受影响Workspace、原生Session/恢复/读、长成果、实际Browser HTTP及Python监督器。两项既有R2-BROWSER-DIAGNOSTIC-01（quota/unknown）浏览器DOM诊断SKIP保留，本轮不声称该可视检查通过。
- contracts-final003：333 PASS/0 FAIL/0 SKIP；可替换Adapter合同与相关核心负例，结果见同名完整日志；未删除原安全/业务断言，仅把旧零工具/目录预期改为仅批准read。
- typecheck-final003：终版实际TypeScript exit0，命令见同名result.json。
- 同一源码冻结后新独立native juaner_validator：作者不参与判定；冻结时待复核，最终报告位于证据根validator-native-001/，候选外FINAL-DELIVERY记录绑定，不修改冻结源码来补PASS。

保留所有中间FAIL、安装/夹具/类型失败和适用SKIP。未运行全产品portable/托管CI、真实Provider质量、真实F-B01、可视产品体验/QS04、Desktop/Supplier/发布/生产；有效历史八接缝/repair001/PR110证据只作为原限定机制复用，不提升未执行项。

## 配置、状态与停止

输出、600秒模型、300秒工具、120秒命令软超时、30秒control、累计unlimited持久计量、一次共享恢复及原修订/审查次数完全沿用normal-entry-parameters基线；本轮不新增产品限流或改128授权语义。新work无旧300秒累计截止；旧work/Task读法、累计消耗/未结算/UNKNOWN不迁移或清账。

受信拒绝返回表示工具完成处理拒绝，非业务保存/计算成功；SDK.completed和业务accepted:false并列。重复错误的终止抛出在固定.5中仍是UNKNOWN写效果，原因CANDIDATE_REFERENCE_INVALID由Application保留，未被清除或变成not_performed。该Task按既有栅栏停止，不重试；不能用新无状态探针核销旧历史效果。

旧20次真实请求、原M3的65536预留和未知用量/费用、M3.1/MiMo失败Task及旧Change007/119/试用修复-2继续停止。工程累计只替换同一主会话as-of并保留其它已结束会话条目，新Validator另列；不叠加旧总快照。固定包/原候选003/repair001/model-selection-local002均不覆盖。

新本地候选与精确增量归属、源文件清单/档案SHA及SDK57文件身份在证据根LOCAL-CANDIDATE-001.json、SOURCE-MANIFEST-001.json、INCREMENTAL-DIFF.patch、COMBINED-DIFF.patch。本文件是冻结时的作者证据记录；最终独立结论及候选readback在候选外收据。完成本轮离线工程/新候选/独立复核后停止；真实验收、Git交付、发布与生产另行授权。

## 当前执行记录与下一步

SDD输入为当前用户接续指令（证据根AUTHORIZED-INPUT.md逐字留存），行为与边界在同目录spec.md；本记录承担连续工程的任务/验证记录，不补建旧式proposal/tasks套件。SRR-01～04实现及受影响验证已完成；剩余动作是固定完整候选、独立只读复核、当前证据/消耗/权限回交。冻结后不再改候选补写独立PASS；如复核发现实质缺陷，保留本候选及FAIL并形成新候选。唯一主工程继续写状态，Validator只写其独立scratch/report。
