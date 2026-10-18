> 003 当前状态：DR-002 用户 UI Gate PASS；工程接收已确认，WIP UNKNOWN 按用户具名例外保留。允许工程接线与离线验证，禁止真实 Provider。批准与当前权限见 [engineering-intake.md](engineering-intake.md)。下文002准备状态保留为历史。

# deep-research 宿主 Adapter 接缝评估 002

2026-10-18。范围、决定和状态权威为 [§7 交回](verification.md)。本文件是基于固定启动说明与宿主代码的设计，不是已批准工程规格、已实现 API 或接线 PASS。固定源与完整 UI 已取得并核对；新增静态源码结论见 §0。工程接线与运行验证仍未实施。

## 0. 固定源复核后的接缝结论

2026-10-18 source-002。用户已明确授权直接获取指定 GitHub commit 和完整 UI，只做接缝评估／可点击合同，禁止真实 Provider。源 identity 与证据见 verification §1。以下精确文件均指固定插件 commit 的 `src/`，不是宿主产品实现。

| 结论 | 源码证据 | 宿主接线影响 |
|---|---|---|
| J1 具备宿主注入点 | `adapters/piRuntime.ts:198` PiRuntimeOptions 接收 authorize/dataDir；`:229` 装配缓存键区分 authorize 引用与审计路径，`:274` 未传时默认允许；`:368` piRuntimeModel 与 `:391` runFreeText | 必须明确传宿主策略；不能把默认允许当符合宿主权限。策略为 channel 级，共享通道时必须正确映射实际 task/run 权限，不能捕获首个任务后跨任务复用 |
| 默认 server 不能直接作为安全内层 | `server/server.ts:34` startServer；`:108` 创建 handler；`:118` 读 body；`:157` listen 后才返回 server | 仅在外面加代理或返回后换 listener 都留下可绕过／抢先接入路径。采用宿主拥有的监听装配，在开始监听前完成所有请求准入 |
| 可复用现成域 handler 与上下文 | `server/routes/http.ts:18` 导出 Ctx；`projectsRuns.ts:200`、`library.ts:17`、`settings.ts` 导出域 handler；versions 经 projects 域分发 | 主候选是在宿主 Adapter/composition 内复用这些业务 handler、原 store/registry，补足初始化／静态资源与访问守卫；不复制研究业务。初始化和恢复逻辑的等价性、内部导出稳定性仍须固定源消费者测试 |
| sessionCandidates 缺省只关闭纪要装配 | `server/server.ts:77–88` 默认会话工厂没有透传宿主 authorize；`projectsRuns.ts` 仍有 followup 分支；原 Plan/Gather UI 有追问入口 | 首期不传会话候选，同时 HTTP 拒绝 followup、UI 明示禁用。后续另行评估会话授权，不自造“只不传候选就足够”结论 |
| 库抓取经过 makeAdapters | `server/routes/library.ts:237–246` 通过 adapters.page/parser 取得正文；库登记、元数据、更正、删除与迁移为另一路由效果 | model authorize 不能覆盖这些请求；还须 page/search/附件作用边界及所有效果路由准入。不能只验证研究 runs |
| 静态 UI 有 cwd 约束 | `server/server.ts:135` 使用 cwd/ui-dist；固定仓有完整 ui 源，无受跟踪 ui-dist | 正式包预构建且离仓可运行；审核 bundle 不是生产 ui-dist 包含性或锁文件安装证明 |
| 原完成／版本／正式产物不同 | `routes/versions.ts`、`ui/views/PublishView.tsx` 显示生成正式产物可覆盖；原 Draft/Review 消费选定 bundle | 宿主副本冻结具体字节，不随着同一 research version 的正式产物再生成而悄悄变化；保存按实际版本和摘要读回 |

**结论：维持插件侧评估“必须项为零”的输入基线。本次静态源码没有证明必须修改上游业务；宿主装配有可用候选接点，但还不能称无需任何 Adapter 工作或标准符合性 PASS。** 原 server 安全层不能直接拿来用是宿主装配责任，并非凭静态阅读就推翻插件侧结论。若实施时发现公开导出不足或等价性无法保持，先记录具体反例和最小影响，禁止无记录分叉原业务。

完整 UI 的原源／资源已随审核附件保存。产品语义与完整清单见 [DR-002 UI Contract](ui-contract.md)，可点击稿只执行原前端及合成响应。正式许可证通知、Node 运行分发、生产依赖解析、完整包 bytes/SHA 和 SDK 真实消费者仍未验证。

## 1. 真实接点与最小增量

宿主图索引绑定当前工作区，索引名 `juanerai-deep-research-intake`。通过 search_graph / get_code_snippet 读取现有函数，未从其他 checkout 推断本树实现。

| 责任 | 现有实际参考 | 本插件设计接点 |
|---|---|---|
| Application | `packages/application/decision-platform.ts:createDecisionWorkspace`；参考导览中的 `packages/application/report-studio.ts:createReportStudioWorkspace` | 研究任务与插件 project/run/version 绑定；打开、原确认、读取进展、取消、发布和接收稳定成果分别表达。不得拿报告已保存或 HTTP 200 替代业务交付 |
| 业务 Port | `packages/ports/report-studio.ts` 的 Gateway/Store 模式 | 只定义当前研究消费者所需业务接口；插件状态及协议翻译留 Adapter，不向 Core 暴露 Pi/SDK 类型；不建立万能插件注册／公共 Schema |
| Profile | `profiles/personal/decision-platform.ts:createPersonalDecisionWorkspace`，Report Studio Profile 模式 | 显式选择固定 bundle、Node、入口、ui-dist、dataRoot、凭据提供及授权；懒启动，不因看历史副本唤起插件 |
| 自有进程 | `adapters/report-studio/process.ts:createReportStudioProcess` 已读 | 参考自有 child、并发 start 合流、归属和退出模式；不搬 Studio IPC ready 协议。实际启动与守卫接缝已读，见 §0；生命周期待运行验证 |
| 访问控制 | `adapters/report-studio/local-access.ts:createReportStudioLocalAccess` 已读 | 参考 owner token、一次性 bootstrap、HttpOnly 同站 cookie、loopback/Host/Origin/路径与重复 header 拒绝；协议／路径／请求类型按研究 UI 实际需要定义，不能原样复用 Studio 业务路由 |
| 成果与恢复 | 上述 decision Application 的 pending/unknown、同请求读回；Studio 稳定副本模式 | 发布版本导出 ZIP→验证项目/run/version/manifest/bytes→宿主稳定副本→独立读回 receipt。重复接收复用原副本，未知发布先核对原 run，不盲目重发 |
| 浏览器外壳 | `apps/browser/report-studio-http.ts` / `report-studio-client.mjs` 和现行工作台 | 保留宿主导航／任务上下文，打开完整研究工作台并可返回；插件工作区与宿主编辑草稿不串任务，失败不丢已有成果 |
| 固定分发 | `tools/report-studio/build-bundle.mjs` / `tools/desktop/runtime-resources.mjs` 的固定资源模式 | 本插件自有清单与构建配方；携带匹配 Node、生产依赖、固定 UI 与通知，不要求用户另装插件仓或全局 Node；安装验收单独证明 |

上表有区分“已读函数”与“导览／模式参考”。这些是实际宿主文件，并不意味着 deep-research 接口名、文件名或 Schema 已冻结。普通私有路径在获准实现时由工程决定，不从设计草稿建立持久合同。

## 2. 承载与安全必须一起闭合

设计选择自有子进程 + loopback HTTP。程序根／入口／Node／数据根绝对定位，dataRoot 在宿主可写用户空间且与程序资源、独立版 research-data 分离。固定 UI 不运行独立版 BUILD_HEAD 动态重建。输入同时指出静态服务读取 cwd/ui-dist，因此启动时明确 cwd 为固定程序根，核对实际 ui-dist；`--port --datadir` 并不自动消除静态资源 cwd 依赖。

就绪须组合固定资源校验、自有 child 身份、进程存活、绑定端口及协议可用性；`GET /api/projects` 成功只能证明可访问，不能单独认证拥有者、版本或“这是我们启动的实例”。端口冲突不接管未知服务；并发打开不启动重复实例。实际端口选择、启动超时和正常停止预算由工程在获准环境下按材料关闭，不借用 Studio 数字作为研究业务承诺。

外层代理不能天然保护后面的无鉴权端口。后续必须验证浏览器／外部来源不能绕过宿主守卫直达底层服务、公开完整 UI 不能绕过任务准入或调用已禁止功能。优先在宿主拥有的装配／监听入口围住所有真实 handler，使用原有插件业务和 J1 注入点；不为此预先要求上游改业务或新增通用鉴权平台。若现成导出面无法形成这个接缝，应明确反例与最小合同差异再决定，不能靠随机端口声称隔离。

完整 UI 中 run、confirm、cancel、instruct、budget、publish、formal、情报库及配置效果均须处于同一准入边界。请求来源守卫和 SDK authorize 是不同层：HTTP 准入不能替代每个真实 model/tool/publish/control 效果及撤权检查。固定源码证明 J1 函数有选项，而默认 serve/session 装配不能代表宿主策略已经传入；需要使用 §0 的自有装配并执行消费者验证，不从“必须项为零”推定它已经接通。

宿主向 child 只注入明确批准的凭据环境项；不继承整个 process.env，不读独立版认证目录，不经前端/API/config 明文写 key，不写日志／工件。模型与搜索主备链、辅助请求用途、有效数据范围和资源由实际任务授权决定；默认 80 搜索/60 抓取/90 分钟以及“token-plan 边际成本 0”都只是输入记载，不代表已授权调用、实际货币免费或已测用量。

## 3. 用户链路、状态和效果

1. 从宿主既有任务上下文打开研究工作台。宿主保留关联和回程，插件拥有研究项目／证据／情报库；不合并两套库或 SDK 账本。入口具体位置在本 Change UI Contract 中结合原工作台确定。
2. 沿插件原有研究计划／报告框架确认交互创建／推进研究，不用 body.plan 偷跳门。确认绑定实际 project/run 与当时计划；重开读取未决门，不默认代确认。计划改变是否令旧确认失效，按固定插件合同核验，不臆造字段。
3. 查看真实进展与原能力；运行中指令、来源补充、预算加注依实际作用重新核对有效授权。常规在范围内继续不重复索要许可。首期 sessionDigests 与 followup 不启用，前后端都要守住该范围。
4. `running` 和 `awaiting-confirmation` 是非终态；`published`、`limited`、`failed`、`cancelled` 保留原语义。输入把六种统称终态有表述歧义，本设计不复制该错误。`limited` 是可交付的受限研究，必须展示 limitations；不能变成错误或完整充分结论。
5. run 的 `published` 不直接推出不可变版本已发布，更不推出宿主副本保存成功。分别读回 `POST :id/publish` 的真实效果、版本 bundle/export、宿主保存 receipt 与同字节内容。未知发布或保存先查原身份；重复请求不重新研究／再造版本。发布后原工作项目不可用也不删除已有稳定副本。
6. 返回／关闭页面不冒充取消。取消关闭新准入并保留已完成检查点；仍在途、迟到或未结算显示实际状态，不以返回 cancelled 声称所有物理效果停止。活动或 UNKNOWN 不热换、不清账；重开和 checkpoint 重跑先核权限与未知效果，不自动恢复。

主消费形态是 HTTP，其失败按真实 failed run 映射；不把进程内 promise reject 的 AUTHORITY_REQUIRED 路径套上。即使 SDK 拒绝造成单问未答、run 继续 limited，也必须保留原因与不足。未知 enum／坏响应拒绝成功，不猜测为 published。

## 4. 业务验收与拟选检查

完整工作台的固定原 UI 已编译为可点击接缝，详见 UI Contract。用户仍需判断入口／确认／回程／有限交付／证据／保存是否符合意图。独立产品就绪审查与用户 UI Gate 分开记录，不据此直接开工。

| 检查 | 本插件要证明的正负路径 |
|---|---|
| C01 / C02 | 固定源、J1、SDK/lock、UI、Node/依赖和通知实际进入目标包；坏摘要、缺文件、链接逃逸拒绝；离开开发仓可定位资源；无包／未安装保留未执行 |
| C03 | 自有实例就绪、并发打开复用；错身份、旧进程、冲突端口、超时、活动／未知退出都不冒称就绪／已停 |
| C04 / C05 | 精确批准材料／来源与任务／接收方；撤权、跨任务、路径逃逸、浏览器绕过、重复 header、伪 Origin、秘密泄漏均负验；用合成密钥 |
| C06 / C08 | 研究发布与宿主保存分别幂等／读回；发布回复丢失、稳定副本写失败、坏字节／错版本／缺 manifest 不成功；工作区丢失仍读已有副本 |
| C07 / C09 | 原确认门重开、取消中、迟到、启动清扫、checkpoint、未知发布／用量的真实状态；不自动续跑、不清零、不改绑 |
| C10 | 固定插件 SDK 的实际 codec＋authorize＋预算审计合成消费者，覆盖所启用主备/辅助/工具；拒绝、撤权、日志故障、UNKNOWN 和单次保护；宿主 SDK 的旧测试不能代替 |
| C11 | 完整 UI 能力清单、正常研究／不足／失败／停止及来源证据；计划和框架由用户确认，limited 限制保留；原 UI 接点和新宿主接缝均实测 |
| C12 | 首次建立“原仓维护→固定源→目标包包含性”；以后新物料保留 J1／已验修复与数据兼容，活动／未知不换版，程序回滚不承诺数据可逆 |

以上全部是待执行判据。实现前按获准固定候选选择焦点命令与受影响回归；已有 canonical offline runner 只用于适用完整检查，不先安装运行未知插件。先用真实装配接点和确定性合成业务验证，再以单独获准的数据／网络／Provider 范围评价真实研究质量。测试数量、schema 合法、引用存在不自动证明证据充分或结论真实。

## 5. 当前边界

本轮允许改动为本 Change 对齐／设计／可点击审核附件及设备本地证据。独立 preview-toolchain 只安装前端预览依赖且 ignore-scripts；不改变宿主或插件生产依赖。产品源、共享 SDK、其他插件、业务数据库、持久 Schema、工程看板、生产依赖、旧 WIP／Host Loop、真实服务和 Git 发布均未改变。

当前没有可运行新 Adapter；固定材料已到达，但授权装配运行证明和适用批准仍未完成，不要求重新评估插件侧全部业务。继续点和所缺材料统一见 verification §6。
