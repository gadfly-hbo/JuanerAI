// Real product HTTP UI; no file:// demo, user data, provider or installed-app activation.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,realpath,mkdir,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {taskHash} from '../../packages/product-core/member-task.ts';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;
assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
assert(!['MINIMAX_API_KEY','MINIMAX_CN_API_KEY','XIAOMI_TOKEN_PLAN_CN_API_KEY'].some(k=>process.env[k]));
const {chromium}=await import(pathToFileURL(join(root,'node_modules/playwright/index.mjs')).href);
const {startBuiltinStudio}=await import(pathToFileURL(join(root,'dist/juanerai/server.js')).href);
const id=n=>`${String(n).padStart(8,'0')}-1111-4111-a111-111111111111`;
test('RS-BROWSER-01 real Studio admits one bootstrap before React reads data, refreshes and selects exact project',async t=>{
 const data=await realpath(await mkdtemp(join(tmpdir(),'studio-real-ui-'))),owner='a'.repeat(64);
 const service=await startBuiltinStudio({dataRoot:join(data,'projects'),webDist:join(root,'web-dist'),ownerToken:owner,pluginVersion:'fixed-synthetic'});
 const browser=await chromium.launch();
 let syntheticPolicy; t.after(async()=>{await browser.close();if(syntheticPolicy)for(const op of syntheticPolicy.activeOperations())if(op.state==='unknown'&&op.physical_settled)syntheticPolicy.reconcile(op.operation_id);await service.close();await rm(data,{recursive:true,force:true});});
 const call=(path,body)=>fetch(service.origin+'/api/builtin/bridge'+path,{method:'POST',headers:{'x-studio-owner':owner,'content-type':'application/json'},body:JSON.stringify(body)});
 const source={project_id:id(1),task_id:id(2),revision:'1',outcome_id:id(3),outcome_sha256:'a'.repeat(64),scope_sha256:'b'.repeat(64)};
 const value={schema_version:'1',title:'准确来源版本合成项目',source,materials:[{material_id:'conclusion',label:'合成结论',text:'只传入合成材料',classification:'MODEL_EXPLANATION',source,verification:'not_performed',limitations:['未经新增分析核验']}]};
 const a={association_id:id(4),studio_project_id:'proj_'+id(4).replaceAll('-',''),created_at:'2026-10-16T00:00:00Z',state:'pending',snapshot:{...value,snapshot_sha256:taskHash(value)}};
 assert.equal((await call('/associations/'+a.association_id,a)).status,200);
 const token=(await (await call('/bootstrap',{})).json()).token;
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 const external=[];await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==service.origin){external.push(route.request().url());return route.abort();}return route.continue();});
 await page.goto(service.origin+'/?project='+a.studio_project_id+'#bootstrap='+token);
 await page.getByText('准确来源版本合成项目',{exact:true}).first().waitFor({timeout:5000});
 assert(!page.url().includes(token),'one-use token removed from address immediately');
 await page.getByRole('button',{name:'启用本地制作',exact:true}).click({timeout:5000});
 const mode=page.getByRole('dialog',{name:'可信本地制作'});await mode.waitFor();assert.match(await mode.innerText(),/当前用户系统/);
 await mode.getByRole('button',{name:'暂不接受，仅查看',exact:true}).click();await page.getByRole('button',{name:'启用本地制作',exact:true}).waitFor();
 await page.getByRole('button',{name:'启用本地制作',exact:true}).click();await mode.getByRole('button',{name:'接受并启用本地制作',exact:true}).click();await page.getByRole('status').filter({hasText:'可信本地制作已启用'}).waitFor();
 await page.getByRole('button',{name:'制作设置',exact:true}).click();const settings=page.getByRole('dialog',{name:'制作设置'});await settings.waitFor();await settings.getByLabel('API Key').fill('synthetic-never-saved');await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'制作设置',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.getByRole('button',{name:'制作设置',exact:true}).click();assert.equal(await page.getByLabel('API Key').inputValue(),'');await page.keyboard.press('Escape');

 await page.getByText(/JuanerAI-conclusion/).first().waitFor({timeout:5000});
 await page.reload();await page.getByText('准确来源版本合成项目',{exact:true}).first().waitFor({timeout:5000});
 await page.goto(service.origin+'/?project=proj_missing');await page.getByText('指定的报告项目不可用；不会打开其他项目。',{exact:true}).waitFor({timeout:5000});
 await page.goto(service.origin+'/?project='+a.studio_project_id);await page.getByText(/JuanerAI-conclusion/).first().waitFor({timeout:5000});
 assert.deepEqual(external,[]);
 await page.locator('input[type=file]').setInputFiles({name:'synthetic-local.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=','base64')});
 await page.getByText('已本地保存，尚未理解',{exact:true}).waitFor({timeout:5000});await page.getByRole('button',{name:'理解图片',exact:true}).waitFor();assert.equal(await page.getByText('已生成图片描述',{exact:true}).count(),0);
 const evidence=process.env.JUANERAI_REPORT_STUDIO_BROWSER_EVIDENCE;
 if(evidence){await mkdir(evidence,{recursive:true});for(const [width,height]of [[1440,900],[1366,768],[390,844]]){await page.setViewportSize({width,height});if(width===390){assert.equal(await page.getByRole('complementary',{name:'项目'}).isVisible(),false,'narrow sidebar must collapse');assert((await page.locator('textarea').boundingBox()).width>300);await page.getByRole('button',{name:'项目',exact:true}).click();assert.equal(await page.getByRole('complementary',{name:'项目'}).isVisible(),true);await page.getByRole('button',{name:'项目',exact:true}).click();}await page.screenshot({path:join(evidence,`studio-${width}x${height}.png`),fullPage:true});}}
 const {createReportStudioPolicy}=await import(pathToFileURL(join(root,'dist/juanerai/policy.js')).href);syntheticPolicy=createReportStudioPolicy({dataRoot:join(data,'projects'),now:()=>new Date().toISOString()});
 syntheticPolicy.begin(a.studio_project_id,id(91),'export',{recipients_sha256:'a'.repeat(64),materials:[]});syntheticPolicy.finish(id(91),{outcome:'failed',physical_settled:true,usage_known:false,sdk_run_id:null});
 await page.setViewportSize({width:1440,height:900});await page.reload();const run=page.getByRole('region',{name:'制作运行状态'});await run.getByText(/制作结果或消费仍未知/).waitFor({timeout:5000});assert.equal(await run.getByRole('button',{name:'核对运行状态',exact:true}).isEnabled(),true);assert.equal(await page.getByRole('button',{name:'恢复会话',exact:true}).count(),0);
 await page.locator('textarea').fill('未知状态保留未发送草稿');assert.equal(await page.getByRole('button',{name:'发送',exact:true}).isDisabled(),true);
 if(evidence){for(const width of [1440,390]){await page.setViewportSize({width,height:900});await page.screenshot({path:join(evidence,`studio-unknown-${width}.png`),fullPage:true});}await page.setViewportSize({width:1440,height:900});}
 await run.getByRole('button',{name:'核对运行状态',exact:true}).click();await run.getByText(/运行状态已核对；历史未知消费仍保留/).waitFor({timeout:5000});assert.equal(syntheticPolicy.operation(id(91)).state,'stopped');assert.equal(syntheticPolicy.operation(id(91)).usage_known,false);
 // Real browser observation of explicit native exit intent; no timer may clear it.
 let exit=await call('/exit-intent',{intent:'wait'});assert.equal(exit.status,200);await run.getByText(/JuanerAI 正在等待制作结束与结算/).waitFor({timeout:5000});assert.equal(await page.getByRole('button',{name:'发送',exact:true}).isDisabled(),true);
 if(evidence)await page.screenshot({path:join(evidence,'studio-exit-wait-1440.png'),fullPage:true});
 exit=await call('/exit-intent',{intent:'cancel'});assert.equal(exit.status,200);await run.getByText(/JuanerAI 正在等待制作结束与结算/).waitFor({state:'hidden',timeout:5000});
 const fresh=await browser.newContext(),denied=await fresh.newPage();await denied.goto(service.origin+'/');await denied.getByText('请返回 JuanerAI 重新打开 Report Studio',{exact:true}).waitFor({timeout:5000});await fresh.close();
});

test('RS-SOURCE-UI-01 real Studio source/explicit export delivery reads back a lost reply; independent projects never acquire a target',async t=>{
 const data=await realpath(await mkdtemp(join(tmpdir(),'studio-source-ui-'))),owner='a'.repeat(64),receipts=new Map();let revision='1',unavailable=false,lose=true,pending=false,posts=0;
 const service=await startBuiltinStudio({dataRoot:join(data,'projects'),webDist:join(root,'web-dist'),ownerToken:owner,pluginVersion:'fixed-synthetic'},{requestOwner:async request=>{
  if(request.operation==='context')return {operation:'context',state:unavailable?'unavailable':revision===request.source.revision?'available':'updated',current_revision:unavailable?null:revision,return_url:unavailable?null:`http://127.0.0.1:12345/?report-studio-project=${request.source.project_id}&report-studio-task=${request.source.task_id}&report-studio-revision=${request.source.revision}`};
  if(request.operation==='receipt'){const delivery=receipts.get(request.export_id)??null;return {operation:'receipt',state:pending?'pending':delivery?'saved':'not_found',delivery:pending?null:delivery};}
  posts++;const {WorkspaceStore}=await import(pathToFileURL(join(root,'dist/storage/workspace.js')).href),record=await new WorkspaceStore(join(data,'projects')).getExport(request.identity.project_id,request.export_id),bytes=await readFile(join(data,'projects',request.identity.project_id,record.artifact_path));
  const delivery={delivery_id:id(50+posts),association_id:request.identity.association_id,export_id:request.export_id,format:record.format,created_at:record.created_at,artifact_sha256:record.artifact_hash,bytes:bytes.length,warnings:['合成质检警告保留'],sequence:posts,source:request.source,classification:'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED'};receipts.set(request.export_id,delivery);if(lose){lose=false;throw Object.assign(Error('RS_OWNER_REPLY_UNKNOWN'),{code:'RS_OWNER_REPLY_UNKNOWN'});}return {operation:'deliver',state:'saved',delivery};
 }}),browser=await chromium.launch();t.after(async()=>{await browser.close();await service.close();await rm(data,{recursive:true,force:true});});
 const bridge=(path,body)=>fetch(service.origin+'/api/builtin/bridge'+path,{method:'POST',headers:{'x-studio-owner':owner,'content-type':'application/json'},body:JSON.stringify(body)}),source={project_id:id(1),task_id:id(2),revision:'1',outcome_id:id(3),outcome_sha256:'a'.repeat(64),scope_sha256:'b'.repeat(64)},value={schema_version:'1',title:'固定原分析的合成标题',source,materials:[{material_id:'conclusion',label:'合成结论',text:'只传入合成材料',classification:'MODEL_EXPLANATION',source,verification:'not_performed',limitations:['未经新增分析核验']}]},association={association_id:id(4),studio_project_id:'proj_'+id(4).replaceAll('-',''),created_at:'2026-10-16T00:00:00Z',state:'pending',snapshot:{...value,snapshot_sha256:taskHash(value)}};
 assert.equal((await bridge('/associations/'+association.association_id,association)).status,200);const token=(await(await bridge('/bootstrap',{})).json()).token,context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 const {WorkspaceStore}=await import(pathToFileURL(join(root,'dist/storage/workspace.js')).href),store=new WorkspaceStore(join(data,'projects')),one=await store.saveExport(association.studio_project_id,{revision_id:'deck',format:'html',artifact:Buffer.from('<html><body>第一份合成导出</body></html>'),checks:{qa:{ok:true,items:[]}},is_draft:false});
 await page.goto(service.origin+'/?project='+association.studio_project_id+'#bootstrap='+token);const region=page.getByRole('region',{name:'报告来源与关联'});await region.getByText(/来源分析版本 1/).waitFor({timeout:5000});assert.match(await region.getByRole('link',{name:'返回原分析',exact:true}).getAttribute('href'),/report-studio-revision=1$/);await region.getByRole('button',{name:'关联回原分析',exact:true}).waitFor({timeout:5000});
 await region.getByRole('button',{name:'关联回原分析',exact:true}).click();await region.getByText(/首次回执未收到，已读回原关联/).waitFor({timeout:5000});assert.equal(posts,1);await region.getByRole('button',{name:'关联回原分析',exact:true}).waitFor({state:'hidden'});await page.reload();await region.getByText(/已关联 · 交付 1/).waitFor({timeout:5000});assert.equal(posts,1);
 pending=true;const two=await store.saveExport(association.studio_project_id,{revision_id:'deck',format:'html',artifact:Buffer.from('<html><body>第二份合成导出，保留第一份副本</body></html>'),checks:{qa:{ok:true,items:[]}},is_draft:false});await page.reload();await region.getByLabel('已保存的导出').selectOption(two.export_id);await region.getByText(/关联仍在处理/).waitFor({timeout:5000});assert.equal(await region.getByRole('button',{name:'关联回原分析',exact:true}).isDisabled(),true);assert.equal(posts,1);
 pending=false;await region.getByRole('button',{name:'核对关联结果',exact:true}).click();await region.getByRole('button',{name:'关联回原分析',exact:true}).waitFor();await region.getByRole('button',{name:'关联回原分析',exact:true}).click();await region.getByText(/已关联 · 交付 2/).waitFor({timeout:5000});assert.equal(posts,2);assert.equal(receipts.size,2);
 revision='2';await page.reload();await region.getByText(/来源已有版本 2；当前报告仍引用版本 1/).waitFor({timeout:5000});assert.match(await region.getByRole('link',{name:'返回原分析',exact:true}).getAttribute('href'),/report-studio-revision=1$/);await region.getByLabel('已保存的导出').selectOption(one.export_id);await region.getByText(/已关联 · 交付 1/).waitFor({timeout:5000});
 const evidence=process.env.JUANERAI_REPORT_STUDIO_BROWSER_EVIDENCE;if(evidence){await mkdir(evidence,{recursive:true});for(const [width,height]of [[1440,900],[1366,768],[390,844]]){await page.setViewportSize({width,height});await page.screenshot({path:join(evidence,`studio-source-${width}.png`),fullPage:true});}}
 unavailable=true;await page.reload();await region.getByText(/原分析目标不可用/).waitFor({timeout:5000});assert.equal(await region.getByRole('link',{name:'返回原分析',exact:true}).count(),0);assert.equal(posts,2);
 const response=await context.request.post(service.origin+'/api/projects',{headers:{origin:service.origin},data:{title:'合成独立制作'}}),independent=(await response.json()).project;await page.goto(service.origin+'/?project='+independent.project_id);await region.getByText('独立报告 · 无分析关联',{exact:true}).waitFor({timeout:5000});assert.equal(await region.getByRole('button',{name:'关联回原分析',exact:true}).count(),0);assert.equal(posts,2);
});
