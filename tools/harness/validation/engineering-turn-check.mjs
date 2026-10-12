// Read-only continuity reminder, not an execution/approval/state authority.
import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { validateStatus } from '../project-board/project-control.mjs';

const limit = 256 * 1024;
const phases = new Set(['IMPLEMENTATION', 'REGRESSION', 'VERIFY']);
const required = ['SDD_INPUT', 'SDD_SPEC', 'SDD_TASKS', 'SDD_VERIFICATION'];
const unknown = () => ({ status: 'UNKNOWN', missing: [] });

async function localText(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || /[\x00-\x1f\x7f]/.test(relative)) throw Error('unsafe path');
  const parts = relative.split('/');
  if (parts.some(p => !p || p === '.' || p === '..')) throw Error('unsafe path');
  if (!(await lstat(root)).isDirectory()) throw Error('unsafe root');
  let target = root;
  for (const part of parts.slice(0, -1)) {
    target = path.join(target, part);
    if (!(await lstat(target)).isDirectory()) throw Error('unsafe directory');
  }
  target = path.join(target, parts.at(-1));
  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > limit) throw Error('unsafe file');
    // Bounded read even if the file grows concurrently.
    const buffer = Buffer.alloc(limit + 1);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > limit) throw Error('oversized file');
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally { await handle.close(); }
}

async function inspect(root) {
  try {
    const state = validateStatus(JSON.parse(await localText(root, '.juanerai/project-control/status.json')));
    const result = { status: 'UNKNOWN', missing: [] };
    if (['waiting_user', 'blocked', 'complete'].includes(state.health) || state.blockers.length) {
      result.status = 'STOP';
    } else if (['active', 'validating'].includes(state.health) && phases.has(state.phase.id)) {
      result.status = 'CONTINUE';
    }
    // Existing evidence entries may have historical IDs; canonical paths also
    // resolve the same material category without renumbering old evidence.
    const patterns = {
      SDD_INPUT: /\/proposal\.md$/, SDD_SPEC: /\/specs\/.+\/spec\.md$/,
      SDD_TASKS: /\/tasks\.md$/, SDD_VERIFICATION: /\/verification\.md$/,
    };
    let unsafe = false;
    for (const id of required) {
      const entries = state.evidence.filter(e => e.id === id || patterns[id].test(e.path));
      let present = false;
      for (const e of entries) {
        if (!['present', 'verified'].includes(e.status)) continue;
        try {
          if (!/^openspec\/changes\/[^/]+\//.test(e.path)) throw Error('unsafe material');
          if ((await localText(root, e.path)).trim()) present = true;
        } catch (error) { if (error.code !== 'ENOENT') unsafe = true; }
      }
      if (!present) result.missing.push(id);
    }
    if (unsafe && result.status === 'CONTINUE') result.status = 'UNKNOWN';
    return { state, result };
  } catch { return { state: null, result: unknown() }; }
}

function registeredRoots(cwd) {
  const output = execFileSync('git', ['-C', cwd, 'worktree', 'list', '--porcelain', '-z'],
    { encoding: 'utf8', timeout: 1500, maxBuffer: 128 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const roots = output.split('\0').filter(x => x.startsWith('worktree ')).map(x => x.slice(9));
  if (!roots.length || roots.length > 32) throw Error('unbounded worktrees');
  return roots;
}

async function hook(event) {
  if (event?.model !== 'gpt-6.1-sol' || typeof event.cwd !== 'string' ||
    ![event.session_id, event.turn_id].every(x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,255}$/.test(x))) return {};
  if (event.hook_event_name === 'UserPromptSubmit') return { hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit', additionalContext:
      `JuanerAI host binding: mini-engineering:${event.session_id}:${event.turn_id}. Only after confirming this turn is authorized continuous Mini engineering, the main writer may use this value with the existing status CLI --session. Do not bind questions, paused work or product planning. This is read-only context, not intake approval, a resume request or new permission.` } };
  if (event.hook_event_name !== 'Stop') return {};
  if (typeof event.last_assistant_message !== 'string' ||
    /JUANERAI_STOP:\s*\S+/.test(event.last_assistant_message)) return {};
  // Never use a stale board to reactivate a new user turn or another task.
  const binding = `mini-engineering:${event.session_id}:${event.turn_id}`;
  let matches;
  try {
    matches = (await Promise.all(registeredRoots(event.cwd).map(root => inspect(root))))
      .filter(x => x.state?.updated_by.role === 'controller' && x.state.updated_by.session === binding);
  } catch { return { systemMessage: 'JuanerAI end check unavailable; no automatic continuation was requested.' }; }
  if (matches.length !== 1) return {};
  const { result } = matches[0];
  if (result.status !== 'CONTINUE') return {};
  if (event.stop_hook_active !== false) return { systemMessage: 'JuanerAI end check: continuation already used or unknown. Do not loop; reconcile the real result and stop boundary.' };
  return { decision: 'block', reason: 'JuanerAI: the current explicitly bound engineering turn remains active. Read the existing status and OpenSpec tasks/verification, then continue only the next already-authorized safe action. A milestone is not completion. Preserve spec-before-code and causal RED/GREEN; do not invent evidence. If the user paused, authority/resources are missing or there is no safe action, record the real boundary and stop. This reminder grants no new authority.' +
    (result.missing.length ? ` Missing readable material: ${result.missing.join(', ')}; reconcile existing records, not a new approval pipeline.` : '') };
}

try {
  const args = process.argv.slice(2);
  let result;
  if (args.length === 2 && args[0] === '--check') result = (await inspect(path.resolve(args[1]))).result;
  else if (args.length === 1 && args[0] === '--hook') {
    let input = '', oversized = false;
    for await (const chunk of process.stdin) { input += chunk; if (input.length > limit) { oversized = true; input = ''; break; } }
    result = oversized ? {} : await hook(JSON.parse(input));
  } else throw Error('expected --check <engineering-root> or --hook');
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch {
  process.stdout.write(`${JSON.stringify(process.argv.includes('--hook') ? {} : unknown())}\n`);
}
