# PROMPTS.md – what to paste into Claude Code, one per batch

Setup once: create an empty GitHub repository, put CLAUDE.md, SPEC.md, DESIGN.md, DECISIONS.md and the assets/ folder at its root on `main`, connect it to Claude Code, and in the repository settings set Pages → Source to "GitHub Actions". Then run the prompts below in order, merging each pull request before starting the next.

## Batch 1

Read CLAUDE.md, SPEC.md and DESIGN.md in full before doing anything else. Then implement Batch 1 exactly as defined in SPEC.md § 9, on a new branch. Do not ask questions; follow the decision protocol in CLAUDE.md and log every choice the spec does not make in DECISIONS.md. Finish by running the build, the type check and the tests, working through the Batch 1 definition-of-done checklist item by item in the running app, and opening a pull request whose description contains the checklist with a result per item and the DECISIONS.md entries you added.

## Batch 2

Read CLAUDE.md, SPEC.md, DESIGN.md and DECISIONS.md in full. Batch 1 has been merged: inspect the actual code on main (routes, store, mock data, components) before changing anything, and do not assume what it contains. Then implement Batch 2 exactly as defined in SPEC.md § 9, on a new branch, without asking questions. Finish by running the build, the type check and the tests, working through the Batch 2 definition-of-done checklist in the running app, and opening a pull request whose description contains the checklist with a result per item and the DECISIONS.md entries you added.

## Batch 3

Read CLAUDE.md, SPEC.md, DESIGN.md and DECISIONS.md in full. Batches 1 and 2 have been merged: inspect the actual code on main before changing anything. Then implement Batch 3 exactly as defined in SPEC.md § 9, on a new branch, without asking questions. Finish by running the build, the type check and the tests, working through the Batch 3 definition-of-done checklist in the running app, and opening a pull request whose description contains the checklist with a result per item and the DECISIONS.md entries you added.

## Batch 4

Read CLAUDE.md, SPEC.md, DESIGN.md and DECISIONS.md in full. Batches 1–3 have been merged: inspect the actual code on main before changing anything. Then implement Batch 4 exactly as defined in SPEC.md § 9, on a new branch, without asking questions. This batch ends with the polish pass and the dead-link sweep of every route; record the sweep in the pull request. Finish by running the build, the type check and the tests, working through the Batch 4 definition-of-done checklist in the running app, and opening a pull request whose description contains the checklist with a result per item and the DECISIONS.md entries you added.

## If a batch comes back with questions or unfinished items

Reply with exactly: "Do not ask. Apply the decision protocol in CLAUDE.md, log the decision in DECISIONS.md, and finish the batch." The spec is written so that this is always possible.
