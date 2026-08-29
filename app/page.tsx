import RomanMap from './RomanMap';

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top"><span>Visualizing</span><b>Reality</b></a>
        <nav aria-label="Primary"><a href="#introduction">Introduction</a><a href="#key-insights">Key Insights</a></nav>
        <button className="search" type="button">Search</button>
      </header>

      <article>
        <section className="article-head" id="top">
          <p className="topic-label">Visualizing history</p>
          <h1>Rome</h1>
          <p className="standfirst">Rome was not inevitable. It was an evolving bargain between citizens, allies, soldiers, taxpayers, farmers, and enslaved people—held together across three continents for centuries.</p>
          <p className="byline">By Visualizing Reality · First published August 2026</p>
        </section>

        <div className="article-nav"><a href="#introduction">Introduction</a><a href="#key-insights">Key Insights</a></div>

        <section className="intro article-copy" id="introduction">
          <h2>Introduction</h2>
          <p>The Roman story is usually told as a procession of emperors and battles. That hides the machinery that made conquest possible—and the scale of what was lost when that machinery broke.</p>
          <p>This page asks five concrete questions. How did a city on the Tiber mobilize more people than its rivals? What moved food, taxes, and armies across the Mediterranean? What did ordinary production look like? Why did the western system unravel? And what, exactly, survived?</p>
          <p>Ancient evidence is incomplete. The maps and estimates below distinguish direct evidence from reconstruction, and ranges from false precision.</p>
        </section>

        <section className="insights" id="key-insights">
          <div className="section-heading"><span>Key Insights</span><h2>Five arguments about<br />how Rome worked</h2></div>
          <section className="insight">
            <div className="insight-copy"><span className="insight-number">01</span><p className="claim">Rome grew by turning defeated peoples into future capacity.</p><h3>An empire assembled over 500 years</h3><p>Territory is the visible result. Underneath it was a changing political system: a citizen republic, an Italian federation, a Mediterranean empire, a tetrarchy, and finally two imperial states.</p><p>Move through time to see expansion, administrative reinvention, and the survival of the East after the western court disappeared.</p></div>
            <RomanMap />
          </section>

          <section className="insight">
            <div className="insight-copy"><span className="insight-number">02</span><p className="claim">Rome did not win because it discovered a secret weapon.</p><h3>Rome’s advantage was people, not iron</h3><p>Chainmail, shields, spears, and disciplined infantry existed beyond Rome. The deeper advantage was institutional: Rome incorporated conquered Italians as <em>socii</em>, allies who supplied a little more than half of a typical Republican army.</p><p>Each legion arrived with a matching allied formation. Defeat destroyed an army; it did not exhaust the coalition that could raise the next one.</p><a className="source-link" href="https://acoup.blog/2024/07/19/collections-teaching-paradox-imperator-part-i-divisa-in-partes-tres/">Read the ACOUP argument ↗</a></div>
            <div className="viz-card manpower-viz">
              <div className="viz-title"><div><span>Typical Roman field army</span><h4>More than half was not Roman</h4></div><small>Middle Republic · schematic</small></div>
              <div className="army-stack"><div className="citizens"><b>≈45%</b><span>Roman citizens</span></div><div className="allies"><b>≈55%</b><span>Italian allies · socii</span></div></div>
              <div className="army-pairs"><div><span>Legion</span><i>+</i><span>Allied ala</span></div><div><span>Legion</span><i>+</i><span>Allied ala</span></div></div>
              <div className="not-iron"><span>Weapons</span><div><i style={{width:'78%'}} /> broadly comparable</div><span>Mobilization</span><div><i className="red" style={{width:'100%'}} /> unusually scalable</div></div>
              <p className="viz-note"><b>Interpretation:</b> integrated combined arms mattered, but Rome’s repeatable coalition manpower turned battlefield losses into recoverable setbacks.</p>
            </div>
          </section>

          <section className="insight">
            <div className="insight-copy"><span className="insight-number">03</span><p className="claim">The Mediterranean—not the road—was Rome’s cheapest highway.</p><h3>Water made the empire economically possible</h3><p>Roads moved officials, messages, and armies inland. But bulk food moved by water. Late Roman price evidence suggests sea transport cost roughly one-twentieth as much as road transport.</p><p>That is why grain from Carthage could reach Rome more cheaply than grain from parts of Italy, and why control of ports and sea lanes mattered as much as paved roads.</p><a className="source-link" href="https://acoup.blog/2020/08/21/collections-bread-how-did-they-make-it-part-iv-markets-and-non-farmers/">Read the ACOUP argument ↗</a></div>
            <div className="viz-card transport-viz">
              <div className="viz-title"><div><span>Relative cost of bulk transport</span><h4>One sea-mile was not one road-mile</h4></div><small>Diocletian’s Price Edict · inferred ratio</small></div>
              <div className="transport-bars"><div><span>Road</span><i style={{width:'100%'}} /><b>20</b></div><div><span>River</span><i style={{width:'20%'}} /><b>4</b></div><div><span>Sea</span><i className="sea" style={{width:'5%'}} /><b>1</b></div></div>
              <div className="grain-flow"><div><b>North Africa</b><span>grain</span></div><div><b>Egypt</b><span>grain</span></div><div><b>Sicily</b><span>grain</span></div><i>→</i><div className="rome-node"><b>ROME</b><span>~1m people</span></div></div>
              <div className="grain-stat"><strong>630</strong><span>tons of grain per day through the sailing season for the free distribution alone—probably less than one-third of the city’s need.</span></div>
              <p className="viz-note">Ratios are reconstructions, not freight receipts. Weather, direction, cargo, route, and security changed actual costs.</p>
            </div>
          </section>

          <section className="insight">
            <div className="insight-copy"><span className="insight-number">04</span><p className="claim">Rome was a slave society—but most of its countryside was not a plantation.</p><h3>The empire stood on small farms</h3><p>Enslaved labor was fundamental and highly visible, especially in elite households and some commercial estates. Yet the best reconstruction for Italy under Augustus puts enslaved people around 15–20% of the population, not a majority.</p><p>Free smallholders and tenants remained central. A normal family farm was often only a few acres: enough to survive, rarely enough to feel secure.</p><a className="source-link" href="https://acoup.blog/2023/12/22/collections-how-many-people-ancient-demography/">Read the ACOUP argument ↗</a></div>
            <div className="viz-card farm-viz">
              <div className="viz-title"><div><span>Roman Italy under Augustus</span><h4>A society of unequal households</h4></div><small>Very rough estimates</small></div>
              <div className="people-farms">
                <div className="donut-wrap"><div className="donut"><span><b>15–20%</b>enslaved</span></div><div className="legend"><span><i /> Free</span><span><i /> Enslaved</span></div></div>
                <div className="farm-plot"><div>{Array.from({length:40},(_,i)=><i key={i} className={i<7?'field':''} />)}</div><b>3–5 acres</b><span>typical small farm</span><p>≈200 modii of grain needed each year for a family of five</p></div>
              </div>
              <p className="viz-note"><b>Uncertainty matters:</b> the 15–20% estimate applies to Italy near the Augustan peak, not uniformly to every province or century.</p>
            </div>
          </section>

          <section className="insight final-insight">
            <div className="insight-copy"><span className="insight-number">05</span><p className="claim">The West did not fall from “bread and circuses.” It lost the capacity to reproduce the Roman system.</p><h3>What fell was the machine. What survived was the code.</h3><p>A weaker economy faced larger armies, heavier administration, civil conflict, and repeated frontier shocks. Losing territory then meant losing taxes; losing taxes meant fewer reliable soldiers; fewer soldiers meant losing more territory.</p><p>No western successor could fund the same professional army, tax administration, public peace, or interregional trade. Yet Latin, Roman law, Christianity, roads, and the eastern empire endured.</p><a className="source-link" href="https://acoup.blog/2021/07/30/collections-the-queens-latin-or-who-were-the-romans-part-v-saving-and-losing-an-empire/">Read the ACOUP argument ↗</a></div>
            <div className="viz-card fall-viz">
              <div className="viz-title"><div><span>State capacity in the West</span><h4>A self-reinforcing fiscal retreat</h4></div><small>3rd–5th centuries CE</small></div>
              <div className="capacity-loop"><div>Weaker<br/>tax base</div><b>→</b><div>Cheaper, less<br/>integrated forces</div><b>→</b><div>Territory<br/>lost</div><b>↘</b></div>
              <div className="army-size"><span>Estimated army size</span><div><b>Early Empire</b><i><em style={{width:'68%'}} /></i><strong>300–350k</strong></div><div><b>Late Empire</b><i><em className="red" style={{width:'92%'}} /></i><strong>400–500k</strong></div></div>
              <div className="survival"><div className="survived"><span>Survived or transformed</span><b>Latin languages</b><b>Roman law</b><b>The institutional Church</b><b>Eastern Roman Empire</b></div><div className="lost"><span>Collapsed in the West</span><b>Fiscal scale</b><b>Professional army</b><b>Urban networks</b><b>Mass trade in common goods</b></div></div>
              <p className="viz-note">476 is a useful political marker, not an on/off switch. The East remained Roman until 1453; western material decline was regional and unfolded across generations.</p>
            </div>
          </section>
        </section>
        <footer><b>Visualizing Reality</b><span>Evidence, argument, and uncertainty about Rome.</span><a href="#top">Back to top ↑</a></footer>
      </article>
    </main>
  );
}
