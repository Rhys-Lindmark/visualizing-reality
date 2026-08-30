const base=(process.env.HEEV_SITE_URL??'https://visualizing-reality.rhyslindmark.chatgpt.site').replace(/\/$/,'');
// Every asset fetched by a live visualization. A release is unhealthy when even
// one URL returns the app's HTML 404 shell instead of its data payload.
const assets=[
  ['json','/data/rome/20260830-client4/land.topojson'],
  ['json','/data/rome/20260830-client4/borders.topojson'],
  ['json','/data/rome/20260830-client4/rivers.topojson'],
  ['json','/data/rome/20260830-client4/ancient-polities.geojson'],
  ['csv','/data/rome/20260830-client4/roman-military-capacity.csv'],
  ['csv','/data/rome/20260830-client4/comparison-forces.csv'],
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
  ['csv','/data/source-registry.csv'],
  ['json','/data/dataset-registry.json'],
  ['json','/data/claim-registry.json'],
];

const failures=[];
for(const [kind,path] of assets){
  const url=`${base}${path}?smoke=${Date.now()}`;
  try{
    const response=await fetch(url,{headers:{Accept:kind==='json'?'application/json,*/*;q=0.1':'text/csv,text/plain;q=0.9,*/*;q=0.1'}});
    const text=await response.text();
    if(!response.ok)failures.push(`${path}: HTTP ${response.status}`);
    else if(!text.trim()||text.trimStart().startsWith('<'))failures.push(`${path}: HTML or empty payload returned`);
    else if(kind==='json'){try{JSON.parse(text);}catch{failures.push(`${path}: invalid JSON`);}}
    else if(!text.includes('\n')||!text.split(/\r?\n/,1)[0].includes(','))failures.push(`${path}: invalid CSV`);
    else console.log(`ok ${response.status} ${path}`);
  }catch(error){failures.push(`${path}: ${error instanceof Error?error.message:String(error)}`);}
}
if(failures.length){console.error('Production visualization asset smoke test failed:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1);}
console.log(`Production visualization asset smoke test passed: ${assets.length} assets at ${base}`);
