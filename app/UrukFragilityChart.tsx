'use client';
import {useEffect,useMemo,useState} from 'react';
import {fetchUrukText} from './lib/urukDataClient';

type Row={slug:string;mechanism:string;place:string;start_year:string;end_year:string;display_date:string;observation:string;what_it_supports:string;what_it_does_not_prove:string;evidence_class:string;value:string;relation:string;unit:string;source_keys:string};
type Path='assemble'|'rupture'|'opt-out';

const paths:{id:Path;label:string;description:string;slugs:string[]}[]=[
  {id:'assemble',label:'Assemble power',description:'People, food, and defenses concentrated',slugs:['urban-concentration','institutional-provisioning','fortified-center']},
  {id:'rupture',label:'Violent rupture',description:'Concentrated settlements could fail violently',slugs:['urban-conflict','mass-deposition']},
  {id:'opt-out',label:'Opt out',description:'People dispersed, coexisted, or regionalized',slugs:['institutional-dispersal','autonomous-periphery','regional-reversal']},
];

const quantity=(row:Row)=>row.value?`${row.relation==='more_than'?'>':row.relation==='minimum'?'≥':row.relation==='approximate'?'≈':''}${Number(row.value).toLocaleString()} ${row.unit}`:'';
function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index+=1){const c=text[index];if(c==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row)}

export default function UrukFragilityChart(){
  const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState('');const[selectedPath,setSelectedPath]=useState<Path>('opt-out');const[selectedSlug,setSelectedSlug]=useState('institutional-dispersal');
  useEffect(()=>{const controller=new AbortController();fetchUrukText('uruk-state-fragility-evidence.csv',controller.signal).then(text=>{const parsed=parseCSV(text);if(parsed.length!==8)throw new Error('Required evidence rows missing');setRows(parsed)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason))});return()=>controller.abort()},[]);
  const activePath=paths.find(path=>path.id===selectedPath)??paths[2];
  const cases=useMemo(()=>activePath.slugs.map(slug=>rows.find(row=>row.slug===slug)).filter((row):row is Row=>Boolean(row)),[activePath,rows]);
  const selected=cases.find(row=>row.slug===selectedSlug)??cases[0];
  const selectPath=(path:typeof paths[number])=>{setSelectedPath(path.id);setSelectedSlug(path.slugs[0])};
  if(error)return <div className="uruk-data-error"><b>The centralization evidence did not load.</b><span>{error}</span><button type="button" onClick={()=>location.reload()}>Retry</button></div>;
  if(!selected)return <div className="uruk-data-loading">Loading the archaeological record…</div>;
  return <div className="uruk-optout-chart">
    <div className="uruk-optout-paths" role="tablist" aria-label="Three outcomes of early centralization">{paths.map((path,index)=><button type="button" role="tab" aria-selected={selectedPath===path.id} className={selectedPath===path.id?'active':''} onClick={()=>selectPath(path)} key={path.id}><span>0{index+1}</span><b>{path.label}</b><small>{path.description}</small></button>)}</div>
    <section className="uruk-optout-cases" aria-label={activePath.label}>
      <header><span>{activePath.label}</span><b>{activePath.description}</b></header>
      <div>{cases.map(row=><button type="button" className={selected.slug===row.slug?'active':''} aria-pressed={selected.slug===row.slug} onClick={()=>setSelectedSlug(row.slug)} key={row.slug}><b>{row.place}</b><span>{row.display_date}</span></button>)}</div>
    </section>
    <article className="uruk-optout-readout" aria-live="polite">
      <header><div><span>{selected.mechanism}</span><h5>{selected.place}</h5></div>{quantity(selected)&&<b>{quantity(selected)}</b>}</header>
      <div><section><span>What archaeologists found</span><p>{selected.observation}</p></section><section><span>What it shows</span><p>{selected.what_it_supports}</p></section></div>
    </article>
    <div className="uruk-optout-conclusion"><span>The result</span><b>Centralization was a choice, not an evolutionary endpoint.</b><p>Fourth-millennium communities assembled large institutions, but they also dismantled them, lived alongside them, and returned to more dispersed regional systems.</p></div>
  </div>;
}
