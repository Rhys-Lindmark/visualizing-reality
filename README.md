# How Everything Evolved

An open, visual-first atlas of pre-industrial history. The project aims to bring the explanatory clarity, downloadable data, and inspectable methods of [Our World in Data](https://ourworldindata.org/) to questions such as how states formed, how empires mobilized people and resources, and why historical systems endured or failed.

The public site is [visualizing-reality.rhyslindmark.chatgpt.site](https://visualizing-reality.rhyslindmark.chatgpt.site/). Rome is the first full topic page; the research and production queue lives in [`BACKLOG.md`](BACKLOG.md).

## What is here

- `app/` — the atlas homepage, reusable article/evidence components, and topic routes.
- `public/data/` — downloadable CSV, JSON, GeoJSON, TopoJSON, and public schemas.
- `public/data/rome/<revision>/` — immutable Rome client snapshots; keep old revisions so already-open tabs cannot receive a newer, incompatible schema.
- `public/data/uruk/<revision>/` — immutable Uruk client snapshots used by every interactive First States chart.
- `public/data/cradles/<revision>/` — immutable Cradles client snapshots used by interactive comparisons.
- `public/data/bronze-age/<revision>/` — immutable Bronze Age client snapshots used by its interactive evidence comparisons.
- `scripts/validate-data.mjs` — integrity checks for source keys, datasets, claims, estimates, and historical boundary intervals.
- `research/` — durable research and evidence audits used to explain inclusion, exclusion, and modeling decisions.
- `BACKLOG.md` — the page contract, editorial rules, priorities, and completed milestones.

Every finished topic page is designed around a short introduction and exactly five visual arguments. Five clickable insight cards reveal one argument at a time in an editorial-text-left, visualization-right layout; compact methods and sources remain available below the main reading flow. Reconstructions, observations, and model outputs are labeled separately; published data retains source keys and methodological notes.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local URL printed by the development server. The main routes are `/`, `/rome`, `/uruk`, `/cradles`, `/bronze-age`, and `/iron-age`.

## Verify a change

```bash
npm run validate:data
npm run lint
npm run build
npm run verify:build-assets
npm run smoke:production-data
```

Before publication, also test the affected visualization in a browser and inspect every changed data file. A passing build is not evidence that a historical claim is sound.

Package the Sites archive from the same validated worktree where the production build and `verify:build-assets` passed. Packaging a different checkout can pair the right source commit with stale build output. The production smoke test checks the release manifest, all live visualization assets at both origins, and every published route.

When a client-side data schema changes, create a new immutable data revision and update its data-client helper. Do not overwrite or delete an earlier revision: a browser tab can remain open across a deployment and must continue receiving the data contract its JavaScript expects. Every client data request first uses the Sites asset and then falls back to the same versioned path in the public GitHub repository; both origins must preserve old revisions. Always build the exact checkout being packaged, then run `npm run verify:build-assets`; it byte-compares every file under `public/` with its copy in `dist/client/` and blocks a stale or incomplete Sites archive. `npm run smoke:production-data` then checks every live visualization asset at both origins.

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

Uruk and the first states now has all five insights live. The first separates urban scale, public institutions, record-keeping, and political interpretation into four evidence clocks, with published settlement footprints kept distinct from population or a precise state-birth date. The second combines a CC BY palaeochannel map, an early local borehole sequence, later canal dating, and textual evidence to explain a moving freshwater–marsh ecology without fabricating one fourth-millennium river layer or a hydraulic-state monocause. The third tests cereal appropriability against a 2026 published statistical challenge, direct Late Uruk records, deltaic ecology, herds, fish, fruit, and archive bias without assigning a causal score. The fourth shows the administrative composition of the earliest proto-cuneiform archives, how lexical lists grew in the following phase, and the filtering behind a 2020 CDLI corpus snapshot. The fifth compares eight cases of concentration, provisioning, walls, conflict, deliberate dispersal, peripheral autonomy, and regional reversal while explicitly blocking slavery, disease, execution, and death-count inferences the evidence cannot sustain.

The cradles of civilization now has all five insights live. The first uses a selectable world map to compare urban scale, political centralization, and durable notation across Mesopotamia, Egypt, the Indus, northern China, Mesoamerica, and the Andes. Eighteen source-keyed observations preserve phase ranges and evidence status; the Indus political form remains contested, San Andrés notation remains probable and contested, earlier Chinese signs remain distinct from secure Shang writing, and the Andes notation lane is an undated evidence gap rather than year zero. The second compares water, rainfall, crops, transport, and settlement form through thirty qualitative regional cells. Every cell exposes its evidence class and limit; unlike ecologies are not converted into one hydraulic or settlement-density score. The third reuses the audited city, state, and notation clocks and adds monumental building and bronze. Thirty source-keyed phase rows show six ordinal signatures on a 4000 BCE–1550 CE axis; ties stay tied, missing notation stays undated, and rare objects, sustained alloy use, analytical samples, and regional scaling are never collapsed into one Bronze Age threshold. The fourth follows twenty-four input → institution → outcome routes through archives, kitchens, workshops, standards, exchange, public goods, distributed water works, coast–valley complementarity, and communal monuments. Four routes per region are an inspectable editorial portfolio, not a prevalence count, and no surplus or state-capacity score is computed. The fifth compares six different historical afterlives—deliberate dispersal, political relocation, deurbanization, capital destruction, regional fragmentation, and a hypothesized reorganization—while keeping site occupation, population, political order, records, and institutions on separate clocks.

The Bronze Age world system now has all five insights live. Its four-view metal map separates one observed Uluburun cargo, the analytical reach of Cypriot copper, an Atlantic tin provenance signal, and a Mari textual relationship. Nineteen nodes and sixteen connections expose their source keys and inference limits; no line claims a direct voyage, annual flow, market share, or complete route. Competing Uluburun tin-source interpretations remain visible rather than being smoothed into one answer. The second insight compares five selective palace circuits at Mari, Hattusha, Knossos, Pylos, and Ugarit. It follows inputs through records, stores, and allocations while keeping every outside-palace limit visible; unlike archive counts, flock tallies, metal allotments, and archaeological episodes are never combined into a centralization score. The third compares five chariot evidence windows through six dependencies: vehicle, horse team, control gear, people, upkeep, and institution. It preserves paired horses without a vehicle, Kikkuli's reconstructed at-least-184-day schedule, Pylian wheel condition, EA 15's one-chariot-plus-two-horses gift, and Anyang's mortuary and repair evidence without producing a force-size or effectiveness score. The fourth compares three wrecks and two harbor settlements to show multiple maritime carriers and institutions; nineteen material and typological associations remain bounded evidence links rather than reconstructed voyages or trade flows. The fifth places six unlike Late Bronze Age evidence windows on one chronology while keeping environment, conflict, institutional change, and persistence separate; it produces no shared collapse year, causal score, or homogeneous Sea Peoples army.

The Iron Age transformation has all five insights live and is reviewed. Five regional comparisons separate earliest or limited evidence from wider adoption and make the production chain inspectable. Eleven published modern smelting runs compare ore, charcoal, and reported bloom outcomes to show why fuel was necessary but not sufficient. Four paired bloom and forged-bar samples then separate hardness, chemistry, microstructure, and forgeability. A mobilization ledger compares a pre-iron Egyptian field army, a qualitative pre-Roman European levy transition, and Taylor's like-for-like Carthaginian and Roman models without converting metal into soldiers. The final comparison follows inputs, makers, coordinators, distribution, and surviving evidence through a Neo-Assyrian arsenal, a Fennoscandian household network, La Tène distribution nodes, a Han monopoly with a frontier gap, and Meroe's long-lived production landscape. None becomes an ancient output estimate, forest-loss model, artifact-derived army, kilograms-per-soldier calculation, centralization score, military-power score, or universal development sequence.

Persia and territorial empire now has all five insights live. The first preserves Herodotus's six-part Sardis–Susa itinerary as 111 stages and 450 parasangs, separates his ninety-day traveler arithmetic from a relay mechanism with no surviving end-to-end duration, and uses the regional Persepolis Fortification archive to expose the provisioning and authorization system beneath the riders. The second compares five satrapal governance portfolios; the third preserves twenty reported tribute districts while comparing seven unlike obligation windows; and the fourth follows six military windows from contributors through command, battlefield role, support, and coordination. The fifth extends the page beyond dynastic defeat through eighteen episodes in five pathways: provincial office, army integration, chancellery scripts, local Persian rule, and royal titles. Retention, reallocation, experiment, descent, recombination, revival, and redesign remain different claims. No visual creates a speed, control, tax, combat-power, or institutional-continuity score.

Qin and Han China has three of five insights live. The opening comparison separates five mobilizing capacities that developed across generations from six final political endpoints between 230 and 221 BCE. Household registration, ranked service, county reporting, and assigned transfers are linked as an administrative system without treating them as one reformer's instantaneous invention. The second insight compares certified measures, official script, tablet dimensions, text density, and grain-tally fields against excavated local practice. The third compares eight productive, storage, transport, maintenance, and labor-extraction windows as one logistics ecology while keeping their dates, evidence classes, and limits separate. The page excludes army totals, casualty counts, annual boundaries, empire-wide compliance, annual grain flow, megaproject workforce totals, and state-capacity scores.

Next is Qin and Han insight 04: compare changing portfolios of commanderies, kingdoms, local elites, and frontier arrangements without turning formal jurisdiction into uniform control.
