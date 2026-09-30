/** Private local credential capability; never exposed through Renderer IPC or Project data. */
export type LocalCredentialRead = { status: 'absent' } | { status: 'found'; key: string };
export type LocalCredentialStore = {
  read(): Promise<LocalCredentialRead>;
  save(key: string): Promise<void>;
  delete(): Promise<void>;
};
export type ConnectionFailure = 'CREDENTIAL_INVALID' | 'NETWORK_UNAVAILABLE' | 'CONNECTION_TIMEOUT' | 'QUOTA_EXCEEDED' | 'CONNECTION_FAILED';
export type ConnectionProbe = (key: string, signal: AbortSignal) => Promise<void>;
/** Application sees only generation and admission, never the credential. */
export type LocalModelAccess = {
  snapshot(): { generation: number; available: boolean };
  acquire(generation: number): Promise<{ release(): void }>;
};
