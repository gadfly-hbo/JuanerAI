# JuanerAI Change Coordinator

The released Foundation Core remains `coordinator.mjs`. Mode Activation adds
only the production composition, fixed-socket transport, Controller signer,
trusted host loop, restricted adapters, and reversible installer described in
`docs/governance/product-change-execution-policy.md`.

## Controller signing on MacBook

Create the key and fixed signer configuration only at the administrator-approved
Gate. The canonical configuration is user-owned mode `0600` at:

```text
/Users/huangbo/Library/Application Support/JuanerAI/controller/signer.json
{"key_id":"<approved-id>","private_key_path":"/Users/huangbo/Library/Application Support/JuanerAI/controller/<approved-key-file>","schema_version":"1.0"}
```

The private key file is also user-owned mode `0600`. Sign one canonical
command body without a trailing LF:

```sh
/opt/homebrew/bin/node tools/harness/change-coordinator/controller-cli.mjs sign < command-body.json > signed-envelope.json
```

The output contains the transport envelope and only key/body/signature
fingerprints and hashes. It never contains private key bytes.

## Submit and status

The installed client uses only the fixed root-owned Unix socket:

```sh
/usr/local/bin/juanerai-coordinator submit < signed-envelope.json
/usr/local/bin/juanerai-coordinator status
ssh myhost /usr/local/bin/juanerai-coordinator submit < signed-envelope.json
ssh myhost /usr/local/bin/juanerai-coordinator status
```

`submit` accepts exactly one canonical LF-framed
`{command_body_base64,signature_base64}` object of at most 1 MiB. `status`
accepts no body. Neither command accepts a path, trust source, dependency, state
root, socket override, or arbitrary operation.

## Production prerequisites

The administrator-approved host configuration is canonical JSON, root-owned
`0600`, at `/private/etc/juanerai/host-loop.json`. It binds the exact
repository/state roots, runtime identity, Git `2.54.0` executable, Node and
Codex executables, and GitHub repository. Trust and the two purpose-isolated
credentials use only their fixed paths in `production.mjs`.

`install-host-loop` receives a canonical install or rollback plan, records an
exact backup manifest, stages and reads back every target, and controls only
`com.juanerai.change-coordinator`. Repository tests never run the real
installer. Real installation, credentials, provider calls, and host canaries
remain locked until the administrator and Controller Gates release them.
