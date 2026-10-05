import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {BrowserWorkspaceReadback, BrowserStopReceipt, BrowserReviewReceipt} from '../../packages/ports/browser-membership.ts';
import {membershipRecord as closed, membershipUuid} from '../../packages/product-core/member-analysis.ts';
import {encodeTask, taskHash, fail, type TaskState} from '../../packages/product-core/member-task.ts';
import {createBrowserDesktopReadback} from './desktop-state.ts';
import {validateSelectedSources} from '../../packages/product-core/member-source-set.ts';
import {fenceMemberOperations,memberOperationMethods} from './member-operation.ts';

type Access = <T>(write: boolean, work: (db: DatabaseSync) => T) => T;
export function browserMembershipMethods(access: Access, read: (db: DatabaseSync, id: string) => TaskState,projectRoot:string): BrowserWorkspaceReadback {
  function input(value: unknown, command: boolean) {
    const x = closed(value, command ? ['task_id', 'command_id'] : ['task_id']);
    if (!membershipUuid(x.task_id) || command && !membershipUuid(x.command_id)) fail();
    return {task_id: String(x.task_id), command_id: String(x.command_id)};
  }
  function receipt(db: DatabaseSync, task_id: string, command_id: string): BrowserStopReceipt | BrowserReviewReceipt | null {
    const row = db.prepare('SELECT * FROM membership_browser_receipts WHERE command_id=?').get(command_id);
    if (!row) return null;
    if (row.task_id !== task_id) fail('COMMAND_CONFLICT');
    const value = JSON.parse(String(row.body_json));
    if (taskHash(value) !== row.body_sha256) fail('INTEGRITY_BLOCKED');
    return value;
  }
  return {
    async readBrowserReportCopy(value){const x=closed(value,['task_id','report_id']);if(!membershipUuid(x.task_id)||!membershipUuid(x.report_id))fail();const task=access(false,db=>read(db,String(x.task_id)));return createBrowserDesktopReadback(projectRoot).readReportExport({command_id:randomUUID(),...task.owner,report_id:x.report_id,format:'html'});},
    async listBrowserTasks(projectId){if(!membershipUuid(projectId))fail();return access(false,db=>db.prepare('SELECT t.task_id,t.status,t.row_version,t.epoch,r.question_text FROM membership_tasks t JOIN case_revisions r ON r.revision_id=t.current_revision_id WHERE t.project_id=? ORDER BY t.rowid').all(projectId).map(r=>({task_id:String(r.task_id),status:String(r.status),row_version:Number(r.row_version),epoch:Number(r.epoch),question:String(r.question_text)})));},
    async readBrowserCommand(commandId){if(!membershipUuid(commandId))fail();return access(false,db=>{
      const clarification=db.prepare('SELECT body_json,body_sha256 FROM membership_clarifications WHERE command_id=?').get(commandId);if(clarification){const b=JSON.parse(String(clarification.body_json));return {version:'1.0' as const,kind:'clarification_saved' as const,command_id:commandId,task_id:String(b.task_id),grant_id:String(b.grant_id),clarification_sha256:String(clarification.body_sha256)};}
      const granted=db.prepare('SELECT grant_id,task_id,body_json FROM membership_model_grants WHERE command_id=?').get(commandId);if(granted)return {version:'1.0' as const,kind:'model_authorized' as const,command_id:commandId,task_id:String(granted.task_id),grant_id:String(granted.grant_id),epoch:Number(JSON.parse(String(granted.body_json)).epoch)};
      const selected=db.prepare('SELECT task_id,source_set_id FROM membership_source_sets WHERE command_id=?').get(commandId);if(selected)return {version:'1.0' as const,kind:'sources_selected' as const,command_id:commandId,task_id:String(selected.task_id),source_set_id:String(selected.source_set_id)};
      const stop=db.prepare('SELECT task_id FROM membership_browser_receipts WHERE command_id=?').get(commandId);if(stop)return receipt(db,String(stop.task_id),commandId);
      const created=db.prepare('SELECT task_id,result_json FROM membership_receipts WHERE command_id=?').get(commandId);if(created){const result=JSON.parse(String(created.result_json));if(result.kind==='human_review')return {version:'1.0' as const,kind:'review_submitted' as const,command_id:commandId,task_id:String(created.task_id),receipt:result};if(result.kind!=='task_created')fail('COMMAND_CONFLICT');return {version:'1.0' as const,kind:'task_created' as const,command_id:commandId,task_id:String(created.task_id)};}
      const partial=db.prepare('SELECT operation_kind FROM command_receipts WHERE command_id=?').get(commandId);if(partial){if(partial.operation_kind==='create_session')return {version:'1.0' as const,kind:'task_creation_pending' as const,command_id:commandId};fail('COMMAND_CONFLICT');}return null;
    });},
    async readBrowserTask(value) {
      const {task_id} = input(value, false);
      const saved=access(false, db => {
        const task = read(db, task_id);
        const revision = db.prepare('SELECT question_text FROM case_revisions WHERE revision_id=?').get(task.owner.revision_id);
        if (!revision) fail('INTEGRITY_BLOCKED');
        const selected=db.prepare('SELECT body_json FROM membership_source_sets WHERE task_id=? ORDER BY rowid DESC LIMIT 1').get(task_id),set=selected?validateSelectedSources(JSON.parse(String(selected.body_json))):null;
        const source_summary=set?{id:set.id,sources:set.sources.map(source=>({...source,sheets:set.inspection.sources.find(s=>s.source_id===source.source_id)!.sheets.map(sheet=>({name:sheet.name,row_count:sheet.rows.length}))}))}:null;
        const latest=db.prepare('SELECT body_json FROM membership_model_attempts WHERE task_id=? ORDER BY rowid DESC LIMIT 1').get(task_id),attempt=latest?JSON.parse(String(latest.body_json)) as import('../../packages/ports/member-model.ts').MemberModelAttempt:null;
        const clarifications=db.prepare('SELECT body_json,body_sha256 FROM membership_clarifications WHERE task_id=? ORDER BY rowid').all(task_id).map(r=>({reply:String(JSON.parse(String(r.body_json)).reply),sha256:String(r.body_sha256)}));
        const model=attempt?{answerable:attempt.status==='succeeded'&&attempt.result?.output.kind==='question'&&!db.prepare('SELECT id FROM membership_clarifications WHERE question_execution_id=?').get(attempt.context.execution_id),execution_id:attempt.context.execution_id,stage:attempt.payload.stage,status:attempt.status,question:attempt.result?.output.kind==='question'?attempt.result.output.text:null,failure_code:attempt.failure_code,current:attempt.context.epoch===task.epoch&&!['stopped','interrupted','closed'].includes(task.status)}:null;
        const grant=db.prepare('SELECT m.body_json,g.revoked FROM membership_model_grants m JOIN membership_operation_grants g ON g.grant_id=m.grant_id WHERE m.task_id=? ORDER BY m.rowid DESC LIMIT 1').get(task_id),g=grant?JSON.parse(String(grant.body_json)):null;
        const material_grant=g?{grant_id:String(g.grant_id),source_set_id:g.source_set_id===null?null:String(g.source_set_id),policy_sha256:String(g.policy_sha256),disclose_verified_result:g.disclose_verified_result===true,active:grant!.revoked===0&&g.epoch===task.epoch&&g.revision_id===task.owner.revision_id&&Date.now()<Date.parse(g.expires_at)&&!['stopped','interrupted','closed'].includes(task.status)}:null;
        const prepRow=db.prepare('SELECT body_json FROM membership_preparation_attempts WHERE task_id=? ORDER BY rowid DESC LIMIT 1').get(task_id),prep=prepRow?JSON.parse(String(prepRow.body_json)):null;
        const preparation=prep?{status:String(prep.status),failure_code:prep.failure_code as string|null,current:prep.context.epoch===task.epoch&&prep.source_set_id===set?.id,execution_id:String(prep.context.execution_id)}:null;
        return {task, question: String(revision.question_text),source_summary,model,material_grant,clarifications,preparation};
      });
      return {...saved,case:await createBrowserDesktopReadback(projectRoot).readProjection(saved.task.owner),operations:await memberOperationMethods(access).readOperations({task_id})};
    },
    async readBrowserReceipt(value) {
      const x = input(value, true);
      return access(false, db => {read(db,x.task_id);const value=receipt(db,x.task_id,x.command_id);if(value&&value.kind!=='browser_stop')fail('COMMAND_CONFLICT');return value;});
    },
    async stopBrowserTask(value) {
      const x = input(value, true);
      return access(true, db => {
        const old = read(db, x.task_id), prior = receipt(db, x.task_id, x.command_id);
        if(prior){if(prior.kind!=='browser_stop')fail('COMMAND_CONFLICT');return prior;}
        if(['membership_receipts','membership_source_sets','membership_model_grants','command_receipts'].some(table=>db.prepare(`SELECT command_id FROM ${table} WHERE command_id=?`).get(x.command_id)))fail('COMMAND_CONFLICT');
        const at = new Date().toISOString();
        const status = old.status === 'closed' ? 'closed' : 'stopped';
        const epoch = old.epoch + 1;
        for (const g of old.grants.filter(g => g.revoked_at === null)) {
          const next = {...g, revoked_at: at};
          db.prepare('UPDATE membership_grants SET revoked_at=?,body_json=?,body_sha256=? WHERE grant_id=?')
            .run(at, encodeTask(next), taskHash(next), g.id);
        }
        fenceMemberOperations(db, x.task_id);
        db.prepare('UPDATE membership_tasks SET epoch=?,status=?,row_version=row_version+1 WHERE task_id=?').run(epoch, status, x.task_id);
        const result: BrowserStopReceipt = {version: '1.0', kind: 'browser_stop', ...x, epoch, status, at};
        db.prepare('INSERT INTO membership_browser_receipts VALUES(?,?,?,?)').run(x.command_id, x.task_id, encodeTask(result), taskHash(result));
        return result;
      });
    },
  };
}
