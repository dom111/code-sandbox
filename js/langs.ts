const data = {};

export const addLang = (lang, details) => {
  data[lang] = details;
};

export const getLang = (lang) =>
  data[lang] ?? {
    name: `Unknown (${lang})`,
  };

export const getLangs = () => Object.keys(data);

export const getName = (lang) => getLang(lang).name;

export const getURL = (lang) => getLang(lang).url ?? null;

export const run = (lang, code, args, input) => {
  const { runner } = getLang(lang);

  if (!runner) {
    throw new TypeError(`Unsupported lang: ${lang}`);
  }

  return runner(code, input, args);
};
