# Change006 方案／原型检查记录

候选建立于2026-10-12，复核于2026-10-13；设备MacBook，分支`work/macbook/change006-metric-assets`，代码HEAD `4df7604621fff2c8ec27281d59cf4a788deae47b`。只新增本规划目录；没有生产实现、工程测试、OpenSpec、旧规范／状态修改、供应修改或Git发布。

## 已运行：范围与结果

| 检查 | 实际结果与证据范围 |
| --- | --- |
| 当前身份／现场 | 当前HEAD与本轮读取的远端main一致；从原干净规划分支正常start-work。Mini工程HEAD `308ddf70e8a7c37b654d888900d6acdb5e6b955f`及461项现场状态保留；看板DELIVERY/complete、等待新输入。只是读取时快照，不声称持续在线同步 |
| 固定供应原件 | 10份附件与`a7c08185ee1691e641011b53d5bb87374d0b5b89:path`逐字节比较、字节数／SHA-256一致。身份见[source-readback](source-readback.json)；脏示例未消费、未修改 |
| 发布包解析／指纹 | 现有Node v24.21.0＋已安装YAML解析器，只读完整解析两份固定包并调用固定纯canonical helper；各55指标、2场景、0 bindings；两包package/content指纹与index匹配。本检查不是供应CLI或消费者运行 |
| 本轮脚本语法 | `node --check clickable/assets.js`与`node --check clickable/check-memory.mjs`退出0 |
| 合成内存状态 | `node clickable/check-memory.mjs`退出0，14组断言通过：候选／批准分离、二次复用、原件不可算、篡改／冲突、配置保存失败、缺资料／歧义、项目新版不改当前、换版待重算只看旧数字且不发新回执、失败旧报告、停止／重开、下载重试、输入转义、抽屉分类／双模式切换 |
| 检查限制 | 上项是自带最小element stub驱动JS handler，**没有浏览器DOM、布局、真实焦点／键盘或计算能力证明**。修复了原型换版后未算即显示新版数字，以及重绘后的返回焦点定位；实际访问性仍需浏览器／用户检查 |
| 新材料引用／空白 | 本轮自编文件使用相对路径，引用存在检查；逐行行尾空白扫描单独覆盖未跟踪文件。`git diff --check`退出0仅覆盖tracked差异，不能冒充新增文件已检查；固定供应原件不为lint重写 |

可重放的合成检查仅在[check-memory.mjs](clickable/check-memory.mjs)，不加入生产测试／CI，不调用网络、模型、业务计算、持久Store或真实下载。

## 未运行／未取得

- **真实浏览器／截图／视口检查：NOT_RUN。** CUA尝试本地`file://`时被URL安全策略拒绝（只允许http/https）。没有启服务、代理或换浏览器绕过。可点击文件交用户离线打开；不能据静态检查宣称1440／1366／窄屏或键盘体验已PASS。
- **实际SAP消费者、IR增量、计算／核验／存储／回执对账：NOT_IMPLEMENTED / NOT_RUN。** 005既有交付证据被引用而未重跑；供应原件完整性不证明006闭包可计算。正向Demo仍标D1待供应发布的合成占位。
- **Provider、真实资料、部署／安装、Git发布／Mini派发：NOT_AUTHORIZED / NOT_RUN。** 有效旧配置不等于本轮新执行许可。
- **新增用户产品／UI Gate：PENDING。** 旧005有效接受保留；本轮新增行为尚待用户。
- **独立产品计划就绪审查：待新鲜只读Reviewer。** 依据候选清单和[review brief](reviews/review-brief-001.md)评估；D1–D3及缺少正向固定附件明确保留，不把审查或静态可行性当冻结／工程就绪。

## 当前返回点

本轮提交给用户的是方案、增量UI和最少决定，不是开工。需关闭D1供应修正与固定附件、D2Owner／批准语义；D3实际许可和体验目标在适用检查／试用前集中关闭。任何承重材料修订按既有规则新鲜复审；不改旧NEEDS/PASS或工程现场。
