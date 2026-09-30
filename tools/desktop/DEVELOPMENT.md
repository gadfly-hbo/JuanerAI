# Xanthil Desktop 本地开发

复用已安装的 Node 26、Forge、Vite、React、Electron、DuckDB 和 Python。不要为此安装依赖或更新 lockfile。

## 启动、停止和重启

先在终端配置本机已批准的工具目录和一个独立开发目录（使用实际绝对路径）：

```sh
export JUANERAI_TOOLCHAIN_BIN="/absolute/path/to/approved/toolchain/bin"
export PATH="$JUANERAI_TOOLCHAIN_BIN:$PATH"
export JUANERAI_DESKTOP_DEV_ROOT="/absolute/path/to/new/xanthil-development"
```

在仓库根目录运行：

```sh
npm run desktop:start
```

窗口标为 **开发版**。Renderer 的安全组件/CSS 更新通过 HMR 生效；Main、Preload、配置和需要整页重载的更新，按 **Ctrl-C** 停止，再运行同一命令。终端提示要求重启时，也采用此方式。启动器只终止自己创建的进程组；不会根据进程名称清理其他程序。关闭窗口或停止不会自动恢复、重试或重复提交业务操作。

端口固定为 `127.0.0.1:5173`，已占用时启动失败，不自动换端口。保留占用该端口的其他程序，先查明原因。

## 数据和凭据

开发目录首次必须是空目录，随后用专属标记识别。`user-data`、`cache`、`logs` 和 `Projects` 独立于安装版。创建项目时选择 `Projects` 下的新目录；导入和导出路径也必须位于开发根目录内。只放入获准的合成输入，不复制原有用户项目作为测试材料。符号链接不能逃逸到外部目录。

开发版本使用独立 Keychain 服务 `com.juanerai.xanthil.development.xiaomi-token-plan-cn`，生产默认服务保持不变。它不导入生产 key，不读取 `.zcode`，也不继承环境中的模型激活或 key。模型设置界面和业务语义沿用产品；明确输入开发凭据后仍须遵守原模型调用授权。此补充的验证不调用真实 Provider。

## 检查

运行日常检查前先停止开发窗口：服务器检查使用同一个固定端口，构建检查使用同一 `.vite` 输出目录。

| 命令 | 内容 |
|---|---|
| `npm test` | 现有 canonical portable 回归、类型检查及日常 Desktop 补充；不打包 |
| `npm run desktop:test` | Desktop 确定性单元、契约、集成、组件及开发服务器/构建检查；不打包 |
| `JUANERAI_DEV_CANDIDATE=/absolute/freeze/execution-inputs.json JUANERAI_DEV_EVIDENCE=/new/absolute/evidence/run npm run desktop:test:native` | 真 Electron、正式 Main/Preload、真实本地计算、HMR、持久化和重开；目录必须尚不存在 |
| `JUANERAI_DEV_PACKAGE_EVIDENCE=/new/absolute/evidence/package node tools/desktop/development-package.mjs` | 显式构建一次当前工程包，检查 Main/Preload、CSP 和资源；不是安装/发布包 |
| `npm run desktop:test:artifact` | 保留的原生打包/模块套件；须提供其现有冻结 package readback 和各 GUI evidence 环境 |

原生补充验证先核对冻结候选的源码、合成 CSV 和编译输出身份，再运行真实 UI 和后端。文件选择器只返回合成路径；为检查在途操作，测试最多扣留真实 startAnalysis 的 IPC 响应 30 秒，计算与存储继续正常执行。探针检查未保存草稿、等待响应状态及最终报告视图经过 HMR 后保留，并核对同一命令只提交一次。它会短暂修改并恢复 Renderer 标记与 Main/Preload 注释，期间不要同时编辑源码或构建 `.vite`。另外创建开发根目录外的合成保护项目，验证真实选择器拒绝和前后文件哈希；不查找用户项目。测试结果保存在指定新目录，失败也保留。

## 验收与版本

HMR 工作区一直在变化，不能作为正式固定代码验收结果。正式验收前停止编辑，绑定完整代码、测试输入、Main/Preload 输出、Renderer/Vite 配置和运行时身份，执行所需真实路径并保留原始结果，再交独立 Validator。

安装包还需要与影响匹配的资源、运行时、签名和安装验证。多个已验收 Change 可以积累成一个稳定版本/DMG；该发布仍需其独立授权和检查。本补充不修改已交付 DMG011，也不要求重新发布它。
