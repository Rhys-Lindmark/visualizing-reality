'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type WeightRow={series_id:string;site:string;excavation_series:string;designation:string;ratio:string;mean_g:string;sample_n:string;implied_unit_g:string;source_keys:string;limits:string};
type MonumentRow={signal_id:string;signal:string;archaeological_status:string;observed_evidence:string;source_keys:string;limits:string};
const weightUrl='/data/india/20260831-metrology1/indus-weight-series.csv';
const monumentUrl='/data/india/20260831-metrology1/indus-ruler-monuments.csv';

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}

const series=[
  {id:'HARP',label:'Harappa · HARP',color:'#c52333'},
  {id:'Vats',label:'Harappa · Vats',color:'#d59a35'},
  {id:'Mackay',label:'Mohenjo-daro · Mackay',color:'#315f86'},
];
const ratios=[1,2,4,8,16,32,64,160];
const minUnit=.72,maxUnit=.98,reference=.857;
const position=(value:number)=>`${Math.max(0,Math.min(100,((value-minUnit)/(maxUnit-minUnit))*100))}%`;

export default function IndusMetrology(){
  const[weights,setWeights]=useState<WeightRow[]>([]);const[monuments,setMonuments]=useState<MonumentRow[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[attempt,setAttempt]=useState(0);const[selected,setSelected]=useState('mackay_g');
  useEffect(()=>{const controller=new AbortController();Promise.all([fetchClientText(weightUrl,{signal:controller.signal,label:'Indus weight series'}),fetchClientText(monumentUrl,{signal:controller.signal,label:'Indus monumental-ruler evidence'})]).then(([weightText,monumentText])=>{const parsedWeights=parseCSV<WeightRow>(weightText),parsedMonuments=parseCSV<MonumentRow>(monumentText);if(parsedWeights.length!==24||parsedMonuments.length!==4||parsedWeights.some(row=>!row.series_id||!row.source_keys||!Number.isFinite(Number(row.implied_unit_g)))||parsedMonuments.some(row=>!row.signal_id||!row.observed_evidence||!row.limits))throw new Error('The Indus evidence used an incompatible data contract.');setWeights(parsedWeights);setMonuments(parsedMonuments);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The evidence could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const index=useMemo(()=>new Map(weights.map(row=>[`${row.excavation_series}-${row.ratio}`,row])),[weights]);const active=weights.find(row=>row.series_id===selected)??weights[0];
  const retry=()=>{setWeights([]);setMonuments([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state indus-metrology-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The Indus metrology evidence did not load':'Loading Indus metrology…'}</b><span>{state==='error'?error:'Harappa · Mohenjo-daro · published weight means'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry evidence</button>}</div>;
  return <div className="indus-metrology-chart">
    <section className="indus-weight-plot" aria-label="Implied unit mass across Indus weight classes and excavation series">
      <header><div><span>Observed mean ÷ published ratio</span><h5>Three excavation series converge on one small unit</h5></div><small>The red line marks 0.857 g, Hemmy&apos;s fitted unit.</small></header>
      <div className="indus-series-legend">{series.map(item=><span key={item.id}><i style={{background:item.color}}/>{item.label}</span>)}</div>
      <div className="indus-axis"><span>0.72 g</span><span>0.85 g</span><span>0.98 g</span></div>
      <div className="indus-weight-rows">{ratios.map(ratio=><div className="indus-weight-row" key={ratio}><b>×{ratio}</b><div><i className="indus-reference" style={{left:position(reference)}}/>{series.map(item=>{const row=index.get(`${item.id}-${ratio}`);if(!row)return null;const value=Number(row.implied_unit_g);return <button key={item.id} type="button" className={active.series_id===row.series_id?'active':''} style={{left:position(value),borderColor:item.color,background:item.color}} aria-label={`${item.label}, ratio ${ratio}: ${value.toFixed(3)} grams per unit from ${row.sample_n} specimens`} onClick={()=>setSelected(row.series_id)}><span>{value.toFixed(3)}</span></button>;})}</div></div>)}</div>
      <article className="indus-weight-readout" aria-live="polite"><div><span>{active.site} · {active.excavation_series} · class {active.designation}</span><b>{Number(active.mean_g).toLocaleString(undefined,{maximumFractionDigits:2})} g observed mean</b></div><div><span>Ratio ×{active.ratio}</span><b>{Number(active.implied_unit_g).toFixed(3)} g per unit</b><small>{active.sample_n} published specimens</small></div></article>
    </section>
    <section className="indus-ruler-signals" aria-label="Archaeological signals of monumentalized rulers"><header><span>What a century of archaeology has not securely identified</span><b>Shared measures did not come with visible royal self-advertisement</b></header><div>{monuments.map(row=><article key={row.signal_id}><span>Not securely identified</span><b>{row.signal}</b><p>{row.observed_evidence}</p></article>)}</div></section>
  </div>;
}
