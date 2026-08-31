# Qin/Han insight 01 audit — competition and the mobilizing system

## Claim under test

Qin did not defeat the other Warring States because one ruler invented bureaucracy or because one weapon made its army unbeatable. Interstate competition rewarded states able to register households, connect taxes and service to individuals, channel rewards into farming and war, make local offices report, and move supplies between regions. Qin is the best-documented and ultimately victorious case, not the only reforming state.

## Source map

- **Brian Lander, “Making Use of the Land” (2023, open access):** the primary synthesis for gradual fourth–third-century household registration, rank and land rewards, the Liye county registers, and the warning that comparable reforms occurred across the competing states while Qin happens to be best recorded. It explicitly separates later Shang Yang tradition from excavated evidence.
- **Chun Fung Tong, “The Emergence of Logistics Networks…” (2026, open access):** the primary synthesis for horizontal and vertical assigned transfers, the 224–223 BCE soldier letter, the 220 BCE armament transfers, annual accounts, shortages, and the point that logistics remained difficult and unreliable. Its discussion of ancient army and loss totals is not reproduced as accepted measurement.
- **The Book of Lord Shang, edited and translated by Yuri Pines (2017):** a layered fourth–third-century policy text advocating a state oriented toward agriculture and warfare. It is evidence for a program of rule, not a verbatim 359 BCE decree or proof of uniform implementation.
- **Columbia Asia for Educators excerpt from “Making Orders Strict”:** an accessible primary-source excerpt and contextual introduction. The site records a traditional 359 BCE reform date, but the visual uses the broader text date because Pines’s textual work shows that the received book is layered.
- **Sima Qian, *Shiji* 6, Qin Shi Huang annals:** the retrospective early-Han narrative used for the political endpoints Han 230, Zhao court 228, Wei 225, Chu 223, Yan and Dai 222, and Qi 221 BCE. No transmitted army total or casualty count is accepted.

## Design decision

The visual has two clocks. Five selectable system links show pressure → counting → reward → reporting → supply, each with a bounded evidence class and inference limit. A separate six-event strip shows the final conquest sequence. The layout never turns either clock into an annual state-capacity series, a causal score, a territorial map, or an army total.

## Claims deliberately excluded

- Shang Yang single-handedly invented the Qin system in one reform year.
- Qin was the only Warring State that registered households or militarized government.
- The Book of Lord Shang describes enacted policy word for word.
- Liye is representative of every Qin county or proves that reported categories equaled actual control.
- Six political endpoints are a continuous boundary map or proof of local pacification.
- Transmitted armies of hundreds of thousands are measured force totals.
- Administrative intensity made Qin stable; the short imperial dynasty is an immediate counterexample to that inference.

## Data contract

`qin-mobilizing-system.csv` contains eleven rows: five system links and six conquest endpoints. Every row preserves a kind, bounded date, evidence class, observation, source keys, interpretation, and limit. There are no fields for army size, casualty count, state-capacity score, efficiency, centralization, conquest area, population, or annual interpolation.
