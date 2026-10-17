import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,realpath,lstat,readdir,copyFile,chmod} from 'node:fs/promises';
import {join,relative,isAbsolute,resolve} from 'node:path';
import {verifyDecisionMaterials,loadDecisionResourceBundle} from '../../adapters/decision-platform/materials.ts';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=()=>{throw Error('DP_FIXED_IDENTITY');};
/** Offline preparation only. No install, credential discovery, network or activation. */
export async function prepareLocalDecisionResources({inputManifestPath,inputManifestSha256,output}){
 const inputBytes=await readFile(inputManifestPath);if(sha(inputBytes)!==inputManifestSha256)fail();
 const input=JSON.parse(inputBytes);
 if(input.sourceCommit!=='c11f8da8d8db3b2d5ae2424941a24307471ad972'||input.platform!==process.platform||input.arch!==process.arch)fail();
 await verifyDecisionMaterials([input.program,input.dependencies]);
 for(const name of ['entry.mjs','plugin.mjs','history.mjs']){
  const stat=await lstat(join(input.program.root,name));
  if(!stat.isFile()||stat.isSymbolicLink())fail();
 }
 for(const f of input.fixedFiles){const s=await lstat(f.path);if(!s.isFile()||s.isSymbolicLink()||s.size!==f.bytes||(s.mode&0o777)!==f.mode||sha(await readFile(f.path))!==f.sha256)fail();}
 if(!isAbsolute(output)||resolve(output)!==output)fail();
 // Validate every dependency link before creating the new candidate; never follow an external install.
 async function checkLinks(dir){for(const name of await readdir(dir)){const p=join(dir,name),s=await lstat(p);if(s.isDirectory())await checkLinks(p);else if(s.isSymbolicLink()){
  const real=await realpath(p),rel=relative(input.dependencies.root,real);if(!rel||rel.startsWith('../')||isAbsolute(rel)||!(await lstat(real)).isFile())fail();
 }else if(!s.isFile())fail();}}
 await checkLinks(input.dependencies.root);
 await mkdir(output);await mkdir(join(output,'bin'));await mkdir(join(output,'program'));await mkdir(join(output,'provenance'));
 async function copy(source,target){await copyFile(source,target);await chmod(target,(await lstat(await realpath(source))).mode&0o777);}
 for(const name of ['entry.mjs','plugin.mjs','history.mjs'])await copy(join(input.program.root,name),join(output,'program',name));
 const file=role=>{const f=input.fixedFiles.filter(f=>f.role===role);if(f.length!==1)fail();return f[0].path;};
 await copy(file('node'),join(output,'bin/node'));await copy(file('node-license'),join(output,'provenance/NODE-LICENSE'));
 for(const [role,target] of [['plugin-package','plugin-package.json'],['plugin-lock','plugin-package-lock.json'],['source-receipt','source-receipt.json']])await copy(file(role),join(output,'provenance',target));
 async function tree(source,target){await mkdir(target);for(const name of await readdir(source)){const s=join(source,name),t=join(target,name);if((await lstat(s)).isDirectory())await tree(s,t);else await copy(s,t);}}
 await tree(input.dependencies.root,join(output,'program/node_modules'));
 await writeFile(join(output,'provenance/models.json'),JSON.stringify(input.models),{mode:0o644,flag:'wx'});
 const files=[],packages=[],notices=['provenance/NODE-LICENSE'];
 async function inventory(dir){for(const name of (await readdir(dir)).sort()){const p=join(dir,name),s=await lstat(p);if(s.isDirectory())await inventory(p);else{
  if(!s.isFile()||s.isSymbolicLink())fail();const bytes=await readFile(p),path=relative(output,p);files.push({path,bytes:bytes.length,mode:s.mode&0o777,sha256:sha(bytes)});
  if(/^(license|licence|notice|copying|third_party_notices)/i.test(name))notices.push(path);
  if(name==='package.json'){const j=JSON.parse(bytes);packages.push({path,name:j.name??null,version:j.version??null,license:j.license??'UNKNOWN'});}
 }}}
 await inventory(output);
 const noticeBytes=Buffer.from(JSON.stringify({scope:'Local synthetic preparation only; not distribution approval or legal clearance.',pluginLicense:'UNKNOWN: fixed private source has no license declaration or root license file.',nodeLicense:'provenance/NODE-LICENSE',packages,notices:[...new Set(notices)].sort()},null,2));
 await writeFile(join(output,'notices.json'),noticeBytes,{mode:0o644,flag:'wx'});files.push({path:'notices.json',bytes:noticeBytes.length,mode:0o644,sha256:sha(noticeBytes)});
 const manifest={format:'juanerai-decision-resources-local-v1',mode:'synthetic',sourceCommit:input.sourceCommit,platform:process.platform,arch:process.arch,files:files.sort((a,b)=>a.path.localeCompare(b.path))};
 const bytes=Buffer.from(JSON.stringify(manifest,null,2));await writeFile(join(output,'resources.json'),bytes,{mode:0o644,flag:'wx'});
 const digest=sha(bytes);await loadDecisionResourceBundle(output,digest);
 return {root:output,manifestSha256:digest,files:files.length,inputManifestSha256,sourceCommit:input.sourceCommit,noticeCount:new Set(notices).size};
}
