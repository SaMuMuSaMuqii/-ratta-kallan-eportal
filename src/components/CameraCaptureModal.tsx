import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, SwitchCamera, Sparkles } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
  mode?: 'avatar' | 'business' | 'banner' | 'general';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'کیمرہ سے تصویر لیں',
  mode = 'avatar',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    mode === 'avatar' ? 'user' : 'environment'
  );
  const [isLoading, setIsLoading] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setFacingMode(mode === 'avatar' ? 'user' : 'environment');
    }
  }, [isOpen, mode]);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopCamera();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      // Fallback: try generic video constraint if specific facingMode failed on desktop webcam
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error('Fallback camera access error:', fallbackErr);
        setError(
          'کیمرہ تک رسائی ممکن نہیں ہو سکی۔ براہ کرم براؤزر میں کیمرہ کی اجازت (Permission) دیں یا "گیلری سے تصویر منتخب کریں" کا آپشن استعمال کریں۔'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Capture full high-resolution frame so the user can crop/zoom/reposition freely in the next step
        const maxDim = 1280;
        let outW = video.videoWidth;
        let outH = video.videoHeight;

        if (outW > maxDim || outH > maxDim) {
          const scale = maxDim / Math.max(outW, outH);
          outW = Math.round(outW * scale);
          outH = Math.round(outH * scale);
        }

        canvas.width = outW;
        canvas.height = outH;

        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, outW, outH);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[270] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-300">
                تصویر کھینچنے کے بعد آپ اسے کراپ اور زوم بھی کر سکیں گے
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="منسوخ کریں"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 sm:p-5 flex flex-col items-center">
          <div
            className={`relative w-full ${
              mode === 'avatar' ? 'aspect-square max-w-[320px]' : 'aspect-video max-w-[400px]'
            } bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-200 flex items-center justify-center`}
          >
            {isLoading && !error && (
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold">کیمرہ آن ہو رہا ہے...</span>
              </div>
            )}

            {error && (
              <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-3">
                <AlertCircle className="w-10 h-10" />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    دوبارہ کوشش کریں
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    بند کریں
                  </button>
                </div>
              </div>
            )}

            {!capturedImage && !error && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                {/* Guide Frame Overlay */}
                {mode === 'avatar' ? (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-4/5 h-4/5 rounded-full border-2 border-dashed border-emerald-400/75 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]" />
                  </div>
                ) : (
                  <div className="absolute inset-3 border-2 border-dashed border-white/45 rounded-xl pointer-events-none" />
                )}

                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute bottom-3 right-3 p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 text-xs font-bold border border-white/15"
                  title="فرنٹ یا بیک کیمرہ تبدیل کریں"
                >
                  <SwitchCamera className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px]">کیمرہ بدلیں</span>
                </button>
              </>
            )}

            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-contain bg-slate-950" />
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="w-full mt-5 flex flex-col gap-2.5">
            {!capturedImage ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all"
                >
                  منسوخ کریں
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={isLoading || !!error}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  <span>تصویر کھینچیں</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>دوبارہ کھینچیں</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>آگے بڑھیں اور ایڈجسٹ کریں</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  اگلے مرحلے میں آپ اس تصویر کو اپنی مرضی سے کراپ اور زوم کر سکیں گے۔
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
