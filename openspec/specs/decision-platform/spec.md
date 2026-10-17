# decision-platform宿主接入规格

本规格随[012获准交付归档](../../changes/archive/2026-10-17-decision-platform-integration/README.md)的PR实际合并生效。沿用006r1批准产品/UI输入、各行为规格及012限定接受，不增加业务权限。正式安装、真实Provider/业务数据和生产采用不在本次交付内。

## 已批准用户路径与业务效力

从当前任务已保存报告进入完整看板及汇报模式，沿用参考组件/色彩。报告来源、原文件名/版本及返回原分析保留；报告、行动、任务和反馈按任务/项目及精确来源隔离。同任务新版本保留独立关联，不覆盖旧版本。汇报退出恢复可用焦点，真实窄视口和抽屉保留既有行为。

人工采纳/有理由驳回、人工补充、已采纳项建任务、任务更新及人工反馈属于插件记录；不执行现实业务动作，不自动写成宿主正式Decision/Actual。project teach只影响本插件任务后续抽取，不自动发布共享资产。首期飞书关闭。

## 确定性机制与边界

- [DP-INGRESS](../../changes/archive/2026-10-17-decision-platform-integration/specs/ingress/spec.md)：固定自有插件仅回环/owner守卫；拒绝浏览器直接访问插件端口及协议侧路。宿主浏览器另沿既有会话、同源和控制权接入。
- [DP-LIFE](../../changes/archive/2026-10-17-decision-platform-integration/specs/lifecycle/spec.md)：固定资源/自有子进程、首次未知旧库先拒绝、环境秘密隔离、已确认静止才正常关闭；异常锁及未知不清除。
- [DP-MATERIAL](../../changes/archive/2026-10-17-decision-platform-integration/specs/material-permission.md)：许可绑定精确已保存报告字节/版本、teach及实际接收方；每次效果和发布再校验，不从环境凭据推断许可。
- [DP-SOURCE](../../changes/archive/2026-10-17-decision-platform-integration/specs/source-flow/spec.md)：精确字节及上传意图先保存；异步上传不等于抽取完成；丢回执/重复提交核对原操作，不按标题或新ID重发；版本独立。
- [DP-RUNTIME/WRITE/HOST/RES](../../changes/archive/2026-10-17-decision-platform-integration/specs/runtime-and-effects.md)：复用c11f8da composeAgent逐次宿主授权，一次逻辑抽取最多两次模型准入（包含首次），备用与格式恢复共享一次机会；GET历史不写插件数据；UNKNOWN暂停写入但历史可读，核对不能自动重放。固定资源启动前完整核验，不回退全局开发环境。

## 接受及明确限制

[工程接受](../../changes/archive/2026-10-17-decision-platform-integration/engineering-acceptance.md)为ACCEPTED_WITH_NAMED_WAIVERS；[用户产品接受](../../changes/archive/2026-10-17-decision-platform-integration/product-acceptance.md)绑定固定012及隔离合成浏览器范围。原独立BLOCKED、历史RED不足、danger-full-access/只读沙箱具名例外、空库/UNKNOWN及所有FAIL按原证据保留。合成成功不证明真实模型质量或一般业务有效性，不提升完整能力族或阶段。
