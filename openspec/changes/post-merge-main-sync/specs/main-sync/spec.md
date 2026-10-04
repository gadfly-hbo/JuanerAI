# Main mirror synchronization

This user-approved developer-tooling change does not modify product behavior.

- R1 / AC1: One `tools/harness/git/sync-main` invocation pins the advertised
  `origin` main commit and fast-forwards local and configured peer main mirrors
  to that same commit. Read `sync.targets` only from repository-local config;
  require at least one valid `host:/absolute/repository` target before writes.
- R2 / AC2: Preserve active branch, index, tracked and untracked files. An
  unoccupied main may advance while another branch is dirty. Ref updates use
  Git's non-force fetch, including its checked-out-branch protections.
- R3 / AC3: Default to skipping checked-out main. Repeated
  `--allow-main-worktree local|<exact-target>` explicitly attests ownership and
  inactivity only for the named root. Update that root only if it has main
  checked out, is clean, and has no Git operation. Always refuse main checked
  out in another worktree. Never switch branches.
  If main already equals the verified pinned commit, return unchanged success
  without any fetch/worktree update, including when checked-out main is dirty.
- R4 / AC4: Refuse divergence, wrong repository root or origin, malformed config,
  missing main, unavailable peer and changed remote tip. Report each target,
  current branch and main before/after; preserve successful sides and return
  nonzero for any skipped/failed target. An up-to-date repeat succeeds.
- R5 / AC5: `--check` contacts the configured origin and peers but writes no
  refs, index or worktree files. When the pinned commit is absent locally,
  report ancestry as unverified until the write-time fetch.
- R6 / AC6: SSH is noninteractive, checks existing host trust and has bounded
  connection/keepalive waits, with TTY allocation disabled. These are inactivity
  limits, not a total-duration deadline for healthy remote Git commands.
  Snapshot the reviewed script before any update and stream those exact bytes
  to every peer, even if advancing caller main replaces or removes the file.
  Never install tools, edit credentials/trust, push, force-update, stash,
  reset, clean, auto-commit, control services or adopt a running session.
