'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type Circuit={case_id:string;site:string;region:string;date_window:string;focal_flow:string;input:string;aperture:string;transformation:string;visible_output:string;outside_palace:string;evidence_channels:string;anchor_value:string;anchor_label:string;evidence_status:string;source_keys:string;limits:string};
const REVISION='20260830-palace1';
const dataUrl=`/data/bronze-age/${REVISION}/bronze-palace-circuits.csv`;
const order=['mari','hattusha','knossos','pylos','ugarit'];
const colors:Record<string,string>={mari:'#8c5e3c',hattusha:'#6f7948',knossos:'#476f82',pylos:'#7b587d',ugarit:'#a44a42'};
const channelLabels=['Archive','Bulk store','Allocation','Non-palace'];
const channelStates:Record<string,string[]>={mari:['direct','direct','textual','visible'],hattusha:['not selected','direct','inferred','unresolved'],knossos:['direct','not selected','direct','incomplete'],pylos:['direct','textual','direct','visible'],ugarit:['distributed','not selected','networked','direct']};

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
function label(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}

export default function BronzePalaceCircuits(){
  const[rows,setRows]=useState<Circuit[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('mari');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Palace evidence'}).then(text=>{const parsed=parseCSV<Circuit>(text);if(parsed.length!==5||new Set(parsed.map(row=>row.case_id)).size!==5||parsed.some(row=>!row.limits||!row.source_keys||!row.outside_palace))throw new Error('The palace-evidence response used an incompatible schema.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The palace evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const active=useMemo(()=>rows.find(row=>row.case_id===selected)??rows[0],[rows,selected]);
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state palace-circuit-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The palace evidence did not load':'Loading five palace circuits…'}</b><span>{state==='error'?error:'archives · stores · allocations · limits'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry evidence</button>}</div>;
  return <div className="palace-circuit-chart" style={{'--case-color':colors[active.case_id]} as React.CSSProperties}>
    <nav className="palace-circuit-tabs" aria-label="Choose a Bronze Age palace case">{order.map(id=>{const row=rows.find(item=>item.case_id===id)!;return <button type="button" key={id} className={selected===id?'active':''} aria-pressed={selected===id} onClick={()=>setSelected(id)} style={{'--tab-color':colors[id]} as React.CSSProperties}><i/><span><b>{row.site}</b><small>{row.focal_flow}</small></span></button>})}</nav>
    <section className="palace-circuit-focus"><header><div><span>{active.region} · {active.date_window}</span><h5>{active.site}: {active.focal_flow}</h5></div><div><b>{active.anchor_value}</b><small>{active.anchor_label}</small></div></header>
      <div className="palace-circuit-flow"><article><span>01 · Input</span><b>{active.input}</b></article><i>›</i><article className="aperture"><span>02 · Palace aperture</span><b>{active.aperture}</b></article><i>›</i><article><span>03 · Transformation</span><b>{active.transformation}</b></article><i>›</i><article><span>04 · Visible result</span><b>{active.visible_output}</b></article></div>
      <div className="palace-circuit-limit"><div><span>Outside the aperture</span><b>{active.outside_palace}</b></div><div><span>Evidence</span><b>{active.evidence_channels}</b><small>{label(active.evidence_status)}</small></div></div>
    </section>
    <section className="palace-circuit-readout"><div><p>{active.limits}</p></div></section>
    <section className="palace-circuit-overview"><header><div><span>Five apertures · four questions</span><h5>What does each case let us see?</h5></div><small>Labels are evidence classes, not scores.</small></header><div className="palace-evidence-matrix"><div className="matrix-head"><span>Case</span>{channelLabels.map(label=><span key={label}>{label}</span>)}</div>{order.map(id=>{const row=rows.find(item=>item.case_id===id)!;return <button type="button" key={id} onClick={()=>setSelected(id)} className={selected===id?'active':''} style={{'--tab-color':colors[id]} as React.CSSProperties}><b>{row.site}</b>{channelStates[id].map((value,index)=><span key={channelLabels[index]} data-label={channelLabels[index]} className={value.replace(' ','-')}>{value}</span>)}</button>})}</div></section>
  </div>;
}
