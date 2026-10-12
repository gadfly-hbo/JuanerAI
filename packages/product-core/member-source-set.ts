import {membershipBytesHash, membershipRecord, membershipUuid} from './member-analysis.ts';
import {taskHash, fail} from './member-task.ts';
import type {OwnerRef} from '../contracts/xanthil-desktop-ipc.ts';
import type {MemberSourceFile, MemberSourceInspection} from '../ports/member-source.ts';

export type SelectedMemberSources = Readonly<{
  version: '1.0'; id: string; task_id: string; owner: OwnerRef; selected_at: string;
  sources: readonly Readonly<{source_id: string; display_name: string; format: 'csv'|'xlsx'; sha256: string; byte_length: string}>[];
  inspection: MemberSourceInspection; inspection_sha256: string;
}>;

/** Copy caller-owned bytes before asynchronous inspection; original and derived identities never mix. */
export function selectedSourceFiles(input: unknown): MemberSourceFile[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 32) fail('VALIDATION_FAILED');
  let total = 0; const ids = new Set<string>();
  const result = input.map((value):MemberSourceFile => {
    const s = membershipRecord(value, ['source_id','display_name','format','bytes']);
    if (!membershipUuid(s.source_id) || ids.has(s.source_id) ||
        typeof s.display_name !== 'string' || !s.display_name.trim() || s.display_name.length > 200 || /[/\\\u0000-\u001f]/.test(s.display_name) ||
        (s.format !== 'csv' && s.format !== 'xlsx') || !(s.bytes instanceof Uint8Array) || !s.bytes.length || s.bytes.length > 8*1024*1024) fail('VALIDATION_FAILED');
    ids.add(s.source_id); total += s.bytes.length;
    return {source_id: s.source_id, display_name: s.display_name, format: s.format, bytes: new Uint8Array(s.bytes)};
  });
  if (total > 32*1024*1024) fail('SOURCE_CAPACITY');
  return result;
}

export function selectedSourceDescriptors(sources: readonly MemberSourceFile[]) {
  return sources.map(({bytes,...source}) => ({...source,sha256:membershipBytesHash(bytes),byte_length:String(bytes.length)}));
}

export function validateSelectedSources(value: unknown): SelectedMemberSources {
  const s = membershipRecord(value, ['version','id','task_id','owner','selected_at','sources','inspection','inspection_sha256']);
  const owner = membershipRecord(s.owner, ['project_id','session_id','case_id','revision_id']);
  if (s.version !== '1.0' || ![s.id,s.task_id,...Object.values(owner)].every(membershipUuid) ||
      typeof s.selected_at !== 'string' || !Number.isFinite(Date.parse(s.selected_at)) ||
      !Array.isArray(s.sources) || !s.sources.length || s.sources.length > 32) fail('INTEGRITY_BLOCKED');
  const inspection = membershipRecord(s.inspection, ['version','sources']);
  if (inspection.version !== '1.0' || !Array.isArray(inspection.sources) || inspection.sources.length !== s.sources.length || taskHash(inspection) !== s.inspection_sha256) fail('INTEGRITY_BLOCKED');
  const ids = new Set<string>();
  for (const [index,value] of s.sources.entries()) {
    const d = membershipRecord(value, ['source_id','display_name','format','sha256','byte_length']);
    if (!membershipUuid(d.source_id) || ids.has(d.source_id) || !['csv','xlsx'].includes(String(d.format)) ||
        typeof d.display_name !== 'string' || !d.display_name.trim() || d.display_name.length > 200 || /[/\\\u0000-\u001f]/.test(d.display_name) ||
        typeof d.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(d.sha256) || typeof d.byte_length !== 'string' || !/^[1-9]\d*$/.test(d.byte_length) || Number(d.byte_length)>8*1024*1024) fail('INTEGRITY_BLOCKED');
    ids.add(d.source_id);
    const item = membershipRecord(inspection.sources[index], ['source_id','display_name','format','sha256','byte_length','sheets']);
    if (Object.keys(d).some(key => d[key] !== item[key]) || !Array.isArray(item.sheets) || !item.sheets.length) fail('INTEGRITY_BLOCKED');
  }
  return structuredClone(value) as SelectedMemberSources;
}
