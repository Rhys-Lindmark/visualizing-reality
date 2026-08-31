import { createServer } from 'node:http';

const upstream=(process.env.HEEV_PROXY_UPSTREAM??'http://127.0.0.1:4333').replace(/\/$/,'');
const port=Number(process.env.HEEV_PROXY_PORT??4334);

createServer(async(request,response)=>{
  const url=request.url??'/';
  if(url.startsWith('/data/')){
    response.writeHead(404,{'content-type':'text/plain','cache-control':'no-store'});
    response.end('Intentional local data failure');
    return;
  }
  try{
    const upstreamResponse=await fetch(`${upstream}${url}`,{headers:{accept:request.headers.accept??'*/*'}});
    const headers=Object.fromEntries([...upstreamResponse.headers].filter(([name])=>!['content-encoding','content-length','transfer-encoding'].includes(name)));
    response.writeHead(upstreamResponse.status,headers);
    response.end(Buffer.from(await upstreamResponse.arrayBuffer()));
  }catch(error){
    console.error('Data-failure proxy upstream request failed',error);
    response.writeHead(502,{'content-type':'text/plain'});
    response.end('Upstream request failed');
  }
}).listen(port,'127.0.0.1',()=>console.log(`Data-failure proxy listening on http://127.0.0.1:${port} -> ${upstream}`));
