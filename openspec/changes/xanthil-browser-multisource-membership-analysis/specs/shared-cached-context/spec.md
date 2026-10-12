# Change005 v1.3 · SDK缓存上下文计量采用

## ADDED Requirements

### Requirement: UC100 fixed SDK usage compatibility

JuanerAI SHALL consume locally fixed shared SDK0.4.3 package SHA256475480217d5f644a15264b2f838e5567d3e2c2e431b8a23c061a0665dbdbfa70 after fresh independent read-only SDK review. The package SHALL preserve all Provider-reported cache input in existing native Harness usage, trigger native compaction according to unchanged settings, and retain the authoritative Task ledger and immutable purpose configuration. It SHALL NOT rewrite historical consumption, failed or UNKNOWN effects, replace the Task, change model/retry/timeouts/output limits or add a product-local compaction engine. Standardv0.3 remains authoritative; UC100-1~6 shared contract controls acceptance.

#### Scenario: Fixed package is reproducible
- GIVEN approved exact local package bytes and a passed independent SDK review
- WHEN the existing production dependency/lock and CI preparation consumer adopt it
- THEN only the SDK dependency identity and directly affected version projections change, Pi remains0.86.1 and unrelated dependencies remain identical
- AND the former0.4.2 package and descriptor preimages remain available for rollback.

#### Scenario: Same Task survives exact package adoption
- GIVEN existing native JSONL, SQLite accounting, no active owner and retained historic unknown reservation
- WHEN the unchanged Task configuration is reopened with the new package
- THEN the configuration digest/old accounting remain unchanged, new known total input adds once, failed/UNKNOWN history remains and no old effect is replayed.

#### Scenario: Bad usage and missing usage
- GIVEN malformed categories or incomplete provider reporting
- WHEN the shared SDK consumes them
- THEN bad categories close admission before tool effects/settlement; missing values are not invented, existing conservative output policy and unknown reserves remain.

Full AS04 and MiMo report require separately actual same-Task consumption; shared mechanism PASS is not full Change or user acceptance. Existing model030 synthetic validation budget remains1207requests/2Moutput/UTC07:28:54,1139calls and624149known/73728UNKNOWN preserved at intake.
