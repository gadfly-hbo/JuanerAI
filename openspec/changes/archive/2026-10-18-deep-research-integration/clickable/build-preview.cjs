// Review-only bundler. Original source under reference/ is never rewritten.
const fs=require('node:fs'),path=require('node:path');
const esbuild=require(process.env.REVIEW_ESBUILD || '/Users/bendandebaba/.codex/worktrees/323d/JuanerAI/node_modules/esbuild');
const deps=process.env.REVIEW_NODE_MODULES || '/Users/bendandebaba/JuanerAI-artifacts/deep-research-integration/source-002-20261018/preview-toolchain/node_modules';
const transforms=[];
esbuild.build({entryPoints:[path.join(__dirname,'reference/ui/main.tsx')],outfile:path.join(__dirname,'plugin.js'),bundle:true,format:'iife',jsx:'automatic',nodePaths:[deps],loader:{'.png':'file'},assetNames:'assets/[name]-[hash]',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'review-only-integration',setup(b){b.onLoad({filter:/\.(tsx|ts)$/},a=>{let s=fs.readFileSync(a.path,'utf8');function replace(old,next){if(!s.includes(old))throw new Error('Missing transform '+old);s=s.replace(old,next);transforms.push({file:path.relative(__dirname,a.path),from:old,to:next});}
if(a.path.endsWith('PlanView.tsx')){replace('const fu = params.get("followup");','const fu = null; // Phase one: followup unavailable.');replace('value={baseRun?.runId ?? ""}','disabled title="首期未启用会话研究记忆与追问" value={baseRun?.runId ?? ""}');replace('基于已完成研究追问(可选;延续其证据与主张,只为新问题采证)','会话研究记忆与追问（首期未启用）');replace('附件(本机文件路径,文本 / PDF,每行一个,可空)','附件（审核稿仅接收合成路径；正式接入须在已授权范围内）');}
if(a.path.endsWith('projectDetail.tsx'))replace('toast.show("已取消,已完成阶段保留");','toast.show("取消请求已受理；以运行终态为准，状态未知时不会声称已停止");');
if(a.path.endsWith('TopBar.tsx')){s=s.replaceAll('独立深度研究工作台','深度研究');}
if(a.path.endsWith('StatusBar.tsx')){replace('仅在本机运行(127.0.0.1),不连接 JuanerAI · 关键结论逐条绑定原文快照,可核查','合成审核 · 不连接研究服务 · 关键结论保留引用与限制');replace('● 本机服务','● 合成演示');}
return {contents:s,loader:a.path.endsWith('.tsx')?'tsx':'ts'};});}}]}).then(()=>fs.writeFileSync(path.join(__dirname,'preview-transforms.json'),JSON.stringify(transforms,null,2)+'\n')).catch(e=>{console.error(e);process.exit(1)});
