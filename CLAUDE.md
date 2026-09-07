# Medoma Resilience – Karolinska version (KS)

This repository was created from the `Medoma-Resilience` template and already contains the complete first prototype (four merged batches: shell, Command Center, Incident, Evacuation, Resources, Network, tests, deploy workflow). Read `CLAUDE.md`, `SPEC.md`, `DATA.md`, `DESIGN.md` and `DESIGN-KS.md` completely, then inspect the actual code before writing anything. `DECISIONS.md` contains 31 entries from the first build; keep them and append new entries under a heading `## KS build`.

Precedence when documents disagree: `SPEC.md` (this version) > `DATA.md` > `DESIGN-KS.md` > `DESIGN.md` > existing code. Where `SPEC.md` is silent, the existing behaviour from the first prototype stands.

## What this version is

A clickable, front-end-only prototype of the same product, configured for **Karolinska Universitetssjukhuset** (Solna and Huddinge) inside **Region Stockholm**'s care network, for a pitch to the hospital's production director. Everything the audience sees must be either a verified public figure with its source, an explicitly marked estimate, or an explicitly marked illustrative scenario value. The honesty of that labelling is a feature of the product, not a disclaimer.

## Hard constraints (in addition to the first prototype's)

- **Data lives in a data pack, never in components.** `src/data/packs/karolinska.ts` is the only dataset in this repo; the first prototype's `mock.ts` is removed. Every numeric figure in the pack carries `source` (a key into the source list in DATA.md § 9), `asOf` (date string) and `confidence: 'verified' | 'reported' | 'estimate' | 'illustrative'`. The UI renders the confidence everywhere the figure is shown.
- **UI language is Swedish.** All user-visible strings come from `src/data/vocab.ts`; keys, enum values, types, file names, commit messages and code comments stay English. Swedish typography rules are in `DESIGN-KS.md`.
- **No Karolinska logo, no real staff names.** The customer name appears as text only (scope selector, headings). All people in the app are fictional (DATA.md § 7). Public officials' names from the research must not appear in the app.
- **No invented facts.** If a figure is needed and DATA.md does not provide it, use `confidence: 'illustrative'` with a short `basis` string, and log the choice in DECISIONS.md. Never present an illustrative value as verified.
- No backend, auth, persistence, external APIs beyond map tiles. Minimum viewport 1280 px. No emoji, no ALL CAPS, no gradients.

## Decision protocol – never ask

Identical to the first build: when the spec is silent, choose the simplest option consistent with `SPEC.md`, implement it, and record it in `DECISIONS.md` (date, decision, rejected alternative, spec section). Never block, never leave a TODO in place of a decision.

## No guessing

- Use only labels, names, numbers and vocabularies defined in `SPEC.md`, `DATA.md` and `vocab.ts`.
- Inspect the existing store, routes, components and tests before changing them. Reuse existing components (capacity card, chips, grouped list, three-pane layout, message thread, log drawer) rather than creating parallel ones.
- A batch is done when the build, type check and tests pass and every item of its definition of done has been checked in the running app.

## Batches

Four batches, delivered in one session on one branch, one commit per batch (see `PROMPTS.md`). Each batch ends with its definition-of-done checklist; the pull request description contains all four checklists with a result per item and the DECISIONS.md entries.

## Repository layout (delta from the first prototype)

```
src/data/packs/karolinska.ts   the KS data pack (nodes, capacities, flow, staff, playbooks, scenarios, sources)
src/data/packs/types.ts        DataPack interface (the shape a pack must have)
src/data/vocab.ts              Swedish labels for every enum and UI string
src/lib/forecast.ts            inflow forecast (pure)
src/lib/scenario.ts            scenario engine (pure, tick-based)
src/lib/placement.ts           bed-request placement rules (pure)
src/modules/start/             presenter start page and story chapters
src/modules/flow/              "Läget nu"
src/modules/capacity/          renamed from command-center
src/modules/sources/           "Källor" page
```

## Conventions

As before: TypeScript strict, named exports, one component per file, vitest for `src/lib/`, conventional commits, accessibility floor, every state change logged to the audit log with the scenario clock's time.
