# How Everything Evolved — Continuous Backlog

## North star

Build an Our World in Data–style guide to the rest of history: visual-first,
quantitatively honest, source-traceable, and opinionated enough to teach a real
model of how societies changed. Begin with the world before industrialization.

The recurring question is **domestication** in its widest sense: how humans
domesticated landscapes, water, plants, animals, metal, labor, information,
belief, violence, and one another—and how those systems remade humans in turn.

Use the explanatory ambition of ACOUP, Peter Turchin, and Saloni Dattani as a
quality bar. Do not impersonate them or turn any one framework into dogma.

## The page contract

Each subject becomes a real page, not a miscellaneous section. A finished page has:

1. A short introduction that states the historical problem.
2. Exactly five core insights, ordered as an argument rather than a fact list.
3. At least one excellent map or timeline and four other useful visualizations.
4. Downloadable data or a transparent visual model with source keys and notes.
5. A compact methodology and sources section that a skeptical historian can audit.

The visual language should feel like Our World in Data: direct claim headlines,
calm typography, generous whitespace, legible annotations, useful toggles, and
graphics that explain the claim without decorative clutter.

## Operating rules

- Work one coherent, reviewable backlog item per run, from highest priority downward.
- Use one focused Git worktree and branch per new backlog milestone; never let concurrent tasks edit the same checkout.
- Never fabricate a number, boundary, quotation, or citation.
- Label reconstructions, interpolation, and model outputs explicitly. Preserve source keys in downloadable data.
- Prefer primary sources, archaeology datasets, peer-reviewed scholarship, academic reference works, and high-quality specialist synthesis.
- Use Rhys’s private “Information Anki Jun 23 Backup” as a discovery index for themes and source leads when locally available. Never publish card text or treat a card as evidence; verify every lead against a citable source.
- Treat ACOUP, Seshat, *Against the Grain*, Cremieux Recueil, and similar works as important inputs—not sole authorities.
- Test competing explanations. State where scholars or datasets disagree.
- Do not add a core insight until the evidence and visualization can survive informed criticism.
- Preserve the site’s current public access setting. Never autonomously change access, domains, credentials, billing, or repository visibility.
- Before publishing: run lint and the production build, test the affected interaction in a browser, inspect the diff, and parse every changed data file.
- Commit and push to GitHub `Rhys-Lindmark/visualizing-reality`, push the same commit to Sites, and deploy that exact commit.
- After each run, update this file with the result, verification evidence, and next actionable item.
- Stop and report a blocker when a product decision is genuinely ambiguous, evidence conflicts materially, or the change would be destructive or expand scope.

## P0 — Mobile quality release gate

Every published page and new insight must look and work intentionally at 390 × 844 pixels before deployment. Test the full affected page—not only the new chart—for horizontal overflow, clipped labels, unreadably small controls, overlapping copy, touch targets, loading and error states, and interaction parity with desktop. Record the viewport and result in the completed-milestone note. A passing desktop build does not satisfy this gate.

## P0 — Page 01: Rome — five core insights live

1. **Where Rome was:** annual territorial map, neighboring polities, political form — live, inspectable, and target-year audited.
2. **Why Rome won:** deep mobilization plus relative worked-metal investment — live; published-estimate audit complete, with definition gaps kept visible.
3. **How Rome paid for empire:** heterogeneous levies and a military-dominated central budget — live, with source-keyed units and definitions.
4. **Why the western court fell:** fiscal capacity, civil war, territorial loss, army cost, and external pressure without a monocausal story — live, with a selective chronology, a primary-law anchor, and a clearly labeled fiscal-equivalent model.
5. **What Rome changed:** state, language, law, and roads persisted through different carriers and on different clocks — live, with source-keyed milestones and an uncertainty-forward road profile.

Reliability repair: the Rome map and military chart now load from an immutable, revisioned client-data snapshot. This prevents a long-open tab from combining an older JavaScript schema with newly deployed CSV or map files; invalid responses still fail closed instead of rendering `undefined` or `NaN`.

Immediate project work:

- Build Bronze Age insight 02: compare how palace archives, stores, workshops, and redistribution made distant materials governable without treating every palace as one centrally planned economy.

## P0 — Page 02: Uruk and the first states — ready

Working thesis: the first states emerged not from a single invention but from a
bundle of domestications that made people, food, water, and information legible.

1. **There is no single birthday for the city-state:** four evidence clocks for urban scale, public institutions, record-keeping, and political inference, plus published settlement footprints — live; no population conversion or annual interpolation.
2. **Water made concentration possible:** map the shifting rivers, wetlands, irrigation, and settlement ecology of southern Mesopotamia — live; the map is explicitly mixed-age, Eridu counts are non-simultaneous, and later direct/textual evidence is not projected backward.
3. **Grain made people taxable:** competing-evidence matrix for cereals, roots and tubers, herds, fish and wetlands, and fruit orchards — live; the 2022 global model, its 2026 published challenge, direct Late Uruk records, regional ecology, and later archive-bias comparison remain distinct, with no causal score.
4. **Writing began as administration:** phase-level archive composition and a filtered CDLI corpus snapshot — live; preserves bounded percentages and survival/publication bias.
5. **Early states were fragile population machines:** evidence ladder for concentration, provisioning, walls, conflict, mass deposition, deliberate dispersal, peripheral autonomy, and regional reversal — live; no shared score, slavery estimate, disease curve, execution label, or abandonment death count.

Source seeds to test and extend:

- James C. Scott, [*Against the Grain*](https://yalebooks.yale.edu/book/9780300240214/against-the-grain/).
- Cremieux Recueil, [“From Caveman to Chinaman”](https://www.cremieux.xyz/p/from-caveman-to-chinaman), especially water control and state formation.
- Patrick Wyman, [“Uruk and the Emergence of Civilization”](https://patrickwyman.substack.com/p/uruk-and-the-emergence-of-civilization).
- Add excavation reports, settlement datasets, paleochannel research, and critical reviews before publishing claims.

## P1 — Page 03: The cradles of civilization — ready

Treat “five cradles” as a question to investigate, not a settled canonical list.
Include Mesopotamia, Egypt, the Indus, northern China, Mesoamerica, and the Andes
when the evidence supports independent urban/state formation.

1. Map when and where urban scale, political centralization, and durable notation became visible — live; six selectable regional chronologies, eighteen source-keyed rows, and one explicit undated Andean notation gap with no rank, score, annual interpolation, or year zero.
2. Compare river regimes, rainfall, crops, transport, and settlement form — live; thirty source-keyed qualitative cells retain local chronologies and limits, with no hydraulic, climate-causation, crop-share, traffic-volume, or settlement-density score.
3. Compare the timing of cities, states, writing, bronze, and monumental building — live; thirty source-keyed phase clocks preserve six distinct ordinal signatures, one explicit undated notation gap, and regional bronze thresholds without an annual series, invention date, universal package, or civilizational score.
4. Show multiple routes to surplus and coordination rather than one hydraulic formula — live; twenty-four source-keyed input → institution → outcome routes compare archives, provisioning, workshops, shared standards, exchange, public goods, distributed water works, complementarity, and communal building without a surplus, coercion, prevalence, or state-capacity score.
5. Explain why some early urban systems endured, transformed, dispersed, or left unreadable records — live; six source-keyed pathways separate deliberate dispersal, political relocation, deurbanization, capital destruction, regional fragmentation, and a hypothesized reorganization without a collapse, resilience, continuity, or population-loss score.

## P1 — Page 04: The Bronze Age world system — ready

1. Copper and tin turned geography into a long-distance production network — live; four evidence views preserve one cargo, copper provenance, an Atlantic tin signal, a textual relationship, and competing tin-source hypotheses without inventing annual flows or direct routes.
2. Palace economies concentrated storage, craft, writing, and redistribution.
3. Chariots were an elite military system with demanding horse and maintenance inputs.
4. Trade connected the eastern Mediterranean more tightly than political borders suggest.
5. The Late Bronze Age collapse was a systems failure with multiple interacting causes.

## P1 — Page 05: The Iron Age transformation — ready

1. Iron was not instantly better or cheaper; adoption depended on ore, fuel, skill, and institutions.
2. Larger infantry armies changed the scale and social base of war.
3. Coins, alphabets, and administrative technologies lowered some coordination costs.
4. Neo-Assyria and Persia built new kinds of territorial empire.
5. Mediterranean and Eurasian networks recovered and expanded after Bronze Age fragmentation.

## P1 — Page 06: Persia and territorial empire — ready

1. Roads and relays compressed imperial distance.
2. Satrapies combined local rule with imperial extraction.
3. Tribute was a political system, not simply a tax rate.
4. Imperial armies were coalitions of distinct peoples and military systems.
5. Persian institutions outlasted dynasties and shaped successor empires.

## P1 — Page 07: Qin and Han China — ready

1. Warring-state competition rewarded administrative and military scale.
2. Standardization made territory more legible to the state.
3. Grain, canals, roads, walls, and conscription linked ecology to empire.
4. The Han state balanced direct rule, local elites, and frontier strategy.
5. Collapse and reunification became a recurrent political pattern, not a civilizational reset.

## P1 — Page 08: India from cities to empires — ready

1. The Indus urban system was extensive, standardized, and still partly unreadable.
2. Monsoon ecology produced different political and agricultural rhythms.
3. Cities, coinage, and states returned in the first millennium BCE.
4. Mauryan power combined core administration with uneven frontier control.
5. Religions and trade networks often traveled farther than states.

## P2 — Page 09: Steppe, horse, and mobile power — ready

1. Pastoral mobility was an adaptation, not failed agriculture.
2. Horses expanded transport, herding, communication, and raiding ranges.
3. Composite bows and remount systems produced unusual operational reach.
4. Steppe confederations and agrarian states co-produced one another.
5. Migration and exchange reshaped languages, genes, military systems, and trade.

## P2 — Page 10: Christianity as an infrastructure — ready

1. A small movement spread through Roman cities and networks.
2. Texts, letters, bishops, ritual, and charity formed durable institutions.
3. Imperial adoption transformed both church and state.
4. Christianity fragmented geographically and doctrinally while remaining connected.
5. Monasteries, law, calendars, education, and sacred geography outlasted western imperial rule.

## P2 — Page 11: The caliphates — ready

1. Early Islamic expansion changed political scale with remarkable speed.
2. Existing Roman and Sasanian fiscal-administrative systems were adapted rather than erased.
3. Arabic, coinage, law, and paper supported a connected imperial sphere.
4. Cities and trade linked the Atlantic, Mediterranean, Indian Ocean, and Central Asia.
5. Political fragmentation did not end the wider intellectual and commercial system.

## P2 — Later pre-industrial pages — ready after the core sequence

- Greek city-states and the problem of collective action.
- Hellenistic kingdoms and the military-fiscal state.
- Silk Roads: many routes, many intermediaries, no single road.
- Medieval Europe: fragmentation, lordship, church, towns, and state rebuilding.
- African states and trade systems: Nile, Sahel, Horn, Great Lakes, and southern Africa.
- Southeast Asian mandalas and maritime trade.
- Mesoamerican cities, states, and ecological engineering.
- Andean vertical economies and imperial logistics.
- Mongol Eurasia: conquest, relay networks, trade, and epidemiological exchange.
- Gunpowder empires and the rising cost of fortification and war.
- Oceanic navigation and the integration of the pre-industrial world.
- The great divergence before industry: wages, energy, institutions, empire, and ecology.

## Blocked

- None.

## Completed

- 2026-08-30 — Opened Page 04 with Bronze Age insight 01, **The Bronze Age was a supply chain before it was an age**. Added four evidence views and nineteen source-keyed places joined by sixteen inspectable connections: the roughly 10-tonne copper and 1-tonne tin Uluburun cargo, a 78-ingot Cypriot copper comparison across six find regions, a three-method Atlantic tin signal, and one Mari textual relationship. Competing Uluburun tin-source publications remain visible; automated guards reject annual flow, traffic, market-share, direct-route, and shared-score fields and preserve the direct-Britain-to-Levant, Mušiston, and textual-evidence limits. Added six specialist sources, one public dataset, one registered claim, a durable audit, immutable client snapshots, and a new P0 mobile-quality release gate. Verified all four views, the Mušiston readout, desktop and 390 × 844 interaction parity, 0 horizontal overflow, 0 exact `undefined`/`NaN` values, data validation, lint, and the production build in the isolated `codex/bronze-age-metal-network` worktree.
- 2026-08-30 — Repaired the reported production 404 on Uruk's grain-state evidence and hardened all five First States visualizations against the same deployment mismatch. Every Uruk chart now loads from one immutable revisioned client-data snapshot, rejects HTML and empty fallbacks, and retries one transient request before showing an error. Added byte-for-byte snapshot checks for all five CSVs and a production smoke test that requires HTTP 200, CSV content, and the expected row count for every live Uruk dataset. Verified data validation, lint, production build, all five deployed assets, all five live visualizations, and a clean production browser console.
- 2026-08-30 — Completed Cradles insight 05, **There was no single kind of collapse**, with six source-keyed pathways through deliberate dispersal at Shakhi Kora, political relocation to Thebes and Karnak, Indus deurbanization and regional shift, Taosi's loss of capital status after destruction, uneven fragmentation around Monte Albán, and a hypothesized reorganization of the Supe system. Added four specialist sources, one public dataset, one registered claim, a durable evidence audit, and an immutable client snapshot. Automated guards reject shared collapse, resilience, continuity, and population-loss fields and preserve geographic scope, climate-monocause, conqueror, dynasty, successor, and migration limits. Verified all six selectors and afterlife readouts, zero horizontal overflow at 1280 and 390 × 844, no corrupt rendered values or loading errors, a clean browser console, data validation, lint, and the production build in the isolated `codex/cradles-afterlives` worktree.
- 2026-08-30 — Completed Cradles insight 04, **There was no single route from grain to state power**, with six institutional portfolios and twenty-four source-keyed input → coordinator → visible-outcome routes. The comparison distinguishes Mesopotamian archives and institutional kitchens, Egyptian industrial food and craft production, Indus standards and civic public goods, Taosi storage and craft districts, Erlitou workshops and planned access, Oaxaca households and marketplaces, Aguada Fénix communal building, and Caral's irrigation, coast–valley complementarity, maize, and monuments. Every route exposes its evidence class and limit; automated guards reject prevalence and capacity scores and block bowl-to-slavery, brewery-to-workforce, public-goods-to-kings, storage-to-tax-record, monument-to-coercion, and complementarity-to-central-redistribution inferences. Added one public dataset, one registered claim, a durable evidence audit, and an immutable client snapshot. Verified all six regional selectors and all twenty-four route readouts, the Indus civic-public-goods selection, zero horizontal overflow at desktop and 390 × 844, no corrupt rendered values, a clean browser console, data validation, lint, and the production build in the isolated `codex/cradles-coordination` worktree.
- 2026-08-30 — Completed Cradles insight 03, **Civilization did not arrive as a package**, with a six-region by five-milestone comparison of urban scale, political centralization, durable notation, monumental building, and bronze. Reused all eighteen audited clocks byte for byte and added twelve source-keyed monument and bronze rows, eight specialist sources, one registered dataset, one registered claim, a durable evidence audit, an immutable client snapshot, and automated guards for all thirty unique cells, the Andean notation gap, Egyptian rare-bronze status, late West Mexican bronze, Middle Horizon Andean scaling, Indus public construction without invented rulers, and Aguada Fénix's 1000–800 BCE phase. The visual shows a selected region on a 4000 BCE–1550 CE axis and six ordinal signatures where ties share a number and missing evidence stays “?”. Verified all six regional selectors, all thirty sequence cells, the Andean undated gap, the immutable CSV response, zero horizontal overflow at desktop and 390 pixels, no corrupt rendered values, data validation, lint, and the production build in the isolated `codex/cradles-sequences` worktree.
- 2026-08-30 — Completed Cradles insight 02, **There was no single environmental recipe**, with a six-region by five-dimension qualitative comparison of water, rainfall, crops, transport, and settlement form. Added thirty source-keyed cells, eight specialist sources, one registered dataset, one registered claim, a durable evidence audit, an immutable client-data snapshot, and automated guards against hydraulic scores, climate monocausality, crop-share invention, traffic-volume invention, and a shared settlement-density number. The visual reads both down one regional fingerprint and across one dimension while keeping every chronology, evidence class, and limit visible. Verified all six region selectors, five fingerprint cards, six cross-region rows, the Indus winter/summer rainfall selection and climate limit, the immutable CSV response, zero horizontal overflow at desktop and 390 pixels, no corrupt rendered values, a clean browser console, data validation, lint, and the production build in the isolated `codex/cradles-ecologies` worktree.
- 2026-08-30 — Prevented the reported Rome map and force-chart failures from recurring across deployments by moving all seven client-fetched Rome assets to an immutable revisioned snapshot. Added byte-for-byte snapshot regression checks and documented the rule that an older client-data revision must never be overwritten or removed. Verified both canvases and default readouts locally and on the public Sites deployment, with no loading overlays, `undefined`, `NaN`, console warnings, or horizontal overflow.
- 2026-08-30 — Completed Uruk insight 05, **Concentration created power—and exit points**, with an eight-case archaeological evidence ladder rather than a fabricated state-strength or collapse series. Added northern settlement concentration, debated bevel-rim-bowl provisioning, Hamoukar's approximately three-metre wall and c. 3500 BCE destruction with more than 1,000 small sling bullets, Tell Brak's 33–45-person minimum in one mass deposit, four institutional phases followed by deliberate dispersal at Shakhi Kora, a socially distinct enclave within local Hacinebi, and LC4 concentration followed by regional reversal in the Adhaim–Sirwan basin. Added five sources, one public dataset, one registered claim, a durable evidence audit, and automated guards against inferring slavery from bowls, an identified attacker from Hamoukar, state execution from Tell Brak, civilizational collapse from dispersal, death from ceramic absence, or an Uruk disease series without local evidence. Verified all eight selections and readouts, five live Uruk insights, zero horizontal overflow at 1280 and 390 pixels, no corrupt rendered values, a clean browser console, data validation, lint, and the production build in the isolated `codex/uruk-state-fragility` worktree.
- 2026-08-30 — Completed Uruk insight 03, **Cereals fit appropriation; archives are not diets**, with a qualitative competing-evidence matrix rather than a fabricated legibility score. Added five resource systems—cereal grain, roots and tubers, herd animals, fish and wetlands, and fruit orchards—and a separate five-step claim test that keeps Mayshar, Moav, and Pascali's 2022 global model, Cook et al.'s July 2026 published statistical challenge, direct Late Uruk records, Pournelle and Algaze's deltaic synthesis, and an explicitly later Ur III archive-bias comparison in different evidence classes. Added ten source-keyed rows, five scholarly sources, one registered dataset, one registered claim, a durable evidence audit, and automated guards for row classes, all ten required observations, the 2026 critique, roots as counterfactual rather than invented Uruk evidence, the archive-versus-diet limit, and the later date of the livestock comparison. Verified all five resource selections and readouts, all five claim-test rows, four live Uruk insights, zero horizontal overflow at 1440 and 390 pixels, no corrupt rendered values, a clean browser console, data validation, lint, and the production build in the isolated `codex/uruk-grain-state` worktree.
- 2026-08-30 — Completed Uruk insight 02, **Water made concentration possible**, with a deliberately non-synchronous visual: Jotheri et al.'s CC BY 4.0 alluvial palaeochannel overview and Eridu canal case study, Altaweel et al.'s 7750–4900 cal BCE M38 freshwater and ecological sequence, Uruk's bounded urban interval, Egberts et al.'s later Girsu canal stratigraphy, and Lagash's first surviving developed irrigation terminology. Added eleven source-keyed rows, three scholarly sources, one registered dataset, one registered claim, two licensed map assets, a durable evidence audit, and automated guards for the M38 interval, the undated map layer, the non-simultaneous Eridu lower bounds (&gt;200 primary canals, &gt;4000 branches, &gt;700 farms), and the later Girsu and textual intervals. The visual explicitly blocks a fabricated 3300 BCE channel map, a simultaneous Eridu network, a local rainfall series, and a monocausal hydraulic-state story. Verified both map modes, the three Eridu lower bounds, the Girsu timeline selection and source key, six evidence lanes, three live Uruk insights, zero horizontal overflow at 1440 and 390 pixels, no corrupt rendered values, a clean browser console, data validation, lint, and the production build in the isolated `codex/uruk-water-ecology` worktree.
- 2026-08-30 — Completed Uruk insight 01, **There is no single birthday for the city-state**, by separating urban scale, public institutions, record-keeping, and political inference into four evidence clocks. Added ten source-keyed observations: Uruk at approximately 250 hectares around 3100 BCE and 400 hectares in the early third millennium; Tell Brak at approximately 55 and 130 hectares; Tell al-Hawa at approximately 50 hectares; Shakhi Kora's 3941–3377 cal BCE institutional sequence; cylinder seals; proto-cuneiform; Uruk's monumental urban core; and Selz's explicitly bounded c. 3800–3300 BCE state-formation interpretation. Added four scholarly sources, one registered dataset, one registered claim, a durable evidence audit, and automated guards against population conversion, annual interpolation, missing anchors, and a fabricated first-king date. Verified 10 data rows, 70 sources, 12 datasets, 7 claims, interaction selection, four lanes, five footprint bars, desktop and 390-pixel layouts, zero horizontal overflow, no corrupt rendered values, a clean browser console, data validation, lint, and the production build in the isolated `codex/uruk-city-chronology` worktree.
- 2026-08-30 — Hardened the Rome production hotfix after a stale browser session paired an older client bundle with newer map and force-estimate files. Advanced the explicit Rome data-contract revision, rejected stringified missing values and incompatible polity features before rendering, and added a build-blocking client-contract test covering seven Roman estimates, eleven rival observations, and all 442 polity geometries. Reproduced the reported 417 BCE frame in a fresh production-mode browser and verified Roman Republic, six represented polities, the default 212 BCE / 250k force readout, no `undefined` or `NaN`, no error state, and a clean browser console.
- 2026-08-30 — Opened Page 02, **Uruk and the first states**, with a five-part evidence audit and the first live visual argument: the earliest surviving proto-cuneiform writing was overwhelmingly administrative, while a broader lexical and teaching system grew alongside it. Added a `/uruk` route, one source-keyed public dataset, four scholarly sources, one registered claim, and an interactive archive-composition visual that preserves Englund's “less than 1%” Uruk IV and “close to 20%” Uruk III language. Added a separate corpus-filter view reproducing Born and Kelley's dated CDLI snapshot (6,726 artifacts, 6,267 transliterated, 5,274 with a readable sign, and 52,943 readable non-numerical Uruk III–IV tokens) without treating unlike units as one series. The page explicitly blocks a taxation-only origin story, a precise state birthday, and Scott's grain-state thesis as settled fact. Verified all seven data rows and four corpus anchors, route metadata, runtime data loading and layout in headless Chrome, public downloads, the evidence ledger, data validation, lint, and the production build in the isolated `codex/uruk-first-states` worktree.
- 2026-08-29 — Completed Rome insight 05, **What Rome changed**, by replacing a miscellaneous legacy list with one mechanism-first claim: Roman afterlives ran on different clocks and required different carriers. Added a selectable four-lane chronology for eastern state continuity, late-Latin-to-Romance evidence, Justinianic-law codification and western revival, and conditional road persistence; a road profile from the 2024 static Itiner-e dataset (299,171.31 mapped km, 65.42% secondary, 2.737% classed certain); seven scholarly sources; one public dataset; one registered claim; a durable evidence audit; and automated source, milestone, row-count, road-length, and certainty checks. The visual explicitly blocks a legacy score, a clean birthday for Romance, uninterrupted western legal continuity, universal road causality, and the claim that Rome ended in 476. Verified all fifteen timeline markers, the 1070 Digest and 312 BCE Via Appia selections, four summary metrics, five claims, ten datasets, 62 sources, no corrupt rendered values, data validation, lint, and the production build in the isolated `codex/rome-lasting-transformations` worktree.
- 2026-08-29 — Repaired the Rome page's two data-loading failure states reported from production. The territorial map and military-force chart now cache-bust their data requests, reject HTTP errors, HTML fallbacks, incomplete map bundles, and malformed numeric observations, retry one transient failure automatically, and offer an explicit manual retry after a persistent failure. The map shows a purposeful boundary-atlas loading layer instead of an unexplained blue field; the force chart does not mount its readout, canvas, legend, or source prose until a valid focus observation exists, preventing `undefined`, `NaN`, and empty-series output. Verified 442 boundary features, seven Roman estimates, eleven comparison observations, no corrupt placeholder strings at first render or after load, two loaded canvases, the expected 117 CE polity records, the default 212 BCE Roman 250k readout, lint, data validation, and the production build in the isolated `codex/rome-data-loading-hotfix` worktree.
- 2026-08-29 — Built Rome insight 04, **Why the western court fell**, around a non-monocausal fiscal-territorial claim: the western court lost taxable territory while civil wars and external threats kept demanding armies, and the loss of its richest African provinces made recovery far harder. Added a selectable 395–476 chronology with twelve political, military, fiscal, and recovery markers; Peter Heather's published African revenue-loss equivalents using Hugh Elton's maintenance costs; Valentinian III's 445 one-eighth assessment as a separately bounded primary-law anchor; four cited sources; two public datasets; a registered claim; a durable evidence audit; and automated chronology, source-key, lower-bound, maintenance-cost, and anti-headcount checks. The visual explicitly blocks a causal score, continuous revenue series, fictional total western revenue loss, and the claim that 476 ended the Roman state. Verified the 445 marker, infantry/cavalry toggle, more-than relation, downloads, four claims, nine linked datasets, accessible button semantics, a clean browser console, data validation, lint, and production build in the isolated `codex/rome-western-fall` worktree.
- 2026-08-29 — Built Rome insight 03, **How Rome paid for empire**, around a defensible opinionated claim: Roman revenue systems were heterogeneous, while roughly three quarters of reconstructed central expenditure went to the military. Added interactive low/high budget scenarios for c. 150 and c. 215 CE; ten separately defined observations covering a Sicilian grain tithe, Gallic customs, inheritance and auction taxes, the military treasury endowment, subsidized grain, and legionary pay; thirteen primary, scholarly, and ACOUP sources; two public datasets; a registered claim; a durable evidence audit; and automated scenario-sum, army-share, source-key, and pay-cutoff checks. The visual explicitly blocks a fictional empire-wide tax rate, a continuous revenue series, and real-value comparisons of nominal sestertii. Verified both budget toggles, all fiscal labels and downloads, three claims, seven linked datasets, a clean browser console, data validation, lint, and production build in the isolated `codex/rome-finance-data` worktree.
- 2026-08-29 — Replaced the apparent continuous Roman force reconstruction with seven source-backed anchors and four short, definition-consistent segments. Removed project-authored filler, visible uncertainty ranges, and every combined post-395 East–West value; the chart now separates reported Republican mobilization, Principate and late-imperial paper establishments, and a single eastern Notitia estimate. The disputed dating of that eastern total (traditional c.395 versus a recent c.440s argument) is explicit, and no western fifth-century total is plotted because the audit found no definition-compatible published estimate. Added four scholarly/primary sources, a durable research note, cache-versioned public data downloads, and validation assertions for the new structure. Verified the source trail, point selection, wording, clean browser console, validator, lint, and production build in the isolated `codex/rome-force-estimates` worktree.
- 2026-08-29 — Made the Roman territorial map inspectable without pretending annual playback means annual observation. Hovering the canvas or selecting a keyboard-accessible polity record now exposes the frame year, exact sourced interval, approximate area, Seshat record identity, background records, and downloadable boundary data; selection persists only while that dated geometry remains active. Added automated assertions for continuous Roman coverage from 500 BCE to 476 CE and for eastern/western state presence at 395, 410, 439, and 476. Repaired the event strip so its scrollbar no longer intercepts event-marker clicks, and added a repository README covering the project, evidence rules, local workflow, and current status. Verified pointer-equivalent selection, interval persistence across annual stepping, all four late-imperial transitions, data validation, lint, and the production build in the isolated `codex/rome-map-inspectability` worktree.
- 2026-08-29 — Audited every visible quantitative claim and data row in Rome’s two live insights. Removed the unsupported “largest empire Europe had ever known” superlative, 53 invented rival/interpolation rows, every unsourced kilogram-per-soldier value, and every derived iron-tonnage claim. The revised military visual directly labels Rome as a heterogeneous central-estimate series, shows rivals only as dated campaign observations, preserves disputed ancient reports as disputed rather than silently adjusting them, and confines Devereaux’s equipment argument to a sourced third–second-century BCE relative index (Rome 125, nearest comparator 100). Added a durable audit explaining each inclusion and removal. Validation now checks 23 Roman estimate rows, 11 rival campaign observations, 2 equipment-index rows, 36 source keys, 5 datasets, 2 claims, and 442 boundary features. Verified the readout interaction, five changed downloads, metadata, lint, and the production build in the isolated `codex/rome-evidence-audit` worktree.
- 2026-08-29 — Built the shared evidence and visual-data standard. Added canonical source, dataset, and claim registries; public JSON Schemas for observations, modeled series, boundaries, citations, and notes; and an automated validator for malformed CSV/JSON, missing files and source keys, invalid estimate ranges, unsupported claim statuses, and malformed boundary intervals. Rome now exposes an on-page evidence ledger distinguishing source observations, historical reconstructions, and model outputs, with claim-to-dataset-to-source provenance, source filtering, and direct downloads. The subsequent military audit supersedes the initial modeled-row contents while preserving and tightening this evidence system.
- 2026-08-29 — Built the reusable atlas and page-routing system. The new homepage states the project thesis, filters eleven queued pages by era/region/system, and labels research/draft/reviewed status. Rome moved to `/rome` through a reusable Introduction → Key Insights → Methods/Sources shell, retaining both interactive modules and naming insights 03–05. Verified both production routes, the Mediterranean filter, atlas-to-Rome navigation, annual map stepping, military metric toggle, metadata, lint, and the production build.
- 2026-08-29 — Annual 500 BCE–476 CE Roman map with sourced persistent geometry, neighboring polities, event jumps, and corrected late-imperial states. Verified with lint, production build, browser stepping, and 293/395/410/439/476 data checks.
- 2026-08-29 — Built the initial Rome-versus-rivals chart. Its unsupported 50-year rival interpolations and absolute iron-mass model were subsequently removed by the live-evidence audit above.
- 2026-08-29 — Project renamed from Visualizing Reality to How Everything Evolved.
