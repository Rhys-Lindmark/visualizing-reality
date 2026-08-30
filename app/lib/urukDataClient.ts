export const URUK_DATA_REVISION='20260830-client1';
const URUK_DATA_ROOT=`/data/uruk/${URUK_DATA_REVISION}`;

export function urukDataUrl(filename:string){
  return `${URUK_DATA_ROOT}/${filename.replace(/^\/+/, '')}`;
}

export async function fetchUrukText(filename:string,signal?:AbortSignal){
  const url=urukDataUrl(filename);
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt+=1){
    try{
      const response=await fetch(url,{cache:'no-store',headers:{Accept:'text/csv,text/plain;q=0.9,*/*;q=0.1'},signal});
      if(!response.ok)throw new Error(`${filename} returned HTTP ${response.status}`);
      const text=await response.text();
      if(!text.trim()||text.trimStart().startsWith('<'))throw new Error(`${filename} did not return CSV data`);
      return text;
    }catch(problem){
      lastError=problem;
      if(signal?.aborted)throw problem;
      if(attempt===0)await new Promise(resolve=>window.setTimeout(resolve,350));
    }
  }
  throw lastError;
}
