"use client";

import { ShareLink } from "./ShareLink";
import { YearContext, YearSelection } from "./IndicatorCard";
import { copy, countryNames } from "./dashboard-copy";
import type { Indicator, Locale } from "./dashboard-types";
import {
  basePath,
  countryList,
  fillCount,
  formatBytes,
  formatDate,
  formatOriginalInstitution,
  formatValue,
  getSourceSelection,
  pageHref,
  selectedPoint,
  statusDescription,
  withQuery,
} from "./dashboard-utils";

export function SourceVerification({
  indicator,
  locale,
  query,
  year,
}: {
  indicator: Indicator;
  locale: Locale;
  query: string;
  year: string | null;
}) {
  const labels = copy[locale];
  const displayedPoint = selectedPoint(indicator, year);
  const selection = getSourceSelection(indicator, locale);
  const sourceMetadataHref =
    indicator.source.metadataUrl ?? indicator.definitionSourceUrl;
  const coverageLabel = fillCount(
    labels.sourceMedianCalculated,
    displayedPoint.coverage,
  );
  const missingLabel = displayedPoint.missingCountries.length
    ? labels.sourceMissingShort.replace(
        "{countries}",
        countryList(displayedPoint.missingCountries, locale),
      )
    : null;
  const countryObservations = [...(displayedPoint.countries ?? [])].sort(
    (a, b) => {
      const nameA = countryNames[locale][a.geo] ?? a.geo;
      const nameB = countryNames[locale][b.geo] ?? b.geo;
      return nameA.localeCompare(nameB, locale === "it" ? "it" : "en");
    },
  );
  const flaggedCountries = [...displayedPoint.countryStatuses].sort((a, b) => {
    const nameA = countryNames[locale][a.geo] ?? a.geo;
    const nameB = countryNames[locale][b.geo] ?? b.geo;
    return nameA.localeCompare(nameB, locale === "it" ? "it" : "en");
  });
  const displayedValue = formatValue(
    displayedPoint.italy,
    indicator.unitKey,
    indicator.precision,
    locale,
  );
  const spendingFormula =
    locale === "it"
      ? `${new Intl.NumberFormat("it-IT", {
          minimumFractionDigits: indicator.precision,
          maximumFractionDigits: indicator.precision,
        }).format(displayedPoint.italy)}% della spesa × 100 € = ${new Intl.NumberFormat(
          "it-IT",
          {
            minimumFractionDigits: indicator.precision,
            maximumFractionDigits: indicator.precision,
          },
        ).format(displayedPoint.italy)} € su 100`
      : `${new Intl.NumberFormat("en-GB", {
          minimumFractionDigits: indicator.precision,
          maximumFractionDigits: indicator.precision,
        }).format(displayedPoint.italy)}% of spending × €100 = €${new Intl.NumberFormat(
          "en-GB",
          {
            minimumFractionDigits: indicator.precision,
            maximumFractionDigits: indicator.precision,
          },
        ).format(displayedPoint.italy)} out of €100`;

  return (
    <section className="source-verification">
      <a
        className="back-link"
        href={withQuery(
          pageHref(locale, `data/${indicator.id}`),
          query,
          displayedPoint.year,
        )}
      >
        <span aria-hidden="true">←</span> {labels.sourceBack}
      </a>

      <header className="source-verification-heading">
        <p className="eyebrow">{labels.sourcePageEyebrow}</p>
        <h1>
          {labels.sourcePageTitle}: {indicator.title[locale]}
        </h1>
        <p>{labels.sourcePageBody}</p>
      </header>

      <div className="indicator-toolbar">
        <YearSelection
          indicator={indicator}
          point={displayedPoint}
          locale={locale}
        />
        <ShareLink locale={locale} key={`${query}-${displayedPoint.year}`} />
        {indicator.source.snapshotPath ? (
          <a
            className="compact-download"
            href={`${basePath}/${indicator.source.snapshotPath}`}
            download
          >
            {labels.snapshotDownload} (JSON) <span aria-hidden="true">↓</span>
          </a>
        ) : null}
      </div>
      <div className="source-value-panel">
        <span>{labels.sourceDisplayed}</span>{" "}
        <strong>{displayedValue}</strong>{" "}
        <small>
          {labels.italy} · {displayedPoint.year} ·{" "}
          {displayedPoint.status
            ? statusDescription(displayedPoint.status, locale)
            : labels.yearUnflagged}
        </small>
      </div>

      <YearContext
        indicator={indicator}
        point={displayedPoint}
        locale={locale}
      />
      <div className="source-verification-grid">
        <section>
          <h2>{labels.sourceSelection}</h2>
          <dl className="source-selection-list">
            <div>
              <dt>{labels.dataset}</dt>
              <dd>
                <a
                  href={indicator.source.dataBrowserUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {indicator.source.datasetLabel}{" "}
                  <code>{indicator.source.datasetCode}</code>{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              </dd>
            </div>
            <div>
              <dt>{labels.sourceCountry}</dt>
              <dd>
                {labels.italy} <code>IT</code>
              </dd>
            </div>
            <div>
              <dt>{labels.sourceYear}</dt>
              <dd>{displayedPoint.year}</dd>
            </div>
            <div>
              <dt>{labels.sourceUpdated}</dt>
              <dd>{formatDate(indicator.source.sourceUpdatedAt, locale)}</dd>
            </div>
            <div>
              <dt>{labels.sourceAccessed}</dt>
              <dd>{formatDate(indicator.source.accessedAt, locale)}</dd>
            </div>
            {indicator.source.originalInstitution !==
            indicator.source.institution ? (
              <div>
                <dt>{labels.originalInstitution}</dt>
                <dd>
                  {formatOriginalInstitution(
                    indicator.source.originalInstitution,
                    locale,
                  )}
                </dd>
              </div>
            ) : null}
            {selection.map((entry) => (
              <div key={entry.dimension}>
                <dt>{entry.label}</dt>
                <dd>
                  {entry.value} <code>{entry.codes}</code>
                </dd>
              </div>
            ))}
          </dl>
          <p className="source-technical-definition">
            {indicator.technical[locale]}
          </p>
        </section>

        <section>
          <h2>{labels.sourceObservations}</h2>
          <div className="source-observation-list">
            <div>
              <span>{labels.italy}</span>{" "}
              <strong>
                {formatValue(
                  displayedPoint.italy,
                  indicator.unitKey,
                  indicator.precision,
                  locale,
                )}
              </strong>{" "}
              <small>Eurostat · IT</small>
            </div>
            {displayedPoint.eu !== null ? (
              <div>
                <span>{labels.eu}</span>{" "}
                <strong>
                  {formatValue(
                    displayedPoint.eu,
                    indicator.unitKey,
                    indicator.precision,
                    locale,
                  )}
                </strong>{" "}
                <small>
                  Eurostat · EU27_2020
                  {displayedPoint.euStatus
                    ? ` · ${statusDescription(displayedPoint.euStatus, locale)}`
                    : ""}
                </small>
              </div>
            ) : (
              <div>
                <span>{labels.eu}</span>{" "}
                <strong>—</strong>{" "}
                <small>{labels.sourceEuUnavailable}</small>
              </div>
            )}
            <div>
              <span>{labels.median}</span>{" "}
              <strong>
                {formatValue(
                  displayedPoint.median,
                  indicator.unitKey,
                  indicator.precision,
                  locale,
                )}
              </strong>{" "}
              <small>
                {coverageLabel}
                {missingLabel ? ` · ${missingLabel}` : ""}
              </small>
            </div>
          </div>
        </section>
      </div>

      <a
        className="source-browser-link"
        href={indicator.source.dataBrowserUrl}
        target="_blank"
        rel="noreferrer"
      >
        {labels.sourceBrowser} <span aria-hidden="true">↗</span>
      </a>

      <section className="source-quality">
        <h2>{labels.sourceQualityTitle}</h2>
        <p>{labels.sourceQualityIntro}</p>
        <dl>
          <div>
            <dt>{labels.sourceItalyStatus}</dt>
            <dd>{statusDescription(displayedPoint.status, locale)}</dd>
          </div>
          {displayedPoint.eu !== null ? (
            <div>
              <dt>{labels.sourceEuStatus}</dt>
              <dd>{statusDescription(displayedPoint.euStatus, locale)}</dd>
            </div>
          ) : null}
          <div>
            <dt>{labels.sourceCountryFlags}</dt>
            <dd>
              {flaggedCountries.length
                ? flaggedCountries
                    .map(
                      (country) =>
                        `${countryNames[locale][country.geo] ?? country.geo}: ${statusDescription(
                          country.status,
                          locale,
                        )}`,
                    )
                    .join("; ")
                : labels.sourceNoFlags}
            </dd>
          </div>
        </dl>

        {indicator.notes.length ? (
          <div className="source-method-notes">
            <h3>{labels.sourceNotes}</h3>
            <ul>
              {indicator.notes.map((note) => (
                <li key={`${note.type}-${note.year ?? "all"}`}>
                  <span>{note.text[locale]}</span>{" "}
                  <a href={note.sourceUrl} target="_blank" rel="noreferrer">
                    {labels.sourceNoteLink}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {countryObservations.length ? (
        <details className="source-country-table">
          <summary>
            {labels.sourceCountryValues} ({displayedPoint.coverage}/27)
          </summary>
          <p>{labels.sourceCountryValuesBody}</p>
          {missingLabel ? <p className="source-missing">{missingLabel}</p> : null}
          <div
            className="country-table-scroll"
            tabIndex={0}
            role="region"
            aria-label={labels.sourceCountryValues}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">{labels.sourceCountry}</th>
                  <th scope="col">{labels.sourceCountryValue}</th>
                  <th scope="col">{labels.sourceCountryStatus}</th>
                </tr>
              </thead>
              <tbody>
                {countryObservations.map((country) => (
                  <tr key={country.geo}>
                    <th scope="row">
                      {countryNames[locale][country.geo] ?? country.geo}{" "}
                      <code>{country.geo}</code>
                    </th>
                    <td>
                      {formatValue(
                        country.value,
                        indicator.unitKey,
                        indicator.precision,
                        locale,
                      )}
                    </td>
                    <td>
                      {country.status
                        ? statusDescription(country.status, locale)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      <section className="source-formula">
        <h2>{labels.sourceFormula}</h2>
        <p className="source-primary-formula">
          {indicator.unitKey === "percent_spending"
            ? spendingFormula
            : labels.sourceNoCalculation}
        </p>
        <p>
          {fillCount(labels.sourceComparisonFormula, displayedPoint.coverage)}
          {displayedPoint.eu === null ? ` ${labels.sourceEuUnavailable}` : ""}
        </p>
      </section>

      <details className="source-technical-links" open>
        <summary>{labels.sourceTechnicalSummary}</summary>
        <p>{labels.sourceTechnicalBody}</p>
        <div>
          <a
            href={indicator.source.apiUrl}
            target="_blank"
            rel="noreferrer"
          >
            {labels.sourceRaw} <span aria-hidden="true">↗</span>
          </a>
          {indicator.definitionSourceUrl &&
          indicator.definitionSourceUrl !== sourceMetadataHref ? (
            <a
              href={indicator.definitionSourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {labels.sourceOfficialDefinition}{" "}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          {sourceMetadataHref ? (
            <a
              href={sourceMetadataHref}
              target="_blank"
              rel="noreferrer"
            >
              {labels.openMetadata} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          <a href={indicator.source.doi} target="_blank" rel="noreferrer">
            {labels.sourceDoi} <span aria-hidden="true">↗</span>
          </a>
          <a
            href={`${basePath}/data/indicators/${indicator.id}.csv`}
            download={`${indicator.id}.csv`}
          >
            {labels.downloadIndicator} (CSV) <span aria-hidden="true">↓</span>
          </a>
          {indicator.source.snapshotPath ? (
            <a href={`${basePath}/${indicator.source.snapshotPath}`} download>
              {labels.snapshotDownload} (JSON) <span aria-hidden="true">↓</span>
            </a>
          ) : null}
          <a href={pageHref(locale, "sources")}>
            {locale === "it"
              ? "Tutte le fonti e i download"
              : "All sources and downloads"}{" "}
            <span aria-hidden="true">→</span>
          </a>
        </div>
        {indicator.source.sha256 ? (
          <p className="source-hash">
            {labels.snapshotHash}
            {indicator.source.bytes
              ? ` (${formatBytes(indicator.source.bytes, locale)})`
              : ""}
            : <code>{indicator.source.sha256}</code>
          </p>
        ) : null}
      </details>
    </section>
  );
}
