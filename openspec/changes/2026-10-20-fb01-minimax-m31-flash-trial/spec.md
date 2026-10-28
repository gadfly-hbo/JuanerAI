# F-B01 MiniMax M3.1 Flash 单次复测

当前用户明确批准将本次新测试的 MiniMax-M3 换为 MiniMax-M3.1-Flash，API key等其余不变。来源50c2f3e/tree b696441，与PR110集成树一致。沿既有已批准F-B01/UI原件和正常浏览器入口；不重新审计八类接缝。

## 最小行为

- M31-01：启动时显式且封闭地选择新模型，仅对unified-v1的新测试生效，首请求前固定到Task配置身份；省略保持旧M3，错误/Preview/任意模型ID在发送前拒绝。旧Task/config/账本/历史不改写、不恢复或迁移。
- M31-02：正常入口→Profile→Pi Adapter→固定.5→Anthropic codec真实投影model为MiniMax-M3.1-Flash，原endpoint及定向凭据来源不变。账本兼容新ID且保留旧ID、UNKNOWN、预留、取消与安全拒绝。协作读取/执行描述也使用同一固定模型身份。
- M31-03：32768主输出、16384既有备用、模型600000ms/工具硬300000ms/适用命令软120000ms/control30000ms、cumulative unlimited和原共享一次恢复不变；窗口保持200000，R1缓冲不变。MiMo报告/审查不变，不新增fallback。
- M31-04：官方API新模型强制thinking，省略thinking/output_config即启用且effort默认max。本次保持旧请求不额外声明thinking或effort，不能将native请求off元数据解释成新Provider实际thinking off；完整原生thinking续接沿.5，不在报告/普通证据中发布thinking原文，不修改SDK。
- M31-05：原B/question.txt和两CSV不改，不注入人工oracle，正常UI只建一个新Task；前轮2请求/65536预留/未知费用保留，两轮合计最多128物理请求，本轮最多126；到本轮结果或安全停止点停止，不恢复旧失败Task、不自动再试。

## 范围

允许：service-main、native-open-analysis、provider-credentials、analysis-request-ledger Port/Adapter、personal open-analysis/browser-membership必要模型绑定、现有normal-entry参数集成测试、本记录及既有状态CLI/独立证据根。
禁止：SDK/依赖/接收方/key/模型之外的参数与执行策略、旧记录/归档/题目、Git/发布/生产、真实业务数据、其他session或旧两线。无新持久结构、无数据库迁移、无动态路由平台。

## 验证与终点

先从正常配置入口取得因果RED，再以同断言GREEN，实际固定SDK编码/合成thinking续接、旧默认和非法选择/错误provider/旧账本兼容；受影响TypeScript与现有相关回归。首个可运行小切片进行本次已授权真实F-B01，不把离线机制等同模型质量/QS04。固定本地候选并独立只读复核，保留实际试用FAIL/NOT_RUN；不自动Git交付。
