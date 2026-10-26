import React, { useState } from 'react';
import { ShieldAlert, Volume2, VolumeX, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  lang: Language;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  lang,
}) => {
  const t = translations[lang];
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const audioTermsText =
    lang === 'pa'
      ? 'رتہ کلاں پورٹل دے خاص اصول۔ دھیان نال سنو: اول: پورٹل وچ کسے وی عورت یا مائی دا فون نمبر پانا سختی نال منع اے۔ دوم: مذہبی پروموشن یا فرقہ واریت توں سخت پرہیز کرو، ایہ پورٹل صرف روزگار لئی اے۔ غلط یا کوڑ اندراج تے سپر ایڈمن ثمر سعید ولوں بندہ پکے طور تے بلاک کیتا جائے گا۔'
      : 'رتہ کلاں جھنگ پورٹل کے اہم قواعد و ضوابط۔ توجہ سے سنیں: پہلا اصول: اس پورٹل پر کسی بھی خاتون، عورت یا فیمل کا موبائل نمبر یا تصویر شامل کرنا سختی سے منع ہے اور یہ غیر اخلاقی و قانونی جرم ہے۔ دوسرا اصول: مذہبی پروموشن اور فرقہ واریت سے سخت پرہیز کریں۔ یہ پورٹل خالصتاً رتہ کلاں کے بھائیوں کے روزگار اور مدد کے لیے ہے۔ کسی بھی خلاف ورزی پر سپر ایڈمن ثمر سعید فوری طور پر نمبر حذف اور بلاک کر دیں گے۔';

  const handleToggleVoice = () => {
    unlockAudioContext();
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playNotificationChime('start');
      speakText(audioTermsText, lang, () => setIsPlayingAudio(false), {
        isFemaleVillageVoice: true,
        rate: getSpeechRate(),
        pitch: 1.0,
      });
    }
  };

  const handleClose = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    onClose();
  };

  const handleAccept = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3">
      <div className="bg-white border-2 border-amber-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-2xl backdrop-blur shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-nastaliq leading-tight">
                {t.termsTitle}
              </h2>
              <p className="text-[10px] sm:text-xs text-amber-100">
                رتہ کلاں، جھنگ — گاؤں کے احترام، امن اور روزگار کا ضابطہ
              </p>
            </div>
          </div>

          {/* Prominent Header Skip Button */}
          <button
            onClick={handleClose}
            className="px-2.5 py-1 bg-black/40 hover:bg-black/60 text-amber-200 hover:text-white rounded-xl text-xs font-bold font-nastaliq border border-amber-300/40 flex items-center gap-1 cursor-pointer transition shadow"
            title="بند کریں"
          >
            <X className="w-3.5 h-3.5" />
            <span>اسکیپ کریں (Skip)</span>
          </button>
        </div>

        {/* Voice Audio Listen Bar */}
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 text-xs sm:text-sm font-semibold font-nastaliq">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>قواعد و ضوابط آواز میں سنیں:</span>
          </div>
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow ${
              isPlayingAudio
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>آواز روکیں</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>ابھی سنیں (Audio) 🔊</span>
              </>
            )}
          </button>
        </div>

        {/* Content body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto max-h-[55vh] space-y-3 text-stone-800 text-right leading-relaxed">
          {/* Main Strict Rule Box 1: No Females */}
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-3 text-red-900 shadow-sm">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
              <span className="text-base">⚠️</span>
              <h4 className="font-nastaliq text-base">{t.femaleRuleWarning}</h4>
            </div>
            <p className="text-xs sm:text-sm font-urdu-clean text-red-800 leading-relaxed font-medium">
              {t.femaleRuleDetail}
            </p>
          </div>

          {/* Main Strict Rule Box 2: Avoid Religious Promotion */}
          <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-3 text-amber-950 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <span className="text-base">🚫</span>
              <h4 className="font-nastaliq text-base">{t.religiousRuleWarning}</h4>
            </div>
            <p className="text-xs sm:text-sm font-urdu-clean text-amber-900 leading-relaxed font-medium">
              {t.religiousRuleDetail}
            </p>
          </div>

          {/* Helpline Callout in Terms */}
          <div className="bg-stone-100 p-2.5 rounded-xl border border-stone-300 flex items-center justify-between text-xs font-nastaliq">
            <div>
              <span className="font-bold text-stone-900 block">کسی بھی خلاف ورزی کی فوری اطلاع:</span>
              <span className="text-stone-600">سپر ایڈمن ثمر سعید آفیشل ہیلپ لائن</span>
            </div>
            <a
              href="tel:03270019099"
              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs shadow flex items-center gap-1 font-mono"
            >
              📞 0327-0019099
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-3 border-t border-stone-200 flex items-center justify-between gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-200 text-xs font-semibold font-nastaliq transition cursor-pointer"
          >
            اسکیپ کریں / بند کریں
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition font-nastaliq cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>میں نے تمام شرائط قبول کیں (ٹھیک ہے)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
