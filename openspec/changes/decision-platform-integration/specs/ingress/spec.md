# 实际HTTP入站保护

源自已批准UI/产品边界、kickoff §5及接入标准C03/C05。仅宿主Adapter私有装配，不引入业务或持久合同。

## DP-INGRESS-01 先鉴权后业务

宿主在固定startServer返回后同一同步栈接管唯一request listener。未经64位hex owner token、IPv4回环远端及实际监听Host匹配的请求不得调用原业务listener。合法GET/POST/PATCH必须原样传递且只调用一次。错token、缺token、非回环Host、重复敏感头均返回403且零业务效果。

## DP-INGRESS-02 无浏览器或协议侧路

任何Origin/Cookie/Fetch Metadata头、绝对URL/双斜线/点路径/编码路径、非GET/POST/PATCH、非JSON写入或Content-Encoding均拒绝。Expect、Upgrade、CONNECT不得绕过request guard。owner秘密不回显。该端口不是浏览器页面入口。

## DP-INGRESS-03 装配及关闭

非唯一request listener、已经开始listening、已有checkContinue/checkExpectation/upgrade/connect handler或不合法token应拒绝装配，不能默默移除未知应用handler。撤销只关闭新准入，不关闭/杀死陌生进程，也不把已发业务标作已取消。组合入口负责失败时关闭其自有Server，未验证guard前不得发送ready。

## 验收与命令

`node --test tests/integration/decision-platform/ingress.integration.test.ts`使用真实原生HTTP/TCP合成服务器；不导入、不启动固定插件。覆盖批准请求以及上述拒绝边界，明确记录先RED后GREEN。完整插件listener接线须另验，不能由此fixture替代。
