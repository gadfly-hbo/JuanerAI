# 034：固定通知候选受影响独立验证

2026-10-16。沿用户031/034已批准的既有CLI只读通道，实际Sol/high/read-only/never已读回；exit0，453.02秒。原完整审查和033接受继续复用。以下为原始完整最终报告，未改写结论。命令、实际设置、原始输出、退出和全部核对失败均保存在原034固定证据根；其中一次通知文件名探测ENOENT不作产品缺陷。

---

**034 受影响独立验证：PASS。G031-04 对本次固定候选的具体 buffers 通知缺口已闭合；未发现新增实现缺陷或受影响范围内的阻塞。** 原031的历史 BLOCKED、033限定接受及所有失败、UNKNOWN、保留意见继续保留，不回写历史结论。

本轮从实际 `turn_context` 核实为 `gpt-6.1-sol / high / read-only / approval never`，不是依据项目 TOML 推断。全过程未写文件、派遣 Agent、联网、访问真实 Studio 数据或凭据，未启动应用、服务、GUI 或 Provider。

固定候选已独立绑定至 [candidate-freeze-034.json](/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/engineering-closeout-030/license-followup-034/offline-candidate-034/candidate-freeze-034.json)：

- 分支及 HEAD 保持 `work/mac-mini/report-studio-integration` / `1446276011917ec46b369eadaed40c059db46b34`。
- 完整源码快照 **3,178 项**及28份冻结收据的长度、SHA 均匹配；包含 WIP、新增测试资料和文档。
- 模块 **22,716 个资源**，manifest SHA 为 `d59d0554314c7e3c832944dd9f6bc6c8a31df3b7c862b119bd7a540c5551da19`。
- 新应用 **25,593 项**；交付 ZIP **468,266,662 字节**，SHA 为 `793a67d1a2aa9f6e5682563a07c07ee6fa1e62a235e83174e62c9998b95fa4a0`。

| 条目 | 更新处置 |
|---|---|
| G031-01／AC01 | **USER_RISK_ACCEPTED / NOT_MEASURED** 保持。没有干净机器安装实测 PASS。 |
| G031-02 | 复用032→033实际正常 UI、同任务续作和交付2证据；限定接受不变。 |
| G031-03 | 复用033原生质量及既有 PPTX 编辑路径等价结论；MacBook限定接受、延期编辑范围不变。 |
| G031-04 | **本固定034候选已闭合具体 buffers 缺口**。不扩大为应用整体法律保证，也不据用户自有代码授权推断第三方权利。 |

**许可绑定与实现核对通过。** 实际866字节原作者补丁绑定 James Halliday 提交 `1b745ee35d33eb166e15ef1866073a07c6d7de87`。四份源码／示例／测试与固定供应包逐字相同；在内存中严格应用补丁后，README、package.json 与保存的上游文件及哈希一致，差异仅为许可声明。NOTICE 的2015版权行及正文明确归于所引 Debian `0.1.1-2` 记录，没有冒称来自 npm 或2012作者补丁。本轮未联网重新认证公开站点；结论基于保存的材料、实际补丁、字节比较和明确来源标注。

[composer 第27–39行](/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/engineering-closeout-030/license-followup-034/offline-candidate-034/candidate-source-034/tools/report-studio/build-bundle.mjs:27)在创建输出前核对名称或规范安装路径、精确版本、原始 `license:null`、六份文件长度／SHA、普通文件及真实路径。规范路径分支覆盖了改名绕过反例； altered bytes、版本和符号链接反例均有对应断言。原元数据保持不变，解析结果另放 `license_resolution`。静态 vendor 材料属于此次固定审查输入，没有新增通用许可解析器或权限入口。

实际模块中两份通知与 vendor 原件逐字一致，具有 `licenses` 角色；base64 fixture 和作者补丁未进入交付模块。`redistribution_review:PENDING` 按批准范围保留，不构成新的整体许可 PASS。

**测试证据与保留范围核对通过。**

- 原33项合同测试字节完整保留，新增12项；未删除或削弱原断言。
- 缺通知 RED 的实现前 SHA 与原030 composer 一致；实际失败为缺少通知。改名绕过 RED 为 `Missing expected rejection`，当前规范路径选择修正对应原因。
- 冻结的45项合同测试为 **45 PASS / 0 FAIL**。独立汇总最终原始日志得到 **4,840 tests / 4,816 PASS / 0 FAIL / 24历史 SKIP**，17组结束成功，包含语法及类型检查。
- 首次缺 `tomllib`、第二次缺 `mkdtemp` 父目录的失败仍在，属于环境失败，未当作产品 RED 或通过记录。没有实 Provider 门禁执行。

上述写夹具套件本轮 **NOT_RUN**；使用其固定原始证据并检查断言敏感性，没有突破只读沙箱重跑。

**实际封装及交付核对通过。** 034使用固定027作为代码外壳重新封装，没有新 Forge 编译。与027相比，应用恰有两项新增、五项变化、零删除，其余 **25,586项相同**。模块其余 **22,713项原资源相同**；供应 source.tar、SDK、锁和运行代码保持不变。主程序仅排除 `LC_CODE_SIGNATURE` 字段及签名 blob 后，完整载荷一致；`app.asar` 字节相同。

本轮独立只读执行结果：

| 检查 | 结果 |
|---|---|
| Python SHA／JSON／补丁内存重建／全量文件与符号链接比较 | PASS |
| Mach-O 非签名载荷比较 | PASS |
| `codesign --verify --deep --strict` | exit0；仅证明当前 ad-hoc 签名一致性 |
| Node26调用固定模块验证器 | 新 pin `ready`，22,716资源；旧 pin `unavailable/incompatible` |
| ZIP SHA、全部 CRC、25,593项字节及链接读回 | PASS；应用边界无额外条目 |

交付 ZIP 的 AppleDouble 资料位于 `__MACOSX`，未当作额外应用代码。首个 ZIP 内联 `._CodeResources` 导致严格检查失败的记录和原包仍保留。本轮一次通知文件名探测产生 ENOENT，按实际清单路径纠正后逐字比较通过。

安装中027的25,591项及真实 Studio 的159项未变，本轮仅复用冻结保全证明和先前033读回，没有再次读取真实数据。032失败工件、交付1、033交付2、同任务账本、原 UNKNOWN／预算预留、首次退出断言失败及后续自行稳定退出的范围均不改变；不增加“交付后重启”或自动选中 exp004 的主张。

当前受影响独立验证无剩余已确认阻塞。034安装、Developer ID／公证、MacBook新实测、托管 CI、Git 集成、部署及归档均未由本报告完成或授权；正式 Engineering Acceptance 仍归主工程。若候选继续变化，仅需按实际差异复核受影响身份、通知绑定及封装完整性，不要求重跑有效产品阶段或另建许可台账。
