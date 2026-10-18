import './no-network.mjs';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {configuredServiceTrial} from './configured-service.mjs';
const directory=process.env.JUANERAI_TEST_EVIDENCE_DIR,resourcesSource=process.env.DR_RESOURCES_ROOT,programRoot=process.env.DR_PROGRAM_ROOT;
if(!directory||!resourcesSource||!programRoot)throw Error('EXPLICIT_SYNTHETIC_PATHS_REQUIRED');
const f=await configuredServiceTrial({directory,resourcesSource,programRoot});
writeFileSync(join(directory,'runtime.json'),JSON.stringify({pid:process.pid,origin:f.service.origin,root:f.root,resources:f.resources,projectId:f.projectId,taskId:f.taskId,version:f.version,synthetic:true},null,2)+'\n');
console.log(JSON.stringify({url:await f.browserUrl(),projectId:f.projectId,taskId:f.taskId}));
// A fresh one-use URL keeps manual browser checks within the service's 60s TTL.
process.stdin.on('data',chunk=>{if(chunk.toString().trim()==='open')void f.browserUrl().then(url=>console.log(JSON.stringify({url})));});
process.on('SIGTERM',()=>{void f.service.close().then(()=>process.exit(0),error=>{console.error(error.message);process.exitCode=1;});});
