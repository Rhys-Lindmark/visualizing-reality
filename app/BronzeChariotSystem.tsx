'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type ChariotCase={case_id:string;place:string;region:string;date_window:string;evidence_kind:string;anchor_value:string;anchor_label:string;vehicle:string;horses:string;control:string;people:string;upkeep:string;institution:string;interpretation:string;source_keys:string;limits:string};
type SystemKey='vehicle'|'horses'|'control'|'people'|'upkeep'|'institution';

const REVISION='20260830-chariot1';
const dataUrl=`/data/bronze-age/${REVISION}/bronze-chariot-systems.csv`;
const order=['husiatyn','hattusha','pylos','amarna','anyang'];
const colors:Record<string,string>={husiatyn:'#7b6743',hattusha:'#6f7948',pylos:'#6e5c86',amarna:'#b0762e',anyang:'#a4473f'};
const systems:Array<{key:SystemKey;label:string;short:string}>=[
  {key:'vehicle',label:'Vehicle',short:'wheels · axle · body'},
  {key:'horses',label:'Horse team',short:'paired traction'},
  {key:'control',label:'Control gear',short:'bridles · reins · yoke'},
  {key:'people',label:'People',short:'driver · crew · specialist'},
  {key:'upkeep',label:'Upkeep',short:'training · repair · care'},
  {key:'institution',label:'Institution',short:'archive · court · ritual'},
];

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
function label(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}

export default function BronzeChariotSystem(){
  const[rows,setRows]=useState<ChariotCase[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('hattusha');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Chariot-system evidence'}).then(text=>{const parsed=parseCSV<ChariotCase>(text);if(parsed.length!==5||new Set(parsed.map(row=>row.case_id)).size!==5||parsed.some(row=>!row.limits||!row.source_keys||systems.some(system=>!row[system.key])))throw new Error('The chariot-system response used an incompatible schema.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The chariot evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const active=useMemo(()=>rows.find(row=>row.case_id===selected)??rows[0],[rows,selected]);
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state chariot-system-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The chariot evidence did not load':'Loading five chariot evidence windows…'}</b><span>{state==='error'?error:'horses · vehicles · people · upkeep · institutions'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry evidence</button>}</div>;

  return <div className="chariot-system-chart" style={{'--chariot-color':colors[active.case_id]} as React.CSSProperties}>
    <div className="chariot-system-summary"><div><span>Evidence windows</span><b>5</b><small>burials · tablets · archives</small></div><div><span>Shared force-size estimate</span><b>0</b><small>incomparable records stay separate</small></div><div><span>Minimum system</span><b>6 parts</b><small>vehicle to institution</small></div></div>
    <nav className="chariot-system-tabs" aria-label="Choose a Bronze Age chariot evidence window">{order.map(id=>{const row=rows.find(item=>item.case_id===id)!;return <button type="button" key={id} className={selected===id?'active':''} aria-pressed={selected===id} onClick={()=>setSelected(id)} style={{'--tab-color':colors[id]} as React.CSSProperties}><i/><span><b>{row.place}</b><small>{row.date_window}</small></span></button>})}</nav>
    <section className="chariot-system-focus"><header><div><span>{active.region} · {label(active.evidence_kind)}</span><h5>{active.place}: one window onto the system</h5></div><div><b>{active.anchor_value}</b><small>{active.anchor_label}</small></div></header>
      <div className="chariot-system-grid">{systems.map((system,index)=><article key={system.key}><span>{String(index+1).padStart(2,'0')} · {system.label}</span><small>{system.short}</small><b>{active[system.key]}</b></article>)}</div>
      <div className="chariot-system-reading"><div><span>What this evidence supports</span><p>{active.interpretation}</p></div><div><span>Inference limit</span><p>{active.limits}</p></div><div><span>Source keys</span><b>{active.source_keys}</b></div></div>
    </section>
    <section className="chariot-system-ledger"><header><div><span>Five records · different survival filters</span><h5>No single archive preserves the whole machine</h5></div><small>Select a row. Empty evidence is not converted into zero.</small></header><div>{order.map(id=>{const row=rows.find(item=>item.case_id===id)!;return <button type="button" key={id} onClick={()=>setSelected(id)} className={selected===id?'active':''} style={{'--tab-color':colors[id]} as React.CSSProperties}><b>{row.place}</b><span>{label(row.evidence_kind)}</span><strong>{row.anchor_value}</strong><small>{row.anchor_label}</small></button>})}</div></section>
    <div className="cradle-downloads chariot-system-downloads"><p><b>Speed had a supply chain.</b> The rows expose surviving dependencies; they do not estimate battlefield effectiveness, chariot totals, fodder acreage, or military cost.</p><a href={dataUrl} download>Download evidence CSV ↓</a></div>
  </div>;
}
