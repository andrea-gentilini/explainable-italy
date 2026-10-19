# Explainable Italy

[Open the website](https://andrea-gentilini.github.io/explainable-italy/en/) · [Leggi in italiano](README.it.md)

Explainable Italy makes official statistics about Italy easier to read and verify. Explore **39 indicators across six themes**, compare Italy with the official EU aggregate and the country median, and follow each number back to its source.

This is an independent, open-source project, not an official institutional website. Version **1.0.0** is available in Italian and English.

![Explainable Italy dashboard](docs/images/dashboard.jpg)

## Explore

The six themes cover public finances, population, work and the economy, welfare and health, education, and environment and energy. Search, choose a year, inspect the historical series, or open the source page to check definitions, country observations and quality flags. Shareable links preserve the selected year and search context.

For example, open [life expectancy in 2010](https://andrea-gentilini.github.io/explainable-italy/en/data/life-expectancy/?year=2010) and [verify its source and calculation](https://andrea-gentilini.github.io/explainable-italy/en/data/life-expectancy/source/?year=2010).

Download an indicator as CSV, the complete dataset as CSV or JSON, or the exact source snapshot used by the site. Snapshot downloads include a SHA256 fingerprint and acquisition date; links to the current Eurostat API are identified separately.

## How to read the comparisons

- **Italy and EU:** the EU value is Eurostat’s official aggregate with the same scope. It is not the simple average of countries. If a comparable aggregate is unavailable, the site leaves it missing.
- **Country median:** each available country has equal weight. It includes Italy and requires at least **24 of the current 27 EU members**. Coverage and missing countries are shown. This is not the median European resident.
- **Years and status:** comparisons use the same year and selection, never before 2000. The default is the latest Italian observation without an estimated, provisional or forecast flag, when available. Newer flagged observations remain distinct and selectable. An unflagged value is not guaranteed to be final; EU and national flags are reported separately.
- **Limits:** these are published snapshots, not live statistics. Check the observation year, source update date and acquisition date. Missing years are not interpolated; revisions and methodological breaks can affect trends. The project provides neither country rankings nor causal conclusions.

The data comes from **20 official datasets published by Eurostat**. For greenhouse-gas emissions, the original source is the European Environment Agency, based on UNFCCC inventories. Accessible explanations and translations are project paraphrases, with links to the official definitions.

Read the [methodology](docs/METHODOLOGY.md), browse the [source manifest](data/manifest.json), or use the website’s [method](https://andrea-gentilini.github.io/explainable-italy/en/method/) and [sources](https://andrea-gentilini.github.io/explainable-italy/en/sources/) pages.

## Run locally

Requires **Node.js 22.13 or newer** and **pnpm 11.9.0**.

```sh
git clone https://github.com/andrea-gentilini/explainable-italy.git
cd explainable-italy
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000/) for Italian or [localhost:3000/en/](http://localhost:3000/en/) for English. The committed snapshots are sufficient; no source download is needed to run or build the site.

```sh
pnpm check                  # Lint, validate data, build, and test exported pages
pnpm validate:data          # Reproduce values and check snapshots and downloads
pnpm data:update            # Fetch all official selections; network required
pnpm data:update:offline    # Rebuild from snapshots, preserving acquisition dates
```

An update validates the complete candidate before replacing published files. Review the resulting diff before committing: new observations can also revise earlier years. Offline reconstruction is deterministic with the same code and snapshots.

## Architecture and privacy

Next.js and React produce a **static export** in `out/`. Search, year selection and charts run in the browser; viewing the site does not require a database or a live statistics API.

| Location | Contents |
| --- | --- |
| `app/` | Bilingual pages, interface and source verification |
| `scripts/` | Data acquisition, transformations and validation |
| `data/raw/eurostat/` | Exact, minimal official data selections |
| `data/processed/` and `data/manifest.json` | Interface data and source provenance |
| `public/data/` | Downloadable snapshots, JSON and CSV files |
| `tests/` | Data-pipeline and exported-page regression tests |

When `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` is set at build time, the site includes the free Cloudflare Web Analytics beacon to measure aggregate visits, consulted pages, referrers, country, device or browser category, and page-load performance. It uses no analytics cookies, advertising, profiling, fingerprinting, cross-site tracking, user accounts or personal data, and does not log search query strings or store visitor IP addresses. Without the token, no beacon is emitted. The theme preference is stored locally in the browser using `localStorage`. GitHub Pages may retain normal technical hosting logs; following an external source link opens that institution’s website.

## Publish and refresh

Build for the GitHub Pages project path:

```sh
NEXT_PUBLIC_BASE_PATH=/explainable-italy pnpm check
```

This includes the production build. To rebuild an already checked edition separately:

```sh
NEXT_PUBLIC_BASE_PATH=/explainable-italy pnpm build
```

See [`.env.example`](.env.example) for the optional public build variables. Set `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` in the GitHub Actions repository variables (or local environment) only when you want the static export to include the Cloudflare Web Analytics beacon; never commit a real token to the repository.

The [Verify and deploy workflow](.github/workflows/ci.yml) checks pull requests and `main`. Publication from `main` runs only after the checks and production-dependency audit pass; it deploys the verified static output.

The [Propose a data refresh workflow](.github/workflows/refresh-data.yml) checks the official sources every **Tuesday at 05:23 UTC**, or on a manual run. It runs the full validation and security checks before opening or updating a draft pull request. Changes to acquisition or build timestamps alone do not create a data proposal. A maintainer reviews source definitions, revisions and flags before merging an update.

Each attempt records its outcome in [the refresh status file](.github/data-refresh-status.json), preserving the last successful check if a later run fails. These audit commits keep the repository active during months without development. Everything runs on GitHub, so no local computer needs to stay on and the local checkout can be deleted. See [how data updates work](docs/DATA_REFRESH.md) for the review process, failure handling and schedule limitations.

## Contribute and reuse

Report a data issue, improve an explanation or translation, or contribute accessibility and code fixes. Include an official source for proposed data changes. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

The [MIT license](LICENSE) covers the code and original documentation. Third-party data retains its source terms; see [DATA_LICENSE.md](DATA_LICENSE.md). Eurostat and EEA are not responsible for the project’s translations, summaries or calculated medians.

Created by [Andrea Gentilini](https://github.com/andrea-gentilini).
