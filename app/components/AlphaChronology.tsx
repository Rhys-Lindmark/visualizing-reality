export type AlphaChronologyEvent={year:number;displayYear:string;label:string;detail:string;kind:string};

export default function AlphaChronology({title,subtitle,events}:{title:string;subtitle:string;events:AlphaChronologyEvent[]}){
  return <section className="alpha-chronology" aria-label={title}>
    <header><div><span>{subtitle}</span><h5>{title}</h5></div><small>{events.length} source-bounded observations</small></header>
    <div className="alpha-chronology-events">{events.map(event=><article key={`${event.year}-${event.label}`}><i/><span>{event.displayYear}</span><b>{event.label}</b><p>{event.detail}</p><small>{event.kind}</small></article>)}</div>
  </section>;
}
