import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIndicatorCsv } from "../scripts/data-utils.mjs";

test("downloadable CSV preserves zeros, missing EU aggregates, negative values and quality flags", () => {
  const csv = buildIndicatorCsv({ unitKey: "percent", source: { datasetCode: "example" }, series: [
    {
      year: 2024, italy: 0, eu: null, median: -2.5, coverage: 26,
      euMethod: "unavailable", status: null, euStatus: null,
      countryStatuses: [{ geo: "DE", status: "p" }, { geo: "FR", status: "b" }],
      missingCountries: ["LU"],
    },
    {
      year: 2025, italy: -3.1, eu: 0, median: 0.1 + 0.2, coverage: 27,
      euMethod: "official_aggregate", status: "p", euStatus: "e",
      countryStatuses: [{ geo: "IT", status: "p" }], missingCountries: [],
    },
  ] });
  assert.equal(csv,
    "year,italy,eu_official,median,countries_in_median,eu_method,italy_status,eu_status,flagged_countries,missing_countries,unit,dataset\n" +
    "2024,0,,-2.5,26,unavailable,,,DE:p|FR:b,LU,percent,example\n" +
    "2025,-3.1,0,0.3,27,official_aggregate,p,e,IT:p,,percent,example\n");
});
