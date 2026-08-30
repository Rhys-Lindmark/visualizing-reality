import type { ReactNode } from 'react';
import SiteFooter from './SiteFooter';
import SiteHeader from './SiteHeader';

type HistoryPageShellProps = {
  title: string;
  eyebrow: string;
  standfirst: string;
  status: 'research' | 'draft' | 'reviewed';
  progress: string;
  published: string;
  introduction: ReactNode;
  insightHeading: ReactNode;
  children: ReactNode;
  methods: ReactNode;
};

export default function HistoryPageShell({ title, eyebrow, standfirst, status, progress, published, introduction, insightHeading, children, methods }: HistoryPageShellProps) {
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
        <div className="article-nav"><a href="#introduction">Introduction</a><a href="#key-insights">Key Insights</a><a href="#methods">Methods & sources</a></div>
        <section className="intro article-copy" id="introduction"><h2>Introduction</h2>{introduction}</section>
        <section className="insights" id="key-insights"><div className="section-heading"><span>Key Insights</span><h2>{insightHeading}</h2></div>{children}</section>
        <section className="methods article-copy" id="methods"><p className="topic-label">Evidence standard</p><h2>Methods & sources</h2>{methods}</section>
        <SiteFooter context={`Evidence and scale about ${title}.`} />
      </article>
    </main>
  );
}
