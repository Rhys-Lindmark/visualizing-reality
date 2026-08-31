const base=(process.env.HEEV_SITE_URL??'https://visualizing-reality.rhyslindmark.chatgpt.site').replace(/\/$/,'');
const mirror='https://raw.githubusercontent.com/Rhys-Lindmark/visualizing-reality/main/public';
const releaseId='20260831-rome-roads1';
const routes=new Map([
  ['/','<title>How Everything Evolved</title>'],
  ['/rome','<title>Rome — How Everything Evolved</title>'],
  ['/uruk','<title>Uruk and the first states — How Everything Evolved</title>'],
  ['/cradles','<title>The cradles of civilization — How Everything Evolved</title>'],
  ['/bronze-age','<title>The Bronze Age world system — How Everything Evolved</title>'],
  ['/iron-age','<title>The Iron Age transformation — How Everything Evolved</title>'],
  ['/persia','<title>Persia and territorial empire — How Everything Evolved</title>'],
  ['/qin-han','<title>Qin and Han China — How Everything Evolved</title>'],
]);
// Every asset fetched by a live visualization. A release is unhealthy when even
// one URL returns the app's HTML 404 shell instead of its data payload.
const assets=[
  ['release','/data/release-manifest.json'],
  ['json','/data/rome/20260830-client4/land.topojson'],
  ['json','/data/rome/20260830-client4/borders.topojson'],
  ['json','/data/rome/20260830-client4/rivers.topojson'],
  ['json','/data/rome/20260830-client4/ancient-polities.geojson'],
  ['csv','/data/rome/20260830-client4/roman-military-capacity.csv'],
  ['csv','/data/rome/20260830-client4/comparison-forces.csv'],
  ['csv','/data/rome/20260831-thin-state1/rome-han-administration.csv'],
  ['csv','/data/rome/20260831-fall1/rome-fall-mechanism.csv'],
  ['csv','/data/rome/20260831-roads1/roman-road-persistence.csv'],
  ['csv','/data/roman-imperial-budget.csv'],
  ['csv','/data/roman-fiscal-observations.csv'],
  ['csv','/data/western-roman-collapse-events.csv'],
  ['csv','/data/africa-fiscal-equivalents.csv'],
  ['csv','/data/roman-afterlives.csv'],
  ['csv','/data/uruk/20260830-client1/uruk-writing-corpus.csv'],
  ['csv','/data/uruk/20260830-client1/uruk-urbanization-clocks.csv'],
  ['csv','/data/uruk/20260830-client1/uruk-water-ecology.csv'],
  ['csv','/data/uruk/20260830-client1/uruk-grain-state-evidence.csv'],
  ['csv','/data/uruk/20260830-client1/uruk-state-fragility-evidence.csv'],
  ['csv','/data/cradles-evidence-clocks.csv'],
  ['csv','/data/cradles/20260830-ecology1/cradles-ecology-profiles.csv'],
  ['csv','/data/cradles/20260830-sequence1/cradles-sequence-clocks.csv'],
  ['csv','/data/cradles/20260830-coordination1/cradles-coordination-routes.csv'],
  ['csv','/data/cradles/20260830-afterlives1/cradles-afterlives.csv'],
  ['csv','/data/bronze-age/20260830-bronze-network1/bronze-metal-network-nodes.csv'],
  ['csv','/data/bronze-age/20260830-bronze-network1/bronze-metal-network-links.csv'],
  ['csv','/data/bronze-age/20260830-palace1/bronze-palace-circuits.csv'],
  ['csv','/data/bronze-age/20260830-chariot1/bronze-chariot-systems.csv'],
  ['csv','/data/bronze-age/20260830-maritime1/bronze-maritime-cases.csv'],
  ['csv','/data/bronze-age/20260830-maritime1/bronze-maritime-links.csv'],
  ['csv','/data/bronze-age/20260830-collapse1/bronze-collapse-windows.csv'],
  ['csv','/data/iron-age/20260830-adoption1/iron-adoption-windows.csv'],
  ['csv','/data/iron-age/20260830-fuel1/iron-smelting-experiments.csv'],
  ['csv','/data/iron-age/20260830-quality1/iron-quality-experiments.csv'],
  ['csv','/data/iron-age/20260830-mobilization1/iron-mobilization-cases.csv'],
  ['csv','/data/iron-age/20260830-institutions1/iron-production-institutions.csv'],
  ['csv','/data/persia/20260830-roads1/persian-royal-road-segments.csv'],
  ['csv','/data/persia/20260830-roads1/persian-road-evidence.csv'],
  ['csv','/data/persia/20260830-satrapies1/persian-satrapal-portfolios.csv'],
  ['csv','/data/persia/20260830-tribute1/persian-tribute-districts.csv'],
  ['csv','/data/persia/20260830-tribute1/persian-obligation-portfolios.csv'],
  ['csv','/data/persia/20260830-coalition1/persian-coalition-windows.csv'],
  ['csv','/data/persia/20260830-afterlives1/persian-institutional-afterlives.csv'],
  ['csv','/data/qin-han/20260830-mobilization1/qin-mobilizing-system.csv'],
  ['csv','/data/qin-han/20260830-standardization1/qin-standardization-practice.csv'],
  ['csv','/data/qin-han/20260830-logistics1/qin-logistics-ecology.csv'],
  ['csv','/data/source-registry.csv'],
  ['json','/data/dataset-registry.json'],
  ['json','/data/claim-registry.json'],
];

const failures=[];
for(const [origin,root] of [['site',base],['mirror',mirror]])for(const [kind,path] of assets){
  const url=`${root}${path}?smoke=${Date.now()}`;
  try{
    const response=await fetch(url,{headers:{Accept:kind==='json'?'application/json,*/*;q=0.1':'text/csv,text/plain;q=0.9,*/*;q=0.1'}});
    const text=await response.text();
    if(!response.ok)failures.push(`${origin} ${path}: HTTP ${response.status}`);
    else if(!text.trim()||text.trimStart().startsWith('<'))failures.push(`${origin} ${path}: HTML or empty payload returned`);
    else if(kind==='json'||kind==='release'){try{const payload=JSON.parse(text);if(kind==='release'&&payload.release_id!==releaseId)failures.push(`${origin} ${path}: expected release ${releaseId}, received ${payload.release_id??'missing id'}`);}catch{failures.push(`${origin} ${path}: invalid JSON`);}}
    else if(!text.includes('\n')||!text.split(/\r?\n/,1)[0].includes(','))failures.push(`${origin} ${path}: invalid CSV`);
    else console.log(`ok ${response.status} ${origin} ${path}`);
  }catch(error){failures.push(`${origin} ${path}: ${error instanceof Error?error.message:String(error)}`);}
}
for(const [route,expectedTitle] of routes){
  try{
    const response=await fetch(`${base}${route}?release=${releaseId}`,{headers:{Accept:'text/html'}});
    const html=await response.text();
    if(!response.ok||!html.includes(expectedTitle))failures.push(`site route ${route}: ${response.ok?'missing its expected page title':`HTTP ${response.status}`}`);
    else console.log(`ok ${response.status} site route ${route}`);
  }catch(error){failures.push(`site route ${route}: ${error instanceof Error?error.message:String(error)}`);}
}
if(failures.length){console.error('Production visualization asset smoke test failed:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1);}
console.log(`Production visualization asset smoke test passed: ${assets.length} assets at both the live site and public GitHub mirror`);
