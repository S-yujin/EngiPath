// Preserve all language choices in the menu, but use only Korean/English for content.
// Korean is the default; all non-Korean selections deliberately fall back to English.
export type ContentLanguage = 'ko' | 'en';
export function contentLanguage(language: string | null | undefined): ContentLanguage {
  return language === 'ko' ? 'ko' : 'en';
}
let activeUiLanguage: ContentLanguage = 'ko';
export function setUiLanguage(language: string): void { activeUiLanguage = contentLanguage(language); }
export function getUiLanguage(): ContentLanguage { return activeUiLanguage; }
