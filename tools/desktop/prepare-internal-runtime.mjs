// Internal-install 001 only: no download, extraction, execution or installation.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,readdir,lstat,readlink,realpath,writeFile,chmod} from 'node:fs/promises';
import {resolve,relative,isAbsolute,join,sep} from 'node:path';

const [python,duckdb,output,notices,...extra]=process.argv.slice(2);
assert.ok(python&&duckdb&&output&&notices&&extra.length===0,'Usage: node prepare-internal-runtime.mjs VERIFIED_PYTHON_DIRECTORY VERIFIED_DUCKDB NEW_RESOURCES_DIRECTORY VERIFIED_NOTICES_DIRECTORY');
assert.ok([python,duckdb,output,notices].every(isAbsolute),'explicit absolute inputs/output required');
const noticeNames=await readdir(notices);assert.ok(noticeNames.includes('README.txt')&&noticeNames.includes('Electron-LICENSES.chromium.html')&&noticeNames.includes('DuckDB-LICENSE.txt'));
for(const name of noticeNames)assert.ok((await lstat(join(notices,name))).isFile(),'notices must be flat regular text files');
const hash=b=>createHash('sha256').update(b).digest('hex');
const root=await realpath(python),inventory=[];
async function walk(directory){
 for(const name of(await readdir(directory)).sort()){
  const path=join(directory,name),stat=await lstat(path),resolved=await realpath(path),rel=relative(root,resolved);
  assert.ok(rel!==''&&rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel),'resource link escapes verified Python directory');
  const key='toolchain/python/'+relative(root,path).split(sep).join('/');
  if(stat.isDirectory())await walk(path);
  else if(stat.isSymbolicLink()){const target=await readlink(path);assert.ok(!isAbsolute(target));inventory.push({path:key,kind:'symlink',target});}
  else {assert.ok(stat.isFile());const data=await readFile(path);inventory.push({path:key,kind:'file',bytes:data.length,sha256:hash(data),mode:stat.mode&0o777});}
 }
}
await walk(root);
const duck=await readFile(duckdb);
assert.equal(duck.length,53883456);assert.equal(hash(duck),'5f5fafb02b609cdb20d199c06835d095023616e7366033775ba99a6a0b6969f3');
inventory.unshift({path:'toolchain/duckdb',kind:'file',bytes:duck.length,sha256:hash(duck),mode:0o755});
const descriptor={schema_version:'2.0',duckdb:{executable_path:'toolchain/duckdb',version:'1.5.2'},python:{executable_path:'toolchain/python/bin/python3.14',version:'3.14.4'},inventory};
const bytes=JSON.stringify(descriptor,null,2)+'\n';
assert.equal(hash(bytes),'efbbb4d0efb3685f1671bddbbcdb6f39baa1b3e346dad1d058d635394d62f6d7','entire runtime must match approved install_only payload, modes and links');
await mkdir(output);await mkdir(join(output,'toolchain'));
await cp(root,join(output,'toolchain/python'),{recursive:true,errorOnExist:true,force:false,verbatimSymlinks:true});
await writeFile(join(output,'toolchain/duckdb'),duck,{flag:'wx',mode:0o755});await chmod(join(output,'toolchain/duckdb'),0o755);
await writeFile(join(output,'toolchain-deployment.json'),bytes,{flag:'wx'});
await cp(notices,join(output,'THIRD_PARTY_NOTICES'),{recursive:true,errorOnExist:true,force:false});
console.log(JSON.stringify({resources:resolve(output),inventory:inventory.length,descriptorSha256:hash(bytes)}));
