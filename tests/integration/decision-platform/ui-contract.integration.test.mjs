import test from 'node:test';
import assert from 'node:assert/strict';
import * as decision from '../../../apps/browser/decision-platform-client.mjs';
import {renderQuickAnalysisWorkbench} from '../../../apps/browser/quick-analysis-workbench.mjs';
import {renderReportStudioDeliveries} from '../../../apps/browser/report-studio-client.mjs';

test('DUI01 exact saved delivery selection never falls back to another report',()=>{
 assert.equal(typeof decision.selectDecisionSource,'function');
 const rows=[{id:'first',source:{taskId:'t',sourceId:'a',revision:'1',sha256:'a'}},{id:'chosen',source:{taskId:'t',sourceId:'b',revision:'2',sha256:'b'}}];
 assert.equal(decision.selectDecisionSource(rows,{taskId:'t',sourceId:'b',revision:'2',sha256:'b'}).id,'chosen');
 for(const change of [{taskId:'other'},{revision:'1'},{sha256:'changed'},{sourceId:'missing'}])assert.throws(()=>decision.selectDecisionSource(rows,{taskId:'t',sourceId:'b',revision:'2',sha256:'b',...change}));
 assert.throws(()=>decision.selectDecisionSource([...rows,rows[1]],{taskId:'t',sourceId:'b',revision:'2'}));
});
test('DUI01 approved topbar, feedback and stable PDF entry retain unavailable reasons',()=>{
 const current={id:'t',title:'报告',status:'已保存',report:{state:'saved',text:'合成'},messages:[],materials:[],events:[],decisionAvailable:true};
 const html=renderQuickAnalysisWorkbench({project:'本机',tasks:[],current,mode:'pro',stage:'feedback'});
 assert.match(html.slice(html.indexOf('<header class="topbar"'),html.indexOf('</header>')),/data-action="decision-open"/);
 assert.match(html.slice(html.indexOf('data-professional-view="feedback"')),/打开决策看板/);
 const rows=[{delivery_id:'pdf-id',sequence:1,format:'pdf',source:{revision:'1'},warnings:[],created_at:'now',studio_project_state:'ready'},{delivery_id:'html-id',sequence:2,format:'html',source:{revision:'1'},warnings:[],created_at:'now',studio_project_state:'ready'}];
 const saved=renderReportStudioDeliveries(rows,'1',false,true);
 assert.match(saved,/data-action="decision-delivery" data-decision-delivery="pdf-id"/);
 assert.doesNotMatch(saved,/data-action="decision-delivery" data-decision-delivery="html-id"/);
 assert.match(renderReportStudioDeliveries(rows,'1',false,false),/决策看板尚未配置/);
});
test('DUI06 return projection isolates task, version and report feedback counts',()=>{
 assert.equal(typeof decision.decisionReturnSummary,'function');
 const link=(id,taskId,revision)=>({pluginReportId:id,source:{taskId,revision,filename:id+'.pdf',sourceId:id}});
 const action=(reportId,id)=>({reportId,tasks:[{id,feedback:{outcome:'人工记录'}}]});
 const snapshot={reports:[link('1','t','1'),link('2','t','2'),link('3','other','1'),link('4','t','1')],view:{actionItems:[action(1,'a'),action(2,'b'),action(3,'c'),action(4,'d')]}};
 const summary=decision.decisionReturnSummary(snapshot,'t','1');assert.equal(summary.reportCount,2);assert.equal(summary.feedbackCount,2);assert.deepEqual(summary.reports.map(r=>r.sourceId),['1','4']);
 assert.equal(decision.decisionReturnSummary(snapshot,'t','2').feedbackCount,1);assert.equal(decision.decisionReturnSummary(snapshot,'none','1').reportCount,0);
});
test('DUI08 zero host-intent SDK UNKNOWN has a named read-only manual return point',()=>{
 assert.equal(typeof decision.decisionRecoveryGuidance,'function');
 const guidance=decision.decisionRecoveryGuidance({state:{unknown:true},operations:[],view:{project:{id:'p'}}});
 assert.match(guidance,/本机维护者/);assert.match(guidance,/原运行账本/);assert.match(guidance,/p/);assert.match(guidance,/不释放/);
 assert.match(decision.decisionRecoveryGuidance({state:{unknown:true},operations:[{id:'op'}]}),/原操作回执/);
 assert.equal(decision.decisionRecoveryGuidance({state:{unknown:false},operations:[]}),null);
});
test('DUI06/08 upload UNKNOWN is not a confirmed association; history feedback survives',()=>{
 const source={taskId:'t',revision:'1',filename:'pending.pdf',sourceId:'pending'};
 const snapshot={state:{unknown:true},operations:[{id:'op',taskId:'t',state:'unknown'}],reports:[{pluginReportId:null,source},{pluginReportId:'1',source:{...source,filename:'saved.pdf',sourceId:'saved'}}],view:{actionItems:[{reportId:1,tasks:[{id:'task',feedback:{score:4}}]}]}};
 let summary=decision.decisionReturnSummary(snapshot,'t','1');assert.equal(summary.reportCount,1);assert.equal(summary.pendingReports.length,1);assert.equal(summary.feedbackCount,1);assert.equal(summary.unknown,true);
 const current={id:'t',title:'报告',status:'已保存',report:{state:'saved',text:'合成'},messages:[],materials:[],events:[],decisionAvailable:true,decisionSummary:summary};
 let html=renderQuickAnalysisWorkbench({project:'本机',tasks:[],current});assert.match(html,/尚未确认关联/);assert.match(html,/核对原操作/);assert.match(html,/人工反馈 1/);
 snapshot.reports[0].pluginReportId='2';snapshot.operations=[];snapshot.state.unknown=false;
 summary=decision.decisionReturnSummary(snapshot,'t','1');assert.equal(summary.reportCount,2);assert.equal(summary.pendingReports.length,0);assert.equal(summary.unknown,false);assert.equal(summary.feedbackCount,1);
 snapshot.state.unknown=true;summary=decision.decisionReturnSummary(snapshot,'t','1');assert.equal(summary.reportCount,2);assert.equal(summary.unknown,true);assert.equal(summary.feedbackCount,1);
});
