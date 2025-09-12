import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations as TypeScript modules instead of JSON
import { translations as en } from './translations/en';
import { translations as fr } from './translations/fr';
import { translations as tr } from './translations/tr';
import { translations as zh } from './translations/zh';
import { translations as ar } from './translations/ar';
import { translations as ja } from './translations/ja';
import { translations as it } from './translations/it';
import { translations as es } from './translations/es';
import { translations as ru } from './translations/ru';
import { translations as de } from './translations/de';

const LANGUAGE_STORAGE_KEY = '@figure_ai_language';

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  tr: { translation: tr },
  zh: { translation: zh },
  ar: { translation: ar },
  ja: { translation: ja },
  it: { translation: it },
  es: { translation: es },
  ru: { translation: ru },
  de: { translation: de },
};

// Get device language and check if supported
export const getDeviceLanguage = (): string => {
  try {
    const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
    const supportedCodes = supportedLanguages.map(lang => lang.code);
    
    return supportedCodes.includes(deviceLanguage) ? deviceLanguage : 'en';
  } catch (error) {
    return 'en'; // Fallback to English
  }
};

// Initialize i18next
const initI18n = async () => {
  let savedLanguage = 'en';
  
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    savedLanguage = stored || getDeviceLanguage();
  } catch (error) {
    savedLanguage = getDeviceLanguage();
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Initialize language system
export const initializeLanguage = async (): Promise<void> => {
  try {
    await initI18n();
  } catch (error) {
    console.error('Failed to initialize language system:', error);
  }
};

// Change language and save to storage
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

// Check if language is RTL
export const isRTL = (): boolean => {
  const currentLang = getCurrentLanguage();
  return currentLang === 'ar';
};

// Export i18n instance for use with hooks
export default i18n;