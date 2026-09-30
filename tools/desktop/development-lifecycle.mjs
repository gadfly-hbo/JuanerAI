import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,isAbsolute,resolve} from 'node:path';
import {connect} from 'node:net';
const root=process.env.JUANERAI_DEV_EVIDENCE;assert.ok(root&&isAbsolute(root));await mkdir(root);
const reachable=()=>new Promise(resolve=>{const s=connect({host:'127.0.0.1',port:5173});s.once('connect',()=>{s.destroy();resolve(true);});s.once('error',()=>resolve(false));});
assert.equal(await reachable(),false,'do not touch an already running development server');
const runs=[];
for(let attempt=1;attempt<=2;attempt++){
 const child=spawn(process.execPath,[resolve('tools/desktop/development-start.mjs')],{env:{...process.env,JUANERAI_DESKTOP_DEV_ROOT:join(root,'development')},stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',b=>{stdout+=b;});child.stderr.on('data',b=>{stderr+=b;});
 const exited=new Promise(resolve=>child.on('exit',(code,signal)=>resolve({code,signal})));
 try{
  for(let i=0;i<300 && !await reachable();i++){assert.equal(child.exitCode,null,'startup child exited early');assert.equal(child.signalCode,null);await new Promise(r=>setTimeout(r,100));}
  assert.equal(await reachable(),true);await new Promise(r=>setTimeout(r,3000));assert.equal(child.exitCode,null,'Forge/Electron remain active');assert.equal(child.signalCode,null);
  child.kill('SIGINT');const result=await Promise.race([exited,new Promise((_,reject)=>setTimeout(()=>reject(Error('owned launcher did not stop')),10000))]);
  assert.equal(await reachable(),false,'owned port must be released');runs.push({attempt,pid:child.pid,result,portReleased:true});
 }finally{
  if(child.exitCode===null)child.kill('SIGTERM');await writeFile(join(root,`start-${attempt}.stdout`),stdout,{flag:'wx'});await writeFile(join(root,`start-${attempt}.stderr`),stderr,{flag:'wx'});
 }
}
await writeFile(join(root,'result.json'),JSON.stringify({result:'PASS',runs},null,2));
