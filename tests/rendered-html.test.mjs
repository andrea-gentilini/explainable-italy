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
      assert.match(rendered.text, locale === "it" ? /Nessun tracciamento/ : /No tracking/, `${route}: privacy statement`);
    }
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
      const indicatorRoute = localizedRoute(locale, `data/${indicator.id}`);
      const sourceRoute = localizedRoute(locale, `data/${indicator.id}/source`);
      const [card, source] = await Promise.all([page(indicatorRoute), page(sourceRoute)]);
      const reading = elements(card.html, "p").find((element) => hasClass(element, "indicator-value"));
      const panel = elements(source.html, "div").find((element) => hasClass(element, "source-value-panel"));
      assert(reading && panel, `${sourceRoute}: main value and source value are present`);
      const sourceValue = elements(panel.html, "strong")[0];
      assert.equal(sourceValue?.text, reading.text, `${sourceRoute}: the source defaults to the value on the card`);
      assert(elements(panel.html, "small")[0]?.text.includes(String(indicator.latest.year)), `${sourceRoute}: default year is the main observation`);
      assert(sourceValue.text.includes(number(indicator.latest.italy, indicator, locale)), `${sourceRoute}: main value matches the snapshot`);
      requireLink(card, `${prefix}${sourceRoute}?year=${indicator.latest.year}`, `${indicatorRoute}: opens its own source for the year displayed`);
      requireLink(source, indicator.source.apiUrl, `${sourceRoute}: exact original query`);
      requireLink(source, indicator.source.dataBrowserUrl, `${sourceRoute}: official data browser`);
      requireLink(source, indicator.source.doi, `${sourceRoute}: permanent dataset identifier`);
      requireLink(source, indicator.definitionSourceUrl, `${sourceRoute}: official definition`);
      requireLink(card, indicator.definitionSourceUrl, `${indicatorRoute}: definition attribution`);
      assert(source.text.includes(indicator.source.datasetCode), `${sourceRoute}: dataset identifier`);
      assert(source.text.includes(indicator.source.originalInstitution), `${sourceRoute}: original institution`);
      assert(card.text.includes(indicator.plain[locale]), `${indicatorRoute}: readable definition`);
      assert(card.text.includes(indicator.technical[locale]), `${indicatorRoute}: precise definition`);
      assert.match(card.text, locale === "it" ? /parafrasi del progetto/ : /project paraphrases/, `${indicatorRoute}: distinguishes the project's wording from the official definition`);
      for (const note of indicator.notes) {
        assert(source.text.includes(note.text[locale]), `${sourceRoute}: source caveat ${note.type}`);
        assert(card.text.includes(note.text[locale]), `${indicatorRoute}: source caveat ${note.type}`);
        requireLink(source, note.sourceUrl, `${sourceRoute}: note is verifiable`);
      }
      assert.match(source.text, new RegExp(`${indicator.latest.coverage} (?:Paesi UE disponibili su 27|available EU countries out of 27)`), `${sourceRoute}: coverage derives from the selected data`);
      const countryTable = elements(source.html, "table")[0];
      assert(countryTable, `${sourceRoute}: observations behind the median`);
      const countryCodes = [...countryTable.html.matchAll(/<code>([A-Z]{2})<\/code>/g)].map((match) => match[1]).sort();
      assert.deepEqual(countryCodes, indicator.latest.countries.map((country) => country.geo).sort(), `${sourceRoute}: the displayed countries reproduce the main observation`);
      const selectedOptions = elements(source.html, "option").filter((option) => /\bselected(?:="")?(?:\s|$)/.test(option.attributes));
      if (indicator.newerEstimate) {
        assert.equal(selectedOptions.length, 1, `${sourceRoute}: one default comparison year`);
        assert.equal(attribute(selectedOptions[0], "value"), String(indicator.latest.year), `${sourceRoute}: the main observation is selected`);
        const options = elements(source.html, "option").map((option) => attribute(option, "value"));
        assert(options.includes(String(indicator.newerEstimate.year)), `${sourceRoute}: newer provisional or estimated year is available separately`);
      }
      if (indicator.latest.eu === null) {
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
          assert.equal(Number(attribute(selected[0], "value")), indicator.latest.year, `${route}: default remains the main non-estimated observation`);
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
      assert(attribute(selected[0], "aria-label")?.startsWith(`${indicator.latest.year}:`), `${route}: selected chart observation matches the main year`);
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
