import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// One owned process group includes Forge, Electron and its local calculation
// children. No process-name search, unrelated PID signalling or automatic retry.
const forgeChild=process.argv[2]==='--forge';
const appArgs=process.argv.slice(forgeChild?3:2);
if(appArgs.length>1||appArgs.length===1&&appArgs[0]!=='--xanthil-browser')throw new Error('Usage: npm run desktop:start [-- --xanthil-browser]');
if(forgeChild){
 await import('./prepare-toolchain-deployment.mjs');
 const {buildDevelopmentKeychainHelper}=await import('./build-keychain-helper.cjs');
 buildDevelopmentKeychainHelper();
 const {api}=await import('@electron-forge/core');
 await api.start({dir:process.cwd(),interactive:false,args:appArgs});
}else{
 const env={};
 for(const name of ['PATH','HOME','TMPDIR','LANG','JUANERAI_TOOLCHAIN_BIN','JUANERAI_DESKTOP_DEV_ROOT'])if(process.env[name])env[name]=process.env[name];
 const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'--forge',...appArgs],{env,detached:true,stdio:['ignore','inherit','inherit']});
 let stopping=false;
 const signalGroup=signal=>{try{process.kill(-child.pid,signal);}catch(error){if(error.code!=='ESRCH')throw error;}};
 const stop=()=>{
  if(stopping)return;stopping=true;signalGroup('SIGTERM');
  setTimeout(()=>{signalGroup('SIGKILL');},2000);
 };
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
 child.on('error',error=>{console.error(error.message);process.exitCode=1;});
 child.on('exit',(code)=>{stop();process.exitCode=stopping && (code===null || code===0)?0:code??1;});
 console.log('Xanthil 开发版 — Renderer HMR; Main/Preload: Ctrl-C, then npm run desktop:start');
}
