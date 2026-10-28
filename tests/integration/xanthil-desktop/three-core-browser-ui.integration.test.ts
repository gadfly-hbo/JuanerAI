import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {readIndependentBrowserDeployment} from '../../../apps/browser/service-main.ts';
import {compileOpenAnalysisContext,compileOpenModelReportContract} from '../../../packages/product-core/open-analysis-context.ts';
import {hashFiniteJson} from '../../../packages/product-core/member-task.ts';
import {projectReportContent} from '../../../packages/product-core/browser-report-content.ts';
import type {OpenStoredTask} from '../../../packages/ports/open-analysis-store.ts';
// Actual public frontend projection, no replacement browser renderer.
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';

test('NR02/TCUI01: normal deployment needs no reportMode and refuses retired configuration',()=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ui-config-')),path=join(root,'browser.json');
 const config={version:'2.0',profile_root:root,analysis:{analysisModel:'MiniMax-M3',judgmentReviewAllowed:true}};
 writeFileSync(path,JSON.stringify(config));assert.equal(Object.hasOwn(readIndependentBrowserDeployment(path,root),'reportMode'),false);
 writeFileSync(path,JSON.stringify({...config,analysis:{...config.analysis,reportMode:'computed_success'}}));assert.throws(()=>readIndependentBrowserDeployment(path,root));
});

test('TCUI01: quick and professional shared report view preserves unverified report text and its business source contract',()=>{
 const source={version:'1.0' as const,sources:[]},question='先形成有限报告，原因缺证据。',identity={task_id:randomUUID(),revision:'1',run_id:randomUUID(),attempt_id:randomUUID(),operation_id:randomUUID(),grant_id:randomUUID(),scope_sha256:hashFiniteJson(source),config_sha256:'a'.repeat(64)};
 const model_report={version:'1.1' as const,outcome_id:randomUUID(),identity,kind:'MODEL_ANALYSIS_REPORT' as const,text:'# 当前未独立核验报告\n\n未知原因需要补证。',verification:'not_performed' as const,human_judgment:'not_recorded' as const,contract:compileOpenModelReportContract(compileOpenAnalysisContext(question,source),join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'presentation-only',identity.task_id))};
 const task:OpenStoredTask={identity,question,source,state:'saved',epoch:2,pending_stop_epoch:null,outcome:null,conversation_outcome:null,computation_records:[],model_report};
 const view=openTaskView({...task,browser_report:projectReportContent(task)});
 assert.ok(view.report);assert.match(view.report.text,/当前未独立核验报告/);assert.equal(view.report.verification,'not_performed');assert.equal(view.report.modelReport,true);assert.equal(Object.hasOwn(view,'numericValues'),false);assert.ok(view.messages.some((m:any)=>m.text===model_report.text));assert.equal(view.context?.userText,question);
 const html=renderQuickAnalysisWorkbench({current:view,tasks:[view],project:'合成项目',mode:'quick',expanded:'report',resultMode:'report',viewMode:'results',detail:'context',drawer:false,draft:'',readonly:false,pending:false});assert.doesNotMatch(html,/尚无完整分析结果/);assert.match(html,/未独立核验/);
});

test('TCUI01: actual normal HTTP entry consumes the deployment mode, saves a source-backed report and serves the same frontend without local execution',{timeout:30000},async t=>{
 const {startIndependentBrowserService}=await import('../../../apps/browser/service-main.ts');
 const {mkdirSync,readFileSync,realpathSync}=await import('node:fs');
 const {offlineCredentials,offlineResponse}=await import('../../fixtures/xanthil-desktop/offline-professional-provider.ts');
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'ui-http-')),resources=join(root,'r'),profile=join(root,'p');mkdirSync(resources);
 writeFileSync(join(resources,'toolchain-deployment.json'),readFileSync('build/xanthil-toolchain-deployment.json'));const helper=join(resources,'must-never-run');writeFileSync(helper,'#!/bin/sh\nexit 97\n',{mode:0o700});
 let calls=0,origin='',server:Awaited<ReturnType<typeof startIndependentBrowserService>>|undefined;const native=globalThis.fetch;
 t.mock.method(globalThis,'fetch',async(url:Parameters<typeof fetch>[0],init?:RequestInit)=>{if(new URL(String(url)).origin!==origin)throw Error('OFFLINE_EXTERNAL_REQUEST_DENIED');return native(url,init);});
 try{
  server=await startIndependentBrowserService(profile,{analysisModel:'mimo-v2.6-flash',judgmentReviewAllowed:true,deployment:{resourcesRoot:realpathSync(resources),credentialHelper:helper},providerAccess:{credentials:offlineCredentials,authorizeModelUse:async()=>{},fetch:async(_url,init)=>{calls++;const dto=JSON.parse(String(init!.body));assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);assert.ok(!dto.tools.some((v:any)=>['execute_program','request_report'].includes(v.function.name)));if(calls<=2){assert.ok(!JSON.stringify(dto.messages).includes('\"analysis_contract\"'));assert.match(JSON.stringify(dto.messages),/当前资料不全/);assert.ok(!dto.tools.some((v:any)=>['describe_business','describe_meaning','interpret_meaning','assess_meaning','bind_measurement'].includes(v.function.name)));}if(calls===3){assert.ok(dto.tools.some((v:any)=>v.function.name==='review_report'));return offlineResponse(calls,[{name:'review_report',args:{}}]);}if(calls>=4)return offlineResponse(calls,[],'已审查可读全文；无独立核验数字，保留实际未覆盖部分。');return offlineResponse(calls,[],calls===1?'当前资料的合成模型分析。':'# 真实HTTP未核验报告\n\n这是合成transport机制证据，未进行本地计算。');}}});origin=server.origin;
  const token=new URL(await server.open()).hash.slice(1),boot=await fetch(origin+'/v1/bootstrap',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({token})});assert.equal(boot.status,200);
  const headers:Record<string,string>={cookie:boot.headers.get('set-cookie')!.split(';')[0]!,origin,'content-type':'application/json','x-xanthil-view':'browser-v1'};
  const request=async(path:string,body?:unknown)=>{const r=await fetch(origin+path,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});assert.equal(r.status,200,path+' '+r.status);return r.json();};
  const generation=(await request('/v1/session')).generation;headers['x-xanthil-control']=(await request('/v1/control',{version:'1.0',command_id:randomUUID(),confirmed:true,generation})).control;
  headers['x-xanthil-control']=(await request('/v1/projects/select',{version:'1.0',command_id:randomUUID(),name:'TCUI actual entry synthetic'})).control;
  const id=randomUUID();await request('/v1/open-analysis',{version:'1.0',command_id:id,question:'当前资料不全也先形成有限报告。',confirmed:true,sources:[{source_id:randomUUID(),display_name:'synthetic.csv',format:'csv',base64:Buffer.from('id,value\na,11\n').toString('base64')}]});
  let task=await request('/v1/open-analysis/'+id);const until=Date.now()+20000;for(;Date.now()<until&&(['ready','running'].includes(task.state)||task.report_postprocessing&&['checking','reviewing','revising','rechecking'].includes(task.report_postprocessing.state));){await new Promise(r=>setTimeout(r,20));task=await request('/v1/open-analysis/'+id);}
  assert.equal(task.state,'saved');assert.equal(calls,5);assert.equal(task.report_postprocessing.state,'completed');assert.ok(task.report_postprocessing.editions[0].review.uncovered.length);assert.equal(Object.hasOwn(task.model_report,'calculation'),false);assert.equal(task.browser_report.text,task.model_report.text);assert.match(openTaskView(task).report?.text??'',/真实HTTP未核验报告/);
  const copy=await fetch(origin+`/v1/open-analysis/${id}/reports/1/${task.model_report.outcome_id}/copy`,{headers:{...headers,'x-xanthil-report-content':'1.0'}});assert.equal(copy.status,200);const copyText=await copy.text();assert.match(copyText,/未核验报告/);assert.match(copyText,/不是全面认证/);
  const frontend=await fetch(origin+'/quick-analysis-client.mjs',{headers});assert.equal(await frontend.text(),readFileSync('apps/browser/quick-analysis-client.mjs','utf8'));const before=calls;await request('/v1/open-analysis/'+id);assert.equal(calls,before);
 }finally{await server?.close();t.mock.restoreAll();}
});
