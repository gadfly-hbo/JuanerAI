import {cpSync,mkdirSync,writeFileSync,constants} from 'node:fs';
import {resolve,join} from 'node:path';
import {verifyMetricBundle} from '../../adapters/metric-factory/bundle.ts';
const [source,expected,target,...extra]=process.argv.slice(2);
if(!source||!expected||!target||extra.length||resolve(source)!==source||resolve(target)!==target)throw Error('MF_STAGE_ARGUMENTS');
verifyMetricBundle(source,expected);mkdirSync(target,{mode:0o700});cpSync(source,join(target,'metric-factory'),{recursive:true,errorOnExist:true,force:false,mode:constants.COPYFILE_FICLONE});verifyMetricBundle(join(target,'metric-factory'),expected);writeFileSync(join(target,'metric-factory-deployment.json'),JSON.stringify({version:1,manifestSha256:expected},null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({resources:target,manifestSha256:expected,installation:'NOT_RUN'}));
