import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,realpathSync,writeFileSync,lstatSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {verifyDecisionMaterials} from '../../../adapters/decision-platform/materials.ts';
test('DP-LIFE-05 exhaustive fixed material list rejects changed, missing and extra bytes',async()=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'dp-materials-'))),file=join(root,'entry.mjs');
 try{writeFileSync(file,'synthetic');const material={root,files:[{path:'entry.mjs',bytes:9,mode:lstatSync(file).mode&0o777,sha256:createHash('sha256').update('synthetic').digest('hex')}]};await verifyDecisionMaterials([material]);writeFileSync(join(root,'extra'),'unexpected');await assert.rejects(verifyDecisionMaterials([material]),/DP_FIXED_IDENTITY/);rmSync(join(root,'extra'));writeFileSync(file,'changed');await assert.rejects(verifyDecisionMaterials([material]),/DP_FIXED_IDENTITY/);rmSync(file);await assert.rejects(verifyDecisionMaterials([material]),/DP_FIXED_IDENTITY/);}finally{rmSync(root,{recursive:true,force:true});}
});

// DP08/C01/C02: trusted, relocatable resources must fail closed before import/spawn.
import {mkdirSync,renameSync,chmodSync,symlinkSync,readFileSync,existsSync} from 'node:fs';
import {loadDecisionResourceBundle} from '../../../adapters/decision-platform/materials.ts';
test('DP-RES-01 relocatable bundle preserves fixed identity and rejects incomplete or developer resources',async()=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'dp-resources-')));let root=join(parent,'original');mkdirSync(root);mkdirSync(join(root,'bin'));mkdirSync(join(root,'program'));
 const sha=(s:string)=>createHash('sha256').update(s).digest('hex'),names=['bin/node','program/entry.mjs','program/plugin.mjs','program/history.mjs','notices.json'];
 const files=names.map(path=>{writeFileSync(join(root,path),'synthetic');chmodSync(join(root,path),path==='bin/node'?0o755:0o644);return {path,bytes:9,mode:path==='bin/node'?0o755:0o644,sha256:sha('synthetic')};});
 const base={format:'juanerai-decision-resources-local-v1',mode:'synthetic',sourceCommit:'c11f8da8d8db3b2d5ae2424941a24307471ad972',platform:process.platform,arch:process.arch,files};
 const manifest=(value:unknown=base)=>{const text=JSON.stringify(value);writeFileSync(join(root,'resources.json'),text);return sha(text);};
 try{
  const hash=manifest(),old=await loadDecisionResourceBundle(root,hash);assert.equal(old.node.path,join(root,'bin/node'));await old.verifyMaterials();
  renameSync(root,join(parent,'moved'));root=join(parent,'moved');const moved=await loadDecisionResourceBundle(root,hash);assert.equal(moved.entry.path,join(root,'program/entry.mjs'));assert.equal(moved.historyPath,join(root,'program/history.mjs'));await moved.verifyMaterials();
  for(const path of names){const full=join(root,path);renameSync(full,full+'.saved');await assert.rejects(loadDecisionResourceBundle(root,hash),/DP_FIXED_IDENTITY/);renameSync(full+'.saved',full);}
  writeFileSync(join(root,'program/entry.mjs'),'tampered!');await assert.rejects(moved.verifyMaterials(),/DP_FIXED_IDENTITY/);writeFileSync(join(root,'program/entry.mjs'),'synthetic');
  chmodSync(join(root,'bin/node'),0o644);await assert.rejects(loadDecisionResourceBundle(root,hash),/DP_FIXED_IDENTITY/);chmodSync(join(root,'bin/node'),0o755);
  writeFileSync(join(root,'extra'),'extra');await assert.rejects(loadDecisionResourceBundle(root,hash),/DP_FIXED_IDENTITY/);rmSync(join(root,'extra'));
  rmSync(join(root,'program/plugin.mjs'));const developer=join(parent,'developer.mjs');writeFileSync(developer,'synthetic');symlinkSync(developer,join(root,'program/plugin.mjs'));await assert.rejects(loadDecisionResourceBundle(root,hash),/DP_FIXED_IDENTITY/);rmSync(join(root,'program/plugin.mjs'));writeFileSync(join(root,'program/plugin.mjs'),'synthetic');
  symlinkSync(root,join(parent,'alias'));await assert.rejects(loadDecisionResourceBundle(join(parent,'alias'),hash),/DP_FIXED_IDENTITY/);
  await assert.rejects(loadDecisionResourceBundle(root,'0'.repeat(64)),/DP_FIXED_IDENTITY/);
  for(const patch of [{format:'unknown'},{mode:'production'},{sourceCommit:'a'.repeat(40)},{platform:'other'},{arch:'other'},
   {files:[...files,files[0]]},{files:files.slice(1)},{files:[{...files[0],path:'/developer/node'},...files.slice(1)]},
   {files:[{...files[0],path:'../node'},...files.slice(1)]},{files:[{...files[0],path:'bin/../bin/node'},...files.slice(1)]},
   {files:[{...files[0],link:developer},...files.slice(1)]},{files:[{...files[0],mode:0o644},...files.slice(1)]}]){
   await assert.rejects(loadDecisionResourceBundle(root,manifest({...base,...patch})),/DP_FIXED_IDENTITY/);
  }
  chmodSync(join(root,'bin/node'),0o645);
  await assert.rejects(loadDecisionResourceBundle(root,manifest({...base,files:files.map(f=>f.path==='bin/node'?{...f,mode:0o645}:f)})),/DP_FIXED_IDENTITY/,'F-RES-02 owner cannot execute despite other execute bit');
  chmodSync(join(root,'bin/node'),0o755);
  manifest();await moved.verifyMaterials();
 }finally{rmSync(parent,{recursive:true,force:true});}
});


test('DP-RES-01/F-RES-01 build rejects an external program link even with a trusted input digest',async()=>{
 const parent=realpathSync(mkdtempSync(join(tmpdir(),'dp-resource-build-')));
 const sha=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
 const file=(path:string)=>{const s=lstatSync(path);return {path,bytes:s.size,mode:s.mode&0o777,sha256:sha(readFileSync(path))};};
 try{
  const program=join(parent,'program'),dependencies=join(parent,'dependencies');mkdirSync(program);mkdirSync(dependencies);
  const external=join(parent,'external.mjs');writeFileSync(external,'synthetic');symlinkSync(external,join(program,'entry.mjs'));
  for(const n of ['plugin.mjs','history.mjs'])writeFileSync(join(program,n),'synthetic');
  writeFileSync(join(dependencies,'dependency.txt'),'synthetic');
  const fixedFiles=['node','node-license','plugin-package','plugin-lock','source-receipt'].map(role=>{const path=join(parent,role);writeFileSync(path,'synthetic');chmodSync(path,role==='node'?0o755:0o644);return {...file(path),role};});
  const input={sourceCommit:'c11f8da8d8db3b2d5ae2424941a24307471ad972',platform:process.platform,arch:process.arch,models:[],fixedFiles,
   program:{root:program,files:[{path:'entry.mjs',bytes:9,mode:0o644,sha256:sha('synthetic'),link:external},...['plugin.mjs','history.mjs'].map(n=>({...file(join(program,n)),path:n}))]},
   dependencies:{root:dependencies,files:[{...file(join(dependencies,'dependency.txt')),path:'dependency.txt'}]}};
  const inputManifestPath=join(parent,'input.json'),bytes=JSON.stringify(input),output=join(parent,'output');writeFileSync(inputManifestPath,bytes);
  const {prepareLocalDecisionResources}=await import(new URL('../../../tools/decision-platform/prepare-local-resources.mjs',import.meta.url).href);
  await assert.rejects(prepareLocalDecisionResources({inputManifestPath,inputManifestSha256:sha(bytes),output}),/DP_FIXED_IDENTITY/);
  assert.equal(existsSync(output),false);
 }finally{rmSync(parent,{recursive:true,force:true});}
});
