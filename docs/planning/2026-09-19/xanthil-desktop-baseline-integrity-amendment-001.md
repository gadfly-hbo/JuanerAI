# PKG-XANTHIL-DESKTOP-001 — Baseline Integrity Amendment 001

## 授权与返回点

用户于 2026-09-19 明确批准：核验六个既有 Pi 0.84.2 归档；仅向隔离
candidate lock 的六个条目补齐 `integrity`；其余版本、来源、依赖关系及字段
不变，保留旧 lock；只重新审查现有依赖图，通过后继续原 P2/P3。
这不是完整性豁免、依赖升级、重新解析依赖图或新的生产实现授权。

适用原任务 `纵切-1.0`（`01a0b45a-13ad-7b92-a2b4-cdde980558e1`）及原 Change
`xanthil-desktop-membership-repurchase-decision-case`。
Mac mini 独占 `work/macbook/whitepaper-blueprint-v1`；
MacBook 仅从 `work/macbook/wip-preflight-exception-disposition` 发布本补充。
接收前预期 HEAD：`0b75194d1646b20b1c087863570009431d9e22ea`，
tree：`0da053dbc228671ea381abb4d99acdf826423e78`。

最新 Mini 停止码为 `DEPENDENCY_PREFLIGHT_BLOCKED_BASELINE_INTEGRITY`。
MacBook 已只读核对以下原件的大小/hash，未将其表述为 P1 Gate PASS：

- `source-and-execution-001/SOURCE_EXECUTION_001_EXCEPTION.md`：8842 bytes，
  SHA-256 `be9d56597476ee537bdd91b765d811eb845a700cee8035cb4f5c78c48aba05b7`。
- 同目录 `final-evidence-001.json`：24643 bytes，
  SHA-256 `0d336312b31bd8cb1f3330b913cf20aa92de3a0d38a6c896a45bbc5dabaac7f9`。

P1 已报告全图 peer/Node 26 引擎检查无冲突、精确 node-gyp 来源例外匹配；
六个 Pi 子包无归档 integrity，不能以父包 digest 替代。既有 PASS、失败历史和
工具健康结果保留；P1 完整审查、P2/P3、Spec Gate 仍未通过。

## 六个唯一目标与冻结校验值

六包作用域均为 `@earendil-works`，版本均为 `0.84.2`。
candidate lock 中的目标 key 为以下固定前缀加下表短名：

`node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/`

下列值来自官方 registry 对精确版本的 `dist.integrity`，MacBook 在
2026-09-19 只读复核全部一致；尚未代 Mini 获取/验证归档或修改 lock。

```json
{
  "pi-agent-core": "sha512-8Pn3wSCxj0cfo5I6jxQYVB/3uuQRmHhAlEclyjqpOuMEdQMIODHizRogv56FLdbU+dTiGnybeHQ2N+sV1/L2YA==",
  "pi-ai": "sha512-6MzsrYIYNVlE7SfpbL2yYb67Qo58p/7Q+xWG1RZvoX1P80aRCHSod2/13aFpxkow1lPO2LEh3c495J0Gwmyjig==",
  "pi-client": "sha512-/RFSPhD/bZbpOp1oJj+UneSUFSgZhWxzcSENUY+8+8xhoBrWXMYI2t77XNx4Yf+c8YK2qTHquForhNcelYpXvg==",
  "pi-protocol": "sha512-jbBh03fkeckWEroHpcZBr4w5/Ibat8WwdXFlXHivYQImrQNFtLpDeL0t1cku4hmK0q3pceIRQHkw4fwbM4YILQ==",
  "pi-telemetry": "sha512-wg5caea7uIv1BHRBm2Y116RvFG4oSAiP5qk9tA2463PDGIr4K8M1Ceyyg5DOpF/shUUl0gk826yQJAeAcHYB9g==",
  "pi-tui": "sha512-ds2TLihOnM5sLJB3VpXV6y0uR5efVuHf4MN7yDpsty6hA2DUO/EDVzjp/0od0G2JslzVLMjT8T8zavtxVb+qbg=="
}
```

对上表每个短名 `<name>`，唯一元数据/归档地址分别为：

- `https://registry.npmjs.org/@earendil-works%2F<name>/0.84.2`
- `https://registry.npmjs.org/@earendil-works/<name>/-/<name>-0.84.2.tgz`

后者必须与现有 lock 的 `resolved` 完全一致。仅允许上述公共 registry 精确
元数据和归档，不使用镜像、凭证、浮动版本或新的来源。核对元数据的
`name/version/dist.tarball/dist.integrity`，其他非锁定展示字段不要求字节一致。
这是同一公共 registry 信任边界下的内容校验，不另建签名服务或供应链系统。

## Mac mini 有界执行

下文相对路径以原证据根下 `dependency-preflight-001/` 为起点。
证据仍属 Mac mini，使用原持久根，不新建项目级管理系统：

`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-membership-repurchase-decision-case/mac-mini-wip-preflight-20260919-001`

1. 按随附固定发布回执核对 commit/tree/唯一 parent/五文件 diff 与 hash，在原
   Mini 分支 ff-only 接收。保全十二份现有草案并核对接收前后 bytes/hash。
   已接收同一提交则核对后跳过；未知改动、冲突、竞争写入停止，不 reset/stash/清理。
2. 核对当前 candidate `package-lock.json` 为 319128 bytes /
   `281c83b4a6774bdaca92cb73bc43fde2e09859efbe5013bcecabff9f3a35e736`；
   candidate manifest 为 808 bytes /
   `5a5e225cab86826b78afb2b94eb18a4064ab75c1115aa27dfb1342a927ed264a`。
   在本根内的 `baseline-integrity-001/` 保留旧 lock、元数据、归档与执行证据，
   不覆盖已有原件。已完成本次补全时核对其结果/回执后续接，不重写或重新消费操作。
3. 仅获取上述六包的元数据和归档；可复用能够匹配冻结 SHA-512 的已有归档。
   保留各自原件、获取地址、长度、预期/实得 SHA-512、SHA-256 及独立读回。
   先比对原始归档 SHA-512，再只读归档 manifest 的 name/version；不执行包代码、
   lifecycle、prepare 或 install，不安装 node_modules。校验不符或来源/身份变化
   即停止，不能采纳新的远端 digest、把新算 hash 当批准值，或用父包 digest 代替。
4. 六包全部校验通过后，只向当前 candidate lock 的六个指定条目新增上表
   `integrity`。使用最小补丁，不运行 npm install/update/lock 生成，不修改
   manifest、已安装包、上游 shrinkwrap、baseline 副本或仓库 lock。
   记录变更前后 bytes/hash；文本 diff 只能有六个 integrity 字段新增。
   删除新值后的 JSON 必须与变更前深度相等：652 个条目、版本、resolved、
   dependency/peer 边、已有 integrity 和其他全部字段均不变。
5. 原审查脚本的“144 个基线条目完全未变”和旧 candidate hash 断言只对上述
   六字段作本次精确授权映射；不能继续用旧 hash 拒绝已获准的结果，也不能整体
   跳过基线比较。其余 138 个基线条目保持原样；六条目移除新增字段后也与原基线
   相等。原审查结果保留，新记录明确它们是校验补全而非依赖升级。
6. 原仓库/baseline manifest 仍各为 416 bytes /
   `fa0d70f9b790b89ee6f73d50ab8e1d481170c660db84ea67512e7475d85dead0`；
   原仓库/baseline lock 仍各为 75023 bytes /
   `ec0796132be9a58ca43d1c43b518028c1d79e23884ccfb16fb5da7e89edab53f`。
   核对未变后，以补全后的 candidate 身份重新进行 P1 完整只读图审查。
   原一次 P1 npm 重跑已消费，不重跑成功的 npm 解析命令。
7. P1 Gate 实际通过后，按[整体决策 §11](xanthil-desktop-dependency-structure-decision-v1.0.md)
   进入 P2 scripts-off 安装及原 P3 校验锚/唯一 Electron 脚本例外。
   后续检查均使用已审查的新 candidate hash；P2 后核对该锁及六个 integrity
   保留且实际获取满足校验，不以“npm 接受了 lock”冒充字节校验。
   若 npm 覆盖校验值、发生额外图漂移或要求新权限，保存证据并停止，不修改
   上游包或构建另一个安装器绕过。完整 Spec Gate PASS 后才按原 P4 将已审查
   candidate manifest/lock 采纳到仓库，不提前修改产品依赖资产。

## 权限收敛与交付

本补充仅将[Source and Execution Amendment 001](xanthil-desktop-source-and-execution-amendment-001.md)
中的“六个缺失 integrity 不展开修复”、candidate 全字节不变与基线全条目不变约束，
收窄替换为上述六字段补全。此前六份冻结包/补充的字节不改，node-gyp 精确来源
例外、三轮有界执行自修正及所有其他权限保持。未知完整性、版本/来源/图漂移
不是普通执行错误，不得自行豁免。

在既有 `verification.md/traceability.md/tasks.md` 记录授权、六包校验、
六字段差异、新 lock 身份及 P1 verdict；正式产品包采纳按原 P4，不另建长期账本。
正常阶段连续推进，无需每步用户转发。正式 Spec、ponytail、Spec Gate、Test/有效 RED、
TDD_READY、Worker、回归/测试资产退休、独立 Validator 及获准 Git 交付保持原序列。
本补充发布不表示归档已经校验或 P1/Spec Gate PASS。

通过用户手动转发到原任务；MacBook 不自动派发生产角色、发消息或新建任务。
不重做 Stage 0/1、工具安装或 WIP 处置；不动 Host Loop、旧 State/pointer/pause/Ledger、
真实 Provider/真实数据。旧 Change 仍为 BLOCKED / DISPATCH_ORPHAN_READY，不是 CLOSED。
