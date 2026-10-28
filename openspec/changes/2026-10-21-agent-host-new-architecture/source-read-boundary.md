# DR01 — 原始保存与 Agent 可读资料边界（2026-10-26）

用户明确并授权开发：010_draw保存原始资料，产品LLM不得读取；020_clean保存按现有授权生成的可读视图。来源真实身份、原始保存和宿主导入职责保留。承接PS01，不改变模型、SDK、运行参数或旧Task记录。

- DR01-01：需求讨论、分析、报告及后审实际模型DTO只能发现获准可读资料路径；移除目录original_path。原始路径不作为模型工具可读入口或另一个计划。来源ID/hash与宿主原始保存仍可追溯。
- DR01-02：实际Pi原生read即使获得真实原件路径，也不得读取010_draw。删除sourceFiles原件白名单及其专属Port/Workspace/Adapter接线，不保留兼容入口。保护不依赖提示词；原始保存本身不删除。
- DR01-03：获准020_clean文件与批准Skill原生读取、分页、EOF显式纠正保持；跨Task、越界/符号链接、身份变化、取消、撤权、审计及UNKNOWN仍拒绝，不把权限拒绝软化。与原始目录同名的外部祖先不是权限判据，以实际Task相对位置为准。保留目录的大小写变体和文件系统等价拼写必须应用相同read/stat/write/edit保护；不能跳过clean封存/授权，也不改写模型请求为另一条路径。
- DR01-04：受控后核验仅消费获准视图/封存材料，盲复算输入仍来自授权来源，真实执行/方法资格不降级；R0先保存、必要R1及受影响复核/全文重审保持。信息缺项只限制受影响判断。

现有公开接点：正常Profile/Workspace→Application→Pi Adapter→精确SDK原生read；回归复用当前真实后核验、浏览器装配及保存重开。只使用独立合成新Task和离线transport保存因果RED/GREEN。受影响规则更新在本文件/原verification和持久证据根，不另建框架或审批。

允许必要Application/Port/Pi Adapter及既有测试增量、当前工程看板和固定回执；不修改SDK、依赖、模型或历史记录。固定完整新候选交未参与实现的独立Validator；通过后才按既有真实测试授权运行一个新Task，到结果或安全停止点收尾。工程和Provider消耗分开，原失败/UNKNOWN/预留不清账。新Git交付不由局部成功推定。

证据：/Users/bendandebaba/JuanerAI-artifacts/agent-host-simplification/2026-10-19/engineering-intake-001/new-architecture-v1.2-conversational-three-core-001/draw-read-boundary-repair-001
