import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true, watch: null },
});
let catalogs, t, isLocale, initLanguageToggle, languageStorageKey, siteConfig;
try {
  ({ catalogs, t, isLocale } = await server.ssrLoadModule("/src/i18n.ts"));
  ({ initLanguageToggle, languageStorageKey } = await server.ssrLoadModule("/src/scripts/language.ts"));
  ({ siteConfig } = await server.ssrLoadModule("/src/config.ts"));
} finally {
  await server.close();
}
const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const initializedContexts = new WeakSet();
const paths = (value, prefix = "") => typeof value === "string" ? [prefix]
  : Object.entries(value).flatMap(([key, item]) => paths(item, prefix ? `${prefix}.${key}` : key));
const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity.startsWith("#")) return String.fromCodePoint(entity[1] === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[entity];
});

// Only model the APIs the controller uses, with bindings taken from the actual build.
function fixture(context, { saved = null, getterFails = false, readFails = false, writeFails = false } = {}) {
  const elements = [...html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)].map(match => {
    const attributes = new Map([...match[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)]
      .map(([, name, value = ""]) => [name, decode(value)]));
    const start = match.index + match[0].length;
    const inner = html.slice(start, html.indexOf(`</${match[1]}>`, start));
    const listeners = new Map();
    return {
      tag: match[1], attributes, inner,
      dataset: Object.fromEntries([...attributes].filter(([key]) => key.startsWith("data-")).map(([key, value]) => [
        key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value,
      ])),
      textContent: decode(inner.replace(/<[^>]*>/g, "")),
      lang: attributes.get("lang"), dir: attributes.get("dir"), hidden: attributes.has("hidden"),
      getAttribute: key => attributes.get(key) ?? null,
      setAttribute: (key, value) => attributes.set(key, value),
      addEventListener: (event, handler) => listeners.set(event, handler),
      click: () => listeners.get("click")?.(),
      querySelector: selector => select(selector)[0] ?? null,
    };
  });
  function select(selector) {
    if (selector === "#language-toggle") return elements.filter(el => el.attributes.get("id") === "language-toggle");
    const [, name, value] = selector.match(/^\[([^=\]]+)(?:='([^']*)')?\]$/);
    return elements.filter(el => el.attributes.has(name) && (value === undefined || el.attributes.get(name) === value));
  }
  const document = {
    documentElement: { lang: "en", dir: "ltr" },
    querySelector: selector => select(selector)[0] ?? null,
    querySelectorAll: select,
    get title() { return elements.find(el => el.tag === "title").textContent; },
  };
  const writes = [];
  const storage = {
    value: saved,
    getItem(key) {
      assert.equal(key, languageStorageKey);
      if (readFails) throw new Error("Denied");
      return this.value;
    },
    setItem(key, value) {
      if (writeFails) throw new Error("Quota exceeded");
      writes.push([key, value]);
      this.value = value;
    },
  };
  const window = {
    scrollX: 0, scrollY: 800, location: { href: "https://slotfi.ir/#about" },
    get localStorage() {
      if (getterFails) throw new Error("Security error");
      return storage;
    },
    scrollTo({ left, top, behavior }) {
      assert.equal(behavior, "instant");
      this.scrollX = left;
      this.scrollY = top;
    },
  };
  if (!initializedContexts.has(context)) {
    initializedContexts.add(context);
    const originals = { document: globalThis.document, window: globalThis.window };
    context.after(() => {
      for (const [key, value] of Object.entries(originals)) {
        if (value === undefined) delete globalThis[key];
        else globalThis[key] = value;
      }
    });
  }
  Object.assign(globalThis, { document, window });
  return { document, window, elements, storage, writes,
    button: document.querySelector("#language-toggle"),
    label: document.querySelector("[data-i18n='language.label']"),
  };
}

function assertLocale(view, locale) {
  assert.equal(view.document.documentElement.lang, locale);
  assert.equal(view.document.documentElement.dir, locale === "fa" ? "rtl" : "ltr");
  for (const element of view.elements) {
    if (element.dataset.i18n) assert.equal(element.textContent, t(element.dataset.i18n, locale));
    for (const attribute of ["aria-label", "content"]) {
      const key = element.getAttribute(`data-i18n-${attribute}`);
      if (key) assert.equal(element.getAttribute(attribute), t(key, locale));
    }
  }
  assert.equal(view.document.title, catalogs[locale].pageTitle);
  assert.equal(view.label.lang, locale === "en" ? "fa" : "en");
  assert.equal(view.label.dir, locale === "en" ? "rtl" : "ltr");
  assert.equal(view.button.hidden, false);
  assert.equal(view.button.getAttribute("lang"), null);
  assert.ok(view.button.getAttribute("aria-label").startsWith(view.label.textContent));
}

test("catalog keys, list lengths, empty arrays, and lookups match in both languages", () => {
  function compare(english, persian) {
    assert.equal(typeof english, typeof persian);
    assert.equal(Array.isArray(english), Array.isArray(persian));
    if (typeof english === "string") return;
    assert.deepEqual(Object.keys(english), Object.keys(persian));
    for (const key of Object.keys(english)) compare(english[key], persian[key]);
  }
  compare(catalogs.en, catalogs.fa);
  for (const key of paths(catalogs.en)) for (const locale of ["en", "fa"]) assert.equal(typeof t(key, locale), "string");
  assert.throws(() => t("missing"), /Missing/);
});

test("English source content, product names, and technical identifiers are preserved", () => {
  for (const key of ["name", "title", "description", "aboutMe", "skills"]) assert.deepEqual(catalogs.en[key], siteConfig[key]);
  for (const key of ["experience", "education"]) {
    for (const [index, record] of siteConfig[key].entries()) assert.deepEqual(catalogs.en[key][index], record);
  }
  for (const [index, project] of siteConfig.projects.entries()) {
    for (const key of ["name", "description", "skills"]) assert.deepEqual(catalogs.en.projects[index][key], project[key]);
    assert.equal(catalogs.fa.projects[index].name, project.name);
    assert.deepEqual(catalogs.fa.projects[index].skills, project.skills);
  }
  assert.equal(catalogs.fa.education[1].dateRange, "۲۰۲۵ تا ۲۰۲۱");
});

test("built English HTML binds every catalog field and provides a no-JavaScript fallback", context => {
  const view = fixture(context);
  const bound = new Set();
  for (const element of view.elements) {
    if (element.dataset.i18n) {
      assert.ok(!element.inner.includes("<"), `Text binding must be a leaf: ${element.dataset.i18n}`);
      assert.equal(element.textContent.trim(), t(element.dataset.i18n).trim());
      bound.add(element.dataset.i18n);
    }
    for (const attribute of ["aria-label", "content"]) {
      const key = element.getAttribute(`data-i18n-${attribute}`);
      if (!key) continue;
      assert.equal(element.getAttribute(attribute), t(key));
      bound.add(key);
    }
  }
  assert.deepEqual([...bound].sort(), paths(catalogs.en).sort());
  assert.equal(view.button.hidden, true);
  assert.equal(view.button.getAttribute("type"), "button");
  assert.match(html, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(html, /focus-visible:outline/);
  assert.equal(view.document.title, catalogs.en.pageTitle);
});

test("defaults to English without writing storage and switches every binding both ways", context => {
  const view = fixture(context);
  const nodes = [...view.elements];
  const destinations = nodes.map(el => [el.getAttribute("href"), el.getAttribute("id")]);
  view.document.activeElement = view.button;
  initLanguageToggle();
  assertLocale(view, "en");
  assert.deepEqual(view.writes, []);
  view.button.click();
  assertLocale(view, "fa");
  view.button.click();
  assertLocale(view, "en");
  assert.deepEqual(view.writes, [[languageStorageKey, "fa"], [languageStorageKey, "en"]]);
  assert.ok(view.elements.every((element, index) => element === nodes[index]));
  assert.deepEqual(view.elements.map(el => [el.getAttribute("href"), el.getAttribute("id")]), destinations);
  assert.equal(view.document.activeElement, view.button);
  assert.equal(view.window.scrollY, 800);
  assert.equal(view.window.location.href, "https://slotfi.ir/#about");
});

for (const saved of ["en", "fa"]) {
  test(`restores ${saved} without writing storage`, context => {
    const view = fixture(context, { saved });
    initLanguageToggle();
    assertLocale(view, saved);
    assert.deepEqual(view.writes, []);
  });
}

test("an explicitly saved choice survives a fresh initialization", context => {
  const first = fixture(context);
  initLanguageToggle();
  first.button.click();
  const second = fixture(context, { saved: first.storage.value });
  initLanguageToggle();
  assertLocale(second, "fa");
});

for (const saved of ["", "ar", "fa-IR", "FA", "<script>", "__proto__"]) {
  test(`unsupported preference ${JSON.stringify(saved)} falls back without writes`, context => {
    assert.equal(isLocale(saved), false);
    const view = fixture(context, { saved });
    initLanguageToggle();
    assertLocale(view, "en");
    assert.deepEqual(view.writes, []);
  });
}

for (const failure of ["getterFails", "readFails", "writeFails"]) {
  test(`${failure} does not prevent rendering or switching`, context => {
    const view = fixture(context, { [failure]: true });
    initLanguageToggle();
    assertLocale(view, "en");
    view.button.click();
    assertLocale(view, "fa");
    view.button.click();
    assertLocale(view, "en");
  });
}

test("a write failure does not prevent restoring an existing preference", context => {
  const view = fixture(context, { saved: "fa", writeFails: true });
  initLanguageToggle();
  assertLocale(view, "fa");
  view.button.click();
  assertLocale(view, "en");
  assert.deepEqual(view.writes, []);
});

test("initialization is safe when the button or its label is absent", context => {
  const view = fixture(context);
  view.document.querySelector = () => null;
  assert.doesNotThrow(initLanguageToggle);
  view.document.querySelector = () => view.button;
  view.button.querySelector = () => null;
  assert.doesNotThrow(initLanguageToggle);
  assert.equal(view.button.hidden, true);
});
