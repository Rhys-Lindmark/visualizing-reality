type SiteFooterProps = { context: string };

export default function SiteFooter({ context }: SiteFooterProps) {
  return <footer><b>How Everything Evolved</b><span>{context}</span><a href="#top">Back to top ↑</a></footer>;
}
