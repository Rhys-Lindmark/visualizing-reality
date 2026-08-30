/* eslint-disable @next/next/no-html-link-for-pages */

type SiteHeaderProps = {
  sectionLinks?: Array<{ href: string; label: string }>;
};

export default function SiteHeader({ sectionLinks = [] }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="/"><span>How Everything</span><b>Evolved</b></a>
      <nav aria-label="Primary">
        <a href="/">Atlas</a>
        {sectionLinks.map(link => <a href={link.href} key={link.href}>{link.label}</a>)}
      </nav>
      <a className="search" href="/#atlas">Explore topics</a>
    </header>
  );
}
