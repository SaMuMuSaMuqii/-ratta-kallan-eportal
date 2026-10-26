import React from 'react';
import { Home, Mic, Megaphone, Mail, PlusCircle } from 'lucide-react';
import { Language } from '../types';

interface MobileBottomNavProps {
  activeTab: 'home' | 'news' | 'messages' | 'add';
  onSelectTab: (tab: 'home' | 'news' | 'messages' | 'add') => void;
  onTriggerVoiceSearch: () => void;
  isVoiceSearching: boolean;
  unreadMessagesCount: number;
  newsEventsCount: number;
  lang: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onTriggerVoiceSearch,
  isVoiceSearching,
  unreadMessagesCount,
  newsEventsCount,
  lang,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {/* Home Tab */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-95 ${
            activeTab === 'home'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">ہوم</span>
        </button>

        {/* News & Events Tab */}
        <button
          onClick={() => onSelectTab('news')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-95 ${
            activeTab === 'news'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <Megaphone className="w-5 h-5" />
            {newsEventsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] flex items-center justify-center font-bold shadow">
                {newsEventsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">واقعات و خبریں</span>
        </button>

        {/* Prominent Center Voice Search Mic Button */}
        <div className="-mt-5">
          <button
            onClick={onTriggerVoiceSearch}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white transition active:scale-90 ${
              isVoiceSearching
                ? 'bg-red-600 text-white animate-voice-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/30'
            }`}
            title="آواز سے بولیں"
            aria-label="Voice Search"
          >
            <Mic className="w-6 h-6 animate-pulse" />
            <span className="text-[8px] font-bold mt-0.5">بولیں</span>
          </button>
        </div>

        {/* Messages / Inbox Tab */}
        <button
          onClick={() => onSelectTab('messages')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-95 ${
            activeTab === 'messages'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <Mail className="w-5 h-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-bold shadow">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">پیغامات</span>
        </button>

        {/* Add Profile Tab */}
        <button
          onClick={() => onSelectTab('add')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition active:scale-95 ${
            activeTab === 'add'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-0.5">+ اندراج</span>
        </button>
      </div>
    </div>
  );
};
