'use client';

import { useEffect, useMemo, useState } from 'react';

type Row={row_type:string;slug:string;label:string;role:string;model_claim:string;uruk_evidence:string;chronology:string;evidence_class:string;source_keys:string;limits:string};
const DATA_REVISION='20260830-uruk-grain1';
const url=`/data/uruk-grain-state-evidence.csv?v=${DATA_REVISION}`;
const resourceOrder=['cereal-grain','roots-and-tubers','herd-animals','fish-and-wetlands','fruit-orchards'];
const testOrder=['original-study','published-comment','uruk-archive','deltaic-economy','archive-bias'];
const testTone:Record<string,string>={'original-study':'support','published-comment':'challenge','uruk-archive':'direct','deltaic-economy':'context','archive-bias':'warning'};

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

export default function UrukGrainChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selectedSlug,setSelectedSlug]=useState('cereal-grain');
  useEffect(()=>{let cancelled=false;const load=async()=>{setError('');try{const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const parsed=parseCSV(await response.text());if(parsed.length!==10||parsed.filter(row=>row.row_type==='resource').length!==5||parsed.filter(row=>row.row_type==='test').length!==5)throw new Error('required evidence rows missing');if(!cancelled)setRows(parsed)}catch(problem){if(!cancelled)setError(problem instanceof Error?problem.message:'Could not load the evidence')}};load();return()=>{cancelled=true}},[]);
  const resources=useMemo(()=>resourceOrder.map(slug=>rows.find(row=>row.row_type==='resource'&&row.slug===slug)).filter((row):row is Row=>Boolean(row)),[rows]);
  const tests=useMemo(()=>testOrder.map(slug=>rows.find(row=>row.row_type==='test'&&row.slug===slug)).filter((row):row is Row=>Boolean(row)),[rows]);
  const selected=resources.find(row=>row.slug===selectedSlug)??resources[0];
  if(error)return <div className="uruk-data-error"><b>The grain-state evidence did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected)return <div className="uruk-data-loading" role="status">Loading the competing evidence…</div>;
  return <div className="uruk-grain-chart">
    <div className="grain-thesis"><div><span>Original model</span><b>1 focal crop</b><small>cereals versus roots and tubers</small></div><div><span>Uruk evidence</span><b>5 systems</b><small>grain · roots · herds · fish · fruit</small></div><div><span>Current status</span><b>Disputed</b><small>published challenge, July 2026</small></div></div>
    <section className="grain-resource-matrix"><div className="uruk-chart-heading"><div><span>Competing resource systems</span><h5>Legible to institutions did not mean “grain only”</h5></div><small>qualitative evidence · no invented score</small></div>
      <div className="grain-resource-tabs" role="tablist" aria-label="Resource systems">{resources.map(row=><button type="button" role="tab" aria-selected={selected===row} key={row.slug} onClick={()=>setSelectedSlug(row.slug)}><i/><span>{row.label}</span><small>{row.role}</small></button>)}</div>
      <div className="grain-resource-readout" role="tabpanel"><header><span>{selected.role}</span><h6>{selected.label}</h6><small>{selected.chronology}</small></header><div><article><span>What the model predicts</span><p>{selected.model_claim}</p></article><article><span>What Uruk evidence shows</span><p>{selected.uruk_evidence}</p></article><aside><b>Boundary</b><p>{selected.limits}</p><small>{selected.source_keys}</small></aside></div></div>
    </section>
    <section className="grain-claim-test"><div className="uruk-chart-heading"><div><span>Claim test</span><h5>Five pieces of evidence, five different jobs</h5></div><small>model ≠ archive ≠ landscape ≠ causation</small></div>
      <div className="grain-test-list">{tests.map((row,index)=><article className={testTone[row.slug]} key={row.slug}><div><i>{String(index+1).padStart(2,'0')}</i><span>{row.role}</span><h6>{row.label}</h6><small>{row.chronology}</small></div><div><p>{row.model_claim}</p><p>{row.uruk_evidence}</p><small><b>Limit:</b> {row.limits}</small></div><em>{row.source_keys}</em></article>)}</div>
    </section>
    <div className="grain-conclusion"><div><span>Best-supported conclusion</span><b>Cereals fit taxation. Uruk was not a cereal monoculture.</b></div><p>The evidence supports a grain–institution fit: dry seasonal staples were unusually convenient to count and reassign. It does not show that grain alone caused the state, or that the surviving archive measures the whole economy.</p></div>
    <div className="fiscal-downloads"><a href={url} download>Competing evidence CSV ↓</a><a href="https://doi.org/10.1086/718372">Open original study ↗</a><a href="https://doi.org/10.1086/740225">Open 2026 comment ↗</a></div>
  </div>;
}
