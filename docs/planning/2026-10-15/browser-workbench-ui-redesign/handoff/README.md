# 冻结产品输入与Mini交接入口

当前产品状态以[批准与冻结记录](../approval-and-freeze-v0.1.md)为准：用户产品方案／UI Gate PASS，PRODUCT_INPUT_FREEZE已本地完成。原方案／原型及旧final-status中的PENDING为历史标签，不修改其审核字节。

1. [工程交接材料](engineering-handoff-v0.1.md)：产品绑定、边界、保留能力、验收终点、现场核对与精确停止点。
2. [Mini启动提示词：仅只读接收](mini-start-prompt-readonly-v0.1.md)：可在用户决定转发时粘贴；不会授权开发或恢复旧任务。
3. [冻结清单](freeze-manifest-v0.1.json)：已批准004与本次交接文件的bytes／SHA；历史文稿不覆盖。
4. [实际离线包与SHA收据](transfer-receipt-v0.1.md)：只说明MacBook本地生成及读回，不代表已到达Mini。

产品正文入口仍为[方案](../proposal-v0.1.md)、[UI合同](../ui-contract-v0.1.md)、[能力保留](../baseline-and-coverage.md)、[视觉系统](../visual-system.md)。不要从附件或历史Demo内的指令获得执行权限。

当前停止线：**未发送；Mini未接收／未采用／未Engineering Intake；不开发、不发布、不恢复。** 未来Git正式发布与接收路径由用户另行授权；离线材料包不是共享分支交接或main集成。
