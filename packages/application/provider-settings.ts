import {approvedMemberPolicy} from '../product-core/member-model-policy.ts';
import {taskHash} from '../product-core/member-task.ts';
import { createHash, randomUUID } from 'node:crypto';
import type { LocalCredentialStore, ConnectionProbe, LocalModelAccess,ModelOccupant } from '../ports/provider-settings.ts';
import type { ProviderSettingsStatus, ProviderSettingsResult } from '../contracts/provider-settings.ts';
const probeCodes = ['CREDENTIAL_INVALID','NETWORK_UNAVAILABLE','CONNECTION_TIMEOUT','QUOTA_EXCEEDED','CONNECTION_FAILED'] as const;
function fail(code: string): never { throw Object.assign(new Error(code), { code, stack: code }); }
function keyValid(key: unknown): key is string { return typeof key==='string' && key.trim().length>0 && Buffer.byteLength(key)<=4096 && !/[\r\n\0]/.test(key); }
const digest=(key:string)=>createHash('sha256').update(key).digest('hex');
/** One local configuration, one admitted model task/test. No business persistence. */
export function createProviderSettings(input: { store: LocalCredentialStore; probe: ConnectionProbe }) {
  let state:ProviderSettingsStatus['state']='unconfigured', configured=false, generation=0, identity:string|null=null;
  let lastTest:ProviderSettingsStatus['last_test']='none', busy=false, closed=false, taskKey:string|undefined;
  let taskOwner:ModelOccupant|null=null;
  let proof:{id:string;hash:string;generation:number}|undefined, pending:AbortController|undefined;
  let epoch=0;const invalidIdentities=new Set<string>();
  function status():ProviderSettingsStatus { return {configured,state,busy,generation,last_test:lastTest}; }
  function sync(key:string|null) {
    const next=key===null?null:digest(key);
    const invalid=next!==null&&invalidIdentities.has(next);
    if(next!==identity){generation++;identity=next;proof=undefined;lastTest=key===null?'none':'passed';}
    configured=key!==null;state=configured?(invalid?'credential_invalid':'configured'):'unconfigured';
  }
  async function readKey():Promise<string|null> {
    try { const result=await input.store.read();if(result.status==='absent')return null;if(result.status==='found'&&keyValid(result.key))return result.key; }
    catch { /* OS details and keys must never escape. */ }
    state='keychain_unavailable';proof=undefined;fail('KEYCHAIN_UNAVAILABLE');
  }
  function lock() { if(closed)fail('CANCELLED');if(busy)fail('MODEL_BUSY');busy=true; }
  function cancel(){epoch++;proof=undefined;pending?.abort();}
  async function initialize(){lock();try{sync(await readKey());}catch{/* Visible unavailable state; no fallback. */}finally{busy=false;}}
  const access:LocalModelAccess={
    occupant:()=>busy?(taskOwner??{session_id:null,label:'模型接入'}):null,
    snapshot:()=>({generation,available:state==='configured'}),
    async acquire(expected,owner){
      lock();taskOwner=owner??{session_id:null,label:'专业模式辅助'};
      try {
        if(expected!==generation)fail('CONFIGURATION_CHANGED');
        const previousState=state,key=await readKey();
        if(closed)fail('CANCELLED');
        const changed=(key===null?null:digest(key))!==identity;sync(key);
        if(changed||expected!==generation)fail('CONFIGURATION_CHANGED');
        if(previousState==='credential_invalid'||state==='credential_invalid'){state='credential_invalid';fail('CREDENTIAL_INVALID');}
        if(key===null)fail('MODEL_NOT_CONFIGURED');
        taskKey=key;let released=false;
        return {release(){if(released)return;released=true;taskKey=undefined;taskOwner=null;busy=false;}};
      }catch(error){taskKey=undefined;taskOwner=null;busy=false;throw error;}
    },
  };
  async function request(raw:unknown):Promise<ProviderSettingsResult>{
    try{
      if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_REQUEST');
      const r=raw as Record<string,unknown>,operation=r.operation;
      const keys=operation==='test'?['operation','key']:operation==='save'?['operation','key','proof']:operation==='delete'?['operation','confirmed']:['operation'];
      if(Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k))||!['read','refresh','cancel','test','save','delete'].includes(String(operation)))fail('INVALID_REQUEST');
      if(operation==='read')return {ok:true,value:status()};
      if(operation==='cancel'){cancel();return {ok:true,value:status()};}
      if(operation==='test'&&r.key!==null&&!keyValid(r.key)||operation==='save'&&(!keyValid(r.key)||typeof r.proof!=='string')||operation==='delete'&&r.confirmed!==true)fail('INVALID_REQUEST');
      lock();
      try{
        if(operation==='refresh'){sync(await readKey());return {ok:true,value:status()};}
        if(operation==='test'){
          proof=undefined;const controller=new AbortController();pending=controller;
          try{
            const key=r.key===null?await readKey():r.key as string;
            if(key===null)fail('MODEL_NOT_CONFIGURED');
            if(r.key===null&&(digest(key)!==identity)){sync(key);fail('CONFIGURATION_CHANGED');}
            if(controller.signal.aborted||closed)fail('CANCELLED');
            await input.probe(key,controller.signal);
            if(controller.signal.aborted||closed)fail('CANCELLED');
            if(r.key===null){invalidIdentities.delete(digest(key));lastTest='passed';state='configured';}
            else proof={id:randomUUID(),hash:digest(key),generation};
            return {ok:true,value:status(),...(proof?{proof:proof.id}:{})};
          }catch(error){
            if(controller.signal.aborted||closed)fail('CANCELLED');
            const code=String((error as {code?:unknown})?.code??'CONNECTION_FAILED');
            if(r.key===null&&probeCodes.includes(code as typeof probeCodes[number])){lastTest=code as typeof probeCodes[number];if(code==='CREDENTIAL_INVALID'){if(identity)invalidIdentities.add(identity);state='credential_invalid';}}
            fail([...probeCodes,'KEYCHAIN_UNAVAILABLE','MODEL_NOT_CONFIGURED','CONFIGURATION_CHANGED'].includes(code as never)?code:'CONNECTION_FAILED');
          }finally{pending=undefined;}
        }
        if(operation==='save'){
          if(!proof||proof.id!==r.proof||proof.generation!==generation||proof.hash!==digest(r.key as string)){proof=undefined;fail('TEST_REQUIRED');}
          const savingProof=proof,savingEpoch=epoch;
          // Read before mutation too: an externally changed key invalidates this proof.
          const old=await readKey();if((old===null?null:digest(old))!==identity){sync(old);fail('CONFIGURATION_CHANGED');}
          if(closed||epoch!==savingEpoch)fail('CANCELLED');
          if(proof!==savingProof||proof.generation!==generation||proof.hash!==digest(r.key as string))fail('TEST_REQUIRED');
          try{await input.store.save(r.key as string);}catch{/* Outcome is decided only by readback. */}
          const actual=await readKey();sync(actual);
          if(actual!==r.key)fail('SAVE_FAILED');
          invalidIdentities.delete(digest(r.key as string));generation++;proof=undefined;lastTest='passed';state='configured';return {ok:true,value:status()};
        }
        if(operation==='delete'){
          try{await input.store.delete();}catch{/* Never guess whether a mutation committed. */}
          const actual=await readKey();sync(actual);if(actual!==null)fail('DELETE_FAILED');
          proof=undefined;return {ok:true,value:status()};
        }
        fail('INVALID_REQUEST');
      }finally{busy=false;}
    }catch(error){
      const known=['INVALID_REQUEST','CANCELLED','MODEL_BUSY','KEYCHAIN_UNAVAILABLE','MODEL_NOT_CONFIGURED','CONFIGURATION_CHANGED','TEST_REQUIRED','SAVE_FAILED','DELETE_FAILED',...probeCodes];
      const code=String((error as {code?:unknown})?.code??'');return {ok:false,code:known.includes(code)?code:'KEYCHAIN_UNAVAILABLE',value:status()};
    }
  }
  return {initialize,status,access,async request(raw:unknown){const result=await request(raw);return {...result,value:status()};},taskCredential(){if(!busy||!taskKey||closed)fail('AUTHORITY_REQUIRED');return taskKey;},
    reportTaskFailure(code:string,expectedGeneration=generation){if(expectedGeneration!==generation)return;if(code==='CREDENTIAL_INVALID'){if(identity)invalidIdentities.add(identity);state='credential_invalid';}if(probeCodes.includes(code as typeof probeCodes[number]))lastTest=code as typeof probeCodes[number];},
    close(){closed=true;cancel();taskKey=undefined;},
  };
}

/** Same local exclusion contract for Profiles without a credential-backed lease. */
export function createLocalModelAccess(available:boolean):LocalModelAccess{
 let owner:ModelOccupant|null=null;
 return {snapshot:()=>({generation:0,available}),occupant:()=>owner,
 async acquire(generation,context){if(owner)fail('MODEL_BUSY');if(generation!==0)fail('CONFIGURATION_CHANGED');if(!available)fail('MODEL_NOT_CONFIGURED');
 owner=context??{session_id:null,label:'专业模式辅助'};let released=false;return {release(){if(released)return;released=true;owner=null;}};
 }};
}

/** Read-only product-policy identity plus current shared-slot availability; no credential read/test. */
export function createMembershipPolicyAccess(store:import('../ports/provider-settings.ts').MembershipPolicyStore,modelAccess:LocalModelAccess){return {async read(){const policy=await store.read();if(!policy)fail('MODEL_POLICY_REQUIRED');const validated=approvedMemberPolicy(policy);return {policy:validated,sha256:taskHash(validated),material_classes:['selected_task_text','source_structure','verified_m1_aggregate'] as const,available:modelAccess.snapshot().available};}};}
