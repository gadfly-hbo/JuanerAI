/** Main/Renderer closed protocol. No stored credential read operation. */
export type ProviderSettingsStatus = {
  configured: boolean;
  state: 'unconfigured' | 'configured' | 'credential_invalid' | 'keychain_unavailable';
  busy: boolean;
  generation: number;
  last_test: 'none' | 'passed' | 'CREDENTIAL_INVALID' | 'NETWORK_UNAVAILABLE' | 'CONNECTION_TIMEOUT' | 'QUOTA_EXCEEDED' | 'CONNECTION_FAILED';
};
export type ProviderSettingsRequest =
  | { operation: 'read' | 'refresh' | 'cancel' }
  | { operation: 'test'; key: string | null }
  | { operation: 'save'; key: string; proof: string }
  | { operation: 'delete'; confirmed: true };
export type ProviderSettingsResult = { ok: true; value: ProviderSettingsStatus; proof?: string; code?: never } | { ok: false; code: string; value: ProviderSettingsStatus; proof?: never };
export type ProviderSettingsApi = { request(input: ProviderSettingsRequest): Promise<ProviderSettingsResult> };
