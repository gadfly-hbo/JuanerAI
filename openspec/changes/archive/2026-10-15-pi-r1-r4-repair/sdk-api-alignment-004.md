# API004 read安全失败载体当前采用记录

原API003与.2/002/003/mini-sdk-read-carrier001全部原件保留。当前只采用.3固定ToolOutcome.failureCategory可选封闭枚举，顶层Reason、Tool执行/交付/技术receipt及实际资源/模型usage独立。共享缺口现已有接口，不再标“待SDK合同”；新包工程验证不代替产品验收。

## 固定安装

SDK146131bytes/SHA e02175ff42eaa83b994e6f49a1e041b4b3f0b9c807b0b8c192a7dfd836f70cce；完整归档3641024bytes/SHA c16d254a1c20a742f92a058c8f537196e850ad0e707e9cb364f359cf66be4689；API0046670bytes/SHA ceb111cb1adc928667b6ba41242a34e0d04830260727865f50d230ba5d9a00da。273校验（272payload+manifest）exit0；84来源aggregate c22952fa75a825faee71e2d2b2fe2e7e438a0614fbc14f1fa2f4be1ea62f8eca及snapshot独立验证；SDK151非root lock与.2一致。来源HEAD b07057faaecd919109fff6adaca8f9365be95ccc仅基线。

同一工作树/分支，产品HEAD8265a3920ee1205faec7dede8b0c84e648105d9d仍WIP。vendor新路径vendor/pi-agent-runtime/0.5.1-r1r4.3/e02175ff42eaa83b994e6f49a1e041b4b3f0b9c807b0b8c192a7dfd836f70cce.tgz。npm install001重写六Pi nested元数据（版本未变），原失败/差异保留；只恢复本轮引入的六项后npmci002offline/ignore-scripts716packagesexit0。产品lock仅root与SDK变；764非SDKentry完全相等、实际51 SDK文件逐字节相等，无链接/SDK补丁。身份和完整SRI见product-installation-identity-002.json。

## 各层映射与责任

1. Application已有获准readSelectedMaterial经Pi Adapter现具名namespace/授权与撤权，仍只createExecutionTools(host,['read'])。没有新reader、Shell或查找引擎。
2. 实际.3 native Session生成受信ToolOutcome.failureCategory。原生factory直接aborted兼容，公开cancelled/timeout细分；既有reason保持TOOL_FAILED/BUDGET_EXHAUSTED。
3. persistent-runtime-state只在既有auditJSON允许新可选字段，继续调用实际SDK ToolOutputFailure闭合枚举验证及现有完整session/invocation匹配。非匹配/非法/保存失败不soft-success。没有新SQLschema/Task配置、没有历史回填。
4. native-open-analysis.readDiagnostics仅映射正式outcome，业务Port独立AnalysisFileFailureCategory及file_failure_category。合法封闭值保留，缺失/未来值unknown，原记录不改；不从reason/message/name/cause/code猜。迟到tool.finished可标after_stop，不覆盖原冻结UNKNOWN。
5. Workspace/HTTP现诊断route原样透传业务中立DTO，client现诊断区稳定中文枚举映射，未知/原型键回退unknown。完成/交付/原消耗/技术receipt仍分别可见；不因类别改变恢复按钮或授权。client声明补已有read方法，不新增JS执行接口。

## 当前证据

证据根 /Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/sdk-0.5.1-r1r4.3-001/。独立consumer-kit001原RUN-OFFLINE完整exit0，71公共边界/类型/旧.2同Task历史/Mini原样9组/精确类别/6guard/7adopted及18投影等实际执行；不冒称重跑SDK源码274+2。原mini-sdk-read-carrier001 public/product脚本分别original-public001/original-product001原样重跑exit0。

产品red002九组真实audit拒新字段；green002九项实际App/profile/native生产持久Session/Store/HTTP/client/现renderer通过。missing有2次宿主底层探针（read与存在性检查），仍model1/tool1同invocation，不是自动工具重放；其它底层probe1。直接factory探针与Session次数分列。

late-negative001九项 actual生产budget/audit+installedSession：取消/超时冻结UNKNOWN不变及独立晚到类别，显式CANCELLED附ETIMEDOUT优先；matched completed/receipt与known7/3保留；plain/invocation/name/effect/resource伪造不引入category/receipt，auditfault失败关闭。此级别是SDKSession→生产持久层，不冒称这九项每个都经过完整App/UI。App全链九组由独立上述测试证明。

历史bounds001误绑source SHA使Store拒SOURCE_CHANGED，保留为夹具错误；history-green002旧省略/未来值/__proto__三项读回unknown、无回填/零model。Browser003重复消费bootstrap、cookie004缺控制token导致入口弹窗，属于测试登录夹具失败；fresh-bootstrap005在同一真实Task全新测试入口Chrome通过缺失分类及刷新零调用；当前canonical启用三Chrome场景（missing/cancelled/host-timeout）。type001既有client声明缺read，补声明后type002exit0。CIpins-red001由实际新manifest对旧pin导致失败，pins-green002精确新pin17PASS；旧.2 tuple常量保留，新增唯一.3tuple及SRI，不松172根inventory或旧负向。

当前全量回归仍待结果读回，不据上述局部通过宣称完整R1～R4/独立Validator/产品验收。production overhead/margin/imageUNKNOWN、512/8192合成、961743bytes观察值、原Provider/生产/Git停止线不变。未保存唯一正文/旧恢复字段仍具体OPEN，不借本次引入通用存储/恢复。

当前canonical00117组exit0：4573PASS/1真实ProviderSKIP/0FAIL（4574总计），desktop1580约261秒，包括三实际Chrome类别/刷新与21新增断言；代码/测试/依赖drift=[]。type002与CIpin17项通过。当前窄read/API004候选可独立评审，完整R1～R4/未保存原件生命周期/用户产品验收仍未完成。

独立候选001窄FAIL：late-ui-counterexample002的真实SDK事件停止原因在toolOutcome.reason，顶层reason缺省；仅看顶层导致after_stop/UI标记遗漏。原70候选、21独立PASS、10自身反例PASS、类型及两个投影FAIL全部保留，详见independent-validator001/run001/validator-report.md。

Root先追加READ-CARRIER-004-LATE-UI规格及两个永久投影断言，late-projection-red0012FAIL指向缺after_stop（非环境失败）。只将工具观察标记改为受信event.reason??out.reason，保持顶层优先、封闭CANCELLED/DEADLINE_EXCEEDED、既有frozenUNKNOWN/消费/历史。九即时失败补不得误标late。green00221PASS含三Chrome及两迟到UI；affected-final001四受影响文件421PASS/0SKIP/0FAIL、type003exit0。新候选完整.3采用可复用之前4573全量范围，明确全量属于候选001；修正后421为当前受影响回归，不冒称重跑全量。待同一独立Validator对新固定候选复查。


## API004/.3 当前窄结果闭合（2026-10-15，候选002）

固定新包真实安装51文件与764其他lock身份核验；read九组App→持久Session→Store→HTTP/client/UI、迟到/负向/旧历史/三Chrome及刷新零调用通过。独立Validator候选001先FAIL（嵌套停止reason未透传after_stop），保留原件；新规格/两项因果RED→只修正式reason映射→21GREEN，当前421受影响回归/类型通过。候选00270文件aggregate265b21ad1e8a99511f73147039cc8257d8d718caeb63c55cffea1cd34be91bf2，独立复评PASS仅read/API004。

原canonical4573/1SKIP属于候选001，仅复用未变范围；不把它说成候选002全量。实际报告/完整命令/退出码/身份及每层映射在 /Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/sdk-0.5.1-r1r4.3-001/ADOPTION-AND-VALIDATION-004.md 和 independent-validator-001/run-002/。首次FAIL及所有历史/UNKNOWN不改写。

工程接受本窄read增量，不接受完整R1～R4或用户Product Acceptance，不归档未完成Change。完整任务仍有唯一未保存正文/旧恢复合同和生产参数UNKNOWN；精确返回点见matrix006及原r3-unsaved-lifecycle-impact001。已解决read载体不再列为待SDK；不统一暂停原授权，不自动Provider/生产/Git/迁移/重放。
