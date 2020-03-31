const locales = require.context('./locales');

interface LocaleJSON {
  [_: string]: string | LocaleJSON;
}

const locale = { json: {} as LocaleJSON };

export function setLocale(lang: string) {
  try {
    locale.json = locales(`./${lang}.json`);
  } catch (e) {
    console.error(`Cannot load language: ${lang}, reason: ${e.message}`);
  }
}

export default locale;
