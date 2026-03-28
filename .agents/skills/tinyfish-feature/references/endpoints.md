# TinyFish Endpoints — repo summary

## Main endpoint modes

### `/run`
Use for simpler synchronous tasks.

### `/run-async`
Use for longer queued tasks where immediate blocking behavior is not ideal.

### `/run-sse`
Use for real-time progress in user-facing apps.

## Why `/run-sse` matters here

Football Ops Copilot may show:
- a live loading state
- short progress text describing what the agent is doing

If that UX is implemented, `/run-sse` is the preferred model because it is aligned with user-facing progress display.

## Repo guidance

- prefer predictable route contracts even if TinyFish runs in streaming mode
- if progress text is shown, keep it concise
- UI must still work if progress events are unavailable
- final page rendering should still depend on validated structured data
