# Bronze Age metal network — evidence audit

## Claim under test

Bronze production joined copper-producing regions to scarcer and sometimes very distant tin sources through overlapping archaeological, analytical, and textual networks. The surviving evidence does **not** support one complete route map or an annual flow series.

## Included evidence

| View | Observation shown | Source basis | What the visual refuses to infer |
| --- | --- | --- | --- |
| One ship cargo | Uluburun carried approximately 10 tonnes of copper and 1 tonne of tin in the late fourteenth century BCE. Its copper belongs to the Cypriot oxhide-ingot system. | `HAUPTMANN_ET_AL2002`; `MANNING_ET_AL2009`; `STOS_GALE_ET_AL1997` | A typical-year ratio, system total, complete manifest, or reconstructed voyage. |
| Cypriot copper reach | A study compared nearly 200 Cypriot ore analyses with 78 oxhide ingots found in Cyprus, Crete, Greece, Sardinia, Turkey, and Bulgaria; the ingots were consistent with northern Cyprus, especially Apliki. | `STOS_GALE_ET_AL1997` | Six direct voyages, find counts by region, or the total distribution of Cypriot copper. |
| Atlantic tin signal | Three Bronze Age shipwreck ingot groups off Israel were fully consistent with Cornwall–Devon ores under a combined trace-element, lead-isotope, and tin-isotope method. | `WILLIAMS_ET_AL2025` | A direct Britain-to-Levant connection. The authors explicitly say there is no evidence for one. Sardinia remains only a possible intermediary in down-the-line exchange. |
| Text before route | A Mari text reports tin exchange at Ugarit involving Minoans and a translator. | `SAUVAGE2017` | A mine source, cargo mass, named vessel, or complete physical route. |

## Tin-provenance disagreement kept visible

Powell and colleagues (`POWELL_ET_AL2022`) proposed Mušiston in Central Asia and a Taurus-region source for Uluburun tin. Berger and colleagues (`BERGER_ET_AL2023`) rejected the specific Mušiston match and argued that neither tin isotopes alone nor the combined data currently establish a definite source. They regard a European contribution as possible but not incontrovertible and an Anatolian source as less likely, not categorically impossible.

The product therefore shows Mušiston as a rejected **specific** hypothesis, keeps Taurus as a contested candidate, and shows south-west Britain as plausible but unresolved. It does not collapse disagreement into one preferred route.

## Excluded quantities and claims

- No annual copper or tin volume. One wreck is one observed cargo.
- No system-wide 10:1 alloy ratio. The cargo masses are not a production recipe or annual average.
- No direct Britain-to-Levant voyage. Analytical compatibility does not identify traders, stops, or itinerary.
- No direct Apliki-to-findspot routes. The six links summarize provenance within one 78-ingot study.
- No “first globalization” date, unified market, centralized controller, or whole-world coverage.
- No inferred ranking of sources from line length, node count, or color.

## Product contract

The public CSVs separate nodes from connections and attach `source_keys`, `evidence_status`, and `limits` to every row. The client loads an immutable revision and fails closed if row counts or required fields change. Validation enforces the four evidence-view row counts, source-key integrity, endpoint integrity, the direct-route caveat, the Mušiston proposal/critique pair, and byte-for-byte equality between canonical and immutable client files.
