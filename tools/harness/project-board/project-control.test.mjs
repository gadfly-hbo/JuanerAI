import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CONTROL_ROOT, validateBrief, validateEvent, validateStatus } from './project-control.mjs';
test('committed records satisfy closed contracts',async()=>{const s=JSON.parse(await readFile(path.join(CONTROL_ROOT,'status.json'),'utf8')),e=JSON.parse(await readFile(path.join(CONTROL_ROOT,'events','20260820T153000+0800-project-board-scope.json'),'utf8')),b=JSON.parse(await readFile(path.join(CONTROL_ROOT,'decision-briefs','INPUT-001.json'),'utf8'));assert.equal(validateStatus(s),s);assert.equal(validateEvent(e),e);assert.equal(validateBrief(b),b);});
test('unknown status fields fail closed',async()=>{const s=JSON.parse(await readFile(path.join(CONTROL_ROOT,'status.json'),'utf8'));s.unapproved=true;assert.throws(()=>validateStatus(s),/fields must be exactly/);});
test('brief recommendation references a declared option',async()=>{const b=JSON.parse(await readFile(path.join(CONTROL_ROOT,'decision-briefs','INPUT-001.json'),'utf8'));b.recommended_option_id='missing';assert.throws(()=>validateBrief(b),/must reference an option/);});
