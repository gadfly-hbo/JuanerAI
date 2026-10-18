import {createPersonalResearchRuntime} from '../../profiles/personal/deep-research.ts';
import type {createPersonalDecisionRuntime} from '../../profiles/personal/decision-platform.ts';
import {readPersonalReportStudioDeployment,createPersonalReportStudioOwner} from '../../profiles/personal/report-studio.ts';
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

/** Studio refusal must leave the host, workspace and identity usable. One owned shutdown at a time. */
export function createReportStudioAwareShutdown(parts:{studio?:()=>Promise<unknown>;server:()=>Promise<unknown>;workspace:()=>Promise<unknown>;release():void}):()=>Promise<void>{
 let pending:Promise<void>|undefined;
 return ()=>pending??=(async()=>{
   await parts.studio?.();
   try{await parts.server();}finally{try{await parts.workspace();}finally{parts.release();}}
 })().catch(error=>{pending=undefined;throw error;});
}

/** Native interaction owns the visible dialogs; only real readback permits close. */
export async function runReportStudioExit(parts:{lifecycle():Promise<import('../../adapters/report-studio/gateway.ts').ReportStudioLifecycle>;exitIntent(intent:'wait'|'stop'|'cancel'):Promise<unknown>;close():Promise<unknown>;choose(state:import('../../adapters/report-studio/gateway.ts').ReportStudioLifecycle):Promise<'wait'|'stop'|'cancel'>;observe(read:()=>Promise<import('../../adapters/report-studio/gateway.ts').ReportStudioLifecycle>):Promise<'ready'|'cancel'>}):Promise<boolean>{
 const state=await parts.lifecycle();
 if(state.pending){
  const choice=await parts.choose(state);if(!['wait','stop','cancel'].includes(choice))throw Error('RS_EXIT_CHOICE_INVALID');
  if(choice==='cancel'){await parts.exitIntent('cancel');return false;}
  await parts.exitIntent(choice);
  try{
   if(await parts.observe(parts.lifecycle)==='cancel'){await parts.exitIntent('cancel');return false;}
   if((await parts.lifecycle()).pending)throw Object.assign(Error('RS_PROJECT_PENDING'),{code:'RS_PROJECT_PENDING'});
  }catch(error){await parts.exitIntent('cancel');throw error;}
 }
 await parts.close();return true;
}

/** Node composition only. Passive startup never reads credentials or dispatches models. */
export async function startIndependentBrowserService(root:string,options:Readonly<{researchBundle?:{programRoot:string;manifestSha256:string;fixtureModule?:string;credentialEnvironment?:Readonly<Record<string,string>>;authorize?:Parameters<typeof createPersonalResearchRuntime>[0]['authorize']};decisionPlatform?:ReturnType<typeof createPersonalDecisionRuntime>;metricAssetDisclosureAllowed?:boolean;deployment?:Readonly<{resourcesRoot:string;credentialHelper:string}>}>={}){
 if(options.metricAssetDisclosureAllowed!==undefined&&typeof options.metricAssetDisclosureAllowed!=='boolean')throw new Error('ASSET_DISCLOSURE_AUTHORITY_INVALID');
 const deployment=options.deployment;
 if(deployment&&(!isAbsolute(deployment.resourcesRoot)||realpathSync(deployment.resourcesRoot)!==deployment.resourcesRoot||!isAbsolute(deployment.credentialHelper)))throw Error('WEB_DEPLOYMENT_INVALID');
 const resources=deployment?.resourcesRoot??fileURLToPath(new URL('../../build/',import.meta.url));
 const paths=prepareDevelopmentRoot(root,deployment?'installed-browser':'development'),directory=join(paths.userData,'web-service');mkdirSync(directory,{recursive:true,mode:0o700});
 const identity=acquireBrowserServiceIdentity(directory);
 let manager:Awaited<ReturnType<typeof createPersonalBrowserServiceWorkspace>>|undefined,server:Awaited<ReturnType<typeof startBrowserMembershipServer>>|undefined;
 let researchBundle=options.researchBundle;
 if(!researchBundle){try{const raw=JSON.parse(readFileSync(join(resources,'deep-research-deployment.json'),'utf8'));if(raw.version!==1||typeof raw.manifestSha256!=='string'||!/^[a-f0-9]{64}$/.test(raw.manifestSha256))throw Error('DR_DEPLOYMENT_INVALID');researchBundle={programRoot:join(resources,'deep-research'),manifestSha256:raw.manifestSha256};}catch(error){if((error as {code?:string}).code!=='ENOENT')throw error;}}
 let researchPython:string|undefined;
 const research=createPersonalResearchRuntime({...researchBundle,pythonExecutable:()=>researchPython,hostOrigin:()=>{if(!server)throw Error('DR_HOST_NOT_READY');return server.origin;}});
 const credentialStore=createMacOsCredentialStore(deployment?.credentialHelper??join(resources,'development-keychain/xanthil-keychain'));
 const settings=createProviderSettings({store:credentialStore,probe:createPiConnectionProbe({root:join(paths.userData,'connection-tests')})});
 const reportStudio=await readPersonalReportStudioDeployment({resourcesRoot:resources,userData:paths.userData});
 const closeResources=createReportStudioAwareShutdown({...(reportStudio.state==='configured'?{studio:async()=>{await options.decisionPlatform?.close();await reportStudio.runtime.close();}}:options.decisionPlatform?{studio:()=>options.decisionPlatform!.close()}:{}),server:async()=>{await research?.close();await server?.close();},workspace:async()=>{await manager?.close();},release:()=>{settings.close();identity.close();}});
 const close=async()=>{await research?.assertIdle();await closeResources();};
 try{
  const toolchain=await readIndependentWebToolchain(join(resources,deployment?'toolchain-deployment.json':'xanthil-toolchain-deployment.json'));
  researchPython=toolchain.pythonExecutable;
  const policy=createLocalMembershipPolicyStore(paths.userData);await policy.initializeApproved();
  const credentials=createApprovedProviderCredentials({backupStore:credentialStore});
  const openModel={requireSemanticAssessment:true,metricAssetDisclosureAllowed:options.metricAssetDisclosureAllowed===true,documentReader:await readIndependentWebDocumentReaders(join(resources,'xanthil-document-readers.json'),toolchain.pythonExecutable,deployment?{}:process.env),createRuntime:(ledger:import('../../packages/ports/analysis-request-ledger.ts').AnalysisRequestLedger,context:Readonly<{projectRoot:string}>)=>createPiSessionOpenAnalysisRuntime({projectRoot:context.projectRoot,ledger,credentials,nativeObjectArguments:true,reportThinking:'off'}),authorizeConfiguration:async()=>{const status=await credentials.refresh(true);if(status.primary.state!=='configured'&&!(status.primary.state==='missing'&&status.backup.state==='configured'))throw Object.assign(new Error('CREDENTIAL_UNAVAILABLE'),{code:'CREDENTIAL_UNAVAILABLE'});return {config_sha256:taskHash({version:'1.0',primary:{...status.primary,model:'MiniMax-M3',endpoint:'https://api.minimaxi.com/anthropic'},backup:{...status.backup,model:'mimo-v2.6-flash'}})};}};
  manager=await createPersonalBrowserServiceWorkspace({...(options.decisionPlatform?{decisionPlatform:options.decisionPlatform}:{}),...(reportStudio.state==='configured'?{reportStudio:reportStudio.runtime}:{}),originDirectory:paths.userData,projectsRoot:paths.projects,toolchain,openModel,model:{createRuntime:({projectRoot})=>createPiSessionCaseRuntime({projectRoot,ledger:createLocalAnalysisRequestLedger({projectRoot}),credential:()=>settings.taskCredential()}),access:settings.access,policy}});
  server=await startBrowserMembershipServer({...(research?{deepResearch:{task:(projectId:string,taskId:string,checkControl:()=>void)=>research.task({...manager!.researchContext(projectId,taskId),checkControl})}}:{}),...(options.decisionPlatform?{decisionPlatform:{project:manager.decisionProject}}:{}),reportStudio:reportStudio.state==='configured'?{runtime:reportStudio.runtime,project:manager.reportStudioProject}:{unavailable:reportStudio.state},store:manager.store,workspace:manager.workspace,open:manager.open,formalMember:manager.formalMember,service:{credential:identity.credential,check:identity.check,stop:close,projects:manager.projects,receipt:manager.receipt,select:async(...args:Parameters<NonNullable<typeof manager>['select']>)=>{await research?.assertIdle();return manager!.select(...args);},settings:settings.request}});
  if(reportStudio.state==='configured')reportStudio.runtime.connectOwner(createPersonalReportStudioOwner({origin:()=>{if(!server)throw Object.assign(Error('RS_OWNER_UNAVAILABLE'),{code:'RS_OWNER_UNAVAILABLE'});return server.origin;},project:manager.reportStudioOriginal}));
  identity.publish(server.origin);return {origin:server.origin,close,lifecycle:async()=>reportStudio.state==='configured'?reportStudio.runtime.lifecycle():{intent:'none' as const,pending:false,request_count:0,configuration_unknown:false,operations:[]},exitIntent:async(intent:'wait'|'stop'|'cancel')=>reportStudio.state==='configured'?reportStudio.runtime.exitIntent(intent):undefined,async open(){const response=await fetch(server!.origin+'/v1/service/open',{method:'POST',headers:{'x-xanthil-service':identity.credential,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000),redirect:'error'});if(!response.ok)throw Error('WEB_OPEN_UNAVAILABLE');const value=closed(await response.json(),['token']);if(typeof value.token!=='string'||! /^[a-f0-9]{64}$/.test(value.token))throw Error('WEB_OPEN_UNAVAILABLE');return server!.origin+'/#'+value.token;}};
 }catch(error){await close();throw error;}
}
