# Xanthil Desktop 本地开发

复用已安装的 Node 26、Forge、Vite、React、Electron、DuckDB 和 Python。不要为此安装依赖或更新 lockfile。

## 数据和凭据

开发目录首次必须是空目录，随后用专属标记识别。`user-data`、`cache`、`logs` 和 `Projects` 独立于安装版。创建项目时选择 `Projects` 下的新目录；导入和导出路径也必须位于开发根目录内。只放入获准的合成输入，不复制原有用户项目作为测试材料。符号链接不能逃逸到外部目录。

开发版本使用独立 Keychain 服务 `com.juanerai.xanthil.development.xiaomi-token-plan-cn`，生产默认服务保持不变。它不导入生产 key，不读取 `.zcode`，也不继承环境中的模型激活或 key。模型设置界面和业务语义沿用产品；明确输入开发凭据后仍须遵守原模型调用授权。此补充的验证不调用真实 Provider。

## 验收与版本

HMR 工作区一直在变化，不能作为正式固定代码验收结果。正式验收前停止编辑，绑定完整代码、测试输入、Main/Preload 输出、Renderer/Vite 配置和运行时身份，执行所需真实路径并保留原始结果，再交独立 Validator。

安装包还需要与影响匹配的资源、运行时、签名和安装验证。多个已验收 Change 可以积累成一个稳定版本/DMG；该发布仍需其独立授权和检查。本补充不修改已交付 DMG011，也不要求重新发布它。
