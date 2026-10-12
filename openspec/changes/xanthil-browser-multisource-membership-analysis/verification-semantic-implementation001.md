# C04实际实现与验证（待完整候选独立结论）

原任务、分支work/mac-mini/n01-n02-browser-membership、HEAD037e3f8fd8e694000428d65384a545879f1d6f9a及所有原WIP保留。批准输入a940947ece8a07d4777da21e30cfd89ff2d3b76c＋五时刻0c6834d52eaa5da25f107117e7b545098c8ddace；原UI不重设计。用户本轮明确要求实际实施。仅主Agent执行，最终独立Sol/high只读Validator；自动跟进PAUSED，用户验收尚未通过，Git/安装/真实用户资料范围无扩大。

唯一证据根：/Users/bendandebaba/JuanerAI-artifacts/n01-n02/controller/v11-semantic-implementation-001。

## REQ/AC → 程序与证据
- Q11-UX-C04、FM-A01：Semantic1.1的真实消息来源/范围及规范值验证，USER_INTERPRETED不冒称人工确认；Context1.2和Store独立读回。semantic-red001缺少compiler→semantic-green001（10PASS）；preimage.json保存旧源码。application-red001缺少实际tool→application-green001（30PASS）。保留旧1.0 literal compiler/readback及全部旧断言，不迁移历史。
- Q11-UX-C04、OA-C01、FM-X：IR1.8在现有IR/计算器上消费实际输入/输出倍率；绑定字段精确覆盖，不猜汇率/不改原件；退款每个输入独立换算后扣减，Adapter独立逆序原行复核；单位进入binding/plan hash及版本影响。measure-red001不支持IR1.8→measure-green001（5PASS）。单源精确平均/伪造输出/改绑/源不变等负例进入affected004。
- 实际SDK简化：sdk-red001缺少每维度unit被SDK拒绝→sdk-green001可缺省非单位维度；binding-red001缺少分离单位工具→binding-green001实际消费390000元；context-red001缺上一实际提问→context-green001提供真实提问；ui-red001错误显示人工选择→ui-green001显示本次理解。上述目录exit.json记录实际命令、退出码及耗时；早期平面日志工具实际退出码见原会话，不伪造独立时间签名。
- Q11-UX-C04、Q11-12、OA-RT04/05：browser003生产Profile/Application/HTTP/真实Chrome走普通发送补充→revision2→本地91/2万元→独立核验→保存/刷新；零Stop/Preview/Adopt、零Provider、原waiting历史及原分析标题保留。完整真实Provider另见下项。
- OA-RT01/02/06：real-primary005主MiniMax-M3真实多轮4调用PASS（91/2万元）；real-backup001备用真实另一自然表述7调用PASS，原Model配置/指定来源私有凭据/Pi/持久账本/每操作一次额外请求上限未改变。最新统一候选的备用补验随后收回，不能用UI回放代替。所有材料为任务合成文件，未使用用户试用资料。

## 失败、修正及尚未完成
real-primary001实际FAIL8调用（嵌套单位必填导致接口误用）；002实际FAIL5调用（虽算术核验但输入/输出单位理解错误）；003实际FAIL4调用（工具结构错误而未完成）；004实际FAIL4调用（重复追问已理解单位）。不追认成功、不覆盖原项目/主机/portable历史。affected002一次新增单源测试期望写错（12和9均值是10.5不是5.5）真实FAIL保留，修正测试算术而非降低断言；affected004当前223PASS/0SKIP。此前工程累计379调用/16历史UNKNOWN；本增量调用由resources记录逐次累计，失败也计入，不按余额猜消耗。

完整canonical001、固定候选manifest、独立最终Validator、Mini同profile受控刷新与用户验收仍需收回/执行。已有同Change Validator宿主权限差异仅按用户原明确只读行为豁免处理，不能声称内核只读已加载。首选正常Mini网页服务入口；不得自动重放用户草稿或执行旧跟进。原初次项目选择错误提示缺口继续保留，并不因本次语义通过而关闭。

原有完整历史见[verification.md](verification.md)、[C03完成索引](verification-clarification003.md)、[C04设计接收历史](verification-semantic-design001.md)；产品验收待用户。

最终相同产品代码：real-primary0054调用、real-backup0027调用均PASS，后者另一表述同样真实多轮/绑定/计算/核验/保存。Canonical001因新测试登记缺失而真实FAIL；仅注册fixture的继任002须完整重跑，不改原失败。独立结论仍待收回。

## 独立002 FAIL → 必需绑定执行资格继任
Validator011核对2539输入一致、33纯CorePASS，发现C04-B01：390000元可以在缺少单位绑定时被label为390000万元。独立FAIL及unit-bypass-red001、unit-eligibility-red001保留。Context阻断缺少绑定，Application计算/缓存及最终保存入口重核最新度量对应的真实计划；MEASURE_REQUIRED工具反馈自动bind_measurement，不增人审。正式新增实际/缓存计算/缓存直接保存三负例零verify/零outcome，合法绑定390000→39。旧正例增加必要实际绑定且全部原断言保留。unit-bypass-green001、unit-eligibility-green00240PASS；affected005227PASS；typecheck005缺测试checkpoint正式字段FAIL保留，补version/turn/messages后typecheck006PASS。继任003完整回归、当前实际主备及真实网页/独立复核随后收回，不用002离线PASS代替。

## 对话上下文与当前继任004
保留primary006/007/009真实含义失准，primary010理解正确但无分组空字符串PLAN_INVALID/8轮未完成，primary008启动路径笔误零Provider/无result，未覆盖。dialogue-red001→green001：当前真实澄清问句接回已有标准Runtime消息，无短语解析/新Schema/Pi泄漏。已有度量已真实重编译框架时返回calculate_and_verify，避免重复重填；执行硬边界保持。primary011真实4调用PASS/91/2万元；browser006实际Chrome自动接续/计算/独立核验/保存PASS。affected008228PASS/0SKIP；完整Canonical003虽exit0，但运行间程序修正source_stable=false，不能记固定候选PASS。继任004需完整重跑。
backup006实际算455000元（等价45.50万元）/5调用，但原脚本固定要求万元因此ASSERTION FAIL，保留。用户仅说原始资料单位、不要求展示单位；继任私有合成探针进一步检查所有输入scale10000、CNY、输出label等于实际绑定、value×output_scale精确等于455000，支持合法显示换算；不允许原始输入误设1，更不允许错标签。正式永久测试断言未删除。backup007及最终固定候选004证据/独立结论随后收回。

## 独立004 FAIL → 保留非货币原单位能力的继任005
Canonical004完整17组PASS、source_stable=true、421程序输入无变化；独立011二次审阅B01关闭，但B02实际FAIL：数量2和3的既有求和／平均／分组被新货币单位要求阻断。原candidate004-result.json保留FAIL。修复前在spec/design/engineering-decisions闭合私有可选unscaled_unit：LLM声明非货币、无换算且输入输出label一致，不虚构币种、不新增中文词典；旧记录无字段不改变原形。金额仍必须实际字段／币种／倍率绑定；任意异label、错维度、伪造读回拒绝。unscaled-red001预期FAIL；green001遗漏compiler闭合字段FAIL、green002分组JSON键序断言FAIL保留，green003核心5PASS。非货币生产工具经已安装Pi参数校验→真实IR→计算11件→独立核验→成果保存，nonmonetary-integration001错误SDK导入FAIL，修正既有加载入口后00238PASS。affected010当前230PASS/0SKIP、typecheck007PASS、browser007真实Chrome正常自动补充／核验／保存PASS。primary012真实4调用PASS（91/2万元，输入实际10000）；备用及非货币真实模型验证正在收回，不把纯模拟当泛化证据。完整005尚待冻结／canonical／独立复核，原试用服务未宣称加载。

B02真实泛化补验：nonmonetary-primary001正确理解件但过度确认FAIL/3调用，002过早调用计算FRAMEWORK_REQUIRED FAIL/2调用；003真实4调用PASS/5件、无虚构币种，原失败与消耗保留。通用资料观察指引调整不解析短语；framework-feedback-red001→green001证明缺少框架时零计算，模型显式补齐后实际核验保存。primary013真实7调用FAIL：SEMANTIC_CONFLICT立即锁住工具，阻断模型更新已有解释。conflict-feedback-red001→green00140应用PASS：Semantic1.1仅向模型反馈冲突并允许按已有真实对话更新，未解到本轮结束仍waiting／零成果；实际ask_user和旧1.0等待边界不变。当前继任005完整回归、真实主备、浏览器及独立结果须收回，不追认先前输入为005。

005真实补验收回：backup009实际7调用PASS；nonmonetary-primary004实际7调用PASS／5件／本地独立核验保存（003实为5调用，上一段4调用记述更正，原账本不改）。primary014实际6调用生成455000元，与45.50万元等价，但旧脚本固定万元断言FAIL；继任短答探针检查所有输入倍率10000、实际输出单位匹配且物理金额455000CNY，不删除原失败。primary015实际6调用输入误作元FAIL，完整保留，不将算术核验当含义正确。Canonical005 source_stable=true却typecheck FAIL：新增waiting分支返回类型未提供question，继任修正真实waiting回执包含已保存问题、返回state字面量；typecheck008仍FAIL保留，009待收回。当前主模型短答和完整Canonical／独立结论必须明确收回，不能称005可交付。

Canonical006完整17组PASS、exit0、source_stable=true、421源码输入无变化／360.06秒；不表示真实主模型含义通过。primary016真实6调用FAIL，值45.5万元表面正确但输入／输出基准都误设1；没有覆盖原失败。继任007只更正通用bind_measurement工具说明及倍率字段description：ISO基础货币单位固定，同输入输出单位也必须使用相对固定基准的真实倍率；无需用户文字匹配，不新增产品/UI或权限。完整007及实际补验仍待收回。

Canonical007完整17组PASS/source_stable=true/421源码输入无变化/363.89秒；但primary017真实6调用FAIL，单位基准正确10000，却缺少unit维度解释，笼统MEASURE_BINDING_INVALID反馈使模型误改多步骤并耗尽允许的步骤参数纠正。meaning-feedback-red001→green001同一独立源探针：工具明确反馈缺少unit解释、指向interpret_meaning，再由模型按实际用户消息填写并绑定；缺前提零verify／零save，补齐后真实计算核验保存。永久集成负例保留相同断言，不自动生成解释／用户事实、未增加重试／纠正额度。继任008尚需收回实际主备、非货币、回归及独立结论。

Canonical008完整17组PASS/exit0/source_stable=true/421源码输入无变化/365.70秒。primary018真实6调用仍FAIL：当前补充被解释为输出要求，旧未知模型候选与本轮真实用户问题混投。context-authority-red001源摘要错FAIL、red002空资料先等待未进模型FAIL保留；red003使用真实结构/正确scope实际断言Runtime混入旧猜测FAIL→green001。继任009只投影待解dimension/question及有用户来源定义，历史猜测完整保存在原记录与UI；不当作本轮事实或默认输入单位，不做中文解析／隐藏自动语义修复。永久集成测试保留原candidate alternatives和真实消息，可观察权威分层。primary019/backup012、当前回归/网页与Canonical009独立结论仍待收回；旧主模型错误结果绝不追认。

## C04当前收回：semantic009，2026-10-07

固定完整候选manifest SHA-256 eecaa2c13c5b16451cd79401d7d6d052bb6efa3c5effa468aee8ad718ff8b84c（2540项）。自然语言含义由LLM解释，程序仅校验实际消息来源、授权、结构一致性和实际执行资格；指标、公式、单位、范围、粒度、期间、时区、筛选、关联及前提均沿通用解释工具，不使用“万，人民币”词典。历史未验证猜测保留，但不投影为本轮业务事实。非货币原单位能力保留，不虚构币种。

当前primary019实际7调用、backup012实际6调用PASS：输入10000/CNY、输出10000，净额91/2万元，真实工具/本地计算/独立核验/保存读回。nonmonetary-primary005实际7调用PASS，数量2+3=5件，无虚构币种；该未受等待冲突投影修改影响的路径沿同一实测输入复用。browser012普通Chrome→HTTP→生产Profile/Application自动接续/核验/保存PASS，零Stop/Preview/Adopt，网页模型传输合成，不替代真实Provider。affected015共234PASS/0SKIP；canonical009全部17组exit0、421程序输入稳定、332.26秒。新鲜独立Validator011对009给出PASS，详细原始回执在independent-review011/candidate009-result.json；历史002/004 FAIL完整保留。用户批准的同Change只读行为权限例外沿用，不声称宿主内核只读。

资源实际读回resources009.json：本增量208真实请求，含所有失败；既往379，累计587；16历史UNKNOWN保留，新增UNKNOWN0。不按余额推断消费，不覆盖旧resources-final.json。所有前序失败及失效canonical仍按原结论保留。

原profile正常入口受控stop/start/open成功，当前入口http://127.0.0.1:55700，6任务/36持久调用记录正文摘要全未变化，无启动模型或自动恢复；原等待任务及未发送草稿保留。用户只需在新打开的Mini正常认证窗口继续发送补充。当前回到USER_PRODUCT_ACCEPTANCE，自动跟进PAUSED。用户体验/正式产品验收未代签；初次项目选择错误提示缺口继续OPEN；正式Engineering Acceptance、required hostedCI、Git发布及archive未执行。该回执是冻结后行政追加，不冒称原manifest含本段。
