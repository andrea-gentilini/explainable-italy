# Explainable Italy

> L’Italia, i dati ufficiali per tutti.

Explainable Italy è una dashboard bilingue che rende leggibili alcuni dati essenziali sull’Italia senza interpretarli. Ogni indicatore mostra la fonte ufficiale, la definizione ufficiale in forma accessibile e tecnica, la serie storica e un confronto con Unione europea e mediana dei 27 Paesi.

Il progetto è un prototipo privato. Non è ancora pubblicato online.

## Cosa contiene

La prima versione include 39 indicatori in sei aree:

1. spesa pubblica e finanza pubblica
2. popolazione e demografia
3. lavoro ed economia
4. protezione sociale e salute
5. istruzione e competenze
6. ambiente ed energia

Tutti i dati provengono da Eurostat. Il sito usa l’aggregato UE ufficiale quando esiste. Calcola la mediana sui 27 Stati membri quando sono disponibili almeno 24 valori. Se l’aggregato ufficiale non è pubblicato per una serie, calcola e segnala la media aritmetica dei Paesi disponibili.

## Principi editoriali

1. Solo fonti istituzionali e dati riproducibili.
2. Nessun confronto scelto per sostenere una tesi.
3. Il dato definitivo è quello principale.
4. Stime e valori provvisori sono separati e segnalati.
5. Le serie iniziano dall’anno comune disponibile, mai prima del 2000.
6. Le definizioni ufficiali sono attribuite alla fonte e presentate anche in linguaggio accessibile, senza interpretazioni.
7. Le trasformazioni sono documentate e verificabili.
8. Nessun tracciamento, profilazione o cookie.

Il metodo completo è in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

## Dati nella repository

Le copie locali sono intenzionalmente piccole. Contengono soltanto le serie usate dal sito.

1. `data/raw/eurostat` conserva le risposte ufficiali ridotte alle geografie e alle variabili necessarie.
2. `data/processed/dashboard.json` contiene i dati pronti per l’interfaccia.
3. `data/manifest.json` registra URL, data di aggiornamento, DOI, dimensione e impronta SHA256 di ogni fonte.
4. `public/data` contiene i file scaricabili dal sito.

L’intero pacchetto dati occupa circa 1,1 MB nella repository.

## Sviluppo locale

Requisiti: Node.js 22.13 o successivo e pnpm 11.

```bash
pnpm install
pnpm dev
```

Il sito italiano è disponibile su `http://localhost:3000/`. La versione inglese è su `http://localhost:3000/en/`.

Comandi utili:

```bash
pnpm validate:data
pnpm lint
pnpm test
pnpm data:update
pnpm data:update:offline
```

`data:update` scarica nuove copie da Eurostat e ricostruisce i file pubblici. `data:update:offline` ricostruisce tutto usando gli snapshot già presenti.

## Pubblicazione futura

Il progetto produce un sito statico compatibile con GitHub Pages. In una pubblicazione su `andrea-gentilini.github.io/explainable-italy` la build dovrà impostare:

```bash
NEXT_PUBLIC_BASE_PATH=/explainable-italy pnpm build
```

La pubblicazione non è attiva. Prima di renderla pubblica vanno completati una revisione editoriale e un controllo indipendente dei dati.

## Contribuire

Le regole per proposte, fonti e revisioni sono in [CONTRIBUTING.md](CONTRIBUTING.md). Il progetto usa la licenza [MIT](LICENSE).

Responsabile del progetto: Andrea Gentilini.
