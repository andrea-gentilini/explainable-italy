# Dati, attribuzione e riuso / Data, attribution and reuse

**[Italiano](#italiano) · [English](#english)**

---

<a id="italiano"></a>

## Italiano

La licenza MIT in `LICENSE` riguarda il codice e la documentazione originale di Explainable Italy. Non sostituisce e non amplia le condizioni applicabili ai dati di terzi.

### Eurostat

I dataset utilizzati sono diffusi da Eurostat. Per ogni dataset, `data/manifest.json` conserva:

1. codice e titolo;
2. collegamento al Data Browser;
3. URL esatto della selezione API;
4. DOI;
5. data di aggiornamento comunicata dalla fonte;
6. data di acquisizione del progetto;
7. impronta SHA256 e dimensione della copia locale;
8. percorso dello snapshot esatto scaricabile dal sito.

Gli snapshot scaricabili sono copie delle selezioni ufficiali conservate dal progetto. I CSV e i JSON elaborati includono i riferimenti al dataset; i CSV dei singoli indicatori mantengono anche l’unità di misura.

Si applica la [politica di riuso Eurostat](https://ec.europa.eu/eurostat/help/copyright-notice).

Explainable Italy seleziona le osservazioni necessarie, traduce e parafrasa alcune definizioni, arrotonda i valori per la visualizzazione e calcola la mediana dei Paesi disponibili. Queste modifiche sono indicate nel sito e nella metodologia.

Eurostat non è responsabile di traduzioni, sintesi accessibili, mediane, presentazione o altre elaborazioni prodotte da Explainable Italy.

### European Environment Agency

Per il dataset Eurostat `sdg_13_10` e per l’inventario `env_air_gge`, i metadati indicano come fonte originaria la European Environment Agency (EEA), sulla base degli inventari UNFCCC.

Si applicano anche le [condizioni di riuso EEA](https://www.eea.europa.eu/en/legal-notice). La fonte viene attribuita nella scheda, nella pagina di verifica, nella pagina Fonti e nel manifest.

### Verifica

Il manifest (`data/manifest.json`, pubblicato anche in `/data/manifest.json`) è la fonte tecnica principale per attribuzione e data di accesso. In caso di differenza tra questo riepilogo e le condizioni pubblicate dall’istituzione originaria, prevalgono le condizioni della fonte.

---

<a id="english"></a>

## English

The MIT licence in `LICENSE` applies to Explainable Italy’s original code and documentation. It does not replace or broaden the terms governing third-party data.

### Eurostat

The datasets used on this site are disseminated by Eurostat. For every dataset, `data/manifest.json` records:

1. dataset code and title;
2. link to the Eurostat Data Browser;
3. exact API selection URL;
4. permanent identifier (DOI);
5. dataset update date reported by the source;
6. project acquisition date;
7. SHA256 checksum and byte size of the local copy;
8. path to the exact snapshot downloadable from the site.

The downloadable snapshots are local copies of the official API selections retained by the project for reproducibility. Processed CSV and JSON exports include dataset identifiers, and per-indicator CSVs also include the unit of measure.

The [Eurostat copyright notice and reuse policy](https://ec.europa.eu/eurostat/help/copyright-notice) applies.

Explainable Italy selects the relevant observations, translates and paraphrases definitions into accessible summaries, rounds values for presentation and calculates the median across available EU Member States. These project calculations and paraphrases are explicitly identified on the site and in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

Eurostat is not responsible for translations, accessible summaries, medians, presentation or any other processing carried out by Explainable Italy.

### European Environment Agency

For Eurostat datasets `sdg_13_10` and `env_air_gge`, the official metadata identify the European Environment Agency (EEA), based on UNFCCC inventories, as the original source.

The [EEA legal notice and reuse terms](https://www.eea.europa.eu/en/legal-notice) also apply. The original source is attributed on the indicator card, on the source verification page, on the Sources page and in `data/manifest.json`.

### Verification

The source manifest (`data/manifest.json`, also published at `/data/manifest.json`) is the primary technical record for attribution and access dates. In the event of any discrepancy between this summary and the terms published by the originating institution, the source institution’s terms prevail.
