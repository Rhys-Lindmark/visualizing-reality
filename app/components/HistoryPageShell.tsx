import type { ReactNode } from 'react';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';
import KeyInsightsTabs from './KeyInsightsTabs';

type HistoryPageShellProps = {
  title: string;
  eyebrow: string;
  standfirst: string;
  status: 'research' | 'draft' | 'reviewed';
  progress: string;
  published: string;
  introduction: ReactNode;
  insightLabels: string[];
  children: ReactNode;
  methods: ReactNode;
};

const relatedByTitle:Record<string,Array<{href:string;label:string}>>={
  'Rome':[{href:'/iron-age',label:'The Iron Age transformation'},{href:'/persia',label:'Persia and territorial empire'},{href:'/qin-han',label:'Qin and Han China'}],
  'Uruk and the first states':[{href:'/cradles',label:'The cradles of civilization'},{href:'/bronze-age',label:'The Bronze Age world system'}],
  'The cradles of civilization':[{href:'/uruk',label:'Uruk and the first states'},{href:'/bronze-age',label:'The Bronze Age world system'},{href:'/qin-han',label:'Qin and Han China'}],
  'The Bronze Age world system':[{href:'/cradles',label:'The cradles of civilization'},{href:'/iron-age',label:'The Iron Age transformation'},{href:'/persia',label:'Persia and territorial empire'}],
  'The Iron Age transformation':[{href:'/bronze-age',label:'The Bronze Age world system'},{href:'/persia',label:'Persia and territorial empire'},{href:'/rome',label:'Rome'}],
  'Persia and territorial empire':[{href:'/iron-age',label:'The Iron Age transformation'},{href:'/rome',label:'Rome'},{href:'/india',label:'India from cities to empires'}],
  'Qin and Han China':[{href:'/persia',label:'Persia and territorial empire'},{href:'/india',label:'India from cities to empires'},{href:'/cradles',label:'The cradles of civilization'}],
  'India from cities to empires':[{href:'/cradles',label:'The cradles of civilization'},{href:'/persia',label:'Persia and territorial empire'},{href:'/qin-han',label:'Qin and Han China'}],
  'The Steppe':[{href:'/iron-age',label:'The Iron Age transformation'},{href:'/qin-han',label:'Qin and Han China'},{href:'/caliphates',label:'The Caliphates'}],
  'Christianity':[{href:'/rome',label:'Rome'},{href:'/caliphates',label:'The Caliphates'},{href:'/persia',label:'Persia and territorial empire'}],
  'The Caliphates':[{href:'/christianity',label:'Christianity'},{href:'/persia',label:'Persia and territorial empire'},{href:'/steppe',label:'The Steppe'}],
  'Greek City-States':[{href:'/persia',label:'Persia and territorial empire'},{href:'/rome',label:'Rome'},{href:'/hellenistic-kingdoms',label:'Hellenistic Kingdoms'}],
  'Hellenistic Kingdoms':[{href:'/greek-city-states',label:'Greek City-States'},{href:'/persia',label:'Persia and territorial empire'},{href:'/rome',label:'Rome'}],
  'Silk Roads':[{href:'/steppe',label:'The Steppe'},{href:'/qin-han',label:'Qin and Han China'},{href:'/caliphates',label:'The Caliphates'}],
  'Medieval Europe':[{href:'/christianity',label:'Christianity'},{href:'/rome',label:'Rome'},{href:'/caliphates',label:'The Caliphates'}],
  'African States and Trade':[{href:'/caliphates',label:'The Caliphates'},{href:'/silk-roads',label:'Silk Roads'},{href:'/southeast-asia',label:'Southeast Asian Mandalas'}],
  'Southeast Asian Mandalas':[{href:'/silk-roads',label:'Silk Roads'},{href:'/india',label:'India from cities to empires'},{href:'/qin-han',label:'Qin and Han China'}],
  'Mesoamerican Cities and States':[{href:'/cradles',label:'The cradles of civilization'},{href:'/andes',label:'Andean Worlds and the Inka'}],
  'Andean Worlds and the Inka':[{href:'/mesoamerica',label:'Mesoamerican Cities and States'},{href:'/cradles',label:'The cradles of civilization'}],
  'Mongol Eurasia':[{href:'/steppe',label:'The Steppe'},{href:'/silk-roads',label:'Silk Roads'},{href:'/qin-han',label:'Qin and Han China'}],
};

export default function HistoryPageShell({ title, published, introduction, insightLabels, children, methods }: HistoryPageShellProps) {
  const insightTopic = title.startsWith('The ') ? `the ${title.slice(4)}` : title;
  const related=relatedByTitle[title]??[];
  return (
    <main id="top">
      <SiteHeader sectionLinks={[{ href: '#introduction', label: 'Introduction' }, { href: '#key-insights', label: 'Key Insights' }]} />
      <article>
        <section className="article-head">
          <h1>{title}</h1>
          <p className="byline">By How Everything Evolved · First published {published}</p>
        </section>
        <div className="article-nav"><a href="#introduction">Introduction</a><a href="#key-insights">Key Insights</a></div>
        <section className="intro article-copy" id="introduction"><div className="intro-text">{introduction}</div>{related.length>0&&<aside className="related-topics"><span>Related topics</span>{related.map(topic=><a key={topic.href} href={topic.href}>{topic.label}<b aria-hidden="true">→</b></a>)}</aside>}</section>
        <section className="insights" id="key-insights"><div className="section-heading"><h2>Key Insights on {insightTopic}</h2></div><KeyInsightsTabs labels={insightLabels}>{children}</KeyInsightsTabs></section>
        <details className="methods methods-collapsed" id="methods"><summary><span>Methods & sources</span><small>Evidence notes, definitions, and downloads</small></summary><div className="article-copy"><p className="topic-label">Evidence standard</p>{methods}</div></details>
        <SiteFooter context={`Evidence and scale about ${title}.`} />
      </article>
    </main>
  );
}
