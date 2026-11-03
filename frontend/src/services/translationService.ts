/**
 * Frontend Client-side Translation Service
 * Translates between Korean (ko), Chinese (zh-CN), and English (en)
 * using client-side translation APIs without requiring any backend modifications.
 */

// In-memory translation cache to save requests and ensure instant responses
const translationCache = new Map<string, string>();

// Fallback dictionary for instant common translations
const DICTIONARY: Record<string, Record<string, string>> = {
  'Engipath': { 'zh': 'Engipath', 'ko': 'Engipath', 'en': 'Engipath' },
  '공학': { 'zh': '工程', 'en': 'Engineering' },
  '소프트웨어': { 'zh': '软件', 'en': 'Software' },
  '인공지능': { 'zh': '人工智能', 'en': 'Artificial Intelligence' },
  '사이버보안': { 'zh': '网络安全', 'en': 'Cybersecurity' },
  '데이터 사이언스': { 'zh': '数据科学', 'en': 'Data Science' },
  '진로 계획': { 'zh': '职业规划', 'en': 'Career Plan' }
};

/**
 * Translate text between Korean, Chinese, and English
 * @param text The string to translate
 * @param sourceLang Source language ('ko', 'zh', 'en', 'auto')
 * @param targetLang Target language ('zh', 'ko', 'en')
 */
export async function translateText(
  text: string,
  sourceLang: 'ko' | 'zh' | 'en' | 'auto' = 'ko',
  targetLang: 'zh' | 'ko' | 'en' = 'zh'
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const cacheKey = `${sourceLang}->${targetLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Check static dictionary first for instant response
  if (DICTIONARY[trimmed]?.[targetLang]) {
    const dictResult = DICTIONARY[trimmed][targetLang];
    translationCache.set(cacheKey, dictResult);
    return dictResult;
  }

  // Normalize language codes for Google Translate Web API
  const sl = sourceLang === 'zh' ? 'zh-CN' : sourceLang;
  const tl = targetLang === 'zh' ? 'zh-CN' : targetLang;

  try {
    // 1. Primary: Google Translate Web API client-side endpoint
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(googleUrl);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join('');
        if (translated) {
          translationCache.set(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (error) {
    console.warn('Google Translate API failed, trying fallback API...', error);
  }

  try {
    // 2. Secondary fallback: MyMemory Translation API
    const pair = `${sourceLang === 'auto' ? 'ko' : sourceLang}|${tl}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${pair}`;
    const mmResp = await fetch(myMemoryUrl);

    if (mmResp.ok) {
      const mmData = await mmResp.json();
      const translated = mmData?.responseData?.translatedText;
      if (translated && !translated.startsWith('MYMEMORY WARNING:')) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (error) {
    console.error('All translation APIs failed:', error);
  }

  return trimmed;
}
