import AtlasExplorer from './AtlasExplorer';
import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';

const eras=[['Before states','10,000–3500 BCE','Fire · plants · animals · villages'],['First cities','3500–1200 BCE','Water · grain · writing · bronze'],['Iron & empire','1200 BCE–500 CE','Metal · money · armies · administration'],['Connected worlds','500–1750 CE','Belief · trade · steppe · ocean']];

export default function Home(){
  return <main id="top" className="home-page">
    <SiteHeader sectionLinks={[{href:'#thesis',label:'Thesis'},{href:'#atlas',label:'Atlas'}]} />
    <section className="home-hero">
      <div className="home-title"><p className="topic-label">A visual atlas of pre-industrial history</p><h1>How Everything<br/><em>Evolved</em></h1></div>
      <div className="home-intro"><p>Our World in Data made the modern world legible. This project attempts the same thing for everything that came before it.</p><a href="#atlas">Explore the atlas ↓</a></div>
      <div className="era-ruler" aria-label="Timeline of the atlas">{eras.map(([name,years,systems],index)=><div key={name} className={`era-block era-${index}`}><i/><b>{name}</b><span>{years}</span><small>{systems}</small></div>)}</div>
    </section>
    <section className="thesis" id="thesis"><div><p className="topic-label">Our working thesis</p><h2>History is a sequence of domestications.</h2></div><div className="thesis-copy"><p>Humans domesticated fire, landscapes, water, plants, animals, metal, labor, information, belief, violence—and one another. Each system expanded what societies could coordinate. Each also created new dependencies and new ways to fail.</p><p>This is not a neutral encyclopedia. It is a source-traceable argument told through maps, timelines, models, and comparisons. Where the evidence is fragmentary, the uncertainty belongs in the explanation.</p></div><div className="domestication-chain" aria-label="Systems in the project"><span>ecology</span><b>→</b><span>surplus</span><b>→</b><span>legibility</span><b>→</b><span>coordination</span><b>→</b><span>power</span></div></section>
    <AtlasExplorer />
    <section className="editorial-standard"><p className="topic-label">The publishing standard</p><h2>Five ideas.<br/>Five visuals.<br/>Sources you can inspect.</h2><ol><li><b>Opinionated</b><span>Every page makes a coherent argument.</span></li><li><b>Visual first</b><span>The graphic must teach, not decorate.</span></li><li><b>Quantitatively honest</b><span>Observations, models, and unknowns stay distinct.</span></li><li><b>Historically plural</b><span>Competing explanations remain visible.</span></li><li><b>Continuously revised</b><span>Drafts improve as evidence and criticism arrive.</span></li></ol></section>
    <SiteFooter context="An opinionated, visual history of the pre-industrial world." />
  </main>;
}
