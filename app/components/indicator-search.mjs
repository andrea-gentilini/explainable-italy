/** Small, local relevance index. Search terms and aliases describe indicators,
 * not numerical values; a result is a route to an indicator, not an answer. */
const aliases = {
  'spending-defence': 'esercito militari military army',
  'spending-public-order': 'polizia sicurezza tribunali police courts',
  'spending-health': 'spesa sanitaria sanita ospedali healthcare hospitals health spending',
  'spending-education': 'spesa scuola scuole istruzione education spending schools',
  'spending-social-protection': 'spesa welfare protezione sociale social protection welfare spending',
  'spending-old-age': 'spesa anziani vecchiaia old age spending',
  'total-public-expenditure': 'quanto spende stato uscite government spending expenditure',
  'total-public-revenue': 'quanto incassa stato tasse tributi imposte tax revenue taxes',
  'budget-balance': 'deficit disavanzo avanzo bilancio budget deficit surplus',
  'interest-expenditure': 'costo debito interessi interest debt costs',
  'public-investment': 'opere pubbliche infrastrutture infrastructure public works',
  'social-benefits': 'sussidi aiuti sociali benefits welfare payments',
  'public-debt': 'debito stato indebitamento government debt',
  'median-age': 'eta popolazione invecchiamento population age ageing',
  'population-65-plus': 'quanti anziani ultrasessantacinquenni over 65 elderly older population',
  'old-age-dependency': 'anziani popolazione eta lavoro ageing dependency working age',
  'fertility-rate': 'figli nascite natalita bambini births born children fertility birth rate',
  'life-expectancy': 'quanto vive durata vita longevita life expectancy lifespan longevity',
  'employment-rate': 'quanti lavorano occupati persone lavoro employed employment jobs',
  'unemployment-rate': 'senza lavoro disoccupati non lavoro unemployed unemployment jobless cannot find job',
  'youth-unemployment': 'giovani senza lavoro disoccupati youth unemployment young unemployed cannot find job',
  'gdp-per-capita-pps': 'pil ppa pps produzione per abitante prezzi confrontabili purchasing power parity gdp output per person europa europe',
  'real-gdp-growth-per-capita': 'crescita economia crescita pil economic growth gdp growth',
  inflation: 'aumento prezzi crescita prezzi rincari carovita costo vita inflation price increases cost living',
  'poverty-or-exclusion': 'poveri poverta esclusione poverty poor social exclusion',
  'pension-expenditure': 'pensioni pensionistica quanto costano pensioni pensions pension spending',
  'healthy-life-years': 'anni salute vita sana disabilita healthy life disability',
  'tertiary-education': 'laurea laureati universita degree graduates university college',
  'early-school-leavers': 'abbandono scuola dispersione scolastica ragazzi lasciano diploma school dropouts early leaving',
  'adult-learning': 'formazione adulti corsi aggiornamento adult learning training courses',
  'neet-rate': 'giovani non studiano non lavorano neet young neither education employment training',
  'renewable-energy': 'rinnovabili energia pulita solare eolica renewable clean energy solar wind',
  'municipal-waste-recycling': 'raccolta differenziata riciclaggio rifiuti recycling waste garbage rubbish',
  'greenhouse-gas-emissions': 'co2 gas serra clima emissioni carbon greenhouse gases climate emissions',
};
const stop = new Set(('a al allo alla alle ai agli all da dal dalle dei degli della delle di e ed il lo la le i gli un uno una in nel nello nella nelle nei negli per con su sul sulla the of and a an to for in how what which many much is are does do people italy italian italia italiani italiane persone quanto quanti quante qual quale quali come cosa che si ha hanno del dato dati vedere sapere paese paesi country countries costa costano vale spendiamo spendono comes from prima resto confronta confrontare').split(' '));
function normalize(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function tokens(value) { return [...new Set(normalize(value).split(' ').filter(t => t && !stop.has(t)))]; }
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({length:b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(current[j-1]+1, previous[j]+1, previous[j-1]+(a[i-1] === b[j-1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length];
}
function similarity(query, word) {
  if (query === word) return 1;
  if (query.length >= 3 && word.startsWith(query)) return 0.8;
  if (query.length < 4 || word.length < 4 || query[0] !== word[0]) return 0;
  const errors = distance(query, word);
  return errors <= (query.length >= 10 ? 2 : 1) ? 0.65 : 0;
}
/** @typedef {{id:string,section:string,title:{it:string,en:string},plain:{it:string,en:string},technical:{it:string,en:string},source:{datasetCode:string}} SearchIndicator */
/** @template {SearchIndicator} T @param {T[]} indicators @returns {(query:string,section?:string)=>T[]} */
export function createIndicatorSearch(indicators) {
  const documents = indicators.map((indicator, order) => ({indicator, order,
    fields: [
      {words:tokens(indicator.title.it+' '+indicator.title.en),weight:4},
      {words:tokens(aliases[indicator.id] ?? ''),weight:3},
      {words:tokens(indicator.plain.it+' '+indicator.plain.en),weight:1.5},
      {words:tokens(indicator.technical.it+' '+indicator.technical.en),weight:0.5},
      {words:tokens(indicator.source.datasetCode),weight:5},
    ]}));
  const frequencies = new Map();
  for (const doc of documents) for (const word of new Set(doc.fields.flatMap(f=>f.words))) frequencies.set(word,(frequencies.get(word)??0)+1);
  return (query, section = 'all') => {
    const candidates = documents.filter(doc=>section==='all'||doc.indicator.section===section);
    if (!query.trim()) return candidates.map(doc=>doc.indicator);
    const terms = tokens(query).slice(0,24);
    if (!terms.length) return [];
    const scored = candidates.map(doc=>{
      let score=0, matches=0;
      for (const term of terms) {
        let best=0;
        for (const field of doc.fields) for (const word of field.words) {
          const match=similarity(term,word);
          const rarity=1+Math.log(1+indicators.length/(frequencies.get(word)??1));
          best=Math.max(best,match*field.weight*rarity);
        }
        if (best) {matches++;score+=best;}
      }
      return {...doc,score:score*matches/terms.length,coverage:matches/terms.length};
    }).filter(doc=>doc.coverage>=0.65 && doc.score>0);
    scored.sort((a,b)=>b.score-a.score||a.order-b.order);
    // Keep weak, incidental matches out of otherwise relevant result sets.
    const threshold=(scored[0]?.score??0)*0.3;
    return scored.filter(doc=>doc.score>=threshold).map(doc=>doc.indicator);
  };
}
