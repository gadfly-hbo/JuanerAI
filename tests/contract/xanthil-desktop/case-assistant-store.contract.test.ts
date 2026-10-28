import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import type {AssistantDraft,AssistantSession,Authorization} from '../../../packages/contracts/case-assistant.ts';
import {mkdtempSync} from 'node:fs';
async function withIsolatedProject<T>(work:(root:string)=>Promise<T>){return work(mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cs-')));}
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {decision,config} from '../../fixtures/case-assistant/fixtures.ts';
import {professionalCase} from '../../fixtures/case-assistant/professional.ts';

test('AC-01/08/09/13 real Completed source, atomic adoption, exact replay, stale sibling, history and unchanged source bytes',async()=>withIsolatedProject(async root=>{
 const f=await professionalCase(root),{baseline,store,source,session,draft,fields}=f,at=new Date().toISOString();
 const original=await readFile(join(root,'.xanthil/desktop/state.sqlite'));
 assert.ok(source.eligible);assert.equal(source.report.report_id,baseline.projection.revision?.current_report_id);
 const sibling=await f.generate();assert.notEqual(sibling.id,draft.id);
 const cmd={command_id:randomUUID(),draft_id:draft.id,draft_version:1,session_id:session.id,actor:'合成采纳人',at,source};
 const originalPrepare=DatabaseSync.prototype.prepare;
 DatabaseSync.prototype.prepare=function(sql:string){const statement=originalPrepare.call(this,sql);if(sql.startsWith('INSERT INTO reports'))return new Proxy(statement,{get(target,key){if(key==='run')return()=>{throw new Error('synthetic disk failure between Decision and report');};return Reflect.get(target,key,target);}});return statement;};
 try{await assert.rejects(()=>store.adopt(cmd),/synthetic disk failure/);}finally{DatabaseSync.prototype.prepare=originalPrepare;}
 assert.deepEqual(await store.formalHistory(source.owner),{decisions:[],reports:[]},'mid-transaction failure rolls back both formal objects');assert.equal((await store.readSession(session.id)).drafts[0].status,'pending','failed adoption preserves reviewable draft');
 const adopted=await store.adopt(cmd);assert.equal(adopted.sequence,1);assert.equal(adopted.fields.owner,fields.owner);
 assert.deepEqual(await store.adopt(cmd),adopted);
 await assert.rejects(()=>store.adopt({...cmd,actor:'different'}),/COMMAND_CONFLICT/);
 await assert.rejects(()=>store.adopt({...cmd,command_id:randomUUID(),draft_id:sibling.id}),/STALE_DECISION/);
 const reopened=createLocalCaseAssistantStore({projectRoot:root}),history=await reopened.formalHistory(source.owner);
 assert.equal(history.decisions.length,1);assert.equal(history.reports.length,1);
 assert.match(history.reports[0].markdown,/合成采纳人/);assert.match(history.reports[0].markdown,new RegExp(source.report.report_id));
 assert.equal(history.reports[0].sequence,source.report.version+1);
 assert.equal((await reopened.readSession(session.id)).drafts.find(d=>d.id===draft.id)?.status,'adopted');
 assert.deepEqual(await readFile(join(root,'.xanthil/desktop/state.sqlite')),original);
 assert.deepEqual(await baseline.app.readProjection(baseline.owner),baseline.projection);await f.close();
}));

test('AC-13 editing appends immutable draft versions rather than discarding the previous draft',async()=>withIsolatedProject(async root=>{
 const f=await professionalCase(root),{store,source,session,draft,fields}=f,at=new Date().toISOString();
 await store.saveDraft({...draft,version:2,edited:true,fields:{...fields,owner:'已编辑Owner'}});
 const saved=(await store.readSession(session.id)).drafts;
 assert.equal(saved.length,2);assert.equal(saved[0].fields.owner,fields.owner);assert.equal(saved[1].fields.owner,'已编辑Owner');
 await assert.rejects(()=>store.adopt({command_id:randomUUID(),session_id:session.id,draft_id:draft.id,draft_version:1,actor:'合成',at,source}),/STALE_DRAFT/);await f.close();
}));

test('AC-08/09 command retry uses unchanged user intent across time and a corrupt sidecar fails closed without repairs',async()=>withIsolatedProject(async root=>{
 const f=await professionalCase(root),{baseline,store,source,session,draft}=f,at=new Date().toISOString();
 const command=randomUUID(),created=await store.createSession(command,{id:randomUUID(),title:'重试合成',source:source.owner,created_at:at,archived:false},source);
 assert.deepEqual(await store.createSession(command,{...created,id:randomUUID(),created_at:'2026-09-29T01:00:00.000Z'},source),created,'same creation command returns committed identity');
 const request={command_id:randomUUID(),draft_id:draft.id,draft_version:1,session_id:session.id,actor:'合成人',at,source};const adopted=await store.adopt(request);
 assert.deepEqual(await store.adopt({...request,at:'2026-09-29T01:00:00.000Z'}),adopted,'retry does not create another time/version');
 const path=join(root,'.xanthil/desktop/case-assistant.sqlite'),db=new DatabaseSync(path);db.exec('CREATE TRIGGER unauthorized_effect AFTER INSERT ON events BEGIN DELETE FROM drafts; END;');db.close();const before=await readFile(path);
 await assert.rejects(()=>store.readSession(session.id),/SCHEMA_UNSUPPORTED/);assert.deepEqual(await readFile(path),before,'corrupt bytes remain untouched');await assert.rejects(()=>f.close(),{code:'SCHEMA_UNSUPPORTED'});await f.agent.waitForIdle();
}));


for(const committed of [false,true])test(`AC-08/09 uncertain COMMIT ${committed?'persisted':'rolled back'} blocks unsafe mutation until verified reopen or receipt`,async()=>withIsolatedProject(async root=>{
 const f=await professionalCase(root),{baseline,store,source,session,draft}=f,at=new Date().toISOString();
 const original=await readFile(join(root,'.xanthil/desktop/state.sqlite'));
 const command={command_id:randomUUID(),draft_id:draft.id,draft_version:1,session_id:session.id,actor:'合成人',at,source};
 const exec=DatabaseSync.prototype.exec,prepare=DatabaseSync.prototype.prepare,targets=new WeakSet<DatabaseSync>();let injected=0,unreadable=0,uncertain=false;
 DatabaseSync.prototype.prepare=function(sql:string){if(sql.startsWith('INSERT INTO decisions'))targets.add(this);return prepare.call(this,sql);};
 DatabaseSync.prototype.exec=function(sql:string){
  if(uncertain&&sql.startsWith('PRAGMA foreign_keys')){unreadable++;throw new Error('synthetic receipt connection temporarily unreadable');}
  if(sql==='COMMIT'&&targets.has(this)&&injected===0){injected++;if(committed)exec.call(this,sql);uncertain=true;throw new Error('synthetic lost COMMIT response');}
  return exec.call(this,sql);
 };
 try{await assert.rejects(()=>store.adopt(command),/RESULT_PENDING/);}finally{DatabaseSync.prototype.exec=exec;DatabaseSync.prototype.prepare=prepare;}
 assert.equal(injected,1);assert.equal(unreadable,1,'actual fresh receipt connection is the uncertain boundary');
 const history=await store.formalHistory(source.owner);assert.equal(history.decisions.length,committed?1:0);assert.equal(history.reports.length,committed?1:0);
 await assert.rejects(()=>store.saveDraft({...draft,version:2}),/RESULT_PENDING/,'mutations stay blocked after connectivity alone recovers');
 await assert.rejects(()=>store.adopt({...command,command_id:randomUUID()}),/RESULT_PENDING/,'new command cannot bypass unresolved outcome');
 const reopened=createLocalCaseAssistantStore({projectRoot:root});const verified=await reopened.formalHistory(source.owner);assert.equal(verified.decisions.length,committed?1:0);
 if(committed)assert.deepEqual(await store.adopt(command),verified.decisions[0],'verified matching receipt safely resolves the original command');
 const result=await reopened.adopt(command);assert.deepEqual(await reopened.adopt({...command,at:'2026-09-30T00:00:00.000Z'}),result);
 const final=await reopened.formalHistory(source.owner);assert.equal(final.decisions.length,1);assert.equal(final.reports.length,1);assert.equal(final.decisions[0].id,result.id);assert.equal((await reopened.readSession(session.id)).drafts.at(-1)?.status,'adopted');
 assert.deepEqual(await readFile(join(root,'.xanthil/desktop/state.sqlite')),original);await assert.rejects(()=>f.close(),{code:'RESULT_PENDING'});await f.agent.waitForIdle();
}));

test('VUI03 AC-12/13 mixed legacy/new reports keep exact historical bytes and generate escaped labeled exports',async()=>withIsolatedProject(async root=>{
 const {createHash}=await import('node:crypto');const f=await professionalCase(root),{baseline,store,source,fields,app}=f,hash=(s:string)=>createHash('sha256').update(s).digest('hex');
 try{const id=f.session.id;let p=await app.adopt(id,f.draft.id,f.draft.version,'合成采纳人',randomUUID());
 // Seed a valid pre-correction report in the real Store, using its historical formatter.
 const formal=p.decisions[0],markdown=`# 正式 Decision Record / Expected Outcome\n\n来源 final report: ${source.report.report_id}\n来源 Case/revision: ${source.owner.case_id} / ${source.owner.revision_id}\n采纳人: ${formal.actor}\n采纳时间: ${formal.adopted_at}\n\n${JSON.stringify(formal,null,2)}\n`;
 const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>正式决策报告</title><body><pre>${markdown.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}</pre></body></html>`;
 const legacy={...p.reports[0],markdown,html,markdown_sha256:hash(markdown),html_sha256:hash(html)},body=JSON.stringify(legacy);const db=new DatabaseSync(join(root,'.xanthil/desktop/case-assistant.sqlite'));try{db.prepare('UPDATE reports SET body=?,sha256=? WHERE id=?').run(body,hash(body),legacy.id);}finally{db.close();}
 p=await app.revise(id,p.current_decision_id!);const edited={...fields,owner:'新责任人',rationale:'<script>alert("synthetic")</script> & [unsafe](javascript:alert(1))',outcome:{...fields.outcome,baseline:'新的基线',baseline_source:'完整基线来源'}};p=await app.edit(id,p.drafts.at(-1)!.id,1,edited);p=await app.adopt(id,p.drafts.at(-1)!.id,2,'新采纳人',randomUUID());
 assert.deepEqual(p.reports[0],legacy);const report=p.reports[1];assert.match(report.html,/<dt>决策责任人<\/dt><dd>新责任人<\/dd>/);assert.match(report.markdown,/\*\*决策责任人\*\*/);assert.doesNotMatch(report.html,/<pre>|<script>|href="javascript:/);assert.match(report.html,/&lt;script&gt;/);assert.match(report.html,/完整基线来源/);
 assert.ok(p.decisions[1].draft_id,'legacy formal history retains its actual draft provenance');
 for(const value of [p.decisions[1].id,p.decisions[1].outcome_id,p.decisions[1].draft_id,source.owner.project_id,source.owner.session_id,source.owner.case_id,source.owner.revision_id,source.report.report_id,formal.id])assert.ok(report.html.includes(value)&&report.markdown.includes(value),'complete immutable provenance '+value);
 assert.equal(report.markdown_sha256,hash(report.markdown));assert.equal(report.html_sha256,hash(report.html));const before=await readFile(join(root,'.xanthil/desktop/case-assistant.sqlite'));
 const reopened=createLocalCaseAssistantStore({projectRoot:root});assert.deepEqual((await reopened.formalHistory(source.owner)).reports,p.reports);assert.equal((await reopened.formalHistory(source.owner)).decisions.length,2);assert.deepEqual(await readFile(join(root,'.xanthil/desktop/case-assistant.sqlite')),before);
 }finally{await app.close();}
}));
