# Change005 v1.2 · 用户批准与 Product Input Freeze

2026-10-08，MacBook Product Manager。此记录追加效力，不回写历史候选正文、源附件或审查身份。

## 1. 用户直接批准

用户在本产品准备任务直接回复：

> 审核通过，冻结提交，生成可转发Mac mini的prompt，我来转发

该批准适用于本轮提交审核的产品增量、UI Contract 与可点击附件：**产品／新增 UI 审核通过，Product Input Freeze 成立**。依现行 Git Publication Completion 规则，授权本有界产品材料正式提交、推送、PR及满足条件后的合并与安全main同步。未授权直接消息 Mini；交接由用户手动转发。不改蓝图、不新建 Change，不以批准取消R3或替代v1.1未完成承诺。

## 2. 冻结身份

以下是独立 Review002 与用户审核的同一固定候选，冻结后不为适配实现修改：

| 正式附件 | 字节 | SHA-256 |
| --- | ---: | --- |
| [产品增量 RS-01–08](product-addendum-v1.2.md) | 17110 | `4ae9e1a5bfeb28b311e4ac4fd96cfef38a60e04f189966112532d4c8b676ba89` |
| [UI Contract RSUI-01–10](ui-contract-v1.2.md) | 6207 | `0e4f4453c9441470046597a60fbcaa6cf1c9d946ca37a99884a0983d069a23fa` |
| [可点击 HTML](clickable/index.html) | 6954 | `86409d47c8b20575b4018015da8432f57a6136ef019205f2815406d379de3ff5` |
| [可点击交互 JS](clickable/sandbox.js) | 20468 | `772ebbb4fda0e723388df80eb5595651ab149656b81a53308ed3553ab99acefa` |
| [增量 CSS](clickable/sandbox.css) | 1492 | `72048dd616afba16135b26f5e1d558328aa7675e4db18d133ec3211303cada2b` |
| [源方案 v0.1](../xanthil-analysis-requirement-sandbox-product-proposal-v0.1.md) | 18570 | `dbde24f3ce12bb09402113b3c55dfca1bc05997581347e2e7c9481081adf2360` |
| [源独立审查001](../reviews/analysis-requirement-sandbox-readiness-001.md) | 4333 | `b016372c1463f2ab25079e47113fb348ce92f5013e1a87fa10deae7d1b44e81f` |

[独立整合 Review002](reviews/integration-readiness-002.md) PASS只限规划就绪；[历史整合001](reviews/integration-readiness-001.md)保留。用户本次批准提供新增UI Gate，不把工具浏览器NOT_RUN改成已运行。

源方案／正文／UI／review-and-status中的“待审核、不能冻结发布”等为其形成时点；后续批准和当前产品冻结效力以本记录为准。七项正文冻结身份不因批准记录改变。

## 3. 本次闭合与仍有条件的动作

六项已确认沙盘接入决定、原005有效产品／UI／Runtime／授权决定均复用；不重复询问。任务共创、自动保存、不同答案的判断影响、真实消费者、来源／版本、简单跳过、仅保存、缺资料／冲突、停止／恢复按固定RS及RSUI执行。快速与专业同一任务，严格沿用已接受PX-004/006与品牌；不得改造替代工作台。

体验验收冻结为产品§5的RS-U1、六个测量维度及“先基线再定量化目标”的机制，**不新增未测数值SLA、不声称样本／阈值已达标**。本次批准允许上述产品输入冻结，不凭此虚构既有005体验决定已闭合；实际试用条件／量化目标复用仍有效的用户决定，确实缺失时集中补决，在受影响试用／正式体验验收前关闭，不扩大数据／Provider／部署权限。

Mini精确R3输入、当前代码消费者／复用差距、有效授权与停止线，仍是接收和受影响执行前核对项。它们不由MacBook预冻结普通实现合同，也不由本次批准冒称已通过。若005已归档或出现新的实质产品／安全冲突，先报告衔接影响，不自行重开或放宽合同。

## 4. 交接与工程边界

工程身份保持 `xanthil-browser-multisource-membership-analysis` / Change005 / N01–N02，v1.2只是本Change新增产品要求，不重置v1.1、五时刻或R3。Mini原工作树、在研分支、未提交实现、失败／UNKNOWN、预算及停止记录原地保留；主仓库main同步不等于工程分支换基线或采用。

由用户把固定Git发布commit/tree及[工程接收指令](handoff-instructions.md)转发给原 `change-005（N01/02）`。直接手动转发是实际消息授权；接收方先核验固定附件，回传采用身份、现场与下一允许动作，再完成增量intake，在现有有效权限内推进，不要求常规重复启动批准。

生产仍由Mini工程主Agent在已获范围内执行SDD/TDD、回归及独立`juaner_validator`；MacBook不编写生产／OpenSpec／测试，不更改Mini看板或状态。缺失权限、新外部效果、危险或未知影响集中交用户；未明确授权部分不执行。自动跟进／旧暂停任务不因本次Git发布恢复。

## 5. 发布与采用状态

本记录签入时：用户批准／产品冻结已成立；Git发布正在办理；直接Mini消息 **NOT_SENT_BY_USER_INSTRUCTION**；Mini采用及增量intake **NOT_CONFIRMED**；无v1.2工程实现或验收主张。

实际commit、PR、CI、合并和安全同步身份由本次发布回执提供；不能把正文历史基线当最终发布SHA。接收前读取冻结完整附件，采用不能由Git fetch或main同步推导。MacBook本地原始证据根见[verification](verification.md)，非Mini默认可访问的证据副本。
