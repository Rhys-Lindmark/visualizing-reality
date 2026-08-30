import RomanMap from './RomanMap';
import MilitaryCapacityChart from './MilitaryCapacityChart';

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
            <div className="insight-copy"><span className="insight-number">02</span><p className="claim">Rome combined more soldiers with more metal per soldier.</p><h3>Why Rome won: manpower × iron</h3><p>The graph estimates soldiers actually under arms—not every man theoretically liable for service—and multiplies that force by a modeled average iron load per soldier.</p><p>Rome’s advantage was multiplicative. Its Italian federation could sustain unusually large armies, while its heavy infantry increasingly carried expensive mail, substantial helmets, swords, and iron-intensive pila. ACOUP estimates Roman kit contained about 25% more worked metal than its nearest competitor.</p><p>This is a model, not a recovered ancient statistic. Move across the graph to inspect its assumptions and uncertainty.</p><a className="source-link" href="https://acoup.blog/2024/02/16/collections-phalanxs-twilight-legions-triump-part-iib-handfuls-of-maniples/">Read ACOUP on Roman equipment ↗</a></div>
            <div className="viz-card manpower-viz-v2">
              <div className="viz-title"><div><span>Military capacity of the Roman system</span><h4>How much army—and how much iron?</h4></div><small>500 BCE–500 CE · modeled estimates</small></div>
              <MilitaryCapacityChart />
              <p className="viz-note"><b>Method:</b> blue values reconstruct soldiers under arms or paper establishment from ancient unit counts and modern scholarship. Red values multiply the midpoint by modeled kilograms of worked iron carried per soldier. The downloadable CSV preserves low/high ranges, estimate type, citation keys, and notes for every point.</p>
            </div>
          </section>
        </section>

        <footer><b>Visualizing Reality</b><span>Evidence, scale, and uncertainty about Rome.</span><a href="#top">Back to top ↑</a></footer>
      </article>
    </main>
  );
}
