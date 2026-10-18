import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,realpathSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createResearchProcess} from '../../../adapters/deep-research/process.mjs';
import {createResearchGateway} from '../../../adapters/deep-research/gateway.mjs';
import {createResearchCopies} from '../../../adapters/deep-research/copies.mjs';
import {sha256} from '../../../adapters/deep-research/bundle.mjs';
const programRoot=process.env.DR_BUNDLE_ROOT;
test('DR R01/R05/R06/C01/C03: owned child, task isolation, durable copies survive shutdown',{skip:!programRoot},async t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dr-child-'))),manifestSha256=sha256(readFileSync(join(programRoot,'manifest.json')));
 const make=name=>createResearchProcess({programRoot,manifestSha256,dataRoot:join(root,name),fixtureModule:fileURLToPath(new URL('../../fixtures/deep-research/adapters.mjs',import.meta.url)),authorize:async()=>true});
 const process=make('a'),other=make('b');t.after(async()=>{await process.close();await other.close();});
 const launches=await Promise.all([process.launch(),process.launch()]);assert.equal(new URL(launches[0]).origin,new URL(launches[1]).origin);assert.notEqual(launches[0],launches[1]);
 const json=async(path,body)=>JSON.parse(Buffer.from((await process.api(path,body)).bytes));
 const p=await json('/api/projects',{module:'industry',goal:'仅合成',scope:{summary:'s',queries:[]}});const path='/api/projects/'+p.id;
 assert.deepEqual(JSON.parse(Buffer.from((await other.api('/api/projects')).bytes)).projects,[]);
 await json(path+'/runs',{request:{id:'req-owned',module:'industry',goal:'合成',scope:{summary:'s',queries:[]}}});
 const wait=async predicate=>{for(let i=0;i<100;i++){const r=(await json(path)).runs[0];if(predicate(r))return r;await new Promise(r=>setTimeout(r,25));}throw Error('pipeline did not reach gate');};
 for(const kind of ['plan','outline']){const r=await wait(r=>r?.gate?.kind===kind&&r.status==='awaiting-confirmation');const gate=await json(path+`/runs/${r.id}/gate`);await json(path+`/runs/${r.id}/gate/confirm`,{payload:gate.payload});}
 const r=await wait(r=>['published','limited'].includes(r?.status));await json(path+'/publish',{runId:r.id});
 const gateway=createResearchGateway({process,programRoot}),versions=await gateway.published();assert.equal(versions.length,1);
 const output=await gateway.export(versions[0]);const taskId=randomUUID(),copies=createResearchCopies({root:join(root,'copies'),taskId});
 const commandId=randomUUID(),copy=copies.save(commandId,versions[0],output);assert.equal(copies.receipt(commandId).id,copy.id);assert.deepEqual(copies.read(copy.id).bytes,Buffer.from(output.bytes));
 const again=copies.save(randomUUID(),versions[0],await gateway.export(versions[0]));assert.equal(again.id,copy.id);assert.equal(copies.list().length,1);
 const formal=await json(path+'/versions/1/formal',{});assert.equal(formal.version,1);assert.ok(formal.formats.includes('pptx'));
 const revisedOutput=await gateway.export(versions[0]);assert.notEqual(revisedOutput.contentSha256,output.contentSha256);
 const revised=copies.save(randomUUID(),versions[0],revisedOutput);assert.notEqual(revised.id,copy.id);assert.equal(copies.list().length,2);assert.deepEqual(copies.read(copy.id).bytes,Buffer.from(output.bytes));
 const childOrigin=new URL(launches[0]).origin;await process.close();
 await assert.rejects(fetch(childOrigin));await assert.rejects(process.launch(),/UNAVAILABLE/);
 assert.deepEqual(createResearchCopies({root:join(root,'copies'),taskId}).read(copy.id).bytes,Buffer.from(output.bytes));
});

test('DR C05: only named credentials enter an owned child',()=>{
 for(const credentialEnvironment of [{NODE_OPTIONS:'--import evil.mjs'},{HOME:'/unapproved'},{OPENAI_API_KEY:'bad\0value'},{OPENAI_API_KEY:1}])assert.throws(()=>createResearchProcess({credentialEnvironment}),/ENVIRONMENT_DENIED/);
});
