import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createPersonalResearchRuntime} from '../../../profiles/personal/deep-research.ts';
import {createResearchCopies} from '../../../adapters/deep-research/copies.mjs';
import {sha256} from '../../../adapters/deep-research/bundle.mjs';
const programRoot=process.env.DR_BUNDLE_ROOT;
test('DR R01/R05: saved copies remain readable without installed plugin',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-profile-'))),taskId=randomUUID(),projectId=randomUUID();
 const store=createResearchCopies({root:join(root,'.juanerai/deep-research',taskId,'copies'),taskId});const copy=store.save(randomUUID(),{projectId:'p-fixed',runId:'run-fixed',version:1},{bytes:Buffer.from('fixed'),contentSha256:sha256('fixed'),limitations:['limited'],unresolved:[]});
 const profile=createPersonalResearchRuntime({hostOrigin:()=>''});const task=profile.task({root,taskId,projectId,check(){},checkControl(){}});
 assert.equal(task.copies()[0].id,copy.id);assert.equal(Buffer.from(task.copy(copy.id).bytes).toString(),'fixed');await assert.rejects(task.open(),/BUNDLE_UNAVAILABLE/);await profile.close();
});
test('DR C04: current control is checked on every effect; new launch invalidates old view writes',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-control-'))),taskId=randomUUID(),projectId=randomUUID();let current=1,held,entered;
 const profile=createPersonalResearchRuntime({programRoot,manifestSha256:sha256(readFileSync(join(programRoot,'manifest.json'))),hostOrigin:()=> 'http://127.0.0.1:12345',fixtureModule:fileURLToPath(new URL('../../fixtures/deep-research/adapters.mjs',import.meta.url)),authorize:async()=>{if(held){entered();await held;}return true;}});t.after(()=>profile.close());
 const task=number=>profile.task({root,taskId,projectId,check(){},checkControl(){if(current!==number)throw Error('REVOKED');}});
 const session=async url=>{const u=new URL(url);const r=await fetch(u.origin+'/bridge/session',{method:'POST',headers:{origin:u.origin,'content-type':'application/json'},body:JSON.stringify({token:u.hash.slice(1)})});assert.equal(r.status,200);return {origin:u.origin,cookie:r.headers.get('set-cookie').split(';')[0],view:(await r.json()).view};};
 const write=(s,view=s.view)=>fetch(s.origin+'/api/projects',{method:'POST',headers:{cookie:s.cookie,'x-research-view':view,origin:s.origin,'content-type':'application/json'},body:JSON.stringify({module:'industry',goal:'synthetic',scope:{summary:'s',queries:[]}})});
 const first=await session((await task(1).open()).url);assert.equal((await write(first)).status,200);current=2;assert.equal((await write(first)).status,403);
 const second=await session((await task(2).open()).url);assert.equal((await write(second,first.view)).status,403);assert.equal((await write(second)).status,200);
 let release;held=new Promise(r=>{release=r;});const arrived=new Promise(r=>{entered=r;});const pending=write(second);await arrived;current=3;release();assert.equal((await pending).status,403);held=undefined;
});
