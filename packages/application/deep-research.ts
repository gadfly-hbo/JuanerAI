import type {ResearchGateway,ResearchCopies,ResearchVersion} from '../ports/deep-research.ts';
/** Opening and copying are separate from creating, confirming or publishing research. */
export function createResearchWorkspace(deps:Readonly<{gateway:ResearchGateway;copies:ResearchCopies;assertTask:()=>void;assertWrite:()=>void}>){
 return {
  async open(){deps.assertTask();const url=await deps.gateway.launch();deps.assertTask();return {url};},
  async state(){deps.assertTask();const state=await deps.gateway.state();deps.assertTask();return state;},
  async published(){deps.assertTask();return deps.gateway.published();},
  copies(){deps.assertTask();return deps.copies.list();},
  copy(id:string){deps.assertTask();return deps.copies.read(id);},
  receipt(commandId:string){deps.assertTask();return deps.copies.receipt(commandId);},
  async save(commandId:string,version:ResearchVersion){
   deps.assertTask();deps.assertWrite();const old=deps.copies.reserve(commandId,version);if(old){if(old.projectId!==version.projectId||old.runId!==version.runId||old.version!==version.version)throw Error('DR_COMMAND_CONFLICT');return old;}
   const output=await deps.gateway.export(version);deps.assertTask();deps.assertWrite();return deps.copies.save(commandId,version,output);
  },
 };
}
