import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync,readdirSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
export const SOURCE_COMMIT='3a3f8c3a910460423a8b7a2638655a100a2aa8e6';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function verifyResearchBundle(root,expected){
  if(!isAbsolute(root)||realpathSync(root)!==root||!/^[a-f0-9]{64}$/.test(expected))throw Error('DR_BUNDLE_INVALID');
  const manifestPath=join(root,'manifest.json');if(!lstatSync(manifestPath).isFile()||realpathSync(manifestPath)!==manifestPath)throw Error('DR_BUNDLE_INVALID');
  const bytes=readFileSync(manifestPath);
  if(sha256(bytes)!==expected)throw Error('DR_MANIFEST_MISMATCH');
  const manifest=JSON.parse(bytes);
  if(manifest.version!==1||manifest.commit!==SOURCE_COMMIT||!Array.isArray(manifest.files))throw Error('DR_IDENTITY_MISMATCH');
  const seen=new Set();
  for(const f of manifest.files){
    if(typeof f.path!=='string'||!f.path||f.path.startsWith('/')||f.path.split('/').some(p=>!p||p==='.'||p==='..')||f.path.includes('\\')||seen.has(f.path))throw Error('DR_BUNDLE_PATH_INVALID');
    seen.add(f.path);const path=join(root,f.path);const stat=lstatSync(path);
    if(!stat.isFile()||stat.size!==f.bytes||realpathSync(path)!==path||sha256(readFileSync(path))!==f.sha256)throw Error('DR_BUNDLE_BYTES_MISMATCH');
  }
  for(const required of ['node','child.mjs','server.mjs','runtime.mjs','mcp-entry.py','mcp-identity.json','dist/server/routes/projectsRuns.js','ui-dist/plugin.js','ui-dist/plugin.css','THIRD-PARTY-NOTICES.txt'])if(!seen.has(required))throw Error('DR_BUNDLE_INCOMPLETE');
  function census(dir,prefix=''){for(const name of readdirSync(dir)){const rel=prefix+name,path=join(dir,name),stat=lstatSync(path);if(stat.isSymbolicLink())throw Error('DR_BUNDLE_PATH_INVALID');if(stat.isDirectory())census(path,rel+'/');else if(!stat.isFile()||(rel!=='manifest.json'&&!seen.has(rel)))throw Error('DR_BUNDLE_UNLISTED');}}
  census(root);return manifest;
}
