import {createMembershipTaskApplication} from '../../packages/application/member-task.ts';
import {createLocalMembershipTaskStore} from '../../adapters/storage-local/member-task.ts';
import {resourceProfile} from '../../packages/product-core/member-task.ts';
import {createLocalModelAccess} from '../../packages/application/provider-settings.ts';
import {createPiStoredCaseAssistantRuntime} from '../../adapters/agent-pi/xiaomi-local.ts';
import type {createProviderSettings} from '../../packages/application/provider-settings.ts';
import { createCaseAssistantApplication } from '../../packages/application/case-assistant.ts';
import { createLocalCaseAssistantStore } from '../../adapters/storage-local/case-assistant.ts';
import { createPiCaseAssistantRuntime, validateXiaomiActivationPolicy, XIAOMI_CREDIT_RESERVATION } from '../../adapters/agent-pi/case-assistant.ts';
import type { AssistantConfig } from '../../packages/contracts/case-assistant.ts';
import { createHash, randomUUID } from 'node:crypto';
import { access, lstat, readFile, readdir, readlink, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { createLocalDesktopDecisionCaseStore, createLocalDesktopRunEvidenceStore } from '../../adapters/storage-local/xanthil-desktop-decision-case.ts';
import { createDuckDbPythonDesktopLocalAnalysisExecution } from '../../adapters/analytics-duckdb/xanthil-desktop-decision-case.ts';
import { createPiDecisionAssistanceRuntime } from '../../adapters/agent-pi/local-analysis.ts';
import { createXanthilDesktopDecisionCaseApplication } from '../../packages/application/xanthil-desktop-decision-case.ts';
import type { ProjectOpenValue } from '../../packages/contracts/xanthil-desktop-ipc.ts';

type Clock = () => Date;
type ProjectDirectoryCapability = Readonly<{ projectRoot: string; display_name: string }>;

function failure(code: string): never {
  const error = Object.assign(new Error(code), { code });
  error.stack = code;
  throw error;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactRecord(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!record(value) || Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) failure('VALIDATION_FAILED');
  return value;
}

/** Deployment inventory is package-local identity, not business data or user configuration. */
async function bundledExecutables(descriptor: Record<string, unknown>, descriptorPath: string) {
  const root = await realpath(dirname(descriptorPath));
  function contained(path: string) {
    const rel = relative(root, path);
    if (rel === '' || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) failure('TOOLCHAIN_UNAVAILABLE');
  }
  function resource(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('toolchain/') || value.includes('\\') || value.split('/').some(x => !x || x === '.' || x === '..')) failure('TOOLCHAIN_UNAVAILABLE');
    const path = resolve(root, value); contained(path); return path;
  }
  if (!Array.isArray(descriptor.inventory) || descriptor.inventory.length === 0) failure('TOOLCHAIN_UNAVAILABLE');
  const expected = new Map<string, Record<string, unknown>>();
  for (const raw of descriptor.inventory) {
    if (!record(raw)) failure('TOOLCHAIN_UNAVAILABLE');
    resource(raw.path);
    if (typeof raw.path !== 'string' || expected.has(raw.path)) failure('TOOLCHAIN_UNAVAILABLE');
    expected.set(raw.path, raw);
  }
  const seen = new Set<string>();
  async function inspect(path: string): Promise<void> {
    contained(await realpath(path));
    const stat = await lstat(path), key = relative(root, path).split(sep).join('/');
    if (stat.isDirectory()) {
      for (const name of await readdir(path)) await inspect(join(path, name));
      return;
    }
    const entry = expected.get(key); if (!entry) failure('TOOLCHAIN_UNAVAILABLE');
    seen.add(key);
    if (stat.isSymbolicLink()) {
      exactRecord(entry, ['path','kind','target']);
      if (entry.kind !== 'symlink' || typeof entry.target !== 'string' || isAbsolute(entry.target) || await readlink(path) !== entry.target) failure('TOOLCHAIN_UNAVAILABLE');
    } else {
      exactRecord(entry, ['path','kind','bytes','sha256','mode']);
      if (!stat.isFile() || entry.kind !== 'file' || entry.bytes !== stat.size || entry.mode !== (stat.mode & 0o777) || createHash('sha256').update(await readFile(path)).digest('hex') !== entry.sha256) failure('TOOLCHAIN_UNAVAILABLE');
    }
  }
  await inspect(join(root, 'toolchain'));
  if (seen.size !== expected.size) failure('TOOLCHAIN_UNAVAILABLE');
  const duckdb = exactRecord(descriptor.duckdb, ['executable_path','version']), python = exactRecord(descriptor.python, ['executable_path','version']);
  for (const tool of [duckdb, python]) {
    const path = resource(tool.executable_path);
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) failure('TOOLCHAIN_UNAVAILABLE');
  }
  return { duckdb: { ...duckdb, executable_path: resource(duckdb.executable_path) }, python: { ...python, executable_path: resource(python.executable_path) } };
}

function capability(value: unknown): ProjectDirectoryCapability {
  const selected = exactRecord(value, ['projectRoot', 'display_name']);
  if (typeof selected.projectRoot !== 'string' || typeof selected.display_name !== 'string' || selected.display_name.length === 0) failure('VALIDATION_FAILED');
  return Object.freeze({ projectRoot: selected.projectRoot, display_name: selected.display_name });
}

export function composePersonalXanthilDesktopProfile(dependencies:unknown){
  exactRecord(dependencies,['store','analysisExecution','runEvidenceStore','assistanceRuntime','clock','deadlineScheduler',...(record(dependencies)&&Object.hasOwn(dependencies,'modelAccess')?['modelAccess']:[])]);
  return createXanthilDesktopDecisionCaseApplication(dependencies);
}

export async function readPersonalDesktopToolchain(descriptorPath:string){
    try{
      const stat=await lstat(descriptorPath);if(!stat.isFile()||stat.isSymbolicLink())failure('TOOLCHAIN_UNAVAILABLE');
      const raw=JSON.parse(await readFile(descriptorPath,'utf8'));
      if(!record(raw))failure('TOOLCHAIN_UNAVAILABLE');
      const bundled=raw.schema_version==='2.0';
      const descriptor=exactRecord(raw,bundled?['schema_version','duckdb','python','inventory']:['schema_version','duckdb','python']);
      if(!bundled&&descriptor.schema_version!=='1.0')failure('TOOLCHAIN_UNAVAILABLE');
      const tools=bundled?await bundledExecutables(descriptor,descriptorPath):descriptor;
      const duckdb=exactRecord(tools.duckdb,['executable_path','version']),python=exactRecord(tools.python,['executable_path','version']);
      if(typeof duckdb.executable_path!=='string'||!isAbsolute(duckdb.executable_path)||typeof python.executable_path!=='string'||!isAbsolute(python.executable_path)||duckdb.version!=='1.5.2'||typeof python.version!=='string'||!/^3\.(?:9|[1-9][0-9]+)\.[0-9]+$/.test(python.version))failure('TOOLCHAIN_UNAVAILABLE');
      for(const path of [duckdb.executable_path,python.executable_path])await access(path,constants.X_OK);
      const execute=promisify(execFile),options={timeout:30000,maxBuffer:4096,env:{PATH:''},encoding:'utf8' as const};
      const duck=await execute(duckdb.executable_path,['--version'],options),py=await execute(python.executable_path,['--version'],options);
      if(/^v?(\d+\.\d+\.\d+)(?:\s|$)/.exec(duck.stdout.trim())?.[1]!==duckdb.version||/^Python (\d+\.\d+\.\d+)(?:\s|$)/.exec(py.stdout.trim())?.[1]!==python.version)failure('TOOLCHAIN_UNAVAILABLE');
      return {duckdbExecutable:duckdb.executable_path,duckdbVersion:duckdb.version,pythonExecutable:python.executable_path,pythonVersion:python.version};
    }catch{failure('TOOLCHAIN_UNAVAILABLE');}
  }

/** The deployment capability is Main-owned, never an IPC/Renderer path. */
export function createPersonalXanthilDesktopProfile(deployment: unknown) {
  const configured = exactRecord(deployment, ['toolchainDeployment','assistanceConfig','clock','deadlineScheduler',...(record(deployment)&&Object.hasOwn(deployment,'caseAssistantConfig')?['caseAssistantConfig']:[]),...(record(deployment)&&Object.hasOwn(deployment,'providerSettings')?['providerSettings']:[]),...(record(deployment)&&Object.hasOwn(deployment,'membershipConfig')?['membershipConfig']:[])]);
  const providerSettings=configured.providerSettings as ReturnType<typeof createProviderSettings>|undefined;
  let caseAssistant: ReturnType<typeof createCaseAssistantApplication>|null=null;
  let membership:ReturnType<typeof createMembershipTaskApplication>|null=null;
  const memberConfig=configured.membershipConfig?exactRecord(configured.membershipConfig,['profile','synthetic']):null;const memberProfile=memberConfig?resourceProfile(memberConfig.profile):null;
  if(memberProfile?.activation!=='synthetic_only'&&memberConfig)failure('AUTHORITY_REQUIRED');
  const memberTransport=memberConfig?exactRecord(memberConfig.synthetic,['respond']):null;if(memberTransport&&typeof memberTransport.respond!=='function')failure('VALIDATION_FAILED');
  const memberRuntime=memberProfile?createPiCaseAssistantRuntime({provider:memberProfile.provider,model:memberProfile.model,max_input_bytes:memberProfile.max_input_bytes,max_output_tokens:memberProfile.call_output_tokens},memberTransport as {respond(payload:string):Promise<unknown>}):null;
  let modelEpoch=0;
  const applications=new Set<ReturnType<typeof composePersonalXanthilDesktopProfile>>();
  async function closeModelWork(){modelEpoch++;const previousMember=membership;await previousMember?.close();if(membership===previousMember)membership=null;for(const application of applications)application.closeModelWork();applications.clear();const previous=caseAssistant;await previous?.close();if(caseAssistant===previous)caseAssistant=null;}
  const assistantSetting=configured.caseAssistantConfig??null;
  const assistantConfig=assistantSetting===null?null:exactRecord(assistantSetting,['authorization','max_input_bytes','max_output_tokens',...(record(assistantSetting)&&Object.hasOwn(assistantSetting,'deployment')?['deployment']:[])]);
  const authorization:AssistantConfig|null=providerSettings?{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-pro',authorized:true,runtime_id:'pi',runtime_version:'0.84.2',adapter_version:'1.0',limits:{turns:8,execution_ms:300000,waiting_ms:120000,cost_microunits:8*XIAOMI_CREDIT_RESERVATION,turn_cost_microunits:XIAOMI_CREDIT_RESERVATION,currency:'XIAOMI_CREDITS'}}:assistantConfig?.authorization as AssistantConfig|null;
  const privateDeployment=assistantConfig?.deployment===undefined?null:exactRecord(assistantConfig.deployment,['policy','api_key']);
  const activation=privateDeployment?validateXiaomiActivationPolicy(privateDeployment.policy,privateDeployment.api_key):null;
  const runtimeDeployment=activation?{policy:activation,api_key:privateDeployment!.api_key as string}:undefined;
  // One deployment runtime owns the allowance across every opened Session/Project.
  const storedRuntime=providerSettings?createPiStoredCaseAssistantRuntime(()=>providerSettings.taskCredential()):null;
  const assistantRuntime=providerSettings?{async turn(input:Parameters<NonNullable<typeof storedRuntime>['turn']>[0]){const generation=providerSettings.status().generation;try{return await storedRuntime!.turn(input);}catch(error){providerSettings.reportTaskFailure(String((error as {code?:unknown}).code??''),generation);throw error;}}}:authorization?.authorized?createPiCaseAssistantRuntime({provider:authorization.provider,model:authorization.model,max_input_bytes:assistantConfig!.max_input_bytes,max_output_tokens:assistantConfig!.max_output_tokens},undefined,runtimeDeployment):null;
  const storedAssistance=providerSettings?createPiDecisionAssistanceRuntime({provider:'xiaomi-token-plan-cn',model_id:'mimo-v2.6-pro'},undefined,()=>providerSettings.taskCredential()):null;
  const assistanceRuntime=storedAssistance?{...storedAssistance,async executeAssistance(input:Parameters<typeof storedAssistance.executeAssistance>[0]){const generation=providerSettings!.status().generation;try{return await storedAssistance.executeAssistance(input);}catch(error){providerSettings!.reportTaskFailure(String((error as {code?:unknown}).code??''),generation);throw error;}}}:configured.assistanceConfig===null?null:createPiDecisionAssistanceRuntime(configured.assistanceConfig);
  const modelAccess=providerSettings?.access??createLocalModelAccess(!!authorization?.authorized||assistanceRuntime!==null||memberRuntime!==null);
  if (typeof configured.clock !== 'function') failure('VALIDATION_FAILED');
  const clock = configured.clock as Clock;
  const location=exactRecord(configured.toolchainDeployment,['descriptor_path']);
  if(typeof location.descriptor_path!=='string'||!isAbsolute(location.descriptor_path))failure('VALIDATION_FAILED');
  const descriptorPath=location.descriptor_path;
  const schedule=exactRecord(configured.deadlineScheduler,['schedule']);if(typeof schedule.schedule!=='function')failure('VALIDATION_FAILED');
  async function configuredAnalysis(){return createDuckDbPythonDesktopLocalAnalysisExecution(await readPersonalDesktopToolchain(descriptorPath));}

  async function openProject(request: unknown) {
    if(membership?.hasWork())failure('BUSY');
    const closing=closeModelWork(),epoch=modelEpoch;await closing;
    const guard=()=>{if(epoch!==modelEpoch)failure('INTERRUPTED');};
    const input = exactRecord(request, ['contract_version', 'projectDirectoryCapability', 'display_name', 'command_id']);
    if (input.contract_version !== '1.0' || typeof input.command_id !== 'string' || input.command_id.length === 0 || typeof input.display_name !== 'string') failure('VALIDATION_FAILED');
    const selected = capability(input.projectDirectoryCapability);
    if (input.display_name !== selected.display_name) failure('VALIDATION_FAILED');
    const projectLocation = await realpath(selected.projectRoot);
    if (activation && (projectLocation!==activation.project_root || Date.now()>=Date.parse(activation.expires_at))) failure('AUTHORITY_REQUIRED');
    const resources = dirname(descriptorPath);
    if (basename(resources) === 'Resources' && basename(dirname(resources)) === 'Contents') {
      const bundle = await realpath(dirname(dirname(resources)));
      const excluded = [bundle];
      for (const root of excluded) {
        const fromRoot = relative(root, projectLocation);
        if (fromRoot === '' || (!fromRoot.startsWith('..' + sep) && fromRoot !== '..' && !isAbsolute(fromRoot))) failure('FORBIDDEN');
      }
    }
    try { await access(projectLocation, constants.W_OK); } catch { failure('FORBIDDEN'); }
    guard();const store = createLocalDesktopDecisionCaseStore({ projectRoot: selected.projectRoot });
    let execution:ReturnType<typeof createDuckDbPythonDesktopLocalAnalysisExecution>|undefined;
    const analysisExecution=Object.freeze({
      async describeImplementation(input:unknown){execution=undefined;execution=await configuredAnalysis();return execution.describeImplementation(input);},
      async calculate(input:unknown){if(!execution)failure('TOOLCHAIN_UNAVAILABLE');return execution.calculate(input);},
      async verify(input:unknown){if(!execution)failure('TOOLCHAIN_UNAVAILABLE');return execution.verify(input);},
    });
    const application = composePersonalXanthilDesktopProfile({ store,analysisExecution,runEvidenceStore:createLocalDesktopRunEvidenceStore({projectRoot:selected.projectRoot}),assistanceRuntime, clock,deadlineScheduler:configured.deadlineScheduler,modelAccess });
    applications.add(application);
    const opened = await application.openProject({
      contract_version: '1.0',
      command_id: input.command_id,
      proposed_project_id: randomUUID(),
      display_name: selected.display_name,
    });
    const sessions = await application.listSessions({ project_id: opened.project_id });
    guard();
    const assistantStore=createLocalCaseAssistantStore({projectRoot: selected.projectRoot});
    const membershipStore=createLocalMembershipTaskStore(selected.projectRoot);
    caseAssistant=createCaseAssistantApplication({store:assistantStore,config:authorization??null,runtime:assistantRuntime,clock,modelAccess,membership:{store:membershipStore,desktop:application,sourceStore:store,profile:memberProfile,runtime:memberRuntime}});
    const openedAssistant=caseAssistant;await openedAssistant.reopen();guard();
    membership=createMembershipTaskApplication({desktop:application,project_id:opened.project_id,store:membershipStore,sourceStore:store,profile:memberProfile,runtime:memberRuntime,modelAccess,clock});await membership.reopen();guard();
    const value: ProjectOpenValue = Object.freeze({
      project: Object.freeze({ project_id: opened.project_id, display_name: opened.display_name, schema_version: '1.0', write_state: 'ready' }),
      sessions,
    });
    return Object.freeze({ application, value });
  }

  return Object.freeze({ hasModelWork:()=>[...applications].some(app=>app.hasModelWork())||!!caseAssistant?.hasWork()||!!membership?.hasWork(),closeModelWork, openProject, getCaseAssistant:()=>caseAssistant,getMembershipTask:()=>membership });
}

/** Main-only environment boundary; unconfigured behavior remains fail closed. */
export function loadPersonalCaseAssistantActivation(env: Readonly<Record<string,string|undefined>>) {
  if (!env.JUANERAI_CASE_ASSISTANT_ACTIVATION) return null;
  try {
    const policy=validateXiaomiActivationPolicy(JSON.parse(env.JUANERAI_CASE_ASSISTANT_ACTIVATION),env.XIAOMI_TOKEN_PLAN_CN_API_KEY);
    const authorization:AssistantConfig={provider:policy.provider,model:policy.model,authorized:true,runtime_id:'pi',runtime_version:'0.84.2',adapter_version:'1.0',limits:{turns:policy.requests,execution_ms:300000,waiting_ms:120000,cost_microunits:policy.requests*XIAOMI_CREDIT_RESERVATION,turn_cost_microunits:XIAOMI_CREDIT_RESERVATION,currency:'XIAOMI_CREDITS'}};
    return {authorization,max_input_bytes:12000,max_output_tokens:2048,deployment:{policy,api_key:env.XIAOMI_TOKEN_PLAN_CN_API_KEY!}};
  } catch {return null;}
}
