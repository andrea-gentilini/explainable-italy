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

Next.js ed `eslint-config-next` sono fissati alla versione `16.4.6`, che include le [correzioni di sicurezza della 16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5). Il sito distribuisce file statici su GitHub Pages. Il workflow esegue l’audit delle dipendenze di produzione a ogni verifica.

Per le dipendenze di sviluppo che richiedono `minimatch` 10, il lockfile seleziona la versione corretta `11.0.1`. Le dipendenze che richiedono il ramo 3 mantengono la propria versione. L’intervallo interessato da [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) va dalla 7.0.0 inclusa alla 11.0.1 esclusa.

---

<a id="english"></a>

## English

### Reporting a vulnerability

Do not disclose sensitive security details in a public GitHub issue.

Please use the private “Report a vulnerability” feature in the repository’s Security tab on GitHub. Include the potential impact, steps to reproduce the issue and, if available, a suggested fix.

The project exports a static site: it uses no profiling cookies, advertising or identifying trackers, and only includes the official Cloudflare Web Analytics beacon when `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` is explicitly set at build time for aggregate-only access statistics. The hosting infrastructure may still retain standard technical access logs; dependencies and release workflows remain part of the security surface.

### Dependency audit

Next.js and `eslint-config-next` are pinned to `16.4.6`, which includes the [16.4.5 security fixes](https://github.com/vercel/next.js/releases/tag/v16.4.5). The site serves static files on GitHub Pages. The workflow audits production dependencies on each verification run.

For development dependencies that request `minimatch` 10, the lockfile selects the patched release `11.0.1`. Dependencies that request the 3.x line retain their own version. [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) affects versions from 7.0.0 inclusive to 11.0.1 exclusive.
