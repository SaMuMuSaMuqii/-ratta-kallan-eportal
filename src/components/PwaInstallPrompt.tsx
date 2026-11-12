import React, { useEffect, useState } from 'react';
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

interface PwaInstallPromptProps {
  lang?: Language;
}

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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);

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
  };

  // Hide install UI once installed in standalone mode
  if (isInstalled) {
    if (!installSuccessToast) return null;
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] bg-emerald-800 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-2 font-nastaliq text-xs sm:text-sm">
        <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
        <span>ماشاءاللہ! رتہ کلاں پورٹل آپ کے موبائل پر انسٹال ہو گیا ہے۔</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. Automatic Visitor Install Popup Banner (Appears automatically when opening the site) */}
      {showAutoPopup && (
        <div
          dir="rtl"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[65] w-[95%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl border-2 border-amber-400/90 relative overflow-hidden">
            {/* Subtle decorative glow */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-2.5 sm:gap-3 relative z-10">
              {/* Portal Icon / Badge */}
              <div className="relative shrink-0">
                <img
                  src="/logo.png"
                  alt="رتہ کلاں پورٹل"
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-emerald-950"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-950 rounded-full p-0.5 shadow">
                  <Smartphone className="w-3 h-3" />
                </span>
              </div>

              {/* Urdu & English Install Prompt Copy */}
              <div className="flex-1 min-w-0 font-nastaliq text-right">
                <h3 className="font-bold text-xs sm:text-sm md:text-base text-amber-300 leading-relaxed truncate">
                  رتہ کلاں پورٹل اپنے موبائل پر انسٹال کریں 📲
                </h3>
                <p className="text-[10px] sm:text-xs text-emerald-100/95 leading-relaxed line-clamp-2">
                  {lang === 'en'
                    ? 'Install Ratta Kallan Portal on your home screen without Google Play Store for instant 1-tap access.'
                    : 'بغیر پلے سٹور کے ایک کلک میں موبائل کی ہوم اسکرین پر ڈاؤن لوڈ کریں — تیز رفتار اور آسان رسائی!'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 font-nastaliq">
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="min-h-[38px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0 animate-bounce" />
                  <span>انسٹال کریں (Install)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAutoPopup(false)}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition cursor-pointer"
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

      {/* 2. Fixed Floating Download / Install Portal Button at the Bottom of the Screen */}
      <button
        type="button"
        onClick={handleTriggerInstall}
        className="fixed bottom-[76px] md:bottom-6 left-1/2 -translate-x-1/2 z-40 min-h-[44px] sm:min-h-[50px] bg-gradient-to-r from-stone-900 via-emerald-900 to-emerald-800 hover:from-stone-950 hover:to-emerald-900 text-white px-3 sm:px-4 py-2 rounded-full shadow-2xl border-2 border-amber-400 flex items-center gap-1.5 sm:gap-2 font-nastaliq font-extrabold text-[11px] sm:text-xs md:text-sm hover:scale-105 active:scale-95 transition cursor-pointer whitespace-nowrap"
        title="رتہ کلاں پورٹل اپنے موبائل پر انسٹال کریں (Install App)"
        aria-label="رتہ کلاں پورٹل انسٹال کریں"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
        <span>📲 ایپ انسٹال کریں</span>
        <span className="hidden sm:inline font-sans text-[11px] text-amber-200 font-bold" dir="ltr">
          (Install)
        </span>
      </button>

      {/* 3. Guided Home-Screen Installation Modal (for iOS Safari / browsers where native prompt isn't auto-exposed) */}
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
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-900 flex items-center gap-1.5">
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
