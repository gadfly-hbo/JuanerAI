import {createRequire} from 'node:module';
import {join} from 'node:path';
import {sha256} from './bundle.mjs';
export function createResearchGateway({process:runtime,programRoot}){
 const json=async path=>JSON.parse(Buffer.from((await runtime.api(path)).bytes).toString('utf8'));
 const valid=v=>v&&/^p-[a-z0-9-]+$/.test(v.projectId)&&typeof v.runId==='string'&&v.runId.length<256&&Number.isSafeInteger(v.version)&&v.version>0;
 return {launch:()=>runtime.launch(),state:()=>runtime.state(),
  async published(){const {projects}=await json('/api/projects');return projects.flatMap(p=>p.versions.map(v=>({title:p.goal,projectId:p.id,runId:v.runId,version:v.version})));},
  async export(version){
   if(!valid(version))throw Error('DR_VERSION_INVALID');
   const {meta}=await json('/api/projects/'+version.projectId);if(!meta.versions.some(v=>v.version===version.version&&v.runId===version.runId))throw Error('DR_VERSION_MISMATCH');
   const {bytes,mediaType}=await runtime.api(`/api/projects/${version.projectId}/versions/${version.version}/export`);
   if(mediaType!=='application/zip'||bytes.length>64*1024*1024)throw Error('DR_EXPORT_INVALID');
   const {unzipSync}=createRequire(join(programRoot,'package.json'))('fflate');
   let total=0;const zipPaths=new Set();const files=unzipSync(bytes,{filter:file=>{total+=file.originalSize;if(zipPaths.has(file.name))throw Error('DR_EXPORT_DUPLICATE');zipPaths.add(file.name);if(total>128*1024*1024||zipPaths.size>10000||file.originalSize>64*1024*1024)throw Error('DR_EXPORT_CAPACITY');return true;}});
   const paths=Object.keys(files);if(paths.some(p=>p.startsWith('/')||p.includes('\\')||p.split('/').some(s=>!s||s==='.'||s==='..')))throw Error('DR_EXPORT_PATH_INVALID');
   if(paths.reduce((n,p)=>n+files[p].length,0)>128*1024*1024)throw Error('DR_EXPORT_CAPACITY');
   const manifest=JSON.parse(Buffer.from(files['manifest.json']??[]).toString('utf8'));
   if(manifest.schemaVersion!=='2.0'||manifest.runId!==version.runId||!manifest.fileHashes||!Array.isArray(manifest.limitations)||!Array.isArray(manifest.unresolved))throw Error('DR_EXPORT_MANIFEST_INVALID');
   for(const [path,digest]of Object.entries(manifest.fileHashes))if(!files[path]||sha256(files[path])!==digest)throw Error('DR_EXPORT_DIGEST_MISMATCH');
   for(const p of ['report.md','report.html','limitations.md','review_summary.json'])if(!files[p]||!manifest.fileHashes[p])throw Error('DR_EXPORT_INCOMPLETE');
   for(const p of paths)if(p!=='manifest.json'&&!p.startsWith('formal/')&&!manifest.fileHashes[p])throw Error('DR_EXPORT_UNMANIFESTED');
   const contentSha256=sha256(JSON.stringify(paths.sort().map(path=>[path,sha256(files[path])])));
   return {bytes,contentSha256,limitations:manifest.limitations,unresolved:manifest.unresolved};
  },
 };
}
