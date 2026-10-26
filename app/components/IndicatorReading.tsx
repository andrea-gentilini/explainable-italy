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

function formatSignedPercent(value: number, locale: "it" | "en", precision = 1) {
  const formatter = new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatter.format(value)}%`;
}

function formatIndexNumber(value: number, locale: "it" | "en", precision = 1) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function IndicatorReading({ indicator, point, locale }: IndicatorReadingProps) {
  const reading = getIndicatorReading(indicator, point, locale);
  if (!reading) return null;

  const cumulative =
    indicator.unitKey === "percent_change" && indicator.series?.length
      ? buildCumulativeIndexSeries(indicator.series)
      : null;
  const cumulativePoint = cumulative?.points.find(
    (entry) => entry.year === point.year,
  );

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
      {cumulative && cumulativePoint && cumulative.baseYear !== null ? (
        <div className="pps-guide index-vs-rate-guide">
          <h3>
            {locale === "it"
              ? `Variazione annua (%) e indice cumulato (${cumulative.baseYear} = 100)`
              : `Annual rate of change (%) and cumulative index (${cumulative.baseYear} = 100)`}
          </h3>
          <p>
            {indicator.id === "inflation"
              ? locale === "it"
                ? `Il tasso annuo misura la velocità con cui i prezzi cambiano rispetto all’anno precedente; l’indice cumulato misura invece il livello raggiunto dai prezzi ponendo uguale a 100 la base iniziale (${cumulative.baseYear} = 100).`
                : `The annual rate measures how fast prices change compared with the previous year; the cumulative index measures the resulting price level when the starting base is set to 100 (${cumulative.baseYear} = 100).`
              : locale === "it"
                ? `Il tasso annuo misura la variazione rispetto all’anno precedente; l’indice cumulato mostra invece il livello raggiunto dal PIL reale per abitante ponendo uguale a 100 la base iniziale (${cumulative.baseYear} = 100).`
                : `The annual rate measures the change from the previous year; the cumulative index shows the resulting level of real GDP per person when the starting base is set to 100 (${cumulative.baseYear} = 100).`}
          </p>
          <dl
            className="pps-examples index-vs-rate-cards"
            aria-label={
              locale === "it"
                ? `Confronto tra tasso annuo e indice cumulato nel ${point.year}`
                : `Comparison between annual rate and cumulative index in ${point.year}`
            }
          >
            <div>
              <dt>
                {locale === "it"
                  ? `Tasso annuo (${point.year} su ${point.year - 1})`
                  : `Annual rate (${point.year} vs ${point.year - 1})`}
              </dt>
              <dd>
                <strong>
                  {locale === "it" ? "Italia" : "Italy"}:{" "}
                  {formatSignedPercent(point.italy, locale, indicator.precision)}
                </strong>
                {point.eu !== null ? (
                  <span>
                    {" "}
                    · {locale === "it" ? "UE" : "EU"}:{" "}
                    {formatSignedPercent(point.eu, locale, indicator.precision)}
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>
                {locale === "it"
                  ? `Indice cumulato Italia (${cumulative.baseYear} = 100)`
                  : `Italy cumulative index (${cumulative.baseYear} = 100)`}
              </dt>
              <dd>
                <strong>{formatIndexNumber(cumulativePoint.italy, locale, 1)}</strong>{" "}
                <span>
                  ({formatSignedPercent(cumulativePoint.italyCumulativeChange, locale, 1)}{" "}
                  {locale === "it" ? `dal ${cumulative.baseYear}` : `since ${cumulative.baseYear}`})
                </span>
              </dd>
            </div>
            {cumulativePoint.eu !== null &&
            cumulativePoint.euCumulativeChange !== null ? (
              <div>
                <dt>
                  {locale === "it"
                    ? `Indice cumulato UE (${cumulative.baseYear} = 100)`
                    : `EU cumulative index (${cumulative.baseYear} = 100)`}
                </dt>
                <dd>
                  <strong>{formatIndexNumber(cumulativePoint.eu, locale, 1)}</strong>{" "}
                  <span>
                    ({formatSignedPercent(cumulativePoint.euCumulativeChange, locale, 1)}{" "}
                    {locale === "it" ? `dal ${cumulative.baseYear}` : `since ${cumulative.baseYear}`})
                  </span>
                </dd>
              </div>
            ) : null}
          </dl>
          <small>
            {locale === "it"
              ? `Il tasso annuo è l’osservazione ufficiale Eurostat. L’indice cumulato è un’elaborazione del progetto ottenuta concatenando le variazioni annue ufficiali; nel grafico storico qui sotto puoi anche scegliere un altro anno base (= 100).`
              : `The annual rate is Eurostat’s official observation. The cumulative index is a project calculation obtained by chaining the official annual rates; in the historical chart below you can also rebase the index to another year (= 100).`}
          </small>
        </div>
      ) : null}
      {reading.caution ? <p className="reading-context-caution">{reading.caution}</p> : null}
    </aside>
  );
}
