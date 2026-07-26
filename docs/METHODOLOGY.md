# Metodo

## Obiettivo

Explainable Italy rende alcuni dati ufficiali sull’Italia più facili da trovare, leggere e confrontare. Il progetto non assegna punteggi e non propone conclusioni politiche.

## Fonti

La prima versione usa dataset diffusi da Eurostat. Per le emissioni di gas serra, Eurostat indica come fonte originaria EEA sulla base degli inventari UNFCCC. Ogni indicatore include:

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

Il manifest completo è in `data/manifest.json`.

## Geografie

La dashboard mostra, quando disponibili:

1. Italia
2. aggregato ufficiale dell’Unione europea a 27 Paesi
3. mediana degli Stati membri con dati disponibili

Il valore UE è l’aggregato pubblicato da Eurostat quando disponibile. Un aggregato può essere una somma, una media ponderata o un altro valore costruito secondo la metodologia del dataset. Non va interpretato automaticamente come media aritmetica.

Se non esiste un aggregato UE con lo stesso perimetro, il sito non ne costruisce uno. In quel caso mostra soltanto Italia e mediana e spiega brevemente perché manca il valore UE.

La mediana è il valore centrale dopo avere ordinato i Paesi disponibili. Per un numero pari di valori è la media dei due valori centrali. Viene pubblicata soltanto quando sono presenti almeno 24 Stati su 27. Il sito indica sempre la copertura effettiva, i Paesi mancanti e i contrassegni associati alle osservazioni nazionali.

## Tempo

Le serie iniziano dal primo anno comune utile, mai prima del 2000. Non si riempiono anni mancanti con interpolazioni.

Il valore principale è il dato più recente che non porta un contrassegno Eurostat di stima o provvisorietà. Un dato successivo stimato o provvisorio appare separatamente. La selezione considera sia i contrassegni delle singole osservazioni sia le note ufficiali che attribuiscono uno stato a un Paese o a un intero anno. Per questo la ripartizione COFOG italiana del 2024 è indicata come provvisoria anche se il flag non compare nelle singole celle API.

I contrassegni di interruzione della serie restano visibili sul singolo anno. Anche le discontinuità documentate soltanto nei metadati, come il passaggio da RED I a RED II per le rinnovabili, vengono indicate separatamente. In questi casi il confronto nel tempo richiede cautela.

## Trasformazioni

I valori ufficiali non vengono cambiati. Gli snapshot normalizzano soltanto gli spazi finali della risposta HTTP prima di essere salvati e firmati con SHA256. L’arrotondamento è applicato nella visualizzazione, con una precisione definita per ogni indicatore. I risultati calcolati dal progetto, come la mediana, vengono serializzati senza artefatti della rappresentazione binaria.

Il valore italiano e l’aggregato UE ufficiale sono osservazioni della fonte. La mediana è un’elaborazione del progetto. La pagina di verifica separa queste operazioni e rende leggibili anche i 27 valori nazionali utilizzati.

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
9. distinzione tra aggregato UE ufficiale e aggregato non disponibile
10. coerenza tra copertura, Paesi mancanti e osservazioni usate nella mediana
11. presenza delle fonti delle definizioni e delle note metodologiche

I controlli automatici non sostituiscono la revisione editoriale e il confronto con il portale ufficiale.

## Revisioni

I dati ufficiali possono essere rivisti. Ogni aggiornamento ricostruisce snapshot, manifest, file elaborati e CSV. Le differenze restano nella cronologia Git, così è possibile vedere quali valori sono cambiati.

## Definizioni e testi accessibili

I testi “sintesi accessibile” e “selezione tecnica” sono redatti dal progetto sulla base della metodologia ufficiale. Non sono citazioni letterali e non vengono presentati come tali. Ogni scheda collega la fonte utilizzata per verificarne perimetro e significato.

Quando una definizione ha limiti rilevanti — periodo di riferimento, popolazione esclusa, domanda auto-riferita, cambi di norma o problemi di comparabilità — questi compaiono nella scheda e nella pagina della fonte.

## Licenze e riuso

La licenza MIT riguarda il codice e la documentazione originale del progetto, non attribuisce una nuova licenza ai dati. I dati mantengono le condizioni della fonte. Si applicano la politica di riuso Eurostat e, per i dati di emissione originati da EEA, le condizioni EEA indicate nel manifest e in `DATA_LICENSE.md`.

Traduzioni, sintesi accessibili, mediane e altre elaborazioni sono prodotte da Explainable Italy. Eurostat, EEA e le altre istituzioni citate non ne sono responsabili.
