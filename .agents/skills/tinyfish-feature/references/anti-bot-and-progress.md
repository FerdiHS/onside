# TinyFish anti-bot and progress notes — repo summary

## Progress text during loading

This repository may show short loading updates such as:
- current step
- latest agent action
- short recent-step history

If supported, this should be driven by live progress events from TinyFish.

## Rules for progress UI

- keep progress text concise
- do not dump noisy internal detail
- preserve normal loading fallback if progress events are absent
- completion and failure should terminate the progress display cleanly

## Anti-bot / blocked cases

Expect that some live pages may:
- block automation
- require login
- partially fail
- return incomplete data

The app should:
- preserve structured failure behavior
- return partial data when safe
- avoid crashing pages because one upstream source is blocked
