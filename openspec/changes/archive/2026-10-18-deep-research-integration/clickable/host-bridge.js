/* DR-002 review-only host seam. Every record is synthetic and memory-only. */
(() => {
  const sessions = new Map();
  let active = null, originButton = null;
  const pane = document.createElement('section');
  pane.className = 'research-pane'; pane.hidden = true;
  pane.setAttribute('aria-label', '深度研究完整工作台');
  pane.innerHTML = `<header class="research-return"><button id="return-host">← 返回原任务</button><strong id="research-task"></strong><span>UI 审核 DR-002 · 全部为合成数据 · 无真实请求</span></header><div id="research-frames"></div>`;
  document.body.append(pane);
  const receiptDialog=document.createElement('dialog');receiptDialog.className='research-copy';receiptDialog.innerHTML='<h2>已保存的研究副本（合成）</h2><pre></pre><form method="dialog"><button>关闭</button></form>';document.body.append(receiptDialog);
  function task() { return document.querySelector('.navitem.active[data-id]')?.dataset.id || 'sales'; }
  function taskName() { return document.querySelector('.taskhead h1')?.textContent?.trim() || (task()==='sales'?'经营分析任务':'会员分析任务'); }
  function open(button) {
    originButton = button; active = task();
    if (!sessions.has(active)) {
      const frame = document.createElement('iframe'); frame.title = `深度研究 · ${taskName()}`;
      frame.src = `plugin.html?task=${encodeURIComponent(active)}#/project/demo/plan`;
      document.querySelector('#research-frames').append(frame);
      sessions.set(active, {frame, name:taskName(), receipts:[]});
    }
    for (const [id,s] of sessions) s.frame.hidden = id!==active;
    document.querySelector('#research-task').textContent = sessions.get(active).name;
    document.querySelector('#app').inert = true; pane.hidden = false;
    document.querySelector('#return-host').focus();
  }
  function close() { pane.hidden=true; document.querySelector('#app').inert=false; originButton?.focus(); decorate(); }
  document.querySelector('#return-host').onclick=close;
  pane.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target===document.querySelector('#return-host'))close();});
  function decorate() {
    const actions = document.querySelector('.workspace .top-actions') || document.querySelector('.top-actions');
    if(actions && !actions.querySelector('[data-research]')) {
      const b=document.createElement('button'); b.dataset.research='true'; b.className='primary'; b.textContent='深度研究'; b.onclick=()=>open(b); actions.append(b);
    }
    const launch=actions?.querySelector('[data-research]');if(launch){launch.disabled=!document.querySelector('.taskhead');launch.title=launch.disabled?'先选择一个原任务，再打开深度研究':'';}
    const head=document.querySelector('.taskhead');
    if(head&&!head.querySelector('.research-receipts')) {
      const box=document.createElement('div');box.className='research-receipts';head.append(box);
    }
    const box=document.querySelector('.research-receipts');const s=sessions.get(task());
    const message=s?.receipts.length?`已保存研究副本（审核演示） · ${s.receipts.length} 份 · ${s.receipts.at(-1).label} · 刷新页面后清空`:'';
    if(box&&box.dataset.receiptText!==message){box.dataset.receiptText=message;box.textContent=message;if(message){const read=document.createElement('button');read.textContent='查看研究副本';read.onclick=()=>{const r=s.receipts.at(-1);receiptDialog.querySelector('pre').textContent=r.label+'\n\n'+r.report+'\n\n限制：\n'+r.limitations.join('\n')+'\n\n此副本是内存演示；刷新后清空，没有实际持久化。';receiptDialog.showModal();};box.append(read);}}
    document.querySelectorAll('a[href="proposal-v0.1.md"],a[href="ui-contract-v0.1.md"],a[href="baseline-and-coverage.md"]').forEach(a=>{a.href='contract.html';});
  }
  window.addEventListener('message', e=>{
    if(e.origin!==location.origin||e.data?.type!=='research-save')return;
    const match=[...sessions.entries()].find(([,s])=>s.frame.contentWindow===e.source);
    if(!match||match[0]!==active)return;
    const s=match[1]; const r=e.data.receipt;
    if(!r||typeof r.key!=='string'||typeof r.label!=='string')return;
    if(!s.receipts.some(x=>x.key===r.key))s.receipts.push(r);
    e.source.postMessage({type:'research-saved',key:r.key},location.origin); decorate();
  });
  new MutationObserver(decorate).observe(document.querySelector('#app'),{childList:true,subtree:true}); decorate();
})();
