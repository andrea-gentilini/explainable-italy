"use client";

import { ShareLink } from "./ShareLink";
import { MethodGuide } from "./MethodGuide";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Locale = "it" | "en";
type LocalizedText = Record<Locale, string>;

type CountryObservation = {
  geo: string;
  value: number;
  status: string | null;
};

type DataPoint = {
  year: number;
  italy: number;
  eu: number | null;
  median: number;
  coverage: number;
  euMethod: "official_aggregate" | "unavailable";
  status: string | null;
  sourceStatus: string | null;
  euStatus: string | null;
  countryStatuses: Array<{ geo: string; status: string }>;
  missingCountries: string[];
  countries?: CountryObservation[];
};

type Source = {
  institution: string;
  originalInstitution: string;
  datasetCode: string;
  datasetLabel: string;
  dataBrowserUrl: string;
  apiUrl: string;
  metadataUrl: string | null;
  doi: string;
  sourceUpdatedAt: string;
  accessedAt: string;
  snapshotPath?: string;
  sha256?: string;
  bytes?: number;
};

type IndicatorNote = {
  type:
    | "provisional"
    | "method_change"
    | "comparability"
    | "scope"
    | "reference_period"
    | "data_gap";
  year?: number;
  text: LocalizedText;
  sourceUrl: string;
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
  definitionSourceUrl: string | null;
  definitionKind: "project_paraphrase";
  notes: IndicatorNote[];
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
  | "indicator"
  | "indicatorSource";

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

// The URL keeps browsing context shareable and survives navigation and Back.
const queryChangeEvent = "explainable-italy-query-change";

function subscribeToQuery(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(queryChangeEvent, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(queryChangeEvent, onChange);
  };
}

function useLocationQuery() {
  return useSyncExternalStore(
    subscribeToQuery,
    () => window.location.search,
    () => "",
  );
}

function updateQuery(values: Record<string, string | null>, push = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.href === window.location.href) return;
  window.history[push ? "pushState" : "replaceState"](null, "", url);
  window.dispatchEvent(new Event(queryChangeEvent));
}

function withQuery(href: string, query: string, year?: number) {
  const params = new URLSearchParams(query);
  if (year !== undefined) params.set("year", String(year));
  const suffix = params.toString();
  return `${href}${suffix ? `?${suffix}` : ""}`;
}

function normalizeSearch(value: string, locale: Locale) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase(locale).trim();
}

function selectedPoint(indicator: Indicator, year: string | null) {
  if (String(indicator.latest.year) === year) return indicator.latest;
  if (indicator.newerEstimate && String(indicator.newerEstimate.year) === year) return indicator.newerEstimate;
  return indicator.series.find((point) => String(point.year) === year) ?? indicator.latest;
}

const copy = {
  it: {
    skip: "Vai al contenuto",
    subtitle: "L’Italia, i dati ufficiali per tutti.",
    navData: "Esplora",
    navMethod: "Metodo",
    navSources: "Fonti",
    navAbout: "Il progetto",
    navContribute: "Contribuisci",
    snapshotEyebrow: "Italia in quattro numeri",
    snapshotTitle: "L’Italia, in breve",
    snapshotBody:
      "Economia, età, salute e lavoro. Apri un numero per vedere andamento, confronto europeo e fonte.",
    snapshotWhy: "Perché proprio questi quattro?",
    snapshotWhyBody:
      "Sono quattro misure diverse e complementari: quanto produce il Paese, la struttura per età, la salute e la partecipazione al lavoro.",
    snapshotGdp: "PIL per abitante",
    snapshotGdpUnit: "Indice: UE = 100",
    snapshotMedianAge: "Età mediana",
    snapshotLifeExpectancy: "Speranza di vita",
    snapshotEmployment: "Occupazione, 20–64 anni",
    snapshotOpen: "Vedi andamento",
    exploreTitle: "Approfondisci, quando vuoi",
    exploreBody:
      "Scegli un tema, leggi il metodo oppure verifica direttamente una fonte.",
    openPage: "Apri la pagina",
    openIndicator: "Apri la scheda completa",
    backToData: "Torna a tutti i dati",
    searchLabel: "Cerca un indicatore",
    searchPlaceholder: "Prova pensioni, lavoro, scuola",
    allSections: "Tutti gli indicatori",
    topicOverview: "Temi",
    topicIndicators: "indicatori",
    topicExamples: "Dentro trovi",
    topicOpen: "Apri il tema",
    heroEyebrow: "Spesa pubblica · Italia · {year}",
    heroTitle: "Come si spendono 100 €?",
    heroBody:
      "Riduciamo a 100 € tutta la spesa pubblica italiana: pensioni, sanità, scuola, stipendi, investimenti e interessi.",
    heroYear: "Anno dei dati",
    heroLatest:
      "Anno più recente presente nello snapshot del progetto",
    heroProvisional: "dato provvisorio",
    heroSource: "Fonte ufficiale",
    heroSourceName: "Eurostat",
    heroSourceUpdated: "dataset aggiornato il {date}",
    heroOpenSource: "Verifica dati e calcolo",
    heroMethodSummary: "Come sono create queste categorie?",
    heroMethodBody:
      "COFOG significa “Classification of the Functions of Government”: classificazione delle funzioni della Pubblica amministrazione. È il sistema usato da Eurostat per dividere la spesa in dieci categorie confrontabili.",
    heroBudgetNote:
      "Il totale comprende tutta la Pubblica amministrazione italiana, non soltanto lo Stato.",
    heroMethodLink: "Leggi il metodo",
    heroCardLabel: "equivalgono al 100% della spesa del {year}",
    spendingInteract:
      "Passa sulle voci per leggere il grafico. Clicca per approfondire.",
    spendingDonutLabel: "Grafico della spesa pubblica; apre la voce selezionata",
    socialProtectionHero: "Protezione sociale (incluse pensioni)",
    socialDetailEyebrow: "Dentro la protezione sociale",
    socialDetailTitle: "Quanta parte riguarda le pensioni?",
    socialDetailBody:
      "Nei 100 € Eurostat non pubblica una voce “pensioni”. Pubblica invece la funzione “vecchiaia”, che ha un perimetro preciso.",
    oldAgeMeasure: "Nella ripartizione dei 100 €",
    oldAgeMeasureTitle: "Funzione vecchiaia",
    oldAgeIncludesTitle: "Comprende esattamente",
    oldAgeIncludes: [
      "pensioni di vecchiaia, pensioni anticipate dovute all’età e pensioni parziali;",
      "assegni di cura e altri pagamenti periodici o una tantum legati al pensionamento o all’età;",
      "alloggio e vitto in strutture per anziani, assistenza nelle attività quotidiane, aiuto domestico e trasporto;",
      "sostegni a chi assiste una persona anziana e servizi per la partecipazione sociale e culturale;",
      "regimi pensionistici del personale militare e dei dipendenti pubblici.",
    ],
    oldAgeExcludes:
      "Esclude i pensionamenti anticipati dovuti a disabilità o disoccupazione, classificati in altre funzioni.",
    oldAgeOfficialDefinition: "Definizione ufficiale COFOG 10.2 (ONU)",
    oldAgeFilter:
      "{year} · vecchiaia (GF1002) · quota della spesa pubblica · {status}",
    pensionMeasure: "Un indicatore diverso",
    pensionMeasureTitle: "Pensioni: nessuna equivalenza esatta con i 100 €",
    pensionMeasureBody:
      "Il dato in percentuale del PIL viene da ESSPROS, che comprende tutti i regimi collettivi di protezione sociale residenti, pubblici o privati. I 100 € comprendono invece soltanto la Pubblica amministrazione. Dividere i due valori mescolerebbe perimetri diversi: per questo non trasformiamo questa percentuale in euro su 100.",
    pensionIncludesTitle: "Il dato pensionistico comprende",
    pensionIncludes:
      "pensioni di invalidità; pensionamenti anticipati per ridotta capacità lavorativa; pensioni di vecchiaia, anticipate e parziali; pensioni ai superstiti; pensionamenti anticipati per ragioni di mercato del lavoro.",
    openPensionPage: "Apri l’indicatore sulle pensioni",
    pensionFilter:
      "{year} · tutte le pensioni · quota del PIL · {status}",
    selectionUsed: "Selezione usata",
    verifyNumber: "Verifica fonte e calcolo",
    readBreakdown: "Esplora tutti i temi",
    definitive: "ultimo dato non stimato",
    estimate: "Dato più recente",
    provisional: "provvisorio o stimato",
    compareTitle: "Italia e confronto europeo",
    italy: "Italia",
    eu: "UE",
    median: "Mediana UE",
    officialAggregate: "aggregato ufficiale Eurostat",
    noAggregate:
      "Nessun aggregato UE ufficiale con lo stesso perimetro; mostriamo la mediana dei Paesi disponibili.",
    countriesAvailable: "{coverage} Paesi disponibili su 27",
    missingCountries: "Dato mancante: {countries}",
    comparisonQuality: "Note di qualità: {details}.",
    comparisonCountryFlagged: "{count} Paese",
    comparisonCountriesFlagged: "{count} Paesi",
    comparisonEuFlagged: "aggregato UE",
    compareExplainer: "Come leggere il confronto europeo",
    comparisonHelp: "UE è il valore ufficiale riferito all’Unione europea nel suo insieme: non è la media semplice dei Paesi. La mediana è il valore centrale dei Paesi disponibili, ciascuno con lo stesso peso. Il confronto usa lo stesso anno e la stessa selezione per tutti i valori.",
    comparisonYear: "Anno del confronto",
    trendTable: "Vedi tutti gli anni e i valori",
    trendInteraction: "Seleziona un anno per aggiornare il confronto. Con la tastiera, usa le frecce destra e sinistra.",
    yearUnflagged: "dato italiano senza contrassegni",
    edition: "Edizione del",
    editionNote: "Ogni indicatore riporta il proprio anno e lo stato del dato.",
    browseAll: "Esplora tutti gli indicatori",
    snapshotDownload: "Scarica lo snapshot utilizzato",
    snapshotHash: "Impronta SHA-256 dello snapshot",
    trendRange: "Serie completa: {start}–{end}",
    trendScale: "Scala del grafico",
    trendLegend: "Barre tratteggiate: dati provvisori, stime o previsioni. *: discontinuità. Anni senza dato lasciati vuoti. Tutti i valori e i contrassegni sono nella tabella.",
    resetSearch: "Azzera ricerca e filtri",
    clearSearch: "Cancella ricerca",
    backToTopic: "Torna al tema: {topic}",
    backToResults: "Torna ai risultati",
    trendCoverage: "Paesi nella mediana",
    searchHint: "La ricerca cerca in tutti i temi. Puoi poi restringere i risultati con i filtri.",
    dataSectionTitle: "Scegli un tema",
    dataSectionBody:
      "Non serve vedere tutto insieme. Parti da una domanda: ogni indicatore conserva definizione, serie storica, confronto europeo e fonte.",
    noResults: "Nessun indicatore corrisponde alla ricerca.",
    understand: "Definizione e perimetro",
    simpleDefinition: "Sintesi accessibile del progetto",
    technicalDefinition: "Selezione tecnica utilizzata",
    definitionAttribution:
      "Questi testi sono parafrasi del progetto basate sulla metodologia ufficiale; non sono citazioni della fonte.",
    definitionSource: "Apri la metodologia alla base della definizione",
    trend: "Andamento dell’Italia",
    from: "dal",
    source: "Fonte",
    sourceUpdated: "Dataset aggiornato da Eurostat",
    sourceAccessed: "Dati acquisiti dal progetto",
    originalInstitution: "Fonte originaria",
    dataset: "Dataset",
    openData: "Verifica fonte e calcolo",
    openMetadata: "Leggi la metodologia Eurostat",
    downloadIndicator: "Scarica questo indicatore",
    sourcePageEyebrow: "Fonte verificabile",
    sourcePageTitle: "Da dove viene questo numero",
    sourcePageBody:
      "Qui trovi il dato utilizzato dal sito, la selezione applicata e il passaggio che porta al numero mostrato.",
    sourceBack: "Torna all’indicatore",
    sourceDisplayed: "Dato mostrato",
    sourceMostRecent: "dato più recente",
    sourceDefinitive: "ultimo dato non provvisorio",
    sourceSelection: "Selezione Eurostat",
    sourceObservations: "Valori utilizzati",
    sourceCountry: "Paese",
    sourceYear: "Anno",
    sourceFrequency: "Frequenza",
    sourceAnnual: "Annuale",
    sourceFormula: "Passaggio al numero mostrato",
    sourceNoCalculation:
      "Il valore italiano è quello pubblicato dalla fonte; il sito lo arrotonda soltanto per la visualizzazione.",
    sourceMedianCalculated:
      "calcolata dal sito su {coverage} Paesi UE disponibili su 27",
    sourceEuUnavailable:
      "Eurostat non pubblica un aggregato UE con lo stesso perimetro.",
    sourceComparisonFormula:
      "L’aggregato UE, quando presente, è quello ufficiale Eurostat. Per la mediana il progetto ordina i {coverage} valori nazionali; se sono pari, usa la media dei due valori centrali.",
    sourceQualityTitle: "Qualità e limiti",
    sourceQualityIntro:
      "I contrassegni sono quelli associati dalla fonte alle osservazioni utilizzate.",
    sourceItalyStatus: "Stato del dato italiano",
    sourceEuStatus: "Stato dell’aggregato UE",
    sourceCountryFlags: "Paesi con contrassegni",
    sourceNoFlags: "Nessun contrassegno associato al dato",
    sourceCountryValues: "Vedi i Paesi usati per la mediana",
    sourceCountryValuesBody:
      "Valori ufficiali dell’anno selezionato. Il sito li ordina soltanto per calcolare la mediana.",
    sourceCountryValue: "Valore",
    sourceCountryStatus: "Stato",
    sourceMissingShort: "Manca: {countries}",
    sourceNotes: "Note metodologiche pertinenti",
    sourceNoteLink: "Verifica la nota ufficiale",
    sourceTechnicalSummary: "Collegamenti tecnici Eurostat",
    sourceTechnicalBody:
      "Servono a riprodurre il dato, ma non sono necessari per leggerlo.",
    sourceBrowser: "Apri il dataset nel Data Browser Eurostat",
    sourceRaw: "Consulta i dati correnti nell’API",
    sourceOfficialDefinition: "Apri la fonte della definizione",
    sourceDoi: "Apri l’identificatore permanente del dataset",
    dataStatusBreak:
      "La fonte segnala una discontinuità negli anni: {years}. Il grafico non va letto come una serie perfettamente continua.",
    dataNotesTitle: "Da sapere prima del confronto",
    statusProvisional: "provvisorio",
    statusEstimated: "stimato",
    statusBreak: "interruzione della serie",
    statusMethodNote: "nota metodologica sulla comparabilità",
    statusDefinition: "definizione differente",
    statusLowReliability: "bassa affidabilità",
    statusImputed: "valore imputato dalla fonte",
    statusForecast: "previsione",
    statusFlagged: "contrassegnato dalla fonte",
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
        title: "Tre riferimenti, un perimetro comune",
        body: "Confrontiamo Italia, aggregato UE ufficiale quando esiste e mediana dei Paesi disponibili. Se manca un aggregato con lo stesso perimetro, lo indichiamo come non disponibile.",
      },
      {
        title: "Precisione senza finzioni",
        body: "Mostriamo solo i decimali giustificati dalla fonte. Stime e dati provvisori restano separati dall’ultimo valore non stimato.",
      },
      {
        title: "Copie verificabili",
        body: "Nella repository conserviamo le sole serie usate, il collegamento originale, la data di acquisizione e l’impronta digitale del contenuto normalizzato.",
      },
      {
        title: "Accessibilità, non interpretazione",
        body: "Riportiamo dati pubblici in un formato leggibile, senza interpretarli. Le sintesi accessibili sono parafrasi del progetto basate sulle definizioni ufficiali, sempre collegate alla fonte.",
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
    localSize: "Dati scaricabili, fonti verificabili",
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
      "Il progetto non integra cookie, pubblicità, profilazione, analytics o altri tracker. L’infrastruttura che ospita il sito può conservare i normali log tecnici di accesso.",
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
    contributeEyebrow: "Open source",
    contributeTitle: "Aperto a chi vuole dare una mano",
    contributeBody:
      "Explainable Italy è un progetto open source nato per aiutare le persone a leggere i dati pubblici. Se noti un errore o vuoi migliorare qualcosa, il tuo contributo è benvenuto.",
    contributionWays: [
      "Segnala un dato o un collegamento che non funziona.",
      "Proponi una fonte pubblica che potrebbe essere utile.",
      "Migliora testi, traduzioni, accessibilità o codice.",
    ],
    contributionLink: "Visita il progetto su GitHub",
    footer:
      "Dati ufficiali. Elaborazioni trasparenti. Nessun tracciamento.",
    footerLicense: "Codice MIT · dati: condizioni delle fonti",
    themeLight: "Usa tema chiaro",
    themeDark: "Usa tema scuro",
    language: "English",
    latestUpdate: "Edizione pubblicata",
    results: "indicatori mostrati",
  },
  en: {
    skip: "Skip to content",
    subtitle: "Italy, official data for everyone.",
    navData: "Explore",
    navMethod: "Method",
    navSources: "Sources",
    navAbout: "About",
    navContribute: "Contribute",
    snapshotEyebrow: "Italy in four numbers",
    snapshotTitle: "Italy, at a glance",
    snapshotBody:
      "Economy, age, health and work. Open a number for its trend, European comparison and source.",
    snapshotWhy: "Why these four?",
    snapshotWhyBody:
      "They are four distinct, complementary measures: what the country produces, its age structure, health and participation in work.",
    snapshotGdp: "GDP per person",
    snapshotGdpUnit: "Index: EU = 100",
    snapshotMedianAge: "Median age",
    snapshotLifeExpectancy: "Life expectancy",
    snapshotEmployment: "Employment, ages 20–64",
    snapshotOpen: "See trend",
    exploreTitle: "Go deeper when you want",
    exploreBody:
      "Choose a topic, read the method or verify a source directly.",
    openPage: "Open page",
    openIndicator: "Open the full indicator",
    backToData: "Back to all data",
    searchLabel: "Search indicators",
    searchPlaceholder: "Try pensions, work, education",
    allSections: "All indicators",
    topicOverview: "Topics",
    topicIndicators: "indicators",
    topicExamples: "Includes",
    topicOpen: "Open topic",
    heroEyebrow: "Public spending · Italy · {year}",
    heroTitle: "How is €100 spent?",
    heroBody:
      "We scale all Italian public spending down to €100: pensions, health, education, pay, investment and interest.",
    heroYear: "Data year",
    heroLatest:
      "Latest year available in the project’s snapshot",
    heroProvisional: "provisional data",
    heroSource: "Official source",
    heroSourceName: "Eurostat",
    heroSourceUpdated: "dataset updated {date}",
    heroOpenSource: "Verify data and calculation",
    heroMethodSummary: "How are these categories created?",
    heroMethodBody:
      "COFOG stands for “Classification of the Functions of Government”. It is the system Eurostat uses to split spending into ten comparable categories.",
    heroBudgetNote:
      "The total covers all Italian public bodies, not only central government.",
    heroMethodLink: "Read the method",
    heroCardLabel: "represent 100% of {year} spending",
    spendingInteract:
      "Hover over a category to read the chart. Click to explore it.",
    spendingDonutLabel: "Public spending chart; opens the selected category",
    socialProtectionHero: "Social protection (including pensions)",
    socialDetailEyebrow: "Inside social protection",
    socialDetailTitle: "How much relates to pensions?",
    socialDetailBody:
      "Eurostat does not publish a “pensions” category within the €100 breakdown. It publishes the precisely defined old-age function instead.",
    oldAgeMeasure: "In the €100 breakdown",
    oldAgeMeasureTitle: "Old-age function",
    oldAgeIncludesTitle: "It includes exactly",
    oldAgeIncludes: [
      "old-age pensions, age-related anticipated old-age pensions and partial pensions;",
      "care allowances and other periodic or lump-sum payments linked to retirement or old age;",
      "accommodation and board in facilities for older people, help with daily tasks, home help and transport;",
      "allowances for carers and services supporting social and cultural participation;",
      "pension schemes for military personnel and government employees.",
    ],
    oldAgeExcludes:
      "It excludes early-retirement benefits due to disability or unemployment, which are classified under other functions.",
    oldAgeOfficialDefinition: "Official COFOG 10.2 definition (UN)",
    oldAgeFilter:
      "{year} · old age (GF1002) · share of public spending · {status}",
    pensionMeasure: "A different indicator",
    pensionMeasureTitle: "Pensions: no exact conversion to the €100",
    pensionMeasureBody:
      "The percentage of GDP comes from ESSPROS, which covers all resident collective social-protection schemes, public or private. The €100 covers general government only. Dividing the two figures would mix different scopes, so we do not convert this percentage into euros out of 100.",
    pensionIncludesTitle: "The pension measure includes",
    pensionIncludes:
      "disability pensions; early retirement due to reduced capacity to work; old-age, anticipated and partial pensions; survivors’ pensions; and early retirement for labour-market reasons.",
    openPensionPage: "Open the pension indicator",
    pensionFilter:
      "{year} · all pensions · share of GDP · {status}",
    selectionUsed: "Selection used",
    verifyNumber: "Verify source and calculation",
    readBreakdown: "Explore all topics",
    definitive: "latest non estimated value",
    estimate: "More recent value",
    provisional: "provisional or estimated",
    compareTitle: "Italy and European comparison",
    italy: "Italy",
    eu: "EU",
    median: "EU median",
    officialAggregate: "official Eurostat aggregate",
    noAggregate:
      "No official EU aggregate has the same scope; only the median of available countries is shown.",
    countriesAvailable: "{coverage} countries available out of 27",
    missingCountries: "Missing value: {countries}",
    comparisonQuality: "Quality notes: {details}.",
    comparisonCountryFlagged: "{count} country",
    comparisonCountriesFlagged: "{count} countries",
    comparisonEuFlagged: "EU aggregate",
    compareExplainer: "How to read the European comparison",
    comparisonHelp: "EU is the official value for the European Union as a whole, not the simple average of countries. The median is the middle value of the available countries, each given equal weight. All values use the same year and selection.",
    comparisonYear: "Comparison year",
    trendTable: "View all years and values",
    trendInteraction: "Select a year to update the comparison. Use the left and right arrow keys to navigate by keyboard.",
    yearUnflagged: "Italian observation without flags",
    edition: "Edition dated",
    editionNote: "Each indicator shows its own reference year and observation status.",
    browseAll: "Explore all indicators",
    snapshotDownload: "Download the snapshot used",
    snapshotHash: "Snapshot SHA-256 fingerprint",
    trendRange: "Full series: {start}–{end}",
    trendScale: "Chart scale",
    trendLegend: "Hatched bars: provisional data, estimates or forecasts. *: break in series. Years without data are left blank. All values and flags are in the table.",
    resetSearch: "Reset search and filters",
    clearSearch: "Clear search",
    backToTopic: "Back to topic: {topic}",
    backToResults: "Back to results",
    trendCoverage: "Countries in median",
    searchHint: "Search covers all topics. You can then narrow the results with the filters.",
    dataSectionTitle: "Choose a topic",
    dataSectionBody:
      "You do not need to see everything at once. Start with a question: every indicator retains its definition, historical series, European comparison and source.",
    noResults: "No indicators match this search.",
    understand: "Definition and scope",
    simpleDefinition: "Project’s accessible summary",
    technicalDefinition: "Technical selection used",
    definitionAttribution:
      "These texts are project paraphrases based on the official methodology; they are not quotations from the source.",
    definitionSource: "Open the methodology behind the definition",
    trend: "Italy over time",
    from: "from",
    source: "Source",
    sourceUpdated: "Dataset updated by Eurostat",
    sourceAccessed: "Data acquired by the project",
    originalInstitution: "Original source",
    dataset: "Dataset",
    openData: "Verify source and calculation",
    openMetadata: "Read Eurostat methodology",
    downloadIndicator: "Download this indicator",
    sourcePageEyebrow: "Verifiable source",
    sourcePageTitle: "Where this number comes from",
    sourcePageBody:
      "This page shows the value used by the site, the applied selection and the step that produces the displayed number.",
    sourceBack: "Back to the indicator",
    sourceDisplayed: "Displayed value",
    sourceMostRecent: "most recent value",
    sourceDefinitive: "latest non-provisional value",
    sourceSelection: "Eurostat selection",
    sourceObservations: "Values used",
    sourceCountry: "Country",
    sourceYear: "Year",
    sourceFrequency: "Frequency",
    sourceAnnual: "Annual",
    sourceFormula: "Step to the displayed number",
    sourceNoCalculation:
      "The Italian value is the one published by the source; the site only rounds it for display.",
    sourceMedianCalculated:
      "calculated by the site across {coverage} available EU countries out of 27",
    sourceEuUnavailable:
      "Eurostat does not publish an EU aggregate with the same scope.",
    sourceComparisonFormula:
      "The EU aggregate, when present, is Eurostat’s official figure. For the median, the project orders the {coverage} national values; when their number is even, it averages the two middle values.",
    sourceQualityTitle: "Quality and limitations",
    sourceQualityIntro:
      "Flags are those attached by the source to the observations used.",
    sourceItalyStatus: "Status of the Italian value",
    sourceEuStatus: "Status of the EU aggregate",
    sourceCountryFlags: "Countries with flags",
    sourceNoFlags: "No flag attached to the observation",
    sourceCountryValues: "See the countries used for the median",
    sourceCountryValuesBody:
      "Official values for the selected year. The site only orders them to calculate the median.",
    sourceCountryValue: "Value",
    sourceCountryStatus: "Status",
    sourceMissingShort: "Missing: {countries}",
    sourceNotes: "Relevant methodological notes",
    sourceNoteLink: "Verify the official note",
    sourceTechnicalSummary: "Technical Eurostat links",
    sourceTechnicalBody:
      "These reproduce the data but are not needed to read them.",
    sourceBrowser: "Open the dataset in Eurostat Data Browser",
    sourceRaw: "View current data in the API",
    sourceOfficialDefinition: "Open the definition source",
    sourceDoi: "Open the dataset’s permanent identifier",
    dataStatusBreak:
      "The source marks a discontinuity in: {years}. The chart should not be read as a perfectly continuous series.",
    dataNotesTitle: "Before comparing",
    statusProvisional: "provisional",
    statusEstimated: "estimated",
    statusBreak: "series break",
    statusMethodNote: "methodological note on comparability",
    statusDefinition: "different definition",
    statusLowReliability: "low reliability",
    statusImputed: "value imputed by the source",
    statusForecast: "forecast",
    statusFlagged: "flagged by the source",
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
        title: "Three references, a common scope",
        body: "We compare Italy, the official EU aggregate when one exists, and the median of available countries. When no aggregate with the same scope is published, we mark it as unavailable.",
      },
      {
        title: "No false precision",
        body: "We show only the decimals justified by the source. Estimates and provisional data remain separate from the latest non estimated value.",
      },
      {
        title: "Verifiable copies",
        body: "The repository stores only the series used, the original link, acquisition date and digital fingerprint of the normalised content.",
      },
      {
        title: "Accessibility, not interpretation",
        body: "We present public data in a readable format without interpreting it. Accessible summaries are project paraphrases based on official definitions and always link back to the source.",
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
    localSize: "Downloadable data, verifiable sources",
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
      "The project integrates no cookies, advertising, profiling, analytics or other trackers. The hosting infrastructure may retain normal technical access logs.",
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
    contributeEyebrow: "Open source",
    contributeTitle: "Open to anyone who wants to help",
    contributeBody:
      "Explainable Italy is an open-source project created to help people read public data. If you spot an error or want to improve something, your contribution is welcome.",
    contributionWays: [
      "Report a figure or link that does not work.",
      "Suggest a public source that could be useful.",
      "Improve the copy, translations, accessibility or code.",
    ],
    contributionLink: "Visit the project on GitHub",
    footer: "Official data. Transparent calculations. No tracking.",
    footerLicense: "MIT code · data: source terms apply",
    themeLight: "Use light theme",
    themeDark: "Use dark theme",
    language: "Italiano",
    latestUpdate: "Published edition",
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

const sourceDimensionLabels: Record<Locale, Record<string, string>> = {
  it: {
    freq: "Frequenza",
    unit: "Unità",
    sector: "Settore",
    na_item: "Voce contabile",
    cofog99: "Funzione",
    indic_de: "Indicatore demografico",
    sex: "Sesso",
    age: "Fascia d’età",
    indic_em: "Indicatore del lavoro",
    coicop18: "Paniere dei prezzi",
    spdepb: "Tipo di pensione",
    spdepm: "Prova dei mezzi",
    hlth_hle: "Misura di salute",
    isced11: "Livello di istruzione",
    wstatus: "Condizione lavorativa",
    training: "Formazione",
    nrg_bal: "Voce energetica",
    wst_oper: "Trattamento dei rifiuti",
    src_crf: "Categoria di emissioni",
  },
  en: {
    freq: "Frequency",
    unit: "Unit",
    sector: "Sector",
    na_item: "Accounting item",
    cofog99: "Function",
    indic_de: "Demographic indicator",
    sex: "Sex",
    age: "Age group",
    indic_em: "Labour indicator",
    coicop18: "Price basket",
    spdepb: "Pension type",
    spdepm: "Means testing",
    hlth_hle: "Health measure",
    isced11: "Education level",
    wstatus: "Labour status",
    training: "Training",
    nrg_bal: "Energy item",
    wst_oper: "Waste treatment",
    src_crf: "Emissions category",
  },
};

const sourceValueLabels: Record<Locale, Record<string, string>> = {
  it: {
    A: "Annuale",
    T: "Totale",
    TOTAL: "Totale",
    PC_TOT: "% della spesa pubblica",
    PC_GDP: "% del PIL",
    PC_POP: "% della popolazione",
    PC_ACT: "% della forza lavoro",
    PC_EU27_2020_HAB_MPPS_CP: "Indice pro capite in PPS, UE = 100",
    CLV_PCH_PRE_HAB: "Variazione reale annua pro capite",
    RCH_A_AVG: "Variazione media annua",
    YR: "Anni",
    PC: "Percentuale",
    I90: "Indice, 1990 = 100",
    S13: "Pubblica amministrazione",
    TE: "Spesa totale",
    TR: "Entrate totali",
    B9: "Accreditamento o indebitamento netto",
    D41PAY: "Interessi passivi",
    P51G: "Investimenti fissi lordi",
    D62_D632PAY: "Prestazioni sociali",
    GD: "Debito lordo consolidato",
    B1GQ: "Prodotto interno lordo",
    GF01: "Servizi pubblici generali",
    GF02: "Difesa",
    GF03: "Ordine pubblico e sicurezza",
    GF04: "Affari economici",
    GF05: "Protezione dell’ambiente",
    GF06: "Abitazioni e territorio",
    GF07: "Sanità",
    GF08: "Cultura, sport e religione",
    GF09: "Istruzione",
    GF10: "Protezione sociale",
    GF1002: "Vecchiaia",
    MEDAGEPOP: "Età mediana della popolazione",
    PC_Y65_MAX: "Quota di popolazione di 65 anni o più",
    OLDDEP1: "Indice di dipendenza degli anziani",
    TOTFERRT: "Tasso di fecondità totale",
    Y_LT1: "Alla nascita",
    "Y20-64": "Da 20 a 64 anni",
    "Y15-74": "Da 15 a 74 anni",
    "Y15-24": "Da 15 a 24 anni",
    "Y25-34": "Da 25 a 34 anni",
    "Y18-24": "Da 18 a 24 anni",
    "Y25-64": "Da 25 a 64 anni",
    "Y15-29": "Da 15 a 29 anni",
    EMP_LFS: "Persone occupate, indagine sulle forze di lavoro",
    HLY_Y0: "Anni di vita in buona salute alla nascita",
    "ED5-8": "Istruzione terziaria, livelli ISCED 5–8",
    POP: "Popolazione",
    NEMP: "Non occupati",
    NO_FE_NO_NFE: "Nessuna istruzione o formazione",
    REN: "Quota complessiva di energia rinnovabile",
    RCY: "Riciclo e preparazione per il riutilizzo",
    TOTX4_MEMO: "Totale, esclusi LULUCF e voci promemoria",
  },
  en: {
    A: "Annual",
    T: "Total",
    TOTAL: "Total",
    PC_TOT: "% of public spending",
    PC_GDP: "% of GDP",
    PC_POP: "% of population",
    PC_ACT: "% of the labour force",
    PC_EU27_2020_HAB_MPPS_CP: "Per-capita PPS index, EU = 100",
    CLV_PCH_PRE_HAB: "Annual real change per capita",
    RCH_A_AVG: "Annual average rate of change",
    YR: "Years",
    PC: "Percent",
    I90: "Index, 1990 = 100",
    S13: "General government",
    TE: "Total expenditure",
    TR: "Total revenue",
    B9: "Net lending or net borrowing",
    D41PAY: "Interest payable",
    P51G: "Gross fixed capital formation",
    D62_D632PAY: "Social benefits",
    GD: "Consolidated gross debt",
    B1GQ: "Gross domestic product",
    GF01: "General public services",
    GF02: "Defence",
    GF03: "Public order and safety",
    GF04: "Economic affairs",
    GF05: "Environmental protection",
    GF06: "Housing and community amenities",
    GF07: "Health",
    GF08: "Recreation, culture and religion",
    GF09: "Education",
    GF10: "Social protection",
    GF1002: "Old age",
    MEDAGEPOP: "Median age of the population",
    PC_Y65_MAX: "Share of population aged 65 or over",
    OLDDEP1: "Old-age dependency ratio",
    TOTFERRT: "Total fertility rate",
    Y_LT1: "At birth",
    "Y20-64": "Ages 20 to 64",
    "Y15-74": "Ages 15 to 74",
    "Y15-24": "Ages 15 to 24",
    "Y25-34": "Ages 25 to 34",
    "Y18-24": "Ages 18 to 24",
    "Y25-64": "Ages 25 to 64",
    "Y15-29": "Ages 15 to 29",
    EMP_LFS: "Employed people, labour force survey",
    HLY_Y0: "Healthy life years at birth",
    "ED5-8": "Tertiary education, ISCED levels 5–8",
    POP: "Population",
    NEMP: "Not employed",
    NO_FE_NO_NFE: "No formal or non-formal education",
    REN: "Overall renewable energy share",
    RCY: "Recycling and preparing for reuse",
    TOTX4_MEMO: "Total, excluding LULUCF and memo items",
  },
};

const countryNames: Record<Locale, Record<string, string>> = {
  it: {
    AT: "Austria",
    BE: "Belgio",
    BG: "Bulgaria",
    HR: "Croazia",
    CY: "Cipro",
    CZ: "Cechia",
    DK: "Danimarca",
    EE: "Estonia",
    FI: "Finlandia",
    FR: "Francia",
    DE: "Germania",
    EL: "Grecia",
    HU: "Ungheria",
    IE: "Irlanda",
    IT: "Italia",
    LV: "Lettonia",
    LT: "Lituania",
    LU: "Lussemburgo",
    MT: "Malta",
    NL: "Paesi Bassi",
    PL: "Polonia",
    PT: "Portogallo",
    RO: "Romania",
    SK: "Slovacchia",
    SI: "Slovenia",
    ES: "Spagna",
    SE: "Svezia",
  },
  en: {
    AT: "Austria",
    BE: "Belgium",
    BG: "Bulgaria",
    HR: "Croatia",
    CY: "Cyprus",
    CZ: "Czechia",
    DK: "Denmark",
    EE: "Estonia",
    FI: "Finland",
    FR: "France",
    DE: "Germany",
    EL: "Greece",
    HU: "Hungary",
    IE: "Ireland",
    IT: "Italy",
    LV: "Latvia",
    LT: "Lithuania",
    LU: "Luxembourg",
    MT: "Malta",
    NL: "Netherlands",
    PL: "Poland",
    PT: "Portugal",
    RO: "Romania",
    SK: "Slovakia",
    SI: "Slovenia",
    ES: "Spain",
    SE: "Sweden",
  },
};

function countryList(codes: string[], locale: Locale) {
  return new Intl.ListFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "long",
    type: "conjunction",
  }).format(codes.map((code) => countryNames[locale][code] ?? code));
}

function statusDescription(
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

function formatFlaggedCountryCount(count: number, locale: Locale) {
  const labels = copy[locale];
  const template = count === 1 ? labels.comparisonCountryFlagged : labels.comparisonCountriesFlagged;
  return template.replace("{count}", String(count));
}

function fillCount(template: string, coverage: number) {
  return template.replace("{coverage}", String(coverage));
}

function getBreakYears(indicator: Indicator) {
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

function getDisplayedPoint(indicator: Indicator) {
  return indicator.newerEstimate ?? indicator.latest;
}

function getSourceSelection(indicator: Indicator, locale: Locale) {
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

function ComparisonPlot({
  indicator,
  locale,
  point = indicator.latest,
}: {
  indicator: Indicator;
  locale: Locale;
  point?: DataPoint;
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
  const maximum = Math.max(0, ...values.map((entry) => entry.value));
  const range = maximum - minimum || 1;
  const position = (value: number) => ((value - minimum) / range) * 100;
  const methodLabel =
    point.euMethod === "official_aggregate"
      ? labels.officialAggregate
      : labels.noAggregate;
  const coverageLabel = fillCount(
    labels.countriesAvailable,
    point.coverage,
  );
  const missingLabel = point.missingCountries.length
    ? labels.missingCountries.replace(
        "{countries}",
        countryList(point.missingCountries, locale),
    )
    : "";
  const qualityDetails = [
    ...(point.euStatus ? [labels.comparisonEuFlagged] : []),
    ...(point.countryStatuses.length
      ? [
          formatFlaggedCountryCount(point.countryStatuses.length, locale),
        ]
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
      role="img"
      aria-label={[`${labels.compareTitle} · ${point.year}`, ariaValues, methodLabel, coverageLabel, missingLabel, qualityLabel]
        .filter(Boolean)
        .map((sentence) => sentence.trim().replace(/[.!?]+$/u, ""))
        .join(". ") + "."}
    >
      <div className="comparison-heading">
        <span>{labels.compareTitle} · {point.year}</span>
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

function YearSelection({ indicator, point, locale }: {
  indicator: Indicator; point: DataPoint; locale: Locale;
}) {
  const options = new Map(indicator.series.map((entry) => [entry.year, entry]));
  options.set(indicator.latest.year, indicator.latest);
  if (indicator.newerEstimate) options.set(indicator.newerEstimate.year, indicator.newerEstimate);
  if (options.size < 2) return null;
  return (
    <label className="year-selection">
      <span>{copy[locale].comparisonYear}</span>
      <select value={point.year} onChange={(event) => updateQuery({ year: event.target.value })}>
        {[...options.values()].sort((a, b) => b.year - a.year).map((entry) => (
          <option key={entry.year} value={entry.year}>
            {entry.year} · {entry.status
              ? statusDescription(entry.status, locale, false)
              : copy[locale].yearUnflagged}
          </option>
        ))}
      </select>
    </label>
  );
}

function TrendBars({ indicator, locale, selectedYear }: {
  indicator: Indicator; locale: Locale; selectedYear: number;
}) {
  const labels = copy[locale];
  const points = indicator.series;
  const firstYear = points[0].year;
  const lastYear = points[points.length - 1].year;
  const values = points.map((point) => point.italy);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = maximum - minimum || 1;
  const zeroPosition = (maximum / range) * 100;
  const breakYears = new Set(getBreakYears(indicator));
  const rangeLabel = labels.trendRange.replace("{start}", String(firstYear)).replace("{end}", String(lastYear));
  const selected = points.find((point) => point.year === selectedYear) ?? indicator.latest;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollRef.current;
    const active = container?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (container && active) {
      container.scrollLeft = active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2;
    }
  }, [selectedYear]);
  const value = (number: number) => formatValue(number, indicator.unitKey, indicator.precision, locale);

  return (
    <>
      <div className="trend-reading" aria-live="polite"><span>{labels.italy} · {selected.year}</span><strong>{value(selected.italy)}</strong></div>
      <p className="trend-interaction" id={`trend-help-${indicator.id}`}>{labels.trendInteraction}</p>
      <p className="trend-scale">{labels.trendScale}: {value(minimum)} – {value(maximum)}</p>
      <div className="trend-scroll" ref={scrollRef} role="region" aria-label={`${labels.trend}. ${rangeLabel}`}>
        <div className="trend-chart" role="group" aria-label={labels.trend} aria-describedby={`trend-help-${indicator.id}`} style={{ minWidth: `${(lastYear - firstYear + 1) * 1.8}rem`, gridTemplateColumns: `repeat(${lastYear - firstYear + 1}, minmax(0, 1fr))` }}>
          <span className="trend-zero" style={{ top: `${zeroPosition}%` }} aria-hidden="true" />
          {points.map((point, index) => {
            const hasBreak = breakYears.has(point.year);
            const uncertain = /[pef]/.test(point.status ?? "");
            const top = point.italy >= 0 ? ((maximum - point.italy) / range) * 100 : zeroPosition;
            const height = (Math.abs(point.italy) / range) * 100;
            const methodNote = hasBreak && !point.status?.includes("b") ? ` · ${labels.statusMethodNote}` : "";
            const description = `${point.year}: ${value(point.italy)} · ${statusDescription(point.status, locale, false)}${methodNote}`;
            return (
              <button className="trend-column" type="button" key={point.year}
                style={{ gridColumn: point.year - firstYear + 1 }}
                aria-label={description} aria-pressed={point.year === selectedYear}
                tabIndex={point.year === selected.year ? 0 : -1} title={description}
                onClick={() => updateQuery({ year: String(point.year) })}
                onKeyDown={(event) => {
                  const next = event.key === "ArrowRight" ? Math.min(index + 1, points.length - 1)
                    : event.key === "ArrowLeft" ? Math.max(index - 1, 0)
                      : event.key === "Home" ? 0 : event.key === "End" ? points.length - 1 : null;
                  if (next === null) return;
                  event.preventDefault();
                  updateQuery({ year: String(points[next].year) });
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
                }}>
                <span aria-hidden="true" className={`trend-bar ${point.italy < 0 ? "negative" : ""} ${hasBreak ? "has-break" : ""} ${uncertain ? "uncertain" : ""}`} style={{ top: `${top}%`, height: `${height}%` }} />
                <small aria-hidden="true">{String(point.year).slice(2)}{hasBreak ? <sup>*</sup> : null}</small>
              </button>
            );
          })}
        </div>
      </div>
      <p className="trend-legend">{labels.trendLegend}</p>
      <details className="trend-table">
        <summary>{labels.trendTable}</summary>
        <div className="country-table-scroll" tabIndex={0} role="region" aria-label={labels.trendTable}>
          <table>
            <caption>{indicator.title[locale]} · {rangeLabel}</caption>
            <thead><tr>
              <th scope="col">{labels.sourceYear}</th><th scope="col">{labels.italy}</th><th scope="col">{labels.eu}</th><th scope="col">{labels.median}</th><th scope="col">{labels.trendCoverage}</th><th scope="col">{labels.sourceItalyStatus}</th>
            </tr></thead>
            <tbody>{[...points].reverse().map((point) => (
              <tr key={point.year} data-selected={point.year === selectedYear}>
                <th scope="row">{point.year}</th>
                {[point.italy, point.eu, point.median].map((entry, index) => <td key={index}>{entry === null ? "—" : value(entry)}</td>)}
                <td>{point.coverage}/27</td><td>{statusDescription(point.status, locale, false)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function IndicatorCard({
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
  const breakYears = getBreakYears(indicator);
  const point = expanded ? selectedPoint(indicator, year) : indicator.latest;
  const Heading = expanded ? "h1" : "h3";

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
          <Heading>{indicator.title[locale]}</Heading>
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
          </p>
          <span>
            {labels.italy} · {point.year}
            {point.status
              ? ` · ${statusDescription(point.status, locale, false)}`
              : ""}
          </span>
        </div>
      </div>

      {indicator.newerEstimate && point.year !== indicator.newerEstimate.year ? (
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
            {indicator.newerEstimate.year},{" "}
            {statusDescription(
              indicator.newerEstimate.status,
              locale,
              false,
            )}
          </span>
        </p>
      ) : null}

      {expanded ? <div className="indicator-toolbar"><YearSelection indicator={indicator} point={point} locale={locale} /><ShareLink locale={locale} key={`${query}-${point.year}`} /><a className="compact-download" href={`${basePath}/data/indicators/${indicator.id}.csv`} download={`${indicator.id}.csv`}>CSV <span aria-hidden="true">↓</span><span className="visually-hidden"> · {labels.downloadIndicator}</span></a></div> : null}
      <ComparisonPlot indicator={indicator} locale={locale} point={point} />
      {expanded ? <details className="comparison-explainer"><summary>{labels.compareExplainer}</summary><p>{labels.comparisonHelp}</p></details> : null}

      {expanded ? (
        <section className="indicator-details">
          <h2 className="indicator-details-title">{labels.understand}</h2>
          <div className="indicator-details-body">
            <div className="definition-grid">
              <div>
                <h3>{labels.simpleDefinition}</h3>
                <p>{indicator.plain[locale]}</p>
              </div>
              <div>
                <h3>{labels.technicalDefinition}</h3>
                <p>{indicator.technical[locale]}</p>
              </div>
            </div>
            <p className="definition-attribution">
              {labels.definitionAttribution}{" "}
              {indicator.definitionSourceUrl ? (
                <a
                  href={indicator.definitionSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {labels.definitionSource}{" "}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </p>

            {breakYears.length || indicator.notes.length ? (
              <div className="indicator-notes">
                <h3>{labels.dataNotesTitle}</h3>
                {breakYears.length ? (
                  <p className="status-note">
                    {labels.dataStatusBreak.replace(
                      "{years}",
                      breakYears.join(", "),
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
                <h3>{labels.trend}</h3>
                <span>
                  {indicator.series[0].year}–{indicator.series[indicator.series.length - 1].year}
                </span>
              </div>
              <TrendBars indicator={indicator} locale={locale} selectedYear={point.year} />
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
                href={withQuery(pageHref(locale, `data/${indicator.id}/source`), query, point.year)}
              >
                {labels.openData} <span aria-hidden="true">→</span>
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
              <a href={`${basePath}/data/indicators/${indicator.id}.csv`} download={`${indicator.id}.csv`}>
                {labels.downloadIndicator}
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

function SourceVerification({
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
  const countryObservations = displayedPoint.countries ?? [];
  const flaggedCountries = displayedPoint.countryStatuses;
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
        href={withQuery(pageHref(locale, `data/${indicator.id}`), query, displayedPoint.year)}
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

      <div className="indicator-toolbar"><YearSelection indicator={indicator} point={displayedPoint} locale={locale} /><ShareLink locale={locale} key={`${query}-${displayedPoint.year}`} />{indicator.source.snapshotPath ? <a className="compact-download" href={`${basePath}/${indicator.source.snapshotPath}`} download>{labels.snapshotDownload} <span aria-hidden="true">↓</span></a> : null}</div>
      <div className="source-value-panel">
        <span>{labels.sourceDisplayed}</span>
        <strong>{displayedValue}</strong>
        <small>
          {labels.italy} · {displayedPoint.year} ·{" "}
          {displayedPoint.status
            ? statusDescription(displayedPoint.status, locale)
            : labels.yearUnflagged}
        </small>
      </div>

      <div className="source-verification-grid">
        <section>
          <h2>{labels.sourceSelection}</h2>
          <dl className="source-selection-list">
            <div>
              <dt>{labels.dataset}</dt>
              <dd>
                {indicator.source.datasetLabel}{" "}
                <code>{indicator.source.datasetCode}</code>
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
                <dd>{indicator.source.originalInstitution}</dd>
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
              <span>{labels.italy}</span>
              <strong>
                {formatValue(
                  displayedPoint.italy,
                  indicator.unitKey,
                  indicator.precision,
                  locale,
                )}
              </strong>
              <small>Eurostat · IT</small>
            </div>
            {displayedPoint.eu !== null ? (
              <div>
                <span>{labels.eu}</span>
                <strong>
                  {formatValue(
                    displayedPoint.eu,
                    indicator.unitKey,
                    indicator.precision,
                    locale,
                  )}
                </strong>
                <small>
                  Eurostat · EU27_2020
                  {displayedPoint.euStatus
                    ? ` · ${statusDescription(displayedPoint.euStatus, locale)}`
                    : ""}
                </small>
              </div>
            ) : (
              <div>
                <span>{labels.eu}</span>
                <strong>—</strong>
                <small>{labels.sourceEuUnavailable}</small>
              </div>
            )}
            <div>
              <span>{labels.median}</span>
              <strong>
                {formatValue(
                  displayedPoint.median,
                  indicator.unitKey,
                  indicator.precision,
                  locale,
                )}
              </strong>
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
          <div className="country-table-scroll" tabIndex={0} role="region" aria-label={labels.sourceCountryValues}>
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

      <details className="source-technical-links">
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
          {indicator.definitionSourceUrl ? (
            <a
              href={indicator.definitionSourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {labels.sourceOfficialDefinition}{" "}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          {indicator.source.metadataUrl &&
          indicator.source.metadataUrl !== indicator.definitionSourceUrl ? (
            <a
              href={indicator.source.metadataUrl}
              target="_blank"
              rel="noreferrer"
            >
              {labels.openMetadata} <span aria-hidden="true">↗</span>
            </a>
          ) : null}
          <a href={indicator.source.doi} target="_blank" rel="noreferrer">
            {labels.sourceDoi} <span aria-hidden="true">↗</span>
          </a>
          <a href={`${basePath}/data/indicators/${indicator.id}.csv`} download={`${indicator.id}.csv`}>
            {labels.downloadIndicator}
          </a>
          {indicator.source.snapshotPath ? <a href={`${basePath}/${indicator.source.snapshotPath}`} download>{labels.snapshotDownload}</a> : null}
        </div>
        {indicator.source.sha256 ? <p className="source-hash">{labels.snapshotHash}: <code>{indicator.source.sha256}</code></p> : null}
      </details>
    </section>
  );
}

function SocialProtectionDetail({
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
  const pensionPoint =
    pensionExpenditure.newerEstimate ?? pensionExpenditure.latest;
  const pensionComparison = {
    ...pensionExpenditure,
    latest: pensionPoint,
  };
  const oldAgeFilter = labels.oldAgeFilter.replace(
    "{year}",
    String(oldAgePoint.year),
  ).replace(
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
          <h3>{labels.oldAgeMeasureTitle}</h3>
          <p className="related-detail-value">
            {new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            }).format(oldAgePoint.italy)}
            €
            <small>
              {locale === "it" ? "su 100" : "out of 100"} ·{" "}
              {oldAgePoint.year} ·{" "}
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
              {labels.oldAgeOfficialDefinition}{" "}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ComparisonPlot indicator={oldAgeComparison} locale={locale} />
          <div className="related-source">
            <span>{labels.selectionUsed}</span>
            <strong>Eurostat · gov_10a_exp</strong>
            <small>{oldAgeFilter}</small>
            <a
              href={withQuery(pageHref(locale, `data/${oldAge.id}/source`), query, oldAgePoint.year)}
            >
              {labels.verifyNumber} <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>

        <article className="pension-boundary">
          <div className="pension-boundary-heading">
            <div>
              <p className="indicator-kicker">{labels.pensionMeasure}</p>
              <h3>{labels.pensionMeasureTitle}</h3>
            </div>
            <p className="related-detail-value">
              {formatValue(
                pensionPoint.italy,
                pensionExpenditure.unitKey,
                pensionExpenditure.precision,
                locale,
              )}
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
          <ComparisonPlot indicator={pensionComparison} locale={locale} />
          <div className="related-source">
            <span>{labels.selectionUsed}</span>
            <strong>Eurostat · spr_exp_pens · ESSPROS</strong>
            <small>{pensionFilter}</small>
            <div>
              <a href={withQuery(pageHref(locale, `data/${pensionExpenditure.id}`), query, pensionPoint.year)}>
                {labels.openPensionPage} <span aria-hidden="true">→</span>
              </a>
              <a
                href={withQuery(pageHref(locale, `data/${pensionExpenditure.id}/source`), query, pensionPoint.year)}
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
  const activeSection = requestedTopic === "all" || data.sections.some((section) => section.id === requestedTopic)
    ? requestedTopic as string : search ? "all" : "overview";
  const catalogParams = new URLSearchParams();
  if (requestedTopic && requestedTopic !== "overview") catalogParams.set("topic", activeSection);
  if (search) catalogParams.set("q", search);
  const catalogQuery = catalogParams.toString();
  const requestedYear = params.get("year");
  const setActiveSection = (topic: string) => updateQuery({ topic: topic === "overview" ? null : topic, q: topic === "overview" ? null : search || null }, true);
  const [activeSpendingId, setActiveSpendingId] = useState<string | null>(null);
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => false,
  );

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      let stored: string | null = null;
      try { stored = window.localStorage.getItem(themeStorageKey); } catch { /* Storage is optional. */ }
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
    try { window.localStorage.setItem(themeStorageKey, next ? "dark" : "light"); } catch { /* Keep the current theme when storage is blocked. */ }
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
        .sort(
          (left, right) =>
            getDisplayedPoint(right).italy - getDisplayedPoint(left).italy,
        ),
    [data.indicators],
  );

  const oldAge = data.indicators.find(
    (indicator) => indicator.id === "spending-old-age",
  );
  const pensionExpenditure = data.indicators.find(
    (indicator) => indicator.id === "pension-expenditure",
  );
  const spendingSource = spendingBreakdown[0]?.source;
  const spendingPoint = spendingBreakdown[0]
    ? getDisplayedPoint(spendingBreakdown[0])
    : null;
  const spendingYear = spendingPoint?.year;
  const spendingNumberFormatter = new Intl.NumberFormat(
    locale === "it" ? "it-IT" : "en-GB",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  );
  const snapshotIds = [
    "gdp-per-capita-pps",
    "median-age",
    "life-expectancy",
    "employment-rate",
  ];
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
    .map((indicator, index) => {
      const start = index === 0 ? 0 : spendingBoundaries[index - 1];
      const end =
        index === spendingBreakdown.length - 1
          ? 100
          : spendingBoundaries[index];
      return `var(--chart-${index + 1}) ${start}% ${end}%`;
    })
    .join(", ")})`;
  const selectSpendingSlice = (
    event: ReactPointerEvent<HTMLAnchorElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    const distanceFromCenter = Math.hypot(x, y);

    if (distanceFromCenter < bounds.width * 0.36) {
      return;
    }

    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    const share = ((angle + 450) % 360) / 3.6;
    const selectedIndex = spendingBoundaries.findIndex(
      (boundary) => share <= boundary,
    );
    const selected = spendingBreakdown[selectedIndex];

    if (selected) {
      event.currentTarget.href = pageHref(
        locale,
        `data/${selected.id}`,
      ) + `?year=${getDisplayedPoint(selected).year}`;
      setActiveSpendingId(selected.id);
    }
  };

  const searchTerms = normalizeSearch(search, locale).split(/\s+/).filter(Boolean);
  const filteredIndicators = data.indicators.filter((indicator) => {
      const matchesSection =
        activeSection === "all" ||
        (activeSection !== "overview" &&
          indicator.section === activeSection);
      const searchableText = [
        indicator.title.it,
        indicator.title.en,
        indicator.plain.it,
        indicator.plain.en,
        indicator.technical[locale],
        indicator.source.datasetCode,
      ]
        .join(" ");

      return (
        matchesSection &&
        searchTerms.every((term) => normalizeSearch(searchableText, locale).includes(term))
      );
  });

  const sources = useMemo(() => {
    const unique = new Map<string, Source>();
    for (const indicator of data.indicators) {
      unique.set(indicator.source.datasetCode, indicator.source);
    }
    return [...unique.values()].sort((left, right) =>
      left.datasetCode.localeCompare(right.datasetCode),
    );
  }, [data.indicators]);

  const heroEyebrow = labels.heroEyebrow.replace(
    "{year}",
    String(spendingYear ?? ""),
  );
  const heroCardLabel = labels.heroCardLabel.replace(
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
  ];

  const currentPath =
    view === "home"
      ? ""
      : view === "indicator" || view === "indicatorSource"
        ? `data/${selectedIndicatorId ?? ""}`
          + (view === "indicatorSource" ? "/source" : "")
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

        <nav aria-label={locale === "it" ? "Navigazione principale" : "Main navigation"}>
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
          <a href={pageHref(locale, "contribute")} aria-current={view === "contribute" ? "page" : undefined}>{labels.navContribute}</a>
        </nav>

        <div className="header-actions">
          <a
            className="language-link"
            href={withQuery(pageHref(locale === "it" ? "en" : "it", currentPath), locationQuery)}
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              {darkMode ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4L19 5" /></> : <path d="M20.6 14.1A9 9 0 0 1 9.9 3.4 9 9 0 1 0 20.6 14.1Z" />}
            </svg>
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {view === "home" ? (
          <>
            <section
              className="country-snapshot"
              aria-labelledby="country-snapshot-title"
            >
              <div className="snapshot-heading">
                <div>
                  <p className="eyebrow">{labels.snapshotEyebrow}</p>
                  <h1 id="country-snapshot-title">{labels.snapshotTitle}</h1>
                  <p>{labels.snapshotBody}</p>
                  <a className="snapshot-explore" href={pageHref(locale, "data")}>{labels.browseAll} <span aria-hidden="true">→</span></a>
                </div>
                <details className="snapshot-method">
                  <summary>
                    <span className="info-badge" aria-hidden="true">
                      i
                    </span>
                    {labels.snapshotWhy}
                  </summary>
                  <p>{labels.snapshotWhyBody}</p>
                </details>
              </div>

              <div className="edition-strip"><span>{data.indicators.length} {locale === "it" ? "indicatori" : "indicators"} · {data.sections.length} {locale === "it" ? "temi" : "topics"}</span><span>{labels.edition} <time dateTime={data.generatedAt}>{formatDate(data.generatedAt, locale)}</time></span><p>{labels.editionNote}</p></div>
              <div className="snapshot-grid">
                {snapshotIndicators.map((indicator) => (
                  <a
                    href={pageHref(locale, `data/${indicator.id}`)}
                    key={indicator.id}
                  >
                    <span>{snapshotTitles[indicator.id]}</span>
                    <strong>
                      {formatValue(
                        indicator.latest.italy,
                        indicator.unitKey,
                        indicator.precision,
                        locale,
                      )}
                    </strong>
                    <small>
                      {indicator.latest.year} ·{" "}
                      {indicator.id === "gdp-per-capita-pps"
                        ? labels.snapshotGdpUnit
                        : indicator.latest.eu !== null
                          ? `${labels.eu}: ${formatValue(
                              indicator.latest.eu,
                              indicator.unitKey,
                              indicator.precision,
                              locale,
                            )}`
                          : labels.noAggregate}
                    </small>
                    <em>
                      {labels.snapshotOpen} <span aria-hidden="true">→</span>
                    </em>
                  </a>
                ))}
              </div>
            </section>

            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">{heroEyebrow}</p>
                <h2>{labels.heroTitle}</h2>
                <p className="hero-intro">{labels.heroBody}</p>
                <div className="hero-facts">
                  <div>
                    <span>{labels.heroYear}</span>
                    <strong>{spendingYear}</strong>
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
                    <span>{labels.heroSource}</span>
                    <strong>{labels.heroSourceName} · COFOG</strong>
                    <small>{heroSourceUpdated}</small>
                    {spendingSource && activeSpending ? (
                      <div className="hero-source-links">
                        <a
                          href={pageHref(
                            locale,
                            `data/${activeSpending.id}/source`,
                          ) + `?year=${getDisplayedPoint(activeSpending).year}`}
                        >
                          {labels.heroOpenSource}{" "}
                          <span aria-hidden="true">→</span>
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
                      {labels.heroMethodLink}{" "}
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </details>
                <a className="primary-link" href={pageHref(locale, "data")}>
                  {labels.readBreakdown} <span aria-hidden="true">→</span>
                </a>
              </div>

              <div
                className="hundred-euro-card"
                onMouseLeave={() => setActiveSpendingId(null)}
              >
                <div className="hundred-euro-heading">
                  <span>100 €</span>
                  <small>{heroCardLabel}</small>
                </div>

                <div className="spending-visual">
                  {activeSpending ? (
                    <a
                      className="spending-donut"
                      href={withQuery(pageHref(locale, `data/${activeSpending.id}`), "", getDisplayedPoint(activeSpending).year)}
                      aria-label={`${labels.spendingDonutLabel}: ${
                        activeSpending.id === "spending-social-protection"
                          ? labels.socialProtectionHero
                          : activeSpending.title[locale]
                      }`}
                      onPointerMove={selectSpendingSlice}
                      onPointerDown={selectSpendingSlice}
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
                        <strong>
                          {spendingNumberFormatter.format(
                            getDisplayedPoint(activeSpending).italy,
                          )}
                          €
                        </strong>
                        <small>
                          {activeSpending.id ===
                          "spending-social-protection"
                            ? labels.socialProtectionHero
                            : activeSpending.title[locale]}
                        </small>
                      </span>
                    </a>
                  ) : null}

                  <div className="spending-list">
                    {spendingBreakdown.map((indicator, index) => (
                      <a
                        href={withQuery(pageHref(locale, `data/${indicator.id}`), "", getDisplayedPoint(indicator).year)}
                        key={indicator.id}
                        data-active={indicator.id === activeSpending?.id}
                        onMouseEnter={() =>
                          setActiveSpendingId(indicator.id)
                        }
                        onFocus={() => setActiveSpendingId(indicator.id)}
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
                        </span>
                        <strong>
                          {spendingNumberFormatter.format(
                            getDisplayedPoint(indicator).italy,
                          )}
                          €
                        </strong>
                      </a>
                    ))}
                  </div>
                </div>
                <p className="spending-interaction">
                  {labels.spendingInteract}
                </p>
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
          <section
            className={`indicator-page-shell ${
              selectedIndicator.id === "spending-social-protection"
                ? "has-related-detail"
                : ""
            }`}
          >
            <a className="back-link" href={withQuery(pageHref(locale, "data"), catalogQuery || `topic=${selectedIndicator.section}`)}>
              <span aria-hidden="true">←</span> {catalogQuery ? labels.backToResults : labels.backToTopic.replace("{topic}", data.sections.find((section) => section.id === selectedIndicator.section)?.title[locale] ?? labels.navData)}
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
          <SourceVerification indicator={selectedIndicator} locale={locale} query={catalogQuery} year={requestedYear} />
        ) : null}

        {view === "data" ? (
          <section className="data-section" id="data">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{labels.navData}</p>
              <h1>{labels.dataSectionTitle}</h1>
              <p>{labels.dataSectionBody}</p>
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
                  updateQuery({ q: nextSearch || null, topic: nextSearch.trim() ? "all" : activeSection === "overview" ? null : activeSection });
                }}
                placeholder={labels.searchPlaceholder}
              />
              <small id="search-hint">{labels.searchHint}</small>
              {search ? <button className="clear-search" type="button" onClick={() => updateQuery({ q: null })}>{labels.clearSearch}</button> : null}
            </div>
          </div>

          <div className="catalog-tools"><ShareLink locale={locale} key={locationQuery} /><a href={`${basePath}/data/dashboard.csv`} download>{labels.downloadAll} <span aria-hidden="true">↓</span></a></div>
          <div className="section-filters" role="group" aria-label={labels.navData}>
            <button
              type="button"
              className={activeSection === "overview" ? "active" : ""}
              aria-pressed={activeSection === "overview"}
              onClick={() => {
                setActiveSection("overview");
              }}
            >
              {labels.topicOverview}
              <span>{data.sections.length}</span>
            </button>
            <button
              type="button"
              className={activeSection === "all" ? "active" : ""}
              aria-pressed={activeSection === "all"}
              onClick={() => setActiveSection("all")}
            >
              {labels.allSections}
              <span>{data.indicators.length}</span>
            </button>
            {data.sections.map((section) => (
              <button
                type="button"
                className={activeSection === section.id ? "active" : ""}
              aria-pressed={activeSection === section.id}
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
            {activeSection !== "overview" ? (
              <p className="results-count" aria-live="polite">
                <strong>{filteredIndicators.length}</strong> /{" "}
                {data.indicators.length} {labels.results}
              </p>
            ) : null}
          </div>

          {activeSection === "overview" ? (
            <div className="topic-grid">
              {data.sections.map((section) => {
                const sectionIndicators = data.indicators.filter(
                  (indicator) => indicator.section === section.id,
                );

                return (
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
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
                    <h3>{section.title[locale]}</h3>
                    <p>{section.description[locale]}</p>
                    <small>{labels.topicExamples}</small>
                    <ul>
                      {sectionIndicators.slice(0, 3).map((indicator) => (
                        <li key={indicator.id}>{indicator.title[locale]}</li>
                      ))}
                    </ul>
                    <strong>
                      {labels.topicOpen} <span aria-hidden="true">→</span>
                    </strong>
                  </button>
                );
              })}
            </div>
          ) : (
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
          )}

          {activeSection !== "overview" &&
          filteredIndicators.length === 0 ? (
            <div className="empty-state" role="status"><p>{labels.noResults}</p><button type="button" onClick={() => updateQuery({ q: null, topic: "all" }, true)}>{labels.resetSearch}</button></div>
          ) : null}
          </section>
        ) : null}

        {view === "method" ? (
          <section className="method-section" id="method">
          <div className="method-intro">
            <p className="eyebrow">{labels.methodEyebrow}</p>
            <h1>{labels.methodTitle}</h1>
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
          <MethodGuide locale={locale} sourcesHref={pageHref(locale, "sources")} />
          </section>
        ) : null}

        {view === "sources" ? (
          <section className="sources-section" id="sources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{labels.sourcesEyebrow}</p>
              <h1>{labels.sourcesTitle}</h1>
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
                    {source.originalInstitution !== source.institution ? (
                      <small>
                        {labels.originalInstitution}:{" "}
                        {source.originalInstitution}
                      </small>
                    ) : null}
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
            <h1>{labels.contributeTitle}</h1>
            <p>{labels.contributeBody}</p>
            <a href="https://github.com/andrea-gentilini/explainable-italy">
              {labels.contributionLink} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ul className="contribution-ways">
            {labels.contributionWays.map((way) => (
              <li key={way}>
                <span aria-hidden="true">→</span>
                <p>{way}</p>
              </li>
            ))}
          </ul>
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
        <nav className="footer-links" aria-label={locale === "it" ? "Informazioni sul progetto" : "Project information"}>
          <a href={pageHref(locale, "about")}>{labels.navAbout}</a>
          <a href={pageHref(locale, "contribute")}>{labels.navContribute}</a>
          <a href={pageHref(locale, "method")}>{labels.navMethod}</a>
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
