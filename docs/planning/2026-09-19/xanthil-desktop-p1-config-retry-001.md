# PKG-XANTHIL-DESKTOP-001 — P1 Config Retry 001

## 授权与已确认事实

用户于 2026-09-19 明确“授权”：使用两个不同的任务局部空 npm 配置文件；核对并保留现有 candidate、lock 和失败证据；先做不安装依赖的配置预检，再仅重跑一次原 P1。成功后按原包继续，失败停止回传。MacBook 只发布本补充，Mac mini 原任务 `纵切-1.0`（`01a0b45a-13ad-7b92-a2b4-cdde980558e1`）执行，不创建新任务或 Change。

唯一 Change 为 `xanthil-desktop-membership-repurchase-decision-case`，Mini 独占分支仍为 `work/macbook/whitepaper-blueprint-v1`。接收前 HEAD 为 `ebbd16bc9f883a914b8b91f0d31947d11e0ef3fe`，tree 为 `850d61e34d83158ac34ae0e59b30ca7a41c6719e`；本补充以手动交接的固定新提交 ff-only 接收，接收前后十二份当前草案 bytes/hash 不变。

已核验回执 `TOOLCHAIN_001_P1_EXCEPTION-20260919T024300Z.md`：10,941 bytes，SHA-256 `263d11faa9e0c9ca14ff44802298412984336b393644b2f5495c788c10cfa076`。四工具准备/独立读回 PASS 与 P1 `DEPENDENCY_PREFLIGHT_BLOCKED_P1` 分别保留。原 P1 把 user/global 配置都指向 `/dev/null`，npm 在配置解析时拒绝重复来源，退出 1（审计脚本 51）；不是依赖兼容性失败或有效 RED。正式 Spec 已停止且未改文件；仅三份阶段记录更新，其他草案保留。

沿用[整体决策包第 11 节 P1–P5](xanthil-desktop-dependency-structure-decision-v1.0.md)、[Toolchain Amendment 001](xanthil-desktop-toolchain-amendment-001.md)及[原执行包](xanthil-desktop-first-product-change-execution-package-v1.0.md)。本补充不更改依赖版本、registry、安装脚本权限、产品合同、角色或 Gate，也不授权重装工具和重新处置 WIP。

## 最小修正与一次执行

下列相对路径均在既有证据根的 `dependency-preflight-001/` 下，不是仓库根或旧自动执行库。

1. 核对固定接收提交、设备、分支、无竞争写入和原工具健康记录；不要求清空已知十二份草案。保留原 `p1-candidate-001.mjs`、transcript 和 baseline 副本，不改写、删除或重跑该脚本：它含 `fresh-candidate` 检查和初始化写入，已不适用于现存候选。
2. 先核对下表身份；在新 `p1-config-retry-001/` 内以不覆盖方式保留 candidate manifest/lock 的重跑前副本、此次命令源与输出。不重新生成、重置或复制 baseline 覆盖当前 candidate。未知内容、既有重跑完成标记或无法确认是否已消费此次机会时停止，不重复执行。
3. 仅新增 `p1-config-retry-001/user.empty.npmrc` 和 `p1-config-retry-001/global.empty.npmrc` 两个不同绝对路径的普通零字节文件（非符号链接）；同名文件存在时只可核对后复用，非空或异常则停止。只在命令环境分别设置 `NPM_CONFIG_USERCONFIG`、`NPM_CONFIG_GLOBALCONFIG`；不改真实用户/全局 npm 配置。
4. 复用已通过的工具 `bin`、原隔离 cwd、显式清洁环境、公共 registry、任务局部 cache、`NPM_CONFIG_FETCH_RETRIES=0` 和原 180,000 ms 命令超时。关闭 update notifier；不引入其他配置、凭证、源或权限。先运行下列只读配置预检，须退出 0，两个路径各自匹配，registry 为 `https://registry.npmjs.org/`，ignore-scripts=true、audit=false、fund=false、fetch-retries=0；只记录这些非敏感字段，不导出完整配置。

   ```text
   npm --ignore-scripts --no-audit --no-fund config get userconfig globalconfig registry ignore-scripts audit fund fetch-retries
   ```

5. 配置预检通过后，仅执行一次下列原 P1 命令。此步明确允许 npm 更新该隔离目录的 candidate `package-lock.json` 并写入原任务局部 npm cache；不得修改仓库 manifest/lock、安装 node_modules、执行 lifecycle 或事先覆盖 candidate。新命令证据使用本次接收后的 HEAD 校验，不能沿用旧脚本中固定的旧 HEAD。

   ```text
   npm install --package-lock-only --ignore-scripts --no-audit --no-fund
   ```

6. 保存退出码、stdout/stderr、执行前后 candidate bytes/hash；核对 candidate manifest、baseline 副本和仓库 manifest/lock 未变、无 node_modules。失败/超时/未知副作用停止，保留输出，不追加重试。成功只表示新 lock 可供审查；按原 P1 对完整图、来源、许可证、peer 和既有依赖变动审查通过，才可进入 P2。后续继续原 P1–P5 和正式 Spec/ponytail/Spec Gate/有效 RED/Worker/回归退休/独立 Validator；不以本授权替代任何 Gate。

## 重跑前身份

| 文件 | bytes | SHA-256 |
|---|---:|---|
| candidate `package.json` | 808 | `5a5e225cab86826b78afb2b94eb18a4064ab75c1115aa27dfb1342a927ed264a` |
| candidate `package-lock.json` | 75023 | `ec0796132be9a58ca43d1c43b518028c1d79e23884ccfb16fb5da7e89edab53f` |
| `baseline-package.json` 及仓库 `package.json` | 416 | `fa0d70f9b790b89ee6f73d50ab8e1d481170c660db84ea67512e7475d85dead0` |
| `baseline-package-lock.json` 及仓库 `package-lock.json` | 75023 | `ec0796132be9a58ca43d1c43b518028c1d79e23884ccfb16fb5da7e89edab53f` |

MacBook 已只读核对当前身份及上述哈希；不是持续在线保证。MacBook 用 Node 26.0.0 / npm 11.12.1 和两个独立零字节文件实测上述配置预检退出 0、七字段匹配，没有运行 install 或联网依赖解析；这不替代 Mini 的现场检查或 P1。

## 保留边界

在既有 `verification.md`、`traceability.md`、`tasks.md` 登记此授权和准确结果，原始证据仍放同一持久根并独立读回。一次有限重跑成功后按原包连续推进正常阶段，不要求用户逐阶段转发；失败只回传一次明确异常，不扩修。Stage 0/1、已验收工具健康和 WIP_DISPOSITION_COMPLETE 不重做。旧 Change 不是 CLOSED；真实 Provider/真实数据/主机服务/旧状态和新的依赖或脚本例外仍未授权。当前发布只证明指令已保存，不代表重跑已执行或通过。
