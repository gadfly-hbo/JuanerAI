import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,rmSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createDecisionStore} from '../../../adapters/decision-platform/store.ts';
import type {DecisionBinding,DecisionReportLink,DecisionWriteIntent} from '../../../packages/ports/decision-platform.ts';
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-store-'))),projectId=randomUUID();return {root,projectId,config:{projectRoot:root,projectId},cleanup:()=>rmSync(root,{recursive:true,force:true})};}
const binding=():DecisionBinding=>({id:randomUUID(),taskId:randomUUID(),marker:randomUUID(),pluginProjectId:null});
const intent=(taskId:string):DecisionWriteIntent=>({id:randomUUID(),taskId,kind:'project',target:'project',requestSha256:'a'.repeat(64),startedAt:'2026-10-17T00:00:00.000Z',state:'pending',result:null});

test('DP03/07: one task binding, independent source versions and stable bytes survive reopen',()=>{
 const f=fixture();try{const a=createDecisionStore(f.config),b=binding();assert.equal(a.binding(b.taskId),null);a.prepareBinding(b);assert.deepEqual(createDecisionStore(f.config).binding(b.taskId),b);
 const plugin=randomUUID();a.bindProject(b.taskId,plugin);assert.equal(a.binding(b.taskId)?.pluginProjectId,plugin);assert.throws(()=>a.bindProject(b.taskId,randomUUID()));
 const content=Buffer.from('# synthetic saved report');const source={projectId:f.projectId,taskId:b.taskId,sourceId:randomUUID(),revision:'1',format:'md' as const,filename:'report.md',bytes:content.length,sha256:hash(content)};
 const link:DecisionReportLink={id:randomUUID(),bindingId:b.id,source,physicalName:'source-one.md',pluginReportId:null};a.saveReport(link,content);a.linkReport(link.id,'1');
 const next={...link,id:randomUUID(),source:{...source,revision:'2'},physicalName:'source-two.md'};a.saveReport(next,content);
 const reopened=createDecisionStore(f.config);assert.deepEqual(Buffer.from(reopened.report(link.id)!.content),content);assert.equal(reopened.report(link.id)!.link.source.revision,'1');assert.equal(reopened.report(next.id)!.link.source.revision,'2');
 assert.throws(()=>a.saveReport({...next,id:randomUUID(),source:{...source,taskId:randomUUID()}},content));
 assert.throws(()=>a.saveReport({...next,id:randomUUID(),source:{...source,projectId:randomUUID()}},content));
 assert.throws(()=>a.saveReport({...next,id:randomUUID()},Buffer.from('wrong bytes')));
 }finally{f.cleanup();}
});

test('DP03: intent saved before effects; duplicate and UNKNOWN cannot be replayed with a fresh id',()=>{
 const f=fixture();try{const s=createDecisionStore(f.config),b=binding();s.prepareBinding(b);const op=intent(b.taskId);assert.equal(s.begin(op).created,true);assert.equal(s.begin(op).created,false);
 assert.throws(()=>s.begin({...op,requestSha256:'b'.repeat(64)}));assert.throws(()=>s.begin({...op,id:randomUUID()}));
 s.settle(op.id,'unknown',null);assert.equal(createDecisionStore(f.config).pending(b.taskId)[0].state,'unknown');assert.throws(()=>s.begin({...op,id:randomUUID()}));
 s.settle(op.id,'confirmed',{projectId:'verified-readback'});assert.equal(s.pending(b.taskId).length,0);assert.deepEqual(createDecisionStore(f.config).intent(op.id)?.result,{projectId:'verified-readback'});
 assert.equal(s.begin(op).created,false);assert.throws(()=>s.settle(op.id,'unknown',null));
 const other=binding();s.prepareBinding(other);assert.equal(s.begin(intent(other.taskId)).created,true);
 }finally{f.cleanup();}
});

test('DP03: commit succeeded but reply lost is recovered by original intent id',()=>{
 const f=fixture();try{const plain=createDecisionStore(f.config),b=binding();plain.prepareBinding(b);const op=intent(b.taskId);
 const faulty=createDecisionStore({...f.config,afterCommit:()=>{throw Error('synthetic reply lost');}});assert.throws(()=>faulty.begin(op),/reply lost/);
 assert.equal(createDecisionStore(f.config).begin(op).created,false);assert.equal(plain.intent(op.id)?.state,'pending');
 }finally{f.cleanup();}
});

test('DP09: wrong project and unknown database cannot be adopted or rewritten',()=>{
 const f=fixture();try{const s=createDecisionStore(f.config);s.prepareBinding(binding());assert.throws(()=>createDecisionStore({...f.config,projectId:randomUUID()}).binding(randomUUID()));}finally{f.cleanup();}
 const g=fixture();try{mkdirSync(join(g.root,'.xanthil'));const path=join(g.root,'.xanthil/decision-platform.sqlite');writeFileSync(path,'legacy-file');assert.throws(()=>createDecisionStore(g.config).binding(randomUUID()));assert.equal(readFileSync(path,'utf8'),'legacy-file');}finally{g.cleanup();}
});
