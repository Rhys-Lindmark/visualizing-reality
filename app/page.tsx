import RomanMap from './RomanMap';

const opponents = [
  { name: 'Gallic coalition', sub: 'Telamon · 225 BCE', value: '70k', width: '9.1%' },
  { name: 'Hannibal’s army', sub: 'Cannae · 216 BCE', value: '≈50k', width: '6.5%' },
  { name: 'Parthian field force', sub: 'Carrhae · 53 BCE', value: '≈10k', width: '1.3%' },
];

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
          <p className="standfirst">A city on the Tiber became the largest empire Europe had yet seen—and remained a Mediterranean superstate for centuries.</p>
          <p className="byline">By Visualizing Reality · First published August 2026</p>
        </section>

        <div className="article-nav"><a href="#introduction">Introduction</a><a href="#key-insights">Key Insights</a></div>

        <section className="intro article-copy" id="introduction">
          <h2>Introduction</h2>
          <p>Rome’s history is almost a millennium of expansion, consolidation, division, and survival. Seeing the whole arc matters: the Republic’s Italian coalition, the Mediterranean empire, the Tetrarchy’s four courts, the loss of the western provinces, and the Roman state that continued in the East.</p>
          <p>We begin with two basic questions. Where was Rome, and how did that territory change? Then: how could it keep raising armies after defeats that would have ended most ancient states?</p>
          <p>Ancient numbers are fragmentary. Every chart below distinguishes a registered military pool, soldiers actually under arms, and the size of one army in one campaign.</p>
        </section>

        <section className="insights" id="key-insights">
          <div className="section-heading"><span>Key Insights</span><h2>First, see the empire.<br />Then, see its advantage.</h2></div>

          <section className="insight map-insight">
            <div className="insight-copy"><span className="insight-number">01</span><p className="claim">Rome became the largest empire Europe had ever known.</p><h3>From one city to three continents</h3><p>Press play to follow more than nine centuries of Roman political geography. The map begins with a small state in central Italy, reaches its greatest extent under Trajan, then changes meaning: one empire with four courts, two imperial administrations, and finally an eastern empire without a western emperor.</p><p>The important change is not only size. Watch the political form change while the Roman name endures.</p></div>
            <RomanMap />
          </section>

          <section className="insight manpower-insight">
            <div className="insight-copy"><span className="insight-number">02</span><p className="claim">Rome’s decisive weapon was the army it could raise after the army it had just lost.</p><h3>Why Rome won: manpower × staying power</h3><p>Iron and chainmail mattered, but neither was uniquely Roman. The exceptional thing was the federation behind the legion: citizens plus Italian allies, organized to supply repeated armies.</p><p>In 225 BCE, Polybius recorded more than 700,000 infantry and almost 70,000 cavalry liable for service across Rome and its allies. That was not one field army. It was the reservoir behind the field armies.</p><a className="source-link" href="https://acoup.blog/2023/10/20/collections-how-to-roman-republic-101-addenda-the-socii/">Read ACOUP on Rome’s allies ↗</a></div>
            <div className="viz-card manpower-viz-v2">
              <div className="viz-title"><div><span>Military capacity of the Roman system</span><h4>The replacement pool was the advantage</h4></div><small>People · selected dates · estimates</small></div>

              <div className="pool-chart">
                <div className="pool-axis"><span>0</span><span>200k</span><span>400k</span><span>600k</span><span>800k</span></div>
                <div className="pool-row primary"><div className="pool-label"><b>Roman–Italian liable pool</b><span>225 BCE · census</span></div><div className="bar-track"><i style={{width:'96%'}}><strong>≈770k</strong></i></div></div>
                <div className="pool-row deployed"><div className="pool-label"><b>Rome: deployed + reserve</b><span>225 BCE · that crisis</span></div><div className="bar-track"><i style={{width:'15%'}}><strong>≈120k</strong></i></div></div>
                <div className="pool-divider"><span>Opponent armies in a single campaign</span></div>
                {opponents.map((item) => <div className="pool-row opponent" key={item.name}><div className="pool-label"><b>{item.name}</b><span>{item.sub}</span></div><div className="bar-track"><i style={{width:item.width}}><strong>{item.value}</strong></i></div></div>)}
              </div>

              <div className="capacity-equation"><div><span>Mobilizable people</span><b>large citizen–allied pool</b></div><i>×</i><div><span>Power per soldier</span><b>training + equipment + organization</b></div><i>=</i><div className="result"><span>Staying power</span><b>another army after defeat</b></div></div>

              <div className="regime-chart">
                <div className="regime-head"><span>Rome’s military system over time</span><b>Not one continuous measure: the institution changes</b></div>
                <div className="regime-line"><i /><i /><i /><i /></div>
                <div className="regime-points">
                  <div><b>225 BCE</b><strong>≈770k</strong><span>liable coalition pool</span></div>
                  <div><b>212 BCE</b><strong>25 legions</strong><span>in service at wartime peak</span></div>
                  <div><b>14 CE</b><strong>≈250k</strong><span>standing army + auxiliaries</span></div>
                  <div><b>c. 300 CE</b><strong>≈400–500k</strong><span>larger late imperial army</span></div>
                </div>
              </div>

              <p className="viz-note"><b>Read the denominator.</b> The 770,000 figure is a census-based pool of men liable for service, not an army assembled in one place. The opponent bars are campaign armies, not every person their societies could theoretically mobilize. Ancient totals are debated and rounded.</p>
            </div>
          </section>
        </section>

        <footer><b>Visualizing Reality</b><span>Evidence, scale, and uncertainty about Rome.</span><a href="#top">Back to top ↑</a></footer>
      </article>
    </main>
  );
}
