import { fetchClientText } from './clientAsset';

export const URUK_DATA_REVISION='20260830-client1';
const URUK_DATA_ROOT=`/data/uruk/${URUK_DATA_REVISION}`;

export function urukDataUrl(filename:string){
  return `${URUK_DATA_ROOT}/${filename.replace(/^\/+/, '')}`;
}

export async function fetchUrukText(filename:string,signal?:AbortSignal){
  return fetchClientText(urukDataUrl(filename),{signal,label:filename});
}
