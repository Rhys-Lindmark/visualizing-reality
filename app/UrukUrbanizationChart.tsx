'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchUrukText } from './lib/urukDataClient';

type Row={kind:string;start_year:string;display_date:string;place:string;value:string;label:string;interpretation:string;limits:string};

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

const maxHectares=400;

export default function UrukUrbanizationChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selectedKey,setSelectedKey]=useState('Uruk|-3100');
  useEffect(()=>{const controller=new AbortController();const load=async()=>{setError('');try{const parsed=parseCSV(await fetchUrukText('uruk-urbanization-clocks.csv',controller.signal));if(!parsed.some(row=>row.place==='Uruk'&&Number(row.start_year)===-3100&&Number(row.value)===250)||!parsed.some(row=>row.place==='Tell Brak'&&Number(row.value)===130))throw new Error('required city-scale observations are missing');setRows(parsed)}catch(problem){if(!controller.signal.aborted)setError(problem instanceof Error?problem.message:'Could not load the dataset')}};load();return()=>controller.abort()},[]);
  const footprints=useMemo(()=>rows.filter(row=>row.kind!=='timeline').sort((a,b)=>Number(a.start_year)-Number(b.start_year)||Number(a.value)-Number(b.value)),[rows]);
  const selected=footprints.find(row=>`${row.place}|${row.start_year}`===selectedKey)??footprints.find(row=>row.place==='Uruk'&&Number(row.start_year)===-3100)??footprints[0];
  if(error)return <div className="uruk-data-error"><b>The city-scale comparison did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected)return <div className="uruk-data-loading" role="status">Loading the city-scale evidence…</div>;
  return <div className="uruk-urban-chart">
    <div className="urban-scale-summary"><div><span>Uruk, c. 3100 BCE</span><b>≈250 ha</b></div><div><span>Tell Brak maximum</span><b>≈130 ha</b></div><div><span>Scale difference</span><b>1.9×</b></div></div>
    <div className="urban-scale-axis" aria-hidden="true"><span>0</span><span>100</span><span>200</span><span>300</span><span>400 ha</span></div>
    <div className="urban-scale-bars" role="group" aria-label="Published settlement footprints">
      {footprints.map(row=>{const key=`${row.place}|${row.start_year}`;const uruk=row.place==='Uruk';return <button type="button" key={key} className={selected===row?'active':''} aria-pressed={selected===row} onClick={()=>setSelectedKey(key)}><span><b>{row.place}</b><small>{row.display_date}</small></span><i><em style={{width:`${Math.min(100,(Number(row.value)/maxHectares)*100)}%`}} className={uruk?'uruk':''}/></i><strong>≈{row.value} ha</strong></button>})}
    </div>
    <div className="urban-scale-readout" aria-live="polite"><span>{selected.place} · {selected.display_date}</span><b>{selected.label}</b><p>{selected.interpretation}</p><small>{selected.limits}</small></div>
  </div>;
}
