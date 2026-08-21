import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createAgentRuntimeDouble,
  createDeterministicSdkSessionFactory,
  createPiAdapterScenario,
  createLocalAnalysisExecutionDouble,
  createRunArtifactFaultDouble,
  createRunArtifactStoreDouble,
  expectedBoundedToolResult,
  runAgentRuntimeContract,
  runArtifactFaultContract,
  runArtifactStoreContract,
  runLocalAnalysisExecutionContract,
} from '../../fixtures/xanthil-local-analysis/port-contracts.mjs';
import {
  approvedModel,
  canonicalFixtureBytes,
  expectedAnalysisProposal,
  expectedConfirmedContract,
  expectedDiscoveryContext,
  expectedFindingContext,
  expectedFindingProposal,
} from '../../fixtures/xanthil-local-analysis/fixture-oracle.mjs';
import { approvedToolNames, loadPublicSeam, requiredExport } from '../../fixtures/xanthil-local-analysis/public-seams.mjs';

// case:agent-runtime-negative-contract case:local-analysis-negative-contract
// case:artifact-atomic-contract case:artifact-fault-preserves-non-success

const portDefinitions = Object.freeze([
  {
    label: 'agent-runtime',
    exportName: 'defineAgentAnalysisRuntime',
    testId: 'TEST-XCLI-006',
    methods: ['preflightModel', 'openSession'],
    leaks: ['pi_sdk', 'sessionPersistence'],
  },
  {
    label: 'local-analysis',
    exportName: 'defineLocalAnalysisExecution',
    testId: 'TEST-XCLI-007',
    methods: ['preflightApprovedFixture', 'profileApprovedFixture', 'calculateMemberRepurchaseMetrics', 'validateMemberRepurchaseMetrics'],
    leaks: ['duckdb_connection', 'python_process'],
  },
  {
    label: 'run-artifact',
    exportName: 'defineRunArtifactStore',
    testId: 'TEST-XCLI-008',
    methods: ['preflightRunRoot', 'beginRun', 'commitConfirmedContract', 'appendAsset', 'replaceManifest', 'commitSuccess', 'readTerminalRun'],
    leaks: ['filesystem_handle', 'root_path'],
  },
]);

function implementationWith(methods) {
  return Object.fromEntries(methods.map((method) => [method, async () => undefined]));
}

// TASK-010 R3 intentionally invokes the public Runtime-Port phase directly.
// It must never be hidden by a fixture helper: callers which have not
// completed readiness are a distinct fail-closed case.
const r3OpenInput = (execution_tools) => Object.freeze({
  model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }),
  discovery_tools: Object.freeze([]),
  execution_tools,
});

const r3Model = Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' });

function r3ExecutionTools() {
  return Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({
    tool_name,
    invoke: async () => ({ accepted: true }),
  })));
}

test('TASK-010 R3 TEST-XCLI-006 [AC-XCLI-001-02, AC-XCLI-007-01, AC-XCLI-007-03, AC-XCLI-007-04] exposes exactly preflightModel plus openSession and rejects session opening before successful preflight', async () => {
  const adapter = await loadPublicSeam('agentAdapter');
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(r3Model, {
    sdkSessionFactory: createDeterministicSdkSessionFactory().sdkSessionFactory,
  });
  assert.deepEqual(Object.keys(runtime), ['preflightModel', 'openSession']);
  await assert.rejects(
    () => runtime.openSession(r3OpenInput(r3ExecutionTools())),
    /MODEL_UNAVAILABLE|PROTOCOL_FAILURE/,
  );
});

test('TASK-010 R3 TEST-XCLI-011 [AC-XCLI-001-02, AC-XCLI-007-03, AC-XCLI-007-04, AC-XCLI-014-02] preflight is closed, exact, cached, and creates no injected Session', async () => {
  const control = createDeterministicSdkSessionFactory();
  const adapter = await loadPublicSeam('agentAdapter');
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(r3Model, { sdkSessionFactory: control.sdkSessionFactory });
  const result = await runtime.preflightModel(Object.freeze({ model: r3Model }));
  assert.deepEqual(result, r3Model);
  assert.equal(Object.isFrozen(result), true);
  assert.strictEqual(await runtime.preflightModel(Object.freeze({ model: r3Model })), result);
  await assert.rejects(() => runtime.preflightModel(Object.freeze({ model: Object.freeze({ provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' }) })), /MODEL_UNAVAILABLE/);
  await assert.rejects(() => runtime.preflightModel(Object.freeze({ model: r3Model, extra: true })), /PROTOCOL_FAILURE/);
  assert.equal(control.requests.length, 0, 'preflight must not create a Session through the construction seam');
});

for (const [label, input, code] of [
  ['missing input', undefined, 'PROTOCOL_FAILURE'],
  ['null input', null, 'PROTOCOL_FAILURE'],
  ['missing model', Object.freeze({}), 'PROTOCOL_FAILURE'],
  ['extra outer field', Object.freeze({ model: r3Model, extra: true }), 'PROTOCOL_FAILURE'],
  ['mutable input', { model: r3Model }, 'PROTOCOL_FAILURE'],
  ['mutable inner model', Object.freeze({ model: { provider: 'minimax-cn', model_id: 'MiniMax-M3' } }), 'PROTOCOL_FAILURE'],
  ['extra inner model field', Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3', extra: true }) }), 'MODEL_UNAVAILABLE'],
  ['wrong provider', Object.freeze({ model: Object.freeze({ provider: 'wrong-provider', model_id: 'MiniMax-M3' }) }), 'MODEL_UNAVAILABLE'],
  ['wrong model ID', Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'wrong-model' }) }), 'MODEL_UNAVAILABLE'],
  ['Mimo no-fallback identity', Object.freeze({ model: Object.freeze({ provider: 'xiaomi-token-plan-cn', model_id: 'mimo-v2.5-pro' }) }), 'MODEL_UNAVAILABLE'],
]) {
  test(`TASK-010 R3 TEST-XCLI-011 [AC-XCLI-001-02, AC-XCLI-007-03] rejects ${label} preflight input before Session construction`, async () => {
    const control = createDeterministicSdkSessionFactory();
    const adapter = await loadPublicSeam('agentAdapter');
    const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(r3Model, { sdkSessionFactory: control.sdkSessionFactory });
    await assert.rejects(() => runtime.preflightModel(input), new RegExp(code));
    assert.equal(control.requests.length, 0);
  });
}

test('TASK-010 R3 TEST-XCLI-006 [AC-XCLI-006-01, AC-XCLI-007-03, AC-XCLI-007-04] uses observed model and observed active-tool inventory rather than requested echoes', async () => {
  const control = createDeterministicSdkSessionFactory({
    actualModel: { provider: 'ambient-default', model_id: 'wrong-model' },
  });
  const adapter = await loadPublicSeam('agentAdapter');
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(r3Model, { sdkSessionFactory: control.sdkSessionFactory });
  await runtime.preflightModel(Object.freeze({ model: r3Model }));
  const session = await runtime.openSession(r3OpenInput(r3ExecutionTools()));
  await assert.rejects(() => session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() })), /MODEL_EXECUTION_FAILED|PROTOCOL_FAILURE/);
  assert.equal(control.requests.length, 1);
});

test('TASK-010 R3 TEST-XCLI-011 [AC-XCLI-007-03, AC-XCLI-007-04, AC-XCLI-014-01, AC-XCLI-014-02] production construction orders local-only readiness before the one inert Session and reads Pi actual state', async () => {
  const source = await readFile(new URL('../../../adapters/agent-pi/local-analysis.mjs', import.meta.url), 'utf8');
  assert.match(source, /preflightModel/);
  assert.match(source, /ModelRuntime\.create\(\{ allowModelNetwork: false, refreshOnCreate: false \}\)/);
  assert.match(source, /runtime\.refresh\(\{ allowNetwork: false \}\)/);
  assert.match(source, /runtime\.getModel\(request\.requested_model\.provider, request\.requested_model\.model_id\)/);
  assert.match(source, /session\.model/);
  assert.match(source, /setActiveToolsByName/);
  assert.match(source, /getActiveToolNames\(\)/);
  assert.doesNotMatch(source, /actual = Object\.freeze\(\{ provider: request\.requested_model\.provider/);
});

for (const [label, observed] of [
  ['missing active tool', approvedToolNames.slice(0, 2)],
  ['extra active tool', [...approvedToolNames, 'forbidden_tool']],
  ['reordered active tools', [...approvedToolNames].reverse()],
]) {
  test(`TASK-010 R3 TEST-XCLI-006 [AC-XCLI-006-01, AC-XCLI-007-03] fails closed when observed active tools are ${label}`, async () => {
    const control = createDeterministicSdkSessionFactory({ observedActiveToolNames: observed });
    const adapter = await loadPublicSeam('agentAdapter');
    const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(r3Model, { sdkSessionFactory: control.sdkSessionFactory });
    await runtime.preflightModel(Object.freeze({ model: r3Model }));
    const session = await runtime.openSession(r3OpenInput(r3ExecutionTools()));
    await session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() }));
    await assert.rejects(() => session.execute(Object.freeze({
      confirmed_contract: expectedConfirmedContract('0198d943-8b71-7a11-9abc-0000000000a1', '2026-08-20T00:00:00.000Z'),
      finding_context: expectedFindingContext(), cancellation_signal: new AbortController().signal, deadline_seconds: 300,
    })), /TOOL_POLICY_VIOLATION|PROTOCOL_FAILURE|MODEL_EXECUTION_FAILED/);
  });
}

async function loadPortDefinition(exportName) {
  return requiredExport(await loadPublicSeam('ports'), exportName);
}

test('TASK-003 PORT-DEFINITIONS [TEST-XCLI-006, TEST-XCLI-007, TEST-XCLI-008] exports only the three approved definers', async () => {
  const ports = await loadPublicSeam('ports');
  assert.deepEqual(Object.keys(ports).sort(), portDefinitions.map(({ exportName }) => exportName).sort());
});

for (const definition of portDefinitions) {
  test(`TASK-010 R3 ${definition.testId} ${definition.label} accepts and freezes the exact preflight-plus-business methods`, async () => {
    const define = await loadPortDefinition(definition.exportName);
    const implementation = implementationWith(definition.methods);
    const result = define(implementation);
    assert.equal(Object.isFrozen(result), true);
    assert.deepEqual(Object.keys(result).sort(), [...definition.methods].sort());
    for (const method of definition.methods) assert.equal(typeof result[method], 'function', method);
  });

  for (const missingMethod of definition.methods) {
    test(`TASK-003 ${definition.testId} ${definition.label} rejects missing ${missingMethod}`, async () => {
      const define = await loadPortDefinition(definition.exportName);
      const implementation = implementationWith(definition.methods.filter((method) => method !== missingMethod));
      assert.throws(() => define(implementation), /INVALID_PORT_IMPLEMENTATION|VALIDATION_FAILED/);
    });
  }

  for (const nonFunctionMethod of definition.methods) {
    test(`TASK-003 ${definition.testId} ${definition.label} rejects non-function ${nonFunctionMethod}`, async () => {
      const define = await loadPortDefinition(definition.exportName);
      const implementation = { ...implementationWith(definition.methods), [nonFunctionMethod]: null };
      assert.throws(() => define(implementation), /INVALID_PORT_IMPLEMENTATION|VALIDATION_FAILED/);
    });
  }

  test(`TASK-010 R3 ${definition.testId} ${definition.label} rejects an extra method`, async () => {
    const define = await loadPortDefinition(definition.exportName);
    assert.throws(
      () => define({ ...implementationWith(definition.methods), retry: async () => undefined }),
      /INVALID_PORT_IMPLEMENTATION|VALIDATION_FAILED/,
    );
  });

  for (const leak of definition.leaks) {
    test(`TASK-003 ${definition.testId} ${definition.label} rejects infrastructure leak ${leak}`, async () => {
      const define = await loadPortDefinition(definition.exportName);
      assert.throws(
        () => define({ ...implementationWith(definition.methods), [leak]: {} }),
        /INVALID_PORT_IMPLEMENTATION|VALIDATION_FAILED/,
      );
    });
  }
}

test('contract helper health: test-private Agent, Local Analysis, and Artifact doubles satisfy the frozen business-operation suites', async () => {
  await runAgentRuntimeContract(createAgentRuntimeDouble);
  await runLocalAnalysisExecutionContract(createLocalAnalysisExecutionDouble);
  await runArtifactStoreContract(createRunArtifactStoreDouble);
});

test('TASK-005 helper health: deterministic mutation scenario completes an offline full Discovery/Execution lifecycle', async () => {
  const scenario = createPiAdapterScenario();
  const facade = await scenario.sdkSessionFactory(Object.freeze({
    requested_model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }),
    system_prompt: 'adapter-owned test instruction',
    custom_tools: Object.freeze(approvedToolNames.map((name) => Object.freeze({
      name,
      async execute(toolCallId, params) {
        assert.match(toolCallId, /^call-00[1-3]$/);
        assert.deepEqual(params, {});
        return Object.freeze({ content: Object.freeze([Object.freeze({ type: 'text', text: JSON.stringify({ tool: name }) })]), details: Object.freeze({}) });
      },
    }))),
    policy: Object.freeze({}),
  }));
  const events = [];
  const unsubscribe = facade.subscribe((event) => { events.push(event.type); });
  assert.deepEqual(facade.setActiveTools(Object.freeze([])), { active_tool_names: [] });
  assert.deepEqual(await facade.prompt('Discovery', Object.freeze({ expandPromptTemplates: false })), { settled: true });
  assert.deepEqual(facade.getActualModel(), { provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  assert.deepEqual(facade.setActiveTools(Object.freeze([...approvedToolNames])), { active_tool_names: approvedToolNames });
  assert.deepEqual(await facade.prompt('Execution', Object.freeze({ expandPromptTemplates: false })), { settled: true });
  assert.deepEqual(facade.getActualModel(), { provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  unsubscribe();
  assert.deepEqual(facade.dispose(), { disposed: true });
  assert.deepEqual(facade.dispose(), { disposed: true });
  assert.deepEqual(events, ['message_update', 'message_end', 'agent_end', 'agent_settled', 'tool_execution_start', 'tool_execution_end', 'tool_execution_start', 'tool_execution_end', 'tool_execution_start', 'tool_execution_end', 'message_end', 'agent_end', 'agent_settled']);
  assert.deepEqual(scenario.calls.map(({ method }) => method), ['subscribe', 'setActiveTools', 'prompt', 'getActualModel', 'setActiveTools', 'prompt', 'getActualModel', 'unsubscribe', 'dispose', 'dispose']);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 2, prompt: 2, getActualModel: 2, unsubscribe: 1, dispose: 2 });
});

test('TASK-005 TEST-XCLI-006 [AC-XCLI-006-01, AC-XCLI-006-02, AC-XCLI-006-03, AC-XCLI-007-01, AC-XCLI-007-02, AC-XCLI-007-03, AC-XCLI-013-02, AC-XCLI-013-03] drives the Pi Adapter through the frozen offline SDK construction seam', async () => {
  const ports = await loadPublicSeam('ports');
  requiredExport(ports, 'defineAgentAnalysisRuntime')(createAgentRuntimeDouble());
  const adapter = await loadPublicSeam('agentAdapter');
  const createRuntime = requiredExport(adapter, 'createPiAgentAnalysisRuntime');
  const facadeControl = createDeterministicSdkSessionFactory();
  const runtime = createRuntime({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }, { sdkSessionFactory: facadeControl.sdkSessionFactory });
  requiredExport(ports, 'defineAgentAnalysisRuntime')(runtime);
  await runAgentRuntimeContract(() => runtime);
  assert.equal(facadeControl.requests.length, 1);
  const [request] = facadeControl.requests;
  assert.equal(Object.isFrozen(request), true);
  assert.deepEqual(Object.keys(request).sort(), ['custom_tools', 'policy', 'requested_model', 'system_prompt']);
  assert.deepEqual(request.requested_model, { provider: 'minimax-cn', model_id: 'MiniMax-M3' });
  assert.equal(typeof request.system_prompt, 'string');
  assert.ok(request.system_prompt.length > 0);
  assert.deepEqual(request.custom_tools.map(({ name }) => name), approvedToolNames);
  assert.deepEqual(request.policy, {
    allowed_tool_names: approvedToolNames,
    initial_active_tool_names: [],
    builtin_tools: [],
    session_persistence: 'memory',
    resource_discovery: { extensions: false, skills: false, prompts: false, themes: false, context_files: false },
    retry: false,
    compaction: false,
    model_catalog_network: false,
    prompt_template_expansion: false,
  });
  for (const tool of request.custom_tools) {
    assert.deepEqual(Object.keys(tool).sort(), ['description', 'execute', 'executionMode', 'label', 'name', 'parameters']);
    assert.equal(tool.executionMode, 'sequential');
    assert.equal(typeof tool.execute, 'function');
    assert.equal(tool.parameters.additionalProperties, false);
  }
  assert.deepEqual(facadeControl.calls.map(({ method }) => method), [
    'subscribe', 'setActiveTools', 'prompt', 'getActualModel', 'setActiveTools', 'prompt',
    'getActualModel', 'unsubscribe', 'dispose',
  ]);
});

const promptSystemInstruction = `You are Xanthil Local Analysis Runtime v1.
Follow only the current XANTHIL_DISCOVERY_V1 or XANTHIL_EXECUTION_V1 user envelope and admitted tool results.
During Discovery, do not call tools.
During Execution, call each currently admitted tool exactly once in admitted order with exactly {}, wait for all successful results, then return the terminal JSON object.
Return exactly one terminal JSON object for the envelope required_response; do not emit prose, Markdown, code fences, or extra keys.
Do not request, infer, disclose, or use data outside the envelope and admitted tools.
Do not make a Decision, recommendation, or Action.`;

function expectedDiscoveryPrompt() {
  const discovery_context = expectedDiscoveryContext();
  const response_template = Object.freeze({
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
  });
  return `XANTHIL_DISCOVERY_V1\n${JSON.stringify({
    phase: 'discovery',
    discovery_context,
    required_response: {
      kind: 'analysis_proposal',
      return_only_json: true,
      proposal_field_order: discovery_context.delivery.proposal_field_order,
      response_template,
    },
  })}`;
}

function expectedExecutionPrompt(contract) {
  const finding_context = expectedFindingContext();
  const response_template = Object.freeze({
    finding: Object.freeze({
      finding_id: finding_context.identity.finding_id,
      statement: finding_context.interpretation.statement,
      status: finding_context.interpretation.required_status,
      evidence_ids: finding_context.identity.evidence_ids,
      limitations: finding_context.interpretation.required_limitations,
    }),
  });
  return `XANTHIL_EXECUTION_V1\n${JSON.stringify({
    phase: 'execution',
    confirmed_contract: contract,
    finding_context,
    required_response: {
      kind: 'finding_envelope',
      return_only_json: true,
      finding_field_order: ['finding'],
      response_template,
      copy_response_template_values_exactly_after_tools_succeed: true,
      tool_use_policy: {
        discovery: 'no_tools',
        execution: 'each_admitted_tool_once_in_admitted_order_with_empty_object',
      },
    },
  })}`;
}

test('TASK-009 TEST-XCLI-006 [AC-XCLI-002-01, AC-XCLI-006-01, AC-XCLI-006-02, AC-XCLI-013-02] serializes only the two frozen contexts into the exact Pi transport prompts', async () => {
  const adapter = await loadPublicSeam('agentAdapter');
  const createRuntime = requiredExport(adapter, 'createPiAgentAnalysisRuntime');
  const facadeControl = createDeterministicSdkSessionFactory();
  const runtime = createRuntime({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }, { sdkSessionFactory: facadeControl.sdkSessionFactory });
  const execution_tools = Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({ tool_name, invoke: async () => expectedBoundedToolResult(tool_name) })));
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const session = await runtime.openSession(Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }), discovery_tools: Object.freeze([]), execution_tools }));
  const discovery_context = expectedDiscoveryContext();
  assert.equal(Object.isFrozen(discovery_context), true);
  await session.discover(Object.freeze({ discovery_context }));
  const contract = Object.freeze(expectedConfirmedContract('0198d943-8b71-7a11-9abc-0000000000a1', '2026-08-20T00:00:00.000Z'));
  const finding_context = expectedFindingContext();
  assert.equal(Object.isFrozen(finding_context), true);
  await session.execute(Object.freeze({ confirmed_contract: contract, finding_context, cancellation_signal: new AbortController().signal, deadline_seconds: 300 }));
  const [request] = facadeControl.requests;
  assert.equal(request.system_prompt, promptSystemInstruction);
  assert.equal(/SRC-001|member-orders|2026-08|repurchase|F-001|E-001|mimo-v2\.5-pro/i.test(request.system_prompt), false);
  const prompts = facadeControl.calls.filter(({ method }) => method === 'prompt');
  assert.deepEqual(prompts.map(({ text }) => text), [expectedDiscoveryPrompt(), expectedExecutionPrompt(contract)]);
});

function r4ExecutionTools() {
  return Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({
    tool_name,
    invoke: async () => expectedBoundedToolResult(tool_name),
  })));
}

async function openR4TransportSession(factoryOptions = {}) {
  const adapter = await loadPublicSeam('agentAdapter');
  const facadeControl = createDeterministicSdkSessionFactory(factoryOptions);
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(approvedModel, { sdkSessionFactory: facadeControl.sdkSessionFactory });
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const session = await runtime.openSession(Object.freeze({
    model: approvedModel,
    discovery_tools: Object.freeze([]),
    execution_tools: r4ExecutionTools(),
  }));
  return { session, facadeControl };
}

test('TASK-009 R4 TEST-XCLI-006 [AC-XCLI-007-04, AC-XCLI-007-06, R4-AC-001-01, R4-AC-001-02, R4-AC-003-01] binds only MiniMax-M3 and derives both closed response templates from Application context', async () => {
  const { session, facadeControl } = await openR4TransportSession();
  const proposal = await session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() }));
  assert.deepEqual(proposal, expectedAnalysisProposal());
  const contract = Object.freeze(expectedConfirmedContract('0198d943-8b71-7a11-9abc-0000000000a1', '2026-08-20T00:00:00.000Z'));
  const finding = await session.execute(Object.freeze({
    confirmed_contract: contract,
    finding_context: expectedFindingContext(),
    cancellation_signal: new AbortController().signal,
    deadline_seconds: 300,
  }));
  assert.deepEqual(finding, { actual_model: approvedModel, finding: expectedFindingProposal() });
  assert.deepEqual(facadeControl.requests[0].requested_model, approvedModel);
  assert.deepEqual(facadeControl.calls.filter(({ method }) => method === 'prompt').map(({ text }) => text), [
    expectedDiscoveryPrompt(),
    expectedExecutionPrompt(contract),
  ]);
});

for (const [label, discoveryText] of [
  ['one complete leading think prefix', `<think>internal-only</think>${JSON.stringify(expectedAnalysisProposal())}`],
  ['top-level duplicate member', `{"schema_version":"1.0","schema_version":"1.0",${JSON.stringify(expectedAnalysisProposal()).slice(1)}`],
  ['nested duplicate member', JSON.stringify(expectedAnalysisProposal()).replace('"source_id":"SRC-001"', '"source_id":"SRC-001","source_id":"SRC-001"')],
  ['fenced JSON', `\`\`\`json\n${JSON.stringify(expectedAnalysisProposal())}\n\`\`\``],
  ['commentary before JSON', `note ${JSON.stringify(expectedAnalysisProposal())}`],
  ['repeated nested leading think tag', `<think>outer<think>nested</think>${JSON.stringify(expectedAnalysisProposal())}`],
  ['unterminated think prefix', `<think>internal-only${JSON.stringify(expectedAnalysisProposal())}`],
  ['suffix think tag', `${JSON.stringify(expectedAnalysisProposal())}<think>internal-only</think>`],
  ['multiple objects', `${JSON.stringify(expectedAnalysisProposal())}${JSON.stringify(expectedAnalysisProposal())}`],
  ['non-object JSON', '[]'],
  ['malformed JSON', '{'],
  ['empty terminal', ''],
]) {
  test(`TASK-009 R4 TEST-XCLI-006 [AC-XCLI-007-05, R4-AC-002-01, R4-AC-002-02] closed Discovery transport ${label}`, async () => {
    const { session, facadeControl } = await openR4TransportSession({ discoveryText });
    if (label === 'one complete leading think prefix') {
      assert.deepEqual(await session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() })), expectedAnalysisProposal());
    } else {
      await assert.rejects(() => session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() })), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    }
    assert.equal(facadeControl.calls.filter(({ method }) => method === 'prompt').length, 1);
  });
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

async function promptContextSession() {
  const adapter = await loadPublicSeam('agentAdapter');
  const facadeControl = createDeterministicSdkSessionFactory();
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(
    { provider: 'minimax-cn', model_id: 'MiniMax-M3' },
    { sdkSessionFactory: facadeControl.sdkSessionFactory },
  );
  const execution_tools = Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({ tool_name, invoke: async () => expectedBoundedToolResult(tool_name) })));
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const session = await runtime.openSession(Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }), discovery_tools: Object.freeze([]), execution_tools }));
  return { session, facadeControl };
}

const invalidDiscoveryContexts = Object.freeze([
  ['missing context', undefined],
  ['null context', null],
  ['non-plain context', freezeDeep([])],
  ['mutable context', structuredClone(expectedDiscoveryContext())],
  ['extra context field', freezeDeep({ ...structuredClone(expectedDiscoveryContext()), extra: true })],
  ['reordered context field', freezeDeep(Object.fromEntries(Object.entries(expectedDiscoveryContext()).reverse()))],
  ['semantic protocol mismatch', freezeDeep({ ...structuredClone(expectedDiscoveryContext()), protocol: { schema_version: '1.0', response_kind: 'finding_envelope' } })],
]);

for (const [label, discovery_context] of invalidDiscoveryContexts) {
  test(`TASK-009 TEST-XCLI-006 rejects ${label} before a Discovery prompt`, async () => {
    const { session, facadeControl } = await promptContextSession();
    const input = discovery_context === undefined ? Object.freeze({}) : Object.freeze({ discovery_context });
    await assert.rejects(() => session.discover(input), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assert.equal(facadeControl.calls.filter(({ method }) => method === 'prompt').length, 0);
  });
}

test('TASK-009 TEST-XCLI-006 rejects the former vague-question Discovery shape before a prompt', async () => {
  const { session, facadeControl } = await promptContextSession();
  await assert.rejects(() => session.discover(Object.freeze({ question: discoveryQuestion })), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.equal(facadeControl.calls.filter(({ method }) => method === 'prompt').length, 0);
});

const invalidFindingContexts = Object.freeze([
  ['missing context', undefined],
  ['null context', null],
  ['non-plain context', freezeDeep([])],
  ['mutable context', structuredClone(expectedFindingContext())],
  ['extra context field', freezeDeep({ ...structuredClone(expectedFindingContext()), extra: true })],
  ['reordered context field', freezeDeep(Object.fromEntries(Object.entries(expectedFindingContext()).reverse()))],
  ['semantic protocol mismatch', freezeDeep({ ...structuredClone(expectedFindingContext()), protocol: { schema_version: '1.0', response_kind: 'analysis_proposal' } })],
]);

for (const [label, finding_context] of invalidFindingContexts) {
  test(`TASK-009 TEST-XCLI-006 rejects ${label} before an Execution prompt`, async () => {
    const { session, facadeControl } = await promptContextSession();
    await session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() }));
    const contract = Object.freeze(expectedConfirmedContract('0198d943-8b71-7a11-9abc-0000000000a1', '2026-08-20T00:00:00.000Z'));
    const input = finding_context === undefined
      ? Object.freeze({ confirmed_contract: contract, cancellation_signal: new AbortController().signal, deadline_seconds: 300 })
      : Object.freeze({ confirmed_contract: contract, finding_context, cancellation_signal: new AbortController().signal, deadline_seconds: 300 });
    await assert.rejects(() => session.execute(input), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assert.equal(facadeControl.calls.filter(({ method }) => method === 'prompt').length, 1);
  });
}

test('TASK-009 TEST-XCLI-006 rejects a context-shaped Discovery output instead of treating it as a Proposal', async () => {
  const adapter = await loadPublicSeam('agentAdapter');
  const runtime = requiredExport(adapter, 'createPiAgentAnalysisRuntime')(
    { provider: 'minimax-cn', model_id: 'MiniMax-M3' },
    { sdkSessionFactory: createDeterministicSdkSessionFactory({ proposal: expectedDiscoveryContext() }).sdkSessionFactory },
  );
  const execution_tools = Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({ tool_name, invoke: async () => expectedBoundedToolResult(tool_name) })));
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const session = await runtime.openSession(Object.freeze({ model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }), discovery_tools: Object.freeze([]), execution_tools }));
  await assert.rejects(() => session.discover(Object.freeze({ discovery_context: expectedDiscoveryContext() })), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
});

function mutatedDiscoveryContext(mutator) {
  const value = structuredClone(expectedDiscoveryContext());
  mutator(value);
  return freezeDeep(value);
}

function mutatedFindingContext(mutator) {
  const value = structuredClone(expectedFindingContext());
  mutator(value);
  return freezeDeep(value);
}

const nestedDiscoveryContextMutations = Object.freeze([
  ['source unknown secret-like field', mutatedDiscoveryContext((value) => { value.source.unapproved_secret_marker = 'do-not-log'; })],
  ['source unsafe absolute path', mutatedDiscoveryContext((value) => { value.source.path = '/outside/member-orders-v1.csv'; })],
  ['source traversal path', mutatedDiscoveryContext((value) => { value.source.path = '../member-orders-v1.csv'; })],
  ['source lexically invalid hash', mutatedDiscoveryContext((value) => { value.source.sha256 = 'not-a-lowercase-64-hex-sha256'; })],
  ['comparison unknown field', mutatedDiscoveryContext((value) => { value.comparison.extra = true; })],
  ['comparison signal-rule wrong shape', mutatedDiscoveryContext((value) => { value.comparison.signal_rule = []; })],
  ['delivery output-requirements unknown field', mutatedDiscoveryContext((value) => { value.delivery.output_requirements.extra = true; })],
  ['delivery constraints missing field', mutatedDiscoveryContext((value) => { delete value.delivery.constraints.network_tools; })],
  ['delivery proposal field order reordered', mutatedDiscoveryContext((value) => { value.delivery.proposal_field_order.reverse(); })],
]);

for (const [label, discovery_context] of nestedDiscoveryContextMutations) {
  test(`TASK-009 TEST-XCLI-006 rejects nested Discovery context ${label} before egress`, async () => {
    const { session, facadeControl } = await promptContextSession();
    await assert.rejects(() => session.discover(Object.freeze({ discovery_context })), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assert.equal(facadeControl.calls.filter(({ method }) => method === 'prompt').length, 0);
  });
}

const nestedFindingContextMutations = Object.freeze([
  ['identity unknown field', mutatedFindingContext((value) => { value.identity.extra = true; })],
  ['identity malformed finding ID', mutatedFindingContext((value) => { value.identity.finding_id = 'finding-001'; })],
  ['identity duplicate evidence ID', mutatedFindingContext((value) => { value.identity.evidence_ids = ['E-001', 'E-001']; })],
  ['interpretation unknown field', mutatedFindingContext((value) => { value.interpretation.extra = true; })],
  ['interpretation missing limitations', mutatedFindingContext((value) => { delete value.interpretation.required_limitations; })],
]);

for (const [label, finding_context] of nestedFindingContextMutations) {
  test(`TASK-009 TEST-XCLI-006 rejects nested Finding context ${label} before egress`, async () => {
    const { session, facadeControl } = await promptContextSession();
    await session.discover(approvedDiscoveryInput());
    await assert.rejects(() => session.execute(approvedExecutionInput({ finding_context })), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assert.equal(facadeControl.calls.filter(({ method }) => method === 'prompt').length, 1);
  });
}

function validAgentOpenInput() {
  return Object.freeze({
    model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }),
    discovery_tools: Object.freeze([]),
    execution_tools: Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({ tool_name, invoke: async () => ({}) }))),
  });
}

async function injectedPiRuntime(factory) {
  const adapter = await loadPublicSeam('agentAdapter');
  return requiredExport(adapter, 'createPiAgentAnalysisRuntime')(
    { provider: 'minimax-cn', model_id: 'MiniMax-M3' },
    { sdkSessionFactory: factory },
  );
}

function mutationOpenInput(admissions, scenario) {
  return Object.freeze({
    model: Object.freeze({ provider: 'minimax-cn', model_id: 'MiniMax-M3' }),
    discovery_tools: Object.freeze([]),
    execution_tools: Object.freeze(approvedToolNames.map((tool_name) => Object.freeze({
      tool_name,
      async invoke(input) {
        admissions.push({ tool_name, input: structuredClone(input) });
        if (scenario?.mutation === 'tool-end-before-settlement' || scenario?.mutation === 'terminal-before-tool-settlement') {
          await scenario.holdBusinessCallback();
        }
        return expectedBoundedToolResult(tool_name);
      },
    }))),
  });
}

function assertExactSanitizedError(error, code) {
  assert.equal(error?.code, code);
  assert.equal(/credential|raw-secret|forbidden-sdk-path|provider|sdk|node_modules|\/Users\//i.test(`${error?.message ?? ''}\n${error?.stack ?? ''}`), false);
  return true;
}

function assertEffectCounts(scenario, expected) {
  for (const effect of ['factory', 'subscribe', 'setActiveTools', 'prompt', 'getActualModel', 'unsubscribe', 'abort', 'waitForIdle', 'dispose']) {
    assert.equal(scenario.count(effect), expected[effect] ?? 0, `${scenario.mutation}: ${effect}`);
  }
}

async function openMutationScenario(mutation) {
  const scenario = createPiAdapterScenario({ mutation });
  const runtime = await injectedPiRuntime(scenario.sdkSessionFactory);
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const admissions = [];
  const session = await runtime.openSession(mutationOpenInput(admissions, scenario));
  return { scenario, session, admissions };
}

const discoveryQuestion = 'Do recent member operations show a problem?';
const confirmedContract = Object.freeze({ ...expectedConfirmedContract('0198d943-8b71-7a11-9abc-0000000000a1', '2026-08-20T00:00:00.000Z') });

function approvedDiscoveryInput() {
  return Object.freeze({ discovery_context: expectedDiscoveryContext() });
}

function approvedExecutionInput(overrides = {}) {
  return Object.freeze({
    confirmed_contract: confirmedContract,
    finding_context: expectedFindingContext(),
    cancellation_signal: new AbortController().signal,
    deadline_seconds: 300,
    ...overrides,
  });
}

const constructionMutations = Object.freeze([
  ['factory raw secret-bearing rejection', 'factory-raw-rejection', 'MODEL_UNAVAILABLE'],
  ['facade missing subscribe', 'facade-missing-subscribe', 'PROTOCOL_FAILURE'],
  ['facade extra retry method', 'facade-extra-method', 'PROTOCOL_FAILURE'],
  ['facade non-frozen object', 'facade-not-frozen', 'PROTOCOL_FAILURE'],
]);

for (const [title, mutation, code] of constructionMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const scenario = createPiAdapterScenario({ mutation });
    const runtime = await injectedPiRuntime(scenario.sdkSessionFactory);
    await runtime.preflightModel(Object.freeze({ model: approvedModel }));
    await assert.rejects(() => runtime.openSession(mutationOpenInput([])), (error) => assertExactSanitizedError(error, code));
    assertEffectCounts(scenario, { factory: 1 });
  });
}

test('TASK-005 TEST-XCLI-006 mutation: non-function unsubscribe return', async () => {
  const scenario = createPiAdapterScenario({ mutation: 'non-function-unsubscribe-return' });
  const runtime = await injectedPiRuntime(scenario.sdkSessionFactory);
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const admissions = [];
  await assert.rejects(async () => {
    const session = await runtime.openSession(mutationOpenInput(admissions, scenario));
    return session.discover(approvedDiscoveryInput());
  }, (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.deepEqual(admissions, []);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

const discoveryFacadeMutations = Object.freeze([
  ['listener non-undefined return', 'listener-non-undefined-return'],
  ['listener throw', 'listener-throw'],
  ['wrong setActiveTools status', 'wrong-set-active-tools-status'],
  ['wrong prompt status', 'wrong-prompt-status'],
]);

for (const [title, mutation] of discoveryFacadeMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session } = await openMutationScenario(mutation);
    const code = ['listener-non-undefined-return', 'listener-throw'].includes(mutation) ? 'MODEL_EXECUTION_FAILED' : 'PROTOCOL_FAILURE';
    await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, code));
    assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 1, prompt: mutation === 'wrong-set-active-tools-status' ? 0 : 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
  });
}

test('TASK-005 TEST-XCLI-006 mutation: sync prompt shape', async () => {
  const scenario = createPiAdapterScenario({ mutation: 'sync-prompt-status' });
  const runtime = await injectedPiRuntime(scenario.sdkSessionFactory);
  await runtime.preflightModel(Object.freeze({ model: approvedModel }));
  const admissions = [];
  await assert.rejects(async () => {
    const session = await runtime.openSession(mutationOpenInput(admissions, scenario));
    return session.discover(approvedDiscoveryInput());
  }, (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.deepEqual(admissions, []);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

test('TASK-005 TEST-XCLI-006 mutation: wrong getActualModel status', async () => {
  const { scenario, session, admissions } = await openMutationScenario('wrong-get-actual-model-status');
  await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.deepEqual(admissions, []);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

const terminalMutations = Object.freeze([
  ['missing message_end', 'missing-message-end', 'MODEL_EXECUTION_FAILED'],
  ['stream ended without finish reason', 'stream-ended-without-finish-reason', 'MODEL_EXECUTION_FAILED'],
  ['assistant message wrong role', 'assistant-wrong-role'],
  ['wrong stop reason', 'wrong-stop-reason', 'MODEL_EXECUTION_FAILED'],
  ['malformed final JSON', 'malformed-final-json'],
  ['duplicate final assistant result', 'duplicate-final-assistant-result'],
  ['missing agent_end', 'missing-agent-end'],
  ['willRetry true', 'will-retry'],
  ['missing agent_settled', 'missing-agent-settled'],
  ['reordered terminal events', 'reordered-terminal-events'],
  ['post-settlement late final event', 'late-terminal-event'],
  ['compaction activity', 'compaction-activity'],
  ['queued continuation activity', 'queued-continuation-activity'],
]);

for (const [title, mutation, code = 'PROTOCOL_FAILURE'] of terminalMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario(mutation);
    await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, code));
    assert.deepEqual(admissions, []);
    assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
  });
}

const toolMutations = Object.freeze([
  ['Discovery tool event', 'discovery-tool-event'],
  ['unknown tool name', 'unknown-tool-name'],
  ['reordered approved tools', 'reordered-approved-tools'],
  ['duplicate tool call ID', 'duplicate-tool-call-id'],
  ['empty correlation ID', 'empty-correlation-id'],
  ['non-empty tool arguments', 'non-empty-tool-arguments'],
  ['tool start/end call-ID mismatch', 'tool-start-end-call-id-mismatch'],
  ['tool start/end tool-name mismatch', 'tool-start-end-name-mismatch'],
  ['tool isError true', 'tool-is-error'],
  ['tool event after terminal closure', 'tool-event-after-terminal-closure'],
]);

for (const [title, mutation] of toolMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario(mutation);
    if (mutation !== 'discovery-tool-event') await session.discover(approvedDiscoveryInput());
    await assert.rejects(
      () => mutation === 'discovery-tool-event'
        ? session.discover(approvedDiscoveryInput())
        : session.execute(approvedExecutionInput()),
      (error) => assertExactSanitizedError(error, 'TOOL_POLICY_VIOLATION'),
    );
    if (['duplicate-tool-call-id', 'tool-start-end-call-id-mismatch', 'tool-start-end-name-mismatch', 'tool-is-error'].includes(mutation)) {
      assert.deepEqual(admissions, [{ tool_name: 'profile_approved_fixture', input: { correlation_id: 'call-001', arguments: {} } }]);
    } else if (mutation === 'tool-event-after-terminal-closure') {
      assert.deepEqual(admissions, approvedToolNames.map((tool_name, index) => ({ tool_name, input: { correlation_id: `call-00${index + 1}`, arguments: {} } })));
    } else {
      assert.deepEqual(admissions, []);
    }
    assert.equal(scenario.count('prompt'), mutation === 'discovery-tool-event' ? 1 : 2);
    assert.equal(scenario.count('factory'), 1);
    assert.equal(scenario.count('dispose'), 1);
  });
}

const modelAndFailureMutations = Object.freeze([
  ['wrong actual model after Discovery', 'actual-model-mismatch', 'discovery'],
  ['wrong actual model after Execution', 'actual-model-mismatch-execution', 'execution'],
  ['prompt raw-cause rejection', 'prompt-raw-rejection', 'discovery'],
]);

for (const [title, mutation, operation] of modelAndFailureMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario(mutation);
    if (operation === 'execution') await session.discover(approvedDiscoveryInput());
    await assert.rejects(
      () => operation === 'execution'
        ? session.execute(approvedExecutionInput())
        : session.discover(approvedDiscoveryInput()),
      (error) => assertExactSanitizedError(error, 'MODEL_EXECUTION_FAILED'),
    );
    assert.equal(scenario.count('factory'), 1);
    assert.equal(scenario.count('prompt'), operation === 'execution' ? 2 : mutation === 'prompt-raw-rejection' ? 0 : 1);
    assert.equal(scenario.count('dispose'), 1);
    assert.equal(admissions.length, operation === 'execution' ? 3 : 0);
  });
}

for (const [title, mutation] of [
  ['wrong abort status', 'wrong-abort-status'],
  ['wrong waitForIdle status', 'wrong-wait-for-idle-status'],
  ['wrong dispose status', 'wrong-dispose-status'],
]) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session } = await openMutationScenario(mutation);
    await assert.rejects(() => session.cancel(), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assertEffectCounts(scenario, { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
  });
}

const nonFrozenFacadeStatusMutations = Object.freeze([
  ['setActiveTools returns non-frozen required status', 'non-frozen-set-active-tools-status', 'discover', { factory: 1, subscribe: 1, setActiveTools: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['prompt returns non-frozen required status', 'non-frozen-prompt-status', 'discover', { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['getActualModel returns non-frozen required identity', 'non-frozen-get-actual-model-status', 'discover', { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['abort returns non-frozen required status', 'non-frozen-abort-status', 'cancel', { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['waitForIdle returns non-frozen required status', 'non-frozen-wait-for-idle-status', 'cancel', { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['dispose returns non-frozen required status', 'non-frozen-dispose-status', 'cancel', { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
]);

for (const [title, mutation, operation, effects] of nonFrozenFacadeStatusMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario(mutation);
    await assert.rejects(
      () => operation === 'discover' ? session.discover(approvedDiscoveryInput()) : session.cancel(),
      (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'),
    );
    assert.deepEqual(admissions, []);
    assertEffectCounts(scenario, effects);
  });
}

const extraFieldFacadeStatusMutations = Object.freeze([
  ['setActiveTools returns extra status field', 'extra-field-set-active-tools-status', 'discover', { factory: 1, subscribe: 1, setActiveTools: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['prompt returns extra status field', 'extra-field-prompt-status', 'discover', { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['getActualModel returns extra identity field', 'extra-field-get-actual-model-status', 'discover', { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['abort returns extra status field', 'extra-field-abort-status', 'cancel', { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['waitForIdle returns extra status field', 'extra-field-wait-for-idle-status', 'cancel', { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
  ['dispose returns extra status field', 'extra-field-dispose-status', 'cancel', { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 }],
]);

for (const [title, mutation, operation, effects] of extraFieldFacadeStatusMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario(mutation);
    await assert.rejects(
      () => operation === 'discover' ? session.discover(approvedDiscoveryInput()) : session.cancel(),
      (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'),
    );
    assert.deepEqual(admissions, []);
    assertEffectCounts(scenario, effects);
  });
}

const postDisposeFacadeMutations = Object.freeze([
  ['subscribe after facade disposal', 'post-dispose-subscribe'],
  ['setActiveTools after facade disposal', 'post-dispose-setActiveTools'],
  ['prompt after facade disposal', 'post-dispose-prompt'],
  ['getActualModel after facade disposal', 'post-dispose-getActualModel'],
  ['abort after facade disposal', 'post-dispose-abort'],
  ['waitForIdle after facade disposal', 'post-dispose-waitForIdle'],
]);

for (const [title, mutation] of postDisposeFacadeMutations) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario(mutation);
    await assert.rejects(() => session.cancel(), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assert.deepEqual(scenario.postDisposeAttempts, [mutation.slice('post-dispose-'.length)]);
    assert.deepEqual(admissions, []);
    assertEffectCounts(scenario, { factory: 1, subscribe: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
  });
}

test('TASK-005 TEST-XCLI-006 mutation: tool_execution_end before translated callback settlement', async () => {
  const { scenario, session, admissions } = await openMutationScenario('tool-end-before-settlement');
  await session.discover(approvedDiscoveryInput());
  const execution = session.execute(approvedExecutionInput());
  await scenario.waitForBusinessCallback();
  scenario.releaseBusinessCallback();
  await assert.rejects(() => execution, (error) => assertExactSanitizedError(error, 'TOOL_POLICY_VIOLATION'));
  assert.equal(admissions.length, 1);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 2, prompt: 2, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

test('TASK-005 TEST-XCLI-006 mutation: business callback resolves after terminal admission closes', async () => {
  const { scenario, session, admissions } = await openMutationScenario('terminal-before-tool-settlement');
  await session.discover(approvedDiscoveryInput());
  const execution = session.execute(approvedExecutionInput());
  await scenario.waitForBusinessCallback();
  scenario.releaseBusinessCallback();
  await assert.rejects(() => execution, (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.equal(admissions.length, 1);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 2, prompt: 2, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

test('TASK-005 TEST-XCLI-006 mutation: in-flight Discovery prompt cancellation', async () => {
  const { scenario, session, admissions } = await openMutationScenario('in-flight-discovery-prompt');
  const discovery = session.discover(approvedDiscoveryInput());
  await scenario.waitForPrompt();
  const cancellation = session.cancel();
  scenario.releasePrompt();
  await assert.rejects(() => discovery, (error) => assertExactSanitizedError(error, 'CANCELLED'));
  assert.deepEqual(await cancellation, { cancelled: true, was_confirmed: false });
  assert.deepEqual(admissions, []);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

test('TASK-005 TEST-XCLI-006 mutation: in-flight Execution tool cancellation', async () => {
  const { scenario, session, admissions } = await openMutationScenario('in-flight-execution-tool');
  await session.discover(approvedDiscoveryInput());
  const execution = session.execute(approvedExecutionInput());
  await scenario.waitForTool();
  const cancellation = session.cancel();
  scenario.releaseTool();
  await assert.rejects(() => execution, (error) => assertExactSanitizedError(error, 'CANCELLED'));
  assert.deepEqual(await cancellation, { cancelled: true, was_confirmed: true });
  assert.equal(admissions.length, 0);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 2, prompt: 2, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

test('TASK-005 TEST-XCLI-006 mutation: exact zero Execution deadline', async () => {
  const { scenario, session, admissions } = await openMutationScenario('none');
  await session.discover(approvedDiscoveryInput());
  await assert.rejects(
    () => session.execute(approvedExecutionInput({ deadline_seconds: 0 })),
    (error) => assertExactSanitizedError(error, 'TIMEOUT'),
  );
  assert.deepEqual(admissions, []);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1, setActiveTools: 1, prompt: 1, getActualModel: 1, unsubscribe: 1, abort: 1, waitForIdle: 1, dispose: 1 });
});

const invalidExecutionInputs = Object.freeze([
  ['missing Execution deadline', (() => { const value = { ...approvedExecutionInput() }; delete value.deadline_seconds; return value; })()],
  ['null Execution deadline', { ...approvedExecutionInput(), deadline_seconds: null }],
  ['non-integer Execution deadline', { ...approvedExecutionInput(), deadline_seconds: 0.5 }],
  ['negative Execution deadline', { ...approvedExecutionInput(), deadline_seconds: -1 }],
  ['above-limit Execution deadline', { ...approvedExecutionInput(), deadline_seconds: 301 }],
  ['unknown Execution input field', { ...approvedExecutionInput(), injected: true }],
]);

for (const [title, input] of invalidExecutionInputs) {
  test(`TASK-005 TEST-XCLI-006 mutation: ${title}`, async () => {
    const { scenario, session, admissions } = await openMutationScenario('none');
    await session.discover(approvedDiscoveryInput());
    await assert.rejects(() => session.execute(input), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
    assert.deepEqual(admissions, []);
    assert.equal(scenario.count('prompt'), 1);
    assert.equal(scenario.count('setActiveTools'), 1);
  });
}

test('TASK-005 TEST-XCLI-006 mutation: Execution before Discovery', async () => {
  const { scenario, session, admissions } = await openMutationScenario('none');
  await assert.rejects(() => session.execute(approvedExecutionInput()), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.deepEqual(admissions, []);
  assertEffectCounts(scenario, { factory: 1, subscribe: 1 });
});

test('TASK-005 TEST-XCLI-006 mutation: second Discovery', async () => {
  const { scenario, session } = await openMutationScenario('none');
  await session.discover(approvedDiscoveryInput());
  await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.equal(scenario.count('prompt'), 1);
});

test('TASK-005 TEST-XCLI-006 mutation: repeated Execution after success', async () => {
  const { scenario, session, admissions } = await openMutationScenario('none');
  await session.discover(approvedDiscoveryInput());
  await session.execute(approvedExecutionInput());
  await assert.rejects(() => session.execute(approvedExecutionInput()), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.equal(scenario.count('prompt'), 2);
  assert.equal(admissions.length, 3);
});

test('TASK-005 TEST-XCLI-006 mutation: call after failed state', async () => {
  const { scenario, session } = await openMutationScenario('malformed-final-json');
  await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, 'PROTOCOL_FAILURE'));
  assert.equal(scenario.count('prompt'), 1);
});

test('TASK-005 TEST-XCLI-006 mutation: call after cancelled state', async () => {
  const { scenario, session } = await openMutationScenario('none');
  await session.cancel();
  await assert.rejects(() => session.discover(approvedDiscoveryInput()), (error) => assertExactSanitizedError(error, 'CANCELLED'));
  assert.equal(scenario.count('prompt'), 0);
});

test('TASK-005 TEST-XCLI-006 mutation: cancel after completed', async () => {
  const { scenario, session } = await openMutationScenario('none');
  await session.discover(approvedDiscoveryInput());
  await session.execute(approvedExecutionInput());
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: true });
  assert.deepEqual(await session.cancel(), { cancelled: true, was_confirmed: true });
  assert.equal(scenario.count('dispose'), 1);
  assert.equal(scenario.count('abort'), 0);
});

async function temporaryRoot(t, prefix) {
  const parent = await mkdtemp(join(tmpdir(), prefix));
  const root = join(parent, 'root');
  await mkdir(root);
  t.after(() => rm(parent, { recursive: true, force: true }));
  return { parent, root };
}

const adapterFactories = Object.freeze([
  {
    seam: 'analysisAdapter',
    factory: 'createDuckDbPythonLocalAnalysisExecution',
    key: 'workspaceRoot',
    testId: 'TEST-XCLI-007',
    methods: ['preflightApprovedFixture', 'profileApprovedFixture', 'calculateMemberRepurchaseMetrics', 'validateMemberRepurchaseMetrics'],
  },
  {
    seam: 'artifactAdapter',
    factory: 'createLocalRunArtifactStore',
    key: 'runRoot',
    testId: 'TEST-XCLI-008',
    methods: ['preflightRunRoot', 'beginRun', 'commitConfirmedContract', 'appendAsset', 'replaceManifest', 'commitSuccess', 'readTerminalRun'],
  },
]);

for (const definition of adapterFactories) {
  test(`TASK-004 ${definition.testId} ${definition.factory} is the exact concrete Adapter export and returns only Port methods`, async (t) => {
    const { root } = await temporaryRoot(t, `xanthil-${definition.seam}-factory-`);
    const module = await loadPublicSeam(definition.seam);
    assert.deepEqual(Object.keys(module), [definition.factory]);
    const adapter = requiredExport(module, definition.factory)({ [definition.key]: root });
    assert.deepEqual(Object.keys(adapter).sort(), [...definition.methods].sort());
    for (const method of definition.methods) assert.equal(typeof adapter[method], 'function', method);
  });

  for (const invalidCase of ['missing', 'null', 'relative', 'unknown-field', 'non-directory', 'symlink-root', 'unsafe-root']) {
    test(`TASK-004 ${definition.testId} ${definition.factory} rejects ${invalidCase} config before an Adapter effect`, async (t) => {
      const { parent, root } = await temporaryRoot(t, `xanthil-${definition.seam}-invalid-`);
      const module = await loadPublicSeam(definition.seam);
      const factory = requiredExport(module, definition.factory);
      let config;
      if (invalidCase === 'missing') config = undefined;
      if (invalidCase === 'null') config = null;
      if (invalidCase === 'relative') config = { [definition.key]: 'relative-root' };
      if (invalidCase === 'unknown-field') config = { [definition.key]: root, ambientRoot: root };
      if (invalidCase === 'non-directory') {
        const file = join(parent, 'not-a-directory');
        await writeFile(file, 'sentinel', 'utf8');
        config = { [definition.key]: file };
      }
      if (invalidCase === 'symlink-root') {
        const link = join(parent, 'root-link');
        await symlink(root, link, 'dir');
        config = { [definition.key]: link };
      }
      if (invalidCase === 'unsafe-root') config = { [definition.key]: '/' };
      assert.throws(() => factory(config), /SOURCE_BOUNDARY_VIOLATION|ARTIFACT_WRITE_FAILED|VALIDATION_FAILED/);
    });
  }
}

test('TASK-004 TEST-XCLI-007 runs the shared closed Local Analysis contract against real DuckDB and Python', async (t) => {
  const { root } = await temporaryRoot(t, 'xanthil-analysis-contract-');
  await writeFile(join(root, 'member-orders-v1.csv'), await canonicalFixtureBytes());
  const ports = await loadPublicSeam('ports');
  const module = await loadPublicSeam('analysisAdapter');
  const execution = requiredExport(module, 'createDuckDbPythonLocalAnalysisExecution')({ workspaceRoot: root });
  requiredExport(ports, 'defineLocalAnalysisExecution')(execution);
  await runLocalAnalysisExecutionContract(() => execution);
});

test('TASK-004 TEST-XCLI-008 runs the shared stateless Run Artifact contract against the real filesystem', async (t) => {
  const { root } = await temporaryRoot(t, 'xanthil-artifact-contract-');
  const ports = await loadPublicSeam('ports');
  const module = await loadPublicSeam('artifactAdapter');
  const store = requiredExport(module, 'createLocalRunArtifactStore')({ runRoot: root });
  requiredExport(ports, 'defineRunArtifactStore')(store);
  await runArtifactStoreContract(() => store);
});

test('TASK-010 R3 TEST-XCLI-008 [AC-XCLI-001-01, AC-XCLI-007-01] preflightRunRoot is a frozen, repeatable, read-only physical-root check', async (t) => {
  const { root } = await temporaryRoot(t, 'xanthil-artifact-preflight-');
  const module = await loadPublicSeam('artifactAdapter');
  const store = requiredExport(module, 'createLocalRunArtifactStore')({ runRoot: root });
  const before = await readdir(root);
  const first = await store.preflightRunRoot();
  const second = await store.preflightRunRoot();
  assert.deepEqual(first, { ready: true });
  assert.equal(Object.isFrozen(first), true);
  assert.deepEqual(second, { ready: true });
  assert.equal(Object.isFrozen(second), true);
  assert.deepEqual(await readdir(root), before);
});

test('TEST-XCLI-016 [AC-XCLI-009-02, AC-XCLI-009-04, AC-XCLI-010-03, AC-XCLI-013-04] observes a fault-injected Artifact Port retaining non-success state', async () => {
  await runArtifactFaultContract(createRunArtifactFaultDouble);
});
