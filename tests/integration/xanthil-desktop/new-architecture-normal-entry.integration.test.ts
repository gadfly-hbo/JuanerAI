import {offlineCredentials} from '../../fixtures/xanthil-desktop/offline-professional-provider.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {startIndependentBrowserService} from '../../../apps/browser/service-main.ts';

test('D01/D07 normal HTTP entry starts one new authorized task and actually loads fixed C; passive reads send nothing',{timeout:30000},async t=>{
 const root=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'h-')),resources=join(root,'r'),profile=join(root,'p');mkdirSync(resources);
 writeFileSync(join(resources,'toolchain-deployment.json'),readFileSync('build/xanthil-toolchain-deployment.json'));
 const helper=join(resources,'must-never-run');writeFileSync(helper,'#!/bin/sh\nexit 97\n',{mode:0o700});
 let calls=0,credentials=0,authorized=0;const dtos:unknown[]=[];
 const opts:NonNullable<Parameters<typeof startIndependentBrowserService>[1]>={analysisModel:'mimo-v2.6-flash' as const,deployment:{resourcesRoot:realpathSync(resources),credentialHelper:helper},providerAccess:{
  authorizeModelUse:async()=>{authorized++;},credentials:{withCredential:async(provider,run)=>{credentials++;return offlineCredentials.withCredential(provider,run);}},
  fetch:async(_url:unknown,init?:RequestInit)=>{calls++;const dto=JSON.parse(String(init!.body));dtos.push(dto);assert.equal(dto.model,calls===1?'mimo-v2.6-flash':'mimo-v2.6-pro');assert.equal(dto.max_tokens??dto.max_completion_tokens,32768);if(calls===2)await new Promise(resolve=>setTimeout(resolve,750));return new Response('data: '+JSON.stringify({id:'offline',object:'chat.completion.chunk',choices:[{index:0,delta:{role:'assistant',content:'仅合成会话，未计算、未核验、不形成正式决定。'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:2,total_tokens:5}})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});},
 }};
 let server:Awaited<ReturnType<typeof startIndependentBrowserService>>|undefined,release:(()=>void)|undefined;
 try{
  server=await startIndependentBrowserService(profile,opts);assert.equal(calls,0);assert.equal(credentials,0);
  const allow=Reflect.get(globalThis,Symbol.for('Mini.D006.ownedLoopback'));assert.equal(typeof allow,'function');release=allow(server.origin);
  await assert.rejects(()=>fetch('https://provider.invalid/'),{code:'OFFLINE_NETWORK_DENIED'});
  const token=new URL(await server.open()).hash.slice(1),boot=await fetch(server.origin+'/v1/bootstrap',{method:'POST',headers:{origin:server.origin,'content-type':'application/json'},body:JSON.stringify({token})});assert.equal(boot.status,200);
  const headers:Record<string,string>={cookie:boot.headers.get('set-cookie')!.split(';')[0]!,origin:server.origin,'content-type':'application/json'};
  const request=async(path:string,body?:unknown)=>{const r=await fetch(server!.origin+path,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});assert.equal(r.status,200,path+': '+(r.status===200?'':await r.text()));return r.json();};
  const generation=(await request('/v1/session')).generation,control=await request('/v1/control',{version:'1.0',command_id:randomUUID(),confirmed:true,generation});headers['x-xanthil-control']=control.control;
  const selected=await request('/v1/projects/select',{version:'1.0',command_id:randomUUID(),name:'D006 synthetic'});headers['x-xanthil-control']=selected.control;
  const id=randomUUID();await request('/v1/open-analysis',{version:'1.0',command_id:id,question:'这只是合成会话，说明尚未提供业务资料。',confirmed:true,sources:[]});
  let task=await request('/v1/open-analysis/'+id);while(['ready','running'].includes(task.state)){t.signal.throwIfAborted();await new Promise(r=>setTimeout(r,5));task=await request('/v1/open-analysis/'+id);}
  assert.equal(calls,2,'normal analysis and report formation each reach their fixed purpose');assert.equal(task.state,'saved');assert.equal(task.model_report.verification,'not_performed');assert.equal(task.outcome,null);
  const entry=fileURLToPath(import.meta.resolve('pi-agent-runtime')),bytes=readFileSync(entry);assert.equal(bytes.length,57763);assert.equal(createHash('sha256').update(bytes).digest('hex'),'64937a8b562e815ad0b3084e3725a04223e88f1a84e53d94967c2eba4757f42d');
  const before=calls;await request('/v1/open-analysis');await request('/v1/open-analysis/'+id);assert.equal(calls,before);
  writeFileSync(join(root,'NORMAL-ENTRY-RESULT.json'),JSON.stringify({pid:process.pid,origin:server.origin,root,entry,realpath:realpathSync(entry),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),calls,credentials,authorized,task,dtos},null,2));
 }finally{await server?.close();release?.();}
});


for(const scenario of [{selected:'MiniMax-M3',policy:false},{selected:'deepseek-flash',policy:false},{selected:'deepseek-flash',policy:true}] as const)test('D07/NE01 actual normal npm entry child uses v2 deployment, fixed C and same-source frontend; only owned lifecycle '+scenario.selected+(scenario.policy?' policy5/3':''),{timeout:30000},async t=>{
 const selected=scenario.selected;
 const {execFile}=await import('node:child_process'),{promisify}=await import('node:util');
 const base=mkdtempSync(join(process.env.JUANERAI_NEWARCH_SHORT_ROOT!,'launch-')),root=join(base,'p'),config=join(base,'launch.json'),invoke=promisify(execFile),fixture=fileURLToPath(new URL('../../fixtures/xanthil-desktop/normal-entry-offline.mjs',import.meta.url));
 writeFileSync(config,JSON.stringify({version:'2.0',profile_root:root,analysis:{analysisModel:selected,judgmentReviewAllowed:true,...(scenario.policy?{toolCorrectionLimit:5,modelRecoveryLimit:3}:{})}}));
 const env:NodeJS.ProcessEnv={...process.env,JUANERAI_DESKTOP_DEV_ROOT:root,JUANERAI_BROWSER_CONFIG:config,...(selected==='deepseek-flash'?{DEEPSEEK_API_KEY:'synthetic-offline-only'}:{})};delete env.NODE_OPTIONS;
 const entry=(action:string)=>invoke(process.execPath,['--import',fixture,'tools/browser/entry.mjs',action,'--no-open'],{env,timeout:20000});
 let release:(()=>void)|undefined,owned=false;
 try{
  const result=await entry('start');owned=true;assert.match(result.stdout,/本机网页服务/);
  const record=JSON.parse(readFileSync(join(root,'user-data/web-service/service.json'),'utf8')),allow=Reflect.get(globalThis,Symbol.for('Mini.D006.ownedLoopback'));release=allow(record.origin);
  const opened=await fetch(record.origin+'/v1/service/open',{method:'POST',headers:{'content-type':'application/json','x-xanthil-service':record.credential},body:'{}'});assert.equal(opened.status,200);
  const boot=await fetch(record.origin+'/v1/bootstrap',{method:'POST',headers:{origin:record.origin,'content-type':'application/json'},body:JSON.stringify({token:(await opened.json()).token})});assert.equal(boot.status,200);const headers:Record<string,string>={cookie:boot.headers.get('set-cookie')!.split(';')[0]!,origin:record.origin,'content-type':'application/json'};
  const request=async(path:string,body?:unknown)=>{const r=await fetch(record.origin+path,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});assert.equal(r.status,200,path+': '+(r.status===200?'':await r.text()));return r.json();};
  const generation=(await request('/v1/session')).generation;headers['x-xanthil-control']=(await request('/v1/control',{version:'1.0',command_id:randomUUID(),confirmed:true,generation})).control;
  headers['x-xanthil-control']=(await request('/v1/projects/select',{version:'1.0',command_id:randomUUID(),name:'D006 owned launcher'})).control;
  const id=randomUUID();await request('/v1/open-analysis',{version:'1.0',command_id:id,question:'合成入口，只解释尚未提供的资料，不作计算。',confirmed:true,sources:[]});let task=await request('/v1/open-analysis/'+id);while(['ready','running'].includes(task.state)){t.signal.throwIfAborted();await new Promise(r=>setTimeout(r,10));task=await request('/v1/open-analysis/'+id);}assert.equal(task.state,'saved');
  const dtos=readFileSync(join(root,'synthetic-provider.jsonl'),'utf8').trim().split('\n').map(s=>JSON.parse(s));assert.equal(dtos.length,scenario.policy?10:2);assert.deepEqual(dtos.map(d=>d.body.model),[...Array(scenario.policy?9:1).fill(selected),selected==='deepseek-flash'?selected:'mimo-v2.6-pro']);assert.ok(dtos.every(d=>(d.body.max_tokens??d.body.max_completion_tokens)===32768));assert.ok(dtos.every(d=>(d.body.tools??[]).every((t:any)=>['read','write','edit','bash'].includes(t.function?.name??t.name))));assert.equal(task.model_report.verification,'not_performed');assert.equal(task.outcome,null);
  if(selected==='deepseek-flash'){assert.equal(dtos[0].url,'https://api.deepseek.com/chat/completions');assert.deepEqual(dtos[0].body.thinking,{type:'disabled'});assert.ok(!JSON.stringify(dtos).includes('synthetic-offline-only'));}
  const version=await request('/v1/workbench-version');assert.notEqual(version.pid,process.pid);const frontend=await fetch(record.origin+'/workspace.mjs',{headers});assert.equal(await frontend.text(),readFileSync('apps/browser/workspace.mjs','utf8'));
  writeFileSync(join(base,'NORMAL-LAUNCH-RESULT.json'),JSON.stringify({pid:version.pid,origin:record.origin,root,config,version,task,dtos},null,2));await entry('status');
 }finally{if(owned)await entry('stop');release?.();}
});
