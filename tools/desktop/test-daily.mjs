import {readdirSync,mkdtempSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const all=process.argv.includes('--all');
const files=[];
for(const kind of all?[]:['unit','contract','integration']){
 const dir=`tests/${kind}/xanthil-desktop`;
 for(const name of readdirSync(dir).sort())if(name.endsWith('.test.ts')&&name!=='xanthil-desktop-main-module-format.contract.test.ts')files.push(join(dir,name));
}
files.push('tests/e2e/xanthil-desktop/case-assistant.e2e.test.ts');
const env={...process.env,JUANERAI_TEST_EVIDENCE_DIR:realpathSync(process.env.JUANERAI_TEST_EVIDENCE_DIR??mkdtempSync(join(tmpdir(),'xanthil-daily-')))};
delete env.XANTHIL_REAL_PI_ACCEPTANCE;delete env.XIAOMI_TOKEN_PLAN_CN_API_KEY;delete env.JUANERAI_CASE_ASSISTANT_ACTIVATION;
console.log('Daily: deterministic Desktop suites. Artifact/native evidence requires the explicit commands in DEVELOPMENT.md.');
if(all){const canonical=spawnSync('tools/harness/validation/run',['--portable'],{env,stdio:'inherit'});if(canonical.status!==0)process.exit(canonical.status??1);}
files.push('tools/desktop/development-server.test.mjs','tools/desktop/development-build.test.mjs');
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{env,stdio:'inherit'});process.exitCode=result.status??1;
