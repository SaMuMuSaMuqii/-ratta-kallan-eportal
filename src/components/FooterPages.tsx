import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  PhoneCall,
  HeartPulse,
  AlertTriangle,
  MapPin,
  Lock,
  UserCheck,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
  Megaphone,
  Droplets,
  Home,
} from 'lucide-react';
import { Language, VillageHospital, AuthUserSession } from '../types';
import { translations } from '../data/translations';
import { speakText, stopSpeaking } from '../utils/speech';

export type FooterPageType = 'privacy' | 'terms' | 'emergency';

export const OFFLINE_FOOTER_CACHE_KEY = 'rk_offline_footer_pages_cache_v1';

export interface OfflineEmergencyCacheData {
  cachedAt: string;
  floodAlertLevelUrdu: string;
  shelters: { name: string; location: string; note: string }[];
  emergencyNumbers: { number: string; label: string; sublabel: string }[];
}

export const DEFAULT_EMERGENCY_PAGE_DATA: OfflineEmergencyCacheData = {
  cachedAt: new Date().toISOString(),
  floodAlertLevelUrdu: 'نارمل (محفوظ سطح) — اس وقت رتہ کلاں اور قریبی نہر/دریائے چناب میں سیلاب کا کوئی خطرہ نہیں ہے۔',
  shelters: [
    {
      name: 'گورنمنٹ ہائی سکول رتہ کلاں',
      location: 'مین جھنگ روڈ، رتہ کلاں',
      note: 'بڑی عمارت، کھلا میدان اور پینے کے پانی کی سہولت',
    },
    {
      name: 'مرکزی جامع مسجد رتہ کلاں',
      location: 'مین بازار / اونچی جگہ، رتہ کلاں',
      note: 'محفوظ اور اونچا مقام، ہنگامی اعلان کی سہولت',
    },
    {
      name: 'بنیادی مرکز صحت (BHU) رتہ کلاں',
      location: 'نزد مین اڈا، رتہ کلاں',
      note: 'ابتدائی طبی امداد اور ایمرجنسی پناہ گاہ',
    },
  ],
  emergencyNumbers: [
    {
      number: '1122',
      label: 'ریسکیو 1122 (ایمبولینس و حادثات)',
      sublabel: '24 گھنٹے مفت ایمرجنسی ہیلپ لائن',
    },
    {
      number: '15',
      label: 'پولیس ایمرجنسی 15',
      sublabel: 'چوری، ڈکیتی یا فوری پولیس مدد',
    },
    {
      number: '16',
      label: 'فائر بریگیڈ 16 (آگ بجھانے کا عملہ)',
      sublabel: 'آگ لگنے کی صورت میں فوری کال کریں',
    },
  ],
};

interface FooterPageViewProps {
  page: FooterPageType;
  onBack: () => void;
  lang: Language;
  hospitals: VillageHospital[];
  activeSession?: AuthUserSession | null;
  onOpenHospitals: () => void;
  onOpenDonorList: () => void;
  onOpenLogin: () => void;
  onOpenMyProfileOrAuth?: () => void;
}

export const FooterPageView: React.FC<FooterPageViewProps> = ({
  page,
  onBack,
  lang,
  hospitals,
  activeSession,
  onOpenHospitals,
  onOpenDonorList,
  onOpenLogin,
  onOpenMyProfileOrAuth,
}) => {
  const t = translations[lang];
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Offline cache: save visited page data to phone storage so it always works offline
  const [emergencyData] = useState<OfflineEmergencyCacheData>(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_FOOTER_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.emergency) return parsed.emergency;
      }
    } catch {}
    return DEFAULT_EMERGENCY_PAGE_DATA;
  });

  useEffect(() => {
    try {
      const payload = {
        visitedPages: {
          privacy: true,
          terms: true,
          emergency: true,
        },
        emergency: DEFAULT_EMERGENCY_PAGE_DATA,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(OFFLINE_FOOTER_CACHE_KEY, JSON.stringify(payload));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      stopSpeaking();
    };
  }, [page]);

  const handleToggleAudio = (textToSpeak: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(
        textToSpeak,
        lang === 'en' ? 'en' : 'ur',
        () => setIsSpeaking(false),
        {
          isFemaleVillageVoice: false,
          voiceGender: 'male',
          rate: 0.9,
          pitch: 1.0,
        }
      );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-2 space-y-4 font-nastaliq" dir="rtl">
      {/* Top Sticky Page Header with Big Back Button */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white rounded-3xl p-4 shadow-xl border-2 border-amber-400 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onBack();
          }}
          className="min-h-[56px] px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold rounded-2xl text-sm sm:text-base flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
          <span>واپس ہوم سکرین</span>
        </button>

        <div className="text-right flex-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-amber-300 leading-snug">
            {page === 'privacy' && '🔒 پرائیویسی پالیسی (رازداری کے اصول)'}
            {page === 'terms' && '📜 شرائط و ضوابط (کمیونٹی اصول)'}
            {page === 'emergency' && '🚨 ایمرجنسی اور ہنگامی مدد'}
          </h2>
          <span className="text-xs text-emerald-200 block">
            رتہ کلاں، جھنگ پورٹل — آف لائن بھی دستیاب ہے
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PAGE 1: PRIVACY POLICY ("پرائیویسی پالیسی") */}
      {/* ===================================================================== */}
      {page === 'privacy' && (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 p-4 sm:p-6 shadow-lg space-y-4 text-stone-800">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">
                  آپ کے ڈیٹا اور رازداری کی مکمل حفاظت
                </h3>
                <p className="text-xs text-stone-600">
                  آسان اردو میں ہماری پرائیویسی پالیسی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleToggleAudio(
                  'رتہ کلاں پورٹل پرائیویسی پالیسی۔ یہ پورٹل صرف عوامی سہولت کے لیے کاریگر، دکان، سکول، مسجد اور گاڑیوں کی عام معلومات رکھتا ہے۔ کسی بھی شخص کا بلڈ گروپ، ای میل اور ذاتی پیغامات کبھی بھی عام یا پبلک نہیں دکھائے جاتے۔ فون نمبر صرف اسی طرح دکھایا جاتا ہے جیسے آپ نے خود اجازت دی ہو۔ کوئی بھی ڈیٹا کسی کو بیچا نہیں جاتا۔ بول کر پوچھیں میں آپ کی آواز کی ریکارڈنگ کبھی محفوظ نہیں کی جاتی۔ آپ جب چاہیں اپنی پروفائل اور ڈیٹا خود تبدیل یا مکمل ڈیلیٹ کر سکتے ہیں۔'
                )
              }
              className={`min-h-[48px] px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer transition ${
                isSpeaking
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span>{isSpeaking ? 'روکیں' : 'آواز میں سنیں'}</span>
            </button>
          </div>

          <div className="space-y-3 text-sm sm:text-base leading-loose">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <strong className="text-emerald-950 block font-extrabold">
                ۱۔ پورٹل کون سا ڈیٹا رکھتا ہے؟
              </strong>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                رتہ کلاں پورٹل صرف گاؤں کی سہولت کے لیے کاریگروں، دکانداروں، ڈاکٹروں، مساجد، سکولوں اور وین/بس کے اوقات کی وہی معلومات رکھتا ہے جو صارفین خود درج کرتے ہیں۔
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <strong className="text-rose-950 block font-extrabold">
                ۲۔ بلڈ گروپ، ای میل اور ذاتی پیغامات کبھی پبلک نہیں ہوتے:
              </strong>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                آپ کا بلڈ گروپ (Blood Group)، ای میل ایڈریس (Email) اور ان باکس کے ذاتی پیغامات (Private Messages) کبھی بھی عام سکرین یا صوتی تلاش میں کسی دوسرے شخص کو نہیں دکھائے جاتے۔
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <strong className="text-amber-950 block font-extrabold">
                ۳۔ فون نمبر صرف آپ کی مرضی کے مطابق:
              </strong>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                فون نمبر صرف اسی صورت میں ڈائریکٹری پر دکھایا جاتا ہے جب کوئی کاریگر، دکاندار یا ڈرائیور خود اپنا کارڈ بناتے وقت رابطے کے لیے نمبر ظاہر کرنے کا انتخاب کرے۔
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
              <strong className="text-blue-950 block font-extrabold">
                ۴۔ کوئی معلومات فروخت نہیں کی جاتیں:
              </strong>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                یہ پورٹل ۱۰۰ فیصد مفت اور خدمتِ خلق کے لیے ہے۔ کسی بھی فرد کا نام، نمبر یا ڈیٹا کسی کمپنی، اشتہار باز یا تیسرے فریق کو ہرگز فروخت یا شیئر نہیں کیا جاتا۔
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
              <strong className="text-teal-950 block font-extrabold">
                ۵۔ آواز کی ریکارڈنگ محفوظ نہیں کی جاتی:
              </strong>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                "بول کر پوچھیں" میں جب آپ مائیک دبا کر سوال پوچھتے ہیں تو آپ کی آواز کی کوئی ریکارڈنگ محفوظ نہیں کی جاتی۔ سوال کا جواب فون کے اندر موجود ڈیٹا سے دیا جاتا ہے۔
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 space-y-2">
              <strong className="text-stone-900 block font-extrabold">
                ۶۔ اپنی پروفائل اور ڈیٹا خود تبدیل (Edit) یا حذف (Delete) کرنے کا طریقہ:
              </strong>
              <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                ہر صارف اپنے کارڈ پر موجود <strong>"ترمیم (Edit)"</strong> یا <strong>"حذف (Delete)"</strong> بٹن کو دبا کر اپنے یوزر نیم اور پاس ورڈ سے کسی بھی وقت اپنی پروفائل تبدیل کر سکتا ہے یا ہمیشہ کے لیے مٹا سکتا ہے۔ آپ اپنے فون میں محفوظ حالیہ سوالات بھی ایک بٹن سے صاف کر سکتے ہیں۔
              </p>
              {onOpenMyProfileOrAuth && (
                <button
                  type="button"
                  onClick={onOpenMyProfileOrAuth}
                  className="min-h-[52px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow cursor-pointer transition"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>اپنی پروفائل دیکھیں / ترمیم یا حذف کریں</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE 2: TERMS & CONDITIONS ("شرائط و ضوابط") */}
      {/* Keeps all existing community rules text unchanged + respectful use, no false info, no spam, admin removal */}
      {/* ===================================================================== */}
      {page === 'terms' && (
        <div className="bg-white rounded-3xl border-2 border-amber-500 p-4 sm:p-6 shadow-lg space-y-4 text-stone-800">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                  {t.termsTitle}
                </h3>
                <p className="text-xs text-stone-600">
                  رتہ کلاں، جھنگ کمیونٹی پورٹل کے لازمی اصول و ضوابط
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleToggleAudio(
                  `${t.termsTitle}۔ ${t.femaleRuleWarning}۔ ${t.femaleRuleDetail}۔ ${t.religiousRuleWarning}۔ ${t.religiousRuleDetail}۔ براہ کرم باہمی احترام کا خیال رکھیں، کوئی غلط یا جھوٹی معلومات درج نہ کریں، اور اسپام سے پرہیز کریں۔ خلاف ورزی کی صورت میں ایڈمن مواد ہٹانے کا اختیار رکھتا ہے۔`
                )
              }
              className={`min-h-[48px] px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer transition ${
                isSpeaking
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span>{isSpeaking ? 'روکیں' : 'آواز میں سنیں'}</span>
            </button>
          </div>

          {/* EXISTING COMMUNITY RULES KEPT UNCHANGED */}
          <div className="space-y-4 text-sm leading-relaxed">
            {/* Strict Rule 1: Female Privacy */}
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{t.femaleRuleWarning}</span>
              </div>
              <p className="text-red-900 text-xs sm:text-sm leading-relaxed">
                {t.femaleRuleDetail}
              </p>
              <div className="bg-white/80 rounded-xl p-2.5 text-xs text-red-800 font-semibold border border-red-200">
                💡 اگر کوئی خاتون سلائی، کڑھائی، ٹیوشن یا کوئی گھریلو ہنر جانتی ہیں تو ان کا نام لکھے بغیر صرف گھر کے مرد سرپرست (والد، بھائی، شوہر یا بیٹے) کا نام اور موبائل نمبر درج کریں۔
              </div>
            </div>

            {/* Strict Rule 2: No Sectarianism / Religious Promotion */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{t.religiousRuleWarning}</span>
              </div>
              <p className="text-amber-950 text-xs sm:text-sm leading-relaxed">
                {t.religiousRuleDetail}
              </p>
            </div>

            {/* Additional Community Rules (Respectful use, No false info, No spam, Admin removal right) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <h3 className="font-bold text-emerald-900 text-sm sm:text-base flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>مقامی روزگار، باہمی احترام اور درست معلومات کے اصول</span>
              </h3>
              <ul className="list-disc list-inside text-xs sm:text-sm text-emerald-950 space-y-1.5">
                <li>یہ پورٹل صرف رتہ کلاں (تحصیل و ضلع جھنگ) کے رہائشیوں اور کاروباروں کے لیے ہے۔</li>
                <li>صرف حقیقی اور درست موبائل نمبر اور کاروبار کی تفصیل درج کریں۔</li>
                <li>کسی دوسرے شخص کی اجازت کے بغیر اس کا نام یا تصویر ہرگز اپلوڈ نہ کریں۔</li>
                <li>
                  <strong>باہمی احترام (Respectful Use):</strong> تمام گاؤں والوں، بزرگوں اور کاریگروں کے ساتھ ادب اور احترام سے پیش آئیں۔
                </li>
                <li>
                  <strong>جھوٹی معلومات کی ممانعت (No False Information):</strong> پورٹل پر کوئی بھی جھوٹی خبر، غلط وقت یا جعلی نمبر درج کرنا سخت منع ہے۔
                </li>
                <li>
                  <strong>اسپام کی ممانعت (No Spam):</strong> بار بار غیر ضروری پیغامات بھیجنا یا غیر متعلقہ اشتہارات لگانا منع ہے۔
                </li>
                <li>
                  <strong>ایڈمن کا اختیار (Admin Content Removal):</strong> اصولوں کی خلاف ورزی، غلط معلومات یا شکایت کی صورت میں پورٹل ایڈمن کسی بھی کارڈ، پروفائل یا پوسٹ کو ہٹانے کا مکمل اختیار رکھتا ہے۔
                </li>
              </ul>
            </div>

            {/* Official Helpline & Super Admin Contact */}
            <div className="bg-stone-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-amber-300 font-bold block">
                  شکایات و رہنمائی ہیلپ لائن (نگرانِ اعلیٰ: ثمر سعید)
                </span>
                <p className="text-xs text-stone-300 mt-0.5">
                  کسی بھی غلط اندراج کو ہٹوانے کے لیے فوری کال کریں:
                </p>
              </div>
              <a
                href="tel:03270019099"
                className="min-h-[48px] bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold font-mono text-sm flex items-center justify-center gap-1.5 shadow shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>0327-0019099</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE 3: EMERGENCY PAGE ("ایمرجنسی") */}
      {/* Big call buttons for 1122, 15, 16, nearest hospitals link, shelter list, flood alert level, donor list link (signed-in only), mosque speaker note, zero private data */}
      {/* ===================================================================== */}
      {page === 'emergency' && (
        <div className="space-y-4">
          {/* Short Urdu Note: App does not replace the mosque speaker */}
          <div className="bg-amber-100 border-2 border-amber-500 rounded-3xl p-4 shadow-md flex items-start gap-3 text-amber-950">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <strong className="text-sm sm:text-base font-extrabold block">
                📢 ضروری ہدایت (مسجد کے سپیکر کے بارے میں):
              </strong>
              <p className="text-xs sm:text-sm font-bold leading-relaxed">
                یہ ایپ ہنگامی نمبروں اور معلومات میں مدد کے لیے ہے، لیکن یہ گاؤں کی مسجد کے لاؤڈ سپیکر کے اعلانات کا متبادل نہیں ہے۔ کسی بھی فوری آفت یا ہنگامی صورتحال میں مسجد کے سپیکر سے ہونے والے اعلانات اور ریسکیو 1122 کی ہدایات پر عمل کریں۔
              </p>
            </div>
          </div>

          {/* Big Call Buttons for 1122, 15, and 16 */}
          <div className="bg-gradient-to-br from-red-950 via-rose-950 to-stone-950 text-white rounded-3xl p-4 sm:p-5 border-2 border-red-500 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-amber-300 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-red-400 animate-bounce" />
                <span>فوری ایمرجنسی کال بٹن (ایک بٹن دبائیں)</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  handleToggleAudio(
                    'ہنگامی نمبرز: ایمبولینس اور حادثات کے لیے ایک ایک دو دو پر کال کریں۔ پولیس مدد کے لیے ایک پانچ پر کال کریں۔ آگ بجھانے والی گاڑی فائر بریگیڈ کے لیے ایک چھ پر کال کریں۔'
                  )
                }
                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>سنیں</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {emergencyData.emergencyNumbers.map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="min-h-[72px] p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white border-2 border-amber-300 shadow-lg flex flex-col justify-between transition active:scale-95"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base font-extrabold">{item.label}</span>
                    <span className="px-3 py-1 rounded-xl bg-black/40 font-mono text-lg sm:text-xl font-black text-amber-300">
                      {item.number}
                    </span>
                  </div>
                  <span className="text-xs text-red-100 mt-1 block">{item.sublabel}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Flood Alert Level */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-3xl p-4 shadow-sm flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow">
              <Droplets className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-sm sm:text-base font-extrabold text-blue-950">
                  🌊 سیلاب کا الرٹ لیول (Flood Alert Level):
                </strong>
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  نارمل / محفوظ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-900 font-bold leading-relaxed">
                {emergencyData.floodAlertLevelUrdu}
              </p>
            </div>
          </div>

          {/* Shelter List */}
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-md space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-700" />
              <span>رتہ کلاں کی ہنگامی پناہ گاہیں (Emergency Shelters)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {emergencyData.shelters.map((sh, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1"
                >
                  <strong className="text-sm font-extrabold text-emerald-950 block">
                    {idx + 1}۔ {sh.name}
                  </strong>
                  <span className="text-xs text-emerald-800 flex items-center gap-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{sh.location}</span>
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">{sh.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nearest Hospitals Link & Donor List Link (Signed-in Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Link to Nearest Hospitals */}
            <div className="bg-white border-2 border-red-400 rounded-3xl p-4 shadow-md flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-red-950 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-red-600" />
                  <span>قریبی ہسپتال اور کلینکس ({hospitals.length})</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  بنیادی مرکز صحت (BHU) رتہ کلاں، رورل ہیلتھ سینٹر اور ڈسٹرکٹ ہسپتال (DHQ) جھنگ کے نمبرز اور اوقات دیکھیں۔
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenHospitals}
                className="min-h-[56px] w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow cursor-pointer transition active:scale-95"
              >
                <HeartPulse className="w-5 h-5" />
                <span>قریبی ہسپتالوں کی فہرست کھولیں ➔</span>
              </button>
            </div>

            {/* Donor List Link (Strictly Signed-in Only, Zero Private Data on Public Emergency Page) */}
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-4 shadow-md flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span>خون کے عطیہ دہندگان اور ہنگامی مدد فہرست</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  پرائیویسی اصول کے تحت کسی بھی فرد کا بلڈ گروپ عوامی صفحے پر نہیں دکھایا جاتا۔ خون کیہنگامی ضرورت کی فہرست صرف لاگ ان صارفین کے لیے ہے۔
                </p>
              </div>

              {activeSession ? (
                <button
                  type="button"
                  onClick={onOpenDonorList}
                  className="min-h-[56px] w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow cursor-pointer transition active:scale-95"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>عطیہ و امداد نوٹس بورڈ کھولیں ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="min-h-[56px] w-full py-3 px-4 bg-amber-400 hover:bg-amber-500 text-stone-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow cursor-pointer transition active:scale-95"
                >
                  <Lock className="w-5 h-5" />
                  <span>فہرست دیکھنے کے لیے لاگ ان کریں ➔</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
