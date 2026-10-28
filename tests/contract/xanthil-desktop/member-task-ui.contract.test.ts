import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';
test('UI-P1-01 current installed normal browser composition retains the real unfinished membership Application, no deleted renderer bridge',()=>{
 const main=readFileSync('apps/browser/installed-main.ts','utf8'),service=readFileSync('apps/browser/service-main.ts','utf8'),profile=readFileSync('profiles/personal/browser-membership.ts','utf8');
 assert.match(main,/startIndependentBrowserService\(root/);assert.match(service,/createPersonalBrowserServiceWorkspace/);assert.match(profile,/createMembershipTaskApplication\(\{desktop,store,project_id\}\)/);assert.match(profile,/createBrowserMembershipWorkspaceApplication\(\{store,tasks,project_id/);assert.doesNotMatch(main,/MembershipTaskWorkspace|createPiOpenAnalysisRuntime/);
});
