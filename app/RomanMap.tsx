'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Point = [number, number];
type Transform = { scale: Point; translate: Point };
type Geometry = { type: string; arcs: unknown; properties?: Record<string, string | number> };
type Topology = { transform: Transform; arcs: Point[][]; objects: Record<string, { geometries: Geometry[] }> };
type GeoGeometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: Point[][] | Point[][][] };
type GeoFeature = { type: 'Feature'; properties: { Name: string; FromYear: number; ToYear: number; Area: number }; geometry: GeoGeometry };
type GeoCollection = { type: 'FeatureCollection'; features: GeoFeature[] };
type MapData = { land: Topology; borders: Topology; rivers: Topology; extents: Topology; polities: GeoCollection };

const lateEras = [
  { year: '200 CE', title: 'A mature continental empire', detail: 'Rome governs a connected Mediterranean system at near-maximum scale.', kind: 'unified' },
  { year: '293 CE', title: 'Four courts, one empire', detail: 'Diocletian divides imperial responsibility among two senior and two junior emperors.', kind: 'tetrarchy' },
  { year: '395 CE', title: 'The imperial court divides', detail: 'The eastern and western halves now have separate emperors and fiscal centers.', kind: 'division' },
  { year: '476 CE', title: 'The western court disappears', detail: 'Successor kingdoms occupy the West. The Roman Empire continues from Constantinople.', kind: 'successors' },
];

const earlyContext: Record<number, [string, string]> = {
  0: ['A city-state in central Italy', 'Rome is still one polity among many on the Italian peninsula.'],
  5: ['Italy becomes Rome’s strategic base', 'By the First Punic War, Roman power reaches across most of peninsular Italy.'],
  6: ['The war with Hannibal', 'Rome loses armies and allies, but retains enough of its Italian coalition to continue the war.'],
  7: ['A western Mediterranean power', 'Victory over Carthage and Macedon opens the path to overseas provinces.'],
  8: ['The late Republic spans the sea', 'Provincial conquest and civil war transform a federation into an empire.'],
  14: ['The empire at maximum extent', 'Under Trajan, Roman rule stretches from northern Britain to Mesopotamia.'],
};

const keyCities: Array<[number, number, string]> = [
  [12.5, 41.9, 'Rome'], [-5.98, 37.39, 'Hispalis'], [2.35, 48.86, 'Lutetia'],
  [-0.13, 51.5, 'Londinium'], [23.73, 37.98, 'Athens'], [29.0, 41.01, 'Constantinople'],
  [10.32, 36.85, 'Carthage'], [36.28, 33.51, 'Damascus'], [29.92, 31.2, 'Alexandria'],
];

const mapYears = [-500,-338,-298,-290,-272,-264,-218,-133,-60,16,47,69,84,102,117,200,293,395,476];
const polityColors: Record<string,string> = {
  'Achaemenid Empire':'#9b709f','Carthage':'#c59a3e','(Macedonian Empire)':'#5f8fa2','Antigonid Macedonia':'#5f8fa2',
  'Seleucid Empire':'#d18b42','Ptolemaic Kingdom':'#4f9291','Parthian Empire':'#8b6b9d','Sasanian Empire':'#76558a',
  'Etruscans':'#a17c55','Greek City-States':'#6a91ad','Galatia':'#7f9c61','Kingdom of Numidia':'#b07e4b',
  'Illyrian Kingdom':'#77946d','Nabataeans':'#b16f67','Vandal Kingdom':'#8a7456','Visigothic Kingdom':'#789159',
  'Ostrogothic Kingdom':'#627f54','Kingdom of the Franks':'#527b7f','Kingdom of the Suebi':'#92795b','Burgundian Kingdom':'#7e6d91',
  'Brythons':'#81916a','Eastern Roman Empire':'#2d6898','Western Roman Empire':'#ad2e3e','Gallic Empire':'#527b8f',
};

function decodeArc(topology: Topology, index: number): Point[] {
  const reversed = index < 0;
  const arc = topology.arcs[reversed ? ~index : index];
  let x = 0, y = 0;
  const points = arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * topology.transform.scale[0] + topology.transform.translate[0], y * topology.transform.scale[1] + topology.transform.translate[1]] as Point;
  });
  return reversed ? points.reverse() : points;
}

function ringsFor(topology: Topology, geometry: Geometry): Point[][] {
  const polygons = geometry.type === 'Polygon' ? [geometry.arcs] : geometry.arcs as number[][][];
  return (polygons as number[][][]).flatMap((polygon) => polygon.map((ring) => ring.flatMap((arcIndex, i) => {
    const points = decodeArc(topology, arcIndex);
    return i ? points.slice(1) : points;
  })));
}

function linesFor(topology: Topology, geometry: Geometry): Point[][] {
  const lines = geometry.type === 'LineString' ? [geometry.arcs] : geometry.arcs as number[][];
  return (lines as number[][]).map((line) => line.flatMap((arcIndex, i) => {
    const points = decodeArc(topology, arcIndex);
    return i ? points.slice(1) : points;
  }));
}

const VIEW = { west: -12, east: 63, south: 20, north: 58 };
function project([lon, lat]: Point, width: number, height: number): Point {
  const x = ((lon - VIEW.west) / (VIEW.east - VIEW.west)) * width;
  const merc = (v: number) => Math.log(Math.tan(Math.PI / 4 + (v * Math.PI / 180) / 2));
  const y = ((merc(VIEW.north) - merc(lat)) / (merc(VIEW.north) - merc(VIEW.south))) * height;
  return [x, y];
}

function pathRings(ctx: CanvasRenderingContext2D, rings: Point[][], width: number, height: number) {
  ctx.beginPath();
  rings.forEach((ring) => ring.forEach((point, i) => {
    const [x, y] = project(point, width, height);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }));
}

function geoRings(geometry: GeoGeometry): Point[][] {
  return geometry.type === 'Polygon' ? geometry.coordinates as Point[][] : (geometry.coordinates as Point[][][]).flat();
}

function drawGeoFeature(ctx: CanvasRenderingContext2D, feature: GeoFeature, color: string, label = true) {
  const rings=geoRings(feature.geometry);pathRings(ctx,rings,ctx.canvas.width,ctx.canvas.height);ctx.fillStyle=`${color}bb`;ctx.fill('evenodd');ctx.strokeStyle='rgba(46,54,59,.62)';ctx.lineWidth=.9;ctx.stroke();
  if(!label||feature.properties.Area<35000)return;
  const points=rings.flat().filter(([lon,lat])=>lon>=VIEW.west&&lon<=VIEW.east&&lat>=VIEW.south&&lat<=VIEW.north);if(!points.length)return;
  const minLon=Math.min(...points.map(p=>p[0])),maxLon=Math.max(...points.map(p=>p[0])),minLat=Math.min(...points.map(p=>p[1])),maxLat=Math.max(...points.map(p=>p[1]));
  const names:Record<string,string>={'(Macedonian Empire)':'MACEDON','Antigonid Macedonia':'MACEDON','Greek City-States':'GREEK CITY-STATES','Kingdom of Numidia':'NUMIDIA'};
  drawText(ctx,names[feature.properties.Name]||feature.properties.Name.toUpperCase(),(minLon+maxLon)/2,(minLat+maxLat)/2,'rgba(27,37,43,.82)');
}

function drawText(ctx: CanvasRenderingContext2D, text: string, lon: number, lat: number, color = '#314352') {
  const [x, y] = project([lon, lat], ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = color; ctx.font = '600 12px Arial'; ctx.fillText(text, x, y);
}

export default function RomanMap() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<MapData | null>(null);
  const [era, setEra] = useState(14);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/data/land.topojson').then((r) => r.json()),
      fetch('/data/borders.topojson').then((r) => r.json()),
      fetch('/data/rivers.topojson').then((r) => r.json()),
      fetch('/data/roman-extents.topojson').then((r) => r.json()),
      fetch('/data/ancient-polities.geojson').then((r) => r.json()),
    ]).then(([land, borders, rivers, extents, polities]) => setData({ land, borders, rivers, extents, polities }));
  }, []);

  const early = useMemo(() => data ? [...data.extents.objects.CombinedExtentLayers_v6.geometries]
    .filter((g) => Number(g.properties?.order) < 15)
    .sort((a, b) => Number(a.properties?.order) - Number(b.properties?.order)) : [], [data]);
  const total = early.length + lateEras.length;
  const current = era < early.length ? early[era] : null;
  const late = era >= early.length ? lateEras[era - early.length] : null;
  const rawYear = String(current?.properties?.year_string || '');
  const year = current ? (rawYear.startsWith('A.D.') ? rawYear.replace('A.D. ', '') + ' CE' : rawYear.replace('B.C.', 'BCE')) : late?.year;
  const context = late ? [late.title, late.detail] : earlyContext[era] || [String(current?.properties?.long_name || 'Roman expansion'), 'Move the timeline to follow Rome from an Italian city-state to a Mediterranean empire.'];

  useEffect(() => {
    if (!playing || !total) return;
    const timer = window.setInterval(() => setEra((value) => value >= total - 1 ? 0 : value + 1), 1100);
    return () => window.clearInterval(timer);
  }, [playing, total]);

  useEffect(() => {
    if (!data || !data.polities || !canvas.current || !early.length) return;
    const c = canvas.current;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#dcecf2'; ctx.fillRect(0, 0, w, h);

    data.land.objects['10m_land'].geometries.forEach((g) => {
      pathRings(ctx, ringsFor(data.land, g), w, h);
      ctx.fillStyle = '#ece9df'; ctx.fill('evenodd');
      ctx.strokeStyle = '#b8b9b2'; ctx.lineWidth = .8; ctx.stroke();
    });
    data.rivers.objects['10m_rivers_lake_centerlines'].geometries.forEach((g) => {
      pathRings(ctx, linesFor(data.rivers, g), w, h);
      ctx.strokeStyle = 'rgba(111,163,186,.55)'; ctx.lineWidth = .55; ctx.stroke();
    });
    data.borders.objects.geo_lines.geometries.forEach((g) => {
      pathRings(ctx, linesFor(data.borders, g), w, h);
      ctx.strokeStyle = 'rgba(122,125,121,.32)'; ctx.lineWidth = .45; ctx.stroke();
    });

    const mapYear=mapYears[era] ?? 117;
    const romanLateNames=new Set(['Eastern Roman Empire','Western Roman Empire','Gallic Empire']);
    const activePolities=data.polities.features.filter((feature)=>feature.properties.FromYear<=mapYear&&feature.properties.ToYear>=mapYear&&!romanLateNames.has(feature.properties.Name)).sort((a,b)=>b.properties.Area-a.properties.Area);
    activePolities.forEach((feature)=>drawGeoFeature(ctx,feature,polityColors[feature.properties.Name]||'#8a927c'));
    if(mapYear<=-50) drawText(ctx,'GALLIC PEOPLES · NO SINGLE STATE',-1,49,'rgba(63,91,57,.86)');

    const extent = current || early[14];
    const rings = ringsFor(data.extents, extent);
    if (late?.kind === 'division' || late?.kind === 'successors') {
      data.polities.features.filter((feature)=>feature.properties.FromYear<=mapYear&&feature.properties.ToYear>=mapYear&&romanLateNames.has(feature.properties.Name)).sort((a,b)=>b.properties.Area-a.properties.Area).forEach((feature)=>drawGeoFeature(ctx,feature,polityColors[feature.properties.Name]||'#ad2e3e'));
    } else if (!late || late.kind === 'unified') {
      const cumulative = late ? early : early.slice(0,era+1);
      cumulative.forEach((layer)=>{pathRings(ctx,ringsFor(data.extents,layer),w,h);ctx.fillStyle='rgba(173,35,50,.78)';ctx.fill('evenodd');ctx.strokeStyle='#821927';ctx.lineWidth=1.2;ctx.stroke();});
    } else {
      pathRings(ctx, rings, w, h);
      ctx.save(); ctx.clip('evenodd');
      if (late.kind === 'tetrarchy') {
        const blocks = [
          [-12, 18, '#a62d3c', 'MAXIMIAN', -3, 45], [18, 33, '#d37c33', 'DIOCLETIAN', 22, 35],
          [33, 63, '#c6a244', 'GALERIUS', 39, 41], [-12, 7, '#346e91', 'CONSTANTIUS', -4, 52],
        ] as const;
        blocks.forEach(([a, b, color, label, lon, lat]) => {
          const [x] = project([a, 30], w, h); const [x2] = project([b, 30], w, h);
          ctx.fillStyle = color; ctx.globalAlpha = .82; ctx.fillRect(x, 0, x2 - x, h);
          ctx.globalAlpha = 1; drawText(ctx, label, lon, lat, '#fff');
        });
      }
      ctx.restore();
      pathRings(ctx, rings, w, h); ctx.strokeStyle = 'rgba(66,45,45,.8)'; ctx.lineWidth = 1.4; ctx.stroke();
    }

    keyCities.forEach(([lon, lat, label]) => {
      const [x, y] = project([lon, lat], w, h);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#17222c'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#17222c'; ctx.font = '600 10px Arial'; ctx.fillText(label, x + 6, y - 5);
    });
    ctx.fillStyle = 'rgba(54,105,129,.72)'; ctx.font = 'italic 13px Georgia';
    ctx.fillText('Atlantic Ocean', 42, 255); ctx.fillText('Mediterranean Sea', 440, 436);
  }, [data, early, current, late]);

  return (
    <div className="map-module">
      <div className="map-heading">
        <div><span>Roman territorial history</span><h4>{context[0]}</h4><p>{context[1]}</p></div>
        <div className="map-date"><b>{year || 'Loading…'}</b><small>{late?.kind === 'tetrarchy' ? 'administrative portfolios' : late?.kind === 'successors' ? 'political reconstruction' : 'controlled territory'}</small></div>
      </div>
      <div className="map-stage"><canvas ref={canvas} width="1100" height="570" aria-label={`Map of Roman territory in ${year}`} /><div className="map-key"><span><i className="roman" /> Roman rule</span><span><i className="neighbor-key" /> Seshat/Cliopatria polities</span></div></div>
      <div className="timeline-control">
        <button className="play" type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>{playing ? 'Ⅱ' : '▶'}</button>
        <div className="timeline-track"><input aria-label="Year in Roman history" type="range" min="0" max={Math.max(0,total-1)} value={era} onChange={(e) => { setPlaying(false); setEra(Number(e.target.value)); }} /><div className="year-ticks"><button onClick={()=>setEra(0)} type="button">500 BCE</button><button onClick={()=>setEra(5)} type="button">264 BCE</button><button onClick={()=>setEra(14)} type="button">117 CE</button><button onClick={()=>setEra(16)} type="button">293</button><button onClick={()=>setEra(total-1)} type="button">476</button></div></div>
      </div>
      <div className="map-foot"><p><b>How to read this:</b> Roman territory accumulates through time. Named neighboring shapes are time-indexed polity boundaries—not decorative regions. Gaul is labeled without a border because it was not one state. At 293, color shows administrative responsibility within one empire.</p><p>Roman layers: Sirius T. Bontea · Natural Earth · AWMC. Other polities and late Rome: Seshat Cliopatria, CC BY 4.0; geometry simplified for display.</p></div>
    </div>
  );
}
