"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { ShareLink } from "./ShareLink";
import { createIndicatorSearch } from "./indicator-search.mjs";
import { copy, sectionColors, topicQuestions } from "./dashboard-copy";
import type {
  DashboardData,
  DashboardProps,
  DashboardView,
  Indicator,
  Source,
} from "./dashboard-types";
import {
  basePath,
  formatDate,
  getDisplayedPoint,
  getThemeSnapshot,
  pageHref,
  selectedPoint,
  subscribeToTheme,
  themeStorageKey,
  updateQuery,
  useLocationQuery,
  withQuery,
} from "./dashboard-utils";
import { HomeView, SpendingBreakdownCard } from "./HomeView";
import { IndicatorCard, SocialProtectionDetail } from "./IndicatorCard";
import { SourceVerification } from "./SourceVerification";
import {
  AboutView,
  ContributeView,
  MethodView,
  SourcesView,
} from "./StaticViews";

export type { DashboardData, DashboardView };

export function Dashboard({
  data,
  locale,
  view = "home",
  selectedIndicatorId,
}: DashboardProps) {
  const labels = copy[locale];
  const locationQuery = useLocationQuery();
  const params = new URLSearchParams(locationQuery);
  const requestedTopic = params.get("topic");
  const search = params.get("q") ?? "";
  const activeSection =
    requestedTopic === "all" ||
    data.sections.some((section) => section.id === requestedTopic)
      ? (requestedTopic as string)
      : search
        ? "all"
        : "overview";
  const catalogParams = new URLSearchParams();
  if (requestedTopic && requestedTopic !== "overview") {
    catalogParams.set("topic", activeSection);
  }
  if (search) catalogParams.set("q", search);
  const catalogQuery = catalogParams.toString();
  const requestedYear = params.get("year");
  const setActiveSection = (topic: string) =>
    updateQuery(
      {
        topic: topic === "overview" ? null : topic,
        q: topic === "overview" ? null : search || null,
      },
      true,
    );
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false,
  );

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(themeStorageKey);
      } catch {
        /* Storage is optional. */
      }
      const shouldUseDark =
        stored === "dark" || (!stored && systemTheme.matches);
      document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
    };

    applyTheme();
    systemTheme.addEventListener("change", applyTheme);
    window.addEventListener("storage", applyTheme);

    return () => {
      systemTheme.removeEventListener("change", applyTheme);
      window.removeEventListener("storage", applyTheme);
    };
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      window.localStorage.setItem(themeStorageKey, next ? "dark" : "light");
    } catch {
      /* Keep the current theme when storage is blocked. */
    }
  };

  const oldAge = data.indicators.find(
    (indicator) => indicator.id === "spending-old-age",
  );
  const pensionExpenditure = data.indicators.find(
    (indicator) => indicator.id === "pension-expenditure",
  );
  const [activeSpendingId, setActiveSpendingId] = useState<string | null>(null);
  const spendingBreakdown = useMemo(
    () =>
      data.indicators
        .filter(
          (indicator) =>
            indicator.section === "spending" &&
            indicator.id.startsWith("spending-") &&
            !indicator.isDetail,
        )
        .sort(
          (left, right) =>
            getDisplayedPoint(right).italy - getDisplayedPoint(left).italy,
        ),
    [data.indicators],
  );

  const searchIndex = useMemo(
    () => createIndicatorSearch(data.indicators),
    [data.indicators],
  );
  const filteredIndicators = searchIndex(search, activeSection);

  const sources = useMemo(() => {
    const unique = new Map<
      string,
      { source: Source; indicators: Indicator[]; methodologyUrl: string | null }
    >();
    for (const indicator of data.indicators) {
      const existing = unique.get(indicator.source.datasetCode);
      if (existing) {
        existing.indicators.push(indicator);
        if (!existing.methodologyUrl && indicator.definitionSourceUrl) {
          existing.methodologyUrl = indicator.definitionSourceUrl;
        }
      } else {
        unique.set(indicator.source.datasetCode, {
          source: indicator.source,
          indicators: [indicator],
          methodologyUrl:
            indicator.source.metadataUrl ?? indicator.definitionSourceUrl,
        });
      }
    }
    return [...unique.values()].sort((left, right) =>
      left.source.datasetCode.localeCompare(right.source.datasetCode),
    );
  }, [data.indicators]);

  const selectedIndicator = selectedIndicatorId
    ? data.indicators.find((indicator) => indicator.id === selectedIndicatorId)
    : undefined;

  const selectedSection = data.sections.find(
    (section) => section.id === activeSection,
  );
  const catalogueTitle = search.trim()
    ? locale === "it"
      ? "Risultati della ricerca"
      : "Search results"
    : selectedSection?.title[locale] ??
      (activeSection === "all" ? labels.allSections : labels.dataSectionTitle);
  const catalogueBody = search.trim()
    ? locale === "it"
      ? "Apri una scheda per leggere il dato e il suo contesto. Puoi restringere i risultati scegliendo un tema."
      : "Open an indicator to read the figure and its context. Choose a topic to narrow the results."
    : selectedSection?.description[locale] ??
      (activeSection === "all"
        ? locale === "it"
          ? "Ogni scheda riporta l’anno del dato, il confronto europeo e la fonte."
          : "Each indicator shows its reference year, European comparison and source."
        : labels.dataSectionBody);

  const currentPath =
    view === "home"
      ? ""
      : view === "indicator" || view === "indicatorSource"
        ? `data/${selectedIndicatorId ?? ""}` +
          (view === "indicatorSource" ? "/source" : "")
        : view;

  return (
    <div className="site-shell" lang={locale}>
      <a className="skip-link" href="#main">
        {labels.skip}
      </a>

      <header className="site-header">
        <a className="brand" href={pageHref(locale)}>
          <span>
            <strong>Explainable Italy</strong>{" "}
            <small>{labels.subtitle}</small>
          </span>
        </a>

        <nav
          aria-label={
            locale === "it" ? "Navigazione principale" : "Main navigation"
          }
        >
          <a
            href={pageHref(locale, "data")}
            aria-current={
              view === "data" ||
              view === "indicator" ||
              view === "indicatorSource"
                ? "page"
                : undefined
            }
          >
            {labels.navData}
          </a>
          <a
            href={pageHref(locale, "method")}
            aria-current={view === "method" ? "page" : undefined}
          >
            {labels.navMethod}
          </a>
          <a
            href={pageHref(locale, "sources")}
            aria-current={view === "sources" ? "page" : undefined}
          >
            {labels.navSources}
          </a>
          <a
            href={pageHref(locale, "about")}
            aria-current={view === "about" ? "page" : undefined}
          >
            {labels.navAbout}
          </a>
          <a
            href={pageHref(locale, "contribute")}
            aria-current={view === "contribute" ? "page" : undefined}
          >
            {labels.navContribute}
          </a>
        </nav>

        <div className="header-actions">
          <a
            className="language-link"
            href={withQuery(
              pageHref(locale === "it" ? "en" : "it", currentPath),
              locationQuery,
            )}
          >
            {labels.language}
          </a>
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? labels.themeLight : labels.themeDark}
            title={darkMode ? labels.themeLight : labels.themeDark}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              {darkMode ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4L19 5" />
                </>
              ) : (
                <path d="M20.6 14.1A9 9 0 0 1 9.9 3.4 9 9 0 1 0 20.6 14.1Z" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {view === "home" ? (
          <HomeView data={data} locale={locale} sourceCount={sources.length} />
        ) : null}

        {view === "indicator" && selectedIndicator ? (
          <section
            className={`indicator-page-shell ${
              selectedIndicator.id === "spending-social-protection"
                ? "has-related-detail"
                : ""
            }`}
          >
            <a
              className="back-link"
              href={withQuery(
                pageHref(locale, "data"),
                catalogQuery || `topic=${selectedIndicator.section}`,
              )}
            >
              <span aria-hidden="true">←</span>{" "}
              {catalogQuery
                ? labels.backToResults
                : labels.backToTopic.replace(
                    "{topic}",
                    data.sections.find(
                      (section) => section.id === selectedIndicator.section,
                    )?.title[locale] ?? labels.navData,
                  )}
            </a>
            <IndicatorCard
              indicator={selectedIndicator}
              locale={locale}
              sectionTitle={
                data.sections.find(
                  (section) => section.id === selectedIndicator.section,
                )?.title[locale] ?? ""
              }
              expanded
              query={catalogQuery}
              year={requestedYear}
            />
            {selectedIndicator.id === "spending-social-protection" &&
            oldAge &&
            pensionExpenditure ? (
              <SocialProtectionDetail
                oldAge={oldAge}
                pensionExpenditure={pensionExpenditure}
                locale={locale}
                year={String(selectedPoint(selectedIndicator, requestedYear).year)}
                query={catalogQuery}
              />
            ) : null}
          </section>
        ) : null}

        {view === "indicatorSource" && selectedIndicator ? (
          <SourceVerification
            indicator={selectedIndicator}
            locale={locale}
            query={catalogQuery}
            year={requestedYear}
          />
        ) : null}

        {view === "data" ? (
          <section className="data-section" id="data">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{labels.navData}</p>
                <h1>{catalogueTitle}</h1>
                <p>{catalogueBody}</p>
              </div>
              <div className="search-field">
                <label htmlFor="indicator-search">{labels.searchLabel}</label>
                <input
                  type="search"
                  id="indicator-search"
                  aria-describedby="search-hint"
                  value={search}
                  onChange={(event) => {
                    const nextSearch = event.target.value;
                    updateQuery({
                      q: nextSearch || null,
                      topic:
                        activeSection === "overview"
                          ? nextSearch.trim()
                            ? "all"
                            : null
                          : activeSection,
                    });
                  }}
                  placeholder={labels.searchPlaceholder}
                />
                <small id="search-hint">{labels.searchHint}</small>
                {search ? (
                  <button
                    className="clear-search"
                    type="button"
                    onClick={() => updateQuery({ q: null })}
                  >
                    {labels.clearSearch}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="catalog-tools">
              <ShareLink locale={locale} key={locationQuery} />
              <a href={`${basePath}/data/dashboard.csv`} download>
                {labels.downloadAll} <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div
              className="section-filters"
              role="group"
              aria-label={labels.navData}
            >
              <button
                type="button"
                className={activeSection === "overview" ? "active" : ""}
                aria-pressed={activeSection === "overview"}
                onClick={() => {
                  setActiveSection("overview");
                }}
              >
                {labels.topicOverview} <span>{data.sections.length}</span>
              </button>
              <button
                type="button"
                className={activeSection === "all" ? "active" : ""}
                aria-pressed={activeSection === "all"}
                onClick={() => setActiveSection("all")}
              >
                {labels.allSections} <span>{data.indicators.length}</span>
              </button>
              {data.sections.map((section) => (
                <button
                  type="button"
                  className={activeSection === section.id ? "active" : ""}
                  aria-pressed={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                  key={section.id}
                >
                  {section.title[locale]}{" "}
                  <span>
                    {
                      data.indicators.filter(
                        (indicator) => indicator.section === section.id,
                      ).length
                    }
                  </span>
                </button>
              ))}
              {activeSection !== "overview" ? (
                <p className="results-count" aria-live="polite">
                  <strong>{filteredIndicators.length}</strong> /{" "}
                  {data.indicators.length} {labels.results}
                </p>
              ) : null}
            </div>

            {activeSection === "overview" ? (
              <>
                <div className="topic-grid">
                  {data.sections.map((section) => {
                    const sectionIndicators = data.indicators.filter(
                      (indicator) => indicator.section === section.id,
                    );

                    return (
                      <article
                        key={section.id}
                        style={
                          {
                            "--topic-color": sectionColors[section.id],
                          } as CSSProperties
                        }
                      >
                        <span className="topic-count">
                          {sectionIndicators.length} {labels.topicIndicators}
                        </span>
                        <h2>
                          <button
                            type="button"
                            className="topic-title-button"
                            onClick={() => setActiveSection(section.id)}
                          >
                            {section.title[locale]}
                          </button>
                        </h2>
                        <p>{section.description[locale]}</p>
                        <div className="topic-questions">
                          {topicQuestions[section.id].map((question) => (
                            <a
                              key={question.id}
                              href={
                                pageHref(locale, `data/${question.id}`) +
                                `?topic=${section.id}`
                              }
                            >
                              {question.text[locale]}{" "}
                              <span aria-hidden="true">→</span>
                            </a>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="topic-open"
                          onClick={() => setActiveSection(section.id)}
                        >
                          {labels.topicOpen} <span aria-hidden="true">→</span>
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div className="catalog-all-section">
                  <div className="catalog-all-heading">
                    <h2>
                      {labels.allSections} ({data.indicators.length})
                    </h2>
                  </div>
                  <div className="indicator-grid">
                    {data.indicators.map((indicator) => (
                      <IndicatorCard
                        indicator={indicator}
                        locale={locale}
                        sectionTitle={
                          data.sections.find(
                            (section) => section.id === indicator.section,
                          )?.title[locale] ?? ""
                        }
                        key={indicator.id}
                        query={catalogQuery}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {activeSection === "spending" && !search.trim() ? (
                  <section
                    className="spending-catalog-panel"
                    aria-label={labels.heroTitle}
                  >
                    <div className="spending-catalog-intro">
                      <h2>{labels.heroTitle}</h2>
                      <p>
                        {locale === "it"
                          ? "Le 10 funzioni COFOG qui sotto ripartiscono 100 € di spesa pubblica complessiva (% della spesa). Le altre schede del tema misurano invece entrate, saldi e debito in rapporto all’economia (% del PIL)."
                          : "The 10 COFOG functions below divide €100 of total government expenditure (% of spending). The remaining indicators in this topic measure revenue, balances and debt relative to the economy (% of GDP)."}
                      </p>
                    </div>
                    <SpendingBreakdownCard
                      spendingBreakdown={spendingBreakdown}
                      locale={locale}
                      activeSpendingId={activeSpendingId}
                      onSelectSpending={setActiveSpendingId}
                      query={catalogQuery}
                    />
                  </section>
                ) : null}
                <div className="indicator-grid">
                  {filteredIndicators.map((indicator) => (
                    <IndicatorCard
                      indicator={indicator}
                      locale={locale}
                      sectionTitle={
                        data.sections.find(
                          (section) => section.id === indicator.section,
                        )?.title[locale] ?? ""
                      }
                      key={indicator.id}
                      query={catalogQuery}
                    />
                  ))}
                </div>
              </>
            )}

            {activeSection !== "overview" && filteredIndicators.length === 0 ? (
              <div className="empty-state" role="status">
                <p>{labels.noResults}</p>
                <div className="empty-state-actions">
                  {activeSection !== "all" ? (
                    <button
                      type="button"
                      onClick={() => updateQuery({ topic: "all" }, true)}
                    >
                      {locale === "it"
                        ? "Cerca in tutti i temi"
                        : "Search across all topics"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => updateQuery({ q: null, topic: "all" }, true)}
                  >
                    {labels.resetSearch}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {view === "method" ? <MethodView locale={locale} /> : null}
        {view === "sources" ? (
          <SourcesView locale={locale} sources={sources} />
        ) : null}
        {view === "about" ? <AboutView locale={locale} /> : null}
        {view === "contribute" ? <ContributeView locale={locale} /> : null}
      </main>

      <footer>
        <div className="brand footer-brand">
          <span>
            <strong>Explainable Italy</strong> <small>{labels.footer}</small>
          </span>
        </div>
        <nav
          className="footer-links"
          aria-label={
            locale === "it"
              ? "Informazioni sul progetto"
              : "Project information"
          }
        >
          <a href={pageHref(locale, "data")}>{labels.navData}</a>
          <a href={pageHref(locale, "method")}>{labels.navMethod}</a>
          <a href={pageHref(locale, "sources")}>{labels.navSources}</a>
          <a href={pageHref(locale, "about")}>{labels.navAbout}</a>
          <a href={pageHref(locale, "contribute")}>{labels.navContribute}</a>
        </nav>
        <p>
          {labels.latestUpdate} {formatDate(data.generatedAt, locale)}
        </p>
        <p>
          <a
            href="https://github.com/andrea-gentilini/explainable-italy/blob/main/DATA_LICENSE.md"
            target="_blank"
            rel="noreferrer"
          >
            {labels.footerLicense}
          </a>
        </p>
      </footer>
    </div>
  );
}
