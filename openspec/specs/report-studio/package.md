# RS-PACKAGE-01：可搬移的固定资源构建

对应M06/M08/M09，工程本地候选不代表安装/分发接受。从已固定锁安装和已构建供应目录、明确Node二进制/许可、明确Playwright Chromium headless-shell目录组成资源树；不运行npm安装、下载、Provider或系统安装。

- 输出必须为本次新目录，拒绝覆盖已有目录。输入锁SHA必须符合可信配方；不打包项目data/work、用户HOME、认证或独立版会话。只纳入明确dist、web-dist、assets、package/lock、node_modules及运行资源。npm的.bin开发命令链接和安装私有.lock不作为运行资源。
- 使用固定版本Chromium headless shell满足默认headless预览/PDF，不纳入用户Chrome/Profile、Playwright.links或带签名framework软链的可视Chrome app。不新增浏览器自动下载；使用同批1.63.0 revision1243。
- 输出包含Node、完整依赖和其附带许可证、浏览器附带许可证，另生成依赖许可元数据索引和来源标识；缺少明确许可/通知的项保留待核实，索引存在不等于再分发审查通过。首版使用系统中文字体，不新增打包字体。
- 所有普通资源逐文件大小/SHA256及角色进入闭合清单，拒绝软链/特殊文件。manifest自身SHA由宿主构建配方固定；16MiB私有解析限额容纳完整依赖树，不放宽身份/完整性检查。候选移到不同绝对路径后，使用随包Node启动供应服务、打开页面/渲染PDF不得依赖开发目录/系统Node/预装浏览器。
- 本步骤只是资源构建与离线可搬移验证。安装载体、双机干净环境、签名/实际发布及用户接受保持独立未验证项。

## RS-BUNDLE-02 / RS-INSTALL-01：固定助手与浏览器载体

- 正式模块版本0.1.0-juanerai.1清单必须包含bin/report-studio-keychain；构建前固定本模块助手路径、可执行普通文件和SHA，复制后再核对。缺失/错hash不得先创建输出；构建和校验不执行助手或读取Keychain。
- 任务内安装载体使用原Electron Forge离线机制，将条件Main固定为已批准browser/service的原生启动器，包含当前完整静态前端、方法资源和文档读取器。默认旧Desktop构建不变；没有新完整Desktop UI或通用插件平台。
- 显式验证既有2.0工具链资源及固定Studio包再复制至新候选目录，不安装或覆盖应用；包内descriptor以相对路径定位资源。无现成独立仓库/系统Node/Chromium缓存也应具备运行资源，实际干净机结论须另验。
- 安装数据使用JuanerAI/Workbench独立标记；开发标记、无关非空根、链接或未知身份拒绝。程序、开发、独立版工作数据不混用，不迁移/删除旧目录。
- 生产helper编译和ad-hoc seal只作用本任务新候选；已有签名约束保留，禁止自动选Keychain签名身份/改安全策略。真正安装、原生启动、真实凭据/Provider、两机编辑验收仍待单独权限和实际证据。
