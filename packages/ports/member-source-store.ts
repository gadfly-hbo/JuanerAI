import type {MemberSourceFile, MemberSourceInspection} from './member-source.ts';
import type {SelectedMemberSources} from '../product-core/member-source-set.ts';

export interface MemberSourceStore {
  saveSourceSet(input: {version:'1.0'; task_id:string; command_id:string; expected_row_version:number; sources:readonly MemberSourceFile[]; inspection:MemberSourceInspection; cancellation_signal:AbortSignal}): Promise<SelectedMemberSources>;
  readSourceSet(input: {task_id:string; source_set_id:string}): Promise<{source_set:SelectedMemberSources; sources:readonly MemberSourceFile[]}>;
}
