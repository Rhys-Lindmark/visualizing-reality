'use client';

import {useEffect,useState} from 'react';
import {fetchClientText} from './lib/clientAsset';

type Row={record_id:string;date_label:string;stage:string;pressure:string;emergency_response:string;power_shift:string};
const dataUrl='/data/qin-han/20260831-collapse1/han-collapse-command.csv';
function parse(text:string){const lines=text.trim().split(/\r?\n/);const read=(line:string)=>{const out:string[]=[];let cell='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&q&&line[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){out.push(cell);cell='';}else cell+=c;}out.push(cell);return out;};const head=read(lines[0]);return lines.slice(1).map(line=>Object.fromEntries(head.map((h,i)=>[h,read(line)[i]??''])) as Row);}
export default function HanCollapseCommand(){const[rows,setRows]=useState<Row[]>([]),[selected,setSelected]=useState('yellow_turban'),[error,setError]=useState('');useEffect(()=>{fetchClientText(dataUrl,{label:'Han collapse evidence'}).then(t=>{const r=parse(t);if(r.length!==6)throw new Error('Unexpected collapse dataset.');setRows(r);}).catch(e=>setError(e instanceof Error?e.message:'Data unavailable'));},[]);const active=rows.find(r=>r.record_id===selected)??rows[0];if(!active)return <div className="data-state">{error||'Loading Han collapse…'}</div>;return <div className="han-collapse-chart">
  <nav aria-label="Han collapse sequence">{rows.map(r=><button key={r.record_id} className={r.record_id===active.record_id?'active':''} onClick={()=>setSelected(r.record_id)}><b>{r.date_label}</b><span>{r.stage}</span></button>)}</nav>
  <section className="han-collapse-flow"><article><span>Pressure</span><p>{active.pressure}</p></article><i>→</i><article><span>Emergency response</span><p>{active.emergency_response}</p></article><i>→</i><article><span>Who gained command</span><p>{active.power_shift}</p></article></section>
  <p className="han-collapse-thesis">The court repeatedly solved immediate crises by empowering actors who could command soldiers, territory, and revenue without it.</p>
 </div>}
