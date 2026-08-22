import { createPiAgentAnalysisRuntime } from '../../../adapters/agent-pi/local-analysis.ts';
import { snapshot } from './pi-sdk-failure-sdk.ts';

const model = Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
const runtime = createPiAgentAnalysisRuntime(model, undefined);
let code;
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
try {
  await runtime.preflightModel(Object.freeze({ model }));
  code = 'PRELIGHT_SUCCEEDED';
} catch (error) {
  const detail = isRecord(error) ? error : undefined;
  code = String(detail?.code ?? detail?.message);
}

process.stdout.write(`${JSON.stringify({ code, sdk: snapshot() })}\n`);
