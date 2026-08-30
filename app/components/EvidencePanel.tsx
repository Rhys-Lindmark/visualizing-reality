'use client';

import { useEffect, useMemo, useState } from 'react';

type Source = { key:string;author_or_source:string;title:string;year:string;url:string;use_in_model:string };
type Dataset = { id:string;title:string;path?:string;paths?:string[];schema:string;evidence_type:string;source_keys?:string[];time_resolution:string;notes:string };
type Claim = { id:string;page:string;insight:number;claim:string;status:string;evidence_type:string;dataset_ids:string[];source_keys:string[];note:string };

function parseCSV(text:string):Source[]{
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const character=text[index];if(character==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(character==='"')quoted=!quoted;else if(character===','&&!quoted){row.push(cell);cell='';}else if((character==='\n'||character==='\r')&&!quoted){if(character==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=character;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]])) as Source);
}
function label(value:string){return value.replaceAll('_',' ');}

export default function EvidencePanel({ page }: { page:string }){
  const[sources,setSources]=useState<Source[]>([]);const[datasets,setDatasets]=useState<Dataset[]>([]);const[claims,setClaims]=useState<Claim[]>([]);const[query,setQuery]=useState('');
  useEffect(()=>{Promise.all([fetch('/data/source-registry.csv').then(response=>response.text()),fetch('/data/dataset-registry.json').then(response=>response.json()),fetch('/data/claim-registry.json').then(response=>response.json())]).then(([sourceText,datasetRows,claimRows])=>{setSources(parseCSV(sourceText));setDatasets(datasetRows);setClaims(claimRows.filter((claim:Claim)=>claim.page===page));});},[page]);
  const relevantKeys=useMemo(()=>new Set(claims.flatMap(claim=>claim.source_keys)),[claims]);
  const relevantDatasets=useMemo(()=>{const ids=new Set(claims.flatMap(claim=>claim.dataset_ids));return datasets.filter(dataset=>ids.has(dataset.id));},[claims,datasets]);
  const shownSources=useMemo(()=>sources.filter(source=>relevantKeys.has(source.key)&&`${source.author_or_source} ${source.title} ${source.key}`.toLowerCase().includes(query.toLowerCase())),[sources,relevantKeys,query]);

  return <div className="evidence-ledger">
    <div className="evidence-primer">
      <div><span>Source observation</span><p>A surviving text, artifact report, or modern scholarly estimate tied to a citation key.</p></div>
      <div><span>Historical reconstruction</span><p>A boundary or chronology assembled from incomplete evidence; dates persist between observations.</p></div>
      <div><span>Model output</span><p>A transparent calculation or interpolation. Useful for comparison, but not a recovered ancient census.</p></div>
    </div>
    <div className="evidence-stats" aria-label="Evidence ledger summary"><div><b>{claims.length||'—'}</b><span>registered claims</span></div><div><b>{relevantDatasets.length||'—'}</b><span>linked datasets</span></div><div><b>{relevantKeys.size||'—'}</b><span>cited sources</span></div><div><b>5</b><span>public schemas</span></div></div>
    <section className="claim-ledger" aria-labelledby="claim-ledger-heading"><div className="ledger-heading"><div><span>Claim registry</span><h3 id="claim-ledger-heading">What each live insight can actually support</h3></div><a href="/data/claim-registry.json" download>Claims JSON ↓</a></div>{claims.map(claim=><details key={claim.id} open><summary><span>Insight {String(claim.insight).padStart(2,'0')}</span><b>{claim.claim}</b><i>{label(claim.status)}</i></summary><div className="claim-detail"><p>{claim.note}</p><dl><div><dt>Evidence type</dt><dd>{label(claim.evidence_type)}</dd></div><div><dt>Datasets</dt><dd>{claim.dataset_ids.join(' · ')}</dd></div><div><dt>Source keys</dt><dd>{claim.source_keys.join(' · ')}</dd></div></dl></div></details>)}</section>
    <section className="dataset-ledger" aria-labelledby="dataset-ledger-heading"><div className="ledger-heading"><div><span>Dataset registry</span><h3 id="dataset-ledger-heading">The files behind this page</h3></div><a href="/data/dataset-registry.json" download>Datasets JSON ↓</a></div><div className="dataset-grid">{relevantDatasets.map(dataset=><article key={dataset.id}><div><span>{label(dataset.evidence_type)}</span><b>{dataset.schema}</b></div><h4>{dataset.title}</h4><p>{dataset.notes}</p><small>{dataset.time_resolution}</small><div>{(dataset.paths??[dataset.path!]).map(file=><a href={file} download key={file}>{file.split('/').at(-1)} ↓</a>)}</div></article>)}</div></section>
    <section className="source-ledger" aria-labelledby="source-ledger-heading"><div className="ledger-heading"><div><span>Source registry</span><h3 id="source-ledger-heading">Citations used by the live claims</h3></div><a href="/data/source-registry.csv" download>All sources CSV ↓</a></div><label className="source-search">Filter {relevantKeys.size} cited sources<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Author, title, or source key" type="search" /></label><div className="source-list">{shownSources.map(source=><article key={source.key}><span>{source.key}</span><div><a href={source.url}>{source.title} ↗</a><p>{source.author_or_source} · {source.year}</p><small>{source.use_in_model}</small></div></article>)}</div></section>
    <div className="schema-links"><span>Public data contracts</span>{['observation','modeled-series','boundary','citation','note'].map(schema=><a href={`/data/schemas/${schema}.schema.json`} download key={schema}>{label(schema)} schema ↓</a>)}</div>
  </div>;
}
