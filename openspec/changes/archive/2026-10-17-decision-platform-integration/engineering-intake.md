# Engineering Intake — 2026-10-17

当前Mini同一主Agent承接006r1已批准产品/UI输入。用户最新回复“授权，开始推进”，闭合前次固定源码取材请求，连续推进本任务宿主接缝；该请求明确不含插件启动、密钥和运行数据。此前design/tasks的未授权/待UI标签是冻结前快照，由approval-and-freeze.md及本记录更新当前状态。

## 固定物料回执

- MacBook `/Users/huangbo/Dev/Projects/decision-platform`，取材前后工作树干净，活动HEAD仍`312ba8a1cd9eb7b793a5d0c039aceee70c20459e`。
- 只导出`8ae652ce53fc27d3be92098517643a419f9b73eb`，tree `4dd1c45ade2a6a40149bdaaafda5f5a4dfa2efcc`。70项源码/构建配置/测试/锁/vendor/基线，未导出提交中包含的业务CSV或其他用户数据。
- tar 901120 bytes，SHA256 `421a532a702ced49f022c1d32d401ade7139949aa9aba901affa3551a501419d`。
- package-lock.json 182049 bytes，SHA256 `1a1f95cd0e3509cbbdc00fb9822ccdb72e5a007ef95061b9b322a3d61f00a705`。
- vendor SDK 102550 bytes，SHA256 `1ddace3a5b7ff97e80627dc4660d9f300ac402a4bfc67f43144380d3352d6da5`。
- 全部文件分别核对远端Git blob及提取后的长度/SHA；普通文件白名单，拒绝链接与路径逃逸。固定原件不改写。
- 证据根继续为`/Users/bendandebaba/JuanerAI-artifacts/decision-platform-integration/intake-20261017`；详细回执`runtime-material-receipt.json`，源码`fixed-source-8ae652ce/`，归档`fixed-source-8ae652ce.tar`。
- Mini当前分支`work/mac-mini/decision-platform-integration`，基线HEAD `a0b6491ddc4700fef881317f44f2c51c699d8f9c`；现有文稿/UI/看板WIP保留。

## 当前实现范围和真实停止边界

先落实不需插件启动、安装或持久Schema的真实宿主入站保护接缝；原生Node本机回环合成服务器验证其效果。允许`adapters/decision-platform/ingress.ts`、对应`tests/integration/decision-platform/`、待授权执行的`tools/decision-platform/verify-fixed-synthetic.mjs`、本Change文稿和主Agent看板记录；`tsconfig.json`条件允许仅加入这两个新增TS文件。后续业务Port/Profile/来源持久化/UI接线沿原产品输入推进，但须先闭合真实接点与必要结构语义，不提前实现空平台。

不修改固定插件副本业务；不触碰MacBook、其他工作树、独立版数据、已有服务、凭据；不启动插件或安装依赖；不调用Provider、推送、真实报告或Git发布。完整固定插件合成验证的具体装配/命令与隔离条件见后续运行方案，获得对应授权再执行。

## 已核实的装配选择

`server/index.ts:startServer`同步创建一个request listener并调用listen，然后返回原生Server；无前置中间件注入。采用宿主私有入口在同一同步调用栈替换这个唯一listener为owner guard，再在校验通过后调用原listener。必须在listening事件/任何事件循环让出之前装配；未知listener数量/其他HTTP入口拒绝，不能用prependListener后仅end响应冒充阻止原listener。

该端口仅供宿主Adapter，拒绝浏览器Origin/Cookie/Fetch Metadata，owner token不进入前端。宿主浏览器层另负责会话与任务/报告授权；这个guard不替代业务许可。原插件API的PATCH需要保留。仅回环、精确Host、规范request-target，拒绝重复敏感头、Expect/Upgrade/CONNECT和不支持方法。撤销后不再准入；不宣称已发模型或在途业务物理停止。

`composeDefaultAgent`会调用磁盘凭据发现，且默认localAuthorize恒true，因此不能作为宿主默认装配直接调用。后续使用既有runner注入接点与宿主显式许可，SDK仍固定0.4.1；合成验证不调用默认compose。`openBoardDb`确实会删除无projects表的旧库，因此任何真实实例首次使用独立新空根，既有未知库必须在调用它之前拒绝。

## 验证范围

入站接缝对应C03/C05，先RED、GREEN及负例，另跑既有Report Studio guard回归。固定物料核验只是C01取材一致性，尚未证明安装/构建/运行。C02/C04/C06–C12仍需完整装配及相应验证，真实Provider和浏览器证据分别保留未执行。此中间结果不派最终Validator、不声明工程接受。
