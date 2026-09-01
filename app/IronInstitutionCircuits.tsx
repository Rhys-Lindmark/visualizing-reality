'use client';

import { useEffect, useState } from 'react';
import { fetchClientText } from './lib/clientAsset';

type InstitutionCase={case_id:string;sort_order:string;system:string;date_label:string;start_year:string;end_year:string;region:string;architecture:string;inputs:string;making:string;coordination:string;distribution:string;visible_anchor:string;evidence_class:string;source_keys:string;interpretation:string;limits:string};
const REVISION='20260830-institutions1';
const dataUrl=`/data/iron-age/${REVISION}/iron-production-institutions.csv`;
const colors:Record<string,string>={assyria_arsenal:'#bd1f2e',fennoscandia_network:'#567b6d',bohemia_distribution:'#9b733b',han_frontier:'#806695',meroe_landscape:'#39728b'};

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
const evidenceLabel=(value:string)=>({archaeological_complex_plus_administrative_record:'archaeology + record',archaeometallurgical_and_spatial_synthesis:'archaeometallurgy + space',regional_settlement_and_exchange_synthesis:'regional synthesis',textual_institution_plus_preliminary_archaeometallurgy:'text + preliminary metallurgy',radiocarbon_chronology_plus_spatial_archaeology:'radiocarbon + landscape'}[value]??value.replaceAll('_',' '));

export default function IronInstitutionCircuits(){
  const[rows,setRows]=useState<InstitutionCase[]>([]);const[state,setState]=useState<'loading'|'ready'|'error'>('loading');const[error,setError]=useState('');const[selected,setSelected]=useState('fennoscandia_network');const[attempt,setAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();fetchClientText(dataUrl,{signal:controller.signal,label:'Iron-production institutions'}).then(text=>{const parsed=parseCSV<InstitutionCase>(text).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order));if(parsed.length!==5||new Set(parsed.map(row=>row.case_id)).size!==5||parsed.some(row=>!row.source_keys||!row.limits||!row.architecture||!row.visible_anchor))throw new Error('The institution response used an incompatible schema.');setRows(parsed);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The institution comparison could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);
  const active=rows.find(row=>row.case_id===selected)??rows[0];
  const retry=()=>{setRows([]);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!active)return <div className={`data-state iron-institutions-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The production circuits did not load':'Loading five production architectures…'}</b><span>{state==='error'?error:'inputs · making · coordination · distribution · evidence'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry circuits</button>}</div>;
  const stages=[['01 · Inputs',active.inputs],['02 · Making',active.making],['03 · Coordination',active.coordination],['04 · Distribution',active.distribution],['05 · What survives',active.visible_anchor]];
  return <div className="iron-institutions-chart" style={{'--institution-color':colors[active.case_id]} as React.CSSProperties}>
    <nav className="iron-institutions-tabs" aria-label="Choose an iron-production architecture">{rows.map(row=><button type="button" key={row.case_id} className={selected===row.case_id?'active':''} onClick={()=>setSelected(row.case_id)} style={{'--case-color':colors[row.case_id]} as React.CSSProperties}><span>{row.date_label}</span><b>{row.system}</b><small>{row.architecture}</small></button>)}</nav>
    <section className="iron-institutions-focus"><header><div><span>{rowLabel(active.region)} · {active.date_label}</span><h5>{active.system}</h5></div><div><b>{active.architecture}</b><small>{evidenceLabel(active.evidence_class)}</small></div></header><p>{active.interpretation}</p><div className="iron-institutions-circuit">{stages.map(([label,copy],index)=><div className="iron-institutions-stage-wrap" key={label}><article><span>{label}</span><p>{copy}</p></article>{index<stages.length-1&&<i aria-hidden="true">→</i>}</div>)}</div></section>
    <section className="iron-institutions-atlas"><header><div><span>Five ways to make production durable</span><h5>Scale had more than one institutional shape</h5></div><small>click a row · categories are not ranks</small></header><div>{rows.map(row=><button type="button" key={row.case_id} className={selected===row.case_id?'active':''} onClick={()=>setSelected(row.case_id)}><i style={{background:colors[row.case_id]}}/><span><b>{row.architecture}</b><small>{row.system}</small></span><p>{row.visible_anchor}</p></button>)}</div></section>
  </div>;
}

function rowLabel(region:string){return region;}
