import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  Phone,
  Volume2,
  VolumeX,
  Navigation,
  Compass,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { VillageMosque, Language } from '../types';
import { translations } from '../data/translations';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';

interface MosquesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mosques: VillageMosque[];
  lang: Language;
  onRegisterMosque?: () => void;
  onEditMosqueTimetable?: (mosque: VillageMosque) => void;
}

export const MosquesModal: React.FC<MosquesModalProps> = ({
  isOpen,
  onClose,
  mosques,
  lang,
  onRegisterMosque,
  onEditMosqueTimetable,
}) => {
  const t = translations[lang];
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeakMosque = (m: VillageMosque) => {
    unlockAudioContext();
    if (activeAudioId === m.id) {
      stopSpeaking();
      setActiveAudioId(null);
      return;
    }

    const text =
      lang === 'pa'
        ? `${m.name}، رتہ کلاں۔ امام صاحب: ${m.imamName}۔ فجر: ${m.prayerTimes.fajr}، ظہر: ${m.prayerTimes.dhuhr}، عصر: ${m.prayerTimes.asr}، مغرب: غروب آفتاب، عشاء: ${m.prayerTimes.isha}، جمعہ: ${m.prayerTimes.jummah}۔ نماز عید الفطر وقت: ${m.eidUlFitrTime || '07:15 AM'}۔ نماز عید الاضحیٰ: ${m.eidUlAdhaTime || '07:00 AM'}۔`
        : `${m.name}، رتہ کلاں جھنگ۔ امام صاحب: ${m.imamName}۔ اوقات نماز: فجر ${m.prayerTimes.fajr}، ظہر ${m.prayerTimes.dhuhr}، عصر ${m.prayerTimes.asr}، مغرب غروب آفتاب، عشاء ${m.prayerTimes.isha}، نماز جمعہ ${m.prayerTimes.jummah}۔ نمازِ عید الفطر و شوال وقت: ${m.eidUlFitrTime || '07:15 AM'}، نمازِ عید الاضحیٰ وقت: ${m.eidUlAdhaTime || '07:00 AM'}۔`;

    setActiveAudioId(m.id);
    playNotificationChime('start');
    speakText(text, lang, () => setActiveAudioId(null), {
      isFemaleVillageVoice: true,
      rate: getSpeechRate(),
      pitch: 1.2,
      volume: 1.0,
    });
  };

  const handleClose = () => {
    stopSpeaking();
    setActiveAudioId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 rounded-2xl border border-emerald-700">
              <Compass className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold font-nastaliq text-lg leading-tight">
                {t.mosquesTitle}
              </h3>
              <p className="text-[11px] text-emerald-200">
                رتہ کلاں جھنگ کی تمام مساجد، لائیو لوکیشن اور اوقاتِ نماز و عیدین
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Mosque Bar */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-2">
          <div className="text-xs text-emerald-950 font-nastaliq">
            <span className="font-bold">کل مساجد: {mosques.length}</span>
            <span className="text-[11px] text-emerald-700 block">
              ہر مسجد کا امام اپنے مخصوص یوزر نیم و پاس ورڈ سے اوقات بدل سکتا ہے
            </span>
          </div>
          {onRegisterMosque && (
            <button
              onClick={() => {
                handleClose();
                onRegisterMosque();
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-nastaliq shadow cursor-pointer flex items-center gap-1"
            >
              <span>+ نئی مسجد شامل کریں</span>
            </button>
          )}
        </div>

        {/* Mosques List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {mosques.map((mosque) => (
            <div
              key={mosque.id}
              className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm"
            >
              {/* Image & Quick title */}
              <div className="relative h-36 sm:h-40 bg-emerald-950 overflow-hidden">
                {mosque.image ? (
                  <img
                    src={mosque.image}
                    alt={mosque.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-300/30">
                    <Compass className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
                <div className="absolute bottom-2.5 right-3 left-3 text-white min-w-0">
                  <h4 className="font-bold text-base sm:text-lg font-nastaliq text-amber-200 leading-tight truncate">
                    {mosque.name}
                  </h4>
                  <p className="text-xs text-stone-200 truncate">
                    امام: {mosque.imamName} {mosque.contact && `(${mosque.contact})`}
                  </p>
                </div>

                <button
                  onClick={() => handleSpeakMosque(mosque)}
                  className={`absolute top-2.5 right-2.5 p-2 rounded-full text-white backdrop-blur shadow z-10 cursor-pointer ${
                    activeAudioId === mosque.id
                      ? 'bg-red-600 animate-voice-pulse'
                      : 'bg-black/50 hover:bg-black/70'
                  }`}
                  title="نماز کا وقت سنیں"
                >
                  {activeAudioId === mosque.id ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Prayer Times Grid */}
              <div className="p-3.5 space-y-3 font-nastaliq">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 mb-2">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>اوقاتِ پنجگانہ نماز و جمعہ (رتہ کلاں):</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-xs">
                    <div className="bg-white p-1.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">فجر</span>
                      <strong className="text-stone-900">{mosque.prayerTimes.fajr}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">ظہر</span>
                      <strong className="text-stone-900">{mosque.prayerTimes.dhuhr}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">عصر</span>
                      <strong className="text-stone-900">{mosque.prayerTimes.asr}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">مغرب</span>
                      <strong className="text-stone-900">{mosque.prayerTimes.maghrib}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] text-stone-500 block">عشاء</span>
                      <strong className="text-stone-900">{mosque.prayerTimes.isha}</strong>
                    </div>
                    <div className="bg-amber-100 p-1.5 rounded-xl border border-amber-300">
                      <span className="text-[10px] text-amber-800 font-bold block">جمعہ مبارک</span>
                      <strong className="text-amber-950 font-bold">{mosque.prayerTimes.jummah}</strong>
                    </div>
                  </div>
                </div>

                {/* EID PRAYER TIMINGS ROW */}
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 text-xs">
                  <span className="font-bold text-amber-950 block mb-1 text-[11px]">
                    اوقاتِ نماز عیدین (رتہ کلاں):
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 block">عید الفطر (عید شوال)</span>
                      <strong className="text-stone-900 font-bold text-xs">
                        {mosque.eidUlFitrTime || '07:15 AM'}
                      </strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-800 block">عید الاضحیٰ</span>
                      <strong className="text-stone-900 font-bold text-xs">
                        {mosque.eidUlAdhaTime || '07:00 AM'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Location & Map button */}
                <div className="flex items-center justify-between gap-2 text-xs text-stone-600">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{mosque.location}</span>
                  </div>

                  <a
                    href={mosque.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow shrink-0 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>لائیو لوکیشن</span>
                  </a>
                </div>

                {/* Facilities */}
                {mosque.features && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mosque.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-lg border border-stone-200 font-medium"
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Edit Button with Credentials Lock */}
                {onEditMosqueTimetable && (
                  <button
                    onClick={() => {
                      handleClose();
                      onEditMosqueTimetable(mosque);
                    }}
                    className="w-full py-2 bg-stone-100 hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>اوقات و عید نماز کا وقت ایڈٹ کریں (امام لاگ ان)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
