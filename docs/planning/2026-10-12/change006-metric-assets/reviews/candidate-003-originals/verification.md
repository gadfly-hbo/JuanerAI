# Change006 方案／原型检查记录

候选建立于2026-10-12，复核于2026-10-13；设备MacBook，分支`work/macbook/change006-metric-assets`，代码HEAD `4df7604621fff2c8ec27281d59cf4a788deae47b`。只新增本规划目录；没有生产实现、工程测试、OpenSpec、旧规范／状态修改、供应修改或Git发布。本次已接收@1.1.0／@1.1.1，当前状态见末节，旧审查结论不回写。

## 已运行：范围与结果

| 检查 | 实际结果与证据范围 |
| --- | --- |
| 当前身份／现场 | 当前HEAD与本轮读取的远端main一致；从原干净规划分支正常start-work。Mini工程HEAD `308ddf70e8a7c37b654d888900d6acdb5e6b955f`及461项现场状态保留；看板DELIVERY/complete、等待新输入。只是读取时快照，不声称持续在线同步 |
| 固定供应原件 | 11份附件与`a7c08185ee1691e641011b53d5bb87374d0b5b89:path`逐字节比较、字节数／SHA-256一致。首轮10份，复审前补齐同一固定提交的`src/schema/mapping.ts`，供应Binding草案仅供形状／参考，仍不能取代当前数据绑定。身份见[source-readback](source-readback.json)；脏示例未消费、未修改 |
| 发布包解析／指纹 | 现有Node v24.21.0＋已安装YAML解析器，只读完整解析两份固定包并调用固定纯canonical helper；各55指标、2场景、0 bindings；两包package/content指纹与index匹配。本检查不是供应CLI或消费者运行 |
| 本轮脚本语法 | `node --check clickable/assets.js`与`node --check clickable/check-memory.mjs`退出0 |
| 合成内存状态 | `node clickable/check-memory.mjs`退出0，修订候选16组断言通过（首轮14组保留）：候选／批准分离、二次复用、原件不可算、篡改／冲突、配置保存失败、缺资料／歧义、项目新版不改当前、换版待重算只看旧数字且不发新回执、仅本任务换版不改下一任务默认、合格零分母受限报告、失败旧报告、停止／重开、下载重试、输入转义、抽屉分类／双模式切换 |
| 检查限制 | 上项是自带最小element stub驱动JS handler，**没有浏览器DOM、布局、真实焦点／键盘或计算能力证明**。修复了原型换版后未算即显示新版数字，以及重绘后的返回焦点定位；实际访问性仍需浏览器／用户检查 |
| 新材料引用／空白 | 本轮自编文件使用相对路径，引用存在检查；逐行行尾空白扫描单独覆盖未跟踪文件。`git diff --check`退出0仅覆盖tracked差异，不能冒充新增文件已检查；固定供应原件不为lint重写 |

可重放的合成检查仅在[check-memory.mjs](clickable/check-memory.mjs)，不加入生产测试／CI，不调用网络、模型、业务计算、持久Store或真实下载。

## 未运行／未取得

- **真实浏览器／截图／视口检查：NOT_RUN。** CUA尝试本地`file://`时被URL安全策略拒绝（只允许http/https）。没有启服务、代理或换浏览器绕过。可点击文件交用户离线打开；不能据静态检查宣称1440／1366／窄屏或键盘体验已PASS。
- **实际SAP消费者、IR增量、计算／核验／存储／回执对账：NOT_IMPLEMENTED / NOT_RUN。** 005既有交付证据被引用而未重跑；本次所选新供应闭包定义自洽不证明006执行已接通。正向Demo已绑定已发布精确身份，行为仍为合成内存演示。
- **Provider、真实资料、部署／安装、Git发布／Mini派发：NOT_AUTHORIZED / NOT_RUN。** 有效旧配置不等于本轮新执行许可。
- **新增用户产品／UI Gate：PENDING。** 旧005有效接受保留；本轮新增行为尚待用户。
- **历史独立产品计划就绪审查：[001](reviews/development-readiness-001.md)／[002](reviews/development-readiness-002.md)均为NEEDS_CLARIFICATION，保留。** 002时D1实际附件及选择未齐；现在D1～D3已采用、新正向附件已到，进入003新鲜复审，不能自动给PASS。未冻结或宣称工程就绪。

001候选清单保留；被修订的7份文件原字节存于`reviews/candidate-001-originals/`，其余001文件保持不变。历史副本按原逻辑路径解释引用，仅为审查溯源，不是第二份有效产品方案或可点击入口。

002审查后最初仅补记检查结论，随后记录D1～D3采用，再接收新供应版本。002被更新的verification、proposal、static-feasibility、UI Contract、clickable/assets.js与index原字节保存在`reviews/candidate-002-originals/`对应原逻辑路径；其余002文件保持不变。002候选仍可逐字节恢复，旧11项供应附件未改；003使用新的固定候选，不以新副本冒充旧审查。

## 本次接收实际检查（2026-10-13）

- 固定供应commit/tree、远端main、PR #1合并和PR/main CI元数据已只读核对，结果见[publication-readback](checks/publication-readback.json)。未fetch／切换／同步工作树。
- [只读诊断](checks/verify-supplier-release.mjs)退出0：7新原件逐字节与固定Git对象相同；两包原始SHA、blob、双指纹与登记相符；所选六指标依赖自包含无环；完整5处差异中唯一业务差异是退款金额归属。11旧附件、两旧发布物及原登记条目保留。结果见[新接收清单](supplier-release-readback-2026-10-13.json)。完整供应schema／测试／release CLI未重跑。
- 已安装Node v24.21.0；本工作树不能resolve yaml（环境检查退出1），明确使用供应仓已安装的`node_modules/yaml/dist/index.js`只做解析，不安装／写入。重放命令：`node checks/verify-supplier-release.mjs /Users/huangbo/Dev/Projects/metric-factory/node_modules/yaml/dist/index.js /Users/huangbo/Dev/Projects/metric-factory`（在本Change规划根目录）。
- [两次合成源oracle负向探查](checks/probe-supplier-oracle.mjs)退出0，实际漏拒绝的结果见[输出](checks/supplier-oracle-probes.json)。先前内存TypeScript接口探查遇到`ScriptTarget.ES2022`不可用而退出1，未执行业务函数；后改用Node内置类型转换，无依赖安装。该参考函数不作为消费者实现／独立核验；拒绝规则在主方案已明确。
- 原型仅调整精确发布身份、D1／D2已采用文字及56指标数量，不改变handler效果或布局。`node --check clickable/assets.js`退出0；`node clickable/check-memory.mjs`退出0、16组element-stub断言通过。浏览器／截图／真实焦点／真实读取／计算／Store／下载仍NOT_RUN。
- 供应回传49项未选的计数已据实际文件更正为50，不改供应原件；[接收结论](supplier-receipt-2026-10-13.md)区分全部结构合法与所选计算闭包。未選的commission_revenue↔take_rate环不能被批准执行。

## 当前返回点

用户已采用D1～D3且两版自洽正向发布物／登记已取得，不重复询问Owner或推荐口径。本轮固定003新候选并进行新鲜复审，审查结果另记、不改001／002。新增UI Gate仍待明确，D3真正缺失的实际许可和量化目标仍在适用检查／试用前关闭。未冻结、未Git发布、未Mini派发、未启动工程；不改工程现场或停止状态。
