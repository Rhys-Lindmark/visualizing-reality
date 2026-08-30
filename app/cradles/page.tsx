import type { Metadata } from 'next';
import CradlesEvidenceClocks from '../CradlesEvidenceClocks';
import EvidencePanel from '../components/EvidencePanel';
import HistoryPageShell from '../components/HistoryPageShell';

export const metadata:Metadata={
  title:'The cradles of civilization',
  description:'Compare when urban scale, political centralization, and durable notation emerged across six early regional systems—without one civilizational ranking or birthday.',
  openGraph:{title:'The cradles of civilization — How Everything Evolved',description:'Six regions, three evidence clocks, and no civilizational league table.',images:[]},
  twitter:{card:'summary',title:'The cradles of civilization — How Everything Evolved',description:'Six regions, three evidence clocks, and no civilizational league table.',images:[]},
};

const queued=[
  ['02','Ecologies were not interchangeable','Compare rivers, rainfall, crops, transport, and settlement density without reducing six landscapes to one hydraulic recipe.'],
  ['03','Technologies arrived in different orders','Compare cities, states, writing, bronze, and monuments while preserving disputed and missing clocks.'],
  ['04','Surplus had several institutional routes','Test irrigation, storage, trade, herding, and collective labor against one-cause theories of state formation.'],
  ['05','Urban systems transformed as well as collapsed','Follow persistence, dispersal, relocation, unreadable records, and later institutional inheritance.'],
] as const;

export default function CradlesPage(){return <HistoryPageShell
  title="The cradles of civilization"
  eyebrow="First cities · six regions · comparative archaeology"
  standfirst="Cities, states, and writing did not arrive as one package—or on one civilizational clock."
  status="draft"
  progress="1 of 5 insights live"
  published="August 2026"
  introduction={<><p>“The cradles of civilization” sounds like a list of places with birthdays. The evidence is less tidy. Large settlements can precede territorial states. Durable signs can appear before urban consolidation—or remain undeciphered. Administration can leave monumental architecture without a securely accepted script.</p><p>This page compares six regions frequently used in debates about independent urban and state formation: Mesopotamia, Egypt, the Indus, northern China, Mesoamerica, and the Andes. The list is a research frame, not a ranking or a claim that development stopped at six centers.</p><p>The first insight separates three questions that are often collapsed into one: when settlements reached urban scale, when archaeologists infer political centralization, and when durable notation becomes visible. Every date is a phase or attestation, not an annual observation.</p></>}
  insightHeading={<>Six regions.<br/>No single recipe.</>}
  methods={<><p>The comparison begins with Cowgill’s dimensional approach to urbanism and Spencer’s six-region territorial-expansion model, then checks each regional clock against specialist work. The shared frame is useful, but neither source turns “primary state” into an uncontested category.</p><p>Rows preserve evidence status: archaeological attestation, published synthesis, scholarly inference, contested inference, undeciphered notation, or evidence gap. Political centralization is never inferred from city size alone. The Indus row does not invent a ruling dynasty; the San Andrés row remains probable and contested; earlier Chinese signs are not promoted into secure writing; and the Andes notation lane is left undated rather than plotted at zero.</p><p>Map points locate the regional cases, not political boundaries. Timeline ranges are visual comparisons of published phases and dated contexts; they are not continuous series, confidence intervals, or measures of civilizational value.</p><EvidencePanel page="cradles"/></>}
>
  <section className="insight cradles-clock-insight"><div className="insight-copy"><span className="insight-number">01</span><p className="claim">The first cities, states, and writing systems emerged on different clocks—even within the same region.</p><h3>There was no single civilizational takeoff</h3><p>Mesopotamia and Egypt show relatively compressed sequences: urban concentration, territorial rule, and durable notation become visible within several centuries. Elsewhere the clocks separate sharply. Taosi precedes the Erlitou state model and secure Shang writing. San Andrés notation may precede Monte Albán’s regional state.</p><p>The Indus is a warning against reading institutions from monuments. Its vast planned cities and shared standards do not come with securely identified kings, royal tombs, or palaces; its sign system remains undeciphered. Complexity did not require the political forms archaeologists once expected to find.</p><p>The Andes make the strongest case for showing absence honestly. Caral’s urban and monumental concentration is early. A probable regional state clock appears much later at Virú. There is no securely accepted early script clock to plot here—and that is an evidence gap, not zero administration.</p><a className="source-link" href="https://doi.org/10.1073/pnas.1002470107">Read the six-region comparative model ↗</a></div><div className="viz-card cradles-clock-viz"><div className="viz-title"><div><span>Six regions · three evidence clocks</span><h4>What emerged—and when?</h4></div><small>4000–100 BCE · no civilization score</small></div><CradlesEvidenceClocks/><p className="viz-note"><b>Method:</b> Select a region, then select a lane. Ranges preserve archaeological phases or published syntheses. They are not annual estimates. The map shows evidence locations, not territorial boundaries or independent-invention certainty.</p></div></section>
  {queued.map(([number,title,description])=><section className="insight research-placeholder" key={number}><div><span className="insight-number">{number}</span><p className="claim">Research question</p><h3>{title}</h3><p>{description}</p></div><aside><span>Next evidence pass</span><b>Not yet visualized</b><small>Sources and inference limits will be registered before this insight becomes live.</small></aside></section>)}
</HistoryPageShell>}
