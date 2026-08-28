# CHG-xanthil-desktop-session-bootstrap — Frozen Dependency Policy

> Policy ID: `D1A-XDSB-DEP-001`
>
> Change ID: `CHG-xanthil-desktop-session-bootstrap`
>
> Status: `FROZEN_FOR_DISPATCH`
>
> Owner: MacBook Controller
>
> Observed: 2026-08-28 against the public npm registry
>
> Applies only to: Test-role environment provisioning and the first Desktop bootstrap Change

## 1. Runtime and package-manager boundary

- Node.js: `>=24.18.0 <27`. Acceptance evidence must name the exact Node version. The observed development/CI set is macOS `24.18.0`, Mac mini `25.9.0`, and hosted CI `26.0.0`.
- npm: exactly `11.12.1`; `packageManager` remains `npm@11.12.1`.
- Registry: package metadata and tarballs may come only from `https://registry.npmjs.org/`.
- Versions are exact. Ranges, tags, aliases, substitutions, upgrades, deduplication choices that alter the frozen direct graph, and alternative registries are forbidden.
- The Test role may materialize this table in `package.json` and `package-lock.json`; it may not choose dependencies.

## 2. Exact direct dependency manifest

All integrity values are npm registry `dist.integrity` values. Standard tarball identity is `https://registry.npmjs.org/<escaped-name>/-/<package-basename>-<version>.tgz`.

| Package | Exact version | Class | Purpose | License | npm integrity |
|---|---:|---|---|---|---|
| `@earendil-works/pi-coding-agent` | `0.84.2` | existing runtime | Preserve the current CLI/Pi Adapter baseline; this Change does not invoke or modify it | MIT | `sha512-l4E+B7hgXKWddRo8bC/eSue2aWZjEgJ9xIpf5p0Og+lq8a2TArCwJ0HCoCPCgaBP/tN4zbYH/wOwvx9pJpeLCA==` |
| `typebox` | `1.3.7` | existing runtime | Preserve existing versioned-contract validation | MIT | `sha512-meKuifc33Pccx0O6PdIzYMq3Og8zvP4TIi/a+Bw3AEMZMxOD0+RHGQvpglEe6Zdy3wZ8nqn/j95h8LUZLk/6Hg==` |
| `react` | `19.2.8` | runtime | Desktop renderer composition only | MIT | `sha512-PWaYA1L/q9u2u7xYQi+Y3L3Yfnie7XyLeaJICV1MGD6LprsBxcAqGjYyr0eY3p+QdsA+x/Irkt4Qif8D63+Sbw==` |
| `react-dom` | `19.2.8` | runtime | Render the local Desktop UI | MIT | `sha512-rVprimfGBG3DR+Tq0IQG2DT5PxKth1WIGDmj5yPmlzr4YBe7uyE+Du4oVqTDXZSHGGGXRtTJEGSSePyQCMBglQ==` |
| `@types/node` | `22.19.19` | existing development | Preserve current Node type baseline | MIT | `sha512-dyh/xO2Fh5bYrfWaaqGrRQQGkNdmYw6AmaAUvYeUMNTWQtvb796ikLdmTchRmOlOiIJ1TDXfWgVx1QkUlQ6Hew==` |
| `typescript` | `5.9.3` | existing development | Preserve current compiler baseline | Apache-2.0 | `sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==` |
| `electron` | `44.0.0` | development | Desktop host and packaged executable | MIT | `sha512-FkTqPrFPZYljdPI5b7KORGsJTd6FgUQDefl5MrU3Xz9R87pAj9JLreIjDqcRN8hJIkFHIou0o8kKzvcpT9qiRQ==` |
| `@electron-forge/cli` | `7.11.2` | development | Exact local package/make entry point | MIT | `sha512-c+C4ndLfHbxwZuCn9G8iT9wD/woLdaVkoSVjAIbj+0nJhi8UmiVsz/+Gxlj4cvhMRTzBMBxudstLU7RocMikfg==` |
| `@electron-forge/plugin-vite` | `7.11.2` | development | Exact renderer/main/preload build integration | MIT | `sha512-QagRgjXfMBeyP+NkMdUMqke/E0ldfcBycjkgCb2FEH3VnS+Llk5RE2716H3quTuUtRhX2gdRuUDdLsstHFuGWg==` |
| `@electron-forge/maker-zip` | `7.11.2` | development | Unsigned internal macOS/Windows CI ZIP artifact only | MIT | `sha512-FWnOm2MORX/nt8psnEtID3Vnt8Blby1NkzjU3KjXBPF9kave71C3lI8KbBbCeKKyTQ/S00i2FiglKdRWQ1WNTw==` |
| `vite` | `8.2.2` | development | Exact TypeScript/renderer build tool | MIT | `sha512-cFKLV/PRgAUlIRm5WjMjJ86jrftzpqcgH+Us+DS8mI3CDNiH30Whrz8uHL3+MOLPAgqbMBAqWdAHAphOAM+z/Q==` |
| `@types/react` | `19.2.18` | development | React renderer types | MIT | `sha512-AnzbBERsrLKtk2XSfTbYRLjQPdy116Sty4q+T+Bp3IC4l6jNBvreVPAHmpq9qhXQM7CXZPjLVmGMw9sy+hxQ3w==` |
| `@types/react-dom` | `19.2.5` | development | React DOM types | MIT | `sha512-fMPwH9v7r/pp43yUd2/Mbiex5KouJwwR3dzHkhLREUC6764VyDsqxhAxv6OFEYR1RhjOyD1naqba8ECDBe7ZQg==` |
| `playwright-core` | `1.62.1` | development | Electron-process E2E control without a browser bundle or browser-download script | Apache-2.0 | `sha512-wPYSwEBJY9GHraISXqyqtx0na0LpO3XEX7jNDhntbex7tzUS7kLnZsOlFruFJB4Hi/rhDMjXGqHewDZ68nYZVw==` |

The MIT and Apache-2.0 licenses are accepted for this bounded internal-development Change. This is not a public-release attribution or distribution review; that remains part of `JUANERAI_PUBLIC_RELEASE_GATE`.

## 3. Reviewed install and network sequence

The only authorized provisioning sequence is:

1. mechanically update the two approved package files to the exact manifest;
2. run `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`;
3. verify every direct version, registry tarball, integrity, and license and enumerate every transitive package containing a lifecycle script;
4. if and only if the scan shows no unapproved lifecycle execution requirement, run `npm ci --ignore-scripts --no-audit --no-fund`;
5. run exactly `node node_modules/electron/install.js` once per acceptance environment;
6. verify `node_modules/electron/dist/version`, `path.txt`, executable presence, package version, and the platform archive checksum before counting environment health as PASS.

`electron@44.0.0` has no npm lifecycle script. Its explicit installer calls `@electron/get`, selects the host platform/architecture, uses the package-bundled `checksums.json`, extracts into the package directory, and writes `path.txt`. The authorized binary source is Electron's default GitHub release endpoint only; mirror/custom filename/custom directory/platform/architecture/cache-bypass/remote-checksum overrides are forbidden.

Required bundled archive SHA-256 values:

- macOS Apple Silicon: `electron-v44.0.0-darwin-arm64.zip` = `076d79742986e1b100b69ebecc691cb07368045e54c9087cef631b8622b76a80`
- Windows x64 CI: `electron-v44.0.0-win32-x64.zip` = `e61aa3bcea8152bc0730abd015e47c032d778a0ef10e2a1c78ba3c4ea47942f9`

The Test role must stop with `DEPENDENCY_POLICY_BLOCKED` if a registry identity, integrity, license, lock resolution, Electron checksum, destination, or lifecycle-script fact differs. It cannot repair that conflict by selecting another package or version.

## 4. Forbidden capability and generated-path boundary

Direct or transitive packages must not add Python, DuckDB, SQLite/native database, auto-update, telemetry, crash upload, remote web content, generic shell execution, provider/model clients, arbitrary filesystem exposure, native business-data bindings, installer signing, notarization, Authenticode, DMG/MSI/NSIS/Squirrel makers, or browser downloads.

Expected platform/build transitive packages used solely by Electron, Forge, Vite, ZIP creation, extraction, bundling, or terminal-independent test control are permitted only when locked with registry and integrity in `package-lock.json`. Optional native packages for unsupported hosts may remain lockfile metadata but must not execute scripts or become product capabilities.

Generated repository paths are limited to ignored dependency/build/package outputs explicitly named by the approved Test Design. No generated file may enter a production, test, OpenSpec, governance, or project-control path except the two authorized package files.

## 5. Build and package boundary

- The Forge Vite integration is accepted as a pinned, Change-local build seam; its experimental upstream status is an explicit risk, so all related packages are exact-pinned and must be covered by package smoke tests.
- The ZIP maker is the only maker in this Change. Its output is an unsigned internal verification artifact, not a public installer and not production-release evidence.
- `playwright-core` may launch only the locally installed Electron executable. It may not download or launch Chromium/WebKit/Firefox bundles.
- Runtime code/package/UI/update downloads are forbidden.
- macOS local packaged smoke and hosted Windows CI build/automated smoke are required. Real Windows product acceptance and both signing systems remain deferred to `JUANERAI_PUBLIC_RELEASE_GATE`.

## 6. Freeze and invalidation

The canonical SHA-256 of this file after integration is the dependency-policy identity carried by the signed Artifact Package. The lockfile SHA-256 returned by Test becomes a second frozen identity before any causal RED is accepted.

Any direct dependency, version, license, Node/npm boundary, install command, network destination, Electron archive checksum, maker, or forbidden-capability change invalidates this policy and blocks the Change for a new Controller decision. Spec, Test, Worker, and Validator cannot widen it.
