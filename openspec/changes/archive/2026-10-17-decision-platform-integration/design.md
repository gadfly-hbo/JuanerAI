# 宿主 Adapter 接点设计 001（非实现合同冻结）

## 已读宿主接点

| 层 | 当前真实接点 | 复用方式/限制 |
|---|---|---|
| 成果输入 | packages/application/report-studio.ts、adapters/report-studio/store.ts 的稳定交付副本；apps/browser/report-studio-http.ts deliveries/:id/copy | 以明确交付 ID 读相同字节，保留版本。既有下载格式 PPTX/HTML/PDF；本插件未声明支持 HTML |
| 应用 | packages/application/report-studio.ts、profiles/personal/report-studio.ts | 参考业务 Gateway/Store 注入、任务版本关联；不把 ReportStudioAssociation 或报告制作语义改名通用化 |
| 固定装配 | profiles/personal/report-studio.ts:createPersonalReportStudioRuntime | 参考 bundle 校验、单飞启动、仅复用自有实例及显式数据根；另装 decision-platform 固定模块 |
| 进程 | adapters/report-studio/process.ts:createReportStudioProcess | 参考显式 Node/entry/env、所有权和关闭等待。Studio IPC ready/owner 协议不在看板 Prompt 中，不直接复用该执行器 |
| 访问 | adapters/report-studio/local-access.ts:createReportStudioLocalAccess；apps/browser/report-studio-http.ts | 参考 loopback/Host/Origin/重复头、owner 与浏览器会话分隔；现有方法白名单没有 PATCH，看板採纳需要 PATCH，不能直接搬入 |
| 打包 | tools/report-studio/{prepare-source,build-bundle}.mjs，tools/desktop/runtime-resources.mjs | 当前参考文档列出的固定打包模式；本轮未执行、未证明看板安装物料。Node 要满足插件 >=24.21.0，实际二进制/原生依赖架构另验 |

代码发现通过当前工作树独立 MCP 图 juanerai-decision-platform-intake，并读取关键函数源码；未使用别的活动工作树图代替本候选。图索引排除了 tools，构建脚本只按已发布参考记录，不声明已逐行验证。

## 实际请求与所有权

Browser → 宿主会话/项目/来源授权 → Application 业务操作 → decision-platform Adapter → 宿主拥有的插件实例。只允许所需业务路由，不提供任意 URL/请求体/路径代理。Core/Application 不暴露 HTTP、Pi Session、SDK 配置或密钥；Profile 选择具体 Adapter。

承载采用子进程+HTTP。但“子进程”可为宿主集成入口调用插件导出的 startServer，未必直接运行独立 CLI。完整材料到达后，应证明可以在**实际入站点**施加 guard（使用既有注入能力或宿主装配入口），保持同一业务实现。若只能外围 proxy，插件仍有未保护 loopback 端口，则不能宣称 owner/session 隔离已成立；标缺口并提出最小上游装配接点或显式较弱信任边界决定，不偷偷接管裸接口。端口随机不等于鉴权；同用户 OS 进程也不是企业隔离。

health 只证明服务响应。归属绑定 spawn 的 ChildProcess、固定入口/包身份和实际监听实例；不得找到任意健康服务就附着。就绪/关闭限时是普通工程参数，参考现有启动15秒、停止2秒但不冻结为本插件业务阈值，待真实接缝测试后确定。未知/活动不热换，不因超时杀陌生进程。

## UI/路由约束

Prompt 的前端请求为绝对 /api，直接挂宿主 /plugins/decision-platform 并不能自动加前缀。候选是专用受保护插件页面入口完整复用原 UI，另提供回原分析及精确来源；若必须与宿主同 Origin，需先证明 /api 路由、静态资源及会话边界不冲突，或采用插件已支持的集成构建配置。不可运行时搜索替换整个前端，也不未经说明改成 iframe/仅 API。完整页面方向已由用户确认，005复用PR90已验收工作台，新增接缝UI待用户确认，路径/端口等工程细节由 Mini 落实。

## 材料与持久化边界

保存的选定报告经同版字节校验后才上传；本地选择许可与模型外发许可分开。每次上传可能触发主模型/备用/辅助请求，材料许可必须覆盖实际接收方；只有 env 密钥不构成许可。配置不继承宿主另一任务的 SDK/账本身份，不读取独立版 data/im.json。启动环境只包含批准项、独立 HOME/TMPDIR/DATA_ROOT 与所需运行路径。

宿主保存关联和来源，插件保存项目/任务/反馈；两个数据库不合并。关联至少能追溯 source revision/delivery、hash、插件固定身份/project/report/action/task/feedback 身份及写入结果；本轮不创建表、字段或公共 Schema。真正持久合同在产品边界闭合后按现行结构决策规则处理。

上传“同名覆盖=重抽且保护已决项”不是跨请求幂等。创建、上传、反馈均需保存原操作身份并读回实际对象；Prompt 未说明 receipt/查询覆盖，不预设接口存在。无法核对则保留 UNKNOWN，拒绝盲重发。候选002已明确同宿主任务共用插件项目，来源升级新增报告和关联，旧报告/已决项/任务/反馈保持旧来源；同项目 teach 可供后续抽取使用，异任务隔离。避免同名覆盖的私有命名由工程落实。

取消和恢复：Prompt 只提供重启后 extracting→failed，不能证明物理 Provider 已停或未知消费已结算。关闭 UI 不停止，停止/退出只对自有实例。无足够生命周期接口时先保留限制及上游缺口，不伪造“停止成功”。

## 固定交付与回滚

未取得集成物料，不 clone、不打包活动源码。收到精确快照后验证 source commit、tar bytes/SHA、vendor SDK、实际 lock、全文件清单、依赖/通知、Node 和原生平台资源。升级差异分业务源/宿主接点/SDK机制，并核对目标包含性。首次使用新空数据根；检测旧库或未知迁移要求即拒绝，不运行 M5 破坏性路径。保留旧包/旧数据，程序回滚不保证数据回滚。

未知项只阻断相关接线或完成声明；不撤销已完成的宿主设计。预计实现根为 packages/{application,ports,contracts}、adapters/decision-platform、profiles/personal、apps/browser、tools/decision-platform 及相应 tests，但**当前未授权写入这些生产/测试路径**。
