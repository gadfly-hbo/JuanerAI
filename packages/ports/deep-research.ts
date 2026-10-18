/** Host business identity. Plugin SDK/session types do not cross this boundary. */
export type ResearchVersion = Readonly<{projectId:string;runId:string;version:number}>;
export type ResearchCopy = ResearchVersion & Readonly<{
  id:string;taskId:string;sourceCommit:string;copiedAt:string;sha256:string;bytes:number;
  contentSha256:string;limitations:readonly string[];unresolved:readonly string[];
}>;
export interface ResearchGateway {
  launch():Promise<string>;
  state():Promise<Readonly<{unknown:boolean;active:number;effects:number;requests?:number}>>;
  published():Promise<readonly ResearchVersion[]>;
  export(version:ResearchVersion):Promise<Readonly<{bytes:Uint8Array;contentSha256:string;limitations:string[];unresolved:string[]}>>;
}
export interface ResearchCopies {
  list():readonly ResearchCopy[];
  read(id:string):Readonly<{receipt:ResearchCopy;bytes:Uint8Array}>;
  receipt(commandId:string):ResearchCopy|null;
  reserve(commandId:string,version:ResearchVersion):ResearchCopy|null;
  save(commandId:string,version:ResearchVersion,output:Readonly<{bytes:Uint8Array;contentSha256:string;limitations:string[];unresolved:string[]}>):ResearchCopy;
}
