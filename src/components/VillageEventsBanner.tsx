import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Volume2,
  X,
  BellRing,
  Sparkles,
  HeartPulse,
  Zap,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Pause,
  Play,
} from 'lucide-react';
import {
  VillageNewsEvent,
  EventCategory,
  BannerSlideImageDoc,
  BannerBenefitPair,
  BannerBenefitsStripConfig,
  Language,
} from '../types';
import {
  getBannerSlideImageDoc,
  getMobileBannerSlideImageDoc,
  loadBannerBenefitsStripConfig,
  loadBannerBenefitsStripConfigSync,
} from '../firebase/firestoreService';
import { speakText, stopSpeaking } from '../utils/speech';

interface VillageEventsBannerProps {
  events: VillageNewsEvent[];
  onOpenDetails?: () => void;
  lang?: Language;
  bannerImagesVersion?: number;
  bannerRefreshKey?: number;
  onPlayVoice?: (text: string, id: string) => void;
  playingId?: string | null;
}

const categoryConfig: Record<
  EventCategory,
  { label: string; bg: string; badge: string; icon: React.ReactNode }
> = {
  janaza: {
    label: 'اعلانِ جنازہ / تعزیت',
    bg: 'from-stone-950 via-stone-900 to-emerald-950 border-stone-600',
    badge: 'bg-stone-800 text-amber-300 border border-amber-400/50',
    icon: <BellRing className="w-3.5 h-3.5 text-amber-300 shrink-0" />,
  },
  shadi: {
    label: 'شادی / خوشی کی تقریب',
    bg: 'from-rose-950 via-amber-950 to-emerald-950 border-amber-400',
    badge: 'bg-amber-400 text-stone-950',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-950 shrink-0" />,
  },
  bijli_pani: {
    label: 'بجلی و پانی الرٹ',
    bg: 'from-amber-950 via-red-950 to-stone-950 border-amber-500',
    badge: 'bg-amber-500 text-stone-950',
    icon: <Zap className="w-3.5 h-3.5 text-stone-950 shrink-0" />,
  },
  medical: {
    label: 'فری میڈیکل کیمپ / صحت',
    bg: 'from-emerald-950 via-teal-900 to-cyan-950 border-emerald-400',
    badge: 'bg-emerald-400 text-stone-950',
    icon: <HeartPulse className="w-3.5 h-3.5 text-stone-950 shrink-0" />,
  },
  sports: {
    label: 'کھیل و نیزہ بازی میلہ',
    bg: 'from-blue-950 via-indigo-950 to-emerald-950 border-amber-400',
    badge: 'bg-amber-400 text-stone-950',
    icon: <Trophy className="w-3.5 h-3.5 text-stone-950 shrink-0" />,
  },
  panchayat: {
    label: 'پنچایت و گاؤں مشاورت',
    bg: 'from-teal-950 via-emerald-900 to-stone-950 border-amber-400',
    badge: 'bg-amber-300 text-stone-950',
    icon: <Users className="w-3.5 h-3.5 text-stone-950 shrink-0" />,
  },
  general: {
    label: 'گاؤں کی اہم رہنمائی و خبر',
    bg: 'from-emerald-950 via-teal-950 to-stone-900 border-emerald-500',
    badge: 'bg-amber-400 text-stone-950',
    icon: <BellRing className="w-3.5 h-3.5 text-stone-950 shrink-0" />,
  },
};

export const VillageEventsBanner: React.FC<VillageEventsBannerProps> = ({
  events,
  onPlayVoice,
  playingId: externalPlayingId = null,
  bannerImagesVersion = 0,
  bannerRefreshKey = 0,
}) => {
  const effectiveRefreshVersion = bannerImagesVersion + bannerRefreshKey;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<VillageNewsEvent | null>(null);
  const [internalPlayingId, setInternalPlayingId] = useState<string | null>(null);
  const [pauseUntil, setPauseUntil] = useState<number>(0);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState<boolean>(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [loadedSlideImages, setLoadedSlideImages] = useState<
    Record<string, BannerSlideImageDoc | null>
  >({});
  const [loadedMobileSlideImages, setLoadedMobileSlideImages] = useState<
    Record<string, BannerSlideImageDoc | null>
  >({});
  const [benefitsStripConfig, setBenefitsStripConfig] = useState<BannerBenefitsStripConfig>(() =>
    loadBannerBenefitsStripConfigSync()
  );

  const playingId = externalPlayingId ?? internalPlayingId;

  const handleTriggerVoice = (text: string, id: string) => {
    if (onPlayVoice) {
      onPlayVoice(text, id);
      return;
    }
    if (internalPlayingId === id) {
      stopSpeaking();
      setInternalPlayingId(null);
    } else {
      setInternalPlayingId(id);
      speakText(text, 'ur', () => setInternalPlayingId(null));
    }
  };

  // Track responsive viewport so separate mobile banner image or mobile focal point is applied accurately
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load customizable uses & benefits strip pairs from Firestore / local cache
  useEffect(() => {
    let cancelled = false;
    loadBannerBenefitsStripConfig().then((cfg: BannerBenefitsStripConfig) => {
      if (!cancelled && cfg) {
        setBenefitsStripConfig(cfg);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveRefreshVersion]);

  // Keep currentIndex in bounds if events list changes
  useEffect(() => {
    if (events.length > 0 && currentIndex >= events.length) {
      setCurrentIndex(0);
    }
  }, [events.length, currentIndex]);

  // Preload ALL slide images (both desktop and mobile variants) upfront so changing slides never flickers
  useEffect(() => {
    if (events.length === 0) return;
    let cancelled = false;

    (async () => {
      const desktopEntries: Record<string, BannerSlideImageDoc | null> = {};
      const mobileEntries: Record<string, BannerSlideImageDoc | null> = {};

      await Promise.all(
        events.map(async (ev) => {
          if (ev.skipBannerImage) {
            desktopEntries[ev.id] = null;
            mobileEntries[ev.id] = null;
            return;
          }
          const [dDoc, mDoc] = await Promise.all([
            getBannerSlideImageDoc(ev.id),
            getMobileBannerSlideImageDoc(ev.id),
          ]);
          desktopEntries[ev.id] = dDoc;
          mobileEntries[ev.id] = mDoc;
        })
      );

      if (!cancelled) {
        setLoadedSlideImages(desktopEntries);
        setLoadedMobileSlideImages(mobileEntries);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [events, effectiveRefreshVersion]);

  // Auto-rotate slides every 3.5 seconds unless paused by user interaction or manual pause toggle
  useEffect(() => {
    if (events.length <= 1 || isAutoPlayPaused) return;
    const timer = setInterval(() => {
      if (Date.now() < pauseUntil) return;
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [events.length, pauseUntil, isAutoPlayPaused]);

  const handleUserSlideInteract = (nextIdx: number) => {
    setPauseUntil(Date.now() + 10000);
    setCurrentIndex(nextIdx);
  };

  if (events.length === 0) return null;

  const safeIndex = currentIndex < events.length ? currentIndex : 0;
  const currentEvent = events[safeIndex];
  const cfg = categoryConfig[currentEvent.category] || categoryConfig.general;

  const desktopSlideDoc = loadedSlideImages[currentEvent.id];
  const mobileSlideDoc = loadedMobileSlideImages[currentEvent.id];

  const desktopBannerSrc =
    !currentEvent.skipBannerImage &&
    (desktopSlideDoc?.imageData || currentEvent.imageUrl || null);

  const mobileBannerSrc =
    !currentEvent.skipBannerImage &&
    (mobileSlideDoc?.imageData || currentEvent.mobileImageUrl || null);

  const activeBannerImageSrc =
    isMobileViewport && mobileBannerSrc ? mobileBannerSrc : desktopBannerSrc;

  // Determine image fit, focal point, and zoom without stretching or distorting
  const activeImageFit: 'cover' | 'contain' =
    currentEvent.imageFit || desktopSlideDoc?.imageFit || 'cover';

  const activeFocalX =
    isMobileViewport && typeof currentEvent.mobileFocalX === 'number'
      ? currentEvent.mobileFocalX
      : typeof currentEvent.focalX === 'number'
      ? currentEvent.focalX
      : typeof desktopSlideDoc?.focalX === 'number'
      ? desktopSlideDoc.focalX
      : 50;

  const activeFocalY =
    isMobileViewport && typeof currentEvent.mobileFocalY === 'number'
      ? currentEvent.mobileFocalY
      : typeof currentEvent.focalY === 'number'
      ? currentEvent.focalY
      : typeof desktopSlideDoc?.focalY === 'number'
      ? desktopSlideDoc.focalY
      : 50;

  const activeZoom =
    typeof currentEvent.zoom === 'number' && currentEvent.zoom > 1
      ? currentEvent.zoom
      : typeof desktopSlideDoc?.zoom === 'number' && desktopSlideDoc.zoom > 1
      ? desktopSlideDoc.zoom
      : 1;

  // Build WhatsApp URL for current slide
  const buildSlideWhatsAppUrl = (ev: VillageNewsEvent): string => {
    const rawNum = (ev.whatsappNumber || '923270019099').replace(/[^0-9]/g, '');
    const normalizedNum = rawNum.startsWith('03')
      ? `92${rawNum.slice(1)}`
      : rawNum || '923270019099';
    const msg =
      ev.whatsappMessage && ev.whatsappMessage.trim()
        ? ev.whatsappMessage.trim()
        : `السلام علیکم، میں رتہ کلاں جھنگ پورٹل کے مین بینر سلائیڈ ("${ev.title}") کے حوالے سے معلومات چاہتا ہوں۔`;
    return `https://wa.me/${normalizedNum}?text=${encodeURIComponent(msg)}`;
  };

  // Parse description lines so multi-line points align cleanly with consistent spacing
  const contentLines = (currentEvent.content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const visibleSummaryLines = contentLines.slice(0, 3);
  const hasMoreLines = contentLines.length > 3;

  const activeBenefitPairs: BannerBenefitPair[] = (
    benefitsStripConfig?.pairs || []
  ).filter((p) => !p.isHidden && (p.useUrdu?.trim() || p.benefitUrdu?.trim()));
  const currentBenefitPair: BannerBenefitPair | null =
    !benefitsStripConfig?.hideAll && activeBenefitPairs.length > 0
      ? activeBenefitPairs[safeIndex % activeBenefitPairs.length]
      : null;

  return (
    <>
      {/* Main Hero Banner Slider — Clean, Compact, High-Contrast & Zero-Overlap */}
      <section
        dir="rtl"
        aria-label="مین بینر اور گاؤں کی اہم معلومات"
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-l ${cfg.bg} text-white border-2 shadow-xl transition-colors duration-300 font-nastaliq`}
      >
        <div className="p-2.5 sm:p-3.5 space-y-2.5">
          {/* Row 1: Top Header Bar (Category Badge, Slide Number, Auto-Slider Controls & Quick Slide Tabs) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm ${cfg.badge}`}
              >
                {cfg.icon}
                <span>{cfg.label}</span>
              </span>
              <span className="text-[11px] text-amber-200 bg-black/45 px-2.5 py-1 rounded-full border border-white/15 font-bold">
                سلائیڈ {safeIndex + 1} / {events.length}
              </span>
            </div>

            {/* Auto-scroll toggle + Manual Prev/Next Controls */}
            {events.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAutoPlayPaused((prev) => !prev)}
                  className="min-h-[36px] px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 text-[11px] font-bold flex items-center gap-1 border border-white/15 cursor-pointer transition"
                  title={isAutoPlayPaused ? 'آٹو سلائیڈر چلائیں' : 'آٹو سلائیڈر روکیں'}
                >
                  {isAutoPlayPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                      <span>چلائیں</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>روکیں</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleUserSlideInteract((safeIndex - 1 + events.length) % events.length)
                  }
                  className="min-h-[36px] min-w-[36px] rounded-xl bg-black/40 hover:bg-white/20 border border-white/15 flex items-center justify-center cursor-pointer transition"
                  title="پچھلا سلائیڈ"
                  aria-label="پچھلا سلائیڈ"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUserSlideInteract((safeIndex + 1) % events.length)}
                  className="min-h-[36px] min-w-[36px] rounded-xl bg-black/40 hover:bg-white/20 border border-white/15 flex items-center justify-center cursor-pointer transition"
                  title="اگلا سلائیڈ"
                  aria-label="اگلا سلائیڈ"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Quick Slide Switcher Tabs (Consistent alignment across all slides) */}
          {events.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {events.map((ev, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleUserSlideInteract(idx)}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-sm'
                        : 'bg-black/40 text-stone-100 border-white/15 hover:bg-black/60'
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded-md font-sans text-[10px] font-bold shrink-0 ${
                        isActive ? 'bg-stone-950/20 text-stone-950' : 'bg-white/15 text-amber-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="max-w-[135px] sm:max-w-[190px] truncate leading-[1.8]">{ev.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 3: Unified Slide Frame — Split Grid on Desktop/Tablet (Image + Text Side-by-Side), Stacked on Mobile */}
          <div
            key={currentEvent.id}
            className="rounded-2xl bg-stone-950/80 border border-white/15 overflow-hidden shadow-inner"
          >
            <div
              className={`grid grid-cols-1 ${
                activeBannerImageSrc ? 'md:grid-cols-12' : ''
              } items-stretch`}
            >
              {/* 1. Dedicated Visual Banner Image Frame (Never Covered by Text!) */}
              {activeBannerImageSrc && (
                <div
                  onClick={() => setSelectedEvent(currentEvent)}
                  className="md:col-span-5 relative w-full h-44 sm:h-52 md:h-auto md:min-h-[245px] overflow-hidden bg-stone-950 border-b md:border-b-0 md:border-l border-white/15 cursor-pointer group"
                >
                  {activeImageFit === 'contain' && (
                    <img
                      src={activeBannerImageSrc}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                    />
                  )}

                  <img
                    src={activeBannerImageSrc}
                    alt={currentEvent.title}
                    className={`relative z-10 w-full h-full transition-transform duration-300 ${
                      activeImageFit === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                    style={{
                      objectPosition: `${activeFocalX}% ${activeFocalY}%`,
                      transform: activeZoom > 1 ? `scale(${activeZoom})` : undefined,
                      transformOrigin: `${activeFocalX}% ${activeFocalY}%`,
                    }}
                  />

                  {/* Subtle edge vignette only (zero text over the image subject) */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-stone-950/65 to-transparent z-10 pointer-events-none" />
                </div>
              )}

              {/* 2. Dedicated High-Contrast Text & Action Zone (Right-aligned Urdu, Responsive Sizing, Clean Wrapping) */}
              <div
                className={`${
                  activeBannerImageSrc ? 'md:col-span-7' : ''
                } p-3 sm:p-4 flex flex-col justify-between gap-2.5 text-right`}
              >
                <div className="space-y-2">
                  {/* Slide Heading */}
                  <h2
                    onClick={() => setSelectedEvent(currentEvent)}
                    className="font-bold text-[15px] sm:text-lg md:text-xl text-amber-300 leading-[1.8] break-words cursor-pointer hover:text-amber-200 transition-colors"
                  >
                    {currentEvent.title}
                  </h2>

                  {/* Slide Description Points inside a subtle high-contrast overlay box */}
                  <div
                    onClick={() => setSelectedEvent(currentEvent)}
                    className="bg-black/45 border border-white/10 rounded-xl p-2.5 sm:p-3 space-y-1.5 cursor-pointer"
                  >
                    {visibleSummaryLines.map((line, i) => (
                      <p
                        key={i}
                        className="text-xs sm:text-[13px] md:text-sm text-stone-100 leading-[1.85] break-words"
                      >
                        {line}
                      </p>
                    ))}
                    {hasMoreLines && (
                      <span className="inline-block text-[11px] font-bold text-amber-300 hover:underline pt-0.5">
                        مزید مکمل تفصیل پڑھیں ⬅
                      </span>
                    )}
                  </div>

                  {/* Compact Uses & Benefits Highlight Box */}
                  {currentBenefitPair && (
                    <div
                      onTouchStart={() => setPauseUntil(Date.now() + 10000)}
                      onMouseDown={() => setPauseUntil(Date.now() + 10000)}
                      className="rounded-xl bg-emerald-950/90 border border-emerald-400/35 px-3 py-2 space-y-0.5"
                    >
                      {currentBenefitPair.useUrdu && (
                        <p className="text-[11px] sm:text-xs text-amber-300 font-bold leading-[1.8] break-words">
                          {currentBenefitPair.useUrdu.trim().startsWith('استعمال:')
                            ? currentBenefitPair.useUrdu.trim()
                            : `استعمال: ${currentBenefitPair.useUrdu.trim()}`}
                        </p>
                      )}
                      {currentBenefitPair.benefitUrdu && (
                        <p className="text-[11px] sm:text-xs text-emerald-100 font-bold leading-[1.8] break-words">
                          {currentBenefitPair.benefitUrdu.trim().startsWith('فائدہ:')
                            ? currentBenefitPair.benefitUrdu.trim()
                            : `فائدہ: ${currentBenefitPair.benefitUrdu.trim()}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Metadata Badges + Consistently Aligned Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-white/15">
                  {/* Date, Time & Location */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-200">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{currentEvent.date}</span>
                    </span>
                    {currentEvent.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{currentEvent.time}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{currentEvent.location}</span>
                    </span>
                  </div>

                  {/* Action Buttons: Voice Readout, WhatsApp CTA, & Full Details */}
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPauseUntil(Date.now() + 10000);
                        handleTriggerVoice(
                          currentEvent.voiceAudioText ||
                            `${currentEvent.title}۔ تاریخ: ${currentEvent.date}۔ مقام: ${currentEvent.location}۔ ${currentEvent.content}`,
                          `event-${currentEvent.id}`
                        );
                      }}
                      className={`min-h-[42px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shadow ${
                        playingId === `event-${currentEvent.id}`
                          ? 'bg-red-600 text-white animate-pulse'
                          : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {playingId === `event-${currentEvent.id}` ? 'روکیں' : 'سنیں 🔊'}
                      </span>
                    </button>

                    <a
                      href={buildSlideWhatsAppUrl(currentEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPauseUntil(Date.now() + 10000)}
                      className="min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {currentEvent.whatsappLabel || 'واٹس ایپ رابطہ'}
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedEvent(currentEvent)}
                      className="min-h-[42px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center cursor-pointer transition border border-white/20"
                    >
                      <span className="truncate">مکمل تفصیل</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Bottom Dot Indicators */}
          {events.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-0.5" dir="ltr">
              {events.map((ev, idx) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => handleUserSlideInteract(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex
                      ? 'w-6 bg-amber-400 shadow'
                      : 'w-2 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Full Detail Modal */}
      {selectedEvent && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200 font-nastaliq"
        >
          <div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b ${
              (categoryConfig[selectedEvent.category] || categoryConfig.general).bg
            } text-white border-2 shadow-2xl`}
          >
            {/* Top Ribbon */}
            <div className="bg-black/50 px-4 py-3 flex items-center justify-between border-b border-white/15 sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    (categoryConfig[selectedEvent.category] || categoryConfig.general).badge
                  }`}
                >
                  {(categoryConfig[selectedEvent.category] || categoryConfig.general).icon}
                  <span>
                    {(categoryConfig[selectedEvent.category] || categoryConfig.general).label}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="min-h-[40px] min-w-[40px] rounded-full bg-white/10 hover:bg-white/20 text-stone-200 flex items-center justify-center cursor-pointer transition"
                aria-label="بند کریں"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-right">
              {!selectedEvent.skipBannerImage &&
                (loadedSlideImages[selectedEvent.id]?.imageData || selectedEvent.imageUrl) && (
                  <div className="relative w-full h-48 sm:h-60 rounded-2xl overflow-hidden border border-white/20 shadow-md bg-stone-950">
                    <img
                      src={
                        loadedSlideImages[selectedEvent.id]?.imageData ||
                        selectedEvent.imageUrl
                      }
                      alt={selectedEvent.title}
                      className={`w-full h-full ${
                        selectedEvent.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                      style={{
                        objectPosition: `${selectedEvent.focalX ?? 50}% ${selectedEvent.focalY ?? 50}%`,
                      }}
                    />
                  </div>
                )}

              <div className="space-y-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-amber-300 leading-[1.85] break-words">
                  {selectedEvent.title}
                </h2>
                <div className="bg-black/40 p-3.5 rounded-2xl border border-white/15 space-y-2">
                  {(selectedEvent.content || '')
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <p
                        key={i}
                        className="text-xs sm:text-sm text-stone-100 leading-[1.95] break-words"
                      >
                        {line}
                      </p>
                    ))}
                </div>
              </div>

              {/* Date, Time & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-black/35 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-300 block">تاریخ / دن:</span>
                    <strong className="text-white">{selectedEvent.date}</strong>
                  </div>
                </div>

                {selectedEvent.time && (
                  <div className="flex items-center gap-2 text-emerald-200">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-300 block">وقت:</span>
                      <strong className="text-white">{selectedEvent.time}</strong>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-emerald-200 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-300 block">مقام / جگہ:</span>
                    <strong className="text-white">{selectedEvent.location}</strong>
                  </div>
                </div>
              </div>

              {/* Voice Readout + WhatsApp + Close */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleTriggerVoice(
                      selectedEvent.voiceAudioText ||
                        `${selectedEvent.title}۔ تاریخ: ${selectedEvent.date}۔ مقام: ${selectedEvent.location}۔ ${selectedEvent.content}`,
                      `popup-event-${selectedEvent.id}`
                    )
                  }
                  className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                    playingId === `popup-event-${selectedEvent.id}`
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                  }`}
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>
                    {playingId === `popup-event-${selectedEvent.id}`
                      ? 'آواز روکیں'
                      : 'پورا اعلان آواز میں سنیں 🔊'}
                  </span>
                </button>

                <a
                  href={buildSlideWhatsAppUrl(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>{selectedEvent.whatsappLabel || 'واٹس ایپ رابطہ'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="min-h-[44px] py-2.5 px-5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  بند کریں
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
