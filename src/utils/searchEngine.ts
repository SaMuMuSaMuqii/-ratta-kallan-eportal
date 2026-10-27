/**
 * Ratta Kallan Digital Portal - Unified Multilingual Search Engine
 * Supports Urdu (اردو), Punjabi (Shahmukhi & Gurmukhi), Roman Urdu, and English.
 * Features:
 *  - Diacritic & Orthography Normalization (اعارب، ہمزہ، ے/ی، ہ/ھ، ک/ك)
 *  - Gurmukhi to Shahmukhi transliteration map
 *  - Deep Multilingual Synonym Dictionary & Stemming
 *  - Weighted Fuzzy Ranking (Name > Business > Services > Phone > Location)
 *  - Universal Cross-Entity Search (Profiles, Mosques, Institutes, Transports, Hospitals)
 */

import {
  VillageProfile,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  VillageNewsEvent,
  VillageAnnouncement,
  MandiRateItem,
  ShelterItem,
  HelpGuideItem,
  CustomSearchKeywordItem,
} from '../types';
import {
  sanitizePublicProfile,
  sanitizePublicMosque,
  sanitizePublicInstitute,
  sanitizePublicTransport,
  sanitizePublicHospital,
  initialMandiRates,
  initialShelters,
  initialHelpGuides,
} from './privacySanitizer';

export interface PortalFeatureSearchItem {
  id: string;
  actionType:
    | 'open_admin_supervision'
    | 'open_admin_panel'
    | 'open_login'
    | 'open_reset_password'
    | 'open_register'
    | 'open_ai_school'
    | 'open_route_planner'
    | 'open_help_noticeboard'
    | 'open_voice_ask'
    | 'open_emergency_page'
    | 'open_privacy_page'
    | 'open_terms_page'
    | 'open_mosques_modal'
    | 'open_institutes_modal'
    | 'open_hospitals_modal'
    | 'open_transport_modal'
    | 'open_news_modal'
    | 'open_inbox_modal';
  titleUrdu: string;
  titleEn: string;
  descriptionUrdu: string;
  badgeUrdu: string;
  buttonLabelUrdu: string;
  secondaryActionType?: 'open_admin_panel' | 'open_login' | 'open_reset_password';
  secondaryButtonLabelUrdu?: string;
  keywords: string[];
  contactPhone?: string;
}

export interface PublicHelpNoticeSearchItem {
  id: string;
  type: 'blood' | 'lost' | 'urgent_aid' | 'other' | string;
  title: string;
  details: string;
  contactName: string;
  contactMobile: string;
  location: string;
  createdAt?: string;
}

export type SearchResultEntityType =
  | 'portal_action'
  | 'profile'
  | 'mosque'
  | 'institute'
  | 'transport'
  | 'hospital'
  | 'news'
  | 'announcement'
  | 'mandi_rate'
  | 'shelter'
  | 'help_notice'
  | 'help_guide'
  | 'custom_keyword';

export interface SearchResultItem {
  id: string;
  type: SearchResultEntityType;
  title: string;
  subtitle: string;
  categoryLabelUrdu: string;
  categoryLabelEn: string;
  contactNumber: string;
  location: string;
  score: number;
  rawItem:
    | PortalFeatureSearchItem
    | VillageProfile
    | VillageMosque
    | VillageInstitute
    | VillageTransport
    | VillageHospital
    | VillageNewsEvent
    | VillageAnnouncement
    | MandiRateItem
    | ShelterItem
    | PublicHelpNoticeSearchItem
    | HelpGuideItem
    | CustomSearchKeywordItem;
}

/**
 * Built-in index of all Portal Pages, Sections, and Interactive Actions
 * so that searching "admin", "ایڈمن", "login", "پروفائل", "منڈی", "سکول", "ایمرجنسی", etc.
 * immediately brings the exact portal control/feature to the front of the screen.
 */
export const PORTAL_FEATURES_INDEX: PortalFeatureSearchItem[] = [
  {
    id: 'portal-action-admin',
    actionType: 'open_admin_supervision',
    secondaryActionType: 'open_admin_panel',
    titleUrdu: '🔐 ایڈمن پینل اور سپر ایڈمن کنٹرول ڈیش بورڈ',
    titleEn: 'Admin Panel & Super Admin Supervision Dashboard',
    descriptionUrdu:
      'ایڈمن اپنی ای میل اور پاس ورڈ سے لاگ ان کریں، اپنا پاس ورڈ تبدیل کریں، پروفائلز، بینر تصاویر، خبریں، منڈی ریٹس، شیلٹرز، الرٹس اور رولز کنٹرول کریں۔',
    badgeUrdu: 'ایڈمن کنٹرول پینل',
    buttonLabelUrdu: 'سپر ایڈمن ڈیش بورڈ کھولیں',
    secondaryButtonLabelUrdu: 'ایڈمن پینل کھولیں',
    keywords: [
      'admin',
      'super admin',
      'admin panel',
      'admin panal',
      'admin dashboard',
      'admin login',
      'admin control',
      'superadmin',
      'control panel',
      'dashboard',
      'management',
      'moderator',
      'roles',
      'banner control',
      'admin log',
      '#admin',
      'ایڈمن',
      'ایڈمن پینل',
      'سپر ایڈمن',
      'کنٹرول پینل',
      'ڈیش بورڈ',
      'ایڈمن لاگ ان',
      'ایڈمنسٹریٹر',
      'انتظامیہ',
      'نگرانی',
      'سپر ایڈمن پینل',
      'ایڈمن پاس ورڈ',
      'ایڈمن سیٹنگ',
      'بینر کنٹرول',
    ],
  },
  {
    id: 'portal-action-login',
    actionType: 'open_login',
    secondaryActionType: 'open_reset_password',
    titleUrdu: '🔑 ذاتی اکاؤنٹ لاگ ان اور سیکیورٹی (Login / Sign In)',
    titleEn: 'User & Admin Account Login',
    descriptionUrdu:
      'اپنے ذاتی پروفائل، کاروبار، ان باکس یا ایڈمن اکاؤنٹ میں لاگ ان کریں یا پاس ورڈ تبدیل کریں۔',
    badgeUrdu: 'اکاؤنٹ لاگ ان',
    buttonLabelUrdu: 'لاگ ان ونڈو کھولیں',
    secondaryButtonLabelUrdu: 'پاس ورڈ ری سیٹ / تبدیل کریں',
    keywords: [
      'login',
      'log in',
      'signin',
      'sign in',
      'account',
      'my account',
      'user login',
      'profile login',
      'لاگ ان',
      'اکاؤنٹ',
      'سائن ان',
      'میرا اکاؤنٹ',
      'پروفائل لاگ ان',
    ],
  },
  {
    id: 'portal-action-reset-password',
    actionType: 'open_reset_password',
    secondaryActionType: 'open_login',
    titleUrdu: '🔄 پاس ورڈ تبدیل یا ری سیٹ کریں (Change / Forgot Password)',
    titleEn: 'Change or Reset Password via Email',
    descriptionUrdu:
      'اگر آپ اپنا پاس ورڈ بھول گئے ہیں یا نیا پاس ورڈ رکھنا چاہتے ہیں تو اپنی ای میل پر ری سیٹ لنک منگوائیں۔',
    badgeUrdu: 'پاس ورڈ ریکوری',
    buttonLabelUrdu: 'پاس ورڈ ری سیٹ کھولیں',
    secondaryButtonLabelUrdu: 'لاگ ان کھولیں',
    keywords: [
      'forgot password',
      'reset password',
      'change password',
      'password change',
      'password reset',
      'recover password',
      'bhool gaya',
      'پاس ورڈ تبدیل',
      'پاس ورڈ ری سیٹ',
      'پاس ورڈ بھول گیا',
      'نیا پاس ورڈ',
      'پاسورڈ چینج',
    ],
  },
  {
    id: 'portal-action-register',
    actionType: 'open_register',
    titleUrdu: '➕ نئی پروفائل، دکان، کاریگر یا ادارہ شامل کریں (Register)',
    titleEn: 'Add New Profile, Shop, Worker, Mosque, School or Transport',
    descriptionUrdu:
      'رتہ کلاں پورٹل میں اپنا کاروبار، ہنر، دکان، مسجد، سکول، ہسپتال یا گاڑی مفت رجسٹر کریں۔',
    badgeUrdu: 'نیا اندراج',
    buttonLabelUrdu: 'نیا اندراج فارم کھولیں',
    keywords: [
      'register',
      'add profile',
      'new profile',
      'create profile',
      'add shop',
      'add business',
      'signup',
      'sign up',
      'نئی پروفائل',
      'نیا اندراج',
      'نام لکھوائیں',
      'پروفائل بنائیں',
      'کاروبار شامل کریں',
      'دکان درج کریں',
      'رجسٹریشن',
    ],
  },
  {
    id: 'portal-action-ai-school',
    actionType: 'open_ai_school',
    titleUrdu: '💻 رتہ کلاں اے آئی اینڈ ٹیکنالوجی سکول (AI & IT School)',
    titleEn: 'Ratta Kallan AI & Modern Technology School',
    descriptionUrdu:
      'نوجوانوں اور طلباء کے لیے مصنوعی ذہانت (AI)، کمپیوٹر، فری لانسنگ اور جدید آئی ٹی کورسز۔',
    badgeUrdu: 'اے آئی سکول',
    buttonLabelUrdu: 'اے آئی سکول کھولیں',
    keywords: [
      'ai school',
      'ai',
      'computer school',
      'it school',
      'freelancing',
      'coding',
      'technology',
      'اے آئی سکول',
      'کمپیوٹر کورس',
      'فری لانسنگ',
      'ٹیکنالوجی سکول',
      'آئی ٹی تعلیم',
    ],
  },
  {
    id: 'portal-action-route-planner',
    actionType: 'open_route_planner',
    titleUrdu: '🗺️ قریبی راستہ، نقشہ اور سفری رہنما (Route & Travel Planner)',
    titleEn: 'Village Route Planner & Distance Guide',
    descriptionUrdu:
      'رتہ کلاں سے جھنگ، لاہور، فیصل آباد اور قریبی شہروں کا فاصلہ، کرایہ، وقت اور راستہ دیکھیں۔',
    badgeUrdu: 'سفری رہنما',
    buttonLabelUrdu: 'قریبی راستہ و نقشہ دیکھیں',
    keywords: [
      'route',
      'route planner',
      'map',
      'direction',
      'distance',
      'travel guide',
      'rasta',
      'naqsha',
      'قریبی راستہ',
      'سفری رہنما',
      'نقشہ',
      'فاصلہ',
      'روٹ پلانر',
      'راستہ',
    ],
  },
  {
    id: 'portal-action-help-board',
    actionType: 'open_help_noticeboard',
    titleUrdu: '🩸 کمیونٹی امداد، عطیہ خون اور گمشدہ اشیاء نوٹس بورڈ',
    titleEn: 'Community Help, Blood Donation & Lost/Found Noticeboard',
    descriptionUrdu:
      'خون کے عطیے کی اپیل، گمشدہ کاغذات یا ہنگامی کمیونٹی مدد کے اعلانات دیکھیں یا نیا اعلان لگائیں۔',
    badgeUrdu: 'امداد و خون نوٹس بورڈ',
    buttonLabelUrdu: 'امداد و بلڈ نوٹس بورڈ کھولیں',
    keywords: [
      'blood',
      'blood donor',
      'blood group',
      'help board',
      'noticeboard',
      'lost and found',
      'urgent aid',
      'خون',
      'بلڈ ڈونر',
      'عطیہ خون',
      'امداد',
      'نوٹس بورڈ',
      'گمشدہ',
      'مدد اپیل',
    ],
  },
  {
    id: 'portal-action-voice-ask',
    actionType: 'open_voice_ask',
    titleUrdu: '🎙️ بول کر پوچھیں — اردو، پنجابی اور انگلش صوتی مددگار',
    titleEn: 'Ask by Voice Assistant (Urdu / Punjabi / English)',
    descriptionUrdu:
      'بزرگوں اور نہ پڑھ سکنے والے افراد کے لیے ایک بٹن دبا کر اپنی آواز میں سوال پوچھنے اور جواب سننے کی سہولت۔',
    badgeUrdu: 'صوتی مددگار',
    buttonLabelUrdu: 'بول کر پوچھیں کھولیں',
    keywords: [
      'voice',
      'voice search',
      'ask by voice',
      'mic',
      'microphone',
      'speak',
      'bol kar poochain',
      'بول کر پوچھیں',
      'آواز سے تلاش',
      'مائیک',
      'صوتی مددگار',
    ],
  },
  {
    id: 'portal-action-emergency',
    actionType: 'open_emergency_page',
    titleUrdu: '🚨 ہنگامی نمبرز (1122، 15، 16)، شیلٹرز اور سیلاب الرٹ پیج',
    titleEn: 'Emergency Numbers (1122, 15, 16), Shelters & Flood Alert',
    descriptionUrdu:
      'ریسکیو 1122، پولیس 15، فائر بریگیڈ 16، قریبی ہسپتال، سیلاب الرٹ لیول اور محفوظ پناہ گاہوں کی فہرست۔',
    badgeUrdu: 'ایمرجنسی 1122',
    buttonLabelUrdu: 'ایمرجنسی پیج کھولیں',
    contactPhone: '1122',
    keywords: [
      'emergency',
      '1122',
      '15',
      '16',
      'rescue',
      'ambulance',
      'fire brigade',
      'police',
      'flood alert',
      'shelter',
      'ایمرجنسی',
      'ریسکیو',
      'ایمبولینس',
      'فائر بریگیڈ',
      'پولیس',
      'سیلاب الرٹ',
      'پناہ گاہ',
    ],
  },
  {
    id: 'portal-action-privacy',
    actionType: 'open_privacy_page',
    titleUrdu: '🛡️ پرائیویسی پالیسی اور ڈیٹا کی حفاظت (Privacy Policy)',
    titleEn: 'Portal Privacy Policy',
    descriptionUrdu:
      'پورٹل کون سا ڈیٹا رکھتا ہے، ذاتی معلومات (ای میل، بلڈ گروپ، پیغامات) کی حفاظت اور پروفائل حذف کرنے کا طریقہ۔',
    badgeUrdu: 'پرائیویسی پالیسی',
    buttonLabelUrdu: 'پرائیویسی پالیسی پڑھیں',
    keywords: [
      'privacy',
      'privacy policy',
      'data protection',
      'پرائیویسی',
      'پرائیویسی پالیسی',
      'رازداری',
      'ڈیٹا کی حفاظت',
    ],
  },
  {
    id: 'portal-action-terms',
    actionType: 'open_terms_page',
    titleUrdu: '📜 شرائط و ضوابط اور کمیونٹی اصول (Terms & Conditions)',
    titleEn: 'Terms & Conditions and Village Community Rules',
    descriptionUrdu:
      'رتہ کلاں پورٹل کے کمیونٹی اصول، خواتین کے نمبرز/تصاویر کی ممانعت، اور باوقار استعمال کے قواعد۔',
    badgeUrdu: 'شرائط و ضوابط',
    buttonLabelUrdu: 'شرائط و ضوابط پڑھیں',
    keywords: [
      'terms',
      'terms and conditions',
      'community rules',
      'rules',
      'policy',
      'شرائط',
      'شرائط و ضوابط',
      'کمیونٹی اصول',
      'قواعد و ضوابط',
    ],
  },
  {
    id: 'portal-action-news',
    actionType: 'open_news_modal',
    titleUrdu: '📢 گاؤں کی تازہ خبریں، اعلانات اور تقریبات',
    titleEn: 'Village News, Events & Official Announcements',
    descriptionUrdu:
      'رتہ کلاں کی تازہ ترین خبریں، میڈیکل کیمپ، واپڈا اعلانات، جنازہ یا مقامی تقریبات کی تفصیلات۔',
    badgeUrdu: 'خبریں و اعلانات',
    buttonLabelUrdu: 'تمام خبریں کھولیں',
    keywords: [
      'news',
      'village news',
      'events',
      'announcements',
      'khabrain',
      'elan',
      'خبریں',
      'تازہ خبریں',
      'اعلانات',
      'گاؤں کے واقعات',
    ],
  },
];

// ================= 1. DIACRITIC & ORTHOGRAPHY NORMALIZATION =================

/**
 * Strips Arabic/Urdu diacritics (Harakat: Zabar, Zer, Pesh, Tanwin, Tashdeed, Sukun, Maddah).
 */
export function stripUrduDiacritics(text: string): string {
  if (!text) return '';
  return text
    // Arabic Diacritics range \u064B - \u065F, \u0670
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // Zero-width non-joiner & joiner
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Gurmukhi to Shahmukhi character transliteration map for Punjabi cross-script search.
 */
const GURMUKHI_TO_SHAHMUKHI_MAP: Record<string, string> = {
  'ਅ': 'ا', 'ਆ': 'آ', 'ਇ': 'اِ', 'ਈ': 'ای', 'ਉ': 'اُ', 'ਊ': 'او', 'ਏ': 'اے', 'ਐ': 'اے', 'ਓ': 'او', 'ਔ': 'او',
  'ਕ': 'ک', 'ਖ': 'کھ', 'ਗ': 'گ', 'ਘ': 'گھ', 'ਙ': 'ن',
  'ਚ': 'چ', 'ਛ': 'چھ', 'ਜ': 'ج', 'ਝ': 'جھ', 'ਞ': 'ن',
  'ਟ': 'ٹ', 'ਠ': 'ٹھ', 'ਡ': 'ڈ', 'ਢ': 'ڈھ', 'ਣ': 'ݨ',
  'ਤ': 'ت', 'ਥ': 'تھ', 'ਦ': 'د', 'ਧ': 'دھ', 'ਨ': 'ن',
  'ਪ': 'پ', 'ਫ': 'پھ', 'ਬ': 'ب', 'ਭ': 'بھ', 'ਮ': 'م',
  'ਯ': 'ی', 'ਰ': 'ر', 'ਲ': 'ل', 'ਵ': 'و', 'ੜ': 'ڑ',
  'ਸ': 'س', 'ਹ': 'ہ',
  'ਸ਼': 'ش', 'ਜ਼': 'ز', 'ਫ਼': 'ف', 'ਖ਼': 'خ', 'ਗ਼': 'غ',
  'ਾ': 'ا', 'ਿ': 'ی', 'ੀ': 'ی', 'ੁ': 'و', 'ੂ': 'و', 'ੇ': 'ے', 'ੈ': 'ے', 'ੋ': 'و', 'ੌ': 'و',
  'ੰ': 'ں', 'ਂ': 'ں', 'ੱ': '', '੍': '',
};

export function transliterateGurmukhiToShahmukhi(input: string): string {
  let result = '';
  for (const char of input) {
    result += GURMUKHI_TO_SHAHMUKHI_MAP[char] !== undefined ? GURMUKHI_TO_SHAHMUKHI_MAP[char] : char;
  }
  return result;
}

/**
 * Normalizes text across Urdu, Punjabi, Roman Urdu, and English:
 *  - Strips harakat
 *  - Normalizes Urdu letter variants (ی/ے/ي, ک/ك, ہ/ھ/ۃ, ؤ/أ/ء, گ/ڳ)
 *  - Normalizes Roman Urdu phonetics (e.g. kh/khh, bh/b, gh/g)
 *  - Converts to lowercase and collapses whitespace
 */
export function normalizeSearchString(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Transliterate Gurmukhi if present
  if (/[\u0A00-\u0A7F]/.test(str)) {
    str = transliterateGurmukhiToShahmukhi(str);
  }

  // Strip diacritics
  str = stripUrduDiacritics(str);

  // Normalize Unicode letter shapes
  str = str
    .replace(/[يىے]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ۃھ]/g, 'ہ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ی')
    .replace(/[ڈډ]/g, 'ڈ')
    .replace(/[ٹټ]/g, 'ٹ')
    .replace(/[ڑړ]/g, 'ڑ')
    .replace(/[ݨ]/g, 'ن')
    .replace(/[ڳ]/g, 'گ')
    .replace(/[\u06D4\u060C\u061F]/g, ' ') // Urdu punctuation
    .toLowerCase();

  return str.replace(/\s+/g, ' ').trim();
}

// ================= 2. DEEP MULTILINGUAL SYNONYM DICTIONARY =================

/**
 * Clusters of equivalent terms across Urdu, Punjabi, Roman Urdu, and English.
 */
export const SYNONYM_CLUSTERS: string[][] = [
  // Admin / Super Admin / Control Panel / Dashboard
  [
    'ایڈمن', 'ایڈمن پینل', 'سپر ایڈمن', 'کنٹرول پینل', 'ڈیش بورڈ', 'نگرانی', 'انتظامیہ', 'ایڈمن لاگ ان',
    'admin', 'super admin', 'admin panel', 'admin panal', 'dashboard', 'control panel', 'admin login', 'superadmin', '#admin'
  ],
  // Login / Account / Password Reset
  [
    'لاگ ان', 'اکاؤنٹ', 'سائن ان', 'پاس ورڈ تبدیل', 'پاس ورڈ ری سیٹ', 'پاس ورڈ بھول گیا',
    'login', 'sign in', 'account', 'reset password', 'forgot password', 'change password'
  ],
  // Register / New Profile
  [
    'نئی پروفائل', 'نیا اندراج', 'نام لکھوائیں', 'پروفائل بنائیں', 'رجسٹریشن',
    'register', 'new profile', 'add profile', 'signup', 'sign up'
  ],
  // Mandi Rates / Crops / Fertilizer
  [
    'منڈی', 'غلہ منڈی', 'منڈی ریٹ', 'فصل', 'گندم', 'چاول', 'کپاس', 'پھٹی', 'گڑ', 'کھاد', 'یوریا', 'ڈی اے پی', 'اجناس',
    'mandi', 'mandi rate', 'crop rate', 'wheat', 'gandum', 'rice', 'chawal', 'cotton', 'kapas', 'gur', 'urea', 'fertilizer', 'dap'
  ],
  // Shelters / Flood Alert / Relief
  [
    'پناہ گاہ', 'شیلٹر', 'سیلاب', 'سیلاب الرٹ', 'ہنگامی کیمپ', 'محفوظ مقام',
    'shelter', 'panah gah', 'flood', 'flood alert', 'relief camp'
  ],
  // Mistri / Mason / Construction
  [
    'مستری', 'راج', 'مزدور', 'راج مزدور', 'تعمیر', 'مکان', 'پلستر', 'دیوار', 'بنیاد',
    'mistri', 'raj', 'mazdoor', 'majdoor', 'mason', 'construction', 'builder', 'bricklayer'
  ],
  // Electrician / Wiring / Solar
  [
    'الیکٹریشن', 'بجلی', 'بجلی والا', 'تار', 'وائرنگ', 'سولر', 'موٹر', 'پنکھا', 'یو پی ایس', 'بیٹری', 'سولر پلیٹ',
    'electrician', 'bijli', 'solar', 'wiring', 'motor', 'fan', 'ups', 'battery', 'inverter'
  ],
  // Doctor / Clinic / Hospital / Pharmacy
  [
    'ڈاکٹر', 'طبیب', 'کلینک', 'ہسپتال', 'اسپتال', 'دوا', 'دوائی', 'میڈیکل', 'علاج', 'شفا', 'ایمرجنسی', 'ریسکیو', '1122',
    'doctor', 'clinic', 'hospital', 'medical', 'medicine', 'dawa', 'dawakhana', 'cure', 'emergency', '1122', 'ambulance'
  ],
  // Tailor / Clothes / Sewing
  [
    'درزی', 'سلائی', 'سوٹ', 'کپڑے', 'ٹیلر', 'ماسٹر', 'قمیض', 'شلوار', 'کڑھائی',
    'tailor', 'darzi', 'silai', 'kapray', 'suit', 'clothes', 'dressmaker'
  ],
  // Tractor / Agriculture machinery / Mechanics
  [
    'ٹریکٹر', 'ہل', 'روٹاوریٹر', 'زرعی', 'کاشت', 'کاشتکاری', 'لیزر', 'تھریشر', 'مشینری', 'ڈرائیور', 'پلاؤ',
    'tractor', 'hal', 'rotavator', 'thresher', 'agriculture', 'zarai', 'kashtkari', 'laser'
  ],
  // Karyana / Grocery / General store
  [
    'کریانہ', 'جنرل سٹور', 'سودا', 'سودا سلف', 'دکان', 'پرچون', 'گھی', 'چینی', 'پتی', 'صابن',
    'karyana', 'grocery', 'general store', 'store', 'kiryana', 'kirana', 'shop', 'parchoon'
  ],
  // Plumber / Sanitary / Pipes
  [
    'پلمبر', 'سینیٹری', 'پائپ', 'ٹونٹی', 'بورنگ', 'واش روم', 'پانی کا پائپ', 'نلکا',
    'plumber', 'sanitary', 'pipe', 'boring', 'water pipe', 'tap'
  ],
  // Welder / Iron / Gate
  [
    'ویلڈر', 'لوہار', 'لوہا', 'گیٹ', 'جنگلا', 'کھڑکی', 'ویلڈنگ',
    'welder', 'welding', 'lohar', 'iron', 'gate', 'grill', 'loha'
  ],
  // Barber / Salon / Hair
  [
    'حجام', 'نائی', 'بال', 'سیلون', 'خط', 'شیو', 'حجامت',
    'barber', 'nai', 'haircut', 'salon', 'shave', 'khat'
  ],
  // Chakki / Flour / Grain
  [
    'چکی', 'آٹا چکی', 'گندم', 'آٹا', 'چوکر', 'پیسائی',
    'chakki', 'atta', 'flour', 'flour mill', 'grinding', 'wheat', 'gandum'
  ],
  // Milk / Dairy / Buffalo
  [
    'دودھ', 'ڈیری', 'دہی', 'مکھن', 'گائے', 'بھینس', 'کھویا', 'دودھ دہی',
    'milk', 'dairy', 'doodh', 'yogurt', 'dahi', 'makhan', 'butter'
  ],
  // Transport / Hiace / Bus / Rickshaw
  [
    'گاڑی', 'ویگن', 'ہائی ایس', 'بس', 'رکشہ', 'اڈا', 'کرایہ', 'جھنگ', 'سواری', 'ڈرائیور', 'ٹرانسپورٹ',
    'transport', 'hiace', 'wagon', 'bus', 'rickshaw', 'adda', 'fare', 'driver', 'jhang', 'sawari'
  ],
  // Mosque / Masjid / Prayer / Imam
  [
    'مسجد', 'جامع مسجد', 'نماز', 'اذان', 'امام', 'مؤذن', 'جمعہ', 'فجر', 'ظہر', 'عصر', 'مغرب', 'عشاء',
    'mosque', 'masjid', 'namaz', 'azan', 'imam', 'jummah', 'prayer'
  ],
  // School / Institute / Education
  [
    'سکول', 'اسکول', 'کالج', 'مدرسہ', 'تعلیم', 'پڑھائی', 'ہیڈ ماسٹر', 'استاد', 'کلاس', 'داخلہ',
    'school', 'college', 'madrasa', 'education', 'taleem', 'teacher', 'headmaster', 'academy'
  ],
  // Day Laborer / Daily Wage (دیہاڑی دار)
  [
    'دیہاڑی', 'مزدور', 'لیبر', 'روزگار', 'دیہاڑی دار', 'دستیاب',
    'labor', 'daily wage', 'mazdoor', 'dehadi', 'labour'
  ],
  // News / Events / Announcements
  [
    'خبر', 'خبریں', 'اعلان', 'اعلانات', 'واقعات', 'میڈیکل کیمپ', 'واپڈا', 'جنازہ',
    'news', 'announcement', 'events', 'khabar', 'khabrain', 'elan', 'alert'
  ],
  // Community Help / Blood Donation / Lost & Found
  [
    'خون', 'عطیہ خون', 'بلڈ', 'بلڈ ڈونر', 'امداد', 'گمشدہ', 'نوٹس بورڈ',
    'blood', 'donor', 'help', 'lost', 'found', 'noticeboard', 'urgent aid'
  ],
];

/**
 * Returns all synonym terms (normalized) that expand the user's query keywords.
 */
export function expandSynonyms(word: string): string[] {
  const norm = normalizeSearchString(word);
  if (!norm) return [];

  const expansions = new Set<string>();
  expansions.add(norm);

  for (const cluster of SYNONYM_CLUSTERS) {
    const normCluster = cluster.map(normalizeSearchString);
    const hasMatch = normCluster.some((item) => {
      if (!item) return false;
      if (item === norm) return true;
      const itemWords = item.split(/\s+/);
      return itemWords.includes(norm);
    });
    if (hasMatch) {
      normCluster.forEach((term) => expansions.add(term));
    }
  }

  return Array.from(expansions);
}

// ================= 3. WEIGHTED FUZZY SCORING =================

interface SearchTargetStrings {
  name: string;
  category: string;
  businessName: string;
  services: string[];
  location: string;
  phoneDigits: string;
}

/**
 * Calculates a search relevance score for a given entity based on field weights.
 * Max score is unbounded, higher is better match. 0 means no match.
 */
export function calculateMatchScore(
  targets: SearchTargetStrings,
  query: string
): number {
  const normQuery = normalizeSearchString(query);
  if (!normQuery) return 0;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return 0;

  const normName = normalizeSearchString(targets.name);
  const normCategory = normalizeSearchString(targets.category);
  const normBiz = normalizeSearchString(targets.businessName);
  const normServices = (targets.services || []).map(normalizeSearchString).join(' ');
  const normLoc = normalizeSearchString(targets.location);
  const cleanPhone = (targets.phoneDigits || '').replace(/\D/g, '');

  const hasWordOrPhrase = (fieldText: string, term: string): boolean => {
    if (!fieldText || !term) return false;
    if (fieldText === term) return true;
    if (term.includes(' ')) {
      return ` ${fieldText} `.includes(` ${term} `);
    }
    const words = fieldText.split(/\s+/);
    if (words.includes(term)) return true;
    if (term.length >= 4) {
      return words.some((w) => w.startsWith(term) || (w.length >= 4 && term.startsWith(w)));
    }
    return false;
  };

  let totalScore = 0;

  // 1. Exact full query phrase match
  if (hasWordOrPhrase(normName, normQuery)) totalScore += 120;
  if (hasWordOrPhrase(normBiz, normQuery)) totalScore += 90;
  if (hasWordOrPhrase(normCategory, normQuery)) totalScore += 80;
  if (hasWordOrPhrase(normServices, normQuery)) totalScore += 65;
  if (hasWordOrPhrase(normLoc, normQuery)) totalScore += 40;

  // Phone number match (query is at least 3 digits, e.g. 1122 or 0300)
  const queryDigits = normQuery.replace(/\D/g, '');
  if (queryDigits.length >= 3 && cleanPhone.includes(queryDigits)) {
    totalScore += 85;
  }

  // 2. Word-by-word scoring with synonym expansion
  let allWordsMatched = true;

  for (const word of queryWords) {
    const wordSynonyms = expandSynonyms(word);
    let wordMatched = false;

    for (const syn of wordSynonyms) {
      if (hasWordOrPhrase(normName, syn)) {
        totalScore += syn === word ? 40 : 25;
        wordMatched = true;
      }
      if (hasWordOrPhrase(normBiz, syn)) {
        totalScore += syn === word ? 35 : 20;
        wordMatched = true;
      }
      if (hasWordOrPhrase(normCategory, syn)) {
        totalScore += syn === word ? 30 : 18;
        wordMatched = true;
      }
      if (hasWordOrPhrase(normServices, syn)) {
        totalScore += syn === word ? 25 : 15;
        wordMatched = true;
      }
      if (hasWordOrPhrase(normLoc, syn)) {
        totalScore += syn === word ? 15 : 10;
        wordMatched = true;
      }
    }

    if (!wordMatched) {
      allWordsMatched = false;
    }
  }

  // Bonus when all query words have a match
  if (allWordsMatched && queryWords.length > 1) {
    totalScore += 50;
  }

  return totalScore;
}

// ================= 4. UNIVERSAL MULTI-ENTITY EVERYTHING-SEARCH =================

export interface UniversalSearchOptions {
  query: string;
  profiles: VillageProfile[];
  mosques?: VillageMosque[];
  institutes?: VillageInstitute[];
  transports?: VillageTransport[];
  hospitals?: VillageHospital[];
  newsEvents?: VillageNewsEvent[];
  announcements?: VillageAnnouncement[];
  mandiRates?: MandiRateItem[];
  shelters?: ShelterItem[];
  helpNotices?: PublicHelpNoticeSearchItem[];
  helpGuides?: HelpGuideItem[];
  customKeywords?: CustomSearchKeywordItem[];
  viewerIsSignedIn?: boolean;
  categoryFilter?: string; // 'all' or specific category
  minScoreThreshold?: number;
}

/**
 * Performs cross-entity search across the ENTIRE web portal:
 *  - Portal Actions & Sections (Admin Panel, Login, Password Reset, Register, AI School, Route Planner, Emergency, Privacy, Terms)
 *  - Profiles (Workers, Shops, Doctors, Technicians) — strictly sanitized (NEVER username, password, or email)
 *  - Mosques & Prayer Timings — strictly sanitized (NEVER username or password)
 *  - Educational Institutes & Timetables — strictly sanitized (NEVER username or password)
 *  - Public Transport & Jhang Routes
 *  - Hospitals & Emergency Medical Services
 *  - Village News & Banner Events
 *  - Official Village Announcements
 *  - Mandi & Crop Rates
 *  - Emergency & Flood Shelters
 *  - Public Community Help / Lost & Found / Blood Donation Notices
 *  - Step-by-Step How-To Help Guides
 *  - Admin Custom Search Keywords
 *
 * STRICT PRIVACY GUARANTEE:
 *  - Never searches or returns any user's username, password, passwordHash, email, or personal messages (VillageMessage).
 */
export function performUniversalSearch({
  query,
  profiles,
  mosques = [],
  institutes = [],
  transports = [],
  hospitals = [],
  newsEvents = [],
  announcements = [],
  mandiRates = initialMandiRates,
  shelters = initialShelters,
  helpNotices = [],
  helpGuides = initialHelpGuides,
  customKeywords = [],
  viewerIsSignedIn = false,
  categoryFilter = 'all',
  minScoreThreshold = 10,
}: UniversalSearchOptions): SearchResultItem[] {
  const normQuery = normalizeSearchString(query);
  if (!normQuery && categoryFilter === 'all') {
    return profiles
      .filter((p) => !p.isHidden && !p.isDisabled)
      .map((p) => {
        const safeP = sanitizePublicProfile(p);
        return {
          id: safeP.id,
          type: 'profile',
          title: safeP.name,
          subtitle: safeP.businessName,
          categoryLabelUrdu: safeP.customCategory || safeP.category,
          categoryLabelEn: safeP.category,
          contactNumber: safeP.mobile,
          location: safeP.address,
          score: 1,
          rawItem: safeP,
        };
      });
  }

  const results: SearchResultItem[] = [];

  // 0. Search Portal Features, Pages & Control Panels (e.g., Admin Panel, Login, Register, AI School, Route Planner)
  if (normQuery && categoryFilter === 'all') {
    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    PORTAL_FEATURES_INDEX.forEach((feat) => {
      const exactKeywordHit = feat.keywords.some((kw) => {
        const normKw = normalizeSearchString(kw);
        if (!normKw) return false;
        if (normKw.includes(' ')) {
          return normQuery.includes(normKw);
        }
        return queryWords.includes(normKw);
      });
      const baseScore = calculateMatchScore(
        {
          name: `${feat.titleUrdu} ${feat.titleEn}`,
          category: feat.badgeUrdu,
          businessName: feat.descriptionUrdu,
          services: feat.keywords,
          location: 'رتہ کلاں پورٹل',
          phoneDigits: feat.contactPhone || '',
        },
        normQuery
      );
      const score = exactKeywordHit ? Math.max(baseScore + 250, 320) : baseScore;

      if (exactKeywordHit || score >= Math.max(minScoreThreshold, 45)) {
        results.push({
          id: feat.id,
          type: 'portal_action',
          title: feat.titleUrdu,
          subtitle: feat.descriptionUrdu,
          categoryLabelUrdu: feat.badgeUrdu,
          categoryLabelEn: feat.titleEn,
          contactNumber: feat.contactPhone || '',
          location: 'رتہ کلاں ویب پورٹل',
          score,
          rawItem: feat,
        });
      }
    });
  }

  // 1. Search Profiles (strictly whitelisted public fields only — email, username, password excluded)
  profiles.forEach((p) => {
    if (p.isHidden || p.isDisabled) return;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) {
      return;
    }

    const safeP = sanitizePublicProfile(p);
    const score = normQuery
      ? calculateMatchScore(
          {
            name: `${safeP.name} ${safeP.fatherName || ''}`,
            category: `${safeP.category} ${safeP.customCategory || ''}`,
            businessName: `${safeP.businessName} ${safeP.chargesDescription || ''}`,
            services: [
              ...(safeP.services || []),
              safeP.openingTime || '',
              safeP.closingTime || '',
            ],
            location: `${safeP.address} ${safeP.locationLandmark || ''}`,
            phoneDigits: safeP.mobile,
          },
          normQuery
        )
      : 1;

    if (!normQuery || score >= minScoreThreshold) {
      results.push({
        id: safeP.id,
        type: 'profile',
        title: safeP.name,
        subtitle: safeP.businessName,
        categoryLabelUrdu: safeP.customCategory || safeP.category,
        categoryLabelEn: safeP.category,
        contactNumber: safeP.mobile,
        location: safeP.address,
        score,
        rawItem: safeP,
      });
    }
  });

  // If filtering for a specific profile category, return profile matches
  if (
    categoryFilter !== 'all' &&
    categoryFilter !== 'mosque' &&
    categoryFilter !== 'institute' &&
    categoryFilter !== 'hospital' &&
    categoryFilter !== 'transport'
  ) {
    return results.sort((a, b) => b.score - a.score);
  }

  // 2. Search Mosques
  if (categoryFilter === 'all' || categoryFilter === 'mosque') {
    mosques.forEach((m) => {
      if (m.isHidden) return;
      const safeM = sanitizePublicMosque(m);
      const contactNum = safeM.contact || safeM.contactNumber || '';
      const score = normQuery
        ? calculateMatchScore(
            {
              name: safeM.name,
              category: 'مسجد جامع مسجد نماز اوقات اذان جمعہ عید mosque masjid prayer namaz',
              businessName: `امام ${safeM.imamName || ''} مؤذن ${safeM.moazzinName || ''}`,
              services: [
                'پانچ وقت باجماعت نماز',
                'جمعہ مبارک',
                `فجر ${safeM.prayerTimes?.fajr || ''}`,
                `ظہر ${safeM.prayerTimes?.dhuhr || ''}`,
                `عصر ${safeM.prayerTimes?.asr || ''}`,
                `مغرب ${safeM.prayerTimes?.maghrib || ''}`,
                `عشاء ${safeM.prayerTimes?.isha || ''}`,
                `جمعہ ${safeM.prayerTimes?.jummah || ''}`,
              ],
              location: safeM.location,
              phoneDigits: contactNum,
            },
            normQuery
          )
        : 0;

      if (score >= minScoreThreshold) {
        results.push({
          id: safeM.id,
          type: 'mosque',
          title: safeM.name,
          subtitle: `امام: ${safeM.imamName || 'موجود نہیں'} | فجر: ${safeM.prayerTimes?.fajr || ''}`,
          categoryLabelUrdu: 'جامع مسجد',
          categoryLabelEn: 'Mosque',
          contactNumber: contactNum,
          location: safeM.location,
          score,
          rawItem: safeM,
        });
      }
    });
  }

  // 3. Search Institutes (Schools & Colleges)
  if (categoryFilter === 'all' || categoryFilter === 'institute') {
    institutes.forEach((inst) => {
      if (inst.isHidden) return;
      const safeInst = sanitizePublicInstitute(inst);
      const contactNum = safeInst.contact || safeInst.contactNumber || '';
      const score = normQuery
        ? calculateMatchScore(
            {
              name: safeInst.name,
              category: `تعلیمی ادارہ سکول کالج مدرسہ تعلیم school college education ${safeInst.type}`,
              businessName: `سربراہ ہیڈ ماسٹر پرنسپل ${safeInst.headName}`,
              services: [
                safeInst.classesOffered,
                safeInst.timing,
                ...(safeInst.timetableSchedule?.map((t) => `${t.teacher || ''} ${t.subject}`) || []),
              ],
              location: safeInst.location,
              phoneDigits: contactNum,
            },
            normQuery
          )
        : 0;

      if (score >= minScoreThreshold) {
        results.push({
          id: safeInst.id,
          type: 'institute',
          title: safeInst.name,
          subtitle: `کلاسیں: ${safeInst.classesOffered} | وقت: ${safeInst.timing}`,
          categoryLabelUrdu: safeInst.type === 'school' ? 'گورنمنٹ / پرائیویٹ سکول' : 'کالج / اکیڈمی',
          categoryLabelEn: 'Educational Institute',
          contactNumber: contactNum,
          location: safeInst.location,
          score,
          rawItem: safeInst,
        });
      }
    });
  }

  // 4. Search Transports (Buses & Hiaces to Jhang)
  if (categoryFilter === 'all' || categoryFilter === 'transport') {
    transports.forEach((v) => {
      if (v.isHidden) return;
      const safeV = sanitizePublicTransport(v);
      const score = normQuery
        ? calculateMatchScore(
            {
              name: safeV.title,
              category: `گاڑی پبلک ٹرانسپورٹ اڈا سواری وین بس رکشہ ${safeV.vehicleType} transport bus hiace van`,
              businessName: `ڈرائیور ${safeV.driverName} روٹ ${safeV.route} نمبر ${safeV.vehicleNumber}`,
              services: [
                `روانگی ${safeV.departureTime}`,
                `واپسی ${safeV.arrivalTime}`,
                `کرایہ ${safeV.fare}`,
                safeV.route,
              ],
              location: 'رتہ کلاں اڈا تا جھنگ',
              phoneDigits: safeV.driverMobile || '',
            },
            normQuery
          )
        : 0;

      if (score >= minScoreThreshold) {
        results.push({
          id: safeV.id,
          type: 'transport',
          title: safeV.title,
          subtitle: `روٹ: ${safeV.route} | کرایہ: ${safeV.fare}`,
          categoryLabelUrdu: 'پبلک ٹرانسپورٹ',
          categoryLabelEn: 'Transport',
          contactNumber: safeV.driverMobile,
          location: 'رتہ کلاں اڈا',
          score,
          rawItem: safeV,
        });
      }
    });
  }

  // 5. Search Hospitals & Emergency Medical
  if (categoryFilter === 'all' || categoryFilter === 'hospital') {
    hospitals.forEach((hosp) => {
      if (hosp.isHidden) return;
      const safeH = sanitizePublicHospital(hosp);
      const contactNum = safeH.contact || safeH.contactPhone || safeH.emergencyPhone || '';
      const facilitiesList = safeH.services || safeH.facilities || [safeH.timing];
      const score = normQuery
        ? calculateMatchScore(
            {
              name: safeH.name,
              category: `ہسپتال کلینک ڈاکٹر میڈیکل ایمرجنسی 1122 hospital emergency doctor ${safeH.categoryUrdu}`,
              businessName: safeH.categoryUrdu,
              services: facilitiesList,
              location: `${safeH.address} ${safeH.distance}`,
              phoneDigits: contactNum,
            },
            normQuery
          )
        : 0;

      if (score >= minScoreThreshold) {
        results.push({
          id: safeH.id,
          type: 'hospital',
          title: safeH.name,
          subtitle: `${safeH.categoryUrdu} | فاصلہ: ${safeH.distance}`,
          categoryLabelUrdu: 'طبی سہولت و ہسپتال',
          categoryLabelEn: 'Hospital & Health',
          contactNumber: contactNum || '1122',
          location: safeH.address,
          score,
          rawItem: safeH,
        });
      }
    });
  }

  // 6. Search Village News & Events, Announcements, Mandi Rates, Shelters, Help Notices, Help Guides & Custom Keywords
  if (normQuery && categoryFilter === 'all') {
    // 6a. Village News Events
    newsEvents.forEach((ev) => {
      if (ev.isHidden) return;
      const score = calculateMatchScore(
        {
          name: ev.title,
          category: `خبر خبریں اعلان واقعہ تقریب news event announcement ${ev.category}`,
          businessName: ev.content,
          services: [ev.date, ev.location],
          location: ev.location || 'رتہ کلاں',
          phoneDigits: '',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: ev.id,
          type: 'news',
          title: ev.title,
          subtitle: `${ev.date} — ${ev.content}`,
          categoryLabelUrdu: 'گاؤں کی خبر / اعلان',
          categoryLabelEn: 'Village News',
          contactNumber: '',
          location: ev.location || 'رتہ کلاں',
          score,
          rawItem: ev,
        });
      }
    });

    // 6b. Official Village Announcements
    announcements.forEach((ann) => {
      if (ann.isHidden) return;
      const score = calculateMatchScore(
        {
          name: ann.title,
          category: 'اعلان خبر ہنگامی اطلاع announcement alert',
          businessName: ann.content,
          services: [ann.date],
          location: 'رتہ کلاں',
          phoneDigits: '',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: ann.id,
          type: 'announcement',
          title: ann.title,
          subtitle: `${ann.date} — ${ann.content}`,
          categoryLabelUrdu: 'کمیونٹی اعلان',
          categoryLabelEn: 'Announcement',
          contactNumber: '',
          location: 'رتہ کلاں',
          score,
          rawItem: ann,
        });
      }
    });

    // 6c. Mandi & Crop Rates
    mandiRates.forEach((rate) => {
      if (rate.isHidden) return;
      const score = calculateMatchScore(
        {
          name: `${rate.cropNameUrdu} ${rate.cropNameEn}`,
          category: 'منڈی ریٹ غلہ منڈی فصل زرعی اجناس ریٹ mandi rate crop price',
          businessName: `${rate.rateText} ${rate.marketName}`,
          services: [rate.cropNameUrdu, rate.cropNameEn, rate.rateText, rate.marketName],
          location: rate.marketName,
          phoneDigits: '',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: rate.id,
          type: 'mandi_rate',
          title: `${rate.cropNameUrdu} (${rate.cropNameEn})`,
          subtitle: `ریٹ: ${rate.rateText}`,
          categoryLabelUrdu: 'غلہ منڈی ریٹ',
          categoryLabelEn: 'Mandi Rate',
          contactNumber: '',
          location: rate.marketName,
          score,
          rawItem: rate,
        });
      }
    });

    // 6d. Emergency & Flood Shelters
    shelters.forEach((sh) => {
      if (sh.isHidden) return;
      const score = calculateMatchScore(
        {
          name: sh.name,
          category: 'ہنگامی پناہ گاہ شیلٹر سیلاب طوفان ایمرجنسی shelter flood emergency',
          businessName: `${sh.capacityText} ${sh.contactPerson}`,
          services: [sh.location, sh.capacityText, sh.contactPerson],
          location: sh.location,
          phoneDigits: sh.contactPhone || '1122',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: sh.id,
          type: 'shelter',
          title: sh.name,
          subtitle: `${sh.capacityText} | انچارج: ${sh.contactPerson}`,
          categoryLabelUrdu: 'ہنگامی پناہ گاہ / شیلٹر',
          categoryLabelEn: 'Emergency Shelter',
          contactNumber: sh.contactPhone || '1122',
          location: sh.location,
          score,
          rawItem: sh,
        });
      }
    });

    // 6e. Public Community Help / Lost & Found / Blood Notices (Blood donor phone only if signed in or general public notice)
    helpNotices.forEach((hn) => {
      if (hn.type === 'blood' && !viewerIsSignedIn) return;
      const score = calculateMatchScore(
        {
          name: hn.title,
          category: `امداد مدد گمشدہ خون عطیہ نوٹس بورڈ help notice lost blood ${hn.type}`,
          businessName: `${hn.details} ${hn.contactName}`,
          services: [hn.title, hn.details, hn.location],
          location: hn.location,
          phoneDigits: hn.contactMobile || '',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: hn.id,
          type: 'help_notice',
          title: hn.title,
          subtitle: `${hn.details} (رابطہ: ${hn.contactName})`,
          categoryLabelUrdu: hn.type === 'blood' ? 'عطیہ خون اپیل' : 'کمیونٹی امداد / گمشدہ',
          categoryLabelEn: 'Community Help Notice',
          contactNumber: hn.contactMobile || '',
          location: hn.location,
          score,
          rawItem: hn,
        });
      }
    });

    // 6f. Step-by-Step How-To Help Guides
    helpGuides.forEach((guide) => {
      if (guide.isHidden) return;
      const score = calculateMatchScore(
        {
          name: guide.questionUrdu,
          category: 'رہنمائی طریقہ مدد گائیڈ کیسے کریں how to guide help',
          businessName: guide.stepsUrdu.join(' '),
          services: [guide.buttonToTap, ...(guide.keywords || [])],
          location: `بٹن: ${guide.buttonToTap}`,
          phoneDigits: '',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: guide.id,
          type: 'help_guide',
          title: guide.questionUrdu,
          subtitle: guide.stepsUrdu.join(' '),
          categoryLabelUrdu: 'پورٹل رہنمائی (طریقہ کار)',
          categoryLabelEn: 'How-To Guide',
          contactNumber: '',
          location: `بٹن دبائیں: ${guide.buttonToTap}`,
          score,
          rawItem: guide,
        });
      }
    });

    // 6g. Admin Custom Search Keywords
    customKeywords.forEach((ck) => {
      const score = calculateMatchScore(
        {
          name: ck.categoryNameUrdu,
          category: ck.categoryKey,
          businessName: ck.keywords.join(' '),
          services: ck.keywords,
          location: 'رتہ کلاں',
          phoneDigits: '',
        },
        normQuery
      );
      if (score >= minScoreThreshold) {
        results.push({
          id: ck.id,
          type: 'custom_keyword',
          title: ck.categoryNameUrdu,
          subtitle: `متعلقہ الفاظ: ${ck.keywords.join('، ')}`,
          categoryLabelUrdu: `کیٹیگری: ${ck.categoryKey}`,
          categoryLabelEn: 'Custom Keyword',
          contactNumber: '',
          location: 'رتہ کلاں پورٹل',
          score,
          rawItem: ck,
        });
      }
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

