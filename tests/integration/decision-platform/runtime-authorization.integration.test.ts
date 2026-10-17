import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createDecisionStore} from '../../../adapters/decision-platform/store.ts';
import {createDecisionMaterialPolicy} from '../../../adapters/decision-platform/material-policy.ts';
import {createDecisionRuntimeAuthorization} from '../../../adapters/decision-platform/runtime-authorization.ts';
test('DP-RUNTIME-01: actual source/teach/recipient grant on every model and publish; unknown and revoke fail closed',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-runtime-auth-')));
 try{
 const projectId=randomUUID(),taskId=randomUUID(),plugin=randomUUID(),id=randomUUID(),binding=randomUUID(),content=Buffer.from('合成');
 const store=createDecisionStore({projectRoot:root,projectId});store.prepareBinding({id:binding,taskId,marker:randomUUID(),pluginProjectId:null});store.bindProject(taskId,plugin);
 const source={projectId,taskId,sourceId:randomUUID(),revision:'1',format:'md' as const,filename:'saved.md',sha256:createHash('sha256').update(content).digest('hex'),bytes:content.length};
 store.saveReport({id,bindingId:binding,source,physicalName:'source-'+id+'.md',pluginReportId:null},content);
 const recipient={provider:'synthetic',model:'codec',configurationSha256:'a'.repeat(64)};
 const scope={report:source,teachSha256:'b'.repeat(64),recipients:[recipient]};let now=1;
 const grant=createDecisionMaterialPolicy(()=>now).grant({...scope,expiresAt:10});
 const auth=createDecisionRuntimeAuthorization(store);const req={kind:'model' as const,projectId:plugin,physicalName:'source-'+id+'.md',sha256:source.sha256,bytes:source.bytes,teachSha256:scope.teachSha256,recipients:[recipient]};
 assert.equal(await auth.authorize(req),false);auth.permit(id,grant);assert.equal(await auth.authorize(req),true);
 for(const changed of [{projectId:randomUUID()},{sha256:'c'.repeat(64)},{teachSha256:'c'.repeat(64)},{recipients:[{...recipient,model:'other'}]}])assert.equal(await auth.authorize({...req,...changed}),false);
 assert.equal(await auth.authorize({...req,kind:'publish'}),true);
 const op=randomUUID();store.begin({id:op,taskId,kind:'feedback',target:'x',requestSha256:'d'.repeat(64),startedAt:'2026-10-17T00:00:00.000Z',state:'pending',result:null});store.settle(op,'unknown',null);
 assert.equal(await auth.authorize(req),false);store.settle(op,'confirmed',{});assert.equal(await auth.authorize(req),true);
 now=10;assert.equal(await auth.authorize(req),false);now=1;assert.equal(await auth.authorize(req),false);
 auth.permit(id,createDecisionMaterialPolicy(()=>1).grant({...scope,expiresAt:10}));auth.revoke(id);assert.equal(await auth.authorize({...req,kind:'publish'}),false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
