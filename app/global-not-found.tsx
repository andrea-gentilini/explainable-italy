import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pagina non trovata · Explainable Italy",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <html lang="it"><body>
      <main style={{ maxWidth: "42rem", margin: "12vh auto", padding: "2rem", lineHeight: 1.7 }}>
        <p>Explainable Italy · 404</p>
        <h1>Questa pagina non esiste</h1>
        <p>Il collegamento potrebbe essere cambiato. Puoi ripartire dagli indicatori e dalle loro fonti.</p>
        <p><a href={`${base}/data/`}>Esplora i dati →</a></p>
        <section lang="en" style={{ marginTop: "3rem" }}>
          <h2>Page not found</h2>
          <p>The link may have changed. Explore the indicators and their sources from the catalogue.</p>
          <p><a href={`${base}/en/data/`}>Explore the data →</a></p>
        </section>
      </main>
    </body></html>
  );
}
