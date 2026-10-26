import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const data = JSON.parse(
  await readFile(new URL("data/processed/dashboard.json", projectRoot), "utf8"),
);
const locales = ["it", "en"];
const staticPages = ["", "data", "method", "sources", "about", "contribute"];

function localizedRoute(locale, path = "") {
  return `/${[locale === "en" ? "en" : "", path].filter(Boolean).join("/")}`;
}

function decode(value) {
  return value
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) =>
      String.fromCodePoint(
        code.startsWith("x") || code.startsWith("X")
          ? parseInt(code.slice(1), 16)
          : Number(code),
      ),
    )
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) =>
      ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[name],
    );
}

function textContent(html) {
  return decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function elements(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
    .map((match) => ({ attributes: match[1], html: match[2], text: textContent(match[2]) }));
}

function attribute(element, name) {
  const match = element.attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, "i"));
  return match ? decode(match[1]) : null;
}

function hasClass(element, name) {
  return (attribute(element, "class") ?? "").split(/\s+/).includes(name);
}

const pageCache = new Map();
async function page(route) {
  if (pageCache.has(route)) return pageCache.get(route);
  const stem = route.replace(/^\//, "").replace(/\/$/, "");
  const candidates = [
    `out/${stem ? `${stem}/` : ""}index.html`,
  ];
  for (const path of candidates) {
    try {
      const fullHtml = await readFile(new URL(path, projectRoot), "utf8");
      // React's hydration payload also contains copy and URLs; assertions must
      // inspect the actual page that readers and assistive technology receive.
      const html = fullHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      const result = { fullHtml, html, text: textContent(html), links: elements(html, "a") };
      pageCache.set(route, result);
      return result;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  assert.fail(`Missing rendered route ${route}. Run the production build before these tests.`);
}

function number(value, indicator, locale) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    minimumFractionDigits: indicator.precision,
    maximumFractionDigits: indicator.precision,
  }).format(value);
}

function requireLink(rendered, href, message) {
  const normalize = (value) => value?.startsWith("/")
    ? value.replace(/\/(?=[?#]|$)/, "")
    : value;
  assert(rendered.links.some((link) => normalize(attribute(link, "href")) === normalize(href)), message);
}

async function basePath() {
  const home = await page("/");
  const brand = home.links.find((link) => hasClass(link, "brand"));
  assert(brand, "The site has a home link");
  return attribute(brand, "href").replace(/\/$/, "");
}

const allRoutes = locales.flatMap((locale) => [
  ...staticPages.map((path) => ({ locale, path })),
  ...data.indicators.flatMap((indicator) => [
    { locale, path: `data/${indicator.id}`, indicator },
    { locale, path: `data/${indicator.id}/source`, indicator },
  ]),
]);

for (const locale of locales) {
  test(`${locale}: every page has an accessible heading, navigation and matching language destination`, async () => {
    const prefix = await basePath();
    for (const { path, indicator } of allRoutes.filter((entry) => entry.locale === locale)) {
      const route = localizedRoute(locale, path);
      const rendered = await page(route);
      const headings = elements(rendered.html, "h1");
      assert.equal(headings.length, 1, `${route}: one main heading`);
      assert(headings[0].text.length > 0, `${route}: meaningful heading`);
      if (indicator) {
        assert(headings[0].text.includes(indicator.title[locale]), `${route}: heading identifies the indicator`);
      }
      assert.match(rendered.html, /<main\b[^>]*id="main"/, `${route}: main content landmark`);
      requireLink(rendered, "#main", `${route}: keyboard skip link`);
      const navigation = elements(rendered.html, "nav")[0];
      assert(navigation, `${route}: primary navigation`);
      for (const destination of ["data", "method", "sources", "about", "contribute"]) {
        requireLink(
          { links: elements(navigation.html, "a") },
          `${prefix}${localizedRoute(locale, destination)}`,
          `${route}: ${destination} is in the primary navigation`,
        );
      }
      const oppositeLocale = locale === "it" ? "en" : "it";
      requireLink(rendered, `${prefix}${localizedRoute(oppositeLocale, path)}`, `${route}: language switch keeps the same page`);
      assert.match(rendered.html, new RegExp(`<html\\b[^>]*\\blang="${locale}"`), `${route}: document declares its language`);
      assert.doesNotMatch(rendered.fullHtml, /googletagmanager|google-analytics|plausible\.io|posthog|connect\.facebook\.net/i, `${route}: no tracking integrations`);
      const cloudflareToken = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?.trim();
      if (cloudflareToken) {
        const beacons = elements(rendered.fullHtml, "script").filter(
          (script) =>
            attribute(script, "src") === "https://static.cloudflareinsights.com/beacon.min.js" ||
            attribute(script, "data-cf-beacon") !== null,
        );
        assert.equal(beacons.length, 1, `${route}: includes the Cloudflare Web Analytics beacon once`);
        assert.equal(
          attribute(beacons[0], "src"),
          "https://static.cloudflareinsights.com/beacon.min.js",
          `${route}: loads official Cloudflare beacon`,
        );
        assert.match(beacons[0].attributes, /\bdefer(?:=""|\b)/i, `${route}: defers beacon execution`);
        assert.deepEqual(
          JSON.parse(attribute(beacons[0], "data-cf-beacon")),
          { token: cloudflareToken },
          `${route}: passes configured token to beacon`,
        );
      } else {
        assert.doesNotMatch(
          rendered.fullHtml,
          /cloudflareinsights\.com\/beacon\.min\.js|data-cf-beacon/i,
          `${route}: no analytics beacon when token is unset`,
        );
      }
      assert.match(rendered.text, locale === "it" ? /Nessun tracciamento/ : /No tracking/, `${route}: privacy statement`);
    }
    const aboutPage = await page(localizedRoute(locale, "about"));
    assert.match(aboutPage.text, /Cloudflare Web Analytics/, `${locale}: about page discloses Cloudflare Web Analytics`);
    assert.match(
      aboutPage.text,
      locale === "it"
        ? /Non usa cookie di analytics, pubblicità, profilazione, fingerprinting/
        : /It uses no analytics cookies, advertising, profiling, fingerprinting/,
      `${locale}: about page states what is not collected`,
    );
  });
}

test("all rendered local links lead to an exported page, asset or existing section", async () => {
  const prefix = await basePath();
  const checked = new Set();
  for (const { locale, path } of allRoutes) {
    const route = localizedRoute(locale, path);
    const rendered = await page(route);
    for (const link of rendered.links) {
      const href = attribute(link, "href");
      if (!href || /^(https?:|mailto:|tel:)/.test(href)) continue;
      const url = new URL(href, `https://example.test${prefix}${route}/`);
      assert.equal(url.origin, "https://example.test", `${route}: unexpected local link ${href}`);
      let destination = decodeURIComponent(url.pathname);
      if (prefix) {
        assert(destination === prefix || destination.startsWith(`${prefix}/`), `${route}: ${href} retains the deployment path`);
        destination = destination.slice(prefix.length) || "/";
      }
      destination = destination.replace(/\/$/, "") || "/";
      const key = `${destination}${url.hash}`;
      if (checked.has(key)) continue;
      checked.add(key);
      if (/\.[a-z0-9]+$/i.test(destination)) {
        await access(new URL(`out${destination}`, projectRoot));
      } else {
        const target = await page(destination);
        if (url.hash) {
          const id = decodeURIComponent(url.hash.slice(1));
          assert(target.html.includes(`id="${id}"`), `${route}: section ${href} exists`);
        }
      }
    }
  }
});

for (const locale of locales) {
  test(`${locale}: sources reproduce the main card and disclose current coverage, notes and official provenance`, async () => {
    const prefix = await basePath();
    for (const indicator of data.indicators) {
      const defaultPoint = indicator.newerEstimate ?? indicator.latest;
      const indicatorRoute = localizedRoute(locale, `data/${indicator.id}`);
      const sourceRoute = localizedRoute(locale, `data/${indicator.id}/source`);
      const [card, source] = await Promise.all([page(indicatorRoute), page(sourceRoute)]);
      const reading = elements(card.html, "p").find((element) => hasClass(element, "indicator-value"));
      const panel = elements(source.html, "div").find((element) => hasClass(element, "source-value-panel"));
      assert(reading && panel, `${sourceRoute}: main value and source value are present`);
      const sourceValue = elements(panel.html, "strong")[0];
      assert.equal(sourceValue?.text, reading.text, `${sourceRoute}: the source defaults to the value on the card`);
      assert(elements(panel.html, "small")[0]?.text.includes(String(defaultPoint.year)), `${sourceRoute}: default year is the main observation`);
      assert(sourceValue.text.includes(number(defaultPoint.italy, indicator, locale)), `${sourceRoute}: main value matches the snapshot`);
      requireLink(card, `${prefix}${sourceRoute}?year=${defaultPoint.year}`, `${indicatorRoute}: opens its own source for the year displayed`);
      requireLink(source, indicator.source.apiUrl, `${sourceRoute}: exact original query`);
      requireLink(source, indicator.source.dataBrowserUrl, `${sourceRoute}: official data browser`);
      requireLink(source, indicator.source.doi, `${sourceRoute}: permanent dataset identifier`);
      requireLink(source, indicator.definitionSourceUrl, `${sourceRoute}: official definition`);
      requireLink(card, indicator.definitionSourceUrl, `${indicatorRoute}: definition attribution`);
      assert(source.text.includes(indicator.source.datasetCode), `${sourceRoute}: dataset identifier`);
      const expectedInstitution = locale === "it" && indicator.source.originalInstitution.includes("European Environment Agency")
        ? "Agenzia europea dell’ambiente (EEA)"
        : indicator.source.originalInstitution;
      assert(source.text.includes(expectedInstitution), `${sourceRoute}: original institution`);
      assert(card.text.includes(indicator.plain[locale]), `${indicatorRoute}: readable definition`);
      assert(card.text.includes(indicator.technical[locale]), `${indicatorRoute}: precise definition`);
      assert.match(card.text, locale === "it" ? /parafrasi del progetto/ : /project paraphrases/, `${indicatorRoute}: distinguishes the project's wording from the official definition`);
      for (const note of indicator.notes) {
        assert(source.text.includes(note.text[locale]), `${sourceRoute}: source caveat ${note.type}`);
        assert(card.text.includes(note.text[locale]), `${indicatorRoute}: source caveat ${note.type}`);
        requireLink(source, note.sourceUrl, `${sourceRoute}: note is verifiable`);
      }
      assert.match(source.text, new RegExp(`${defaultPoint.coverage} (?:Paesi UE disponibili su 27|available EU countries out of 27)`), `${sourceRoute}: coverage derives from the selected data`);
      const countryTable = elements(source.html, "table")[0];
      assert(countryTable, `${sourceRoute}: observations behind the median`);
      const countryCodes = [...countryTable.html.matchAll(/<code>([A-Z]{2})<\/code>/g)].map((match) => match[1]).sort();
      assert.deepEqual(countryCodes, defaultPoint.countries.map((country) => country.geo).sort(), `${sourceRoute}: the displayed countries reproduce the main observation`);
      const selectedOptions = elements(source.html, "option").filter((option) => /\bselected(?:="")?(?:\s|$)/.test(option.attributes));
      if (indicator.newerEstimate) {
        assert.equal(selectedOptions.length, 1, `${sourceRoute}: one default comparison year`);
        assert.equal(attribute(selectedOptions[0], "value"), String(defaultPoint.year), `${sourceRoute}: the most recent comparable observation is selected`);
        const options = elements(source.html, "option").map((option) => attribute(option, "value"));
        assert(options.includes(String(indicator.latest.year)) && options.includes(String(indicator.newerEstimate.year)), `${sourceRoute}: both latest non-provisional and newer provisional years are selectable`);
      }
      if (defaultPoint.eu === null) {
        assert.match(source.text, locale === "it" ? /non pubblica un aggregato UE con lo stesso perimetro/ : /does not publish an EU aggregate with the same scope/, `${sourceRoute}: no invented EU aggregate`);
        assert(!elements(source.html, "small").some((element) => element.text.includes("Eurostat · EU27_2020")), `${sourceRoute}: no unavailable figure attributed to Eurostat`);
      } else {
        assert(elements(source.html, "small").some((element) => element.text.includes("Eurostat · EU27_2020")), `${sourceRoute}: EU value is the official aggregate`);
      }
    }
  });

  test(`${locale}: every indicator exposes its complete historical series as an accessible table`, async () => {
    for (const indicator of data.indicators) {
      const route = localizedRoute(locale, `data/${indicator.id}`);
      const rendered = await page(route);
      const table = elements(rendered.html, "table").find((candidate) => {
        const body = elements(candidate.html, "tbody")[0];
        if (!body) return false;
        const years = elements(body.html, "tr").map((row) => Number(elements(row.html, "th")[0]?.text));
        const expectedYears = indicator.series.map((point) => point.year).sort((left, right) => left - right);
        const sortedYears = [...years].sort((left, right) => left - right);
        return sortedYears.length === expectedYears.length
          && sortedYears.every((year, index) => year === expectedYears[index]);
      });
      assert(table, `${route}: each published year appears exactly once, including gaps`);
      const rows = elements(elements(table.html, "tbody")[0].html, "tr");
      const years = rows.map((row) => Number(elements(row.html, "th")[0]?.text));
      const ascending = years.every((year, index) => index === 0 || year > years[index - 1]);
      const descending = years.every((year, index) => index === 0 || year < years[index - 1]);
      assert(ascending || descending, `${route}: historical years are ordered`);
      const pointsByYear = new Map(indicator.series.map((point) => [point.year, point]));
      const headings = elements(elements(table.html, "thead")[0]?.html ?? "", "th");
      assert(headings.length >= 4, `${route}: year and comparison columns have headings`);
      for (const row of rows) {
        const point = pointsByYear.get(Number(elements(row.html, "th")[0]?.text));
        const cells = elements(row.html, "td");
        assert.equal(attribute(elements(row.html, "th")[0], "scope"), "row", `${route}: year identifies its row`);
        assert(cells[0]?.text.includes(number(point.italy, indicator, locale)), `${route}: Italy's value for ${point.year}`);
        if (point.eu === null) {
          assert.equal(cells[1]?.text, "—", `${route}: no unofficial EU figure for ${point.year}`);
        } else {
          assert(cells[1]?.text.includes(number(point.eu, indicator, locale)), `${route}: official EU value for ${point.year}`);
        }
        assert(cells[2]?.text.includes(number(point.median, indicator, locale)), `${route}: median for ${point.year}`);
        assert(cells[3]?.text.startsWith(String(point.coverage)), `${route}: country coverage for ${point.year}`);
      }
    }
  });
}

test("data filters expose their selected state to assistive technology", async () => {
  for (const locale of locales) {
    const rendered = await page(localizedRoute(locale, "data"));
    const filterGroup = elements(rendered.html, "div").find((element) => hasClass(element, "section-filters"));
    assert(filterGroup, `${locale}: topic controls are present`);
    const controls = elements(filterGroup.html, "button");
    assert(controls.length >= data.sections.length, `${locale}: all topics can be selected`);
    assert(controls.every((control) => ["true", "false"].includes(attribute(control, "aria-pressed"))), `${locale}: filters announce whether they are selected`);
    assert.equal(controls.filter((control) => attribute(control, "aria-pressed") === "true").length, 1, `${locale}: exactly one topic view is active`);
    assert.match(rendered.html, /<input\b[^>]*type="search"/, `${locale}: searchable catalogue`);
  }
});

test("each COFOG category retains its exact source selection", () => {
  const selections = { "spending-defence": "GF02", "spending-health": "GF07", "spending-old-age": "GF1002" };
  for (const [id, code] of Object.entries(selections)) {
    const indicator = data.indicators.find((candidate) => candidate.id === id);
    assert(indicator, `${id}: category exists`);
    assert.equal(new URL(indicator.source.apiUrl).searchParams.get("cofog99"), code, `${id}: correct official category`);
  }
});


function openingElements(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "gi"))]
    .map((match) => ({ attributes: match[1] }));
}

function normalizeUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.href;
}

test("exported pages ship every referenced local script, stylesheet and image", async () => {
  const prefix = await basePath();
  const checked = new Set();
  for (const { locale, path } of allRoutes) {
    const route = localizedRoute(locale, path);
    const rendered = await page(route);
    const assets = [
      ...openingElements(rendered.fullHtml, "script").map((element) => attribute(element, "src")),
      ...openingElements(rendered.html, "img").map((element) => attribute(element, "src")),
      ...openingElements(rendered.html, "link")
        .filter((element) => ["stylesheet", "icon", "preload", "modulepreload"].includes(attribute(element, "rel")))
        .map((element) => attribute(element, "href")),
    ].filter(Boolean);
    for (const value of assets) {
      if (/^(?:https?:|data:)/.test(value)) continue;
      const url = new URL(value, `https://example.test${prefix}${route}/`);
      assert.equal(url.origin, "https://example.test", `${route}: no unexpected asset origin`);
      assert(!prefix || url.pathname.startsWith(`${prefix}/`), `${route}: asset ${value} retains the deployment path`);
      const relative = decodeURIComponent(url.pathname.slice(prefix.length));
      if (checked.has(relative)) continue;
      checked.add(relative);
      assert((await stat(new URL(`out${relative}`, projectRoot))).isFile(), `${route}: asset ${value} was exported`);
    }
  }
  assert(checked.size > 0, "The exported site includes its runtime assets");
});

test("canonical, language alternatives and social metadata identify the current page", async () => {
  const home = await page("/");
  const homeCanonical = openingElements(home.html, "link")
    .find((element) => attribute(element, "rel") === "canonical");
  assert(homeCanonical, "Homepage declares its canonical URL");
  const site = new URL(`${attribute(homeCanonical, "href").replace(/\/$/, "")}/`);
  assert.equal(site.origin, "https://andrea-gentilini.github.io", "Canonical host is the deployed site");
  const prefix = site.pathname.replace(/\/$/, "");
  for (const { locale, path } of allRoutes) {
    const route = localizedRoute(locale, path);
    const rendered = await page(route);
    const links = openingElements(rendered.html, "link");
    const canonical = links.filter((element) => attribute(element, "rel") === "canonical");
    assert.equal(canonical.length, 1, `${route}: one canonical URL`);
    const expected = new URL(route.slice(1), site);
    assert.equal(normalizeUrl(attribute(canonical[0], "href")), normalizeUrl(expected.href), `${route}: canonical preserves the page`);
    for (const language of locales) {
      const alternatives = links.filter((element) => attribute(element, "rel") === "alternate"
        && [language, language === "it" ? "it-IT" : "en-GB"].includes(attribute(element, "hreflang")));
      assert.equal(alternatives.length, 1, `${route}: one ${language} alternative`);
      const target = new URL(localizedRoute(language, path).slice(1), site);
      assert.equal(normalizeUrl(attribute(alternatives[0], "href")), normalizeUrl(target.href), `${route}: language alternative preserves the page`);
    }
    const metadata = openingElements(rendered.html, "meta");
    const ogLocale = metadata.find((element) => attribute(element, "property") === "og:locale");
    assert.equal(attribute(ogLocale ?? { attributes: "" }, "content"), locale === "it" ? "it_IT" : "en_GB", `${route}: social locale matches the page`);
    const description = metadata.find((element) => attribute(element, "name") === "description");
    assert(attribute(description ?? { attributes: "" }, "content")?.trim(), `${route}: meaningful description`);
    const image = metadata.find((element) => attribute(element, "property") === "og:image");
    assert(image, `${route}: social preview is declared`);
    const imageUrl = new URL(attribute(image, "content"));
    assert.equal(imageUrl.origin, site.origin, `${route}: preview hosted with the site`);
    assert(!prefix || imageUrl.pathname.startsWith(`${prefix}/`), `${route}: preview retains deployment path`);
    await access(new URL(`out${imageUrl.pathname.slice(prefix.length)}`, projectRoot));
  }
});


for (const locale of locales) {
  test(`${locale}: historical controls expose every available year and the local source snapshot`, async () => {
    const prefix = await basePath();
    for (const indicator of data.indicators) {
      const defaultPoint = indicator.newerEstimate ?? indicator.latest;
      const years = [...new Set([
        ...indicator.series.map((point) => point.year),
        indicator.latest.year,
        ...(indicator.newerEstimate ? [indicator.newerEstimate.year] : []),
      ])].sort((a, b) => a - b);
      for (const suffix of ["", "/source"]) {
        const route = localizedRoute(locale, `data/${indicator.id}${suffix}`);
        const rendered = await page(route);
        if (years.length > 1) {
          const selector = elements(rendered.html, "label").find((element) => hasClass(element, "year-selection"));
          assert(selector, `${route}: the year control has an explicit accessible label`);
          const options = elements(selector.html, "option");
          assert.deepEqual(options.map((option) => Number(attribute(option, "value"))).sort((a, b) => a - b), years, `${route}: all available years are selectable exactly once`);
          const selected = options.filter((option) => /\bselected(?:="")?(?:\s|$)/.test(option.attributes));
          assert.equal(selected.length, 1, `${route}: one default year`);
          assert.equal(Number(attribute(selected[0], "value")), defaultPoint.year, `${route}: default is the most recent comparable observation`);
        }
        if (suffix === "/source") {
          assert.match(indicator.source.snapshotPath, /^data\/raw\/eurostat\/[a-z0-9_]+\.json$/i, `${route}: has a local raw-data snapshot`);
          requireLink(rendered, `${prefix}/${indicator.source.snapshotPath}`, `${route}: original snapshot is directly downloadable`);
        } else {
          requireLink(rendered, `${prefix}/data/indicators/${indicator.id}.csv`, `${route}: the indicator series is directly downloadable`);
        }
      }
      const route = localizedRoute(locale, `data/${indicator.id}`);
      const chart = await page(route);
      const bars = elements(chart.html, "button").filter((button) => hasClass(button, "trend-column"));
      assert.equal(bars.length, indicator.series.length, `${route}: every historical observation is an accessible chart control`);
      assert.equal(bars.filter((button) => attribute(button, "tabindex") === "0").length, 1, `${route}: chart has one keyboard entry point`);
      assert(bars.every((button) => ["true", "false"].includes(attribute(button, "aria-pressed"))), `${route}: every chart control exposes selection state`);
      const selected = bars.filter((button) => attribute(button, "aria-pressed") === "true");
      assert.equal(selected.length, 1, `${route}: one selected observation`);
      assert(attribute(selected[0], "aria-label")?.startsWith(`${defaultPoint.year}:`), `${route}: selected chart observation matches the default year`);
      assert(bars.every((button) => attribute(button, "aria-label")?.trim()), `${route}: chart controls have meaningful accessible names`);
    }
  });
}

test("sitemap contains exactly the exported localized canonical routes and matching language alternatives", async () => {
  const xml = await readFile(new URL("out/sitemap.xml", projectRoot), "utf8");
  const entries = elements(xml, "url");
  assert.equal(entries.length, allRoutes.length, "Every localized public page appears once");
  const byUrl = new Map(entries.map((entry) => [normalizeUrl(elements(entry.html, "loc")[0].text), entry]));
  assert.equal(byUrl.size, entries.length, "Sitemap has no duplicate URLs");
  for (const { locale, path } of allRoutes) {
    const route = localizedRoute(locale, path);
    const rendered = await page(route);
    const links = openingElements(rendered.html, "link");
    const canonical = links.find((element) => attribute(element, "rel") === "canonical");
    const address = normalizeUrl(attribute(canonical, "href"));
    const entry = byUrl.get(address);
    assert(entry, `${route}: sitemap URL matches the rendered canonical`);
    const alternatives = openingElements(entry.html, "xhtml:link");
    for (const language of ["it-IT", "en-GB"]) {
      const pageLink = links.find((element) => attribute(element, "hreflang") === language);
      const mapLink = alternatives.find((element) => attribute(element, "hreflang") === language);
      assert(mapLink, `${route}: sitemap includes ${language} counterpart`);
      assert.equal(normalizeUrl(attribute(mapLink, "href")), normalizeUrl(attribute(pageLink, "href")), `${route}: sitemap language counterpart matches the page`);
    }
  }
  const robots = await readFile(new URL("out/robots.txt", projectRoot), "utf8");
  assert.match(robots, /^Sitemap: https:\/\/andrea-gentilini\.github\.io\/explainable-italy\/sitemap\.xml$/m, "Robots file points crawlers to the published sitemap");
});

test("a static 404 page is available to the hosting service", async () => {
  const html = await readFile(new URL("out/404.html", projectRoot), "utf8");
  assert.match(html, /<html\b/, "404 is a complete HTML document");
  assert.match(textContent(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")), /404/, "404 identifies the missing-page condition");
  assert(openingElements(html, "meta").some((element) => attribute(element, "name") === "robots" && /noindex/.test(attribute(element, "content") ?? "")), "Missing pages are not indexed");
});


// Unlike a flat tag match, this keeps nested blocks intact when checking the
// reading order or groups of question links.
function classRegions(html, className) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)]
    .filter((match) => hasClass({ attributes: match[2] }, className))
    .map((match) => {
      const tag = match[1];
      const contentStart = match.index + match[0].length;
      const boundaries = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
      boundaries.lastIndex = contentStart;
      let depth = 1;
      let boundary;
      while ((boundary = boundaries.exec(html))) {
        depth += boundary[1] ? -1 : 1;
        if (depth === 0) {
          const content = html.slice(contentStart, boundary.index);
          return { tag, attributes: match[2], html: content, text: textContent(content), index: match.index };
        }
      }
      assert.fail(`Unclosed ${tag}.${className} in exported markup`);
    });
}

function detailsDepthAt(html, position) {
  return [...html.slice(0, position).matchAll(/<(\/?)details\b[^>]*>/gi)]
    .reduce((depth, match) => depth + (match[1] ? -1 : 1), 0);
}

for (const locale of locales) {
  test(`${locale}: interpretation and historical trend precede optional definitions without hiding source caveats`, async () => {
    for (const indicator of data.indicators) {
      const route = localizedRoute(locale, `data/${indicator.id}`);
      const rendered = await page(route);
      const reading = classRegions(rendered.html, "reading-context");
      const trend = classRegions(rendered.html, "trend-block");
      const definitions = classRegions(rendered.html, "definition-details");
      assert.equal(reading.length, 1, `${route}: one concise reading of the current comparison`);
      assert.equal(trend.length, 1, `${route}: one historical trend`);
      assert.equal(definitions.length, 1, `${route}: definitions have one optional section`);
      assert.equal(definitions[0].tag, "details", `${route}: detailed definitions are expandable`);
      assert(reading[0].index < trend[0].index && trend[0].index < definitions[0].index,
        `${route}: reading and historical context come before technical detail`);
      assert.equal(detailsDepthAt(rendered.html, reading[0].index), 0, `${route}: reading is visible without expanding details`);
      assert.equal(detailsDepthAt(rendered.html, trend[0].index), 0, `${route}: historical trend is visible without expanding details`);
      const plain = indicator.plain[locale].replace(/\s+/g, " ").trim();
      assert.equal(rendered.text.split(plain).length - 1, 1, `${route}: the plain-language definition is not repeated`);
      const notes = classRegions(rendered.html, "indicator-notes");
      if (indicator.notes.length || indicator.series.some((point) => point.status?.includes("b"))) {
        assert(notes.length > 0, `${route}: comparability and source caveats remain present`);
      }
      for (const note of notes) {
        assert.equal(detailsDepthAt(rendered.html, note.index), 0, `${route}: source caveats are visible without opening technical definitions`);
      }
    }
  });

  test(`${locale}: guided questions open existing localized pages with valid topic and year selections`, async () => {
    const prefix = await basePath();
    const topics = new Set(["all", "overview", ...data.sections.map((section) => section.id)]);
    for (const [path, className] of [["", "question-grid"], ["data", "topic-questions"]]) {
      const route = localizedRoute(locale, path);
      const rendered = await page(route);
      const groups = classRegions(rendered.html, className);
      assert(groups.length > 0, `${route}: readers can start from a concrete question`);
      for (const group of groups) {
        const links = elements(group.html, "a");
        assert(links.length > 0, `${route}: each question group offers a destination`);
        for (const link of links) {
          const href = attribute(link, "href");
          assert(href && link.text.trim(), `${route}: every question has a named destination`);
          const url = new URL(href, `https://example.test${prefix}${route}/`);
          assert.equal(url.origin, "https://example.test", `${route}: questions stay within the data site`);
          assert(!prefix || url.pathname.startsWith(`${prefix}/`), `${route}: question retains the deployment path`);
          const destination = url.pathname.slice(prefix.length).replace(/\/$/, "") || "/";
          const target = allRoutes.find((entry) => localizedRoute(entry.locale, entry.path) === destination);
          assert(target, `${route}: question opens an exported content page`);
          assert.equal(target.locale, locale, `${route}: question preserves the chosen language`);
          if (url.searchParams.has("topic")) {
            assert(topics.has(url.searchParams.get("topic")), `${route}: question selects a known topic`);
          }
          if (url.searchParams.has("year")) {
            assert(target.indicator, `${route}: year selection refers to a specific indicator`);
            const years = new Set([
              ...target.indicator.series.map((point) => String(point.year)),
              String(target.indicator.latest.year),
              ...(target.indicator.newerEstimate ? [String(target.indicator.newerEstimate.year)] : []),
            ]);
            assert(years.has(url.searchParams.get("year")), `${route}: selected year exists for the question's indicator`);
          }
          await page(destination);
        }
      }
    }
  });

  test(`${locale}: newer provisional observations have visible year guidance and an explicit selection control`, async () => {
    for (const indicator of data.indicators.filter((entry) => entry.newerEstimate)) {
      for (const suffix of ["", "/source"]) {
        const route = localizedRoute(locale, `data/${indicator.id}${suffix}`);
        const rendered = await page(route);
        const guidance = classRegions(rendered.html, "year-context");
        assert.equal(guidance.length, 1, `${route}: explains why the main year differs from the newer observation`);
        assert(guidance[0].text.includes(String(indicator.latest.year)), `${route}: guidance identifies the selected main year`);
        assert(guidance[0].text.includes(String(indicator.newerEstimate.year)), `${route}: guidance identifies the newer observation`);
        assert.equal(detailsDepthAt(rendered.html, guidance[0].index), 0, `${route}: year guidance is immediately visible`);
        if (!suffix) {
          const notes = classRegions(rendered.html, "estimate-note");
          assert.equal(notes.length, 1, `${route}: newer observation stays separately identified`);
          assert.match(notes[0].text, locale === "it" ? /provvisor|stimat|previs/i : /provisional|estimat|forecast/i,
            `${route}: newer observation discloses its non-final status`);
          const controls = elements(notes[0].html, "button");
          assert.equal(controls.length, 1, `${route}: newer observation can be selected directly`);
          assert.equal(attribute(controls[0], "type"), "button", `${route}: selection does not submit a form`);
          assert(controls[0].text.trim(), `${route}: selection button has a readable name`);
          assert.equal(detailsDepthAt(rendered.html, notes[0].index), 0, `${route}: provisional observation is not hidden in technical details`);
        }
      }
    }
  });
}

for (const locale of locales) {
  test(`${locale}: every contribution action opens its own existing GitHub issue form`, async () => {
    const rendered = await page(localizedRoute(locale, "contribute"));
    const actions = rendered.links.filter((link) => hasClass(link, "contribution-link"));
    assert.equal(actions.length, 3, "All three contribution rows are real links");
    const templates = new Set();
    for (const action of actions) {
      const url = new URL(attribute(action, "href"));
      assert.equal(url.origin, "https://github.com");
      assert.equal(url.pathname, "/andrea-gentilini/explainable-italy/issues/new");
      const template = url.searchParams.get("template");
      assert.match(template, /^[a-z-]+\.yml$/);
      await access(new URL(`.github/ISSUE_TEMPLATE/${template}`, projectRoot));
      templates.add(template);
      assert(action.text.length > 20, "The action explains what can be submitted");
    }
    assert.equal(templates.size, 3, "Different requests open different forms");
    assert.match(rendered.text, locale === "it" ? /Serve un account/ : /You need an account/);
    assert.match(rendered.text, locale === "it" ? /sono pubbliche/ : /are public/);
  });

  test(`${locale}: source directory and indicator cards expose clickable provenance, metadata and downloads`, async () => {
    const prefix = await basePath();
    const sourcesPage = await page(localizedRoute(locale, "sources"));
    requireLink(sourcesPage, `${prefix}/data/manifest.json`, `${locale}: source register is downloadable`);
    requireLink(sourcesPage, `${prefix}/data/dashboard.csv`, `${locale}: full CSV is downloadable`);
    requireLink(sourcesPage, `${prefix}/data/dashboard.json`, `${locale}: full JSON is downloadable`);

    const uniqueDatasets = new Map();
    for (const indicator of data.indicators) {
      const list = uniqueDatasets.get(indicator.source.datasetCode) ?? [];
      list.push(indicator);
      uniqueDatasets.set(indicator.source.datasetCode, list);
    }

    for (const [datasetCode, indicators] of uniqueDatasets) {
      const sample = indicators[0];
      const methodologyUrl = sample.source.metadataUrl ?? sample.definitionSourceUrl;
      requireLink(sourcesPage, sample.source.dataBrowserUrl, `${locale}: ${datasetCode} links to Eurostat Data Browser`);
      if (methodologyUrl) {
        requireLink(sourcesPage, methodologyUrl, `${locale}: ${datasetCode} links to official metadata`);
      }
      requireLink(sourcesPage, `${prefix}/${sample.source.snapshotPath}`, `${locale}: ${datasetCode} links to raw snapshot`);
      for (const indicator of indicators) {
        requireLink(
          sourcesPage,
          `${prefix}${localizedRoute(locale, `data/${indicator.id}`)}`,
          `${locale}: ${datasetCode} links to indicator ${indicator.id}`,
        );
        requireLink(
          sourcesPage,
          `${prefix}${localizedRoute(locale, `data/${indicator.id}/source`)}`,
          `${locale}: ${datasetCode} links to verification page for ${indicator.id}`,
        );
      }
    }

    for (const indicator of data.indicators) {
      const cardRoute = localizedRoute(locale, `data/${indicator.id}`);
      const sourceRoute = localizedRoute(locale, `data/${indicator.id}/source`);
      const [card, source] = await Promise.all([page(cardRoute), page(sourceRoute)]);
      const sourceBox = card.links.find((link) => hasClass(link, "source-box"));
      assert(sourceBox, `${cardRoute}: source box is a clickable link`);
      if (indicator.source.originalInstitution !== indicator.source.institution) {
        const expectedInstitution = locale === "it" && indicator.source.originalInstitution.includes("European Environment Agency")
          ? "Agenzia europea dell’ambiente (EEA)"
          : indicator.source.originalInstitution;
        assert(sourceBox.text.includes(expectedInstitution), `${cardRoute}: source box discloses original institution`);
      }
      const methodologyUrl = indicator.source.metadataUrl ?? indicator.definitionSourceUrl;
      requireLink(card, methodologyUrl, `${cardRoute}: card actions link to official methodology`);
      const technicalDetails = classRegions(source.html, "source-technical-links")[0];
      assert(technicalDetails, `${sourceRoute}: technical links section exists`);
      assert.match(technicalDetails.attributes, /\bopen(?:=""|\b)/i, `${sourceRoute}: technical links are visible by default`);
      assert.match(technicalDetails.text, /\bKB\b/, `${sourceRoute}: snapshot size is disclosed alongside SHA-256`);
      requireLink(source, `${prefix}${localizedRoute(locale, "sources")}`, `${sourceRoute}: links back to the source directory`);
    }
  });

  test(`${locale}: index indicators display explicit bases, rate-of-change pages expose cumulative indices, and values never concatenate with years`, async () => {
    const home = await page(localizedRoute(locale, ""));
    const rawConcatenatedText = decode(home.html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
    assert.doesNotMatch(rawConcatenatedText, /\d(?:%|anni|years)?20\d{2}/, `${locale}: homepage never concatenates metric values with years when tags are stripped`);
    assert.match(home.text, locale === "it" ? /96 \(UE = 100\)/ : /96 \(EU = 100\)/, `${locale}: homepage GDP snapshot displays 2025 index with explicit EU = 100 unit`);
    assert.match(home.text, locale === "it" ? /Anno 2025/ : /Year 2025/, `${locale}: homepage snapshot prefixes years explicitly`);

    const ghgPage = await page(localizedRoute(locale, "data/greenhouse-gas-emissions"));
    assert.match(ghgPage.text, /\(1990 = 100\)/, `${locale}: greenhouse gas emissions page displays explicit 1990 = 100 index unit`);

    for (const id of ["inflation", "real-gdp-growth-per-capita"]) {
      const ratePage = await page(localizedRoute(locale, `data/${id}`));
      const guide = classRegions(ratePage.html, "index-vs-rate-guide");
      assert.equal(guide.length, 1, `${locale} ${id}: displays index vs. rate of change guide`);
      assert.match(guide[0].text, /= 100/, `${locale} ${id}: guide includes cumulative index base`);
      const toolbar = classRegions(ratePage.html, "trend-mode-toolbar");
      assert.equal(toolbar.length, 1, `${locale} ${id}: historical chart includes mode toggle and base-year selector`);
      const modeButtons = elements(toolbar[0].html, "button");
      assert.equal(modeButtons.length, 2, `${locale} ${id}: toggle between annual rate and cumulative index`);
      const baseSelect = elements(toolbar[0].html, "select");
      assert.equal(baseSelect.length, 1, `${locale} ${id}: base-year selector is present`);
    }
  });
}
