// Bounded, self-terminating synthetic child processes in owned temporary roots.
// No Provider, downloads, user shell profile or existing service process.
import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,realpath,writeFile,readFile,access,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const {createNetworkExecutionEnvironment}=await import(pathToFileURL(join(root,'dist/agent/exec-env.js')).href);
test('RS-LIFECYCLE-01 aborting an owned Bash tool settles its child group before physical success',async t=>{
 const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-owned-exec-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'child.mjs'),"import {writeFileSync} from 'node:fs';process.on('SIGTERM',()=>{});writeFileSync('ready','synthetic');setTimeout(()=>{writeFileSync('late-write','unexpected after stop');process.exit(0);},250);");
 const env=await createNetworkExecutionEnvironment({root:dir,policyVersion:'synthetic'}),controller=new AbortController(),result=env.exec('node child.mjs & wait',controller.signal);
 for(let i=0;i<100;i++){try{await access(join(dir,'ready'));break;}catch{await new Promise(r=>setTimeout(r,5));}}await access(join(dir,'ready'));controller.abort();await result;
 await new Promise(r=>setTimeout(r,350));await assert.rejects(()=>readFile(join(dir,'late-write')),{code:'ENOENT'});
});
test('RS-LIFECYCLE-01 render_deck cancellation stops its owned Node before late file writes',async t=>{
 const {mkdir}=await import('node:fs/promises'),{renderDeckTool}=await import(pathToFileURL(join(root,'dist/agent/tools/render-deck-tool.js')).href);
 const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-owned-render-')));t.after(()=>rm(dir,{recursive:true,force:true}));await mkdir(join(dir,'deck'));
 await writeFile(join(dir,'deck','deck.mjs'),"import {writeFileSync} from 'node:fs';process.on('SIGTERM',()=>{});writeFileSync('ready','synthetic');setTimeout(()=>{writeFileSync('late-write','unexpected after stop');process.exit(0);},250);");
 const controller=new AbortController(),result=renderDeckTool(dir).execute({},controller.signal,{});
 for(let i=0;i<100;i++){try{await access(join(dir,'ready'));break;}catch{await new Promise(r=>setTimeout(r,5));}}await access(join(dir,'ready'));controller.abort();assert.equal((await result).ok,false);await new Promise(r=>setTimeout(r,350));await assert.rejects(()=>readFile(join(dir,'late-write')),{code:'ENOENT'});
});
test('RS-LIFECYCLE-01 bounded Bash timeout terminates its group and is not user-stop success',async t=>{
 const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-owned-timeout-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 await writeFile(join(dir,'child.mjs'),"import {writeFileSync} from 'node:fs';setTimeout(()=>{writeFileSync('late-write','unexpected after timeout');process.exit(0);},250);");
 const env=await createNetworkExecutionEnvironment({root:dir,policyVersion:'synthetic',execTimeoutMs:60});const result=await env.exec('node child.mjs & wait',new AbortController().signal);assert.equal(result.exitCode,124);await new Promise(r=>setTimeout(r,350));await assert.rejects(()=>readFile(join(dir,'late-write')),{code:'ENOENT'});
});
