# TinyFish Goal Prompting — repo summary

## Core idea

TinyFish performs better when the goal is:
- specific
- constrained
- explicit about outputs
- explicit about stop conditions

Think of the agent like a smart but literal browser operator.

## Good prompt traits for this repository

Use goals that:
- request strict JSON
- define exact fields
- define when to stop
- define missing-field behavior
- define failure output shape

## Avoid
- vague research goals
- broad “summarize this page” instructions
- prompting that encourages speculation
- prompts without schema or termination conditions
