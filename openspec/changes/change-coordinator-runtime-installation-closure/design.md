# Design: Change Coordinator Runtime Installation Closure

## 1. Reused Boundary

The Change keeps `createHostInstaller(osBoundary)`, `HOST_INSTALL_TARGETS`, the
root-owned `1.0` backup manifest, `atomicReplaceDirectory`, existing install and
rollback requests/receipts, service ordering, metadata checks, and current
failure vocabulary. It adds no public interface or schema.

The only affected target is:

```text
/usr/local/libexec/juanerai-change-coordinator
```

Git/dylib, State, runtime socket directory, trust, credentials, CLI, plist, and
all other targets retain their current rules.

## 2. Exact Runtime Sets

The installer uses two private immutable ordered sets:

```text
CURRENT_RUNTIME_SOURCE =
  adapters.mjs
  coordinator.mjs
  host-loop.mjs
  production.mjs
  worktree-snapshot-contract.mjs

LEGACY_RUNTIME_PREDECESSOR =
  adapters.mjs
  coordinator.mjs
  host-loop.mjs
  production.mjs
```

Ordering is only deterministic enumeration; admission compares sorted exact
names. A current source must equal the five-name set. Every member must retain
the existing size, regular-file, non-symlink, byte-read, owner/mode/ACL, and
readback checks. Missing, extra, duplicate-by-observation, linked, non-regular,
unreadable, or oversized input fails through the existing installer failure
path. The four-name set is never accepted as a new source.

## 3. Predecessor Classification and Backup

Before replacing the runtime target, the existing backup step classifies the
physical predecessor:

- `ABSENT`: the initial `lstat` of the runtime target itself returns `ENOENT`;
- `LEGACY4`: a real non-symlink directory whose sorted names equal the legacy
  set and whose four children pass existing regular-file/authority checks;
- `CURRENT5`: the same checks with the current five-name set.

Every other state is invalid: wrong type, link, missing/extra/mixed name set,
unreadable child, invalid ownership, or unsafe metadata. It fails closed rather
than deleting, completing, or overwriting the runtime to fit the new list.
After the runtime target has been observed present, `ENOENT` from a child read,
backup write/read, or any later operation is an error and can never relabel that
present predecessor as `ABSENT`.

For `LEGACY4` or `CURRENT5`, the existing `prior` directory entry records the
actual set. Each existing child record remains exactly
`{name,backup_path,sha256,mode,uid,gid,acl_sha256}` and is produced from bytes
read from that exact predecessor child. `ABSENT` retains the existing absent
manifest entry. No snapshot child or synthetic hash is added to a legacy
backup, and no manifest version or discriminator field is added; the exact
recorded name set is the discriminator.

## 4. Restore Source Identity and Byte Binding

Rollback first retains the existing manifest-file hash/canonical checks. For the
runtime directory, it then validates before replacement:

1. the `prior` entry targets the exact runtime target and is either recorded
   absent or a directory with exactly one of the two legal name sets;
2. each child name is unique and the complete sorted set equals that recorded
   legal set; count alone is insufficient;
3. each `backup_path` is exactly the path derived from the current manifest's
   backup directory, `sha256(Buffer.from(runtimeTarget))`, and that exact child
   name; absolute or same-hash content elsewhere is not an acceptable source;
4. each derived backup child is an actual regular non-symlink file satisfying
   the existing root-owned backup-file safety rules;
5. bytes are read from that derived file and their SHA-256 equals the child's
   recorded hash before they are staged; restore readback hashes actual target
   bytes and requires equality to the same recorded hash, together with the
   recorded owner/mode/ACL obligations.

These checks use the existing manifest fields and backup layout. They do not add
a signature, version registry, object store, migration format, or content-only
fallback. A substituted path is invalid even if its bytes have the same hash.

## 5. Exact Restore Outcomes

- `ABSENT` removes the installer-created runtime target through the existing
  rollback path, then performs an actual `lstat` readback of that exact runtime
  target and requires `ENOENT`; another result or an ambiguous readback cannot
  return `rolled_back:true`.
- `LEGACY4` restores only the four recorded children and leaves no
  `worktree-snapshot-contract.mjs` residue.
- `CURRENT5` restores only the five recorded children.

Each present outcome restores actual prior bytes and the recorded directory and
child metadata required by canonical Mode Activation. Runtime-set selection is
passed privately to the existing directory replacement helper; no other target
may use legacy/current alternatives.

A manifest or backup disagreement produces the existing blocked/manual-stop
failure behavior and never a `rolled_back:true` result. The Change does not
claim that every possible failure is globally effect-free: rollback retains the
existing service-unload and reverse-target ordering, and this delta adds no
transaction across targets. It only forbids replacing the runtime directory
from an unqualified manifest source and forbids false success.

## 6. Module-closure Evidence

Local Test creates a real temporary five-file source by copying the five frozen
repository bytes. After installation, an independent Node child may import the
installed `production.mjs` from the temporary target, which resolves the
installed snapshot module. It must not execute `host-loop` main, use the real
installer main, read real trust/config/credentials, start a real service, or
connect to a provider/network. This proves only local module closure and bytes.

The injected OS boundary continues to control uid/gid/ACL, service, socket, and
sudo observations. Those assertions protect the contract but are not evidence
that actual Mac mini root ownership, runtime UID, launchd, socket, or fixed Git
execution passed.

## 7. Failure and Compatibility Matrix

| Condition | Required result |
|---|---|
| exact new5 source | install proceeds through existing checks |
| old4 source offered for new install | reject before runtime replacement |
| source missing snapshot, extra, linked, or non-regular | reject through existing source/inventory error |
| prior target absent | backup absence; rollback returns to absence |
| exact prior old4 | backup actual four; rollback exact four, no snapshot |
| exact prior new5 | backup actual five; rollback exact five |
| prior unknown/mixed/damaged | fail closed; do not normalize or overwrite runtime |
| manifest same count but wrong/duplicate names | `BACKUP_MISMATCH` or existing manifest failure; no success |
| manifest backup path substituted outside derived backup source | reject even if bytes/hash match |
| backup bytes differ from recorded hash or restored readback differs | reject; no rollback success |

## 8. Activation and A4 Boundary

Local acceptance freezes source, Test, contract, command environment, logs,
exit results, and Validator verdict. It returns immediately to original M3 exact
package preparation. Integration SHA exists only after separately authorized
integration. The ordered A4 Mac mini checklist remains:

1. read the exact target identity, installed version/path, tool environment,
   service, and persisted state, then compare them with the frozen package;
2. after separate integration and operation authority, install/synchronize the
   exact integration SHA and read back its exact runtime/backup identity;
3. verify the real fixed-profile permissions, owner/mode/ACL, service, socket,
   and runtime-user execution boundary;
4. run the authorized EMPTY pointer canary without consuming product WIP or
   clearing pointer/State/Ledger/Handoff/evidence/Git history;
5. update the D1 package from the real integration SHA and read back exact
   MacBook, Mac mini, Host Loop, and fresh-WIP identities.

Actual predecessor and rollback values remain unknown until step 1. Host
availability does not itself authorize any of these effects, and S09 VM proof
is not reinstated.
