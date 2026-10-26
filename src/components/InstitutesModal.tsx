import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  MapPin,
  Clock,
  Phone,
  Volume2,
  VolumeX,
  Navigation,
  BookOpen,
} from 'lucide-react';
import { VillageInstitute, Language } from '../types';
import { translations } from '../data/translations';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';

interface InstitutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutes: VillageInstitute[];
  lang: Language;
  onRegisterInstitute?: () => void;
  onEditInstituteTimetable?: (institute: VillageInstitute) => void;
}

export const InstitutesModal: React.FC<InstitutesModalProps> = ({
  isOpen,
  onClose,
  institutes,
  lang,
  onRegisterInstitute,
  onEditInstituteTimetable,
}) => {
  const t = translations[lang];
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeakInstitute = (inst: VillageInstitute) => {
    unlockAudioContext();
    if (activeAudioId === inst.id) {
      stopSpeaking();
      setActiveAudioId(null);
      return;
    }

    const text =
      lang === 'pa'
        ? `${inst.name}، رتہ کلاں۔ ہیڈ: ${inst.headName}۔ کلاساں: ${inst.classesOffered}۔ ویلا: ${inst.timing}۔ تھاں: ${inst.location}۔`
        : `${inst.name}، رتہ کلاں جھنگ۔ ہیڈ انچارج: ${inst.headName}۔ کلاسز: ${inst.classesOffered}۔ اوقات: ${inst.timing}۔ پتہ: ${inst.location}۔`;

    setActiveAudioId(inst.id);
    playNotificationChime('start');
    speakText(text, lang, () => setActiveAudioId(null), {
      isFemaleVillageVoice: true,
      rate: getSpeechRate(),
      pitch: 1.2,
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
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-teal-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-800 rounded-2xl border border-blue-700">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold font-nastaliq text-lg leading-tight">
                {t.schoolsTitle}
              </h3>
              <p className="text-[11px] text-blue-200">
                رتہ کلاں کے تمام اسکولز، کالج پوائنٹ، ٹائم ٹیبل اور تعلیمی ادارے
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add School Bar */}
        <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-2">
          <div className="text-xs text-blue-950 font-nastaliq">
            <span className="font-bold">کل تعلیمی ادارے: {institutes.length}</span>
            <span className="text-[11px] text-blue-700 block">پرنسپل اپنے پاس ورڈ سے ٹائم ٹیبل و معلومات اپڈیٹ کر سکتے ہیں</span>
          </div>
          {onRegisterInstitute && (
            <button
              onClick={() => {
                handleClose();
                onRegisterInstitute();
              }}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold font-nastaliq shadow cursor-pointer flex items-center gap-1"
            >
              <span>+ نیا سکول درج کریں</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {institutes.map((inst) => (
            <div
              key={inst.id}
              className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm"
            >
              {/* Media image */}
              <div className="relative h-32 sm:h-36 bg-blue-950">
                <img
                  src={inst.image}
                  alt={inst.name}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />
                <div className="absolute bottom-2.5 right-3 text-white">
                  <h4 className="font-bold text-base font-nastaliq text-amber-200 leading-tight">
                    {inst.name}
                  </h4>
                  <p className="text-xs text-stone-300">
                    سربراہ / پرنسپل: {inst.headName}
                  </p>
                </div>

                <button
                  onClick={() => handleSpeakInstitute(inst)}
                  className={`absolute top-2.5 right-2.5 p-2 rounded-full text-white backdrop-blur shadow z-10 ${
                    activeAudioId === inst.id
                      ? 'bg-red-600 animate-voice-pulse'
                      : 'bg-black/50 hover:bg-black/70'
                  }`}
                  title="تفصیل سنیں"
                >
                  {activeAudioId === inst.id ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Body */}
              <div className="p-3.5 space-y-2.5 font-nastaliq">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2.5 text-xs text-blue-950 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <strong>کلاسز:</strong>
                    <span>{inst.classesOffered}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <strong>اوقات:</strong>
                    <span>{inst.timing}</span>
                  </div>
                </div>

                {/* Timetable Period List */}
                {inst.timetableSchedule && inst.timetableSchedule.length > 0 && (
                  <div className="bg-white p-2.5 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
                    <span className="font-bold text-stone-800 block text-[11px] text-blue-900">
                      روزانہ پیریڈز و ٹائم ٹیبل:
                    </span>
                    <div className="space-y-1">
                      {inst.timetableSchedule.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 bg-stone-50 rounded-xl"
                        >
                          <span className="font-bold text-stone-700">{item.period}</span>
                          <span className="text-emerald-700 font-semibold">{item.subject}</span>
                          <span className="text-stone-500 font-mono text-[10px]">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-xs text-stone-600">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{inst.location}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {inst.contact && (
                      <a
                        href={`tel:${inst.contact}`}
                        className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow transition"
                        title="رابطہ کریں"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a
                      href={inst.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>میپ لوکیشن</span>
                    </a>
                  </div>
                </div>

                {/* Edit Timetable button */}
                {onEditInstituteTimetable && (
                  <button
                    onClick={() => {
                      handleClose();
                      onEditInstituteTimetable(inst);
                    }}
                    className="w-full py-2 bg-stone-100 hover:bg-blue-50 text-blue-900 border border-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>🔒 ٹائم ٹیبل و پرنسپل ایڈٹ کریں (لاگ ان درکار)</span>
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
