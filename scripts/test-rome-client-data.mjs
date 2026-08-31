import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const snapshotRevision = '20260830-client4';
const snapshotFiles = [
  'land.topojson',
  'borders.topojson',
  'rivers.topojson',
  'ancient-polities.geojson',
  'roman-military-capacity.csv',
  'comparison-forces.csv',
  'equipment-comparison.csv',
  'rome-territorial-growth.csv',
];
const required = (value) => value && value !== 'undefined' && value !== 'null';

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index]])));
}

const [romeCsv, rivalsCsv, growthCsv, polityJson] = await Promise.all([
  readFile(new URL('public/data/roman-military-capacity.csv', root), 'utf8'),
  readFile(new URL('public/data/comparison-forces.csv', root), 'utf8'),
  readFile(new URL('public/data/rome-territorial-growth.csv', root), 'utf8'),
  readFile(new URL('public/data/ancient-polities.geojson', root), 'utf8'),
]);

for (const filename of snapshotFiles) {
  const [canonical, snapshot] = await Promise.all([
    readFile(new URL(`public/data/${filename}`, root)),
    readFile(new URL(`public/data/rome/${snapshotRevision}/${filename}`, root)),
  ]);
  if (!canonical.equals(snapshot)) throw new Error(`Rome immutable snapshot diverges: ${filename}`);
}

const clientHelper = await readFile(new URL('app/lib/romeDataClient.ts', root), 'utf8');
if (!clientHelper.includes(`ROME_DATA_REVISION='${snapshotRevision}'`)) throw new Error('Rome client does not target the immutable data snapshot');
const rome = parseCsv(romeCsv);
const rivals = parseCsv(rivalsCsv);
const growth = parseCsv(growthCsv);

for (const [name, rows, textFields, numericFields] of [
  ['Rome estimates', rome, ['polity', 'display_year', 'estimate_type', 'source_keys'], ['year', 'soldiers_thousands', 'army_mid_thousands']],
  ['rival forces', rivals, ['polity', 'display_year', 'evidence_grade', 'source_keys'], ['year', 'soldiers_thousands']],
]) {
  if (!rows.length) throw new Error(`${name} has no rows`);
  for (const row of rows) {
    for (const field of textFields) if (!required(row[field])) throw new Error(`${name}: invalid ${field}`);
    for (const field of numericFields) if (!Number.isFinite(Number(row[field]))) throw new Error(`${name}: invalid ${field}`);
  }
}

for (const row of rome) {
  if (Number(row.army_mid_thousands) !== Number(row.soldiers_thousands)) throw new Error('Rome estimates: legacy army_mid_thousands alias diverges from soldiers_thousands');
  if (row.army_low_thousands || row.army_high_thousands) throw new Error('Rome estimates: deprecated uncertainty columns must remain blank');
}

if (growth.length !== 25 || new Set(growth.map((row) => row.polity)).size !== 3) throw new Error('Rome growth comparison must preserve twenty-five anchors across three polities');
for (const row of growth) {
  for (const field of ['polity', 'segment', 'source_keys', 'source_page']) if (!required(row[field])) throw new Error(`Rome growth comparison: invalid ${field}`);
  for (const field of ['anchor_year', 'elapsed_years', 'area_million_km2', 'share_of_series_peak']) if (!Number.isFinite(Number(row[field]))) throw new Error(`Rome growth comparison: invalid ${field}`);
}
const peaks = Object.fromEntries(['Achaemenid Persia', 'Western Han', 'Rome'].map((polity) => [polity, Math.max(...growth.filter((row) => row.polity === polity).map((row) => Number(row.area_million_km2)))]));
if (peaks['Achaemenid Persia'] !== 5.5 || peaks['Western Han'] !== 6 || peaks.Rome !== 5) throw new Error('Rome growth comparison peak anchors changed');

const polities = JSON.parse(polityJson);
if (!Array.isArray(polities.features) || !polities.features.length) throw new Error('Polity atlas has no features');
for (const feature of polities.features) {
  if (!required(feature?.properties?.Name) || !Number.isFinite(Number(feature?.properties?.FromYear)) || !Number.isFinite(Number(feature?.properties?.ToYear)) || !Number.isFinite(Number(feature?.properties?.Area)) || !feature?.geometry?.coordinates) throw new Error('Polity atlas has an incompatible feature');
}

console.log(`Rome client contracts valid: ${rome.length} Roman estimates, ${rivals.length} rival observations, ${polities.features.length} polity geometries, immutable snapshot ${snapshotRevision}.`);
