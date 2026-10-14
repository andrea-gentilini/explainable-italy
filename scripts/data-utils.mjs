export const euCountries = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "EL",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
];

function getPositionCodes(dimension) {
  if (!dimension?.category?.index) throw new Error("Missing Eurostat dimension codes");
  if (Array.isArray(dimension.category.index)) return dimension.category.index;
  const entries = Object.entries(dimension.category.index)
    .sort((left, right) => left[1] - right[1]);
  if (entries.some(([, position], index) => position !== index)) {
    throw new Error("Invalid Eurostat dimension positions");
  }
  return entries.map(([code]) => code);
}

export function flattenJsonStat(dataset) {
  if (
    dataset.class !== "dataset" || !Array.isArray(dataset.id) ||
    !Array.isArray(dataset.size) || dataset.id.length !== dataset.size.length ||
    !dataset.id.includes("geo") || !dataset.id.includes("time") ||
    !dataset.value || typeof dataset.value !== "object"
  ) {
    throw new Error("Invalid Eurostat JSON-stat dataset");
  }
  dataset.id.forEach((dimensionId, index) => {
    const codes = getPositionCodes(dataset.dimension?.[dimensionId]);
    if (codes.length !== dataset.size[index] || new Set(codes).size !== codes.length) {
      throw new Error(`Invalid Eurostat dimension: ${dimensionId}`);
    }
  });
  const cellCount = dataset.size.reduce((total, size) => total * size, 1);
  const positionCodes = Object.fromEntries(
    dataset.id.map((dimensionId) => [
      dimensionId,
      getPositionCodes(dataset.dimension[dimensionId]),
    ]),
  );

  return Object.entries(dataset.value).map(([flatIndex, value]) => {
    let remainder = Number(flatIndex);
    if (!Number.isInteger(remainder) || remainder < 0 || remainder >= cellCount) {
      throw new Error(`Invalid Eurostat cell index: ${flatIndex}`);
    }
    if (value !== null && !Number.isFinite(value)) {
      throw new Error(`Invalid Eurostat observation: ${flatIndex}`);
    }
    const coordinates = new Array(dataset.id.length);

    for (let index = dataset.id.length - 1; index >= 0; index -= 1) {
      coordinates[index] = remainder % dataset.size[index];
      remainder = Math.floor(remainder / dataset.size[index]);
    }

    const record = {
      value,
      status: dataset.status?.[flatIndex] ?? null,
    };

    dataset.id.forEach((dimensionId, index) => {
      record[dimensionId] = positionCodes[dimensionId][coordinates[index]];
    });

    return record;
  });
}

export function matchesSelector(record, selector) {
  return Object.entries(selector).every(
    ([dimension, expectedValue]) => record[dimension] === expectedValue,
  );
}

export function isEstimateOrProvisional(status) {
  return typeof status === "string" && /[epf]/.test(status);
}

export function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return normalizeNumber((sorted[middle - 1] + sorted[middle]) / 2);
}

export function normalizeNumber(value) {
  return Number(value.toFixed(10));
}

export function mergeStatus(...statuses) {
  const codes = statuses.map((status) => status ?? "").join("")
    .replaceAll(":", "")
    .replaceAll(" ", "");
  return codes ? [...new Set(codes)].join("") : null;
}

export function buildSeries(records, selector, statusOverrides = {}, euStatusOverrides = {}, countryStatusOverrides = {}) {
  const selectedRecords = records.filter((record) =>
    matchesSelector(record, selector),
  );
  const byYear = new Map();

  for (const record of selectedRecords) {
    const year = Number(record.time);
    if (!Number.isInteger(year) || year < 2000) continue;

    if (!byYear.has(year)) byYear.set(year, new Map());
    if (byYear.get(year).has(record.geo)) {
      throw new Error(`Ambiguous selection: multiple observations for ${record.geo}, ${year}`);
    }
    byYear.get(year).set(record.geo, record);
  }

  return [...byYear.entries()]
    .sort(([leftYear], [rightYear]) => leftYear - rightYear)
    .flatMap(([year, geographyRecords]) => {
      const italyRecord = geographyRecords.get("IT");
      const euRecord = geographyRecords.get("EU27_2020");
      const countries = euCountries.flatMap((geography) => {
        const record = geographyRecords.get(geography);
        if (!Number.isFinite(record?.value)) return [];
        return [
          {
            geo: geography,
            value: record.value,
            status: mergeStatus(record.status, countryStatusOverrides[geography]?.["*"], countryStatusOverrides[geography]?.[year]),
            sourceStatus: record.status,
          },
        ];
      });
      const countryValues = countries.map((country) => country.value);

      if (!Number.isFinite(italyRecord?.value) || countryValues.length < 24) {
        return [];
      }

      const hasOfficialAggregate = Number.isFinite(euRecord?.value);
      const effectiveItalyStatus = mergeStatus(
        italyRecord.status,
        statusOverrides[year],
        countryStatusOverrides.IT?.["*"],
        countryStatusOverrides.IT?.[year],
      );
      const effectiveCountries = countries.map((country) =>
        country.geo === "IT"
          ? { ...country, status: effectiveItalyStatus }
          : country,
      );

      return [
        {
          year,
          italy: italyRecord.value,
          eu: hasOfficialAggregate ? euRecord.value : null,
          median: median(countryValues),
          coverage: countryValues.length,
          euMethod: hasOfficialAggregate
            ? "official_aggregate"
            : "unavailable",
          status: effectiveItalyStatus,
          sourceStatus: italyRecord.status,
          euStatus: hasOfficialAggregate
            ? mergeStatus(euRecord.status, euStatusOverrides[year], countryStatusOverrides.EU27_2020?.["*"], countryStatusOverrides.EU27_2020?.[year])
            : null,
          euSourceStatus: hasOfficialAggregate ? euRecord.status : null,
          countryStatuses: effectiveCountries
            .filter((country) => country.status)
            .map(({ geo, status }) => ({ geo, status })),
          missingCountries: euCountries.filter(
            (geography) =>
              !countries.some((country) => country.geo === geography),
          ),
          countries: effectiveCountries,
        },
      ];
    });
}

export function csvEscape(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function csvNumber(value) {
  return Number.isFinite(value) ? String(normalizeNumber(value)) : "";
}

export function buildIndicatorCsv(indicator) {
  const rows = [
    [
      "year", "italy", "eu_official", "median", "countries_in_median",
      "eu_method", "italy_status", "eu_status", "flagged_countries", "missing_countries",
      "unit", "dataset",
    ],
    ...indicator.series.map((point) => [
      point.year, csvNumber(point.italy), csvNumber(point.eu), csvNumber(point.median),
      point.coverage, point.euMethod, point.status, point.euStatus,
      point.countryStatuses.map(({ geo, status }) => `${geo}:${status}`).join("|"),
      point.missingCountries.join("|"), indicator.unitKey, indicator.source.datasetCode,
    ]),
  ];
  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}
