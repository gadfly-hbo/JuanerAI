# DR-002 合成 UI 审核附件

权威产品文本：上一级 `ui-contract.md`。`contract.html` 为它的阅读镜像。

启动：在 JuanerAI 仓根执行 `python3 -m http.server 8794 --bind 127.0.0.1 --directory openspec/changes/deep-research-integration/clickable`，打开 `http://127.0.0.1:8794/`。只暴露此目录的静态审核附件。

先选左侧销售／会员任务，再点右上角“深度研究”。计划→框架两门使用固定插件原组件；“审核场景（合成）”可显式切换有限交付、失败、取消终态、未知状态等。所有数据与保存记录仅内存，刷新清空。没有启动插件后端、真实 Provider、外部搜索、文件读写或研究导出；文件上传控件禁用，未模拟的库治理／配置／加注写效果明确拒绝。

`reference/ui/` 为固定插件原 UI；`reference/src/app/` 为 UI 引用的两个纯函数；`reference/host/` 为已批准宿主原件。它们逐文件 SHA 见 reference-identity.json，不直接改写。`plugin.js` / `plugin.css` 是已构建预览，离线可读。新增逻辑集中在 host-bridge、mock-api、review-controls 与 integration.css。

重构建使用 `build-preview.cjs`；本机默认复用 esbuild 0.28.2、隔离前端依赖 react/react-dom 19.3.0 / react-router-dom 7.18.4。可显式设置 REVIEW_ESBUILD 和 REVIEW_NODE_MODULES 为同版本依赖位置。原 lock 不被 preview 安装改写；这不是生产包构建或依赖验收。生成文件的依赖许可注释保留；正式第三方通知与分发许可仍需工程打包检查。

UI 原件全部保留，但本稿不能证明每个库操作、生产鉴权、持久化、副本哈希或 SDK 行为。见上级 verification.md 和 design.md 的明确 NOT_RUN。
