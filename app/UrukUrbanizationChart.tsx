'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchUrukText, urukDataUrl } from './lib/urukDataClient';

type Row={kind:string;system:string;start_year:string;end_year:string;display_date:string;place:string;measure:string;value:string;relation:string;unit:string;label:string;evidence_type:string;source_keys:string;interpretation:string;limits:string};
const url=urukDataUrl('uruk-urbanization-clocks.csv');
const systems=['Urban scale','Public institutions','Record-keeping','Political inference'];
const colors:Record<string,string>={'Urban scale':'#234f78','Public institutions':'#7d668d','Record-keeping':'#be2434','Political inference':'#b6822e'};
const minYear=-4400,maxYear=-2900,span=maxYear-minYear;
const left=(year:number)=>`${((year-minYear)/span)*100}%`;
const width=(start:number,end:number)=>`${Math.max(1.2,((end-start)/span)*100)}%`;
const yearLabel=(year:number)=>`${Math.abs(year)} BCE`;

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

export default function UrukUrbanizationChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selectedKey,setSelectedKey]=useState('Political inference|Uruk');
  useEffect(()=>{const controller=new AbortController();const load=async()=>{setError('');try{const parsed=parseCSV(await fetchUrukText('uruk-urbanization-clocks.csv',controller.signal));if(parsed.length!==10||!parsed.some(row=>row.kind==='timeline')||!parsed.some(row=>row.kind==='footprint'))throw new Error('required rows missing');setRows(parsed)}catch(problem){if(!controller.signal.aborted)setError(problem instanceof Error?problem.message:'Could not load the dataset')}};load();return()=>controller.abort()},[]);
  const timeline=useMemo(()=>rows.filter(row=>row.kind==='timeline'),[rows]);const footprints=useMemo(()=>rows.filter(row=>row.kind!=='timeline'),[rows]);
  const selected=timeline.find(row=>`${row.system}|${row.place}`===selectedKey)??timeline.find(row=>row.system==='Political inference')??timeline[0];
  if(error)return <div className="uruk-data-error"><b>The urbanization chronology did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected)return <div className="uruk-data-loading" role="status">Loading the urbanization evidence…</div>;
  return <div className="uruk-urban-chart">
    <div className="urban-thesis"><div><span>Not one threshold</span><b>4 clocks</b><small>scale · institutions · records · power</small></div><div><span>Measured footprint</span><b>≈250 ha</b><small>Uruk, c. 3100 BCE</small></div><div><span>Political limit</span><b>No king date</b><small>monocracy is not unequivocally attested</small></div></div>
    <section className="urban-clock"><div className="uruk-chart-heading"><div><span>Evidence lanes</span><h5>When did a city become a state?</h5></div><small>4400–2900 BCE · ranges are not point dates</small></div>
      <div className="urban-axis">{[-4400,-4100,-3800,-3500,-3200,-2900].map(year=><span key={year} style={{left:left(year)}}>{yearLabel(year)}</span>)}</div>
      <div className="urban-lanes">{systems.map(system=><div className="urban-lane" key={system}><div><i style={{background:colors[system]}}/><b>{system}</b></div><div>{timeline.filter(row=>row.system===system).map(row=>{const key=`${row.system}|${row.place}`;return <button type="button" key={`${key}|${row.label}`} style={{left:left(Number(row.start_year)),width:width(Number(row.start_year),Number(row.end_year)),'--lane-color':colors[system]} as React.CSSProperties} className={selected===row?'active':''} aria-pressed={selected===row} onClick={()=>setSelectedKey(key)}><span>{row.display_date}</span></button>})}</div></div>)}</div>
      <div className="urban-readout"><div><span>{selected.system} · {selected.place}</span><b>{selected.label}</b><small>{selected.display_date}</small></div><div><p>{selected.interpretation}</p><small><b>Limit:</b> {selected.limits}</small></div><i>{selected.source_keys}</i></div>
    </section>
    <section className="urban-footprints"><div className="uruk-chart-heading"><div><span>Published settlement footprints</span><h5>Big did not mean the same thing everywhere</h5></div><small>hectares · not population</small></div><div className="footprint-axis"><span>0</span><span>200</span><span>400 ha</span></div><div className="footprint-rows">{footprints.map(row=><article key={`${row.place}|${row.display_date}`}><div><b>{row.place}</b><small>{row.display_date}</small></div><div><i style={{width:`${(Number(row.value)/400)*100}%`,background:row.place==='Uruk'?'#be2434':'#7d8e9a'}}/></div><strong>≈{row.value} ha</strong><p>{row.limits}</p></article>)}</div><p className="footprint-warning"><b>Do not convert these bars into population.</b> Survey coverage, occupational density, suburbs, ceramic chronology, and where researchers draw an edge all vary. The comparison shows scale and plurality, not a league table.</p></section>
    <div className="fiscal-downloads"><a href={url} download>Urbanization CSV ↓</a><a href="https://doi.org/10.15184/aqy.2024.189">Read the institutional critique ↗</a></div>
  </div>;
}
