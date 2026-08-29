'use client';

import { useEffect, useRef, useState } from 'react';

const eras = [
  { year: '509 BCE', name: 'Republic founded', area: '0.8k km²', index: 0 },
  { year: '264 BCE', name: 'Italian federation', area: '130k km²', index: 1 },
  { year: '44 BCE', name: 'Late Republic', area: '2.0m km²', index: 2 },
  { year: '117 CE', name: 'Maximum extent', area: '5.0m km²', index: 3 },
  { year: '293 CE', name: 'The Tetrarchy', area: '4.4m km²', index: 4 },
  { year: '395 CE', name: 'Permanent division', area: '4.0m km²', index: 5 },
  { year: '476 CE', name: 'West falls', area: 'East endures', index: 6 },
];

const land = [
  [[55,42],[188,26],[270,62],[315,112],[374,104],[423,56],[522,49],[578,85],[665,75],[742,105],[842,83],[888,135],[875,192],[795,205],[749,178],[690,212],[620,202],[570,239],[519,226],[466,256],[415,230],[360,257],[296,240],[257,198],[190,180],[122,148],[62,112]],
  [[295,241],[333,257],[346,297],[374,334],[361,395],[328,381],[310,331]],
  [[29,279],[137,251],[232,260],[306,292],[316,361],[240,395],[123,388],[49,349]],
  [[425,272],[494,258],[568,279],[648,263],[718,283],[806,267],[892,291],[882,389],[775,407],[660,391],[553,402],[454,376]],
];

const romanShapes = [
  [[315,257],[326,251],[335,264],[326,282],[315,274]],
  [[292,235],[339,221],[365,254],[355,306],[332,337],[308,307],[303,270]],
  [[218,186],[290,170],[352,206],[401,193],[461,222],[452,272],[406,289],[362,337],[313,314],[275,281],[213,254],[179,218]],
  [[93,145],[189,117],[272,135],[342,163],[416,151],[493,172],[570,153],[651,173],[725,154],[782,188],[746,241],[686,252],[623,235],[561,264],[487,254],[428,281],[363,337],[302,313],[244,281],[169,261],[112,219]],
  [[105,151],[201,121],[284,138],[356,167],[427,156],[504,176],[577,162],[651,178],[724,163],[769,195],[733,238],[672,247],[614,232],[550,260],[479,250],[422,278],[363,332],[305,309],[243,279],[172,258],[118,217]],
  [[135,159],[217,133],[286,144],[351,171],[419,161],[497,179],[572,164],[648,181],[717,169],[757,197],[728,235],[668,245],[610,230],[548,257],[478,248],[421,275],[365,328],[309,307],[250,278],[184,256],[137,217]],
  [[420,163],[499,179],[574,165],[648,181],[718,169],[755,197],[727,235],[668,245],[611,230],[549,257],[480,248],[423,275],[395,247]],
];

export default function RomanMap() {
  const [era, setEra] = useState(3);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 920, 430);
    ctx.fillStyle = '#f2f0eb'; ctx.fillRect(0, 0, 920, 430);
    ctx.strokeStyle = '#d9d6ce'; ctx.lineWidth = 1;
    for (let x=20;x<920;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,430);ctx.stroke();}
    for (let y=20;y<430;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(920,y);ctx.stroke();}
    land.forEach((poly) => { ctx.beginPath(); poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); ctx.fillStyle='#d9d8cf';ctx.fill();ctx.strokeStyle='#b8b7af';ctx.stroke(); });
    const empire = romanShapes[era]; ctx.beginPath(); empire.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=era===6?'rgba(34,91,146,.78)':'rgba(189,31,46,.82)';ctx.fill();ctx.strokeStyle=era===6?'#174978':'#871622';ctx.lineWidth=2;ctx.stroke();
    const cities = [[327,276,'Rome'],[465,235,'Constantinople'],[289,195,'Lugdunum'],[397,305,'Carthage'],[583,237,'Antioch'],[686,257,'Alexandria']];
    ctx.font='11px Arial'; cities.forEach(([x,y,label])=>{ctx.fillStyle='#17222c';ctx.beginPath();ctx.arc(Number(x),Number(y),3,0,Math.PI*2);ctx.fill();ctx.fillText(String(label),Number(x)+7,Number(y)-6);});
    ctx.fillStyle='#7d7e79';ctx.font='12px Arial';ctx.fillText('ATLANTIC',62,205);ctx.fillText('MEDITERRANEAN SEA',420,340);ctx.fillText('PARTHIA / PERSIA',735,228);
  }, [era]);

  const current = eras[era];
  return (
    <div className="map-module">
      <div className="map-topline"><div><b>{current.year}</b><span>{current.name}</span></div><div><small>Approx. controlled area</small><strong>{current.area}</strong></div></div>
      <canvas ref={canvas} width="920" height="430" aria-label={`Stylized map of Roman territory in ${current.year}`} />
      <div className="era-control">
        <input aria-label="Year in Roman history" type="range" min="0" max="6" value={era} onChange={(e)=>setEra(Number(e.target.value))} />
        <div>{eras.map((item,i)=><button key={item.year} className={i===era?'active':''} onClick={()=>setEra(i)} type="button"><i />{item.year}</button>)}</div>
      </div>
      <p className="map-note"><span /> Roman territory is simplified for this early prototype. Borders were zones of influence, not modern lines.</p>
    </div>
  );
}
