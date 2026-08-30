'use client';

import { useEffect, useMemo, useState } from 'react';

type Row={record_type:string;phase:string;phase_order:string;metric:string;value:string;relation:string;unit:string;label:string;source_keys:string;notes:string};

const DATA_REVISION='20260830-uruk-writing1';
const url=`/data/uruk-writing-corpus.csv?v=${DATA_REVISION}`;

function parseCSV(text:string):Row[]{
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);
}

const relation=(row:Row)=>row.relation==='less_than'?`<${row.value}%`:row.relation==='approximate'?`≈${row.value}%`:`${row.value}%`;
const format=(value:number)=>new Intl.NumberFormat('en-US').format(value);

export default function UrukWritingChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selected,setSelected]=useState('Uruk IV');
  useEffect(()=>{let cancelled=false;const load=async()=>{setError('');try{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const parsed=parseCSV(await response.text());if(!parsed.some(row=>row.record_type==='genre_share')||!parsed.some(row=>row.metric==='artifacts'))throw new Error('required rows missing');if(!cancelled)setRows(parsed);}catch(problem){if(!cancelled)setError(problem instanceof Error?problem.message:'Could not load the dataset');}};load();return()=>{cancelled=true};},[]);
  const shares=useMemo(()=>rows.filter(row=>row.record_type==='genre_share').sort((a,b)=>Number(a.phase_order)-Number(b.phase_order)),[rows]);
  const corpus=useMemo(()=>rows.filter(row=>row.record_type==='corpus_snapshot').sort((a,b)=>Number(a.phase_order)-Number(b.phase_order)),[rows]);
  const active=shares.find(row=>row.phase===selected)??shares[1]??shares[0];
  if(error)return <div className="uruk-data-error"><b>The writing dataset did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!active)return <div className="uruk-data-loading" role="status">Loading the proto-cuneiform record…</div>;
  return <div className="uruk-writing-chart">
    <div className="uruk-kpis" aria-label="Proto-cuneiform corpus summary">
      <div><span>Earliest phase</span><b>&lt;1%</b><small>Uruk IV tablets lexical</small></div>
      <div><span>Following phase</span><b>≈20%</b><small>Uruk III tablets lexical</small></div>
      <div><span>Corpus snapshot</span><b>{format(Number(corpus.find(row=>row.metric==='artifacts')?.value??0))}</b><small>CDLI artifacts, 19 May 2020</small></div>
    </div>
    <section className="uruk-shares" aria-labelledby="uruk-shares-title">
      <div className="uruk-chart-heading"><div><span>Composition of the surviving archives</span><h5 id="uruk-shares-title">Lexical lists were almost absent at first</h5></div><small>Published shares · bars preserve &lt; and ≈</small></div>
      <div className="uruk-share-axis"><span>0%</span><span>10%</span><span>20%</span></div>
      <div className="uruk-share-rows">{shares.map(row=><button type="button" key={row.phase} className={active.phase===row.phase?'active':''} onClick={()=>setSelected(row.phase)} aria-pressed={active.phase===row.phase}><span><b>{row.phase}</b><small>{row.label}</small></span><i><em style={{width:`${Math.min(100,Number(row.value)*5)}%`}} /></i><strong>{relation(row)}</strong></button>)}</div>
      <div className="uruk-share-readout"><div><span>{active.phase}</span><b>{relation(active)} lexical</b></div><p>{active.notes}</p><small>Source: {active.source_keys}</small></div>
    </section>
    <section className="uruk-corpus" aria-labelledby="uruk-corpus-title">
      <div className="uruk-chart-heading"><div><span>What the digital corpus can support</span><h5 id="uruk-corpus-title">A large record, filtered before it is counted</h5></div><small>Born &amp; Kelley 2021</small></div>
      <div className="uruk-corpus-flow">{corpus.slice(0,3).map((row,index)=><article key={row.metric}><span>0{index+1}</span><b>{format(Number(row.value))}</b><p>{row.label}</p><small>{row.notes}</small></article>)}</div>
      {corpus.find(row=>row.metric==='readable_non_numerical_tokens')&&<div className="uruk-token-total"><span>After excluding Uruk V and numerical entries</span><b>{format(Number(corpus.find(row=>row.metric==='readable_non_numerical_tokens')!.value))}</b><small>readable non-numerical sign tokens in Uruk III–IV</small></div>}
      <p className="uruk-corpus-caveat"><b>Not a census of ancient writing.</b> This is the set available in CDLI on one date. Excavation, survival, publication, transliteration, and readability all shape what enters the count.</p>
    </section>
    <div className="fiscal-downloads"><a href={url} download>Writing corpus CSV ↓</a><a href="https://cdli.earth/articles/cdlb/2021-6">Explore the CDLI analysis ↗</a></div>
  </div>;
}
