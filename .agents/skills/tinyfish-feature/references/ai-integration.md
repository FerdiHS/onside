# TinyFish AI Integration — repo summary

## Core principles

When integrating TinyFish into an app:
- specify exact output schema
- include termination conditions
- handle edge cases
- request structured failures
- parse and validate both success and failure outcomes

## Repo mapping

Football Ops Copilot already expects:
- shared schemas
- normalized server responses
- mock/live consistency
- graceful fallback behavior

TinyFish integration should fit those rules instead of bypassing them.
