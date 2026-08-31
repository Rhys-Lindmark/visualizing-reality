'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { fetchUrukText } from './lib/urukDataClient';

type Row={kind:string;display_date:string;place:string;measure:string;value:string;relation:string;label:string;interpretation:string;limits:string};

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

const mechanismMeasures=['shifting_ecological_mosaic','stable_anthropogenic_channels','urban_state_formation_interval'];
const relation=(row:Row)=>row.relation==='more_than'?`>${Number(row.value).toLocaleString()}`:row.value;

export default function UrukWaterChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[mapView,setMapView]=useState<'plain'|'eridu'>('plain');const[selectedMeasure,setSelectedMeasure]=useState('stable_anthropogenic_channels');
  useEffect(()=>{const controller=new AbortController();const load=async()=>{try{const parsed=parseCSV(await fetchUrukText('uruk-water-ecology.csv',controller.signal));if(parsed.length!==12||!parsed.some(row=>row.measure==='stable_anthropogenic_channels'))throw new Error('required water evidence is missing');setRows(parsed)}catch(problem){if(!controller.signal.aborted)setError(problem instanceof Error?problem.message:'Could not load the dataset')}};load();return()=>controller.abort()},[]);
  const mechanisms=useMemo(()=>mechanismMeasures.map(measure=>rows.find(row=>row.measure===measure)).filter((row):row is Row=>Boolean(row)),[rows]);
  const network=useMemo(()=>rows.filter(row=>row.kind==='network_summary'),[rows]);
  const selected=rows.find(row=>row.measure===selectedMeasure)??mechanisms[0];
  if(error)return <div className="uruk-data-error"><b>The water evidence did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected)return <div className="uruk-data-loading" role="status">Loading the water evidence…</div>;
  return <div className="uruk-water-chart water-story">
    <div className="water-map-tabs" role="group" aria-label="Water landscape view"><button type="button" aria-pressed={mapView==='plain'} onClick={()=>setMapView('plain')}>Alluvial plain</button><button type="button" aria-pressed={mapView==='eridu'} onClick={()=>setMapView('eridu')}>Preserved canal network</button></div>
    <div className={`water-figure ${mapView}`}>
      {mapView==='plain'?<Image src="/images/mesopotamia-palaeochannels.webp" width={1300} height={1445} sizes="(max-width: 700px) 100vw, 900px" alt="Published topographic map of the Mesopotamian alluvial plain with palaeochannels in black and modern channels in blue"/>:<Image src="/images/eridu-irrigation-network.webp" width={1300} height={562} sizes="(max-width: 700px) 100vw, 900px" alt="Published map of the preserved irrigation network in the Eridu region with ancient canals and archaeological sites"/>}
      <aside>{mapView==='plain'?<><b>Nature supplied moving channels</b><span><i className="black"/>Palaeochannels</span><span><i className="blue"/>Modern channels</span><p>People overlaid canals on a floodplain that already shifted between river, marsh, and drier ground.</p></>:<><b>Management multiplied them</b>{network.map(row=><span key={row.measure}><strong>{relation(row)}</strong>{row.label.toLowerCase()}</span>)}<p>These traces accumulated across many occupations; they show the possible scale of a managed waterscape, not one simultaneous Uruk system.</p></>}</aside>
    </div>
    <div className="water-mechanisms" role="group" aria-label="How managed water supported urban concentration">{mechanisms.map((row,index)=><button type="button" key={row.measure} aria-pressed={selected===row} className={selected===row?'active':''} onClick={()=>setSelectedMeasure(row.measure)}><span>{String(index+1).padStart(2,'0')}</span><b>{row.label}</b><small>{row.display_date}</small></button>)}</div>
    <div className="water-story-readout" aria-live="polite"><span>{selected.place} · {selected.display_date}</span><b>{selected.label}</b><p>{selected.interpretation}</p><small>{selected.limits}</small></div>
    <p className="water-attribution">Maps adapted by image compression from Jotheri et al. (2025), <i>Antiquity</i>, CC BY 4.0.</p>
  </div>;
}
