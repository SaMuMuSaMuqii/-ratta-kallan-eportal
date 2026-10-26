import React, { useState } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Volume2,
  VolumeX,
  Compass,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { VillageMosque, VillageSchool } from '../data/villagePlaces';
import { Language } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface VillagePlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'mosques' | 'schools';
  mosques: VillageMosque[];
  schools: VillageSchool[];
  lang: Language;
}

export const VillagePlacesModal: React.FC<VillagePlacesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'mosques',
  mosques,
  schools,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'mosques' | 'schools'>(initialTab);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeakMosque = (m: VillageMosque) => {
    if (activeAudioId === m.id) {
      stopSpeaking();
      setActiveAudioId(null);
      return;
    }
    const text = `رتہ کلاں مسجد: ${m.name}۔ پیش امام: ${m.imamName}۔ مقام: ${m.location}۔ گوگل میپ پر لائیو راستہ دیکھ سکتے ہیں۔`;
    setActiveAudioId(m.id);
    speakText(text, lang, () => setActiveAudioId(null));
  };

  const handleSpeakSchool = (s: VillageSchool) => {
    if (activeAudioId === s.id) {
      stopSpeaking();
      setActiveAudioId(null);
      return;
    }
    const text = `رتہ کلاں تعلیمی ادارہ: ${s.name}۔ سربراہ: ${s.headName}۔ مقام: ${s.location}۔`;
    setActiveAudioId(s.id);
    speakText(text, lang, () => setActiveAudioId(null));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-2xl border border-emerald-600/40">
              <Compass className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold font-nastaliq text-lg">
                رتہ کلاں جھنگ کی مساجد و تعلیمی ادارے
              </h3>
              <p className="text-xs text-emerald-200">
                تمام مساجد اور اسکولز کی تصاویر، رابطہ اور لائیو لوکیشن
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="bg-stone-100 p-2 border-b border-stone-200 flex gap-2">
          <button
            onClick={() => setActiveTab('mosques')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'mosques'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span>🕌 گاؤں کی مساجد ({mosques.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'schools'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>اسکولز و کالجز ({schools.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {activeTab === 'mosques' ? (
            <div className="space-y-3">
              <div className="text-xs bg-amber-50 p-2.5 rounded-2xl border border-amber-200 text-amber-950 font-semibold flex items-center gap-2">
                <span>🕌</span>
                <span>کسی بھی مسجد کی لائیو لوکیشن اور راستہ دیکھنے کے لیے بٹن دبائیں۔</span>
              </div>

              {mosques.map((m) => (
                <div
                  key={m.id}
                  className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm flex flex-col sm:flex-row gap-3"
                >
                  <div className="sm:w-44 h-36 relative overflow-hidden bg-stone-900 shrink-0">
                    <img
                      src={m.image}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-white text-[10px] font-bold">
                      {m.sectOrType}
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-base text-stone-900 font-nastaliq">
                          {m.name}
                        </h4>
                        <button
                          onClick={() => handleSpeakMosque(m)}
                          className={`p-1.5 rounded-xl transition ${
                            activeAudioId === m.id
                              ? 'bg-red-600 text-white animate-voice-pulse'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title="آواز سنیں"
                        >
                          {activeAudioId === m.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-stone-600 font-semibold mt-0.5">
                        امام مسجد: <span className="text-emerald-800">{m.imamName}</span>
                      </p>

                      <div className="text-xs text-stone-500 flex items-start gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{m.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/80">
                      {m.hasQuranAcademy ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          ✓ حفظ و ناظرہ قرآن کلاس
                        </span>
                      ) : (
                        <span />
                      )}

                      <a
                        href={m.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>لائیو لوکیشن و راستہ</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-emerald-950 font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>رتہ کلاں جھنگ کے سرکاری و نجی اسکولز اور کالجز کی تفصیل و تصاویر۔</span>
              </div>

              {schools.map((s) => (
                <div
                  key={s.id}
                  className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm flex flex-col sm:flex-row gap-3"
                >
                  <div className="sm:w-44 h-36 relative overflow-hidden bg-stone-900 shrink-0">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-white text-[10px] font-bold">
                      {s.level.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-base text-stone-900 font-nastaliq">
                          {s.name}
                        </h4>
                        <button
                          onClick={() => handleSpeakSchool(s)}
                          className={`p-1.5 rounded-xl transition ${
                            activeAudioId === s.id
                              ? 'bg-red-600 text-white animate-voice-pulse'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title="آواز سنیں"
                        >
                          {activeAudioId === s.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-stone-600 font-semibold mt-0.5">
                        سربراہ: <span className="text-emerald-800">{s.headName}</span>
                      </p>

                      <div className="text-xs text-stone-500 flex items-start gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{s.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/80">
                      <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        {s.studentsCountEstimate || 'تعلیمی سرگرمیاں'}
                      </span>

                      <a
                        href={s.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>اسکول لوکیشن میپ</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
