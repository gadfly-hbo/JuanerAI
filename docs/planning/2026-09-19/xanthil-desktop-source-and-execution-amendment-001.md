# PKG-XANTHIL-DESKTOP-001 — Source and Execution Amendment 001

## 1. 用户批准与效力

用户于 2026-09-19 明确“批准”两项：下述唯一固定 Git 来源例外，以及
Mac mini 的有界执行自修正权限，并将后者固化到半自动流程。
本补充适用于原任务 `纵切-1.0`（`01a0b45a-13ad-7b92-a2b4-cdde980558e1`）、
原 Change `xanthil-desktop-membership-repurchase-decision-case`，不是新批次。

MacBook 在 `work/macbook/wip-preflight-exception-disposition` 发布文档/状态；
Mac mini 继续独占 `work/macbook/whitepaper-blueprint-v1`。双方当前基线为
`e93acbfcaf29adf112f6b8ff73668428a55d94cc`，tree
`2a9ef83dd6081e45c1f720baa4f89bc199e523e4`。该观察不是持续在线证明。

本补充仅覆盖[整体决策 §11](xanthil-desktop-dependency-structure-decision-v1.0.md)
对下述精确来源的拒绝，以及原包/补充中对符合新自修正规则的普通执行错误一律
停止回传的要求。原执行包、Routing、整体决策、Toolchain、P1 Config Retry 的
冻结字节全部保留；其他产品、UI、架构、版本、角色、Git、数据和生命周期权限不变。
开发执行自修正不改变产品 Analysis Run/Assistance Attempt 的自动重试 0 约定。

## 2. 接收的异常与当前返回点

MacBook 已通过只读访问核对 Mini 回执原文、9836 bytes 和 SHA-256
`c3cf49ef3f03858b551f32554abe39b6de3e090a676501f14b97fa57e1cba38b`。
回执为既有证据根下
`dependency-preflight-001/p1-config-retry-001/P1_CONFIG_RETRY_001_EXCEPTION.md`。

配置预检与唯一 P1 npm 重跑均退出 0，配置错误已解除；来源审查退出 74，停止于
`DEPENDENCY_PREFLIGHT_BLOCKED_NON_REGISTRY_SOURCE`。P1 图审查未通过；P2/P3、
Spec Gate 与后续未运行。一次 P1 重跑已消费，不能以本补充重启成功的 lock 生成。

现有 lock 含 652 个包条目：144 个基线条目未变、508 个新增；直接矩阵匹配。
这些事实不替代完整 peer、来源/integrity、实际许可证、脚本和兼容性审查。
基线六个 Pi 子条目缺逐条 integrity 属保留事实，不自动判定充分或展开修复。

## 3. 唯一新增来源许可

```text
@electron-forge/cli 7.11.2
 -> @electron-forge/core 7.11.2
 -> @electron/rebuild 3.7.2
 -> @electron/node-gyp 10.2.0-electron.1
```

- 仓库：`https://github.com/electron/node-gyp`。
- 唯一 commit：`06b29aafb7708acef8b3669835c8a7857ebc92d2`；不接受 tag/branch/浮动 ref 替代。
- 上游声明：`git+https://github.com/electron/node-gyp.git#06b29aafb7708acef8b3669835c8a7857ebc92d2`。
- 允许的归档：`https://codeload.github.com/electron/node-gyp/tar.gz/06b29aafb7708acef8b3669835c8a7857ebc92d2`。
- 允许复用已保全缓存；确有获准阶段安装需要时，只允许该精确来源的 HTTPS 获取，
  不开放其他 GitHub 仓库、Git/SSH 凭证、镜像、来源替换或新脚本权限。
- 原 lock 的 `git+ssh://git@github.com/electron/node-gyp.git#06b29aafb7708acef8b3669835c8a7857ebc92d2`
  是本次已知序列化形式，可保留；它不是实际 SSH 使用证据或 SSH 授权。若标准
  scripts-off 安装需要 SSH/认证或其他来源，停止返回，不手改 lock、加 overrides 或绕过。

依据：[Electron rebuild 固定声明](https://raw.githubusercontent.com/electron/rebuild/v3.7.2/package.json)
及[该提交 manifest](https://raw.githubusercontent.com/electron/node-gyp/06b29aafb7708acef8b3669835c8a7857ebc92d2/package.json)。
该包声明 MIT；缓存 manifest 的 scripts 仅 lint/test，无 install/prepare。这不等于
整个依赖图许可证/脚本审查 PASS，更不授权执行 node-gyp/native rebuild。

必须保留已发生事实：P1 的 npm 解析已自动取得上述 codeload 归档（原日志 HTTP 200），
当时超出 registry-only 下载范围。本授权只批准今后的有限使用/获取，不把历史写成
“没有越界下载”或“当时已获准”。`ignore-scripts` 禁止 lifecycle，不是下载地址沙箱。

## 4. 精确保留输入

以下文件相对于 Mini 原证据根的 `dependency-preflight-001/`。

| 输入 | bytes | SHA-256 |
|---|---:|---|
| candidate `package.json` | 808 | `5a5e225cab86826b78afb2b94eb18a4064ab75c1115aa27dfb1342a927ed264a` |
| 当前 candidate `package-lock.json` | 319128 | `281c83b4a6774bdaca92cb73bc43fde2e09859efbe5013bcecabff9f3a35e736` |
| `baseline-package.json` / 仓库 `package.json` | 各 416 | `fa0d70f9b790b89ee6f73d50ab8e1d481170c660db84ea67512e7475d85dead0` |
| `baseline-package-lock.json` / 仓库 `package-lock.json` | 各 75023 | `ec0796132be9a58ca43d1c43b518028c1d79e23884ccfb16fb5da7e89edab53f` |
| 已缓存 codeload 原归档，locator 见原 graph-review | 564012 | `f357931ae77e0e49f2044de30a75f5bb096fc76948e5baa26c29aa0fac285f31` |

原归档缓存的 SHA-512 与 lock 打包归档 integrity 对应不同字节流，分别核验，不混同。
lock 内 node-gyp integrity 保留为
`sha512-CrYo6TntjpoMO1SHjl5Pa/JoUsECNqNdB7Kx49WLQpWzPw53eEITJ2Hs9fh/ryUYDn4pxZz11StaBYBrLFJdqg==`。
图清单/归档 locator：`p1-config-retry-001/graph-review-001.json`，357164 bytes，
SHA-256 `58d9a673c546582017990f156d2d3991bf168f468cc5eb3e78062d1f66c62a02`。

## 5. 同任务续执行与自修正

1. 按随附发布回执核对固定新提交/tree/唯一 parent/文件清单/hash；只允许本补充、
   执行政策、状态机、任务包模板、规划入口、产品说明及 Controller 看板记录。
   Mini 在原分支 ff-only 接收；已接收同一提交则核对后跳过。逐份保留十二份草案并
   核对接收前后 bytes/hash；未知 tracked 改动、冲突或竞争写入停止，不 reset/stash/清理。
2. 保留 Stage 0/1、工具健康 PASS 和 WIP_DISPOSITION_COMPLETE；复用原工具 bin、
   两份独立空 npmrc、任务局部 cache 与证据根。不重新安装工具、处置 WIP 或重放旧脚本。
3. 核对第 4 节输入后，从**现有 lock 的 P1 图审查**继续。本次精确来源按已批准例外
   处理，其余来源、版本、integrity、peer、许可证/脚本等规则保持。可另写最小只读审查
   脚本识别这个精确例外，保留旧脚本/失败结果；不得整体关闭来源检查或重生成 lock。
4. 本批次显式采纳[有界执行自修正规则](../../governance/product-change-execution-policy.md#bounded-execution-self-correction)。
   每个符合条件的问题最多三轮、有进展、无未知副作用，使用已有三份阶段记录即可；
   既有同问题尝试计入，不因换文件名/session/补充包重置。上次配置修正已完成一轮，
   本次来源批准是用户边界决定，不是新的 P1 命令机会。
5. P1 完整审查通过才进入原 P2；P2 冻结 lock/scripts-off 核验后才可进入原 P3。
   P3 的 Electron 唯一有限安装入口/校验锚不扩大。符合自修正规则的工具调用错误在原
   阶段纠正；真正探针/兼容性失败、新来源/脚本/系统权限等仍返回 Controller。
6. 后续按既有 P1–P5 和原包连续推进：正式 Spec 修订、完整 ponytail、Spec Gate、
   Test/有效 RED、TDD_READY、Worker、回归/退休、独立 Validator、获准 Git 交付。
   本补充不是 P1 或 Spec Gate PASS，不以工具错误冒充有效 RED，不代替正式角色。

证据仍保存在
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`，
保留历史失败，新增结果独立读回。MacBook 已可只读访问原回执/缓存，这不是跨设备备份。
成功修正和正常阶段不要求用户逐次转发；无进展、预算耗尽或越界时回传一次集中异常。
本次通过用户手动转发至原任务，不自动发消息或创建新任务。Mini 不写项目看板。
旧 Change 仍为 `BLOCKED / DISPATCH_ORPHAN_READY`，不是 CLOSED；主机服务、旧状态、
真实 Provider/真实数据、新依赖和其他脚本许可均不变。
