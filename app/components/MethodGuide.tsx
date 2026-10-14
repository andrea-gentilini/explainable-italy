import type { CSSProperties } from "react";

export function MethodGuide({ locale, sourcesHref }: { locale: "it" | "en"; sourcesHref: string }) {
  const it = locale === "it";
  return (
    <section className="method-guide" aria-labelledby="reading-guide">
      <h2 id="reading-guide">{it ? "Un numero, il suo contesto" : "A number and its context"}</h2>
      <p>{it ? "Tre distinzioni aiutano a leggere il confronto senza attribuirgli più di quanto dica." : "Three distinctions help you read a comparison without asking it to say more than it does."}</p>
      <p>{it ? "Le differenze fra Paesi o nel tempo non dimostrano da sole un rapporto causa-effetto, né costituiscono una valutazione complessiva di un Paese. Leggi sempre definizioni e perimetro dell’indicatore." : "Differences between countries or over time do not, by themselves, establish cause and effect or provide an overall assessment of a country. Always check the indicator’s definition and scope."}</p>
      <details>
        <summary>{it ? "Aggregato UE e mediana rispondono a domande diverse" : "The EU aggregate and the median answer different questions"}</summary>
        <div className="method-guide-body">
          <p>{it ? "L’aggregato UE descrive l’Unione nel suo insieme. È pubblicato da Eurostat secondo le regole di ciascun indicatore: il progetto non lo ricostruisce facendo la media dei valori nazionali." : "The EU aggregate describes the Union as a whole. Eurostat publishes it using each indicator’s own methodology: the project does not reconstruct it by averaging national values."}</p>
          <p>{it ? "La mediana descrive invece il Paese centrale: ordiniamo i valori disponibili e prendiamo quello al centro. Ogni Paese conta una volta, indipendentemente dalla popolazione. Con un numero pari di Paesi, usiamo la media dei due valori centrali." : "The median describes the country in the middle: we sort the available values and take the central one. Each country counts once, regardless of population. With an even number of countries, we average the two middle values."}</p>
          <figure className="median-example">
            <figcaption>{it ? "Esempio inventato: cinque Paesi, valori ordinati" : "Made-up example: five countries, sorted values"}</figcaption>
            <div className="median-example-values">
              {[10, 12, 14, 18, 40].map((value, index) => <span key={value} data-middle={index === 2} style={{ "--example-height": `${value / 40 * 100}%` } as CSSProperties}><i aria-hidden="true" /><strong>{value}</strong>{index === 2 ? <small>{it ? "mediana" : "median"}</small> : null}</span>)}
            </div>
            <p>{it ? "La mediana è 14. Il valore 40 non sposta il Paese centrale. Questo esempio non rappresenta dati reali e non calcola un aggregato UE." : "The median is 14. The value 40 does not move the middle country. This example is not real data and does not calculate an EU aggregate."}</p>
          </figure>
        </div>
      </details>
      <details>
        <summary>{it ? "Anno, aggiornamento e stato del dato sono cose diverse" : "Reference year, update date and observation status are different"}</summary>
        <div className="method-guide-body">
          <dl className="method-terms">
            <div><dt>{it ? "Anno del dato" : "Reference year"}</dt><dd>{it ? "È il periodo descritto dal numero. Un dataset aggiornato oggi può contenere dati riferiti a due anni fa." : "The period described by the number. A dataset updated today can contain figures referring to two years ago."}</dd></div>
            <div><dt>{it ? "Aggiornamento Eurostat" : "Eurostat update"}</dt><dd>{it ? "È la data di aggiornamento del dataset presso la fonte. Non implica che ogni osservazione o ogni anno sia cambiato." : "The source dataset’s update date. It does not imply that every observation or reference year changed."}</dd></div>
            <div><dt>{it ? "Acquisizione del progetto" : "Project acquisition"}</dt><dd>{it ? "È il momento in cui il progetto ha acquisito la copia utilizzata. Revisioni successive della fonte possono differire dallo snapshot pubblicato qui." : "When the project acquired the copy used here. Later revisions at the source may differ from this published snapshot."}</dd></div>
            <div><dt>{it ? "Stato del dato" : "Observation status"}</dt><dd>{it ? "Stime, dati provvisori, previsioni e discontinuità sono segnalati separatamente. Lo stato del dato italiano non determina quello dell’aggregato UE o dei Paesi nella mediana." : "Estimates, provisional figures, forecasts and breaks are flagged separately. The Italian observation’s status does not determine the status of the EU aggregate or the countries used in the median."}</dd></div>
          </dl>
        </div>
      </details>
      <details>
        <summary>{it ? "Come verificare o riutilizzare un numero" : "How to verify or reuse a number"}</summary>
        <div className="method-guide-body">
          <ol>
            <li>{it ? "Apri una scheda e scegli l’anno del confronto." : "Open an indicator and select the comparison year."}</li>
            <li>{it ? "Segui “Verifica fonte e calcolo”: trovi la selezione applicata, i valori nazionali della mediana e i contrassegni della fonte." : "Follow “Verify source and calculation” for the exact selection, the national values behind the median, and source flags."}</li>
            <li>{it ? "Scarica il CSV per lavorare sui valori. Lo snapshot conserva la risposta usata; l’API mostra invece i dati correnti, che possono essere stati rivisti." : "Download the CSV to work with the values. The snapshot preserves the response used here; the API instead shows current data, which may have been revised."}</li>
          </ol>
          <a href={sourcesHref}>{it ? "Fonti, download e registro delle acquisizioni" : "Sources, downloads and acquisition register"} <span aria-hidden="true">→</span></a>
        </div>
      </details>
    </section>
  );
}
