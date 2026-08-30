# Cradles page thesis audit — insight 01

Audited 30 August 2026. This note records the decisions behind
`public/data/cradles-evidence-clocks.csv`; it is not a fourth chronology.

## Comparative claim

The visual may support this bounded claim: urban scale, political
centralization, and durable notation became visible on different clocks across
six regions commonly compared in primary-state research. It may not rank
“civilizations,” assign one civilizational birthday, or treat the six cases as
a complete canonical list.

George Cowgill's dimensional approach to urbanism is the framing source. Charles
Spencer's six-region territorial-expansion model supplies a deliberately
testable comparative frame, not proof that “primary state” is an uncontested
category or that one model explains every region.

## Regional decisions

| Region | Urban clock | Political clock | Notation clock | Blocking limit |
| --- | --- | --- | --- | --- |
| Mesopotamia | Uruk, c. 3500–3100 BCE | Uruk–Susiana, c. 3500–3300 BCE | Proto-cuneiform, c. 3350–3000 BCE | Selz finds no unequivocal monocracy; one 3100 BCE footprint is not an annual growth series. |
| Egypt | Hierakonpolis, c. 3500–3200 BCE | consolidation, c. 3400–3100 BCE | Tomb U-j, c. 3250 BCE | Narmer is not plotted as one uncontested state birthday; Tomb U-j labels are not continuous discourse. |
| Indus | Mature Harappan, c. 2600–1900 BCE | coordinated regional system, same phase | Indus script, same phase | Political form is contested; no kings, palaces, or readable dynastic chronicle are invented. |
| Northern China | Taosi, c. 2300–1900 BCE | Erlitou, c. 1800–1500 BCE | secure late Shang corpus, c. 1300–1250 BCE | Taosi and Erlitou status remain interpretations; earlier signs are not promoted into secure writing. |
| Mesoamerica | Monte Albán I, c. 500–100 BCE | Late Monte Albán I, c. 300–100 BCE | San Andrés, c. 650 BCE | The small San Andrés corpus remains probable and contested, not an uncontested hemispheric “first.” |
| Andes | Caral, 2627–1977 cal BCE | probable Virú state, second century BCE | undated evidence gap | No early deciphered-script date is plotted at zero; later khipu evidence is a different chronology. |

## Source and metadata checks

- DOI metadata for Cowgill 2004, Spencer 2010, Moeller 2015, Regulski 2016,
  Green and Petrie 2018, Green 2020, He 2018, Xu 2018, Demattè 2022,
  Spencer and Redmond 2004, Pohl et al. 2002, Shady Solis et al. 2001,
  Millaire 2010, and Urton 2017 was checked against Crossref.
- Caral's calibrated 2627–1977 BCE interval and 65-hectare central zone come
  directly from the Science abstract; only the interval is encoded here.
- Millaire describes Virú state emergence as probable and in the second century
  BCE; both qualifications are preserved.
- Pohl, Pope, and von Nagy's c. 650 BCE San Andrés interpretation is preserved as
  `probable_contested_attestation`, not silently upgraded to secure consensus.
- Green's Indus critique explicitly notes the absence of clear palaces, royal
  tombs, individual-aggrandizing monuments, and a recovered ruling class. The
  dataset therefore describes coordination without assigning a dynasty.

## Data rules enforced in code

- Exactly six regions × three clocks = 18 rows.
- Exactly one undated row: Andes × durable notation.
- Every political row is an inference class, never a direct constitutional
  observation.
- No continuous interpolation, confidence bands, civilization score, rank, or
  numeric independence measure.
- All coordinates are evidence-case locations rather than territorial borders.
