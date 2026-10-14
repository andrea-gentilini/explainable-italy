import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { metadataStatusOverrides } from "../scripts/metadata-rules.mjs";
import { euCountries, flattenJsonStat, buildSeries } from "../scripts/data-utils.mjs";

function records(count = 27) {
  return euCountries.slice(0, count).map((geo, index) => ({
    geo, time: "2024", value: index === 0 ? 0 : index, status: null,
  }));
}

test("country median includes zero, uses the same year and does not fabricate an EU value", () => {
  const points = buildSeries([...records(), { geo: "AT", time: "2025", value: 100, status: null }], {});
  assert.equal(points.length, 1);
  assert.equal(points[0].median, 13);
  assert.equal(points[0].coverage, 27);
  assert.equal(points[0].eu, null);
  assert.equal(points[0].euMethod, "unavailable");
});

test("even-country median reports coverage and missing countries without imputing", () => {
  const points = buildSeries(records(26), {});
  assert.equal(points[0].median, 12.5);
  assert.deepEqual(points[0].missingCountries, ["SE"]);
  assert.equal(buildSeries(records(23), {}).length, 0);
});

test("metadata flags supplement Italy and EU while preserving original flags", () => {
  const points = buildSeries([
    ...records().map((item) => item.geo === "IT" ? { ...item, status: "b" } : item),
    { geo: "EU27_2020", time: "2024", value: 200, status: "e" },
  ], {}, { 2024: "p" }, { 2024: "p" });
  assert.equal(points[0].eu, 200);
  assert.equal(points[0].status, "bp");
  assert.equal(points[0].sourceStatus, "b");
  assert.equal(points[0].euStatus, "ep");
  assert.equal(points[0].euSourceStatus, "e");
  assert.equal(points[0].countries.find((item) => item.geo === "IT").status, "bp");
});

test("a missing selector fails instead of silently picking the last observation", () => {
  assert.throws(() => buildSeries([...records(), { ...records()[0], unit: "OTHER" }], {}), /Ambiguous selection/);
});

test("JSON-stat rejects invalid cell coordinates and malformed source responses", () => {
  const dataset = {
    class: "dataset", id: ["geo", "time"], size: [1, 1],
    dimension: { geo: { category: { index: ["IT"] } }, time: { category: { index: { 2024: 0 } } } },
    value: { 0: 0 },
  };
  assert.equal(flattenJsonStat(dataset)[0].value, 0);
  assert.throws(() => flattenJsonStat({ ...dataset, value: { 1: 100 } }), /Invalid Eurostat cell index/);
  assert.throws(() => flattenJsonStat({ error: "Unavailable" }), /Invalid Eurostat/);
  assert.throws(() => flattenJsonStat({ ...dataset, dimension: {
    ...dataset.dimension, time: { category: { index: { 2024: 2 } } },
  } }), /Invalid Eurostat dimension positions/);
});

test("an interrupted source update leaves all snapshots and published files unchanged", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const manifest = JSON.parse(await readFile(`${root}/data/manifest.json`, "utf8"));
  const paths = [...manifest.datasets.map((item) => item.localPath),
    "data/manifest.json", "data/processed/dashboard.json", "public/data/manifest.json",
    "public/data/dashboard.json", "public/data/dashboard.csv"];
  const before = await Promise.all(paths.map((path) => readFile(`${root}/${path}`, "utf8")));
  const hook = `import {readFile} from "node:fs/promises";
    let calls = 0;
    globalThis.fetch = async () => {
      if (++calls > 1) throw new Error("Injected source outage");
      return {ok:true,text:async()=>readFile(${JSON.stringify(`${root}/data/raw/eurostat/gov_10a_exp.json`)},"utf8")};
    };`;
  const result = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(hook)}`,
    `${root}/scripts/update-data.mjs`], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Injected source outage/);
  const after = await Promise.all(paths.map((path) => readFile(`${root}/${path}`, "utf8")));
  assert.deepEqual(after, before);
});


test("metadata provisional flags apply to Bulgarian COFOG detail while preserving source flags", () => {
  const source = records();
  const detail = buildSeries(source, {}, {}, {}, metadataStatusOverrides("gov_10a_exp", { cofog99: "GF1002" }))[0];
  const bulgaria = detail.countries.find((item) => item.geo === "BG");
  assert.equal(bulgaria.status, "p");
  assert.equal(bulgaria.sourceStatus, null);
  assert(detail.countryStatuses.some((item) => item.geo === "BG" && item.status === "p"));
  const division = buildSeries(source, {}, {}, {}, metadataStatusOverrides("gov_10a_exp", { cofog99: "GF10" }))[0];
  assert.equal(division.countries.find((item) => item.geo === "BG").status, null);
  assert.equal(detail.italy, division.italy);
  assert.equal(detail.median, division.median);
});

test("a complete but inconsistent source response cannot replace published data", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const paths = ["data/manifest.json", "data/raw/eurostat/gov_10a_exp.json",
    "data/processed/dashboard.json", "public/data/dashboard.json", "public/data/dashboard.csv"];
  const before = await Promise.all(paths.map((path) => readFile(root + "/" + path, "utf8")));
  const hook = `import {readFile} from "node:fs/promises";
    globalThis.fetch = async (url) => {
      const code = new URL(url).pathname.split("/").at(-1);
      const data = JSON.parse(await readFile(${JSON.stringify(root)} + "/data/raw/eurostat/" + code + ".json", "utf8"));
      if (code === "gov_10a_exp") {
        for (const index of Object.keys(data.value)) {
          if (data.value[index] !== null) data.value[index] *= 2;
        }
      }
      return {ok:true,text:async()=>JSON.stringify(data)};
    };`;
  const result = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(hook)}`,
    root + "/scripts/update-data.mjs"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /COFOG/);
  const after = await Promise.all(paths.map((path) => readFile(root + "/" + path, "utf8")));
  assert.deepEqual(after, before);
});
