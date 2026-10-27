"use client";

import type { CSSProperties } from "react";
import { ShareLink } from "./ShareLink";
import { IndicatorReading } from "./IndicatorReading";
import { TrendBars } from "./TrendBars";
import { copy, sectionColors } from "./dashboard-copy";
import type { DataPoint, Indicator, Locale } from "./dashboard-types";
import {
  basePath,
  countryList,
  fillCount,
  formatDate,
  formatEuro,
  formatFlaggedCountryCount,
  formatOriginalInstitution,
  formatRange,
  formatValue,
  formatYearsList,
  getBreakYears,
  getDisplayedPoint,
  pageHref,
  selectedPoint,
  statusDescription,
  updateQuery,
  withQuery,
} from "./dashboard-utils";

export function ComparisonPlot({
  indicator,
  locale,
  point = getDisplayedPoint(indicator),
  visual = false,
}: {
  indicator: Indicator;
  locale: Locale;
  point?: DataPoint;
  visual?: boolean;
}) {
  const labels = copy[locale];
  const values = [
    { id: "italy", label: labels.italy, value: point.italy },
    ...(point.eu !== null
      ? [{ id: "eu", label: labels.eu, value: point.eu }]
      : []),
    { id: "median", label: labels.median, value: point.median },
  ];
  const minimum = Math.min(0, ...values.map((entry) => entry.value));
  const maximum = Math.max(
    ["percent", "percent_spending"].includes(indicator.unitKey) ? 100 : 0,
    ...values.map((entry) => entry.value),
  );
  const range = maximum - minimum || 1;
  const position = (value: number) => ((value - minimum) / range) * 100;
  const methodLabel =
    point.euMethod === "official_aggregate"
      ? labels.officialAggregate
      : labels.noAggregate;
  const coverageLabel = fillCount(labels.countriesAvailable, point.coverage);
  const missingLabel = point.missingCountries.length
    ? labels.missingCountries.replace(
        "{countries}",
        countryList(point.missingCountries, locale),
      )
    : "";
  const qualityDetails = [
    ...(point.euStatus ? [labels.comparisonEuFlagged] : []),
    ...(point.countryStatuses.length
      ? [formatFlaggedCountryCount(point.countryStatuses.length, locale)]
      : []),
  ];
  const qualityLabel = qualityDetails.length
    ? labels.comparisonQuality.replace(
        "{details}",
        new Intl.ListFormat(locale === "it" ? "it-IT" : "en-GB", {
          style: "long",
          type: "conjunction",
        }).format(qualityDetails),
      )
    : "";
  const ariaValues = values
    .map(
      (entry) =>
        `${entry.label} ${formatValue(
          entry.value,
          indicator.unitKey,
          indicator.precision,
          locale,
        )}`,
    )
    .join(". ");

  return (
    <div
      className="comparison"
      data-count={values.length}
      data-visual={visual}
      role="img"
      aria-label={
        [
          `${labels.compareTitle} · ${point.year}`,
          ariaValues,
          methodLabel,
          coverageLabel,
          missingLabel,
          qualityLabel,
        ]
          .filter(Boolean)
          .map((sentence) => sentence.trim().replace(/[.!?]+$/u, ""))
          .join(". ") + "."
      }
    >
      <div className="comparison-heading">
        <span>
          {labels.compareTitle} · {point.year}
        </span>
        <span title={methodLabel}>{coverageLabel}</span>
      </div>
      {values.map((entry) => (
        <div className="comparison-row" key={entry.id}>
          <span className={`comparison-label ${entry.id}`}>{entry.label}</span>
          <div className="comparison-track" aria-hidden="true">
            {minimum < 0 && maximum > 0 ? (
              <span
                className="comparison-zero"
                style={{ left: `${position(0)}%` }}
              />
            ) : null}
            <span
              className={`comparison-dot ${entry.id}`}
              style={{ left: `${position(entry.value)}%` }}
            />
          </div>
          <strong>
            {formatValue(
              entry.value,
              indicator.unitKey,
              indicator.precision,
              locale,
            )}
          </strong>
        </div>
      ))}
      {visual ? (
        <p className="comparison-scale">
          {locale === "it" ? "Scala comune" : "Shared scale"}:{" "}
          {formatRange(
            minimum,
            maximum,
            indicator.unitKey,
            indicator.precision,
            locale,
          )}
        </p>
      ) : null}
      <p className="comparison-method">
        {methodLabel}
        {missingLabel ? ` ${missingLabel}.` : ""}
      </p>
      {qualityLabel ? (
        <p className="comparison-quality">{qualityLabel}</p>
      ) : null}
    </div>
  );
}

export function YearSelection({
  indicator,
  point,
  locale,
}: {
  indicator: Indicator;
  point: DataPoint;
  locale: Locale;
}) {
  const options = new Map(indicator.series.map((entry) => [entry.year, entry]));
  options.set(indicator.latest.year, indicator.latest);
  if (indicator.newerEstimate) {
    options.set(indicator.newerEstimate.year, indicator.newerEstimate);
  }
  if (options.size < 2) return null;
  return (
    <label className="year-selection">
      <span>{copy[locale].comparisonYear}</span>
      <select
        value={point.year}
        onChange={(event) => updateQuery({ year: event.target.value })}
      >
        {[...options.values()]
          .sort((a, b) => b.year - a.year)
          .map((entry) => (
            <option key={entry.year} value={entry.year}>
              {entry.year}
              {entry.status
                ? ` · ${statusDescription(entry.status, locale, false)}`
                : ""}
            </option>
          ))}
      </select>
    </label>
  );
}

export function YearContext({
  indicator,
  point,
  locale,
}: {
  indicator: Indicator;
  point: DataPoint;
  locale: Locale;
}) {
  const newer = indicator.newerEstimate;
  if (!newer) return null;
  if (point.year === newer.year) {
    return (
      <p className="year-context">
        <span>
          {locale === "it"
            ? `La scheda si apre sul dato più recente disponibile (${newer.year}, ${statusDescription(newer.status, locale, false)}). L’ultimo anno senza contrassegni provvisori o stimati è il ${indicator.latest.year}.`
            : `The page opens on the most recent available figure (${newer.year}, ${statusDescription(newer.status, locale, false)}). The latest year without provisional or estimated flags is ${indicator.latest.year}.`}
        </span>{" "}
        <button
          type="button"
          onClick={() => updateQuery({ year: String(indicator.latest.year) })}
        >
          {locale === "it"
            ? `Vedi il ${indicator.latest.year}`
            : `View ${indicator.latest.year}`}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </p>
    );
  }
  if (point.year !== indicator.latest.year) return null;
  return (
    <p className="year-context">
      <span>
        {locale === "it"
          ? `Stai leggendo il ${indicator.latest.year} (ultimo anno non provvisorio). È disponibile anche il dato più recente del ${newer.year}, ${statusDescription(newer.status, locale, false)}.`
          : `You are viewing ${indicator.latest.year} (the latest non-provisional year). A more recent ${newer.year} figure (${statusDescription(newer.status, locale, false)}) is also available.`}
      </span>{" "}
      <button
        type="button"
        onClick={() => updateQuery({ year: String(newer.year) })}
      >
        {locale === "it"
          ? `Torna al ${newer.year}`
          : `Back to ${newer.year}`}{" "}
        <span aria-hidden="true">→</span>
      </button>
    </p>
  );
}

export function IndicatorCard({
  indicator,
  locale,
  sectionTitle,
  expanded = false,
  query = "",
  year = null,
}: {
  indicator: Indicator;
  locale: Locale;
  sectionTitle: string;
  expanded?: boolean;
  query?: string;
  year?: string | null;
}) {
  const labels = copy[locale];
  const breakYears = expanded ? getBreakYears(indicator) : [];
  const point = expanded
    ? selectedPoint(indicator, year)
    : getDisplayedPoint(indicator);
  const metadataHref =
    indicator.source.metadataUrl ?? indicator.definitionSourceUrl;
  const Heading = expanded ? "h1" : "h3";

  return (
    <article
      className="indicator-card"
      id={indicator.id}
      data-expanded={expanded}
      style={
        {
          "--section-color": sectionColors[indicator.section],
        } as CSSProperties
      }
    >
      <div className="indicator-card-top">
        <div className="indicator-copy">
          <p className="indicator-kicker">{sectionTitle}</p>
          <Heading>
            {expanded ? (
              indicator.title[locale]
            ) : (
              <a
                className="indicator-title-link"
                href={withQuery(pageHref(locale, `data/${indicator.id}`), query)}
              >
                {indicator.title[locale]}
              </a>
            )}
          </Heading>
          <p className="indicator-summary">{indicator.plain[locale]}</p>
        </div>
        <div className="indicator-reading">
          <p className="indicator-value">
            {formatValue(
              point.italy,
              indicator.unitKey,
              indicator.precision,
              locale,
            )}
          </p>{" "}
          <span>
            {labels.italy} · {point.year}
            {point.status
              ? ` · ${statusDescription(point.status, locale, false)}`
              : ""}
          </span>
        </div>
      </div>

      {indicator.newerEstimate ? (
        point.year === indicator.newerEstimate.year ? (
          <p className="estimate-note">
            <span>
              {locale === "it"
                ? `Il ${indicator.newerEstimate.year} è ${statusDescription(indicator.newerEstimate.status, locale, false)} · Ultimo dato non provvisorio:`
                : `${indicator.newerEstimate.year} is ${statusDescription(indicator.newerEstimate.status, locale, false)} · Latest non-provisional value:`}
            </span>{" "}
            <strong>
              {formatValue(
                indicator.latest.italy,
                indicator.unitKey,
                indicator.precision,
                locale,
              )}
            </strong>{" "}
            <span>({indicator.latest.year})</span>{" "}
            {expanded ? (
              <button
                type="button"
                onClick={() =>
                  updateQuery({ year: String(indicator.latest.year) })
                }
              >
                {locale === "it"
                  ? `Vedi il ${indicator.latest.year}`
                  : `View ${indicator.latest.year}`}{" "}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <a
                href={withQuery(
                  pageHref(locale, `data/${indicator.id}`),
                  query,
                  indicator.latest.year,
                )}
              >
                {locale === "it"
                  ? `Vedi il ${indicator.latest.year}`
                  : `View ${indicator.latest.year}`}{" "}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </p>
        ) : (
          <p className="estimate-note">
            <span>{labels.estimate}</span>{" "}
            <strong>
              {formatValue(
                indicator.newerEstimate.italy,
                indicator.unitKey,
                indicator.precision,
                locale,
              )}
            </strong>{" "}
            <span>
              {indicator.newerEstimate.year},{" "}
              {statusDescription(
                indicator.newerEstimate.status,
                locale,
                false,
              )}
            </span>{" "}
            {expanded ? (
              <button
                type="button"
                onClick={() =>
                  updateQuery({ year: String(indicator.newerEstimate!.year) })
                }
              >
                {locale === "it"
                  ? `Vedi il ${indicator.newerEstimate.year}`
                  : `View ${indicator.newerEstimate.year}`}{" "}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <a
                href={withQuery(
                  pageHref(locale, `data/${indicator.id}`),
                  query,
                  indicator.newerEstimate.year,
                )}
              >
                {locale === "it"
                  ? `Vedi il ${indicator.newerEstimate.year}`
                  : `View ${indicator.newerEstimate.year}`}{" "}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </p>
        )
      ) : null}

      {expanded ? (
        <div className="indicator-toolbar">
          <YearSelection indicator={indicator} point={point} locale={locale} />
          <ShareLink locale={locale} key={`${query}-${point.year}`} />
          <a
            className="compact-download"
            href={`${basePath}/data/indicators/${indicator.id}.csv`}
            download={`${indicator.id}.csv`}
          >
            CSV <span aria-hidden="true">↓</span>
            <span className="visually-hidden">
              {" "}
              · {labels.downloadIndicator}
            </span>
          </a>
        </div>
      ) : null}
      {expanded ? (
        <>
          <YearContext indicator={indicator} point={point} locale={locale} />
          <IndicatorReading
            indicator={indicator}
            point={point}
            locale={locale}
          />
        </>
      ) : null}
      <ComparisonPlot
        indicator={indicator}
        locale={locale}
        point={point}
        visual={expanded}
      />
      {expanded ? (
        <details className="comparison-explainer">
          <summary>{labels.compareExplainer}</summary>
          <p>{labels.comparisonHelp}</p>
        </details>
      ) : null}

      {expanded ? (
        <section className="indicator-details">
          <div className="indicator-details-body">
            {breakYears.length || indicator.notes.length ? (
              <div className="indicator-notes">
                <h3>{labels.dataNotesTitle}</h3>
                {breakYears.length ? (
                  <p className="status-note">
                    {labels.dataStatusBreak.replace(
                      "{years}",
                      formatYearsList(breakYears, locale),
                    )}
                  </p>
                ) : null}
                {indicator.notes.length ? (
                  <ul>
                    {indicator.notes.map((note) => (
                      <li key={`${note.type}-${note.year ?? "all"}`}>
                        <span>{note.text[locale]}</span>{" "}
                        <a
                          href={note.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {labels.sourceNoteLink}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="trend-block">
              <div className="trend-heading">
                <h2>
                  {indicator.unitKey === "eu_index"
                    ? locale === "it"
                      ? "PIL per abitante rispetto all’UE"
                      : "GDP per person relative to the EU"
                    : labels.trend}
                </h2>
                <span>
                  {indicator.series[0].year}–
                  {indicator.series[indicator.series.length - 1].year}
                </span>
              </div>
              <TrendBars
                indicator={indicator}
                locale={locale}
                selectedYear={point.year}
              />
            </div>

            <details className="definition-details">
              <summary>{labels.understand}</summary>
              <h3>{labels.technicalDefinition}</h3>
              <p>{indicator.technical[locale]}</p>
              <p className="definition-attribution">
                {labels.definitionAttribution}
                {indicator.definitionSourceUrl &&
                indicator.definitionSourceUrl !== metadataHref ? (
                  <>
                    {" "}
                    <a
                      href={indicator.definitionSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.definitionSource} <span aria-hidden="true">↗</span>
                    </a>
                  </>
                ) : null}
              </p>
            </details>

            <a
              className="source-box"
              href={withQuery(
                pageHref(locale, `data/${indicator.id}/source`),
                query,
                point.year,
              )}
            >
              <div>
                <span>{labels.source}</span>{" "}
                <strong>
                  {indicator.source.institution}
                  {indicator.source.originalInstitution !==
                  indicator.source.institution
                    ? ` · ${labels.originalInstitution}: ${formatOriginalInstitution(indicator.source.originalInstitution, locale)}`
                    : ""}
                  , {indicator.source.datasetCode}
                </strong>
              </div>
              <div>
                <span>{labels.sourceUpdated}</span>{" "}
                <strong>
                  {formatDate(indicator.source.sourceUpdatedAt, locale)}
                </strong>
              </div>
            </a>

            <div className="card-actions">
              <a
                href={withQuery(
                  pageHref(locale, `data/${indicator.id}/source`),
                  query,
                  point.year,
                )}
              >
                {labels.openData} <span aria-hidden="true">→</span>
              </a>
              {metadataHref ? (
                <a href={metadataHref} target="_blank" rel="noreferrer">
                  {labels.openMetadata} <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              <a
                href={`${basePath}/data/indicators/${indicator.id}.csv`}
                download={`${indicator.id}.csv`}
              >
                {labels.downloadIndicator} (CSV){" "}
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>
      ) : (
        <a
          className="indicator-page-link"
          href={withQuery(pageHref(locale, `data/${indicator.id}`), query)}
        >
          {labels.openIndicator} <span aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}

export function SocialProtectionDetail({
  oldAge,
  pensionExpenditure,
  locale,
  year,
  query,
}: {
  oldAge: Indicator;
  pensionExpenditure: Indicator;
  locale: Locale;
  year: string | null;
  query: string;
}) {
  const labels = copy[locale];
  const oldAgePoint = selectedPoint(oldAge, year);
  const oldAgeComparison = {
    ...oldAge,
    latest: oldAgePoint,
  };
  const pensionPoint = selectedPoint(pensionExpenditure, year);
  const pensionComparison = {
    ...pensionExpenditure,
    latest: pensionPoint,
  };
  const oldAgeFilter = labels.oldAgeFilter
    .replace("{year}", String(oldAgePoint.year))
    .replace(
      "{status}",
      statusDescription(oldAgePoint.status, locale, false),
    );
  const pensionFilter = labels.pensionFilter
    .replace("{year}", String(pensionPoint.year))
    .replace(
      "{status}",
      statusDescription(pensionPoint.status, locale, false),
    );

  return (
    <section className="social-protection-detail">
      <div className="related-detail-heading">
        <p className="eyebrow">{labels.socialDetailEyebrow}</p>
        <h2>{labels.socialDetailTitle}</h2>
        <p>{labels.socialDetailBody}</p>
      </div>

      <div className="related-detail-stack">
        <article className="old-age-definition">
          <p className="indicator-kicker">{labels.oldAgeMeasure}</p>
          <h3>
            <a
              href={withQuery(
                pageHref(locale, `data/${oldAge.id}`),
                query,
                oldAgePoint.year,
              )}
            >
              {labels.oldAgeMeasureTitle}
            </a>
          </h3>
          <p className="related-detail-value">
            {formatEuro(oldAgePoint.italy, locale, 1)}{" "}
            <small>
              {locale === "it" ? "su 100" : "out of 100"} · {oldAgePoint.year} ·{" "}
              {statusDescription(oldAgePoint.status, locale, false)}
            </small>
          </p>
          <div className="exact-definition">
            <h4>{labels.oldAgeIncludesTitle}</h4>
            <ul>
              {labels.oldAgeIncludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{labels.oldAgeExcludes}</p>
            <a
              href="https://unstats.un.org/unsd/classifications/Econ/Structure/Detail/EN/4/10_2_0"
              target="_blank"
              rel="noreferrer"
            >
              {labels.oldAgeOfficialDefinition} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ComparisonPlot
            indicator={oldAgeComparison}
            point={oldAgePoint}
            locale={locale}
          />
          <div className="related-source">
            <span>{labels.selectionUsed}</span>{" "}
            <strong>Eurostat · gov_10a_exp</strong>{" "}
            <small>{oldAgeFilter}</small>
            <div>
              <a
                href={withQuery(
                  pageHref(locale, `data/${oldAge.id}`),
                  query,
                  oldAgePoint.year,
                )}
              >
                {locale === "it"
                  ? "Apri l’indicatore sulla funzione vecchiaia"
                  : "Open the old-age function indicator"}{" "}
                <span aria-hidden="true">→</span>
              </a>
              <a
                href={withQuery(
                  pageHref(locale, `data/${oldAge.id}/source`),
                  query,
                  oldAgePoint.year,
                )}
              >
                {labels.verifyNumber} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>

        <article className="pension-boundary">
          <div className="pension-boundary-heading">
            <div>
              <p className="indicator-kicker">{labels.pensionMeasure}</p>
              <h3>
                <a
                  href={withQuery(
                    pageHref(locale, `data/${pensionExpenditure.id}`),
                    query,
                    pensionPoint.year,
                  )}
                >
                  {labels.pensionMeasureTitle}
                </a>
              </h3>
            </div>
            <p className="related-detail-value">
              {formatValue(
                pensionPoint.italy,
                pensionExpenditure.unitKey,
                pensionExpenditure.precision,
                locale,
              )}{" "}
              <small>
                {pensionPoint.year} ·{" "}
                {statusDescription(pensionPoint.status, locale, false)}
              </small>
            </p>
          </div>
          <p className="pension-boundary-copy">{labels.pensionMeasureBody}</p>
          <div className="pension-includes">
            <h4>{labels.pensionIncludesTitle}</h4>
            <p>{labels.pensionIncludes}</p>
          </div>
          <ComparisonPlot
            indicator={pensionComparison}
            point={pensionPoint}
            locale={locale}
          />
          <div className="related-source">
            <span>{labels.selectionUsed}</span>{" "}
            <strong>Eurostat · spr_exp_pens · ESSPROS</strong>{" "}
            <small>{pensionFilter}</small>
            <div>
              <a
                href={withQuery(
                  pageHref(locale, `data/${pensionExpenditure.id}`),
                  query,
                  pensionPoint.year,
                )}
              >
                {labels.openPensionPage} <span aria-hidden="true">→</span>
              </a>
              <a
                href={withQuery(
                  pageHref(locale, `data/${pensionExpenditure.id}/source`),
                  query,
                  pensionPoint.year,
                )}
              >
                {labels.verifyNumber} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
