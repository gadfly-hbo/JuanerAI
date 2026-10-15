# SDK 中间合同接收与 R1 接线设计

2026-10-14，沿用原任务、分支、工作树和 WIP。产品 HEAD `8265a3920ee1205faec7dede8b0c84e648105d9d`，SDK 来源 HEAD `b07057faaecd919109fff6adaca8f9365be95ccc` 是基线，接口修复属于未提交 WIP。中间文件身份不等同 HEAD 对应已发布包。

## 输入核验

完整接续 Prompt、合同、README、两份收据、来源 manifest 与审查/验证记录已读取。Mini 目录：`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-handoff/2026-10-14/api-contract-001-1ca9605882cc/`。合同 18058 bytes，SHA256 `1ca9605882cc2a79180dd4b76d072d19c500e76f66b523633be79cedf1961995`。

实际12文件；SHA256SUMS列10项，10项均通过，DOCUMENT-HANDOFF-MANIFEST逐项bytes/SHA亦一致。其余两个为SHA256SUMS/复制manifest自身，记录本机bytes/SHA，不称外部自校验。shasum的1行格式警告来自末尾空行；接收文件保持不变。54文件来源清单aggregate按原收据算法独立重算为 `fe0b6dfc9169ff3eed7ac9cb21f0ea98c0b1777c9b1a237418d12c506b783256`。本次没有源码快照，不能声称逐源码对照或独立重跑SDK测试。

原SDK收据确认实际取得mini-consumer-002归档/69文件/5生产快照。其guard10、core227、UI2、typecheck/build、零跳过为SDK工程执行证据；独立审查是只读源码/文档/日志检查，没有重跑。不是Mini新包联验或产品验收。Mini读取和核验结果见原证据根 `r3-output-002/sdk-api-intake-001.json`。

## 接口对齐结论

| 项目 | 对齐结果 | 当前采用边界 |
|---|---|---|
| R1最终准入 | `admitModelRequest(ModelRequest, ContextAdmissionPolicy)`、`ContextAdmissionFailure`、`RuntimeOptions.contextAdmission`已明确 | 只据此设计与准备真实安装消费者；旧0.4.3没有这些导出，尚无实际接线/GREEN |
| R1原生read | 复用既有`createExecutionTools(env,['read'])`与`Tool.execute`；内容/原生offset/limit/details责任明确 | 产品获准资料映射和窄文本视图可独立设计；新错误分类/content修复不能假定已在旧包采用，限额独立类别未闭合 |
| R2 | 既有stop/RunResult/ProviderFailure保留；恢复参数无需发明 | 完整安全失败/known-zero/物理状态/actual candidate载体未定，Adapter/Store/UI不得猜字段 |
| R3 | 既有Tool及native read可复用；全量本地计算/证明归产品 | 执行后超限receipt/bounded-result未定；本次私有重复投影修正可继续，大结果不能否认效果或重放 |
| R4 | 每purpose现有fallbacks签名可复用 | 全链验收先R1/R2；report的backup变量不构成analysis备用链或额外授权 |

## 原 Adapter 的精确修改接点

`adapters/agent-pi/native-open-analysis.ts` 的单一transport入口，当前首次授权检查后构造phase工具投影，随后白名单→ledger.reserve→issue，进入try后才合并signal，retained发送支路还后置2048 cap。

新包到达后按因果RED逐步调整：

1. 保留current/migrationRetiring/撤权/取消检查及原工具可用性、description/schema精确投影。不是把guard装进吞错observer。
2. 在reserve前构成真正最终ModelRequest：合并原两signal、保留完整messages/history/tools/blocks/images、确定该候选最终输出上限，retained cap也前置。模型是实际request.model，不能用静态首选推断。
3. 原获准接收方/用途/能力/protocol/thinking/image边界先核验，然后调用实际guard。成功会冻结普通DTO；后面只能发送这个获准对象，不能又复制改消息或cap。失败原样传播，ContextAdmissionFailure不是ProviderFailure，不能包成UNKNOWN、无条件fallback或开启第二恢复器。
4. guard后、每个异步授权/凭据边界后复查撤权/取消。获准messages digest→reserve→issue→经授权凭据→createPiTransport/HTTP；准入拒绝必须零物理记录/零凭据访问。SDK内部modelCalls与产品HTTP账本不同，SDK对最终guard失败的预留结算另验。
5. 用同一transport覆盖工具后续、每候选、自动/手动compaction/summary；这些都是真实计量调用，不缓存旧窗口PASS。SDK runtime也传同一固定policy，并纳入新Task配置身份。不得改绑旧Task。

没有将此设计伪装成已经实现的薄wrapper，也未增加无法从0.4.3导入的生产代码。新API只允许留在Pi Adapter；业务Core、Ports、Application不暴露Pi admission类型。

旧Task兼容须在接线时从既有可信Task/配置绑定区分，新policy仅用于获准新业务Task，不是重建本工程任务。SDK允许省略policy保留旧Task配置；不能为旧Task追加policy、重写旧accounting或共享新旧runtime缓存掩盖CONFIGURATION_CHANGED。该分支的实际新包兼容行为和现有Session/cache选择都需V14证明；当前未实施迁移。

## 已完成的策略核对与仍需核实的值

下表来自当前批准配置/实际composition静态读回，不是Provider最新能力实测；没有读取凭据或调用Provider。

| 当前用途 | 配置实际候选 | 窗口/输出声明 | 现状 |
|---|---|---|---|
| analysis / proposal_prepare | 默认minimax-cn/MiniMax-M3/anthropic-messages；明确config.analysisModel才选择mimo-v2.6-flash/openai-completions | 200000/4096；1048576/4096 | 每用途各一个候选，未装配fallbacks；正常browser未传analysisModel |
| report_edit | xiaomi-token-plan-cn/mimo-v2.6-flash/openai-completions | 1048576/4096 | 正常browser传reportThinking:off，现有reasoning:true/thinkingProtocol:mimo-chat；这不是analysis fallback |
| retained_case | xiaomi-token-plan-cn/mimo-v2.6-pro/openai-completions | 1048576/2048 | 旧独立legacyCredential授权路径保留，不扩大新凭据白名单或迁移旧Task |

`policyVersion`是新Task身份的一部分。`protocolOverheadTokens`和`safetyMarginTokens`必须针对实际用途候选及HTTP codec隐藏包络核定；合成例子的256/8192或本测试512/8192都不是生产值。现有代码没有可沿用的已验证准入policy。read50KiB、工具1MiB、768KiB预览分别是不同约束，不能推导这些token值。当前模型无已批准image预算；不给imageTokens默认值，也不以文本contextWindow证明图片安全。SDK admission启发式/字节包络不是Provider精确tokenizer上界。新包真实codec最终请求测量与已批准候选能力核实是启用策略前的返回点；若无法核定，保持UNKNOWN并关闭新策略出站，不用合成参数投入产品。

## 消费者准备及待包返回点

`consumer/context-admission-consumer.test.mjs` 是待运行的真实公共guard消费者，动态解析隔离安装包，没有stub实现。覆盖C06最终schema超限→零边界效果、获准schema真实Pi SSE正向、较小窗口重新拒绝、Unicode/转义/current tool tail/输出预留、递归冻结/非DTO、取消、无预算图片拒绝。当前只语法检查，未运行行为断言；运行在旧0.4.3会明确前置失败，不计为产品RED或新SDK集成。

实际产品J02另需在新包接入后以现有Ledger/凭据Port/Workspace证明真实零reserve/issue/credential/wire；涵盖不同phase的真实schema、原生summary/tail、同Task固定策略和旧Task CONFIGURATION_CHANGED。准备脚本的计数器只说明公共接缝断言，不能代替产品持久账本证明。旧C06缺口探针和002归档不改写；C03的两物理调用预期不能直接移植新原生摘要路径，需按实际同Task计量、一次恢复额度验证而非新建恢复器。

资料映射后续直接用原生read工厂：仅当前实际授权文件/版本，目录、字段/行或文档位置由已有source_id/sheet_id/hash绑定；长行派生业务窄文本视图，完整原件本地保留。未定义通用handle格式、读取仓库或新SDK输出引用。授权→撤权→文件变化→read错误/续行需分别实际验证；长cell语义quote上限的兼容影响不由read成功自动关闭。静态清单中的各大返回点见remaining-work-and-tool-output-audit.md。

固定包入口：`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-handoff/2026-10-14/sdk-incoming/<version>/<sha>/`。收到不可变新精确版本tgz、bytes/SHA、内容/依赖manifest、最终合同增量、完整验证及兼容/回滚材料后，核验→仅本任务隔离安装→真实resolution/49或新文件集合逐字节核对→激活上述消费者及Adapter因果RED→GREEN→先R1/R2再R4再R3→IR/proof/Outcome/HTTP/client/UI→完整固定候选独立Validator。新版文件数由实际包决定，不沿用旧49作假断言。

R2最终载体、R3已执行超限回执与read限额分类需要API增量；它们可先回交文档对齐，但行为GREEN仍等固定包。历史失败/旧包/UNKNOWN保留。真实Provider、Git发布、生产切换和其他产品升级未执行且仍另行授权。

## 接续提醒后完成的独立策略测量

R1-POLICY-DIAG-01已执行，不是guard实现或产品修复GREEN。`consumer/policy-projection-probe.mjs`走实际Application→Adapter→安装0.4.3→createPiTransport→真实Pi HTTP/SSE codec，显式synthetic key和离线fetch；实际16工具分析phase、三种现有配置（默认primary、flash、flash thinking off）、三种已解析合成资料，共9组/18次离线codec请求。每组产品账本均结清，完整请求/body/本地账本在原证据根 `r3-output-002/r1-policy-001/`；原始日志 `r1-policy-probe-001.log`，exit0。业务结果均ANALYSIS_INCOMPLETE：故意只读取、不计算或保存Outcome，不能算9项分析成功。

| 资料 | 实际inspection回包bytes | 最终messages包络范围bytes | 编码后HTTP body范围bytes | 真实可见资料 |
|---|---:|---:|---:|---|
| 10000列/32767cell CSV | 538537 | 759423–759438 | 754670–760276 | 10000表头保留，1个数据行均未预览 |
| 32文件/2048sheet XLSX | 707792 | 960890–960905 | 956137–961743 | 2048sheet/4096表头/2048数据行保留；目录本身仍大 |
| 8MiB/100000cells CSV | 5438 | 107524–107539 | 102771–108377 | 100表头保留，999数据行均未预览 |

本次包络含真实工具声明、system、tool结果和既有native历史。工具JSON嵌入消息再编码可放大字节；protocol mapping也会省去或增加字段。已观测HTTP−messages差：Anthropic为负，OpenAI为正；不能取该差的最大值直接当token协议开销，不能因为某次body变小称模型更安全。思考关闭在当前codec改变body，也是待包guard应覆盖的实际参数。输出4096始终保留，窗口仍按配置200000/1048576声明而非实测。现有最大观察值961743不构成future history、其他phase、报告、图片或Provider隐藏开销上界；生产policy参数仍UNKNOWN。

## 获准资料映射设计收口：复用现有身份，不增设SDK合同

1. 本地完整MemberSourceInspection与原上传字节仍是资料权威；identity.scope_sha256/源sha/当前revision必须一致。读前调用现有current/authorize/signal与source复核，异步读后再次核验；预览不是新资料权威。display_name、截断表头、模型给出的路径或hash单独不能授予文件读取。
2. 业务定位沿用已存在的source_id、source_sha256、sheet_id、row、column；sourceEvidence已经精确核对唯一来源、可见sheet、单元格类型和OCR状态。派生窄文本视图只能来自这些本任务获准位置，保留完整原值和原位置的可追溯关系，不创建新的Core语义schema/通用handle仓库。CSV的物理行受引号/换行影响，native offset不能直接冒充业务row；XLSX不能当原始纯文本读。原文件和本地计算不改为窗口内子集。
3. Pi Adapter拥有实际工厂/文件边界；直接用createExecutionTools(env,['read'])，只读当前Task已绑定派生资料，SDK提供原生offset/limit和裁剪提示。不给Shell/Edit/Write/网络、不靠截坏JSON提供续读，不实现第二分页引擎。厂工具content/details的新桥接仍须新包实际运行；文件类型/权限/取消/UNKNOWN如实分类，未闭合的限额类别不补造。
4. 当前createNativeBusinessTools固定27项，selectedTools及SDK purposes固定Task工具集合；transport又按input.tools筛选广告声明。新的获准read接入必须同时覆盖SDK工具登记、可信phase可见性投影及授权文件映射，不能只把工具加进数组后被phase过滤删除，或开放任意路径。改变工具集合/policy会改变Task配置身份：只在已获准新业务Task启用，旧Task原配置与历史保留。此为既有Adapter/private配置影响，不将Pi工具类型暴露进业务Ports。
5. 现有sourceEvidence仍通过完整本地原值校验精确quote，2000字符引用约束与32767单元格接收能力不同。续读能取得长值不等于允许把整格升级成语义quote；保留已有合法短引文路径，不扩大引用上限、不自动切片或把OCR未确认变成SOURCE_INTERPRETED。真实read→精确quote→当前source核验需要联合验证。
6. 模型目录必须表示当前可读材料及所有来源/字段/位置的可达性；大目录自身应派生获准窄资料供原生read。其业务序列化属于产品私有视图，不能先假定R3尚未确定的bounded-result/receipt字段。对calculate_and_verify/read_analysis_evidence/finish_result等有持久恢复消费者的返回字段，先等实际R3回执决定并保留兼容影响；不以任意新handle替换旧字段。

对应待包断言：全部source/sheet/field到达原值；32767长格与JSON长行可获准取得而不开放bash；CSV物理行与业务row不混同；撤权/源改变/越界/链接/不支持/取消/read限额分开；旧Task无工具/policy强绑；read.content确实进入模型且details保留native历史；guard检查真实read工具声明和每次续读tool tail；hash不是可读引用；完整计算/IR/proof/Outcome不因预览裁剪缩水。没有实现或模拟新read引用格式/结果平台。

本轮可独立设计、实际codec测量和消费者准备已收口。下一生产接线及联合行为测试依赖固定新包的guard/read桥接；R2/R3返回字段继续依赖实际API增量。不是请求重新启动任务，旧失败和UNKNOWN仍有效；材料到达后按上文精确接点在本任务恢复，无新授权跳转。
