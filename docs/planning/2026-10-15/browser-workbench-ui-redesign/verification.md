# 本次检查与证据边界

任务 BUI-20261015，MacBook。本记录只评价候选产品文稿与合成UI，不评价生产代码／产品接受。

## 已执行

- 代码基线只读核对：规则发布 `187c356625260d84ca58bc1f5741e081e89662cd` 是写作基线 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d` 的祖先；两者 apps/packages/adapters 无diff。新工作树起点clean；写入仅本规划目录。旧试用和历史工作树不切换。
- 附件十文件／原zip本地保留；zip身份独立回读；来源自报46项PASS未继承。
- `node --check clickable/model.js`、`prototype.js`：通过。
- `node clickable/check.mjs`：首轮23 PASS／0 FAIL；评审修正后**26 PASS／0 FAIL**，保留新反例RED与GREEN。包括稳定行引用、任务隔离、文本身份、来源变化、改写过期、失败保留草稿、确认失效／无变化保持、partial限定、只读与UNKNOWN，以及脏稿并发保留、未执行任务无结果、表达来源。仅原型模型测试，不是生产测试。
- 复用本机已有缓存 Playwright CLI＋Chrome，具名隔离session `bui-20261015`；无安装／升级，未操作原产品浏览器tab。仅访问新原型loopback页面，不读取或上传原附件到远端，不绕过原附件文件协议的工具拒绝。
- 浏览器实点：结果行勾选／倒序／引用；同任务草稿保留与跨任务隔离；来源更新阻止过期引用发送；报告确认→切页保持→编辑禁确认→失败保留草稿→保存后旧确认失效；另一端保存后旧建议不可应用；六个专业阶段均有实际不同页面。
- 布局截图：1440、1280、1024、768、390宽；后四宽检查整页scrollWidth不超过viewport。窄屏检查器Esc关闭并返回焦点；390可访问专业报告。
- 首轮独立只读评审为NEEDS_CLARIFICATION，发现三处原型与文字合同矛盾；原候选27文件已完整保全、散列回读通过，见[历史评审](reviews/review-001.md)。修正后的浏览器实点通过：本地未保存稿／另一端新稿并列与保留用于重新编辑；USER手改与采用建议来源可见；会员草稿在数据／依据／检查器／专业数据准备无销售结果或可选行。新候选须fresh评审，不把首轮23项通过当独立PASS。
- [候选002的fresh开发就绪评审为PASS](reviews/review-002.md)，只指固定26文件的产品计划，不是用户UI Gate。003仅校正错误研究编号对应与合成下载摘要标注，产品范围／状态／权限／验收要求未改；复用002就绪结论并对两项非实质勘误定向回读。各候选和旧结论分别保留。
- 003定向回读通过。实际合成摘要下载已检查额外发现／partial限定／非完整副本标识，原件`synthetic-summary-partial-003.txt`；另发现仅纳入发现时会把未修改的解释误标USER手改。004只校正这一原型来源归因：文字不变则保留原解释来源；保留`origin-only-finding-RED-004.log`，新增一项反例后最终**27 PASS／0 FAIL**（`contract-check-final-004.log`）。这不是产品代码修复或新产品语义，最终仍做定向身份回读。

## 原始证据

持续根：`/Users/huangbo/JuanerAI-artifacts/browser-workbench-ui-plan/`，设备MacBook；不是Mini或跨设备备份。

- `contract-check-001.log`：完整23项原型测试输出。
- `browser-rows-001.log`、`browser-report-001.log`、`browser-suggestion-001.log`、`browser-context-001.log`、`browser-six-stages-001.log`、`browser-responsive-001.log`、`browser-keyboard-001.log`：实际CLI命令及结果／断言。
- `review-corrections-RED-002.log`、`review-corrections-GREEN-003.log`、`browser-corrections-B1-002.log`、`browser-corrections-B2-002.log`、`browser-corrections-B3-002.log`：评审后原型反例及修正；这是原型检查，不是产品工程RED/GREEN。
- `output/playwright/01-home-1440.png` 至 `12-professional-390.png`：逐场景截图；首页、对话、报告与390窄屏已人工视图检查。其它自动截图存在，不将所有细节宣称视觉无缺陷。
- `13-conflict-preserves-draft-002.png`、`14-expression-provenance-002.png`、`15-unexecuted-task-isolation-002.png`：修正版并发面、来源和无结果隔离；此前截图按原候选历史理解，不冒充修正版逐像素结果。
- 修正版最终重新核对1440／1280／1024／768／390报告均无整页横溢，见`browser-final-responsive-002.log`与`16-final-report-390-002.png`；最终模型回归`contract-check-final-002.log`26 PASS。新原型主文字token对比度独立算术核对为5.86–9.95，主按钮6.77，不等于完整WCAG通过。
- 首次console中仅有favicon.ico 404；添加data favicon后新加载复核：pageerror／console error为0，只请求本原型的HTML/CSS/两份JS。一次旧element ref点击失败，更新snapshot后重试成功，不属于产品失败。旧console／失败历史不删除。
- 新原型HTTP检查：正常页面200；非精确loopback Host为403；allowlist外参考附件路径404。未将旧附件HTML转为服务来绕过其file协议限制。
- 最终源／证据文件散列清单随评审候选记录，失败及后续修正分别保留。

## 未验证与已知原型缺口

未执行真实产品回归／后端／持久化／权限／Provider／计算核验／真实导出／跨设备／Mini现场；没有产品接受。没有运行canonical全量验证，因为未改产品／测试／依赖，且本次无工程开发授权。未验证Safari／Firefox、真实file协议自动化、所有键盘路径、200%缩放或完整WCAG审计；文件可供用户手动打开，自动化只测允许的HTTP新原型。

原型合成数据与任务状态仅在内存，刷新重置；不是生产恢复方案。复杂上传、Skill／Prompt／资产维护／协作／正式评审仅能点击查看能力合同，不能真实提交；其有效旧批准合同复用，不标新功能接通。原型全页滚动未验证未来产品要求的独立区域长内容滚动、编辑焦点在每种重绘下恢复；本期文字Contract要求保留，后续真实实现必须验收。选区支持浏览器原生选取及显式“引用此段”，未自动测试所有鼠标／键盘选区组合。引用授权撤回与真实跨端冲突只定义产品语义，原型不能证明真实防护。

## 预览隔离与操作

新原型服务：`http://127.0.0.1:61619/`（检查时），只读列举本原型脚本／样式／三份文稿，不暴露仓库、附件、产品API／密钥。独立Node进程，内存无业务数据，Host限定loopback，未停止无关服务。运行身份／PID以 [runtime-receipt.md](runtime-receipt.md) 最终回读为准。

启动（不改端口／产品环境）：在本目录运行 `node clickable/preview.mjs`，默认请求系统空闲端口，按输出URL打开。停止只在该命令终端按Ctrl+C，或核对runtime-receipt记录的本任务PID／命令后停止；不要用产品的web:stop或模糊pkill。也可直接由用户浏览器打开`clickable/index.html`，无需本服务；file协议未自动测。

当前产品试用服务仍是另一个端口／目录；本稿不是新产品运行版，不据此声称用户产品／UI验收或Mini采用。
