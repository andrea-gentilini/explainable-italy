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
  view?: DashboardView;
  selectedIndicatorId?: string;
};

export type DashboardView =
  | "home"
  | "data"
  | "method"
  | "sources"
  | "about"
  | "contribute"
  | "indicator";

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

function pageHref(locale: Locale, path = "") {
  const localeRoot = locale === "en" ? `${basePath}/en` : basePath;
  return `${localeRoot}${path ? `/${path}` : ""}/`;
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
    landingEyebrow: "Dati pubblici, finalmente leggibili",
    landingTitle: "Capire l’Italia senza perdersi nei portali statistici",
    landingBody:
      "Explainable Italy organizza i dati ufficiali in un percorso semplice: prima il numero essenziale, poi il confronto europeo, infine definizione, andamento e fonte.",
    exploreTitle: "Scegli da dove iniziare",
    exploreBody:
      "Ogni area ha una pagina dedicata. Puoi consultare il quadro generale oppure approfondire un singolo indicatore.",
    openPage: "Apri la pagina",
    openIndicator: "Apri la scheda completa",
    backToData: "Torna a tutti i dati",
    searchLabel: "Cerca un indicatore",
    searchPlaceholder: "Prova pensioni, lavoro, scuola",
    allSections: "Tutti",
    heroEyebrow: "Italia · {year}",
    heroTitle: "Dove vanno 100 € di spesa pubblica?",
    heroBody:
      "Per spesa pubblica intendiamo tutto ciò che spendono Stato, Regioni, Comuni ed enti previdenziali: servizi, stipendi, pensioni, investimenti e interessi. Non sono 100 € a persona: abbiamo ridotto il totale a 100 €.",
    heroYear: "Anno dei dati",
    heroLatest:
      "Ultimo disponibile per l’Italia; il {nextYear} non è ancora pubblicato",
    heroProvisional: "dato provvisorio",
    heroSource: "Fonte ufficiale",
    heroSourceName: "Eurostat, dati trasmessi da Istat",
    heroSourceUpdated: "aggiornata il {date}",
    heroOpenSource: "Apri la tabella Eurostat",
    heroOpenIstat: "Apri la scheda Istat",
    heroMethodSummary: "Come sono create queste categorie?",
    heroMethodBody:
      "Eurostat divide la spesa in dieci funzioni comuni ai Paesi europei. Il nome tecnico è COFOG: serve a confrontare le stesse voci tra Paesi diversi.",
    heroBudgetNote:
      "Non colleghiamo il solo bilancio dello Stato perché lascerebbe fuori Regioni, Comuni ed enti previdenziali. Qui usiamo i conti consolidati dell’intera Pubblica amministrazione.",
    heroMethodLink: "Leggi il metodo",
    heroCardLabel: "equivalgono al 100% della spesa del {year}",
    socialProtectionHero: "Protezione sociale (incluse pensioni)",
    oldAgeNote:
      "Le pensioni sono qui: dei {social} € di protezione sociale, {value} € riguardano la vecchiaia.",
    oldAgeCaveat:
      "È una sotto-voce dei {social} €, non una spesa aggiuntiva. Comprende soprattutto pensioni di vecchiaia; altre pensioni possono rientrare, per esempio, in invalidità o superstiti.",
    oldAgeLink: "Capire pensioni e vecchiaia",
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
    sourceDirectory: "Consulta l’elenco completo",
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
    futureToggle: "Vedi le prossime aree di lavoro",
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
    results: "indicatori mostrati",
  },
  en: {
    skip: "Skip to content",
    subtitle: "Italy, official data for everyone.",
    navData: "Data",
    navMethod: "Method",
    navSources: "Sources",
    navAbout: "About",
    navContribute: "Contribute",
    landingEyebrow: "Public data, finally readable",
    landingTitle: "Understand Italy without getting lost in statistical portals",
    landingBody:
      "Explainable Italy organises official data into a simple path: the essential number first, then the European comparison, followed by definition, trend and source.",
    exploreTitle: "Choose where to begin",
    exploreBody:
      "Every area has its own page. Browse the overall picture or open a single indicator for the full detail.",
    openPage: "Open page",
    openIndicator: "Open the full indicator",
    backToData: "Back to all data",
    searchLabel: "Search indicators",
    searchPlaceholder: "Try pensions, work, education",
    allSections: "All",
    heroEyebrow: "Italy · {year}",
    heroTitle: "Where does €100 of public spending go?",
    heroBody:
      "Public spending means everything spent by central government, regions, municipalities and social security funds: services, pay, pensions, investment and interest. This is not €100 per person: we scale the total down to €100.",
    heroYear: "Data year",
    heroLatest:
      "Latest available for Italy; {nextYear} has not been published yet",
    heroProvisional: "provisional data",
    heroSource: "Official source",
    heroSourceName: "Eurostat, data transmitted by Istat",
    heroSourceUpdated: "updated {date}",
    heroOpenSource: "Open the Eurostat table",
    heroOpenIstat: "Open the Istat record",
    heroMethodSummary: "How are these categories created?",
    heroMethodBody:
      "Eurostat divides spending into ten functions shared by European countries. The technical name is COFOG: it makes equivalent categories comparable across countries.",
    heroBudgetNote:
      "We do not link only to the central government budget because that would exclude regions, municipalities and social security funds. These are consolidated accounts for the whole of general government.",
    heroMethodLink: "Read the method",
    heroCardLabel: "represent 100% of {year} spending",
    socialProtectionHero: "Social protection (including pensions)",
    oldAgeNote:
      "Pensions are here: of the €{social} for social protection, €{value} relates to old age.",
    oldAgeCaveat:
      "This is a subcategory of the €{social}, not extra spending. It mainly includes old-age pensions; other pensions may fall under disability or survivors, for example.",
    oldAgeLink: "Understand pensions and old age",
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
    sourceDirectory: "Browse the full directory",
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
    futureToggle: "See the next areas of work",
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
    results: "indicators shown",
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
  sectionTitle,
  expanded = false,
}: {
  indicator: Indicator;
  locale: Locale;
  sectionTitle: string;
  expanded?: boolean;
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
        <div className="indicator-copy">
          <p className="indicator-kicker">{sectionTitle}</p>
          <h3>{indicator.title[locale]}</h3>
          <p className="indicator-summary">{indicator.plain[locale]}</p>
        </div>
        <div className="indicator-reading">
          <p className="indicator-value">
            {formatValue(
              indicator.latest.italy,
              indicator.unitKey,
              indicator.precision,
              locale,
            )}
          </p>
          <span>
            {labels.italy} · {indicator.latest.year}
          </span>
        </div>
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

      {expanded ? (
        <details className="indicator-details" open>
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

            {isBreak ? (
              <p className="status-note">{labels.dataStatusBreak}</p>
            ) : null}

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
                <strong>
                  {formatDate(indicator.source.sourceUpdatedAt, locale)}
                </strong>
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
      ) : (
        <a
          className="indicator-page-link"
          href={pageHref(locale, `data/${indicator.id}`)}
        >
          {labels.openIndicator} <span aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}

export function Dashboard({
  data,
  locale,
  view = "home",
  selectedIndicatorId,
}: DashboardProps) {
  const labels = copy[locale];
  const [activeSection, setActiveSection] = useState("all");
  const [search, setSearch] = useState("");
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false,
  );

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const stored = window.localStorage.getItem(themeStorageKey);
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
  const socialProtection = data.indicators.find(
    (indicator) => indicator.id === "spending-social-protection",
  );
  const spendingSource = spendingBreakdown[0]?.source;
  const spendingYear = spendingBreakdown[0]?.latest.year;
  const spendingNumberFormatter = new Intl.NumberFormat(
    locale === "it" ? "it-IT" : "en-GB",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
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

  const socialProtectionValue = socialProtection
    ? spendingNumberFormatter.format(socialProtection.latest.italy)
    : "";
  const oldAgeSentence = oldAge
    ? labels.oldAgeNote
        .replace("{value}", spendingNumberFormatter.format(oldAge.latest.italy))
        .replace("{social}", socialProtectionValue)
    : "";
  const oldAgeCaveat = labels.oldAgeCaveat.replace(
    "{social}",
    socialProtectionValue,
  );
  const heroEyebrow = labels.heroEyebrow.replace(
    "{year}",
    String(spendingYear ?? ""),
  );
  const heroCardLabel = labels.heroCardLabel.replace(
    "{year}",
    String(spendingYear ?? ""),
  );
  const heroLatest = labels.heroLatest.replace(
    "{nextYear}",
    String(spendingYear ? spendingYear + 1 : ""),
  );
  const heroSourceUpdated =
    spendingSource &&
    labels.heroSourceUpdated.replace(
      "{date}",
      formatDate(spendingSource.sourceUpdatedAt, locale),
    );

  const selectedIndicator = selectedIndicatorId
    ? data.indicators.find((indicator) => indicator.id === selectedIndicatorId)
    : undefined;

  const pageCards = [
    {
      path: "data",
      eyebrow: `${data.indicators.length} ${labels.results}`,
      title: labels.dataSectionTitle,
      body: labels.dataSectionBody,
    },
    {
      path: "method",
      eyebrow: labels.methodEyebrow,
      title: labels.methodTitle,
      body: labels.methodBody,
    },
    {
      path: "sources",
      eyebrow: `${sources.length} ${labels.sourceCount}`,
      title: labels.sourcesTitle,
      body: labels.sourcesBody,
    },
    {
      path: "about",
      eyebrow: labels.aboutEyebrow,
      title: labels.aboutTitle,
      body: labels.aboutBody,
    },
    {
      path: "contribute",
      eyebrow: labels.contributeEyebrow,
      title: labels.contributeTitle,
      body: labels.contributeBody,
    },
  ];

  const currentPath =
    view === "home"
      ? ""
      : view === "indicator"
        ? `data/${selectedIndicatorId ?? ""}`
        : view;

  return (
    <div className="site-shell" lang={locale}>
      <a className="skip-link" href="#main">
        {labels.skip}
      </a>

      <header className="site-header">
        <a className="brand" href={pageHref(locale)}>
          <span>
            <strong>Explainable Italy</strong>
            <small>{labels.subtitle}</small>
          </span>
        </a>

        <nav aria-label="Primary">
          <a
            href={pageHref(locale, "data")}
            aria-current={
              view === "data" || view === "indicator" ? "page" : undefined
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
        </nav>

        <div className="header-actions">
          <a
            className="language-link"
            href={pageHref(locale === "it" ? "en" : "it", currentPath)}
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
        {view === "home" ? (
          <>
            <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{heroEyebrow}</p>
            <h1>{labels.heroTitle}</h1>
            <p className="hero-intro">{labels.heroBody}</p>
            <div className="hero-facts">
              <div>
                <span>{labels.heroYear}</span>
                <strong>{spendingYear}</strong>
                <small>
                  {heroLatest} · {labels.heroProvisional}
                </small>
              </div>
              <div>
                <span>{labels.heroSource}</span>
                <strong>{labels.heroSourceName}</strong>
                <small>{heroSourceUpdated}</small>
                {spendingSource ? (
                  <div className="hero-source-links">
                    <a
                      href={spendingSource.dataBrowserUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.heroOpenSource}{" "}
                      <span aria-hidden="true">↗</span>
                    </a>
                    <a
                      href="https://www.istat.it/scheda-qualita/spese-della-pubblica-amministrazione-per-funzione/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {labels.heroOpenIstat}{" "}
                      <span aria-hidden="true">↗</span>
                    </a>
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
                <a href={pageHref(locale, "method")}>
                  {labels.heroMethodLink} <span aria-hidden="true">→</span>
                </a>
              </div>
            </details>
            <a className="primary-link" href={pageHref(locale, "data")}>
              {labels.readBreakdown} <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hundred-euro-card">
            <div className="hundred-euro-heading">
              <span>100 €</span>
              <small>{heroCardLabel}</small>
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
                <a
                  href={pageHref(locale, `data/${indicator.id}`)}
                  key={indicator.id}
                >
                  <span
                    className="legend-dot"
                    style={{ background: `var(--chart-${index + 1})` }}
                  />
                  <span>
                    {indicator.id === "spending-social-protection"
                      ? labels.socialProtectionHero
                      : indicator.title[locale]}
                  </span>
                  <strong>
                    {spendingNumberFormatter.format(indicator.latest.italy)}
                    €
                  </strong>
                </a>
              ))}
            </div>
            {oldAge ? (
              <div className="old-age-note">
                <strong>{oldAgeSentence}</strong>
                <p>{oldAgeCaveat}</p>
                <a href={pageHref(locale, "data/spending-old-age")}>
                  {labels.oldAgeLink} <span aria-hidden="true">→</span>
                </a>
              </div>
            ) : null}
              </div>
            </section>

            <section
              className="featured-section"
              aria-labelledby="key-numbers"
            >
          <h2 id="key-numbers">{labels.keyNumbers}</h2>
          <div className="featured-grid">
            {featured.map((indicator) => (
              <a
                href={pageHref(locale, `data/${indicator.id}`)}
                key={indicator.id}
              >
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

            <section className="landing-intro">
              <p className="eyebrow">{labels.landingEyebrow}</p>
              <div>
                <h2>{labels.landingTitle}</h2>
                <p>{labels.landingBody}</p>
              </div>
            </section>

            <section className="landing-directory">
              <div className="landing-directory-heading">
                <h2>{labels.exploreTitle}</h2>
                <p>{labels.exploreBody}</p>
              </div>
              <div className="landing-page-grid">
                {pageCards.map((page) => (
                  <a href={pageHref(locale, page.path)} key={page.path}>
                    <span>{page.eyebrow}</span>
                    <h3>{page.title}</h3>
                    <p>{page.body}</p>
                    <strong>
                      {labels.openPage} <span aria-hidden="true">→</span>
                    </strong>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {view === "indicator" && selectedIndicator ? (
          <section className="indicator-page-shell">
            <a className="back-link" href={pageHref(locale, "data")}>
              <span aria-hidden="true">←</span> {labels.backToData}
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
            />
          </section>
        ) : null}

        {view === "data" ? (
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
            <p className="results-count" aria-live="polite">
              <strong>{filteredIndicators.length}</strong> /{" "}
              {data.indicators.length} {labels.results}
            </p>
          </div>

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
              />
            ))}
          </div>

          {filteredIndicators.length === 0 ? (
            <p className="empty-state">{labels.noResults}</p>
          ) : null}
          </section>
        ) : null}

        {view === "method" ? (
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
        ) : null}

        {view === "sources" ? (
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

          <details className="source-directory">
            <summary>
              <span>
                {sources.length} {labels.sourceCount}
              </span>
              <strong>{labels.sourceDirectory}</strong>
            </summary>
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
          </details>
          </section>
        ) : null}

        {view === "about" ? (
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

          <details className="roadmap">
            <summary>
              <span>
                <strong>{labels.futureTitle}</strong>
                <small>{labels.futureBody}</small>
              </span>
              <span>{labels.futureToggle}</span>
            </summary>
            <ol>
              {labels.roadmap.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </details>
          </section>
        ) : null}

        {view === "contribute" ? (
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
        ) : null}
      </main>

      <footer>
        <div className="brand footer-brand">
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
