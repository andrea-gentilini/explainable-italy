import type { MetadataRoute } from "next";
import { pageUrl } from "./metadata";
import { allIndicatorParams } from "./page-data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "data",
    "method",
    "sources",
    "about",
    "contribute",
    ...allIndicatorParams().flatMap(({ id }) => [
      `data/${id}`,
      `data/${id}/source`,
    ]),
  ];
  return paths.flatMap((path) =>
    (["it", "en"] as const).map((locale) => ({
      url: pageUrl(locale, path),
      alternates: {
        languages: {
          "it-IT": pageUrl("it", path),
          "en-GB": pageUrl("en", path),
        },
      },
    })),
  );
}
