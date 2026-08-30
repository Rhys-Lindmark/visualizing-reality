# Rome live-evidence audit

Date: 2026-08-29

Scope: the two live Rome insights, their visible quantitative language, and every
row consumed by the military chart. This audit distinguishes what a cited source
actually reports from what the project reconstructs.

## Decisions

| Previous presentation | Evidence check | Disposition |
| --- | --- | --- |
| “Largest empire Europe had ever known” | The map demonstrates continental reach, but the page had no comparative area dataset establishing a cross-empire ranking. | Replaced with the directly inspectable three-continent claim. |
| Rival “capacity” values every 50 years | Most intervening values had one campaign citation but no reproducible derivation from that campaign to total state capacity. | Removed all rival interpolations. Rival marks now represent only dated campaign observations. |
| Kilograms of iron per soldier and total iron tonnes | Devereaux’s public summary supports a relative worked-metal comparison for the third and second centuries BCE. It does not publish enough underlying data to assign absolute kilograms to every polity from 500 BCE to 500 CE. It also combines iron and bronze. | Removed every absolute equipment-mass and tonnage value. Added a bounded relative index: Roman heavy infantry 125, nearest comparator 100. |
| Sasanian force at Amida silently reduced from 100,000 to 50,000 | Ammianus reports 100,000; Howard-Johnston cautions against treating campaign reports as total establishments. The project had no source for halving the report. | Restored the reported 100,000 and marked it “ancient report, disputed.” |
| Persian force at Gaugamela set to 75,000 | The cited key described Alexander’s invading army, not the Persian army. | Removed the point. |
| Roman force series shown like a continuous census | The rows mix ancient reports, unit-count models, modern published estimates, and project reconstructions. | Kept the central estimate line because the page’s argument concerns scale over time, but directly labeled it as an estimate series and retained evidence class, range, sources, and notes in every readout. |

## Public-source checks

- Bret Devereaux, “Fireside Friday, October 28, 2022 (The Book Project)”:
  [public summary](https://acoup.blog/2022/10/28/fireside-friday-october-28-2022-the-book-project/).
  Supports the qualitative mobilization argument, roughly a quarter-million
  Romans under arms after 216 BCE, and 25% more worked metal than the nearest
  comparator. Its stated scope is Roman success in the third and second
  centuries BCE.
- Bret Devereaux, “Phalanx’s Twilight, Legion’s Triumph, Part IIb”:
  [equipment discussion](https://acoup.blog/2024/02/16/collections-phalanxs-twilight-legions-triump-part-iib-handfuls-of-maniples/).
  Supports 5–10 kg for a finished mail coat, roughly 2 kg for early-third-century
  Montefortino helmets falling toward 1.5 kg, and mail adoption among roughly
  25–30% of Roman infantry by the late third century BCE. These component facts
  do not by themselves establish an army-wide worked-metal mean.
- Polybius 2.24: supports the 225 BCE distinction between forces actually
  deployed for Italy’s defense and the much larger register of men liable for
  service. The chart uses 156,000 as the deployed infantry-plus-cavalry anchor,
  not the liability pool.
- The remaining rival observations retain only the force described for the
  cited campaign. Notes flag disputed totals and prevent campaign armies from
  being interpreted as standing establishments or total state capacity.

## Roman-series interpretation

`roman-military-capacity.csv` is a transparent estimate series, not a recovered
annual dataset. Each row has:

- a central estimate used by the chart;
- low and high values documenting the project’s model range;
- an evidence class that identifies an ancient anchor, unit-count model, modern
  estimate, combined ancient/modern estimate, or reconstruction;
- one or more source keys; and
- a note stating the conversion or limitation.

The line connects heterogeneous observations for orientation. It must not be
described as annual measurement or as a homogeneous published series. Future
work should replace project reconstructions with published point estimates
where scholarship permits and should split eastern and western forces after
395 rather than implying one operational establishment.

## Remaining evidence limits

- Several book-based Roman estimates can be bibliographically checked but not
  fully reproduced from public excerpts. They remain labeled as estimates or
  reconstructions, never source observations.
- Campaign totals in ancient narratives are not automatically reliable. The
  chart’s “evidence class” is part of the claim, not interface decoration.
- No absolute “kilograms of worked metal per average soldier” series is
  published for all included armies and centuries. It should not return unless
  a component-level, source-keyed equipment model is assembled and reviewed.
