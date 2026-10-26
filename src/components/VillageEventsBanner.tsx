import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Volume2,
  VolumeX,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Activity,
  Zap,
  Trophy,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { VillageNewsEvent, Language } from '../types';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
  cleanSpeechText,
} from '../utils/speech';
import { getBannerSlideImageDoc } from '../firebase/firestoreService';

export const BANNER_AUTO_SCROLL_MS = 3000; // 3 seconds auto-scroll
export const BANNER_TOUCH_PAUSE_MS = 10000; // 10 seconds pause after touch or swipe

interface VillageEventsBannerProps {
  events: VillageNewsEvent[];
  onOpenDetails: (event: VillageNewsEvent) => void;
  lang: Language;
  bannerImagesVersion?: number;
}

const SLIDE_BG_PALETTES: string[] = [
  'from-emerald-950 via-teal-900 to-emerald-900',
  'from-indigo-950 via-blue-900 to-slate-900',
  'from-amber-950 via-stone-900 to-emerald-950',
  'from-rose-950 via-red-900 to-stone-900',
  'from-teal-950 via-emerald-900 to-cyan-950',
];

export const VillageEventsBanner: React.FC<VillageEventsBannerProps> = ({
  events,
  onOpenDetails,
  lang,
  bannerImagesVersion = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.hidden) : false
  );
  const [pausedUntilMs, setPausedUntilMs] = useState<number>(0);

  // Lazy-loaded single image per slide cache (keyed by event.id)
  const [loadedSlideImages, setLoadedSlideImages] = useState<Record<string, string>>({});

  // Touch swipe tracking refs
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const safeEvents = events && events.length > 0 ? events : [];
  const activeIndex = safeEvents.length > 0 ? currentIndex % safeEvents.length : 0;
  const currentEvent = safeEvents[activeIndex];

  // Pause auto-scroll for 10 seconds upon user touch, swipe, or manual button click
  const pauseAutoScrollFor10Seconds = useCallback(() => {
    setPausedUntilMs(Date.now() + BANNER_TOUCH_PAUSE_MS);
  }, []);

  // Listen to document visibilitychange to pause auto-scroll when page is hidden (saves battery)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsPageHidden(Boolean(document.hidden));
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Lazy-load the current slide's separate compressed image document (at most 1 image per slide)
  useEffect(() => {
    if (!currentEvent) return;
    if (currentEvent.skipBannerImage) return;

    let isMounted = true;
    const loadSlideImage = async () => {
      if (currentEvent.hasBannerImage) {
        const docSnap = await getBannerSlideImageDoc(currentEvent.id);
        if (isMounted && docSnap && docSnap.imageData) {
          setLoadedSlideImages((prev) => ({
            ...prev,
            [currentEvent.id]: docSnap.imageData,
          }));
        }
      } else if (currentEvent.imageUrl && !currentEvent.skipBannerImage) {
        setLoadedSlideImages((prev) => ({
          ...prev,
          [currentEvent.id]: currentEvent.imageUrl!,
        }));
      }
    };
    loadSlideImage();
    return () => {
      isMounted = false;
    };
  }, [currentEvent, bannerImagesVersion]);

  // Auto-scroll to next slide every 3 seconds, looping forever, unless paused by touch or hidden page
  useEffect(() => {
    if (safeEvents.length <= 1 || isPageHidden || isPlayingAudio) return;

    const interval = setInterval(() => {
      if (Date.now() < pausedUntilMs) {
        return;
      }
      setCurrentIndex((prev) => (prev + 1) % safeEvents.length);
    }, BANNER_AUTO_SCROLL_MS);

    return () => clearInterval(interval);
  }, [safeEvents.length, isPageHidden, isPlayingAudio, pausedUntilMs]);

  if (safeEvents.length === 0 || !currentEvent) return null;

  const getEventIcon = (cat: string) => {
    switch (cat) {
      case 'medical':
        return <Activity className="w-4 h-4 text-emerald-300" />;
      case 'bijli_pani':
        return <Zap className="w-4 h-4 text-amber-300" />;
      case 'sports':
        return <Trophy className="w-4 h-4 text-amber-300" />;
      case 'janaza':
      case 'shadi':
        return <Heart className="w-4 h-4 text-rose-300" />;
      default:
        return <Megaphone className="w-4 h-4 text-amber-300" />;
    }
  };

  const handleToggleVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    pauseAutoScrollFor10Seconds();
    unlockAudioContext();
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playNotificationChime('start');
      const text =
        currentEvent.voiceAudioText ||
        `رتہ کلاں خبر: ${currentEvent.title}۔ تاریخ: ${currentEvent.date}۔ مقام: ${currentEvent.location}۔ تفصیل: ${currentEvent.content}`;
      speakText(cleanSpeechText(text), lang, () => setIsPlayingAudio(false), {
        isFemaleVillageVoice: false,
        voiceGender: 'male',
        rate: getSpeechRate(),
        pitch: 1.0,
      });
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    pauseAutoScrollFor10Seconds();
    stopSpeaking();
    setIsPlayingAudio(false);
    setCurrentIndex((prev) => (prev + 1) % safeEvents.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    pauseAutoScrollFor10Seconds();
    stopSpeaking();
    setIsPlayingAudio(false);
    setCurrentIndex((prev) => (prev - 1 + safeEvents.length) % safeEvents.length);
  };

  // Touch and swipe handlers (pauses auto-scroll for 10 seconds, swipes left/right)
  const handleTouchStart = (e: React.TouchEvent) => {
    pauseAutoScrollFor10Seconds();
    touchStartXRef.current = e.targetTouches[0]?.clientX ?? null;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    pauseAutoScrollFor10Seconds();
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const deltaX = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 40;
    if (Math.abs(deltaX) >= minSwipeDistance && safeEvents.length > 1) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Determine whether this slide has a single lazy-loaded image or is skipped (coloured background only)
  const slideImageSrc =
    !currentEvent.skipBannerImage && currentEvent.hasBannerImage
      ? loadedSlideImages[currentEvent.id]
      : !currentEvent.skipBannerImage && currentEvent.imageUrl
      ? currentEvent.imageUrl
      : '';

  const bgGradient = SLIDE_BG_PALETTES[activeIndex % SLIDE_BG_PALETTES.length];

  const bannerWhatsAppUrl = `https://wa.me/923270019099?text=${encodeURIComponent(
    `السلام علیکم! رتہ کلاں پورٹل پر خبر/بینر "${currentEvent.title}" کے حوالے سے معلومات چاہییں۔`
  )}`;

  return (
    <div
      className="w-full mb-3 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={pauseAutoScrollFor10Seconds}
    >
      <div
        onClick={() => onOpenDetails(currentEvent)}
        className={`cursor-pointer bg-gradient-to-r ${bgGradient} text-white rounded-3xl p-3.5 sm:p-4 shadow-md border-2 border-amber-400/80 relative overflow-hidden transition active:scale-[0.99] min-w-[280px]`}
      >
        {/* Single Lazy-Loaded Image per Slide (only if Admin set an image and did not choose Skip) */}
        {slideImageSrc && (
          <div className="mb-3 relative rounded-2xl overflow-hidden border border-amber-400/60 shadow-inner max-h-44 bg-black/40">
            <img
              src={slideImageSrc}
              alt={currentEvent.title}
              loading="lazy"
              decoding="async"
              className="w-full h-36 sm:h-44 object-cover"
            />
          </div>
        )}

        {/* Subtle glow for coloured background readability */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 mb-1.5 relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="p-1.5 bg-white/15 rounded-xl border border-white/20 shrink-0">
              {getEventIcon(currentEvent.category)}
            </span>
            <span className="text-[11px] font-bold text-amber-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              رتہ کلاں اہم خبر و واقعہ ({activeIndex + 1}/{safeEvents.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio Readout Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl text-xs font-bold transition shadow cursor-pointer ${
                isPlayingAudio
                  ? 'bg-red-600 text-white animate-voice-pulse'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title="آواز میں سنیں"
              aria-label="آواز میں سنیں"
            >
              {isPlayingAudio ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {safeEvents.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                  aria-label="پچھلی خبر"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                  aria-label="اگلی خبر"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slide Urdu Title (Readable at 360px width) */}
        <h4 className="font-bold text-base sm:text-lg font-nastaliq leading-snug text-white mb-1.5 break-words">
          {currentEvent.title}
        </h4>

        {/* Slide Urdu Content */}
        <p className="text-xs sm:text-sm text-stone-100 line-clamp-2 leading-relaxed mb-2.5 font-medium break-words">
          {currentEvent.content}
        </p>

        {/* Footer row: Date, Location, WhatsApp & Details */}
        <div className="flex items-center justify-between text-[11px] text-amber-200/90 pt-2 border-t border-white/15 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{currentEvent.date}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="line-clamp-1">{currentEvent.location}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={bannerWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                pauseAutoScrollFor10Seconds();
              }}
              className="px-2.5 py-1 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition active:scale-95 font-nastaliq"
              title="واٹس ایپ پر رابطہ کریں"
            >
              <MessageCircle className="w-3.5 h-3.5 text-white" />
              <span>واٹس ایپ</span>
            </a>

            <span className="text-[11px] font-bold text-white bg-amber-500/30 hover:bg-amber-500/50 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <span>تفصیل</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Small Navigation Dots Indicator */}
        {safeEvents.length > 1 && (
          <div
            className="flex items-center justify-center gap-1.5 pt-2.5 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {safeEvents.map((ev, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={ev.id || idx}
                  type="button"
                  onClick={() => {
                    pauseAutoScrollFor10Seconds();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`سلائیڈ ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'w-5 bg-amber-400 shadow-sm'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
