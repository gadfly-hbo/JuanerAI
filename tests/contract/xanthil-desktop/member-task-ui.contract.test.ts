import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';
test('UI-P1-01 normal quick mode connects the unfinished membership workspace',()=>{const source=readFileSync('apps/desktop/renderer.tsx','utf8');assert.ok(/<MembershipTaskWorkspace\b/.test(source),'normal quick entry must render the actual unfinished task consumer');});
