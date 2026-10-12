import {createPiSessionCaseRuntime} from '../../adapters/agent-pi/native-open-analysis.ts';
import {createLocalAnalysisRequestLedger} from '../../adapters/storage-local/analysis-request-ledger.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import {createApprovedProviderCredentials} from '../../adapters/agent-pi/provider-credentials.ts';
import {createPiSessionOpenAnalysisRuntime} from '../../adapters/agent-pi/open-analysis.ts';
import {mkdirSync,readFileSync,lstatSync,realpathSync,accessSync,constants} from 'node:fs';
import {isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {membershipRecord as closed} from '../../packages/product-core/member-analysis.ts';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {acquireBrowserServiceIdentity} from '../../adapters/storage-local/browser-project-origin.ts';
import {createPersonalBrowserServiceWorkspace} from '../../profiles/personal/browser-membership.ts';
import {startBrowserMembershipServer} from './local-server.ts';
import {readPersonalDesktopToolchain} from '../../profiles/personal/xanthil-desktop.ts';
import {createProviderSettings} from '../../packages/application/provider-settings.ts';
import {createMacOsCredentialStore} from '../../adapters/credentials-macos/index.ts';
import {createPiConnectionProbe} from '../../adapters/agent-pi/native-connection-probe.ts';
import {createLocalMembershipPolicyStore} from '../../adapters/storage-local/member-model-policy.ts';
import {prepareDevelopmentRoot} from '../desktop/development.ts';

export async function readIndependentWebToolchain(descriptor:string){
 try{return await readPersonalDesktopToolchain(descriptor);}catch{throw Object.assign(new Error('本地计算环境尚未准备或与所需版本不匹配，请核对本机运行条件后重试。'),{code:'WEB_TOOLCHAIN_UNAVAILABLE'});}
}

/** Trusted deployment input only; passive identity read never invokes a reader. */
export async function readIndependentWebDocumentReaders(descriptor:string,fallbackPython:string,env:NodeJS.ProcessEnv=process.env):Promise<{pythonExecutable:string;imageExecutable?:string;sofficeExecutable?:string}>{
 let readers:{pythonExecutable:string;imageExecutable?:string;sofficeExecutable?:string}={pythonExecutable:fallbackPython};
 try{
  let bytes:Buffer|null=null;
  try{const file=lstatSync(descriptor);if(!file.isFile()||file.isSymbolicLink()||file.size>65536)throw Error('invalid');bytes=readFileSync(descriptor);}catch(error){if(Reflect.get(error as object,'code')!=='ENOENT')throw error;}
  if(bytes){const x=closed(JSON.parse(bytes.toString('utf8')),['version','python','image','legacy_office']);if(x.version!=='1.0')throw Error('invalid');
   const executable=(raw:unknown)=>{const r=closed(raw,['executable_path','sha256']);if(typeof r.executable_path!=='string'||!isAbsolute(r.executable_path)||typeof r.sha256!=='string'||! /^[a-f0-9]{64}$/.test(r.sha256))throw Error('invalid');const path=r.executable_path,file=lstatSync(path);if(!file.isFile()||file.isSymbolicLink()||realpathSync(path)!==path||file.size>256*1024*1024)throw Error('invalid');accessSync(path,constants.X_OK);if(createHash('sha256').update(readFileSync(path)).digest('hex')!==r.sha256)throw Error('changed');return path;};
   readers={pythonExecutable:executable(x.python),...(x.image===null?{}:{imageExecutable:executable(x.image)}),...(x.legacy_office===null?{}:{sofficeExecutable:executable(x.legacy_office)})};
  }
 }catch{throw Object.assign(new Error('本机文件读取组件与已配置版本不一致，请联系维护人员核对；已有资料已保留。'),{code:'WEB_DOCUMENT_READERS_UNAVAILABLE'});}
 return {...readers,...(env.JUANERAI_DOCUMENT_PYTHON?{pythonExecutable:env.JUANERAI_DOCUMENT_PYTHON}:{}),...(env.JUANERAI_IMAGE_READER?{imageExecutable:env.JUANERAI_IMAGE_READER}:{}),...(env.JUANERAI_SOFFICE?{sofficeExecutable:env.JUANERAI_SOFFICE}:{})};
}

/** Node composition only. Passive startup never reads credentials or dispatches models. */
export async function startIndependentBrowserService(root:string){
 const paths=prepareDevelopmentRoot(root),directory=join(paths.userData,'web-service');mkdirSync(directory,{recursive:true,mode:0o700});
 const identity=acquireBrowserServiceIdentity(directory);
 let manager:Awaited<ReturnType<typeof createPersonalBrowserServiceWorkspace>>|undefined,server:Awaited<ReturnType<typeof startBrowserMembershipServer>>|undefined;
 const credentialStore=createMacOsCredentialStore(fileURLToPath(new URL('../../build/development-keychain/xanthil-keychain',import.meta.url)));
 const settings=createProviderSettings({store:credentialStore,probe:createPiConnectionProbe({root:join(paths.userData,'connection-tests')})});
 let closing:Promise<void>|undefined;
 const close=()=>closing??=(async()=>{try{await server?.close();}finally{try{await manager?.close();}finally{settings.close();identity.close();}}})();
 try{
  const toolchain=await readIndependentWebToolchain(fileURLToPath(new URL('../../build/xanthil-toolchain-deployment.json',import.meta.url)));
  const policy=createLocalMembershipPolicyStore(paths.userData);await policy.initializeApproved();
  const credentials=createApprovedProviderCredentials({backupStore:credentialStore});
  const openModel={requireSemanticAssessment:true,documentReader:await readIndependentWebDocumentReaders(fileURLToPath(new URL('../../build/xanthil-document-readers.json',import.meta.url)),toolchain.pythonExecutable),createRuntime:(ledger:import('../../packages/ports/analysis-request-ledger.ts').AnalysisRequestLedger,context:Readonly<{projectRoot:string}>)=>createPiSessionOpenAnalysisRuntime({projectRoot:context.projectRoot,ledger,credentials,nativeObjectArguments:true,reportThinking:'off'}),authorizeConfiguration:async()=>{const status=await credentials.refresh(true);if(status.primary.state!=='configured'&&!(status.primary.state==='missing'&&status.backup.state==='configured'))throw Object.assign(new Error('CREDENTIAL_UNAVAILABLE'),{code:'CREDENTIAL_UNAVAILABLE'});return {config_sha256:taskHash({version:'1.0',primary:{...status.primary,model:'MiniMax-M3',endpoint:'https://api.minimaxi.com/anthropic'},backup:{...status.backup,model:'mimo-v2.6-flash'}})};}};
  manager=await createPersonalBrowserServiceWorkspace({originDirectory:paths.userData,projectsRoot:paths.projects,toolchain,openModel,model:{createRuntime:({projectRoot})=>createPiSessionCaseRuntime({projectRoot,ledger:createLocalAnalysisRequestLedger({projectRoot}),credential:()=>settings.taskCredential()}),access:settings.access,policy}});
  server=await startBrowserMembershipServer({store:manager.store,workspace:manager.workspace,open:manager.open,formalMember:manager.formalMember,service:{credential:identity.credential,check:identity.check,stop:close,projects:manager.projects,receipt:manager.receipt,select:manager.select,settings:settings.request}});
  identity.publish(server.origin);return {origin:server.origin,close};
 }catch(error){await close();throw error;}
}
