/* Review-only memory state. No IO / Provider / persisted business effects. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const future = '净销售修正版 · D1待发布（合成）';
  let state, focusReturn, drawerReturn, dialogReturn;
  const phaseLabels = {idle:'待开始',running:'读取合格资料，形成实际计划（合成）',checking:'本地计算与独立核验（合成）',saved:'报告与采用记录已保存（合成）',missing:'等待补充资料',ambiguity:'等待选择影响结果的口径',failed:'新结果核验失败',stopped:'已停止；重新打开未执行'};
  const initial = scene => ({scene,phase:scene==='missing'?'missing':scene==='ambiguity'?'ambiguity':scene==='calcfail'?'failed':scene==='stopped'?'stopped':scene==='version'||scene==='downloadfail'?'saved':'idle',version:'payment',savedVersion:'payment',projectVersion:'payment',selection:scene==='original'?'old100':scene==='tamper'?'tamper':scene==='collision'?'collision':'candidatePayment',checked:false,approved:!['normal','original','tamper','collision','savefail'].includes(scene),manage:false,report:false,history:false,tab:'meaning',download:null,saveFailed:false,messages:[],taskNumber:1});
  function notify(text) { $('notice').textContent=text; }
  function labelVersion(v=state.version) {return v==='payment'?'按支付期间归属':'按退款完成期间归属';}
  function candidate() {return state.selection.startsWith('candidate');}
  function blocked() {return ['old100','old101','tamper','collision'].includes(state.selection);}
  function button(action,text,primary=false,disabled=false) {return `<button class="btn btn-sm${primary?' btn-primary':''}" data-action="${action}"${disabled?' disabled':''}>${text}</button>`;}
  function restoreFocus(target,fallback) {
    const current=target?.isConnected?target:target?.id?$(target.id):target?.dataset.action?document.querySelector('[data-action="'+target.dataset.action+'"]'):null;
    (current||$(fallback))?.focus();
  }
  function openWorkspace(kind,trigger) {
    if(trigger)focusReturn=trigger;
    state.manage=kind==='manage';state.report=kind==='report';state.history=kind==='history';
    render();$('workspace').focus();
  }
  function back() {state.manage=state.report=state.history=false;render();restoreFocus(focusReturn,'manage');}
  function openDrawer(tab='meaning',trigger=$('details')) {drawerReturn=trigger;state.tab=tab;$('drawer').hidden=false;$('drawer').classList.add('visible');$('details').setAttribute('aria-expanded','true');renderDetail();$('tab-'+tab).focus();}
  function closeDrawer() {$('drawer').hidden=true;$('drawer').classList.remove('visible');$('details').setAttribute('aria-expanded','false');restoreFocus(drawerReturn,'details');}
  function openVersion(trigger) {if(!state.approved){notify('演示须先完成项目一次批准。');return;}dialogReturn=trigger;$('version-dialog').showModal();$('adopt-version').focus();}
  function closeVersion() {$('version-dialog').close();restoreFocus(dialogReturn,'manage');}
  function importView() {
    let feedback='<p class="fine">文件仅为合成选项；生产由用户选择实际发布包及登记，正常入口校验后端保存。</p>';
    if(state.checked) {
      if(state.selection==='tamper')feedback='<div class="asset-error" role="alert"><strong>未导入 · 内容指纹不符</strong><p>原项目配置不变。请取得正确发布文件；不会删除条目后部分安装。</p></div>';
      else if(state.selection==='collision')feedback='<div class="asset-error" role="alert"><strong>未导入 · 同版本不同内容</strong><p>相同 id@version 已有不同字节快照；不能覆盖，请供应维护者发布新版本。</p></div>';
      else if(blocked())feedback='<div class="asset-warning"><strong>已保存合法候选 · 不可用于这次复盘</strong><ul class="asset-list"><li>成交总额 → 客单价 → 成交总额，公式依赖循环。</li><li>退款率缺少机器可用的分子与分母。</li><li>方法引用未找到精确实现。</li><li>场景要求近13周；仅两期总额不构成完整采用。</li></ul><p>保持原包不变。由供应维护者发布自洽新版本，不在此偷偷换公式。</p></div>';
      else if(state.saveFailed)feedback='<div class="asset-error" role="alert"><strong>采用配置保存失败</strong><p>候选和输入保留；原有效配置不变，尚未批准生效。可读回后重试保存，不重跑分析。</p></div>';
      else feedback=`<div class="asset-note"><strong>候选检查通过（合成）· 尚不等于已采用</strong><p>所选范围：净销售、成交总额、完成退款额及退款率；不是55项全部可执行。</p><p>${future}。生产必须取得真实文件和精确身份。</p></div>`;
    }
    return `<p>由本项目口径维护者一次配置，普通任务以后复用。这里不编辑供应指标或安装可执行插件。</p>
      <div class="asset-summary"><div class="asset-line"><h3>项目可复用口径</h3><span class="small-status ${state.approved?'good':'warn'}">${state.approved?'已批准范围（合成）':'尚未批准'}</span></div><p>${state.approved?future+' · '+labelVersion(state.projectVersion):'尚无本轮可复用口径；既有任务及旧配置不受候选导入影响。'}</p><p class="asset-meta">作用域：当前项目 · 维护者：当前用户（D2待确认） · 正向发布身份待D1附件</p>${state.approved?button('version','查看新版差异'):''}</div>
      <div class="asset-summary"><h3>导入发布文件</h3><div class="asset-choices"><label for="package-choice">口径文件（合成选项）<select id="package-choice"><option value="candidatePayment">D1修正版 · 支付归属（待发布占位）</option><option value="candidateCompletion">D1修正版 · 退款完成归属（待发布占位）</option><option value="old100">net-sales-instance@1.0.0 · 原件</option><option value="old101">net-sales-instance@1.0.1 · 原件</option><option value="tamper">篡改文件 · 拒绝样例</option><option value="collision">同版本不同字节 · 拒绝样例</option></select></label><div><span class="fine">发布登记</span><p class="asset-meta">原件使用已固定 releases/index.yaml；D1正向登记待取得。本页不读取文件。</p></div></div>${button('check','检查并保存候选',true)}${feedback}
      <div class="actions">${button('approve','批准本项目复用',true,!state.checked||!candidate())}<span class="fine">${blocked()?'所选复盘不可计算，不能批准。':'批准此闭包与范围，不批准全部指标。'}</span></div></div>`;
  }
  function resultView(history=false) {
    const pending=state.phase!=='saved'&&!history;
    const version=history?'payment':pending?state.savedVersion:state.version,values=version==='payment'?[70,80]:[100,50];
    return `<p class="asset-meta">${history?'历史报告 · 不随新版改写':'当前成果 · 合成样例'} · ${future} · ${labelVersion(version)}</p>
      ${pending?'<div class="asset-warning">当前修订（'+labelVersion()+'）尚无合格新结果。下表仅保留旧口径的旧报告样例，不能标为当前成功或下载新回执。</div>':''}
      <div class="asset-result"><h3>${version==='payment'?'P1净额70元，P2净额80元':'P1净额100元，P2净额50元'}</h3><p>30元完成退款在P2发生。两种归属改变期间分布，不改变合计净额150元；不能因此认定销售业务本身改变。</p>
      <div class="asset-table-wrap"><table class="asset-table"><caption>判别性oracle简表 · 人工构造两期，不冒充完整13周真实报告</caption><thead><tr><th scope="col">期间</th><th class="num" scope="col">成交金额（元）</th><th class="num" scope="col">归属退款（元）</th><th class="num" scope="col">净额（元）</th></tr></thead><tbody><tr><th scope="row">P1</th><td class="num">100</td><td class="num">${version==='payment'?30:0}</td><td class="num">${values[0]}</td></tr><tr><th scope="row">P2</th><td class="num">80</td><td class="num">${version==='payment'?0:30}</td><td class="num">${values[1]}</td></tr><tr class="total"><th scope="row">合计</th><td class="num">180</td><td class="num">30</td><td class="num">150</td></tr></tbody></table></div></div>
      <div class="asset-summary"><h3>口径来源与采用记录</h3><p>${labelVersion(version)} · 含退款成交总额减完成退款额 · 截止包含P2结束。</p><p>展示归属／状态／关联／单位／组件核验范围；真实证据和精确身份在生产后端提供，本页没有核验PASS。</p><p class="asset-meta">实际指标／场景列表、双指纹、Owner批准、数据与IR／Run身份：此处待真实结果绑定，不伪造hash。</p><p>建议：检查退款集中发生的订单／品类，再由人判断是否调整治理；描述性观察，不是因果或行动执行。</p><div class="actions">${button('meaning','查看口径')}${button('evidence','查看核验范围')}${button('receipt','下载采用回执',false,pending)}${button('reportdownload','下载报告',false,pending)}${!history?button('version','比较另一归属版本'):''}</div></div>
      <div id="download-status" role="status">${state.download?escape(state.download):'后端保存／本机下载／供应登记分别记录；本页仅预演反馈，未生成文件。'}</div>`;
  }
  function taskView() {
    const question=state.taskNumber===1?'复盘近13周净销售变化，比较两段期间，说明销售和退款侧的变化。':'再用本次新订单／退款资料，做同口径复盘。';
    let answer=state.approved?`沿用已批准项目口径（合成）：${labelVersion()}。我会重新检查本次资料与字段，不复用上次数据或数字。`:'普通任务无需配置指标。先由维护者在“分析口径”完成一次检查／批准，再自动复用适用版本。';
    if(state.phase==='missing')answer='缺少退款完成时间，无法判断本期完成退款和观察截止。请补齐该列；任务已保存待资料，不硬算净额。';
    if(state.phase==='ambiguity')answer='有两种已批准口径会改变期间结果。这次是回看支付订单净额，还是看本期完成退款的净额？';
    if(state.phase==='failed')answer='本次新版本独立核验未通过。保留失败与旧报告；旧版可看，但不是当前修订成功。';
    if(state.phase==='stopped')answer='任务已停止。打开历史／刷新未执行；显式恢复后仍需核验权限、输入、资产版本和未完成部分。';
    const controls=state.phase==='saved'?button('report','展开成果',true)+button('meaning','查看口径来源')+button('second','第二次任务复用'):state.phase==='ambiguity'?button('choosePayment','看支付订单净额',true)+button('chooseCompletion','看退款完成净额'):state.phase==='stopped'?button('resume','显式恢复演示',true)+button('history','查看旧报告'):state.phase==='missing'?button('materials','查看缺少资料')+button('backlog','保存待补资料'):state.phase==='failed'?button('history','查看旧报告')+button('evidence','查看失败依据'):button('manage','分析口径')+button('meaning','检查业务含义');
    return `<article class="msg msg-user"><div class="msg-role">用户 · 合成需求</div><div class="msg-body"><p>${question}</p></div></article><article class="msg msg-agent"><div class="msg-role">分析 Agent · 合成回复</div><div class="msg-body"><p>${answer}</p><div class="actions">${controls}</div></div></article>${state.messages.map(t=>`<article class="msg msg-user"><div class="msg-role">仅显示输入 · 未执行</div><p class="message-user">${escape(t)}</p></article>`).join('')}`;
  }
  function renderDetail() {
    const meanings=`<h3>本次业务口径</h3><p>${state.approved?future:'尚未采用本轮口径'}</p><dl><div><dt>退款归属</dt><dd>${labelVersion()}</dd></div><div><dt>净额</dt><dd>含退款成交总额 − 已完成且符合期间归属的退款。</dd></div><div><dt>独立控制</dt><dd>支付成功、退款完成、观察截止、订单／退款唯一性与1:N、单位／时区／粒度。</dd></div></dl><p class="asset-meta">供应定义与当前客户字段分开。D1修正版身份待取得；不是模型猜测的新全局口径。</p>${button('manage','查看项目口径')}`;
    const content={meaning:meanings,plan:'<h3>调查与计算分责</h3><p>问题树只是参考，Agent按观察选择路线。后台将精确资产定义接到当前Binding与实际IR，所选公式／聚合／方法必须支持。</p><p>需要近13周完整序列；两个期间oracle不能替代真实场景完成。</p>',materials:'<h3>当前所选资料</h3><p>订单与退款（合成）。生产须有当前数据快照和有效任务许可；选择口径文件不等于授权正文外发。</p><p>退款需要支付关联、完成状态／完成时间及观察截止；完成归属需本窗口之前订单。</p>',evidence:'<h3>核验范围与不足</h3><p>从获准原件独立重建纳入集合与关联，检查状态／窗口／单位／粒度／1:N／双扣，再核对gross、refund、net及ratio分子分母。</p><p>本原型没有实际核验。多个Agent共识、同一代码重跑和supplier对账不构成独立验证。</p>',execution:`<h3>执行与历史</h3><p>当前：${phaseLabels[state.phase]}</p><p>沿用005真实授权、原生SDK、持久计量、根／子停止、迟到与UNKNOWN处理。不增Runtime或清账。</p><p>回执成功保存后下载可重试；失败不重算，重开不自动续跑。</p>`};
    $('detail').innerHTML=content[state.tab];$('detail').setAttribute('aria-labelledby','tab-'+state.tab);
    document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===state.tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  }
  function render() {
    $('status').innerHTML=`<span class="status-heading">${phaseLabels[state.phase]}</span><span class="fine">　${state.approved?labelVersion()+' · D1待发布占位':'项目口径尚未批准（演示）'}</span>`;
    const expanded=state.manage||state.report||state.history;$('workspace').hidden=!expanded;$('thread').hidden=expanded;$('composer').hidden=expanded;$('thread').innerHTML=taskView();
    $('workspace-heading').textContent=state.manage?'分析口径 · 维护者低频配置':state.history?'历史成果 · 原版本保留':'净销售复盘 · 成果与来源';
    if(expanded)$('workspace-body').innerHTML=state.manage?importView():resultView(state.history);
    const selection=$('package-choice');if(selection)selection.value=state.selection;
    $('task-title').textContent=state.taskNumber===1?'净销售复盘':'新资料 · 同口径复盘';
    renderDetail();
  }
  function advance() {
    if(state.manage){state.checked=true;if(state.scene==='savefail')state.saveFailed=true;render();return;}
    if(['missing','ambiguity','failed','stopped'].includes(state.phase)){notify('当前有具体等待／停止边界，推进按钮不会绕过。');return;}
    if(!state.approved){notify('演示中先完成项目口径一次批准。');openWorkspace('manage',$('advance'));return;}
    state.phase=state.phase==='idle'?'running':state.phase==='running'?'checking':'saved';if(state.phase==='saved')state.savedVersion=state.version;render();
  }
  function reset(scene) {if($('version-dialog').open)closeVersion();closeDrawer();state=initial(scene);$('message').value='';render();if(['original','tamper','collision','savefail'].includes(scene))openWorkspace('manage',$('scene'));}
  $('scene').addEventListener('change',e=>reset(e.target.value));$('advance').addEventListener('click',advance);
  $('manage').addEventListener('click',e=>openWorkspace('manage',e.currentTarget));$('back').addEventListener('click',back);
  $('details').addEventListener('click',()=> $('drawer').hidden?openDrawer():closeDrawer());$('close').addEventListener('click',closeDrawer);
  $('history').addEventListener('click',e=>openWorkspace('history',e.currentTarget));$('current-session').addEventListener('click',back);
  $('new').addEventListener('click',()=>{state.phase='idle';state.taskNumber++;state.version=state.projectVersion;state.messages=[];state.download=null;back();notify('新演示任务重新绑定当前资料；没有真实执行。');});
  $('stop').addEventListener('click',()=>{state.phase='stopped';state.manage=state.report=state.history=false;render();notify('合成根停止已完成；生产仍依真实在途／UNKNOWN结算，不以本页按钮证明。');});
  $('material-summary').addEventListener('click',e=>openDrawer('materials',e.currentTarget));
  for(const mode of ['quick','professional'])$(mode).addEventListener('click',()=>{for(const m of ['quick','professional']){$(m).setAttribute('aria-pressed',String(mode===m));$(m).classList.toggle('active',mode===m);}$('professional-view').hidden=mode!=='professional';});
  $('composer').addEventListener('submit',e=>{e.preventDefault();const text=$('message').value.trim();if(!text)return;state.messages.push(text);$('message').value='';render();notify('输入仅安全显示，未启动模型或任务。');$('message').focus();});
  document.addEventListener('change',e=>{if(e.target.id==='package-choice'){state.selection=e.target.value;state.checked=false;state.saveFailed=false;render();$('package-choice').focus();}});
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
    if(a==='check'){state.checked=true;state.saveFailed=false;render();notify(blocked()?'检查发现具体拒绝或不可计算原因。':'合成候选已保存，尚未批准。');}
    else if(a==='approve'){if(!candidate()||!state.checked)return;if(state.scene==='savefail'){state.saveFailed=true;render();notify('合成采用配置保存失败，原配置保留。');return;}state.approved=true;state.projectVersion=state.version=state.selection==='candidateCompletion'?'completion':'payment';state.phase='idle';render();notify('一次批准只用于当前项目所选范围（合成）；返回任务后演示推进。');}
    else if(a==='manage'||a==='report'||a==='history')openWorkspace(a,b);
    else if(['meaning','materials','evidence'].includes(a))openDrawer(a,b);
    else if(a==='version')openVersion(b);
    else if(a==='choosePayment'||a==='chooseCompletion'){state.version=a==='choosePayment'?'payment':'completion';state.phase='idle';render();notify('本任务明确选择，尚未执行；不修改供应包。');}
    else if(a==='second'){state.taskNumber++;state.phase='idle';state.version=state.projectVersion;state.messages=[];state.download=null;back();notify('合成新任务复用项目口径，重新绑定新资料，没有再次批准。');}
    else if(a==='resume'){state.phase='idle';render();notify('显式恢复演示；生产先核验有效许可和未知效果。未自动执行。');}
    else if(a==='backlog')notify('待补资料状态保留（合成），未计算。');
    else if(a==='receipt'||a==='reportdownload'){if(state.phase!=='saved'&&!state.history)return;state.download=state.scene==='downloadfail'&&state.download===null?'回执下载失败（合成）；后端已保存样例仍可查，仅重试下载，不重算。':(a==='receipt'?'采用回执':'报告')+'下载反馈已预演；未生成真实文件，供应未登记。';render();notify(state.download);}
  });
  document.querySelectorAll('[data-tab]').forEach(b=>{b.addEventListener('click',()=>{state.tab=b.dataset.tab;renderDetail();});b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(b);let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();state.tab=tabs[n].dataset.tab;renderDetail();tabs[n].focus();});});
  $('cancel-version').addEventListener('click',closeVersion);$('version-dialog').addEventListener('cancel',e=>{e.preventDefault();closeVersion();});
  $('activate-version').addEventListener('click',()=>{state.projectVersion='completion';render();closeVersion();notify('仅后续新任务默认新版，当前结果不变（合成）。');});
  $('adopt-version').addEventListener('click',()=>{state.projectVersion=state.version='completion';state.phase=state.scene==='calcfail'?'failed':'idle';state.download=null;render();closeVersion();notify('当前任务新修订待重算；旧报告保留（合成）。');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('version-dialog').open){if(!$('drawer').hidden)closeDrawer();else if(state.manage||state.report||state.history)back();}});
  state=initial('normal');render();
})();
