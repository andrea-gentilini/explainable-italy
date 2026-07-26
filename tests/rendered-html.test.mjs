import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("contains the bilingual editorial experience", async () => {
  const [dashboard, italianPage, englishPage, layout] = await Promise.all([
    readFile(new URL("app/components/Dashboard.tsx", projectRoot), "utf8"),
    readFile(new URL("app/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/en/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
  ]);

  assert.match(dashboard, /L’Italia, i dati ufficiali per tutti\./);
  assert.match(dashboard, /Italy, official data for everyone\./);
  assert.match(dashboard, /Italia, UE e mediana dei Paesi/);
  assert.match(dashboard, /Italy, EU and country median/);
  assert.match(dashboard, /id="method"/);
  assert.match(dashboard, /id="sources"/);
  assert.match(dashboard, /id="about"/);
  assert.match(dashboard, /id="contribute"/);
  assert.match(dashboard, /downloadIndicator/);
  assert.match(dashboard, /localStorage/);
  assert.doesNotMatch(dashboard, /\bAI\b/);
  assert.doesNotMatch(
    dashboard,
    /gtag|googletagmanager|plausible\.io|posthog/i,
  );
  assert.match(italianPage, /locale="it"/);
  assert.match(englishPage, /locale="en"/);
  assert.match(layout, /Andrea Gentilini/);
  assert.match(layout, /social-preview\.png/);
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
