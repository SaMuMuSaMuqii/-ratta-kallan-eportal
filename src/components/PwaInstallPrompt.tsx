import React, { useEffect, useState, useCallback } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, ExternalLink } from 'lucide-react';
import { Language } from '../types';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

const PWA_TRIGGER_EVENT = 'rk-trigger-pwa-install';

export function triggerPwaInstallAction(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PWA_TRIGGER_EVENT));
  }
}

interface PwaInstallPromptProps {
  lang?: Language;
}

export const PwaFloatingInstallButton: React.FC<PwaInstallPromptProps> = ({ lang = 'ur' }) => {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkStandalone = () => {
      const standaloneMatch =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standaloneMatch);
    };
    checkStandalone();

    const handleInstalled = () => setIsInstalled(true);
    window.addEventListener('appinstalled', handleInstalled);
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);

  if (isInstalled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={triggerPwaInstallAction}
      className="pointer-events-auto h-[38px] sm:h-[46px] bg-gradient-to-r from-stone-900 via-emerald-900 to-emerald-800 hover:from-stone-950 hover:to-emerald-900 text-white px-3 sm:px-4 rounded-full shadow-xl border-2 border-amber-400 flex items-center justify-center gap-1.5 sm:gap-2 font-nastaliq font-extrabold text-[11px] sm:text-xs md:text-sm hover:scale-105 active:scale-95 transition cursor-pointer shrink-0 whitespace-nowrap"
      title="رتہ کلاں پورٹل اپنے موبائل پر انسٹال کریں (Install App)"
      aria-label="رتہ کلاں پورٹل انسٹال کریں"
    >
      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
      <span className="leading-none">
        {lang === 'en' ? 'Install App 📲' : 'ایپ انسٹال کریں 📲'}
      </span>
      <span className="hidden md:inline font-sans text-[11px] text-amber-200 font-bold leading-none" dir="ltr">
        (Install)
      </span>
    </button>
  );
};

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ lang = 'ur' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPwaPrompt) {
      return window.__deferredPwaPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showAutoPopup, setShowAutoPopup] = useState<boolean>(true);
  const [showManualGuideModal, setShowManualGuideModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [installSuccessToast, setInstallSuccessToast] = useState<boolean>(false);

  const handleTriggerInstall = useCallback(async () => {
    const activePrompt =
      deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
          setShowAutoPopup(false);
          setShowManualGuideModal(false);
        }
      } catch {
        setShowManualGuideModal(true);
      }
      return;
    }

    // Fallback when native beforeinstallprompt is not exposed (e.g., iOS Safari, already prompted, or iframe)
    setShowManualGuideModal(true);
  }, [deferredPrompt]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Ensure service worker is registered for PWA installability criteria
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
      });
    }

    // 2. Check if already running in standalone installed mode
    const checkStandalone = () => {
      const standaloneMatch =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standaloneMatch);
    };
    checkStandalone();

    // 3. Detect iOS and iframe environment
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // 4. Sync with any early-captured beforeinstallprompt event
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setShowAutoPopup(true);
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      setShowAutoPopup(false);
      setShowManualGuideModal(false);
      setInstallSuccessToast(true);
      window.setTimeout(() => setInstallSuccessToast(false), 5000);
    };

    const handleCustomInstallTrigger = () => {
      handleTriggerInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener(PWA_TRIGGER_EVENT, handleCustomInstallTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener(PWA_TRIGGER_EVENT, handleCustomInstallTrigger);
    };
  }, [handleTriggerInstall]);

  // Hide install UI once installed in standalone mode
  if (isInstalled) {
    if (!installSuccessToast) return null;
    return (
      <div className="fixed bottom-24 inset-x-3 max-w-md mx-auto z-[70] bg-emerald-800 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-center gap-2 font-nastaliq text-xs sm:text-sm text-center">
        <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
        <span>ماشاءاللہ! رتہ کلاں پورٹل آپ کے موبائل پر انسٹال ہو گیا ہے۔</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. Automatic Visitor Install Popup Banner (Mobile-First 2-Row Clean Alignment) */}
      {showAutoPopup && (
        <div
          dir="rtl"
          className="fixed top-2.5 inset-x-2.5 sm:inset-x-4 max-w-lg mx-auto z-[65] animate-in fade-in duration-300"
        >
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl border-2 border-amber-400/95 relative overflow-hidden">
            {/* Subtle decorative glow */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5 relative z-10">
              {/* Top Row on Mobile: Logo + Full Title/Subtitle + Close Button */}
              <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src="/logo.png"
                    alt="رتہ کلاں پورٹل"
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-emerald-950"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-950 rounded-full p-0.5 shadow">
                    <Smartphone className="w-3 h-3" />
                  </span>
                </div>

                <div className="flex-1 min-w-0 font-nastaliq text-right">
                  <h3 className="font-bold text-xs sm:text-sm md:text-base text-amber-300 leading-relaxed">
                    رتہ کلاں پورٹل اپنے موبائل پر انسٹال کریں 📲
                  </h3>
                  <p className="text-[10.5px] sm:text-xs text-emerald-100/95 leading-relaxed">
                    {lang === 'en'
                      ? 'Install Ratta Kallan Portal on your home screen without Google Play Store.'
                      : 'بغیر پلے سٹور کے ایک کلک میں موبائل کی ہوم اسکرین پر ڈاؤن لوڈ کریں!'}
                  </p>
                </div>

                {/* Close button on mobile top-left corner */}
                <button
                  type="button"
                  onClick={() => setShowAutoPopup(false)}
                  className="sm:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition cursor-pointer shrink-0"
                  title="بند کریں"
                  aria-label="Close install banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Row on Mobile / Right Side on Desktop: Full-Width Aligned Install Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 font-nastaliq">
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-[42px] px-4 py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-emerald-950 shrink-0 animate-bounce" />
                  <span>انسٹال کریں (Install)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAutoPopup(false)}
                  className="sm:hidden min-h-[40px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 font-bold text-xs transition cursor-pointer shrink-0"
                >
                  بعد میں
                </button>

                <button
                  type="button"
                  onClick={() => setShowAutoPopup(false)}
                  className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition cursor-pointer shrink-0"
                  title="بند کریں"
                  aria-label="Close install banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Guided Home-Screen Installation Modal (for iOS Safari / browsers where native prompt isn't auto-exposed) */}
      {showManualGuideModal && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white border-2 border-emerald-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl font-nastaliq">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-stone-900 p-4 text-white flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="رتہ کلاں پورٹل"
                  className="w-10 h-10 rounded-xl border border-amber-400 bg-emerald-950 object-cover"
                />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-amber-300">
                    رتہ کلاں پورٹل موبائل پر انسٹال کریں 📲
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-sans" dir="ltr">
                    Install Ratta Kallan Portal to Home Screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualGuideModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="بند کریں"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5 text-right">
              {deferredPrompt ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-center space-y-3">
                  <p className="text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed">
                    نیچے دیا گیا بٹن دبا کر رتہ کلاں پورٹل براہِ راست اپنے موبائل یا کمپیوٹر پر انسٹال کریں:
                  </p>
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>ابھی انسٹال کریں (Install Now)</span>
                  </button>
                </div>
              ) : (
                <>
                  {isInIframe && typeof window !== 'undefined' && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2">
                      <p className="text-xs font-bold text-amber-950 leading-relaxed">
                        💡 فوری انسٹال کے لیے پورٹل کو اپنے موبائل براؤزر (Chrome / Safari) کی نئی ٹیب میں کھولیں:
                      </p>
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span>نئی ٹیب میں کھول کر انسٹال کریں (Open in Browser)</span>
                      </a>
                    </div>
                  )}

                  {isIOS ? (
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>آئی فون (iPhone / Safari) پر انسٹال کرنے کا طریقہ:</span>
                      </h4>
                      <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed">
                        <li>
                          سفاری (Safari) براؤزر کے نیچے <strong>Share (شیئر بٹن ⬆️)</strong> پر کلک کریں۔
                        </li>
                        <li>
                          مینو میں نیچے جا کر <strong>"Add to Home Screen"</strong> پر کلک کریں۔
                        </li>
                        <li>
                          اوپر کونے میں <strong>"Add"</strong> دبائیں — ایپ آپ کی ہوم اسکرین پر آ جائے گی!
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>اینڈرائیڈ موبائل (Chrome) پر انسٹال کرنے کا آسان طریقہ:</span>
                      </h4>
                      <ol className="text-xs text-stone-700 space-y-2 list-decimal list-inside leading-relaxed">
                        <li>
                          اپنے کروم براؤزر کے اوپر کونے میں <strong>تین نقطوں (⋮)</strong> والے بٹن پر کلک کریں۔
                        </li>
                        <li>
                          مینو میں <strong>"Install app"</strong> یا <strong>"Add to Home screen"</strong> منتخب کریں۔
                        </li>
                        <li>
                          <strong>"Install"</strong> پر کلک کریں — رتہ کلاں پورٹل بغیر پلے سٹور کے انسٹال ہو جائے گا!
                        </li>
                      </ol>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setShowManualGuideModal(false)}
                className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs cursor-pointer transition"
              >
                ٹھیک ہے، سمجھ گیا (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
