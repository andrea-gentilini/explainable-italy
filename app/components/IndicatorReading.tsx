import {
  buildCumulativeIndexSeries,
  getIndicatorReading,
} from "./indicator-reading.mjs";

type IndicatorReadingProps = {
  indicator: {
    id: string;
    unitKey: string;
    precision: number;
    series?: Array<{
      year: number;
      italy: number;
      eu: number | null;
      status?: string | null;
    }>;
  };
  point: { year: number; italy: number; eu: number | null };
  locale: "it" | "en";
};

export function IndicatorReading({ indicator, point, locale }: IndicatorReadingProps) {
  const reading = getIndicatorReading(indicator, point, locale);
  if (!reading) return null;

  const cumulative =
    indicator.unitKey === "percent_change" && indicator.series?.length
      ? buildCumulativeIndexSeries(indicator.series)
      : null;

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
      {cumulative && cumulative.baseYear !== null ? (
        <div className="pps-guide index-vs-rate-guide">
          <h3>
            {locale === "it"
              ? `Come funzionano tasso annuo (%) e indice cumulato (${cumulative.baseYear} = 100)`
              : `How the annual rate (%) and cumulative index (${cumulative.baseYear} = 100) work`}
          </h3>
          <p>
            {locale === "it"
              ? `Il tasso di variazione annuo (%) misura la variazione rispetto all’anno precedente; l’indice cumulato fissa uguale a 100 l’anno base (${cumulative.baseYear} = 100 di default) e mostra il livello complessivo raggiunto concatenando le variazioni annue successive.`
              : `The annual rate of change (%) measures the change compared with the previous year; the cumulative index sets the base year to 100 (${cumulative.baseYear} = 100 by default) and shows the overall level reached by chaining subsequent annual changes.`}
          </p>
          <dl
            className="pps-examples index-vs-rate-cards"
            aria-label={
              locale === "it"
                ? "Esempi illustrativi di tasso annuo e indice cumulato"
                : "Illustrative examples of annual rate and cumulative index"
            }
          >
            <div>
              <dt>{locale === "it" ? "+5% poi +2%" : "+5% then +2%"}</dt>
              <dd>
                {locale === "it"
                  ? "Il tasso annuo rallenta, ma il livello dell’indice continua a salire (da 100 a 105,0 e poi a 107,1)"
                  : "The annual rate slows down, but the index level keeps rising (from 100 to 105.0, then 107.1)"}
              </dd>
            </div>
            <div>
              <dt>{locale === "it" ? "0,0%" : "0.0%"}</dt>
              <dd>
                {locale === "it"
                  ? "Variazione annua nulla: il livello dell’indice resta invariato rispetto all’anno precedente"
                  : "Zero annual change: the index level remains unchanged from the previous year"}
              </dd>
            </div>
            <div>
              <dt>{locale === "it" ? "−2,0%" : "−2.0%"}</dt>
              <dd>
                {locale === "it"
                  ? "Tasso annuo negativo: il livello dell’indice scende rispetto all’anno precedente"
                  : "Negative annual rate: the index level falls compared with the previous year"}
              </dd>
            </div>
          </dl>
          <small>
            {locale === "it"
              ? "Esempi illustrativi. Il tasso annuo è l’osservazione ufficiale Eurostat; l’indice cumulato nel grafico storico qui sotto è un’elaborazione del progetto ottenuta concatenando i tassi annui ufficiali (arrotondati al decimo di punto; su periodi lunghi può quindi differire di pochi decimi da un indice calcolato sulle serie non arrotondate)."
              : "Illustrative examples. The annual rate is Eurostat’s official observation; the cumulative index in the historical chart below is a project calculation obtained by chaining the official annual rates (rounded to one decimal place; over long periods it may therefore differ by a few tenths from an index computed on unrounded series)."}
          </small>
        </div>
      ) : null}
      {reading.caution ? <p className="reading-context-caution">{reading.caution}</p> : null}
    </aside>
  );
}
