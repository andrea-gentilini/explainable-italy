/**
 * Plain-language readings of the selected observation.
 * Definitions follow scripts/update-data.mjs. Numbers such as age limits,
 * the index base and reference populations are definitions, not observations.
 *
 * @typedef {{id: string, unitKey: string, precision: number}} ReadingIndicator
 * @typedef {{year: number, italy: number, eu: number|null}} ReadingPoint
 * @typedef {'it'|'en'} Locale
 * @typedef {{it: string, en: string, caution?: {it: string, en: string}}} ReadingTemplate
 */

/** @type {Record<string, ReadingTemplate>} */
const templates = {
  "total-public-expenditure": {
    it: "Nel {year}, la spesa complessiva delle amministrazioni pubbliche italiane era pari al {value}% del PIL.",
    en: "In {year}, total expenditure by Italy’s general government amounted to {value}% of GDP.",
    caution: {
      it: "Il rapporto in percentuale del PIL dipende sia dal livello della spesa pubblica sia dal valore del PIL nominale al denominatore.",
      en: "The ratio to GDP depends on both the level of public expenditure and the nominal GDP in the denominator.",
    },
  },
  "total-public-revenue": {
    it: "Nel {year}, le entrate complessive delle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
    en: "In {year}, total revenue received by Italy’s general government amounted to {value}% of GDP.",
    caution: {
      it: "Il rapporto in percentuale del PIL dipende sia dal gettito e dalle altre entrate pubbliche sia dal valore del PIL nominale al denominatore.",
      en: "The ratio to GDP depends on both public revenue and the nominal GDP in the denominator.",
    },
  },
  "budget-balance": {
    it: "Nel {year}, il saldo tra entrate e uscite delle amministrazioni pubbliche italiane era pari al {value}% del PIL.",
    en: "In {year}, Italy’s general government balance between revenue and expenditure amounted to {value}% of GDP.",
    caution: {
      it: "Un saldo negativo indica un deficit. Un saldo positivo indica un avanzo.",
      en: "A negative balance indicates a deficit. A positive balance indicates a surplus.",
    },
  },
  "interest-expenditure": {
    it: "Nel {year}, gli interessi pagati dalle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
    en: "In {year}, interest paid by Italy’s general government amounted to {value}% of GDP.",
    caution: {
      it: "La misura è registrata per competenza economica (SEC 2010) e non comprende il rimborso del capitale in scadenza.",
      en: "The measure is recorded on an accrual basis (ESA 2010) and excludes principal repayments.",
    },
  },
  "public-investment": {
    it: "Nel {year}, gli investimenti fissi lordi delle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
    en: "In {year}, gross fixed investment by Italy’s general government amounted to {value}% of GDP.",
    caution: {
      it: "La misura riguarda gli investimenti diretti delle amministrazioni pubbliche in beni capitali fissi e non include i contributi agli investimenti erogati a imprese o famiglie.",
      en: "The measure covers direct general government investment in fixed capital assets and excludes investment grants paid to businesses or households.",
    },
  },
  "social-benefits": {
    it: "Nel {year}, le prestazioni sociali in denaro e quelle acquistate sul mercato dalle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
    en: "In {year}, social benefits in cash and benefits purchased on the market by Italy’s general government amounted to {value}% of GDP.",
    caution: {
      it: "La serie non include i servizi pubblici erogati direttamente da strutture e personale della pubblica amministrazione.",
      en: "The series excludes public services produced directly by government facilities and staff.",
    },
  },
  "public-debt": {
    it: "Alla fine del {year}, il debito lordo consolidato delle amministrazioni pubbliche italiane era pari al {value}% del PIL di quell’anno.",
    en: "At the end of {year}, Italy’s consolidated gross government debt amounted to {value}% of that year’s GDP.",
    caution: {
      it: "Il rapporto dipende sia dallo stock nominale del debito a fine anno (al lordo delle attività finanziarie pubbliche) sia dal PIL nominale dell’anno al denominatore.",
      en: "The ratio depends on both the year-end nominal debt stock (gross of government financial assets) and the annual nominal GDP in the denominator.",
    },
  },
  "median-age": {
    it: "Al 1º gennaio {year}, l’età che divideva la popolazione residente italiana in due metà era {value} anni.",
    en: "On 1 January {year}, the age dividing Italy’s resident population into two equal halves was {value} years.",
    caution: {
      it: "La mediana dei Paesi nel grafico è calcolata sulle età mediane nazionali, con lo stesso peso per ogni Paese.",
      en: "The country median in the chart is calculated from national median ages, giving each country equal weight.",
    },
  },
  "population-65-plus": {
    it: "Al 1º gennaio {year}, il {value}% della popolazione residente in Italia aveva almeno 65 anni.",
    en: "On 1 January {year}, {value}% of Italy’s resident population was aged 65 or over.",
    caution: {
      it: "Il dato è uno stock rilevato al 1º gennaio dell’anno sulla popolazione abitualmente residente.",
      en: "The figure is a stock recorded on 1 January of the year for the usually resident population.",
    },
  },
  "old-age-dependency": {
    it: "Al 1º gennaio {year}, in Italia c’erano {value} persone di almeno 65 anni ogni 100 persone tra 15 e 64 anni.",
    en: "On 1 January {year}, Italy had {value} people aged 65 or over for every 100 people aged 15 to 64.",
    caution: {
      it: "Il rapporto confronta fasce d’età, indipendentemente dal fatto che le persone lavorino.",
      en: "The ratio compares age groups, regardless of whether people are employed.",
    },
  },
  "fertility-rate": {
    it: "Applicando per tutta la vita i tassi di fecondità osservati in Italia nel {year}, una donna avrebbe in media {value} figli.",
    en: "A woman experiencing Italy’s {year} fertility rates throughout her life would have {value} children on average.",
    caution: {
      it: "È un indicatore sintetico di periodo calcolato sui tassi di fecondità per età di un singolo anno solare, non sul numero finale di figli di una generazione.",
      en: "This is a synthetic period indicator based on a single calendar year’s age-specific fertility rates, not the completed fertility of a birth cohort.",
    },
  },
  "life-expectancy": {
    it: "Nel {year}, la speranza di vita alla nascita in Italia era {value} anni.",
    en: "In {year}, life expectancy at birth in Italy was {value} years.",
    caution: {
      it: "Il calcolo suppone che i livelli di mortalità di quell’anno restino invariati per tutta la vita di un neonato.",
      en: "The calculation assumes that the year’s mortality rates remain unchanged throughout a newborn’s life.",
    },
  },
  "employment-rate": {
    it: "Nel {year}, il {value}% dei residenti in Italia tra 20 e 64 anni aveva un lavoro.",
    en: "In {year}, {value}% of Italy’s residents aged 20 to 64 were employed.",
    caution: {
      it: "Il denominatore è l’intera popolazione residente tra 20 e 64 anni; il valore annuale è la media delle rilevazioni trimestrali sull’occupazione.",
      en: "The denominator is the entire resident population aged 20 to 64; the annual figure is the average of the quarterly labour force survey waves.",
    },
  },
  "unemployment-rate": {
    it: "Nel {year}, il {value}% della forza lavoro italiana tra 15 e 74 anni era disoccupato secondo la definizione ILO.",
    en: "In {year}, {value}% of Italy’s labour force aged 15 to 74 was unemployed under the ILO definition.",
    caution: {
      it: "La forza lavoro comprende occupati e disoccupati. La disoccupazione richiede ricerca attiva e disponibilità a iniziare un lavoro.",
      en: "The labour force comprises employed and unemployed people. Unemployment requires active job seeking and availability to start work.",
    },
  },
  "youth-unemployment": {
    it: "Nel {year}, il {value}% della forza lavoro italiana tra 15 e 24 anni era disoccupato secondo la definizione ILO.",
    en: "In {year}, {value}% of Italy’s labour force aged 15 to 24 was unemployed under the ILO definition.",
    caution: {
      it: "Il denominatore comprende i giovani occupati e quelli che cercano attivamente lavoro e sono disponibili a iniziare.",
      en: "The denominator comprises employed young people and those actively seeking and available to start work.",
    },
  },
  "gdp-per-capita-pps": {
    it: "Nel {year}, il PIL per abitante dell’Italia valeva {value} su una scala in cui l’UE è 100, tenendo conto delle differenze di prezzo tra Paesi.",
    en: "In {year}, Italy’s GDP per person was {value} on a scale where the EU equals 100, accounting for price differences between countries.",
    caution: {
      it: "L’indice è relativo all’UE dello stesso anno. Un aumento indica un cambiamento rispetto al riferimento europeo; per misurare la crescita reale del PIL servono altri dati. I redditi delle famiglie e la loro distribuzione richiedono misure specifiche.",
      en: "The index is relative to the EU in the same year. An increase reflects a change relative to that European reference; measuring real GDP growth requires other data. Household incomes and their distribution require specific measures.",
    },
  },
  "poverty-or-exclusion": {
    it: "Nell’indagine del {year}, il {value}% delle persone in famiglie private in Italia risultava a rischio di povertà o esclusione sociale.",
    en: "In the {year} survey, {value}% of people in private households in Italy were at risk of poverty or social exclusion.",
    caution: {
      it: "L’anno è quello dell’indagine. Il reddito si riferisce normalmente all’anno precedente.",
      en: "The year identifies the survey. Income normally refers to the preceding year.",
    },
  },
  "pension-expenditure": {
    it: "Nel {year}, la spesa pensionistica italiana rilevata dal sistema europeo ESSPROS era pari al {value}% del PIL.",
    en: "In {year}, Italian pension expenditure recorded under the European ESSPROS system amounted to {value}% of GDP.",
    caution: {
      it: "La misura comprende le diverse tipologie di pensione previste da ESSPROS e ha un perimetro distinto dalla funzione di spesa «vecchiaia».",
      en: "The measure covers the pension types defined by ESSPROS and has a different scope from the old-age spending function.",
    },
  },
  "healthy-life-years": {
    it: "Nel {year}, l’indicatore alla nascita per l’Italia stimava {value} anni di vita senza limitazioni di lunga durata nelle attività abituali.",
    en: "In {year}, the indicator at birth for Italy estimated {value} years of life without long-standing limitations in usual activities.",
    caution: {
      it: "La misura combina mortalità e limitazioni dichiarate dalle persone nell’indagine.",
      en: "The measure combines mortality data with activity limitations reported by survey respondents.",
    },
  },
  "tertiary-education": {
    it: "Nel {year}, il {value}% delle persone in Italia tra 25 e 34 anni aveva completato un percorso di istruzione terziaria, universitario o equivalente.",
    en: "In {year}, {value}% of people in Italy aged 25 to 34 had completed university or an equivalent tertiary programme.",
    caution: {
      it: "La misura riguarda i residenti tra 25 e 34 anni e comprende lauree, dottorati e diplomi terziari non universitari (livelli ISCED 5–8).",
      en: "The measure covers residents aged 25 to 34 and includes university degrees, doctorates and short-cycle or vocational tertiary qualifications (ISCED levels 5–8).",
    },
  },
  "early-school-leavers": {
    it: "Nel {year}, il {value}% delle persone in Italia tra 18 e 24 anni aveva al massimo la scuola media e non aveva partecipato a istruzione o formazione nelle quattro settimane precedenti l’indagine.",
    en: "In {year}, {value}% of people in Italy aged 18 to 24 had at most lower secondary education and had not taken part in education or training in the four weeks before the survey.",
    caution: {
      it: "Il denominatore è l’intera popolazione residente tra 18 e 24 anni; la misura combina il titolo di studio più alto conseguito e l’assenza di formazione nelle quattro settimane precedenti l’intervista.",
      en: "The denominator is the entire resident population aged 18 to 24; the measure combines highest educational attainment and non-participation in training during the four weeks before the interview.",
    },
  },
  "adult-learning": {
    it: "Nel {year}, il {value}% delle persone in Italia tra 25 e 64 anni aveva partecipato a istruzione o formazione nelle quattro settimane precedenti l’indagine.",
    en: "In {year}, {value}% of people in Italy aged 25 to 64 had taken part in education or training in the four weeks before the survey.",
    caution: {
      it: "La rilevazione misura la partecipazione a corsi formali o non formali nelle quattro settimane precedenti l’intervista, non sull’intero anno solare.",
      en: "The survey measures participation in formal or non-formal education or training during the four weeks preceding the interview, not over the full calendar year.",
    },
  },
  "neet-rate": {
    it: "Nel {year}, il {value}% delle persone in Italia tra 15 e 29 anni non lavorava e non partecipava a istruzione o formazione.",
    en: "In {year}, {value}% of people in Italy aged 15 to 29 were neither employed nor in education or training.",
    caution: {
      it: "Il denominatore è l’intera popolazione giovanile tra 15 e 29 anni, e non la sola forza lavoro come nel tasso di disoccupazione giovanile.",
      en: "The denominator is the entire youth population aged 15 to 29, rather than only the labour force as in the youth unemployment rate.",
    },
  },
  "renewable-energy": {
    it: "Nel {year}, le fonti rinnovabili coprivano il {value}% dei consumi finali lordi di energia in Italia.",
    en: "In {year}, renewable sources supplied {value}% of gross final energy consumption in Italy.",
    caution: {
      it: "Il denominatore comprende tutti i consumi finali lordi di energia (elettricità, riscaldamento e raffrescamento, trasporti), non la sola generazione elettrica.",
      en: "The denominator covers all gross final energy consumption (electricity, heating and cooling, and transport), not electricity generation alone.",
    },
  },
  "municipal-waste-recycling": {
    it: "Nel {year}, il riciclo riguardava il {value}% dei rifiuti urbani generati in Italia, secondo il metodo Eurostat applicabile a quell’anno.",
    en: "In {year}, recycling accounted for {value}% of municipal waste generated in Italy, under the Eurostat method applying to that year.",
    caution: {
      it: "La serie riguarda i soli rifiuti urbani (prodotti da famiglie e attività assimilabili) e non comprende i rifiuti speciali industriali o da costruzione e demolizione.",
      en: "The series covers municipal waste only (from households and similar sources) and excludes industrial or construction and demolition waste.",
    },
  },
  "greenhouse-gas-emissions": {
    it: "Nel {year}, l’indice {value} indica emissioni italiane pari al {value}% del livello del 1990, entro il perimetro della serie.",
    en: "In {year}, an index of {value} means Italian emissions were {value}% of their 1990 level, within the scope of this series.",
    caution: {
      it: "Ogni Paese ha il proprio 1990 posto uguale a 100: l’indice misura la variazione rispetto alla base nazionale del 1990, non il volume assoluto di emissioni. La serie esclude uso del suolo e foreste, aviazione e navigazione internazionali.",
      en: "Each country’s own 1990 level is set to 100: the index measures the change relative to the national 1990 baseline, not absolute emissions. The series excludes land use and forestry, international aviation and international shipping.",
    },
  },
};

const spendingFunctions = {
  "spending-general-services": ["i servizi pubblici generali", "general public services"],
  "spending-defence": ["la difesa", "defence"],
  "spending-public-order": ["l’ordine pubblico e la sicurezza", "public order and safety"],
  "spending-economic-affairs": ["gli affari economici", "economic affairs"],
  "spending-environment": ["la protezione dell’ambiente", "environmental protection"],
  "spending-housing": ["le abitazioni e il territorio", "housing and community amenities"],
  "spending-health": ["la sanità", "health"],
  "spending-culture": ["cultura, sport e religione", "recreation, culture and religion"],
  "spending-education": ["l’istruzione", "education"],
  "spending-social-protection": ["la protezione sociale", "social protection"],
  "spending-old-age": ["la funzione «vecchiaia»", "the old-age function"],
};

for (const [id, [it, en]] of Object.entries(spendingFunctions)) {
  templates[id] = {
    it: "Nel {year}, {value} € ogni 100 € di spesa delle amministrazioni pubbliche italiane riguardavano " + it + ".",
    en: "In {year}, €{value} of every €100 spent by Italy’s general government went to " + en + ".",
    caution: {
      it: "La misura indica la quota sul totale della spesa pubblica, non il livello di spesa per abitante né la quota sul PIL.",
      en: "The measure shows the share of total public expenditure, not spending per person or as a share of GDP.",
    },
  };
}
templates["spending-old-age"].caution = {
  it: "Questa voce comprende pensioni legate all’età e altri benefici e servizi per persone anziane. È inclusa nella protezione sociale e indica la quota sul totale della spesa pubblica.",
  en: "This function includes age-related pensions and other benefits and services for older people. It is part of social protection and shows the share of total public expenditure.",
};

const annualChanges = {
  "real-gdp-growth-per-capita": {
    it: "il PIL reale per abitante",
    en: "real GDP per person",
    caution: {
      it: "Il grafico principale mostra il tasso di variazione annuo (%), non il livello del PIL reale per abitante. Una variazione positiva dopo un calo non significa aver già recuperato il livello precedente.",
      en: "The main chart shows the annual rate of change (%), not the level of real GDP per person. A positive rate after a decline does not mean output has already returned to its earlier level.",
    },
  },
  inflation: {
    it: "i prezzi al consumo misurati dall’indice armonizzato",
    en: "consumer prices measured by the harmonised index",
    caution: {
      it: "Il grafico principale mostra il tasso di variazione annuo (%), non il livello dell’indice dei prezzi. Un tasso positivo più basso (disinflazione) significa che i prezzi continuano ad aumentare ma più lentamente; i prezzi scendono solo quando la variazione è negativa.",
      en: "The main chart shows the annual rate of change (%), not the price index level. A lower positive rate (disinflation) means prices are still rising, only more slowly; prices fall only when the rate is negative.",
    },
  },
};

/**
 * Builds a chain-linked cumulative index (baseYear = 100) from annual percentage rates of change.
 * @param {Array<{year: number, italy: number, eu: number|null, status?: string|null}>} series
 * @param {number} [requestedBaseYear]
 */
export function buildCumulativeIndexSeries(series, requestedBaseYear) {
  if (!Array.isArray(series) || series.length === 0) {
    return null;
  }
  const sorted = [...series].sort((left, right) => left.year - right.year);
  const initialBaseYear = sorted[0].year - 1;
  const rawPoints = [
    { year: initialBaseYear, italyRaw: 100, euRaw: 100, status: null, isBaseline: true },
  ];
  let italyCursor = 100;
  let euCursor = 100;

  for (const point of sorted) {
    italyCursor *= 1 + point.italy / 100;
    euCursor =
      euCursor !== null && point.eu !== null && Number.isFinite(point.eu)
        ? euCursor * (1 + point.eu / 100)
        : null;
    rawPoints.push({
      year: point.year,
      italyRaw: italyCursor,
      euRaw: euCursor,
      status: point.status ?? null,
      isBaseline: false,
    });
  }

  const availableBaseYears = rawPoints.map((entry) => entry.year);
  const baseEntry =
    rawPoints.find((entry) => entry.year === requestedBaseYear) ?? rawPoints[0];

  const points = rawPoints
    .filter((entry) => !entry.isBaseline)
    .map((entry) => {
      const italy = Number(((entry.italyRaw / baseEntry.italyRaw) * 100).toFixed(10));
      const eu =
        entry.euRaw !== null && baseEntry.euRaw !== null && baseEntry.euRaw > 0
          ? Number(((entry.euRaw / baseEntry.euRaw) * 100).toFixed(10))
          : null;
      return {
        year: entry.year,
        italy,
        eu,
        italyIndex: italy,
        euIndex: eu,
        italyCumulativeChange: Number((italy - 100).toFixed(10)),
        euCumulativeChange: eu !== null ? Number((eu - 100).toFixed(10)) : null,
        status: entry.status,
      };
    });

  return {
    baseYear: baseEntry.year,
    availableBaseYears,
    points,
  };
}

export const supportedReadingIds = Object.freeze([
  ...Object.keys(templates),
  ...Object.keys(annualChanges),
]);

/** @param {number} value @param {number} precision */
function rounded(value, precision) {
  // Match the card’s Intl decimal rounding, including halfway values.
  const result = Number(new Intl.NumberFormat("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: false,
  }).format(value));
  return Object.is(result, -0) ? 0 : result;
}

/** @param {number} value @param {number} precision @param {Locale} locale */
function format(value, precision, locale) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

/** @param {ReadingIndicator} indicator @param {ReadingPoint} point @param {Locale} locale */
function comparison(indicator, point, locale) {
  if (point.eu === null || !Number.isFinite(point.eu)) return null;
  const precision = Math.min(10, Math.max(0, Math.trunc(indicator.precision)));
  const difference = point.italy - point.eu;

  // Each emissions index has its own national 1990 base. The current source
  // has no comparable EU aggregate, so this reading never invents one.
  if (indicator.unitKey === "index_1990") return null;

  if (indicator.id === "old-age-dependency") {
    const value = format(point.eu, precision, locale);
    return locale === "it"
      ? "Nell’UE il rapporto era " + value + " persone di almeno 65 anni ogni 100 tra 15 e 64 anni."
      : "The EU ratio was " + value + " people aged 65 or over per 100 people aged 15 to 64.";
  }

  /** @type {Record<string, {it: string, en: string}>} */
  const differenceUnits = {
    percent: { it: "punti percentuali", en: "percentage points" },
    percent_gdp: { it: "punti percentuali", en: "percentage points" },
    percent_spending: { it: "punti percentuali", en: "percentage points" },
    percent_change: { it: "punti percentuali", en: "percentage points" },
    years: { it: "anni", en: "years" },
    children_per_woman: { it: "figli per donna", en: "children per woman" },
  };

  let gap = difference;
  let unit = differenceUnits[indicator.unitKey]?.[locale];
  if (indicator.id === "gdp-per-capita-pps" && point.eu > 0) {
    gap = difference / point.eu * 100;
    unit = "%";
  }
  if (!unit) return null;

  const value = format(Math.abs(gap), precision, locale);
  const sameDisplayedValue = format(point.italy, precision, locale) === format(point.eu, precision, locale);
  if (sameDisplayedValue || rounded(gap, precision) === 0) {
    if (sameDisplayedValue) {
      return locale === "it"
        ? "Italia e UE avevano lo stesso valore alla precisione mostrata."
        : "Italy and the EU had the same value at the displayed precision.";
    }
    const limit = format(10 ** -precision, precision, locale);
    return locale === "it"
      ? "Il divario era inferiore a " + limit + " " + unit + "."
      : "The gap was less than " + limit + " " + unit + ".";
  }
  if (Math.abs(rounded(gap, precision)) === 1) {
    const singular = {
      "punti percentuali": "punto percentuale",
      "percentage points": "percentage point",
      anni: "anno",
      years: "year",
      "figli per donna": "figlio per donna",
      "children per woman": "child per woman",
    };
    unit = singular[unit] ?? unit;
  }
  if (unit === "%") {
    return locale === "it"
      ? "Il valore italiano era circa il " + value + "% " + (gap > 0 ? "sopra" : "sotto") + " quello UE."
      : "Italy’s value was approximately " + value + "% " + (gap > 0 ? "above" : "below") + " the EU value.";
  }
  return locale === "it"
    ? "Il valore italiano era circa " + value + " " + unit + " " + (gap > 0 ? "sopra" : "sotto") + " quello UE."
    : "Italy’s value was approximately " + value + " " + unit + " " + (gap > 0 ? "above" : "below") + " the EU value.";
}

/**
 * @param {ReadingIndicator} indicator
 * @param {ReadingPoint} point
 * @param {Locale} locale
 * @returns {{description: string, comparison: string|null, caution: string|null}|null}
 */
export function getIndicatorReading(indicator, point, locale) {
  if (!Number.isFinite(point.italy) || !Number.isInteger(point.year)) return null;
  const precision = Number.isFinite(indicator.precision)
    ? Math.min(10, Math.max(0, Math.trunc(indicator.precision)))
    : 1;
  const safeIndicator = { ...indicator, precision };
  const value = format(point.italy, precision, locale);
  const template = templates[indicator.id];
  const change = annualChanges[indicator.id];
  let description;

  if (change) {
    const unchanged = rounded(point.italy, precision) === 0;
    const magnitude = format(Math.abs(point.italy), precision, locale);
    if (locale === "it") {
      const plural = indicator.id === "inflation";
      const verb = unchanged
        ? (plural ? "sono rimasti invariati alla precisione mostrata" : "è rimasto invariato alla precisione mostrata")
        : (plural ? "sono " : "è ") + (point.italy > 0
          ? (plural ? "aumentati" : "aumentato")
          : (plural ? "diminuiti" : "diminuito")) + " del " + magnitude + "%";
      description = "Nel " + point.year + ", " + change.it + " " + verb + " rispetto all’anno precedente.";
    } else {
      const verb = unchanged
        ? "was unchanged at the displayed precision"
        : (point.italy > 0 ? "increased" : "decreased") + " by " + magnitude + "%";
      description = "In " + point.year + ", " + change.en + " " +
        (indicator.id === "inflation" ? verb.replace("was unchanged", "were unchanged") : verb) +
        " compared with the previous year.";
    }
  } else if (template) {
    description = template[locale].replaceAll("{year}", String(point.year)).replaceAll("{value}", value);
  } else {
    description = locale === "it"
      ? "Nel " + point.year + ", il valore italiano era " + value + " nell’unità riportata nella scheda."
      : "In " + point.year + ", Italy’s value was " + value + " in the unit shown on the card.";
  }

  return {
    description,
    comparison: comparison(safeIndicator, point, locale),
    caution: (template?.caution ?? change?.caution)?.[locale] ?? null,
  };
}
