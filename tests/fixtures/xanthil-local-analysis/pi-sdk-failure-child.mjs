import { createPiAgentAnalysisRuntime } from '../../../adapters/agent-pi/local-analysis.mjs';
import { snapshot } from './pi-sdk-failure-sdk.mjs';

const model = Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });
const runtime = createPiAgentAnalysisRuntime(model);
let code;
try {
  await runtime.preflightModel(Object.freeze({ model }));
  code = 'PRELIGHT_SUCCEEDED';
} catch (error) {
  code = String(error?.code ?? error?.message);
}

process.stdout.write(`${JSON.stringify({ code, sdk: snapshot() })}\n`);
