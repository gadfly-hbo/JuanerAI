/** Local-only source inspection; it grants neither disclosure nor generated-code execution. */
export type MemberSourceFile = Readonly<{source_id:string;display_name:string;format:'csv'|'xlsx';bytes:Uint8Array}>;
export type MemberSourceCell = Readonly<{column:string;type:'string'|'number'|'boolean'|'date'|'blank';value:string;source_value?:string}>;
export type MemberSourceSheet = Readonly<{sheet_id:string;name:string;state:'visible'|'hidden'|'veryHidden';rows:readonly Readonly<{row:number;cells:readonly MemberSourceCell[]}>[]}>;
export type MemberSourceInspection = Readonly<{version:'1.0';sources:readonly Readonly<{source_id:string;display_name:string;format:'csv'|'xlsx';sha256:string;byte_length:string;sheets:readonly MemberSourceSheet[]}>[]}>;
export type MemberSourceInspector = (input:Readonly<{sources:readonly MemberSourceFile[];cancellation_signal:AbortSignal;deadline_seconds:number}>)=>Promise<MemberSourceInspection>;
