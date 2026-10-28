import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createDecisionSources} from '../../../packages/application/decision-sources.ts';import type {OpenStoredTask} from '../../../packages/ports/open-analysis-store.ts';
import {nativeReport} from '../../fixtures/xanthil-desktop/native-report.ts';
import {createPersonalOpenAnalysisWorkspace} from '../../../profiles/personal/open-analysis.ts';
test('DP-HOST-01: exact selected content remains fixed through edits; no other task, raw source or HTML',async()=>{
 const f=await nativeReport({text:'MODEL 未核验，不是正式决定'}),app=createPersonalOpenAnalysisWorkspace(f.configuration),taskId=f.identity.task_id;
 try{
 const sources=createDecisionSources({projectId:f.configuration.project_id,readTask:id=>id===taskId?app.read(id):null,reportCopy:app.reportCopy});
 const first=sources.catalog(taskId)[0]!,original=Buffer.from(sources.selected(first.id,taskId).content).toString();assert.match(original,/MODEL 未核验，不是正式决定/);assert.doesNotMatch(original,/数量\n7\n|<html>/);
 const content=app.reportContent(taskId)!;await app.reportContentCommand(taskId,{version:'1.0',command_id:randomUUID(),expected_content_sha256:content.sha256,action:'save',text:'changed',finding_ids:[]});const second=sources.catalog(taskId)[0]!;assert.notEqual(first.source.sha256,second.source.sha256);assert.notEqual(first.id,second.id);
 assert.equal(Buffer.from(sources.selected(first.id,taskId).content).toString(),original);assert.throws(()=>sources.selected(first.id,randomUUID()),/DP_SOURCE_MISSING/);assert.throws(()=>sources.catalog(randomUUID()),/DP_SOURCE_MISSING/);assert.equal(f.provider.requests(),2,'selection/edit/readback adds no model requests');
 }finally{await app.close();}
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
