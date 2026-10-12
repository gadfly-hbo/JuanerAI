/** Consumed only by new schema120 projects; no existing-project activation. */
export const memberOperationSchema=`
CREATE TABLE membership_operation_grants (
 grant_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, epoch INTEGER NOT NULL CHECK(epoch>=0), scope_sha256 TEXT NOT NULL,
 policy_json TEXT NOT NULL, policy_sha256 TEXT NOT NULL, expires_at TEXT NOT NULL, revoked INTEGER NOT NULL CHECK(revoked IN (0,1)),
 FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id), UNIQUE(task_id,grant_id)
);
CREATE TABLE membership_operations (
 operation_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, logical_key TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('model','preparation','analysis')), stage TEXT NOT NULL, input_sha256 TEXT NOT NULL, scope_sha256 TEXT NOT NULL,
 FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id), UNIQUE(task_id,logical_key), UNIQUE(task_id,operation_id)
);
CREATE TABLE membership_operation_usage (
 execution_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, operation_id TEXT NOT NULL, execution_index INTEGER NOT NULL CHECK(execution_index IN (0,1)),
 grant_id TEXT NOT NULL, epoch INTEGER NOT NULL CHECK(epoch>=0), phase TEXT NOT NULL CHECK(phase IN ('reserved','issued','unresolved','settled')),
 outcome TEXT CHECK(outcome IS NULL OR outcome IN ('succeeded','temporary_failure','conversion_failure','permanent_failure','stopped')),
 calls INTEGER NOT NULL CHECK(calls IN (0,1)), local_runs INTEGER NOT NULL CHECK(local_runs IN (0,1)), usage_json TEXT NOT NULL, usage_sha256 TEXT NOT NULL,
 FOREIGN KEY(task_id,operation_id) REFERENCES membership_operations(task_id,operation_id), FOREIGN KEY(task_id,grant_id) REFERENCES membership_operation_grants(task_id,grant_id),
 UNIQUE(operation_id,execution_index), CHECK(calls+local_runs<=1)
);
CREATE UNIQUE INDEX membership_operation_one_physical ON membership_operation_usage((1)) WHERE phase IN ('reserved','issued','unresolved');
CREATE TABLE membership_analysis_operations (
 run_id TEXT PRIMARY KEY NOT NULL, execution_id TEXT UNIQUE NOT NULL, plan_sha256 TEXT NOT NULL,
 FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id), FOREIGN KEY(execution_id) REFERENCES membership_operation_usage(execution_id)
);
CREATE TABLE membership_browser_receipts (
 command_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id)
);
`;
