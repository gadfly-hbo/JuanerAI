// AC-SKILL-01–04: fixed local asset, actual public SDK execution tools; no network.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,mkdir,readFile,writeFile,rm,symlink,link,rename} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const load=path=>import(pathToFileURL(join(root,path)).href);
const {createNetworkExecutionEnvironment}=await load('dist/agent/exec-env.js');
const {createExecutionTools}=await load('node_modules/pi-agent-runtime/dist/index.js');
// Missing behavior must exercise the original environment to produce a causal RED.
const {withBuiltinSkillRead}=await load('dist/agent/builtin-skill-environment.js').catch(error=>{if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;return {withBuiltinSkillRead:env=>env};});
const fixed=await readFile(join(root,'assets/skills/ppt/SKILL.md'));
const signal=()=>new AbortController().signal;
globalThis.fetch=async()=>{throw Error('RS_SKILL_UNEXPECTED_NETWORK');};
async function fixture(t){
 const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-fixed-skill-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 const project=join(dir,'project'),skills=join(dir,'assets/skills/ppt'),path=join(skills,'SKILL.md');await mkdir(project);await mkdir(skills,{recursive:true});await writeFile(path,fixed);
 const original=await createNetworkExecutionEnvironment({root:project,policyVersion:'report-studio-net-v1'}),env=withBuiltinSkillRead(original,skills);
 return {dir,project,skills,path,original,env};
}
test('RS-SKILL-01 only the exact fixed skill can be read outside the project',async t=>{
 const f=await fixture(t);assert.deepEqual(Buffer.from(await f.env.read(f.path,signal())),fixed);assert.equal((await f.env.stat(f.path,signal())).size,fixed.length);assert.equal(await f.env.resolvePath(f.path),f.path);
 for(const path of [join(f.skills,'other.md'),join(f.dir,'private-auth.json'),'../assets/skills/ppt/SKILL.md','/etc/hosts'])await assert.rejects(()=>f.env.read(path,signal()));
 await writeFile(join(f.project,'input.md'),'local project');assert.equal(new TextDecoder().decode(await f.env.read('input.md',signal())),'local project');await f.env.write('output.md',new TextEncoder().encode('normal write'),signal());assert.equal(await readFile(join(f.project,'output.md'),'utf8'),'normal write');
});
test('RS-SKILL-01 actual SDK read works; write/edit keep the original project boundary and definitions',async t=>{
 const f=await fixture(t),names=['read','write','edit','bash'];
 const before=createExecutionTools(f.original,names),after=createExecutionTools(f.env,names);
 assert.deepEqual(after.map(({execute,...definition})=>definition),before.map(({execute,...definition})=>definition));
 const tool=name=>after.find(t=>t.name===name),ctx={};
 const read=await tool('read').execute({path:f.path},signal(),ctx);assert(JSON.stringify(read).includes('ppt-report'));
 await assert.rejects(()=>tool('write').execute({path:f.path,content:'tampered'},signal(),ctx));
 await assert.rejects(()=>tool('edit').execute({path:f.path,edits:[{oldText:'ppt-report',newText:'tampered'}]},signal(),ctx),error=>error.message.includes('permission_denied')&&error.cause?.message==='Host file operation failed');
 assert.deepEqual(await readFile(f.path),fixed);
 await tool('write').execute({path:'normal.md',content:'before'},signal(),ctx);await tool('edit').execute({path:'normal.md',edits:[{oldText:'before',newText:'after'}]},signal(),ctx);assert.equal(await readFile(join(f.project,'normal.md'),'utf8'),'after');
});
for(const variant of ['changed','missing','symlink','parent-symlink','hardlink','cancelled'])test('RS-SKILL-01 rejects '+variant+' without exposing resource paths',async t=>{
 const f=await fixture(t);let abort=signal();
 if(variant==='changed')await writeFile(f.path,Buffer.alloc(fixed.length,120));
 if(variant==='missing')await rm(f.path);
 if(variant==='symlink'){await rename(f.path,join(f.dir,'retained'));await symlink(join(f.dir,'retained'),f.path);}
 if(variant==='parent-symlink'){await rename(f.skills,f.skills+'-retained');await symlink(f.skills+'-retained',f.skills);}
 if(variant==='hardlink')await link(f.path,join(f.dir,'retained'));
 if(variant==='cancelled'){const c=new AbortController();c.abort('private cause');abort=c.signal;}
 await assert.rejects(()=>f.env.read(f.path,abort),error=>/^RS_SKILL_(UNAVAILABLE|CANCELLED)$/.test(error.message));
});
