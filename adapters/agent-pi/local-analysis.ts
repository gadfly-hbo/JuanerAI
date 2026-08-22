import * as Type from 'typebox';

import type { AnalysisProposal, Finding, PlainRecord } from '../../packages/product-core/local-analysis.ts';
import type { AgentAnalysisRuntime, AgentAnalysisSession, ExecutionTool, ModelIdentity } from '../../packages/ports/local-analysis.ts';

type AdapterError = Error & { code: string };
type FactoryConfig = { provider: string; model_id: string };
type FacadeListener = (event: unknown) => unknown;
type SessionFacade = Readonly<{
  subscribe(listener: FacadeListener): unknown;
  setActiveTools(names: readonly string[]): unknown;
  prompt(text: string, options: PlainRecord): unknown;
  getActualModel(): unknown;
  abort(): unknown;
  waitForIdle(): unknown;
  dispose(): unknown;
}>;
type SdkFactory = (request: PlainRecord) => unknown | Promise<unknown>;
type FacadeRequest = PlainRecord & { system_prompt: string; custom_tools: readonly PlainRecord[] };
type SdkModel = { provider: string; id: string };
type ModelRuntime = { refresh(input: PlainRecord): unknown; getModel(provider: string, modelId: string): unknown };
type RuntimeSdk = {
  ModelRuntime: { create(input: PlainRecord): unknown };
};
type SdkNamespace = RuntimeSdk & {
  DefaultResourceLoader: new (input: PlainRecord) => { getExtensions(): unknown };
  SettingsManager: { inMemory(input: PlainRecord): unknown };
  SessionManager: { inMemory(path: string): unknown };
  createAgentSession(input: PlainRecord): Promise<unknown>;
};
type ProductionReadiness = Readonly<{ sdk: RuntimeSdk; runtime: ModelRuntime; model: SdkModel }>;
type InjectedReadiness = Readonly<{ injected: true }>;
type Readiness = ProductionReadiness | InjectedReadiness;
type ToolCall = { name: string; settled: boolean; result?: unknown };
type TurnState = { kind: 'discovery' | 'execution'; terminalStage: number; tools: Map<string, ToolCall>; admissionOpen: boolean; failureCode: string | undefined; result?: AnalysisProposal | Finding };
type DiscoveryContext = PlainRecord & { protocol: PlainRecord; source: PlainRecord; comparison: PlainRecord; delivery: PlainRecord };
type FindingContext = PlainRecord & { protocol: PlainRecord; identity: PlainRecord; interpretation: PlainRecord };
type ProjectedEvent = PlainRecord & { type: string };
type ProductionSession = {
  subscribe?(listener: (event: unknown) => unknown): unknown;
  setActiveToolsByName(names: string[]): unknown;
  getActiveToolNames(): unknown;
  prompt(text: string, options: PlainRecord): unknown;
  model: unknown;
  abort?(): unknown;
  waitForIdle?(): unknown;
  dispose?(): unknown;
};

const PROVIDER = 'minimax-cn';
const MODEL_ID = 'MiniMax-M3';
const TOOL_NAMES = Object.freeze([
  'profile_approved_fixture',
  'calculate_member_repurchase_metrics',
  'validate_member_repurchase_metrics',
]);
const EMPTY_OPTIONS = Object.freeze({ expandPromptTemplates: false });
const SYSTEM_PROMPT = `You are Xanthil Local Analysis Runtime v1.
Follow only the current XANTHIL_DISCOVERY_V1 or XANTHIL_EXECUTION_V1 user envelope and admitted tool results.
During Discovery, do not call tools.
During Execution, call each currently admitted tool exactly once in admitted order with exactly {}, wait for all successful results, then return the terminal JSON object.
Return exactly one terminal JSON object for the envelope required_response; do not emit prose, Markdown, code fences, or extra keys.
Do not request, infer, disclose, or use data outside the envelope and admitted tools.
Do not make a Decision, recommendation, or Action.`;
const PROPOSAL_FIELD_ORDER = Object.freeze([
  'schema_version', 'original_question', 'question', 'objective', 'source_ids', 'fixture',
  'time_windows', 'metrics', 'signal_rule', 'output_requirements', 'constraints',
]);
const FINDING_FIELD_ORDER = Object.freeze(['finding']);
const TOOL_USE_POLICY = Object.freeze({
  discovery: 'no_tools',
  execution: 'each_admitted_tool_once_in_admitted_order_with_empty_object',
});

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function isPlainObject(value: unknown): value is PlainRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function isObjectLike(value: unknown): value is object {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function hasCallableProperty(value: unknown, property: string): boolean {
  return isObjectLike(value) && typeof Reflect.get(value, property) === 'function';
}

function exactObject(value: unknown, keys: readonly string[], { frozen = false }: { frozen?: boolean } = {}): value is PlainRecord {
  return isPlainObject(value) && (!frozen || Object.isFrozen(value))
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)
      && value[key] !== null && value[key] !== undefined);
}

function exactOrderedObject(value: unknown, keys: readonly string[], { frozen = false }: { frozen?: boolean } = {}): value is PlainRecord {
  return exactObject(value, keys, { frozen }) && Object.keys(value).every((key, index) => key === keys[index]);
}

function deeplyFrozen(value: unknown): boolean {
  if (!value || typeof value !== 'object' || !Object.isFrozen(value)) return false;
  return Object.values(value).every((child) => child === null || typeof child !== 'object' || deeplyFrozen(child));
}

function nonEmptyString(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }

function exactStringArray(value: unknown, expected: readonly string[]): boolean {
  return exactArray(value, expected, { frozen: true });
}

function uniqueStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonEmptyString) && new Set(value).size === value.length;
}

function safeRelativePath(value: unknown): value is string {
  if (!nonEmptyString(value) || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value) || value.includes('\\') || value.includes('\0')) return false;
  return value.split('/').every((segment) => segment && segment !== '.' && segment !== '..');
}

function sha256Hex(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function transportIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z][A-Z0-9_]*-[0-9]+$/.test(value);
}

function validateOutputRequirements(value: unknown): boolean {
  return exactOrderedObject(value, [
    'finding', 'evidence', 'summary', 'canonical_sql', 'canonical_python_validation', 'structured_outputs',
  ], { frozen: true })
    && ['finding', 'evidence', 'summary', 'canonical_sql', 'canonical_python_validation'].every((key) => typeof value[key] === 'boolean')
    && Array.isArray(value.structured_outputs) && Object.isFrozen(value.structured_outputs)
    && value.structured_outputs.length > 0 && uniqueStrings(value.structured_outputs)
    && value.structured_outputs.every(transportIdentifier);
}

function validateConstraints(value: unknown): boolean {
  return exactOrderedObject(value, [
    'synthetic_fixture_only', 'raw_row_model_egress', 'approved_tools_only', 'network_tools',
    'generic_code_or_filesystem', 'decision_recommendation_or_action',
  ], { frozen: true })
    && ['synthetic_fixture_only', 'raw_row_model_egress', 'network_tools', 'generic_code_or_filesystem', 'decision_recommendation_or_action']
      .every((key) => typeof value[key] === 'boolean')
    && Array.isArray(value.approved_tools_only) && Object.isFrozen(value.approved_tools_only)
    && value.approved_tools_only.length > 0 && uniqueStrings(value.approved_tools_only);
}

function validateDiscoveryContext(value: unknown): DiscoveryContext {
  if (!deeplyFrozen(value) || !exactOrderedObject(value, ['protocol', 'source', 'comparison', 'delivery'], { frozen: true })) throw protocol();
  const { protocol: protocolValue, source, comparison, delivery } = value;
  if (!exactOrderedObject(protocolValue, ['schema_version', 'response_kind'], { frozen: true })
    || protocolValue.schema_version !== '1.0' || protocolValue.response_kind !== 'analysis_proposal') throw protocol();
  if (!exactOrderedObject(source, ['source_id', 'version', 'kind', 'path', 'sha256', 'byte_size', 'columns', 'date_coverage'], { frozen: true })
    || !transportIdentifier(source.source_id) || !nonEmptyString(source.version) || !nonEmptyString(source.kind)
    || !safeRelativePath(source.path) || !sha256Hex(source.sha256)
    || typeof source.byte_size !== 'number' || !Number.isInteger(source.byte_size) || source.byte_size < 1
    || !Array.isArray(source.columns) || !Object.isFrozen(source.columns) || source.columns.length === 0 || source.columns.some((column) => !nonEmptyString(column))
    || !exactOrderedObject(source.date_coverage, ['start_date', 'end_date'], { frozen: true })
    || !nonEmptyString(source.date_coverage.start_date) || !nonEmptyString(source.date_coverage.end_date)) throw protocol();
  if (!exactOrderedObject(comparison, ['original_question', 'question', 'objective', 'time_windows', 'metrics', 'signal_rule'], { frozen: true })
    || !['original_question', 'question', 'objective'].every((key) => nonEmptyString(comparison[key]))
    || !Array.isArray(comparison.time_windows) || comparison.time_windows.length === 0
    || !Array.isArray(comparison.metrics) || comparison.metrics.length === 0
    || !isPlainObject(comparison.signal_rule) || !Object.isFrozen(comparison.signal_rule)) throw protocol();
  for (const window of comparison.time_windows) {
    if (!exactOrderedObject(window, ['window_id', 'start_date', 'end_date'], { frozen: true })
      || !['window_id', 'start_date', 'end_date'].every((key) => nonEmptyString(window[key]))) throw protocol();
  }
  for (const metric of comparison.metrics) {
    if (!exactOrderedObject(metric, ['metric_id', 'display_name', 'definition', 'grain', 'population', 'unit'], { frozen: true })
      || Object.values(metric).some((entry) => !nonEmptyString(entry))) throw protocol();
  }
  if (!exactOrderedObject(comparison.signal_rule, ['comparison', 'supported_status'], { frozen: true })
    || !nonEmptyString(comparison.signal_rule.comparison) || !nonEmptyString(comparison.signal_rule.supported_status)) throw protocol();
  if (!exactOrderedObject(delivery, ['output_requirements', 'constraints', 'proposal_field_order'], { frozen: true })
    || !validateOutputRequirements(delivery.output_requirements)
    || !validateConstraints(delivery.constraints)
    || !exactStringArray(delivery.proposal_field_order, PROPOSAL_FIELD_ORDER)) throw protocol();
  if (!isDiscoveryContext(value)) throw protocol();
  return value;
}

function isDiscoveryContext(value: PlainRecord): value is DiscoveryContext {
  return isPlainObject(value.protocol) && isPlainObject(value.source) && isPlainObject(value.comparison) && isPlainObject(value.delivery);
}

function validateFindingContext(value: unknown): FindingContext {
  if (!deeplyFrozen(value) || !exactOrderedObject(value, ['protocol', 'identity', 'interpretation'], { frozen: true })) throw protocol();
  const { protocol: protocolValue, identity, interpretation } = value;
  if (!exactOrderedObject(protocolValue, ['schema_version', 'response_kind'], { frozen: true })
    || protocolValue.schema_version !== '1.0' || protocolValue.response_kind !== 'finding_envelope') throw protocol();
  if (!exactOrderedObject(identity, ['finding_id', 'evidence_ids'], { frozen: true }) || !transportIdentifier(identity.finding_id)
    || !Array.isArray(identity.evidence_ids) || !Object.isFrozen(identity.evidence_ids) || identity.evidence_ids.length === 0
    || !uniqueStrings(identity.evidence_ids) || identity.evidence_ids.some((id) => !transportIdentifier(id))) throw protocol();
  if (!exactOrderedObject(interpretation, ['statement', 'required_status', 'required_limitations', 'prohibited_categories'], { frozen: true })
    || !nonEmptyString(interpretation.statement) || !nonEmptyString(interpretation.required_status)) throw protocol();
  for (const key of ['required_limitations', 'prohibited_categories']) {
    if (!Array.isArray(interpretation[key]) || !Object.isFrozen(interpretation[key]) || interpretation[key].length === 0
      || interpretation[key].some((entry) => !nonEmptyString(entry))) throw protocol();
  }
  if (!isFindingContext(value)) throw protocol();
  return value;
}

function isFindingContext(value: PlainRecord): value is FindingContext {
  return isPlainObject(value.protocol) && isPlainObject(value.identity) && isPlainObject(value.interpretation);
}

function exactArray(value: unknown, expected: readonly unknown[], { frozen = false }: { frozen?: boolean } = {}): boolean {
  return Array.isArray(value) && (!frozen || Object.isFrozen(value))
    && value.length === expected.length && value.every((entry, index) => entry === expected[index]);
}

function exactModel(value: unknown, { frozen = false }: { frozen?: boolean } = {}): value is FactoryConfig {
  return exactObject(value, ['provider', 'model_id'], { frozen })
    && value.provider === PROVIDER && value.model_id === MODEL_ID;
}

function closedFrozenModel(value: unknown): value is ModelIdentity {
  return exactObject(value, ['provider', 'model_id'], { frozen: true })
    && typeof value.provider === 'string' && typeof value.model_id === 'string';
}

function sanitized(code: string): AdapterError {
  const error: AdapterError = Object.assign(new Error(code), { code });
  error.stack = undefined;
  return error;
}

function protocol() { return sanitized('PROTOCOL_FAILURE'); }

function validateFactoryInput(input: unknown): asserts input is FactoryConfig {
  if (!exactModel(input)) throw sanitized('MODEL_UNAVAILABLE');
}

function validateInjection(input: unknown): SdkFactory | undefined {
  if (input === undefined) return undefined;
  if (!exactObject(input, ['sdkSessionFactory']) || typeof input.sdkSessionFactory !== 'function') throw protocol();
  return sdkFactory(input.sdkSessionFactory);
}

function sdkFactory(value: unknown): SdkFactory {
  if (!isSdkFactory(value)) throw protocol();
  return value;
}

function isSdkFactory(value: unknown): value is SdkFactory { return typeof value === 'function'; }

function validateOpenInput(input: unknown): Parameters<AgentAnalysisRuntime['openSession']>[0] {
  if (!isPlainObject(input)) throw protocol();
  if (!Object.hasOwn(input, 'model') || !exactModel(input.model)) throw sanitized('MODEL_UNAVAILABLE');
  if (!exactObject(input, ['model', 'discovery_tools', 'execution_tools'])) throw protocol();
  if (!exactArray(input.discovery_tools, [])) throw sanitized('TOOL_POLICY_VIOLATION');
  if (!Array.isArray(input.execution_tools) || input.execution_tools.length !== TOOL_NAMES.length) throw protocol();
  for (let index = 0; index < TOOL_NAMES.length; index += 1) {
    const descriptor = input.execution_tools[index];
    if (!exactObject(descriptor, ['tool_name', 'invoke']) || descriptor.tool_name !== TOOL_NAMES[index]
      || typeof descriptor.invoke !== 'function') throw protocol();
  }
  if (!isOpenInput(input)) throw protocol();
  return input;
}

function isOpenInput(value: PlainRecord): value is PlainRecord & Parameters<AgentAnalysisRuntime['openSession']>[0] {
  return exactModel(value.model) && Array.isArray(value.discovery_tools) && value.discovery_tools.length === 0
    && Array.isArray(value.execution_tools) && value.execution_tools.every((tool) => isPlainObject(tool) && typeof tool.tool_name === 'string' && typeof tool.invoke === 'function');
}

function validatePreflightInput(input: unknown): void {
  if (!exactObject(input, ['model'], { frozen: true })) throw protocol();
  if (!isPlainObject(input.model) || !Object.isFrozen(input.model)) throw protocol();
  if (!exactModel(input.model, { frozen: true })) throw sanitized('MODEL_UNAVAILABLE');
}

function frozenStatus(value: unknown, key: string, expected: unknown): boolean {
  return exactObject(value, [key], { frozen: true }) && value[key] === expected;
}

function frozenActiveStatus(value: unknown, names: readonly string[]): boolean {
  return exactObject(value, ['active_tool_names'], { frozen: true })
    && exactArray(value.active_tool_names, names, { frozen: true });
}

function frozenIdentity(value: unknown): value is ModelIdentity { return exactModel(value, { frozen: true }); }

function validateFacade(facade: unknown): SessionFacade {
  const methods = ['subscribe', 'setActiveTools', 'prompt', 'getActualModel', 'abort', 'waitForIdle', 'dispose'];
  if (!exactObject(facade, methods, { frozen: true }) || methods.some((method) => typeof facade[method] !== 'function')) throw protocol();
  if (!isFacade(facade)) throw protocol();
  return facade;
}

function isFacade(value: PlainRecord): value is PlainRecord & SessionFacade {
  return typeof value.subscribe === 'function' && typeof value.setActiveTools === 'function' && typeof value.prompt === 'function'
    && typeof value.getActualModel === 'function' && typeof value.abort === 'function' && typeof value.waitForIdle === 'function'
    && typeof value.dispose === 'function';
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return value !== null && (typeof value === 'object' || typeof value === 'function') && typeof Reflect.get(value, 'then') === 'function';
}

function emptyParameters() {
  // The schema is Adapter-owned and never crosses the business Port boundary.
  return deepFreeze(Type.Object({}, { additionalProperties: false }));
}

function translatedResult(result: unknown): PlainRecord {
  if (!isPlainObject(result) || Object.keys(result).length === 0) throw protocol();
  const text = JSON.stringify(result);
  return Object.freeze({
    content: Object.freeze([Object.freeze({ type: 'text', text })]),
    details: Object.freeze({}),
  });
}

function resultText(value: unknown): string | undefined {
  if (!exactObject(value, ['content', 'details']) || !Array.isArray(value.content)
    || value.content.length !== 1 || !exactObject(value.content[0], ['type', 'text'])
    || value.content[0].type !== 'text' || typeof value.content[0].text !== 'string'
    || !exactObject(value.details, [])) return undefined;
  return value.content[0].text;
}

function closedTerminalJson(text: string): PlainRecord {
  if (text.startsWith('<think>')) {
    const end = text.indexOf('</think>');
    if (end < 0) throw protocol();
    const thought = text.slice('<think>'.length, end);
    if (thought.includes('<think>') || thought.includes('</think>')) throw protocol();
    text = text.slice(end + '</think>'.length);
  }
  let index = 0;
  const whitespace = () => {
    while (index < text.length && /[\t\n\r ]/.test(text[index])) index += 1;
  };
  const string = () => {
    const start = index;
    if (text[index] !== '"') throw protocol();
    index += 1;
    while (index < text.length) {
      const character = text[index];
      if (character === '"') { index += 1; return text.slice(start, index); }
      if (character < ' ') throw protocol();
      if (character === '\\') {
        index += 1;
        if ('"\\/bfnrt'.includes(text[index])) index += 1;
        else if (text[index] === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) index += 5;
        else throw protocol();
      } else index += 1;
    }
    throw protocol();
  };
  const value = () => {
    whitespace();
    if (text[index] === '"') { string(); return; }
    if (text[index] === '{') {
      index += 1;
      whitespace();
      const keys = new Set();
      if (text[index] === '}') { index += 1; return; }
      while (true) {
        whitespace();
        const key = JSON.parse(string());
        if (keys.has(key)) throw protocol();
        keys.add(key);
        whitespace();
        if (text[index] !== ':') throw protocol();
        index += 1;
        value();
        whitespace();
        if (text[index] === '}') { index += 1; return; }
        if (text[index] !== ',') throw protocol();
        index += 1;
      }
    }
    if (text[index] === '[') {
      index += 1;
      whitespace();
      if (text[index] === ']') { index += 1; return; }
      while (true) {
        value();
        whitespace();
        if (text[index] === ']') { index += 1; return; }
        if (text[index] !== ',') throw protocol();
        index += 1;
      }
    }
    if (text.startsWith('true', index)) { index += 4; return; }
    if (text.startsWith('false', index)) { index += 5; return; }
    if (text.startsWith('null', index)) { index += 4; return; }
    const number = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    number.lastIndex = index;
    const match = number.exec(text);
    if (!match) throw protocol();
    index += match[0].length;
  };
  value();
  whitespace();
  if (index !== text.length) throw protocol();
  const parsed = JSON.parse(text);
  if (!isPlainObject(parsed)) throw protocol();
  return parsed;
}

function parseFinalText(event: unknown, phase: 'discovery' | 'execution'): AnalysisProposal | Finding {
  if (!exactObject(event, ['type', 'message']) || event.type !== 'message_end'
    || !exactObject(event.message, ['role', 'content', 'stopReason']) || event.message.role !== 'assistant'
    || event.message.stopReason !== 'stop' || !Array.isArray(event.message.content) || !event.message.content.length) throw protocol();
  let text = '';
  for (const block of event.message.content) {
    if (!exactObject(block, ['type', 'text']) || block.type !== 'text' || typeof block.text !== 'string') throw protocol();
    text += block.text;
  }
  try {
    const parsed = closedTerminalJson(text);
    if (!isPlainObject(parsed)) throw protocol();
    if (phase === 'discovery' && Object.keys(parsed).length > 0
      && !exactOrderedObject(parsed, ['protocol', 'source', 'comparison', 'delivery']) && isAnalysisProposal(parsed)) return parsed;
    if (phase === 'execution' && exactObject(parsed, ['finding']) && isFinding(parsed.finding)) return parsed.finding;
  } catch (error) {
    if (errorCode(error)) throw error;
  }
  throw protocol();
}

function isAnalysisProposal(value: unknown): value is AnalysisProposal {
  return isPlainObject(value) && typeof value.schema_version === 'string' && typeof value.original_question === 'string' && typeof value.question === 'string'
    && typeof value.objective === 'string' && Array.isArray(value.source_ids) && value.source_ids.every((entry) => typeof entry === 'string')
    && isPlainObject(value.fixture) && Array.isArray(value.time_windows) && value.time_windows.every(isPlainObject)
    && Array.isArray(value.metrics) && value.metrics.every(isPlainObject) && isPlainObject(value.signal_rule)
    && isPlainObject(value.output_requirements) && isPlainObject(value.constraints);
}

function isFinding(value: unknown): value is Finding {
  return isPlainObject(value) && typeof value.finding_id === 'string' && typeof value.status === 'string'
    && typeof value.statement === 'string' && Array.isArray(value.evidence_ids) && value.evidence_ids.every((entry) => typeof entry === 'string')
    && Array.isArray(value.limitations) && value.limitations.every((entry) => typeof entry === 'string');
}

function errorCode(error: unknown): unknown {
  return error !== null && (typeof error === 'object' || typeof error === 'function') && 'code' in error ? Reflect.get(error, 'code') : undefined;
}

function projectEvent(event: unknown, rawSdk = false): ProjectedEvent | undefined {
  if (!isPlainObject(event) || typeof event.type !== 'string') throw protocol();
  if (['agent_start', 'turn_start', 'turn_end', 'message_start', 'tool_execution_update'].includes(event.type)) return undefined;
  if (event.type === 'message_update') {
    if (!isPlainObject(event.assistantMessageEvent)) throw protocol();
    if (event.assistantMessageEvent.type !== 'text_delta') return undefined;
    if (typeof event.assistantMessageEvent.delta !== 'string' || !event.assistantMessageEvent.delta) throw protocol();
    return deepFreeze({ type: 'message_update', assistantMessageEvent: { type: 'text_delta', delta: event.assistantMessageEvent.delta } });
  }
  if (event.type === 'message_end') {
    if (!isPlainObject(event.message) || !Object.hasOwn(event.message, 'role')) throw protocol();
    if (rawSdk && (event.message.role === 'user' || event.message.role === 'toolResult')) return undefined;
    if (event.message.role !== 'assistant' || !Object.hasOwn(event.message, 'content')
      || !Object.hasOwn(event.message, 'stopReason') || !Array.isArray(event.message.content)) throw protocol();
    if (!rawSdk && Object.keys(event.message).length !== 3) throw protocol();
    if (event.message.stopReason === 'toolUse') return undefined;
    if (event.message.stopReason !== 'stop') return deepFreeze({ type: 'model_terminal_failure' });
    const content = event.message.content.filter((block) => isPlainObject(block) && block.type === 'text')
      .map((block) => {
        if (typeof block.text !== 'string' || !block.text) throw protocol();
        return { type: 'text', text: block.text };
      });
    if (!content.length) throw protocol();
    return deepFreeze({ type: 'message_end', message: { role: 'assistant', content, stopReason: event.message.stopReason } });
  }
  if (event.type === 'tool_execution_start') {
    if (typeof event.toolCallId !== 'string' || !event.toolCallId || typeof event.toolName !== 'string' || !event.toolName || !exactObject(event.args, [])) throw sanitized('TOOL_POLICY_VIOLATION');
    return deepFreeze({ type: 'tool_execution_start', toolCallId: event.toolCallId, toolName: event.toolName, args: {} });
  }
  if (event.type === 'tool_execution_end') {
    if (typeof event.toolCallId !== 'string' || !event.toolCallId || typeof event.toolName !== 'string' || !event.toolName
      || typeof event.isError !== 'boolean' || resultText(event.result) === undefined) throw protocol();
    return deepFreeze({ type: 'tool_execution_end', toolCallId: event.toolCallId, toolName: event.toolName, result: {
      content: [{ type: 'text', text: resultText(event.result) }], details: {},
    }, isError: event.isError });
  }
  if (event.type === 'agent_end') {
    if (typeof event.willRetry !== 'boolean') throw protocol();
    return deepFreeze({ type: 'agent_end', willRetry: event.willRetry });
  }
  if (event.type === 'agent_settled') return deepFreeze({ type: 'agent_settled' });
  throw protocol();
}

function createInertResourceLoader(sdk: SdkNamespace, settings: unknown, systemPrompt: string): PlainRecord {
  const backing = new sdk.DefaultResourceLoader({
    cwd: '/', agentDir: '/', settingsManager: settings,
    noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
  });
  const empty = Object.freeze([]);
  const emptyResources = Object.freeze({ skills: empty, diagnostics: empty });
  const emptyPrompts = Object.freeze({ prompts: empty, diagnostics: empty });
  const emptyThemes = Object.freeze({ themes: empty, diagnostics: empty });
  const emptyAgentsFiles = Object.freeze({ agentsFiles: empty });
  return Object.freeze({
    getExtensions() { return backing.getExtensions(); },
    getSkills() { return emptyResources; },
    getPrompts() { return emptyPrompts; },
    getThemes() { return emptyThemes; },
    getAgentsFiles() { return emptyAgentsFiles; },
    getSystemPrompt() { return systemPrompt; },
    getSystemPromptSource() { return undefined; },
    getAppendSystemPrompt() { return empty; },
    getAppendSystemPromptSources() { return empty; },
    extendResources() { return undefined; },
    async reload() { return undefined; },
  });
}

async function createProductionReadiness(request: Readonly<{ requested_model: ModelIdentity }>): Promise<ProductionReadiness> {
  let sdk: RuntimeSdk;
  let runtime: ModelRuntime;
  try {
    const sdkSpecifier = ['@earendil-works', 'pi-coding-agent'].join('/');
    const loaded: unknown = await import(sdkSpecifier);
    sdk = validateRuntimeSdk(loaded);
    runtime = validateModelRuntime(await sdk.ModelRuntime.create({ allowModelNetwork: false, refreshOnCreate: false }));
    await runtime.refresh({ allowNetwork: false });
  } catch {
    throw sanitized('RUNTIME_UNAVAILABLE');
  }
  let model: unknown;
  try {
    model = runtime.getModel(request.requested_model.provider, request.requested_model.model_id);
  } catch {
    throw sanitized('MODEL_UNAVAILABLE');
  }
  if (!model) throw sanitized('MODEL_UNAVAILABLE');
  const actual = observedModel(model);
  if (actual.provider !== request.requested_model.provider || actual.model_id !== request.requested_model.model_id) {
    throw sanitized('MODEL_UNAVAILABLE');
  }
  return Object.freeze({ sdk, runtime, model: sdkModel(model) });
}

function validateRuntimeSdk(value: unknown): RuntimeSdk {
  if (!runtimeSdk(value)) throw protocol();
  return value;
}

function runtimeSdk(value: unknown): value is RuntimeSdk {
  return isObjectLike(value) && hasCallableProperty(Reflect.get(value, 'ModelRuntime'), 'create');
}

function validateSdk(value: unknown): SdkNamespace {
  if (!sdkNamespace(value)) throw protocol();
  return value;
}

function sdkNamespace(value: unknown): value is SdkNamespace {
  if (!isObjectLike(value)) return false;
  return hasCallableProperty(Reflect.get(value, 'ModelRuntime'), 'create')
    && typeof Reflect.get(value, 'DefaultResourceLoader') === 'function'
    && hasCallableProperty(Reflect.get(value, 'SettingsManager'), 'inMemory')
    && hasCallableProperty(Reflect.get(value, 'SessionManager'), 'inMemory')
    && typeof Reflect.get(value, 'createAgentSession') === 'function';
}

function validateModelRuntime(value: unknown): ModelRuntime {
  if (!isModelRuntime(value)) throw protocol();
  return value;
}

function isModelRuntime(value: unknown): value is ModelRuntime {
  return hasCallableProperty(value, 'refresh') && hasCallableProperty(value, 'getModel');
}

function observedModel(model: unknown): ModelIdentity {
  if (!isSdkModel(model)) {
    throw sanitized('MODEL_UNAVAILABLE');
  }
  return Object.freeze({ provider: model.provider, model_id: model.id });
}

function isSdkModel(value: unknown): value is SdkModel {
  return isPlainObject(value) && typeof value.provider === 'string' && !!value.provider && typeof value.id === 'string' && !!value.id;
}

function sdkModel(value: unknown): SdkModel {
  if (!isSdkModel(value)) throw sanitized('MODEL_UNAVAILABLE');
  return value;
}

async function createProductionFacade(request: FacadeRequest, readiness: ProductionReadiness): Promise<SessionFacade> {
  let listener: FacadeListener | undefined;
  let disposed = false;
  const { runtime, model } = readiness;
  const sdk = validateSdk(readiness.sdk);
  const settings = sdk.SettingsManager.inMemory({ retry: { enabled: false, maxRetries: 0 }, compaction: { enabled: false } });
  const inertLoader = createInertResourceLoader(sdk, settings, request.system_prompt);
  const created = await sdk.createAgentSession({
    modelRuntime: runtime, model, sessionManager: sdk.SessionManager.inMemory('/'), settingsManager: settings,
    resourceLoader: inertLoader, noTools: 'all', customTools: request.custom_tools, tools: TOOL_NAMES,
  });
  const session = productionSession(sessionCandidate(created));
  const realized = { session, unsubscribe: session.subscribe?.((event: unknown) => {
    const projected = projectEvent(event, true);
    if (projected) listener?.(projected);
  }) };
  const live = () => { if (disposed) throw protocol(); };
  return Object.freeze({
    subscribe(next) {
      live();
      if (arguments.length !== 1 || typeof next !== 'function' || listener) throw protocol();
      listener = next;
      return function unsubscribe() { if (arguments.length !== 0) throw protocol(); listener = undefined; };
    },
    setActiveTools(names) {
      live();
      if (arguments.length !== 1 || !exactArray(names, TOOL_NAMES.length ? names : [], { frozen: true })) throw protocol();
      session.setActiveToolsByName([...names]);
      const active_tool_names = session.getActiveToolNames();
      if (!Array.isArray(active_tool_names) || active_tool_names.some((name) => typeof name !== 'string')) throw protocol();
      return Object.freeze({ active_tool_names: Object.freeze([...active_tool_names]) });
    },
    async prompt(text, options) {
      live();
      if (arguments.length !== 2 || typeof text !== 'string' || !text || options !== EMPTY_OPTIONS) throw protocol();
      await session.prompt(text, { expandPromptTemplates: false });
      return Object.freeze({ settled: true });
    },
    getActualModel() { live(); if (arguments.length !== 0) throw protocol(); return observedModel(session.model); },
    async abort() { live(); if (arguments.length !== 0) throw protocol(); await session.abort?.(); return Object.freeze({ aborted: true }); },
    async waitForIdle() { live(); if (arguments.length !== 0) throw protocol(); await session.waitForIdle?.(); return Object.freeze({ idle: true }); },
    dispose() {
      if (arguments.length !== 0) throw protocol();
      if (!disposed) {
        disposed = true;
        listener = undefined;
        if (realized.unsubscribe !== undefined && realized.unsubscribe !== null) {
          if (typeof realized.unsubscribe !== 'function') throw new TypeError('session unsubscribe is not callable');
          realized.unsubscribe();
        }
        session.dispose?.();
      }
      return Object.freeze({ disposed: true });
    },
  });
}

function sessionCandidate(created: unknown): unknown {
  if (created !== null && (typeof created === 'object' || typeof created === 'function')) return Reflect.get(created, 'session') ?? created;
  return created;
}

function productionSession(value: unknown): ProductionSession {
  if (!isProductionSession(value)) throw protocol();
  return value;
}

function isProductionSession(value: unknown): value is ProductionSession {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return false;
  return typeof Reflect.get(value, 'setActiveToolsByName') === 'function' && typeof Reflect.get(value, 'getActiveToolNames') === 'function'
    && typeof Reflect.get(value, 'prompt') === 'function';
}

function isProductionReadiness(value: Readiness): value is ProductionReadiness {
  return 'sdk' in value;
}

export function createPiAgentAnalysisRuntime(config: unknown, injection?: unknown): AgentAnalysisRuntime {
  validateFactoryInput(config);
  const injectedFactory = validateInjection(injection);
  const requestedModel = deepFreeze({ provider: config.provider, model_id: config.model_id });
  const readinessRequest = deepFreeze({ requested_model: requestedModel });
  let readiness: Readiness | undefined;
  let readinessPromise: Promise<Readiness> | undefined;
  let sessionOpened = false;

  return Object.freeze({
    async preflightModel(input) {
      validatePreflightInput(input);
      if (readiness) return requestedModel;
      if (!readinessPromise) {
        readinessPromise = (async (): Promise<Readiness> => {
          if (injectedFactory) {
            const injected: InjectedReadiness = Object.freeze({ injected: true });
            return injected;
          }
          try {
            return await createProductionReadiness(readinessRequest);
          } catch (error) {
            if (errorCode(error) === 'MODEL_UNAVAILABLE' || errorCode(error) === 'RUNTIME_UNAVAILABLE') throw error;
            throw sanitized('RUNTIME_UNAVAILABLE');
          }
        })();
      }
      try {
        readiness = await readinessPromise;
        return requestedModel;
      } catch (error) {
        readinessPromise = undefined;
        if (errorCode(error) === 'MODEL_UNAVAILABLE' || errorCode(error) === 'RUNTIME_UNAVAILABLE') throw error;
        throw sanitized('RUNTIME_UNAVAILABLE');
      }
    },
    async openSession(input) {
      const open = validateOpenInput(input);
      if (!readiness) throw sanitized('MODEL_UNAVAILABLE');
      if (sessionOpened) throw protocol();
      sessionOpened = true;
      const phaseTools = open.execution_tools;
      let admissionOpen = true;
      let phase: 'created' | 'discovery_running' | 'discovered' | 'execution_running' | 'completed' | 'cancelled' | 'failed' = 'created';
      let facade: SessionFacade | undefined;
      let unsubscribe: (() => unknown) | undefined;
      let cleanupPromise: Promise<void> | undefined;
      let currentTurn: TurnState | undefined;
      let failureCode: string | undefined;
      let toolIndex = 0;
      const tools = TOOL_NAMES.map((name, index) => deepFreeze({
        name,
        label: name,
        description: `Approved Xanthil analytical capability: ${name}.`,
        parameters: emptyParameters(),
        executionMode: 'sequential',
        async execute(toolCallId: unknown, params: unknown, signal?: AbortSignal) {
          if (isCancelledPhase() || signal?.aborted) throw sanitized('CANCELLED');
          if (!admissionOpen || phase !== 'execution_running' || typeof toolCallId !== 'string' || !toolCallId
            || !exactObject(params, []) || toolIndex !== index) throw sanitized('TOOL_POLICY_VIOLATION');
          const call = currentTurn?.tools.get(toolCallId);
          if (!call || call.name !== name || call.settled) throw sanitized('TOOL_POLICY_VIOLATION');
          try {
            const result = await phaseTools[index].invoke(deepFreeze({ correlation_id: toolCallId, arguments: deepFreeze({}) }));
            if (!admissionOpen || isCancelledPhase() || signal?.aborted) throw sanitized('CANCELLED');
            if (phase !== 'execution_running') throw protocol();
            call.settled = true;
            call.result = translatedResult(result);
            return call.result;
          } catch (error) {
            if (errorCode(error) === 'CANCELLED') throw error;
            if (errorCode(error) === 'TOOL_POLICY_VIOLATION') throw error;
            if (errorCode(error) === 'PROTOCOL_FAILURE') throw error;
            throw sanitized('TOOL_POLICY_VIOLATION');
          }
        },
      }));
      const request: FacadeRequest = deepFreeze({
        requested_model: requestedModel,
        system_prompt: SYSTEM_PROMPT,
        custom_tools: Object.freeze(tools),
        policy: deepFreeze({
          allowed_tool_names: Object.freeze([...TOOL_NAMES]), initial_active_tool_names: Object.freeze([]), builtin_tools: Object.freeze([]),
          session_persistence: 'memory', resource_discovery: deepFreeze({ extensions: false, skills: false, prompts: false, themes: false, context_files: false }),
          retry: false, compaction: false, model_catalog_network: false, prompt_template_expansion: false,
        }),
      });

      function isCancelledPhase(): boolean { return phase === 'cancelled'; }

      const cleanup = async (): Promise<void> => {
        if (cleanupPromise) return cleanupPromise;
        cleanupPromise = (async () => {
          admissionOpen = false;
          let bad = false;
          try { if (typeof unsubscribe !== 'function') bad = true; else unsubscribe(); } catch { bad = true; }
          try { if (!facade || !frozenStatus(await facade.abort(), 'aborted', true)) bad = true; } catch { bad = true; }
          try { if (!facade || !frozenStatus(await facade.waitForIdle(), 'idle', true)) bad = true; } catch { bad = true; }
          try { if (!facade || !frozenStatus(facade.dispose(), 'disposed', true)) bad = true; } catch { bad = true; }
          if (bad) failureCode = 'PROTOCOL_FAILURE';
        })();
        return cleanupPromise;
      };
      const successClose = (): void => {
        admissionOpen = false;
        let bad = false;
        try { if (typeof unsubscribe !== 'function') bad = true; else unsubscribe(); } catch { bad = true; }
        try { if (!facade || !frozenStatus(facade.dispose(), 'disposed', true)) bad = true; } catch { bad = true; }
        if (bad) throw protocol();
      };
      const fail = async (code: string): Promise<never> => {
        if (isCancelledPhase()) code = 'CANCELLED';
        failureCode = failureCode ?? code;
        phase = failureCode === 'CANCELLED' ? 'cancelled' : 'failed';
        await cleanup();
        throw sanitized(failureCode ?? code);
      };
      const receive = (rawEvent: unknown): undefined => {
        if (!admissionOpen) {
          if (!isCancelledPhase()) failureCode ??= 'PROTOCOL_FAILURE';
          return undefined;
        }
        try {
          const event = projectEvent(rawEvent);
          if (!event) return undefined;
          if (!currentTurn) throw protocol();
          if (!currentTurn.admissionOpen) {
            currentTurn.failureCode ??= event.type.startsWith('tool_execution_') ? 'TOOL_POLICY_VIOLATION' : 'PROTOCOL_FAILURE';
            failureCode ??= currentTurn.failureCode;
            return undefined;
          }
          if (event.type === 'message_update') {
            if (!exactObject(event, ['type', 'assistantMessageEvent']) || !exactObject(event.assistantMessageEvent, ['type', 'delta'])
              || event.assistantMessageEvent.type !== 'text_delta' || typeof event.assistantMessageEvent.delta !== 'string' || !event.assistantMessageEvent.delta) throw protocol();
          } else if (event.type === 'tool_execution_start') {
            if (currentTurn.kind !== 'execution' || currentTurn.terminalStage !== 0 || !exactObject(event, ['type', 'toolCallId', 'toolName', 'args'])
              || typeof event.toolCallId !== 'string' || !event.toolCallId || event.toolName !== TOOL_NAMES[toolIndex] || !exactObject(event.args, [])
              || currentTurn.tools.has(event.toolCallId)) { failureCode ??= 'TOOL_POLICY_VIOLATION'; return undefined; }
            currentTurn.tools.set(event.toolCallId, { name: event.toolName, settled: false });
          } else if (event.type === 'tool_execution_end') {
            if (currentTurn.kind !== 'execution' || currentTurn.terminalStage !== 0 || !exactObject(event, ['type', 'toolCallId', 'toolName', 'result', 'isError'])
              || typeof event.toolCallId !== 'string' || typeof event.toolName !== 'string' || event.isError !== false) { failureCode ??= 'TOOL_POLICY_VIOLATION'; return undefined; }
            const call = currentTurn.tools.get(event.toolCallId);
            if (!call || call.name !== event.toolName || !call.settled || resultText(event.result) !== resultText(call.result)) { failureCode ??= 'TOOL_POLICY_VIOLATION'; return undefined; }
            toolIndex += 1;
          } else if (event.type === 'message_end') {
            if (currentTurn.terminalStage !== 0 || (currentTurn.kind === 'execution' && toolIndex !== TOOL_NAMES.length)) throw protocol();
            currentTurn.result = parseFinalText(event, currentTurn.kind);
            currentTurn.terminalStage = 1;
          } else if (event.type === 'model_terminal_failure') {
            if (!exactObject(event, ['type']) || currentTurn.terminalStage !== 0) throw protocol();
            currentTurn.failureCode ??= 'MODEL_EXECUTION_FAILED';
            failureCode ??= currentTurn.failureCode;
          } else if (event.type === 'agent_end') {
            if (!exactObject(event, ['type', 'willRetry']) || event.willRetry !== false) throw protocol();
            if (currentTurn.terminalStage === 0) currentTurn.terminalStage = 4;
            else if (currentTurn.terminalStage === 1) currentTurn.terminalStage = 2;
            else throw protocol();
          } else if (event.type === 'agent_settled') {
            if (!exactObject(event, ['type'])) throw protocol();
            if (currentTurn.terminalStage === 4) {
              currentTurn.failureCode ??= 'MODEL_EXECUTION_FAILED';
              failureCode ??= currentTurn.failureCode;
            } else if (currentTurn.terminalStage !== 2) throw protocol();
            currentTurn.terminalStage = 3;
            currentTurn.admissionOpen = false;
          } else throw protocol();
        } catch (error) { failureCode ??= errorCode(error) === 'TOOL_POLICY_VIOLATION' ? 'TOOL_POLICY_VIOLATION' : 'PROTOCOL_FAILURE'; }
        return undefined;
      };

      try {
        if (injectedFactory) facade = validateFacade(await injectedFactory(request));
        else {
          if (!isProductionReadiness(readiness)) throw protocol();
          facade = validateFacade(await createProductionFacade(request, readiness));
        }
        const subscribed = facade.subscribe(receive);
        if (!isUnsubscribe(subscribed)) {
          failureCode = 'PROTOCOL_FAILURE';
          phase = 'failed';
          await cleanup();
          throw protocol();
        }
        unsubscribe = subscribed;
      } catch (error) {
        if (facade && !cleanupPromise) {
          failureCode = 'PROTOCOL_FAILURE';
          phase = 'failed';
          await cleanup();
        }
        if (errorCode(error) === 'PROTOCOL_FAILURE') throw protocol();
        throw sanitized('MODEL_UNAVAILABLE');
      }

      if (!facade) throw sanitized('MODEL_UNAVAILABLE');
      const admittedFacade = facade;
      const session: AgentAnalysisSession = Object.freeze({
        async discover(value) {
          if (isCancelledPhase()) throw sanitized('CANCELLED');
          if (phase !== 'created') throw protocol();
          if (!exactOrderedObject(value, ['discovery_context'], { frozen: true })) throw protocol();
          const discovery_context = validateDiscoveryContext(value.discovery_context);
          phase = 'discovery_running'; toolIndex = 0; currentTurn = { kind: 'discovery', terminalStage: 0, tools: new Map(), admissionOpen: true, failureCode: undefined };
          try {
            const active = admittedFacade.setActiveTools(Object.freeze([]));
            if (!frozenActiveStatus(active, [])) throw protocol();
            const pending = admittedFacade.prompt(`XANTHIL_DISCOVERY_V1\n${JSON.stringify({
              phase: 'discovery',
              discovery_context,
              required_response: {
                kind: 'analysis_proposal',
                return_only_json: true,
                proposal_field_order: discovery_context.delivery.proposal_field_order,
                response_template: {
                  schema_version: discovery_context.protocol.schema_version,
                  original_question: discovery_context.comparison.original_question,
                  question: discovery_context.comparison.question,
                  objective: discovery_context.comparison.objective,
                  source_ids: [discovery_context.source.source_id],
                  fixture: discovery_context.source,
                  time_windows: discovery_context.comparison.time_windows,
                  metrics: discovery_context.comparison.metrics,
                  signal_rule: discovery_context.comparison.signal_rule,
                  output_requirements: discovery_context.delivery.output_requirements,
                  constraints: discovery_context.delivery.constraints,
                },
              },
            })}`, EMPTY_OPTIONS);
            if (!isThenable(pending)) throw protocol();
            const status = await pending;
            if (isCancelledPhase()) throw sanitized('CANCELLED');
            if (!frozenStatus(status, 'settled', true) || currentTurn.terminalStage !== 3 || currentTurn.failureCode || failureCode) throw protocol();
            const actual = admittedFacade.getActualModel();
            if (!closedFrozenModel(actual)) throw protocol();
            if (actual.provider !== requestedModel.provider || actual.model_id !== requestedModel.model_id) throw sanitized('MODEL_EXECUTION_FAILED');
            phase = 'discovered';
            if (!isAnalysisProposal(currentTurn.result)) throw protocol();
            return currentTurn.result;
          } catch (error) {
            const code = errorCode(error);
            return fail(isCancelledPhase() || code === 'CANCELLED' ? 'CANCELLED' : code === 'MODEL_EXECUTION_FAILED' ? 'MODEL_EXECUTION_FAILED'
              : failureCode ?? (typeof code === 'string' && code ? code : 'MODEL_EXECUTION_FAILED'));
          }
        },
        async execute(value) {
          if (isCancelledPhase()) throw sanitized('CANCELLED');
          if (phase !== 'discovered') throw protocol();
          if (!exactOrderedObject(value, ['confirmed_contract', 'finding_context', 'cancellation_signal', 'deadline_seconds'])
            || !isPlainObject(value.confirmed_contract) || !value.cancellation_signal || typeof value.cancellation_signal.aborted !== 'boolean'
            || !Number.isInteger(value.deadline_seconds) || value.deadline_seconds < 0 || value.deadline_seconds > 300) throw protocol();
          const finding_context = validateFindingContext(value.finding_context);
          if (value.cancellation_signal.aborted) return fail('CANCELLED');
          if (value.deadline_seconds === 0) return fail('TIMEOUT');
          phase = 'execution_running'; toolIndex = 0; currentTurn = { kind: 'execution', terminalStage: 0, tools: new Map(), admissionOpen: true, failureCode: undefined };
          try {
            const active = admittedFacade.setActiveTools(Object.freeze([...TOOL_NAMES]));
            if (!frozenActiveStatus(active, TOOL_NAMES)) throw protocol();
            const pending = admittedFacade.prompt(`XANTHIL_EXECUTION_V1\n${JSON.stringify({
              phase: 'execution',
              confirmed_contract: value.confirmed_contract,
              finding_context,
              required_response: {
                kind: 'finding_envelope',
                return_only_json: true,
                finding_field_order: FINDING_FIELD_ORDER,
                response_template: {
                  finding: {
                    finding_id: finding_context.identity.finding_id,
                    statement: finding_context.interpretation.statement,
                    status: finding_context.interpretation.required_status,
                    evidence_ids: finding_context.identity.evidence_ids,
                    limitations: finding_context.interpretation.required_limitations,
                  },
                },
                copy_response_template_values_exactly_after_tools_succeed: true,
                tool_use_policy: TOOL_USE_POLICY,
              },
            })}`, EMPTY_OPTIONS);
            if (!isThenable(pending)) throw protocol();
            const status = await pending;
            if (isCancelledPhase()) throw sanitized('CANCELLED');
            if (value.cancellation_signal.aborted) throw sanitized('CANCELLED');
            if (!frozenStatus(status, 'settled', true) || currentTurn.terminalStage !== 3 || currentTurn.failureCode || failureCode) throw protocol();
            const actual = admittedFacade.getActualModel();
            if (!closedFrozenModel(actual)) throw protocol();
            if (actual.provider !== requestedModel.provider || actual.model_id !== requestedModel.model_id) throw sanitized('MODEL_EXECUTION_FAILED');
            phase = 'completed';
            successClose();
            if (!isFinding(currentTurn.result)) throw protocol();
            return deepFreeze({ actual_model: { provider: actual.provider, model_id: actual.model_id }, finding: currentTurn.result });
          } catch (error) {
            const observedCode = errorCode(error);
            const code = isCancelledPhase() || observedCode === 'CANCELLED' ? 'CANCELLED' : observedCode === 'MODEL_EXECUTION_FAILED' ? 'MODEL_EXECUTION_FAILED'
              : failureCode ?? (typeof observedCode === 'string' && observedCode ? observedCode : 'MODEL_EXECUTION_FAILED');
            return fail(code);
          }
        },
        async cancel() {
          if (phase === 'completed') return deepFreeze({ cancelled: true, was_confirmed: true });
          if (isCancelledPhase()) return deepFreeze({ cancelled: true, was_confirmed: false });
          const confirmed = phase === 'discovered' || phase === 'execution_running';
          phase = 'cancelled';
          await cleanup();
          if (failureCode) throw sanitized(failureCode);
          return deepFreeze({ cancelled: true, was_confirmed: confirmed });
        },
      });
      return session;
    },
  });
}

function isUnsubscribe(value: unknown): value is () => unknown { return typeof value === 'function'; }
