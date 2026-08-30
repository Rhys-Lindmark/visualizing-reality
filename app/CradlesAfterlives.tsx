'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type Row={region:string;region_slug:string;pathway:string;pathway_label:string;before:string;transition:string;afterlife:string;place:string;time_window:string;evidence_status:string;source_keys:string;interpretation:string;limits:string};

const REVISION='20260830-afterlives1';
const dataUrl=`/data/cradles/${REVISION}/cradles-afterlives.csv`;
const colors:Record<string,string>={mesopotamia:'#b52232',egypt:'#c0842f',indus:'#358080','northern-china':'#6f5b92',mesoamerica:'#56814e',andes:'#376d8e'};

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'&&quoted&&text[index+1]==='"'){cell+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);}
function label(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,character=>character.toUpperCase());}

export default function CradlesAfterlives(){
  const[rows,setRows]=useState<Row[]>([]);
  const[state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const[error,setError]=useState('');
  const[selectedSlug,setSelectedSlug]=useState('mesopotamia');
  const[attempt,setAttempt]=useState(0);

  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Afterlives CSV'}).then(parseCSV).then(parsed=>{const required=['before','transition','afterlife','interpretation','limits','source_keys'] as const;const regions=new Set(parsed.map(row=>row.region_slug));if(parsed.length!==6||regions.size!==6||parsed.some(row=>required.some(field=>!row[field])))throw new Error('The afterlives response used an incompatible schema.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The afterlives evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);

  const selected=useMemo(()=>rows.find(row=>row.region_slug===selectedSlug)??rows[0],[rows,selectedSlug]);
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!selected)return <div className={`data-state cradle-afterlives-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The afterlives evidence did not load':'Loading six historical pathways…'}</b><span>{state==='error'?error:'Six cases · six outcomes · no collapse score'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry evidence</button>}</div>;

  return <div className="afterlives-chart" style={{'--afterlife-color':colors[selected.region_slug]} as React.CSSProperties}>
    <div className="afterlives-summary"><div><span>Regional cases</span><b>6</b><small>kept historically specific</small></div><div><span>Observed pathways</span><b>6</b><small>none forced into one unit</small></div><div><span>Collapse scores</span><b>0</b><small>the comparison refuses one</small></div></div>
    <nav className="afterlives-regions" aria-label="Choose a regional afterlife">{rows.map(row=><button type="button" key={row.region_slug} className={row.region_slug===selected.region_slug?'active':''} aria-pressed={row.region_slug===selected.region_slug} onClick={()=>setSelectedSlug(row.region_slug)} style={{'--tab-color':colors[row.region_slug]} as React.CSSProperties}><i/><span>{row.region}</span><small>{row.pathway_label}</small></button>)}</nav>
    <section className="afterlives-path" aria-live="polite">
      <header><div><span>{selected.region} · {selected.place}</span><h5>{selected.pathway_label}</h5></div><b>{selected.time_window}</b></header>
      <div className="afterlives-nodes"><article><small>01 · Before</small><b>{selected.before}</b></article><i aria-hidden="true"/><article><small>02 · Observable break</small><b>{selected.transition}</b></article><i aria-hidden="true"/><article><small>03 · Historical afterlife</small><b>{selected.afterlife}</b></article></div>
    </section>
    <section className="afterlives-readout"><div><span>Interpretation</span><h5>{selected.interpretation}</h5><small>{label(selected.evidence_status)}</small></div><div><span>What the evidence cannot say</span><p>{selected.limits}</p></div><div><span>Source keys</span><b>{selected.source_keys}</b></div></section>
    <section className="afterlives-overview"><header><div><span>Six endings that are not the same ending</span><h5>A capital can fail while people, places, or institutions take another form</h5></div><small>Select any pathway to inspect its evidence limit</small></header><div>{rows.map(row=><button type="button" key={row.region_slug} onClick={()=>setSelectedSlug(row.region_slug)} className={row.region_slug===selected.region_slug?'active':''} style={{'--tab-color':colors[row.region_slug]} as React.CSSProperties}><i/><span>{row.region}</span><b>{row.pathway_label}</b><small>{row.afterlife}</small></button>)}</div></section>
    <div className="cradle-downloads afterlives-downloads"><p><b>Site persistence is not social continuity.</b> A place, population, political order, writing system, and institution can each follow a different clock.</p><a href={dataUrl} download>Afterlives evidence CSV ↓</a></div>
  </div>;
}
