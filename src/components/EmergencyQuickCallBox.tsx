import React from 'react';
import { PhoneCall, HeartPulse, ShieldAlert, Ambulance, Activity } from 'lucide-react';
import { Language } from '../types';

interface EmergencyQuickCallBoxProps {
  lang: Language;
  onOpenHospitals: () => void;
}

export const EmergencyQuickCallBox: React.FC<EmergencyQuickCallBoxProps> = ({
  lang,
  onOpenHospitals,
}) => {
  return (
    <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-900 text-white rounded-3xl p-3 sm:p-4 mb-3 shadow-lg border-2 border-red-400 relative overflow-hidden font-nastaliq">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow animate-pulse">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-amber-300 leading-tight">
              ہنگامی و طبی ایمرجنسی (1-Tap Emergency Quick Call)
            </h4>
            <p className="text-[10px] text-red-200">
              رتہ کلاں اور اردگرد فوری طبی امداد — کسی بھی ایمرجنسی میں فوری بٹن دبائیں
            </p>
          </div>
        </div>

        <button
          onClick={onOpenHospitals}
          className="text-[11px] px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl transition cursor-pointer"
        >
          تمام ہسپتال ➔
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* Rescue 1122 */}
        <a
          href="tel:1122"
          className="bg-white/10 hover:bg-white/25 border border-red-300/40 rounded-2xl p-2 flex flex-col items-center justify-center text-center transition active:scale-95 group"
          title="ریسکیو 1122 کال کریں"
        >
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center mb-1 group-hover:bg-red-500 shadow">
            <Ambulance className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">ریسکیو 1122</span>
          <span className="text-[9px] text-amber-300 font-mono font-bold">1122 (مفت)</span>
        </a>

        {/* BHU Ratta Kallan */}
        <a
          href="tel:047123456"
          className="bg-white/10 hover:bg-white/25 border border-emerald-300/40 rounded-2xl p-2 flex flex-col items-center justify-center text-center transition active:scale-95 group"
          title="بنیادی مرکز صحت رتہ کلاں کال کریں"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 group-hover:bg-emerald-500 shadow">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">ہیلتھ سنٹر رتہ</span>
          <span className="text-[9px] text-emerald-200">گورنمنٹ BHU</span>
        </a>

        {/* Police 15 */}
        <a
          href="tel:15"
          className="bg-white/10 hover:bg-white/25 border border-blue-300/40 rounded-2xl p-2 flex flex-col items-center justify-center text-center transition active:scale-95 group"
          title="پولیس مدد 15 کال کریں"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:bg-blue-500 shadow">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white">پولیس مدد</span>
          <span className="text-[9px] text-blue-200 font-mono font-bold">15 (ہیلپ لائن)</span>
        </a>
      </div>
    </div>
  );
};
