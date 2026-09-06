# Medoma Resilient Operations – clickable prototype

A front-end-only, clickable prototype showing how the Medoma platform grows from Hospital-at-Home orchestration into an operational layer for resilient, distributed hospital care: a hospital command center, incident mode with executable playbooks, evacuation planning, structured resource requests and a network of care nodes. Everything is mock data held in memory; nothing is persisted and there is no backend. The brief is in `CLAUDE.md`, `SPEC.md` and `DESIGN.md`; choices the brief did not make are logged in `DECISIONS.md`.

## Run

```
npm install
npm run dev
```

Open the URL Vite prints (by default http://localhost:5173). The app uses hash routes, so any page can be refreshed. The only network dependency is the OpenStreetMap tiles on the maps.

## Check

```
npm run typecheck   # tsc --noEmit
npm test            # vitest: src/lib, the mock dataset and the store rules
npm run build       # production build to dist/
```

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and deploys `dist/` to GitHub Pages with the `actions/deploy-pages` flow. Once Pages is enabled for the repository (Settings → Pages → Source: GitHub Actions) the site is served at `https://<owner>.github.io/<repository-name>/`. The Vite `base` is read from `GITHUB_REPOSITORY` at build time and falls back to `/` locally.

## Demo story for the presenter

1. Open the Command Center for Vikby sjukhus at 14:40: 16 acute beds, 3 intensive care beds, 2 surgeries possible because post-operative beds limit the theatres, one CT down, two ambulances. Click a card or a bottleneck row to see what limits what, and try the what-if on post-operative beds.
2. In Incident, activate "Mass casualty – Level 2": six roles, fifteen tasks, four channels and four targets appear, the banner turns on and the Command Center shows the objectives strip. Mark "Set up triage zones" done and watch the triage target reach 40 / 40.
3. In Evacuation, press "Suggest plan": the system proposes 32 moves and cannot place 8. Accept a suggestion (the log records that Eva Lind authorised it), then walk a patient through Plan, Accept, Assign transport, Departed, Arrived and Handed over while the transport pool and the "Acute beds freed" target follow.
4. In Resources, open "From message", create a request from Mats Öberg's message (2 ventilators to Ekhaga vårdhubb prefilled), then take req-1 through Accept, Allocate from Vikby sjukhus, Dispatch and Mark received; the Inventory shows the ventilators moving between the nodes.
5. In Network, stand up a new node at a preset site, open it, set it Operational and see it become a valid evacuation destination with its planned beds free. For the short story, switch on "Simulate EHR outage" in the Demo popover (or activate the IT outage playbook) and show the Command Center working on the operational mirror with estimated figures and their age.
