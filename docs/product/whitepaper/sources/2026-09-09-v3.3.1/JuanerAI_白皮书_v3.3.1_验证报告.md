# JuanerAI v3.3.1 文档与资产验证报告

- 白皮书：`JuanerAI_数据分析与决策操作系统白皮书_v3.3.1.md`
- Markdown 行数：3411
- 图片引用：20 次 / 19 个不同文件
- assets PNG：22 个
- 基线 SHA-256：`afe465e73b0b8df104d590a27a30d11ab072e7e67ffcc8b1da9f3a8c5bca5dfb`

## 检查结果

- PASS — revision metadata
- PASS — base product preserved
- PASS — Phase 1 Desktop gate order
- PASS — Phase 2 route present
- PASS — Frontend no direct MLflow
- PASS — PX007 bounded
- PASS — general vs profile boundary
- PASS — forecast strict rules retained
- PASS — ModelEvol no release authority
- PASS — E/MP mapping
- PASS — isolated raw data boundary
- PASS — consumer vs runtime separation
- PASS — rollback current transaction only
- PASS — permissions/deadline/cancel
- PASS — runtime separation
- PASS — MLflow-first thin
- PASS — offline clarification
- PASS — PX008 bounded
- PASS — historical IDs exact
- PASS — 2026-08-29 snapshot exact
- PASS — 2026-08-31 snapshot exact
- PASS — not rerun claim
- PASS — prediction evidence decision chain
- PASS — no auto decision
- PASS — all markdown image refs exist and decode
- PASS — new diagrams referenced
- PASS — code fences balanced
- PASS — no local absolute paths
- PASS — v3.3 baseline preserved
- PASS — no PDF/DOCX completion artifact in package

## 验证边界

- 本报告只验证文档文本、内部引用、图片文件可读取、关键修订语义与基线完整性。
- 未运行 PX-005 / PX-007 / PX-008 的代码或浏览器测试。
- 未生成或验证 DOCX / PDF。
- 未启动 Demo、实现、外部调用、部署或 Handoff。

## 交付封装检查

- PASS — Pandoc 以 GFM 输入完成完整 HTML 解析，0 warning；仅用于语法和资源解析验证，HTML 不作为交付物。
- PASS — 源文件 ZIP 经 `unzip -t` 检查，无压缩数据错误。
- PASS — 新材料未生成 DOCX / PDF，因此未作 DOCX / PDF 完成声明。
