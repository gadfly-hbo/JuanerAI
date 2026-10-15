# 合成原型运行回执 · MacBook · 2026-10-15

这是新编写的UI Contract预览，不是实际产品后端或前端升级。

| 项 | 最终回读 |
|---|---|
| URL | http://127.0.0.1:61619/ |
| 服务主机 | 当前MacBook，loopback限定 |
| 源目录 | `/Users/huangbo/.codex/worktrees/browser-ui-plan/JuanerAI/docs/planning/2026-10-15/browser-workbench-ui-redesign/clickable` |
| 启动命令 | `BUI_PREVIEW_PORT=61619 node docs/planning/2026-10-15/browser-workbench-ui-redesign/clickable/preview.mjs`（工作树根目录） |
| 本任务Node PID | `56458`；lsof独立回读为127.0.0.1:61619 LISTEN；只停止核对后仍属本任务的该进程 |
| 本任务终端停止 | 在启动终端Ctrl+C；也可确认PID及命令后`kill -TERM 56458`，不使用模糊pkill或产品web:stop |
| 重启 | `node clickable/preview.mjs`（本规划目录），默认系统分配空闲端口，取实际输出URL；不假设61619永远可占 |
| 数据／权限 | 页面合成状态只在浏览器内存，刷新重置；无业务数据库、凭据、安装或真实资料 |
| 浏览器来源核对 | Chrome实际title为“JuanerAI · 浏览器工作台 UI 审核 v0.1”；新加载只请求此URL下HTML、style.css、model.js、prototype.js，无外部请求／pageerror |
| 后端身份 | 没有产品后端。仅Node allowlist静态读取，不调用任何产品API |
| 前端身份 | 本工作树未提交的原型文件；精确字节由评审候选清单绑定。不是磁盘HEAD已运行新版产品 |

此前原型PID52633只为添加文稿只读路由而受控停止；没有产品任务或真实数据／保存动作。旧输出／截图保留；最终进程PID56458。原型端口、过程与产品试用服务分开。

试用副本a95f维持原分支／原SHA；已检查工作区clean。历史`/Users/huangbo/JuanerAI`保留分支且clean。不重启、不更新它们。Mini现场和采用未核验。

原始回执：`/Users/huangbo/JuanerAI-artifacts/browser-workbench-ui-plan/preview-runtime-002.log`、`preview-headers-002.log`、`browser-final-load-002.log`及截图／日志。只在本机持有，不声称跨机备份。可直接手动打开`clickable/index.html`而不使用本服务；file协议自动化未跑。
