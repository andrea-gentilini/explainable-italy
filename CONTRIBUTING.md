# Contribuire a Explainable Italy

Grazie per l’interesse. Il progetto accetta contributi tramite il normale flusso GitHub: issue, discussione, pull request e revisione.

## Prima di proporre un indicatore

Una proposta deve specificare:

1. la domanda concreta a cui risponde
2. l’istituzione che pubblica il dato
3. il collegamento diretto a dataset e metadati
4. la definizione ufficiale
5. l’unità di misura
6. le geografie e gli anni disponibili
7. eventuali stime, revisioni o interruzioni di serie
8. il motivo per cui il dato è utile a un pubblico non specialista

Sono ammesse fonti ufficiali come Eurostat, ISTAT, Banca d’Italia, Ragioneria Generale dello Stato, Ministero dell’Economia e delle Finanze, INPS, OCSE e altre istituzioni pubbliche competenti. Quando più fonti descrivono lo stesso fenomeno, va preferita quella con definizione più comparabile e accesso più stabile. La scelta deve essere motivata.

## Regole editoriali

1. Non partire da una conclusione da dimostrare.
2. Non scegliere anni o Paesi perché rendono il confronto più favorevole a una tesi.
3. Non descrivere un’associazione come rapporto di causa ed effetto.
4. Distinguere dati definitivi, provvisori e stimati.
5. Spiegare ogni sigla e classificazione necessaria.
6. Usare parole comuni nella spiegazione principale.
7. Conservare il significato tecnico nella sezione di approfondimento.
8. Segnalare revisioni, discontinuità e differenze metodologiche.
9. Non usare classifiche come scorciatoia narrativa.
10. Non attribuire giudizi di valore ai numeri.

## Confronti europei

Il confronto standard contiene Italia, media UE e mediana UE.

L’aggregato ufficiale dell’Unione europea ha precedenza. Se non è disponibile, può essere calcolata la media aritmetica dei Paesi con un’avvertenza visibile. La mediana richiede almeno 24 Stati membri su 27. Un divario tra media e mediana segnala una distribuzione asimmetrica o un diverso peso dei Paesi, ma non dimostra da solo la presenza di valori anomali.

## Modifiche ai dati

1. Aggiornare `scripts/update-data.mjs`.
2. Eseguire `pnpm data:update`.
3. Controllare le differenze in `data/manifest.json`.
4. Eseguire `pnpm validate:data`.
5. Verificare almeno tre valori direttamente nel portale ufficiale.
6. Descrivere nella pull request gli indicatori toccati e le verifiche fatte.

Non modificare manualmente i dati generati salvo che la pull request documenti una correzione riproducibile.

## Modifiche all’interfaccia o ai testi

Ogni testo visibile deve esistere in italiano e inglese. L’italiano è la lingua predefinita. Il sito deve rimanere utilizzabile da tastiera, leggibile su schermi piccoli e comprensibile senza conoscenze statistiche.

Evitare tono promozionale, formulazioni categoriche e linguaggio di parte. Le definizioni semplici devono chiarire, non semplificare fino a cambiare il significato.

## Pull request

Una pull request piccola e mirata è più facile da verificare. Prima dell’invio eseguire:

```bash
pnpm lint
pnpm test
```

Almeno una revisione è richiesta per modifiche a dati, metodologia o definizioni. Chi propone il cambiamento non dovrebbe essere l’unica persona a verificarlo.

Partecipando al progetto si accetta il [Codice di condotta](CODE_OF_CONDUCT.md).
