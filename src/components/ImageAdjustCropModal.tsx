import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Move,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Minimize2,
  Eye,
  User,
  Briefcase,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export type ImageAdjustMode = 'avatar' | 'business' | 'banner' | 'general';

export interface ImageAdjustResult {
  dataUrl: string;
  fitMode: 'cover' | 'contain';
  aspectRatioLabel: string;
}

interface ImageAdjustCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  mode: ImageAdjustMode;
  title?: string;
  subtitle?: string;
  initialAspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '21:9';
  onSave: (adjustedDataUrl: string, meta?: { fitMode: 'cover' | 'contain'; aspect: string }) => void;
}

const ASPECT_OPTIONS: {
  id: '1:1' | '16:9' | '4:3' | '3:2' | '21:9';
  label: string;
  ratio: number;
  outWidth: number;
  outHeight: number;
}[] = [
  { id: '1:1', label: '1:1 (مربع / پروفائل)', ratio: 1, outWidth: 720, outHeight: 720 },
  { id: '16:9', label: '16:9 (وائیڈ بینر / کاروبار)', ratio: 16 / 9, outWidth: 1280, outHeight: 720 },
  { id: '4:3', label: '4:3 (معیاری فریم)', ratio: 4 / 3, outWidth: 1080, outHeight: 810 },
  { id: '3:2', label: '3:2 (پوسٹ کارڈ)', ratio: 3 / 2, outWidth: 1080, outHeight: 720 },
  { id: '21:9', label: '21:9 (الٹرا وائیڈ بینر)', ratio: 21 / 9, outWidth: 1470, outHeight: 630 },
];

export const validateAndReadImageFile = (
  file: File
): Promise<{ valid: boolean; dataUrl?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ valid: false, error: 'کوئی تصویر منتخب نہیں کی گئی۔' });
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    const extAllowed = /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name || '');

    if (!allowedTypes.includes(file.type) && !extAllowed) {
      resolve({
        valid: false,
        error: 'صرف JPG، PNG، WEBP یا GIF فارمیٹ کی تصاویر اپ لوڈ کی جا سکتی ہیں۔',
      });
      return;
    }

    const maxBytes = 15 * 1024 * 1024; // 15MB raw upload limit
    if (file.size > maxBytes) {
      resolve({
        valid: false,
        error: 'تصویر کا سائز 15MB سے زیادہ ہے۔ براہ کرم چھوٹے سائز کی تصویر منتخب کریں۔',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result || !result.startsWith('data:image')) {
        resolve({
          valid: false,
          error: 'منتخب کردہ فائل درست تصویر نہیں ہے۔ دوبارہ کوشش کریں۔',
        });
        return;
      }

      // Verify image loads cleanly without corruption
      const testImg = new Image();
      testImg.onload = () => {
        if (testImg.naturalWidth < 20 || testImg.naturalHeight < 20) {
          resolve({
            valid: false,
            error: 'تصویر بہت چھوٹی ہے (کم از کم 20x20 پکسل ہونی چاہیے)۔',
          });
          return;
        }
        resolve({ valid: true, dataUrl: result });
      };
      testImg.onerror = () => {
        resolve({
          valid: false,
          error: 'تصویر لوڈ کرنے میں مسئلہ پیش آیا۔ براہ کرم دوسری تصویر منتخب کریں۔',
        });
      };
      testImg.src = result;
    };
    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'فائل پڑھنے میں خرابی پیش آئی۔ دوبارہ کوشش کریں۔',
      });
    };
    reader.readAsDataURL(file);
  });
};

export const ImageAdjustCropModal: React.FC<ImageAdjustCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  mode,
  title,
  subtitle,
  initialAspectRatio,
  onSave,
}) => {
  const defaultAspect =
    initialAspectRatio ||
    (mode === 'avatar' ? '1:1' : mode === 'banner' ? '16:9' : mode === 'business' ? '16:9' : '4:3');

  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:2' | '21:9'>(defaultAspect);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0); // -100 to +100 percentage offset
  const [panY, setPanY] = useState<number>(0); // -100 to +100 percentage offset
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [showCircleGuide, setShowCircleGuide] = useState<boolean>(mode === 'avatar');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showFullPreviewTab, setShowFullPreviewTab] = useState<boolean>(false);

  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null);

  // Reset state when modal opens with a new image
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setAspectRatio(
      initialAspectRatio ||
        (mode === 'avatar' ? '1:1' : mode === 'banner' ? '16:9' : mode === 'business' ? '16:9' : '4:3')
    );
    setFitMode('cover');
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setShowCircleGuide(mode === 'avatar');
    setErrorMsg(null);
    setShowFullPreviewTab(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImgRef.current = img;
      renderCanvas(img, defaultAspect, 'cover', 1, 0, 0, 0);
    };
    img.onerror = () => {
      setErrorMsg('تصویر لوڈ کرنے میں مسئلہ پیش آیا۔');
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc, mode, initialAspectRatio]);

  const renderCanvas = useCallback(
    (
      img: HTMLImageElement | null,
      aspectId: '1:1' | '16:9' | '4:3' | '3:2' | '21:9',
      currentFit: 'cover' | 'contain',
      currentZoom: number,
      currentPanX: number,
      currentPanY: number,
      currentRotation: number
    ) => {
      if (!img || !canvasRef.current) return;

      const spec = ASPECT_OPTIONS.find((a) => a.id === aspectId) || ASPECT_OPTIONS[0];
      const canvas = canvasRef.current;
      canvas.width = spec.outWidth;
      canvas.height = spec.outHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill background with dark slate so 'contain' mode or zoomed-out borders look clean and intentional
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Compute rotated natural dimensions
      const isRotated90 = Math.abs(currentRotation % 180) === 90;
      const srcW = isRotated90 ? img.naturalHeight || img.height : img.naturalWidth || img.width;
      const srcH = isRotated90 ? img.naturalWidth || img.width : img.naturalHeight || img.height;

      if (srcW <= 0 || srcH <= 0) return;

      const baseScale =
        currentFit === 'cover'
          ? Math.max(canvas.width / srcW, canvas.height / srcH)
          : Math.min(canvas.width / srcW, canvas.height / srcH);

      const finalScale = baseScale * currentZoom;
      const drawW = (img.naturalWidth || img.width) * finalScale;
      const drawH = (img.naturalHeight || img.height) * finalScale;

      // Calculate pan range so user can comfortably reposition
      const effectiveW = srcW * finalScale;
      const effectiveH = srcH * finalScale;
      const maxOffsetX = Math.max((effectiveW - canvas.width) / 2, canvas.width * 0.35);
      const maxOffsetY = Math.max((effectiveH - canvas.height) / 2, canvas.height * 0.35);

      const offsetX = (currentPanX / 100) * maxOffsetX;
      const offsetY = (currentPanY / 100) * maxOffsetY;

      ctx.save();
      ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      try {
        const preview = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewDataUrl(preview);
      } catch {
        // Fallback if tainted canvas
      }
    },
    []
  );

  useEffect(() => {
    if (loadedImgRef.current && isOpen) {
      renderCanvas(loadedImgRef.current, aspectRatio, fitMode, zoom, panX, panY, rotation);
    }
  }, [aspectRatio, fitMode, zoom, panX, panY, rotation, isOpen, renderCanvas]);

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setFitMode('cover');
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panX,
      startPanY: panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Convert pixel drag to -100..+100 pan percentage
    const sensitivity = 180 / Math.max(rect.width, 220);
    const nextPanX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.startPanX + deltaX * sensitivity)));
    const nextPanY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.startPanY + deltaY * sensitivity)));

    setPanX(nextPanX);
    setPanY(nextPanY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const handleConfirmSave = () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const canvas = canvasRef.current;
      // Encode with adaptive quality so output fits safely within Firestore limits (~450KB max)
      let quality = 0.84;
      let outputDataUrl = canvas.toDataURL('image/jpeg', quality);
      const maxChars = 480 * 1024;

      while (outputDataUrl.length > maxChars && quality > 0.42) {
        quality -= 0.1;
        outputDataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      onSave(outputDataUrl, { fitMode, aspect: aspectRatio });
      onClose();
    } catch (err) {
      console.error('Error exporting adjusted image:', err);
      setErrorMsg('تصویر محفوظ کرنے میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle =
    title ||
    (mode === 'avatar'
      ? 'پروفائل تصویر ایڈجسٹ اور کراپ کریں'
      : mode === 'business'
      ? 'کاروبار / دکان کی تصویر ایڈجسٹ کریں'
      : mode === 'banner'
      ? 'مین بینر تصویر ایڈجسٹ اور کراپ کریں'
      : 'تصویر ایڈجسٹ اور پری ویو کریں');

  const modalSubtitle =
    subtitle ||
    (mode === 'avatar'
      ? 'تصویر کو پکڑ کر چہرے کو دائرے اور فریم کے درمیان میں رکھیں اور زوم سیٹ کریں'
      : mode === 'business'
      ? 'اپنی دکان، آفس یا کاروبار کے نام اور بورڈ کو فریم میں واضح سیٹ کریں'
      : 'تصویر کو زوم، ری پوزیشن یا گھما کر بہترین فریم منتخب کریں');

  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 px-4 sm:px-6 py-3.5 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black leading-snug truncate">{modalTitle}</h3>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 truncate">{modalSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFullPreviewTab((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                showFullPreviewTab
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                  : 'bg-white/10 text-emerald-100 border-white/15 hover:bg-white/20'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showFullPreviewTab ? 'ایڈیٹر پر واپس' : 'پری ویو دیکھیں'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-rose-500/30 text-white rounded-xl transition-colors"
              title="منسوخ کریں"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left / Main Interactive Cropper Area */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
                    <Move className="w-3.5 h-3.5 text-emerald-600" />
                    تصویر کو پکڑ کر حرکت دیں (Drag to Reposition)
                  </span>
                </div>
                {mode === 'avatar' && (
                  <button
                    type="button"
                    onClick={() => setShowCircleGuide((prev) => !prev)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                      showCircleGuide
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {showCircleGuide ? 'دائرہ گائیڈ آن ہے' : 'دائرہ گائیڈ دکھائیں'}
                  </button>
                )}
              </div>

              {/* Interactive Canvas Viewport */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`relative w-full bg-slate-950 rounded-2xl overflow-hidden border-2 ${
                  isDragging ? 'border-emerald-500 cursor-grabbing' : 'border-slate-300 cursor-grab'
                } shadow-inner flex items-center justify-center select-none touch-none min-h-[260px] sm:min-h-[340px] max-h-[420px] p-2`}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[380px] w-auto h-auto object-contain rounded-xl shadow-lg pointer-events-none"
                />

                {/* Rule of Thirds Grid + Optional Circular Avatar Mask Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Subtle Grid Lines */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-r border-b border-white/50" />
                    <div className="border-b border-white/50" />
                    <div className="border-r border-white/50" />
                    <div className="border-r border-white/50" />
                    <div />
                  </div>

                  {/* Circular Avatar Guide for Profile Picture Mode */}
                  {showCircleGuide && aspectRatio === '1:1' && (
                    <div className="absolute w-[210px] h-[210px] sm:w-[260px] sm:h-[260px] rounded-full border-2 border-dashed border-emerald-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)] flex items-end justify-center pb-2">
                      <span className="bg-slate-900/80 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        گول پروفائل فریم
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Overlay Badge */}
                <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between pointer-events-none">
                  <span className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/15">
                    زوم: {Math.round(zoom * 100)}%
                  </span>
                  <span className="bg-slate-900/85 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/15">
                    {fitMode === 'cover' ? 'پورا فریم (Cover)' : 'مکمل تصویر (Contain)'} • {aspectRatio}
                  </span>
                </div>
              </div>

              {/* Quick Zoom & Rotate Toolbar Under Canvas */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3">
                {/* Zoom Slider + Buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-4 h-4 text-emerald-600" />
                      زوم کنٹرول (Zoom In / Out)
                    </span>
                    <span className="text-emerald-700 font-black" dir="ltr">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                      title="زوم کم کریں"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
                      <span>زوم کم کریں</span>
                    </button>

                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.02}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />

                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                      title="زوم بڑھائیں"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                      <span>زوم بڑھائیں</span>
                    </button>
                  </div>
                </div>

                {/* Fine Position Sliders (Horizontal & Vertical) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>دائیں / بائیں پوزیشن</span>
                      <span dir="ltr">{panX}%</span>
                    </div>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      step={1}
                      value={panX}
                      onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>اوپر / نیچے پوزیشن</span>
                      <span dir="ltr">{panY}%</span>
                    </div>
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      step={1}
                      value={panY}
                      onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Controls, Fit Mode, Aspect Ratio & Real-Time Layout Previews */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1. Fit vs Contain Toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <label className="block text-xs font-black text-slate-800">
                  1. تصویر فٹ کرنے کا انداز (Image Fitting Mode)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('cover');
                      if (zoom < 1) setZoom(1);
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                      fitMode === 'cover'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-black">فریم بھریں (Cover)</div>
                      <div
                        className={`text-[10px] ${
                          fitMode === 'cover' ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        خالی جگہ کے بغیر پورا باکس
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFitMode('contain');
                      setZoom(1);
                      setPanX(0);
                      setPanY(0);
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                      fitMode === 'contain'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Minimize2 className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-black">مکمل تصویر (Contain)</div>
                      <div
                        className={`text-[10px] ${
                          fitMode === 'contain' ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        کوئی حصہ کٹے بغیر پوری تصویر
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Aspect Ratio & Rotation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    2. فریم کا سائز / تناسب (Aspect Ratio)
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAspectRatio(opt.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        aspectRatio === opt.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Rotation + Reset Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleRotateRight}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>دائیں گھمائیں (90°)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRotateLeft}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>بائیں گھمائیں</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    title="تصویر دوبارہ سیٹ کریں"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>دوبارہ سیٹ کریں</span>
                  </button>
                </div>
              </div>

              {/* 3. Live Layout Preview Box */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    حتمی ڈسپلے پری ویو (Live Final Preview)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    پورٹل پر ایسا نظر آئے گا
                  </span>
                </div>

                {mode === 'avatar' ? (
                  <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-around gap-4">
                      {/* Circular Profile Preview */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-900">
                          {previewDataUrl && (
                            <img
                              src={previewDataUrl}
                              alt="Circular Avatar Preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-600" />
                          گول پروفائل آئیکن
                        </span>
                      </div>

                      {/* Card Rounded Avatar Preview */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-900">
                          {previewDataUrl && (
                            <img
                              src={previewDataUrl}
                              alt="Card Avatar Preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-600">
                          کارڈ پروفائل فوٹو
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                      چہرہ گول دائرے اور چوکور کارڈ دونوں میں بالکل صاف اور درمیان میں نظر آ رہا ہے۔
                    </p>
                  </div>
                ) : mode === 'business' ? (
                  <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs space-y-2.5">
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      {previewDataUrl && (
                        <img
                          src={previewDataUrl}
                          alt="Business Card Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                      <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center justify-between text-white">
                        <span className="text-xs font-black flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                          کاروباری کارڈ ہیڈر پری ویو
                        </span>
                        <span className="text-[10px] bg-emerald-600 px-2 py-0.5 rounded-md font-bold">
                          تصدیق شدہ
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      اگر دکان کا بورڈ یا لوگو کٹ رہا ہو تو اوپر سے <strong>"مکمل تصویر (Contain)"</strong> منتخب کریں۔
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs space-y-2">
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      {previewDataUrl && (
                        <img
                          src={previewDataUrl}
                          alt="General Layout Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      یہ تصویر پورٹل کے کارڈ اور تفصیلات میں اسی طرح صاف نظر آئے گی۔
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Screen Layout Comparison Drawer when user clicks "پری ویو دیکھیں" */}
          {showFullPreviewTab && previewDataUrl && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-emerald-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  مکمل فائنل پری ویو (محفوظ کرنے سے پہلے معائنہ کریں)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowFullPreviewTab(false)}
                  className="text-xs text-slate-300 hover:text-white underline"
                >
                  بند کریں
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                {mode === 'avatar' && (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={previewDataUrl}
                      alt="Full Circular Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-xl"
                    />
                    <span className="text-xs font-bold text-emerald-200">گول پروفائل فوٹو</span>
                  </div>
                )}
                <div className="flex flex-col items-center gap-2 max-w-md w-full">
                  <img
                    src={previewDataUrl}
                    alt="Full Frame Preview"
                    className="max-h-60 w-auto rounded-2xl border-2 border-white/20 shadow-xl object-contain bg-slate-950"
                  />
                  <span className="text-xs font-bold text-slate-300">مکمل تیار شدہ تصویر</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>تصویر دوبارہ سیٹ کریں</span>
          </button>

          <div className="flex items-center gap-2.5 mr-auto sm:mr-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            >
              منسوخ کریں
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'محفوظ ہو رہا ہے...' : 'تصویر محفوظ کریں'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
