export type ResearchProcess = {
 launch():Promise<string>;api(path:string,body?:unknown):Promise<{bytes:Uint8Array;mediaType:string|null}>;
 state():Promise<{unknown:boolean;active:number;effects:number;requests?:number}>;close():Promise<void>;
};
export function createResearchProcess(options:{programRoot:string;manifestSha256:string;dataRoot:string;hostOrigin?:string;pythonExecutable?:string;authorizedAttachments?:readonly {sourcePath:string;bytes:number;sha256:string}[];fixtureModule?:string;credentialEnvironment?:Readonly<Record<string,string>>;authorize?:(request:{effect:string;detail:unknown})=>Promise<boolean>}):ResearchProcess;
