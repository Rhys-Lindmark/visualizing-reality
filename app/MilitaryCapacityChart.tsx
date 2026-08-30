'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Observation = {
  polity:string;
  year:number;
  display_year:string;
  soldiers_thousands:number;
  low_thousands?:number;
  high_thousands?:number;
  evidence_grade:string;
  event:string;
  source_keys:string;
  notes:string;
  series:'rome'|'campaign';
};

const colors:Record<string,string>={
  Rome:'#bd1f2e',
  'Achaemenid Empire':'#8f68a0',
  'Macedonian Empire':'#397f9a',
  'Gallic coalition':'#6e9657',
  Carthage:'#bf8730',
  'Ptolemaic Kingdom':'#268c87',
  'Seleucid Empire':'#d06a36',
  'Parthian Empire':'#745395',
  'Sasanian Empire':'#53376f',
};

function parseCSV(text:string):string[][]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function objects(text:string){const[headers,...rows]=parseCSV(text);return rows.map(row=>Object.fromEntries(headers.map((key,index)=>[key,row[index]])));}
function people(value:number){return value>=1000?`${(value/1000).toFixed(1)}m`:`${value.toLocaleString()}k`;}
function evidenceLabel(value:string){return value.replaceAll('_',' ');}

export default function MilitaryCapacityChart(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const[data,setData]=useState<Observation[]>([]);
  const[selected,setSelected]=useState(0);

  useEffect(()=>{Promise.all([fetch('/data/roman-military-capacity.csv').then(response=>response.text()),fetch('/data/comparison-forces.csv').then(response=>response.text())]).then(([romeText,comparisonText])=>{
    const rome=objects(romeText).map((row):Observation=>({polity:'Rome',year:Number(row.year),display_year:String(row.display_year),soldiers_thousands:Number(row.army_mid_thousands),low_thousands:Number(row.army_low_thousands),high_thousands:Number(row.army_high_thousands),evidence_grade:String(row.estimate_type),event:'Empire-wide force estimate',source_keys:String(row.source_keys),notes:String(row.notes),series:'rome'}));
    const campaigns=objects(comparisonText).map((row):Observation=>({polity:String(row.polity),year:Number(row.year),display_year:String(row.display_year),soldiers_thousands:Number(row.soldiers_thousands),evidence_grade:String(row.evidence_grade),event:String(row.event),source_keys:String(row.source_keys),notes:String(row.notes),series:'campaign'}));
    const combined=[...rome,...campaigns];setData(combined);setSelected(combined.findIndex(row=>row.polity==='Rome'&&row.year===-212));
  });},[]);

  const rome=useMemo(()=>data.filter(row=>row.series==='rome').sort((a,b)=>a.year-b.year),[data]);
  const campaigns=useMemo(()=>data.filter(row=>row.series==='campaign'),[data]);
  const focus=data[selected];

  useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx||!data.length)return;const width=1050,height=520,left=76,right=34,top=48,bottom=66,plotWidth=width-left-right,plotHeight=height-top-bottom,max=550;const x=(year:number)=>left+((year+500)/1000)*plotWidth;const y=(value:number)=>top+plotHeight-(value/max)*plotHeight;
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    const periods:Array<[number,number,string,string]>=[[-218,-201,'rgba(189,31,46,.05)','HANNIBALIC WAR'],[-49,-27,'rgba(189,31,46,.05)','CIVIL WARS'],[235,284,'rgba(24,63,104,.05)','3RD-C. CRISIS'],[395,476,'rgba(24,63,104,.05)','WESTERN RETREAT']];periods.forEach(([start,end,color,label])=>{ctx.fillStyle=color;ctx.fillRect(x(start),top,x(end)-x(start),plotHeight);ctx.fillStyle='#89949b';ctx.font='600 8px Arial';ctx.fillText(label,x(start)+4,top+12);});
    ctx.strokeStyle='#dce1e5';ctx.lineWidth=1;ctx.font='10px Arial';for(let tick=0;tick<=5;tick++){const value=(max/5)*tick,yy=y(value);ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(width-right,yy);ctx.stroke();ctx.fillStyle='#76828a';ctx.textAlign='right';ctx.fillText(`${Math.round(value)}k`,left-10,yy+3);}for(let year=-500;year<=500;year+=100){const xx=x(year);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotHeight);ctx.strokeStyle='rgba(220,225,229,.55)';ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#76828a';ctx.fillText(year<0?`${Math.abs(year)} BCE`:year===0?'1 CE':`${year} CE`,xx,height-35);}
    ctx.strokeStyle=colors.Rome;ctx.lineWidth=3.2;ctx.beginPath();rome.forEach((row,index)=>{const xx=x(row.year),yy=y(row.soldiers_thousands);if(index===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.stroke();
    rome.forEach(row=>{const anchor=row.evidence_grade==='ancient_anchor';ctx.fillStyle=anchor?'#fff':colors.Rome;ctx.beginPath();ctx.arc(x(row.year),y(row.soldiers_thousands),anchor?5:3.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colors.Rome;ctx.lineWidth=anchor?2.2:1;ctx.stroke();});
    campaigns.forEach(row=>{const color=colors[row.polity]||'#66747d';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x(row.year),y(row.soldiers_thousands),5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.stroke();});
    const romanLabel=rome.find(row=>row.year===305);if(romanLabel){ctx.textAlign='left';ctx.fillStyle=colors.Rome;ctx.font='700 9px Arial';ctx.fillText('ROME · CENTRAL ESTIMATE SERIES',x(romanLabel.year)+8,y(romanLabel.soldiers_thousands)-8);}
    if(focus){const xx=x(focus.year),yy=y(focus.soldiers_thousands);ctx.strokeStyle='rgba(24,34,44,.45)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotHeight);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(xx,yy,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colors[focus.polity]||'#333';ctx.lineWidth=3;ctx.stroke();}
    ctx.textAlign='left';ctx.fillStyle='#53616b';ctx.font='600 9px Arial';ctx.fillText('SOLDIERS UNDER ARMS · THOUSANDS',left,22);
  },[data,rome,campaigns,focus]);

  const handle=(clientX:number,clientY:number)=>{const rect=canvas.current?.getBoundingClientRect();if(!rect||!data.length)return;const localX=((clientX-rect.left)/rect.width)*1050,localY=((clientY-rect.top)/rect.height)*520,x=(year:number)=>76+((year+500)/1000)*(1050-76-34),y=(value:number)=>48+(520-48-66)-(value/550)*(520-48-66);let nearest=0,score=Infinity;data.forEach((row,index)=>{const distance=Math.hypot((x(row.year)-localX)*.7,y(row.soldiers_thousands)-localY);if(distance<score){score=distance;nearest=index;}});setSelected(nearest);};
  const range=focus?.low_thousands&&focus?.high_thousands?`${people(focus.low_thousands)}–${people(focus.high_thousands)} model range`:'single reported or reconstructed force';

  return <div className="capacity-chart">
    <div className="metric-bar"><b>Force estimates and campaign observations</b><span>No invented 50-year rival series · no unsupported iron tonnage</span></div>
    <div className="capacity-readout"><div><span>Polity</span><b style={{color:colors[focus?.polity]}}>{focus?.polity||'Loading…'}</b></div><div><span>Date · event</span><b>{focus?.display_year||'—'}</b><small>{focus?.event}</small></div><div><span>Soldiers under arms</span><b>{focus?people(focus.soldiers_thousands):'—'}</b><small>{range}</small></div><div className="red-stat"><span>Evidence class</span><b>{focus?evidenceLabel(focus.evidence_grade):'—'}</b><small>{focus?.series==='rome'?'central estimate series':'one campaign, not state capacity'}</small></div></div>
    <canvas ref={canvas} width="1050" height="520" onPointerMove={event=>handle(event.clientX,event.clientY)} onPointerDown={event=>handle(event.clientX,event.clientY)} aria-label="Roman force estimates and reported campaign forces from 500 BCE to 500 CE" />
    <div className="polity-legend">{Object.keys(colors).map(name=><span key={name}><i style={{background:colors[name]}} />{name}</span>)}<span className="anchor-key"><i />rival campaign observation</span></div>
    <div className="chart-explain"><p><b>{focus?.event||'Observation'}:</b> {focus?.notes} <em>Sources: {focus?.source_keys}</em></p><div><a href="/data/roman-military-capacity.csv" download>Rome estimates ↓</a><a href="/data/comparison-forces.csv" download>Campaign forces ↓</a></div></div>
    <section className="equipment-index" aria-labelledby="equipment-index-title"><div><span>Third–second centuries BCE only</span><h5 id="equipment-index-title">Worked metal per heavy infantryman</h5><p>Relative index from Devereaux’s public summary—not kilograms. Iron and bronze are combined.</p></div><div className="equipment-bars"><div><label><b>Roman heavy infantry</b><strong>125</strong></label><i style={{width:'100%'}} /></div><div><label><b>Nearest comparator</b><strong>100</strong></label><i style={{width:'80%'}} /></div></div><p className="equipment-caveat"><b>What we know:</b> the Roman panoply contained about 25% more worked metal than the nearest comparison in Devereaux’s model. <b>What we do not know from the public evidence:</b> a defensible kilogram value for every polity across a thousand years. The earlier tonnage series has therefore been removed.</p><a href="/data/equipment-comparison.csv" download>Relative equipment data ↓</a></section>
  </div>;
}
