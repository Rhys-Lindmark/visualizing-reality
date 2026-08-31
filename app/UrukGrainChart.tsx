'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchUrukText } from './lib/urukDataClient';

type Row={row_type:string;slug:string;label:string;role:string;model_claim:string;uruk_evidence:string;chronology:string;evidence_class:string;source_keys:string;limits:string;estimate:string;p_value:string;observations:string;specification:string};
const resourceOrder=['cereal-grain','roots-and-tubers','herd-animals','fish-and-wetlands','fruit-orchards'];
const estimateOrder=['full-2sls','winsorized-2sls'];
const grainMechanism=[['Visible','Above-ground harvest'],['Divisible','Standard measures'],['Portable','Dry bulk commodity'],['Storable','Survives beyond harvest']];

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

export default function UrukGrainChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selectedSlug,setSelectedSlug]=useState('cereal-grain');
  useEffect(()=>{const controller=new AbortController();const load=async()=>{try{const parsed=parseCSV(await fetchUrukText('uruk-grain-state-evidence.csv',controller.signal));if(parsed.length!==12||parsed.filter(row=>row.row_type==='resource').length!==5||parsed.filter(row=>row.row_type==='estimate').length!==2)throw new Error('required grain evidence is missing');setRows(parsed)}catch(problem){if(!controller.signal.aborted)setError(problem instanceof Error?problem.message:'Could not load the evidence')}};load();return()=>controller.abort()},[]);
  const resources=useMemo(()=>resourceOrder.map(slug=>rows.find(row=>row.row_type==='resource'&&row.slug===slug)).filter((row):row is Row=>Boolean(row)),[rows]);
  const estimates=useMemo(()=>estimateOrder.map(slug=>rows.find(row=>row.row_type==='estimate'&&row.slug===slug)).filter((row):row is Row=>Boolean(row)),[rows]);
  const selected=resources.find(row=>row.slug===selectedSlug)??resources[0];
  if(error)return <div className="uruk-data-error"><b>The grain evidence did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected||estimates.length!==2)return <div className="uruk-data-loading" role="status">Loading the grain evidence…</div>;
  return <div className="uruk-grain-chart grain-power-story">
    <div className="grain-power-mechanism" aria-label="Why cereal grain was easy to appropriate">{grainMechanism.map(([label,detail],index)=><div key={label}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b><small>{detail}</small></div>)}</div>
    <section className="grain-power-estimates">
      <header><div><span>Global comparison</span><b>Primary cereal cultivation and political hierarchy</b></div><small>{estimates[0].observations} societies · hierarchy scale 1–5</small></header>
      <div className="grain-estimate-axis"><span>0</span><span>+0.4</span><span>+0.8</span><span>+1.2 levels</span></div>
      <div className="grain-estimate-bars">{estimates.map(row=><div key={row.slug} className={row.slug==='winsorized-2sls'?'robustness':''}><div><b>{row.label}</b><small>{row.slug==='full-2sls'?'Replicated published model':'Thirty-one influential cases capped'}</small></div><div className="grain-estimate-track"><i style={{width:`${(Number(row.estimate)/1.2)*100}%`}}/><strong>+{Number(row.estimate).toFixed(2)}</strong></div><em>p = {Number(row.p_value).toFixed(3)}</em></div>)}</div>
    </section>
    <section className="grain-uruk-records">
      <header><span>Direct Uruk evidence</span><b>Institutions counted grain—and more than grain</b></header>
      <div className="grain-resource-tabs" role="tablist" aria-label="Resources recorded or compared">{resources.map(row=><button type="button" role="tab" aria-selected={selected===row} key={row.slug} onClick={()=>setSelectedSlug(row.slug)}><span>{row.label}</span></button>)}</div>
      <div className="grain-power-readout" role="tabpanel"><div><span>{selected.chronology}</span><b>{selected.label}</b></div><p>{selected.uruk_evidence}</p></div>
    </section>
  </div>;
}
