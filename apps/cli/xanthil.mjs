import { createLocalAnalysisDomain } from '../../packages/product-core/local-analysis.mjs';

const question = 'Do recent member operations show a problem?';
const source = Object.freeze({ version: 'member-orders-v1', kind: 'csv', sha256: 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0', path: 'member-orders-v1.csv' });
const preflightCodes = new Set(['FIXTURE_NOT_FOUND', 'FIXTURE_MISMATCH', 'SOURCE_BOUNDARY_VIOLATION', 'RUNTIME_UNAVAILABLE', 'MODEL_UNAVAILABLE', 'RUN_ROOT_UNSAFE', 'CONTRACT_VERSION_UNSUPPORTED', 'RUN_COLLISION']);
const stages = new Set(['contract_persist', 'runtime', 'source_read', 'analysis_sql', 'analysis_python', 'validation', 'artifact_finalize', 'execution']);
const codes = new Set(['ARTIFACT_WRITE_FAILED', 'SOURCE_CHANGED', 'SOURCE_BOUNDARY_VIOLATION', 'SOURCE_INVALID', 'MODEL_EXECUTION_FAILED', 'TOOL_POLICY_VIOLATION', 'ANALYSIS_EXECUTION_FAILED', 'VALIDATION_FAILED', 'TIMEOUT', 'CONTRACT_VERSION_UNSUPPORTED', 'INTERNAL_ERROR', 'RUN_COLLISION']);

function boundary(code) { const error = new Error(code); error.code = code; return error; }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function surface(value, keys) { return plain(value) && Object.keys(value).length === keys.length && Object.getOwnPropertySymbols(value).length === 0 && keys.every((key) => Object.hasOwn(value, key)); }
function closed(value, keys) { return surface(value, keys) && keys.every((key) => value[key] !== null && value[key] !== undefined); }
function frozen(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) frozen(child); Object.freeze(value); } return value; }
function clone(value) { return frozen(structuredClone(value)); }
function validEvent(event) {
  if (!Object.isFrozen(event) || !plain(event)) return false;
  if (event.type === 'question') return closed(event, ['type', 'question']) && event.question === question;
  return ['confirm', 'reject', 'edit', 'eof', 'interrupt'].includes(event.type) && closed(event, ['type']);
}
function validApplication(application) { return closed(application, ['start']) && typeof application.start === 'function'; }
function validOutput(output) { return closed(output, ['write']) && typeof output.write === 'function'; }
function validHandle(handle) { return closed(handle, ['discover', 'confirm', 'cancel']) && ['discover', 'confirm', 'cancel'].every((key) => typeof handle[key] === 'function'); }
function mapped(error) {
  if (preflightCodes.has(error?.code)) return { stage: 'preflight', code: error.code };
  if (stages.has(error?.stage) && codes.has(error?.code)) return { stage: error.stage, code: error.code };
  return { stage: 'execution', code: 'INTERNAL_ERROR' };
}

export async function runXanthil(invocation) {
  if (!surface(invocation, ['input', 'output', 'application'])) throw boundary('CLI_INPUT_INVALID');
  const { input, output, application } = invocation;
  if (!validOutput(output)) throw boundary('CLI_OUTPUT_INVALID');
  if (!validApplication(application)) throw boundary('CLI_APPLICATION_INVALID');
  if (!plain(input) || Object.keys(input).length !== 0 || Object.getOwnPropertySymbols(input).length !== 1 || typeof input[Symbol.asyncIterator] !== 'function') throw boundary('CLI_INPUT_INVALID');
  let iterator;
  try { iterator = input[Symbol.asyncIterator](); } catch { throw boundary('CLI_INPUT_INVALID'); }
  if (!iterator || typeof iterator !== 'object' || Object.keys(iterator).length !== 1 || Object.keys(iterator)[0] !== 'next' || Object.getOwnPropertySymbols(iterator).length !== 0 || typeof iterator.next !== 'function') throw boundary('CLI_INPUT_INVALID');
  const domain = createLocalAnalysisDomain();
  async function next() {
    let pending;
    try { pending = iterator.next(); } catch { throw boundary('INPUT_READ_FAILED'); }
    if (!(pending instanceof Promise)) throw boundary('CLI_INPUT_INVALID');
    let event;
    try { event = await pending; } catch { throw boundary('INPUT_READ_FAILED'); }
    if (!validEvent(event)) throw boundary('CLI_INPUT_INVALID');
    return event;
  }
  function write(event) {
    try { if (output.write(clone(event)) !== undefined) throw new Error(); } catch { throw boundary('OUTPUT_WRITE_FAILED'); }
  }
  function failure(value) {
    const mappedValue = mapped(value);
    write({ type: 'terminal', status: 'failed', ...mappedValue });
    return clone({ status: 'failed', failure: mappedValue });
  }
  const first = await next();
  if (first.type !== 'question') throw boundary('CLI_INPUT_INVALID');
  write({ type: 'ready', scenario: 'member-analysis-v1' });
  let handle;
  try { handle = await application.start({ question, source }); } catch (error) { return failure(error); }
  if (!validHandle(handle)) throw boundary('CLI_APPLICATION_INVALID');
  let proposal;
  try { proposal = await handle.discover(); } catch (error) { return failure(error); }
  try { domain.validateAnalysisProposal(proposal); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
  write({ type: 'proposal', proposal });
  write({ type: 'awaiting_confirmation' });
  const decision = await next();
  if (decision.type !== 'confirm') {
    if (!['reject', 'edit', 'eof', 'interrupt'].includes(decision.type)) throw boundary('CLI_INPUT_INVALID');
    try { await handle.cancel(); } catch (error) { return failure(error); }
    const reason = ({ reject: 'rejected', edit: 'edit_not_supported', eof: 'eof', interrupt: 'interrupted' })[decision.type];
    write({ type: 'terminal', status: 'cancelled', reason });
    return clone({ status: 'cancelled', reason });
  }
  let confirmation;
  try { confirmation = Promise.resolve(handle.confirm(proposal)); } catch (error) { return failure(error); }
  let settled;
  confirmation.then((value) => { settled = { value }; }, (error) => { settled = { error }; });
  write({ type: 'progress', stage: 'execution_started' });
  await Promise.resolve();
  await Promise.resolve();
  if (!settled) {
    const postConfirmation = next();
    const outcome = await Promise.race([
      confirmation.then((value) => ({ type: 'confirmation', value }), (error) => ({ type: 'confirmation', error })),
      postConfirmation.then((value) => ({ type: 'input', value }), (error) => ({ type: 'input', error })),
    ]);
    if (outcome.type === 'confirmation') {
      settled = Object.hasOwn(outcome, 'error') ? { error: outcome.error } : { value: outcome.value };
    } else {
      if (Object.hasOwn(outcome, 'error')) throw outcome.error;
      const { value: postConfirmation } = outcome;
      if (!['eof', 'interrupt'].includes(postConfirmation.type)) throw boundary('CLI_INPUT_INVALID');
      let cancelled;
      try { cancelled = await handle.cancel(); } catch (error) { return failure(error); }
      const reason = postConfirmation.type === 'eof' ? 'eof' : 'interrupted';
      write({ type: 'terminal', status: 'cancelled', reason });
      if (closed(cancelled, ['run'])) {
        try { domain.validateRunManifest(cancelled.run); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
        if (cancelled.run.status !== 'cancelled') throw boundary('CLI_APPLICATION_INVALID');
        return clone({ status: 'cancelled', run: cancelled.run });
      }
      return clone({ status: 'cancelled', reason });
    }
  }
  if (settled.error) return failure(settled.error);
  const result = settled.value;
  if (!closed(result, ['run', 'metrics', 'finding']) && !closed(result, ['run'])) throw boundary('CLI_APPLICATION_INVALID');
  try { domain.validateRunManifest(result.run); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
  if (result.run.status === 'succeeded') {
    if (!closed(result, ['run', 'metrics', 'finding'])) throw boundary('CLI_APPLICATION_INVALID');
    try { domain.validateFinding({ finding: result.finding, result: result.metrics }); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
    const terminal = { type: 'terminal', status: 'succeeded', run_id: result.run.run_id, oracle: { baseline_rate: '2/3', recent_rate: '1/9', delta_pp: '-500/9' }, finding_id: 'F-001', source_sha256: source.sha256, limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'], evidence_path: 'evidence.json', summary_path: 'summary.md' };
    write(terminal);
    return clone({ status: 'succeeded', run: result.run, metrics: result.metrics, finding: result.finding });
  }
  if (result.run.status === 'failed') {
    const terminal = { type: 'terminal', status: 'failed', stage: result.run.terminal_detail.stage, code: result.run.terminal_detail.error_code };
    write(terminal);
    return clone({ status: 'failed', run: result.run });
  }
  if (result.run.status === 'cancelled') return clone({ status: 'cancelled', run: result.run });
  throw boundary('CLI_APPLICATION_INVALID');
}
