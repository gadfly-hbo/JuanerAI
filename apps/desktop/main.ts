import {installCollaborationClose} from './collaboration-window-close.ts';
import {developmentEndpoint, isDevelopmentFrame, prepareDevelopmentRoot, assertDevelopmentPath} from './development.ts';
import {createProviderSettings} from '../../packages/application/provider-settings.ts';
import {createMacOsCredentialStore} from '../../adapters/credentials-macos/index.ts';
import {probeLocalXiaomi} from '../../adapters/agent-pi/xiaomi-local.ts';
import { createCaseAssistantHandler } from './case-assistant-main.ts';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { open } from 'node:fs/promises';
import { constants } from 'node:fs';
import * as electron from 'electron';

import { validateXanthilDesktopRequest, type DesktopFailureCode, type ProjectOpenValue } from '../../packages/contracts/xanthil-desktop-ipc.ts';
import { createPersonalXanthilDesktopProfile, loadPersonalCaseAssistantActivation } from '../../profiles/personal/xanthil-desktop.ts';

const { app, BrowserWindow, ipcMain } = electron;
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
const developmentUrl = developmentEndpoint(app.isPackaged, typeof MAIN_WINDOW_VITE_DEV_SERVER_URL === 'undefined' ? undefined : MAIN_WINDOW_VITE_DEV_SERVER_URL);
const development = developmentUrl ? prepareDevelopmentRoot(process.env.JUANERAI_DESKTOP_DEV_ROOT ?? join(app.getPath('appData'), 'Xanthil Development')) : null;
if (development) {
  app.setName('Xanthil Development');
  app.setPath('userData', development.userData);
  app.setPath('sessionData', development.cache);
  app.setAppLogsPath(development.logs);
}

export type XanthilDesktopSenderPolicy = (sender: unknown) => boolean;

export type XanthilDesktopIpcFailure = Readonly<{
  ok: false;
  error: Readonly<{
    code: DesktopFailureCode;
    message: string;
    what_did_not_happen: string;
    preserved_authority: string;
    recovery_action: string;
  }>;
}>;

export type XanthilDesktopIpcSuccess = Readonly<{ ok: true; value: unknown }>;
export type XanthilDesktopIpcResult = XanthilDesktopIpcFailure | XanthilDesktopIpcSuccess;
export type XanthilDesktopIpcHandler = (sender: unknown, request: unknown) => Promise<XanthilDesktopIpcResult>;

export type XanthilDesktopIpcHandlers = Readonly<{
  selectProject: XanthilDesktopIpcHandler;
  listSessions: XanthilDesktopIpcHandler;
  openSession: XanthilDesktopIpcHandler;
  createSession: XanthilDesktopIpcHandler;
  createDraftRevision: XanthilDesktopIpcHandler;
  selectImportFiles: XanthilDesktopIpcHandler;
  confirmRevision: XanthilDesktopIpcHandler;
  startAnalysis: XanthilDesktopIpcHandler;
  cancelAnalysis: XanthilDesktopIpcHandler;
  prepareAssistanceDisclosure: XanthilDesktopIpcHandler;
  decideAssistanceDisclosure: XanthilDesktopIpcHandler;
  startAssistance: XanthilDesktopIpcHandler;
  cancelAssistance: XanthilDesktopIpcHandler;
  disposeAssistanceDraft: XanthilDesktopIpcHandler;
  acceptFinding: XanthilDesktopIpcHandler;
  saveForm: XanthilDesktopIpcHandler;
  completeCase: XanthilDesktopIpcHandler;
  exportReport: XanthilDesktopIpcHandler;
  readProjection: XanthilDesktopIpcHandler;
  waitForProjection: XanthilDesktopIpcHandler;
}>;

type Envelope = Readonly<Record<string, unknown>>;
type ActiveApplication = Readonly<{
  prepareAssistanceDisclosure(input:unknown):Promise<unknown>;
  decideAssistanceDisclosure(input:unknown):Promise<unknown>;
  startAssistance(input:unknown):Promise<unknown>;
  cancelAssistance(input:unknown):Promise<unknown>;
  disposeAssistanceDraft(input:unknown):Promise<unknown>;
  acceptFinding(input:unknown):Promise<unknown>;
  completeCase(input:unknown):Promise<unknown>;
  checkReportExport(input:unknown):Promise<unknown>;
  prepareReportExport(input:unknown):Promise<unknown>;
  recordReportExport(input:unknown):Promise<unknown>;
  createDraftRevision(input:unknown):Promise<unknown>;
  inspectImportFiles(input:unknown):Promise<unknown>;
  checkImportAdmission(input:unknown,kind:'inspect'|'confirm'):Promise<unknown|null>;
  confirmRevision(input:unknown):Promise<unknown>;
  startAnalysis(input:unknown):Promise<unknown>;
  cancelAnalysis(input:unknown):Promise<unknown>;
  createSession(input: unknown): Promise<unknown>;
  openSession(input: unknown): Promise<unknown>;
  saveForm(input: unknown): Promise<unknown>;
  waitForProjection(input: unknown): Promise<unknown>;
  listSessions(input: Readonly<{ project_id: string }>): Promise<unknown>;
  readProjection(input: Readonly<{ project_id: string; session_id: string; case_id: string; revision_id: string }>): Promise<unknown>;
}>;
type ProductionProfile = Readonly<{
  openProject(request: Envelope): Promise<unknown>;
}>;
type NativeDialogs = Readonly<{
  selectProject(): Promise<unknown | null>;
  selectImportFiles():Promise<unknown|null>;
  selectExportFile():Promise<unknown|null>;
}>;
type SourceReader=Readonly<{readSelectedFiles(capability:unknown):Promise<unknown>}>;
type ExportWriter=Readonly<{writeAndReadBack(capability:unknown,bytes:Uint8Array):Promise<unknown>}>;
type MainDependencies = Readonly<{
  productionProfile: ProductionProfile;
  nativeDialogs: NativeDialogs;
  senderPolicy: XanthilDesktopSenderPolicy;
  sourceReader:SourceReader;
  exportWriter:ExportWriter;
}>;

const CONTRACT_VERSION = '1.0';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const knownFailureCodes = new Set<DesktopFailureCode>([
  'INVALID_REQUEST', 'FORBIDDEN', 'NOT_FOUND', 'STALE_REVISION', 'COMMAND_CONFLICT',
  'VALIDATION_FAILED', 'AUTHORITY_REQUIRED', 'ISSUE_CONFIRMATION_REQUIRED', 'BUSY',
  'STORE_BUSY', 'RESULT_PENDING', 'SCHEMA_UNSUPPORTED', 'INTEGRITY_BLOCKED',
  'SOURCE_CHANGED', 'TOOLCHAIN_UNAVAILABLE', 'CALCULATION_FAILED', 'VALIDATION_MISMATCH',
  'RUN_ARTIFACT_FAILED', 'PUBLICATION_FAILED', 'PAYLOAD_STALE', 'PROVIDER_UNAVAILABLE',
  'CANCELLED', 'DEADLINE_EXCEEDED', 'INTERRUPTED',
]);

function failure(code: DesktopFailureCode): XanthilDesktopIpcFailure {
  const guidance: Record<DesktopFailureCode, readonly [string, string]> = {
    INVALID_REQUEST: ['请求格式或字段不符合当前接口。', '检查输入，返回当前页面重新发起明确操作。'],
    FORBIDDEN: ['当前状态或调用来源不允许这项操作。', '返回当前项目中允许的操作；不要绕过状态或来源限制。'],
    NOT_FOUND: ['未找到属于当前项目的会话或记录。', '重新选择项目并打开已有会话，核对当前记录。'],
    STALE_REVISION: ['当前修订或记录版本已变化，本次输入已过期。', '重新打开当前会话，核对最新修订后再明确操作。'],
    COMMAND_CONFLICT: ['同一命令标识已绑定不同的操作内容。', '重新打开项目核对原结果；不要用同一命令改写内容。'],
    VALIDATION_FAILED: ['输入未满足当前操作的有效性要求。', '检查必填字段、取值和当前数据预览，修正后再确认。'],
    AUTHORITY_REQUIRED: ['尚未确认对所选数据的使用权限。', '仅在确有数据使用权限时明确确认，否则取消。'],
    ISSUE_CONFIRMATION_REQUIRED: ['问题处置或计算计划尚未得到完整确认。', '核对当前预览中的问题和计划，逐项确认后继续。'],
    BUSY: ['当前修订已有运行中的分析或辅助请求。', '等待当前操作结束，或明确取消；不会排队或自动重试。'],
    STORE_BUSY: ['项目存储正被其他写入占用。', '关闭其他写入此项目的操作，再重新打开项目核对状态。'],
    RESULT_PENDING: ['提交结果尚未确认，需要核对持久记录。', '不要重发或清理；重新打开项目以核对已提交收据。'],
    SCHEMA_UNSUPPORTED: ['所选项目的存储格式或版本不受当前应用支持。', '选择受支持的项目，或另选新的空目录；不要覆盖、迁移或清理原目录。'],
    INTEGRITY_BLOCKED: ['项目记录或证据的完整性校验未通过。', '停止受影响操作并保留原文件，核对证据或寻求工程支持；不要自动修复。'],
    SOURCE_CHANGED: ['所选源文件、预览或确认配置已变化。', '重新选择或重新核对源文件与配置，生成新预览后再次确认。'],
    TOOLCHAIN_UNAVAILABLE: ['所需本地计算工具当前不可用。', '保留已有记录并核对已批准工具；不要自动安装或切换工具。'],
    CALCULATION_FAILED: ['本地计算未能正常完成。', '查看失败运行记录并检查已确认输入；修正原因后再明确启动新运行。'],
    VALIDATION_MISMATCH: ['独立计算结果未通过一致性核验。', '保留双方计算证据并核对差异；不要接受该结果或跳过核验。'],
    RUN_ARTIFACT_FAILED: ['运行证据文件未能完整写入或核验。', '保留运行和现有文件，核对证据后再决定下一步；不要清理或重发旧命令。'],
    PUBLICATION_FAILED: ['本地证据发布未能确认完成。', '保留已写入材料，重新打开项目核对状态；不要覆盖或自动重试。'],
    PAYLOAD_STALE: ['披露载荷、模型选择或当前修订已变化。', '重新生成并核对完整披露，明确确认后才能发送。'],
    PROVIDER_UNAVAILABLE: ['模型未配置或当前不可用；请继续手工编辑。', '保留已记录的披露与手工内容；不会自动重试或切换模型。'],
    CANCELLED: ['本次操作已取消。', '保留当前内容，按需重新选择；已发送的模型内容不能撤回。'],
    DEADLINE_EXCEEDED: ['操作已达到允许的时间上限。', '核对终态记录，继续手工工作；需要再次操作时必须明确发起，不自动重试。'],
    INTERRUPTED: ['上次操作因中断未能正常结束。', '重新打开项目核对终态与证据，继续手工工作；不会自动恢复或重发。'],
  };
  return Object.freeze({
    ok: false,
    error: Object.freeze({
      code,
      message: guidance[code][0],
      what_did_not_happen: code === 'PROVIDER_UNAVAILABLE' ? '本次未创建 Attempt，也未调用模型或发送披露载荷。' : code === 'SCHEMA_UNSUPPORTED' ? '未将该存储初始化、迁移或覆盖为新项目。' : '本次没有返回成功确认，不会自动重试；失败不表示先前读取或写入从未发生。',
      preserved_authority: code === 'SCHEMA_UNSUPPORTED' ? '原目录及其现有字节保留，不将其当作空项目。' : '已提交记录及原始证据以持久存储为准；保留已有材料，不自动清理或回滚。',
      recovery_action: guidance[code][1],
    }),
  });
}

function success(value: unknown): XanthilDesktopIpcSuccess {
  return Object.freeze({ ok: true, value });
}

function isEnvelope(value: unknown): value is Envelope {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasVersionOneEnvelope(value: unknown): value is Envelope {
  return isEnvelope(value) && value.contract_version === CONTRACT_VERSION;
}

function hasCommandEnvelope(value: unknown): boolean {
  return hasVersionOneEnvelope(value) && typeof value.command_id === 'string' && UUID_V4.test(value.command_id);
}

function hasReadEnvelope(value: unknown): boolean {
  return hasVersionOneEnvelope(value) && !Object.hasOwn(value, 'command_id');
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function failureFrom(error: unknown): XanthilDesktopIpcFailure {
  const candidate = error as Readonly<{ code?: unknown; message?: unknown }>;
  const code = typeof candidate.code === 'string'
    ? candidate.code
    : typeof candidate.message === 'string' ? candidate.message : 'INTEGRITY_BLOCKED';
  if(code==='CONFIGURATION_CHANGED')return failure('PAYLOAD_STALE');
  if(['KEYCHAIN_UNAVAILABLE','MODEL_NOT_CONFIGURED','CREDENTIAL_INVALID','MODEL_BUSY'].includes(code))return failure('PROVIDER_UNAVAILABLE');
  return failure(knownFailureCodes.has(code as DesktopFailureCode) ? code as DesktopFailureCode : 'INTEGRITY_BLOCKED');
}

function senderPolicyFrom(dependencies: unknown): MainDependencies {
  if (!record(dependencies)) throw new Error('Main dependencies must be exactly {productionProfile,nativeDialogs,sourceReader,exportWriter,senderPolicy}.');
  const keys = Object.keys(dependencies).sort();
  if (keys.join('|') !== 'exportWriter|nativeDialogs|productionProfile|senderPolicy|sourceReader'
    || !record(dependencies.productionProfile)
    || typeof dependencies.productionProfile.openProject !== 'function'
    || !record(dependencies.nativeDialogs)
    || typeof dependencies.nativeDialogs.selectProject !== 'function'
    || typeof dependencies.nativeDialogs.selectImportFiles !== 'function'
    || typeof dependencies.nativeDialogs.selectExportFile !== 'function'
    || !record(dependencies.sourceReader)||typeof dependencies.sourceReader.readSelectedFiles!=='function'
    || !record(dependencies.exportWriter)||typeof dependencies.exportWriter.writeAndReadBack!=='function'
    || typeof dependencies.senderPolicy !== 'function') {
    throw new Error('Main dependencies must be exactly {productionProfile,nativeDialogs,sourceReader,exportWriter,senderPolicy}.');
  }
  return Object.freeze({
    productionProfile: dependencies.productionProfile as ProductionProfile,
    nativeDialogs: dependencies.nativeDialogs as NativeDialogs,
    senderPolicy: dependencies.senderPolicy as XanthilDesktopSenderPolicy,
    sourceReader:dependencies.sourceReader as SourceReader,
    exportWriter:dependencies.exportWriter as ExportWriter,
  });
}

function inactiveCommand(senderPolicy: XanthilDesktopSenderPolicy): XanthilDesktopIpcHandler {
  return async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasCommandEnvelope(request)) return failure('INVALID_REQUEST');
    return failure('FORBIDDEN');
  };
}

function inactiveRead(senderPolicy: XanthilDesktopSenderPolicy): XanthilDesktopIpcHandler {
  return async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasReadEnvelope(request)) return failure('INVALID_REQUEST');
    return failure('FORBIDDEN');
  };
}

function selectedProjectDisplayName(capability: unknown): string {
  if (record(capability) && typeof capability.display_name === 'string' && capability.display_name.length > 0) return capability.display_name;
  return 'Selected Project';
}

function isProjectOpenValue(value: unknown): value is ProjectOpenValue {
  if (!record(value) || Object.keys(value).length !== 2 || !Object.hasOwn(value, 'project') || !Object.hasOwn(value, 'sessions') || !record(value.project) || !Array.isArray(value.sessions)) return false;
  const project = value.project;
  return Object.keys(project).length === 4
    && project.schema_version === '1.0'
    && project.write_state === 'ready'
    && typeof project.project_id === 'string'
    && typeof project.display_name === 'string';
}

function applicationFrom(value: unknown): Readonly<{ application: ActiveApplication; value: ProjectOpenValue }> | undefined {
  if (!record(value) || !record(value.application) || typeof value.application.listSessions !== 'function' || typeof value.application.readProjection !== 'function' || !isProjectOpenValue(value.value)) return undefined;
  return Object.freeze({ application: value.application as ActiveApplication, value: value.value });
}

/** U1 activates Session creation, case fields and scoped reads after Project selection. */
export function createXanthilDesktopIpcHandlers(dependencies: unknown): XanthilDesktopIpcHandlers {
  const { productionProfile, nativeDialogs,sourceReader,exportWriter, senderPolicy } = senderPolicyFrom(dependencies);
  let activeApplication: ActiveApplication | undefined;
  const uncertainExports=new Map<string,string>();
  const activeExports=new Map<string,string>();
  const selections=new Map<string,{token:string;guard:string;capability:unknown}>();
  const ownerKey=(request:Record<string,unknown>)=>JSON.stringify([request.project_id,request.session_id,request.case_id,request.revision_id]);
  const guardKey=(request:Record<string,unknown>)=>JSON.stringify([ownerKey(request),request.expected_row_version]);

  const selectProject: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasCommandEnvelope(request)) return failure('INVALID_REQUEST');
    try {
      const command = validateXanthilDesktopRequest('selectProject', request);
      const capability = await nativeDialogs.selectProject();
      if (capability === null) return failure('FORBIDDEN');
      const displayName = selectedProjectDisplayName(capability);
      const result = await productionProfile.openProject(Object.freeze({
        contract_version: command.contract_version,
        projectDirectoryCapability: capability,
        display_name: displayName,
        command_id: command.command_id,
      }));
      const admitted = applicationFrom(result);
      if (admitted === undefined) throw Object.assign(new Error('INTEGRITY_BLOCKED'), { code: 'INTEGRITY_BLOCKED' });
      activeApplication = admitted.application;
      selections.clear();
      return success(admitted.value);
    } catch (error) {
      return failureFrom(error);
    }
  };

  const listSessions: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasReadEnvelope(request)) return failure('INVALID_REQUEST');
    if (activeApplication === undefined) return failure('NOT_FOUND');
    try {
      const query = validateXanthilDesktopRequest('listSessions', request);
      return success(await activeApplication.listSessions({ project_id: query.project_id }));
    } catch (error) {
      return failureFrom(error);
    }
  };

  const readProjection: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasReadEnvelope(request)) return failure('INVALID_REQUEST');
    if (activeApplication === undefined) return failure('NOT_FOUND');
    try {
      const query = validateXanthilDesktopRequest('readProjection', request);
      return success(await activeApplication.readProjection({
        project_id: query.project_id,
        session_id: query.session_id,
        case_id: query.case_id,
        revision_id: query.revision_id,
      }));
    } catch (error) {
      return failureFrom(error);
    }
  };

  const command = inactiveCommand(senderPolicy);
  const read = inactiveRead(senderPolicy);
  const createSession: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasCommandEnvelope(request)) return failure('INVALID_REQUEST');
    if (!activeApplication) return failure('NOT_FOUND');
    try { return success(await activeApplication.createSession(validateXanthilDesktopRequest('createSession', request))); }
    catch (error) { return failureFrom(error); }
  };
  const openSession: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasReadEnvelope(request)) return failure('INVALID_REQUEST');
    if (!activeApplication) return failure('NOT_FOUND');
    try { return success(await activeApplication.openSession(validateXanthilDesktopRequest('openSession', request))); }
    catch (error) { return failureFrom(error); }
  };
  const saveForm: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasCommandEnvelope(request)) return failure('INVALID_REQUEST');
    if (!activeApplication) return failure('NOT_FOUND');
    try { return success(await activeApplication.saveForm(validateXanthilDesktopRequest('saveForm', request))); }
    catch (error) { return failureFrom(error); }
  };
  const waitForProjection: XanthilDesktopIpcHandler = async (sender, request) => {
    if (!senderPolicy(sender)) return failure('FORBIDDEN');
    if (!hasReadEnvelope(request)) return failure('INVALID_REQUEST');
    if (!activeApplication) return failure('NOT_FOUND');
    try { const query = validateXanthilDesktopRequest('waitForProjection', request); return success(await activeApplication.waitForProjection({ project_id: query.project_id, session_id: query.session_id, case_id: query.case_id, revision_id: query.revision_id, projection_token: query.projection_token })); }
    catch (error) { return failureFrom(error); }
  };
  const selectImportFiles:XanthilDesktopIpcHandler=async(sender,request)=>{
    if(!senderPolicy(sender))return failure('FORBIDDEN');if(!hasReadEnvelope(request))return failure('INVALID_REQUEST');if(!activeApplication)return failure('NOT_FOUND');
    try{
      const application=activeApplication,valid=validateXanthilDesktopRequest('selectImportFiles',request),key=ownerKey(valid),guard=guardKey(valid);let capability:unknown;
      await application.checkImportAdmission(valid,'inspect');
      if(activeApplication!==application)return failure('STALE_REVISION');
      if('inspection_token'in valid){const previous=selections.get(key);if(!previous||previous.token!==valid.inspection_token||previous.guard!==guard)return failure('SOURCE_CHANGED');capability=previous.capability;}
      else{selections.delete(key);capability=await nativeDialogs.selectImportFiles();}
      if(activeApplication!==application)return failure('STALE_REVISION');
      if(capability===null)return failure('CANCELLED');
      await application.checkImportAdmission(valid,'inspect');
      if(activeApplication!==application)return failure('STALE_REVISION');
      selections.delete(key);const source_files=await sourceReader.readSelectedFiles(capability);
      if(activeApplication!==application)return failure('STALE_REVISION');
      const inspection=await application.inspectImportFiles({...valid,source_files});
      if(activeApplication!==application)return failure('STALE_REVISION');
      if(!record(inspection)||typeof inspection.inspection_token!=='string')return failure('INTEGRITY_BLOCKED');
      selections.set(key,{token:inspection.inspection_token,guard,capability});return success(inspection);
    }catch(error){return failureFrom(error);}
  };
  const confirmRevision:XanthilDesktopIpcHandler=async(sender,request)=>{
    if(!senderPolicy(sender))return failure('FORBIDDEN');if(!hasCommandEnvelope(request))return failure('INVALID_REQUEST');if(!activeApplication)return failure('NOT_FOUND');
    try{
      const application=activeApplication,valid=validateXanthilDesktopRequest('confirmRevision',request);
      const replay=await application.checkImportAdmission(valid,'confirm');
      if(activeApplication!==application)return failure('STALE_REVISION');
      if(replay!==null)return success(replay);
      const selected=selections.get(ownerKey(valid));
      if(!selected||selected.token!==valid.inspection_token||selected.guard!==guardKey(valid))return failure('SOURCE_CHANGED');
      const source_files=await sourceReader.readSelectedFiles(selected.capability);
      if(activeApplication!==application)return failure('STALE_REVISION');
      const confirmed=await application.confirmRevision({...valid,source_files});
      if(activeApplication!==application)return failure('STALE_REVISION');
      return success(confirmed);
    }catch(error){return failureFrom(error);}
  };
  const guardedAnalysisCommand=(method:'createDraftRevision'|'startAnalysis'|'cancelAnalysis'|'acceptFinding'|'completeCase'|'decideAssistanceDisclosure'|'startAssistance'|'cancelAssistance'|'disposeAssistanceDraft'):XanthilDesktopIpcHandler=>async(sender,request)=>{
    if(!senderPolicy(sender))return failure('FORBIDDEN');if(!hasCommandEnvelope(request))return failure('INVALID_REQUEST');if(!activeApplication)return failure('NOT_FOUND');
    try{const valid=validateXanthilDesktopRequest(method,request);const result=await activeApplication[method](valid);if(method==='createDraftRevision')selections.delete(ownerKey(valid));return success(result);}catch(error){return failureFrom(error);}
  };
  const prepareAssistanceDisclosure:XanthilDesktopIpcHandler=async(sender,request)=>{
    if(!senderPolicy(sender))return failure('FORBIDDEN');if(!hasReadEnvelope(request))return failure('INVALID_REQUEST');if(!activeApplication)return failure('NOT_FOUND');
    try{return success(await activeApplication.prepareAssistanceDisclosure(validateXanthilDesktopRequest('prepareAssistanceDisclosure',request)));}catch(error){return failureFrom(error);}
  };
  const exportReport:XanthilDesktopIpcHandler=async(sender,request)=>{
    if(!senderPolicy(sender))return failure('FORBIDDEN');if(!hasCommandEnvelope(request))return failure('INVALID_REQUEST');if(!activeApplication)return failure('NOT_FOUND');
    let attempted=false,commandId='',admitted=false;
    try{
      const command=validateXanthilDesktopRequest('exportReport',request);commandId=command.command_id;
      const intent=JSON.stringify([command.contract_version,command.project_id,command.session_id,command.case_id,command.revision_id,command.report_id]);
      const existing=activeExports.get(commandId)??uncertainExports.get(commandId);
      if(existing!==undefined&&existing!==intent)return failure('COMMAND_CONFLICT');
      if(activeExports.has(commandId))return failure('RESULT_PENDING');
      // Claim the precise local command before the first asynchronous boundary.
      activeExports.set(commandId,intent);admitted=true;
      const prior=await activeApplication.checkReportExport(command);if(prior!==null)return success(prior);
      if(uncertainExports.has(commandId))return failure('RESULT_PENDING');
      const selected=await nativeDialogs.selectExportFile();if(selected===null)return failure('CANCELLED');
      if(!record(selected)||Object.keys(selected).sort().join('|')!=='capability|display_name|format'||typeof selected.display_name!=='string'||/[/\\\u0000-\u001f]/.test(selected.display_name)||(selected.format!=='markdown'&&selected.format!=='html')||!selected.display_name.endsWith(selected.format==='markdown'?'.md':'.html'))return failure('VALIDATION_FAILED');
      const prepared=await activeApplication.prepareReportExport({command_id:commandId,project_id:command.project_id,session_id:command.session_id,case_id:command.case_id,revision_id:command.revision_id,report_id:command.report_id,format:selected.format});
      if(!record(prepared)||!(prepared.bytes instanceof Uint8Array)||prepared.report_id!==command.report_id||prepared.media_type!==(selected.format==='markdown'?'text/markdown;charset=utf-8':'text/html;charset=utf-8')||prepared.sha256!==createHash('sha256').update(prepared.bytes).digest('hex')||prepared.byte_length!==String(prepared.bytes.length))return failure('INTEGRITY_BLOCKED');
      attempted=true;uncertainExports.set(commandId,intent);const actual=await exportWriter.writeAndReadBack(selected.capability,prepared.bytes);
      if(!record(actual)||Object.keys(actual).sort().join('|')!=='byte_length|sha256'||actual.sha256!==prepared.sha256||actual.byte_length!==prepared.byte_length)throw Object.assign(new Error('INTEGRITY_BLOCKED'),{code:'INTEGRITY_BLOCKED'});
      const result=await activeApplication.recordReportExport({command,prepared,descriptor:{display_name:selected.display_name,media_type:prepared.media_type,sha256:actual.sha256,byte_length:actual.byte_length}});uncertainExports.delete(commandId);return success(result);
    }catch(error){
      if(!attempted)return failureFrom(error);const result=failureFrom(error);
      return {ok:false,error:{...result.error,what_did_not_happen:'A successful export receipt was not confirmed. The selected file may have been partly or completely written.',preserved_authority:'Existing Finding, acceptance, Closure and report versions are unchanged; destination effects are retained without cleanup.',recovery_action:'Do not resend this command or overwrite the target. Reopen the Project to resolve a committed receipt; inspect any partial target before a new intentional export.'}};
    }finally{if(admitted)activeExports.delete(commandId);}
  };
  return Object.freeze({
    selectProject,
    listSessions,
    openSession,
    createSession,
    createDraftRevision: guardedAnalysisCommand('createDraftRevision'),
    selectImportFiles,
    confirmRevision,
    startAnalysis: guardedAnalysisCommand('startAnalysis'),
    cancelAnalysis: guardedAnalysisCommand('cancelAnalysis'),
    prepareAssistanceDisclosure,
    decideAssistanceDisclosure: guardedAnalysisCommand('decideAssistanceDisclosure'),
    startAssistance: guardedAnalysisCommand('startAssistance'),
    cancelAssistance: guardedAnalysisCommand('cancelAssistance'),
    disposeAssistanceDraft: guardedAnalysisCommand('disposeAssistanceDraft'),
    acceptFinding: guardedAnalysisCommand('acceptFinding'),
    saveForm,
    completeCase: guardedAnalysisCommand('completeCase'),
    exportReport,
    readProjection,
    waitForProjection,
  });
}

let mainWindow: electron.BrowserWindow | undefined;
let ipcHandlersRegistered = false;

type AssistantApplication=NonNullable<ReturnType<ReturnType<typeof createPersonalXanthilDesktopProfile>['getCaseAssistant']>>;
const childWindows=new Map<string,{window:electron.BrowserWindow;application:AssistantApplication}>();
const lostRenderers=new WeakSet<object>();
function fenceRendererLoss(window:electron.BrowserWindow,persist:()=>Promise<unknown>,committed:()=>boolean,after:()=>void){
 const contents=window.webContents; // BrowserWindow access can throw after native destruction.
 let pending=false,finished=false;
 const lost=()=>{if(committed()||finished||pending)return;lostRenderers.add(contents);pending=true;
  // Calling persist starts the Application's synchronous Abort/epoch fence now.
  void persist().then(()=>{finished=true;after();}).catch(()=>{pending=false;});
 };
 contents.on('render-process-gone',lost);contents.on('destroyed',lost);window.on('closed',lost);
}

function childSender(event:unknown,request:unknown,current:AssistantApplication|null):boolean{
 if(!record(event)||!record(request)||request.version!=='1.1'||typeof request.session_id!=='string')return false;
 const binding=childWindows.get(request.session_id);
 return !!binding&&!binding.window.isDestroyed()&&!lostRenderers.has(binding.window.webContents)&&binding.application===current&&event.sender===binding.window.webContents&&event.senderFrame===binding.window.webContents.mainFrame&&
 (!developmentUrl||isDevelopmentFrame(binding.window.webContents.mainFrame.url,developmentUrl))&&['read_collaboration','prepare','start','send','stop','close','return_result','focus_parent'].includes(String(request.operation));
}
async function openChildWindow(application:AssistantApplication,id:string,isCurrent:()=>boolean){
 const projection=await application.readCollaboration(id);
 if(!isCurrent()||!mainWindow)throw Object.assign(new Error('INTERRUPTED'),{code:'INTERRUPTED'});
 const life=await application.lifecycle(id);if(!life.open)await application.reopenSession(id,life.epoch);if(!isCurrent())throw Object.assign(new Error('INTERRUPTED'),{code:'INTERRUPTED'});
 const existing=childWindows.get(id);if(existing&&!existing.window.isDestroyed()&&existing.application===application){existing.window.focus();return {opened:true,session_id:id};}
 const window=new BrowserWindow({width:1366,height:768,useContentSize:true,title:`${projection.relation.kind==='fork'?'Fork':'Subagent'} · ${projection.session.title}`,webPreferences:{
 preload:fileURLToPath(new URL('./preload.js',typeof __filename==='string'?`file://${__filename}`:import.meta.url)),contextIsolation:true,sandbox:true,nodeIntegration:false,devTools:false,webSecurity:true,additionalArguments:['--xanthil-child-session='+id]}});
 childWindows.set(id,{window,application});let loadFailed=false;
 window.webContents.on('will-navigate',event=>event.preventDefault());window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.session.setPermissionCheckHandler(()=>false);window.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));
 const committed=installCollaborationClose(window,{hasWork:()=>application.hasWork(id),confirm:async()=>{const choice=await electron.dialog.showMessageBox(window,{type:'question',message:'关闭并停止此子任务？',buttons:['取消','关闭并停止'],defaultId:0,cancelId:0});return choice.response===1;},persist:()=>application.closeSession(id),afterPersist:()=>{},failed:()=>electron.dialog.showMessageBox(window,{type:'error',message:'关闭结果待核对，请保留窗口并重新核对。'})});
 fenceRendererLoss(window,()=>application.closeSession(id),()=>committed()||loadFailed,()=>{if(!window.isDestroyed())window.destroy();});
 window.on('closed',()=>{if(childWindows.get(id)?.window===window)childWindows.delete(id);});
 try{if(developmentUrl)await window.loadURL(developmentUrl);else await window.loadFile(fileURLToPath(new URL('../renderer/main_window/index.html',typeof __filename==='string'?`file://${__filename}`:import.meta.url)));}
 catch(error){loadFailed=true;window.destroy();throw error;}
 return {opened:true,session_id:id};
}

function isCurrentMainFrame(event: unknown): boolean {
  if(record(event)&&record(event.sender)&&lostRenderers.has(event.sender))return false;
  const currentWindow = mainWindow;
  if (currentWindow === undefined || typeof event !== 'object' || event === null) return false;
  const candidate = event as Readonly<{ sender?: unknown; senderFrame?: unknown }>;
  return candidate.sender === currentWindow.webContents && candidate.senderFrame === currentWindow.webContents.mainFrame
    && (!developmentUrl || isDevelopmentFrame(currentWindow.webContents.mainFrame.url, developmentUrl));
}

function normalNativeDialogs(): NativeDialogs {
  return Object.freeze({
    async selectExportFile(){
      const window=mainWindow;if(!window)return null;const selected=await electron.dialog.showSaveDialog(window,{title:'导出本地报告（.md 或 .html）',defaultPath:'xanthil-report.html',filters:[{name:'UTF-8 Markdown / HTML',extensions:['md','html']}]});
      if(selected.canceled||!selected.filePath)return null;if(development)assertDevelopmentPath(development.root,selected.filePath,true);const display_name=basename(selected.filePath),format=display_name.endsWith('.md')?'markdown':display_name.endsWith('.html')?'html':null;
      if(format===null)throw Object.assign(new Error('VALIDATION_FAILED'),{code:'VALIDATION_FAILED'});
      return Object.freeze({capability:Object.freeze({path:selected.filePath}),display_name,format});
    },
    async selectImportFiles(){
      const window=mainWindow;if(!window)return null;
      const members=await electron.dialog.showOpenDialog(window,{title:'选择成员 CSV',properties:['openFile'],filters:[{name:'CSV',extensions:['csv']}]});if(members.canceled||members.filePaths.length!==1)return null;
      const orders=await electron.dialog.showOpenDialog(window,{title:'选择订单 CSV',properties:['openFile'],filters:[{name:'CSV',extensions:['csv']}]});if(orders.canceled||orders.filePaths.length!==1)return null;
      if(development){assertDevelopmentPath(development.root,members.filePaths[0]);assertDevelopmentPath(development.root,orders.filePaths[0]);}
      return Object.freeze({members:members.filePaths[0],orders:orders.filePaths[0]});
    },
    async selectProject() {
      const window = mainWindow;
      if (window === undefined) return null;
      const selected = await electron.dialog.showOpenDialog(window, { properties: ['openDirectory', 'createDirectory'], ...(development ? {defaultPath:development.projects} : {}) });
      const projectRoot = selected.filePaths[0];
      if (selected.canceled || projectRoot === undefined) return null;
      if(development)assertDevelopmentPath(development.projects,projectRoot);
      return Object.freeze({ projectRoot, display_name: basename(projectRoot) });
    },
  });
}

function normalSourceReader():SourceReader{return Object.freeze({async readSelectedFiles(capability:unknown){
  if(!record(capability)||Object.keys(capability).sort().join('|')!=='members|orders'||typeof capability.members!=='string'||typeof capability.orders!=='string')throw Object.assign(new Error('INVALID_REQUEST'),{code:'INVALID_REQUEST'});
  const read=async(path:string)=>{const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const stat=await handle.stat();if(!stat.isFile())throw Object.assign(new Error('VALIDATION_FAILED'),{code:'VALIDATION_FAILED'});return {display_name:basename(path),bytes:new Uint8Array(await handle.readFile())};}finally{await handle.close();}};
  return {members:await read(capability.members),orders:await read(capability.orders)};
}});}

export function createNativeReportExportWriter():ExportWriter{return Object.freeze({async writeAndReadBack(capability:unknown,bytes:Uint8Array){
  if(!record(capability)||Object.keys(capability).join('|')!=='path'||typeof capability.path!=='string'||!isAbsolute(capability.path)||!(bytes instanceof Uint8Array))throw Object.assign(new Error('INVALID_REQUEST'),{code:'INVALID_REQUEST'});
  const handle=await open(capability.path,constants.O_CREAT|constants.O_EXCL|constants.O_RDWR|constants.O_NOFOLLOW,0o600);
  try{
    await handle.writeFile(bytes);await handle.sync();const original=await handle.stat();const directory=await open(dirname(capability.path),constants.O_RDONLY);try{await directory.sync();}finally{await directory.close();}
    const independent=await open(capability.path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const identity=await independent.stat();if(!identity.isFile()||identity.dev!==original.dev||identity.ino!==original.ino)throw Object.assign(new Error('INTEGRITY_BLOCKED'),{code:'INTEGRITY_BLOCKED'});
      const readback=await independent.readFile(),sha256=createHash('sha256').update(readback).digest('hex');if(readback.length!==bytes.length||sha256!==createHash('sha256').update(bytes).digest('hex'))throw Object.assign(new Error('INTEGRITY_BLOCKED'),{code:'INTEGRITY_BLOCKED'});return {sha256,byte_length:String(readback.length)};
    }finally{await independent.close();}
  }finally{await handle.close();}
}});}

let closeWindowModelWork:()=>Promise<unknown>=async()=>undefined;
let hasWindowModelWork=()=>false,quitRequested=false,quitCommitted=false;
function startNormalMainEntry(): void {
  const window = new BrowserWindow({
    width: 1366,
    height: 768,
    ...(development ? {title:'Xanthil Desktop · 开发版'} : {}),
    useContentSize: true,
    webPreferences: {
      preload: fileURLToPath(new URL('./preload.js', typeof __filename === 'string' ? `file://${__filename}` : import.meta.url)),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: false,
      webSecurity: true,
    },
  });
  mainWindow = window;
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined;
  });

  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));

  if (!ipcHandlersRegistered) {
    const entryUrl=typeof __filename==='string'?`file://${__filename}`:import.meta.url;
    const descriptor_path=app.isPackaged?join(process.resourcesPath,'toolchain-deployment.json'):fileURLToPath(new URL('../../build/xanthil-toolchain-deployment.json',entryUrl));
    const caseAssistantConfig=development ? null : loadPersonalCaseAssistantActivation(process.env);
    delete process.env.XIAOMI_TOKEN_PLAN_CN_API_KEY;
    delete process.env.JUANERAI_CASE_ASSISTANT_ACTIVATION;
    const credentialHelper=development?fileURLToPath(new URL('../../build/development-keychain/xanthil-keychain',entryUrl)):join(dirname(process.execPath),'xanthil-keychain');
    const providerSettings=caseAssistantConfig?undefined:createProviderSettings({store:createMacOsCredentialStore(credentialHelper),probe:probeLocalXiaomi});
    void providerSettings?.initialize();
    const productionProfile = createPersonalXanthilDesktopProfile({toolchainDeployment:{descriptor_path},assistanceConfig:null,caseAssistantConfig,...(providerSettings?{providerSettings}:{}),clock: () => new Date(),deadlineScheduler:{schedule({at_epoch_ms,callback}:{at_epoch_ms:number;callback:()=>void}){const timer=setTimeout(callback,Math.max(0,at_epoch_ms-Date.now()));return {cancel(){clearTimeout(timer);}};}}});
    const handlers = createXanthilDesktopIpcHandlers({ productionProfile, nativeDialogs: normalNativeDialogs(),sourceReader:normalSourceReader(),exportWriter:createNativeReportExportWriter(), senderPolicy: isCurrentMainFrame });
    for (const [method, handler] of Object.entries(handlers)) {
      ipcMain.handle(`xanthil-desktop:v1:${method}`, (event, request) => handler(event, request));
    }
    const assistantHandler=createCaseAssistantHandler({focusParent:async id=>{if(!mainWindow||mainWindow.isDestroyed())throw Object.assign(new Error('PARENT_CLOSED'),{code:'PARENT_CLOSED'});mainWindow.webContents.send('xanthil-case-assistant:focus-parent',id);mainWindow.focus();return {focused:true};},senderPolicy:(event,request)=>isCurrentMainFrame(event)||childSender(event,request,productionProfile.getCaseAssistant()),openChildWindow:async id=>{const application=productionProfile.getCaseAssistant();if(!application)throw Object.assign(new Error('NOT_FOUND'),{code:'NOT_FOUND'});return openChildWindow(application,id,()=>productionProfile.getCaseAssistant()===application);},getApplication:()=>productionProfile.getCaseAssistant(),async exportReport(application,sessionId,reportId,_commandId){
      const projection=await application.read(sessionId),report=projection.reports.find(r=>r.id===reportId);if(!report)throw Object.assign(new Error('NOT_FOUND'),{code:'NOT_FOUND'});
      const selected=await normalNativeDialogs().selectExportFile();if(selected===null)throw Object.assign(new Error('CANCELLED'),{code:'CANCELLED'});
      if(!record(selected)||(selected.format!=='markdown'&&selected.format!=='html'))throw Object.assign(new Error('INVALID_REQUEST'),{code:'INVALID_REQUEST'});
      const bytes=new TextEncoder().encode(selected.format==='markdown'?report.markdown:report.html),expected=selected.format==='markdown'?report.markdown_sha256:report.html_sha256;
      if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Object.assign(new Error('INTEGRITY_BLOCKED'),{code:'INTEGRITY_BLOCKED'});
      const descriptor=await createNativeReportExportWriter().writeAndReadBack(selected.capability,bytes);return {report_id:reportId,display_name:selected.display_name,...descriptor as object};
    }});
    ipcMain.handle('xanthil-case-assistant:v1',(event,request)=>assistantHandler(event,request));
    ipcMain.handle('xanthil-provider-settings:v1',async(event,request)=>{
      if(!isCurrentMainFrame(event))return {ok:false,code:'FORBIDDEN'};
      if(!providerSettings)return {ok:false,code:'MODEL_BUSY'};
      return providerSettings.request(request);
    });
    closeWindowModelWork=async()=>{await productionProfile.closeModelWork();await providerSettings?.request({operation:'cancel'});};
    hasWindowModelWork=()=>[...childWindows].some(([id,binding])=>binding.application===productionProfile.getCaseAssistant()&&binding.application.hasWork(id));
    app.on('before-quit',event=>{if(quitCommitted){providerSettings?.close();return;}event.preventDefault();quitRequested=true;if(mainWindow)mainWindow.close();else void closeWindowModelWork().then(()=>{quitCommitted=true;app.quit();});});
    ipcHandlersRegistered = true;
  }

  const rootCommitted=installCollaborationClose(window,{hasWork:hasWindowModelWork,confirm:async()=>{const choice=await electron.dialog.showMessageBox(window,{type:'question',message:'关闭父窗口并停止所有关联未完成任务？',buttons:['取消','关闭并停止'],defaultId:0,cancelId:0});if(choice.response!==1)quitRequested=false;return choice.response===1;},persist:()=>closeWindowModelWork(),afterPersist:()=>{for(const child of childWindows.values())if(!child.window.isDestroyed())child.window.destroy();if(quitRequested){quitCommitted=true;setImmediate(()=>app.quit());}},failed:()=>electron.dialog.showMessageBox(window,{type:'error',message:'关闭结果待核对，请保留窗口并重新核对。'})});
  const closeOwnedWork=closeWindowModelWork;
  fenceRendererLoss(window,closeOwnedWork,rootCommitted,()=>{for(const child of childWindows.values())if(!child.window.isDestroyed())child.window.destroy();if(!window.isDestroyed())window.destroy();});
  if (developmentUrl) void window.loadURL(developmentUrl);
  else void window.loadFile(fileURLToPath(new URL('../renderer/main_window/index.html', typeof __filename === 'string' ? `file://${__filename}` : import.meta.url)));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => mainWindow?.focus());
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) startNormalMainEntry();
  });
  void app.whenReady().then(startNormalMainEntry);
}
