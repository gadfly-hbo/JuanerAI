// Stage a verified module into a NEW resource directory. No app install or launch.
import {cpSync,mkdirSync,writeFileSync,realpathSync,readFileSync,constants} from 'node:fs';
import {resolve,join} from 'node:path';
import {verifyResearchBundle,sha256} from '../../adapters/deep-research/bundle.mjs';
const [source,expected,target,...extra]=process.argv.slice(2);
if(!source||!expected||!target||extra.length||resolve(source)!==source||resolve(target)!==target||realpathSync(source)!==source)throw Error('DR_STAGE_ARGUMENTS');
verifyResearchBundle(source,expected);mkdirSync(target,{mode:0o700});
cpSync(source,join(target,'deep-research'),{recursive:true,errorOnExist:true,force:false,mode:constants.COPYFILE_FICLONE});
verifyResearchBundle(join(target,'deep-research'),expected);
const descriptor={version:1,manifestSha256:expected};
writeFileSync(join(target,'deep-research-deployment.json'),JSON.stringify(descriptor,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({resources:target,module:join(target,'deep-research'),manifestSha256:expected,descriptorSha256:sha256(readFileSync(join(target,'deep-research-deployment.json'))),installation:'NOT_RUN'}));
