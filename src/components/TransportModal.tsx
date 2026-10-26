import React, { useState } from 'react';
import {
  X,
  Bus,
  Clock,
  Phone,
  MessageCircle,
  Volume2,
  VolumeX,
  MapPin,
  Calendar,
  AlertCircle,
  DollarSign,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { VillageTransport, Language } from '../types';
import { translations } from '../data/translations';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';

interface TransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transports: VillageTransport[];
  lang: Language;
  onRegisterTransport?: () => void;
  onEditTransport?: (transport: VillageTransport) => void;
}

export const TransportModal: React.FC<TransportModalProps> = ({
  isOpen,
  onClose,
  transports,
  lang,
  onRegisterTransport,
  onEditTransport,
}) => {
  const t = translations[lang];
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeakTransport = (v: VillageTransport) => {
    unlockAudioContext();
    if (activeAudioId === v.id) {
      stopSpeaking();
      setActiveAudioId(null);
      return;
    }

    const stopsText = v.stopsSchedule
      .map((s) => `${s.stopName} وقت ${s.time}`)
      .join('، پھر ');

    const text =
      lang === 'pa'
        ? `گڈی نمبر ${v.vehicleNumber}۔ ڈرائیور: ${v.driverName}۔ فون: ${v.driverMobile}۔ روانگی: ${v.departureTime}۔ جھنگ پہنچن دا ویلا: ${v.arrivalTime}۔ کرایہ: ${v.fare}۔ روٹ تے اسٹاپس: ${stopsText}۔`
        : `گاڑی نمبر ${v.vehicleNumber}۔ ڈرائیور کا نام: ${v.driverName}۔ رابطہ موبائل: ${v.driverMobile}۔ اڈا رتہ کلاں سے روانگی کا وقت: ${v.departureTime}۔ جھنگ سٹی پہنچنے کا وقت: ${v.arrivalTime}۔ کرایہ: ${v.fare}۔ اسٹاپس کے اوقات: ${stopsText}۔`;

    setActiveAudioId(v.id);
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
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 rounded-2xl border border-emerald-700">
              <Bus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold font-nastaliq text-lg leading-tight">
                {t.transportTitle}
              </h3>
              <p className="text-[11px] text-emerald-200">
                گاڑی کا نمبر، ڈرائیور، روانگی، آمد، کرایہ اور بس اسٹاپس کے اوقات
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

        {/* Quick Add Transport Bar */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-2">
          <div className="text-xs text-emerald-950 font-nastaliq">
            <span className="font-bold">کل رجسٹرڈ گاڑیاں: {transports.length}</span>
            <span className="text-[11px] text-emerald-700 block">کوئی بھی ڈرائیور یا شہری اپنی گاڑی و روٹ ٹائم شامل کر سکتا ہے</span>
          </div>
          {onRegisterTransport && (
            <button
              onClick={() => {
                handleClose();
                onRegisterTransport();
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-nastaliq shadow cursor-pointer flex items-center gap-1"
            >
              <span>+ نئی گاڑی درج کریں</span>
            </button>
          )}
        </div>

        {/* Transport List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-300 text-xs text-amber-950 flex items-center justify-between">
            <span>
              💡 رتہ کلاں سے جھنگ جانے والے مسافر گاڑی کا وقت دیکھ کر اڈے پر پہنچیں۔
            </span>
            <span className="font-bold text-emerald-800">کل گاڑیاں: {transports.length}</span>
          </div>

          {transports.map((veh) => {
            const cleanMobile = veh.driverMobile.replace(/\D/g, '');
            const whatsappNumber = cleanMobile.startsWith('0')
              ? '92' + cleanMobile.slice(1)
              : cleanMobile;

            return (
              <div
                key={veh.id}
                className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm"
              >
                {/* Vehicle Image & Header */}
                <div className="relative h-36 bg-stone-900 overflow-hidden">
                  <img
                    src={veh.image}
                    alt={veh.vehicleNumber}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/30" />

                  <div className="absolute bottom-2.5 right-3 text-white">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-400 text-stone-950 inline-block mb-1 shadow">
                      {veh.vehicleNumber}
                    </span>
                    <h4 className="font-bold text-base font-nastaliq text-white leading-tight">
                      {veh.title}
                    </h4>
                    <p className="text-xs text-stone-300">
                      ڈرائیور: {veh.driverName}
                    </p>
                  </div>

                  {/* Audio button */}
                  <button
                    onClick={() => handleSpeakTransport(veh)}
                    className={`absolute top-2.5 right-2.5 p-2 rounded-full text-white backdrop-blur shadow z-10 ${
                      activeAudioId === veh.id
                        ? 'bg-red-600 animate-voice-pulse'
                        : 'bg-black/50 hover:bg-black/70'
                    }`}
                    title="اوقات و اسٹاپس سنیں"
                  >
                    {activeAudioId === veh.id ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Details Body */}
                <div className="p-3.5 space-y-3">
                  {/* Timings & Fare Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-2xl border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-500 block">روانگی (رتہ کلاں)</span>
                      <strong className="text-emerald-800 text-xs block mt-0.5">
                        {veh.departureTime}
                      </strong>
                    </div>

                    <div className="bg-white p-2 rounded-2xl border border-stone-200 text-center">
                      <span className="text-[10px] text-stone-500 block">آمد (جھنگ اڈا)</span>
                      <strong className="text-blue-800 text-xs block mt-0.5">
                        {veh.arrivalTime}
                      </strong>
                    </div>

                    <div className="bg-amber-100 p-2 rounded-2xl border border-amber-300 text-center">
                      <span className="text-[10px] text-amber-900 font-bold block">کرایہ (Fare)</span>
                      <strong className="text-amber-950 text-xs block mt-0.5">
                        {veh.fare}
                      </strong>
                    </div>
                  </div>

                  {/* Bus Stops & Arrival Times Timetable */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>کس بس اسٹاپ پر کس وقت پہنچے گی؟</span>
                    </span>

                    <div className="space-y-1.5 text-xs">
                      {veh.stopsSchedule.map((st, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-stone-200"
                        >
                          <span className="font-semibold text-stone-800">
                            {i + 1}. {st.stopName}
                          </span>
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                            {st.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: Call & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${veh.driverMobile}`}
                      className="py-2.5 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>کال ڈرائیور ({veh.driverMobile})</span>
                    </a>

                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واٹس ایپ</span>
                    </a>
                  </div>

                  {onEditTransport && (
                    <button
                      type="button"
                      onClick={() => onEditTransport(veh)}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-300 transition cursor-pointer font-nastaliq"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                      <span>ڈرائیور سب-لاگ ان (کرایہ و اوقات ایڈٹ کریں) 🔒</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
