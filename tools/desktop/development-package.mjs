import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {resolve,join,isAbsolute} from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const root=process.env.JUANERAI_DEV_PACKAGE_EVIDENCE;
assert.ok(root&&isAbsolute(root),'new absolute JUANERAI_DEV_PACKAGE_EVIDENCE required');await mkdir(root);
await import('./prepare-toolchain-deployment.mjs');
const zipRoot=process.env.JUANERAI_ELECTRON_ZIP_DIR??join(root,'electron-zip');
if(!process.env.JUANERAI_ELECTRON_ZIP_DIR)await mkdir(zipRoot);
const electronVersion=JSON.parse(await readFile('node_modules/electron/package.json','utf8')).version;
const zip=join(zipRoot,`electron-v${electronVersion}-darwin-arm64.zip`);
// Repack the already installed runtime locally: no downloader or installation.
if(!process.env.JUANERAI_ELECTRON_ZIP_DIR){
const archive=spawnSync('/usr/bin/zip',['-qry',zip,'Electron.app','LICENSE','LICENSES.chromium.html','version'],{cwd:resolve('node_modules/electron/dist'),encoding:'utf8'});
await writeFile(join(root,'archive-result.json'),JSON.stringify({status:archive.status,stdout:archive.stdout,stderr:archive.stderr}));assert.equal(archive.status,0);
}
process.env.JUANERAI_ELECTRON_ZIP_DIR=zipRoot;
delete process.env.JUANERAI_INTERNAL_INSTALL_RESOURCES;delete process.env.JUANERAI_INTERNAL_INSTALL_OUTPUT;
const {api}=await import('@electron-forge/core');
await api.package({dir:process.cwd(),outDir:join(root,'out'),platform:'darwin',arch:'arm64',interactive:false});
const app=join(root,'out/Xanthil-darwin-arm64/Xanthil.app');
// This engineering smoke artifact uses the existing v1 toolchain descriptor and
// deliberately has no production Keychain helper. It is not a release/install.
await assert.rejects(access(join(app,'Contents/MacOS/xanthil-keychain')));
require('./seal-internal-app.cjs').sealInternalApp(app,{engineeringSmoke:true});
const asar=require('@electron/asar');const archivePath=join(app,'Contents/Resources/app.asar');
const manifest=JSON.parse(asar.extractFile(archivePath,'package.json'));
assert.equal(manifest.main,'.vite/build/main.cjs');
for(const relative of ['.vite/build/main.cjs','.vite/build/preload.js'])assert.deepEqual(asar.extractFile(archivePath,relative),await readFile(relative));
const html=asar.extractFile(archivePath,'.vite/renderer/main_window/index.html').toString();
assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/unsafe-inline|@vite\/client|开发版|127\.0\.0\.1:5173/);
const descriptor=await readFile(join(app,'Contents/Resources/toolchain-deployment.json'));assert.deepEqual(descriptor,await readFile('build/xanthil-toolchain-deployment.json'));
const files=[];for(const path of ['Contents/MacOS/Xanthil','Contents/Info.plist','Contents/Resources/app.asar','Contents/Resources/toolchain-deployment.json']){const bytes=await readFile(join(app,path));files.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(join(root,'package-identity.json'),JSON.stringify({app,files,release:false,scope:'current engineering package/resource smoke'},null,2));
console.log(JSON.stringify({app,checks:'package descriptor, Main/Preload byte identity, packaged CSP, toolchain resource',result:'PASS'}));
