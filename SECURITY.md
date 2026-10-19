# Sicurezza

## Segnalare una vulnerabilità

Non pubblicare dettagli sensibili in una issue.

Usa la funzione privata “Report a vulnerability” nella scheda Security della repository. Indica l’impatto, i passaggi per riprodurre il problema e, se disponibile, una proposta di correzione.

Il progetto è un sito statico: non usa cookie di profilazione, pubblicità o tracker identificativi e può includere, solo se configurato in compilazione, il beacon di Cloudflare Web Analytics per statistiche d’accesso esclusivamente aggregate. L’infrastruttura di hosting può comunque conservare normali log tecnici; dipendenze e flusso di pubblicazione restano parte della superficie di sicurezza.

## Verifica delle dipendenze — 14 ottobre 2026

Next.js ed eslint-config-next sono aggiornati alla versione 16.3.8. Le librerie indirette brace-expansion e js-yaml sono aggiornate alle correzioni disponibili. `pnpm audit --prod` non segnala vulnerabilità note.

L’audit che include i pacchetti di sviluppo segnala ancora [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) per `braces@3.0.3`, dipendenza indiretta del controllo ESLint. Non fa parte dei file del sito statico esportato. L’audit npm indica `>=3.0.4` come intervallo corretto, ma il registro npm pubblica ancora soltanto `3.0.3` come ultima versione e la pagina GHSA riporta che non è disponibile una versione corretta. Non esiste quindi una correzione installabile alla data della verifica. Il controllo lavora sui percorsi del repository; non deve ricevere pattern glob da utenti esterni. Il prossimo aggiornamento delle dipendenze deve ricontrollare questo avviso.
