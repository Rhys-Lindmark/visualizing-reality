import type { Metadata } from 'next';
import HistoryPageShell from '../components/HistoryPageShell';
import EvidencePanel from '../components/EvidencePanel';
import MilitaryCapacityChart from '../MilitaryCapacityChart';
import RomanMap from '../RomanMap';

export const metadata: Metadata = {
  title: 'Rome',
  description: 'An evidence-led visual history of how Rome expanded, mobilized power, changed, and endured.',
  openGraph: {
    title: 'Rome — How Everything Evolved',
    description: 'A visual history of Roman territory and military capacity.',
    images: [],
  },
  twitter: { card: 'summary', title: 'Rome — How Everything Evolved', description: 'A visual history of Roman territory and military capacity.', images: [] },
};

export default function RomePage() {
  return (
    <HistoryPageShell
      title="Rome"
      eyebrow="Iron Age · Mediterranean · state capacity"
      standfirst="A city on the Tiber brought most Mediterranean coastlands under one state—and remained a continental-scale power for centuries."
      status="draft"
      progress="2 of 5 insights live"
      published="August 2026"
      insightHeading={<>First, see the empire.<br />Then, see its advantage.</>}
      introduction={<><p>Rome’s history is almost a millennium of expansion, consolidation, division, and survival. Seeing the whole arc matters: the Republic’s Italian coalition, the Mediterranean empire, the Tetrarchy’s four courts, the loss of the western provinces, and the Roman state that continued in the East.</p><p>We begin with two basic questions. Where was Rome, and how did that territory change? Then: how could it keep raising armies after defeats that would have ended most ancient states?</p><p>Ancient numbers are fragmentary. Every chart below distinguishes a registered military pool, soldiers actually under arms, and the size of one army in one campaign.</p></>}
      methods={<><p>This is a working page. Two of five planned insights are live. Territorial geometry comes from the Seshat Global History Databank’s Cliopatria dataset and is simplified for web display over a Natural Earth physical basemap. Annual playback does not imply annual observations: each sourced boundary persists until the next dated geometry.</p><p>The military chart now separates unlike evidence rather than manufacturing uniformity. Rome’s red line connects heterogeneous central estimates of empire-wide forces under arms. Rival dots are reported or reconstructed forces from particular campaigns; they are not interpolated into undocumented 50-year “capacity” series. The equipment comparison is a relative index for the third and second centuries BCE because the public evidence supports a 25% worked-metal comparison—not precise kilograms for every army across a millennium.</p><EvidencePanel page="rome" /></>}
    >
      <section className="insight map-insight">
        <div className="insight-copy"><span className="insight-number">01</span><p className="claim">At its height, Rome governed territory across Europe, North Africa, and western Asia.</p><h3>From one city to three continents</h3><p>Press play to follow more than nine centuries of Roman political geography. The map begins with a small state in central Italy, reaches its greatest extent under Trajan, then changes meaning: one empire with four courts, two imperial administrations, and finally an eastern empire without a western emperor.</p><p>The important change is not only size. Watch the political form change while the Roman name endures. Hover or select any polity to inspect the exact dated reconstruction used in each annual frame.</p></div>
        <RomanMap />
      </section>
      <section className="insight manpower-insight">
        <div className="insight-copy"><span className="insight-number">02</span><p className="claim">Rome could replace large armies without equipping them cheaply.</p><h3>Why Rome won: deep mobilization, expensive soldiers</h3><p>The graph compares Rome’s estimated soldiers under arms with forces reported for particular rival campaigns. Those are different quantities, so the chart draws them differently: a Roman estimate line and rival campaign dots.</p><p>The striking argument is multiplicative but not literally measurable in tonnes. During the third and second centuries BCE, Rome repeatedly fielded unusually large forces while its heavy infantry carried expensive mail, unusually substantial helmets, swords, and iron-intensive pila. Devereaux’s comparative panoply model estimates about 25% more worked metal—iron and bronze—per Roman heavy infantryman than the nearest comparison.</p><p>The earlier version assigned exact kilograms and smooth 50-year capacity lines to every rival. The surviving evidence cannot support that precision, so those values are gone. What remains is checkable: cited Roman force estimates, cited campaign observations, and one explicitly bounded relative equipment comparison.</p><a className="source-link" href="https://acoup.blog/2022/10/28/fireside-friday-october-28-2022-the-book-project/">Read Devereaux’s public summary ↗</a></div>
        <div className="viz-card manpower-viz-v2"><div className="viz-title"><div><span>Force estimates + observed campaigns</span><h4>How much army could Rome keep replacing?</h4></div><small>500 BCE–500 CE · no annual rival interpolation</small></div><MilitaryCapacityChart /><p className="viz-note"><b>Method:</b> Rome’s connected line contains heterogeneous central estimates with ranges retained in the CSV. Rival outlined points are individual campaign forces; they do not measure a polity’s total capacity. The comparison excludes theoretical liability pools. Equipment is shown separately as a relative third–second-century BCE index because the cited public source does not publish defensible absolute metal masses for every army.</p></div>
      </section>
      <section className="coming-insights" aria-labelledby="next-insights"><div><span className="insight-number">03–05</span><h3 id="next-insights">The argument still to come</h3><p>A draft label means the page is honest about what remains. These are the next three visual claims, not empty decoration.</p></div><ol><li><b>How Rome paid for empire</b><span>Tax, tribute, grain, customs, and military pay.</span></li><li><b>Why the western court fell</b><span>Fiscal capacity, civil war, territorial loss, and external pressure.</span></li><li><b>What Rome changed</b><span>Land, labor, roads, language, law, cities, and eastern survival.</span></li></ol></section>
    </HistoryPageShell>
  );
}
