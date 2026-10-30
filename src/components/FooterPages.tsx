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
    <div className="w-full max-w-3xl mx-auto my-1.5 space-y-2.5 font-nastaliq" dir="rtl">
      {/* Compact Sticky Page Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-md border border-amber-400 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            stopSpeaking();
            onBack();
          }}
          className="min-h-[38px] px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
          <span>واپس ہوم</span>
        </button>

        <div className="text-right flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-extrabold text-amber-300 leading-snug truncate">
            {page === 'privacy' && '🔒 پرائیویسی پالیسی (رازداری کے اصول)'}
            {page === 'terms' && '📜 شرائط و ضوابط (کمیونٹی اصول)'}
            {page === 'emergency' && '🚨 ایمرجنسی اور ہنگامی مدد'}
          </h2>
          <span className="text-[10px] text-emerald-200 block">
            رتہ کلاں، جھنگ پورٹل — آف لائن بھی دستیاب ہے
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PAGE 1: COMPACT PRIVACY POLICY ("پرائیویسی پالیسی")                    */}
      {/* ===================================================================== */}
      {page === 'privacy' && (
        <div className="bg-white rounded-2xl border border-emerald-500 p-3 sm:p-4 shadow-md space-y-2.5 text-stone-800">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950 leading-snug">
                  آپ کے ڈیٹا اور رازداری کی مکمل حفاظت
                </h3>
                <p className="text-[11px] text-stone-600">
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
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition shrink-0 ${
                isSpeaking
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'روکیں' : 'سنیں'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs leading-snug">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
              <strong className="text-emerald-950 block font-extrabold text-xs sm:text-sm">
                ۱۔ پورٹل کون سا ڈیٹا رکھتا ہے؟
              </strong>
              <p className="text-stone-700 text-xs leading-relaxed">
                رتہ کلاں پورٹل صرف گاؤں کی سہولت کے لیے کاریگروں، دکانداروں، ڈاکٹروں، مساجد، سکولوں اور وین/بس کے اوقات کی وہی معلومات رکھتا ہے جو صارفین خود درج کرتے ہیں۔
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-0.5">
              <strong className="text-rose-950 block font-extrabold text-xs sm:text-sm">
                ۲۔ بلڈ گروپ، ای میل اور ذاتی پیغامات کبھی پبلک نہیں ہوتے:
              </strong>
              <p className="text-stone-700 text-xs leading-relaxed">
                آپ کا بلڈ گروپ (Blood Group)، ای میل ایڈریس (Email) اور ان باکس کے ذاتی پیغامات (Private Messages) کبھی بھی عام سکرین یا صوتی تلاش میں کسی دوسرے شخص کو نہیں دکھائے جاتے۔
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5">
              <strong className="text-amber-950 block font-extrabold text-xs sm:text-sm">
                ۳۔ فون نمبر صرف آپ کی مرضی کے مطابق:
              </strong>
              <p className="text-stone-700 text-xs leading-relaxed">
                فون نمبر صرف اسی صورت میں ڈائریکٹری پر دکھایا جاتا ہے جب کوئی کاریگر، دکاندار یا ڈرائیور خود اپنا کارڈ بناتے وقت رابطے کے لیے نمبر ظاہر کرنے کا انتخاب کرے۔
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 space-y-0.5">
              <strong className="text-blue-950 block font-extrabold text-xs sm:text-sm">
                ۴۔ کوئی معلومات فروخت نہیں کی جاتیں:
              </strong>
              <p className="text-stone-700 text-xs leading-relaxed">
                یہ پورٹل ۱۰۰ فیصد مفت اور خدمتِ خلق کے لیے ہے۔ کسی بھی فرد کا نام، نمبر یا ڈیٹا کسی کمپنی، اشتہار باز یا تیسرے فریق کو ہرگز فروخت یا شیئر نہیں کیا جاتا۔
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 space-y-0.5">
              <strong className="text-teal-950 block font-extrabold text-xs sm:text-sm">
                ۵۔ آواز کی ریکارڈنگ محفوظ نہیں کی جاتی:
              </strong>
              <p className="text-stone-700 text-xs leading-relaxed">
                "بول کر پوچھیں" میں جب آپ مائیک دبا کر سوال پوچھتے ہیں تو آپ کی آواز کی کوئی ریکارڈنگ محفوظ نہیں کی جاتی۔ سوال کا جواب فون کے اندر موجود ڈیٹا سے دیا جاتا ہے۔
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-300 space-y-1.5 flex flex-col justify-between">
              <div className="space-y-0.5">
                <strong className="text-stone-900 block font-extrabold text-xs sm:text-sm">
                  ۶۔ اپنی پروفائل اور ڈیٹا خود تبدیل (Edit) یا حذف (Delete) کرنے کا طریقہ:
                </strong>
                <p className="text-stone-700 text-xs leading-relaxed">
                  ہر صارف اپنے کارڈ پر موجود <strong>"ترمیم (Edit)"</strong> یا <strong>"حذف (Delete)"</strong> بٹن کو دبا کر اپنے یوزر نیم اور پاس ورڈ سے کسی بھی وقت اپنی پروفائل تبدیل کر سکتا ہے یا ہمیشہ کے لیے مٹا سکتا ہے۔ آپ اپنے فون میں محفوظ حالیہ سوالات بھی ایک بٹن سے صاف کر سکتے ہیں۔
                </p>
              </div>
              {onOpenMyProfileOrAuth && (
                <button
                  type="button"
                  onClick={onOpenMyProfileOrAuth}
                  className="min-h-[38px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition w-full sm:w-auto self-start"
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
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
        <div className="bg-white rounded-2xl border border-amber-500 p-3 sm:p-4 shadow-md space-y-3 text-stone-800">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                  {t.termsTitle}
                </h3>
                <p className="text-[11px] text-stone-600">
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
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition ${
                isSpeaking
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-600 text-stone-950'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSpeaking ? 'روکیں' : 'سنیں'}</span>
            </button>
          </div>

          {/* EXISTING COMMUNITY RULES KEPT UNCHANGED */}
          <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
            {/* Strict Rule 1: Female Privacy */}
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{t.femaleRuleWarning}</span>
              </div>
              <p className="text-red-900 text-xs leading-relaxed">
                {t.femaleRuleDetail}
              </p>
              <div className="bg-white/80 rounded-lg p-2 text-xs text-red-800 font-semibold border border-red-200">
                💡 اگر کوئی خاتون سلائی، کڑھائی، ٹیوشن یا کوئی گھریلو ہنر جانتی ہیں تو ان کا نام لکھے بغیر صرف گھر کے مرد سرپرست (والد، بھائی، شوہر یا بیٹے) کا نام اور موبائل نمبر درج کریں۔
              </div>
            </div>

            {/* Strict Rule 2: No Sectarianism / Religious Promotion */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t.religiousRuleWarning}</span>
              </div>
              <p className="text-amber-950 text-xs leading-relaxed">
                {t.religiousRuleDetail}
              </p>
            </div>

            {/* Additional Community Rules (Respectful use, No false info, No spam, Admin removal right) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
              <h3 className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>مقامی روزگار، باہمی احترام اور درست معلومات کے اصول</span>
              </h3>
              <ul className="list-disc list-inside text-xs text-emerald-950 space-y-1">
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
            <div className="bg-stone-900 text-white rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-amber-300 font-bold block">
                  شکایات و رہنمائی ہیلپ لائن (نگرانِ اعلیٰ: ثمر سعید)
                </span>
                <p className="text-[11px] text-stone-300">
                  کسی بھی غلط اندراج کو ہٹوانے کے لیے فوری کال کریں:
                </p>
              </div>
              <a
                href="tel:03270019099"
                className="min-h-[38px] bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>0327-0019099</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE 3: COMPACT EMERGENCY PAGE ("ایمرجنسی")                            */}
      {/* ===================================================================== */}
      {page === 'emergency' && (
        <div className="space-y-2.5">
          {/* Compact Call Buttons for 1122, 15, and 16 */}
          <div className="bg-gradient-to-br from-red-950 via-rose-950 to-stone-950 text-white rounded-2xl p-3 border border-red-500 shadow-md space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-amber-300 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-red-400" />
                <span>فوری ایمرجنسی کال بٹن</span>
              </h3>
              <button
                type="button"
                onClick={() =>
                  handleToggleAudio(
                    'ہنگامی نمبرز: ایمبولینس اور حادثات کے لیے ایک ایک دو دو پر کال کریں۔ پولیس مدد کے لیے ایک پانچ پر کال کریں۔ آگ بجھانے والی گاڑی فائر بریگیڈ کے لیے ایک چھ پر کال کریں۔'
                  )
                }
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>سنیں</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {emergencyData.emergencyNumbers.map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-amber-300 shadow-xs flex items-center justify-between gap-2 transition active:scale-95"
                >
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold block truncate">{item.label}</span>
                    <span className="text-[11px] text-red-100 block truncate">{item.sublabel}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 font-mono text-sm sm:text-base font-black text-amber-300 shrink-0" dir="ltr">
                    {item.number}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Short Urdu Note & Flood Alert in Compact 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-amber-50 border border-amber-400 rounded-2xl p-3 flex items-start gap-2.5 text-amber-950">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <strong className="text-xs sm:text-sm font-extrabold block">
                  📢 مسجد کے سپیکر کے اعلانات:
                </strong>
                <p className="text-xs leading-relaxed">
                  یہ ایپ ہنگامی نمبروں کی مدد کے لیے ہے، فوری آفت میں مسجد کے لاؤڈ سپیکر کے اعلانات اور ریسکیو 1122 کی ہدایات پر عمل کریں۔
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-400 rounded-2xl p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className="text-xs sm:text-sm font-extrabold text-blue-950">
                    🌊 سیلاب الرٹ:
                  </strong>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    نارمل / محفوظ
                  </span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  {emergencyData.floodAlertLevelUrdu}
                </p>
              </div>
            </div>
          </div>

          {/* Shelter List */}
          <div className="bg-white border border-emerald-500 rounded-2xl p-3 shadow-xs space-y-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-emerald-700" />
              <span>رتہ کلاں کی ہنگامی پناہ گاہیں (Emergency Shelters)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {emergencyData.shelters.map((sh, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5"
                >
                  <strong className="text-xs font-extrabold text-emerald-950 block">
                    {idx + 1}۔ {sh.name}
                  </strong>
                  <span className="text-[11px] text-emerald-800 flex items-center gap-1 font-bold">
                    <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                    <span>{sh.location}</span>
                  </span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{sh.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nearest Hospitals Link & Donor List Link (Signed-in Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white border border-red-400 rounded-2xl p-3 shadow-xs flex flex-col justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-red-950 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-red-600" />
                  <span>قریبی ہسپتال اور کلینکس ({hospitals.length})</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  بنیادی مرکز صحت (BHU) رتہ کلاں، RHC اور ڈسٹرکٹ ہسپتال (DHQ) جھنگ کے نمبرز دیکھیں۔
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenHospitals}
                className="min-h-[38px] w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
              >
                <HeartPulse className="w-4 h-4" />
                <span>ہسپتالوں کی فہرست کھولیں ➔</span>
              </button>
            </div>

            <div className="bg-white border border-amber-400 rounded-2xl p-3 shadow-xs flex flex-col justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>خون کے عطیہ دہندگان اور ہنگامی مدد</span>
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  پرائیویسی اصول کے تحت بلڈ گروپ عوامی صفحے پر نہیں دکھایا جاتا۔ فہرست صرف لاگ ان صارفین کے لیے ہے۔
                </p>
              </div>

              {activeSession ? (
                <button
                  type="button"
                  onClick={onOpenDonorList}
                  className="min-h-[38px] w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>عطیہ و امداد نوٹس بورڈ کھولیں ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="min-h-[38px] w-full py-2 px-3 bg-amber-400 hover:bg-amber-500 text-stone-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
                >
                  <Lock className="w-4 h-4" />
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
