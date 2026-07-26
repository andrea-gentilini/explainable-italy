# Metodo

## Obiettivo

Explainable Italy rende alcuni dati ufficiali sull’Italia più facili da trovare, leggere e confrontare. Il progetto non assegna punteggi e non propone conclusioni politiche.

## Fonti

La prima versione usa soltanto Eurostat. Questa scelta rende omogenei Italia, aggregato UE e Stati membri. Ogni indicatore include:

1. codice del dataset
2. collegamento al Data Browser
3. collegamento ai metadati
4. URL esatto usato per il download
5. data di aggiornamento comunicata dalla fonte
6. DOI
7. copia locale
8. impronta SHA256 della copia

Il manifest completo è in `data/manifest.json`.

## Geografie

La dashboard mostra:

1. Italia
2. Unione europea a 27 Paesi
3. mediana dei 27 Stati membri

Il valore UE è l’aggregato pubblicato da Eurostat quando disponibile. Un aggregato può essere una somma, una media ponderata o un altro valore costruito secondo la metodologia del dataset. Non va interpretato automaticamente come media aritmetica.

Se l’aggregato UE non è disponibile, viene calcolata la media aritmetica dei Paesi disponibili. In questo caso il metodo è visibile vicino al grafico.

La mediana è il valore centrale dopo avere ordinato i Paesi. Per un numero pari di valori è la media dei due valori centrali. Viene pubblicata soltanto quando sono presenti almeno 24 Stati su 27.

## Tempo

Le serie iniziano dal primo anno comune utile, mai prima del 2000. Non si riempiono anni mancanti con interpolazioni.

Il valore principale è il dato più recente che non porta un contrassegno Eurostat di stima o provvisorietà. Un dato successivo stimato o provvisorio appare separatamente.

I contrassegni di interruzione della serie restano visibili. In questi casi il confronto nel tempo richiede cautela.

## Trasformazioni

Il processo non arrotonda i dati grezzi. L’arrotondamento è applicato soltanto nella visualizzazione, con una precisione definita per ogni indicatore.

Per la domanda “dove vanno 100 euro di spesa pubblica” si usa il dataset COFOG con unità `PC_TOT`. Le dieci funzioni principali descrivono la quota percentuale della spesa complessiva delle Amministrazioni pubbliche. Il totale può differire da 100 di pochi decimi a causa dell’arrotondamento della fonte.

Il valore “vecchiaia” è una sottofunzione della protezione sociale. Non si somma alle dieci funzioni principali. Non coincide con tutta la spesa pensionistica.

## Controlli

`scripts/validate-data.mjs` verifica:

1. struttura e completezza dei 39 indicatori
2. presenza di testi italiani e inglesi
3. anni, valori e copertura geografica
4. ordinamento delle serie
5. corrispondenza tra indicatore e manifest
6. impronte SHA256 degli snapshot
7. coerenza dei file pubblici
8. somma delle dieci funzioni COFOG

I controlli automatici non sostituiscono la revisione editoriale e il confronto con il portale ufficiale.

## Revisioni

I dati ufficiali possono essere rivisti. Ogni aggiornamento ricostruisce snapshot, manifest, file elaborati e CSV. Le differenze restano nella cronologia Git, così è possibile vedere quali valori sono cambiati.

## Licenze e riuso

Il codice del progetto usa la licenza MIT. I dati mantengono le condizioni della fonte. Per Eurostat si applica la sua politica di riuso indicata nel manifest.
