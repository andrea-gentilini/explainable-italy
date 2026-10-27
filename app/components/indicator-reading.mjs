import {
  annualChangeReadings as annualChanges,
  indicatorReadings as templates,
} from "../../scripts/indicator-catalog.mjs";

/**
 * Plain-language readings of the selected observation.
 * Definitions follow scripts/indicator-catalog.mjs. Numbers such as age limits,
 * the index base and reference populations are definitions, not observations.
 *
 * @typedef {{id: string, unitKey: string, precision: number}} ReadingIndicator
 * @typedef {{year: number, italy: number, eu: number|null}} ReadingPoint
 * @typedef {'it'|'en'} Locale
 */

/**
 * Builds a chain-linked cumulative index (baseYear = 100) from annual percentage rates of change.
 * @param {Array<{year: number, italy: number, eu: number|null, status?: string|null}>} series
 * @param {number} [requestedBaseYear]
 */
export function buildCumulativeIndexSeries(series, requestedBaseYear) {
  if (!Array.isArray(series) || series.length === 0) {
    return null;
  }
  const sorted = [...series].sort((left, right) => left.year - right.year);
  const initialBaseYear = sorted[0].year - 1;
  const rawPoints = [
    { year: initialBaseYear, italyRaw: 100, euRaw: 100, status: null, isBaseline: true },
  ];
  let italyCursor = 100;
  let euCursor = 100;

  for (const point of sorted) {
    italyCursor *= 1 + point.italy / 100;
    euCursor =
      euCursor !== null && point.eu !== null && Number.isFinite(point.eu)
        ? euCursor * (1 + point.eu / 100)
        : null;
    rawPoints.push({
      year: point.year,
      italyRaw: italyCursor,
      euRaw: euCursor,
      status: point.status ?? null,
      isBaseline: false,
    });
  }

  const availableBaseYears = rawPoints.map((entry) => entry.year);
  const baseEntry =
    rawPoints.find((entry) => entry.year === requestedBaseYear) ?? rawPoints[0];

  const points = rawPoints
    .filter((entry) => !entry.isBaseline)
    .map((entry) => {
      const italy = Number(((entry.italyRaw / baseEntry.italyRaw) * 100).toFixed(10));
      const eu =
        entry.euRaw !== null && baseEntry.euRaw !== null && baseEntry.euRaw > 0
          ? Number(((entry.euRaw / baseEntry.euRaw) * 100).toFixed(10))
          : null;
      return {
        year: entry.year,
        italy,
        eu,
        italyIndex: italy,
        euIndex: eu,
        italyCumulativeChange: Number((italy - 100).toFixed(10)),
        euCumulativeChange: eu !== null ? Number((eu - 100).toFixed(10)) : null,
        status: entry.status,
      };
    });

  return {
    baseYear: baseEntry.year,
    availableBaseYears,
    points,
  };
}

export const supportedReadingIds = Object.freeze([
  ...Object.keys(templates),
  ...Object.keys(annualChanges),
]);

/** @param {number} value @param {number} precision */
function rounded(value, precision) {
  // Match the card’s Intl decimal rounding, including halfway values.
  const result = Number(new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: false,
  }).format(value));
  return Object.is(result, -0) ? 0 : result;
}

/** @param {number} value @param {number} precision @param {Locale} locale */
function format(value, precision, locale) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

/** @param {ReadingIndicator} indicator @param {ReadingPoint} point @param {Locale} locale */
function comparison(indicator, point, locale) {
  if (point.eu === null || !Number.isFinite(point.eu)) return null;
  const precision = Math.min(10, Math.max(0, Math.trunc(indicator.precision)));
  const difference = point.italy - point.eu;

  // Each emissions index has its own national 1990 base. The current source
  // has no comparable EU aggregate, so this reading never invents one.
  if (indicator.unitKey === "index_1990") return null;

  if (indicator.id === "old-age-dependency") {
    const value = format(point.eu, precision, locale);
    return locale === "it"
      ? "Nell’UE il rapporto era " + value + " persone di almeno 65 anni ogni 100 tra 15 e 64 anni."
      : "The EU ratio was " + value + " people aged 65 or over per 100 people aged 15 to 64.";
  }

  /** @type {Record<string, {it: string, en: string}>} */
  const differenceUnits = {
    percent: { it: "punti percentuali", en: "percentage points" },
    percent_gdp: { it: "punti percentuali", en: "percentage points" },
    percent_spending: { it: "punti percentuali", en: "percentage points" },
    percent_change: { it: "punti percentuali", en: "percentage points" },
    years: { it: "anni", en: "years" },
    children_per_woman: { it: "figli per donna", en: "children per woman" },
  };

  let gap = difference;
  let unit = differenceUnits[indicator.unitKey]?.[locale];
  if (indicator.id === "gdp-per-capita-pps" && point.eu > 0) {
    gap = difference / point.eu * 100;
    unit = "%";
  }
  if (!unit) return null;

  const value = format(Math.abs(gap), precision, locale);
  const sameDisplayedValue = format(point.italy, precision, locale) === format(point.eu, precision, locale);
  if (sameDisplayedValue || rounded(gap, precision) === 0) {
    if (sameDisplayedValue) {
      return locale === "it"
        ? "Italia e UE avevano lo stesso valore alla precisione mostrata."
        : "Italy and the EU had the same value at the displayed precision.";
    }
    const limit = format(10 ** -precision, precision, locale);
    return locale === "it"
      ? "Il divario era inferiore a " + limit + " " + unit + "."
      : "The gap was less than " + limit + " " + unit + ".";
  }
  if (Math.abs(rounded(gap, precision)) === 1) {
    const singular = {
      "punti percentuali": "punto percentuale",
      "percentage points": "percentage point",
      anni: "anno",
      years: "year",
      "figli per donna": "figlio per donna",
      "children per woman": "child per woman",
    };
    unit = singular[unit] ?? unit;
  }
  if (unit === "%") {
    return locale === "it"
      ? "Il valore italiano era circa il " + value + "% " + (gap > 0 ? "sopra" : "sotto") + " quello UE."
      : "Italy’s value was approximately " + value + "% " + (gap > 0 ? "above" : "below") + " the EU value.";
  }
  return locale === "it"
    ? "Il valore italiano era circa " + value + " " + unit + " " + (gap > 0 ? "sopra" : "sotto") + " quello UE."
    : "Italy’s value was approximately " + value + " " + unit + " " + (gap > 0 ? "above" : "below") + " the EU value.";
}

/**
 * @param {ReadingIndicator} indicator
 * @param {ReadingPoint} point
 * @param {Locale} locale
 * @returns {{description: string, comparison: string|null, caution: string|null}|null}
 */
export function getIndicatorReading(indicator, point, locale) {
  if (!Number.isFinite(point.italy) || !Number.isInteger(point.year)) return null;
  const precision = Number.isFinite(indicator.precision)
    ? Math.min(10, Math.max(0, Math.trunc(indicator.precision)))
    : 1;
  const safeIndicator = { ...indicator, precision };
  const value = format(point.italy, precision, locale);
  const template = templates[indicator.id];
  const change = annualChanges[indicator.id];
  let description;

  if (change) {
    const unchanged = rounded(point.italy, precision) === 0;
    const magnitude = format(Math.abs(point.italy), precision, locale);
    if (locale === "it") {
      const plural = indicator.id === "inflation";
      const verb = unchanged
        ? (plural ? "sono rimasti invariati alla precisione mostrata" : "è rimasto invariato alla precisione mostrata")
        : (plural ? "sono " : "è ") + (point.italy > 0
          ? (plural ? "aumentati" : "aumentato")
          : (plural ? "diminuiti" : "diminuito")) + " del " + magnitude + "%";
      description = "Nel " + point.year + ", " + change.it + " " + verb + " rispetto all’anno precedente.";
    } else {
      const verb = unchanged
        ? "was unchanged at the displayed precision"
        : (point.italy > 0 ? "increased" : "decreased") + " by " + magnitude + "%";
      description = "In " + point.year + ", " + change.en + " " +
        (indicator.id === "inflation" ? verb.replace("was unchanged", "were unchanged") : verb) +
        " compared with the previous year.";
    }
  } else if (template) {
    description = template[locale].replaceAll("{year}", String(point.year)).replaceAll("{value}", value);
  } else {
    description = locale === "it"
      ? "Nel " + point.year + ", il valore italiano era " + value + " nell’unità riportata nella scheda."
      : "In " + point.year + ", Italy’s value was " + value + " in the unit shown on the card.";
  }

  return {
    description,
    comparison: comparison(safeIndicator, point, locale),
    caution: (template?.caution ?? change?.caution)?.[locale] ?? null,
  };
}
