import type {AssistantProjection} from '../../../packages/contracts/case-assistant.ts';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {spawn} from 'node:child_process';
import {createCaseAssistantApplication} from '../../../packages/application/case-assistant.ts';
import {createLocalCaseAssistantStore} from '../../../adapters/storage-local/case-assistant.ts';
import {completedCase} from '../../fixtures/case-assistant/completed-case.ts';
import {decision,config} from '../../fixtures/case-assistant/fixtures.ts';
import {withIsolatedProject} from '../../fixtures/xanthil-desktop/desktop-contract-drivers.ts';

async function eventually(read:()=>Promise<AssistantProjection>,condition:(p:AssistantProjection)=>boolean){let p=await read();for(let n=0;n<200&&!condition(p);n++){await new Promise(r=>setTimeout(r,5));p=await read();}assert.ok(condition(p),'asynchronous business state reached');return p;}















