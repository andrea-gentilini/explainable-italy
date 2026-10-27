import { useSyncExternalStore } from "react";
import type { DataPoint, Indicator, Locale } from "./dashboard-types";
import {
  copy,
  countryNames,
  sourceDimensionLabels,
  sourceValueLabels,
} from "./dashboard-copy";

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const themeStorageKey = "explainable-italy-theme";

export function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}

export function getThemeSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

export function pageHref(locale: Locale, path = "") {
  const localeRoot = locale === "en" ? `${basePath}/en` : basePath;
  return `${localeRoot}${path ? `/${path}` : ""}/`;
}

// The URL keeps browsing context shareable and survives navigation and Back.
const queryChangeEvent = "explainable-italy-query-change";

export function notifyQueryChange() {
  window.dispatchEvent(new Event(queryChangeEvent));
}

function subscribeToQuery(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(queryChangeEvent, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(queryChangeEvent, onChange);
  };
}

export function useLocationQuery() {
  return useSyncExternalStore(
    subscribeToQuery,
    () => window.location.search,
    () => "",
  );
}

export function updateQuery(
  values: Record<string, string | null>,
  push = false,
) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.href === window.location.href) return;
  window.history[push ? "pushState" : "replaceState"](null, "", url);
  window.dispatchEvent(new Event(queryChangeEvent));
}

export function withQuery(href: string, query: string, year?: number) {
  const params = new URLSearchParams(query);
  if (year !== undefined) params.set("year", String(year));
  const suffix = params.toString();
  return `${href}${suffix ? `?${suffix}` : ""}`;
}

export function getDisplayedPoint(indicator: Indicator): DataPoint {
  return indicator.newerEstimate ?? indicator.latest;
}

export function selectedPoint(indicator: Indicator, year: string | null): DataPoint {
  if (String(indicator.latest.year) === year) return indicator.latest;
  if (indicator.newerEstimate && String(indicator.newerEstimate.year) === year) {
    return indicator.newerEstimate;
  }
  return (
    indicator.series.find((point) => String(point.year) === year) ??
    getDisplayedPoint(indicator)
  );
}

export function getBreakYears(indicator: Indicator) {
  return [
    ...new Set([
      ...indicator.series
        .filter((point) => point.status?.includes("b"))
        .map((point) => point.year),
      ...indicator.notes
        .filter((note) => note.type === "method_change" && note.year)
        .map((note) => note.year as number),
    ]),
  ].sort((left, right) => left - right);
}

export function getSourceSelection(indicator: Indicator, locale: Locale) {
  const url = new URL(indicator.source.apiUrl);
  const valuesByDimension = new Map<string, string[]>();

  for (const [dimension, value] of url.searchParams) {
    if (["lang", "sinceTimePeriod", "geo"].includes(dimension)) continue;
    const values = valuesByDimension.get(dimension) ?? [];
    if (!values.includes(value)) values.push(value);
    valuesByDimension.set(dimension, values);
  }

  return [...valuesByDimension].map(([dimension, values]) => ({
    dimension,
    label: sourceDimensionLabels[locale][dimension] ?? dimension,
    value: values
      .map((value) => sourceValueLabels[locale][value] ?? value)
      .join(", "),
    codes: values.join(", "),
  }));
}

export function formatValue(
  value: number,
  unitKey: string,
  precision: number,
  locale: Locale,
) {
  const number = new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);

  const units: Record<Locale, Record<string, string>> = {
    it: {
      percent_gdp: "% del PIL",
      percent_spending: "% della spesa",
      percent: "%",
      percent_change: "%",
      years: " anni",
      children_per_woman: " figli per donna",
      per_100: " ogni 100",
      eu_index: " (UE = 100)",
      index_1990: " (1990 = 100)",
      tonnes_co2e: " t CO₂e per persona",
      toe_per_capita: " tep per persona",
    },
    en: {
      percent_gdp: "% of GDP",
      percent_spending: "% of spending",
      percent: "%",
      percent_change: "%",
      years: " years",
      children_per_woman: " children per woman",
      per_100: " per 100",
      eu_index: " (EU = 100)",
      index_1990: " (1990 = 100)",
      tonnes_co2e: " t CO₂e per person",
      toe_per_capita: " toe per person",
    },
  };

  return `${number}${units[locale][unitKey] ?? ""}`;
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatBytes(bytes: number, locale: Locale) {
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `${new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB").format(kb)} KB`;
}

export function formatOriginalInstitution(name: string, locale: Locale): string {
  if (name.includes("European Environment Agency")) {
    return locale === "it"
      ? "Agenzia europea dell’ambiente (EEA), su dati d’inventario UNFCCC"
      : name;
  }
  return name;
}

export function formatEuro(amount: number, locale: Locale, digits = 1): string {
  const formatted = new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  return locale === "it" ? `${formatted} €` : `€${formatted}`;
}

export function formatYearsList(years: number[], locale: Locale): string {
  if (years.length === 0) return "";
  if (locale === "it") {
    if (years.length === 1) return `nel ${years[0]}`;
    return new Intl.ListFormat("it-IT", { style: "long", type: "conjunction" }).format(
      years.map((y) => `nel ${y}`),
    );
  }
  return new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" }).format(
    years.map(String),
  );
}

export function formatRange(
  minimum: number,
  maximum: number,
  unitKey: string,
  precision: number,
  locale: Locale,
): string {
  const minNum = new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(minimum);
  const maxFormatted = formatValue(maximum, unitKey, precision, locale);
  return `${minNum} – ${maxFormatted}`;
}

export function countryList(codes: string[], locale: Locale) {
  return new Intl.ListFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "long",
    type: "conjunction",
  }).format(
    codes
      .map((code) => countryNames[locale][code] ?? code)
      .sort((a, b) => a.localeCompare(b, locale === "it" ? "it" : "en")),
  );
}

export function statusDescription(
  status: string | null,
  locale: Locale,
  includeCode = true,
) {
  if (!status) return copy[locale].sourceNoFlags;
  const labels = copy[locale];
  const statusLabels: Record<string, string> = {
    p: labels.statusProvisional,
    e: labels.statusEstimated,
    b: labels.statusBreak,
    d: labels.statusDefinition,
    u: labels.statusLowReliability,
    i: labels.statusImputed,
    f: labels.statusForecast,
  };
  const descriptions = [...new Set([...status])]
    .map((code) => statusLabels[code])
    .filter(Boolean);

  return descriptions.length
    ? includeCode
      ? `${descriptions.join(", ")} (${status})`
      : descriptions.join(", ")
    : `${labels.statusFlagged} (${status})`;
}

export function formatFlaggedCountryCount(count: number, locale: Locale) {
  const labels = copy[locale];
  const template =
    count === 1
      ? labels.comparisonCountryFlagged
      : labels.comparisonCountriesFlagged;
  return template.replace("{count}", String(count));
}

export function fillCount(template: string, coverage: number) {
  return template.replace("{coverage}", String(coverage));
}
