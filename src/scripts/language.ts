import { isLocale, t, type Locale, type TranslationKey } from "../i18n";

export const languageStorageKey = "portfolio-language";

export function initLanguageToggle() {
  const button = document.querySelector<HTMLButtonElement>("#language-toggle");
  const label = button?.querySelector<HTMLElement>("[data-i18n='language.label']");
  if (!button || !label) return;

  let locale: Locale = "en";
  try {
    const saved = window.localStorage.getItem(languageStorageKey);
    if (isLocale(saved)) locale = saved;
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }

  const applyLocale = () => {
    const { scrollX, scrollY } = window;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";

    for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
      element.textContent = t(element.dataset.i18n as TranslationKey, locale);
    }
    for (const attribute of ["aria-label", "content"] as const) {
      for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
        const key = element.getAttribute(`data-i18n-${attribute}`) as TranslationKey;
        element.setAttribute(attribute, t(key, locale));
      }
    }

    label.lang = locale === "en" ? "fa" : "en";
    label.dir = locale === "en" ? "rtl" : "ltr";
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
  };

  applyLocale();
  button.addEventListener("click", () => {
    locale = locale === "en" ? "fa" : "en";
    applyLocale();
    try {
      window.localStorage.setItem(languageStorageKey, locale);
    } catch {
      // Switching still works when the browser cannot save the preference.
    }
  });
  button.hidden = false;
}
