# PROMPTS.md – Karolinska version

Setup: upload CLAUDE.md, SPEC.md, DATA.md, DESIGN-KS.md and this file to the root of the KS repository on `main`, overwriting the first prototype's CLAUDE.md, SPEC.md and PROMPTS.md. Keep DESIGN.md, DECISIONS.md, assets/ and all code as they are. Enable Pages (Settings → Pages → Source: GitHub Actions) if not inherited. Then start one Claude Code session on the repository with the prompt below, mode Accept edits.

## All four batches in one session

Read CLAUDE.md, SPEC.md, DATA.md, DESIGN.md and DESIGN-KS.md in full before doing anything else. This repository already contains the complete first prototype; inspect the actual code on main (routes, store, mock data, components, tests) before changing anything, and reuse it. Then implement Batches 1, 2, 3 and 4 in that order, exactly as defined in SPEC.md § 9, on one new branch. Treat each batch as a unit: complete it, run the build, the type check and the tests, work through that batch's definition-of-done checklist in the running app, commit with a message naming the batch, and only then start the next. Do not ask questions; follow the decision protocol in CLAUDE.md and append every choice the spec does not make to DECISIONS.md under a heading "## KS build", keeping the existing entries. Every figure shown in the UI must carry the confidence and source defined in DATA.md; never present an illustrative value as verified. Finish by opening a pull request whose description contains all four checklists with a result per item, the dead-link sweep table, and the DECISIONS.md entries you added.

## If the session stops before all four batches are done

Reply: "Continue with the next batch as instructed."

## If the session asks a question

Reply: "Do not ask. Apply the decision protocol in CLAUDE.md, log the decision in DECISIONS.md under KS build, and finish the batch."
