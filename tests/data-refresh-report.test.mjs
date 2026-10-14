import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { compareRefresh, formatRefreshReport } from "../scripts/data-refresh-report.mjs";

function fixture() {
  const source = { datasetCode: "official", sha256: "first-hash", bytes: 100, apiUrl: "https://ec.europa.eu/eurostat/api?unit=PC", sourceUpdatedAt: "2026-01-01", accessedAt: "2026-01-02", metadataUrl: "https://ec.europa.eu/eurostat/metadata" };
  const point = (year) => ({ year, italy: 50, eu: 60, median: 55, coverage: 27, status: null, countryStatuses: [], missingCountries: [], countries: [{ geo: "IT", value: 50, status: null }, { geo: "FR", value: 60, status: null }] });
  const manifest = { generatedAt: "2026-01-02", datasets: [source] };
  const dashboard = { generatedAt: "2026-01-02", methodologyVersion: 1, indicators: [{ id: "indicator", unitKey: "percent", notes: [], source: structuredClone(source), latest: point(2025), newerEstimate: null, series: [point(2024), point(2025)] }] };
  return { manifest, dashboard };
}

function compare(before, after) {
  return compareRefresh(before.manifest, before.dashboard, after.manifest, after.dashboard);
}

test("timestamp-only refreshes are suppressed without mutating source data", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.manifest.generatedAt = after.dashboard.generatedAt = "2026-02-03";
  after.manifest.datasets[0].accessedAt = after.dashboard.indicators[0].source.accessedAt = "2026-02-03";
  const saved = structuredClone(after);
  assert.equal(compare(before, after).changed, false);
  assert.deepEqual(after, saved);
  assert.equal(before.manifest.generatedAt, "2026-01-02");
});

test("raw hash, API selection and official metadata changes remain significant with identical numbers", () => {
  for (const [field, value] of [["sha256", "new-hash"], ["apiUrl", "https://ec.europa.eu/eurostat/api?unit=EUR"], ["sourceUpdatedAt", "2026-02-03"], ["metadataUrl", "https://ec.europa.eu/eurostat/new-metadata"]]) {
    const before = fixture();
    const after = structuredClone(before);
    after.manifest.datasets[0][field] = value;
    const result = compare(before, after);
    assert.equal(result.changed, true, field);
    assert.deepEqual(result.datasets[0].fields, [field]);
    assert.equal(result.summary.years.revised, 0);
    assert.equal(result.datasets[0].rawSnapshotChanged, field === "sha256");
    assert.equal(result.datasets[0].selectionChanged, field === "apiUrl");
  }
});

test("revisions to an older year include country-only values and flags", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.dashboard.indicators[0].series[0].countries[1].value = 61;
  after.dashboard.indicators[0].series[0].countries[1].status = "p";
  const result = compare(before, after);
  assert.equal(result.summary.years.revised, 1);
  assert.deepEqual(result.indicators[0].years.revised[0], {
    year: 2024,
    fields: ["countries"],
    values: {},
    countries: [{ geo: "FR", before: { geo: "FR", value: 60, status: null }, after: { geo: "FR", value: 61, status: "p" } }],
  });
  assert.equal(result.indicators[0].latestChanged, false);
});

test("missing values, coverage and removed countries cannot disappear from a refresh report", () => {
  const before = fixture();
  const after = structuredClone(before);
  Object.assign(after.dashboard.indicators[0].series[0], { italy: null, coverage: 26, status: "u", missingCountries: ["IT"] });
  after.dashboard.indicators[0].series[0].countries.shift();
  const result = compare(before, after);
  const revision = result.indicators[0].years.revised[0];
  assert.deepEqual(revision.values.italy, { before: 50, after: null });
  assert.deepEqual(revision.values.status, { before: null, after: "u" });
  assert.deepEqual(revision.values.coverage, { before: 27, after: 26 });
  assert.equal(revision.countries[0].geo, "IT");
  assert.equal(revision.countries[0].after, null);
  assert.ok(revision.fields.includes("missingCountries"));
});

test("added and removed indicator-year observations are counted separately", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.dashboard.indicators[0].series.shift();
  after.dashboard.indicators[0].series.push({ ...structuredClone(after.dashboard.indicators[0].latest), year: 2026 });
  const result = compare(before, after);
  assert.deepEqual(result.summary.years, { added: 1, removed: 1, revised: 0 });
  assert.deepEqual(result.indicators[0].years.added, [2026]);
  assert.deepEqual(result.indicators[0].years.removed, [2024]);
});

test("new and removed datasets or indicators are explicit and all their years are counted", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.manifest.datasets[0].datasetCode = "replacement";
  after.dashboard.indicators[0].id = "replacement";
  const result = compare(before, after);
  assert.equal(result.summary.datasets.added, 1);
  assert.equal(result.summary.datasets.removed, 1);
  assert.equal(result.summary.indicators.added, 1);
  assert.equal(result.summary.indicators.removed, 1);
  assert.deepEqual(result.summary.years, { added: 2, removed: 2, revised: 0 });
});

test("default-year policy, estimates and definitions are reported even if series values stay identical", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.dashboard.indicators[0].latest = structuredClone(after.dashboard.indicators[0].series[0]);
  after.dashboard.indicators[0].newerEstimate = structuredClone(after.dashboard.indicators[0].series[1]);
  after.dashboard.indicators[0].notes.push({ text: "An official definition changed." });
  after.dashboard.methodologyVersion = 2;
  const result = compare(before, after);
  assert.deepEqual(result.indicators[0].defaultYear, { before: 2025, after: 2024 });
  assert.equal(result.indicators[0].newerEstimateChanged, true);
  assert.deepEqual(result.indicators[0].metadataFields, ["notes"]);
  assert.deepEqual(result.dashboardFields, ["methodologyVersion"]);
  assert.equal(result.summary.years.revised, 0);
});

test("object-key order is harmless but malformed duplicate identities fail closed", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.manifest.datasets[0] = Object.fromEntries(Object.entries(after.manifest.datasets[0]).reverse());
  assert.equal(compare(before, after).changed, false);
  after.manifest.datasets.push(structuredClone(after.manifest.datasets[0]));
  assert.throws(() => compare(before, after), /duplicate datasetCode/);
  after.manifest.datasets.pop();
  after.dashboard.indicators[0].series.push(structuredClone(after.dashboard.indicators[0].series[0]));
  assert.throws(() => compare(before, after), /duplicate year/);
});

test("Markdown reports counts, exact years, source caveats and escaped remote text", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.dashboard.indicators[0].series[0].italy = 51;
  after.manifest.datasets[0].datasetCode = "<table>|untrusted\nname";
  const markdown = formatRefreshReport(compare(before, after), { base: "abc123" });
  assert.match(markdown, /1 \(2024\)/);
  assert.match(markdown, /\| Indicator-year observations \| 0 \| 1 \| 0 \|/);
  assert.match(markdown, /official definitions, units, selected populations, comparability/);
  assert.match(markdown, /&lt;table&gt;\\\|untrusted name/);
  assert.doesNotMatch(markdown, /<table>/);
});

test("CLI compares a pinned git base, writes both reports and exports changed without touching data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "explainable-refresh-report-"));
  try {
    await mkdir(join(directory, "scripts"));
    await mkdir(join(directory, "data", "processed"), { recursive: true });
    await copyFile(new URL("../scripts/data-refresh-report.mjs", import.meta.url), join(directory, "scripts", "data-refresh-report.mjs"));
    const { manifest, dashboard } = fixture();
    await writeFile(join(directory, "data", "manifest.json"), JSON.stringify(manifest));
    await writeFile(join(directory, "data", "processed", "dashboard.json"), JSON.stringify(dashboard));
    const git = (...args) => execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init");
    git("add", "data");
    git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-m", "fixture");
    const base = git("rev-parse", "HEAD");
    const output = join(directory, "github-output");
    const run = (...args) => execFileSync(process.execPath, [join(directory, "scripts", "data-refresh-report.mjs"), ...args], { cwd: directory, env: { ...process.env, GITHUB_OUTPUT: output }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    run("--base", base);
    assert.equal(JSON.parse(await readFile(join(directory, ".data-refresh", "report.json"), "utf8")).changed, false);
    assert.match(await readFile(output, "utf8"), /^changed=false\n$/);
    dashboard.indicators[0].series[0].italy = 52;
    const changedData = JSON.stringify(dashboard);
    await writeFile(join(directory, "data", "processed", "dashboard.json"), changedData);
    run("--base", base, "--output-dir", "custom-report");
    const report = JSON.parse(await readFile(join(directory, "custom-report", "report.json"), "utf8"));
    assert.equal(report.base, base);
    assert.equal(report.summary.years.revised, 1);
    assert.match(await readFile(output, "utf8"), /changed=true\n$/);
    assert.match(await readFile(join(directory, "custom-report", "report.md"), "utf8"), /Publication requires human review/);
    assert.equal(await readFile(join(directory, "data", "processed", "dashboard.json"), "utf8"), changedData);
    assert.throws(() => run("--base", "missing-ref"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
