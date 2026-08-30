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

## P0 — Page 01: Rome — in progress (2/5)

1. **Where Rome was:** annual territorial map, neighboring polities, political form — live, inspectable, and target-year audited.
2. **Why Rome won:** deep mobilization plus relative worked-metal investment — live; published-estimate audit complete, with definition gaps kept visible.
3. **How Rome paid for empire:** taxation, tribute, customs, land tax, military pay, and grain flows — ready.
4. **Why the western court fell:** fiscal capacity, civil war, territorial loss, army cost, and external pressure without a monocausal story — ready.
5. **What Rome changed:** labor and land, roads, language, law, cities, and the survival of the eastern state — ready; split only if the argument becomes incoherent.

Immediate Rome work:

- Build insight 03, **How Rome paid for empire**, only after its tax, revenue, pay, grain, and customs observations have source-keyed units and definitions.

## P0 — Page 02: Uruk and the first states — ready

Working thesis: the first states emerged not from a single invention but from a
bundle of domestications that made people, food, water, and information legible.

1. **Cities came before fully developed states:** timeline from sedentism and villages to Uruk-scale urbanism.
2. **Water made concentration possible:** map the shifting rivers, wetlands, irrigation, and settlement ecology of southern Mesopotamia.
3. **Grain made people taxable:** compare grains with tubers, pastoralism, and wetland subsistence on visibility, storability, divisibility, and transport.
4. **Writing began as administration:** show the path from tokens and bullae to tablets, rations, labor accounts, and institutions.
5. **Early states were fragile population machines:** visualize walls, coerced labor, disease, flight, conflict, and the non-state periphery.

Source seeds to test and extend:

- James C. Scott, [*Against the Grain*](https://yalebooks.yale.edu/book/9780300240214/against-the-grain/).
- Cremieux Recueil, [“From Caveman to Chinaman”](https://www.cremieux.xyz/p/from-caveman-to-chinaman), especially water control and state formation.
- Patrick Wyman, [“Uruk and the Emergence of Civilization”](https://patrickwyman.substack.com/p/uruk-and-the-emergence-of-civilization).
- Add excavation reports, settlement datasets, paleochannel research, and critical reviews before publishing claims.

## P1 — Page 03: The cradles of civilization — ready

Treat “five cradles” as a question to investigate, not a settled canonical list.
Include Mesopotamia, Egypt, the Indus, northern China, Mesoamerica, and the Andes
when the evidence supports independent urban/state formation.

1. Map when and where urbanism, states, and writing emerged independently.
2. Compare river regimes, rainfall, crops, transport, and settlement density.
3. Compare the timing of cities, states, writing, bronze, and monumental building.
4. Show multiple routes to surplus and coordination rather than one hydraulic formula.
5. Explain why some early urban systems endured, transformed, dispersed, or left unreadable records.

## P1 — Page 04: The Bronze Age world system — ready

1. Copper and tin turned geography into a long-distance production network.
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

- 2026-08-29 — Replaced the apparent continuous Roman force reconstruction with seven source-backed anchors and four short, definition-consistent segments. Removed project-authored filler, visible uncertainty ranges, and every combined post-395 East–West value; the chart now separates reported Republican mobilization, Principate and late-imperial paper establishments, and a single eastern Notitia estimate. The disputed dating of that eastern total (traditional c.395 versus a recent c.440s argument) is explicit, and no western fifth-century total is plotted because the audit found no definition-compatible published estimate. Added four scholarly/primary sources, a durable research note, cache-versioned public data downloads, and validation assertions for the new structure. Verified the source trail, point selection, wording, clean browser console, validator, lint, and production build in the isolated `codex/rome-force-estimates` worktree.
- 2026-08-29 — Made the Roman territorial map inspectable without pretending annual playback means annual observation. Hovering the canvas or selecting a keyboard-accessible polity record now exposes the frame year, exact sourced interval, approximate area, Seshat record identity, background records, and downloadable boundary data; selection persists only while that dated geometry remains active. Added automated assertions for continuous Roman coverage from 500 BCE to 476 CE and for eastern/western state presence at 395, 410, 439, and 476. Repaired the event strip so its scrollbar no longer intercepts event-marker clicks, and added a repository README covering the project, evidence rules, local workflow, and current status. Verified pointer-equivalent selection, interval persistence across annual stepping, all four late-imperial transitions, data validation, lint, and the production build in the isolated `codex/rome-map-inspectability` worktree.
- 2026-08-29 — Audited every visible quantitative claim and data row in Rome’s two live insights. Removed the unsupported “largest empire Europe had ever known” superlative, 53 invented rival/interpolation rows, every unsourced kilogram-per-soldier value, and every derived iron-tonnage claim. The revised military visual directly labels Rome as a heterogeneous central-estimate series, shows rivals only as dated campaign observations, preserves disputed ancient reports as disputed rather than silently adjusting them, and confines Devereaux’s equipment argument to a sourced third–second-century BCE relative index (Rome 125, nearest comparator 100). Added a durable audit explaining each inclusion and removal. Validation now checks 23 Roman estimate rows, 11 rival campaign observations, 2 equipment-index rows, 36 source keys, 5 datasets, 2 claims, and 442 boundary features. Verified the readout interaction, five changed downloads, metadata, lint, and the production build in the isolated `codex/rome-evidence-audit` worktree.
- 2026-08-29 — Built the shared evidence and visual-data standard. Added canonical source, dataset, and claim registries; public JSON Schemas for observations, modeled series, boundaries, citations, and notes; and an automated validator for malformed CSV/JSON, missing files and source keys, invalid estimate ranges, unsupported claim statuses, and malformed boundary intervals. Rome now exposes an on-page evidence ledger distinguishing source observations, historical reconstructions, and model outputs, with claim-to-dataset-to-source provenance, source filtering, and direct downloads. The subsequent military audit supersedes the initial modeled-row contents while preserving and tightening this evidence system.
- 2026-08-29 — Built the reusable atlas and page-routing system. The new homepage states the project thesis, filters eleven queued pages by era/region/system, and labels research/draft/reviewed status. Rome moved to `/rome` through a reusable Introduction → Key Insights → Methods/Sources shell, retaining both interactive modules and naming insights 03–05. Verified both production routes, the Mediterranean filter, atlas-to-Rome navigation, annual map stepping, military metric toggle, metadata, lint, and the production build.
- 2026-08-29 — Annual 500 BCE–476 CE Roman map with sourced persistent geometry, neighboring polities, event jumps, and corrected late-imperial states. Verified with lint, production build, browser stepping, and 293/395/410/439/476 data checks.
- 2026-08-29 — Built the initial Rome-versus-rivals chart. Its unsupported 50-year rival interpolations and absolute iron-mass model were subsequently removed by the live-evidence audit above.
- 2026-08-29 — Project renamed from Visualizing Reality to How Everything Evolved.
