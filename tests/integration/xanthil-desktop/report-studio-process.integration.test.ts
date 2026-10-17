import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createReportStudioProcess} from '../../../adapters/report-studio/process.ts';
import type {ReportStudioOwnerRequest,ReportStudioOwnerValue} from '../../../packages/contracts/report-studio.ts';
const source='b'.repeat(40);
const uuid='00000001-1111-4111-a111-111111111111',ownerInput:ReportStudioOwnerRequest={type:'owner_request',version:'1',request_id:uuid,operation:'context',identity:{project_id:'proj_synthetic',association_id:uuid,snapshot_sha256:'c'.repeat(64)},source:{project_id:uuid,task_id:uuid,revision:'1',outcome_id:uuid,outcome_sha256:'d'.repeat(64),scope_sha256:'e'.repeat(64)},export_id:null};
async function fixture(t:TestContext,mode='normal',ownerRequest?:(request:ReportStudioOwnerRequest)=>Promise<ReportStudioOwnerValue>) {
 const root=await realpath(await mkdtemp(join(tmpdir(),'studio-process-'))),program=join(root,'program'),data=join(root,'data');await mkdir(program);await mkdir(data);
 const entry=join(program,'child.mjs');await writeFile(entry,`
 import {createServer} from 'node:http';import {existsSync} from 'node:fs';
 process.once('message',async config=>{
   if(${JSON.stringify(mode)}==='hang'){setInterval(()=>{},1000);return;}
   if(${JSON.stringify(mode)}==='exit'){process.exit(2);return;}
   if(process.env.MINIMAX_API_KEY||process.env.HOST_CONTROL_TOKEN||process.env.REPORT_STUDIO_BUILTIN!=='1')process.exit(3);
   const server=createServer((req,res)=>{
     if(req.url==='/owner-probe'){const input=${JSON.stringify(ownerInput)};if(${JSON.stringify(mode)}==='bad-owner')input.control='forbidden';const reply=value=>{if(value.type!=='owner_reply'||value.request_id!==input.request_id)return;process.off('message',reply);res.setHeader('content-type','application/json');res.end(JSON.stringify(value));};process.on('message',reply);process.send(input);return;}
     if(req.headers['x-studio-owner']!==config.ownerToken){res.writeHead(403);res.end();return;}res.setHeader('content-type','application/json');if(req.url==='/api/builtin/bridge/close-intent'){res.end(JSON.stringify({state:${JSON.stringify(mode)}==='pending'&&!existsSync(${JSON.stringify(join(root,'release.flag'))})?'pending':'ready'}));return;}res.end(JSON.stringify({protocol_version:'1',plugin_version:'fixed',source_commit:'${source}',execution:'not_configured'}));});
   server.listen(0,'127.0.0.1',()=>process.send({type:'ready',origin:'http://127.0.0.1:'+server.address().port,protocol_version:'1',plugin_version:${JSON.stringify(mode==='wrong'?'wrong':'fixed')},source_commit:'${source}'}));
   process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
 });`);
 const instance=createReportStudioProcess({node:process.execPath,entry,programRoot:program,dataRoot:data,webDist:join(program,'web-dist'),pluginVersion:'fixed',sourceCommit:source,startupMs:1500,stopMs:1000,ownerRequest});
 t.after(async()=>{await writeFile(join(root,'release.flag'),'fixture cleanup');await instance.close();await rm(root,{recursive:true,force:true});});return {...instance,async release(){await writeFile(join(root,'release.flag'),'released');}};
}
test('RS-PROCESS-01 lazy concurrent start returns same owned service; close observes exit',async t=>{
 const instance=await fixture(t);const [one,two]=await Promise.all([instance.start(),instance.start()]);assert.equal(one,two);assert.match(one.origin,/^http:\/\/127\.0\.0\.1:[0-9]+$/);await instance.close();await assert.rejects(()=>fetch(one.origin));
});
test('RS-PROCESS-01 does not inherit host credentials or control tokens',async t=>{
 const old=process.env.MINIMAX_API_KEY,oldToken=process.env.HOST_CONTROL_TOKEN;process.env.MINIMAX_API_KEY='synthetic';process.env.HOST_CONTROL_TOKEN='synthetic';
 try{const instance=await fixture(t);await instance.start();await instance.close();}finally{if(old===undefined)delete process.env.MINIMAX_API_KEY;else process.env.MINIMAX_API_KEY=old;if(oldToken===undefined)delete process.env.HOST_CONTROL_TOKEN;else process.env.HOST_CONTROL_TOKEN=oldToken;}
});
test('RS-PROCESS-01 wrong ready identity, exit and timeout reject and can be stopped',async t=>{
 for(const mode of ['wrong','exit','hang']){const instance=await fixture(t,mode);await assert.rejects(()=>instance.start());await instance.close();}
});

test('RS-LIFECYCLE-01 pending close never sends a signal or discards the live owned session',async t=>{
 const instance=await fixture(t,'pending'),session=await instance.start();
 await assert.rejects(()=>instance.close(),{code:'RS_PROJECT_PENDING'});assert.equal(instance.current(),session);await session.gateway.verify();
 await instance.release();await instance.close();assert.equal(instance.current(),null);await assert.rejects(()=>fetch(session.origin));
});

test('RS-OWNER-01 only verified owned child receives narrow business replies; extra-authority request is refused',async t=>{
 let calls=0;const value:ReportStudioOwnerValue={operation:'context',state:'available',current_revision:'1',return_url:`http://127.0.0.1:12345/?report-studio-project=${uuid}&report-studio-task=${uuid}&report-studio-revision=1`};
 for(const mode of ['normal','bad-owner']){const instance=await fixture(t,mode,async request=>{calls++;assert.deepEqual(request,ownerInput);return value;}),session=await instance.start();const response=await fetch(session.origin+'/owner-probe',{signal:AbortSignal.timeout(1500)}),reply=await response.json();assert.equal(reply.type,'owner_reply');assert.equal(reply.request_id,uuid);assert.equal(reply.ok,mode==='normal');if(mode==='normal')assert.deepEqual(reply.value,value);await instance.close();}assert.equal(calls,1);
});

test('RS-OWNER-01 pending owner work prevents termination even before a child close-intent',async t=>{
 let admit!:()=>void,release!:()=>void;const ready=new Promise<void>(r=>{admit=r;}),gate=new Promise<void>(r=>{release=r;}),watchdog=setTimeout(()=>release(),2000);t.after(()=>{release();clearTimeout(watchdog);});
 const instance=await fixture(t,'normal',async()=>{admit();await gate;return {operation:'context',state:'unavailable',current_revision:null,return_url:null};}),session=await instance.start(),probe=fetch(session.origin+'/owner-probe',{signal:AbortSignal.timeout(3000)});await ready;
 await assert.rejects(()=>instance.close(),{code:'RS_PROJECT_PENDING'});assert.equal(instance.current(),session);release();assert.equal((await(await probe).json()).ok,true);await instance.close();
});
