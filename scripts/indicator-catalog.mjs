/**
 * Unified declarative catalog of sections, Eurostat datasets and indicators.
 * Single source of truth for definitions, notes, reading templates and search aliases.
 */

export const catalogSections = [
  {
    id: "spending",
    title: { it: "Conti pubblici", en: "Public finances" },
    description: {
      it: "Quanto incassa e spende la pubblica amministrazione, dove vanno le risorse e quale peso hanno deficit e debito.",
      en: "What general government receives and spends, where resources go and how much deficit and debt weigh."
    },
    color: "#136f63",
    questions: [
      {
        id: "total-public-expenditure",
        text: {
          it: "Quanto vale la spesa pubblica rispetto al PIL?",
          en: "How much is public spending as a share of GDP?"
        }
      },
      {
        id: "public-debt",
        text: {
          it: "Quanto pesa il debito pubblico rispetto al PIL?",
          en: "How large is public debt relative to GDP?"
        }
      }
    ]
  },
  {
    id: "people",
    title: { it: "Popolazione", en: "Population" },
    description: {
      it: "Età, fecondità e speranza di vita per capire come cambia la struttura del Paese.",
      en: "Age, fertility and life expectancy to understand how the country’s structure is changing."
    },
    color: "#2f6fce",
    questions: [
      {
        id: "population-65-plus",
        text: {
          it: "Su 100 residenti, quanti hanno almeno 65 anni?",
          en: "What percentage of residents are aged 65 or over?"
        }
      },
      {
        id: "median-age",
        text: { it: "Qual è l’età mediana della popolazione?", en: "What is the median age of the population?" }
      }
    ]
  },
  {
    id: "economy",
    title: { it: "Lavoro ed economia", en: "Work and economy" },
    description: {
      it: "Occupazione, disoccupazione, produzione per persona, crescita e prezzi.",
      en: "Employment, unemployment, output per person, growth and prices."
    },
    color: "#8b5e34",
    questions: [
      {
        id: "inflation",
        text: { it: "Come sono cambiati i prezzi al consumo?", en: "How have consumer prices changed?" }
      },
      {
        id: "employment-rate",
        text: {
          it: "Su 100 persone tra 20 e 64 anni, quante lavorano?",
          en: "What percentage of people aged 20 to 64 are in work?"
        }
      }
    ]
  },
  {
    id: "welfare",
    title: { it: "Welfare e salute", en: "Welfare and health" },
    description: {
      it: "Pensioni, rischio di povertà e anni vissuti senza limitazioni nelle attività quotidiane.",
      en: "Pensions, risk of poverty and years lived without limitations in everyday activities."
    },
    color: "#9c4f6d",
    questions: [
      {
        id: "pension-expenditure",
        text: {
          it: "Quanto pesa la spesa pensionistica sul PIL?",
          en: "How much is pension expenditure as a share of GDP?"
        }
      },
      {
        id: "poverty-or-exclusion",
        text: {
          it: "Quale percentuale della popolazione è a rischio di povertà o esclusione sociale?",
          en: "What percentage of people are at risk of poverty or social exclusion?"
        }
      }
    ]
  },
  {
    id: "education",
    title: { it: "Istruzione", en: "Education" },
    description: {
      it: "Titoli di studio, abbandono, formazione continua e giovani fuori da studio e lavoro.",
      en: "Qualifications, early leaving, continued learning and young people outside work and education."
    },
    color: "#7557a8",
    questions: [
      {
        id: "tertiary-education",
        text: {
          it: "Tra i 25–34enni, quanti su 100 hanno una laurea o un altro titolo terziario?",
          en: "What percentage of 25–34-year-olds hold a tertiary qualification?"
        }
      },
      {
        id: "early-school-leavers",
        text: {
          it: "Quanti 18–24enni su 100 hanno al massimo la scuola media e sono fuori da studio e formazione?",
          en: "What percentage of 18–24-year-olds have low qualifications and are outside education and training?"
        }
      }
    ]
  },
  {
    id: "environment",
    title: { it: "Ambiente ed energia", en: "Environment and energy" },
    description: {
      it: "Rinnovabili, rifiuti ed emissioni che alterano il clima.",
      en: "Renewables, waste and emissions that affect the climate."
    },
    color: "#4f7f3d",
    questions: [
      {
        id: "renewable-energy",
        text: {
          it: "Quale quota dell’energia consumata viene da fonti rinnovabili?",
          en: "What share of energy consumption comes from renewable sources?"
        }
      },
      {
        id: "municipal-waste-recycling",
        text: {
          it: "Quale quota dei rifiuti urbani viene riciclata?",
          en: "What share of municipal waste is recycled?"
        }
      }
    ]
  }
];

export const sections = catalogSections.map(({ id, title, description }) => ({
  id,
  title,
  description,
}));

export const sectionColors = Object.fromEntries(
  catalogSections.map((section) => [section.id, section.color]),
);

export const topicQuestions = Object.fromEntries(
  catalogSections.map((section) => [section.id, section.questions]),
);

export const snapshotDefinitions = {
  "gdp-per-capita-pps": {
    it: "Produzione per persona, corretta per le differenze di prezzo tra Paesi.",
    en: "Output per person, adjusted for differences in prices between countries."
  },
  "median-age": {
    it: "L’età che divide la popolazione in due metà, al 1º gennaio.",
    en: "The age that divides the population into two halves, on 1 January."
  },
  "life-expectancy": {
    it: "Basata sui livelli di mortalità dell’anno, mantenuti costanti per tutta la vita.",
    en: "Based on the year’s mortality rates, held constant throughout life."
  },
  "employment-rate": {
    it: "Percentuale degli occupati nella popolazione di questa fascia d’età.",
    en: "The percentage of people in this age group who are employed."
  }
};

export const snapshotIds = Object.keys(snapshotDefinitions);

const cofogTechnical = {
  it: "Conti nazionali annuali SEC 2010, classificazione COFOG 1999. Settore S13, Amministrazioni pubbliche. Voce TE, spesa pubblica totale consolidata sull’anno solare. Unità PC_TOT, quota percentuale della spesa complessiva.",
  en: "ESA 2010 annual national accounts, COFOG 1999 classification. Sector S13, general government. Item TE, consolidated total general government expenditure over the calendar year. Unit PC_TOT, percentage share of total expenditure."
};

const cofogCaution = {
  it: "La misura indica la quota sul totale della spesa pubblica, non il livello di spesa per abitante né la quota sul PIL.",
  en: "The measure shows the share of total public expenditure, not spending per person or as a share of GDP."
};

export const cofogIndicators = [
  {
    id: "spending-general-services",
    value: "GF01",
    phrase: { it: "i servizi pubblici generali", en: "general public services" },
    title: { it: "Servizi pubblici generali", en: "General public services" },
    plain: {
      it: "Il funzionamento generale delle istituzioni. Comprende gli organi legislativi ed esecutivi, gli affari fiscali, la ricerca di base e gli interessi sul debito.",
      en: "The general operation of public institutions. It includes legislative and executive bodies, fiscal affairs, basic research and public debt interest."
    }
  },
  {
    id: "spending-defence",
    value: "GF02",
    searchAliases: "esercito militari military army",
    phrase: { it: "la difesa", en: "defence" },
    title: { it: "Difesa", en: "Defence" },
    plain: {
      it: "Le attività militari e civili dedicate alla difesa, inclusi gli aiuti militari all’estero e la ricerca collegata.",
      en: "Military and civil defence activities, including foreign military aid and related research."
    }
  },
  {
    id: "spending-public-order",
    value: "GF03",
    searchAliases: "polizia sicurezza tribunali police courts",
    phrase: { it: "l’ordine pubblico e la sicurezza", en: "public order and safety" },
    title: { it: "Ordine pubblico e sicurezza", en: "Public order and safety" },
    plain: {
      it: "Polizia, vigili del fuoco, tribunali, carceri e le altre attività pubbliche legate alla sicurezza e alla giustizia.",
      en: "Police, fire services, courts, prisons and other public activities related to safety and justice."
    }
  },
  {
    id: "spending-economic-affairs",
    value: "GF04",
    phrase: { it: "gli affari economici", en: "economic affairs" },
    title: { it: "Affari economici", en: "Economic affairs" },
    plain: {
      it: "Interventi pubblici per economia, lavoro, agricoltura, energia, industria, trasporti e comunicazioni.",
      en: "Public action for the economy, labour, agriculture, energy, industry, transport and communications."
    }
  },
  {
    id: "spending-environment",
    value: "GF05",
    phrase: { it: "la protezione dell’ambiente", en: "environmental protection" },
    title: { it: "Protezione dell’ambiente", en: "Environmental protection" },
    plain: {
      it: "Gestione dei rifiuti e delle acque reflue, contrasto all’inquinamento, tutela della biodiversità e ricerca ambientale.",
      en: "Waste and wastewater management, pollution abatement, biodiversity protection and environmental research."
    }
  },
  {
    id: "spending-housing",
    value: "GF06",
    phrase: { it: "le abitazioni e il territorio", en: "housing and community amenities" },
    title: { it: "Abitazioni e territorio", en: "Housing and community amenities" },
    plain: {
      it: "Politiche abitative, sviluppo delle comunità, approvvigionamento idrico e illuminazione stradale.",
      en: "Housing policy, community development, water supply and street lighting."
    }
  },
  {
    id: "spending-health",
    value: "GF07",
    searchAliases: "spesa sanitaria sanita ospedali healthcare hospitals health spending",
    phrase: { it: "la sanità", en: "health" },
    title: { it: "Sanità", en: "Health" },
    plain: {
      it: "Prodotti medici, servizi ambulatoriali e ospedalieri, prevenzione, sanità pubblica e ricerca sanitaria.",
      en: "Medical products, outpatient and hospital services, prevention, public health and health research."
    }
  },
  {
    id: "spending-culture",
    value: "GF08",
    phrase: { it: "cultura, sport e religione", en: "recreation, culture and religion" },
    title: { it: "Cultura, sport e religione", en: "Recreation, culture and religion" },
    plain: {
      it: "Servizi ricreativi e sportivi, cultura, editoria pubblica, servizi religiosi e attività collegate.",
      en: "Recreational and sporting services, culture, public broadcasting, religious services and related activities."
    }
  },
  {
    id: "spending-education",
    value: "GF09",
    searchAliases: "spesa scuola scuole istruzione education spending schools",
    phrase: { it: "l’istruzione", en: "education" },
    title: { it: "Istruzione", en: "Education" },
    plain: {
      it: "Scuola e università a tutti i livelli, servizi di supporto, ricerca e spese educative non attribuibili a un singolo livello.",
      en: "Schools and universities at every level, support services, research and education spending not assigned to one level."
    }
  },
  {
    id: "spending-social-protection",
    value: "GF10",
    searchAliases: "spesa welfare protezione sociale social protection welfare spending",
    phrase: { it: "la protezione sociale", en: "social protection" },
    title: { it: "Protezione sociale", en: "Social protection" },
    plain: {
      it: "Prestazioni per malattia, disabilità, vecchiaia, superstiti, famiglie, disoccupazione, abitazione ed esclusione sociale.",
      en: "Benefits for sickness, disability, old age, survivors, families, unemployment, housing and social exclusion."
    }
  },
  {
    id: "spending-old-age",
    value: "GF1002",
    isDetail: true,
    definitionSourceUrl: "https://unstats.un.org/unsd/classifications/Econ/Structure/Detail/EN/4/10_2_0",
    searchAliases: "spesa anziani vecchiaia old age spending",
    phrase: { it: "la funzione «vecchiaia»", en: "the old-age function" },
    title: { it: "Vecchiaia", en: "Old age" },
    plain: {
      it: "La funzione COFOG «vecchiaia»: pensioni di vecchiaia, anticipate per età e parziali; assegni di cura e altri pagamenti legati al pensionamento o all’età; alloggio, assistenza domiciliare, trasporti e altri servizi per persone anziane.",
      en: "The COFOG old-age function: old-age, age-related early-retirement and partial pensions; care allowances and other payments linked to retirement or old age; accommodation, home help, transport and other services for older people."
    },
    readingCaution: {
      it: "Questa voce comprende pensioni legate all’età e altri benefici e servizi per persone anziane. È inclusa nella protezione sociale e indica la quota sul totale della spesa pubblica.",
      en: "This function includes age-related pensions and other benefits and services for older people. It is part of social protection and shows the share of total public expenditure."
    }
  }
];

export const datasetSpecs = [
  {
    id: "gov_10a_exp",
    notes: [
      {
        type: "provisional",
        year: 2024,
        text: {
          it: "I contrassegni includono le note Eurostat sui dati provvisori: Italia e UE 2024, alcuni anni di Belgio, Germania, Spagna, Francia e Portogallo, tutti gli anni della Slovacchia e i gruppi di dettaglio della Bulgaria. I contrassegni originali restano disponibili.",
          en: "Flags include Eurostat’s provisional-data notes: Italy and EU 2024, selected years for Belgium, Germany, Spain, France and Portugal, all Slovak years, and Bulgarian detail groups. Original flags remain available."
        },
        sourceUrl: "https://ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm"
      }
    ],
    filters: {
      freq: ["A"],
      unit: ["PC_TOT"],
      sector: ["S13"],
      na_item: ["TE"],
      cofog99: cofogIndicators.map((indicator) => indicator.value),
    },
    indicators: cofogIndicators.map((indicator) => ({
      id: indicator.id,
      value: indicator.value,
      title: indicator.title,
      plain: indicator.plain,
      ...(indicator.isDetail ? { isDetail: true } : {}),
      ...(indicator.definitionSourceUrl ? { definitionSourceUrl: indicator.definitionSourceUrl } : {}),
      ...(indicator.searchAliases ? { searchAliases: indicator.searchAliases } : {}),
      section: "spending",
      selector: { cofog99: indicator.value },
      unitKey: "percent_spending",
      precision: 1,
      technical: cofogTechnical,
      reading: {
        it: `Nel {year}, {value} € ogni 100 € di spesa delle amministrazioni pubbliche italiane riguardavano ${indicator.phrase.it}.`,
        en: `In {year}, €{value} of every €100 spent by Italy’s general government went to ${indicator.phrase.en}.`,
        caution: indicator.readingCaution ?? cofogCaution,
      },
    })),
  },
  {
    id: "gov_10a_main",
    filters: {
      freq: ["A"],
      unit: ["PC_GDP"],
      sector: ["S13"],
      na_item: ["TE", "TR", "B9", "D41PAY", "P51G", "D62_D632PAY"]
    },
    indicators: [
      {
        id: "total-public-expenditure",
        section: "spending",
        selector: { na_item: "TE" },
        title: { it: "Spesa pubblica totale", en: "Total public expenditure" },
        plain: {
          it: "Tutto ciò che le Amministrazioni pubbliche spendono in un anno, dopo avere eliminato i trasferimenti interni tra enti pubblici.",
          en: "Everything general government spends in one year, after eliminating transfers between public bodies."
        },
        technical: {
          it: "Spesa annua totale consolidata (TE) delle Amministrazioni pubbliche, settore S13 (conti nazionali SEC 2010), espressa in quota percentuale del PIL (PC_GDP).",
          en: "Annual consolidated total expenditure (TE) of general government, sector S13 (ESA 2010 national accounts), expressed as a percentage share of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        featured: true,
        searchAliases: "quanto spende stato uscite government spending expenditure",
        reading: {
          it: "Nel {year}, la spesa complessiva delle amministrazioni pubbliche italiane era pari al {value}% del PIL.",
          en: "In {year}, total expenditure by Italy’s general government amounted to {value}% of GDP.",
          caution: {
            it: "Il rapporto in percentuale del PIL dipende sia dal livello della spesa pubblica sia dal valore del PIL nominale al denominatore.",
            en: "The ratio to GDP depends on both the level of public expenditure and the nominal GDP in the denominator."
          }
        }
      },
      {
        id: "total-public-revenue",
        section: "spending",
        selector: { na_item: "TR" },
        title: { it: "Entrate pubbliche totali", en: "Total public revenue" },
        plain: {
          it: "Le risorse ricevute dalle Amministrazioni pubbliche. Comprendono imposte, contributi sociali e altre entrate.",
          en: "Resources received by general government. They include taxes, social contributions and other revenue."
        },
        technical: {
          it: "Entrate annue totali consolidate (TR) delle Amministrazioni pubbliche, settore S13 (conti nazionali SEC 2010), in quota percentuale del PIL (PC_GDP).",
          en: "Annual consolidated total revenue (TR) of general government, sector S13 (ESA 2010 national accounts), as a percentage share of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        searchAliases: "quanto incassa stato tasse tributi imposte tax revenue taxes",
        reading: {
          it: "Nel {year}, le entrate complessive delle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
          en: "In {year}, total revenue received by Italy’s general government amounted to {value}% of GDP.",
          caution: {
            it: "Il rapporto in percentuale del PIL dipende sia dal gettito e dalle altre entrate pubbliche sia dal valore del PIL nominale al denominatore.",
            en: "The ratio to GDP depends on both public revenue and the nominal GDP in the denominator."
          }
        }
      },
      {
        id: "budget-balance",
        section: "spending",
        selector: { na_item: "B9" },
        title: { it: "Saldo di bilancio", en: "Budget balance" },
        plain: {
          it: "La differenza tra entrate e uscite. Un valore negativo indica indebitamento netto, comunemente chiamato deficit.",
          en: "The difference between revenue and expenditure. A negative value means net borrowing, commonly called a deficit."
        },
        technical: {
          it: "Saldo contabile annuo di accreditamento netto o indebitamento netto (B9) delle Amministrazioni pubbliche, settore S13 (conti nazionali SEC 2010), in percentuale del PIL (PC_GDP).",
          en: "Annual net lending or net borrowing (B9) of general government, sector S13 (ESA 2010 national accounts), as a percentage of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        featured: true,
        searchAliases: "deficit disavanzo avanzo bilancio budget deficit surplus",
        reading: {
          it: "Nel {year}, il saldo tra entrate e uscite delle amministrazioni pubbliche italiane era pari al {value}% del PIL.",
          en: "In {year}, Italy’s general government balance between revenue and expenditure amounted to {value}% of GDP.",
          caution: {
            it: "Un saldo negativo indica un deficit. Un saldo positivo indica un avanzo.",
            en: "A negative balance indicates a deficit. A positive balance indicates a surplus."
          }
        }
      },
      {
        id: "interest-expenditure",
        section: "spending",
        selector: { na_item: "D41PAY" },
        title: { it: "Interessi sul debito", en: "Interest expenditure" },
        plain: {
          it: "Gli interessi pagati dalle Amministrazioni pubbliche sui propri debiti. Non comprende il rimborso del capitale.",
          en: "Interest paid by general government on its debt. It does not include repayment of principal."
        },
        technical: {
          it: "Interessi passivi annui consolidati (D41PAY) del settore S13 secondo il SEC 2010, registrati per competenza economica, in quota percentuale del PIL (PC_GDP).",
          en: "Annual consolidated interest payable (D41PAY) of sector S13 under ESA 2010 on an accrual basis, as a percentage share of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        searchAliases: "costo debito interessi interest debt costs",
        reading: {
          it: "Nel {year}, gli interessi pagati dalle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
          en: "In {year}, interest paid by Italy’s general government amounted to {value}% of GDP.",
          caution: {
            it: "La misura è registrata per competenza economica (SEC 2010) e non comprende il rimborso del capitale in scadenza.",
            en: "The measure is recorded on an accrual basis (ESA 2010) and excludes principal repayments."
          }
        }
      },
      {
        id: "public-investment",
        section: "spending",
        selector: { na_item: "P51G" },
        title: { it: "Investimenti pubblici", en: "Public investment" },
        plain: {
          it: "Acquisti e realizzazioni di beni durevoli usati dalla pubblica amministrazione, come infrastrutture, edifici e attrezzature.",
          en: "Purchases and creation of durable assets used by government, such as infrastructure, buildings and equipment."
        },
        technical: {
          it: "Investimenti fissi lordi annui (P51G) delle Amministrazioni pubbliche, settore S13 (conti nazionali SEC 2010), in quota percentuale del PIL (PC_GDP).",
          en: "Annual gross fixed capital formation (P51G) of general government, sector S13 (ESA 2010 national accounts), as a percentage share of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        searchAliases: "opere pubbliche infrastrutture infrastructure public works",
        reading: {
          it: "Nel {year}, gli investimenti fissi lordi delle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
          en: "In {year}, gross fixed investment by Italy’s general government amounted to {value}% of GDP.",
          caution: {
            it: "La misura riguarda gli investimenti diretti delle amministrazioni pubbliche in beni capitali fissi e non include i contributi agli investimenti erogati a imprese o famiglie.",
            en: "The measure covers direct general government investment in fixed capital assets and excludes investment grants paid to businesses or households."
          }
        }
      },
      {
        id: "social-benefits",
        section: "spending",
        selector: { na_item: "D62_D632PAY" },
        title: { it: "Prestazioni sociali", en: "Social benefits" },
        plain: {
          it: "Trasferimenti in denaro e prestazioni acquistate per le persone, come pensioni, indennità e alcune prestazioni sanitarie o assistenziali.",
          en: "Cash transfers and services purchased for people, such as pensions, allowances and some health or care benefits."
        },
        technical: {
          it: "Somma annua delle voci SEC 2010 D62 e D632 del settore S13 (prestazioni sociali diverse dai trasferimenti sociali in natura e trasferimenti in natura acquistati sul mercato), in quota percentuale del PIL (PC_GDP).",
          en: "Annual sum of ESA 2010 items D62 and D632 of sector S13 (social benefits other than social transfers in kind and purchased market production), as a percentage share of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        searchAliases: "sussidi aiuti sociali benefits welfare payments",
        reading: {
          it: "Nel {year}, le prestazioni sociali in denaro e quelle acquistate sul mercato dalle amministrazioni pubbliche italiane erano pari al {value}% del PIL.",
          en: "In {year}, social benefits in cash and benefits purchased on the market by Italy’s general government amounted to {value}% of GDP.",
          caution: {
            it: "La serie non include i servizi pubblici erogati direttamente da strutture e personale della pubblica amministrazione.",
            en: "The series excludes public services produced directly by government facilities and staff."
          }
        }
      }
    ]
  },
  {
    id: "gov_10dd_edpt1",
    filters: {
      freq: ["A"],
      unit: ["PC_GDP"],
      sector: ["S13"],
      na_item: ["GD"]
    },
    indicators: [
      {
        id: "public-debt",
        section: "spending",
        selector: { na_item: "GD" },
        title: { it: "Debito pubblico", en: "Public debt" },
        plain: {
          it: "Il debito lordo consolidato delle Amministrazioni pubbliche. È misurato secondo le regole europee del debito di Maastricht.",
          en: "The consolidated gross debt of general government. It is measured under the European Maastricht debt rules."
        },
        technical: {
          it: "Consistenza (stock) a fine anno del debito lordo consolidato (GD) del settore S13 al valore nominale facciale secondo le regole della procedura per i disavanzi eccessivi (Maastricht), in rapporto percentuale al PIL nominale dell’anno (PC_GDP).",
          en: "Year-end stock of consolidated gross debt (GD) of sector S13 at nominal face value under the Excessive Deficit Procedure (Maastricht) rules, expressed as a percentage ratio to annual nominal GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        featured: true,
        searchAliases: "debito stato indebitamento government debt",
        reading: {
          it: "Alla fine del {year}, il debito lordo consolidato delle amministrazioni pubbliche italiane era pari al {value}% del PIL di quell’anno.",
          en: "At the end of {year}, Italy’s consolidated gross government debt amounted to {value}% of that year’s GDP.",
          caution: {
            it: "Il rapporto dipende sia dallo stock nominale del debito a fine anno (al lordo delle attività finanziarie pubbliche) sia dal PIL nominale dell’anno al denominatore.",
            en: "The ratio depends on both the year-end nominal debt stock (gross of government financial assets) and the annual nominal GDP in the denominator."
          }
        }
      }
    ]
  },
  {
    id: "demo_pjanind",
    filters: {
      freq: ["A"],
      indic_de: ["MEDAGEPOP", "PC_Y65_MAX", "OLDDEP1"]
    },
    indicators: [
      {
        id: "median-age",
        section: "people",
        selector: { indic_de: "MEDAGEPOP" },
        title: { it: "Età mediana", en: "Median age" },
        plain: {
          it: "L’età che divide la popolazione in due gruppi uguali. Metà delle persone è più giovane e metà è più anziana.",
          en: "The age that divides the population into two equal groups. Half of people are younger and half are older."
        },
        technical: {
          it: "Mediana (MEDAGEPOP) della distribuzione per età della popolazione abitualmente residente rilevata al primo gennaio di ciascun anno.",
          en: "Median (MEDAGEPOP) of the age distribution of the usually resident population measured on 1 January of each year."
        },
        unitKey: "years",
        precision: 1,
        featured: true,
        searchAliases: "eta popolazione invecchiamento population age ageing",
        reading: {
          it: "Al 1º gennaio {year}, l’età che divideva la popolazione residente italiana in due metà era {value} anni.",
          en: "On 1 January {year}, the age dividing Italy’s resident population into two equal halves was {value} years.",
          caution: {
            it: "La mediana dei Paesi nel grafico è calcolata sulle età mediane nazionali, con lo stesso peso per ogni Paese.",
            en: "The country median in the chart is calculated from national median ages, giving each country equal weight."
          }
        }
      },
      {
        id: "population-65-plus",
        section: "people",
        selector: { indic_de: "PC_Y65_MAX" },
        title: { it: "Popolazione di 65 anni o più", en: "Population aged 65 or over" },
        plain: {
          it: "La quota di residenti che ha almeno 65 anni.",
          en: "The share of residents who are at least 65 years old."
        },
        technical: {
          it: "Quota percentuale (PC_Y65_MAX) della popolazione abitualmente residente di 65 anni o più divisa per la popolazione residente totale al primo gennaio.",
          en: "Percentage share (PC_Y65_MAX) of the usually resident population aged 65 or over divided by the total resident population on 1 January."
        },
        unitKey: "percent",
        precision: 1,
        searchAliases: "quanti anziani ultrasessantacinquenni over 65 elderly older population",
        reading: {
          it: "Al 1º gennaio {year}, il {value}% della popolazione residente in Italia aveva almeno 65 anni.",
          en: "On 1 January {year}, {value}% of Italy’s resident population was aged 65 or over.",
          caution: {
            it: "Il dato è uno stock rilevato al 1º gennaio dell’anno sulla popolazione abitualmente residente.",
            en: "The figure is a stock recorded on 1 January of the year for the usually resident population."
          }
        }
      },
      {
        id: "old-age-dependency",
        section: "people",
        selector: { indic_de: "OLDDEP1" },
        title: { it: "Indice di dipendenza degli anziani", en: "Old age dependency ratio" },
        plain: {
          it: "Il numero di residenti di 65 anni o più ogni 100 residenti in età lavorativa (15–64 anni). Confronta solo le fasce d’età, non i pensionati con gli occupati.",
          en: "The number of residents aged 65 or over for every 100 residents of traditional working age (15 to 64). It compares age groups only, not pensioners with employed people."
        },
        technical: {
          it: "Rapporto demografico (OLDDEP1) tra popolazione residente di 65 anni o più e popolazione tra 15 e 64 anni al primo gennaio, moltiplicato per 100. Nonostante la denominazione italiana corrente di «indice», misura un rapporto tra due fasce di popolazione (ogni 100 residenti di 15–64 anni) e non un numero indice a base 100.",
          en: "Demographic ratio (OLDDEP1) of the resident population aged 65 or over to the population aged 15 to 64 on 1 January, multiplied by 100. It measures a ratio between two population age groups (per 100 residents aged 15–64), not a base-100 index number."
        },
        unitKey: "per_100",
        precision: 1,
        searchAliases: "anziani popolazione eta lavoro ageing dependency working age",
        reading: {
          it: "Al 1º gennaio {year}, in Italia c’erano {value} persone di almeno 65 anni ogni 100 persone tra 15 e 64 anni.",
          en: "On 1 January {year}, Italy had {value} people aged 65 or over for every 100 people aged 15 to 64.",
          caution: {
            it: "Il rapporto confronta fasce d’età, indipendentemente dal fatto che le persone lavorino.",
            en: "The ratio compares age groups, regardless of whether people are employed."
          }
        }
      }
    ]
  },
  {
    id: "demo_find",
    filters: {
      freq: ["A"],
      indic_de: ["TOTFERRT"]
    },
    indicators: [
      {
        id: "fertility-rate",
        section: "people",
        selector: { indic_de: "TOTFERRT" },
        title: { it: "Fecondità totale", en: "Total fertility rate" },
        plain: {
          it: "Il numero medio di figli che avrebbe una donna se sperimentasse per tutta la vita i tassi di fecondità osservati in quell’anno.",
          en: "The average number of children a woman would have if she experienced that year’s fertility rates throughout her life."
        },
        technical: {
          it: "Tasso di fecondità totale (TOTFERRT): somma dei tassi di fecondità specifici per età osservati nell’anno solare. È un indicatore sintetico per contemporanei, non il numero reale di figli di una generazione.",
          en: "Total fertility rate (TOTFERRT): sum of age-specific fertility rates observed in the calendar year. It is a synthetic period measure, not the actual completed fertility of a birth cohort."
        },
        unitKey: "children_per_woman",
        precision: 2,
        searchAliases: "figli nascite natalita bambini births born children fertility birth rate",
        reading: {
          it: "Applicando per tutta la vita i tassi di fecondità osservati in Italia nel {year}, una donna avrebbe in media {value} figli.",
          en: "A woman experiencing Italy’s {year} fertility rates throughout her life would have {value} children on average.",
          caution: {
            it: "È un indicatore sintetico di periodo calcolato sui tassi di fecondità per età di un singolo anno solare, non sul numero finale di figli di una generazione.",
            en: "This is a synthetic period indicator based on a single calendar year’s age-specific fertility rates, not the completed fertility of a birth cohort."
          }
        }
      }
    ]
  },
  {
    id: "demo_mlexpec",
    filters: {
      freq: ["A"],
      unit: ["YR"],
      sex: ["T"],
      age: ["Y_LT1"]
    },
    indicators: [
      {
        id: "life-expectancy",
        section: "people",
        selector: {},
        title: { it: "Speranza di vita alla nascita", en: "Life expectancy at birth" },
        plain: {
          it: "Gli anni che vivrebbe in media un neonato se i livelli di mortalità dell’anno restassero invariati durante tutta la sua vita.",
          en: "The years a newborn would live on average if that year’s mortality rates remained unchanged throughout life."
        },
        technical: {
          it: "Speranza di vita alla nascita (Y_LT1) da tavola di mortalità contemporanea annua calcolata per il totale della popolazione sui quozienti specifici di mortalità dell’anno solare.",
          en: "Period life expectancy at birth (Y_LT1) from the annual life table calculated for the total population from the age-specific mortality rates of the calendar year."
        },
        unitKey: "years",
        precision: 1,
        notes: [
          {
            type: "method_change",
            year: 2024,
            text: {
              it: "Dal 2024 Eurostat estende il calcolo delle tavole di mortalità dalla classe finale 85+ alla classe 95+. Il confronto con gli anni precedenti richiede cautela.",
              en: "From 2024 Eurostat extends life-table calculations from the final 85+ age group to 95+. Comparisons with earlier years require caution."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20260313-3"
          }
        ],
        searchAliases: "quanto vive durata vita longevita life expectancy lifespan longevity",
        reading: {
          it: "Nel {year}, la speranza di vita alla nascita in Italia era {value} anni.",
          en: "In {year}, life expectancy at birth in Italy was {value} years.",
          caution: {
            it: "Il calcolo suppone che i livelli di mortalità di quell’anno restino invariati per tutta la vita di un neonato.",
            en: "The calculation assumes that the year’s mortality rates remain unchanged throughout a newborn’s life."
          }
        }
      }
    ]
  },
  {
    id: "lfsi_emp_a",
    filters: {
      freq: ["A"],
      indic_em: ["EMP_LFS"],
      sex: ["T"],
      age: ["Y20-64"],
      unit: ["PC_POP"]
    },
    indicators: [
      {
        id: "employment-rate",
        section: "economy",
        selector: {},
        title: { it: "Tasso di occupazione, 20–64 anni", en: "Employment rate, ages 20–64" },
        plain: {
          it: "La quota delle persone tra 20 e 64 anni che ha un lavoro.",
          en: "The share of people aged 20 to 64 who have a job."
        },
        technical: {
          it: "Quota percentuale (PC_POP) degli occupati residenti tra 20 e 64 anni (EMP_LFS, definizione ILO) divisi per la popolazione della stessa età. Media annua delle rilevazioni trimestrali continue dell’indagine EU Labour Force Survey.",
          en: "Percentage share (PC_POP) of employed residents aged 20 to 64 (EMP_LFS, ILO definition) divided by the population of the same age. Annual average of the continuous quarterly surveys of the EU Labour Force Survey."
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
        searchAliases: "quanti lavorano occupati persone lavoro employed employment jobs",
        reading: {
          it: "Nel {year}, il {value}% dei residenti in Italia tra 20 e 64 anni aveva un lavoro.",
          en: "In {year}, {value}% of Italy’s residents aged 20 to 64 were employed.",
          caution: {
            it: "Il denominatore è l’intera popolazione residente tra 20 e 64 anni; il valore annuale è la media delle rilevazioni trimestrali sull’occupazione.",
            en: "The denominator is the entire resident population aged 20 to 64; the annual figure is the average of the quarterly labour force survey waves."
          }
        }
      }
    ]
  },
  {
    id: "une_rt_a",
    filters: {
      freq: ["A"],
      age: ["Y15-74", "Y15-24"],
      unit: ["PC_ACT"],
      sex: ["T"]
    },
    indicators: [
      {
        id: "unemployment-rate",
        section: "economy",
        selector: { age: "Y15-74" },
        title: { it: "Tasso di disoccupazione", en: "Unemployment rate" },
        plain: {
          it: "La quota delle persone attive che non ha un lavoro, lo ha cercato nelle quattro settimane precedenti ed è disponibile a iniziare entro due settimane.",
          en: "The share of the labour force without a job who sought work during the previous four weeks and can start within two weeks."
        },
        technical: {
          it: "Quota percentuale (PC_ACT) dei disoccupati tra 15 e 74 anni secondo la definizione ILO divisi per la forza lavoro della stessa età, calcolata come media annua delle rilevazioni trimestrali continue EU Labour Force Survey. Chi non cerca attivamente lavoro non è contato tra i disoccupati.",
          en: "Percentage share (PC_ACT) of unemployed people aged 15 to 74 under the ILO definition divided by the labour force of the same age, calculated as the annual average of continuous quarterly EU Labour Force Survey data. People not actively seeking work are not counted as unemployed."
        },
        unitKey: "percent",
        precision: 1,
        searchAliases: "senza lavoro disoccupati non lavoro unemployed unemployment jobless cannot find job",
        reading: {
          it: "Nel {year}, il {value}% della forza lavoro italiana tra 15 e 74 anni era disoccupato secondo la definizione ILO.",
          en: "In {year}, {value}% of Italy’s labour force aged 15 to 74 was unemployed under the ILO definition.",
          caution: {
            it: "La forza lavoro comprende occupati e disoccupati. La disoccupazione richiede ricerca attiva e disponibilità a iniziare un lavoro.",
            en: "The labour force comprises employed and unemployed people. Unemployment requires active job seeking and availability to start work."
          }
        }
      },
      {
        id: "youth-unemployment",
        section: "economy",
        selector: { age: "Y15-24" },
        title: { it: "Disoccupazione giovanile", en: "Youth unemployment" },
        plain: {
          it: "La quota dei giovani attivi tra 15 e 24 anni che non ha un lavoro, lo ha cercato nelle quattro settimane precedenti ed è disponibile a iniziare entro due settimane.",
          en: "The share of active young people aged 15 to 24 without a job who sought work during the previous four weeks and can start within two weeks."
        },
        technical: {
          it: "Quota percentuale (PC_ACT) dei disoccupati tra 15 e 24 anni secondo la definizione ILO divisi per la forza lavoro della stessa età, come media annua delle rilevazioni trimestrali EU Labour Force Survey. Non è la percentuale di tutti i giovani.",
          en: "Percentage share (PC_ACT) of unemployed people aged 15 to 24 under the ILO definition divided by the labour force of the same age, as the annual average of quarterly EU Labour Force Survey data. It is not a percentage of all young people."
        },
        unitKey: "percent",
        precision: 1,
        searchAliases: "giovani senza lavoro disoccupati youth unemployment young unemployed cannot find job",
        reading: {
          it: "Nel {year}, il {value}% della forza lavoro italiana tra 15 e 24 anni era disoccupato secondo la definizione ILO.",
          en: "In {year}, {value}% of Italy’s labour force aged 15 to 24 was unemployed under the ILO definition.",
          caution: {
            it: "Il denominatore comprende i giovani occupati e quelli che cercano attivamente lavoro e sono disponibili a iniziare.",
            en: "The denominator comprises employed young people and those actively seeking and available to start work."
          }
        }
      }
    ]
  },
  {
    id: "nama_10_pc",
    filters: {
      freq: ["A"],
      unit: ["PC_EU27_2020_HAB_MPPS_CP", "CLV_PCH_PRE_HAB"],
      na_item: ["B1GQ"]
    },
    indicators: [
      {
        id: "gdp-per-capita-pps",
        section: "economy",
        selector: { unit: "PC_EU27_2020_HAB_MPPS_CP" },
        title: { it: "PIL per abitante: confronto con l’UE", en: "GDP per person: comparison with the EU" },
        plain: {
          it: "La produzione economica per persona, corretta per le differenze di prezzo tra Paesi. Il valore UE è posto uguale a 100.",
          en: "Economic output per person, adjusted for price differences between countries. The EU value is set to 100."
        },
        technical: {
          it: "Numero indice spaziale del PIL B1GQ pro capite in standard di potere d’acquisto (SPA/PPS), espresso ponendo il totale UE27 pro capite uguale a 100 in ciascun anno (PC_EU27_2020_HAB_MPPS_CP, conti nazionali annuali SEC 2010).",
          en: "Spatial volume index of GDP B1GQ per capita in purchasing power standards (PPS), expressed with the EU27 per capita total set to 100 in each year (PC_EU27_2020_HAB_MPPS_CP, ESA 2010 annual national accounts)."
        },
        unitKey: "eu_index",
        precision: 0,
        featured: true,
        searchAliases: "pil ppa pps produzione per abitante prezzi confrontabili purchasing power parity gdp output per person europa europe",
        reading: {
          it: "Nel {year}, il PIL per abitante dell’Italia valeva {value} su una scala in cui l’UE è 100, tenendo conto delle differenze di prezzo tra Paesi.",
          en: "In {year}, Italy’s GDP per person was {value} on a scale where the EU equals 100, accounting for price differences between countries.",
          caution: {
            it: "L’indice è relativo all’UE dello stesso anno. Un aumento indica un cambiamento rispetto al riferimento europeo; per misurare la crescita reale del PIL servono altri dati. I redditi delle famiglie e la loro distribuzione richiedono misure specifiche.",
            en: "The index is relative to the EU in the same year. An increase reflects a change relative to that European reference; measuring real GDP growth requires other data. Household incomes and their distribution require specific measures."
          }
        }
      },
      {
        id: "real-gdp-growth-per-capita",
        section: "economy",
        selector: { unit: "CLV_PCH_PRE_HAB" },
        title: { it: "Crescita reale del PIL pro capite", en: "Real GDP growth per capita" },
        plain: {
          it: "Quanto cambia in un anno la produzione economica per persona, al netto dell’inflazione (tasso di variazione annuo, non livello del PIL).",
          en: "How much economic output per person changes in one year after removing inflation (annual rate of change, not GDP level)."
        },
        technical: {
          it: "Tasso di variazione percentuale annuo (CLV_PCH_PRE_HAB) del PIL B1GQ pro capite a volumi concatenati (conti nazionali annuali SEC 2010). Misura la variazione reale rispetto all’anno precedente; l’indice cumulato mostrato nella scheda è ricostruito dal progetto concatenando i tassi annui ufficiali arrotondati al decimo di punto.",
          en: "Annual percentage rate of change (CLV_PCH_PRE_HAB) in GDP B1GQ per capita in chain-linked volumes (ESA 2010 annual national accounts). It measures the real change from the previous year; the cumulative index shown on the card is reconstructed by the project by chaining the official annual rates rounded to one decimal place."
        },
        unitKey: "percent_change",
        precision: 1,
        searchAliases: "crescita economia crescita pil economic growth gdp growth",
        annualChangeReading: {
          it: "il PIL reale per abitante",
          en: "real GDP per person",
          caution: {
            it: "Il grafico principale mostra il tasso di variazione annuo (%), non il livello del PIL reale per abitante. Una variazione positiva dopo un calo non significa aver già recuperato il livello precedente.",
            en: "The main chart shows the annual rate of change (%), not the level of real GDP per person. A positive rate after a decline does not mean output has already returned to its earlier level."
          }
        }
      }
    ]
  },
  {
    id: "tec00118",
    filters: {
      freq: ["A"],
      unit: ["RCH_A_AVG"],
      coicop18: ["TOTAL"]
    },
    indicators: [
      {
        id: "inflation",
        section: "economy",
        selector: {},
        title: { it: "Inflazione", en: "Inflation" },
        plain: {
          it: "Quanto sono aumentati o diminuiti in media i prezzi pagati dalle famiglie rispetto all’anno precedente (tasso di variazione annuo, non livello dell’indice dei prezzi).",
          en: "How much prices paid by households increased or decreased on average compared with the previous year (annual rate of change, not the price index level)."
        },
        technical: {
          it: "Tasso medio annuo di variazione percentuale (RCH_A_AVG) dell’indice armonizzato dei prezzi al consumo (IPCA/HICP), totale COICOP. Misura la variazione della media annua rispetto all’anno precedente; l’indice cumulato mostrato nella scheda è ricostruito dal progetto concatenando i tassi medi annui ufficiali arrotondati al decimo di punto.",
          en: "Annual average percentage rate of change (RCH_A_AVG) of the harmonised index of consumer prices (HICP), total COICOP. It measures the change in the annual average from the previous year; the cumulative index shown on the card is reconstructed by the project by chaining the official annual average rates rounded to one decimal place."
        },
        unitKey: "percent_change",
        precision: 1,
        searchAliases: "aumento prezzi crescita prezzi rincari carovita costo vita inflation price increases cost living",
        annualChangeReading: {
          it: "i prezzi al consumo misurati dall’indice armonizzato",
          en: "consumer prices measured by the harmonised index",
          caution: {
            it: "Il grafico principale mostra il tasso di variazione annuo (%), non il livello dell’indice dei prezzi. Un tasso positivo più basso (disinflazione) significa che i prezzi continuano ad aumentare ma più lentamente; i prezzi scendono solo quando la variazione è negativa.",
            en: "The main chart shows the annual rate of change (%), not the price index level. A lower positive rate (disinflation) means prices are still rising, only more slowly; prices fall only when the rate is negative."
          }
        }
      }
    ]
  },
  {
    id: "ilc_peps01n",
    filters: {
      freq: ["A"],
      unit: ["PC"],
      age: ["TOTAL"],
      sex: ["T"]
    },
    indicators: [
      {
        id: "poverty-or-exclusion",
        section: "welfare",
        selector: {},
        title: { it: "Rischio di povertà o esclusione sociale", en: "Risk of poverty or social exclusion" },
        plain: {
          it: "La quota di persone che vive almeno una tra tre condizioni: reddito basso, grave deprivazione materiale e sociale, oppure intensità di lavoro molto bassa.",
          en: "The share of people living in at least one of three conditions: low income, severe material and social deprivation, or very low work intensity."
        },
        technical: {
          it: "Quota percentuale (PC) della popolazione in famiglie private secondo l’indicatore composito AROPE (definizione Europa 2030, indagine annuale EU-SILC). Per la componente reddituale, l’anno di riferimento del reddito è normalmente quello precedente all’indagine.",
          en: "Percentage share (PC) of people living in private households under the composite AROPE indicator (Europe 2030 definition, annual EU-SILC survey). For the income component, the income reference year is normally the year before the survey."
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
        notes: [
          {
            type: "reference_period",
            text: {
              it: "L’anno mostrato è quello dell’indagine EU-SILC. Per la componente sul reddito, il periodo di riferimento è normalmente l’anno precedente.",
              en: "The displayed year is the EU-SILC survey year. For the income component, the reference period is normally the previous year."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/cache/metadata/en/ilc_sieusilc.htm"
          }
        ],
        searchAliases: "poveri poverta esclusione poverty poor social exclusion",
        reading: {
          it: "Nell’indagine del {year}, il {value}% delle persone in famiglie private in Italia risultava a rischio di povertà o esclusione sociale.",
          en: "In the {year} survey, {value}% of people in private households in Italy were at risk of poverty or social exclusion.",
          caution: {
            it: "L’anno è quello dell’indagine. Il reddito si riferisce normalmente all’anno precedente.",
            en: "The year identifies the survey. Income normally refers to the preceding year."
          }
        }
      }
    ]
  },
  {
    id: "spr_exp_pens",
    filters: {
      freq: ["A"],
      spdepb: ["TOTAL"],
      spdepm: ["TOTAL"],
      unit: ["PC_GDP"]
    },
    indicators: [
      {
        id: "pension-expenditure",
        section: "welfare",
        selector: {},
        title: { it: "Spesa per pensioni", en: "Pension expenditure" },
        plain: {
          it: "La spesa per pensioni di vecchiaia, anticipate, di invalidità e ai superstiti, insieme alle altre tipologie incluse nella statistica europea.",
          en: "Spending on old age, anticipated, disability and survivors’ pensions, together with the other types included in European statistics."
        },
        technical: {
          it: "Spesa pensionistica annua lorda totale del sistema ESSPROS (regimi pubblici e privati, con e senza prova dei mezzi), espressa in quota percentuale del PIL (PC_GDP).",
          en: "Total annual gross ESSPROS pension expenditure (public and private schemes, means tested and non means tested), expressed as a percentage share of GDP (PC_GDP)."
        },
        unitKey: "percent_gdp",
        precision: 1,
        definitionSourceUrl: "https://ec.europa.eu/eurostat/web/social-protection/information-data",
        searchAliases: "pensioni pensionistica quanto costano pensioni pensions pension spending",
        reading: {
          it: "Nel {year}, la spesa pensionistica italiana rilevata dal sistema europeo ESSPROS era pari al {value}% del PIL.",
          en: "In {year}, Italian pension expenditure recorded under the European ESSPROS system amounted to {value}% of GDP.",
          caution: {
            it: "La misura comprende le diverse tipologie di pensione previste da ESSPROS e ha un perimetro distinto dalla funzione di spesa «vecchiaia».",
            en: "The measure covers the pension types defined by ESSPROS and has a different scope from the old-age spending function."
          }
        }
      }
    ]
  },
  {
    id: "hlth_hlye",
    filters: {
      freq: ["A"],
      unit: ["YR"],
      sex: ["T"],
      hlth_hle: ["HLY_Y0"]
    },
    indicators: [
      {
        id: "healthy-life-years",
        section: "welfare",
        selector: {},
        title: { it: "Anni di vita in buona salute", en: "Healthy life years" },
        plain: {
          it: "Gli anni che una persona può aspettarsi di vivere senza limitazioni di lunga durata nelle attività abituali, secondo quanto dichiarato nell’indagine.",
          en: "The years a person can expect to live without long-standing limitations in usual activities, based on survey responses."
        },
        technical: {
          it: "Indicatore HLY alla nascita (HLY_Y0) per il totale della popolazione. Combina tavole di mortalità annue e la domanda GALI di EU-SILC sulle limitazioni durate almeno sei mesi. Le persone in istituzioni non rientrano normalmente nel campione EU-SILC.",
          en: "Healthy life years at birth (HLY_Y0) for the total population. It combines annual life tables with the EU-SILC GALI question on limitations lasting at least six months. People living in institutions are normally outside the EU-SILC sample."
        },
        unitKey: "years",
        precision: 1,
        notes: [
          {
            type: "comparability",
            text: {
              it: "La misura usa una domanda auto-riferita sulle limitazioni nelle attività. Differenze nel modo in cui la domanda è somministrata possono ridurre la comparabilità tra Paesi e nel tempo.",
              en: "The measure uses a self-reported question on activity limitations. Differences in how the question is administered can reduce comparability across countries and over time."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/cache/metadata/en/hlth_hlye_esms.htm"
          },
          {
            type: "data_gap",
            year: 2010,
            text: {
              it: "Per l’Italia il 2010 non è disponibile nella selezione ufficiale. Il sito passa dal 2009 al 2011 senza interpolare il valore mancante.",
              en: "For Italy, 2010 is not available in the official selection. The site moves from 2009 to 2011 without interpolating the missing value."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/databrowser/view/hlth_hlye/default/table?lang=en"
          }
        ],
        searchAliases: "anni salute vita sana disabilita healthy life disability",
        reading: {
          it: "Nel {year}, l’indicatore alla nascita per l’Italia stimava {value} anni di vita senza limitazioni di lunga durata nelle attività abituali.",
          en: "In {year}, the indicator at birth for Italy estimated {value} years of life without long-standing limitations in usual activities.",
          caution: {
            it: "La misura combina mortalità e limitazioni dichiarate dalle persone nell’indagine.",
            en: "The measure combines mortality data with activity limitations reported by survey respondents."
          }
        }
      }
    ]
  },
  {
    id: "edat_lfse_03",
    filters: {
      freq: ["A"],
      sex: ["T"],
      age: ["Y25-34"],
      unit: ["PC"],
      isced11: ["ED5-8"]
    },
    indicators: [
      {
        id: "tertiary-education",
        section: "education",
        selector: {},
        title: { it: "Giovani con istruzione terziaria", en: "Young adults with tertiary education" },
        plain: {
          it: "La quota delle persone tra 25 e 34 anni che ha completato un percorso universitario o equivalente.",
          en: "The share of people aged 25 to 34 who completed university or an equivalent tertiary programme."
        },
        technical: {
          it: "Quota percentuale (PC) della popolazione tra 25 e 34 anni in famiglie private con livello ISCED 2011 da 5 a 8. Media annua delle rilevazioni trimestrali EU Labour Force Survey.",
          en: "Percentage share (PC) of the population aged 25 to 34 in private households with ISCED 2011 levels 5 to 8. Annual average of quarterly EU Labour Force Survey data."
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
        searchAliases: "laurea laureati universita degree graduates university college",
        reading: {
          it: "Nel {year}, il {value}% delle persone in Italia tra 25 e 34 anni aveva completato un percorso di istruzione terziaria, universitario o equivalente.",
          en: "In {year}, {value}% of people in Italy aged 25 to 34 had completed university or an equivalent tertiary programme.",
          caution: {
            it: "La misura riguarda i residenti tra 25 e 34 anni e comprende lauree, dottorati e diplomi terziari non universitari (livelli ISCED 5–8).",
            en: "The measure covers residents aged 25 to 34 and includes university degrees, doctorates and short-cycle or vocational tertiary qualifications (ISCED levels 5–8)."
          }
        }
      }
    ]
  },
  {
    id: "edat_lfse_14",
    filters: {
      freq: ["A"],
      sex: ["T"],
      wstatus: ["POP"],
      age: ["Y18-24"],
      unit: ["PC"]
    },
    indicators: [
      {
        id: "early-school-leavers",
        section: "education",
        selector: {},
        title: { it: "Abbandono precoce dell’istruzione", en: "Early leaving from education and training" },
        plain: {
          it: "La quota dei giovani tra 18 e 24 anni con al massimo la scuola media che non studia e non segue formazione.",
          en: "The share of young people aged 18 to 24 with at most lower secondary education who are not in education or training."
        },
        technical: {
          it: "Quota percentuale (PC) delle persone tra 18 e 24 anni con al massimo un titolo ISCED 0–2 che non hanno partecipato a istruzione o formazione nelle quattro settimane precedenti l’indagine. Media annua delle rilevazioni trimestrali EU Labour Force Survey.",
          en: "Percentage share (PC) of people aged 18 to 24 with at most ISCED levels 0–2 who did not participate in education or training during the four weeks before the survey. Annual average of quarterly EU Labour Force Survey data."
        },
        unitKey: "percent",
        precision: 1,
        searchAliases: "abbandono scuola dispersione scolastica ragazzi lasciano diploma school dropouts early leaving",
        reading: {
          it: "Nel {year}, il {value}% delle persone in Italia tra 18 e 24 anni aveva al massimo la scuola media e non aveva partecipato a istruzione o formazione nelle quattro settimane precedenti l’indagine.",
          en: "In {year}, {value}% of people in Italy aged 18 to 24 had at most lower secondary education and had not taken part in education or training in the four weeks before the survey.",
          caution: {
            it: "Il denominatore è l’intera popolazione residente tra 18 e 24 anni; la misura combina il titolo di studio più alto conseguito e l’assenza di formazione nelle quattro settimane precedenti l’intervista.",
            en: "The denominator is the entire resident population aged 18 to 24; the measure combines highest educational attainment and non-participation in training during the four weeks before the interview."
          }
        }
      }
    ]
  },
  {
    id: "trng_lfse_01",
    filters: {
      freq: ["A"],
      unit: ["PC"],
      sex: ["T"],
      age: ["Y25-64"]
    },
    indicators: [
      {
        id: "adult-learning",
        section: "education",
        selector: {},
        title: { it: "Formazione degli adulti", en: "Adult learning" },
        plain: {
          it: "La quota delle persone tra 25 e 64 anni che ha partecipato a istruzione o formazione nelle quattro settimane precedenti.",
          en: "The share of people aged 25 to 64 who took part in education or training during the previous four weeks."
        },
        technical: {
          it: "Quota percentuale (PC) di partecipazione a istruzione o formazione formale o non formale nelle ultime quattro settimane tra 25 e 64 anni. Media annua delle rilevazioni trimestrali EU Labour Force Survey.",
          en: "Percentage share (PC) of participation in formal or non-formal education or training during the previous four weeks among people aged 25 to 64. Annual average of quarterly EU Labour Force Survey data."
        },
        unitKey: "percent",
        precision: 1,
        searchAliases: "formazione adulti corsi aggiornamento adult learning training courses",
        reading: {
          it: "Nel {year}, il {value}% delle persone in Italia tra 25 e 64 anni aveva partecipato a istruzione o formazione nelle quattro settimane precedenti l’indagine.",
          en: "In {year}, {value}% of people in Italy aged 25 to 64 had taken part in education or training in the four weeks before the survey.",
          caution: {
            it: "La rilevazione misura la partecipazione a corsi formali o non formali nelle quattro settimane precedenti l’intervista, non sull’intero anno solare.",
            en: "The survey measures participation in formal or non-formal education or training during the four weeks preceding the interview, not over the full calendar year."
          }
        }
      }
    ]
  },
  {
    id: "edat_lfse_20",
    filters: {
      freq: ["A"],
      sex: ["T"],
      age: ["Y15-29"],
      training: ["NO_FE_NO_NFE"],
      wstatus: ["NEMP"],
      unit: ["PC"]
    },
    indicators: [
      {
        id: "neet-rate",
        section: "education",
        selector: {},
        title: { it: "Giovani che non studiano e non lavorano", en: "Young people neither working nor studying" },
        plain: {
          it: "La quota delle persone tra 15 e 29 anni che non lavora e non segue istruzione o formazione.",
          en: "The share of people aged 15 to 29 who are not employed and are not in education or training."
        },
        technical: {
          it: "Quota percentuale (PC, tasso NEET) tra 15 e 29 anni. Comprende disoccupati e persone fuori dalla forza lavoro (NEMP) che non partecipano a istruzione o formazione formale o non formale (NO_FE_NO_NFE). Media annua delle rilevazioni trimestrali EU Labour Force Survey.",
          en: "Percentage share (PC, NEET rate) among people aged 15 to 29. It includes unemployed and inactive people (NEMP) not participating in formal or non-formal education or training (NO_FE_NO_NFE). Annual average of quarterly EU Labour Force Survey data."
        },
        unitKey: "percent",
        precision: 1,
        searchAliases: "giovani non studiano non lavorano neet young neither education employment training",
        reading: {
          it: "Nel {year}, il {value}% delle persone in Italia tra 15 e 29 anni non lavorava e non partecipava a istruzione o formazione.",
          en: "In {year}, {value}% of people in Italy aged 15 to 29 were neither employed nor in education or training.",
          caution: {
            it: "Il denominatore è l’intera popolazione giovanile tra 15 e 29 anni, e non la sola forza lavoro come nel tasso di disoccupazione giovanile.",
            en: "The denominator is the entire youth population aged 15 to 29, rather than only the labour force as in the youth unemployment rate."
          }
        }
      }
    ]
  },
  {
    id: "nrg_ind_ren",
    filters: {
      freq: ["A"],
      nrg_bal: ["REN"],
      unit: ["PC"]
    },
    indicators: [
      {
        id: "renewable-energy",
        section: "environment",
        selector: {},
        title: { it: "Energia da fonti rinnovabili", en: "Energy from renewable sources" },
        plain: {
          it: "La quota dei consumi finali lordi di energia coperta da fonti rinnovabili.",
          en: "The share of gross final energy consumption supplied by renewable sources."
        },
        technical: {
          it: "Quota percentuale (PC, bilancio REN) di energia rinnovabile sui consumi finali lordi annui di energia, calcolata secondo la metodologia della direttiva europea sulle rinnovabili vigente nell’anno.",
          en: "Percentage share (PC, balance REN) of renewable energy in annual gross final energy consumption, calculated under the methodology of the European renewable energy directive in force for the year."
        },
        unitKey: "percent",
        precision: 1,
        featured: true,
        definitionSourceUrl: "https://ec.europa.eu/eurostat/documents/d/energy/shares-manual",
        notes: [
          {
            type: "method_change",
            year: 2021,
            text: {
              it: "La serie cambia base normativa tra 2020 e 2021: fino al 2020 segue RED I, dal 2021 al 2024 RED II. Il grafico segnala questa discontinuità.",
              en: "The legal basis changes between 2020 and 2021: data follow RED I through 2020 and RED II from 2021 to 2024. The chart marks this discontinuity."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/documents/d/energy/shares-manual"
          },
          {
            type: "method_change",
            year: 2025,
            text: {
              it: "Dal 2025 il calcolo segue RED III. Il cambio delle regole può incidere sul confronto con gli anni precedenti.",
              en: "From 2025 calculations follow RED III. The change in rules can affect comparisons with earlier years."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/documents/d/energy/shares-manual"
          }
        ],
        searchAliases: "rinnovabili energia pulita solare eolica renewable clean energy solar wind",
        reading: {
          it: "Nel {year}, le fonti rinnovabili coprivano il {value}% dei consumi finali lordi di energia in Italia.",
          en: "In {year}, renewable sources supplied {value}% of gross final energy consumption in Italy.",
          caution: {
            it: "Il denominatore comprende tutti i consumi finali lordi di energia (elettricità, riscaldamento e raffrescamento, trasporti), non la sola generazione elettrica.",
            en: "The denominator covers all gross final energy consumption (electricity, heating and cooling, and transport), not electricity generation alone."
          }
        }
      }
    ]
  },
  {
    id: "cei_wm011",
    filters: {
      freq: ["A"],
      wst_oper: ["RCY"],
      unit: ["PC"]
    },
    indicators: [
      {
        id: "municipal-waste-recycling",
        section: "environment",
        selector: {},
        title: { it: "Riciclo dei rifiuti urbani", en: "Municipal waste recycling" },
        plain: {
          it: "La quota dei rifiuti prodotti da famiglie e attività simili che viene riciclata.",
          en: "The share of waste produced by households and similar activities that is recycled."
        },
        technical: {
          it: "Quota percentuale (PC, operazione RCY) dei rifiuti urbani riciclati e preparati per il riutilizzo divisi per i rifiuti urbani generati nell’anno solare, secondo il metodo Eurostat vigente per l’anno osservato.",
          en: "Percentage share (PC, operation RCY) of municipal waste recycled and prepared for reuse divided by municipal waste generated over the calendar year, under the Eurostat method applying to the observed year."
        },
        unitKey: "percent",
        precision: 1,
        notes: [
          {
            type: "scope",
            text: {
              it: "Le regole più recenti includono la preparazione per il riutilizzo. Cambi di metodo e regimi transitori possono incidere sui confronti tra anni e Paesi.",
              en: "The newer rules include preparing for reuse. Method changes and transitional regimes can affect comparisons across years and countries."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/cache/metadata/en/cei_wm011_esmsip2.htm"
          }
        ],
        searchAliases: "raccolta differenziata riciclaggio rifiuti recycling waste garbage rubbish",
        reading: {
          it: "Nel {year}, il riciclo riguardava il {value}% dei rifiuti urbani generati in Italia, secondo il metodo Eurostat applicabile a quell’anno.",
          en: "In {year}, recycling accounted for {value}% of municipal waste generated in Italy, under the Eurostat method applying to that year.",
          caution: {
            it: "La serie riguarda i soli rifiuti urbani (prodotti da famiglie e attività assimilabili) e non comprende i rifiuti speciali industriali o da costruzione e demolizione.",
            en: "The series covers municipal waste only (from households and similar sources) and excludes industrial or construction and demolition waste."
          }
        }
      }
    ]
  },
  {
    id: "sdg_13_10",
    originalInstitution: "European Environment Agency (EEA), based on UNFCCC reporting",
    filters: {
      freq: ["A"],
      src_crf: ["TOTX4_MEMO"],
      unit: ["I90"]
    },
    indicators: [
      {
        id: "greenhouse-gas-emissions",
        section: "environment",
        selector: {},
        title: { it: "Emissioni di gas serra rispetto al 1990", en: "Greenhouse gas emissions compared with 1990" },
        plain: {
          it: "Come sono cambiate le emissioni prodotte nel territorio rispetto al 1990. Il valore del 1990 è posto uguale a 100.",
          en: "How emissions produced within the territory have changed since 1990. The 1990 value is set to 100."
        },
        technical: {
          it: "Numero indice annuo (unità I90, base 1990 = 100) delle emissioni nette territoriali di gas serra (TOTX4_MEMO) secondo l’inventario UNFCCC, escluse le attività di uso del suolo, cambiamento di uso del suolo e foreste e, per i valori nazionali, l’aviazione e la navigazione internazionali.",
          en: "Annual index number (unit I90, base 1990 = 100) of net territorial greenhouse-gas emissions (TOTX4_MEMO) under the UNFCCC inventory, excluding land use, land-use change and forestry and, for national values, international aviation and navigation."
        },
        unitKey: "index_1990",
        precision: 1,
        notes: [
          {
            type: "scope",
            text: {
              it: "Eurostat diffonde il dato; la fonte originaria è EEA su inventari UNFCCC. Per questa selezione non esiste un aggregato UE con lo stesso perimetro, quindi il sito non ne costruisce uno.",
              en: "Eurostat disseminates the data; the original source is the EEA based on UNFCCC inventories. No EU aggregate with the same scope exists for this selection, so the site does not construct one."
            },
            sourceUrl: "https://ec.europa.eu/eurostat/cache/metadata/en/sdg_13_10_esmsip2.htm"
          }
        ],
        searchAliases: "co2 gas serra clima emissioni carbon greenhouse gases climate emissions",
        reading: {
          it: "Nel {year}, l’indice {value} indica emissioni italiane pari al {value}% del livello del 1990, entro il perimetro della serie.",
          en: "In {year}, an index of {value} means Italian emissions were {value}% of their 1990 level, within the scope of this series.",
          caution: {
            it: "Ogni Paese ha il proprio 1990 posto uguale a 100: l’indice misura la variazione rispetto alla base nazionale del 1990, non il volume assoluto di emissioni. La serie esclude uso del suolo e foreste, aviazione e navigazione internazionali.",
            en: "Each country’s own 1990 level is set to 100: the index measures the change relative to the national 1990 baseline, not absolute emissions. The series excludes land use and forestry, international aviation and international shipping."
          }
        }
      }
    ]
  }
];

export const allCatalogIndicators = datasetSpecs.flatMap(
  (dataset) => dataset.indicators,
);

export const indicatorReadings = Object.fromEntries(
  allCatalogIndicators
    .filter((indicator) => indicator.reading)
    .map((indicator) => [indicator.id, indicator.reading]),
);

export const annualChangeReadings = Object.fromEntries(
  allCatalogIndicators
    .filter((indicator) => indicator.annualChangeReading)
    .map((indicator) => [indicator.id, indicator.annualChangeReading]),
);

export const indicatorAliases = Object.fromEntries(
  allCatalogIndicators
    .filter((indicator) => indicator.searchAliases)
    .map((indicator) => [indicator.id, indicator.searchAliases]),
);
