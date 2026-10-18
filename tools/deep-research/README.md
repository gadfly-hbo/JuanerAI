# deep-research 固定随包构建

固定源 3a3f8c3a910460423a8b7a2638655a100a2aa8e6，原200文件摘要见 source-identity.json。原业务不补丁；编译时的已批准 UI 接缝写入输出 ui-transforms.json。当前工程结果与权限见 openspec/changes/archive/2026-10-18-deep-research-integration/verification.md。

1. 在本任务隔离目录准备 source-identity.json 所列源码，按原 lock 使用 npm ci --ignore-scripts；不运行原 CLI。依赖获取与 Provider 权限不同。
2. 由 mcp-identity.json 固定的40个 wheel 离线安装到新 site-packages，禁止生命周期脚本与运行时 uvx。所列平台为 macOS arm64/Python 3.14。wheel 官方摘要核验记录位于本任务证据根；升级必须重做固定身份和兼容检查。
3. 显式设置 DR_MCP_SITE_PACKAGES、DR_NODE_FILE、DR_NODE_LICENSE、DR_NPM_CLI，运行 `node tools/deep-research/build-bundle.mjs VERIFIED_SOURCE NEW_OUTPUT`。原 TypeScript/React UI 编译、生产依赖、Node、MCP、通知原件、宿主监听装配进入文件清单。未知源字节、旧输出、坏依赖拒绝；不修改原源。
4. `node tools/deep-research/stage-bundle.mjs ABS_BUNDLE MANIFEST_SHA256 ABS_NEW_RESOURCES` 复制并独立校验固定包，生成 deep-research-deployment.json。该资源树与现有已验证工具链资源合成后，Forge 可用 JUANERAI_DEEP_RESEARCH_PACKAGE=1、JUANERAI_INTERNAL_INSTALL_RESOURCES、JUANERAI_INTERNAL_INSTALL_OUTPUT 打包既有浏览器服务入口。保留其他批准模块时同时传各自构建开关。Python 必须来自宿主随包工具链，不能要求用户安装开发环境。

本任务已验证资源树搬迁、完整包进程与 installed-entry 的实际 Vite 资源构建；未制作／安装完整新.app、未验证干净机或其他架构。总体再分发许可审查尚未宣称完成。当前默认拒绝真实 Provider，已批准的凭据只可由后端明确传入白名单环境；不读取独立版秘密。

焦点检查必须设置 DR_PROGRAM_ROOT、DR_BUNDLE_ROOT、DR_MCP_SITE_PACKAGES、DR_PYTHON 后运行 `node --test tests/integration/deep-research/*.test.mjs`。正式记录不得将缺物料 SKIP 当通过。宿主全量入口 tools/harness/validation/run --portable 另需命令局部工具链和新 JUANERAI_TEST_EVIDENCE_DIR；两套证据各自列明。
