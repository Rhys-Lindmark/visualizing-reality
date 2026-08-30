'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Observation = { polity:string;year:number;display_year:string;soldiers_thousands:number;iron_kg_per_soldier:number;combat_iron_tonnes:number;observation:string;event:string;source_keys:string;notes:string };
type Metric = 'iron' | 'soldiers';

const colors:Record<string,string>={
  'Rome':'#bd1f2e','Achaemenid Empire':'#8f68a0','Macedonian Empire':'#397f9a','Gallic polities':'#6e9657','Carthage':'#bf8730','Ptolemaic Kingdom':'#268c87','Seleucid Empire':'#d06a36','Parthian Empire':'#745395','Sasanian Empire':'#53376f',
};

function parseCSV(text:string):string[][]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function objects(text:string){const [headers,...rows]=parseCSV(text);return rows.map(row=>Object.fromEntries(headers.map((key,i)=>[key,row[i]])));}
function people(value:number){return value>=1000?`${(value/1000).toFixed(1)}m`:`${value.toLocaleString()}k`;}

export default function MilitaryCapacityChart(){
  const canvas=useRef<HTMLCanvasElement>(null);const [data,setData]=useState<Observation[]>([]);const [metric,setMetric]=useState<Metric>('iron');const [selected,setSelected]=useState(0);
  useEffect(()=>{Promise.all([fetch('/data/roman-military-capacity.csv').then(r=>r.text()),fetch('/data/comparison-forces.csv').then(r=>r.text())]).then(([romeText,comparisonText])=>{
    const rome=objects(romeText).map((r):Observation=>({polity:'Rome',year:Number(r.year),display_year:String(r.display_year),soldiers_thousands:Number(r.army_mid_thousands),iron_kg_per_soldier:Number(r.iron_mid_kg_per_soldier),combat_iron_tonnes:Number(r.combat_iron_mid_tonnes),observation:String(r.estimate_type).replaceAll('_',' '),event:'Empire-wide force',source_keys:String(r.source_keys),notes:String(r.notes)}));
    const comparison=objects(comparisonText).map((r):Observation=>({polity:String(r.polity),year:Number(r.year),display_year:String(r.display_year),soldiers_thousands:Number(r.soldiers_thousands),iron_kg_per_soldier:Number(r.iron_kg_per_soldier),combat_iron_tonnes:Number(r.combat_iron_tonnes),observation:String(r.observation),event:String(r.event),source_keys:String(r.source_keys),notes:String(r.notes)}));
    const combined=[...rome,...comparison];setData(combined);setSelected(combined.findIndex(r=>r.polity==='Rome'&&r.year===-212));
  });},[]);

  const groups=useMemo(()=>{const grouped=new Map<string,Observation[]>();data.forEach(row=>grouped.set(row.polity,[...(grouped.get(row.polity)||[]),row]));return [...grouped.entries()].map(([name,rows])=>[name,rows.sort((a,b)=>a.year-b.year)] as [string,Observation[]]);},[data]);
  const focus=data[selected];

  useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx||!data.length)return;const w=1050,h=520,left=76,right=34,top=50,bottom=66,plotW=w-left-right,plotH=h-top-bottom;const ymax=metric==='iron'?4000:550;const x=(year:number)=>left+((year+500)/1000)*plotW;const y=(row:Observation)=>top+plotH-((metric==='iron'?row.combat_iron_tonnes:row.soldiers_thousands)/ymax)*plotH;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
    const periods:Array<[number,number,string,string]>=[[-218,-201,'rgba(189,31,46,.05)','HANNIBALIC WAR'],[-49,-27,'rgba(189,31,46,.05)','CIVIL WARS'],[235,284,'rgba(24,63,104,.05)','3RD-C. CRISIS'],[395,476,'rgba(24,63,104,.05)','WESTERN RETREAT']];periods.forEach(([a,b,color,label])=>{ctx.fillStyle=color;ctx.fillRect(x(a),top,x(b)-x(a),plotH);ctx.fillStyle='#89949b';ctx.font='600 8px Arial';ctx.fillText(label,x(a)+4,top+12);});
    ctx.strokeStyle='#dce1e5';ctx.lineWidth=1;ctx.font='10px Arial';for(let i=0;i<=5;i++){const value=(ymax/5)*i,yy=top+plotH-(value/ymax)*plotH;ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();ctx.fillStyle='#76828a';ctx.textAlign='right';ctx.fillText(metric==='iron'?`${Math.round(value).toLocaleString()} t`:`${Math.round(value)}k`,left-10,yy+3);}for(let year=-500;year<=500;year+=100){const xx=x(year);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotH);ctx.strokeStyle='rgba(220,225,229,.55)';ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#76828a';ctx.fillText(year<0?`${Math.abs(year)} BCE`:year===0?'1 CE':`${year} CE`,xx,h-35);}
    groups.forEach(([name,rows])=>{const color=colors[name]||'#66747d';const seriesRows=name==='Rome'?rows:rows.filter(row=>row.observation==='modeled series');ctx.strokeStyle=color;ctx.lineWidth=name==='Rome'?3.2:2;ctx.setLineDash(name==='Rome'?[]:[5,5]);if(seriesRows.length>1){ctx.beginPath();seriesRows.forEach((row,i)=>{const xx=x(row.year),yy=y(row);if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.stroke();}ctx.setLineDash([]);rows.forEach(row=>{const anchor=row.observation==='campaign anchor';ctx.fillStyle=anchor?'#fff':color;ctx.beginPath();ctx.arc(x(row.year),y(row),anchor?5:name==='Rome'?3.2:2.6,0,Math.PI*2);ctx.fill();ctx.strokeStyle=anchor?color:'#fff';ctx.lineWidth=anchor?2.2:1;ctx.stroke();});});
    if(focus){const xx=x(focus.year),yy=y(focus);ctx.strokeStyle='rgba(24,34,44,.45)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotH);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(xx,yy,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=colors[focus.polity]||'#333';ctx.lineWidth=3;ctx.stroke();}
    ctx.textAlign='left';ctx.fillStyle='#53616b';ctx.font='600 9px Arial';ctx.fillText(metric==='iron'?'MODELED TONNES OF WORKED IRON IN THE OBSERVED FORCE':'SOLDIERS UNDER ARMS · THOUSANDS',left,22);
  },[data,groups,metric,focus]);

  const handle=(clientX:number,clientY:number)=>{const rect=canvas.current?.getBoundingClientRect();if(!rect||!data.length)return;const lx=((clientX-rect.left)/rect.width)*1050,ly=((clientY-rect.top)/rect.height)*520,ymax=metric==='iron'?4000:550,x=(year:number)=>76+((year+500)/1000)*(1050-76-34),y=(row:Observation)=>50+(520-50-66)-((metric==='iron'?row.combat_iron_tonnes:row.soldiers_thousands)/ymax)*(520-50-66);let nearest=0,score=Infinity;data.forEach((row,i)=>{const d=Math.hypot((x(row.year)-lx)*.7,y(row)-ly);if(d<score){score=d;nearest=i;}});setSelected(nearest);};

  return <div className="capacity-chart">
    <div className="metric-bar"><div><button className={metric==='iron'?'active':''} onClick={()=>setMetric('iron')} type="button">Manpower × iron</button><button className={metric==='soldiers'?'active':''} onClick={()=>setMetric('soldiers')} type="button">Soldiers under arms</button></div><span>No theoretical liability pools · no uncertainty bands</span></div>
    <div className="capacity-readout"><div><span>Polity</span><b style={{color:colors[focus?.polity]}}>{focus?.polity||'Loading…'}</b></div><div><span>Date · observation</span><b>{focus?.display_year||'—'}</b><small>{focus?.event}</small></div><div><span>Soldiers × iron</span><b>{focus?`${people(focus.soldiers_thousands)} × ${focus.iron_kg_per_soldier} kg`:'—'}</b><small>{focus?.observation}</small></div><div className="red-stat"><span>Fielded worked iron</span><b>{focus?`${focus.combat_iron_tonnes.toLocaleString()} t`:'—'}</b><small>modeled comparison</small></div></div>
    <canvas ref={canvas} width="1050" height="520" onPointerMove={e=>handle(e.clientX,e.clientY)} onPointerDown={e=>handle(e.clientX,e.clientY)} aria-label="Comparison of Roman and contemporary military manpower and modeled worked iron from 500 BCE to 500 CE" />
    <div className="polity-legend">{Object.keys(colors).map(name=><span key={name}><i style={{background:colors[name]}} />{name}</span>)}<span className="anchor-key"><i />campaign anchor</span></div>
    <div className="chart-explain"><p><b>{focus?.observation||'Observation'}:</b> {focus?.notes} <em>Sources: {focus?.source_keys}</em></p><div><a href="/data/roman-military-capacity.csv" download>Rome CSV ↓</a><a href="/data/comparison-forces.csv" download>Other forces CSV ↓</a><a href="/data/roman-military-sources.csv" download>Sources CSV ↓</a></div></div>
  </div>;
}
