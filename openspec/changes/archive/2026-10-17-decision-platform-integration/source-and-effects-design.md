# 来源关联与写入效果：工程合同001

适用批准输入：006r1 DP01–03/07、002操作矩阵。此处落实已批准的一宿主任务一插件项目、同任务新报告不覆盖旧源、UNKNOWN禁写；不新增宿主正式Decision/Actual、不改变反馈效力。由Mini工程主Agent作内部持久合同影响决定：只增加插件专属关联/意图记录，不改原分析、Studio或插件数据库Schema。既有用户业务决定有效，不新增通用结构审批。

宿主项目根的`.xanthil/decision-platform.sqlite`只由本项目Adapter持有。application_id和user_version=1识别本库；未知/旧库拒绝，不迁移。所有源ID/摘要/版本来自已保存源的适配器；插件ID来自本实例响应及读回；禁止按标题匹配。时间由调用方传入UTC ISO，不能把反馈时间解释为现实事件时间。

- task_bindings：每projectId/taskId一行，生成的关联ID、创建相关标记、nullable插件项目ID。空ID表示创建未核实，不表示项目不存在。插件项目ID唯一。源任务删除不级联删除历史；首期无删除入口。
- report_links：每具体来源快照一行，关联ID/来源的完整项目-task-source-revision-format-name-bytes-SHA、唯一物理文件名、nullable插件报告ID。不同来源/版本或内容摘要形成独立关联，旧行不覆盖。宿主存同版字节副本，以便重开仍可核对。其副本不提升资格，保持源限制。
- write_intents：每用户操作ID一行，taskId、操作类别（创建项目/送入/重抽/行动/任务/反馈）、目标、请求摘要、开始时间、状态pending/confirmed/unknown、nullable读回结果。pending在本进程无对应活动时视为未核清，不自动重发；同操作ID只读已有结果，换ID仍受同task未决写入阻断。confirmed必须由对应业务读回确认；保存后丢回复先读同一意图。没有“超时就failed清空”的分支。

第一次写先把意图持久化，再调用插件；读回明确目标/字节后更新关联和确认。插件创建项目无幂等ID；宿主purpose携带本次创建标记，仅用于核对，不冒称插件新增receipt协议。上传物理名由关联ID生成，避免同名覆盖；HTTP超时后仅核对原名同字节和报告ID。无法排除重复或无法核对时保留UNKNOWN；任务/手工行动等缺强回执的写入不得盲重试。反馈读回按原task及实际字段，不能只凭HTTP200。

项目/task/来源校验在Application；HTTP层还要验证宿主会话和当前项目作用域；实际插件端口仍owner-only。持久Store不授予外发许可，许可目前为进程内明确scope，重启不恢复调用权。SDK物理账本继续独立，只读到报告failed不等于未知消费已核清。

首次新库可创建；已有未知application_id/schema拒绝且保留字节。SQLite事务与独立连接读回验证保存，不由内存状态冒充持久。无跨数据库事务：跨宿主和插件的不确定性显式保留。程序回滚保留新库但旧程序不得解释新版本；本次不实现业务数据回滚或清库。
