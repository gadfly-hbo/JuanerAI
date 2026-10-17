# Change007 正式成果表达增量 · 核对与验证

> 后续用户已明确接受本版产品／UI并授权冻结发布，见[批准与冻结](approval-and-freeze.md)。下文的PENDING／未冻结是各检查时点历史，原字节及审查身份保留；本次批准不把浏览器NOT_RUN、107 FAIL或真实质量未接受改为通过。Mini仍只允许用户手动转发后的只读接收，不启动108或真实调用。

## 当前UI入口纠正（2026-10-17后续用户指令）

本页§1–4保留最初旧壳层候选的检查与Review001/002时点，不能据它认定UI基线正确或用户已接受。用户已指出问题并要求采用最新已验收工作台；当前待审为[UI v0.2](ui-addendum-v0.2.md)与[新版可点击稿](clickable-v0.2/index.html)。修改前正文／UI说明／来源／本记录的实际原字节保存在[前向修正前镜像](reviews/before-ui-alignment-003.json)，原规划Review002的身份不回写。

本次直接加载PR90已验收样式与原交互模型，并以原工作台原型增加007任务挂点，不修改源镜像。10项原工作台及PR91三项附件的固定身份见[UI来源](reference/accepted-workbench/identity.json)。旧产品FD-01～06、原正式12场景／13份正文、33项冻结输入、模型与门槛未变；只修正UI采用关系与同版编审／导出／人审衔接。原9个合成情境逐字段核对相同。

`node alignment-check.mjs`实际33项静态／最小模拟DOM检查PASS，记录为[alignment-check-003.json](reviews/alignment-check-003.json)。新脚本三项JS语法检查PASS。覆盖默认新壳层、三视图／六阶段、同任务助手／引用、编审／冲突／确认失效、正式内容与原稿隔离、缺口、条件重审、未知／停止及Studio入口边界。它不是生产资格判定器，也不是浏览器、独立工程验证或实际模型质量证明。

本版浏览器布局、真实点击、焦点／键盘／响应式实际验证仍**NOT_RUN**；遵守此前明确的本地file协议安全拒绝，不另启服务、替代浏览器或间接截图。用户可本机打开审核。未操作服务或业务数据。

新鲜独立[增量规划Review003](reviews/development-readiness-003.md)：**PASS，仅限规划就绪**。Reviewer独立回读[固定27项输入](reviews/readiness-inputs-003.json)全部匹配，并实际复跑33项静态／模拟检查及三份JS语法检查；没有借旧工作台验收签发本版浏览器或用户UI通过。原Review001/002及用户指出旧UI不适用的历史保留。

本verification在返回后仅追加该事实，因此其审查时hash与此后事实更新分开，原manifest不回写。产品规范正文、UI v0.2、可点击行为和验收原件未随记录更新而改变。用户产品／受影响UI接受：**PENDING**。不冻结、不Git发布、不派发Mini、不启动108、不换模型、不恢复真实调用。

---

2026-10-17｜仅产品／UI准备，不是107或新工程候选的验收。

## 1. 来源与保护

本轮只新增本目录。原2026-10-13冻结33项输入逐项字节／SHA匹配，原批准、Review和原型不回写。技术评估副本31427字节、SHA `c8f925265e0aa173494274513fd29b61b7ace08e8898a82cbf1f572d8271d7d7` 独立读回一致。

[原正式验收依据](acceptance-basis.md)与[原件UTF-8镜像](attachments/formal-acceptance-originals.json)纳入12场景、10份合成输入、标准采用与后续等待采用记录。13个正文的字节／SHA与源匹配，包含无末尾换行的原文；未修改样例／门槛。[来源身份](source-readback.json)区分原件、历史配置与本轮授权，不把旧模型配置恢复为当前。

107作者离线FAIL、无独立PASS保持；未复跑107，未读真实业务数据或应用数据库。范围仅规划文字、来源镜像、合成HTML/CSS/JS和检查脚本，不改业务、工程OpenSpec、看板或能力状态。

## 2. 已执行检查

```sh
node --check docs/planning/2026-10-17/change007-authoritative-delivery/clickable/authority.js
node docs/planning/2026-10-17/change007-authoritative-delivery/prototype-check.mjs
```

语法PASS。修正后的19项具名静态／模拟DOM断言、13份历史正文、33项原冻结输入均PASS；相对引用数量与结果以[最终文档检查记录](reviews/prototype-check-final.json)的实际输出为准。早期[修正后检查](reviews/prototype-check-002.json)保留，后续仅补事实记录／引用，不改产品或原型行为。覆盖原稿与正式预演隔离、完整建议与缺口、A/B、条件三回答、主动更新、停止和安全显示。

这些只验证预写样例／文档／模拟事件，不是浏览器或生产机制证明，不能证明模型理解、全文覆盖、授权、实际保存或正式人审已接通。

[早期15项检查](reviews/prototype-check-001.json)虽PASS，但“未知”只查提示和资格，未查问题是否真正收起；Review001指出该不足，旧结果保留。修正后专门核对问题／回答按钮消失、待条件持续、只有用户主动更新才重新显示，不以旧PASS给R2背书。

## 3. 独立规划审查

[Review001](reviews/development-readiness-001.md)：**NEEDS_CLARIFICATION**。原结论与[修正前输入镜像](reviews/readiness-inputs-001.json)保留。

- R1已补固定可读的原协议、事前有用性标注、标准采用和QS04定义；初始30／60秒与后续有效等待分开，不恢复旧模型／权限。
- R2已区分未回答／已答仍未知，更新可点击状态与说明，补敏感断言。
- 另一fresh-context只读Reviewer的[复审002](reviews/development-readiness-002.md)已返回**PASS，仅限规划就绪**；无承重猜测／必补项。审查时[11项输入指纹](reviews/readiness-inputs-002.json)一致，原Review001不改判。本verification在返回后仅追加当前结论／最终检查等事实，因此其审查时hash与此后事实增补分开，不回写原指纹。

规划就绪不是用户产品／UI接受、机制实现或质量证明，不改判107、不授权108。

## 4. 浏览器与待用户审核

本地 `file://.../clickable/index.html` 被浏览器协议安全策略拒绝；仅允许HTTP/HTTPS，并禁止其它浏览器／间接执行／服务绕过。

**浏览器布局／真实点击／响应式／键盘体验：NOT_RUN。** 未启服务、换浏览器或截图冒充通过。按原UI Contract§5保留状态，请用户在本机直接打开[可点击增量](clickable/index.html)审核；不是请求安装或服务权限。

用户产品／受影响UI审核：**PENDING**。旧有效UI批准保持，新可见语义不预先标UI Gate PASS。未冻结、未发布Git／派发Mini、未启动108。

本原型没有应用Provider、文件读取、真实计算、后端保存／下载、正式Decision／Expected或业务行动。模型不变，真实调用继续暂停；原FAIL／UNKNOWN及未接受状态保持。
