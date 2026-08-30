'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type Dimension='water'|'rainfall'|'crops'|'transport'|'settlement';
type Row={region:string;region_slug:string;dimension:Dimension;dimension_label:string;headline:string;observation:string;evidence_status:string;place:string;time_window:string;source_keys:string;interpretation:string;limits:string};

const REVISION='20260830-cradles-ecology1';
const dataUrl=`/data/cradles/${REVISION.replace('cradles-','')}/cradles-ecology-profiles.csv`;
const dimensionOrder:Dimension[]=['water','rainfall','crops','transport','settlement'];
const dimensionLabels:Record<Dimension,string>={water:'Water regime',rainfall:'Rainfall',crops:'Crops',transport:'Transport',settlement:'Settlement form'};
const dimensionIcons:Record<Dimension,string>={water:'≈',rainfall:'☂',crops:'◇',transport:'↔',settlement:'▦'};
const regionColors:Record<string,string>={mesopotamia:'#b52232',egypt:'#c0842f',indus:'#358080','northern-china':'#6f5b92',mesoamerica:'#56814e',andes:'#376d8e'};

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'&&quoted&&text[index+1]==='"'){cell+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);}
function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}

export default function CradlesEcologyProfiles(){
  const[rows,setRows]=useState<Row[]>([]);
  const[loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading');
  const[error,setError]=useState('');
  const[selectedRegion,setSelectedRegion]=useState('mesopotamia');
  const[selectedDimension,setSelectedDimension]=useState<Dimension>('water');
  const[attempt,setAttempt]=useState(0);

  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Ecology CSV'}).then(parseCSV).then(parsed=>{const regions=new Set(parsed.map(row=>row.region_slug));const cells=new Set(parsed.map(row=>`${row.region_slug}|${row.dimension}`));if(parsed.length!==30||regions.size!==6||cells.size!==30||parsed.some(row=>!row.headline||!row.source_keys||!row.limits))throw new Error('The ecology response used an incompatible schema.');setRows(parsed);setLoadState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The ecology comparison could not be loaded.');setLoadState('error');});return()=>controller.abort();},[attempt]);

  const regions=useMemo(()=>{const seen=new Map<string,string>();for(const row of rows)if(!seen.has(row.region_slug))seen.set(row.region_slug,row.region);return[...seen].map(([slug,name])=>({slug,name}));},[rows]);
  const regionalRows=useMemo(()=>dimensionOrder.map(dimension=>rows.find(row=>row.region_slug===selectedRegion&&row.dimension===dimension)).filter((row):row is Row=>Boolean(row)),[rows,selectedRegion]);
  const comparisonRows=useMemo(()=>regions.map(region=>rows.find(row=>row.region_slug===region.slug&&row.dimension===selectedDimension)).filter((row):row is Row=>Boolean(row)),[rows,regions,selectedDimension]);
  const selected=rows.find(row=>row.region_slug===selectedRegion&&row.dimension===selectedDimension);
  const retry=()=>{setRows([]);setError('');setLoadState('loading');setAttempt(value=>value+1);};

  if(loadState!=='ready'||!selected)return <div className={`data-state cradle-ecology-data-state ${loadState}`} role={loadState==='error'?'alert':'status'}><b>{loadState==='error'?'The ecology profiles did not load':'Loading six ecological fingerprints…'}</b><span>{loadState==='error'?error:'30 sourced observations · no hydraulic score'}</span>{loadState==='error'&&<button type="button" onClick={retry}>Retry comparison</button>}</div>;

  return <div className="cradle-ecology-chart">
    <div className="ecology-summary"><div><span>Regional cases</span><b>6</b><small>read side by side</small></div><div><span>Dimensions</span><b>5</b><small>kept qualitative</small></div><div><span>Aggregate scores</span><b>0</b><small>unlike evidence is not ranked</small></div></div>
    <nav className="ecology-regions" aria-label="Choose an ecological profile">{regions.map(region=><button type="button" key={region.slug} className={region.slug===selectedRegion?'active':''} aria-pressed={region.slug===selectedRegion} onClick={()=>setSelectedRegion(region.slug)} style={{'--region-color':regionColors[region.slug]} as React.CSSProperties}><i/><b>{region.name}</b></button>)}</nav>
    <section className="ecology-fingerprint" aria-label={`${selected.region} ecological fingerprint`}><div className="ecology-fingerprint-heading"><div><span>{selected.region} · five-part profile</span><h5>No single hydraulic recipe</h5></div><small>Select a card to inspect its evidence and limit</small></div><div className="ecology-cards">{regionalRows.map(row=><button type="button" key={row.dimension} className={row.dimension===selectedDimension?'active':''} aria-pressed={row.dimension===selectedDimension} onClick={()=>setSelectedDimension(row.dimension)}><i>{dimensionIcons[row.dimension]}</i><span>{dimensionLabels[row.dimension]}</span><b>{row.headline}</b></button>)}</div></section>
    <section className="ecology-readout" aria-live="polite"><div className="ecology-readout-title"><span>{selected.region} · {selected.dimension_label}</span><h5>{selected.headline}</h5><b>{selected.place} · {selected.time_window}</b><small>{titleCase(selected.evidence_status)}</small></div><div className="ecology-readout-body"><p>{selected.observation}</p><strong>{selected.interpretation}</strong><small><b>Limit:</b> {selected.limits}</small></div><div className="ecology-readout-source"><span>Source keys</span><b>{selected.source_keys}</b></div></section>
    <section className="ecology-compare"><div className="ecology-compare-heading"><div><span>Read across one dimension</span><h5>{dimensionLabels[selectedDimension]}</h5></div><div>{dimensionOrder.map(dimension=><button type="button" key={dimension} className={dimension===selectedDimension?'active':''} aria-pressed={dimension===selectedDimension} onClick={()=>setSelectedDimension(dimension)}>{dimensionLabels[dimension]}</button>)}</div></div><div className="ecology-comparison-rows">{comparisonRows.map(row=><button type="button" key={row.region_slug} className={row.region_slug===selectedRegion?'active':''} aria-pressed={row.region_slug===selectedRegion} onClick={()=>setSelectedRegion(row.region_slug)} style={{'--region-color':regionColors[row.region_slug]} as React.CSSProperties}><i/><span>{row.region}</span><b>{row.headline}</b><small>{row.observation}</small></button>)}</div></section>
    <div className="cradle-downloads ecology-downloads"><p><b>Compare mechanisms, not scores.</b> Every cell keeps its chronology, evidence class, and reason it cannot be generalized.</p><a href={dataUrl} download>Ecology profiles CSV ↓</a></div>
  </div>;
}
