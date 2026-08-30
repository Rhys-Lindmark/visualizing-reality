'use client';

import { useEffect, useRef, useState } from 'react';

type Row = {
  year: number; display_year: string; army_mid_thousands: number; army_low_thousands: number;
  army_high_thousands: number; iron_mid_kg_per_soldier: number; iron_low_kg_per_soldier: number;
  iron_high_kg_per_soldier: number; combat_iron_mid_tonnes: number; estimate_type: string;
  source_keys: string; notes: string;
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function formatPeople(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(1)}m` : `${value.toLocaleString()}k`; }

export default function MilitaryCapacityChart() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState(13);

  useEffect(() => {
    fetch('/data/roman-military-capacity.csv').then((r) => r.text()).then((text) => {
      const [headers, ...lines] = parseCSV(text);
      const numeric = new Set(['year','army_mid_thousands','army_low_thousands','army_high_thousands','iron_mid_kg_per_soldier','iron_low_kg_per_soldier','iron_high_kg_per_soldier','combat_iron_mid_tonnes']);
      const parsed = lines.map((line) => Object.fromEntries(headers.map((key, i) => [key, numeric.has(key) ? Number(line[i]) : line[i]])) as Row);
      setRows(parsed); setSelected(parsed.findIndex((r) => r.year === 117));
    });
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx || !rows.length) return;
    const w = 1050, h = 520, left = 74, right = 78, top = 42, bottom = 70;
    const plotW = w - left - right, plotH = h - top - bottom;
    const x = (year: number) => left + ((year + 500) / 1000) * plotW;
    const yPeople = (v: number) => top + plotH - (v / 700) * plotH;
    const yIron = (v: number) => top + plotH - (v / 4000) * plotH;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);

    const periods: Array<[number,number,string,string]> = [[-218,-201,'rgba(189,31,46,.055)','HANNIBALIC WAR'],[-49,-27,'rgba(189,31,46,.055)','CIVIL WARS'],[235,284,'rgba(189,31,46,.055)','3RD-C. CRISIS'],[395,476,'rgba(23,63,104,.055)','WESTERN RETREAT']];
    periods.forEach(([a,b,color,label]) => { ctx.fillStyle=color; ctx.fillRect(x(a),top,x(b)-x(a),plotH); ctx.fillStyle='#8a959c'; ctx.font='600 8px Arial'; ctx.fillText(label,x(a)+4,top+13); });

    ctx.strokeStyle = '#dce1e5'; ctx.lineWidth = 1; ctx.fillStyle = '#75818a'; ctx.font = '10px Arial';
    for (let v = 0; v <= 700; v += 100) { const yy=yPeople(v); ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(w-right,yy);ctx.stroke();ctx.textAlign='right';ctx.fillText(v===0?'0':`${v}k`,left-10,yy+3); }
    for (let year = -500; year <= 500; year += 100) { const xx=x(year);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotH);ctx.strokeStyle='rgba(220,225,229,.55)';ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#75818a';ctx.fillText(year<0?`${Math.abs(year)} BCE`:year===0?'1 CE':`${year} CE`,xx,h-38); }
    ctx.save();ctx.translate(16,top+plotH/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillStyle='#416174';ctx.font='600 9px Arial';ctx.fillText('SOLDIERS UNDER ARMS · THOUSANDS',0,0);ctx.restore();
    ctx.save();ctx.translate(w-12,top+plotH/2);ctx.rotate(Math.PI/2);ctx.textAlign='center';ctx.fillStyle='#a42a38';ctx.fillText('MODELED WORKED IRON · TONNES',0,0);ctx.restore();
    ctx.textAlign='left'; for(let v=0;v<=4000;v+=1000){ctx.fillStyle='#a66b72';ctx.fillText(v===0?'0':`${v/1000}k`,w-right+10,yIron(v)+3);}

    ctx.beginPath(); rows.forEach((r,i)=>{const xx=x(r.year),yy=yPeople(r.army_high_thousands);if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});
    [...rows].reverse().forEach((r)=>ctx.lineTo(x(r.year),yPeople(r.army_low_thousands)));ctx.closePath();ctx.fillStyle='rgba(47,109,164,.14)';ctx.fill();
    ctx.beginPath(); rows.forEach((r,i)=>{const xx=x(r.year),yy=yPeople(r.army_mid_thousands);if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.strokeStyle='#255f91';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath(); rows.forEach((r,i)=>{const xx=x(r.year),yy=yIron(r.combat_iron_mid_tonnes);if(i===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);});ctx.strokeStyle='#bd1f2e';ctx.lineWidth=3;ctx.stroke();

    rows.forEach((r)=>{ctx.fillStyle=r.estimate_type==='ancient_anchor'?'#fff':'#255f91';ctx.beginPath();ctx.arc(x(r.year),yPeople(r.army_mid_thousands),r.estimate_type==='ancient_anchor'?5:2.4,0,Math.PI*2);ctx.fill();if(r.estimate_type==='ancient_anchor'){ctx.strokeStyle='#255f91';ctx.lineWidth=2;ctx.stroke();}});
    const focus=rows[selected]; if(focus){const xx=x(focus.year);ctx.strokeStyle='rgba(24,34,44,.55)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+plotH);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(xx,yPeople(focus.army_mid_thousands),6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#255f91';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#bd1f2e';ctx.beginPath();ctx.arc(xx,yIron(focus.combat_iron_mid_tonnes),5,0,Math.PI*2);ctx.fill();}

    ctx.textAlign='left';ctx.fillStyle='#255f91';ctx.fillRect(left,12,18,3);ctx.fillStyle='#3c4c57';ctx.font='600 9px Arial';ctx.fillText('soldiers under arms',left+25,16);ctx.fillStyle='#bd1f2e';ctx.fillRect(left+150,12,18,3);ctx.fillStyle='#3c4c57';ctx.fillText('people × modeled kg of worked iron',left+175,16);ctx.fillStyle='rgba(47,109,164,.14)';ctx.fillRect(left+405,8,18,10);ctx.fillStyle='#3c4c57';ctx.fillText('uncertainty range',left+430,16);
  }, [rows, selected]);

  const focus = rows[selected];
  const handlePointer = (clientX: number) => {
    const rect=canvas.current?.getBoundingClientRect(); if(!rect || !rows.length) return;
    const logical=((clientX-rect.left)/rect.width)*1050; const year=((logical-74)/(1050-74-78))*1000-500;
    let nearest=0; rows.forEach((r,i)=>{if(Math.abs(r.year-year)<Math.abs(rows[nearest].year-year))nearest=i;});setSelected(nearest);
  };

  return (
    <div className="capacity-chart">
      <div className="capacity-readout">
        <div><span>Selected year</span><b>{focus?.display_year || 'Loading…'}</b></div>
        <div><span>Soldiers under arms</span><b>{focus ? formatPeople(focus.army_mid_thousands) : '—'}</b><small>{focus ? `${formatPeople(focus.army_low_thousands)}–${formatPeople(focus.army_high_thousands)}` : ''}</small></div>
        <div><span>Iron per soldier</span><b>{focus ? `${focus.iron_mid_kg_per_soldier} kg` : '—'}</b><small>modeled average</small></div>
        <div className="red-stat"><span>Fielded worked iron</span><b>{focus ? `${focus.combat_iron_mid_tonnes.toLocaleString()} t` : '—'}</b><small>people × kg</small></div>
      </div>
      <canvas ref={canvas} width="1050" height="520" onPointerMove={(e)=>handlePointer(e.clientX)} onPointerDown={(e)=>handlePointer(e.clientX)} aria-label="Time series of estimated Roman soldiers under arms and modeled tonnes of worked iron from 500 BCE to 500 CE" />
      <div className="chart-explain"><p><b>{focus?.estimate_type?.replaceAll('_',' ') || 'Model'}.</b> {focus?.notes}</p><div><a href="/data/roman-military-capacity.csv" download>Download data CSV ↓</a><a href="/data/roman-military-sources.csv" download>Download sources CSV ↓</a></div></div>
    </div>
  );
}
