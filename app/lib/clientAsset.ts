type AssetOptions={
  signal?:AbortSignal;
  label?:string;
  attempts?:number;
};

const DATA_MIRROR_ROOT='https://raw.githubusercontent.com/Rhys-Lindmark/visualizing-reality/main/public';

function requestUrl(url:string,attempt:number){
  const separator=url.includes('?')?'&':'?';
  return `${url}${separator}asset_attempt=${Date.now()}-${attempt}`;
}

function pause(milliseconds:number){
  return new Promise(resolve=>setTimeout(resolve,milliseconds));
}

function candidates(url:string){
  if(!url.startsWith('/data/'))return[url];
  return[url,`${DATA_MIRROR_ROOT}${url}`];
}

async function requestText(url:string,attempt:number,signal:AbortSignal|undefined){
  const response=await fetch(requestUrl(url,attempt),{
    cache:'no-store',
    headers:{Accept:'text/csv,text/plain;q=0.9,*/*;q=0.1'},
    signal,
  });
  if(!response.ok)throw new Error(`${url} returned HTTP ${response.status}`);
  const text=await response.text();
  if(!text.trim()||text.trimStart().startsWith('<'))throw new Error(`${url} did not return data`);
  return text;
}

export async function fetchClientText(url:string,{signal,label=url,attempts=6}:AssetOptions={}){
  let lastError:unknown;
  for(let attempt=0;attempt<attempts;attempt+=1){
    for(const candidate of candidates(url)){
      try{return await requestText(candidate,attempt,signal);}
      catch(problem){lastError=problem;if(signal?.aborted)throw problem;}
    }
    if(attempt<attempts-1)await pause(Math.min(400*2**attempt,3200));
  }
  throw new Error(`${label} could not be loaded from the site or its public data mirror${lastError instanceof Error?`: ${lastError.message}`:''}`);
}

export async function fetchClientJson<T>(url:string,options:AssetOptions={}){
  const text=await fetchClientText(url,options);
  try{return JSON.parse(text) as T;}
  catch{throw new Error(`${options.label??url} did not return valid JSON`);}
}
