#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const rejected = error_code => ({ schema_version: '1.0', operation: 'applyControllerCommand', outcome: 'REJECTED', error_code, change_id: null });
const emit = (message, code) => { process.stdout.write(`${canonical(message)}\n`); process.exitCode = code; };
const statusPayload = (pointer_status, active_change_id = null) => ({ pointer_status, active_change_id, macro_state: null, phase: null, pending_action: null, candidate: null, delivery: null, orphan_ready: null, local_pause: null });

async function status() {
  const root = process.env.JUANERAI_COORDINATOR_STATE_ROOT;
  if (!root) return emit({ schema_version: '1.0', operation: 'status', outcome: 'STATUS', change_id: null, state: null, state_version: null, state_hash: null, payload: statusPayload('EMPTY') }, 0);
  try {
    const bytes = await readFile(path.join(root, 'active-change.json'), 'utf8');
    const pointer = JSON.parse(bytes);
    if (canonical(pointer) !== bytes || pointer.schema_version !== '1.0' || typeof pointer.active_change_id !== 'string') throw new Error('invalid pointer');
    const stateBytes = await readFile(path.join(root, 'changes', pointer.active_change_id, 'state.json'), 'utf8');
    const state = JSON.parse(stateBytes);
    if (canonical(state) !== stateBytes || state.schema_version !== '1.0' || state.change_id !== pointer.active_change_id || !state.admission || typeof state.admission.command_id !== 'string' || typeof state.admission.body_sha256 !== 'string') throw new Error('invalid state');
    const ledgerBytes = await readFile(path.join(root, 'ledger-work', pointer.active_change_id, 'ledger.jsonl'), 'utf8');
    const events = ledgerBytes.split('\n').filter(Boolean).map(line => { const event = JSON.parse(line); if (canonical(event) !== line) throw new Error('noncanonical evidence'); return event; });
    const admission = events.find(event => event.event_class === 'CONTROLLER_COMMAND' && event.change_id === pointer.active_change_id && event.detail?.command_kind === 'DISPATCH' && event.detail?.command_id === state.admission.command_id && event.detail?.ready_state_sha256 === sha256(stateBytes));
    if (!admission) throw new Error('missing admission evidence');
    return emit({
      schema_version: '1.0',
      operation: 'status',
      outcome: 'STATUS',
      change_id: pointer.active_change_id,
      state: state.macro_state,
      state_version: state.state_version,
      state_hash: sha256(stateBytes),
      payload: {
        ...statusPayload('ACTIVE', pointer.active_change_id),
        macro_state: state.macro_state,
        phase: state.phase,
        pending_action: state.pending_agent ? { kind: 'AGENT_SETTLEMENT', correlation_id: state.pending_agent.correlation_id } : null,
        candidate: state.candidate,
        delivery: state.delivery,
      },
    }, 0);
  } catch {
    return emit({ schema_version: '1.0', operation: 'status', outcome: 'STATUS', change_id: null, state: null, state_version: null, state_hash: null, payload: statusPayload('INVALID') }, 0);
  }
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === 'status') await status();
else if (args[0] !== 'submit' || args.some(value => /public-key|trust-path|verifier|gateway/.test(value)) || ['JUANERAI_PUBLIC_KEY', 'JUANERAI_TRUST_PATH', 'JUANERAI_VERIFIER', 'JUANERAI_GATEWAY'].some(key => Object.hasOwn(process.env, key))) emit(rejected('INPUT_INVALID'), 2);
else {
  const [, bodyFlag, bodyPath, signatureFlag, signature] = args;
  try {
    const body = await readFile(bodyPath, 'utf8');
    if (bodyFlag !== '--command-body' || signatureFlag !== '--signature-base64' || !signature || canonical(JSON.parse(body)) !== body) throw new Error('malformed');
    emit(rejected('INGRESS_UNAVAILABLE'), 3);
  } catch {
    emit(rejected('INPUT_INVALID'), 2);
  }
}
