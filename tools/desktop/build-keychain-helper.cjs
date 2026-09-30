const {spawnSync}=require('node:child_process');
const {mkdirSync}=require('node:fs');
const {join,resolve}=require('node:path');
/** OS binding only; fixed source/target/identity, no credentials or installs. */
function buildKeychainHelper(appPath){
 const repo=resolve(__dirname,'../..'),cache=join(repo,'build','keychain-swift-cache');mkdirSync(cache,{recursive:true});
 const helper=join(appPath,'Contents','MacOS','xanthil-keychain');
 const commands=[['/Library/Developer/CommandLineTools/usr/bin/swiftc',['-sdk','/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk','-target','arm64-apple-macosx14.0','-module-cache-path',cache,'-O',join(repo,'adapters/credentials-macos/keychain.swift'),'-o',helper,'-framework','Security']],['/usr/bin/codesign',['--force','--sign','-','--identifier','com.juanerai.xanthil.keychain','--timestamp=none',helper]]];
 for(const [command,args]of commands){const result=spawnSync(command,args,{env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},encoding:'utf8',timeout:120000});process.stdout.write(JSON.stringify({command,args,status:result.status,stdout:result.stdout,stderr:result.stderr})+'\n');if(result.error||result.status!==0)throw Error('Keychain helper build/sign failed');}
}
module.exports={buildKeychainHelper};
