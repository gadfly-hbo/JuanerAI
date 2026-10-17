# Report Studio 固定供应构建输入

来源 `https://github.com/gadfly-hbo/reports_factory.git`，提交 `74ebb609fd73cf263614ffc9301dafaafcec4230`。source.tar 为 `git archive` 选定代码/构建资源，共81文件；不含 data、work、samples、.pi、.zcode、.flow、认证或独立版用户项目。

身份、完整文件清单和许可待办见 source-identity.json。原始包仅作可重复构建输入，不是已安装/已验收/可发布版本。package.json声明ISC，所有传递依赖、Chromium/资源/字体的再分发核对尚待完成，不能凭此文件宣称已具备发布资格。

供应源码仍独立演进；宿主只选择固定提交，兼容补丁在 tools/report-studio/prepare-source.mjs。未知源码拒绝，不追最新分支、不修改MacBook工作树。宿主SDK0.5.1和供应SDK0.4.1分别固定；SDK源码不分叉。
