# Rome insight 05 — road-persistence evidence audit

## Selected claim

**Roman roads persisted where later societies kept using roads.** Roman-road
density predicts modern-road density and modern economic activity in Europe,
but not in the Middle East and North Africa after wheeled transport and road
maintenance were abandoned in favor of caravan routes.

This is more informative than the previous “different carriers and clocks”
framing because the claim can fail. The same Roman infrastructure existed in
both regions; the later relationship appears only where its use continued.

## Primary evidence

The public dataset reproduces Table 5 of Dalgaard, Kaarsen, Olsson, and Selaya
(2022). Every row uses the paper's full control set and country-language fixed
effects. Coefficients are log-log elasticities; standard errors are published
heteroskedasticity-robust standard errors.

| Outcome | Europe coefficient (SE) | MENA coefficient (SE) |
|---|---:|---:|
| Settlements around 500 CE | 0.470* (0.255) | 0.599* (0.358) |
| Modern roads | 0.208*** (0.072) | -0.115 (0.091) |
| Night lights, 2010–2013 | 0.783*** (0.191) | 0.405 (0.282) |
| Population, 2010 | 1.405*** (0.390) | 0.717 (0.630) |

The late-antique settlement result is positive in both regions. The modern
Europe coefficients are positive and significant at 1%; the corresponding
MENA estimates are not statistically significant. This before/after regional
contrast is the visual's central evidence.

## Mechanism and identification limit

The authors use the long abandonment of wheeled transport in MENA as a natural
experiment. They argue that caravan routes displaced road-based trade, roads
lost value and maintenance, and later transport geography no longer followed
the ancient network. In Europe, continued wheeled use and the emergence of
medieval market towns helped carry the network forward.

The result is stronger than a map overlay but not unlimited causal proof. The
authors control for extensive geography and exploit a differential historical
shock, yet the model cannot distinguish productivity gains from activity moving
toward better-connected places. Night lights are an activity proxy, not welfare.
An insignificant MENA coefficient is not proof of a precisely zero relationship
or the absence of every local Roman road legacy.

## Alternative answers retained

- **State:** the eastern Roman polity continued for 977 years after the western
  court ended in 476, until Constantinople fell in 1453.
- **Language:** Latin's divergence into Romance was gradual and regional; 813
  and 842 are evidence markers, not birthdays.
- **Law:** Justinianic law was an eastern codification followed by centuries of
  limited western influence and then medieval scholarly recovery.

These are consequential afterlives, but combining them with roads would require
an invented common score. Roads lead the public insight because the evidence
offers a measurable cross-regional test of a historical mechanism.

## Deliberate exclusions

- No claim that a modern road preserves Roman pavement.
- No percentage of modern prosperity “caused by Rome.”
- No claim that the road coefficients measure welfare or productivity alone.
- No claim that non-significance proves no MENA legacy.
- No ranking that turns states, languages, laws, and roads into one score.
- No claim that 476 ended the Roman state.

## Principal sources

- Carl-Johan Dalgaard, Nicolai Kaarsen, Ola Olsson, and Pablo Selaya, “Roman
  Roads to Prosperity: Persistence and Non-Persistence of Public
  Infrastructure,” *Journal of Comparative Economics* 50 (2022), 896–916,
  DOI 10.1016/j.jce.2022.05.003.
- Pau de Soto et al., “Itiner-e: a high-resolution dataset of roads of the Roman
  Empire,” *Scientific Data* 12 (2025), DOI 10.1038/s41597-025-06140-z.
- Jerome Moran, “The Strasbourg Speeches,” *Journal of Classics Teaching* 22
  (2021); Oxford Faculty of Law, “Roman Law”; Anthony Kaldellis, *The New Roman
  Empire* (2023) and *1453* (2026), for the retained alternative answers.
