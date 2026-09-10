import en from './en';
import hi from './hi';
import mr from './mr';
import bn from './bn';
import te from './te';
import ta from './ta';
import gu from './gu';
import kn from './kn';
import ml from './ml';
import pa from './pa';
import or_lang from './or';
import as_lang from './as';
import ur from './ur';
import mai from './mai';
import sat from './sat';
import ks from './ks';
import ne from './ne';
import kok from './kok';
import sd from './sd';
import doi from './doi';
import mni from './mni';
import brx from './brx';
import sa from './sa';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲشُر' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' }
];

export const translations = {
  en, hi, mr, bn, te, ta, gu, kn, ml, pa, 
  or: or_lang, as: as_lang, ur, mai, sat, ks, ne, kok, sd, doi, mni, brx, sa
};

export const getTranslation = (lang, key, fallback = '') => {
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  if (translations['en'] && translations['en'][key]) {
    return translations['en'][key];
  }
  return fallback || key;
};
