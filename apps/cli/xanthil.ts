import { createLocalAnalysisDomain } from '../../packages/product-core/local-analysis.ts';
import type { PlainRecord } from '../../packages/product-core/local-analysis.ts';
import type { LocalAnalysisApplication, LocalAnalysisHandle } from '../../packages/application/local-analysis.ts';

type CliError = Error & { code: string };
type CliEvent = PlainRecord & { type: string };
type CliOutput = { write(event: unknown): unknown };
type CliIterator = { next(): Promise<unknown> };
type CliInput = { [Symbol.asyncIterator](): CliIterator };
type RaceOutcome = { type: 'confirmation'; value: unknown } | { type: 'confirmation'; error: unknown } | { type: 'input'; value: CliEvent } | { type: 'input'; error: unknown };

const question = 'Do recent member operations show a problem?';
const source = Object.freeze({ version: 'member-orders-v1', kind: 'csv', sha256: 'c0d1c3d2b1e8621955ab786dc87cebc14437033bda4def397498db5a1544ebb0', path: 'member-orders-v1.csv' });
const preflightCodes = new Set(['FIXTURE_NOT_FOUND', 'FIXTURE_MISMATCH', 'SOURCE_BOUNDARY_VIOLATION', 'RUNTIME_UNAVAILABLE', 'MODEL_UNAVAILABLE', 'RUN_ROOT_UNSAFE', 'CONTRACT_VERSION_UNSUPPORTED', 'RUN_COLLISION']);
const stages = new Set(['contract_persist', 'runtime', 'source_read', 'analysis_sql', 'analysis_python', 'validation', 'artifact_finalize', 'execution']);
const codes = new Set(['ARTIFACT_WRITE_FAILED', 'SOURCE_CHANGED', 'SOURCE_BOUNDARY_VIOLATION', 'SOURCE_INVALID', 'MODEL_EXECUTION_FAILED', 'TOOL_POLICY_VIOLATION', 'ANALYSIS_EXECUTION_FAILED', 'VALIDATION_FAILED', 'TIMEOUT', 'CONTRACT_VERSION_UNSUPPORTED', 'INTERNAL_ERROR', 'RUN_COLLISION']);

function boundary(code: string): CliError { return Object.assign(new Error(code), { code }); }
function plain(value: unknown): value is PlainRecord { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
function surface(value: unknown, keys: readonly string[]): value is PlainRecord { return plain(value) && Object.keys(value).length === keys.length && Object.getOwnPropertySymbols(value).length === 0 && keys.every((key) => Object.hasOwn(value, key)); }
function closed(value: unknown, keys: readonly string[]): value is PlainRecord { return surface(value, keys) && keys.every((key) => value[key] !== null && value[key] !== undefined); }
function frozen<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) frozen(child); Object.freeze(value); } return value; }
function clone<T>(value: T): T { return frozen(structuredClone(value)); }
function validEvent(event: unknown): event is CliEvent {
  if (!Object.isFrozen(event) || !plain(event)) return false;
  if (event.type === 'question') return closed(event, ['type', 'question']) && event.question === question;
  return typeof event.type === 'string' && ['confirm', 'reject', 'edit', 'eof', 'interrupt'].includes(event.type) && closed(event, ['type']);
}
function validApplication(application: unknown): application is LocalAnalysisApplication { return closed(application, ['start']) && typeof application.start === 'function'; }
function validOutput(output: unknown): output is CliOutput { return closed(output, ['write']) && typeof output.write === 'function'; }
function validHandle(handle: unknown): handle is LocalAnalysisHandle { return closed(handle, ['discover', 'confirm', 'cancel']) && ['discover', 'confirm', 'cancel'].every((key) => typeof handle[key] === 'function'); }
function validInput(input: unknown): input is CliInput { return plain(input) && Object.keys(input).length === 0 && Object.getOwnPropertySymbols(input).length === 1 && hasAsyncIterator(input); }
function hasAsyncIterator(input: PlainRecord): input is PlainRecord & CliInput { return typeof Reflect.get(input, Symbol.asyncIterator) === 'function'; }
function errorField(error: unknown, field: 'code' | 'stage'): unknown { return error !== null && (typeof error === 'object' || typeof error === 'function') && field in error ? Reflect.get(error, field) : undefined; }
function mapped(error: unknown): { stage: string; code: string } {
  const code = errorField(error, 'code');
  const stage = errorField(error, 'stage');
  if (typeof code === 'string' && preflightCodes.has(code)) return { stage: 'preflight', code };
  if (typeof stage === 'string' && typeof code === 'string' && stages.has(stage) && codes.has(code)) return { stage, code };
  return { stage: 'execution', code: 'INTERNAL_ERROR' };
}

export async function runXanthil(invocation: unknown): Promise<unknown> {
  if (!surface(invocation, ['input', 'output', 'application'])) throw boundary('CLI_INPUT_INVALID');
  const { input, output, application } = invocation;
  if (!validOutput(output)) throw boundary('CLI_OUTPUT_INVALID');
  const writer = output;
  if (!validApplication(application)) throw boundary('CLI_APPLICATION_INVALID');
  if (!validInput(input)) throw boundary('CLI_INPUT_INVALID');
  let iterator: CliIterator;
  try { iterator = input[Symbol.asyncIterator](); } catch { throw boundary('CLI_INPUT_INVALID'); }
  if (!iterator || typeof iterator !== 'object' || Object.keys(iterator).length !== 1 || Object.keys(iterator)[0] !== 'next' || Object.getOwnPropertySymbols(iterator).length !== 0 || typeof iterator.next !== 'function') throw boundary('CLI_INPUT_INVALID');
  const domain = createLocalAnalysisDomain();
  async function next(): Promise<CliEvent> {
    let pending: Promise<unknown>;
    try { pending = iterator.next(); } catch { throw boundary('INPUT_READ_FAILED'); }
    if (!(pending instanceof Promise)) throw boundary('CLI_INPUT_INVALID');
    let event: unknown;
    try { event = await pending; } catch { throw boundary('INPUT_READ_FAILED'); }
    if (!validEvent(event)) throw boundary('CLI_INPUT_INVALID');
    return event;
  }
  function write(event: unknown): void {
    try { if (writer.write(clone(event)) !== undefined) throw new Error(); } catch { throw boundary('OUTPUT_WRITE_FAILED'); }
  }
  function failure(value: unknown): PlainRecord {
    const mappedValue = mapped(value);
    write({ type: 'terminal', status: 'failed', ...mappedValue });
    return clone({ status: 'failed', failure: mappedValue });
  }
  const first = await next();
  if (first.type !== 'question') throw boundary('CLI_INPUT_INVALID');
  write({ type: 'ready', scenario: 'member-analysis-v1' });
  let handle: unknown;
  try { handle = await application.start({ question, source }); } catch (error) { return failure(error); }
  if (!validHandle(handle)) throw boundary('CLI_APPLICATION_INVALID');
  let proposal: unknown;
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
  let confirmation: Promise<unknown>;
  try { confirmation = Promise.resolve(handle.confirm(proposal)); } catch (error) { return failure(error); }
  let settled: { value?: unknown; error?: unknown } | undefined;
  confirmation.then((value) => { settled = { value }; }, (error) => { settled = { error }; });
  write({ type: 'progress', stage: 'execution_started' });
  await Promise.resolve();
  await Promise.resolve();
  if (!settled) {
    const postConfirmation = next();
    const outcome: RaceOutcome = await Promise.race([
      confirmation.then((value): RaceOutcome => ({ type: 'confirmation', value }), (error: unknown): RaceOutcome => ({ type: 'confirmation', error })),
      postConfirmation.then((value): RaceOutcome => ({ type: 'input', value }), (error: unknown): RaceOutcome => ({ type: 'input', error })),
    ]);
    if (outcome.type === 'confirmation') {
      settled = 'error' in outcome ? { error: outcome.error } : { value: outcome.value };
    } else {
      if ('error' in outcome) throw outcome.error;
      const { value: postConfirmation } = outcome;
      if (!['eof', 'interrupt'].includes(postConfirmation.type)) throw boundary('CLI_INPUT_INVALID');
      let cancelled: unknown;
      try { cancelled = await handle.cancel(); } catch (error) { return failure(error); }
      const reason = postConfirmation.type === 'eof' ? 'eof' : 'interrupted';
      write({ type: 'terminal', status: 'cancelled', reason });
      if (closed(cancelled, ['run'])) {
        let cancelledRun;
        try { cancelledRun = domain.validateRunManifest(cancelled.run); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
        if (cancelledRun.status !== 'cancelled') throw boundary('CLI_APPLICATION_INVALID');
        return clone({ status: 'cancelled', run: cancelledRun });
      }
      return clone({ status: 'cancelled', reason });
    }
  }
  if (settled.error) return failure(settled.error);
  const result = settled.value;
  if (!closed(result, ['run', 'metrics', 'finding']) && !closed(result, ['run'])) throw boundary('CLI_APPLICATION_INVALID');
  let run;
  try { run = domain.validateRunManifest(result.run); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
  if (run.status === 'succeeded') {
    if (!closed(result, ['run', 'metrics', 'finding'])) throw boundary('CLI_APPLICATION_INVALID');
    try { domain.validateFinding({ finding: result.finding, result: result.metrics }); } catch { throw boundary('CLI_APPLICATION_INVALID'); }
    const terminal = { type: 'terminal', status: 'succeeded', run_id: run.run_id, oracle: { baseline_rate: '2/3', recent_rate: '1/9', delta_pp: '-500/9' }, finding_id: 'F-001', source_sha256: source.sha256, limitations: ['tiny and synthetic', 'window-local', 'no causal or business-impact claim'], evidence_path: 'evidence.json', summary_path: 'summary.md' };
    write(terminal);
    return clone({ status: 'succeeded', run: result.run, metrics: result.metrics, finding: result.finding });
  }
  if (run.status === 'failed') {
    if (!plain(run.terminal_detail)) throw boundary('CLI_APPLICATION_INVALID');
    const terminal = { type: 'terminal', status: 'failed', stage: run.terminal_detail.stage, code: run.terminal_detail.error_code };
    write(terminal);
    return clone({ status: 'failed', run: result.run });
  }
  if (run.status === 'cancelled') return clone({ status: 'cancelled', run: result.run });
  throw boundary('CLI_APPLICATION_INVALID');
}
