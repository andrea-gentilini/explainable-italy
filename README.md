# Explainable Italy

> L’Italia, i dati ufficiali per tutti.

Explainable Italy è un sito bilingue open source che rende leggibili alcuni dati essenziali sull’Italia senza interpretarli. Ogni indicatore mostra la fonte ufficiale, una sintesi accessibile del progetto basata sulla metodologia della fonte, la selezione tecnica, la serie storica e un confronto europeo.

Il progetto è in sviluppo aperto. Dati, elaborazioni e limiti metodologici possono essere verificati nella repository.

## Cosa contiene

La prima versione include 39 indicatori in sei aree:

1. spesa pubblica e finanza pubblica
2. popolazione e demografia
3. lavoro ed economia
4. protezione sociale e salute
5. istruzione e competenze
6. ambiente ed energia

I dataset sono diffusi da Eurostat; per le emissioni la fonte originaria indicata nei metadati è EEA su inventari UNFCCC. Il sito usa l’aggregato UE ufficiale quando esiste e calcola la mediana quando sono disponibili almeno 24 Stati membri su 27. Se non esiste un aggregato UE con lo stesso perimetro, non ne costruisce uno.

## Come usare il sito

Dalla homepage puoi aprire uno dei quattro numeri principali o esplorare un tema. La ricerca riconosce testi italiani e inglesi anche senza accenti; i filtri permettono di restringere i risultati.

Ogni scheda mostra il valore italiano, l’anno e il confronto europeo dello stesso anno. Se c’è un valore successivo provvisorio o stimato, resta distinto: puoi sceglierlo dal menu dell’anno e aprire la fonte corrispondente. Il grafico e la tabella riportano l’intera serie pubblicata, con gli anni mancanti lasciati vuoti e i contrassegni della fonte indicati.

Tema, ricerca e anno sono conservati nel collegamento: puoi tornare ai risultati, cambiare lingua o condividere la pagina senza perdere il contesto. I dati si possono scaricare dalla scheda o dalla pagina delle fonti.

## Principi editoriali

1. Solo fonti istituzionali e dati riproducibili.
2. Nessun confronto scelto per sostenere una tesi.
3. Il dato definitivo è quello principale.
4. Stime, valori provvisori, interruzioni e differenze di definizione sono segnalati.
5. Le serie iniziano dall’anno comune disponibile, mai prima del 2000.
6. Le sintesi accessibili sono parafrasi del progetto basate sulle definizioni ufficiali e collegate alla fonte.
7. Le trasformazioni sono documentate e verificabili.
8. Il progetto non integra tracciamento, profilazione, analytics o cookie.

Il metodo completo è in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

## Dati nella repository

Le copie locali sono intenzionalmente piccole. Contengono soltanto le serie usate dal sito.

1. `data/raw/eurostat` conserva le risposte ufficiali ridotte alle geografie e alle variabili necessarie.
2. `data/processed/dashboard.json` contiene i dati pronti per l’interfaccia.
3. `data/manifest.json` registra URL, data di aggiornamento, DOI, dimensione e impronta SHA256 di ogni fonte.
4. `public/data` contiene i file scaricabili dal sito.

L’intero pacchetto dati e le copie pubbliche occupano circa 2 MB nella repository.

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

## Pubblicazione

Il progetto produce un sito statico compatibile con GitHub Pages. In una pubblicazione su `andrea-gentilini.github.io/explainable-italy` la build dovrà impostare:

```bash
NEXT_PUBLIC_BASE_PATH=/explainable-italy pnpm build
```

Prima di ogni pubblicazione va eseguito `pnpm data:update` in un ambiente con accesso alla rete, seguito da `pnpm test`.

## Contribuire

Explainable Italy è open source e ogni contributo è benvenuto: segnalazioni, nuove fonti pubbliche, testi, traduzioni, accessibilità o codice. Le informazioni essenziali sono in [CONTRIBUTING.md](CONTRIBUTING.md).

La licenza [MIT](LICENSE) riguarda il codice e la documentazione originale. I dataset conservano le condizioni delle rispettive fonti, riepilogate in [DATA_LICENSE.md](DATA_LICENSE.md).

Creato da Andrea Gentilini.
