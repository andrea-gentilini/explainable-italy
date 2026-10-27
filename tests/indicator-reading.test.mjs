import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildCumulativeIndexSeries,
  getIndicatorReading,
  supportedReadingIds,
} from "../app/components/indicator-reading.mjs";

const dashboard = JSON.parse(await readFile(new URL("../data/processed/dashboard.json", import.meta.url), "utf8"));
const byId = new Map(dashboard.indicators.map((indicator) => [indicator.id, indicator]));

function reading(id, point, locale = "it") {
  return getIndicatorReading(byId.get(id), point, locale);
}

test("all published indicators have a specific bilingual reading for every year", () => {
  assert.deepEqual(new Set(supportedReadingIds), new Set(byId.keys()));
  for (const indicator of dashboard.indicators) {
    for (const point of indicator.series) {
      for (const locale of ["it", "en"]) {
        const result = getIndicatorReading(indicator, point, locale);
        assert.ok(result?.description.includes(String(point.year)), indicator.id);
        assert.doesNotMatch(result.description, /undefined|NaN|\{year\}|\{value\}/);
        assert.doesNotMatch(result.description, /nell’unità riportata|in the unit shown/);
        assert.ok(result?.caution && result.caution.length > 20, `${indicator.id} (${locale}): has a neutral methodological caution`);
        if (point.eu === null) assert.equal(result.comparison, null);
      }
    }
  }
});

test("percentage-rate comparisons use percentage points, including negative rates", () => {
  const point = { year: 2031, italy: 67.6, eu: 76.1 };
  assert.match(reading("employment-rate", point).description, /20 e 64/);
  assert.match(reading("employment-rate", point).comparison, /8,5 punti percentuali sotto/);
  assert.match(reading("employment-rate", point, "en").comparison, /8.5 percentage points below/);
  const negative = reading("budget-balance", { year: 2031, italy: -3, eu: -4 });
  assert.match(negative.comparison, /1,0 punto percentuale sopra/);
});

test("population, labour-force and spending denominators remain distinct", () => {
  const point = { year: 2031, italy: 25, eu: 20 };
  assert.match(reading("employment-rate", point).description, /residenti in Italia tra 20 e 64/);
  assert.match(reading("youth-unemployment", point).description, /forza lavoro italiana tra 15 e 24/);
  assert.match(reading("poverty-or-exclusion", point).description, /persone in famiglie private/);
  assert.match(reading("spending-health", point).description, /25,0 € ogni 100 € di spesa/);
  assert.match(reading("total-public-expenditure", point).description, /25,0% del PIL/);
  assert.match(reading("old-age-dependency", point).description, /65 anni ogni 100 persone tra 15 e 64/);
  assert.doesNotMatch(reading("old-age-dependency", point).comparison, /percentuali|%/);
});

test("GDP PPS explains the relative index and uses the selected observation", () => {
  const first = reading("gdp-per-capita-pps", { year: 2031, italy: 98, eu: 100 });
  assert.match(first.description, /2031/);
  assert.match(first.description, /98 su una scala/);
  assert.match(first.comparison, /2% sotto/);
  assert.match(first.caution, /UE dello stesso anno/);
  const changed = reading("gdp-per-capita-pps", { year: 2032, italy: 104, eu: 100 }, "en");
  assert.match(changed.comparison, /4% above/);
  assert.match(changed.description, /2032/);
});

test("an emissions index is a share of its own 1990 baseline, with no invented EU comparison", () => {
  const result = reading("greenhouse-gas-emissions", { year: 2031, italy: 73.5, eu: null });
  assert.match(result.description, /73,5% del livello del 1990/);
  assert.equal(result.comparison, null);
  assert.equal(reading("greenhouse-gas-emissions", { year: 2031, italy: 73.5, eu: 80 }).comparison, null);
});

test("annual changes handle growth, decline and rounded zero without reversing the meaning", () => {
  assert.match(reading("real-gdp-growth-per-capita", { year: 2031, italy: -1.2, eu: 0.3 }).description, /diminuito del 1,2%/);
  assert.match(reading("inflation", { year: 2031, italy: 2.5, eu: 1 }).description, /aumentati del 2,5%/);
  assert.match(reading("inflation", { year: 2031, italy: -0.001, eu: 0 }, "en").description, /were unchanged at the displayed precision/);
  assert.doesNotMatch(reading("inflation", { year: 2031, italy: -0.001, eu: 0 }).description, /-0|−0/);
});

test("small differences do not become claims of an exact numerical equality", () => {
  const result = reading("employment-rate", { year: 2031, italy: 70.01, eu: 70.02 });
  assert.match(result.comparison, /alla precisione mostrata/);
  const boundary = reading("employment-rate", { year: 2031, italy: 70.04, eu: 70.06 });
  assert.match(boundary.comparison, /inferiore a 0,1 punti percentuali/);
  assert.doesNotMatch(boundary.comparison, /stesso valore/);
});

test("life expectancy and median age retain their essential interpretation", () => {
  const point = { year: 2031, italy: 80, eu: 78 };
  assert.match(reading("life-expectancy", point).caution, /mortalità.*invariati.*neonato/);
  assert.match(reading("median-age", point).description, /1º gennaio 2031/);
  assert.match(reading("median-age", point).caution, /età mediane nazionali/);
});

test("unavailable EU values and unknown units cannot produce a fabricated comparison", () => {
  const point = { year: 2031, italy: 5, eu: null };
  assert.equal(reading("employment-rate", point).comparison, null);
  const unknown = { id: "future-indicator", unitKey: "unknown", precision: 1 };
  const result = getIndicatorReading(unknown, { ...point, eu: 3 }, "en");
  assert.match(result.description, /unit shown on the card/);
  assert.equal(result.comparison, null);
  assert.equal(getIndicatorReading(unknown, { ...point, italy: NaN }, "it"), null);
});

test("historical pension halfway values match the card’s Intl rounding", () => {
  const pension = byId.get("pension-expenditure");
  for (const [year, raw, it, en] of [[2004, 13.95, "14,0", "14.0"], [2011, 15.35, "15,4", "15.4"]]) {
    const point = pension.series.find((point) => point.year === year);
    assert.equal(point.italy, raw);
    assert.ok(reading("pension-expenditure", point, "it").description.includes(it + "%"));
    assert.ok(reading("pension-expenditure", point, "en").description.includes(en + "%"));
  }
});

test("every historical reading uses the same numeric value as direct Intl formatting", () => {
  for (const indicator of dashboard.indicators) {
    for (const point of indicator.series) {
      for (const locale of ["it", "en"]) {
        const formatter = new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
          minimumFractionDigits: indicator.precision,
          maximumFractionDigits: indicator.precision,
        });
        const annualChange = ["real-gdp-growth-per-capita", "inflation"].includes(indicator.id);
        const value = annualChange ? Math.abs(point.italy) : point.italy;
        const expected = formatter.format(value);
        const result = getIndicatorReading(indicator, point, locale);
        if (annualChange && expected === formatter.format(0)) {
          assert.match(result.description, /invariat|unchanged/);
        } else {
          assert.ok(result.description.includes(expected), indicator.id + " " + point.year + " " + locale + ": expected " + expected + " in " + result.description);
        }
      }
    }
  }
});

test("change magnitudes and rounding thresholds also follow Intl", () => {
  const result = reading("inflation", {year: 2031, italy: -0.15, eu: 0});
  assert.match(result.description, /diminuiti del 0,2%/);
  assert.match(result.comparison, /0,2 punti percentuali sotto/);
  const distinct = reading("employment-rate", {year: 2031, italy: 13.95, eu: 13.94});
  assert.match(distinct.comparison, /inferiore a 0,1 punti percentuali/);
  assert.doesNotMatch(distinct.comparison, /stesso valore/);
  const same = reading("employment-rate", {year: 2031, italy: 13.95, eu: 14});
  assert.match(same.comparison, /alla precisione mostrata/);
});

test("annual rate-of-change indicators include a caution distinguishing rates from index levels", () => {
  const inflationIt = reading("inflation", { year: 2025, italy: 1.7, eu: 2.4 }, "it");
  const inflationEn = reading("inflation", { year: 2025, italy: 1.7, eu: 2.4 }, "en");
  assert.match(inflationIt.caution, /disinflazione/);
  assert.match(inflationEn.caution, /disinflation/);
  const gdpIt = reading("real-gdp-growth-per-capita", { year: 2025, italy: 0.7, eu: 1.4 }, "it");
  const gdpEn = reading("real-gdp-growth-per-capita", { year: 2025, italy: 0.7, eu: 1.4 }, "en");
  assert.match(gdpIt.caution, /tasso di variazione annuo/);
  assert.match(gdpEn.caution, /annual rate of change/);
});

test("buildCumulativeIndexSeries computes chain-linked indices and supports rebasing", () => {
  const sample = [
    { year: 2021, italy: 10, eu: 5 },
    { year: 2022, italy: 10, eu: 10 },
  ];
  const defaultSeries = buildCumulativeIndexSeries(sample);
  assert.equal(defaultSeries.baseYear, 2020);
  assert.deepEqual(defaultSeries.availableBaseYears, [2020, 2021, 2022]);
  assert.ok(Math.abs(defaultSeries.points[0].italyIndex - 110) < 1e-9);
  assert.ok(Math.abs(defaultSeries.points[1].italyIndex - 121) < 1e-9);
  assert.ok(Math.abs(defaultSeries.points[0].euIndex - 105) < 1e-9);
  assert.ok(Math.abs(defaultSeries.points[1].euIndex - 115.5) < 1e-9);

  const rebased = buildCumulativeIndexSeries(sample, 2021);
  assert.equal(rebased.baseYear, 2021);
  assert.ok(Math.abs(rebased.points[0].italyIndex - 100) < 1e-9);
  assert.ok(Math.abs(rebased.points[1].italyIndex - 110) < 1e-9);
});
