> 当前结论（2026-10-15工程接收003）：正式0.5.1受控采用已工程接收，仅限受审冻结候选及离线合成／显式opt-in范围。后续限定CLI正式PASS与旧原生BLOCKED分列；旧段落按历史时点阅读。详见 [工程接收003](engineering-acceptance.md#正式-sdk-051-工程接收003--2026-10-15当前)。不扩展旧豁免，Provider／生产／Git停止线保持。

# SDK 0.5.1 受控采用增量001（现有 pi-r1-r4-repair）

2026-10-15 用户直接批准本任务正式0.5.1受控采用及受影响独立评审。沿用同一分支/工作树/WIP，不新建Change/任务/工作树，不重启功能开发。原归档、接受/豁免/失败结论按其精确旧身份保持历史有效，本增量单独记录，未宣称新包已验收。

## 最小工程合同与验收

- SDK051-ID：正式tgz148236bytes/SHA256 3af3f895a2466b7947b9b9b0025231f856e3a5c4773782c9dabd460e924bfad9，SRI依固定Release收据。仅使用已下载核验的同字节包；隔离 npm ci --offline --ignore-scripts --no-audit --no-fund，任务自有cache。解析必须本任务真实node_modules，53个非软链接安装文件逐字节匹配；151非根SDK依赖未变证据复用。保留旧包/安装和历史。
- SDK051-LOCK：产品package.json/lock仅根SDK路径及SDK版本/resolved/integrity更新；其余764条lock入口逐项相等，其他生产源码/配置/Task权限不变。先新专属安装树核验再采用；npm生命周期/Provider/凭据读取不执行。旧运行PID8407不重启，不将既有进程冒称新正式版会话。
- SDK051-ORACLE：现行安装/CI固定输入校验同步到正式包；旧 .3/.2/.4.3 tuple及负向/完整断言保留。仅版本/新hash/SRI/root校验常量与正式tuple增量，禁止动态读取当前值充当预期。测试健康入口先旧GREEN，换包后旧oracle预计不匹配属固定输入适用性证据，不伪造产品行为RED；接口/运行字节相同的原因果RED/GREEN按精确字节复用。
- SDK051-JOINT：实际本任务App→Pi Adapter→正式安装包→原生持久Session→IR/核验→Store→HTTP/client/UI。优先R1最终投影guard及物理准入/拒绝、R2ModelOutcome/原子known0/partial/UNKNOWN，再R4主备/恢复共once-extra，R3一次工具完成/回执/保存失败/准备正文及read九组/迟到/安全枚举读回。重跑适用既有测试与类型、固定安装/CI工具检查；不机械全量重跑，不引入新功能/断言语义。
- SDK051-REVIEW：完整候选/安装/输入/证据逐文件冻结后native juaner_validator fresh只读独立评审；原F-ROLE-01不扩展，实际角色/沙箱不符时正式BLOCKED与技术结论分开。独立角色不得修改候选。未授权CLI替代/Provider/服务/生产/Git写操作。

## 路径与边界

允许：package.json、package-lock.json、新vendor/pi-agent-runtime/0.5.1/固定hash.tgz、tools/harness/validation/prepare-ci-install.mjs及原测试、tests/integration/xanthil-local-analysis/local-analysis.integration.test.ts中的固定配置校验；本归档现有Change追加本增量/tasks/verification、自己项目板、必要范围说明。条件：仅身份与适用性所需最小修正；产品逻辑/其他测试体不改。外部证据根沿用r3-preparation-implementation-001/sdk-0.5.1-adoption-001。

禁止：其他工作树/项目/SDK源码/旧包字节、通用仓库/恢复机制、历史Task迁移/恢复/重放、Provider/真实业务/生产/常驻服务启动、Git index/ref/commit/push/merge。生产overhead/margin/image UNKNOWN；512/8192合成参数及961743bytes观察不放行。所有未知/已知消费、旧恢复字段、Skills/fork与原F-ROLE-01/BLOCKED保留。端点仅测试短命loopback，按原离线验证范围，无生产服务。

## 执行任务（当前）

- [x] 同任务HEAD cadeca0e/WIP、发布17附件及正式来源字节读回；当前主Agent有效模型/effort原生读回不可用，未冒称已验证；当前danger-full-access/never如实保留。
- [x] 旧固定输入基线17+1通过；新包专属离线npm ci716包exit0，53文件解析/lock核验。
- [x] 产品精确依赖与固定oracle已同步；旧tuple/负向保留；实际本任务node_modules已采用0.5.1，旧安装保留。
- [x] 6组互不重复最终测试700 PASS/0FAIL/0SKIP，最终类型exit0；R1/R2先行、R4/R3/read后续，包含三实际Chrome及刷新读回。命令/退出码、原不匹配失败与复用映射均保留。
- [x] 冻结2930文件候选，fresh native独立Validator完成120 PASS/类型及diff通过，正式BLOCKED F-ROLE-01／技术PASS，候选及53安装文件前后无漂移。
- [x] 回填真实采用/验证/独立结果与当前停止点；未授新豁免，新的正式工程接收仍BLOCKED，非无条件PASS。


## 本轮已执行身份与验证（待独立评审）

实际解析 file:///Users/bendandebaba/.codex/worktrees/pi-r1-r4-repair/JuanerAI/node_modules/pi-agent-runtime/dist/index.js；53文件匹配；产品lock仅root与SDK入口改变，其余764项相同。旧 .3 包和旧node_modules完整保留，不重启原PID8407。SDK运行23dist/41源码测试、151非rootlock不变依据发布读回复用。无生产代码变化；CI固定输入helper和原测试、local-analysis严格tuple只按固定新身份更新，保留旧tuple与负向，不动态生成测试期望。

当前最终700项：R1/R2原生40、持久账本/read迟到62、R4/R3/read/准备原生67、App/Workspace/HTTP208、local-analysis306、CI安装校验17；类型exit0，diff-checkexit0。不是全量产品/新CI或用户产品验收。首轮旧oracle两项exit1保留，非新功能RED。完整命令/退出码：/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/sdk-0.5.1-adoption-001/logs；身份/范围/证据复用见本目录JSON。


## 最终当前状态：已安装/已联合核验，正式评审BLOCKED（非新工程接受）

受审候选：HEAD cadeca0e75e5cbeac3fbc65fc58cce947283fa08＋2930文件WIP aggregate f2dac1193ac4057b0e24c6a3d4a7ac5aa1f0610c575c7a207de06be6b0d4e954。主Agent最终700 PASS，独立120 PASS，均0FAIL/0SKIP，类型/diff exit0。独立审查重算23dist/41SDK源码测试/151SDK非root/764产品其他lock相等，并亲自执行原生Session、最终guard、部分用量/UNKNOWN/保存失败、主备、read九组/旧历史/真实Store及HTTP/client/renderer关键链；作者三Chrome截图/刷新回执仅独立审阅，非Validator亲自重跑UI。完整原始报告与receipt在证据根independent-review-001，report SHA256 c318c7c831dbae32cd270d4f3966efd64d8c6fc729fec9832c34f6a252c83ab8。

独立正式结论BLOCKED F-ROLE-01：实际danger-full-access/never/network enabled，未建立强制只读；声明native Sol/high，实际推理telemetry不可独立读回。只读行为与2930/53前后哈希一致不是强制沙箱证据。未发现需修产品逻辑的技术缺陷。原精确候选豁免不适用，当前无新豁免；不得写无条件Validator PASS或新的Engineering/Product Acceptance。

NEXT_ACTION／真实停止点：仅剩本新候选独立角色/沙箱合规边界。返回条件为支持并可核验的原生角色/model/effort/read-only环境下fresh评审，或用户另就本精确候选具名残余风险作决定；匹配技术证据可复用，不重启功能工程或重复请求启动权限。未经该处理不作正式工程接收，不发布/提交/推送/合并，不自动回滚/清账/重放。Provider/生产/历史Task等原停止线不变，生产参数UNKNOWN。正式包已本任务本机采用，但不等于生产激活或用户对新候选的产品接受；旧候选接受和豁免保持原件。全部当前任务完成勾选仅指本次授权安装/验证/评审及记录已执行，不把正式BLOCKED勾为PASS。


## 正式 SDK 0.5.1 工程接收003 · 2026-10-15（当前）

以 [工程接收003](engineering-acceptance.md#正式-sdk-051-工程接收003--2026-10-15当前) 为本增量当前结论及NEXT_ACTION。独立CLI原件 `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/sdk-0.5.1-adoption-001/independent-cli-readonly-002/report.md`，SHA256 `54eca02a35efdd7de9b8bf26614bfabf3efe0f1a48c47251bea7ad0b69856064`。记录层独立前后身份见 `/Users/bendandebaba/JuanerAI-artifacts/pi-r1-r4-repair/r3-preparation-implementation-001/sdk-0.5.1-adoption-001/engineering-acceptance-records-003`；历史报告／收据／失败不变。
