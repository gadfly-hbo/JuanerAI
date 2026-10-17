# 生命周期接缝

## DP-LIFE-01 固定自有实例
给定校验过的Node/入口摘要和固定源身份，多个并发start只spawn同一个自有子进程。ready必须经其私有IPC绑定本次nonce/PID/commit及仅回环地址。入口损坏、假ready、超时、退出均不能当ready；不找活动源码或附着health端口。

## DP-LIFE-02 先拒绝未知数据
首次只在规范父目录创建新私有根；拒绝程序内部、符号链接、已有无标记旧根、错源标记、重复拥有者。必须在spawn/import/openBoardDb前拒绝，原旧库字节不变。正常停机后同标记根可重开；非正常退出保留独占锁，不能以新task或重启绕过。

## DP-LIFE-03 真实关闭边界
关闭要通过业务无活动/UNKNOWN检查和子进程quiesce；任一失败保持现有实例。quiesce原子停止新准入，确认没有在途HTTP/抽取，再退出自己的进程。仅父子均确认正常关闭才释放锁；异常退出/通信超时保留不明状态。关闭网页与此接口无关。

## DP-LIFE-04 环境与秘密
父环境中的合成秘密、代理、NODE_OPTIONS不进入子进程；独立HOME/TMPDIR。ownerToken不出现在argv、公开session、日志或浏览器；所有API仍经实际端口的入站guard。只读无许可历史模式不可触发默认凭据发现。
