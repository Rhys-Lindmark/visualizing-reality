'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type PhaseRow={phase_id:string;year_start:string;year_end:string;display_period:string;phase_title:string;political_order:string;urban_evidence:string;named_examples:string;quantitative_anchor:string;source_keys:string;limits:string};
const dataUrl='/data/india/20260831-urban1/early-historic-urban-phases.csv';

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}

export default function IndiaUrbanRevival(){
  const[rows,setRows]=useState<PhaseRow[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[attempt,setAttempt]=useState(0);const[selectedId,setSelectedId]=useState('phase_1');
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Early Historic urban phases'}).then(text=>{const parsed=parseCSV<PhaseRow>(text);if(parsed.length!==3||parsed.some(row=>!row.phase_id||!row.phase_title||!row.political_order||!row.urban_evidence||!row.source_keys))throw new Error('The urban-revival evidence used an incompatible data contract.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const selected=useMemo(()=>rows.find(row=>row.phase_id===selectedId)??rows[0],[rows,selectedId]);const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!selected)return <div className={`data-state india-urban-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The urban-revival evidence did not load':'Loading Early Historic cities…'}</b><span>{state==='error'?error:'urban fabric · political order · three phases'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry evidence</button>}</div>;
  return <div className="india-urban-chart">
    <nav aria-label="Choose an Early Historic urban phase">{rows.map(row=><button type="button" key={row.phase_id} className={selected.phase_id===row.phase_id?'active':''} aria-pressed={selected.phase_id===row.phase_id} onClick={()=>setSelectedId(row.phase_id)}><span>{row.display_period}</span><b>{row.phase_title}</b></button>)}</nav>
    <section aria-live="polite"><header><div><span>{selected.display_period}</span><h5>{selected.phase_title}</h5></div><strong>{selected.quantitative_anchor}</strong></header><div className="india-urban-lanes"><article><span>Political order</span><p>{selected.political_order}</p></article><article><span>Urban evidence</span><p>{selected.urban_evidence}</p></article></div><footer><span>Named examples</span><p>{selected.named_examples}</p></footer></section>
  </div>;
}
