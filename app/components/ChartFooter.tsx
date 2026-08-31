type ChartFooterProps = {
  source: string;
  note: string;
  dataHref?: string;
};

export default function ChartFooter({ source, note, dataHref }: ChartFooterProps) {
  return (
    <div className="owid-chart-footer">
      <div className="owid-chart-credit">
        <p><b>Data source:</b> {source} — <a href="#methods">Learn more about this data</a></p>
        <p>How Everything Evolved | <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
      </div>
      <p className="owid-chart-note"><b>Note:</b> {note}</p>
      {dataHref && <a className="owid-chart-download" href={dataHref} download>Download data ↓</a>}
    </div>
  );
}
