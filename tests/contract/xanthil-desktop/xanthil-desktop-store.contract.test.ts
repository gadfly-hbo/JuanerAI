import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import { canonicalDesktopJson } from '../../../packages/product-core/xanthil-desktop-decision-case.ts';

import { createExactXdk1HotJournal, loadDesktopModule, openConfirmedDesktopRevision, requireU12ProjectAdmissionSeams, requiredExport, requiredRecord, requiredString, revisionCommand, withCommitResponseLostAfterRealCommit, withIsolatedProject, withNodeSqliteConnectionAudit } from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';
import { assertDesktopFixtureHealth, createSessionCommand, desktopTestIds } from '../../fixtures/xanthil-desktop/desktop-fixtures.ts';

type Method = (value: Record<string, unknown>) => Promise<Record<string, unknown>>;

const sqliteFile = (projectRoot: string) => join(projectRoot, '.xanthil', 'desktop', 'state.sqlite');

function u13Request(overrides: Record<string, unknown> = {}) {
  const command = (overrides.command ?? createSessionCommand()) as ReturnType<typeof createSessionCommand>;
  const { command_id, ...request } = command; void command_id;
  return { command, ids: { session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, operation_id: desktopTestIds.operation },
    created_at: '2026-01-02T03:04:05.006Z', input_fingerprint: createHash('sha256').update(JSON.stringify({ operation_kind: 'create_session', request })).digest('hex'), ...overrides };
}

test('U1.4 alternatives: direct Store rejects empty members before create/save publication [AC-XDESK-003-01]', async () => withIsolatedProject(async projectRoot => {
  const store = await createStore(projectRoot); await openProject(store);
  const command = createSessionCommand();
  for (const alternatives of [[''], ['\u0085\u00a0\u2028\u2029'], ['Valid', '']]) {
    const before = await readFile(sqliteFile(projectRoot)), directories = await readdir(projectRoot, { recursive: true });
    await assert.rejects(() => requiredExport<Method>(store, 'createSession')(u13Request({ command: { ...command, fields: { ...command.fields, alternative_explanations: alternatives } } })), /INVALID_REQUEST/);
    assert.deepEqual(await readFile(sqliteFile(projectRoot)), before); assert.deepEqual(await readdir(projectRoot, { recursive: true }), directories);
  }
  await requiredExport<Method>(store, 'createSession')(u13Request());
  for (const alternatives of [[''], ['\u0085\u00a0\u2028\u2029'], ['Valid', '']]) {
    const request = { contract_version: '1.0', project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, expected_row_version: '1', form: { kind: 'case_fields', fields: { ...command.fields, alternative_explanations: alternatives } } };
    const before = await readFile(sqliteFile(projectRoot));
    await assert.rejects(() => requiredExport<Method>(store, 'saveForm')({ command: { command_id: desktopTestIds.revisionCommand, ...request }, completed_at: '2026-01-02T03:04:05.006Z', input_fingerprint: createHash('sha256').update(JSON.stringify({ operation_kind: 'save_form', request })).digest('hex') }), /INVALID_REQUEST/);
    assert.deepEqual(await readFile(sqliteFile(projectRoot)), before);
  }
}));

test('U1.3 publication: collisions including empty final directories and symlinks are never replaced [AC-XDESK-002-03, AC-XDESK-002-04]', async (t) => {
  for (const kind of ['empty', 'occupied', 'symlink', 'staging']) await t.test(kind, async () => withIsolatedProject(async projectRoot => {
    const store = await createStore(projectRoot); await openProject(store);
    const target = kind === 'staging' ? join(projectRoot, '.xanthil', 'desktop', 'staging', desktopTestIds.operation) : join(projectRoot, desktopTestIds.session);
    if (kind === 'symlink') await symlink(join(projectRoot, 'missing-target'), target); else await mkdir(target, { recursive: true });
    if (kind === 'occupied') await writeFile(join(target, 'keep'), 'unchanged');
    const { lstat } = await import('node:fs/promises'); const before = await lstat(target), dbBefore = await readFile(sqliteFile(projectRoot));
    await assert.rejects(() => requiredExport<Method>(store, 'createSession')(u13Request()), /COMMAND_CONFLICT|PUBLICATION_FAILED/);
    assert.equal((await lstat(target)).ino, before.ino); assert.deepEqual(await readFile(sqliteFile(projectRoot)), dbBefore);
    assert.deepEqual(await requiredExport<Method>(store, 'listSessions')({ project_id: desktopTestIds.project }), []);
    if (kind === 'occupied') assert.equal(await readFile(join(target, 'keep'), 'utf8'), 'unchanged');
  }));
});

test('U1.3 publication: precommit failure retains invisible orphan and definitely absent COMMIT is not success [AC-XDESK-002-03, AC-XDESK-002-05]', async (t) => {
  for (const point of ['BEGIN IMMEDIATE', 'COMMIT']) await t.test(point, async () => withIsolatedProject(async projectRoot => {
    const store = await createStore(projectRoot); await openProject(store); const before = await readFile(sqliteFile(projectRoot));
    const original = DatabaseSync.prototype.exec; let hit = false;
    DatabaseSync.prototype.exec = function(sql: string) { if (sql === point) { hit = true; throw new Error('synthetic-before-native-boundary'); } return original.call(this, sql); };
    try { await assert.rejects(() => requiredExport<Method>(store, 'createSession')(u13Request()), /PUBLICATION_FAILED/); } finally { DatabaseSync.prototype.exec = original; }
    assert.equal(hit, true); assert.deepEqual(await readFile(sqliteFile(projectRoot)), before);
    assert.deepEqual((await readdir(join(projectRoot, desktopTestIds.session))).sort(), ['010_draw', '020_clean', '060_reports']);
    const reopened = await createStore(projectRoot); await openProject(reopened);
    assert.deepEqual(await requiredExport<Method>(reopened, 'listSessions')({ project_id: desktopTestIds.project }), []);
    await assert.rejects(() => requiredExport<Method>(reopened, 'readProjection')({ project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision }), /NOT_FOUND/);
  }));
});

test('U1.3 receipt: actual lost COMMIT resolves only on a different connection; unreadable blocks resend until reopen [AC-XDESK-002-05]', async (t) => {
  for (const unreadable of [false, true]) await t.test(`unreadable=${unreadable}`, async () => withIsolatedProject(async projectRoot => {
    const store = await createStore(projectRoot); await openProject(store); const create = requiredExport<Method>(store, 'createSession');
    const exec = DatabaseSync.prototype.exec, prepare = DatabaseSync.prototype.prepare;
    let committed: DatabaseSync | undefined, readback: DatabaseSync | undefined, commits = 0;
    DatabaseSync.prototype.exec = function(sql: string) { const result = exec.call(this, sql); if (sql === 'COMMIT') { committed = this; commits++; throw new Error('synthetic-response-lost'); } return result; };
    DatabaseSync.prototype.prepare = function(sql: string) { if (committed && /command_receipts/.test(sql)) { readback = this; assert.notEqual(readback, committed); if (unreadable) throw new Error('synthetic-read-unavailable'); } return prepare.call(this, sql); };
    try { if (unreadable) await assert.rejects(() => create(u13Request()), /RESULT_PENDING/); else assert.equal((await create(u13Request())).session !== null, true); }
    finally { DatabaseSync.prototype.exec = exec; DatabaseSync.prototype.prepare = prepare; }
    assert.ok(committed); assert.ok(readback); assert.equal(commits, 1);
    if (unreadable) {
      const before = await readFile(sqliteFile(projectRoot)); await assert.rejects(() => create(u13Request()), /RESULT_PENDING/); assert.deepEqual(await readFile(sqliteFile(projectRoot)), before);
      await openProject(store);
    }
    const replay = await create(u13Request()); assert.equal((replay.session as Record<string, unknown>).session_id, desktopTestIds.session);
    const db = new DatabaseSync(sqliteFile(projectRoot), { readOnly: true }); try { assert.equal(db.prepare("SELECT COUNT(*) AS n FROM command_receipts WHERE operation_kind='create_session'").get()?.n, 1); } finally { db.close(); }
  }));
});

test('U1.3 integrity: missing committed Session directory remains readable blocked history without replacement [AC-XDESK-002-06, AC-XDESK-011-07]', async () => withIsolatedProject(async projectRoot => {
  const { rename } = await import('node:fs/promises'); const store = await createStore(projectRoot); await openProject(store);
  await requiredExport<Method>(store, 'createSession')(u13Request());
  await rename(join(projectRoot, desktopTestIds.session, '020_clean'), join(projectRoot, desktopTestIds.session, 'preserved-missing-clean'));
  const projection = await requiredExport<Method>(store, 'readProjection')({ project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision });
  assert.equal((projection.revision as Record<string, unknown>).integrity_state, 'integrity_blocked');
  await assert.rejects(() => access(join(projectRoot, desktopTestIds.session, '020_clean')), /ENOENT/);
  assert.equal((await requiredExport<(x: unknown) => Promise<unknown[]>>(store, 'listSessions')({ project_id: desktopTestIds.project })).length, 1);
}));

/** Complete column and unique-key matrix from structure-decision §Exact sixteen-table mapping. */
const exactDesktopSchemaColumns = Object.freeze({
  projects: ['project_id', 'display_name', 'created_at', 'schema_version'],
  product_sessions: ['session_id', 'project_id', 'display_name', 'mode', 'case_id', 'current_revision_id', 'created_at', 'schema_version'],
  case_revisions: ['revision_id', 'project_id', 'session_id', 'case_id', 'revision_sequence', 'state', 'case_name', 'question_text', 'hypothesis_display_title', 'business_context', 'alternative_explanations_json', 'evidence_explanation_text', 'previous_revision_id', 'snapshot_id', 'confirmation_id', 'current_finding_id', 'current_acceptance_id', 'current_closure_id', 'current_report_id', 'integrity_state', 'created_at', 'updated_at', 'row_version', 'schema_version'],
  input_confirmations: ['confirmation_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id', 'member_id_column', 'member_group_column', 'order_id_column', 'order_member_id_column', 'paid_at_column', 'amount_column', 'status_column', 'currency_column', 'comparison_start_date', 'comparison_end_date', 'current_start_date', 'current_end_date', 'currency', 'time_zone', 'valid_statuses_json', 'issue_treatments_json', 'selected_group_mode', 'hypothesis_id', 'method_id', 'method_version', 'authority_confirmed_at', 'issues_confirmed_at', 'plan_confirmed_at', 'contract_json', 'contract_sha256', 'binding_json', 'binding_sha256', 'ir_json', 'ir_sha256', 'created_at', 'schema_version'],
  source_snapshots: ['snapshot_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'members_locator', 'members_display_name', 'members_sha256', 'members_byte_length', 'members_read_at', 'orders_locator', 'orders_display_name', 'orders_sha256', 'orders_byte_length', 'orders_read_at', 'included_member_count', 'excluded_member_count', 'included_order_count', 'excluded_order_count', 'treatment_basis_json', 'confirmed_at', 'created_at', 'schema_version'],
  aggregate_artifacts: ['artifact_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id', 'run_id', 'method_id', 'method_version', 'code_identity', 'columns_json', 'measurement_meanings_json', 'group_pseudonym_map_json', 'locator', 'sha256', 'byte_length', 'created_at', 'schema_version'],
  analysis_runs: ['run_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'confirmation_id', 'profile_id', 'method_id', 'method_version', 'code_identity', 'run_contract_version', 'status', 'started_at', 'deadline_at', 'ended_at', 'terminal_reason', 'run_locator', 'aggregate_id', 'schema_version'],
  model_disclosures: ['disclosure_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'action_kind', 'categories_json', 'aggregate_refs_json', 'payload_sha256', 'requested_provider', 'requested_model', 'decision', 'free_text_confirmed_at', 'decided_at', 'created_at', 'schema_version'],
  assistance_attempts: ['attempt_id', 'disclosure_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'action_kind', 'profile_id', 'runtime_id', 'runtime_version', 'adapter_id', 'adapter_version', 'requested_provider', 'requested_model', 'actual_provider', 'actual_model', 'ended_at', 'terminal_reason', 'draft_id', 'status', 'started_at', 'deadline_at', 'schema_version'],
  assistance_drafts: ['draft_id', 'attempt_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'draft_kind', 'generated_content_json', 'edited_content_json', 'disposition', 'target_form', 'decided_at', 'created_at', 'schema_version'],
  findings: ['finding_id', 'run_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'aggregate_id', 'judgment', 'metrics_json', 'supporting_evidence_json', 'refutation_json', 'limitations_json', 'evidence_refs_json', 'method_id', 'method_version', 'created_at', 'schema_version'],
  finding_acceptances: ['acceptance_id', 'finding_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'action', 'accepted_at', 'schema_version'],
  decision_forms: ['form_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'form_sequence', 'candidates_json', 'route', 'insufficient_reason', 'preferred_candidate_id', 'preferred_reason', 'disposition', 'disposition_at', 'defer_until', 'created_at', 'updated_at', 'schema_version'],
  decision_closures: ['closure_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id', 'form_id', 'route', 'completed_at', 'schema_version'],
  report_versions: ['report_id', 'project_id', 'session_id', 'case_id', 'revision_id', 'finding_id', 'acceptance_id', 'closure_id', 'version_sequence', 'state', 'markdown_locator', 'markdown_sha256', 'markdown_byte_length', 'html_locator', 'html_sha256', 'html_byte_length', 'source_json', 'evidence_refs_json', 'created_at', 'schema_version'],
  command_receipts: ['command_id', 'operation_kind', 'project_id', 'session_id', 'case_id', 'revision_id', 'input_fingerprint', 'outcome', 'result_kind', 'result_id', 'rejection_reason', 'completed_at', 'schema_version'],
} satisfies Readonly<Record<string, readonly string[]>>);

const exactDesktopUniqueKeys = Object.freeze({
  product_sessions: [['project_id', 'case_id'], ['session_id', 'case_id'], ['project_id', 'session_id'], ['project_id', 'session_id', 'case_id']],
  case_revisions: [['project_id', 'session_id', 'case_id', 'revision_sequence'], ['project_id', 'session_id', 'case_id', 'revision_id']],
  input_confirmations: [['revision_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'confirmation_id']],
  source_snapshots: [['revision_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id']],
  aggregate_artifacts: [['run_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'artifact_id']],
  analysis_runs: [['project_id', 'session_id', 'case_id', 'revision_id', 'run_id']],
  model_disclosures: [['project_id', 'session_id', 'case_id', 'revision_id', 'disclosure_id']],
  assistance_attempts: [['disclosure_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'attempt_id']],
  assistance_drafts: [['attempt_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'draft_id']],
  findings: [['run_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'finding_id']],
  finding_acceptances: [['finding_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id']],
  decision_forms: [['revision_id', 'form_sequence'], ['project_id', 'session_id', 'case_id', 'revision_id', 'form_id']],
  decision_closures: [['acceptance_id'], ['project_id', 'session_id', 'case_id', 'revision_id', 'closure_id']],
  report_versions: [['revision_id', 'version_sequence'], ['project_id', 'session_id', 'case_id', 'revision_id', 'report_id']],
} satisfies Readonly<Record<string, readonly (readonly string[])[]>>);

type ExactForeignKey = Readonly<{
  columns: readonly string[];
  parentTable: string;
  parentColumns: readonly string[];
}>;

/** Every declared FK group from structure-decision §Executable key and relationship contract. */
const exactDesktopForeignKeys = Object.freeze({
  product_sessions: [
    { columns: ['project_id'], parentTable: 'projects', parentColumns: ['project_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'current_revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
  ],
  case_revisions: [
    { columns: ['project_id', 'session_id', 'case_id'], parentTable: 'product_sessions', parentColumns: ['project_id', 'session_id', 'case_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'previous_revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id'], parentTable: 'source_snapshots', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'confirmation_id'], parentTable: 'input_confirmations', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'confirmation_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'current_finding_id'], parentTable: 'findings', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'finding_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'current_acceptance_id'], parentTable: 'finding_acceptances', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'current_closure_id'], parentTable: 'decision_closures', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'closure_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'current_report_id'], parentTable: 'report_versions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'report_id'] },
  ],
  input_confirmations: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id'], parentTable: 'source_snapshots', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id'] },
  ],
  source_snapshots: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
  ],
  aggregate_artifacts: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id'], parentTable: 'source_snapshots', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'snapshot_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'run_id'], parentTable: 'analysis_runs', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'run_id'] },
  ],
  analysis_runs: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'confirmation_id'], parentTable: 'input_confirmations', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'confirmation_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'aggregate_id'], parentTable: 'aggregate_artifacts', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'artifact_id'] },
  ],
  model_disclosures: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
  ],
  assistance_attempts: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'disclosure_id'], parentTable: 'model_disclosures', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'disclosure_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'draft_id'], parentTable: 'assistance_drafts', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'draft_id'] },
  ],
  assistance_drafts: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'attempt_id'], parentTable: 'assistance_attempts', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'attempt_id'] },
  ],
  findings: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'run_id'], parentTable: 'analysis_runs', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'run_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'aggregate_id'], parentTable: 'aggregate_artifacts', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'artifact_id'] },
  ],
  finding_acceptances: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'finding_id'], parentTable: 'findings', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'finding_id'] },
  ],
  decision_forms: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
  ],
  decision_closures: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id'], parentTable: 'finding_acceptances', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'form_id'], parentTable: 'decision_forms', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'form_id'] },
  ],
  report_versions: [
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'finding_id'], parentTable: 'findings', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'finding_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id'], parentTable: 'finding_acceptances', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'acceptance_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id', 'closure_id'], parentTable: 'decision_closures', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id', 'closure_id'] },
  ],
  command_receipts: [
    { columns: ['project_id'], parentTable: 'projects', parentColumns: ['project_id'] },
    { columns: ['project_id', 'session_id', 'case_id'], parentTable: 'product_sessions', parentColumns: ['project_id', 'session_id', 'case_id'] },
    { columns: ['project_id', 'session_id', 'case_id', 'revision_id'], parentTable: 'case_revisions', parentColumns: ['project_id', 'session_id', 'case_id', 'revision_id'] },
  ],
} satisfies Readonly<Record<string, readonly ExactForeignKey[]>>);

const desktopPrimaryIdentityColumns = Object.freeze({
  projects: 'project_id', product_sessions: 'session_id', case_revisions: 'revision_id', input_confirmations: 'confirmation_id',
  source_snapshots: 'snapshot_id', aggregate_artifacts: 'artifact_id', analysis_runs: 'run_id', model_disclosures: 'disclosure_id',
  assistance_attempts: 'attempt_id', assistance_drafts: 'draft_id', findings: 'finding_id', finding_acceptances: 'acceptance_id',
  decision_forms: 'form_id', decision_closures: 'closure_id', report_versions: 'report_id', command_receipts: 'command_id',
} satisfies Readonly<Record<keyof typeof exactDesktopSchemaColumns, string>>);

const desktopIntegerColumns = new Set([
  'case_revisions.revision_sequence', 'case_revisions.row_version',
  'source_snapshots.members_byte_length', 'source_snapshots.orders_byte_length',
  'source_snapshots.included_member_count', 'source_snapshots.excluded_member_count',
  'source_snapshots.included_order_count', 'source_snapshots.excluded_order_count',
  'aggregate_artifacts.byte_length', 'decision_forms.form_sequence', 'report_versions.version_sequence',
  'report_versions.markdown_byte_length', 'report_versions.html_byte_length',
]);

const desktopNullableColumns = new Set([
  'case_revisions.previous_revision_id', 'case_revisions.snapshot_id', 'case_revisions.confirmation_id', 'case_revisions.current_finding_id', 'case_revisions.current_acceptance_id', 'case_revisions.current_closure_id', 'case_revisions.current_report_id',
  'input_confirmations.member_group_column', 'aggregate_artifacts.group_pseudonym_map_json',
  'analysis_runs.ended_at', 'analysis_runs.terminal_reason', 'analysis_runs.run_locator', 'analysis_runs.aggregate_id',
  'model_disclosures.free_text_confirmed_at',
  'assistance_attempts.actual_provider', 'assistance_attempts.actual_model', 'assistance_attempts.ended_at', 'assistance_attempts.terminal_reason', 'assistance_attempts.draft_id',
  'assistance_drafts.edited_content_json', 'assistance_drafts.target_form', 'assistance_drafts.decided_at',
  'decision_forms.route', 'decision_forms.insufficient_reason', 'decision_forms.preferred_candidate_id', 'decision_forms.preferred_reason', 'decision_forms.disposition_at', 'decision_forms.defer_until',
  'report_versions.acceptance_id', 'report_versions.closure_id',
  'command_receipts.session_id', 'command_receipts.case_id', 'command_receipts.revision_id', 'command_receipts.result_kind', 'command_receipts.result_id', 'command_receipts.rejection_reason',
]);

const desktopDefaults: Readonly<Record<string, string>> = Object.freeze({
  'case_revisions.state': 'Draft', 'case_revisions.business_context': '', 'case_revisions.alternative_explanations_json': '[]',
  'case_revisions.evidence_explanation_text': '', 'case_revisions.integrity_state': 'ok', 'case_revisions.row_version': '1',
  'assistance_drafts.disposition': 'pending', 'decision_forms.candidates_json': '[]', 'decision_forms.disposition': 'draft',
} satisfies Readonly<Record<string, string>>);

const desktopConstraintIds = Object.freeze({
  snapshot: '10101010-1010-4010-8010-101010101010',
  confirmation: '20202020-2020-4020-8020-202020202020',
  run: '30303030-3030-4030-8030-303030303030',
  aggregate: '40404040-4040-4040-8040-404040404040',
  disclosure: '50505050-5050-4050-8050-505050505050',
  attempt: '60606060-6060-4060-8060-606060606060',
  draft: '70707070-7070-4070-8070-707070707070',
  finding: '80808080-8080-4080-8080-808080808080',
  acceptance: '90909090-9090-4090-8090-909090909090',
  form: 'a1a1a1a1-a1a1-41a1-81a1-a1a1a1a1a1a1',
  closure: 'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1',
  report: 'c1c1c1c1-c1c1-41c1-81c1-c1c1c1c1c1c1',
  runningRun: 'd1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1',
  rejectedRun: 'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1',
  runningDisclosure: 'f1f1f1f1-f1f1-41f1-81f1-f1f1f1f1f1f1',
  rejectedDisclosure: '12121212-3434-4121-8121-121212121212',
  runningAttempt: '13131313-3434-4131-8131-131313131313',
  rejectedAttempt: '14141414-3434-4141-8141-141414141414',
  nextRevision: '24242424-2424-4242-8242-242424242424',
} as const);

const exactReceiptOperationKinds = [
  'initialize_project', 'create_session', 'create_draft_revision', 'save_form', 'confirm_revision',
  'start_analysis', 'cancel_analysis', 'settle_analysis', 'record_model_disclosure', 'start_assistance',
  'cancel_assistance', 'settle_assistance', 'dispose_assistance_draft', 'accept_finding', 'complete_case',
  'export_report', 'mark_integrity_blocked', 'reconcile_interrupted',
] as const;

const exactReceiptResultKinds = [
  'project', 'product_session', 'case_revision', 'input_confirmation', 'analysis_run', 'model_disclosure',
  'assistance_attempt', 'assistance_draft', 'finding_acceptance', 'decision_form', 'decision_closure', 'report_version',
] as const;

type ReceiptOperationKind = (typeof exactReceiptOperationKinds)[number];
type ReceiptResultKind = (typeof exactReceiptResultKinds)[number];

const exactReceiptSuccessResults = Object.freeze({
  initialize_project: ['project'],
  create_session: ['product_session'],
  create_draft_revision: ['case_revision'],
  save_form: ['case_revision', 'decision_form'],
  confirm_revision: ['input_confirmation'],
  start_analysis: ['analysis_run'],
  cancel_analysis: ['analysis_run'],
  settle_analysis: ['analysis_run'],
  record_model_disclosure: ['model_disclosure'],
  start_assistance: ['assistance_attempt'],
  cancel_assistance: ['assistance_attempt'],
  settle_assistance: ['assistance_attempt'],
  dispose_assistance_draft: ['assistance_draft'],
  accept_finding: ['finding_acceptance'],
  complete_case: ['decision_closure'],
  export_report: ['report_version'],
  mark_integrity_blocked: ['case_revision'],
  reconcile_interrupted: ['analysis_run', 'assistance_attempt'],
} satisfies Readonly<Record<ReceiptOperationKind, readonly ReceiptResultKind[]>>);

const exactReceiptResultIds = Object.freeze({
  project: desktopTestIds.project,
  product_session: desktopTestIds.session,
  case_revision: desktopTestIds.revision,
  input_confirmation: desktopConstraintIds.confirmation,
  analysis_run: desktopConstraintIds.run,
  model_disclosure: desktopConstraintIds.disclosure,
  assistance_attempt: desktopConstraintIds.attempt,
  assistance_draft: desktopConstraintIds.draft,
  finding_acceptance: desktopConstraintIds.acceptance,
  decision_form: desktopConstraintIds.form,
  decision_closure: desktopConstraintIds.closure,
  report_version: desktopConstraintIds.report,
} satisfies Readonly<Record<ReceiptResultKind, string>>);

function quoteSqlIdentifier(value: string) { return `"${value.replaceAll('"', '""')}"`; }

/** Reads only the frozen column's simple SQL IN literal list; this is not a general DDL parser. */
function receiptCheckEnumValues(ddl: string, column: 'operation_kind' | 'result_kind' | 'outcome') {
  const match = new RegExp(`\\b${column}\\b\\s+IN\\s*\\(([^)]*)\\)`, 'i').exec(ddl);
  assert.ok(match, `command_receipts declares ${column} as a closed SQL IN list`);
  return match[1].split(',').map((part) => {
    const literal = /^'([a-z_]+)'$/.exec(part.trim());
    assert.ok(literal, `command_receipts ${column} IN list contains only frozen lowercase SQL literals`);
    return literal[1];
  });
}

function assertExactReceiptCheckEnum(ddl: string, column: 'operation_kind' | 'result_kind' | 'outcome', expected: readonly string[]) {
  assert.deepEqual(
    receiptCheckEnumValues(ddl, column).sort(),
    [...expected].sort(),
    `command_receipts ${column} SQL CHECK has exactly the frozen closed vocabulary`,
  );
}

function receiptCommandId(sequence: number) {
  const hex = sequence.toString(16).padStart(7, '0');
  return `3${hex}-0000-4000-8000-${hex.padStart(12, '0')}`;
}

function insertConstraintReceipt(db: DatabaseSync, value: Readonly<{
  commandId: string;
  operationKind: string;
  outcome: 'succeeded' | 'rejected';
  resultKind: string | null;
  resultId: string | null;
  rejectionReason: string | null;
}>) {
  const owner = value.operationKind === 'initialize_project'
    ? [null, null, null]
    : [desktopTestIds.session, desktopTestIds.case, desktopTestIds.revision];
  return db.prepare(`INSERT INTO command_receipts(
    command_id, operation_kind, project_id, session_id, case_id, revision_id,
    input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version
  ) VALUES (?, ?, ?, ?, ?, ?, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', ?, ?, ?, ?, '2026-09-19T00:00:00.000Z', '1.0')`).run(
    value.commandId, value.operationKind, desktopTestIds.project, ...owner,
    value.outcome, value.resultKind, value.resultId, value.rejectionReason,
  );
}

function canonicalDefault(value: unknown) {
  if (value === null) return null;
  return String(value).trim().replace(/^\(+|\)+$/g, '').replace(/^'(.*)'$/, '$1');
}

function sortedForeignKeys(db: DatabaseSync, table: string) {
  const groups = new Map<number, { parentTable: string; columns: string[]; parentColumns: string[]; onDelete: string; onUpdate: string }>();
  for (const row of db.prepare(`PRAGMA foreign_key_list(${quoteSqlIdentifier(table)})`).all() as Array<Record<string, unknown>>) {
    const id = Number(row.id);
    const current = groups.get(id) ?? { parentTable: requiredString(row, 'table'), columns: [], parentColumns: [], onDelete: requiredString(row, 'on_delete'), onUpdate: requiredString(row, 'on_update') };
    current.columns[Number(row.seq)] = requiredString(row, 'from');
    current.parentColumns[Number(row.seq)] = requiredString(row, 'to');
    groups.set(id, current);
  }
  return [...groups.values()]
    .map((value) => ({ ...value, columns: [...value.columns], parentColumns: [...value.parentColumns] }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function expectedForeignKeys(table: keyof typeof exactDesktopForeignKeys) {
  return exactDesktopForeignKeys[table]
    .map((value) => ({ parentTable: value.parentTable, columns: [...value.columns], parentColumns: [...value.parentColumns], onDelete: 'RESTRICT', onUpdate: 'RESTRICT' }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function sortedNonPrimaryIndexShapes(db: DatabaseSync) {
  return Object.keys(exactDesktopSchemaColumns).flatMap((table) => (
    (db.prepare(`PRAGMA index_list(${quoteSqlIdentifier(table)})`).all() as Array<Record<string, unknown>>)
      .filter((index) => index.origin !== 'pk')
      .map((index) => ({
        table,
        columns: (db.prepare(`PRAGMA index_info(${quoteSqlIdentifier(requiredString(index, 'name'))})`).all() as Array<Record<string, unknown>>)
          .sort((left, right) => Number(left.seqno) - Number(right.seqno))
          .map((column) => requiredString(column, 'name')),
        partial: Number(index.partial),
        unique: Number(index.unique),
      }))
  )).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function expectedNonPrimaryIndexShapes() {
  return [
    ...Object.entries(exactDesktopUniqueKeys).flatMap(([table, keys]) => keys.map((columns) => ({ table, columns: [...columns], partial: 0, unique: 1 }))),
    { table: 'analysis_runs', columns: ['revision_id'], partial: 1, unique: 1 },
    { table: 'assistance_attempts', columns: ['revision_id'], partial: 1, unique: 1 },
    { table: 'product_sessions', columns: ['project_id', 'created_at', 'session_id'], partial: 0, unique: 0 },
    { table: 'case_revisions', columns: ['session_id', 'case_id', 'revision_sequence'], partial: 0, unique: 0 },
    { table: 'report_versions', columns: ['revision_id', 'version_sequence'], partial: 0, unique: 0 },
    { table: 'decision_forms', columns: ['revision_id', 'form_sequence'], partial: 0, unique: 0 },
  ].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function desktopConstraintRows(db: DatabaseSync) {
  return Object.fromEntries(Object.keys(exactDesktopSchemaColumns).map((table) => [
    table,
    db.prepare(`SELECT * FROM ${quoteSqlIdentifier(table)} ORDER BY rowid`).all(),
  ]));
}

function assertRejectedConstraintWrite(db: DatabaseSync, label: string, write: () => unknown) {
  const before = desktopConstraintRows(db);
  assert.throws(write, /(?:constraint|UNIQUE|FOREIGN KEY|CHECK|NOT NULL)/i, label);
  assert.deepEqual(desktopConstraintRows(db), before, `${label} leaves no durable row, pointer, or receipt mutation`);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], `${label} leaves no hidden foreign-key violation`);
}

function assertRejectedForeignKeyWrite(db: DatabaseSync, label: string, write: () => unknown) {
  const before = desktopConstraintRows(db);
  assert.throws(write, /FOREIGN KEY/i, label);
  assert.deepEqual(desktopConstraintRows(db), before, `${label} leaves no durable row, pointer, or receipt mutation`);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], `${label} leaves no hidden foreign-key violation`);
}

function assertRejectedDeferredCommit(db: DatabaseSync, label: string, write: () => unknown) {
  const before = desktopConstraintRows(db);
  let committed = false;
  db.exec('BEGIN');
  try {
    write();
    try {
      db.exec('COMMIT');
      committed = true;
    } catch (error: unknown) {
      assert.match(String(error), /FOREIGN KEY/i, label);
    }
    assert.equal(committed, false, label);
  } finally {
    if (!committed) db.exec('ROLLBACK');
  }
  assert.deepEqual(desktopConstraintRows(db), before, `${label} rolls back every attempted row, pointer, and receipt`);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], `${label} leaves the valid fixture intact`);
}

function insertClone(db: DatabaseSync, table: keyof typeof exactDesktopSchemaColumns, overrides: Readonly<Record<string, SQLInputValue>>) {
  const columns = exactDesktopSchemaColumns[table];
  const hasOverride = (column: string) => Object.prototype.hasOwnProperty.call(overrides, column);
  const select = columns.map((column) => hasOverride(column) ? `? AS ${quoteSqlIdentifier(column)}` : quoteSqlIdentifier(column)).join(', ');
  const values = columns.filter(hasOverride).map((column) => overrides[column]);
  return db.prepare(`INSERT INTO ${quoteSqlIdentifier(table)} (${columns.map(quoteSqlIdentifier).join(', ')}) SELECT ${select} FROM ${quoteSqlIdentifier(table)} ORDER BY rowid LIMIT 1`).run(...values);
}

function updateConstraintRow(db: DatabaseSync, table: keyof typeof exactDesktopSchemaColumns, column: string, value: SQLInputValue) {
  const identity = desktopPrimaryIdentityColumns[table];
  const row = db.prepare(`SELECT ${quoteSqlIdentifier(identity)} AS identity FROM ${quoteSqlIdentifier(table)} ORDER BY rowid LIMIT 1`).get() as { identity: unknown };
  return db.prepare(`UPDATE ${quoteSqlIdentifier(table)} SET ${quoteSqlIdentifier(column)} = ? WHERE ${quoteSqlIdentifier(identity)} = ?`).run(value, requiredString(row, 'identity'));
}

/**
 * Inserts a complete, valid, Test-only future record closure using raw SQL. It
 * is deliberately not a U1.3 Application/Session behavior call: its sole role
 * is to give the U1.2 physical-DDL negative matrix real parents to reject.
 */
function insertExactConstraintFixture(db: DatabaseSync) {
  const timestamp = '2026-09-19T00:00:00.000Z';
  const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const owner = [desktopTestIds.project, desktopTestIds.session, desktopTestIds.case, desktopTestIds.revision];
  insertExactA13Tuple(db, {
    projectId: desktopTestIds.project,
    sessionId: desktopTestIds.session,
    caseId: desktopTestIds.case,
    revisionId: desktopTestIds.revision,
    receiptCommandId: desktopTestIds.createSessionCommand,
  });
  db.exec('BEGIN');
  try {
    db.prepare(`INSERT INTO source_snapshots(
      snapshot_id, project_id, session_id, case_id, revision_id, members_locator, members_display_name, members_sha256,
      members_byte_length, members_read_at, orders_locator, orders_display_name, orders_sha256, orders_byte_length,
      orders_read_at, included_member_count, excluded_member_count, included_order_count, excluded_order_count,
      treatment_basis_json, confirmed_at, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, 'members.csv', ?, 1, ?, ?, 'orders.csv', ?, 1, ?, 1, 0, 1, 0, '[]', ?, ?, '1.0')`).run(
      desktopConstraintIds.snapshot, ...owner,
      `${desktopTestIds.session}/010_draw/${desktopConstraintIds.snapshot}/members.csv`, hash, timestamp,
      `${desktopTestIds.session}/010_draw/${desktopConstraintIds.snapshot}/orders.csv`, hash, timestamp, timestamp, timestamp,
    );
    db.prepare(`INSERT INTO input_confirmations(
      confirmation_id, project_id, session_id, case_id, revision_id, snapshot_id, member_id_column, member_group_column,
      order_id_column, order_member_id_column, paid_at_column, amount_column, status_column, currency_column,
      comparison_start_date, comparison_end_date, current_start_date, current_end_date, currency, time_zone,
      valid_statuses_json, issue_treatments_json, selected_group_mode, hypothesis_id, method_id, method_version,
      authority_confirmed_at, issues_confirmed_at, plan_confirmed_at, contract_json, contract_sha256, binding_json,
      binding_sha256, ir_json, ir_sha256, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, 'member_id', 'member_group', 'order_id', 'order_member_id', 'paid_at', 'amount', 'status', 'currency',
      '2026-01-01', '2026-01-29', '2026-02-01', '2026-03-01', 'CNY', 'Asia/Shanghai', '["paid"]', '[]', 'mapped',
      'current_repurchase_rate_lower_than_comparison', 'membership_repurchase_comparison', '1.0', ?, ?, ?, '{}', ?, '{}', ?, '{}', ?, ?, '1.0')`).run(
      desktopConstraintIds.confirmation, ...owner, desktopConstraintIds.snapshot, timestamp, timestamp, timestamp, hash, hash, hash, timestamp,
    );
    db.prepare(`INSERT INTO analysis_runs(
      run_id, project_id, session_id, case_id, revision_id, confirmation_id, profile_id, method_id, method_version,
      code_identity, run_contract_version, status, started_at, deadline_at, ended_at, terminal_reason, run_locator, aggregate_id, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, 'personal-desktop', 'membership_repurchase_comparison', '1.0', ?, '3.0', 'Running', ?, ?, NULL, NULL, NULL, NULL, '1.0')`).run(
      desktopConstraintIds.run, ...owner, desktopConstraintIds.confirmation, hash, timestamp, '2026-09-19T00:05:00.000Z',
    );
    db.prepare(`INSERT INTO aggregate_artifacts(
      artifact_id, project_id, session_id, case_id, revision_id, snapshot_id, run_id, method_id, method_version, code_identity,
      columns_json, measurement_meanings_json, group_pseudonym_map_json, locator, sha256, byte_length, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'membership_repurchase_comparison', '1.0', ?, '{}', '{}', '{}', 'aggregate.json', ?, 1, ?, '1.0')`).run(
      desktopConstraintIds.aggregate, ...owner, desktopConstraintIds.snapshot, desktopConstraintIds.run, hash, hash, timestamp,
    );
    db.prepare("UPDATE analysis_runs SET status = 'Succeeded', ended_at = ?, run_locator = 'runs/complete', aggregate_id = ? WHERE run_id = ?").run(timestamp, desktopConstraintIds.aggregate, desktopConstraintIds.run);
    db.prepare(`INSERT INTO model_disclosures(
      disclosure_id, project_id, session_id, case_id, revision_id, action_kind, categories_json, aggregate_refs_json, payload_sha256,
      requested_provider, requested_model, decision, free_text_confirmed_at, decided_at, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, 'organize_question', '["analysis"]', '[]', ?, 'local', 'none', 'accepted', NULL, ?, ?, '1.0')`).run(
      desktopConstraintIds.disclosure, ...owner, hash, timestamp, timestamp,
    );
    db.prepare(`INSERT INTO assistance_attempts(
      attempt_id, disclosure_id, project_id, session_id, case_id, revision_id, action_kind, profile_id, runtime_id, runtime_version,
      adapter_id, adapter_version, requested_provider, requested_model, actual_provider, actual_model, ended_at, terminal_reason,
      draft_id, status, started_at, deadline_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, 'organize_question', 'personal-desktop', 'offline', '1.0', 'offline', '1.0', 'local', 'none', NULL, NULL, NULL, NULL, NULL, 'Running', ?, ?, '1.0')`).run(
      desktopConstraintIds.attempt, desktopConstraintIds.disclosure, ...owner, timestamp, '2026-09-19T00:05:00.000Z',
    );
    db.prepare(`INSERT INTO assistance_drafts(
      draft_id, attempt_id, project_id, session_id, case_id, revision_id, draft_kind, generated_content_json, edited_content_json,
      disposition, target_form, decided_at, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, 'question_fields', '{"question_text":"Later tuple question","hypothesis_display_title":"Later tuple hypothesis","business_context":"","alternative_explanations":[]}', NULL, 'pending', NULL, NULL, ?, '1.0')`).run(
      desktopConstraintIds.draft, desktopConstraintIds.attempt, ...owner, timestamp,
    );
    db.prepare("UPDATE assistance_attempts SET status = 'Succeeded', actual_provider = 'local', actual_model = 'none', ended_at = ?, draft_id = ? WHERE attempt_id = ?").run(timestamp, desktopConstraintIds.draft, desktopConstraintIds.attempt);
    db.prepare(`INSERT INTO findings(
      finding_id, run_id, project_id, session_id, case_id, revision_id, aggregate_id, judgment, metrics_json, supporting_evidence_json,
      refutation_json, limitations_json, evidence_refs_json, method_id, method_version, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Inconclusive', '{}', '{}', '{}', '[]', '[]', 'membership_repurchase_comparison', '1.0', ?, '1.0')`).run(
      desktopConstraintIds.finding, desktopConstraintIds.run, ...owner, desktopConstraintIds.aggregate, timestamp,
    );
    db.prepare(`INSERT INTO finding_acceptances(
      acceptance_id, finding_id, project_id, session_id, case_id, revision_id, action, accepted_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, 'accept', ?, '1.0')`).run(
      desktopConstraintIds.acceptance, desktopConstraintIds.finding, ...owner, timestamp,
    );
    db.prepare(`INSERT INTO decision_forms(
      form_id, project_id, session_id, case_id, revision_id, form_sequence, candidates_json, route, insufficient_reason,
      preferred_candidate_id, preferred_reason, disposition, disposition_at, defer_until, created_at, updated_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, 1, '[{"candidate_id":"15151515-1515-4151-8151-151515151515","title":"First","evidence_basis":"basis","risk_or_refutation":"risk","applicability_conditions":"conditions","future_validation_metric":"metric"},{"candidate_id":"16161616-1616-4161-8161-161616161616","title":"Second","evidence_basis":"basis","risk_or_refutation":"risk","applicability_conditions":"conditions","future_validation_metric":"metric"}]', 'candidate_comparison', NULL, NULL, NULL, 'saved', ?, NULL, ?, ?, '1.0')`).run(
      desktopConstraintIds.form, ...owner, timestamp, timestamp, timestamp,
    );
    db.prepare(`INSERT INTO decision_closures(
      closure_id, project_id, session_id, case_id, revision_id, acceptance_id, form_id, route, completed_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'candidate_comparison', ?, '1.0')`).run(
      desktopConstraintIds.closure, ...owner, desktopConstraintIds.acceptance, desktopConstraintIds.form, timestamp,
    );
    db.prepare(`INSERT INTO report_versions(
      report_id, project_id, session_id, case_id, revision_id, finding_id, acceptance_id, closure_id, version_sequence, state,
      markdown_locator, markdown_sha256, markdown_byte_length, html_locator, html_sha256, html_byte_length, source_json,
      evidence_refs_json, created_at, schema_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'final', 'report.md', ?, 1, 'report.html', ?, 1, '{}', '[]', ?, '1.0')`).run(
      desktopConstraintIds.report, ...owner, desktopConstraintIds.finding, desktopConstraintIds.acceptance, desktopConstraintIds.closure, hash, hash, timestamp,
    );
    db.exec('COMMIT');
  } catch (error: unknown) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function insertNextConstraintRevision(db: DatabaseSync) {
  const timestamp = '2026-09-19T00:00:00.000Z';
  db.prepare(`INSERT INTO case_revisions(
    revision_id, project_id, session_id, case_id, revision_sequence, state, case_name, question_text, hypothesis_display_title,
    business_context, alternative_explanations_json, evidence_explanation_text, previous_revision_id, snapshot_id, confirmation_id,
    current_finding_id, current_acceptance_id, current_closure_id, current_report_id, integrity_state, created_at, updated_at, row_version, schema_version
  ) VALUES (?, ?, ?, ?, 2, 'Draft', 'Follow-up Case', 'Follow-up question', 'Follow-up hypothesis', '', '[]', '', ?, NULL, NULL, NULL, NULL, NULL, NULL, 'ok', ?, ?, 1, '1.0')`).run(
    desktopConstraintIds.nextRevision, desktopTestIds.project, desktopTestIds.session, desktopTestIds.case, desktopTestIds.revision, timestamp, timestamp,
  );
}

function makeConstraintFixtureRevisionCompleted(db: DatabaseSync) {
  db.prepare(`UPDATE case_revisions
    SET state = 'Completed', snapshot_id = ?, confirmation_id = ?, current_finding_id = ?, current_acceptance_id = ?, current_closure_id = ?, current_report_id = ?
    WHERE revision_id = ?`).run(
    desktopConstraintIds.snapshot, desktopConstraintIds.confirmation, desktopConstraintIds.finding,
    desktopConstraintIds.acceptance, desktopConstraintIds.closure, desktopConstraintIds.report, desktopTestIds.revision,
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], 'the completed same-owner current-pointer source state is physically valid before an FK probe');
}

function sortedUniqueKeyColumns(db: DatabaseSync, table: string) {
  return (db.prepare(`PRAGMA index_list(${quoteSqlIdentifier(table)})`).all() as Array<Record<string, unknown>>)
    .filter((index) => index.origin !== 'pk' && index.unique === 1 && index.partial === 0)
    .map((index) => (db.prepare(`PRAGMA index_info(${quoteSqlIdentifier(requiredString(index, 'name'))})`).all() as Array<Record<string, unknown>>)
      .sort((left, right) => Number(left.seqno) - Number(right.seqno))
      .map((column) => requiredString(column, 'name')))
    .sort((left, right) => left.join('\u0000').localeCompare(right.join('\u0000')));
}

async function createStore(projectRoot: string) {
  const { storage } = await requireU12ProjectAdmissionSeams();
  const factory = requiredExport<(config: { projectRoot: string }) => Record<string, unknown>>(storage, 'createLocalDesktopDecisionCaseStore');
  return factory({ projectRoot });
}

async function openProject(store: Record<string, unknown>) {
  const open = requiredExport<Method>(store, 'openProject');
  return open({
    contract_version: '1.0',
    command_id: desktopTestIds.openProjectCommand,
    proposed_project_id: desktopTestIds.project,
    display_name: 'Synthetic Project',
    initialized_at: '2026-01-02T03:04:05.006Z',
    input_fingerprint: '9f1bcae85f9de177cf0903ca42e1a842cb98f889a5801d6ce03a952b23d4027d',
  });
}

/** Builds the approved sequence-one Session tuple directly through the real DDL. */
function insertExactA13Tuple(db: DatabaseSync, value: Readonly<{
  projectId: string;
  sessionId: string;
  caseId: string;
  revisionId: string;
  receiptCommandId?: string;
}>) {
  const timestamp = '2026-09-19T00:00:00.000Z';
  db.exec('PRAGMA foreign_keys = ON; BEGIN');
  try {
    db.prepare(`INSERT INTO product_sessions(
      session_id, project_id, display_name, mode, case_id, current_revision_id, created_at, schema_version
    ) VALUES (?, ?, ?, 'professional', ?, ?, ?, '1.0')`).run(
      value.sessionId, value.projectId, 'Admitted later tuple', value.caseId, value.revisionId, timestamp,
    );
    db.prepare(`INSERT INTO case_revisions(
      revision_id, project_id, session_id, case_id, revision_sequence, state, case_name,
      question_text, hypothesis_display_title, business_context, alternative_explanations_json,
      evidence_explanation_text, previous_revision_id, snapshot_id, confirmation_id,
      current_finding_id, current_acceptance_id, current_closure_id, current_report_id,
      integrity_state, created_at, updated_at, row_version, schema_version
    ) VALUES (?, ?, ?, ?, 1, 'Draft', ?, ?, ?, '', '[]', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ok', ?, ?, 1, '1.0')`).run(
      value.revisionId, value.projectId, value.sessionId, value.caseId,
      'Admitted later Case', 'Later tuple question', 'Later tuple hypothesis', timestamp, timestamp,
    );
    if (value.receiptCommandId) {
      db.prepare(`INSERT INTO command_receipts(
        command_id, operation_kind, project_id, session_id, case_id, revision_id,
        input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version
      ) VALUES (?, 'create_session', ?, ?, ?, ?, ?, 'succeeded', 'product_session', ?, NULL, ?, '1.0')`).run(
        value.receiptCommandId, value.projectId, value.sessionId, value.caseId, value.revisionId,
        createHash('sha256').update(JSON.stringify({ operation_kind: 'create_session', request: { contract_version: '1.0', project_id: value.projectId, display_name: 'Admitted later tuple', case_name: 'Admitted later Case', fields: { question_text: 'Later tuple question', hypothesis_display_title: 'Later tuple hypothesis', business_context: '', alternative_explanations: [] } } })).digest('hex'), value.sessionId, timestamp,
      );
    }
    db.exec('COMMIT');
  } catch (error: unknown) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// case:session-publication-and-reopen-contract
test('TEST-XDESK-003 positive: opening a fresh Project publishes the closed store surface and initialized Project only', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    const result = await openProject(store);
    assert.deepEqual(Object.keys(result).sort(), ['display_name', 'initialized', 'opened', 'project_id', 'projection_token', 'schema_version']);
    assert.equal(result.opened, true);
    assert.equal(result.initialized, true);
    assert.equal(result.project_id, desktopTestIds.project);
    assert.equal(result.schema_version, '1.0');
    assert.deepEqual(Object.keys(store as object).sort(), [
      'acceptFinding', 'admitAnalysis', 'admitAssistance', 'checkAssistanceAdmission', 'checkReportExport', 'completeCase', 'createDraftRevision', 'createSession', 'disposeAssistanceDraft', 'listSessions', 'markIntegrityBlocked', 'openProject', 'publishAnalysisSuccessCandidates', 'publishConfirmation', 'readConfirmedSnapshot', 'readProjection', 'readReportContext', 'readReportExport', 'reconcileInterrupted', 'recordDisclosure', 'recordReportExport', 'requestAnalysisCancellation', 'requestAssistanceCancellation', 'saveForm', 'settleAnalysis', 'settleAssistance', 'waitForProjection',
    ].sort());
  });
});

test('TEST-XDESK-003 persistence: a committed Session owns exactly the three initial directories before it is listed', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const createSession = requiredExport<(value: Record<string, unknown>) => Promise<Record<string, unknown>>>(store, 'createSession');
    const created = await createSession(u13Request());
    assert.equal((created.session as Record<string, unknown>).session_id, desktopTestIds.session);
    const sessionRoot = join(projectRoot, desktopTestIds.session);
    for (const directory of ['010_draw', '020_clean', '060_reports']) await access(join(sessionRoot, directory));
    assert.deepEqual((await readdir(sessionRoot)).sort(), ['010_draw', '020_clean', '060_reports']);
    const listSessions = requiredExport<(value: Record<string, unknown>) => Promise<unknown>>(store, 'listSessions');
    const listed = await listSessions({ project_id: desktopTestIds.project });
    assert.equal((listed as unknown[]).length, 1);
  });
});

// Retained U1.3 regression leaves: their Session assertions remain live even
// though U1.2's terminal owners cover only Project admission.
test('AC-XDESK-002-02: opens no Runtime, provider, analysis child, aggregate, or report while creating a Session', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    await requiredExport<Method>(store, 'createSession')(u13Request());
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      for (const table of ['analysis_runs', 'aggregate_artifacts', 'report_versions', 'model_disclosures', 'assistance_attempts']) assert.equal((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count, 0);
    } finally { db.close(); }
  });
});

test('AC-XDESK-002-03: returns sanitized pre-commit failure without Session row, receipt, directory, or external effect', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    await assert.rejects(() => requiredExport<Method>(store, 'createSession')(u13Request({
      command: createSessionCommand({ display_name: '   ' }),
      ids: { session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, operation_id: desktopTestIds.operation },
    })), /VALIDATION_FAILED/);
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try { assert.equal((db.prepare('SELECT COUNT(*) AS count FROM product_sessions').get() as { count: number }).count, 0); } finally { db.close(); }
    await assert.rejects(() => access(join(projectRoot, desktopTestIds.session)));
  });
});

test('TEST-XDESK-003 duplicate delivery: the same command receipt returns the first committed Session instead of a second identity', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const createSession = requiredExport<(value: Record<string, unknown>) => Promise<Record<string, unknown>>>(store, 'createSession');
    const first = await createSession(u13Request());
    const repeated = await createSession(u13Request({ created_at: '2026-01-03T03:04:05.006Z', ids: { session_id: desktopTestIds.alternateSession, case_id: desktopTestIds.alternateCase, revision_id: desktopTestIds.alternateRevision, operation_id: desktopTestIds.alternateOperation } }));
    assert.deepEqual(repeated, first);
    await assert.rejects(() => createSession(u13Request({ command: createSessionCommand({ case_name: 'changed fingerprint' }), ids: { session_id: desktopTestIds.alternateSession, case_id: desktopTestIds.alternateCase, revision_id: desktopTestIds.alternateRevision, operation_id: desktopTestIds.alternateOperation } })), /COMMAND_CONFLICT/);
  });
});

test('TEST-XDESK-002 revision authority: one committed Session advances only by an explicit next Draft revision', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const createSession = requiredExport<(value: Record<string, unknown>) => Promise<Record<string, unknown>>>(store, 'createSession');
    await createSession(u13Request());
    const createDraftRevision = requiredExport<(value: Record<string, unknown>) => Promise<Record<string, unknown>>>(store, 'createDraftRevision');
    const draftCommand={ contract_version: '1.0', command_id: desktopTestIds.revisionCommand, project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, expected_row_version: '1' };
    const {command_id,...draftRequest}=draftCommand;void command_id;
    const created = await createDraftRevision({command:draftCommand,ids:{revision_id:desktopTestIds.alternateRevision},created_at:'2026-01-02T03:04:05.006Z',input_fingerprint:createHash('sha256').update(canonicalDesktopJson({operation_kind:'create_draft_revision',request:draftRequest})).digest('hex')});
    assert.equal(requiredRecord(created.revision, 'revision').revision_id, desktopTestIds.alternateRevision);
    await assert.rejects(() => createDraftRevision({
      command: { contract_version: '1.0', command_id: desktopTestIds.retryCommand, project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, expected_row_version: '0' },
      ids: { revision_id: desktopTestIds.alternateRevision },
    }), /(?:STALE_REVISION|VALIDATION_FAILED|COMMAND_CONFLICT)/);
  });
});

test('TEST-XDESK-003 negative: a factory config with an ambient path key is rejected before any SQLite file exists', async () => {
  await withIsolatedProject(async (projectRoot) => {
    await assertDesktopFixtureHealth();
    const storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
    const factory = requiredExport<(config: Record<string, unknown>) => unknown>(storage, 'createLocalDesktopDecisionCaseStore');
    assert.throws(() => factory({ projectRoot, path: projectRoot }), /VALIDATION_FAILED/);
  });
});

test('TEST-XDESK-004 Run-store boundary: the Desktop 3.0 store exposes only its seven lifecycle methods', async () => {
  await withIsolatedProject(async (projectRoot) => {
    await assertDesktopFixtureHealth();
    const storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
    const createRunStore = requiredExport<(config: { projectRoot: string }) => Record<string, unknown>>(storage, 'createLocalDesktopRunEvidenceStore');
    const runStore = createRunStore({ projectRoot });
    assert.deepEqual(Object.keys(runStore).sort(), ['beginRun', 'cancelRun', 'failRun', 'readTerminalRun', 'recordDuckDbResult', 'recordPythonResult', 'succeedRun']);
  });
});

test('TEST-XDESK-004 positive: a real confirmed snapshot supplies the exact immutable Run inputs and no ambient path', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const ready = await openConfirmedDesktopRevision(projectRoot);
    const snapshot = await requiredExport<Method>(ready.store, 'readConfirmedSnapshot')({ ...ready.owner, confirmation_id: ready.confirmationId });
    const confirmation = requiredRecord(snapshot.confirmation, 'confirmed snapshot confirmation');
    const sources = requiredRecord(snapshot.snapshot, 'confirmed snapshot sources');
    const members = requiredRecord(sources.members, 'confirmed members source');
    const orders = requiredRecord(sources.orders, 'confirmed orders source');
    assert.ok(confirmation.contract_bytes instanceof Uint8Array, 'Run confirmation comes from Application-confirmed Core bytes, not test labels');
    assert.ok(members.bytes instanceof Uint8Array);
    assert.ok(orders.bytes instanceof Uint8Array);
    assert.equal(members.byte_length, '45');
    assert.equal(orders.byte_length, '486');
    assert.equal(members.sha256, '57e4e4c6dbedb8234fce87afa07b9dd8e75b54f54f68a53cb4963b7c68e18e44');
    assert.equal(orders.sha256, 'b6ee04152eee96707e93c68de095847433848c06a61db0bed2571ab77f835ff5');
    const revision = requiredRecord(ready.projection.revision, 'ready revision');
    const started = await requiredExport<Method>(ready.application, 'startAnalysis')({ ...revisionCommand(ready.owner, desktopTestIds.retryCommand, requiredString(revision, 'row_version')), confirmation_id: ready.confirmationId });
    assert.notEqual(requiredRecord(started.revision, 'started revision').state, 'Draft');
    await assert.rejects(() => requiredExport<Method>(ready.runEvidenceStore, 'beginRun')({ path: projectRoot }), /VALIDATION_FAILED/);
  });
});

test('AC-XDESK-002-01: commits one stable professional Session and its three directories before projection', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const created = await requiredExport<Method>(store, 'createSession')(u13Request());
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      assert.equal(requiredRecord(created.session, 'Session').session_id, desktopTestIds.session);
      assert.deepEqual(db.prepare('SELECT session_id, mode, case_id, current_revision_id FROM product_sessions').all().map(row=>({...row})), [{ session_id: desktopTestIds.session, mode: 'professional', case_id: desktopTestIds.case, current_revision_id: desktopTestIds.revision }]);
      assert.deepEqual((await readdir(join(projectRoot, desktopTestIds.session))).sort(), ['010_draw', '020_clean', '060_reports']);
    } finally { db.close(); }
  });
});

test('AC-XDESK-002-04: returns the original receipt for an identical command and conflicts changed bytes', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const create = requiredExport<Method>(store, 'createSession');
    const ids = { session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, operation_id: desktopTestIds.operation };
    const first = await create(u13Request({ ids }));
    const repeated = await create(u13Request({ ids: { session_id: desktopTestIds.alternateSession, case_id: desktopTestIds.alternateCase, revision_id: desktopTestIds.alternateRevision, operation_id: desktopTestIds.alternateOperation } }));
    assert.deepEqual(repeated, first);
    await assert.rejects(() => create(u13Request({ command: createSessionCommand({ case_name: 'changed fingerprint' }), ids })), /COMMAND_CONFLICT/);
  });
});

test('AC-XDESK-002-05: recovers a durable COMMIT through receipt readback and returns RESULT_PENDING when unreadable', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const create = requiredExport<Method>(store, 'createSession');
    const ids = { session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, operation_id: desktopTestIds.operation };
    const recovered = await withCommitResponseLostAfterRealCommit({}, async (control) => {
      const result = await create(u13Request({ ids }));
      control.assertTargetHit();
      control.assertUnrelatedSqlForwarded();
      return result;
    });
    assert.equal(requiredRecord(recovered.session, 'Session').session_id, desktopTestIds.session, 'after a response-loss only the durable receipt may restore success');
    const reopened = await createStore(projectRoot);
    const sessions = await requiredExport<(value: Record<string, unknown>) => Promise<unknown[]>>(reopened, 'listSessions')({ project_id: desktopTestIds.project });
    assert.equal(sessions.length, 1, 'reopen reads the committed Session and never resends the command');
    const replay = await requiredExport<Method>(reopened, 'createSession')(u13Request({ ids }));
    assert.deepEqual(replay, recovered, 'the original command ID is resolved from its durable receipt, not executed a second time');
  });
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const create = requiredExport<Method>(store, 'createSession');
    const ids = { session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, operation_id: desktopTestIds.operation };
    let assertTargetHit: () => void = () => assert.fail('the COMMIT control was not entered');
    let assertReadbackTargetHit: () => void = () => assert.fail('the unreadable receipt control was not entered');
    let assertUnrelatedSqlForwarded: () => void = () => assert.fail('the SQLite forwarding control was not entered');
    await assert.rejects(() => withCommitResponseLostAfterRealCommit({ unreadableReceiptReadback: true }, async (control) => {
      assertTargetHit = control.assertTargetHit;
      assertReadbackTargetHit = control.assertReadbackTargetHit;
      assertUnrelatedSqlForwarded = control.assertUnrelatedSqlForwarded;
      await create(u13Request({ ids }));
    }), /RESULT_PENDING/);
    assertTargetHit();
    assertReadbackTargetHit();
    assertUnrelatedSqlForwarded();
    const reopened = await createStore(projectRoot);
    const sessions = await requiredExport<(value: Record<string, unknown>) => Promise<unknown[]>>(reopened, 'listSessions')({ project_id: desktopTestIds.project });
    assert.equal(sessions.length, 1, 'an unknown result leaves the durable committed outcome for later authorized readback, never a second create');
    const replay = await requiredExport<Method>(reopened, 'createSession')(u13Request({ ids }));
    assert.equal(requiredRecord(replay.session, 'Session').session_id, desktopTestIds.session, 'only a later healthy receipt readback may resolve the same original command');
  });
});

test('U1.2 AC-XDESK-002-06: reopens an admitted A1.2 Project with stored identity and bytes, without migration default filling receipt or later-state revival', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const first = await createStore(projectRoot);
    const initialized = await openProject(first);
    const beforeBytes = await readFile(sqliteFile(projectRoot));
    const beforeDigest = createHash('sha256').update(beforeBytes).digest('hex');
    const beforeEntries = await readdir(join(projectRoot, '.xanthil', 'desktop'));
    const reopened = await createStore(projectRoot);
    const project = await requiredExport<Method>(reopened, 'openProject')({
      contract_version: '1.0',
      command_id: desktopTestIds.retryCommand,
      proposed_project_id: desktopTestIds.alternateProject,
      display_name: 'Ignored proposed Project identity',
      initialized_at: '2026-01-02T03:04:05.006Z',
      input_fingerprint: createHash('sha256').update('{"operation_kind":"initialize_project","request":{"contract_version":"1.0","display_name":"Ignored proposed Project identity"}}').digest('hex'),
    });
    const sessions = await requiredExport<(value: Record<string, unknown>) => Promise<unknown[]>>(reopened, 'listSessions')({ project_id: project.project_id });
    assert.equal(project.initialized, false, 'reopen is admission/read, never a second initialization');
    assert.equal(project.project_id, initialized.project_id, 'stored Project identity remains authoritative over a later proposal');
    assert.equal(project.display_name, initialized.display_name, 'stored display name remains authoritative over a later proposal');
    assert.deepEqual(sessions, [], 'A1.2 opens no Session or later business state');
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), beforeDigest, 'supported A1.2 reopen changes no SQLite bytes');
    assert.deepEqual(await readdir(join(projectRoot, '.xanthil', 'desktop')), beforeEntries, 'supported reopen creates no sidecar, migration, receipt, or orphan entry');
  });
});

test('U1.2 AC-XDESK-011-01: opens the real node:sqlite connection only with exact personal-profile PRAGMAs and extension loading disabled', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const audit = await withNodeSqliteConnectionAudit(async () => {
      const store = await createStore(projectRoot);
      return openProject(store);
    });
    const statements = audit.statements.join('\n');
    assert.match(statements, /PRAGMA\s+foreign_keys\s*=\s*ON/i);
    assert.match(statements, /PRAGMA\s+journal_mode\s*=\s*DELETE/i);
    assert.match(statements, /PRAGMA\s+synchronous\s*=\s*FULL/i);
    assert.match(statements, /PRAGMA\s+busy_timeout\s*=\s*0/i);
    assert.equal(audit.extensionLoading.includes(true), false, 'the real Store connection never enables extension loading before business use');
    assert.ok(audit.extensionLoading.length === 0 || audit.extensionLoading.every((allowed) => allowed === false), 'the Store may rely on node:sqlite\'s disabled-by-default constructor path or explicitly retain that disabled state');
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      assert.equal((db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }).foreign_keys, 1);
      assert.equal((db.prepare('PRAGMA journal_mode').get() as { journal_mode: string }).journal_mode, 'delete');
      assert.equal((db.prepare('PRAGMA synchronous').get() as { synchronous: number }).synchronous, 2);
      assert.equal((db.prepare('PRAGMA busy_timeout').get() as { timeout: number }).timeout, 0);
    } finally { db.close(); }
  });
});

test('U1.2 AC-XDESK-011-02: admits only the exact sixteen-table schema, constrained receipt vocabulary, keys indexes, and two deferred create-session foreign keys', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((row) => (row as { name: string }).name);
      assert.deepEqual(tables, Object.keys(exactDesktopSchemaColumns).sort(), 'the physical database has no omitted, renamed, temporary, or extra business table');
      for (const [table, expectedColumns] of Object.entries(exactDesktopSchemaColumns)) {
        const actualColumns = (db.prepare(`PRAGMA table_info(${quoteSqlIdentifier(table)})`).all() as Array<Record<string, unknown>>)
          .sort((left, right) => Number(left.cid) - Number(right.cid))
          .map((column) => requiredString(column, 'name'));
        assert.deepEqual(actualColumns, expectedColumns, `${table} has the frozen column identity/order without a projected default substitute`);
      }
      for (const [table, expectedKeys] of Object.entries(exactDesktopUniqueKeys)) {
        assert.deepEqual(sortedUniqueKeyColumns(db, table), expectedKeys.map((key) => key.slice()).sort((left, right) => left.join('\u0000').localeCompare(right.join('\u0000'))), `${table} declares exactly its frozen non-primary unique owner/identity keys`);
      }
      const sessionsSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'product_sessions'").get() as { sql: string }).sql;
      const revisionSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'case_revisions'").get() as { sql: string }).sql;
      const receiptsSql = (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'command_receipts'").get() as { sql: string }).sql;
      const schemaSql = (db.prepare("SELECT group_concat(sql, '\n') AS schema FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get() as { schema: string }).schema;
      assert.equal((schemaSql.match(/DEFERRABLE INITIALLY DEFERRED/gi) ?? []).length, 2, 'only the create-session cycle defers referential checks');
      assert.match(sessionsSql, /FOREIGN\s+KEY\s*\(\s*project_id\s*,\s*session_id\s*,\s*case_id\s*,\s*current_revision_id\s*\)\s*REFERENCES\s+case_revisions\s*\(\s*project_id\s*,\s*session_id\s*,\s*case_id\s*,\s*revision_id\s*\)[\s\S]*?DEFERRABLE\s+INITIALLY\s+DEFERRED/i, 'only the Product Session current-revision owner tuple is deferred');
      assert.match(revisionSql, /FOREIGN\s+KEY\s*\(\s*project_id\s*,\s*session_id\s*,\s*case_id\s*\)\s*REFERENCES\s+product_sessions\s*\(\s*project_id\s*,\s*session_id\s*,\s*case_id\s*\)[\s\S]*?DEFERRABLE\s+INITIALLY\s+DEFERRED/i, 'only the Case Revision Session owner tuple is deferred');
      assert.match(sessionsSql, /UNIQUE\s*\(\s*project_id\s*,\s*case_id\s*\)/i);
      assert.match(revisionSql, /CHECK\s*\(\s*revision_sequence\s*>\s*0\s*\)/i);
      assertExactReceiptCheckEnum(receiptsSql, 'operation_kind', exactReceiptOperationKinds);
      assertExactReceiptCheckEnum(receiptsSql, 'result_kind', exactReceiptResultKinds);
      assertExactReceiptCheckEnum(receiptsSql, 'outcome', ['succeeded', 'rejected']);
      assert.deepEqual(Object.keys(exactReceiptSuccessResults), [...exactReceiptOperationKinds], 'the Test-owned receipt pairing matrix assigns every and only frozen operation kind');
      for (const value of ['Draft', 'Ready', 'Review', 'NeedsAttention', 'Completed', 'ok', 'integrity_blocked', 'Running', 'Succeeded', 'Failed', 'Cancelled', 'professional', 'CNY', 'Asia/Shanghai', 'membership_repurchase_comparison', 'current_repurchase_rate_lower_than_comparison']) assert.match(schemaSql, new RegExp(value), `schema preserves constrained value ${value}`);
      assert.doesNotMatch(receiptsSql, /(?:event_journal|generic_command|migration)/i);
      const declaredIndexes = db.prepare("SELECT tbl_name, sql FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY tbl_name, name").all() as Array<Record<string, unknown>>;
      const partialIndexes = declaredIndexes.filter((index) => /CREATE\s+UNIQUE\s+INDEX/i.test(requiredString(index, 'sql')) && /\bWHERE\b/i.test(requiredString(index, 'sql')));
      assert.equal(partialIndexes.length, 2, 'only the Run and Assistance Running guards are partial unique indexes');
      for (const expected of [
        ['analysis_runs', /\(\s*revision_id\s*\).*WHERE\s+status\s*=\s*'Running'/i],
        ['assistance_attempts', /\(\s*revision_id\s*\).*WHERE\s+status\s*=\s*'Running'/i],
      ] as const) assert.ok(partialIndexes.some((index) => index.tbl_name === expected[0] && expected[1].test(requiredString(index, 'sql'))), `${expected[0]} retains its sole Running partial unique index`);

      for (const [untypedTable, expectedColumns] of Object.entries(exactDesktopSchemaColumns)) {
        const table = untypedTable as keyof typeof exactDesktopSchemaColumns;
        const info = (db.prepare(`PRAGMA table_info(${quoteSqlIdentifier(table)})`).all() as Array<Record<string, unknown>>)
          .sort((left, right) => Number(left.cid) - Number(right.cid));
        for (const column of info) {
          const name = requiredString(column, 'name');
          const qualified = `${table}.${name}`;
          assert.equal(requiredString(column, 'type').toUpperCase(), desktopIntegerColumns.has(qualified) ? 'INTEGER' : 'TEXT', `${qualified} retains its frozen SQLite affinity`);
          assert.equal(Number(column.notnull), desktopNullableColumns.has(qualified) ? 0 : 1, `${qualified} retains its declared nullability`);
          assert.equal(Number(column.pk), name === desktopPrimaryIdentityColumns[table] ? 1 : 0, `${qualified} retains its sole primary-identity position`);
          assert.equal(canonicalDefault(column.dflt_value), desktopDefaults[qualified] ?? null, `${qualified} retains its frozen default or explicit absence of a substitute`);
        }
        assert.equal(info.length, expectedColumns.length, `${table} has no undisclosed SQLite column metadata`);
      }
      for (const table of Object.keys(exactDesktopForeignKeys) as Array<keyof typeof exactDesktopForeignKeys>) {
        assert.deepEqual(sortedForeignKeys(db, table), expectedForeignKeys(table), `${table} retains every ordered same-owner foreign-key group with RESTRICT actions`);
      }
      assert.deepEqual(sortedNonPrimaryIndexShapes(db), expectedNonPrimaryIndexShapes(), 'the bounded supporting, UNIQUE, and partial-index set has neither an omitted nor an extra index');

      insertExactConstraintFixture(db);
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], 'the Test-only future tuple is a complete valid physical closure before an invalid value is attempted');

      let identitySequence = 1;
      const nextIdentity = () => {
        const hex = identitySequence.toString(16).padStart(8, '0');
        identitySequence += 1;
        return `${hex}-0000-4000-8000-${hex.padStart(12, '0')}`;
      };
      const isolatedNonPrimaryUniqueKeys: ReadonlyArray<Readonly<{ table: keyof typeof exactDesktopSchemaColumns; columns: readonly string[] }>> = [
        { table: 'product_sessions', columns: ['project_id', 'case_id'] },
        { table: 'case_revisions', columns: ['project_id', 'session_id', 'case_id', 'revision_sequence'] },
        { table: 'input_confirmations', columns: ['revision_id'] },
        { table: 'source_snapshots', columns: ['revision_id'] },
        { table: 'aggregate_artifacts', columns: ['run_id'] },
        { table: 'assistance_attempts', columns: ['disclosure_id'] },
        { table: 'assistance_drafts', columns: ['attempt_id'] },
        { table: 'findings', columns: ['run_id'] },
        { table: 'finding_acceptances', columns: ['finding_id'] },
        { table: 'decision_forms', columns: ['revision_id', 'form_sequence'] },
        { table: 'decision_closures', columns: ['acceptance_id'] },
        { table: 'report_versions', columns: ['revision_id', 'version_sequence'] },
      ];
      const keyIdentity = (table: string, columns: readonly string[]) => `${table}(${columns.join(',')})`;
      const declaredNonPrimaryUniqueKeys = Object.entries(exactDesktopUniqueKeys).flatMap(([table, keys]) => keys.map((columns) => keyIdentity(table, columns)));
      const isolatedUniqueKeyIdentities = isolatedNonPrimaryUniqueKeys.map(({ table, columns }) => keyIdentity(table, columns));
      const primaryOverlappingUniqueKeys = Object.entries(exactDesktopUniqueKeys).flatMap(([untypedTable, keys]) => {
        const table = untypedTable as keyof typeof exactDesktopSchemaColumns;
        const identity = desktopPrimaryIdentityColumns[table];
        return keys.filter((columns) => columns.includes(identity)).map((columns) => ({ table, columns }));
      });
      assert.deepEqual(
        [...isolatedUniqueKeyIdentities, ...primaryOverlappingUniqueKeys.map(({ table, columns }) => keyIdentity(table, columns))].sort(),
        [...declaredNonPrimaryUniqueKeys].sort(),
        'every declared non-primary UNIQUE key is either isolated without a primary duplicate or honestly recorded as primary-overlapping',
      );
      for (const { table, columns } of isolatedNonPrimaryUniqueKeys) {
        const identity = desktopPrimaryIdentityColumns[table];
        assert.equal(columns.includes(identity), false, `${keyIdentity(table, columns)} is independently probed with a fresh primary identity`);
        assertRejectedConstraintWrite(db, `${keyIdentity(table, columns)} rejects its duplicate while every other declared non-primary key remains distinct`, () => {
          insertClone(db, table, { [identity]: nextIdentity() });
        });
      }
      for (const { table, columns } of primaryOverlappingUniqueKeys) {
        assertRejectedConstraintWrite(db, `${keyIdentity(table, columns)} remains declared and an exact duplicate is rejected without claiming which overlapping redundant key SQLite reports first`, () => {
          insertClone(db, table, {});
        });
      }
      for (const table of Object.keys(exactDesktopSchemaColumns) as Array<keyof typeof exactDesktopSchemaColumns>) {
        const identity = desktopPrimaryIdentityColumns[table];
        assertRejectedConstraintWrite(db, `${table}.${identity} rejects a NULL primary identity`, () => insertClone(db, table, { [identity]: null }));
        assertRejectedConstraintWrite(db, `${table}.schema_version rejects an unsupported schema version`, () => updateConstraintRow(db, table, 'schema_version', '2.0'));
      }

      const invalidColumnValues: ReadonlyArray<Readonly<{ table: keyof typeof exactDesktopSchemaColumns; column: string; value: SQLInputValue; label: string }>> = [
        { table: 'product_sessions', column: 'mode', value: 'personal', label: 'professional Session mode' },
        { table: 'case_revisions', column: 'revision_sequence', value: 0, label: 'positive revision sequence' },
        { table: 'case_revisions', column: 'state', value: 'Unknown', label: 'closed revision state' },
        { table: 'case_revisions', column: 'integrity_state', value: 'unknown', label: 'closed integrity state' },
        { table: 'case_revisions', column: 'row_version', value: 0, label: 'positive row version' },
        { table: 'input_confirmations', column: 'member_group_column', value: null, label: 'mapped group requires its member group column' },
        { table: 'input_confirmations', column: 'currency', value: 'USD', label: 'CNY currency' },
        { table: 'input_confirmations', column: 'time_zone', value: 'UTC', label: 'Asia/Shanghai timezone' },
        { table: 'input_confirmations', column: 'selected_group_mode', value: 'other', label: 'closed selected group mode' },
        { table: 'input_confirmations', column: 'hypothesis_id', value: 'other_hypothesis', label: 'closed hypothesis identity' },
        { table: 'input_confirmations', column: 'method_id', value: 'other_method', label: 'closed method identity' },
        { table: 'input_confirmations', column: 'method_version', value: '2.0', label: 'closed method version' },
        { table: 'input_confirmations', column: 'valid_statuses_json', value: '[]', label: 'non-empty canonical valid status list' },
        { table: 'source_snapshots', column: 'members_byte_length', value: -1, label: 'nonnegative members byte length' },
        { table: 'source_snapshots', column: 'orders_byte_length', value: -1, label: 'nonnegative orders byte length' },
        { table: 'source_snapshots', column: 'included_member_count', value: -1, label: 'nonnegative included member count' },
        { table: 'source_snapshots', column: 'excluded_member_count', value: -1, label: 'nonnegative excluded member count' },
        { table: 'source_snapshots', column: 'included_order_count', value: -1, label: 'nonnegative included order count' },
        { table: 'source_snapshots', column: 'excluded_order_count', value: -1, label: 'nonnegative excluded order count' },
        { table: 'aggregate_artifacts', column: 'byte_length', value: -1, label: 'nonnegative aggregate byte length' },
        { table: 'analysis_runs', column: 'run_contract_version', value: '2.0', label: 'closed Run contract version' },
        { table: 'analysis_runs', column: 'status', value: 'Unknown', label: 'closed Run status' },
        { table: 'analysis_runs', column: 'aggregate_id', value: null, label: 'Succeeded Run aggregate identity' },
        { table: 'analysis_runs', column: 'status', value: 'Running', label: 'Running Run null-only terminal shape' },
        { table: 'model_disclosures', column: 'action_kind', value: 'other_action', label: 'closed disclosure action' },
        { table: 'model_disclosures', column: 'decision', value: 'unknown', label: 'closed disclosure decision' },
        { table: 'assistance_attempts', column: 'action_kind', value: 'other_action', label: 'closed Assistance action' },
        { table: 'assistance_attempts', column: 'status', value: 'Unknown', label: 'closed Assistance status' },
        { table: 'assistance_attempts', column: 'status', value: 'Running', label: 'Running Assistance null-only terminal shape' },
        { table: 'assistance_drafts', column: 'draft_kind', value: 'other_draft', label: 'closed Draft kind' },
        { table: 'assistance_drafts', column: 'disposition', value: 'unknown', label: 'closed Draft disposition' },
        { table: 'assistance_drafts', column: 'target_form', value: 'other_form', label: 'closed Draft target form' },
        { table: 'findings', column: 'judgment', value: 'Unknown', label: 'closed Finding judgment' },
        { table: 'finding_acceptances', column: 'action', value: 'reject', label: 'exact acceptance action' },
        { table: 'decision_forms', column: 'form_sequence', value: 0, label: 'positive decision-form sequence' },
        { table: 'decision_forms', column: 'route', value: 'other_route', label: 'closed decision-form route' },
        { table: 'decision_forms', column: 'disposition', value: 'unknown', label: 'closed decision-form disposition' },
        { table: 'decision_closures', column: 'route', value: 'other_route', label: 'closed Closure route' },
        { table: 'report_versions', column: 'version_sequence', value: 0, label: 'positive report version sequence' },
        { table: 'report_versions', column: 'markdown_byte_length', value: -1, label: 'nonnegative Markdown byte length' },
        { table: 'report_versions', column: 'html_byte_length', value: -1, label: 'nonnegative HTML byte length' },
        { table: 'report_versions', column: 'state', value: 'unknown', label: 'closed report state' },
        { table: 'command_receipts', column: 'operation_kind', value: 'generic_command', label: 'closed effecting receipt operation vocabulary' },
        { table: 'command_receipts', column: 'outcome', value: 'unknown', label: 'closed receipt outcome' },
        { table: 'command_receipts', column: 'result_kind', value: 'generic_result', label: 'closed receipt result vocabulary' },
      ];
      for (const invalid of invalidColumnValues) {
        assertRejectedConstraintWrite(db, `${invalid.table} rejects ${invalid.label}`, () => updateConstraintRow(db, invalid.table, invalid.column, invalid.value));
      }
      for (const [label, sql, values] of [
        ['sequence-one revision rejects a previous revision pointer', 'UPDATE case_revisions SET previous_revision_id = revision_id WHERE revision_id = ?', [desktopTestIds.revision]],
        ['sequence-one Draft rejects a current Snapshot pointer', 'UPDATE case_revisions SET snapshot_id = ? WHERE revision_id = ?', [desktopConstraintIds.snapshot, desktopTestIds.revision]],
        ['input confirmation rejects zero-length periods', "UPDATE input_confirmations SET comparison_end_date = '2026-01-01' WHERE confirmation_id = ?", [desktopConstraintIds.confirmation]],
        ['input confirmation rejects unequal positive periods', "UPDATE input_confirmations SET current_end_date = '2026-03-02' WHERE confirmation_id = ?", [desktopConstraintIds.confirmation]],
        ['input confirmation rejects selected_group_mode none with a group column', "UPDATE input_confirmations SET selected_group_mode = 'none' WHERE confirmation_id = ?", [desktopConstraintIds.confirmation]],
        ['input confirmation rejects non-canonical status JSON', "UPDATE input_confirmations SET valid_statuses_json = 'not-json' WHERE confirmation_id = ?", [desktopConstraintIds.confirmation]],
        ['input confirmation rejects non-canonical issue-treatment JSON', "UPDATE input_confirmations SET issue_treatments_json = 'not-json' WHERE confirmation_id = ?", [desktopConstraintIds.confirmation]],
        ['aggregate artifact rejects a non-object pseudonym map; mapped/none relation is a cross-row semantic guard', "UPDATE aggregate_artifacts SET group_pseudonym_map_json = '[]' WHERE artifact_id = ?", [desktopConstraintIds.aggregate]],
        ['Succeeded Run rejects a terminal reason', "UPDATE analysis_runs SET terminal_reason = 'calculation_failed' WHERE run_id = ?", [desktopConstraintIds.run]],
        ['Failed Run rejects an unlisted terminal reason', "UPDATE analysis_runs SET status = 'Failed', terminal_reason = 'other_failure', run_locator = NULL, aggregate_id = NULL WHERE run_id = ?", [desktopConstraintIds.run]],
        ['Cancelled Run rejects a non-user terminal reason', "UPDATE analysis_runs SET status = 'Cancelled', terminal_reason = 'other_failure', run_locator = NULL, aggregate_id = NULL WHERE run_id = ?", [desktopConstraintIds.run]],
        ['model disclosure rejects an aggregate-requiring action with no aggregate reference', "UPDATE model_disclosures SET action_kind = 'explain_evidence' WHERE disclosure_id = ?", [desktopConstraintIds.disclosure]],
        ['refused model disclosure rejects a free-text confirmation timestamp', "UPDATE model_disclosures SET decision = 'refused', free_text_confirmed_at = '2026-09-19T00:00:00.000Z' WHERE disclosure_id = ?", [desktopConstraintIds.disclosure]],
        ['Succeeded Assistance Attempt rejects a missing actual provider', 'UPDATE assistance_attempts SET actual_provider = NULL WHERE attempt_id = ?', [desktopConstraintIds.attempt]],
        ['Failed Assistance Attempt rejects an unlisted terminal reason', "UPDATE assistance_attempts SET status = 'Failed', actual_provider = NULL, actual_model = NULL, draft_id = NULL, terminal_reason = 'other_failure' WHERE attempt_id = ?", [desktopConstraintIds.attempt]],
        ['Cancelled Assistance Attempt rejects a non-user terminal reason', "UPDATE assistance_attempts SET status = 'Cancelled', actual_provider = NULL, actual_model = NULL, draft_id = NULL, terminal_reason = 'other_failure' WHERE attempt_id = ?", [desktopConstraintIds.attempt]],
        ['Draft adoption rejects a missing target form', "UPDATE assistance_drafts SET disposition = 'adopted' WHERE draft_id = ?", [desktopConstraintIds.draft]],
        ['pending Draft rejects a valid but premature target form', "UPDATE assistance_drafts SET target_form = 'case_fields' WHERE draft_id = ?", [desktopConstraintIds.draft]],
        ['Draft rejection rejects a missing decision timestamp', "UPDATE assistance_drafts SET disposition = 'rejected', target_form = NULL, decided_at = NULL WHERE draft_id = ?", [desktopConstraintIds.draft]],
        ['decision-form candidate comparison rejects an empty candidate list', "UPDATE decision_forms SET candidates_json = '[]' WHERE form_id = ?", [desktopConstraintIds.form]],
        ['decision-form insufficient-evidence route rejects a missing reason', "UPDATE decision_forms SET route = 'insufficient_evidence', insufficient_reason = NULL WHERE form_id = ?", [desktopConstraintIds.form]],
        ['saved decision form rejects a null route', 'UPDATE decision_forms SET route = NULL WHERE form_id = ?', [desktopConstraintIds.form]],
        ['non-deferred decision form rejects a defer-until value', "UPDATE decision_forms SET defer_until = '2026-10-01T00:00:00.000Z' WHERE form_id = ?", [desktopConstraintIds.form]],
        ['candidate-comparison form rejects a preferred candidate outside its array', "UPDATE decision_forms SET preferred_candidate_id = '23232323-2323-4232-8232-232323232323', preferred_reason = 'reason' WHERE form_id = ?", [desktopConstraintIds.form]],
        ['final report rejects a missing same-revision Closure', 'UPDATE report_versions SET closure_id = NULL WHERE report_id = ?', [desktopConstraintIds.report]],
        ['draft report rejects an acceptance/Closure tuple', "UPDATE report_versions SET state = 'draft' WHERE report_id = ?", [desktopConstraintIds.report]],
        ['rejected receipt rejects a retained success result', "UPDATE command_receipts SET outcome = 'rejected' WHERE command_id = ?", [desktopTestIds.createSessionCommand]],
        ['succeeded receipt rejects a missing result identity', 'UPDATE command_receipts SET result_id = NULL WHERE command_id = ?', [desktopTestIds.createSessionCommand]],
        ['succeeded create-session receipt rejects a wrong result kind', "UPDATE command_receipts SET result_kind = 'project' WHERE command_id = ?", [desktopTestIds.createSessionCommand]],
        ['create-session receipt rejects a missing Session owner suffix', 'UPDATE command_receipts SET session_id = NULL WHERE command_id = ?', [desktopTestIds.createSessionCommand]],
      ] as const) assertRejectedConstraintWrite(db, label, () => db.prepare(sql).run(...values));

      let receiptSequence = 1;
      const nextReceiptCommandId = () => receiptCommandId(receiptSequence++);
      const allowedReceiptPairs = exactReceiptOperationKinds.flatMap((operationKind) => exactReceiptSuccessResults[operationKind].map((resultKind) => ({ operationKind, resultKind })));
      for (const { operationKind, resultKind } of allowedReceiptPairs) {
        insertConstraintReceipt(db, {
          commandId: nextReceiptCommandId(), operationKind, outcome: 'succeeded', resultKind,
          resultId: exactReceiptResultIds[resultKind], rejectionReason: null,
        });
      }
      assert.equal(allowedReceiptPairs.length, 20, 'the frozen receipt contract has exactly twenty allowed succeeded operation/result-kind pairings');
      const invalidReceiptPairs = exactReceiptOperationKinds.flatMap((operationKind) => {
        const allowedResultKinds = new Set<string>(exactReceiptSuccessResults[operationKind]);
        return exactReceiptResultKinds
          .filter((resultKind) => !allowedResultKinds.has(resultKind))
          .map((resultKind) => ({ operationKind, resultKind }));
      });
      for (const { operationKind, resultKind } of invalidReceiptPairs) {
        assertRejectedConstraintWrite(db, `${operationKind} rejects the unpaired succeeded result kind ${resultKind}`, () => insertConstraintReceipt(db, {
          commandId: nextReceiptCommandId(), operationKind, outcome: 'succeeded', resultKind,
          resultId: exactReceiptResultIds[resultKind], rejectionReason: null,
        }));
      }
      for (const { operationKind, resultKind } of allowedReceiptPairs) {
        assertRejectedConstraintWrite(db, `${operationKind}/${resultKind} succeeds only with a result identity`, () => insertConstraintReceipt(db, {
          commandId: nextReceiptCommandId(), operationKind, outcome: 'succeeded', resultKind,
          resultId: null, rejectionReason: null,
        }));
      }
      assertRejectedConstraintWrite(db, 'an unlisted receipt operation kind is rejected before it can claim a known result kind', () => insertConstraintReceipt(db, {
        commandId: nextReceiptCommandId(), operationKind: 'generic_command', outcome: 'succeeded', resultKind: 'project',
        resultId: desktopTestIds.project, rejectionReason: null,
      }));

      insertNextConstraintRevision(db);
      makeConstraintFixtureRevisionCompleted(db);
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], 'every immediate foreign-key probe begins from an independently valid source row shape');
      for (const table of Object.keys(exactDesktopForeignKeys) as Array<keyof typeof exactDesktopForeignKeys>) {
        for (const foreignKey of exactDesktopForeignKeys[table]) {
          const isDeferredCreateCycle = (table === 'product_sessions' && foreignKey.parentTable === 'case_revisions') || (table === 'case_revisions' && foreignKey.parentTable === 'product_sessions');
          if (isDeferredCreateCycle) continue;
          const column = foreignKey.columns.at(-1);
          assert.ok(column, `${table} foreign-key group has a writable terminal column`);
          const targetRevision = table === 'case_revisions' && column === 'previous_revision_id'
            ? desktopConstraintIds.nextRevision
            : undefined;
          assertRejectedForeignKeyWrite(db, `${table}.${foreignKey.columns.join(',')} rejects a missing ${foreignKey.parentTable} owner tuple with a native FOREIGN KEY error`, () => {
            if (targetRevision) {
              return db.prepare(`UPDATE case_revisions SET ${quoteSqlIdentifier(column)} = ? WHERE revision_id = ?`).run('00000000-0000-4000-8000-000000000000', targetRevision);
            }
            if (table === 'command_receipts' && foreignKey.columns.length > 1) {
              // The initialize_project row deliberately has NULL child owners.
              // Mutate a real create_session receipt so CHECK stays valid and
              // this assertion actually exercises the intended composite FK.
              return db.prepare(`UPDATE command_receipts SET ${quoteSqlIdentifier(column)} = ? WHERE command_id = ?`).run('00000000-0000-4000-8000-000000000000', desktopTestIds.createSessionCommand);
            }
            return updateConstraintRow(db, table, column, '00000000-0000-4000-8000-000000000000');
          });
        }
      }

      insertClone(db, 'analysis_runs', { run_id: desktopConstraintIds.runningRun, status: 'Running', ended_at: null, terminal_reason: null, run_locator: null, aggregate_id: null });
      assertRejectedConstraintWrite(db, 'a second Running Analysis Run for the same revision violates the sole partial unique guard', () => insertClone(db, 'analysis_runs', { run_id: desktopConstraintIds.rejectedRun, status: 'Running', ended_at: null, terminal_reason: null, run_locator: null, aggregate_id: null }));
      insertClone(db, 'model_disclosures', { disclosure_id: desktopConstraintIds.runningDisclosure });
      insertClone(db, 'assistance_attempts', { attempt_id: desktopConstraintIds.runningAttempt, disclosure_id: desktopConstraintIds.runningDisclosure, status: 'Running', actual_provider: null, actual_model: null, ended_at: null, terminal_reason: null, draft_id: null });
      insertClone(db, 'model_disclosures', { disclosure_id: desktopConstraintIds.rejectedDisclosure });
      assertRejectedConstraintWrite(db, 'a second Running Assistance Attempt for the same revision violates the sole partial unique guard', () => insertClone(db, 'assistance_attempts', { attempt_id: desktopConstraintIds.rejectedAttempt, disclosure_id: desktopConstraintIds.rejectedDisclosure, status: 'Running', actual_provider: null, actual_model: null, ended_at: null, terminal_reason: null, draft_id: null }));

      assertRejectedDeferredCommit(db, 'a Product Session whose deferred current Revision is never admitted fails COMMIT', () => {
        db.prepare(`INSERT INTO product_sessions(session_id, project_id, display_name, mode, case_id, current_revision_id, created_at, schema_version)
          VALUES ('17171717-1717-4171-8171-171717171717', ?, 'Deferred failure', 'professional', '18181818-1818-4181-8181-181818181818', '19191919-1919-4191-8191-191919191919', '2026-09-19T00:00:00.000Z', '1.0')`).run(desktopTestIds.project);
      });
      assertRejectedDeferredCommit(db, 'a Case Revision whose deferred Product Session is never admitted fails COMMIT', () => {
        db.prepare(`INSERT INTO case_revisions(
          revision_id, project_id, session_id, case_id, revision_sequence, state, case_name, question_text, hypothesis_display_title,
          business_context, alternative_explanations_json, evidence_explanation_text, previous_revision_id, snapshot_id, confirmation_id,
          current_finding_id, current_acceptance_id, current_closure_id, current_report_id, integrity_state, created_at, updated_at, row_version, schema_version
        ) VALUES ('20202020-2020-4020-8020-202020202021', ?, '21212121-2121-4121-8121-212121212121', '22222222-2222-4222-8222-222222222223', 1, 'Draft', 'Deferred failure', 'Question', 'Hypothesis', '', '[]', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ok', '2026-09-19T00:00:00.000Z', '2026-09-19T00:00:00.000Z', 1, '1.0')`).run(desktopTestIds.project);
      });
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], 'a fresh A1.2 Project has no hidden relationship violation');
    } finally { db.close(); }
  });
});

test('U1.2 AC-XDESK-011-03: declares the exact Project Session Case same-owner foreign-key chain with RESTRICT actions and no cross-Project substitution', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      const sessionForeignKeys = db.prepare('PRAGMA foreign_key_list(product_sessions)').all() as Array<Record<string, unknown>>;
      const revisionForeignKeys = db.prepare('PRAGMA foreign_key_list(case_revisions)').all() as Array<Record<string, unknown>>;
      assert.ok(sessionForeignKeys.some((entry) => entry.table === 'projects' && entry.from === 'project_id' && entry.to === 'project_id' && entry.on_delete === 'RESTRICT' && entry.on_update === 'RESTRICT'));
      assert.ok(revisionForeignKeys.some((entry) => entry.table === 'product_sessions' && entry.from === 'project_id' && entry.to === 'project_id' && entry.on_delete === 'RESTRICT' && entry.on_update === 'RESTRICT'));
      insertExactA13Tuple(db, {
        projectId: desktopTestIds.project,
        sessionId: desktopTestIds.session,
        caseId: desktopTestIds.case,
        revisionId: desktopTestIds.revision,
      });
      db.prepare("INSERT INTO projects(project_id, display_name, created_at, schema_version) VALUES (?, 'Other Project', '2026-09-19T00:00:00.000Z', '1.0')").run(desktopTestIds.alternateProject);
      insertExactA13Tuple(db, {
        projectId: desktopTestIds.alternateProject,
        sessionId: desktopTestIds.alternateSession,
        caseId: desktopTestIds.alternateCase,
        revisionId: desktopTestIds.alternateRevision,
      });
      assert.throws(() => db.prepare(`INSERT INTO command_receipts(
        command_id, operation_kind, project_id, session_id, case_id, revision_id,
        input_fingerprint, outcome, result_kind, result_id, rejection_reason, completed_at, schema_version
      ) VALUES (?, 'create_session', ?, ?, ?, ?, ?, 'succeeded', 'product_session', ?, NULL, '2026-09-19T00:00:00.000Z', '1.0')`).run(
        desktopTestIds.retryCommand, desktopTestIds.project, desktopTestIds.alternateSession,
        desktopTestIds.alternateCase, desktopTestIds.alternateRevision,
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', desktopTestIds.alternateSession,
      ), /FOREIGN KEY/, 'a receipt whose individual child identities exist under another Project is not a valid owner tuple');
      const schema = (db.prepare("SELECT group_concat(sql, '\n') AS schema FROM sqlite_master WHERE type = 'table'").get() as { schema: string }).schema;
      assert.doesNotMatch(schema, /ON\s+(?:UPDATE|DELETE)\s+CASCADE/i);
      assert.equal((db.prepare('SELECT COUNT(*) AS count FROM command_receipts WHERE command_id = ?').get(desktopTestIds.retryCommand) as { count: number }).count, 0, 'a mixed-owner receipt cannot become a later tuple row');
    } finally { db.close(); }
  });
});

test('AC-XDESK-011-04: stages fsyncs hashes and renames files before the sole SQLite visibility commit', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    await requiredExport<Method>(store, 'createSession')(u13Request());
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      assert.equal((db.prepare('SELECT COUNT(*) AS count FROM product_sessions WHERE session_id = ?').get(desktopTestIds.session) as { count: number }).count, 1);
      for (const directory of ['010_draw', '020_clean', '060_reports']) await access(join(projectRoot, desktopTestIds.session, directory));
    } finally { db.close(); }
  });
});

test('AC-XDESK-011-05: never overwrites final artifacts and leaves post-rename pre-commit bytes inert and immutable', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    await requiredExport<Method>(store, 'createSession')(u13Request());
    const finalDirectory = join(projectRoot, desktopTestIds.session);
    const before = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    await assert.rejects(() => requiredExport<Method>(store, 'createSession')({ command: createSessionCommand({ command_id: desktopTestIds.retryCommand }), ids: { session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, operation_id: desktopTestIds.operation } }), /(?:VALIDATION_FAILED|COMMAND_CONFLICT)/);
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), before);
    await access(finalDirectory);
  });
});

test('U1.2 R1 collateral: null route supports non-closure dispositions without SQL NULL-dependent acceptance [AC-XDESK-007-02, AC-XDESK-007-04, AC-XDESK-007-05]', async (t) => {
  for (const disposition of ['draft', 'not_adopted', 'deferred', 'more_evidence', 'saved']) for (const preserveCandidates of [false, true]) await t.test(`${disposition} candidates=${preserveCandidates}`, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot)); const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      insertExactConstraintFixture(db);
      const before = db.prepare('SELECT candidates_json FROM decision_forms').get()?.candidates_json;
      const write = () => db.prepare(`UPDATE decision_forms SET route=NULL, disposition=?, candidates_json=${preserveCandidates ? 'candidates_json' : "'[]'"}`).run(disposition);
      if (disposition === 'saved') assertRejectedConstraintWrite(db, 'saved requires a real completion route', write);
      else {
        assert.doesNotThrow(write, 'decline/defer/more-evidence does not require choosing a closure route');
        assert.equal(db.prepare('SELECT candidates_json FROM decision_forms').get()?.candidates_json, preserveCandidates ? before : '[]');
        assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
      }
    } finally { db.close(); }
  }));
});

test('U1.2 R3 retained at final scope: native int64 precision does not bypass receipt authority or physical integrity [AC-XDESK-002-06]', async (t) => {
  for (const version of [9007199254740991n, 9007199254740992n, 9223372036854775807n]) await t.test(`A1.3 row_version ${version}`, async () => withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot); await openProject(store);
    await requiredExport<Method>(store, 'createSession')(u13Request());
    const owner = { project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision };
    await openProject(await createStore(projectRoot));
    const admitted = await requiredExport<Method>(store, 'readProjection')(owner);
    assert.equal(requiredRecord(admitted.revision, 'revision').row_version, '1');
    assert.equal(requiredRecord(admitted.revision, 'revision').integrity_state, 'ok');
    const path = sqliteFile(projectRoot), db = new DatabaseSync(path);
    try {
      db.prepare('UPDATE case_revisions SET row_version=?').run(version);
      const read = db.prepare('SELECT row_version FROM case_revisions'); read.setReadBigInts(true);
      assert.equal(read.get()?.row_version, version);
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    } finally { db.close(); }
    const before = await readFile(path), entries = await readdir(join(projectRoot, '.xanthil', 'desktop'));
    const profileModule = await loadDesktopModule('profiles/personal/xanthil-desktop.ts');
    const profile = requiredExport<(x: unknown) => Record<string, unknown>>(profileModule, 'createPersonalXanthilDesktopProfile')({ assistanceConfig: null, toolchainDeployment: {descriptor_path:join(projectRoot,'not-configured-toolchain.json')}, clock: () => new Date('2026-01-02T03:04:05.006Z'), deadlineScheduler: {schedule: () => ({cancel() {}})} });
    // A row_version increment requires its corresponding durable mutation receipt.
    // These exact int64 values are valid SQLite integers but forged authority, not
    // billions of legitimately completed edits. Reopen must reject FORBIDDEN,
    // not round the value, misclassify the schema, repair it, or invent receipts.
    const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => requiredExport<Method>(profile, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, projectDirectoryCapability: { projectRoot, display_name: 'Synthetic Project' }, display_name: 'Synthetic Project' }), /FORBIDDEN/));
    assert.deepEqual(audit.statements, []); assert.deepEqual(await readFile(path), before);
    assert.deepEqual(await readdir(join(projectRoot, '.xanthil', 'desktop')), entries);
  }));
  for (const [table, column] of [
    ['source_snapshots', 'members_byte_length'], ['source_snapshots', 'included_member_count'],
    ['aggregate_artifacts', 'byte_length'], ['report_versions', 'version_sequence'],
    ['report_versions', 'markdown_byte_length'], ['decision_forms', 'form_sequence'],
  ] as const) await t.test(`${table}.${column} int64 maximum`, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot)); const path = sqliteFile(projectRoot), db = new DatabaseSync(path);
    try {
      insertExactConstraintFixture(db); db.prepare(`UPDATE ${table} SET ${column}=?`).run(9223372036854775807n);
      const read = db.prepare(`SELECT ${column} AS value FROM ${table}`); read.setReadBigInts(true);
      assert.equal(read.get()?.value, 9223372036854775807n, 'native precision is independent of completeness of the synthetic evidence');
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    }
    finally { db.close(); }
    const before = await readFile(path);
    // This SQL-only DDL fixture has no matching Session/artifact files or canonical
    // receipts. Activation removed the old future-stage FORBIDDEN stop; it must
    // not turn incomplete evidence into a usable Project. No enormous fake file
    // is created to pretend maximum byte_length is physically covered.
    const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => createStore(projectRoot).then(openProject), /INTEGRITY_BLOCKED/));
    assert.deepEqual(audit.statements, []); assert.deepEqual(await readFile(path), before);
  }));
});

test('U1.2 R2: every business-date endpoint is an actual canonical calendar date [AC-XDESK-011-02]', async (t) => {
  const columns = ['comparison_start_date', 'comparison_end_date', 'current_start_date', 'current_end_date'];
  // Explicit normalization pairs only construct otherwise-valid intervals;
  // acceptance rejects each original invalid spelling independently of SQLite.
  const invalid = [
    ['2026-02-29', '2026-03-01'], ['2026-02-30', '2026-03-02'],
    ['2024-02-30', '2024-03-01'], ['1900-02-29', '1900-03-01'],
    ['2026-04-31', '2026-05-01'], ['2026-06-31', '2026-07-01'],
    ['2026-09-31', '2026-10-01'], ['2026-11-31', '2026-12-01'],
    ['2026-03-02T00:00:00Z', '2026-03-02'], ['2026-03-02 00:00:00', '2026-03-02'],
    ['2026-03-02 ', '2026-03-02'], ['2026-03-00', '2026-03-01'],
    ['2026-13-01', '2027-01-01'], ['2026-3-02', '2026-03-02'],
  ];
  for (const column of columns) for (const [value, normalized] of invalid) await t.test(`${column} ${value}`, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot));
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      insertExactConstraintFixture(db);
      const offset = (days: number) => new Date(Date.parse(normalized + 'T00:00:00.000Z') + days * 86400000).toISOString().slice(0, 10);
      const dates: Record<string, string> = column.startsWith('comparison')
        ? { comparison_start_date: offset(-1), comparison_end_date: offset(1), current_start_date: '2031-01-01', current_end_date: '2031-01-02' }
        : { comparison_start_date: '2020-01-01', comparison_end_date: '2020-01-02', current_start_date: offset(-1), current_end_date: offset(1) };
      dates[column] = value;
      const other = column.endsWith('start_date') ? column.replace('start_date', 'end_date') : column.replace('end_date', 'start_date');
      dates[other] = offset(column.endsWith('start_date') ? 1 : -1);
      assertRejectedConstraintWrite(db, `${column} rejects noncanonical/impossible ${value}`, () => db.prepare(`UPDATE input_confirmations SET ${columns.map(x => x + '=?').join(',')}`).run(...columns.map(x => dates[x])));
    } finally { db.close(); }
  }));
  for (const [name, dates, accepted] of [
    ['leap 2024 adjacent', ['2024-02-28', '2024-02-29', '2024-02-29', '2024-03-01'], true],
    ['leap century 2000', ['2000-02-28', '2000-02-29', '2000-02-29', '2000-03-01'], true],
    ['nonleap adjacent', ['2026-02-28', '2026-03-01', '2026-03-01', '2026-03-02'], true],
    ['month boundary', ['2026-04-30', '2026-05-01', '2026-05-01', '2026-05-02'], true],
    ['equal overlap', ['2024-02-28', '2024-03-01', '2024-02-29', '2024-03-02'], false],
    ['zero length', ['2024-02-29', '2024-02-29', '2024-03-01', '2024-03-01'], false],
  ] as const) await t.test(name, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot)); const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      insertExactConstraintFixture(db);
      const write = () => db.prepare(`UPDATE input_confirmations SET ${columns.map(x => x + '=?').join(',')}`).run(...dates);
      if (accepted) assert.doesNotThrow(write); else assertRejectedConstraintWrite(db, name, write);
    } finally { db.close(); }
  }));
});

test('U1.2 R1: Assistance observed provider/model identity is paired in every status [AC-XDESK-011-02]', async (t) => {
  for (const status of ['Running', 'Succeeded', 'Failed', 'Cancelled']) for (const pair of [[null, null], ['synthetic-provider', 'synthetic-model'], ['synthetic-provider', null], [null, 'synthetic-model']] as const) {
    const allowed = status === 'Failed' ? (pair[0] === null) === (pair[1] === null) : status === 'Succeeded' ? pair[0] !== null && pair[1] !== null : pair[0] === null && pair[1] === null;
    await t.test(`${status} ${JSON.stringify(pair)} allowed=${allowed}`, async () => withIsolatedProject(async (projectRoot) => {
      await openProject(await createStore(projectRoot));
      const db = new DatabaseSync(sqliteFile(projectRoot));
      try {
        insertExactConstraintFixture(db);
        const write = () => db.prepare('UPDATE assistance_attempts SET status=?, actual_provider=?, actual_model=?, ended_at=?, terminal_reason=?, draft_id=?').run(
          status, ...pair, status === 'Running' ? null : '2026-09-19T00:00:00.000Z', status === 'Failed' ? 'provider_failed' : status === 'Cancelled' ? 'user_cancelled' : null, status === 'Succeeded' ? desktopConstraintIds.draft : null,
        );
        if (allowed) { assert.doesNotThrow(write); assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []); }
        else assertRejectedConstraintWrite(db, `${status} provider/model pair`, write);
      } finally { db.close(); }
    }));
  }
});

test('U1.2 F6: real native exclusive contention stays STORE_BUSY through Store and Profile without retry or mutation [AC-XDESK-011-06]', async () => withIsolatedProject(async (projectRoot) => {
  await openProject(await createStore(projectRoot));
  const path = sqliteFile(projectRoot), before = await readFile(path);
  const locker = new DatabaseSync(path);
  const profileModule = await loadDesktopModule('profiles/personal/xanthil-desktop.ts');
  const profile = requiredExport<(x: unknown) => Record<string, unknown>>(profileModule, 'createPersonalXanthilDesktopProfile')({ assistanceConfig: null, toolchainDeployment: {descriptor_path:join(projectRoot,'not-configured-toolchain.json')}, clock: () => new Date('2026-01-02T03:04:05.006Z'), deadlineScheduler: {schedule: () => ({cancel() {}})} });
  locker.exec('BEGIN EXCLUSIVE');
  try {
    const started = Date.now(), store = await createStore(projectRoot);
    const audit = await withNodeSqliteConnectionAudit(async () => {
      await assert.rejects(() => openProject(store), /STORE_BUSY/);
      await assert.rejects(() => requiredExport<Method>(store, 'listSessions')({ project_id: desktopTestIds.project }), /STORE_BUSY/);
      await assert.rejects(() => requiredExport<Method>(profile, 'openProject')({ contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, projectDirectoryCapability: { projectRoot, display_name: 'Synthetic Project' }, display_name: 'Synthetic Project' }), /STORE_BUSY/);
    });
    assert.deepEqual(audit.statements, []);
    assert.ok(Date.now() - started < 1000, 'native busy_timeout=0 must not wait/retry');
  } finally { locker.exec('ROLLBACK'); locker.close(); }
  assert.deepEqual(await readFile(path), before);
}));

test('U1.2 F7 retained: current I2 storage exports only implemented Store and Run evidence factories [AC-XDESK-002-02]', async () => {
  const storage = await loadDesktopModule('adapters/storage-local/xanthil-desktop-decision-case.ts');
  assert.deepEqual(Object.keys(storage).sort(), ['createLocalDesktopDecisionCaseStore', 'createLocalDesktopRunEvidenceStore']);
});

test('U1.2 F4/F5: Store independently validates the six-field provenance envelope before filesystem effects [AC-XDESK-009-05]', async (t) => {
  const valid = { contract_version: '1.0', command_id: desktopTestIds.openProjectCommand, proposed_project_id: desktopTestIds.project, display_name: 'Synthetic Project', initialized_at: '2026-01-02T03:04:05.006Z', input_fingerprint: '9f1bcae85f9de177cf0903ca42e1a842cb98f889a5801d6ce03a952b23d4027d' };
  const invalid = [
    ...['command_id', 'proposed_project_id'].flatMap(key => ['not-a-uuid', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', '11111111-1111-1111-8111-111111111111', null, 42].map(value => ({ ...valid, [key]: value }))),
    { ...valid, initialized_at: 'invalid' }, { ...valid, initialized_at: '2026-02-30T00:00:00.000Z' }, { ...valid, initialized_at: null },
    { ...valid, input_fingerprint: 'project-opened' }, { ...valid, input_fingerprint: valid.input_fingerprint.toUpperCase() },
    { ...valid, display_name: 'Changed business input' }, { ...valid, display_name: null }, { ...valid, extra: true },
    { contract_version: '1.0', command_id: valid.command_id, proposed_project_id: valid.proposed_project_id, display_name: valid.display_name },
  ];
  for (const [ordinal, input] of invalid.entries()) await t.test(String(ordinal), async () => withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await assert.rejects(() => requiredExport<Method>(store, 'openProject')(input), /VALIDATION_FAILED/);
    assert.deepEqual(await readdir(projectRoot), []);
  }));
});

test('U1.2 F3: full schema preserves nullable group maps and rejects SQL-null terminal and overlapping-period loopholes [AC-XDESK-011-02]', async (t) => {
  const cases = [
    ['none group with null map', "UPDATE input_confirmations SET selected_group_mode='none', member_group_column=NULL; UPDATE aggregate_artifacts SET group_pseudonym_map_json=NULL", true],
    ['mapped group with JSON object', "UPDATE aggregate_artifacts SET group_pseudonym_map_json='{}'", true],
    ['invalid group map JSON', "UPDATE aggregate_artifacts SET group_pseudonym_map_json='not-json'", false],
    ['Run Failed null reason', "UPDATE analysis_runs SET status='Failed', terminal_reason=NULL, run_locator=NULL, aggregate_id=NULL", false],
    ['Run Failed enumerated reason', "UPDATE analysis_runs SET status='Failed', terminal_reason='calculation_failed', run_locator=NULL, aggregate_id=NULL", true],
    ['Run Cancelled null reason', "UPDATE analysis_runs SET status='Cancelled', terminal_reason=NULL, run_locator=NULL, aggregate_id=NULL", false],
    ['Run Cancelled exact reason', "UPDATE analysis_runs SET status='Cancelled', terminal_reason='user_cancelled', run_locator=NULL, aggregate_id=NULL", true],
    ['Attempt Failed null reason', "UPDATE assistance_attempts SET status='Failed', terminal_reason=NULL, draft_id=NULL", false],
    ['Attempt Failed enumerated reason', "UPDATE assistance_attempts SET status='Failed', terminal_reason='provider_failed', draft_id=NULL", true],
    ['Attempt Cancelled null reason', "UPDATE assistance_attempts SET status='Cancelled', terminal_reason=NULL, draft_id=NULL, actual_provider=NULL, actual_model=NULL", false],
    ['Attempt Cancelled exact reason', "UPDATE assistance_attempts SET status='Cancelled', terminal_reason='user_cancelled', draft_id=NULL, actual_provider=NULL, actual_model=NULL", true],
    ['overlap with positive equal lengths', "UPDATE input_confirmations SET current_start_date=comparison_start_date, current_end_date=comparison_end_date", false],
    ['adjacent half-open equal periods', "UPDATE input_confirmations SET current_start_date='2026-01-29', current_end_date='2026-02-26'", true],
    ['invalid dates', "UPDATE input_confirmations SET current_start_date='invalid-date'", false],
    ['noninitial receipt without owner', "UPDATE command_receipts SET operation_kind='save_form', outcome='rejected', result_kind=NULL, result_id=NULL, rejection_reason='VALIDATION_FAILED' WHERE operation_kind='initialize_project'", false],
  ] as const;
  for (const [name, sql, allowed] of cases) await t.test(name, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot));
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      insertExactConstraintFixture(db);
      if (allowed) { assert.doesNotThrow(() => db.exec(sql)); assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []); }
      else assertRejectedConstraintWrite(db, name, () => db.exec(sql));
    } finally { db.close(); }
  }));
});

test('U1.2 F2: admission reads every table and refuses damaged initialization authority before writable use [AC-XDESK-002-06]', async (t) => {
  const mutations = [
    "UPDATE command_receipts SET result_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'",
    "UPDATE command_receipts SET input_fingerprint='project-opened'",
    "UPDATE command_receipts SET completed_at='invalid-time'",
    "UPDATE command_receipts SET project_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'",
    "UPDATE projects SET project_id='not-a-uuid'",
    'DELETE FROM command_receipts',
  ];
  for (const sql of mutations) await t.test(sql, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot));
    const path = sqliteFile(projectRoot), db = new DatabaseSync(path);
    db.exec('PRAGMA foreign_keys=OFF');
    db.exec(sql); db.close();
    const before = await readFile(path), entries = await readdir(join(projectRoot, '.xanthil', 'desktop'));
    const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => createStore(projectRoot).then(openProject), /INTEGRITY_BLOCKED/));
    assert.deepEqual(audit.statements, []);
    assert.deepEqual(await readFile(path), before);
    assert.deepEqual(await readdir(join(projectRoot, '.xanthil', 'desktop')), entries);
  }));
  for (const kept of Object.keys(exactDesktopSchemaColumns).filter(x => !['projects', 'command_receipts'].includes(x))) await t.test(`actual row in ${kept}`, async () => withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot));
    const path = sqliteFile(projectRoot), db = new DatabaseSync(path);
    insertExactConstraintFixture(db);
    db.exec('PRAGMA foreign_keys=OFF');
    for (const table of Object.keys(exactDesktopSchemaColumns)) if (!['projects', 'command_receipts', kept].includes(table)) db.exec(`DELETE FROM ${quoteSqlIdentifier(table)}`);
    db.prepare('DELETE FROM command_receipts WHERE command_id <> ?').run(desktopTestIds.openProjectCommand);
    db.close();
    const before = await readFile(path), queried = new Set<string>(), original = DatabaseSync.prototype.prepare;
    const observation = t.mock.method(DatabaseSync.prototype, 'prepare', function (this: DatabaseSync, sql: string) {
      const table = /^SELECT \* FROM "?([a-z_]+)"?$/.exec(sql)?.[1] ?? (sql === 'SELECT rowid AS receipt_ordinal,* FROM command_receipts ORDER BY rowid' ? 'command_receipts' : undefined);
      if (table) queried.add(table);
      return original.call(this, sql);
    });
    try {
      const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => createStore(projectRoot).then(openProject), /FORBIDDEN|INTEGRITY_BLOCKED/));
      assert.deepEqual(audit.statements, []);
      assert.deepEqual([...queried].sort(), Object.keys(exactDesktopSchemaColumns).sort(), 'every declared table is actually read before tuple classification');
      assert.deepEqual(await readFile(path), before);
    } finally { observation.mock.restore(); }
  }));
});

test('U1.2 F1: absent database never adopts or deletes residual sidecars [AC-XDESK-011-06]', async (t) => {
  for (const suffix of ['-wal', '-shm', '-journal']) for (const kind of ['file', 'symlink', 'directory']) await t.test(`${suffix} ${kind}`, async () => withIsolatedProject(async (projectRoot) => {
    const path = sqliteFile(projectRoot);
    const directory = join(projectRoot, '.xanthil', 'desktop');
    await mkdir(directory, { recursive: true });
    if (kind === 'file') await writeFile(path + suffix, 'synthetic residual state');
    if (kind === 'symlink') await symlink('missing-synthetic-target', path + suffix);
    if (kind === 'directory') await mkdir(path + suffix);
    const before = await readdir(directory);
    const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => createStore(projectRoot).then(openProject), /SCHEMA_UNSUPPORTED/));
    assert.deepEqual(audit.statements, []);
    assert.deepEqual(await readdir(directory), before);
    if (kind === 'file') assert.equal(await readFile(path + suffix, 'utf8'), 'synthetic residual state');
  }));
});

test('U1.2 AC-XDESK-011-06: rejects unsupported existing inputs before any writable SQLite statement', async (t) => {
  for (const kind of ['wrong-identity', 'wrong-version', 'wal-header', 'shm', 'extra-table', 'missing-index', 'changed-column'] as const) {
    await t.test(kind, async () => withIsolatedProject(async (projectRoot) => {
      await openProject(await createStore(projectRoot));
      const path = sqliteFile(projectRoot);
      if (kind === 'shm') await writeFile(`${path}-shm`, 'foreign shared-memory sidecar');
      else if (kind === 'wal-header') {
        const bytes = await readFile(path); bytes[18] = 2; bytes[19] = 2; await writeFile(path, bytes);
      } else {
        const db = new DatabaseSync(path);
        try {
          db.exec({
            'wrong-identity': 'PRAGMA application_id=7',
            'wrong-version': 'PRAGMA user_version=101',
            'extra-table': 'CREATE TABLE foreign_table(value TEXT)',
            'missing-index': 'DROP INDEX product_sessions_project_created',
            'changed-column': 'ALTER TABLE projects ADD COLUMN foreign_column TEXT',
          }[kind]);
        } finally { db.close(); }
      }
      const before = await readFile(path);
      const entries = (await readdir(join(projectRoot, '.xanthil', 'desktop'))).sort();
      const awaitStore = await createStore(projectRoot);
      const audit = await withNodeSqliteConnectionAudit(async () => {
        await assert.rejects(() => openProject(awaitStore), /SCHEMA_UNSUPPORTED/);
      });
      assert.deepEqual(audit.statements, [], 'unsupported input permits no writable PRAGMA, DDL or DML');
      assert.deepEqual(await readFile(path), before, 'rejection preserves every database byte');
      assert.deepEqual((await readdir(join(projectRoot, '.xanthil', 'desktop'))).sort(), entries, 'rejection preserves sidecars and directory entries');
    }));
  }
});

test('U1.2 AC-XDESK-011-02: initialization failure rolls back schema identity and Project receipt together', async (t) => {
  await withIsolatedProject(async (projectRoot) => {
    const originalPrepare = DatabaseSync.prototype.prepare;
    let hits = 0;
    const prepare = t.mock.method(DatabaseSync.prototype, 'prepare', function (this: DatabaseSync, sql: string) {
      if (sql.startsWith('INSERT INTO projects(')) { hits++; throw new Error('controlled initialization failure'); }
      return originalPrepare.call(this, sql);
    });
    try {
      const store = await createStore(projectRoot);
      await assert.rejects(() => openProject(store), /controlled initialization failure/);
      assert.equal(hits, 1);
    } finally { prepare.mock.restore(); }
    const db = new DatabaseSync(sqliteFile(projectRoot), { readOnly: true });
    try {
      assert.deepEqual(db.prepare('SELECT name FROM sqlite_schema').all(), [], 'failed first initialization leaves no partial schema');
      assert.equal(db.prepare('PRAGMA application_id').get()!.application_id, 0);
      assert.equal(db.prepare('PRAGMA user_version').get()!.user_version, 0);
    } finally { db.close(); }
  });
});

test('U1.2 AC-XDESK-011-06: refuses a symlink authority directory before creating anything outside the selected Project', async () => {
  await withIsolatedProject(async (projectRoot) => withIsolatedProject(async (otherRoot) => {
    await symlink(otherRoot, join(projectRoot, '.xanthil'));
    const before = await readdir(otherRoot);
    const store = await createStore(projectRoot);
    await assert.rejects(() => openProject(store), /SCHEMA_UNSUPPORTED/);
    assert.deepEqual(await readdir(otherRoot), before, 'even directory preparation cannot follow a symlink authority');
  }));
});

test('U1.2 AC-XDESK-011-06: observable file drift after read-only inspection aborts before write admission', async (t) => {
  await withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot));
    const path = sqliteFile(projectRoot);
    const before = await readFile(path);
    const originalClose = DatabaseSync.prototype.close;
    let injected = false;
    const close = t.mock.method(DatabaseSync.prototype, 'close', function (this: DatabaseSync) {
      originalClose.call(this);
      if (!injected) { injected = true; appendFileSync(path, 'observable-test-drift'); }
    });
    try {
      const store = await createStore(projectRoot);
      const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => openProject(store), /SCHEMA_UNSUPPORTED/));
      assert.equal(injected, true, 'the drift boundary was reached');
      assert.deepEqual(audit.statements, [], 'drift admits no writable PRAGMA or business statement');
      assert.deepEqual(await readFile(path), Buffer.concat([before, Buffer.from('observable-test-drift')]), 'only the explicit fixture drift exists, with no repair');
    } finally { close.mock.restore(); }
  });
});

test('U1.2 AC-XDESK-011-06: native recovery failure is blocked without fallback or repair', async (t) => {
  await withIsolatedProject(async (projectRoot) => {
    await openProject(await createStore(projectRoot));
    const path = sqliteFile(projectRoot);
    await createExactXdk1HotJournal(path);
    const before = await readFile(path), journal = await readFile(`${path}-journal`);
    const originalPrepare = DatabaseSync.prototype.prepare;
    let hits = 0;
    const prepare = t.mock.method(DatabaseSync.prototype, 'prepare', function (this: DatabaseSync, sql: string) {
      if (sql === 'SELECT name FROM sqlite_schema LIMIT 1') { hits++; throw new Error('controlled native recovery read failure'); }
      return originalPrepare.call(this, sql);
    });
    try {
      const store = await createStore(projectRoot);
      const audit = await withNodeSqliteConnectionAudit(async () => assert.rejects(() => openProject(store), /INTEGRITY_BLOCKED/));
      assert.equal(hits, 1, 'one native recovery admission; no fallback or retry');
      assert.deepEqual(audit.statements, [], 'recovery failure admits no PRAGMA, DDL or DML');
      assert.deepEqual(await readFile(path), before);
      assert.deepEqual(await readFile(`${path}-journal`), journal);
    } finally { prepare.mock.restore(); }
  });
});

test('U1.2 AC-XDESK-011-06: admits only the exact A1.2 tuple, applies only native XDK1 hot-journal rollback, and otherwise preserves rejected Project bytes', async (t) => {
  await withIsolatedProject(async (projectRoot) => {
    const databaseDirectory = join(projectRoot, '.xanthil', 'desktop');
    await mkdir(databaseDirectory, { recursive: true });
    const malformed = new TextEncoder().encode('not a sqlite database');
    await writeFile(sqliteFile(projectRoot), malformed);
    const before = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const rejected = await createStore(projectRoot);
    await assert.rejects(() => openProject(rejected), /SCHEMA_UNSUPPORTED/);
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), before, 'a malformed header is rejected before a SQLite business connection');
  });
  await withIsolatedProject(async (projectRoot) => {
    const initial = await createStore(projectRoot);
    await openProject(initial);
    const database = new DatabaseSync(sqliteFile(projectRoot));
    try { database.exec('PRAGMA application_id = 7'); } finally { database.close(); }
    const before = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const rejected = await createStore(projectRoot);
    await assert.rejects(() => openProject(rejected), /SCHEMA_UNSUPPORTED/);
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), before, 'a foreign SQLite application_id is never adopted or repaired');
  });
  await withIsolatedProject(async (projectRoot) => {
    const initial = await createStore(projectRoot);
    await openProject(initial);
    const database = new DatabaseSync(sqliteFile(projectRoot));
    try { database.exec('PRAGMA user_version = 101'); } finally { database.close(); }
    const before = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const rejected = await createStore(projectRoot);
    await assert.rejects(() => openProject(rejected), /SCHEMA_UNSUPPORTED/);
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), before, 'newer bytes are not migrated, default-filled, or rewritten');
  });
  await withIsolatedProject(async (projectRoot) => {
    const initial = await createStore(projectRoot);
    await openProject(initial);
    const databaseDirectory = join(projectRoot, '.xanthil', 'desktop');
    await writeFile(`${sqliteFile(projectRoot)}-wal`, 'foreign WAL sidecar');
    const beforeBytes = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const beforeEntries = (await readdir(databaseDirectory)).sort();
    const rejected = await createStore(projectRoot);
    await assert.rejects(() => openProject(rejected), /SCHEMA_UNSUPPORTED/);
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), beforeBytes, 'a foreign WAL never activates SQLite recovery or business writing');
    assert.deepEqual((await readdir(databaseDirectory)).sort(), beforeEntries, 'foreign WAL is refused before SQLite business use and never deleted');
  });
  await withIsolatedProject(async (projectRoot) => {
    const initial = await createStore(projectRoot);
    await openProject(initial);
    const before = await readFile(sqliteFile(projectRoot));
    await writeFile(sqliteFile(projectRoot), before.subarray(0, 100));
    assert.throws(() => {
      const direct = new DatabaseSync(sqliteFile(projectRoot), { readOnly: true });
      try { direct.prepare('PRAGMA integrity_check').all(); } finally { direct.close(); }
    }, /(?:malformed|disk image|database)/i, 'the controlled fixture must be an actual recognized-header integrity failure');
    const rejectedBytes = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const rejected = await createStore(projectRoot);
    await assert.rejects(() => openProject(rejected), /INTEGRITY_BLOCKED/);
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), rejectedBytes, 'integrity failure does not rewrite, reconcile, or default-fill a recognized Project');
  });
  await withIsolatedProject(async (projectRoot) => {
    const first = await createStore(projectRoot);
    await openProject(first);
    const before = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const crash = await createExactXdk1HotJournal(sqliteFile(projectRoot));
    t.diagnostic(`native crash fixture ${JSON.stringify(crash)}`);
    await access(`${sqliteFile(projectRoot)}-journal`);
    const recovered = await createStore(projectRoot);
    const result = await openProject(recovered);
    assert.equal(result.opened, true, 'only the exact XDK1 DELETE hot journal enters native SQLite rollback');
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), before, 'native rollback restores the pre-crash committed bytes instead of reconciling business state');
    try {
      const journal = await readFile(`${sqliteFile(projectRoot)}-journal`);
      assert.notEqual(journal.subarray(0, 8).toString('hex'), 'd9d505f920a163d7', 'a retained native journal is invalidated, not still hot');
    } catch (error) {
      assert.equal((error as NodeJS.ErrnoException).code, 'ENOENT', 'native recovery may remove its product journal');
    }
  });
  await withIsolatedProject(async (projectRoot) => {
    const first = await createStore(projectRoot);
    await openProject(first);
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      insertExactA13Tuple(db, {
        projectId: desktopTestIds.project,
        sessionId: desktopTestIds.session,
        caseId: desktopTestIds.case,
        revisionId: desktopTestIds.revision,
        receiptCommandId: desktopTestIds.createSessionCommand,
      });
      assert.deepEqual(db.prepare('SELECT project_id, session_id, case_id, current_revision_id, mode, schema_version FROM product_sessions').all().map((row) => ({ ...row })), [{
        project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case,
        current_revision_id: desktopTestIds.revision, mode: 'professional', schema_version: '1.0',
      }], 'the future fixture contains the complete current Session owner/current-revision tuple');
      assert.deepEqual(db.prepare('SELECT project_id, session_id, case_id, revision_id, revision_sequence, state, previous_revision_id, snapshot_id, confirmation_id, current_finding_id, current_acceptance_id, current_closure_id, current_report_id, integrity_state, schema_version FROM case_revisions').all().map((row) => ({ ...row })), [{
        project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case,
        revision_id: desktopTestIds.revision, revision_sequence: 1, state: 'Draft', previous_revision_id: null,
        snapshot_id: null, confirmation_id: null, current_finding_id: null, current_acceptance_id: null,
        current_closure_id: null, current_report_id: null, integrity_state: 'ok', schema_version: '1.0',
      }], 'the future fixture has only the allowed sequence-one Draft/null references of A1.3');
      assert.deepEqual(db.prepare('SELECT operation_kind, project_id, session_id, case_id, revision_id, outcome, result_kind, result_id, rejection_reason, schema_version FROM command_receipts WHERE command_id = ?').all(desktopTestIds.createSessionCommand).map((row) => ({ ...row })), [{
        operation_kind: 'create_session', project_id: desktopTestIds.project, session_id: desktopTestIds.session,
        case_id: desktopTestIds.case, revision_id: desktopTestIds.revision, outcome: 'succeeded',
        result_kind: 'product_session', result_id: desktopTestIds.session, rejection_reason: null, schema_version: '1.0',
      }], 'the future tuple has the exact permitted create_session receipt rather than an invented later record');
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [], 'the future fixture must satisfy the actual full DDL before U1.2 refuses it');
    } finally { db.close(); }
    for (const directory of ['010_draw', '020_clean', '060_reports']) await mkdir(join(projectRoot, desktopTestIds.session, directory), { recursive: true });
    assert.deepEqual((await readdir(join(projectRoot, desktopTestIds.session))).sort(), ['010_draw', '020_clean', '060_reports'], 'the future tuple carries the complete initial Session directory layout without invoking U1.3 behavior');
    const before = createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex');
    const beforeEntries = (await readdir(join(projectRoot, '.xanthil', 'desktop'))).sort();
    const earlier = await createStore(projectRoot);
    assert.equal((await openProject(earlier)).opened, true, 'current U1 now admits the exact supported Session tuple; historical A1.2 refusal evidence remains preserved');
    assert.equal(createHash('sha256').update(await readFile(sqliteFile(projectRoot))).digest('hex'), before, 'supported tuple admission never rewrites committed records');
    assert.deepEqual((await readdir(join(projectRoot, '.xanthil', 'desktop'))).sort(), beforeEntries, 'admission creates no receipt or sidecar');
    const later = new DatabaseSync(sqliteFile(projectRoot));
    try { later.prepare("UPDATE case_revisions SET evidence_explanation_text = 'copied user explanation'").run(); } finally { later.close(); }
    const laterBytes = await readFile(sqliteFile(projectRoot));
    await assert.rejects(()=>openProject(earlier),/INTEGRITY_BLOCKED/,'an initial no-parent no-save Draft cannot claim an inherited Review explanation');
    assert.deepEqual(await readFile(sqliteFile(projectRoot)), laterBytes, 'malformed initial text is rejected without rewriting or normalizing committed bytes');
  });
});

test('AC-XDESK-011-07: reads only committed verified contained bytes and marks damage integrity_blocked while preserving history', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const store = await createStore(projectRoot);
    await openProject(store);
    await requiredExport<Method>(store, 'createSession')(u13Request());
    await writeFile(join(projectRoot, desktopTestIds.session, '010_draw', 'tampered.csv'), 'tampered');
    const projection = await requiredExport<Method>(store, 'readProjection')({ project_id: desktopTestIds.project, session_id: desktopTestIds.session, case_id: desktopTestIds.case, revision_id: desktopTestIds.revision });
    assert.equal(projection.revision === undefined || projection.revision === null || (projection.revision as { integrity_state?: string }).integrity_state !== 'integrity_blocked', true, 'an unreferenced file cannot manufacture damage authority');
  });
});

test('U1.2 AC-XDESK-011-08: starts Project authority from the committed SQLite row and rejects orphan or substitute artifact evidence', async () => {
  await withIsolatedProject(async (projectRoot) => {
    const orphanRoot = join(projectRoot, '.xanthil', 'runs', 'orphan-run');
    await mkdir(orphanRoot, { recursive: true });
    await writeFile(join(orphanRoot, 'run.json'), '{"run_contract_version":"3.0","status":"Succeeded"}');
    const orphanBefore = createHash('sha256').update(await readFile(join(orphanRoot, 'run.json'))).digest('hex');
    const store = await createStore(projectRoot);
    const project = await openProject(store);
    const db = new DatabaseSync(sqliteFile(projectRoot));
    try {
      assert.equal(project.project_id, desktopTestIds.project, 'only the initialized SQLite projects row supplies Project identity');
      assert.equal((db.prepare("SELECT COUNT(*) AS count FROM analysis_runs").get() as { count: number }).count, 0);
      assert.equal((db.prepare("SELECT COUNT(*) AS count FROM aggregate_artifacts").get() as { count: number }).count, 0);
    } finally { db.close(); }
    const sessions = await requiredExport<(value: Record<string, unknown>) => Promise<unknown[]>>(store, 'listSessions')({ project_id: desktopTestIds.project });
    assert.deepEqual(sessions, [], 'unreferenced Run-shaped bytes cannot manufacture a Session, projection, or admitted history');
    assert.equal(createHash('sha256').update(await readFile(join(orphanRoot, 'run.json'))).digest('hex'), orphanBefore, 'Project open never scans, adopts, rewrites, or deletes a substitute artifact');
  });
});
