import {professionalCase} from '../../fixtures/case-assistant/professional.ts';
import {mkdtempSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';

import {decision,config} from '../../fixtures/case-assistant/fixtures.ts';
import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';





























async function withFork(label:string,work:(value:Awaited<ReturnType<typeof forkFixture>>)=>Promise<void>){const f=await forkFixture(label);try{await work(f);}finally{await f.close();}}
async function forkFixture(label:string){const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'cl-')),f=await professionalCase(root),parent=await f.app.read(f.session.id),preview=await f.app.prepareChild(parent.session.id,'subagent',label,null,[],[],false),child=await f.app.createChild(parent.session.id,preview.id,randomUUID(),true);return {...f,parent,child};}

test('AC-FS-09 failed Application close can be explicitly retried and persists the family',async()=>withFork('close-storage-retry',async s=>{
 const original=s.store.closeFamily;let failed=false;s.store.closeFamily=async(...args)=>{if(!failed){failed=true;throw Error('synthetic close disk failure');}return original(...args);};
 await assert.rejects(()=>s.app.close(),/synthetic close disk failure/);assert.equal((await s.store.readLifecycle(s.parent.session.id)).open,true);await s.app.close();assert.equal((await s.store.readLifecycle(s.parent.session.id)).open,false);assert.equal((await s.store.readLifecycle(s.child.session.id)).open,false);assert.equal(s.calls(),2);
}));







test('AC-FS-08/09 pending child authorization cannot survive a close and explicit reopen',async()=>withFork('prepare-close-reopen',async s=>{
 const original=s.store.childResults;let entered!:()=>void,release!:()=>void,held=false;
 const reached=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
 s.store.childResults=async(...args)=>{const value=await original(...args);if(!held){held=true;entered();await gate;}return value;};
 const pending=s.app.prepareCollaboration(s.child.session.id,'关闭前的任务',[],[]);
 await reached;await s.app.closeSession(s.child.session.id);await s.app.reopenSession(s.child.session.id,(await s.app.lifecycle(s.child.session.id)).epoch);release();
 await assert.rejects(pending,/INTERRUPTED|CLOSED/);s.store.childResults=original;
 assert.equal((await s.app.read(s.child.session.id)).events.length,0);assert.equal(s.calls(),2);
 const fresh=await s.app.prepareCollaboration(s.child.session.id,'重新核对的任务',[],[]);assert.equal(fresh.collaboration?.child_epoch,(await s.app.lifecycle(s.child.session.id)).epoch);
}));












