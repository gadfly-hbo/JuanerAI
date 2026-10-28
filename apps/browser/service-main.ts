import {readPersonalMetricDeployment,type MetricModelAccess} from "../../profiles/personal/metric-factory.ts";
export {};


/** Node composition only. Passive startup never reads credentials or dispatches models. */
type IndependentBrowserAnalysisOptions=Readonly<{analysisModel?:'MiniMax-M3'|'mimo-v2.6-flash'|'deepseek-flash';metricAssetDisclosureAllowed?:boolean;judgmentReviewAllowed?:boolean;toolCorrectionLimit?:number;modelRecoveryLimit?:number;}>;

/** Engineering estimate buffers, not Provider usage or a window increase.
 * Source and limitations: this Change's request-admission.md. */
export const independentBrowserRequestAdmission=Object.freeze({policy_version:'juanerai-browser-unified-v1',protocol_overhead_tokens:4096,safety_margin_tokens:8192});

import {createPersonalResearchRuntime} from '../../profiles/personal/deep-research.ts';
import type {createPersonalDecisionRuntime} from '../../profiles/personal/decision-platform.ts';
import {readPersonalReportStudioDeployment,createPersonalReportStudioOwner} from '../../profiles/personal/report-studio.ts';
import {taskHash} from '../../packages/product-core/member-task.ts';
import {createPiCredentialProbe} from '../../adapters/agent-pi/credential-probe.ts';
import {createApprovedProviderCredentials} from '../../adapters/agent-pi/provider-credentials.ts';
import {mkdirSync,readFileSync,lstatSync,realpathSync,accessSync,constants} from 'node:fs';
import {isAbsolute,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {membershipRecord as closed,membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {acquireBrowserServiceIdentity} from '../../adapters/storage-local/browser-project-origin.ts';
import {createPersonalBrowserServiceWorkspace} from '../../profiles/personal/browser-membership.ts';
import {startBrowserMembershipServer} from './local-server.ts';
import {readPersonalDesktopToolchain} from '../../profiles/personal/xanthil-desktop.ts';
import {createProviderSettings} from '../../packages/application/provider-settings.ts';
import {createPersonalMetricModel,readPersonalMetricTrialGrant} from '../../profiles/personal/metric-factory-model.ts';
import {createMacOsCredentialStore} from '../../adapters/credentials-macos/index.ts';
import {createLocalMembershipPolicyStore} from '../../adapters/storage-local/member-model-policy.ts';
import {prepareDevelopmentRoot} from '../desktop/development.ts';

export async function readIndependentWebToolchain(descriptor:string){
 try{return await readPersonalDesktopToolchain(descriptor);}catch{throw Object.assign(new Error('本地计算环境尚未准备或与所需版本不匹配，请核对本机运行条件后重试。'),{code:'WEB_TOOLCHAIN_UNAVAILABLE'});}
}

/** Closed current deployment choices. No credentials, Task routes or execution policy overrides. */
export function readIndependentBrowserDeployment(path:string|undefined,root:string):IndependentBrowserAnalysisOptions{
 try{
  if(!path||!isAbsolute(path)||realpathSync(path)!==path||!isAbsolute(root)||resolve(root)!==root)throw Error('invalid');
  const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('invalid');
  const x=closed(JSON.parse(readFileSync(path,'utf8')),['version','profile_root','analysis']);
  if(x.version!=='2.0'||x.profile_root!==root)throw Error('invalid');
  const a=closed(x.analysis,['analysisModel','judgmentReviewAllowed',...['toolCorrectionLimit','modelRecoveryLimit'].filter(k=>x.analysis&&typeof x.analysis==='object'&&Object.hasOwn(x.analysis,k)),...(x.analysis&&typeof x.analysis==='object'&&Object.hasOwn(x.analysis,'metricAssetDisclosureAllowed')?['metricAssetDisclosureAllowed']:[])]);
  if(!['MiniMax-M3','mimo-v2.6-flash','deepseek-flash'].includes(String(a.analysisModel))||typeof a.judgmentReviewAllowed!=='boolean'||a.metricAssetDisclosureAllowed!==undefined&&typeof a.metricAssetDisclosureAllowed!=='boolean')throw Error('invalid');
  const toolCorrectionLimit=a.toolCorrectionLimit===undefined?5:a.toolCorrectionLimit,modelRecoveryLimit=a.modelRecoveryLimit===undefined?3:a.modelRecoveryLimit;
  if(typeof toolCorrectionLimit!=='number'||!Number.isSafeInteger(toolCorrectionLimit)||toolCorrectionLimit<0||toolCorrectionLimit>5||typeof modelRecoveryLimit!=='number'||!Number.isSafeInteger(modelRecoveryLimit)||modelRecoveryLimit<0||modelRecoveryLimit>3)throw Error('invalid');
  return {toolCorrectionLimit,modelRecoveryLimit,analysisModel:a.analysisModel as NonNullable<IndependentBrowserAnalysisOptions['analysisModel']>,judgmentReviewAllowed:a.judgmentReviewAllowed,...(a.metricAssetDisclosureAllowed===undefined?{}:{metricAssetDisclosureAllowed:a.metricAssetDisclosureAllowed as boolean})};
 }catch{throw Object.assign(Error('WEB_ANALYSIS_CONFIGURATION_INVALID'),{code:'WEB_ANALYSIS_CONFIGURATION_INVALID'});}
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
export async function startIndependentBrowserService(root:string,options:Readonly<{providerAccess?:Readonly<{credentials:Pick<ReturnType<typeof createApprovedProviderCredentials>,'withCredential'>;authorizeModelUse:()=>Promise<void>;fetch:typeof globalThis.fetch}>;metricFactoryModel?:MetricModelAccess;researchBundle?:{programRoot:string;manifestSha256:string;fixtureModule?:string;credentialEnvironment?:Readonly<Record<string,string>>;authorize?:Parameters<typeof createPersonalResearchRuntime>[0]['authorize']};decisionPlatform?:ReturnType<typeof createPersonalDecisionRuntime>;metricAssetDisclosureAllowed?:boolean;deployment?:Readonly<{resourcesRoot:string;credentialHelper:string}>}> & IndependentBrowserAnalysisOptions={}){
 const analysisModel=options.analysisModel??'MiniMax-M3';
 for(const [value,max]of [[options.toolCorrectionLimit,5],[options.modelRecoveryLimit,3]])if(value!==undefined&&(!Number.isSafeInteger(value)||value<0||value>max!))throw Error('WEB_ANALYSIS_CONFIGURATION_INVALID');
 if(!['MiniMax-M3','mimo-v2.6-flash','deepseek-flash'].includes(analysisModel))throw Error('WEB_ANALYSIS_MODEL_INVALID');
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
 const settings=createProviderSettings({store:credentialStore,probe:createPiCredentialProbe({projectRoot:directory,...(options.providerAccess?{fetch:options.providerAccess.fetch}:{})})});
 const metricFactory=readPersonalMetricDeployment(resources,paths.userData,options.metricFactoryModel??createPersonalMetricModel({settings,directory:join(paths.userData,'metric-factory/workspace-owner'),authorized:()=>readPersonalMetricTrialGrant(join(paths.userData,'metric-factory/model-grant.json'))}));
 const reportStudio=await readPersonalReportStudioDeployment({resourcesRoot:resources,userData:paths.userData});
 const closeResources=createReportStudioAwareShutdown({...(reportStudio.state==='configured'?{studio:async()=>{await options.decisionPlatform?.close();await reportStudio.runtime.close();}}:options.decisionPlatform?{studio:()=>options.decisionPlatform!.close()}:{}),server:async()=>{await research?.close();await server?.close();},workspace:async()=>{await manager?.close();},release:()=>{settings.close();identity.close();}});
 const close=async()=>{await research?.assertIdle();await metricFactory?.close();await closeResources();};
 try{
  const toolchain=await readIndependentWebToolchain(join(resources,deployment?'toolchain-deployment.json':'xanthil-toolchain-deployment.json'));
  researchPython=toolchain.pythonExecutable;
  const policy=createLocalMembershipPolicyStore(paths.userData);await policy.initializeApproved();
  const credentials=createApprovedProviderCredentials({backupStore:credentialStore});
  const openModel={analysisModel,...(options.toolCorrectionLimit===undefined?{}:{toolCorrectionLimit:options.toolCorrectionLimit}),...(options.modelRecoveryLimit===undefined?{}:{modelRecoveryLimit:options.modelRecoveryLimit}),credentials:options.providerAccess?.credentials??credentials,...(options.providerAccess?{fetch:options.providerAccess.fetch}:{}),authorizeModelUse:options.providerAccess?.authorizeModelUse??(async()=>{await credentials.refresh(true);}),metricAssetDisclosureAllowed:options.metricAssetDisclosureAllowed===true,judgmentReview:options.judgmentReviewAllowed===true,documentReader:await readIndependentWebDocumentReaders(join(resources,'document-readers-deployment.json'),toolchain.pythonExecutable)};
  manager=await createPersonalBrowserServiceWorkspace({...(options.decisionPlatform?{decisionPlatform:options.decisionPlatform}:{}),...(reportStudio.state==='configured'?{reportStudio:reportStudio.runtime}:{}),originDirectory:paths.userData,projectsRoot:paths.projects,toolchain,openModel,model:{access:settings.access,policy}});
  server=await startBrowserMembershipServer({metricFactory,...(research?{deepResearch:{task:(projectId:string,taskId:string,checkControl:()=>void)=>research.task({...manager!.researchContext(projectId,taskId),checkControl})}}:{}),...(options.decisionPlatform?{decisionPlatform:{project:manager.decisionProject}}:{}),reportStudio:reportStudio.state==='configured'?{runtime:reportStudio.runtime,project:manager.reportStudioProject}:{unavailable:reportStudio.state},store:manager.store,workspace:manager.workspace,open:manager.open,service:{credential:identity.credential,check:identity.check,stop:close,projects:manager.projects,receipt:manager.receipt,select:async(...args:Parameters<NonNullable<typeof manager>['select']>)=>{await research?.assertIdle();return manager!.select(...args);},settings:settings.request}});
  if(reportStudio.state==='configured')reportStudio.runtime.connectOwner(createPersonalReportStudioOwner({origin:()=>{if(!server)throw Object.assign(Error('RS_OWNER_UNAVAILABLE'),{code:'RS_OWNER_UNAVAILABLE'});return server.origin;},project:manager.reportStudioOriginal}));
  identity.publish(server.origin);return {origin:server.origin,close,lifecycle:async()=>reportStudio.state==='configured'?reportStudio.runtime.lifecycle():{intent:'none' as const,pending:false,request_count:0,configuration_unknown:false,operations:[]},exitIntent:async(intent:'wait'|'stop'|'cancel')=>reportStudio.state==='configured'?reportStudio.runtime.exitIntent(intent):undefined,async open(){const response=await fetch(server!.origin+'/v1/service/open',{method:'POST',headers:{'x-xanthil-service':identity.credential,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000),redirect:'error'});if(!response.ok)throw Error('WEB_OPEN_UNAVAILABLE');const value=closed(await response.json(),['token']);if(typeof value.token!=='string'||! /^[a-f0-9]{64}$/.test(value.token))throw Error('WEB_OPEN_UNAVAILABLE');return server!.origin+'/#'+value.token;}};
 }catch(error){await close();throw error;}
}
