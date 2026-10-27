import type { Metadata } from "next";
import source from "../data/processed/dashboard.json";
import type {
  DashboardData,
  DashboardView,
  Indicator,
  Locale,
} from "./components/dashboard-types";
import { pageMetadata } from "./metadata";

const data = source as DashboardData;

function stripCountries(indicator: Indicator, keepSeries: boolean): Indicator {
  return {
    ...indicator,
    series: keepSeries
      ? indicator.series.map((point) => ({ ...point, countries: undefined }))
      : [],
    latest: { ...indicator.latest, countries: undefined },
    newerEstimate: indicator.newerEstimate
      ? { ...indicator.newerEstimate, countries: undefined }
      : null,
  };
}

// Static editorial pages need no indicator payload; overview/catalogue pages
// only need summary metadata and latest points, never full time series or
// 27-country audit tables.
export function pageData(view: DashboardView): DashboardData {
  if (view === "about" || view === "method" || view === "contribute") {
    return {
      ...data,
      indicators: [],
    };
  }

  return {
    ...data,
    indicators: data.indicators.map((indicator) =>
      stripCountries(indicator, false),
    ),
  };
}

export function allIndicatorParams() {
  return data.indicators.map((indicator) => ({ id: indicator.id }));
}

export function indicatorPageMetadata(locale: Locale, id: string): Metadata {
  const indicator = data.indicators.find((entry) => entry.id === id);
  const fallback = locale === "it" ? "Indicatore" : "Indicator";
  return pageMetadata(
    locale,
    `data/${id}`,
    indicator?.title[locale] ?? fallback,
    indicator?.plain[locale],
  );
}

export function indicatorPageData(id: string): DashboardData | null {
  const indicator = data.indicators.find((entry) => entry.id === id);
  if (!indicator) return null;

  const pageIndicators =
    id === "spending-social-protection"
      ? data.indicators.filter((entry) =>
          [
            "spending-social-protection",
            "spending-old-age",
            "pension-expenditure",
          ].includes(entry.id),
        )
      : [indicator];

  return {
    ...data,
    indicators: pageIndicators.map((entry) => stripCountries(entry, true)),
  };
}

export function indicatorSourcePageMetadata(
  locale: Locale,
  id: string,
): Metadata {
  const indicator = data.indicators.find((entry) => entry.id === id);
  if (locale === "it") {
    return pageMetadata(
      "it",
      `data/${id}/source`,
      indicator ? `Fonte · ${indicator.title.it}` : "Fonte",
      indicator
        ? `Fonte, selezione e calcolo: ${indicator.title.it}.`
        : undefined,
    );
  }
  return pageMetadata(
    "en",
    `data/${id}/source`,
    indicator ? `Source · ${indicator.title.en}` : "Source",
    indicator
      ? `Source, selection and calculation: ${indicator.title.en}.`
      : undefined,
  );
}

export function indicatorSourcePageData(id: string): DashboardData | null {
  const indicator = data.indicators.find((entry) => entry.id === id);
  if (!indicator) return null;

  return {
    ...data,
    indicators: [indicator],
  };
}
