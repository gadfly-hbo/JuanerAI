import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {acquireBrowserServiceIdentity} from '../../adapters/storage-local/browser-project-origin.ts';
import {createPersonalBrowserServiceWorkspace} from '../../profiles/personal/browser-membership.ts';
import {startBrowserMembershipServer} from './local-server.ts';
import {readPersonalDesktopToolchain} from '../../profiles/personal/xanthil-desktop.ts';
import {createProviderSettings} from '../../packages/application/provider-settings.ts';
import {createMacOsCredentialStore} from '../../adapters/credentials-macos/index.ts';
import {createPiStoredCaseAssistantRuntime,probeLocalXiaomi} from '../../adapters/agent-pi/xiaomi-local.ts';
import {createLocalMembershipPolicyStore} from '../../adapters/storage-local/member-model-policy.ts';
import {prepareDevelopmentRoot} from '../desktop/development.ts';

export async function readIndependentWebToolchain(descriptor:string){
 try{return await readPersonalDesktopToolchain(descriptor);}catch{throw Object.assign(new Error('本地计算环境尚未准备或与所需版本不匹配，请核对本机运行条件后重试。'),{code:'WEB_TOOLCHAIN_UNAVAILABLE'});}
}

/** Node composition only. Passive startup never reads credentials or dispatches models. */
export async function startIndependentBrowserService(root:string){
 const paths=prepareDevelopmentRoot(root),directory=join(paths.userData,'web-service');mkdirSync(directory,{recursive:true,mode:0o700});
 const identity=acquireBrowserServiceIdentity(directory);
 let manager:Awaited<ReturnType<typeof createPersonalBrowserServiceWorkspace>>|undefined,server:Awaited<ReturnType<typeof startBrowserMembershipServer>>|undefined;
 const settings=createProviderSettings({store:createMacOsCredentialStore(fileURLToPath(new URL('../../build/development-keychain/xanthil-keychain',import.meta.url))),probe:probeLocalXiaomi});
 let closing:Promise<void>|undefined;
 const close=()=>closing??=(async()=>{try{await server?.close();}finally{try{await manager?.close();}finally{settings.close();identity.close();}}})();
 try{
  const toolchain=await readIndependentWebToolchain(fileURLToPath(new URL('../../build/xanthil-toolchain-deployment.json',import.meta.url)));
  const policy=createLocalMembershipPolicyStore(paths.userData);await policy.initializeApproved();
  manager=await createPersonalBrowserServiceWorkspace({originDirectory:paths.userData,projectsRoot:paths.projects,toolchain,model:{runtime:createPiStoredCaseAssistantRuntime(()=>settings.taskCredential()),access:settings.access,policy}});
  server=await startBrowserMembershipServer({store:manager.store,workspace:manager.workspace,service:{credential:identity.credential,check:identity.check,stop:close,projects:manager.projects,receipt:manager.receipt,select:manager.select,settings:settings.request}});
  identity.publish(server.origin);return {origin:server.origin,close};
 }catch(error){await close();throw error;}
}
