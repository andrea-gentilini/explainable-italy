# Explainable Italy

Stai leggendo la versione in italiano. Switch to **[English](README.md)**.
**Sito web:** **[Italiano](https://andrea-gentilini.github.io/explainable-italy/) · [English](https://andrea-gentilini.github.io/explainable-italy/en/)**

Explainable Italy rende più facili da leggere, confrontare e verificare i dati ufficiali sull’Italia. Raccoglie **39 indicatori in 6 temi** a partire da **20 dataset ufficiali Eurostat** (e dell’Agenzia europea dell’ambiente per le emissioni di gas serra), affiancando a ogni numero il confronto con l’Unione europea, la serie storica dal 2000 e lo snapshot esatto usato per il calcolo.

È un progetto civico indipendente e open source (versione **1.0.0**), non un sito istituzionale ufficiale. Il sito ha l’italiano come lingua predefinita e una versione inglese completa.

![La dashboard di Explainable Italy](docs/images/dashboard.jpg)

---

## Dove iniziare

| Pubblico | Cosa trovi | Collegamenti |
| --- | --- | --- |
| **Visitatori e lettori** | Esplorazione dei 39 indicatori, guida alla lettura dei confronti, limiti dei dati e tutela della privacy | [Sito in italiano](https://andrea-gentilini.github.io/explainable-italy/) · [Come leggere i confronti](#per-chi-visita-il-sito--esplorare-e-leggere-i-confronti) |
| **Chi riusa i dati** | Download in CSV e JSON, snapshot originali Eurostat con impronta SHA256, metodologia e condizioni di riuso | [Pagina Fonti e download](https://andrea-gentilini.github.io/explainable-italy/sources/) · [`data/manifest.json`](data/manifest.json) · [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md#italiano) · [`DATA_LICENSE.md`](DATA_LICENSE.md#italiano) |
| **Chi contribuisce** | Segnalazione errori nei dati o nei link, proposte di nuove fonti, contributi al codice e manutenzione tecnica | [Contribuire](#per-chi-contribuisce--segnalazioni-codice-e-manutenzione-tecnica) · [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`SECURITY.md`](SECURITY.md#italiano) · [Istruzioni tecniche (EN)](README.md#for-technical-contributors--local-development-architecture-and-maintenance) |

---

## Per chi visita il sito — Esplorare e leggere i confronti

I sei temi coprono **conti pubblici**, **popolazione**, **lavoro ed economia**, **welfare e salute**, **istruzione**, **ambiente ed energia**. Puoi cercare un indicatore con parole comuni, selezionare un anno dal menu o dal grafico, consultare la serie storica completa in tabella e aprire la pagina di verifica della fonte per controllare definizioni, valori di tutti i Paesi UE e contrassegni di qualità. I link condivisi conservano l’anno selezionato e i filtri di ricerca.

Per esempio, puoi aprire la [speranza di vita nel 2010](https://andrea-gentilini.github.io/explainable-italy/data/life-expectancy/?year=2010) e [verificarne fonte e calcolo](https://andrea-gentilini.github.io/explainable-italy/data/life-expectancy/source/?year=2010).

### Come leggere i numeri

- **Italia e UE:** il valore UE è l’aggregato ufficiale pubblicato da Eurostat (`EU27_2020`) con lo stesso perimetro. Non è la media aritmetica semplice dei Paesi. Quando Eurostat non pubblica un aggregato confrontabile con la selezione nazionale, il sito non lo inventa e spiega perché manca.
- **Mediana dei Paesi UE:** ogni Stato membro disponibile ha lo stesso peso. Il calcolo include l’Italia e richiede almeno **24 degli attuali 27 Paesi dell’UE**. Il sito indica sempre quanti Paesi sono disponibili e quali mancano. È la mediana tra Paesi, non la mediana dei cittadini europei.
- **Anni e stato del dato:** Italia, aggregato UE e mediana sono sempre confrontati nello stesso anno e con la stessa selezione, mai prima del 2000. Ogni scheda si apre sull’ultimo anno italiano privo di contrassegni di stima (`e`), provvisorietà (`p`) o previsione (`f`), quando disponibile. Eventuali anni più recenti provvisori o stimati sono segnalati separatamente e selezionabili, mantenendo allineati scheda e pagina della fonte. L’assenza di contrassegni non esclude revisioni successive; i contrassegni dell’aggregato UE e dei singoli Paesi sono riportati a parte.
- **Perimetro e limiti:** il sito pubblica snapshot verificabili, non statistiche in tempo reale. Controlla sempre l’anno dell’osservazione, la data di aggiornamento del dataset comunicata da Eurostat e la data di acquisizione del progetto. Gli anni mancanti non vengono interpolati; revisioni e interruzioni di serie (`b`) possono influire sull’andamento nel tempo. Il progetto non assegna voti né propone classifiche o conclusioni causali.

### Indipendenza e privacy

Explainable Italy è un progetto indipendente: non rappresenta e non è approvato da Eurostat, dall’Agenzia europea dell’ambiente (EEA) o dalle altre istituzioni citate. Le spiegazioni accessibili sono parafrasi del progetto basate sulle definizioni ufficiali, sempre collegate alla fonte.

Quando configurato in fase di compilazione, il sito usa il beacon ufficiale di Cloudflare Web Analytics per misurare esclusivamente in forma aggregata visite, pagine consultate, provenienza del traffico, Paese, categoria di dispositivo o browser e tempi di caricamento. Non usa cookie di analytics, pubblicità, profilazione, fingerprinting, tracciamento tra siti, account utente o dati personali, e non registra le ricerche effettuate né conserva gli indirizzi IP dei visitatori. La preferenza tra tema chiaro e scuro resta salvata solo nel browser tramite `localStorage`. L’infrastruttura di hosting (GitHub Pages) può conservare i normali log tecnici di accesso; aprendo un link esterno verso una fonte ufficiale si visita il sito dell’istituzione corrispondente.

---

## Per chi riusa i dati — Fonti, download e licenze

I dati provengono da **20 dataset ufficiali diffusi da Eurostat** (per le emissioni di gas serra, la fonte originaria è la **European Environment Agency** sulla base degli inventari UNFCCC).

### File scaricabili e tracciabilità

Ogni valore pubblicato sul sito può essere scaricato e ricalcolato a partire dalle copie locali:

- **CSV del singolo indicatore:** `/data/indicators/<id>.csv` (scaricabile da ogni scheda indicatore e dalla relativa pagina di verifica), con l’intera serie storica di Italia, aggregato UE e mediana, unità di misura, codice dataset, copertura, Paesi mancanti e contrassegni.
- **Dataset completo in CSV e JSON:** [`public/data/dashboard.csv`](public/data/dashboard.csv) e [`public/data/dashboard.json`](public/data/dashboard.json) (entrambi scaricabili anche dalla [pagina Fonti](https://andrea-gentilini.github.io/explainable-italy/sources/)).
- **Registro delle fonti (`manifest.json`):** [`data/manifest.json`](data/manifest.json) (pubblicato anche in `/data/manifest.json`), che registra per ciascuno dei 20 dataset codice, titolo, link al Data Browser Eurostat, link ai metadati ufficiali, URL esatto della query API, DOI, data di aggiornamento della fonte, data di acquisizione, dimensione in byte e impronta SHA256.
- **Snapshot ufficiali grezzi:** [`data/raw/eurostat/`](data/raw/eurostat/) (scaricabili byte per byte da `/data/raw/eurostat/<code>.json`), contenenti le risposte JSON-stat esatte usate per generare il sito. I collegamenti all’API Eurostat corrente sono indicati separatamente perché la fonte può aggiornare i dati nel tempo.

### Metodologia e condizioni di riuso

- **Metodologia completa (IT / EN):** [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md#italiano) e pagina [Metodo](https://andrea-gentilini.github.io/explainable-italy/method/) del sito.
- **Licenze del codice e dei dati (IT / EN):** la licenza [MIT](LICENSE) copre il codice e la documentazione originale del progetto. I dati mantengono le condizioni delle fonti ufficiali (politica di riuso Eurostat e condizioni EEA); tutti i dettagli sono in [`DATA_LICENSE.md`](DATA_LICENSE.md#italiano). Per citare il progetto e i dataset sottostanti, consulta [`CITATION.cff`](CITATION.cff) e `data/manifest.json`.

---

## Per chi contribuisce — Segnalazioni, codice e manutenzione tecnica

Puoi contribuire in italiano o in inglese:

- **Segnalare un errore nei dati o nei collegamenti, proporre una fonte o suggerire un miglioramento:** usa i moduli nella pagina [Contribuisci](https://andrea-gentilini.github.io/explainable-italy/contribute/) oppure segui [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Possibili estensioni del catalogo (IT / EN):** consulta [`docs/ROADMAP.md`](docs/ROADMAP.md#italiano).
- **Sicurezza (IT / EN):** per segnalazioni di sicurezza e stato dell’audit sulle dipendenze, consulta [`SECURITY.md`](SECURITY.md#italiano).

### Istruzioni tecniche e manutenzione (unica fonte in inglese)

Per evitare di duplicare comandi CLI, requisiti di versione, variabili d’ambiente e procedure di automazione che rischierebbero di divergere nel tempo, la documentazione tecnica di sviluppo e manutenzione è mantenuta in un’unica versione in inglese:

- **Avvio locale, comandi di verifica, architettura e build:** consulta [`README.md` — For technical contributors](README.md#for-technical-contributors--local-development-architecture-and-maintenance).
- **Funzionamento degli aggiornamenti automatici settimanali dei dati e revisione delle pull request:** consulta [`docs/DATA_REFRESH.md`](docs/DATA_REFRESH.md).

Creato da [Andrea Gentilini](https://github.com/andrea-gentilini).
