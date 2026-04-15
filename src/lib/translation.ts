/**
 * Auto-translation service for trip city names.
 * Detects non-English input and translates to English via free APIs.
 * Primary: LibreTranslate — Fallback: MyMemory (both free, no API key needed).
 */

// ── Language detection by Unicode character ranges ────────────────────────────
const LANG_PATTERNS: Record<string, RegExp> = {
  ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,  // Japanese / CJK
  zh: /[\u4E00-\u9FFF]/,                              // Chinese
  ar: /[\u0600-\u06FF]/,                              // Arabic
  ko: /[\uAC00-\uD7AF]/,                              // Korean
  ru: /[\u0400-\u04FF]/,                              // Russian / Cyrillic
  th: /[\u0E00-\u0E7F]/,                              // Thai
  el: /[\u0370-\u03FF]/,                              // Greek
  he: /[\u0590-\u05FF]/,                              // Hebrew
};

export const LANG_NAMES: Record<string, string> = {
  en: 'English', ja: 'Japanese', zh: 'Chinese', ar: 'Arabic',
  ko: 'Korean',  ru: 'Russian',  th: 'Thai',   el: 'Greek', he: 'Hebrew',
  es: 'Spanish', fr: 'French',   de: 'German', it: 'Italian', pt: 'Portuguese',
};

export function detectLanguage(text: string): string {
  for (const [lang, pattern] of Object.entries(LANG_PATTERNS)) {
    if (pattern.test(text)) return lang;
  }
  return 'en';
}

// ── Translation providers ─────────────────────────────────────────────────────

async function translateViaLibreTranslate(text: string, sourceLang: string): Promise<string> {
  const res = await fetch('https://libretranslate.de/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: sourceLang === 'auto' ? 'auto' : sourceLang,
      target: 'en',
      format: 'text',
    }),
  });
  if (!res.ok) throw new Error(`LibreTranslate HTTP ${res.status}`);
  const data = await res.json();
  if (!data.translatedText) throw new Error('LibreTranslate: empty response');
  return data.translatedText;
}

async function translateViaMyMemory(text: string, sourceLang: string): Promise<string> {
  const langPair = sourceLang === 'auto' ? 'auto|en' : `${sourceLang}|en`;
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`,
  );
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) throw new Error(`MyMemory status ${data.responseStatus}`);
  return data.responseData.translatedText;
}

export async function translateToEnglish(text: string, sourceLang = 'auto'): Promise<string> {
  if (!text || sourceLang === 'en') return text;
  try {
    return await translateViaLibreTranslate(text, sourceLang);
  } catch {
    try {
      return await translateViaMyMemory(text, sourceLang);
    } catch {
      return text; // both services failed — return original, never block the user
    }
  }
}

// ── Main helper called by trip creation routes ────────────────────────────────

export async function translateTripCities(from: string, to: string): Promise<{
  fromEn:     string;
  toEn:       string;
  language:   string;
  translated: boolean;
}> {
  const language = detectLanguage(from + to);

  if (language === 'en') {
    return { fromEn: from, toEn: to, language: 'en', translated: false };
  }

  const [fromEn, toEn] = await Promise.all([
    translateToEnglish(from, language),
    translateToEnglish(to, language),
  ]);

  return { fromEn, toEn, language, translated: true };
}
