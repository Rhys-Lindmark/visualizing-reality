# How Everything Evolved — Continuous Backlog

This is the persistent queue for the autonomous site updater. Work one coherent,
reviewable item at a time, from the highest-priority `ready` item downward.

## Operating rules

- Never fabricate a number, boundary, quotation, or citation.
- Mark reconstructions and model outputs explicitly; preserve source keys in downloadable data.
- Prefer primary sources, peer-reviewed scholarship, academic reference works, and high-quality specialist synthesis. ACOUP is a major interpretive source, not the sole authority.
- Do not add a top-level claim until its evidence and visualization are strong enough to survive informed historical criticism.
- Preserve the owner-only site access policy. Never change access, domains, credentials, billing, or repository visibility autonomously.
- Before publishing: run lint and the production build, test the affected interaction in a browser, inspect the diff, and confirm downloadable data parses.
- Commit and push the validated change to GitHub `Rhys-Lindmark/visualizing-reality`, push the same commit to the Sites source repository, and deploy that exact commit.
- After each run, move finished work to `Completed`, record verification, and leave the next item in a clear state.
- Stop and report a blocker when a product decision is genuinely ambiguous, evidence conflicts materially, or the change would be destructive or expand scope.

## Ready

### P0 — Audit the two live insights

- Check every quantitative statement and CSV source key against the cited source.
- Add a compact on-page source/method panel so a skeptical reader can trace the map and chart without opening the repository.
- Fix any claim that is stronger than the evidence.

### P0 — Make the Roman map historically inspectable

- Add hover/click readouts for the active Roman and neighboring polity geometries.
- Surface the source interval behind each annual frame, so readers can distinguish annual playback from dated boundary observations.
- Check the eastern and western administrations at 395, 410, 439, and 476 against specialist maps and the underlying Seshat geometry.

### P1 — Improve the military comparison model

- Document the interpolation rule used for each rival 50-year series.
- Ensure each campaign anchor has a human-readable citation and the line never implies continuous observations.
- Add direct labels at line ends where this improves OWID-style readability.

### P1 — Build Insight 03: how Rome paid for empire

- Research taxation, tribute, customs, land tax, military pay, and grain flows across the Republic and Empire.
- Create the source/data file before designing the chart.
- Prefer an explanatory fiscal-flow visualization over an unsupported single-number time series.

### P1 — Build Insight 04: why the western empire fell

- Avoid a monocausal story. Compare fiscal capacity, army cost, civil war, territorial loss, and external pressure over time.
- Separate the end of the western imperial court from the survival of the eastern Roman state.

### P2 — Build Insight 05: labor, land, and slavery

- Show what can and cannot be quantified about enslaved labor, tenancy, estates, and agricultural production.
- Do not present empire-wide slave population estimates as settled facts.

### P2 — Build Insight 06: what Rome left behind

- Map or chart roads, language families, legal inheritance, cities, and administrative boundaries with clear causal caveats.

## Blocked

- None.

## Completed

- 2026-08-29 — Annual 500 BCE–476 CE Roman map with sourced persistent geometry, neighboring polities, event jumps, and corrected late-imperial states. Verified with lint, production build, browser stepping, and 293/395/410/439/476 data checks.
- 2026-08-29 — Rome-versus-rivals manpower and manpower × iron chart with 50-year modeled rival series, separate campaign anchors, metric toggle, and downloadable CSVs. Verified with lint, production build, CSV parsing, and browser interaction.
- 2026-08-29 — Project renamed from Visualizing Reality to How Everything Evolved; recurring autonomous improvement loop established.
