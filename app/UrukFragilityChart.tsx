'use client';
import {useEffect,useMemo,useState} from 'react';

type Row={slug:string;mechanism:string;place:string;start_year:string;end_year:string;display_date:string;observation:string;what_it_supports:string;what_it_does_not_prove:string;evidence_class:string;value:string;relation:string;unit:string;source_keys:string};
const DATA_REVISION='20260830-uruk-fragility1';
const url=`/data/uruk-state-fragility-evidence.csv?v=${DATA_REVISION}`;
const tones:Record<string,string>={Concentration:'concentrate',Provisioning:'provision',Fortification:'fortify',Conflict:'conflict','Violence and ritual':'violence',Dispersal:'disperse','Peripheral autonomy':'periphery','Regional reversal':'reversal'};
const quantity=(row:Row)=>row.value?`${row.relation==='more_than'?'>':row.relation==='minimum'?'≥':row.relation==='approximate'?'≈':''}${Number(row.value).toLocaleString()} ${row.unit}`:'qualitative record';
function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

export default function UrukFragilityChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selectedSlug,setSelectedSlug]=useState('institutional-dispersal');
  useEffect(()=>{let live=true;fetch(url,{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.text()}).then(text=>{const parsed=parseCSV(text);if(parsed.length!==8)throw new Error('Required evidence rows missing');if(live)setRows(parsed)}).catch(reason=>{if(live)setError(reason instanceof Error?reason.message:String(reason))});return()=>{live=false}},[]);
  const selected=useMemo(()=>rows.find(row=>row.slug===selectedSlug)??rows[0],[rows,selectedSlug]);
  if(error)return <div className="uruk-data-error"><b>Fragility evidence did not load</b><span>{error}</span></div>;
  if(!selected)return <div className="uruk-data-loading">Loading source-keyed evidence…</div>;
  return <div className="uruk-fragility-chart">
    <div className="fragility-thesis"><div><span>Observed cases</span><b>8</b><small>unlike evidence · not a score</small></div><div><span>Direct coercion counts</span><b>0</b><small>no slavery estimate inferred</small></div><div><span>Uruk disease series</span><b>None</b><small>plausible mechanism · missing local test</small></div></div>
    <section className="fragility-ladder"><div className="uruk-chart-heading"><div><span>Evidence ladder</span><h5>Concentration created power—and exit points</h5></div><small>4200–3100 BCE · select a case</small></div>
      <div className="fragility-rail" aria-label="Eight archaeological observations">{rows.map((row,index)=><button key={row.slug} className={`${tones[row.mechanism]??''} ${row.slug===selected.slug?'active':''}`} onClick={()=>setSelectedSlug(row.slug)} aria-pressed={row.slug===selected.slug}><i>{String(index+1).padStart(2,'0')}</i><span>{row.mechanism}</span><b>{row.place}</b><small>{row.display_date}</small></button>)}</div>
      <article className="fragility-readout" role="tabpanel"><header><span>{selected.mechanism}</span><h6>{selected.place}</h6><small>{selected.display_date} · {selected.evidence_class.replaceAll('_',' ')}</small></header><div><section><span>Observed</span><p>{selected.observation}</p></section><section><span>Supports</span><p>{selected.what_it_supports}</p></section><aside><span>Does not prove</span><p>{selected.what_it_does_not_prove}</p></aside></div><footer><b>{quantity(selected)}</b><small>{selected.source_keys}</small></footer></article>
    </section>
    <section className="fragility-boundaries"><div><span>Strong inference</span><b>Centralization was reversible.</b><p>Institutions could assemble food, labor, walls, and records. Archaeology also shows violent failure, deliberate dismantling, dispersal, and local communities that retained agency.</p></div><div><span>Evidence boundary</span><b>Fragility is not one collapse variable.</b><p>No annual population series, coercion share, epidemic curve, or common “state strength” unit links these cases. The visual therefore compares claims, not magnitudes.</p></div></section>
    <div className="fiscal-downloads"><a href={url} download>Evidence ladder CSV ↓</a><a href="https://doi.org/10.15184/aqy.2024.189">Open Shakhi Kora study ↗</a><a href="https://doi.org/10.1017/S0959774324000404">Open regional synthesis ↗</a></div>
  </div>;
}
