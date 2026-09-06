# Medoma Resilient Operations – clickable prototype

Read this file, `SPEC.md` and `DESIGN.md` completely before writing any code. Together with the files in `assets/` they are the entire brief. Nothing else is authoritative, and nobody will answer questions.

## What this is

A clickable, front-end-only prototype showing how the existing Medoma platform grows from Hospital-at-Home orchestration into an operational layer for resilient, distributed hospital care: a hospital command center, incident mode with executable playbooks, evacuation planning, structured resource requests and a network of care nodes (hospital, care hub, field hospital, home care).

Audience: hospital executives, regional preparedness leads and investors clicking through it in a browser, guided by a presenter. It must read as the same product as the screenshots DESIGN.md was derived from – the same chrome, the same components – with new modules added beside the existing ones.

## Hard constraints

- No backend, database, authentication, API keys, environment secrets, analytics or external APIs. The only runtime network dependency is map tiles.
- All data comes from `src/data/mock.ts`. All state lives in memory. Reloading the page resets it; "Reset demo data" resets it without reloading.
- All UI strings are English, sentence case. Data values (people, places, hospitals, teams) are Swedish exactly as given in SPEC.md.
- Follow DESIGN.md exactly. Where it and your taste disagree, DESIGN.md wins.
- Minimum supported viewport width is 1280 px. No mobile layout.
- No emoji, no ALL-CAPS labels, no gradients, no page-load animations, no dark mode.

## Decision protocol – never ask

You will not receive answers to questions. When the spec is silent, ambiguous or contradictory:

1. Choose the simplest option that is consistent with SPEC.md and DESIGN.md.
2. Implement it.
3. Record it in `DECISIONS.md` (format is in that file): date, decision, the alternative you rejected, the spec section it relates to.

Never block, never leave a placeholder or TODO in place of a decision, never add infrastructure (a backend, persistence, a config system) to avoid deciding.

## No guessing

- Use only the labels, names, numbers, statuses and vocabularies defined in SPEC.md. If you need one that is not defined, add it to DECISIONS.md first, then use it.
- Do not add dependencies beyond SPEC.md § Stack without a DECISIONS.md entry saying why.
- When continuing work in an existing repository, inspect the actual code (routes, store, mock data, components) before changing anything. Do not assume what an earlier batch did; read it.
- A batch is not done until the build and type check pass and every item in that batch's definition of done in SPEC.md has been checked by actually clicking through the running app (use the dev server and a browser if available; otherwise verify by reading the rendered route tree and component props, and say which method you used).

## Batches

Work is delivered in the four batches defined in SPEC.md § Batches, one pull request per batch, in order. Implement only the current batch. Do not restructure earlier batches beyond what the current batch strictly requires.

Every PR description contains: what was built; the batch's definition-of-done checklist with a result per item; the DECISIONS.md entries added in this batch.

## Repository layout

```
assets/            logo-full.svg (lockup), logo-symbol.svg (nav symbol) – source files, do not edit
public/            copied logo files, favicon (use logo-symbol.svg)
src/app/           shell: layout, nav, scope selector, incident banner, demo controls, routes
src/data/          types.ts, vocab.ts (all enums + labels + colour keys), mock.ts (dataset), store.ts (zustand)
src/lib/           pure functions: capacity.ts (min-of-components, bottlenecks), suggest.ts (evacuation suggestion), parse.ts (message → request)
src/components/    shared UI built on shadcn/ui and DESIGN.md tokens
src/modules/       command-center/, incident/, evacuation/, resources/, network/, existing/ (stubs)
DECISIONS.md       append-only decision log
```

## Conventions

- TypeScript strict. Named exports. One component per file unless trivial. Keep components under roughly 200 lines; split by responsibility.
- Every enum/status/label string lives in `src/data/vocab.ts` and is referenced from there. No duplicated label strings in components.
- Pure logic (capacity maths, suggestion rules, message parsing) lives in `src/lib/` with unit tests (vitest).
- Conventional commit messages: `feat:`, `fix:`, `chore:`, `docs:`.
- Accessibility floor: real `<button>` elements for actions, visible focus ring, labels on all inputs, dialogs closable with Escape, keyboard-reachable tables and lists.
- Every user action that changes state appends an audit entry via the store (see SPEC.md § Audit log) and advances the demo clock by one minute.
