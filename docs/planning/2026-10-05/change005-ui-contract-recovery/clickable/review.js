/* Product/UI review only. No network, filesystem, credentials or backend simulation. */
(() => {
  'use strict';
  const q = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const professional = document.body.dataset.contractSurface === 'professional';
  const demo = new URLSearchParams(location.search).get('preview') === 'demo';
  document.body.classList.toggle('empty-preview', !demo);
  const note = q('.mock-banner');
  if (note) note.textContent = demo
    ? '界面审阅 · 原 Demo 合成交互；不代表 Change005 已实现，不读取真实文件，不调用模型。'
    : '界面合同 · 未连接后端；未取得真实记录的区域为空，操作不执行。';
  if (!professional) {
    const toolbar = document.createElement('nav');
    toolbar.className = 'review-controls';
    toolbar.setAttribute('aria-label', '仅供审核的预览控制，不属于生产功能');
    toolbar.innerHTML = '<span>仅供审核</span><a href="index.html" class="' + (!demo ? 'current' : '') + '">能力未接通／空状态</a><span>·</span><a href="index.html?preview=demo" class="' + (demo ? 'current' : '') + '">查看原 Demo 合成交互</a><span>·</span><label>状态预览 <select id="review-state" aria-label="仅供审核的状态预览"><option value="empty">未接通</option><option value="missing">缺少信息</option><option value="failed">处理失败</option><option value="stopped">已停止</option><option value="reopen">重开待继续</option></select></label><a href="px006/reference.html" target="_blank">原 PX-006</a><a href="px004/reference.html" target="_blank">原 PX-004</a>';
    note.insertAdjacentElement('afterend', toolbar);
    q('#professional-frame').src = 'px004/index.html' + (demo ? '?preview=demo' : '');
  }
  function modeChanged() {
    if (professional) return;
    const pro = q('#mode-pro').getAttribute('aria-selected') === 'true';
    document.body.classList.toggle('professional-active', pro);
    q('#btn-drawer').setAttribute('aria-controls', pro ? 'professional-frame' : 'drawer');
    if (pro) q('#btn-drawer').setAttribute('aria-expanded', 'true');
  }
  function setEmptyMode(mode) {
    all('[data-mode]').forEach(b => {
      const active = b.dataset.mode === mode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
      b.tabIndex = active ? 0 : -1;
    });
    q('#view-quick').hidden = mode !== 'quick'; q('#view-pro').hidden = mode !== 'pro';
    modeChanged();
  }
  function showStage(stage) {
    all('.main > .view').forEach(v => { v.hidden = v.id !== 'view-' + stage; });
    all('[data-stage]').forEach(b => {
      b.classList.toggle('active', b.dataset.stage === stage);
      b.classList.remove('locked'); b.setAttribute('aria-disabled', 'false');
    });
    const label = {home:'新建分析',prepare:'数据准备',process:'本地处理',analysis:'循证分析',report:'报告',feedback:'执行反馈'}[stage];
    for (const id of ['#status-stage','#insp-stage-name']) if (q(id)) q(id).textContent = label;
  }
  function empty() {
    all('button').forEach(b => { b.disabled = true; b.title = '尚未接通：不产生业务效果'; });
    all('input,textarea').forEach(e => { e.value = ''; e.disabled = true; if(e.type==='checkbox') e.checked=false; });
    all('select').forEach(e => { e.innerHTML='<option>尚无项目</option>'; e.disabled=true; });
    all('tbody').forEach(e => { e.innerHTML='<tr><td colspan="12" class="contract-empty">暂无数据</td></tr>'; });
    all('.kv dd').forEach(e => { e.textContent = '—'; });
    all('.filelist,.insp-list,.insp-log,.dirtree').forEach(e => { e.innerHTML='<li class="contract-empty">暂无记录</li>'; });
    all('.sb-section .sb-list').forEach(e => { e.innerHTML='<li class="contract-empty">暂无记录</li>'; });
    all('.dot,.syn-tag,.fail-toggle,.mock-files').forEach(e => { e.hidden = true; });
    all('.sb-user,.fb-id').forEach(e=>{e.textContent=e.classList.contains('fb-id')?'—':'用户';});
    for (const id of ['#status-run','#insp-data-stage']) if(q(id)) q(id).textContent='未启动';
    for (const id of ['#status-boundary','#insp-model-visible']) if(q(id)) q(id).textContent='未授权外发';
    if(q('#pill-boundary'))q('#pill-boundary').textContent='模型可见：尚无获准材料';
    if (professional) {
      all('.view p,.view .fb-text,.pstep .fine').forEach(e => { e.textContent='暂无真实记录；能力未接通时保留此位置，不生成演示结果。'; });
      all('.view .chip').forEach(e => { e.textContent='暂无记录'; });
      q('#thread').innerHTML='<div class="empty"><p class="empty-icon" aria-hidden="true">◇</p><p>暂无分析对话、假设、证据或协作结果。</p></div>';
      all('.report-sec ul,.report-sec ol').forEach(e=> {e.innerHTML='<li class="contract-empty">暂无记录</li>';});
      q('.report-head h2').textContent='暂无报告';
      all('[data-stage]').forEach(b => {b.disabled=false;b.title='只浏览布局，不执行任务';b.addEventListener('click',()=>showStage(b.dataset.stage));});
      all('[data-insp]').forEach(b => { b.disabled=false; b.title='查看空状态';b.addEventListener('click',()=>{
        all('.insp-pane').forEach(p=>p.hidden=p.id!=='insp-'+b.dataset.insp);
        all('[data-insp]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-selected',String(t===b));t.tabIndex=t===b?0:-1;});
      });});
      q('#btn-inspector').disabled=false;q('#btn-insp-close').disabled=false;
      q('#btn-inspector').addEventListener('click',()=>{q('#inspector').hidden=!q('#inspector').hidden;});
      q('#btn-insp-close').addEventListener('click',()=>{q('#inspector').hidden=true;});
      showStage('home');
    } else {
      q('.topbar-project').textContent='尚未选择项目';
      q('#mode-memory-note');
      q('.sb-note').textContent='视图切换不执行、不转换任务、不复制或覆盖原记录。';
      q('#thread').innerHTML='<div class="empty"><p class="empty-icon" aria-hidden="true">◇</p><p>暂无会话。接通后在这里提出问题、提供资料并查看任务结果。</p></div>';
      q('#composer-wrap').hidden=false;
      q('#composer-input').placeholder='请描述你想了解的问题';
      q('#composer-boundary').textContent='尚无模型可见材料';
      q('.composer-hint').textContent='接通后在这里选择资料；尚未执行任何处理。';
      all('[data-mode]').forEach(b=>{b.disabled=false;b.title='切换视图';b.addEventListener('click',()=>setEmptyMode(b.dataset.mode));});
      q('#mode-quick').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){setEmptyMode('pro');q('#mode-pro').focus();}});
      q('#mode-pro').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){setEmptyMode('quick');q('#mode-quick').focus();}});
      q('#btn-drawer').disabled=false;q('#btn-drawer-close').disabled=false;
      q('#btn-drawer-close').addEventListener('click',()=>{q('#drawer').hidden=true;q('#btn-drawer').setAttribute('aria-expanded','false');});
      setEmptyMode('quick');
    }
  }
  async function loadScript(src) {
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.append(s);});
  }
  function diffPreview() {
    const veil=document.createElement('div');
    veil.className=professional?'guide-veil':'veil';
    const dialog=document.createElement('div');
    dialog.className=professional?'guide':'dialog';
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','变更预览 · 确认应用');
    dialog.innerHTML='<div class="insp-head"><h2 class="insp-title">变更预览 · 确认应用</h2><button type="button" class="btn btn-ghost" data-close>取消</button></div><p class="fine">仅合成界面审阅。真实接入时只读试跑前10行，在本地显示输入/输出及排除差异；明细不发模型，原文件不改。</p><div data-before><h3 class="insp-h">变更前 · 原始资料只读</h3></div><div data-after><h3 class="insp-h">变更后 · 待应用派生产物</h3></div><p class="fine">确认只代表应用此版本，不代替资格检查、独立复算或正式人审。</p><div class="actions"><button type="button" class="btn btn-primary" data-apply>确认应用</button></div>';
    if(professional){
      dialog.querySelector('[data-before]').append(q('#view-prepare .preview').cloneNode(true));
      dialog.querySelector('[data-after]').append(q('#process-summary .preview').cloneNode(true));
    } else {
      const table=rows=>{const t=document.createElement('table');t.className='tbl';rows.forEach((row,i)=>{const tr=document.createElement('tr');row.forEach(value=>{const cell=document.createElement(i===0?'th':'td');cell.textContent=value;tr.append(cell);});t.append(tr);});return t;};
      const label=document.createElement('p');label.className='fine';label.textContent='合成预览：原始3行来自随包PX-004，派生3行来自PX-006；只演示本地前后预览，不运行代码。';
      dialog.querySelector('[data-before]').append(label,table([
        ['order_id','member_id','store','sku','amount','date'],
        ['SO-90001','M-1024','上海徐汇店','SKU-A113','¥1,280','2026-06-02'],
        ['SO-90002','M-2077','杭州湖滨店','SKU-B208','¥860','2026-06-02'],
        ['SO-90003','M-1024','上海徐汇店','SKU-C305','¥2,340','2026-06-05']
      ]));
      dialog.querySelector('[data-after]').append(table(window.DEMO_DATA.aggArtifact.preview));
    }
    veil.append(dialog);document.body.append(veil);
    let replay=false,returnFocus=null;
    const close=()=>{veil.hidden=true;returnFocus?.focus();};
    dialog.querySelector('[data-close]').addEventListener('click',close);
    dialog.querySelector('[data-apply]').addEventListener('click',()=>{close();replay=true;returnFocus.click();replay=false;});
    veil.hidden=true;
    document.addEventListener('click',e=>{
      const button=e.target.closest('button');
      if(!button || replay || !(professional?['btn-run-process','btn-reprocess','btn-retry-process'].includes(button.id):button.dataset.act==='run-process'))return;
      e.preventDefault();e.stopImmediatePropagation();returnFocus=button;veil.hidden=false;
      dialog.querySelector('[data-apply]').focus();
    },true);
    veil.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
      if(e.key==='Tab'){
        const controls=[...dialog.querySelectorAll('button')],first=controls[0],last=controls.at(-1);
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
  }
  async function init() {
    if (demo) {
      const prefix=professional?'':'px006/';
      await loadScript(prefix+'data.js');
      if(professional && window.XANTHIL_DEMO_DATA?.stageNames){
        window.XANTHIL_DEMO_DATA.stageNames.analysis='循证分析';
        window.XANTHIL_DEMO_DATA.commands.forEach(c=>{c.label=c.label.replace(/自由分析/g,'循证分析');});
      }
      await loadScript(prefix+'app.js');
      diffPreview();
      if (!professional) new MutationObserver(modeChanged).observe(q('#mode-pro'),{attributes:true,attributeFilter:['aria-selected']});
      if (professional) {
        q('#process-summary .card-h').textContent='变更预览与产物预览';
        q('#gate-card .card-h').textContent='材料授权 · 使用获准材料';
        q('#gate-desc').textContent='变更应用已在处理前单独确认。这里是材料可见授权：真实接入先核验已有授权，必要变更才重新确认；CSV/XLSX 明细不直接外发。';
        q('#btn-approve-gate').textContent='确认材料边界并进入循证分析 →';
      }
    } else empty();
    const composer=q('.composer-foot');
    if(composer)for(const label of ['保存','停止','继续']){
      const b=document.createElement('button');b.type='button';b.className='btn btn-ghost btn-sm';b.textContent=label;
      b.disabled=true;b.title='生命周期控件位置：此稿未连接真实任务，不产生保存/停止/继续效果';
      composer.insertBefore(b,composer.lastElementChild);
    }
    if(!professional){
      q('#review-state').disabled=demo;
      q('#review-state').addEventListener('change',e=>{
        const states={empty:['未启动','暂无会话。接通后在这里提出问题、提供资料并查看任务结果。'],missing:['等待必要信息','状态示意：缺少合法两期或会员/订单关联信息。仅补影响结果的资料，不填整套专业表单。'],failed:['失败','状态示意：本地准备未通过资格检查。未生成可信发现或报告；保留资料及失败，重试资格由后台核验。'],stopped:['已停止','状态示意：后续推进关闭；在途未知需先核验，迟到不能正式发布。关闭网页与停止不是同一动作。'],reopen:['重开待继续','状态示意：已保存的记录只读回；刷新和服务重启不执行。显式继续后后台复用或重新核验必要授权，不清零预算。']};
        const [status,description]=states[e.target.value];q('#status-run').textContent=status;
        q('#thread').innerHTML='<div class="empty"><p></p></div>';q('#thread p').textContent=description;
        try{q('#professional-frame').contentWindow.postMessage({type:'contract-state',status,description},'*');}catch{}
      });
    }
    if (!professional) q('#btn-drawer').addEventListener('click',e=>{
      if(!document.body.classList.contains('professional-active')) {
        if(!demo){q('#drawer').hidden=!q('#drawer').hidden;q('#btn-drawer').setAttribute('aria-expanded',String(!q('#drawer').hidden));}
        return;
      }
      e.stopImmediatePropagation();
      const frame=q('#professional-frame');
      try {frame.contentDocument.querySelector('#btn-inspector').click();} catch {frame.contentWindow.postMessage({type:'contract-inspector'},'*');}
    },true);
    if(!professional)document.addEventListener('keydown',e=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='i'&&document.body.classList.contains('professional-active')){
        e.preventDefault();e.stopImmediatePropagation();q('#btn-drawer').click();
      }
    },true);
    window.addEventListener('message',e=>{
      if(e.source!==parent || !professional)return;
      if(e.data?.type==='contract-inspector')q('#btn-inspector').click();
      if(!demo && e.data?.type==='contract-state'){
        q('#status-run').textContent=e.data.status;
        q('#thread').innerHTML='<div class="empty"><p></p></div>';q('#thread p').textContent=e.data.description;
      }
    });
    document.documentElement.dataset.reviewReady='true';
  }
  init().catch(()=>{if(note)note.textContent='审阅资源加载失败：没有执行任何任务，请重新打开本地文件。';});
})();
