// Synthetic private-pipe helper only. Never reads or modifies any macOS keychain.
import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,readFile,rm,realpath} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {pathToFileURL} from 'node:url';
const root=process.env.JUANERAI_REPORT_STUDIO_SOURCE;assert(root&&process.env.REPORT_STUDIO_BUILTIN==='1');
const {createStudioCredentialStore}=await import(pathToFileURL(join(root,'dist/juanerai/credentials.js')).href);
test('RS-CONFIG-01 closed providers and private stdin credentials; read never requests interaction',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'studio-key-helper-'));t.after(()=>rm(dir,{recursive:true,force:true}));const helper=join(dir,'synthetic-helper'),observation=join(dir,'observation.json');
 await writeFile(helper,`#!${process.execPath}\nimport {readFileSync,writeFileSync} from 'node:fs';const input=JSON.parse(readFileSync(0,'utf8'));writeFileSync(${JSON.stringify(observation)},JSON.stringify({provider:input.provider,operation:input.operation,interactive:input.interactive,argv:process.argv.slice(2),keys:Object.keys(process.env)}));process.stdout.write(JSON.stringify(input.operation==='read'?{status:'found',key:'synthetic-only'}:{status:'ok'}));`,{mode:0o700});
 const store=createStudioCredentialStore(helper);await store.save('minimax-cn','synthetic-only');let observed=JSON.parse(await readFile(observation,'utf8'));assert.equal(observed.interactive,true);assert.deepEqual(observed.argv,[]);assert(!observed.keys.includes('HOME'));assert(!JSON.stringify(observed).includes('synthetic-only'));
 assert.equal(await store.read('minimax-cn'),'synthetic-only');observed=JSON.parse(await readFile(observation,'utf8'));assert.equal(observed.interactive,false);await store.remove('xiaomi-token-plan-cn');
 await assert.rejects(()=>store.read('other-provider'),/RS_CREDENTIAL_INVALID/);await assert.rejects(()=>store.save('minimax-cn','secret\nline'),/RS_CREDENTIAL_INVALID/);await assert.rejects(()=>store.save('minimax-cn',''),/RS_CREDENTIAL_INVALID/);
});
test('RS-CONFIG-01 helper failures never expose helper diagnostics or keys',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'studio-key-helper-failed-'));t.after(()=>rm(dir,{recursive:true,force:true}));const helper=join(dir,'synthetic-helper');
 for(const body of ["process.stderr.write('synthetic-only');process.exit(1)","process.stdout.write(JSON.stringify({status:'found',key:'synthetic-only',unexpected:true}))","process.stdout.write('synthetic-only malformed')"]){
 await writeFile(helper,`#!${process.execPath}\n${body}`,{mode:0o700});try{await createStudioCredentialStore(helper).read('minimax-cn');assert.fail('must fail');}catch(error){assert.equal(error.message,'RS_CREDENTIAL_UNAVAILABLE');assert(!String(error.stack).includes('synthetic-only'));}}
});

test('RS-CONFIG-01 saved own configuration is distinct from Provider verification; no discovery or retry',async t=>{
 const {createStudioConfiguration}=await import(pathToFileURL(join(root,'dist/juanerai/configuration.js')).href);const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-config-')));t.after(()=>rm(dir,{recursive:true,force:true}));const keys=new Map();let reads=0,writes=0,busy=false;
 const config=createStudioConfiguration({dataRoot:dir,newId:()=> '00000001-1111-4111-a111-111111111111',canChange:async()=>!busy,credentials:{async read(p){reads++;return keys.get(p)??null;},async save(p,key){writes++;keys.set(p,key);},async remove(p){keys.delete(p);}}});
 assert.deepEqual(await config.status(),{revision:0,state:'not_configured',providers:[],provider_verification:'not_performed'});assert.equal(reads,0);
 const saved=await config.save('minimax-cn','synthetic-only',0);assert.equal(saved.state,'ready');assert.equal(saved.revision,1);assert.equal(saved.provider_verification,'not_performed');assert.equal(writes,1);assert.equal((await config.load()).get('minimax-cn'),'synthetic-only');
 assert(!(await readFile(join(dir,'.juanerai-configuration.json'),'utf8')).includes('synthetic-only'));
 await assert.rejects(()=>config.save('minimax-cn','synthetic-new',0),/RS_CONFIGURATION_CHANGED/);assert.equal(writes,1);
 busy=true;await assert.rejects(()=>config.save('xiaomi-token-plan-cn','synthetic-two',1),/RS_PROJECT_PENDING/);assert.equal(writes,1);busy=false;
 const removed=await config.remove('minimax-cn',1);assert.equal(removed.state,'not_configured');assert.equal(removed.revision,2);assert.equal(keys.size,0);
});

test('RS-CONFIG-01 unknown credential write remains blocked across restart and is never replayed',async t=>{
 const {createStudioConfiguration}=await import(pathToFileURL(join(root,'dist/juanerai/configuration.js')).href);const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-config-unknown-')));t.after(()=>rm(dir,{recursive:true,force:true}));let writes=0;
 const options={dataRoot:dir,newId:()=> '00000002-1111-4111-a111-111111111111',canChange:async()=>true,credentials:{async read(){return 'synthetic-only';},async save(){writes++;throw Error('synthetic-secret-error');},async remove(){}}};const config=createStudioConfiguration(options);
 await assert.rejects(()=>config.save('minimax-cn','synthetic-only',0),/RS_CREDENTIAL_WRITE_UNKNOWN/);assert.equal(writes,1);assert.equal((await config.status()).state,'unknown');
 const restarted=createStudioConfiguration(options);assert.equal((await restarted.status()).state,'unknown');await assert.rejects(()=>restarted.load(),/RS_CONFIGURATION_UNAVAILABLE/);assert.equal(writes,1);assert(!(await readFile(join(dir,'.juanerai-configuration.json'),'utf8')).includes('synthetic-only'));
});

test('RS-CONFIG-01 unknown cannot be hidden by configuring a different provider; explicit same-provider removal resolves',async t=>{
 const {createStudioConfiguration}=await import(pathToFileURL(join(root,'dist/juanerai/configuration.js')).href);const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-config-resolve-')));t.after(()=>rm(dir,{recursive:true,force:true}));let writes=0,removed=false;
 const config=createStudioConfiguration({dataRoot:dir,newId:()=> '00000003-1111-4111-a111-111111111111',canChange:async()=>true,credentials:{async read(){return removed?null:'synthetic-only';},async save(){writes++;throw Error('synthetic lost reply');},async remove(){removed=true;}}});
 await assert.rejects(()=>config.save('minimax-cn','synthetic-only',0));await assert.rejects(()=>config.save('xiaomi-token-plan-cn','synthetic-two',1),/RS_CONFIGURATION_RECONCILIATION_REQUIRED/);assert.equal(writes,1);assert.equal((await config.status()).state,'unknown');
 assert.equal((await config.remove('minimax-cn',1)).state,'not_configured');assert.equal((await config.status()).revision,2);
});

test('RS-CONFIG-01 metadata corruption and links cannot trigger keychain calls',async t=>{
 const {createStudioConfiguration}=await import(pathToFileURL(join(root,'dist/juanerai/configuration.js')).href);const {symlink,unlink}=await import('node:fs/promises');const dir=await realpath(await mkdtemp(join(tmpdir(),'studio-config-corrupt-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 const config=createStudioConfiguration({dataRoot:dir,newId:()=> '00000004-1111-4111-a111-111111111111',canChange:async()=>true,credentials:{async read(){assert.fail('no credential discovery');},async save(){assert.fail('no credential effect');},async remove(){assert.fail('no credential effect');}}});
 const path=join(dir,'.juanerai-configuration.json');await writeFile(path,'unknown future metadata');await assert.rejects(()=>config.status(),/RS_CONFIGURATION_INVALID/);await assert.rejects(()=>config.save('minimax-cn','synthetic-only',0));assert.equal(await readFile(path,'utf8'),'unknown future metadata');
 await unlink(path);const target=join(dir,'retained');await writeFile(target,'retained metadata');await symlink(target,path);await assert.rejects(()=>config.status(),/RS_CONFIGURATION_UNSAFE/);assert.equal(await readFile(target,'utf8'),'retained metadata');
});
