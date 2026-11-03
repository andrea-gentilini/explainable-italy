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

Next.js ed `eslint-config-next` sono aggiornati alla versione `16.4.4`, React a `19.3.1`, ESLint a `10.14.0` e TypeScript a `6.0.3`. `pnpm audit --prod` non segnala vulnerabilità note.

L’audit che include i pacchetti di sviluppo segnala [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (severità moderata) per `minimatch` (`3.1.5` e `10.2.6`), dipendenza indiretta di ESLint e dei relativi plugin. Non fa parte dei file del sito statico esportato. Entrambe le versioni installate sono le più recenti dei rispettivi rami principali (`3.x` e `10.x`), mentre la correzione indicata dall’avviso (`>=11.0.1`) appartiene a una nuova versione maggiore incompatibile non ancora adottata a monte da ESLint e dai suoi plugin. Il controllo lavora esclusivamente sui percorsi del repository e non riceve pattern glob da utenti esterni. Il prossimo aggiornamento delle dipendenze deve ricontrollare questo avviso.

---

<a id="english"></a>

## English

### Reporting a vulnerability

Do not disclose sensitive security details in a public GitHub issue.

Please use the private “Report a vulnerability” feature in the repository’s Security tab on GitHub. Include the potential impact, steps to reproduce the issue and, if available, a suggested fix.

The project exports a static site: it uses no profiling cookies, advertising or identifying trackers, and only includes the official Cloudflare Web Analytics beacon when `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` is explicitly set at build time for aggregate-only access statistics. The hosting infrastructure may still retain standard technical access logs; dependencies and release workflows remain part of the security surface.

### Dependency audit

Next.js and `eslint-config-next` are pinned at `16.4.4`, React at `19.3.1`, ESLint at `10.14.0` and TypeScript at `6.0.3`. `pnpm audit --prod` reports zero known vulnerabilities.

Running an audit that includes development-only packages reports [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (moderate severity) on `minimatch` (`3.1.5` and `10.2.6`), an indirect dependency of ESLint and its plugins. It is never shipped in the exported static site. Both installed releases are the latest available in their respective major branches (`3.x` and `10.x`), whereas the patched range (`>=11.0.1`) requires an incompatible major upgrade not yet adopted upstream by ESLint and its plugins. Because ESLint only runs against repository paths and never receives untrusted user glob patterns, practical risk is negligible; future dependency updates should re-check this advisory.
