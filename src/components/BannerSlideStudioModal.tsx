import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Tablet,
  Crop,
  Move,
  ZoomIn,
  RotateCcw,
  Check,
  Trash2,
  MessageCircle,
  Volume2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Sliders,
  Camera,
} from 'lucide-react';
import { VillageNewsEvent, EventCategory, BannerSlideImageDoc } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageAdjustCropModal } from './ImageAdjustCropModal';
import {
  cropAndCompressBannerImage,
  saveBannerSlideImageDoc,
  saveMobileBannerSlideImageDoc,
  getBannerSlideImageDoc,
  getMobileBannerSlideImageDoc,
  deleteBannerSlideImageDoc,
  deleteMobileBannerSlideImageDoc,
} from '../firebase/firestoreService';

interface BannerSlideStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: VillageNewsEvent[];
  initialSelectedId?: string;
  onSaveSlide: (updatedEvent: VillageNewsEvent) => void;
  onBannerImagesChanged?: () => void;
}

export const BannerSlideStudioModal: React.FC<BannerSlideStudioModalProps> = ({
  isOpen,
  onClose,
  events,
  initialSelectedId,
  onSaveSlide,
  onBannerImagesChanged,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('general');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('923270019099');
  const [whatsappLabel, setWhatsappLabel] = useState('واٹس ایپ رابطہ');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isPopupOnLaunch, setIsPopupOnLaunch] = useState(true);

  // Image positioning & crop state
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '21:9' | '4:3' | 'auto'>('16:9');
  const [focalX, setFocalX] = useState<number>(50);
  const [focalY, setFocalY] = useState<number>(50);
  const [mobileFocalX, setMobileFocalX] = useState<number>(50);
  const [mobileFocalY, setMobileFocalY] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(1);
  const [skipBannerImage, setSkipBannerImage] = useState<boolean>(false);

  // Loaded & staged images (Desktop & Mobile)
  const [activeImageSlot, setActiveImageSlot] = useState<'desktop' | 'mobile'>('desktop');
  const [desktopRawSource, setDesktopRawSource] = useState<string | null>(null);
  const [desktopDoc, setDesktopDoc] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    byteSize: number;
  } | null>(null);

  const [mobileRawSource, setMobileRawSource] = useState<string | null>(null);
  const [mobileDoc, setMobileDoc] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    byteSize: number;
  } | null>(null);

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [isBannerCameraOpen, setIsBannerCameraOpen] = useState(false);
  const [isBannerAdjustModalOpen, setIsBannerAdjustModalOpen] = useState(false);
  const [pendingBannerAdjustSrc, setPendingBannerAdjustSrc] = useState<string>('');

  const focalPickerRef = useRef<HTMLDivElement | null>(null);

  // Initialize selected slide
  useEffect(() => {
    if (!isOpen || events.length === 0) return;
    const targetId =
      initialSelectedId && events.some((e) => e.id === initialSelectedId)
        ? initialSelectedId
        : events[0].id;
    setSelectedId(targetId);
  }, [isOpen, initialSelectedId, events.length]);

  // Populate form & load existing desktop/mobile banner docs when selectedId changes
  useEffect(() => {
    if (!isOpen || !selectedId) return;
    const ev = events.find((e) => e.id === selectedId);
    if (!ev) return;

    setTitle(ev.title || '');
    setCategory(ev.category || 'general');
    setContent(ev.content || '');
    setDate(ev.date || '');
    setTime(ev.time || '');
    setLocation(ev.location || '');
    setWhatsappNumber(ev.whatsappNumber || '923270019099');
    setWhatsappLabel(ev.whatsappLabel || 'واٹس ایپ رابطہ');
    setWhatsappMessage(ev.whatsappMessage || '');
    setIsPopupOnLaunch(Boolean(ev.isPopupOnLaunch));
    setImageFit(ev.imageFit || 'cover');
    setAspectRatio(ev.aspectRatio || '16:9');
    setFocalX(typeof ev.focalX === 'number' ? ev.focalX : 50);
    setFocalY(typeof ev.focalY === 'number' ? ev.focalY : 50);
    setMobileFocalX(typeof ev.mobileFocalX === 'number' ? ev.mobileFocalX : 50);
    setMobileFocalY(typeof ev.mobileFocalY === 'number' ? ev.mobileFocalY : 50);
    setZoom(typeof ev.zoom === 'number' ? ev.zoom : 1);
    setSkipBannerImage(Boolean(ev.skipBannerImage));
    setStatusMessage(null);

    let cancelled = false;
    (async () => {
      const dDoc = await getBannerSlideImageDoc(ev.id);
      const mDoc = await getMobileBannerSlideImageDoc(ev.id);
      if (cancelled) return;

      if (dDoc && dDoc.imageData) {
        setDesktopDoc({
          dataUrl: dDoc.imageData,
          width: dDoc.width,
          height: dDoc.height,
          byteSize: dDoc.byteSize,
        });
        setDesktopRawSource(dDoc.imageData);
      } else if (ev.imageUrl) {
        setDesktopDoc({
          dataUrl: ev.imageUrl,
          width: 720,
          height: 360,
          byteSize: 12000,
        });
        setDesktopRawSource(ev.imageUrl);
      } else {
        setDesktopDoc(null);
        setDesktopRawSource(null);
      }

      if (mDoc && mDoc.imageData) {
        setMobileDoc({
          dataUrl: mDoc.imageData,
          width: mDoc.width,
          height: mDoc.height,
          byteSize: mDoc.byteSize,
        });
        setMobileRawSource(mDoc.imageData);
      } else if (ev.mobileImageUrl) {
        setMobileDoc({
          dataUrl: ev.mobileImageUrl,
          width: 480,
          height: 320,
          byteSize: 10000,
        });
        setMobileRawSource(ev.mobileImageUrl);
      } else {
        setMobileDoc(null);
        setMobileRawSource(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedId]);

  if (!isOpen) return null;

  const currentSlideIndex = events.findIndex((e) => e.id === selectedId);
  const currentEvent = events.find((e) => e.id === selectedId);

  const handleFileUpload = async (
    slot: 'desktop' | 'mobile',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);
    setStatusMessage(null);

    try {
      // Read original data URL so admin can re-crop anytime during session
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });

      const processed = await cropAndCompressBannerImage(rawDataUrl, {
        aspectRatio: slot === 'mobile' ? '4:3' : aspectRatio,
        focalX: slot === 'mobile' ? mobileFocalX : focalX,
        focalY: slot === 'mobile' ? mobileFocalY : focalY,
        zoom: 1,
        isMobileVariant: slot === 'mobile',
      });

      if (slot === 'desktop') {
        setDesktopRawSource(rawDataUrl);
        setDesktopDoc({
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          byteSize: processed.byteSize,
        });
        setSkipBannerImage(false);
        setStatusMessage({
          type: 'success',
          text: `ڈیسک ٹاپ بینر تصویر تیار ہے (${processed.width}×${processed.height} px، سائز: ${Math.round(
            processed.byteSize / 1024
          )} KB)۔ نیچے لائیو پری ویو دیکھیں۔`,
        });
      } else {
        setMobileRawSource(rawDataUrl);
        setMobileDoc({
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          byteSize: processed.byteSize,
        });
        setPreviewDevice('mobile');
        setStatusMessage({
          type: 'success',
          text: `موبائل بینر تصویر تیار ہے (${processed.width}×${processed.height} px، سائز: ${Math.round(
            processed.byteSize / 1024
          )} KB)۔`,
        });
      }
    } catch (err) {
      console.error('Banner image process error:', err);
      setStatusMessage({
        type: 'error',
        text: 'تصویر پراسیس کرنے میں مسئلہ پیش آیا۔ براہ کرم دوسری تصویر منتخب کریں۔',
      });
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveInteractiveAdjustedBanner = async (
    adjustedDataUrl: string,
    meta?: { fitMode: 'cover' | 'contain'; aspect: string }
  ) => {
    setIsProcessingImage(true);
    try {
      const processed = await cropAndCompressBannerImage(adjustedDataUrl, {
        aspectRatio: activeImageSlot === 'mobile' ? '4:3' : aspectRatio,
        focalX: 50,
        focalY: 50,
        zoom: 1,
        isMobileVariant: activeImageSlot === 'mobile',
      });

      if (meta?.fitMode) {
        setImageFit(meta.fitMode);
      }

      if (activeImageSlot === 'desktop') {
        if (!desktopRawSource) setDesktopRawSource(adjustedDataUrl);
        setDesktopDoc({
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          byteSize: processed.byteSize,
        });
        setSkipBannerImage(false);
        setStatusMessage({
          type: 'success',
          text: `ڈیسک ٹاپ بینر تصویر ایڈجسٹ اور محفوظ ہو گئی (${processed.width}×${processed.height} px)۔`,
        });
      } else {
        if (!mobileRawSource) setMobileRawSource(adjustedDataUrl);
        setMobileDoc({
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          byteSize: processed.byteSize,
        });
        setPreviewDevice('mobile');
        setStatusMessage({
          type: 'success',
          text: `موبائل بینر تصویر ایڈجسٹ اور محفوظ ہو گئی (${processed.width}×${processed.height} px)۔`,
        });
      }
    } catch (err) {
      console.error('Banner interactive adjust error:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleApplyCropToActiveSlot = async () => {
    const rawSrc = activeImageSlot === 'desktop' ? desktopRawSource : mobileRawSource;
    if (!rawSrc) return;
    setIsProcessingImage(true);
    try {
      const processed = await cropAndCompressBannerImage(rawSrc, {
        aspectRatio,
        focalX: activeImageSlot === 'mobile' ? mobileFocalX : focalX,
        focalY: activeImageSlot === 'mobile' ? mobileFocalY : focalY,
        zoom,
        isMobileVariant: activeImageSlot === 'mobile',
      });

      if (activeImageSlot === 'desktop') {
        setDesktopDoc({
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          byteSize: processed.byteSize,
        });
      } else {
        setMobileDoc({
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          byteSize: processed.byteSize,
        });
      }
      setZoom(1);
      setStatusMessage({
        type: 'success',
        text: `تصویر منتخب تناسب (${aspectRatio}) اور فوکل پوائنٹ کے مطابق بغیر کھینچے کروپ ہو گئی (${processed.width}×${processed.height} px)۔`,
      });
    } catch (err) {
      console.error('Crop error:', err);
      setStatusMessage({
        type: 'error',
        text: 'تصویر کروپ کرنے میں مسئلہ پیش آیا۔',
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFocalPointClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!focalPickerRef.current) return;
    const rect = focalPickerRef.current.getBoundingClientRect();
    const xPct = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    if (activeImageSlot === 'mobile') {
      setMobileFocalX(xPct);
      setMobileFocalY(yPct);
    } else {
      setFocalX(xPct);
      setFocalY(yPct);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    if (!title.trim() || !content.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'براہ کرم سلائیڈ کا عنوان اور تفصیل لازمی لکھیں۔',
      });
      return;
    }

    setIsProcessingImage(true);
    try {
      let hasDesktopUploadedDoc = false;
      let keepDefaultSvgUrl: string | undefined = undefined;

      if (skipBannerImage || !desktopDoc) {
        await deleteBannerSlideImageDoc(currentEvent.id);
      } else if (desktopDoc.dataUrl.startsWith('data:image/jpeg') || desktopDoc.dataUrl.startsWith('data:image/png') || desktopDoc.dataUrl.startsWith('data:image/webp')) {
        const docPayload: BannerSlideImageDoc = {
          eventId: currentEvent.id,
          imageData: desktopDoc.dataUrl,
          width: desktopDoc.width,
          height: desktopDoc.height,
          byteSize: desktopDoc.byteSize,
          imageFit,
          aspectRatio,
          focalX,
          focalY,
          zoom,
          updatedAt: new Date().toISOString(),
        };
        await saveBannerSlideImageDoc(currentEvent.id, docPayload);
        hasDesktopUploadedDoc = true;
      } else {
        // Built-in SVG or static URL
        keepDefaultSvgUrl = desktopDoc.dataUrl;
      }

      let hasMobileUploadedDoc = false;
      if (!skipBannerImage && mobileDoc && mobileDoc.dataUrl.startsWith('data:image/')) {
        await saveMobileBannerSlideImageDoc(currentEvent.id, {
          eventId: `${currentEvent.id}_mobile`,
          imageData: mobileDoc.dataUrl,
          width: mobileDoc.width,
          height: mobileDoc.height,
          byteSize: mobileDoc.byteSize,
          imageFit,
          focalX: mobileFocalX,
          focalY: mobileFocalY,
          isMobileVariant: true,
          updatedAt: new Date().toISOString(),
        });
        hasMobileUploadedDoc = true;
      } else {
        await deleteMobileBannerSlideImageDoc(currentEvent.id);
      }

      const updatedSlide: VillageNewsEvent = {
        ...currentEvent,
        title: title.trim(),
        category,
        content: content.trim(),
        date: date.trim() || 'روزانہ ۲۴ گھنٹے فعال',
        time: time.trim() || 'ہر وقت مفت دستیاب',
        location: location.trim() || 'رتہ کلاں، جھنگ',
        imageUrl: skipBannerImage ? undefined : keepDefaultSvgUrl,
        hasBannerImage: !skipBannerImage && hasDesktopUploadedDoc,
        hasMobileBannerImage: !skipBannerImage && hasMobileUploadedDoc,
        skipBannerImage,
        imageFit,
        aspectRatio,
        focalX,
        focalY,
        mobileFocalX,
        mobileFocalY,
        zoom,
        whatsappNumber: whatsappNumber.trim() || '923270019099',
        whatsappLabel: whatsappLabel.trim() || 'واٹس ایپ رابطہ',
        whatsappMessage: whatsappMessage.trim(),
        isPopupOnLaunch,
        voiceAudioText:
          currentEvent.voiceAudioText ||
          `رتہ کلاں جھنگ خبر: ${title.trim()}۔ ${content.trim()}`,
      };

      onSaveSlide(updatedSlide);
      if (onBannerImagesChanged) onBannerImagesChanged();

      setStatusMessage({
        type: 'success',
        text: `سلائیڈ نمبر ${currentSlideIndex + 1} ("${updatedSlide.title}") کی تصویر، ٹیکسٹ اور سیٹنگز محفوظ ہو گئیں!`,
      });
    } catch (err) {
      console.error('Save banner slide error:', err);
      setStatusMessage({
        type: 'error',
        text: 'سلائیڈ محفوظ کرنے میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔',
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Determine image to show in preview
  const previewImageSrc = skipBannerImage
    ? null
    : previewDevice === 'mobile' && mobileDoc?.dataUrl
    ? mobileDoc.dataUrl
    : desktopDoc?.dataUrl || null;

  const activePreviewFocalX =
    previewDevice === 'mobile' && mobileDoc?.dataUrl ? mobileFocalX : focalX;
  const activePreviewFocalY =
    previewDevice === 'mobile' && mobileDoc?.dataUrl ? mobileFocalY : focalY;

  const activeSlotDoc = activeImageSlot === 'desktop' ? desktopDoc : mobileDoc;
  const activeSlotFocalX = activeImageSlot === 'desktop' ? focalX : mobileFocalX;
  const activeSlotFocalY = activeImageSlot === 'desktop' ? focalY : mobileFocalY;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto font-nastaliq"
    >
      <div className="bg-stone-950 border-2 border-amber-400 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] my-auto text-white">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 px-4 py-3.5 border-b border-amber-500/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300">
                مین بینر سلائیڈز اسٹوڈیو (تصویر کروپ، پوزیشن، ٹیکسٹ اور واٹس ایپ کنٹرول)
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-300">
                تینوں مین سلائیڈز (اور دیگر خبروں) کی ڈیسک ٹاپ و موبائل تصویر، فوکل پوائنٹ، تحریر اور واٹس ایپ بٹن الگ الگ سیٹ کریں
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center cursor-pointer"
            title="بند کریں"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Selector Bar (Highlights Main 3 Slides + Extra Slides) */}
        <div className="bg-stone-900 px-3 sm:px-5 py-2.5 border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-amber-300 shrink-0 ml-1">
            سلائیڈ منتخب کریں:
          </span>
          {events.map((ev, idx) => {
            const isActive = ev.id === selectedId;
            const isMainThree = idx < 3;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedId(ev.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer border ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md'
                    : isMainThree
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700 hover:bg-emerald-900'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded-md bg-black/20 font-sans text-[11px]">
                  {isMainThree ? `مین سلائیڈ ${idx + 1}` : `سلائیڈ ${idx + 1}`}
                </span>
                <span className="max-w-[140px] truncate">{ev.title}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-5">
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/90 border-red-500 text-red-200'
                  : 'bg-amber-950/90 border-amber-500 text-amber-200'
              }`}
            >
              <span>{statusMessage.text}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-stone-400 hover:text-white px-2"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT/RIGHT COLUMN 1: IMAGE UPLOAD, CROP, ASPECT RATIO & FOCAL POINT (7 cols) */}
            <div className="lg:col-span-7 space-y-4 bg-stone-900/90 border border-stone-800 rounded-3xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>
                      ۱۔ سلائیڈ نمبر {currentSlideIndex + 1} کی تصویر، سائز، کروپ اور فوکل پوائنٹ
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    تصویر اپلوڈ کریں، ڈیسک ٹاپ یا موبائل کے لیے الگ تصویر لگائیں، اور تصویر پر کلک کر کے فوکل پوائنٹ سیٹ کریں
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSkipBannerImage((prev) => !prev)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition ${
                    skipBannerImage
                      ? 'bg-amber-400 text-stone-950 border-amber-300'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {skipBannerImage ? '✓ بغیر تصویر (صرف تحریر فعال ہے)' : 'بغیر تصویر (Skip Image)'}
                </button>
              </div>

              {/* Desktop vs Mobile Separate Image Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageSlot('desktop');
                    setPreviewDevice('desktop');
                  }}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                    activeImageSlot === 'desktop'
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span>ڈیسک ٹاپ / مین تصویر</span>
                  {desktopDoc && <span className="w-2 h-2 rounded-full bg-amber-300" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveImageSlot('mobile');
                    setPreviewDevice('mobile');
                  }}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                    activeImageSlot === 'mobile'
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>موبائل کی الگ تصویر (اختیاری)</span>
                  {mobileDoc && <span className="w-2 h-2 rounded-full bg-amber-300" />}
                </button>
              </div>

              {/* Upload, Camera & Interactive Adjust Bar for Active Slot */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-950/80 p-3 rounded-2xl border border-stone-800">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow">
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <span>
                      {activeImageSlot === 'desktop'
                        ? 'گیلری سے تصویر منتخب کریں (ڈیسک ٹاپ)'
                        : 'گیلری سے تصویر منتخب کریں (موبائل)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(activeImageSlot, e)}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsBannerCameraOpen(true)}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>کیمرہ سے تصویر لیں</span>
                  </button>

                  {activeSlotDoc && (
                    <button
                      type="button"
                      onClick={() => {
                        const raw =
                          activeImageSlot === 'desktop'
                            ? desktopRawSource || desktopDoc?.dataUrl
                            : mobileRawSource || mobileDoc?.dataUrl;
                        if (raw) {
                          setPendingBannerAdjustSrc(raw);
                          setIsBannerAdjustModalOpen(true);
                        }
                      }}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Sliders className="w-3.5 h-3.5 shrink-0" />
                      <span>تصویر ایڈجسٹ اور کراپ کریں</span>
                    </button>
                  )}

                  {activeSlotDoc && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeImageSlot === 'desktop') {
                          setDesktopDoc(null);
                          setDesktopRawSource(null);
                        } else {
                          setMobileDoc(null);
                          setMobileRawSource(null);
                        }
                      }}
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ہٹائیں</span>
                    </button>
                  )}
                </div>

                {activeSlotDoc && (
                  <div className="text-[11px] text-emerald-300 font-sans" dir="ltr">
                    {activeSlotDoc.width} × {activeSlotDoc.height} px ({Math.round(activeSlotDoc.byteSize / 1024)} KB)
                  </div>
                )}
              </div>

              {/* Interactive Focal Point & Crop Box */}
              {activeSlotDoc && !skipBannerImage ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-300">
                    <span className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Move className="w-4 h-4" />
                      <span>تصویر پر کسی بھی جگہ کلک کریں تاکہ وہ حصہ درمیان (فوکل پوائنٹ) میں رہے:</span>
                    </span>
                    <span className="font-sans text-[11px] text-emerald-300" dir="ltr">
                      Focal: {activeSlotFocalX}% X, {activeSlotFocalY}% Y
                    </span>
                  </div>

                  {/* Interactive Focal Point Selector Canvas */}
                  <div
                    ref={focalPickerRef}
                    onClick={handleFocalPointClick}
                    className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border-2 border-emerald-500/70 bg-stone-950 cursor-crosshair select-none group"
                    title="فوکل پوائنٹ سیٹ کرنے کے لیے تصویر پر کلک کریں"
                  >
                    {imageFit === 'contain' && (
                      <img
                        src={activeSlotDoc.dataUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                      />
                    )}
                    <img
                      src={activeSlotDoc.dataUrl}
                      alt="Focal Point Picker"
                      className={`relative z-10 w-full h-full transition-all duration-150 pointer-events-none ${
                        imageFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                      style={{
                        objectPosition: `${activeSlotFocalX}% ${activeSlotFocalY}%`,
                        transform: zoom > 1 ? `scale(${zoom})` : undefined,
                        transformOrigin: `${activeSlotFocalX}% ${activeSlotFocalY}%`,
                      }}
                    />

                    {/* Crosshair Marker */}
                    <div
                      className="absolute z-20 w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 border-amber-300 bg-emerald-600/70 shadow-lg flex items-center justify-center pointer-events-none transition-all duration-150"
                      style={{
                        left: `${activeSlotFocalX}%`,
                        top: `${activeSlotFocalY}%`,
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>

                    <div className="absolute bottom-2 right-2 z-20 bg-black/75 text-amber-200 px-2.5 py-1 rounded-lg text-[11px] pointer-events-none">
                      🎯 تصویر پر ٹیپ کر کے فوکس سیٹ کریں
                    </div>
                  </div>

                  {/* Fit Mode, Aspect Ratio & Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
                    {/* Fit Mode */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300 block">
                        تصویر فٹ کرنے کا انداز (Image Fit):
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setImageFit('cover')}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                            imageFit === 'cover'
                              ? 'bg-emerald-700 text-white border-emerald-400'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          پورا بینر بھریں (Cover)
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageFit('contain')}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                            imageFit === 'contain'
                              ? 'bg-emerald-700 text-white border-emerald-400'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          پوری تصویر دکھائیں (Contain)
                        </button>
                      </div>
                    </div>

                    {/* Aspect Ratio Preset */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-300 block">
                        کروپ تناسب (Aspect Ratio):
                      </label>
                      <div className="grid grid-cols-4 gap-1 font-sans text-xs" dir="ltr">
                        {(['16:9', '21:9', '4:3', 'auto'] as const).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={`min-h-[38px] rounded-xl font-bold cursor-pointer border ${
                              aspectRatio === ratio
                                ? 'bg-amber-400 text-stone-950 border-amber-300'
                                : 'bg-stone-900 text-stone-300 border-stone-800'
                            }`}
                          >
                            {ratio === 'auto' ? 'Auto' : ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Horizontal Position Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-stone-300">
                        <span>افقی پوزیشن (بائیں / دائیں):</span>
                        <span className="font-sans text-amber-300">{activeSlotFocalX}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={activeSlotFocalX}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (activeImageSlot === 'mobile') setMobileFocalX(val);
                          else setFocalX(val);
                        }}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Vertical Position Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-stone-300">
                        <span>عمودی پوزیشن (اوپر / نیچے):</span>
                        <span className="font-sans text-amber-300">{activeSlotFocalY}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={activeSlotFocalY}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (activeImageSlot === 'mobile') setMobileFocalY(val);
                          else setFocalY(val);
                        }}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Zoom / Crop Scale Slider */}
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex justify-between text-[11px] text-stone-300">
                        <span className="flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                          <span>زوم / کروپ اسکیل (بغیر کھینچے):</span>
                        </span>
                        <span className="font-sans text-amber-300">{zoom.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={1.8}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Crop & Reset Action Buttons */}
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-800">
                      <button
                        type="button"
                        onClick={handleApplyCropToActiveSlot}
                        disabled={isProcessingImage}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Crop className="w-4 h-4" />
                        <span>منتخب تناسب اور فوکس کے مطابق کروپ کریں</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFocalX(50);
                          setFocalY(50);
                          setMobileFocalX(50);
                          setMobileFocalY(50);
                          setZoom(1);
                          setImageFit('cover');
                        }}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ڈیفالٹ پوزیشن (50% سینٹر)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-stone-950 border border-dashed border-stone-700 rounded-2xl text-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-stone-500 mx-auto" />
                  <p className="text-xs text-stone-300 font-bold">
                    {skipBannerImage
                      ? 'اس سلائیڈ کے لیے "بغیر تصویر" منتخب ہے (رنگین پس منظر پر صاف اردو تحریر نظر آئے گی)۔'
                      : activeImageSlot === 'mobile'
                      ? 'موبائل کے لیے کوئی الگ تصویر اپلوڈ نہیں کی گئی۔ (موبائل پر خودکار طور پر مین بینر تصویر فوکل پوائنٹ کے مطابق نظر آئے گی)۔'
                      : 'اس سلائیڈ کے لیے ابھی کوئی تصویر منتخب نہیں ہے۔ اوپر بٹن دبا کر تصویر اپلوڈ کریں۔'}
                  </p>
                </div>
              )}
            </div>

            {/* LEFT/RIGHT COLUMN 2: SLIDE TEXT & WHATSAPP SETTINGS (5 cols) */}
            <div className="lg:col-span-5 space-y-4 bg-stone-900/90 border border-stone-800 rounded-3xl p-4">
              <h3 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2 border-b border-stone-800 pb-3">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>۲۔ سلائیڈ کی تحریر اور واٹس ایپ بٹن سیٹنگز</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    سلائیڈ کی سرخی (Heading / Title) *:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="سلائیڈ کا عنوان لکھیں..."
                    className="w-full min-h-[42px] px-3.5 py-2 bg-stone-950 border border-stone-700 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    مکمل تفصیل (Description / Content) *:
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="سلائیڈ کی تفصیل لکھیں..."
                    className="w-full p-3 bg-stone-950 border border-stone-700 rounded-xl text-white leading-relaxed focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-stone-300 font-bold mb-1">کیٹیگری:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EventCategory)}
                      className="w-full min-h-[42px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white"
                    >
                      <option value="general">عام رہنمائی / اعلان</option>
                      <option value="medical">طبی و ایمرجنسی</option>
                      <option value="bijli_pani">بجلی و پانی</option>
                      <option value="sports">کھیل و تقریبات</option>
                      <option value="panchayat">پنچایت و مشاورت</option>
                      <option value="janaza">اعلانِ جنازہ</option>
                      <option value="shadi">شادی و خوشی</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-300 font-bold mb-1">تاریخ / دن:</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="مثلاً: روزانہ ۲۴ گھنٹے فعال"
                      className="w-full min-h-[42px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-bold mb-1">وقت:</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="مثلاً: صبح 9 تا شام 5"
                      className="w-full min-h-[42px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-300 font-bold mb-1">مقام (Location):</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="رتہ کلاں، جھنگ"
                      className="w-full min-h-[42px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                {/* WhatsApp Button Settings */}
                <div className="p-3.5 bg-emerald-950/50 border border-emerald-700/70 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <MessageCircle className="w-4 h-4" />
                    <span>واٹس ایپ بٹن کی سیٹنگز (اس سلائیڈ کے لیے):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-stone-300 mb-1">
                        واٹس ایپ نمبر (مع کنٹری کوڈ 92):
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="923270019099"
                        className="w-full min-h-[40px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white font-sans text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-300 mb-1">
                        واٹس ایپ بٹن کا عنوان:
                      </label>
                      <input
                        type="text"
                        value={whatsappLabel}
                        onChange={(e) => setWhatsappLabel(e.target.value)}
                        placeholder="واٹس ایپ رابطہ"
                        className="w-full min-h-[40px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-300 mb-1">
                      واٹس ایپ خودکار پیغام (اختیاری):
                    </label>
                    <input
                      type="text"
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="السلام علیکم، مجھے اس اعلان کے بارے میں معلومات درکار ہیں..."
                      className="w-full min-h-[40px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE MULTI-DEVICE BANNER PREVIEW (Desktop / Tablet / Mobile) */}
          <div className="bg-stone-900 border-2 border-emerald-600/80 rounded-3xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-emerald-300">
                  👁️ لائیو بینر پری ویو (محفوظ کرنے سے پہلے دیکھیں کہ بینر کیسا نظر آئے گا)
                </h3>
                <p className="text-[11px] text-stone-400">
                  ڈیسک ٹاپ، ٹیبلیٹ اور موبائل اسکرین پر تصویر، اردو ٹیکسٹ اور واٹس ایپ بٹن کا مکمل نظارہ
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>ڈیسک ٹاپ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'tablet'
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>ٹیبلیٹ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-amber-400 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>موبائل</span>
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex justify-center bg-stone-950/90 p-3 sm:p-4 rounded-2xl border border-stone-800 overflow-hidden">
              <div
                className={`w-full transition-all duration-300 rounded-2xl overflow-hidden border border-amber-400/60 bg-stone-950/90 shadow-xl ${
                  previewDevice === 'mobile'
                    ? 'max-w-[360px]'
                    : previewDevice === 'tablet'
                    ? 'max-w-[680px]'
                    : 'max-w-full'
                }`}
              >
                <div
                  className={`grid grid-cols-1 ${
                    previewImageSrc && previewDevice !== 'mobile' ? 'md:grid-cols-12' : ''
                  } items-stretch`}
                >
                  {/* Preview Banner Image Frame (Never covered by text) */}
                  {previewImageSrc && (
                    <div
                      className={`${
                        previewDevice !== 'mobile' ? 'md:col-span-5' : ''
                      } relative w-full overflow-hidden bg-stone-950 border-b md:border-b-0 md:border-l border-white/15 ${
                        previewDevice === 'mobile'
                          ? 'h-44'
                          : previewDevice === 'tablet'
                          ? 'h-52 md:h-auto md:min-h-[220px]'
                          : 'h-56 md:h-auto md:min-h-[235px]'
                      }`}
                    >
                      {imageFit === 'contain' && (
                        <img
                          src={previewImageSrc}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                        />
                      )}
                      <img
                        src={previewImageSrc}
                        alt={title}
                        className={`relative z-10 w-full h-full transition-all duration-300 ${
                          imageFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                        style={{
                          objectPosition: `${activePreviewFocalX}% ${activePreviewFocalY}%`,
                          transform: zoom > 1 ? `scale(${zoom})` : undefined,
                          transformOrigin: `${activePreviewFocalX}% ${activePreviewFocalY}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* Preview Slide Text & WhatsApp Controls */}
                  <div
                    className={`${
                      previewImageSrc && previewDevice !== 'mobile' ? 'md:col-span-7' : ''
                    } p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 text-right`}
                  >
                    <div className="space-y-2">
                      <h4 className="font-bold text-[15px] sm:text-lg text-amber-300 leading-[1.8] break-words">
                        {title || 'سلائیڈ کا عنوان'}
                      </h4>
                      <div className="bg-black/45 border border-white/10 rounded-xl p-2.5 space-y-1.5">
                        {(content || 'سلائیڈ کی تفصیل یہاں نظر آئے گی...')
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((line, i) => (
                            <p
                              key={i}
                              className="text-xs sm:text-[13px] text-stone-100 leading-[1.85] break-words"
                            >
                              {line}
                            </p>
                          ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-200">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>{date || 'روزانہ ۲۴ گھنٹے فعال'}</span>
                        </span>
                        {time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span>{time}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>{location || 'رتہ کلاں، جھنگ'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 shrink-0" />
                          <span>سنیں 🔊</span>
                        </span>
                        <span className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-500 text-stone-950 text-xs font-bold flex items-center gap-1 shadow">
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{whatsappLabel || 'واٹس ایپ رابطہ'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Save / Close Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-bold cursor-pointer"
            >
              بند کریں
            </button>

            <button
              type="submit"
              disabled={isProcessingImage}
              className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-sm font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>
                {isProcessingImage
                  ? 'محفوظ ہو رہا ہے...'
                  : `سلائیڈ نمبر ${currentSlideIndex + 1} کی تمام تبدیلیاں محفوظ کریں`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Camera Capture for Main Banner Slide */}
      <CameraCaptureModal
        isOpen={isBannerCameraOpen}
        onClose={() => setIsBannerCameraOpen(false)}
        onCapture={(capturedDataUrl) => {
          if (activeImageSlot === 'desktop') {
            setDesktopRawSource(capturedDataUrl);
          } else {
            setMobileRawSource(capturedDataUrl);
          }
          setPendingBannerAdjustSrc(capturedDataUrl);
          setIsBannerAdjustModalOpen(true);
        }}
        title={`سلائیڈ نمبر ${currentSlideIndex + 1} (${
          activeImageSlot === 'desktop' ? 'ڈیسک ٹاپ' : 'موبائل'
        }) — کیمرہ سے تصویر لیں`}
        mode="banner"
      />

      {/* Interactive Crop, Zoom, Reposition & Rotate Modal for Banner Slide */}
      <ImageAdjustCropModal
        isOpen={isBannerAdjustModalOpen}
        onClose={() => setIsBannerAdjustModalOpen(false)}
        imageSrc={
          pendingBannerAdjustSrc ||
          (activeImageSlot === 'desktop'
            ? desktopRawSource || desktopDoc?.dataUrl || ''
            : mobileRawSource || mobileDoc?.dataUrl || '')
        }
        mode="banner"
        initialAspectRatio={activeImageSlot === 'mobile' ? '4:3' : '16:9'}
        title={`سلائیڈ نمبر ${currentSlideIndex + 1} (${
          activeImageSlot === 'desktop' ? 'ڈیسک ٹاپ' : 'موبائل'
        }) — تصویر ایڈجسٹ اور کراپ کریں`}
        onSave={handleSaveInteractiveAdjustedBanner}
      />
    </div>
  );
};
