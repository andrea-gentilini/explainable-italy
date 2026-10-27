"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildCumulativeIndexSeries } from "./indicator-reading.mjs";
import { copy } from "./dashboard-copy";
import type { Indicator, Locale } from "./dashboard-types";
import {
  formatRange,
  formatValue,
  getBreakYears,
  getDisplayedPoint,
  statusDescription,
  updateQuery,
} from "./dashboard-utils";

export function TrendBars({
  indicator,
  locale,
  selectedYear,
}: {
  indicator: Indicator;
  locale: Locale;
  selectedYear: number;
}) {
  const labels = copy[locale];
  const points = indicator.series;
  const firstYear = points[0].year;
  const lastYear = points[points.length - 1].year;
  const isPercentChange = indicator.unitKey === "percent_change";
  const defaultBaseYear = firstYear - 1;
  const [trendMode, setTrendMode] = useState<"rate" | "index">("rate");
  const [baseYear, setBaseYear] = useState<number>(defaultBaseYear);
  const cumulative = useMemo(
    () => (isPercentChange ? buildCumulativeIndexSeries(points, baseYear) : null),
    [isPercentChange, points, baseYear],
  );
  const cumulativeByYear = useMemo(
    () =>
      new Map((cumulative?.points ?? []).map((entry) => [entry.year, entry])),
    [cumulative],
  );
  const showingIndex = Boolean(cumulative && trendMode === "index");
  const values = showingIndex
    ? (cumulative?.points ?? []).map((entry) => entry.italyIndex)
    : points.map((point) => point.italy);
  const minimum = showingIndex ? 0 : Math.min(0, ...values);
  const maximum = showingIndex
    ? Math.max(100, ...values)
    : Math.max(0, ...values);
  const range = maximum - minimum || 1;
  const zeroPosition = showingIndex
    ? ((maximum - 100) / range) * 100
    : (maximum / range) * 100;
  const breakYears = new Set(getBreakYears(indicator));
  const rangeLabel = labels.trendRange
    .replace("{start}", String(firstYear))
    .replace("{end}", String(lastYear));
  const selected =
    points.find((point) => point.year === selectedYear) ??
    getDisplayedPoint(indicator);
  const selectedCumulative = cumulativeByYear.get(selected.year) ?? null;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollRef.current;
    const active = container?.querySelector<HTMLButtonElement>(
      'button[aria-pressed="true"]',
    );
    if (container && active) {
      container.scrollLeft =
        active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2;
    }
  }, [selectedYear]);
  const value = (number: number) =>
    formatValue(number, indicator.unitKey, indicator.precision, locale);
  const formatIndexNumber = (number: number) =>
    new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(number);
  const formatIndexWithBase = (number: number) =>
    `${formatIndexNumber(number)} (${cumulative?.baseYear ?? defaultBaseYear} = 100)`;

  return (
    <>
      {cumulative ? (
        <div className="trend-mode-toolbar">
          <div
            className="trend-mode-switch"
            role="group"
            aria-label={
              locale === "it"
                ? "Misura del grafico storico"
                : "Historical chart measure"
            }
          >
            <button
              type="button"
              aria-pressed={!showingIndex}
              onClick={() => setTrendMode("rate")}
            >
              {locale === "it" ? "Variazione annua (%)" : "Annual change (%)"}
            </button>
            <button
              type="button"
              aria-pressed={showingIndex}
              onClick={() => setTrendMode("index")}
            >
              {locale === "it"
                ? `Indice cumulato (${cumulative.baseYear} = 100)`
                : `Cumulative index (${cumulative.baseYear} = 100)`}
            </button>
          </div>
          <label className="trend-base-select">
            <span>
              {locale === "it" ? "Anno base (= 100)" : "Base year (= 100)"}
            </span>{" "}
            <select
              value={cumulative.baseYear}
              onChange={(event) => {
                setBaseYear(Number(event.target.value));
                setTrendMode("index");
              }}
            >
              {cumulative.availableBaseYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr} = 100
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <div className="trend-reading" aria-live="polite">
        <span>
          {labels.italy} · {selected.year}
        </span>{" "}
        <strong>
          {showingIndex && selectedCumulative
            ? formatIndexWithBase(selectedCumulative.italyIndex)
            : value(selected.italy)}
        </strong>
        {cumulative && selectedCumulative ? (
          <>
            {" "}
            <small>
              {showingIndex
                ? `${locale === "it" ? "Variazione annua" : "Annual change"}: ${value(selected.italy)}`
                : `${locale === "it" ? "Indice cumulato" : "Cumulative index"}: ${formatIndexWithBase(selectedCumulative.italyIndex)}`}
            </small>
          </>
        ) : null}
      </div>
      <p className="trend-interaction" id={`trend-help-${indicator.id}`}>
        {labels.trendInteraction}
        <span className="visually-hidden"> {labels.trendKeyboardHelp}</span>
      </p>
      <p className="trend-scale">
        {labels.trendScale}:{" "}
        {showingIndex
          ? `${formatIndexNumber(minimum)} – ${formatIndexWithBase(maximum)}`
          : formatRange(
              minimum,
              maximum,
              indicator.unitKey,
              indicator.precision,
              locale,
            )}
      </p>
      <div
        className="trend-scroll"
        ref={scrollRef}
        role="region"
        aria-label={`${labels.trend}. ${rangeLabel}`}
      >
        <div
          className="trend-chart"
          role="group"
          aria-label={labels.trend}
          aria-describedby={`trend-help-${indicator.id}`}
          style={{
            minWidth: `${(lastYear - firstYear + 1) * 1.8}rem`,
            gridTemplateColumns: `repeat(${lastYear - firstYear + 1}, minmax(0, 1fr))`,
          }}
        >
          <span
            className="trend-zero"
            style={{ top: `${zeroPosition}%` }}
            aria-hidden="true"
          />
          {points.map((point, index) => {
            const hasBreak = breakYears.has(point.year);
            const uncertain = /[pef]/.test(point.status ?? "");
            const cumulativeEntry = cumulativeByYear.get(point.year);
            const plottedValue =
              showingIndex && cumulativeEntry
                ? cumulativeEntry.italyIndex
                : point.italy;
            const top = showingIndex
              ? ((maximum - plottedValue) / range) * 100
              : plottedValue >= 0
                ? ((maximum - plottedValue) / range) * 100
                : zeroPosition;
            const height = showingIndex
              ? (plottedValue / range) * 100
              : (Math.abs(plottedValue) / range) * 100;
            const methodNote =
              hasBreak && !point.status?.includes("b")
                ? ` · ${labels.statusMethodNote}`
                : "";
            const description =
              showingIndex && cumulativeEntry
                ? `${point.year}: ${formatIndexWithBase(cumulativeEntry.italyIndex)} (${value(point.italy)}) · ${statusDescription(point.status, locale, false)}${methodNote}`
                : `${point.year}: ${value(point.italy)} · ${statusDescription(point.status, locale, false)}${methodNote}`;
            return (
              <button
                className="trend-column"
                type="button"
                key={point.year}
                style={{ gridColumn: point.year - firstYear + 1 }}
                aria-label={description}
                aria-pressed={point.year === selectedYear}
                tabIndex={point.year === selected.year ? 0 : -1}
                title={description}
                onClick={() => updateQuery({ year: String(point.year) })}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? Math.min(index + 1, points.length - 1)
                      : event.key === "ArrowLeft"
                        ? Math.max(index - 1, 0)
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? points.length - 1
                            : null;
                  if (next === null) return;
                  event.preventDefault();
                  updateQuery({ year: String(points[next].year) });
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>("button")
                    [next]?.focus();
                }}
              >
                <span
                  aria-hidden="true"
                  className={`trend-bar ${!showingIndex && point.italy < 0 ? "negative" : ""} ${hasBreak ? "has-break" : ""} ${uncertain ? "uncertain" : ""}`}
                  style={{ top: `${top}%`, height: `${height}%` }}
                />
                <small aria-hidden="true">
                  {String(point.year).slice(2)}
                  {hasBreak ? <sup>*</sup> : null}
                </small>
              </button>
            );
          })}
        </div>
      </div>
      <p className="trend-legend">{labels.trendLegend}</p>
      <details className="trend-table">
        <summary>{labels.trendTable}</summary>
        <div
          className="country-table-scroll"
          tabIndex={0}
          role="region"
          aria-label={labels.trendTable}
        >
          <table>
            <caption>
              {indicator.title[locale]} · {rangeLabel}
            </caption>
            <thead>
              <tr>
                <th scope="col">{labels.sourceYear}</th>
                <th scope="col">{labels.italy}</th>
                <th scope="col">{labels.eu}</th>
                <th scope="col">{labels.median}</th>
                <th scope="col">{labels.trendCoverage}</th>
                <th scope="col">{labels.sourceItalyStatus}</th>
                {cumulative ? (
                  <>
                    <th scope="col">
                      {locale === "it"
                        ? `Indice Italia (${cumulative.baseYear} = 100)`
                        : `Italy index (${cumulative.baseYear} = 100)`}
                    </th>
                    <th scope="col">
                      {locale === "it"
                        ? `Indice UE (${cumulative.baseYear} = 100)`
                        : `EU index (${cumulative.baseYear} = 100)`}
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => {
                const cumulativeEntry = cumulativeByYear.get(point.year);
                return (
                  <tr
                    key={point.year}
                    data-selected={point.year === selectedYear}
                  >
                    <th scope="row">{point.year}</th>
                    {[point.italy, point.eu, point.median].map((entry, index) => (
                      <td key={index}>{entry === null ? "—" : value(entry)}</td>
                    ))}
                    <td>{point.coverage}/27</td>
                    <td>{statusDescription(point.status, locale, false)}</td>
                    {cumulative ? (
                      <>
                        <td>
                          {cumulativeEntry
                            ? formatIndexNumber(cumulativeEntry.italyIndex)
                            : "—"}
                        </td>
                        <td>
                          {cumulativeEntry?.euIndex !== null &&
                          cumulativeEntry?.euIndex !== undefined
                            ? formatIndexNumber(cumulativeEntry.euIndex)
                            : "—"}
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
