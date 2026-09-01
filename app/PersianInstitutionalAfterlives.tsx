'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type Episode={thread_id:string;thread_order:string;thread_title:string;episode_id:string;episode_order:string;start_year:string;end_year:string;date_label:string;regime:string;relationship:string;observed_change:string;evidence:string;source_keys:string;limits:string};
const REVISION='20260830-afterlives1';
const dataUrl=`/data/persia/${REVISION}/persian-institutional-afterlives.csv`;
const start=-550,end=651,span=end-start;
const colors:Record<string,string>={baseline:'#173f67',retained:'#2f7186',reallocated:'#6f7780',adapted:'#4e7567',experiment:'#a27438',stopped:'#a52836',descended:'#745c89',transformed:'#8a6b38',recombined:'#6c6e3f',gap:'#c8cdd0',revived:'#9d414b',redesigned:'#3f6380'};
const ticks=[-550,-330,-140,0,224,651];

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
const yearLabel=(year:number)=>year<0?`${Math.abs(year)} BCE`:year===0?'1 CE':`${year} CE`;
const relLabel=(value:string)=>value.replaceAll('_',' ');

export default function PersianInstitutionalAfterlives(){
  const[rows,setRows]=useState<Episode[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('provinces');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Persian institutional afterlives'}).then(text=>{const parsed=parseCSV<Episode>(text).sort((a,b)=>Number(a.thread_order)-Number(b.thread_order)||Number(a.episode_order)-Number(b.episode_order));if(parsed.length!==18||new Set(parsed.map(row=>row.thread_id)).size!==5||parsed.some(row=>!row.observed_change||!row.evidence||!row.source_keys||!row.limits))throw new Error('The afterlives response used an incompatible evidence contract.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The institutional afterlives could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const groups=useMemo(()=>{const map=new Map<string,Episode[]>();for(const row of rows){const list=map.get(row.thread_id)??[];list.push(row);map.set(row.thread_id,list);}return [...map.entries()];},[rows]);
  const active=groups.find(([id])=>id===selected)?.[1]??groups[0]?.[1];
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state persia-afterlife-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The institutional timeline did not load':'Loading five institutional pathways…'}</b><span>{state==='error'?error:'retained · adapted · descended · revived · stopped'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry afterlives</button>}</div>;
  return <div className="persia-afterlife-chart">
    <div className="persia-afterlife-thesis"><span>The dynasty ended in 330 BCE</span><strong>The toolkit fractured, branched, and was recombined.</strong></div>
    <section className="persia-afterlife-timeline" aria-label="Five institutional afterlife timelines">
      <header><div><span>550 BCE</span><b>Achaemenid rule</b></div><p>330 BCE · dynasty ends</p><small>651 CE</small></header>
      <div className="persia-afterlife-ticks" aria-hidden="true">{ticks.map(tick=><i key={tick} style={{left:`${((tick-start)/span)*100}%`}}><span>{yearLabel(tick)}</span></i>)}</div>
      {groups.map(([id,episodes])=><button type="button" key={id} className={selected===id?'active':''} onClick={()=>setSelected(id)}><span><b>{episodes[0].thread_title}</b><small>{episodes.length} evidence windows</small></span><div className="persia-afterlife-track">{episodes.map(episode=><i key={episode.episode_id} className={episode.relationship==='gap'?'gap':''} title={`${episode.regime}: ${episode.observed_change}`} style={{left:`${((Number(episode.start_year)-start)/span)*100}%`,width:`${Math.max(((Number(episode.end_year)-Number(episode.start_year))/span)*100,1.3)}%`,background:colors[episode.relationship]}}><em>{episode.regime}</em></i>)}</div></button>)}
    </section>
    <nav className="persia-afterlife-tabs" aria-label="Choose one institutional pathway">{groups.map(([id,episodes])=><button type="button" key={id} className={selected===id?'active':''} onClick={()=>setSelected(id)}><span>0{episodes[0].thread_order}</span><b>{episodes[0].thread_title}</b></button>)}</nav>
    <section className="persia-afterlife-focus"><header><div><span>Selected pathway</span><h5>{active[0].thread_title}</h5></div><small>{active.length} windows · arrows are not a strength score</small></header><div className="persia-afterlife-chain">{active.map((episode,index)=><article key={episode.episode_id} style={{'--episode-color':colors[episode.relationship]} as React.CSSProperties}><div><span>{episode.date_label}</span><b>{relLabel(episode.relationship)}</b></div><h6>{episode.regime}</h6><p>{episode.observed_change}</p><small>{episode.evidence}</small>{index<active.length-1&&<i aria-hidden="true">→</i>}</article>)}</div></section>
  </div>;
}
