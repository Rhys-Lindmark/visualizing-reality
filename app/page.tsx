const eras = [
  { year: '70 BCE', value: 58 }, { year: '14 CE', value: 72 },
  { year: '150 CE', value: 88 }, { year: '235 CE', value: 77 },
  { year: '300 CE', value: 62 },
];

const topics = [
  ['Public finance', '42 datasets', 'Roman taxation'],
  ['Population', '118 datasets', 'Cities through time'],
  ['Health', '76 datasets', 'Life expectancy'],
  ['Energy', '54 datasets', 'Work & power'],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Quantifying Reality home"><span className="mark">QR</span><span>Quantifying Reality</span></a>
        <nav aria-label="Primary navigation"><a href="#explore">Explore</a><a href="#methods">Methods</a><a href="#about">About</a></nav>
        <button className="search-button" type="button">⌕ <span>Search the evidence</span></button>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span /> A public atlas of measurable history</div>
        <h1>Everything we can know,<br /><em>made comparable.</em></h1>
        <p className="lede">Data about how humans have lived, governed, built, traded, fought, and flourished—from the first cities to this morning.</p>
        <div className="hero-actions"><a className="primary-button" href="#featured">Explore the atlas <span>→</span></a><a className="text-link" href="#methods">How we handle uncertainty</a></div>
        <div className="scope-line" aria-label="Atlas scope"><span><b>290+</b> topics</span><span><b>12,400</b> observations</span><span><b>5,000</b> years</span><span><b>1</b> shared method</span></div>
      </section>

      <section className="featured" id="featured">
        <div className="section-kicker">Featured investigation <span>01</span></div>
        <div className="feature-grid">
          <div className="feature-copy">
            <p className="category">States & institutions · 70 BCE–300 CE</p>
            <h2>How much money did Rome make?</h2>
            <p>The Roman state taxed land, people, inheritances, trade, and conquered provinces. But its accounts did not survive. Reconstructing its revenue means combining scattered texts, inscriptions, coins, population estimates, and prices.</p>
            <div className="estimate-card"><span>Working reconstruction, c. 150 CE</span><strong>≈ 1bn <small>sesterces / year</small></strong><div className="range"><i /><span>wide uncertainty · no imperial budget survives</span></div></div>
            <a className="primary-button dark" href="#methods">Open investigation <span>↗</span></a>
          </div>

          <div className="chart-card" aria-label="Estimated Roman state revenue chart">
            <div className="chart-head"><div><span>Roman state revenue · prototype</span><b>Illustrative index, 150 CE = 100</b></div><span className="confidence"><i /> Uncertainty</span></div>
            <div className="chart-area">
              <div className="axis-label">100</div><div className="axis-line top" /><div className="axis-label mid-label">50</div><div className="axis-line mid" />
              <div className="uncertainty-band" /><div className="trend-segment s1" /><div className="trend-segment s2" /><div className="trend-segment s3" /><div className="trend-segment s4" />
              {eras.map((era, index) => <div className={`point p${index + 1}`} key={era.year}><i /><span>{era.value}</span></div>)}
              <div className="event-marker"><span>165–180 CE</span><b>Antonine plague</b></div>
            </div>
            <div className="chart-years">{eras.map((era) => <span key={era.year}>{era.year}</span>)}</div>
            <p className="chart-note">Prototype data for interface design—not a published series. No aggregate Roman budget survives. The scale is anchored to scholarship placing total output near 20bn sestertii and government extraction around 5%; every final observation will carry a source, model, and confidence grade.</p>
          </div>
        </div>
      </section>

      <section className="explore" id="explore">
        <div className="section-kicker">Explore the atlas <span>02</span></div>
        <div className="topic-grid">{topics.map(([name, count, example], i) => <a href="#featured" className="topic" key={name}><span className="topic-number">0{i + 1}</span><h3>{name}</h3><p>{example}</p><small>{count}</small><b>→</b></a>)}</div>
      </section>

      <section className="method" id="methods">
        <div><div className="section-kicker light">The method <span>03</span></div><h2>Numbers should reveal<br />what we know—and <em>don’t.</em></h2></div>
        <div className="principles"><p><span>01</span><b>Show the chain of evidence.</b> Every number links to its sources, assumptions, and transformations.</p><p><span>02</span><b>Make uncertainty visible.</b> Ranges and confidence grades are first-class data, never footnotes.</p><p><span>03</span><b>Compare carefully.</b> Units, definitions, territory, and purchasing power travel with the chart.</p></div>
      </section>
      <footer id="about"><span>Quantifying Reality</span><p>A beginning: the measurable record of human civilization.</p><a href="#top">Back to top ↑</a></footer>
    </main>
  );
}
