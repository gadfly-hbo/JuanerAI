当前增量：SDK中间001已核验，R1实际签名及接线设计见[sdk-api-alignment-001.md](sdk-api-alignment-001.md)。下文草案及停点保留历史，不代表本次重新整体暂停。

当前状态（2026-10-14续）：报告已核验，消费者最小合同已输出到 mini-consumer-002；下文“待报告”为早期草案历史，现由 consumer/SDK-CONSUMER-CONTRACT.md 与 spec.md 补齐。SDK 接口回执及固定新包未到，未宣称共同冻结。

# SDK 最小需求草案与消费者核对

状态：待完整报告及 SDK 接口回执；不是双方已冻结合同。R 编号来自用户请求，报告 finding/V 编号未知，禁止猜配。

## 已核对的生产源码接点

基线 `8265a3920ee1205faec7dede8b0c84e648105d9d`：

- `apps/browser/service-main.ts` 的正常服务 composition 调用 `createPiSessionOpenAnalysisRuntime`；`profiles/personal/open-analysis.ts` 创建 `createOpenAnalysisWorkspace`。Application 的工具经 `adapters/agent-pi/open-analysis.ts` 派发，由 `adapters/agent-pi/native-open-analysis.ts` 创建共享 `createSessionRuntime`。这是静态调用链核对，不是安装包运行证据。
- `packages/application/open-analysis.ts:36` 的 `projectSelectedSourceForModel` 仍以 768 KiB 预览预算裁剪字段/行；返回完整计数，局部预览本身不能证明上下文安全或缺失资料可继续取得。
- 同文件 376/379 行的探索纠错回执仍外发 `execution_input`，其中包含 inspection；本地 pending input 必须保留，但外发投影须改变。
- 原生 Adapter 的 transport 先按当前工具改写 description/schema 再调用 `createPiTransport`；准入必须覆盖该最终投影，不能仅靠更早的 SDK 声明。
- 原生 Adapter 的 catch 当前把失败 input/output usage 写为 unknown；需承接 SDK 可用已知 usage，不能推断故障原因。
- `sdk()` 给 analysis/proposal_prepare/report_edit/retained_case 分别传单个 model，无 fallbacks；原生 retry 关闭、compaction 开启。共享标准的一次额外尝试不能与未来恢复叠加。

## 待 SDK 对齐的最小中立合同

| R | SDK 责任与所需语义 | JuanerAI 消费者与边界 | 必须独立证明的失败情形 |
|---|---|---|---|
| R1 | 原生 read 工厂经既有执行环境提供获准文件的有界读取；最终 Provider 投影后的每次请求准入，包括 system、工具 description/schema、history/current turn/retained tail、图片/协议开销与输出预留；压缩后再次检查 | 产品保有 source catalog、引用到授权材料的映射、撤权和全量本地计算；Adapter 提供最终投影接缝。具体 hook/字段名由 SDK 固定交付说明确定 | 200k/1M、主备窗口差异、当前轮巨型 tool、长单行、超长字段；不得删历史、扩大窗口谎报或盲切 |
| R2 | stop/error/known usage 保真；Agent overflow/recoverable-length 与 Worker 拒截断分开；同一逻辑请求主备/失败 retry/原生恢复共用一次额外尝试，摘要等每次物理调用都计同 Task | Adapter 落安全诊断及 operation/request 关联；产品账本/Store/HTTP/client/UI区分额度、网络、上下文、截断、保存失败、UNKNOWN、物理未结 | faux HTTP/SSE 真 pi-ai 编解码；错误同时带已知 usage；取消/迟到/未结；工具已成功后模型失败。缺原因保持 UNKNOWN，不能反推 HTTP 拒绝 |
| R3 | 只提供必要共享输出/引用接缝，说明工具执行后输出超限怎样保留已发生效果及回执 | 产品逐工具定义 bytes/token 预算、小结果、适用的授权可读引用；完整计算/证据本地保留，纠错只保留一次明确门 | 输出超限不能伪装为未执行或自动重放；history 重复投影不能靠删除原生历史关闭 |
| R4 | 复用候选链，每候选重新准入/授权/能力检查，保留实际模型身份；可分类故障在同一恢复上限内接续 | 仅装配已批准用途/接收方/模型配置。具体候选能力与既有授权需逐一核对，变量名 backup 不构成授权 | 主额度/服务故障、较小备用窗口、协议/thinking/图像不兼容、未知效果、相同不可安全上下文 |

新包交付必须包含新精确版本的不可变 tgz、SHA256、合同/依赖/内容清单、SDK 检查和采用说明、兼容/回滚/旧任务限制。无需 GitHub 正式 Release，但材料必须本机可读。Mini 核对自身安装树/实际解析路径/字节后，走 Application→Adapter→安装包离线合成联合验证。SDK 内部 PASS、mock PASS、版本号变化均不构成消费者接通。

## 当前工具清单

`createNativeBusinessTools` 当前注册 27 项；动态阶段投影、内部兼容 dispatcher 和其他用途仍需继续枚举，以下不是 R3 审计完成声明：

`ask_user`, `assess_meaning`, `bind_measurement`, `calculate_and_verify`, `correct_exploration_code`, `delegate_analysis`, `describe_business`, `describe_meaning`, `execute_step`, `explore_with_python`, `finish_result`, `inspect_selected`, `interpret_meaning`, `read_analysis_evidence`, `read_authorized_context`, `read_delegation_materials`, `read_delegation_results`, `read_project_metric_asset`, `read_tool_contract`, `rewrite_saved_report`, `set_analysis_steps`, `set_document_framework`, `set_framework`, `set_joined_framework`, `set_membership_framework`, `set_metric_asset_framework`, `set_multisource_framework`。

预算数值、引用形式及 SDK 签名未闭合；不在此凭空定业务阈值。原生 read 的 50 KiB/2000 行来自用户输入，后续须对固定安装包实际消费验证，不能仅凭导出声明认定接通。

## 独立产品切片影响决定

仅改变Application模型侧纠错反馈，两个路径不再返回execution_input，改为execution_input_ref {sha256,location:SOURCES[0]}。这是现有内部工具输出的非持久回包；没有改业务Port、公开版本合同或储存schema。原本地pending input保留，实际执行仍经原source复核/IR编译，完整资料不缩水。原始目标/绑定和安全诊断保留；摘要不是新可读模型引用，不声称原生read已接通。

测试资产处理：保留R1-CODE03的真实筛列断言，移至执行Port实际收到的资料经现有compiler物化处；增加回包无inspection与摘要匹配断言。新增同文件2985行用例，保留不换目标、至多一次纠错、第三次不执行、无假Outcome断言。未删除测试文件或负面场景。

R1目录/原生read引用、R3其余大输出若先独立定具体引用格式，会与SDK即将交付的read/guard/执行后超限接口重复或冲突；当前以最小合同锁定责任和语义，待真实API回执后接实现。R4真实装配按批准依赖顺序须等R1/R2防护，不能先接盲切。R2持久/UI诊断字段须承接SDK真实错误/usage/物理状态，不推测新字段。

## 2026-10-14 用户纠正后的独立推进与责任

SDK实际API缺口只挂起依赖它的部分。新的逐项依赖与27工具审计见remaining-work-and-tool-output-audit.md，19跳过见skipped-19-followup.md。002已由用户转交，旧包/旧失败/UNKNOWN保留。

本轮只增加三个业务私有model反馈投影：modelVerification省去本地物理证明全文，modelSemantics只省去资料source引用中与quote完全相同的question副本（用户message字段保留），rewrite请求回包省去已在独立报告流程再次读取的完整facts。它们不构成通用输出管理器或新的SDK公共合同；Core/Store/Outcome的完整原字段不改。原模型回包的唯一业务计算、解释、来源和效果不裁剪。哈希只作为出处，不充当可读证据。

证明模型侧小结果不够判断全上下文安全；唯一大集合和相关恢复/历史消费需要实际共享read与执行后超限语义。sourceEvidence对整格引用的2000字符约束还需单独工程影响判断，不由SDK单行读取成功自动关闭。根据实际回执先确认引用/存储/兼容接缝，再依旧API级别与新固定包进入TDD，不让“SDK到包”直接变成全V矩阵PASS。

测试资产新增留在既有app/native integration文件，未删除原测试/原负面覆盖。native故障用例复用实际Workspace、Pi Adapter、安装0.4.3、源CSV解析、真实IR/核验/SQLite/HTTP，唯一模型响应为合成transport，未模拟任何新SDK API。状态readback通过HTTP，不宣称完整新诊断UI已完成。
