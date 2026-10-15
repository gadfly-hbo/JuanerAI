# 上轮19项跳过逐项原因与补验（2026-10-14）

原始记录：`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-correction-001/canonical-portable.log`：4443项、4424通过、19跳过。原日志不改。

本次证据：`/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-output-002/`。下面18项已补验PASS；第4项真实Provider仍未执行。补验都是本机证据，不替代Hosted CI、新SDK安装、Desktop打包/GUI或Product Acceptance。新canonical保留其真实统计，不能将原19改写为“当时通过”。

| # | 原测试 | 当时跳过原因 | 本次结果/证据 | 适用返回点 |
|---|---|---|---|---|
| 1 | CI-SOURCE-001 verified raw archive changes only three transport fields | 未提供JUANERAI_CI_NODE_GYP_ARCHIVE；本地明确NOT RUN | PASS，ci-skip-complements.log | 本次从任务自己的npm cache取固定raw tgz、独立验证SHA512 SRI再运行；未来final-head Hosted CI仍必须实际跑 |
| 2 | CI-SOURCE-002 isolated prepare/finalize safety | 同上，原始批准归档缺显式输入 | PASS，同日志 | 以后manifest/lock/CI install view变更时继续使用同固定raw归档，不把本地PASS当Cloud执行 |
| 3 | CI-SOURCE-142 retained Pi publisher integrity | 同上，cloud archive proof组条件跳过 | PASS，同日志 | 保留0.84.2兼容SRI/缺字段拒绝；本轮未重新请求Publisher，不用版本号代替字节身份 |
| 4 | TEST-XCLI-013 real Pi acceptance | XANTHIL_REAL_PI_ACCEPTANCE未开启；canonical主动unset | NOT RUN，保持跳过 | 须本Change另行明确Provider/模型/数据边界与预算授权、专用命令；不复用历史TASK-009授权，也不通过开env自行取得权限 |
| 5 | OA-RT04/Q11-01 actual first browser submit/Stop/later task | 未显式选本机JUANERAI_BROWSER_ACCEPTANCE_EXECUTABLE | PASS，skipped-host-complements.log | 使用已存在Chrome二进制、task-local synthetic service、headless；未来受影响Browser回归重用实际环境，无下载，无生产服务切换 |
| 6 | OA-RT05 B3 three successful code steps | JUANERAI_OPEN_CODE_HOST_TEST未设1 | PASS，上轮code-host-002.log及本次skipped-host-complements.log | 既有task toolchain +本地build descriptor；代码/执行器变更受影响回归 |
| 7 | OA-RT05 B3 one correction/changed plan/UNKNOWN | 同上 | PASS，同上 | 同scope、持久纠错与UNKNOWN拒绝仍须保留，新SDK恢复语义还需联合 |
| 8 | R1-CODE-HOST plain program | 同上 | PASS，同上 | 真实受控Python、筛选/独立核验/未核验探索；新read输出影响需再联合 |
| 9 | R1-CODE-HOST source line array | 同上 | PASS，同上 | 同上，保留字面转义及行数组契约，不自动修复 |
| 10 | R1-CODE-HOST outside/network/shell/reopen | 同上 | PASS，同上 | 不扩大sandbox、不借权限清UNKNOWN；新SDK工具边界变化重跑 |
| 11 | R1-CODE02 successful exploration is not retry | 同上 | PASS，同上 | 成功正常调查与失败恢复分开；一次额外模型恢复另验 |
| 12 | R1-CODE06 syntax rejection correction | 同上 | PASS，同上 | 保留not_started与一次实际纠正，不把语法失败误作已执行或退款 |
| 13 | R1-RT20 actual safe payload diagnostic | 同上 | PASS，同上 | 保留精确故障位置、无原异常/host路径；新版Provider诊断不同接缝仍待API |
| 14 | VC-05 conservation true | 同上 | PASS，skipped-host-complements.log | 限定守恒检查不是探索逐项独立proof；生产全量IR保留 |
| 15 | VC-05 conservation false | 同上 | PASS，同日志 | 未守恒保持failed/not_performed和具体限制，不假阳性 |
| 16 | OA-S01 configured installed PDF all pages | 未提供JUANERAI_DOCUMENT_PYTHON | PASS，document-skip-complements.log | 使用app现有bundled Python/pypdf，实际全页/位置/hash；将来reader或资料边界变更时重跑 |
| 17 | OA-S01 legacy Office synthetic doc/ppt | 未提供JUANERAI_SOFFICE | PASS，office-skip-complement-002.log | bundled soffice wrapper初次失败（见下文）；直接真实.app executable绑定，macros/network/read/write隔离均保持 |
| 18 | OA-S01 selected image OCR | 未提供JUANERAI_IMAGE_READER | PASS，ocr-skip-complement.log | 将仓库已有Swift/Vision reader编译到本任务证据根；不是安装/部署启用。置信度/OCR未确认身份保留 |
| 19 | OA-S01 scanned/mixed PDF OCR | 缺DOCUMENT_PYTHON或IMAGE_READER | PASS，document-skip-complements.log | 现有bundled pypdf/pypdfium2 +本任务原生OCR；扫描页不因其他文字页变成已确认 |

## 校验和历史失败

- node-gyp原始归档564012 bytes，SHA256 `f357931ae77e0e49f2044de30a75f5bb096fc76948e5baa26c29aa0fac285f31`；SHA512匹配CI批准的SRI。副本在approved-node-gyp-archive.tgz，locator/独立校验在ci-archive-resource.json。没有改package.json/lock或SDK包。
- 编译的是已有 `adapters/analytics-duckdb/open-image-reader.swift`，保存在本任务 `open-image-reader`，stdout/exit在ocr-build.log/exit；未安装到应用/服务。
- DOC/PDF包来自load_workspace_dependencies提供的本机既有bundle26.1011.11113，未安装新库、未访问其他在研项目。各可执行/依赖身份在host-resource-identity.json记录。
- 首次Office补验用了bundle的override/soffice shell wrapper。它实际exec至别处的.app，而原sandbox按传入exe定位允许app root，结果exit -6/SOURCE_LEGACY_CONVERSION_FAILED。保留document-skip-complements.log和task-local conversion.log/process receipt；修正为wrapper所指向的真实.app二进制后通过。没有放宽sandbox、网络或文件允许范围；原因是资源绑定错误，不算产品RED。
- 首次native-fault proof-save测试把未保存的verified_steps缺失值当数组，TypeError失败；改为明确零记录判断后6/6通过。保留native-fault.log，正式结果native-fault-002.log。不是SDK缺陷或产品RED。
- 动态登记首次子任务夹具漏两个已存在必填payload字段，CHILD_PROTOCOL_INVALID；保留dynamic-inventory-attempt1.log，补齐既有合同后27名称/10phase登记成功。不是产品RED。
- 新semantic helper首次typecheck遗漏type import；typecheck-final.log/exit保留失败，修复导入后由canonical重新检查。行为RED只计projection-red.log及semantic-red.log中指向缺失投影的断言。

最终canonical-portable-003.log/exit0：4454通过、1真实Provider跳过、0失败（总4455），18项条件项在该完整离线回归中也已实际启用。第一次全回归用户message兼容失败、第二次旧证据文件EEXIST均保留；没有改变原19项当时的结果。
