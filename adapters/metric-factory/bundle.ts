import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync,readdirSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
export const metricHash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export function verifyMetricBundle(root:string,expected:string){
 if(!isAbsolute(root)||realpathSync(root)!==root||!/^[a-f0-9]{64}$/.test(expected))throw Error('MF_BUNDLE_INVALID');
 const file=join(root,'manifest.json');if(!lstatSync(file).isFile()||realpathSync(file)!==file)throw Error('MF_BUNDLE_INVALID');
 const bytes=readFileSync(file);if(metricHash(bytes)!==expected)throw Error('MF_MANIFEST_CHANGED');
 const manifest=JSON.parse(bytes.toString('utf8')) as {version:number;sourceCommit:string;sourceSnapshot:string;files:{path:string;bytes:number;sha256:string}[]};
 if(manifest.version!==1||manifest.sourceCommit!=='169faa8d45e1c5616c004f8fb844a7ca68add156'||!/^[a-f0-9]{64}$/.test(manifest.sourceSnapshot)||!Array.isArray(manifest.files))throw Error('MF_SOURCE_INVALID');
 const seen=new Set<string>();
 for(const f of manifest.files){if(typeof f.path!=='string'||!f.path||f.path.includes('\\')||f.path.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(f.path))throw Error('MF_BUNDLE_PATH');seen.add(f.path);const path=join(root,f.path),st=lstatSync(path);if(!st.isFile()||realpathSync(path)!==path||st.size!==f.bytes||metricHash(readFileSync(path))!==f.sha256)throw Error('MF_BUNDLE_BYTES');}
 for(const p of ['node','dist/integration.js','dist/index.html','dist/app.js','dist/api.js','dist/style.css','package.json','package-lock.json','LICENSE','INTEGRATION-CHANGES.md','MODEL-CATALOG-NOTICE.txt','THIRD-PARTY-NOTICES.txt','source-identity.json'])if(!seen.has(p))throw Error('MF_BUNDLE_MISSING');
 function census(dir:string,prefix=''){for(const name of readdirSync(dir)){const rel=prefix+name,path=join(dir,name),st=lstatSync(path);if(st.isSymbolicLink())throw Error('MF_BUNDLE_LINK');if(st.isDirectory())census(path,rel+'/');else if(!st.isFile()||rel!=='manifest.json'&&!seen.has(rel))throw Error('MF_BUNDLE_UNLISTED');}}
 census(root);return manifest;
}
