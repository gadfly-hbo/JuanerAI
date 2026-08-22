const state = {
  create_calls: 0,
  refresh_calls: 0,
  get_model_calls: 0,
  session_creations: 0,
  provider_calls: 0,
  credential_output: false,
};

const versionCase = process.env.XANTHIL_TEST_PI_FAILURE_CASE;
// The module-hook namespace is the external-SDK boundary used by the adapter.
// Undefined covers the missing-export value observed by an `import * as` SDK namespace.
export const VERSION = versionCase === 'sdk_version_missing' ? undefined
  : versionCase === 'sdk_version_null' ? null
    : versionCase === 'sdk_version_non_string' ? 842
      : versionCase === 'sdk_version_malformed' ? '0.84'
        : versionCase === 'sdk_version_mismatch' ? '0.85.0'
          : '0.84.2';

function unavailable() {
  throw new Error('test-only local Pi readiness unavailable');
}

export const ModelRuntime = Object.freeze({
  async create() {
    state.create_calls += 1;
    if (process.env.XANTHIL_TEST_PI_FAILURE_CASE === 'runtime_create') unavailable();
    return Object.freeze({
      async refresh() {
        state.refresh_calls += 1;
        if (process.env.XANTHIL_TEST_PI_FAILURE_CASE === 'local_refresh') unavailable();
      },
      getModel() {
        state.get_model_calls += 1;
        if (process.env.XANTHIL_TEST_PI_FAILURE_CASE === 'model_absent') return undefined;
        if (process.env.XANTHIL_TEST_PI_FAILURE_CASE === 'model_nonmatching') return Object.freeze({ provider: 'wrong-provider', id: 'wrong-model' });
        return Object.freeze({ provider: 'minimax-cn', id: 'MiniMax-M3' });
      },
    });
  },
});

export function createAgentSession() {
  state.session_creations += 1;
  unavailable();
}

export function snapshot() {
  return Object.freeze({ ...state });
}
