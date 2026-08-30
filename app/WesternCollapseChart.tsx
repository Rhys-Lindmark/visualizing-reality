'use client';

import { useEffect, useState } from 'react';

type CollapseEvent = {
  year:number;
  display_year:string;
  event_type:string;
  event:string;
  what_changed:string;
  mechanism:string;
  source_keys:string;
  notes:string;
};
type FiscalEquivalent = {
  region_group:string;
  loss_status:string;
  infantry_equivalent:number;
  cavalry_equivalent:number;
  cavalry_relation:string;
  infantry_cost_solidi:number;
  cavalry_cost_solidi:number;
  evidence_type:string;
  source_keys:string;
  notes:string;
};

const DATA_REVISION='20260829-collapse1';
const versioned=(path:string)=>`${path}?v=${DATA_REVISION}`;
const eventColors:Record<string,string>={
  'political division':'#204c74',
  'external pressure':'#bd1f2e',
  'civil war':'#7b3158',
  'capital shock':'#d0782f',
  'fiscal workaround':'#718b68',
  'territorial loss':'#8f1d2c',
  'territorial settlement':'#9b6241',
  'fiscal evidence':'#d6a34a',
  'failed recovery':'#516873',
  'political ending':'#172e45',
};

function parseCSV(text:string):Record<string,string>[] {
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const character=text[index];if(character==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(character==='"')quoted=!quoted;else if(character===','&&!quoted){row.push(cell);cell='';}else if((character==='\n'||character==='\r')&&!quoted){if(character==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=character;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]])));
}
function eventRows(text:string):CollapseEvent[]{return parseCSV(text).map(row=>({...row,year:Number(row.year)}) as CollapseEvent);}
function equivalentRows(text:string):FiscalEquivalent[]{return parseCSV(text).map(row=>({...row,infantry_equivalent:Number(row.infantry_equivalent),cavalry_equivalent:Number(row.cavalry_equivalent),infantry_cost_solidi:Number(row.infantry_cost_solidi),cavalry_cost_solidi:Number(row.cavalry_cost_solidi)}) as FiscalEquivalent);}

export default function WesternCollapseChart(){
  const[events,setEvents]=useState<CollapseEvent[]>([]);const[equivalents,setEquivalents]=useState<FiscalEquivalent[]>([]);const[selectedYear,setSelectedYear]=useState(439);const[metric,setMetric]=useState<'infantry'|'cavalry'>('infantry');const[loadError,setLoadError]=useState('');
  useEffect(()=>{Promise.all([
    fetch(versioned('/data/western-roman-collapse-events.csv')).then(response=>{if(!response.ok)throw new Error('Collapse chronology could not be loaded.');return response.text();}),
    fetch(versioned('/data/africa-fiscal-equivalents.csv')).then(response=>{if(!response.ok)throw new Error('Africa model could not be loaded.');return response.text();}),
  ]).then(([eventText,equivalentText])=>{setEvents(eventRows(eventText));setEquivalents(equivalentRows(equivalentText));}).catch(error=>setLoadError(error instanceof Error?error.message:'Collapse evidence could not be loaded.'));},[]);
  const selected=events.find(event=>event.year===selectedYear)??events[0];
  const selectedValue=(row:FiscalEquivalent)=>metric==='infantry'?row.infantry_equivalent:row.cavalry_equivalent;
  const total=equivalents.reduce((sum,row)=>sum+selectedValue(row),0);
  const maximum=metric==='infantry'?60000:32000;

  return <div className="collapse-chart">
    {loadError?<p className="fiscal-error">{loadError}</p>:<>
      <div className="collapse-thesis" aria-label="Western collapse summary">
        <div><span>Process shown</span><b>81 years</b><small>395–476 CE</small></div>
        <div><span>445 assessment</span><b>1⁄8</b><small>remained in two damaged provinces</small></div>
        <div><span>What ended</span><b>West</b><small>the eastern Roman state continued</small></div>
      </div>
      <section className="collapse-sequence" aria-labelledby="collapse-sequence-title">
        <div className="collapse-heading"><div><span>A process, not an event</span><h5 id="collapse-sequence-title">The tax base shrank while crises accumulated</h5></div><small>Select a dated marker</small></div>
        <div className="event-track" aria-label="Western Roman collapse chronology">
          <i className="event-line" />
          {events.map((event,index)=><button type="button" key={event.year} className={selectedYear===event.year?'selected':''} style={{left:`${((event.year-395)/81)*100}%`,background:eventColors[event.event_type]}} onClick={()=>setSelectedYear(event.year)} aria-label={`${event.display_year}: ${event.event}`}><span>{index%2===0||[439,445,476].includes(event.year)?event.year:''}</span></button>)}
        </div>
        {selected&&<article className="event-detail"><div style={{background:eventColors[selected.event_type]}}><span>{selected.display_year}</span><b>{selected.event_type}</b></div><div><h6>{selected.event}</h6><p>{selected.what_changed}</p><dl><div><dt>Mechanism</dt><dd>{selected.mechanism}</dd></div><div><dt>Evidence</dt><dd>{selected.source_keys}</dd></div></dl><small>{selected.notes}</small></div></article>}
        <div className="event-legend">{Object.entries(eventColors).map(([label,color])=><span key={label}><i style={{background:color}} />{label}</span>)}</div>
      </section>
      <section className="africa-model" aria-labelledby="africa-model-title">
        <div className="collapse-heading"><div><span>Published fiscal-equivalent model</span><h5 id="africa-model-title">What lost African revenue could have maintained</h5></div><div className="equivalent-toggle"><button type="button" aria-pressed={metric==='infantry'} onClick={()=>setMetric('infantry')}>Infantry</button><button type="button" aria-pressed={metric==='cavalry'} onClick={()=>setMetric('cavalry')}>Cavalry</button></div></div>
        <div className="equivalent-total"><span>Combined {metric} equivalent</span><b>{metric==='cavalry'?'more than ':''}{total.toLocaleString()}</b><small>soldier-years of annual maintenance</small></div>
        <div className="equivalent-bars">{equivalents.map((row,index)=>{const value=selectedValue(row);return <article key={row.region_group}><div><span>{row.region_group}</span><small>{row.loss_status}</small></div><div className="equivalent-bar"><i style={{width:`${(value/maximum)*100}%`,background:index?'#bd1f2e':'#d6a34a'}} /></div><b>{metric==='cavalry'&&row.cavalry_relation==='lower_bound'?'more than ':''}{value.toLocaleString()}</b><small>{row.source_keys}</small></article>;})}</div>
        <p className="equivalent-warning"><b>Not a troop count.</b> Heather converted estimated revenue losses using Elton’s annual maintenance costs: 6 solidi per field infantryman and 10.5 per cavalryman. The bars show fiscal equivalents, not soldiers known to have been dismissed.</p>
      </section>
      <section className="eighth-survives" aria-labelledby="eighth-title"><div><span>Primary-law anchor · 21 June 445</span><h5 id="eighth-title">Even what remained in Africa was badly damaged</h5><p>Valentinian III’s Novel XIII withdrew seven parts of the former assessment for Numidia and Mauretania Sitifensis after public disaster and attacks.</p><small>NOV_VAL_13 · the ratio applies to these named provinces, not the whole western budget</small></div><div className="eighth-grid" role="img" aria-label="One of eight parts of the prior assessment remained">{Array.from({length:8},(_,index)=><i key={index} className={index===0?'remaining':''}><span>{index===0?'remaining':'remitted'}</span></i>)}</div></section>
    </>}
    <div className="fiscal-downloads"><a href={versioned('/data/western-roman-collapse-events.csv')} download>Collapse events ↓</a><a href={versioned('/data/africa-fiscal-equivalents.csv')} download>Africa model ↓</a></div>
  </div>;
}
