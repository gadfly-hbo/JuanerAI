import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson} from '../../../apps/browser/read-json.mjs';
import {createWorkspaceClient} from '../../../apps/browser/client.mjs';
import {createQuickAnalysisClient} from '../../../apps/browser/quick-analysis-client.mjs';

test('P0-02: both consumers retain their GET options and visible HTTP failure messages',async()=>{
 for(const [create,call,path,headers,message] of [
  [createWorkspaceClient,c=>c.list(),'/v1/tasks',undefined,'暂时无法打开，请稍后重试。'],
  [createQuickAnalysisClient,c=>c.list(),'/v1/open-analysis',{'x-xanthil-view':'browser-v1'},'暂时无法打开，资料和已有结果仍保留，请稍后重试。']
 ]){
  const requests=[],payload=[];
  const client=create({request:async(p,options)=>{requests.push([p,options]);return {ok:true,json:async()=>payload};}});
  assert.equal(await call(client),payload);
  assert.deepEqual(requests,[[path,{credentials:'same-origin',cache:'no-store',...(headers?{headers}:{})}]]);
  let count=0;
  const failure=create({request:async()=>{count++;return {ok:false,json:()=>assert.fail('HTTP failure is not success JSON')};}});
  await assert.rejects(()=>call(failure),{message});assert.equal(count,1,'no retry');
 }
});

test('P0-02: network and parse failures remain failures, without retry or mutation',async()=>{
 for(const create of [createWorkspaceClient,createQuickAnalysisClient]){
  for(const parse of [false,true]){
   const failure=new Error(parse?'synthetic parse failure':'synthetic transport failure');let count=0;
   const client=create({request:async()=>{count++;if(!parse)throw failure;return {ok:true,json:async()=>{throw failure;}};}});
   await assert.rejects(()=>client.list(),error=>error===failure);assert.equal(count,1);
  }
 }
});

test('P0-02: shared leaf parses one successful GET, preserves caller options and does not add operation identity',async()=>{
 const headers={'x-xanthil-view':'browser-v1'},options={headers},value={state:'unknown'};let count=0;
 const result=await readJson(async(path,input)=>{count++;assert.equal(path,'/synthetic');assert.deepEqual(input,{credentials:'same-origin',cache:'no-store',headers});return {ok:true,json:async()=>value};},'/synthetic','failure',options);
 assert.equal(result,value);assert.equal(count,1);assert.deepEqual(options,{headers});
});
