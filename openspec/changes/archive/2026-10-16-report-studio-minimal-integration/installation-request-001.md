# 固定依赖安装请求 001

2026-10-16 · 用户后续明确回复“允许本任务隔离安装及 Chromium 下载”。以下准确范围已获批准，实际安装结果另记，不预填成功。

## 目的与范围

工作树没有 node_modules；接下来真实类型/构建、宿主 Application/Studio 接线、供应包与 PDF 浏览器验证需要实际依赖。先完成可独立离线验证的固定包校验31项，不用缺依赖冒充产品RED。

申请仅在 Mini 本任务进行两处锁定 npm 安装，以及固定 Playwright Chromium 下载：

1. JuanerAI `/Users/bendandebaba/.codex/worktrees/323d/JuanerAI`，package-lock.json 原始375881字节，SHA256 `487b964ea8638697062a7a822921e897c26ce83113cdd84d5681d62e4baf5a45`，766项锁条目；包括当前已经采用的SDK0.5.1，不升级。
2. 隔离供应源码 `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/studio-source-74ebb609`，从 MacBook 固定提交 `74ebb609fd73cf263614ffc9301dafaafcec4230` 只读 archive 得到81个代码/构建资源文件；不含 data/work/.zcode/.flow/samples。锁文件195068字节，SHA256 `15fa17b9b552dc7f7a73f352568ceea327ef16a9e2c4e9753de116e02f9f5097`，416项锁条目；保留插件SDK0.4.1、Playwright1.63.0、pptxgenjs4.0.1，不统一升级SDK。源码取证在同证据根 studio-source-identity.json；补充测试材料仍从相同固定提交只读取得。

## 预定执行

使用已有 `/Users/bendandebaba/Dev/Env/juanerai-toolchain/bin` Node26.0.0/npm11.12.1；首选 `npm ci --ignore-scripts --no-audit --no-fund`，npm cache 仅使用本证据根新子目录。原 package/lock 与 SDK tgz 每次前后核对。宿主原锁含已固定 Git node-gyp 源；若本地传输无法满足，保留错误并按现有已审CI隔离安装视图完成同一固定内容，不修改原锁、不放宽来源/SRI。

已发现 lifecycle 标记：esbuild、protobufjs、@google/genai（宿主另含已有传递依赖）；初始禁用。构建实际需要的 esbuild 原包安装脚本在核实锁身份后才有界执行，不批量打开所有 lifecycle。Electron原生壳和安装本轮不需要，不额外下载/运行 Electron、不执行全局安装或 brew。

Chromium通过实际已安装的Playwright1.63.0 CLI，采用该包 browsers.json 的固定revision，`PLAYWRIGHT_BROWSERS_PATH` 指向本证据根独立目录。仅下载其对应浏览器及所需组件；不使用 `--with-deps`，不改系统浏览器或共享缓存。不预填下载大小、revision、许可或成功；下载/安装/字节与许可核对另存实际结果。

## 效力限制

安装准许仅允许上述本任务依赖和组件落盘及必要构建准备，不授予 Provider/真实业务数据/凭据读取、独立版接管、MacBook安装或生产部署。正式模型与干净安装/Keynote验收另按已有停止线申请。用户本次包括固定 Chromium 下载；系统级安装或其他版本不在范围内。
