import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const checked = [];

function fail(message) { errors.push(message); }
function read(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) { fail(`Missing file: ${relativePath}`); return ''; }
  checked.push(relativePath);
  return readFileSync(absolute, 'utf8');
}
function json(relativePath) {
  const text = read(relativePath);
  if (!text) return null;
  try { return JSON.parse(text); } catch (error) { fail(`Malformed JSON in ${relativePath}: ${error.message}`); return null; }
}
function csv(relativePath) {
  const text = read(relativePath);
  if (!text) return [];
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = '';
    } else cell += character;
  }
  if (quoted) fail(`Unclosed quoted field in ${relativePath}`);
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) { fail(`Empty CSV: ${relativePath}`); return []; }
  const headers = rows[0];
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeaders.length) fail(`Duplicate CSV headers in ${relativePath}: ${duplicateHeaders.join(', ')}`);
  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) fail(`${relativePath} row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}
function requireFields(record, fields, context) {
  for (const field of fields) if (String(record[field] ?? '').trim() === '') fail(`${context} is missing ${field}`);
}
function sourceKeys(value) { return String(value).split(';').map(key => key.trim()).filter(Boolean); }
function numeric(record, fields, context) {
  for (const field of fields) if (!Number.isFinite(Number(record[field]))) fail(`${context} has non-numeric ${field}: ${record[field]}`);
}

const sources = csv('public/data/source-registry.csv');
const sourceIndex = new Map();
for (const [index, source] of sources.entries()) {
  const context = `source-registry.csv row ${index + 2}`;
  requireFields(source, ['key', 'author_or_source', 'title', 'year', 'url', 'use_in_model'], context);
  if (!/^[A-Z0-9_]+$/.test(source.key)) fail(`${context} has invalid key ${source.key}`);
  if (sourceIndex.has(source.key)) fail(`Duplicate source key: ${source.key}`);
  try { new URL(source.url); } catch { fail(`${context} has invalid URL: ${source.url}`); }
  sourceIndex.set(source.key, source);
}
function validateKeys(keys, context) {
  if (!keys.length) fail(`${context} has no source keys`);
  for (const key of keys) if (!sourceIndex.has(key)) fail(`${context} references missing source key ${key}`);
}

const rome = csv('public/data/roman-military-capacity.csv');
for (const [index, row] of rome.entries()) {
  const context = `roman-military-capacity.csv row ${index + 2}`;
  requireFields(row, ['year', 'display_year', 'army_mid_thousands', 'iron_mid_kg_per_soldier', 'combat_iron_mid_tonnes', 'estimate_type', 'source_keys', 'notes'], context);
  numeric(row, ['year', 'army_mid_thousands', 'army_low_thousands', 'army_high_thousands', 'iron_mid_kg_per_soldier', 'iron_low_kg_per_soldier', 'iron_high_kg_per_soldier', 'combat_iron_mid_tonnes'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  const expected = Number(row.army_mid_thousands) * Number(row.iron_mid_kg_per_soldier);
  if (Math.abs(expected - Number(row.combat_iron_mid_tonnes)) > 0.11) fail(`${context} has inconsistent manpower × iron total`);
  if (!(Number(row.army_low_thousands) <= Number(row.army_mid_thousands) && Number(row.army_mid_thousands) <= Number(row.army_high_thousands))) fail(`${context} army estimate is not low ≤ mid ≤ high`);
  if (!(Number(row.iron_low_kg_per_soldier) <= Number(row.iron_mid_kg_per_soldier) && Number(row.iron_mid_kg_per_soldier) <= Number(row.iron_high_kg_per_soldier))) fail(`${context} equipment estimate is not low ≤ mid ≤ high`);
}

const rivals = csv('public/data/comparison-forces.csv');
const modeledByPolity = new Map();
for (const [index, row] of rivals.entries()) {
  const context = `comparison-forces.csv row ${index + 2}`;
  requireFields(row, ['polity', 'year', 'display_year', 'soldiers_thousands', 'iron_kg_per_soldier', 'combat_iron_tonnes', 'observation', 'event', 'source_keys', 'notes'], context);
  numeric(row, ['year', 'soldiers_thousands', 'iron_kg_per_soldier', 'combat_iron_tonnes'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  const expected = Number(row.soldiers_thousands) * Number(row.iron_kg_per_soldier);
  if (Math.abs(expected - Number(row.combat_iron_tonnes)) > 0.11) fail(`${context} has inconsistent manpower × iron total`);
  if (!['modeled series', 'campaign anchor'].includes(row.observation)) fail(`${context} has unsupported observation type ${row.observation}`);
  if (row.observation === 'modeled series') modeledByPolity.set(row.polity, (modeledByPolity.get(row.polity) ?? 0) + 1);
}
for (const [polity, count] of modeledByPolity) if (count < 2) fail(`${polity} needs at least two modeled points to draw a series`);

const datasets = json('public/data/dataset-registry.json') ?? [];
const datasetIndex = new Map();
for (const dataset of datasets) {
  requireFields(dataset, ['id', 'title', 'schema', 'evidence_type', 'time_resolution', 'notes'], `dataset ${dataset.id ?? '(unknown)'}`);
  if (datasetIndex.has(dataset.id)) fail(`Duplicate dataset id: ${dataset.id}`);
  datasetIndex.set(dataset.id, dataset);
  const paths = dataset.paths ?? [dataset.path];
  for (const publicPath of paths) {
    if (!publicPath || !existsSync(path.join(root, 'public', publicPath.replace(/^\/+/, '')))) fail(`Dataset ${dataset.id} references missing path ${publicPath}`);
  }
  if (dataset.source_keys) validateKeys(dataset.source_keys, `dataset ${dataset.id}`);
  if (dataset.source_key_field && !['source_keys'].includes(dataset.source_key_field)) fail(`Dataset ${dataset.id} uses unsupported source-key field ${dataset.source_key_field}`);
}

const claims = json('public/data/claim-registry.json') ?? [];
const claimIds = new Set();
for (const claim of claims) {
  const context = `claim ${claim.id ?? '(unknown)'}`;
  requireFields(claim, ['id', 'page', 'insight', 'claim', 'status', 'evidence_type', 'note'], context);
  if (claimIds.has(claim.id)) fail(`Duplicate claim id: ${claim.id}`); claimIds.add(claim.id);
  if (!['working_synthesis', 'modeled_argument', 'source_observation', 'reviewed'].includes(claim.status)) fail(`${context} has unsupported status ${claim.status}`);
  if (!Array.isArray(claim.dataset_ids) || !claim.dataset_ids.length) fail(`${context} has no datasets`);
  else for (const id of claim.dataset_ids) if (!datasetIndex.has(id)) fail(`${context} references missing dataset ${id}`);
  validateKeys(claim.source_keys ?? [], context);
}

const geo = json('public/data/ancient-polities.geojson');
if (geo) {
  if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) fail('ancient-polities.geojson is not a FeatureCollection');
  else for (const [index, feature] of geo.features.entries()) {
    const context = `ancient-polities.geojson feature ${index + 1}`;
    requireFields(feature.properties ?? {}, ['Name', 'FromYear', 'ToYear', 'Area'], context);
    numeric(feature.properties ?? {}, ['FromYear', 'ToYear', 'Area'], context);
    if (Number(feature.properties.FromYear) > Number(feature.properties.ToYear)) fail(`${context} starts after it ends`);
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) fail(`${context} has unsupported geometry ${feature.geometry?.type}`);
  }
}
for (const file of ['public/data/land.topojson', 'public/data/rivers.topojson', 'public/data/borders.topojson']) json(file);

for (const schema of ['observation', 'modeled-series', 'boundary', 'citation', 'note']) {
  const document = json(`public/data/schemas/${schema}.schema.json`);
  if (document && document.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail(`${schema} schema must use JSON Schema 2020-12`);
}
for (const license of ['public/data/cliopatria-LICENSE.md', 'public/data/roman-map-LICENSE.txt']) read(license);

if (errors.length) {
  console.error(`Historical data validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Historical data validation passed: ${checked.length} files, ${sources.length} sources, ${datasets.length} datasets, ${claims.length} claims, ${rome.length + rivals.length} modeled rows, ${geo.features.length} boundary features.`);
