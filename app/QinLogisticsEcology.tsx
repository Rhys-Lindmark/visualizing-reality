'use client';

import { useEffect, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type LogisticsRow={record_id:string;sort_order:string;system:string;role:string;date_start:string;date_end:string;date_label:string;place:string;evidence_class:string;observed_anchor:string;input:string;transformation:string;output:string;measure_label:string;measure_value:string;source_keys:string;interpretation:string;limits:string};
const dataUrl='/data/qin-han/20260830-logistics1/qin-logistics-ecology.csv';
const timelineStart=-360,timelineEnd=50;

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
const yearLabel=(year:number)=>year<0?`${Math.abs(year)} BCE`:`${year} CE`;
const left=(year:number)=>`${Math.max(0,Math.min(100,(year-timelineStart)/(timelineEnd-timelineStart)*100))}%`;

export default function QinLogisticsEcology(){
  const[rows,setRows]=useState<LogisticsRow[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('zhengguo');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Qin and Han logistics evidence'}).then(text=>{const parsed=parseCSV<LogisticsRow>(text).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));if(parsed.length!==8||parsed.some(row=>!row.record_id||!row.system||!row.observed_anchor||!row.input||!row.transformation||!row.output||!row.source_keys||!row.limits))throw new Error('The logistics response used an incompatible evidence contract.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const active=rows.find(row=>row.record_id===selected)??rows[0];const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state qin-logistics-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The logistics evidence did not load':'Loading fields, stores, routes, and work…'}</b><span>{state==='error'?error:'production · storage · transport · maintenance'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry logistics</button>}</div>;
  return <div className="qin-logistics-chart">
    <div className="qin-logistics-thesis"><span>Not one megaproject</span><strong>Reach came from a loop: produce → record → store → move → maintain.</strong></div>
    <nav className="qin-logistics-tabs" aria-label="Choose one logistics evidence window">{rows.map((row,index)=><button type="button" key={row.record_id} className={selected===row.record_id?'active':''} onClick={()=>setSelected(row.record_id)}><span>{String(index+1).padStart(2,'0')}</span><b>{row.role}</b><small>{row.place}</small></button>)}</nav>
    <section className="qin-logistics-flow"><article><span>Inputs</span><b>{active.input}</b></article><i aria-hidden="true">→</i><article><span>Interface</span><b>{active.transformation}</b></article><i aria-hidden="true">→</i><article><span>Reach</span><b>{active.output}</b></article></section>
    <section className="qin-logistics-focus"><div><span>{active.system}</span><h5>{active.place}</h5><p>{active.observed_anchor}</p></div><aside><span>{active.measure_label}</span><b>{active.measure_value}</b><small>{active.date_label}</small></aside></section>
    <section className="qin-logistics-timeline"><header><div><span>Chronology</span><b>Infrastructure accumulated across generations.</b></div><small>360 BCE</small><small>50 CE</small></header><div className="qin-logistics-axis"><i style={{left:left(-221)}}/><em style={{left:left(-221)}}>Qin empire</em>{rows.map(row=>{const start=Number(row.date_start),end=Number(row.date_end);return <button type="button" key={row.record_id} className={`${row.system.toLowerCase()} ${selected===row.record_id?'active':''}`} style={{left:left(start),width:`max(10px, calc(${left(end)} - ${left(start)}))`}} onClick={()=>setSelected(row.record_id)} aria-label={`${row.role}, ${row.date_label}`}><span>{row.role}</span></button>})}</div><div className="qin-logistics-years"><span>{yearLabel(timelineStart)}</span><span>{yearLabel(-221)}</span><span>{yearLabel(timelineEnd)}</span></div></section>
  </div>;
}
