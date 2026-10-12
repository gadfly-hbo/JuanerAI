import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../../../packages/product-core/member-analysis.ts';
test('OA-S06: versioned built-in method choice has a real plan condition; prompt changes expression without changing capabilities',()=>{
 const preferences=Reflect.get(core,'openAnalysisPreferences'),allow=Reflect.get(core,'checkOpenAnalysisMethod');assert.equal(typeof preferences,'function');assert.equal(typeof allow,'function');const x=preferences({skill:'group-summary',prompt:'brief'});assert.doesNotThrow(()=>allow(x,{version:'1.0'}));assert.doesNotThrow(()=>allow(x,{version:'1.1',group_by:'B'}));assert.throws(()=>preferences({skill:'external-shell',prompt:'brief'}),{code:'METHOD_UNAVAILABLE'});
});

test('R1-METHOD01: optional group method does not block an ungrouped baseline or supported method',()=>{const allow=Reflect.get(core,'checkOpenAnalysisMethod');assert.doesNotThrow(()=>allow({skill:'group-summary',prompt:'brief'},{version:'1.1',group_by:null}));});
