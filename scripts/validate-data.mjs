import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { euCountries, flattenJsonStat, matchesSelector, isEstimateOrProvisional, buildIndicatorCsv } from "./data-utils.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

async function readJson(path) {
  return JSON.parse(await readFile(join(projectRoot, path), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertPoint(point, indicatorId) {
  assert(Number.isInteger(point.year), `${indicatorId}: anno non valido`);
  assert(point.year >= 2000, `${indicatorId}: anno precedente al 2000`);
  for (const field of ["italy", "median"]) {
    assert(
      Number.isFinite(point[field]),
      `${indicatorId}: valore ${field} non valido`,
    );
  }
  assert(
    Number.isInteger(point.coverage) &&
      point.coverage >= 24 &&
      point.coverage <= 27,
    `${indicatorId}: copertura UE non valida`,
  );
  assert(
    ["official_aggregate", "unavailable"].includes(point.euMethod),
    `${indicatorId}: metodo UE non valido`,
  );
  if (point.euMethod === "official_aggregate") {
    assert(Number.isFinite(point.eu), `${indicatorId}: aggregato UE mancante`);
  } else {
    assert(point.eu === null, `${indicatorId}: aggregato UE non ufficiale`);
  }
  assert(
    Array.isArray(point.countryStatuses) &&
      Array.isArray(point.missingCountries),
    `${indicatorId}: stati geografici mancanti`,
  );
  assert(
    point.coverage + point.missingCountries.length === 27,
    `${indicatorId}: Paesi disponibili e mancanti incoerenti`,
  );
  assert(
    point.countryStatuses.every(
      (entry) =>
        typeof entry.geo === "string" &&
        typeof entry.status === "string" &&
        entry.status.length > 0,
    ),
    `${indicatorId}: contrassegni Paese non validi`,
  );
  const validCountries = new Set(euCountries);
  assert(new Set(point.missingCountries).size === point.missingCountries.length,
    `${indicatorId}: Paesi mancanti duplicati`);
  assert(point.missingCountries.every((geo) => validCountries.has(geo)),
    `${indicatorId}: Paese mancante estraneo all’UE27`);
  assert(new Set(point.countryStatuses.map((entry) => entry.geo)).size === point.countryStatuses.length,
    `${indicatorId}: contrassegni Paese duplicati`);
  assert(point.countryStatuses.every((entry) => validCountries.has(entry.geo) && !point.missingCountries.includes(entry.geo)),
    `${indicatorId}: contrassegno di un Paese senza valore`);
  if (point.countries) {
    assert(
      point.countries.length === point.coverage,
      `${indicatorId}: osservazioni Paese incomplete`,
    );
  }
}

const [dashboard, manifest, publicDashboard, publicManifest, csv] =
  await Promise.all([
    readJson("data/processed/dashboard.json"),
    readJson("data/manifest.json"),
    readJson("public/data/dashboard.json"),
    readJson("public/data/manifest.json"),
    readFile(join(projectRoot, "public/data/dashboard.csv"), "utf8"),
  ]);

assert(dashboard.indicators.length === 39, "Attesi 39 indicatori");
assert(dashboard.sections.length === 6, "Attese 6 sezioni");
assert(manifest.datasets.length === 20, "Attesi 20 dataset ufficiali");
assert(
  JSON.stringify(dashboard) === JSON.stringify(publicDashboard),
  "La copia pubblica della dashboard non coincide",
);
assert(
  JSON.stringify(manifest) === JSON.stringify(publicManifest),
  "La copia pubblica del manifest non coincide",
);

const sectionIds = new Set(dashboard.sections.map((section) => section.id));
const datasetCodes = new Set(
  manifest.datasets.map((dataset) => dataset.datasetCode),
);
const indicatorIds = new Set();
const rawDatasets = new Map(await Promise.all(manifest.datasets.map(async (source) => {
  const raw = await readJson(source.localPath);
  return [source.datasetCode, { dataset: raw, records: flattenJsonStat(raw) }];
})));

function checkAgainstSource(indicator, point, byYear) {
  const observations = byYear.get(point.year);
  assert(observations, `${indicator.id}: anno non presente nello snapshot`);
  const countries = euCountries.filter((geo) => Number.isFinite(observations.get(geo)?.value));
  const values = countries.map((geo) => observations.get(geo).value).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const expectedMedian = values.length % 2
    ? values[middle]
    : Number(((values[middle - 1] + values[middle]) / 2).toFixed(10));
  assert(point.italy === observations.get("IT")?.value, `${indicator.id}: Italia diversa dalla fonte nel ${point.year}`);
  const officialEu = observations.get("EU27_2020");
  assert(point.eu === (Number.isFinite(officialEu?.value) ? officialEu.value : null),
    `${indicator.id}: UE diversa dalla fonte nel ${point.year}`);
  assert(point.sourceStatus === (observations.get("IT")?.status ?? null),
    `${indicator.id}: contrassegno Italia originale perso nel ${point.year}`);
  assert(point.euSourceStatus === (Number.isFinite(officialEu?.value) ? officialEu.status : null),
    `${indicator.id}: contrassegno UE originale perso nel ${point.year}`);
  for (const [original, effective] of [[point.sourceStatus, point.status], [point.euSourceStatus, point.euStatus]]) {
    assert([...original ?? ""].every((code) => effective?.includes(code)),
      `${indicator.id}: contrassegno originale rimosso nel ${point.year}`);
  }
  assert(point.median === expectedMedian, `${indicator.id}: mediana non riproducibile nel ${point.year}`);
  assert(point.coverage === countries.length, `${indicator.id}: copertura diversa dalla fonte nel ${point.year}`);
  assert(JSON.stringify(point.missingCountries) === JSON.stringify(euCountries.filter((geo) => !countries.includes(geo))),
    `${indicator.id}: elenco Paesi mancanti diverso dalla fonte nel ${point.year}`);
  const expectedFlags = countries.flatMap((geo) => {
    const status = geo === "IT" ? point.status : observations.get(geo).status;
    return status ? [{ geo, status }] : [];
  });
  assert(JSON.stringify(point.countryStatuses) === JSON.stringify(expectedFlags),
    `${indicator.id}: contrassegni nazionali diversi dalla fonte nel ${point.year}`);
  if (point.countries) {
    assert(JSON.stringify(point.countries) === JSON.stringify(countries.map((geo) => ({
      geo, value: observations.get(geo).value,
      status: geo === "IT" ? point.status : observations.get(geo).status,
    }))), `${indicator.id}: tabella Paesi diversa dallo snapshot nel ${point.year}`);
  }
}

for (const indicator of dashboard.indicators) {
  assert(!indicatorIds.has(indicator.id), `ID duplicato: ${indicator.id}`);
  indicatorIds.add(indicator.id);
  assert(sectionIds.has(indicator.section), `${indicator.id}: sezione assente`);
  assert(indicator.startYear >= 2000, `${indicator.id}: inizio non valido`);
  assert(indicator.series.length > 0, `${indicator.id}: serie vuota`);
  assert(
    datasetCodes.has(indicator.source.datasetCode),
    `${indicator.id}: fonte non presente nel manifest`,
  );

  for (const key of ["title", "plain", "technical"]) {
    for (const locale of ["it", "en"]) {
      const minimumLength = key === "title" ? 2 : 10;
      assert(
        typeof indicator[key]?.[locale] === "string" &&
          indicator[key][locale].trim().length >= minimumLength,
        `${indicator.id}: testo ${key}.${locale} mancante`,
      );
    }
  }
  assert(
    indicator.definitionKind === "project_paraphrase",
    `${indicator.id}: tipo di definizione inatteso`,
  );
  assert(
    typeof indicator.definitionSourceUrl === "string" &&
      indicator.definitionSourceUrl.startsWith("https://"),
    `${indicator.id}: fonte della definizione mancante`,
  );
  assert(Array.isArray(indicator.notes), `${indicator.id}: note mancanti`);

  const { records } = rawDatasets.get(indicator.source.datasetCode);
  const parameters = new URL(indicator.source.apiUrl).searchParams;
  const selector = Object.fromEntries([...parameters].filter(([dimension]) => ![
    "lang", "sinceTimePeriod", "geo",
  ].includes(dimension)));
  const byYear = new Map();
  for (const record of records.filter((record) => matchesSelector(record, selector))) {
    const year = Number(record.time);
    if (!byYear.has(year)) byYear.set(year, new Map());
    assert(!byYear.get(year).has(record.geo), `${indicator.id}: selezione ambigua`);
    byYear.get(year).set(record.geo, record);
  }
  const expectedYears = [...byYear].filter(([year, observations]) =>
    year >= 2000 && Number.isFinite(observations.get("IT")?.value) &&
    euCountries.filter((geo) => Number.isFinite(observations.get(geo)?.value)).length >= 24,
  ).map(([year]) => year).sort((a, b) => a - b);
  assert(JSON.stringify(indicator.series.map((point) => point.year)) === JSON.stringify(expectedYears),
    `${indicator.id}: anni confrontabili omessi o interpolati`);
  let previousYear = 1999;
  for (const point of indicator.series) {
    assertPoint(point, indicator.id);
    checkAgainstSource(indicator, point, byYear);
    assert(point.year > previousYear, `${indicator.id}: anni non ordinati`);
    previousYear = point.year;
  }

  assertPoint(indicator.latest, indicator.id);
  checkAgainstSource(indicator, indicator.latest, byYear);
  const latestExpected = [...indicator.series].reverse().find((point) => !isEstimateOrProvisional(point.status))
    ?? indicator.series.at(-1);
  assert(indicator.latest.year === latestExpected.year,
    `${indicator.id}: selezione dell’ultimo dato non provvisorio incoerente`);
  const newest = indicator.series.at(-1);
  assert((indicator.newerEstimate?.year ?? null) === (newest.year > latestExpected.year ? newest.year : null),
    `${indicator.id}: dato più recente omesso o non coerente`);
  for (const point of [indicator.latest, indicator.newerEstimate].filter(Boolean)) {
    const comparisonPoint = { ...point };
    delete comparisonPoint.countries;
    assert(JSON.stringify(comparisonPoint) === JSON.stringify(indicator.series.find((item) => item.year === point.year)),
      `${indicator.id}: dato principale incoerente con la serie`);
  }
  assert(
    indicator.latest.countries?.length === indicator.latest.coverage,
    `${indicator.id}: dettaglio Paesi assente dal dato principale`,
  );
  assert(
    indicator.latest.year >= indicator.startYear,
    `${indicator.id}: ultimo anno precedente all’inizio`,
  );
  if (indicator.newerEstimate) {
    assertPoint(indicator.newerEstimate, indicator.id);
    checkAgainstSource(indicator, indicator.newerEstimate, byYear);
    assert(
      indicator.newerEstimate.countries?.length ===
        indicator.newerEstimate.coverage,
      `${indicator.id}: dettaglio Paesi assente dal dato più recente`,
    );
    assert(
      indicator.newerEstimate.year > indicator.latest.year,
      `${indicator.id}: stima non più recente del dato principale`,
    );
  }
}

assert(
  manifest.license.url ===
    "https://ec.europa.eu/eurostat/help/copyright-notice",
  "La politica di riuso Eurostat non è aggiornata",
);
assert(
  manifest.licenses.some(
    (license) => license.institution === "European Environment Agency",
  ),
  "Attribuzione EEA mancante",
);

for (const dataset of manifest.datasets) {
  const raw = await readFile(join(projectRoot, dataset.localPath));
  const hash = createHash("sha256").update(raw).digest("hex");
  assert(hash === dataset.sha256, `${dataset.datasetCode}: SHA256 non coincide`);
  assert(raw.byteLength === dataset.bytes, `${dataset.datasetCode}: byte non coincidono`);
  assert(dataset.institution === "Eurostat", `${dataset.datasetCode}: fonte inattesa`);
  assert(
    typeof dataset.originalInstitution === "string" &&
      dataset.originalInstitution.length > 0,
    `${dataset.datasetCode}: fonte originaria mancante`,
  );
  assert(
    typeof dataset.accessedAt === "string" &&
      !Number.isNaN(Date.parse(dataset.accessedAt)),
    `${dataset.datasetCode}: data di acquisizione mancante`,
  );
  assert(dataset.dataBrowserUrl.startsWith("https://"), `${dataset.datasetCode}: URL dati`);
  assert(dataset.apiUrl.startsWith("https://"), `${dataset.datasetCode}: URL API`);
  assert(dataset.doi.startsWith("https://doi.org/"), `${dataset.datasetCode}: DOI`);
  const original = rawDatasets.get(dataset.datasetCode).dataset;
  assert(dataset.sourceUpdatedAt === original.updated,
    `${dataset.datasetCode}: aggiornamento diverso dalla fonte`);
  assert(dataset.datasetLabel === original.label,
    `${dataset.datasetCode}: titolo diverso dalla fonte`);
  for (const indicator of dashboard.indicators.filter((item) => item.source.datasetCode === dataset.datasetCode)) {
    for (const key of ["institution", "originalInstitution", "datasetLabel", "sourceUpdatedAt", "accessedAt", "metadataUrl", "doi"]) {
      assert(indicator.source[key] === dataset[key], `${indicator.id}: provenienza ${key} incoerente`);
    }
  }
}

const spending = dashboard.indicators.filter(
  (indicator) =>
    indicator.section === "spending" &&
    indicator.id.startsWith("spending-") &&
    !indicator.isDetail,
);
assert(spending.length === 10, "Attese 10 funzioni COFOG principali");
const spendingYear = spending[0].latest.year;
assert(
  spending.every((indicator) => indicator.latest.year === spendingYear),
  "Le funzioni COFOG non hanno lo stesso anno",
);
const spendingTotal = spending.reduce(
  (total, indicator) => total + indicator.latest.italy,
  0,
);
assert(
  Math.abs(spendingTotal - 100) <= 0.2,
  `Le funzioni COFOG sommano a ${spendingTotal}`,
);

const spendingDisplayed = spending.map(
  (indicator) => indicator.newerEstimate ?? indicator.latest,
);
const spendingDisplayedYear = spendingDisplayed[0].year;
assert(
  spendingDisplayed.every((point) => point.year === spendingDisplayedYear),
  "Le funzioni COFOG visualizzate non hanno lo stesso anno",
);
for (const point of spendingDisplayed.filter((item) => item.year === 2024)) {
  assert(point.status?.includes("p") && point.euStatus?.includes("p"),
    "La ripartizione COFOG 2024 Italia e UE deve risultare provvisoria");
  assert(point.countryStatuses.some((entry) => entry.geo === "IT" && entry.status.includes("p")),
    "Lo stato provvisorio COFOG deve comparire anche nel dettaglio Italia");
}
assert(
  Math.abs(
    spendingDisplayed.reduce((total, point) => total + point.italy, 0) - 100,
  ) <= 0.2,
  "Le funzioni COFOG visualizzate non sommano a 100",
);

const greenhouseGas = dashboard.indicators.find(
  (indicator) => indicator.id === "greenhouse-gas-emissions",
);
assert(greenhouseGas.latest.eu === null, "Le emissioni non hanno un aggregato UE comparabile");
assert(
  greenhouseGas.latest.euMethod === "unavailable",
  "Le emissioni non devono usare una media nazionale come valore UE",
);
assert(
  greenhouseGas.source.originalInstitution.includes(
    "European Environment Agency",
  ),
  "Fonte originaria EEA mancante per le emissioni",
);

for (const indicatorId of [
  "life-expectancy",
  "healthy-life-years",
  "renewable-energy",
  "municipal-waste-recycling",
  "poverty-or-exclusion",
  "greenhouse-gas-emissions",
]) {
  const indicator = dashboard.indicators.find(
    (candidate) => candidate.id === indicatorId,
  );
  assert(indicator.notes.length > 0, `${indicatorId}: nota metodologica mancante`);
}

const csvLines = csv.trim().split("\n");
assert(
  csvLines[0] ===
    "indicator_id,section,year,italy,eu27_official_value,eu27_country_median,countries_in_median,eu_method,italy_status,eu_status,flagged_countries,missing_countries,unit,dataset",
  "Intestazione CSV inattesa",
);
const expectedCsvRows = dashboard.indicators.flatMap((indicator) => indicator.series.map((point) => [
  indicator.id, indicator.section, point.year, point.italy, point.eu ?? "", point.median,
  point.coverage, point.euMethod, point.status ?? "", point.euStatus ?? "",
  point.countryStatuses.map(({ geo, status }) => `${geo}:${status}`).join("|"),
  point.missingCountries.join("|"), indicator.unitKey, indicator.source.datasetCode,
].join(",")));
assert(csvLines.slice(1).join("\n") === expectedCsvRows.join("\n"),
  "CSV diverso dalle osservazioni pubblicate");
assert(
  !/\d+\.\d{10,}/.test(csv),
  "Il CSV contiene artefatti di precisione binaria",
);

const indicatorCsvDirectory = join(projectRoot, "public/data/indicators");
const csvFiles = (await readdir(indicatorCsvDirectory)).sort();
const expectedCsvFiles = dashboard.indicators.map((indicator) => `${indicator.id}.csv`).sort();
assert(JSON.stringify(csvFiles) === JSON.stringify(expectedCsvFiles),
  "CSV dei singoli indicatori mancanti o inattesi");
for (const indicator of dashboard.indicators) {
  const indicatorCsv = await readFile(join(indicatorCsvDirectory, `${indicator.id}.csv`), "utf8");
  assert(indicatorCsv === buildIndicatorCsv(indicator),
    `${indicator.id}: CSV scaricabile diverso dalle osservazioni pubblicate`);
}

console.log(
  `Dati validi e riprodotti dagli snapshot ufficiali: ${dashboard.indicators.length} indicatori, ${manifest.datasets.length} dataset, ${csvLines.length - 1} righe CSV, ${csvFiles.length} CSV per indicatore.`,
);
