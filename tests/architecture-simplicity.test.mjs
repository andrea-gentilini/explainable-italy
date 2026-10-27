import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  allCatalogIndicators,
  annualChangeReadings,
  datasetSpecs,
  indicatorAliases,
  indicatorReadings,
  sectionColors,
  sections,
  snapshotDefinitions,
  snapshotIds,
  topicQuestions,
} from "../scripts/indicator-catalog.mjs";

const rootDir = process.cwd();

function collectCodeFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCodeFiles(fullPath));
    } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

test("3.1 app components and routes stay modular and avoid direct JSON duplication", () => {
  const appFiles = collectCodeFiles(path.join(rootDir, "app"));
  for (const file of appFiles) {
    const content = fs.readFileSync(file, "utf8");
    const lineCount = content.split("\n").length;
    const relPath = path.relative(rootDir, file);
    assert.ok(
      lineCount <= 900,
      `Expected ${relPath} to stay modular (<= 900 lines), found ${lineCount} lines`,
    );

    if (relPath !== "app/page-data.ts") {
      assert.ok(
        !/import\s+.*dashboard\.json/.test(content),
        `Expected ${relPath} to use app/page-data.ts helpers instead of importing dashboard.json directly`,
      );
    }
  }
});

test("3.2 single unified stylesheet has no override file, dead classes, or duplicate top-level selectors", () => {
  const globalsPath = path.join(rootDir, "app/globals.css");
  const redesignPath = path.join(rootDir, "app/redesign.css");

  assert.ok(fs.existsSync(globalsPath), "app/globals.css must exist");
  assert.ok(
    !fs.existsSync(redesignPath),
    "app/redesign.css must not exist (styles are unified in app/globals.css)",
  );

  const css = fs.readFileSync(globalsPath, "utf8");
  const deadClasses = [
    "brand-mark",
    "hero-meta",
    "spending-stack",
    "old-age-note",
    "featured-section",
    "featured-grid",
    "definition-grid",
    "median-explainer",
    "landing-intro",
    "indicator-details-title",
  ];
  for (const cls of deadClasses) {
    assert.ok(
      !new RegExp(`\\.${cls}\\b`).test(css),
      `Dead CSS class .${cls} must not be present in app/globals.css`,
    );
  }

  // Verify no top-level selector appears more than once outside @media blocks
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const seenTopLevel = new Set();
  let i = 0;
  while (i < clean.length) {
    while (i < clean.length && /\s/.test(clean[i])) i++;
    if (i >= clean.length) break;
    const braceStart = clean.indexOf("{", i);
    if (braceStart === -1) break;
    const prelude = clean.slice(i, braceStart).trim().replace(/\s+/g, " ");
    let depth = 1;
    let j = braceStart + 1;
    while (j < clean.length && depth > 0) {
      if (clean[j] === "{") depth++;
      else if (clean[j] === "}") depth--;
      j++;
    }
    if (!prelude.startsWith("@media")) {
      const selectors = [];
      let sDepth = 0;
      let start = 0;
      for (let k = 0; k < prelude.length; k++) {
        if (prelude[k] === "(" || prelude[k] === "[") sDepth++;
        else if (prelude[k] === ")" || prelude[k] === "]") sDepth--;
        else if (prelude[k] === "," && sDepth === 0) {
          selectors.push(prelude.slice(start, k).trim().replace(/\s+/g, " "));
          start = k + 1;
        }
      }
      selectors.push(prelude.slice(start).trim().replace(/\s+/g, " "));
      for (const sel of selectors) {
        assert.ok(
          !seenTopLevel.has(sel),
          `Duplicate top-level CSS selector found in app/globals.css: ${sel}`,
        );
        seenTopLevel.add(sel);
      }
    }
    i = j;
  }
});

test("3.3 exported pages strip unused series and country payloads", () => {
  const outDir = path.join(rootDir, "out");
  if (!fs.existsSync(outDir)) return;

  // Editorial pages should carry 0 indicators in their RSC payload
  for (const page of [
    "about/index.html",
    "method/index.html",
    "contribute/index.html",
    "en/about/index.html",
    "en/method/index.html",
    "en/contribute/index.html",
  ]) {
    const html = fs.readFileSync(path.join(outDir, page), "utf8");
    assert.ok(
      html.includes('\\"indicators\\":[]'),
      `Expected ${page} to pass an empty indicators array in RSC payload`,
    );
  }

  // Home and catalogue pages should strip series and countries
  for (const page of [
    "index.html",
    "data/index.html",
    "sources/index.html",
    "en/index.html",
    "en/data/index.html",
    "en/sources/index.html",
  ]) {
    const html = fs.readFileSync(path.join(outDir, page), "utf8");
    assert.ok(
      !html.includes('\\"countries\\":['),
      `Expected ${page} not to embed 27-country arrays`,
    );
    assert.ok(
      html.includes('\\"series\\":[]'),
      `Expected ${page} to strip historical series arrays`,
    );
  }

  // Indicator detail pages keep series for the chart but strip 27-country arrays
  const indicatorHtml = fs.readFileSync(
    path.join(outDir, "data/gdp-per-capita-pps/index.html"),
    "utf8",
  );
  assert.ok(
    !indicatorHtml.includes('\\"countries\\":['),
    "Expected indicator detail page not to embed 27-country audit arrays",
  );

  // Source verification pages preserve the 27-country audit array for the single indicator
  const sourceHtml = fs.readFileSync(
    path.join(outDir, "data/gdp-per-capita-pps/source/index.html"),
    "utf8",
  );
  assert.ok(
    sourceHtml.includes('\\"countries\\":['),
    "Expected indicator source audit page to include 27-country observations",
  );
});

test("3.4 indicator-catalog.mjs is the unified source of truth for all 39 indicators", () => {
  assert.equal(datasetSpecs.length, 20);
  assert.equal(allCatalogIndicators.length, 39);
  assert.equal(sections.length, 6);

  const ids = allCatalogIndicators.map((i) => i.id);
  assert.equal(new Set(ids).size, 39);

  for (const id of ids) {
    assert.ok(
      indicatorReadings[id] || annualChangeReadings[id],
      `Missing reading configuration for ${id} in indicator-catalog.mjs`,
    );
  }
  assert.ok(
    Object.keys(indicatorAliases).length >= 30 &&
      Object.values(indicatorAliases).every(
        (aliases) => typeof aliases === "string" && aliases.trim().length > 0,
      ),
    "Expected search aliases in indicator-catalog.mjs to be non-empty strings",
  );

  for (const indicator of allCatalogIndicators) {
    if (indicator.annualChangeReading) {
      assert.ok(annualChangeReadings[indicator.id]);
    }
  }

  for (const section of sections) {
    assert.ok(sectionColors[section.id]);
    assert.ok(topicQuestions[section.id]?.length >= 2);
  }

  for (const id of snapshotIds) {
    assert.ok(snapshotDefinitions[id]?.it && snapshotDefinitions[id]?.en);
  }
});

test("3.5 orphan social preview assets are removed and anti-FOUC theme script is present", () => {
  assert.ok(
    !fs.existsSync(path.join(rootDir, "public/social-preview.png")),
    "Orphan public/social-preview.png must not exist",
  );
  assert.ok(
    !fs.existsSync(path.join(rootDir, "public/social-preview.svg")),
    "Orphan public/social-preview.svg must not exist",
  );
  assert.ok(
    fs.existsSync(path.join(rootDir, "public/social-preview-v2.jpg")),
    "Active public/social-preview-v2.jpg must exist",
  );

  const rootLayout = fs.readFileSync(
    path.join(rootDir, "app/root-layout.tsx"),
    "utf8",
  );
  assert.ok(
    rootLayout.includes("explainable-italy-theme") &&
      rootLayout.includes("document.documentElement.dataset.theme"),
    "Expected synchronous anti-FOUC theme initialization script in app/root-layout.tsx",
  );

  for (const componentFile of [
    "app/components/Dashboard.tsx",
    "app/components/HomeView.tsx",
    "app/components/IndicatorCard.tsx",
    "app/components/SourceVerification.tsx",
    "app/components/StaticViews.tsx",
    "app/components/MethodGuide.tsx",
  ]) {
    const src = fs.readFileSync(path.join(rootDir, componentFile), "utf8");
    assert.ok(
      src.includes("AppLink"),
      `Expected ${componentFile} to use AppLink (next/link) for client-side route navigation`,
    );
  }
});
