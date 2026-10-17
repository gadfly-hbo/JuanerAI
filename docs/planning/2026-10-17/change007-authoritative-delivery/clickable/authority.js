// Documentation-only, prewritten synthetic scenarios. NOT a production qualifier or renderer.
// No file reads, Provider, calculation, storage, download, persistence or network.
(function () {
  'use strict';
  const escapeText = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const baseB = {
    title:'分别汇总，再核对归属', kind:'B', ready:true, phase:'done',
    observation:'所选订单与退款在各自文件范围内分别汇总，各项独立算术核验一致。',
    facts:['订单：已付240元、未付25元，合计265元。','退款：已完成18元、待处理4元，合计22元。'],
    explanation:'两份文件的分别汇总，没有证明退款与订单一一匹配，也没有提供跨表净额、利润或促销原因的证据。因此先核对归属、取得匹配记录，才能判断这些资料还支持什么结论。',
    suggestion:'可选择由品类A运营负责人核对所选退款与订单归属，以收集可追溯的匹配证据。',
    conditions:'用户在本合成任务给定核对职责和权限，可在未来3天安排2小时，费用上限为200元。这些是用户提供的条件，不是独立事实认证。',
    cost:'沿用已给条件（≤200 元）',
    safeguards:'主要风险是把分别汇总误当成净额、利润或原因；若无法匹配，或需要新增资料／权限，停止并补证。3天窗口内观察核对是否完成、是否取得可追溯匹配记录。不承诺收益。',
    alternative:'也可先补证、仅保留当前分析并暂缓，或不行动。核对建议不等于已执行，不自动排班、签署或扩大业务动作。',
    original:'可选择核对所选退款与订单归属，收集可追溯匹配证据；备选是仅保留分析并暂缓。用户给定未来3天2小时，成本沿用已给条件（≤200 元）。风险是把分别汇总误当净额或利润；无法匹配或需要新增材料则停止并补证。',
    gap:null
  };
  const scenarios = {
    complete:{...baseB, note:'正确事实、解释和完整建议均在正式成果中；支持标记不覆盖原稿全文。'},
    extra:{...baseB, original:baseB.original+'立即扩大促销。', note:'正式成果仍是完整核对建议。形成原稿另有额外文字，不能随主行动进入本次正式采纳内容。'},
    gap:{...baseB, ready:false, explanation:null, safeguards:null,
      gap:'缺少“为什么不能直接认定净额／利润”的正式解释，以及无法匹配／新增资料时的停止安排。',
      note:'尚未完整交付。即使来源原稿里存在这些内容，也不能用来源查看代替正式成果。'},
    conditional:{...baseB, ready:false, answer:'unknown', answeredUnknown:false,
      conditions:'核对职责、权限和200元费用范围已给定；负责人能否在未来3天投入2小时仍未知。',
      note:'保留具体核对选项与完整说明，仅负责人时间待确认。只问这一项，不重复已知条件。'},
    material:{...baseB, ready:false, phase:'no-current-data',
      facts:[], observation:'用户表示新期间尚未导入资料，也没有本期新计算。旧期间结果只供历史参考，不能认证新期间。',
      explanation:'缺少当前期间资料，无法据旧期间数字判断本期净额、利润或原因。当前资料限制应直接出现在正式说明中。',
      suggestion:null, original:'该期间资料已经导入。',
      note:'当前期间没有新数值／可采用建议。原稿的相反肯定句不改变资料状态。'},
    cost:{...baseB, note:'本合成任务费用上限用途不变。已有等义表达不应使正确完整建议被撤回。'},
    sales:{...baseB, title:'净销售变化与下一步', kind:'A',
      facts:['本独立合成两期：净销售160元 → 150元，减少10元。','品类A：100元 → 80元；品类B：60元 → 70元。'],
      observation:'同口径下净销售减少10元，变化集中在品类A；品类B增加，不能说所有品类都下降。',
      explanation:'品类变化说明调查重点，不证明退货、促销或其它因素是原因。先取得可追溯的原因资料，再决定是否有依据改变策略。',
      suggestion:'可选择由品类A运营负责人在未来3天投入2小时核查退货原因，费用不超过200元；核查前不扩大促销。',
      safeguards:'观察3天内核查是否完成、原因资料是否可追溯，以及口径／品类差额是否需要修订。超费用、资料错配或越权就停止；差额修订仍走原计算和独立核验。未取得原因资料则如实报告不足。',
      original:'品类A减少20元、品类B增加10元。建议先核查品类A退货原因；用户已确认核查职责、费用范围以及未来3天2小时可用。保留风险、暂缓备选和核查观察安排。',
      note:'A情境沿原独立合成样例；不是把006两个真实任务改造成一次两期比较。条件已确认并完成重审仅为合成预演。'},
    failed:{...baseB, ready:false, phase:'failed', note:'本版审查无法完成。已核对事实可先读；解释／建议未取得本版正式资格，不把失败改成证据不足。'},
    stale:{...baseB, ready:false, phase:'stale', note:'建议内容已改变，受影响项需重新审查。数值仍可读；旧资格不认证新内容，不触发自动执行。'}
  };
  function scenario(name) {
    if (!Object.hasOwn(scenarios,name)) throw new Error('Unknown synthetic scenario');
    return structuredClone(scenarios[name]);
  }
  function reportText(s) {
    const lines=['本页正式成果预演（合成，非后台记录）', ...s.facts, s.observation];
    if (s.gap) lines.push('尚未完整交付：'+s.gap);
    if (['failed','stale','stopped'].includes(s.phase)) {
      lines.push(s.note, '当前解释／建议没有本版正式资格。');
      return lines.join('\n\n');
    }
    if (s.explanation) lines.push(s.explanation);
    if (s.suggestion && !s.gap) {
      lines.push(s.ready?'当前可选择的具体建议':s.answer==='no'?'存在冲突，当前安排不可推荐':'待条件／待审选项，不是当前可采用推荐',s.suggestion,s.conditions,'费用说明：'+s.cost,s.safeguards,s.alternative);
    }
    return lines.filter(Boolean).join('\n\n');
  }
  // Pure sample projection is exposed only for prototype QA. It proves no production guarantee.
  const api = {scenario,reportText,escapeText,names:Object.keys(scenarios)};
  globalThis.change007DeliveryPreview=api;
  if (typeof document==='undefined') return;

  const $=id=>document.getElementById(id);
  const state={scene:'complete',data:scenario('complete'),mode:'quick',stage:5,preview:null,messages:[],selected:false,tab:'evidence',source:false,stopped:false};
  let returnFocus=null;
  const p=text=>'<p>'+escapeText(text)+'</p>';
  const badge=(text,tone='')=>'<span class="review-badge '+tone+'">'+escapeText(text)+'</span>';
  const announce=text=>{$('notice').textContent=text;};
  function reset(name) {
    state.scene=name; state.data=scenario(name); state.preview=null; state.selected=false; state.messages=[]; state.stopped=false;
    $('scene').value=name; closeDrawer(false); render();
  }
  function canChoose() {return state.data.ready&&!state.stopped&&state.data.phase==='done';}
  function phase() {
    if(state.stopped) return '已停止（合成）';
    return {done:state.data.gap?'尚未完整交付':state.data.answer==='unknown'?'建议时间待确认':'本版审查完成（合成）','no-current-data':'当前期间没有资料／计算',failed:'审查无法完成',stale:'建议需重新审查',reviewing:'建议重审中（合成）'}[state.data.phase]||'当前资格待确认';
  }
  function observationHtml(s) {
    const current=!['no-current-data'].includes(s.phase);
    return '<article class="review-card formal-copy"><div class="card-line"><h2>'+(current?'发生了什么，能说明什么':'当前资料与范围')+'</h2>'+badge(current?'本条有限观察有支持':'资料限制 · 用户提供',current?'good':'')+'</div>'+s.facts.map(p).join('')+p(s.observation)+(s.explanation&&!['failed','stale'].includes(s.phase)?p(s.explanation):'')+'<p class="source-note">数字核验、解释支持与策略资格分别判断；不是全面语义／因果认证。以上均为审核样例。</p><button class="inline-link" data-action="evidence">查看依据与限制</button></article>';
  }
  function suggestionHtml(s) {
    if(!s.suggestion) return '';
    if(s.gap) return '<article class="review-card"><h2>完整建议尚未交付</h2><div class="delivery-gap"><strong>尚未完整交付</strong>'+p(s.gap)+p('来源中有正确原文也不能补足这里的缺口。本任务不能标完成，受影响建议不可正式选择。')+'</div><button class="inline-link" data-action="source">查看形成原稿（不会补齐交付）</button></article>';
    const blocked=['failed','stale','reviewing'].includes(s.phase)||state.stopped;
    const label=blocked?'本版尚无正式建议资格':s.ready?'有支持 · 仅支持当前具体安排':s.answer==='no'?'存在冲突 · 当前时间不支持':'有条件支持 · 时间待确认';
    let out='<article class="review-card formal-copy"><div class="card-line"><h2>下一步选项</h2>'+badge(label,canChoose()?'good':'warn')+'</div>';
    if(blocked) return out+p(s.note)+p('保留原稿和旧版，不借旧审查或故障回退取得本版资格。')+'</article>';
    out+=p(s.suggestion)+p(s.conditions)+'<p>费用说明：<strong>'+escapeText(s.cost)+'</strong></p>'+p(s.safeguards)+p(s.alternative);
    if(state.scene==='cost') out+='<button class="inline-link" data-action="cost">查看另一种已有上限表达</button><p class="fine">仅切换合成文案；不是对任意自然语言的认证。</p>';
    if(state.scene==='conditional'&&s.answer==='unknown'&&!s.answeredUnknown&&s.phase==='done') out+='<div class="review-note"><strong>只问一项必要条件</strong><p>品类A负责人能在未来3天安排2小时核对吗？</p><div class="actions"><button class="btn btn-sm" data-action="answer" data-answer="yes">模拟回答：能安排</button><button class="btn btn-sm" data-action="answer" data-answer="no">模拟回答：不能安排</button><button class="btn btn-sm" data-action="answer" data-answer="unknown">模拟回答：还不确定</button></div><p class="fine">已知权限／费用不重复问。回答后先重审，不重算数值；回答不是批准或执行。</p></div>';
    if(state.scene==='conditional'&&s.answer==='unknown'&&s.answeredUnknown&&s.phase==='done') out+='<div class="review-note"><strong>你已表示时间仍未知 · 保持待条件</strong><p>当前不将核对安排作为可采用建议，不再主动追问同一条件。可以先补证、暂缓或不行动；有新信息时由你主动更新。</p><div class="actions"><button class="btn btn-sm" data-action="hold">补证／暂缓 · 样例</button><button class="inline-link" data-action="update-time">主动更新可用时间</button></div></div>';
    if(s.answer==='no') out+='<div class="review-note error"><strong>存在冲突 · 当前时间不支持该安排</strong><p>可补可用资源信息、暂缓或不行动。不编造另一个负责人，不自动延期。</p></div>';
    out+='<div class="delivery-actions"><button class="btn btn-primary btn-sm" data-action="choose" '+(canChoose()?'':'disabled')+'>选择此下一步 · 样例</button><button class="inline-link" data-action="source">查看形成原稿</button></div>';
    return out+'</article>';
  }
  function previewHtml() {
    if(!state.preview) return '';
    const name={report:'正式报告预览',export:'正式报告导出预览',human:'人的下一步 · 同版内容'}[state.preview];
    const s=state.stopped?{...state.data,phase:'stopped',ready:false,note:'任务已停止（合成）。不发布新建议资格，已有效事实与来源保留。'}:state.data;
    return '<section class="review-card"><h2>'+name+'</h2><p class="output-label">合成版本R-demo · '+escapeText(state.scene)+'；与中央当前内容一致，不含形成原稿。</p><div class="formal-copy">'+reportText(s).split('\n\n').map(p).join('')+'</div>'+(state.preview==='human'?'<div class="actions"><button class="btn btn-primary btn-sm" data-action="choose" '+(canChoose()?'':'disabled')+'>选择当前具体建议 · 样例</button><button class="btn btn-sm" data-action="hold">暂缓／要求补证 · 样例</button></div>':'')+'<p class="preview-note">没有后端保存、实际下载或正式Decision／Expected提交；选择不改变审查资格，不执行业务行动。</p></section>';
  }
  function render() {
    const s=state.data;
    $('task-title').textContent=s.title;
    $('status').textContent=phase()+' · '+s.note;
    $('advance').disabled=s.phase!=='reviewing'||state.stopped;
    $('stop').disabled=state.stopped;
    $('professional-note').hidden=state.mode!=='professional'; $('stages').hidden=state.mode!=='professional';
    for(const id of ['quick','professional']) {$(id).classList.toggle('active',state.mode===id);$(id).setAttribute('aria-pressed',String(state.mode===id));}
    for(const b of document.querySelectorAll('[data-stage]')) {const active=Number(b.dataset.stage)===state.stage;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
    let h='';
    if(state.mode==='professional'&&state.stage<4) h='<div class="empty-state">本增量不改变前3阶段。请查看原PX-004完整交互；未重画不表示删除，也不证明生产接通。</div>';
    else {
      h='<p class="fine">合成需求：'+(s.kind==='A'?'核实两期及品类变化，给出有依据、能判断下一步的报告。':'分别核实订单与退款资料，说明限制，并给出具体归属核对建议。')+'</p><div class="summary-grid"><section class="summary-cell"><span class="fine">数字检查</span><strong>'+(s.phase==='no-current-data'?'本期未计算':'已核对 · 合成示意')+'</strong><p>独立维度，不因模型支持升级</p></section><section class="summary-cell"><span class="fine">结论依据</span><strong>具体有限观察／限制</strong><p>支持不覆盖整段原稿</p></section><section class="summary-cell"><span class="fine">建议条件</span><strong>'+escapeText(canChoose()?'当前安排有支持':phase())+'</strong><p>选择不是批准执行或收益保证</p></section></div>';
      h+=observationHtml(s)+suggestionHtml(s);
      h+='<div class="actions"><button class="btn btn-primary btn-sm" data-action="report">查看正式报告</button><button class="btn btn-sm" data-action="export">导出内容预览</button><button class="btn btn-sm" data-action="human">人的下一步</button><button class="inline-link" data-action="source">形成原稿／来源</button></div>';
      if(state.mode==='professional'&&state.stage===6&&!state.preview) state.preview='human';
      h+=previewHtml();
      if(state.selected) h+='<div class="selection-note"><strong>你在本页选择了当前具体建议（合成）</strong><p>'+escapeText(s.suggestion)+'</p><p class="fine">条件、风险、停止与观察随同上方完整内容。不含原稿额外文字，未正式签署、未保存、未执行。</p></div>';
    }
    h+=state.messages.map(m=>'<p class="message-user">'+escapeText(m)+'</p><p class="fine">仅显示你的输入，未执行新分析。Agent开放分析能力仍沿原005合同。</p>').join('');
    $('thread').innerHTML=h; renderDetail();
  }
  function renderDetail() {
    const s=state.data;
    const source='<section class="source-preview"><h2 class="source-heading">形成原稿 · 不是正式成果</h2><p>原时点MODEL文字（合成示意）。未对整份原稿授予支持或选择资格，不在当前整体采纳内容内。</p><pre>'+escapeText(s.original)+'</pre><p class="fine">查看来源不会补齐正式报告的缺口，也不会触发采纳、导出或执行。历史原文保留，不作为真实模型调用记录。</p><button class="btn btn-sm" data-action="evidence">返回当前依据</button></section>';
    const views={
      meaning:'<h2>业务口径与支持范围</h2>'+p(s.kind==='A'?'沿原净销售总体／既有品类两期合成样例。精确资产和归属版本由原合同维护；不增加地域或新方法。':'两份资料各自汇总。不能直接认证跨表净额、利润或原因；主行动是归属核对，不是扩大促销。')+p('数字／条件／解释的来源和权威不同，模型自报“已核实”不改变事实。'),
      plan:s.phase==='no-current-data'?'<h2>新期间没有当前建议</h2><p>本期尚未导入／计算。旧范围的数值、核对安排和资源条件不认证新期间，也不据此取得当前建议资格。</p>':'<h2>同一具体建议与条件</h2>'+p(s.suggestion||'当前没有基于新期间证据的具体建议。')+p(s.conditions)+p(s.safeguards||'正式停止安排缺失：这是交付缺口，不用来源原文补成通过。')+p('只有必要未知才追问；最终由人选择，不自动执行。'),
      materials:'<h2>资料与授权</h2><p>全部是预先编写的审核情境，没有读取文件、出站材料、模型调用或真实计算。</p><p>生产继续复用有效授权和精确资料范围；不每Attempt重批，不扩大工具／路径／外发权限。</p>',
      evidence:state.source?source:'<h2>当前依据与原稿不同权威</h2>'+s.facts.map(p).join('')+p(s.observation)+p('正式成果保留证据、范围和必要解释。原稿仅保留原文字；支持判断不会自动覆盖它。')+'<button class="inline-link" data-action="source">查看形成原稿</button>',
      execution:'<h2>执行与保存</h2><p>只有内存场景切换，没有应用请求、持久化、下载或后台任务。刷新清空。</p><p>生产仍初审→至多一次合并修订→对应重审；关页、停止、UNKNOWN、显式恢复及账本按原合同。本页不证明任何运行保障。</p>'
    };
    $('drawer-title').textContent=state.source&&state.tab==='evidence'?'来源查看 · 不授予支持':'同一任务 · 检查详情';
    $('detail').innerHTML=views[state.tab];
    for(const t of document.querySelectorAll('[data-tab]')) {const a=t.dataset.tab===state.tab;t.setAttribute('aria-selected',String(a));t.tabIndex=a?0:-1;}
    $('detail').setAttribute('aria-labelledby','tab-'+state.tab);
  }
  function syncOverlay() {
    const modal=!$('drawer').hidden&&window.matchMedia('(max-width:1100px)').matches;
    for(const el of [$('main'),document.querySelector('.sidebar'),$('topbar'),$('review-controls')]) el.inert=modal;
    if(modal) {$('drawer').setAttribute('role','dialog');$('drawer').setAttribute('aria-modal','true');}
    else {$('drawer').removeAttribute('role');$('drawer').removeAttribute('aria-modal');}
  }
  function openDrawer(tab,source,trigger) {
    if($('drawer').hidden) returnFocus=trigger||document.activeElement;
    state.tab=tab;state.source=source; $('drawer').hidden=false; $('details').setAttribute('aria-expanded','true');
    renderDetail();syncOverlay();$('detail').focus();
  }
  function closeDrawer(focus=true) {
    $('drawer').hidden=true;$('details').setAttribute('aria-expanded','false');syncOverlay();
    if(focus&&returnFocus&&returnFocus.isConnected) returnFocus.focus();
  }
  function act(e) {
    const b=e.target.closest('[data-action]');if(!b)return;
    const a=b.dataset.action;
    if(['report','export','human'].includes(a)) {state.preview=a;render();}
    else if(a==='source') openDrawer('evidence',true,b);
    else if(a==='evidence') openDrawer('evidence',false,b);
    else if(a==='choose'&&canChoose()) {state.selected=true;state.preview='human';render();announce('仅显示本页选择，未签署、保存或执行。');}
    else if(a==='hold') announce('合成暂缓／补证选择；未提交任何正式记录。');
    else if(a==='update-time'&&state.scene==='conditional') {state.data.answeredUnknown=false;render();announce('由你主动更新可用时间，未执行分析或改变资格。');}
    else if(a==='cost') {state.data.cost=state.data.cost==='沿用已给条件（≤200 元）'?'费用不超过200元':'沿用已给条件（≤200 元）';render();}
    else if(a==='answer') {
      if(state.data.phase!=='done'||state.data.answer!=='unknown')return;
      if(b.dataset.answer==='unknown') {state.data.answeredUnknown=true;state.data.note='你已表示时间仍未知：保持待条件，不再主动追问；可补证、暂缓或以后主动更新。';render();announce('仍未知，已收起问题，未取得建议资格。');return;}
      state.data.answer=b.dataset.answer;state.data.phase='reviewing';state.data.ready=false;state.data.note='已收到合成时间回答，仅建议需重审；数字和观察不重算。';render();
    }
  }
  $('thread').addEventListener('click',act);$('detail').addEventListener('click',act);
  $('scene').addEventListener('change',e=>reset(e.target.value));
  $('new').addEventListener('click',()=>{reset('complete');announce('仅复位审核情境，未创建真实任务。');});
  $('current-session').addEventListener('click',()=>{closeDrawer();$('main').focus();});
  $('history').addEventListener('click',e=>openDrawer('evidence',true,e.currentTarget));
  $('details').addEventListener('click',e=>openDrawer(state.tab,false,e.currentTarget));
  $('materials').addEventListener('click',e=>openDrawer('materials',false,e.currentTarget));
  $('close').addEventListener('click',()=>closeDrawer());
  for(const id of ['quick','professional']) $(id).addEventListener('click',()=>{state.mode=id;render();});
  for(const b of document.querySelectorAll('[data-stage]')) b.addEventListener('click',()=>{state.stage=Number(b.dataset.stage);state.preview=null;render();});
  for(const t of document.querySelectorAll('[data-tab]')) t.addEventListener('click',()=>{state.tab=t.dataset.tab;state.source=false;renderDetail();t.focus();});
  document.querySelector('.detail-tabs').addEventListener('keydown',e=>{
    const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(document.activeElement);
    if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    state.tab=tabs[n].dataset.tab;state.source=false;renderDetail();tabs[n].focus();
  });
  document.addEventListener('keydown',e=>{
    if($('drawer').hidden)return;
    if(e.key==='Escape'){closeDrawer();return;}
    if(e.key==='Tab'&&window.matchMedia('(max-width:1100px)').matches){
      const list=[...$('drawer').querySelectorAll('button:not([tabindex="-1"]),[tabindex="0"]')],first=list[0],last=list[list.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.addEventListener('resize',syncOverlay);
  $('advance').addEventListener('click',()=>{
    if(state.data.phase!=='reviewing'||state.stopped)return;
    state.data.phase='done';state.data.ready=state.data.answer==='yes';
    state.data.conditions=state.data.answer==='yes'?'用户已给定核对职责、权限、200元费用上限，并补充确认未来3天可安排2小时。合成重审仅支持当前核对安排，不保证原因或收益。':'用户明确未来3天不能安排2小时。当前时间条件与核对安排冲突；其它已知资料和费用条件不变。';
    state.data.note=state.data.answer==='yes'?'合成重审支持当前核对安排，等待人的选择，不自动执行。':'合成重审发现时间冲突：当前安排不可推荐，仍可补证／暂缓／不行动。';
    render();
  });
  $('stop').addEventListener('click',()=>{state.stopped=true;state.selected=false;state.data.ready=false;announce('合成停止状态，未操作后台；生产真实停止／UNKNOWN见原完整合同。');render();});
  $('composer').addEventListener('submit',e=>{e.preventDefault();const m=$('message').value.trim();if(!m)return;state.messages.push(m);$('message').value='';render();announce('输入已安全显示，没有调用模型或执行新分析。');});
  api.state=state;api.reset=reset;api.openDrawer=openDrawer;api.closeDrawer=closeDrawer;
  render();
})();
