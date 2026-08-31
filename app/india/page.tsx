import type { Metadata } from 'next';
import ChartFooter from '../components/ChartFooter';
import EvidencePanel from '../components/EvidencePanel';
import HistoryPageShell from '../components/HistoryPageShell';
import IndusMetrology from '../IndusMetrology';

export const metadata:Metadata={title:'India from cities to empires',description:'Five visual arguments about Indus coordination, monsoon ecologies, urban revival, Mauryan rule, and networks that outlasted states.',openGraph:{title:'India from cities to empires — How Everything Evolved',description:'The Indus coordinated cities without monumentalizing rulers.',images:[]},twitter:{card:'summary',title:'India from cities to empires — How Everything Evolved',description:'Published weights and the archaeology of power in the Indus cities.',images:[]}};

const labels=[
  'Indus cities coordinated without monumentalizing rulers',
  'Monsoon diversity kept one political rhythm from fitting all India',
  'Iron Age cities grew with coins, roads, and competing states',
  'Mauryan rule was strongest in cores and thinner at frontiers',
  'Religions and trade traveled farther than Indian empires',
];

function PendingInsight({number,title,question}:{number:string;title:string;question:string}){return <section className="insight insight-placeholder"><div className="insight-copy"><span className="insight-number">{number}</span><h3>{title}</h3><p>{question}</p><i className="status status-research">Evidence review in progress</i></div></section>;}

export default function IndiaPage(){return <HistoryPageShell
  title="India from cities to empires"
  eyebrow="2600 BCE–550 CE · cities · ecology · empire · networks"
  standfirst="South Asia repeatedly coordinated across distance without one enduring political center."
  status="draft"
  progress="1 of 5 insights live"
  published="August 2026"
  introduction={<><p>South Asian history did not move from one civilization to one empire. The Indus cities coordinated measurements, objects, and urban systems across great distances; later political and economic centers emerged in different ecological zones; Mauryan rulers joined many of those worlds without governing every region in the same way.</p><p>The five arguments on this page ask what made coordination possible when political borders were unstable or invisible. The first begins with a striking Indus combination: a shared system of small stone weights and no securely identified tradition of palaces, royal tombs, great temples, or monuments centered on named rulers.</p><p>That combination does not prove that the Indus had no rulers. It shows that complex urban coordination did not require rulers to advertise themselves in the same monumental forms seen in several contemporary states.</p></>}
  insightLabels={labels}
  methods={<><p>The weight comparison transcribes J. Mark Kenoyer&apos;s Table 9.3, which republishes means and sample sizes from the Harappa Archaeological Research Project, M. S. Vats&apos;s Harappa excavations, and E. J. H. Mackay&apos;s Mohenjo-daro excavations. Each plotted point divides a published series mean by its category ratio. The vertical reference is 0.857 grams, Hemmy&apos;s fitted unit in the official 1931 Mohenjo-daro report.</p><p>The chart preserves the high-ratio HARP deviation instead of removing it. Sample sizes vary from one to ninety-four; the points therefore are not equally precise. The weights were generally small and should not be treated as evidence for bulk-grain markets, one price system, or universal everyday exchange.</p><p>Adam Green&apos;s peer-reviewed review anchors the absence panel. “No clear identification” means that a century of excavation has not securely identified palaces, elaborate royal tombs, large temples, or ruler-aggrandizing monuments. It does not prove that the Indus lacked rulers, elites, inequality, ritual institutions, or coercion. The undeciphered script sharply limits claims about office, taxation, law, and political scale.</p><EvidencePanel page="india"/></>}
>
  <section className="insight india-metrology-insight"><div className="insight-copy"><span className="insight-number">01</span><p className="claim">Harappa and Mohenjo-daro shared a carefully graduated weight system, yet their cities did not center visible palaces, royal tombs, or monuments to named rulers.</p><h3>{labels[0]}</h3><p>In the published weight series, classes from one to 160 units repeatedly imply a small base close to 0.857 grams. Hemmy&apos;s excavation report found the Harappa and Mohenjo-daro systems effectively identical despite roughly 500 miles between the cities.</p><p>That precision is evidence for shared conventions, not automatically for one king or one state. The weights have no written value marks, the script remains undeciphered, and newer scholarship finds no securely identified palace, royal tomb, large temple, or ruler-aggrandizing monument.</p><p>The result is more interesting than “mysterious standardization.” Indus institutions coordinated people who could recognize the same material rules while political authority remained comparatively quiet in the surviving monumental record.</p></div><div className="viz-card india-metrology-viz"><div className="viz-title"><div><span>Published weights + archaeological absence</span><h4>{labels[0]}</h4></div><small>c. 2600–1900 BCE · three excavation series</small></div><IndusMetrology/><ChartFooter source="Kenoyer (2010), Table 9.3; Hemmy in Marshall (1931); Green (2021)" note="Dots are published series means divided by their category ratios. Shared metrology does not identify one ruler or state; missing monumental signals do not prove that elites were absent." dataHref="/data/india/20260831-metrology1/indus-weight-series.csv"/></div></section>
  <PendingInsight number="02" title={labels[1]} question="Which regional combinations of winter crops, summer crops, rainfall, rivers, and irrigation produced different settlement and state rhythms—and which comparisons can be quantified without turning monsoon ecology into destiny?"/>
  <PendingInsight number="03" title={labels[2]} question="What changed when dense settlements, punch-marked coinage, fortified centers, and territorial states reappeared in the first millennium BCE, and which indicators actually moved together?"/>
  <PendingInsight number="04" title={labels[3]} question="How far can Ashokan inscriptions, provincial centers, roads, and administrative texts distinguish heavily governed cores from negotiated or thinly controlled frontiers?"/>
  <PendingInsight number="05" title={labels[4]} question="Which Buddhist, Jain, Brahmanical, mercantile, and maritime networks crossed political boundaries, and what evidence can show their reach without treating culture as one continuous empire?"/>
</HistoryPageShell>}
