# 本地离线交接包收据 v0.1 · 未发送

产品输入：`BUI-20261015-PI-v0.1`，批准对象`BUI-20261015-004`。此为ZIP生成后的外置收据，不在该ZIP内部，避免自引用；需用户今后决定转发时与ZIP／SHA sidecar／启动词一并提供。本收据不证明Mini收到或采用。

## 1. 可交付文件与固定身份

本机目录：`/Users/huangbo/JuanerAI-artifacts/browser-workbench-ui-plan/freeze-v0.1/`。

| 文件／清单 | Byte length | SHA-256 |
|---|---:|---|
| `JuanerAI-BUI-20261015-Product-Input-v0.1.zip` | 13590596 | `e30a1b4456a561cee8b455c21527f91440e322a39c781c0e0dea51be1d676630` |
| `PACKAGE-MANIFEST.json`（包根，除自身外295文件） | 59616 | `8e63180d8a9610da89ac718b3ea87660543934a2c61441c3a755f5e581102ce8` |
| `handoff/freeze-manifest-v0.1.json`（repository产品目录，44文件） | 10234 | `019113a95d089f756c6d2573f9660287a70f8d7ac013fd90367d2bba49c4bf9f` |
| `reviews/candidate-004.json`（批准原26文件） | 4408 | `2a169062cacc2c0ff2ec83a4c0c1ad75cddea3a0f268ec4529c6021f32a85fcc` |

同目录`JuanerAI-BUI-20261015-Product-Input-v0.1.zip.sha256`为标准校验文件。包顶层为`BUI-20261015-PI-v0.1/`；包含OPEN_FIRST、repository、evidence及PACKAGE-MANIFEST。105份本批仓库／规则／旧合同参考文件，189份此前原始证据／固定源历史及OPEN_FIRST构成295项payload；连manifest总296文件。参考集合不是完整Git仓库／全部外链快照，缺失外部材料不可补猜。

## 2. 本机实际检查与回读

| 检查 | 结果与限制 |
|---|---|
| 冻结前004逐项检查 | 26文件bytes／SHA全部匹配，原文／原型未改 |
| 扩展冻结清单回读 | 44文件全部匹配，含新批准／交接与规划索引；清单自身及本外置收据明确不自指 |
| staging包内逐项检查 | 295项payload全部匹配 |
| ZIP压缩完整性 | 原生`unzip -tq`通过，非产品验证 |
| 独立解压后逐项回读 | payload295、freeze44、approved004原26全部匹配；总296文件，无未声明额外文件／符号链接 |
| 凭据／依赖／业务状态 | 未复制.git、node_modules、密钥、真实业务数据库或运行数据；参考和证据为本任务既有合成材料 |
| 本轮产品检查 | 没有重跑产品／Provider／真实计算；旧原型27 PASS为先前具名证据，未提升为工程或实现产品接受 |

回读根：`freeze-v0.1/readback/BUI-20261015-PI-v0.1/`；实际日志`freeze-v0.1/extracted-readback-v0.1.log`。staging与解压副本均位于上述MacBook持续根，是本地取证，不是Mini或跨设备备份。

## 3. 设备、Git与接收状态

- 发送方：MacBook；文稿工作树`/Users/huangbo/.codex/worktrees/browser-ui-plan/JuanerAI`；分支`work/macbook/browser-workbench-ui-plan`。
- 写作基线HEAD `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`，tree `391d9c5137ec99c1946f34f33ed1361e641c9510`；冻结文稿和索引为已标识的本地改动，不属于该HEAD已提交内容。
- 本轮写集合：产品目录新增批准／handoff文件，`docs/planning/README.md`新增冻结导航；另在既有证据根准备本地包。没有产品代码／OpenSpec／配置／依赖／工程控制板变更。
- **未提交、未推送、未建PR、未合并、未同步main、未部署。** 用户产品／UI通过不提供这些授权。
- **未发送给Mini；Mini到达／路径／可读／hash核验／现场／接收／采用均UNKNOWN；Engineering Intake和开发未开始。** 不曾向Mini发送消息、恢复任务、操作其工作树或服务。
- MacBook试用a95f与保留历史分支未切换；本次不操作其服务。旧原型服务的既有运行回执是历史试用说明，不作为Mini的URL或产品实际版本。

## 4. 用户今后决定转发时

提供此ZIP、SHA sidecar、本外置收据及[只读启动词](mini-start-prompt-readonly-v0.1.md)。Mini实际到达的路径由接收方填写，不替其编造。仅返回[工程交接§6](engineering-handoff-v0.1.md)规定的只读回执后停住；缺材料或校验不符就列明，不抓取MacBook、复制WIP、降级旧本地main、开发或恢复旧任务。

普通共享分支交接仍遵守Git工作流，需要另外获得正式发布／分支移交授权。本次离线包不是绕过未获授权的Git操作，也不据此宣称规范已发布或Mini已采用。
