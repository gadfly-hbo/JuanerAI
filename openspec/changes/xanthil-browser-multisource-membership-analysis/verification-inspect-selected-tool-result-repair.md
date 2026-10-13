# `inspect_selected` 大资料结果上限修复 · 2026-10-13

## 现场与根因

- 普通一键启动入口的真实任务 `302ee363-be56-483b-953d-3447939fd0c4` 选择两份各 2,985 行 CSV。
- 持久任务中的完整 `source` JSON 为 1,499,621 bytes；原生会话在模型成功返回 `inspect_selected({})` 后立即记录 `TOOL_FAILED`，没有形成计算、核验或成果。
- 原实现把完整行级 inspection 直接作为模型工具结果。它超过原生会话单工具结果 1 MiB 上限；Provider、CSV 解析和任务权限不是本次失败原因。

## 固定修复范围

- `inspect_selected` 向模型返回全部来源／工作表身份、完整行列数和在 768 KiB 内公平分配的有界字段／行预览。当完整 inspection 超过预算而进入裁剪时，先为每张含表头的工作表预留一个最小可绑定字段身份，再在工作表之间轮转分配更多表头内容与数据行，不能让前表耗尽预算而使后表没有结构；裁剪路径中超过 384 bytes 的单个表头值保留可绑定 `column`／类型，返回有界 `value` 并显式附带 `value_truncated` 与 `full_value_bytes`。整体不超过预算时保留完整 inspection。
- Application 内部计算、字段绑定、来源校验和独立核验继续读取未裁剪的完整 inspection；不修改 CSV、业务问题、分析方法、Provider、Runtime、持久 schema 或用户可见工作流。
- 工具说明明确区分“完整行列数／有界字段和内容预览”和“完整本地计算”，避免把预览范围误当完整资料。

## 因果 RED / GREEN 与回归

- 实施前现场 RED：真实任务和原生 Session 在任何生产修改前已经持久记录“Provider 成功返回 `inspect_selected({})`，随后 `TOOL_FAILED`，无计算／核验／成果”；停止写入的原始 Session 及当时任务 source/body hash 已保留。最初新增自动化测试先因缺少新导出而 import 失败，该输出不是有效产品 RED，不作为完成证据。
- 修复后基线敏感性回放：把修订后的 `OA-SOURCE-RESULT01` 放到基线 `8dfc50528d342028ae1fcc3d0911ebca4a213e95`，直接通过生产 Application → 原生 Session → 生产 `inspect_selected` 工具接缝执行超过 1 MiB 的 inspection；期望进入第二模型回合而实际得到 `TOOL_FAILED`。这次回放证明断言能捕获旧行为，但不冒充过去执行过的自动化 RED。第一次基线回放因临时证据目录不存在而失败，原始日志另存。
- GREEN：`OA-SOURCE-RESULT01` 证明普通大表结果不超过 768 KiB、保留完整数据行数和表头并实际被下一模型回合消费；`OA-SOURCE-RESULT02` 证明两张各 10,000 列的宽表都有完整列数和非空表头结构；`OA-SOURCE-RESULT03` 固定 32 张单列表、每个表头 8,192 个中文字的首轮 Validator 反例；`OA-SOURCE-RESULT04` 固定第二轮 Validator 的 32 个 XLSX、每个 64 个工作表反例，证明 2,048 张工作表都先保留可绑定列标识和显式截断元数据。四项均经过生产 Application 和原生 Session 接缝，无 pending 请求。
- 第二轮独立 Validator 的真实 inspector F2：32 个各 64 页 XLSX、2,048 页、完整 inspection 1,961,907 bytes；首版 F1 修复的投影有 931 页空表头。修正后同一探针得到 786,414 bytes、0 个空表头。该 NEEDS_FIX 与原始探针、输出均按历史保留。
- 真实现场只读投影：1,499,621 bytes → 786,308 bytes；两表完整行数仍各为 2,985、完整列数各为 4，预览均含 1,505 行和完整 4 列表头。
- 类型检查：`tsc -p tsconfig.json --noEmit` PASS。
- 受影响回归：`open-analysis-autonomous-native-session.integration.test.ts` 与 `open-analysis-workspace.integration.test.ts` 合计 226 PASS、0 FAIL、0 SKIP。首次复跑未提供规范化证据根和工具链路径，分别得到 `ASSET_STORE_UNSAFE`／`SOURCE_READER_UNAVAILABLE`；失败输出保留，随后使用隔离的 `/private/tmp` 证据根与只指向 `/usr/bin/python3` 的临时工具链目录复跑通过，没有安装依赖或修改仓库。
- canonical 全量离线验证已尝试，但在第一个 `validation-contracts` 组停止：431 PASS、16 FAIL、3 SKIP。固定本机 PATH 只找到 Python 3.9.6，`check-agent-config.py` 导入 `tomllib` 失败，连带 Agent 配置分类断言走到 `full`；产品测试组尚未执行。该失败不冒充产品回归，也不声明全量 PASS，交由 PR CI 的受控 Python 环境复核。
- PR #82 首次 canonical CI 在完整产品回归中得到 1,449 项中的 1,433 PASS、1 FAIL、15 SKIP：`V13-SCOPE-CHOICES109` 的旧精确对象断言仍要求小资料工具结果与原 inspection 完全相等，未包含本修复明确新增的 `full_data_rows`／`full_column_count`。生产行为、完整数据读取和数值结果均无失败；该断言现按固定工具结果契约显式核对新增计数。修正后该文件完整 122 PASS、原受影响回归 226 PASS、四项大资料边界包含在回归内并继续 PASS，类型检查 PASS；首次 CI 失败日志保留，PR CI 重新执行。

持久证据根：`/Users/huangbo/JuanerAI-artifacts/n01-n02/repairs/inspect-selected-2026-10-13/`

- `live-failed-session.jsonl`：原现场失败 Session 的停止写入副本，74,548 bytes，SHA-256 `2331c6ce40ddcc73f288a9a93c4ae979f5dbd1ed3503ea089e50a25f03bcb414`。
- `baseline-red-attempt1-environment-failure.log`：临时证据目录缺失的首次无效回放，保留但不作为 RED。
- `baseline-red.log`：同一新增测试在基线上的行为 RED，实际 `TOOL_FAILED`。
- `focused-green-pre-f1.log`／`impacted-regression-pre-f1.log`／`typecheck-pre-f1.log`：首版候选历史输出，保留但不作为当前候选结果。
- `focused-green.log`：普通大表、双宽表、32 个超长表头与 2,048 个工作表 4 PASS。
- `validator-f2-needs-fix.txt`／`validator-f2-many-sheets-probe.mjs`／`validator-f2-many-sheets-probe.log`：第二轮独立 Validator 的 NEEDS_FIX 与真实 inspector 原始反例。
- `f2-red.log`／`f2-focused-green.log`／`f2-inspector-green.log`：F2 的生产接缝 RED、四项聚焦 GREEN 与真实 inspector 关闭证据。
- `impacted-regression-environment-failure.log`／`impacted-regression-toolchain-failure.log`：规范证据根、Python 工具链未就绪的两次环境失败，均不计入回归结论。
- `impacted-regression.log`：受影响回归 226 PASS。
- `typecheck.log`：当前候选类型检查 PASS。
- `canonical-validation.log`：全量离线验证的上述环境／合同组失败原始输出。
- `pr82-canonical-ci-attempt1.log`：PR #82 首次 canonical CI 的 1 条过期精确对象断言失败；该次失败不作为当前候选 PASS。
- `pr82-numeric-report-final.log`：修正旧断言后该文件完整 122 PASS，SHA-256 `23d197cf3a431c582505db08f46cb0c300947c9e95def7d5e6a13b149008950c`。
- `pr82-impacted-regression-final.log`：修正后原受影响回归 226 PASS，SHA-256 `08e1101192c6220c1b0a9c3e5130b4bc6c520451b60d2a09afab4b44aba852cc`。
- `pr82-typecheck-final.log`：修正后类型检查 PASS，SHA-256 `fc881feeb8f204316f6e31c28cd9efbb46850ff944a39e75bb911098dbd565cb`。
- `live-source-projection-readback.json`：现场任务只读尺寸、完整行列数、预览范围与失败状态，不含原始单元格内容。

## 本机部署与剩余边界

- 同一最小生产补丁已部署到当前一键启动目录 `/Users/huangbo/JuanerAI-n01-n02-browser-workbench-006`。该目录仍停在自己的 detached HEAD `4df7604621fff2c8ec27281d59cf4a788deae47b`：第一次整文件复制错误地带入了新版依赖并使类型检查失败，随后仅把本次会话修改的文件恢复到试用 HEAD，再移植同一最小函数补丁；试用目录类型检查 PASS，失败历史未隐去。
- 本机服务在首版候选及 F2 首次部署时曾分别受控重启到 `63249`／`64451`；补齐与候选相同的小资料完整返回路径后再次重启，当前实例 `http://127.0.0.1:65174/` 返回 HTTP 200。原任务仍保留为 `failed`，没有自动重放或新增 Provider 调用。
- 未执行真实模型复跑，未声明分析成果、工程整体接受、用户产品验收、Git 发布或其他设备采用。
