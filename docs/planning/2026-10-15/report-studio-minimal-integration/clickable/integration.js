/* 离线、纯合成审核。不得作为生产接线或运行成功证据。 */
'use strict';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const studio = params.get('surface') === 'studio';
const scenes = studio ? {
  normal:'正常制作与交付', enable:'首次启用可信本地模式', independent:'独立报告', config:'模型配置缺口', permission:'材料外发缺口', running:'正在制作与停止', unknown:'结果未知与恢复', exportfail:'导出失败', returnfail:'回传失败', receipt:'回执未知', warning:'质检警告', missing:'产物损坏或缺失', targetgone:'原分析目标不可用', exit:'退出或更新', version:'版本不可用'
} : {entry:'产品能力与插件', enable:'首次启用可信本地模式', empty:'没有分析成果', materials:'选择材料', config:'模型配置缺口', permission:'材料外发缺口', starting:'后台启动中', startfail:'启动失败', linked:'已有关联报告', updated:'来源已有新版', deleted:'插件工作项目已删除', version:'版本不可用'};
let scene = scenes[params.get('scene')] ? params.get('scene') : (studio ? 'normal' : 'entry');
let state, focusBefore, studioTab, linkedProjectSnapshot;
const childTabs = new Map();
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn = (a,label,primary=false,disabled=false) => `<button class="btn btn-sm${primary?' btn-primary':''}" data-action="${a}"${disabled?' disabled':''}>${label}</button>`;
const note = (title,text,actions='',kind='') => `<section class="status-box ${kind}" role="status"><strong>${title}</strong><p>${text}</p>${actions?`<div class="card-actions">${actions}</div>`:''}</section>`;
function tell(text){ $('announce').textContent=text; }
function modal(title,html){focusBefore=document.activeElement;$('modal-title').textContent=title;$('modal-body').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
function close(){ $('modal').close(); if(focusBefore?.isConnected)focusBefore.focus();else $('main')?.focus(); }
$('close-modal').onclick=close;
$('modal').addEventListener('cancel',e=>{e.preventDefault();close();});
$('scene').innerHTML=Object.entries(scenes).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');
$('scene').value=scene;
$('scene').onchange=()=>{scene=$('scene').value;reset();};
function reset(){
  linkedProjectSnapshot=null;
  if($('modal').open)close();
  state={trusted:scene!=='enable'&&(params.get('trusted')==='yes'||(params.get('trusted')!=='no'&&scene!=='entry')),pendingLaunch:null,pendingVersion:'v1',independent:scene==='independent'||params.get('mode')==='independent',version:params.get('version')||'v1',view:['normal','independent','config','permission'].includes(scene)?'chat':'deck',deck:!['normal','independent','config','permission'].includes(scene),locked:false,locks:{},page:1,delivery:0,exports:[],messages:[],runtime:scene==='running'||scene==='exit'?'running':scene==='unknown'?'unknown':'idle',configured:scene!=='config',permitted:scene!=='permission',readback:false,returnFailed:scene==='returnfail',exportFailed:scene==='exportfail',broken:scene==='missing',targetGone:scene==='targetgone',warning:scene==='warning',sourceChanged:scene==='updated',receiptUnknown:scene==='receipt',ready:!['starting','startfail'].includes(scene),materials:['结论摘要','渠道汇总表'],history:[]};
  if(studio)state.materials=state.independent?[]:(params.get('materials')||state.materials.join('、')).split('、');
  if(studio&&state.deck)state.exports=[{id:1,format:'PPTX',linked:false}];
  if(!studio&&['linked','updated','deleted'].includes(scene))state.history=[{id:1,format:'PPTX',version:'v1'}];
  draw();
  if(!studio&&['entry','enable','empty','materials','config','permission','starting','startfail','version'].includes(scene))openEntry();
  if(studio&&scene==='exit')modal('报告制作尚未结束',`<p>退出或更新前，须等待或停止制作并结算。不会静默杀死活动任务。</p><div class="card-actions">${btn('wait','等待完成',true)}${btn('quit-stop','停止制作并等待结算')}${btn('cancel-quit','取消退出')}</div>`);
}
function draw(){
  const activeAction=document.activeElement?.dataset?.action;
  $('studio-style').media=studio?'all':'not all';
  $('surface').innerHTML=studio?studioHTML():hostHTML();
  if(activeAction&&!$('modal').open){const target=[...$('surface').querySelectorAll('[data-action]')].find(el=>el.dataset.action===activeAction&&!el.disabled);(target||$('main'))?.focus();}
}
function hostHTML(){return `<div class="window"><header class="titlebar"><div class="tb-title"><span class="brand-name">Juaner<span class="brand-ai">AI</span></span><span class="brand-slogan">持续做出更好的决策</span><span>· Xanthil</span></div></header><div class="topbar"><div class="mode-switch"><button class="mode-btn active" aria-pressed="true" data-action="quick">快速模式</button><a class="mode-btn" href="../../../2026-10-05/change005-ui-contract-recovery/clickable/px004/index.html?preview=demo" target="_blank" rel="noopener">专业模式 · 原合同</a></div><span class="fine">经营分析 · 合成项目</span><div class="topbar-right">${btn('plugins','产品能力与插件')}</div></div><div class="app"><nav class="sidebar" aria-label="本项目会话"><button class="sb-new" data-action="existing">＋ 新建分析</button><h2 class="sb-h">本项目会话</h2><button class="sb-item active" data-action="quick">季度经营回顾<span class="sb-meta">当前分析 · ${state.sourceChanged?'v2':'v1'}</span></button><button class="sb-item" data-action="existing">人群画像对比</button><div class="sidebar-note"><strong>从问题到有依据的结果</strong><p class="fine">报告制作不改变原分析事实与核验结论。</p></div></nav><main id="main" class="main" tabindex="-1"><section class="section-pad"><h1>季度经营回顾</h1><p class="fine">${scene==='empty'?'尚无可保存的分析成果':'分析成果 '+(state.sourceChanged?'v2':'v1')+' · 合成样例'}</p><div class="analysis-card"><h2>${scene==='empty'?'今天，想弄清什么？':'分析报告已保存'}</h2><p>${scene==='empty'?'先说出你的问题，或打开报告工作台独立制作。':'直营渠道贡献较集中；退款影响仍待补充核验。主要发现、证据与限制随该版本保存。'}</p><div class="card-actions">${btn('existing','查看分析报告')}${btn('plugins','制作汇报材料',true)}</div></div>${state.sourceChanged?note('来源已有更新','下方报告仍绑定分析 v1。使用 v2 将创建新的报告项目，保留旧项目和交付。',btn('new-version','使用新版成果创建报告',true),'warning'):''}<section aria-label="关联报告"><h2>关联报告</h2><p class="fine">Report Studio 内容可经编辑；新增数字与解释不自动获得原分析核验。</p>${state.history.length?state.history.map((r,i)=>`<article class="report-row"><div class="report-icon">${r.format}</div><div class="report-info"><strong>季度经营回顾 · 交付 ${i+1}</strong><p class="fine">来源分析 ${r.version} · ${r.format} · 2026-10-15 18:30（合成）</p><p class="fine">${r.warning?'质检有提示：第 3 页信息较密':'核验边界：报告中的新增表达待核验'}</p></div><div class="card-actions">${btn('download','下载副本')}${btn('report-detail-'+i,'详情')}${btn('continue-'+r.version,'继续制作',false,scene==='deleted')}</div></article>`).join(''):'<p class="fine">尚无关联报告。制作后，选择已保存的导出文件关联回此处。</p>'}${scene==='deleted'?note('工作项目已删除','JuanerAI 已接收的交付副本仍保留，可以下载。不能继续编辑已删除的工作项目。','','warning'):''}</section><div class="analysis-card"><h2>继续讨论这份分析</h2><p class="fine">原对话、资料、证据与人审保持不变。</p>${btn('existing','资料')}${btn('existing','检查详情')}</div></section></main></div></div>`;}
function openEntry(){
 if(scene==='materials'){materials();return;}
 const disabled=scene==='empty'||scene==='version'||!state.ready;
 const service=scene==='version'?note('模块版本不可用','内置包校验失败或与宿主不兼容。请修复 JuanerAI 安装；不会接管独立版。',btn('version-detail','查看版本说明'),'error'):!state.ready?note(scene==='starting'?'正在启动 Report Studio':'Report Studio 启动失败',scene==='starting'?'等待本机服务就绪；不会重复启动，也不会开始模型制作。':'本机端口被其他程序占用。保留其进程，不连接未知服务。',scene==='starting'?'<button class="review-step" data-action="ready">审核：服务已就绪</button>':btn('retry-start','重试启动'),'warning'):'';
 modal('产品能力与插件',`<p>数据分析工作台已可用，按需要打开扩展能力。</p><div class="plugin-row plugin-muted">数据采集 · web-crawl · 尚未接入</div><div class="plugin-row plugin-muted">数据清洗 · data-cleaning · 尚未接入</div><div class="plugin-row plugin-muted">数据挖掘／建模 · model-mlflow · 尚未接入</div><div class="plugin-row active"><div><strong>数据呈现 · Report Studio</strong><p class="fine">制作 PPT、HTML 与 PDF；随 JuanerAI 交付</p></div><div class="card-actions">${btn('materials',state.history.length?'继续制作':'使用当前分析成果',true,disabled)}${btn('independent','打开报告工作台',false,scene==='version'||!state.ready)}</div></div>${scene==='empty'?'<p class="fine">当前没有分析成果，仍可打开报告工作台新建独立报告。</p>':''}${service}<div class="plugin-row plugin-muted">执行反馈 · decision-platform · 尚未接入</div><div class="plugin-row plugin-muted">数据指标 · metric-factory · 尚未接入</div>`);
}
function materials(version=state.sourceChanged?'v2':state.version){
 state.pendingVersion=version;
 if(state.history.some(r=>r.version===version)){close();launch(false,version);return;}
 modal('带入分析成果',`<p><strong>季度经营回顾 · ${state.pendingVersion}</strong></p><p class="fine">只复制所选成果。来源说明、核验等级和限制随所选内容保留。</p><div class="checks"><label><input name="material" type="checkbox" value="结论摘要" checked>结论摘要 · 包含已核验发现与待补证限制</label><label><input name="material" type="checkbox" value="渠道汇总表" checked>渠道汇总表 · 汇总数据</label><label><input name="material" type="checkbox" value="问题与建议">问题与建议 · 模型解释，未核验</label></div><p class="fine">不带入原始明细、全部会话或凭据。材料是副本，后续制作不修改原分析。</p>${!state.permitted?note('新增材料缺少外发许可','当前汇总表没有用于报告制作的模型外发许可，可先保留为本地材料。','','warning'):'<p class="fine">已有许可覆盖所选材料与报告制作用途，无须重复授权。</p>'}<div class="card-actions">${btn('bring','带入并打开 Report Studio',true)}</div>`);
}
function launch(independent,version=state.version,localOnly=false){
 if(!state.trusted&&!localOnly){state.pendingLaunch={independent,version};trustedMode();return;}
 const u=new URL(location.href);u.search='';u.searchParams.set('surface','studio');u.searchParams.set('scene',!state.configured?'config':!state.permitted?'permission':independent?'independent':'normal');u.searchParams.set('mode',independent?'independent':'linked');u.searchParams.set('version',version);u.searchParams.set('trusted',state.trusted?'yes':'no');u.searchParams.set('materials',state.materials.join('、'));
 const key=independent?'independent':version;
 const old=childTabs.get(key);
 if(old&&!old.closed){studioTab=old;if(!independent)old.postMessage({kind:'report-studio-ui-open-associated',version},'*');old.focus();tell('已复用原报告标签页；未重新创建或生成。');return;}
 studioTab=window.open(u.href,'report-studio-review-'+key);
 if(studioTab){childTabs.set(key,studioTab);tell('已打开合成 Report Studio 标签页。');}
 else modal('浏览器未打开新标签',`<p>请通过下方链接打开审核件；不会重复创建真实项目。</p><a href="${esc(u.href)}" target="_blank">打开 Report Studio 合成审核件</a>`);
}
function studioHTML(){
 const context=state.independent?'独立报告 · 无分析关联':`来源：季度经营回顾 · 分析 ${state.version}`;
 const active=state.runtime==='running'||state.runtime==='settling';
 return `<section class="wb"><header class="wb-titlebar"><span class="wb-brand">Report Studio</span><span class="fine">把材料变成清楚的汇报</span><span class="wb-tag">JuanerAI 内置 · 合成审核</span></header><div class="source-line"><p>${context}${state.targetGone?' · 原分析不可用':''}</p><div class="card-actions">${btn('source','查看来源与范围')}${btn('return-host',state.independent?'返回 JuanerAI':'返回原分析')}</div></div><nav class="wb-topbar" aria-label="制作视图"><div class="wb-seg"><button class="wb-seg-btn ${state.view==='chat'?'active':''}" data-action="chat" aria-pressed="${state.view==='chat'}">对话</button><button class="wb-seg-btn ${state.view==='deck'?'active':''}" data-action="deck" aria-pressed="${state.view==='deck'}" ${!state.deck?'disabled':''}>成果</button></div><div class="wb-topbar-right"><label for="family">场景</label><select id="family" class="wb-family-select"><option>通用商务汇报</option><option>经营复盘</option><option>方案提案</option></select>${btn('brand','品牌')}${btn('run-details','运行详情')}${btn('settings','设置')}</div></nav><div class="studio-body"><aside class="wb-sidebar" aria-label="报告项目">${btn('new-project','＋ 新建项目',true)}<button class="wb-item active" data-action="chat"><span class="wb-item-title">${state.independent?'独立报告草稿':'季度经营回顾'}</span><span class="fine">${state.independent?'独立制作':'关联分析 '+state.version}</span></button><p class="wb-side-note">本机内置项目。独立版原项目与凭据不会自动导入。</p></aside><main class="wb-main" id="main" tabindex="-1">${runtimeHTML()}${state.view==='chat'?chatHTML():deckHTML()}${active?note('制作仍在后台进行','关闭此标签页不会停止。宿主分析的停止按钮不控制本报告项目。',btn('stop','停止制作')):''}</main></div></section>`;
}
function runtimeHTML(){
 if(!state.trusted)return note('尚未启用可信本地制作','可查看本地项目和已有产物；接受本地执行模式前不会生成或执行代码。',btn('trusted-mode','查看执行模式',true),'warning');
 if(scene==='version')return note('版本不可用','模块与 JuanerAI 不兼容，不能启动制作或改写项目。',btn('version-detail','查看版本说明'),'error');
 if(!state.configured)return note('尚未配置 Report Studio 模型','内置版需要显式配置；不读取独立版、Pi 或其他应用凭据。可以查看本地材料。',btn('settings','配置模型',true),'warning');
 if(!state.permitted)return note('材料暂不外发','所选材料仅本地保留；模型文本、图片理解及页面截图都不能绕过此限制。',btn('permission','查看许可差异',true),'warning');
 if(state.runtime==='running')return note('正在制作','正在调整所选页面，尚未生成新的交付文件。','<button class="review-step" data-action="finished">审核：本轮完成</button>');
 if(state.runtime==='settling')return note('停止已受理 · 等待结算','不再准入新操作，在途请求仍需结算，尚不能宣称物理停止。','<button class="review-step" data-action="stopped">审核：结算完成</button> <button class="review-step" data-action="set-unknown">审核：结果仍未知</button>','warning');
 if(state.runtime==='unknown')return note('结果未知 · 未自动恢复','保留历史及未知消费。先核对已完成部分，不重发未知操作。',btn('reconcile','核对运行结果',true),'warning');
 if(state.runtime==='stopped')return note('制作已停止','已有编辑与导出保留；继续前重新核对权限，不会自动关联迟到产物。',btn('resume','继续制作'));
 if(state.targetGone)return note('关联目标不可用','原分析无法访问。可继续制作和导出，暂不能关联，也不能改挂到其他分析。','','warning');
 return '';
}
function chatHTML(){const blocked=!state.trusted||!state.configured||!state.permitted||scene==='version'||['settling','unknown','stopped'].includes(state.runtime);return `<section class="wb-thread"><div class="wb-msg user">请基于选定材料，制作一份简洁的季度经营回顾，先给出框架。</div><div class="wb-msg assistant">先围绕主要变化、渠道表现与待补证问题组织。未核验解释会保留限制说明。</div><section class="wb-outline"><div class="wb-outline-head"><strong>页面框架</strong><span class="fine">3 页 · 合成示例</span></div><ol><li>本季回顾：已知变化与判断边界</li><li>渠道表现：选定汇总表</li><li>后续问题：退款影响仍需核验</li></ol><div class="card-actions">${btn('edit-outline','修改框架')}${btn('generate','按此框架生成',true,blocked||state.runtime!=='idle')}</div></section>${state.messages.map(m=>`<div class="wb-msg user">${esc(m)}</div>`).join('')}${state.deck?btn('deck','查看已有成果'):''}</section><form class="wb-composer" id="composer"><div class="att-row">${esc(state.independent?'独立项目 · 未带入分析材料':params.get('materials')||'合成示例材料')} · ${state.permitted?'已获本次用途许可':'仅本地保留'}</div><label class="sr-only" for="message">制作需求</label><textarea id="message" rows="2" placeholder="描述要做的 PPT，或对当前结果提出修改……"></textarea><div class="wb-composer-foot">${btn('attachment','附件')}<span class="fine">输入只安全显示；不理解或执行任意文本</span><button class="btn btn-primary btn-sm" ${blocked?'disabled':''}>发送</button></div></form>`;}
function deckHTML(){return `<section class="wb-deck"><div class="card-actions"><strong>成果</strong><span class="fine">3 页 · 合成版本 ${state.delivery+1}</span>${btn('history','历史版本')}${btn('qa','质检')}${['PPTX','HTML','PDF'].map(f=>btn('export-'+f,'导出 '+f,false,!state.trusted||state.runtime!=='idle'&&state.runtime!=='stopped'||scene==='version')).join('')}</div><p class="fine">页面为近似预览，实际以导出 PPTX 为准。HTML／PDF 不承诺完全一致。</p>${state.exportFailed?note('导出失败','编辑内容和已有导出仍保留；重新导出不会改写旧交付。',btn('retry-export','重试导出'),'error'):''}${state.warning?note('质检提示','第 3 页信息较密。可继续导出和关联，提示随交付保留；不代表事实已核验。','','warning'):''}<div class="wrap-table"><table class="artifact-table"><thead><tr><th>已保存导出</th><th>状态</th><th>操作</th></tr></thead><tbody>${state.exports.map(e=>`<tr><td>季度经营回顾-${e.id}.${e.format.toLowerCase()}<br><span class="fine">18:30（合成时间）</span></td><td>${state.broken?'文件缺失或损坏':e.linked?'已关联 · 交付 '+e.id:'已保存，尚未关联'}</td><td>${btn('download','下载')}${!state.independent?btn('associate-'+e.id,e.linked?'查看已有交付':'关联回原分析',!e.linked,state.targetGone||state.broken||state.receiptUnknown):'<span class="fine">独立项目不提供事后挂接</span>'}</td></tr>`).join('')}</tbody></table></div>${state.returnFailed?note('关联未保存','原分析暂不可达，导出仍保留在 Report Studio。',btn('retry-associate','重试关联',true),'error'):''}${state.receiptUnknown?note('关联回执未知','可能已保存；先读回，不能重复创建交付。',btn('read-receipt','核对关联结果',true),'warning'):''}${state.exports.some(e=>e.linked)?note('已关联回原分析','JuanerAI 已保存交付副本与关联。继续编辑不会覆盖该副本。',btn('return-host','返回原分析',true),'success'):''}<div class="wb-page-tabs" aria-label="选择页面">${[1,2,3].map(n=>`<button class="wb-page-tab ${state.page===n?'active':''}" data-action="page-${n}" aria-pressed="${state.page===n}">${n===1?'01 · 季度回顾':n===2?'02 · 渠道表现':'03 · 后续问题'}</button>`).join('')}</div><div class="slide"><div class="kicker">QUARTERLY REVIEW / 合成样例</div><h2>${['把变化讲清楚，把判断留有依据','渠道结构需要结合退款影响判断','下一步：核清退款与复购'][state.page-1]}</h2><p>基于选定分析成果的表达草稿。报告中的新增解释不自动获得原分析核验。</p><div class="slide-bars" aria-hidden="true"><span style="height:85%"></span><span style="height:60%"></span><span style="height:42%"></span></div><div class="slide-footer">示意柱形无真实数值 · 来源分析 ${state.version} · ${state.page} / 3</div></div><form class="wb-composer wb-page-composer" id="composer"><div class="card-actions"><strong>修改第 ${state.page} 页</strong>${btn('lock',state.locked?'解锁本页':'锁定本页')}</div><label class="sr-only" for="message">页面修改要求</label><textarea id="message" rows="2" placeholder="${state.locked?'本页已锁定，请先解锁':'如：把标题改成一句结论，保留来源说明……'}" ${state.locked?'disabled':''}></textarea><div class="wb-composer-foot"><span class="fine">修改产生新工作版本，旧交付保留</span><button class="btn btn-primary btn-sm" ${state.locked||!state.trusted||!state.configured||!state.permitted||scene==='version'||['settling','unknown','stopped'].includes(state.runtime)?'disabled':''}>发送修改</button></div></form></section>`;}
function associate(id){
 if(state.independent||state.broken||state.targetGone||scene==='version')return;
 const e=state.exports.find(x=>x.id===id);if(!e)return;
 if(e.linked){modal('已有交付',`<p>同一导出已关联为交付 ${e.id}，不会另建副本。</p>${btn('return-host','返回原分析',true)}`);return;}
 if(state.receiptUnknown||state.returnFailed){draw();return;}
 modal('正在关联',`<p>正在保存交付副本及关联，尚未收到可读性确认。</p><button class="review-step" data-action="saved-${id}">审核：保存与读回均成功</button>`);
}
function save(id){const e=state.exports.find(x=>x.id===id);if(!e)return;e.linked=true;state.delivery=state.exports.length;close();draw();if(window.opener)window.opener.postMessage({kind:'report-studio-ui-review',id:e.id,format:e.format,version:state.version,warning:state.warning},'*');tell('合成交付已关联');}
function trustedMode(){
 modal('首次启用 · 可信本地制作',`<p>Report Studio 会在本机生成并执行代码，也可以在获准任务内使用 Bash 与联网取素材。</p><div class="status-box warning"><strong>这不是严格沙箱</strong><p>生成代码和 Bash 可能具有当前用户的系统访问能力；独立进程、项目目录与提示词不等于系统隔离。</p></div><p><strong>当前材料：</strong>${state.pendingLaunch?.independent||state.independent?'独立项目尚未带入分析材料':esc(state.materials.join('、'))}。${state.permitted?'已有材料许可仅覆盖本任务已声明的用途。':'材料外发许可仍缺失；接受本地模式不会自动授予外发。'}</p><p>不继承独立版历史授权。接受后仅在有效任务权限内推进，不逐命令确认；新增材料或用途仍检查差异。</p><div class="card-actions">${btn('trust-accept','接受并启用本地制作',true)}${btn('trust-decline','暂不接受，仅查看')}</div>`);
}
function settings(){modal('Report Studio 模型配置',`<p>只配置内置模块，不读取其他应用凭据；保存配置不发模型请求。</p><label class="field">供应商与模型<select><option>审核示例配置（非真实 Provider）</option></select></label><label class="field">凭据<input value="合成占位，不接收真实密钥" readonly></label><p class="fine">实际产品使用专门的密钥输入与安全保存。此处只审核配置缺口和回执。</p><div class="card-actions">${btn('config-save','保存合成配置',true)}<button class="review-step" data-action="config-fail">审核：保存失败</button></div><p id="config-result" role="status"></p>`);}
function returnHost(){if(window.opener&&!window.opener.closed){window.opener.focus();tell('已请求返回原分析标签页；若浏览器未切换，请选择原标签。');}else location.href='index.html?scene=linked';}
document.addEventListener('submit',e=>{if(e.target.id!=='composer')return;e.preventDefault();const v=$('message').value.trim();if(!v)return;state.messages.push(v);if(state.view==='deck')modal('已展示修改输入',`<p>${esc(v)}</p><p class="fine">仅合成审核，不理解或执行文本，不实际改动文件。</p><button class="review-step" data-action="mock-edit">审核：页面修改已完成</button>`);else{draw();tell('文本仅在内存安全显示，未发送模型。');}});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;
 if(a==='reset'){reset();return;}
 if(a==='plugins'){openEntry();return;}
 if(a==='materials'){materials();return;}
 if(a==='bring'){const selected=[...document.querySelectorAll('[name="material"]:checked')].map(x=>x.value);if(!selected.length){tell('至少选择一项成果');modal('尚未选择成果','<p>请选择至少一项成果，或打开工作台独立制作。</p>'+btn('materials','返回选择',true));return;}state.materials=selected;close();launch(false,state.pendingVersion);return;}
 if(a==='independent'){close();launch(true);return;}
 if(a.startsWith('continue-')){launch(false,a.slice(9));return;}
 if(a==='new-version'){materials('v2');return;}
 if(a==='ready'||a==='retry-start'){state.ready=true;openEntry();return;}
 if(a==='quick'){close();draw();return;}
 if(a==='chat'||a==='deck'){state.view=a;draw();return;}
 if(a==='generate'){state.runtime='running';draw();return;}
 if(a==='finished'){state.runtime='idle';state.deck=true;state.view='deck';draw();return;}
 if(a.startsWith('export-')){if(state.exportFailed){draw();return;}state.exports.push({id:state.exports.length+1,format:a.slice(7),linked:false});draw();tell('合成导出已保存；未生成真实文件。');return;}
 if(a==='retry-export'){state.exportFailed=false;state.exports.push({id:state.exports.length+1,format:'PPTX',linked:false});draw();return;}
 if(a.startsWith('associate-')){associate(Number(a.slice(10)));return;}
 if(a.startsWith('saved-')){save(Number(a.slice(6)));return;}
 if(a==='retry-associate'){state.returnFailed=false;associate(state.exports.at(-1)?.id);return;}
 if(a==='read-receipt'){modal('核对关联结果','<p>只读核对原操作，不重发交付。</p><button class="review-step" data-action="receipt-found">审核：发现已有记录</button> <button class="review-step" data-action="receipt-absent">审核：确认未保存</button> <button class="review-step" data-action="receipt-still">审核：仍未知</button>');return;}
 if(a==='receipt-found'){state.receiptUnknown=false;save(1);return;}
 if(a==='receipt-absent'){state.receiptUnknown=false;state.returnFailed=true;close();draw();return;}
 if(a==='receipt-still'){close();draw();return;}
 if(a.startsWith('page-')){state.page=Number(a.slice(5));state.locked=!!state.locks[state.page];draw();return;}
 if(a==='lock'){state.locked=!state.locked;state.locks[state.page]=state.locked;draw();return;}
 if(a==='mock-edit'){close();state.delivery++;draw();return;}
 if(a==='stop'){state.runtime='settling';draw();return;}
 if(a==='stopped'){state.runtime='stopped';draw();return;}
 if(a==='set-unknown'){state.runtime='unknown';draw();return;}
 if(a==='reconcile'){modal('核对运行结果','<p>保留已完成内容、失败与未知记录；不自动继续。</p><button class="review-step" data-action="reconciled">审核：已核清且可恢复</button> <button class="review-step" data-action="receipt-still">审核：仍未知</button>');return;}
 if(a==='reconciled'){state.runtime='stopped';close();draw();return;}
 if(a==='resume'){state.runtime='running';draw();return;}
 if(a==='return-host'){close();returnHost();return;}
 if(a==='settings'){settings();return;}
 if(a==='trusted-mode'){trustedMode();return;}
 if(a==='trust-accept'||a==='trust-decline'){state.trusted=a==='trust-accept';const next=state.pendingLaunch;state.pendingLaunch=null;close();if(next)launch(next.independent,next.version,!state.trusted);else draw();return;}
 if(a.startsWith('report-detail-')){const r=state.history[Number(a.slice(14))];if(r)modal('交付详情',`<p>来源分析 ${esc(r.version)} · 导出 ${esc(r.format)} · 合成时间 18:30。</p><p>交付 ${r.id}；生产提供该文件真实哈希、时间与质检。新增表达未自动核验。</p>`);return;}
 if(a==='config-save'){state.configured=true;$('config-result').textContent='合成配置已保存；尚未发起模型调用。';draw();return;}
 if(a==='config-fail'){state.configured=false;draw();$('config-result').textContent='保存失败，输入保留；仍未配置，不能开始制作。';return;}
 if(a==='permission'){modal('本次材料外发许可',`<p><strong>新增范围：</strong>${state.independent?'尚未添加材料。当前只讨论制作需求；以后添加的每份材料仍须按实际用途检查许可。':'当前选定材料：'+esc(state.materials.join('、'))+'；用于报告制作、页面图片理解及截图检查。'}对象为本任务显式配置的模型服务。</p><p>不包括原始明细、全部会话或其他项目。普通获准操作不重复确认。</p><div class="card-actions">${btn('allow','允许本次用途',true)}${btn('deny','暂不允许，仅本地保留')}</div>`);return;}
 if(a==='allow'){state.permitted=true;close();draw();return;}
 if(a==='deny'){close();draw();return;}
 if(a==='source'){modal('来源与范围',`<p>${state.independent?'独立项目，没有原分析关联，也不能事后任意挂接。':'季度经营回顾 · 分析 '+state.version+'；所选材料为副本。'}</p><p>材料：${esc(state.independent?'尚未添加':params.get('materials')||state.materials.join('、'))}。来源说明、核验等级及限制随内容保留。</p><p>报告新增内容可经编辑，未自动核验；不生成正式 Decision。</p>`);return;}
 if(a==='run-details'){modal('运行详情',`<p>本项目状态：${({idle:'等待输入',running:'制作中',settling:'停止结算中',stopped:'已停止',unknown:'结果未知'})[state.runtime]}</p><p>制作／停止只作用于本插件项目。关闭标签页不等于停止。</p><p class="fine">实际请求、工具、用量、失败及未知保留可查。原型没有真实用量，不填造数字。</p>${btn('quit','退出 JuanerAI／更新')}`);return;}
 if(a==='quit'){if(['idle','stopped'].includes(state.runtime)){modal('可以退出或更新','<p>没有活动或未知制作任务；生产将关闭属于内置版的服务，保留项目和交付。无需额外等待或停止。</p><p class="fine">原型不会实际退出、关闭进程或更新。</p>');return;}modal('报告制作尚未结束',`<p>退出或更新前需要等待本项目结束。未知结果须先核对，不能静默切换版本。</p><div class="card-actions">${btn('wait','等待完成',true)}${btn('quit-stop','停止制作并等待结算',false,state.runtime==='unknown')}${btn('cancel-quit','取消退出')}</div>`);return;}
 if(a==='wait'||a==='cancel-quit'){close();return;}
 if(a==='quit-stop'){state.runtime='settling';close();draw();return;}
 if(a==='new-project'){modal('新建独立报告',`<label class="field">项目名称<input value="新的报告草稿"></label><p>保持自由制作；新项目没有分析关联，也不继承其他项目的材料授权。</p>${btn('make-independent','创建独立项目',true)}`);return;}
 if(a==='make-independent'){if(!state.independent)linkedProjectSnapshot=structuredClone(state);state.independent=true;state.deck=false;state.view='chat';state.exports=[];state.messages=[];state.permitted=false;state.materials=[];state.locks={};state.locked=false;state.runtime='idle';close();draw();return;}
 if(a==='edit-outline'){modal('修改页面框架',`<label class="field">第 1 页标题<input id="outline-title" value="本季回顾：已知变化与判断边界"></label><p class="fine">示例仅显示编辑位置，保存不调用模型。</p>${btn('outline-save','保存框架',true)}`);return;}
 if(a==='outline-save'){close();tell('框架编辑位置已审核；不保存真实数据。');return;}
 const info={
  existing:['原有工作台能力','本审核件只演示新增接缝；原资料、对话、证据、人审与新建分析继续遵循已批准合同。'],
  download:['下载副本','生产从已保存交付下载，不重生成。此离线原型没有真实文件，不会发起下载；不能将点击当作已落盘。'],
  'report-detail':['交付详情','来源分析 v1 · 导出 PPTX · 合成时间 18:30。生产提供真实文件哈希、版本、时间与质检。插件新增表达未自动核验。'],
  history:['工作版本与交付版本','工作版本用于继续编辑；已关联的交付副本固定保存。新版导出和关联不覆盖旧交付。'],
  brand:['品牌设置','保留原插件品牌主色与模板自由。本次不增加宿主审核。'],
  attachment:['补充材料','保留文档、表格和图片入口。实际上传及图片理解检查本次材料权限；本原型不打开文件选择器、不读取材料。'],
  qa:['质检结果','合成提示：第 3 页信息较密。质检不等于事实核验；警告可导出和关联，缺失或损坏文件不可交付。'],
  'version-detail':['内置版本说明','Report Studio 独立维护，固定版本随 JuanerAI 交付。校验不兼容则关闭模块；不下载最新版、不接管独立版。实际版本号与日志由安装候选提供。']
 };
 if(info[a]){modal(info[a][0],`<p>${info[a][1]}</p>`);return;}
});
window.addEventListener('message',e=>{
 if(studio){if(e.source===window.opener&&e.data?.kind==='report-studio-ui-open-associated'&&linkedProjectSnapshot?.version===e.data.version){if($('modal').open)close();state=linkedProjectSnapshot;linkedProjectSnapshot=null;draw();tell('已回到所选分析版本的关联项目，工作内容与交付保留。');}return;}
 if(studio||![...childTabs.values()].includes(e.source)||e.data?.kind!=='report-studio-ui-review')return;
 const d=e.data;if(!Number.isInteger(d.id)||!['PPTX','HTML','PDF'].includes(d.format)||!['v1','v2'].includes(d.version))return;
 if(!state.history.some(x=>x.id===d.id&&x.version===d.version))state.history.push({id:d.id,format:d.format,version:d.version,warning:!!d.warning});draw();tell('合成关联报告已出现');
});
reset();
