'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Observation = {
  polity:string;
  series_id?:string;
  year:number;
  display_year:string;
  soldiers_thousands:number;
  evidence_grade:string;
  event:string;
  scope?:string;
  source_keys:string;
  notes:string;
  series:'roman_estimate'|'campaign';
};

const colors:Record<string,string>={
  'Roman Republic':'#bd1f2e',
  'Roman Empire':'#bd1f2e',
  'Late Roman Empire':'#9b3b47',
  'Eastern Roman Empire':'#397f9a',
  'Achaemenid Empire':'#8f68a0',
  'Macedonian Empire':'#397f9a',
  'Gallic coalition':'#6e9657',
  Carthage:'#bf8730',
  'Ptolemaic Kingdom':'#268c87',
  'Seleucid Empire':'#d06a36',
  'Parthian Empire':'#745395',
  'Sasanian Empire':'#53376f',
};
const DATA_REVISION='20260829-force2';
const versioned=(path:string)=>`${path}?v=${DATA_REVISION}`;

function parseCSV(text:string):string[][]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function objects(text:string){const[headers,...rows]=parseCSV(text);return rows.map(row=>Object.fromEntries(headers.map((key,index)=>[key,row[index]])));}
function people(value:number){return value>=1000?`${(value/1000).toFixed(1)}m`:`${value.toLocaleString()}k`;}
function evidenceLabel(value:string){return value.replaceAll('_',' ');}

export default function MilitaryCapacityChart(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const[data,setData]=useState<Observation[]>([]);
  const[selected,setSelected]=useState(0);
  const[loadError,setLoadError]=useState('');

  useEffect(()=>{Promise.all([fetch(versioned('/data/roman-military-capacity.csv')).then(response=>response.text()),fetch(versioned('/data/comparison-forces.csv')).then(response=>response.text())]).then(([romeText,comparisonText])=>{
    const rome=objects(romeText).map((row):Observation=>({polity:String(row.polity),series_id:String(row.series_id),year:Number(row.year),display_year:String(row.display_year),soldiers_thousands:Number(row.soldiers_thousands),evidence_grade:String(row.estimate_type),event:'Published or explicit force estimate',scope:String(row.scope),source_keys:String(row.source_keys),notes:String(row.notes),series:'roman_estimate'}));
    const campaigns=objects(comparisonText).map((row):Observation=>({polity:String(row.polity),year:Number(row.year),display_year:String(row.display_year),soldiers_thousands:Number(row.soldiers_thousands),evidence_grade:String(row.evidence_grade),event:String(row.event),source_keys:String(row.source_keys),notes:String(row.notes),series:'campaign'}));
    const combined=[...rome,...campaigns];setData(combined);setSelected(combined.findIndex(row=>row.polity==='Roman Republic'&&row.year===-212));
  }).catch(error=>setLoadError(error instanceof Error?error.message:'Chart data could not be loaded.'));},[]);

  const roman=useMemo(()=>data.filter(row=>row.series==='roman_estimate').sort((a,b)=>a.year-b.year),[data]);
  const campaigns=useMemo(()=>data.filter(row=>row.series==='campaign'),[data]);
  const romanSegments=useMemo(()=>{const segments=new Map<string,Observation[]>();for(const row of roman){const id=row.series_id||row.polity;segments.set(id,[...(segments.get(id)||[]),row]);}return [...segments.values()].map(rows=>rows.sort((a,b)=>a.year-b.year));},[roman]);
  const legendPolities=useMemo(()=>[...new Set(data.map(row=>row.polity))],[data]);
  const focus=data[selected];

  useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx||!data.length)return;const width=1050,height=520,left=76,right=34,top=48,bottom=66,plotWidth=width-left-right,plotHeight=height-top-bottom,max=500;const x=(year:number)=>left+((year+500)/1000)*plotWidth;const y=(value:number)=>top+plotHeight-(value/max)*plotHeight;
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    const periods:Array<[number,number,string,string]>=[[-218,-201,'rgba(189,31,46,.05)','HANNIBALIC WAR'],[-49,-27,'rgba(189,31,46,.05)','CIVIL WARS'],[235,284,'rgba(24,63,104,.05)','3RD-C. CRISIS'],[395,476,'rgba(24,63,104,.05)','EAST / WEST SPLIT']];periods.forEach(([start,end,color,label])=>{ctx.fillStyle=color;ctx.fillRect(x(start),top,x(end)-x(start),plotHeight);ctx.fillStyle='#89949b';ctx.font='600 8px Arial';ctx.fillText(label,x(start)+4,top+12);});
    ctx.strokeStyle='#dce1e5';ctx.lineWidth=1;ctx.font='10px Arial';for(let tick=0;tick<=5;tick++){const value=(max/5)*tick,yy=y(value);ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(width-right,yy);ctx.stroke();ctx.fillStyle='#76828a';ctx.textAlign='right';ctx.fillText(`${Math.round(value)}k`,left-10,yy+3);}for(let year=-500;year<=500;year+=100){const xx=x(year);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotHeight);ctx.strokeStyle='rgba(220,225,229,.55)';ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#76828a';ctx.fillText(year<0?`${Math.abs(year)} BCE`:year===0?'1 CE':`${year} CE`,xx,height-35);}
    romanSegments.forEach(segment=>{if(segment.length<2)return;ctx.strokeStyle=colors[segment[0].polity]||'#bd1f2e';ctx.lineWidth=2.8;ctx.beginPath();segment.forEach((row,index)=>{const xx=x(row.year),yy=y(row.soldiers_thousands);if(index===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.stroke();});
    roman.forEach(row=>{const ancient=row.evidence_grade==='ancient_reported_deployment';ctx.fillStyle=ancient?'#fff':colors[row.polity]||'#bd1f2e';ctx.beginPath();ctx.arc(x(row.year),y(row.soldiers_thousands),ancient?5.5:4.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colors[row.polity]||'#bd1f2e';ctx.lineWidth=ancient?2.4:1.4;ctx.stroke();});
    campaigns.forEach(row=>{const color=colors[row.polity]||'#66747d';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x(row.year),y(row.soldiers_thousands),5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.stroke();});
    const lateLabel=roman.find(row=>row.polity==='Late Roman Empire');if(lateLabel){ctx.textAlign='left';ctx.fillStyle=colors[lateLabel.polity];ctx.font='700 9px Arial';ctx.fillText('SEPARATE PUBLISHED ESTIMATE SEGMENTS',x(lateLabel.year)-92,y(lateLabel.soldiers_thousands)-13);}
    if(focus){const xx=x(focus.year),yy=y(focus.soldiers_thousands);ctx.strokeStyle='rgba(24,34,44,.45)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotHeight);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(xx,yy,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colors[focus.polity]||'#333';ctx.lineWidth=3;ctx.stroke();}
    ctx.textAlign='left';ctx.fillStyle='#53616b';ctx.font='600 9px Arial';ctx.fillText('SOLDIERS · THOUSANDS · SCOPE VARIES BY POINT',left,22);
  },[data,roman,romanSegments,campaigns,focus]);

  const handle=(clientX:number,clientY:number)=>{const rect=canvas.current?.getBoundingClientRect();if(!rect||!data.length)return;const localX=((clientX-rect.left)/rect.width)*1050,localY=((clientY-rect.top)/rect.height)*520,x=(year:number)=>76+((year+500)/1000)*(1050-76-34),y=(value:number)=>48+(520-48-66)-(value/500)*(520-48-66);let nearest=0,score=Infinity;data.forEach((row,index)=>{const distance=Math.hypot((x(row.year)-localX)*.7,y(row.soldiers_thousands)-localY);if(distance<score){score=distance;nearest=index;}});setSelected(nearest);};

  return <div className="capacity-chart">
    <div className="metric-bar"><b>Published estimates and observed campaigns</b><span>{loadError||'No reconstructed filler · post-395 East shown separately'}</span></div>
    <div className="capacity-readout"><div><span>Polity</span><b style={{color:colors[focus?.polity]}}>{focus?.polity||'Loading…'}</b></div><div><span>Date · event</span><b>{focus?.display_year||'—'}</b><small>{focus?.event}</small></div><div><span>Soldiers</span><b>{focus?people(focus.soldiers_thousands):'—'}</b><small>{focus?.scope||'One reported campaign force'}</small></div><div className="red-stat"><span>Evidence class</span><b>{focus?evidenceLabel(focus.evidence_grade):'—'}</b><small>{focus?.series==='roman_estimate'?'one sourced estimate; gaps remain':'one campaign, not state capacity'}</small></div></div>
    <canvas ref={canvas} width="1050" height="520" onPointerMove={event=>handle(event.clientX,event.clientY)} onPointerDown={event=>handle(event.clientX,event.clientY)} aria-label="Published Roman force estimates and reported campaign forces from 500 BCE to 500 CE" />
    <div className="polity-legend">{legendPolities.map(name=><span key={name}><i style={{background:colors[name]||'#66747d'}} />{name}</span>)}<span className="anchor-key"><i />rival campaign observation</span></div>
    <div className="chart-explain"><p><b>{focus?.event||'Observation'}:</b> {focus?.notes} <em>Sources: {focus?.source_keys}</em></p><div><a href={versioned('/data/roman-military-capacity.csv')} download>Rome estimates ↓</a><a href={versioned('/data/comparison-forces.csv')} download>Campaign forces ↓</a></div></div>
    <section className="equipment-index" aria-labelledby="equipment-index-title"><div><span>Third–second centuries BCE only</span><h5 id="equipment-index-title">Worked metal per heavy infantryman</h5><p>Relative index from Devereaux’s public summary—not kilograms. Iron and bronze are combined.</p></div><div className="equipment-bars"><div><label><b>Roman heavy infantry</b><strong>125</strong></label><i style={{width:'100%'}} /></div><div><label><b>Nearest comparator</b><strong>100</strong></label><i style={{width:'80%'}} /></div></div><p className="equipment-caveat"><b>What we know:</b> the Roman panoply contained about 25% more worked metal than the nearest comparison in Devereaux’s model. <b>What we do not know from the public evidence:</b> a defensible kilogram value for every polity across a thousand years. The earlier tonnage series has therefore been removed.</p><a href={versioned('/data/equipment-comparison.csv')} download>Relative equipment data ↓</a></section>
  </div>;
}
