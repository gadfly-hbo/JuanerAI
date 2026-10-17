# D1～D8 A 已批准：准备快照工程设计001

2026-10-15用户整体批准A。逐项D1～D8均Confirmed/一致；原草案、review001与失败保留，非重新启动。新固定SDK仍.3、不改SDK或依赖。实施以具名Task正文为限，旧required_calculations.execution_plan和finish_result.result保持。

必要工程参数（宿主物理保存边界，不是模型token预算）：单快照≤16MiB（沿用现checkpoint保存量级）；当前Task及其历史准备快照合计≤64MiB、≤1000项（沿用现业务历史项数规模并显式封顶总字节）；每快照候选≤64（现candidateReferences上界），同一内容幂等不新增项。每次原子写入前核对，越限PREPARATION_LIMIT失败关闭，保留原件，不自动删除、压缩或重试。这些参数不代表生产overhead/margin/image已知或token安全。

载体：OpenStoredTask 1.4＋可选preparation_snapshots，复用tasks表JSON；新任务由产品Runtime的显式preparationSnapshots:v1能力标签选择创建，旧1.0～1.3不回填、不改config。标签只在新的固定产品material/model-output策略身份下暴露，不是新SDK Task/观察字段。Strict旧新读取和所有现有状态转移必须保持1.4，修订将原快照留在原history、新revision数组空；总量计入history，不能修订逃避。

Store.savePreparation仅接收当前执行lease或当前preparing Preview的具名owner和四组类型封闭正文，生成UUID/time/前驱及hash。字段校验复用真实semantic/business/frame/IR编译器与用户消息来源；保存不改变Task/Preview/采纳/计算状态。仅当前owner的最后确认快照参与模型投影；旧快照保留历史，不回退latest。Store只读重开不派模型；UNKNOWN和显式恢复规则不变。

Application在safeTool执行真实生产者后先保存完整当前semantics/business/Framework候选/actual候选IR目录，再按已确认快照给大反馈小视图；required IR与finish_result原字段不缩减。读取固定四种preparation对象，逐次source/identity/owner/snapshot hash授权，512码点窄JSON派生文本，复用SDK原生offset/limit；不增加通用存储/读取/恢复。

SDD/TDD顺序：PREP-S01真实Store保存/读回/身份/幂等/老载体→PREP-A01实际生产者前框架与proposalOnly→PREP-J01 App/Adapter/固定SDK native Session/Store/HTTP/client/现UI及零效果读回→失效/保存故障/迟到/兼容→当前回归及全候选独立Validator。首片只证明Store，不冒充SDK集成。新私有保存字段及新材料能力仅在具名opt-in新任务启用，未授予旧Task迁移/恢复或真实Provider/生产/Git。

PREP-J03实际固定Session发现合法candidate句柄带旧context_sha256进入新步骤Context.proposal；严格Store拒绝CONTEXT_CHANGED。重新绑定节点时只移除候选提案的旧Context封印，仍先验证句柄/摘要/当前Context并通过原编译器生成新Context；保存的原IR/旧checkpoint字段不动。003有效输入RED先于修正，001错用current_plan_ref的脚本失败另保留。

PREP-S07: requirement source/start revision archives retain the original Task1.4 Preview ownership metadata alongside its preparation; otherwise strict history reopening rejects the saved owner. New revision has an empty preparation array, no old-scope inheritance. Existing revise behavior and strict source checks remain. Valid source-add RED002 precedes implementation.
