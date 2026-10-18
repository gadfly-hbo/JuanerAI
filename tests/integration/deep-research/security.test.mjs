import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {createResearchServer} from '../../../adapters/deep-research/server.mjs';
import {syntheticAdapters} from '../../fixtures/deep-research/adapters.mjs';
const programRoot=process.env.DR_PROGRAM_ROOT;
test('DR R02/R06: cancelled gate recovery cannot skip either approved confirmation',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-gate-'))),ownerToken=randomBytes(32).toString('hex');
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async()=>true,makeAdapters:()=>syntheticAdapters(programRoot)});t.after(()=>server.close());
 const call=async(path,body)=>{const r=await fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{'x-research-owner':ownerToken,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};};
 const id=(await call('/api/projects',{module:'industry',goal:'合成',scope:{summary:'s',queries:[]}})).body.id,path='/api/projects/'+id;
 await call(path+'/runs',{request:{id:'req-cancel-gate',module:'industry',goal:'合成',scope:{summary:'s',queries:[]}}});
 let run;for(let i=0;i<100;i++){run=(await call(path)).body.runs[0];if(run?.status==='awaiting-confirmation')break;await new Promise(r=>setTimeout(r,15));}
 assert.equal(run.gate.kind,'plan');await call(path+`/runs/${run.id}/gate/cancel`,{});
 const resumed=await call(path+'/runs/resume',{requestId:run.requestId});assert.equal(resumed.status,200);
 await new Promise(r=>setTimeout(r,80));const current=(await call(path)).body.runs[0];assert.equal(current.status,'awaiting-confirmation');assert.equal(current.gate.kind,'plan');
});
test('DR C04: one-use browser bootstrap, forged origin and disabled HTTP effects',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-cookie-'))),ownerToken=randomBytes(32).toString('hex');let effects=0;
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async()=>{effects++;return false;}});t.after(()=>server.close());
 const url=new URL(server.launch()),token=url.hash.slice(1);
 const exchange=()=>fetch(server.origin+'/bridge/session',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token})});
 const boot=await exchange();assert.equal(boot.status,200);const view=(await boot.json()).view;const cookie=boot.headers.get('set-cookie').split(';')[0];assert.match(boot.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.equal((await exchange()).status,403);
 const denied=await fetch(server.origin+'/api/projects',{method:'POST',headers:{cookie,origin:'https://evil.invalid','content-type':'application/json'},body:'{}'});assert.equal(denied.status,403);assert.equal(effects,0);
 const denied2=await fetch(server.origin+'/api/projects',{method:'POST',headers:{cookie,'x-research-view':view,origin:server.origin,'content-type':'application/json'},body:'{}'});assert.equal(denied2.status,403);assert.equal(effects,1);
 assert.equal((await fetch(server.origin+'/api/projects',{headers:{cookie}})).status,200);
});

test('DR C05/R09: recursively hide synthetic credentials on settings read',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-settings-'))),ownerToken=randomBytes(32).toString('hex');
 writeFileSync(join(root,'config.json'),JSON.stringify({model:{provider:'synthetic',nested:{apiKey:'must-not-leak',credential:'must-not-leak'}},search:[{secret:'must-not-leak'}]}));
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async()=>false});t.after(()=>server.close());
 const r=await fetch(server.origin+'/api/settings',{headers:{'x-research-owner':ownerToken}});assert.equal(r.status,200);const text=await r.text();assert.ok(!text.includes('must-not-leak'));assert.ok(text.includes('synthetic'));
});
test('DR C04/C05: explicit attachment grant freezes only exact bytes; arbitrary or changed paths are rejected',{skip:!programRoot},async t=>{
 const {createHash}=await import('node:crypto');const {readFileSync}=await import('node:fs');
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-attachment-'))),source=join(root,'synthetic.txt'),bytes=Buffer.from('合成材料，不是真实数据');writeFileSync(source,bytes);
 const ownerToken=randomBytes(32).toString('hex'),digest=createHash('sha256').update(bytes).digest('hex');
 const server=await createResearchServer({programRoot,dataRoot:join(root,'private'),ownerToken,authorize:async()=>true,authorizedAttachments:[{sourcePath:source,bytes:bytes.length,sha256:digest}],makeAdapters:()=>syntheticAdapters(programRoot)});t.after(()=>server.close());
 const call=async(path,body)=>{const r=await fetch(server.origin+path,{method:'POST',headers:{'x-research-owner':ownerToken,'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const project=(await call('/api/projects',{module:'industry',goal:'synthetic',scope:{summary:'s',queries:[]}})).body.id;
 const body={request:{id:'req-attachment',module:'industry',goal:'synthetic',scope:{summary:'s',queries:[]},attachments:[source]}};
 assert.equal((await call('/api/projects/'+project+'/runs',{request:{...body.request,attachments:['/etc/passwd']}})).status,403);
 writeFileSync(source,'changed');assert.equal((await call('/api/projects/'+project+'/runs',body)).status,409);
 writeFileSync(source,bytes);assert.equal((await call('/api/projects/'+project+'/runs',body)).status,200);
 assert.deepEqual(readFileSync(join(root,'private/attachments',digest+'.txt')),bytes);
 for(let i=0;i<100&&(server.state().active||server.state().effects);i++)await new Promise(r=>setTimeout(r,10));
});
test('DR R06: interrupted publication remains UNKNOWN and denies replay without rewriting state',{skip:!programRoot},async()=>{
 const {spawnSync}=await import('node:child_process');const {pathToFileURL}=await import('node:url');
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-unknown-'))),ownerToken=randomBytes(32).toString('hex');
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async()=>true});
 const r=await fetch(server.origin+'/api/projects',{method:'POST',headers:{'x-research-owner':ownerToken,'content-type':'application/json'},body:JSON.stringify({module:'industry',goal:'synthetic',scope:{summary:'s',queries:[]}})});const project=await r.json();await server.close();
 const marker=join(root,'projects',project.id,'host-publish-pending.json');writeFileSync(marker,'{"runId":"synthetic-interrupted"}');
 const code=`import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createResearchServer} from ${JSON.stringify(new URL('../../../adapters/deep-research/server.mjs',import.meta.url).href)};
 const server=await createResearchServer({programRoot:${JSON.stringify(programRoot)},dataRoot:${JSON.stringify(root)},ownerToken:${JSON.stringify(ownerToken)},authorize:async()=>{throw Error('UNKNOWN must not reach authorization');}});
 assert.equal(server.state().unknown,true);assert.equal(server.state().active,0);
 const r=await fetch(server.origin+'/api/projects',{method:'POST',headers:{'x-research-owner':${JSON.stringify(ownerToken)},'content-type':'application/json'},body:'{}'});assert.equal(r.status,403);assert.match(await r.text(),/STATE_UNKNOWN/);
 assert.equal((await fetch(server.origin+'/api/projects',{headers:{'x-research-owner':${JSON.stringify(ownerToken)}}})).status,200);
 await assert.rejects(server.close(),/UNSETTLED/);assert.equal(readFileSync(${JSON.stringify(marker)},'utf8'),'{"runId":"synthetic-interrupted"}');process.exit(0);`;
 // Own synthetic subprocess exits explicitly after proving there are no active effects; no unknown product state is cleared.
 const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',timeout:15000});assert.equal(result.status,0,result.stderr);
});
test('DR R08/C04: original library registration, scope and denied acquisition use the protected listener',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-library-'))),ownerToken=randomBytes(32).toString('hex');let effects=0;
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async r=>{if(r.effect==='http')return true;effects++;return false;},makeAdapters:()=>syntheticAdapters(programRoot)});t.after(()=>server.close());
 const call=async(path,body)=>{const r=await fetch(server.origin+path,{method:body===undefined?'GET':'POST',headers:{'x-research-owner':ownerToken,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};};
 const input={items:[{kind:'file',filename:'synthetic.txt',content:'合成资料，仅用于离线验证',reuseScope:'RESTRICTED',idempotencyKey:'synthetic-file'}]};
 assert.equal((await call('/api/library/assets',input)).status,200);await call('/api/library/assets',input);
 const listed=(await call('/api/library/assets')).body;assert.equal(listed.assets.length,1);assert.equal(listed.assets[0].reuseScope,'RESTRICTED');
 const linked=await call('/api/library/assets',{kind:'link',url:'https://synthetic.invalid/library',title:'synthetic'});assert.equal(linked.status,200);
 const all=(await call('/api/library/assets')).body.assets,link=all.find(a=>a.source.sourceKind==='web'||a.source.url==='https://synthetic.invalid/library');assert.ok(link,JSON.stringify(all));
 const denied=await call('/api/library/assets/fetch',{versionId:link.latestVersion.versionId});assert.notEqual(denied.status,200);assert.equal(effects,1);
});
test('DR C04/C05: request identifiers cannot escape private request storage',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-request-path-'))),ownerToken=randomBytes(32).toString('hex');
 const server=await createResearchServer({programRoot,dataRoot:root,ownerToken,authorize:async()=>true,makeAdapters:()=>syntheticAdapters(programRoot)});t.after(async()=>{for(let i=0;i<100&&server.state().active;i++)await new Promise(r=>setTimeout(r,10));await server.close();});
 const post=(path,body)=>fetch(server.origin+path,{method:'POST',headers:{'x-research-owner':ownerToken,'content-type':'application/json'},body:JSON.stringify(body)});
 const project=await (await post('/api/projects',{module:'industry',goal:'synthetic',scope:{summary:'s',queries:[]}})).json(),base='/api/projects/'+project.id;
 assert.equal((await post(base+'/runs',{request:{id:'../../escaped',module:'industry',goal:'synthetic',scope:{summary:'s',queries:[]}}})).status,400);
 for(const route of ['resume','rerun','cancel'])assert.equal((await post(base+'/runs/'+route,{requestId:'../../escaped'})).status,400);
 const {existsSync}=await import('node:fs');assert.equal(existsSync(join(root,'projects','escaped.json')),false);
});
