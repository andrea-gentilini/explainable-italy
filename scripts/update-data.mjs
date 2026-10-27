import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  euCountries,
  flattenJsonStat,
  buildSeries,
  isEstimateOrProvisional,
  csvEscape,
  csvNumber,
  buildIndicatorCsv,
} from "./data-utils.mjs";
import { datasetSpecs, sections } from "./indicator-catalog.mjs";
import { metadataStatusOverrides } from "./metadata-rules.mjs";
import { publishDataFiles } from "./data-publish.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rawDirectory = join(projectRoot, "data", "raw", "eurostat");
const processedDirectory = join(projectRoot, "data", "processed");
const publicDataDirectory = join(projectRoot, "public", "data");

const allGeographies = [...euCountries, "EU27_2020"];

function buildApiUrl(specification, selector = {}) {
  const url = new URL(
    `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${specification.id}`,
  );
  url.searchParams.set("lang", "en");
  url.searchParams.set("sinceTimePeriod", "2000");

  const dimensions = new Set([
    ...Object.keys(specification.filters),
    ...Object.keys(selector),
  ]);

  for (const dimension of dimensions) {
    const values =
      dimension in selector
        ? [selector[dimension]]
        : specification.filters[dimension];

    for (const value of values) {
      url.searchParams.append(dimension, value);
    }
  }

  for (const geography of allGeographies) {
    url.searchParams.append("geo", geography);
  }

  return url;
}

// Prepare the complete update before replacing any project file.
const pendingFiles = new Map();
function writeJson(path, value) {
  pendingFiles.set(path, `${JSON.stringify(value, null, 2)}\n`);
}

await Promise.all([
  mkdir(rawDirectory, { recursive: true }),
  mkdir(processedDirectory, { recursive: true }),
  mkdir(publicDataDirectory, { recursive: true }),
]);

const offline = process.argv.includes("--offline");
const previousManifest = offline
  ? JSON.parse(
      await readFile(join(projectRoot, "data", "manifest.json"), "utf8"),
    )
  : null;

const manifest = {
  generatedAt: previousManifest?.generatedAt ?? new Date().toISOString(),
  policy: {
    it: "Ogni snapshot contiene solo la selezione usata dal sito. I valori ufficiali non vengono modificati; la serializzazione normalizza soltanto gli spazi finali. Le mediane sono calcolate sui Paesi UE disponibili e pubblicate con almeno 24 valori su 27. Se non esiste un aggregato UE ufficiale con lo stesso perimetro, il sito non ne costruisce uno. Testi accessibili e traduzioni sono parafrasi del progetto, indicate come tali.",
    en: "Each snapshot contains only the selection used by the site. Official values are not changed; serialisation only normalises trailing whitespace. Medians are calculated across available EU countries and published with at least 24 values out of 27. When no official EU aggregate with the same scope exists, the site does not construct one. Accessible copy and translations are project paraphrases and are identified as such.",
  },
  license: {
    name: "Eurostat reuse policy",
    url: "https://ec.europa.eu/eurostat/help/copyright-notice",
  },
  licenses: [
    {
      institution: "Eurostat",
      name: "Eurostat reuse policy",
      url: "https://ec.europa.eu/eurostat/help/copyright-notice",
    },
    {
      institution: "European Environment Agency",
      name: "EEA legal notice and reuse terms",
      url: "https://www.eea.europa.eu/en/legal-notice",
    },
  ],
  disclaimer: {
    it: "Eurostat e le altre istituzioni citate non sono responsabili delle traduzioni, delle sintesi accessibili, delle mediane o di altre elaborazioni realizzate da Explainable Italy.",
    en: "Eurostat and the other cited institutions are not responsible for translations, accessible summaries, medians or other processing performed by Explainable Italy.",
  },
  datasets: [],
};

const indicators = [];

for (const specification of datasetSpecs) {
  const apiUrl = buildApiUrl(specification);
  const rawFileName = `${specification.id}.json`;
  const rawPath = join(rawDirectory, rawFileName);
  let rawText;
  let accessedAt;

  if (offline) {
    rawText = await readFile(rawPath, "utf8");
    const previousSource = previousManifest.datasets.find(
      (entry) => entry.datasetCode === specification.id,
    );
    const checksum = createHash("sha256").update(rawText).digest("hex");
    if (
      !previousSource ||
      previousSource.sha256 !== checksum ||
      previousSource.apiUrl !== apiUrl.toString()
    ) {
      throw new Error(
        `Offline snapshot integrity failed: ${specification.id}`,
      );
    }
    accessedAt = previousSource.accessedAt;
  } else {
    const response = await fetch(apiUrl, {
      headers: { "user-agent": "Explainable-Italy/0.1 data update" },
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      throw new Error(
        `Eurostat request failed for ${specification.id}: ${response.status} ${response.statusText}`,
      );
    }

    rawText = await response.text();
    accessedAt = new Date().toISOString();
  }

  const normalizedRawText = `${rawText.trim()}\n`;
  const dataset = JSON.parse(normalizedRawText);
  const checksum = createHash("sha256")
    .update(normalizedRawText)
    .digest("hex");

  pendingFiles.set(rawPath, normalizedRawText);
  pendingFiles.set(
    join(publicDataDirectory, "raw", "eurostat", rawFileName),
    normalizedRawText,
  );

  const metadataUrl =
    dataset.extension?.annotation?.find(
      (annotation) => annotation.type === "ESMS_HTML",
    )?.href ?? null;

  const source = {
    institution: "Eurostat",
    originalInstitution:
      specification.originalInstitution ?? "Eurostat",
    datasetCode: specification.id,
    datasetLabel: dataset.label,
    dataBrowserUrl: `https://ec.europa.eu/eurostat/databrowser/view/${specification.id}/default/table?lang=en`,
    apiUrl: apiUrl.toString(),
    metadataUrl,
    doi: `https://doi.org/10.2908/${specification.id.toUpperCase()}`,
    sourceUpdatedAt: dataset.updated,
    accessedAt,
    snapshotPath: `data/raw/eurostat/${rawFileName}`,
    sha256: checksum,
    bytes: Buffer.byteLength(normalizedRawText),
  };

  manifest.datasets.push({
    ...source,
    localPath: `data/raw/eurostat/${rawFileName}`,
    sha256: checksum,
    bytes: Buffer.byteLength(normalizedRawText),
  });

  if (dataset.extension?.id?.toLowerCase() !== specification.id) {
    throw new Error(`Unexpected Eurostat dataset: ${specification.id}`);
  }
  const records = flattenJsonStat(dataset);
  if (records.some((record) => !allGeographies.includes(record.geo))) {
    throw new Error(`Unexpected Eurostat geography: ${specification.id}`);
  }
  for (const dimension of dataset.id) {
    if (dimension === "time" || dimension === "geo") continue;
    if (
      !specification.filters[dimension] ||
      records.some(
        (record) =>
          !specification.filters[dimension].includes(record[dimension]),
      )
    ) {
      throw new Error(
        `Unexpected Eurostat selection: ${specification.id}.${dimension}`,
      );
    }
  }

  for (const indicatorDefinition of specification.indicators) {
    const seriesWithCountries = buildSeries(
      records,
      indicatorDefinition.selector,
      {
        ...(specification.statusOverrides ?? {}),
        ...(indicatorDefinition.statusOverrides ?? {}),
      },
      {
        ...(specification.euStatusOverrides ?? {}),
        ...(indicatorDefinition.euStatusOverrides ?? {}),
      },
      metadataStatusOverrides(specification.id, indicatorDefinition.selector),
    );
    const indicatorSource = {
      ...source,
      apiUrl: buildApiUrl(
        specification,
        indicatorDefinition.selector,
      ).toString(),
    };

    if (seriesWithCountries.length === 0) {
      throw new Error(
        `No complete EU comparison series for ${indicatorDefinition.id}`,
      );
    }

    const latestAvailable = seriesWithCountries.at(-1);
    const latestWithCountries =
      [...seriesWithCountries]
        .reverse()
        .find((point) => !isEstimateOrProvisional(point.status)) ??
      latestAvailable;
    const newerEstimateWithCountries =
      latestAvailable.year > latestWithCountries.year ? latestAvailable : null;
    const series = seriesWithCountries;
    const latest = { ...latestWithCountries };
    const newerEstimate = newerEstimateWithCountries
      ? { ...newerEstimateWithCountries }
      : null;

    indicators.push({
      id: indicatorDefinition.id,
      section: indicatorDefinition.section,
      title: indicatorDefinition.title,
      plain: indicatorDefinition.plain,
      technical: indicatorDefinition.technical,
      unitKey: indicatorDefinition.unitKey,
      precision: indicatorDefinition.precision,
      featured: indicatorDefinition.featured ?? false,
      isDetail: indicatorDefinition.isDetail ?? false,
      definitionSourceUrl:
        indicatorDefinition.definitionSourceUrl ?? metadataUrl,
      definitionKind: "project_paraphrase",
      notes: [
        ...(specification.notes ?? []),
        ...(indicatorDefinition.notes ?? []),
      ],
      startYear: series[0].year,
      latest,
      newerEstimate,
      series,
      source: indicatorSource,
    });
  }
}

const dashboardData = {
  generatedAt: manifest.generatedAt,
  methodologyVersion: "1.3.0",
  comparison: {
    it: "Quando disponibile, il valore UE è l’aggregato ufficiale Eurostat. Se non esiste un aggregato con lo stesso perimetro, non ne costruiamo uno. La mediana è calcolata ordinando i valori dei Paesi disponibili e prendendo quello centrale; con un numero pari di Paesi è la media dei due valori centrali. Vicino al confronto sono indicati copertura, valori mancanti e contrassegni di qualità.",
    en: "When available, the EU value is Eurostat’s official aggregate. If no aggregate with the same scope exists, we do not construct one. The median is calculated by ordering the available country values and taking the middle one; with an even number of countries it is the mean of the two middle values. Coverage, missing values and quality flags are shown next to the comparison.",
  },
  sections,
  indicators,
};

await writeJson(join(processedDirectory, "dashboard.json"), dashboardData);
await writeJson(join(projectRoot, "data", "manifest.json"), manifest);
await writeJson(join(publicDataDirectory, "dashboard.json"), dashboardData);
await writeJson(join(publicDataDirectory, "manifest.json"), manifest);

const csvRows = [
  [
    "indicator_id",
    "section",
    "year",
    "italy",
    "eu27_official_value",
    "eu27_country_median",
    "countries_in_median",
    "eu_method",
    "italy_status",
    "eu_status",
    "flagged_countries",
    "missing_countries",
    "unit",
    "dataset",
  ],
  ...indicators.flatMap((indicator) =>
    indicator.series.map((point) => [
      indicator.id,
      indicator.section,
      point.year,
      csvNumber(point.italy),
      csvNumber(point.eu),
      csvNumber(point.median),
      point.coverage,
      point.euMethod,
      point.status,
      point.euStatus,
      point.countryStatuses
        .map(({ geo, status }) => `${geo}:${status}`)
        .join("|"),
      point.missingCountries.join("|"),
      indicator.unitKey,
      indicator.source.datasetCode,
    ]),
  ),
];

pendingFiles.set(
  join(publicDataDirectory, "dashboard.csv"),
  `${csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`,
);

for (const indicator of indicators) {
  pendingFiles.set(
    join(publicDataDirectory, "indicators", `${indicator.id}.csv`),
    buildIndicatorCsv(indicator),
  );
}

await publishDataFiles(pendingFiles, {
  root: projectRoot,
  validate: async (candidateRoot) => {
    const { stdout } = await promisify(execFile)(process.execPath, [
      join(projectRoot, "scripts", "validate-data.mjs"),
      "--root",
      candidateRoot,
    ]);
    process.stdout.write(stdout);
  },
});

console.log(
  `Updated ${indicators.length} indicators from ${manifest.datasets.length} official Eurostat datasets.`,
);
