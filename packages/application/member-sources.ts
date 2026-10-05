import {membershipRecord, membershipUuid} from '../product-core/member-analysis.ts';
import {selectedSourceFiles} from '../product-core/member-source-set.ts';
import {fail} from '../product-core/member-task.ts';
import type {MemberSourceInspector} from '../ports/member-source.ts';
import type {MemberSourceStore} from '../ports/member-source-store.ts';

/** Local selection/inspection only: no model disclosure or preparation execution. */
export function createMemberSourcesApplication(store: MemberSourceStore, inspect: MemberSourceInspector) {
  return {
    async select(input: unknown, signal: AbortSignal) {
      const x = membershipRecord(input, ['version','task_id','command_id','expected_row_version','sources']);
      if (x.version !== '1.0' || !membershipUuid(x.task_id) || !membershipUuid(x.command_id) || !Number.isSafeInteger(x.expected_row_version) || Number(x.expected_row_version)<1 || !(signal instanceof AbortSignal)) fail();
      if (signal.aborted) fail('CANCELLED');
      const sources = selectedSourceFiles(x.sources);
      const inspection = await inspect({sources,cancellation_signal:signal,deadline_seconds:10});
      if (signal.aborted) fail('CANCELLED');
      return store.saveSourceSet({version:'1.0',task_id:x.task_id,command_id:x.command_id,expected_row_version:Number(x.expected_row_version),sources,inspection,cancellation_signal:signal});
    },
    read(task_id: string, source_set_id: string) { return store.readSourceSet({task_id,source_set_id}); },
  };
}
