# RS-GATEWAY-01：固定内置实例的宿主通信

Application 的 Studio Port 由专用 HTTP Adapter 实现。只接受组合根给出的 literal 127.0.0.1 HTTP origin、随机 owner token 和固定供应版本/提交；调用不扫描端口、不发现独立版、不跟随重定向。每次操作先核对实际服务协议和供应身份。

- 请求有超时及响应大小上限。未授权、非 JSON、协议不符、身份错配、重定向、过大或格式损坏均拒绝，不重试变更、不转其他实例。
- 创建关联只发送固定 snapshot；项目不存在只由明确404表达，其他错误不能伪装为不存在。项目、association、snapshot身份按闭合v1响应核对。
- 导出必须匹配指定project/export、支持格式和合法时间、规范base64、非空受限字节、SHA256；完整保留质检警告。owner token只放专用请求头，不进入URL/异常消息/返回值。
- 实际供应服务与Application/SQLite的合成材料链路需离线验证；不调用Provider，不证明UI、独立进程或安装版完成。
