# C04设计修订接收 / 未实现

用户指令：那你修改设计。当前branch work/mac-mini/n01-n02-browser-membership，HEAD037e3f8fd8e694000428d65384a545879f1d6f9a，原WIP保留。证据根controller/v11-semantic-design-001；preimage.json含实际源文件摘要及不存在记录。

现有原设计主要嵌在spec.md/engineering-decisions.md，design.md此前不存在；本次补必要设计说明，并明确取代C03字面规则，保留历史。codebase graph无当前语义函数结果，针对已知文件读回发现value-in-quote与candidate substring的耦合。边界依据唯一政策v0.9 ContinuousSDD/EngineeringDecisions、data-authority/security-boundaries。

设计已写，不宣称生产修改、因果RED/GREEN、主备调用或独立PASS。本轮只做文档链接/内容/前后源码身份核对；不会为文档杜撰行为测试。当前用户试用仍是clarification006：http://127.0.0.1:50539/，其已验证范围保留，不能证明C04实现。完整历史verification.md、verification-clarification003.md及所有FAIL/UNKNOWN/379累计调用/16历史UNKNOWN保持。后续验收覆盖与未完成任务见design.md和tasks.md C04；自动跟进PAUSED，Provider/数据/主机/Git权限无扩大。
