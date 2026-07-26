import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

  let previousYear = 1999;
  for (const point of indicator.series) {
    assertPoint(point, indicator.id);
    assert(point.year > previousYear, `${indicator.id}: anni non ordinati`);
    previousYear = point.year;
  }

  assertPoint(indicator.latest, indicator.id);
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
assert(
  spendingDisplayed.every((point) => point.status?.includes("p")),
  "La ripartizione COFOG 2024 deve risultare provvisoria",
);
assert(
  spendingDisplayed.every((point) =>
    point.countryStatuses.some(
      (entry) => entry.geo === "IT" && entry.status.includes("p"),
    ),
  ),
  "Lo stato provvisorio COFOG deve comparire anche nel dettaglio Italia",
);
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

const healthyLifeYears = dashboard.indicators.find(
  (indicator) => indicator.id === "healthy-life-years",
);
assert(
  healthyLifeYears.latest.coverage === 26 &&
    healthyLifeYears.latest.missingCountries.includes("LU"),
  "La copertura di Healthy Life Years deve indicare il Lussemburgo mancante",
);

const csvLines = csv.trim().split("\n");
assert(
  csvLines[0] ===
    "indicator_id,section,year,italy,eu27_official_value,eu27_country_median,countries_in_median,eu_method,italy_status,eu_status,flagged_countries,missing_countries,unit,dataset",
  "Intestazione CSV inattesa",
);
assert(csvLines.length > 900, "CSV troppo corto");
assert(
  !/\d+\.\d{10,}/.test(csv),
  "Il CSV contiene artefatti di precisione binaria",
);

console.log(
  `Dati validi: ${dashboard.indicators.length} indicatori, ${manifest.datasets.length} dataset, ${csvLines.length - 1} righe CSV.`,
);
