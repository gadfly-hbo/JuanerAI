import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {createDecisionGateway} from '../../../adapters/decision-platform/gateway.ts';
test('DP-SOURCE-01: actual receipt shape and same file bytes; reject unsafe paths and wrong project',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-gateway-'))),id=randomUUID(),marker=randomUUID(),name='source-'+randomUUID()+'.md';
 const content=Buffer.from('# synthetic');const dir=join(root,'projects',id,'reports');mkdirSync(dir,{recursive:true});writeFileSync(join(dir,name),content);
 let calls=0,wrong=false;
 const gateway=createDecisionGateway({dataRoot:root,async request(path,method,body){calls++;
  if(path==='/api/projects'&&method==='POST'){assert.equal((body as {purpose:string}).purpose,'JuanerAI:'+marker);return {id,purpose:'JuanerAI:'+marker};}
  if(path==='/api/projects/'+id)return {id,purpose:'JuanerAI:'+marker};
  if(path.endsWith('/board'))return {project:{id:wrong?randomUUID():id},reports:[{id:1,projectId:id,filename:name,status:'done'}]};
  return {results:[{filename:name,status:'accepted',ok:true}]};
 }});
 try{
  assert.deepEqual(await gateway.createProject('合成',marker),{id,marker});assert.deepEqual(await gateway.project(id),{id,marker});
  await gateway.uploadReport(id,name,content);const receipt=await gateway.report(id,name);assert.equal(receipt?.reportId,'1');assert.equal(receipt?.sha256,createHash('sha256').update(content).digest('hex'));
  const before=calls;await assert.rejects(gateway.report('../escape',name));await assert.rejects(gateway.uploadReport(id,'../escape.md',content));assert.equal(calls,before);
  wrong=true;await assert.rejects(gateway.report(id,name));wrong=false;
  rmSync(join(dir,name));const outside=join(root,'outside.md');writeFileSync(outside,content);symlinkSync(outside,join(dir,name));await assert.rejects(gateway.report(id,name));
 }finally{rmSync(root,{recursive:true,force:true});}
});
