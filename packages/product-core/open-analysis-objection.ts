import {openAnalysisFindings} from '../contracts/open-analysis-findings.mjs';
import {membershipRecord as closed} from './member-analysis.ts';import {taskHash} from './member-task.ts';import type {OpenStoredTask} from '../ports/open-analysis-store.ts';
export type OpenFindingObjection=Readonly<{finding_id:string;revision:string;outcome_id:string;result_sha256:string;claim:string}>;
function fail(code:string):never{throw Object.assign(new Error(code),{code,stack:code});}
/** A user objection is the subject of investigation, never independent refutation. */
export function compileOpenFindingObjection(raw:unknown,task:OpenStoredTask):OpenFindingObjection{const x=closed(raw,['finding_id']);if(typeof x.finding_id!=='string'||!x.finding_id.trim()||x.finding_id.length>200)fail('FINDING_NOT_FOUND');const finding=openAnalysisFindings(task).find(f=>f.id===x.finding_id);if(!finding)fail('FINDING_NOT_FOUND');return {finding_id:finding.id,revision:task.identity.revision,outcome_id:finding.evidence.outcome_id,result_sha256:finding.evidence.result_sha256,claim:finding.claim};}
export function validateOpenFindingObjection(value:OpenFindingObjection,task:OpenStoredTask){closed(value,['finding_id','revision','outcome_id','result_sha256','claim']);if(taskHash(value)!==taskHash(compileOpenFindingObjection({finding_id:value.finding_id},task)))fail('CONTEXT_CHANGED');return value;}
