'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchClientJson, fetchClientText } from './lib/clientAsset';

type Point=[number,number];
type Geometry={type:string;arcs:unknown};
type Topology={transform:{scale:Point;translate:Point};arcs:Point[][];objects:Record<string,{geometries:Geometry[]}>};
type Clock='urban_scale'|'political_centralization'|'durable_notation';
type Row={region:string;region_slug:string;latitude:string;longitude:string;clock:Clock;start_year:string;end_year:string;display_date:string;place:string;observation:string;evidence_status:string;source_keys:string;interpretation:string;limits:string};

const REVISION='20260830-cradles-clocks1';
const dataUrl=`/data/cradles-evidence-clocks.csv?v=${REVISION}`;
const landUrl=`/data/land.topojson?v=${REVISION}`;
const clockOrder:Clock[]=['urban_scale','political_centralization','durable_notation'];
const clockLabels:Record<Clock,string>={urban_scale:'Urban scale',political_centralization:'Political centralization',durable_notation:'Durable notation'};
const clockColors:Record<Clock,string>={urban_scale:'#255b83',political_centralization:'#b27a2c',durable_notation:'#b52232'};
const regionColors:Record<string,string>={mesopotamia:'#b52232',egypt:'#c0842f',indus:'#358080','northern-china':'#6f5b92',mesoamerica:'#56814e',andes:'#376d8e'};
const MIN_YEAR=-4000,MAX_YEAR=-100,SPAN=MAX_YEAR-MIN_YEAR;

function parseCSV(text:string):Row[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'&&quoted&&text[index+1]==='"'){cell+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as Row);}
function decodeArc(topology:Topology,index:number):Point[]{const reversed=index<0,arc=topology.arcs[reversed?~index:index];let x=0,y=0;const points=arc.map(([dx,dy])=>{x+=dx;y+=dy;return[x*topology.transform.scale[0]+topology.transform.translate[0],y*topology.transform.scale[1]+topology.transform.translate[1]] as Point;});return reversed?points.reverse():points;}
function topoRings(topology:Topology,geometry:Geometry):Point[][]{const polygons=geometry.type==='Polygon'?[geometry.arcs]:geometry.arcs as number[][][];return(polygons as number[][][]).flatMap(poly=>poly.map(ring=>ring.flatMap((arc,index)=>{const points=decodeArc(topology,arc);return index?points.slice(1):points;})));}
function project([lon,lat]:Point,width:number,height:number):Point{return[((lon+180)/360)*width,((90-lat)/180)*height];}
function clockLeft(value:string){return `${((Number(value)-MIN_YEAR)/SPAN)*100}%`;}
function clockWidth(start:string,end:string){return `${Math.max(1.4,((Number(end)-Number(start))/SPAN)*100)}%`;}
function displayYear(year:number){return year<0?`${Math.abs(year)} BCE`:`${year} CE`;}
function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}

export default function CradlesEvidenceClocks(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const[rows,setRows]=useState<Row[]>([]);
  const[land,setLand]=useState<Topology|null>(null);
  const[loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading');
  const[error,setError]=useState('');
  const[selectedRegion,setSelectedRegion]=useState('mesopotamia');
  const[selectedClock,setSelectedClock]=useState<Clock>('political_centralization');
  const[attempt,setAttempt]=useState(0);

  useEffect(()=>{const controller=new AbortController();Promise.all([fetchClientText(dataUrl,{signal:controller.signal,label:'Evidence CSV'}).then(parseCSV),fetchClientJson<Topology>(landUrl,{signal:controller.signal,label:'Basemap'})]).then(([parsed,topology])=>{const regions=new Set(parsed.map(row=>row.region_slug));if(parsed.length!==18||regions.size!==6||!topology?.objects?.['10m_land'])throw new Error('The evidence-clock response used an incompatible schema.');setRows(parsed);setLand(topology);setLoadState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The evidence clocks could not be loaded.');setLoadState('error');});return()=>controller.abort();},[attempt]);

  const regions=useMemo(()=>{const seen=new Map<string,Row>();for(const row of rows)if(!seen.has(row.region_slug))seen.set(row.region_slug,row);return[...seen.values()];},[rows]);
  const selectedRows=useMemo(()=>rows.filter(row=>row.region_slug===selectedRegion),[rows,selectedRegion]);
  const selected=selectedRows.find(row=>row.clock===selectedClock)??selectedRows[0];

  useEffect(()=>{if(!canvas.current||!land||!regions.length)return;const ctx=canvas.current.getContext('2d');if(!ctx)return;const width=ctx.canvas.width,height=ctx.canvas.height;ctx.clearRect(0,0,width,height);const sea=ctx.createLinearGradient(0,0,0,height);sea.addColorStop(0,'#dcecf2');sea.addColorStop(1,'#cfe3eb');ctx.fillStyle=sea;ctx.fillRect(0,0,width,height);ctx.strokeStyle='rgba(70,106,125,.15)';ctx.lineWidth=1;for(let lon=-120;lon<=120;lon+=60){const[x]=project([lon,0],width,height);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let lat=-60;lat<=60;lat+=30){const[,y]=project([0,lat],width,height);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}for(const geometry of land.objects['10m_land'].geometries){ctx.beginPath();for(const ring of topoRings(land,geometry))ring.forEach((point,index)=>{const[x,y]=project(point,width,height);if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.fillStyle='#eeeade';ctx.fill('evenodd');ctx.strokeStyle='#adb8b8';ctx.lineWidth=.8;ctx.stroke();}for(const region of regions){const[x,y]=project([Number(region.longitude),Number(region.latitude)],width,height);const active=region.region_slug===selectedRegion;ctx.beginPath();ctx.arc(x,y,active?10:7,0,Math.PI*2);ctx.fillStyle=active?'#fff':regionColors[region.region_slug];ctx.fill();ctx.strokeStyle=regionColors[region.region_slug];ctx.lineWidth=active?5:2;ctx.stroke();ctx.font=`${active?'700':'600'} 12px Arial`;ctx.fillStyle='#263843';ctx.textAlign=x>width*.72?'right':'left';ctx.fillText(region.region,x+(x>width*.72?-13:13),y-11);}},[land,regions,selectedRegion]);

  const chooseRegion=(slug:string)=>{setSelectedRegion(slug);setSelectedClock('political_centralization');};
  const chooseFromMap=(clientX:number,clientY:number)=>{const element=canvas.current;if(!element)return;const rect=element.getBoundingClientRect();const point:[number,number]=[((clientX-rect.left)/rect.width)*element.width,((clientY-rect.top)/rect.height)*element.height];let winner:string|undefined,nearest=32;for(const region of regions){const marker=project([Number(region.longitude),Number(region.latitude)],element.width,element.height);const distance=Math.hypot(marker[0]-point[0],marker[1]-point[1]);if(distance<nearest){winner=region.region_slug;nearest=distance;}}if(winner)chooseRegion(winner);};
  const retry=()=>{setRows([]);setLand(null);setError('');setLoadState('loading');setAttempt(value=>value+1);};

  if(loadState!=='ready'||!selected)return <div className={`data-state cradle-data-state ${loadState}`} role={loadState==='error'?'alert':'status'}><b>{loadState==='error'?'The comparative clocks did not load':'Loading six regional chronologies…'}</b><span>{loadState==='error'?error:'18 sourced observations · three clocks per region'}</span>{loadState==='error'&&<button type="button" onClick={retry}>Retry comparison</button>}</div>;

  return <div className="cradle-clock-chart">
    <div className="cradle-summary"><div><span>Comparative frame</span><b>6 regions</b><small>not a canonical rank</small></div><div><span>Evidence clocks</span><b>3 per region</b><small>cities · states · notation</small></div><div><span>Explicit gap</span><b>Not zero</b><small>Andean script remains unplotted</small></div></div>
    <section className="cradle-map"><canvas ref={canvas} width="1080" height="500" onPointerDown={event=>chooseFromMap(event.clientX,event.clientY)} aria-label={`World map with ${regions.length} selectable early urban and state-formation regions; ${selected.region} selected`}/><div className="cradle-map-note">Select a region</div></section>
    <nav className="cradle-regions" aria-label="Choose a regional evidence chronology">{regions.map(region=><button type="button" key={region.region_slug} className={region.region_slug===selectedRegion?'active':''} aria-pressed={region.region_slug===selectedRegion} onClick={()=>chooseRegion(region.region_slug)}><i style={{background:regionColors[region.region_slug]}}/><b>{region.region}</b><small>{rows.find(row=>row.region_slug===region.region_slug&&row.clock==='urban_scale')?.display_date}</small></button>)}</nav>
    <section className="cradle-clocks"><div className="cradle-clock-heading"><div><span>{selected.region} · three independent questions</span><h5>No single birthday</h5></div><small>4000–100 BCE · phase ranges, not annual data</small></div>
      <div className="cradle-axis">{[-4000,-3000,-2000,-1000,-100].map(year=><span key={year} style={{left:clockLeft(String(year))}}>{displayYear(year)}</span>)}</div>
      <div className="cradle-lanes">{clockOrder.map(clock=>{const row=selectedRows.find(item=>item.clock===clock);if(!row)return null;const gap=row.evidence_status==='evidence_gap';return <div className="cradle-lane" key={clock}><div><i style={{background:clockColors[clock]}}/><b>{clockLabels[clock]}</b></div><div>{gap?<button type="button" className={`gap ${selected===row?'active':''}`} aria-pressed={selected===row} onClick={()=>setSelectedClock(clock)}>Evidence gap · not year zero</button>:<button type="button" className={selected===row?'active':''} style={{left:clockLeft(row.start_year),width:clockWidth(row.start_year,row.end_year),'--clock-color':clockColors[clock]} as React.CSSProperties} aria-pressed={selected===row} onClick={()=>setSelectedClock(clock)}><span>{row.display_date}</span></button>}</div></div>})}</div>
      <div className="cradle-readout"><div><span>{clockLabels[selected.clock]} · {titleCase(selected.evidence_status)}</span><h5>{selected.observation}</h5><b>{selected.place} · {selected.display_date}</b></div><div><p>{selected.interpretation}</p><small><b>Limit:</b> {selected.limits}</small></div><div><span>Source keys</span><b>{selected.source_keys}</b></div></div>
    </section>
    <div className="cradle-downloads"><p><b>Read across, not upward.</b> Earlier is not “more civilized”; each lane asks a different archaeological question.</p><a href={dataUrl} download>Evidence clocks CSV ↓</a></div>
  </div>;
}
