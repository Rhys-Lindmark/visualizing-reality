type AssetOptions={
  signal?:AbortSignal;
  label?:string;
  attempts?:number;
};

function requestUrl(url:string,attempt:number){
  const separator=url.includes('?')?'&':'?';
  return `${url}${separator}asset_attempt=${Date.now()}-${attempt}`;
}

function pause(milliseconds:number){
  return new Promise(resolve=>setTimeout(resolve,milliseconds));
}

export async function fetchClientText(url:string,{signal,label=url,attempts=6}:AssetOptions={}){
  let lastError:unknown;
  for(let attempt=0;attempt<attempts;attempt+=1){
    try{
      const response=await fetch(requestUrl(url,attempt),{
        cache:'no-store',
        headers:{Accept:'text/csv,text/plain;q=0.9,*/*;q=0.1'},
        signal,
      });
      if(!response.ok)throw new Error(`${label} returned HTTP ${response.status}`);
      const text=await response.text();
      if(!text.trim()||text.trimStart().startsWith('<'))throw new Error(`${label} did not return data`);
      return text;
    }catch(problem){
      lastError=problem;
      if(signal?.aborted)throw problem;
      if(attempt<attempts-1)await pause(Math.min(400*2**attempt,3200));
    }
  }
  throw lastError;
}

export async function fetchClientJson<T>(url:string,options:AssetOptions={}){
  const text=await fetchClientText(url,options);
  try{return JSON.parse(text) as T;}
  catch{throw new Error(`${options.label??url} did not return valid JSON`);}
}
