// Keep every Rome client-side data request on one deploy contract. Bump this
// value whenever a CSV, GeoJSON, or TopoJSON schema used by the Rome page changes.
export const ROME_DATA_REVISION='20260830-rome-client-cache3';

export function romeDataUrl(path:string){
  return `${path}?v=${ROME_DATA_REVISION}`;
}
