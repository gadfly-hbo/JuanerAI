# 最小设计与兼容性

decodeOpenSource 只归一 submit、requirement-materials、revise 的相同 envelope；调用点的控制权限、顶层大小、命令语义不变。不同的旧资料解码约束保留。readJson 只归一 same-origin/no-store、ok 判断和 JSON 解析；两个原消费者分别保留原错误文本和 browser-v1 请求头，不持有授权、缓存、任务或业务状态。所有写及 recover 不变。

quick-analysis-client 除 GET 叶函数外与 HEAD 字节等价，原 refresh/selection/paint generations、列表投影、setInterval1500/polling锁、退出清理、回执/UNKNOWN/停止恢复均保留。没有 query observer/cache、前后 authority 额外探测、构建器或 query-core 依赖并存。

正式交付 fetch 目标与006基线相同，源码/测试逐字与006对应文件一致，只有当前发布规格/追踪按新授权更新，因此新完整候选的独立审查补发布范围与证据适用性。产品在研分支不是目标的祖先，但本次相关文件无已提交差异、WIP 无路径重叠；不据此强迫它换基线。

P0 三份严格解码实现归一为一份，两个JSON GET叶函数归一为一份；增加一次静态helper模块加载，不主张减少剩余业务同步机制或提高速度。browser-client 停止文字定位修复符合原HEAD实际文本，无业务行为变化或断言弱化。
