import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {createReportStudioGateway} from '../../../adapters/report-studio/gateway.ts';
import {parseReportStudioOwnerRequest,parseReportStudioOwnerValue} from '../../../packages/contracts/report-studio.ts';
const owner='a'.repeat(64),source='b'.repeat(40),identity={project_id:'proj_synthetic',association_id:'00000001-1111-4111-a111-111111111111',snapshot_sha256:'c'.repeat(64)};
async function fixture(t:TestContext,reply:(url:string)=>{status?:number;body?:unknown;raw?:string;headers?:Record<string,string>}) {
  const seen:string[]=[];
  const server=createServer((req,res)=>{
    assert.equal(req.headers['x-studio-owner'],owner);assert.equal(req.headers.origin,undefined);assert.equal(req.headers.cookie,undefined);seen.push(req.url!);
    const value=req.url==='/api/builtin/bridge/status'?{body:{protocol_version:'1',plugin_version:'fixed',source_commit:source,execution:'not_configured'}}:reply(req.url!);
    res.writeHead(value.status??200,{'content-type':'application/json',...value.headers});res.end(value.raw??JSON.stringify(value.body));
  });
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise<void>(r=>server.close(()=>r())));
  const address=server.address();assert(address&&typeof address==='object');
  return {seen,gateway:createReportStudioGateway({origin:`http://127.0.0.1:${address.port}`,ownerToken:owner,pluginVersion:'fixed',sourceCommit:source})};
}
test('RS-GATEWAY-01 reads exact project after real fixed-instance handshake',async t=>{
  const f=await fixture(t,()=>({body:identity}));assert.deepEqual(await f.gateway.project(identity.project_id),identity);assert.equal(f.seen.length,2);
});
test('RS-GATEWAY-01 only explicit 404 means missing; rejects identity mismatch, unknown keys and redirect',async t=>{
  for(const value of [{status:404},{body:{...identity,project_id:'another'}},{body:{...identity,unexpected:true}},{status:302,headers:{location:'http://127.0.0.1:1/'}}]) {
    const f=await fixture(t,()=>value);if(value.status===404)assert.equal(await f.gateway.project(identity.project_id),null);else await assert.rejects(f.gateway.project(identity.project_id));
  }
});
test('RS-GATEWAY-01 validates exact export bytes and preserves warnings; corrupt base64/hash rejected',async t=>{
  const bytes=Buffer.from('<!doctype html><html>synthetic</html>'),value={project_id:identity.project_id,export_id:'export_1',format:'html',created_at:'2026-10-16T00:00:00Z',artifact_sha256:createHash('sha256').update(bytes).digest('hex'),content_base64:bytes.toString('base64'),warnings:['布局需人工检查']};
  const f=await fixture(t,()=>({body:value}));const result=await f.gateway.savedExport(identity.project_id,'export_1');assert(result);assert.deepEqual(Buffer.from(result.content),bytes);assert.deepEqual(result.warnings,value.warnings);
  for(const bad of [{...value,content_base64:value.content_base64+'!'},{...value,artifact_sha256:'0'.repeat(64)},{...value,project_id:'other'}]) {const f=await fixture(t,()=>({body:bad}));await assert.rejects(f.gateway.savedExport(identity.project_id,'export_1'));}
});
test('RS-GATEWAY-01 rejects nonliteral or credentialed origins before connecting',()=>{
  for(const origin of ['http://localhost:1234','http://user:pass@127.0.0.1:1234','https://127.0.0.1:1234','http://127.0.0.1:1234/path'])assert.throws(()=>createReportStudioGateway({origin,ownerToken:owner,pluginVersion:'fixed',sourceCommit:source}));
});

test('RS-OWNER-01 closed owned-child request/value never accepts extra authority or a retargeted return',()=>{
 const id='00000001-1111-4111-a111-111111111111',source={project_id:id,task_id:'00000002-1111-4111-a111-111111111111',revision:'1',outcome_id:'00000003-1111-4111-a111-111111111111',outcome_sha256:'a'.repeat(64),scope_sha256:'b'.repeat(64)},request={type:'owner_request' as const,version:'1' as const,request_id:id,operation:'context' as const,identity,source,export_id:null};
 assert.deepEqual(parseReportStudioOwnerRequest(request),request);
 for(const bad of [{...request,control:'forbidden'},{...request,version:'2'},{...request,source:{...source,path:'/not-permitted'}},{...request,operation:'delete'},{...request,export_id:'exp_arbitrary'}])assert.throws(()=>parseReportStudioOwnerRequest(bad),/RS_OWNER_/);
 const url='http://127.0.0.1:12345/?report-studio-project='+id+'&report-studio-task='+source.task_id+'&report-studio-revision=1',context={operation:'context',state:'available',current_revision:'1',return_url:url};assert.deepEqual(parseReportStudioOwnerValue(context,request),context);
 for(const return_url of [url.replace('127.0.0.1','localhost'),url.replace('report-studio-revision=1','report-studio-revision=2'),url+'&control=forbidden','https://example.com/'])assert.throws(()=>parseReportStudioOwnerValue({...context,return_url},request),/RS_OWNER_/);
 const delivery={delivery_id:id,association_id:identity.association_id,export_id:'exp_saved',format:'html',created_at:'2026-10-16T00:00:00Z',artifact_sha256:'d'.repeat(64),bytes:123,warnings:['合成质检警告'],sequence:1,source,classification:'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED'},deliver={...request,operation:'deliver' as const,export_id:'exp_saved'};
 assert.deepEqual(parseReportStudioOwnerValue({operation:'deliver',state:'saved',delivery},deliver),{operation:'deliver',state:'saved',delivery});
 for(const bad of [{...delivery,export_id:'exp_other'},{...delivery,source:{...source,revision:'2'}},{...delivery,classification:'VERIFIED'},{...delivery,content:'no artifact over IPC'}])assert.throws(()=>parseReportStudioOwnerValue({operation:'deliver',state:'saved',delivery:bad},deliver),/RS_OWNER_/);
 assert.deepEqual(parseReportStudioOwnerValue({operation:'receipt',state:'pending',delivery:null},{...deliver,operation:'receipt'}),{operation:'receipt',state:'pending',delivery:null});
 assert.throws(()=>parseReportStudioOwnerValue({operation:'deliver',state:'not_found',delivery:null},deliver),/RS_OWNER_/);
});

test('RS-EXIT-01 gateway reads closed lifecycle and sends only the three explicit exit intents',async t=>{
 const value={intent:'wait',pending:true,request_count:1,configuration_unknown:false,operations:[{project_id:'proj_synthetic',title:'合成运行报告',kind:'main',state:'running',physical_settled:false,usage_known:null}]};const f=await fixture(t,()=>({body:value}));
 assert.equal(typeof (f.gateway as unknown as {lifecycle?:unknown}).lifecycle,'function');assert.deepEqual(await f.gateway.lifecycle(),value);assert.deepEqual(await f.gateway.exitIntent('wait'),value);assert.equal(f.seen.at(-1),'/api/builtin/bridge/exit-intent');
 const invalid=[{...value,force:true},{...value,pending:false},{...value,request_count:-1},{...value,operations:[{...value.operations[0],kind:'arbitrary'}]},{...value,operations:[{...value.operations[0],path:'/secret'}]},{...value,intent:'force'}];
 for(const body of invalid){const g=await fixture(t,()=>({body}));await assert.rejects(()=>g.gateway.lifecycle(),/RS_STUDIO_PROTOCOL_UNAVAILABLE/);}
 await assert.rejects(()=>f.gateway.exitIntent('force' as 'wait'),/RS_STUDIO_PROTOCOL_UNAVAILABLE/);
});
