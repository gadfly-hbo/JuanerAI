# Report Studio 固定内置构建（实施中）

本目录是JuanerAI对独立供应项目的有界集成配方，不是通用插件平台，不修改MacBook独立仓库。正式输入见 `openspec/changes/report-studio-minimal-integration/` 与已冻结产品包。

- `vendor/reports-factory/74ebb609/source.tar` 是固定提交的选定普通源码/资源输入，无业务data/work/认证；身份见同目录source-identity.json。
- `prepare-source.mjs <explicit-isolated-source>` 只接受该固定源码的精确SHA，应用明确内置兼容编辑及复制本仓库supplier模板；未知或半补丁拒绝。每次修改模板后须重新准备并构建。历史隔离构建不能作为最终候选。
- 依赖安装、浏览器下载单独授权后，使用供应原锁和既有Node26/npm11；本任务已取得隔离授权。`npm run build` 编译服务，`VITE_REPORT_STUDIO_BUILTIN=1 npm run build:web` 构建内置前端；独立源默认构建不启用bootstrap。
- `build-bundle.mjs <explicit-recipe.json>` 从明确构建目录、Node/许可、本模块原生helper及固定SHA、Playwright1.63.0 revision1243 headless-shell产生新的完整资源树和manifest；不安装、下载、覆盖或启动。大树复制采用APFS可用时clonefile，目标与源为不同文件身份。
- 随包候选含bin/node、bin/report-studio-keychain、studio/dist、web-dist、assets、node_modules、package/lock、browser/chromium_headless_shell-1243及license索引。保留依赖自带许可，完整再分发核查仍PENDING。字体使用系统中文字体；未附带Chrome个人资料/.links或可视Chrome app的framework软链。
- `bundle-smoke.mjs <bundle-root> <identity.json> <persistent-evidence-dir>` 在调用者明确的本机合成证据目录，校验完整资源、通过Personal运行器启动/关闭独立服务，使用随包Node/浏览器生成合成PPTX、HTML、PDF、PNG，记录字节/hash。无Provider、系统安装或部署；不替代干净两机/Keynote/用户产品接受。
- `supplier-service.test.mjs` / `supplier-browser.test.mjs` 必须明确隔离供应目录与built-in模式；在无密钥环境运行。浏览器检查还须指定本任务 `PLAYWRIGHT_BROWSERS_PATH`。这些是显式实际供应测试，不伪称canonical已自动执行它们。

`package.mjs <explicit-recipe.json>` 已接通原Electron Forge离线安装载体组装：只接受已核对的可再定位工具链/固定Studio包/现有Electron zip，写入新任务目录；不安装、启动或部署应用。菜单与退出选择编排已实现；Mini用户目录候选已实际安装/启动并验证无模型入口与空闲正常退出，在途任务的原生三选项尚未验收。独立配置、逐效果授权、主/图片同账、原生执行收尾、停止/UNKNOWN显式核对和本地三格式导出已有离线子范围证据；Studio来源/返回/显式交付已有固定包主链证据；最终完整回归/验证、许可审查、双机和Provider验收仍待完成。版本hash须在最终构建后固定，不能采用当前中间候选或自报最新版本。

`supplier-image-purpose.test.mjs`使用固定供应SDK与合成transport验证同任务主/图片用途账本、授权拒绝和实际SessionHost工具准入；不调用真实Provider。临时能力探针的历史失败及当前永久回归见Change verification。

Mini Keynote14.4实际试用发现固定PptxGenJS4.0.1嵌入工作簿table范围多出尾部单引号，导致原生图表被丢弃。`supplier/pptx-compat.ts`由配方复制，只在内置PPTX导出副本修正该字符；源deck、其他部件、独立版和合法产物不变。永久RS-PPTX-COMPAT-01先RED再GREEN，实际Keynote四类原生编辑/保存/关闭重开已通过合成子范围；旧失败与iCloud自动另存偏差保留，详见verification022。用户随后批准更新，native-004现已安装到Mini原试用入口；旧native-003保留，安装代码合成导出及Keynote四类编辑/关闭重开、空闲正常退出复验通过。详见verification023和待批acceptance-authorization-003；真实Provider/MacBook/部署/Git未执行。

用户随后批准请求003 A/B/C；MiniMax真实两页生成/三格式保存已验，图片理解一次CONFIGURATION_CHANGED触发失败停止线。离线实际SDK探针定位image purpose模型2048与transport绑定32768不一致，尚未修复，未知预留不清。MacBook固定包安装/资源/离线输出/退出通过，编辑缺证据由用户知悉接受为后续实际体验；完整结果见acceptance-result-003。真实MiMo/剩余A场景、完整质量与正式接受未完成，SDK/锁不动、部署/Git仍停止。

后续用户批准的修复已完成：图片purpose/transport同源2048，严格SDK护栏不变；Mini更新native005，MacBook仍native004。供应61PASS、canonical013为4804PASS/0FAIL/24SKIP、包内和宿主主链通过。额外一次真实图片补测不再配置冲突，但模型未读图，产品仍返回未完成理解；该项FAIL，旧2048未知预留不清，当前等待请求004决定，不自动重复。上述历史“尚未修复”保留其原时点，现状以Change增量026和实际结果004为准；未完成项不提升。

请求004批准后，native006实际图片理解及A定向修改通过；图片Adapter在既定SDK准入后的专属transport携带原获准小图，模型/工具/purpose配置身份不变，14图片/64供应/完整4804PASS。较大图旧工具路径受SDK1MiB工具结果限制，未解决；原框架页签标题差异保留。原生退出三选项和收尾实测成立，实际中断因任务提前自然完成仍NOT_PROVEN。B密钥及正常UI配置安排等待用户；原次数有效、不自动代删MiniMax配置。所有旧失败/2048未知/其他缺口保留，现状以Change验证028和接续005为准；部署/Git仍禁止。

MiMo能力更正（验证029）：固定mimo-v2.6-flash官方为全模态；本集成当前input:['text']及仅MiniMax图片purpose是接线范围，不是MiMo不支持图片。未据此变更旧任务配置或追加真实图片调用；正式收尾须修正容易误导的产品措辞。B用户已保存MiMo，但两家均在时仍先走MiniMax，单独MiMo场景待本人按005准备；次数未使用。

MiMo图像增量007：新项目固定MiniMax/MiMo两个图片purpose，内置配置仅MiMo时选MiMo；主文字声明不表示模型不能识图。旧任务固定原purpose计划，不迁移账本；私有计划标记损坏/链接拒绝。旧项目的MiMo图片提示转新项目使用，不自动重试旧失败。详见Change的mimo-vision-007.md及RS-IMAGE-04/RS-COMPAT-02。真实小图MiMo理解已单独通过；这不提升完整Change、较大图、主备真实回退或正式发布的验收状态。

主制作截图修复：第一次B文字生成在look_page后因MiMo主purpose仍text而INVALID_REQUEST（FAIL保留）。最终新项目默认dual-v3，MiMo主制作/备用与图片purpose均支持图像；既存v1/v2不迁移。实际SDK+真实本地look_page及重开兼容已纳入70项供应回归；新版真实两页补测仍待追加授权。不能将native007图片理解PASS推广为新版完整制作或完整Change通过。

034许可通知增量：仅固定buffers0.1.1的历史license空字段建立原作者声明/精确六文件绑定。vendor licenses中的NOTICE/provenance按原manifest随包，原第三方元数据不改、总体PENDING不被构建器冒充审查结论；改名/改版本/改文件/链接在输出前拒绝。source-fixture.json仅为不执行的公开测试字节，不进入运行包。034实际离线候选复用027功能外壳，仅通知和身份/签封变化；45合同及4816PASS/24旧SKIP、实际逐字等价通过，未安装或启动真实服务。证据及现状见Change license-notice-result-034与后续独立补证；旧正文各时点不回填。
