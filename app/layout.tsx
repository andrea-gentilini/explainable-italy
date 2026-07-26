import type { Metadata } from "next";
import "./globals.css";
import "./redesign.css";

export const metadata: Metadata = {
  title: {
    default: "Explainable Italy",
    template: "%s · Explainable Italy",
  },
  description: "L’Italia, i dati ufficiali per tutti.",
  applicationName: "Explainable Italy",
  authors: [{ name: "Andrea Gentilini" }],
  creator: "Andrea Gentilini",
  metadataBase: new URL("https://andrea-gentilini.github.io/explainable-italy/"),
  alternates: {
    languages: {
      "it-IT": "/",
      "en-GB": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    title: "Explainable Italy",
    description: "L’Italia, i dati ufficiali per tutti.",
    images: [
      {
        url: "social-preview-v2.jpg",
        width: 1536,
        height: 804,
        alt: "Explainable Italy. L’Italia, i dati ufficiali per tutti.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explainable Italy",
    description: "L’Italia, i dati ufficiali per tutti.",
    images: ["social-preview-v2.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
