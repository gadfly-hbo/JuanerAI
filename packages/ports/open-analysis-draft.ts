/** Private bounded construction receipt. Saving is neither execution nor review qualification. */
export type DraftBinding=Readonly<{task_id:string;operation_id:string;scope_sha256:string;config_sha256:string;kind:'python'|'report'|'revision'|'review'}>;
export type DraftRef=Readonly<{id:string;version:number;sha256:string;bytes:number;sealed:boolean}>;
export type DraftCommand=Readonly<{command_id:string;base_version:number}> & (Readonly<{action:'append';text:string}>|Readonly<{action:'patch';before:string;after:string}>|Readonly<{action:'seal'}>);
export type DraftPlan=Readonly<{max_bytes:number;usual_ms:number;recovery_ms:number;full_deadline:number}>|Readonly<{max_bytes:number;timing:'unlimited'}>;
export interface AnalysisDraftStore {
 begin(binding:DraftBinding,plan:DraftPlan):DraftRef;
 read(binding:DraftBinding,id:string):Readonly<{ref:DraftRef;text:string}>;
 /** Atomic native file replacement; no model-supplied version or command identity. */
 write(binding:DraftBinding,id:string,text:string):DraftRef;
 command(binding:DraftBinding,id:string,command:DraftCommand):DraftRef;
 admit(binding:DraftBinding,id:string,input:Readonly<{logicalId:string;recovery:boolean}>):boolean;
 check(binding:DraftBinding,id:string,recovery?:boolean):void;
 close(binding:DraftBinding,id:string,status:'completed'|'failed'|'stopped'|'unknown'):void;
}
