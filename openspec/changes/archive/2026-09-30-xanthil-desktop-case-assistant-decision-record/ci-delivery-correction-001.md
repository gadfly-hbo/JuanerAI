# CI delivery correction 001

## Scope and authority

The user authorized a test-only correction after the first PR46 cloud failure at
head `13f693d4c68bcf3a1d03b556030b03937712a8be`. Only
`tools/harness/validation/run.test.mjs` and this new archive note change in the
repository. The accepted Change002, its archived original documents,
production source, runner, TypeScript configuration, package018 and DMG011
remain unchanged. The active Change directory is not restored.

The worker performs no Git writes, dependency installation, network or Provider
calls, native GUI execution, or project-control writes. Controller retains Git
delivery and acceptance authority. No new product/UI decision is requested.

## Minimum specification and cause

The accepted root tuple is the preserved 43 baseline roots plus all 25 Change1
roots and exactly 28 approved Change002 additions: 96 roots. The additions are
listed independently in `CHANGE002_TSCONFIG_APPENDIX`; their accepted source is
candidate010 and the AC-01–13 / PS-01–08 scope. Expected values are never generated
from the live configuration. The literal list was checked against candidate010's
immutable `source/tsconfig.json` and the unchanged live configuration.

The full runner retains the exact 15 test phases, explicit synthetic fixture
build before desktop E2E, and serial desktop E2E argv. Portable mode retains its
14 applicable phases and explicitly reports package/native/GUI checks NOT RUN.
Every child must have the real-model gate removed. Wrong roots, configuration,
selectors, phase order, concurrency or failed prerequisites must be rejected.

Cloud and local reproduction identified stale Change1-only test expectations:
68 roots, an incomplete desktop test inventory, an E2E phase matcher that missed
the accepted serial flag, and a fake Node that rejected the accepted fixture
builder. No production runner defect was found.

## Test correction and preservation

- Preserve the original 25 Change1 appendix literals and all 13 original test
  cases, including C0/C1a tuple, version, argv, stop-on-failure, gate removal,
  portable exclusions and forbidden-selector assertions.
- Add explicit accepted Case Assistant and Provider Settings test paths to the
  closed desktop inventory; preserve every original path.
- Admit only the exact fixture-build command in the fake Node, record gate
  removal and assert its position before serial E2E.
- Add `CI-CHANGE002-001`: reject missing, extra, substituted and reordered roots
  and invalid Forge configuration in isolated copies.
- Add `CI-CHANGE002-002`: fail the fixture builder, preserve streamed error and
  exit code, and reject omitted build, changed concurrency and added selector
  mutations through the fixed phase/argv oracle.

No test was deleted, skipped or weakened. The fake fixture does not run Electron
or build an application. Expected phases remain literal and independent. See
`oracle-attribution.json` and the retained source diff for preservation readback.

## Execution evidence

Persistent root on the Mac mini:
`/Users/bendandebaba/JuanerAI-artifacts/xanthil-desktop-case-assistant-decision-record/ci-delivery-fix-001`.
Each execution retains exact argv, clean environment, stdout, stderr and exit.
The selected local runtime is pinned Node v26.0.0 from the already approved
Change1 toolchain; portable canonical uses its approved command-local bin.

| Execution | Actual result | Meaning |
|---|---|---|
| `red-001` full validation test glob | exit1; 25 tests, 15 pass, 10 fail | Eight causal stale-oracle failures; two separate missing archive-input failures |
| `green-001` same full glob | exit1; 27 tests, 25 pass, 2 fail | All corrected runner tests pass; two CI-SOURCE tests still lack the raw archive input |
| `runner-green-001` exact changed test file | exit0; 15 tests, 15 pass, 0 fail, 0 skip | Isolated confirmation of the corrected runner oracle and both new negative tests |
| `portable-001` canonical `--portable` | exit0; 2172 executions, 2171 pass, 0 fail, 1 skip; 14 groups | Actual portable regression, syntax and type validation; real-model gate removed |

The directory name `green-001` does not imply a full-suite PASS. Its raw exit is
1. The two CI-SOURCE failures occur at missing
`JUANERAI_CI_NODE_GYP_ARCHIVE` before archive verification, and are not causal
product RED. Cloud CI supplies that exact archive before running the test glob.
No archive was downloaded or invented locally. Controller has been asked for an
existing approved local archive path; the complete glob cannot be claimed GREEN
until that input is supplied and the command completes successfully.

## Delivery and return point

The small frozen candidate and readback live under the evidence root's
`candidate-001/`. It binds both changed files, original test bytes, cloud/local
failure evidence, exact commands, current results and the scope readback.
Historical candidate010 remains at `../candidate-010/`; its manifest SHA256 is
`62be1c4ce46740f8c199b411362948db8ecd70838f984d18c4d1175365853f83`.

DMG011 remains
`Xanthil-0.1.0-Change002-internal-arm64-011.dmg`, 232097609 bytes, SHA256
`32ee23123e5d443c9558614d9645897e9c9eb2d93c10bcbe6ec43e736f450b57`.
This test-only change requires no application rebuild, new native run or real
Provider call. It does not re-grant product acceptance or independent PASS.

Return to the Mac mini Engineering Controller with this fixed test diff and
complete evidence for review and authorized Git delivery. Remaining validation
limit: supply the exact approved raw node-gyp archive to the unchanged full test
glob, then recheck cloud CI. No other source change is indicated by current
evidence. The worker stops candidate writes after freezing; receiver readback
and Git delivery remain Controller actions.
