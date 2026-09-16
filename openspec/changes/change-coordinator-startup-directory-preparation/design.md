# Design: Change Coordinator Startup Directory Preparation

## 1. Reused Boundary and Sequence

The design changes only `serveTrustedHostLoop`, the existing real listener
entry. Its startup sequence becomes:

```text
validated host config and configured runtime identity
-> prepare or validate /private/var/run/juanerai
-> create the existing one Unix server
-> bind /private/var/run/juanerai/change-coordinator.sock
-> apply the existing root:runtime-group 0660 socket readback
-> serve the unchanged submit/status protocol
```

Composition construction before this call grants no action authority and does
not invoke `applyControllerCommand`, `run`, `settlement`, or `status`. Directory
preparation must finish before `net.createServer`/`listen`; therefore a failed
preflight cannot accept a request. `HOST_SOCKET_PATH`, the Host Loop public
methods, response schema, plist, and `KeepAlive` remain unchanged.

The existing third `runtime_gid` argument remains for socket authority. A new
fourth private `startup` argument is a closed object with exactly
`runtime_uid`, `runtime_gid`, `node_executable`, and `os`.
`main()` supplies the first three values from the already validated host config
and supplies the native boundary described below; Test supplies a controlled
boundary. The two runtime GIDs must agree. This is in-process startup data, not
a new CLI, configuration, Foundation, or persistent interface.

## 2. Fixed Objects and Safety Predicates

The implementation uses one private startup-specific checker; it does not
rewrite the existing repair-result `regularRootOwned` checks.

The fixed chain is `/private`, `/private/var`, `/private/var/run`, then
`/private/var/run/juanerai`. Every observation is `lstat`/no-follow and the
resolved physical path must equal the named fixed path. `/private` and
`/private/var` remain exact `root:wheel 0755`; `/private/var/run` must retain
the accepted `root:daemon 0775` identity and is never normalized to `0755`.
Every ancestor ACL must pass the non-mutating predicate below. The configured
runtime identity must be able to search, and unable to write, every ancestor.
For this fixed macOS profile, comparisons use constants root UID `0`, wheel GID
`0`, and daemon GID `1`; they are not caller/config inputs. The Host Loop itself
must report real/effective UID `0` and GID `0` before a missing-target create.

The target predicate is a non-symlink directory, physical path equal to the
fixed target, `root:wheel 0755`, with configured-runtime search allowed and
write denied. ACL observation executes exactly `/bin/ls -led <fixed-path>` with
`shell:false`, cwd `/`, environment `{LANG:C, LC_ALL:C, TZ:UTC}`, a five-second
deadline, and at most 64 KiB per output stream. Exit must be zero, stderr empty,
and stdout valid UTF-8. The existing semantic line parser admits only indexed
macOS ACL entries of `principal allow|deny permissions`; metadata text is not
hashed or treated as a permission. An ACL is unsafe if an `allow` entry grants
`write`, `append`, `delete`, `delete_child`, `add_file`, `add_subdirectory`,
`writeattr`, `writeextattr`, `writesecurity`, or `chown`. Unknown tokens,
duplicate indexes, malformed output, timeout, signal, overflow, or execution
error is unsafe. Created objects may retain only entries passing this predicate;
the Change adds no ACL because final `0755` already supplies search without
write.

The runtime access probe is one fixed invocation of the configured absolute
`node_executable`, with `--input-type=module -e <constant-script> --` followed
by only the fixed path and decimal runtime UID/GID. It uses
`shell:false`, cwd `/`, the same closed environment, a five-second deadline,
and 4 KiB limits per stream. The root child calls
`process.initgroups(runtime_uid, runtime_gid)`, then `setgid(runtime_gid)`,
then `setuid(runtime_uid)`, and verifies real/effective UID and GID. It records
the sorted unique `getgroups()` result (which Node guarantees includes the
effective GID), then uses `fs.access` for `X_OK` and `W_OK` and emits exactly one
canonical JSON line `{uid,gid,groups,search,write}` with empty stderr and exit
zero. The same validated numeric UID therefore selects supplementary groups and
becomes the final user identity; no independently supplied username or lookup
can select another account's groups. Missing POSIX APIs, credential mismatch,
malformed/extra output, timeout, signal, overflow, or child error rejects. Thus
inherited root supplementary groups never become runtime evidence. Local tests
inject the same boundary and may not claim a real UID/group/ACL result.

The closed `startup.os` shape is exactly `lstat`, `realpath`, `mkdir`, `open`,
and `exec`; the returned directory `FileHandle` supplies only `stat`, `chown`,
`chmod`, and `close`. Production binds these to Node filesystem promises,
`O_RDONLY|O_DIRECTORY|O_NOFOLLOW`, and the bounded process runner above. No
caller-supplied command, argv, path, environment, timeout, parser, UID, or GID
crosses this boundary.

## 3. Existing Target Path

If initial target `lstat` succeeds:

1. capture the target and parent device/inode/type/owner/group/mode identity;
2. open the target as a directory with no-follow and bind descriptor `fstat`
   to the captured device/inode;
3. observe ACL and configured-runtime search/write access;
4. repeat parent, pathname, descriptor, physical-path, and metadata readback;
5. accept only if all identities and the complete safety predicate agree.

No mutation function is reachable on this branch. A wrong type, link, unsafe
metadata/ACL/access result, read error, or identity drift is a startup failure;
the existing object is preserved byte-for-byte and metadata-for-metadata.

## 4. Distinctly Missing Target Path

Absence exists only when the initial `lstat` of the exact target returns
`ENOENT`. `ENOENT` from an ancestor, ACL/access probe, descriptor operation, or
later readback is failure, not permission to create again.

After absence, preparation:

1. re-reads the already validated parent and requires the same device/inode and
   safety predicate;
2. requires Host Loop real/effective UID `0`, real/effective GID `wheel`, and an
   umask that does not clear owner `0700`, then calls one non-recursive
   `mkdir(fixedTarget,{mode:0700})`; `EEXIST` rejects rather than entering the
   existing-object branch;
3. before any metadata mutation, requires the first path observation to be a
   non-link directory owned by root, mode exactly `0700`, with a non-mutating
   ACL and configured-runtime write denied; it then opens
   `O_RDONLY|O_DIRECTORY|O_NOFOLLOW` and requires descriptor `fstat` to match
   the path device/inode and the same predicate;
4. only through that bound descriptor applies `chown(root,wheel)` and
   `chmod(0755)`, with matching descriptor/path readback before and after each
   operation;
5. observes ACL, parent and target identities, physical path, owner/group/mode,
   and configured-runtime search-allowed/write-denied again;
6. closes the descriptor and performs one final pathname/parent identity
   readback before listener creation.

There is no recursive `mkdir`, ancestor mutation, replacement, or fallback.
Requesting `0700` and requiring actual root-owned `0700` plus ACL/access safety
before `chown` or `chmod` closes the ordinary mkdir-to-first-capture case inside
the approved `AC-MA-003-02` boundary: the protected configured runtime user has
proved no write permission on every ancestor and therefore cannot install or
rename a contender. The accepted `root:daemon 0775` parent does not prove other
daemon-group or privileged writers absent or trusted. This Change makes no
claim against a concurrent non-runtime daemon writer that can rename an
existing root-owned `0700` directory, or against root replacing a path. Such an
actor is outside the current protected-subject contract; observed identity
drift still rejects, but post-`mkdir` checks are not misrepresented as universal
provenance against it. Defending that broader threat would require a new
security contract and is not silently added here.

The initial restrictive creation mode makes interruption before final mode
readback fail closed. ACL state is observed, not repaired; unsafe inherited or
unknown ACL state rejects.

## 5. Race, Failure, and Diagnostic Semantics

Device/inode equality is the finite observed object binding. Type, owner,
group, mode, ACL, realpath, parent identity, and configured-runtime access are
rechecked after initial observation, after open, before and after descriptor
metadata changes, after ACL/access probes, and immediately before listener
creation. A mismatch rejects and never continues on the observed replacement.
This proves those observation points and the configured-runtime-user threat;
it does not claim to prevent a privileged replacement after the last check and
before path-based `listen`.

After `mkdir` succeeds, every failure leaves the fixed target in its observed
state. The Host Loop does not remove, rename, recursively inspect, repair, or
retry it. This deliberate retained diagnostic object is the only possible
startup-preparation side effect. Preparation throws exactly one of:

- `STARTUP_DIRECTORY_INPUT_INVALID` for closed-input/process-identity failure;
- `STARTUP_DIRECTORY_PARENT_INVALID` for ancestor predicate/probe failure;
- `STARTUP_DIRECTORY_TARGET_INVALID` for an existing target predicate/probe
  failure;
- `STARTUP_DIRECTORY_CREATE_FAILED` for non-`EEXIST` mkdir or created-object
  open/descriptor mutation failure;
- `STARTUP_DIRECTORY_RACE` for `EEXIST` after exact absence or an observed
  parent/path/descriptor identity change; or
- `STARTUP_DIRECTORY_READBACK_FAILED` for created-object ACL/access/final
  authority readback failure.

Only that code enters the existing `HOST_FAILED.error_code`; ACL text,
usernames, environment, credentials, protected content, and raw OS errors do
not.

On any preparation failure, `net.createServer` and `listen` are not called and
no Host Loop method is invoked. After preparation succeeds, this Change adds no
universal listener-close or no-method guarantee: occupied socket, second
instance, request timing, and half-close behavior retain their existing tests,
and only the existing explicit socket-authority mismatch close remains claimed.
No listener failure rolls back the directory, and no socket is unlinked.

## 6. Local Test Seam

The fourth `startup` argument supplies the closed identity and `os` shape above.
Production `main()` is the sole production caller and supplies native defaults.
Tests may inject it only through the actual listener startup call; there is no
separately accepted `mkdir` helper result.

Before production changes, the causal RED calls current
`serveTrustedHostLoop` with its existing numeric runtime GID plus an extra
controlled startup argument. Current JavaScript ignores the extra argument and
reaches the mapped real Unix-socket `listen` with its real temporary parent
absent, producing the intended missing-directory failure; no injected success
is accepted. The safe-existing current listener/status path and existing
`TEST-MA-HOST-003` remain environment controls. After implementation, that same
argument is consumed: its filesystem methods map fixed objects to real
temporary objects, while only owner/group/ACL/credential observations are
controlled. Test independently reads the temporary filesystem/socket and
snapshots protected fixtures; it does not trust boundary return values as the
oracle. `TEST-MA-HOST-003` still exercises the real half-close/status exchange
and may adapt setup but may not replace the listener.

## 7. Activation and Failure Rollback

Local acceptance freezes the seven specs, production/Test bytes, commands,
outputs, Retirement decision, and Validator verdict. It returns to original M3
exact package preparation; it does not alter R274 history or reuse R302
authority.

The later host operation package must separately bind the integration SHA,
five runtime module hashes, installed predecessor manifest, service label/PID,
fixed directory and socket observations, State/pointer/WIP/Ledger preservation,
planned interruption, and each stop/restart/readback step. A missing-directory
positive may be induced only after the service is stopped, no matching process
or socket exists, and the exact directory is already absent or is proven empty
and separately authorized for removal. It never deletes contents or a socket.
If those preconditions are unavailable, host missing-directory proof remains
`NOT_VERIFIED` and blocks acceptance.

This Spec authorizes no executable rollback route. A later, separately approved
exact package operation may bind recorded predecessor/manifest semantics and an
explicit rollback action under the original plan; it must not automatically
invoke or revive the old blocked installer. If that operation is not approved,
rollback is not run. If new or separately restored bytes cannot start safely,
the failure endpoint is service stopped plus preserved
State/pointer/WIP/Ledger/evidence and `MANUAL_CONTROLLER_STOP`; no automatic
directory repair, old-version success claim, retry, or evidence deletion is
allowed. Host evidence records exactly whether it performed stop/start or a
real reboot; one is never relabeled as the other.
