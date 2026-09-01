const base=(process.env.HEEV_SITE_URL??'https://visualizing-reality.rhyslindmark.chatgpt.site').replace(/\/$/,'');
const mirror='https://raw.githubusercontent.com/Rhys-Lindmark/visualizing-reality/main/public';
const releaseId='20260901-caliphates-books1';
const routes=new Map([
  ['/','<title>How Everything Evolved</title>'],
  ['/rome','<title>Rome — How Everything Evolved</title>'],
  ['/uruk','<title>Uruk and the first states — How Everything Evolved</title>'],
  ['/cradles','<title>The cradles of civilization — How Everything Evolved</title>'],
  ['/bronze-age','<title>The Bronze Age world system — How Everything Evolved</title>'],
  ['/iron-age','<title>The Iron Age transformation — How Everything Evolved</title>'],
  ['/persia','<title>Persia and territorial empire — How Everything Evolved</title>'],
  ['/qin-han','<title>Qin and Han China — How Everything Evolved</title>'],
  ['/india','<title>India from cities to empires — How Everything Evolved</title>'],
  ['/steppe','<title>The Steppe — How Everything Evolved</title>'],
  ['/christianity','<title>Christianity — How Everything Evolved</title>'],
  ['/caliphates','<title>The Caliphates — How Everything Evolved</title>'],
  ['/greek-city-states','<title>Greek City-States — How Everything Evolved</title>'],
  ['/hellenistic-kingdoms','<title>Hellenistic Kingdoms — How Everything Evolved</title>'],
  ['/silk-roads','<title>Silk Roads — How Everything Evolved</title>'],
  ['/medieval-europe','<title>Medieval Europe — How Everything Evolved</title>'],
  ['/african-states','<title>African States and Trade — How Everything Evolved</title>'],
  ['/southeast-asia','<title>Southeast Asian Mandalas — How Everything Evolved</title>'],
  ['/mesoamerica','<title>Mesoamerican Cities and States — How Everything Evolved</title>'],
  ['/andes','<title>Andean Worlds and the Inka — How Everything Evolved</title>'],
  ['/mongol-eurasia','<title>Mongol Eurasia — How Everything Evolved</title>'],
  ['/gunpowder-empires','<title>Gunpowder Empires — How Everything Evolved</title>'],
  ['/oceanic-navigation','<title>Oceanic Navigation — How Everything Evolved</title>'],
  ['/great-divergence','<title>The Great Divergence — How Everything Evolved</title>'],
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
  ['csv','/data/india/20260831-metrology1/indus-weight-series.csv'],
  ['csv','/data/india/20260831-metrology1/indus-ruler-monuments.csv'],
  ['csv','/data/india/20260831-monsoon1/indus-cropping-strategies.csv'],
  ['csv','/data/india/20260831-urban1/early-historic-urban-phases.csv'],
  ['csv','/data/india/20260831-maurya1/mauryan-regional-relationships.csv'],
  ['csv','/data/india/20260831-networks1/india-networks-beyond-empires.csv'],
  ['csv','/data/steppe/20260831-alpha1/begash-pastoral-sequence.csv'],
  ['csv','/data/steppe/20260831-mobility1/horse-mobility-stages.csv'],
  ['csv','/data/christianity/20260831-alpha1/pauline-letter-network.csv'],
  ['csv','/data/christianity/20260831-charity1/congregational-care-institutions.csv'],
  ['csv','/data/caliphates/20260831-alpha1/early-caliphate-expansion.csv'],
  ['csv','/data/caliphates/20260831-tax1/caliphal-fiscal-transition.csv'],
  ['csv','/data/caliphates/20260901-arabic1/arabic-administration-clocks.csv'],
  ['csv','/data/caliphates/20260901-trade1/caliphate-cross-border-trade.csv'],
  ['csv','/data/caliphates/20260901-books1/arabic-book-journeys.csv'],
  ['csv','/data/greek-city-states/20260831-alpha1/polis-territory-distribution.csv'],
  ['csv','/data/greek-city-states/20260831-citizens1/military-political-constituencies.csv'],
  ['csv','/data/hellenistic-kingdoms/20260831-alpha1/raphia-contingents.csv'],
  ['csv','/data/hellenistic-kingdoms/20260831-capitals1/royal-capital-machines.csv'],
  ['csv','/data/silk-roads/20260831-alpha1/turfan-money-forms.csv'],
  ['csv','/data/silk-roads/20260831-routes1/silk-route-rerouting.csv'],
  ['csv','/data/medieval-europe/20260831-alpha1/manuscript-production.csv'],
  ['csv','/data/medieval-europe/20260831-charters1/town-charter-rights.csv'],
  ['csv','/data/african-states/20260831-alpha1/ghana-trade-dues.csv'],
  ['csv','/data/african-states/20260831-gateways1/northeast-african-gateways.csv'],
  ['csv','/data/southeast-asia/20260831-alpha1/khao-sam-kaeo-industries.csv'],
  ['csv','/data/southeast-asia/20260831-mandala1/mandala-relationship-evidence.csv'],
  ['csv','/data/mesoamerica/20260831-alpha1/maya-lidar-findings.csv'],
  ['csv','/data/mesoamerica/20260901-water1/maya-water-infrastructure.csv'],
  ['csv','/data/andes/20260901-floors1/andean-ecological-floor-access.csv'],
  ['csv','/data/andes/20260831-alpha1/qhapaq-nan-scale.csv'],
  ['csv','/data/mongol-eurasia/20260831-alpha1/black-death-origin-evidence.csv'],
  ['csv','/data/mongol-eurasia/20260901-operations1/mongol-operational-system.csv'],
  ['csv','/data/gunpowder-empires/20260831-alpha1/military-scale-multipliers.csv'],
  ['csv','/data/gunpowder-empires/20260901-fortress1/artillery-fortress-adaptations.csv'],
  ['csv','/data/oceanic-navigation/20260831-alpha1/manila-galleon-risk.csv'],
  ['csv','/data/oceanic-navigation/20260901-winds1/wind-shaped-routes.csv'],
  ['csv','/data/great-divergence/20260831-alpha1/urban-subsistence-ratios.csv'],
  ['csv','/data/great-divergence/20260901-incentives1/spinning-jenny-returns.csv'],
  ['csv','/data/steppe/20260901-war-system1/steppe-war-system.csv'],
  ['csv','/data/christianity/20260901-constantine1/imperial-church-transition.csv'],
  ['csv','/data/rome/20260901-replacement1/roman-defeat-replacement.csv'],
  ['json','/data/visual-claim-audit.json'],
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
