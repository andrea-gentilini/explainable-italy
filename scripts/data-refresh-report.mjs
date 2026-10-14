import { execFileSync } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ignoredTimestamps = new Set(["generatedAt", "accessedAt"]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort()
      .filter((key) => !ignoredTimestamps.has(key))
      .map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function same(before, after) {
  return JSON.stringify(canonical(before)) === JSON.stringify(canonical(after));
}

function fieldsChanged(before = {}, after = {}, excluded = []) {
  const skip = new Set([...ignoredTimestamps, ...excluded]);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .filter((key) => !skip.has(key) && !same(before[key], after[key]));
}

function index(items, key, label) {
  if (!Array.isArray(items)) throw new Error(`${label} must be an array`);
  const result = new Map();
  for (const item of items) {
    const id = item?.[key];
    if ((typeof id !== "string" && typeof id !== "number") || result.has(id)) {
      throw new Error(`${label} has a missing or duplicate ${key}: ${id}`);
    }
    result.set(id, item);
  }
  return result;
}

function keys(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])].sort((a, b) =>
    typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "en"));
}

function valueChange(before, after) {
  return { before: before ?? null, after: after ?? null };
}

function compareYears(before, after) {
  const previous = index(before, "year", "Previous series");
  const current = index(after, "year", "Current series");
  const added = [];
  const removed = [];
  const revised = [];
  for (const year of keys(previous, current)) {
    const oldPoint = previous.get(year);
    const newPoint = current.get(year);
    if (!oldPoint) added.push(year);
    else if (!newPoint) removed.push(year);
    else if (!same(oldPoint, newPoint)) {
      const oldCountries = index(oldPoint.countries ?? [], "geo", `Previous countries in ${year}`);
      const newCountries = index(newPoint.countries ?? [], "geo", `Current countries in ${year}`);
      revised.push({
        year,
        fields: fieldsChanged(oldPoint, newPoint),
        values: Object.fromEntries(["italy", "eu", "median", "coverage", "status", "sourceStatus", "euStatus", "euSourceStatus"]
          .filter((key) => !same(oldPoint[key], newPoint[key]))
          .map((key) => [key, valueChange(oldPoint[key], newPoint[key])])),
        countries: keys(oldCountries, newCountries)
          .filter((geo) => !same(oldCountries.get(geo), newCountries.get(geo)))
          .map((geo) => ({ geo, ...valueChange(oldCountries.get(geo), newCountries.get(geo)) })),
      });
    }
  }
  return { added, removed, revised };
}

/** Compare full official snapshots and derived histories, ignoring only acquisition/build timestamps. */
export function compareRefresh(beforeManifest, beforeDashboard, afterManifest, afterDashboard) {
  const oldDatasets = index(beforeManifest.datasets, "datasetCode", "Previous datasets");
  const newDatasets = index(afterManifest.datasets, "datasetCode", "Current datasets");
  const oldIndicators = index(beforeDashboard.indicators, "id", "Previous indicators");
  const newIndicators = index(afterDashboard.indicators, "id", "Current indicators");
  const datasets = [];
  for (const datasetCode of keys(oldDatasets, newDatasets)) {
    const before = oldDatasets.get(datasetCode);
    const after = newDatasets.get(datasetCode);
    if (same(before, after)) continue;
    datasets.push({
      datasetCode,
      change: !before ? "added" : !after ? "removed" : "updated",
      fields: fieldsChanged(before, after),
      rawSnapshotChanged: !same(before?.sha256, after?.sha256),
      selectionChanged: !same(before?.apiUrl, after?.apiUrl),
      metadataFields: fieldsChanged(before, after, ["sha256", "bytes", "apiUrl"]),
      sha256: valueChange(before?.sha256, after?.sha256),
      sourceUpdatedAt: valueChange(before?.sourceUpdatedAt, after?.sourceUpdatedAt),
    });
  }
  const indicators = [];
  for (const id of keys(oldIndicators, newIndicators)) {
    const before = oldIndicators.get(id);
    const after = newIndicators.get(id);
    if (same(before, after)) continue;
    indicators.push({
      id,
      change: !before ? "added" : !after ? "removed" : "updated",
      datasetCode: after?.source?.datasetCode ?? before?.source?.datasetCode ?? null,
      years: compareYears(before?.series ?? [], after?.series ?? []),
      metadataFields: fieldsChanged(before, after, ["id", "series", "latest", "newerEstimate", "source"]),
      sourceFields: fieldsChanged(before?.source, after?.source),
      latestChanged: !same(before?.latest, after?.latest),
      newerEstimateChanged: !same(before?.newerEstimate, after?.newerEstimate),
      defaultYear: valueChange(before?.latest?.year, after?.latest?.year),
    });
  }
  const manifestFields = fieldsChanged(beforeManifest, afterManifest, ["datasets"]);
  const dashboardFields = fieldsChanged(beforeDashboard, afterDashboard, ["indicators"]);
  const orderChanged = {
    datasets: !same([...oldDatasets.keys()], [...newDatasets.keys()]),
    indicators: !same([...oldIndicators.keys()], [...newIndicators.keys()]),
  };
  const count = (items, kind) => items.filter((item) => item.change === kind).length;
  return {
    changed: Boolean(datasets.length || indicators.length || manifestFields.length || dashboardFields.length || orderChanged.datasets || orderChanged.indicators),
    summary: {
      datasets: {
        added: count(datasets, "added"), removed: count(datasets, "removed"), updated: count(datasets, "updated"),
        rawSnapshots: datasets.filter((item) => item.rawSnapshotChanged).length,
        selections: datasets.filter((item) => item.selectionChanged).length,
        metadata: datasets.filter((item) => item.metadataFields.length).length,
      },
      indicators: {
        added: count(indicators, "added"), removed: count(indicators, "removed"), updated: count(indicators, "updated"),
        metadata: indicators.filter((item) => item.metadataFields.length).length,
        sources: indicators.filter((item) => item.sourceFields.length).length,
        defaults: indicators.filter((item) => item.latestChanged || item.newerEstimateChanged).length,
      },
      years: {
        added: indicators.reduce((sum, item) => sum + item.years.added.length, 0),
        removed: indicators.reduce((sum, item) => sum + item.years.removed.length, 0),
        revised: indicators.reduce((sum, item) => sum + item.years.revised.length, 0),
      },
    },
    datasets,
    indicators,
    manifestFields,
    dashboardFields,
    orderChanged,
  };
}

function cell(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll("|", "\\|").replaceAll("`", "\\`").replace(/[\r\n]+/g, " ");
}

function yearsLabel(years) {
  return years.length ? `${years.length} (${years.join(", ")})` : "0";
}

export function formatRefreshReport(report, { base } = {}) {
  const { summary } = report;
  const lines = [
    "## Official-data refresh",
    "",
    report.changed ? "Changes were found in the official snapshots or the derived data. Publication requires human review." : "No changes beyond acquisition or build timestamps were found. No data update is proposed.",
    ...(base ? ["", `Compared with commit \`${cell(base)}\`.`] : []),
    "",
    "| Scope | Added | Updated | Removed |",
    "| --- | ---: | ---: | ---: |",
    `| Datasets | ${summary.datasets.added} | ${summary.datasets.updated} | ${summary.datasets.removed} |`,
    `| Indicators | ${summary.indicators.added} | ${summary.indicators.updated} | ${summary.indicators.removed} |`,
    `| Indicator-year observations | ${summary.years.added} | ${summary.years.revised} | ${summary.years.removed} |`,
    "",
    `Raw snapshot changes: **${summary.datasets.rawSnapshots}**. Dataset selection changes: **${summary.datasets.selections}**. Dataset metadata changes: **${summary.datasets.metadata}**.`,
    "",
    "An observation counts as revised if any value, country coverage, flag or other stored field changes. This includes historical years. Changes to a raw snapshot may concern metadata or observations outside the displayed series.",
  ];
  if (report.datasets.length) {
    lines.push("", "### Datasets", "", "| Dataset | Change | Raw snapshot | Selection | Metadata fields |", "| --- | --- | --- | --- | --- |");
    for (const item of report.datasets) lines.push(`| ${cell(item.datasetCode)} | ${item.change} | ${item.rawSnapshotChanged ? "changed" : "unchanged"} | ${item.selectionChanged ? "changed" : "unchanged"} | ${cell(item.metadataFields.join(", ") || "none")} |`);
  }
  if (report.indicators.length) {
    lines.push("", "### Indicators", "", "| Indicator | Change | New years | Revised years | Removed years | Other changes |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const item of report.indicators) {
      const other = [
        ...(item.metadataFields.length ? [`metadata: ${item.metadataFields.join(", ")}`] : []),
        ...(item.sourceFields.length ? [`source: ${item.sourceFields.join(", ")}`] : []),
        ...(item.latestChanged ? [`default observation (${item.defaultYear.before ?? "none"} → ${item.defaultYear.after ?? "none"})`] : []),
        ...(item.newerEstimateChanged ? ["newer estimate"] : []),
      ].join(". ") || "none";
      lines.push(`| ${cell(item.id)} | ${item.change} | ${yearsLabel(item.years.added)} | ${yearsLabel(item.years.revised.map((point) => point.year))} | ${yearsLabel(item.years.removed)} | ${cell(other)} |`);
    }
  }
  if (report.manifestFields.length) lines.push("", `Global manifest fields changed: ${cell(report.manifestFields.join(", "))}.`);
  if (report.dashboardFields.length) lines.push("", `Global dashboard fields changed: ${cell(report.dashboardFields.join(", "))}.`);
  if (report.orderChanged.datasets || report.orderChanged.indicators) lines.push("", "The dataset or indicator list order or membership changed.");
  lines.push("", "### Review before publication", "", "Check the official definitions, units, selected populations, comparability and source notes for affected datasets. Automated checks cannot establish that a methodological change is harmless. Confirm that historical revisions, flags, defaults and missing observations are reflected accurately in the site text.", "", "The JSON report contains the changed fields and before/after values for revised observations. Acquisition and build timestamps (`accessedAt`, `generatedAt`) are ignored for change detection. Official source update dates and raw snapshot checksums remain significant.", "");
  return lines.join("\n");
}

async function main() {
  let base = "HEAD";
  let outputDir = ".data-refresh";
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--base" || args[i] === "--output-dir") && args[i + 1]) {
      if (args[i] === "--base") base = args[++i];
      else outputDir = args[++i];
    } else throw new Error(`Unsupported or incomplete argument: ${args[i]}`);
  }
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const commit = execFileSync("git", ["rev-parse", "--verify", "--end-of-options", `${base}^{commit}`], { cwd: repo, encoding: "utf8" }).trim();
  const readBase = (path) => JSON.parse(execFileSync("git", ["show", `${commit}:${path}`], { cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  const [manifest, dashboard] = await Promise.all(["data/manifest.json", "data/processed/dashboard.json"].map(async (path) => JSON.parse(await readFile(resolve(repo, path), "utf8"))));
  const report = { base: commit, ...compareRefresh(readBase("data/manifest.json"), readBase("data/processed/dashboard.json"), manifest, dashboard) };
  const destination = resolve(repo, outputDir);
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(resolve(destination, "report.md"), formatRefreshReport(report, { base: commit }));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${report.changed}\n`);
  console.log(report.changed ? "Data changes found. Review report.md before publication." : "No data changes beyond acquisition/build timestamps.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
