# Xanthil 内部安装包 001

适用 Apple Silicon；本机已测 Mini macOS 26.3.1，目标 M5 / macOS 26.5.2 必须另行实机验收。该包不是公开发行、Developer ID 签名或 Apple 公证承诺。若 macOS 拦截，停止并保留提示，不删除隔离属性或关闭安全机制。

## 用户安装与合成验收

1. 将 DMG 内 Xanthil.app 复制到你可写的应用目录；不要在只读 DMG 中保存 Project。
2. 打开应用，选择专业模式，选择外部空文件夹作为 Project，例如文稿中的独立 Xanthil 项目文件夹。不把 Project 放入 Xanthil.app。替换/移动 app 不会替你迁移或删除这个外部目录。
3. 新建分析案例；使用随包 Samples/members.csv、orders.csv（均为合成数据）。映射：成员 ID=member_id、分组=member_group；订单 ID=order_id、订单成员 ID=order_member_id、时间=paid_at、金额=amount、状态=status、币种=currency。
4. 对比期 [2026-01-01,2026-01-29)，当前期 [2026-02-01,2026-03-01)，有效状态 paid。显式核对问题并选排除；重复订单按 order_id_utf8。勾选三项确认后确认快照、开始本地处理。
5. 预期两期活跃成员各 2、复购成员各 1、复购率各 1/2；复购收入分别 2000 分和 2500 分；H1 为 Rejected（不支持当前复购率更低），不是自动接受或完成。关闭后重新打开同一外部 Project，应保留同一个 Run/Finding。
6. 本地计算不需要 Homebrew、Node/npm、Python 安装、开发仓库或模型账号。模型未配置时保持真实不可用与手工路径，不会后台下载或调用 Provider。

内部包执行 ad-hoc bundle 封装并通过 `codesign --verify --deep --strict`；这只证明包封装完整，不提供 Developer ID 身份或 Apple 公证，不保证另一台 Mac 的 Gatekeeper 接受。首版包曾因缺少 bundle 资源签名而未通过此检查，MacBook Finder 也报告无法打开；旧包应保留为失败证据，不当作可安装成果。替换包仍须在目标 Mac 实际打开、计算、重开确认；出现任何拦截请记录原文并停止，不执行隔离属性删除或安全绕过。

## 工程复现（非用户安装步骤）

仅使用 supplement 已批准且核验的 Python 3.14.4+20260414 install_only 原件/安全解压结果、DuckDB 1.5.2 原件、现有 Electron ZIP 和现有项目依赖。不得用这里的说明扩大下载、安装或签名权限。

`node tools/desktop/prepare-internal-runtime.mjs ABS_VERIFIED_PYTHON_DIRECTORY ABS_VERIFIED_DUCKDB ABS_NEW_RESOURCES_DIRECTORY ABS_VERIFIED_NOTICES_DIRECTORY`

该入口不下载、不解压、不执行 runtime，先验证完整固定内容摘要，再排他创建资源目录。许可目录应包含上游原文、来源清单、Electron/Chromium notices、实际 Python build metadata 和已批准 npm/第三方许可。来源、版本及实际内容变更须重新评估，不静默更新固定摘要。

在已有批准命令局部环境中设置 JUANERAI_INTERNAL_INSTALL_RESOURCES、新的 JUANERAI_INTERNAL_INSTALL_OUTPUT、JUANERAI_ELECTRON_ZIP_DIR 和 ELECTRON_SKIP_BINARY_DOWNLOAD=1，再执行现有 Forge CLI 的 `package --platform=darwin --arch=arm64`。输出目录必须不存在；不使用默认 `desktop:package` 或 `desktop:test` 覆盖旧 out。保存源码/旧 .vite/旧 out 身份及完整命令结果。

内部构建的 postPackage 调用 `tools/desktop/seal-internal-app.cjs`，按已批准 Electron 嵌套 bundle 到顶层的顺序补齐 ad-hoc 资源封装，然后强制 strict deep 校验；任何失败阻止交付。它不使用证书或钥匙串，不新增 entitlements、不切换 hardened runtime，也不修改 Resources 中的 Python/DuckDB/app.asar。仅修复已有未封装包时，先排他复制到新任务输出，核对原件/副本一致，再执行 `node tools/desktop/seal-internal-app.cjs ABS_NEW_XANTHIL_APP`；绝不就地改历史包。

正常安装启动必须另外通过 LaunchServices/Finder 验证。直接执行包内二进制的 E2E 只证明业务回归，不替代这个入口；严格签名通过同样不等于目标机信任通过。

独立候选验证无需构建：以 JUANERAI_INSTALL_APP 指定已冻结 .app，JUANERAI_INSTALL_E2E 指定全新证据目录，执行 `node --experimental-strip-types --test tools/desktop/internal-install.e2e.test.mjs`。它使用生产 Main/Profile/Renderer，只有原生文件选择边界接合成路径，故不能冒称人工原生对话框或目标 Mac 验收。被测 app 独立 cwd、PATH=/usr/bin:/bin、专用 userData/sessionData；验证真实双引擎结果、包不变及移位 Project 重开。每次完整保留数字退出/stdout/stderr，不复用旧输出路径。
