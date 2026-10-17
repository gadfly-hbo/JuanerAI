# Change007 保证边界修订 · 新鲜只读规划审查 Brief004

## 权限、输入与当前状态

这是AGENTS的Product Plan Development-Readiness Gate，不是工程Validator、可行性研究或产品批准。用户已同意调整保证边界并要求补齐输入／验收／必要UI供审核，尚未批准本候选整包或工程恢复。108锁定；无109，无生产／spec／测试写入、Provider、模型更改、安装、服务、Git发布或跨session消息权限。

请使用一个全新只读上下文，站在实施者角度只评价下列正式材料是否自洽、可理解、可测试；不要凭作者聊天或未声明理由补全方案。不要修改任何文件；返回完整审查文本，由PM记录。不要访问Mini、业务DB、凭据或其它项目来救材料缺口。引用既有来源是核对产品边界，不是重新运行旧工程。

本候选包位于`docs/planning/2026-10-17/change007-review-guarantee-boundary/`，先核对`reviews/review-inputs-004.json`列出的身份，再完整读README、product-addendum、acceptance-delta、ui-addendum、source-readback、verification、两份正式来源镜像及必要可点击源码。`qa.mjs`／结果只是文档静态／内存合成检查；可只读独立复跑，不运行浏览器、生产测试或旧Mini原型。浏览器此前明确拒绝本地文件及绕行，本轮不换协议／工具或启动服务。

## 供应的历史权威与适用规则

- 本分支AGENTS.md；docs/governance/agent-model-routing.md、git-development-workflow.md、product-change-execution-policy.md；docs/architecture/data-authority.md、security-boundaries.md及ADR0003；只适用当前规划职责，不启用工程。
- 原007目录`docs/planning/2026-10-13/change007-conclusion-strategy-review/`中的proposal-v0.1.md、decisions.md、approval-and-freeze.md、ui-contract-v0.1.md、33项冻结记录；历史审查如需核对只读。
- 前包`docs/planning/2026-10-17/change007-authoritative-delivery/`中的README、product-addendum-v0.1.md、ui-addendum-v0.2.md、approval-and-freeze.md、acceptance-basis.md、attachments/formal-acceptance-originals.json（完整13原文）、49项冻结记录；accepted-workbench及accepted-report-studio中的已接受合同／批准／参考源。
- 本包产品明确保持现行Blueprint v4.2、六＋二与稳定能力ID，可据docs/planning/README.md定位已引用权威，仅在发现承重冲突时读取相关段；不拿浮动main覆盖工作分支或重开原路线。
- 全局UI基线`/Users/huangbo/.agents/ui-design/DESIGN.md`与共享接入标准`/Users/huangbo/Dev/Projects/pi-agent-runtime/docs/AGENT-RUNTIME.md`是已由PM完整核对的只读原文入口。若核对其未变边界需要，可读这两份明确提供的文件，不能扩展为外部仓库研究、SDK迁移或新实现。

## 必查重点

1. 是否诚实承认FD-01及受控共同误判技术保证实质前向变化，而不是声称原全部门槛不变？是否不回写历史FAIL／UNKNOWN与样例？
2. H硬边界、Q真实语义质量、R故意共同漏判回放是否可分别判定且不互相抵销？真实原F107仍需识别错误并保留正确内容，R不是Q成功，是否明确？
3. 开放自然分析与正确有用内容是否仍必须正式交付？是否禁止模板／宿主代写、手工原型生产化、全撤回及只留来源过关？
4. 全文实际送审、已知结构化事实／权限、版本失效、全消费者同版及停止／保存／UNKNOWN等是否仍有可验证端点？没有要求宿主理解所有中文，是否也没有暗中把已知错放合法化？
5. 是否严格沿用PR90/91已接受工作台，仅必要文字／历史说明；普通用户不需新流程或理解内部H/Q/R；原六阶段／同任务助手／引用／编审／选择限制不丢？
6. 后续完整收口与当前停止是否清晰，是否遗漏需要用户拍板的承重产品规则？实现接口／schema可安全留给Mini，不能要求PM代写工程；规划PASS不等于技术已证或工程许可。

## 返回格式

按AGENTS七项返回：`What I Would Build`、`Required Guessing`、`External Study Required`、`Untestable Requirements`、`Correctly Deferred`、`Required Plan Additions`、`Verdict`（PASS或NEEDS_CLARIFICATION）。每项承重缺口给最小补充和准确路径／行号。若无承重猜测再判PASS；明确静态、浏览器、工程、真实质量和用户接受未验证范围。不要以“模型有可能失败”本身判输入不就绪，也不能把可能可行当工程PASS。
