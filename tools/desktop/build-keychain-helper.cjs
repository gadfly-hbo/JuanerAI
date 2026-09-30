const {spawnSync}=require('node:child_process');
const {mkdirSync,readFileSync,writeFileSync,existsSync}=require('node:fs');
const {createHash}=require('node:crypto');
const {join,resolve}=require('node:path');
/** OS binding only; fixed source/target/identity, no credentials or installs. */
function buildHelper(helper,development=false){
 const repo=resolve(__dirname,'../..'),cache=join(repo,'build','keychain-swift-cache');mkdirSync(cache,{recursive:true});

 const commands=[['/Library/Developer/CommandLineTools/usr/bin/swiftc',[...(development?['-D','XANTHIL_DEVELOPMENT']:[]),'-sdk','/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk','-target','arm64-apple-macosx14.0','-module-cache-path',cache,'-O',join(repo,'adapters/credentials-macos/keychain.swift'),'-o',helper,'-framework','Security']],['/usr/bin/codesign',['--force','--sign','-','--identifier',development?'com.juanerai.xanthil.development.keychain':'com.juanerai.xanthil.keychain','--timestamp=none',helper]]];
 for(const [command,args]of commands){const result=spawnSync(command,args,{env:{PATH:'/usr/bin:/bin',LANG:'en_US.UTF-8'},encoding:'utf8',timeout:120000});process.stdout.write(JSON.stringify({command,args,status:result.status,stdout:result.stdout,stderr:result.stderr})+'\n');if(result.error||result.status!==0)throw Error('Keychain helper build/sign failed');}
}
function buildKeychainHelper(appPath){buildHelper(join(appPath,'Contents','MacOS','xanthil-keychain'));}
function buildDevelopmentKeychainHelper(){
 const root=resolve(__dirname,'../../build/development-keychain');mkdirSync(root,{recursive:true});
 const helper=join(root,'xanthil-keychain'),receipt=join(root,'identity.json');
 const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
 const input=digest(resolve(__dirname,'../../adapters/credentials-macos/keychain.swift'))+digest(__filename);
 if(existsSync(helper)&&existsSync(receipt)){const old=JSON.parse(readFileSync(receipt,'utf8'));if(old.input===input&&old.helper===digest(helper))return helper;}
 buildHelper(helper,true);writeFileSync(receipt,JSON.stringify({input,helper:digest(helper)}));return helper;
}
module.exports={buildKeychainHelper,buildDevelopmentKeychainHelper};
