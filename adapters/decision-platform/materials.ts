import {createHash} from 'node:crypto';
import {lstat,readFile,realpath,readdir,access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
export type DecisionMaterialFile={path:string;sha256:string;bytes:number;mode:number;link?:string};
/** Private local synthetic resource consumer. The manifest digest comes from the trusted host,
 * never from a manifest's self-declared hash. No discovery or fallback to a developer install. */
export async function loadDecisionResourceBundle(root:string,manifestSha256:string){
 const reject=()=>{throw Error('DP_FIXED_IDENTITY');};
 async function verify(){
  try{
   if(!isAbsolute(root)||resolve(root)!==root||await realpath(root)!==root||!/^[a-f0-9]{64}$/.test(manifestSha256))reject();
   const path=join(root,'resources.json'),stat=await lstat(path);
   if(!stat.isFile()||stat.isSymbolicLink())reject();
   const bytes=await readFile(path);if(createHash('sha256').update(bytes).digest('hex')!==manifestSha256)reject();
   const value=JSON.parse(bytes.toString());
   if(value.format!=='juanerai-decision-resources-local-v1'||value.mode!=='synthetic'
    ||value.sourceCommit!=='c11f8da8d8db3b2d5ae2424941a24307471ad972'
    ||value.platform!==process.platform||value.arch!==process.arch||!Array.isArray(value.files))reject();
   for(const f of value.files){
    if(!f||typeof f.path!=='string'||f.path==='resources.json'||f.path.includes('\\')
     ||f.path.split('/').some((part:string)=>!part||part==='.'||part==='..')||isAbsolute(f.path)
     ||Object.hasOwn(f,'link')||!Number.isSafeInteger(f.bytes)||f.bytes<0
     ||!Number.isSafeInteger(f.mode)||f.mode<0||f.mode>0o777||! /^[a-f0-9]{64}$/.test(f.sha256))reject();
   }
   const files=value.files as DecisionMaterialFile[];
   for(const path of ['bin/node','program/entry.mjs','program/plugin.mjs','program/history.mjs','notices.json']){
    const f=files.find(f=>f.path===path);if(!f||path==='bin/node'&&(f.mode&0o111)===0)reject();
   }
   await verifyDecisionMaterials([{root,files:[...files,{path:'resources.json',bytes:bytes.length,mode:stat.mode&0o777,sha256:manifestSha256}]}]);
   await access(join(root,'bin/node'),constants.X_OK);
   return {files,sourceCommit:value.sourceCommit as string};
  }catch{throw Error('DP_FIXED_IDENTITY');}
 }
 const value=await verify(),fixed=(path:string)=>({path:join(root,path),sha256:value.files.find(f=>f.path===path)!.sha256});
 return {node:fixed('bin/node'),entry:fixed('program/entry.mjs'),programRoot:join(root,'program'),historyPath:join(root,'program/history.mjs'),sourceCommit:value.sourceCommit,verifyMaterials:async()=>{await verify();}};
}
/** Exhaustive trusted manifest, not a version-string check. Development roots remain explicit. */
export async function verifyDecisionMaterials(roots:readonly {root:string;files:readonly DecisionMaterialFile[]}[]){
 for(const material of roots){
  const root=material.root;if(!isAbsolute(root)||resolve(root)!==root||await realpath(root)!==root)throw Error('DP_FIXED_IDENTITY');
  const expected=new Map(material.files.map(f=>[f.path,f]));if(expected.size!==material.files.length)throw Error('DP_FIXED_IDENTITY');
  async function walk(path:string):Promise<void>{for(const name of await readdir(path)){
   const full=join(path,name),stat=await lstat(full),rel=relative(root,full);
   if(stat.isDirectory()){await walk(full);continue;}
   const f=expected.get(rel);if(!f||rel.startsWith('../')||isAbsolute(rel))throw Error('DP_FIXED_IDENTITY');expected.delete(rel);
   if(f.link!==undefined){if(!stat.isSymbolicLink()||await realpath(full)!==f.link)throw Error('DP_FIXED_IDENTITY');continue;}
   if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==f.bytes||(stat.mode&0o777)!==f.mode||createHash('sha256').update(await readFile(full)).digest('hex')!==f.sha256)throw Error('DP_FIXED_IDENTITY');
  }}
  await walk(root);if(expected.size)throw Error('DP_FIXED_IDENTITY');
 }
}
