# How Everything Evolved

An open, visual-first atlas of pre-industrial history. The project aims to bring the explanatory clarity, downloadable data, and inspectable methods of [Our World in Data](https://ourworldindata.org/) to questions such as how states formed, how empires mobilized people and resources, and why historical systems endured or failed.

The public site is [visualizing-reality.rhyslindmark.chatgpt.site](https://visualizing-reality.rhyslindmark.chatgpt.site/). Rome is the first full topic page; the research and production queue lives in [`BACKLOG.md`](BACKLOG.md).

## What is here

- `app/` — the atlas homepage, reusable article/evidence components, and topic routes.
- `public/data/` — downloadable CSV, JSON, GeoJSON, TopoJSON, and public schemas.
- `scripts/validate-data.mjs` — integrity checks for source keys, datasets, claims, estimates, and historical boundary intervals.
- `research/` — durable research and evidence audits used to explain inclusion, exclusion, and modeling decisions.
- `BACKLOG.md` — the page contract, editorial rules, priorities, and completed milestones.

Every finished topic page is designed around a short introduction and exactly five visual arguments. Reconstructions, observations, and model outputs are labeled separately; published data retains source keys and methodological notes.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local URL printed by the development server. The main routes are `/` and `/rome`.

## Verify a change

```bash
npm run validate:data
npm run lint
npm run build
```

Before publication, also test the affected visualization in a browser and inspect every changed data file. A passing build is not evidence that a historical claim is sound.

## Evidence standard

- Never fabricate a number, boundary, quotation, or citation.
- Prefer primary sources, archaeological datasets, peer-reviewed work, academic references, and high-quality specialist synthesis.
- Preserve disagreements and uncertainty instead of smoothing them away.
- Do not turn annual animation into a claim of annual observation: dated geometries persist only as explicitly documented reconstructions.
- Use private notes, including Rhys's Anki collection, only to discover themes and source leads. Never publish card text or cite a card as evidence; verify every lead against a public, citable source.

The public provenance contracts are in `public/data/source-registry.csv`, `public/data/dataset-registry.json`, `public/data/claim-registry.json`, and `public/data/schemas/`.

## Contribution workflow

Work one coherent backlog milestone at a time in a dedicated Git worktree and branch. Update `BACKLOG.md` with the result and verification evidence, run all checks above, then merge and deploy the exact validated commit. Keep the repository and deployed site public unless the owner explicitly changes that policy.

## Current status

Rome has all five planned insights live:

1. An annual 500 BCE–476 CE territorial map with neighboring polities and inspectable source intervals.
2. A sourced comparison of Roman mobilization estimates, rival campaign observations, and relative worked-metal investment.
3. A source-keyed fiscal view of heterogeneous Roman levies and reconstructed central spending, including interactive c. 150 and c. 215 CE budget scenarios.
4. A selectable 395–476 CE chronology of the western court's contraction, paired with a published African fiscal-equivalent model and Valentinian III's one-eighth assessment for the two named remaining provinces.
5. A four-lane chronology of Roman afterlives—eastern state continuity, Latin-to-Romance change, Justinianic-law reception, and conditional road persistence—with an auditable Itiner-e road profile.

Uruk and the first states is now a draft page with two of five insights live. The first separates urban scale, public institutions, record-keeping, and political interpretation into four evidence clocks, with published settlement footprints kept distinct from population or a precise state-birth date. The second shows the administrative composition of the earliest proto-cuneiform archives, how lexical lists grew in the following phase, and the filtering behind a 2020 CDLI corpus snapshot. Water, grain, and state fragility remain visibly under evidence review.

Next is Uruk's water ecology, followed by the grain-state hypothesis and early-state fragility. The cradles of civilization, Bronze Age, and Iron Age pages follow.
