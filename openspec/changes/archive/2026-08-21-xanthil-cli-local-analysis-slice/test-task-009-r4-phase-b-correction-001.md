# TASK-009 R4 Phase B Test Correction 001

Controller accepts one Test-owned coverage correction for the explicit
R4-REQ-002 rejection of repeated think tags.

The added case supplies a repeated/nested leading prefix:

```text
<think>outer<think>nested</think>{...valid Proposal...}
```

and requires sanitized `PROTOCOL_FAILURE`. Against the Phase B candidate, the
R4 focused group is `13` tests, `12` PASS, and exactly this new leaf RED because
the parser accepts it. The prior twelve leaves remain GREEN; unit remains
`250/250` PASS.

Frozen contract-test SHA-256:

`8184a626cf5e4be30e233ec41de395c572c7e07c46ad7b6ba6f1c4d4227fd236`

Production remains frozen at Adapter
`d901695162e18a45a0a6d9bc238c79e984cd0421eef262c139247c6765c2af34`.
The Worker correction may modify only the Adapter parser to reject repeated or
nested think tags; it may not change any other Phase B behavior or proceed to
the separate stream/lifecycle Phase C RED.

