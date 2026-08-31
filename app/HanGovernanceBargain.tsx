'use client';

import {useEffect,useState} from 'react';
import {fetchClientText} from './lib/clientAsset';

type Row={record_id:string;date_label:string;stage:string;governance_mix:string;direct_commandery_count:string;political_action:string;evidence_anchor:string};
const dataUrl='/data/qin-han/20260831-governance1/han-governance-bargains.csv';
function parse(text:string){const lines=text.trim().split(/\r?\n/);const read=(line:string)=>{const out:string[]=[];let cell='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&q&&line[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){out.push(cell);cell='';}else cell+=c;}out.push(cell);return out;};const head=read(lines[0]);return lines.slice(1).map(line=>Object.fromEntries(head.map((h,i)=>[h,read(line)[i]??''])) as Row);}
export default function HanGovernanceBargain(){const[rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState('founding_compromise'),[error,setError]=useState('');useEffect(()=>{fetchClientText(dataUrl,{label:'Han governance evidence'}).then(t=>{const r=parse(t);if(r.length!==6)throw new Error('Unexpected governance dataset.');setRows(r);}).catch(e=>setError(e instanceof Error?e.message:'Data unavailable'));},[]);const active=rows.find(r=>r.record_id===selected)??rows[0];if(!active)return <div className="data-state">{error||'Loading Han governance…'}</div>;return <div className="han-governance-chart">
  <nav aria-label="Han governance sequence">{rows.map((r,i)=><button key={r.record_id} className={r.record_id===active.record_id?'active':''} onClick={()=>setSelected(r.record_id)}><span>{String(i+1).padStart(2,'0')}</span><b>{r.stage}</b><small>{r.date_label}</small></button>)}</nav>
  <section className="han-governance-focus"><div><span>{active.date_label}</span><h5>{active.stage}</h5><p>{active.governance_mix}</p></div>{active.direct_commandery_count&&<aside><b>{active.direct_commandery_count}</b><span>direct commanderies</span><small>published reconstruction; not area share</small></aside>}</section>
  <section className="han-governance-action"><b>{active.political_action}</b><p>{active.evidence_anchor}</p></section>
  <div className="han-governance-anchors" aria-label="Published direct-commandery counts"><span style={{width:'14%'}}>15 · 202 BCE</span><span style={{width:'22%'}}>24 · 154 BCE</span><span style={{width:'100%'}}>108 · 106 BCE</span></div>
 </div>}
