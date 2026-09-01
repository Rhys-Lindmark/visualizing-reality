'use client';

import { useEffect, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type SatrapyCase={case_id:string;sort_order:string;case_name:string;date_label:string;start_year:string;end_year:string;region:string;top_office:string;local_partners:string;obligation_or_problem:string;royal_connection:string;visible_action:string;evidence_class:string;source_keys:string;interpretation:string;limits:string};
const REVISION='20260830-satrapies1';
const dataUrl=`/data/persia/${REVISION}/persian-satrapal-portfolios.csv`;
const colors:Record<string,string>={bactria_margiana_crisis:'#bd1f2e',ionia_land_tribute:'#39728b',egypt_arsames:'#9b733b',caria_hecatomnids:'#806695',dascylium_estate:'#567b6d'};

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
const label=(value:string)=>value.replaceAll('_',' ');

export default function PersianSatrapalPortfolios(){
  const[rows,setRows]=useState<SatrapyCase[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('egypt_arsames');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Satrapal governance portfolios'}).then(text=>{const parsed=parseCSV<SatrapyCase>(text).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));if(parsed.length!==5||new Set(parsed.map(row=>row.case_id)).size!==5||parsed.some(row=>!row.top_office||!row.local_partners||!row.royal_connection||!row.visible_action||!row.source_keys||!row.limits))throw new Error('The satrapy response used an incompatible evidence contract.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The satrapy comparison could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const active=rows.find(row=>row.case_id===selected)??rows[0];
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state persia-satrapy-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The satrapal portfolios did not load':'Loading five provincial portfolios…'}</b><span>{state==='error'?error:'top office · local partners · obligations · royal connection · visible action'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry portfolios</button>}</div>;
  const circuit=[['01 · Top office',active.top_office],['02 · Local partners',active.local_partners],['03 · Obligation or problem',active.obligation_or_problem],['04 · Royal connection',active.royal_connection],['05 · Visible action',active.visible_action]];
  return <div className="persia-satrapy-chart" style={{'--satrapy-color':colors[active.case_id]} as React.CSSProperties}>
    <nav className="persia-satrapy-tabs" aria-label="Choose a satrapal governance portfolio">{rows.map(row=><button type="button" key={row.case_id} className={selected===row.case_id?'active':''} onClick={()=>setSelected(row.case_id)} style={{'--case-color':colors[row.case_id]} as React.CSSProperties}><span>{row.date_label}</span><b>{row.case_name}</b><small>{row.region}</small></button>)}</nav>
    <section className="persia-satrapy-focus"><header><div><span>{active.region} · {active.date_label}</span><h5>{active.case_name}</h5></div><div><b>{label(active.evidence_class)}</b><small>evidence class</small></div></header><p>{active.interpretation}</p><div className="persia-satrapy-circuit">{circuit.map(([stage,copy],index)=><div className="persia-satrapy-stage" key={stage}><article><span>{stage}</span><p>{copy}</p></article>{index<circuit.length-1&&<i aria-hidden="true">→</i>}</div>)}</div></section>
    <section className="persia-satrapy-atlas"><header><div><span>Five administrative interfaces</span><h5>One empire, unlike provincial bargains</h5></div><small>select a row · differences are not ranks</small></header><div>{rows.map(row=><button type="button" key={row.case_id} className={selected===row.case_id?'active':''} onClick={()=>setSelected(row.case_id)}><i style={{background:colors[row.case_id]}}/><span><b>{row.case_name}</b><small>{row.date_label}</small></span><p>{row.local_partners}</p></button>)}</div></section>
  </div>;
}
