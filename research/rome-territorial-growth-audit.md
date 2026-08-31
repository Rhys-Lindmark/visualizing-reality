# Rome territorial-growth comparison audit

## Reader-facing claim

**Rome took centuries to reach imperial scale.** In Rein Taagepera's published reconstruction, Achaemenid Persia reached its selected peak anchor in 80 years and Western Han in 156 years, while Rome took 617 years from its first small-state anchor to the 117 CE maximum. The point is not that Rome conquered slowly in every campaign. It is that the cumulative territorial curve is much more gradual than the explosive Achaemenid and inherited-Qin/Han trajectories.

## Data lineage

- Rein Taagepera, “Size and Duration of Empires: Growth-Decline Curves, 600 B.C. to 600 A.D.,” *Social Science History* 3 (1979), pp. 121, 125, and 128.
- The machine-readable transcription comes from the NSF-supported Institute for Research on World-Systems workbook `empire_largestv15.xlsx`, University of California, Riverside. The selected rows reproduce Taagepera's printed anchors for Achaemenid Persia, Rome, and Western Han.
- Kathrin Leese-Messing's open-access Han synthesis supplies an important scope warning: Taagepera's Han areas include the approximately one-million-square-kilometre Tarim Basin, where control was much thinner than in the core.

## Transformations

- `elapsed_years` resets each polity to its first selected published anchor: 580 BCE for Achaemenid Persia, 500 BCE for Rome, and 206 BCE for Western Han.
- `share_of_series_peak` divides each anchor by the largest selected anchor for that polity: 5.5, 5.0, and 6.0 million square kilometres respectively.
- Lines connect published anchors for legibility. They are linear visual interpolation, not annual observations.
- The chart does not merge Western and Eastern Han. Western Han already begins at 2.8 million square kilometres because it inherited most of Qin's imperial scale, so its curve is not a city-state-to-empire trajectory comparable to Rome's starting condition.
- The annual Roman map remains a separate view based on Cliopatria/Seshat boundaries. Its areas are not spliced into the Taagepera comparison.

## Rejected claims

- **“Rome grew faster than any earlier state.”** Rejected: the selected Achaemenid and Han curves are much faster.
- **“Rome was uniquely durable.”** Not established by this growth-only comparison; Western Han and later Han require a separate continuity rule.
- **“Every point has the same territorial-control meaning.”** Rejected: frontier and tributary control differed, especially in the Han Tarim Basin.
- **Annual growth rates.** Rejected: the source supplies sparse anchors, not annual observations.
