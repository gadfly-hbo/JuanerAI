# PKG-XANTHIL-DESKTOP-001 — Toolchain Amendment 001

## 授权与返回点

用户于 2026-09-19 对“Mac mini 任务专用目录补齐固定版本工具、复用符合要求的现有工具，不升级全局安装、不改系统 PATH、不用 sudo；核验后按原包从 Stage 2 继续”明确回复“确认”。本补充仅兑现该项权限，不是新产品计划、Spec Gate PASS 或生产实现授权。

- Package：`PKG-XANTHIL-DESKTOP-001`；Change：`xanthil-desktop-membership-repurchase-decision-case`。
- 继续原 Mac mini 任务 `纵切-1.0`（`01a0b45a-13ad-7b92-a2b4-cdde980558e1`），不创建或迁移任务。
- Mini 独占 `work/macbook/whitepaper-blueprint-v1`；本补充接收前 HEAD 为 `10c1df3785cdfe591f20b205fcd7d8b874f9e74d`，tree 为 `bea988a7ee763e451b8921596c8538c855448291`。
- [整体决策包](xanthil-desktop-dependency-structure-decision-v1.0.md)、[原执行包](xanthil-desktop-first-product-change-execution-package-v1.0.md)及 [Routing Amendment 001](xanthil-desktop-first-product-change-routing-amendment-001.md) 的产品、角色、P1–P5、Git 和停止边界不变。原包不改写。
- 此项仅给执行协调者增加本机开发工具的有限准备权限；不增加 Desktop 产品的自动下载、工具查找、修复或安装能力。

## 已核对的异常

`DECISION_001_TOOLCHAIN_EXCEPTION-20260919T020500Z.md` 位于既有 Mini 持久证据根，10,503 bytes，SHA-256 `0c0832e043a86a04f4ed4e03bb934f47361048f734895096993362cab91fa111`。MacBook 已通过只读 SSH 读取原文、复算哈希及核对当前 HEAD；不是持续在线证明。

Stage 0/1 PASS 和决策包接收 PASS 保留；十二份未提交草案保留，协调者只更新了三份阶段记录。当前停止为 `DEPENDENCY_PREFLIGHT_BLOCKED_TOOLCHAIN`，P1–P3、新正式 Spec、Spec Gate 和后续阶段尚未开始。

默认验证入口落到了 MacBook 路径。Mini 常用工具目录中的 Node 为 `25.9.0`、npm 为 `11.12.1`、Python 为 `3.14.4`，缺 DuckDB。不能将默认路径缺失解释为有效 RED，也不能用 Node 25.9.0 代替批准的 26.0.0。

## 唯一新增写入范围

沿用既有 `mac-mini-wip-preflight-20260919-001` 证据根，在其
`dependency-preflight-001/toolchain-001/` 下保存下载原件、官方校验元数据、解压后的工具、`bin/` 入口及安装/验证输出；证据和工具不放临时目录，不加入 Git。

允许创建这些目录和文件，以及仅在新目录内为新下载的可执行文件设置用户执行位、创建指向已核验工具的明确符号链接。禁止覆盖已有文件；同名内容存在时先核对来源、哈希、版本，完全匹配则复用，无法证明或部分安装则保留并停止，不删除、重装覆盖或另开无限重试目录。

允许只读解析已知 npm/Python 入口的实际目标并使用它们。绝对路径只记录在本机部署/交接证据，不写入产品源码或共享配置。确切设备路径由本次手动转发指令提供。

禁止：sudo、brew/pip、全局 npm 安装、包管理器升级、源码编译、修改 shell rc/系统 PATH、系统目录写入、服务操作、清除 quarantine/安全属性、关闭 Gatekeeper、创建后台服务、改旧 Host Loop 或旧 State/pointer/pause/Ledger。不得修改 canonical validation runner 的版本断言或默认逻辑。

## 固定工具来源与校验

MacBook 于 2026-09-19 只读取得以下官方元数据；未在 Mini 下载或安装。

| 工具 | 处理 | 必须匹配 |
|---|---|---|
| Node | 下载官方 `node-v26.0.0-darwin-arm64.tar.gz`，解压到新工具目录 | 版本 `26.0.0`；archive SHA-256 `dcee8564c1a9342f9594dd5e52d533894dfef6b85aa771bbbb870baa3c403235` |
| DuckDB CLI | 下载官方 `duckdb_cli-osx-arm64.gz`，解压为新工具目录内的 `duckdb` | 版本 `1.5.2`；compressed bytes `16198085`；SHA-256 `c04495beb458c9f0451ee6a384d363cf14cf08276d6a6e8f1edcd2a3f7627075` |
| npm | 复用 Mini 已安装的 npm CLI，不执行 archive 内不同版本的 npm | 在新 Node 下实测 `11.12.1` |
| Python | 复用 Mini 已核验的现有 Python，不安装模块 | 本轮观测 `3.14.4`，批准下限 `>=3.9`；准备时记录实际版本 |

官方来源（允许 HTTPS 下载及对应官方资产 CDN 跳转，不上传项目文件或数据）：

- [Node archive](https://nodejs.org/dist/v26.0.0/node-v26.0.0-darwin-arm64.tar.gz)；[官方 SHASUMS256](https://nodejs.org/dist/v26.0.0/SHASUMS256.txt)。
- [DuckDB arm64 archive](https://github.com/duckdb/duckdb/releases/download/v1.5.2/duckdb_cli-osx-arm64.gz)；[官方 release 元数据](https://api.github.com/repos/duckdb/duckdb/releases/tags/v1.5.2)，release ID `308273796`、asset ID `395328598`，asset 的 `digest` 为上表固定 SHA-256。

先保存元数据并匹配固定版本/文件名/hash，再下载、比对本地 archive hash，全部匹配后才解压和执行。远端值改变不能自行更新本补充的 pin。Node archive 解压前检查路径无绝对路径、`..` 逃逸或指向目标树外的链接；DuckDB gzip 只产生该单个二进制。记录最终 URL、大小、hash、实际二进制目标/版本及命令退出码。这里使用官方 HTTPS 元数据与本补充预先固定的摘要，不宣称完成了额外的发布签名验证。

不要使用 `curl | sh`、latest、镜像替换、npx、Rosetta 或额外安装脚本。版本、来源、hash、平台、动态库或 macOS 安全检查不符即保留证据返回 Controller。

## 装配与最小验证

1. 先重新核对设备、仓库、分支及固定接收提交，保留全部十二份草案和历史失败输出。无冲突方可按手动交接的固定提交 ff-only 接收；不 reset/stash/清理/覆盖。
2. 用上述两个官方 archive 补齐 Node 和 DuckDB；在新 `bin/` 内创建四个明确入口：`node` 指向新 Node；`duckdb` 指向新 DuckDB；`npm` 指向现有 npm CLI；`python3` 指向现有 Python。现有 npm 自带依赖仍原位只读复用，不复制成第二套 npm 或使用 Node archive 的其他 npm 版本。
3. 只在当前命令/子进程环境设置 `JUANERAI_TOOLCHAIN_BIN=<本机工具根>/bin` 和 `PATH=<同一 bin>:/usr/bin:/bin`。npm 的 `env node` 必须解析到新 Node。不编辑配置文件；部署描述仍依整体决策包第 2 项生成。
4. 在这一环境独立读回四个 `--version`，并用 Node 的 `process.execPath`、`process.arch`、实际路径/hash 证明 Node 26.0.0 / arm64。用隔离合成工作目录进行 Node/Python 标准库及 DuckDB 内存 `SELECT 1` 冒烟；DuckDB 不读取用户初始化文件，不 INSTALL/LOAD 扩展、不联网、不接触业务数据。验证预算为一轮准备加一轮独立读回；失败停止，不自动降级或扩大修复。
5. 本轮新增权限只涵盖两个 archive/对应元数据及任务目录装配；npm 安装继续遵守原 P1–P5。工具健康不是有效 RED、Spec Gate、产品验收或依赖兼容性 PASS。
6. 工具健康通过后，不要求用户再逐阶段转发：在同一任务按原批准包继续正式 `juaner_spec / xhigh` 修订和 P1–P3，随后只有满足各 Gate 才进入 Test/有效 RED、Worker、回归/退休及独立 Validator。任何超范围产品/合同/权限决定仍集中返回 MacBook。

## 保全及完成条件

在既有 `verification.md`、`traceability.md`、`tasks.md` 记录本次授权、准确工具根、输入/结果身份和恢复点；不创建新管理框架。沿用同一持久证据根，保留下载原件、命令输出、版本/hash、原异常及新结果，并独立读回重要证据。

本补充的完成点是：固定工具在任务本地可用、命令局部配置通过独立检查、原 Stage 2 可恢复。MacBook 发布仅证明权限及文档可接收；Mini 尚未回传结果前，不标记工具准备成功。Stage 0/1 与 WIP_DISPOSITION_COMPLETE 不重做；旧 Change 仍为 BLOCKED / DISPATCH_ORPHAN_READY，不是 CLOSED。
