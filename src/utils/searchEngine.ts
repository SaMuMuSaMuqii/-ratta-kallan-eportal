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
    .replace(/[\u06D4\u060C\u061F?,!.;:'"()[\]{}]/g, ' ') // Urdu & ASCII punctuation
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
    'مستری', 'میستری', 'راج', 'مزدور', 'راج مزدور', 'تعمیر', 'مکان', 'پلستر', 'دیوار', 'بنیاد',
    'mistri', 'raj', 'mazdoor', 'majdoor', 'mason', 'construction', 'builder', 'bricklayer'
  ],
  // Electrician / Wiring / Solar
  [
    'الیکٹریشن', 'بجلی', 'بیجلی', 'بجلی والا', 'تار', 'وائرنگ', 'سولر', 'موٹر', 'پنکھا', 'یو پی ایس', 'بیٹری', 'سولر پلیٹ',
    'electrician', 'bijli', 'solar', 'wiring', 'motor', 'fan', 'ups', 'battery', 'inverter'
  ],
  // Doctor / Clinic / Hospital / Pharmacy
  [
    'ڈاکٹر', 'ڈاکدار', 'طبیب', 'کلینک', 'ہسپتال', 'اسپتال', 'دوا', 'دوائی', 'میڈیکل', 'علاج', 'شفا', 'ایمرجنسی', 'ریسکیو', '1122',
    'doctor', 'daktar', 'clinic', 'hospital', 'medical', 'medicine', 'dawa', 'dawakhana', 'cure', 'emergency', '1122', 'ambulance'
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
    'کریانہ', 'جنرل سٹور', 'سودا', 'سودا سلف', 'راشن', 'دکان', 'پرچون', 'گھی', 'چینی', 'پتی', 'صابن',
    'karyana', 'grocery', 'general store', 'store', 'kiryana', 'kirana', 'shop', 'parchoon', 'rashan', 'ration'
  ],
  // Plumber / Sanitary / Pipes
  [
    'پلمبر', 'سینیٹری', 'پائپ', 'ٹونٹی', 'بورنگ', 'واش روم', 'پانی کا پائپ', 'نلکا', 'نلکے',
    'plumber', 'sanitary', 'pipe', 'boring', 'water pipe', 'tap'
  ],
  // Mechanic / Motorcycle / Puncture
  [
    'مکینک', 'موٹر سائیکل', 'بائیک', 'پنکچر', 'پنچر', 'پرزے', 'سروس سٹیشن', 'انجن', 'ٹیوننگ',
    'mechanic', 'motorcycle', 'bike', 'puncture', 'tyre', 'tire', 'tuning'
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
  // Halwai / Sweets / Bakery / Catering
  [
    'حلوائی', 'مٹھائی', 'پکوان', 'دیگ', 'بریانی', 'بیکری', 'کیک', 'سموسہ', 'پکوڑا',
    'halwai', 'mithai', 'sweets', 'bakery', 'pakwan', 'catering', 'degh'
  ],
  // Seed / Fertilizer / Spray / Agro Store
  [
    'سپرے', 'کھاد', 'بیج', 'زرعی ادویات', 'پیسٹی سائیڈ', 'کھاد بیج',
    'spray', 'khad', 'beej', 'seed', 'seeds', 'pesticide', 'agro'
  ],
  // Computer / NADRA / Online Services
  [
    'کمپیوٹر', 'نادرا', 'فوٹو کاپی', 'پرنٹنگ', 'بے فارم', 'احساس پروگرام', 'بے نظیر', 'آن لائن',
    'computer', 'nadra', 'photocopy', 'printing', 'online', 'bisp', 'ehsaas'
  ],
];

/**
 * Bilingual name & shop title transliterations (Roman Urdu <-> Urdu script)
 * Used to match Roman Urdu searches for specific people/places without treating names as generic categories.
 */
export const NAME_TRANSLITERATION_CLUSTERS: string[][] = [
  ['ثمر', 'samar', 'sammar'],
  ['سعید', 'saeed', 'said'],
  ['ارشد', 'ارشاد', 'arshad', 'irshad'],
  ['ستار', 'عبدالستار', 'sattar', 'abdul sattar', 'abdulsattar'],
  ['اصغر', 'asghar', 'asgar'],
  ['طارق', 'tariq', 'tarik'],
  ['محمود', 'mahmood', 'mehmood', 'mahmud'],
  ['غلام', 'ghulam', 'gulam'],
  ['رسول', 'rasool', 'rasul'],
  ['ساجد', 'sajid', 'saajid'],
  ['نوید', 'naveed', 'navid'],
  ['بشیر', 'bashir', 'basheer'],
  ['اللہ دتہ', 'دتہ', 'allah ditta', 'allahditta', 'ditta'],
  ['رضوان', 'rizwan'],
  ['اسلم', 'aslam'],
  ['نعیم', 'naeem', 'naim'],
  ['عرفان', 'irfan', 'erfan'],
  ['فضل', 'fazal', 'fazl'],
  ['فیاض', 'fayyaz', 'fiaz'],
  ['اکرم', 'akram'],
  ['شبیر', 'shabbir', 'shabir'],
  ['ندیم', 'nadeem', 'nadim'],
  ['عاطف', 'atif', 'aatif'],
  ['یاسر', 'yasir', 'yasser'],
  ['بلقیس', 'bilqees', 'bilqis'],
  ['غفور', 'عبدالغفور', 'ghafoor', 'abdul ghafoor'],
  ['توصیف', 'tauseef', 'toseef'],
  ['وقاص', 'waqas', 'waqqas'],
  ['اشرف', 'ashraf'],
  ['شفیق', 'shafiq', 'shafique'],
  ['رمضان', 'ramzan', 'ramazan'],
  ['یوسف', 'yousaf', 'yousuf', 'yusuf'],
  ['شکور', 'عبدالشکور', 'shakoor', 'shakur'],
  ['نذیر', 'nazir', 'nazeer'],
  ['طاہرہ', 'tahira'],
  ['مظہر', 'mazhar'],
  ['بلال', 'bilal'],
  ['خالد', 'khalid'],
  ['زاہد', 'zahid'],
  ['شاہد', 'shahid'],
  ['راشد', 'rashid'],
  ['ناصر', 'nasir', 'nasser'],
  ['کاشف', 'kashif'],
  ['فرحان', 'farhan'],
  ['عمران', 'imran', 'emran'],
  ['کامران', 'kamran'],
  ['عدنان', 'adnan'],
  ['سلمان', 'salman'],
  ['عثمان', 'usman', 'osman'],
  ['حمزہ', 'hamza'],
  ['احمد', 'ahmad', 'ahmed'],
  ['محمد', 'muhammad', 'mohammad', 'mohammed', 'md'],
  ['علی', 'ali'],
  ['حسن', 'hassan', 'hasan'],
  ['حسین', 'hussain', 'husain', 'hussein'],
  ['شہباز', 'shahbaz', 'shehbaz', 'shabaz'],
  ['اعجاز', 'ijaz', 'ejaz', 'aijaz'],
  ['مشتاق', 'mushtaq', 'mustaq'],
  ['اختر', 'akhtar', 'akhter', 'aktar'],
  ['سلیم', 'saleem', 'salim'],
  ['ریاض', 'riaz', 'reyaz'],
  ['ظفر', 'zafar', 'zaffar'],
  ['اقبال', 'iqbal'],
  ['مختار', 'mukhtar', 'mukhtiar'],
  ['نواز', 'حق نواز', 'nawaz', 'haq nawaz', 'haqnawaz'],
  ['بوٹا', 'boota', 'buta'],
  ['صادق', 'sadiq', 'saddiq'],
  ['چراغ', 'chiragh', 'charagh'],
  ['فتح', 'fateh', 'fatah'],
  ['شیر', 'sher', 'shair'],
  ['عنایت', 'inayat', 'enayat'],
  ['سراج', 'siraj'],
  ['اللہ یار', 'یار', 'allah yar', 'allahyar', 'yar'],
  ['دین', 'din', 'deen'],
  ['خان', 'khan'],
  ['چوہدری', 'chaudhry', 'choudhry', 'chaudhary', 'ch'],
  ['ملک', 'malik'],
  ['میاں', 'mian', 'miyan'],
  ['حاجی', 'haji', 'haaji'],
  ['مہر', 'mahr', 'mehar', 'mehr'],
  ['حکیم', 'hakeem', 'hakim'],
  ['رانا', 'rana'],
  ['نول', 'nol', 'noul', 'nawal'],
  ['سیال', 'sial', 'syal'],
  ['چدھڑ', 'chadhar', 'chaddar', 'chadher'],
  ['بھٹی', 'bhatti', 'bhati'],
  ['راجپوت', 'rajput', 'rajpoot'],
  ['قریشی', 'qureshi', 'qurashi'],
  ['جٹ', 'jutt', 'jat'],
  ['کمہار', 'kumhar'],
  ['لوہار', 'lohar', 'luhar'],
  ['گجر', 'gujjar', 'gujar'],
  ['رفیق', 'rafiq', 'rafique'],
  ['الشفا', 'الشفاء', 'alshifa', 'al shifa', 'shifa'],
  ['العزیز', 'alaziz', 'al aziz', 'aziz'],
  ['القلم', 'alqalam', 'al qalam', 'qalam'],
  ['مدینہ', 'madina', 'medina'],
  ['قباء', 'quba'],
  ['مرکزی', 'markazi'],
  ['دارالسلام', 'darussalam'],
  ['غازی', 'ghazi'],
];

/**
 * Converts an Urdu or English/Roman word into a canonical phonetic consonant skeleton
 * so spelling variations and Urdu <-> English transliterations of any person's name match reliably.
 */
export function toPhoneticSkeleton(rawWord: string): string {
  const norm = normalizeSearchString(rawWord);
  if (!norm) return '';

  // Check if Urdu script
  if (/[\u0600-\u06FF]/.test(norm)) {
    const urduMap: Record<string, string> = {
      'ب': 'b',
      'پ': 'p',
      'ت': 't',
      'ٹ': 't',
      'ث': 's',
      'ج': 'j',
      'چ': 'ch',
      'ح': 'h',
      'خ': 'kh',
      'د': 'd',
      'ڈ': 'd',
      'ذ': 'z',
      'ر': 'r',
      'ڑ': 'r',
      'ز': 'z',
      'ژ': 'sh',
      'س': 's',
      'ش': 'sh',
      'ص': 's',
      'ض': 'z',
      'ط': 't',
      'ظ': 'z',
      'ع': '',
      'غ': 'g',
      'ف': 'f',
      'ق': 'k',
      'ک': 'k',
      'گ': 'g',
      'ل': 'l',
      'م': 'm',
      'ن': 'n',
      'ں': 'n',
      'و': 'w',
      'ہ': 'h',
      'ی': 'y',
      'ا': '',
      'ء': '',
    };
    let out = '';
    for (let i = 0; i < norm.length; i++) {
      const ch = norm[i];
      if (ch === 'و' && i > 0) {
        // In Urdu names, non-initial و is often a long vowel (o/oo/u) except in words like نواز/نوید/نول
        out += 'w';
        continue;
      }
      if (ch === 'ی' && i > 0) {
        // Non-initial ی is usually long vowel (ee/i/ay)
        continue;
      }
      if (ch === 'ہ' && i === norm.length - 1) {
        // Trailing ہ in Urdu functions as final 'a'/'ah' vowel
        continue;
      }
      out += urduMap[ch] !== undefined ? urduMap[ch] : '';
    }
    return out
      .replace(/bh/g, 'b')
      .replace(/ph/g, 'f')
      .replace(/th/g, 't')
      .replace(/dh/g, 'd')
      .replace(/rh/g, 'r')
      .replace(/gh/g, 'g')
      .replace(/h+/g, 'h')
      .replace(/w/g, '');
  }

  // Latin / English / Roman Urdu phonetic skeleton
  // Collapse doubled letters (e.g. sammar -> samar, waqqas -> waqas) BEFORE stripping vowels
  // so consonants separated by vowels (e.g. adnan -> dnn, عدنان -> dnn) preserve both consonants.
  let lat = norm
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1')
    .replace(/ph/g, 'f')
    .replace(/kh/g, 'K')
    .replace(/sh/g, 'S')
    .replace(/ch/g, 'C')
    .replace(/gh/g, 'g')
    .replace(/bh/g, 'b')
    .replace(/dh/g, 'd')
    .replace(/th/g, 't')
    .replace(/rh/g, 'r')
    .replace(/zh/g, 'S')
    .replace(/q/g, 'k')
    .replace(/c/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/v/g, 'w');

  // Keep initial 'y' if word starts with y, strip vowels and trailing h/w
  const startsWithY = lat.startsWith('y');
  lat = lat
    .replace(/h$/g, '')
    .replace(/[aeiouyw]/g, '')
    .replace(/K/g, 'kh')
    .replace(/S/g, 'sh')
    .replace(/C/g, 'ch');

  if (startsWithY && !lat.startsWith('y')) {
    lat = 'y' + lat;
  }

  return lat;
}

/**
 * Checks whether two name tokens (across Urdu and English/Roman or spelling variations)
 * are phonetically or lexically equivalent.
 */
export function areNamesPhoneticallyEquivalent(wordA: string, wordB: string): boolean {
  const normA = normalizeSearchString(wordA);
  const normB = normalizeSearchString(wordB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Check explicit transliteration clusters first
  for (const cluster of NAME_TRANSLITERATION_CLUSTERS) {
    const normCluster = cluster.map(normalizeSearchString);
    const hasA = normCluster.includes(normA) || normCluster.some((c) => c.split(/\s+/).includes(normA));
    const hasB = normCluster.includes(normB) || normCluster.some((c) => c.split(/\s+/).includes(normB));
    if (hasA && hasB) return true;
  }

  if (normA.length < 3 || normB.length < 3) return false;
  const skelA = toPhoneticSkeleton(normA);
  const skelB = toPhoneticSkeleton(normB);
  if (skelA.length >= 2 && skelA === skelB) {
    return true;
  }
  // Also compare without 'h' for unaspirated/aspirated variations (e.g. shehbaz / shabaz, mahmood / mamood)
  const skelNoHA = skelA.replace(/h/g, '');
  const skelNoHB = skelB.replace(/h/g, '');
  if (skelNoHA.length >= 2 && skelNoHA === skelNoHB) {
    return true;
  }
  return false;
}

/**
 * Conversational, location, and question stop-words that should not be treated
 * as specific person/shop names when checking relevance.
 */
const GENERIC_QUERY_STOP_WORDS_RAW: string[] = [
  'رتہ', 'کلاں', 'جھنگ', 'گاؤں', 'گاوں', 'پنڈ', 'محلہ', 'بازار', 'مین', 'روڈ', 'چوک', 'اڈا', 'اڈے', 'گلی', 'نزد', 'پاس', 'قریب', 'شرقی', 'غربی',
  'کا', 'کی', 'کے', 'کو', 'میں', 'پر', 'سے', 'تک', 'تا', 'اور', 'یا', 'و', 'ہے', 'ہیں', 'تھا', 'ہو', 'گا', 'گی', 'گے',
  'والا', 'والے', 'والی', 'کون', 'سا', 'سی', 'کیا', 'کہاں', 'کب', 'کتنے', 'کتنا', 'کتنی', 'کیسے', 'کس', 'کوئی', 'سب', 'تمام', 'سارے', 'لسٹ', 'فہرست',
  'فون', 'نمبر', 'موبائل', 'رابطہ', 'کال', 'واٹس', 'ایپ', 'پتہ', 'ایڈریس', 'لوکیشن', 'جگہ',
  'ٹائم', 'وقت', 'اوقات', 'بجے', 'صبح', 'دوپہر', 'شام', 'رات', 'آج', 'ابھی', 'کل', 'روزانہ', 'گھنٹے',
  'کھلا', 'کھلتا', 'کھلتی', 'کھلی', 'کھولنے', 'بند', 'وقفہ', 'بریک', 'موجود', 'دستیاب', 'حاضر', 'فری', 'فوری', 'تازہ',
  'بتائیں', 'بتاؤ', 'بتادیں', 'دیں', 'دو', 'چاہیے', 'درکار', 'تلاش', 'کریں', 'کیجیے', 'پوچھیں', 'سنیں', 'دکھائیں',
  'بھائی', 'صاحب', 'استاد', 'کاریگر', 'ماسٹر', 'حاجی', 'چوہدری', 'ملک', 'میاں', 'قاری', 'حافظ', 'مولانا', 'مولوی', 'سر', 'باجی', 'میڈم', 'مہر', 'حکیم', 'رانا',
  'ولد', 'ولدیت', 'والد', 'باپ', 'ابو', 'بیٹا', 'خاندان', 'فیملی', 'ذات', 'قوم', 'برادری', 'شجرہ', 'گھر',
  'دکان', 'سٹور', 'اسٹور', 'شاپ', 'سنٹر', 'سینٹر', 'ورکس', 'ورکشاپ', 'سروس', 'سروسز', 'پوائنٹ', 'فارم', 'ہوم', 'ڈیرہ', 'یونین', 'کمیٹی',
  'کام', 'کرنے', 'کروانا', 'کروانے', 'چلانے', 'چلانا', 'لگانے', 'لگانا', 'مرمت', 'فٹنگ', 'ٹھیک', 'خراب', 'ریٹ', 'ریٹس', 'فیس', 'چارجز', 'قیمت', 'کرایہ', 'دیہاڑی', 'معاوضہ',
  'نیا', 'نئی', 'پرانا', 'پرانی', 'بڑا', 'بڑی', 'چھوٹا', 'اچھا', 'بہترین', 'اصلی', 'خالص', 'سرکاری', 'پرائیویٹ', 'مقامی', 'لوکل',
  'طریقہ', 'معلومات', 'تفصیل', 'تفصیلات', 'نام', 'پروفائل', 'کارڈ', 'شامل', 'بنانے', 'لکھوانے', 'جانے', 'آنے', 'آخری', 'پہلی',
  'دی', 'دے', 'دا', 'وچ', 'توں', 'نوں', 'لئی', 'واسطے', 'آدمی', 'بندہ', 'ہنر', 'مند',
  'کتھے', 'کیتھے', 'کیتھی', 'کتھے', 'اے', 'ھی', 'ہن', 'دسو', 'لبھو', 'کدھر', 'کیہڑا', 'کیڑا', 'پیںڈ',
  'ratta', 'kallan', 'jhang', 'village', 'pind', 'mohalla', 'bazaar', 'main', 'road', 'chowk', 'adda', 'near',
  'ka', 'ki', 'ke', 'ko', 'mein', 'me', 'par', 'pe', 'se', 'tak', 'aur', 'ya', 'hai', 'hain', 'ho', 'tha',
  'da', 'di', 'de', 'nu', 'vich', 'ton', 'daso', 'dasso', 'kithe', 'kithay', 'ethe', 'othe',
  'wala', 'wale', 'wali', 'kon', 'kaun', 'kya', 'kia', 'kahan', 'kidhar', 'kab', 'kitna', 'kitne', 'kaise', 'kis', 'koi', 'sab', 'all', 'list',
  'phone', 'number', 'no', 'mobile', 'contact', 'call', 'cell', 'whatsapp', 'address', 'pata', 'location', 'place', 'house', 'home',
  'father', 'fathers', 'son', 'vald', 'walid', 'family', 'parent', 'parents', 'parentage', 'caste', 'biradri',
  'time', 'timing', 'timings', 'hours', 'open', 'opening', 'close', 'closing', 'closed', 'break', 'available', 'availability', 'schedule', 'free', 'today', 'now',
  'batayein', 'batao', 'dein', 'do', 'chahiye', 'need', 'want', 'find', 'search', 'tell', 'show', 'give', 'please', 'about',
  'bhai', 'sahib', 'ustad', 'master', 'haji', 'chaudhry', 'choudhry', 'chaudhary', 'malik', 'mian', 'qari', 'hafiz', 'maulana', 'sir', 'mahr', 'mehar', 'hakeem', 'hakim', 'rana',
  'dukan', 'shop', 'store', 'center', 'centre', 'works', 'workshop', 'service', 'services', 'point', 'farm',
  'kaam', 'work', 'repair', 'rate', 'rates', 'price', 'fee', 'fees', 'charges', 'fare', 'kiraya', 'wage',
  'new', 'old', 'big', 'good', 'best', 'govt', 'government', 'private', 'local', 'info', 'information', 'detail', 'details', 'name', 'profile',
  'the', 'in', 'of', 'for', 'to', 'is', 'are', 'at', 'on', 'from', 'with', 'and', 'or', 'who', 'where', 'when', 'what', 'how', 'his', 'her', 'their'
];

const GENERIC_QUERY_STOP_WORDS = new Set<string>(
  GENERIC_QUERY_STOP_WORDS_RAW.map(normalizeSearchString).filter(Boolean)
);

/**
 * Honorific titles commonly used in Pakistani village person names.
 */
const PERSON_HONORIFIC_TITLES_RAW: string[] = [
  'استاد', 'ماسٹر', 'حاجی', 'چوہدری', 'ملک', 'میاں', 'مہر', 'حکیم', 'رانا', 'ڈاکٹر', 'قاری', 'حافظ', 'مولانا', 'سر',
  'ustad', 'master', 'haji', 'chaudhry', 'choudhry', 'chaudhary', 'ch', 'malik', 'mian', 'mahr', 'mehar', 'mehr', 'hakeem', 'hakim', 'rana', 'doctor', 'dr', 'qari', 'hafiz', 'maulana', 'sir',
];

const PERSON_HONORIFIC_TITLES = new Set<string>(
  PERSON_HONORIFIC_TITLES_RAW.map(normalizeSearchString).filter(Boolean)
);

/**
 * Checks if a query explicitly asks about a school, college, madrasa, or educational institute.
 * Keeps general school searches strictly separate from people-profile searches.
 */
export function isExplicitSchoolQuery(rawQuery: string): boolean {
  const norm = normalizeSearchString(rawQuery);
  if (!norm) return false;
  const schoolExplicitTerms = [
    'سکول', 'اسکول', 'کالج', 'مدرسہ', 'تعلیم', 'تعلیمی', 'پڑھائی', 'داخلہ', 'کلاس', 'جماعت', 'ٹائم ٹیبل', 'پیریڈ', 'پرنسپل', 'ہیڈ ماسٹر', 'ہیڈ مسٹریس', 'القلم',
    'school', 'schools', 'college', 'madrasa', 'education', 'educational', 'institute', 'academy', 'admission', 'timetable', 'headmaster', 'principal',
  ].map(normalizeSearchString);

  const queryWords = norm.split(/\s+/).filter(Boolean);
  return schoolExplicitTerms.some((term) => {
    if (!term) return false;
    if (term.includes(' ')) return norm.includes(term);
    return queryWords.includes(term);
  });
}

/**
 * Checks if a query explicitly asks about non-profile village entities
 * (mosques/prayers, public transport to Jhang, hospitals/1122/shelters, mandi rates, news/announcements, how-to guides, or portal control panels).
 */
export function isExplicitNonProfileEntityQuery(rawQuery: string): boolean {
  const norm = normalizeSearchString(rawQuery);
  if (!norm) return false;
  if (isExplicitSchoolQuery(norm)) return true;

  const nonProfileTerms = [
    // Mosque / Prayer
    'مسجد', 'جامع مسجد', 'نماز', 'اذان', 'جمعہ', 'فجر', 'ظہر', 'عصر', 'مغرب', 'عشاء', 'مسیت', 'مولانا عبدالغفور',
    'mosque', 'masjid', 'namaz', 'prayer', 'azan', 'jummah',
    // Public Transport
    'وین', 'ویگن', 'ہائی ایس', 'بس', 'گاڑی', 'گڈی', 'لاری اڈا', 'جھنگ کی وین',
    'hiace', 'wagon', 'bus', 'transport', 'van',
    // Hospital / Emergency / Shelter / Flood
    'ہسپتال', 'اسپتال', 'بی ایچ یو', 'ڈسپنسری', 'مرکز صحت', 'ایمرجنسی', 'ایمبولینس', '1122', 'پناہ گاہ', 'شیلٹر', 'سیلاب',
    'hospital', 'bhu', 'dispensary', 'emergency', 'ambulance', 'shelter', 'flood',
    // Mandi / Crops
    'منڈی', 'غلہ منڈی', 'منڈی ریٹ', 'گندم کا ریٹ', 'کپاس', 'چاول', 'کھاد کا ریٹ',
    'mandi', 'crop rate', 'wheat rate',
    // News / Help Notice / How-To / Policy / Admin
    'خبر', 'خبریں', 'اعلان', 'اعلانات', 'کیمپ', 'گمشدہ', 'عطیہ خون', 'بلڈ ڈونر', 'پرائیویسی', 'شرائط', 'ایڈمن', 'پاس ورڈ', 'لاگ ان', 'رجسٹریشن',
    'news', 'announcement', 'lost', 'blood', 'privacy', 'terms', 'admin', 'login', 'password', 'register', '#admin',
  ].map(normalizeSearchString);

  const queryWords = norm.split(/\s+/).filter(Boolean);
  return nonProfileTerms.some((term) => {
    if (!term) return false;
    if (term.includes(' ')) return norm.includes(term);
    return queryWords.includes(term);
  });
}

export type PeopleRequestedField =
  | 'phone'
  | 'whatsapp'
  | 'address'
  | 'family'
  | 'charges'
  | 'timing'
  | 'services'
  | 'profile';

export interface PeopleSearchAnalysis {
  isPeopleQuery: boolean;
  requestedFields: PeopleRequestedField[];
  primaryField: PeopleRequestedField;
  nameTokens: string[];
  honorificTokens: string[];
  categoryTokens: string[];
  isEnglishQuery: boolean;
}

export interface PeopleDatabaseSearchResult {
  status: 'exact' | 'multiple' | 'not_found' | 'not_people_query';
  matchedProfiles: VillageProfile[];
  analysis: PeopleSearchAnalysis;
}

/**
 * Analyzes a user query to determine what person and what specific information
 * (phone number, WhatsApp, address, family/father's name, charges, timing, services, or full profile)
 * is being requested.
 */
export function analyzePeopleQuery(rawQuery: string): PeopleSearchAnalysis {
  const norm = normalizeSearchString(rawQuery);
  const isEnglishQuery = /[a-zA-Z]{2,}/.test(rawQuery) && !/[\u0600-\u06FF]/.test(rawQuery);

  if (!norm || isExplicitNonProfileEntityQuery(rawQuery)) {
    return {
      isPeopleQuery: false,
      requestedFields: ['profile'],
      primaryField: 'profile',
      nameTokens: [],
      honorificTokens: [],
      categoryTokens: [],
      isEnglishQuery,
    };
  }

  const words = norm.split(/\s+/).filter(Boolean);
  const requestedFields: PeopleRequestedField[] = [];

  const hasAnyWordOrPhrase = (terms: string[]): boolean => {
    const normTerms = terms.map(normalizeSearchString);
    return normTerms.some((t) => {
      if (!t) return false;
      if (t.includes(' ')) return ` ${norm} `.includes(` ${t} `);
      return words.includes(t);
    });
  };

  if (
    hasAnyWordOrPhrase([
      'ولدیت', 'والد', 'باپ', 'ابو', 'بیٹا', 'ولد', 'خاندان', 'فیملی', 'ذات', 'قوم', 'برادری', 'شجرہ',
      'father', 'fathers', 'son of', 'vald', 'walid', 'family', 'parent', 'parents', 'parentage', 'caste', 'biradri',
    ])
  ) {
    requestedFields.push('family');
  }

  if (hasAnyWordOrPhrase(['واٹس ایپ', 'واٹس', 'whatsapp'])) {
    requestedFields.push('whatsapp');
  }

  if (
    hasAnyWordOrPhrase([
      'فون', 'نمبر', 'موبائل', 'رابطہ', 'کال', 'کنٹیکٹ',
      'phone', 'number', 'mobile', 'contact', 'call', 'cell',
    ])
  ) {
    requestedFields.push('phone');
  }

  if (
    hasAnyWordOrPhrase([
      'پتہ', 'ایڈریس', 'کہاں', 'کدھر', 'کتھے', 'کیتھے', 'مقام', 'جگہ', 'لوکیشن', 'محلہ', 'گھر',
      'address', 'location', 'where', 'pata', 'kidhar', 'kithe', 'kithay', 'live', 'lives', 'house',
    ])
  ) {
    requestedFields.push('address');
  }

  if (
    hasAnyWordOrPhrase([
      'ریٹ', 'ریٹس', 'فیس', 'معاوضہ', 'چارجز', 'دیہاڑی', 'قیمت', 'خرچہ',
      'rate', 'rates', 'charges', 'fee', 'fees', 'price', 'cost', 'wage',
    ])
  ) {
    requestedFields.push('charges');
  }

  if (
    hasAnyWordOrPhrase([
      'وقت', 'اوقات', 'ٹائم', 'کب کھلتا', 'کب بند', 'وقفہ', 'بریک',
      'time', 'timing', 'timings', 'hours', 'schedule', 'open', 'opening', 'closing', 'break',
    ])
  ) {
    requestedFields.push('timing');
  }

  if (
    hasAnyWordOrPhrase([
      'کیا کام', 'سروس', 'سروسز', 'خدمات', 'کاروبار', 'پیشہ', 'ہنر',
      'services', 'service', 'business', 'profession', 'occupation', 'skills',
    ])
  ) {
    requestedFields.push('services');
  }

  if (requestedFields.length === 0) {
    requestedFields.push('profile');
  }

  const nameTokens: string[] = [];
  const honorificTokens: string[] = [];
  const categoryTokens: string[] = [];

  for (const w of words) {
    if (w.length < 2 || /^\d+$/.test(w)) continue;
    if (PERSON_HONORIFIC_TITLES.has(w)) {
      honorificTokens.push(w);
      continue;
    }
    if (GENERIC_QUERY_STOP_WORDS.has(w)) {
      continue;
    }
    if (isCategoryOrDomainTerm(w)) {
      categoryTokens.push(w);
      continue;
    }
    nameTokens.push(w);
  }

  // What if the user searched ONLY an honorific title that acts as part of a person's name (e.g., "چوہدری" / "Chaudhry" or "ملک" / "Malik" or "حکیم" / "Hakeem" or "رانا" / "Rana")?
  const effectiveNameTokens =
    nameTokens.length > 0
      ? nameTokens
      : categoryTokens.length === 0 && honorificTokens.length > 0
      ? honorificTokens
      : [];

  const isPeopleQuery = effectiveNameTokens.length > 0;

  return {
    isPeopleQuery,
    requestedFields,
    primaryField: requestedFields[0],
    nameTokens: effectiveNameTokens,
    honorificTokens,
    categoryTokens,
    isEnglishQuery,
  };
}

const STRICT_ROLE_HONORIFICS = new Set<string>(
  ['ڈاکٹر', 'doctor', 'dr', 'حکیم', 'hakeem', 'hakim', 'قاری', 'qari', 'حافظ', 'hafiz', 'مولانا', 'maulana']
    .map(normalizeSearchString)
    .filter(Boolean)
);

/**
 * Searches the `profiles` database for a specific person by Urdu or English name
 * (supporting spelling variations and transliteration).
 *
 * Strictly enforces:
 * - Primary matching against `profile.name` (never falsely matching another person via `fatherName` or `address` alone).
 * - Disambiguation when multiple people share similar names (`status: 'multiple'`).
 * - Never returning another person or school record when no match exists (`status: 'not_found'`).
 */
export function searchPeopleDatabase(
  rawQuery: string,
  profiles: VillageProfile[]
): PeopleDatabaseSearchResult {
  const analysis = analyzePeopleQuery(rawQuery);
  if (!analysis.isPeopleQuery) {
    return {
      status: 'not_people_query',
      matchedProfiles: [],
      analysis,
    };
  }

  const normFullQuery = normalizeSearchString(rawQuery);
  const explicitlyMentionsSonOf =
    normFullQuery.includes('ولد ') ||
    normFullQuery.includes(' بن ') ||
    normFullQuery.includes('son of');

  const visibleProfiles = (profiles || []).filter((p) => !p.isHidden && !p.isDisabled);
  const { nameTokens, honorificTokens, categoryTokens } = analysis;

  interface ScoredCandidate {
    profile: VillageProfile;
    matchedCoreTokensInName: number;
    matchedCoreTokensTotal: number;
    matchedHonorifics: number;
    matchedCategories: number;
    exactFullNameMatch: boolean;
    score: number;
  }

  const tokenMatchesWordList = (queryTok: string, targetWords: string[]): boolean => {
    const expanded = expandSynonyms(queryTok);
    for (const targetW of targetWords) {
      if (!targetW) continue;
      if (targetW === queryTok) return true;
      if (expanded.includes(targetW)) return true;
      if (areNamesPhoneticallyEquivalent(queryTok, targetW)) return true;
    }
    return false;
  };

  const candidates: ScoredCandidate[] = [];

  for (const rawP of visibleProfiles) {
    const safeP = sanitizePublicProfile(rawP);
    const normProfileName = normalizeSearchString(safeP.name);
    const profileNameWords = normProfileName.split(/\s+/).filter(Boolean);
    const fatherWords = normalizeSearchString(safeP.fatherName || '')
      .split(/\s+/)
      .filter(Boolean);
    // Only use businessName (NOT address/landmark) for shop/person token matching
    const bizWords = normalizeSearchString(safeP.businessName || '')
      .split(/\s+/)
      .filter(Boolean);
    const catWords = normalizeSearchString(
      `${safeP.category || ''} ${safeP.customCategory || ''} ${(safeP.services || []).join(' ')}`
    )
      .split(/\s+/)
      .filter(Boolean);

    let matchedCoreTokensInName = 0;
    let matchedCoreTokensInBizOrFather = 0;

    for (const qTok of nameTokens) {
      if (tokenMatchesWordList(qTok, profileNameWords)) {
        matchedCoreTokensInName += 1;
      } else if (
        tokenMatchesWordList(qTok, bizWords) ||
        (explicitlyMentionsSonOf && tokenMatchesWordList(qTok, fatherWords))
      ) {
        matchedCoreTokensInBizOrFather += 1;
      }
    }

    // CRITICAL RULE: At least one core person name token MUST match `profile.name` itself
    // (or all tokens match the person's `businessName` when searching by shop brand + person).
    if (matchedCoreTokensInName === 0 && matchedCoreTokensInBizOrFather < nameTokens.length) {
      continue;
    }

    const matchedCoreTokensTotal = matchedCoreTokensInName + matchedCoreTokensInBizOrFather;

    // Every core name token in the user's query must match this person's record
    if (matchedCoreTokensTotal < nameTokens.length) {
      continue;
    }

    // If the user also specified a profession/category (e.g. "طارق الیکٹریشن" vs "بشیر پلمبر"),
    // EVERY specified category token must match this person's category/services/business!
    let matchedCategories = 0;
    for (const cTok of categoryTokens) {
      if (
        tokenMatchesWordList(cTok, catWords) ||
        tokenMatchesWordList(cTok, bizWords) ||
        tokenMatchesWordList(cTok, profileNameWords)
      ) {
        matchedCategories += 1;
      }
    }
    if (categoryTokens.length > 0 && matchedCategories < categoryTokens.length) {
      continue;
    }

    let matchedHonorifics = 0;
    let missingStrictRoleHonorific = false;
    for (const hTok of honorificTokens) {
      if (
        tokenMatchesWordList(hTok, profileNameWords) ||
        tokenMatchesWordList(hTok, bizWords) ||
        tokenMatchesWordList(hTok, catWords)
      ) {
        matchedHonorifics += 1;
      } else if (STRICT_ROLE_HONORIFICS.has(hTok)) {
        missingStrictRoleHonorific = true;
      }
    }
    if (missingStrictRoleHonorific) {
      continue;
    }

    // Check if the query tokens match all non-honorific words of profile.name
    const coreProfileNameWords = profileNameWords.filter((w) => !PERSON_HONORIFIC_TITLES.has(w));
    const exactFullNameMatch =
      coreProfileNameWords.length > 0 &&
      coreProfileNameWords.every((pw) =>
        nameTokens.some((qt) => tokenMatchesWordList(qt, [pw]))
      ) &&
      matchedCoreTokensInName === nameTokens.length;

    const score =
      matchedCoreTokensInName * 100 +
      matchedCoreTokensInBizOrFather * 25 +
      matchedHonorifics * 30 +
      matchedCategories * 40 +
      (exactFullNameMatch ? 80 : 0);

    candidates.push({
      profile: safeP,
      matchedCoreTokensInName,
      matchedCoreTokensTotal,
      matchedHonorifics,
      matchedCategories,
      exactFullNameMatch,
      score,
    });
  }

  if (candidates.length === 0) {
    return {
      status: 'not_found',
      matchedProfiles: [],
      analysis,
    };
  }

  // Sort by highest score
  candidates.sort((a, b) => b.score - a.score);

  // If multiple candidates matched all query tokens in `profile.name`:
  const topCandidate = candidates[0];
  const strongCompetitors = candidates.filter(
    (c) =>
      c.matchedCoreTokensInName === topCandidate.matchedCoreTokensInName &&
      c.matchedHonorifics === topCandidate.matchedHonorifics &&
      c.matchedCategories === topCandidate.matchedCategories
  );

  if (strongCompetitors.length > 1) {
    // Check if one of them is an exact full name match (e.g. "بشیر احمد" matching "بشیر احمد" vs "بشیر احمد خان")
    const exactFullMatches = strongCompetitors.filter((c) => c.exactFullNameMatch);
    if (exactFullMatches.length === 1) {
      return {
        status: 'exact',
        matchedProfiles: [exactFullMatches[0].profile],
        analysis,
      };
    }

    return {
      status: 'multiple',
      matchedProfiles: strongCompetitors.map((c) => c.profile),
      analysis,
    };
  }

  return {
    status: 'exact',
    matchedProfiles: [topCandidate.profile],
    analysis,
  };
}

/**
 * Checks if a normalized word belongs to any domain/category/service synonym cluster.
 */
export function isCategoryOrDomainTerm(word: string): boolean {
  const norm = normalizeSearchString(word);
  if (!norm) return false;
  if (GENERIC_QUERY_STOP_WORDS.has(norm)) return false;
  for (const cluster of SYNONYM_CLUSTERS) {
    const normCluster = cluster.map(normalizeSearchString);
    if (normCluster.includes(norm)) {
      return true;
    }
  }
  return false;
}

/**
 * Extracts specific identifier tokens (e.g., person names, specific shop brands)
 * from a query by excluding conversational stop-words and generic category/service terms.
 */
export function extractSpecificQueryIdentifiers(query: string): string[] {
  const normQuery = normalizeSearchString(query);
  if (!normQuery) return [];
  const words = normQuery.split(/\s+/).filter(Boolean);
  return words.filter((w) => {
    if (w.length < 2) return false;
    if (/^\d+$/.test(w)) return false;
    if (GENERIC_QUERY_STOP_WORDS.has(w)) return false;
    if (isCategoryOrDomainTerm(w)) return false;
    return true;
  });
}

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

  for (const nameCluster of NAME_TRANSLITERATION_CLUSTERS) {
    const normCluster = nameCluster.map(normalizeSearchString);
    const hasNameMatch = normCluster.some((item) => {
      if (!item) return false;
      if (item === norm) return true;
      return item.split(/\s+/).includes(norm);
    });
    if (hasNameMatch) {
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
 * Enforces strict relevance when specific person/shop identifiers are present in the query.
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

  const hasWordOrPhrase = (fieldText: string, term: string, allowPhonetic = false): boolean => {
    if (!fieldText || !term) return false;
    if (fieldText === term) return true;
    if (term.includes(' ')) {
      return ` ${fieldText} `.includes(` ${term} `);
    }
    const words = fieldText.split(/\s+/);
    if (words.includes(term)) return true;
    if (term.length >= 4) {
      if (words.some((w) => w.startsWith(term) || (w.length >= 4 && term.startsWith(w)))) {
        return true;
      }
    }
    if (allowPhonetic && term.length >= 3) {
      if (words.some((w) => areNamesPhoneticallyEquivalent(term, w))) {
        return true;
      }
    }
    return false;
  };

  let totalScore = 0;

  // 1. Exact full query phrase match
  if (hasWordOrPhrase(normName, normQuery, true)) totalScore += 120;
  if (hasWordOrPhrase(normBiz, normQuery, true)) totalScore += 90;
  if (hasWordOrPhrase(normCategory, normQuery)) totalScore += 80;
  if (hasWordOrPhrase(normServices, normQuery)) totalScore += 65;
  if (hasWordOrPhrase(normLoc, normQuery)) totalScore += 40;

  // Phone number match (query is at least 3 digits, e.g. 1122 or 0300)
  const queryDigits = normQuery.replace(/\D/g, '');
  const hasPhoneMatch = queryDigits.length >= 3 && cleanPhone.includes(queryDigits);
  if (hasPhoneMatch) {
    totalScore += 85;
  }

  // 2. Word-by-word scoring with synonym expansion + specific identifier tracking
  let allWordsMatched = true;
  const specificWords = extractSpecificQueryIdentifiers(normQuery);
  let matchedSpecificCount = 0;

  for (const word of queryWords) {
    const wordSynonyms = expandSynonyms(word);
    const isSpecificWord = specificWords.includes(word);
    let wordMatched = false;

    for (const syn of wordSynonyms) {
      if (hasWordOrPhrase(normName, syn, isSpecificWord)) {
        totalScore += syn === word ? 40 : 25;
        wordMatched = true;
      }
      if (hasWordOrPhrase(normBiz, syn, isSpecificWord)) {
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

    if (wordMatched && isSpecificWord) {
      matchedSpecificCount += 1;
    }

    if (!wordMatched) {
      allWordsMatched = false;
    }
  }

  // CRITICAL RELEVANCE CHECK:
  // If the user's query includes specific identifier words (e.g., a specific person/shop name
  // like "خالد الیکٹریشن" or "ناصر کریانہ سٹور" or "ڈاکٹر فرحان") and NONE of those specific
  // identifier words matched this target (only the generic category word matched),
  // reject this target as an unrelated match (score = 0)!
  if (specificWords.length > 0 && matchedSpecificCount === 0 && !hasPhoneMatch) {
    return 0;
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
 * STRICT PRIVACY & ISOLATION GUARANTEE:
 *  - Never searches or returns any user's username, password, passwordHash, email, or personal messages (VillageMessage).
 *  - Keeps people-profile searches and school searches strictly separate: searching for a person's name
 *    searches `profiles` and never returns unrelated school records (`institutes`) or substitute people.
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
  mandiRates = [],
  shelters = [],
  helpNotices = [],
  helpGuides = [],
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

  // Check if this query is specifically a people-profile search
  const peopleCheck = searchPeopleDatabase(query, profiles);
  const isStrictPeopleSearch =
    peopleCheck.status !== 'not_people_query' &&
    categoryFilter === 'all' &&
    !isExplicitNonProfileEntityQuery(query);

  // If the user is searching for a specific person (or people) and no non-profile entity was requested,
  // return ONLY the matched person profile(s) from the people database (or [] if not found).
  // Never return unrelated school records or substitute people!
  if (isStrictPeopleSearch && peopleCheck.analysis.nameTokens.length > 0) {
    // Only use strict people results unless the query also matched a hospital/mosque/transport/news item by exact name
    if (peopleCheck.status === 'exact' || peopleCheck.status === 'multiple') {
      return peopleCheck.matchedProfiles.map((safeP, idx) => ({
        id: safeP.id,
        type: 'profile' as const,
        title: safeP.name,
        subtitle: safeP.businessName,
        categoryLabelUrdu: safeP.customCategory || safeP.category,
        categoryLabelEn: safeP.category,
        contactNumber: safeP.mobile,
        location: safeP.address,
        score: 200 - idx * 5,
        rawItem: safeP,
      }));
    }
    if (
      peopleCheck.status === 'not_found' &&
      (peopleCheck.analysis.categoryTokens.length > 0 ||
        peopleCheck.analysis.requestedFields.some((f) => f !== 'profile') ||
        peopleCheck.analysis.honorificTokens.length > 0)
    ) {
      return [];
    }
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

      if (exactKeywordHit) {
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
  // When `isStrictPeopleSearch` is true, `searchPeopleDatabase` already handled `exact`/`multiple`,
  // and if `status === 'not_found'`, we must NEVER return substitute people from `profiles`!
  if (!isStrictPeopleSearch) {
    profiles.forEach((p) => {
      if (p.isHidden || p.isDisabled) return;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return;
      }

      const safeP = sanitizePublicProfile(p);
      // Do NOT concatenate fatherName into `name` unless the user is explicitly asking about father/family
      // so searching "بشیر احمد" or "اللہ دتہ" does not match another person's fatherName.
      const includeFatherInSearch =
        peopleCheck.analysis.requestedFields.includes('family') ||
        calculateMatchScore(
          {
            name: safeP.name,
            category: '',
            businessName: '',
            services: [],
            location: '',
            phoneDigits: '',
          },
          normQuery
        ) > 0;

      const score = normQuery
        ? calculateMatchScore(
            {
              name: includeFatherInSearch
                ? `${safeP.name} ${safeP.fatherName || ''}`
                : safeP.name,
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
  }

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
  // STRICT SEPARATION: Only search school records when `categoryFilter === 'institute'`
  // OR when the query explicitly asks about a school/college/education (`isExplicitSchoolQuery`).
  // Never return school records when a user searches for a person's name (like "Akhtar" / "اختر")!
  if (
    categoryFilter === 'institute' ||
    (categoryFilter === 'all' && isExplicitSchoolQuery(normQuery))
  ) {
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

