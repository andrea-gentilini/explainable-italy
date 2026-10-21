# Sicurezza / Security

**[Italiano](#italiano) · [English](#english)**

---

<a id="italiano"></a>

## Italiano

### Segnalare una vulnerabilità

Non pubblicare dettagli sensibili in una issue pubblica.

Usa la funzione privata “Report a vulnerability” nella scheda Security del repository GitHub. Indica l’impatto, i passaggi per riprodurre il problema e, se disponibile, una proposta di correzione.

Il progetto è un sito statico: non usa cookie di profilazione, pubblicità o tracker identificativi e può includere, solo se configurato in compilazione tramite `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`, il beacon ufficiale di Cloudflare Web Analytics per statistiche d’accesso esclusivamente aggregate. L’infrastruttura di hosting può comunque conservare normali log tecnici; dipendenze e flusso di pubblicazione restano parte della superficie di sicurezza.

### Verifica delle dipendenze

Next.js ed `eslint-config-next` sono aggiornati alla versione `16.3.8`. Le librerie indirette `brace-expansion` e `js-yaml` sono aggiornate alle correzioni disponibili. `pnpm audit --prod` non segnala vulnerabilità note.

L’audit che include i pacchetti di sviluppo segnala [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) per `braces@3.0.3`, dipendenza indiretta del controllo ESLint. Non fa parte dei file del sito statico esportato. L’audit npm indica `>=3.0.4` come intervallo corretto, ma il registro npm pubblica ancora soltanto `3.0.3` come ultima versione e la pagina GHSA riporta che non è disponibile una versione corretta. Non esiste quindi una correzione installabile alla data della verifica. Il controllo lavora sui percorsi del repository; non deve ricevere pattern glob da utenti esterni. Il prossimo aggiornamento delle dipendenze deve ricontrollare questo avviso.

---

<a id="english"></a>

## English

### Reporting a vulnerability

Do not disclose sensitive security details in a public GitHub issue.

Please use the private “Report a vulnerability” feature in the repository’s Security tab on GitHub. Include the potential impact, steps to reproduce the issue and, if available, a suggested fix.

The project exports a static site: it uses no profiling cookies, advertising or identifying trackers, and only includes the official Cloudflare Web Analytics beacon when `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` is explicitly set at build time for aggregate-only access statistics. The hosting infrastructure may still retain standard technical access logs; dependencies and release workflows remain part of the security surface.

### Dependency audit

Next.js and `eslint-config-next` are pinned at `16.3.8`. Indirect dependencies `brace-expansion` and `js-yaml` are pinned to patched releases. `pnpm audit --prod` reports zero known vulnerabilities.

Running an audit that includes development-only packages still reports [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) on `braces@3.0.3`, an indirect dependency of ESLint. It is never shipped in the exported static site. While the advisory metadata lists `>=3.0.4` as the patched range, the npm registry still publishes `3.0.3` as the latest `3.x` release and the GHSA page states that no patched version is available. Because ESLint only runs against repository paths and never receives untrusted user glob patterns, practical risk is negligible; future dependency updates should re-check this advisory.
