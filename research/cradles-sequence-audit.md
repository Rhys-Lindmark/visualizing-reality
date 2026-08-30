# Cradles insight 03 — sequence evidence audit

## Claim under test

Cities, inferred states, durable notation, monumental building, and bronze do not
appear as one synchronized “civilizational package.” In the six regional
sequences used on the page, the bronze clock never begins before every other
clock. That is a descriptive result of the registered phase evidence, not a
claim that bronze was unimportant or that the plotted starts are invention
dates.

## Comparative design

- Reuse the eighteen audited rows from `cradles-evidence-clocks.csv` without
  changing dates, evidence status, source keys, interpretation, or limits.
- Add twelve rows: one monumental-building and one bronze clock for each region.
- Preserve ties. The ordinal cards rank distinct phase starts, not archaeological
  importance or causal priority.
- Keep the Andean notation gap undated. It is never assigned to 0 BCE.
- Extend the visible axis to 1550 CE so late Mesoamerican and Andean bronze
  traditions remain visible. The axis is not an annual series.

## New monument clocks

- **Mesopotamia, late fourth millennium BCE:** GLATZ_ET_AL2025 describes Uruk's
  several-hundred-hectare city and numerous monumental structures. This row
  reuses that phase and explicitly refuses to make monumentality a synonym for
  statehood.
- **Egypt, late Naqada II–early Naqada III:** MOELLER2015 identifies the
  ceremonial building at Hierakonpolis Locality 29A as an early kind of
  monumental building, while noting that truly large-scale mud-brick or stone
  architecture is not visible there until the Early Dynastic period.
- **Indus, c. 2600–1900 BCE:** GREEN_ALAM_PETRIE2026 documents monumental-scale
  accessible non-residential structures, planned streets, drainage, and massive
  foundations at Mohenjo-daro. Early excavators' functional labels remain open
  to revision; the row does not manufacture a palace or king.
- **Northern China, c. 2300–1900 BCE:** HE2018 describes Taosi's huge enclosure,
  palace precinct, palaces, altar, and specialized districts. The source's
  monarchic-state interpretation remains identified as interpretation.
- **Mesoamerica, c. 1000–800 BCE:** INOMATA_ET_AL2020 combines LiDAR, excavation,
  and Bayesian radiocarbon models for Aguada Fénix's 1.4-kilometre plateau. The
  site demonstrates large construction without requiring a later-style royal
  court; it is not asserted to be Mesoamerica's first monument.
- **Andes, 2627–1977 cal BCE:** SHADY_ET_AL2001 directly dates monumental
  platform construction at Caral. Monumentality alone does not establish a
  territorial state or labor regime.

## New bronze clocks

- **West Asia, c. 3000–2200 BCE:** WILLIAMS_ET_AL2025 separates rare occurrence,
  selected use, widespread use, and full adoption. It places sustained selected
  tin-bronze use around 3000 BCE and a significant share alongside arsenical
  copper in several West Asian regions by about 2200 BCE. The row is a regional
  transition, not a Mesopotamian invention date.
- **Egypt, Second Dynasty c. 2890–2686 BCE:** UCL_DIGITAL_EGYPT_METAL reports
  several bronze objects but warns that alloy identification requires laboratory
  analysis. Bronze remained uncommon until the Middle Kingdom and became common
  only in the New Kingdom, so the row is labeled `rare_attestation`.
- **Indus, c. 2600–1900 BCE:** PARK_SHINDE2014 reviews a 129-object multi-site
  Mature Harappan sample in which about 40 percent contained deliberate tin or
  arsenic alloying and the remainder was principally copper. The percentage is
  a sample composition, not an empire-wide production share.
- **Northern China, c. 1900–1500 BCE:** LIN_LIU2017 contrasts earlier northern
  copper and arsenical-alloy traditions with the more advanced copper-tin and
  copper-lead-tin assemblage at Erlitou. It is an adoption and scaling clock,
  not a single Chinese Bronze Age birthday.
- **Mesoamerica, c. 1200/1300–1521 CE:** HOSLER1988 places copper-tin and
  copper-arsenic bronze in the second period of West Mexican metallurgy.
  Metallurgy arrived around 800 CE and was transformed locally; this late clock
  applies to West Mexico rather than all Mesoamerica.
- **Andes, c. 600–1150 CE:** GUEDRON_ET_AL2021 combines sedimentary and
  archaeological evidence for intensified regional copper production during the
  Tiwanaku–Wari era, including tin bronze in northern Bolivia and arsenical
  bronze in southern Peru. Copper working began much earlier, so this is a
  regional bronze-development clock rather than a metalworking invention date.

## What the visual may say

- The five features did not arrive in one universal order.
- Bronze is never the only earliest clock in the six registered sequences.
- Monumental construction can precede the plotted regional state clock, most
  strikingly at Caral and Aguada Fénix.
- Secure writing can lag urban and political clocks, and a missing accepted
  script clock does not mean no administration.

## What the visual may not say

- No “civilization score,” development rank, or earlier-is-better ordering.
- No claim that phase start equals invention or first human use.
- No claim that bronze caused cities, states, monuments, or military superiority.
- No global use share inferred from one object sample or regional synthesis.
- No king, palace, forced-labor system, or centralized state inferred from a
  large building alone.
- No year-zero substitute for missing notation evidence.

## Reproducibility

The canonical thirty-row dataset is `public/data/cradles-sequence-clocks.csv`.
The client fetches the immutable byte-identical snapshot at
`public/data/cradles/20260830-sequence1/`. Validation requires one row for every
region–milestone pair, exact reuse of all eighteen earlier clocks, one undated
gap, substantive row limits, the key regional bronze and monument anchors, and
snapshot equality.
