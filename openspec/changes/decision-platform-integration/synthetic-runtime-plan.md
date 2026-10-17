# 下一步：固定插件隔离合成验证

当前是待运行授权的具体方案，不是执行回执。用户此前授权取固定材料的提问明确写明“不安装/启动插件”；本方案只补齐该运行边界，无需重审已通过UI。

## 操作范围

1. 从已验70文件复制一个可丢弃的工作副本至同一持久证据根`runtime-synthetic-source-001/`，原`fixed-source-8ae652ce/`不改。为安装创建专用空HOME和npm缓存，不读取用户npmrc。
2. 工作副本按原锁`npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org`，仅下载锁内npm依赖及本地固定vendor。锁中370项，远端主机只有registry.npmjs.org；禁用全部lifecycle scripts，不改锁或升级依赖。需要额外安装脚本时停止并报告具体缺口。
3. 使用已有`/opt/homebrew/bin/node` v25.9.0（满足SDK>=24.21.0），通过工作副本的tsx加载器执行`tools/decision-platform/verify-fixed-synthetic.mjs`。命令参数依次是工作副本绝对路径、原runtime-material-receipt.json、新的`runtime-synthetic-001`绝对路径。
4. 启动环境通过`env -i`仅传PATH、独立HOME/TMPDIR及本次运行开关；不继承密钥、认证、NODE_OPTIONS或代理。Probe先验证全部70项长度/SHA，拒绝已存在run目录，然后建立新空数据根；显式所有插件路径，不调用默认compose或CLI启动块。
5. 注入固定合成runner和内嵌合成Markdown，真实插件`startServer(0,'127.0.0.1',options)`立刻接入本次ingress guard。仅本机随机端口，完成后关闭自有实例。请求脚本仅允许fetch到该自有origin；这是有界合成路径，不冒称OS网络沙箱。

具体验证器：`tools/decision-platform/verify-fixed-synthetic.mjs`，已通过语法检查，尚未执行。

## 验收点

- 真实固定插件listener在未获owner令牌时拒绝项目写入，拒绝后项目列表仍空。
- 合成报告上传字节可读回，坏路径拒绝且不触发runner，异步抽取真实落done并产生行动项。
- 真实API完成采纳、建任务、回录反馈；缺驳回理由拒绝。
- 同一刚创建的数据根重开保留报告、行动/任务/反馈身份，不重复抽取已完成报告。
- 首期未配置通知；无密钥、真实报告、Provider或飞书调用。结果和失败留在运行目录与命令日志，不自动删除。

## 不会因此声称完成的事项

SDK真实codec/账本、宿主来源持久化/业务许可、完整子进程生命周期、前端UI/浏览器、安装/分发及用户产品接受均另有待验项。浏览器此前的工具拒绝保持，不通过这次API运行绕过。

当前脚本只启动原插件的隔离合成实例，不切换用户现有服务、不修改MacBook、不读旧库、不执行旧库迁移、不发布Git。
