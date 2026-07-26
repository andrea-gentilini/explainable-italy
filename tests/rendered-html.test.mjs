import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("contains the bilingual multi-page editorial experience", async () => {
  const [
    dashboard,
    italianPage,
    englishPage,
    italianDataPage,
    englishDataPage,
    italianIndicatorPage,
    englishIndicatorPage,
    layout,
  ] = await Promise.all([
    readFile(new URL("app/components/Dashboard.tsx", projectRoot), "utf8"),
    readFile(new URL("app/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/en/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/data/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/en/data/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/data/[id]/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/en/data/[id]/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
  ]);

  assert.match(dashboard, /L’Italia, i dati ufficiali per tutti\./);
  assert.match(dashboard, /Italy, official data for everyone\./);
  assert.match(dashboard, /Italia, UE e mediana dei Paesi/);
  assert.match(dashboard, /Italy, EU and country median/);
  assert.match(dashboard, /Riduciamo a 100 € tutta la spesa pubblica italiana/);
  assert.match(dashboard, /L’Italia, in breve/);
  assert.match(dashboard, /PIL per abitante/);
  assert.match(dashboard, /Età mediana/);
  assert.match(dashboard, /Speranza di vita/);
  assert.match(dashboard, /Tasso di occupazione/);
  assert.match(dashboard, /"gdp-per-capita-pps"/);
  assert.match(dashboard, /"median-age"/);
  assert.match(dashboard, /className="spending-donut"/);
  assert.match(dashboard, /conic-gradient/);
  assert.match(dashboard, /onPointerDown=\{selectSpendingSlice\}/);
  assert.match(dashboard, /activeSection === "overview"/);
  assert.match(dashboard, /className="topic-grid"/);
  assert.match(dashboard, /Scegli un tema/);
  assert.match(dashboard, /il \{nextYear\} non è ancora pubblicato/);
  assert.match(dashboard, /Classification of the Functions of Government/);
  assert.match(dashboard, /Accessibilità, non interpretazione/);
  assert.match(
    dashboard,
    /Riportiamo dati pubblici in un formato leggibile, senza interpretarli/,
  );
  assert.match(dashboard, /Verifica definizione e fonte/);
  assert.doesNotMatch(dashboard, /Spiegazioni, non giudizi/);
  assert.doesNotMatch(dashboard, /Definiamo cosa misura un indicatore/);
  assert.match(dashboard, /href=\{indicator\.source\.apiUrl\}/);
  assert.match(dashboard, /data\/\$\{indicator\.id\}\/source/);
  assert.match(dashboard, /Come sono create queste categorie/);
  assert.match(dashboard, /Protezione sociale \(incluse pensioni\)/);
  assert.match(dashboard, /function SocialProtectionDetail/);
  assert.match(dashboard, /function SourceVerification/);
  assert.match(dashboard, /Quanta parte riguarda le pensioni/);
  assert.match(dashboard, /pensioni di vecchiaia, pensioni anticipate/);
  assert.match(dashboard, /pubblici o privati/);
  assert.doesNotMatch(dashboard, /Comprende soprattutto pensioni/);
  assert.doesNotMatch(dashboard, /className="old-age-note"/);
  assert.doesNotMatch(dashboard, /www\.istat\.it/);
  assert.match(dashboard, /id="method"/);
  assert.match(dashboard, /id="sources"/);
  assert.match(dashboard, /id="about"/);
  assert.match(dashboard, /id="contribute"/);
  assert.match(dashboard, /downloadIndicator/);
  assert.match(dashboard, /localStorage/);
  assert.match(dashboard, /prefers-color-scheme: dark/);
  assert.doesNotMatch(dashboard, />\s*ei\s*</);
  assert.doesNotMatch(dashboard, /\bAI\b/);
  assert.doesNotMatch(
    dashboard,
    /gtag|googletagmanager|plausible\.io|posthog/i,
  );
  assert.match(italianPage, /locale="it" view="home"/);
  assert.match(englishPage, /locale="en" view="home"/);
  assert.match(italianDataPage, /locale="it" view="data"/);
  assert.match(englishDataPage, /locale="en" view="data"/);
  assert.match(italianIndicatorPage, /generateStaticParams/);
  assert.match(englishIndicatorPage, /generateStaticParams/);
  assert.match(italianIndicatorPage, /spending-old-age/);
  assert.match(italianIndicatorPage, /pension-expenditure/);
  assert.match(englishIndicatorPage, /spending-old-age/);
  assert.match(englishIndicatorPage, /pension-expenditure/);
  assert.match(layout, /Andrea Gentilini/);
  assert.match(layout, /social-preview-v2\.jpg/);

  await Promise.all(
    [
      "app/method/page.tsx",
      "app/sources/page.tsx",
      "app/about/page.tsx",
      "app/contribute/page.tsx",
      "app/en/method/page.tsx",
      "app/en/sources/page.tsx",
      "app/en/about/page.tsx",
      "app/en/contribute/page.tsx",
      "app/data/[id]/source/page.tsx",
      "app/en/data/[id]/source/page.tsx",
    ].map((path) => access(new URL(path, projectRoot))),
  );
});

test("has no starter preview left", async () => {
  await assert.rejects(
    access(new URL("app/_sites-preview/SkeletonPreview.tsx", projectRoot)),
  );

  const [packageJson, readme] = await Promise.all([
    readFile(new URL("package.json", projectRoot), "utf8"),
    readFile(new URL("README.md", projectRoot), "utf8"),
  ]);

  assert.doesNotMatch(packageJson, /site-creator-vinext-starter/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(readme, /Your site is taking shape/);
});

test("links every indicator to its exact Eurostat query", async () => {
  const data = JSON.parse(
    await readFile(
      new URL("data/processed/dashboard.json", projectRoot),
      "utf8",
    ),
  );
  const defence = data.indicators.find(
    (indicator) => indicator.id === "spending-defence",
  );
  const health = data.indicators.find(
    (indicator) => indicator.id === "spending-health",
  );
  const oldAge = data.indicators.find(
    (indicator) => indicator.id === "spending-old-age",
  );

  assert.notEqual(defence.source.apiUrl, health.source.apiUrl);
  assert.match(defence.source.apiUrl, /cofog99=GF02/);
  assert.match(health.source.apiUrl, /cofog99=GF07/);
  assert.match(oldAge.source.apiUrl, /cofog99=GF1002/);
});
