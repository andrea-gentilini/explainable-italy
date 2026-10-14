import type { Metadata } from "next";

export const siteUrl = "https://andrea-gentilini.github.io/explainable-italy";
export type Locale = "it" | "en";

export function pageUrl(locale: Locale, path = "") {
  return `${siteUrl}${locale === "en" ? "/en" : ""}${path ? `/${path}` : ""}/`;
}

export function pageMetadata(locale: Locale, path: string, title: string, description?: string): Metadata {
  const fullTitle = title === "Explainable Italy" ? title : `${title} · Explainable Italy`;
  const image = {
    url: `${siteUrl}/social-preview-v2.jpg`,
    width: 1536,
    height: 804,
    alt: locale === "it" ? "Explainable Italy. L’Italia, i dati ufficiali per tutti." : "Explainable Italy. Official data for everyone.",
  };
  return {
    title: fullTitle,
    description,
    applicationName: "Explainable Italy",
    authors: [{ name: "Andrea Gentilini" }],
    creator: "Andrea Gentilini",
    metadataBase: new URL(`${siteUrl}/`),
    alternates: {
      canonical: pageUrl(locale, path),
      languages: { "it-IT": pageUrl("it", path), "en-GB": pageUrl("en", path), "x-default": pageUrl("it", path) },
    },
    openGraph: {
      type: "website", siteName: "Explainable Italy", title: fullTitle, description,
      url: pageUrl(locale, path), locale: locale === "it" ? "it_IT" : "en_GB",
      alternateLocale: locale === "it" ? "en_GB" : "it_IT", images: [image],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
    icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg` },
  };
}
