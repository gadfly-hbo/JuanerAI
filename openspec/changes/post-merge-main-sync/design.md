# Design

The caller validates and reads the saved script into memory before writes. This
snapshot preserves exact trailing newlines and remains the peer input even if
the caller's main update replaces or removes the saved file. A failed read stops
before any update. It also validates local peer configuration before writes,
then pins the single `refs/heads/main` advertised by origin. Each target
must be a worktree root with local main and the same exact effective origin URL;
URL aliases are conservatively treated as different identities.

Each target independently verifies origin still advertises the pinned commit.
An unchanged main returns immediately. Otherwise worktree occupancy, explicit
idle-root permission and operation/cleanliness checks determine eligibility.
`--check` uses only reads, including `ls-remote`; if the pinned object is absent,
it explicitly leaves ancestry unverified until fetch.

For writes, fetch only main into `refs/remotes/origin/main` and recheck the pin.
Check local main ancestry. For unoccupied main, non-force fetch from the local
object store into `refs/heads/main` delegates locking, ancestry and checked-out
branch refusal to Git. For explicitly permitted idle main in the target root,
repeat branch/operation/cleanliness checks and merge the fixed SHA with
`--ff-only`. Active-session inactivity is caller-attested, not inferred from
process listings. A concurrent writer violates that explicit idle permission.

Fetch may add objects and update origin/main even when a subsequent main check
fails. It never force-updates local main or rolls successful peers backward.
An advancing remote may leave only one side updated; aggregate status is failure
and a new explicit run pins the new target. No cross-device transaction is claimed.

The same script runs locally in a subshell and remotely over quoted SSH stdin.
SSH disables TTY, interactive authentication and new trust, with connection and
keepalive inactivity bounds. Existing SSH host aliases supply routing. These
bounds do not impose a total-duration deadline on a responsive remote command.
Hooks, filesystem monitors, automatic Git maintenance and optional index writes
are disabled for command-local Git calls. Git authentication uses existing
configuration; the command creates no credentials or trust state.
