# A/B/C 有界验收结果 003（部分通过，图片失败停止）

2026-10-16。用户批准A/B/C、任务范围消费且无产品金额硬上限，密钥由用户在内置界面输入；不部署、不发布Git。源分支与HEAD保持`work/mac-mini/report-studio-integration` / `1446276011917ec46b369eadaed40c059db46b34`。产品代码、SDK、依赖与锁文件本轮未改；仍为native-004。

证据根：Mini `/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/acceptance-003/`；MacBook本轮 `/Users/huangbo/JuanerAI-artifacts/report-studio-acceptance-20261016/`。具名非敏感MacBook证据与三格式输出已复制回Mini并独立核对；不包含密钥、Mini数据根或独立版材料。

## 实际结果

| 范围 | 已取得证据 | 限制 |
|---|---|---|
| A 主模型配置/框架/制作 | 用户自行保存MiniMax，页面显示配置已保存；正常UI创建`proj_ca911e33`，固定两份合成材料、MiniMax具名端点和用途许可；一次框架请求、一次框架确认完成两页制作 | 不读密钥输入框或其他工具认证；配置面仍保留“连接未验证”标签，不改成虚构配置探针PASS |
| A 本地三格式 | 正常成果UI分别保存`exp_001/002/003`，PPTX116541字节、HTML5618字节、PDF157137字节；副本与元数据hash一致。PPTX独立ZIP核对2页、1原生表格、1原生图表，图表100/120/135，内嵌工作簿`A1:B4`有效 | 模型自称QA和视觉通过不等于作者实测质量；完整三格式等价、真实生成报告Keynote再编辑未验。CUA两次下载事件等待超时保留，保存副本已确认，浏览器磁盘下载回执UNKNOWN；没有重复生成PPTX导出 |
| A 图片理解 | 唯一一次显式“理解图片”实际返回409 `RS_IMAGE_UNDERSTANDING_UNCONFIRMED`；审计`CONFIGURATION_CHANGED`，页面UNKNOWN，原图片仍待理解 | FAIL。停止新增模型请求，未重试、未退款、未自动新项目或切模型 |
| A 明确核对 | 一次“核对运行状态”后实际stopped，历史未知保留；核对与后续三个本地导出没有增加模型调用 | 不是原计划的“正常在途退出选择”场景；该项仍NOT_RUN |
| A 定向修改 | 未执行 | 因图片失败停止线保留NOT_RUN，次数未消耗，不声称通过 |
| B MiMo及真实主备链 | 未执行，也未请求用户输入MiMo密钥 | 原批准继续有效；不为绕过A的UNKNOWN偷偷切备模型。真实MiMo/主备NOT_RUN |
| C MacBook | 固定压缩包SHA与Mini相同；全22710模块文件、9关键资源/签名通过；包内Node/Chromium实际生成三格式/PNG、PPTX内嵌范围独立回读通过；精确路径app启动与data marker、端口就绪；用户退出后自有进程及59410端口结束；独立仓库HEAD与28个WIP哈希未变 | 用户回复“已完成”，但约定Keynote编辑文件未找到。明确告知后用户决定“macbook后续用在实际产品中体验即可，授权通过验证”，本轮C按用户接受结论通过；没有把缺失原生编辑/逐项UI证据补造为工程实测PASS，见macbook-manual-acceptance-003.md |

## 图片失败因果证据

实际安装代码`dist/agent/builtin-image-purpose.js`把图片purpose的模型从主模型复制后改`maxOutputTokens:2048`；`builtin-hosts.ts`提供的transport仍由完整主模型（32768）构建。固定SDK0.4.1 `createPiTransport`逐字段检查`request.model`与其绑定模型完全一致，因此在进入fetch之前拒绝`CONFIGURATION_CHANGED`。

`A-image-configuration-probe-001.mjs/json`使用实际已安装purpose及实际固定SDK transport、虚拟密钥和禁止网络的fetch，独立复现：唯一不同字段`maxOutputTokens`，32768→2048，错误相同，fetch调用0；不读真实密钥、不调用Provider、不改产品代码。该证据指向本集成接线，不是Provider故障；保留标准检查，不建议放宽SDK身份校验。

实际同一任务账本最终：27个已计模型准入、39工具；已记录输入38047、已记录输出24288、未结算输出预留2048（账本outputTokens26336含该预留）。这些不是货币账单，也不表示27次均已到Provider。原失败和预留继续保持，不能凭离线探针把真实历史改成零消费或退款。真实请求在23:15:52的审计保留，明确核对没有新请求。

## 最小修正与下一决定

建议在既有私有Adapter内，让图片用途的固定模型描述与它自己的transport绑定同一份2048配置，保留主制作32768、固定端点/模型、SDK0.4.1身份检查、同账累计策略和权限。不得改成“信任任意request.model”，不升级SDK/锁、不清历史账本或UNKNOWN，不修改独立版/MacBook仓库。实现前补实际SDK transport护栏的因果RED，再GREEN/供应与宿主受影响回归、打包/签名和Mini安装复验；旧候选与失败继续保留。

原授权稿规定“每个场景仅一次”“计量未知……记录失败并停”及“未知状态……先报告再决定”。本轮已消耗一次图片理解，因此**新增一次真实图片补测**需要用户明确决定；不能用原批准擅自重复。拟请求：允许修正、隔离构建并更新Mini试用副本，追加一次图片理解补测；原未执行的A定向修改/在途停止及B文字制作/主备场景继续沿用原批准次数，MiMo密钥仍由用户自行输入。新失败或UNKNOWN仍停，不部署、不发布Git，不再写MacBook新包。

当前只完成原因核对和证据收存，尚未实施该修正，未开始上述补测；下一动作等用户明确回复。独立最终Validator、required CI、许可、干净机、正式工程/产品接受及归档等此前缺口继续保留，不把C的用户接受扩成整包接受。


## 用户修复与补测授权 · 2026-10-16

在上述具体问题、Mini更新及额外一次图片理解补测请求后，用户明确回复“允许”。据此执行私有图片配置接线修正、隔离回归/构建、Mini试用更新和一次图片补测；未执行A/B沿用原有效次数，失败/UNKNOWN仍停。旧账本和2048预留保留，不重新申请有效范围、不写MacBook新包、不部署、不发布Git。新证据追加repair-image-004/。

## 上述授权实际结果 · 修正与补测004

前文“尚未修正/尚未补测”是原停止时点，本节记录后续实际结果。Mini已更新native-005；MacBook仍native-004，本轮未写入MacBook。分支/HEAD未变，无实现Git交付。私有图片purpose与专属transport同源2048，主/备配置、SDK/锁、端点/权限和任务配置哈希均不变。实际SDK护栏因果RED→GREEN，供应61PASS；包内资源/本地导出/服务关闭及host-browser010通过，完整canonical013为17组exit0、4828测试/4804PASS/0FAIL/24SKIP。canonical012既有计时夹具FAIL、受控时钟复现和修正后62PASS均保留；没有修改共享生产计量合同。

获准额外一次“理解图片”已执行：本次不再有CONFIGURATION_CHANGED，但真实模型没有调用read_authorized_image，工具调用0，产品仍返回409/RS_IMAGE_UNDERSTANDING_UNCONFIRMED。图片仍为本地待理解，未把文本回复写成图片描述。实际run `98994757-55a1-416d-bbba-b7162fcaefd2`结束、无在途模型；新准入1次、输入283、输出47，已结算。同任务累计28模型准入、39工具、已知输入38330/输出24335，账本outputTokens26383仍含原2048未结算预留。不是货币或Provider账单，旧未知未清除。

离线固定SDK payload探针使用虚拟凭据/合成fetch，零Provider调用：有无system提示两例均已声明read_authorized_image工具。因此不能将此FAIL说成“工具未声明”，也没有据此加入提示词或宣称已找到可靠修法。下一调查可比较SDK公开初始图片输入与模型选用工具两条受支持路径，仍须保持授权图片边界、实际读取证据及“未读不得成功”负例；尚未实施此调整。

证据均在repair-image-004/：image-retest-result-001.json、image-retest-settled-001/、image-tool-payload-probe-001.mjs/json、image-retest-failed-001.png/.dom.txt、canonical-offline-013-summary.json；固定82文件候选manifest005及独立readback006一致。旧native004应用和40项数据文件/链接已保留，native005完整22710资源/签名核对通过。原Quit回执后立即查进程的一次失败也保留，后续核对自有进程全部结束，无强杀。

追加次数已用完，新失败按原授权停止。A修改/计划在途停止及B MiMo/主备仍NOT_RUN、原次数有效；C用户限定接受不重开。全部历史失败、原2048未知、iCloud/下载回执UNKNOWN、许可/干净机/质量等价/独立最终验证/CI/工程与完整产品接受/归档继续保留。下一决定见[追加请求004](acceptance-authorization-004.md)。


## 请求004后实际结果 · 图片补测005通过

用户批准004后，私有读取链路按RS-IMAGE-03修正并更新Mini native006；MacBook仍native004。离线图片14项/供应64项、实际宿主主链011、包内资源/本地导出006及canonical014（4804PASS/0FAIL/24SKIP）通过。旧native005及40项数据文件/链接保留。实际混合plan不支持原生初始images参数，最终通过SDK准入后的图片transport中立消息附图；旧新purpose声明逐项相同，不改SDK/模型/锁或旧任务配置。32MiB入口未收窄，但较大图原工具路径受SDK1MiB结果限制失败，首次补永久负例；不宣称已解决该旧容量问题。

004批准的唯一一次真实图片补测已执行并通过：UI“已生成图片描述”，保存360字模型描述，正确识别标题“合成季度数据”、非业务事实说明和表格一季度100/二季度120/三季度135；保留“模型生成，非原文”。没有通过假文本把未读图冒充成功；本次实际图片附入首包的离线真实序列化证据及实际正确内容共同支持该子范围。副标题颜色措辞近似，不推广为所有图像/格式/质量通过。新增1模型准入、0工具、872输入/161输出已结算；累计29模型/39工具、输入39202/已知输出24496，账本26544仍含旧2048未知预留，原配置6b9dee96…不变。证据repair-image-005/image-retest-settled-001、image-retest-result-002和实际界面。

随后沿原003 A仍有效的一次定向修改授权，要求只改第二页主标题“合成验收：适用边界”，保留两页和原生100/120/135表图等；开始前完整9项deck文件备份独立回读。该场景结果继续收取，不提前称通过。A在途停止/退出及B仍待执行，旧停止线及部署/Git禁止不变。

A定向修改结果已收回通过（见验证028）：实际PPTX仅P2主标题变化，P1 XML不变/表图100、120、135保留，预览显示新标题。原框架页签未同步改名，差异保留。A一次在途演练已显示真实退出三选项并正常收尾，但sleep30自然完成早于停止生效，实际中断NOT_PROVEN，不自动重做。最终累计41模型/53工具、86935输入/27364已知输出，旧2048未知预留不变，无新增未知。B尚未配置/调用，原次数有效；当前等用户对接续005的正常UI凭据安排决定/输入密钥。未部署或Git。


## MiMo增量007/008的实际验收（保留原结论）

单独合成图片理解native007：PASS，MiMo正确识别标题/非业务事实/100、120、135，2模型/1工具/2047入/281出/预留0。原B两页native007：FAIL，look_page图像被text主purpose拒绝INVALID_REQUEST。修正为新项目dual-v3并完成70项离线回归、native008封装/安装/离线导出/宿主浏览器验证；随后用户批准唯一一次额外两页补测：proj_71ca530f在框架阶段INVALID_TOOL，FAIL，4模型/5工具/1187入/738出/预留0，物理结束，无两页产物，未到真实页面检查。

该错误的具体工具/参数/ID分支UNKNOWN，不能用Model request failed或错误帧0 token猜测，也不改工具校验。当前Mini安装native008/e8602fd5…；MacBook仍native004并沿用原限定接受。旧A2048预留及原B失败/所有未验证项保留。应用已正常退出，未追加模型/部署/Git；下一步只读/离线诊断，新的实际Provider场景另需明确授权。完整证据和其他停止线见verification增量030及mimo-vision-007.md。
