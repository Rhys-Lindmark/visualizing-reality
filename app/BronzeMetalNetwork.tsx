'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchClientJson, fetchClientText } from './lib/clientAsset';

type Point=[number,number];
type Geometry={type:string;arcs:unknown};
type Topology={transform:{scale:Point;translate:Point};arcs:Point[][];objects:Record<string,{geometries:Geometry[]}>};
type NodeRow={network_id:string;network_label:string;node_id:string;name:string;latitude:string;longitude:string;role:string;material:string;display_date:string;evidence_status:string;observation:string;source_keys:string;limits:string};
type LinkRow={network_id:string;link_id:string;from_node:string;to_node:string;material:string;link_class:string;evidence_status:string;display_date:string;observation:string;source_keys:string;limits:string};

const REVISION='20260830-bronze-network1';
const nodesUrl=`/data/bronze-age/${REVISION}/bronze-metal-network-nodes.csv`;
const linksUrl=`/data/bronze-age/${REVISION}/bronze-metal-network-links.csv`;
const landUrl='/data/land.topojson';
const networkOrder=['one-cargo','copper-reach','atlantic-tin','textual-hub'];
const networkDeck:Record<string,{number:string;kicker:string;title:string;note:string}>={
  'one-cargo':{number:'01',kicker:'A dated convergence',title:'One ship held both supply chains',note:'Copper is provenanced; the tin source remains debated.'},
  'copper-reach':{number:'02',kicker:'A source with reach',title:'Cypriot copper crossed the sea',note:'78 analyzed ingots across six find regions—not six direct routes.'},
  'atlantic-tin':{number:'03',kicker:'A continental signal',title:'Tin linked Atlantic ore to the Levant',note:'Analytical compatibility without an invented itinerary.'},
  'textual-hub':{number:'04',kicker:'A transaction in words',title:'The texts name exchange before routes',note:'Ugarit, Minoans, and a translator; no mine or cargo volume.'},
};
const materialColors:Record<string,string>={copper:'#b76832',tin:'#4f7a91',copper_and_tin:'#b52232'};
const MIN_LON=-14,MAX_LON=76,MIN_LAT=22,MAX_LAT=58;

function parseCSV<T>(text:string):T[]{const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;for(let index=0;index<text.length;index++){const char=text[index];if(char==='"'&&quoted&&text[index+1]==='"'){cell+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[index+1]==='\n')index++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const[headers,...body]=rows;return body.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??''])) as T);}
function decodeArc(topology:Topology,index:number):Point[]{const reversed=index<0,arc=topology.arcs[reversed?~index:index];let x=0,y=0;const points=arc.map(([dx,dy])=>{x+=dx;y+=dy;return[x*topology.transform.scale[0]+topology.transform.translate[0],y*topology.transform.scale[1]+topology.transform.translate[1]] as Point;});return reversed?points.reverse():points;}
function topoRings(topology:Topology,geometry:Geometry):Point[][]{const polygons=geometry.type==='Polygon'?[geometry.arcs]:geometry.arcs as number[][][];return(polygons as number[][][]).flatMap(poly=>poly.map(ring=>ring.flatMap((arc,index)=>{const points=decodeArc(topology,arc);return index?points.slice(1):points;})));}
function project([lon,lat]:Point,width:number,height:number):Point{return[((lon-MIN_LON)/(MAX_LON-MIN_LON))*width,((MAX_LAT-lat)/(MAX_LAT-MIN_LAT))*height];}
function label(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,character=>character.toUpperCase());}

export default function BronzeMetalNetwork(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const[nodes,setNodes]=useState<NodeRow[]>([]);
  const[links,setLinks]=useState<LinkRow[]>([]);
  const[land,setLand]=useState<Topology|null>(null);
  const[state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const[error,setError]=useState('');
  const[network,setNetwork]=useState('one-cargo');
  const[selectedId,setSelectedId]=useState('uluburun');
  const[attempt,setAttempt]=useState(0);

  useEffect(()=>{const controller=new AbortController();Promise.all([
    fetchClientText(nodesUrl,{signal:controller.signal,label:'Network nodes'}).then(parseCSV<NodeRow>),
    fetchClientText(linksUrl,{signal:controller.signal,label:'Network links'}).then(parseCSV<LinkRow>),
    fetchClientJson<Topology>(landUrl,{signal:controller.signal,label:'Basemap'}),
  ]).then(([parsedNodes,parsedLinks,topology])=>{const networks=new Set(parsedNodes.map(row=>row.network_id));if(parsedNodes.length!==19||parsedLinks.length!==16||networks.size!==4||!topology?.objects?.['10m_land']||parsedNodes.some(row=>!row.limits||!row.source_keys)||parsedLinks.some(row=>!row.limits||!row.source_keys))throw new Error('The metal-network response used an incompatible schema.');setNodes(parsedNodes);setLinks(parsedLinks);setLand(topology);setState('ready');}).catch(problem=>{if(controller.signal.aborted)return;setError(problem instanceof Error?problem.message:'The metal network could not be loaded.');setState('error');});return()=>controller.abort();},[attempt]);

  const activeNodes=useMemo(()=>nodes.filter(row=>row.network_id===network),[nodes,network]);
  const activeLinks=useMemo(()=>links.filter(row=>row.network_id===network),[links,network]);
  const selected=activeNodes.find(row=>row.node_id===selectedId)??activeNodes[0];

  useEffect(()=>{if(!canvas.current||!land||!activeNodes.length)return;const ctx=canvas.current.getContext('2d');if(!ctx)return;const width=ctx.canvas.width,height=ctx.canvas.height;ctx.clearRect(0,0,width,height);const sea=ctx.createLinearGradient(0,0,0,height);sea.addColorStop(0,'#dcebf0');sea.addColorStop(1,'#c8dde5');ctx.fillStyle=sea;ctx.fillRect(0,0,width,height);ctx.strokeStyle='rgba(73,105,121,.12)';ctx.lineWidth=1;for(let lon=0;lon<=60;lon+=20){const[x]=project([lon,0],width,height);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let lat=30;lat<=50;lat+=10){const[,y]=project([0,lat],width,height);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}for(const geometry of land.objects['10m_land'].geometries){ctx.beginPath();for(const ring of topoRings(land,geometry)){const visible=ring.some(([lon,lat])=>lon>MIN_LON-10&&lon<MAX_LON+10&&lat>MIN_LAT-10&&lat<MAX_LAT+10);if(!visible)continue;ring.forEach((point,index)=>{const[x,y]=project(point,width,height);if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});}ctx.fillStyle='#eee9dc';ctx.fill('evenodd');ctx.strokeStyle='#aeb8b7';ctx.lineWidth=.7;ctx.stroke();}
    const nodeIndex=new Map(activeNodes.map(row=>[row.node_id,row]));for(const link of activeLinks){const from=nodeIndex.get(link.from_node),to=nodeIndex.get(link.to_node);if(!from||!to)continue;const[aX,aY]=project([Number(from.longitude),Number(from.latitude)],width,height),[bX,bY]=project([Number(to.longitude),Number(to.latitude)],width,height);ctx.save();ctx.strokeStyle=link.link_class==='rejected_hypothesis'?'#8c969c':materialColors[link.material]??'#6b7981';ctx.lineWidth=link.link_class==='analytical_connection'||link.link_class==='analytical_distribution'?3:2;ctx.globalAlpha=(link.link_class.includes('hypothesis')||link.link_class==='possible_intermediary')?.68:.82;if(link.link_class.includes('hypothesis')||link.link_class==='possible_intermediary'||link.link_class==='archival_reference')ctx.setLineDash([8,7]);const curve=Math.max(18,Math.abs(bX-aX)*.12);ctx.beginPath();ctx.moveTo(aX,aY);ctx.quadraticCurveTo((aX+bX)/2,(aY+bY)/2-curve,bX,bY);ctx.stroke();ctx.restore();}
    for(const node of activeNodes){const[x,y]=project([Number(node.longitude),Number(node.latitude)],width,height),active=node.node_id===selected?.node_id;ctx.beginPath();ctx.arc(x,y,active?10:7,0,Math.PI*2);ctx.fillStyle=active?'#fff':materialColors[node.material]??'#6a7780';ctx.fill();ctx.strokeStyle=materialColors[node.material]??'#6a7780';ctx.lineWidth=active?5:2;ctx.stroke();ctx.font=`${active?'700':'600'} 11px Arial`;ctx.fillStyle='#263843';ctx.textAlign=x>width*.79?'right':'left';ctx.fillText(node.name,x+(x>width*.79?-13:13),y-10);}},[land,activeNodes,activeLinks,selected]);

  const chooseNetwork=(id:string)=>{setNetwork(id);const first=nodes.find(row=>row.network_id===id);if(first)setSelectedId(id==='one-cargo'?'uluburun':first.node_id);};
  const chooseFromMap=(clientX:number,clientY:number)=>{const element=canvas.current;if(!element)return;const rect=element.getBoundingClientRect(),point:[number,number]=[((clientX-rect.left)/rect.width)*element.width,((clientY-rect.top)/rect.height)*element.height];let winner:string|undefined,nearest=28;for(const node of activeNodes){const marker=project([Number(node.longitude),Number(node.latitude)],element.width,element.height),distance=Math.hypot(marker[0]-point[0],marker[1]-point[1]);if(distance<nearest){winner=node.node_id;nearest=distance;}}if(winner)setSelectedId(winner);};
  const retry=()=>{setNodes([]);setLinks([]);setLand(null);setError('');setState('loading');setAttempt(value=>value+1);};
  if(state!=='ready'||!selected)return <div className={`data-state bronze-network-data-state ${state}`} role={state==='error'?'alert':'status'}><b>{state==='error'?'The metal network did not load':'Loading copper and tin evidence…'}</b><span>{state==='error'?error:'19 nodes · 16 evidence links · four views'}</span>{state==='error'&&<button type="button" onClick={retry}>Retry network</button>}</div>;

  return <div className="bronze-network-chart">
    <div className="bronze-network-summary"><div><span>One dated shipment</span><b>10 t copper</b><small>plus 1 t tin · Uluburun</small></div><div><span>Cypriot comparison</span><b>78 ingots</b><small>six find regions in one study</small></div><div><span>Invented direct routes</span><b>0</b><small>links show evidence classes</small></div></div>
    <nav className="bronze-network-tabs" aria-label="Choose a metal-network evidence view">{networkOrder.map(id=><button type="button" key={id} onClick={()=>chooseNetwork(id)} className={network===id?'active':''} aria-pressed={network===id}><span>{networkDeck[id].number}</span><div><b>{networkDeck[id].title}</b><small>{networkDeck[id].kicker}</small></div></button>)}</nav>
    <section className="bronze-network-map"><header><div><span>{networkDeck[network].kicker}</span><h5>{networkDeck[network].title}</h5></div><small>{networkDeck[network].note}</small></header><div className="bronze-map-stage"><canvas ref={canvas} width="1100" height="520" onPointerDown={event=>chooseFromMap(event.clientX,event.clientY)} aria-label={`${networkDeck[network].title}; ${selected.name} selected`}/><div className="bronze-map-legend"><span><i className="copper"/>Copper</span><span><i className="tin"/>Tin</span><span><i className="both"/>Cargo convergence</span><small>Dashed = textual, hypothetical, or contested</small></div></div><div className="bronze-node-list" aria-label="Choose a network place">{activeNodes.map(row=><button type="button" key={row.node_id} className={row.node_id===selected.node_id?'active':''} aria-pressed={row.node_id===selected.node_id} onClick={()=>setSelectedId(row.node_id)}><i style={{background:materialColors[row.material]??'#6a7780'}}/><span>{row.name}</span><small>{label(row.role)}</small></button>)}</div></section>
    <section className="bronze-network-readout" aria-live="polite"><div><span>{label(selected.evidence_status)}</span><h5>{selected.name}</h5><b>{selected.display_date} · {label(selected.material)}</b></div><div><p>{selected.observation}</p><small><b>Limit:</b> {selected.limits}</small></div><div><span>Source keys</span><b>{selected.source_keys}</b></div></section>
    <section className="bronze-link-ledger"><div><span>What the lines mean</span><h5>Every connection is inspectable</h5></div><div>{activeLinks.map(link=><article key={link.link_id}><i className={link.link_class}/><span>{label(link.evidence_status)}</span><b>{link.observation}</b><small>{link.limits}</small></article>)}</div></section>
    <div className="cradle-downloads bronze-network-downloads"><p><b>This is an evidence map, not a traffic map.</b> One cargo mass, one analyzed sample, texts, provenance links, and disputed source hypotheses remain different kinds of evidence.</p><div><a href={nodesUrl} download>Nodes CSV ↓</a><a href={linksUrl} download>Links CSV ↓</a></div></div>
  </div>;
}
