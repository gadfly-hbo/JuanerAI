import { randomUUID } from 'node:crypto';
import { access, lstat, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { isAbsolute } from 'node:path';
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

function capability(value: unknown): ProjectDirectoryCapability {
  const selected = exactRecord(value, ['projectRoot', 'display_name']);
  if (typeof selected.projectRoot !== 'string' || typeof selected.display_name !== 'string' || selected.display_name.length === 0) failure('VALIDATION_FAILED');
  return Object.freeze({ projectRoot: selected.projectRoot, display_name: selected.display_name });
}

export function composePersonalXanthilDesktopProfile(dependencies:unknown){
  exactRecord(dependencies,['store','analysisExecution','runEvidenceStore','assistanceRuntime','clock','deadlineScheduler']);
  return createXanthilDesktopDecisionCaseApplication(dependencies);
}

/** The deployment capability is Main-owned, never an IPC/Renderer path. */
export function createPersonalXanthilDesktopProfile(deployment: unknown) {
  const configured = exactRecord(deployment, ['toolchainDeployment','assistanceConfig','clock','deadlineScheduler']);
  const assistanceRuntime=configured.assistanceConfig===null?null:createPiDecisionAssistanceRuntime(configured.assistanceConfig);
  if (typeof configured.clock !== 'function') failure('VALIDATION_FAILED');
  const clock = configured.clock as Clock;
  const location=exactRecord(configured.toolchainDeployment,['descriptor_path']);
  if(typeof location.descriptor_path!=='string'||!isAbsolute(location.descriptor_path))failure('VALIDATION_FAILED');
  const descriptorPath=location.descriptor_path;
  const schedule=exactRecord(configured.deadlineScheduler,['schedule']);if(typeof schedule.schedule!=='function')failure('VALIDATION_FAILED');
  async function configuredAnalysis(){
    try{
      const stat=await lstat(descriptorPath);if(!stat.isFile()||stat.isSymbolicLink())failure('TOOLCHAIN_UNAVAILABLE');
      const descriptor=exactRecord(JSON.parse(await readFile(descriptorPath,'utf8')),['schema_version','duckdb','python']);if(descriptor.schema_version!=='1.0')failure('TOOLCHAIN_UNAVAILABLE');
      const duckdb=exactRecord(descriptor.duckdb,['executable_path','version']),python=exactRecord(descriptor.python,['executable_path','version']);
      if(typeof duckdb.executable_path!=='string'||!isAbsolute(duckdb.executable_path)||typeof python.executable_path!=='string'||!isAbsolute(python.executable_path)||duckdb.version!=='1.5.2'||typeof python.version!=='string'||!/^3\.(?:9|[1-9][0-9]+)\.[0-9]+$/.test(python.version))failure('TOOLCHAIN_UNAVAILABLE');
      for(const path of [duckdb.executable_path,python.executable_path])await access(path,constants.X_OK);
      const execute=promisify(execFile),options={timeout:30000,maxBuffer:4096,env:{PATH:''},encoding:'utf8' as const};
      const duck=await execute(duckdb.executable_path,['--version'],options),py=await execute(python.executable_path,['--version'],options);
      if(/^v?(\d+\.\d+\.\d+)(?:\s|$)/.exec(duck.stdout.trim())?.[1]!==duckdb.version||/^Python (\d+\.\d+\.\d+)(?:\s|$)/.exec(py.stdout.trim())?.[1]!==python.version)failure('TOOLCHAIN_UNAVAILABLE');
      return createDuckDbPythonDesktopLocalAnalysisExecution({duckdbExecutable:duckdb.executable_path,duckdbVersion:duckdb.version,pythonExecutable:python.executable_path,pythonVersion:python.version});
    }catch{failure('TOOLCHAIN_UNAVAILABLE');}
  }

  async function openProject(request: unknown) {
    const input = exactRecord(request, ['contract_version', 'projectDirectoryCapability', 'display_name', 'command_id']);
    if (input.contract_version !== '1.0' || typeof input.command_id !== 'string' || input.command_id.length === 0 || typeof input.display_name !== 'string') failure('VALIDATION_FAILED');
    const selected = capability(input.projectDirectoryCapability);
    if (input.display_name !== selected.display_name) failure('VALIDATION_FAILED');
    const store = createLocalDesktopDecisionCaseStore({ projectRoot: selected.projectRoot });
    let execution:ReturnType<typeof createDuckDbPythonDesktopLocalAnalysisExecution>|undefined;
    const analysisExecution=Object.freeze({
      async describeImplementation(input:unknown){execution=undefined;execution=await configuredAnalysis();return execution.describeImplementation(input);},
      async calculate(input:unknown){if(!execution)failure('TOOLCHAIN_UNAVAILABLE');return execution.calculate(input);},
      async verify(input:unknown){if(!execution)failure('TOOLCHAIN_UNAVAILABLE');return execution.verify(input);},
    });
    const application = composePersonalXanthilDesktopProfile({ store,analysisExecution,runEvidenceStore:createLocalDesktopRunEvidenceStore({projectRoot:selected.projectRoot}),assistanceRuntime, clock,deadlineScheduler:configured.deadlineScheduler });
    const opened = await application.openProject({
      contract_version: '1.0',
      command_id: input.command_id,
      proposed_project_id: randomUUID(),
      display_name: selected.display_name,
    });
    const sessions = await application.listSessions({ project_id: opened.project_id });
    const value: ProjectOpenValue = Object.freeze({
      project: Object.freeze({ project_id: opened.project_id, display_name: opened.display_name, schema_version: '1.0', write_state: 'ready' }),
      sessions,
    });
    return Object.freeze({ application, value });
  }

  return Object.freeze({ openProject });
}
