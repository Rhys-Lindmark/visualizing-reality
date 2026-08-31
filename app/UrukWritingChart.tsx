'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchUrukText } from './lib/urukDataClient';

type Row={record_type:string;phase:string;phase_order:string;metric:string;value:string;relation:string;unit:string;label:string;source_keys:string;notes:string};

function parseCSV(text:string):Row[]{
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);
}

const lexicalLabel=(row:Row)=>row.relation==='less_than'?`<${row.value}%`:row.relation==='approximate'?`≈${row.value}%`:`${row.value}%`;
const administrativeLabel=(row:Row)=>row.relation==='less_than'?`>${100-Number(row.value)}%`:row.relation==='approximate'?`≈${100-Number(row.value)}%`:`${100-Number(row.value)}%`;

export default function UrukWritingChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selected,setSelected]=useState('Uruk IV');
  useEffect(()=>{const controller=new AbortController();const load=async()=>{setError('');try{const parsed=parseCSV(await fetchUrukText('uruk-writing-corpus.csv',controller.signal));if(!parsed.some(row=>row.phase==='Uruk IV'&&row.metric==='lexical_share')||!parsed.some(row=>row.phase==='Uruk III'&&row.metric==='lexical_share'))throw new Error('required phase summaries missing');setRows(parsed);}catch(problem){if(!controller.signal.aborted)setError(problem instanceof Error?problem.message:'Could not load the dataset');}};load();return()=>controller.abort();},[]);
  const shares=useMemo(()=>rows.filter(row=>row.record_type==='genre_share'&&row.phase!=='All archaic archives').sort((a,b)=>Number(a.phase_order)-Number(b.phase_order)),[rows]);
  const active=shares.find(row=>row.phase===selected)??shares[0];
  if(error)return <div className="uruk-data-error"><b>The writing evidence did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!active)return <div className="uruk-data-loading" role="status">Loading the proto-cuneiform record…</div>;
  return <div className="uruk-writing-chart">
    <div className="uruk-writing-legend" aria-label="Document genres"><span><i className="administrative"/>Administrative records</span><span><i className="lexical"/>Lexical lists</span></div>
    <div className="uruk-writing-bars" aria-label="Published composition of surviving proto-cuneiform archives">
      {shares.map(row=>{const lexical=Number(row.value);return <button type="button" key={row.phase} className={active.phase===row.phase?'active':''} onClick={()=>setSelected(row.phase)} aria-pressed={active.phase===row.phase}>
        <span className="uruk-writing-phase"><b>{row.phase}</b><small>{row.label}</small></span>
        <span className="uruk-writing-stack" aria-label={`${row.phase}: ${administrativeLabel(row)} administrative and ${lexicalLabel(row)} lexical`}><i className="administrative" style={{width:`${100-lexical}%`}}/><i className="lexical" style={{width:`${lexical}%`}}/></span>
        <span className="uruk-writing-values"><b>{administrativeLabel(row)}</b><b>{lexicalLabel(row)}</b></span>
      </button>})}
    </div>
    <div className="uruk-writing-readout" aria-live="polite">
      <div><span>{active.phase}</span><b>{administrativeLabel(active)} administrative</b></div>
      <p>{active.phase==='Uruk IV'?'The earliest surviving tablets overwhelmingly record institutional transactions. Lexical lists account for less than one percent.':'Administrative records still dominate, while lexical lists expand to roughly one fifth of the surviving archive—evidence that scribes were also teaching and organizing the new sign system.'}</p>
    </div>
    <div className="uruk-writing-memory" aria-label="What administrative writing made durable">
      <span>Writing made institutional obligations durable</span>
      <ul><li>Goods</li><li>People</li><li>Land</li><li>Work</li><li>Rations</li></ul>
    </div>
  </div>;
}
