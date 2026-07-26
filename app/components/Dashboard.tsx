"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

type Locale = "it" | "en";
type LocalizedText = Record<Locale, string>;

type DataPoint = {
  year: number;
  italy: number;
  eu: number;
  median: number;
  coverage: number;
  euMethod: "official_aggregate" | "country_mean";
  status: string | null;
};

type Source = {
  institution: string;
  datasetCode: string;
  datasetLabel: string;
  dataBrowserUrl: string;
  apiUrl: string;
  metadataUrl: string | null;
  doi: string;
  sourceUpdatedAt: string;
};

type Indicator = {
  id: string;
  section: string;
  title: LocalizedText;
  plain: LocalizedText;
  technical: LocalizedText;
  unitKey: string;
  precision: number;
  featured: boolean;
  isDetail: boolean;
  startYear: number;
  latest: DataPoint;
  newerEstimate: DataPoint | null;
  series: DataPoint[];
  source: Source;
};

type Section = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
};

export type DashboardData = {
  generatedAt: string;
  methodologyVersion: string;
  comparison: LocalizedText;
  sections: Section[];
  indicators: Indicator[];
};

type DashboardProps = {
  data: DashboardData;
  locale: Locale;
};

const themeStorageKey = "explainable-italy-theme";

function subscribeToTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => observer.disconnect();
}

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

const copy = {
  it: {
    skip: "Vai al contenuto",
    subtitle: "L’Italia, i dati ufficiali per tutti.",
    navData: "I dati",
    navMethod: "Metodo",
    navSources: "Fonti",
    navAbout: "About",
    navContribute: "Contribuisci",
    searchLabel: "Cerca un indicatore",
    searchPlaceholder: "Prova pensioni, lavoro, scuola",
    allSections: "Tutti",
    heroEyebrow: "Un bilancio in cento euro",
    heroTitle: "Se la pubblica amministrazione spende 100 €, dove vanno?",
    heroBody:
      "La risposta usa la classificazione europea COFOG. Comprende l’intera pubblica amministrazione, non solo il bilancio dello Stato.",
    heroYear: "Dati",
    oldAgeNote: "Di questi, {value} € sono classificati nella funzione vecchiaia.",
    oldAgeCaveat:
      "La funzione vecchiaia comprende soprattutto pensioni di vecchiaia, ma anche servizi e altre prestazioni. Non coincide con tutte le pensioni.",
    readBreakdown: "Esplora tutte le voci",
    keyNumbers: "Quattro numeri per orientarsi",
    definitive: "ultimo dato non stimato",
    estimate: "Dato più recente",
    provisional: "provvisorio o stimato",
    compareTitle: "Italia, UE e mediana dei Paesi",
    italy: "Italia",
    eu: "UE",
    median: "Mediana",
    officialAggregate: "aggregato ufficiale Eurostat",
    countryMean: "media aritmetica dei Paesi",
    compareExplainer: "Come leggere media e mediana",
    dataSectionTitle: "L’Italia in 39 indicatori",
    dataSectionBody:
      "Ogni numero ha una definizione, una serie storica, il confronto europeo e il collegamento alla fonte.",
    noResults: "Nessun indicatore corrisponde alla ricerca.",
    understand: "Capire il dato",
    simpleDefinition: "In parole semplici",
    technicalDefinition: "Definizione tecnica",
    trend: "Andamento dell’Italia",
    from: "dal",
    source: "Fonte",
    sourceUpdated: "Fonte aggiornata",
    dataset: "Dataset",
    openData: "Apri i dati ufficiali",
    openMetadata: "Leggi la metodologia Eurostat",
    downloadIndicator: "Scarica questo indicatore",
    dataStatusBreak: "La serie segnala una discontinuità metodologica nell’ultimo anno.",
    methodEyebrow: "Metodo pubblico",
    methodTitle: "Le regole vengono prima dei risultati",
    methodBody:
      "Se una regola cambia dopo avere visto un numero, il confronto perde credibilità. Per questo criteri, formule e limiti sono dichiarati in anticipo.",
    rules: [
      {
        title: "Solo fonti ufficiali",
        body: "Usiamo dati prodotti o pubblicati da istituzioni statistiche e amministrazioni pubbliche. Per i confronti scegliamo serie armonizzate Eurostat.",
      },
      {
        title: "Nessuna selezione comoda",
        body: "Confrontiamo sempre Italia, aggregato UE e mediana dei Paesi. Non scegliamo singoli Paesi perché rendono migliore una tesi.",
      },
      {
        title: "Precisione senza finzioni",
        body: "Mostriamo solo i decimali giustificati dalla fonte. Stime e dati provvisori restano separati dall’ultimo valore non stimato.",
      },
      {
        title: "Copie verificabili",
        body: "Nella repository conserviamo le sole serie usate, il collegamento originale, la data di acquisizione e l’impronta digitale del file.",
      },
      {
        title: "Spiegazioni, non giudizi",
        body: "Definiamo cosa misura un indicatore e cosa non misura. Non assegniamo voti e non suggeriamo conclusioni politiche.",
      },
      {
        title: "Stesso intervallo quando possibile",
        body: "Le serie iniziano dal primo anno comune disponibile per Italia e confronto UE, mai prima del 2000.",
      },
    ],
    medianTitle: "Perché mostriamo anche la mediana",
    sourcesEyebrow: "Tracciabilità",
    sourcesTitle: "La fonte è parte del dato",
    sourcesBody:
      "Ogni grafico porta al dataset che lo alimenta. La copia locale contiene solo le osservazioni necessarie, quindi occupa poco spazio e può essere verificata nel tempo.",
    sourceCount: "dataset ufficiali",
    localSize: "circa 1,1 MB di dati e copie pubbliche",
    manifest: "Apri il registro delle fonti",
    downloadAll: "Scarica tutti i dati in CSV",
    aboutEyebrow: "About",
    aboutTitle: "Rendere leggibile ciò che è già pubblico",
    aboutBody:
      "Explainable Italy nasce da un problema semplice. Molti dati ufficiali esistono, ma sono distribuiti tra portali, classificazioni e formati difficili da leggere. Il progetto li raccoglie in un percorso coerente, chiaro e verificabile.",
    founder: "Un progetto di Andrea Gentilini",
    independence:
      "Explainable Italy è un progetto indipendente. Non rappresenta e non è approvato dalle istituzioni citate. Le elaborazioni sono indicate come tali.",
    privacy:
      "Il sito non usa cookie, pubblicità, profilazione o strumenti di analisi. Non raccoglie dati personali.",
    futureTitle: "Cosa potremo aggiungere",
    futureBody:
      "La struttura è pronta per crescere senza cambiare le regole di selezione.",
    roadmap: [
      "Imposte, contributi e composizione del prelievo",
      "Distribuzione dei redditi, disuguaglianza e potere d’acquisto",
      "Medici, posti letto, tempi di attesa e risultati sanitari",
      "Ricerca, innovazione, produttività e digitalizzazione",
      "Giustizia, durata dei procedimenti e sistema carcerario",
      "Trasporti, mobilità, sicurezza stradale e infrastrutture",
      "Casa, affitti, mutui e costi dell’abitare",
      "Commercio estero, dipendenza energetica e materie prime",
    ],
    contributeEyebrow: "Contributions",
    contributeTitle: "Un progetto aperto, con regole chiare",
    contributeBody:
      "Le proposte passano da issue e pull request. Una nuova voce deve essere comprensibile, riproducibile e basata su una fonte ufficiale.",
    contributionRules: [
      "Indicare l’istituzione, il dataset, la definizione e la licenza.",
      "Spiegare perché l’indicatore è rilevante per un cittadino non specialista.",
      "Fornire la formula di ogni trasformazione e un controllo indipendente.",
      "Aggiungere italiano e inglese con lo stesso significato.",
      "Non usare titoli sensazionalistici o interpretazioni causali non supportate.",
      "Aggiornare test, registro delle fonti e note sulle revisioni.",
      "Rispettare accessibilità, privacy e licenza MIT del codice.",
    ],
    contributionLink: "Leggi la guida completa nella repository",
    footer:
      "Dati ufficiali. Elaborazioni trasparenti. Nessun tracciamento.",
    themeLight: "Usa tema chiaro",
    themeDark: "Usa tema scuro",
    language: "English",
    latestUpdate: "Dati acquisiti",
  },
  en: {
    skip: "Skip to content",
    subtitle: "Italy, official data for everyone.",
    navData: "Data",
    navMethod: "Method",
    navSources: "Sources",
    navAbout: "About",
    navContribute: "Contribute",
    searchLabel: "Search indicators",
    searchPlaceholder: "Try pensions, work, education",
    allSections: "All",
    heroEyebrow: "A budget in one hundred euros",
    heroTitle: "If general government spends €100, where does it go?",
    heroBody:
      "The answer uses the European COFOG classification. It covers the whole of general government, not only the central government budget.",
    heroYear: "Data",
    oldAgeNote: "Of this amount, €{value} is classified under the old age function.",
    oldAgeCaveat:
      "The old age function mainly includes old age pensions, but also services and other benefits. It is not the same as all pension expenditure.",
    readBreakdown: "Explore every category",
    keyNumbers: "Four numbers for orientation",
    definitive: "latest non estimated value",
    estimate: "More recent value",
    provisional: "provisional or estimated",
    compareTitle: "Italy, EU and country median",
    italy: "Italy",
    eu: "EU",
    median: "Median",
    officialAggregate: "official Eurostat aggregate",
    countryMean: "arithmetic country mean",
    compareExplainer: "How to read average and median",
    dataSectionTitle: "Italy in 39 indicators",
    dataSectionBody:
      "Every number has a definition, a historical series, a European comparison and a direct source.",
    noResults: "No indicators match this search.",
    understand: "Understand this indicator",
    simpleDefinition: "In plain language",
    technicalDefinition: "Technical definition",
    trend: "Italy over time",
    from: "from",
    source: "Source",
    sourceUpdated: "Source updated",
    dataset: "Dataset",
    openData: "Open official data",
    openMetadata: "Read Eurostat methodology",
    downloadIndicator: "Download this indicator",
    dataStatusBreak: "The series marks a methodological break in its latest year.",
    methodEyebrow: "Public method",
    methodTitle: "Rules come before results",
    methodBody:
      "If a rule changes after seeing a number, the comparison loses credibility. Criteria, formulas and limitations are declared in advance.",
    rules: [
      {
        title: "Official sources only",
        body: "We use data produced or published by statistical institutions and public administrations. For comparisons we use harmonised Eurostat series.",
      },
      {
        title: "No convenient selection",
        body: "We always compare Italy, the EU aggregate and the country median. We do not pick individual countries because they support a preferred argument.",
      },
      {
        title: "No false precision",
        body: "We show only the decimals justified by the source. Estimates and provisional data remain separate from the latest non estimated value.",
      },
      {
        title: "Verifiable copies",
        body: "The repository stores only the series used, the original link, acquisition date and digital fingerprint of each file.",
      },
      {
        title: "Explanations, not judgements",
        body: "We define what an indicator measures and what it does not measure. We do not grade countries or suggest political conclusions.",
      },
      {
        title: "The same range where possible",
        body: "Series begin at the first common year available for Italy and the EU comparison, never before 2000.",
      },
    ],
    medianTitle: "Why we also show the median",
    sourcesEyebrow: "Traceability",
    sourcesTitle: "The source is part of the data",
    sourcesBody:
      "Every chart links to its dataset. The local copy contains only the observations needed, so it stays small and can be verified over time.",
    sourceCount: "official datasets",
    localSize: "about 1.1 MB of data and public copies",
    manifest: "Open the source register",
    downloadAll: "Download all data as CSV",
    aboutEyebrow: "About",
    aboutTitle: "Making public information readable",
    aboutBody:
      "Explainable Italy begins with a simple problem. A great deal of official data exists, but it is spread across portals, classifications and formats that are hard to read. The project brings it into one coherent, clear and verifiable path.",
    founder: "A project by Andrea Gentilini",
    independence:
      "Explainable Italy is an independent project. It does not represent and is not endorsed by the institutions cited. Project calculations are identified as such.",
    privacy:
      "The site uses no cookies, advertising, profiling or analytics. It collects no personal data.",
    futureTitle: "What we can add next",
    futureBody:
      "The structure is ready to grow without changing the selection rules.",
    roadmap: [
      "Taxes, social contributions and the composition of the tax burden",
      "Income distribution, inequality and purchasing power",
      "Doctors, hospital beds, waiting times and health outcomes",
      "Research, innovation, productivity and digitalisation",
      "Justice, length of proceedings and the prison system",
      "Transport, mobility, road safety and infrastructure",
      "Housing, rents, mortgages and the cost of living",
      "Foreign trade, energy dependence and raw materials",
    ],
    contributeEyebrow: "Contributions",
    contributeTitle: "An open project with clear rules",
    contributeBody:
      "Proposals start with issues and pull requests. A new indicator must be understandable, reproducible and based on an official source.",
    contributionRules: [
      "State the institution, dataset, definition and licence.",
      "Explain why the indicator matters to a non specialist citizen.",
      "Provide the formula for every transformation and an independent check.",
      "Add Italian and English text with the same meaning.",
      "Avoid sensational headlines and unsupported causal interpretations.",
      "Update tests, the source register and revision notes.",
      "Respect accessibility, privacy and the MIT licence for code.",
    ],
    contributionLink: "Read the full guide in the repository",
    footer: "Official data. Transparent calculations. No tracking.",
    themeLight: "Use light theme",
    themeDark: "Use dark theme",
    language: "Italiano",
    latestUpdate: "Data acquired",
  },
} as const;

const sectionColors: Record<string, string> = {
  spending: "#136f63",
  people: "#2f6fce",
  economy: "#8b5e34",
  welfare: "#9c4f6d",
  education: "#7557a8",
  environment: "#4f7f3d",
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function formatValue(
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
      eu_index: "",
      index_1990: "",
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
      eu_index: "",
      index_1990: "",
      tonnes_co2e: " t CO₂e per person",
      toe_per_capita: " toe per person",
    },
  };

  return `${number}${units[locale][unitKey] ?? ""}`;
}

function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function buildIndicatorCsv(indicator: Indicator) {
  const rows = [
    [
      "year",
      "italy",
      "eu",
      "median",
      "countries_in_median",
      "eu_method",
      "status",
    ],
    ...indicator.series.map((point) => [
      point.year,
      point.italy,
      point.eu,
      point.median,
      point.coverage,
      point.euMethod,
      point.status ?? "",
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

function downloadIndicator(indicator: Indicator) {
  const blob = new Blob([buildIndicatorCsv(indicator)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${indicator.id}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ComparisonPlot({
  indicator,
  locale,
}: {
  indicator: Indicator;
  locale: Locale;
}) {
  const labels = copy[locale];
  const values = [
    { id: "italy", label: labels.italy, value: indicator.latest.italy },
    { id: "eu", label: labels.eu, value: indicator.latest.eu },
    { id: "median", label: labels.median, value: indicator.latest.median },
  ];
  const minimum = Math.min(0, ...values.map((entry) => entry.value));
  const maximum = Math.max(0, ...values.map((entry) => entry.value));
  const range = maximum - minimum || 1;
  const position = (value: number) => ((value - minimum) / range) * 100;
  const methodLabel =
    indicator.latest.euMethod === "official_aggregate"
      ? labels.officialAggregate
      : labels.countryMean;

  return (
    <div
      className="comparison"
      role="img"
      aria-label={`${labels.compareTitle}. ${labels.italy} ${formatValue(
        indicator.latest.italy,
        indicator.unitKey,
        indicator.precision,
        locale,
      )}. ${labels.eu} ${formatValue(
        indicator.latest.eu,
        indicator.unitKey,
        indicator.precision,
        locale,
      )}. ${labels.median} ${formatValue(
        indicator.latest.median,
        indicator.unitKey,
        indicator.precision,
        locale,
      )}.`}
    >
      <div className="comparison-heading">
        <span>{labels.compareTitle}</span>
        <span title={methodLabel}>{indicator.latest.coverage}/27</span>
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
      <p className="comparison-method">{methodLabel}</p>
    </div>
  );
}

function TrendBars({
  indicator,
  locale,
}: {
  indicator: Indicator;
  locale: Locale;
}) {
  const points = indicator.series.slice(-12);
  const values = points.map((point) => point.italy);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = maximum - minimum || 1;
  const zeroPosition = (maximum / range) * 100;

  return (
    <div className="trend-chart" aria-label={copy[locale].trend} role="img">
      <span
        className="trend-zero"
        style={{ top: `${zeroPosition}%` }}
        aria-hidden="true"
      />
      {points.map((point) => {
        const top =
          point.italy >= 0
            ? ((maximum - point.italy) / range) * 100
            : zeroPosition;
        const height = (Math.abs(point.italy) / range) * 100;

        return (
          <div className="trend-column" key={point.year}>
            <span
              className={`trend-bar ${point.italy < 0 ? "negative" : ""}`}
              style={{ top: `${top}%`, height: `${Math.max(height, 2)}%` }}
              title={`${point.year}: ${formatValue(
                point.italy,
                indicator.unitKey,
                indicator.precision,
                locale,
              )}`}
            />
            <small>{String(point.year).slice(2)}</small>
          </div>
        );
      })}
    </div>
  );
}

function IndicatorCard({
  indicator,
  locale,
}: {
  indicator: Indicator;
  locale: Locale;
}) {
  const labels = copy[locale];
  const isBreak = indicator.latest.status?.includes("b");

  return (
    <article
      className="indicator-card"
      id={indicator.id}
      style={
        {
          "--section-color": sectionColors[indicator.section],
        } as CSSProperties
      }
    >
      <div className="indicator-card-top">
        <div>
          <p className="indicator-kicker">
            {labels.definitive}, {indicator.latest.year}
          </p>
          <h3>{indicator.title[locale]}</h3>
        </div>
        <p className="indicator-value">
          {formatValue(
            indicator.latest.italy,
            indicator.unitKey,
            indicator.precision,
            locale,
          )}
        </p>
      </div>

      {indicator.newerEstimate ? (
        <p className="estimate-note">
          <span>{labels.estimate}</span>
          <strong>
            {formatValue(
              indicator.newerEstimate.italy,
              indicator.unitKey,
              indicator.precision,
              locale,
            )}
          </strong>
          <span>
            {indicator.newerEstimate.year}, {labels.provisional}
          </span>
        </p>
      ) : null}

      <ComparisonPlot indicator={indicator} locale={locale} />

      <details className="indicator-details">
        <summary>{labels.understand}</summary>
        <div className="indicator-details-body">
          <div className="definition-grid">
            <div>
              <h4>{labels.simpleDefinition}</h4>
              <p>{indicator.plain[locale]}</p>
            </div>
            <div>
              <h4>{labels.technicalDefinition}</h4>
              <p>{indicator.technical[locale]}</p>
            </div>
          </div>

          {isBreak ? <p className="status-note">{labels.dataStatusBreak}</p> : null}

          <div className="trend-block">
            <div className="trend-heading">
              <h4>{labels.trend}</h4>
              <span>
                {labels.from} {indicator.startYear}
              </span>
            </div>
            <TrendBars indicator={indicator} locale={locale} />
          </div>

          <div className="source-box">
            <div>
              <span>{labels.source}</span>
              <strong>
                {indicator.source.institution}, {indicator.source.datasetCode}
              </strong>
            </div>
            <div>
              <span>{labels.sourceUpdated}</span>
              <strong>{formatDate(indicator.source.sourceUpdatedAt, locale)}</strong>
            </div>
          </div>

          <div className="card-actions">
            <a
              href={indicator.source.dataBrowserUrl}
              target="_blank"
              rel="noreferrer"
            >
              {labels.openData} <span aria-hidden="true">↗</span>
            </a>
            {indicator.source.metadataUrl ? (
              <a
                href={indicator.source.metadataUrl}
                target="_blank"
                rel="noreferrer"
              >
                {labels.openMetadata} <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            <button type="button" onClick={() => downloadIndicator(indicator)}>
              {labels.downloadIndicator}
            </button>
          </div>
        </div>
      </details>
    </article>
  );
}

export function Dashboard({ data, locale }: DashboardProps) {
  const labels = copy[locale];
  const [activeSection, setActiveSection] = useState("all");
  const [search, setSearch] = useState("");
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false,
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    const shouldUseDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem(themeStorageKey, next ? "dark" : "light");
  };

  const spendingBreakdown = useMemo(
    () =>
      data.indicators
        .filter(
          (indicator) =>
            indicator.section === "spending" &&
            indicator.id.startsWith("spending-") &&
            !indicator.isDetail,
        )
        .sort((left, right) => right.latest.italy - left.latest.italy),
    [data.indicators],
  );

  const oldAge = data.indicators.find(
    (indicator) => indicator.id === "spending-old-age",
  );
  const featuredIds = [
    "public-debt",
    "budget-balance",
    "employment-rate",
    "life-expectancy",
  ];
  const featured = featuredIds
    .map((id) => data.indicators.find((indicator) => indicator.id === id))
    .filter(Boolean) as Indicator[];

  const filteredIndicators = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);

    return data.indicators.filter((indicator) => {
      const matchesSection =
        activeSection === "all" || indicator.section === activeSection;
      const searchableText = [
        indicator.title[locale],
        indicator.plain[locale],
        indicator.technical[locale],
        indicator.source.datasetCode,
      ]
        .join(" ")
        .toLocaleLowerCase(locale);

      return (
        matchesSection &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [activeSection, data.indicators, locale, search]);

  const sources = useMemo(() => {
    const unique = new Map<string, Source>();
    for (const indicator of data.indicators) {
      unique.set(indicator.source.datasetCode, indicator.source);
    }
    return [...unique.values()].sort((left, right) =>
      left.datasetCode.localeCompare(right.datasetCode),
    );
  }, [data.indicators]);

  const oldAgeSentence = oldAge
    ? labels.oldAgeNote.replace(
        "{value}",
        new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(oldAge.latest.italy),
      )
    : "";

  return (
    <div className="site-shell" lang={locale}>
      <a className="skip-link" href="#main">
        {labels.skip}
      </a>

      <header className="site-header">
        <a
          className="brand"
          href={locale === "it" ? `${basePath}/` : `${basePath}/en/`}
        >
          <span className="brand-mark" aria-hidden="true">
            ei
          </span>
          <span>
            <strong>Explainable Italy</strong>
            <small>{labels.subtitle}</small>
          </span>
        </a>

        <nav aria-label="Primary">
          <a href="#data">{labels.navData}</a>
          <a href="#method">{labels.navMethod}</a>
          <a href="#sources">{labels.navSources}</a>
          <a href="#about">{labels.navAbout}</a>
          <a href="#contribute">{labels.navContribute}</a>
        </nav>

        <div className="header-actions">
          <a
            className="language-link"
            href={locale === "it" ? `${basePath}/en/` : `${basePath}/`}
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
            <span aria-hidden="true">{darkMode ? "○" : "●"}</span>
          </button>
        </div>
      </header>

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{labels.heroEyebrow}</p>
            <h1>{labels.heroTitle}</h1>
            <p className="hero-intro">{labels.heroBody}</p>
            <div className="hero-meta">
              <span>
                {labels.heroYear} {spendingBreakdown[0]?.latest.year}
              </span>
              <span>Eurostat · COFOG</span>
            </div>
            <a className="primary-link" href="#data">
              {labels.readBreakdown} <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hundred-euro-card">
            <div className="hundred-euro-heading">
              <span>100 €</span>
              <small>{locale === "it" ? "di spesa pubblica" : "of public spending"}</small>
            </div>
            <div
              className="spending-stack"
              role="img"
              aria-label={labels.heroTitle}
            >
              {spendingBreakdown.map((indicator, index) => (
                <span
                  key={indicator.id}
                  style={{
                    width: `${indicator.latest.italy}%`,
                    background: `var(--chart-${index + 1})`,
                  }}
                  title={`${indicator.title[locale]}: ${formatValue(
                    indicator.latest.italy,
                    indicator.unitKey,
                    indicator.precision,
                    locale,
                  )}`}
                />
              ))}
            </div>
            <div className="spending-list">
              {spendingBreakdown.map((indicator, index) => (
                <a href={`#${indicator.id}`} key={indicator.id}>
                  <span
                    className="legend-dot"
                    style={{ background: `var(--chart-${index + 1})` }}
                  />
                  <span>{indicator.title[locale]}</span>
                  <strong>
                    {new Intl.NumberFormat(
                      locale === "it" ? "it-IT" : "en-GB",
                      {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      },
                    ).format(indicator.latest.italy)}
                    €
                  </strong>
                </a>
              ))}
            </div>
            {oldAge ? (
              <div className="old-age-note">
                <strong>{oldAgeSentence}</strong>
                <p>{labels.oldAgeCaveat}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="featured-section" aria-labelledby="key-numbers">
          <h2 id="key-numbers">{labels.keyNumbers}</h2>
          <div className="featured-grid">
            {featured.map((indicator) => (
              <a href={`#${indicator.id}`} key={indicator.id}>
                <span>{indicator.title[locale]}</span>
                <strong>
                  {formatValue(
                    indicator.latest.italy,
                    indicator.unitKey,
                    indicator.precision,
                    locale,
                  )}
                </strong>
                <small>
                  {indicator.latest.year} · {labels.italy}
                </small>
              </a>
            ))}
          </div>
        </section>

        <section className="data-section" id="data">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{labels.navData}</p>
              <h2>{labels.dataSectionTitle}</h2>
              <p>{labels.dataSectionBody}</p>
            </div>
            <label className="search-field">
              <span>{labels.searchLabel}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={labels.searchPlaceholder}
              />
            </label>
          </div>

          <div className="section-filters" aria-label={labels.navData}>
            <button
              type="button"
              className={activeSection === "all" ? "active" : ""}
              onClick={() => setActiveSection("all")}
            >
              {labels.allSections}
              <span>{data.indicators.length}</span>
            </button>
            {data.sections.map((section) => (
              <button
                type="button"
                className={activeSection === section.id ? "active" : ""}
                onClick={() => setActiveSection(section.id)}
                key={section.id}
              >
                {section.title[locale]}
                <span>
                  {
                    data.indicators.filter(
                      (indicator) => indicator.section === section.id,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>

          <div className="indicator-grid">
            {filteredIndicators.map((indicator) => (
              <IndicatorCard
                indicator={indicator}
                locale={locale}
                key={indicator.id}
              />
            ))}
          </div>

          {filteredIndicators.length === 0 ? (
            <p className="empty-state">{labels.noResults}</p>
          ) : null}
        </section>

        <section className="method-section" id="method">
          <div className="method-intro">
            <p className="eyebrow">{labels.methodEyebrow}</p>
            <h2>{labels.methodTitle}</h2>
            <p>{labels.methodBody}</p>
          </div>
          <div className="method-rules">
            {labels.rules.map((rule, index) => (
              <article key={rule.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
              </article>
            ))}
          </div>
          <details className="median-explainer">
            <summary>{labels.medianTitle}</summary>
            <p>{data.comparison[locale]}</p>
          </details>
        </section>

        <section className="sources-section" id="sources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{labels.sourcesEyebrow}</p>
              <h2>{labels.sourcesTitle}</h2>
              <p>{labels.sourcesBody}</p>
            </div>
            <div className="source-stats">
              <strong>{sources.length}</strong>
              <span>{labels.sourceCount}</span>
              <small>{labels.localSize}</small>
            </div>
          </div>

          <div className="source-actions">
            <a href={`${basePath}/data/manifest.json`}>{labels.manifest}</a>
            <a href={`${basePath}/data/dashboard.csv`} download>
              {labels.downloadAll}
            </a>
          </div>

          <div className="source-list">
            {sources.map((source) => (
              <article key={source.datasetCode}>
                <div>
                  <span>{source.datasetCode}</span>
                  <h3>{source.datasetLabel}</h3>
                </div>
                <a
                  href={source.dataBrowserUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${labels.openData}: ${source.datasetCode}`}
                >
                  ↗
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-main">
            <p className="eyebrow">{labels.aboutEyebrow}</p>
            <h2>{labels.aboutTitle}</h2>
            <p>{labels.aboutBody}</p>
            <strong>{labels.founder}</strong>
          </div>
          <div className="about-notes">
            <p>{labels.independence}</p>
            <p>{labels.privacy}</p>
          </div>

          <div className="roadmap">
            <div>
              <h3>{labels.futureTitle}</h3>
              <p>{labels.futureBody}</p>
            </div>
            <ol>
              {labels.roadmap.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="contribute-section" id="contribute">
          <div>
            <p className="eyebrow">{labels.contributeEyebrow}</p>
            <h2>{labels.contributeTitle}</h2>
            <p>{labels.contributeBody}</p>
            <a href="https://github.com/andrea-gentilini/explainable-italy/blob/main/CONTRIBUTING.md">
              {labels.contributionLink} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ol>
            {labels.contributionRules.map((rule, index) => (
              <li key={rule}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{rule}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer>
        <div className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">
            ei
          </span>
          <span>
            <strong>Explainable Italy</strong>
            <small>{labels.footer}</small>
          </span>
        </div>
        <p>
          {labels.latestUpdate} {formatDate(data.generatedAt, locale)}
        </p>
        <p>MIT · 2026 Andrea Gentilini</p>
      </footer>
    </div>
  );
}
