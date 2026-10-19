/** Independent maintenance workspace; no implicit Case or analysis association. */
export type MetricPublication=Readonly<{packageId:string;version:string;contentFingerprint:string;packageFingerprint:string;sha256:string;bytes:Uint8Array}>;
export type MetricReceipt=Omit<MetricPublication,'bytes'>&Readonly<{bytes:number;sourceSnapshot:string;savedAt:string}>;
export interface MetricCopies {
 save(value:MetricPublication):MetricReceipt;
 read(packageId:string,version?:string):Readonly<{receipt:MetricReceipt;bytes:Uint8Array}>;
}
export interface MetricWorkspace {
 status():Promise<{available:boolean}>;
 open(check:()=>void):Promise<{url:string}>;
 state():Promise<{active:boolean;unknown:boolean;requests:number}>;
 close():Promise<void>;
}
