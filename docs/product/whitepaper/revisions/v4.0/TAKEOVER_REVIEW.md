# v3.3.1 接管与一致性复核

日期：2026-09-09。**统一维护已接管；原六项 Model Pack 修订的核心语义已落实。当前主稿为 v3.3.1 / MP-ALIGN-01-R1，产品基线仍为 v3.3。接收包缺 13 张正文配图，不认定为完整出版资产交付。**

## 实际来源

- 用户指定包：`/Users/huangbo/Downloads/归档.zip`；1327128 字节；SHA-256 `ba918249b0169a82a87e64158b916f34a8ef81f953995ee0773ea8d21315c67a`。
- ZIP 共 24 个条目：12 个内容文件和 12 个 macOS AppleDouble 元数据。已检查 CRC；提取时验证路径边界、拒绝符号链接，并将未标 UTF-8 的中文文件名按实际 UTF-8 字节恢复。元数据保留于原 ZIP。
- 12 个内容文件：最新 v3.3.1、历史 v3.3、四份修订/资产说明、六张 PNG。没有可编辑图源、PDF/DOCX 或导出脚本；没有正文要求的完整 `assets/` 目录。
- [原始交付归档与指纹](sources/2026-09-09-v3.3.1/RECEIPT.json)；原始 v3.3.1 SHA-256 `a311ca2ff04d2a469e8b2cc9f969af95ce68433c1740b77857fd0c3aefb318bd`。
- 用户随后明确说明：包内 v3.3 是多放的旧文件，**v3.3.1 才是最新版**。本次已按此选择主稿；旧文件只作归档，不参与当前版本选择。
- 包中的旧 v3.3 SHA 与仓库已有 v3.3 精确相同：`afe465e73b0b8df104d590a27a30d11ab072e7e67ffcc8b1da9f3a8c5bca5dfb`。没有覆盖历史原文。
- 原交付是资料，不是执行指令；内附验证报告仅作为交付方声明。本轮实际目录检查与报告“22 PNG / 所有引用有效”不符，按本记录解释本次收到的包。

## 六项修订复核

依据 [上一轮问题报告](../JUANERAI_V3_3_MODEL_PACK_REVIEW.md)、[PX-005 批准决策](../../../explorations/PX-2026-005-model-pack-demon/PRODUCT_BRIEF.md)、[PX-005 评审](../../../explorations/PX-2026-005-model-pack-demon/DEMO_BRIEF.md)、PX-007/008 的行动卡与现存源码/历史证据核对。以下结论是文本一致性，不是重新执行 Demo 或批准正式接口。

| 原问题 | 修订内容与位置 | 本轮结论 |
| --- | --- | --- |
| R1 Desktop 验收遗漏 | 18.12、18.15、18.18、附录 I.2 分开 Consumer、Desktop 实际 Runtime、场景效果与产品准入 | 已落实；Demo phase1_accepted 与产品完成分开 |
| R2 企业 Serving 路线遗漏 | 18.21、附录 I.3 明确 Frontend → Backend → thin MLflowServingAdapter → MLflow OSS Serving；同一 Pack、独立 parity 与企业授权 | 已落实；PX-007 仍仅为 Spike |
| R3 专用 profile 泛化 | 18.14、18.18 分开通用身份/合同/权限与首发 28 天预测；分类、聚类等不继承金额/日期矩阵/coverage | 已落实；本轮另消除 Objective 必填歧义，见下文 |
| R4 ModelEvol 权责 | 18.13、18.19、附录 J 明确训练供给与 Controller 最终发布权，原始行隔离，E7–E9 为决定投影 | 核心职责已落实；MP 状态名需别名说明，见下文 |
| R5 Consumer 与日常 Runtime | 18.17 分开安装、日常推理、撤销/退役；只回滚本次事务，保留既有安装；权限、取消、deadline、合同检查 | 已落实；正式 Runtime/SDK 仍未冻结 |
| R6 MLflow-first 薄封装 | 18.11、18.16 复用原始 MLflow Model / Signature / 依赖 / 加载 / Serving，008 研究 ZIP 不成为长期标准 | 已落实；离线不等于禁止 import MLflow |

18.20 分别列示 2026-08-29 的 58/14/36/17 与 2026-08-31 的 58/14/71/17；Run 和 Pack SHA 对应各自历史记录，没有拼接。本轮对现存 evidence 的身份与记录做只读核对，未重跑浏览器或模型训练。18.17、18.21 已明确 Prediction → Evidence → 独立评审/人工审批 → 行动，不能自动生成 Decision / Action / Outcome 或策略增量。

## 主稿 R1 的有据修正

外部交付 MP-ALIGN-01 保持不动，以下只改当前 [维护主稿](JUANERAI_WHITEPAPER.md)，逐项记录在 [CHANGELOG.md](CHANGELOG.md)：

1. **合法返修回路**：原 18.15 仍为 MP5 → MP6 → MP7 的线性图；PX-005 产品讨论第 69 行明确禁止 MP6 直接进入 MP7。主稿改为 MP5 接受支路与 MP6 → 新尝试 MP3 → MP4 → MP5 返修支路。
2. **状态名与职责别名**：原交付 MP1–MP3 为 plan_registered / worker_assigned / training_running；PX-005 冻结名为 planned / assigned / training_evaluating。主稿流程采用冻结名，并在 18.13.3 和附录 J 说明表/图里的称谓是职责别名，不修改历史枚举或声明接口兼容。ModelEvol E1–E9 名称也核对了本地 Controller 指引；职责映射不等于真实产品集成已完成。
3. **普通分析入口**：18.14.1 将每个模型合同必须包含 Business Objective / Decision 改为必须有业务问题/使用目的，OSM 对象按适用性引用。依据同文 7.3 的两类任务入口，不新增用户目标要求。

主稿 SHA-256：`067ec964a18668d9877480f948e1c63db9f2e92e0783554eb86a72f592e395b4`。归档原文与主稿之间的差异限于上述文字修正和修订标识。未修改项目代码、冻结 Brief、历史评审或真实产品状态。

## 配图接收与视觉检查

20 次正文图片引用对应 19 个不同文件。本次按资产清单的完整 SHA，将收到的六张同内容 PNG 复制到主稿 `assets/figXX_…png` 路径，原始下载名仍在归档中；不是只凭名字猜配图。

| 正文引用 | 本次状态 | 来源清单预期 SHA-256 |
| --- | --- | --- |
| `assets/fig03_目标经营闭环.png` | 未收到 | `f1a9819895cb2fdae2652dbf93aa6e04c4259a1732c29231943b9c27e82f517a` |
| `assets/fig01_广义数据决策者.png` | 未收到 | `e5625dc2169e7ba3c2f515420d0d79df7c699c213f30d4eee73248bee8806b80` |
| `assets/fig02_BI_AI问数_JuanerAI.png` | 未收到 | `0132d99cb0846b4785e83450c377a2026c50054498d3ec98a5ef7a48dade07c4` |
| `assets/fig04_OSM八大模块.png` | 未收到 | `900ca2b7f8085a69f096ab25a9182fd320354599c285c5c6a27bf11f8b956f54` |
| `assets/fig05_三种分析模式.png` | 未收到 | `353f23f616f6d4fbf39c61496beb329b94e41893c1993891fbae479376ff237c` |
| `assets/fig13_DAME六类方法体系.png` | 未收到 | `80fe2597a84ea3f0735eaaa458261bb1d9c0d2790a929c707eca59a976c150f2` |
| `assets/fig14_ABTestAnalysis边界.png` | 未收到 | `b06a07524cb2d56a9365f8f35eca0980ba0404acffcb077f5de19108361656a2` |
| `assets/fig06_AnalysisIR编译器.png` | 未收到 | `d564e827ebd576332ad8c09ddf0de9f2c9691fb873402823330941f4a873471e` |
| `assets/fig08_Xanthil_DomainPack_四库双库关系.png` | 未收到 | `c064b8387cb23044c1fe48087b015e2829fb6f5240ab3810f51b15b5987b88b9` |
| `assets/fig12_SemanticContextRuntime四库联动.png` | 未收到 | `6940cd3e3b17169afdc3ace485cc3ecc3fe91de1e24b6d2798d9211ae20bb1d2` |
| `assets/fig07_6plus1总体架构.png` | 已收到并按完整 SHA 匹配 | `7bd8c98c7328a7294868b50026e29b012a151a5c0e7c21951c1d749eceb86ec2` |
| `assets/fig11_DomainPack三种状态.png` | 未收到 | `49da162c92a533fe98ed8e9e580b6b3feb6447337e58ebbdc2dc971190a7c56f` |
| `assets/fig15_ModelPack_MLflow生命周期.png` | 已收到并按完整 SHA 匹配 | `de37688b306bd3d1c609935b1abc0fd3aff5013a9312aa8a119f335c0cdedf62` |
| `assets/fig16_ModelEvol_ModelPack职责映射.png` | 已收到并按完整 SHA 匹配 | `afddd0bcd7c8d72436570fd3353a95ceaf31e45c0ba8bfe0e6e74c3e4470683c` |
| `assets/fig18_ModelPack通用合同与首发Profile.png` | 已收到并按完整 SHA 匹配 | `53eabe95517d039f300dc45ceb93c2294b811686ea456de7a143e72868935976` |
| `assets/fig17_Consumer_DesktopRuntime边界.png` | 已收到并按完整 SHA 匹配 | `f775f52d5d6ca2b74412660c589e1ac4ff8f2e5320f24779dbb8de8aecefa788` |
| `assets/fig19_Phase2企业Serving路线.png` | 已收到并按完整 SHA 匹配 | `61f3909b6613940a6b8236a08547d5d4ba2d46e6715c6d826854d9c79fa216ea` |
| `assets/fig09_可信裁判与Teach.png` | 未收到 | `b09e6f60e1978f09e4239bca5531a909202139be3acdc8be38085482dd031c41` |
| `assets/fig10_端到端案例.png` | 未收到 | `47d9d664e6cad1d2f4dd8f5dea5b53c6a557eb990684d3483e4f557cece17ec1` |

六张均已逐张查看：6+1 结构、两期生命周期、ModelEvol 职责、Consumer/Runtime、通用合同/profile 和企业 Serving 的主要语义与修订正文相符。未做图片编辑。存在可见排版瑕疵：fig15 产品验收行的标题与说明挤在一起、Builder 下行与分支横线未连接；fig18 的长字段名折行及“值域与 Envelope”行较拥挤；fig19 的 MLflowServingAdapter 尾字母单独换行。记录为后续出图整理项，不声称像素级出版验收通过。

来源清单提到的 cover、cover_docx、额外 fig08 及旧版 assets 也未在本包收到。正文缺图继续显式列为缺失；不以旧图或生成占位图替代。已在 Downloads 中按相关版本和图文件名做有限查找，仅找到这些已交付文件的散件，没有补齐缺图。

## 维护接管与项目绑定

- [MAINTENANCE.md](MAINTENANCE.md) 固化用户授权、唯一主稿、角色、版本与双向更新事务。
- [PROJECT_BINDINGS.md](PROJECT_BINDINGS.md) 覆盖现有 PX-001–035，逐行关联章节、批准决策、行动卡和 Demo 评审；其余主题仅标为暂无独立专项入口。
- AGENTS、共同背景、PROJECTS 背景及 PROMPTS 接入新入口；历史版本、旧校验报告和项目行保留。
- 接管已完成；以后在 research 的相关会话直接维护，不再等待原白皮书 Controller。缺图只影响出版资产完整性，不阻塞正文更新。

## 检查记录

本轮实际检查结果：

- ZIP CRC、归档 SHA 与 12 个内容成员 SHA 一致。
- 包内旧 v3.3 与仓库历史原文逐字节一致。
- 6 张 PNG 完整 SHA 与 Pillow 解码/1920×1080 校验通过，另已逐张视觉查看。
- 20 处/19 个图片引用已逐项核对：6 个已接入，13 个已知缺失；不声明资产完整通过。
- 118 份历史来源/记录和既有 Brief/行动卡 SHA 未变。
- PROJECTS 只变更共同背景段，35 个项目行完整保留。
- 35 个探索唯一覆盖，决策/行动卡/Demo 证据入口存在。
- 9 份当前入口/主稿/维护文档围栏通过；247 个本地链接与 87 个章节锚点通过。
- R1 文本修正、六项关键语义和独立 Gate 表述检查通过。
- 现存 2026-08-31 evidence 的完整 Run/Pack SHA 与 71/71 记录核对一致；未重跑。
- 主稿维护修订 SHA 与接管记录一致。
- `git -c core.fsmonitor=false diff --check -- AGENTS.md PROJECTS.md PROMPTS.md docs/product` 退出码 0。

没有执行外部材料中的脚本、未产生网络调用或费用，也未进行 Demo/生产验收。
