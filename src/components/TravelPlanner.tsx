import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  ArrowRightLeft,
  Compass,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { speakText, stopSpeaking } from '../utils/speech';
import { Language } from '../types';

interface TravelPlannerProps {
  lang: Language;
}

export const TravelPlanner: React.FC<TravelPlannerProps> = ({ lang }) => {
  const [origin, setOrigin] = useState('رتہ کلاں، جھنگ (Ratta Kallan, Jhang)');
  const [destination, setDestination] = useState('جھنگ صدر / کچہری بازار (Jhang Sadar)');
  const [arrivalEstimate, setArrivalEstimate] = useState('تقریباً 35 منٹ (بذریعہ بائیک یا رکشہ)');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const quickDestinations = [
    { name: 'جھنگ صدر (Jhang City)', time: '35 منٹ' },
    { name: 'شورکوٹ کینٹ (Shorkot)', time: '55 منٹ' },
    { name: 'فیصل آباد بائی پاس (Faisalabad)', time: '1 گھنٹہ 40 منٹ' },
    { name: 'ٹوبہ ٹیک سنگھ (Toba Tek Singh)', time: '1 گھنٹہ 15 منٹ' },
    { name: 'چنیوٹ شریف (Chiniot)', time: '1 گھنٹہ 30 منٹ' },
  ];

  const handleSelectQuick = (dest: string, time: string) => {
    setDestination(dest);
    setArrivalEstimate(`تقریباً ${time}`);
  };

  const handleOpenGoogleMapsRoute = () => {
    const originEnc = encodeURIComponent(origin);
    const destEnc = encodeURIComponent(destination);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originEnc}&destination=${destEnc}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const text = `رتہ کلاں سے سفر کا راستہ: روانگی: ${origin}۔ منزل: ${destination}۔ آمد کا متوقع وقت: ${arrivalEstimate}۔ گوگل میپ بٹن دبا کر لائیو راستہ دیکھ سکتے ہیں۔`;
      speakText(text, lang, () => setIsPlayingAudio(false));
    }
  };

  return (
    <div className="bg-stone-800/90 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-5 text-white shadow-xl space-y-3.5">
      <div className="flex items-center justify-between border-b border-stone-700/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600/30 rounded-2xl border border-emerald-500/40">
            <Compass className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base font-nastaliq leading-tight text-amber-300">
              رتہ کلاں سفری رہنما و لائیو راستہ (Travel & Route Navigator)
            </h4>
            <p className="text-[11px] text-stone-300">
              گاؤں سے کسی بھی دوسرے شہر یا قریبی گاؤں جانے کے لیے راستہ تلاش کریں
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleVoice}
          className={`p-1.5 rounded-xl text-xs transition ${
            isPlayingAudio ? 'bg-red-600 animate-voice-pulse' : 'bg-stone-700 hover:bg-stone-600'
          }`}
          title="آواز میں سنیں"
        >
          {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Origin (روانگی) */}
      <div className="space-y-1">
        <label className="block text-[11px] font-bold text-emerald-300 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>روانگی / نقطہ آغاز (Starting Location / Home):</span>
        </label>
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="مثلاً: رتہ کلاں، جھنگ یا اپنا محلہ"
          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
        />
      </div>

      {/* Destination (منزل) */}
      <div className="space-y-1">
        <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
          <span>منزل / جہاں جانا ہے (Destination):</span>
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            setArrivalEstimate('گوگل میپ پر چیک کریں');
          }}
          placeholder="مثلاً: جھنگ کچہری، فیصل آباد، یا قریبی چک"
          className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
        />
      </div>

      {/* Quick Destination Pills */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {quickDestinations.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectQuick(q.name, q.time)}
            className="text-[10px] px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-700 hover:border-emerald-500 text-stone-200 transition"
          >
            {q.name}
          </button>
        ))}
      </div>

      {/* Arrival (وقت آمد و اندازہ) */}
      <div className="bg-stone-900/90 p-2.5 rounded-2xl border border-stone-700/80 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-stone-300 font-semibold">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>وقت آمد و فاصلہ (Arrival Estimate):</span>
        </span>
        <span className="font-bold text-amber-300">{arrivalEstimate}</span>
      </div>

      {/* Action Button: Open Google Maps */}
      <button
        onClick={handleOpenGoogleMapsRoute}
        className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
      >
        <Navigation className="w-4 h-4" />
        <span>گوگل میپ پر لائیو راستہ و ڈائریکشنز کھولیں (Live Navigation)</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
