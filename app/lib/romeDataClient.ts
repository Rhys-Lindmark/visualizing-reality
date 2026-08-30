// Rome's client bundle and its data must remain compatible across deployments.
// Never overwrite or remove this directory: an already-open tab may keep using
// this bundle after a newer site version is published.
export const ROME_DATA_REVISION='20260830-client4';
const ROME_DATA_ROOT=`/data/rome/${ROME_DATA_REVISION}`;

export function romeDataUrl(path:string){
  const filename=path.split('/').at(-1);
  if(!filename)throw new Error(`Invalid Rome data path: ${path}`);
  return `${ROME_DATA_ROOT}/${filename}`;
}
