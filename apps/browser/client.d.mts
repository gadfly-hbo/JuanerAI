export type PendingBrowserCommand={kind:'create'|'sources'|'stop'|'review_open'|'review_save'|'review_submit'|'model_authorization'|'clarification';command_id:string;task_id:string|null;definite:boolean};
export function createWorkspaceClient(options?:{request?:(path:string,options?:RequestInit)=>Promise<Response>;storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>|null;control?:string|null}):{
 session():Promise<{authenticated:true;generation:number}>;takeControl():Promise<void>;hasControl():boolean;
 canWrite():boolean;pending():PendingBrowserCommand|null;
 answer(task:{task_id:string;row_version:number;epoch:number},questionExecutionId:string,policySha256:string,reply:string):Promise<unknown>;
 copy(taskId:string,reportId:string):Promise<Blob>;
 policy():Promise<unknown>;authorizeModel(task:{task_id:string;row_version:number;epoch:number},sourceSetId:string|null,policySha256:string,discloseQuestion:boolean,discloseVerifiedResult?:boolean):Promise<unknown>;
 list():Promise<unknown>;read(id:string):Promise<unknown>;create(question:string):Promise<unknown>;
 select(task:{task_id:string;row_version:number;epoch:number},sources:readonly unknown[]):Promise<unknown>;
 stop(taskId:string):Promise<unknown>;
 review(task:{task_id:string;epoch:number},operation:'open'|'save'|'submit',input?:Record<string,unknown>):Promise<unknown>;
 recover():Promise<{status:'none'|'unknown'|'partial'|'recorded'|'rejected';receipt?:unknown}>;
};
export function browserSourceFiles(files:readonly File[]):Promise<readonly {source_id:string;display_name:string;format:'csv'|'xlsx';base64:string}[]>;
