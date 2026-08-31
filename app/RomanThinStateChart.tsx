'use client';

import { useEffect, useState } from 'react';
import ChartFooter from './components/ChartFooter';
import { fetchClientText } from './lib/clientAsset';

type Row = {
  polity:string;
  date_label:string;
  official_index:number;
  official_count_label:string;
  population_label:string;
  administrative_model:string;
  city_governance:string;
  source_keys:string;
  note:string;
};

const DATA_URL='/data/rome/20260831-thin-state1/rome-han-administration.csv';

function parseCSV(text:string):Row[]{
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const character=text[index];if(character==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(character==='"')quoted=!quoted;else if(character===','&&!quoted){row.push(cell);cell='';}else if((character==='\n'||character==='\r')&&!quoted){if(character==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=character;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>{const item=Object.fromEntries(headers.map((header,index)=>[header,values[index]]));return {...item,official_index:Number(item.official_index)} as Row;});
}

export default function RomanThinStateChart(){
  const[rows,setRows]=useState<Row[]>([]);const[mode,setMode]=useState<'scale'|'mechanism'>('scale');const[error,setError]=useState('');
  useEffect(()=>{const controller=new AbortController();fetchClientText(`${DATA_URL}?v=20260831-thin-state1`,{signal:controller.signal,label:'Rome–Han administration data'}).then(text=>{const parsed=parseCSV(text);if(parsed.length!==2||parsed.some(row=>!row.polity||!Number.isFinite(row.official_index)||row.official_index<=0))throw new Error('The administration comparison was incomplete.');setRows(parsed);}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'The comparison could not be loaded.');});return()=>controller.abort();},[]);
  return <div className="roman-thin-state-chart">
    <header><span>ROME AND WESTERN HAN · SIMILAR POPULATIONS, DIFFERENT STATES</span><h4>Rome governed through cities, not a giant bureaucracy</h4><p>At comparable imperial scale, Han China employed roughly twenty times as many officials.</p></header>
    <nav aria-label="Choose an administration comparison"><button type="button" className={mode==='scale'?'active':''} onClick={()=>setMode('scale')}>Administrative scale</button><button type="button" className={mode==='mechanism'?'active':''} onClick={()=>setMode('mechanism')}>How rule reached cities</button></nav>
    {error?<div className="data-state error" role="alert"><b>The administration comparison did not load</b><p>{error}</p></div>:mode==='scale'?<div className="thin-state-scale">
      <div className="thin-state-axis"><span>Relative number of officials · Rome = 1</span><i><em>1</em><em>5</em><em>10</em><em>15</em><em>20</em></i></div>
      <div className="thin-state-bars">{rows.map(row=><article key={row.polity}><div><b>{row.polity}</b><span>{row.date_label} · {row.population_label}</span></div><i><em style={{width:`${row.official_index/20*100}%`}} /></i><strong>{row.official_index}×</strong><small>{row.official_count_label}</small></article>)}</div>
      <div className="thin-state-takeaway"><b>Rome delegated what Han bureaucrats administered.</b><p>The comparison is an order of magnitude, not a headcount contest. Its historical meaning lies in the different machinery beneath each emperor.</p></div>
    </div>:<div className="thin-state-mechanism">{rows.map((row,index)=><article key={row.polity}><header><span>{index===0?'CITY-MEDIATED RULE':'BUREAUCRATIC RULE'}</span><h5>{row.polity}</h5></header><div><b>Imperial apparatus</b><p>{row.administrative_model}</p></div><i>↓</i><div><b>At the city level</b><p>{row.city_governance}</p></div></article>)}</div>}
    <ChartFooter source="Li Feng; Bielenstein; Scheidel (ed.); Alfani, Bolla & Scheidel" note="Han's recorded 130,285 officials exclude the military. The 20× comparison is approximate; Roman municipal elites were not salaried imperial officials." dataHref={DATA_URL}/>
  </div>;
}
