import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  ArrowRight,
  Clock,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { speakText, stopSpeaking } from '../utils/speech';

interface RoutePlannerSectionProps {
  lang: Language;
}

export const RoutePlannerSection: React.FC<RoutePlannerSectionProps> = ({ lang }) => {
  const t = translations[lang];

  const [origin, setOrigin] = useState('رتہ کلاں، ضلع جھنگ');
  const [destination, setDestination] = useState('جھنگ سٹی (لاری اڈا و کچہری بازار)');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Common quick destinations for Ratta Kallan villagers
  const popularDestinations = [
    'جھنگ سٹی (Jhang City)',
    'شورکوٹ (Shorkot)',
    'فیصل آباد (Faisalabad)',
    'چنیوٹ (Chiniot)',
    'گوجرہ (Gojra)',
    'ٹوبہ ٹیک سنگھ (Toba Tek Singh)',
  ];

  const handleOpenGoogleMapsRoute = () => {
    const originEncoded = encodeURIComponent(origin);
    const destEncoded = encodeURIComponent(destination);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originEncoded}&destination=${destEncoded}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    const text =
      lang === 'pa'
        ? `سفر پلانر: رتہ کلاں توں ${destination} جان لئی گوگل میپ تے پورا راہ ویکھو۔ روانگی: ${origin}۔`
        : `سفر و راستہ پلانر: روانگی ${origin} سے منزل ${destination} تک لائیو گوگل میپ نیویگیشن اور فاصلہ چیک کریں۔`;

    setIsPlayingAudio(true);
    speakText(text, lang, () => setIsPlayingAudio(false));
  };

  return (
    <div className="bg-stone-800/95 border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-5 text-white shadow-xl space-y-4">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-stone-700 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-700 rounded-2xl shadow">
            <Compass className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="font-bold text-base font-nastaliq text-amber-300 leading-tight">
              {t.routePlannerTitle}
            </h4>
            <p className="text-[11px] text-stone-300">
              رتہ کلاں سے کسی بھی شہر یا قریبی گاؤں جانے کے لیے راستہ و وقت چیک کریں
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleVoice}
          className={`p-2 rounded-xl text-xs font-bold transition shadow ${
            isPlayingAudio
              ? 'bg-red-600 animate-voice-pulse'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
          }`}
          title="آواز میں سنیں"
        >
          {isPlayingAudio ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Form Fields: Home / Origin & Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Origin / Home */}
        <div className="space-y-1">
          <label className="font-bold text-emerald-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.homeOrigin}:</span>
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="مثلاً: رتہ کلاں، جھنگ"
            className="w-full rounded-xl bg-stone-900 border border-stone-600 px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Destination */}
        <div className="space-y-1">
          <label className="font-bold text-amber-300 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.destination}:</span>
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="مثلاً: جھنگ سٹی یا شورکوٹ"
            className="w-full rounded-xl bg-stone-900 border border-stone-600 px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Quick Destination Pills */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-stone-400 font-bold block">
          مشہور شہر و مقامات (ایک کلک سے منتخب کریں):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {popularDestinations.map((city, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setDestination(city)}
              className="text-[11px] px-2.5 py-1 rounded-xl bg-stone-700/80 hover:bg-emerald-700 text-stone-200 hover:text-white border border-stone-600 transition"
            >
              📍 {city}
            </button>
          ))}
        </div>
      </div>

      {/* Action: Open Map route */}
      <div className="pt-1 flex items-center justify-between gap-3">
        <div className="text-[11px] text-stone-300 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>جھنگ سٹی فاصلہ: تقریباً 25 تا 35 منٹ</span>
        </div>

        <button
          onClick={handleOpenGoogleMapsRoute}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
        >
          <Navigation className="w-4 h-4 text-amber-300" />
          <span>{t.trackLiveLocation}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
