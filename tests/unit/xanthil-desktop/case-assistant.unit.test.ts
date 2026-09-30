import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAssistantDecision } from '../../../packages/product-core/case-assistant.ts';
import { source, decision } from '../../fixtures/case-assistant/fixtures.ts';

test('V06 AC-13 timezone confirmation accepts the advertised instant, normalizes UTC and rejects invalid time',()=>{
  for(const confirmed_at of ['2026-09-29T10:00:00+08:00','2026-09-28T21:00:00-05:00','2026-09-29T02:00:00Z']){
    const input={...decision,confirmed_at};
    assert.equal(validateAssistantDecision(input,source).confirmed_at,'2026-09-29T02:00:00.000Z');
    assert.equal(input.confirmed_at,confirmed_at,'validation does not mutate the editable input');
  }
  for(const confirmed_at of ['2026-02-30T10:00:00+08:00','2025-02-29T10:00:00Z','2026-09-29T24:00:00Z','2026-09-29T10:60:00Z','2026-09-29T10:00:60Z','2026-09-29T10:00:00+24:00','2026-09-29T10:00:00+08:60','2026-09-29T10:00:00'])assert.throws(()=>validateAssistantDecision({...decision,confirmed_at},source),/VALIDATION_FAILED/);
});

test('AC-05/13 complete candidate retains every field; invalid choice, authority refs and semantic gaps are rejected',()=>{
  assert.deepEqual(validateAssistantDecision(decision,source),decision);
  for(const patch of [{owner:' '},{candidate_id:'invented'},{choice:'execute'},{evidence_refs:['other-case']},{finding_refs:['other-finding']},{confirmed_at:'tomorrow'},{extra:'hidden'}])assert.throws(()=>validateAssistantDecision({...decision,...patch},source),/VALIDATION_FAILED/);
  for(const field of ['baseline','baseline_source','observation_object','metric','expectation','observation_window','guardrails','result_source','result_owner','assessment','assessment_owner'])assert.throws(()=>validateAssistantDecision({...decision,outcome:{...decision.outcome,[field]:''}},source),/VALIDATION_FAILED/,field);
});
test('AC-05 no-action/defer require explicit inapplicable reason and reassessment owner/trigger',()=>{
  const outcome={...decision.outcome,applicable:false,not_applicable_reason:'尚不适用',reassess_trigger:'新证据',reassess_owner:'合成人'};
  for(const choice of ['no_action','defer'] as const){
    const fields={...decision,choice,candidate_id:null,defer_trigger:choice==='defer'?'下月复核':'',defer_owner:choice==='defer'?'合成人':'',outcome};
    assert.deepEqual(validateAssistantDecision(fields,source),fields);
    for(const key of ['not_applicable_reason','reassess_trigger','reassess_owner'])assert.throws(()=>validateAssistantDecision({...fields,outcome:{...outcome,[key]:''}},source),/VALIDATION_FAILED/);
    if(choice==='defer')assert.throws(()=>validateAssistantDecision({...fields,defer_trigger:''},source),/VALIDATION_FAILED/);
  }
  assert.throws(()=>validateAssistantDecision({...decision,outcome},source),/VALIDATION_FAILED/);
});
