(() => {
 const bar=document.querySelector('#review-controls');
 bar.innerHTML=`<details><summary>审核场景（合成）</summary><div><button data-scene="reset">从新研究开始</button><button data-scene="limited">预算耗尽 → 有限交付</button><button data-scene="published">模拟完整交付</button><button data-scene="failed">模拟运行失败</button><button data-scene="unknown">状态未知</button><button data-scene="unavailable">服务不可用</button><button data-scene="normal">恢复查询</button><button data-scene="cancelled">确认取消终态</button><button data-scene="source-missing">原文不可用</button><button data-scene="save-failed">保存失败</button></div></details><span id="seam-status" role="status">合成材料 · 首期不启用记忆与追问</span><button id="save-host">保存所选版本到原任务</button>`;
 const message=t=>{document.querySelector('#review-dialog-text').textContent=t;document.querySelector('#review-dialog').showModal();};
 bar.addEventListener('click',e=>{const s=e.target.dataset.scene;if(!s)return;try{window.reviewState.scene(s);update();}catch(err){message(err.message)}});
 let saved=null;
 function update(){const s=window.reviewState;let text=s.unknown?'状态未知：尚未确认是否仍在执行；重新查询不会重跑。':s.unavailable?'服务不可用：可返回原任务，既有成果不受影响。':s.cancelPending?'取消请求已受理，尚未确认停止；请用审核场景模拟终态。':s.saveFailure?'保存失败演示已开启：原版本保留，可恢复查询后重试。':s.sourceMissing?'原文不可用：保留引用与限制，不冒充已核实。':saved?'已保存研究副本（合成演示）；返回原任务可见。':'合成材料 · 首期不启用记忆与追问';document.querySelector('#seam-status').textContent=text;
 document.querySelectorAll('input[type=file]').forEach(i=>{i.disabled=true;i.title='审核稿不读取文件，请使用合成材料';});
 document.querySelector('#save-host').disabled=!location.hash.startsWith('#/project/');
 document.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='追问'){b.disabled=true;b.title='首期未启用会话研究记忆与追问';}});
 const badge=document.querySelector('.boundary-badge');if(badge&&badge.textContent!=='● 合成审核 · 无真实请求'){badge.textContent='● 合成审核 · 无真实请求';badge.title='本页不启动研究服务、不调用模型、不读取真实文件。';}
 }
 document.querySelector('#save-host').onclick=()=>{const s=window.reviewState,p=s.activeProject();if(s.unavailable||s.unknown){message('服务状态未确认，不能保存新的副本。');return}if(s.saveFailure){message('保存失败（合成）：原版本和既有副本保留；恢复查询后可重试。');return}const v=s.selectedVersion||p?.meta.versions.at(-1)?.version;if(!p||!v){message('先发布为研究版本并选择该版本，再保存到原任务。');return}const b=p.bundles[v];const r={key:p.meta.id+':'+v,label:`${p.meta.goal} · v${v} · ${b.limitations.some(t=>t.includes('有限交付'))?'有限交付':'完整交付'}`,version:v,limitations:b.limitations,report:b.reportMd,synthetic:true};if(parent===window){message('请从 JuanerAI 原任务入口打开，才能演示宿主副本。');return}parent.postMessage({type:'research-save',receipt:r},location.origin);};
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='research-saved')return;saved=e.data.key;update();});
 window.addEventListener('review-state',update);
 document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const href=a.getAttribute('href')||'';if(href.startsWith('/api/')||/^https?:/.test(href)){e.preventDefault();message(href.startsWith('/api/')?'审核稿仅展示导出入口，不生成真实 HTML、PDF、PPTX 或 ZIP。正式接线须验证实际产物。':'审核稿不访问外部原文；可在证据栏查看合成快照。');}},true);
 new MutationObserver(update).observe(document.querySelector('#root'),{childList:true,subtree:true});update();
})();
