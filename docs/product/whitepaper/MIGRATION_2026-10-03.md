# 白皮书资料归属与引用迁移

2026-10-03用户批准迁移，并要求更新旧绝对路径引用。本轮产品版本仍为v4.0，新增MIGRATION-R1导航修订；正文战略、开发路线和研究完成度不变。

## 当前与历史入口

| 用途 | 新入口 |
|---|---|
| 唯一可编辑主稿 | [JUANERAI_WHITEPAPER.md](JUANERAI_WHITEPAPER.md) |
| Blueprint采用时的v4.0原文 | [revisions/v4.0/JUANERAI_WHITEPAPER.md](revisions/v4.0/JUANERAI_WHITEPAPER.md) |
| 旧v3.3.4输入 | [revisions/v3.3.4/JUANERAI_WHITEPAPER.md](revisions/v3.3.4/JUANERAI_WHITEPAPER.md) |
| 原研究成果 | [研究索引](../../research/README.md)及[具体引用定位](../../research/REFERENCES.md) |
| 当前正式开发依据 | [Planning Index](../../planning/README.md) |
| 原路径、原SHA与可取的原件 | [迁移清单](MIGRATION_MANIFEST_2026-10-03.json) |

原research根为`/Users/huangbo/Dev/Projects/research`；旧主稿路径为`docs/product/whitepaper/JUANERAI_WHITEPAPER.md`。Blueprint v2.0/v3.0写入了该绝对路径，v4.0/v4.1继承相对位置与原SHA。所有这些已批准Blueprint、历史收据和来源字段保持原字节；当前导航新增相对链接来解析它们。

- 历史v4.0 SHA：`86591ec8be91e8357839726930a0c398a7fc54e454b04843fa5f554c2542b7eb`，268494 bytes，正式仓库内冻结原件可直接读取。
- 历史v3.3.4 SHA：`429a58a6772aacf162b49d66e86b36dc2c5f0b068af7e25b1554206ec7703f4b`，通过其原版本目录读取。
- 当前主稿因导航修订产生新SHA，见[本轮收据](MIGRATION_RECEIPT_2026-10-03.json)；不能用新SHA替换旧采用记录。

## 迁移范围与兼容

完整迁入原白皮书目录142个文件，并为修改过导航的原件保存精确快照；当前主稿、维护卡、索引和关联文档指向本仓库入口。两份必要背景依赖（共同背景和Model Pack历史审查）同时纳入。当前跨research链接改为正式研究索引，覆盖59个探索和具体来源身份；没有移动Demo、数据库或运行态。

原research白皮书目录保留为明确标识的冻结兼容档案：旧绝对路径仍返回原字节，历史Brief和任务的SHA仍能校验；Agent入口、共同背景与Prompt改到新主稿，不再在那里维护第二份正文。当前正式分支位于独立工作树，主分支整合与其他设备接收未由本次文件复制证明。

原sources/revisions/JSON收据/恢复ZIP/历史Prompt保留来源语义。历史快照内部的相对引用仍按原canonical whitepaper根或research根解释，可通过迁移清单、引用清单找到对应现存资料；不是重新发布的完整静态网站。对原不存在的图片/旧导出/历史外链不补造。需要原始研究代码或全文附件的正式输入仍应附带获准的固定版本。

## 验证与实施边界

检查142个来源的精确保留、冻结Blueprint原字节、当前本地链接与锚点、绝对路径分类、59项研究身份、无产品语义差异、research探索与既有工作树保留。实际结果、历史缺图及未执行项见[收据](MIGRATION_RECEIPT_2026-10-03.json)。迁移不更改代码、OpenSpec、工程状态或任务权限，不启动Demo、真实数据验证或设备执行。
