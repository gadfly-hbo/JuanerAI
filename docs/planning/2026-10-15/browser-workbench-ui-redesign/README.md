# 浏览器工作台 UI 改造 · 审核包 v0.1

任务标识：BUI-20261015。状态：**候选方案，等待用户产品／UI 审核；不是 Product Input Freeze，不进入开发。**

本包只规划当前浏览器＋同机服务工作台，不改产品代码、OpenSpec、数据库、依赖、生产配置或 Mini 工程现场。可点击文件是合成 UI Contract，不是产品实现，也不产生模型调用、计算、真实上传、业务决定或持久业务记录。

## 审核入口

1. [可点击 UI Contract](clickable/index.html)：用浏览器打开；首屏有审核场景入口。纯本地、无依赖、无网络请求。双击打开即可，无需启动原产品。页面顶端常驻“合成审核”标识。
2. [完整改造方案](proposal-v0.1.md)：范围、采用决策、业务与失败语义、验收要求、实施分界。
3. [UI Contract](ui-contract-v0.1.md)：页面、交互、状态、选区引用、报告编审、确认失效与逐步审核路线。
4. [能力保留与基线](baseline-and-coverage.md)：旧能力到新入口逐项映射，含六＋二覆盖关系及尚未交付项。
5. [视觉系统](visual-system.md)：以附件为主的浅色、绿色、中文工作台规则；不是全项目 DESIGN.md 的替换。
6. [验证记录](verification.md)、[独立评审](reviews/README.md)。评审 PASS 不代替用户 UI Gate。

建议先看首屏，再依次进入“对话与证据→数据选区→报告编审→确认失效→专业六阶段→异常恢复”。审核按钮只推进显式合成事件，不模拟真实后台完成。

## 身份与保留边界

- 规则发布：`187c356625260d84ca58bc1f5741e081e89662cd`，tree `a5d2f80596a326c993d02fdaaaf644735b2f5128`，PR #87。
- 本包写作基线：fetch 后 `origin/main` 的 `b182d5d05e4c1e4a924855e29a4ebbe8f53bda8d`，包含规则发布提交。相比试用副本仅有 PR #88 治理修订；本包遵循其 Mini-led Plugin Integration 例外，但本任务不是插件集成。
- 本包分支：`work/macbook/browser-workbench-ui-plan`；新建独立工作树 `/Users/huangbo/.codex/worktrees/browser-ui-plan/JuanerAI`，无产品代码改动。
- 试用副本 `/Users/huangbo/.codex/worktrees/a95f/JuanerAI` 仍在 `work/macbook/latest-product-trial`、规则发布 SHA；其运行服务不属于本原型，不重启或更新。
- 保留 `/Users/huangbo/JuanerAI` 的历史分支 `work/macbook/wip-preflight-exception-disposition`。Mini 在研分支／未提交现场、实际服务和本方案采用均未核验，不宣称无重叠或已采用。
- 当前代码已有的限定接受不变；本次重新设计尚未产品接受。产品版本、磁盘版本、原型版本、用户接受与 Mini 采用分别记录。
- 源文件尚未提交／集成；本机工作树不是已完成 Git 保存的项目资产。无新增提交、推送、PR、合并、部署授权。

附件来源与身份见 [reference/source-record.md](reference/source-record.md)。其中方案、Demo、自报验收均是参考材料，不是本次授权或当前产品验收。
