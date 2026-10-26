import type { CSSProperties } from "react";

export function MethodGuide({ locale, sourcesHref, catalogueHref }: { locale: "it" | "en"; sourcesHref: string; catalogueHref: string }) {
  const it = locale === "it";
  return (
    <section className="method-guide" aria-labelledby="reading-guide">
      <h2 id="reading-guide">{it ? "Come leggere questi dati" : "How to read these figures"}</h2>
      <p>{it ? "Apri una scheda, scegli un anno e confronta il valore italiano con quello dell’UE e con la mediana dei Paesi. Qui trovi le indicazioni per leggere il confronto e risalire alla fonte." : "Open an indicator, choose a year and compare Italy with the EU and the median across countries. This guide explains how to read the comparison and check the source."}</p>
      <details id="indicator-selection">
        <summary>{it ? "Come scegliamo i quattro esempi della homepage" : "How we choose the four examples on the homepage"}</summary>
        <div className="method-guide-body">
          <p>{it ? "La homepage propone un percorso iniziale attraverso produzione per abitante, età della popolazione, speranza di vita e occupazione. La selezione è una scelta editoriale del progetto e copre solo una parte dei temi disponibili." : "The homepage offers a starting point through output per person, population age, life expectancy and employment. This is an editorial choice by the project and covers only some of the available topics."}</p>
          <p>{it ? "Per questa scelta consideriamo aspetti diversi della vita del Paese, definizioni comprensibili, serie storiche e confronti europei disponibili. Gli indicatori sono scelti manualmente e restano gli stessi quando i valori vengono aggiornati." : "We consider different aspects of life in the country, understandable definitions, historical series and available European comparisons. The indicators are selected manually and stay the same when values are updated."}</p>
          <p>{it ? "Mettere alcuni dati in primo piano orienta l’attenzione. Queste schede offrono una visione parziale, senza rappresentare il peso o l’importanza di ciascun tema. Nel catalogo trovi anche istruzione, ambiente e gli altri ambiti del progetto, con ricerca e filtri per esplorarli." : "Giving some figures more prominence directs attention. These indicators provide a partial view and do not represent the weight or importance of each topic. The catalogue also includes education, the environment and the project’s other topics, with search and filters to explore them."}</p>
          <a href={catalogueHref}>{it ? "Vedi tutti gli indicatori" : "View all indicators"} <span aria-hidden="true">→</span></a>
        </div>
      </details>
      <details>
        <summary>{it ? "Come funziona la ricerca" : "How search works"}</summary>
        <div className="method-guide-body">
          <p>{it ? "La ricerca confronta la domanda con titoli, descrizioni e termini associati agli indicatori. Riconosce alcuni sinonimi ed errori di battitura e ordina le schede per rilevanza. La corrispondenza con il titolo ha più peso di una parola presente nei dettagli tecnici. Le parole senza corrispondenze nel catalogo vengono ignorate; per mostrare una scheda serve comunque un legame forte con il suo argomento." : "Search compares your query with indicator titles, descriptions and associated terms. It recognises some synonyms and spelling errors and ranks indicators by relevance. A title match carries more weight than a word in the technical details. Words with no match in the catalogue are ignored; an indicator still needs a strong connection to the query’s topic to appear."}</p>
          <p>{it ? "Il calcolo avviene nel browser. Apri i risultati per verificare che la definizione dell’indicatore corrisponda alla domanda che ti interessa." : "The calculation runs in your browser. Open a result to check that the indicator’s definition matches the question you want to explore."}</p>
        </div>
      </details>
      <details>
        <summary>{it ? "Scegliere l’anno e leggere le segnalazioni" : "Choosing a year and reading the flags"}</summary>
        <div className="method-guide-body">
          <p>{it ? "L’anno accanto al valore è il periodo descritto dal dato. Italia, UE e mediana si riferiscono allo stesso anno." : "The year beside a value is the period that the figure describes. Italy, the EU and the median refer to the same year."}</p>
          <p>{it ? "Ogni scheda e la homepage si aprono sull’anno più recente disponibile con copertura europea confrontabile (almeno 24 Paesi UE su 27). Quando quell’osservazione ha un contrassegno di stima (e), dato provvisorio (p) o previsione (f), lo stato è dichiarato esplicitamente accanto al valore e un controllo immediato permette di passare con un clic all’ultimo anno privo di contrassegni provvisori o stimati." : "Each indicator page and the homepage open on the most recent available year with comparable European coverage (at least 24 of the 27 EU countries). When that observation carries an estimated (e), provisional (p) or forecast (f) flag, its status is stated explicitly next to the value and a one-click control lets you switch to the latest year without provisional or estimated flags."}</p>
          <p>{it ? "Anche i valori privi di questi contrassegni possono essere rivisti nei rilasci successivi. L’Italia, l’aggregato UE e i Paesi usati per la mediana possono avere stati diversi. Controlla anche le note sulle discontinuità, che segnalano limiti al confronto nel tempo." : "Figures without these flags can also be revised in subsequent releases. Italy, the EU aggregate and the countries used for the median can have different statuses. Also check the notes on breaks in series, which flag limits to comparisons over time."}</p>
        </div>
      </details>
      <details>
        <summary>{it ? "Confrontare Italia, UE e mediana" : "Comparing Italy, the EU and the median"}</summary>
        <div className="method-guide-body">
          <p>{it ? "L’aggregato UE descrive l’Unione nel suo insieme. È il valore pubblicato da Eurostat secondo il metodo del singolo indicatore. Le schede lo mostrano quando è disponibile con lo stesso perimetro del dato italiano." : "The EU aggregate describes the Union as a whole. Eurostat publishes it using the method for each indicator. It is shown when it is available with the same scope as Italy’s figure."}</p>
          <p>{it ? "La mediana è il valore centrale dopo aver ordinato i valori nazionali. Ogni Paese conta una volta, indipendentemente dalla popolazione. Con un numero pari di Paesi si fa la media dei due valori centrali." : "The median is the middle value after sorting the national figures. Each country counts once, regardless of population. With an even number of countries, it is the average of the two middle values."}</p>
          <p>{it ? "Il confronto considera i 27 Paesi che oggi fanno parte dell’UE, anche per gli anni passati. Pubblichiamo la mediana quando sono disponibili almeno 24 valori nazionali. La scheda indica quanti Paesi sono inclusi." : "The comparison uses today’s 27 EU members, including for past years. We publish the median when at least 24 national values are available. Each indicator shows how many countries are included."}</p>
          <figure className="median-example">
            <figcaption>{it ? "Esempio illustrativo: cinque Paesi, valori ordinati" : "Illustrative example: five countries, sorted values"}</figcaption>
            <div className="median-example-values">
              {[10, 12, 14, 18, 40].map((value, index) => (
                <span key={value} data-middle={index === 2} style={{ "--example-height": `${value / 40 * 100}%` } as CSSProperties}>
                  <i aria-hidden="true" />
                  <strong>{value}</strong>
                  {index === 2 ? <>{" "}<small>{it ? "mediana" : "median"}</small></> : null}
                </span>
              ))}
            </div>
            <p>{it ? "La mediana è 14, con due valori sotto e due sopra. I numeri dell’esempio sono inventati." : "The median is 14, with two values below it and two above. These example numbers are made up."}</p>
          </figure>
          <p>{it ? "Per interpretare una differenza, controlla la definizione, la popolazione considerata e le note sul metodo. Per stabilire quanto dipenda da una politica o da altri fattori servono analisi ulteriori." : "To interpret a difference, check the definition, the population covered and the methodological notes. Establishing how much of it is due to a policy or other factors requires further analysis."}</p>
        </div>
      </details>
      <details>
        <summary>{it ? "Capire quanto sono recenti i dati" : "Understanding how recent the data are"}</summary>
        <div className="method-guide-body">
          <p>{it ? "Un dato riferito a un anno passato può essere stato pubblicato o rivisto di recente. Nelle fonti trovi due date che aiutano a ricostruirne la disponibilità." : "A figure for a past year may have been published or revised recently. The sources show two dates that help you trace when it became available."}</p>
          <dl className="method-terms">
            <div>
              <dt>{it ? "Aggiornamento Eurostat" : "Eurostat update"}</dt>
              <dd>{it ? "Quando Eurostat ha aggiornato il dataset. L’aggiornamento può aggiungere un anno o rivedere dati già pubblicati, anche per un solo Paese." : "When Eurostat updated the dataset. An update may add a year or revise previously published figures, including for a single country."}</dd>
            </div>
            <div>
              <dt>{it ? "Acquisizione del progetto" : "Project acquisition"}</dt>
              <dd>{it ? "Quando il progetto ha scaricato la copia usata dal sito. Questa copia resta disponibile per verificare i numeri mostrati. La fonte può essere stata rivista successivamente." : "When the project downloaded the copy used by this site. That copy remains available so you can verify the figures shown. The source may have been revised since then."}</dd>
            </div>
          </dl>
        </div>
      </details>
      <details>
        <summary>{it ? "Verificare o riutilizzare un valore" : "Checking or reusing a figure"}</summary>
        <div className="method-guide-body">
          <ol>
            <li>{it ? "Nella scheda, scegli l’anno e apri “Verifica fonte e calcolo”. Trovi la selezione applicata alla fonte, i valori nazionali usati nella mediana e i relativi contrassegni." : "Choose a year in the indicator and open “Verify source and calculation”. You will find the exact selection from the source, the national values used for the median and their flags."}</li>
            <li>{it ? "Scarica il CSV per lavorare sui valori della serie. Nella pagina della fonte puoi scaricare anche la risposta originale salvata dal progetto, chiamata snapshot. Il collegamento all’API apre i dati correnti della fonte, che possono essere stati rivisti." : "Download the CSV to work with the series. On the source page, you can also download the original response saved by the project, called a snapshot. The API link opens the source’s current data, which may have been revised."}</li>
            <li>{it ? "Quando citi un valore, riporta indicatore, anno, unità, fonte e data di acquisizione. Per riutilizzare i dati, consulta anche le condizioni della fonte." : "When citing a figure, include the indicator, year, unit, source and acquisition date. Check the source’s reuse terms when using the data elsewhere."}</li>
          </ol>
          <a href={sourcesHref}>{it ? "Fonti, download e registro delle acquisizioni" : "Sources, downloads and acquisition register"} <span aria-hidden="true">→</span></a>
        </div>
      </details>
    </section>
  );
}
