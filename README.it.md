# Explainable Italy

[Apri il sito](https://andrea-gentilini.github.io/explainable-italy/) · [Read in English](README.md)

Explainable Italy rende più facili da leggere e verificare i dati ufficiali sull’Italia. Esplora **39 indicatori in sei temi**, confronta l’Italia con l’aggregato UE ufficiale e la mediana dei Paesi, e risali alla fonte di ogni numero.

È un progetto indipendente e open source, non un sito istituzionale ufficiale. La versione **1.0.0** è disponibile in italiano e inglese.

![La dashboard di Explainable Italy](docs/images/dashboard.jpg)

## Esplora

I sei temi comprendono conti pubblici, popolazione, lavoro ed economia, welfare e salute, istruzione, ambiente ed energia. Cerca un indicatore, scegli un anno, consulta la serie storica oppure apri la pagina della fonte per verificare definizioni, osservazioni nazionali e contrassegni di qualità. I collegamenti condivisibili conservano l’anno selezionato e il contesto di ricerca.

Per esempio, apri la [speranza di vita nel 2010](https://andrea-gentilini.github.io/explainable-italy/data/life-expectancy/?year=2010) e [verificane fonte e calcolo](https://andrea-gentilini.github.io/explainable-italy/data/life-expectancy/source/?year=2010).

Scarica un indicatore in CSV, l’intero insieme di dati in CSV o JSON, oppure lo snapshot esatto della fonte usato dal sito. Gli snapshot sono accompagnati da impronta SHA256 e data di acquisizione; i collegamenti all’API Eurostat corrente sono indicati separatamente.

## Come leggere i confronti

- **Italia e UE:** il valore UE è l’aggregato ufficiale Eurostat con lo stesso perimetro. Non è la media semplice dei Paesi. Se manca un aggregato confrontabile, il sito non lo ricostruisce.
- **Mediana dei Paesi:** ciascun Paese disponibile ha lo stesso peso. Il calcolo comprende l’Italia e richiede almeno **24 degli attuali 27 Stati membri dell’UE**. Copertura e Paesi mancanti sono visibili. Non è la mediana delle persone residenti in Europa.
- **Anni e stato:** i confronti usano lo stesso anno e la stessa selezione, mai prima del 2000. Il dato iniziale è l’ultima osservazione italiana senza contrassegni di stima, provvisorietà o previsione, quando disponibile. Le osservazioni successive con contrassegni restano distinte e selezionabili. L’assenza di flag non garantisce che un dato sia definitivo; i contrassegni UE e nazionali sono indicati separatamente.
- **Limiti:** il sito pubblica snapshot, non statistiche in tempo reale. Controlla anno dell’osservazione, aggiornamento della fonte e data di acquisizione. Gli anni mancanti non vengono interpolati; revisioni e discontinuità metodologiche possono incidere sulle tendenze. Il progetto non propone classifiche tra Paesi né conclusioni causali.

I dati provengono da **20 dataset ufficiali diffusi da Eurostat**. Per le emissioni di gas serra, la fonte originaria è la European Environment Agency, sulla base degli inventari UNFCCC. Le spiegazioni accessibili e le traduzioni sono parafrasi del progetto, collegate alle definizioni ufficiali.

Leggi la [metodologia](docs/METHODOLOGY.md), consulta il [manifest delle fonti](data/manifest.json), oppure apri le pagine [metodo](https://andrea-gentilini.github.io/explainable-italy/method/) e [fonti](https://andrea-gentilini.github.io/explainable-italy/sources/) del sito.

## Avvio locale

Servono **Node.js 22.13 o successivo** e **pnpm 11.9.0**.

```sh
git clone https://github.com/andrea-gentilini/explainable-italy.git
cd explainable-italy
pnpm install --frozen-lockfile
pnpm dev
```

Apri [localhost:3000](http://localhost:3000/) per l’italiano oppure [localhost:3000/en/](http://localhost:3000/en/) per l’inglese. Gli snapshot inclusi sono sufficienti: per avviare o compilare il sito non occorre scaricare nuovamente le fonti.

```sh
pnpm check                  # Lint, validazione dati, build e test delle pagine esportate
pnpm validate:data          # Riproduce i valori e controlla snapshot e download
pnpm data:update            # Acquisisce tutte le selezioni ufficiali; richiede la rete
pnpm data:update:offline    # Ricostruisce dagli snapshot, conservando le date di acquisizione
```

L’aggiornamento valida l’intera versione candidata prima di sostituire i file pubblicati. Controlla le differenze prima di fare commit: le nuove osservazioni possono accompagnarsi a revisioni degli anni precedenti. A parità di codice e snapshot, la ricostruzione offline è deterministica.

## Architettura e privacy

Next.js e React producono un’**esportazione statica** in `out/`. Ricerca, selezione dell’anno e grafici funzionano nel browser; consultare il sito non richiede un database o un’API statistica attiva.

| Percorso | Contenuto |
| --- | --- |
| `app/` | Pagine bilingui, interfaccia e verifica delle fonti |
| `scripts/` | Acquisizione, trasformazioni e validazione dei dati |
| `data/raw/eurostat/` | Selezioni ufficiali esatte e limitate ai dati necessari |
| `data/processed/` e `data/manifest.json` | Dati per l’interfaccia e provenienza delle fonti |
| `public/data/` | Snapshot, JSON e CSV scaricabili |
| `tests/` | Test di regressione della pipeline dati e delle pagine esportate |

Il progetto non aggiunge analytics, pubblicità, cookie di tracciamento o account utente. La preferenza del tema viene salvata localmente nel browser tramite `localStorage`. GitHub Pages può conservare normali log tecnici di hosting; seguendo un collegamento esterno si apre il sito dell’istituzione interessata.

## Pubblicazione e aggiornamento

Compila per il percorso del progetto su GitHub Pages:

```sh
NEXT_PUBLIC_BASE_PATH=/explainable-italy pnpm check
```

Il controllo include la build di produzione. Per ricompilare separatamente una versione già verificata:

```sh
NEXT_PUBLIC_BASE_PATH=/explainable-italy pnpm build
```

Il workflow [Verify and deploy](.github/workflows/ci.yml) verifica le pull request e `main`. La pubblicazione da `main` parte soltanto dopo il superamento dei controlli e dell’audit delle dipendenze di produzione; distribuisce l’esportazione statica verificata.

Il workflow manuale [Propose a data refresh](.github/workflows/refresh-data.yml) acquisisce le fonti, esegue i controlli e produce un artefatto `validated-data-refresh` contenente `data-refresh.patch`. Non esegue commit e non pubblica automaticamente l’aggiornamento. La patch va verificata e applicata attraverso il normale percorso di contribuzione.

## Contributi e riuso

Segnala un problema nei dati, migliora una spiegazione o una traduzione, oppure contribuisci ad accessibilità e codice. Per le modifiche ai dati, includi una fonte ufficiale. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) e [SECURITY.md](SECURITY.md).

La licenza [MIT](LICENSE) riguarda codice e documentazione originale. I dati di terzi conservano le condizioni della fonte: vedi [DATA_LICENSE.md](DATA_LICENSE.md). Eurostat ed EEA non sono responsabili delle traduzioni, delle sintesi o delle mediane calcolate dal progetto.

Creato da [Andrea Gentilini](https://github.com/andrea-gentilini).
