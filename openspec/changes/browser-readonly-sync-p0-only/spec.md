# 行为与正式交付验收

- P0-01：三个上传入口只共用相同结构/严格Base64解码；精确键、encoded8MiB上限、canonical roundtrip、空串接受、400状态、各入口上层大小/权限/跨站与原业务处理不变，不同旧资料约束不合并。
- P0-02：两个客户端仅共用GET JSON叶函数，保持same-origin/no-store、各自错误文本、browser-v1头，网络/解析错误透传，无重试、授权或成功伪装；所有写和回执/UNKNOWN对账不变。
- RB-01：query-core、query模块/bundle/路由、web:build、web:start前置构建及专属安装元组保持撤回；package/lock/installer逐字为目标HEAD，普通静态helper认证后可加载。
- RB-02：列表派生选中任务、原1500ms interval/polling锁、generation guards及离开销毁清理不变；任务切换/迟到读取、停止/UNKNOWN/回执、输入/焦点/双模式保持原约定，不承诺被撤回的P1改善。
- HIST-01：005/006、历史PASS、失败/UNKNOWN与诊断不改；新版本仅复用身份/输入/环境仍相同部分，原PASS不覆盖新发布追踪。
- PUB-01：显式暂存本P0范围；准确工作分支head、完整PR差异、新完整候选独立只读审查及适用CI通过后squash。不绕过main保护，无行为/合同/权限扩张。
- ISO-01：只读识别产品WIP重叠，保护其索引、代码、配置、依赖、服务和运行资料；仅安全main同步，不切换/覆盖/拉取/cherry-pick到产品branch，不删除本地分支或工作树。

受影响测试、HTTP安全回归、原客户端/启动/tuple/installer、类型/原生ESM与实际Chrome为本地适用项；CI按仓库现行canonical流程，无CI修改。三项cloud archive/member proof缺输入时本地NOT_RUN，未改归档/installer，不将其当成本地P0等价必需；既有CI若要求此输入须实际运行，不以本机skip替代。无Provider/真实资料/桌面打包/部署授权。
