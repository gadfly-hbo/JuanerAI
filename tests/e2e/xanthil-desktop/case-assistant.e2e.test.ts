import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import test from 'node:test';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
async function compiledProviderSettings(dir:string){const source=await readFile(new URL('../../../apps/desktop/provider-settings.tsx',import.meta.url),'utf8'),compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText;const text=compiled.replace(/from ['\"](react(?:\/jsx-runtime)?)['\"]/g,(_m,s)=>`from ${JSON.stringify(pathToFileURL(require.resolve(s)).href)}`);const file=join(dir,'provider-settings-'+crypto.randomUUID()+'.mjs');await writeFile(file,text,{flag:'wx'});return pathToFileURL(file).href;}


test('UI-03/05/19/20 initial Quick surface offers Case association, explicit unauthorized Provider and Preview only controls',async()=>{
 const path=new URL('../../../apps/desktop/case-assistant-workspace.tsx',import.meta.url),source=await readFile(path,'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText;
 let emitted=compiled.replace(/from ['"](react(?:\/jsx-runtime)?)['"]/g,(_m,s)=>`from ${JSON.stringify(pathToFileURL(require.resolve(s)).href)}`).replace(/from ['"]\.\.\/\.\.\/packages\/([^'"]+)['"]/g,(_m,s)=>`from ${JSON.stringify(new URL('../../../packages/'+s,import.meta.url).href)}`);
 const dir=join(tmpdir(),'case-assistant-render-test');await mkdir(dir,{recursive:true});emitted=emitted.replace("'./provider-settings.tsx'",JSON.stringify(await compiledProviderSettings(dir)));const file=join(dir,`component-${Date.now()}.mjs`);await writeFile(file,emitted);
 const {CaseAssistantWorkspace}=await import(pathToFileURL(file).href);let calls=0;
 const html=renderToStaticMarkup(createElement(CaseAssistantWorkspace,{api:{request(){calls++;throw new Error('no implicit call');}},projectId:null,sources:[],initial:null,onChange(){},onOpenSource(){},onChooseProject(){}}));
 for(const label of ['关联一个 Case','模型未配置','Case 决策与预期 v1.0','Fork','Subagent','Preview'])assert.ok(html.includes(label),`visible ${label}`);assert.equal(calls,0);
 const unconfigured=html.match(/<p class="ca-environment">[\s\S]*?<\/p>/)?.[0]??'';
 assert.match(unconfigured,/<button[^>]*>配置模型<\/button>/,'PS-01 unconfigured callout directly opens settings before a Project or session exists');

 const initial={session:{id:'synthetic-session',title:'Synthetic',source:{revision_id:'synthetic-revision'}},source:{case_name:'Synthetic',evidence_refs:[],limitations:[]},events:[],drafts:[],decisions:[],reports:[],attempts:[{status:'Stopped',turns:1,execution_ms:12,cost_microunits:42000000000,authorization:{config:{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',limits:{turns:8,cost_microunits:49152000000000,currency:'XIAOMI_CREDITS'}}}}]};
 const credits=renderToStaticMarkup(createElement(CaseAssistantWorkspace,{api:{request(){throw new Error('no implicit call');}},projectId:null,sources:[],initial,onChange(){},onOpenSource(){},onChooseProject(){}}));
 for(const label of ['Token Plan Credits','保守上界，非账单','42000 / 49152000','共享最多 8 次请求','16384','2048','12000','60 秒','300 秒','120 秒','600 秒','不购买、不充值、不回退到 PAYG'])assert.ok(credits.includes(label),`ACTIVATE-003 visible ${label}`);
 assert.doesNotMatch(credits,/费用：/);
});

// Compile actual presentation functions, omitting only the browser mount bootstrap.
async function reviewComponents(){
 const dir=join(process.env.JUANERAI_TEST_EVIDENCE_DIR??tmpdir(),'vui-render');await mkdir(dir,{recursive:true});
 const settingsUrl=await compiledProviderSettings(dir);
 const compile=async(name:string,extra='',workspace='')=>{
  const url=new URL('../../../apps/desktop/'+name,import.meta.url);let source=await readFile(url,'utf8');if(name==='renderer.tsx')source=source.slice(0,source.indexOf("const root = document.getElementById('root');"))+extra;
  let text=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ESNext}}).outputText;
  text=text.replace(/from ['"](react(?:\/jsx-runtime)?|react-dom\/client)['"]/g,(_m,s)=>`from ${JSON.stringify(pathToFileURL(require.resolve(s)).href)}`).replace(/from ['"]\.\.\/\.\.\/packages\/([^'"]+)['"]/g,(_m,s)=>`from ${JSON.stringify(new URL('../../../packages/'+s,import.meta.url).href)}`).replace("'./case-assistant-workspace.tsx'",JSON.stringify(workspace)).replace("'./provider-settings.tsx'",JSON.stringify(settingsUrl));
  const file=join(dir,name+'-'+crypto.randomUUID()+'.mjs');await writeFile(file,text,{flag:'wx'});return pathToFileURL(file).href;
 };
 const workspace=await compile('case-assistant-workspace.tsx');return {...await import(workspace),...await import(await compile('renderer.tsx','\nexport {ProfessionalDecision,ProfessionalControl};\n',workspace))};
}
async function withReviewRecord(work:(value:any)=>Promise<void>){
 const {withIsolatedProject}=await import('../../fixtures/xanthil-desktop/desktop-contract-drivers.ts');const {completedCase}=await import('../../fixtures/case-assistant/completed-case.ts');const {createLocalCaseAssistantStore}=await import('../../../adapters/storage-local/case-assistant.ts');const {createCaseAssistantApplication}=await import('../../../packages/application/case-assistant.ts');const {decision,config}=await import('../../fixtures/case-assistant/fixtures.ts');
 return withIsolatedProject(async root=>{const baseline=await completedCase(root),store=createLocalCaseAssistantStore({projectRoot:root}),source=await store.readSource(baseline.owner),fields={...decision,choice:'no_action' as const,candidate_id:null,evidence_refs:source.evidence_refs,finding_refs:[source.finding_id]};
 const app=createCaseAssistantApplication({store,runtime:{async turn(){return{provider:config.provider,model:config.model,cost_microunits:0,output:{kind:'draft',fields}};}},config,clock:()=>new Date()});try{const linked=await app.link(baseline.owner,'可读报告',crypto.randomUUID()),id=linked.session.id,a=await app.prepare(id,'合成任务');await app.start(id,a.id,true);let p=await app.read(id);for(let i=0;i<200&&!p.drafts.length;i++){await new Promise(r=>setTimeout(r,5));p=await app.read(id);}assert.equal(p.drafts.length,1);p=await app.adopt(id,p.drafts[0].id,1,'合成采纳人',crypto.randomUUID());await work({root,baseline,store,app,p,fields});}finally{await app.close();}});
}

test('VUI01 AC-01/UI-17 absent or different Professional identity never exposes retained formal actions',async()=>withReviewRecord(async({baseline,p})=>{
 const {ProfessionalDecision,ProfessionalControl}=await reviewComponents();
 for(const projection of [null,{...baseline.projection,session:{...baseline.projection.session,case_id:'different-case'}},{...baseline.projection,revision:{...baseline.projection.revision,revision_id:'different-revision'}}]){
  const props={projection,formal:p,disabled:false,onBegin(){},onRevise(){throw Error('forbidden');},onExport(){throw Error('forbidden');},onOriginalReport(){},onFormalReport(){}};
  const html=renderToStaticMarkup(createElement(ProfessionalDecision,props))+renderToStaticMarkup(createElement(ProfessionalControl,props));assert.doesNotMatch(html,/当前正式决定|创建待采纳修订|formal-report-/,'previous Case is not actionable in a new or different selection');
 }
 const current=renderToStaticMarkup(createElement(ProfessionalDecision,{projection:baseline.projection,formal:p,disabled:false,onBegin(){},onRevise(){},onExport(){}}));assert.match(current,/当前正式决定/);
}));

test('VUI03 UI-16/17 Professional report uses its own immutable business fields, never serialized or current fallback',async()=>withReviewRecord(async({baseline,app,p})=>{
 const first=p.decisions[0];let next=await app.revise(p.session.id,first.id);next=await app.edit(p.session.id,next.drafts.at(-1).id,1,{...first.fields,owner:'新版本责任人'});next=await app.adopt(p.session.id,next.drafts.at(-1).id,2,'合成采纳人',crypto.randomUUID());
 const {ProfessionalDecision}=await reviewComponents(),render=(formal:any)=>renderToStaticMarkup(createElement(ProfessionalDecision,{projection:baseline.projection,formal,disabled:false,onBegin(){},onRevise(){},onExport(){}}));
 const html=render(next);const reports=html.match(/<details class="formal-report"[\s\S]*?<\/details>/g)??[];assert.equal(reports.length,2);assert.match(reports[0],/<dt>决策责任人<\/dt><dd>合成负责人<\/dd>/);assert.doesNotMatch(reports[0],/新版本责任人/);assert.match(reports[1],/新版本责任人/);assert.doesNotMatch(reports.join(''),/&quot;(outcome_id|fields)&quot;|<pre>/);
 const missing=render({...next,decisions:next.decisions.filter((d:any)=>d.id!==first.id)});assert.match(missing,/报告关联的正式记录不可用/);
}));

test('VUI04 UI-14/16 draft report caption is truthful across pending adopted rejected cancelled and reopen',async()=>withReviewRecord(async({store,app,p})=>{
 const {CaseAssistantWorkspace}=await reviewComponents();const render=(initial:any)=>renderToStaticMarkup(createElement(CaseAssistantWorkspace,{api:{},projectId:p.session.source.project_id,sources:[],initial,onChange(){},onOpenSource(){},onChooseProject(){}}));
 const adopted=render(p);assert.match(adopted,/已生成报告 v3/);assert.doesNotMatch(adopted,/未生成报告版本/);
 let revised=await app.revise(p.session.id,p.current_decision_id),pending=render(revised);assert.match(pending,/本草案尚未生成报告/);assert.match(pending,/已有正式报告保持不变/);
 const d=revised.drafts.at(-1);revised=await app.cancelRevision(p.session.id,d.id,d.version);assert.match(render(revised),/修订已取消.*未新增报告/);assert.match(render(revised),/已有正式报告保持不变/);
 revised=await app.revise(p.session.id,p.current_decision_id);const rejected=await app.reject(p.session.id,revised.drafts.at(-1).id,1,true,'不采纳');assert.match(render(rejected),/草案已拒绝.*未新增报告/);
 const reopened={...rejected,...await store.readSession(p.session.id)};assert.equal(render(reopened),render(rejected));assert.equal(reopened.reports.length,1);
}));
