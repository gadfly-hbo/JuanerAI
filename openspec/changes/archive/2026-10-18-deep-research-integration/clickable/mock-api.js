/* Synthetic review adapter. Never delegates to native fetch, disk, or a provider. */
(() => {
 const now=()=>new Date().toISOString(); const copy=x=>JSON.parse(JSON.stringify(x));
 const task=new URLSearchParams(location.search).get('task')||'sales';
 const snap={id:'s1',url:'https://example.invalid/synthetic-evidence',title:'合成渠道样本说明',fetchedAt:'2026-10-18T00:00:00Z',parseStatus:'ok',tier:'B'};
 const usage=()=>({searches:0,fetches:0,modelCalls:0,outputTokens:0,wallMs:0});
 const bundle=(r,v,limited=true)=>({runId:r,version:v,reportMd:'# 合成研究报告\n\n## 建议\n先核对渠道口径，再决定是否扩展样本。所有内容仅用于界面审核。\n\n## 证据边界\n合成样本中渠道 A 的重复购买比例为 24%。这不能代表整体市场。\n\n## 未决问题\n仍缺少跨区域与同期样本，暂不建议扩大投放。',claims:[{id:'c1',statement:'合成样本的重复购买比例为 24%，仅用于演示证据链。',kind:'fact',evidenceIds:['e1'],confidence:'medium',calibration:{entity:'合成渠道 A',period:'2026 Q3',unit:'%',value:24}},{id:'c2',statement:'可先做小范围验证；跨区域可推广性尚未证实。',kind:'inference',evidenceIds:['e1'],confidence:'low'}],evidence:[{id:'e1',snapshotId:'s1',quote:'合成样本中渠道 A 的重复购买比例为 24%。'}],snapshots:[snap],limitations:limited?['有限交付：预算已到上限，未覆盖跨区域样本。','合成数据仅供界面审核，不能用于业务判断。']:['合成数据仅供界面审核，不能用于业务判断。'],unresolved:limited?['跨区域与同期样本仍待补证。']:[],verdicts:[{evidenceId:'e1',verdict:'quote-hit',entailment:'weak',numeric:'na',tier:'B'}]});
 const asset={source:{sourceId:'asset1',title:'合成渠道样本说明',url:'https://example.invalid/synthetic-evidence',publisher:'合成机构',docType:'industry-report',lifecycle:'ACTIVE',createdAt:now(),entityIds:[],tags:['合成']},versions:[{versionId:'av1',sourceId:'asset1',fetchStatus:'READ_FULL',parseStatus:'ok',dataPeriod:'2026 Q3',createdAt:now()}],acquisitions:[{acquisitionId:'ac1',projectId:'demo',method:'manual',readScope:'FULL',reuseScope:'PROJECT_ONLY',rights:{},acquiredAt:now()}]};
 const projects=new Map();let serial=1;
 function project(id,goal){const old={id:'history',requestId:'history-request',stage:'publish',status:'limited',usage:usage()};return {meta:{id,module:'industry',goal,scope:{summary:'合成材料 · 2026 Q3 · 仅用于审核完整工作台',queries:['渠道复购是否支持下一步小范围验证？']},status:'active',updatedAt:now(),versions:[{version:1,runId:old.id,publishedAt:now(),formalGenerated:false}]},runs:[old],snapshots:[snap],bundles:{1:bundle('history',1)},gates:{},forms:{}};}
 projects.set('demo',project('demo',task==='member'?'合成会员复购研究':'合成渠道机会研究'));
 const state={projects,task,unavailable:false,saveFailure:false,sourceMissing:false,unknown:false,cancelPending:false,audit:[],selectedVersion:null};
 function activeProject(){return projects.get(location.hash.match(/project\/([^/]+)/)?.[1]||'demo');}
 function activeRun(p){return p.runs.find(r=>['running','awaiting-confirmation'].includes(r.status))||p.runs.at(-1);}
 function start(p,body){if(p.runs.some(r=>['running','awaiting-confirmation'].includes(r.status)))throw Error('已有运行占用，请先完成或取消');const id='run-'+serial++;const request=body.request||{id:'request-'+id};const r={id,requestId:request.id,stage:'plan',status:'awaiting-confirmation',gate:{kind:'plan'},usage:usage()};p.runs.push(r);p.gates[id]={kind:'plan',payload:{questions:[{id:'q1',question:'渠道复购是否支持下一步小范围验证？',status:'open'},{id:'q2',question:'现有证据的缺口与建议条件是什么？',status:'open'}]},context:{goal:request.goal||p.meta.goal,scope:p.meta.scope,module:p.meta.module}};p.meta.updatedAt=now();return {runId:id,reuse:{bound:0,rejected:[]}};}
 function scene(s){const p=activeProject();if(!p)return;state.unavailable=s==='unavailable';state.unknown=s==='unknown';state.sourceMissing=s==='source-missing';state.saveFailure=s==='save-failed';
 if(s==='reset'){p.runs=p.runs.filter(r=>r.id==='history');p.meta.versions=p.meta.versions.filter(v=>v.version===1);p.gates={};state.cancelPending=false;location.hash='/project/'+p.meta.id+'/plan?new=1';}
 if(['limited','published','failed','cancelled'].includes(s)){const r=activeRun(p);if(r.id==='history'||r.status==='awaiting-confirmation')throw Error('请先新建运行并完成两道确认门，再演示运行结果。');r.status=s;r.stage=s==='failed'?'gather':'publish';delete r.gate;r.error=s==='failed'?'合成失败：资料服务不可用；未自动重试。':undefined;r.progress={answered:1,open:s==='limited'?1:0,skipped:0,total:2};state.cancelPending=false;}
 window.dispatchEvent(new Event('review-state'));}
 state.scene=scene;state.activeProject=activeProject;state.activeRun=()=>activeRun(activeProject());window.reviewState=state;
 const response=(v,status=200)=>new Response(typeof v==='string'?v:JSON.stringify(copy(v)),{status,headers:{'Content-Type':typeof v==='string'?'text/plain':'application/json'}});
 window.fetch=async(input,init={})=>{const url=new URL(typeof input==='string'?input:input.url,location.href);const path=url.pathname;const method=init.method||'GET';let body={};try{body=JSON.parse(init.body||'{}')}catch{return response('审核请求格式错误',400)}
 state.audit.push({path,method,at:now(),synthetic:true});
 if(url.origin!==location.origin||!path.startsWith('/api/'))return response('审核稿禁止外部请求',403);
 if(path.includes('followup')||path.includes('sessionDigest'))return response('首期未启用会话研究记忆与追问',403);
 if(state.unavailable||state.unknown)return response(state.unknown?'状态未知，请重新查询；不会自动重跑':'研究服务暂不可用；原任务仍可返回',503);
 try {
 if(path==='/api/settings'&&method!=='GET')return response('审核稿不保存运行配置；没有真实模型或凭据',501);
 if(path==='/api/settings')return response({config:{model:{provider:'审核演示（未连接）',modelId:'未调用真实模型'}},budgetDefaults:{}});
 if(path==='/api/projects'){if(method==='POST'){const id='project-'+serial++;projects.set(id,project(id,body.goal||'合成新项目'));return response({id});}return response({projects:[...projects.values()].map(p=>p.meta)});}
 if(path==='/api/library/assets'){if(method!=='GET')return response('审核稿仅展示登记流程，不读取或导入真实文件',501);return response({assets:[{source:asset.source,latestVersion:asset.versions.at(-1),reuseScope:'PROJECT_ONLY',acquisitionCount:1}]});}
 if(path==='/api/library/assets/asset1'&&method==='GET')return response(asset);
 if(path==='/api/library/content/av1')return response('合成样本中渠道 A 的重复购买比例为 24%。仅供界面审核。');
 if(path==='/api/library/search')return response({results:[{sourceId:'asset1',title:asset.source.title,docType:'industry-report',fetchStatus:'READ_FULL',reuseScope:'PROJECT_ONLY',versionId:'av1',snippet:'合成材料，仅供审核',applicability:'LEAD_ONLY',checkNotes:['仅作线索，不代表已核实事实']}],indexState:'ready'});
 if(path==='/api/library/entities')return response({entities:[]});
 if(path==='/api/library/bindings')return response({bindings:[],usages:[]});
 const m=path.match(/^\/api\/projects\/([^/]+)(.*)$/);if(!m)return response('审核稿未模拟该动作；没有真实效果',501);
 const p=projects.get(m[1]),tail=m[2];if(!p)return response('项目不存在',404);
 if(!tail)return response({meta:p.meta,runs:p.runs,snapshots:p.snapshots});
 if(tail==='/archive'){p.meta.status=body.archived?'archived':'active';return response({ok:true});}
 if(tail==='/snapshots')return state.sourceMissing?response('快照不可用',404):response('合成材料原文：合成样本中渠道 A 的重复购买比例为 24%。仅供界面审核。');
 if(tail==='/runs'&&method==='POST')return response(start(p,body));
 if(tail==='/runs/rerun')return response(start(p,{request:{id:'rerun-'+serial,goal:p.meta.goal}}));
 if(tail==='/runs/cancel'){state.cancelPending=true;window.dispatchEvent(new Event('review-state'));return response({accepted:true});}
 if(tail==='/runs/resume'){const r=p.runs.find(r=>r.requestId===body.requestId);if(!r||r.status!=='cancelled')return response('仅已确认取消的运行可恢复',409);r.status='running';r.stage='gather';return response({ok:true});}
 if(tail==='/runs/instruct'){const r=activeRun(p);r.interventions=(r.interventions||[]).concat({id:'i'+serial++,submittedAt:now(),instruction:body.instruction});return response({queued:true,pending:r.interventions.length,note:'合成队列尚未消费'});}
 const gate=tail.match(/^\/runs\/([^/]+)\/gate(\/confirm|\/cancel)?$/);
 if(gate){const r=p.runs.find(r=>r.id===gate[1]);const g=p.gates[gate[1]];if(!r||!g||r.status!=='awaiting-confirmation')return response('确认门已处理',409);
 if(gate[2]==='/cancel'){r.status='cancelled';delete r.gate;return response({ok:true});}
 if(gate[2]==='/confirm'){if(g.kind==='plan'){p.meta.scope.queries=body.payload.questions.map(q=>q.question);p.gates[r.id]={...g,kind:'outline',payload:{title:'渠道机会研究（合成）',subtitle:'先验证证据，再决定行动',sections:[{id:'a',title:'关键发现与边界',purpose:'区分事实与推断',bullets:['现有证据','缺口与限制']},{id:'b',title:'建议与下一步',purpose:'说明执行条件',bullets:['小范围验证','停止条件']}]}};r.gate={kind:'outline'};}else{p.forms[r.id]=body.payload;r.status='running';r.stage='gather';delete r.gate;r.progress={answered:0,open:2,skipped:0,total:2};}p.meta.updatedAt=now();return response({ok:true});}return response(g);}
 if(/\/investigation$/.test(tail))return response({events:[],questions:p.meta.scope.queries.map((question,i)=>({id:'q'+(i+1),question,status:'open'}))});
 if(/\/budget$/.test(tail))return response('审核稿未模拟真实预算加注；没有增加资源',501);
 if(tail==='/publish'){const r=p.runs.find(r=>r.id===body.runId);if(!r||!['published','limited'].includes(r.status))return response('运行尚未完成，不能发布',409);if(p.meta.versions.some(v=>v.runId===r.id))return response('已经发布',409);const v=p.meta.versions.length+1;p.meta.versions.push({version:v,runId:r.id,publishedAt:now(),formalGenerated:false});p.bundles[v]=bundle(r.id,v,r.status==='limited');p.meta.updatedAt=now();return response({version:v});}
 const ver=tail.match(/^\/versions\/(\d+)\/(bundle|formal)$/);if(ver){const v=Number(ver[1]);if(!p.bundles[v])return response('版本不存在',404);state.selectedVersion=v;if(ver[2]==='formal'){p.meta.versions.find(x=>x.version===v).formalGenerated=true;return response({summarySource:'synthetic'});}return response(p.bundles[v]);}
 return response('审核稿未模拟该动作；没有真实效果',501);
 }catch(e){return response(e.message,409)}
 };
})();
