'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { fetchUrukText, urukDataUrl } from './lib/urukDataClient';

type Row={kind:string;system:string;start_year:string;end_year:string;display_date:string;place:string;measure:string;value:string;relation:string;unit:string;label:string;evidence_type:string;source_keys:string;interpretation:string;limits:string};
const dataUrl=urukDataUrl('uruk-water-ecology.csv');
const minYear=-10000,maxYear=-1000,span=maxYear-minYear;
const systems=['Local environment','Regional climate','Urban context','Direct waterwork','Textual evidence','Preserved network'];
const colors:Record<string,string>={'Local environment':'#287c91','Regional climate':'#7b8d67','Urban context':'#be2434','Direct waterwork':'#2d5f86','Textual evidence':'#9a6c37','Preserved network':'#766084'};
const left=(year:number)=>`${((year-minYear)/span)*100}%`;
const width=(start:number,end:number)=>`${Math.max(1.6,((end-start)/span)*100)}%`;
const yearLabel=(year:number)=>`${Math.abs(year)} BCE`;

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}
function relation(row:Row){return row.relation==='more_than'?`>${Number(row.value).toLocaleString()}`:row.value}

export default function UrukWaterChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[mapView,setMapView]=useState<'plain'|'eridu'>('plain');const[selectedMeasure,setSelectedMeasure]=useState('freshwater_environment');
  useEffect(()=>{const controller=new AbortController();const load=async()=>{try{const parsed=parseCSV(await fetchUrukText('uruk-water-ecology.csv',controller.signal));if(parsed.length!==11)throw new Error('required evidence rows missing');setRows(parsed)}catch(problem){if(!controller.signal.aborted)setError(problem instanceof Error?problem.message:'Could not load the dataset')}};load();return()=>controller.abort()},[]);
  const dated=useMemo(()=>rows.filter(row=>row.start_year&&row.end_year),[rows]);const network=useMemo(()=>rows.filter(row=>row.kind==='network_summary'),[rows]);
  const selected=dated.find(row=>row.measure===selectedMeasure)??dated[0];
  if(error)return <div className="uruk-data-error"><b>The water evidence did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected)return <div className="uruk-data-loading" role="status">Loading the water evidence…</div>;
  return <div className="uruk-water-chart">
    <div className="water-thesis"><div><span>Local freshwater proxy</span><b>2,850 years</b><small>M38 · 7750–4900 cal BCE</small></div><div><span>Map boundary</span><b>No time slice</b><small>visible channels are mixed-age traces</small></div><div><span>Eridu case study</span><b>&gt;4,000</b><small>branch canals accumulated across millennia</small></div></div>
    <section className="water-map"><div className="uruk-chart-heading"><div><span>Published landscape reconstruction</span><h5>A floodplain palimpsest—not a 3300 BCE map</h5></div><div className="water-map-tabs"><button type="button" aria-pressed={mapView==='plain'} onClick={()=>setMapView('plain')}>Alluvial plain</button><button type="button" aria-pressed={mapView==='eridu'} onClick={()=>setMapView('eridu')}>Eridu detail</button></div></div>
      <div className={`water-figure ${mapView}`}>
        {mapView==='plain'?<Image src="/images/mesopotamia-palaeochannels.webp" width={1300} height={1445} sizes="(max-width: 700px) 100vw, 900px" alt="Published topographic map of the Mesopotamian alluvial plain with mixed-age palaeochannels in black and modern channels in blue" priority={false}/>:<Image src="/images/eridu-irrigation-network.webp" width={1300} height={562} sizes="(max-width: 700px) 100vw, 900px" alt="Published map of the preserved irrigation network in the Eridu region with ancient canals, an ancient Euphrates course, and archaeological sites" priority={false}/>} 
        <aside>{mapView==='plain'?<><b>Read the layers, not one date</b><span><i className="black"/>Black: visible palaeochannels of mixed age</span><span><i className="blue"/>Blue: modern channels for orientation</span><p>Course traces accumulated, disappeared, and were reused. None is assigned to Uruk’s peak without direct dating.</p></>:<><b>What survived at Eridu</b>{network.map(row=><span key={row.measure}><strong>{relation(row)}</strong>{row.label.toLowerCase()}</span>)}<p>Combined across occupations from the sixth to early first millennium BCE. The whole network never ran at once.</p></>}</aside>
      </div>
      <p className="water-attribution">Jotheri et al. (2025), <i>Antiquity</i>, Figures {mapView==='plain'?'1':'5'}, CC BY 4.0. Adapted only by image compression. The overview’s modern and ancient-looking lines retain the authors’ own legend.</p>
    </section>
    <section className="water-chronology"><div className="uruk-chart-heading"><div><span>What can actually be dated?</span><h5>The evidence brackets Uruk; it does not draw its canals</h5></div><small>8000–1000 BCE · unlike evidence kept separate</small></div>
      <div className="water-axis">{[-10000,-8000,-6000,-4000,-2000,-1000].map(year=><span key={year} style={{left:left(year)}}>{yearLabel(year)}</span>)}</div>
      <div className="water-lanes">{systems.map(system=><div className="water-lane" key={system}><div><i style={{background:colors[system]}}/><b>{system}</b></div><div>{dated.filter(row=>row.system===system).map(row=><button type="button" key={row.measure} aria-pressed={selected===row} className={selected===row?'active':''} style={{left:left(Number(row.start_year)),width:width(Number(row.start_year),Number(row.end_year)),'--water-color':colors[system]} as React.CSSProperties} onClick={()=>setSelectedMeasure(row.measure)}><span>{row.display_date}</span></button>)}</div></div>)}</div>
      <div className="water-readout"><div><span>{selected.system} · {selected.place}</span><b>{selected.label}</b><small>{selected.display_date}</small></div><div><p>{selected.interpretation}</p><small><b>Limit:</b> {selected.limits}</small></div><i>{selected.source_keys}</i></div>
    </section>
    <div className="water-conclusion"><b>What the evidence supports</b><p>A dynamic freshwater, marsh, channel, and field mosaic made dense settlement and transport possible. Irrigation multiplied that ecology. Neither the map nor the chronology proves that one canal authority created the state.</p></div>
    <div className="fiscal-downloads"><a href={dataUrl} download>Water evidence CSV ↓</a><a href="https://doi.org/10.15184/aqy.2025.19">Open map article ↗</a><a href="https://doi.org/10.1017/irq.2019.2">Open borehole study ↗</a></div>
  </div>;
}
