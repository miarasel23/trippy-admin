export const getLoginDefaults = (): { platform: string; language_code: string; action_when: string } => {
  // Determine language code dynamically; fallback to 'en' if not set.
  const storedLang = localStorage.getItem('language_code') || localStorage.getItem('lang') || 'en';
  return {
    platform: 'web',
    language_code: storedLang,
    action_when: 'admin_login',
  };
};
