import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Share2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Megaphone,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Heart,
  Zap,
  Activity,
  Trophy,
} from 'lucide-react';
import { VillageNewsEvent, Language, EventCategory, BannerBenefitsStripConfig } from '../types';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';
import {
  loadBannerBenefitsStripConfig,
  loadBannerBenefitsStripConfigSync,
  DEFAULT_BANNER_BENEFIT_PAIRS,
} from '../firebase/firestoreService';

interface VillageNewsPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: VillageNewsEvent[];
  lang: Language;
}

export const VillageNewsPopupModal: React.FC<VillageNewsPopupModalProps> = ({
  isOpen,
  onClose,
  events,
  lang,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [stripConfig, setStripConfig] = useState<BannerBenefitsStripConfig>(() =>
    loadBannerBenefitsStripConfigSync()
  );

  React.useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    loadBannerBenefitsStripConfig().then((cfg) => {
      if (mounted && cfg) setStripConfig(cfg);
    });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    // Mark all events in this popup as seen on this device
    events.forEach((ev) => {
      try {
        localStorage.setItem(`rk_seen_news_${ev.id}`, '1');
      } catch {}
    });
    onClose();
  };

  // Listen for Escape key (Always called before early return to respect Rules of Hooks)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, events]);

  if (!isOpen || events.length === 0) return null;

  const currentEvent = events[currentIndex] || events[0];
  const visibleBenefitPairs = (
    stripConfig?.pairs && stripConfig.pairs.length > 0
      ? stripConfig.pairs
      : DEFAULT_BANNER_BENEFIT_PAIRS
  ).filter((p) => !p.isHidden);

  const currentBenefitPair =
    !stripConfig?.hideAll && visibleBenefitPairs.length > 0
      ? visibleBenefitPairs[currentIndex % visibleBenefitPairs.length]
      : null;

  const getCategoryDetails = (cat: EventCategory) => {
    switch (cat) {
      case 'janaza':
        return {
          title: 'اطلاع نمازِ جنازہ و تعزیت',
          bg: 'from-stone-900 to-stone-800',
          badgeBg: 'bg-stone-800 text-amber-200 border-stone-600',
          icon: <Heart className="w-5 h-5 text-rose-400" />,
        };
      case 'medical':
        return {
          title: 'فری میڈیکل کیمپ و صحت',
          bg: 'from-emerald-900 to-teal-900',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <Activity className="w-5 h-5 text-emerald-300" />,
        };
      case 'bijli_pani':
        return {
          title: 'بجلی و نہر کا شیڈول',
          bg: 'from-amber-900 to-stone-900',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Zap className="w-5 h-5 text-amber-400" />,
        };
      case 'sports':
        return {
          title: 'کھیل و ٹورنامنٹ میلہ',
          bg: 'from-blue-900 to-indigo-950',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <Trophy className="w-5 h-5 text-amber-300" />,
        };
      case 'shadi':
        return {
          title: 'شادی و خوشی کی تقریب',
          bg: 'from-rose-900 to-pink-950',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <Heart className="w-5 h-5 text-pink-300" />,
        };
      default:
        return {
          title: 'رتہ کلاں اہم واقعہ و خبر',
          bg: 'from-emerald-950 to-teal-950',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <Megaphone className="w-5 h-5 text-amber-300" />,
        };
    }
  };

  const catMeta = getCategoryDetails(currentEvent.category);

  const audioText =
    currentEvent.voiceAudioText ||
    `رتہ کلاں جھنگ کی تازہ خبر: ${currentEvent.title}۔ تاریخ: ${currentEvent.date}۔ مقام: ${currentEvent.location}۔ تفصیل: ${currentEvent.content}`;

  const handleToggleVoice = () => {
    unlockAudioContext();
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playNotificationChime('start');
      speakText(audioText, lang, () => setIsPlayingAudio(false), {
        isFemaleVillageVoice: false,
        rate: getSpeechRate(),
        pitch: 1.0,
      });
    }
  };

  const handleShareToWhatsApp = () => {
    const text = `📢 *رتہ کلاں جھنگ پورٹل — اہم واقعہ و خبر*\n\n📌 *${currentEvent.title}*\n🗓️ تاریخ: ${currentEvent.date}\n⏰ وقت: ${currentEvent.time || 'مقررہ وقت پر'}\n📍 مقام: ${currentEvent.location}\n\n📝 تفصیل: ${currentEvent.content}\n\nزیر نگرانی: ثمر سعید (سپر ایڈمن پورٹل)`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyText = () => {
    const text = `رتہ کلاں جھنگ خبر: ${currentEvent.title}\nتاریخ: ${currentEvent.date}\nمقام: ${currentEvent.location}\nتفصیل: ${currentEvent.content}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleNext = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const handlePrev = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-white border-2 border-amber-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto flex flex-col">
        {/* Top Header Banner */}
        <div
          className={`bg-gradient-to-r ${catMeta.bg} text-white p-4 sm:p-5 relative overflow-hidden`}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 rounded-2xl backdrop-blur border border-white/20">
                {catMeta.icon}
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  رتہ کلاں گاؤں کی مفت لائیو خبر
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-nastaliq leading-tight">
                  {catMeta.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/30 backdrop-blur transition"
              title="بند کریں"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Indicator if multiple news items */}
          {events.length > 1 && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-xs text-amber-200">
              <span>
                خبر {currentIndex + 1} از {events.length}
              </span>
              <div className="flex items-center gap-1">
                {events.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      stopSpeaking();
                      setIsPlayingAudio(false);
                      setCurrentIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Listen Bar (Crucial for illiterate villagers) */}
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-950 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>پڑھنا نہیں آتا؟ بٹن دبائیں اور سنیں:</span>
          </div>

          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow ${
              isPlayingAudio
                ? 'bg-red-600 text-white animate-voice-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>آواز بند کریں</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>آواز میں سنیں (Listen)</span>
              </>
            )}
          </button>
        </div>

        {/* Event Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-stone-800 overflow-y-auto max-h-[65vh] font-nastaliq">
          {/* Quick Slide Switcher inside Popup */}
          {events.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {events.map((ev, idx) => (
                <button
                  key={ev.id || idx}
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setIsPlayingAudio(false);
                    setCurrentIndex(idx);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    idx === currentIndex
                      ? 'bg-emerald-800 text-amber-300 shadow'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                  }`}
                >
                  {idx === 0
                    ? '🌟 1. پورٹل کے فوائد'
                    : idx === 1
                    ? '📲 2. استعمال کا طریقہ'
                    : idx === 2
                    ? '🎙️ 3. صوتی مددگار'
                    : idx === 3
                    ? '🏥 4. کمیونٹی خدمات'
                    : `📢 خبر ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Banner Illustration Image inside Main Popup */}
          {!currentEvent.skipBannerImage && (
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-600/80 shadow-md bg-stone-950">
              <img
                src={currentEvent.imageUrl || '/banners/portal-benefits-banner.svg'}
                alt={currentEvent.title}
                className="w-full h-40 sm:h-52 object-cover"
              />
            </div>
          )}

          {/* Main Title */}
          <h2 className="text-lg sm:text-xl font-bold font-nastaliq text-emerald-950 leading-snug">
            {currentEvent.title}
          </h2>

          {/* Detailed Content (Preserves numbered step-by-step formatting) */}
          <div className="bg-emerald-50/80 p-4 rounded-2xl border-2 border-emerald-300 text-stone-900 text-xs sm:text-sm leading-loose whitespace-pre-line font-bold shadow-2xs">
            {currentEvent.content}
          </div>

          {/* PART A3: Compact Two-Line Uses & Benefits Strip inside Village News Popup */}
          {currentBenefitPair && (
            <div className="bg-emerald-950/95 border border-emerald-500 rounded-2xl px-3.5 py-2.5 text-white shadow-md space-y-1 pointer-events-none select-none">
              <p className="text-xs font-bold text-amber-200 font-nastaliq leading-[1.85]">
                {currentBenefitPair.useUrdu.trim().startsWith('استعمال:')
                  ? currentBenefitPair.useUrdu.trim()
                  : `استعمال: ${currentBenefitPair.useUrdu.trim()}`}
              </p>
              <p className="text-xs font-bold text-emerald-200 font-nastaliq leading-[1.85]">
                {currentBenefitPair.benefitUrdu.trim().startsWith('فائدہ:')
                  ? currentBenefitPair.benefitUrdu.trim()
                  : `فائدہ: ${currentBenefitPair.benefitUrdu.trim()}`}
              </p>
            </div>
          )}

          {/* Permanent Step-by-Step Summary of App Benefits & Uses in Main Popup */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-2 border-amber-400 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-2">
              <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                📌 رتہ کلاں جھنگ ایپ کے فوائد اور استعمال کا طریقہ (ترتیب سے)
              </h3>
              <span className="text-[10px] font-bold bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shrink-0">
                آسان گائیڈ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
              {/* Column 1: Ordered Benefits */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5">
                <strong className="block text-emerald-900 text-xs sm:text-sm border-b border-emerald-100 pb-1">
                  ✅ ایپ کے 5 بڑے فوائد (Benefits):
                </strong>
                <p>1. <strong>فوری کاریگر و روزگار:</strong> مستری، مزدور، ٹریکٹر، الیکٹریشن، درزی اور دکاندار کا نمبر گھر بیٹھے حاصل کریں۔</p>
                <p>2. <strong>بول کر تلاش:</strong> جو افراد پڑھ نہیں سکتے وہ مائیک دبا کر بولیں اور آواز میں جواب سنیں۔</p>
                <p>3. <strong>ہنگامی طبی مدد:</strong> ریسکیو 1122، ہسپتال، ڈاکٹر، بلڈ ڈونرز اور سیلابی پناہ گاہوں کی فوری معلومات۔</p>
                <p>4. <strong>مساجد، اسکول و منڈی:</strong> نماز اوقات، مفت AI اسکول، جھنگ گاڑیاں اور تازہ غلہ منڈی ریٹس۔</p>
                <p>5. <strong>مکمل رازداری:</strong> کسی کا ای میل، یوزر نیم یا پاس ورڈ ہرگز ظاہر نہیں کیا جاتا۔</p>
              </div>

              {/* Column 2: Ordered Uses */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
                <strong className="block text-amber-900 text-xs sm:text-sm border-b border-amber-100 pb-1">
                  📲 استعمال کے 5 آسان مراحل (How to Use):
                </strong>
                <p>1. <strong>پہلا قدم:</strong> اوپر سرچ بار میں نام لکھیں یا <strong>"بول کر پوچھیں"</strong> بٹن دبا کر بولیں۔</p>
                <p>2. <strong>دوسرا قدم:</strong> کارڈ پر <strong>"کال"</strong> یا <strong>"واٹس ایپ"</strong> بٹن دبا کر سیدھا رابطہ کریں یا <strong>"سنیں 🔊"</strong> دبائیں۔</p>
                <p>3. <strong>تیسرا قدم:</strong> اپنا کاروبار شامل کرنے کے لیے <strong>"+ اندراج"</strong> دبائیں اور اپنی ای میل و پاس ورڈ سے پروفائل بنائیں۔</p>
                <p>4. <strong>چوتھا قدم:</strong> مزدور بھائی کام کے لیے <strong>"👷 آج دستیاب مزدور"</strong> بٹن آن کریں۔</p>
                <p>5. <strong>پانچواں قدم:</strong> پاس ورڈ بھولنے پر صرف اپنی پروفائل کی رجسٹرڈ ای میل دے کر نیا پاس ورڈ بنائیں۔</p>
              </div>
            </div>
          </div>

          {/* Quick Meta Pills: Date, Time, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-bold text-stone-900">تاریخ:</span>
              <span className="text-stone-700 font-medium">{currentEvent.date}</span>
            </div>

            {currentEvent.time && (
              <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-stone-900">وقت:</span>
                <span className="text-stone-700 font-medium">{currentEvent.time}</span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <MapPin className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-bold text-stone-900">مقام:</span>
              <span className="text-stone-700 font-medium">{currentEvent.location}</span>
            </div>
          </div>

          {/* Super Admin Badge */}
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>جاری کردہ بذریعہ: ثمر سعید (سپر ایڈمن)</span>
            </span>
            <span className="text-[11px] text-stone-400">رتہ کلاں جھنگ</span>
          </div>
        </div>

        {/* Footer Actions: WhatsApp Ask & Share & Next/Prev */}
        <div className="bg-stone-50 p-3 sm:p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
            {/* Direct WhatsApp Inquiry Button */}
            <a
              href={`https://wa.me/923270019099?text=${encodeURIComponent(
                `السلام علیکم! رتہ کلاں پورٹل پر خبر "${currentEvent.title}" (مقام: ${currentEvent.location}) کے بارے میں رہنمائی یا سوال پوچھنا ہے۔`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 font-nastaliq"
              title="واٹس ایپ پر پوچھیں"
            >
              <span className="text-base">💬</span>
              <span>واٹس ایپ پر پوچھیں</span>
            </a>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareToWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-sm transition active:scale-95 font-nastaliq"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>شیئر کریں</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-2xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition"
              title="کاپی کریں"
            >
              {copiedShare ? (
                <span className="text-emerald-700 font-bold">✓ کاپی ہو گیا</span>
              ) : (
                <span>کاپی</span>
              )}
            </button>
          </div>

          {events.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                title="پچھلی خبر"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                title="اگلی خبر"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow transition text-center"
          >
            ٹھیک ہے، بند کریں
          </button>
        </div>
      </div>
    </div>
  );
};
