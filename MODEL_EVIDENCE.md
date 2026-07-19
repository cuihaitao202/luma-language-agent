# GPT-5.6 runtime evidence

Sanitized live verification performed on 2026-07-19 against the configured production-compatible API gateway.

| Signal | Observed value |
| --- | --- |
| Requested model | `gpt-5.6-terra` |
| HTTP status | `200` |
| Response body `model` | `gpt-5.6-terra` |
| Public harness model header | `gpt-5.6-terra` |
| Internal routed model header | `AKL-gpt-5.6-terra` |
| Cache status | `MISS` |
| Region | `GLOBAL` |
| Verification response | `READY` |
| Provider request ID | `730b053d-f033-45bc-927a-f304909c3583` |

Luma requests `gpt-5.6-terra`. The public response identifies that model exactly. The provider's internal route remains available separately in `X-ModelAPI-Routed-Model`; it is not presented to learners as the public model identity.

The gateway supports `/v1/chat/completions` with JSON Object mode but does not currently expose `/v1/responses` or strictly enforce JSON Schema. Luma therefore prefers the Responses API and automatically falls back to Chat Completions with JSON Object mode. Live coaching responses expose a non-sensitive `_meta` object containing the requested model, provider-reported model, and API surface so judges can inspect the running integration.
