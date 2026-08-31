'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type CropRow={observation_id:string;region:string;site:string;phase:string;season_strategy:string;rabi_crops:string;kharif_crops:string;numeric_measure:string;numeric_value:string;interpretation:string;source_keys:string;limits:string};
const dataUrl='/data/india/20260831-monsoon1/indus-cropping-strategies.csv';

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}

const sites=['Harappa','Khirsara','Masudpur VII'];
const summaries:Record<string,string>={Harappa:'Urban supply leaned toward winter wheat and barley.',Khirsara:'One Gujarat settlement shifted from winter barley toward summer crops.', 'Masudpur VII':'Farmers repeatedly used both winter and summer growing windows.'};

export default function IndiaMonsoonStrategies(){
  const[rows,setRows]=useState<CropRow[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[attempt,setAttempt]=useState(0);const[site,setSite]=useState('Harappa');
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Indus cropping strategies'}).then(text=>{const parsed=parseCSV<CropRow>(text);if(parsed.length!==7||parsed.some(row=>!row.observation_id||!row.site||!row.phase||!row.season_strategy||!row.source_keys))throw new Error('The crop-calendar evidence used an incompatible data contract.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const selected=useMemo(()=>rows.filter(row=>row.site===site),[rows,site]);
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready')return <div className={`data-state india-monsoon-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The Indus crop-calendar evidence did not load':'Loading crop calendars…'}</b><span>{state==='error'?error:'Harappa · Gujarat · northeast Indus'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry evidence</button>}</div>;
  return <div className="india-monsoon-chart">
    <nav aria-label="Choose an Indus crop-calendar case">{sites.map(name=><button type="button" key={name} className={site===name?'active':''} aria-pressed={site===name} onClick={()=>setSite(name)}><b>{name}</b><span>{summaries[name]}</span></button>)}</nav>
    <section aria-live="polite"><header><span>{selected[0]?.region} · archaeobotanical synthesis</span><h5>{summaries[site]}</h5></header><div className="india-season-grid">{selected.map(row=><article key={row.observation_id}><span>{row.phase}</span><b>{row.season_strategy}</b><div><small>Winter · rabi</small><p>{row.rabi_crops||'—'}</p></div><div><small>Summer · kharif</small><p>{row.kharif_crops||'—'}</p></div>{row.numeric_value&&<strong>{row.numeric_value}% <small>{row.numeric_measure==='kharif_millet_max_pct'?'maximum millet share':'barley share'}</small></strong>}<em>{row.interpretation}</em></article>)}</div></section>
  </div>;
}
