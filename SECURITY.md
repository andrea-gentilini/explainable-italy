# Sicurezza

## Segnalare una vulnerabilità

Non pubblicare dettagli sensibili in una issue.

Usa la funzione privata “Report a vulnerability” nella scheda Security della repository. Indica l’impatto, i passaggi per riprodurre il problema e, se disponibile, una proposta di correzione.

Il progetto è un sito statico e non integra cookie, analytics o tracker. L’infrastruttura di hosting può comunque conservare normali log tecnici; dipendenze e flusso di pubblicazione restano parte della superficie di sicurezza.

## Verifica delle dipendenze — 13 ottobre 2026

Next.js ed eslint-config-next sono aggiornati alla versione 16.3.8. Le librerie indirette brace-expansion e js-yaml sono aggiornate alle correzioni disponibili. `pnpm audit --prod` non segnala vulnerabilità note.

L’audit che include i pacchetti di sviluppo segnala ancora [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) per `braces@3.0.3`, dipendenza indiretta del controllo ESLint. Non fa parte dei file del sito statico esportato. La versione correttiva indicata dall’avviso, `3.0.4`, non risulta disponibile nel registro npm alla data della verifica. Il controllo lavora sui percorsi del repository; non deve ricevere pattern glob da utenti esterni. Il prossimo aggiornamento delle dipendenze deve ricontrollare questo avviso.
