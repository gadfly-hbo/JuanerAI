/* UI replay only. This file explores the conversation, not an LLM or a production planner. */
function freshFramework() {
  return {purpose:'', hypothesis:'', gap:'', output:'一页业务简报', messages:[], input:'', quick:false, confirmed:false, revision:1, history:[], lastChange:'根据你的原话起草；未知信息保持待讨论。'};
}
function purposeName(value) {
  return value==='verify'?'核实复购是否变化，为经营复盘提供依据':value==='investigate'?'识别变化与调查重点，支持下一步经营判断':'还需要了解：你想用分析支持什么判断';
}
function frameworkQuestion(t) {
  const f=t.framework;
  if(f.gap)return {title:'这部分需要更多证据，你希望怎样继续？',why:f.gap,choices:[['limited','先核实变化，原因留待补证'],['uncertain','先保留问题，暂不进入分析']]};
  if(!f.purpose)return {title:'这次分析，最希望帮助你作出什么判断？',why:'先确定分析用途，才能决定问题怎么拆、结果要讲到哪里。',choices:[['verify','先核实复购变化'],['investigate','找出下一步调查重点']]};
  if(!t.periodChosen)return {title:'你说的“最近”，具体想看哪个期间？',why:'不同范围可能改变判断。演示提供两组已有数据的等长期间；不会替你默认选择。',choices:[['august','看 8 月前后两个 14 天'],['september','看 9 月前后两个 14 天']]};
  return {title:'这是目前的分析框架。还有遗漏或需要纠正的地方吗？',why:'没有预设“复购一定下降”，也没有把业务猜测当作原因。资料可行性会在下一步核对。',choices:[['hypothesis','我怀疑和活动变化有关'],['noHypothesis','不要预设原因，先看证据'],['brief','结果给管理层看，简洁一些']]};
}
function collectDiscoveryText(t,text) {
  const f=t.framework, changes=[];
  // Deliberately small, disclosed keyword replay. Unrecognized text is retained, not falsely understood.
  if(/不预设|不要预设|没有假设|先看证据/.test(text)){f.hypothesis='';changes.push('不预设原因，保留探索方向');}
  else if(/怀疑|猜测|可能与|可能和/.test(text)){f.hypothesis=text;changes.push('保留为你的待验证假设，不当作已证实原因');}
  if(/下一步|调查|排查|怎么办|行动|为什么|原因|权益/.test(text)&&!/^不要预设/.test(text)){f.purpose='investigate';changes.push('分析用途：支持调查与下一步判断');}
  else if(/核实|确认变化|是否下降|是否变化|经营复盘/.test(text)){f.purpose='verify';changes.push('分析用途：先核实变化');}
  if(/8\s*月|八月/.test(text)){t.period=0;t.periodChosen=true;changes.push('范围：8 月两个 14 天');}
  else if(/9\s*月|九月/.test(text)){t.period=1;t.periodChosen=true;changes.push('范围：9 月两个 14 天');}
  if(/管理层|一页|简洁|简报/.test(text)){f.output='一页管理层简报：发现、限制和下一步';changes.push('交付改为一页管理层简报');}
  if(/首购|30\s*天|老会员|活动效果|活动导致|证明.*活动|渠道归因/.test(text)){
    f.gap='这版合成示例不能验证首购／老会员筛选、活动因果或渠道归因。可以保留为后续问题，先完成总体与匿名分组变化分析；也可以停在需求讨论。';
    changes.push('识别出当前示例不能直接回答的范围，未擅自扩大分析');
  }
  return changes;
}
function addDiscoveryMessage(t,text,changes) {
  const f=t.framework;
  f.messages.push({who:'你',text});
  f.lastChange=changes.length?changes.join('；'):'这条补充已保留为业务原话；有限演示没有自动解释它，请直接调整框架。';
  const q=frameworkQuestion(t);
  f.messages.push({who:'JuanerAI · 模拟讨论',text:(changes.length?f.lastChange+'。':'已保存这条补充，未自动改变分析范围。')+' '+q.title});
}
function beginDiscovery(t) {
  t.stage='discovery';
  const changes=collectDiscoveryText(t,t.question);
  if(changes.length)addDiscoveryMessage(t,t.question,changes);
  else {
    t.framework.lastChange='先保留你的原话，分析用途与期间仍待讨论；右侧是建议框架，不是已确认结论。';
    t.framework.messages.push({who:'你',text:t.question},{who:'JuanerAI · 模拟讨论',text:'我们先一起明确你要支持什么业务判断，不急着选表或开始计算。这个示例从会员复购切入；我不会先认定已经下降或某个原因成立。'});
  }
  log(t,'开始需求共创，未选择数据或执行分析');
  render();
}
function discoveryReply(t,choice) {
  const f=t.framework;
  let text='',changes=[];
  if(choice==='verify'){f.purpose='verify';text='先核实复购变化，为经营复盘提供依据。';changes=['用途明确为核实变化，不承诺原因结论'];}
  if(choice==='investigate'){f.purpose='investigate';text='我想找出下一步优先调查什么，支持经营判断。';changes=['用途明确为调查重点，报告增加下一步证据建议'];}
  if(choice==='august'||choice==='september'){t.period=choice==='august'?0:1;t.periodChosen=true;text=choice==='august'?'比较 8 月 1–14 日与 15–28 日。':'比较 9 月 1–14 日与 15–28 日。';changes=['范围已来自你的回答，后续不再重复选择日期'];}
  if(choice==='hypothesis'){f.hypothesis='我怀疑复购变化与活动变化有关。';text=f.hypothesis;changes=['活动关联只作为待验证假设；当前资料不足以证明因果'];}
  if(choice==='noHypothesis'){f.hypothesis='';text='不要预设原因，先看证据。';changes=['移除原因预设，先核实总体与分组变化'];}
  if(choice==='brief'){f.output='一页管理层简报：发现、限制和下一步';text='结果给管理层看，简洁一些。';changes=['交付调整为一页管理层简报'];}
  if(choice==='limited'){f.gap='';f.purpose='investigate';text='先核实当前数据支持的变化，原因留待补证。';changes=['本轮收敛到总体和匿名分组变化，不执行额外筛选或因果分析'];}
  if(choice==='uncertain'){text='先保留问题，暂不进入分析。';changes=['未决问题保留，不自动开始分析'];}
  if(!choice){text=t.discoveryInput.trim();if(!text)return toast('可以直接补充你的想法，或使用下面的演示回答。');changes=collectDiscoveryText(t,text);}
  t.discoveryInput='';f.confirmed=false;
  addDiscoveryMessage(t,text,changes);render();
}
function frameworkContent(t,expanded=false) {
  const f=t.framework,p=period(t);
  return `<dl class="framework-list"><div><dt>想支持的判断 <span class="source-tag">${f.purpose?'来自你的回答':'待讨论'}</span></dt><dd>${esc(purposeName(f.purpose))}</dd></div><div><dt>准备回答的问题 <span class="source-tag">AI 建议</span></dt><dd>复购变化是否成立？变化集中在哪里？${f.purpose==='investigate'?'下一步优先补充哪些证据，再决定是否采取行动？':'哪些结论可靠，哪些仍不能判断？'}</dd></div><div><dt>分析范围 <span class="source-tag">${t.periodChosen?'来自你的回答':'待讨论'}</span></dt><dd>${t.periodChosen?`${p.base} 对比 ${p.current}`:'尚未明确期间，不采用隐藏默认值'}<br><span class="muted small">总体会员与匿名分组；不默认筛选老会员或首购人群。</span></dd></div><div><dt>解释与不确定性 <span class="source-tag">${f.hypothesis?'你的假设 · 未验证':'探索方向'}</span></dt><dd>${f.hypothesis?esc(f.hypothesis):'没有预设原因，也不预设一定下降。先核实变化，再判断是否需要调查。'}${f.hypothesis?'<p class="small muted">需要活动记录等额外证据；本轮只形成调查线索，不证明原因。</p>':''}</dd></div><div><dt>预计交付 <span class="source-tag">${f.output.includes('管理层')?'来自你的回答':'AI 建议'}</span></dt><dd>${esc(f.output)}；事实、限制与${f.purpose==='investigate'?'调查优先方向':'是否值得继续调查'}。</dd></div></dl>${expanded?`<details open><summary>资料、方法与判断边界</summary><p class="small">会员表用于识别会员与匿名分组；订单表用于计算两期有效购买。本地清洗、计算、复算与报告组织由系统承担。</p><p class="small muted">计划沿用已维护的示例复购口径。是否具备有效字段和可比数据，须在资料准备中核对；目前尚无分析结论。</p></details>`:''}${f.gap?`<div class="caution">${esc(f.gap)}</div>`:''}`;
}
function detailedDiscoveryPanel(t) {
  const f=t.framework,q=frameworkQuestion(t),canConfirm=!!f.purpose&&t.periodChosen&&!f.gap;
  return `<section class="discovery-layout"><div class="surface conversation-panel"><div class="section-head"><div><span class="eyebrow">需求讨论</span><h2>先把问题弄清楚</h2></div><span class="badge">尚未分析</span></div><p class="muted small">不必先整理成完整需求。我们边讨论，边形成右侧框架。</p><div class="discovery-messages">${f.messages.map(m=>`<div class="chat-line ${m.who==='你'?'user':''}"><div class="who">${esc(m.who)}</div><p>${esc(m.text)}</p></div>`).join('')}</div><div class="next-question"><h3>${esc(q.title)}</h3><p class="small muted">${esc(q.why)}</p></div><div class="composer"><label for="discoveryInput">补充或纠正你的想法</label><textarea id="discoveryInput" data-bind="discoveryInput" placeholder="例如：我想找出下一步调查重点，看 9 月；结果给管理层看。">${esc(t.discoveryInput)}</textarea><div class="composer-footer"><span class="small muted">仅在本页模拟，不发送到模型</span>${btn('discoverySend','发送补充 →','primary')}</div></div><div class="reply-suggestions"><span class="small muted">也可以用演示回答</span>${q.choices.map(([id,label])=>btn('discoveryChoice',label,'',`data-choice="${id}"`)).join('')}</div></div><aside class="surface framework-panel" aria-label="共同形成的分析框架"><div class="section-head"><div><span class="eyebrow">随讨论更新</span><h2>我们的分析框架</h2></div><span class="badge ${canConfirm?'good':'warn'}">${canConfirm?'可审阅':'仍在共创'} · v${f.revision}</span></div><div class="framework-change"><span>本轮更新</span><p>${esc(f.lastChange)}</p></div>${frameworkContent(t,mode==='professional')}<div class="framework-footer"><div class="actions">${btn('editFramework','直接调整框架','quiet')}${btn('confirmFramework','确认框架，准备资料 →','primary',canConfirm?'':'disabled')}</div><p class="small muted">这是确认分析方向，不是授权读取资料或调用模型。${!canConfirm?'还需明确用途、期间，或处理范围缺口。':'下一步系统按框架说明所需资料；不重复询问已确认信息。'}</p>${f.history.length?btn('frameworkHistory','查看已确认的框架版本','link'):''}</div></aside></section>`;
}
function discoveryPanel(t) {
  if(t.framework.quick)return quickFrameworkPanel(t);
  return `<div class="framework-summary"><div><strong>简单问题，不必深入讨论</strong><p>可以直接查看简要框架；只补影响分析的关键信息。</p></div>${btn('skipDiscovery','跳过深入讨论 →','quiet')}</div>`+detailedDiscoveryPanel(t);
}
function quickFrameworkPanel(t) {
  const f=t.framework,canConfirm=!!f.purpose&&t.periodChosen&&!f.gap;
  return `<section class="surface saved-list" aria-label="简要分析框架"><div class="section-head"><div><span class="eyebrow">已跳过深入讨论</span><h2>看一下方向，就可以准备资料</h2></div>${btn('resumeDiscovery','继续深入讨论','link')}</div><p class="small muted">不必讨论假设或报告形式。已有回答会保留；这里只补影响分析的缺口。</p>
    <dl class="key-values"><dt>你的问题</dt><dd>${esc(t.question)}</dd><dt>分析用途</dt><dd>${f.purpose?esc(purposeName(f.purpose)):`<span class="muted">还需明确这次想得到什么</span><div class="actions">${btn('discoveryChoice','先核实复购变化','', 'data-choice="verify"')}${btn('discoveryChoice','找出下一步调查重点','', 'data-choice="investigate"')}</div>`}</dd><dt>比较范围</dt><dd>${t.periodChosen?`${period(t).base} 对比 ${period(t).current}`:`<span class="muted">期间会影响结果，需要你选择；不默认代选</span><div class="actions">${btn('discoveryChoice','看 8 月前后两个 14 天','', 'data-choice="august"')}${btn('discoveryChoice','看 9 月前后两个 14 天','', 'data-choice="september"')}</div>`}</dd><dt>你会得到</dt><dd>${esc(f.output)}：总体与匿名分组变化、证据限制和下一步建议；不证明原因。</dd></dl>
    ${f.hypothesis?`<div class="caution">保留你的假设（未验证）：${esc(f.hypothesis)}。不会当作已证实原因。</div>`:''}
    ${f.gap?`<div class="caution">${esc(f.gap)}<div class="actions">${btn('discoveryChoice','先核实变化，原因留待补证','', 'data-choice="limited"')}${btn('resumeDiscovery','返回讨论范围','link')}</div></div>`:''}
    <details><summary>查看完整框架与判断边界</summary>${frameworkContent(t,true)}</details>
    <div class="actions">${btn('confirmFramework','按此方向准备资料 →','primary',canConfirm?'':'disabled')}${btn('editFramework','调整框架','quiet')}</div><p class="small muted">${canConfirm?'方向已具备，可以继续。':'补齐必要信息后即可继续，不需要完成深入讨论。'} 此处不授权读取资料、调用模型或开始分析。</p></section>`;
}
function frameworkSummary(t) {
  const f=t.framework;
  if(!f.confirmed)return '';
  return `<div class="framework-summary"><div><strong>已确认的分析方向</strong><p>${esc(purposeName(f.purpose))} · ${period(t).label}</p></div><div class="row">${btn('showFramework','查看框架','link')}${['needData','authorize','clarify','meaning'].includes(t.stage)?btn('returnDiscovery','调整需求','link'):''}</div></div>`;
}
function confirmFramework(t) {
  const f=t.framework;
  if(!f.purpose||!t.periodChosen||f.gap)return;
  f.confirmed=true;
  f.history.push({revision:f.revision,purpose:purposeName(f.purpose),range:period(t).label,hypothesis:f.hypothesis,output:f.output});
  t.prepared=false;t.grant=false;
  log(t,`用户确认分析框架 v${f.revision}，开始准备所需资料`);
  if(t.files.length===2)beginPreparation(t);else {t.stage='needData';render();}
}
function editFrameworkDialog(t) {
  const f=t.framework;
  modal('frameworkEdit','调整分析框架',`<p>直接改业务内容即可，不需要理解内部对象。未讨论清楚的内容可以保留为空。</p><div class="field"><label for="framePurpose">分析用途</label><select id="framePurpose"><option value="">仍待讨论</option><option value="verify" ${f.purpose==='verify'?'selected':''}>核实变化，支持经营复盘</option><option value="investigate" ${f.purpose==='investigate'?'selected':''}>识别变化与下一步调查重点</option></select></div><div class="field"><label for="framePeriod">比较范围（合成示例）</label><select id="framePeriod"><option value="">仍待讨论</option>${periods.map((p,i)=>`<option value="${i}" ${t.periodChosen&&t.period===i?'selected':''}>${p.label}：${p.base} / ${p.current}</option>`).join('')}</select></div><div class="field"><label for="frameHypothesis">业务猜测（可留空，不当作事实）</label><textarea id="frameHypothesis">${esc(f.hypothesis)}</textarea></div><div class="field"><label for="frameOutput">希望如何交付</label><input id="frameOutput" value="${esc(f.output)}"></div><p class="small">当前演示只支持总体与匿名分组的两期分析；这里不增加新数据源、任意指标或因果方法。</p>`,btn('dismiss','取消')+btn('applyFramework','更新框架','primary'));
}
function taskPhase(t) {
  if(['entry','discovery'].includes(t.stage))return 0;
  if(['needData','inspect','clarify','meaning','authorize'].includes(t.stage))return 1;
  if(['planning','calculating','verifying'].includes(t.stage))return 2;
  if(t.stage==='explaining')return 3;
  if(t.stage==='completed'&&t.result?.kind==='choice')return 5;
  if(t.stage==='stopped')return t.verified?4:t.framework.confirmed?1:0;
  return t.verified?4:2;
}
function journey(t) {
  const labels=['分析需求','数据准备','数据分析','报告输出','沟通结论','确定行动','反馈结果'],current=taskPhase(t);
  return `<div class="journey" aria-label="任务主线"><span class="eyebrow">任务主线</span><strong>${current+1} · ${labels[current]}</strong><span class="muted small">${current<5?'系统推进内部工作，必要时请你参与':'仅记录决定，不执行行动'}</span>${btn('showJourney','查看全程','link')}</div>`;
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');if(!el||el.disabled)return;
  if(!['skipDiscovery','resumeDiscovery','discoverySend','discoveryChoice','confirmFramework','editFramework','applyFramework','showFramework','returnDiscovery','frameworkHistory','showJourney'].includes(el.dataset.action))return;
  const t=task(),f=t.framework;
  switch(el.dataset.action){
    case 'skipDiscovery':f.quick=true;render();break;
    case 'resumeDiscovery':f.quick=false;render();break;
    case 'discoverySend':discoveryReply(t);break;
    case 'discoveryChoice':discoveryReply(t,el.dataset.choice);break;
    case 'confirmFramework':confirmFramework(t);break;
    case 'editFramework':editFrameworkDialog(t);break;
    case 'applyFramework':{
      const purpose=document.getElementById('framePurpose').value,range=document.getElementById('framePeriod').value,hypothesis=document.getElementById('frameHypothesis').value.trim(),output=document.getElementById('frameOutput').value.trim();
      const changed=purpose!==f.purpose||range!==(t.periodChosen?String(t.period):'')||hypothesis!==f.hypothesis||output!==f.output;
      if(!changed){dismiss();return toast('内容没有变化，框架保持原样。');}
      f.purpose=purpose;f.hypothesis=hypothesis;f.output=output||'一页业务简报';t.periodChosen=range!=='';if(t.periodChosen)t.period=Number(range);f.confirmed=false;
      addDiscoveryMessage(t,'我直接调整了分析框架。',['框架已按你的编辑更新，请整体审阅']);dismiss();render();break;
    }
    case 'showFramework':modal('framework','本次已确认的分析框架',frameworkContent(t,true)+`<p class="small muted">框架 v${f.revision}；确认方向不代表已经完成计算。</p>`);break;
    case 'returnDiscovery':f.confirmed=false;f.quick=false;f.revision++;t.grant=false;t.stage='discovery';f.lastChange='返回需求讨论。原确认版本保留，修改后再确认方向。';render();break;
    case 'frameworkHistory':modal('frameworkHistory','已确认的框架版本',f.history.map(h=>`<div class="chat-line"><strong>v${h.revision} · ${esc(h.range)}</strong><p>${esc(h.purpose)}</p><p class="small muted">${esc(h.output)}${h.hypothesis?'；待验证假设：'+esc(h.hypothesis):''}</p></div>`).join(''));break;
    case 'showJourney':{
      const descriptions=['讨论业务用途、范围、假设与交付，形成共识','系统盘点和检查资料；你补缺失来源并授权','系统组织方法、计算、核验，不逐步要求点击继续','从已核验事实组织待审报告，不伪造结论','解释依据、修改表述；范围变化需要重新分析','你选择、暂缓或要求补证；记录决定不等于执行行动','完整路线的后续阶段；本 Demo 未实现结果采集或效果评价'];
      modal('journey','完整任务主线',`<ol class="journey-list">${descriptions.map((d,i)=>`<li ${i===taskPhase(t)?'class="current"':''}><strong>${['分析需求','数据准备','数据分析','报告输出','沟通结论','确定行动','反馈结果'][i]}</strong><p>${d}</p></li>`).join('')}</ol><p class="small muted">这不是七道审批，也不是必须单向走完。发现缺口可以回到需求或分析；停止也会保留已完成内容。</p>`);break;
    }
  }
});
