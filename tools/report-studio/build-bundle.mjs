// Offline resource composer. No installs, downloads, credentials, or process activation.
import {constants,createReadStream} from 'node:fs';
import {lstat,mkdir,readdir,copyFile,chmod,readFile,writeFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isAbsolute,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashFile=async path=>{const h=createHash('sha256');for await(const chunk of createReadStream(path))h.update(chunk);return h.digest('hex');};
export async function buildReportStudioBundle(config) {
 const {supplierRoot,nodeFile,nodeLicense,browserRoot,output,version,sourceCommit,lockSha256,keychainHelper,keychainHelperSha256}=config;
 if(![supplierRoot,nodeFile,nodeLicense,browserRoot,output].every(isAbsolute)||!version||!/^[a-f0-9]{40}$/.test(sourceCommit)||!/^[a-f0-9]{64}$/.test(lockSha256))throw Error('RS_BUILD_INPUT_INVALID');
 if(typeof keychainHelper!=='string'||!isAbsolute(keychainHelper)||!/^[a-f0-9]{64}$/.test(keychainHelperSha256??''))throw Error('RS_BUILD_HELPER_INVALID');
 const helperStat=await lstat(keychainHelper);if(!helperStat.isFile()||helperStat.isSymbolicLink()||helperStat.nlink!==1||!(helperStat.mode&0o111)||await hashFile(keychainHelper)!==keychainHelperSha256)throw Error('RS_BUILD_HELPER_INVALID');
 for(const path of [supplierRoot,browserRoot])if(await realpath(path)!==resolve(path))throw Error('RS_BUILD_INPUT_UNSAFE');
 const lockBytes=await readFile(join(supplierRoot,'package-lock.json'));
 if(digest(lockBytes)!==lockSha256)throw Error('RS_BUILD_LOCK_MISMATCH');
 const lock=JSON.parse(lockBytes);if(lock.lockfileVersion!==3||!lock.packages)throw Error('RS_BUILD_LOCK_INVALID');
 const licenses=[];
 for(const [path,record]of Object.entries(lock.packages)){
   if(!path)continue;
   if(!/^node_modules\//.test(path)||path.split('/').some(p=>!p||p==='.'||p==='..')||path.includes('\\'))throw Error('RS_BUILD_LOCK_INVALID');
   let installed;try{installed=JSON.parse(await readFile(join(supplierRoot,path,'package.json'),'utf8'));}catch(error){if(error.code==='ENOENT'&&record.optional)continue;throw error;}
   if(installed.version!==record.version)throw Error('RS_BUILD_DEPENDENCY_MISMATCH');
   licenses.push({path,name:installed.name??null,version:installed.version,license:typeof installed.license==='string'?installed.license:null});
 }
 // One fixed historical metadata omission, not a general license resolver.
 const buffers=licenses.filter(record=>record.name==='buffers'||record.path==='node_modules/buffers');
 const buffersNoticeRoot=fileURLToPath(new URL('../../vendor/reports-factory/74ebb609/licenses/buffers-0.1.1/',import.meta.url));
 if(buffers.length){
   const proof=JSON.parse(await readFile(join(buffersNoticeRoot,'provenance.json'),'utf8'));
   if(digest(await readFile(join(buffersNoticeRoot,'NOTICE.txt')))!==proof.notice_sha256)throw Error('RS_BUILD_BUFFERS_NOTICE_INVALID');
   for(const record of buffers){
     const root=join(supplierRoot,record.path);
     if(record.name!==proof.name||record.version!==proof.version||record.license!==proof.declared_package_license||await realpath(root)!==resolve(root))throw Error('RS_BUILD_BUFFERS_IDENTITY_MISMATCH');
     for(const file of proof.bundled_files){
       const path=join(root,file.path),stat=await lstat(path);
       if(!stat.isFile()||stat.isSymbolicLink()||await realpath(path)!==resolve(path)||stat.size!==file.bytes||await hashFile(path)!==file.sha256)throw Error('RS_BUILD_BUFFERS_IDENTITY_MISMATCH');
     }
     record.license_resolution={spdx:proof.resolved_spdx,upstream_declaration:proof.upstream_license_declaration,notice_path:'licenses/buffers-0.1.1-MIT.txt',provenance_path:'licenses/buffers-0.1.1-provenance.json'};
   }
 }
 try{await mkdir(output,{mode:0o755});}catch(error){if(error.code==='EEXIST')throw Error('RS_BUILD_OUTPUT_EXISTS');throw error;}
 if(await realpath(output)!==resolve(output))throw Error('RS_BUILD_OUTPUT_UNSAFE');
 const files=[];
 async function copy(from,to,role) {
   const stat=await lstat(from);
   if(stat.isSymbolicLink()||!stat.isFile()&&!stat.isDirectory())throw Error('RS_BUILD_RESOURCE_UNSAFE');
   if(stat.isDirectory()){
     await mkdir(join(output,to),{recursive:true});
     for(const item of (await readdir(from)).sort()){
       if(to.startsWith('studio/node_modules')&&(item==='.bin'||item==='.package-lock.json'))continue;
       await copy(join(from,item),to+'/'+item,role);
     }
   }else{
     await mkdir(join(output,to,'..'),{recursive:true});await copyFile(from,join(output,to),constants.COPYFILE_FICLONE);await chmod(join(output,to),stat.mode&0o777);
     files.push({path:to,bytes:stat.size,sha256:await hashFile(join(output,to)),role:to==='studio/dist/juanerai/entry.js'?'server':role});
   }
 }
 for(const [path,role]of [['dist','resource'],['web-dist','web'],['assets','skills'],['node_modules','dependencies'],['package.json','resource'],['package-lock.json','resource']])await copy(join(supplierRoot,path),'studio/'+path,role);
 if(buffers.length){
   await copy(join(buffersNoticeRoot,'NOTICE.txt'),'licenses/buffers-0.1.1-MIT.txt','licenses');
   await copy(join(buffersNoticeRoot,'provenance.json'),'licenses/buffers-0.1.1-provenance.json','licenses');
 }
 await copy(keychainHelper,'bin/report-studio-keychain','resource');if(await hashFile(join(output,'bin/report-studio-keychain'))!==keychainHelperSha256)throw Error('RS_BUILD_HELPER_INVALID');
 await copy(nodeFile,'bin/node','node');await copy(nodeLicense,'licenses/Node-LICENSE.txt','licenses');
 await copy(browserRoot,'browser/chromium_headless_shell-1243','browser');
 const supplier=JSON.parse(await readFile(join(supplierRoot,'package.json'),'utf8'));
 const notice={schema_version:'1',source_commit:sourceCommit,supplier:{name:supplier.name,version:supplier.version,license:supplier.license??null},dependencies:licenses,redistribution_review:'PENDING',note:'完整依赖自带许可证随node_modules保留；此索引不替代逐项许可/通知审查。系统中文字体不打包。'};
 const noticeBytes=Buffer.from(JSON.stringify(notice,null,2)+'\n');await mkdir(join(output,'licenses'),{recursive:true});await writeFile(join(output,'licenses','dependency-notices.json'),noticeBytes);
 files.push({path:'licenses/dependency-notices.json',bytes:noticeBytes.length,sha256:digest(noticeBytes),role:'licenses'});files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
 const manifest={schema_version:'1',module:'reports-factory',version,source_commit:sourceCommit,protocol_version:'1',files};
 const bytes=Buffer.from(JSON.stringify(manifest)+'\n');if(bytes.length>16*1024*1024)throw Error('RS_BUILD_MANIFEST_TOO_LARGE');
 await writeFile(join(output,'manifest.json'),bytes,{flag:'wx'});
 return {manifest,identity:{version,source_commit:sourceCommit,protocol_version:'1',manifest_sha256:digest(bytes)},license_review:notice.redistribution_review};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv.length!==3)throw Error('one explicit JSON input recipe required');const built=await buildReportStudioBundle(JSON.parse(await readFile(process.argv[2],'utf8')));console.log(JSON.stringify({identity:built.identity,files:built.manifest.files.length,license_review:built.license_review},null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
