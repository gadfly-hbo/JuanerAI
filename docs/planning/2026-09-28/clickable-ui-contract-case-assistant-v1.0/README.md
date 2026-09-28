# Xanthil Case Assistant Clickable UI Contract v1.0

This attachment is the clickable companion to:

- `../xanthil-case-assistant-product-plan-v1.0.md`
- `../xanthil-case-assistant-ui-contract-v1.0.md`

Open `dist/index.html` in a browser. It uses synthetic content, performs no network request, does not call a model, and does not read or write business data.

The user-provided brand asset is preserved byte-for-byte at `dist/assets/juanerai-logo-slogan.png` (SHA-256 `56bdb1196e9f1bbaef64c973c4108d12294246de6e941fa00821a2769e3e0e21`). The compact shell displays the logo with the exact slogan `持续做出更好的决策`; Xanthil Desktop remains the product name.

## UI Gate paths

1. In Professional mode, select stage 6 and click `用 Case Assistant 完成决策`.
2. In Quick mode, inspect `任务授权`, then confirm the synthetic attempt.
3. Stop an attempt and use `继续此工作`; each continuation visibly creates a new Attempt whose authorization lists the exact reused message, normalized receipt, report summary, and exclusions.
4. Let an attempt finish, then edit the full field set. Switch among `选择已有候选 / 不行动 / 暂缓`, trigger a required-field error, save, cancel an unsaved edit, reject, or adopt the pending draft.
5. Trigger `来源 revision 变化` and `当前决定版本变化` from the UI Contract scenario panel and verify adoption is blocked. Rebind to r8 and inspect the new exact data identity plus the explicit r7 exclusions; start/stop again to confirm continuation stays on r8. In the current-decision path, verify the other Session's DR-002 / EO-002 / v2 stays readable, restart from that formal baseline, stop and continue once to confirm the new authorization still discloses DR-002 / EO-002 / v2, and confirm a later adoption appends DR-003 / EO-003 / v3 while v2 becomes readable superseded history.
6. Click Fork or Subagent and verify that only a Preview explanation appears.
7. After synthetic adoption, return to Professional mode and inspect stage 6 plus the new report version. Open v1 history, create a pending formal-record revision, then cancel it and verify no v3 is created.

The displayed resource caps are explicitly marked as illustrative UI Contract values. They demonstrate required disclosure and hard-limit behavior but do not freeze production defaults or authorize provider spend.

## Retained review views

- `screenshots/quick-unapproved.png` — linked Quick Session before task authorization
- `screenshots/pending-draft.png` — structured pending Decision Record and Expected Outcome
- `screenshots/professional-entry.png` — professional stage 6 Case Assistant entry
- `screenshots/professional-adopted.png` — adopted result and report-version return flow

These screenshots are review aids; the clickable attachment is the authoritative UI behavior contract.
