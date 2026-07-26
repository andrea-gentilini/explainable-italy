import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const rawDirectory = join(projectRoot, "data", "raw", "eurostat");
const processedDirectory = join(projectRoot, "data", "processed");
const publicDataDirectory = join(projectRoot, "public", "data");

const euCountries = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "EL",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
];

const allGeographies = [...euCountries, "EU27_2020"];

const cofogIndicators = [
  {
    id: "spending-general-services",
    value: "GF01",
    title: {
      it: "Servizi pubblici generali",
      en: "General public services",
    },
    plain: {
      it: "Il funzionamento generale delle istituzioni. Comprende gli organi legislativi ed esecutivi, gli affari fiscali, la ricerca di base e gli interessi sul debito.",
      en: "The general operation of public institutions. It includes legislative and executive bodies, fiscal affairs, basic research and public debt interest.",
    },
  },
  {
    id: "spending-defence",
    value: "GF02",
    title: { it: "Difesa", en: "Defence" },
    plain: {
      it: "Le attività militari e civili dedicate alla difesa, inclusi gli aiuti militari all’estero e la ricerca collegata.",
      en: "Military and civil defence activities, including foreign military aid and related research.",
    },
  },
  {
    id: "spending-public-order",
    value: "GF03",
    title: { it: "Ordine pubblico e sicurezza", en: "Public order and safety" },
    plain: {
      it: "Polizia, vigili del fuoco, tribunali, carceri e le altre attività pubbliche legate alla sicurezza e alla giustizia.",
      en: "Police, fire services, courts, prisons and other public activities related to safety and justice.",
    },
  },
  {
    id: "spending-economic-affairs",
    value: "GF04",
    title: { it: "Affari economici", en: "Economic affairs" },
    plain: {
      it: "Interventi pubblici per economia, lavoro, agricoltura, energia, industria, trasporti e comunicazioni.",
      en: "Public action for the economy, labour, agriculture, energy, industry, transport and communications.",
    },
  },
  {
    id: "spending-environment",
    value: "GF05",
    title: { it: "Protezione dell’ambiente", en: "Environmental protection" },
    plain: {
      it: "Gestione dei rifiuti e delle acque reflue, contrasto all’inquinamento, tutela della biodiversità e ricerca ambientale.",
      en: "Waste and wastewater management, pollution abatement, biodiversity protection and environmental research.",
    },
  },
  {
    id: "spending-housing",
    value: "GF06",
    title: { it: "Abitazioni e territorio", en: "Housing and community amenities" },
    plain: {
      it: "Politiche abitative, sviluppo delle comunità, approvvigionamento idrico e illuminazione stradale.",
      en: "Housing policy, community development, water supply and street lighting.",
    },
  },
  {
    id: "spending-health",
    value: "GF07",
    title: { it: "Sanità", en: "Health" },
    plain: {
      it: "Prodotti medici, servizi ambulatoriali e ospedalieri, prevenzione, sanità pubblica e ricerca sanitaria.",
      en: "Medical products, outpatient and hospital services, prevention, public health and health research.",
    },
  },
  {
    id: "spending-culture",
    value: "GF08",
    title: { it: "Cultura, sport e religione", en: "Recreation, culture and religion" },
    plain: {
      it: "Servizi ricreativi e sportivi, cultura, editoria pubblica, servizi religiosi e attività collegate.",
      en: "Recreational and sporting services, culture, public broadcasting, religious services and related activities.",
    },
  },
  {
    id: "spending-education",
    value: "GF09",
    title: { it: "Istruzione", en: "Education" },
    plain: {
      it: "Scuola e università a tutti i livelli, servizi di supporto, ricerca e spese educative non attribuibili a un singolo livello.",
      en: "Schools and universities at every level, support services, research and education spending not assigned to one level.",
    },
  },
  {
    id: "spending-social-protection",
    value: "GF10",
    title: { it: "Protezione sociale", en: "Social protection" },
    plain: {
      it: "Prestazioni per malattia, disabilità, vecchiaia, superstiti, famiglie, disoccupazione, abitazione ed esclusione sociale.",
      en: "Benefits for sickness, disability, old age, survivors, families, unemployment, housing and social exclusion.",
    },
  },
  {
    id: "spending-old-age",
    value: "GF1002",
    title: { it: "Vecchiaia", en: "Old age" },
    plain: {
      it: "La funzione COFOG «vecchiaia»: pensioni di vecchiaia, anticipate per età e parziali; assegni di cura e altri pagamenti legati al pensionamento o all’età; alloggio, assistenza domiciliare, trasporti e altri servizi per persone anziane.",
      en: "The COFOG old-age function: old-age, age-related early-retirement and partial pensions; care allowances and other payments linked to retirement or old age; accommodation, home help, transport and other services for older people.",
    },
    isDetail: true,
  },
];

const datasetSpecs = [
  {
    id: "gov_10a_exp",
    statusOverrides: {
      2024: "p",
    },
    notes: [
      {
        type: "provisional",
        year: 2024,
        text: {
          it: "Eurostat indica come provvisoria la ripartizione per funzione dell’Italia relativa al 2024.",
          en: "Eurostat marks Italy’s 2024 distribution by function as provisional.",
        },
        sourceUrl:
          "https://webgate.ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm",
      },
    ],
    filters: {
      freq: ["A"],
      unit: ["PC_TOT"],
      sector: ["S13"],
      na_item: ["TE"],
      cofog99: cofogIndicators.map((indicator) => indicator.value),
    },
    indicators: cofogIndicators.map((indicator) => ({
      ...indicator,
      section: "spending",
      selector: { cofog99: indicator.value },
      unitKey: "percent_spending",
      precision: 1,
      technical: {
        it: "Classificazione COFOG 1999. Settore S13, Amministrazioni pubbliche. Voce TE, spesa pubblica totale. Unità PC_TOT, percentuale della spesa complessiva.",
        en: "COFOG 1999 classification. Sector S13, general government. Item TE, total general government expenditure. Unit PC_TOT, percentage of total expenditure.",
      },
    })),
  },
  {
    id: "gov_10a_main",
    filters: {
      freq: ["A"],
      unit: ["PC_GDP"],
      sector: ["S13"],
      na_item: ["TE", "TR", "B9", "D41PAY", "P51G", "D62_D632PAY"],
    },
    indicators: [
      {
        id: "total-public-expenditure",
        section: "spending",
        selector: { na_item: "TE" },
        title: { it: "Spesa pubblica totale", en: "Total public expenditure" },
        plain: {
          it: "Tutto ciò che le Amministrazioni pubbliche spendono in un anno, dopo avere eliminato i trasferimenti interni tra enti pubblici.",
          en: "Everything general government spends in one year, after eliminating transfers between public bodies.",
        },
        technical: {
          it: "Spesa totale consolidata delle Amministrazioni pubbliche, settore S13, espressa in percentuale del PIL.",
          en: "Consolidated total expenditure of general government, sector S13, expressed as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
        featured: true,
      },
      {
        id: "total-public-revenue",
        section: "spending",
        selector: { na_item: "TR" },
        title: { it: "Entrate pubbliche totali", en: "Total public revenue" },
        plain: {
          it: "Le risorse ricevute dalle Amministrazioni pubbliche. Comprendono imposte, contributi sociali e altre entrate.",
          en: "Resources received by general government. They include taxes, social contributions and other revenue.",
        },
        technical: {
          it: "Entrate totali consolidate delle Amministrazioni pubbliche, settore S13, in percentuale del PIL.",
          en: "Consolidated total revenue of general government, sector S13, as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
      },
      {
        id: "budget-balance",
        section: "spending",
        selector: { na_item: "B9" },
        title: { it: "Saldo di bilancio", en: "Budget balance" },
        plain: {
          it: "La differenza tra entrate e uscite. Un valore negativo indica indebitamento netto, comunemente chiamato deficit.",
          en: "The difference between revenue and expenditure. A negative value means net borrowing, commonly called a deficit.",
        },
        technical: {
          it: "Accreditamento netto o indebitamento netto B9 delle Amministrazioni pubbliche, settore S13, in percentuale del PIL.",
          en: "General government net lending or net borrowing B9, sector S13, as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
        featured: true,
      },
      {
        id: "interest-expenditure",
        section: "spending",
        selector: { na_item: "D41PAY" },
        title: { it: "Interessi sul debito", en: "Interest expenditure" },
        plain: {
          it: "Gli interessi pagati dalle Amministrazioni pubbliche sui propri debiti. Non comprende il rimborso del capitale.",
          en: "Interest paid by general government on its debt. It does not include repayment of principal.",
        },
        technical: {
          it: "Interessi passivi D41PAY del settore S13 in percentuale del PIL.",
          en: "Interest expenditure D41PAY of sector S13 as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
      },
      {
        id: "public-investment",
        section: "spending",
        selector: { na_item: "P51G" },
        title: { it: "Investimenti pubblici", en: "Public investment" },
        plain: {
          it: "Acquisti e realizzazioni di beni durevoli usati dalla pubblica amministrazione, come infrastrutture, edifici e attrezzature.",
          en: "Purchases and creation of durable assets used by government, such as infrastructure, buildings and equipment.",
        },
        technical: {
          it: "Investimenti fissi lordi P51G delle Amministrazioni pubbliche in percentuale del PIL.",
          en: "General government gross fixed capital formation P51G as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
      },
      {
        id: "social-benefits",
        section: "spending",
        selector: { na_item: "D62_D632PAY" },
        title: { it: "Prestazioni sociali", en: "Social benefits" },
        plain: {
          it: "Trasferimenti in denaro e prestazioni acquistate per le persone, come pensioni, indennità e alcune prestazioni sanitarie o assistenziali.",
          en: "Cash transfers and services purchased for people, such as pensions, allowances and some health or care benefits.",
        },
        technical: {
          it: "Somma D62 e D632. Comprende prestazioni sociali diverse dai trasferimenti sociali in natura e trasferimenti in natura acquistati sul mercato.",
          en: "Sum of D62 and D632. It includes social benefits other than social transfers in kind and purchased market production.",
        },
        unitKey: "percent_gdp",
        precision: 1,
      },
    ],
  },
  {
    id: "gov_10dd_edpt1",
    filters: {
      freq: ["A"],
      unit: ["PC_GDP"],
      sector: ["S13"],
      na_item: ["GD"],
    },
    indicators: [
      {
        id: "public-debt",
        section: "spending",
        selector: { na_item: "GD" },
        title: { it: "Debito pubblico", en: "Public debt" },
        plain: {
          it: "Il debito lordo consolidato delle Amministrazioni pubbliche. È misurato secondo le regole europee del debito di Maastricht.",
          en: "The consolidated gross debt of general government. It is measured under the European Maastricht debt rules.",
        },
        technical: {
          it: "Debito lordo consolidato GD del settore S13 al valore nominale e a fine anno, espresso in percentuale del PIL.",
          en: "Consolidated gross debt GD of sector S13 at nominal value and at year end, expressed as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
        featured: true,
      },
    ],
  },
  {
    id: "demo_pjanind",
    filters: {
      freq: ["A"],
      indic_de: ["MEDAGEPOP", "PC_Y65_MAX", "OLDDEP1"],
    },
    indicators: [
      {
        id: "median-age",
        section: "people",
        selector: { indic_de: "MEDAGEPOP" },
        title: { it: "Età mediana", en: "Median age" },
        plain: {
          it: "L’età che divide la popolazione in due gruppi uguali. Metà delle persone è più giovane e metà è più anziana.",
          en: "The age that divides the population into two equal groups. Half of people are younger and half are older.",
        },
        technical: {
          it: "Mediana della distribuzione per età della popolazione residente al primo gennaio.",
          en: "Median of the age distribution of the resident population on 1 January.",
        },
        unitKey: "years",
        precision: 1,
        featured: true,
      },
      {
        id: "population-65-plus",
        section: "people",
        selector: { indic_de: "PC_Y65_MAX" },
        title: { it: "Popolazione di 65 anni o più", en: "Population aged 65 or over" },
        plain: {
          it: "La quota di residenti che ha almeno 65 anni.",
          en: "The share of residents who are at least 65 years old.",
        },
        technical: {
          it: "Popolazione residente di 65 anni o più divisa per la popolazione residente totale al primo gennaio.",
          en: "Resident population aged 65 or over divided by the total resident population on 1 January.",
        },
        unitKey: "percent",
        precision: 1,
      },
      {
        id: "old-age-dependency",
        section: "people",
        selector: { indic_de: "OLDDEP1" },
        title: { it: "Indice di dipendenza degli anziani", en: "Old age dependency ratio" },
        plain: {
          it: "Quante persone di 65 anni o più ci sono ogni 100 persone tra 15 e 64 anni. Non misura quante persone lavorano davvero.",
          en: "How many people aged 65 or over there are for every 100 people aged 15 to 64. It does not measure how many people actually work.",
        },
        technical: {
          it: "Rapporto tra popolazione di 65 anni o più e popolazione tra 15 e 64 anni, moltiplicato per 100.",
          en: "Population aged 65 or over divided by population aged 15 to 64, multiplied by 100.",
        },
        unitKey: "per_100",
        precision: 1,
      },
    ],
  },
  {
    id: "demo_find",
    filters: { freq: ["A"], indic_de: ["TOTFERRT"] },
    indicators: [
      {
        id: "fertility-rate",
        section: "people",
        selector: { indic_de: "TOTFERRT" },
        title: { it: "Fecondità totale", en: "Total fertility rate" },
        plain: {
          it: "Il numero medio di figli che avrebbe una donna se sperimentasse per tutta la vita i tassi di fecondità osservati in quell’anno.",
          en: "The average number of children a woman would have if she experienced that year’s fertility rates throughout her life.",
        },
        technical: {
          it: "Somma dei tassi di fecondità specifici per età osservati nell’anno. È un indicatore sintetico, non il numero reale di figli per ogni donna.",
          en: "Sum of age specific fertility rates observed in the year. It is a synthetic measure, not the actual number of children per woman.",
        },
        unitKey: "children_per_woman",
        precision: 2,
      },
    ],
  },
  {
    id: "demo_mlexpec",
    filters: { freq: ["A"], unit: ["YR"], sex: ["T"], age: ["Y_LT1"] },
    indicators: [
      {
        id: "life-expectancy",
        section: "people",
        selector: {},
        title: { it: "Speranza di vita alla nascita", en: "Life expectancy at birth" },
        plain: {
          it: "Gli anni che vivrebbe in media un neonato se i livelli di mortalità dell’anno restassero invariati durante tutta la sua vita.",
          en: "The years a newborn would live on average if that year’s mortality rates remained unchanged throughout life.",
        },
        technical: {
          it: "Indicatore di tavola di mortalità calcolato per il totale della popolazione alla nascita.",
          en: "Life table indicator calculated for the total population at birth.",
        },
        unitKey: "years",
        precision: 1,
      },
    ],
  },
  {
    id: "lfsi_emp_a",
    filters: {
      freq: ["A"],
      indic_em: ["EMP_LFS"],
      sex: ["T"],
      age: ["Y20-64"],
      unit: ["PC_POP"],
    },
    indicators: [
      {
        id: "employment-rate",
        section: "economy",
        selector: {},
        title: {
          it: "Tasso di occupazione, 20–64 anni",
          en: "Employment rate, ages 20–64",
        },
        plain: {
          it: "La quota delle persone tra 20 e 64 anni che ha un lavoro.",
          en: "The share of people aged 20 to 64 who have a job.",
        },
        technical: {
          it: "Occupati residenti tra 20 e 64 anni divisi per la popolazione della stessa età. Fonte EU Labour Force Survey.",
          en: "Employed residents aged 20 to 64 divided by the population of the same age. Source EU Labour Force Survey.",
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
      },
    ],
  },
  {
    id: "une_rt_a",
    filters: {
      freq: ["A"],
      age: ["Y15-74", "Y15-24"],
      unit: ["PC_ACT"],
      sex: ["T"],
    },
    indicators: [
      {
        id: "unemployment-rate",
        section: "economy",
        selector: { age: "Y15-74" },
        title: { it: "Tasso di disoccupazione", en: "Unemployment rate" },
        plain: {
          it: "La quota delle persone attive che non ha un lavoro, lo ha cercato nelle quattro settimane precedenti ed è disponibile a iniziare entro due settimane.",
          en: "The share of the labour force without a job who sought work during the previous four weeks and can start within two weeks.",
        },
        technical: {
          it: "Disoccupati tra 15 e 74 anni secondo la definizione ILO divisi per la forza lavoro della stessa età. Chi non cerca attivamente lavoro non è contato tra i disoccupati.",
          en: "Unemployed people aged 15 to 74 under the ILO definition divided by the labour force of the same age. People not actively seeking work are not counted as unemployed.",
        },
        unitKey: "percent",
        precision: 1,
      },
      {
        id: "youth-unemployment",
        section: "economy",
        selector: { age: "Y15-24" },
        title: { it: "Disoccupazione giovanile", en: "Youth unemployment" },
        plain: {
          it: "La quota dei giovani attivi tra 15 e 24 anni che non ha un lavoro, lo ha cercato nelle quattro settimane precedenti ed è disponibile a iniziare entro due settimane.",
          en: "The share of active young people aged 15 to 24 without a job who sought work during the previous four weeks and can start within two weeks.",
        },
        technical: {
          it: "Disoccupati tra 15 e 24 anni divisi per la forza lavoro della stessa età. Non è la percentuale di tutti i giovani.",
          en: "Unemployed people aged 15 to 24 divided by the labour force of the same age. It is not a percentage of all young people.",
        },
        unitKey: "percent",
        precision: 1,
      },
    ],
  },
  {
    id: "nama_10_pc",
    filters: {
      freq: ["A"],
      unit: ["PC_EU27_2020_HAB_MPPS_CP", "CLV_PCH_PRE_HAB"],
      na_item: ["B1GQ"],
    },
    indicators: [
      {
        id: "gdp-per-capita-pps",
        section: "economy",
        selector: { unit: "PC_EU27_2020_HAB_MPPS_CP" },
        title: { it: "PIL pro capite a parità di potere d’acquisto", en: "GDP per capita in purchasing power standards" },
        plain: {
          it: "La produzione economica per persona, corretta per le differenze di prezzo tra Paesi. Il valore UE è posto uguale a 100.",
          en: "Economic output per person, adjusted for price differences between countries. The EU value is set to 100.",
        },
        technical: {
          it: "PIL B1GQ pro capite in standard di potere d’acquisto, espresso come percentuale del totale UE27 pro capite.",
          en: "GDP B1GQ per capita in purchasing power standards, expressed as a percentage of the EU27 per capita total.",
        },
        unitKey: "eu_index",
        precision: 0,
        featured: true,
      },
      {
        id: "real-gdp-growth-per-capita",
        section: "economy",
        selector: { unit: "CLV_PCH_PRE_HAB" },
        title: { it: "Crescita reale del PIL pro capite", en: "Real GDP growth per capita" },
        plain: {
          it: "Quanto cambia in un anno la produzione economica per persona, dopo avere rimosso l’effetto dei prezzi.",
          en: "How much economic output per person changes in one year after removing the effect of prices.",
        },
        technical: {
          it: "Variazione percentuale annua del PIL B1GQ pro capite a volumi concatenati.",
          en: "Annual percentage change in GDP B1GQ per capita in chain linked volumes.",
        },
        unitKey: "percent_change",
        precision: 1,
      },
    ],
  },
  {
    id: "tec00118",
    filters: { freq: ["A"], unit: ["RCH_A_AVG"], coicop18: ["TOTAL"] },
    indicators: [
      {
        id: "inflation",
        section: "economy",
        selector: {},
        title: { it: "Inflazione", en: "Inflation" },
        plain: {
          it: "Quanto sono aumentati o diminuiti in media i prezzi pagati dalle famiglie rispetto all’anno precedente.",
          en: "How much prices paid by households increased or decreased on average compared with the previous year.",
        },
        technical: {
          it: "Tasso medio annuo di variazione dell’indice armonizzato dei prezzi al consumo, totale COICOP.",
          en: "Annual average rate of change of the harmonised index of consumer prices, total COICOP.",
        },
        unitKey: "percent_change",
        precision: 1,
      },
    ],
  },
  {
    id: "ilc_peps01n",
    filters: { freq: ["A"], unit: ["PC"], age: ["TOTAL"], sex: ["T"] },
    indicators: [
      {
        id: "poverty-or-exclusion",
        section: "welfare",
        selector: {},
        title: { it: "Rischio di povertà o esclusione sociale", en: "Risk of poverty or social exclusion" },
        plain: {
          it: "La quota di persone che vive almeno una tra tre condizioni: reddito basso, grave deprivazione materiale e sociale, oppure intensità di lavoro molto bassa.",
          en: "The share of people living in at least one of three conditions: low income, severe material and social deprivation, or very low work intensity.",
        },
        technical: {
          it: "Indicatore AROPE secondo la definizione Europa 2030, calcolato con EU-SILC sulle persone che vivono in famiglie private. Per la componente reddituale, l’anno di riferimento del reddito è normalmente quello precedente all’indagine.",
          en: "AROPE indicator under the Europe 2030 definition, calculated from EU-SILC for people living in private households. For the income component, the income reference year is normally the year before the survey.",
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
      },
    ],
  },
  {
    id: "spr_exp_pens",
    filters: {
      freq: ["A"],
      spdepb: ["TOTAL"],
      spdepm: ["TOTAL"],
      unit: ["PC_GDP"],
    },
    indicators: [
      {
        id: "pension-expenditure",
        section: "welfare",
        selector: {},
        title: { it: "Spesa per pensioni", en: "Pension expenditure" },
        plain: {
          it: "La spesa per pensioni di vecchiaia, anticipate, di invalidità e ai superstiti, insieme alle altre tipologie incluse nella statistica europea.",
          en: "Spending on old age, anticipated, disability and survivors’ pensions, together with the other types included in European statistics.",
        },
        technical: {
          it: "Spesa pensionistica totale del sistema ESSPROS, con e senza prova dei mezzi, in percentuale del PIL.",
          en: "Total ESSPROS pension expenditure, means tested and non means tested, as a percentage of GDP.",
        },
        unitKey: "percent_gdp",
        precision: 1,
      },
    ],
  },
  {
    id: "hlth_hlye",
    filters: { freq: ["A"], unit: ["YR"], sex: ["T"], hlth_hle: ["HLY_Y0"] },
    indicators: [
      {
        id: "healthy-life-years",
        section: "welfare",
        selector: {},
        title: { it: "Anni di vita in buona salute", en: "Healthy life years" },
        plain: {
          it: "Gli anni che una persona può aspettarsi di vivere senza limitazioni di lunga durata nelle attività abituali, secondo quanto dichiarato nell’indagine.",
          en: "The years a person can expect to live without long-standing limitations in usual activities, based on survey responses.",
        },
        technical: {
          it: "Indicatore HLY alla nascita per il totale della popolazione. Combina tavole di mortalità e la domanda GALI di EU-SILC sulle limitazioni durate almeno sei mesi. Le persone in istituzioni non rientrano normalmente nel campione EU-SILC.",
          en: "Healthy life years at birth for the total population. It combines life tables with the EU-SILC GALI question on limitations lasting at least six months. People living in institutions are normally outside the EU-SILC sample.",
        },
        unitKey: "years",
        precision: 1,
      },
    ],
  },
  {
    id: "edat_lfse_03",
    filters: {
      freq: ["A"],
      sex: ["T"],
      age: ["Y25-34"],
      unit: ["PC"],
      isced11: ["ED5-8"],
    },
    indicators: [
      {
        id: "tertiary-education",
        section: "education",
        selector: {},
        title: { it: "Giovani con istruzione terziaria", en: "Young adults with tertiary education" },
        plain: {
          it: "La quota delle persone tra 25 e 34 anni che ha completato un percorso universitario o equivalente.",
          en: "The share of people aged 25 to 34 who completed university or an equivalent tertiary programme.",
        },
        technical: {
          it: "Popolazione tra 25 e 34 anni con livello ISCED 5 fino a 8, in percentuale della popolazione della stessa età.",
          en: "Population aged 25 to 34 with ISCED levels 5 to 8 as a percentage of the population of the same age.",
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
      },
    ],
  },
  {
    id: "edat_lfse_14",
    filters: {
      freq: ["A"],
      sex: ["T"],
      wstatus: ["POP"],
      age: ["Y18-24"],
      unit: ["PC"],
    },
    indicators: [
      {
        id: "early-school-leavers",
        section: "education",
        selector: {},
        title: { it: "Abbandono precoce dell’istruzione", en: "Early leaving from education and training" },
        plain: {
          it: "La quota dei giovani tra 18 e 24 anni con al massimo la scuola media che non studia e non segue formazione.",
          en: "The share of young people aged 18 to 24 with at most lower secondary education who are not in education or training.",
        },
        technical: {
          it: "Persone tra 18 e 24 anni con al massimo un titolo ISCED 0–2 che non hanno partecipato a istruzione o formazione nelle quattro settimane precedenti l’indagine.",
          en: "People aged 18 to 24 with at most ISCED levels 0–2 who did not participate in education or training during the four weeks before the survey.",
        },
        unitKey: "percent",
        precision: 1,
      },
    ],
  },
  {
    id: "trng_lfse_01",
    filters: { freq: ["A"], unit: ["PC"], sex: ["T"], age: ["Y25-64"] },
    indicators: [
      {
        id: "adult-learning",
        section: "education",
        selector: {},
        title: { it: "Formazione degli adulti", en: "Adult learning" },
        plain: {
          it: "La quota delle persone tra 25 e 64 anni che ha partecipato a istruzione o formazione nelle quattro settimane precedenti.",
          en: "The share of people aged 25 to 64 who took part in education or training during the previous four weeks.",
        },
        technical: {
          it: "Partecipazione a istruzione formale o non formale nelle ultime quattro settimane, fonte EU Labour Force Survey.",
          en: "Participation in formal or non formal education during the previous four weeks, source EU Labour Force Survey.",
        },
        unitKey: "percent",
        precision: 1,
      },
    ],
  },
  {
    id: "edat_lfse_20",
    filters: {
      freq: ["A"],
      sex: ["T"],
      age: ["Y15-29"],
      training: ["NO_FE_NO_NFE"],
      wstatus: ["NEMP"],
      unit: ["PC"],
    },
    indicators: [
      {
        id: "neet-rate",
        section: "education",
        selector: {},
        title: { it: "Giovani che non studiano e non lavorano", en: "Young people neither working nor studying" },
        plain: {
          it: "La quota delle persone tra 15 e 29 anni che non lavora e non segue istruzione o formazione.",
          en: "The share of people aged 15 to 29 who are not employed and are not in education or training.",
        },
        technical: {
          it: "Tasso NEET tra 15 e 29 anni. Comprende disoccupati e persone fuori dalla forza lavoro che non partecipano a istruzione formale o non formale.",
          en: "NEET rate among people aged 15 to 29. It includes unemployed and inactive people not participating in formal or non formal education.",
        },
        unitKey: "percent",
        precision: 1,
      },
    ],
  },
  {
    id: "nrg_ind_ren",
    filters: { freq: ["A"], nrg_bal: ["REN"], unit: ["PC"] },
    indicators: [
      {
        id: "renewable-energy",
        section: "environment",
        selector: {},
        title: { it: "Energia da fonti rinnovabili", en: "Energy from renewable sources" },
        plain: {
          it: "La quota dei consumi finali lordi di energia coperta da fonti rinnovabili.",
          en: "The share of gross final energy consumption supplied by renewable sources.",
        },
        technical: {
          it: "Quota complessiva di energia rinnovabile calcolata secondo la metodologia della direttiva europea sulle rinnovabili.",
          en: "Overall renewable energy share calculated under the methodology of the European renewable energy directive.",
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
      },
    ],
  },
  {
    id: "cei_wm011",
    filters: { freq: ["A"], wst_oper: ["RCY"], unit: ["PC"] },
    indicators: [
      {
        id: "municipal-waste-recycling",
        section: "environment",
        selector: {},
        title: { it: "Riciclo dei rifiuti urbani", en: "Municipal waste recycling" },
        plain: {
          it: "La quota dei rifiuti prodotti da famiglie e attività simili che viene riciclata.",
          en: "The share of waste produced by households and similar activities that is recycled.",
        },
        technical: {
          it: "Rifiuti urbani riciclati e preparati per il riutilizzo divisi per i rifiuti urbani generati, secondo il metodo Eurostat vigente per l’anno osservato.",
          en: "Municipal waste recycled and prepared for reuse divided by municipal waste generated, under the Eurostat method applying to the observed year.",
        },
        unitKey: "percent",
        precision: 1,
      },
    ],
  },
  {
    id: "sdg_13_10",
    originalInstitution: "European Environment Agency (EEA), based on UNFCCC reporting",
    filters: {
      freq: ["A"],
      src_crf: ["TOTX4_MEMO"],
      unit: ["I90"],
    },
    indicators: [
      {
        id: "greenhouse-gas-emissions",
        section: "environment",
        selector: {},
        title: { it: "Emissioni di gas serra rispetto al 1990", en: "Greenhouse gas emissions compared with 1990" },
        plain: {
          it: "Come sono cambiate le emissioni prodotte nel territorio rispetto al 1990. Il valore del 1990 è posto uguale a 100.",
          en: "How emissions produced within the territory have changed since 1990. The 1990 value is set to 100.",
        },
        technical: {
          it: "Indice delle emissioni territoriali secondo l’inventario UNFCCC, escluse le attività di uso del suolo, cambiamento di uso del suolo e foreste e, per i valori nazionali, l’aviazione e la navigazione internazionali. Base 1990 uguale a 100.",
          en: "Index of territorial emissions under the UNFCCC inventory, excluding land use, land-use change and forestry and, for national values, international aviation and navigation. Base 1990 equals 100.",
        },
        unitKey: "index_1990",
        precision: 1,
      },
    ],
  },
];

const indicatorNotes = {
  "life-expectancy": [
    {
      type: "method_change",
      year: 2024,
      text: {
        it: "Dal 2024 Eurostat estende il calcolo delle tavole di mortalità dalla classe finale 85+ alla classe 95+. Il confronto con gli anni precedenti richiede cautela.",
        en: "From 2024 Eurostat extends life-table calculations from the final 85+ age group to 95+. Comparisons with earlier years require caution.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260313-3",
    },
  ],
  "healthy-life-years": [
    {
      type: "comparability",
      text: {
        it: "La misura usa una domanda auto-riferita sulle limitazioni nelle attività. Differenze nel modo in cui la domanda è somministrata possono ridurre la comparabilità tra Paesi e nel tempo.",
        en: "The measure uses a self-reported question on activity limitations. Differences in how the question is administered can reduce comparability across countries and over time.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/cache/metadata/en/hlth_hlye_esms.htm",
    },
    {
      type: "data_gap",
      year: 2010,
      text: {
        it: "Per l’Italia il 2010 non è disponibile nella selezione ufficiale. Il sito passa dal 2009 al 2011 senza interpolare il valore mancante.",
        en: "For Italy, 2010 is not available in the official selection. The site moves from 2009 to 2011 without interpolating the missing value.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/databrowser/view/hlth_hlye/default/table?lang=en",
    },
  ],
  "renewable-energy": [
    {
      type: "method_change",
      year: 2021,
      text: {
        it: "La serie cambia base normativa tra 2020 e 2021: fino al 2020 segue RED I, dal 2021 RED II. Il grafico segnala questa discontinuità.",
        en: "The legal basis changes between 2020 and 2021: data follow RED I through 2020 and RED II from 2021. The chart marks this discontinuity.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/cache/metadata/en/nrg_ind_share_esmsip2.htm",
    },
  ],
  "municipal-waste-recycling": [
    {
      type: "scope",
      text: {
        it: "Le regole più recenti includono la preparazione per il riutilizzo. Cambi di metodo e regimi transitori possono incidere sui confronti tra anni e Paesi.",
        en: "The newer rules include preparing for reuse. Method changes and transitional regimes can affect comparisons across years and countries.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/cache/metadata/en/cei_wm011_esmsip2.htm",
    },
  ],
  "poverty-or-exclusion": [
    {
      type: "reference_period",
      text: {
        it: "L’anno mostrato è quello dell’indagine EU-SILC. Per la componente sul reddito, il periodo di riferimento è normalmente l’anno precedente.",
        en: "The displayed year is the EU-SILC survey year. For the income component, the reference period is normally the previous year.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/cache/metadata/en/ilc_sieusilc.htm",
    },
  ],
  "greenhouse-gas-emissions": [
    {
      type: "scope",
      text: {
        it: "Eurostat diffonde il dato; la fonte originaria è EEA su inventari UNFCCC. Per questa selezione non esiste un aggregato UE con lo stesso perimetro, quindi il sito non ne costruisce uno.",
        en: "Eurostat disseminates the data; the original source is the EEA based on UNFCCC inventories. No EU aggregate with the same scope exists for this selection, so the site does not construct one.",
      },
      sourceUrl:
        "https://ec.europa.eu/eurostat/cache/metadata/en/sdg_13_10_esmsip2.htm",
    },
  ],
};

const definitionSourceOverrides = {
  "spending-old-age":
    "https://unstats.un.org/unsd/classifications/Econ/Structure/Detail/EN/4/10_2_0",
  "pension-expenditure":
    "https://ec.europa.eu/eurostat/web/social-protection/information-data",
};

function buildApiUrl(specification, selector = {}) {
  const url = new URL(
    `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${specification.id}`,
  );
  url.searchParams.set("lang", "en");
  url.searchParams.set("sinceTimePeriod", "2000");

  const dimensions = new Set([
    ...Object.keys(specification.filters),
    ...Object.keys(selector),
  ]);

  for (const dimension of dimensions) {
    const values =
      dimension in selector
        ? [selector[dimension]]
        : specification.filters[dimension];

    for (const value of values) {
      url.searchParams.append(dimension, value);
    }
  }

  for (const geography of allGeographies) {
    url.searchParams.append("geo", geography);
  }

  return url;
}

function getPositionCodes(dimension) {
  return Object.entries(dimension.category.index)
    .sort((left, right) => left[1] - right[1])
    .map(([code]) => code);
}

function flattenJsonStat(dataset) {
  const positionCodes = Object.fromEntries(
    dataset.id.map((dimensionId) => [
      dimensionId,
      getPositionCodes(dataset.dimension[dimensionId]),
    ]),
  );

  return Object.entries(dataset.value).map(([flatIndex, value]) => {
    let remainder = Number(flatIndex);
    const coordinates = new Array(dataset.id.length);

    for (let index = dataset.id.length - 1; index >= 0; index -= 1) {
      coordinates[index] = remainder % dataset.size[index];
      remainder = Math.floor(remainder / dataset.size[index]);
    }

    const record = {
      value,
      status: dataset.status?.[flatIndex] ?? null,
    };

    dataset.id.forEach((dimensionId, index) => {
      record[dimensionId] = positionCodes[dimensionId][coordinates[index]];
    });

    return record;
  });
}

function matchesSelector(record, selector) {
  return Object.entries(selector).every(
    ([dimension, expectedValue]) => record[dimension] === expectedValue,
  );
}

function isEstimateOrProvisional(status) {
  return typeof status === "string" && /[epf]/.test(status);
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return normalizeNumber((sorted[middle - 1] + sorted[middle]) / 2);
}

function normalizeNumber(value) {
  return Number(value.toFixed(10));
}

function mergeStatus(sourceStatus, overrideStatus) {
  const codes = `${sourceStatus ?? ""}${overrideStatus ?? ""}`
    .replaceAll(":", "")
    .replaceAll(" ", "");
  return codes ? [...new Set(codes)].join("") : null;
}

function buildSeries(records, selector, statusOverrides = {}) {
  const selectedRecords = records.filter((record) =>
    matchesSelector(record, selector),
  );
  const byYear = new Map();

  for (const record of selectedRecords) {
    const year = Number(record.time);
    if (!Number.isInteger(year) || year < 2000) continue;

    if (!byYear.has(year)) byYear.set(year, new Map());
    byYear.get(year).set(record.geo, record);
  }

  return [...byYear.entries()]
    .sort(([leftYear], [rightYear]) => leftYear - rightYear)
    .flatMap(([year, geographyRecords]) => {
      const italyRecord = geographyRecords.get("IT");
      const euRecord = geographyRecords.get("EU27_2020");
      const countries = euCountries.flatMap((geography) => {
        const record = geographyRecords.get(geography);
        if (!Number.isFinite(record?.value)) return [];
        return [
          {
            geo: geography,
            value: record.value,
            status: record.status,
          },
        ];
      });
      const countryValues = countries.map((country) => country.value);

      if (!Number.isFinite(italyRecord?.value) || countryValues.length < 24) {
        return [];
      }

      const hasOfficialAggregate = Number.isFinite(euRecord?.value);
      const effectiveItalyStatus = mergeStatus(
        italyRecord.status,
        statusOverrides[year],
      );
      const effectiveCountries = countries.map((country) =>
        country.geo === "IT"
          ? { ...country, status: effectiveItalyStatus }
          : country,
      );

      return [
        {
          year,
          italy: italyRecord.value,
          eu: hasOfficialAggregate ? euRecord.value : null,
          median: median(countryValues),
          coverage: countryValues.length,
          euMethod: hasOfficialAggregate
            ? "official_aggregate"
            : "unavailable",
          status: effectiveItalyStatus,
          sourceStatus: italyRecord.status,
          euStatus: hasOfficialAggregate ? euRecord.status : null,
          countryStatuses: effectiveCountries
            .filter((country) => country.status)
            .map(({ geo, status }) => ({ geo, status })),
          missingCountries: euCountries.filter(
            (geography) =>
              !countries.some((country) => country.geo === geography),
          ),
          countries: effectiveCountries,
        },
      ];
    });
}

function withoutCountryValues(point) {
  const publicPoint = { ...point };
  delete publicPoint.countries;
  return publicPoint;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function csvNumber(value) {
  return Number.isFinite(value) ? String(normalizeNumber(value)) : "";
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

await Promise.all([
  mkdir(rawDirectory, { recursive: true }),
  mkdir(processedDirectory, { recursive: true }),
  mkdir(publicDataDirectory, { recursive: true }),
]);

const offline = process.argv.includes("--offline");
const previousManifest = offline
  ? JSON.parse(
      await readFile(join(projectRoot, "data", "manifest.json"), "utf8"),
    )
  : null;

const manifest = {
  generatedAt: previousManifest?.generatedAt ?? new Date().toISOString(),
  policy: {
    it: "Ogni snapshot contiene solo la selezione usata dal sito. I valori ufficiali non vengono modificati; la serializzazione normalizza soltanto gli spazi finali. Le mediane sono calcolate sui Paesi UE disponibili e pubblicate con almeno 24 valori su 27. Se non esiste un aggregato UE ufficiale con lo stesso perimetro, il sito non ne costruisce uno. Testi accessibili e traduzioni sono parafrasi del progetto, indicate come tali.",
    en: "Each snapshot contains only the selection used by the site. Official values are not changed; serialisation only normalises trailing whitespace. Medians are calculated across available EU countries and published with at least 24 values out of 27. When no official EU aggregate with the same scope exists, the site does not construct one. Accessible copy and translations are project paraphrases and are identified as such.",
  },
  license: {
    name: "Eurostat reuse policy",
    url: "https://ec.europa.eu/eurostat/help/copyright-notice",
  },
  licenses: [
    {
      institution: "Eurostat",
      name: "Eurostat reuse policy",
      url: "https://ec.europa.eu/eurostat/help/copyright-notice",
    },
    {
      institution: "European Environment Agency",
      name: "EEA legal notice and reuse terms",
      url: "https://www.eea.europa.eu/en/legal-notice",
    },
  ],
  disclaimer: {
    it: "Eurostat e le altre istituzioni citate non sono responsabili delle traduzioni, delle sintesi accessibili, delle mediane o di altre elaborazioni realizzate da Explainable Italy.",
    en: "Eurostat and the other cited institutions are not responsible for translations, accessible summaries, medians or other processing performed by Explainable Italy.",
  },
  datasets: [],
};

const indicators = [];

for (const specification of datasetSpecs) {
  const apiUrl = buildApiUrl(specification);
  const rawFileName = `${specification.id}.json`;
  const rawPath = join(rawDirectory, rawFileName);
  let rawText;

  if (offline) {
    rawText = await readFile(rawPath, "utf8");
  } else {
    const response = await fetch(apiUrl, {
      headers: { "user-agent": "Explainable-Italy/0.1 data update" },
    });

    if (!response.ok) {
      throw new Error(
        `Eurostat request failed for ${specification.id}: ${response.status} ${response.statusText}`,
      );
    }

    rawText = await response.text();
  }

  const normalizedRawText = `${rawText.trim()}\n`;
  const dataset = JSON.parse(normalizedRawText);
  const checksum = createHash("sha256")
    .update(normalizedRawText)
    .digest("hex");

  await writeFile(rawPath, normalizedRawText);

  const metadataUrl =
    dataset.extension?.annotation?.find(
      (annotation) => annotation.type === "ESMS_HTML",
    )?.href ?? null;

  const source = {
    institution: "Eurostat",
    originalInstitution:
      specification.originalInstitution ?? "Eurostat",
    datasetCode: specification.id,
    datasetLabel: dataset.label,
    dataBrowserUrl: `https://ec.europa.eu/eurostat/databrowser/view/${specification.id}/default/table?lang=en`,
    apiUrl: apiUrl.toString(),
    metadataUrl,
    doi: `https://doi.org/10.2908/${specification.id.toUpperCase()}`,
    sourceUpdatedAt: dataset.updated,
    accessedAt: manifest.generatedAt,
  };

  manifest.datasets.push({
    ...source,
    localPath: `data/raw/eurostat/${rawFileName}`,
    sha256: checksum,
    bytes: Buffer.byteLength(normalizedRawText),
  });

  const records = flattenJsonStat(dataset);

  for (const indicatorDefinition of specification.indicators) {
    const seriesWithCountries = buildSeries(
      records,
      indicatorDefinition.selector,
      {
        ...(specification.statusOverrides ?? {}),
        ...(indicatorDefinition.statusOverrides ?? {}),
      },
    );
    const indicatorSource = {
      ...source,
      apiUrl: buildApiUrl(
        specification,
        indicatorDefinition.selector,
      ).toString(),
    };

    if (seriesWithCountries.length === 0) {
      throw new Error(
        `No complete EU comparison series for ${indicatorDefinition.id}`,
      );
    }

    const latestAvailable = seriesWithCountries.at(-1);
    const latestWithCountries =
      [...seriesWithCountries]
        .reverse()
        .find((point) => !isEstimateOrProvisional(point.status)) ??
      latestAvailable;
    const newerEstimateWithCountries =
      latestAvailable.year > latestWithCountries.year ? latestAvailable : null;
    const series = seriesWithCountries.map(withoutCountryValues);
    const latest = { ...latestWithCountries };
    const newerEstimate = newerEstimateWithCountries
      ? { ...newerEstimateWithCountries }
      : null;

    indicators.push({
      id: indicatorDefinition.id,
      section: indicatorDefinition.section,
      title: indicatorDefinition.title,
      plain: indicatorDefinition.plain,
      technical: indicatorDefinition.technical,
      unitKey: indicatorDefinition.unitKey,
      precision: indicatorDefinition.precision,
      featured: indicatorDefinition.featured ?? false,
      isDetail: indicatorDefinition.isDetail ?? false,
      definitionSourceUrl:
        definitionSourceOverrides[indicatorDefinition.id] ?? metadataUrl,
      definitionKind: "project_paraphrase",
      notes: [
        ...(specification.notes ?? []),
        ...(indicatorNotes[indicatorDefinition.id] ?? []),
        ...(indicatorDefinition.notes ?? []),
      ],
      startYear: series[0].year,
      latest,
      newerEstimate,
      series,
      source: indicatorSource,
    });
  }
}

const dashboardData = {
  generatedAt: manifest.generatedAt,
  methodologyVersion: "1.1.0",
  comparison: {
    it: "Quando disponibile, il valore UE è l’aggregato ufficiale Eurostat. Se non esiste un aggregato con lo stesso perimetro, non ne costruiamo uno. La mediana è calcolata ordinando i valori dei Paesi disponibili e prendendo quello centrale; con un numero pari di Paesi è la media dei due valori centrali. Vicino al confronto sono indicati copertura, valori mancanti e contrassegni di qualità.",
    en: "When available, the EU value is Eurostat’s official aggregate. If no aggregate with the same scope exists, we do not construct one. The median is calculated by ordering the available country values and taking the middle one; with an even number of countries it is the mean of the two middle values. Coverage, missing values and quality flags are shown next to the comparison.",
  },
  sections: [
    {
      id: "spending",
      title: { it: "Conti pubblici", en: "Public finances" },
      description: {
        it: "Quanto incassa e spende la pubblica amministrazione, dove vanno le risorse e quale peso hanno deficit e debito.",
        en: "What general government receives and spends, where resources go and how much deficit and debt weigh.",
      },
    },
    {
      id: "people",
      title: { it: "Popolazione", en: "Population" },
      description: {
        it: "Età, fecondità e speranza di vita per capire come cambia la struttura del Paese.",
        en: "Age, fertility and life expectancy to understand how the country’s structure is changing.",
      },
    },
    {
      id: "economy",
      title: { it: "Lavoro ed economia", en: "Work and economy" },
      description: {
        it: "Occupazione, disoccupazione, produzione per persona, crescita e prezzi.",
        en: "Employment, unemployment, output per person, growth and prices.",
      },
    },
    {
      id: "welfare",
      title: { it: "Welfare e salute", en: "Welfare and health" },
      description: {
        it: "Pensioni, rischio di povertà e anni vissuti senza limitazioni nelle attività quotidiane.",
        en: "Pensions, risk of poverty and years lived without limitations in everyday activities.",
      },
    },
    {
      id: "education",
      title: { it: "Istruzione", en: "Education" },
      description: {
        it: "Titoli di studio, abbandono, formazione continua e giovani fuori da studio e lavoro.",
        en: "Qualifications, early leaving, continued learning and young people outside work and education.",
      },
    },
    {
      id: "environment",
      title: { it: "Ambiente ed energia", en: "Environment and energy" },
      description: {
        it: "Rinnovabili, rifiuti ed emissioni che alterano il clima.",
        en: "Renewables, waste and emissions that affect the climate.",
      },
    },
  ],
  indicators,
};

await writeJson(join(processedDirectory, "dashboard.json"), dashboardData);
await writeJson(join(projectRoot, "data", "manifest.json"), manifest);
await writeJson(join(publicDataDirectory, "dashboard.json"), dashboardData);
await writeJson(join(publicDataDirectory, "manifest.json"), manifest);

const csvRows = [
  [
    "indicator_id",
    "section",
    "year",
    "italy",
    "eu27_official_value",
    "eu27_country_median",
    "countries_in_median",
    "eu_method",
    "italy_status",
    "eu_status",
    "flagged_countries",
    "missing_countries",
    "unit",
    "dataset",
  ],
  ...indicators.flatMap((indicator) =>
    indicator.series.map((point) => [
      indicator.id,
      indicator.section,
      point.year,
      csvNumber(point.italy),
      csvNumber(point.eu),
      csvNumber(point.median),
      point.coverage,
      point.euMethod,
      point.status,
      point.euStatus,
      point.countryStatuses
        .map(({ geo, status }) => `${geo}:${status}`)
        .join("|"),
      point.missingCountries.join("|"),
      indicator.unitKey,
      indicator.source.datasetCode,
    ]),
  ),
];

await writeFile(
  join(publicDataDirectory, "dashboard.csv"),
  `${csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`,
);

console.log(
  `Updated ${indicators.length} indicators from ${manifest.datasets.length} official Eurostat datasets.`,
);
