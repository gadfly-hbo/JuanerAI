# Change002 冻结 UI 与 DMG005 一致性复核 — 2026-09-29

结论：**FAIL — UI 交付不符合冻结原稿，工程验收重新打开。**
Mac mini Engineering Controller 根据用户提供的两张原稿截图和明确异议，复查冻结可点击附件、UI Gate 决定、工程设计和 DMG005 留存截图。此结论不是新产品设计，也不撤销原 UI Gate；需要纠正的是工程实现及验证。

## 固定原稿与用户决定

本机 `docs/planning/2026-09-28/clickable-ui-contract-case-assistant-v1.0/dist/` 的 HTML、CSS、JS、品牌图片四个 SHA-256 均与 UI Gate 冻结表一致。原稿完整存在本机，因此无需 SSH MacBook。

[冻结决定](../../../docs/planning/2026-09-28/xanthil-case-assistant-ui-gate-and-product-input-freeze-v1.0.md)第 7 行明确记录用户：“这版 UI 明显好于第一个 change，不仅通过，未来将作为 JuanerAI 的 UI 标准”。第 14 行明确品牌呈现、信息层级、状态区分与交互质量的标准作用。

Controller 实际打开可点击原稿并查看快速模式、专业阶段 6，另对照仓库 quick-unapproved/professional-entry 留存图片及 DMG005 real-pi-plan-005 的 draft/reopened 图片。用户附件与冻结稿属于同一已批准视觉设计；视口、场景面板开关及个别状态文案不同，不声称截图逐像素相同。专业页对比具有入口/采纳后的状态差别，但下列共同框架缺失不由该差别解释。

## 具体偏差

| 部位 | 冻结原稿 | DMG005 | 判定 |
|---|---|---|---|
| 全局顶部 | 单排品牌栏，居中分段式快速/专业模式切换 | 旧双排标题/工具栏，模式按钮左对齐，项目工具占据第二排 | 结构不一致 |
| 专业模式 | 左侧纵向六阶段，中央四张摘要卡与大型 Case Assistant 入口，右侧 Case 控制权和报告版本 | 左侧会话/运行列表，横向阶段导航，旧工作台中追加普通入口卡，通用上下文侧栏 | 主要页面未落实原稿 |
| 快速模式 | 明确的三栏比例、标题层级、宽松消息卡与底部输入区，深色箭头发送按钮 | 虽有三栏和部分相近颜色，但沿用旧顶部/底栏，文字密度、留白、控件与发送区不一致 | 仅局部接近 |
| 视觉体系 | 暖白背景、橙色主要动作、深蓝灰消息/图标、统一圆角与字号层级 | 专业模式仍用旧青绿色动作体系，整体字号与间距更密 | 未形成冻结稿的一致体验 |

## 工程原因和验证缺口

`design.md` 的 baseline reuse 表明确写了 “Keep ... professional UI”；实际 renderer 保留 titlebar/commandbar/session-rail 旧框架，在 stage 6 添加 ca-stage-six 卡片。由此可见，工程把保留第一 Change 的功能误落实为保留旧专业界面，而没有按批准原稿落实其呈现。

既有自动化、真实 Pi、安装和重新打开证据证明了各自运行/行为结果，不能据此证明与冻结 UI 一致。此前 Controller 验收及独立 PASS 没有发现这个明显的整体结构和视觉偏差。Controller 接受此次复核结论；不要求用户再次批准已经冻结的原稿。

## 当前状态与准确返回点

- DMG005 不再作为可进行最终产品/UI 验收的合格候选；当前整体 Engineering Acceptance 重新打开。
- candidate006、DMG005、原始测试输出与 Validator 报告作为历史保留，不改写已有 PASS 日志，也不继续将其解释为当前完整 UI 合规。
- 下一工程动作应在既有批准范围内修正设计和前端，复用原功能、数据和权限边界；按原稿核对快速模式、专业阶段 6、授权、草案及采纳返回等状态，再打包并独立验证。
- 此次只完成原稿定位、视觉复核与 Controller 状态纠正，未修改生产代码、重打包或调用模型。原冻结产品文件未改。
- 用户产品/UI 验收仍未通过；Git 交付/集成/归档仍未授权。

## 证据定位

持久证据根：`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record`，所有者 Mac mini Engineering Controller。`ui-fidelity-review-001/evidence-readback.json` 保存 8 个原稿/截图文件的绝对定位、字节数和 SHA-256；文件已在本机读取。未建立跨设备备份。本复核为 candidate006 冻结之后新增的 Controller 记录，不属于旧 manifest。
