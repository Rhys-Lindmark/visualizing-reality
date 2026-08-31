'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type Milestone='urban_scale'|'political_centralization'|'durable_notation'|'monumental_building'|'bronze';
type Row={region:string;region_slug:string;milestone:Milestone;start_year:string;end_year:string;display_date:string;place:string;observation:string;evidence_status:string;source_keys:string;interpretation:string;limits:string};

const REVISION='20260830-sequence1';
const dataUrl=`/data/cradles/${REVISION}/cradles-sequence-clocks.csv`;
const milestones:Milestone[]=['urban_scale','political_centralization','durable_notation','monumental_building','bronze'];
const labels:Record<Milestone,string>={urban_scale:'Urban scale',political_centralization:'State model',durable_notation:'Notation',monumental_building:'Monumental building',bronze:'Bronze'};
const shortLabels:Record<Milestone,string>={urban_scale:'City',political_centralization:'State',durable_notation:'Signs',monumental_building:'Monument',bronze:'Bronze'};
const colors:Record<Milestone,string>={urban_scale:'#255b83',political_centralization:'#b27a2c',durable_notation:'#b52232',monumental_building:'#6f5b92',bronze:'#358080'};
const MIN_YEAR=-4000,MAX_YEAR=1550,SPAN=MAX_YEAR-MIN_YEAR;

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'&&quoted&&text[index+1]==='"'){cell+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);}
function left(year:string){return `${((Number(year)-MIN_YEAR)/SPAN)*100}%`;}
function width(start:string,end:string){return `${Math.max(1.5,((Number(end)-Number(start))/SPAN)*100)}%`;}
function rankMap(rows:Row[]){const starts=[...new Set(rows.filter(row=>row.start_year).map(row=>Number(row.start_year)))].sort((a,b)=>a-b);return new Map(starts.map((year,index)=>[year,index+1]));}

export default function CradlesSequenceClocks(){
  const[rows,setRows]=useState<Row[]>([]);
  const[loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading');
  const[error,setError]=useState('');
  const[selectedRegion,setSelectedRegion]=useState('mesoamerica');
  const[selectedMilestone,setSelectedMilestone]=useState<Milestone>('bronze');
  const[attempt,setAttempt]=useState(0);

  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Sequence CSV'}).then(parseCSV).then(parsed=>{const regions=new Set(parsed.map(row=>row.region_slug));const cells=new Set(parsed.map(row=>`${row.region_slug}|${row.milestone}`));if(parsed.length!==30||regions.size!==6||cells.size!==30||parsed.some(row=>!row.observation||!row.source_keys||!row.limits))throw new Error('The sequence response used an incompatible schema.');setRows(parsed);setLoadState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The sequence clocks could not be loaded.');setLoadState('error');});return()=>controller.abort();},[attempt]);

  const regions=useMemo(()=>{const seen=new Map<string,string>();for(const row of rows)if(!seen.has(row.region_slug))seen.set(row.region_slug,row.region);return[...seen].map(([slug,name])=>({slug,name}));},[rows]);
  const selectedRows=useMemo(()=>milestones.map(milestone=>rows.find(row=>row.region_slug===selectedRegion&&row.milestone===milestone)).filter((row):row is Row=>Boolean(row)),[rows,selectedRegion]);
  const selected=rows.find(row=>row.region_slug===selectedRegion&&row.milestone===selectedMilestone)??selectedRows[0];
  const choose=(region:string,milestone:Milestone)=>{setSelectedRegion(region);setSelectedMilestone(milestone);};
  const retry=()=>{setRows([]);setError('');setLoadState('loading');setAttempt(value=>value+1);};

  if(loadState!=='ready'||!selected)return <div className={`data-state cradle-sequence-data-state ${loadState}`} role={loadState==='error'?'alert':'status'}><b>{loadState==='error'?'The technology sequence did not load':'Loading regional sequences…'}</b><span>{loadState==='error'?error:'Comparing cities, states, signs, monuments, and bronze'}</span>{loadState==='error'&&<button type="button" onClick={retry}>Retry comparison</button>}</div>;

  return <div className="cradle-sequence-chart">
    <nav className="sequence-regions" aria-label="Choose a regional technology sequence">{regions.map(region=><button type="button" key={region.slug} aria-pressed={region.slug===selectedRegion} className={region.slug===selectedRegion?'active':''} onClick={()=>setSelectedRegion(region.slug)}><b>{region.name}</b><small>{rows.filter(row=>row.region_slug===region.slug&&row.start_year).sort((a,b)=>Number(a.start_year)-Number(b.start_year))[0]?.display_date}</small></button>)}</nav>
    <section className="sequence-focus">
      <div className="sequence-heading"><div><span>{selected.region}</span><h5>Cities and states could precede writing or bronze</h5></div></div>
      <div className="sequence-axis">{[-4000,-3000,-2000,-1000,1,1000,1550].map(year=><span key={year} style={{left:`${((year-MIN_YEAR)/SPAN)*100}%`}}>{year<0?`${Math.abs(year)} BCE`:year===1?'1 CE':`${year} CE`}</span>)}</div>
      <div className="sequence-lanes">{selectedRows.map(row=>{const gap=row.evidence_status==='evidence_gap';return <div className="sequence-lane" key={row.milestone}><div><i style={{background:colors[row.milestone]}}/><b>{labels[row.milestone]}</b></div><div>{gap?<button type="button" className={`gap ${selected===row?'active':''}`} aria-pressed={selected===row} onClick={()=>setSelectedMilestone(row.milestone)}>Undated evidence gap</button>:<button type="button" className={selected===row?'active':''} aria-pressed={selected===row} onClick={()=>setSelectedMilestone(row.milestone)} style={{left:left(row.start_year),width:width(row.start_year,row.end_year),'--sequence-color':colors[row.milestone]} as React.CSSProperties}><span>{row.display_date}</span></button>}</div></div>})}</div>
      <div className="sequence-readout"><div><span>{labels[selected.milestone]}</span><h5>{selected.observation}</h5><b>{selected.place} · {selected.display_date}</b></div><div><p>{selected.interpretation}</p></div></div>
    </section>
    <section className="sequence-signatures" aria-labelledby="sequence-signatures-title"><div className="sequence-signature-heading"><div><span>Six ordinal signatures</span><h5 id="sequence-signatures-title">What becomes visible first?</h5></div><small>Ties share a number · missing evidence stays “?”</small></div>{regions.map(region=>{const regional=milestones.map(milestone=>rows.find(row=>row.region_slug===region.slug&&row.milestone===milestone)).filter((row):row is Row=>Boolean(row));const ranks=rankMap(regional);return <article key={region.slug}><b>{region.name}</b><div>{regional.sort((a,b)=>a.start_year&&b.start_year?Number(a.start_year)-Number(b.start_year):a.start_year?-1:1).map(row=><button type="button" key={row.milestone} className={selected===row?'active':''} onClick={()=>choose(region.slug,row.milestone)} aria-label={`${region.name}: ${labels[row.milestone]}, ${row.display_date}`} style={{'--sequence-color':colors[row.milestone]} as React.CSSProperties}><i>{row.start_year?ranks.get(Number(row.start_year)):'?'}</i><span>{shortLabels[row.milestone]}</span><small>{row.display_date}</small></button>)}</div></article>})}</section>
  </div>;
}
