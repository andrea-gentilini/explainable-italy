"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AppLink } from "./ShareLink";
import {
  copy,
  snapshotDefinitions,
  snapshotIds,
  topicQuestions,
} from "./dashboard-copy";
import type { DashboardData, Indicator, Locale } from "./dashboard-types";
import {
  formatDate,
  formatEuro,
  formatValue,
  getDisplayedPoint,
  pageHref,
  statusDescription,
  withQuery,
} from "./dashboard-utils";

export function SpendingBreakdownCard({
  spendingBreakdown,
  locale,
  activeSpendingId,
  onSelectSpending,
  query = "",
}: {
  spendingBreakdown: Indicator[];
  locale: Locale;
  activeSpendingId: string | null;
  onSelectSpending: (id: string) => void;
  query?: string;
}) {
  const labels = copy[locale];
  const suppressNextClickRef = useRef(false);
  const spendingPoint = spendingBreakdown[0]
    ? getDisplayedPoint(spendingBreakdown[0])
    : null;
  const spendingYear = spendingPoint?.year;
  const heroCardLabel = labels.heroCardLabel.replace(
    "{year}",
    String(spendingYear ?? ""),
  );
  const activeSpending =
    spendingBreakdown.find((indicator) => indicator.id === activeSpendingId) ??
    spendingBreakdown[0];
  const activeSpendingIndex = Math.max(
    0,
    spendingBreakdown.findIndex(
      (indicator) => indicator.id === activeSpending?.id,
    ),
  );
  const spendingBoundaries = spendingBreakdown.map((_, index) =>
    spendingBreakdown
      .slice(0, index + 1)
      .reduce((total, item) => total + getDisplayedPoint(item).italy, 0),
  );
  const spendingGradient = `conic-gradient(${spendingBreakdown
    .map((_, index) => {
      const start = index === 0 ? 0 : spendingBoundaries[index - 1];
      const end =
        index === spendingBreakdown.length - 1 ? 100 : spendingBoundaries[index];
      return `var(--chart-${index + 1}) ${start}% ${end}%`;
    })
    .join(", ")})`;

  const resolveSliceFromPointer = (
    event: ReactPointerEvent<HTMLAnchorElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    const distanceFromCenter = Math.hypot(x, y);

    if (distanceFromCenter < bounds.width * 0.36) {
      return null;
    }

    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const share = ((angle + 450) % 360) / 3.6;
    const selectedIndex = spendingBoundaries.findIndex(
      (boundary) => share <= boundary,
    );
    return spendingBreakdown[selectedIndex] ?? null;
  };

  const handleDonutPointerMove = (
    event: ReactPointerEvent<HTMLAnchorElement>,
  ) => {
    if (event.pointerType === "touch") return;
    const selected = resolveSliceFromPointer(event);
    if (selected && selected.id !== activeSpending?.id) {
      onSelectSpending(selected.id);
    }
  };

  const handleDonutPointerDown = (
    event: ReactPointerEvent<HTMLAnchorElement>,
  ) => {
    const selected = resolveSliceFromPointer(event);
    if (!selected) {
      suppressNextClickRef.current = false;
      return;
    }
    if (event.pointerType === "touch" && selected.id !== activeSpending?.id) {
      suppressNextClickRef.current = true;
      onSelectSpending(selected.id);
      return;
    }
    suppressNextClickRef.current = false;
    onSelectSpending(selected.id);
  };

  const handleDonutClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (suppressNextClickRef.current) {
      event.preventDefault();
      suppressNextClickRef.current = false;
    }
  };

  const activePoint = activeSpending ? getDisplayedPoint(activeSpending) : null;
  const activeTitle = activeSpending
    ? activeSpending.id === "spending-social-protection"
      ? labels.socialProtectionHero
      : activeSpending.title[locale]
    : "";

  return (
    <div className="hundred-euro-card">
      <div className="hundred-euro-heading">
        <span>{locale === "it" ? "100 €" : "€100"}</span>{" "}
        <small>{heroCardLabel}</small>
      </div>

      <div className="spending-visual">
        {activeSpending && activePoint ? (
          <AppLink
            className="spending-donut"
            href={withQuery(
              pageHref(locale, `data/${activeSpending.id}`),
              query,
              activePoint.year,
            )}
            aria-label={`${labels.spendingDonutLabel}: ${activeTitle}`}
            onPointerMove={handleDonutPointerMove}
            onPointerDown={handleDonutPointerDown}
            onClick={handleDonutClick}
            style={
              {
                background: spendingGradient,
                "--active-chart-color": `var(--chart-${
                  activeSpendingIndex + 1
                })`,
              } as CSSProperties
            }
          >
            <span className="spending-donut-center">
              <strong>{formatEuro(activePoint.italy, locale, 1)}</strong>{" "}
              <small>{activeTitle}</small>
            </span>
          </AppLink>
        ) : null}

        <div className="spending-list">
          {spendingBreakdown.map((indicator, index) => (
            <AppLink
              href={withQuery(
                pageHref(locale, `data/${indicator.id}`),
                query,
                getDisplayedPoint(indicator).year,
              )}
              key={indicator.id}
              data-active={indicator.id === activeSpending?.id}
              onMouseEnter={() => onSelectSpending(indicator.id)}
              onFocus={() => onSelectSpending(indicator.id)}
            >
              <span
                className="legend-dot"
                style={{
                  background: `var(--chart-${index + 1})`,
                }}
              />
              <span>
                {indicator.id === "spending-social-protection"
                  ? labels.socialProtectionHero
                  : indicator.title[locale]}
              </span>{" "}
              <strong>
                {formatEuro(getDisplayedPoint(indicator).italy, locale, 1)}
              </strong>
            </AppLink>
          ))}
        </div>
      </div>

      {activeSpending && activePoint ? (
        <div className="spending-active-summary" aria-live="polite">
          <div className="spending-active-figures">
            <strong>{activeTitle}</strong>
            <span>
              {labels.italy}: {formatEuro(activePoint.italy, locale, 1)}
              {activePoint.eu !== null
                ? ` · ${labels.eu}: ${formatEuro(activePoint.eu, locale, 1)}`
                : ""}
              {` · ${labels.median}: ${formatEuro(activePoint.median, locale, 1)}`}
            </span>
          </div>
          <AppLink
            className="spending-active-cta"
            href={withQuery(
              pageHref(locale, `data/${activeSpending.id}`),
              query,
              activePoint.year,
            )}
          >
            {locale === "it" ? "Apri la scheda" : "Open indicator"}{" "}
            <span aria-hidden="true">→</span>
          </AppLink>
        </div>
      ) : null}
      <p className="spending-interaction">{labels.spendingInteract}</p>
    </div>
  );
}

export function HomeView({
  data,
  locale,
  sourceCount,
}: {
  data: DashboardData;
  locale: Locale;
  sourceCount: number;
}) {
  const labels = copy[locale];
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

  const spendingSource = spendingBreakdown[0]?.source;
  const spendingPoint = spendingBreakdown[0]
    ? getDisplayedPoint(spendingBreakdown[0])
    : null;
  const spendingYear = spendingPoint?.year;
  const snapshotIndicators = snapshotIds
    .map((id) => data.indicators.find((indicator) => indicator.id === id))
    .filter(Boolean) as Indicator[];
  const snapshotTitles: Record<string, string> = {
    "gdp-per-capita-pps": labels.snapshotGdp,
    "median-age": labels.snapshotMedianAge,
    "life-expectancy": labels.snapshotLifeExpectancy,
    "employment-rate": labels.snapshotEmployment,
  };
  const activeSpending =
    spendingBreakdown.find((indicator) => indicator.id === activeSpendingId) ??
    spendingBreakdown[0];

  const heroEyebrow = labels.heroEyebrow.replace(
    "{year}",
    String(spendingYear ?? ""),
  );
  const heroLatest = labels.heroLatest;
  const heroSourceUpdated =
    spendingSource &&
    labels.heroSourceUpdated.replace(
      "{date}",
      formatDate(spendingSource.sourceUpdatedAt, locale),
    );

  const pageCards = [
    {
      path: "method",
      eyebrow: labels.methodEyebrow,
      title: labels.methodTitle,
      body: labels.methodBody,
    },
    {
      path: "sources",
      eyebrow: `${sourceCount} ${labels.sourceCount}`,
      title: labels.sourcesTitle,
      body: labels.sourcesBody,
    },
  ];

  return (
    <>
      <section
        className="country-snapshot"
        aria-labelledby="country-snapshot-title"
      >
        <div className="snapshot-heading">
          <div>
            <h1 id="country-snapshot-title">{labels.snapshotTitle}</h1>
            <p>{labels.snapshotBody}</p>
          </div>
        </div>

        <div className="snapshot-examples-bar">
          <span>{labels.snapshotExamples}</span>
          <AppLink
            className="snapshot-explore"
            href={pageHref(locale, "data") + "?topic=all"}
          >
            {labels.browseAll} ({data.indicators.length}){" "}
            <span aria-hidden="true">→</span>
          </AppLink>
        </div>
        <div className="snapshot-grid">
          {snapshotIndicators.map((indicator) => {
            const point = getDisplayedPoint(indicator);
            return (
              <AppLink
                href={pageHref(locale, `data/${indicator.id}`)}
                key={indicator.id}
              >
                <span>{snapshotTitles[indicator.id]}</span>{" "}
                <strong>
                  {formatValue(
                    point.italy,
                    indicator.unitKey,
                    indicator.precision,
                    locale,
                  )}
                </strong>{" "}
                <small>
                  {locale === "it" ? `Anno ${point.year}` : `Year ${point.year}`}
                  {point.status
                    ? ` (${statusDescription(point.status, locale, false)})`
                    : ""}{" "}
                  ·{" "}
                  {indicator.id === "gdp-per-capita-pps"
                    ? labels.snapshotGdpUnit
                    : point.eu !== null
                      ? `${labels.eu}: ${formatValue(
                          point.eu,
                          indicator.unitKey,
                          indicator.precision,
                          locale,
                        )}`
                      : labels.noAggregate}
                </small>{" "}
                <p className="snapshot-definition">
                  {snapshotDefinitions[indicator.id][locale]}
                </p>{" "}
                <em>
                  {labels.snapshotOpen} <span aria-hidden="true">→</span>
                </em>
              </AppLink>
            );
          })}
        </div>
      </section>

      <section
        className="question-directory"
        aria-labelledby="questions-title"
      >
        <h2 id="questions-title">
          {locale === "it"
            ? "Da cosa vuoi partire?"
            : "What would you like to explore?"}
        </h2>
        <div className="question-grid">
          {data.sections.map((section) => (
            <article key={section.id}>
              <h3>
                <AppLink
                  className="question-topic-link"
                  href={pageHref(locale, "data") + `?topic=${section.id}`}
                >
                  {section.title[locale]}
                </AppLink>
              </h3>
              <AppLink
                className="question-link"
                href={pageHref(
                  locale,
                  `data/${topicQuestions[section.id][0].id}`,
                )}
              >
                {topicQuestions[section.id][0].text[locale]}{" "}
                <span aria-hidden="true">→</span>
              </AppLink>
              <AppLink
                className="topic-all-link"
                href={pageHref(locale, "data") + `?topic=${section.id}`}
              >
                {locale === "it"
                  ? "Tutti gli indicatori del tema"
                  : "All indicators in this topic"}
              </AppLink>
            </article>
          ))}
        </div>
      </section>

      <section className="hero" id="spending-example">
        <div className="hero-copy">
          <p className="eyebrow">{heroEyebrow}</p>
          <h2>{labels.heroTitle}</h2>
          <p className="hero-intro">{labels.heroBody}</p>
          <div className="hero-facts">
            <div>
              <span>{labels.heroYear}</span>{" "}
              <strong>{spendingYear}</strong>{" "}
              <small>
                {heroLatest}
                {spendingPoint?.status
                  ? ` · ${statusDescription(
                      spendingPoint.status,
                      locale,
                      false,
                    )}`
                  : ""}
              </small>
            </div>
            <div>
              <span>{labels.heroSource}</span>{" "}
              <strong>{labels.heroSourceName} · COFOG</strong>{" "}
              <small>{heroSourceUpdated}</small>
              {spendingSource && activeSpending ? (
                <div className="hero-source-links">
                  <AppLink
                    href={
                      pageHref(locale, `data/${activeSpending.id}/source`) +
                      `?year=${getDisplayedPoint(activeSpending).year}`
                    }
                  >
                    {labels.heroOpenSource}:{" "}
                    {activeSpending.id === "spending-social-protection"
                      ? labels.socialProtectionHero
                      : activeSpending.title[locale]}{" "}
                    <span aria-hidden="true">→</span>
                  </AppLink>
                </div>
              ) : null}
            </div>
          </div>
          <details className="hero-method">
            <summary>
              <span className="info-badge" aria-hidden="true">
                i
              </span>
              {labels.heroMethodSummary}
            </summary>
            <div>
              <p>{labels.heroMethodBody}</p>
              <p>{labels.heroBudgetNote}</p>
              <AppLink href={pageHref(locale, "method")}>
                {labels.heroMethodLink} <span aria-hidden="true">→</span>
              </AppLink>
            </div>
          </details>
          <AppLink className="primary-link" href={pageHref(locale, "data")}>
            {labels.readBreakdown} <span aria-hidden="true">→</span>
          </AppLink>
        </div>

        <SpendingBreakdownCard
          spendingBreakdown={spendingBreakdown}
          locale={locale}
          activeSpendingId={activeSpendingId}
          onSelectSpending={setActiveSpendingId}
        />
      </section>

      <section className="landing-directory">
        <div className="landing-directory-heading">
          <h2>{labels.exploreTitle}</h2>
          <p>{labels.exploreBody}</p>
        </div>
        <div className="landing-page-grid">
          {pageCards.map((page) => (
            <AppLink href={pageHref(locale, page.path)} key={page.path}>
              <span>{page.eyebrow}</span>
              <h3>{page.title}</h3>
              <p>{page.body}</p>
              <strong>
                {labels.openPage} <span aria-hidden="true">→</span>
              </strong>
            </AppLink>
          ))}
        </div>
      </section>
    </>
  );
}
