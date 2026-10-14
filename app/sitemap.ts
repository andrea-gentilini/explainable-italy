import type { MetadataRoute } from "next";
import data from "../data/processed/dashboard.json";
import { pageUrl } from "./metadata";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "data", "method", "sources", "about", "contribute", ...data.indicators.flatMap((indicator) => [`data/${indicator.id}`, `data/${indicator.id}/source`])];
  return paths.flatMap((path) => (["it", "en"] as const).map((locale) => ({
    url: pageUrl(locale, path),
    alternates: { languages: { "it-IT": pageUrl("it", path), "en-GB": pageUrl("en", path) } },
  })));
}
