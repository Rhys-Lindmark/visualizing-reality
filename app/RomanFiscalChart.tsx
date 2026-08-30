'use client';

import { useEffect, useMemo, useState } from 'react';

type BudgetRow = {
  year:number;
  display_year:string;
  scenario:'low'|'high';
  total_million_sestertii:number;
  category:string;
  amount_million_sestertii:number;
  source_keys:string;
  notes:string;
};
type FiscalObservation = {
  year:number;
  display_year:string;
  series:string;
  measure:string;
  value:number;
  unit:string;
  scope:string;
  destination:string;
  evidence_type:string;
  source_keys:string;
  notes:string;
};

const DATA_REVISION='20260829-collapse1';
const versioned=(path:string)=>`${path}?v=${DATA_REVISION}`;
const colors:Record<string,string>={Army:'#bd1f2e','Other imperial servants':'#204c74',Handouts:'#d6a34a',Buildings:'#7c9b82',Other:'#a8b1b7'};

function parseCSV(text:string):Record<string,string>[] {
  const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
  for(let index=0;index<text.length;index+=1){const character=text[index];if(character==='"'&&quoted&&text[index+1]==='"'){cell+='"';index+=1;}else if(character==='"')quoted=!quoted;else if(character===','&&!quoted){row.push(cell);cell='';}else if((character==='\n'||character==='\r')&&!quoted){if(character==='\r'&&text[index+1]==='\n')index+=1;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=character;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]])));
}
function budgetRows(text:string):BudgetRow[]{return parseCSV(text).map(row=>({...row,year:Number(row.year),total_million_sestertii:Number(row.total_million_sestertii),amount_million_sestertii:Number(row.amount_million_sestertii)}) as BudgetRow);}
function fiscalRows(text:string):FiscalObservation[]{return parseCSV(text).map(row=>({...row,year:Number(row.year),value:Number(row.value)}) as FiscalObservation);}
function measureLabel(value:string){return value.replaceAll('_',' ');}
function valueLabel(row:FiscalObservation){if(row.measure==='sicilian_grain_tithe')return '1 in 10';if(row.measure==='quadragesima_galliarum')return '1 in 40';if(row.measure==='inheritance_tax')return '1 in 20';if(row.measure==='auction_tax')return '1 in 100';return String(row.value);}

export default function RomanFiscalChart(){
  const[budget,setBudget]=useState<BudgetRow[]>([]);const[observations,setObservations]=useState<FiscalObservation[]>([]);const[year,setYear]=useState(150);const[scenario,setScenario]=useState<'low'|'high'>('low');const[loadError,setLoadError]=useState('');
  useEffect(()=>{Promise.all([fetch(versioned('/data/roman-imperial-budget.csv')).then(response=>{if(!response.ok)throw new Error('Budget data could not be loaded.');return response.text();}),fetch(versioned('/data/roman-fiscal-observations.csv')).then(response=>{if(!response.ok)throw new Error('Fiscal observations could not be loaded.');return response.text();})]).then(([budgetText,fiscalText])=>{setBudget(budgetRows(budgetText));setObservations(fiscalRows(fiscalText));}).catch(error=>setLoadError(error instanceof Error?error.message:'Fiscal data could not be loaded.'));},[]);
  const selected=useMemo(()=>budget.filter(row=>row.year===year&&row.scenario===scenario),[budget,year,scenario]);
  const total=selected[0]?.total_million_sestertii||0;
  const army=selected.find(row=>row.category==='Army');const armyShare=army&&total?(army.amount_million_sestertii/total)*100:0;
  const rates=observations.filter(row=>['sicilian_grain_tithe','quadragesima_galliarum','inheritance_tax','auction_tax'].includes(row.measure));
  const pay=observations.filter(row=>row.series==='legionary_pay');

  return <div className="fiscal-chart">
    <div className="fiscal-controls">
      <div><span>Budget snapshot</span>{[150,215].map(value=><button key={value} type="button" aria-pressed={year===value} onClick={()=>setYear(value)}>c. {value} CE</button>)}</div>
      <div><span>Published scenario</span>{(['low','high'] as const).map(value=><button key={value} type="button" aria-pressed={scenario===value} onClick={()=>setScenario(value)}>{value}</button>)}</div>
    </div>
    {loadError?<p className="fiscal-error">{loadError}</p>:<>
      <div className="budget-head"><div><span>Reconstructed central expenditure</span><b>{total?`${total.toLocaleString()}m`:'—'}</b><small>sestertii per year</small></div><div className="army-share"><span>Army share</span><b>{armyShare?`${armyShare.toFixed(0)}%`:'—'}</b><small>within this scenario</small></div></div>
      <div className="budget-stack" role="img" aria-label={`${year} ${scenario} imperial budget scenario by category`}>{selected.map(row=><i key={row.category} style={{width:`${(row.amount_million_sestertii/total)*100}%`,background:colors[row.category]}} title={`${row.category}: ${row.amount_million_sestertii} million sestertii`} />)}</div>
      <div className="budget-rows">{selected.map(row=>{const share=(row.amount_million_sestertii/total)*100;return <div key={row.category}><span><i style={{background:colors[row.category]}} />{row.category}</span><div><i style={{width:`${share}%`,background:colors[row.category]}} /></div><b>{row.amount_million_sestertii}m</b><small>{share.toFixed(1)}%</small></div>;})}</div>
      <p className="budget-caveat"><b>Do not read this as an excavated ledger.</b> These are Duncan-Jones’s low and high reconstructions, reproduced by Mattingly. Toggle within a year to see the scenarios; do not treat the nominal 150 and 215 CE totals as purchasing-power growth.</p>
      <section className="fiscal-pipe" aria-labelledby="fiscal-pipe-title"><div><span>Many collection systems</span><h5 id="fiscal-pipe-title">There was no single Roman tax rate</h5><p>Rates applied to different people, goods, and places. They show the machinery—not a total burden that can be added together.</p></div><div className="fiscal-rate-grid">{rates.map(row=><article key={row.measure}><span>{row.display_year}</span><b>{valueLabel(row)}</b><h6>{measureLabel(row.measure)}</h6><p>{row.scope}</p><small>→ {row.destination}<br />{row.source_keys}</small></article>)}</div></section>
      <section className="fiscal-flow" aria-label="Simplified Roman fiscal flow"><div><span>Farms · households · traders</span><small>grain, land, people, goods</small></div><b>→</b><div><span>Communities · contractors · officials</span><small>assessment and collection varied</small></div><b>→</b><div className="flow-army"><span>Treasuries · armies · capital</span><small>the army dominated central spending</small></div></section>
      <section className="pay-strip" aria-labelledby="pay-strip-title"><div><span>Nominal legionary base pay</span><h5 id="pay-strip-title">The recurring bill rose with army pay</h5><p>Annual pay before deductions; the evidence series stops after 197 rather than guessing through the third century.</p></div><div>{pay.map(row=><article key={row.year}><span>{row.display_year}</span><b>{row.value.toLocaleString()} HS</b><i style={{width:`${(row.value/2400)*100}%`}} /><small>{row.source_keys}</small></article>)}</div></section>
    </>}
    <div className="fiscal-downloads"><a href={versioned('/data/roman-imperial-budget.csv')} download>Budget scenarios ↓</a><a href={versioned('/data/roman-fiscal-observations.csv')} download>Fiscal observations ↓</a></div>
  </div>;
}
