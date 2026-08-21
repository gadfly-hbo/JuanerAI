import { lstatSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';

import { createPiAgentAnalysisRuntime } from '../../adapters/agent-pi/local-analysis.mjs';
import { createDuckDbPythonLocalAnalysisExecution } from '../../adapters/analytics-duckdb/local-analysis.mjs';
import { createLocalRunArtifactStore } from '../../adapters/storage-local/local-analysis.mjs';
import { createLocalAnalysisApplication } from '../../packages/application/local-analysis.mjs';

const provider = 'minimax-cn';
const modelId = 'MiniMax-M3';
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function closed(value) { return plain(value) && Object.keys(value).length === 4 && Object.getOwnPropertySymbols(value).length === 0 && ['workspaceRoot', 'runRoot', 'provider', 'modelId'].every((key) => Object.hasOwn(value, key) && value[key] !== null && value[key] !== undefined); }
function directory(value, forbidRoot = false) {
  if (typeof value !== 'string' || !value.startsWith(sep)) throw new Error('PROFILE_INVALID');
  try { const stat = lstatSync(value); const actual = realpathSync(value); if (stat.isSymbolicLink() || !stat.isDirectory() || actual !== value || (forbidRoot && actual === resolve(sep))) throw new Error('PROFILE_INVALID'); return actual; } catch { throw new Error('PROFILE_INVALID'); }
}

export function createPersonalLocalAnalysisProfile(config) {
  if (!closed(config) || config.provider !== provider || config.modelId !== modelId) throw new Error('PROFILE_INVALID');
  const workspaceRoot = directory(config.workspaceRoot);
  const runRoot = directory(config.runRoot, true);
  if (workspaceRoot === runRoot) throw new Error('PROFILE_INVALID');
  const deadlineScheduler = Object.freeze({
    schedule({ at_epoch_ms, callback }) {
      let cancelled = false;
      const timer = setTimeout(callback, Math.max(0, at_epoch_ms - Date.now()));
      const cancel = () => {
        if (!cancelled) {
          cancelled = true;
          clearTimeout(timer);
        }
        return undefined;
      };
      return Object.freeze({ cancel });
    },
  });
  const application = createLocalAnalysisApplication({
    agentRuntime: createPiAgentAnalysisRuntime({ provider, model_id: modelId }),
    localAnalysisExecution: createDuckDbPythonLocalAnalysisExecution({ workspaceRoot }),
    runArtifactStore: createLocalRunArtifactStore({ runRoot }),
    model: { provider, model_id: modelId },
    clock: () => new Date(),
    deadlineScheduler,
  });
  return Object.freeze({ application });
}
