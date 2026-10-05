import {membershipBytesHash,membershipRecord,membershipUuid} from './member-analysis.ts';
import {taskHash} from './member-task.ts';
import {canonicalDesktopJson,desktopRuleFailure,parseDesktopCsv} from './xanthil-desktop-decision-case.ts';
import type {MemberSourceInspection} from '../ports/member-source.ts';

const roleColumns={members:['member_id','member_group'],orders:['order_id','order_member_id','paid_at','amount','status','currency']} as const;
export type SourceRole=keyof typeof roleColumns;
export type SourceBinding=Readonly<{source_id:string;sheet_id:string;role:SourceRole;columns:Readonly<Record<string,string>>}>;
export type SourceLineage=Readonly<{role:SourceRole;normalized_row:number;source_id:string;sheet_id:string;source_row:number;columns:Readonly<Record<string,string>>}>;
export type SourceSet=Readonly<{version:'1.0';sources:readonly Readonly<{source_id:string;display_name:string;format:'csv'|'xlsx';sha256:string;byte_length:string;sheets:readonly Readonly<{sheet_id:string;name:string;state:string;row_count:number;unmapped_columns:readonly string[]}>[]}>[]}>;
export type SourceQualification=Readonly<{version:'1.0';status:'qualified';source_set:SourceSet;source_set_sha256:string;extraction_sha256:string;bindings:readonly SourceBinding[];bindings_sha256:string;normalized:Readonly<Record<SourceRole,Readonly<{sha256:string;byte_length:string}>>>;lineage:readonly SourceLineage[];qualification_sha256:string}>;

export function memberSourceBindings(bindingsInput:unknown):SourceBinding[]{
 if(!Array.isArray(bindingsInput)||!bindingsInput.length)desktopRuleFailure('CONVERSION_UNQUALIFIED');
 return bindingsInput.map(value=>{
  const b=membershipRecord(value,['source_id','sheet_id','role','columns']);
  if(!membershipUuid(b.source_id)||typeof b.sheet_id!=='string'||!b.sheet_id||!['members','orders'].includes(String(b.role)))desktopRuleFailure('CONVERSION_UNQUALIFIED');
  const role=b.role as SourceRole,columns=membershipRecord(b.columns,roleColumns[role]);
  if(Object.values(columns).some(x=>typeof x!=='string'||!x)||new Set(Object.values(columns)).size!==Object.keys(columns).length)desktopRuleFailure('CONVERSION_UNQUALIFIED');
  return structuredClone(b) as SourceBinding;
 });
}

/** Pure conversion checker. No generated-code permission or isolation claim is returned. */
export function qualifyExtractedMemberSources(inspection:MemberSourceInspection,bindingsInput:unknown,candidateInput:unknown):SourceQualification{
 const bindings=memberSourceBindings(bindingsInput);
 const candidate=membershipRecord(candidateInput,['members_bytes','orders_bytes']);
 if(!(candidate.members_bytes instanceof Uint8Array)||!(candidate.orders_bytes instanceof Uint8Array))desktopRuleFailure('CONVERSION_UNQUALIFIED');
 const expected:Record<SourceRole,string[][]>={members:[],orders:[]},lineage:SourceLineage[]=[],consumed=new Set<SourceBinding>(),keys={members:new Set<string>(),orders:new Set<string>()};
 const setSources:SourceSet['sources'][number][]=[];
 for(const source of inspection.sources){
  const sheets:SourceSet['sources'][number]['sheets'][number][]=[];
  for(const sheet of source.sheets){
   const choices=bindings.filter(b=>b.source_id===source.source_id&&b.sheet_id===sheet.sheet_id);
   if(choices.length!==1||sheet.rows.length<1||sheet.rows[0].row!==1)desktopRuleFailure('CONVERSION_UNQUALIFIED');
   const binding=choices[0];consumed.add(binding);
   const header=sheet.rows[0].cells;if(header.some(c=>!c.value)||new Set(header.map(c=>c.value)).size!==header.length)desktopRuleFailure('CONVERSION_UNQUALIFIED');
   const locations=Object.fromEntries(roleColumns[binding.role].map(name=>{const cell=header.find(c=>c.value===binding.columns[name]);if(!cell)desktopRuleFailure('CONVERSION_UNQUALIFIED');return [name,cell.column];}));
   const knownColumns=new Set(header.map(c=>c.column));
   for(const row of sheet.rows.slice(1)){
    if(row.cells.some(c=>!knownColumns.has(c.column)))desktopRuleFailure('CONVERSION_UNQUALIFIED');
    const cells=new Map(row.cells.map(c=>[c.column,c]));
    const values=roleColumns[binding.role].map(name=>cells.get(locations[name])?.value??'');
    if(!values[0]||keys[binding.role].has(values[0]))desktopRuleFailure('CONVERSION_UNQUALIFIED');keys[binding.role].add(values[0]);
    expected[binding.role].push(values);
    lineage.push({role:binding.role,normalized_row:expected[binding.role].length+1,source_id:source.source_id,sheet_id:sheet.sheet_id,source_row:row.row,columns:locations});
   }
   sheets.push({sheet_id:sheet.sheet_id,name:sheet.name,state:sheet.state,row_count:sheet.rows.length,unmapped_columns:header.filter(c=>!Object.values(binding.columns).includes(c.value)).map(c=>c.value)});
  }
  setSources.push({source_id:source.source_id,display_name:source.display_name,format:source.format,sha256:source.sha256,byte_length:source.byte_length,sheets});
 }
 if(consumed.size!==bindings.length||!expected.members.length||!expected.orders.length||expected.orders.some(row=>!keys.members.has(row[1])))desktopRuleFailure('CONVERSION_UNQUALIFIED');
 for(const role of ['members','orders'] as const){const parsed=parseDesktopCsv(candidate[`${role}_bytes`] as Uint8Array);if(canonicalDesktopJson(parsed.headers)!==canonicalDesktopJson(roleColumns[role])||canonicalDesktopJson(parsed.rows)!==canonicalDesktopJson(expected[role]))desktopRuleFailure('CONVERSION_UNQUALIFIED');}
 const descriptor=(bytes:Uint8Array)=>({sha256:membershipBytesHash(bytes),byte_length:String(bytes.length)});
 const source_set:SourceSet={version:'1.0',sources:setSources};
 const body={version:'1.0' as const,status:'qualified' as const,source_set,source_set_sha256:taskHash(source_set),extraction_sha256:taskHash(inspection),bindings,bindings_sha256:taskHash(bindings),normalized:{members:descriptor(candidate.members_bytes),orders:descriptor(candidate.orders_bytes)},lineage};
 return {...body,qualification_sha256:taskHash(body)};
}
