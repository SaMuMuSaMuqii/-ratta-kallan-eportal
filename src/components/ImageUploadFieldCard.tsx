import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sliders,
  Eye,
  Trash2,
  User,
  Briefcase,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  ImageAdjustCropModal,
  ImageAdjustMode,
  validateAndReadImageFile,
} from './ImageAdjustCropModal';

interface ImageUploadFieldCardProps {
  label: string;
  subtitle?: string;
  value: string;
  onChange: (newImageUrl: string) => void;
  mode?: ImageAdjustMode;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'purple';
  required?: boolean;
  compact?: boolean;
}

export const ImageUploadFieldCard: React.FC<ImageUploadFieldCardProps> = ({
  label,
  subtitle,
  value,
  onChange,
  mode = 'general',
  accentColor = 'emerald',
  required = false,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Store the original uncropped image in memory so user can re-adjust without losing peripheral pixels
  const [rawSourceImage, setRawSourceImage] = useState<string>('');
  const [pendingRawImage, setPendingRawImage] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState<boolean>(false);
  const [isPreviewLightboxOpen, setIsPreviewLightboxOpen] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [justSavedBadge, setJustSavedBadge] = useState<boolean>(false);

  const handleGalleryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorText(null);

    const check = await validateAndReadImageFile(file);
    // Reset input so selecting the same file again still triggers onChange
    e.target.value = '';

    if (!check.valid || !check.dataUrl) {
      setErrorText(check.error || 'تصویر لوڈ کرنے میں مسئلہ پیش آیا۔');
      return;
    }

    setPendingRawImage(check.dataUrl);
    setIsAdjustOpen(true);
  };

  const handleCameraCaptureDone = (capturedDataUrl: string) => {
    setErrorText(null);
    setPendingRawImage(capturedDataUrl);
    setIsAdjustOpen(true);
  };

  const handleOpenReAdjust = () => {
    const sourceToAdjust = rawSourceImage || value;
    if (!sourceToAdjust) return;
    setErrorText(null);
    setPendingRawImage(sourceToAdjust);
    setIsAdjustOpen(true);
  };

  const handleSaveAdjusted = (adjustedDataUrl: string) => {
    if (pendingRawImage) {
      setRawSourceImage(pendingRawImage);
    }
    onChange(adjustedDataUrl);
    setJustSavedBadge(true);
    setTimeout(() => setJustSavedBadge(false), 3500);
  };

  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50/50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/15',
      secondaryBtn: 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200',
      ring: 'border-emerald-400',
    },
    blue: {
      bg: 'bg-blue-50/50 border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/15',
      secondaryBtn: 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200',
      ring: 'border-blue-400',
    },
    amber: {
      bg: 'bg-amber-50/50 border-amber-200',
      badge: 'bg-amber-100 text-amber-800',
      primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/15',
      secondaryBtn: 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200',
      ring: 'border-amber-400',
    },
    purple: {
      bg: 'bg-purple-50/50 border-purple-200',
      badge: 'bg-purple-100 text-purple-800',
      primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/15',
      secondaryBtn: 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200',
      ring: 'border-purple-400',
    },
  }[accentColor];

  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${colorMap.bg}`} dir="rtl">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <label className="block text-xs sm:text-sm font-black text-slate-800">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {justSavedBadge && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تصویر محفوظ ہو گئی
          </span>
        )}
      </div>

      {/* Error Message */}
      {errorText && (
        <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Main Content Area: Preview + Separate Gallery & Camera Buttons */}
      <div className={`flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} items-center gap-4`}>
        {/* Visual Preview Box */}
        <div className="relative shrink-0 flex items-center gap-3">
          {mode === 'avatar' ? (
            <div className="flex items-center gap-2.5">
              {/* Circular Avatar Preview */}
              <div
                onClick={() => value && setIsPreviewLightboxOpen(true)}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 ${
                  value ? `${colorMap.ring} cursor-pointer` : 'border-dashed border-slate-300'
                } flex items-center justify-center overflow-hidden shadow-md group`}
                title={value ? 'پری ویو دیکھیں' : 'پروفائل تصویر'}
              >
                {value ? (
                  <>
                    <img src={value} alt={label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <User className="w-8 h-8 stroke-[1.5]" />
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">گول فریم</span>
                  </div>
                )}
              </div>

              {/* Rounded Card Avatar Mini Preview */}
              {value && (
                <div
                  onClick={() => setIsPreviewLightboxOpen(true)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm cursor-pointer hidden xs:block"
                  title="کارڈ فریم پری ویو"
                >
                  <img src={value} alt="Card Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => value && setIsPreviewLightboxOpen(true)}
              className={`relative ${
                compact ? 'w-full h-32' : 'w-36 sm:w-44 h-24 sm:h-28'
              } rounded-2xl bg-white border-2 ${
                value ? `${colorMap.ring} cursor-pointer` : 'border-dashed border-slate-300'
              } flex items-center justify-center overflow-hidden shadow-md group`}
              title={value ? 'پری ویو دیکھیں' : label}
            >
              {value ? (
                <>
                  <img src={value} alt={label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-300 p-2 text-center">
                  {mode === 'business' ? (
                    <Briefcase className="w-8 h-8 stroke-[1.5]" />
                  ) : (
                    <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                  )}
                  <span className="text-[10px] font-bold text-slate-400 mt-1">تصویر منتخب کریں</span>
                </div>
              )}
            </div>
          )}

          {/* Delete / Clear Image Button */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setRawSourceImage('');
              }}
              className="absolute -top-2 -right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-transform active:scale-90 z-10"
              title="تصویر ختم کریں"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons Stack */}
        <div className="flex-1 w-full space-y-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleGalleryFileSelect}
            className="hidden"
          />

          {/* Primary Upload & Camera Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border shadow-xs transition-all active:scale-95 ${colorMap.secondaryBtn}`}
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>گیلری سے تصویر منتخب کریں</span>
            </button>

            {/* 2. Camera Capture Button */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${colorMap.primaryBtn}`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>کیمرہ سے تصویر لیں</span>
            </button>
          </div>

          {/* Secondary Row: Adjust Image & Preview Buttons (Shown when image exists) */}
          {value && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenReAdjust}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>تصویر ایڈجسٹ کریں</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewLightboxOpen(true)}
                className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>پری ویو دیکھیں</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed">
            {mode === 'avatar'
              ? 'گیلری یا کیمرہ سے فوٹو لینے کے بعد آپ چہرے کو گول فریم میں زوم اور سیٹ کر سکتے ہیں۔'
              : 'تصویر اپ لوڈ کرنے یا کیمرہ سے کھینچنے کے بعد آپ اسے کراپ، زوم اور ایڈجسٹ کر کے محفوظ کر سکتے ہیں۔'}
          </p>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCaptureDone}
        title={`${label} — کیمرہ سے تصویر لیں`}
        mode={mode}
      />

      {/* Interactive Image Adjust & Crop Modal */}
      <ImageAdjustCropModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        imageSrc={pendingRawImage || value}
        mode={mode}
        title={`${label} — تصویر ایڈجسٹ کریں`}
        onSave={handleSaveAdjusted}
      />

      {/* Full Preview Lightbox Modal */}
      {isPreviewLightboxOpen && value && (
        <div
          className="fixed inset-0 z-[275] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => setIsPreviewLightboxOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>{label} — پری ویو دیکھیں</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsPreviewLightboxOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mode === 'avatar' ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={value}
                    alt="Circular Avatar"
                    className="w-36 h-36 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
                  />
                  <span className="text-xs font-bold text-slate-700">گول پروفائل فوٹو</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={value}
                    alt="Square Card Avatar"
                    className="w-36 h-36 rounded-2xl object-cover border-2 border-slate-200 shadow-lg"
                  />
                  <span className="text-xs font-bold text-slate-700">کارڈ پروفائل فوٹو</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center max-h-80">
                <img src={value} alt={label} className="max-h-80 w-auto object-contain" />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsPreviewLightboxOpen(false);
                  handleOpenReAdjust();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>تصویر ایڈجسٹ کریں</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewLightboxOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
