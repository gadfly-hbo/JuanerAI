import {join} from 'node:path';
import {createResearchProcess} from '../../adapters/deep-research/process.mjs';
import {createResearchCopies} from '../../adapters/deep-research/copies.mjs';
import {createResearchGateway} from '../../adapters/deep-research/gateway.mjs';
import {createResearchWorkspace} from '../../packages/application/deep-research.ts';
import {membershipUuid} from '../../packages/product-core/member-analysis.ts';

export type ResearchTaskContext={root:string;projectId:string;taskId:string;check():void;checkControl?():void;authorizedAttachments?:readonly {sourcePath:string;bytes:number;sha256:string}[]};
export function createPersonalResearchRuntime(options:{programRoot?:string;manifestSha256?:string;hostOrigin:()=>string;fixtureModule?:string;pythonExecutable?:()=>string|undefined;credentialEnvironment?:Readonly<Record<string,string>>;authorize?:(task:ResearchTaskContext,request:{effect:string;detail:unknown})=>Promise<boolean>}){
 const contexts=new Map<string,ResearchTaskContext>();
 const effectChecks=new Map<string,()=>void>();
 const processes=new Map<string,ReturnType<typeof createResearchProcess>>();
 return {
  task(context:ResearchTaskContext){
   if(!membershipUuid(context.projectId)||!membershipUuid(context.taskId))throw Error('DR_TASK_INVALID');context.check();
   const root=join(context.root,'.juanerai','deep-research',context.taskId),key=context.projectId+':'+context.taskId;
   contexts.set(key,context);let runtime=processes.get(key);
   if(!runtime&&options.programRoot&&options.manifestSha256){runtime=createResearchProcess({programRoot:options.programRoot,manifestSha256:options.manifestSha256,dataRoot:join(root,'workspace'),authorizedAttachments:context.authorizedAttachments,hostOrigin:options.hostOrigin(),pythonExecutable:options.pythonExecutable?.(),fixtureModule:options.fixtureModule,credentialEnvironment:options.credentialEnvironment,authorize:async request=>{
     // Trusted profile policy is the sole effect authority; the browser cannot grant it.
     try{const current=contexts.get(key)!;current.check();const grant=effectChecks.get(key);if(!grant)return false;grant();const allowed=options.authorize?await options.authorize(current,request)===true:request.effect==='http';current.check();grant();return allowed;}catch{return false;}
   }});processes.set(key,runtime);}
   const unavailable=async():Promise<never>=>{throw Error('DR_BUNDLE_UNAVAILABLE');};
   const workspace=createResearchWorkspace({gateway:runtime?createResearchGateway({process:runtime,programRoot:options.programRoot!}):{launch:unavailable,state:unavailable,published:unavailable,export:unavailable},copies:createResearchCopies({root:join(root,'copies'),taskId:context.taskId}),assertTask:context.check,assertWrite(){if(!context.checkControl)throw Error('DR_CONTROL_REQUIRED');context.checkControl();}});
   return {...workspace,async open(){context.check();if(!context.checkControl)throw Error('DR_CONTROL_REQUIRED');context.checkControl();effectChecks.set(key,context.checkControl);return workspace.open();}};
  },
  async assertIdle(){for(const runtime of processes.values()){const state=await runtime.state();if(state.unknown||state.active||state.effects||state.requests)throw Error('DR_WORK_UNSETTLED');}},
  async close(){for(const runtime of processes.values()){const state=await runtime.state();if(state.unknown||state.active||state.effects)throw Error('DR_WORK_UNSETTLED');}for(const runtime of processes.values())await runtime.close();},
 };
}
