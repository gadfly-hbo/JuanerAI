# Pi CLI 0.84.2 JSONL Schema Note for TASK-009 R4

## Status

**NON-NORMATIVE EXPLORATION EVIDENCE.** The explored CLI cannot bridge the
embedded native callbacks and is not an R4 production path, Port contract,
activation route, or test target. This note creates no product capability.

## Locked Source

- Package: `@earendil-works/pi-coding-agent@0.84.2`.
- Package manifest SHA-256: `820f4adc6d61f2cefbc29ce17e9dfd9aa482248d54be5d0dfa2a868ca000c7b0`.
- [`dist/modes/json-event.d.ts`](../../../node_modules/@earendil-works/pi-coding-agent/dist/modes/json-event.d.ts)
  SHA-256: `5c5db0017929319388a89d7da6cffdc7eb0432ce00f34ffebe8938df00837610`.
- [`dist/modes/print-mode.js`](../../../node_modules/@earendil-works/pi-coding-agent/dist/modes/print-mode.js)
  SHA-256: `f2eb170b9620c1d37e68b788ff71257a4402a23e7f3999575feee8e5d9e13b3f`.

## Closed R4 Selection Rule

In `--mode json`, print mode serializes each `AgentSessionEvent` as exactly one
`JSON.stringify(toJsonEvent(event))` line. `json-event.d.ts` states that
`message_end` provides the final authoritative message.

R4 selects only the **last** line whose closed relevant shape is:

```text
{ type: "message_end", message: { role: "assistant", stopReason: "stop", content: [...] } }
```

`content` is accepted only as an ordered list of text blocks; their text values
are concatenated in list order and passed to the closed think/JSON
normalization rule. `turn_end` may verify that the turn reached an end state,
and `agent_end {messages,willRetry}` / `agent_settled {type}` may verify final
sequence/no retry; none is a second result source. Any absent, malformed,
duplicate-ambiguous, non-assistant, non-`stop`, or post-settlement authoritative
message fails closed. The adapter never exposes the rejected JSONL line.

This note intentionally excludes all other AgentSessionEvent and AssistantMessage
fields, because they are not Product Port values.
