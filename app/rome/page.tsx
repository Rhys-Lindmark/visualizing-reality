import type { Metadata } from 'next';
import HistoryPageShell from '../components/HistoryPageShell';
import EvidencePanel from '../components/EvidencePanel';
import RomanMobilizationStory from '../RomanMobilizationStory';
import RomanThinStateChart from '../RomanThinStateChart';
import RomanAfterlivesChart from '../RomanAfterlivesChart';
import RomanTerritorialStory from '../RomanTerritorialStory';
import WesternFallMechanism from '../WesternFallMechanism';

export const metadata: Metadata = {
  title: 'Rome',
  description: 'An evidence-led visual history of how Rome expanded, mobilized power, financed empire, changed, and endured.',
  openGraph: {
    title: 'Rome — How Everything Evolved',
    description: 'A visual history of Roman territory, military capacity, imperial finance, western contraction, and institutional afterlives.',
    images: [],
  },
  twitter: { card: 'summary', title: 'Rome — How Everything Evolved', description: 'A visual history of Roman territory, military capacity, imperial finance, and the western court’s contraction.', images: [] },
};

export default function RomePage() {
  return (
    <HistoryPageShell
      title="Rome"
      eyebrow="Iron Age · Mediterranean · state capacity"
      standfirst="A city on the Tiber brought most Mediterranean coastlands under one state—and remained a continental-scale power for centuries."
      status="draft"
      progress="5 of 5 insights live"
      published="August 2026"
      insightLabels={['Rome took centuries to reach imperial scale','Rome won because its Italian alliance could survive defeat','Rome governed through cities, not a giant bureaucracy','The West fell when war stripped away the taxes that paid its armies','Roman roads persisted where later societies kept using roads']}
      introduction={<><p>Rome’s history is almost a millennium of expansion, consolidation, division, and survival. Seeing the whole arc matters: the Republic’s Italian coalition, the Mediterranean empire, the Tetrarchy’s four courts, the loss of the western provinces, and the Roman state that continued in the East.</p><p>We begin with five basic questions. How fast did Rome grow? Why could it keep replacing armies? How did such a large empire govern with so few central officials? Why did the western court fail? And which Roman systems persisted—and by what mechanism?</p><p>Ancient numbers are fragmentary. The visuals distinguish dated observations, unlike kinds of military totals, comparative orders of magnitude, fiscal-equivalent models, and different forms of institutional continuity rather than smoothing them into false precision.</p></>}
      methods={<><p>All five planned arguments are live, but this remains a working page. Territorial geometry comes from the Seshat Global History Databank’s Cliopatria dataset and is simplified for web display over a Natural Earth physical basemap. Annual playback does not imply annual observations: each sourced boundary persists until the next dated geometry.</p><p>The military chart separates unlike evidence rather than manufacturing uniformity. Seven Roman anchors are shown in four short, definition-consistent segments; blank years are evidence gaps, not zeroes. Rival dots are reported or reconstructed forces from particular campaigns. The only fifth-century Roman total shown is explicitly eastern, and its plotted date foregrounds the scholarly dispute over when the eastern Notitia Dignitatum describes.</p><p>The administration comparison combines the Western Han establishment recorded for 5 BCE with a published approximate 20-to-1 Han–Rome ratio. It does not infer a precise Roman census. The Han count excludes military officials, while Roman municipal elites are described as the mechanism of delegated rule rather than added to an imperial payroll.</p><p>The western-fall chain is a testable mechanism, not a causal score. Its selected conflicts and losses show how internal war and invasion could reduce taxable territory and therefore the resources available for recovery. The African bars reproduce Heather’s fiscal-equivalent model using Elton’s maintenance costs; they are neither an observed headcount decline nor a continuous western army series. Valentinian’s 445 law supports a one-eighth assessment only for its two named surviving provinces. The chart treats 476 as the end of the western court, not the end of the Roman state.</p><p>The road-persistence chart reproduces the Europe–MENA split in Dalgaard and colleagues’ fully controlled Table 5 regressions. Coefficients compare elasticities rather than road shares; whiskers are 95% intervals calculated from the published standard errors. Night lights proxy economic activity, not welfare. The research design supports continued use and maintenance as a persistence mechanism, but it cannot distinguish productivity gains from the relocation of activity and does not imply that modern roads preserve Roman pavement.</p><EvidencePanel page="rome" /></>}
    >
      <section className="insight map-insight">
        <div className="insight-copy"><span className="insight-number">01</span><p className="claim">Rome did not explode across the map. Its territorial curve rose far more slowly than the Achaemenid or Western Han curves.</p><h3>Rome took centuries to reach imperial scale</h3><p>Achaemenid Persia reached 5.5 million square kilometres eighty years after the first selected anchor. Western Han reached 6 million in 156 years—and began at 2.8 million because it inherited most of Qin&apos;s imperial shell.</p><p>Rome&apos;s curve was different. Taagepera&apos;s reconstruction begins with a tiny central Italian polity in 500 BCE, reaches one million square kilometres only in the second century BCE, and reaches five million under Trajan in 117 CE: 617 years after the first anchor.</p><p>That does not make every Roman campaign slow. It makes Rome&apos;s cumulative expansion unusually gradual: conquest repeatedly became alliance, province, tax base, and a platform for another round. The map view shows where that accumulated territory was; the comparison view shows how long accumulation took.</p></div>
        <RomanTerritorialStory />
      </section>
      <section className="insight manpower-insight">
        <div className="insight-copy"><span className="insight-number">02</span><p className="claim">Carthage could match Rome&apos;s peak deployment. Rome&apos;s advantage was an Italian alliance that kept producing armies after battlefield disasters.</p><h3>Rome won because its Italian alliance could survive defeat</h3><p>Rome did not win the Second Punic War because Carthage could not raise a large army. Michael Taylor reconstructs Carthaginian strategic deployment at roughly 170,000 troops in 215 BCE, close to—and perhaps briefly above—Rome&apos;s wartime scale.</p><p>The difference was political. Roman citizens, Latin colonies, and the Italian allies formed a coercive but durable military network. Most of that network remained intact after Cannae, so defeat triggered another levy rather than state collapse. By 212 BCE Rome and its allies again supported roughly twenty-five legions across several theaters.</p><p>Equipment reinforced that system rather than replacing it. Devereaux&apos;s comparison makes Roman heavy infantry materially expensive, not cheap: about 25% more worked metal than the nearest comparator in his bounded model.</p></div>
        <RomanMobilizationStory />
      </section>
      <section className="insight fiscal-insight">
        <div className="insight-copy"><span className="insight-number">03</span><p className="claim">Rome governed an empire of roughly 60–70 million people with about one-twentieth as many officials as Han China.</p><h3>Rome governed through cities, not a giant bureaucracy</h3><p>Rome and Western Han ruled populations of similar order, but built different states. The Han record for 5 BCE lists 130,285 civil officials. A published comparative estimate puts that at roughly twenty times Rome&apos;s imperial officialdom.</p><p>Rome made the gap workable by governing through cities. Governors and a small imperial apparatus relied on municipal councils and wealthy provincial families to assess taxes, maintain order, fund public works, and translate imperial commands into local action.</p><p>That was efficient and politically consequential. Rome could rule widely without placing a salaried official in every town—but it also made imperial government dependent on local elites whose cooperation the center could influence more easily than replace.</p></div>
        <RomanThinStateChart />
      </section>
      <section className="insight collapse-insight">
        <div className="insight-copy"><span className="insight-number">04</span><p className="claim">The West did not fall because its enemies suddenly became unbeatable. It fell when wars for the throne and invasions stripped away the taxes needed to rebuild Roman armies.</p><h3>The West fell when war stripped away the taxes that paid its armies</h3><p>External pressure opened the crisis, but Roman political competition made it harder to contain. Fifth-century armies repeatedly fought over command while Britain, Gaul, Spain, and then Africa slipped from direct imperial control.</p><p>The decisive feedback was fiscal. Losing provinces meant losing taxpayers; losing taxpayers meant fewer salaried troops; fewer troops made recovery harder. When the Vandals seized Carthage in 439, the western court lost its richest remaining tax lands. A 445 law assessed two damaged provinces at only one eighth of their former burden.</p><p>The West still attempted recovery. Heather&apos;s model values the lost African revenues at roughly 58,000 infantry-years of annual maintenance, and major reconquests failed in 461 and 468. By 476 no new western emperor was appointed. The eastern Roman state survived because the process was not a universal Roman collapse.</p></div>
        <WesternFallMechanism />
      </section>
      <section className="insight afterlives-insight">
        <div className="insight-copy"><span className="insight-number">05</span><p className="claim">Roman roads predicted modern roads and economic activity in Europe—but not where wheeled transport was abandoned.</p><h3>Roman roads persisted where later societies kept using roads</h3><p>Rome’s road network did not survive through engineering alone. In Europe, denser Roman roads predict denser modern roads, greater night-light intensity, and higher population density after geographic and country-language controls.</p><p>The comparison changes in the Middle East and North Africa. Roman roads still predict settlements around 500 CE, before caravan transport displaced wheeled traffic. They do not significantly predict the region’s modern roads, night lights, or population.</p><p>The legacy was therefore maintained geography, not immortal pavement. Routes endured when later users kept finding roads valuable enough to use, repair, and build upon.</p></div>
        <div className="viz-card afterlives-viz"><RomanAfterlivesChart /></div>
      </section>
    </HistoryPageShell>
  );
}
