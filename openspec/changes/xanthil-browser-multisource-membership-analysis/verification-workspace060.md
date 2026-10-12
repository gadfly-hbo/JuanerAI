# Workspace060 试用增量验证

用户直接批准 UX60/61/62 与 FS60；原 Change005 R2 与用户验收边界保持。

- UX61 因果 RED：资料卡未有可展开预览；GREEN 79。UX60 RED：没有可操作分界线；GREEN 80。UX62 RED：没有收起／入口栏；GREEN 81。FS60 RED：没有分析目录、冲突目录及链接未拒绝；GREEN 29。日志分别保留。
- 相关 UI／Store 回归131项 PASS，0skip；typecheck003 PASS。首次typecheck夹具可能null已修正，旧失败保留。
- 真实Mini网页：左右鼠标拖动从220/310到300/460；键盘可调整。收起保留同任务历史V1，设置重置；插件6项尚未接入，账户明确预留，无伪造身份。原6阶段专业回归。
- 真实资料抽屉：订单CSV表头与6行；30行合成测试只前10行、转义脚本、不含第11行。预览跨绘制保持。1000宽主区380，无溢出；390宽抽屉351，无溢出，恢复原视口。
- 真实本地Store合成任务目录及独立重开读回：directory-proof.mjs / directory-result.json，无Provider。项目已有UUID文件夹；新分析首次接受持久化才建analyses/<task UUID>，空白草稿不建，修订沿用，旧任务不迁移。README只定位数据库，不冒称数据已导出成文件。
- 正常服务在0pending时通过产品entry stop/start受控重启，入口http://127.0.0.1:60901/；旧profile-before/after字节一致，3tasks/44requests/0pending，历史FAIL/UNKNOWN及预算保持。本轮新增Provider=0。
- 完整canonical002运行中；canonical.log错误由将shell脚本误用node启动导致，保留，不作为产品RED。最终增量独立复核待回。

证据根：/Users/bendandebaba/JuanerAI-artifacts/n01-n02/controller/v11-numeric-reliability-r2-001/browser-workspace060
不声称正式Change完成、用户验收、Git发布或required hosted CI。

## 候选007独立FAIL修正（继任008）
原007冻结与独立FAIL保留。FS60真实COMMIT失败RED为task已回滚但目录残留；GREEN明确ROLLBACK成功后仅清理本次目录原生dev/ino及README原生身份／hash未变的内容。ROLLBACK失败不清理，保留不确定结果。30项Store回归通过，132总受影响回归与typecheck005通过。修订与新任务分别验证原目录复用／独立UUID目录。
UX60旧已加载007页面补采800宽实际RED：left420/main323；刷新采用修正后GREEN left363/main380，无横向溢出。不冒称这条补采发生在代码编辑之前；原冻结007及独立源码缺陷判断是因果定位依据。修正补701～950重钳并扣除入口栏／分界线实际占位。
canonical002离线17组通过，期间存在以上修正，不能宣称其全部输入为最终008；canonical003在最终程序完成后启动，待结果。旧fixture TASK_BUSY/初次启动错误等保留。

## 最终收集
canonical003 实际退出0，17组离线阶段全部退出0；最终程序身份与008一致，只有规格／能力行政记录后补，无运行态PASS冒充。132项受影响回归0skip及typecheck005通过。最终同机服务http://127.0.0.1:61484/，已通过启动入口打开并读回原历史V1、真实CSV展开。正常profile再次3tasks/44requests/0pending，未发模型。完整最终独立结论正在收回；用户产品验收PENDING。

完整候选009独立最终PASS已收回，见 browser-workspace060/independent-review-controller-receipt.md；原报告留在独立原生上下文。总控接受本地增量交付，用户Product Acceptance仍PENDING，不标正式Change完成／archive／hosted CI／Git发布。009之后仅行政收尾，不改固定程序／测试／配置。
