import { getIndicatorReading } from "./indicator-reading.mjs";

type IndicatorReadingProps = {
  indicator: { id: string; unitKey: string; precision: number };
  point: { year: number; italy: number; eu: number | null };
  locale: "it" | "en";
};

export function IndicatorReading({ indicator, point, locale }: IndicatorReadingProps) {
  const reading = getIndicatorReading(indicator, point, locale);
  if (!reading) return null;

  return (
    <aside className="reading-context" aria-label={locale === "it" ? "Come leggere il dato" : "Reading this value"}>
      <p className="reading-context-title">
        {locale === "it" ? "Come leggere il dato" : "Reading this value"}
      </p>
      <p>{reading.description}{reading.comparison ? " " + reading.comparison : ""}</p>
      {indicator.id === "gdp-per-capita-pps" ? (
        <div className="pps-guide">
          <h3>{locale === "it" ? "Come funziona la scala UE = 100" : "How the EU = 100 scale works"}</h3>
          <p>{locale === "it" ? "Il PIL riassume il valore della produzione economica di un anno. Diviso per il numero di abitanti, permette di confrontare economie di dimensioni diverse." : "GDP summarises the value of a year’s economic output. Dividing it by the number of residents lets us compare economies of different sizes."}</p>
          <p>{locale === "it" ? "Eurostat corregge anche le differenze di prezzo tra Paesi: lo stesso importo può acquistare quantità diverse di beni e servizi. Questa correzione, detta parità di potere d’acquisto, rende i valori confrontabili." : "Eurostat also adjusts for price differences between countries: the same amount can buy different quantities of goods and services. This adjustment, called purchasing power parity, makes the figures comparable."}</p>
          <p>{locale === "it" ? "Il PIL per abitante dell’UE nel suo insieme è il riferimento, fissato a 100 ogni anno. Il numero italiano esprime il rapporto con quel valore." : "GDP per person for the EU as a whole is the reference, set to 100 each year. Italy’s figure expresses its ratio to that value."}</p>
          <dl className="pps-examples" aria-label={locale === "it" ? "Esempi illustrativi della scala" : "Illustrative examples of the scale"}>
            <div><dt>80</dt><dd>{locale === "it" ? "20% sotto il valore UE" : "20% below the EU value"}</dd></div>
            <div><dt>100</dt><dd>{locale === "it" ? "Uguale al valore UE" : "Equal to the EU value"}</dd></div>
            <div><dt>120</dt><dd>{locale === "it" ? "20% sopra il valore UE" : "20% above the EU value"}</dd></div>
          </dl>
          <small>{locale === "it" ? "Esempi illustrativi. Sono valori di un indice, senza unità monetaria." : "Illustrative examples. These are index values, with no monetary unit."}</small>
          <p><a href="https://ec.europa.eu/eurostat/statistics-explained/index.php?title=GDP_per_capita,_consumption_per_capita_and_price_level_indices" target="_blank" rel="noreferrer">{locale === "it" ? "La spiegazione di Eurostat" : "Eurostat’s explanation"} <span aria-hidden="true">↗</span></a></p>
        </div>
      ) : null}
      {reading.caution ? <p className="reading-context-caution">{reading.caution}</p> : null}
    </aside>
  );
}
