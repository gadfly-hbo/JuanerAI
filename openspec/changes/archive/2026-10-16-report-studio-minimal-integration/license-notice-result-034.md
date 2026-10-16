# 034：固定buffers许可通知补齐与离线重封装

2026-10-16。用户“允许034全部离线范围”。原分支`work/mac-mini/report-studio-integration`、HEAD`1446276011917ec46b369eadaed40c059db46b34`和原WIP保留。仅供应封装、必要资源合同测试及通知/来源资料改变；不改功能、SDK、依赖、锁、模型、凭据、用户配置/数据或UI。当前**作者离线检查及034独立受影响复核PASS**，不预填工程接受、安装、Git或部署。

## 最小变更

- vendor新增`licenses/buffers-0.1.1/NOTICE.txt`、`provenance.json`，引用James Halliday许可提交`1b745ee35d33eb166e15ef1866073a07c6d7de87`及固定Debian版权/文本记录。原六文件字节作为不可执行JSON测试资料保存；另保留原作者许可patch，不加载其中代码。固定source.tar不变。
- `build-bundle.mjs`仅识别该固定依赖，核对版本、原license空值及六文件hash/实际路径；拒绝文件篡改、改名、版本变化及链接。核对在创建输出前完成。原第三方package.json、README、运行代码和所有依赖字节不改。
- 原manifest机制仅增两份licenses资源；dependency-notices.json保留原`license:null`并附MIT/X11→MIT解析依据、通知/来源位置。原总体`redistribution_review:PENDING`保留，不把单包补证伪称整应用法律保证或抹去其他UNKNOWN。

原作者patch为2012年许可声明，版权/正文采用所引Debian固定记录的2015 James Halliday信息，来源各自标明，不混称年份出自原npm包。六文件比较中四份代码/示例/测试原字节与许可提交相同，README/package.json仅增加许可声明；403/API和原404失败不回填。

## RED／GREEN与实际包

正向测试先因果RED：composer正常输出但缺少固定许可通知；最小接线GREEN。随后改名元数据绕过选择器的独立反例先RED，固定路径/名称双核对GREEN。永久资源合同共45PASS（原33全部保留，新增12），无skip/todo/删弱断言。

canonical `tools/harness/validation/run --portable`最终17组退出0：**4840 tests／4816 PASS／0 FAIL／24历史SKIP**，含syntax/typecheck及当前45项合同。首轮误用不含Python的bin，系统Python3.9缺tomllib，原16条配置夹具失败保留；第二轮正确工具链但新证据父目录未创建，原mkdtemp失败保留。只纠正命令环境/证据父目录，未改测试断言或共享工具链，未安装软件；两次错误不作产品RED，也不把其日志改成成功。

最终新模块manifest：`d59d0554314c7e3c832944dd9f6bc6c8a31df3b7c862b119bd7a540c5551da19`，版本仍`0.1.0-juanerai.1`/协议1/原供应74ebb609；22716资源。原22714中仅通知索引变化，新增两份通知/来源文件，其他22713项逐字相同；原Node/Chromium/SDK/全部功能代码/锁保持。实际新应用内的公共Bundle校验ready，旧8fe218b1身份针对此新包返回incompatible，未做服务启动/渲染烟测或Provider。

离线应用复用完整读回的固定027代码外壳，ditto到新的任务目录，仅替换上述通知、模块manifest和report-studio-deployment身份，再用既有`seal-internal-app.cjs`原规则ad-hoc签封；**不声称重新编译了宿主或运行新功能**。应用25593项：新增2文件，原项仅主程序签名、CodeResources、模块manifest、部署身份和通知索引5项不同。主程序去除LC_CODE_SIGNATURE封印后的完整payload完全相同，SHA `82782817ce2277096da65c025a304d647503f75514b29fe69c0a64d71f4bdeb1`；app.asar及其他25586旧项逐字相同。签名deep/strict退出0，无新entitlements、hardened-runtime、Keychain身份或安全设置变化；不是Developer ID/公证或干净机证明。

可交付离线ZIP为468266662bytes，SHA `793a67d1a2aa9f6e5682563a07c07ee6fa1e62a235e83174e62c9998b95fa4a0`；CRC、全部25593应用文件/链接逐项长度hash/链接目标通过。首个ZIP使用默认AppleDouble内联元数据，严格检查遇`._CodeResources`而停止，原文件/失败保留；第二份不同文件名用标准`--sequesterRsrc`把EA移到`__MACOSX`并保留，应用内容不变，不隐去签名或丢元数据。

## 保全与边界

实际Mini安装仍原027/8fe218b1、25591项/签名不变；033结束的159项真实Studio文件/链接逐项不变，原Task27模型35工具/预留0、所有其他预算/原010及019消费UNKNOWN/两份16384与A2048保留。033两页/三格式/交付2接受及032失败交付1不重做/不回填；原原生编辑/PDF检索UNKNOWN/较大图/主备/物理中断及页签限制保持。

本轮没有实际安装、真实应用/服务启动、产品Provider、MacBook操作、部署或Git提交/推送/PR/合并。所运行canonical使用隔离合成夹具和强制关闭真实模型门，许可公开文本/补丁查证不等于产品Provider调用。整个034完整候选和证据将固定后交031既有Sol/high/read-only通道只复核受影响及关联风险，复用仍有效的031/033机制/产品/UI接受。

## 固定位置

原持久根`/Users/bendandebaba/JuanerAI-artifacts/reports-factory-assessment-20261015/engineering-intake-20261016/engineering-closeout-030/license-followup-034/offline-candidate-034/`：

- 最终模块`report-studio-034-final/`、`identity-034.json`和逐项`bundle-equivalence-034.json`。
- 应用`native-034-resources/Xanthil.app`、`candidate-app-manifest-034.json`、`app-equivalence-preservation-034.json`、实际签封命令/退出。
- ZIP `Xanthil-native034-arm64-delivery.zip`及`archive-readback-034.json`；首个失败ZIP仍保留。
- 因果RED、45项GREEN、canonical三次实际日志/退出/最终汇总、原作者patch、固定源资料与所有可重放的本地构建/核对脚本。

后续实际安装需要新候选/差异/备份/回滚的具体授权；本轮不自动执行。required CI、正式Git交付/归档及实际安装采用各自单列，C5-09/N11保持IN_PROGRESS、40稳定ID正式接受增量0。


## 034独立结果与实际下一边界

034独立Sol/high/read-only/never受影响验证PASS，exit0/453.02秒；3178项源码及28收据、22716资源/25593应用项/交付ZIP逐项核实，G031-04具体buffers通知缺口在固定新候选闭合，无新增实现缺陷。原031历史BLOCKED不回填；原PENDING不改成整体法律保证。新包功能字节等价，033接受/032失败及全部UNKNOWN/未知预留保持。两机实际安装仍027，034未启动应用/服务、Provider/安装/MacBook写入/部署/Git均0。035只申请两机用户目录通知包更新、备份回滚及只读保全核对，不启动服务/重复样张，不新增Provider；未批准不执行。required CI/Git集成/适用归档和正式工程接受仍独立待办，C5-09/N11保持IN_PROGRESS、40ID正式接受增量0。

见[独立完整原文](independent-validator-result-034.md)及[035待审安装范围](notice-install-authorization-035.md)。本段更新当前结论，前文待批准/作者复核阶段是历史时点，原始失败和未验证未回填。
