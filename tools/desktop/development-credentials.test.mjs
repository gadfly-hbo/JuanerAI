import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const helper=resolve('build/development-keychain/xanthil-keychain');
test('DEV-02 compiled development helper has only its isolated service and rejects namespace selection',()=>{
 const strings=spawnSync('/usr/bin/strings',[helper],{encoding:'utf8'});assert.equal(strings.status,0);
 assert.match(strings.stdout,/com\.juanerai\.xanthil\.development\.xiaomi-token-plan-cn/);
 assert.doesNotMatch(strings.stdout,/com\.juanerai\.xanthil\.xiaomi-token-plan-cn/);
 const invalid=spawnSync(helper,[],{input:JSON.stringify({operation:'read',interactive:false,service:'com.juanerai.xanthil.xiaomi-token-plan-cn'}),env:{PATH:'/usr/bin:/bin'},encoding:'utf8'});
 assert.equal(invalid.status,0);assert.deepEqual(JSON.parse(invalid.stdout),{status:'invalid_request'});
});
