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

const collapseEvents = csv('public/data/western-roman-collapse-events.csv');
const collapseYears = new Set();
const allowedEventTypes = new Set(['political division', 'external pressure', 'civil war', 'capital shock', 'fiscal workaround', 'territorial loss', 'territorial settlement', 'fiscal evidence', 'failed recovery', 'political ending']);
for (const [index, row] of collapseEvents.entries()) {
  const context = `western-roman-collapse-events.csv row ${index + 2}`;
  requireFields(row, ['year', 'display_year', 'event_type', 'event', 'what_changed', 'mechanism', 'source_keys', 'notes'], context);
  numeric(row, ['year'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (Number(row.year) < 395 || Number(row.year) > 476) fail(`${context} falls outside the western-court chronology`);
  if (collapseYears.has(Number(row.year))) fail(`${context} duplicates year ${row.year}`); collapseYears.add(Number(row.year));
  if (!allowedEventTypes.has(row.event_type)) fail(`${context} has unsupported event type ${row.event_type}`);
}
for (const year of [395, 439, 445, 476]) if (!collapseYears.has(year)) fail(`Western collapse chronology is missing anchor year ${year}`);
if (collapseEvents.length !== 12) fail(`Expected twelve selective western-collapse events, found ${collapseEvents.length}`);
const lawEvent = collapseEvents.find(row => Number(row.year) === 445);
if (!lawEvent || !sourceKeys(lawEvent.source_keys).includes('NOV_VAL_13')) fail('The 445 one-eighth assessment must cite Novel XIII');

const africaEquivalents = csv('public/data/africa-fiscal-equivalents.csv');
for (const [index, row] of africaEquivalents.entries()) {
  const context = `africa-fiscal-equivalents.csv row ${index + 2}`;
  requireFields(row, ['region_group', 'loss_status', 'infantry_equivalent', 'cavalry_equivalent', 'cavalry_relation', 'infantry_cost_solidi', 'cavalry_cost_solidi', 'evidence_type', 'source_keys', 'notes'], context);
  numeric(row, ['infantry_equivalent', 'cavalry_equivalent', 'infantry_cost_solidi', 'cavalry_cost_solidi'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (row.evidence_type !== 'published_model') fail(`${context} is not labeled as a published model`);
  if (!['approximate', 'lower_bound'].includes(row.cavalry_relation)) fail(`${context} has unsupported cavalry relation ${row.cavalry_relation}`);
  if (!row.notes.toLowerCase().includes('not an observed reduction')) fail(`${context} does not block a headcount interpretation`);
}
if (africaEquivalents.length !== 2) fail(`Expected two African fiscal-equivalent components, found ${africaEquivalents.length}`);
const infantryEquivalentTotal = africaEquivalents.reduce((sum, row) => sum + Number(row.infantry_equivalent), 0);
const cavalryEquivalentFloor = africaEquivalents.reduce((sum, row) => sum + Number(row.cavalry_equivalent), 0);
if (infantryEquivalentTotal !== 58000) fail(`African infantry-equivalent total is ${infantryEquivalentTotal}, expected 58000`);
if (cavalryEquivalentFloor !== 30000 || !africaEquivalents.some(row => row.cavalry_relation === 'lower_bound')) fail(`African cavalry-equivalent floor must be more than 30000`);
if (africaEquivalents.some(row => Number(row.infantry_cost_solidi) !== 6 || Number(row.cavalry_cost_solidi) !== 10.5)) fail('African model must preserve Elton maintenance costs of 6 and 10.5 solidi');

const afterlives = csv('public/data/roman-afterlives.csv');
const afterlifeSystems = new Set(['Roads', 'Language', 'Law', 'State']);
for (const [index, row] of afterlives.entries()) {
  const context = `roman-afterlives.csv row ${index + 2}`;
  requireFields(row, ['system', 'year', 'display_year', 'kind', 'milestone', 'evidence_type', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['year'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!afterlifeSystems.has(row.system)) fail(`${context} has unsupported system ${row.system}`);
  if (!['event', 'metric'].includes(row.kind)) fail(`${context} has unsupported kind ${row.kind}`);
  if (row.kind === 'metric') { requireFields(row, ['value', 'unit'], context); numeric(row, ['value'], context); }
}
for (const system of afterlifeSystems) if (!afterlives.some(row => row.system === system && row.kind === 'event')) fail(`Roman afterlives are missing ${system} events`);
for (const [system, year] of [['Roads', -312], ['Language', 813], ['Language', 842], ['Law', 529], ['Law', 1070], ['State', 476], ['State', 1204], ['State', 1261], ['State', 1453]]) if (!afterlives.some(row => row.system === system && Number(row.year) === year)) fail(`Roman afterlives are missing ${system} milestone ${year}`);
const roadLength = afterlives.find(row => row.milestone === 'Mapped road network');
const roadCertainty = afterlives.find(row => row.milestone === 'Location known with certainty');
if (!roadLength || Number(roadLength.value) !== 299171.31) fail('Roman afterlives must preserve the Itiner-e mapped length of 299171.31 km');
if (!roadCertainty || Number(roadCertainty.value) !== 2.737) fail('Roman afterlives must preserve the Itiner-e certain-location share of 2.737%');

const urukWriting = csv('public/data/uruk-writing-corpus.csv');
for (const [index, row] of urukWriting.entries()) {
  const context = `uruk-writing-corpus.csv row ${index + 2}`;
  requireFields(row, ['record_type', 'phase', 'phase_order', 'metric', 'value', 'relation', 'unit', 'label', 'source_keys', 'notes'], context);
  numeric(row, ['phase_order', 'value'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!['genre_share', 'corpus_snapshot'].includes(row.record_type)) fail(`${context} has unsupported record type ${row.record_type}`);
  if (!['exact', 'approximate', 'less_than'].includes(row.relation)) fail(`${context} has unsupported relation ${row.relation}`);
}
if (urukWriting.length !== 7) fail(`Expected seven Uruk writing summary rows, found ${urukWriting.length}`);
const urukIV = urukWriting.find(row => row.phase === 'Uruk IV' && row.metric === 'lexical_share');
const urukIII = urukWriting.find(row => row.phase === 'Uruk III' && row.metric === 'lexical_share');
if (!urukIV || Number(urukIV.value) !== 1 || urukIV.relation !== 'less_than') fail('Uruk IV lexical share must remain a less-than 1% bound');
if (!urukIII || Number(urukIII.value) !== 20 || urukIII.relation !== 'approximate') fail('Uruk III lexical share must remain approximately 20%');
for (const [metric, value] of [['artifacts', 6726], ['transliterated_artifacts', 6267], ['readable_artifacts', 5274], ['readable_non_numerical_tokens', 52943]]) {
  if (!urukWriting.some(row => row.metric === metric && Number(row.value) === value)) fail(`Uruk writing corpus is missing ${metric} = ${value}`);
}

const urukClientRevision = '20260830-client1';
for (const filename of ['uruk-writing-corpus.csv', 'uruk-urbanization-clocks.csv', 'uruk-water-ecology.csv', 'uruk-grain-state-evidence.csv', 'uruk-state-fragility-evidence.csv']) {
  const snapshot = read(`public/data/uruk/${urukClientRevision}/${filename}`);
  const canonical = readFileSync(path.join(root, 'public/data', filename), 'utf8');
  if (snapshot !== canonical) fail(`Uruk immutable client snapshot diverges from canonical dataset: ${filename}`);
}

const urukUrbanization = csv('public/data/uruk-urbanization-clocks.csv');
const urukUrbanKeys = new Set();
for (const [index, row] of urukUrbanization.entries()) {
  const context = `uruk-urbanization-clocks.csv row ${index + 2}`;
  requireFields(row, ['kind', 'system', 'start_year', 'end_year', 'display_date', 'place', 'measure', 'relation', 'unit', 'label', 'evidence_type', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['start_year', 'end_year'], context);
  if (row.value !== '') numeric(row, ['value'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!['timeline', 'footprint', 'context'].includes(row.kind)) fail(`${context} has unsupported kind ${row.kind}`);
  if (!['Urban scale', 'Public institutions', 'Record-keeping', 'Political inference'].includes(row.system)) fail(`${context} has unsupported system ${row.system}`);
  if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  if (row.kind === 'timeline' && row.value !== '') fail(`${context} mixes a timeline interval with a footprint value`);
  if (row.kind !== 'timeline' && (row.measure !== 'settlement_footprint' || row.unit !== 'hectares' || !Number.isFinite(Number(row.value)))) fail(`${context} is not a valid settlement-footprint observation`);
  if (/population/i.test(`${row.measure} ${row.unit}`)) fail(`${context} presents settlement footprint as population`);
  const key = `${row.kind}|${row.system}|${row.place}|${row.start_year}|${row.end_year}|${row.measure}`;
  if (urukUrbanKeys.has(key)) fail(`${context} duplicates ${key}`); urukUrbanKeys.add(key);
}
if (urukUrbanization.length !== 10) fail(`Expected ten Uruk urbanization rows, found ${urukUrbanization.length}`);
for (const [year, value] of [[-3100, 250], [-2900, 400]]) if (!urukUrbanization.some(row => row.kind === 'footprint' && row.place === 'Uruk' && Number(row.start_year) === year && Number(row.value) === value && row.unit === 'hectares')) fail(`Uruk urbanization data is missing the ${Math.abs(year)} BCE footprint of ${value} hectares`);
if (!urukUrbanization.some(row => row.kind === 'timeline' && row.place === 'Shakhi Kora' && Number(row.start_year) === -3941 && Number(row.end_year) === -3377)) fail('Uruk urbanization data is missing the 3941–3377 cal BCE Shakhi Kora institutional sequence');
if (!urukUrbanization.some(row => row.kind === 'timeline' && row.system === 'Political inference' && row.place === 'Uruk' && Number(row.start_year) === -3800 && Number(row.end_year) === -3300)) fail('Uruk urbanization data is missing the bounded 3800–3300 BCE political interpretation');

const urukWater = csv('public/data/uruk-water-ecology.csv');
const urukWaterKeys = new Set();
for (const [index, row] of urukWater.entries()) {
  const context = `uruk-water-ecology.csv row ${index + 2}`;
  requireFields(row, ['kind', 'system', 'display_date', 'place', 'measure', 'relation', 'unit', 'label', 'evidence_type', 'source_keys', 'interpretation', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!['timeline', 'context', 'map_boundary', 'network_summary'].includes(row.kind)) fail(`${context} has unsupported kind ${row.kind}`);
  if (row.kind === 'map_boundary') {
    if (row.start_year || row.end_year || row.value) fail(`${context} assigns a date or quantity to the mixed-age map layer`);
  } else {
    numeric(row, ['start_year', 'end_year'], context);
    if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  }
  if (row.kind === 'network_summary') {
    numeric(row, ['value'], context);
    if (row.relation !== 'more_than' || row.unit !== 'count') fail(`${context} must preserve the published more-than count`);
  } else if (row.value !== '') fail(`${context} introduces a quantity outside the preserved-network summary`);
  const key = `${row.kind}|${row.system}|${row.place}|${row.measure}`;
  if (urukWaterKeys.has(key)) fail(`${context} duplicates ${key}`); urukWaterKeys.add(key);
}
if (urukWater.length !== 11) fail(`Expected eleven Uruk water-ecology rows, found ${urukWater.length}`);
if (!urukWater.some(row => row.measure === 'freshwater_environment' && Number(row.start_year) === -7750 && Number(row.end_year) === -4900 && row.source_keys === 'ALTAWEEL_ET_AL2019')) fail('Uruk water ecology is missing the bounded M38 freshwater sequence');
if (!urukWater.some(row => row.kind === 'map_boundary' && row.measure === 'palaeochannel_palimpsest' && row.start_year === '' && row.end_year === '' && row.source_keys === 'JOTHERI_ET_AL2025')) fail('Uruk water ecology must keep the palaeochannel map explicitly undated');
for (const [measure, value] of [['primary_canals', 200], ['branch_canals', 4000], ['farms', 700]]) if (!urukWater.some(row => row.measure === measure && Number(row.value) === value && row.relation === 'more_than' && row.start_year === '-6000' && row.end_year === '-1000')) fail(`Uruk water ecology is missing the non-simultaneous Eridu ${measure} lower bound`);
if (!urukWater.some(row => row.measure === 'canal_archaeological_context' && Number(row.start_year) === -2900 && Number(row.end_year) === -2600 && row.source_keys === 'EGBERTS_ET_AL2023')) fail('Uruk water ecology is missing the Girsu canal stratigraphic interval');
if (!urukWater.some(row => row.measure === 'developed_irrigation_terminology' && Number(row.start_year) === -2475 && Number(row.end_year) === -2315 && row.source_keys === 'EGBERTS_ET_AL2023')) fail('Uruk water ecology is missing the bounded Lagash textual interval');
for (const asset of ['public/images/mesopotamia-palaeochannels.webp', 'public/images/eridu-irrigation-network.webp']) if (!existsSync(path.join(root, asset))) fail(`Missing Uruk water-map asset: ${asset}`);
read('public/images/uruk-water-map-LICENSE.md');

const urukGrain = csv('public/data/uruk-grain-state-evidence.csv');
const urukGrainSlugs = new Set();
const grainResourceClasses = new Set(['model_and_direct_archive', 'model_counterfactual', 'mixed_direct_and_later_comparison', 'mixed_landscape_and_archive', 'direct_late_uruk_archive']);
const grainTestClasses = new Set(['published_model', 'published_critique', 'direct_archive', 'regional_synthesis', 'methodological_counterexample']);
for (const [index, row] of urukGrain.entries()) {
  const context = `uruk-grain-state-evidence.csv row ${index + 2}`;
  requireFields(row, ['row_type', 'slug', 'label', 'role', 'model_claim', 'uruk_evidence', 'chronology', 'evidence_class', 'source_keys', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!['resource', 'test'].includes(row.row_type)) fail(`${context} has unsupported row type ${row.row_type}`);
  if (urukGrainSlugs.has(row.slug)) fail(`${context} duplicates slug ${row.slug}`); urukGrainSlugs.add(row.slug);
  if (row.row_type === 'resource' && !grainResourceClasses.has(row.evidence_class)) fail(`${context} has unsupported resource evidence class ${row.evidence_class}`);
  if (row.row_type === 'test' && !grainTestClasses.has(row.evidence_class)) fail(`${context} has unsupported test evidence class ${row.evidence_class}`);
  if (Object.keys(row).some(key => /score|rank|weight|index/i.test(key))) fail(`${context} introduces an unsupported aggregate score field`);
  const claimText = `${row.model_claim} ${row.uruk_evidence}`;
  if (/grain alone caused (uruk'?s )?(state|hierarchy)/i.test(claimText) && !/(not|does not|cannot|no evidence)/i.test(claimText)) fail(`${context} presents grain causation as established`);
}
if (urukGrain.length !== 10) fail(`Expected ten Uruk grain-state evidence rows, found ${urukGrain.length}`);
if (urukGrain.filter(row => row.row_type === 'resource').length !== 5 || urukGrain.filter(row => row.row_type === 'test').length !== 5) fail('Uruk grain-state evidence must retain five resource rows and five claim-test rows');
for (const slug of ['cereal-grain', 'roots-and-tubers', 'herd-animals', 'fish-and-wetlands', 'fruit-orchards', 'original-study', 'published-comment', 'uruk-archive', 'deltaic-economy', 'archive-bias']) if (!urukGrainSlugs.has(slug)) fail(`Uruk grain-state evidence is missing ${slug}`);
const originalGrainStudy = urukGrain.find(row => row.slug === 'original-study');
if (!originalGrainStudy || !sourceKeys(originalGrainStudy.source_keys).includes('MAYSHAR_MOAV_PASCALI2022') || originalGrainStudy.evidence_class !== 'published_model') fail('Uruk grain-state evidence is missing the 2022 published model');
const grainComment = urukGrain.find(row => row.slug === 'published-comment');
if (!grainComment || !sourceKeys(grainComment.source_keys).includes('COOK_ET_AL2026') || grainComment.evidence_class !== 'published_critique' || !grainComment.chronology.includes('2026')) fail('Uruk grain-state evidence is missing the 2026 published challenge');
const rootCounterfactual = urukGrain.find(row => row.slug === 'roots-and-tubers');
if (!rootCounterfactual || !/not a recovered Uruk staple comparison/i.test(rootCounterfactual.uruk_evidence)) fail('Roots and tubers must remain a model counterfactual rather than invented Uruk evidence');
const archiveTest = urukGrain.find(row => row.slug === 'uruk-archive');
if (!archiveTest || !/archive is selected by institutions/i.test(archiveTest.limits) || !/diet survey/i.test(archiveTest.limits)) fail('Uruk archive evidence must preserve the institutional-selection and diet-survey limits');
const laterBias = urukGrain.find(row => row.slug === 'archive-bias');
if (!laterBias || !/later Ur III/i.test(laterBias.chronology) || !/not a direct reconstruction of Uruk/i.test(laterBias.limits)) fail('The archive-bias comparison must remain explicitly later than Uruk');

const urukFragility = csv('public/data/uruk-state-fragility-evidence.csv');
const urukFragilitySlugs = new Set();
const fragilityClasses = new Set(['regional_settlement_synthesis', 'artifact_function_debate', 'excavated_architecture', 'excavation_field_report', 'excavated_human_remains', 'radiocarbon_bounded_excavation', 'excavated_colonial_encounter', 'regional_archaeological_synthesis']);
for (const [index, row] of urukFragility.entries()) {
  const context = `uruk-state-fragility-evidence.csv row ${index + 2}`;
  requireFields(row, ['slug', 'mechanism', 'place', 'start_year', 'end_year', 'display_date', 'observation', 'what_it_supports', 'what_it_does_not_prove', 'evidence_class', 'source_keys'], context);
  numeric(row, ['start_year', 'end_year'], context);
  if (row.value !== '') numeric(row, ['value'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (urukFragilitySlugs.has(row.slug)) fail(`${context} duplicates slug ${row.slug}`); urukFragilitySlugs.add(row.slug);
  if (!fragilityClasses.has(row.evidence_class)) fail(`${context} has unsupported evidence class ${row.evidence_class}`);
  if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  if ((row.value === '') !== (row.unit === '')) fail(`${context} must keep quantity and unit together`);
  if (Object.keys(row).some(key => /score|rank|weight|index/i.test(key))) fail(`${context} introduces an unsupported aggregate score field`);
  if (/proves? (forced labor|slavery|an epidemic|state execution)/i.test(`${row.observation} ${row.what_it_supports}`)) fail(`${context} turns an archaeological observation into an unsupported coercion disease or execution claim`);
}
if (urukFragility.length !== 8) fail(`Expected eight Uruk fragility evidence rows, found ${urukFragility.length}`);
for (const slug of ['urban-concentration', 'institutional-provisioning', 'fortified-center', 'urban-conflict', 'mass-deposition', 'institutional-dispersal', 'autonomous-periphery', 'regional-reversal']) if (!urukFragilitySlugs.has(slug)) fail(`Uruk fragility evidence is missing ${slug}`);
const hamoukarWall = urukFragility.find(row => row.slug === 'fortified-center');
if (!hamoukarWall || Number(hamoukarWall.value) !== 3 || hamoukarWall.relation !== 'approximate' || !sourceKeys(hamoukarWall.source_keys).includes('REICHEL2006')) fail('Uruk fragility evidence must preserve Hamoukar\'s approximately three-metre wall');
const hamoukarConflict = urukFragility.find(row => row.slug === 'urban-conflict');
if (!hamoukarConflict || Number(hamoukarConflict.value) !== 1000 || hamoukarConflict.relation !== 'more_than' || !/do not securely identify the attacker/i.test(hamoukarConflict.what_it_does_not_prove)) fail('Hamoukar conflict evidence must preserve the lower bound and attacker uncertainty');
const brakDeposit = urukFragility.find(row => row.slug === 'mass-deposition');
if (!brakDeposit || Number(brakDeposit.value) !== 33 || brakDeposit.relation !== 'minimum' || !/does not by itself identify a state execution/i.test(brakDeposit.what_it_does_not_prove)) fail('Tell Brak evidence must preserve the 33–45 minimum and block a state-execution inference');
const shakhiDispersal = urukFragility.find(row => row.slug === 'institutional-dispersal');
if (!shakhiDispersal || Number(shakhiDispersal.value) !== 4 || !/deliberate dismantling and population dispersal/i.test(shakhiDispersal.observation) || !/not synonymous with civilizational collapse/i.test(shakhiDispersal.what_it_does_not_prove)) fail('Shakhi Kora must remain a four-phase reversible path rather than a generic collapse');
const provisioning = urukFragility.find(row => row.slug === 'institutional-provisioning');
if (!provisioning || !/does not by itself prove a grain wage forced labor slavery/i.test(provisioning.what_it_does_not_prove.replaceAll(',', ''))) fail('Provisioning evidence must not turn bevel-rim bowls into a slavery estimate');
const regionalReversal = urukFragility.find(row => row.slug === 'regional-reversal');
if (!regionalReversal || !/Ceramic absence is not a death count/i.test(regionalReversal.what_it_does_not_prove)) fail('Regional reversal must block a death-count interpretation');

const cradles = csv('public/data/cradles-evidence-clocks.csv');
const cradleRegions = new Set(['mesopotamia', 'egypt', 'indus', 'northern-china', 'mesoamerica', 'andes']);
const cradleClocks = new Set(['urban_scale', 'political_centralization', 'durable_notation']);
const cradleKeys = new Set();
for (const [index, row] of cradles.entries()) {
  const context = `cradles-evidence-clocks.csv row ${index + 2}`;
  requireFields(row, ['region', 'region_slug', 'latitude', 'longitude', 'clock', 'display_date', 'place', 'observation', 'evidence_status', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['latitude', 'longitude'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!cradleRegions.has(row.region_slug)) fail(`${context} has unsupported region ${row.region_slug}`);
  if (!cradleClocks.has(row.clock)) fail(`${context} has unsupported clock ${row.clock}`);
  if (Number(row.latitude) < -90 || Number(row.latitude) > 90 || Number(row.longitude) < -180 || Number(row.longitude) > 180) fail(`${context} has invalid coordinates`);
  const key = `${row.region_slug}|${row.clock}`;
  if (cradleKeys.has(key)) fail(`${context} duplicates ${key}`); cradleKeys.add(key);
  const isGap = row.evidence_status === 'evidence_gap';
  if (isGap) {
    if (row.start_year !== '' || row.end_year !== '') fail(`${context} assigns a numeric date to an evidence gap`);
    if (row.region_slug !== 'andes' || row.clock !== 'durable_notation') fail(`${context} introduces an unsupported undated gap`);
    if (!/not zero|year zero|not be plotted at 0/i.test(`${row.observation} ${row.interpretation} ${row.limits}`)) fail(`${context} does not block a year-zero reading`);
  } else {
    numeric(row, ['start_year', 'end_year'], context);
    if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
    if (Number(row.start_year) < -4000 || Number(row.end_year) > -100) fail(`${context} falls outside the published comparison window`);
  }
  if (/civilization (score|rank)|ranking of civilizations|most civilized/i.test(`${row.observation} ${row.interpretation} ${row.limits}`)) fail(`${context} introduces a civilizational rank`);
}
if (cradles.length !== 18) fail(`Expected eighteen cradles evidence-clock rows, found ${cradles.length}`);
for (const region of cradleRegions) for (const clock of cradleClocks) if (!cradleKeys.has(`${region}|${clock}`)) fail(`Cradles evidence clocks are missing ${region}|${clock}`);
if (cradles.filter(row => row.evidence_status === 'evidence_gap').length !== 1) fail('Cradles evidence clocks must contain exactly one explicit evidence gap');
if (!cradles.some(row => row.region_slug === 'indus' && row.clock === 'political_centralization' && row.evidence_status === 'contested_inference' && /does not invent kings/i.test(row.limits))) fail('Indus political centralization must remain contested and block invented kings');
if (!cradles.some(row => row.region_slug === 'mesoamerica' && row.clock === 'durable_notation' && row.evidence_status === 'probable_contested_attestation')) fail('San Andrés notation must remain probable and contested');
if (!cradles.some(row => row.region_slug === 'northern-china' && row.clock === 'durable_notation' && /Earlier marks/i.test(row.limits))) fail('Northern China writing must distinguish secure Shang attestation from earlier disputed marks');
if (!cradles.some(row => row.region_slug === 'andes' && row.clock === 'urban_scale' && Number(row.start_year) === -2627 && Number(row.end_year) === -1977 && row.source_keys === 'SHADY_ET_AL2001')) fail('Andes urban-scale evidence must preserve the calibrated Caral range');
if (!cradles.some(row => row.region_slug === 'andes' && row.clock === 'political_centralization' && Number(row.start_year) === -200 && Number(row.end_year) === -100 && row.source_keys === 'MILLAIRE2010')) fail('Andes political clock must preserve the probable second-century BCE Virú range');

const cradleEcologies = csv('public/data/cradles-ecology-profiles.csv');
const cradleEcologyDimensions = new Set(['water', 'rainfall', 'crops', 'transport', 'settlement']);
const cradleEcologyKeys = new Set();
for (const [index, row] of cradleEcologies.entries()) {
  const context = `cradles-ecology-profiles.csv row ${index + 2}`;
  requireFields(row, ['region', 'region_slug', 'dimension', 'dimension_label', 'headline', 'observation', 'evidence_status', 'place', 'time_window', 'source_keys', 'interpretation', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!cradleRegions.has(row.region_slug)) fail(`${context} has unsupported region ${row.region_slug}`);
  if (!cradleEcologyDimensions.has(row.dimension)) fail(`${context} has unsupported dimension ${row.dimension}`);
  const key = `${row.region_slug}|${row.dimension}`;
  if (cradleEcologyKeys.has(key)) fail(`${context} duplicates ${key}`); cradleEcologyKeys.add(key);
  if (Object.keys(row).some(field => /score|rank|weight|index|density_value|rainfall_value|productivity_value/i.test(field))) fail(`${context} introduces an unsupported common-scale field`);
  if (/proves? (centralized|state) (water|hydraulic|irrigation) control|hydraulic score|caused state formation/i.test(`${row.observation} ${row.interpretation}`)) fail(`${context} turns ecology into an unsupported hydraulic-state cause`);
  if (row.limits.length < 45) fail(`${context} does not preserve a substantive inference limit`);
}
if (cradleEcologies.length !== 30) fail(`Expected thirty cradles ecology rows, found ${cradleEcologies.length}`);
for (const region of cradleRegions) for (const dimension of cradleEcologyDimensions) if (!cradleEcologyKeys.has(`${region}|${dimension}`)) fail(`Cradles ecology profiles are missing ${region}|${dimension}`);
if (cradleEcologies.filter(row => row.dimension === 'settlement').length !== 6) fail('Cradles ecology profiles must preserve six qualitative settlement-form rows');
const mesopotamiaWater = cradleEcologies.find(row => row.region_slug === 'mesopotamia' && row.dimension === 'water');
if (!mesopotamiaWater || !sourceKeys(mesopotamiaWater.source_keys).includes('JOTHERI_ET_AL2025') || !/multi-period|not a fourth-millennium map/i.test(mesopotamiaWater.limits)) fail('Mesopotamian water evidence must keep the preserved canal palimpsest out of a single Uruk map');
const indusRainfall = cradleEcologies.find(row => row.region_slug === 'indus' && row.dimension === 'rainfall');
if (!indusRainfall || !sourceKeys(indusRainfall.source_keys).includes('PETRIE_ET_AL2017') || !sourceKeys(indusRainfall.source_keys).includes('MADELLA_FULLER2006') || !/no single climatic event/i.test(indusRainfall.limits)) fail('Indus rainfall evidence must preserve the overlapping systems and block a climate monocause');
const mesoWater = cradleEcologies.find(row => row.region_slug === 'mesoamerica' && row.dimension === 'water');
if (!mesoWater || !/distributed and small-scale/i.test(mesoWater.interpretation) || !/does not prove centralized construction/i.test(mesoWater.limits)) fail('Monte Albán water evidence must remain household-scale rather than hydraulic command');
const andesCrops = cradleEcologies.find(row => row.region_slug === 'andes' && row.dimension === 'crops');
if (!andesCrops || !sourceKeys(andesCrops.source_keys).includes('HAAS_ET_AL2013') || !sourceKeys(andesCrops.source_keys).includes('SANDWEISS_ET_AL2009') || !/importance of maize has been debated/i.test(andesCrops.limits)) fail('Andean crops must preserve the maize evidence and sampling debate');
const cradleEcologySnapshot = read('public/data/cradles/20260830-ecology1/cradles-ecology-profiles.csv');
if (cradleEcologySnapshot !== readFileSync(path.join(root, 'public/data/cradles-ecology-profiles.csv'), 'utf8')) fail('Cradles ecology immutable client snapshot diverges from the canonical dataset');

const cradleSequences = csv('public/data/cradles-sequence-clocks.csv');
const cradleMilestones = new Set(['urban_scale', 'political_centralization', 'durable_notation', 'monumental_building', 'bronze']);
const cradleSequenceKeys = new Set();
for (const [index, row] of cradleSequences.entries()) {
  const context = `cradles-sequence-clocks.csv row ${index + 2}`;
  requireFields(row, ['region', 'region_slug', 'milestone', 'display_date', 'place', 'observation', 'evidence_status', 'source_keys', 'interpretation', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!cradleRegions.has(row.region_slug)) fail(`${context} has unsupported region ${row.region_slug}`);
  if (!cradleMilestones.has(row.milestone)) fail(`${context} has unsupported milestone ${row.milestone}`);
  const key = `${row.region_slug}|${row.milestone}`;
  if (cradleSequenceKeys.has(key)) fail(`${context} duplicates ${key}`); cradleSequenceKeys.add(key);
  if (row.evidence_status === 'evidence_gap') {
    if (row.start_year || row.end_year) fail(`${context} plots an evidence gap at a numeric date`);
  } else {
    numeric(row, ['start_year', 'end_year'], context);
    if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
    if (Number(row.start_year) < -4000 || Number(row.end_year) > 1521) fail(`${context} falls outside the declared comparison window`);
  }
  if (row.limits.length < 55) fail(`${context} does not preserve a substantive inference limit`);
}
if (cradleSequences.length !== 30) fail(`Expected thirty cradles sequence rows, found ${cradleSequences.length}`);
for (const region of cradleRegions) for (const milestone of cradleMilestones) if (!cradleSequenceKeys.has(`${region}|${milestone}`)) fail(`Cradles sequence clocks are missing ${region}|${milestone}`);
if (cradleSequences.filter(row => row.evidence_status === 'evidence_gap').length !== 1) fail('Cradles sequence clocks must contain exactly one explicit evidence gap');
if (!cradleSequences.some(row => row.region_slug === 'andes' && row.milestone === 'durable_notation' && row.evidence_status === 'evidence_gap' && !row.start_year && !row.end_year)) fail('The Andean notation sequence must remain an undated evidence gap');
for (const base of cradles) {
  const reused = cradleSequences.find(row => row.region_slug === base.region_slug && row.milestone === base.clock);
  for (const field of ['start_year', 'end_year', 'display_date', 'observation', 'evidence_status', 'source_keys', 'interpretation', 'limits']) if (!reused || reused[field] !== base[field]) fail(`Cradles sequence clocks alter audited ${base.region_slug}|${base.clock} field ${field}`);
}
for (const region of cradleRegions) {
  const dated = cradleSequences.filter(row => row.region_slug === region && row.start_year);
  const bronze = dated.find(row => row.milestone === 'bronze');
  const earliestNonBronze = Math.min(...dated.filter(row => row.milestone !== 'bronze').map(row => Number(row.start_year)));
  if (!bronze || Number(bronze.start_year) < earliestNonBronze) fail(`${region} incorrectly makes bronze precede every non-bronze clock`);
}
const egyptBronze = cradleSequences.find(row => row.region_slug === 'egypt' && row.milestone === 'bronze');
if (!egyptBronze || egyptBronze.evidence_status !== 'rare_attestation' || !/common only from the New Kingdom/i.test(egyptBronze.limits)) fail('Egyptian bronze must remain a rare Second Dynasty attestation rather than common adoption');
const mesoBronze = cradleSequences.find(row => row.region_slug === 'mesoamerica' && row.milestone === 'bronze');
if (!mesoBronze || Number(mesoBronze.start_year) !== 1200 || !sourceKeys(mesoBronze.source_keys).includes('HOSLER1988') || !/not a date for all Mesoamerica/i.test(mesoBronze.limits)) fail('Mesoamerican bronze must preserve Hosler\'s late West Mexican phase and regional limit');
const andesBronze = cradleSequences.find(row => row.region_slug === 'andes' && row.milestone === 'bronze');
if (!andesBronze || Number(andesBronze.start_year) !== 600 || Number(andesBronze.end_year) !== 1150 || !/not the invention of Andean metalworking/i.test(andesBronze.limits)) fail('Andean bronze must remain a regional Middle Horizon scaling clock rather than a metalworking invention date');
const indusMonument = cradleSequences.find(row => row.region_slug === 'indus' && row.milestone === 'monumental_building');
if (!indusMonument || !sourceKeys(indusMonument.source_keys).includes('GREEN_ALAM_PETRIE2026') || !/does not identify .*palace.*king.*centralized ruling class/i.test(indusMonument.limits)) fail('Indus monument evidence must preserve public-scale construction without inventing rulers');
const mesoMonument = cradleSequences.find(row => row.region_slug === 'mesoamerica' && row.milestone === 'monumental_building');
if (!mesoMonument || Number(mesoMonument.start_year) !== -1000 || Number(mesoMonument.end_year) !== -800 || !sourceKeys(mesoMonument.source_keys).includes('INOMATA_ET_AL2020')) fail('Mesoamerican monument evidence must preserve the Aguada Fénix 1000–800 BCE phase');
const cradleSequenceSnapshot = read('public/data/cradles/20260830-sequence1/cradles-sequence-clocks.csv');
if (cradleSequenceSnapshot !== readFileSync(path.join(root, 'public/data/cradles-sequence-clocks.csv'), 'utf8')) fail('Cradles sequence immutable client snapshot diverges from the canonical dataset');

const cradleCoordination = csv('public/data/cradles-coordination-routes.csv');
const cradleCoordinationKeys = new Set();
const coordinationCounts = new Map();
for (const [index, row] of cradleCoordination.entries()) {
  const context = `cradles-coordination-routes.csv row ${index + 2}`;
  requireFields(row, ['region', 'region_slug', 'route_slug', 'route_label', 'input', 'coordinator', 'outcome', 'observation', 'evidence_status', 'place', 'time_window', 'source_keys', 'interpretation', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!cradleRegions.has(row.region_slug)) fail(`${context} has unsupported region ${row.region_slug}`);
  const key = `${row.region_slug}|${row.route_slug}`;
  if (cradleCoordinationKeys.has(key)) fail(`${context} duplicates ${key}`); cradleCoordinationKeys.add(key);
  coordinationCounts.set(row.region_slug, (coordinationCounts.get(row.region_slug) ?? 0) + 1);
  if (Object.keys(row).some(field => /score|rank|index|prevalence|surplus_value|tax_value|storage_value|labor_value|coercion_value|capacity_value/i.test(field))) fail(`${context} introduces an unsupported common-scale field`);
  if (row.limits.length < 70) fail(`${context} does not preserve a substantive inference limit`);
  if (/proves? (centralized|hydraulic) control|automatically created (a )?state|measures? state capacity/i.test(`${row.observation} ${row.interpretation}`)) fail(`${context} turns one route into an unsupported state-capacity cause`);
}
if (cradleCoordination.length !== 24) fail(`Expected twenty-four cradles coordination routes, found ${cradleCoordination.length}`);
for (const region of cradleRegions) if (coordinationCounts.get(region) !== 4) fail(`Cradles coordination routes require four inspectable rows for ${region}, found ${coordinationCounts.get(region) ?? 0}`);
const mesopotamiaBowls = cradleCoordination.find(row => row.region_slug === 'mesopotamia' && row.route_slug === 'standard-vessels');
if (!mesopotamiaBowls || !sourceKeys(mesopotamiaBowls.source_keys).includes('CHAZAN_LEHNER1990') || !/do not prove grain wages forced labor slavery/i.test(mesopotamiaBowls.limits.replaceAll(',', ''))) fail('Mesopotamian vessel evidence must not become a grain-wage forced-labor or slavery estimate');
const egyptBrewing = cradleCoordination.find(row => row.region_slug === 'egypt' && row.route_slug === 'industrial-brewing');
if (!egyptBrewing || !sourceKeys(egyptBrewing.source_keys).includes('MOELLER2015') || !/cannot be estimated precisely/i.test(egyptBrewing.limits)) fail('Egyptian industrial brewing must preserve the missing capacity and worker estimates');
const indusPublicGoods = cradleCoordination.find(row => row.region_slug === 'indus' && row.route_slug === 'civic-public-goods');
if (!indusPublicGoods || !sourceKeys(indusPublicGoods.source_keys).includes('GREEN_ALAM_PETRIE2026') || !/does not identify a palace king labor regime or centralized ruling class/i.test(indusPublicGoods.limits.replaceAll(',', ''))) fail('Indus public goods must not invent a palace king labor regime or centralized ruling class');
const taosiStorage = cradleCoordination.find(row => row.region_slug === 'northern-china' && row.route_slug === 'segregated-storage');
if (!taosiStorage || !sourceKeys(taosiStorage.source_keys).includes('HE2018') || !/interpretations rather than surviving administrative records/i.test(taosiStorage.limits)) fail('Taosi storage must keep tax redistribution guards and ruler control interpretive');
const aguadaLabor = cradleCoordination.find(row => row.region_slug === 'mesoamerica' && row.route_slug === 'communal-monument');
if (!aguadaLabor || !sourceKeys(aguadaLabor.source_keys).includes('INOMATA_ET_AL2020') || !/voluntary coerced seasonal centrally commanded/i.test(aguadaLabor.limits.replaceAll(',', ''))) fail('Aguada Fénix must preserve uncertainty about how communal labor was organized');
const andesComplementarity = cradleCoordination.find(row => row.region_slug === 'andes' && row.route_slug === 'coast-valley-complementarity');
if (!andesComplementarity || !sourceKeys(andesComplementarity.source_keys).includes('SANDWEISS_ET_AL2009') || !/does not establish centralized redistribution/i.test(andesComplementarity.limits)) fail('Andean coast-valley complementarity must not become a centralized-redistribution claim');
const cradleCoordinationSnapshot = read('public/data/cradles/20260830-coordination1/cradles-coordination-routes.csv');
if (cradleCoordinationSnapshot !== readFileSync(path.join(root, 'public/data/cradles-coordination-routes.csv'), 'utf8')) fail('Cradles coordination immutable client snapshot diverges from the canonical dataset');

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
console.log(`Historical data validation passed: ${checked.length} files, ${sources.length} sources, ${datasets.length} datasets, ${claims.length} claims, ${rome.length} Roman force estimates, ${rivals.length} rival campaign observations, ${equipment.length} equipment-index rows, ${fiscalBudget.length} fiscal-budget rows, ${fiscalObservations.length} fiscal observations, ${collapseEvents.length} collapse events, ${africaEquivalents.length} African fiscal-equivalent rows, ${afterlives.length} Roman-afterlife rows, ${urukWriting.length} Uruk-writing rows, ${urukUrbanization.length} Uruk-urbanization rows, ${urukWater.length} Uruk-water rows, ${urukGrain.length} Uruk-grain rows, ${urukFragility.length} Uruk-fragility rows, ${cradles.length} cradles evidence-clock rows, ${cradleEcologies.length} cradles ecology rows, ${cradleSequences.length} cradles sequence rows, ${cradleCoordination.length} cradles coordination routes, ${geo.features.length} boundary features.`);
