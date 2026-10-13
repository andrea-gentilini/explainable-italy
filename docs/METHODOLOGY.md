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

Le serie iniziano dal primo anno con Italia e almeno 24 Stati membri disponibili, mai prima del 2000. Italia, UE e mediana sono sempre confrontate nello stesso anno e con la stessa selezione. Se un anno più recente ha meno di 24 Stati disponibili, il confronto resta all’ultimo anno che supera questa soglia. Non si riempiono anni mancanti con interpolazioni.

La scheda e la pagina della fonte mostrano inizialmente il più recente confronto con dato italiano privo dei contrassegni `e`, `p` o `f`. Se esiste un confronto successivo stimato, provvisorio o previsto, è mostrato separatamente e può essere selezionato per confrontare lo stesso anno in scheda e fonte. I collegamenti conservano l’anno selezionato. La ripartizione dei 100 € in homepage usa il confronto più recente disponibile e indica esplicitamente l’anno e lo stato. L’assenza di questi contrassegni non significa che il dato non potrà essere rivisto. La selezione dello stato italiano non implica che tutti i Paesi o l’aggregato UE siano definitivi: i loro contrassegni restano indicati separatamente. La selezione considera sia i contrassegni delle singole osservazioni sia le note ufficiali che attribuiscono uno stato a un Paese o a un intero anno. Per questo la ripartizione COFOG italiana e l’aggregato UE del 2024 sono indicati come provvisori anche se il flag non compare nelle singole celle API. Il contrassegno originale resta conservato separatamente da quello integrato con i metadati.

I contrassegni di interruzione della serie restano visibili sul singolo anno. Anche le discontinuità documentate soltanto nei metadati, come i passaggi da RED I a RED II nel 2021 e a RED III nel 2025 per le rinnovabili, vengono indicate separatamente. In questi casi il confronto nel tempo richiede cautela.

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
12. riproduzione di ogni valore Italia e UE, mediana, elenco dei Paesi e contrassegno originale dagli snapshot ufficiali
13. corrispondenza esatta del CSV con le serie pubblicate e selezione coerente dell’ultimo dato

I controlli automatici non sostituiscono la revisione editoriale e il confronto con il portale ufficiale.

## Revisioni

I dati ufficiali possono essere rivisti. Ogni aggiornamento acquisisce tutte le fonti e prepara snapshot, manifest, file elaborati e CSV prima di sostituire i file: una richiesta fallita o una risposta incoerente interrompe l’aggiornamento e conserva i dati precedenti. Ogni file è sostituito atomicamente. La modalità offline verifica le impronte degli snapshot e conserva le date di acquisizione originali; non dichiara un nuovo accesso alle fonti. Le date di acquisizione sono registrate per ciascun dataset. Le differenze restano nella cronologia Git, così è possibile vedere quali valori sono cambiati.

## Definizioni e testi accessibili

I testi “sintesi accessibile” e “selezione tecnica” sono redatti dal progetto sulla base della metodologia ufficiale. Non sono citazioni letterali e non vengono presentati come tali. Ogni scheda collega la fonte utilizzata per verificarne perimetro e significato.

Quando una definizione ha limiti rilevanti — periodo di riferimento, popolazione esclusa, domanda auto-riferita, cambi di norma o problemi di comparabilità — questi compaiono nella scheda e nella pagina della fonte.

## Licenze e riuso

La licenza MIT riguarda il codice e la documentazione originale del progetto, non attribuisce una nuova licenza ai dati. I dati mantengono le condizioni della fonte. Si applicano la politica di riuso Eurostat e, per i dati di emissione originati da EEA, le condizioni EEA indicate nel manifest e in `DATA_LICENSE.md`.

Traduzioni, sintesi accessibili, mediane e altre elaborazioni sono prodotte da Explainable Italy. Eurostat, EEA e le altre istituzioni citate non ne sono responsabili.

## Fonti metodologiche ricontrollate

La revisione del 13 ottobre 2026 ha verificato tutte le 20 selezioni API. I [metadati COFOG](https://ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm), sezione 19, confermano lo stato provvisorio del 2024 per Italia e UE. Il [manuale SHARES](https://ec.europa.eu/eurostat/documents/d/energy/shares-manual), sezione 1.1, sostituisce il precedente collegamento ai metadati delle rinnovabili, non più disponibile, e documenta i tre regimi normativi. I [metadati sulle emissioni](https://ec.europa.eu/eurostat/cache/metadata/en/sdg_13_10_esmsip2.htm), sezione 6.1, confermano che l’aggregato UE disponibile altrove include trasporti internazionali e non è confrontabile con la selezione nazionale usata qui.

Eurostat conserva online la versione più recente dei dataset, senza versionare le risposte precedenti: le copie locali con impronta e data di acquisizione servono per riprodurre i confronti pubblicati. Si veda la [documentazione API Eurostat](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction).
