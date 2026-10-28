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
test('BUI-R06/R07/R12: real store saves one current interpretation, no-op and confirmation identity survive reopening',async()=>{
 const f=await reportFixture(),original=f.content();assert.equal(original.version,0);assert.equal(original.confirmed,false);assert.equal(original.text,f.modelReport.text);
 const target={version:'1.0',command_id:randomUUID(),expected_revision:'1',outcome_id:f.modelReport.outcome_id,outcome_sha256:taskHash(f.modelReport),value:'acknowledged',comment:'旧分析认可'};f.store.acknowledge(f.id,target);
 const confirmed=f.write('confirm');assert.equal(f.content().confirmed,true);
 const saved=f.write('save',{text:'用户自己的解释。',finding_ids:[]});assert.equal(f.content().version,1);assert.equal(f.content().text,'用户自己的解释。');assert.equal(f.content().confirmed,false);assert.equal(f.content().confirmations.length,1);assert.equal(f.store.read(f.id)!.judgments!.length,1);assert.deepEqual(f.store.read(f.id)!.model_report,f.modelReport);
 f.write('save',{text:'用户自己的解释。',finding_ids:[]});assert.equal(f.content().version,1,'no-op cannot invalidate or create version');
 const reopened=createLocalOpenAnalysisStore({projectRoot:f.root});assert.deepEqual(reopened.reportContent!(f.id),f.content());assert.deepEqual(reopened.reportContentReceipt!(f.id,saved.command_id),saved);assert.equal(confirmed.content_version,0);
});
test('BUI-R05/R06/R07: stale writes/confirmations, guessed findings and unfinished suggestions cannot bypass current identity',async()=>{
 const f=await reportFixture(),before=f.content(),command={version:'1.0',command_id:randomUUID(),expected_content_sha256:before.sha256,action:'save',text:'新表达',finding_ids:[]};
 const saved=f.store.reportContentCommand!(f.id,command);assert.deepEqual(f.store.reportContentCommand!(f.id,command),saved);
 assert.throws(()=>f.store.reportContentCommand!(f.id,{...command,text:'另一个内容'}),{code:'COMMAND_CONFLICT'});
 assert.throws(()=>f.store.reportContentCommand!(f.id,{...command,command_id:randomUUID()}),{code:'REVISION_CONFLICT'});
 assert.throws(()=>f.write('save',{text:'保留',finding_ids:['guessed-row']}),{code:'RESULT_OUTSIDE_AUTHORIZATION'});
 f.write('suggest',{instruction:'更简洁'});assert.throws(()=>f.write('confirm'),{code:'REPORT_SUGGESTION_PENDING'});
 assert.deepEqual(f.store.read(f.id)!.model_report,f.modelReport);
});

test('BUI-R06: adding a checked finding preserves interpretation origin; applying a suggestion changes only its target paragraph',async()=>{
 const f=await reportFixture(),original=f.content();f.write('save',{text:original.text,finding_ids:[]});assert.equal(f.content().origin,'MODEL');
 f.write('save',{text:'第一段保持原意。\n\n第二段需润色。',finding_ids:[]});const second=f.content().paragraphs[1]!;
 const request=f.write('suggest',{instruction:'简洁表达',paragraph_id:second.id});f.write('complete',{suggestion_id:request.command_id,text:'第二段更简洁。'});f.write('apply',{suggestion_id:request.command_id});
 assert.equal(f.content().text,'第一段保持原意。\n\n第二段更简洁。');assert.equal(f.content().paragraphs[0].origin,'USER');assert.equal(f.content().paragraphs[1].origin,'MODEL_SUGGESTION · 用户采用');
});
test('BUI-R07/A05: saved limited model report can be confirmed without inventing verified findings; unsettled states stay fenced',async()=>{
 const f=await reportFixture(),p=await partialReportTask(f),before=f.store.read(p.id)!,c=p.content();assert.equal(before.state,'saved');assert.equal(c.partial,false);assert.equal(c.findings.length,0);
 const command={version:'1.0',command_id:randomUUID(),expected_content_sha256:c.sha256,action:'confirm'};
 f.store.reportContentCommand!(p.id,command);assert.equal(p.content().confirmed,true);assert.equal(f.store.read(p.id)!.state,'saved');assert.equal(f.store.read(p.id)!.outcome,null);
 f.store.reportContentCommand!(p.id,{...command,command_id:randomUUID(),action:'save',text:'只编审已保存部分；其他范围仍待澄清。',finding_ids:[]});assert.equal(p.content().confirmed,false);assert.equal(p.content().partial,false);
 const task=f.store.read(p.id)!,current={...command,command_id:randomUUID(),expected_content_sha256:p.content().sha256};
 for(const state of ['ready','running','unknown'] as const)assert.throws(()=>nextReportContentEvent({...task,state},current),{code:'TASK_UNCONFIRMED'});
 assert.throws(()=>nextReportContentEvent({...task,pending_stop_epoch:task.epoch},current),{code:'TASK_UNCONFIRMED'});

});
