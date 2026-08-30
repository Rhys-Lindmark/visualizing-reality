'use client';

import { useEffect, useMemo, useState } from 'react';

type Row={region:string;region_slug:string;route_slug:string;route_label:string;input:string;coordinator:string;outcome:string;observation:string;evidence_status:string;place:string;time_window:string;source_keys:string;interpretation:string;limits:string};

const REVISION='20260830-coordination1';
const dataUrl=`/data/cradles/${REVISION}/cradles-coordination-routes.csv`;
const regionColors:Record<string,string>={mesopotamia:'#b52232',egypt:'#c0842f',indus:'#358080','northern-china':'#6f5b92',mesoamerica:'#56814e',andes:'#376d8e'};

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'&&quoted&&text[index+1]==='"'){cell+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);}
function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}

export default function CradlesCoordinationRoutes(){
  const[rows,setRows]=useState<Row[]>([]);
  const[loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading');
  const[error,setError]=useState('');
  const[selectedRegion,setSelectedRegion]=useState('mesopotamia');
  const[selectedRoute,setSelectedRoute]=useState('archive-accounting');
  const[attempt,setAttempt]=useState(0);

  useEffect(()=>{const controller=new AbortController();fetch(dataUrl,{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error(`Coordination CSV returned ${response.status}`);const text=await response.text();if(!text.trim()||text.trimStart().startsWith('<'))throw new Error('Coordination data did not return CSV');return parseCSV(text);}).then(parsed=>{const regions=new Set(parsed.map(row=>row.region_slug));const routes=new Set(parsed.map(row=>`${row.region_slug}|${row.route_slug}`));if(parsed.length!==24||regions.size!==6||routes.size!==24||parsed.some(row=>!row.input||!row.coordinator||!row.outcome||!row.limits))throw new Error('The coordination response used an incompatible schema.');setRows(parsed);setLoadState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The coordination comparison could not be loaded.');setLoadState('error');});return()=>controller.abort();},[attempt]);

  const regions=useMemo(()=>{const seen=new Map<string,string>();for(const row of rows)if(!seen.has(row.region_slug))seen.set(row.region_slug,row.region);return[...seen].map(([slug,name])=>({slug,name}));},[rows]);
  const regionalRows=useMemo(()=>rows.filter(row=>row.region_slug===selectedRegion),[rows,selectedRegion]);
  const selected=regionalRows.find(row=>row.route_slug===selectedRoute)??regionalRows[0];
  const chooseRegion=(slug:string)=>{setSelectedRegion(slug);const first=rows.find(row=>row.region_slug===slug);if(first)setSelectedRoute(first.route_slug);};
  const retry=()=>{setRows([]);setError('');setLoadState('loading');setAttempt(value=>value+1);};

  if(loadState!=='ready'||!selected)return <div className={`data-state cradle-coordination-data-state ${loadState}`} role={loadState==='error'?'alert':'status'}><b>{loadState==='error'?'The coordination routes did not load':'Loading six institutional portfolios…'}</b><span>{loadState==='error'?error:'24 sourced routes · no state-capacity score'}</span>{loadState==='error'&&<button type="button" onClick={retry}>Retry routes</button>}</div>;

  return <div className="coordination-chart" style={{'--region-color':regionColors[selectedRegion]} as React.CSSProperties}>
    <div className="coordination-summary"><div><span>Regional portfolios</span><b>6</b><small>kept historically specific</small></div><div><span>Inspectible routes</span><b>24</b><small>inputs → institutions → outcomes</small></div><div><span>Common-scale scores</span><b>0</b><small>evidence is not ranked</small></div></div>
    <nav className="coordination-regions" aria-label="Choose a coordination portfolio">{regions.map(region=><button type="button" key={region.slug} className={region.slug===selectedRegion?'active':''} aria-pressed={region.slug===selectedRegion} onClick={()=>chooseRegion(region.slug)} style={{'--tab-color':regionColors[region.slug]} as React.CSSProperties}><i/><b>{region.name}</b></button>)}</nav>
    <section className="coordination-portfolio" aria-label={`${selected.region} coordination portfolio`}>
      <div className="coordination-heading"><div><span>{selected.region} · four evidence routes</span><h5>Surplus had to be organized</h5></div><small>Select a route to inspect what the evidence does—and does not—show</small></div>
      <div className="coordination-column-heads" aria-hidden="true"><span>Inputs</span><span>Coordinator</span><span>Visible outcome</span></div>
      <div className="coordination-routes">{regionalRows.map((row,index)=><button type="button" key={row.route_slug} className={row.route_slug===selected.route_slug?'active':''} aria-pressed={row.route_slug===selected.route_slug} onClick={()=>setSelectedRoute(row.route_slug)}><span className="route-number">0{index+1}</span><span className="route-node"><small>{row.route_label}</small><b>{row.input}</b></span><i aria-hidden="true"/><span className="route-node route-center"><small>Through</small><b>{row.coordinator}</b></span><i aria-hidden="true"/><span className="route-node"><small>Made possible</small><b>{row.outcome}</b></span></button>)}</div>
    </section>
    <section className="coordination-readout" aria-live="polite"><div className="coordination-readout-title"><span>{selected.region} · {selected.route_label}</span><h5>{selected.coordinator}</h5><b>{selected.place} · {selected.time_window}</b><small>{titleCase(selected.evidence_status)}</small></div><div className="coordination-readout-body"><p>{selected.observation}</p><strong>{selected.interpretation}</strong><small><b>Limit:</b> {selected.limits}</small></div><div className="coordination-readout-source"><span>Source keys</span><b>{selected.source_keys}</b></div></section>
    <section className="coordination-overview"><div><span>Six portfolios, not a league table</span><h5>Different institutions solved different coordination problems</h5></div><div className="coordination-mini-grid">{regions.map(region=><button type="button" key={region.slug} className={region.slug===selectedRegion?'active':''} aria-pressed={region.slug===selectedRegion} onClick={()=>chooseRegion(region.slug)} style={{'--tab-color':regionColors[region.slug]} as React.CSSProperties}><span><i/>{region.name}</span>{rows.filter(row=>row.region_slug===region.slug).map(row=><small key={row.route_slug}>{row.route_label}</small>)}</button>)}</div></section>
    <div className="cradle-downloads coordination-downloads"><p><b>Routes are not prevalence.</b> Four rows per region make an inspectable portfolio; they do not imply equal evidence or equal capacity.</p><a href={dataUrl} download>Coordination routes CSV ↓</a></div>
  </div>;
}
