// Observation flags supplemented only by explicit official metadata.
// Reviewed against COFOG ESMS section 19 on 2026-10-14.
export const cofogMetadataUrl = "https://ec.europa.eu/eurostat/cache/metadata/en/gov_10a_exp_esms.htm";

export function metadataStatusOverrides(datasetCode, selector = {}) {
  if (datasetCode !== "gov_10a_exp") return {};
  return {
    IT: { 2024: "p" },
    EU27_2020: { 2024: "p" },
    BE: { 2024: "p" },
    DE: { 2022: "p", 2023: "p", 2024: "p" },
    ES: { 2024: "p" },
    FR: { 2023: "p", 2024: "p" },
    PT: { 2024: "p" },
    SK: { "*": "p" },
    // Bulgaria: only COFOG level-II groups, not all ten top-level divisions.
    ...(selector.cofog99?.length === 6 ? { BG: { "*": "p" } } : {}),
  };
}
