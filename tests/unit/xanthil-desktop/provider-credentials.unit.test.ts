import assert from 'node:assert/strict';
import test from 'node:test';
import {createApprovedProviderCredentials} from '../../../adapters/agent-pi/provider-credentials.ts';

test('SM02 official DeepSeek private key remains bound, authorized and absent from status',async()=>{
 const env:Record<string,string|undefined>={DEEPSEEK_API_KEY:'synthetic-deepseek-only'};
 const c=createApprovedProviderCredentials({environment:env,readText:async()=>{throw Object.assign(Error('missing'),{code:'ENOENT'});}});
 await assert.rejects(c.withCredential('deepseek',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
 await assert.rejects(c.refresh(false),{code:'CREDENTIAL_READ_NOT_AUTHORIZED'});
 await c.refresh(true);
 assert.deepEqual(await c.withCredential('deepseek',x=>({provider:x.provider,model:x.model,endpoint:x.endpoint,keyMatched:x.key===env.DEEPSEEK_API_KEY})),{provider:'deepseek',model:'deepseek-flash',endpoint:'https://api.deepseek.com',keyMatched:true});
 assert.equal(JSON.stringify(c.status()).includes('synthetic-deepseek-only'),false);
 await assert.rejects(c.withCredential('volcengine-plan',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
 await c.refresh(false).catch(()=>undefined);await assert.rejects(c.withCredential('deepseek',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
 env.DEEPSEEK_API_KEY='invalid\nkey';await c.refresh(true);await assert.rejects(c.withCredential('deepseek',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
 delete env.DEEPSEEK_API_KEY;await c.refresh(true);await assert.rejects(c.withCredential('deepseek',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
});

test('V12-RT02: existing private Keychain supplies MiMo; normal refresh does not scan retired zcode',async()=>{
 const reads:string[]=[];let keyReads=0;
 const credentials=createApprovedProviderCredentials({homeDirectory:'/synthetic',environment:{},readText:async path=>{reads.push(path);if(path.endsWith('/.pi/agent/auth.json'))return JSON.stringify({'minimax-cn':{key:'synthetic-main'}});throw Object.assign(Error('missing'),{code:'ENOENT'});},backupStore:{read:async()=>{keyReads++;return {status:'found',key:'synthetic-keychain'};}}});
 await assert.rejects(credentials.refresh(false),{code:'CREDENTIAL_READ_NOT_AUTHORIZED'});assert.equal(keyReads,0);
 await credentials.refresh(true);assert.equal(credentials.status().backup.state,'configured');assert.deepEqual(reads,['/synthetic/.pi/agent/auth.json']);
 const route=await credentials.withCredential('xiaomi-token-plan-cn',c=>({provider:c.provider,model:c.model,endpoint:c.endpoint,matched:c.key==='synthetic-keychain'}));
 assert.deepEqual(route,{provider:'xiaomi-token-plan-cn',model:'mimo-v2.6-flash',endpoint:'https://token-plan-cn.xiaomimimo.com/v1',matched:true});
 credentials.status();await credentials.withCredential('xiaomi-token-plan-cn',()=>undefined);assert.equal(keyReads,1);assert.ok(!JSON.stringify(credentials.status()).includes('synthetic-keychain'));
});

test('V12-RT02/04: revoke during Keychain read prevents late private snapshot publication',async()=>{
 let release!:(value:{status:'found';key:string})=>void;const pending=new Promise<{status:'found';key:string}>(resolve=>release=resolve);
 const credentials=createApprovedProviderCredentials({environment:{},backupStore:{read:()=>pending},readText:async()=>{throw Object.assign(Error('missing'),{code:'ENOENT'});}});
 const refreshing=credentials.refresh(true);await credentials.refresh(false).catch(error=>assert.equal(error.code,'CREDENTIAL_READ_NOT_AUTHORIZED'));
 release({status:'found',key:'late-synthetic-key'});await assert.rejects(refreshing,{code:'CREDENTIAL_REFRESH_REVOKED'});
 assert.equal(credentials.status().backup.state,'missing');await assert.rejects(credentials.withCredential('xiaomi-token-plan-cn',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
});

test('V12-RT02: unavailable/absent/malformed Keychain retains accurate state and never stale key',async()=>{
 let mode='found';const credentials=createApprovedProviderCredentials({environment:{},backupStore:{read:async()=>{if(mode==='unreadable')throw Error('private OS failure');return mode==='absent'?{status:'absent'}:{status:'found',key:mode==='invalid'?'bad\nkey':'synthetic-key'};}},readText:async()=>{throw Object.assign(Error('missing'),{code:'ENOENT'});}});
 await credentials.refresh(true);assert.equal(credentials.status().backup.state,'configured');
 for(const state of ['unreadable','absent','invalid']){mode=state;await credentials.refresh(true);assert.equal(credentials.status().backup.state,state==='absent'?'missing':state);await assert.rejects(credentials.withCredential('xiaomi-token-plan-cn',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});}
});

test('V12-RT02: conflicting explicit environment cannot fall through to Keychain',async()=>{
 let reads=0;const credentials=createApprovedProviderCredentials({environment:{LLM_API_KEY:'synthetic',LLM_MODEL:'unknown',LLM_BASE_URL:backup},backupStore:{read:async()=>{reads++;return {status:'found',key:'synthetic-key'};}}});
 await credentials.refresh(true);assert.equal(credentials.status().backup.state,'conflict');assert.equal(reads,0);
});

const main='https://api.minimax.cn/anthropic',backup='https://token-plan-cn.xiaomimimo.com/v1';
function fixture(files:Record<string,string>,environment:Record<string,string>={}) {
 const factory=createApprovedProviderCredentials;
 assert.equal(typeof factory,'function','OA-RT02: authorized bounded backend discovery must exist');
 const reads:string[]=[];
 const credentials=factory({legacyZcode:true,homeDirectory:'/synthetic',environment,readText:async(path:string)=>{reads.push(path);if(!(path in files))throw Object.assign(new Error('missing'),{code:'ENOENT'});return files[path];}});
 return {credentials,reads};
}
const zcode=(entries:unknown)=>JSON.stringify({provider:entries});
test('OA-RT02: unauthorized initialization reads neither environment key nor files',async()=>{
 const {credentials,reads}=fixture({}, {LLM_API_KEY:'synthetic-key',LLM_BASE_URL:main,LLM_MODEL:'MiniMax-M3'});
 await assert.rejects(credentials.refresh(false),{code:'CREDENTIAL_READ_NOT_AUTHORIZED'});
 assert.deepEqual(reads,[]);assert.equal(JSON.stringify(credentials.status()).includes('synthetic-key'),false);
});
test('OA-RT02: environment tuple must match recipient; conflict does not fall through',async()=>{
 const {credentials,reads}=fixture({}, {LLM_API_KEY:'synthetic-key',LLM_BASE_URL:main,LLM_MODEL:'mimo-v2.6-flash'});
 await credentials.refresh(true);assert.equal(credentials.status().primary.state,'conflict');
 await assert.rejects(credentials.withCredential('minimax-cn',()=>assert.fail('must not issue')),{code:'CREDENTIAL_UNAVAILABLE'});
 assert.deepEqual(reads,[]);
});
test('OA-RT02: main and backup retain exact binding and only refresh discovers files',async()=>{
 const {credentials,reads}=fixture({'/synthetic/.zcode/v2/config.json':zcode({mm:{options:{baseURL:main,apiKey:'synthetic-main'}},xm:{options:{baseURL:backup,apiKey:'synthetic-backup'}}})});
 await credentials.refresh(true);assert.equal(credentials.status().primary.state,'configured');assert.equal(credentials.status().backup.state,'configured');
 assert.equal(await credentials.withCredential('minimax-cn',(c:{key:string;model:string})=>c.key+':'+c.model),'synthetic-main:MiniMax-M3');
 assert.equal(await credentials.withCredential('xiaomi-token-plan-cn',(c:{key:string;model:string})=>c.key+':'+c.model),'synthetic-backup:mimo-v2.6-flash');
 const count=reads.length;credentials.status();credentials.status();assert.equal(reads.length,count);
 assert.deepEqual(reads,['/synthetic/.zcode/v2/config.json']);
 const visible=JSON.stringify(credentials.status());for(const secret of ['synthetic-main','synthetic-backup','/synthetic','.zcode'])assert.equal(visible.includes(secret),false);
});
test('OA-RT02: same-tier ambiguity is blocked rather than arbitrarily selecting a key',async()=>{
 const {credentials}=fixture({'/synthetic/.zcode/v2/config.json':zcode({one:{options:{baseURL:main,apiKey:'first-key'}},two:{options:{baseURL:main,apiKey:'second-key'}}})});
 await credentials.refresh(true);assert.equal(credentials.status().primary.state,'conflict');
 await assert.rejects(credentials.withCredential('minimax-cn',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
});
test('OA-RT02: damaged zcode falls back only to designated Pi MiniMax entry',async()=>{
 const {credentials,reads}=fixture({'/synthetic/.zcode/v2/config.json':'not-json','/synthetic/.pi/agent/auth.json':JSON.stringify({'unrelated':{key:'never-selected'},'minimax-cn':{key:'pi-main'}})});
 await credentials.refresh(true);assert.equal(credentials.status().primary.state,'configured');assert.equal(credentials.status().backup.state,'invalid');
 assert.equal(await credentials.withCredential('minimax-cn',(c:{key:string})=>c.key),'pi-main');
 assert.deepEqual(reads,['/synthetic/.zcode/v2/config.json','/synthetic/.pi/agent/auth.json']);
});
test('OA-RT02: refresh removes stale credentials; unknown provider cannot obtain key',async()=>{
 const files={'/synthetic/.zcode/v2/config.json':zcode({mm:{options:{baseURL:main,apiKey:'first-key'}}})};const {credentials}=fixture(files);
 await credentials.refresh(true);await assert.rejects(credentials.withCredential('other',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
 files['/synthetic/.zcode/v2/config.json']='{}';await credentials.refresh(true);assert.equal(credentials.status().primary.state,'missing');
 await assert.rejects(credentials.withCredential('minimax-cn',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
});
test('OA-RT02/04: revoking permission during discovery forbids late credential publication',async()=>{
 const factory=createApprovedProviderCredentials;assert.equal(typeof factory,'function');
 let release!:(value:string)=>void;const waiting=new Promise<string>(resolve=>release=resolve);
 const credentials=factory({legacyZcode:true,homeDirectory:'/synthetic',environment:{},readText:()=>waiting});
 const discovering=credentials.refresh(true);
 await assert.rejects(credentials.refresh(false),{code:'CREDENTIAL_READ_NOT_AUTHORIZED'});
 release(zcode({mm:{options:{baseURL:main,apiKey:'late-key'}}}));
 await assert.rejects(discovering,{code:'CREDENTIAL_REFRESH_REVOKED'});
 assert.equal(credentials.status().primary.state,'missing');
 await assert.rejects(credentials.withCredential('minimax-cn',()=>assert.fail()),{code:'CREDENTIAL_UNAVAILABLE'});
});

test('R1-RT07: approved legacy source credential binds current minimaxi recipient without changing the private source',async()=>{
 const {credentials,reads}=fixture({'/synthetic/.zcode/v2/config.json':zcode({mm:{options:{baseURL:main,apiKey:'synthetic-main'}}})});await credentials.refresh(true);assert.equal(credentials.status().primary.host,'api.minimaxi.com');const recipient=await credentials.withCredential('minimax-cn',(c:{endpoint:string;model:string})=>({endpoint:c.endpoint,model:c.model}));assert.deepEqual(recipient,{endpoint:'https://api.minimaxi.com/anthropic',model:'MiniMax-M3'});assert.deepEqual(reads,['/synthetic/.zcode/v2/config.json']);
});
