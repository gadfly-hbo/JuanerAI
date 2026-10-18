import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,cpSync,constants,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {startIndependentBrowserService} from '../../../apps/browser/service-main.ts';
import {createResearchServer} from '../../../adapters/deep-research/server.mjs';
import {syntheticAdapters} from './adapters.mjs';

/** Real deployment descriptor/service/project/task path; only preloaded research is synthetic. */
export async function configuredServiceTrial({directory,resourcesSource,programRoot,seed=true,badManifest=false}){
 mkdirSync(directory,{recursive:true});directory=realpathSync(directory);const resources=join(directory,'resources'),root=join(directory,'workspace');
 cpSync(resourcesSource,resources,{recursive:true,mode:constants.COPYFILE_FICLONE});
 const python=process.env.DR_PYTHON,duckdb=process.env.DR_DUCKDB;if(!python||!duckdb)throw Error('EXPLICIT_SYNTHETIC_TOOLCHAIN_REQUIRED');
 writeFileSync(join(resources,'toolchain-deployment.json'),JSON.stringify({schema_version:'1.0',python:{executable_path:python,version:'3.14.4'},duckdb:{executable_path:duckdb,version:'1.5.2'}}));
 const helper=join(directory,'deny-credentials');writeFileSync(helper,'#!/bin/sh\necho CREDENTIAL_ACCESS_FORBIDDEN >&2\nexit 91\n',{mode:0o700});
 if(badManifest){const file=join(resources,'deep-research-deployment.json'),descriptor=JSON.parse(readFileSync(file));writeFileSync(file,JSON.stringify({...descriptor,manifestSha256:'0'.repeat(64)}));}
 const service=await startIndependentBrowserService(root,{deployment:{resourcesRoot:resources,credentialHelper:helper}});
 let cookie,control;const call=(path,body)=>fetch(service.origin+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{cookie}:{}),...(body===undefined?{}:{origin:service.origin,'content-type':'application/json',...(control?{'x-xanthil-control':control}:{})})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 try{
  const url=new URL(await service.open()),boot=await call('/v1/bootstrap',{token:url.hash.slice(1)});assert.equal(boot.status,200);cookie=boot.headers.get('set-cookie').split(';')[0];
  const projectCommand=randomUUID(),selected=await call('/v1/projects/select',{version:'1.0',command_id:projectCommand,name:'正常入口合成研究'});assert.equal(selected.status,200);const selectedBody=await selected.json();control=selectedBody.control;const projectId=selectedBody.project.project_id,taskId=randomUUID();
  const created=await call('/v1/open-analysis',{version:'1.0',command_id:taskId,question:'合成研究入口验证',confirmed:true,mode:'requirements',sources:[]});assert.equal(created.status,200);assert.equal((await created.json()).identity.task_id,taskId);
  const base=`/v1/deep-research/projects/${projectId}/tasks/${taskId}`,projectRoot=join(root,'Projects',projectCommand);
  let version;
  if(seed){
   // Before the normal service first opens research, prepare an offline result
   // with the original pipeline and both original confirmation gates.
   const dataRoot=join(projectRoot,'.juanerai/deep-research',taskId,'workspace'),ownerToken=randomBytes(32).toString('hex');
   const preparer=await createResearchServer({programRoot,dataRoot,ownerToken,authorize:async()=>true,makeAdapters:()=>syntheticAdapters(programRoot)});
   try{
    const api=async(path,body)=>{const r=await fetch(preparer.origin+path,{method:body===undefined?'GET':'POST',headers:{'x-research-owner':ownerToken,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});assert.equal(r.status,200);return r.json();};
    const p=await api('/api/projects',{module:'industry',goal:'正常服务入口合成结果',scope:{summary:'s',queries:[]}}),path='/api/projects/'+p.id;
    await api(path+'/runs',{request:{id:'req-configured',module:'industry',goal:'合成',scope:{summary:'s',queries:[]}}});
    const wait=async predicate=>{for(let i=0;i<100;i++){const r=(await api(path)).runs[0];if(predicate(r))return r;await new Promise(r=>setTimeout(r,25));}throw Error('SYNTHETIC_GATE_TIMEOUT');};
    for(const kind of ['plan','outline']){const r=await wait(r=>r?.status==='awaiting-confirmation'&&r.gate?.kind===kind),gate=await api(path+`/runs/${r.id}/gate`);await api(path+`/runs/${r.id}/gate/confirm`,{payload:gate.payload});}
    const run=await wait(r=>['limited','published'].includes(r?.status));await api(path+'/publish',{runId:run.id});version={projectId:p.id,runId:run.id,version:1};
   }finally{await preparer.close();}
  }
  return {service,call,root,resources,base,projectId,taskId,projectRoot,version,async browserUrl(){return service.open();}};
 }catch(error){await service.close();throw error;}
}
