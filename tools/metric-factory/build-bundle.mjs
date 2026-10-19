// Fixed snapshot -> new build directory -> new bundle. Never installs an app or invokes a Provider.
import {readFileSync,writeFileSync,mkdirSync,cpSync,lstatSync,realpathSync,readdirSync,rmSync,chmodSync} from 'node:fs';
import {join,resolve,relative,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {metricHash,verifyMetricBundle} from '../../adapters/metric-factory/bundle.ts';
const [sourceArg,expected,outArg,nodeFile,npmCli,nodeLicense,...extra]=process.argv.slice(2);
if(extra.length||![sourceArg,expected,outArg,nodeFile,npmCli,nodeLicense].every(Boolean))throw Error('FIXED_BUILD_INPUTS_REQUIRED');
const source=realpathSync(sourceArg),out=resolve(outArg),identity=readFileSync(join(source,'source-identity.json'));
if(metricHash(identity)!==expected)throw Error('SOURCE_IDENTITY_MISMATCH');
const pin=JSON.parse(identity);if(pin.baseCommit!=='169faa8d45e1c5616c004f8fb844a7ca68add156'||!Array.isArray(pin.files))throw Error('SOURCE_IDENTITY_INVALID');
const check=()=>{for(const f of pin.files){if(f.path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('SOURCE_PATH_INVALID');const path=join(source,f.path),st=lstatSync(path);if(!st.isFile()||realpathSync(path)!==path||st.size!==f.bytes||metricHash(readFileSync(path))!==f.sha256)throw Error('SOURCE_BYTES_CHANGED');}};check();
mkdirSync(out,{mode:0o700});const build=join(out,'build-input'),bundle=join(out,'bundle');mkdirSync(build);mkdirSync(bundle);
for(const f of pin.files){const dest=join(build,f.path);mkdirSync(dirname(dest),{recursive:true});cpSync(join(source,f.path),dest);}
const env={PATH:dirname(nodeFile)+':/usr/bin:/bin',GIT_SHA:expected.slice(0,12),HOME:out,TMPDIR:out,LANG:'en_US.UTF-8'};
const run=(args,cwd)=>{const r=spawnSync(nodeFile,[npmCli,...args],{cwd,env,stdio:'inherit'});if(r.status!==0)throw Error('BUILD_STEP_FAILED');};
run(['ci','--ignore-scripts','--no-audit','--no-fund'],build);run(['run','build'],build);
for(const name of ['dist','templates','package.json','package-lock.json','vendor','LICENSE','INTEGRATION-CHANGES.md','MODEL-CATALOG-NOTICE.txt'])cpSync(join(build,name),join(bundle,name),{recursive:true});
if(pin.files.some(f=>f.path==='NOTICE'))cpSync(join(build,'NOTICE'),join(bundle,'NOTICE'));
mkdirSync(join(bundle,'docs'));cpSync(join(build,'docs/工作台使用指南.md'),join(bundle,'docs/工作台使用指南.md'));
run(['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],bundle);
function removeBins(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(name==='.bin'){rmSync(path,{recursive:true});continue;}if(lstatSync(path).isDirectory())removeBins(path);}}
removeBins(join(bundle,'node_modules'));
cpSync(nodeFile,join(bundle,'node'));chmodSync(join(bundle,'node'),0o755);cpSync(nodeLicense,join(bundle,'Node-LICENSE.txt'));writeFileSync(join(bundle,'source-identity.json'),identity);
const version=spawnSync(join(bundle,'node'),['--version'],{encoding:'utf8',env:{PATH:bundle}});if(version.status!==0||!/^v26\./.test(version.stdout.trim()))throw Error('BUNDLED_NODE_INVALID');
const files=[],notices=[];
function census(dir){for(const name of readdirSync(dir).sort()){const path=join(dir,name),st=lstatSync(path);if(st.isDirectory()){census(path);continue;}if(!st.isFile()||realpathSync(path)!==path)throw Error('BUNDLE_LINK');const rel=relative(bundle,path);files.push({path:rel,bytes:st.size,sha256:metricHash(readFileSync(path))});if(/license|notice|copying/i.test(name))notices.push(rel);}}
census(bundle);const notice=Buffer.from('metric-factory base '+pin.baseCommit+'; integration snapshot '+expected+'\nSupplier license declaration: Apache-2.0 in package.json. Official license text included in LICENSE; provenance and integration modifications in INTEGRATION-CHANGES.md.\n'+(pin.files.some(f=>f.path==='NOTICE')?'Supplier NOTICE included unchanged.':'No supplier NOTICE exists in this fixed source; no supplier attribution has been invented.')+'\nDependency license and notice originals included at:\n'+notices.join('\n')+'\n');writeFileSync(join(bundle,'THIRD-PARTY-NOTICES.txt'),notice);files.push({path:'THIRD-PARTY-NOTICES.txt',bytes:notice.length,sha256:metricHash(notice)});
const manifest=Buffer.from(JSON.stringify({version:1,sourceCommit:pin.baseCommit,sourceSnapshot:expected,node:version.stdout.trim(),files},null,2)+'\n');writeFileSync(join(bundle,'manifest.json'),manifest);const sha=metricHash(manifest);check();verifyMetricBundle(bundle,sha);
writeFileSync(join(out,'build-result.json'),JSON.stringify({bundle,manifestSha256:sha,sourceSnapshot:expected,files:files.length,installation:'NOT_RUN'},null,2)+'\n');console.log(JSON.stringify({bundle,manifestSha256:sha,sourceSnapshot:expected,files:files.length}));
