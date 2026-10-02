-- Existing analysis_runs CHECK changes to run_contract_version IN ('3.0','4.0').

CREATE TABLE membership_configs (
 config_id TEXT NOT NULL, version TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 PRIMARY KEY(config_id, version)
);
CREATE TABLE membership_tasks (
 task_id TEXT NOT NULL PRIMARY KEY, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL,
 current_revision_id TEXT NOT NULL, row_version INTEGER NOT NULL CHECK(row_version>0), epoch INTEGER NOT NULL CHECK(epoch>=0),
 status TEXT NOT NULL CHECK(status IN ('idle','running','waiting','stopped','interrupted','closed')),
 UNIQUE(project_id,session_id,case_id), UNIQUE(task_id,project_id,session_id,case_id),
 FOREIGN KEY(project_id,session_id,case_id,current_revision_id) REFERENCES case_revisions(project_id,session_id,case_id,revision_id)
);
CREATE TABLE membership_plans (
 plan_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL,
 confirmation_id TEXT NOT NULL, snapshot_id TEXT NOT NULL, config_id TEXT NOT NULL, config_version TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 UNIQUE(plan_id,project_id,session_id,case_id,revision_id),
 FOREIGN KEY(task_id,project_id,session_id,case_id) REFERENCES membership_tasks(task_id,project_id,session_id,case_id),
 FOREIGN KEY(project_id,session_id,case_id,revision_id,confirmation_id) REFERENCES input_confirmations(project_id,session_id,case_id,revision_id,confirmation_id),
 FOREIGN KEY(project_id,session_id,case_id,revision_id,snapshot_id) REFERENCES source_snapshots(project_id,session_id,case_id,revision_id,snapshot_id),
 FOREIGN KEY(config_id,config_version) REFERENCES membership_configs(config_id,version)
);
CREATE TABLE membership_run_plans (
 run_id TEXT NOT NULL PRIMARY KEY, plan_id TEXT NOT NULL, project_id TEXT NOT NULL, session_id TEXT NOT NULL, case_id TEXT NOT NULL, revision_id TEXT NOT NULL,
 FOREIGN KEY(project_id,session_id,case_id,revision_id,run_id) REFERENCES analysis_runs(project_id,session_id,case_id,revision_id,run_id),
 FOREIGN KEY(plan_id,project_id,session_id,case_id,revision_id) REFERENCES membership_plans(plan_id,project_id,session_id,case_id,revision_id)
);
CREATE TABLE membership_grants (
 grant_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, predecessor_id TEXT, epoch INTEGER NOT NULL CHECK(epoch>=0), body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 revoked_at TEXT, UNIQUE(task_id,grant_id), FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id), FOREIGN KEY(task_id,predecessor_id) REFERENCES membership_grants(task_id,grant_id)
);
CREATE TABLE membership_attempts (
 attempt_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, grant_id TEXT NOT NULL, epoch INTEGER NOT NULL CHECK(epoch>=0),
 status TEXT NOT NULL CHECK(status IN ('reserved','issued','waiting','settled','unresolved')), body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 UNIQUE(task_id,attempt_id), FOREIGN KEY(task_id,grant_id) REFERENCES membership_grants(task_id,grant_id)
);
CREATE UNIQUE INDEX membership_one_live_attempt ON membership_attempts(task_id) WHERE status IN ('reserved','issued','waiting','unresolved');
CREATE TABLE membership_usage (
 reservation_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, grant_id TEXT NOT NULL, attempt_id TEXT, run_id TEXT,
 status TEXT NOT NULL CHECK(status IN ('reserved','issued','settled','unresolved')), body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 CHECK((attempt_id IS NULL)<>(run_id IS NULL)), FOREIGN KEY(task_id,grant_id) REFERENCES membership_grants(task_id,grant_id),
 FOREIGN KEY(task_id,attempt_id) REFERENCES membership_attempts(task_id,attempt_id), FOREIGN KEY(run_id) REFERENCES analysis_runs(run_id)
);
CREATE TABLE membership_events (
 event_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, attempt_id TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 FOREIGN KEY(task_id,attempt_id) REFERENCES membership_attempts(task_id,attempt_id)
);
CREATE TABLE membership_comments (
 comment_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, report_id TEXT NOT NULL, report_sha256 TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id), FOREIGN KEY(report_id) REFERENCES report_versions(report_id)
);
CREATE TABLE membership_reviews (
 review_id TEXT NOT NULL, version INTEGER NOT NULL CHECK(version>0), task_id TEXT NOT NULL, body_json TEXT NOT NULL, body_sha256 TEXT NOT NULL,
 PRIMARY KEY(review_id,version), FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id)
);
CREATE TABLE membership_receipts (
 command_id TEXT NOT NULL PRIMARY KEY, task_id TEXT NOT NULL, fingerprint TEXT NOT NULL, review_id TEXT, review_version INTEGER,
 result_json TEXT NOT NULL, UNIQUE(review_id,review_version), CHECK((review_id IS NULL)=(review_version IS NULL)),
 FOREIGN KEY(task_id) REFERENCES membership_tasks(task_id), FOREIGN KEY(review_id,review_version) REFERENCES membership_reviews(review_id,version)
);
