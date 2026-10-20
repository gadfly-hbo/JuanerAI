# Fixed request admission and local launch contract

## Source and scope

The actual fixed harness.5 admitModelRequest contract (dist/pi-adapter.js) measures
the final messages/tool declarations with its existing Pi-based estimate, then
adds protocolOverheadTokens, safetyMarginTokens and the candidate's actual output
reservation. It rejects before physical reservation/HTTP when requiredTokens
exceeds that candidate's ModelConfig.contextWindow. It also applies on fallback.
This Change does not replace that estimator, tokenizer, DTO or enforcement order.

The normal entry fixes policy_version=juanerai-browser-unified-v1,
protocol_overhead_tokens=4096, safety_margin_tokens=8192. These are explicit
engineering guard-band choices, not borrowed fixture128/512, measured Provider
usage, official tokenizer guarantees or a larger model window. Protocol headroom
is separate from an additional estimation safety margin; neither is spendable
output. The margins deliberately reduce admitted input and may conservatively
refuse a request. They are not a claim of a universal token-estimation error bound.
Changing this immutable deployment policy requires a new configuration identity.

Fixed source models retain M3 contextWindow200000 and Flash/Pro1048576. With a
32768 output cap the resulting estimated-input ceilings are154944 and1003520;
with16384 output they are171328 and1019904. Actual native compaction may request
less output. No window is raised, image allowance invented or candidate guard
disabled. CSV-only preparation creates no requirement for image-token estimates.

NE05 uses the real Adapter/installed SDK with synthetic large input: the M3
primary rejects before send/reservation; an allowed larger-window Flash request
followed by the existing M3 fallback rejects that smaller window before its send.
These are estimator/authorization evidence, not real Provider calibration. Real
DTO/usage reconciliation, quality and adequacy for F-B01 remain unverified until
separately authorized. This limitation is not evidence of an SDK capability gap.

## Normal local launch

JUANERAI_BROWSER_CONFIG is a non-secret absolute JSON file locator, forwarded by
the existing child-environment allowlist. The file must be regular, bounded and
non-symlink. Its closed shape is:

```json
{"version":"1.0","profile_root":"<explicit isolated absolute root>","analysis":{"newTaskPolicy":"unified-v1"}}
```

Only the existing metricAssetDisclosureAllowed boolean is optionally accepted in
analysis. No keys, endpoints, models, arbitrary environment, Task IDs, prompts,
Provider-call permission or budget are accepted here. The selected fixed policy
assembles the existing first-loop v0.2/shared-work-v1/review options and the R1
policy above. Missing/invalid/foreign configuration is refused before service
startup. npm web:start/open remain the normal entry; no other test/product host.
The startup-fixed GB combination is M3 analysis/proposal, Pro-off report/revision,
Flash-off review/re-review; it binds the actual UI-created UUID through the
existing review-policy callbacks before the first SDK configuration claim.
Configuration identity includes this combination, resource policy, admission and
the explicit uncapped-work policy. Legacy direct callers/ID whitelists remain.

## Lifetime compatibility

Work body v1 retains created_at+300000. New opt-in work body v2 has deadline_at:null,
meaning no cumulative runtime deadline, in the same business_work_v1 table. Draft
v1.0/v1.1 retain their finite plan; new v1.2 explicitly selects timing:unlimited.
Unknown, missing or mismatched policy is never interpreted as unlimited. There
is no table rebuild, migration, old-record rewrite, pause/renewal or finite stand-in.
An attempted execution-policy rebind fails closed; passive legacy reads remain.

Shared attempt identity/recovery/audit and reservations remain authoritative.
Every effect still checks cancellation and current authorization, including an
explicit expiry when the host grant supplies one. No300-second value is renamed
as authorization expiry. New work's per-model600/tool300/control30 protections
remain; stage60/120 and aggregate300 timers are not installed on v2. Existing
restricted Python supervision and size/sandbox protections are separate retained
contracts; this Change grants no general shell command capability. The120-second
command soft protection is not emulated by a hard kill or new command engine.
