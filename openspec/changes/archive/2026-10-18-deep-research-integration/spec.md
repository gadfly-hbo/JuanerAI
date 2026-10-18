# DR-003 当前工程行为规格

批准权威：DR-002 R01–R10；engineering-intake.md。固定插件源及标准身份见 verification.md。此规格补足私有接线，不改变产品范围。

## 接线与权限

宿主每个分析任务拥有独立研究工作空间，空间内保留多个插件项目及 workspace 情报库；WORKSPACE_REUSABLE 只覆盖这个已授权空间，不自动获得其他宿主任务材料。跨空间材料仍须显式导入与授权，不建立共享库或自动提升作用域。

宿主 Adapter 装配固定源导出的 Ctx、三个 domain handler、FsProjectStore、FsLibraryStore、RunRegistry；不调用默认 startServer。所有入口在 listen 前封闭：仅精确 loopback Host、单一 owner token 或一次性 bootstrap 后 HttpOnly cookie；写请求须同源；拒绝重复权限头、协议升级、路径歧义、未知 HTTP 方法。浏览器端无 owner token、Provider key 或主机完整环境。每个请求和每次外部效果再核当前权限；首期生产 Provider 默认为拒绝。合成测试通过独立依赖注入使用相同 handler，不启用测试旁路 HTTP。

拒绝 followup 和 sessionDigests；不装配 sessionRuntime/onRunComplete。拒绝请求手工 plan、outline 绕过两门及非授权附件。设置递归拒绝凭据字段，运行或未知时拒绝配置变化。运行请求持久身份用于取消与查询；取消受理不当成物理结束。启动发现未结算运行保留未知记录，阻止新的效果，不自行恢复或清除。

发布在 per-project 锁内按 run 查已有版本，已发布则读回同版本；未完成／无束缚身份拒绝。副本冻结 ZIP 实际字节、project/run/version、原 bundle 内容与限制、source commit 和时间；同字节幂等，不覆盖旧副本。保存失败／未知可读回同请求，不重新生成研究或正式输出。读取已保存副本不启动插件。

## 适用验证与顺序

1. `node --test tests/integration/deep-research/*.test.mjs`：原源装配的 HTTP 准入、错误／隔离、原两门、取消、发布、真实 ZIP 与稳定副本。固定源包路径由测试命令显式注入；缺物料明确 SKIP，正式候选不得用 SKIP 冒称通过。
2. 固定插件锁安装、编译与 `hostAssembly.test.ts`：实际 SDK 0.4.3 authorize 和数据落位的合成消费者，不调用 Provider。
3. 本 Change build 配方校验 source identity，实际 UI 构建与可迁移固定包清单；坏摘要／路径／链接反验。
4. 宿主焦点回归与类型检查，随后适用 `tools/harness/validation/run` 全量；完整候选独立 Validator。真实浏览器检查以实际服务＋合成 Adapter 证明接线，不冒称研究质量或安装分发。

各实际执行的失败／退出、候选身份与回读保存到 engineering-003-20261018；尚未执行的项保留 NOT_RUN。

## 已证明的宿主适配差异

取消待确认门后，固定插件原 resume 不传 gates，会直接研究到 limited（security-red-001.log）。宿主恢复该 durable gate 为 awaiting-confirmation；只有用户再确认才推进。未确认请求不允许 rerun 旁路；取消运行核对 project/request 归属。原源码不改，宿主专有权限／恢复接缝与测试独立保留。

## 003 收敛的私有工程合同

- 浏览器 bootstrap 单次使用；cookie 与每次打开的 view token 配对，取得宿主新操作权后旧页面不可写。宿主状态查询只读，不重放 UNKNOWN；提供实际状态／版本查询、重新打开入口与可用副本读回。
- 附件须由宿主后端提供 path/bytes/SHA-256 精确许可，逐次检查当前权利并冻结到任务私有目录；没有默认宿主资料外发。单附件 16 MiB；HTTP JSON 常规 16 MiB、库登记批次 70 MiB（原单文件 50 MiB 校验仍生效，较大批次须分次登记）。这些为当前本机资源上界，不是研究质量保证。
- 发布 pending 标记与目录 fsync 后才执行原发布；中断标记或未结算 running 导致持久 UNKNOWN。保存使用持久 command reservation、固定 staging、原命令查询恢复；ZIP 上限 64 MiB、解压 128 MiB/10000项，重复／越界／不符摘要拒绝。副本版本、内容摘要、限制和任务身份校验；不改写旧版副本。
- 自有 Node 子进程仅携带白名单显式凭据，独立 HOME/TMP、无隐式独立版配置。父进程关闭等待本子进程 exit 0；未知／在途拒绝不安全关闭。MCP Python 由已验证宿主工具链显式给出；本候选仅 macOS arm64/Python 3.14，不查全局 uvx、不会运行时下载，不发现 .env。
- 原源码声明 mcp<2；minimax-coding-plan-mcp 0.0.4 与 mcp 1.x 依赖闭包固定，40 wheels 的官方 PyPI 摘要独立核对；站点文件逐个固定。0.0.5 需 mcp>=2，未采用。模型仍使用原固定 SDK 0.4.3；共享 SDK 不改。
- build-bundle + stage-bundle 提供独立完整研究资源树与 deployment descriptor；Forge 的 JUANERAI_DEEP_RESEARCH_PACKAGE=1 选择既有 installed browser 载体并纳入该资源。宿主固定资源清单另纳入研究 client/css。只构建／验证，不安装／启动实际用户服务。

当前无生产 Provider 授权入口默认放行：原模型／搜索／采集／解析及 SDK authorize 都再核宿主权限，默认拒绝外部效果；允许的合成 factory 只来自测试 composition，不由 HTTP 选择。后续真实 Provider 和材料许可是独立任务，不能据本次通过开启。

请求标识输入 `request.id`／`requestId` 必须为有界单段标识（ASCII字母数字开头，后续允许字母数字、下划线、点、冒号、连字符，最多200字符）；禁止任何目录分隔符。原FsProjectStore按该ID构造requests路径，故宿主在任何读取／写入前统一拒绝路径型ID；request-path-red-001为已复现200而非预期400的合成反例。

### F-DR-003-01 保存撤权修正

HTTP正文读取后再核本请求的当前控制权；Application在持久command reservation之前和异步导出返回后、同步副本落盘之前分别核任务与当前写权限。撤权后不新增命令／副本；撤权前已写的reservation保留供当前控制权使用原命令重试。已有副本和原命令读回仍可读，不以撤权删除已获准效果。永久HTTP回归覆盖实际正文分段与导出等待两种竞态及重试、幂等、读取。

### F-DR-004-01/02/03 复核修正

- 插件浏览器 view 在正文读完、异步授权返回、附件许可返回以及原 handler 派发前重新核对；旧 view 在等待期间失效时不得继续写入。异步效果授权也复核当前宿主任务和许可，避免捕获旧许可后越过控制权转移。
- 可证明尚未创建子进程的启动失败标记为不可用但无活动；允许宿主切换项目与关闭。已经生成子进程后的异常、在途或 UNKNOWN 不借此放宽。已确认正常关闭后状态不再向退出进程发送消息，重复关闭保持幂等。
- 保存回复只更新原任务面板；只有当前入口仍对应相同 project/task 时才更新其保存状态。切换到另一任务不得显示旧任务的成功状态，回到原任务仍可读回副本。
- 正常入口验证使用真实 deployment descriptor、startIndependentBrowserService、项目选择与宿主任务上下文；合成研究在首次打开前通过原两门预置，生产服务的外部效果仍默认拒绝。覆盖保存／重开／副本、切换项目、坏包拒绝后的可用性与关闭；此证据不等于干净机安装或真实 Provider。
