import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createDecisionSources} from '../../../packages/application/decision-sources.ts';import type {OpenStoredTask} from '../../../packages/ports/open-analysis-store.ts';
test('DP-HOST-01: exact selected content remains fixed through edits; no other task, raw source or HTML',()=>{
 const projectId=randomUUID(),taskId=randomUUID(),outcomeId=randomUUID();let text='MODEL 未核验，不是正式决定';
 const task={state:'saved',identity:{task_id:taskId,revision:'1'},question:'synthetic',outcome:null,conversation_outcome:{outcome_id:outcomeId},history:[]} as unknown as OpenStoredTask;
 const sources=createDecisionSources({projectId,readTask:id=>id===taskId?task:null,reportCopy:()=>({bytes:Buffer.from(text),suggested_file_name:'report.md'})});
 const first=sources.catalog(taskId)[0];text='changed';const second=sources.catalog(taskId)[0];assert.notEqual(first.source.sha256,second.source.sha256);assert.notEqual(first.id,second.id);
 assert.equal(Buffer.from(sources.selected(first.id,taskId).content).toString(),'MODEL 未核验，不是正式决定');assert.throws(()=>sources.selected(first.id,randomUUID()),/DP_SOURCE_MISSING/);assert.throws(()=>sources.catalog(randomUUID()),/DP_SOURCE_MISSING/);
});

import {projectReportSources} from '../../../apps/browser/decision-platform/report-sources.ts';
import type {BoardView} from '../../../apps/browser/decision-platform/reference/data/types.ts';
import type {DecisionReportLink} from '../../../packages/ports/decision-platform.ts';

test('DUI02/06 same-name report versions remain distinguishable without changing source or plugin identity',()=>{
 const report=(id:number)=>({id,projectId:'p',slug:'physical-'+id,filename:'source-physical-'+id+'.md',status:'done' as const,error:null,importedAt:'now',updatedAt:'now'});
 const view:BoardView={title:'合成',lede:'来源版本',project:{id:'p',title:'合成',purpose:'验收'},reports:[report(1),report(2)],actionItems:[],stats:{suggested:0,adopted:0,dismissed:0,manual:0},notify:{configured:false},modelChain:{available:false,providers:[]},isDemo:false};
 const link=(id:string,revision:string):DecisionReportLink=>({id:'link-'+id,bindingId:'binding',pluginReportId:id,physicalName:'source-physical-'+id+'.md',source:{projectId:'p',taskId:'t',sourceId:'source-'+id,revision,format:'md',filename:'同名报告.md',sha256:id.repeat(64),bytes:10}});
 const links=[link('2','2'),link('1','1')],before=structuredClone({view,links});
 const shown=projectReportSources(view,links);
 assert.deepEqual(shown.reports.map(r=>r.filename),['同名报告.md · 版本 1','同名报告.md · 版本 2']);
 assert.deepEqual(shown.reports.map(r=>[r.id,r.slug]),[[1,'physical-1'],[2,'physical-2']]);
 assert.equal(shown.actionItems,view.actionItems);
 assert.deepEqual({view,links},before,'display projection must not rewrite source authority');
 assert.equal(projectReportSources(view,[links[0]]).reports[0],view.reports[0],'unlinked report must not borrow a different source');
});
