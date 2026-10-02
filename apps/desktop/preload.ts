import { contextBridge, ipcRenderer } from 'electron';

import type {
  XanthilDesktopApi,
  XanthilDesktopMethod,
  XanthilDesktopRequestFor,
} from '../../packages/contracts/xanthil-desktop-ipc.ts';

function invoke<Method extends XanthilDesktopMethod>(
  method: Method,
  request: XanthilDesktopRequestFor<Method>,
): ReturnType<XanthilDesktopApi[Method]> {
  return ipcRenderer.invoke(`xanthil-desktop:v1:${method}`, request) as ReturnType<XanthilDesktopApi[Method]>;
}

export const xanthilDesktopApi: XanthilDesktopApi = {
  selectProject: (request) => invoke('selectProject', request),
  listSessions: (request) => invoke('listSessions', request),
  openSession: (request) => invoke('openSession', request),
  createSession: (request) => invoke('createSession', request),
  createDraftRevision: (request) => invoke('createDraftRevision', request),
  selectImportFiles: (request) => invoke('selectImportFiles', request),
  confirmRevision: (request) => invoke('confirmRevision', request),
  startAnalysis: (request) => invoke('startAnalysis', request),
  cancelAnalysis: (request) => invoke('cancelAnalysis', request),
  prepareAssistanceDisclosure: (request) => invoke('prepareAssistanceDisclosure', request),
  decideAssistanceDisclosure: (request) => invoke('decideAssistanceDisclosure', request),
  startAssistance: (request) => invoke('startAssistance', request),
  cancelAssistance: (request) => invoke('cancelAssistance', request),
  disposeAssistanceDraft: (request) => invoke('disposeAssistanceDraft', request),
  acceptFinding: (request) => invoke('acceptFinding', request),
  saveForm: (request) => invoke('saveForm', request),
  completeCase: (request) => invoke('completeCase', request),
  exportReport: (request) => invoke('exportReport', request),
  readProjection: (request) => invoke('readProjection', request),
  waitForProjection: (request) => invoke('waitForProjection', request),
};

contextBridge.exposeInMainWorld('xanthilDesktopApi', xanthilDesktopApi);

import type { CaseAssistantApi } from '../../packages/contracts/case-assistant.ts';
export const xanthilCaseAssistantApi: CaseAssistantApi = { request: input => ipcRenderer.invoke('xanthil-case-assistant:v1',input) };
contextBridge.exposeInMainWorld('xanthilCaseAssistantApi',xanthilCaseAssistantApi);

import type {ProviderSettingsApi} from '../../packages/contracts/provider-settings.ts';
const providerSettingsApi:ProviderSettingsApi={request:input=>ipcRenderer.invoke('xanthil-provider-settings:v1',input)};
contextBridge.exposeInMainWorld('xanthilProviderSettingsApi',providerSettingsApi);

const childSession=process.argv.find(value=>value.startsWith('--xanthil-child-session='))?.slice('--xanthil-child-session='.length)??null;
contextBridge.exposeInMainWorld('xanthilChildSession',childSession);

contextBridge.exposeInMainWorld('xanthilParentNavigation',{subscribe(callback:(id:string)=>void){const receive=(_event:unknown,id:unknown)=>{if(typeof id==='string')callback(id);};ipcRenderer.on('xanthil-case-assistant:focus-parent',receive);return ()=>ipcRenderer.removeListener('xanthil-case-assistant:focus-parent',receive);}});

import type {MembershipApi} from '../../packages/contracts/member-task.ts';
const membershipApi:MembershipApi={request:input=>ipcRenderer.invoke('xanthil-membership-task:v1',input)};
contextBridge.exposeInMainWorld('xanthilMembershipTaskApi',membershipApi);
