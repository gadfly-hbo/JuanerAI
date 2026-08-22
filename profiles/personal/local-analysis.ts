import { lstatSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';

import { createPiAgentAnalysisRuntime } from '../../adapters/agent-pi/local-analysis.ts';
import { createDuckDbPythonLocalAnalysisExecution } from '../../adapters/analytics-duckdb/local-analysis.ts';
import { createLocalRunArtifactStore } from '../../adapters/storage-local/local-analysis.ts';
import { createLocalAnalysisApplication } from '../../packages/application/local-analysis.ts';
import type { DeadlineScheduler } from '../../packages/application/local-analysis.ts';

const provider = 'minimax-cn';
const modelId = 'MiniMax-M3';
type ProfileConfig = { workspaceRoot: string; runRoot: string; provider: string; modelId: string };
function plain(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function closed(value: unknown): value is ProfileConfig { return plain(value) && Object.keys(value).length === 4 && Object.getOwnPropertySymbols(value).length === 0 && ['workspaceRoot', 'runRoot', 'provider', 'modelId'].every((key) => Object.hasOwn(value, key) && value[key] !== null && value[key] !== undefined) && typeof value.workspaceRoot === 'string' && typeof value.runRoot === 'string' && typeof value.provider === 'string' && typeof value.modelId === 'string'; }
function directory(value: unknown, forbidRoot = false): string {
  if (typeof value !== 'string' || !value.startsWith(sep)) throw new Error('PROFILE_INVALID');
  try { const stat = lstatSync(value); const actual = realpathSync(value); if (stat.isSymbolicLink() || !stat.isDirectory() || actual !== value || (forbidRoot && actual === resolve(sep))) throw new Error('PROFILE_INVALID'); return actual; } catch { throw new Error('PROFILE_INVALID'); }
}

export function createPersonalLocalAnalysisProfile(config: unknown) {
  if (!closed(config) || config.provider !== provider || config.modelId !== modelId) throw new Error('PROFILE_INVALID');
  const workspaceRoot = directory(config.workspaceRoot);
  const runRoot = directory(config.runRoot, true);
  if (workspaceRoot === runRoot) throw new Error('PROFILE_INVALID');
  const deadlineScheduler: DeadlineScheduler = Object.freeze({
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
