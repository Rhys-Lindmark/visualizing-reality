'use client';

import { useEffect, useMemo, useState } from 'react';
import ChartFooter from './components/ChartFooter';
import { fetchClientText } from './lib/clientAsset';
import { romeDataUrl } from './lib/romeDataClient';

type GrowthRow={
  polity:string;
  segment:string;
  anchor_year:string;
  elapsed_years:string;
  area_million_km2:string;
  share_of_series_peak:string;
  source_keys:string;
  source_page:string;
  note:string;
};

const dataUrl=romeDataUrl('/data/rome-territorial-growth.csv');
const colors:Record<string,string>={'Achaemenid Persia':'#8b6b9d',Rome:'#bd1f2e','Western Han':'#34708f'};
const polities=['Achaemenid Persia','Western Han','Rome'];

function parseCSV<T>(text:string):T[]{
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const character=text[index];if(character==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(character==='"')quoted=!quoted;else if(character===','&&!quoted){row.push(cell);cell='';}else if((character==='\n'||character==='\r')&&!quoted){if(character==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=character;}
  if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);
}

function yearLabel(year:number){return year<0?`${Math.abs(year)} BCE`:year===0?'1 BCE / 1 CE':`${year} CE`;}

export default function RomanGrowthComparison(){
  const[rows,setRows]=useState<GrowthRow[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[attempt,setAttempt]=useState(0);const[metric,setMetric]=useState<'area'|'share'>('share');const[focus,setFocus]=useState('All');
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Roman territorial-growth comparison'}).then(text=>{const parsed=parseCSV<GrowthRow>(text);if(parsed.length!==25||new Set(parsed.map(item=>item.polity)).size!==3||parsed.some(item=>!Number.isFinite(Number(item.elapsed_years))||!Number.isFinite(Number(item.area_million_km2))||!Number.isFinite(Number(item.share_of_series_peak))||!item.source_keys))throw new Error('The territorial-growth response used an incompatible schema.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The territorial-growth comparison could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const grouped=useMemo(()=>Object.fromEntries(polities.map(polity=>[polity,rows.filter(row=>row.polity===polity).sort((a,b)=>Number(a.elapsed_years)-Number(b.elapsed_years))])) as Record<string,GrowthRow[]>,[rows]);
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready')return <div className={`data-state territorial-growth-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The growth comparison did not load':'Loading three territorial curves…'}</b><span>{state==='error'?error:'Persia · Han · Rome'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry comparison</button>}</div>;
  const width=760,height=390,left=58,right=28,top=28,bottom=54,plotWidth=width-left-right,plotHeight=height-top-bottom;const x=(value:number)=>left+value/650*plotWidth;const yMax=metric==='area'?6.5:100;const y=(value:number)=>top+(1-value/yMax)*plotHeight;const yTicks=metric==='area'?[0,1,2,3,4,5,6]:[0,25,50,75,100];const xTicks=[0,100,200,300,400,500,600];const visible=focus==='All'?polities:[focus];
  return <div className="territorial-growth-chart">
    <div className="territorial-growth-controls"><div role="group" aria-label="Choose the territorial-growth metric"><button type="button" className={metric==='share'?'active':''} onClick={()=>setMetric('share')}>Share of each peak</button><button type="button" className={metric==='area'?'active':''} onClick={()=>setMetric('area')}>Territory</button></div><nav aria-label="Highlight one polity"><button type="button" className={focus==='All'?'active':''} onClick={()=>setFocus('All')}>All</button>{polities.map(polity=><button type="button" key={polity} className={focus===polity?'active':''} onClick={()=>setFocus(polity)}><i style={{background:colors[polity]}}/>{polity.replace('Achaemenid ','')}</button>)}</nav></div>
    <div className="territorial-growth-plot"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric==='area'?'Territorial area':'Share of selected peak area'} over years since the first published anchor for Achaemenid Persia, Western Han, and Rome`}>
      {yTicks.map(tick=><g key={tick}><line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} className="growth-grid"/><text x={left-10} y={y(tick)+4} textAnchor="end" className="growth-axis-label">{metric==='area'?`${tick}m`:`${tick}%`}</text></g>)}
      {xTicks.map(tick=><g key={tick}><line x1={x(tick)} x2={x(tick)} y1={top} y2={height-bottom} className="growth-grid vertical"/><text x={x(tick)} y={height-bottom+24} textAnchor="middle" className="growth-axis-label">{tick}</text></g>)}
      <text x={left} y={16} className="growth-axis-title">{metric==='area'?'million km²':'share of selected peak'}</text><text x={left+plotWidth/2} y={height-9} textAnchor="middle" className="growth-axis-title">years after first published anchor</text>
      {visible.map(polity=>{const points=grouped[polity];const line=points.map((row,index)=>`${index?'L':'M'} ${x(Number(row.elapsed_years))} ${y(Number(metric==='area'?row.area_million_km2:row.share_of_series_peak))}`).join(' ');return <g key={polity} className="growth-series"><path d={line} style={{stroke:colors[polity]}}/>{points.map(row=><circle key={`${polity}-${row.anchor_year}`} cx={x(Number(row.elapsed_years))} cy={y(Number(metric==='area'?row.area_million_km2:row.share_of_series_peak))} r={4.5} style={{fill:colors[polity]}}><title>{polity}: {yearLabel(Number(row.anchor_year))}, {Number(row.area_million_km2).toLocaleString()} million km²</title></circle>)}<text x={Math.min(width-right-4,x(Number(points.at(-1)?.elapsed_years))+8)} y={y(Number(metric==='area'?points.at(-1)?.area_million_km2:points.at(-1)?.share_of_series_peak))-8} textAnchor={polity==='Rome'?'end':'start'} style={{fill:colors[polity]}} className="growth-end-label">{polity.replace('Achaemenid ','')}</text></g>})}
    </svg></div>
    <div className="territorial-growth-takeaway"><b>80 years</b><span>Persia to its selected peak</span><b>156 years</b><span>Western Han to its selected peak</span><b>617 years</b><span>Rome to its selected peak</span></div>
    <ChartFooter source="Taagepera (1979), transcribed by the NSF-supported Institute for Research on World-Systems" note="Dots are published territorial anchors; connecting lines are visual interpolation, not annual evidence. Western Han began at inherited Qin scale, and frontier control was not equally intensive everywhere." dataHref={dataUrl}/>
  </div>;
}
