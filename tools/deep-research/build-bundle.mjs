// Usage: node build-bundle.mjs VERIFIED_SOURCE NEW_OUTPUT. No Provider or original CLI runs.
import {readFileSync,writeFileSync,mkdirSync,cpSync,readdirSync,lstatSync,chmodSync,realpathSync,rmSync,existsSync} from 'node:fs';
import {join,resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {sha256} from '../../adapters/deep-research/bundle.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const [sourceArg,outArg]=process.argv.slice(2);if(!sourceArg||!outArg)throw Error('SOURCE_AND_NEW_OUTPUT_REQUIRED');
const source=realpathSync(sourceArg),out=resolve(outArg);
const pin=JSON.parse(readFileSync(join(here,'source-identity.json')));
for(const file of pin.files){const path=join(source,file.path);if(!lstatSync(path).isFile()||realpathSync(path)!==path||sha256(readFileSync(path))!==file.sha256)throw Error('SOURCE_MISMATCH: '+file.path);}
mkdirSync(out,{mode:0o700});
const run=(args,cwd)=>{const r=spawnSync(process.execPath,args,{cwd,stdio:'inherit',env:{PATH:process.env.PATH,HOME:out,TMPDIR:out,LANG:'en_US.UTF-8'}});if(r.status!==0)throw Error('BUILD_STEP_FAILED');};
run([join(source,'node_modules/typescript/bin/tsc'),'-p','tsconfig.json'],source);
cpSync(join(source,'dist'),join(out,'dist'),{recursive:true,filter:p=>!p.endsWith('.test.js')});
for(const name of ['package.json','package-lock.json','vendor'])cpSync(join(source,name),join(out,name),{recursive:true});
const npm=process.env.DR_NPM_CLI;if(!npm)throw Error('EXPLICIT_NPM_CLI_REQUIRED');
run([npm,'ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],out);
const nodeFile=process.env.DR_NODE_FILE,nodeLicense=process.env.DR_NODE_LICENSE;
if(!nodeFile||!nodeLicense)throw Error('EXPLICIT_NODE_AND_LICENSE_REQUIRED');
cpSync(nodeFile,join(out,'node'));chmodSync(join(out,'node'),0o755);cpSync(nodeLicense,join(out,'Node-LICENSE.txt'));
const nodeCheck=spawnSync(join(out,'node'),['--version'],{env:{PATH:out},encoding:'utf8'});if(nodeCheck.status!==0||!/^v(?:2[6-9]|[3-9][0-9])\./.test(nodeCheck.stdout.trim()))throw Error('BUNDLED_NODE_UNAVAILABLE');
function removeBin(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(name==='.bin'){rmSync(path,{recursive:true});continue;}if(lstatSync(path).isDirectory())removeBin(path);}}
removeBin(join(out,'node_modules'));
for(const name of ['child.mjs','server.mjs','runtime.mjs'])cpSync(join(here,'../../adapters/deep-research',name),join(out,name));
const mcpSource=process.env.DR_MCP_SITE_PACKAGES;if(!mcpSource)throw Error('FIXED_MCP_SITE_REQUIRED');
const mcpPin=JSON.parse(readFileSync(join(here,'mcp-identity.json')));
for(const file of mcpPin.files){const path=join(mcpSource,file.path);if(!lstatSync(path).isFile()||sha256(readFileSync(path))!==file.sha256)throw Error('MCP_SOURCE_MISMATCH');mkdirSync(dirname(join(out,'mcp-site',file.path)),{recursive:true});cpSync(path,join(out,'mcp-site',file.path));}
cpSync(join(here,'../../adapters/deep-research/mcp-entry.py'),join(out,'mcp-entry.py'));
cpSync(join(here,'mcp-identity.json'),join(out,'mcp-identity.json'));
const esbuild=createRequire(join(source,'package.json'))('esbuild');
const transforms=[];
await esbuild.build({entryPoints:[join(source,'ui/main.tsx')],outfile:join(out,'ui-dist/plugin.js'),bundle:true,format:'esm',jsx:'automatic',loader:{'.png':'file'},assetNames:'assets/[name]-[hash]',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'approved-dr002-seams',setup(b){b.onLoad({filter:/\.(tsx|ts)$/},a=>{
 let s=readFileSync(a.path,'utf8');const replace=(before,after)=>{if(!s.includes(before))throw Error('UI_SEAM_MISSING');s=s.replace(before,after);transforms.push({file:relative(source,a.path),before,after});};
 if(a.path.endsWith('PlanView.tsx')){replace('const fu = params.get("followup");','const fu = null;');replace('value={baseRun?.runId ?? ""}','disabled title="首期未启用会话研究记忆与追问" value={baseRun?.runId ?? ""}');replace('基于已完成研究追问(可选;延续其证据与主张,只为新问题采证)','会话研究记忆与追问（首期未启用）');}
 if(a.path.endsWith('projectDetail.tsx'))replace('toast.show("已取消,已完成阶段保留");','toast.show("取消请求已受理；以运行终态为准，状态未知时不会声称已停止");');
 if(a.path.endsWith('TopBar.tsx'))s=s.replaceAll('独立深度研究工作台','深度研究').replaceAll('不连接 JuanerAI','JuanerAI 研究工作空间');
 if(a.path.endsWith('StatusBar.tsx'))replace('仅在本机运行(127.0.0.1),不连接 JuanerAI · 关键结论逐条绑定原文快照,可核查','JuanerAI 研究工作空间 · 关键结论保留原文引用与限制');
 return {contents:s,loader:a.path.endsWith('.tsx')?'tsx':'ts'};
 });}}]});
cpSync(join(here,'../../openspec/changes/deep-research-integration/clickable/integration.css'),join(out,'ui-dist/integration.css'));
writeFileSync(join(out,'ui-transforms.json'),JSON.stringify(transforms,null,2)+'\n');
const files=[];const notices=[];
function scan(dir){for(const name of readdirSync(dir).sort()){if(name==='.bin')continue;const path=join(dir,name),s=lstatSync(path);if(s.isDirectory()){scan(path);continue;}if(!s.isFile())throw Error('BUNDLE_LINK: '+path);const rel=relative(out,path);files.push({path:rel,bytes:s.size,sha256:sha256(readFileSync(path))});if(/(?:license|copying|notice)/i.test(name))notices.push(rel);}}
scan(out);writeFileSync(join(out,'THIRD-PARTY-NOTICES.txt'),'Fixed source: '+pin.repository+' @ '+pin.commit+'\nThird party license/notice originals included at:\n'+notices.join('\n')+'\n');
const notice=readFileSync(join(out,'THIRD-PARTY-NOTICES.txt'));files.push({path:'THIRD-PARTY-NOTICES.txt',bytes:notice.length,sha256:sha256(notice)});
const manifest=JSON.stringify({version:1,commit:pin.commit,tree:pin.tree,node:nodeCheck.stdout.trim(),files},null,2)+'\n';writeFileSync(join(out,'manifest.json'),manifest);
process.stdout.write(JSON.stringify({root:out,manifest_sha256:sha256(manifest),files:files.length})+'\n');
