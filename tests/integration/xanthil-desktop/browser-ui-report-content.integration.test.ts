import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createLocalOpenAnalysisStore} from '../../../adapters/storage-local/open-analysis.ts';
import {taskHash} from '../../../packages/product-core/member-task.ts';
import {openTaskView} from '../../../apps/browser/quick-analysis-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
import type {QuickAnalysisWorkbenchState} from '../../../apps/browser/quick-analysis-workbench.mjs';

import {reportFixture,partialReportTask} from '../../fixtures/xanthil-desktop/browser-ui-report.ts';
import {projectReportContent,nextReportContentEvent} from '../../../packages/product-core/browser-report-content.ts';
import {compileNumericReport} from '../../../packages/product-core/open-analysis-numeric-report.ts';
test('BUI-R06/R07/R12: real store saves one current interpretation, no-op and confirmation identity survive reopening',()=>{
 const f=reportFixture(),original=f.content();assert.equal(original.version,0);assert.equal(original.confirmed,false);assert.equal(original.text,f.outcome.explanation.text);
 const target={version:'1.0',command_id:randomUUID(),expected_revision:'1',outcome_id:f.outcome.outcome_id,outcome_sha256:taskHash(f.outcome),value:'acknowledged',comment:'旧分析认可'};f.store.acknowledge(f.id,target);
 const confirmed=f.write('confirm');assert.equal(f.content().confirmed,true);
 const saved=f.write('save',{text:'用户自己的解释。',finding_ids:[]});assert.equal(f.content().version,1);assert.equal(f.content().text,'用户自己的解释。');assert.equal(f.content().confirmed,false);assert.equal(f.content().confirmations.length,1);assert.equal(f.store.read(f.id)!.judgments!.length,1);assert.deepEqual(f.store.read(f.id)!.outcome,f.outcome);
 f.write('save',{text:'用户自己的解释。',finding_ids:[]});assert.equal(f.content().version,1,'no-op cannot invalidate or create version');
 const reopened=createLocalOpenAnalysisStore({projectRoot:f.root});assert.deepEqual(reopened.reportContent!(f.id),f.content());assert.deepEqual(reopened.reportContentReceipt!(f.id,saved.command_id),saved);assert.equal(confirmed.content_version,0);
});
test('BUI-R05/R06/R07: stale writes/confirmations, guessed findings and unfinished suggestions cannot bypass current identity',()=>{
 const f=reportFixture(),before=f.content(),command={version:'1.0',command_id:randomUUID(),expected_content_sha256:before.sha256,action:'save',text:'新表达',finding_ids:[]};
 const saved=f.store.reportContentCommand!(f.id,command);assert.deepEqual(f.store.reportContentCommand!(f.id,command),saved);
 assert.throws(()=>f.store.reportContentCommand!(f.id,{...command,text:'另一个内容'}),{code:'COMMAND_CONFLICT'});
 assert.throws(()=>f.store.reportContentCommand!(f.id,{...command,command_id:randomUUID()}),{code:'REVISION_CONFLICT'});
 assert.throws(()=>f.write('save',{text:'保留',finding_ids:['guessed-row']}),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
 f.write('suggest',{instruction:'更简洁'});assert.throws(()=>f.write('confirm'),{code:'REPORT_SUGGESTION_PENDING'});
 assert.deepEqual(f.store.read(f.id)!.outcome,f.outcome);
});
test('BUI-R01/R03: shell has one rail, three task views and six working professional pages',()=>{
 const f=reportFixture(),view=openTaskView(f.store.read(f.id)!);const state:QuickAnalysisWorkbenchState={project:'合成项目',tasks:[{id:f.id,title:view.title}],current:view,mode:'pro',stage:'analysis',detail:'context',draft:'保留草稿',drawer:false};
 const html=renderQuickAnalysisWorkbench(state);assert.ok(!html.includes('class="product-rail"'),'single sidebar, no competing rail');for(const key of ['conversation','results','evidence'])assert.match(html,new RegExp('data-view="'+key+'"'));
 for(const stage of ['home','prepare','process','analysis','report','feedback'] as const)assert.match(renderQuickAnalysisWorkbench({...state,stage}),new RegExp('data-professional-view="'+stage+'"'));
});
test('BUI-R06: adding a checked finding preserves interpretation origin; applying a suggestion changes only its target paragraph',()=>{
 const f=reportFixture(),original=f.content();f.write('save',{text:original.text,finding_ids:[original.findings[0].id]});assert.equal(f.content().origin,'MODEL');
 f.write('save',{text:'第一段保持原意。\n\n第二段需润色。',finding_ids:[]});const second=f.content().paragraphs[1]!;
 const request=f.write('suggest',{instruction:'简洁表达',paragraph_id:second.id});f.write('complete',{suggestion_id:request.command_id,text:'第二段更简洁。'});f.write('apply',{suggestion_id:request.command_id});
 assert.equal(f.content().text,'第一段保持原意。\n\n第二段更简洁。');assert.equal(f.content().paragraphs[0].origin,'USER');assert.equal(f.content().paragraphs[1].origin,'MODEL_SUGGESTION · 用户采用');
});
test('BUI-R06/R12: legacy appended history cannot rebase or re-number an already saved current draft',()=>{
 const f=reportFixture();f.write('save',{text:'当前单稿',finding_ids:[]});f.write('confirm');const before=f.content();
 f.store.editReport(f.id,{version:'1.0',command_id:randomUUID(),expected_revision:'1',outcome_id:f.outcome.outcome_id,outcome_sha256:taskHash(f.outcome),expected_expression_version:0,text:'旧协议追加表达，仅历史'});
 assert.equal(f.content().text,'当前单稿');assert.equal(f.content().version,1);assert.equal(f.content().sha256,before.sha256);assert.equal(f.content().confirmed,true);assert.equal(f.content().legacy_expressions.length,1);
 const task=f.store.read(f.id)!;const changed=projectReportContent({...task,outcome:{...task.outcome!,explanation:{kind:'MODEL_EXPLANATION',text:'当前单稿'}}})!;assert.ok(changed.version>before.version,'changed outcome must create a new bound content, not replay a previous no-op into v0');assert.equal(changed.confirmed,false);
});
test('BUI-R04/R06: the real compiled numeric report retains exact values and clickable proof in the new content surface',()=>{
 const f=reportFixture(),numeric=compileNumericReport(JSON.stringify({version:'1.3',status:'ready',derivations:[],interpretations:[{references:['F1'],interpretation:'本次数量为{{F1}}；原因仍需调查。'}]}),{verified_calculations:[{execution_plan:f.outcome.framework,calculation:f.outcome.calculation,verification:f.outcome.verification}]},{identity:f.identity,sources:f.source});
 const task={...f.store.read(f.id)!,outcome:{...f.outcome,numeric_report:numeric,explanation:{kind:'MODEL_EXPLANATION' as const,text:numeric.text}}},content=projectReportContent(task)!;
 assert.ok(!content.text.includes('{{F1}}'),'raw numeric protocol cannot become editable user prose');const view=openTaskView(Object.assign(task,{browser_report:content}));const html=renderQuickAnalysisWorkbench({project:'合成',tasks:[],current:view,mode:'pro',stage:'report',detail:'evidence',drawer:false});assert.match(html,/data-number="F1"[^>]*data-number-source="content"/);assert.match(html,/独立算术/);
});
test('BUI-R07/A05: settled partial waiting content can be saved and confirmed without completing analysis; unsettled states stay fenced',()=>{
 const f=reportFixture(),p=partialReportTask(f),before=f.store.read(p.id)!,c=p.content();assert.equal(before.state,'waiting');assert.equal(c.partial,true);assert.equal(c.findings.length,1);
 const command={version:'1.0',command_id:randomUUID(),expected_content_sha256:c.sha256,action:'confirm'};
 f.store.reportContentCommand!(p.id,command);assert.equal(p.content().confirmed,true);assert.equal(f.store.read(p.id)!.state,'waiting');assert.equal(f.store.read(p.id)!.outcome,null);
 f.store.reportContentCommand!(p.id,{...command,command_id:randomUUID(),action:'save',text:'只编审已保存部分；其他范围仍待澄清。',finding_ids:[]});assert.equal(p.content().confirmed,false);assert.equal(p.content().partial,true);
 const task=f.store.read(p.id)!,current={...command,command_id:randomUUID(),expected_content_sha256:p.content().sha256};
 for(const state of ['ready','running','unknown'] as const)assert.throws(()=>nextReportContentEvent({...task,state},current),{code:'TASK_UNCONFIRMED'});
 assert.throws(()=>nextReportContentEvent({...task,pending_stop_epoch:task.epoch},current),{code:'TASK_UNCONFIRMED'});
 const preview={version:'1.0' as const,command_id:randomUUID(),identity:p.identity,baseline_identity:p.identity,baseline_sha256:taskHash(task),question:'尚未确定',preferences:{skill:'general' as const,prompt:'professional' as const},framework:null,text:null,failure_code:null};
 for(const state of ['preparing','unknown'] as const)assert.throws(()=>nextReportContentEvent({...task,revision_previews:[{...preview,state}]},current),{code:'TASK_UNCONFIRMED'});
 for(const phase of ['running','checking','unknown'] as const)assert.throws(()=>nextReportContentEvent({...task,step_events:[{version:'1.0',identity:p.identity,epoch:task.epoch,seq:1,step_id:p.step.step_id,phase,code:null,receipt_step_id:null}]},current),{code:'TASK_UNCONFIRMED'});
});
