import assert from 'node:assert/strict';
function record(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value);}
/** Explicit test boundary narrowing, preserves the actual object for fault injection. */
export function recordValue(value:unknown):Record<string,unknown>{assert.ok(record(value),'the actual program value must be an object in this case');return value;}
