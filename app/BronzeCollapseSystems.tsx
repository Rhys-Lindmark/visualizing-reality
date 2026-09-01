'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type CollapseCase={case_id:string;place:string;region:string;start_year:string;end_year:string;date_window:string;evidence_kind:string;anchor_value:string;anchor_label:string;environment:string;conflict:string;institution:string;persistence:string;interpretation:string;source_keys:string;limits:string};
type Lens='environment'|'conflict'|'institution'|'persistence';

const REVISION='20260830-collapse1';
const dataUrl=`/data/bronze-age/${REVISION}/bronze-collapse-windows.csv`;
const order=['eastern-mediterranean','pylos','hattusa','ugarit-gibala','hala-sultan-tekke','egypt'];
const colors:Record<string,string>={'eastern-mediterranean':'#355f7d',pylos:'#725d86',hattusa:'#7c713f','ugarit-gibala':'#a84a42','hala-sultan-tekke':'#4e7a6b',egypt:'#b3792f'};
const lenses:Array<{key:Lens;label:string;short:string}>=[{key:'environment',label:'Environment',short:'regional stress'},{key:'conflict',label:'Conflict',short:'texts · destruction'},{key:'institution',label:'Institution',short:'archives · courts'},{key:'persistence',label:'What persisted',short:'survival · reorganization'}];

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
function year(value:number){return `${Math.abs(value)} BCE`;}
function label(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}
function position(value:number){return `${((value+1250)/200)*100}%`;}

export default function BronzeCollapseSystems(){
  const[rows,setRows]=useState<CollapseCase[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('eastern-mediterranean');const[lens,setLens]=useState<Lens>('persistence');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Late Bronze Age chronology'}).then(text=>{const parsed=parseCSV<CollapseCase>(text);if(parsed.length!==6||new Set(parsed.map(row=>row.case_id)).size!==6||parsed.some(row=>!row.limits||!row.source_keys||lenses.some(item=>!row[item.key])||!Number.isFinite(Number(row.start_year))||!Number.isFinite(Number(row.end_year))))throw new Error('The collapse chronology used an incompatible schema.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The chronology could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const active=useMemo(()=>rows.find(row=>row.case_id===selected)??rows[0],[rows,selected]);
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state collapse-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The collapse chronology did not load':'Loading six evidence windows…'}</b><span>{state==='error'?error:'different dates · different evidence · different outcomes'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry chronology</button>}</div>;

  return <div className="collapse-chart" style={{'--collapse-color':colors[active.case_id]} as React.CSSProperties}>
    <nav className="collapse-tabs" aria-label="Choose a Late Bronze Age evidence window">{order.map(id=>{const row=rows.find(item=>item.case_id===id)!;return <button type="button" key={id} className={selected===id?'active':''} aria-pressed={selected===id} onClick={()=>setSelected(id)} style={{'--tab-color':colors[id]} as React.CSSProperties}><i/><span><b>{row.place}</b><small>{row.date_window}</small></span></button>})}</nav>
    <section className="collapse-timeline" aria-label="Evidence windows from 1250 to 1050 BCE"><header><div><span>Not one year</span><h5>Different breaks on one chronology</h5></div><small>Bands are source windows, not annual measurements.</small></header><div className="collapse-axis"><div className="collapse-ticks">{[-1250,-1200,-1150,-1100,-1050].map(tick=><span key={tick} style={{left:position(tick)}}>{year(tick)}</span>)}</div>{order.map(id=>{const row=rows.find(item=>item.case_id===id)!;const start=Number(row.start_year),end=Number(row.end_year);return <button type="button" key={id} className={selected===id?'active':''} onClick={()=>setSelected(id)}><b>{row.place}</b><span className="collapse-track"><i style={{left:position(start),width:`calc(${position(end)} - ${position(start)} + 4px)`,background:colors[id]}}/></span><small>{row.date_window}</small></button>})}</div></section>
    <section className="collapse-focus"><header><div><span>{active.region} · {label(active.evidence_kind)}</span><h5>{active.place}</h5></div><div><b>{active.anchor_value}</b><small>{active.anchor_label}</small></div></header><p className="collapse-reading">{active.interpretation}</p>
      <nav className="collapse-lenses" aria-label="Choose an evidence lens">{lenses.map(item=><button type="button" key={item.key} className={lens===item.key?'active':''} aria-pressed={lens===item.key} onClick={()=>setLens(item.key)}><span>{item.label}</span><small>{item.short}</small></button>)}</nav>
      <div className="collapse-evidence"><span>{lenses.find(item=>item.key===lens)!.label}</span><p>{active[lens]}</p></div>
      <div className="collapse-limit"><div><p>{active.limits}</p></div></div>
    </section>
  </div>;
}
