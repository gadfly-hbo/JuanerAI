# Xanthil Desktop `JUANERAI_PUBLIC_RELEASE_GATE` Amendment

> Decision ID: `D05-XD-PRG-001`
> Gate ID: `JUANERAI_PUBLIC_RELEASE_GATE`
> Status: user approved on 2026-08-28; fresh Development-Readiness Review 001 `PASS`
> Scope: release-resource timing and acceptance evidence only
> Supersedes: any D0.5/D1-A statement that treats the three named release resources as a blocker before public-release preparation

## 1. Approved decision

The following requirements move to `JUANERAI_PUBLIC_RELEASE_GATE`:

1. final installed acceptance on a controlled real Windows 11 x64 host;
2. macOS code signing and notarization;
3. Windows code signing.

Their absence no longer blocks D1-A, any subsequent Xanthil Desktop Product Change, `DA_REQUIRED_COMPLETE`, or separately authorized Model Pack development. This timing decision does not itself authorize any Product Change, DISPATCH, dependency, Model Pack start, deployment, or public distribution.

## 2. Development evidence that remains required

Before `JUANERAI_PUBLIC_RELEASE_GATE` is activated, every Product Change still requires its approved behavior, negative cases, causal RED/GREEN, regression, packaged macOS evidence, cross-platform path/process/contract tests, and GitHub-hosted Windows build and automated smoke evidence where applicable. Platform-specific behavior that cannot be proved without a real Windows host remains explicitly `not_real_host_verified`; it may not be described as final Windows acceptance.

`DA_REQUIRED_COMPLETE` may be accepted after the five-capability integrated journey passes its frozen product contracts, macOS packaged replay, hosted Windows build/smoke, deterministic cross-platform suites, independent verification, and explicit user acceptance. It means the required Data Analyst workflow is development-complete; it does not mean publicly distributable, signed, notarized, production-ready, or finally accepted on a real Windows host.

The existing Model Pack start rule remains unchanged: Model Pack work begins only after `DA_REQUIRED_COMPLETE` and a separate explicit user authorization. The three deferred release resources are not additional Model Pack-development prerequisites.

## 3. `JUANERAI_PUBLIC_RELEASE_GATE`

This Gate activates only after the user explicitly authorizes preparation for formal public release. It is distinct from the per-Change signed `RELEASE` command in `product-change-execution-policy.md`, from `DA_REQUIRED_COMPLETE`, and from a Model Pack's internal lifecycle/release identity.

The Gate requires one frozen Release Candidate identity across both platforms, bound to the exact source commit, product version, contracts, dependency lock, bundled runtime/sidecar/Pack identities, and artifact checksums. That same Release Candidate must then provide:

- a macOS artifact signed with the approved identity, notarized, stapled or otherwise verified under the approved distribution path, installed on a supported Apple Silicon Mac, and replayed through the release acceptance suite;
- a Windows artifact code-signed with the approved identity, installed on a controlled real Windows 11 x64 host, and replayed through the same applicable release acceptance suite;
- checksum and provenance readback proving the installed artifacts are the frozen Release Candidate rather than rebuilt or substituted binaries;
- update/uninstall, data-preservation, rollback, failure, and recovery evidence appropriate to the public distribution channel;
- a Controller review and explicit user public-release decision after all evidence is frozen.

Any rebuild, identity/version/contract/lock/runtime/Pack change, signing change that changes bytes, or platform-specific patch creates a new Release Candidate and invalidates the other platform's prior RC acceptance until both platforms are re-bound and re-tested to that same candidate.

## 4. Fail-closed release boundary

Before this Gate passes:

- no artifact may be publicly distributed;
- no document, UI, website, release note, PR, or operator may claim `production ready`, `public release ready`, final Windows acceptance, or equivalent wording;
- development, internal validation, `DA_REQUIRED_COMPLETE`, and separately authorized Model Pack work may continue using clearly identified non-public development artifacts;
- credentials, private keys, certificate material, notarization secrets, and signing tokens remain outside the repository and evidence payloads.

The allowed pre-Gate claim is limited to the exact evidence held, such as `development complete`, `macOS packaged acceptance passed`, or `Windows hosted build/smoke passed`, with the real-host/signing gaps stated explicitly.

## 5. Current effect on D1-A

The Windows real-host, macOS signing/notarization, and Windows signing rows are release-deferred observations, not D1-A blockers. D1-A remains blocked only by the approved D0.5 PR not being integrated, the exact dependency policy not being frozen, and the eventual integrated Mac mini baseline/WIP freshness not being verified. No signed DISPATCH is created by this amendment.

## 6. Review result

The fresh material-isolated read-only review at [`reviews/public-release-gate-development-readiness-review-001.md`](reviews/public-release-gate-development-readiness-review-001.md) returned all seven required sections and `PASS`: no load-bearing guessing, external study, untestable requirement, or required plan addition remains.
