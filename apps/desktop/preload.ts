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
