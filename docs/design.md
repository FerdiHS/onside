# Design

## Purpose

This document defines the **design direction** for Onside.

It exists to help humans and coding agents build a consistent UI that matches the product positioning.

This is not a pixel-perfect design system. It is a practical guide for:
- visual direction
- information hierarchy
- component tone
- page-level structure
- guardrails on what the product should and should not look like

---

## Product Design Goal

Onside should feel like a **serious football intelligence dashboard**.

The product is not meant to look like:
- a football fan blog
- a betting app
- a fantasy sports product
- a generic admin template
- a neon cyberpunk experiment

It should feel closer to:
- a club ops room
- a scouting intelligence tool
- a pre-match briefing system
- a monitoring dashboard for football staff

---

## Core Design Principles

### 1. Serious and credible
The UI should make the product feel trustworthy and focused.

Use:
- clear structure
- deliberate spacing
- readable sections
- strong titles
- restrained visual accents

Avoid:
- gimmicks
- loud gradients
- excessive motion
- visual clutter

---

### 2. Source-backed and information-first
The product is about **structured intelligence**, not decoration.

The interface should make it easy to understand:
- what the key information is
- where it came from
- what matters most right now

Important information should be visually prioritized over chrome.

---

### 3. Dark, calm, premium
Default to a dark theme.

The product should feel:
- modern
- premium
- calm
- high-signal

This fits both:
- the football ops / intelligence angle
- the live web / infrastructure vibe of the hackathon context

---

### 4. Generic product, club-specific demo
The app architecture is generic even though the demo uses specific clubs.

The UI may show:
- Chelsea
- Manchester United

But the overall product branding should remain neutral.

Do not visually brand the whole app around one club.

---

## Visual Theme

## Theme name
**Football Ops War Room**

### Mood
- analytical
- club-facing
- premium
- restrained
- live intelligence

### Keywords
- football intelligence
- monitoring
- scouting
- pre-match briefing
- signal over noise

---

## Color System

## Base colors

### Background
- `#07111F` — page background
- `#0D1B2A` — main surface
- `#13263A` — elevated card surface
- `#24384F` — borders / dividers

These colors should create a deep navy / slate foundation.

---

## Text colors

- `#F3F7FB` — primary text
- `#A8B6C7` — secondary text
- `#71839A` — muted text

Text should remain highly readable against dark surfaces.

Do not overuse low-contrast muted text for important content.

---

## Accent colors

### Primary accent
- `#3BA4FF` — electric blue

Use for:
- primary actions
- active tabs
- selected states
- key navigation highlights
- important metric emphasis

### Secondary accent
- `#D7FF4A` — lime highlight

Use sparingly for:
- live or active indicators
- noteworthy insight chips
- subtle emphasis points
- signal-style highlights

Do not flood the UI with lime.

---

## Semantic status colors

### Rising
- `#34D399`

### Stable
- `#60A5FA`

### Concern
- `#F59E0B`

### Critical / blocked
- `#F87171`

These status colors are especially important for:
- Player Watch
- Loan Monitor
- partial-data or upstream-failure notices

---

## Club colors

Club colors should be used **sparingly**.

They may appear in:
- club pills
- badge accents
- subtle borders
- small tags

They should **not** define the whole product palette.

The app must remain a neutral platform, not a Chelsea-themed or Manchester-United-themed website.

---

## Typography

Use a clean modern sans-serif.

Recommended choices:
- **Inter**
- **Geist**

### Typography goals
- bold, readable headings
- clean medium-weight body text
- strong section titles
- compact but readable metadata text

Avoid:
- decorative sports fonts
- overly condensed display fonts
- tiny low-contrast labels

---

## Layout Principles

### Spacing
Prefer generous spacing and clear grouping.

The UI should feel breathable, not cramped.

### Hierarchy
Every screen should have:
1. clear page purpose
2. obvious primary content
3. secondary context below
4. source visibility near the bottom or near relevant sections

### Cards
Cards should be:
- softly elevated
- consistent in border radius
- visually grouped
- easy to scan

Use cards for:
- player summaries
- match sections
- status views
- source groups
- club summary blocks

---

## Component Tone

## Buttons
Primary buttons should use the blue accent.
Secondary buttons should be more neutral.

Do not create too many button styles.

Recommended hierarchy:
- primary
- secondary
- ghost / subtle

---

## Badges
Badges are important for:
- status
- competition
- mode
- partial data
- live extraction

Badges should be concise and high contrast.

---

## Source cards / source chips
Sources are part of the product story.

They should be clearly visible but not overpowering.

A good source display may include:
- source title
- domain
- maybe a tiny icon or domain chip

Make sources easy to scan and obviously separate from generated summaries.

---

## Loading states
Loading states should feel polished and intentional.

Use:
- skeleton cards
- shimmer or subtle placeholder blocks
- short status copy if needed

Avoid:
- giant spinners dominating the screen
- noisy loading animations

---

## Error states
Error states should feel calm and recoverable.

They should:
- explain the failure simply
- preserve page layout where possible
- offer a fallback or retry where appropriate

Avoid:
- scary red full-screen failure panels
- vague technical error dumps

---

## Partial-data states
Partial data is expected in a live-web product.

Partial states should:
- still render what is available
- clearly communicate that some information is incomplete
- not make the product feel broken

This is especially important for live TinyFish-backed flows.

---

## Page-by-Page Guidance

## 1. Homepage

### Purpose
The homepage should immediately communicate:
- what the product is
- who it is for
- the two main entry points
- the demo scope

### Recommended structure
1. Header / nav
2. Hero section
3. Primary product entry cards
4. Upcoming matches section
5. Demo clubs section
6. Short “how it works” explanation

### Hero content
The hero should feel concise and professional.

Suggested tone:
- one-sentence product explanation
- one-sentence club-facing value proposition

Avoid:
- long marketing paragraphs
- generic AI buzzwords
- too many buttons

### Primary entry cards
Surface:
- Match Prep
- Player Watch
- Club Package / Loan Monitor

Make these look like product workflows, not blog categories.

---

## 2. Match Prep page

### Purpose
This page should feel like a **structured pre-match briefing**.

### Recommended layout
#### Top section
- match title
- competition
- kickoff
- optional metadata chips
- refresh or generate action

#### Main content
Two-column layout on desktop:
- left: lineups, absences
- right: recent context, key talking points

#### Bottom section
- sources
- mode / completeness metadata if relevant

### Required sections
- probable lineups
- injuries / absences
- recent context
- 3 key talking points
- sources

### Tone
This page should feel:
- useful
- concise
- serious
- readable in under a minute

Avoid:
- over-explaining
- giant prose paragraphs
- excessive football jargon

---

## 3. Player Watch page

### Purpose
This page should feel like a **player intelligence file**.

### Recommended structure
#### Top section
- player name
- club context
- status badge
- short summary

#### Main content
- recent updates
- availability notes
- recent mentions
- sources

#### Selection area
Keep selection controls simple:
- club selector
- player selector

No heavy search experience is needed for the MVP.

### Tone
This page should feel like:
- player monitoring
- concise football intelligence
- a reusable scouting/ops view

---

## 4. Club Package / Loan Monitor page

### Purpose
This is the premium club-facing showcase page.

### Product role
This page should make the product feel:
- club-oriented
- commercially serious
- more than just a fan-facing dashboard

### Recommended structure
#### Top section
- selected club
- short club package summary
- maybe 2 to 4 small summary metrics

Examples:
- tracked players
- rising
- stable
- concern

#### Main section
Grid or compact list of tracked players with:
- player name
- current club
- status
- short summary
- latest update
- sources

### Tone
This page should feel like the strongest screen in the product.

It should communicate:
- premium feature
- monitoring workflow
- clear club value

---

## Navigation Guidance

Keep navigation simple.

Recommended top-level items:
- Home
- Match Prep
- Player Watch
- Club Package

Do not create too many nav items.

This is a hackathon MVP, not a full SaaS platform.

---

## Motion and Interaction

Use motion sparingly.

Good uses:
- subtle hover state
- smooth card transitions
- lightweight skeleton animation

Avoid:
- large entrance animations
- dramatic parallax
- excessive microinteractions
- anything that makes the product feel toy-like

---

## Mobile and Responsiveness

The app should be mobile-safe, but desktop is the main target for demo.

### Priorities
- readable mobile layout
- stacked sections on small screens
- no broken overflow
- no tiny unreadable cards

Do not over-optimize for every mobile edge case at the expense of core desktop polish.

---

## What to Avoid

Do not make the UI look like:
- a sportsbook
- a fantasy football optimizer
- a club fan page
- a colorful social media dashboard
- a default admin template with football data stuffed into it

Avoid:
- big pitch graphics
- giant club crests dominating the page
- overly saturated reds/blues across the whole app
- too many visual styles mixed together

---

## Component Reuse Guidance

Encourage reusable components for:
- section cards
- source lists
- status badges
- club pills
- page headers
- summary metric cards
- empty / loading / error states

This improves both consistency and speed.

---

## Design QA Checklist

Before considering a page visually done, ask:

- Does this feel like a serious football intelligence product?
- Is the hierarchy obvious within 3 seconds?
- Can the page be scanned quickly?
- Are sources visible enough?
- Do statuses stand out clearly?
- Does the page still look good with partial data?
- Does it avoid looking like a betting app?
- Does it avoid hardcoding one club into the visual identity?

If any answer is no, refine the page.

---

## Final Design Rule

If you must choose between:
- more visual flair
- or clearer, calmer, more credible information design

always choose:
**clearer, calmer, more credible information design**
