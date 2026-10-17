// Compose a task-local install candidate only. No download, dependency install,
// app launch, system registration, credential operation, Provider or deployment.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,cp,realpath,lstat} from 'node:fs/promises';
import {isAbsolute,join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyReportStudioBundle} from '../../adapters/report-studio/bundle.ts';
import {readPersonalDesktopToolchain} from '../../profiles/personal/xanthil-desktop.ts';
const [recipe,...extra]=process.argv.slice(2);assert(recipe&&extra.length===0);
const value=JSON.parse(await readFile(recipe,'utf8'));
assert.deepEqual(Object.keys(value).sort(),['bundle','electronZipDir','identity','output','runtimeResources'].sort());
for(const p of [value.bundle,value.runtimeResources,value.electronZipDir,value.output])assert(isAbsolute(p)&&resolve(p)===p);
for(const p of [value.bundle,value.runtimeResources,value.electronZipDir])assert.equal(await realpath(p),p);
assert.deepEqual(Object.keys(value.identity).sort(),['version','source_commit','protocol_version','manifest_sha256'].sort());
assert.equal(value.identity.version,'0.1.0-juanerai.1');assert.equal(value.identity.source_commit,'74ebb609fd73cf263614ffc9301dafaafcec4230');
assert.equal((await verifyReportStudioBundle(value.bundle,value.identity)).state,'ready');
const descriptor=await readFile(join(value.runtimeResources,'toolchain-deployment.json'));
assert.equal(createHash('sha256').update(descriptor).digest('hex'),'efbbb4d0efb3685f1671bddbbcdb6f39baa1b3e346dad1d058d635394d62f6d7');
await readPersonalDesktopToolchain(join(value.runtimeResources,'toolchain-deployment.json'));
assert((await lstat(join(value.runtimeResources,'THIRD_PARTY_NOTICES'))).isDirectory());
await mkdir(value.output);const resources=join(value.output,'resources');
await cp(value.runtimeResources,resources,{recursive:true,errorOnExist:true,force:false,verbatimSymlinks:true});
await cp(value.bundle,join(resources,'report-studio'),{recursive:true,errorOnExist:true,force:false});
assert.equal((await verifyReportStudioBundle(join(resources,'report-studio'),value.identity)).state,'ready');
await writeFile(join(resources,'report-studio-deployment.json'),JSON.stringify({schema_version:'1',module:'reports-factory',bundle_relative_path:'report-studio',...value.identity})+'\n',{flag:'wx'});
// Forge's fixed offline zip cache and preinstalled dependency tree only. Its
// approved helper compiler and ad-hoc sealing do not execute the Keychain helper.
process.env.JUANERAI_REPORT_STUDIO_PACKAGE='1';process.env.JUANERAI_ELECTRON_ZIP_DIR=value.electronZipDir;
process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES=resources;process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT=join(value.output,'out');
const {api}=await import('@electron-forge/core');
await api.package({dir:process.cwd(),outDir:join(value.output,'out'),platform:'darwin',arch:'arm64',interactive:false});
const app=join(value.output,'out','Xanthil-darwin-arm64','Xanthil.app');
const installed=join(app,'Contents/Resources');assert.equal((await verifyReportStudioBundle(join(installed,'report-studio'),value.identity)).state,'ready');
assert.deepEqual(await readFile(join(installed,'report-studio-deployment.json')),await readFile(join(resources,'report-studio-deployment.json')));
await writeFile(join(value.output,'candidate.json'),JSON.stringify({app,source_head:'UNCOMMITTED',module:value.identity,scope:'engineering assembly only',license_review:'PENDING',native_launch:'NOT_RUN',clean_installation:'NOT_RUN',provider:'NOT_RUN',keynote:'NOT_RUN'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({app,module:value.identity,installation:'NOT_RUN',license_review:'PENDING'}));
