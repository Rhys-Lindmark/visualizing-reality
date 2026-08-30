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
const romanObservations = new Set();
for (const [index, row] of rome.entries()) {
  const context = `roman-military-capacity.csv row ${index + 2}`;
  requireFields(row, ['polity', 'series_id', 'year', 'display_year', 'soldiers_thousands', 'estimate_type', 'scope', 'source_keys', 'notes'], context);
  numeric(row, ['year', 'soldiers_thousands'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  const observationKey = `${row.polity}|${row.series_id}|${row.year}`;
  if (romanObservations.has(observationKey)) fail(`${context} duplicates ${observationKey}`); romanObservations.add(observationKey);
  if (!['ancient_reported_deployment', 'explicit_unit_model', 'published_modern_estimate', 'published_document_model'].includes(row.estimate_type)) fail(`${context} has unsupported estimate type ${row.estimate_type}`);
  if (Number(row.year) >= 395 && ['Roman Republic', 'Roman Empire', 'Late Roman Empire'].includes(row.polity)) fail(`${context} recombines eastern and western forces after 395`);
}

const rivals = csv('public/data/comparison-forces.csv');
const rivalObservations = new Set();
for (const [index, row] of rivals.entries()) {
  const context = `comparison-forces.csv row ${index + 2}`;
  requireFields(row, ['polity', 'year', 'display_year', 'soldiers_thousands', 'evidence_grade', 'event', 'source_keys', 'notes'], context);
  numeric(row, ['year', 'soldiers_thousands'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  const observationKey = `${row.polity}|${row.year}|${row.event}`;
  if (rivalObservations.has(observationKey)) fail(`${context} duplicates ${observationKey}`); rivalObservations.add(observationKey);
  if (!['modern_minimum', 'ancient_report_with_modern_synthesis', 'ancient_report', 'ancient_report_disputed'].includes(row.evidence_grade)) fail(`${context} has unsupported evidence grade ${row.evidence_grade}`);
}

const equipment = csv('public/data/equipment-comparison.csv');
for (const [index, row] of equipment.entries()) {
  const context = `equipment-comparison.csv row ${index + 2}`;
  requireFields(row, ['profile', 'from_year', 'to_year', 'worked_metal_index', 'index_basis', 'source_keys', 'notes'], context);
  numeric(row, ['from_year', 'to_year', 'worked_metal_index'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (row.index_basis !== 'nearest_comparator_equals_100') fail(`${context} has unsupported index basis ${row.index_basis}`);
  if (Number(row.from_year) > Number(row.to_year)) fail(`${context} starts after it ends`);
}
const romanEquipment = equipment.find(row => row.profile === 'Roman heavy infantry');
const benchmarkEquipment = equipment.find(row => row.profile === 'Nearest comparator benchmark');
if (!romanEquipment || !benchmarkEquipment || Number(romanEquipment.worked_metal_index) / Number(benchmarkEquipment.worked_metal_index) !== 1.25) fail('Equipment comparison must preserve the cited 25% Roman-to-nearest-comparator relationship');

const fiscalBudget = csv('public/data/roman-imperial-budget.csv');
const budgetGroups = new Map();
for (const [index, row] of fiscalBudget.entries()) {
  const context = `roman-imperial-budget.csv row ${index + 2}`;
  requireFields(row, ['year', 'display_year', 'scenario', 'total_million_sestertii', 'category', 'amount_million_sestertii', 'source_keys', 'notes'], context);
  numeric(row, ['year', 'total_million_sestertii', 'amount_million_sestertii'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (![150, 215].includes(Number(row.year))) fail(`${context} has unsupported budget year ${row.year}`);
  if (!['low', 'high'].includes(row.scenario)) fail(`${context} has unsupported scenario ${row.scenario}`);
  const groupKey = `${row.year}|${row.scenario}`;
  const group = budgetGroups.get(groupKey) ?? { total:Number(row.total_million_sestertii), sum:0, categories:new Set(), army:0 };
  if (group.total !== Number(row.total_million_sestertii)) fail(`${context} changes the total inside ${groupKey}`);
  if (group.categories.has(row.category)) fail(`${context} duplicates ${row.category} in ${groupKey}`);
  group.categories.add(row.category); group.sum += Number(row.amount_million_sestertii);
  if (row.category === 'Army') group.army = Number(row.amount_million_sestertii);
  budgetGroups.set(groupKey, group);
}
for (const [groupKey, group] of budgetGroups) {
  if (group.sum !== group.total) fail(`Budget ${groupKey} categories sum to ${group.sum}, expected ${group.total}`);
  if (group.categories.size !== 5) fail(`Budget ${groupKey} has ${group.categories.size} categories, expected 5`);
  const armyShare = group.army / group.total;
  if (armyShare < 0.7 || armyShare > 0.8) fail(`Budget ${groupKey} army share ${armyShare} is outside the published reconstruction`);
}
if (budgetGroups.size !== 4) fail(`Expected four Roman budget scenarios, found ${budgetGroups.size}`);

const fiscalObservations = csv('public/data/roman-fiscal-observations.csv');
const fiscalKeys = new Set();
for (const [index, row] of fiscalObservations.entries()) {
  const context = `roman-fiscal-observations.csv row ${index + 2}`;
  requireFields(row, ['year', 'display_year', 'series', 'measure', 'value', 'unit', 'scope', 'destination', 'evidence_type', 'source_keys', 'notes'], context);
  numeric(row, ['year', 'value'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  const observationKey = `${row.year}|${row.measure}`;
  if (fiscalKeys.has(observationKey)) fail(`${context} duplicates ${observationKey}`); fiscalKeys.add(observationKey);
}
for (const measure of ['monthly_grain_allotment', 'subsidized_grain_price', 'sicilian_grain_tithe', 'founding_endowment', 'inheritance_tax', 'auction_tax', 'quadragesima_galliarum', 'annual_base_pay']) if (!fiscalObservations.some(row => row.measure === measure)) fail(`Roman fiscal observations are missing ${measure}`);
const payYears = fiscalObservations.filter(row => row.series === 'legionary_pay').map(row => Number(row.year));
if (payYears.some(year => year > 197)) fail('Legionary pay series extends beyond the defensible 197 CE cutoff');

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
  else {
    const featureKeys = new Set();
    for (const [index, feature] of geo.features.entries()) {
      const context = `ancient-polities.geojson feature ${index + 1}`;
      requireFields(feature.properties ?? {}, ['Name', 'FromYear', 'ToYear', 'Area', 'Type', 'Wikipedia', 'Wikidata'], context);
      numeric(feature.properties ?? {}, ['FromYear', 'ToYear', 'Area'], context);
      if (Number(feature.properties.FromYear) > Number(feature.properties.ToYear)) fail(`${context} starts after it ends`);
      if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) fail(`${context} has unsupported geometry ${feature.geometry?.type}`);
      const key = `${feature.properties.Name}|${feature.properties.FromYear}|${feature.properties.ToYear}|${feature.properties.SeshatID ?? ''}`;
      if (featureKeys.has(key)) fail(`${context} duplicates feature key ${key}`); featureKeys.add(key);
    }
    const romanPolities = new Set(['Roman Republic', 'Roman Empire', 'Eastern Roman Empire', 'Western Roman Empire', 'Gallic Empire']);
    for (let year = -500; year <= 476; year += 1) {
      if (!geo.features.some(feature => romanPolities.has(feature.properties.Name) && Number(feature.properties.FromYear) <= year && Number(feature.properties.ToYear) >= year)) fail(`Roman map has no Roman polity covering year ${year}`);
    }
    const expectedAtYear = new Map([[395, ['Eastern Roman Empire', 'Western Roman Empire']], [410, ['Eastern Roman Empire', 'Western Roman Empire']], [439, ['Eastern Roman Empire', 'Western Roman Empire']], [476, ['Eastern Roman Empire']]]);
    for (const [year, expectedNames] of expectedAtYear) {
      const names = geo.features.filter(feature => Number(feature.properties.FromYear) <= year && Number(feature.properties.ToYear) >= year && romanPolities.has(feature.properties.Name)).map(feature => feature.properties.Name);
      for (const name of expectedNames) if (!names.includes(name)) fail(`Roman map at ${year} is missing ${name}`);
      if (year === 476 && names.includes('Western Roman Empire')) fail('Roman map at 476 still includes the Western Roman Empire');
    }
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
console.log(`Historical data validation passed: ${checked.length} files, ${sources.length} sources, ${datasets.length} datasets, ${claims.length} claims, ${rome.length} Roman force estimates, ${rivals.length} rival campaign observations, ${equipment.length} equipment-index rows, ${fiscalBudget.length} fiscal-budget rows, ${fiscalObservations.length} fiscal observations, ${geo.features.length} boundary features.`);
