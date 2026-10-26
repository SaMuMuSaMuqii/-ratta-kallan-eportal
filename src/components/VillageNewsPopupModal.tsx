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
import { VillageNewsEvent, Language, EventCategory } from '../types';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';

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
        <div className="p-5 sm:p-6 space-y-4 text-stone-800 overflow-y-auto max-h-[60vh]">
          {/* Main Title */}
          <h2 className="text-xl sm:text-2xl font-bold font-nastaliq text-stone-900 leading-snug">
            {currentEvent.title}
          </h2>

          {/* Quick Meta Pills: Date, Time, Location */}
          <div className="grid grid-cols-1 gap-2 text-xs">
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

          {/* Detailed Content */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 text-stone-900 text-sm sm:text-base leading-relaxed">
            <p className="font-medium">{currentEvent.content}</p>
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
