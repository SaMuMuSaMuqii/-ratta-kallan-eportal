import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, FlipHorizontal, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title: string;
  lang: Language;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  lang,
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setErrorMsg(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setIsStarting(true);
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('کیمرہ سپورٹ دستیاب نہیں ہے۔ براؤزر پرمیشن چیک کریں۔');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'کیمرے کی اجازت نہیں ملی۔ سیٹنگز میں کیمرہ آن کریں یا فائل اپلوڈ کریں۔'
          : 'کیمرہ شروع نہیں ہو سکا۔ برائے مہربانی فون کیمرہ چیک کریں۔'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural selfie view
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3">
      <div className="bg-stone-900 border border-stone-700 text-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-stone-800 border-b border-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-full bg-stone-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-stone-300 text-sm mb-4 leading-relaxed">{errorMsg}</p>
              <label className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold transition">
                <span>گیلری سے تصویر منتخب کریں</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onCapture(reader.result as string);
                        onClose();
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Facing mode toggle button (if camera is active) */}
          {!capturedImage && !errorMsg && (
            <button
              onClick={toggleFacingMode}
              type="button"
              className="absolute top-3 right-3 bg-black/60 text-white p-2.5 rounded-full border border-white/20 backdrop-blur hover:bg-black/80 transition"
              title="کیمرہ تبدیل کریں"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-stone-800 border-t border-stone-700 flex items-center justify-center gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-700 hover:bg-stone-600 font-semibold text-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.retake}</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition"
              >
                <Check className="w-4 h-4" />
                <span>{t.confirmPhoto}</span>
              </button>
            </>
          ) : !errorMsg ? (
            <button
              type="button"
              onClick={takePhoto}
              className="w-16 h-16 rounded-full border-4 border-emerald-400 bg-white hover:bg-stone-200 shadow-xl flex items-center justify-center transition active:scale-95"
              aria-label="Take Photo"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-600"></div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-stone-700 text-stone-200 text-sm font-semibold"
            >
              بند کریں
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
