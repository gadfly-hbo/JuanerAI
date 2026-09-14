import { createHash } from 'node:crypto';

export const COORDINATOR_SCHEMA_VERSION = '1.0';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const clone = value => structuredClone(value);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const closedData = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true;
  });
const isSha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const isHash = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const PINNED_GIT = '/Users/huangbo/Dev/Env/homebrew/bin/git';
const PINNED_GIT_SHA256 = '6b348e2246cd4566a129c34a918ff2381c37eda817797d5bdd64ce719ff068ab';
const PINNED_GIT_VERSION = '2.54.0';
const MAX_CONTROL_BYTES = 1024 * 1024;
const boundedControl = value => {
  try { return Buffer.byteLength(canonical(value), 'utf8') <= MAX_CONTROL_BYTES; } catch { return false; }
};
const boundedEventDetail = value => {
  try { return Buffer.byteLength(canonical(value), 'utf8') <= MAX_CONTROL_BYTES; } catch { return false; }
};
const utf8Text = value => typeof value === 'string' && Buffer.from(value, 'utf8').toString('utf8') === value;
const byteCompare = (left, right) => Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
const closedArray = value => Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype
  && Reflect.ownKeys(value).length === value.length + 1 && Object.getOwnPropertyDescriptor(value, 'length')?.value === value.length
  && Array.from({ length: value.length }, (_, index) => Object.getOwnPropertyDescriptor(value, String(index)))
    .every(descriptor => descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true);
const sortedStrings = values => closedArray(values) && values.every((value, index) => utf8Text(value) && value.length > 0 && !/[\0\n\r]/.test(value) && (index === 0 || byteCompare(values[index - 1], value) < 0));
const safeObservedPath = value => utf8Text(value) && value.length > 0 && !value.startsWith('/') && !/[\0\n\r\\]/.test(value)
  && value.split('/').every(part => part.length > 0 && part !== '.' && part !== '..');
const canonicalDiffArguments = (baseline_sha, candidate_sha) => ({
  raw: ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv', '--no-renames', '--src-prefix=a/', '--dst-prefix=b/', `${baseline_sha}..${candidate_sha}`, '--'],
  paths: ['--no-pager', '-c', 'color.ui=false', '-c', 'core.quotePath=true', '-c', 'diff.algorithm=myers', '-c', 'diff.mnemonicPrefix=false', '-c', 'diff.noprefix=false', 'diff', '--name-status', '-z', '--no-ext-diff', '--no-textconv', '--no-renames', `${baseline_sha}..${candidate_sha}`, '--'],
});
const dataValue = (object, key) => Object.getOwnPropertyDescriptor(object, key)?.value;
const canonicalDiffReceiptValue = value => ({
  producer_receipt: clone(dataValue(value, 'producer_receipt')),
  raw_stdout: Buffer.from(dataValue(value, 'raw_stdout')).toString('base64'),
  byte_length: dataValue(value, 'byte_length'),
  stdout_sha256: dataValue(value, 'stdout_sha256'),
  path_raw_stdout: Buffer.from(dataValue(value, 'path_raw_stdout')).toString('base64'),
  path_byte_length: dataValue(value, 'path_byte_length'),
  changed_paths: clone(dataValue(value, 'changed_paths')),
});
const copiedStringArray = value => {
  if (!closedArray(value)) return null;
  const copy = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = Object.getOwnPropertyDescriptor(value, String(index))?.value;
    if (!utf8Text(item)) return null;
    copy.push(item);
  }
  return copy;
};
const qualifyCanonicalDiff = (envelope, request) => {
  try {
    if (!closedData(envelope, ['kind', 'value', 'receipt_sha256']) || dataValue(envelope, 'kind') !== 'OK') return null;
    const value = dataValue(envelope, 'value');
    if (!closedData(value, ['producer_receipt', 'raw_stdout', 'byte_length', 'stdout_sha256', 'path_raw_stdout', 'path_byte_length', 'changed_paths'])) return null;
    const producer = dataValue(value, 'producer_receipt');
    if (!closedData(producer, ['executable', 'executable_sha256', 'version', 'environment', 'shell', 'argv', 'path_argv', 'path_stdout_sha256', 'repository_root', 'common_git_dir', 'worktree_root'])) return null;
    const expectedArgs = canonicalDiffArguments(request.baseline_sha, request.candidate_sha);
    const environment = { LC_ALL: 'C', LANG: 'C', TZ: 'UTC', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_PAGER: 'cat', PAGER: 'cat', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
    const deliveredEnvironment = dataValue(producer, 'environment');
    if (!closedData(deliveredEnvironment, Object.keys(environment))) return null;
    const environmentCopy = {};
    for (const key of Object.keys(environment)) {
      const item = dataValue(deliveredEnvironment, key);
      if (!utf8Text(item)) return null;
      environmentCopy[key] = item;
    }
    const argv = copiedStringArray(dataValue(producer, 'argv'));
    const pathArgv = copiedStringArray(dataValue(producer, 'path_argv'));
    const changed = copiedStringArray(dataValue(value, 'changed_paths'));
    if (!argv || !pathArgv || !changed) return null;
    const rawValue = dataValue(value, 'raw_stdout'); const pathValue = dataValue(value, 'path_raw_stdout');
    if (!Buffer.isBuffer(rawValue) || !Buffer.isBuffer(pathValue)) return null;
    const raw = Buffer.from(rawValue); const pathBytes = Buffer.from(pathValue);
    const derived = []; let start = 0;
    for (let index = 0; index < pathBytes.length; index += 1) {
      if (pathBytes[index] !== 0) continue;
      derived.push(pathBytes.subarray(start, index)); start = index + 1;
    }
    if (start !== pathBytes.length || derived.length % 2 !== 0) return null;
    const paths = [];
    for (let index = 0; index < derived.length; index += 2) {
      const status = derived[index]; const pathBuffer = derived[index + 1]; const decoded = pathBuffer.toString('utf8');
      if (status.length !== 1 || ![0x41, 0x4d, 0x44, 0x54].includes(status[0]) || pathBuffer.length === 0
        || !Buffer.from(decoded, 'utf8').equals(pathBuffer) || !safeObservedPath(decoded)) return null;
      paths.push(decoded);
    }
    paths.sort(byteCompare);
    if (paths.some((item, index) => index > 0 && item === paths[index - 1]) || canonical(paths) !== canonical(changed)) return null;
    const qualifiedProducer = {
      executable: dataValue(producer, 'executable'), executable_sha256: dataValue(producer, 'executable_sha256'),
      version: dataValue(producer, 'version'), environment: environmentCopy, shell: dataValue(producer, 'shell'),
      argv, path_argv: pathArgv, path_stdout_sha256: dataValue(producer, 'path_stdout_sha256'),
      repository_root: dataValue(producer, 'repository_root'), common_git_dir: dataValue(producer, 'common_git_dir'),
      worktree_root: dataValue(producer, 'worktree_root'),
    };
    const qualified = {
      producer_receipt: qualifiedProducer, raw_stdout: raw, byte_length: dataValue(value, 'byte_length'),
      stdout_sha256: dataValue(value, 'stdout_sha256'), path_raw_stdout: pathBytes,
      path_byte_length: dataValue(value, 'path_byte_length'), changed_paths: changed,
    };
    return qualifiedProducer.executable === PINNED_GIT && qualifiedProducer.executable_sha256 === PINNED_GIT_SHA256
      && qualifiedProducer.version === PINNED_GIT_VERSION && canonical(environmentCopy) === canonical(environment)
      && qualifiedProducer.shell === false && canonical(argv) === canonical(expectedArgs.raw) && canonical(pathArgv) === canonical(expectedArgs.paths)
      && qualifiedProducer.repository_root === request.canonical_root && qualifiedProducer.common_git_dir === request.common_git_dir
      && qualifiedProducer.worktree_root === request.worktree_root
      && Number.isSafeInteger(qualified.byte_length) && qualified.byte_length === raw.length
      && Number.isSafeInteger(qualified.path_byte_length) && qualified.path_byte_length === pathBytes.length
      && qualified.stdout_sha256 === sha256(raw) && qualifiedProducer.path_stdout_sha256 === sha256(pathBytes)
      && dataValue(envelope, 'receipt_sha256') === sha256(canonical(canonicalDiffReceiptValue(qualified))) ? qualified : null;
  } catch { return null; }
};
const deliveryIdentity = (state, diff) => {
  const preimage = {
    schema_version: '1.0', change_id: state.change_id,
    authorization_cycle_command_id: state.authorization_cycle.command_id,
    baseline_sha: state.repository.baseline_sha, candidate_sha: state.candidate.sha,
    candidate_tree: state.candidate.tree, branch: state.repository.branch,
    remote_head: state.delivery.remote_head, canonical_diff_sha256: diff.stdout_sha256,
    changed_paths: clone(diff.changed_paths),
  };
  return { preimage, delivery_id: `delivery-${sha256(canonical(preimage))}` };
};
const validPr = (envelope, repository, branch, candidate) => {
  const value = envelope?.value;
  return envelope?.kind === 'OK' && closedData(envelope, ['kind', 'value', 'receipt_sha256'])
    && closedData(value, ['number', 'url', 'base', 'head_branch', 'head_sha', 'review_ready'])
    && Number.isSafeInteger(value.number) && value.number > 0 && utf8Text(value.url) && value.url.length > 0
    && value.base === 'main' && value.head_branch === branch && value.head_sha === candidate && value.review_ready === true
    && envelope.receipt_sha256 === sha256(canonical(value)) && utf8Text(repository) && repository.length > 0;
};
const validEvidence = value => closedData(value, ['kind', 'id', 'sha256', 'subject_sha']) && utf8Text(value.kind) && value.kind.length > 0 && utf8Text(value.id) && value.id.length > 0 && isHash(value.sha256) && isSha(value.subject_sha);
const sortedEvidence = values => closedArray(values) && values.every((value, index) => validEvidence(value) && (index === 0 || byteCompare(canonical(values[index - 1]), canonical(value)) < 0));
const orderedText = (items, key) => closedArray(items) && items.every((item, index) => closedData(item, [key, 'summary', 'evidence_refs'])
  && utf8Text(item[key]) && item[key].length > 0 && utf8Text(item.summary) && item.summary.length > 0
  && sortedEvidence(item.evidence_refs) && (index === 0 || byteCompare(items[index - 1][key], item[key]) < 0));
const validArtifactPath = value => utf8Text(value) && value.length > 0 && !value.startsWith('/')
  && !value.includes('..') && !value.includes('\\') && !value.includes('\0')
  && (value.indexOf('*') < 0 || (value.endsWith('/**') && value.indexOf('*') === value.length - 2));
const matchesScope = (rule, value) => rule.endsWith('/**') ? value.startsWith(rule.slice(0, -2)) : value === rule;
const validRepairTestFile = value => closedData(value, ['path', 'byte_length', 'sha256'])
  && validArtifactPath(value.path) && !value.path.includes('*') && !/[\n\r]/.test(value.path)
  && value.path.split('/').every(part => part.length > 0 && part !== '.' && part !== '..')
  && Number.isSafeInteger(value.byte_length) && value.byte_length >= 0 && isHash(value.sha256);
const validRepairProofSummary = value => closedData(value, ['schema_version', 'kind', 'execution_content_sha256', 'proof_receipt_sha256', 'test_files'])
  && value.schema_version === '1.0' && value.kind === 'REPAIR_TEST_HOST_PROOF'
  && isHash(value.execution_content_sha256) && isHash(value.proof_receipt_sha256)
  && closedArray(value.test_files) && value.test_files.length > 0
  && value.test_files.every((item, index) => validRepairTestFile(item)
    && (index === 0 || byteCompare(value.test_files[index - 1].path, item.path) < 0));
const validRepairProofBinding = value => closedData(value, ['schema_version', 'kind', 'artifact_path', 'artifact_sha256', 'execution_content_sha256', 'proof_receipt_sha256', 'test_files'])
  && value.schema_version === '1.0' && value.kind === 'REPAIR_TEST_HOST_PROOF_REF'
  && typeof value.artifact_path === 'string' && /^\/private\/var\/run\/juanerai\/repair-proof-results\/repair-test-correlation-[0-9a-f]{64}\.json$/.test(value.artifact_path) && isHash(value.artifact_sha256)
  && validRepairProofSummary({ schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF', execution_content_sha256: value.execution_content_sha256, proof_receipt_sha256: value.proof_receipt_sha256, test_files: value.test_files });
const validRepairEvidenceBinding = value => closedData(value, ['schema_version', 'kind', 'derived_input_sha256', 'derived_input_byte_length', 'derived_input_bytes_base64'])
  && value.schema_version === '1.0' && value.kind === 'REPAIR_TEST_EVIDENCE' && isHash(value.derived_input_sha256)
  && Number.isSafeInteger(value.derived_input_byte_length) && value.derived_input_byte_length > 0 && typeof value.derived_input_bytes_base64 === 'string'
  && Buffer.from(value.derived_input_bytes_base64, 'base64').toString('base64') === value.derived_input_bytes_base64
  && Buffer.from(value.derived_input_bytes_base64, 'base64').length === value.derived_input_byte_length
  && sha256(Buffer.from(value.derived_input_bytes_base64, 'base64')) === value.derived_input_sha256;
const canonicalTime = value => {
  try { return typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && new Date(value).toISOString() === value; } catch { return false; }
};
const roleReceiptKeys = ['validation_id', 'validation_kind', 'validation_scope', 'status', 'verdict', 'failure_code', 'command_definition_sha256', 'receipt_sha256', 'subject_sha', 'candidate_sha', 'validator_head', 'idempotency_id'];
const executionReceiptKeys = ['validation_id', 'validation_kind', 'validation_scope', 'status', 'verdict', 'failure_code', 'command_definition_sha256', 'receipt_sha256', 'subject_kind', 'subject_sha', 'repository_root', 'worktree_root', 'branch', 'head_sha', 'common_git_dir', 'execution_cwd', 'scope_sha256', 'worktree_snapshot_sha256', 'candidate_sha', 'candidate_tree', 'stdout_sha256', 'stderr_sha256', 'validator_head', 'idempotency_id'];
const agentBindingKeys = ['correlation_id', 'role', 'agent', 'model', 'reasoning', 'sandbox', 'allowed_paths', 'phase', 'state_version', 'brief_sha256', 'input_sha256', 'output_schema_sha256', 'subject_sha', 'idempotency_id'];
const validReceiptDetail = value => {
  const keys = Reflect.ownKeys(value ?? {}).length === roleReceiptKeys.length ? roleReceiptKeys : executionReceiptKeys;
  if (!closedData(value, keys)) return false;
  const { receipt_sha256, ...preimage } = value;
  return isHash(receipt_sha256) && receipt_sha256 === sha256(canonical(preimage));
};
const validAgentRunDetail = value => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const notStarted = value.stage === 'NOT_STARTED';
  const extraBinding = !notStarted && (Object.hasOwn(value, 'repair_evidence') ? ['repair_evidence'] : Object.hasOwn(value, 'repair_proof') ? ['repair_proof'] : []);
  const common = notStarted ? agentBindingKeys.filter(key => key !== 'correlation_id') : [...agentBindingKeys, ...extraBinding];
  const resultExtra = Object.hasOwn(value, 'validator_artifact') ? ['validator_artifact']
    : Object.hasOwn(value, 'repair_proof') && Object.hasOwn(value, 'repair_delivery') ? ['repair_delivery']
      : Object.hasOwn(value, 'repair_evidence') && Object.hasOwn(value, 'repair_proof') ? ['repair_proof'] : [];
  const keys = value.stage === 'REQUESTED' ? [...common, 'stage']
    : value.stage === 'STARTED' ? [...common, 'stage', 'observed_child_id']
      : value.stage === 'RESULT' ? [...common, 'stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', ...resultExtra]
        : value.stage === 'START_FAILED' ? [...common, 'stage', 'failure_code', 'observed_child_id']
          : value.stage === 'INTERRUPTED' ? [...common, 'stage', 'observed_child_id', 'reason_code']
            : value.stage === 'NOT_STARTED' ? [...common, 'stage', 'evaluation_id', 'reason_code'] : [];
  return keys.length > 0 && closedData(value, keys)
    && (notStarted || (utf8Text(value.correlation_id) && value.correlation_id.length > 0)) && utf8Text(value.role) && value.role.length > 0
    && utf8Text(value.agent) && value.agent.length > 0 && utf8Text(value.model) && value.model.length > 0
    && utf8Text(value.reasoning) && value.reasoning.length > 0 && utf8Text(value.sandbox) && value.sandbox.length > 0
    && sortedStrings(value.allowed_paths) && Number.isSafeInteger(value.state_version) && value.state_version >= 0
    && isHash(value.brief_sha256) && isHash(value.input_sha256) && isHash(value.output_schema_sha256) && isSha(value.subject_sha)
    && utf8Text(value.idempotency_id) && value.idempotency_id.length > 0
    && (!Object.hasOwn(value, 'repair_evidence') || validRepairEvidenceBinding(value.repair_evidence))
    && (!Object.hasOwn(value, 'repair_proof') || (Object.hasOwn(value, 'repair_evidence') ? validRepairProofSummary(value.repair_proof) : validRepairProofBinding(value.repair_proof)))
    && (!Object.hasOwn(value, 'repair_delivery') || (closedData(value.repair_delivery, ['schema_version', 'kind', 'repair_proof', 'post_worker_worktree_snapshot_sha256'])
      && value.repair_delivery.schema_version === '1.0' && value.repair_delivery.kind === 'REPAIR_WORKER_DELIVERY'
      && validRepairProofBinding(value.repair_delivery.repair_proof) && canonical(value.repair_delivery.repair_proof) === canonical(value.repair_proof)
      && isHash(value.repair_delivery.post_worker_worktree_snapshot_sha256)))
    && (value.stage !== 'STARTED' || (utf8Text(value.observed_child_id) && value.observed_child_id.length > 0))
    && (value.stage !== 'RESULT' || (utf8Text(value.observed_child_id) && value.observed_child_id.length > 0 && ['PASS', 'FAIL'].includes(value.status) && utf8Text(value.artifact_path) && value.artifact_path.length > 0 && isHash(value.artifact_sha256)));
};
const validLedgerDetail = record => {
  const value = record.detail;
  if (record.event_class === 'CONTROLLER_COMMAND') return closedData(value, ['command_kind', 'command_id', 'body_sha256', 'signature_sha256', 'verified_key_id', 'receipt_digest', 'evidence_refs', 'admission', 'ready_state_sha256'])
    && ['DISPATCH', 'REVISION', 'RESUME', 'RELEASE'].includes(value.command_kind) && utf8Text(value.command_id) && value.command_id.length > 0
    && isHash(value.body_sha256) && isHash(value.signature_sha256) && utf8Text(value.verified_key_id) && value.verified_key_id.length > 0
    && isHash(value.receipt_digest) && sortedEvidence(value.evidence_refs)
    && (value.admission === null || (closedData(value.admission, ['command_id', 'body_sha256', 'idempotency_id']) && utf8Text(value.admission.command_id) && isHash(value.admission.body_sha256) && utf8Text(value.admission.idempotency_id)))
    && (value.ready_state_sha256 === null || isHash(value.ready_state_sha256));
  if (record.event_class === 'AGENT_RUN') return validAgentRunDetail(value) && record.idempotency_id === value.idempotency_id;
  if (record.event_class === 'VALIDATION_RESULT') return validReceiptDetail(value) && record.idempotency_id === value.idempotency_id;
  if (record.event_class === 'CANDIDATE_COMMITTED') return closedData(value, ['candidate_sha', 'parent', 'tree', 'branch', 'staged_paths', 'staged_paths_sha256', 'worktree_snapshot_sha256'])
    && isSha(value.candidate_sha) && isSha(value.parent) && isSha(value.tree) && utf8Text(value.branch) && value.branch.length > 0
    && sortedStrings(value.staged_paths) && isHash(value.staged_paths_sha256) && isHash(value.worktree_snapshot_sha256);
  if (record.event_class === 'BRANCH_PUSHED') return closedData(value, ['candidate_sha', 'prior_remote_head', 'remote_head', 'validator_head', 'freeze_status'])
    && isSha(value.candidate_sha) && (value.prior_remote_head === null || isSha(value.prior_remote_head)) && isSha(value.remote_head)
    && isSha(value.validator_head) && ['FROZEN', 'NOT_FROZEN'].includes(value.freeze_status);
  if (record.event_class === 'HANDOFF_READY') return closedData(value, ['handoff_sha256', 'candidate_sha', 'pr_number', 'pr_head', 'delivery_id'])
    && isHash(value.handoff_sha256) && isSha(value.candidate_sha) && Number.isSafeInteger(value.pr_number) && value.pr_number > 0
    && isSha(value.pr_head) && utf8Text(value.delivery_id) && value.delivery_id.length > 0;
  return record.event_class === 'BLOCKED' && closedData(value, ['blocked_reason', 'next_action', 'evidence_refs'])
    && utf8Text(value.blocked_reason) && value.blocked_reason.length > 0 && utf8Text(value.next_action) && value.next_action.length > 0 && sortedEvidence(value.evidence_refs);
};
function validValidatorArtifact(artifact, state, artifact_sha256, status, scope) {
  if (!closedData(artifact, ['schema_version', 'change_id', 'candidate_sha', 'validator_head', 'verdict', 'findings', 'risks', 'unverified', 'open_questions'])
    || artifact.schema_version !== '1.0' || !utf8Text(artifact.change_id) || artifact.change_id.length === 0
    || artifact.change_id !== state.change_id || artifact.candidate_sha !== state.candidate?.sha
    || artifact.validator_head !== state.candidate?.sha || artifact.verdict !== status) return false;
  const findings = closedArray(artifact.findings) && artifact.findings.every((finding, index) => closedData(finding, ['finding_id', 'classification', 'requirement_ids', 'acceptance_ids', 'paths', 'summary', 'evidence_refs'])
    && utf8Text(finding.finding_id) && finding.finding_id.length > 0 && ['IMPLEMENTATION_IN_SCOPE', 'CONTRACT', 'ARCHITECTURE', 'SCOPE', 'PATH', 'DEPENDENCY', 'PERMISSION', 'HOST', 'IDENTITY', 'EVIDENCE', 'UNKNOWN'].includes(finding.classification)
    && sortedStrings(finding.requirement_ids) && sortedStrings(finding.acceptance_ids) && sortedStrings(finding.paths) && finding.paths.every(validArtifactPath) && utf8Text(finding.summary) && finding.summary.length > 0 && sortedEvidence(finding.evidence_refs)
    && (finding.classification !== 'IMPLEMENTATION_IN_SCOPE' || (finding.requirement_ids.length > 0 && finding.acceptance_ids.length > 0 && finding.paths.length > 0 && finding.evidence_refs.length > 0 && finding.paths.every(item => scope?.allowed_paths?.some(rule => matchesScope(rule, item)) && !scope?.forbidden_paths?.some(rule => matchesScope(rule, item)))))
    && (index === 0 || byteCompare(artifact.findings[index - 1].finding_id, finding.finding_id) < 0));
  if (!findings || !orderedText(artifact.risks, 'note_id') || !orderedText(artifact.unverified, 'note_id')
    || !orderedText(artifact.open_questions, 'note_id') || (status === 'PASS' ? artifact.findings.length !== 0 : artifact.findings.length === 0)) return false;
  return sha256(canonical(artifact)) === artifact_sha256;
}
const rejected = (operation, error_code, change_id = null) => ({ schema_version: COORDINATOR_SCHEMA_VERSION, operation, outcome: 'REJECTED', error_code, change_id, state: null });
const receipt = value => sha256(canonical(value));
const result = (operation, outcome, state, state_version, state_hash, change_id, payload) => ({ schema_version: COORDINATOR_SCHEMA_VERSION, operation, outcome, change_id, state, state_version, state_hash, payload });

function validCommand(body) {
  const top = ['schema_version', 'command_id', 'key_id', 'repository', 'change_id', 'command_kind', 'payload', 'scope', 'worktree', 'expected_state_version', 'expected_state_hash', 'nonce', 'issued_at', 'expires_at', 'idempotency_id', 'receipt_digest', 'evidence_refs'];
  if (!exact(body, top) || body.schema_version !== '1.0' || !['DISPATCH', 'REVISION', 'RESUME', 'RELEASE'].includes(body.command_kind)) return false;
  if (!exact(body.repository, ['repository_id', 'canonical_root', 'origin', 'integration_branch']) || body.repository.repository_id !== 'gadfly-hbo/JuanerAI' || body.repository.origin !== 'origin' || body.repository.integration_branch !== 'main') return false;
  const canonicalTime = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && new Date(value).toISOString() === value;
  const pathValid = value => typeof value === 'string' && value.length > 0 && !value.startsWith('/') && !value.includes('..') && !value.includes('\\') && !value.includes('\0') && (value.indexOf('*') < 0 || (value.endsWith('/**') && value.indexOf('*') === value.length - 2));
  const ordered = values => Array.isArray(values) && values.every((value, index) => index === 0 || values[index - 1] < value);
  if (!exact(body.scope, ['allowed_paths', 'forbidden_paths']) || !ordered(body.scope.allowed_paths) || !ordered(body.scope.forbidden_paths) || !body.scope.allowed_paths.every(pathValid) || !body.scope.forbidden_paths.every(pathValid)) return false;
  if (!exact(body.worktree, ['branch', 'root', 'baseline_sha']) || !isSha(body.worktree.baseline_sha) || !isHash(body.receipt_digest) || !Array.isArray(body.evidence_refs)) return false;
  if (typeof body.change_id !== 'string' || !body.change_id || typeof body.command_id !== 'string' || typeof body.idempotency_id !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(body.nonce) || Buffer.from(body.nonce, 'base64').length !== 32 || !canonicalTime(body.issued_at) || !canonicalTime(body.expires_at) || Date.parse(body.expires_at) - Date.parse(body.issued_at) > 300000) return false;
  if (!ordered(body.evidence_refs) || !body.evidence_refs.every(ref => exact(ref, ['kind', 'id', 'sha256', 'subject_sha']) && typeof ref.kind === 'string' && typeof ref.id === 'string' && isHash(ref.sha256) && isSha(ref.subject_sha))) return false;
  if (body.command_kind === 'DISPATCH') {
    const p = body.payload;
    const roles = ['juaner_spec', 'juaner_test', 'juaner_worker', 'juaner_validator'];
    const roleKeys = ['role', 'agent', 'model', 'reasoning', 'sandbox', 'allowed_paths', 'brief_sha256', 'input_sha256', 'output_schema_sha256'];
    const validationKeys = ['id', 'argv', 'cwd', 'environment', 'timeout_ms', 'subject'];
    const purpose = new Map([
      ['regression-affected-suite', 'WORKTREE'],
      ['regression-test-asset-retirement', 'WORKTREE'],
      ['final-validation-candidate', 'CANDIDATE'],
    ]);
    if (!exact(p, ['acceptance_ids', 'roles', 'validations', 'delivery_base', 'auto_repair_limit', 'expected_pointer_sha256']) || p.delivery_base !== 'main' || p.auto_repair_limit !== 1 || !isHash(p.expected_pointer_sha256) || !Array.isArray(p.roles) || p.roles.length !== 4 || p.roles.some((role, index) => !exact(role, roleKeys) || role.role !== roles[index] || role.agent !== roles[index] || !Array.isArray(role.allowed_paths) || !role.allowed_paths.every(pathValid) || !isHash(role.brief_sha256) || !isHash(role.input_sha256) || !isHash(role.output_schema_sha256)) || !Array.isArray(p.validations) || p.validations.length !== 3 || p.validations.some(v => !closedData(v, validationKeys) || !purpose.has(v.id) || v.subject !== purpose.get(v.id) || !Array.isArray(v.argv) || v.argv.length === 0 || !v.argv.every(value => typeof value === 'string') || typeof v.cwd !== 'string' || !v.cwd.startsWith('/') || !closedData(v.environment, []) || !Number.isSafeInteger(v.timeout_ms) || v.timeout_ms <= 0) || new Set(p.validations.map(v => v.id)).size !== 3) return false;
  }
  if (body.command_kind === 'REVISION' && (!exact(body.payload, ['changes_requested_ref', 'revision_of_candidate_sha', 'resume_phase']) || typeof body.payload.changes_requested_ref !== 'string' || !body.payload.changes_requested_ref || body.payload.resume_phase !== 'TEST_RED' || (body.payload.revision_of_candidate_sha !== null && !isSha(body.payload.revision_of_candidate_sha)))) return false;
  if (body.command_kind === 'RESUME' && (!exact(body.payload, ['resume_target']) || !exact(body.payload.resume_target, ['macro_state', 'phase']) || !['EXECUTING', 'DELIVERING'].includes(body.payload.resume_target.macro_state) || !['WORKTREE', 'TEST_RED', 'WORKER_GREEN', 'REGRESSION', 'STAGE', 'CANDIDATE_COMMIT', 'FINAL_VALIDATION', 'VALIDATOR', 'BRANCH_PUSH', 'CANDIDATE_FREEZE', 'PR', 'HANDOFF'].includes(body.payload.resume_target.phase))) return false;
  if (body.command_kind === 'RELEASE' && (!exact(body.payload, ['squash_sha', 'acceptance_ref', 'merge_ref', 'archive_ref', 'origin_main_sha', 'macbook_main_sha']) || !isSha(body.payload.squash_sha) || !isSha(body.payload.origin_main_sha) || !isSha(body.payload.macbook_main_sha) || ['acceptance_ref', 'merge_ref', 'archive_ref'].some(key => typeof body.payload[key] !== 'string' || !body.payload[key]))) return false;
  return true;
}

function validDependencies(d) {
  const keys = ['verifier', 'state', 'git', 'ledger', 'pull_request', 'validation', 'handoff', 'clock', 'ids', 'mutex'];
  const methods = {
    verifier: ['verify'], state: ['readPointer', 'writePointer', 'readState', 'writeState', 'readLocalPause', 'writeLocalPause'],
    git: ['inspectRepository', 'createOrReuseWorktree', 'inspectWorktree', 'stageExact', 'readStaged', 'commitCandidate', 'readCommit', 'pushBranch', 'readRemoteBranch', 'canonicalDiff', 'syncMainFfOnly'],
    ledger: ['readRemote', 'prepareAppend', 'commitAndPush', 'readRemoteAppend'], pull_request: ['queryCurrent', 'createOrReuse', 'readback'], validation: ['execute'], handoff: ['writeReadback'], clock: ['now'], ids: ['next'], mutex: ['tryAcquire', 'release'],
  };
  return d && typeof d === 'object' && Object.keys(d).length === keys.length && keys.every(key => d[key] && typeof d[key] === 'object' && methods[key].every(method => typeof d[key][method] === 'function'));
}
const stateHash = state => sha256(canonical(state));
function pointerValue(read) { if (read?.kind !== 'OK' || typeof read.value?.bytes !== 'string') return null; try { const value = JSON.parse(read.value.bytes); return canonical(value) === read.value.bytes && exact(value, ['schema_version', 'active_change_id']) && value.schema_version === '1.0' && (value.active_change_id === null || typeof value.active_change_id === 'string') ? value : null; } catch { return null; } }
function decodedState(read) { if (read?.kind !== 'OK' || typeof read.value?.bytes !== 'string') return null; try { const value = JSON.parse(read.value.bytes); return canonical(value) === read.value.bytes && read.value.sha256 === sha256(read.value.bytes) ? value : null; } catch { return null; } }
function route(state, dispatch) { const roles = dispatch?.payload?.roles; if (!Array.isArray(roles)) return null; if (state.macro_state === 'READY' && state.phase === 'WORKTREE') return roles[0]; if (state.macro_state === 'EXECUTING') return state.phase === 'SPEC' ? roles[0] : state.phase === 'TEST_RED' ? roles[1] : state.phase === 'WORKER_GREEN' ? roles[2] : null; return state.macro_state === 'DELIVERING' && state.phase === 'VALIDATOR' ? roles[3] : null; }
function actionFor(state, role, ids) {
  const repair_evidence = state.phase === 'TEST_RED' && state.authorization_cycle?.auto_repair_attempt === 1
    ? state.evidence?.repair_evidence
    : null;
  const repair_proof = state.phase === 'WORKER_GREEN' && state.authorization_cycle?.auto_repair_attempt === 1
    ? state.evidence?.repair_proof
    : null;
  const repair = (repair_evidence || repair_proof) && state.candidate?.sha;
  const identity = repair && {
    schema_version: '1.0', change_id: state.change_id, candidate_sha: state.candidate.sha,
    authorization_cycle_command_id: state.authorization_cycle.command_id, repair_execution_attempt: 1,
    ...(repair_evidence ? { derived_input_sha256: repair_evidence.derived_input_sha256 }
      : { repair_proof_sha256: sha256(canonical(repair_proof)) }), state_version: state.state_version,
  };
  const binding = {
    correlation_id: repair ? `${repair_evidence ? 'repair-test' : 'repair-worker'}-correlation-${sha256(canonical(identity))}` : ids.next('agent'),
    role: role.role, agent: role.agent, model: role.model, reasoning: role.reasoning, sandbox: role.sandbox,
    allowed_paths: clone(role.allowed_paths), phase: state.phase, state_version: state.state_version,
    brief_sha256: role.brief_sha256, input_sha256: role.input_sha256, output_schema_sha256: role.output_schema_sha256,
    subject_sha: state.candidate?.sha ?? state.repository.baseline_sha,
    idempotency_id: repair ? `${repair_evidence ? 'repair-test' : 'repair-worker'}-request-${sha256(canonical(identity))}` : ids.next('agent-request'),
  };
  const action = { ...binding, ...(repair_evidence ? { repair_evidence } : {}), ...(repair_proof ? { repair_proof } : {}), action_kind: 'LAUNCH_AGENT' };
  if (!boundedControl(action)) throw new Error('EVIDENCE_CONFLICT');
  return action;
}
function settlementBindingForLedger(action) { const { action_kind, request_event_id, observed_child_id, started, ...binding } = action; return binding; }

const TEST_CONSTRUCTION_SEEN = Symbol('test-construction-seen');
const TEST_ACCEPTED_DISPATCH = Symbol('test-accepted-dispatch');
const testRouteSeed = () => {
  const hash = 'a'.repeat(64);
  const role = (name, sandbox, allowed_paths) => ({ role: name, agent: name, model: 'gpt-5.6-terra', reasoning: 'high', sandbox, allowed_paths, brief_sha256: hash, input_sha256: hash, output_schema_sha256: hash });
  return {
    body_sha256: hash,
    body: {
      schema_version: '1.0', command_id: 'command-001', key_id: 'test-key', repository: { repository_id: 'gadfly-hbo/JuanerAI', canonical_root: '/tmp/dtf-repo', origin: 'origin', integration_branch: 'main' }, change_id: 'CHG-dual-device-transition-foundation', command_kind: 'DISPATCH',
      payload: { acceptance_ids: ['AC-DTF-001-01'], roles: [role('juaner_spec', 'workspace-write', ['openspec/changes/dual-device-transition-foundation/**']), role('juaner_test', 'workspace-write', ['tools/harness/change-coordinator/**']), role('juaner_worker', 'workspace-write', ['tools/harness/change-coordinator/coordinator.mjs']), role('juaner_validator', 'read-only', [])], validations: [{ id: 'validation-001', argv: ['node', '--test'], cwd: '/tmp/dtf-worktree', environment: {}, timeout_ms: 60000, subject: 'HEAD' }], delivery_base: 'main', auto_repair_limit: 1, expected_pointer_sha256: sha256(canonical({ schema_version: '1.0', active_change_id: null })) },
      scope: { allowed_paths: ['tools/harness/change-coordinator/coordinator.mjs'], forbidden_paths: [] }, worktree: { branch: 'work/mac-mini/dtf', root: '/tmp/dtf-worktree', baseline_sha: '1'.repeat(40) }, expected_state_version: null, expected_state_hash: null, nonce: 'A'.repeat(43) + '=', issued_at: '2026-08-25T00:00:00.000Z', expires_at: '2026-08-25T00:01:00.000Z', idempotency_id: 'idem-001', receipt_digest: hash, evidence_refs: [],
    },
  };
};

function createCore(dependencies, initialAcceptedDispatch = null, testSeam = false) {
  if (!validDependencies(dependencies)) throw new TypeError('invalid Reduced V1 dependencies');
  const d = dependencies;
  let acceptedDispatch = initialAcceptedDispatch;
  let acceptedDispatchReplay = null;
  const acceptedRevisions = [];
  let unpersistedStop = null;
  const acquire = async operation => (await d.mutex.tryAcquire()) ? true : rejected(operation, 'OPERATION_BUSY');
  const stateResult = (operation, outcome, state, payload) => result(operation, outcome, state.macro_state, state.state_version, stateHash(state), state.change_id, payload);
  const readCurrent = async change_id => { const pointer = pointerValue(await d.state.readPointer({})); if (!pointer || !pointer.active_change_id || (change_id !== null && pointer.active_change_id !== change_id)) return { pointer, state: null }; const raw = await d.state.readState({ change_id: pointer.active_change_id }); return { pointer, state: decodedState(raw) }; };
  const readLocalStop = async (state, request = null) => {
    const pause = await d.state.readLocalPause();
    if (pause?.kind === 'ABSENT') return { kind: 'ABSENT' };
    if (pause?.kind !== 'OK' || typeof pause.value?.bytes !== 'string' || !isHash(pause.value?.sha256)
      || sha256(pause.value.bytes) !== pause.value.sha256) return { kind: 'UNAVAILABLE' };
    try {
      const value = JSON.parse(pause.value.bytes);
      const keys = ['schema_version', 'diagnostic_id', 'change_id', 'command_id', 'operation', 'reason', 'next_action', 'request_idempotency_id', 'request_sha256', 'state_version', 'state_hash', 'expected_evidence_tip', 'event_id', 'expected_event_hash', 'created_at', 'supersedes_diagnostic_id'];
      if (!closedData(value, keys) || canonical(value) !== pause.value.bytes || value.change_id !== state.change_id
        || value.schema_version !== '1.0' || value.operation !== 'run' || !utf8Text(value.diagnostic_id) || !utf8Text(value.command_id)
        || !utf8Text(value.reason) || !utf8Text(value.next_action) || !utf8Text(value.request_idempotency_id) || !isHash(value.request_sha256) || !Number.isSafeInteger(value.state_version)
        || !isHash(value.state_hash) || value.command_id !== state.authorization_cycle?.command_id
        || value.state_version !== state.state_version || value.state_hash !== stateHash(state)
        || (request !== null && value.request_sha256 !== sha256(canonical(request)))
        || !(value.expected_evidence_tip === null || isSha(value.expected_evidence_tip))
        || !(value.event_id === null || utf8Text(value.event_id)) || !(value.expected_event_hash === null || isHash(value.expected_event_hash))
        || !canonicalTime(value.created_at) || !(value.supersedes_diagnostic_id === null || utf8Text(value.supersedes_diagnostic_id))) return { kind: 'UNAVAILABLE' };
      return { kind: 'OK', value, blocked_reason: value.reason === 'EVIDENCE_REF_CONFLICT' ? 'LEDGER_APPEND_AMBIGUOUS' : value.reason };
    } catch { return { kind: 'UNAVAILABLE' }; }
  };
  const readStatusPause = async (state, changeId = state?.change_id ?? null) => {
    try {
      const pause = await d.state.readLocalPause();
      if (pause?.kind === 'ABSENT') return { kind: 'ABSENT' };
      if (pause?.kind !== 'OK' || typeof pause.value?.bytes !== 'string' || !isHash(pause.value?.sha256)
        || sha256(pause.value.bytes) !== pause.value.sha256) return { kind: 'UNAVAILABLE' };
      const value = JSON.parse(pause.value.bytes);
      if (value === null && pause.value.bytes === 'null') return { kind: 'ABSENT' };
      const keys = ['schema_version', 'diagnostic_id', 'change_id', 'command_id', 'operation', 'reason', 'next_action', 'request_idempotency_id', 'request_sha256', 'state_version', 'state_hash', 'expected_evidence_tip', 'event_id', 'expected_event_hash', 'created_at', 'supersedes_diagnostic_id'];
      if (!closedData(value, keys) || canonical(value) !== pause.value.bytes || value.schema_version !== '1.0'
        || value.change_id !== changeId || !['run', 'applyControllerCommand', 'settlement'].includes(value.operation)
        || !utf8Text(value.diagnostic_id) || !(value.command_id === null || utf8Text(value.command_id)) || !utf8Text(value.reason) || !utf8Text(value.next_action)
        || !utf8Text(value.request_idempotency_id) || !isHash(value.request_sha256) || !(value.state_version === null || Number.isSafeInteger(value.state_version))
        || !(value.state_hash === null || isHash(value.state_hash))
        || (state !== null && (value.command_id !== state.authorization_cycle?.command_id || value.state_version !== state.state_version || value.state_hash !== stateHash(state)))
        || !((value.reason === 'EVIDENCE_REF_UNAVAILABLE' && value.next_action === 'IDENTICAL_COMMAND_REPLAY')
          || (['EVIDENCE_REF_CONFLICT', 'ORPHAN_READY_CONFLICT', 'POINTER_STATE_CONFLICT'].includes(value.reason) && value.next_action === 'MANUAL_CONTROLLER_STOP'))
        || !(value.expected_evidence_tip === null || isSha(value.expected_evidence_tip))
        || !(value.event_id === null || utf8Text(value.event_id)) || !(value.expected_event_hash === null || isHash(value.expected_event_hash))
        || !canonicalTime(value.created_at) || !(value.supersedes_diagnostic_id === null || utf8Text(value.supersedes_diagnostic_id))) return { kind: 'UNAVAILABLE' };
      return { kind: 'OK', value };
    } catch { return { kind: 'UNAVAILABLE' }; }
  };
  const readLedgerRecords = async state => {
    const remote = await d.ledger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: state.change_id });
    const value = remote?.value;
    const keys = ['remote_ref', 'expected_tip', 'tip', 'tip_parent', 'tip_tree', 'authoritative_path', 'file_present', 'ledger_bytes_base64', 'prior_bytes_sha256', 'prior_byte_length', 'last_event_id', 'last_event_hash', 'last_sequence'];
    if (remote?.kind !== 'OK' || !closedData(remote, ['kind', 'value', 'receipt_sha256']) || !closedData(value, keys)
      || remote.receipt_sha256 !== sha256(canonical(value)) || value.remote_ref !== 'refs/heads/evidence/agent-runs'
      || value.expected_tip !== null || value.authoritative_path !== `ledger/${state.change_id}.jsonl`
      || value.file_present !== true || !isSha(value.tip) || !(value.tip_parent === null || isSha(value.tip_parent)) || !isSha(value.tip_tree)
      || typeof value.ledger_bytes_base64 !== 'string' || !isHash(value.prior_bytes_sha256)
      || !Number.isSafeInteger(value.prior_byte_length) || value.prior_byte_length <= 0
      || !utf8Text(value.last_event_id) || !isHash(value.last_event_hash) || !Number.isSafeInteger(value.last_sequence) || value.last_sequence <= 0)
      return null;
    const bytes = Buffer.from(value.ledger_bytes_base64, 'base64');
    if (bytes.toString('base64') !== value.ledger_bytes_base64 || bytes.length !== value.prior_byte_length
      || sha256(bytes) !== value.prior_bytes_sha256 || (bytes.length !== 0 && bytes.at(-1) !== 0x0a)) return null;
    try {
      let offset = 0;
      const indexed = (bytes.length === 0 ? [] : bytes.subarray(0, -1).toString('utf8').split('\n')).map((line, index) => {
        const record = JSON.parse(line); const { event_hash, ...preimage } = record;
        if (!closedData(record, ['schema_version', 'event_id', 'sequence', 'event_class', 'idempotency_id', 'change_id', 'occurred_at', 'state_version', 'subject_sha', 'detail', 'event_hash'])
          || canonical(record) !== line || record.schema_version !== '1.0' || record.change_id !== state.change_id || record.sequence !== index + 1
          || !utf8Text(record.event_id) || !utf8Text(record.idempotency_id) || !Number.isSafeInteger(record.state_version) || !isSha(record.subject_sha)
          || !canonicalTime(record.occurred_at) || !validLedgerDetail(record) || event_hash !== sha256(canonical(preimage))) throw new Error('invalid Ledger');
        const lineBytes = Buffer.from(`${line}\n`);
        if (!lineBytes.equals(bytes.subarray(offset, offset + lineBytes.length))) throw new Error('invalid Ledger bytes');
        const item = { record, offset, length: lineBytes.length, bytes: lineBytes };
        offset += lineBytes.length;
        return item;
      });
      if (offset !== bytes.length) return null;
      const records = indexed.map(item => item.record);
      const last = records.at(-1);
      if (!last || value.last_event_id !== last.event_id || value.last_event_hash !== last.event_hash || value.last_sequence !== last.sequence) return null;
      return { records, indexed, source: value };
    } catch { return null; }
  };
  const readyLedgerTuple = (state, ledger) => {
    const matches = ledger?.records?.filter(record => record.event_class === 'CONTROLLER_COMMAND'
      && record.detail?.command_kind === 'DISPATCH' && record.detail?.command_id === state.authorization_cycle?.command_id) ?? [];
    const record = matches[0]; const detail = record?.detail;
    return matches.length === 1 && record.state_version === state.state_version && record.subject_sha === state.repository?.baseline_sha
      && detail?.command_id === state.admission?.command_id && detail.body_sha256 === state.admission?.body_sha256
      && canonical(detail.admission) === canonical(state.admission) && detail.ready_state_sha256 === stateHash(state);
  };
  const hasReadyDispatchAuthority = async (state, body, verified = null, suppliedLedger = undefined) => {
    if (state?.macro_state !== 'READY' || state.phase !== 'WORKTREE' || !body || body.command_kind !== 'DISPATCH'
      || !isHash(verified?.body_sha256) || !isHash(verified?.signature_sha256) || !utf8Text(verified?.verified_key_id)) return false;
    let ledger = suppliedLedger; if (ledger === undefined) { try { ledger = await readLedgerRecords(state); } catch { return false; } } if (ledger === null) return false;
    const matches = ledger.records.filter(record => record.event_class === 'CONTROLLER_COMMAND'
      && record.detail?.command_kind === 'DISPATCH' && record.detail?.command_id === body.command_id);
    const record = matches[0]; const detail = record?.detail;
    return readyLedgerTuple(state, ledger) && matches.length === 1 && record.subject_sha === body.worktree.baseline_sha && record.state_version === state.state_version
      && record.idempotency_id === body.idempotency_id && state.admission?.command_id === body.command_id
      && state.admission?.body_sha256 === verified.body_sha256
      && state.admission?.idempotency_id === body.idempotency_id && state.repository?.baseline_sha === body.worktree.baseline_sha
      && state.repository?.branch === body.worktree.branch && state.repository?.worktree_root === body.worktree.root
      && detail?.body_sha256 === state.admission.body_sha256 && detail.body_sha256 === verified.body_sha256
      && detail.signature_sha256 === verified.signature_sha256 && detail.verified_key_id === verified.verified_key_id
      && detail.command_id === body.command_id && detail.receipt_digest === body.receipt_digest
      && canonical(detail.evidence_refs) === canonical(body.evidence_refs) && canonical(detail.admission) === canonical(state.admission)
      && detail.ready_state_sha256 === stateHash(state);
  };
  const reauthenticateDispatch = async (state, body, verified, rawBody, signatureBytes) => {
    const stop = await readLocalStop(state);
    const ledger = await readLedgerRecords(state);
    if (stop.kind !== 'ABSENT' || ledger === null) return { recovered: false, source: 'UNAVAILABLE' };
    const { records, indexed, source } = ledger;
    const commands = records?.filter(record => record.event_class === 'CONTROLLER_COMMAND' && ['DISPATCH', 'REVISION'].includes(record.detail?.command_kind)) ?? [];
    const current = commands.at(-1); const cycleSubject = current?.subject_sha;
    const originals = commands.filter(record => record.detail?.command_kind === 'DISPATCH' && record.detail?.command_id === body.command_id);
    const original = originals[0];
    const suppliedAdmission = { command_id: body.command_id, body_sha256: verified.body_sha256, idempotency_id: body.idempotency_id };
    const detail = original?.detail;
    const sourceMatches = originals.length === 1 && original.subject_sha === body.worktree.baseline_sha
      && detail?.command_kind === 'DISPATCH' && detail.command_id === body.command_id
      && canonical(detail.evidence_refs) === canonical(body.evidence_refs)
      && canonical(detail.admission) === canonical({ command_id: body.command_id, body_sha256: detail.body_sha256, idempotency_id: original.idempotency_id });
    const currentCycle = commands.filter(record => record.detail?.command_id === state.authorization_cycle?.command_id
      && record.detail?.command_kind === state.authorization_cycle?.command_kind);
    const sourceScopeSha256 = sha256(canonical({ allowed_paths: body.scope.allowed_paths, forbidden_paths: body.scope.forbidden_paths }));
    const currentCycleRecords = currentCycle.length === 1 ? records.slice(currentCycle[0].sequence - 1) : [];
    const roleForPhase = { SPEC: 'juaner_spec', TEST_RED: 'juaner_test', WORKER_GREEN: 'juaner_worker', VALIDATOR: 'juaner_validator' };
    const requiredPhases = state.authorization_cycle?.command_kind === 'REVISION'
      ? ['TEST_RED', 'WORKER_GREEN', 'VALIDATOR'] : ['SPEC', 'TEST_RED', 'WORKER_GREEN', 'VALIDATOR'];
    const attemptCount = state.authorization_cycle?.auto_repair_attempt === 1 ? 2 : 1;
    const agentRecords = currentCycleRecords.filter(record => record.event_class === 'AGENT_RUN');
    const bindingFor = detail => {
      const keys = [...agentBindingKeys, ...(Object.hasOwn(detail, 'repair_evidence') ? ['repair_evidence'] : Object.hasOwn(detail, 'repair_proof') ? ['repair_proof'] : [])];
      return Object.fromEntries(keys.map(key => [key, detail[key]]));
    };
    const ordinaryExtensionsMatch = pair => !Object.hasOwn(pair.binding, 'repair_evidence')
      && !Object.hasOwn(pair.binding, 'repair_proof')
      && !Object.hasOwn(pair.detail, 'repair_evidence')
      && !Object.hasOwn(pair.detail, 'repair_proof')
      && !Object.hasOwn(pair.detail, 'validator_artifact')
      && !Object.hasOwn(pair.detail, 'repair_delivery');
    const validatorExtensionsMatch = pair => !Object.hasOwn(pair.binding, 'repair_evidence')
      && !Object.hasOwn(pair.binding, 'repair_proof')
      && !Object.hasOwn(pair.detail, 'repair_evidence')
      && !Object.hasOwn(pair.detail, 'repair_proof')
      && Object.hasOwn(pair.detail, 'validator_artifact')
      && !Object.hasOwn(pair.detail, 'repair_delivery');
    const repairTestExtensionsMatch = pair => Object.hasOwn(pair.binding, 'repair_evidence')
      && !Object.hasOwn(pair.binding, 'repair_proof')
      && Object.hasOwn(pair.detail, 'repair_evidence')
      && Object.hasOwn(pair.detail, 'repair_proof')
      && !Object.hasOwn(pair.detail, 'validator_artifact')
      && !Object.hasOwn(pair.detail, 'repair_delivery');
    const repairWorkerExtensionsMatch = pair => !Object.hasOwn(pair.binding, 'repair_evidence')
      && Object.hasOwn(pair.binding, 'repair_proof')
      && !Object.hasOwn(pair.detail, 'repair_evidence')
      && Object.hasOwn(pair.detail, 'repair_proof')
      && !Object.hasOwn(pair.detail, 'validator_artifact')
      && Object.hasOwn(pair.detail, 'repair_delivery');
    const roleAuthorityMatches = (detail, phase) => {
      const authority = body.payload.roles.find(role => role.role === roleForPhase[phase]);
      return authority !== undefined && detail.role === roleForPhase[phase] && detail.agent === authority.agent
        && detail.model === authority.model && detail.reasoning === authority.reasoning && detail.sandbox === authority.sandbox
        && canonical(detail.allowed_paths) === canonical(authority.allowed_paths)
        && detail.brief_sha256 === authority.brief_sha256 && detail.input_sha256 === authority.input_sha256
        && detail.output_schema_sha256 === authority.output_schema_sha256;
    };
    const roleTriplesMatch = requiredPhases.every(phase => {
      const results = agentRecords.filter(record => record.detail.phase === phase && record.detail.stage === 'RESULT');
      return results.length === (phase === 'SPEC' ? 1 : attemptCount) && results.every((resultRecord, attempt) => {
        const detail = resultRecord.detail; const binding = bindingFor(detail);
        const requested = agentRecords.filter(record => record.detail.phase === phase && record.detail.stage === 'REQUESTED'
          && canonical(record.detail) === canonical({ ...binding, stage: 'REQUESTED' }));
        const started = agentRecords.filter(record => record.detail.phase === phase && record.detail.stage === 'STARTED'
          && canonical(record.detail) === canonical({ ...binding, stage: 'STARTED', observed_child_id: detail.observed_child_id }));
        const receipt = currentCycleRecords.find(record => record.sequence === resultRecord.sequence + 1);
        const expectedStatus = phase === 'VALIDATOR' && attemptCount === 2 && attempt === 0 ? 'FAIL' : 'PASS';
        return detail.status === expectedStatus && roleAuthorityMatches(detail, phase) && requested.length === 1 && started.length === 1
          && requested[0].sequence < started[0].sequence && started[0].sequence < resultRecord.sequence
          && requested[0].state_version === binding.state_version && started[0].state_version === binding.state_version + 1
          && resultRecord.state_version === binding.state_version + 2 && requested[0].subject_sha === binding.subject_sha
          && started[0].subject_sha === binding.subject_sha && requested[0].idempotency_id === binding.idempotency_id
          && started[0].idempotency_id === binding.idempotency_id && resultRecord.subject_sha === binding.subject_sha
          && resultRecord.idempotency_id === binding.idempotency_id
          && (phase === 'SPEC'
            ? receipt?.event_class !== 'VALIDATION_RESULT'
            : receipt?.event_class === 'VALIDATION_RESULT' && receipt.subject_sha === binding.subject_sha
              && receipt.state_version === resultRecord.state_version && receipt.idempotency_id === binding.idempotency_id
              && canonical(receipt.detail) === canonical(roleReceipt(binding, detail.status, {
                ...state, phase, candidate: phase === 'VALIDATOR' ? { ...(state.candidate ?? {}), sha: binding.subject_sha } : state.candidate,
              }))
              && (phase !== 'VALIDATOR' || validValidatorArtifact(detail.validator_artifact, {
                ...state, candidate: { ...(state.candidate ?? {}), sha: binding.subject_sha },
              }, detail.artifact_sha256, detail.status, body.scope)));
      });
    }) && agentRecords.every(record => requiredPhases.includes(record.detail.phase)
      && roleAuthorityMatches(record.detail, record.detail.phase)
      && ['REQUESTED', 'STARTED', 'RESULT'].includes(record.detail.stage));
    const sourceValidationsMatch = currentCycleRecords.filter(record => record.event_class === 'VALIDATION_RESULT' && Object.hasOwn(record.detail, 'repository_root')).every(record =>
      record.detail.repository_root === body.repository.canonical_root && record.detail.worktree_root === body.worktree.root
      && record.detail.branch === body.worktree.branch && record.detail.scope_sha256 === sourceScopeSha256);
    const currentCycleEvidence = (() => {
      const refMatches = (ref, record) => {
        const item = indexed[record.sequence - 1];
        return closedData(ref, ['remote_ref', 'tip', 'tip_tree', 'authoritative_path', 'event_id', 'event_hash', 'sequence', 'record_offset', 'record_length', 'record_bytes_sha256'])
          && ref.remote_ref === source.remote_ref && isSha(ref.tip) && isSha(ref.tip_tree)
          && ref.authoritative_path === source.authoritative_path && ref.event_id === record.event_id
          && ref.event_hash === record.event_hash && ref.sequence === record.sequence
          && ref.record_offset === item?.offset && ref.record_length === item?.length
          && ref.record_bytes_sha256 === sha256(item?.bytes);
      };
      const rolePairs = new Map(); const roleMembers = new Set(); const roleReceiptSequences = new Set();
      for (const [index, resultRecord] of currentCycleRecords.entries()) {
        const detail = resultRecord.detail;
        if (resultRecord.event_class !== 'AGENT_RUN' || detail.stage !== 'RESULT' || !['TEST_RED', 'WORKER_GREEN', 'VALIDATOR'].includes(detail.phase)) continue;
        const binding = bindingFor(detail);
        const requested = currentCycleRecords.filter((record, candidateIndex) => candidateIndex < index && record.event_class === 'AGENT_RUN'
          && record.detail.stage === 'REQUESTED' && canonical(record.detail) === canonical({ ...binding, stage: 'REQUESTED' }));
        const started = currentCycleRecords.filter((record, candidateIndex) => candidateIndex < index && record.event_class === 'AGENT_RUN'
          && record.detail.stage === 'STARTED' && canonical(record.detail) === canonical({ ...binding, stage: 'STARTED', observed_child_id: detail.observed_child_id }));
        const receipt = currentCycleRecords[index + 1];
        const phaseState = { ...state, phase: detail.phase, candidate: detail.phase === 'VALIDATOR' ? { ...(state.candidate ?? {}), sha: binding.subject_sha } : state.candidate };
        if (!roleAuthorityMatches(detail, detail.phase) || requested.length !== 1 || started.length !== 1
          || requested[0].sequence >= started[0].sequence || started[0].sequence >= resultRecord.sequence
          || requested[0].state_version !== binding.state_version || started[0].state_version !== binding.state_version + 1
          || resultRecord.state_version !== binding.state_version + 2 || requested[0].subject_sha !== binding.subject_sha
          || started[0].subject_sha !== binding.subject_sha || resultRecord.subject_sha !== binding.subject_sha
          || requested[0].idempotency_id !== binding.idempotency_id || started[0].idempotency_id !== binding.idempotency_id
          || resultRecord.idempotency_id !== binding.idempotency_id || receipt?.event_class !== 'VALIDATION_RESULT'
          || receipt.sequence !== resultRecord.sequence + 1 || receipt.subject_sha !== binding.subject_sha
          || receipt.state_version !== resultRecord.state_version || receipt.idempotency_id !== binding.idempotency_id
          || canonical(receipt.detail) !== canonical(roleReceipt(binding, detail.status, phaseState))
          || (detail.phase === 'VALIDATOR' && !validValidatorArtifact(detail.validator_artifact, phaseState, detail.artifact_sha256, detail.status, body.scope))) return false;
        rolePairs.set(resultRecord.sequence, { type: detail.phase, binding, requested: requested[0], started: started[0], result: resultRecord, receipt, detail, status: detail.status });
        for (const record of [requested[0], started[0], resultRecord]) roleMembers.add(record.sequence);
        roleReceiptSequences.add(receipt.sequence);
      }
      const specResults = agentRecords.filter(record => record.detail.phase === 'SPEC' && record.detail.stage === 'RESULT');
      const specResult = specResults[0]; const specBinding = specResult && bindingFor(specResult.detail);
      const specRequested = specBinding ? agentRecords.filter(record => record.detail.phase === 'SPEC' && record.detail.stage === 'REQUESTED'
        && canonical(record.detail) === canonical({ ...specBinding, stage: 'REQUESTED' })) : [];
      const specStarted = specBinding ? agentRecords.filter(record => record.detail.phase === 'SPEC' && record.detail.stage === 'STARTED'
        && canonical(record.detail) === canonical({ ...specBinding, stage: 'STARTED', observed_child_id: specResult.detail.observed_child_id })) : [];
      const specRecordSequences = new Set([...specRequested, ...specStarted, ...specResults].map(record => record.sequence));
      const allSpecRecordsMatch = agentRecords.filter(record => record.detail.phase === 'SPEC').every(record => specRecordSequences.has(record.sequence)
        && !Object.hasOwn(record.detail, 'repair_evidence') && !Object.hasOwn(record.detail, 'repair_proof')
        && !Object.hasOwn(record.detail, 'validator_artifact') && !Object.hasOwn(record.detail, 'repair_delivery'));
      const initialTest = [...rolePairs.values()].find(pair => pair.type === 'TEST_RED');
      if ((state.authorization_cycle?.command_kind === 'DISPATCH'
        && (specResults.length !== 1 || specRequested.length !== 1 || specStarted.length !== 1 || !allSpecRecordsMatch || !initialTest || specResult.subject_sha !== cycleSubject
          || specRequested[0].sequence !== currentCycle[0]?.sequence + 1 || specRequested[0].state_version !== currentCycle[0]?.state_version
          || initialTest.binding.subject_sha !== cycleSubject
          || initialTest.requested.sequence !== specResult.sequence + 1
          || initialTest.binding.state_version !== specResult.state_version + 1))
        || (state.authorization_cycle?.command_kind === 'REVISION'
          && (specResults.length !== 0 || !allSpecRecordsMatch || !initialTest
            || initialTest.requested.sequence !== currentCycle[0]?.sequence + 1
            || initialTest.binding.state_version !== currentCycle[0]?.state_version))) return false;
      const executionType = record => record.event_class === 'VALIDATION_RESULT' && closedData(record.detail, executionReceiptKeys)
        ? record.detail.validation_kind === 'REGRESSION' && record.detail.validation_scope === 'AFFECTED_SUITE' && record.detail.validation_id === 'regression-affected-suite' ? 'REGRESSION_AFFECTED_SUITE'
          : record.detail.validation_kind === 'REGRESSION' && record.detail.validation_scope === 'TEST_ASSET_RETIREMENT' && record.detail.validation_id === 'regression-test-asset-retirement' ? 'REGRESSION_TEST_ASSET_RETIREMENT'
            : record.detail.validation_kind === 'FINAL_VALIDATION' && record.detail.validation_scope === 'CANDIDATE' && record.detail.validation_id === 'final-validation-candidate' ? 'FINAL_VALIDATION' : null : null;
      const facts = [];
      for (const record of currentCycleRecords) {
        if (record === currentCycle[0]) continue;
        if (record.event_class === 'AGENT_RUN') {
          if (record.detail.phase === 'SPEC') continue;
          if (!roleMembers.has(record.sequence)) return false;
          if (rolePairs.has(record.sequence)) facts.push(rolePairs.get(record.sequence));
          continue;
        }
        if (record.event_class === 'VALIDATION_RESULT') {
          if (roleReceiptSequences.has(record.sequence)) continue;
          const type = executionType(record); if (!type) return false;
          facts.push({ type, receipt: record, status: record.detail.verdict }); continue;
        }
        if (record.event_class === 'CANDIDATE_COMMITTED') { facts.push({ type: 'CANDIDATE_COMMITTED', record }); continue; }
        if (record.event_class === 'BRANCH_PUSHED') continue;
        return false;
      }
      const pattern = ['TEST_RED', 'WORKER_GREEN', 'REGRESSION_AFFECTED_SUITE', 'REGRESSION_TEST_ASSET_RETIREMENT', 'CANDIDATE_COMMITTED', 'FINAL_VALIDATION', 'VALIDATOR'];
      const attemptCount = state.authorization_cycle?.auto_repair_attempt === 1 ? 2 : 1;
      if (facts.length !== pattern.length * attemptCount || !utf8Text(state.evidence?.worktree?.common_git_dir)) return false;
      const definitionFor = (id, validation_kind, validation_scope) => {
        const definition = body.payload.validations.find(value => value.id === id);
        return definition && { id: definition.id, validation_kind, validation_scope, subject: definition.subject, argv: definition.argv, cwd: definition.cwd, environment: definition.environment, timeout_ms: definition.timeout_ms };
      };
      const worktreeSubject = head_sha => ({ kind: 'WORKTREE', repository_root: body.repository.canonical_root, worktree_root: state.repository.worktree_root,
        branch: state.repository.branch, head_sha, common_git_dir: state.evidence.worktree.common_git_dir, allowed_paths: body.scope.allowed_paths, forbidden_paths: body.scope.forbidden_paths });
      let prior = null; let final = null;
      for (let attempt = 0; attempt < attemptCount; attempt += 1) {
        const items = facts.slice(attempt * pattern.length, (attempt + 1) * pattern.length);
        if (items.some((item, index) => item.type !== pattern[index])) return false;
        const [test, worker, affected, retirement, candidateItem, finalValidation, validator] = items;
        const candidateRecord = candidateItem.record; const candidate = candidateRecord.detail.candidate_sha;
        const expectedHead = prior?.candidate ?? cycleSubject; const expectedValidator = attempt + 1 === attemptCount ? 'PASS' : 'FAIL';
        const affectedDefinition = definitionFor('regression-affected-suite', 'REGRESSION', 'AFFECTED_SUITE');
        const retirementDefinition = definitionFor('regression-test-asset-retirement', 'REGRESSION', 'TEST_ASSET_RETIREMENT');
        const finalDefinition = definitionFor('final-validation-candidate', 'FINAL_VALIDATION', 'CANDIDATE');
        const finalSubject = { ...worktreeSubject(candidate), kind: 'CANDIDATE', candidate_sha: candidate, candidate_tree: candidateRecord.detail.tree };
        if (test.status !== 'PASS' || worker.status !== 'PASS' || affected.status !== 'PASS' || retirement.status !== 'PASS' || finalValidation.status !== 'PASS' || validator.status !== expectedValidator
          || test.binding.subject_sha !== expectedHead || worker.binding.subject_sha !== expectedHead || validator.binding.subject_sha !== candidate
          || worker.binding.state_version !== test.receipt.state_version + 1 || worker.requested.sequence !== test.receipt.sequence + 1
          || affected.receipt.sequence !== worker.receipt.sequence + 1 || retirement.receipt.sequence !== affected.receipt.sequence + 1
          || candidateRecord.sequence !== retirement.receipt.sequence + 1 || finalValidation.receipt.sequence !== candidateRecord.sequence + 1
          || validator.requested.sequence !== finalValidation.receipt.sequence + 1 || candidateRecord.subject_sha !== expectedHead
          || worker.receipt.state_version + 1 !== affected.receipt.state_version || affected.receipt.state_version !== retirement.receipt.state_version
          || candidateRecord.state_version !== retirement.receipt.state_version + 1 || finalValidation.receipt.state_version !== candidateRecord.state_version + 1
          || validator.binding.state_version !== finalValidation.receipt.state_version + 1
          || candidateRecord.detail.parent !== expectedHead || candidateRecord.detail.branch !== state.repository.branch
          || candidateRecord.detail.staged_paths_sha256 !== sha256(canonical(candidateRecord.detail.staged_paths))
          || !affectedDefinition || !retirementDefinition || !finalDefinition
          || !validWorktreeReceipt(affected.receipt.detail, sha256(canonical(affected.receipt.detail)), affectedDefinition, worktreeSubject(expectedHead))
          || !validWorktreeReceipt(retirement.receipt.detail, sha256(canonical(retirement.receipt.detail)), retirementDefinition, worktreeSubject(expectedHead))
          || !validCandidateReceipt(finalValidation.receipt.detail, sha256(canonical(finalValidation.receipt.detail)), finalDefinition, finalSubject)
          || affected.receipt.detail.verdict !== 'PASS' || retirement.receipt.detail.verdict !== 'PASS'
          || affected.receipt.detail.worktree_snapshot_sha256 !== retirement.receipt.detail.worktree_snapshot_sha256
          || candidateRecord.detail.worktree_snapshot_sha256 !== affected.receipt.detail.worktree_snapshot_sha256
          || affected.receipt.subject_sha !== expectedHead || retirement.receipt.subject_sha !== expectedHead
          || affected.receipt.idempotency_id !== affectedDefinition.id || retirement.receipt.idempotency_id !== retirementDefinition.id
          || finalValidation.receipt.subject_sha !== candidate || finalValidation.receipt.idempotency_id !== finalDefinition.id
          || validator.receipt.detail.candidate_sha !== candidate || validator.receipt.detail.validator_head !== candidate) return false;
        if (attempt === 0 && (!ordinaryExtensionsMatch(test) || !ordinaryExtensionsMatch(worker) || !validatorExtensionsMatch(validator))) return false;
        if (attempt === 1) {
          if (!repairTestExtensionsMatch(test) || !repairWorkerExtensionsMatch(worker) || !validatorExtensionsMatch(validator)) return false;
          let repair;
          try { repair = validRepairEvidenceBinding(test.binding.repair_evidence) ? JSON.parse(Buffer.from(test.binding.repair_evidence.derived_input_bytes_base64, 'base64').toString('utf8')) : null; } catch { repair = null; }
          const proof = test.detail.repair_proof;
          const expectedScope = sha256(canonical({ allowed_paths: body.scope.allowed_paths, forbidden_paths: body.scope.forbidden_paths }));
          const testRoleAllowedPaths = body.payload.roles.find(role => role.role === 'juaner_test')?.allowed_paths;
          const workerAllowedPaths = body.payload.roles.find(role => role.role === 'juaner_worker')?.allowed_paths;
          const expectedProof = proof && { schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF_REF', artifact_path: test.detail.artifact_path,
            artifact_sha256: test.detail.artifact_sha256, execution_content_sha256: proof.execution_content_sha256,
            proof_receipt_sha256: proof.proof_receipt_sha256, test_files: proof.test_files };
          const testIdentity = { schema_version: '1.0', change_id: state.change_id, candidate_sha: expectedHead,
            authorization_cycle_command_id: state.authorization_cycle.command_id, repair_execution_attempt: 1,
            derived_input_sha256: test.binding.repair_evidence?.derived_input_sha256, state_version: test.binding.state_version };
          const workerIdentity = expectedProof && { schema_version: '1.0', change_id: state.change_id, candidate_sha: expectedHead,
            authorization_cycle_command_id: state.authorization_cycle.command_id, repair_execution_attempt: 1,
            repair_proof_sha256: sha256(canonical(expectedProof)), state_version: worker.binding.state_version };
          if (!prior || prior.validator.status !== 'FAIL' || !prior.validator.detail.validator_artifact.findings.every(finding => finding.classification === 'IMPLEMENTATION_IN_SCOPE')
            || test.requested.sequence !== prior.validator.receipt.sequence + 1 || test.binding.state_version !== prior.validator.receipt.state_version + 2
            || !validRepairProofSummary(proof) || !repair || !closedData(repair, ['schema_version', 'kind', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'source_execution_attempt', 'repair_execution_attempt', 'scope_sha256', 'validator_artifact_sha256', 'validator_receipt_sha256', 'validator_agent_result_event_ref', 'validator_receipt_event_ref', 'findings'])
            || canonical(repair) !== Buffer.from(test.binding.repair_evidence.derived_input_bytes_base64, 'base64').toString('utf8')
            || repair.schema_version !== '1.0' || repair.kind !== 'REPAIR_TEST_DERIVED_EVIDENCE'
            || repair.change_id !== state.change_id || repair.candidate_sha !== expectedHead || repair.candidate_tree !== prior.candidateRecord.detail.tree
            || repair.authorization_cycle_command_id !== state.authorization_cycle.command_id || repair.source_execution_attempt !== 0 || repair.repair_execution_attempt !== 1
            || repair.scope_sha256 !== expectedScope || test.binding.correlation_id !== `repair-test-correlation-${sha256(canonical(testIdentity))}`
            || test.binding.idempotency_id !== `repair-test-request-${sha256(canonical(testIdentity))}`
            || repair.validator_artifact_sha256 !== prior.validator.detail.artifact_sha256 || repair.validator_receipt_sha256 !== prior.validator.receipt.detail.receipt_sha256
            || !refMatches(repair.validator_agent_result_event_ref, prior.validator.result) || !refMatches(repair.validator_receipt_event_ref, prior.validator.receipt)
            || repair.validator_agent_result_event_ref.tip !== repair.validator_receipt_event_ref.tip
            || repair.validator_agent_result_event_ref.tip_tree !== repair.validator_receipt_event_ref.tip_tree
            || repair.validator_agent_result_event_ref.remote_ref !== repair.validator_receipt_event_ref.remote_ref
            || repair.validator_agent_result_event_ref.authoritative_path !== repair.validator_receipt_event_ref.authoritative_path
            || canonical(repair.findings) !== canonical(prior.validator.detail.validator_artifact.findings)
            || canonical(state.evidence?.repair_evidence) !== canonical(test.binding.repair_evidence)
            || proof.execution_content_sha256 !== sha256(canonical({ schema_version: '1.0', candidate_sha: expectedHead, candidate_tree: prior.candidateRecord.detail.tree, test_files: proof.test_files }))
            || !validRepairProofBinding(expectedProof) || canonical(worker.binding.repair_proof) !== canonical(expectedProof)
            || canonical(state.evidence?.repair_proof) !== canonical(expectedProof)
            || test.detail.artifact_path !== `/private/var/run/juanerai/repair-proof-results/${test.binding.correlation_id}.json`
            || worker.binding.correlation_id !== `repair-worker-correlation-${sha256(canonical(workerIdentity))}`
            || worker.binding.idempotency_id !== `repair-worker-request-${sha256(canonical(workerIdentity))}`
            || canonical(worker.detail.repair_delivery?.repair_proof) !== canonical(worker.binding.repair_proof)
            || worker.detail.repair_delivery?.post_worker_worktree_snapshot_sha256 !== affected.receipt.detail.worktree_snapshot_sha256
            || state.evidence?.repair_worker_snapshot_sha256 !== worker.detail.repair_delivery?.post_worker_worktree_snapshot_sha256
            || !Array.isArray(testRoleAllowedPaths) || !Array.isArray(workerAllowedPaths)
            || !proof.test_files.every(file => test.binding.allowed_paths.some(rule => matchesScope(rule, file.path))
              && testRoleAllowedPaths.some(rule => matchesScope(rule, file.path))
              && body.scope.allowed_paths.some(rule => matchesScope(rule, file.path))
              && !body.scope.forbidden_paths.some(rule => matchesScope(rule, file.path))
              && !workerAllowedPaths.some(rule => matchesScope(rule, file.path))
              && candidateRecord.detail.staged_paths.includes(file.path))) return false;
        }
        prior = { candidate, candidateRecord, validator }; final = { candidate, candidateRecord, finalValidation, validator };
      }
      const finalRefs = [final.finalValidation.receipt, final.validator.receipt].map(record => ({ event_id: record.event_id, event_hash: record.event_hash,
        validation_id: record.detail.validation_id, validation_kind: record.detail.validation_kind, receipt_sha256: record.detail.receipt_sha256,
        subject_sha: record.detail.subject_sha, candidate_sha: record.detail.candidate_sha, validator_head: record.detail.validator_head }));
      const pushes = currentCycleRecords.filter(record => record.event_class === 'BRANCH_PUSHED');
      return pushes.length === 1 && pushes[0].sequence > final.validator.receipt.sequence
        && pushes[0].detail.candidate_sha === final.candidate && pushes[0].detail.remote_head === final.candidate
        && pushes[0].detail.validator_head === final.candidate && pushes[0].detail.freeze_status === 'NOT_FROZEN'
        && pushes[0].state_version === final.validator.receipt.state_version + 1
        && state.state_version === pushes[0].state_version + (state.phase === 'PR' ? 2 : state.phase === 'HANDOFF' ? 3 : -1)
        && final.candidate === state.candidate?.sha && final.candidateRecord.detail.tree === state.candidate?.tree
        && final.candidateRecord.detail.parent === state.candidate?.parent && canonical(finalRefs) === canonical(state.candidate?.validation_refs);
    })();
    const sourceBindingsMatch = sourceMatches && currentCycle.length === 1
      && state.repository?.baseline_sha === body.worktree.baseline_sha && state.repository?.branch === body.worktree.branch
      && state.repository?.worktree_root === body.worktree.root
      && currentCycleRecords.every(record => record.event_class !== 'CONTROLLER_COMMAND'
        || record === currentCycle[0] || !['DISPATCH', 'REVISION'].includes(record.detail.command_kind))
      && roleTriplesMatch && sourceValidationsMatch && currentCycleEvidence;
    if (!sourceBindingsMatch) return { recovered: false, source: 'CONFLICT' };
    const candidate = state.candidate;
    const delivery = state.delivery;
    const candidates = currentCycleRecords.filter(record => record.event_class === 'CANDIDATE_COMMITTED'
      && record.sequence > currentCycle[0]?.sequence && record.detail.candidate_sha === candidate?.sha
      && record.detail.parent === candidate?.parent && record.detail.tree === candidate?.tree
      && record.detail.branch === state.repository?.branch
      && record.detail.staged_paths_sha256 === sha256(canonical(record.detail.staged_paths)));
    const pushes = currentCycleRecords.filter(record => record.event_class === 'BRANCH_PUSHED'
      && record.sequence > currentCycle[0]?.sequence && record.detail.candidate_sha === candidate?.sha
      && record.detail.remote_head === delivery?.remote_head && record.detail.validator_head === candidate?.validator_head
      && record.detail.freeze_status === 'NOT_FROZEN');
    const candidateRecord = candidates[0];
    const candidateMatches = candidates.length === 1;
    const pushedMatches = pushes.length === 1 && pushes[0].sequence > candidateRecord?.sequence;
    const deliveryMatches = candidate?.frozen === true && isSha(candidate.sha) && isSha(candidate.tree)
      && candidate.validator_head === candidate.sha && isSha(delivery?.remote_head) && delivery.remote_head === candidate.sha
      && isHash(delivery.canonical_diff_sha256) && /^delivery-[0-9a-f]{64}$/.test(delivery.delivery_id ?? '')
      && candidateMatches && pushedMatches
      && (state.phase !== 'HANDOFF' || (closedData(delivery.pull_request, ['number', 'url', 'base', 'head_branch', 'head_sha'])
        && Number.isSafeInteger(delivery.pull_request.number) && delivery.pull_request.number > 0
        && utf8Text(delivery.pull_request.url) && delivery.pull_request.url.length > 0
        && delivery.pull_request.base === 'main' && delivery.pull_request.head_branch === state.repository?.branch
        && delivery.pull_request.head_sha === candidate.sha));
    const currentMatches = current === currentCycle[0] && current?.detail?.command_id === state.authorization_cycle?.command_id
      && current.detail.command_kind === state.authorization_cycle?.command_kind
      && current.sequence <= records.at(-1).sequence && state.last_controller_command_id === state.authorization_cycle?.command_id
      && (current.detail.command_kind === 'DISPATCH'
        ? current === original
        : current.sequence > original.sequence && current.subject_sha === current.detail.evidence_refs?.[0]?.subject_sha
          && current.detail.evidence_refs?.length === 1 && current.detail.evidence_refs[0].sha256 === current.detail.receipt_digest
          && current.detail.admission === null && current.detail.ready_state_sha256 === null && utf8Text(current.idempotency_id));
    const stateMatches = state.macro_state === 'DELIVERING' && ['PR', 'HANDOFF'].includes(state.phase)
      && canonical(state.admission) === canonical(suppliedAdmission)
      && state.repository?.baseline_sha === body.worktree.baseline_sha && state.repository?.branch === body.worktree.branch
      && state.repository?.worktree_root === body.worktree.root && sha256(rawBody) === verified.body_sha256
      && sha256(signatureBytes) === verified.signature_sha256 && deliveryMatches;
    const suppliedMatches = original.idempotency_id === body.idempotency_id && detail.body_sha256 === verified.body_sha256
      && detail.signature_sha256 === verified.signature_sha256 && detail.verified_key_id === verified.verified_key_id
      && detail.receipt_digest === body.receipt_digest && canonical(detail.admission) === canonical(suppliedAdmission);
    return { recovered: suppliedMatches && currentMatches && stateMatches, source: suppliedMatches ? 'CONFLICT' : 'REPLAY' };
  };
  const writeState = async (state, prior = null) => { const old = prior ?? { ...state, state_version: state.state_version - 1 }; const written = await d.state.writeState({ change_id: state.change_id, expected_version: old.state_version, expected_sha256: stateHash(old), state, value: state, next_bytes: canonical(state) }); if (written?.kind !== 'OK' && written?.kind !== 'ALREADY_APPLIED') return false; const reread = decodedState(await d.state.readState({ change_id: state.change_id })); return reread !== null && canonical(reread) === canonical(state); };
  const block = async (operation, state, blocked_reason, next_action = 'MANUAL_CONTROLLER_STOP') => { if (!state) return result(operation, 'BLOCKED', null, null, null, null, { blocked_reason, next_action, blocked_event_id: null, local_pause_id: null }); const next = { ...state, macro_state: 'BLOCKED', phase: null, pending_agent: null, blocked_reason, resume_target: null, state_version: state.state_version + 1 }; if (!await writeState(next, state)) return result(operation, 'BLOCKED', null, null, null, state.change_id, { blocked_reason, next_action, blocked_event_id: null, local_pause_id: null }); return stateResult(operation, 'BLOCKED', next, { blocked_reason, next_action, blocked_event_id: null, local_pause_id: null }); };
  const unpersistedBlock = (operation, state, blocked_reason, next_action = 'MANUAL_CONTROLLER_STOP') => result(operation, 'BLOCKED', null, null, null, state?.change_id ?? null, { blocked_reason, next_action, blocked_event_id: null, local_pause_id: null });
  const eventRecord = (state, event_class, detail, sequence, occurred_at) => {
    const subject_sha = state.candidate?.sha ?? state.repository.baseline_sha;
    const record = { schema_version: '1.0', event_id: `event-${sha256(canonical({ event_class, detail, sequence, state_version: state.state_version, subject_sha })).slice(0, 24)}`, sequence, event_class, idempotency_id: detail.idempotency_id ?? detail.receipt_sha256 ?? state.admission?.idempotency_id, change_id: state.change_id, occurred_at, state_version: state.state_version, subject_sha, detail };
    record.event_hash = sha256(canonical(record));
    return record;
  };
  const boundedEventRecord = (state, event_class, detail, sequence) => {
    try { return Buffer.byteLength(`${canonical(eventRecord(state, event_class, detail, sequence, '1970-01-01T00:00:00.000Z'))}\n`, 'utf8') <= MAX_CONTROL_BYTES; } catch { return false; }
  };
  const append = async (state, event_class, detail) => {
    if (!boundedEventDetail(detail)) return { kind: 'EVIDENCE_CONFLICT' };
    const prior = await d.ledger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: state.change_id });
    if (prior?.kind !== 'OK') return prior;
    // The retained Foundation seam does not expose remote JSONL bytes.  It is
    // deliberately kept for its pre-M2 public controls; M2 never takes this
    // path because its Ledger gateway exposes the closed byte receipt.
    if (typeof prior.value?.ledger_bytes_base64 !== 'string') {
      const legacy = await d.ledger.prepareAppend({ change_id: state.change_id, event_class, detail, prior: prior.value });
      if (legacy?.kind !== 'OK') return legacy;
      const committed = await d.ledger.commitAndPush({ change_id: state.change_id, prepared: legacy.value });
      if (committed?.kind !== 'OK') return committed;
      return d.ledger.readRemoteAppend({ change_id: state.change_id, expected: committed.value });
    }
    const priorBytes = Buffer.from(prior.value.ledger_bytes_base64, 'base64');
    if (priorBytes.toString('base64') !== prior.value.ledger_bytes_base64 || sha256(priorBytes) !== prior.value.prior_bytes_sha256 || priorBytes.length !== prior.value.prior_byte_length) return { kind: 'EVIDENCE_CONFLICT' };
    const records = [];
    try {
      if (priorBytes.length !== 0 && priorBytes.at(-1) !== 0x0a) throw new Error('missing ledger LF');
      for (const line of (priorBytes.length === 0 ? [] : priorBytes.subarray(0, -1).toString('utf8').split('\n'))) {
        const parsed = JSON.parse(line);
        const { event_hash, ...preimage } = parsed;
        if (`${canonical(parsed)}\n` !== `${line}\n` || event_hash !== sha256(canonical(preimage))) throw new Error('noncanonical ledger record');
        records.push(parsed);
      }
      for (const [index, record] of records.entries()) {
        if (!closedData(record, ['schema_version', 'event_id', 'sequence', 'event_class', 'idempotency_id', 'change_id', 'occurred_at', 'state_version', 'subject_sha', 'detail', 'event_hash'])
          || record.schema_version !== '1.0' || record.sequence !== index + 1 || record.change_id !== state.change_id || !isSha(record.subject_sha) || !isHash(record.event_hash)
          || !canonicalTime(record.occurred_at) || !validLedgerDetail(record)
          || (record.detail?.idempotency_id !== undefined && record.idempotency_id !== record.detail.idempotency_id)) throw new Error('invalid ledger authority');
      }
      const last = records.at(-1);
      const resultRecord = records.at(-2);
      const currentSubject = state.candidate?.sha ?? state.repository.baseline_sha;
      const validationRefMatches = record => {
        const ref = state.candidate?.validation_refs?.at(-1);
        return ref?.event_id === record?.event_id && ref.event_hash === record.event_hash
          && ref.validation_id === record.detail.validation_id && ref.validation_kind === record.detail.validation_kind
          && ref.receipt_sha256 === record.detail.receipt_sha256 && ref.subject_sha === record.subject_sha
          && ref.candidate_sha === record.detail.candidate_sha && ref.validator_head === record.detail.validator_head;
      };
      const rolePair = (phase, verdict, delta, requirePending = false) => {
        if (last?.event_class !== 'VALIDATION_RESULT' || resultRecord?.event_class !== 'AGENT_RUN'
          || resultRecord.detail?.stage !== 'RESULT' || resultRecord.detail.phase !== phase || resultRecord.detail.status !== verdict
          || resultRecord.sequence + 1 !== last.sequence || resultRecord.state_version !== state.state_version - delta
          || last.state_version !== state.state_version - delta || resultRecord.subject_sha !== currentSubject || last.subject_sha !== currentSubject) return false;
        const extras = Object.hasOwn(resultRecord.detail, 'repair_evidence') ? ['repair_evidence']
          : Object.hasOwn(resultRecord.detail, 'repair_delivery') ? ['repair_proof'] : [];
        const keys = [...agentBindingKeys, ...extras];
        if (!keys.every(key => Object.hasOwn(resultRecord.detail, key))) return false;
        const binding = Object.fromEntries(keys.map(key => [key, resultRecord.detail[key]]));
        if (canonical(last.detail) !== canonical(roleReceipt(binding, verdict, { ...state, phase }))) return false;
        if (phase === 'VALIDATOR' && !validValidatorArtifact(resultRecord.detail.validator_artifact, state, resultRecord.detail.artifact_sha256, verdict, acceptedDispatch?.body?.scope)) return false;
        if (!requirePending) return true;
        return state.pending_agent?.started === true && state.pending_agent.observed_child_id === resultRecord.detail.observed_child_id
          && state.pending_agent.phase === 'VALIDATOR' && state.pending_agent.subject_sha === currentSubject
          && canonical(binding) === canonical(settlementBindingForLedger(state.pending_agent));
      };
      const executionReceipt = (id, kind, scope, delta, candidate) => {
        const source = acceptedDispatch?.body?.payload?.validations?.find(value => value.id === id);
        const definition = source && { id: source.id, validation_kind: kind, validation_scope: scope, subject: source.subject, argv: source.argv, cwd: source.cwd, environment: source.environment, timeout_ms: source.timeout_ms };
        const worktreeSubject = state.evidence?.regression_subject;
        const subject = candidate ? definition && worktreeSubject && state.candidate && {
          kind: 'CANDIDATE', repository_root: acceptedDispatch.body.repository.canonical_root, worktree_root: state.repository.worktree_root,
          branch: state.repository.branch, head_sha: state.candidate.sha, common_git_dir: worktreeSubject.common_git_dir,
          allowed_paths: acceptedDispatch.body.scope.allowed_paths, forbidden_paths: acceptedDispatch.body.scope.forbidden_paths,
          candidate_sha: state.candidate.sha, candidate_tree: state.candidate.tree,
        } : worktreeSubject;
        const outer = last ? sha256(canonical(last.detail)) : null;
        return last?.event_class === 'VALIDATION_RESULT' && last.state_version === state.state_version - delta && last.subject_sha === currentSubject
          && definition && subject && (candidate ? validCandidateReceipt(last.detail, outer, definition, subject) : validWorktreeReceipt(last.detail, outer, definition, subject));
      };
      const persistedRegressionReceipt = (() => {
        const receipt = state.evidence?.regression_receipts?.at(-1);
        const subject = state.evidence?.regression_subject;
        return last?.event_class === 'VALIDATION_RESULT' && last.state_version === state.state_version - 1
          && last.subject_sha === currentSubject && canonical(last.detail) === canonical(receipt) && validReceiptDetail(receipt)
          && receipt?.validation_id === 'regression-test-asset-retirement' && receipt.validation_kind === 'REGRESSION'
          && receipt.validation_scope === 'TEST_ASSET_RETIREMENT' && receipt.status === 'COMPLETED' && receipt.verdict === 'PASS'
          && receipt.failure_code === null && receipt.subject_kind === 'WORKTREE' && receipt.subject_sha === subject?.head_sha
          && receipt.repository_root === subject?.repository_root && receipt.worktree_root === subject?.worktree_root
          && receipt.branch === subject?.branch && receipt.head_sha === subject?.head_sha && receipt.common_git_dir === subject?.common_git_dir
          && receipt.scope_sha256 === sha256(canonical({ allowed_paths: subject?.allowed_paths, forbidden_paths: subject?.forbidden_paths }))
          && isHash(receipt.worktree_snapshot_sha256) && isHash(receipt.stdout_sha256) && isHash(receipt.stderr_sha256)
          && receipt.candidate_sha === null && receipt.candidate_tree === null && receipt.validator_head === null
          && receipt.idempotency_id === 'regression-test-asset-retirement';
      })();
      const successfulTransitionReceipt = (() => {
        if (state.macro_state === 'EXECUTING' && state.phase === 'WORKER_GREEN') return rolePair('TEST_RED', 'PASS', 1);
        if (state.macro_state === 'EXECUTING' && state.phase === 'REGRESSION') return rolePair('WORKER_GREEN', 'PASS', 1);
        if (state.macro_state === 'DELIVERING' && state.phase === 'STAGE') return persistedRegressionReceipt;
        if (state.macro_state === 'DELIVERING' && state.phase === 'VALIDATOR') return executionReceipt('final-validation-candidate', 'FINAL_VALIDATION', 'CANDIDATE', 1, true) && validationRefMatches(last);
        if (state.macro_state === 'DELIVERING' && state.phase === 'BRANCH_PUSH') return rolePair('VALIDATOR', 'PASS', 1) && validationRefMatches(last);
        return state.macro_state === 'EXECUTING' && state.phase === 'TEST_RED' && state.authorization_cycle?.auto_repair_attempt === 1
          && validRepairEvidenceBinding(state.evidence?.repair_evidence) && rolePair('VALIDATOR', 'FAIL', 2) && validationRefMatches(last);
      })();
      const budgetFailureReceipt = event_class === 'BLOCKED' && closedData(detail, ['blocked_reason', 'next_action', 'evidence_refs'])
        && detail.blocked_reason === 'STATE_WRITE_FAILED' && detail.next_action === 'MANUAL_CONTROLLER_STOP'
        && state.macro_state === 'DELIVERING' && state.phase === 'VALIDATOR' && state.authorization_cycle?.auto_repair_attempt === 1
        && rolePair('VALIDATOR', 'FAIL', 1, true) && Array.isArray(detail.evidence_refs) && detail.evidence_refs.length === 1
        && canonical(detail.evidence_refs[0]) === canonical({ kind: 'VALIDATION_RESULT', id: last?.event_id, sha256: last?.event_hash, subject_sha: last?.subject_sha });
      const receiptFrontier = last?.state_version === state.state_version || successfulTransitionReceipt || budgetFailureReceipt;
      if ((prior.value.last_sequence !== (last?.sequence ?? 0)) || prior.value.last_event_id !== (last?.event_id ?? null) || prior.value.last_event_hash !== (last?.event_hash ?? null)
        || (last?.event_class === 'VALIDATION_RESULT' && (!receiptFrontier || last.subject_sha !== currentSubject))) throw new Error('ledger authority mismatch');
    } catch { return { kind: 'EVIDENCE_CONFLICT' }; }
    const record = eventRecord(state, event_class, detail, prior.value.last_sequence + 1, d.clock.now());
    const event_bytes = Buffer.from(`${canonical(record)}\n`);
    if (event_bytes.length > MAX_CONTROL_BYTES) return { kind: 'EVIDENCE_CONFLICT' };
    const prepared = await d.ledger.prepareAppend({ remote_read_receipt_sha256: prior.receipt_sha256, expected_tip: prior.value.tip, prior_bytes: priorBytes, event_bytes });
    if (prepared?.kind !== 'OK') return prepared;
    const commitRequest = { prepared_receipt: prepared.value, idempotency_id: record.idempotency_id };
    const readbackRequest = commit_sha => ({ expected_commit: commit_sha, event_id: record.event_id, event_hash: record.event_hash, idempotency_id: record.idempotency_id });
    const validReadback = (readback, commit_sha) => {
      const value = readback?.value;
      return readback?.kind === 'OK' && readback.receipt_sha256 === sha256(canonical(value))
        && value?.commit_sha === commit_sha && value?.event_id === record.event_id && value?.event_hash === record.event_hash
        && value?.idempotency_id === record.idempotency_id && value?.record_offset === priorBytes.length
        && value?.record_length === event_bytes.length && value?.record_bytes_sha256 === sha256(event_bytes)
        && value?.prior_byte_length === priorBytes.length && value?.prior_bytes_sha256 === sha256(priorBytes)
        && value?.new_byte_length === priorBytes.length + event_bytes.length
        && value?.new_bytes_sha256 === sha256(Buffer.concat([priorBytes, event_bytes])) && value?.linearized === true;
    };
    const ambiguousCommitIdentity = (envelope, retainedCommit = null) => {
      const partial = envelope?.partial_receipt;
      if (!closedData(envelope, ['kind', 'reason', 'partial_receipt']) || envelope.kind !== 'AMBIGUOUS' || envelope.reason !== 'REMOTE_AMBIGUOUS'
        || !closedData(partial, ['stage', 'expected_tip', 'commit_sha', 'event_id', 'event_hash', 'idempotency_id', 'receipt_sha256'])) return null;
      if (!['EVIDENCE_COMMIT_CREATED', 'REMOTE_REF_READ'].includes(partial.stage) || partial.expected_tip !== prepared.value.expected_tip
        || !isSha(partial.commit_sha) || partial.event_id !== record.event_id || partial.event_hash !== record.event_hash
        || partial.idempotency_id !== record.idempotency_id || !isHash(partial.receipt_sha256)) return null;
      const { receipt_sha256, ...preimage } = partial;
      if (partial.stage === 'EVIDENCE_COMMIT_CREATED' && receipt_sha256 !== sha256(canonical(preimage))) return null;
      return retainedCommit === null || partial.commit_sha === retainedCommit ? partial.commit_sha : null;
    };
    const exactAbsence = (envelope, identity) => closedData(envelope, ['kind', 'reason', 'expected_identity'])
      && envelope.kind === 'ABSENT' && envelope.reason === 'EXPECTED_IDENTITY_ABSENT'
      && closedData(envelope.expected_identity, ['expected_commit', 'event_id', 'event_hash', 'idempotency_id'])
      && canonical(envelope.expected_identity) === canonical(identity);
    let committed = await d.ledger.commitAndPush(commitRequest);
    let commit_sha = committed?.kind === 'OK' && isSha(committed.value?.commit_sha) ? committed.value.commit_sha : ambiguousCommitIdentity(committed);
    if (!commit_sha) return committed;
    const retainedCommit = commit_sha;
    const retainedReadbackRequest = readbackRequest(retainedCommit);
    let readback = await d.ledger.readRemoteAppend(retainedReadbackRequest);
    if (validReadback(readback, commit_sha)) return readback;
    if (committed.kind !== 'AMBIGUOUS' || !exactAbsence(readback, retainedReadbackRequest)) {
      if (readback?.kind === 'OK') return { kind: 'EVIDENCE_CONFLICT' };
      if (readback?.kind === 'CONFLICT') return { kind: 'AMBIGUOUS', partial_receipt: committed.partial_receipt ?? null };
      return readback?.kind === 'UNAVAILABLE' ? readback : { kind: 'AMBIGUOUS', partial_receipt: committed.partial_receipt };
    }
    committed = await d.ledger.commitAndPush(commitRequest);
    commit_sha = committed?.kind === 'OK' && committed.value?.commit_sha === retainedCommit ? retainedCommit : ambiguousCommitIdentity(committed, retainedCommit);
    if (!commit_sha) return committed;
    readback = await d.ledger.readRemoteAppend(retainedReadbackRequest);
    if (validReadback(readback, commit_sha)) return readback;
    if (readback?.kind === 'OK') return { kind: 'EVIDENCE_CONFLICT' };
    if (readback?.kind === 'CONFLICT') return { kind: 'AMBIGUOUS', partial_receipt: committed.partial_receipt ?? null };
    return readback?.kind === 'UNAVAILABLE' ? readback : { kind: 'AMBIGUOUS', partial_receipt: committed.partial_receipt ?? null };
  };
  const appendReadbackRequest = (readback, fallback) => {
    const value = readback?.value;
    return typeof value?.commit_sha === 'string' && typeof value.event_id === 'string' && typeof value.event_hash === 'string' && typeof value.idempotency_id === 'string'
      ? { expected_commit: value.commit_sha, event_id: value.event_id, event_hash: value.event_hash, idempotency_id: value.idempotency_id }
      : fallback;
  };
  const roleReceipt = (binding, status, state) => {
    const preimage = {
      validation_id: binding.correlation_id,
      validation_kind: state.phase === 'VALIDATOR' ? 'VALIDATOR' : state.phase,
      validation_scope: state.phase === 'VALIDATOR' ? 'VALIDATOR_REVIEW' : state.phase === 'TEST_RED' ? 'ACCEPTANCE_CRITERION' : 'WORKER_OUTPUT',
      status: 'COMPLETED', verdict: status, failure_code: null,
      command_definition_sha256: sha256(canonical(binding)),
      subject_sha: binding.subject_sha,
      candidate_sha: state.phase === 'VALIDATOR' ? state.candidate?.sha : null,
      validator_head: state.phase === 'VALIDATOR' ? state.candidate?.sha : null,
      idempotency_id: binding.idempotency_id,
    };
    return { ...preimage, receipt_sha256: sha256(canonical(preimage)) };
  };
  const fixedTipRef = (readback, remote, indexed) => {
    const value = readback?.value;
    const authority = remote?.value;
    if (!value || !authority || !indexed || value.remote_ref !== authority.remote_ref || value.authoritative_path !== authority.authoritative_path
      || value.event_id !== indexed.record.event_id || value.event_hash !== indexed.record.event_hash
      || value.sequence !== indexed.record.sequence || value.record_offset !== indexed.offset
      || value.record_length !== indexed.length || value.record_bytes_sha256 !== sha256(indexed.bytes)) return null;
    return {
      remote_ref: remote.value.remote_ref, tip: remote.value.tip, tip_tree: remote.value.tip_tree,
      authoritative_path: remote.value.authoritative_path, event_id: value.event_id, event_hash: value.event_hash,
      sequence: value.sequence, record_offset: value.record_offset, record_length: value.record_length,
      record_bytes_sha256: value.record_bytes_sha256,
    };
  };
  const fixedTipRecordRef = (remote, indexed) => ({
    remote_ref: remote.value.remote_ref, tip: remote.value.tip, tip_tree: remote.value.tip_tree,
    authoritative_path: remote.value.authoritative_path, event_id: indexed.record.event_id,
    event_hash: indexed.record.event_hash, sequence: indexed.record.sequence,
    record_offset: indexed.offset, record_length: indexed.length, record_bytes_sha256: sha256(indexed.bytes),
  });
  const handoffEvidenceFromRemote = async state => {
    const remote = await d.ledger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: state.change_id });
    if (remote?.kind === 'UNAVAILABLE' || remote?.kind === 'AMBIGUOUS') return remote;
    const value = remote?.value;
    const remoteKeys = ['remote_ref', 'expected_tip', 'tip', 'tip_parent', 'tip_tree', 'authoritative_path', 'file_present', 'ledger_bytes_base64', 'prior_bytes_sha256', 'prior_byte_length', 'last_event_id', 'last_event_hash', 'last_sequence'];
    if (remote?.kind !== 'OK' || !closedData(remote, ['kind', 'value', 'receipt_sha256']) || !closedData(value, remoteKeys)
      || remote.receipt_sha256 !== sha256(canonical(value)) || value.remote_ref !== 'refs/heads/evidence/agent-runs'
      || value.expected_tip !== null || value.file_present !== true || !isSha(value.tip) || !isSha(value.tip_parent)
      || !isSha(value.tip_tree) || value.authoritative_path !== `ledger/${state.change_id}.jsonl`
      || typeof value.ledger_bytes_base64 !== 'string' || !isHash(value.prior_bytes_sha256)
      || !Number.isSafeInteger(value.prior_byte_length) || value.prior_byte_length <= 0) return { kind: 'CONFLICT' };
    const bytes = Buffer.from(value.ledger_bytes_base64, 'base64');
    if (bytes.toString('base64') !== value.ledger_bytes_base64 || bytes.length !== value.prior_byte_length
      || sha256(bytes) !== value.prior_bytes_sha256 || bytes.at(-1) !== 0x0a) return { kind: 'CONFLICT' };
    let indexed;
    try {
      let offset = 0;
      indexed = bytes.subarray(0, -1).toString('utf8').split('\n').map(line => {
        const lineBytes = Buffer.from(`${line}\n`); const record = JSON.parse(line); const { event_hash, ...preimage } = record;
        if (!boundedControl(record) || !closedData(record, ['schema_version', 'event_id', 'sequence', 'event_class', 'idempotency_id', 'change_id', 'occurred_at', 'state_version', 'subject_sha', 'detail', 'event_hash'])
          || canonical(record) !== line || !lineBytes.equals(bytes.subarray(offset, offset + lineBytes.length))
          || event_hash !== sha256(canonical(preimage))) throw new Error('invalid Ledger record');
        const item = { record, offset, length: lineBytes.length, bytes: lineBytes }; offset += lineBytes.length; return item;
      });
      if (offset !== bytes.length) throw new Error('incomplete Ledger');
    } catch { return { kind: 'CONFLICT' }; }
    const eventClasses = ['CONTROLLER_COMMAND', 'AGENT_RUN', 'VALIDATION_RESULT', 'BLOCKED', 'CANDIDATE_COMMITTED', 'BRANCH_PUSHED', 'HANDOFF_READY'];
    if (!indexed.every(({ record }, index) => record.schema_version === '1.0' && record.sequence === index + 1
      && record.change_id === state.change_id && Number.isSafeInteger(record.state_version) && record.state_version >= 0
      && isSha(record.subject_sha) && isHash(record.event_hash) && utf8Text(record.event_id) && record.event_id.length > 0
      && eventClasses.includes(record.event_class) && utf8Text(record.idempotency_id) && record.idempotency_id.length > 0
      && canonicalTime(record.occurred_at) && validLedgerDetail(record)
      && (record.detail?.idempotency_id === undefined || record.detail.idempotency_id === record.idempotency_id))) return { kind: 'CONFLICT' };
    const last = indexed.at(-1)?.record;
    if (value.last_sequence !== last?.sequence || value.last_event_id !== last?.event_id || value.last_event_hash !== last?.event_hash) return { kind: 'CONFLICT' };
    const semanticConflict = () => ({ kind: 'DURABLE_CONFLICT' });
    const cycleMatches = indexed.filter(({ record }) => record.event_class === 'CONTROLLER_COMMAND'
      && record.detail.command_id === state.authorization_cycle?.command_id
      && record.detail.command_kind === state.authorization_cycle?.command_kind);
    if (cycleMatches.length !== 1) return semanticConflict();
    const cycleCommand = cycleMatches[0].record;
    const rememberedCycle = state.authorization_cycle.command_kind === 'DISPATCH' ? acceptedDispatch
      : acceptedRevisions.find(revision => revision.body.command_id === state.authorization_cycle.command_id) ?? null;
    const rememberedBody = rememberedCycle?.body ?? null;
    const rememberedSubject = rememberedBody?.command_kind === 'REVISION'
      ? rememberedBody.payload.revision_of_candidate_sha ?? state.repository.baseline_sha
      : rememberedBody?.worktree?.baseline_sha;
    const admissionBody = acceptedDispatch?.body;
    const admissionMatches = admissionBody && validCommand(admissionBody) && admissionBody.command_kind === 'DISPATCH'
      && admissionBody.change_id === state.change_id && acceptedDispatch.body_sha256 === state.admission?.body_sha256
      && admissionBody.command_id === state.admission?.command_id && admissionBody.idempotency_id === state.admission?.idempotency_id
      && admissionBody.worktree.baseline_sha === state.repository.baseline_sha && admissionBody.worktree.branch === state.repository.branch
      && admissionBody.worktree.root === state.repository.worktree_root;
    const rememberedCycleMatches = rememberedBody === null ? state.authorization_cycle.command_kind === 'REVISION'
      : validCommand(rememberedBody) && rememberedCycle.body_sha256 === cycleCommand.detail.body_sha256
        && rememberedBody.command_id === cycleCommand.detail.command_id && rememberedBody.command_kind === cycleCommand.detail.command_kind
        && rememberedBody.idempotency_id === cycleCommand.idempotency_id && rememberedBody.change_id === state.change_id
        && rememberedSubject === cycleCommand.subject_sha;
    const cycleSubject = cycleCommand.subject_sha;
    if (!admissionMatches || !rememberedCycleMatches
      || (state.authorization_cycle.command_kind === 'DISPATCH' && cycleSubject !== state.repository.baseline_sha)) return semanticConflict();
    const cycleStart = cycleMatches[0].record.sequence - 1;
    const cycle = indexed.slice(cycleStart);
    if (cycle.slice(1).some(({ record }) => record.event_class === 'HANDOFF_READY'
      || (record.event_class === 'CONTROLLER_COMMAND' && ['DISPATCH', 'REVISION'].includes(record.detail.command_kind)))) return semanticConflict();
    const bindingFromResult = detail => {
      const copy = clone(detail);
      delete copy.stage; delete copy.observed_child_id; delete copy.status; delete copy.artifact_path; delete copy.artifact_sha256;
      delete copy.validator_artifact; delete copy.repair_delivery;
      if (copy.phase === 'TEST_RED' && Object.hasOwn(copy, 'repair_evidence')) delete copy.repair_proof;
      return copy;
    };
    const roleAuthorityFor = phase => {
      const roleName = { TEST_RED: 'juaner_test', WORKER_GREEN: 'juaner_worker', VALIDATOR: 'juaner_validator' }[phase];
      return acceptedDispatch?.body?.payload?.roles?.find(role => role.role === roleName) ?? null;
    };
    const rolePair = (item, index) => {
      const record = item.record; const detail = record.detail;
      if (record.event_class !== 'AGENT_RUN' || detail.stage !== 'RESULT'
        || !['TEST_RED', 'WORKER_GREEN', 'VALIDATOR'].includes(detail.phase)) return null;
      const expectedRole = { TEST_RED: 'juaner_test', WORKER_GREEN: 'juaner_worker', VALIDATOR: 'juaner_validator' }[detail.phase];
      const authority = roleAuthorityFor(detail.phase);
      const binding = bindingFromResult(detail); const receiptItem = cycle[index + 1]; const receiptRecord = receiptItem?.record;
      const requested = cycle.filter((candidate, candidateIndex) => candidateIndex < index && candidate.record.event_class === 'AGENT_RUN'
        && candidate.record.detail.stage === 'REQUESTED' && canonical({ ...binding, stage: 'REQUESTED' }) === canonical(candidate.record.detail));
      const started = cycle.filter((candidate, candidateIndex) => candidateIndex < index && candidate.record.event_class === 'AGENT_RUN'
        && candidate.record.detail.stage === 'STARTED' && candidate.record.detail.observed_child_id === detail.observed_child_id
        && canonical({ ...binding, stage: 'STARTED', observed_child_id: detail.observed_child_id }) === canonical(candidate.record.detail));
      const resultExtras = detail.phase === 'VALIDATOR' ? ['validator_artifact']
        : detail.phase === 'TEST_RED' && Object.hasOwn(detail, 'repair_evidence') ? ['repair_proof']
          : detail.phase === 'WORKER_GREEN' && Object.hasOwn(detail, 'repair_proof') ? ['repair_delivery'] : [];
      const resultKeys = [...Object.keys(binding), 'stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', ...resultExtras];
      const preimage = {
        validation_id: binding.correlation_id, validation_kind: detail.phase,
        validation_scope: detail.phase === 'VALIDATOR' ? 'VALIDATOR_REVIEW' : detail.phase === 'TEST_RED' ? 'ACCEPTANCE_CRITERION' : 'WORKER_OUTPUT',
        status: 'COMPLETED', verdict: detail.status, failure_code: null,
        command_definition_sha256: sha256(canonical(binding)), subject_sha: binding.subject_sha,
        candidate_sha: detail.phase === 'VALIDATOR' ? binding.subject_sha : null,
        validator_head: detail.phase === 'VALIDATOR' ? binding.subject_sha : null,
        idempotency_id: binding.idempotency_id,
      };
      const expectedReceipt = { ...preimage, receipt_sha256: sha256(canonical(preimage)) };
      if (!authority || detail.role !== expectedRole || binding.agent !== authority.agent || binding.model !== authority.model
        || binding.reasoning !== authority.reasoning || binding.sandbox !== authority.sandbox
        || canonical(binding.allowed_paths) !== canonical(authority.allowed_paths)
        || binding.brief_sha256 !== authority.brief_sha256 || binding.input_sha256 !== authority.input_sha256
        || binding.output_schema_sha256 !== authority.output_schema_sha256 || binding.phase !== detail.phase
        || !closedData(detail, resultKeys) || !['PASS', 'FAIL'].includes(detail.status)
        || requested.length !== 1 || started.length !== 1 || requested[0].record.sequence >= started[0].record.sequence
        || started[0].record.sequence >= record.sequence || requested[0].record.state_version !== binding.state_version
        || started[0].record.state_version !== binding.state_version + 1 || record.state_version !== binding.state_version + 2
        || requested[0].record.subject_sha !== binding.subject_sha || started[0].record.subject_sha !== binding.subject_sha
        || requested[0].record.idempotency_id !== binding.idempotency_id || started[0].record.idempotency_id !== binding.idempotency_id
        || record.subject_sha !== binding.subject_sha
        || record.idempotency_id !== binding.idempotency_id || receiptRecord?.event_class !== 'VALIDATION_RESULT'
        || receiptRecord.sequence !== record.sequence + 1 || receiptRecord.subject_sha !== binding.subject_sha
        || receiptRecord.state_version !== record.state_version || receiptRecord.idempotency_id !== binding.idempotency_id
        || canonical(receiptRecord.detail) !== canonical(expectedReceipt)) return false;
      if (detail.phase === 'VALIDATOR') {
        const artifactState = { ...state, candidate: { ...(state.candidate ?? {}), sha: binding.subject_sha } };
        if (!validValidatorArtifact(detail.validator_artifact, artifactState, detail.artifact_sha256, detail.status, acceptedDispatch?.body?.scope)) return false;
      }
      return { type: detail.phase, result: item, receipt: receiptItem, requested: requested[0], started: started[0], binding, artifact: detail.validator_artifact ?? null, status: detail.status, detail };
    };
    const recognized = [];
    for (let index = 0; index < cycle.length; index += 1) {
      const item = cycle[index]; const record = item.record;
      if (record.event_class === 'AGENT_RUN' && record.detail.stage === 'RESULT' && ['TEST_RED', 'WORKER_GREEN', 'VALIDATOR'].includes(record.detail.phase)) {
        const pair = rolePair(item, index); if (!pair) return semanticConflict(); recognized.push(pair); index += 1; continue;
      }
      if (record.event_class === 'VALIDATION_RESULT') {
        const purpose = record.detail.validation_kind === 'REGRESSION' && record.detail.validation_scope === 'AFFECTED_SUITE'
          && record.detail.validation_id === 'regression-affected-suite' ? 'REGRESSION_AFFECTED_SUITE'
          : record.detail.validation_kind === 'REGRESSION' && record.detail.validation_scope === 'TEST_ASSET_RETIREMENT'
            && record.detail.validation_id === 'regression-test-asset-retirement' ? 'REGRESSION_TEST_ASSET_RETIREMENT'
            : record.detail.validation_kind === 'FINAL_VALIDATION' && record.detail.validation_scope === 'CANDIDATE'
              && record.detail.validation_id === 'final-validation-candidate' ? 'FINAL_VALIDATION' : null;
        if (purpose && closedData(record.detail, executionReceiptKeys)) recognized.push({ type: purpose, receipt: item, status: record.detail.verdict });
        else return semanticConflict();
      } else if (record.event_class === 'CANDIDATE_COMMITTED') recognized.push({ type: 'CANDIDATE_COMMITTED', item });
    }
    const pattern = ['TEST_RED', 'WORKER_GREEN', 'REGRESSION_AFFECTED_SUITE', 'REGRESSION_TEST_ASSET_RETIREMENT', 'CANDIDATE_COMMITTED', 'FINAL_VALIDATION', 'VALIDATOR'];
    if (![pattern.length, pattern.length * 2].includes(recognized.length)) return semanticConflict();
    const attemptCount = recognized.length / pattern.length;
    if (attemptCount !== (state.authorization_cycle?.auto_repair_attempt === 1 ? 2 : 1)) return semanticConflict();
    if (!utf8Text(state.evidence?.worktree?.common_git_dir) || state.evidence.worktree.common_git_dir.length === 0) return { kind: 'CONFLICT' };
    const definitionFor = (id, validation_kind, validation_scope) => {
      const source = acceptedDispatch?.body?.payload?.validations?.find(value => value.id === id);
      return source && {
        id: source.id, validation_kind, validation_scope, subject: source.subject,
        argv: source.argv, cwd: source.cwd, environment: source.environment, timeout_ms: source.timeout_ms,
      };
    };
    const worktreeSubject = head_sha => ({
      kind: 'WORKTREE', repository_root: acceptedDispatch.body.repository.canonical_root,
      worktree_root: state.repository.worktree_root, branch: state.repository.branch, head_sha,
      common_git_dir: state.evidence?.worktree?.common_git_dir,
      allowed_paths: acceptedDispatch.body.scope.allowed_paths, forbidden_paths: acceptedDispatch.body.scope.forbidden_paths,
    });
    const candidateSubject = (candidate_sha, candidate_tree) => ({
      ...worktreeSubject(candidate_sha), kind: 'CANDIDATE', candidate_sha, candidate_tree,
    });
    const historicalRefMatches = (ref, item) => closedData(ref, ['remote_ref', 'tip', 'tip_tree', 'authoritative_path', 'event_id', 'event_hash', 'sequence', 'record_offset', 'record_length', 'record_bytes_sha256'])
      && ref.remote_ref === value.remote_ref && isSha(ref.tip) && isSha(ref.tip_tree)
      && ref.authoritative_path === value.authoritative_path && ref.event_id === item.record.event_id
      && ref.event_hash === item.record.event_hash && ref.sequence === item.record.sequence
      && ref.record_offset === item.offset && ref.record_length === item.length
      && ref.record_bytes_sha256 === sha256(item.bytes);
    const decodedRepairEvidence = binding => {
      try {
        if (!validRepairEvidenceBinding(binding)) return null;
        const bytes = Buffer.from(binding.derived_input_bytes_base64, 'base64');
        const raw = bytes.toString('utf8'); const value = JSON.parse(raw);
        const keys = ['schema_version', 'kind', 'change_id', 'candidate_sha', 'candidate_tree', 'authorization_cycle_command_id', 'source_execution_attempt', 'repair_execution_attempt', 'scope_sha256', 'validator_artifact_sha256', 'validator_receipt_sha256', 'validator_agent_result_event_ref', 'validator_receipt_event_ref', 'findings'];
        return canonical(value) === raw && closedData(value, keys) ? value : null;
      } catch { return null; }
    };
    const evidence = []; let finalArtifact = null; let finalCandidate = null;
    let priorAttempt = null;
    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const items = recognized.slice(attempt * pattern.length, (attempt + 1) * pattern.length);
      if (items.some((item, index) => item.type !== pattern[index])) return semanticConflict();
      const test = items[0]; const worker = items[1]; const affected = items[2]; const retirement = items[3];
      const candidateItem = items[4].item; const final = items[5]; const validator = items[6];
      const candidateRecord = candidateItem.record; const candidateDetail = candidateRecord.detail;
      const candidate = candidateDetail.candidate_sha; const expectedHead = priorAttempt?.candidate ?? cycleSubject;
      const expectedValidator = attempt + 1 === attemptCount ? 'PASS' : 'FAIL';
      const affectedDefinition = definitionFor('regression-affected-suite', 'REGRESSION', 'AFFECTED_SUITE');
      const retirementDefinition = definitionFor('regression-test-asset-retirement', 'REGRESSION', 'TEST_ASSET_RETIREMENT');
      const finalDefinition = definitionFor('final-validation-candidate', 'FINAL_VALIDATION', 'CANDIDATE');
      const regressionSubject = worktreeSubject(expectedHead); const finalSubject = candidateSubject(candidate, candidateDetail.tree);
      const affectedReceipt = affected.receipt.record.detail; const retirementReceipt = retirement.receipt.record.detail;
      const finalReceipt = final.receipt.record.detail; const validatorReceipt = validator.receipt.record.detail;
      if (test.status !== 'PASS' || worker.status !== 'PASS' || affected.status !== 'PASS' || retirement.status !== 'PASS'
        || final.status !== 'PASS' || validator.status !== expectedValidator
        || test.binding.subject_sha !== expectedHead || worker.binding.subject_sha !== expectedHead
        || validator.binding.subject_sha !== candidate || test.receipt.record.detail.subject_sha !== expectedHead
        || worker.receipt.record.detail.subject_sha !== expectedHead
        || worker.binding.state_version !== test.receipt.record.state_version + 1
        || worker.requested.record.sequence !== test.receipt.record.sequence + 1
        || affected.receipt.record.sequence !== worker.receipt.record.sequence + 1
        || retirement.receipt.record.sequence !== affected.receipt.record.sequence + 1
        || candidateRecord.sequence !== retirement.receipt.record.sequence + 1
        || final.receipt.record.sequence !== candidateRecord.sequence + 1
        || validator.requested.record.sequence !== final.receipt.record.sequence + 1
        || worker.receipt.record.state_version + 1 !== affected.receipt.record.state_version
        || affected.receipt.record.state_version !== retirement.receipt.record.state_version
        || candidateRecord.state_version !== retirement.receipt.record.state_version + 1
        || final.receipt.record.state_version !== candidateRecord.state_version + 1
        || validator.binding.state_version !== final.receipt.record.state_version + 1
        || !affectedDefinition || !retirementDefinition || !finalDefinition
        || !validWorktreeReceipt(affectedReceipt, sha256(canonical(affectedReceipt)), affectedDefinition, regressionSubject)
        || !validWorktreeReceipt(retirementReceipt, sha256(canonical(retirementReceipt)), retirementDefinition, regressionSubject)
        || affectedReceipt.verdict !== 'PASS' || retirementReceipt.verdict !== 'PASS'
        || affectedReceipt.worktree_snapshot_sha256 !== retirementReceipt.worktree_snapshot_sha256
        || affected.receipt.record.subject_sha !== expectedHead || retirement.receipt.record.subject_sha !== expectedHead
        || affected.receipt.record.idempotency_id !== affectedDefinition.id || retirement.receipt.record.idempotency_id !== retirementDefinition.id
        || candidateRecord.subject_sha !== expectedHead || candidateDetail.parent !== expectedHead
        || candidateDetail.branch !== state.repository.branch || candidateDetail.worktree_snapshot_sha256 !== affectedReceipt.worktree_snapshot_sha256
        || candidateDetail.staged_paths_sha256 !== sha256(canonical(candidateDetail.staged_paths))
        || !validCandidateReceipt(finalReceipt, sha256(canonical(finalReceipt)), finalDefinition, finalSubject)
        || finalReceipt.verdict !== 'PASS' || final.receipt.record.subject_sha !== candidate
        || final.receipt.record.idempotency_id !== finalDefinition.id
        || validatorReceipt.candidate_sha !== candidate || validatorReceipt.validator_head !== candidate
        || validator.receipt.record.subject_sha !== candidate || validator.result.record.subject_sha !== candidate) return semanticConflict();
      if (Object.hasOwn(validator.binding, 'repair_evidence') || Object.hasOwn(validator.binding, 'repair_proof')
        || (attempt === 0 && (Object.hasOwn(test.binding, 'repair_evidence') || Object.hasOwn(test.binding, 'repair_proof')
          || Object.hasOwn(worker.binding, 'repair_evidence') || Object.hasOwn(worker.binding, 'repair_proof')))) return semanticConflict();
      if (attempt === 1) {
        const repairEvidence = decodedRepairEvidence(test.binding.repair_evidence);
        const expectedScope = sha256(canonical({ allowed_paths: acceptedDispatch.body.scope.allowed_paths, forbidden_paths: acceptedDispatch.body.scope.forbidden_paths }));
        const testIdentity = { schema_version: '1.0', change_id: state.change_id, candidate_sha: expectedHead,
          authorization_cycle_command_id: state.authorization_cycle.command_id, repair_execution_attempt: 1,
          derived_input_sha256: test.binding.repair_evidence?.derived_input_sha256, state_version: test.binding.state_version };
        const proofSummary = test.detail.repair_proof;
        const expectedProof = proofSummary && {
          schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF_REF', artifact_path: test.detail.artifact_path,
          artifact_sha256: test.detail.artifact_sha256, execution_content_sha256: proofSummary.execution_content_sha256,
          proof_receipt_sha256: proofSummary.proof_receipt_sha256, test_files: proofSummary.test_files,
        };
        const workerIdentity = expectedProof && { schema_version: '1.0', change_id: state.change_id, candidate_sha: expectedHead,
          authorization_cycle_command_id: state.authorization_cycle.command_id, repair_execution_attempt: 1,
          repair_proof_sha256: sha256(canonical(expectedProof)), state_version: worker.binding.state_version };
        if (!priorAttempt || priorAttempt.validator.status !== 'FAIL'
          || !priorAttempt.validator.artifact.findings.every(finding => finding.classification === 'IMPLEMENTATION_IN_SCOPE')
          || Object.hasOwn(worker.binding, 'repair_evidence')
          || test.requested.record.sequence !== priorAttempt.validator.receipt.record.sequence + 1
          || test.binding.state_version !== priorAttempt.validator.receipt.record.state_version + 2
          || !repairEvidence || !validRepairProofSummary(proofSummary)
          || repairEvidence.schema_version !== '1.0' || repairEvidence.kind !== 'REPAIR_TEST_DERIVED_EVIDENCE'
          || repairEvidence.change_id !== state.change_id || repairEvidence.candidate_sha !== expectedHead
          || repairEvidence.candidate_tree !== priorAttempt.candidateDetail.tree
          || repairEvidence.authorization_cycle_command_id !== state.authorization_cycle.command_id
          || repairEvidence.source_execution_attempt !== 0 || repairEvidence.repair_execution_attempt !== 1
          || repairEvidence.scope_sha256 !== expectedScope
          || repairEvidence.validator_artifact_sha256 !== priorAttempt.validator.detail.artifact_sha256
          || repairEvidence.validator_receipt_sha256 !== priorAttempt.validator.receipt.record.detail.receipt_sha256
          || !historicalRefMatches(repairEvidence.validator_agent_result_event_ref, priorAttempt.validator.result)
          || !historicalRefMatches(repairEvidence.validator_receipt_event_ref, priorAttempt.validator.receipt)
          || repairEvidence.validator_agent_result_event_ref.tip !== repairEvidence.validator_receipt_event_ref.tip
          || repairEvidence.validator_agent_result_event_ref.tip_tree !== repairEvidence.validator_receipt_event_ref.tip_tree
          || repairEvidence.validator_agent_result_event_ref.remote_ref !== repairEvidence.validator_receipt_event_ref.remote_ref
          || repairEvidence.validator_agent_result_event_ref.authoritative_path !== repairEvidence.validator_receipt_event_ref.authoritative_path
          || canonical(repairEvidence.findings) !== canonical(priorAttempt.validator.artifact.findings)
          || test.binding.correlation_id !== `repair-test-correlation-${sha256(canonical(testIdentity))}`
          || test.binding.idempotency_id !== `repair-test-request-${sha256(canonical(testIdentity))}`
          || proofSummary.execution_content_sha256 !== sha256(canonical({ schema_version: '1.0', candidate_sha: expectedHead, candidate_tree: priorAttempt.candidateDetail.tree, test_files: proofSummary.test_files }))
          || !validRepairProofBinding(expectedProof) || canonical(worker.binding.repair_proof) !== canonical(expectedProof)
          || worker.binding.correlation_id !== `repair-worker-correlation-${sha256(canonical(workerIdentity))}`
          || worker.binding.idempotency_id !== `repair-worker-request-${sha256(canonical(workerIdentity))}`
          || canonical(worker.detail.repair_delivery?.repair_proof) !== canonical(expectedProof)
          || worker.detail.repair_delivery?.post_worker_worktree_snapshot_sha256 !== affectedReceipt.worktree_snapshot_sha256
          || !proofSummary.test_files.every(file => candidateDetail.staged_paths.includes(file.path))) return semanticConflict();
        if (canonical(state.evidence?.repair_evidence) !== canonical(test.binding.repair_evidence)
          || canonical(state.evidence?.repair_proof) !== canonical(expectedProof)
          || state.evidence?.repair_worker_snapshot_sha256 !== worker.detail.repair_delivery.post_worker_worktree_snapshot_sha256) return semanticConflict();
      }
      const slots = [items[0], items[1], items[2], items[3], items[5], items[6]];
      for (const slot of slots) {
        const receipt = slot.receipt.record.detail;
        const agentRef = slot.result ? fixedTipRecordRef(remote, slot.result) : null;
        const receiptRef = fixedTipRecordRef(remote, slot.receipt);
        evidence.push({
          authorization_cycle_command_id: state.authorization_cycle.command_id, execution_attempt: attempt,
          evidence_role: slot.type, subject_sha: receipt.subject_sha, candidate_sha: receipt.candidate_sha,
          agent_result_event_ref: agentRef, receipt_event_ref: receiptRef, receipt: clone(receipt),
        });
      }
      finalArtifact = items[6].artifact; finalCandidate = candidate;
      priorAttempt = { candidate, candidateDetail, validator };
    }
    const currentFinal = evidence.slice(-6);
    const candidateRefs = currentFinal.slice(-2).map(entry => ({
      event_id: entry.receipt_event_ref.event_id, event_hash: entry.receipt_event_ref.event_hash,
      validation_id: entry.receipt.validation_id, validation_kind: entry.receipt.validation_kind,
      receipt_sha256: entry.receipt.receipt_sha256, subject_sha: entry.receipt.subject_sha,
      candidate_sha: entry.receipt.candidate_sha, validator_head: entry.receipt.validator_head,
    }));
    if (finalCandidate !== state.candidate?.sha || canonical(candidateRefs) !== canonical(state.candidate?.validation_refs)
      || finalArtifact?.verdict !== 'PASS' || finalArtifact.validator_head !== state.candidate?.sha) return { kind: 'CONFLICT' };
    const refs = evidence.flatMap(entry => [entry.agent_result_event_ref, entry.receipt_event_ref].filter(Boolean))
      .sort((left, right) => left.sequence - right.sequence);
    if (new Set(refs.map(ref => ref.event_id)).size !== refs.length || new Set(refs.map(ref => ref.sequence)).size !== refs.length) return { kind: 'CONFLICT' };
    return { kind: 'OK', value: { validation_receipts: evidence, ledger_refs: refs, validator_artifact: clone(finalArtifact) } };
  };
  const repairEvidenceFromRemote = async (state, agentResult, validatorReceipt, artifact, settlement) => {
    const remote = await d.ledger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: state.change_id });
    const value = remote?.value;
    if (remote?.kind === 'UNAVAILABLE') return { kind: 'UNAVAILABLE' };
    if (remote?.kind === 'AMBIGUOUS') return { kind: 'AMBIGUOUS' };
    const remoteKeys = ['remote_ref', 'expected_tip', 'tip', 'tip_parent', 'tip_tree', 'authoritative_path', 'file_present', 'ledger_bytes_base64', 'prior_bytes_sha256', 'prior_byte_length', 'last_event_id', 'last_event_hash', 'last_sequence'];
    if (remote?.kind !== 'OK' || !closedData(remote, ['kind', 'value', 'receipt_sha256']) || !closedData(value, remoteKeys)
      || remote.receipt_sha256 !== sha256(canonical(value)) || value.remote_ref !== 'refs/heads/evidence/agent-runs'
      || value.expected_tip !== null || value.file_present !== true || typeof value.ledger_bytes_base64 !== 'string'
      || !isSha(value.tip) || !isSha(value.tip_parent) || !isSha(value.tip_tree)
      || value.authoritative_path !== `ledger/${state.change_id}.jsonl`
      || !isHash(value.prior_bytes_sha256) || !Number.isSafeInteger(value.prior_byte_length) || value.prior_byte_length <= 0) return { kind: 'CONFLICT' };
    const bytes = Buffer.from(value.ledger_bytes_base64, 'base64');
    if (bytes.toString('base64') !== value.ledger_bytes_base64 || bytes.length !== value.prior_byte_length
      || sha256(bytes) !== value.prior_bytes_sha256 || bytes.at(-1) !== 0x0a) return { kind: 'CONFLICT' };
    let indexed;
    try {
      let offset = 0;
      indexed = bytes.subarray(0, -1).toString('utf8').split('\n').map(line => {
        const lineBytes = Buffer.from(`${line}\n`); const record = JSON.parse(line); const { event_hash, ...preimage } = record;
        if (!boundedControl(record) || !closedData(record, ['schema_version', 'event_id', 'sequence', 'event_class', 'idempotency_id', 'change_id', 'occurred_at', 'state_version', 'subject_sha', 'detail', 'event_hash'])
          || canonical(record) !== line || !lineBytes.equals(bytes.subarray(offset, offset + lineBytes.length)) || event_hash !== sha256(canonical(preimage))) throw new Error('invalid record');
        const result = { record, offset, length: lineBytes.length, bytes: lineBytes }; offset += lineBytes.length; return result;
      });
      if (offset !== bytes.length) throw new Error('incomplete history');
    } catch { return { kind: 'CONFLICT' }; }
    const eventClasses = ['CONTROLLER_COMMAND', 'AGENT_RUN', 'VALIDATION_RESULT', 'BLOCKED', 'CANDIDATE_COMMITTED', 'BRANCH_PUSHED', 'HANDOFF_READY'];
    if (!indexed.every(({ record }, index) => record.schema_version === '1.0' && record.sequence === index + 1 && record.change_id === state.change_id
      && Number.isSafeInteger(record.state_version) && record.state_version >= 0 && isSha(record.subject_sha) && isHash(record.event_hash)
      && utf8Text(record.event_id) && record.event_id.length > 0 && eventClasses.includes(record.event_class)
      && utf8Text(record.idempotency_id) && record.idempotency_id.length > 0
      && canonicalTime(record.occurred_at) && validLedgerDetail(record)
      && (record.detail?.idempotency_id === undefined || record.detail.idempotency_id === record.idempotency_id))) return { kind: 'CONFLICT' };
    const last = indexed.at(-1)?.record;
    if (value.last_sequence !== last?.sequence || value.last_event_id !== last?.event_id || value.last_event_hash !== last?.event_hash) return { kind: 'CONFLICT' };
    const resultIndex = indexed.findIndex(({ record }) => record.event_id === agentResult.value?.event_id && record.event_hash === agentResult.value?.event_hash);
    const receiptIndex = indexed.findIndex(({ record }) => record.event_id === validatorReceipt.value?.event_id && record.event_hash === validatorReceipt.value?.event_hash);
    const result = indexed[resultIndex]?.record; const receiptRecord = indexed[receiptIndex]?.record;
    const { stage: _stage, observed_child_id: _child, status: _status, artifact_path: _path, artifact_sha256: _artifact, validator_artifact: _validator, ...sourceBinding } = result?.detail ?? {};
    const expectedBinding = settlementBindingForLedger(state.pending_agent);
    const resultKeys = [...Object.keys(expectedBinding), 'stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', 'validator_artifact'];
    if (!result || !receiptRecord || indexed.filter(({ record }) => record.event_id === agentResult.value?.event_id).length !== 1
      || indexed.filter(({ record }) => record.event_id === validatorReceipt.value?.event_id).length !== 1 || receiptIndex !== resultIndex + 1
      || result.event_class !== 'AGENT_RUN' || result.detail?.stage !== 'RESULT' || receiptRecord.event_class !== 'VALIDATION_RESULT'
      || result.state_version !== state.state_version || receiptRecord.state_version !== state.state_version
      || result.subject_sha !== state.candidate?.sha || receiptRecord.subject_sha !== state.candidate?.sha
      || result.idempotency_id !== agentResult.value?.idempotency_id || receiptRecord.idempotency_id !== validatorReceipt.value?.idempotency_id
      || !closedData(result.detail, resultKeys) || canonical(sourceBinding) !== canonical(expectedBinding)
      || result.detail.observed_child_id !== state.pending_agent?.observed_child_id || result.detail.status !== 'FAIL'
      || result.detail.artifact_path !== settlement.artifact_path || result.detail.artifact_sha256 !== settlement.artifact_sha256
      || canonical(result.detail?.validator_artifact) !== canonical(artifact) || receiptRecord.detail?.validation_kind !== 'VALIDATOR'
      || !closedData(receiptRecord.detail, ['validation_id', 'validation_kind', 'validation_scope', 'status', 'verdict', 'failure_code', 'command_definition_sha256', 'subject_sha', 'candidate_sha', 'validator_head', 'idempotency_id', 'receipt_sha256'])
      || canonical(receiptRecord.detail) !== canonical(roleReceipt(sourceBinding, 'FAIL', state))) return { kind: 'INELIGIBLE' };
    const resultRef = fixedTipRef(agentResult, remote, indexed[resultIndex]); const receiptRef = fixedTipRef(validatorReceipt, remote, indexed[receiptIndex]);
    if (!resultRef || !receiptRef) return { kind: 'INELIGIBLE' };
    const derived = {
      schema_version: '1.0', kind: 'REPAIR_TEST_DERIVED_EVIDENCE', change_id: state.change_id,
      candidate_sha: state.candidate?.sha, candidate_tree: state.candidate?.tree,
      authorization_cycle_command_id: state.authorization_cycle.command_id,
      source_execution_attempt: 0, repair_execution_attempt: 1,
      scope_sha256: sha256(canonical({ allowed_paths: acceptedDispatch.body.scope.allowed_paths, forbidden_paths: acceptedDispatch.body.scope.forbidden_paths })),
      validator_artifact_sha256: sha256(canonical(artifact)), validator_receipt_sha256: receiptRecord.detail.receipt_sha256,
      validator_agent_result_event_ref: resultRef, validator_receipt_event_ref: receiptRef, findings: artifact.findings,
    };
    const bytesOut = Buffer.from(canonical(derived));
    if (bytesOut.length === 0 || bytesOut.length > MAX_CONTROL_BYTES || Buffer.from(bytesOut.toString('base64'), 'base64').length !== bytesOut.length) return { kind: 'INELIGIBLE' };
    const evidence = {
      schema_version: '1.0', kind: 'REPAIR_TEST_EVIDENCE', derived_input_sha256: sha256(bytesOut),
      derived_input_byte_length: bytesOut.length, derived_input_bytes_base64: bytesOut.toString('base64'),
    };
    return boundedControl(evidence) ? { kind: 'OK', value: evidence, next_sequence: value.last_sequence + 1 } : { kind: 'INELIGIBLE' };
  };
  const validationReceiptKeys = ['validation_id', 'validation_kind', 'validation_scope', 'status', 'verdict', 'failure_code', 'command_definition_sha256', 'receipt_sha256', 'subject_kind', 'subject_sha', 'repository_root', 'worktree_root', 'branch', 'head_sha', 'common_git_dir', 'execution_cwd', 'scope_sha256', 'worktree_snapshot_sha256', 'candidate_sha', 'candidate_tree', 'stdout_sha256', 'stderr_sha256', 'validator_head', 'idempotency_id'];
  const validWorktreeReceipt = (value, outer, definition, subject) => {
    const scope_sha256 = sha256(canonical({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }));
    const tuple = (value.status === 'COMPLETED' && ((value.verdict === 'PASS' && value.failure_code === null) || (value.verdict === 'FAIL' && value.failure_code === 'NONZERO_EXIT')))
      || (value.status === 'START_FAILED' && value.verdict === null && ['PROCESS_START_FAILED', 'SUBJECT_MISMATCH'].includes(value.failure_code))
      || (value.status === 'INTERRUPTED' && value.verdict === null && ['TIMEOUT', 'SIGNAL_EXIT', 'SUBJECT_MISMATCH'].includes(value.failure_code));
    const { receipt_sha256, ...preimage } = value ?? {};
    return closedData(value, validationReceiptKeys) && tuple
      && value.validation_id === definition.id && value.validation_kind === definition.validation_kind && value.validation_scope === definition.validation_scope
      && value.command_definition_sha256 === sha256(canonical(definition)) && value.subject_kind === 'WORKTREE'
      && value.subject_sha === subject.head_sha && value.repository_root === subject.repository_root && value.worktree_root === subject.worktree_root
      && value.branch === subject.branch && value.head_sha === subject.head_sha && value.common_git_dir === subject.common_git_dir
      && value.execution_cwd === definition.cwd && value.scope_sha256 === scope_sha256 && isHash(value.worktree_snapshot_sha256)
      && value.candidate_sha === null && value.candidate_tree === null && value.validator_head === null && value.idempotency_id === definition.id
      && isHash(value.stdout_sha256) && isHash(value.stderr_sha256) && isHash(receipt_sha256)
      && receipt_sha256 === sha256(canonical(preimage)) && outer === sha256(canonical(value));
  };
  const validCandidateReceipt = (value, outer, definition, subject) => {
    if (!closedData(value, validationReceiptKeys)) return false;
    const scope_sha256 = sha256(canonical({ allowed_paths: subject.allowed_paths, forbidden_paths: subject.forbidden_paths }));
    const tuple = (value.status === 'COMPLETED' && ((value.verdict === 'PASS' && value.failure_code === null) || (value.verdict === 'FAIL' && value.failure_code === 'NONZERO_EXIT')))
      || (value.status === 'START_FAILED' && value.verdict === null && ['PROCESS_START_FAILED', 'SUBJECT_MISMATCH'].includes(value.failure_code))
      || (value.status === 'INTERRUPTED' && value.verdict === null && ['TIMEOUT', 'SIGNAL_EXIT', 'SUBJECT_MISMATCH'].includes(value.failure_code));
    const { receipt_sha256, ...preimage } = value;
    const expectedCwd = value.status === 'START_FAILED' && value.failure_code === 'SUBJECT_MISMATCH' ? null : definition.cwd;
    return tuple
      && value.validation_id === definition.id && value.validation_kind === 'FINAL_VALIDATION' && value.validation_scope === 'CANDIDATE'
      && value.command_definition_sha256 === sha256(canonical(definition)) && value.subject_kind === 'CANDIDATE'
      && value.subject_sha === subject.candidate_sha && value.repository_root === subject.repository_root && value.worktree_root === subject.worktree_root
      && value.branch === subject.branch && value.head_sha === subject.candidate_sha && value.common_git_dir === subject.common_git_dir
      && value.execution_cwd === expectedCwd && value.scope_sha256 === scope_sha256 && value.worktree_snapshot_sha256 === null
      && value.candidate_sha === subject.candidate_sha && value.candidate_tree === subject.candidate_tree && value.validator_head === null && value.idempotency_id === definition.id
      && isHash(value.stdout_sha256) && isHash(value.stderr_sha256) && isHash(receipt_sha256)
      && receipt_sha256 === sha256(canonical(preimage)) && outer === sha256(canonical(value));
  };
  const durableBlock = async (operation, state, blocked_reason, next_action, evidence, request) => {
    const evidence_refs = evidence.map(item => ({ kind: item.kind, id: item.id, sha256: item.sha256, subject_sha: item.subject_sha }))
      .sort((left, right) => byteCompare(canonical(left), canonical(right)));
    const ledger = await append(state, 'BLOCKED', { blocked_reason, next_action, evidence_refs });
    if (ledger?.kind === 'UNAVAILABLE') return localPause(operation, state, request, 'EVIDENCE_REF_UNAVAILABLE', 'IDENTICAL_COMMAND_REPLAY');
    if (ledger?.kind === 'AMBIGUOUS') return localPause(operation, state, request, 'LEDGER_APPEND_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', 'EVIDENCE_REF_CONFLICT');
    if (ledger?.kind !== 'OK') return localPause(operation, state, request, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', 'EVIDENCE_CONFLICT');
    const next = { ...state, macro_state: 'BLOCKED', phase: null, pending_agent: null, blocked_reason, resume_target: null, state_version: state.state_version + 1 };
    if (!await writeState(next, state)) return localPause(operation, state, request, 'POINTER_STATE_CONFLICT', 'MANUAL_CONTROLLER_STOP', 'POINTER_STATE_CONFLICT', ledger);
    return stateResult(operation, 'BLOCKED', next, { blocked_reason, next_action, blocked_event_id: ledger.value.event_id, local_pause_id: null });
  };
  const localPause = async (operation, state, request, reason, next_action, diagnostic_reason = reason, event = null) => {
    const expected_sha256 = null;
    const diagnostic = { schema_version: '1.0', diagnostic_id: d.ids.next('local-pause'), change_id: state.change_id, command_id: state.authorization_cycle.command_id, operation, reason: diagnostic_reason, next_action, request_idempotency_id: d.ids.next('local-pause-request'), request_sha256: sha256(canonical(request)), state_version: state.state_version, state_hash: stateHash(state), expected_evidence_tip: event?.value?.commit_sha ?? null, event_id: event?.value?.event_id ?? null, expected_event_hash: event?.value?.event_hash ?? null, created_at: d.clock.now(), supersedes_diagnostic_id: null };
    const next_bytes = canonical(diagnostic);
    const written = await d.state.writeLocalPause({ expected_sha256, next_bytes });
    const readback = await d.state.readLocalPause();
    if (written?.kind !== 'OK' || readback?.kind !== 'OK' || readback.value?.bytes !== next_bytes || readback.value?.sha256 !== sha256(next_bytes)) {
      const blocked_reason = diagnostic_reason === 'POINTER_STATE_CONFLICT' ? 'POINTER_STATE_CONFLICT' : reason;
      unpersistedStop = { change_id: state.change_id, blocked_event_id: event?.value?.event_id ?? null, blocked_reason };
      return result(operation, 'BLOCKED', state.macro_state, state.state_version, stateHash(state), state.change_id, {
        blocked_reason, next_action: blocked_reason === 'POINTER_STATE_CONFLICT' ? 'MANUAL_CONTROLLER_STOP' : next_action,
        blocked_event_id: event?.value?.event_id ?? null, local_pause_id: null,
      });
    }
    return result(operation, 'BLOCKED', state.macro_state, state.state_version, stateHash(state), state.change_id, { blocked_reason: reason, next_action, blocked_event_id: event?.value?.event_id ?? null, local_pause_id: diagnostic.diagnostic_id });
  };
  const appendFailureStop = (operation, state, request, envelope) => {
    if (envelope?.kind === 'UNAVAILABLE') return localPause(operation, state, request, 'EVIDENCE_REF_UNAVAILABLE', 'IDENTICAL_COMMAND_REPLAY');
    if (envelope?.kind === 'AMBIGUOUS') return localPause(operation, state, request, 'LEDGER_APPEND_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', 'EVIDENCE_REF_CONFLICT');
    return localPause(operation, state, request, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', 'EVIDENCE_CONFLICT');
  };
  const verifyCas = (operation, state, request) => !state || request.change_id !== state.change_id || request.expected_state_version !== state.state_version || request.expected_state_hash !== stateHash(state) ? rejected(operation, 'STATE_CONFLICT', request.change_id ?? null) : null;

  async function applyControllerCommand(request) {
    const operation = 'applyControllerCommand';
    if (!exact(request, ['command_body_bytes', 'signature_bytes']) || !(request.command_body_bytes instanceof Uint8Array) || !(request.signature_bytes instanceof Uint8Array)) return rejected(operation, 'INPUT_INVALID');
    let rawBody; try { rawBody = new TextDecoder().decode(request.command_body_bytes); if (canonical(JSON.parse(rawBody)) !== rawBody) return rejected(operation, 'INPUT_INVALID'); } catch { return rejected(operation, 'INPUT_INVALID'); }
    let verified; try { verified = await d.verifier.verify(request); } catch { return rejected(operation, 'COMMAND_SIGNATURE_INVALID'); }
    if (verified?.kind !== 'VERIFIED') return rejected(operation, verified?.error_code ?? 'COMMAND_SIGNATURE_INVALID');
    const body = verified.body; if (!validCommand(body)) return rejected(operation, 'INPUT_INVALID'); if (body.expires_at < d.clock.now()) return rejected(operation, 'COMMAND_EXPIRED', body.change_id);
    const held = await acquire(operation); if (held !== true) return held;
    try {
      if (body.command_kind === 'REVISION') { const prior = acceptedRevisions.find(entry => entry.body.command_id === body.command_id || entry.body.nonce === body.nonce || entry.body.idempotency_id === body.idempotency_id); if (prior) { if (prior.body_sha256 === verified.body_sha256 && canonical(prior.body) === rawBody) return clone(prior.result); return rejected(operation, 'COMMAND_REPLAY_CONFLICT', body.change_id); } }
      const pointer = pointerValue(await d.state.readPointer({})); if (!pointer) return rejected(operation, 'WIP_AUTHORITY_INVALID', body.change_id); if (body.command_kind === 'RELEASE' && pointer.active_change_id === null) { const closed = decodedState(await d.state.readState({ change_id: body.change_id })); if (closed?.macro_state === 'CLOSED') return stateResult(operation, 'ALREADY_APPLIED', closed, { idempotency_id: body.idempotency_id, original_receipt_sha256: closed.admission?.body_sha256 ?? body.receipt_digest }); }
      if (body.command_kind === 'RELEASE' && pointer.active_change_id !== body.change_id) return rejected(operation, pointer.active_change_id === null ? 'STATE_CONFLICT' : 'WIP_AUTHORITY_INVALID', body.change_id);
      if (body.command_kind === 'RELEASE' && (body.payload.macbook_main_sha !== body.payload.origin_main_sha || body.payload.origin_main_sha !== body.payload.squash_sha)) return rejected(operation, 'INPUT_INVALID', body.change_id);
      if (body.command_kind === 'DISPATCH') {
        if (pointer.active_change_id && pointer.active_change_id !== body.change_id) return rejected(operation, 'WIP_AUTHORITY_INVALID', body.change_id);
        if (pointer.active_change_id === body.change_id) {
          const existing = decodedState(await d.state.readState({ change_id: body.change_id }));
          const deliveryReauthentication = existing?.macro_state === 'DELIVERING' && ['PR', 'HANDOFF'].includes(existing.phase);
          const reauthentication = deliveryReauthentication
            ? await reauthenticateDispatch(existing, body, verified, rawBody, request.signature_bytes)
            : { recovered: false, source: 'UNAVAILABLE' };
          if (reauthentication.recovered) {
            acceptedDispatch = { body: clone(body), body_sha256: verified.body_sha256, admission_readback: null };
            acceptedDispatchReplay = { body: clone(body), body_sha256: verified.body_sha256 };
            if (testSeam) Object.defineProperty(d, TEST_ACCEPTED_DISPATCH, { value: acceptedDispatch, configurable: true });
            return stateResult(operation, 'ALREADY_APPLIED', existing, { idempotency_id: body.idempotency_id, original_receipt_sha256: verified.body_sha256 });
          }
          if (deliveryReauthentication) return rejected(operation, reauthentication.source === 'REPLAY' ? 'COMMAND_REPLAY_CONFLICT' : 'STATE_CONFLICT', body.change_id);
          if (testSeam) {
            const sameReadyAdmission = existing?.macro_state === 'READY' && existing.phase === 'WORKTREE'
              && existing.admission?.body_sha256 === verified.body_sha256 && existing.admission?.command_id === body.command_id
              && existing.admission?.idempotency_id === body.idempotency_id;
            if (existing?.admission && acceptedDispatch === null) return sameReadyAdmission
              ? block(operation, existing, 'DISPATCH_ORPHAN_READY')
              : rejected(operation, 'STATE_CONFLICT', body.change_id);
            const admission = acceptedDispatch?.admission_readback;
            const readback = await d.ledger.readRemoteAppend(appendReadbackRequest(admission, admission ? { change_id: body.change_id, expected: admission.value } : { change_id: body.change_id }));
            const trusted = existing?.macro_state === 'READY' && existing.phase === 'WORKTREE' && existing.admission?.body_sha256 === verified.body_sha256 && existing.admission?.command_id === body.command_id && existing.admission?.idempotency_id === body.idempotency_id && acceptedDispatch?.body_sha256 === verified.body_sha256 && canonical(acceptedDispatch.body) === rawBody && admission?.kind === 'OK' && admission.receipt_sha256 === sha256(canonical(admission.value));
            if (!trusted) return existing?.admission ? rejected(operation, 'STATE_CONFLICT', body.change_id) : block(operation, existing, 'DISPATCH_ORPHAN_READY');
            if (readback?.kind !== 'OK' || canonical(readback) !== canonical(admission)) return block(operation, existing, 'DISPATCH_ORPHAN_READY');
            return stateResult(operation, 'ALREADY_APPLIED', existing, { idempotency_id: body.idempotency_id, original_receipt_sha256: verified.body_sha256 });
          }
          const sameReadyTuple = existing?.macro_state === 'READY' && existing.phase === 'WORKTREE'
            && existing.admission?.body_sha256 === verified.body_sha256 && existing.admission?.command_id === body.command_id
            && existing.admission?.idempotency_id === body.idempotency_id;
          const sameReadyAdmission = await hasReadyDispatchAuthority(existing, body, verified);
          if (sameReadyAdmission) {
            acceptedDispatch = { body: clone(body), body_sha256: verified.body_sha256, signature_sha256: verified.signature_sha256, verified_key_id: verified.verified_key_id, admission_readback: null };
            acceptedDispatchReplay = { body: clone(body), body_sha256: verified.body_sha256 };
            if (testSeam) Object.defineProperty(d, TEST_ACCEPTED_DISPATCH, { value: acceptedDispatch, configurable: true });
            return stateResult(operation, 'ALREADY_APPLIED', existing, { idempotency_id: body.idempotency_id, original_receipt_sha256: verified.body_sha256 });
          }
          return sameReadyTuple ? block(operation, existing, 'DISPATCH_ORPHAN_READY') : existing?.admission ? rejected(operation, 'STATE_CONFLICT', body.change_id) : block(operation, existing, 'DISPATCH_ORPHAN_READY');
        }
        const expectedPointer = sha256(canonical({ schema_version: '1.0', active_change_id: null })); if (body.payload.expected_pointer_sha256 !== expectedPointer || body.expected_state_version !== null || body.expected_state_hash !== null) return rejected(operation, 'INPUT_INVALID', body.change_id);
        const nextPointer = { schema_version: '1.0', active_change_id: body.change_id }; const pointerWrite = await d.state.writePointer({ expected_sha256: expectedPointer, pointer: nextPointer, value: nextPointer, next_bytes: canonical(nextPointer) }); if (pointerWrite?.kind !== 'OK') return rejected(operation, 'WIP_AUTHORITY_INVALID', body.change_id); if (pointerValue(await d.state.readPointer({}))?.active_change_id !== body.change_id) return rejected(operation, 'WIP_AUTHORITY_INVALID', body.change_id);
        const state = { schema_version: '1.0', change_id: body.change_id, state_version: 1, macro_state: 'READY', phase: 'WORKTREE', admission: { command_id: body.command_id, body_sha256: verified.body_sha256, idempotency_id: body.idempotency_id }, authorization_cycle: { command_id: body.command_id, command_kind: 'DISPATCH', auto_repair_attempt: 0 }, repository: { baseline_sha: body.worktree.baseline_sha, branch: body.worktree.branch, worktree_root: body.worktree.root }, pending_agent: null, candidate: null, delivery: null, last_controller_command_id: body.command_id, blocked_reason: null, evidence: { remote_tip: null, last_event_id: null, last_event_hash: null, last_readback_sha256: null }, resume_target: null };
        if (!await writeState(state, { ...state, state_version: -1 })) return block(operation, state, 'DISPATCH_ORPHAN_READY');
        const ready_state_sha256 = stateHash(state); const ledger = await append(state, 'CONTROLLER_COMMAND', { command_kind: 'DISPATCH', command_id: body.command_id, body_sha256: verified.body_sha256, signature_sha256: verified.signature_sha256, verified_key_id: verified.verified_key_id, receipt_digest: body.receipt_digest, evidence_refs: clone(body.evidence_refs), admission: clone(state.admission), ready_state_sha256 });
        if (ledger?.kind !== 'OK' && ledger?.kind !== 'ALREADY_APPLIED') { if (ledger?.kind === 'UNAVAILABLE') { const diagnostic = { schema_version: '1.0', diagnostic_id: d.ids.next('local-pause'), change_id: body.change_id, command_id: body.command_id, operation, reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', request_idempotency_id: body.idempotency_id, request_sha256: sha256(request.command_body_bytes), state_version: state.state_version, state_hash: stateHash(state), expected_evidence_tip: null, event_id: null, expected_event_hash: null, created_at: d.clock.now(), supersedes_diagnostic_id: null }; const next_bytes = canonical(diagnostic); const pauseWrite = await d.state.writeLocalPause({ expected_sha256: null, next_bytes }); const pauseReadback = await d.state.readLocalPause(); if (pauseWrite?.kind !== 'OK' || pauseReadback?.kind !== 'OK' || pauseReadback.value?.bytes !== next_bytes || pauseReadback.value?.sha256 !== sha256(next_bytes)) return result(operation, 'BLOCKED', null, null, null, null, { blocked_reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', blocked_event_id: null, local_pause_id: null }); return result(operation, 'BLOCKED', null, null, null, null, { blocked_reason: 'EVIDENCE_REF_UNAVAILABLE', next_action: 'IDENTICAL_COMMAND_REPLAY', blocked_event_id: null, local_pause_id: null }); } return block(operation, state, 'LEDGER_APPEND_AMBIGUOUS'); }
        acceptedDispatch = { body: clone(body), body_sha256: verified.body_sha256, signature_sha256: verified.signature_sha256, verified_key_id: verified.verified_key_id, admission_readback: clone(ledger) };
        acceptedDispatchReplay = { body: clone(body), body_sha256: verified.body_sha256 };
        if (testSeam) Object.defineProperty(d, TEST_ACCEPTED_DISPATCH, { value: acceptedDispatch, configurable: true });
        return stateResult(operation, 'APPLIED', state, { command_id: body.command_id, command_kind: body.command_kind, operation_receipt_sha256: verified.body_sha256 });
      }
      const current = decodedState(await d.state.readState({ change_id: body.change_id })); if (body.command_kind === 'REVISION' && acceptedDispatchReplay && (acceptedDispatchReplay.body.command_id === body.command_id || acceptedDispatchReplay.body.nonce === body.nonce || acceptedDispatchReplay.body.idempotency_id === body.idempotency_id)) return rejected(operation, 'COMMAND_REPLAY_CONFLICT', body.change_id); if (body.command_kind === 'RELEASE' && current?.macro_state === 'CLOSED') { const request_sha256 = sha256(request.command_body_bytes); if (current.last_controller_command_id !== body.command_id || current.evidence?.last_readback_sha256 !== request_sha256) return rejected(operation, 'COMMAND_REPLAY_CONFLICT', body.change_id); const retainedPointer = pointerValue(await d.state.readPointer({})); if (retainedPointer?.active_change_id !== body.change_id) return block(operation, current, 'POINTER_CLEAR_FAILED'); const empty = { schema_version: '1.0', active_change_id: null }; const clear = await d.state.writePointer({ expected_sha256: sha256(canonical(retainedPointer)), pointer: empty, value: empty, next_bytes: canonical(empty) }); if (clear?.kind !== 'OK' || pointerValue(await d.state.readPointer({}))?.active_change_id !== null) return block(operation, current, 'POINTER_CLEAR_FAILED'); return stateResult(operation, 'CLOSED', current, { squash_sha: body.payload.squash_sha, pointer_cleared: true }); } const cas = verifyCas(operation, current, body); if (cas) return cas;
      if (body.command_kind === 'REVISION') { const admitted = acceptedDispatch?.body; const persistedRepository = admitted && { baseline_sha: admitted.worktree.baseline_sha, branch: admitted.worktree.branch, worktree_root: admitted.worktree.root }; const originalAuthority = admitted && validCommand(admitted) && body.change_id === admitted.change_id && canonical(body.repository) === canonical(admitted.repository) && canonical(body.scope) === canonical(admitted.scope) && canonical(body.worktree) === canonical(admitted.worktree) && canonical(current.repository) === canonical(persistedRepository) && current.admission?.command_id === admitted.command_id && current.admission?.body_sha256 === acceptedDispatch.body_sha256 && current.admission?.idempotency_id === admitted.idempotency_id && current.pending_agent === null; const preCandidate = current.macro_state === 'BLOCKED' && current.candidate === null && current.delivery === null && ['TEST_CAUSAL_RED_UNAVAILABLE', 'WORKER_GREEN_FAILURE'].includes(current.blocked_reason) && body.payload.revision_of_candidate_sha === null && body.idempotency_id !== admitted?.idempotency_id; const candidateReturn = current.macro_state === 'BLOCKED' && current.blocked_reason === 'VALIDATOR_SECOND_FAIL' && body.payload.revision_of_candidate_sha === current.candidate?.sha; const reviewReturn = current.macro_state === 'AWAITING_CONTROLLER' && current.candidate?.frozen === true && current.candidate.sha === current.candidate.validator_head && current.candidate.sha === current.delivery?.remote_head && current.candidate.sha === current.delivery?.pull_request?.head_sha && body.payload.revision_of_candidate_sha === current.candidate.sha; const subject_sha = preCandidate ? admitted?.worktree.baseline_sha : current.candidate?.sha; const evidence = body.evidence_refs.length === 1 && body.evidence_refs[0]; const exactEvidence = evidence && evidence.id === body.payload.changes_requested_ref && evidence.subject_sha === subject_sha && evidence.sha256 === body.receipt_digest; if (!(originalAuthority && exactEvidence && (preCandidate || candidateReturn || reviewReturn))) return rejected(operation, 'STATE_CONFLICT', body.change_id); const next = { ...current, macro_state: 'EXECUTING', phase: 'TEST_RED', pending_agent: null, blocked_reason: null, resume_target: null, state_version: current.state_version + 1, authorization_cycle: { command_id: body.command_id, command_kind: 'REVISION', auto_repair_attempt: 0 }, delivery: current.delivery?.remote_head ? { remote_head: current.delivery.remote_head } : null, last_controller_command_id: body.command_id }; const eventState = { ...next, admission: { ...next.admission, idempotency_id: body.idempotency_id } }; const ledger = await append(eventState, 'CONTROLLER_COMMAND', { command_kind: 'REVISION', command_id: body.command_id, body_sha256: verified.body_sha256, signature_sha256: verified.signature_sha256, verified_key_id: verified.verified_key_id, receipt_digest: body.receipt_digest, evidence_refs: clone(body.evidence_refs), admission: null, ready_state_sha256: null }); if (ledger?.kind !== 'OK') return appendFailureStop(operation, current, request, ledger); if (!await writeState(next, current)) return localPause(operation, current, request, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', 'STATE_WRITE_FAILED', ledger); const applied = stateResult(operation, 'APPLIED', next, { command_id: body.command_id, command_kind: body.command_kind, phase: next.phase }); acceptedRevisions.push({ body: clone(body), body_sha256: verified.body_sha256, result: clone(applied) }); return applied; }
      if (body.command_kind === 'RESUME') { const target = body.payload.resume_target; if (current.macro_state !== 'BLOCKED' || !current.resume_target || canonical(current.resume_target) !== canonical(target)) return rejected(operation, 'STATE_CONFLICT', body.change_id); const next = { ...current, macro_state: target.macro_state, phase: target.phase, pending_agent: null, blocked_reason: null, resume_target: null, state_version: current.state_version + 1, last_controller_command_id: body.command_id }; if (!await writeState(next, current)) return block(operation, current, 'RESUME_STATE_FAILED'); return stateResult(operation, 'APPLIED', next, { command_id: body.command_id, command_kind: 'RESUME', phase: next.phase }); }
      if (body.command_kind !== 'RELEASE' || current.macro_state !== 'AWAITING_CONTROLLER') return rejected(operation, 'RELEASE_NOT_READY', body.change_id);
      const mainWorktree = `${body.repository.canonical_root.replace(/\/$/, '')}/main`; const sync = await d.git.syncMainFfOnly({ canonical_root: body.repository.canonical_root, main_worktree_root: mainWorktree, squash_sha: body.payload.squash_sha, expected_origin_main: body.payload.origin_main_sha }); if (sync?.kind !== 'OK' || sync.value?.clean !== true || sync.value?.fast_forward_only !== true || sync.value?.local_main !== body.payload.squash_sha || sync.value?.origin_main !== body.payload.squash_sha) return block(operation, current, 'RELEASE_SYNC_FAILED'); const ledger = await append(current, 'CONTROLLER_COMMAND', { command_kind: 'RELEASE', command_id: body.command_id, body_sha256: verified.body_sha256, signature_sha256: verified.signature_sha256, verified_key_id: verified.verified_key_id, receipt_digest: body.receipt_digest, evidence_refs: clone(body.evidence_refs), admission: null, ready_state_sha256: null }); if (ledger?.kind !== 'OK') return block(operation, current, 'RELEASE_LEDGER_FAILED'); const closed = { ...current, macro_state: 'CLOSED', phase: null, state_version: current.state_version + 1, last_controller_command_id: body.command_id, evidence: { ...current.evidence, last_readback_sha256: sha256(request.command_body_bytes) } }; if (!await writeState(closed, current)) return block(operation, current, 'RELEASE_STATE_FAILED'); const retainedPointer = pointerValue(await d.state.readPointer({})); if (retainedPointer?.active_change_id !== body.change_id) return block(operation, closed, 'POINTER_CLEAR_FAILED'); const empty = { schema_version: '1.0', active_change_id: null }; const clear = await d.state.writePointer({ expected_sha256: sha256(canonical(retainedPointer)), pointer: empty, value: empty, next_bytes: canonical(empty) }); if (clear?.kind !== 'OK' || pointerValue(await d.state.readPointer({}))?.active_change_id !== null) return block(operation, closed, 'POINTER_CLEAR_FAILED'); return stateResult(operation, 'CLOSED', closed, { squash_sha: body.payload.squash_sha, pointer_cleared: true });
    } finally { await d.mutex.release(); }
  }

  async function run(request) {
    const operation = 'run'; if (!request || typeof request !== 'object' || !Object.hasOwn(request, 'change_id') || !Object.hasOwn(request, 'expected_state_version') || !Object.hasOwn(request, 'expected_state_hash')) return rejected(operation, 'INPUT_INVALID'); const held = await acquire(operation); if (held !== true) return held;
    try {
      const { pointer, state } = await readCurrent(request.change_id); if (!pointer || pointer.active_change_id !== request.change_id || !state) return result(operation, 'BLOCKED', 'BLOCKED', null, null, request.change_id, { blocked_reason: 'DISPATCH_ORPHAN_READY', next_action: 'MANUAL_CONTROLLER_STOP', blocked_event_id: null, local_pause_id: null }); const cas = verifyCas(operation, state, request); if (cas) return cas;
      const persistedStop = await readLocalStop(state, request);
      if (persistedStop.kind === 'OK') return stateResult(operation, 'BLOCKED', state, { blocked_reason: persistedStop.blocked_reason, next_action: persistedStop.value.next_action, blocked_event_id: persistedStop.value.event_id, local_pause_id: persistedStop.value.diagnostic_id });
      if (persistedStop.kind !== 'ABSENT') return stateResult(operation, 'BLOCKED', state, { blocked_reason: 'POINTER_STATE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', blocked_event_id: null, local_pause_id: null });
      if (unpersistedStop?.change_id === state.change_id) return stateResult(operation, 'BLOCKED', state, { blocked_reason: unpersistedStop.blocked_reason, next_action: 'MANUAL_CONTROLLER_STOP', blocked_event_id: unpersistedStop.blocked_event_id, local_pause_id: null });
      if (state.macro_state === 'READY' && !testSeam) { let ledger; try { ledger = await readLedgerRecords(state); } catch { ledger = null; } if (ledger === null || !readyLedgerTuple(state, ledger)) return block(operation, state, 'DISPATCH_ORPHAN_READY'); if (acceptedDispatch === null) return block(operation, state, 'ADMISSION_EVIDENCE_UNAVAILABLE'); if (!await hasReadyDispatchAuthority(state, acceptedDispatch.body, acceptedDispatch, ledger)) return block(operation, state, 'DISPATCH_ORPHAN_READY'); } if (state.macro_state === 'READY' && testSeam) { const admissionReadback = state.macro_state === 'READY' ? await d.ledger.readRemoteAppend(appendReadbackRequest(acceptedDispatch?.admission_readback, { change_id: state.change_id })) : null; if (state.macro_state === 'READY' && (admissionReadback?.kind !== 'OK' || !acceptedDispatch?.admission_readback || canonical(admissionReadback) !== canonical(acceptedDispatch.admission_readback))) return block(operation, state, 'DISPATCH_ORPHAN_READY'); }
      const needsLedgerStopScan = acceptedDispatch === null && state.macro_state !== 'BLOCKED';
      const ledgerRecords = needsLedgerStopScan ? await readLedgerRecords(state) : null;
      const records = ledgerRecords?.records ?? null;
      if (needsLedgerStopScan && records === null) return stateResult(operation, 'BLOCKED', state, { blocked_reason: 'POINTER_STATE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', blocked_event_id: null, local_pause_id: null });
      if (records?.at(-1)?.event_class === 'BLOCKED') {
        const blocked = records.at(-1);
        const cycle = records.filter(record => record.event_class === 'CONTROLLER_COMMAND'
          && record.detail?.command_id === state.authorization_cycle?.command_id
          && record.detail?.command_kind === state.authorization_cycle?.command_kind);
        const failure = records.at(-2);
        const expectedFailure = blocked.detail.blocked_reason === 'REGRESSION_FAILURE'
          ? ['regression-affected-suite', 'REGRESSION', 'AFFECTED_SUITE']
          : blocked.detail.blocked_reason === 'TEST_ASSET_RETIREMENT_FAILURE'
            ? ['regression-test-asset-retirement', 'REGRESSION', 'TEST_ASSET_RETIREMENT'] : null;
        const evidenceMatches = expectedFailure !== null && failure?.event_class === 'VALIDATION_RESULT'
          && failure.sequence + 1 === blocked.sequence && failure.detail?.validation_id === expectedFailure[0]
          && failure.detail.validation_kind === expectedFailure[1] && failure.detail.validation_scope === expectedFailure[2]
          && failure.detail.status === 'COMPLETED' && failure.detail.verdict === 'FAIL'
          && blocked.detail.next_action === 'REVISION' && blocked.detail.evidence_refs.length === 1
          && canonical(blocked.detail.evidence_refs[0]) === canonical({ kind: 'VALIDATION_RESULT', id: failure.event_id, sha256: failure.event_hash, subject_sha: failure.subject_sha });
        const currentSubject = state.candidate?.sha ?? state.repository.baseline_sha;
        const failureMatchesCurrentState = failure?.subject_sha === currentSubject && failure.state_version === state.state_version
          && failure.detail.subject_kind === 'WORKTREE' && failure.detail.subject_sha === currentSubject
          && failure.detail.head_sha === currentSubject && failure.detail.worktree_root === state.repository.worktree_root
          && failure.detail.branch === state.repository.branch && failure.detail.candidate_sha === null
          && failure.detail.candidate_tree === null && failure.detail.validator_head === null;
        const linkedBlocked = cycle.length === 1 && cycle[0].sequence < blocked.sequence
          && records.slice(cycle[0].sequence).every(record => record.event_class !== 'CONTROLLER_COMMAND'
            || !['DISPATCH', 'REVISION'].includes(record.detail?.command_kind))
          && state.last_controller_command_id === state.authorization_cycle?.command_id
          && blocked.state_version === state.state_version && blocked.subject_sha === currentSubject && evidenceMatches && failureMatchesCurrentState;
        if (state.macro_state !== 'BLOCKED') return stateResult(operation, 'BLOCKED', state, { blocked_reason: 'POINTER_STATE_CONFLICT', next_action: 'MANUAL_CONTROLLER_STOP', blocked_event_id: linkedBlocked ? blocked.event_id : null, local_pause_id: null });
      }
      if (state.macro_state === 'BLOCKED') return stateResult(operation, 'BLOCKED', state, { blocked_reason: state.blocked_reason, next_action: ['VALIDATOR_SECOND_FAIL', 'WORKER_GREEN_FAILURE'].includes(state.blocked_reason) ? 'REVISION' : 'MANUAL_CONTROLLER_STOP', blocked_event_id: null, local_pause_id: null }); if (state.macro_state === 'CLOSED') return stateResult(operation, 'CLOSED', state, { squash_sha: state.candidate?.sha ?? null, pointer_cleared: false });
      const admission = acceptedDispatch?.body;
      const admitted = admission && admission.change_id === state.change_id && acceptedDispatch.body_sha256 === state.admission.body_sha256 && validCommand(admission);
      const resumedStage = acceptedDispatch === null && state.macro_state === 'DELIVERING' && state.phase === 'STAGE';
      if (!admitted && !resumedStage) return block(operation, state, 'ADMISSION_EVIDENCE_UNAVAILABLE');
      if (state.pending_agent) {
        if (state.pending_agent.started === true) return stateResult(operation, 'WAITING', state, { waiting_for: 'AGENT_SETTLEMENT', pending_correlation_id: state.pending_agent.correlation_id });
        const action = { ...settlementBindingForLedger(state.pending_agent), action_kind: 'LAUNCH_AGENT' };
        return stateResult(operation, 'AGENT_ACTION', state, { action });
      }
      const role = route(state, admission); if (role) { const actionState = { ...state, macro_state: state.macro_state === 'READY' ? 'EXECUTING' : state.macro_state, phase: state.phase === 'WORKTREE' ? 'SPEC' : state.phase }; const recordNotStarted = async () => { const { action_kind, correlation_id, ...binding } = actionFor(actionState, role, d.ids); return append(state, 'AGENT_RUN', { ...binding, stage: 'NOT_STARTED', evaluation_id: d.ids.next('agent-evaluation'), reason_code: 'PRECONDITION_FAILED' }); }; let worktreeEvidence = state.evidence?.worktree ?? null; if (state.macro_state === 'READY' && state.phase === 'WORKTREE') { const created = await d.git.createOrReuseWorktree({ worktree_root: state.repository.worktree_root, branch: state.repository.branch, baseline_sha: state.repository.baseline_sha }); if (created?.kind !== 'OK' || created.value?.worktree_root !== state.repository.worktree_root || created.value?.branch !== state.repository.branch || created.value?.baseline_sha !== state.repository.baseline_sha || created.value?.clean !== true || typeof created.value?.common_git_dir !== 'string') { const event = await recordNotStarted(); return event?.kind === 'OK' ? block(operation, state, 'WORKTREE_CREATE_FAILED') : unpersistedBlock(operation, state, 'LEDGER_APPEND_AMBIGUOUS'); } const inspected = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch, expected_head: state.repository.baseline_sha }); if (inspected?.kind !== 'OK' || inspected.value?.worktree_root !== state.repository.worktree_root || inspected.value?.branch !== state.repository.branch || inspected.value?.head_sha !== state.repository.baseline_sha || inspected.value?.clean !== true || inspected.value?.common_git_dir !== created.value.common_git_dir) { const event = await recordNotStarted(); return event?.kind === 'OK' ? block(operation, state, 'WORKTREE_DIRTY_CONFLICT') : unpersistedBlock(operation, state, 'LEDGER_APPEND_AMBIGUOUS'); } worktreeEvidence = inspected.value; } const requestState = { ...actionState, evidence: worktreeEvidence ? { ...state.evidence, worktree: worktreeEvidence } : state.evidence }; const action = actionFor(requestState, role, d.ids); const { action_kind, ...binding } = action; const requested = await append(requestState, 'AGENT_RUN', { ...binding, stage: 'REQUESTED' }); if (requested?.kind !== 'OK') return unpersistedBlock(operation, state, 'LEDGER_APPEND_AMBIGUOUS'); const next = { ...requestState, state_version: state.state_version + 1, pending_agent: { ...binding, request_event_id: requested.value?.event_id ?? 'event-001' } }; if (!await writeState(next, state)) return block(operation, state, 'STATE_WRITE_FAILED'); return stateResult(operation, 'AGENT_ACTION', next, { action }); }
      if (state.macro_state === 'EXECUTING' && state.phase === 'REGRESSION') {
        const purpose = new Map([
          ['regression-affected-suite', ['REGRESSION', 'AFFECTED_SUITE', 'WORKTREE']],
          ['regression-test-asset-retirement', ['REGRESSION', 'TEST_ASSET_RETIREMENT', 'WORKTREE']],
        ]);
        const definitions = ['regression-affected-suite', 'regression-test-asset-retirement'].map(id => {
          const source = admission.payload.validations.find(value => value.id === id); const mapped = purpose.get(id);
          return source && mapped ? { id, validation_kind: mapped[0], validation_scope: mapped[1], subject: mapped[2], argv: source.argv, cwd: source.cwd, environment: source.environment, timeout_ms: source.timeout_ms } : null;
        });
        if (definitions.some(value => value === null)) return block(operation, state, 'EVIDENCE_CONFLICT');
        const cycleHead = state.candidate?.sha ?? state.repository.baseline_sha;
        const inspected = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch, expected_head: cycleHead });
        if (inspected?.kind !== 'OK' || !inspected.value?.common_git_dir) return block(operation, state, 'WORKTREE_DIRTY_CONFLICT');
        const validObservedPath = value => typeof value === 'string' && value.length > 0 && Buffer.from(value, 'utf8').toString('utf8') === value && !value.startsWith('/') && !value.includes('\0') && !value.includes('\\') && value.split('/').every(part => part && part !== '.' && part !== '..');
        const validObservedEntry = value => value && typeof value === 'object' && Object.keys(value).length === 4 && validObservedPath(value.path) && ['MODIFIED', 'DELETED', 'TYPE_CHANGED', 'UNTRACKED'].includes(value.status) && value.mode === null && value.object_sha === null;
        if (!Array.isArray(inspected.value.status_entries) || !inspected.value.status_entries.every(validObservedEntry)) return block(operation, state, 'WORKTREE_DIRTY_CONFLICT');
        const matchesScope = (rule, value) => rule.endsWith('/**') ? value.startsWith(rule.slice(0, -2)) : value === rule;
        if (inspected.value.status_entries.some(value => !admission.scope.allowed_paths.some(rule => matchesScope(rule, value.path)) || admission.scope.forbidden_paths.some(rule => matchesScope(rule, value.path)))) return block(operation, state, 'WORKTREE_DIRTY_CONFLICT');
        const subject = { kind: 'WORKTREE', repository_root: admission.repository.canonical_root, worktree_root: state.repository.worktree_root, branch: state.repository.branch, head_sha: cycleHead, common_git_dir: inspected.value.common_git_dir, allowed_paths: admission.scope.allowed_paths, forbidden_paths: admission.scope.forbidden_paths };
        const receipts = [];
        const refs = [];
        for (const definition of definitions) {
          const check = await d.validation.execute({ definition, subject });
          if (!validWorktreeReceipt(check?.value, check?.receipt_sha256, definition, subject)) return block(operation, state, 'EVIDENCE_CONFLICT');
          const appended = await append(state, 'VALIDATION_RESULT', check.value);
          if (appended?.kind !== 'OK') {
            if (appended?.kind === 'EVIDENCE_CONFLICT') return appendFailureStop(operation, state, request, appended);
            if (appended?.kind === 'UNAVAILABLE') return localPause(operation, state, request, 'EVIDENCE_REF_UNAVAILABLE', 'IDENTICAL_COMMAND_REPLAY');
            if (appended?.kind === 'AMBIGUOUS') return localPause(operation, state, request, 'LEDGER_APPEND_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', 'EVIDENCE_REF_CONFLICT');
            return unpersistedBlock(operation, state, 'LEDGER_APPEND_AMBIGUOUS');
          }
          receipts.push(check.value);
          refs.push({ kind: 'VALIDATION_RESULT', id: appended.value.event_id, sha256: appended.value.event_hash, subject_sha: check.value.subject_sha });
          if (check.value.verdict !== 'PASS') return durableBlock(operation, state, definition.id === 'regression-affected-suite' ? 'REGRESSION_FAILURE' : 'TEST_ASSET_RETIREMENT_FAILURE', 'REVISION', [refs.at(-1)], request);
        }
        if ((state.authorization_cycle.auto_repair_attempt === 1 && !isHash(state.evidence?.repair_worker_snapshot_sha256))
          || receipts[0].worktree_snapshot_sha256 !== receipts[1].worktree_snapshot_sha256
          || (isHash(state.evidence?.repair_worker_snapshot_sha256) && receipts[0].worktree_snapshot_sha256 !== state.evidence.repair_worker_snapshot_sha256)) return durableBlock(operation, state, 'WORKTREE_DIRTY_CONFLICT', 'MANUAL_CONTROLLER_STOP', refs, request);
        const next = { ...state, macro_state: 'DELIVERING', phase: 'STAGE', state_version: state.state_version + 1, evidence: { ...state.evidence, worktree: inspected.value, regression_subject: subject, regression_receipts: receipts } };
        if (!await writeState(next, state)) return block(operation, state, 'STATE_WRITE_FAILED');
        return stateResult(operation, 'ADVANCED', next, { from_state: 'EXECUTING', from_phase: 'REGRESSION', to_state: 'DELIVERING', to_phase: 'STAGE', operation_receipt_sha256: receipt(next) });
      }
      if (state.macro_state === 'DELIVERING') {
        if (state.phase === 'STAGE') {
          const subject = state.evidence?.regression_subject; const receipts = state.evidence?.regression_receipts;
          const stageStop = reason => durableBlock(operation, state, reason, 'MANUAL_CONTROLLER_STOP', [], request);
          if (!subject || !Array.isArray(receipts) || receipts.length !== 2 || (state.authorization_cycle.auto_repair_attempt === 1 && !isHash(state.evidence?.repair_worker_snapshot_sha256)) || receipts[0].worktree_snapshot_sha256 !== receipts[1].worktree_snapshot_sha256
            || (isHash(state.evidence?.repair_worker_snapshot_sha256) && receipts[0].worktree_snapshot_sha256 !== state.evidence.repair_worker_snapshot_sha256)) return stageStop('CANDIDATE_COMMIT_AMBIGUOUS');
          const canonical_root = admitted ? admission.repository.canonical_root : subject.repository_root;
          const allowed_paths = admitted ? admission.scope.allowed_paths : subject.allowed_paths;
          const forbidden_paths = admitted ? admission.scope.forbidden_paths : subject.forbidden_paths;
          const remote = await d.ledger.readRemote({ remote_ref: 'refs/heads/evidence/agent-runs', expected_tip: null, change_id: state.change_id });
          if (remote?.kind !== 'OK' || typeof remote.value?.ledger_bytes_base64 !== 'string') return localPause(operation, state, request, 'EVIDENCE_REF_UNAVAILABLE', 'MANUAL_CONTROLLER_STOP');
          let confirmedReceipts = false;
          try {
            const bytes = Buffer.from(remote.value.ledger_bytes_base64, 'base64');
            if (bytes.toString('base64') !== remote.value.ledger_bytes_base64 || bytes.at(-1) !== 0x0a || sha256(bytes) !== remote.value.prior_bytes_sha256 || bytes.length !== remote.value.prior_byte_length) throw new Error('ledger bytes');
            const lines = bytes.subarray(0, -1).toString('utf8').split('\n');
            const records = lines.map(line => {
              const record = JSON.parse(line);
              const { event_hash, ...preimage } = record;
              if (`${canonical(record)}\n` !== `${line}\n` || event_hash !== sha256(canonical(preimage))) throw new Error('noncanonical record');
              return record;
            });
            for (const [index, record] of records.entries()) {
              if (record.sequence !== index + 1 || record.change_id !== state.change_id || !isSha(record.subject_sha) || !isHash(record.event_hash)
                || (record.detail?.idempotency_id !== undefined && record.idempotency_id !== record.detail.idempotency_id)) throw new Error('ledger authority');
            }
            const last = records.at(-1);
            if (remote.value.last_sequence !== (last?.sequence ?? 0) || remote.value.last_event_id !== (last?.event_id ?? null) || remote.value.last_event_hash !== (last?.event_hash ?? null)) throw new Error('ledger tip');
            const receiptPositions = receipts.map(receipt => records.reduce((matches, record, index) => record.event_class === 'VALIDATION_RESULT' && record.idempotency_id === receipt.idempotency_id && canonical(record.detail) === canonical(receipt) && record.change_id === state.change_id && record.state_version === state.state_version - 1 && record.subject_sha === subject.head_sha ? [...matches, index] : matches, []));
            confirmedReceipts = receiptPositions.every(matches => matches.length === 1) && receiptPositions[1][0] === receiptPositions[0][0] + 1;
          } catch {}
          if (!confirmedReceipts) return localPause(operation, state, request, 'EVIDENCE_REF_UNAVAILABLE', 'MANUAL_CONTROLLER_STOP');
          let inspected;
          try { inspected = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch, expected_head: subject.head_sha }); } catch { return stageStop(resumedStage ? 'CANDIDATE_COMMIT_AMBIGUOUS' : 'WORKTREE_DIRTY_CONFLICT'); }
          if (inspected?.kind !== 'OK' || inspected.value?.clean === true || inspected.value?.common_git_dir !== subject.common_git_dir) return stageStop(resumedStage ? 'CANDIDATE_COMMIT_AMBIGUOUS' : 'WORKTREE_DIRTY_CONFLICT');
          const statusEntries = inspected.value.status_entries;
          const validStatusEntry = value => value && typeof value === 'object' && Object.keys(value).length === 4
            && typeof value.path === 'string' && value.path.length > 0 && Buffer.from(value.path, 'utf8').toString('utf8') === value.path && !value.path.startsWith('/') && !value.path.includes('\0') && !value.path.includes('\\')
            && value.path.split('/').every(part => part && part !== '.' && part !== '..')
            && ['MODIFIED', 'DELETED', 'TYPE_CHANGED', 'UNTRACKED'].includes(value.status)
            && value.mode === null && value.object_sha === null;
          if (!Array.isArray(statusEntries) || !statusEntries.every(validStatusEntry)) return stageStop('WORKTREE_DIRTY_CONFLICT');
          const actualPaths = statusEntries.map(value => value.path).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
          if (!actualPaths.length || actualPaths.some(value => !allowed_paths.some(rule => rule.endsWith('/**') ? value.startsWith(rule.slice(0, -2)) : value === rule) || forbidden_paths.some(rule => rule.endsWith('/**') ? value.startsWith(rule.slice(0, -2)) : value === rule))) return stageStop('WORKTREE_DIRTY_CONFLICT');
          const stageRequest = { canonical_root, subject, expected_worktree_snapshot_sha256: receipts[1].worktree_snapshot_sha256, paths: actualPaths };
          let staged; let read;
          try {
            staged = await d.git.stageExact(stageRequest);
            read = await d.git.readStaged({ canonical_root, worktree_root: state.repository.worktree_root });
          } catch {
            return stageStop('WORKTREE_DIRTY_CONFLICT');
          }
          const completeIndex = value => value && Array.isArray(value.staged_paths) && isSha(value.index_tree) && isHash(value.staged_paths_sha256);
          if (staged?.kind !== 'OK' || read?.kind !== 'OK' || !completeIndex(staged.value) || !completeIndex(read.value) || canonical(staged.value) !== canonical(read.value)) return stageStop('WORKTREE_DIRTY_CONFLICT');
          const expected_parent = subject.head_sha; const message = `JuanerAI Candidate\n\nJuanerAI-Idempotency-ID: candidate-${sha256(canonical({ schema_version: '1.0', change_id: state.change_id, authorization_cycle_command_id: state.authorization_cycle.command_id, expected_parent, expected_tree: staged.value.index_tree }))}\n`;
          let parent; try { parent = await d.git.readCommit({ canonical_root, sha: expected_parent }); } catch { return stageStop('CANDIDATE_COMMIT_AMBIGUOUS'); }
          if (parent?.kind !== 'OK' || parent.value?.sha !== expected_parent || parent.value?.branch !== state.repository.branch || parent.value?.tree === staged.value.index_tree) return stageStop('WORKTREE_DIRTY_CONFLICT');
          const idempotency_id = `candidate-${sha256(canonical({ schema_version: '1.0', change_id: state.change_id, authorization_cycle_command_id: state.authorization_cycle.command_id, expected_parent, expected_tree: staged.value.index_tree }))}`;
          let committed; try { committed = await d.git.commitCandidate({ canonical_root, worktree_root: state.repository.worktree_root, expected_parent, expected_tree: staged.value.index_tree, message_bytes: new TextEncoder().encode(message), idempotency_id }); } catch { return stageStop('CANDIDATE_COMMIT_AMBIGUOUS'); }
          if (committed?.kind === 'AMBIGUOUS') {
            let observed;
            try { observed = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch }); } catch { return stageStop('CANDIDATE_COMMIT_AMBIGUOUS'); }
            if (observed?.kind !== 'OK' || observed.value?.head_sha === expected_parent || observed.value?.branch !== state.repository.branch) return stageStop('CANDIDATE_COMMIT_AMBIGUOUS');
            try { committed = await d.git.commitCandidate({ canonical_root, worktree_root: state.repository.worktree_root, expected_parent, expected_tree: staged.value.index_tree, message_bytes: new TextEncoder().encode(message), idempotency_id }); } catch { return stageStop('CANDIDATE_COMMIT_AMBIGUOUS'); }
          }
          if (committed?.kind === 'CONFLICT') return stageStop(committed.reason === 'DIRTY_WORKTREE' ? 'WORKTREE_DIRTY_CONFLICT' : 'CANDIDATE_IDENTITY_CONFLICT');
          if (committed?.kind === 'AMBIGUOUS' || committed?.kind === 'UNAVAILABLE') return stageStop('CANDIDATE_COMMIT_AMBIGUOUS');
          if (committed?.kind !== 'OK' || !isSha(committed.value?.sha) || !isSha(committed.value?.parent) || committed.value?.parent !== expected_parent || committed.value?.tree !== staged.value.index_tree || committed.value?.branch !== state.repository.branch) return stageStop('CANDIDATE_IDENTITY_CONFLICT');
          let postCommit; let post; let postIndex;
          try {
            postCommit = await d.git.readCommit({ canonical_root, sha: committed.value.sha });
            post = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch, expected_head: committed.value.sha });
            postIndex = await d.git.readStaged({ canonical_root, worktree_root: state.repository.worktree_root });
          } catch { return stageStop('CANDIDATE_IDENTITY_CONFLICT'); }
          const emptyPaths = [];
          if (postCommit?.kind !== 'OK' || canonical(postCommit.value) !== canonical(committed.value) || post?.kind !== 'OK' || post.value?.worktree_root !== state.repository.worktree_root || post.value?.branch !== state.repository.branch || post.value?.head_sha !== committed.value.sha || post.value?.clean !== true || !Array.isArray(post.value?.status_entries) || post.value.status_entries.length !== 0 || post.value?.common_git_dir !== subject.common_git_dir || postIndex?.kind !== 'OK' || !completeIndex(postIndex.value) || canonical(postIndex.value.staged_paths) !== canonical(emptyPaths) || postIndex.value.staged_paths_sha256 !== sha256(canonical(emptyPaths)) || postIndex.value.index_tree !== staged.value.index_tree) return stageStop('CANDIDATE_IDENTITY_CONFLICT');
          const ledger = await append(state, 'CANDIDATE_COMMITTED', { candidate_sha: committed.value.sha, parent: expected_parent, tree: staged.value.index_tree, branch: state.repository.branch, staged_paths: staged.value.staged_paths, staged_paths_sha256: staged.value.staged_paths_sha256, worktree_snapshot_sha256: receipts[1].worktree_snapshot_sha256 });
          if (ledger?.kind !== 'OK') return localPause(operation, state, request, 'LEDGER_APPEND_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP');
          const next = { ...state, phase: 'FINAL_VALIDATION', state_version: state.state_version + 1, candidate: { ...committed.value, validation_refs: [], validator_head: null, frozen: false } };
          if (!await writeState(next, state)) return localPause(operation, state, request, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP');
          return stateResult(operation, 'ADVANCED', next, { from_state: 'DELIVERING', from_phase: 'STAGE', to_state: 'DELIVERING', to_phase: 'FINAL_VALIDATION', operation_receipt_sha256: receipt(next) });
        }
        if (state.phase === 'CANDIDATE_COMMIT') {
          const expected_parent = state.candidate?.sha ?? state.repository.baseline_sha;
          const receipts = state.evidence?.regression_receipts;
          const staged = await d.git.readStaged({ canonical_root: admission.repository.canonical_root, worktree_root: state.repository.worktree_root });
          if (staged?.kind !== 'OK' || !Array.isArray(staged.value?.staged_paths) || !sortedStrings(staged.value.staged_paths)
            || !isSha(staged.value?.index_tree) || !isHash(staged.value?.staged_paths_sha256)
            || staged.value.staged_paths_sha256 !== sha256(canonical(staged.value.staged_paths))
            || !Array.isArray(receipts) || receipts.length !== 2 || !isHash(receipts[1]?.worktree_snapshot_sha256)
            || receipts[0]?.worktree_snapshot_sha256 !== receipts[1].worktree_snapshot_sha256) return durableBlock(operation, state, 'CANDIDATE_COMMIT_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          const committed = await d.git.commitCandidate({ canonical_root: admission.repository.canonical_root, worktree_root: state.repository.worktree_root, expected_parent, expected_tree: staged.value.index_tree, message_bytes: new TextEncoder().encode('candidate'), idempotency_id: state.admission.idempotency_id });
          if (committed?.kind === 'AMBIGUOUS') {
            await d.git.readCommit({ canonical_root: admission.repository.canonical_root, sha: expected_parent });
            return durableBlock(operation, state, 'CANDIDATE_COMMIT_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          if (committed?.kind !== 'OK' || !isSha(committed.value?.sha) || committed.value.parent !== expected_parent
            || committed.value.tree !== staged.value.index_tree || committed.value.branch !== state.repository.branch) return durableBlock(operation, state, 'CANDIDATE_COMMIT_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          const read = await d.git.readCommit({ canonical_root: admission.repository.canonical_root, sha: committed.value.sha });
          if (read?.kind !== 'OK' || canonical(read.value) !== canonical(committed.value)) return durableBlock(operation, state, 'CANDIDATE_COMMIT_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          const ledger = await append(state, 'CANDIDATE_COMMITTED', {
            candidate_sha: committed.value.sha, parent: expected_parent, tree: staged.value.index_tree, branch: state.repository.branch,
            staged_paths: staged.value.staged_paths, staged_paths_sha256: staged.value.staged_paths_sha256,
            worktree_snapshot_sha256: receipts[1].worktree_snapshot_sha256,
          });
          if (ledger?.kind !== 'OK') return localPause(operation, state, request, 'LEDGER_APPEND_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP');
          const next = { ...state, phase: 'FINAL_VALIDATION', state_version: state.state_version + 1, candidate: { ...committed.value, validation_refs: [], validator_head: null, frozen: false } };
          if (!await writeState(next, state)) return localPause(operation, state, request, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP');
          return stateResult(operation, 'ADVANCED', next, { from_state: 'DELIVERING', from_phase: 'CANDIDATE_COMMIT', to_state: 'DELIVERING', to_phase: 'FINAL_VALIDATION', operation_receipt_sha256: receipt(next) });
        }
        if (state.phase === 'FINAL_VALIDATION') {
          const source = admission?.payload?.validations?.find(value => value.id === 'final-validation-candidate');
          const definition = source && {
            id: source.id, validation_kind: 'FINAL_VALIDATION', validation_scope: 'CANDIDATE', subject: source.subject,
            argv: source.argv, cwd: source.cwd, environment: source.environment, timeout_ms: source.timeout_ms,
          };
          const regressionSubject = state.evidence?.regression_subject;
          const subject = definition && regressionSubject && state.candidate && {
            kind: 'CANDIDATE', repository_root: admission.repository.canonical_root, worktree_root: state.repository.worktree_root,
            branch: state.repository.branch, head_sha: state.candidate.sha, common_git_dir: regressionSubject.common_git_dir,
            allowed_paths: admission.scope.allowed_paths, forbidden_paths: admission.scope.forbidden_paths,
            candidate_sha: state.candidate.sha, candidate_tree: state.candidate.tree,
          };
          if (!definition || !subject || definition.subject !== 'CANDIDATE' || !isSha(subject.candidate_sha) || !isSha(subject.candidate_tree)) return block(operation, state, 'EVIDENCE_CONFLICT');
          let validation;
          try { validation = await d.validation.execute({ definition, subject }); } catch { return block(operation, state, 'EVIDENCE_CONFLICT'); }
          if (validation?.kind !== 'OK' || !validCandidateReceipt(validation.value, validation.receipt_sha256, definition, subject)) return block(operation, state, 'EVIDENCE_CONFLICT');
          const appended = await append(state, 'VALIDATION_RESULT', validation.value);
          if (appended?.kind !== 'OK') {
            if (appended?.kind === 'EVIDENCE_CONFLICT') return appendFailureStop(operation, state, request, appended);
            if (appended?.kind === 'UNAVAILABLE') return localPause(operation, state, request, 'EVIDENCE_REF_UNAVAILABLE', 'IDENTICAL_COMMAND_REPLAY');
            if (appended?.kind === 'AMBIGUOUS') return localPause(operation, state, request, 'LEDGER_APPEND_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', 'EVIDENCE_REF_CONFLICT');
            return unpersistedBlock(operation, state, 'LEDGER_APPEND_AMBIGUOUS');
          }
          const evidence = [{ kind: 'VALIDATION_RESULT', id: appended.value.event_id, sha256: appended.value.event_hash, subject_sha: validation.value.subject_sha }];
          if (validation.value.verdict !== 'PASS') return durableBlock(operation, state, 'FINAL_VALIDATION_FAILURE', 'REVISION', evidence, request);
          const validation_ref = {
            event_id: appended.value.event_id, event_hash: appended.value.event_hash,
            validation_id: validation.value.validation_id, validation_kind: validation.value.validation_kind,
            receipt_sha256: validation.value.receipt_sha256, subject_sha: validation.value.subject_sha,
            candidate_sha: validation.value.candidate_sha, validator_head: validation.value.validator_head,
          };
          const next = { ...state, phase: 'VALIDATOR', state_version: state.state_version + 1, candidate: { ...state.candidate, validation_refs: [validation_ref] } };
          if (!await writeState(next, state)) return block(operation, state, 'STATE_WRITE_FAILED');
          return stateResult(operation, 'ADVANCED', next, { from_state: 'DELIVERING', from_phase: 'FINAL_VALIDATION', to_state: 'DELIVERING', to_phase: 'VALIDATOR', operation_receipt_sha256: receipt(next) });
        }
        if (state.phase === 'BRANCH_PUSH') {
          const canonical_root = admission.repository.canonical_root;
          const expected_remote_head = state.delivery === null ? null : state.delivery?.remote_head;
          const pushRequest = { canonical_root, branch: state.repository.branch,
            candidate_sha: state.candidate?.sha, expected_remote_head, idempotency_id: state.admission.idempotency_id };
          const pushValue = envelope => {
            const value = envelope?.value;
            return closedData(envelope, ['kind', 'value', 'receipt_sha256']) && envelope.kind === 'OK'
              && closedData(value, ['prior_remote_head', 'remote_head', 'forced', 'deleted'])
              && value.prior_remote_head === expected_remote_head && value.remote_head === state.candidate?.sha
              && value.forced === false && value.deleted === false && envelope.receipt_sha256 === sha256(canonical(value)) ? value : null;
          };
          const remoteValue = envelope => {
            const value = envelope?.value;
            return closedData(envelope, ['kind', 'value', 'receipt_sha256']) && envelope.kind === 'OK'
              && closedData(value, ['remote_head']) && isSha(value.remote_head)
              && envelope.receipt_sha256 === sha256(canonical(value)) ? { kind: 'HEAD', value: value.remote_head }
              : closedData(envelope, ['kind', 'reason', 'expected_identity']) && envelope.kind === 'ABSENT'
                && envelope.reason === 'EXPECTED_IDENTITY_ABSENT'
                && closedData(envelope.expected_identity, ['canonical_root', 'origin', 'branch'])
                && envelope.expected_identity.canonical_root === canonical_root && envelope.expected_identity.origin === 'origin'
                && envelope.expected_identity.branch === state.repository.branch ? { kind: 'ABSENT' } : { kind: 'UNKNOWN' };
          };
          let pushed = await d.git.pushBranch(pushRequest);
          let published = pushValue(pushed);
          let remoteHead = null;
          if (pushed?.kind === 'AMBIGUOUS') {
            const observed = remoteValue(await d.git.readRemoteBranch({ canonical_root, origin: 'origin', branch: state.repository.branch }));
            remoteHead = observed.kind === 'HEAD' ? observed.value : null;
            if (remoteHead === state.candidate?.sha) {
              published = { prior_remote_head: expected_remote_head, remote_head: remoteHead, forced: false, deleted: false };
            } else if ((observed.kind === 'ABSENT' && expected_remote_head === null) || (observed.kind === 'HEAD' && remoteHead === expected_remote_head)) {
              pushed = await d.git.pushBranch(pushRequest);
              published = pushValue(pushed);
              const retryObserved = remoteValue(await d.git.readRemoteBranch({ canonical_root, origin: 'origin', branch: state.repository.branch }));
              remoteHead = retryObserved.kind === 'HEAD' ? retryObserved.value : null;
              if (!published && pushed?.kind === 'AMBIGUOUS' && remoteHead === state.candidate?.sha) {
                published = { prior_remote_head: expected_remote_head, remote_head: remoteHead, forced: false, deleted: false };
              }
            }
          } else if (published) {
            const observed = remoteValue(await d.git.readRemoteBranch({ canonical_root, origin: 'origin', branch: state.repository.branch }));
            remoteHead = observed.kind === 'HEAD' ? observed.value : null;
          }
          if (!published || remoteHead !== state.candidate?.sha) return durableBlock(operation, state, 'BRANCH_PUSH_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          const ledger = await append(state, 'BRANCH_PUSHED', { candidate_sha: state.candidate?.sha, prior_remote_head: expected_remote_head, remote_head: remoteHead, validator_head: state.candidate?.validator_head, freeze_status: state.candidate?.frozen === true ? 'FROZEN' : 'NOT_FROZEN' });
          if (ledger?.kind !== 'OK') return appendFailureStop(operation, state, request, ledger);
          const next = { ...state, phase: 'CANDIDATE_FREEZE', state_version: state.state_version + 1, delivery: { ...(state.delivery ?? {}), remote_head: remoteHead } };
          if (!await writeState(next, state)) return durableBlock(operation, state, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', [{ kind: 'BRANCH_PUSHED', id: ledger.value.event_id, sha256: ledger.value.event_hash, subject_sha: state.candidate.sha }], request);
          return stateResult(operation, 'ADVANCED', next, { from_state: 'DELIVERING', from_phase: 'BRANCH_PUSH', to_state: 'DELIVERING', to_phase: 'CANDIDATE_FREEZE', operation_receipt_sha256: receipt(next) });
        }
        if (state.phase === 'CANDIDATE_FREEZE') {
          const canonical_root = admission.repository.canonical_root;
          const common_git_dir = state.evidence?.worktree?.common_git_dir;
          const local = await d.git.readCommit({ canonical_root, sha: state.candidate?.sha });
          const worktree = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch, expected_head: state.candidate?.sha });
          const remote = await d.git.readRemoteBranch({ canonical_root, origin: 'origin', branch: state.repository.branch });
          const remoteHead = remote?.value?.head_sha ?? remote?.value?.remote_head;
          if (local?.kind !== 'OK' || local.value?.sha !== state.candidate?.sha || local.value?.tree !== state.candidate?.tree
            || local.value?.branch !== state.repository.branch || worktree?.kind !== 'OK'
            || worktree.value?.worktree_root !== state.repository.worktree_root || worktree.value?.branch !== state.repository.branch
            || worktree.value?.head_sha !== state.candidate?.sha || worktree.value?.common_git_dir !== common_git_dir
            || worktree.value?.clean !== true || !closedArray(worktree.value?.status_entries) || worktree.value.status_entries.length !== 0
            || remote?.kind !== 'OK' || remoteHead !== state.candidate?.sha || state.delivery?.remote_head !== state.candidate?.sha
            || state.candidate?.validator_head !== state.candidate?.sha) return durableBlock(operation, state, 'CANDIDATE_IDENTITY_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
          const diffRequest = { canonical_root, common_git_dir, worktree_root: state.repository.worktree_root, baseline_sha: state.repository.baseline_sha, candidate_sha: state.candidate.sha };
          const diff = await d.git.canonicalDiff(diffRequest);
          const qualifiedDiff = qualifyCanonicalDiff(diff, diffRequest);
          if (!qualifiedDiff) return durableBlock(operation, state, 'CANDIDATE_IDENTITY_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
          const identity = deliveryIdentity(state, qualifiedDiff);
          const candidate = { ...state.candidate, frozen: true };
          const next = { ...state, phase: 'PR', state_version: state.state_version + 1, candidate,
            delivery: { ...(state.delivery ?? {}), canonical_diff_sha256: qualifiedDiff.stdout_sha256, delivery_id: identity.delivery_id } };
          if (!await writeState(next, state)) return durableBlock(operation, state, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', [], request);
          return stateResult(operation, 'ADVANCED', next, { from_state: 'DELIVERING', from_phase: 'CANDIDATE_FREEZE', to_state: 'DELIVERING', to_phase: 'PR', operation_receipt_sha256: receipt(next) });
        }
        if (state.phase === 'PR') {
          const prior = state.delivery?.pull_request ?? null;
          const repository = admission.repository.repository_id;
          const queryRequest = { repository, base: 'main', head_branch: state.repository.branch };
          const definiteAbsence = envelope => closedData(envelope, ['kind', 'reason', 'expected_identity'])
            && envelope.kind === 'ABSENT' && envelope.reason === 'EXPECTED_IDENTITY_ABSENT';
          let pr = await d.pull_request.queryCurrent(queryRequest);
          if (definiteAbsence(pr) && !prior) {
            const createRequest = { ...queryRequest, head_sha: state.candidate?.sha, idempotency_id: state.delivery?.delivery_id };
            pr = await d.pull_request.createOrReuse(createRequest);
            if (pr?.kind === 'AMBIGUOUS') {
              pr = await d.pull_request.queryCurrent(queryRequest);
              if (definiteAbsence(pr)) {
                pr = await d.pull_request.createOrReuse(createRequest);
                if (pr?.kind === 'AMBIGUOUS') pr = await d.pull_request.queryCurrent(queryRequest);
              }
            }
          }
          if (!validPr(pr, repository, state.repository.branch, state.candidate?.sha)
            || (prior && canonical(pr.value) !== canonical({ ...prior, review_ready: true }))) return durableBlock(operation, state, 'FINAL_HANDOFF_PR_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          const read = await d.pull_request.readback({ number: pr.value.number, expected_head: state.candidate.sha });
          if (!validPr(read, repository, state.repository.branch, state.candidate.sha)
            || canonical(read.value) !== canonical(pr.value)) return durableBlock(operation, state, 'FINAL_HANDOFF_PR_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          const { review_ready, ...pull_request } = read.value;
          const next = { ...state, phase: 'HANDOFF', state_version: state.state_version + 1,
            delivery: { ...(state.delivery ?? {}), pull_request } };
          if (!await writeState(next, state)) return durableBlock(operation, state, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', [], request);
          return stateResult(operation, 'ADVANCED', next, { from_state: 'DELIVERING', from_phase: 'PR', to_state: 'DELIVERING', to_phase: 'HANDOFF', operation_receipt_sha256: receipt(next) });
        }
        if (state.phase === 'HANDOFF') {
          const canonical_root = admission.repository.canonical_root;
          const common_git_dir = state.evidence?.worktree?.common_git_dir;
          let local; let worktree; let remote;
          try {
            local = await d.git.readCommit({ canonical_root, sha: state.candidate?.sha });
            worktree = await d.git.inspectWorktree({ worktree_root: state.repository.worktree_root, expected_branch: state.repository.branch, expected_head: state.candidate?.sha });
            remote = await d.git.readRemoteBranch({ canonical_root, origin: 'origin', branch: state.repository.branch });
          } catch { return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request); }
          const remoteHead = remote?.value?.head_sha ?? remote?.value?.remote_head;
          if (local?.kind !== 'OK' || local.value?.sha !== state.candidate?.sha || local.value?.tree !== state.candidate?.tree
            || local.value?.branch !== state.repository.branch || worktree?.kind !== 'OK'
            || worktree.value?.worktree_root !== state.repository.worktree_root || worktree.value?.branch !== state.repository.branch
            || worktree.value?.head_sha !== state.candidate?.sha || worktree.value?.common_git_dir !== common_git_dir
            || worktree.value?.clean !== true || !closedArray(worktree.value?.status_entries) || worktree.value.status_entries.length !== 0
            || remote?.kind !== 'OK' || remoteHead !== state.candidate?.sha || state.delivery?.remote_head !== state.candidate?.sha
            || state.candidate?.validator_head !== state.candidate?.sha || state.candidate?.frozen !== true) {
            return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          const diffRequest = { canonical_root, common_git_dir, worktree_root: state.repository.worktree_root, baseline_sha: state.repository.baseline_sha, candidate_sha: state.candidate.sha };
          let diff;
          try { diff = await d.git.canonicalDiff(diffRequest); } catch { return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request); }
          const qualifiedDiff = qualifyCanonicalDiff(diff, diffRequest);
          if (!qualifiedDiff || qualifiedDiff.stdout_sha256 !== state.delivery?.canonical_diff_sha256) {
            return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          const identity = deliveryIdentity(state, qualifiedDiff);
          if (!/^delivery-[0-9a-f]{64}$/.test(state.delivery?.delivery_id ?? '') || identity.delivery_id !== state.delivery.delivery_id) {
            return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          const selected = await handoffEvidenceFromRemote(state);
          if (selected?.kind !== 'OK') {
            if (selected?.kind === 'UNAVAILABLE' || selected?.kind === 'AMBIGUOUS') return appendFailureStop(operation, state, request, selected);
            if (selected?.kind === 'DURABLE_CONFLICT') return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
            return appendFailureStop(operation, state, request, selected);
          }
          const artifact = selected.value.validator_artifact;
          const pull_request = state.delivery?.pull_request;
          if (!closedData(pull_request, ['number', 'url', 'base', 'head_branch', 'head_sha'])
            || !Number.isSafeInteger(pull_request.number) || pull_request.number <= 0 || !utf8Text(pull_request.url) || pull_request.url.length === 0
            || pull_request.base !== 'main' || pull_request.head_branch !== state.repository.branch || pull_request.head_sha !== state.candidate.sha) {
            return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          const handoffDocument = {
            schema_version: '1.0', change_id: state.change_id, baseline_sha: state.repository.baseline_sha,
            candidate_sha: state.candidate.sha, candidate_tree: state.candidate.tree, branch: state.repository.branch,
            remote_head: state.delivery.remote_head, changed_paths: clone(qualifiedDiff.changed_paths),
            canonical_diff_sha256: qualifiedDiff.stdout_sha256, canonical_diff_contract_id: 'JUANERAI_GIT_DIFF_V1',
            validation_receipts: clone(selected.value.validation_receipts), validator_verdict: artifact.verdict,
            validator_head: artifact.validator_head, ledger_refs: clone(selected.value.ledger_refs), pull_request: clone(pull_request),
            delivery_id: identity.delivery_id, idempotency_id: identity.delivery_id,
            risks: clone(artifact.risks), unverified: clone(artifact.unverified), open_questions: clone(artifact.open_questions),
          };
          const handoff_bytes = Buffer.from(canonical(handoffDocument)); const expected = sha256(handoff_bytes);
          const handoffRequest = { expected_sha256: expected, handoff_bytes };
          let handoff;
          try { handoff = await d.handoff.writeReadback(handoffRequest); } catch {
            return durableBlock(operation, state, 'FINAL_HANDOFF_PR_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          const exactHandoffAbsence = closedData(handoff, ['kind', 'reason', 'expected_identity'])
            && handoff.kind === 'ABSENT' && handoff.reason === 'EXPECTED_IDENTITY_ABSENT'
            && closedData(handoff.expected_identity, ['expected_sha256']) && handoff.expected_identity.expected_sha256 === expected;
          if (exactHandoffAbsence) {
            try { handoff = await d.handoff.writeReadback(handoffRequest); } catch {
              return durableBlock(operation, state, 'FINAL_HANDOFF_PR_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
            }
          }
          if (handoff?.kind !== 'OK' || !closedData(handoff, ['kind', 'value', 'receipt_sha256'])
            || !closedData(handoff.value, ['handoff_sha256', 'delivery_id']) || handoff.value.handoff_sha256 !== expected
            || handoff.value.delivery_id !== identity.delivery_id || handoff.receipt_sha256 !== sha256(canonical(handoff.value))) {
            return durableBlock(operation, state, 'FINAL_HANDOFF_PR_AMBIGUOUS', 'MANUAL_CONTROLLER_STOP', [], request);
          }
          const next = { ...state, macro_state: 'AWAITING_CONTROLLER', phase: null, state_version: state.state_version + 1,
            delivery: { ...state.delivery, handoff_sha256: handoff.value.handoff_sha256, delivery_id: handoff.value.delivery_id } };
          const ledger = await append(next, 'HANDOFF_READY', {
            handoff_sha256: handoff.value.handoff_sha256, candidate_sha: state.candidate.sha,
            pr_number: pull_request.number, pr_head: pull_request.head_sha, delivery_id: handoff.value.delivery_id,
          });
          if (ledger?.kind !== 'OK') return appendFailureStop(operation, state, request, ledger);
          if (!await writeState(next, state)) return localPause(operation, state, request, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', 'STATE_WRITE_FAILED', ledger);
          return stateResult(operation, 'AWAITING_CONTROLLER', next, {
            candidate_sha: state.candidate.sha, remote_head: next.delivery.remote_head, validator_head: state.candidate.validator_head,
            pr_number: pull_request.number, pr_head: pull_request.head_sha, handoff_sha256: next.delivery.handoff_sha256,
          });
        }
      }
      return stateResult(operation, 'WAITING', state, { waiting_for: 'CONTROLLER_COMMAND', pending_correlation_id: null });
    } finally { await d.mutex.release(); }
  }

  async function settlement(request) {
    const operation = 'settlement';
    if (!exact(request, ['change_id', 'expected_state_version', 'expected_state_hash', 'settlement'])) return rejected(operation, 'INPUT_INVALID');
    const held = await acquire(operation); if (held !== true) return held;
    try {
      const { state } = await readCurrent(request.change_id);
      const pending = state?.pending_agent; const s = request.settlement;
      if (!state || !pending || !s || typeof s !== 'object' || Array.isArray(s) || !boundedControl(pending) || !boundedControl(s)) return rejected(operation, 'SETTLEMENT_INVALID', request.change_id);
      const cas = verifyCas(operation, state, request); if (cas) return cas;
      const binding = Object.keys(settlementBindingForLedger(pending));
      const sameBinding = binding.filter(key => key !== 'subject_sha').every(key => canonical(s[key]) === canonical(pending[key]));
      const shape = keys => exact(s, [...binding, ...keys]);
      const validStarted = shape(['stage', 'observed_child_id']) && s.stage === 'STARTED' && typeof s.observed_child_id === 'string';
      const validatorArtifact = state.phase === 'VALIDATOR'
        && validValidatorArtifact(s.validator_artifact, state, s.artifact_sha256, s.status, acceptedDispatch?.body?.scope);
      const validatorResultShape = state.phase === 'VALIDATOR'
        && shape(['stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', 'validator_artifact'])
        && s.stage === 'RESULT' && typeof s.observed_child_id === 'string' && ['PASS', 'FAIL'].includes(s.status)
        && typeof s.artifact_path === 'string' && isHash(s.artifact_sha256);
      const expectsRepairDelivery = state.phase === 'WORKER_GREEN' && Object.hasOwn(pending, 'repair_proof');
      const repairDelivery = expectsRepairDelivery
        && validRepairProofBinding(pending.repair_proof)
        && closedData(s.repair_delivery, ['schema_version', 'kind', 'repair_proof', 'post_worker_worktree_snapshot_sha256'])
        && s.repair_delivery.schema_version === '1.0' && s.repair_delivery.kind === 'REPAIR_WORKER_DELIVERY'
        && canonical(s.repair_delivery.repair_proof) === canonical(pending.repair_proof)
        && isHash(s.repair_delivery.post_worker_worktree_snapshot_sha256);
      const expectsRepairTest = state.phase === 'TEST_RED' && Object.hasOwn(pending, 'repair_evidence');
      const testRoleAllowedPaths = acceptedDispatch?.body?.payload?.roles?.find(item => item.role === 'juaner_test')?.allowed_paths;
      const repairTestFilesInScope = value => validRepairProofSummary(value) && Array.isArray(pending.allowed_paths) && Array.isArray(testRoleAllowedPaths)
        && value.test_files.every(file => pending.allowed_paths.some(rule => matchesScope(rule, file.path))
          && testRoleAllowedPaths.some(rule => matchesScope(rule, file.path))
          && acceptedDispatch.body.scope.allowed_paths.some(rule => matchesScope(rule, file.path))
          && !acceptedDispatch.body.scope.forbidden_paths.some(rule => matchesScope(rule, file.path))
          && !acceptedDispatch.body.payload.roles.find(item => item.role === 'juaner_worker')?.allowed_paths?.some(rule => matchesScope(rule, file.path)));
      const repairTestResult = expectsRepairTest
        && s.status === 'PASS' && s.artifact_path === `/private/var/run/juanerai/repair-proof-results/${pending.correlation_id}.json`
        && repairTestFilesInScope(s.repair_proof)
        && s.repair_proof.execution_content_sha256 === sha256(canonical({ schema_version: '1.0', candidate_sha: state.candidate?.sha, candidate_tree: state.candidate?.tree, test_files: s.repair_proof.test_files }));
      const knownArtifactClassification = artifact => artifact && typeof artifact === 'object' && Array.isArray(artifact.findings)
        && artifact.findings.every(finding => ['IMPLEMENTATION_IN_SCOPE', 'CONTRACT', 'ARCHITECTURE', 'SCOPE', 'PATH', 'DEPENDENCY', 'PERMISSION', 'HOST', 'IDENTITY', 'EVIDENCE', 'UNKNOWN'].includes(finding?.classification));
      const validResult = (state.phase === 'VALIDATOR'
        ? validatorArtifact && shape(['stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', 'validator_artifact'])
        : expectsRepairTest
          ? shape(['stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', 'repair_proof'])
            && repairTestResult
        : expectsRepairDelivery
          ? shape(['stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256', 'repair_delivery'])
            && repairDelivery
          : shape(['stage', 'observed_child_id', 'status', 'artifact_path', 'artifact_sha256']))
        && s.stage === 'RESULT' && typeof s.observed_child_id === 'string' && ['PASS', 'FAIL'].includes(s.status) && typeof s.artifact_path === 'string' && isHash(s.artifact_sha256);
      const validStartFailed = shape(['stage', 'failure_code']) && s.stage === 'START_FAILED' && ['SPAWN_REJECTED', 'ROUTE_UNAVAILABLE', 'SANDBOX_UNAVAILABLE', 'START_TIMEOUT'].includes(s.failure_code);
      const validInterrupted = shape(['stage', 'observed_child_id', 'reason_code']) && s.stage === 'INTERRUPTED' && (typeof s.observed_child_id === 'string' || s.observed_child_id === null) && ['USER_INTERRUPTED', 'HOST_INTERRUPTED', 'AGENT_EXITED', 'RESULT_UNREADABLE'].includes(s.reason_code);
      if (!sameBinding || !(validStarted || validResult || validStartFailed || validInterrupted)
        || ((validStarted || validStartFailed) && s.subject_sha !== pending.subject_sha)) {
        if (sameBinding && validatorResultShape && knownArtifactClassification(s.validator_artifact)) return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [], request);
        return rejected(operation, 'SETTLEMENT_INVALID', request.change_id);
      }
      if (validStarted) { const event = await append(state, 'AGENT_RUN', { ...settlementBindingForLedger(pending), stage: 'STARTED', observed_child_id: s.observed_child_id }); if (event?.kind !== 'OK') return appendFailureStop(operation, state, request, event); const next = { ...state, state_version: state.state_version + 1, pending_agent: { ...pending, observed_child_id: s.observed_child_id, started: true } }; if (!boundedControl(next.pending_agent) || !await writeState(next, state)) return durableBlock(operation, state, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', [{ kind: 'AGENT_RUN', id: event.value.event_id, sha256: event.value.event_hash, subject_sha: state.candidate?.sha ?? state.repository.baseline_sha }], request); return stateResult(operation, 'WAITING', next, { waiting_for: 'AGENT_SETTLEMENT', pending_correlation_id: pending.correlation_id }); }
      if (validStartFailed || validInterrupted) { const event = await append(state, 'AGENT_RUN', validStartFailed ? { ...s, observed_child_id: null } : s); if (event?.kind !== 'OK') return appendFailureStop(operation, state, request, event); return durableBlock(operation, state, validStartFailed ? 'AGENT_START_FAILED' : 'AGENT_INTERRUPTED', 'MANUAL_CONTROLLER_STOP', [{ kind: 'AGENT_RUN', id: event.value.event_id, sha256: event.value.event_hash, subject_sha: state.candidate?.sha ?? state.repository.baseline_sha }], request); }
      if (!pending.started || pending.observed_child_id !== s.observed_child_id) return rejected(operation, 'SETTLEMENT_INVALID', request.change_id);
      if (s.subject_sha !== pending.subject_sha) return durableBlock(operation, state, 'AGENT_SUBJECT_MISMATCH', 'MANUAL_CONTROLLER_STOP', [], request);
      const completeBinding = settlementBindingForLedger(pending);
      const agentEvent = await append(state, 'AGENT_RUN', { ...completeBinding, stage: 'RESULT', observed_child_id: s.observed_child_id, status: s.status, artifact_path: s.artifact_path, artifact_sha256: s.artifact_sha256, ...(validatorArtifact ? { validator_artifact: s.validator_artifact } : {}), ...(repairTestResult ? { repair_proof: s.repair_proof } : {}), ...(repairDelivery ? { repair_delivery: s.repair_delivery } : {}) });
      if (agentEvent?.kind !== 'OK') return appendFailureStop(operation, state, request, agentEvent);
      const role = state.phase === 'SPEC' ? null : roleReceipt(completeBinding, s.status, state);
      const validatorEvent = role === null ? null : await append(state, 'VALIDATION_RESULT', role);
      if (role !== null && validatorEvent?.kind !== 'OK') return appendFailureStop(operation, state, request, validatorEvent);
      let phase = state.phase;
      if (s.status !== 'PASS') {
        if (phase !== 'VALIDATOR') return durableBlock(operation, state, phase === 'SPEC' ? 'SPEC_FAILURE' : phase === 'TEST_RED' ? 'TEST_CAUSAL_RED_UNAVAILABLE' : 'WORKER_GREEN_FAILURE', phase === 'WORKER_GREEN' ? 'REVISION' : 'MANUAL_CONTROLLER_STOP', [{ kind: 'AGENT_RUN', id: agentEvent.value.event_id, sha256: agentEvent.value.event_hash, subject_sha: state.candidate?.sha ?? state.repository.baseline_sha }], request);
        if (!s.validator_artifact.findings.every(finding => finding.classification === 'IMPLEMENTATION_IN_SCOPE')) return durableBlock(operation, state, 'VALIDATOR_OUT_OF_SCOPE_FAIL', 'MANUAL_CONTROLLER_STOP', [{ kind: 'VALIDATION_RESULT', id: validatorEvent.value.event_id, sha256: validatorEvent.value.event_hash, subject_sha: state.candidate?.sha }], request);
        if (state.authorization_cycle.auto_repair_attempt === 1) return durableBlock(operation, state, 'VALIDATOR_SECOND_FAIL', 'REVISION', [{ kind: 'VALIDATION_RESULT', id: validatorEvent.value.event_id, sha256: validatorEvent.value.event_hash, subject_sha: state.candidate?.sha }], request);
        const repairEvidence = await repairEvidenceFromRemote(state, agentEvent, validatorEvent, s.validator_artifact, s);
        if (repairEvidence.kind === 'INELIGIBLE') return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [{ kind: 'VALIDATION_RESULT', id: validatorEvent.value.event_id, sha256: validatorEvent.value.event_hash, subject_sha: state.candidate?.sha }], request);
        if (repairEvidence.kind !== 'OK') return appendFailureStop(operation, state, request, repairEvidence);
        const repair_evidence = repairEvidence.value;
        const finalReceipt = {
          event_id: validatorEvent.value.event_id, event_hash: validatorEvent.value.event_hash,
          validation_id: role.validation_id, validation_kind: role.validation_kind, receipt_sha256: role.receipt_sha256,
          subject_sha: role.subject_sha, candidate_sha: role.candidate_sha, validator_head: role.validator_head,
        };
        const projected = { ...state, macro_state: 'EXECUTING', phase: 'TEST_RED', state_version: state.state_version + 2, pending_agent: null,
          evidence: { ...state.evidence, repair_evidence }, candidate: { ...state.candidate, validation_refs: [...(state.candidate?.validation_refs ?? []), finalReceipt] },
          authorization_cycle: { ...state.authorization_cycle, auto_repair_attempt: 1 } };
        const repairRole = route(projected, acceptedDispatch?.body);
        let projectedAction;
        try { projectedAction = repairRole && actionFor(projected, repairRole, d.ids); } catch { projectedAction = null; }
        const projectedEvent = projectedAction && { ...settlementBindingForLedger(projectedAction), stage: 'REQUESTED' };
        const projectedRecord = projectedEvent && Number.isSafeInteger(repairEvidence.next_sequence)
          ? eventRecord(projected, 'AGENT_RUN', projectedEvent, repairEvidence.next_sequence, '1970-01-01T00:00:00.000Z') : null;
        const projectedPending = projectedAction && projectedRecord && { ...settlementBindingForLedger(projectedAction), request_event_id: projectedRecord.event_id };
        if (!repairRole || !projectedAction || !projectedRecord || !boundedEventRecord(projected, 'AGENT_RUN', projectedEvent, repairEvidence.next_sequence) || !boundedControl(projectedPending)
          || !boundedControl(repair_evidence) || !boundedControl(finalReceipt)) return durableBlock(operation, state, 'EVIDENCE_CONFLICT', 'MANUAL_CONTROLLER_STOP', [{ kind: 'VALIDATION_RESULT', id: validatorEvent.value.event_id, sha256: validatorEvent.value.event_hash, subject_sha: state.candidate?.sha }], request);
        const budgeted = { ...state, state_version: state.state_version + 1, authorization_cycle: { ...state.authorization_cycle, auto_repair_attempt: 1 } };
        if (!await writeState(budgeted, state)) return localPause(operation, state, request, 'STATE_WRITE_FAILED', 'IDENTICAL_COMMAND_REPLAY');
        const next = { ...budgeted, macro_state: 'EXECUTING', phase: 'TEST_RED', state_version: budgeted.state_version + 1, pending_agent: null, evidence: { ...budgeted.evidence, repair_evidence }, candidate: { ...budgeted.candidate, validation_refs: [...(budgeted.candidate?.validation_refs ?? []), finalReceipt] } };
        if (!await writeState(next, budgeted)) return durableBlock(operation, budgeted, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', [{ kind: 'VALIDATION_RESULT', id: validatorEvent.value.event_id, sha256: validatorEvent.value.event_hash, subject_sha: state.candidate?.sha }], request);
        return stateResult(operation, 'ADVANCED', next, { from_state: state.macro_state, from_phase: state.phase, to_state: 'EXECUTING', to_phase: 'TEST_RED', operation_receipt_sha256: receipt(next) });
      }
      if (phase === 'SPEC') phase = 'TEST_RED'; else if (phase === 'TEST_RED') phase = 'WORKER_GREEN'; else if (phase === 'WORKER_GREEN') phase = 'REGRESSION'; else if (phase === 'VALIDATOR') phase = 'BRANCH_PUSH';
      const validatorRef = phase === 'BRANCH_PUSH' ? {
        event_id: validatorEvent.value.event_id, event_hash: validatorEvent.value.event_hash,
        validation_id: role.validation_id, validation_kind: role.validation_kind, receipt_sha256: role.receipt_sha256,
        subject_sha: role.subject_sha, candidate_sha: role.candidate_sha, validator_head: role.validator_head,
      } : null;
      const next = { ...state, phase, state_version: state.state_version + 1, pending_agent: null,
        evidence: repairTestResult ? { ...state.evidence, repair_proof: {
          schema_version: '1.0', kind: 'REPAIR_TEST_HOST_PROOF_REF', artifact_path: s.artifact_path,
          artifact_sha256: s.artifact_sha256, execution_content_sha256: s.repair_proof.execution_content_sha256,
          proof_receipt_sha256: s.repair_proof.proof_receipt_sha256, test_files: s.repair_proof.test_files,
        } } : repairDelivery ? { ...state.evidence, repair_worker_snapshot_sha256: s.repair_delivery.post_worker_worktree_snapshot_sha256 } : state.evidence,
        candidate: phase === 'BRANCH_PUSH' ? { ...state.candidate, validator_head: state.candidate?.sha, validation_refs: [...(state.candidate?.validation_refs ?? []), validatorRef] } : state.candidate };
      if (!await writeState(next, state)) return durableBlock(operation, state, 'STATE_WRITE_FAILED', 'MANUAL_CONTROLLER_STOP', role === null ? [{ kind: 'AGENT_RUN', id: agentEvent.value.event_id, sha256: agentEvent.value.event_hash, subject_sha: state.candidate?.sha ?? state.repository.baseline_sha }] : [{ kind: 'VALIDATION_RESULT', id: validatorEvent.value.event_id, sha256: validatorEvent.value.event_hash, subject_sha: state.candidate?.sha ?? state.repository.baseline_sha }], request);
      return stateResult(operation, 'ADVANCED', next, { from_state: state.macro_state, from_phase: state.phase, to_state: state.macro_state, to_phase: phase, operation_receipt_sha256: receipt(next) });
    } finally { await d.mutex.release(); }
  }

  async function status(request) {
    const operation = 'status'; if (!exact(request, ['change_id'])) return rejected(operation, 'INPUT_INVALID');
    const statusWipAuthorityInvalid = (change_id = null) => ({ schema_version: '1.0', operation, outcome: 'REJECTED', error_code: 'WIP_AUTHORITY_INVALID', change_id });
    const empty = { pointer_status: 'EMPTY', active_change_id: null, macro_state: null, phase: null, state_version: null, state_hash: null, pending_action: null, candidate: null, delivery: null, orphan_ready: null, local_pause: null };
    let pointerRead; try { pointerRead = await d.state.readPointer({}); } catch { return statusWipAuthorityInvalid(); }
    const pointer = pointerValue(pointerRead); if (!pointer || !isHash(pointerRead.value?.sha256) || pointerRead.value.sha256 !== sha256(pointerRead.value.bytes)) return statusWipAuthorityInvalid();
    if (pointer.active_change_id === null) return result(operation, 'STATUS', null, null, null, null, empty);
    const active = pointer.active_change_id;
    const activeMatch = typeof active === 'string' ? /^CHG-[a-z0-9]+(?:-[a-z0-9]+){0,15}$/.exec(active) : null;
    if (!(typeof active === 'string' && Buffer.byteLength(active, 'utf8') <= 128 && activeMatch?.[0] === active)) return statusWipAuthorityInvalid(active);
    let stateRead; try { stateRead = await d.state.readState({ change_id: pointer.active_change_id }); } catch { stateRead = null; }
    const state = decodedState(stateRead);
    if (!state || state.change_id !== pointer.active_change_id) {
      const pause = await readStatusPause(null, pointer.active_change_id);
      if (pause.kind !== 'OK') return statusWipAuthorityInvalid(pointer.active_change_id);
      return result(operation, 'STATUS', null, null, null, pointer.active_change_id, {
        pointer_status: 'INVALID', active_change_id: pointer.active_change_id, macro_state: null, phase: null, state_version: null, state_hash: null,
        pending_action: null, candidate: null, delivery: null, orphan_ready: null, local_pause: pause.value,
      });
    }
    const pause = await readStatusPause(state);
    if (pause.kind === 'OK') return result(operation, 'STATUS', state.macro_state, state.state_version, stateHash(state), pointer.active_change_id, {
      pointer_status: 'INVALID', active_change_id: pointer.active_change_id, macro_state: state.macro_state, phase: state.phase,
      state_version: state.state_version, state_hash: stateHash(state), pending_action: state.pending_agent ? { kind: 'AGENT_SETTLEMENT', correlation_id: state.pending_agent.correlation_id } : null,
      candidate: state.candidate, delivery: state.delivery, orphan_ready: null, local_pause: pause.value,
    });
    if (pause.kind !== 'ABSENT') return statusWipAuthorityInvalid(pointer.active_change_id);
    if (state.macro_state === 'READY' && testSeam) {
      let legacy; try { legacy = await d.ledger.readRemoteAppend({ change_id: state.change_id }); } catch { return statusWipAuthorityInvalid(pointer.active_change_id); }
      if (legacy?.kind !== 'OK') return statusWipAuthorityInvalid(pointer.active_change_id);
    }
    if (state.macro_state === 'READY' && !testSeam) {
      let ledger; try { ledger = await readLedgerRecords(state); } catch { return statusWipAuthorityInvalid(pointer.active_change_id); }
      const admission = ledger?.records.filter(record => record.event_class === 'CONTROLLER_COMMAND' && record.detail?.command_kind === 'DISPATCH' && record.detail?.command_id === state.authorization_cycle?.command_id) ?? [];
      if (admission.length !== 1 || admission[0].detail?.body_sha256 !== state.admission?.body_sha256 || canonical(admission[0].detail?.admission) !== canonical(state.admission) || admission[0].detail?.ready_state_sha256 !== stateHash(state)) return statusWipAuthorityInvalid(pointer.active_change_id);
    }
    return result(operation, 'STATUS', state.macro_state, state.state_version, stateHash(state), pointer.active_change_id, {
      pointer_status: 'ACTIVE', active_change_id: pointer.active_change_id, macro_state: state.macro_state, phase: state.phase,
      state_version: state.state_version, state_hash: stateHash(state), pending_action: state.pending_agent ? { kind: 'AGENT_SETTLEMENT', correlation_id: state.pending_agent.correlation_id } : null,
      candidate: state.candidate, delivery: state.delivery, orphan_ready: null, local_pause: null,
    });
  }
  return Object.freeze({ applyControllerCommand, run, settlement, status });
}

export function createCoordinatorCore(dependencies) { return createCore(dependencies); }
export function createTestCoordinator(dependencies) {
  const seed = dependencies[TEST_ACCEPTED_DISPATCH] ?? (dependencies[TEST_CONSTRUCTION_SEEN] === true ? null : testRouteSeed());
  if (seed) Object.defineProperty(dependencies, TEST_CONSTRUCTION_SEEN, { value: true });
  return createCore(dependencies, seed, true);
}
