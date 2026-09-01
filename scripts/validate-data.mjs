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

const administration = csv('public/data/rome/20260831-thin-state1/rome-han-administration.csv');
if (administration.length !== 2) fail(`Expected two Rome–Han administration rows, found ${administration.length}`);
for (const [index, row] of administration.entries()) {
  const context = `rome-han-administration.csv row ${index + 2}`;
  requireFields(row, ['polity', 'date_label', 'official_index', 'official_count_label', 'population_label', 'administrative_model', 'city_governance', 'source_keys', 'note'], context);
  numeric(row, ['official_index'], context);
  validateKeys(sourceKeys(row.source_keys), context);
}
const romanAdministration = administration.find(row => row.polity === 'Roman Empire');
const hanAdministration = administration.find(row => row.polity === 'Western Han');
if (!romanAdministration || Number(romanAdministration.official_index) !== 1) fail('Rome must remain the normalized administration baseline of 1');
if (!hanAdministration || Number(hanAdministration.official_index) !== 20 || hanAdministration.official_count_label !== '130,285 recorded officials') fail('Western Han must preserve the published approximate 20× comparison and recorded 130,285 count');
if (!hanAdministration?.note.includes('excludes military')) fail('The Han administration row must preserve the military-official exclusion');

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

const fallMechanism = csv('public/data/rome/20260831-fall1/rome-fall-mechanism.csv');
if (fallMechanism.length !== 7) fail(`Expected seven western-fall mechanism anchors, found ${fallMechanism.length}`);
const fallStages = new Set();
for (const [index, row] of fallMechanism.entries()) {
  const context = `rome-fall-mechanism.csv row ${index + 2}`;
  requireFields(row, ['stage', 'stage_order', 'evidence_order', 'date_label', 'evidence', 'measure_label', 'source_keys', 'note'], context);
  numeric(row, ['stage_order', 'evidence_order'], context);
  if (row.measure_value) numeric(row, ['measure_value'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  fallStages.add(row.stage);
}
if (fallStages.size !== 4) fail(`Expected four western-fall causal stages, found ${fallStages.size}`);
const fallAssessment = fallMechanism.find(row => row.measure_label === 'remaining assessment');
if (!fallAssessment || Number(fallAssessment.measure_value) !== 12.5 || !fallAssessment.note.includes('Numidia and Mauretania Sitifensis')) fail('Western-fall chain must keep the 445 one-eighth assessment local to its two named provinces');
const fallEquivalent = fallMechanism.find(row => row.measure_label === 'lost-revenue equivalent');
if (!fallEquivalent || Number(fallEquivalent.measure_value) !== 58000 || !fallEquivalent.note.includes('not an observed headcount')) fail('Western-fall chain must preserve the 58,000 infantry fiscal equivalent and anti-headcount limit');
const fallRecoveries = fallMechanism.find(row => row.measure_label === 'failed recovery attempts');
if (!fallRecoveries || Number(fallRecoveries.measure_value) !== 2) fail('Western-fall chain must preserve the two failed African recovery attempts');

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

const roadPersistence = csv('public/data/rome/20260831-roads1/roman-road-persistence.csv');
if (roadPersistence.length !== 8) fail(`Expected eight Europe–MENA road-persistence estimates, found ${roadPersistence.length}`);
const roadOutcomes = new Set();
for (const [index, row] of roadPersistence.entries()) {
  const context = `roman-road-persistence.csv row ${index + 2}`;
  requireFields(row, ['outcome', 'outcome_order', 'period', 'region', 'coefficient', 'standard_error', 'significant_10pct', 'interpretation', 'source_keys', 'note'], context);
  numeric(row, ['outcome_order', 'coefficient', 'standard_error'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!['Europe', 'MENA'].includes(row.region)) fail(`${context} has unsupported region ${row.region}`);
  if (!['yes', 'no'].includes(row.significant_10pct)) fail(`${context} has unsupported significance label ${row.significant_10pct}`);
  roadOutcomes.add(row.outcome);
}
if (roadOutcomes.size !== 4) fail(`Expected four road-persistence outcomes, found ${roadOutcomes.size}`);
for (const outcome of roadOutcomes) if (roadPersistence.filter(row => row.outcome === outcome).length !== 2) fail(`${outcome} must have one Europe and one MENA estimate`);
const expectedRoadCoefficients = new Map([
  ['Settlements|Europe', [0.470, 0.255, 'yes']], ['Settlements|MENA', [0.599, 0.358, 'yes']],
  ['Modern roads|Europe', [0.208, 0.072, 'yes']], ['Modern roads|MENA', [-0.115, 0.091, 'no']],
  ['Night lights|Europe', [0.783, 0.191, 'yes']], ['Night lights|MENA', [0.405, 0.282, 'no']],
  ['Population|Europe', [1.405, 0.390, 'yes']], ['Population|MENA', [0.717, 0.630, 'no']],
]);
for (const row of roadPersistence) { const expected = expectedRoadCoefficients.get(`${row.outcome}|${row.region}`); if (!expected || Number(row.coefficient) !== expected[0] || Number(row.standard_error) !== expected[1] || row.significant_10pct !== expected[2]) fail(`Road-persistence estimate changed for ${row.outcome}|${row.region}`); }

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
if (urukUrbanization.length !== 11) fail(`Expected eleven Uruk urbanization rows, found ${urukUrbanization.length}`);
for (const [year, value] of [[-3100, 250], [-2900, 400]]) if (!urukUrbanization.some(row => row.kind === 'footprint' && row.place === 'Uruk' && Number(row.start_year) === year && Number(row.value) === value && row.unit === 'hectares')) fail(`Uruk urbanization data is missing the ${Math.abs(year)} BCE footprint of ${value} hectares`);
if (!urukUrbanization.some(row => row.kind === 'timeline' && row.place === 'Shakhi Kora' && Number(row.start_year) === -3941 && Number(row.end_year) === -3377)) fail('Uruk urbanization data is missing the 3941–3377 cal BCE Shakhi Kora institutional sequence');
if (!urukUrbanization.some(row => row.kind === 'timeline' && row.system === 'Political inference' && row.place === 'Uruk' && Number(row.start_year) === -3800 && Number(row.end_year) === -3300)) fail('Uruk urbanization data is missing the bounded 3800–3300 BCE political interpretation');
if (!urukUrbanization.some(row => row.kind === 'context' && row.place === 'Khirbet al-Fakhar' && Number(row.value) === 300 && /sparse/i.test(row.limits) && /possibly seasonal/i.test(row.limits))) fail('Uruk urbanization data must preserve the sparse, possibly seasonal Khirbet al-Fakhar counterexample');

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
if (urukWater.length !== 12) fail(`Expected twelve Uruk water-ecology rows, found ${urukWater.length}`);
if (!urukWater.some(row => row.measure === 'freshwater_environment' && Number(row.start_year) === -7750 && Number(row.end_year) === -4900 && row.source_keys === 'ALTAWEEL_ET_AL2019')) fail('Uruk water ecology is missing the bounded M38 freshwater sequence');
if (!urukWater.some(row => row.kind === 'map_boundary' && row.measure === 'palaeochannel_palimpsest' && row.start_year === '' && row.end_year === '' && row.source_keys === 'JOTHERI_ET_AL2025')) fail('Uruk water ecology must keep the palaeochannel map explicitly undated');
if (!urukWater.some(row => row.kind === 'timeline' && row.measure === 'stable_anthropogenic_channels' && Number(row.start_year) === -4000 && Number(row.end_year) === -1000 && row.source_keys === 'JOTHERI_ET_AL2018' && /one builder/i.test(row.limits))) fail('Uruk water ecology must preserve the long Uruk-region canal interval without assigning one builder');
for (const [measure, value] of [['primary_canals', 200], ['branch_canals', 4000], ['farms', 700]]) if (!urukWater.some(row => row.measure === measure && Number(row.value) === value && row.relation === 'more_than' && row.start_year === '-6000' && row.end_year === '-1000')) fail(`Uruk water ecology is missing the non-simultaneous Eridu ${measure} lower bound`);
if (!urukWater.some(row => row.measure === 'canal_archaeological_context' && Number(row.start_year) === -2900 && Number(row.end_year) === -2600 && row.source_keys === 'EGBERTS_ET_AL2023')) fail('Uruk water ecology is missing the Girsu canal stratigraphic interval');
if (!urukWater.some(row => row.measure === 'developed_irrigation_terminology' && Number(row.start_year) === -2475 && Number(row.end_year) === -2315 && row.source_keys === 'EGBERTS_ET_AL2023')) fail('Uruk water ecology is missing the bounded Lagash textual interval');
for (const asset of ['public/images/mesopotamia-palaeochannels.webp', 'public/images/eridu-irrigation-network.webp']) if (!existsSync(path.join(root, asset))) fail(`Missing Uruk water-map asset: ${asset}`);
read('public/images/uruk-water-map-LICENSE.md');

const urukGrain = csv('public/data/uruk-grain-state-evidence.csv');
const urukGrainSlugs = new Set();
const grainResourceClasses = new Set(['model_and_direct_archive', 'model_counterfactual', 'mixed_direct_and_later_comparison', 'mixed_landscape_and_archive', 'direct_late_uruk_archive']);
const grainTestClasses = new Set(['published_model', 'published_critique', 'direct_archive', 'regional_synthesis', 'methodological_counterexample']);
const grainEstimateClasses = new Set(['replicated_model_estimate', 'replicated_robustness_estimate']);
for (const [index, row] of urukGrain.entries()) {
  const context = `uruk-grain-state-evidence.csv row ${index + 2}`;
  requireFields(row, ['row_type', 'slug', 'label', 'role', 'model_claim', 'uruk_evidence', 'chronology', 'evidence_class', 'source_keys', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!['resource', 'test', 'estimate'].includes(row.row_type)) fail(`${context} has unsupported row type ${row.row_type}`);
  if (urukGrainSlugs.has(row.slug)) fail(`${context} duplicates slug ${row.slug}`); urukGrainSlugs.add(row.slug);
  if (row.row_type === 'resource' && !grainResourceClasses.has(row.evidence_class)) fail(`${context} has unsupported resource evidence class ${row.evidence_class}`);
  if (row.row_type === 'test' && !grainTestClasses.has(row.evidence_class)) fail(`${context} has unsupported test evidence class ${row.evidence_class}`);
  if (row.row_type === 'estimate') {
    if (!grainEstimateClasses.has(row.evidence_class)) fail(`${context} has unsupported estimate evidence class ${row.evidence_class}`);
    numeric(row, ['estimate', 'p_value', 'observations'], context);
    if (Number(row.observations) !== 952) fail(`${context} must preserve the 952-society sample`);
  }
  if (Object.keys(row).some(key => /score|rank|weight|index/i.test(key))) fail(`${context} introduces an unsupported aggregate score field`);
  const claimText = `${row.model_claim} ${row.uruk_evidence}`;
  if (/grain alone caused (uruk'?s )?(state|hierarchy)/i.test(claimText) && !/(not|does not|cannot|no evidence)/i.test(claimText)) fail(`${context} presents grain causation as established`);
}
if (urukGrain.length !== 12) fail(`Expected twelve Uruk grain-state evidence rows, found ${urukGrain.length}`);
if (urukGrain.filter(row => row.row_type === 'resource').length !== 5 || urukGrain.filter(row => row.row_type === 'test').length !== 5 || urukGrain.filter(row => row.row_type === 'estimate').length !== 2) fail('Uruk grain-state evidence must retain five resource rows, five claim-test rows, and two replicated estimate rows');
for (const slug of ['cereal-grain', 'roots-and-tubers', 'herd-animals', 'fish-and-wetlands', 'fruit-orchards', 'original-study', 'published-comment', 'uruk-archive', 'deltaic-economy', 'archive-bias', 'full-2sls', 'winsorized-2sls']) if (!urukGrainSlugs.has(slug)) fail(`Uruk grain-state evidence is missing ${slug}`);
const fullGrainEstimate = urukGrain.find(row => row.slug === 'full-2sls');
const robustGrainEstimate = urukGrain.find(row => row.slug === 'winsorized-2sls');
if (!fullGrainEstimate || Number(fullGrainEstimate.estimate) !== 0.892 || Number(fullGrainEstimate.p_value) !== 0.046 || !sourceKeys(fullGrainEstimate.source_keys).includes('COOK_ET_AL2023_REPLICATION')) fail('Uruk grain-state evidence must preserve the replicated Table 1 column 3 estimate');
if (!robustGrainEstimate || Number(robustGrainEstimate.estimate) !== 0.691 || Number(robustGrainEstimate.p_value) !== 0.109 || !/thirty-one observations/i.test(robustGrainEstimate.model_claim)) fail('Uruk grain-state evidence must preserve the top-three-percent winsorized Table 7 estimate');
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
if (!shakhiDispersal || Number(shakhiDispersal.value) !== 4 || !/almost 1,500 years/i.test(shakhiDispersal.observation)) fail('Shakhi Kora must preserve four institutional phases and the almost 1,500-year local interval');
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

const cradleAfterlives = csv('public/data/cradles-afterlives.csv');
const afterlifeRegions = new Set();
const afterlifePathways = new Set();
for (const [index, row] of cradleAfterlives.entries()) {
  const context = `cradles-afterlives.csv row ${index + 2}`;
  requireFields(row, ['region', 'region_slug', 'pathway', 'pathway_label', 'before', 'transition', 'afterlife', 'place', 'time_window', 'evidence_status', 'source_keys', 'interpretation', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!cradleRegions.has(row.region_slug)) fail(`${context} has unsupported region ${row.region_slug}`);
  if (afterlifeRegions.has(row.region_slug)) fail(`${context} duplicates region ${row.region_slug}`); afterlifeRegions.add(row.region_slug);
  if (afterlifePathways.has(row.pathway)) fail(`${context} duplicates pathway ${row.pathway}`); afterlifePathways.add(row.pathway);
  if (Object.keys(row).some(field => /score|rank|index|population_loss|collapse_value|resilience_value|continuity_value/i.test(field))) fail(`${context} introduces an unsupported common-scale field`);
  if (row.limits.length < 100) fail(`${context} does not preserve a substantive inference limit`);
}
if (cradleAfterlives.length !== 6 || afterlifeRegions.size !== 6 || afterlifePathways.size !== 6) fail(`Cradles afterlives require six unique regional pathways, found ${cradleAfterlives.length} rows, ${afterlifeRegions.size} regions, and ${afterlifePathways.size} pathways`);
const mesopotamiaAfterlife = cradleAfterlives.find(row => row.region_slug === 'mesopotamia');
if (!mesopotamiaAfterlife || !sourceKeys(mesopotamiaAfterlife.source_keys).includes('GLATZ_ET_AL2025') || !/rather than the fate of all Mesopotamia/i.test(mesopotamiaAfterlife.limits)) fail('Mesopotamian afterlife must remain a bounded Upper Diyala dispersal case');
const egyptAfterlife = cradleAfterlives.find(row => row.region_slug === 'egypt');
if (!egyptAfterlife || !sourceKeys(egyptAfterlife.source_keys).includes('CHARLOUX_ET_AL2021') || !/not uninterrupted national government/i.test(egyptAfterlife.limits)) fail('Egyptian afterlife must preserve the limit between Theban relocation and national continuity');
const indusAfterlife = cradleAfterlives.find(row => row.region_slug === 'indus');
if (!indusAfterlife || !sourceKeys(indusAfterlife.source_keys).includes('MADELLA_FULLER2006') || !/does not supply a single cause/i.test(indusAfterlife.limits) || !/not evidence that the population disappeared/i.test(indusAfterlife.interpretation)) fail('Indus afterlife must block climate monocausality and population disappearance');
const chinaAfterlife = cradleAfterlives.find(row => row.region_slug === 'northern-china');
if (!chinaAfterlife || !sourceKeys(chinaAfterlife.source_keys).includes('HE2018') || !/does not identify a conqueror prove a dynasty or draw a direct line to Erlitou/i.test(chinaAfterlife.limits.replaceAll(',', ''))) fail('Taosi afterlife must not invent a conqueror dynasty or direct Erlitou succession');
const mesoAfterlife = cradleAfterlives.find(row => row.region_slug === 'mesoamerica');
if (!mesoAfterlife || !sourceKeys(mesoAfterlife.source_keys).includes('KOWALEWSKI_ET_AL2025') || !/secondary centers did not simply switch off/i.test(mesoAfterlife.interpretation)) fail('Oaxaca afterlife must preserve uneven secondary-center change');
const andesAfterlife = cradleAfterlives.find(row => row.region_slug === 'andes');
if (!andesAfterlife || !sourceKeys(andesAfterlife.source_keys).includes('SANDWEISS_ET_AL2009') || !/testable hypothesis/i.test(andesAfterlife.limits) || !/does not prove a monocause/i.test(andesAfterlife.limits)) fail('Andean afterlife must preserve the hazard sequence as a non-monocausal hypothesis');
const cradleAfterlivesSnapshot = read('public/data/cradles/20260830-afterlives1/cradles-afterlives.csv');
if (cradleAfterlivesSnapshot !== readFileSync(path.join(root, 'public/data/cradles-afterlives.csv'), 'utf8')) fail('Cradles afterlives immutable client snapshot diverges from the canonical dataset');

const bronzeNodes = csv('public/data/bronze-metal-network-nodes.csv');
const bronzeLinks = csv('public/data/bronze-metal-network-links.csv');
const bronzeNodeIndex = new Map();
const bronzeNetworkNodeCounts = new Map();
const bronzeNetworkLinkCounts = new Map();
for (const [index, row] of bronzeNodes.entries()) {
  const context = `bronze-metal-network-nodes.csv row ${index + 2}`;
  requireFields(row, ['network_id', 'network_label', 'node_id', 'name', 'latitude', 'longitude', 'role', 'material', 'display_date', 'evidence_status', 'observation', 'source_keys', 'limits'], context);
  numeric(row, ['latitude', 'longitude'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  const key = `${row.network_id}|${row.node_id}`;
  if (bronzeNodeIndex.has(key)) fail(`${context} duplicates ${key}`); bronzeNodeIndex.set(key, row);
  bronzeNetworkNodeCounts.set(row.network_id, (bronzeNetworkNodeCounts.get(row.network_id) ?? 0) + 1);
  if (Object.keys(row).some(field => /annual_volume|traffic|market_share|rank|score|direct_route/i.test(field))) fail(`${context} introduces an unsupported route or quantity field`);
  if (row.limits.length < 70) fail(`${context} does not preserve a substantive inference limit`);
}
for (const [index, row] of bronzeLinks.entries()) {
  const context = `bronze-metal-network-links.csv row ${index + 2}`;
  requireFields(row, ['network_id', 'link_id', 'from_node', 'to_node', 'material', 'link_class', 'evidence_status', 'display_date', 'observation', 'source_keys', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (!bronzeNodeIndex.has(`${row.network_id}|${row.from_node}`) || !bronzeNodeIndex.has(`${row.network_id}|${row.to_node}`)) fail(`${context} references a node outside its evidence view`);
  bronzeNetworkLinkCounts.set(row.network_id, (bronzeNetworkLinkCounts.get(row.network_id) ?? 0) + 1);
  if (Object.keys(row).some(field => /annual_volume|traffic|market_share|rank|score|direct_route/i.test(field))) fail(`${context} introduces an unsupported route or quantity field`);
  if (!/not |no |rather than|cannot|does not/i.test(row.limits)) fail(`${context} does not state a negative inference limit`);
}
const expectedBronzeNodes = new Map([['one-cargo', 5], ['copper-reach', 7], ['atlantic-tin', 4], ['textual-hub', 3]]);
const expectedBronzeLinks = new Map([['one-cargo', 4], ['copper-reach', 6], ['atlantic-tin', 4], ['textual-hub', 2]]);
if (bronzeNodes.length !== 19 || bronzeLinks.length !== 16) fail(`Bronze metal network requires 19 nodes and 16 links; found ${bronzeNodes.length} and ${bronzeLinks.length}`);
for (const [network, count] of expectedBronzeNodes) if (bronzeNetworkNodeCounts.get(network) !== count) fail(`Bronze ${network} requires ${count} nodes`);
for (const [network, count] of expectedBronzeLinks) if (bronzeNetworkLinkCounts.get(network) !== count) fail(`Bronze ${network} requires ${count} links`);
const uluburun = bronzeNodeIndex.get('one-cargo|uluburun');
if (!uluburun || !sourceKeys(uluburun.source_keys).includes('HAUPTMANN_ET_AL2002') || !sourceKeys(uluburun.source_keys).includes('MANNING_ET_AL2009') || !/ten tonnes of copper and one tonne of tin/i.test(uluburun.observation) || !/not an annual trade total/i.test(uluburun.limits)) fail('Uluburun must remain one dated cargo with 10 tonnes copper 1 tonne tin and an explicit non-annual limit');
const aplikiReach = bronzeNodeIndex.get('copper-reach|aplike');
if (!aplikiReach || !sourceKeys(aplikiReach.source_keys).includes('STOS_GALE_ET_AL1997') || !/78 analyzed oxhide ingots/i.test(aplikiReach.observation)) fail('Cypriot copper reach must preserve the published 78-ingot comparison');
const israelTin = bronzeNodeIndex.get('atlantic-tin|israel');
if (!israelTin || !sourceKeys(israelTin.source_keys).includes('WILLIAMS_ET_AL2025') || !/no evidence for a direct Britain-to-eastern-Mediterranean connection/i.test(israelTin.limits)) fail('Atlantic tin must explicitly reject a direct Britain-to-Levant route inference');
const mushiston = bronzeNodeIndex.get('one-cargo|mushiston');
if (!mushiston || mushiston.evidence_status !== 'rejected_specific_match' || !sourceKeys(mushiston.source_keys).includes('POWELL_ET_AL2022') || !sourceKeys(mushiston.source_keys).includes('BERGER_ET_AL2023') || !/does not rule out every eastern tin source/i.test(mushiston.limits)) fail('Mušiston must preserve both the proposal and critique without excluding all eastern sources');
const mari = bronzeNodeIndex.get('textual-hub|mari');
if (!mari || !sourceKeys(mari.source_keys).includes('SAUVAGE2017') || !/does not reveal the mine source.*cargo size.*complete route/i.test(mari.limits)) fail('Mari textual evidence must not become a mine cargo or complete route');
for (const file of ['bronze-metal-network-nodes.csv', 'bronze-metal-network-links.csv']) {
  const snapshot = read(`public/data/bronze-age/20260830-bronze-network1/${file}`);
  if (snapshot !== readFileSync(path.join(root, `public/data/${file}`), 'utf8')) fail(`Bronze immutable client snapshot diverges from ${file}`);
}

const bronzePalaceCircuits = csv('public/data/bronze-palace-circuits.csv');
const palaceCases = new Set();
for (const [index, row] of bronzePalaceCircuits.entries()) {
  const context = `bronze-palace-circuits.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'site', 'region', 'date_window', 'focal_flow', 'input', 'aperture', 'transformation', 'visible_output', 'outside_palace', 'evidence_channels', 'anchor_value', 'anchor_label', 'evidence_status', 'source_keys', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (palaceCases.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); palaceCases.add(row.case_id);
  if (Object.keys(row).some(field => /capacity_score|centralization_score|rank|whole_economy|annual_output|palace_share/i.test(field))) fail(`${context} introduces an unsupported shared-scale field`);
  if (row.limits.length < 110) fail(`${context} does not preserve a substantive outside-palace or evidence limit`);
}
for (const caseId of ['mari', 'hattusha', 'knossos', 'pylos', 'ugarit']) if (!palaceCases.has(caseId)) fail(`Bronze palace circuits are missing ${caseId}`);
if (bronzePalaceCircuits.length !== 5 || palaceCases.size !== 5) fail(`Bronze palace comparison requires five unique circuits, found ${bronzePalaceCircuits.length} rows and ${palaceCases.size} cases`);
const mariCircuit = bronzePalaceCircuits.find(row => row.case_id === 'mari');
if (!mariCircuit || mariCircuit.anchor_value !== '15000' || !sourceKeys(mariCircuit.source_keys).includes('MARI_ARCHAEOLOGY') || !/not an annual transaction count.*whole Mari economy/i.test(mariCircuit.limits)) fail('Mari must preserve the 15000-text half-century corpus as neither annual count nor whole economy');
const hattushaCircuit = bronzePalaceCircuits.find(row => row.case_id === 'hattusha');
if (!hattushaCircuit || !sourceKeys(hattushaCircuit.source_keys).includes('DIFFEY_ET_AL2020') || !/not an annual tax series.*capacity estimate for the empire.*proof that the state directed cultivation/i.test(hattushaCircuit.limits)) fail('Hattusha must remain one silo episode without empire capacity or directed-cultivation inference');
const knossosCircuit = bronzePalaceCircuits.find(row => row.case_id === 'knossos');
if (!knossosCircuit || knossosCircuit.anchor_value !== '66000' || !/600 recorded flocks/i.test(knossosCircuit.anchor_label) || !sourceKeys(knossosCircuit.source_keys).includes('HALSTEAD1999') || !/not a complete livestock census/i.test(knossosCircuit.limits)) fail('Knossos must preserve 66000 sheep in about 600 flocks as an incomplete administrative selection');
const pylosCircuit = bronzePalaceCircuits.find(row => row.case_id === 'pylos');
if (!pylosCircuit || pylosCircuit.anchor_value !== '1.5–12 kg' || !sourceKeys(pylosCircuit.source_keys).includes('NAKASSIS2015') || !sourceKeys(pylosCircuit.source_keys).includes('JUDSON2023') || !/does not identify finished objects.*all smiths.*palace share/i.test(pylosCircuit.limits)) fail('Pylos must preserve the bounded bronze-allotment range and selective-mobilization limits');
const ugaritCircuit = bronzePalaceCircuits.find(row => row.case_id === 'ugarit');
if (!ugaritCircuit || ugaritCircuit.anchor_value !== '600' || !/royal palace archive: 1,040/i.test(ugaritCircuit.anchor_label) || !sourceKeys(ugaritCircuit.source_keys).includes('MALBRAN_LABAT_ROCHE2008') || !sourceKeys(ugaritCircuit.source_keys).includes('GILIBERT2021') || !/not a count of private trade/i.test(ugaritCircuit.limits)) fail('Ugarit must preserve the Urtenu and palace archive comparison without turning it into private-trade volume');
const bronzePalaceSnapshot = read('public/data/bronze-age/20260830-palace1/bronze-palace-circuits.csv');
if (bronzePalaceSnapshot !== readFileSync(path.join(root, 'public/data/bronze-palace-circuits.csv'), 'utf8')) fail('Bronze palace immutable client snapshot diverges from the canonical dataset');

const bronzeChariotSystems = csv('public/data/bronze-chariot-systems.csv');
const chariotCases = new Map();
for (const [index, row] of bronzeChariotSystems.entries()) {
  const context = `bronze-chariot-systems.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'place', 'region', 'date_window', 'evidence_kind', 'anchor_value', 'anchor_label', 'vehicle', 'horses', 'control', 'people', 'upkeep', 'institution', 'interpretation', 'source_keys', 'limits'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (chariotCases.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); chariotCases.set(row.case_id, row);
  if (Object.keys(row).some(field => /effectiveness_score|completeness_score|force_total|annual_cost|fodder_acres|crew_standard|rank/i.test(field))) fail(`${context} introduces an unsupported shared-scale or modeled field`);
  if (row.limits.length < 130) fail(`${context} does not preserve a substantive survival and inference limit`);
}
for (const caseId of ['husiatyn', 'hattusha', 'pylos', 'amarna', 'anyang']) if (!chariotCases.has(caseId)) fail(`Bronze chariot systems are missing ${caseId}`);
if (bronzeChariotSystems.length !== 5 || chariotCases.size !== 5) fail(`Bronze chariot comparison requires five unique records, found ${bronzeChariotSystems.length} rows and ${chariotCases.size} cases`);
const husiatynChariot = chariotCases.get('husiatyn');
if (!husiatynChariot || husiatynChariot.anchor_value !== '2' || !sourceKeys(husiatynChariot.source_keys).includes('MAKAROWICZ_ET_AL2022') || !/vehicle did not survive.*cannot establish battlefield use.*force/i.test(husiatynChariot.limits)) fail('Husiatyn must preserve two horses while explicitly withholding vehicle battle and force inferences');
const hattushaChariot = chariotCases.get('hattusha');
if (!hattushaChariot || hattushaChariot.anchor_value !== '≥184' || !sourceKeys(hattushaChariot.source_keys).includes('RAULWING2009') || !/scholarly reconstruction.*not an ancient numbered total.*does not measure compliance/i.test(hattushaChariot.limits)) fail('Kikkuli must preserve the at-least-184-day reconstructed schedule without claiming compliance');
const pylosChariot = chariotCases.get('pylos');
if (!pylosChariot || pylosChariot.anchor_value !== '58 pairs' || !/13 listed as unfit for service/i.test(pylosChariot.anchor_label) || !sourceKeys(pylosChariot.source_keys).includes('OBRIEN2009') || !/not 58 complete or fieldable chariots/i.test(pylosChariot.limits)) fail('Pylos must keep wheel pairs and unfit condition separate from a fieldable chariot count');
const amarnaChariot = chariotCases.get('amarna');
if (!amarnaChariot || amarnaChariot.anchor_value !== '1 + 2' || !sourceKeys(amarnaChariot.source_keys).includes('ORACC_EA15') || !sourceKeys(amarnaChariot.source_keys).includes('MET_AMARNA_LETTERS') || !/not a military inventory.*price.*standard issue/i.test(amarnaChariot.limits)) fail('EA 15 must remain one diplomatic gift rather than an inventory price or standard issue');
const anyangChariot = chariotCases.get('anyang');
if (!anyangChariot || anyangChariot.anchor_value !== '1 + 2 + 3' || !sourceKeys(anyangChariot.source_keys).includes('RAWSON_ET_AL2020') || !sourceKeys(anyangChariot.source_keys).includes('IHP_YIN_CHARIOT_M40') || !/M40 quantities and M41 repair tools come from different pits.*mortuary staging is not field organization/i.test(anyangChariot.limits)) fail('Anyang must keep M40 and M41 contexts separate and reject a field-organization inference');
const bronzeChariotSnapshot = read('public/data/bronze-age/20260830-chariot1/bronze-chariot-systems.csv');
if (bronzeChariotSnapshot !== readFileSync(path.join(root, 'public/data/bronze-chariot-systems.csv'), 'utf8')) fail('Bronze chariot immutable client snapshot diverges from the canonical dataset');

const bronzeMaritimeCases = csv('public/data/bronze-maritime-cases.csv');
const maritimeCases = new Map();
for (const [index, row] of bronzeMaritimeCases.entries()) {
  const context = `bronze-maritime-cases.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'name', 'case_kind', 'date_window', 'latitude', 'longitude', 'political_setting', 'anchor_value', 'anchor_label', 'carrier', 'evidence', 'interpretation', 'source_keys', 'limits'], context);
  numeric(row, ['latitude', 'longitude'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (maritimeCases.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); maritimeCases.set(row.case_id, row);
  if (Object.keys(row).some(field => /annual_(traffic|flow|volume)|market_share|connectivity_score|port_rank|direct_route|crew_ethnicity|political_control|typical_year/i.test(field))) fail(`${context} introduces an unsupported maritime model field`);
  if (row.limits.length < 150) fail(`${context} does not preserve substantive cargo route and institutional limits`);
}
for (const caseId of ['uluburun', 'cape-gelidonya', 'point-iria', 'kommos', 'hala-sultan-tekke']) if (!maritimeCases.has(caseId)) fail(`Bronze maritime cases are missing ${caseId}`);
if (bronzeMaritimeCases.length !== 5 || maritimeCases.size !== 5) fail(`Bronze maritime comparison requires five unique cases, found ${bronzeMaritimeCases.length} rows and ${maritimeCases.size} cases`);
const bronzeMaritimeLinks = csv('public/data/bronze-maritime-links.csv');
const maritimeLinkIds = new Set(); const maritimeLinksByCase = new Map();
for (const [index, row] of bronzeMaritimeLinks.entries()) {
  const context = `bronze-maritime-links.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'link_id', 'region', 'latitude', 'longitude', 'material', 'evidence_class', 'observation', 'source_keys', 'limits'], context);
  numeric(row, ['latitude', 'longitude'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (!maritimeCases.has(row.case_id)) fail(`${context} references missing case ${row.case_id}`);
  if (maritimeLinkIds.has(row.link_id)) fail(`${context} duplicates ${row.link_id}`); maritimeLinkIds.add(row.link_id);
  maritimeLinksByCase.set(row.case_id, (maritimeLinksByCase.get(row.case_id) ?? 0) + 1);
  if (Object.keys(row).some(field => /distance_traveled|direction|frequency|quantity|direct_route|annual_flow|market_share/i.test(field))) fail(`${context} introduces an unsupported route or flow field`);
  if (row.limits.length < 95) fail(`${context} does not preserve a substantive association or route limit`);
}
const expectedMaritimeLinks = new Map([['uluburun', 4], ['cape-gelidonya', 2], ['point-iria', 3], ['kommos', 4], ['hala-sultan-tekke', 6]]);
for (const [caseId, expected] of expectedMaritimeLinks) if (maritimeLinksByCase.get(caseId) !== expected) fail(`${caseId} must preserve ${expected} bounded maritime associations`);
if (bronzeMaritimeLinks.length !== 19 || maritimeLinkIds.size !== 19) fail(`Bronze maritime comparison requires nineteen unique links, found ${bronzeMaritimeLinks.length}`);
const uluburunMaritime = maritimeCases.get('uluburun');
if (!uluburunMaritime || uluburunMaritime.anchor_value !== '10 + 1 t' || !sourceKeys(uluburunMaritime.source_keys).includes('INA_ULUBURUN') || !/not a representative cargo.*annual flow.*ownership.*institutional status remain debated/i.test(uluburunMaritime.limits)) fail('Uluburun must remain one exceptional cargo without representative flow ownership or route inference');
const gelidonyaMaritime = maritimeCases.get('cape-gelidonya');
if (!gelidonyaMaritime || gelidonyaMaritime.anchor_value !== '750+' || !sourceKeys(gelidonyaMaritime.source_keys).includes('INA_GELIDONYA_INGOTS') || !/not 750 complete ingots.*full shipment count.*identity is unresolved/i.test(gelidonyaMaritime.limits)) fail('Cape Gelidonya must preserve fragment and tinker-model limits');
const iriaMaritime = maritimeCases.get('point-iria');
if (!iriaMaritime || iriaMaritime.anchor_value !== '3 regions' || !sourceKeys(iriaMaritime.source_keys).includes('POINT_IRIA_HIMA') || !/do not identify crew ethnicity.*complete itinerary.*reconstruction rather than an observed sequence/i.test(iriaMaritime.limits)) fail('Point Iria must preserve mixed ceramic regions without crew or observed-itinerary inference');
const kommosMaritime = maritimeCases.get('kommos');
if (!kommosMaritime || kommosMaritime.anchor_value !== '69' || !/roughly 80 percent/i.test(kommosMaritime.evidence) || !sourceKeys(kommosMaritime.source_keys).includes('TOMLINSON_RUTTER_HOFFMANN2010') || !/not all pottery.*share of imports.*annual series/i.test(kommosMaritime.limits)) fail('Kommos must preserve the selected 69-fragment sample and bounded eighty-percent result');
const halaMaritime = maritimeCases.get('hala-sultan-tekke');
if (!halaMaritime || halaMaritime.anchor_value !== '≥25 ha' || !sourceKeys(halaMaritime.source_keys).includes('FISCHER2023') || !/do not measure simultaneous population.*annual imports.*market share.*centuries/i.test(halaMaritime.limits)) fail('Hala Sultan Tekke must preserve minimum extent and multi-period assemblage limits');
for (const file of ['bronze-maritime-cases.csv', 'bronze-maritime-links.csv']) {
  const snapshot = read(`public/data/bronze-age/20260830-maritime1/${file}`);
  if (snapshot !== readFileSync(path.join(root, `public/data/${file}`), 'utf8')) fail(`Bronze maritime immutable client snapshot diverges from ${file}`);
}

const bronzeCollapseWindows = csv('public/data/bronze-collapse-windows.csv');
const collapseWindows = new Map();
for (const [index, row] of bronzeCollapseWindows.entries()) {
  const context = `bronze-collapse-windows.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'place', 'region', 'start_year', 'end_year', 'date_window', 'evidence_kind', 'anchor_value', 'anchor_label', 'environment', 'conflict', 'institution', 'persistence', 'interpretation', 'source_keys', 'limits'], context);
  numeric(row, ['start_year', 'end_year'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (collapseWindows.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); collapseWindows.set(row.case_id, row);
  if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  if (Object.keys(row).some(field => /collapse_score|cause_score|resilience_score|population_loss|annual_(decline|flow)|common_attacker|shared_year|rank/i.test(field))) fail(`${context} introduces an unsupported collapse or causal model field`);
  if (row.limits.length < 105) fail(`${context} does not preserve a substantive chronology and causal limit`);
}
for (const caseId of ['eastern-mediterranean', 'pylos', 'hattusa', 'ugarit-gibala', 'hala-sultan-tekke', 'egypt']) if (!collapseWindows.has(caseId)) fail(`Bronze collapse chronology is missing ${caseId}`);
if (bronzeCollapseWindows.length !== 6 || collapseWindows.size !== 6) fail(`Bronze collapse chronology requires six unique windows, found ${bronzeCollapseWindows.length} rows and ${collapseWindows.size} cases`);
const regionalCollapse = collapseWindows.get('eastern-mediterranean');
if (!regionalCollapse || regionalCollapse.anchor_value !== '~150 years' || !sourceKeys(regionalCollapse.source_keys).includes('KNAPP_MANNING2016') || !/editorial.*not a measured duration.*no collapse score.*shared cause.*synchronized year.*population loss/i.test(regionalCollapse.limits)) fail('Regional collapse frame must remain an editorial comparison without one duration cause year or loss estimate');
const pylosCollapse = collapseWindows.get('pylos');
if (!pylosCollapse || pylosCollapse.anchor_value !== '~1,000 tablets' || !sourceKeys(pylosCollapse.source_keys).includes('JUDSON2023') || !/approximate.*challenged.*does not identify an attacker.*do not prove/i.test(pylosCollapse.limits)) fail('Pylos must preserve the final-horizon archive and contested chronology without an attacker attribution');
const hattusaCollapse = collapseWindows.get('hattusa');
if (!hattusaCollapse || hattusaCollapse.anchor_value !== '1198–1196 BCE' || !sourceKeys(hattusaCollapse.source_keys).includes('MANNING_ET_AL2023') || !/regional context.*not a direct observation.*political causation.*later burning/i.test(hattusaCollapse.limits)) fail('Hattusa must preserve the regional drought anchor without a drought monocause or one attack event');
const ugaritCollapse = collapseWindows.get('ugarit-gibala');
if (!ugaritCollapse || ugaritCollapse.anchor_value !== '1192–1190 BCE' || !sourceKeys(ugaritCollapse.source_keys).includes('KANIEWSKI_ET_AL2011') || !sourceKeys(ugaritCollapse.source_keys).includes('HALAYQA2010') || !/for Gibala.*not an exact universal collapse year.*not.*one homogeneous force/i.test(ugaritCollapse.limits)) fail('Ugarit and Gibala must preserve the local date range and heterogeneous attacker limit');
const halaCollapse = collapseWindows.get('hala-sultan-tekke');
if (!halaCollapse || halaCollapse.anchor_value !== 'c. 1150 BCE' || !sourceKeys(halaCollapse.source_keys).includes('OEA_HALA_SULTAN') || !/not an annual decline series.*do not measure total trade.*does not establish population death.*single migration/i.test(halaCollapse.limits)) fail('Hala Sultan Tekke must preserve phased change without annual decline death or migration inference');
const egyptCollapse = collapseWindows.get('egypt');
if (!egyptCollapse || egyptCollapse.anchor_value !== 'Year 8' || !sourceKeys(egyptCollapse.source_keys).includes('MEDINET_HABU_OIP') || !/interested testimony.*not provide neutral casualty totals.*proof.*every other regional destruction/i.test(egyptCollapse.limits)) fail('Egypt must remain an interested royal survival account rather than a universal invasion record');
const bronzeCollapseSnapshot = read('public/data/bronze-age/20260830-collapse1/bronze-collapse-windows.csv');
if (bronzeCollapseSnapshot !== readFileSync(path.join(root, 'public/data/bronze-collapse-windows.csv'), 'utf8')) fail('Bronze collapse immutable client snapshot diverges from the canonical dataset');

const ironAdoptionWindows = csv('public/data/iron-adoption-windows.csv');
const ironAdoptionCases = new Map();
for (const [index, row] of ironAdoptionWindows.entries()) {
  const context = `iron-adoption-windows.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'place', 'region', 'first_start', 'first_end', 'adoption_start', 'adoption_end', 'first_window', 'adoption_window', 'evidence_kind', 'prior_metal', 'resource_and_fuel', 'production_system', 'skill_and_product', 'institutional_context', 'interpretation', 'source_keys', 'limits'], context);
  numeric(row, ['first_start', 'first_end', 'adoption_start', 'adoption_end'], context);
  validateKeys(sourceKeys(row.source_keys), context);
  if (ironAdoptionCases.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`);
  ironAdoptionCases.set(row.case_id, row);
  if (Number(row.first_start) > Number(row.first_end) || Number(row.adoption_start) > Number(row.adoption_end)) fail(`${context} contains a reversed evidence window`);
  if (Object.keys(row).some(field => /adoption_score|hardness_score|superiority_score|diffusion_speed|annual_output|market_share|fuel_ratio|forest_loss|military_power|civilization_rank/i.test(field))) fail(`${context} introduces an unsupported adoption or superiority model field`);
  if (row.limits.length < 120) fail(`${context} does not preserve substantive chronology and inference limits`);
}
for (const caseId of ['anatolia-near-east', 'cyprus', 'aegean', 'central-europe', 'north-china']) if (!ironAdoptionCases.has(caseId)) fail(`Iron adoption comparison is missing ${caseId}`);
if (ironAdoptionWindows.length !== 5 || ironAdoptionCases.size !== 5) fail(`Iron adoption comparison requires five unique regional windows, found ${ironAdoptionWindows.length}`);
const anatoliaIron = ironAdoptionCases.get('anatolia-near-east');
if (!anatoliaIron || anatoliaIron.first_start !== '-2000' || anatoliaIron.adoption_start !== '-1200' || !sourceKeys(anatoliaIron.source_keys).includes('ERB_SATULLO2019') || !sourceKeys(anatoliaIron.source_keys).includes('PARE2025') || !/not a named inventor.*not annual production.*diffusion speed.*market share.*collapse caused adoption/i.test(anatoliaIron.limits)) fail('Anatolia must preserve the early-attestation and much later adoption clocks without inventor output diffusion market or collapse inference');
const cyprusIron = ironAdoptionCases.get('cyprus');
if (!cyprusIron || cyprusIron.first_start !== '-1200' || cyprusIron.adoption_end !== '-1000' || !/bronze production remains substantial/i.test(cyprusIron.production_system) || !/does not establish Cyprus as sole inventor.*bronze shortage.*adoption percentage/i.test(cyprusIron.limits)) fail('Cyprus must remain an early adopter with continuing bronze and no sole-inventor shortage or share inference');
const aegeanIron = ironAdoptionCases.get('aegean');
if (!aegeanIron || aegeanIron.first_start !== '-1200' || aegeanIron.adoption_start !== '-1100' || !sourceKeys(aegeanIron.source_keys).includes('IONIA_IRON2022') || !/not total production.*single transmission route/i.test(aegeanIron.limits)) fail('Aegean evidence must preserve its local visibility and route limits');
const centralEuropeIron = ironAdoptionCases.get('central-europe');
if (!centralEuropeIron || centralEuropeIron.first_start !== '-1000' || centralEuropeIron.adoption_start !== '-850' || !/transition horizon.*not a technological birthday/i.test(centralEuropeIron.interpretation) || !/does not measure metal supply.*prove iron caused social change/i.test(centralEuropeIron.limits)) fail('Central Europe must preserve the broad Hallstatt transition without one birthday or bronze-hoard causality');
const northChinaIron = ironAdoptionCases.get('north-china');
if (!northChinaIron || northChinaIron.first_start !== '-800' || northChinaIron.adoption_start !== '-600' || !sourceKeys(northChinaIron.source_keys).includes('QIAN_HUNG2021') || !sourceKeys(northChinaIron.source_keys).includes('WOOD2025') || !/not mass production across China.*simple one-direction diffusion/i.test(northChinaIron.limits)) fail('North China must preserve early cast-iron attestation and later utilitarian expansion without mass-production or simple-diffusion inference');
const ironAdoptionSnapshot = read('public/data/iron-age/20260830-adoption1/iron-adoption-windows.csv');
if (ironAdoptionSnapshot !== readFileSync(path.join(root, 'public/data/iron-adoption-windows.csv'), 'utf8')) fail('Iron adoption immutable client snapshot diverges from the canonical dataset');

const ironSmeltingExperiments = csv('public/data/iron-smelting-experiments.csv');
const ironExperimentRuns = new Map();
for (const [index, row] of ironSmeltingExperiments.entries()) {
  const context = `iron-smelting-experiments.csv row ${index + 2}`;
  requireFields(row, ['series', 'run', 'context', 'furnace_model', 'ore_kg', 'charcoal_kg', 'bloom_kg', 'bloom_status', 'air_and_operation', 'reported_observation', 'source_keys', 'limits'], context);
  numeric(row, ['ore_kg', 'charcoal_kg', 'bloom_kg'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (ironExperimentRuns.has(row.run)) fail(`${context} duplicates ${row.run}`); ironExperimentRuns.set(row.run, row);
  if (['ore_kg', 'charcoal_kg', 'bloom_kg'].some(field => Number(row[field]) < 0)) fail(`${context} contains a negative reported mass`);
  if (Object.keys(row).some(field => /ancient_output|woodland_(area|loss)|deforestation|annual_production|workforce|weapons|soldiers|efficiency_score|civilization_rank/i.test(field))) fail(`${context} introduces an unsupported historical projection field`);
  if (row.limits.length < 115) fail(`${context} does not preserve a substantive experimental-analogy limit`);
}
for (const run of ['MS1','MS2','MS3','MS4','XP7','XP8','XP9','XP16','XP19','XP20','XP22']) if (!ironExperimentRuns.has(run)) fail(`Iron fuel comparison is missing ${run}`);
if (ironSmeltingExperiments.length !== 11 || ironExperimentRuns.size !== 11) fail(`Iron fuel comparison requires eleven unique runs, found ${ironSmeltingExperiments.length}`);
const expectedIronMasses = new Map([['MS1',[41,105,4.325]],['MS2',[30,100,0]],['MS3',[30,86.5,1.5]],['MS4',[34,71.25,0]],['XP7',[31,21.2,2.4]],['XP8',[24,25.4,1.7]],['XP9',[24,23.5,1.7]],['XP16',[16.5,15.5,1.3]],['XP19',[14.5,15,.7]],['XP20',[12,14.5,.02]],['XP22',[23.9,30,1.85]]]);
for (const [run, values] of expectedIronMasses) {
  const row=ironExperimentRuns.get(run);
  if (!row || [row.ore_kg,row.charcoal_kg,row.bloom_kg].some((value,index)=>Number(value)!==values[index])) fail(`${run} does not preserve its published ore charcoal and bloom masses`);
}
for (const run of ['MS1','MS2','MS3','MS4']) if (!sourceKeys(ironExperimentRuns.get(run)?.source_keys ?? '').includes('HUMPHRIS_ET_AL2018')) fail(`${run} must retain the Meroe experiment source`);
for (const run of ['XP7','XP8','XP9','XP16','XP19','XP20','XP22']) if (!sourceKeys(ironExperimentRuns.get(run)?.source_keys ?? '').includes('HELMREICH_ET_AL2025')) fail(`${run} must retain the Sehnde experiment source`);
if (!/no recognizable bloom.*not that no metallic iron formed/i.test(ironExperimentRuns.get('MS2')?.limits ?? '')) fail('MS2 must preserve the no-recognizable-bloom limit');
if (!/trace output.*mathematically extreme.*rather than.*chart scale.*ancient waste/i.test(ironExperimentRuns.get('XP20')?.limits ?? '')) fail('XP20 must remain a trace output without scale or ancient-waste inference');
const ironFuelSnapshot = read('public/data/iron-age/20260830-fuel1/iron-smelting-experiments.csv');
if (ironFuelSnapshot !== readFileSync(path.join(root, 'public/data/iron-smelting-experiments.csv'), 'utf8')) fail('Iron fuel immutable client snapshot diverges from the canonical dataset');

const ironQualityExperiments = csv('public/data/iron-quality-experiments.csv');
const ironQualitySamples = new Map();
for (const [index, row] of ironQualityExperiments.entries()) {
  const context = `iron-quality-experiments.csv row ${index + 2}`;
  requireFields(row, ['run', 'stage', 'phosphorus_wt_percent', 'sulfur_wt_percent', 'hardness_hv', 'hardness_sd', 'hardness_n', 'microstructure', 'forgeability', 'source_keys', 'limits'], context);
  numeric(row, ['sulfur_wt_percent', 'hardness_hv', 'hardness_sd', 'hardness_n'], context);
  if (!/^(?:<)?\d+(?:\.\d+)?$/.test(row.phosphorus_wt_percent)) fail(`${context} has an invalid phosphorus observation ${row.phosphorus_wt_percent}`);
  validateKeys(sourceKeys(row.source_keys), context);
  const sampleKey = `${row.run}:${row.stage}`;
  if (ironQualitySamples.has(sampleKey)) fail(`${context} duplicates ${sampleKey}`); ironQualitySamples.set(sampleKey, row);
  if (!['bloom', 'bar'].includes(row.stage)) fail(`${context} has unsupported stage ${row.stage}`);
  if (Object.keys(row).some(field => /toughness|weapon_performance|lethality|battlefield|superiority_score|civilization_rank|ancient_average/i.test(field))) fail(`${context} introduces an unsupported material-performance field`);
  if (row.limits.length < 115) fail(`${context} does not preserve a substantive sampling and inference limit`);
}
const expectedIronQuality = new Map([
  ['FEXP-1:bloom',['<0.1',0.1,103,29,17]],['FEXP-1:bar',['0.2',0.1,142,5,9]],
  ['FEXP-100:bloom',['<0.1',0.4,89,3,5]],['FEXP-100:bar',['0.1',0.3,114,10,7]],
  ['FEXP-5:bloom',['0.1',0.2,84,10,5]],['FEXP-5:bar',['<0.1',0.2,102,5,5]],
  ['FEXP-6:bloom',['0.2',1.2,139,13,17]],['FEXP-6:bar',['0.1',0.6,113,4,5]],
]);
for (const [sampleKey, values] of expectedIronQuality) {
  const row = ironQualitySamples.get(sampleKey);
  if (!row || row.phosphorus_wt_percent !== values[0] || [row.sulfur_wt_percent,row.hardness_hv,row.hardness_sd,row.hardness_n].some((value,index)=>Number(value)!==values[index+1])) fail(`${sampleKey} does not preserve the published chemistry hardness and sampling values`);
}
if (ironQualityExperiments.length !== 8 || ironQualitySamples.size !== 8) fail(`Iron quality comparison requires eight unique samples, found ${ironQualityExperiments.length}`);
for (const sampleKey of expectedIronQuality.keys()) if (!ironQualitySamples.has(sampleKey)) fail(`Iron quality comparison is missing ${sampleKey}`);
const hardBloom = ironQualitySamples.get('FEXP-6:bloom');
if (!hardBloom || hardBloom.forgeability !== 'brittle and difficult' || !/higher hardness.*phosphorus rather than carbon steel/i.test(hardBloom.microstructure) || !/hardness is not toughness quality or technological superiority/i.test(hardBloom.limits)) fail('FEXP-6 must preserve the hardest-bloom counterexample without a steel toughness or superiority inference');
const workableBloom = ironQualitySamples.get('FEXP-5:bloom');
if (!workableBloom || workableBloom.forgeability !== 'better workability' || Number(workableBloom.hardness_hv) !== 84 || !/not evidence that softer iron is universally better/i.test(workableBloom.limits)) fail('FEXP-5 must preserve its lower hardness and better workability without a reverse superiority claim');
const ironQualitySnapshot = read('public/data/iron-age/20260830-quality1/iron-quality-experiments.csv');
if (ironQualitySnapshot !== readFileSync(path.join(root, 'public/data/iron-quality-experiments.csv'), 'utf8')) fail('Iron quality immutable client snapshot diverges from the canonical dataset');

const ironMobilizationCases = csv('public/data/iron-mobilization-cases.csv');
const ironMobilizationIndex = new Map();
for (const [index, row] of ironMobilizationCases.entries()) {
  const context = `iron-mobilization-cases.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'sort_order', 'polity', 'start_year', 'end_year', 'date_label', 'metal_context', 'scale_label', 'scale_scope', 'evidence_status', 'recruitment_system', 'equipment_system', 'supply_system', 'replacement_system', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['sort_order', 'start_year', 'end_year'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (row.scale_value !== '') numeric(row, ['scale_value'], context);
  if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  if (!['documented_structure_plus_modern_inference', 'qualitative_social_and_archaeological_synthesis', 'modern_strategic_deployment_model'].includes(row.evidence_status)) fail(`${context} has unsupported evidence status ${row.evidence_status}`);
  if (ironMobilizationIndex.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); ironMobilizationIndex.set(row.case_id, row);
  if (Object.keys(row).some(field => /iron_kg|kg_per_soldier|army_size_from_artifacts|artifact_headcount|battlefield_power|military_power_score|causal_score|replacement_curve/i.test(field))) fail(`${context} introduces a prohibited mobilization field`);
  if (row.limits.length < 190) fail(`${context} does not preserve a substantive comparability and inference limit`);
}
if (ironMobilizationCases.length !== 4 || ironMobilizationIndex.size !== 4) fail(`Iron mobilization ledger requires four unique cases, found ${ironMobilizationCases.length}`);
for (const id of ['egypt_kadesh', 'pre_roman_civitates', 'carthage_215', 'rome_212']) if (!ironMobilizationIndex.has(id)) fail(`Iron mobilization ledger is missing ${id}`);
const kadeshMobilization = ironMobilizationIndex.get('egypt_kadesh');
if (!kadeshMobilization || Number(kadeshMobilization.scale_value) !== 20000 || kadeshMobilization.evidence_status !== 'documented_structure_plus_modern_inference' || !sourceKeys(kadeshMobilization.source_keys).includes('WERNICK2014_KADESH_LOGISTICS') || !/not directly stated.*inference/i.test(kadeshMobilization.limits)) fail('Kadesh must preserve four-division structure and an explicitly inferred approximately 20000 campaign total');
const civitasMobilization = ironMobilizationIndex.get('pre_roman_civitates');
if (!civitasMobilization || civitasMobilization.scale_value !== '' || civitasMobilization.scale_label !== 'No compatible headcount' || civitasMobilization.evidence_status !== 'qualitative_social_and_archaeological_synthesis' || !sourceKeys(civitasMobilization.source_keys).includes('ACOU_TRIBAL') || !/do not reveal an army total/i.test(civitasMobilization.limits)) fail('Pre-Roman civitates must remain a qualitative synthesis without a headcount');
const carthageMobilization = ironMobilizationIndex.get('carthage_215');
if (!carthageMobilization || Number(carthageMobilization.scale_value) !== 170000 || Number(carthageMobilization.start_year) !== -215 || carthageMobilization.evidence_status !== 'modern_strategic_deployment_model' || !sourceKeys(carthageMobilization.source_keys).includes('TAYLOR2020_SOLDIERS_SILVER')) fail('Carthage must preserve Taylor\'s approximately 170000 strategic deployment model for 215 BCE');
const romeMobilization = ironMobilizationIndex.get('rome_212');
if (!romeMobilization || Number(romeMobilization.scale_value) !== 185000 || Number(romeMobilization.start_year) !== -212 || romeMobilization.evidence_status !== 'modern_strategic_deployment_model' || !sourceKeys(romeMobilization.source_keys).includes('TAYLOR2020_SOLDIERS_SILVER') || !/15,000 difference.*not.*precision claim/i.test(romeMobilization.limits)) fail('Rome must preserve Taylor\'s approximately 185000 model without a precision-margin claim');
if (ironMobilizationCases.filter(row => row.evidence_status === 'modern_strategic_deployment_model').map(row => row.case_id).sort().join('|') !== 'carthage_215|rome_212') fail('Only Carthage and Rome may be treated as like-with-like strategic deployment models');
const ironMobilizationSnapshot = read('public/data/iron-age/20260830-mobilization1/iron-mobilization-cases.csv');
if (ironMobilizationSnapshot !== readFileSync(path.join(root, 'public/data/iron-mobilization-cases.csv'), 'utf8')) fail('Iron mobilization immutable client snapshot diverges from the canonical dataset');

const ironInstitutionSnapshot = read('public/data/iron-age/20260830-institutions1/iron-production-institutions.csv');
const ironInstitutionCases = csv('public/data/iron-production-institutions.csv');
if (ironInstitutionSnapshot !== readFileSync(path.join(root, 'public/data/iron-production-institutions.csv'), 'utf8')) fail('Iron institution immutable client snapshot diverges from the canonical dataset');
const ironInstitutionIndex = new Map();
const allowedInstitutionEvidence = new Set(['archaeological_complex_plus_administrative_record', 'archaeometallurgical_and_spatial_synthesis', 'regional_settlement_and_exchange_synthesis', 'textual_institution_plus_preliminary_archaeometallurgy', 'radiocarbon_chronology_plus_spatial_archaeology']);
for (const [index, row] of ironInstitutionCases.entries()) {
  const context = `iron-production-institutions.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'sort_order', 'system', 'date_label', 'start_year', 'end_year', 'region', 'architecture', 'inputs', 'making', 'coordination', 'distribution', 'visible_anchor', 'evidence_class', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['sort_order', 'start_year', 'end_year'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  if (!allowedInstitutionEvidence.has(row.evidence_class)) fail(`${context} has unsupported evidence class ${row.evidence_class}`);
  if (ironInstitutionIndex.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); ironInstitutionIndex.set(row.case_id, row);
  if (row.limits.length < 170) fail(`${context} does not preserve a substantive institutional inference limit`);
  if (Object.keys(row).some(field => /output_(kg|ton)|productivity|centralization_score|market_integration_score|state_capacity_score|institution_rank|development_stage|labor_total/i.test(field))) fail(`${context} introduces a prohibited shared-scale field`);
}
if (ironInstitutionCases.length !== 5 || ironInstitutionIndex.size !== 5) fail(`Iron production institutions require five unique cases, found ${ironInstitutionCases.length}`);
for (const id of ['assyria_arsenal', 'fennoscandia_network', 'bohemia_distribution', 'han_frontier', 'meroe_landscape']) if (!ironInstitutionIndex.has(id)) fail(`Iron production institutions are missing ${id}`);
const assyriaInstitution = ironInstitutionIndex.get('assyria_arsenal');
if (!assyriaInstitution || !/36,242 bows/i.test(assyriaInstitution.visible_anchor) || !sourceKeys(assyriaInstitution.source_keys).includes('ORACC_FORT_SHALMANESER') || !/bow docket is not iron output/i.test(assyriaInstitution.limits)) fail('Assyrian arsenal must preserve the 36242-bow administrative anchor without converting it to iron output');
const fennoscandiaInstitution = ironInstitutionIndex.get('fennoscandia_network');
if (!fennoscandiaInstitution || !/under 500 m/i.test(fennoscandiaInstitution.visible_anchor) || !/at least three smithing hearths/i.test(fennoscandiaInstitution.visible_anchor) || !sourceKeys(fennoscandiaInstitution.source_keys).includes('BENNERHAG_ET_AL2021') || !/published inference/i.test(fennoscandiaInstitution.limits)) fail('Fennoscandian case must preserve its spatial and interpretive bounds');
const bohemiaInstitution = ironInstitutionIndex.get('bohemia_distribution');
if (!bohemiaInstitution || bohemiaInstitution.architecture !== 'distribution-centred oppida' || !sourceKeys(bohemiaInstitution.source_keys).includes('SALAC1993_BOHEMIA') || !/interpretive regional model/i.test(bohemiaInstitution.limits)) fail('Bohemian case must remain a distribution-centred regional interpretation');
const hanInstitution = ironInstitutionIndex.get('han_frontier');
if (!hanInstitution || Number(hanInstitution.start_year) !== -119 || !/no tieguan/i.test(hanInstitution.visible_anchor) || !sourceKeys(hanInstitution.source_keys).includes('ZHANG_ET_AL2020_LINGNAN') || !/preliminary analyses/i.test(hanInstitution.limits)) fail('Han frontier case must preserve the 119 BCE policy date the Lingnan iron-office gap and preliminary evidence status');
const meroeInstitution = ironInstitutionIndex.get('meroe_landscape');
if (!meroeInstitution || !/97 radiocarbon dates from nine slag mounds/i.test(meroeInstitution.visible_anchor) || !/more than one thousand years/i.test(meroeInstitution.visible_anchor) || !sourceKeys(meroeInstitution.source_keys).includes('HUMPHRIS_SCHEIBNER2017') || !/slag volume is not metal output/i.test(meroeInstitution.limits)) fail('Meroe must preserve the 97-date nine-mound chronology without an output or royal-control inference');

const persianRoadSegments = csv('public/data/persian-royal-road-segments.csv');
const persianRoadIndex = new Map();
for (const [index, row] of persianRoadSegments.entries()) {
  const context = `persian-royal-road-segments.csv row ${index + 2}`;
  requireFields(row, ['segment_id', 'sort_order', 'region', 'start_label', 'end_label', 'stages', 'parasangs', 'terrain_and_control', 'source_keys', 'limits'], context);
  numeric(row, ['sort_order', 'stages', 'parasangs'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (persianRoadIndex.has(row.segment_id)) fail(`${context} duplicates ${row.segment_id}`); persianRoadIndex.set(row.segment_id, row);
  if (Object.keys(row).some(field => /kilomet|latitude|longitude|traffic|speed_score|station_spacing|route_geometry/i.test(field))) fail(`${context} introduces a prohibited route reconstruction field`);
}
const expectedPersianSegments = new Map([
  ['lydia_phrygia',[20,94.5]],['cappadocia',[28,104]],['cilicia',[3,15.5]],['armenia',[15,56.5]],['matiene',[34,137]],['cissia',[11,42.5]],
]);
if (persianRoadSegments.length !== 6 || persianRoadIndex.size !== 6) fail(`Persian itinerary requires six unique segments, found ${persianRoadSegments.length}`);
for (const [id,[stages,parasangs]] of expectedPersianSegments) { const row=persianRoadIndex.get(id); if (!row || Number(row.stages)!==stages || Number(row.parasangs)!==parasangs || row.source_keys!=='HERODOTUS_5_52_54') fail(`${id} does not preserve Herodotus's stage and parasang values`); }
if (persianRoadSegments.reduce((sum,row)=>sum+Number(row.stages),0)!==111 || persianRoadSegments.reduce((sum,row)=>sum+Number(row.parasangs),0)!==450) fail('Persian itinerary must total 111 stages and 450 parasangs');
const persianRoadSnapshot = read('public/data/persia/20260830-roads1/persian-royal-road-segments.csv');
if (persianRoadSnapshot !== readFileSync(path.join(root, 'public/data/persian-royal-road-segments.csv'), 'utf8')) fail('Persian road immutable snapshot diverges from the canonical dataset');

const persianRoadEvidence = csv('public/data/persian-road-evidence.csv');
const persianEvidenceIndex = new Map();
for (const [index, row] of persianRoadEvidence.entries()) {
  const context = `persian-road-evidence.csv row ${index + 2}`;
  requireFields(row, ['evidence_id', 'sort_order', 'evidence_class', 'date_label', 'title', 'anchor_unit', 'observation', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['sort_order'], context); if (row.anchor_value !== '') numeric(row, ['anchor_value'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (persianEvidenceIndex.has(row.evidence_id)) fail(`${context} duplicates ${row.evidence_id}`); persianEvidenceIndex.set(row.evidence_id, row);
  if (Object.keys(row).some(field => /kilomet|courier_days|traffic|speed_score|postal_census|route_geometry/i.test(field))) fail(`${context} introduces a prohibited derived field`);
}
if (persianRoadEvidence.length !== 4 || persianEvidenceIndex.size !== 4) fail(`Persian road comparison requires four evidence lenses, found ${persianRoadEvidence.length}`);
const itineraryEvidence=persianEvidenceIndex.get('herodotus_itinerary');
if (!itineraryEvidence || Number(itineraryEvidence.anchor_value)!==111 || itineraryEvidence.anchor_unit!=='stations' || !/450 parasangs/i.test(itineraryEvidence.observation)) fail('Persian itinerary lens must preserve 111 stages and 450 parasangs');
const ordinaryJourney=persianEvidenceIndex.get('ordinary_journey');
if (!ordinaryJourney || Number(ordinaryJourney.anchor_value)!==90 || ordinaryJourney.anchor_unit!=='days' || !/not a measured average/i.test(ordinaryJourney.limits)) fail('Persian traveler clock must preserve Herodotus\'s ninety-day arithmetic without treating it as a measured mean');
const courierRelay=persianEvidenceIndex.get('courier_relay');
if (!courierRelay || courierRelay.anchor_value!=='' || courierRelay.anchor_unit!=='no end-to-end time stated' || !sourceKeys(courierRelay.source_keys).includes('HERODOTUS_8_98') || !/seven-day claims.*not plotted/i.test(courierRelay.limits)) fail('Persian relay lens must retain unknown end-to-end duration and exclude later seven-day claims');
const fortificationArchive=persianEvidenceIndex.get('fortification_archive');
if (!fortificationArchive || !sourceKeys(fortificationArchive.source_keys).includes('HALLOCK1969_PFT') || !sourceKeys(fortificationArchive.source_keys).includes('DANDAMAYEV2002_PFT') || !/regional fragment.*not a complete empire-wide postal ledger/i.test(fortificationArchive.limits)) fail('Persepolis archive must remain a regional administrative window rather than a postal census');
const persianEvidenceSnapshot = read('public/data/persia/20260830-roads1/persian-road-evidence.csv');
if (persianEvidenceSnapshot !== readFileSync(path.join(root, 'public/data/persian-road-evidence.csv'), 'utf8')) fail('Persian evidence immutable snapshot diverges from the canonical dataset');

const persianSatrapyCases = csv('public/data/persian-satrapal-portfolios.csv');
const persianSatrapyIndex = new Map();
for (const [index, row] of persianSatrapyCases.entries()) {
  const context = `persian-satrapal-portfolios.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'sort_order', 'case_name', 'date_label', 'start_year', 'end_year', 'region', 'top_office', 'local_partners', 'obligation_or_problem', 'royal_connection', 'visible_action', 'evidence_class', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['sort_order', 'start_year', 'end_year'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (Number(row.start_year) > Number(row.end_year)) fail(`${context} starts after it ends`);
  if (persianSatrapyIndex.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); persianSatrapyIndex.set(row.case_id, row);
  if (row.limits.length < 150) fail(`${context} needs a substantive inference limit`);
  if (Object.keys(row).some(field => /autonomy_score|centralization_score|tax_rate|uniformity_score|province_rank|royal_control_score|population|revenue_total|loyalty_score/i.test(field))) fail(`${context} introduces a prohibited shared-scale field`);
}
if (persianSatrapyCases.length !== 5 || persianSatrapyIndex.size !== 5) fail(`Persian satrapy comparison requires five unique cases, found ${persianSatrapyCases.length}`);
for (const id of ['bactria_margiana_crisis', 'ionia_land_tribute', 'egypt_arsames', 'caria_hecatomnids', 'dascylium_estate']) if (!persianSatrapyIndex.has(id)) fail(`Persian satrapy comparison is missing ${id}`);
const bactriaSatrapy=persianSatrapyIndex.get('bactria_margiana_crisis');
if (!bactriaSatrapy || !/Dādarši/i.test(bactriaSatrapy.top_office) || !/satrap in Bactria/i.test(bactriaSatrapy.top_office) || !/direct order/i.test(bactriaSatrapy.royal_connection) || !/political self-presentation/i.test(bactriaSatrapy.limits)) fail('Bactria must preserve Darius\'s direct-order claim and the royal-inscription limit');
const ioniaSatrapy=persianSatrapyIndex.get('ionia_land_tribute');
if (!ioniaSatrapy || !/envoys.*cities/i.test(ioniaSatrapy.local_partners) || !/reciprocal agreements/i.test(ioniaSatrapy.visible_action) || !/measured in parasangs/i.test(ioniaSatrapy.visible_action) || !/every satrapy.*same procedure/i.test(ioniaSatrapy.limits)) fail('Ionia must preserve city negotiation land measurement tribute and its non-universal limit');
const egyptSatrapy=persianSatrapyIndex.get('egypt_arsames');
if (!egyptSatrapy || !/retained Egyptian districts/i.test(egyptSatrapy.local_partners) || !/indigenous fiscal officials/i.test(egyptSatrapy.local_partners) || !/sealed Aramaic orders/i.test(egyptSatrapy.royal_connection) || !/estates.*particular archives/i.test(egyptSatrapy.limits)) fail('Egypt must preserve retained local administration sealed orders and archive limits');
const cariaSatrapy=persianSatrapyIndex.get('caria_hecatomnids');
if (!cariaSatrapy || !/local Carian dynasty/i.test(cariaSatrapy.top_office) || !/administrators, fleet.*coinage/i.test(cariaSatrapy.visible_action) || !/not evidence of independence/i.test(cariaSatrapy.limits)) fail('Caria must preserve the local dynasty portfolio without inferring independence');
const dascyliumSatrapy=persianSatrapyIndex.get('dascylium_estate');
if (!dascyliumSatrapy || !/Achaemenid family/i.test(dascyliumSatrapy.top_office) || !/indigenous tribal leaders/i.test(dascyliumSatrapy.local_partners) || !/administrative hierarchy is difficult to reconstruct/i.test(dascyliumSatrapy.limits)) fail('Dascylium must preserve the household network and uncertain hierarchy');
const persianSatrapySnapshot = read('public/data/persia/20260830-satrapies1/persian-satrapal-portfolios.csv');
if (persianSatrapySnapshot !== readFileSync(path.join(root, 'public/data/persian-satrapal-portfolios.csv'), 'utf8')) fail('Persian satrapy immutable snapshot diverges from the canonical dataset');

const persianTributeDistricts = csv('public/data/persian-tribute-districts.csv');
const persianTributeIndex = new Map();
for (const [index, row] of persianTributeDistricts.entries()) {
  const context = `persian-tribute-districts.csv row ${index + 2}`;
  requireFields(row, ['district_id', 'sort_order', 'district_label', 'peoples', 'material', 'reported_amount', 'reported_unit', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['sort_order', 'reported_amount'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (persianTributeIndex.has(row.district_id)) fail(`${context} duplicates ${row.district_id}`); persianTributeIndex.set(row.district_id, row);
  if (!['silver', 'gold_dust'].includes(row.material)) fail(`${context} has unsupported material ${row.material}`);
  if (Object.keys(row).some(field => /tax_rate|per_capita|population|modern_currency|kilograms|revenue_share|district_rank|wealth_score|burden_score/i.test(field))) fail(`${context} introduces a prohibited common-denominator field`);
}
if (persianTributeDistricts.length !== 20 || persianTributeIndex.size !== 20) fail(`Persian tribute schedule requires twenty unique districts, found ${persianTributeDistricts.length}`);
const persianSilverDistricts = persianTributeDistricts.filter(row=>row.material==='silver');
if (persianSilverDistricts.length !== 19 || persianSilverDistricts.reduce((sum,row)=>sum+Number(row.reported_amount),0)!==7740) fail('Herodotean district schedule must preserve nineteen silver rows totaling 7740 Babylonian talents');
const expectedTributeAmounts = [400,500,360,500,350,700,170,300,1000,450,200,360,400,600,250,300,400,200,300,360];
for (const [index, amount] of expectedTributeAmounts.entries()) { const row=persianTributeIndex.get(`district_${String(index+1).padStart(2,'0')}`); if (!row || Number(row.reported_amount)!==amount) fail(`Persian tribute district ${index+1} does not preserve the reported amount`); }
const ciliciaTribute=persianTributeIndex.get('district_04');
if (!ciliciaTribute || !/360 white horses/i.test(ciliciaTribute.additional_obligation) || !/140 talents.*local cavalry guard.*360.*Darius/i.test(ciliciaTribute.additional_obligation)) fail('Cilicia must preserve horses and the 140/360 silver allocation');
const indiaTribute=persianTributeIndex.get('district_20');
if (!indiaTribute || indiaTribute.material!=='gold_dust' || indiaTribute.reported_unit!=='Euboic talents' || Number(indiaTribute.reported_amount)!==360 || !/outside the silver bar scale/i.test(indiaTribute.interpretation)) fail('India must remain a separate gold-dust unit outside the silver scale');
const persianTributeSnapshot = read('public/data/persia/20260830-tribute1/persian-tribute-districts.csv');
if (persianTributeSnapshot !== readFileSync(path.join(root, 'public/data/persian-tribute-districts.csv'), 'utf8')) fail('Persian tribute immutable snapshot diverges from the canonical dataset');

const persianObligationPortfolios = csv('public/data/persian-obligation-portfolios.csv');
const persianObligationIndex = new Map();
for (const [index, row] of persianObligationPortfolios.entries()) {
  const context = `persian-obligation-portfolios.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'sort_order', 'title', 'date_label', 'evidence_class', 'reported_obligation', 'political_logic', 'interpretation', 'limits', 'source_keys'], context);
  numeric(row, ['sort_order'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (persianObligationIndex.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); persianObligationIndex.set(row.case_id, row);
  if (Object.keys(row).some(field => /score|tax_rate|modern_value|effective_burden|revenue_total/i.test(field))) fail(`${context} introduces a prohibited synthetic field`);
}
for (const id of ['silver_schedule','cilicia_mixed','egypt_provisions','india_gold','babylonia_documents','frontier_gifts','apadana_image']) if (!persianObligationIndex.has(id)) fail(`Persian obligation comparison is missing ${id}`);
if (persianObligationPortfolios.length!==7 || persianObligationIndex.size!==7) fail(`Persian obligation comparison requires seven unique windows, found ${persianObligationPortfolios.length}`);
const babylonianObligations=persianObligationIndex.get('babylonia_documents');
if (!babylonianObligations || !/silver; barley; flour; small livestock; beer/i.test(babylonianObligations.reported_obligation) || !/regional and uneven/i.test(babylonianObligations.limits)) fail('Babylonian documentary window must preserve varied tax bases and regional limits');
const frontierGifts=persianObligationIndex.get('frontier_gifts');
if (!frontierGifts || !/every third year.*every fifth year.*annually/i.test(frontierGifts.reported_obligation)) fail('Frontier gifts must preserve three different cadences');
const apadanaImage=persianObligationIndex.get('apadana_image');
if (!apadanaImage || !/23 delegations/i.test(apadanaImage.reported_obligation) || !/not an annual fiscal ledger/i.test(apadanaImage.limits)) fail('Apadana must preserve twenty-three delegations without becoming a fiscal ledger');
const persianObligationSnapshot = read('public/data/persia/20260830-tribute1/persian-obligation-portfolios.csv');
if (persianObligationSnapshot !== readFileSync(path.join(root, 'public/data/persian-obligation-portfolios.csv'), 'utf8')) fail('Persian obligation immutable snapshot diverges from the canonical dataset');

const persianCoalitionWindows = csv('public/data/persian-coalition-windows.csv');
const persianCoalitionIndex = new Map();
for (const [index, row] of persianCoalitionWindows.entries()) {
  const context = `persian-coalition-windows.csv row ${index + 2}`;
  requireFields(row, ['case_id', 'sort_order', 'title', 'date_label', 'source_class', 'contributors', 'command_link', 'battlefield_function', 'supply_support', 'coordination_test', 'reported_anchor', 'source_keys', 'interpretation', 'limits'], context);
  numeric(row, ['sort_order'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (persianCoalitionIndex.has(row.case_id)) fail(`${context} duplicates ${row.case_id}`); persianCoalitionIndex.set(row.case_id, row);
  if (Object.keys(row).some(field => /army_total|accepted_total|combat_power|ethnic_share|equipment_score|discipline_rank|effectiveness_rank|soldier_count/i.test(field))) fail(`${context} introduces a prohibited synthetic force field`);
}
for (const id of ['doriscus_catalogue','xerxes_depots','imperial_fleet','cunaxa','gaugamela','persepolis_substrate']) if (!persianCoalitionIndex.has(id)) fail(`Persian coalition comparison is missing ${id}`);
if (persianCoalitionWindows.length!==6 || persianCoalitionIndex.size!==6) fail(`Persian coalition comparison requires six unique windows, found ${persianCoalitionWindows.length}`);
const doriscusCoalition=persianCoalitionIndex.get('doriscus_catalogue');
if (!doriscusCoalition || !/61 people-labels.*46 infantry.*8 cavalry.*12 naval/i.test(doriscusCoalition.reported_anchor) || !/not headcounts shares/i.test(doriscusCoalition.limits)) fail('Doriscus must retain the overlapping editorial catalogue count without converting it into headcounts or shares');
const depotsCoalition=persianCoalitionIndex.get('xerxes_depots');
if (!depotsCoalition || !/Leuce Acte.*Tyrodiza.*Doriscus.*Eion on the Strymon.*Macedonia/i.test(depotsCoalition.supply_support) || !/^5 named grain-depot zones/i.test(depotsCoalition.reported_anchor)) fail('Xerxes logistics window must preserve all five named depot zones');
const fleetCoalition=persianCoalitionIndex.get('imperial_fleet');
if (!fleetCoalition || !/12 naval peoples/i.test(fleetCoalition.reported_anchor) || !/ship totals.*not converted into fleet size/i.test(fleetCoalition.limits)) fail('Imperial fleet window must preserve twelve catalogue labels without accepting a ship total');
const cunaxaCoalition=persianCoalitionIndex.get('cunaxa');
if (!cunaxaCoalition || !/interpreter/i.test(cunaxaCoalition.command_link) || !/400 provision wagons/i.test(cunaxaCoalition.reported_anchor) || !/no total army figure/i.test(cunaxaCoalition.reported_anchor)) fail('Cunaxa must preserve the interpreter and four hundred reported wagons without an army total');
const gaugamelaCoalition=persianCoalitionIndex.get('gaugamela');
if (!gaugamelaCoalition || !/Bessus held the left.*Mazaeus the right.*Darius the royal center/i.test(gaugamelaCoalition.command_link) || !/captured written scheme/i.test(gaugamelaCoalition.coordination_test) || !/later Greek narrative/i.test(gaugamelaCoalition.limits)) fail('Gaugamela must preserve the three command zones and later-source limit');
const persepolisCoalition=persianCoalitionIndex.get('persepolis_substrate');
if (!persepolisCoalition || !/not an army supply ledger or empire-wide logistics census/i.test(persepolisCoalition.limits)) fail('Persepolis must remain a regional administrative archive rather than an army-wide logistics census');
const persianCoalitionSnapshot = read('public/data/persia/20260830-coalition1/persian-coalition-windows.csv');
if (persianCoalitionSnapshot !== readFileSync(path.join(root, 'public/data/persian-coalition-windows.csv'), 'utf8')) fail('Persian coalition immutable snapshot diverges from the canonical dataset');

const persianAfterlifeEpisodes = csv('public/data/persian-institutional-afterlives.csv');
const persianAfterlifeIndex = new Map();
const persianAfterlifeThreads = new Map();
for (const [index, row] of persianAfterlifeEpisodes.entries()) {
  const context = `persian-institutional-afterlives.csv row ${index + 2}`;
  requireFields(row, ['thread_id', 'thread_order', 'thread_title', 'episode_id', 'episode_order', 'start_year', 'end_year', 'date_label', 'regime', 'relationship', 'observed_change', 'evidence', 'source_keys', 'limits'], context);
  numeric(row, ['thread_order', 'episode_order', 'start_year', 'end_year'], context); validateKeys(sourceKeys(row.source_keys), context);
  if (Number(row.start_year)>Number(row.end_year) || Number(row.start_year)<-550 || Number(row.end_year)>651) fail(`${context} has an invalid bounded date window`);
  if (persianAfterlifeIndex.has(row.episode_id)) fail(`${context} duplicates ${row.episode_id}`); persianAfterlifeIndex.set(row.episode_id, row);
  persianAfterlifeThreads.set(row.thread_id,(persianAfterlifeThreads.get(row.thread_id)??0)+1);
  if (!['baseline','retained','reallocated','adapted','experiment','stopped','descended','transformed','recombined','gap','revived','redesigned'].includes(row.relationship)) fail(`${context} has unsupported relationship ${row.relationship}`);
  if (Object.keys(row).some(field => /continuity_score|influence_score|centralization_score|persianization_score|state_capacity|institutional_strength|importance_rank/i.test(field))) fail(`${context} introduces a prohibited synthetic afterlife field`);
}
if (persianAfterlifeEpisodes.length!==18 || persianAfterlifeIndex.size!==18 || persianAfterlifeThreads.size!==5) fail(`Persian afterlives require eighteen unique episodes across five pathways, found ${persianAfterlifeEpisodes.length} episodes and ${persianAfterlifeThreads.size} pathways`);
for (const [id,count] of [['provinces',4],['army',3],['scripts',4],['persis',3],['kingship',4]]) if (persianAfterlifeThreads.get(id)!==count) fail(`Persian afterlife pathway ${id} requires ${count} windows`);
const alexanderRestaffing=persianAfterlifeIndex.get('alexander_restaffing');
if (!alexanderRestaffing || alexanderRestaffing.relationship!=='retained' || !/did not preserve Achaemenid sovereignty/i.test(alexanderRestaffing.limits)) fail('Alexander restaffing must distinguish retained machinery from Achaemenid sovereignty');
const babylonPartition=persianAfterlifeIndex.get('babylon_partition');
if (!babylonPartition || babylonPartition.relationship!=='reallocated' || !/remaining Asian satrapies were not disturbed/i.test(babylonPartition.evidence)) fail('Babylon partition must preserve Diodorus\'s retained-ruler evidence');
const armyExperiment=persianAfterlifeIndex.get('alexander_integration');
if (!armyExperiment || armyExperiment.relationship!=='experiment' || Number(armyExperiment.end_year)!==-323 || !/not proof of a stable fusion policy/i.test(armyExperiment.limits)) fail('Alexander army integration must remain a bounded contested experiment');
const scriptLine=persianAfterlifeIndex.get('middle_iranian_scripts');
if (!scriptLine || scriptLine.relationship!=='descended' || !/Middle Persian, Parthian, Sogdian, and Chorasmian/i.test(scriptLine.observed_change) || !/not one standardized script/i.test(scriptLine.limits)) fail('Middle Iranian script line must preserve four divergent traditions');
const frataraka=persianAfterlifeIndex.get('seleucid_frataraka');
if (!frataraka || frataraka.relationship!=='recombined' || !/probably began as Seleucid representatives/i.test(frataraka.observed_change) || !/status are debated/i.test(frataraka.limits)) fail('Frataraka pathway must preserve debated Seleucid status and recombination');
const titleGap=persianAfterlifeIndex.get('hellenistic_gap');
if (!titleGap || titleGap.relationship!=='gap' || !/warning against direct inheritance/i.test(titleGap.limits)) fail('King of Kings pathway must include an explicit Hellenistic continuity gap');
const sasanianRedesign=persianAfterlifeIndex.get('sasanian_redesign');
if (!sasanianRedesign || sasanianRedesign.relationship!=='redesigned' || !/Iran and non-Iran/i.test(sasanianRedesign.observed_change) || !/shared wording does not prove an unchanged institution/i.test(sasanianRedesign.limits)) fail('Sasanian title must remain a redesign rather than unchanged inheritance');
const persianAfterlifeSnapshot = read('public/data/persia/20260830-afterlives1/persian-institutional-afterlives.csv');
if (persianAfterlifeSnapshot !== readFileSync(path.join(root, 'public/data/persian-institutional-afterlives.csv'), 'utf8')) fail('Persian afterlife immutable snapshot diverges from the canonical dataset');

const qinMobilizingRows = csv('public/data/qin-mobilizing-system.csv');
const qinMobilizingIndex = new Map();
for (const [index,row] of qinMobilizingRows.entries()) {
  const context=`qin-mobilizing-system.csv row ${index+2}`;
  requireFields(row,['record_id','sort_order','kind','system_role','start_year','end_year','date_label','title','evidence_class','observed_evidence','source_keys','interpretation','limits'],context);
  numeric(row,['sort_order','start_year','end_year'],context); validateKeys(sourceKeys(row.source_keys),context);
  if(!['system','conquest'].includes(row.kind)) fail(`${context} has unsupported kind ${row.kind}`);
  if(Number(row.start_year)>Number(row.end_year)) fail(`${context} starts after it ends`);
  if(qinMobilizingIndex.has(row.record_id)) fail(`${context} duplicates ${row.record_id}`); qinMobilizingIndex.set(row.record_id,row);
  if(Object.keys(row).some(field=>/army_total|casualt|population|territory|combat_power|state_capacity|score/i.test(field))) fail(`${context} introduces a prohibited synthetic field`);
}
const qinSystemRows=qinMobilizingRows.filter(row=>row.kind==='system');
const qinConquestRows=qinMobilizingRows.filter(row=>row.kind==='conquest');
if(qinMobilizingRows.length!==11||qinSystemRows.length!==5||qinConquestRows.length!==6) fail(`Qin mobilization requires eleven rows: five capacities and six conquests; found ${qinMobilizingRows.length}, ${qinSystemRows.length}, and ${qinConquestRows.length}`);
for(const [id,year] of [['conquest_han',-230],['conquest_zhao',-228],['conquest_wei',-225],['conquest_chu',-223],['conquest_yan',-222],['conquest_qi',-221]]) if(Number(qinMobilizingIndex.get(id)?.start_year)!==year) fail(`Qin conquest ${id} must preserve political endpoint ${year}`);
for(const id of ['interstate_pressure','registered_households','ranked_service','county_accounts','assigned_transfer']) if(!qinMobilizingIndex.has(id)) fail(`Qin mobilization is missing capacity ${id}`);
if(!/Dai survived until 222 BCE/i.test(qinMobilizingIndex.get('conquest_zhao')?.limits??'')) fail('Zhao endpoint must preserve Dai survival to 222 BCE');
if(!/layered fourth–third-century policy text/i.test(qinMobilizingIndex.get('ranked_service')?.limits??'')) fail('Ranked service must preserve the layered-text caveat');
if(!/better documented than its rivals/i.test(qinMobilizingIndex.get('interstate_pressure')?.limits??'')) fail('Interstate competition must preserve Qin documentation bias');
if(!/households.*conscript labor.*equipment.*taxes.*debts.*embankments.*boundary markers.*boats.*tools.*fines/i.test(qinMobilizingIndex.get('county_accounts')?.observed_evidence??'')) fail('Liye row must preserve the bounded county register categories');
if(!/224–223 BCE.*220 BCE/i.test(qinMobilizingIndex.get('assigned_transfer')?.observed_evidence??'')) fail('Assigned transfer must preserve both dated documentary windows');
const qinMobilizingSnapshot=read('public/data/qin-han/20260830-mobilization1/qin-mobilizing-system.csv');
if(qinMobilizingSnapshot!==readFileSync(path.join(root,'public/data/qin-mobilizing-system.csv'),'utf8')) fail('Qin mobilization immutable snapshot diverges from the canonical dataset');

const qinStandardRows=csv('public/data/qin-standardization-practice.csv');
const qinStandardIndex=new Map();
for(const [index,row] of qinStandardRows.entries()){
  const context=`qin-standardization-practice.csv row ${index+2}`;
  requireFields(row,['record_id','sort_order','channel','date_label','standard_or_claim','observed_practice','sample_label','result_label','source_keys','interpretation','limits'],context);
  numeric(row,['sort_order'],context); validateKeys(sourceKeys(row.source_keys),context);
  if(Boolean(row.conforming_count)!==Boolean(row.sample_count)) fail(`${context} has an incomplete bounded count`);
  if(row.sample_count){numeric(row,['conforming_count','sample_count'],context);if(Number(row.conforming_count)<0||Number(row.conforming_count)>Number(row.sample_count))fail(`${context} has an invalid bounded count`);}
  if(qinStandardIndex.has(row.record_id))fail(`${context} duplicates ${row.record_id}`);qinStandardIndex.set(row.record_id,row);
  if(Object.keys(row).some(field=>/empire.*compliance|literacy|efficiency|loyalty|state_capacity|uniformity_score|conversion_rate/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(qinStandardRows.length!==6||qinStandardIndex.size!==6||qinStandardRows.filter(row=>row.sample_count).length!==4)fail(`Qin standardization requires six unique windows and four bounded samples; found ${qinStandardRows.length} rows and ${qinStandardRows.filter(row=>row.sample_count).length} samples`);
const qinMeasure=qinStandardIndex.get('measure_certification');
if(!qinMeasure||!/forty-character.*sixty-character/i.test(qinMeasure.standard_or_claim)||!/980 ml/i.test(qinMeasure.limits)||!/pre-unification.*certified in 221 BCE.*209 BCE/i.test(qinMeasure.observed_practice))fail('Qin measure row must preserve reuse, both inscriptions, and the object-specific capacity limit');
const qinScript=qinStandardIndex.get('official_script');
if(!qinScript||!/not show one sudden comprehensive shift/i.test(qinScript.observed_practice)||!/spoken-language unification/i.test(qinScript.limits))fail('Qin script row must preserve gradual epigraphic change and the spoken-language limit');
for(const [id,conforming,total] of [['tablet_length',25,25],['tablet_width',0,25],['text_density',11,25],['grain_tally_layout',16,22]]){const row=qinStandardIndex.get(id);if(Number(row?.conforming_count)!==conforming||Number(row?.sample_count)!==total)fail(`Qin standardization ${id} must preserve ${conforming} of ${total}`);}
if(!/fourteen of the twenty-five/i.test(qinStandardIndex.get('text_density')?.observed_practice??''))fail('Qin text-density row must preserve the fourteen reported breaches behind the eleven-row complement');
if(!/six used A2, B, or C/i.test(qinStandardIndex.get('grain_tally_layout')?.observed_practice??''))fail('Qin tally row must preserve six accepted alternative layouts');
const qinStandardSnapshot=read('public/data/qin-han/20260830-standardization1/qin-standardization-practice.csv');
if(qinStandardSnapshot!==readFileSync(path.join(root,'public/data/qin-standardization-practice.csv'),'utf8'))fail('Qin standardization immutable snapshot diverges from the canonical dataset');

const qinLogisticsRows=csv('public/data/qin-logistics-ecology.csv');
const qinLogisticsIndex=new Map();
for(const [index,row] of qinLogisticsRows.entries()){
  const context=`qin-logistics-ecology.csv row ${index+2}`;
  requireFields(row,['record_id','sort_order','system','role','date_start','date_end','date_label','place','evidence_class','observed_anchor','input','transformation','output','measure_label','measure_value','source_keys','interpretation','limits'],context);
  numeric(row,['sort_order','date_start','date_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(!['Production','Transport','Storage','Maintenance','Extraction'].includes(row.system))fail(`${context} has unsupported system ${row.system}`);
  if(Number(row.date_start)>Number(row.date_end))fail(`${context} starts after it ends`);
  if(qinLogisticsIndex.has(row.record_id))fail(`${context} duplicates ${row.record_id}`);qinLogisticsIndex.set(row.record_id,row);
  if(Object.keys(row).some(field=>/annual.*grain|throughput|irrigated_area|wall_length|labor_total|worker_total|mortality|state_capacity|efficiency_score|soldier_month/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(qinLogisticsRows.length!==8||qinLogisticsIndex.size!==8)fail(`Qin logistics requires eight unique windows; found ${qinLogisticsRows.length}`);
for(const id of ['zhengguo','dujiangyan','lingqu','travel_route','qianling_rations','capital_granary','maintenance','wall_labor_limit'])if(!qinLogisticsIndex.has(id))fail(`Qin logistics is missing ${id}`);
if(qinLogisticsIndex.get('lingqu')?.measure_value!=='2 drainage basins'||Number(qinLogisticsIndex.get('lingqu')?.date_start)!==-214)fail('Ling Canal must preserve the 214 BCE campaign context and two-basin connection');
if(qinLogisticsIndex.get('travel_route')?.measure_value!=='41 entries'||!/34 inter-place distances and seven section lengths/i.test(qinLogisticsIndex.get('travel_route')?.observed_anchor??''))fail('Qin route record must preserve 41 entries split into 34 distances and seven sections');
if(qinLogisticsIndex.get('qianling_rations')?.measure_value!=='sufficient or insufficient'||!/hard laborers/i.test(qinLogisticsIndex.get('qianling_rations')?.observed_anchor??''))fail('Qianling row must preserve the ration-sufficiency field and hard-laborer scope');
if(qinLogisticsIndex.get('capital_granary')?.measure_value!=='>10000 m³'||!/Qin Grand Granary has not been found/i.test(qinLogisticsIndex.get('capital_granary')?.limits??''))fail('Capital Granary must remain an approximate Western Han archaeological comparison not a Qin capacity');
if(qinLogisticsIndex.get('wall_labor_limit')?.measure_value!=='None'||!/700000-worker.*not accepted/i.test(qinLogisticsIndex.get('wall_labor_limit')?.limits??''))fail('Megaproject labor row must explicitly exclude the transmitted 700000 figure');
if(!/local communities/i.test(qinLogisticsIndex.get('maintenance')?.observed_anchor??'')||!/early Han/i.test(qinLogisticsIndex.get('maintenance')?.limits??''))fail('Maintenance row must preserve local coordination and the early Han evidence limit');
const qinLogisticsSnapshot=read('public/data/qin-han/20260830-logistics1/qin-logistics-ecology.csv');
if(qinLogisticsSnapshot!==readFileSync(path.join(root,'public/data/qin-logistics-ecology.csv'),'utf8'))fail('Qin logistics immutable snapshot diverges from the canonical dataset');

const indusWeightRows=csv('public/data/india/20260831-metrology1/indus-weight-series.csv');
const indusWeightIndex=new Map();
const indusSeriesCounts=new Map();
for(const[index,row]of indusWeightRows.entries()){
  const context=`indus-weight-series.csv row ${index+2}`;
  requireFields(row,['series_id','site','excavation_series','designation','ratio','mean_g','sample_n','implied_unit_g','source_keys','limits'],context);
  numeric(row,['ratio','mean_g','sample_n','implied_unit_g'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(indusWeightIndex.has(row.series_id))fail(`${context} duplicates ${row.series_id}`);indusWeightIndex.set(row.series_id,row);
  indusSeriesCounts.set(row.excavation_series,(indusSeriesCounts.get(row.excavation_series)??0)+1);
  if(Number(row.ratio)<=0||Number(row.mean_g)<=0||Number(row.sample_n)<=0)fail(`${context} has a non-positive published measure`);
  if(Math.abs(Number(row.implied_unit_g)-(Number(row.mean_g)/Number(row.ratio)))>.0006)fail(`${context} implied unit does not equal mean divided by ratio`);
  if(Object.keys(row).some(field=>/centralization|state_capacity|ruler_count|market_volume|bulk_flow|equality_score|tolerance_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(indusWeightRows.length!==24||indusWeightIndex.size!==24)fail(`Indus metrology requires twenty-four unique series-ratio rows; found ${indusWeightRows.length}`);
for(const [series,count]of [['HARP',8],['Vats',8],['Mackay',8]])if(indusSeriesCounts.get(series)!==count)fail(`Indus metrology requires eight common ratios for ${series}`);
for(const ratio of [1,2,4,8,16,32,64,160])if(indusWeightRows.filter(row=>Number(row.ratio)===ratio).length!==3)fail(`Indus metrology ratio ${ratio} must appear in all three excavation series`);
const mackayG=indusWeightIndex.get('mackay_g');
if(!mackayG||Number(mackayG.mean_g)!==27.41||Number(mackayG.sample_n)!==94||Number(mackayG.implied_unit_g)!==.857)fail('Mackay G must preserve the 27.41 g mean, ninety-four specimens, and 0.857 g implied unit');
const harpJ=indusWeightIndex.get('harp_j');
if(!harpJ||Number(harpJ.mean_g)!==120.81||Number(harpJ.sample_n)!==4||Number(harpJ.implied_unit_g)!==.755||!/remain visible/i.test(harpJ.limits))fail('HARP J must preserve the high-ratio deviation and four-specimen limit');

const indusMonumentRows=csv('public/data/india/20260831-metrology1/indus-ruler-monuments.csv');
const indusMonumentIndex=new Map();
for(const[index,row]of indusMonumentRows.entries()){
  const context=`indus-ruler-monuments.csv row ${index+2}`;
  requireFields(row,['signal_id','signal','archaeological_status','observed_evidence','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(indusMonumentIndex.has(row.signal_id))fail(`${context} duplicates ${row.signal_id}`);indusMonumentIndex.set(row.signal_id,row);
  if(row.archaeological_status!=='No clear identification')fail(`${context} overstates the archaeological absence`);
  if(!/does not prove|not proof|do not prove|prevents direct comparison|remains debated|not evidence/i.test(row.limits))fail(`${context} lacks an explicit absence-of-evidence limit`);
}
if(indusMonumentRows.length!==4||indusMonumentIndex.size!==4)fail(`Indus monumental-ruler comparison requires four unique categories; found ${indusMonumentRows.length}`);
for(const id of ['palaces','royal_tombs','large_temples','ruler_monuments'])if(!indusMonumentIndex.has(id))fail(`Indus monumental-ruler evidence is missing ${id}`);

const indusCropRows=csv('public/data/india/20260831-monsoon1/indus-cropping-strategies.csv');
const indusCropIndex=new Map();
for(const[index,row]of indusCropRows.entries()){
  const context=`indus-cropping-strategies.csv row ${index+2}`;
  requireFields(row,['observation_id','region','site','phase','season_strategy','interpretation','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(indusCropIndex.has(row.observation_id))fail(`${context} duplicates ${row.observation_id}`);indusCropIndex.set(row.observation_id,row);
  if(row.numeric_value){numeric(row,['numeric_value'],context);if(!row.numeric_measure)fail(`${context} has a value without a measure`);}
  if(Object.keys(row).some(field=>/yield|acreage|output|diet_share|resilience_score|state_capacity/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(indusCropRows.length!==7||indusCropIndex.size!==7)fail(`Indus crop-calendar comparison requires seven unique observations; found ${indusCropRows.length}`);
if(indusCropIndex.get('harappa_all')?.numeric_value!=='7'||!/20%/.test(indusCropIndex.get('harappa_all')?.limits??''))fail('Harappa must preserve the seven-percent millet maximum and incomplete-publication limit');
if(indusCropIndex.get('khirsara_early')?.numeric_value!=='90'||indusCropIndex.get('khirsara_harappan')?.numeric_value!=='49')fail('Khirsara must preserve the published ninety- and forty-nine-percent barley anchors');
if(indusCropRows.filter(row=>row.site==='Masudpur VII').length!==3)fail('Masudpur VII must preserve all three phase observations');
if(indusCropRows.some(row=>row.source_keys!=='BATES_CHOI2023_INDUS_AGRICULTURE'))fail('Every Indus crop-calendar row must cite Bates and Choi 2023');

const indiaUrbanRows=csv('public/data/india/20260831-urban1/early-historic-urban-phases.csv');
const indiaUrbanIndex=new Map();
for(const[index,row]of indiaUrbanRows.entries()){
  const context=`early-historic-urban-phases.csv row ${index+2}`;
  requireFields(row,['phase_id','year_start','year_end','display_period','phase_title','political_order','urban_evidence','named_examples','quantitative_anchor','source_keys','limits'],context);numeric(row,['year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(indiaUrbanIndex.has(row.phase_id))fail(`${context} duplicates ${row.phase_id}`);indiaUrbanIndex.set(row.phase_id,row);
  if(Number(row.year_start)>=Number(row.year_end))fail(`${context} must have an ordered phase interval`);
  if(Object.keys(row).some(field=>/urbanization_score|state_capacity|coinage_rate|population_total|iron_output|trade_volume/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(indiaUrbanRows.length!==3||indiaUrbanIndex.size!==3)fail(`India urban revival requires three unique broad phases; found ${indiaUrbanRows.length}`);
if(indiaUrbanIndex.get('phase_1')?.quantitative_anchor!=='7 named fortified-site examples'||!/Kosala Vatsa Magadha and Avanti/.test(indiaUrbanIndex.get('phase_1')?.political_order??''))fail('India urban phase one must preserve seven named sites and four rival monarchies');
if(!/one large imperial framework/.test(indiaUrbanIndex.get('phase_2')?.quantitative_anchor??'')||!/multiple regional powers/.test(indiaUrbanIndex.get('phase_3')?.political_order??''))fail('India urban phases must preserve Mauryan integration followed by multiple regional powers');
if(indiaUrbanRows.some(row=>sourceKeys(row.source_keys).length!==2))fail('Every India urban phase must cite both Sawant 2023 and Smith 2006');

const indiaMauryaRows=csv('public/data/india/20260831-maurya1/mauryan-regional-relationships.csv');
const indiaMauryaIndex=new Map();
for(const[index,row]of indiaMauryaRows.entries()){
  const context=`mauryan-regional-relationships.csv row ${index+2}`;
  requireFields(row,['relation_id','relation_order','display_region','relation_title','political_relationship','administrative_instrument','inscriptional_evidence','named_places','quantitative_anchor','source_keys','limits'],context);numeric(row,['relation_order'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(indiaMauryaIndex.has(row.relation_id))fail(`${context} duplicates ${row.relation_id}`);indiaMauryaIndex.set(row.relation_id,row);
  if(Object.keys(row).some(field=>/control_score|boundary_area|compliance_rate|province_count|state_capacity/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(indiaMauryaRows.length!==4||indiaMauryaIndex.size!==4)fail(`Mauryan relationship comparison requires four unique windows; found ${indiaMauryaRows.length}`);
if(indiaMauryaIndex.get('court_core')?.quantitative_anchor!=='5-year and 3-year inspection cycles'||!/Pataliputra; Ujjain; Taxila/.test(indiaMauryaIndex.get('court_core')?.named_places??''))fail('Mauryan court window must preserve the five- and three-year inspection schedules and three dispatch centers');
if(indiaMauryaIndex.get('regional_centers')?.quantitative_anchor!=='4 regional centers named in the synthesis')fail('Mauryan regional window must preserve four named centers without claiming a complete province list');
if(!/unconquered border peoples/.test(indiaMauryaIndex.get('kalinga')?.inscriptional_evidence??'')||!/not evidence of annexation/.test(indiaMauryaIndex.get('neighbors')?.limits??''))fail('Mauryan frontier windows must separate Kalinga reassurance from independent neighbors');
if(indiaMauryaRows.some(row=>sourceKeys(row.source_keys).length!==2))fail('Every Mauryan relationship must cite the edict translation and academic synthesis');

const indiaNetworkRows=csv('public/data/india/20260831-networks1/india-networks-beyond-empires.csv');
const indiaNetworkIndex=new Map();
for(const[index,row]of indiaNetworkRows.entries()){
  const context=`india-networks-beyond-empires.csv row ${index+2}`;
  requireFields(row,['case_id','case_order','display_period','destination','carrier','observed_evidence','what_traveled','political_context','quantitative_anchor','source_keys','limits'],context);numeric(row,['case_order'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(indiaNetworkIndex.has(row.case_id))fail(`${context} duplicates ${row.case_id}`);indiaNetworkIndex.set(row.case_id,row);
  if(Object.keys(row).some(field=>/diffusion_score|boundary_area|trade_volume|population_share|cultural_influence|political_control/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(indiaNetworkRows.length!==3||indiaNetworkIndex.size!==3)fail(`India networks comparison requires three unique cases; found ${indiaNetworkRows.length}`);
if(!/1,000\+ glass samples · 3 metal traditions/.test(indiaNetworkIndex.get('khao_sam_kaeo')?.quantitative_anchor??'')||sourceKeys(indiaNetworkIndex.get('khao_sam_kaeo')?.source_keys??'').length!==3)fail('Khao Sam Kaeo must preserve the glass and metal anchors plus all three archaeological sources');
if(indiaNetworkIndex.get('berenike')?.quantitative_anchor!=='7.55 kg black pepper in one vessel'||!/not total trade volume/.test(indiaNetworkIndex.get('berenike')?.limits??''))fail('Berenike must preserve the vessel-level pepper find and its scope limit');
if(!/not a single empire/.test(indiaNetworkIndex.get('sanskrit_cosmopolis')?.political_context??'')||!/difficult to date/.test(indiaNetworkIndex.get('sanskrit_cosmopolis')?.limits??''))fail('Sanskrit cosmopolis must remain distinct from empire and preserve the dating limit');

const steppeAlpha=csv('public/data/steppe/20260831-alpha1/begash-pastoral-sequence.csv');
for(const[index,row]of steppeAlpha.entries()){
  const context=`begash-pastoral-sequence.csv row ${index+2}`;
  requireFields(row,['year_start','year_end','display_date','label','evidence','measure','source_keys','limits'],context);
  numeric(row,['year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(Number(row.year_start)>Number(row.year_end))fail(`${context} starts after it ends`);
}
if(steppeAlpha.length!==4)fail(`Steppe alpha requires four source-bounded observations; found ${steppeAlpha.length}`);
if(!/horses absent/i.test(steppeAlpha[0]?.measure??'')||!/below 4 percent/i.test(steppeAlpha[2]?.measure??''))fail('Steppe alpha must preserve horse absence in the earliest phase and the below-four-percent second-millennium limit');

const steppeMobility=csv('public/data/steppe/20260831-mobility1/horse-mobility-stages.csv');
const steppeMobilityIndex=new Map();
for(const[index,row]of steppeMobility.entries()){
  const context=`horse-mobility-stages.csv row ${index+2}`;
  requireFields(row,['stage_id','stage_order','year_start','year_end','display_period','stage_title','evidence','capability','military_reach','quantitative_anchor','source_keys','limits'],context);numeric(row,['stage_order','year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(steppeMobilityIndex.has(row.stage_id))fail(`${context} duplicates ${row.stage_id}`);steppeMobilityIndex.set(row.stage_id,row);
  if(Number(row.year_start)>Number(row.year_end))fail(`${context} starts after it ends`);
  if(Object.keys(row).some(field=>/travel_speed|action_radius|army_size|mobility_score|military_power|adoption_date/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(steppeMobility.length!==4||steppeMobilityIndex.size!==4)fail(`Steppe mobility comparison requires four unique stages; found ${steppeMobility.length}`);
if(steppeMobilityIndex.get('dom2_breeding')?.quantitative_anchor!=='475 genomes · expansion around 2200 BCE'||!/not a measured daily travel speed/.test(steppeMobilityIndex.get('dom2_breeding')?.military_reach??''))fail('DOM2 stage must preserve the 475-genome anchor and mobility limit');
if(steppeMobilityIndex.get('sintashta_chariot')?.display_period!=='1950–1880 BCE'||!/vehicle itself may have been removed/.test(steppeMobilityIndex.get('sintashta_chariot')?.limits??''))fail('Sintashta stage must preserve the modeled grave range and vehicle-preservation limit');
if(!/cavalry before stirrups/.test(steppeMobilityIndex.get('mounted_cavalry')?.quantitative_anchor??''))fail('Mounted-cavalry stage must distinguish soft saddles from later stirrups');

const christianityAlpha=csv('public/data/christianity/20260831-alpha1/pauline-letter-network.csv');
for(const[index,row]of christianityAlpha.entries()){
  const context=`pauline-letter-network.csv row ${index+2}`;
  requireFields(row,['year_start','year_end','display_date','letter','audience','network_type','source_keys','limits'],context);
  numeric(row,['year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(Number(row.year_start)>Number(row.year_end))fail(`${context} starts after it ends`);
}
if(christianityAlpha.length!==7||Math.min(...christianityAlpha.map(row=>Number(row.year_start)))!==51||Math.max(...christianityAlpha.map(row=>Number(row.year_end)))!==57)fail('Christianity alpha requires seven generally accepted Pauline letters bounded c. 51–57 CE');

const christianCare=csv('public/data/christianity/20260831-charity1/congregational-care-institutions.csv');
const christianCareIndex=new Map();
for(const[index,row]of christianCare.entries()){
  const context=`congregational-care-institutions.csv row ${index+2}`;
  requireFields(row,['window_id','window_order','year_start','year_end','display_period','window_title','primary_evidence','recurring_practice','organizational_role','quantitative_anchor','source_keys','limits'],context);numeric(row,['window_order','year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(christianCareIndex.has(row.window_id))fail(`${context} duplicates ${row.window_id}`);christianCareIndex.set(row.window_id,row);
  if(Number(row.year_start)>Number(row.year_end))fail(`${context} starts after it ends`);
  if(Object.keys(row).some(field=>/budget_total|beneficiary_count|survival_rate|compliance_rate|durability_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(christianCare.length!==3||christianCareIndex.size!==3)fail(`Christian care comparison requires three unique textual windows; found ${christianCare.length}`);
if(!/first day of every week/.test(christianCareIndex.get('corinth_collection')?.primary_evidence??'')||!/delegates/.test(christianCareIndex.get('corinth_collection')?.organizational_role??''))fail('Corinth window must preserve weekly contributions and appointed transfer roles');
if(christianCareIndex.get('widow_register')?.quantitative_anchor!=='60+ age rule'||!/Pauline authorship is disputed/.test(christianCareIndex.get('widow_register')?.limits??''))fail('Widow register must preserve the sixty-year rule and disputed-authorship limit');
if(!/orphans, widows/.test(christianCareIndex.get('justin_rome')?.primary_evidence??'')||!/not an audited budget/.test(christianCareIndex.get('justin_rome')?.limits??''))fail('Justin window must preserve named care groups and the budget limit');

const caliphatesAlpha=csv('public/data/caliphates/20260831-alpha1/early-caliphate-expansion.csv');
for(const[index,row]of caliphatesAlpha.entries()){
  const context=`early-caliphate-expansion.csv row ${index+2}`;
  requireFields(row,['year_start','year_end','display_date','region','event_type','evidence','source_keys','limits'],context);
  numeric(row,['year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(Number(row.year_start)>Number(row.year_end))fail(`${context} starts after it ends`);
}
if(caliphatesAlpha.length!==6)fail(`Caliphates alpha requires six source-bounded chronology rows; found ${caliphatesAlpha.length}`);
const caliphateBaseline=caliphatesAlpha.find(row=>row.event_type==='baseline');
const iranEndpoint=caliphatesAlpha.find(row=>row.region==='Iran');
if(Number(caliphateBaseline?.year_start)!==632||Number(iranEndpoint?.year_end)!==654||Number(iranEndpoint?.year_end)-Number(caliphateBaseline?.year_start)!==22)fail('Caliphates alpha must preserve the bounded 632–654 twenty-two-year comparison');

const caliphalFiscal=csv('public/data/caliphates/20260831-tax1/caliphal-fiscal-transition.csv');
const caliphalFiscalIndex=new Map();
for(const[index,row]of caliphalFiscal.entries()){
  const context=`caliphal-fiscal-transition.csv row ${index+2}`;
  requireFields(row,['window_id','window_order','year_start','year_end','display_period','window_title','evidence','inherited_layer','new_layer','quantitative_anchor','source_keys','limits'],context);
  numeric(row,['window_order','year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(caliphalFiscalIndex.has(row.window_id))fail(`${context} duplicates ${row.window_id}`);caliphalFiscalIndex.set(row.window_id,row);
  if(Number(row.year_start)>Number(row.year_end))fail(`${context} starts after it ends`);
  if(Object.keys(row).some(field=>/tax_rate|revenue_total|language_share|staff_count|compliance|fiscal_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(caliphalFiscal.length!==4||caliphalFiscalIndex.size!==4)fail(`Caliphal fiscal transition requires four unique evidence windows; found ${caliphalFiscal.length}`);
if(caliphalFiscalIndex.get('egypt_bilingual_receipt')?.display_period!=='25 April 643'||caliphalFiscalIndex.get('egypt_bilingual_receipt')?.quantitative_anchor!=='Greek + Arabic · 22 AH'||!/One surviving receipt/.test(caliphalFiscalIndex.get('egypt_bilingual_receipt')?.limits??''))fail('Egypt receipt window must preserve the dated PERF 558 anchor and one-document limit');
if(!/administrative continuity/.test(caliphalFiscalIndex.get('egypt_muawiya')?.evidence??'')||!/new taxes, requisitions/.test(caliphalFiscalIndex.get('egypt_muawiya')?.evidence??''))fail('Muawiya window must preserve continuity and new levies');
if(caliphalFiscalIndex.get('iran_inherited_mints')?.quantitative_anchor!=='late-Sasanian standard · about 4 g')fail('Iran mint window must preserve the late-Sasanian silver standard');
if(caliphalFiscalIndex.get('abdalmalik_reforms')?.quantitative_anchor!=='survey 691–2 · coin 697 · mints by 703')fail('Standardization window must preserve the survey coin and mint anchors');

const greekTerritories=csv('public/data/greek-city-states/20260831-alpha1/polis-territory-distribution.csv');
for(const[index,row]of greekTerritories.entries()){
  const context=`polis-territory-distribution.csv row ${index+2}`;
  requireFields(row,['measure_id','territory_relation','territory_km2','value','value_type','universe','source_keys','limits'],context);
  numeric(row,['territory_km2','value'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(greekTerritories.length!==5)fail(`Greek polis alpha requires five bounded distribution rows; found ${greekTerritories.length}`);
const greek200=greekTerritories.find(row=>row.measure_id==='at_most_200');
const greek1000=greekTerritories.find(row=>row.measure_id==='over_1000');
if(Number(greek200?.value)!==80||Number(greek200?.territory_km2)!==200||Number(greek1000?.value)!==13)fail('Greek polis alpha must preserve the 80 percent at 200 km² and thirteen over 1,000 km² anchors');

const greekMilitary=csv('public/data/greek-city-states/20260831-citizens1/military-political-constituencies.csv');
const greekMilitaryIndex=new Map();
for(const[index,row]of greekMilitary.entries()){
  const context=`military-political-constituencies.csv row ${index+2}`;
  requireFields(row,['constituency_id','sort_order','military_arm','resource_barrier','political_pattern','aristotle_evidence','visual_anchor','source_keys','limits'],context);
  numeric(row,['sort_order'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(greekMilitaryIndex.has(row.constituency_id))fail(`${context} duplicates ${row.constituency_id}`);greekMilitaryIndex.set(row.constituency_id,row);
  if(Object.keys(row).some(field=>/wealth_threshold|population_share|voting_rate|causal_effect|democracy_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(greekMilitary.length!==4||greekMilitaryIndex.size!==4)fail(`Greek military comparison requires four unique constituencies; found ${greekMilitary.length}`);
if(greekMilitaryIndex.get('cavalry')?.visual_anchor!=='horses + extensive estates'||greekMilitaryIndex.get('cavalry')?.political_pattern!=='Oligarchic')fail('Cavalry row must preserve the estate and oligarchy relationship');
if(greekMilitaryIndex.get('heavy_infantry')?.visual_anchor!=='shield + armor + spear'||!/did not mechanically create/.test(greekMilitaryIndex.get('heavy_infantry')?.limits??''))fail('Heavy-infantry row must preserve the equipment barrier and anti-mechanical limit');
if(greekMilitaryIndex.get('naval_forces')?.visual_anchor!=='state ship + citizen rowers'||greekMilitaryIndex.get('naval_forces')?.political_pattern!=='Democratic element')fail('Naval row must preserve the state-ship and democratic-element relationship');

const raphia=csv('public/data/hellenistic-kingdoms/20260831-alpha1/raphia-contingents.csv');
for(const[index,row]of raphia.entries()){
  const context=`raphia-contingents.csv row ${index+2}`;
  requireFields(row,['side','sort_order','contingent','reported_number','recruiting_label','equipment_or_role','source_keys','limits'],context);
  numeric(row,['sort_order','reported_number'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(raphia.length!==8||new Set(raphia.map(row=>row.side)).size!==2)fail(`Hellenistic alpha requires eight selected contingents across two sides; found ${raphia.length}`);
const egyptians=raphia.find(row=>row.side==='Ptolemaic'&&row.contingent==='Egyptians');
if(Number(egyptians?.reported_number)!==20000||!/included in rather than additional/i.test(egyptians?.limits??''))fail('Hellenistic alpha must preserve the 20,000 Egyptian figure and its inclusion ambiguity');

const hellenisticCapitals=csv('public/data/hellenistic-kingdoms/20260831-capitals1/royal-capital-machines.csv');
const hellenisticCapitalIndex=new Map();
for(const[index,row]of hellenisticCapitals.entries()){
  const context=`royal-capital-machines.csv row ${index+2}`;
  requireFields(row,['city','polity','court_pattern','resource_connection','performance','institutional_evidence','visual_anchor','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
  if(hellenisticCapitalIndex.has(row.city))fail(`${context} duplicates ${row.city}`);hellenisticCapitalIndex.set(row.city,row);
  if(Object.keys(row).some(field=>/population_estimate|tax_total|revenue|expenditure|traffic|consent|capital_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(hellenisticCapitals.length!==4||hellenisticCapitalIndex.size!==4)fail(`Hellenistic capital comparison requires four unique cities; found ${hellenisticCapitals.length}`);
if(hellenisticCapitalIndex.get('Alexandria')?.visual_anchor!=='harbour + palaces + Museum'||!/after the Ptolemaic dynasty/.test(hellenisticCapitalIndex.get('Alexandria')?.limits??''))fail('Alexandria row must preserve the harbour-palace anchor and later-source limit');
if(hellenisticCapitalIndex.get('Seleucia on the Tigris')?.visual_anchor!=='regional core + moving court'||!/peripatetic/.test(hellenisticCapitalIndex.get('Seleucia on the Tigris')?.institutional_evidence??''))fail('Seleucia row must preserve the regional and peripatetic-court mechanism');
if(hellenisticCapitalIndex.get('Pergamon')?.visual_anchor!=='fortress + palace + altar'||!/not a complete budget/.test(hellenisticCapitalIndex.get('Pergamon')?.limits??''))fail('Pergamon row must preserve monumentality and survival-bias limit');

const turfanMoney=csv('public/data/silk-roads/20260831-alpha1/turfan-money-forms.csv');
for(const[index,row]of turfanMoney.entries()){
  const context=`turfan-money-forms.csv row ${index+2}`;
  requireFields(row,['form','year_start','year_end','role','evidence','source_keys','limits'],context);
  numeric(row,['year_start','year_end'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(turfanMoney.length!==3||new Set(turfanMoney.map(row=>row.form)).size!==3||turfanMoney.some(row=>Number(row.year_start)!==273||Number(row.year_end)!==796))fail('Silk Roads alpha requires textiles grain and coins bounded to 273–796 CE');

const silkRerouting=csv('public/data/silk-roads/20260831-routes1/silk-route-rerouting.csv');
const silkReroutingIndex=new Map();
for(const[index,row]of silkRerouting.entries()){
  const context=`silk-route-rerouting.csv row ${index+2}`;
  requireFields(row,['route_case','constraint','route_response','institution','evidence','visual_anchor','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
  if(silkReroutingIndex.has(row.route_case))fail(`${context} duplicates ${row.route_case}`);silkReroutingIndex.set(row.route_case,row);
  if(Object.keys(row).some(field=>/traffic_share|travel_time|river_level|safety_score|route_volume|distance|network_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(silkRerouting.length!==4||silkReroutingIndex.size!==4)fail(`Silk route rerouting requires four unique mechanisms; found ${silkRerouting.length}`);
if(silkReroutingIndex.get('Taklamakan basin')?.visual_anchor!=='fork + oases + rejoin'||!/forked north and south/.test(silkReroutingIndex.get('Taklamakan basin')?.route_response??''))fail('Taklamakan row must preserve the fork and oasis structure');
if(silkReroutingIndex.get('Roman-Parthian frontier')?.visual_anchor!=='enemy frontier + northern detour'||!/traffic share/.test(silkReroutingIndex.get('Roman-Parthian frontier')?.limits??''))fail('Roman-Parthian row must preserve the detour and traffic limit');
if(silkReroutingIndex.get('Oasis-to-oasis exchange')?.visual_anchor!=='local leg + exchange node + next leg'||!/no individual ever traveled/.test(silkReroutingIndex.get('Oasis-to-oasis exchange')?.limits??''))fail('Oasis row must preserve local legs and the long-distance-traveler limit');

const medievalManuscripts=csv('public/data/medieval-europe/20260831-alpha1/manuscript-production.csv');
for(const[index,row]of medievalManuscripts.entries()){
  const context=`manuscript-production.csv row ${index+2}`;
  requireFields(row,['century','year_start','year_end','estimated_manuscripts','region','source_keys','limits'],context);
  numeric(row,['century','year_start','year_end','estimated_manuscripts'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(medievalManuscripts.length!==10||Number(medievalManuscripts[0]?.estimated_manuscripts)!==13552||Number(medievalManuscripts.at(-1)?.estimated_manuscripts)!==4999161)fail('Medieval Europe alpha must preserve all ten published century totals and the 13,552 to 4,999,161 endpoints');

const medievalCharters=csv('public/data/medieval-europe/20260831-charters1/town-charter-rights.csv');
const medievalCharterIndex=new Map();
for(const[index,row]of medievalCharters.entries()){
  const context=`town-charter-rights.csv row ${index+2}`;
  requireFields(row,['case','date_label','bargain','collective_right','how_it_endured','evidence','visual_anchor','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
  if(medievalCharterIndex.has(row.case))fail(`${context} duplicates ${row.case}`);medievalCharterIndex.set(row.case,row);
  if(Object.keys(row).some(field=>/autonomy_score|population|revenue|enforcement_rate|freedom_index/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(medievalCharters.length!==4||medievalCharterIndex.size!==4)fail(`Medieval charter comparison requires four unique cases; found ${medievalCharters.length}`);
if(medievalCharterIndex.get('Oxford')?.visual_anchor!=='custom + confirmation → enforceable privilege'||!/merchant gild/.test(medievalCharterIndex.get('Oxford')?.collective_right??''))fail('Oxford row must preserve merchant-gild and confirmation mechanisms');
if(medievalCharterIndex.get('Bristol network')?.visual_anchor!=='copy + civic register → portable right'||!/more than twenty-five towns/.test(medievalCharterIndex.get('Bristol network')?.how_it_endured??''))fail('Bristol row must preserve the inter-urban register evidence');

const ghanaDues=csv('public/data/african-states/20260831-alpha1/ghana-trade-dues.csv');
for(const[index,row]of ghanaDues.entries()){
  const context=`ghana-trade-dues.csv row ${index+2}`;
  requireFields(row,['observation_id','good','direction','unit','rule_type','source_keys','limits'],context);
  if(row.reported_due)numeric(row,['reported_due'],context);validateKeys(sourceKeys(row.source_keys),context);
}
const saltIn=ghanaDues.find(row=>row.observation_id==='salt_in');
const saltOut=ghanaDues.find(row=>row.observation_id==='salt_out');
if(ghanaDues.length!==5||Number(saltIn?.reported_due)!==1||Number(saltOut?.reported_due)!==2||saltIn?.unit!=='gold dinar'||saltOut?.unit!=='gold dinars')fail('African states alpha must preserve the one-dinar entering and two-dinar leaving salt dues without unit conversion');

const africanGateways=csv('public/data/african-states/20260831-gateways1/northeast-african-gateways.csv');
const africanGatewayIndex=new Map();
for(const[index,row]of africanGateways.entries()){
  const context=`northeast-african-gateways.csv row ${index+2}`;
  requireFields(row,['case','date_label','geographic_joint','political_mechanism','external_link','evidence','visual_anchor','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
  if(africanGatewayIndex.has(row.case))fail(`${context} duplicates ${row.case}`);africanGatewayIndex.set(row.case,row);
  if(Object.keys(row).some(field=>/traffic_volume|customs_revenue|control_score|population|border_geometry|connectivity_index/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(africanGateways.length!==4||africanGatewayIndex.size!==4)fail(`African gateway comparison requires four unique cases; found ${africanGateways.length}`);
if(africanGatewayIndex.get('Makuria')?.visual_anchor!=='military resistance + pact → negotiated gateway'||!/variable reciprocal royal exchange/.test(africanGatewayIndex.get('Makuria')?.evidence??''))fail('Makuria row must preserve the contested reciprocal-exchange interpretation');
if(africanGatewayIndex.get('Alwa at Soba')?.visual_anchor!=='confluence + city → multi-directional hub'||!/275-hectare/.test(africanGatewayIndex.get('Alwa at Soba')?.evidence??''))fail('Soba row must preserve the bounded site-area anchor');

const khaoIndustries=csv('public/data/southeast-asia/20260831-alpha1/khao-sam-kaeo-industries.csv');
for(const[index,row]of khaoIndustries.entries()){
  const context=`khao-sam-kaeo-industries.csv row ${index+2}`;
  requireFields(row,['industry','evidence','technology_connection','measure','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(khaoIndustries.length!==5||new Set(khaoIndustries.map(row=>row.industry)).size!==5||!khaoIndustries.some(row=>row.industry==='Glass ornaments'&&/over 1000 samples/i.test(row.measure))||!khaoIndustries.some(row=>row.industry==='Copper alloys'&&/^3 technological traditions$/i.test(row.measure)))fail('Southeast Asia alpha must preserve five industry lenses plus the bounded glass and copper-alloy anchors');

const mayaLidar=csv('public/data/mesoamerica/20260831-alpha1/maya-lidar-findings.csv');
for(const[index,row]of mayaLidar.entries()){
  const context=`maya-lidar-findings.csv row ${index+2}`;
  requireFields(row,['measure_id','display_value','unit','scope','interpretation','source_keys','limits'],context);
  if(row.numeric_value)numeric(row,['numeric_value'],context);validateKeys(sourceKeys(row.source_keys),context);
}
const mayaArea=mayaLidar.find(row=>row.measure_id==='survey_area');
const mayaStructures=mayaLidar.find(row=>row.measure_id==='structures');
const mayaDensity=mayaLidar.find(row=>row.measure_id==='structure_density');
if(mayaLidar.length!==5||Number(mayaArea?.numeric_value)!==2144||Number(mayaStructures?.numeric_value)!==61480||Number(mayaDensity?.numeric_value)!==29||!mayaLidar.some(row=>row.measure_id==='regional_population'&&row.display_value==='7–11 million'))fail('Mesoamerica alpha must preserve the 2,144 km² survey, 61,480 structures, 29/km² density, and 7–11 million regional model');

const mayaWater=csv('public/data/mesoamerica/20260901-water1/maya-water-infrastructure.csv');
const mayaWaterIndex=new Map();
for(const[index,row]of mayaWater.entries()){
  const context=`maya-water-infrastructure.csv row ${index+2}`;
  requireFields(row,['case','date_label','constraint','system','mechanism','evidence','visual_anchor','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
  if(mayaWaterIndex.has(row.case))fail(`${context} duplicates ${row.case}`);mayaWaterIndex.set(row.case,row);
  if(Object.keys(row).some(field=>/population_supported|labor_total|engineering_score|centralization_score/i.test(field)))fail(`${context} introduces a prohibited synthetic field`);
}
if(mayaWater.length!==4||mayaWaterIndex.size!==4)fail(`Maya water comparison requires four unique cases; found ${mayaWater.length}`);
if(mayaWaterIndex.get('Caracol')?.visual_anchor!=='200 km² lidar → terraces + reservoirs')fail('Caracol row must preserve the bounded 200 km² lidar anchor');
if(mayaWaterIndex.get('Tamarindito')?.visual_anchor!=='60 m dam → ~2,000 m³ reservoir')fail('Tamarindito row must preserve the published dam and reservoir anchors');
if(!/little or no permanent surface water/.test(mayaWaterIndex.get('Tikal')?.constraint??''))fail('Tikal row must preserve the surface-water constraint');
if(!/Channels, ditches/.test(mayaWaterIndex.get("Lamanai–Ka'kabish")?.system??''))fail('Lamanai row must preserve the wetland channel mechanism');

const andeanFloors=csv('public/data/andes/20260901-floors1/andean-ecological-floor-access.csv');
const andeanFloorIndex=new Map();
for(const[index,row]of andeanFloors.entries()){
  const context=`andean-ecological-floor-access.csv row ${index+2}`;
  requireFields(row,['case','date_label','core','distant_floor','access_mechanism','resources','evidence','visual_anchor','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(andeanFloorIndex.has(row.case))fail(`${context} duplicates ${row.case}`);andeanFloorIndex.set(row.case,row);
  for(const field of ['resource_share','yield','population_supported','verticality_score','control_score','trade_volume'])if(field in row)fail(`${context} must not include synthetic ${field}`);
}
if(andeanFloors.length!==4||andeanFloorIndex.size!==4)fail(`Andean ecological-floor comparison requires four unique cases; found ${andeanFloors.length}`);
if(andeanFloorIndex.get('Chupaychu')?.visual_anchor!=='3–4 days → forest products')fail('Chupaychu row must preserve the travel-time anchor');
if(andeanFloorIndex.get('Lupaqa in Sama')?.visual_anchor!=='~40 km caravan → guano')fail('Sama row must preserve the guano-caravan anchor');
if(andeanFloorIndex.get('Tiwanaku colonies')?.visual_anchor!=='3,860 m ↔ 600–900 m')fail('Tiwanaku row must preserve the altitude anchor');
if(andeanFloorIndex.get('Inka Cochabamba')?.visual_anchor!=='multiethnic labor → state maize')fail('Cochabamba row must preserve the state-labor mechanism');

const qhapaqNan=csv('public/data/andes/20260831-alpha1/qhapaq-nan-scale.csv');
for(const[index,row]of qhapaqNan.entries()){
  const context=`qhapaq-nan-scale.csv row ${index+2}`;
  requireFields(row,['measure_id','display_value','numeric_value','unit','scope','interpretation','source_keys','limits'],context);
  numeric(row,['numeric_value'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(qhapaqNan.length!==5||Number(qhapaqNan.find(row=>row.measure_id==='network_length')?.numeric_value)!==30000||Number(qhapaqNan.find(row=>row.measure_id==='main_routes')?.numeric_value)!==4||Number(qhapaqNan.find(row=>row.measure_id==='maximum_altitude')?.numeric_value)!==6600||Number(qhapaqNan.find(row=>row.measure_id==='heritage_subset')?.numeric_value)!==616.06)fail('Andes alpha must preserve the 30,000 km network, four routes, 6,600 m reach, and selected 616.06 km property');

const blackDeathOrigin=csv('public/data/mongol-eurasia/20260831-alpha1/black-death-origin-evidence.csv');
for(const[index,row]of blackDeathOrigin.entries()){
  const context=`black-death-origin-evidence.csv row ${index+2}`;
  requireFields(row,['observation_id','display_value','unit','scope','interpretation','source_keys','limits'],context);
  if(row.numeric_value)numeric(row,['numeric_value'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(blackDeathOrigin.length!==5||Number(blackDeathOrigin.find(row=>row.observation_id==='screened_individuals')?.numeric_value)!==7||Number(blackDeathOrigin.find(row=>row.observation_id==='plague_positive')?.numeric_value)!==3||Number(blackDeathOrigin.find(row=>row.observation_id==='reconstructed_genomes')?.numeric_value)!==2||Number(blackDeathOrigin.find(row=>row.observation_id==='phylogenetic_placement')?.numeric_value)!==1)fail('Mongol Eurasia alpha must preserve seven screened people, three positives, two reconstructed genomes, and one ancestral strain');

const mongolOperations=csv('public/data/mongol-eurasia/20260901-operations1/mongol-operational-system.csv');
const mongolOperationIndex=new Map();
for(const[index,row]of mongolOperations.entries()){
  const context=`mongol-operational-system.csv row ${index+2}`;
  requireFields(row,['mechanism','date_label','operational_problem','organized_response','observable_anchor','evidence','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(mongolOperationIndex.has(row.mechanism))fail(`${context} duplicates ${row.mechanism}`);mongolOperationIndex.set(row.mechanism,row);
  for(const field of ['army_size','horse_count','speed_km_day','detection_time','military_power_score','mobility_score','casualties'])if(field in row)fail(`${context} must not include synthetic ${field}`);
}
if(mongolOperations.length!==4||mongolOperationIndex.size!==4)fail(`Mongol operational comparison requires four unique mechanisms; found ${mongolOperations.length}`);
if(mongolOperationIndex.get('Named command')?.observable_anchor!=='units of 1,000')fail('Mongol command row must preserve the unit designation');
if(mongolOperationIndex.get('Remount depth')?.observable_anchor!=='up to 6–7 spare horses reported')fail('Mongol remount row must preserve the bounded contemporary report');
if(mongolOperationIndex.get('Converging columns')?.observable_anchor!=='separate → converge')fail('Mongol campaign row must preserve separation and convergence');

const gunpowderScale=csv('public/data/gunpowder-empires/20260831-alpha1/military-scale-multipliers.csv');
for(const[index,row]of gunpowderScale.entries()){
  const context=`military-scale-multipliers.csv row ${index+2}`;
  requireFields(row,['observation_id','period','polity','measure','baseline_period','multiplier','source_keys','limits'],context);
  numeric(row,['multiplier'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(gunpowderScale.length!==5||Number(gunpowderScale.find(row=>row.observation_id==='england_army')?.multiplier)!==2.8||Number(gunpowderScale.find(row=>row.observation_id==='france_army')?.multiplier)!==3.8||Number(gunpowderScale.find(row=>row.observation_id==='spain_army')?.multiplier)!==15||Number(gunpowderScale.find(row=>row.observation_id==='spain_war_cost')?.multiplier)!==4.5)fail('Gunpowder alpha must preserve the 2.8× 3.8× and 15× army multipliers plus Spain’s separate 4.5× cost multiplier');

const fortressAdaptations=csv('public/data/gunpowder-empires/20260901-fortress1/artillery-fortress-adaptations.csv');
const fortressAdaptationIndex=new Map();
for(const[index,row]of fortressAdaptations.entries()){
  const context=`artillery-fortress-adaptations.csv row ${index+2}`;
  requireFields(row,['adaptation','date_label','artillery_problem','defensive_response','visual_anchor','operational_effect','evidence','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(fortressAdaptationIndex.has(row.adaptation))fail(`${context} duplicates ${row.adaptation}`);fortressAdaptationIndex.set(row.adaptation,row);
  for(const field of ['wall_thickness','breach_time','construction_cost','garrison_size','casualties','fortress_strength_score'])if(field in row)fail(`${context} must not include synthetic ${field}`);
}
if(fortressAdaptations.length!==4||fortressAdaptationIndex.size!==4)fail(`Artillery-fortress comparison requires four unique adaptations; found ${fortressAdaptations.length}`);
if(fortressAdaptationIndex.get('Mass')?.visual_anchor!=='stone → earth-backed mass')fail('Fortress mass row must preserve the earth-backed response');
if(fortressAdaptationIndex.get('Crossfire')?.visual_anchor!=='dead ground → overlapping fire')fail('Fortress crossfire row must preserve the flanking-fire response');
if(fortressAdaptationIndex.get('Depth')?.visual_anchor!=='one wall → layered approach')fail('Fortress depth row must preserve the layered-defense response');

const galleonRisk=csv('public/data/oceanic-navigation/20260831-alpha1/manila-galleon-risk.csv');
for(const[index,row]of galleonRisk.entries()){
  const context=`manila-galleon-risk.csv row ${index+2}`;
  requireFields(row,['observation_id','display_value','numeric_value','measure','period','scope','source_keys','limits'],context);
  numeric(row,['numeric_value'],context);validateKeys(sourceKeys(row.source_keys),context);
}
if(galleonRisk.length!==5||Number(galleonRisk.find(row=>row.observation_id==='legal_cap')?.numeric_value)!==2||Number(galleonRisk.find(row=>row.observation_id==='all_failures')?.numeric_value)!==20||Number(galleonRisk.find(row=>row.observation_id==='on_time_failures')?.numeric_value)!==17||Number(galleonRisk.find(row=>row.observation_id==='late_failures')?.numeric_value)!==22.5)fail('Oceanic navigation alpha must preserve the two-ship cap and 20% 17% and 22.5% failure shares');

const windRoutes=csv('public/data/oceanic-navigation/20260901-winds1/wind-shaped-routes.csv');
const windRouteIndex=new Map();
for(const[index,row]of windRoutes.entries()){
  const context=`wind-shaped-routes.csv row ${index+2}`;
  requireFields(row,['route','period','direction','start','turn','end','wind_system','sailing_logic','seasonal_anchor','evidence','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(windRouteIndex.has(row.route))fail(`${context} duplicates ${row.route}`);windRouteIndex.set(row.route,row);
  for(const field of ['distance_km','speed_km_day','traffic_share','voyage_count','optimality_score','exact_latitude','exact_longitude'])if(field in row)fail(`${context} must not include synthetic ${field}`);
}
if(windRoutes.length!==4||windRouteIndex.size!==4)fail(`Wind-shaped route comparison requires four unique routes; found ${windRoutes.length}`);
if(windRouteIndex.get('Pacific eastbound')?.seasonal_anchor!=='eastward = westerlies')fail('Pacific eastbound row must preserve the westerly mechanism');
if(windRouteIndex.get('Pacific westbound')?.seasonal_anchor!=='westward = trades')fail('Pacific westbound row must preserve the trade-wind mechanism');
if(windRouteIndex.get('Aden to Malabar')?.seasonal_anchor!=='late Aug–Feb')fail('Aden–Malabar row must preserve the bounded sailing window');
if(windRouteIndex.get('Carreira da Índia')?.seasonal_anchor!=='a route run by the calendar')fail('Carreira da Índia row must preserve the seasonal operating logic');

const urbanSubsistence=csv('public/data/great-divergence/20260831-alpha1/urban-subsistence-ratios.csv');
for(const[index,row]of urbanSubsistence.entries()){
  const context=`urban-subsistence-ratios.csv row ${index+2}`;
  requireFields(row,['city','period','year_start','year_end','subsistence_ratio','worker_scope','source_keys','limits'],context);
  numeric(row,['year_start','year_end','subsistence_ratio'],context);validateKeys(sourceKeys(row.source_keys),context);
}
const ratioKey=row=>`${row.city}|${row.period}`;
const ratios=new Map(urbanSubsistence.map(row=>[ratioKey(row),Number(row.subsistence_ratio)]));
if(urbanSubsistence.length!==6||ratios.get('London|1700–1749')!==4.16||ratios.get('London|1750–1799')!==3.51||ratios.get('Amsterdam|1700–1749')!==4.2||ratios.get('Amsterdam|1750–1799')!==3.77||ratios.get('Beijing|1700–1749')!==1.25||ratios.get('Beijing|1750–1799')!==1.04)fail('Great Divergence alpha must preserve all six published London Amsterdam and Beijing subsistence ratios');

const jennyReturns=csv('public/data/great-divergence/20260901-incentives1/spinning-jenny-returns.csv');
const jennyReturnIndex=new Map();
for(const[index,row]of jennyReturns.entries()){
  const context=`spinning-jenny-returns.csv row ${index+2}`;
  requireFields(row,['place','return_percent','wage_context','adoption_result','calculation_scope','source_keys','limits'],context);numeric(row,['return_percent'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(jennyReturnIndex.has(row.place))fail(`${context} duplicates ${row.place}`);jennyReturnIndex.set(row.place,Number(row.return_percent));
  for(const field of ['invention_score','national_adoption_rate','causal_share','energy_price_index'])if(field in row)fail(`${context} must not include synthetic ${field}`);
}
if(jennyReturns.length!==3||jennyReturnIndex.get('England')!==38||jennyReturnIndex.get('France')!==2.5||jennyReturnIndex.get('India')!==-5.2)fail('Great Divergence incentive comparison must preserve Allen’s central 38% 2.5% and -5.2% spinning-jenny returns');

const steppeWarSystem=csv('public/data/steppe/20260901-war-system1/steppe-war-system.csv');
const steppeWarIndex=new Map();
for(const[index,row]of steppeWarSystem.entries()){
  const context=`steppe-war-system.csv row ${index+2}`;
  requireFields(row,['mechanism','period','military_problem','system_response','observable_anchor','evidence','source_keys','limits'],context);validateKeys(sourceKeys(row.source_keys),context);
  if(steppeWarIndex.has(row.mechanism))fail(`${context} duplicates ${row.mechanism}`);steppeWarIndex.set(row.mechanism,row);
  for(const field of ['range_meters','speed_km_day','endurance_days','army_size','causal_share','military_power_score'])if(field in row)fail(`${context} must not include synthetic ${field}`);
}
const constantineTransition=csv('public/data/christianity/20260901-constantine1/imperial-church-transition.csv');
constantineTransition.forEach((row,index)=>{
  const context=`imperial-church-transition.csv row ${index+2}`;
  requireFields(row,['year','window','imperial_action','institutional_change','observable_anchor','evidence','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
});
if(constantineTransition.length!==3||constantineTransition.map(row=>Number(row.year)).join(',')!=='313,325,380')fail('Christianity imperial transition must preserve the three 313 325 and 380 documentary windows');
if(steppeWarSystem.length!==4||steppeWarIndex.size!==4)fail(`Steppe warfare system requires four unique mechanisms; found ${steppeWarSystem.length}`);
if(steppeWarIndex.get('Remounts')?.observable_anchor!=='up to 6–7 reported')fail('Steppe remount row must preserve the bounded six-to-seven report');
if(steppeWarIndex.get('Maneuver')?.observable_anchor!=='withdraw → surround')fail('Steppe maneuver row must preserve feigned retreat and encirclement');

const mandalaRelationships=csv('public/data/southeast-asia/20260831-mandala1/mandala-relationship-evidence.csv');
for(const[index,row]of mandalaRelationships.entries()){
  const context=`mandala-relationship-evidence.csv row ${index+2}`;
  requireFields(row,['case','date_label','relationship','center','partner_or_periphery','mechanism','evidence','source_keys','limits'],context);
  validateKeys(sourceKeys(row.source_keys),context);
}
if(mandalaRelationships.length!==4||!mandalaRelationships.some(row=>row.case==='Srivijaya'&&row.mechanism==='Water oath and curse')||!mandalaRelationships.some(row=>row.case==='Khmer Empire'&&row.date_label==='921–928 CE')||!mandalaRelationships.some(row=>row.case==='Majapahit'&&row.partner_or_periphery.includes('Nusantara'))||!mandalaRelationships.some(row=>row.case==='Mandala model'&&row.limits.includes('scholarly model')))fail('Southeast Asian mandala beta must preserve four unlike relationship windows and the model caveat');

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
console.log(`Historical data validation passed: ${checked.length} files, ${sources.length} sources, ${datasets.length} datasets, ${claims.length} claims, ${rome.length} Roman force estimates, ${rivals.length} rival campaign observations, ${equipment.length} equipment-index rows, ${fiscalBudget.length} fiscal-budget rows, ${fiscalObservations.length} fiscal observations, ${collapseEvents.length} collapse events, ${africaEquivalents.length} African fiscal-equivalent rows, ${afterlives.length} Roman-afterlife rows, ${urukWriting.length} Uruk-writing rows, ${urukUrbanization.length} Uruk-urbanization rows, ${urukWater.length} Uruk-water rows, ${urukGrain.length} Uruk-grain rows, ${urukFragility.length} Uruk-fragility rows, ${cradles.length} cradles evidence-clock rows, ${cradleEcologies.length} cradles ecology rows, ${cradleSequences.length} cradles sequence rows, ${cradleCoordination.length} cradles coordination routes, ${cradleAfterlives.length} cradles afterlife pathways, ${bronzeNodes.length} Bronze network nodes, ${bronzeLinks.length} Bronze evidence links, ${bronzePalaceCircuits.length} Bronze palace circuits, ${bronzeChariotSystems.length} Bronze chariot records, ${bronzeMaritimeCases.length} Bronze maritime cases, ${bronzeMaritimeLinks.length} maritime associations, ${bronzeCollapseWindows.length} Bronze collapse windows, ${ironAdoptionWindows.length} Iron adoption windows, ${ironSmeltingExperiments.length} Iron fuel experiments, ${ironQualityExperiments.length} Iron quality samples, ${ironMobilizationCases.length} Iron mobilization cases, ${ironInstitutionCases.length} Iron production institutions, ${persianRoadSegments.length} Persian itinerary segments, ${persianRoadEvidence.length} Persian road evidence lenses, ${persianSatrapyCases.length} Persian satrapal portfolios, ${persianTributeDistricts.length} Persian tribute districts, ${persianObligationPortfolios.length} Persian obligation windows, ${persianCoalitionWindows.length} Persian coalition windows, ${persianAfterlifeEpisodes.length} Persian afterlife episodes, ${qinMobilizingRows.length} Qin mobilization records, ${qinStandardRows.length} Qin standardization windows, ${qinLogisticsRows.length} Qin logistics windows, ${indusWeightRows.length} Indus metrology rows, ${indusMonumentRows.length} Indus monumental-ruler categories, ${geo.features.length} boundary features.`);
