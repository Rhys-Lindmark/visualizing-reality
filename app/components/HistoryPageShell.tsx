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

export default function HistoryPageShell({ title, eyebrow, standfirst, status, progress, published, introduction, insightLabels, children, methods }: HistoryPageShellProps) {
  const insightTopic = title.startsWith('The ') ? `the ${title.slice(4)}` : title;
  return (
    <main id="top">
      <SiteHeader sectionLinks={[{ href: '#introduction', label: 'Introduction' }, { href: '#key-insights', label: 'Key Insights' }]} />
      <article>
        <section className="article-head">
          <div className="page-kicker"><p className="topic-label">{eyebrow}</p><span className={`status status-${status}`}>{status} · {progress}</span></div>
          <h1>{title}</h1>
          <p className="standfirst">{standfirst}</p>
          <p className="byline">By How Everything Evolved · First published {published}</p>
        </section>
        <div className="article-nav"><a href="#introduction">Introduction</a><a href="#key-insights">Key Insights</a></div>
        <section className="intro article-copy" id="introduction"><h2>Introduction</h2>{introduction}</section>
        <section className="insights" id="key-insights"><div className="section-heading"><h2>Key Insights on {insightTopic}</h2></div><KeyInsightsTabs labels={insightLabels}>{children}</KeyInsightsTabs></section>
        <details className="methods methods-collapsed" id="methods"><summary><span>Methods & sources</span><small>Evidence notes, definitions, and downloads</small></summary><div className="article-copy"><p className="topic-label">Evidence standard</p>{methods}</div></details>
        <SiteFooter context={`Evidence and scale about ${title}.`} />
      </article>
    </main>
  );
}
