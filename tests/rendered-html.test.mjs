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
  assert.match(dashboard, /Non sono 100 € a persona/);
  assert.match(dashboard, /il \{nextYear\} non è ancora pubblicato/);
  assert.match(dashboard, /Eurostat, dati trasmessi da Istat/);
  assert.match(dashboard, /spendingSource\.dataBrowserUrl/);
  assert.match(dashboard, /Come sono create queste categorie/);
  assert.match(dashboard, /Protezione sociale \(incluse pensioni\)/);
  assert.match(dashboard, /Le pensioni sono qui/);
  assert.match(dashboard, /data\/spending-old-age/);
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
