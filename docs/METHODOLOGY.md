# Metodo / Methodology

**[Italiano](#italiano) · [English](#english)**

---

<a id="italiano"></a>

## Italiano

### Obiettivo

Explainable Italy rende alcuni dati ufficiali sull’Italia più facili da trovare, leggere e confrontare. Il progetto non assegna punteggi e non propone conclusioni politiche.

### Fonti

Il progetto usa dataset armonizzati diffusi da Eurostat. Per le emissioni di gas serra, Eurostat indica come fonte originaria la European Environment Agency (EEA) sulla base degli inventari UNFCCC. Ogni indicatore include:

1. codice del dataset
2. collegamento al Data Browser
3. collegamento ai metadati
4. URL esatto usato per il download
5. data di aggiornamento comunicata dalla fonte
6. DOI
7. copia locale
8. impronta SHA256 della copia
9. data di acquisizione del progetto
10. fonte originaria, quando diversa dall’istituzione che diffonde il dato

Il manifest completo è in `data/manifest.json` e nella copia scaricabile `public/data/manifest.json`. Ogni pagina fonte collega lo snapshot esatto usato dal sito, con dimensione e SHA256. La risposta API corrente è un collegamento distinto: può essere stata revisionata dopo l’acquisizione. Gli snapshot pubblici in `public/data/raw/eurostat/` sono identici, byte per byte, alle copie di lavoro.

### Geografie

La dashboard mostra, quando disponibili:

1. Italia
2. aggregato ufficiale dell’Unione europea a 27 Paesi
3. mediana degli Stati membri con dati disponibili

Il perimetro è quello dei 27 Stati membri attuali (`EU27_2020`), anche per gli anni precedenti alla loro adesione: non è la composizione storica dell’UE di ciascun anno. La mediana include l’Italia e assegna lo stesso peso a ogni Paese disponibile; non è la mediana delle persone residenti.

Il valore UE è l’aggregato pubblicato da Eurostat quando disponibile. Un aggregato può essere una somma, una media ponderata o un altro valore costruito secondo la metodologia del dataset. Non va interpretato automaticamente come media aritmetica.

Se non esiste un aggregato UE con lo stesso perimetro, il sito non ne costruisce uno. In quel caso mostra soltanto Italia e mediana e spiega brevemente perché manca il valore UE.

La mediana è il valore centrale dopo avere ordinato i Paesi disponibili. Per un numero pari di valori è la media dei due valori centrali. Viene pubblicata soltanto quando sono presenti almeno 24 Stati su 27. Il sito indica sempre la copertura effettiva, i Paesi mancanti e i contrassegni associati alle osservazioni nazionali.

### Tempo

Le serie iniziano dal primo anno con Italia e almeno 24 Stati membri disponibili, mai prima del 2000. Italia, UE e mediana sono sempre confrontate nello stesso anno e con la stessa selezione. Se un anno più recente ha meno di 24 Stati disponibili, il confronto resta all’ultimo anno che supera questa soglia. Non si riempiono anni mancanti con interpolazioni.

La homepage, il catalogo, la scheda dell’indicatore e la pagina della fonte si aprono inizialmente sul confronto più recente disponibile con copertura europea completa ($\ge 24$ Paesi su 27), indicato in `newerEstimate ?? latest`. Quando quell’osservazione ha un contrassegno `e` (stimato), `p` (provvisorio) o `f` (previsione), lo stato è dichiarato esplicitamente accanto al valore e un controllo immediato permette di passare con un clic all’ultimo anno privo di contrassegni provvisori o stimati (`latest`), conservando l’anno selezionato nei collegamenti tra scheda e fonte. L’assenza di questi contrassegni non significa che il dato non potrà essere rivisto. La selezione dello stato italiano non implica che tutti i Paesi o l’aggregato UE siano definitivi: i loro contrassegni restano indicati separatamente. La selezione considera sia i contrassegni delle singole osservazioni sia le note ufficiali che attribuiscono uno stato a un Paese o a un intero anno. Per questo la ripartizione COFOG italiana e l’aggregato UE del 2024 sono indicati come provvisori anche se il flag non compare nelle singole celle API. Lo stesso criterio si applica agli altri Paesi citati nelle note COFOG. In particolare, i gruppi di dettaglio della Bulgaria sono provvisori anche quando la singola cella non ha un flag; questa regola non viene estesa alle dieci divisioni principali. Il contrassegno originale (`sourceStatus`, oppure `euSourceStatus` per l’UE) resta conservato per Italia, UE e ciascun Paese, separatamente da quello integrato con i metadati (`status`). Le regole supplementari, limitate ai casi espliciti della fonte, sono in `scripts/metadata-rules.mjs`.

I contrassegni di interruzione della serie restano visibili sul singolo anno. Anche le discontinuità documentate soltanto nei metadati, come i passaggi da RED I a RED II nel 2021 e a RED III nel 2025 per le rinnovabili, vengono indicate separatamente. In questi casi il confronto nel tempo richiede cautela.

### Numeri indice, tassi di variazione e serie annuali

Il sito distingue esplicitamente tra numeri indice (ad esempio `UE = 100` o `1990 = 100`, riportati sempre con la rispettiva base accanto al valore) e tassi di variazione annui (`%`). Negli indicatori espressi come variazione annua percentuale (`inflation` e `real-gdp-growth-per-capita`), la scheda mostra sia il tasso di variazione annuo sia l’indice cumulato concatenato ($I_t = I_{t-1} \times (1 + r_t / 100)$), con la possibilità di passare dalla variazione annua all’indice cumulato e di cambiare l’anno base (`base = 100`) nel grafico storico e nella tabella. Tutte le serie del sito hanno frequenza annuale (`freq=A`): la destagionalizzazione (`SA`) e la correzione per i giorni lavorativi o di calendario (`WDA`), indispensabili nei confronti infra-annuali (mensili o trimestrali), non si applicano ai consuntivi annui strutturali qui pubblicati.

### Trasformazioni

I valori ufficiali non vengono cambiati. Gli snapshot normalizzano soltanto gli spazi finali della risposta HTTP prima di essere salvati e firmati con SHA256. L’arrotondamento è applicato nella visualizzazione, con una precisione definita per ogni indicatore. I risultati calcolati dal progetto, come la mediana, vengono serializzati senza artefatti della rappresentazione binaria.

Il valore italiano e l’aggregato UE ufficiale sono osservazioni della fonte. La mediana è un’elaborazione del progetto. La pagina di verifica separa queste operazioni e rende leggibili i valori nazionali utilizzati per ogni anno selezionabile, con la copertura effettiva. Il JSON conserva queste osservazioni per tutta la serie; i CSV, compresi quelli dei singoli indicatori, riportano unità, dataset, copertura e contrassegni.

Per la domanda “dove vanno 100 euro di spesa pubblica” si usa il dataset COFOG con unità `PC_TOT`. Le dieci funzioni principali descrivono la quota percentuale della spesa complessiva delle Amministrazioni pubbliche. Il totale può differire da 100 di pochi decimi a causa dell’arrotondamento della fonte.

Il valore “vecchiaia” è una sottofunzione della protezione sociale. Non si somma alle dieci funzioni principali. Non coincide con tutta la spesa pensionistica.

### Controlli

`scripts/validate-data.mjs` verifica:

1. struttura e completezza dei 39 indicatori
2. presenza di testi italiani e inglesi
3. anni, valori e copertura geografica
4. ordinamento delle serie
5. corrispondenza tra indicatore e manifest
6. impronte SHA256 degli snapshot
7. coerenza dei file pubblici
8. somma delle dieci funzioni COFOG
9. distinzione tra aggregato UE ufficiale e aggregato non disponibile
10. coerenza tra copertura, Paesi mancanti e osservazioni usate nella mediana
11. presenza delle fonti delle definizioni e delle note metodologiche
12. riproduzione di ogni valore Italia e UE, mediana, elenco dei Paesi e contrassegno originale dagli snapshot ufficiali
13. corrispondenza esatta del CSV con le serie pubblicate e selezione coerente dell’ultimo dato
14. osservazioni nazionali e contrassegni originali per ogni anno storico
15. identità byte per byte degli snapshot scaricabili e delle copie di lavoro

I controlli automatici non sostituiscono la revisione editoriale e il confronto con il portale ufficiale.

### Revisioni

I dati ufficiali possono essere rivisti. Ogni aggiornamento acquisisce tutte le fonti e prepara snapshot, manifest, file elaborati e CSV in un’area temporanea interna al progetto. Il validatore completo controlla questa versione candidata prima di sostituire i file: una richiesta fallita o una risposta incoerente interrompe l’aggiornamento e conserva i dati precedenti. Ogni file è sostituito atomicamente; se una normale operazione di scrittura fallisce, vengono ripristinati i file già sostituiti. Se anche il ripristino fallisce, i backup sono conservati e l’errore ne indica il percorso. Non si dichiara una transazione atomica tra tutti i file in caso di arresto forzato del processo. La modalità offline verifica le impronte degli snapshot e conserva le date di acquisizione originali; non dichiara un nuovo accesso alle fonti. Le date di acquisizione sono registrate per ciascun dataset in `data/manifest.json` e l’ultimo controllo riuscito in `.github/data-refresh-status.json`. Le differenze restano nella cronologia Git, così è possibile vedere quali valori sono cambiati.

### Definizioni e testi accessibili

I testi “sintesi accessibile” e “selezione tecnica” sono redatti dal progetto sulla base della metodologia ufficiale. Non sono citazioni letterali e non vengono presentati come tali. Ogni scheda collega la fonte utilizzata per verificarne perimetro e significato.

Quando una definizione ha limiti rilevanti — periodo di riferimento, popolazione esclusa, domanda auto-riferita, cambi di norma o problemi di comparabilità — questi compaiono nella scheda e nella pagina della fonte.

### Licenze e riuso

La licenza MIT riguarda il codice e la documentazione originale del progetto, non attribuisce una nuova licenza ai dati. I dati mantengono le condizioni della fonte. Si applicano la politica di riuso Eurostat e, per i dati di emissione originati da EEA, le condizioni EEA indicate nel manifest e in `DATA_LICENSE.md`.

Traduzioni, sintesi accessibili, mediane e altre elaborazioni sono prodotte da Explainable Italy. Eurostat, EEA e le altre istituzioni citate non ne sono responsabili.

### Fonti metodologiche ricontrollate

Le 20 selezioni API e le relative fonti metodologiche sono state verificate nella revisione del 14 ottobre 2026 e vengono rivalidate a ogni aggiornamento registrato in `data/manifest.json` e `.github/data-refresh-status.json`. La revisione metodologica mantiene separate le note della fonte e le elaborazioni del progetto. I [metadati COFOG](https://ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm), sezione 19, confermano lo stato provvisorio del 2024 per Italia e UE. Il [manuale SHARES](https://ec.europa.eu/eurostat/documents/d/energy/shares-manual), sezione 1.1, sostituisce il precedente collegamento ai metadati delle rinnovabili, non più disponibile, e documenta i tre regimi normativi. I [metadati sulle emissioni](https://ec.europa.eu/eurostat/cache/metadata/en/sdg_13_10_esmsip2.htm), sezione 6.1, confermano che l’aggregato UE disponibile altrove include trasporti internazionali e non è confrontabile con la selezione nazionale usata qui.

Eurostat conserva online la versione più recente dei dataset, senza versionare le risposte precedenti: le copie locali con impronta e data di acquisizione servono per riprodurre i confronti pubblicati. Si veda la [documentazione API Eurostat](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction).

---

<a id="english"></a>

## English

### Purpose

Explainable Italy makes selected official statistics on Italy easier to find, read and compare. The project does not assign scores and does not advocate policy conclusions.

### Sources

The project uses harmonised datasets published by Eurostat. For greenhouse-gas emissions, Eurostat identifies the European Environment Agency (EEA) as the original source based on UNFCCC inventories. Every indicator records:

1. dataset code
2. link to the Eurostat Data Browser
3. link to official metadata
4. exact API URL used for acquisition
5. dataset update date reported by the source
6. permanent identifier (DOI)
7. local snapshot copy
8. SHA256 checksum of the local copy
9. project acquisition date
10. original institution, when different from the disseminating institution

The full source register is stored in `data/manifest.json` and exported as `public/data/manifest.json`. Every indicator verification page links to the exact snapshot used by the site, alongside its byte size and SHA256 checksum. The live API response is linked separately, as the source may have revised it after acquisition. The public snapshots in `public/data/raw/eurostat/` are byte-for-byte identical to the working copies.

### Geographies

Where available, each comparison shows:

1. Italy
2. the official European Union aggregate of 27 countries
3. the median across Member States with available data

The geographical scope is the current 27 Member States (`EU27_2020`), including for years prior to accession; it does not represent the historical composition of the EU in each year. The median includes Italy and gives equal weight to each available country; it is not the median of resident individuals.

The EU value is the official aggregate published by Eurostat when available. Depending on the dataset methodology, an aggregate may be a sum, a weighted average or another official composite measure; it should not automatically be read as an unweighted arithmetic mean.

When Eurostat does not publish an EU aggregate with the same scope, the site does not fabricate one. Instead, it shows only Italy and the country median and explains why the EU aggregate is absent.

The median is the central value after sorting available countries. When the number of available countries is even, it is the average of the two central values. It is published only when at least 24 out of 27 Member States have data for that year. The site always reports the exact country coverage, any missing countries and the flags attached to national observations.

### Time and year selection

Series start in the first year from 2000 onwards in which Italy and at least 24 Member States have data. Italy, the EU aggregate and the median are always compared in the same year and using the same selection. If a more recent year has fewer than 24 available Member States, the comparison stays on the latest year meeting that threshold. Missing years are never filled by interpolation.

The homepage, catalogue, indicator cards and source verification pages open by default on the most recent available comparison year with full European coverage ($\ge 24$ of 27 countries), recorded as `newerEstimate ?? latest`. When that observation carries an `e` (estimated), `p` (provisional) or `f` (forecast) flag, its status is stated explicitly next to the value and a one-click control lets the reader switch to the latest year without provisional or estimated flags (`latest`), preserving the selected year across indicator and source links. The absence of a flag does not guarantee that a figure will never be revised. Selecting a non-provisional Italian year does not imply that every other Member State or the EU aggregate is final: their flags remain reported separately. Status evaluation combines observation-level flags with official metadata notes that assign a status to a country or an entire year. Accordingly, the 2024 Italian COFOG breakdown and EU aggregate are marked as provisional even where individual API cells do not carry the flag. The same rule applies to other countries listed in the COFOG metadata notes; specifically, Bulgaria’s detailed COFOG groups are marked provisional even when an individual cell is unflagged, without extending that rule to the ten main divisions. The raw flag from the API (`sourceStatus`, or `euSourceStatus` for the EU) is preserved alongside the metadata-supplemented `status`. These explicit metadata rules live in `scripts/metadata-rules.mjs`.

Series-break flags (`b`) remain visible on the affected year. Methodological discontinuities documented in official metadata—such as the transitions from RED I to RED II in 2021 and to RED III in 2025 for renewable energy—are also disclosed separately. Comparisons across such breaks require caution.

### Index numbers, rates of change and annual series

The site explicitly distinguishes index numbers (such as `EU = 100` or `1990 = 100`, always formatted with their base beside the value) from annual rates of change (`%`). For indicators expressed as an annual percentage rate of change (`inflation` and `real-gdp-growth-per-capita`), the indicator page displays both the annual rate and the chain-linked cumulative index ($I_t = I_{t-1} \times (1 + r_t / 100)$), with controls to toggle between the annual rate and the cumulative index and to rebase (`base = 100`) the historical chart and table to any year. All series on the site have annual frequency (`freq=A`): seasonal adjustment (`SA`) and working-day or calendar adjustment (`WDA`), which are essential in sub-annual (monthly or quarterly) comparisons, do not apply to the structural annual figures published here.

### Transformations

Official values are not altered. Snapshots only normalise trailing whitespace from the HTTP response before being saved and hashed with SHA256. Rounding is applied only for display, using a fixed precision per indicator. Project-calculated figures such as the median are serialised without binary floating-point artefacts.

The Italian value and the official EU aggregate come directly from the source. The median is calculated by the project. Each verification page separates these steps and lists the national observations used for any selectable year, together with actual country coverage. The processed JSON retains these observations across the full series; the CSV files, including per-indicator CSVs, include units, dataset codes, coverage and quality flags.

For the “How is €100 of public spending allocated?” view, the site uses the COFOG dataset with unit `PC_TOT`. The ten main divisions represent shares of total general government expenditure. Their sum may differ from 100 by a few tenths due to source rounding.

The “old age” figure (`GF1002`) is a sub-function of social protection (`GF10`). It is not added to the ten main divisions, and its scope differs from total pension expenditure measured in ESSPROS.

### Automated checks

`scripts/validate-data.mjs` verifies:

1. structure and completeness of all 39 indicators
2. presence of Italian and English texts
3. years, values and geographical coverage
4. chronological ordering of series
5. consistency between indicators and `data/manifest.json`
6. SHA256 checksums of all snapshots
7. consistency between working files and public downloads
8. sum of the ten main COFOG divisions
9. distinction between official EU aggregates and unavailable aggregates
10. consistency across coverage counts, missing-country lists and median inputs
11. presence of definition sources and methodological note URLs
12. exact reproduction of every Italian value, EU aggregate, median, country list and raw flag from the official snapshots
13. exact match between CSV exports and published series, including default-year selection
14. national observations and raw flags across all historical years
15. byte-for-byte identity between downloadable public snapshots and working copies

Automated validation complements, and does not replace, editorial review against the official portal.

### Revisions and updates

Official statistics are subject to revision. Each refresh fetches all sources and stages snapshots, manifest, processed JSON and CSV files in a temporary directory inside the project. The full validator checks this candidate set before any published file is replaced: a failed request or inconsistent response aborts the update and leaves existing files untouched. Files are replaced atomically; if a write error occurs during replacement, already-replaced files are rolled back. Offline mode verifies snapshot checksums and preserves original acquisition dates without claiming a new source access. Acquisition dates for each dataset are recorded in `data/manifest.json` and the latest successful check is recorded in `.github/data-refresh-status.json`. All changes remain in Git history so revisions can be inspected over time.

### Accessible definitions and wording

The “accessible summary” and “technical selection” texts are written by the project on the basis of official methodology. They are project paraphrases, not verbatim quotes, and are explicitly labelled as such. Every indicator links to the official source used to verify scope and definition.

Whenever a definition involves material caveats—reference period, excluded population, self-reported survey items, regulatory changes or comparability limits—these are shown on both the indicator card and the verification page.

### Licences and reuse

The MIT licence covers the project’s original code and documentation; it does not grant a new licence over third-party data. Underlying data remain subject to the source terms: the Eurostat reuse policy and, for emissions data originating from the EEA, the EEA terms referenced in `data/manifest.json` and `DATA_LICENSE.md`.

Translations, accessible summaries, medians and other project calculations are produced by Explainable Italy. Eurostat, the EEA and the other cited institutions are not responsible for them.

### Reviewed methodological sources

The 20 API selections and linked methodological sources were reviewed on 14 October 2026 and are re-validated on every data refresh recorded in `data/manifest.json` and `.github/data-refresh-status.json`. Source notes and project calculations are kept strictly separate. The [COFOG metadata](https://ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm) (section 19) confirm the provisional status of 2024 data for Italy and the EU. The [SHARES manual](https://ec.europa.eu/eurostat/documents/d/energy/shares-manual) (section 1.1) replaces the retired renewable-energy metadata URL and documents the three regulatory regimes. The [greenhouse-gas emissions metadata](https://ec.europa.eu/eurostat/cache/metadata/en/sdg_13_10_esmsip2.htm) (section 6.1) confirm that the EU aggregate published in other tables includes international aviation and maritime transport and is therefore not comparable with the national selection used here.

Eurostat serves only the latest version of each dataset online without versioning prior API responses; local snapshots with SHA256 checksums and acquisition dates allow published comparisons to be reproduced. See the [Eurostat API documentation](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction).
