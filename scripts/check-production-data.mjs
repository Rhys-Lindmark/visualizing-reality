const base=(process.env.HEEV_SITE_URL??'https://visualizing-reality.rhyslindmark.chatgpt.site').replace(/\/$/,'');
const revision='20260830-client1';
const assets=[
  ['uruk-writing-corpus.csv',7],
  ['uruk-urbanization-clocks.csv',10],
  ['uruk-water-ecology.csv',11],
  ['uruk-grain-state-evidence.csv',10],
  ['uruk-state-fragility-evidence.csv',8],
];

const failures=[];
for(const [filename,expectedRows] of assets){
  const url=`${base}/data/uruk/${revision}/${filename}`;
  try{
    const response=await fetch(url,{headers:{Accept:'text/csv,text/plain;q=0.9,*/*;q=0.1'}});
    const text=await response.text();
    const rows=text.trim().split(/\r?\n/).length-1;
    if(!response.ok)failures.push(`${filename}: HTTP ${response.status}`);
    else if(!/text\/csv|text\/plain/.test(response.headers.get('content-type')??''))failures.push(`${filename}: unexpected content type ${response.headers.get('content-type')}`);
    else if(text.trimStart().startsWith('<'))failures.push(`${filename}: HTML returned instead of CSV`);
    else if(rows!==expectedRows)failures.push(`${filename}: ${rows} data rows, expected ${expectedRows}`);
    else console.log(`ok ${response.status} ${filename} (${rows} rows)`);
  }catch(error){failures.push(`${filename}: ${error instanceof Error?error.message:String(error)}`);}
}
if(failures.length){console.error('Production data smoke test failed:');for(const failure of failures)console.error(`- ${failure}`);process.exit(1);}
console.log(`Production data smoke test passed: ${assets.length} immutable Uruk datasets at ${base}`);
