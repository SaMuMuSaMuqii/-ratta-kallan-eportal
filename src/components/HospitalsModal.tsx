import React, { useState } from 'react';
import {
  X,
  Phone,
  PhoneCall,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
  ShieldAlert,
  Activity,
  HeartPulse,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { VillageHospital, Language } from '../types';
import {
  speakText,
  stopSpeaking,
  playNotificationChime,
  getSpeechRate,
  setSpeechRate,
  unlockAudioContext,
} from '../utils/speech';

interface HospitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: VillageHospital[];
  lang: Language;
  onEditHospital?: (hospital: VillageHospital) => void;
}

export const HospitalsModal: React.FC<HospitalsModalProps> = ({
  isOpen,
  onClose,
  hospitals,
  lang,
  onEditHospital,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(getSpeechRate());

  if (!isOpen) return null;

  const handleSpeedChange = (speed: number) => {
    setSpeechRate(speed);
    setCurrentSpeed(speed);
    playNotificationChime('start');
  };

  const handleToggleSpeak = (hosp: VillageHospital) => {
    unlockAudioContext();
    if (playingId === hosp.id) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }

    stopSpeaking();
    setPlayingId(hosp.id);
    playNotificationChime('start');

    const speechText = `${hosp.name}۔ ${hosp.categoryUrdu}۔ پتہ: ${hosp.address}۔ فاصلہ: ${hosp.distance}۔ اوقات: ${hosp.timing}۔ انچارج: ${hosp.doctorInCharge || 'سٹاف'}۔ ایمرجنسی فون نمبر: ${hosp.contact}۔ اہم سہولیات: ${hosp.services.join('، ')}۔`;

    speakText(
      speechText,
      lang,
      () => setPlayingId(null),
      {
        isFemaleVillageVoice: true,
        rate: getSpeechRate(),
        pitch: 1.2,
      }
    );
  };

  const filteredHospitals = hospitals.filter((h) => {
    if (filter === '24hours') return h.is24Hours;
    if (filter === 'hospital') return h.category === 'hospital' || h.category === 'rhc';
    if (filter === 'ambulance') return h.category === 'ambulance';
    if (filter === 'clinic') return h.category === 'clinic' || h.category === 'pharmacy';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-red-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white backdrop-blur-md shadow-inner">
              <HeartPulse className="w-7 h-7 text-red-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-nastaliq">
                  ہسپتال اور ایمرجنسی طبی خدمات
                </h2>
                <span className="bg-red-500/80 text-white text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                  24/7 الرٹ
                </span>
              </div>
              <p className="text-red-100 text-xs sm:text-sm font-sans">
                DHQ Hospital Jhang, RHC, Rescue 1122 & Medical Stores
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95"
            aria-label="بند کریں"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Speed Adjustment Bar & Emergency Quick Call Banner */}
        <div className="bg-red-50 px-4 py-2.5 border-b border-red-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Call 1122 */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-red-900 flex items-center gap-1 font-nastaliq text-sm">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              فوری ریسکیو:
            </span>
            <a
              href="tel:1122"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              1122 (مفت کال)
            </a>
            <a
              href="tel:0479200234"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              ڈی ایچ کیو جھنگ
            </a>
          </div>

          {/* Voice Speed Selector (1.0x, 1.15x, 1.35x) */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-red-200 shadow-xs">
            <Volume2 className="w-3.5 h-3.5 text-red-700" />
            <span className="text-slate-600 font-nastaliq">آواز اسپیڈ:</span>
            {[
              { val: 1.0, label: '1.0x' },
              { val: 1.15, label: '1.15x (تیز)' },
              { val: 1.35, label: '1.35x (بہت تیز)' },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => handleSpeedChange(s.val)}
                className={`px-2 py-0.5 rounded-full text-xs font-bold transition ${
                  currentSpeed === s.val
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-red-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'تمام طبی مراکز (All)' },
            { id: '24hours', label: '🚨 24 گھنٹے کھلی ایمرجنسی' },
            { id: 'hospital', label: '🏥 ہسپتال و RHC' },
            { id: 'ambulance', label: '🚑 ایمبولینس سروسز' },
            { id: 'clinic', label: '💊 کلینک و فارمیسی' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-nastaliq font-bold transition whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-red-700 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hospitals Content List */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          {filteredHospitals.map((hosp) => {
            const isPlaying = playingId === hosp.id;
            return (
              <div
                key={hosp.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border transition-all duration-300 relative overflow-hidden ${
                  isPlaying
                    ? 'border-2 border-red-500 shadow-red-100 ring-2 ring-red-300'
                    : 'border-slate-200 hover:border-red-300 hover:shadow-md'
                }`}
              >
                {/* 24/7 Top Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                        hosp.category === 'ambulance'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : hosp.category === 'hospital'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      {hosp.categoryUrdu}
                    </span>

                    {hosp.is24Hours && (
                      <span className="bg-red-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                        <Activity className="w-3 h-3" />
                        24 گھنٹے اوپن
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    {hosp.distance}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-nastaliq">
                      {hosp.name}
                    </h3>

                    <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{hosp.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-emerald-800">{hosp.timing}</span>
                      </div>
                      {hosp.doctorInCharge && (
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>انچارج: {hosp.doctorInCharge}</span>
                        </div>
                      )}
                    </div>

                    {/* Services Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {hosp.services.map((srv, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2 py-0.5 rounded-lg border border-slate-200 font-nastaliq"
                        >
                          ✓ {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-row sm:flex-col items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                    {/* Primary Direct Call Button */}
                    <a
                      href={`tel:${hosp.contact.replace(/\D/g, '')}`}
                      className="flex-1 sm:flex-none w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm active:scale-95 transition"
                    >
                      <PhoneCall className="w-4 h-4 animate-bounce" />
                      <span className="font-nastaliq">کال ملائیں</span>
                      <span className="font-mono text-xs opacity-90">({hosp.contact})</span>
                    </a>

                    {/* Audio Listen Button */}
                    <button
                      onClick={() => handleToggleSpeak(hosp)}
                      className={`flex-1 sm:flex-none w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        isPlaying
                          ? 'bg-red-600 text-white animate-pulse shadow-md'
                          : 'bg-red-100 hover:bg-red-200 text-red-800 border border-red-300'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span className="font-nastaliq">آواز روکیں</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-red-600" />
                          <span className="font-nastaliq">تفصیل سنیں 🔊</span>
                        </>
                      )}
                    </button>

                    {/* Google Map Directions */}
                    {hosp.mapUrl && (
                      <a
                        href={hosp.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-200 transition"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-nastaliq">راستہ دیکھیں</span>
                      </a>
                    )}

                    {onEditHospital && (
                      <button
                        type="button"
                        onClick={() => onEditHospital(hosp)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-slate-300 transition cursor-pointer font-nastaliq"
                        title="طبی انچارج لاگ ان"
                      >
                        <Activity className="w-3 h-3 text-red-600" />
                        <span>انچارج لاگ ان 🔒</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="font-nastaliq">
            ایمرجنسی میں ہمیشہ ریسکیو 1122 یا ڈی ایچ کیو ہسپتال جھنگ کو فوری کال کریں۔
          </span>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold font-nastaliq transition"
          >
            بند کریں
          </button>
        </div>
      </div>
    </div>
  );
};
