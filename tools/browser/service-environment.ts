import {homedir} from 'node:os';
import {accessSync,constants} from 'node:fs';

export function browserServiceEnvironment(root:string,source:NodeJS.ProcessEnv=process.env,platform:NodeJS.Platform=process.platform,access:typeof accessSync=accessSync):NodeJS.ProcessEnv{
 const env:NodeJS.ProcessEnv={PATH:source.PATH??'/usr/bin:/bin',HOME:homedir(),LANG:'en_US.UTF-8',JUANERAI_DESKTOP_DEV_ROOT:root};
 if(source.JUANERAI_BROWSER_CONFIG)env.JUANERAI_BROWSER_CONFIG=source.JUANERAI_BROWSER_CONFIG;
 if(source.JUANERAI_TOOLCHAIN_BIN)env.JUANERAI_TOOLCHAIN_BIN=source.JUANERAI_TOOLCHAIN_BIN;
 if(source.JUANERAI_DOCUMENT_PYTHON)env.JUANERAI_DOCUMENT_PYTHON=source.JUANERAI_DOCUMENT_PYTHON;
 for(const key of ['JUANERAI_IMAGE_READER','JUANERAI_SOFFICE'])if(source[key])env[key]=source[key];
 // Keep Node's normal TLS verification and add only macOS's public system bundle.
 if(platform==='darwin'){
  try{access('/etc/ssl/cert.pem',constants.R_OK);env.NODE_EXTRA_CA_CERTS='/etc/ssl/cert.pem';}catch{/* Retain Node's default trust when the bundle is unavailable. */}
 }
 return env;
}
