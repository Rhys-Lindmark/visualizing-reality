import type { Metadata } from 'next';
import HistoryPageShell from '../components/HistoryPageShell';
import MilitaryCapacityChart from '../MilitaryCapacityChart';
import RomanMap from '../RomanMap';

export const metadata: Metadata = {
  title: 'Rome',
  description: 'An evidence-led visual history of how Rome expanded, mobilized power, changed, and endured.',
  openGraph: {
    title: 'Rome — How Everything Evolved',
    description: 'A visual history of Roman territory and military capacity.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'How Everything Evolved — Rome' }],
  },
  twitter: { card: 'summary_large_image', title: 'Rome — How Everything Evolved', description: 'A visual history of Roman territory and military capacity.', images: ['/og.png'] },
};

export default function RomePage() {
  return (
    <HistoryPageShell
      title="Rome"
      eyebrow="Iron Age · Mediterranean · state capacity"
      standfirst="A city on the Tiber became the largest empire Europe had yet seen—and remained a Mediterranean superstate for centuries."
      status="draft"
      progress="2 of 5 insights live"
      published="August 2026"
      insightHeading={<>First, see the empire.<br />Then, see its advantage.</>}
      introduction={<><p>Rome’s history is almost a millennium of expansion, consolidation, division, and survival. Seeing the whole arc matters: the Republic’s Italian coalition, the Mediterranean empire, the Tetrarchy’s four courts, the loss of the western provinces, and the Roman state that continued in the East.</p><p>We begin with two basic questions. Where was Rome, and how did that territory change? Then: how could it keep raising armies after defeats that would have ended most ancient states?</p><p>Ancient numbers are fragmentary. Every chart below distinguishes a registered military pool, soldiers actually under arms, and the size of one army in one campaign.</p></>}
      methods={<><p>This is a working page. Two of five planned insights are live. Territorial geometry comes from the Seshat Global History Databank’s Cliopatria dataset and is simplified for web display over a Natural Earth physical basemap. Annual playback does not imply annual observations: each sourced boundary persists until the next dated geometry.</p><p>The military chart combines cited force estimates with an explicit equipment model. Rome’s line represents estimated empire-wide forces under arms; rival dashed lines interpolate between modeled 50-year capacity points and surviving campaign anchors. Downloadable CSVs retain source keys, assumptions, and notes.</p><div className="method-links"><a href="/data/ancient-polities.geojson" download>Political geometry ↓</a><a href="/data/roman-military-capacity.csv" download>Rome data ↓</a><a href="/data/comparison-forces.csv" download>Rival data ↓</a><a href="/data/roman-military-sources.csv" download>Source registry ↓</a></div></>}
    >
      <section className="insight map-insight">
        <div className="insight-copy"><span className="insight-number">01</span><p className="claim">Rome became the largest empire Europe had ever known.</p><h3>From one city to three continents</h3><p>Press play to follow more than nine centuries of Roman political geography. The map begins with a small state in central Italy, reaches its greatest extent under Trajan, then changes meaning: one empire with four courts, two imperial administrations, and finally an eastern empire without a western emperor.</p><p>The important change is not only size. Watch the political form change while the Roman name endures.</p></div>
        <RomanMap />
      </section>
      <section className="insight manpower-insight">
        <div className="insight-copy"><span className="insight-number">02</span><p className="claim">Rome combined more soldiers with more metal per soldier.</p><h3>Why Rome won: manpower × iron</h3><p>The graph compares soldiers actually under arms—not every man theoretically liable for service—and multiplies each force by a consistently modeled iron load per soldier.</p><p>Rome’s advantage was multiplicative. Its Italian federation could sustain unusually large armies, while its heavy infantry increasingly carried expensive mail, substantial helmets, swords, and iron-intensive pila. ACOUP estimates Roman kit contained about 25% more worked metal than its nearest competitor.</p><p>Now Rome is not alone: compare it with Achaemenid Persia, Macedon, Carthage, the Ptolemies, the Seleucids, Gallic polities, Parthia, and the Sasanians.</p><a className="source-link" href="https://acoup.blog/2024/02/16/collections-phalanxs-twilight-legions-triump-part-iib-handfuls-of-maniples/">Read ACOUP on Roman equipment ↗</a></div>
        <div className="viz-card manpower-viz-v2"><div className="viz-title"><div><span>Comparative military capacity</span><h4>How much army—and how much iron?</h4></div><small>500 BCE–500 CE · 50-year estimates</small></div><MilitaryCapacityChart /><p className="viz-note"><b>Method:</b> Rome’s line estimates empire-wide forces under arms. Rival dashed lines are 50-year capacity models calibrated to surviving campaign evidence; outlined dots mark those campaign anchors. They are not annual censuses. The comparison excludes theoretical manpower pools. Iron tonnage is soldiers multiplied by a consistent equipment model; every point retains its citation keys and notes in the downloadable CSVs.</p></div>
      </section>
      <section className="coming-insights" aria-labelledby="next-insights"><div><span className="insight-number">03–05</span><h3 id="next-insights">The argument still to come</h3><p>A draft label means the page is honest about what remains. These are the next three visual claims, not empty decoration.</p></div><ol><li><b>How Rome paid for empire</b><span>Tax, tribute, grain, customs, and military pay.</span></li><li><b>Why the western court fell</b><span>Fiscal capacity, civil war, territorial loss, and external pressure.</span></li><li><b>What Rome changed</b><span>Land, labor, roads, language, law, cities, and eastern survival.</span></li></ol></section>
    </HistoryPageShell>
  );
}
