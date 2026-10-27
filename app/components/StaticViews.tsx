"use client";

import { MethodGuide } from "./MethodGuide";
import { copy } from "./dashboard-copy";
import type { Indicator, Locale, Source } from "./dashboard-types";
import {
  basePath,
  formatBytes,
  formatDate,
  formatOriginalInstitution,
  pageHref,
} from "./dashboard-utils";

export function MethodView({ locale }: { locale: Locale }) {
  const labels = copy[locale];
  return (
    <section className="method-section" id="method">
      <div className="method-intro">
        <p className="eyebrow">{labels.methodEyebrow}</p>
        <h1>{labels.methodTitle}</h1>
        <p>{labels.methodBody}</p>
      </div>
      <MethodGuide
        locale={locale}
        sourcesHref={pageHref(locale, "sources")}
        catalogueHref={pageHref(locale, "data") + "?topic=all"}
      />
      <h2 className="method-principles-title">
        {locale === "it"
          ? "Come prepariamo le schede"
          : "How we prepare the indicator pages"}
      </h2>
      <div className="method-rules">
        {labels.rules.map((rule, index) => (
          <article key={rule.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{rule.title}</h3>
            <p>{rule.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SourcesView({
  locale,
  sources,
}: {
  locale: Locale;
  sources: Array<{
    source: Source;
    indicators: Indicator[];
    methodologyUrl: string | null;
  }>;
}) {
  const labels = copy[locale];
  return (
    <section className="sources-section" id="sources">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{labels.sourcesEyebrow}</p>
          <h1>{labels.sourcesTitle}</h1>
          <p>{labels.sourcesBody}</p>
        </div>
        <div className="source-stats">
          <strong>{sources.length}</strong>{" "}
          <span>{labels.sourceCount}</span>{" "}
          <small>{labels.localSize}</small>
        </div>
      </div>

      <div className="source-actions">
        <a href={`${basePath}/data/manifest.json`}>{labels.manifest} (JSON)</a>
        <a href={`${basePath}/data/dashboard.csv`} download>
          {labels.downloadAll} <span aria-hidden="true">↓</span>
        </a>
        <a href={`${basePath}/data/dashboard.json`} download>
          {locale === "it"
            ? "Scarica tutti i dati in JSON"
            : "Download all data as JSON"}{" "}
          <span aria-hidden="true">↓</span>
        </a>
      </div>

      <details className="source-directory" open>
        <summary>
          <span>
            {sources.length} {labels.sourceCount}
          </span>{" "}
          <strong>{labels.sourceDirectory}</strong>
        </summary>
        <div className="source-list">
          {sources.map(
            ({ source, indicators: sourceIndicators, methodologyUrl }) => (
              <article
                key={source.datasetCode}
                id={`dataset-${source.datasetCode}`}
              >
                <div className="source-card-body">
                  <div className="source-card-header">
                    <span>{source.datasetCode}</span>
                    <a
                      className="source-external-icon"
                      href={source.dataBrowserUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${labels.sourceBrowser}: ${source.datasetCode}`}
                    >
                      ↗
                    </a>
                  </div>
                  <h3>
                    <a
                      href={source.dataBrowserUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.datasetLabel}
                    </a>
                  </h3>
                  <small>
                    {source.institution}
                    {source.originalInstitution !== source.institution
                      ? ` · ${labels.originalInstitution}: ${formatOriginalInstitution(source.originalInstitution, locale)}`
                      : ""}{" "}
                    · {labels.sourceUpdated}:{" "}
                    {formatDate(source.sourceUpdatedAt, locale)}
                  </small>
                  <div className="source-card-indicators">
                    <span className="source-card-sublabel">
                      {locale === "it"
                        ? "Indicatori nel sito"
                        : "Indicators on this site"}
                    </span>
                    <ul>
                      {sourceIndicators.map((indicator) => (
                        <li key={indicator.id}>
                          <a href={pageHref(locale, `data/${indicator.id}`)}>
                            {indicator.title[locale]}
                          </a>
                          {" · "}
                          <a
                            className="source-card-verify"
                            href={pageHref(
                              locale,
                              `data/${indicator.id}/source`,
                            )}
                          >
                            {locale === "it" ? "verifica" : "verify"}{" "}
                            <span aria-hidden="true">→</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="source-card-links">
                    <a
                      href={source.dataBrowserUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Data Browser <span aria-hidden="true">↗</span>
                    </a>
                    {methodologyUrl ? (
                      <a
                        href={methodologyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {locale === "it" ? "Metadati" : "Metadata"}{" "}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                    {source.snapshotPath ? (
                      <a
                        href={`${basePath}/${source.snapshotPath}`}
                        download
                      >
                        Snapshot (JSON
                        {source.bytes
                          ? `, ${formatBytes(source.bytes, locale)}`
                          : ""}
                        ) <span aria-hidden="true">↓</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      </details>
    </section>
  );
}

export function AboutView({ locale }: { locale: Locale }) {
  const labels = copy[locale];
  return (
    <section className="about-section" id="about">
      <div className="about-main">
        <p className="eyebrow">{labels.aboutEyebrow}</p>
        <h1>{labels.aboutTitle}</h1>
        <p>{labels.aboutBody}</p>
        <strong>{labels.founder}</strong>
      </div>
      <div className="about-notes">
        <p>{labels.independence}</p>
        <p>{labels.privacy}</p>
      </div>

      <details className="roadmap">
        <summary>
          <span>
            <strong>{labels.futureTitle}</strong>{" "}
            <small>{labels.futureBody}</small>
          </span>{" "}
          <span>{labels.futureToggle}</span>
        </summary>
        <ol>
          {labels.roadmap.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}

export function ContributeView({ locale }: { locale: Locale }) {
  const labels = copy[locale];
  return (
    <section className="contribute-section" id="contribute">
      <div>
        <p className="eyebrow">{labels.contributeEyebrow}</p>
        <h1>{labels.contributeTitle}</h1>
        <p>{labels.contributeBody}</p>
        <p className="contribution-help">{labels.contributionHow}</p>
        <a href="https://github.com/andrea-gentilini/explainable-italy">
          {labels.contributionLink} <span aria-hidden="true">↗</span>
        </a>
        <a href="https://github.com/andrea-gentilini/explainable-italy/blob/main/CONTRIBUTING.md">
          {labels.contributionGuide} <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ul className="contribution-ways">
        {labels.contributionWays.map((way) => (
          <li key={way.template}>
            <a
              className="contribution-link"
              href={`https://github.com/andrea-gentilini/explainable-italy/issues/new?template=${way.template}`}
            >
              <div>
                <strong>{way.title}</strong> <small>{way.detail}</small>
              </div>
              <span className="contribution-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
